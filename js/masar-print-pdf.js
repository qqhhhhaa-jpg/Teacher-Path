/*!
 * masar-print-pdf.js  —  تصدير PDF عربي سليم لمنصة "مسار المعلم"
 *
 * الفكرة: بدل jsPDF/html2canvas (اللي يفكك الحروف العربية)، ننسخ العنصر لـ iframe مخفي
 * بنفس الـCSS والخطوط، وننتظر الخطوط والصور، ثم نطبع. المتصفح يسوي PDF vector حقيقي:
 * العربي مترابط، النص ينحدد وينسخ، وعدد الصفحات مفتوح.
 *
 * الاستخدام:
 *   masarPrintToPDF('#certificate', { title: 'شهادة_أحمد', orientation: 'landscape' });
 *   masarPrintToPDF(document.querySelector('#exam'), { title: 'اختبار', orientation: 'portrait', margin: '12mm' });
 *
 * للمستندات متعددة الصفحات: حط class="pdf-page" على كل صفحة (أو class="pdf-break" لفاصل صفحة يدوي).
 * للعناصر اللي ما تنقطع بنص الصفحة (سؤال، صف جدول): class="pdf-avoid-break".
 */
(function (global) {
  'use strict';

  var PAGE_MM = {
    a3: [297, 420],
    a4: [210, 297],
    a5: [148, 210],
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
    if (typeof document === 'undefined') return html;
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
      '.pdf-root{width:100%;margin:0 auto;}' +
      '.pdf-page, .exam-paper-page, .exam-card-a4-paper, .seating-a4-paper, .cert-sheet-page, .cert-pdf-export-single-page, .voucher-a4-sheet, [data-pdf-page]{break-after:page;page-break-after:always;break-inside:avoid;page-break-inside:avoid;box-shadow:none!important;border:none!important;margin:0 auto!important;}' +
      '.pdf-page:last-child, .exam-paper-page:last-child, .exam-card-a4-paper:last-child, .seating-a4-paper:last-child, .cert-sheet-page:last-child, .cert-pdf-export-single-page:last-child, .voucher-a4-sheet:last-child{break-after:auto;page-break-after:auto;}' +
      '.pdf-break{break-after:page;page-break-after:always;}' +
      '.pdf-avoid-break, .question-card-item, tr, img, figure, .exam-card-item{break-inside:avoid;page-break-inside:avoid;}' +
      'thead{display:table-header-group;}' +
      '.no-print,[data-no-print],[data-pdf-hide],.exam-card-action-bar,.floating-action-btn,.screen-only{display:none!important;}' +
      '*{animation:none!important;transition:none!important;}';
  }

  function resolveElements(target) {
    if (!target) return [];
    if (typeof target === 'string') {
      return Array.prototype.slice.call(document.querySelectorAll(target));
    }
    if (target instanceof NodeList || Array.isArray(target)) {
      return Array.prototype.slice.call(target);
    }
    if (target.nodeType === 1) {
      return [target];
    }
    return [];
  }

  /**
   * @param {string|Element|Array<Element>|NodeList} target  محدد CSS أو عنصر أو مجموعة عناصر
   * @param {Object} [opts]
   * @param {string} [opts.title='document']        اسم الملف المقترح (يظهر باسم الـPDF)
   * @param {'portrait'|'landscape'} [opts.orientation='portrait']
   * @param {'a3'|'a4'|'a5'|'letter'} [opts.pageSize='a4']
   * @param {string|number|Array<number>} [opts.margin='0']  مثال: '12mm' للاختبارات، '0' للشهادة
   * @param {boolean} [opts.fit=false]              يصغّر العنصر تلقائياً إذا أعرض من الصفحة (للشهادة)
   * @returns {Promise<void>}
   */
  function masarPrintToPDF(target, opts) {
    opts = Object.assign({
      title: 'document',
      orientation: 'portrait',
      pageSize: 'a4',
      margin: '0',
      fit: false
    }, opts || {});

    // Aliases
    opts.pageSize = opts.pageSize || opts.format || 'a4';
    opts.title = opts.title || opts.filename || 'document';

    var elements = resolveElements(target);
    if (!elements || elements.length === 0) {
      return Promise.reject(new Error('masarPrintToPDF: العنصر المطلوب تصديره غير موجود في الصفحة'));
    }

    var combinedHTML = elements.map(function (el) { return el.outerHTML; }).join('');

    return fallbackIframePrint(elements, combinedHTML, opts);
  }

  function fallbackIframePrint_unused() {
  }

  function fallbackIframePrint(elements, combinedHTML, opts) {

    var iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText =
      'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;';
    document.body.appendChild(iframe);

    var idoc = iframe.contentDocument || iframe.contentWindow.document;
    var htmlClass = (typeof document !== 'undefined' && document.documentElement.className) || '';
    var bodyClass = (typeof document !== 'undefined' && document.body.className) || '';

    var combinedHTML = elements.map(function (el) { return el.outerHTML; }).join('');

    idoc.open();
    idoc.write(
      '<!DOCTYPE html><html lang="ar" dir="rtl" class="' + htmlClass + '"><head>' +
      '<meta charset="utf-8"><title>' + String(opts.title).replace(/[<>&]/g, '') + '</title>' +
      '<base href="' + (typeof document !== 'undefined' ? document.baseURI : '') + '">' +
      collectHeadStyles() +
      '<style id="pdf-print-css">' + buildPrintCSS(opts) + '</style>' +
      '</head><body class="' + bodyClass + '"><div class="pdf-root">' +
      combinedHTML +
      '</div></body></html>'
    );
    idoc.close();

    function cleanup() {
      setTimeout(function () {
        if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 500);
    }

    return waitForStyles(idoc)
      .then(function () { return Promise.all([waitForFonts(idoc), waitForImages(idoc)]); })
      .then(function () {
        // تصغير تلقائي للشهادة أو الجداول إذا أعرض من الصفحة
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

  // Auto-bind declarative [data-pdf-export]
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
      masarPrintToPDF(targetSelector, {
        title: filename.replace(/\.pdf$/i, ''),
        orientation: orientation,
        pageSize: pageSize,
        margin: margin
      });
    });
  }

  global.masarPrintToPDF = masarPrintToPDF;
  global.exportToPDF = masarPrintToPDF;
  global.downloadPDF = masarPrintToPDF;
  global.TeacherPathPDF = {
    exportToPDF: masarPrintToPDF,
    masarPrintToPDF: masarPrintToPDF,
    downloadPDF: masarPrintToPDF
  };
})(typeof window !== 'undefined' ? window : this);
