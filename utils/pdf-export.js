/*!
 * utils/pdf-export.js — تصدير PDF عربي سليم لمنصة "مسار المعلم"
 *
 * الفكرة: بدل jsPDF/html2canvas (اللي يفكك الحروف العربية)، ننسخ العنصر لـ iframe مخفي
 * بنفس الـCSS والخطوط، وننتظر الخطوط والصور، ثم نطبع. المتصفح يسوي PDF vector حقيقي:
 * العربي مترابط، النص ينحدد وينسخ، وعدد الصفحات مفتوح.
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    var exports = factory();
    root.exportToPDF = exports.exportToPDF;
    root.downloadPDF = exports.downloadPDF;
    root.initializePDFExport = exports.initializePDFExport;
    root.TeacherPathPDF = exports;
  }
})(typeof window !== 'undefined' ? window : this, function () {
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
        img.addEventListener('error', res, { once: true });
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

  function exportToPDF(target, opts) {
    opts = Object.assign({
      title: 'document',
      orientation: 'portrait',
      pageSize: 'a4',
      margin: '0',
      fit: false
    }, opts || {});

    opts.pageSize = opts.pageSize || opts.format || 'a4';
    opts.title = opts.title || opts.filename || 'document';

    var elements = resolveElements(target);
    if (!elements || elements.length === 0) {
      return Promise.reject(new Error('exportToPDF: العنصر المطلوب تصديره غير موجود في الصفحة'));
    }

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
        if (opts.fit) {
          var ps = String(opts.pageSize || opts.format || 'a4').toLowerCase();
          var size = PAGE_MM[ps] || PAGE_MM.a4;
          var pageW = (opts.orientation === 'landscape' ? size[1] : size[0]) * MM_TO_PX;
          var root = idoc.querySelector('.pdf-root');
          var inner = root.firstElementChild;
          var wNow = inner ? inner.scrollWidth : root.scrollWidth;
          if (wNow > pageW) root.style.zoom = String(pageW / wNow);
        }
        return new Promise(function (res) {
          iframe.contentWindow.requestAnimationFrame(function () { setTimeout(res, 150); });
        });
      })
      .then(function () {
        var win = iframe.contentWindow;
        win.addEventListener('afterprint', cleanup, { once: true });
        win.focus();
        win.print();
        setTimeout(cleanup, 120000);
      })
      .catch(function (err) {
        cleanup();
        throw err;
      });
  }

  function initializePDFExport() {
    return true;
  }

  return {
    exportToPDF: exportToPDF,
    masarPrintToPDF: exportToPDF,
    masarPrintPDF: exportToPDF,
    downloadPDF: exportToPDF,
    initializePDFExport: initializePDFExport
  };
});
