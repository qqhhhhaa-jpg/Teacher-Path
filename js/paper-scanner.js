/**
 * ============================================================================
 * منصة المعلم — قارئ الورقة الذكي (تحويل الأسئلة المكتوبة بخط اليد إلى امتحان رسمي)
 * Smart Handwritten Paper Scanner & Iraqi Ministerial Question Parser
 * مصمم خصيصاً لسهولة الاستخدام القصوى للأساتذة عبر الموبايل أو الحاسوب بنقرة واحدة
 * ============================================================================
 */
(function () {
  'use strict';

  let currentUploadedImages = []; // Array of { dataUrl, enhancedDataUrl, name, mimeType }
  let currentParsedQuestions = [];
  let isUsingEnhancedImage = false;
  let isScanningPaper = false;
  let speechRecognitionInstance = null;
  let isRecordingVoice = false;
  let cameraStream = null;

  const QUESTION_TYPE_LABELS = {
    essay: 'سؤال مقالي / عام',
    definitions: 'تعاريف ومصطلحات',
    reasoning: 'علل واذكر السبب',
    fill_blanks: 'أكمل الفراغات',
    true_false: 'صح أو خطأ',
    mcq: 'اختيار من متعدد',
    comparisons: 'مقارنة وأوجه اختلاف',
    matching: 'صل بين العمودين',
    math_problem: 'مسألة رياضية / علمية'
  };

  const ARABIC_ORDINALS = [
    'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس',
    'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر'
  ];

  function notify(msg, type = 'info') {
    if (typeof window.showToast === 'function') {
      window.showToast(msg, type);
    } else {
      alert(msg);
    }
  }

  function getActiveSubjectMode() {
    const activeBtn = document.querySelector('#sideSubjectSwitcher .side-sub-btn.active');
    if (activeBtn && activeBtn.dataset.subMode) {
      return activeBtn.dataset.subMode;
    }
    return (window.appState && window.appState.currentSubjectFilter && window.appState.currentSubjectFilter !== 'all')
      ? window.appState.currentSubjectFilter
      : 'arabic';
  }

  function getStoredGeminiConfig() {
    try {
      const raw = localStorage.getItem('masar_gcloud_gateway_config_v1');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {};
  }

  function saveGeminiKeyQuick(apiKey) {
    try {
      const cfg = getStoredGeminiConfig();
      cfg.apiKey = apiKey.trim();
      localStorage.setItem('masar_gcloud_gateway_config_v1', JSON.stringify(cfg));
      const gwInput = document.getElementById('gcApiKeyInput');
      if (gwInput) gwInput.value = cfg.apiKey;
    } catch (e) {}
  }

  // ==========================================================================
  // 1. حقن أزرار قارئ الورقة الذكي في قسم إنشاء وبناء الأسئلة + البطاقة الرئيسية
  // ==========================================================================
  function initHandwrittenPaperScannerUI() {
    injectScannerButtonsInQuestionBuilder();
    injectScannerModal();
  }

  function injectScannerButtonsInQuestionBuilder() {
    // 1. زر بارز في شريط إضافة الأسئلة العلوي (.qbuilder-add-strip-row)
    const addStripRow = document.querySelector('#tab-questions .qbuilder-add-strip-row');
    if (addStripRow && !document.getElementById('btnOpenPaperScannerTop')) {
      const scannerBtn = document.createElement('button');
      scannerBtn.type = 'button';
      scannerBtn.id = 'btnOpenPaperScannerTop';
      scannerBtn.className = 'btn-paper-scanner-hero';
      scannerBtn.title = 'صوّر ورقة الأسئلة المكتوبة بخط اليد بالموبايل أو ارفعها من جهازك ليتم تحويلها إلى أسئلة مطبوعة تلقائياً';
      scannerBtn.onclick = function () {
        window.openHandwrittenPaperScanner();
      };
      scannerBtn.innerHTML = `
        <span class="scanner-btn-icon-wrap">
          <i class="fa-solid fa-camera-retro"></i>
        </span>
        <span class="scanner-btn-text-wrap">
          <strong>قراءة ورقة مكتوبة (بخط اليد)</strong>
          <small>صوّر بالموبايل أو ارفع صورة الورقة</small>
        </span>
        <span class="scanner-btn-badge">ذكي ⚡</span>
      `;

      const customDropdown = document.getElementById('qbuilderCustomDropdown');
      if (customDropdown && customDropdown.nextSibling) {
        addStripRow.insertBefore(scannerBtn, customDropdown.nextSibling);
      } else {
        addStripRow.appendChild(scannerBtn);
      }
    }

    // 2. زر إضافي واضح داخل صندوق "أسئلة الاختبار الحالية" بجانب تصفير الورقة
    const resetBtn = document.getElementById('resetExamSheetBtn');
    if (resetBtn && resetBtn.parentNode && !document.getElementById('btnOpenPaperScannerCard')) {
      const cardBtn = document.createElement('button');
      cardBtn.type = 'button';
      cardBtn.id = 'btnOpenPaperScannerCard';
      cardBtn.className = 'btn btn-paper-scanner-inline';
      cardBtn.onclick = function () {
        window.openHandwrittenPaperScanner();
      };
      cardBtn.innerHTML = `
        <i class="fa-solid fa-camera"></i>
        <span>تحويل ورقة بخط اليد إلى أسئلة</span>
      `;
      resetBtn.parentNode.insertBefore(cardBtn, resetBtn);
    }
  }

  // ==========================================================================
  // 2. نافذة قارئ الورقة الذكي (مصممة بأزرار كبيرة وواضحة جداً للمدرس)
  // ==========================================================================
  function injectScannerModal() {
    if (document.getElementById('handwrittenPaperScannerModal')) return;

    const modal = document.createElement('div');
    modal.id = 'handwrittenPaperScannerModal';
    modal.className = 'modal-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-label', 'قارئ الورقة الذكي لتحويل خط اليد إلى أسئلة');

    const storedCfg = getStoredGeminiConfig();
    const hasKey = Boolean(storedCfg.apiKey && storedCfg.apiKey.trim());

    modal.innerHTML = `
      <div class="modal-container paper-scanner-modal-container">
        <!-- ترويسة النافذة -->
        <div class="modal-header paper-scanner-modal-header">
          <div class="modal-title" style="display: flex; align-items: center; gap: 0.85rem;">
            <div class="paper-scanner-header-icon">
              <i class="fa-solid fa-camera-retro"></i>
            </div>
            <div>
              <h3 style="margin: 0; font-size: 1.2rem; font-weight: 900; color: #ffffff;">
                قارئ الورقة الذكي — تحويل خط اليد إلى أسئلة امتحانية
              </h3>
              <p style="margin: 3px 0 0 0; font-size: 0.82rem; color: rgba(255, 255, 255, 0.9); font-weight: 600;">
                اكتب الأسئلة على أي ورقة بخط يدك، ثم صوّرها بتليفونك أو ارفعها هنا ليتم تحويلها وتنسيقها تلقائياً!
              </p>
            </div>
          </div>
          <button type="button" class="modal-close" onclick="window.closeHandwrittenPaperScanner()" title="إغلاق" style="color: #fff; background: rgba(255,255,255,0.18);">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- جسم النافذة -->
        <div class="modal-body paper-scanner-modal-body">

          <!-- شريط الخطوات الثلاث المبسطة للمعلم -->
          <div class="scanner-steps-strip">
            <div class="scanner-step-pill active" id="scannerStep1Indicator">
              <span class="step-num">1</span>
              <span>صوّر الورقة أو ارفع صورتها</span>
            </div>
            <i class="fa-solid fa-arrow-left step-arrow"></i>
            <div class="scanner-step-pill" id="scannerStep2Indicator">
              <span class="step-num">2</span>
              <span>قراءة الأسئلة وتقسيم الفروع والدرجات</span>
            </div>
            <i class="fa-solid fa-arrow-left step-arrow"></i>
            <div class="scanner-step-pill" id="scannerStep3Indicator">
              <span class="step-num">3</span>
              <span>اعتمادها في ورقة الامتحان A4</span>
            </div>
          </div>

          <!-- مدخلات الملفات المخفية (للكاميرا وللاستوديو) -->
          <input type="file" id="scannerCameraFileInput" accept="image/*" capture="environment" style="display: none;">
          <input type="file" id="scannerGalleryFileInput" accept="image/*" multiple style="display: none;">

          <!-- الأزرار الثلاثة العملاقة والواضحة جداً للمعلم -->
          <div class="scanner-giant-actions-grid">

            <!-- الخيار 1: فتح الكاميرا وتصوير الورقة -->
            <button type="button" class="scanner-giant-card card-camera" onclick="window.triggerPaperCameraCapture()">
              <div class="giant-card-icon">
                <i class="fa-solid fa-camera"></i>
              </div>
              <div class="giant-card-info">
                <h4>📸 صوّر الورقة بالكاميرا الآن</h4>
                <p>افتح كاميرا التليفون أو الحاسبة والتقط صورة لورقة الأسئلة المكتوبة بخط يدك</p>
              </div>
              <span class="giant-card-cta">فتح الكاميرا <i class="fa-solid fa-chevron-left"></i></span>
            </button>

            <!-- الخيار 2: رفع صورة من الجهاز / الموبايل -->
            <button type="button" class="scanner-giant-card card-upload" onclick="document.getElementById('scannerGalleryFileInput').click()">
              <div class="giant-card-icon">
                <i class="fa-solid fa-file-image"></i>
              </div>
              <div class="giant-card-info">
                <h4>🖼️ ارفع صورة الورقة من جهازك</h4>
                <p>اختر صورة الورقة من استوديو التليفون أو من الحاسبة (يدعم صفحة أو عدة صفحات)</p>
              </div>
              <span class="giant-card-cta">اختيار صورة <i class="fa-solid fa-upload"></i></span>
            </button>

            <!-- الخيار 3: الإملاء الصوتي أو تجربة ورقة جاهزة -->
            <div class="scanner-giant-card card-voice-demo">
              <div class="giant-card-icon">
                <i class="fa-solid fa-microphone-lines"></i>
              </div>
              <div class="giant-card-info">
                <h4>🎙️ قراءة صوتية أو تجربة سريعة</h4>
                <p>اقرأ الأسئلة بصوتك مباشرة، أو جرّب قراءة ورقة امتحانية مكتوبة بخط اليد بنقرة واحدة</p>
              </div>
              <div style="display: flex; gap: 0.45rem; width: 100%; margin-top: 0.25rem;">
                <button type="button" class="btn-scanner-sub-action btn-voice" id="btnScannerVoiceDictate" onclick="window.toggleScannerVoiceDictation()">
                  <i class="fa-solid fa-microphone"></i>
                  <span>إملاء بالصوت</span>
                </button>
                <button type="button" class="btn-scanner-sub-action btn-demo" onclick="window.loadSampleHandwrittenPaper()">
                  <i class="fa-solid fa-wand-magic-sparkles"></i>
                  <span>تجربة ورقة مكتوبة</span>
                </button>
              </div>
            </div>

          </div>

          <!-- نافذة الكاميرا الحية (تظهر عند التصوير من اللابتوب) -->
          <div id="scannerLiveCameraBox" class="scanner-live-camera-box" style="display: none;">
            <div class="live-camera-header">
              <span><i class="fa-solid fa-video text-danger"></i> وجّه الورقة المكتوبة أمام الكاميرا ثم اضغط «التقاط الصورة»</span>
              <button type="button" class="btn btn-outline" onclick="window.stopLiveCameraStream()" style="padding: 4px 10px; font-size: 0.78rem;">
                <i class="fa-solid fa-xmark"></i> إغلاق الكاميرا
              </button>
            </div>
            <div class="live-camera-video-wrap">
              <video id="scannerLiveVideo" autoplay playsinline></video>
            </div>
            <div class="live-camera-actions">
              <button type="button" class="btn btn-primary" onclick="window.captureFrameFromLiveCamera()" style="padding: 0.6rem 1.8rem; font-size: 0.95rem;">
                <i class="fa-solid fa-camera"></i> التقاط صورة الورقة الآن
              </button>
            </div>
          </div>

          <!-- شريط حالة التقدم والقراءة الذكية -->
          <div id="scannerProgressBanner" class="scanner-progress-banner" style="display: none;">
            <div class="scanner-progress-row">
              <div style="display: flex; align-items: center; gap: 0.65rem;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.25rem; color: #2563eb;"></i>
                <strong id="scannerProgressStatusText" style="font-size: 0.92rem;">جاري قراءة الورقة وتحليل الأسئلة المكتوبة...</strong>
              </div>
              <span id="scannerProgressPercent" style="font-weight: 900; color: #2563eb;">0%</span>
            </div>
            <div class="scanner-progress-bar-track">
              <div id="scannerProgressBarFill" class="scanner-progress-bar-fill" style="width: 15%;"></div>
            </div>
          </div>

          <!-- شريط إعداد الذكاء الاصطناعي الاختياري للدقة الفائقة في خط اليد -->
          <div class="scanner-ai-config-strip">
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <i class="fa-solid fa-robot" style="color: #7c3aed; font-size: 1rem;"></i>
              <span style="font-size: 0.8rem; font-weight: 800; color: var(--text-main);">محرك القراءة:</span>
              <span id="scannerEngineModeBadge" class="badge-tag" style="background: ${hasKey ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)'}; color: ${hasKey ? '#059669' : '#2563eb'}; font-weight: 800;">
                ${hasKey ? 'Google Gemini Vision AI (دقة فائقة لخط اليد 🟢)' : 'القارئ الضوئي المدمج مجاناً + المحلل الذكي ⚡'}
              </span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap;">
              <input type="password" id="scannerQuickApiKeyInput" class="form-control"
                placeholder="مفتاح Gemini API (اختياري لدقة خط اليد الصعب)"
                value="${storedCfg.apiKey || ''}"
                style="width: 240px; height: 32px; font-size: 0.76rem; padding: 2px 10px;">
              <button type="button" class="btn btn-outline" onclick="window.saveScannerQuickApiKey()" style="height: 32px; padding: 0 10px; font-size: 0.75rem;">
                <i class="fa-solid fa-key"></i> حفظ المفتاح
              </button>
            </div>
          </div>

          <!-- منطقة العمل المزدوجة: يمين (صورة الورقة + النص المقروء) | يسار (الأسئلة المستخرجة الجاهزة) -->
          <div class="scanner-workspace-split">

            <!-- العمود الأيمن: معاينة الورقة المرفوعة + النص المستخرج القابل للتعديل -->
            <div class="scanner-col-source">
              <div class="scanner-panel-box">
                <div class="scanner-panel-header">
                  <strong><i class="fa-solid fa-image text-primary"></i> 1. صورة الورقة ونص الأسئلة المقروء</strong>
                  <div style="display: flex; gap: 0.35rem;">
                    <button type="button" class="btn btn-outline" id="btnEnhancePaperContrast" onclick="window.toggleEnhancePaperImage()" style="padding: 3px 9px; font-size: 0.72rem; display: none;" title="توضيح الحبر وتصفية الورقة">
                      <i class="fa-solid fa-wand-sparkles"></i> توضيح الخط
                    </button>
                    <button type="button" class="btn btn-outline" id="btnRescanPaperImage" onclick="window.rescanCurrentPaperImage()" style="padding: 3px 9px; font-size: 0.72rem; display: none;" title="إعادة قراءة الورقة">
                      <i class="fa-solid fa-rotate"></i> إعادة القراءة
                    </button>
                  </div>
                </div>

                <!-- عارض صورة الورقة المرفوعة -->
                <div id="scannerImagePreviewBox" class="scanner-image-preview-box"
                  ondragover="event.preventDefault(); this.classList.add('drag-over');"
                  ondragleave="this.classList.remove('drag-over');"
                  ondrop="window.handlePaperImageDrop(event)">
                  <div id="scannerImageEmptyPlaceholder" class="scanner-image-empty">
                    <i class="fa-solid fa-file-Signature" style="font-size: 2.2rem; color: #94a3b8; margin-bottom: 6px;"></i>
                    <div style="font-weight: 800; font-size: 0.88rem; color: var(--text-main);">لم يتم رفع صورة ورقة بعد</div>
                    <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 2px;">
                      اضغط على أحد الأزرار الكبيرة بالأعلى لتصوير الورقة أو سحبها وإفلاتها هنا
                    </div>
                  </div>
                  <img id="scannerPreviewImgEl" src="" alt="معاينة ورقة الأسئلة" style="display: none; max-width: 100%; max-height: 220px; border-radius: 10px; object-fit: contain;">
                </div>

                <!-- مربع النص المقروء (يمكن للمعلم مراجعته أو الكتابة/الإملاء فيه مباشرة) -->
                <div class="scanner-raw-text-wrap">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; flex-wrap: wrap; gap: 4px;">
                    <label for="scannerExtractedTextarea" style="font-size: 0.8rem; font-weight: 800; color: var(--text-main);">
                      <i class="fa-solid fa-pen-to-square text-primary"></i> النص المستخرج من الورقة (يتحول تلقائياً لأسئلة):
                    </label>
                    <button type="button" class="btn btn-outline" onclick="window.parseTextFromScannerBox()" style="padding: 2px 9px; font-size: 0.72rem; color: #2563eb; border-color: rgba(37,99,235,0.35);">
                      <i class="fa-solid fa-bolt"></i> تحديث تقسيم الأسئلة
                    </button>
                  </div>
                  <textarea id="scannerExtractedTextarea" class="form-control scanner-raw-textarea" rows="7"
                    placeholder="عند تصوير الورقة أو رفعها سيظهر نص الأسئلة هنا تلقائياً...&#10;كما يمكنك كتابة أو لصق أو إملاء الأسئلة مباشرة مثل:&#10;س1 / عرف ما يأتي: (10 درجات)&#10;1- الخلية  2- النواة&#10;س2 / علل ما يأتي: (10 درجات)&#10;1- تمتاز الخلية النباتية بوجود جدار خلوي."></textarea>
                </div>
              </div>
            </div>

            <!-- العمود الأيسر: معاينة الأسئلة بعد تحويلها وتنسيقها -->
            <div class="scanner-col-questions">
              <div class="scanner-panel-box">
                <div class="scanner-panel-header">
                  <strong>
                    <i class="fa-solid fa-list-check text-success"></i>
                    2. الأسئلة الجاهزة للإدراج بالورقة
                    <span id="scannerDetectedCountBadge" class="badge-tag" style="background: rgba(16, 185, 129, 0.15); color: #059669; margin-right: 6px;">0 أسئلة</span>
                  </strong>
                  <span id="scannerTotalScoreBadge" style="font-size: 0.78rem; font-weight: 800; color: #7c3aed;">مجموع الدرجات: 0</span>
                </div>

                <div id="scannerGeneratedQuestionsList" class="scanner-generated-questions-list">
                  <div class="scanner-questions-empty">
                    <i class="fa-solid fa-wand-magic-sparkles" style="font-size: 2.2rem; color: #cbd5e1; margin-bottom: 8px;"></i>
                    <div style="font-weight: 800; font-size: 0.92rem; color: var(--text-main);">بانتظار تصوير أو رفع الورقة</div>
                    <p style="font-size: 0.78rem; color: var(--text-muted); max-width: 320px; margin: 4px auto 0 auto; line-height: 1.5;">
                      بمجرد رفع صورة الورقة المكتوبة بخط اليد، سيقوم النظام بقراءتها وتقسيمها تلقائياً إلى أسئلة وفروع ونقاط ودرجات جاهزة للطباعة.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        <!-- تذييل النافذة: أزرار الاعتماد الكبيرة والواضحة -->
        <div class="modal-footer paper-scanner-modal-footer">
          <button type="button" class="btn btn-outline" onclick="window.closeHandwrittenPaperScanner()" style="font-weight: 800;">
            إلغاء وإغلاق
          </button>
          <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
            <button type="button" class="btn btn-primary" id="btnAppendScannedQuestions" onclick="window.applyScannedQuestionsToExam(false)" disabled
              style="background: linear-gradient(135deg, #2563eb, #1d4ed8); font-weight: 800; padding: 0.65rem 1.25rem;">
              <i class="fa-solid fa-plus-circle"></i>
              <span>إضافة للأسئلة الحالية</span>
            </button>
            <button type="button" class="btn btn-success" id="btnReplaceScannedQuestions" onclick="window.applyScannedQuestionsToExam(true)" disabled
              style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; font-weight: 900; padding: 0.65rem 1.5rem; font-size: 0.95rem; box-shadow: 0 6px 18px rgba(16, 185, 129, 0.35);">
              <i class="fa-solid fa-check-double"></i>
              <span>اعتماد وإنشاء ورقة الامتحان فوراً ✅</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // ربط أحداث رفع الصور وتعديل النص
    const camInput = document.getElementById('scannerCameraFileInput');
    const galInput = document.getElementById('scannerGalleryFileInput');
    const rawTextarea = document.getElementById('scannerExtractedTextarea');

    if (camInput) {
      camInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleUploadedPaperFiles(e.target.files);
          e.target.value = '';
        }
      });
    }

    if (galInput) {
      galInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleUploadedPaperFiles(e.target.files);
          e.target.value = '';
        }
      });
    }

    if (rawTextarea) {
      let debounceTimer = null;
      rawTextarea.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          window.parseTextFromScannerBox();
        }, 300);
      });
    }
  }

  // ==========================================================================
  // 3. فتح وإغلاق النافذة وإدارة الكاميرا والمفتاح
  // ==========================================================================
  window.openHandwrittenPaperScanner = function () {
    injectScannerModal();
    const modal = document.getElementById('handwrittenPaperScannerModal');
    if (modal) {
      modal.classList.add('open');
      modal.style.display = 'flex';
    }
  };

  window.closeHandwrittenPaperScanner = function () {
    window.stopLiveCameraStream();
    if (isRecordingVoice && speechRecognitionInstance) {
      try { speechRecognitionInstance.stop(); } catch (e) {}
    }
    const modal = document.getElementById('handwrittenPaperScannerModal');
    if (modal) {
      modal.classList.remove('open');
      modal.style.display = 'none';
    }
  };

  window.saveScannerQuickApiKey = function () {
    const input = document.getElementById('scannerQuickApiKeyInput');
    if (!input) return;
    const val = input.value.trim();
    saveGeminiKeyQuick(val);
    const badge = document.getElementById('scannerEngineModeBadge');
    if (badge) {
      if (val) {
        badge.style.background = 'rgba(16, 185, 129, 0.15)';
        badge.style.color = '#059669';
        badge.textContent = 'Google Gemini Vision AI (دقة فائقة لخط اليد 🟢)';
      } else {
        badge.style.background = 'rgba(59, 130, 246, 0.15)';
        badge.style.color = '#2563eb';
        badge.textContent = 'القارئ الضوئي المدمج مجاناً + المحلل الذكي ⚡';
      }
    }
    notify(val ? 'تم حفظ مفتاح Gemini Vision AI بنجاح! سيتم قراءة خط اليد بأعلى دقة 🟢' : 'تم التبديل إلى القارئ الضوئي المدمج المجاني', 'success');
    if (currentUploadedImages.length > 0) {
      window.rescanCurrentPaperImage();
    }
  };

  // فتح الكاميرا (في الموبايل يفتح كاميرا الهاتف الخلفية مباشرة، وفي الحاسوب يفتح الكاميرا الحية أو ملف)
  window.triggerPaperCameraCapture = async function () {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
    if (isMobile) {
      const camInput = document.getElementById('scannerCameraFileInput');
      if (camInput) camInput.click();
      return;
    }

    // في اللابتوب/الحاسوب: نحاول فتح الكاميرا المباشرة، وإذا لم تتوفر نفتح اختيار الصورة
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
        });
        const camBox = document.getElementById('scannerLiveCameraBox');
        const videoEl = document.getElementById('scannerLiveVideo');
        if (camBox && videoEl) {
          videoEl.srcObject = cameraStream;
          camBox.style.display = 'block';
          return;
        }
      } catch (err) {
        // إذا لم توجد كاميرا في الحاسوب نفتح اختيار الصورة مباشرة
      }
    }
    const camInput = document.getElementById('scannerCameraFileInput');
    if (camInput) camInput.click();
  };

  window.stopLiveCameraStream = function () {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      cameraStream = null;
    }
    const camBox = document.getElementById('scannerLiveCameraBox');
    if (camBox) camBox.style.display = 'none';
  };

  window.captureFrameFromLiveCamera = function () {
    const videoEl = document.getElementById('scannerLiveVideo');
    if (!videoEl || !cameraStream) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth || 1280;
    canvas.height = videoEl.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    window.stopLiveCameraStream();
    processDataUrlPaperImage(dataUrl, 'camera_capture.jpg', 'image/jpeg');
  };

  window.handlePaperImageDrop = function (e) {
    e.preventDefault();
    const box = document.getElementById('scannerImagePreviewBox');
    if (box) box.classList.remove('drag-over');
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadedPaperFiles(e.dataTransfer.files);
    }
  };

  // ==========================================================================
  // 4. معالجة صورة الورقة وتحسين وضوح الخط والحبر (Canvas Enhancement)
  // ==========================================================================
  async function handleUploadedPaperFiles(fileList) {
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) {
      notify('يرجى اختيار صورة لورقة الأسئلة (JPG أو PNG)', 'warning');
      return;
    }

    currentUploadedImages = [];
    for (const file of files) {
      const dataUrl = await readFileAsDataURL(file);
      const enhancedDataUrl = await createEnhancedHandwritingDataUrl(dataUrl);
      currentUploadedImages.push({
        dataUrl,
        enhancedDataUrl,
        name: file.name,
        mimeType: file.type || 'image/jpeg'
      });
    }

    displayUploadedPaperPreview();
    await runSmartPaperRecognition();
  }

  async function processDataUrlPaperImage(dataUrl, name, mimeType) {
    const enhancedDataUrl = await createEnhancedHandwritingDataUrl(dataUrl);
    currentUploadedImages = [{
      dataUrl,
      enhancedDataUrl,
      name: name || 'paper.jpg',
      mimeType: mimeType || 'image/jpeg'
    }];
    displayUploadedPaperPreview();
    await runSmartPaperRecognition();
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // فلتر ذكي لتصفية خلفية الورقة وإبراز حبر القلم لزيادة دقة القراءة
  function createEnhancedHandwritingDataUrl(srcDataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 1800;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            const ratio = Math.min(maxDim / w, maxDim / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);

          const imgData = ctx.getImageData(0, 0, w, h);
          const d = imgData.data;
          for (let i = 0; i < d.length; i += 4) {
            const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            // زيادة التباين وتبييض خلفية الورقة الرمادية
            const contrasted = lum > 175 ? 255 : Math.max(0, (lum - 35) * 1.15);
            d[i] = contrasted;
            d[i + 1] = contrasted;
            d[i + 2] = contrasted;
          }
          ctx.putImageData(imgData, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.92));
        } catch (e) {
          resolve(srcDataUrl);
        }
      };
      img.onerror = () => resolve(srcDataUrl);
      img.src = srcDataUrl;
    });
  }

  function displayUploadedPaperPreview() {
    if (currentUploadedImages.length === 0) return;
    const first = currentUploadedImages[0];
    const emptyEl = document.getElementById('scannerImageEmptyPlaceholder');
    const imgEl = document.getElementById('scannerPreviewImgEl');
    const enhanceBtn = document.getElementById('btnEnhancePaperContrast');
    const rescanBtn = document.getElementById('btnRescanPaperImage');

    if (emptyEl) emptyEl.style.display = 'none';
    if (imgEl) {
      imgEl.src = isUsingEnhancedImage ? first.enhancedDataUrl : first.dataUrl;
      imgEl.style.display = 'block';
    }
    if (enhanceBtn) enhanceBtn.style.display = 'inline-flex';
    if (rescanBtn) rescanBtn.style.display = 'inline-flex';

    setScannerStepActive(2);
  }

  window.toggleEnhancePaperImage = function () {
    if (currentUploadedImages.length === 0) return;
    isUsingEnhancedImage = !isUsingEnhancedImage;
    displayUploadedPaperPreview();
    notify(isUsingEnhancedImage ? 'تم تفعيل تصفية الورقة وإبراز حبر الكتابة ✨' : 'تم عرض الصورة الأصلية للورقة', 'info');
  };

  window.rescanCurrentPaperImage = function () {
    if (currentUploadedImages.length === 0) return;
    runSmartPaperRecognition();
  };

  function setScannerStepActive(stepNum) {
    [1, 2, 3].forEach(n => {
      const el = document.getElementById(`scannerStep${n}Indicator`);
      if (el) {
        el.classList.toggle('active', n <= stepNum);
      }
    });
  }

  function updateScannerProgress(show, text = '', percent = 0) {
    const banner = document.getElementById('scannerProgressBanner');
    const statusText = document.getElementById('scannerProgressStatusText');
    const pctText = document.getElementById('scannerProgressPercent');
    const barFill = document.getElementById('scannerProgressBarFill');
    if (!banner) return;
    if (!show) {
      banner.style.display = 'none';
      return;
    }
    banner.style.display = 'block';
    if (statusText && text) statusText.textContent = text;
    if (pctText) pctText.textContent = `${Math.round(percent)}%`;
    if (barFill) barFill.style.width = `${Math.max(8, Math.min(100, percent))}%`;
  }

  // ==========================================================================
  // 5. محرك القراءة الهجين (Gemini Vision AI + Tesseract OCR + المحلل الوزاري)
  // ==========================================================================
  async function runSmartPaperRecognition() {
    if (isScanningPaper || currentUploadedImages.length === 0) return;
    isScanningPaper = true;

    const cfg = getStoredGeminiConfig();
    const quickKey = (document.getElementById('scannerQuickApiKeyInput')?.value || '').trim();
    const apiKey = quickKey || (cfg.apiKey || '').trim();

    updateScannerProgress(true, 'جاري فحص وقراءة الورقة المكتوبة وتحويلها إلى أسئلة...', 20);

    try {
      // المحاولة الأولى: إذا كان هناك نص مضمن في الورقة التجريبية، نقرأه فوراً وبسرعة البرق
      if (currentUploadedImages[0].presetDemoText) {
        updateScannerProgress(true, 'جاري تحليل خط اليد وتقسيم الفروع والدرجات...', 75);
        await new Promise(r => setTimeout(r, 450));
        const demoText = currentUploadedImages[0].presetDemoText;
        const textarea = document.getElementById('scannerExtractedTextarea');
        if (textarea) textarea.value = demoText;
        window.parseTextFromScannerBox();
        updateScannerProgress(false);
        isScanningPaper = false;
        setScannerStepActive(3);
        notify('تمت قراءة الورقة المكتوبة بخط اليد وتحويلها إلى أسئلة جاهزة بنجاح! 🎯', 'success');
        return;
      }

      // المحاولة الثانية: استخدام Google Gemini Vision AI إذا توفر مفتاح API (أو عبر البوابة المحلية)
      let visionSuccess = false;
      try {
        updateScannerProgress(true, 'جاري قراءة خط اليد عبر الذكاء الاصطناعي البصري (Vision AI)...', 45);
        const visionResult = await recognizePaperViaGeminiVision(currentUploadedImages, apiKey);
        if (visionResult && (visionResult.rawText || (Array.isArray(visionResult.questions) && visionResult.questions.length > 0))) {
          const textarea = document.getElementById('scannerExtractedTextarea');
          if (textarea && visionResult.rawText) {
            textarea.value = visionResult.rawText;
          }
          if (Array.isArray(visionResult.questions) && visionResult.questions.length > 0) {
            currentParsedQuestions = normalizeAiQuestionsArray(visionResult.questions);
            if (textarea && !visionResult.rawText) {
              textarea.value = formatQuestionsBackToRawText(currentParsedQuestions);
            }
            renderScannedQuestionsPreview();
          } else {
            window.parseTextFromScannerBox();
          }
          visionSuccess = true;
          updateScannerProgress(false);
          setScannerStepActive(3);
          notify(`تمت قراءة الورقة واستخراج (${currentParsedQuestions.length}) أسئلة بنجاح! ✨`, 'success');
        }
      } catch (visionErr) {
        console.log('[PaperScanner] Vision API fallback to built-in OCR:', visionErr.message);
      }

      // المحاولة الثالثة: القارئ الضوئي المجاني المدمج في المتصفح (Tesseract.js ara+eng)
      if (!visionSuccess) {
        updateScannerProgress(true, 'جاري تشغيل القارئ الضوئي المجاني لقراءة النصوص من الورقة...', 35);
        const ocrText = await recognizePaperViaTesseractOCR(currentUploadedImages);
        const cleaned = (ocrText || '').trim();
        const textarea = document.getElementById('scannerExtractedTextarea');
        if (cleaned.length >= 5) {
          if (textarea) textarea.value = cleaned;
          window.parseTextFromScannerBox();
          setScannerStepActive(3);
          notify('تم استخراج النص من الورقة وتحويله إلى أسئلة! يمكنك مراجعته أو تعديله بسهولة 📄✔', 'success');
        } else {
          if (textarea && !textarea.value.trim()) {
            textarea.focus();
          }
          notify('الصورة غير واضحة كفاية للقارئ الآلي — يمكنك استخدام الإملاء الصوتي 🎤 أو إدخال مفتاح Gemini Vision لقراءة خط اليد الصعب', 'warning');
        }
      }
    } catch (err) {
      notify('حدث خطأ أثناء قراءة الصورة، يمكنك استخدام الإملاء الصوتي أو كتابة النص مباشرة', 'warning');
    } finally {
      updateScannerProgress(false);
      isScanningPaper = false;
    }
  }

  async function recognizePaperViaGeminiVision(images, apiKey) {
    const activeSubject = getActiveSubjectMode();
    const prompt = `
أنت خبير في قراءة خط اليد العربي والإنكليزي للأساتذة في العراق وتحويل أوراق الامتحانات المكتوبة بخط اليد إلى أسئلة وزارية منظمة.
اقرأ جميع الأسئلة المكتوبة في صورة الورقة المرفقة بدقة تامة (بما في ذلك الفروع أ، ب، ج، والدرجات، والنقاط).
أرجع النتيجة بصيغة JSON فقط بهذا الهيكل:
{
  "rawText": "النص الكامل المقروء من الورقة مرتباً سطراً بسطر",
  "questions": [
    {
      "title": "عنوان السؤال مثل: السؤال الأول",
      "type": "essay أو definitions أو reasoning أو fill_blanks أو true_false أو mcq أو comparisons أو matching أو math_problem",
      "text": "نص السؤال الرئيسي أو النقاط المرقمة",
      "score": 20,
      "branches": [
        {
          "title": "الفرع (أ)",
          "text": "نص الفرع أ كاملاً مع نقاطه",
          "score": 10
        }
      ]
    }
  ]
}
مهم جداً: اقرأ ما هو مكتوب في الورقة فقط وحافظ على صياغة الأستاذ وترتيب أسئلته.
`;

    const firstImg = images[0];
    const base64Data = (isUsingEnhancedImage ? firstImg.enhancedDataUrl : firstImg.dataUrl).split(',')[1];
    const mimeType = firstImg.mimeType || 'image/jpeg';

    let replyText = '';

    // 1. محاولة الإرسال عبر السيرفر المحلي (/api/gcloud/gemini)
    try {
      const resp = await fetch('/api/gcloud/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey,
          model: 'gemini-2.5-flash',
          prompt: prompt,
          imageBase64: base64Data,
          mimeType: mimeType,
          temperature: 0.2
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.success && data.text) {
          replyText = data.text;
        }
      }
    } catch (e) {}

    // 2. إذا لم ينجح السيرفر المحلي وتوفر مفتاح API، نتصل بـ Google Gemini Vision مباشرة
    if (!replyText && apiKey) {
      const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      for (const modelName of modelsToTry) {
        try {
          const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`;
          const directResp = await fetch(directUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: mimeType, data: base64Data } }
                ]
              }],
              generationConfig: { temperature: 0.2, maxOutputTokens: 4096 }
            })
          });
          if (directResp.ok) {
            const rawData = await directResp.json();
            const parts = rawData?.candidates?.[0]?.content?.parts || [];
            replyText = parts.map(p => p.text || '').join('');
            if (replyText) break;
          }
        } catch (innerE) {}
      }
    }

    if (!replyText) {
      throw new Error('No Vision API response');
    }

    const jsonObjMatch = replyText.match(/\{[\s\S]*\}/);
    if (jsonObjMatch) {
      const parsed = JSON.parse(jsonObjMatch[0]);
      return parsed;
    }
    return { rawText: replyText, questions: [] };
  }

  // تحميل وتشغيل القارئ الضوئي المجاني (Tesseract.js) لقراءة الورقة بدون الحاجة لمفتاح
  async function recognizePaperViaTesseractOCR(images) {
    if (!window.Tesseract) {
      updateScannerProgress(true, 'جاري تجهيز القارئ الضوئي للغة العربية والإنكليزية...', 40);
      await loadExternalScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
    }

    const activeSubject = getActiveSubjectMode();
    const lang = activeSubject === 'english' ? 'eng' : 'ara+eng';
    let fullText = '';

    for (let i = 0; i < images.length; i++) {
      const imgObj = images[i];
      const src = isUsingEnhancedImage ? imgObj.enhancedDataUrl : imgObj.dataUrl;
      const result = await window.Tesseract.recognize(src, lang, {
        logger: (m) => {
          if (m && typeof m.progress === 'number') {
            const pct = 45 + Math.round(m.progress * 50);
            updateScannerProgress(true, `جاري قراءة سطور الورقة وتحليل الكلمات... (${Math.round(m.progress * 100)}%)`, pct);
          }
        }
      });
      if (result && result.data && result.data.text) {
        fullText += (fullText ? '\n\n' : '') + result.data.text;
      }
    }

    return fullText;
  }

  function loadExternalScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load OCR library'));
      document.head.appendChild(s);
    });
  }

  // ==========================================================================
  // 6. ميزة الإملاء الصوتي المباشر (لمساعدة المدرس الكبير بالسن)
  // ==========================================================================
  window.toggleScannerVoiceDictation = function () {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const btn = document.getElementById('btnScannerVoiceDictate');
    if (!SpeechRec) {
      notify('متصفحك لا يدعم الإملاء الصوتي المباشر — يرجى استخدام متصفح Chrome أو Edge', 'warning');
      return;
    }

    if (isRecordingVoice && speechRecognitionInstance) {
      speechRecognitionInstance.stop();
      return;
    }

    speechRecognitionInstance = new SpeechRec();
    const activeSubject = getActiveSubjectMode();
    speechRecognitionInstance.lang = activeSubject === 'english' ? 'en-US' : 'ar-IQ';
    speechRecognitionInstance.continuous = true;
    speechRecognitionInstance.interimResults = false;

    speechRecognitionInstance.onstart = () => {
      isRecordingVoice = true;
      if (btn) {
        btn.classList.add('recording-active');
        btn.innerHTML = `<i class="fa-solid fa-circle-stop fa-beat" style="color:#ef4444;"></i> <span>إيقاف التسجيل...</span>`;
      }
      notify('🎙️ تحدث الآن واقرأ الأسئلة بصوتك... سيتم تحويل كلامك إلى أسئلة فوراً!', 'info');
    };

    speechRecognitionInstance.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript + '\n';
        }
      }
      if (transcript.trim()) {
        const textarea = document.getElementById('scannerExtractedTextarea');
        if (textarea) {
          textarea.value = (textarea.value ? textarea.value.trim() + '\n' : '') + transcript.trim();
          window.parseTextFromScannerBox();
          setScannerStepActive(3);
        }
      }
    };

    speechRecognitionInstance.onerror = () => {
      isRecordingVoice = false;
      if (btn) {
        btn.classList.remove('recording-active');
        btn.innerHTML = `<i class="fa-solid fa-microphone"></i> <span>إملاء بالصوت</span>`;
      }
    };

    speechRecognitionInstance.onend = () => {
      isRecordingVoice = false;
      if (btn) {
        btn.classList.remove('recording-active');
        btn.innerHTML = `<i class="fa-solid fa-microphone"></i> <span>إملاء بالصوت</span>`;
      }
    };

    speechRecognitionInstance.start();
  };

  // ==========================================================================
  // 7. توليد ورقة أسئلة مكتوبة بخط اليد للتجربة الفورية بنقرة واحدة
  // ==========================================================================
  window.loadSampleHandwrittenPaper = async function () {
    const sampleHandwrittenText = [
      'س1 / عرف أربعة مما يأتي: (20 درجة)',
      '1- الخلية : هي وحدة البناء والوظيفة في جسم الكائن الحي.',
      '2- النواة : عضية كروية الشكل تنظم كافة الفعاليات الحيوية في الخلية.',
      '3- المايتوكوندريا : بيوت الطاقة في الخلية المسؤولة عن التنفس الخلوي.',
      '4- التناضح : حركة جزيئات الماء خلال غشاء اختياري النفوذية.',
      '',
      'س2 / (20 درجة)',
      'فرع أ / علل اثنين مما يأتي: (10 درجات)',
      '1- تمتاز الخلية النباتية بوجود شكل ثابت ومحدد لها.',
      '2- تسمى الجسيمات الحالة بوحدات التنظيف في السايتوبلازم.',
      '3- وجود الأعراف في الطبقة الداخلية للمايتوكوندريا.',
      'فرع ب / قارن بين الخلية النباتية والخلية الحيوانية. (10 درجات)',
      '',
      'س3 / املأ الفراغات الآتية بما يناسبها: (20 درجة)',
      '1- يتألف الجدار الخلوي في الخلية النباتية من ثلاث طبقات هي الصفيحة الوسطى و ........ و ........',
      '2- العالم الذي اكتشف نواة الخلية هو العالم ........',
      '3- يطلق على جهاز كولجي في الخلايا النباتية اسم ........',
      '',
      'س4 / ضع كلمة (صح) أو (خطأ) أمام العبارات الآتية مع تصحيح الخطأ: (20 درجة)',
      '1- تقع الشبكة البلازمية الداخلية في سايتوبلازم الخلية البدائية النواة.',
      '2- الرايبوسومات هي المسؤول الأول عن بناء البروتينات في الخلية.',
      '3- البلاستيدات عديمة اللون تشكل مراكز لتحول سكر الكلوكوز إلى سكريات متعددة.'
    ].join('\n');

    // رسم ورقة دفتر واقعية مكتوبة بخط يدوي عربي على Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 1120;
    const ctx = canvas.getContext('2d');

    // خلفية ورقة دفتر مسطرة
    ctx.fillStyle = '#fffdf7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // سطور الدفتر الأفقية
    ctx.strokeStyle = 'rgba(147, 197, 253, 0.45)';
    ctx.lineWidth = 1.5;
    for (let y = 90; y < canvas.height - 40; y += 44) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(canvas.width - 40, y);
      ctx.stroke();
    }

    // خط الهامش العمودي الأحمر
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width - 65, 40);
    ctx.lineTo(canvas.width - 65, canvas.height - 40);
    ctx.stroke();

    // كتابة الأسئلة بحبر القلم الأزرق الجاف
    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 24px "Amiri", "Cairo", serif';
    ctx.fillText('مسودة أسئلة امتحان الشهر الأول — مكتوبة بخط اليد', canvas.width - 80, 65);

    const lines = sampleHandwrittenText.split('\n');
    let curY = 126;
    lines.forEach((line) => {
      if (!line.trim()) {
        curY += 20;
        return;
      }
      const isHeader = /^(س\s*\d+|فرع\s+)/.test(line.trim());
      ctx.font = isHeader ? 'bold 22px "Amiri", "Cairo", serif' : '20px "Amiri", "Cairo", serif';
      ctx.fillStyle = isHeader ? '#1e1b4b' : '#1d4ed8';
      ctx.fillText(line.slice(0, 72), canvas.width - 80, curY);
      curY += 44;
    });

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    currentUploadedImages = [{
      dataUrl,
      enhancedDataUrl: dataUrl,
      name: 'handwritten_exam_sample.jpg',
      mimeType: 'image/jpeg',
      presetDemoText: sampleHandwrittenText
    }];

    displayUploadedPaperPreview();
    await runSmartPaperRecognition();
  };

  // ==========================================================================
  // 8. المحلل الذكي لهيكل الورقة الامتحانية العراقية (Smart Iraqi Exam Parser)
  // ==========================================================================
  window.parseTextFromScannerBox = function () {
    const textarea = document.getElementById('scannerExtractedTextarea');
    if (!textarea) return;
    const rawText = textarea.value || '';
    const activeSubject = getActiveSubjectMode();
    currentParsedQuestions = parseRawPaperTextToQuestions(rawText, activeSubject);
    renderScannedQuestionsPreview();
  };

  function convertArabicIndicDigits(str) {
    if (!str) return '';
    const map = {
      '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
      '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    };
    return String(str).replace(/[٠-٩]/g, d => map[d] || d);
  }

  function extractScoreFromLine(line, fallbackScore = 20) {
    const normalized = convertArabicIndicDigits(line);
    // يلتقط (20 درجة) أو (10 درجات) أو 15 د أو [10 Marks]
    const match = normalized.match(/[\(\[\{]?\s*(\d{1,3})\s*(?:درج[ةه]|درجات|د\b|marks?|m\b)\s*[\)\]\}]?/i);
    if (match && match[1]) {
      const val = parseInt(match[1], 10);
      if (val > 0 && val <= 100) return val;
    }
    return fallbackScore;
  }

  function cleanScoreTagFromLine(line) {
    return line
      .replace(/[\(\[\{]\s*[٠-٩\d]{1,3}\s*(?:درج[ةه]|درجات|د\b|marks?|m\b)\s*[\)\]\}]/gi, '')
      .replace(/\s+[٠-٩\d]{1,3}\s*(?:درج[ةه]|درجات)\b/gi, '')
      .trim();
  }

  function detectQuestionTypeFromText(textStr) {
    const t = (textStr || '').trim();
    if (/^(?:عرف|عرّف|ما\s+المقصود|اكتب\s+تعريف|define\b)/i.test(t) || /(?:عرف\s+ما\s+يأتي|عرّف\s+ما\s+يأتي)/i.test(t)) {
      return 'definitions';
    }
    if (/(?:علل|علّل|اذكر\s+السبب|فسر\s+علميا|لماذا\s+|give\s+reasons?)/i.test(t)) {
      return 'reasoning';
    }
    if (/(?:صح\s+أو\s+خطأ|صح\s+ام\s+خطأ|ضع\s+كلمة\s*\(?\s*صح|ضع\s+علامة\s*\(?\s*صح|true\s+or\s+false)/i.test(t)) {
      return 'true_false';
    }
    if (/(?:املأ\s+الفراغ|املا\s+الفراغ|أكمل\s+الفراغ|اكمل\s+الفراغ|الفراغات\s+الآتية|fill\s+in\s+the\s+blanks?|\.{4,}|_{3,})/i.test(t)) {
      return 'fill_blanks';
    }
    if (/(?:قارن\s+بين|ما\s+الفرق\s+بين|أوجه\s+الاختلاف|compare\s+between)/i.test(t)) {
      return 'comparisons';
    }
    if (/(?:صل\s+بين|زاوج\s+بين|طابق\s+بين|اختر\s+من\s+العمود|match\s+the)/i.test(t)) {
      return 'matching';
    }
    if (/(?:اختر\s+الإجابة|اختر\s+الاجابة|اختر\s+من\s+بين\s+الأقواس|choose\s+the\s+correct)/i.test(t)) {
      return 'mcq';
    }
    if (/(?:احسب\s+|جد\s+ناتج|جد\s+مجموعة\s+الحل|حل\s+المعادلة|مسألة\s+)/i.test(t)) {
      return 'math_problem';
    }
    return 'essay';
  }

  function parseRawPaperTextToQuestions(rawText, subjectMode = 'arabic') {
    const cleanedRaw = (rawText || '').replace(/\r\n/g, '\n').trim();
    if (!cleanedRaw) return [];

    const lines = cleanedRaw.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];

    // نمط التعرف على بداية سؤال رئيسي: س1 / السؤال الأول / Q1
    const mainQRegex = /^(?:س\s*[٠-٩\d]+\s*[\/:\-\)]?|السؤال\s+(?:الأول|الاول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|[٠-٩\d]+)\s*[\/:\-\)]?|Q\.?\s*\d+\s*[\/:\-\)]?|Question\s+\d+\s*[\/:\-\)]?)\s*(.*)$/i;

    // نمط التعرف على بداية فرع: فرع أ / الفرع (أ) / أ / أ) / Branch A
    const branchRegex = /^(?:الفرع|فرع)\s*[\(\[]?([أابجدA-D])[\)\]]?\s*[\/:\-\)]?\s*(.*)$|^[\(\[]?([أبج])[\)\]]\s*[\/:\-]\s*(.*)$/i;

    const rawBlocks = [];
    let currentBlock = null;

    lines.forEach((line) => {
      const qMatch = line.match(mainQRegex);
      if (qMatch) {
        if (currentBlock) rawBlocks.push(currentBlock);
        currentBlock = {
          headerLine: line,
          remainderFirstLine: (qMatch[1] || '').trim(),
          subLines: []
        };
      } else {
        if (!currentBlock) {
          currentBlock = {
            headerLine: '',
            remainderFirstLine: line,
            subLines: []
          };
        } else {
          currentBlock.subLines.push(line);
        }
      }
    });
    if (currentBlock) rawBlocks.push(currentBlock);

    // تحويل كل كتلة إلى كائن سؤال كامل مطابق لـ appState.questions
    return rawBlocks.map((block, idx) => {
      const ordinalTitle = subjectMode === 'english'
        ? `Question ${idx + 1}`
        : `السؤال ${ARABIC_ORDINALS[idx] || (idx + 1)}`;

      const combinedFirst = block.headerLine || block.remainderFirstLine;
      const detectedScore = extractScoreFromLine(combinedFirst, 20);
      let firstLineText = cleanScoreTagFromLine(block.remainderFirstLine || '');

      const branches = [];
      const mainBodyLines = [];
      if (firstLineText) {
        // تحقق مما إذا كان السطر الأول نفسه يبدأ بفرع (مثلاً: س1 / فرع أ: ...)
        const firstBranchMatch = firstLineText.match(branchRegex);
        if (firstBranchMatch) {
          const bLetter = firstBranchMatch[1] || firstBranchMatch[3] || 'أ';
          const bRest = firstBranchMatch[2] || firstBranchMatch[4] || '';
          branches.push({
            letter: bLetter,
            title: `الفرع (${bLetter})`,
            score: extractScoreFromLine(bRest, 10),
            lines: [cleanScoreTagFromLine(bRest)].filter(Boolean)
          });
        } else {
          mainBodyLines.push(firstLineText);
        }
      }

      block.subLines.forEach((sLine) => {
        const bMatch = sLine.match(branchRegex);
        if (bMatch) {
          const bLetter = bMatch[1] || bMatch[3] || (branches.length === 0 ? 'أ' : 'ب');
          const bRest = bMatch[2] || bMatch[4] || '';
          branches.push({
            letter: bLetter,
            title: `الفرع (${bLetter})`,
            score: extractScoreFromLine(sLine, 10),
            lines: [cleanScoreTagFromLine(bRest)].filter(Boolean)
          });
        } else if (branches.length > 0) {
          branches[branches.length - 1].lines.push(sLine);
        } else {
          mainBodyLines.push(sLine);
        }
      });

      const fullQuestionText = mainBodyLines.join('\n').trim();
      const allTextForDetection = fullQuestionText + '\n' + branches.map(b => b.lines.join('\n')).join('\n');
      const qType = detectQuestionTypeFromText(allTextForDetection);

      const formattedBranches = branches.map(b => ({
        title: b.title,
        text: b.lines.join('\n').trim(),
        score: b.score || Math.round(detectedScore / Math.max(1, branches.length)),
        modelAnswer: ''
      }));

      const questionObj = {
        id: 'scan_q_' + Date.now() + '_' + idx,
        type: qType,
        title: '',
        displayTitle: ordinalTitle,
        text: fullQuestionText || (formattedBranches.length > 0 ? 'أجب عن الفروع الآتية:' : ''),
        score: detectedScore,
        difficulty: 'متوسط',
        bloom: 'فهم',
        subject: subjectMode,
        showAnswerLines: false,
        linesCount: 3,
        branches: formattedBranches,
        options: [],
        terms: [],
        pairs: [],
        item1: '',
        item2: '',
        isTrue: true,
        correction: '',
        modelAnswer: ''
      };

      if (qType === 'comparisons') {
        const compMatch = allTextForDetection.match(/(?:قارن\s+بين|ما\s+الفرق\s+بين)\s+(.+?)\s+و\s*(.+?)(?:[\.\n\?؟]|$)/);
        if (compMatch) {
          questionObj.item1 = compMatch[1].trim();
          questionObj.item2 = compMatch[2].trim();
        }
      }

      return questionObj;
    });
  }

  function normalizeAiQuestionsArray(aiQuestions) {
    const activeSubject = getActiveSubjectMode();
    return aiQuestions.map((item, idx) => {
      const ordinalTitle = activeSubject === 'english'
        ? `Question ${idx + 1}`
        : `السؤال ${ARABIC_ORDINALS[idx] || (idx + 1)}`;
      const qType = QUESTION_TYPE_LABELS[item.type] ? item.type : detectQuestionTypeFromText(item.text || '');
      return {
        id: 'scan_ai_' + Date.now() + '_' + idx,
        type: qType,
        title: item.title || ordinalTitle,
        text: item.text || '',
        score: Number(item.score) || 20,
        difficulty: 'متوسط',
        bloom: 'فهم',
        subject: activeSubject,
        showAnswerLines: false,
        linesCount: 3,
        branches: Array.isArray(item.branches) ? item.branches.map((b, bi) => ({
          title: b.title || `الفرع (${bi === 0 ? 'أ' : 'ب'})`,
          text: b.text || '',
          score: Number(b.score) || 10,
          modelAnswer: b.modelAnswer || ''
        })) : [],
        options: Array.isArray(item.options) ? item.options.map((opt, oi) => ({
          id: 'opt_' + (oi + 1),
          text: typeof opt === 'string' ? opt : (opt.text || ''),
          isCorrect: oi === 0
        })) : [],
        terms: Array.isArray(item.terms) ? item.terms : [],
        item1: item.item1 || '',
        item2: item.item2 || '',
        modelAnswer: item.modelAnswer || ''
      };
    });
  }

  function formatQuestionsBackToRawText(questions) {
    return questions.map((q, i) => {
      let block = `س${i + 1} / ${q.text || ''} (${q.score || 20} درجة)`;
      if (Array.isArray(q.branches) && q.branches.length > 0) {
        q.branches.forEach(b => {
          block += `\n${b.title}: ${b.text} (${b.score || 10} درجات)`;
        });
      }
      return block;
    }).join('\n\n');
  }

  // ==========================================================================
  // 9. عرض بطاقات الأسئلة المستخرجة وإمكانية تعديل نوعها أو درجتها قبل الإدراج
  // ==========================================================================
  function renderScannedQuestionsPreview() {
    const listEl = document.getElementById('scannerGeneratedQuestionsList');
    const countBadge = document.getElementById('scannerDetectedCountBadge');
    const scoreBadge = document.getElementById('scannerTotalScoreBadge');
    const appendBtn = document.getElementById('btnAppendScannedQuestions');
    const replaceBtn = document.getElementById('btnReplaceScannedQuestions');

    if (!listEl) return;

    const count = currentParsedQuestions.length;
    const totalScore = currentParsedQuestions.reduce((acc, q) => acc + (Number(q.score) || 0), 0);

    if (countBadge) countBadge.textContent = `${count} أسئلة`;
    if (scoreBadge) scoreBadge.textContent = `مجموع الدرجات: ${totalScore}`;
    if (appendBtn) appendBtn.disabled = count === 0;
    if (replaceBtn) replaceBtn.disabled = count === 0;

    if (count === 0) {
      listEl.innerHTML = `
        <div class="scanner-questions-empty">
          <i class="fa-solid fa-wand-magic-sparkles" style="font-size: 2.2rem; color: #cbd5e1; margin-bottom: 8px;"></i>
          <div style="font-weight: 800; font-size: 0.92rem; color: var(--text-main);">بانتظار تصوير أو رفع الورقة</div>
          <p style="font-size: 0.78rem; color: var(--text-muted); max-width: 320px; margin: 4px auto 0 auto; line-height: 1.5;">
            صوّر الورقة أو اكتب الأسئلة في المربع المجاور ليتم تقسيمها تلقائياً هنا.
          </p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = currentParsedQuestions.map((q, idx) => {
      const typeOptionsHtml = Object.entries(QUESTION_TYPE_LABELS).map(([k, label]) =>
        `<option value="${k}" ${q.type === k ? 'selected' : ''}>${label}</option>`
      ).join('');

      const branchesHtml = (Array.isArray(q.branches) && q.branches.length > 0)
        ? `<div class="scanned-q-branches">
            ${q.branches.map(b => `
              <div class="scanned-q-branch-item">
                <span class="branch-pill">${b.title} (${b.score} د)</span>
                <div class="branch-text">${escapeHtml(b.text).replace(/\n/g, '<br>')}</div>
              </div>
            `).join('')}
          </div>`
        : '';

      return `
        <div class="scanned-q-card">
          <div class="scanned-q-card-header">
            <div style="display: flex; align-items: center; gap: 0.45rem;">
              <span class="scanned-q-num-badge">س${idx + 1}</span>
              <strong style="font-size: 0.88rem; color: var(--text-main);">${escapeHtml(q.displayTitle || q.title || ('السؤال ' + (ARABIC_ORDINALS[idx] || (idx + 1))))}</strong>
            </div>
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <select class="scanned-q-type-select" onchange="window.updateScannedQuestionField(${idx}, 'type', this.value)" title="نوع السؤال">
                ${typeOptionsHtml}
              </select>
              <div class="scanned-q-score-box" title="درجة السؤال">
                <input type="number" min="1" max="100" value="${q.score}" onchange="window.updateScannedQuestionField(${idx}, 'score', this.value)">
                <span>درجة</span>
              </div>
              <button type="button" class="scanned-q-delete-btn" onclick="window.removeScannedQuestion(${idx})" title="حذف هذا السؤال">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
          <div class="scanned-q-card-body">
            ${q.text ? `<div class="scanned-q-main-text">${escapeHtml(q.text).replace(/\n/g, '<br>')}</div>` : ''}
            ${branchesHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  window.updateScannedQuestionField = function (idx, field, value) {
    if (!currentParsedQuestions[idx]) return;
    if (field === 'score') {
      currentParsedQuestions[idx].score = Math.max(1, parseInt(value, 10) || 10);
    } else if (field === 'type') {
      currentParsedQuestions[idx].type = value;
    }
    renderScannedQuestionsPreview();
  };

  window.removeScannedQuestion = function (idx) {
    currentParsedQuestions.splice(idx, 1);
    renderScannedQuestionsPreview();
  };

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ==========================================================================
  // 10. اعتماد الأسئلة وإدراجها فوراً في ورقة الامتحان A4
  // ==========================================================================
  window.applyScannedQuestionsToExam = function (replaceExisting = false) {
    if (!currentParsedQuestions || currentParsedQuestions.length === 0) {
      notify('لا توجد أسئلة مستخرجة لإدراجها بعد', 'warning');
      return;
    }

    if (typeof window.appState !== 'object') {
      notify('تعذر الوصول لحالة الورقة الامتحانية', 'error');
      return;
    }

    const clonedQuestions = JSON.parse(JSON.stringify(currentParsedQuestions));
    if (replaceExisting || !Array.isArray(window.appState.questions)) {
      window.appState.questions = clonedQuestions;
    } else {
      clonedQuestions.forEach(q => window.appState.questions.push(q));
    }

    if (typeof window.saveStateToStorage === 'function') window.saveStateToStorage();
    if (typeof window.renderAll === 'function') window.renderAll();

    window.closeHandwrittenPaperScanner();

    // التأكد من فتح تبويب الأسئلة وإظهار معاينة الورقة A4 للأستاذ فوراً
    if (typeof window.switchToTab === 'function') {
      window.switchToTab('tab-questions');
    }
    const mainContainer = document.querySelector('.main-container');
    if (mainContainer && mainContainer.classList.contains('preview-hidden') && typeof window.togglePreviewPane === 'function') {
      window.togglePreviewPane();
    }

    notify(`تم إنشاء وإدراج (${clonedQuestions.length}) أسئلة من الورقة إلى نموذج الامتحان A4 بنجاح! 🎉📄`, 'success');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHandwrittenPaperScannerUI);
  } else {
    initHandwrittenPaperScannerUI();
  }
})();
