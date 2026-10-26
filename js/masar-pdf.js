/*!
 * MasarPDF v1.0  —  محرك تصدير PDF لمنصة «مسار المعلم»
 *
 * الفكرة: كل صفحة (ورقة اختبار / شهادة / بطاقة ...) تُلتقط لوحدها ثم تُضاف كصفحة PDF،
 * وبعدها يُحرَّر الـ canvas من الذاكرة. لذلك العدد الكبير من الصفحات ما يسبب انهيار.
 * الملفات الضخمة جداً تنقسم تلقائياً إلى أجزاء.
 *
 * الاستخدام السريع:
 *   1) ضع على كل صفحة   data-pdf-page    (أو مرّر selector في الخيار pages)
 *   2) MasarPDF.export({ pages: '.exam-paper', filename: 'اختبار الرياضيات', output: 'preview' })
 *      output: 'download' (تنزيل مباشر) | 'preview' (عرض ثم تنزيل) | 'blob' (إرجاع الملفات فقط)
 *   3) للجودة الاتجاهية (نص قابل للتحديد وحجم صغير جداً):
 *      MasarPDF.print({ pages: '.exam-paper', title: 'اختبار' })   // يفتح نافذة الطباعة → حفظ بصيغة PDF
 *
 * ربطه بالدوال الموجودة في المنصة (نفس الأسماء المستعملة في index.html):
 *   MasarPDF.hook('exportCurrentExamToPdf',     { pages: '.exam-paper',  filename: 'الاختبار' });
 *   MasarPDF.hook('executeCertificatesBatchPdf',{ pages: '.cert-sheet',  filename: 'الشهادات' });
 *   (غيّر الـ selectors حسب الكلاسات الفعلية عندك)
 */
