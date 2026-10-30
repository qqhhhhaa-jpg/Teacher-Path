/*!
 * pdf-export.js  —  تصدير PDF عربي سليم لمنصة "مسار المعلم"
 *
 * الفكرة: بدل jsPDF/html2canvas (اللي يفكك الحروف العربية)، ننسخ العنصر لـ iframe مخفي
 * بنفس الـCSS والخطوط، وننتظر الخطوط والصور، ثم نطبع. المتصفح يسوي PDF vector حقيقي:
 * العربي منربط، النص ينحدد وينسخ، وعدد الصفحات مفتوح.
 *
 * الاستخدام:
 *   exportToPDF('#certificate', { title: 'شهادة_أحمد', orientation: 'landscape' });
 *   exportToPDF(document.querySelector('#exam'), { title: 'اختبار', orientation: 'portrait', margin: '12mm' });
 *
 * للمستندات متعددة الصفحات: حط class="pdf-page" على كل صفحة (أو class="pdf-break" لفاصل صفحة يدوي).
 * للعناصر اللي ما تنقطع بنص الصفحة (سؤال، صف جدول): class="pdf-avoid-break".
 */
(function (global) {
  'use strict';

  var PAGE_MM = {
    a4: [210, 297],
    a5: [148, 210],
    a3: [297, 420],
    letter: [216, 279]
  };
  var MM_TO_PX = 96 / 25.4;

  function waitForImages(doc) {
    var imgs = Array.prototype.slice.call(doc.images || []);
    return Promise.all(imgs.map(function (img) {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise(function (res) {
        img.addEventListener('load', res, { once: true });
        img.addEventListener('error', res, { once: true }); // لا توقف التصدير لو صورة فشلت
        setTimeout(res, 8000);
      });
    }));
  }

  function waitForFonts(doc) {
    if (doc.fonts && doc.fonts.ready) {
      return Promise.race([
        doc.fonts.ready,
        new Promise(function (res) { setTimeout(res, 8000); })
      ]);
    }
    return Promise.resolve();
  }

  function waitForStyles(doc) {
    var links = Array.prototype.slice.call(doc.querySelectorAll('link[rel="stylesheet"]'));
    return Promise.all(links.map(function (l) {
      return new Promise(function (res) {
        if (l.sheet) return res();
        l.addEventListener('load', res, { once: true });
        l.addEventListener('error', res, { once: true });
        setTimeout(res, 8000);
      });
    }));
  }

  function collectHeadStyles() {
    // ننسخ كل الـ<link rel=stylesheet> و<style> حتى تبقى الخطوط والتصميم نفسه
    var html = '';
    document.querySelectorAll('link[rel="stylesheet"], style').forEach(function (n) {
      if (n.id === 'puppeteer-emulate-media-style') return;
      html += n.outerHTML;
    });
    return html;
  }

  function buildPrintCSS(o) {
    var ps = String(o.pageSize || o.format || 'a4').toLowerCase();
    var size = PAGE_MM[ps] || PAGE_MM.a4;
    var w = o.orientation === 'landscape' ? size[1] : size[0];
    var h = o.orientation === 'landscape' ? size[0] : size[1];
    var marginVal = o.margin;
    if (typeof marginVal === 'number') {
      marginVal = marginVal + 'mm';
    } else if (Array.isArray(marginVal)) {
      marginVal = marginVal.map(function (m) { return typeof m === 'number' ? m + 'mm' : m; }).join(' ');
    } else if (!marginVal) {
      marginVal = '0';
    }
    return '' +
      '@page{size:' + w + 'mm ' + h + 'mm;margin:' + marginVal + ';}' +
      'html,body{margin:0!important;padding:0!important;background:#fff!important;' +
        'direction:rtl;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
      '*{-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
      /* مهم: letter-spacing يكسر ربط الحروف العربية */
      '*{letter-spacing:0!important;font-variant-ligatures:normal;text-rendering:optimizeLegibility;}' +
      '.pdf-root{width:100%;}' +
      '.pdf-page, .exam-paper-page, .exam-card-a4-paper, .seating-a4-paper, .cert-sheet-page, .cert-pdf-export-single-page, .voucher-a4-sheet, [data-pdf-page]{break-after:page;page-break-after:always;break-inside:avoid;page-break-inside:avoid;}' +
      '.pdf-page:last-child, .exam-paper-page:last-child, .exam-card-a4-paper:last-child, .seating-a4-paper:last-child, .cert-sheet-page:last-child, .cert-pdf-export-single-page:last-child, .voucher-a4-sheet:last-child{break-after:auto;page-break-after:auto;}' +
      '.pdf-break{break-after:page;page-break-after:always;}' +
      '.pdf-avoid-break, .question-card-item, tr, img, figure, .exam-card-item{break-inside:avoid;page-break-inside:avoid;}' +
      'thead{display:table-header-group;}' +
      '.no-print,[data-no-print]{display:none!important;}' +
      '*{animation:none!important;transition:none!important;}';
  }

  /**
   * @param {string|Element|Element[]|NodeList} target  محدد CSS أو عنصر أو مصفوفة عناصر
   * @param {Object} [opts]
   * @param {string} [opts.title='document']        اسم الملف المقترح (يظهر باسم الـPDF)
   * @param {'portrait'|'landscape'} [opts.orientation='portrait']
   * @param {'a4'|'a5'|'a3'|'letter'} [opts.pageSize='a4']
   * @param {string} [opts.margin='0']              مثال: '12mm' للاختبارات، '0' للشهادة
   * @param {boolean} [opts.fit=false]              يصغّر العنصر تلقائياً إذا أعرض من الصفحة (للشهادة)
   * @returns {Promise<void>}
   */
  function exportToPDF(target, opts) {
    opts = Object.assign({
      title: 'document',
      orientation: 'portrait',
      pageSize: 'a4',
      margin: '0',
      fit: false
    }, opts || {});

    // Support option aliases
    if (opts.format && !opts.pageSize) opts.pageSize = opts.format;
    if (opts.filename && (!opts.title || opts.title === 'document')) {
      opts.title = opts.filename.replace(/\.pdf$/i, '');
    }

    // Resolve target elements
    var elementsHtml = '';
    if (typeof target === 'string') {
      var found = document.querySelectorAll(target);
      if (!found || found.length === 0) {
        // try ID without #
        var byId = document.getElementById(target.replace(/^#/, ''));
        if (byId) found = [byId];
      }
      if (!found || found.length === 0) {
        return Promise.reject(new Error('exportToPDF: العنصر غير موجود: ' + target));
      }
      elementsHtml = Array.prototype.map.call(found, function (node) { return node.outerHTML; }).join('\n');
    } else if (target && typeof target.length === 'number' && !(target instanceof HTMLElement)) {
      // Array or NodeList
      elementsHtml = Array.prototype.map.call(target, function (node) { return node.outerHTML; }).join('\n');
    } else if (target instanceof HTMLElement) {
      elementsHtml = target.outerHTML;
    } else {
      return Promise.reject(new Error('exportToPDF: عنصر غير صالح'));
    }

    var iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText =
      'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;';
    document.body.appendChild(iframe);

    var idoc = iframe.contentDocument || iframe.contentWindow.document;
    var htmlClass = document.documentElement.className;
    var bodyClass = document.body.className;

    idoc.open();
    idoc.write(
      '<!DOCTYPE html><html lang="ar" dir="rtl" class="' + htmlClass + '"><head>' +
      '<meta charset="utf-8"><title>' + String(opts.title).replace(/[<>&]/g, '') + '</title>' +
      '<base href="' + document.baseURI + '">' +
      collectHeadStyles() +
      '<style id="pdf-print-css">' + buildPrintCSS(opts) + '</style>' +
      '</head><body class="' + bodyClass + '"><div class="pdf-root">' +
      elementsHtml +
      '</div></body></html>'
    );
    idoc.close();

    function cleanup() {
      setTimeout(function () {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 500);
    }

    return waitForStyles(idoc)
      .then(function () { return Promise.all([waitForFonts(idoc), waitForImages(idoc)]); })
      .then(function () {
        // تصغير تلقائي للشهادة إذا أعرض من الصفحة
        if (opts.fit) {
          var ps = String(opts.pageSize || opts.format || 'a4').toLowerCase();
          var size = PAGE_MM[ps] || PAGE_MM.a4;
          var pageW = (opts.orientation === 'landscape' ? size[1] : size[0]) * MM_TO_PX;
          var root = idoc.querySelector('.pdf-root');
          var inner = root.firstElementChild;
          var wNow = inner ? inner.scrollWidth : root.scrollWidth;
          if (wNow > pageW) root.style.zoom = String(pageW / wNow);
        }
        // فرصة أخيرة للـlayout قبل الطباعة
        return new Promise(function (res) {
          iframe.contentWindow.requestAnimationFrame(function () { setTimeout(res, 150); });
        });
      })
      .then(function () {
        var win = iframe.contentWindow;
        win.addEventListener('afterprint', cleanup, { once: true });
        win.focus();
        win.print();
        // احتياط إذا afterprint ما اشتغل
        setTimeout(cleanup, 120000);
      })
      .catch(function (err) {
        cleanup();
        throw err;
      });
  }

  // Auto-bind any button with [data-pdf-export]
  if (typeof document !== 'undefined') {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-pdf-export]') : null;
      if (!btn) return;
      e.preventDefault();
      var targetSelector = btn.getAttribute('data-pdf-export');
      var filename = btn.getAttribute('data-pdf-filename') || 'document.pdf';
      var orientation = btn.getAttribute('data-pdf-orientation') || 'portrait';
      var pageSize = btn.getAttribute('data-pdf-size') || btn.getAttribute('data-pdf-format') || 'a4';
      var margin = btn.getAttribute('data-pdf-margin') || '8mm';
      exportToPDF(targetSelector, {
        title: filename.replace(/\.pdf$/i, ''),
        orientation: orientation,
        pageSize: pageSize,
        margin: margin
      });
    });
  }

  global.exportToPDF = exportToPDF;
  global.masarPrintToPDF = exportToPDF;
  global.masarPrintPDF = exportToPDF;
  global.downloadPDF = exportToPDF;
  global.TeacherPathPDF = {
    exportToPDF: exportToPDF,
    masarPrintToPDF: exportToPDF,
    masarPrintPDF: exportToPDF,
    downloadPDF: exportToPDF
  };
})(window);