(function (global) {
  'use strict';

  var PX_PER_MM = 96 / 25.4;
  var STANDARD_SIZES = {
    A3: [297, 420], A4: [210, 297], A5: [148, 210], Letter: [215.9, 279.4]
  };
  var CDN = {
    html2canvas: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    jspdf: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
  };

  var DEFAULTS = {
    pages: '[data-pdf-page]',   // selector أو عنصر أو قائمة عناصر
    filename: 'document',
    output: 'download',         // 'download' | 'preview' | 'blob'
    scale: 'auto',              // رقم (مثلاً 2) أو 'auto'
    imageType: 'jpeg',          // 'jpeg' (أخف) | 'png' (أوضح للخطوط الدقيقة)
    quality: 0.92,
    background: '#ffffff',
    maxPagesPerFile: 'auto',    // رقم أو 'auto' (تقسيم الملفات الضخمة)
    hideSelector: '.no-print, [data-pdf-hide], .paper-pages-ctrl, .btn-paper-break-ctrl, .paper-q-font-tools',  // عناصر تُخفى داخل الصفحة أثناء الالتقاط
    arabicSafe: true,           // يلغي letter-spacing لأنه يفكك اتصال الحروف العربية في html2canvas
    ui: true,                   // نافذة تقدّم مع زر إلغاء
    signal: null,               // AbortSignal اختياري
    onProgress: null,           // function(done, total)
    onError: function (err) {
      console.error('[MasarPDF]', err);
      try {
        if (typeof global.showToast === 'function') {
          global.showToast('تعذر تصدير PDF: ' + (err.message || String(err)), 'error');
        } else {
          alert(err.message || String(err));
        }
      } catch (e) { /* ignore */ }
    }
  };

  /* ------------------------------ أدوات مساعدة ------------------------------ */

  function isMobile() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function abortError() {
    var e = new Error('تم إلغاء التصدير.');
    e.name = 'AbortError';
    return e;
  }

  function chunk(arr, size) {
    var out = [];
    for (var i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  function sanitizeName(name) {
    var n = String(name || 'document').replace(/\.pdf$/i, '')
      .replace(/[\\\/:*?"<>|\u0000-\u001f]/g, '-').replace(/\s+/g, ' ').trim();
    return n || 'document';
  }

  // يقرّب القياس لأقرب ورقة قياسية (A4/A3/...) لتفادي فروقات صغيرة بين px و mm
  function snapSize(wmm, hmm) {
    var keys = Object.keys(STANDARD_SIZES);
    for (var i = 0; i < keys.length; i++) {
      var s = STANDARD_SIZES[keys[i]];
      if (Math.abs(wmm - s[0]) < 2 && Math.abs(hmm - s[1]) < 2) return [s[0], s[1]];
      if (Math.abs(wmm - s[1]) < 2 && Math.abs(hmm - s[0]) < 2) return [s[1], s[0]];
    }
    return [Math.round(wmm * 10) / 10, Math.round(hmm * 10) / 10];
  }

  function resolvePages(p) {
    var list;
    if (!p) p = DEFAULTS.pages;
    if (typeof p === 'string') {
      list = Array.prototype.slice.call(document.querySelectorAll(p));
      // فحص ذكي في حال لم توجد عناصر بالمحدد الافتراضي
      if (!list.length && p === DEFAULTS.pages) {
        list = Array.prototype.slice.call(document.querySelectorAll('.exam-paper-page, [data-pdf-page], .cert-sheet, .cert-pdf-export-single-page, .seating-a4-paper, .exam-card-paper, #examPaperDoc'));
      }
    }
    else if (p && p.nodeType === 1) {
      // إذا كان العنصر حاوية بها صفحات فرعية، نقوم بتجزئة الصفحات الفرعية تلقائياً
      var sub = Array.prototype.slice.call(p.querySelectorAll('.exam-paper-page, [data-pdf-page], .cert-sheet, .cert-pdf-export-single-page, .seating-a4-paper, .exam-card-paper'));
      list = sub.length > 0 ? sub : [p];
    }
    else list = Array.prototype.slice.call(p || []);
    return list.filter(function (el) { return el && el.nodeType === 1; });
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('تعذّر تحميل المكتبة: ' + src)); };
      document.head.appendChild(s);
    });
  }

  function findH2C() {
    return global.html2canvas || (global.html2pdf && global.html2pdf.html2canvas) || null;
  }

  function findJsPDF() {
    return (global.jspdf && global.jspdf.jsPDF) || global.jsPDF || (global.html2pdf && global.html2pdf.jsPDF) || null;
  }

  async function getLibs() {
    var h2c = findH2C();
    var JsPDF = findJsPDF();
    if (!h2c) { await loadScript(CDN.html2canvas); h2c = findH2C(); }
    if (!JsPDF) { await loadScript(CDN.jspdf); JsPDF = findJsPDF(); }
    if (!h2c || !JsPDF) throw new Error('مكتبات html2canvas / jsPDF غير متوفرة.');
    return { h2c: h2c, JsPDF: JsPDF };
  }

  // ينتظر الخطوط والصور (مهم للعربي ومعادلات KaTeX) قبل الالتقاط
  async function waitForAssets(pages) {
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch (e) { /* ignore */ }
    }
    var waits = [];
    pages.forEach(function (page) {
      Array.prototype.forEach.call(page.querySelectorAll('img'), function (img) {
        if (img.complete && img.naturalWidth > 0) return;
        waits.push(new Promise(function (res) {
          img.addEventListener('load', res, { once: true });
          img.addEventListener('error', res, { once: true });
          setTimeout(res, 8000);
        }));
      });
    });
    await Promise.all(waits);
    await new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(r); }); });
  }

  // دقة الالتقاط: تنخفض تلقائياً مع زيادة عدد الصفحات أو على الموبايل، وتُحدّ بحد أقصى لمساحة الـ canvas
  function pickScale(totalPages, el, opts) {
    var mobile = isMobile();
    var s;
    if (typeof opts.scale === 'number') s = opts.scale;
    else {
      s = totalPages <= 30 ? 2 : (totalPages <= 80 ? 1.6 : 1.3);
      if (mobile) s = Math.min(s, totalPages <= 15 ? 1.8 : 1.3);
    }
    var w = Math.max(el.offsetWidth, 1), h = Math.max(el.offsetHeight, 1);
    var maxArea = mobile ? 10e6 : 28e6;   // iOS Safari حده ~16.7 مليون بكسل
    var maxSide = mobile ? 8000 : 16000;
    if (w * h * s * s > maxArea) s = Math.sqrt(maxArea / (w * h));
    if (Math.max(w, h) * s > maxSide) s = maxSide / Math.max(w, h);
    return Math.max(0.75, s);
  }

  function resolveMaxPerFile(opts) {
    if (typeof opts.maxPagesPerFile === 'number' && opts.maxPagesPerFile > 0) return opts.maxPagesPerFile;
    return isMobile() ? 40 : 100;
  }

  /* --------------------------- تجهيز النسخة الملتقطة --------------------------- */

  function prepareClone(doc, opts) {
    var target = doc.querySelector('[data-mpdf-target]');
    if (!target) return;

    // إلغاء أي تكبير/تصغير للمعاينة (transform / zoom) على الصفحة وآبائها
    var n = target;
    while (n && n.nodeType === 1) {
      n.style.setProperty('transform', 'none', 'important');
      n.style.setProperty('zoom', '1', 'important');
      if (n !== target) {
        n.style.setProperty('overflow', 'visible', 'important');
        n.style.setProperty('max-height', 'none', 'important');
        n.style.setProperty('opacity', '1', 'important');
        n.style.setProperty('filter', 'none', 'important');
      }
      n = n.parentElement;
    }

    if (opts.hideSelector) {
      Array.prototype.forEach.call(target.querySelectorAll(opts.hideSelector), function (e) {
        e.style.setProperty('display', 'none', 'important');
      });
    }

    // تفعيل خاصية CORS للصور داخل الصفحة المستنسخة
    Array.prototype.forEach.call(doc.querySelectorAll('img'), function (img) {
      try { img.crossOrigin = 'anonymous'; } catch (e) {}
    });

    var css =
      '*,*::before,*::after{animation:none!important;transition:none!important;' +
      '-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
      '[data-mpdf-target]{margin:0!important;box-shadow:none!important;}' +
      (opts.arabicSafe ? '[data-mpdf-target],[data-mpdf-target] *{letter-spacing:0!important;}' : '');
    var style = doc.createElement('style');
    style.textContent = css;
    doc.head.appendChild(style);
  }

  async function capturePage(h2c, el, opts, scale) {
    el.setAttribute('data-mpdf-target', '1');
    try {
      return await h2c(el, {
        scale: scale,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: opts.background,
        imageTimeout: 15000,
        removeContainer: true,
        scrollX: 0,
        scrollY: 0,
        // عرض نافذة افتراضي كبير حتى لا تتحول الصفحة لتخطيط الموبايل أثناء الالتقاط
        windowWidth: Math.max(document.documentElement.clientWidth, 1280),
        onclone: function (doc) { prepareClone(doc, opts); }
      });
    } finally {
      el.removeAttribute('data-mpdf-target');
    }
  }

  /* ------------------------------- واجهة التقدّم ------------------------------- */

  function createProgressUI(total, controller) {
    var box = document.createElement('div');
    box.setAttribute('dir', 'rtl');
    box.style.cssText = 'position:fixed;inset:0;z-index:2147483001;background:rgba(15,23,42,.7);backdrop-filter:blur(6px);' +
      'display:flex;align-items:center;justify-content:center;font-family:Cairo,Tajawal,sans-serif;';
    box.innerHTML =
      '<div style="background:#fff;color:#0f172a;border-radius:18px;padding:26px 30px;min-width:320px;' +
      'max-width:92vw;box-shadow:0 25px 60px rgba(0,0,0,.4);text-align:center;border:1.5px solid rgba(37,99,235,0.25);">' +
      '<div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:50%;background:rgba(37,99,235,0.12);color:#2563eb;font-size:1.4rem;margin-bottom:12px;">' +
      '  <i class="fa-solid fa-file-pdf"></i>' +
      '</div>' +
      '<div data-r="msg" style="font-weight:800;font-size:1.1rem;margin-bottom:14px;color:#0f172a;">جاري تجهيز ملف PDF…</div>' +
      '<div style="height:12px;background:#e2e8f0;border-radius:99px;overflow:hidden;box-shadow:inset 0 1px 3px rgba(0,0,0,0.1);">' +
      '<div data-r="bar" style="height:100%;width:0;background:linear-gradient(90deg, #2563eb, #38bdf8);transition:width .2s ease-out;border-radius:99px;"></div></div>' +
      '<div data-r="count" style="margin-top:10px;font-size:.9rem;color:#475569;font-weight:700;">0 / ' + total + '</div>' +
      '<button type="button" data-r="cancel" style="margin-top:16px;padding:8px 20px;border-radius:10px;' +
      'border:1px solid #cbd5e1;background:#f8fafc;cursor:pointer;font-family:inherit;font-weight:700;color:#64748b;transition:all .2s;">إلغاء العملية</button></div>';
    document.body.appendChild(box);
    var q = function (k) { return box.querySelector('[data-r="' + k + '"]'); };
    q('cancel').onclick = function () { controller.abort(); };
    return {
      update: function (done, msg) {
        q('bar').style.width = Math.round(done / total * 100) + '%';
        q('count').textContent = done + ' / ' + total;
        if (msg) q('msg').textContent = msg;
      },
      close: function () { if (box.parentNode) box.parentNode.removeChild(box); }
    };
  }

  /* ---------------------------------- المخرجات ---------------------------------- */

  function downloadBlob(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { if (a.parentNode) a.parentNode.removeChild(a); URL.revokeObjectURL(url); }, 60000);
  }

  function showPreview(results, title) {
    var urls = results.map(function (r) { return URL.createObjectURL(r.blob); });
    var mobile = isMobile();
    var ov = document.createElement('div');
    ov.setAttribute('dir', 'rtl');
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(15,23,42,.95);backdrop-filter:blur(8px);' +
      'display:flex;flex-direction:column;font-family:Cairo,Tajawal,sans-serif;color:#fff;';

    var bar = document.createElement('div');
    bar.style.cssText = 'display:flex;align-items:center;gap:10px;padding:12px 18px;background:rgba(30,41,59,0.9);border-bottom:1px solid rgba(255,255,255,0.1);flex-wrap:wrap;';
    var h = document.createElement('div');
    h.style.cssText = 'font-weight:800;font-size:1.05rem;flex:1;min-width:160px;display:flex;align-items:center;gap:8px;';
    h.innerHTML = '<i class="fa-solid fa-file-pdf" style="color:#38bdf8;"></i> <span>معاينة ملف PDF: ' + title + '</span>';
    bar.appendChild(h);

    var current = 0;
    var select = null;
    if (results.length > 1) {
      select = document.createElement('select');
      select.style.cssText = 'padding:6px 12px;border-radius:8px;background:#334155;color:#fff;border:1px solid #475569;font-family:inherit;font-weight:600;';
      results.forEach(function (r, i) {
        var o = document.createElement('option');
        o.value = i;
        o.textContent = 'جزء ' + (i + 1) + ' (صفحات ' + r.from + '–' + r.to + ')';
        select.appendChild(o);
      });
      bar.appendChild(select);
    }

    function btn(label, icon, onclick, primary) {
      var b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = (icon ? '<i class="' + icon + '" style="margin-left:6px;"></i>' : '') + label;
      b.style.cssText = 'padding:8px 16px;border-radius:9px;border:0;cursor:pointer;font-family:inherit;font-weight:700;display:inline-flex;align-items:center;transition:all .2s;' +
        (primary ? 'background:#2563eb;color:#fff;box-shadow:0 4px 12px rgba(37,99,235,0.4);' : 'background:#334155;color:#f8fafc;');
      b.onclick = onclick;
      return b;
    }

    var body = document.createElement('div');
    body.style.cssText = 'flex:1;min-height:0;display:flex;';
    var frame = null;

    function show(i) {
      current = i;
      if (frame) frame.src = urls[i];
    }

    bar.appendChild(btn('تنزيل الملف', 'fa-solid fa-download', function () {
      if (select) {
        results.forEach(function (r, i) { setTimeout(function () { downloadBlob(r.blob, r.name); }, i * 600); });
      } else {
        downloadBlob(results[current].blob, results[current].name);
      }
    }, true));
    bar.appendChild(btn('فتح في تبويب جديد', 'fa-solid fa-arrow-up-right-from-square', function () { window.open(urls[current], '_blank'); }));
    bar.appendChild(btn('إغلاق', 'fa-solid fa-xmark', close));

    if (mobile) {
      // متصفحات الموبايل ما تعرض PDF داخل iframe بشكل موثوق، فنكتفي بأزرار الفتح والتنزيل
      var msg = document.createElement('div');
      msg.style.cssText = 'margin:auto;text-align:center;padding:24px;line-height:2;max-width:400px;';
      msg.innerHTML = '<div style="font-size:3rem;color:#38bdf8;margin-bottom:12px;"><i class="fa-solid fa-circle-check"></i></div>' +
        '<div style="font-size:1.2rem;font-weight:800;">الملف جاهز للتنزيل!</div>' +
        '<p style="color:#94a3b8;font-size:0.95rem;">استخدم «فتح في تبويب جديد» للمعاينة المباشرة أو زر «تنزيل الملف» للحفظ على هاتفك.</p>';
      body.appendChild(msg);
    } else {
      frame = document.createElement('iframe');
      frame.style.cssText = 'flex:1;border:0;background:#fff;';
      body.appendChild(frame);
      frame.src = urls[0];
    }
    if (select) select.onchange = function () { show(parseInt(select.value, 10)); };

    ov.appendChild(bar);
    ov.appendChild(body);
    document.body.appendChild(ov);

    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    function close() {
      document.removeEventListener('keydown', onKey);
      urls.forEach(function (u) { URL.revokeObjectURL(u); });
      if (ov.parentNode) ov.parentNode.removeChild(ov);
    }
  }

  /* --------------------------------- التصدير الرئيسي --------------------------------- */

  async function exportPdf(userOpts) {
    var opts = Object.assign({}, DEFAULTS, userOpts || {});
    var controller = new AbortController();
    if (opts.signal) {
      if (opts.signal.aborted) controller.abort();
      else opts.signal.addEventListener('abort', function () { controller.abort(); });
    }
    var ui = null;
    var savedX = global.pageXOffset, savedY = global.pageYOffset;

    try {
      var pages = resolvePages(opts.pages);
      if (!pages.length) throw new Error('لم يتم العثور على صفحات للتصدير.');
      var hiddenPage = pages.filter(function (p) { return !p.offsetWidth || !p.offsetHeight; })[0];
      if (hiddenPage) throw new Error('بعض الصفحات غير ظاهرة (قسم مخفي). افتح القسم المطلوب ثم أعد المحاولة.');

      var total = pages.length;
      if (opts.ui) ui = createProgressUI(total, controller);

      var libs = await getLibs();
      if (ui) ui.update(0, 'جاري تحميل الخطوط والصور…');
      await waitForAssets(pages);
      global.scrollTo({ top: 0, left: 0, behavior: 'instant' });

      var maxPerFile = resolveMaxPerFile(opts);
      var groups = chunk(pages, maxPerFile);
      var baseName = sanitizeName(opts.filename);
      var results = [];
      var done = 0;
      var isPng = opts.imageType === 'png';

      for (var gi = 0; gi < groups.length; gi++) {
        var pdf = null;
        var group = groups[gi];

        for (var pi = 0; pi < group.length; pi++) {
          if (controller.signal.aborted) throw abortError();
          var el = group[pi];
          var scale = pickScale(total, el, opts);
          if (ui) ui.update(done, 'جاري معالجة الصفحة ' + (done + 1) + ' من ' + total + '…');

          var canvas = await capturePage(libs.h2c, el, opts, scale);
          // القياس الحقيقي بعد إلغاء التكبير: عرض الـ canvas ÷ الدقة
          var wmm = (canvas.width / scale) / PX_PER_MM;
          var hmm = (canvas.height / scale) / PX_PER_MM;
          var size = snapSize(wmm, hmm);
          var orient = size[0] > size[1] ? 'l' : 'p';

          var dataUrl = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', opts.quality);
          canvas.width = 0; canvas.height = 0;   // تحرير الذاكرة فوراً لمنع الانهيار

          if (!pdf) {
            pdf = new libs.JsPDF({ orientation: orient, unit: 'mm', format: size, compress: true });
          } else {
            pdf.addPage(size, orient);
          }
          pdf.addImage(dataUrl, isPng ? 'PNG' : 'JPEG', 0, 0, size[0], size[1], undefined, 'FAST');
          dataUrl = null;

          done++;
          if (ui) ui.update(done);
          if (typeof opts.onProgress === 'function') opts.onProgress(done, total);
          await tick();   // يعطي المتصفح فرصة لتحديث الواجهة
        }

        var from = gi * maxPerFile + 1;
        var to = from + group.length - 1;
        var name = groups.length > 1 ? baseName + '-جزء' + (gi + 1) + '.pdf' : baseName + '.pdf';
        if (ui) ui.update(done, 'جاري إنهاء الملف…');
        results.push({ blob: pdf.output('blob'), name: name, from: from, to: to });
        pdf = null;
        await tick();
      }

      if (ui) { ui.close(); ui = null; }

      if (opts.output === 'preview') {
        showPreview(results, baseName);
      } else if (opts.output === 'download') {
        for (var i = 0; i < results.length; i++) {
          downloadBlob(results[i].blob, results[i].name);
          if (i < results.length - 1) await sleep(700);   // حتى ما يحجب المتصفح التنزيلات المتتالية
        }
      }
      return results;
    } catch (err) {
      if (ui) ui.close();
      if (err && err.name === 'AbortError') return [];
      if (typeof opts.onError === 'function') opts.onError(err);
      return [];
    } finally {
      if (ui) ui.close();
      global.scrollTo({ top: savedY, left: savedX, behavior: 'instant' });
    }
  }

  /* ------------------------ طباعة اتجاهية (نص حقيقي وحجم صغير) ------------------------ */

  async function printVector(userOpts) {
    var opts = Object.assign({ title: 'document', pageCss: '' }, DEFAULTS, userOpts || {});
    try {
      var pages = resolvePages(opts.pages);
      if (!pages.length) throw new Error('لم يتم العثور على صفحات للطباعة.');

      var iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
      document.body.appendChild(iframe);
      var doc = iframe.contentDocument;
      doc.open();
      doc.write('<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>' +
        sanitizeName(opts.title) + '</title></head><body></body></html>');
      doc.close();

      // نسخ كل الأنماط (روابط CSS و <style>) حتى تظهر الصفحات بنفس تنسيق المنصة
      Array.prototype.forEach.call(document.querySelectorAll('link[rel="stylesheet"], style'), function (n) {
        if (n.id === 'puppeteer-emulate-media-style') return;
        doc.head.appendChild(doc.importNode(n, true));
      });
      if (opts.pageCss) {
        var extra = doc.createElement('style');
        extra.textContent = opts.pageCss;
        doc.head.appendChild(extra);
      }
      pages.forEach(function (p) {
        var c = doc.importNode(p, true);
        c.style.transform = 'none';
        c.style.zoom = '1';
        c.style.pageBreakAfter = 'always';
        c.style.breakAfter = 'page';
        Array.prototype.forEach.call(c.querySelectorAll(opts.hideSelector || '.no-print'), function (e) {
          e.parentNode.removeChild(e);
        });
        doc.body.appendChild(c);
      });

      // انتظار تحميل ملفات CSS والخطوط والصور داخل الـ iframe
      await Promise.all(Array.prototype.map.call(doc.querySelectorAll('link[rel="stylesheet"]'), function (l) {
        return new Promise(function (res) {
          if (l.sheet) return res();
          l.addEventListener('load', res, { once: true });
          l.addEventListener('error', res, { once: true });
          setTimeout(res, 8000);
        });
      }));
      if (doc.fonts && doc.fonts.ready) { try { await doc.fonts.ready; } catch (e) { /* ignore */ } }
      await Promise.all(Array.prototype.map.call(doc.images, function (img) {
        return img.complete ? 0 : new Promise(function (res) {
          img.addEventListener('load', res, { once: true });
          img.addEventListener('error', res, { once: true });
          setTimeout(res, 8000);
        });
      }));

      var cleaned = false;
      function cleanup() {
        if (cleaned) return;
        cleaned = true;
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }
      iframe.contentWindow.addEventListener('afterprint', function () { setTimeout(cleanup, 1000); });
      setTimeout(cleanup, 10 * 60 * 1000);

      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (err) {
      if (typeof opts.onError === 'function') opts.onError(err);
    }
  }

  /* ------------------- دوال متخصصة ومحسنة لمنصة مسار المعلم ------------------- */

  // تصدير ورقة الامتحان الحالية بأمان تام
  async function exportExam(userOpts) {
    var opts = userOpts || {};

    if (typeof global.isUserSubscribedOrAdmin === 'function' && !global.isUserSubscribedOrAdmin()) {
      if (typeof global.requireSubscription === 'function') {
        global.requireSubscription('تصدير ورقة الاختبار بصيغة PDF');
      }
      return [];
    }

    var questionsCount = (global.appState && Array.isArray(global.appState.questions)) ? global.appState.questions.length : 0;
    if (questionsCount === 0) {
      if (typeof global.showToast === 'function') {
        global.showToast('ورقة الاختبار فارغة! يرجى إضافة بعض الأسئلة أولاً قبل حفظ وتنزيل الـ PDF 📄', 'warning');
      }
      return [];
    }

    // ضمان تفعيل وضع ورقة الطالب وإظهار المعاينة
    if (global.appState) global.appState.viewMode = 'student';
    if (global.ExamExporter && typeof global.ExamExporter.ensurePreviewVisible === 'function') {
      try { global.ExamExporter.ensurePreviewVisible(); } catch(e){}
    }
    if (typeof global.renderPaperHeader === 'function') try { global.renderPaperHeader(); } catch(e){}
    if (typeof global.renderPaperQuestions === 'function') try { global.renderPaperQuestions(); } catch(e){}
    if (typeof global.applyPaperSettings === 'function') try { global.applyPaperSettings(); } catch(e){}

    var rawTitle = (global.appState && global.appState.header && global.appState.header.examTitle) || 'امتحان_مسار_المعلم';
    var safeTitle = sanitizeName(rawTitle);
    var filename = opts.filename || opts.path || safeTitle;

    // تحديد صفحات الاختبار
    var pages = opts.pages;
    if (!pages) {
      var subpages = document.querySelectorAll('.exam-paper-page');
      if (subpages && subpages.length > 0) {
        pages = '.exam-paper-page';
      } else {
        pages = '.exam-paper, #examPaperDoc';
      }
    }

    var res = await exportPdf(Object.assign({}, opts, {
      pages: pages,
      filename: filename,
      output: opts.output || 'download'
    }));

    if (res && res.length > 0) {
      if (typeof global.showToast === 'function') {
        global.showToast('تم تصدير وتنزيل ملف «' + filename + '.pdf» بنجاح عبر محرك MasarPDF! 📥📄', 'success');
      }
    }
    return res;
  }

  // طباعة اتجاهية لورقة الاختبار (حفظ كـ PDF نصي حقيقي)
  async function printExam(userOpts) {
    var opts = userOpts || {};
    if (global.appState) global.appState.viewMode = 'student';
    if (global.ExamExporter && typeof global.ExamExporter.ensurePreviewVisible === 'function') {
      try { global.ExamExporter.ensurePreviewVisible(); } catch(e){}
    }
    if (typeof global.renderPaperHeader === 'function') try { global.renderPaperHeader(); } catch(e){}
    if (typeof global.renderPaperQuestions === 'function') try { global.renderPaperQuestions(); } catch(e){}
    if (typeof global.applyPaperSettings === 'function') try { global.applyPaperSettings(); } catch(e){}

    var rawTitle = (global.appState && global.appState.header && global.appState.header.examTitle) || 'امتحان_مسار_المعلم';
    var pages = opts.pages;
    if (!pages) {
      var subpages = document.querySelectorAll('.exam-paper-page');
      pages = (subpages && subpages.length > 0) ? '.exam-paper-page' : '.exam-paper, #examPaperDoc';
    }

    return await printVector(Object.assign({}, opts, {
      pages: pages,
      title: rawTitle
    }));
  }

  /* ----------------------- ربط الدوال القديمة بالمحرك الجديد ----------------------- */

  function hook(globalName, config) {
    if (typeof config === 'function') {
      global[globalName] = config;
      return;
    }
    global[globalName] = function (callOpts) {
      var o = Object.assign({}, config);
      if (callOpts && typeof callOpts.path === 'string') o.filename = callOpts.path;
      else if (callOpts && typeof callOpts.filename === 'string') o.filename = callOpts.filename;
      if (callOpts && callOpts.output) o.output = callOpts.output;
      return exportPdf(o);
    };
  }

  global.MasarPDF = {
    export: exportPdf,
    print: printVector,
    hook: hook,
    exportExam: exportExam,
    printExam: printExam,
    defaults: DEFAULTS,
    _internals: { snapSize: snapSize, chunk: chunk, sanitizeName: sanitizeName }
  };

  // ربط تلقائي بأزرار ودوال المنصة الرئيسية
  hook('exportCurrentExamToPdf', function (opts) {
    return exportExam(opts);
  });
  hook('executeExamPaperPdf', function (opts) {
    return exportExam(opts);
  });

  // تفعيل MasarPDF كمعالج فائق السرعة والأمان لدالة exportToPDF العامة
  var originalExportToPDF = global.exportToPDF;
  global.exportToPDF = async function (target, customOptions) {
    var opts = customOptions || {};
    var el = typeof target === 'string' ? (document.getElementById(target) || document.querySelector(target)) : target;
    if (!el) {
      if (typeof originalExportToPDF === 'function') return originalExportToPDF(target, customOptions);
      throw new Error('لم يتم العثور على العنصر المطلوب تصديره.');
    }

    try {
      var res = await exportPdf({
        pages: el,
        filename: opts.filename || 'مسار-المعلم-تقرير',
        output: opts.output || 'download',
        scale: opts.scale || 'auto'
      });
      return { success: true, pages: res ? res.length : 1, filename: opts.filename };
    } catch (err) {
      console.warn('[MasarPDF] Fallback to original exportToPDF:', err);
      if (typeof originalExportToPDF === 'function') {
        return await originalExportToPDF(target, customOptions);
      }
      throw err;
    }
  };

})(typeof window !== 'undefined' ? window : globalThis);
