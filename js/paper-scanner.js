/**
 * ============================================================================
 * منصة مسار المعلم — قارئ الورقة الذكي + جسر الموبايل السريع (QR Mobile Bridge)
 * Smart Handwritten Paper Scanner, Voice-to-Exam & QR Mobile-to-Laptop Sync
 * مصمم بأعلى معايير الدقة والأناقة وسهولة الاستخدام للأساتذة عبر الموبايل واللابتوب
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

  // QR Mobile Bridge State
  let qrSessionId = '';
  let qrSupabaseChannel = null;
  let qrBroadcastChannel = null;
  let qrPollingTimer = null;

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
  // 1. تهيئة وحقن أزرار قارئ الورقة الذكي وجسر QR بأناقة متناسقة
  // ==========================================================================
  function initHandwrittenPaperScannerUI() {
    injectScannerButtonsInQuestionBuilder();
    injectScannerModal();
    checkAndInitMobileQrBridgeMode();
  }

  function injectScannerButtonsInQuestionBuilder() {
    // إزالة أي زر قديم داخل صف الفلاتر لمنع التفاف السطر
    const oldTopBtn = document.getElementById('btnOpenPaperScannerTop');
    if (oldTopBtn) oldTopBtn.remove();

    // 1. شريط ذكي مدمج وأنيق أسفل شريط اختيار المادة ونوع السؤال مباشرة (.qbuilder-paper-scanner-bar)
    const addStripRow = document.querySelector('#tab-questions .qbuilder-add-strip-row');
    if (addStripRow && addStripRow.parentNode && !document.getElementById('qbuilderPaperScannerBar')) {
      const scannerBar = document.createElement('div');
      scannerBar.id = 'qbuilderPaperScannerBar';
      scannerBar.className = 'qbuilder-paper-scanner-bar';
      scannerBar.innerHTML = `
        <div class="scanner-bar-right">
          <div class="scanner-bar-icon-badge">
            <i class="fa-solid fa-camera-retro"></i>
          </div>
          <div class="scanner-bar-text">
            <div class="scanner-bar-title-row">
              <strong>قارئ الورقة المكتوبة بخط اليد</strong>
              <span class="scanner-bar-pill-tag"><i class="fa-solid fa-wand-magic-sparkles"></i> تحويل فوري للأسئلة</span>
            </div>
            <p>اكتب الأسئلة على أي ورقة وصوّرها بالموبايل أو ارفعها لتتحول تلقائياً إلى أسئلة وزارية منسقة</p>
          </div>
        </div>
        <div class="scanner-bar-actions">
          <button type="button" class="btn-scanner-bar-primary" id="btnOpenPaperScannerMain" onclick="window.openHandwrittenPaperScanner(false)">
            <i class="fa-solid fa-camera"></i>
            <span>تصوير أو رفع ورقة مكتوبة</span>
          </button>
          <button type="button" class="btn-scanner-bar-qr" id="btnOpenPaperScannerQr" onclick="window.openHandwrittenPaperScanner(true)" title="اربط كاميرا تليفونك بالحاسبة عبر رمز QR لتصوير الورقة وإرسالها فوراً">
            <i class="fa-solid fa-qrcode"></i>
            <span>ربط كاميرا الموبايل (QR)</span>
          </button>
        </div>
      `;
      addStripRow.parentNode.insertBefore(scannerBar, addStripRow.nextSibling);
    }

    // 2. زر متناسق وأنيق داخل هيدر "أسئلة الاختبار الحالية" بجانب زر تصفير الورقة
    const resetBtn = document.getElementById('resetExamSheetBtn');
    if (resetBtn && resetBtn.parentNode) {
      let cardBtn = document.getElementById('btnOpenPaperScannerCard');
      if (!cardBtn) {
        cardBtn = document.createElement('button');
        cardBtn.type = 'button';
        cardBtn.id = 'btnOpenPaperScannerCard';
        resetBtn.parentNode.insertBefore(cardBtn, resetBtn);
      }
      cardBtn.className = 'btn btn-paper-scanner-inline';
      cardBtn.onclick = function () {
        window.openHandwrittenPaperScanner(false);
      };
      cardBtn.innerHTML = `
        <i class="fa-solid fa-camera-retro"></i>
        <span>قراءة ورقة بخط اليد / QR</span>
      `;
    }
  }

  // ==========================================================================
  // 2. نافذة قارئ الورقة الذكي + جسر الموبايل QR (بتصميم متقن وخط عربي واضح)
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
          <div class="paper-scanner-header-brand">
            <div class="paper-scanner-header-icon">
              <i class="fa-solid fa-camera-retro"></i>
            </div>
            <div class="paper-scanner-header-titles">
              <div class="header-title-row">
                <h3>قارئ الورقة الذكي — تحويل خط اليد إلى أسئلة امتحانية</h3>
                <span class="header-pro-pill">يدعم الموبايل QR ⚡</span>
              </div>
              <p>اكتب الأسئلة على ورقة بخط يدك، ثم صوّرها بالموبايل أو ارفعها ليتم قراءتها وتنسيقها في ورقة A4 تلقائياً</p>
            </div>
          </div>
          <button type="button" class="paper-scanner-close-btn" onclick="window.closeHandwrittenPaperScanner()" title="إغلاق النافذة">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- جسم النافذة -->
        <div class="modal-body paper-scanner-modal-body">

          <!-- شريط الخطوات الثلاث المبسطة للمعلم -->
          <div class="scanner-steps-strip">
            <div class="scanner-step-pill active" id="scannerStep1Indicator">
              <span class="step-num">1</span>
              <span>صوّر الورقة أو اربط الموبايل بـ QR</span>
            </div>
            <i class="fa-solid fa-arrow-left step-arrow"></i>
            <div class="scanner-step-pill" id="scannerStep2Indicator">
              <span class="step-num">2</span>
              <span>قراءة الأسئلة وتوزيع الفروع والدرجات</span>
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

          <!-- الشبكة الرباعية للأزرار الرئيسية الواضحة للمعلم -->
          <div class="scanner-giant-actions-grid">

            <!-- الخيار 1: ربط كاميرا الموبايل بالحاسبة عبر رمز QR -->
            <button type="button" class="scanner-giant-card card-qr" id="scannerCardQrBtn" onclick="window.toggleScannerQrBridgePanel()">
              <div class="giant-card-top-badge">للحاسبة والموبايل 📲</div>
              <div class="giant-card-icon">
                <i class="fa-solid fa-qrcode"></i>
              </div>
              <div class="giant-card-info">
                <h4>ربط الموبايل بـ QR</h4>
                <p>امسح الرمز بكاميرا تليفونك وصوّر الورقة لترسل تلقائياً للحاسبة</p>
              </div>
              <span class="giant-card-cta">إظهار رمز QR <i class="fa-solid fa-mobile-screen-button"></i></span>
            </button>

            <!-- الخيار 2: فتح الكاميرا وتصوير الورقة مباشرة -->
            <button type="button" class="scanner-giant-card card-camera" onclick="window.triggerPaperCameraCapture()">
              <div class="giant-card-top-badge">تصوير مباشر 📸</div>
              <div class="giant-card-icon">
                <i class="fa-solid fa-camera"></i>
              </div>
              <div class="giant-card-info">
                <h4>صوّر الورقة بالكاميرا</h4>
                <p>افتح كاميرا الجهاز والتقط صورة واضحة لورقة الأسئلة المكتوبة</p>
              </div>
              <span class="giant-card-cta">فتح الكاميرا <i class="fa-solid fa-chevron-left"></i></span>
            </button>

            <!-- الخيار 3: رفع صورة من الجهاز / الموبايل -->
            <button type="button" class="scanner-giant-card card-upload" onclick="document.getElementById('scannerGalleryFileInput').click()">
              <div class="giant-card-top-badge">من الاستوديو 🖼️</div>
              <div class="giant-card-icon">
                <i class="fa-solid fa-file-image"></i>
              </div>
              <div class="giant-card-info">
                <h4>ارفع صورة الورقة</h4>
                <p>اختر صورة أو عدة صور لورقة الأسئلة من الهاتف أو الحاسوب</p>
              </div>
              <span class="giant-card-cta">اختيار صورة <i class="fa-solid fa-upload"></i></span>
            </button>

            <!-- الخيار 4: الإملاء الصوتي أو تجربة ورقة جاهزة -->
            <div class="scanner-giant-card card-voice-demo">
              <div class="giant-card-top-badge">صوت وتجربة 🎙️</div>
              <div class="giant-card-icon">
                <i class="fa-solid fa-microphone-lines"></i>
              </div>
              <div class="giant-card-info">
                <h4>قراءة صوتية أو تجربة</h4>
                <p>اقرأ الأسئلة بصوتك مباشرة، أو جرّب نموذج ورقة مكتوبة بخط اليد</p>
              </div>
              <div class="giant-card-sub-btns">
                <button type="button" class="btn-scanner-sub-action btn-voice" id="btnScannerVoiceDictate" onclick="window.toggleScannerVoiceDictation()">
                  <i class="fa-solid fa-microphone"></i>
                  <span>إملاء صوتي</span>
                </button>
                <button type="button" class="btn-scanner-sub-action btn-demo" onclick="window.loadSampleHandwrittenPaper()">
                  <i class="fa-solid fa-wand-magic-sparkles"></i>
                  <span>تجربة ورقة</span>
                </button>
              </div>
            </div>

          </div>

          <!-- لوحة جسر الموبايل QR (تظهر عند الضغط على بطاقة ربط الموبايل بـ QR) -->
          <div id="scannerQrBridgePanel" class="scanner-qr-bridge-panel" style="display: none;">
            <div class="qr-bridge-grid">
              <!-- يمين: كود الـ QR وحالة الاتصال -->
              <div class="qr-bridge-code-col">
                <div id="scannerQrCodeMount" class="qr-code-mount-box"></div>
                <div class="qr-session-pill">
                  <span>رمز الجلسة:</span>
                  <strong id="scannerQrSessionCodeText">----</strong>
                </div>
              </div>

              <!-- يسار: شرح الخطوات السهلة + أزرار التحكم والاختبار -->
              <div class="qr-bridge-info-col">
                <div class="qr-bridge-head-row">
                  <div>
                    <h4><i class="fa-solid fa-mobile-retro"></i> ربط كاميرا الموبايل بالحاسبة (بدون كابل وبدون تسجيل دخول)</h4>
                    <p>إذا كنت تعمل على اللابتوب والورقة أمامك على المكتب، استخدم تليفونك كماسح ضوئي لاسلكي:</p>
                  </div>
                  <button type="button" class="qr-bridge-close-mini" onclick="window.toggleScannerQrBridgePanel(false)" title="إخفاء لوحة QR">
                    <i class="fa-solid fa-chevron-up"></i> إخفاء
                  </button>
                </div>

                <div class="qr-bridge-steps-list">
                  <div class="qr-step-item">
                    <span class="qr-step-badge">1</span>
                    <div><strong>افتح كاميرا الموبايل:</strong> وجّه كاميرا هاتفك نحو مربع رمز <strong>QR</strong> الظاهر أمامك.</div>
                  </div>
                  <div class="qr-step-item">
                    <span class="qr-step-badge">2</span>
                    <div><strong>صوّر ورقة الأسئلة:</strong> ستفتح لك شاشة تصوير سريعة على الهاتف؛ التقط صورة الورقة المكتوبة بخط يدك.</div>
                  </div>
                  <div class="qr-step-item">
                    <span class="qr-step-badge">3</span>
                    <div><strong>استلام فوري على اللابتوب:</strong> تنتقل الصورة والأسئلة تلقائياً خلال ثوانٍ إلى هذه الشاشة!</div>
                  </div>
                </div>

                <div class="qr-bridge-status-bar">
                  <div class="qr-status-indicator" id="scannerQrLiveStatusBox">
                    <span class="qr-pulse-dot"></span>
                    <span id="scannerQrLiveStatusText">بانتظار مسح رمز QR بكاميرا الموبايل...</span>
                  </div>
                  <div class="qr-bridge-action-btns">
                    <button type="button" class="btn-qr-act copy-link" onclick="window.copyScannerQrMobileLink()">
                      <i class="fa-solid fa-link"></i>
                      <span>نسخ رابط الموبايل</span>
                    </button>
                    <button type="button" class="btn-qr-act simulate-send" onclick="window.simulateMobileQrPaperReceive()" title="تجربة استلام ورقة مكتوبة مرسلة من الموبايل إلى الحاسبة">
                      <i class="fa-solid fa-bolt"></i>
                      <span>معاينة استلام ورقة من الموبايل</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- نافذة الكاميرا الحية (تظهر عند التصوير من اللابتوب) -->
          <div id="scannerLiveCameraBox" class="scanner-live-camera-box" style="display: none;">
            <div class="live-camera-header">
              <span><i class="fa-solid fa-video text-danger"></i> وجّه الورقة المكتوبة أمام الكاميرا ثم اضغط «التقاط صورة الورقة»</span>
              <button type="button" class="btn btn-outline" onclick="window.stopLiveCameraStream()" style="padding: 4px 10px; font-size: 0.78rem; color: #fff; border-color: rgba(255,255,255,0.3);">
                <i class="fa-solid fa-xmark"></i> إغلاق الكاميرا
              </button>
            </div>
            <div class="live-camera-video-wrap">
              <video id="scannerLiveVideo" autoplay playsinline></video>
            </div>
            <div class="live-camera-actions">
              <button type="button" class="btn btn-primary" onclick="window.captureFrameFromLiveCamera()" style="padding: 0.6rem 1.8rem; font-size: 0.95rem; font-weight: 800;">
                <i class="fa-solid fa-camera"></i> التقاط صورة الورقة الآن
              </button>
            </div>
          </div>

          <!-- شريط حالة التقدم والقراءة الذكية -->
          <div id="scannerProgressBanner" class="scanner-progress-banner" style="display: none;">
            <div class="scanner-progress-row">
              <div style="display: flex; align-items: center; gap: 0.65rem;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.2rem; color: #059669;"></i>
                <strong id="scannerProgressStatusText" style="font-size: 0.9rem;">جاري قراءة الورقة وتحليل الأسئلة المكتوبة...</strong>
              </div>
              <span id="scannerProgressPercent" style="font-weight: 900; color: #059669;">0%</span>
            </div>
            <div class="scanner-progress-bar-track">
              <div id="scannerProgressBarFill" class="scanner-progress-bar-fill" style="width: 15%;"></div>
            </div>
          </div>

          <!-- شريط إعداد الذكاء الاصطناعي الاختياري للدقة الفائقة في خط اليد -->
          <div class="scanner-ai-config-strip">
            <div class="ai-strip-right">
              <i class="fa-solid fa-microchip-ai" style="color: #7c3aed; font-size: 1rem;"></i>
              <span class="ai-strip-label">محرك القراءة الذكي:</span>
              <span id="scannerEngineModeBadge" class="scanner-engine-pill ${hasKey ? 'is-gemini' : 'is-ocr'}">
                ${hasKey ? 'Google Gemini Vision AI (دقة فائقة لخط اليد 🟢)' : 'القارئ الضوئي المدمج مجاناً + المحلل الوزاري ⚡'}
              </span>
            </div>
            <div class="ai-strip-left">
              <input type="password" id="scannerQuickApiKeyInput" class="form-control scanner-api-input"
                placeholder="مفتاح Gemini API (اختياري لدقة خط اليد الصعب)"
                value="${storedCfg.apiKey || ''}">
              <button type="button" class="btn-scanner-save-key" onclick="window.saveScannerQuickApiKey()">
                <i class="fa-solid fa-key"></i>
                <span>حفظ المفتاح</span>
              </button>
            </div>
          </div>

          <!-- منطقة العمل المزدوجة: يمين (صورة الورقة + النص المقروء) | يسار (الأسئلة المستخرجة الجاهزة) -->
          <div class="scanner-workspace-split">

            <!-- العمود الأيمن: معاينة الورقة المرفوعة + النص المستخرج القابل للتعديل -->
            <div class="scanner-col-source">
              <div class="scanner-panel-box">
                <div class="scanner-panel-header">
                  <div class="panel-header-title">
                    <span class="panel-num-circle">1</span>
                    <strong>صورة الورقة ونص الأسئلة المقروء</strong>
                  </div>
                  <div class="panel-header-tools">
                    <button type="button" class="btn-panel-mini-tool" id="btnEnhancePaperContrast" onclick="window.toggleEnhancePaperImage()" style="display: none;" title="توضيح الحبر وتصفية الورقة">
                      <i class="fa-solid fa-wand-sparkles"></i>
                      <span>توضيح الخط</span>
                    </button>
                    <button type="button" class="btn-panel-mini-tool" id="btnRescanPaperImage" onclick="window.rescanCurrentPaperImage()" style="display: none;" title="إعادة قراءة الورقة">
                      <i class="fa-solid fa-rotate"></i>
                      <span>إعادة القراءة</span>
                    </button>
                  </div>
                </div>

                <!-- عارض صورة الورقة المرفوعة -->
                <div id="scannerImagePreviewBox" class="scanner-image-preview-box"
                  ondragover="event.preventDefault(); this.classList.add('drag-over');"
                  ondragleave="this.classList.remove('drag-over');"
                  ondrop="window.handlePaperImageDrop(event)">
                  <div id="scannerImageEmptyPlaceholder" class="scanner-image-empty">
                    <div class="empty-icon-circle">
                      <i class="fa-solid fa-file-pen"></i>
                    </div>
                    <strong>لم يتم رفع صورة ورقة بعد</strong>
                    <span>صوّر الورقة بالكاميرا، أو اربط الموبايل بـ QR، أو اسحب صورة الورقة وأفلتها هنا</span>
                  </div>
                  <img id="scannerPreviewImgEl" src="" alt="معاينة ورقة الأسئلة" style="display: none;">
                </div>

                <!-- مربع النص المقروء (يمكن للمعلم مراجعته أو الكتابة/الإملاء فيه مباشرة) -->
                <div class="scanner-raw-text-wrap">
                  <div class="raw-text-label-row">
                    <label for="scannerExtractedTextarea">
                      <i class="fa-solid fa-pen-to-square text-primary"></i>
                      <span>النص المقروء من الورقة (يتحول تلقائياً إلى أسئلة):</span>
                    </label>
                    <button type="button" class="btn-panel-mini-tool primary" onclick="window.parseTextFromScannerBox()">
                      <i class="fa-solid fa-bolt"></i>
                      <span>تحديث تقسيم الأسئلة</span>
                    </button>
                  </div>
                  <textarea id="scannerExtractedTextarea" class="form-control scanner-raw-textarea" rows="6"
                    placeholder="عند تصوير الورقة أو إرسالها من الموبايل سيظهر نص الأسئلة هنا تلقائياً...&#10;كما يمكنك كتابة أو لصق أو إملاء الأسئلة مباشرة مثل:&#10;س1 / عرف ما يأتي: (20 درجة)&#10;1- الخلية  2- النواة&#10;س2 / علل ما يأتي: (20 درجة)"></textarea>
                </div>
              </div>
            </div>

            <!-- العمود الأيسر: معاينة الأسئلة بعد تحويلها وتنسيقها -->
            <div class="scanner-col-questions">
              <div class="scanner-panel-box">
                <div class="scanner-panel-header">
                  <div class="panel-header-title">
                    <span class="panel-num-circle success">2</span>
                    <strong>الأسئلة الجاهزة للإدراج بالورقة</strong>
                    <span id="scannerDetectedCountBadge" class="scanner-count-pill">0 أسئلة</span>
                  </div>
                  <span id="scannerTotalScoreBadge" class="scanner-score-total-pill">مجموع الدرجات: 0</span>
                </div>

                <div id="scannerGeneratedQuestionsList" class="scanner-generated-questions-list">
                  <div class="scanner-questions-empty">
                    <div class="empty-icon-circle">
                      <i class="fa-solid fa-wand-magic-sparkles"></i>
                    </div>
                    <strong>بانتظار تصوير الورقة أو إرسالها من الموبايل</strong>
                    <p>بمجرد تصوير الورقة المكتوبة بخط اليد، سيقوم النظام بقراءتها وتقسيمها تلقائياً إلى أسئلة وفروع ونقاط ودرجات جاهزة للطباعة.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        <!-- تذييل النافذة: أزرار الاعتماد الكبيرة والواضحة -->
        <div class="modal-footer paper-scanner-modal-footer">
          <button type="button" class="btn-scanner-footer-cancel" onclick="window.closeHandwrittenPaperScanner()">
            <i class="fa-solid fa-xmark"></i>
            <span>إلغاء وإغلاق</span>
          </button>
          <div class="scanner-footer-main-actions">
            <button type="button" class="btn-scanner-footer-append" id="btnAppendScannedQuestions" onclick="window.applyScannedQuestionsToExam(false)" disabled>
              <i class="fa-solid fa-plus-circle"></i>
              <span>إضافة للأسئلة الحالية</span>
            </button>
            <button type="button" class="btn-scanner-footer-replace" id="btnReplaceScannedQuestions" onclick="window.applyScannedQuestionsToExam(true)" disabled>
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
          window.parseTextFromScannerBox(true);
        }, 300);
      });
    }
  }

  // ==========================================================================
  // 3. فتح وإغلاق النافذة وإدارة المؤشرات
  // ==========================================================================
  window.openHandwrittenPaperScanner = function (openQrPanelImmediately = false) {
    injectScannerModal();
    const modal = document.getElementById('handwrittenPaperScannerModal');
    if (modal) {
      modal.classList.add('open');
      modal.style.setProperty('display', 'flex', 'important');
    }
    if (openQrPanelImmediately) {
      window.toggleScannerQrBridgePanel(true);
    }
  };

  window.closeHandwrittenPaperScanner = function () {
    window.stopLiveCameraStream();
    if (isRecordingVoice) {
      window.toggleScannerVoiceDictation();
    }
    stopQrBridgeListeners();
    const modal = document.getElementById('handwrittenPaperScannerModal');
    if (modal) {
      modal.classList.remove('open');
      modal.style.setProperty('display', 'none', 'important');
    }
  };

  function setActiveScannerStep(stepNum) {
    [1, 2, 3].forEach((n) => {
      const el = document.getElementById(`scannerStep${n}Indicator`);
      if (el) {
        el.classList.toggle('active', n <= stepNum);
      }
    });
  }

  window.saveScannerQuickApiKey = function () {
    const inp = document.getElementById('scannerQuickApiKeyInput');
    if (!inp) return;
    const key = inp.value.trim();
    saveGeminiKeyQuick(key);
    const badge = document.getElementById('scannerEngineModeBadge');
    if (badge) {
      if (key) {
        badge.textContent = 'Google Gemini Vision AI (دقة فائقة لخط اليد 🟢)';
        badge.className = 'scanner-engine-pill is-gemini';
        notify('تم حفظ مفتاح Gemini بنجاح! سيتم قراءة خط اليد بأعلى دقة ذكية.', 'success');
      } else {
        badge.textContent = 'القارئ الضوئي المدمج مجاناً + المحلل الوزاري ⚡';
        badge.className = 'scanner-engine-pill is-ocr';
        notify('تم التبديل إلى القارئ الضوئي المجاني المدمج.', 'info');
      }
    }
  };

  // ==========================================================================
  // 4. جسر الموبايل السريع عبر رمز QR (Mobile-to-Laptop QR Sync Bridge)
  // ==========================================================================
  function generateQrSessionId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  function getMobileBridgeUrl(sessionId) {
    let baseUrl = window.location.origin + window.location.pathname;
    if (window.location.protocol === 'file:') {
      // عند التشغيل المحلي، نستخدم رابط المنصة على GitHub Pages مع معرف الجلسة ليعمل عبر الموبايل فوراً
      baseUrl = 'https://qqhhhhaa-jpg.github.io/Teacher-Path/';
    }
    return `${baseUrl}?mobile_scan=${encodeURIComponent(sessionId)}`;
  }

  window.toggleScannerQrBridgePanel = function (forceState) {
    const panel = document.getElementById('scannerQrBridgePanel');
    const cardBtn = document.getElementById('scannerCardQrBtn');
    if (!panel) return;

    const shouldOpen = typeof forceState === 'boolean'
      ? forceState
      : panel.style.display === 'none';

    if (!shouldOpen) {
      panel.style.display = 'none';
      if (cardBtn) cardBtn.classList.remove('active-qr');
      stopQrBridgeListeners();
      return;
    }

    panel.style.display = 'block';
    if (cardBtn) cardBtn.classList.add('active-qr');

    if (!qrSessionId) {
      qrSessionId = generateQrSessionId();
    }

    const codeTextEl = document.getElementById('scannerQrSessionCodeText');
    if (codeTextEl) codeTextEl.textContent = qrSessionId;

    const mountEl = document.getElementById('scannerQrCodeMount');
    const mobileUrl = getMobileBridgeUrl(qrSessionId);
    if (mountEl) {
      mountEl.innerHTML = '';
      if (window.MoallemQRCode && typeof window.MoallemQRCode.createQRCodeSVG === 'function') {
        mountEl.appendChild(window.MoallemQRCode.createQRCodeSVG(mobileUrl, 148, 2));
      }
    }

    startQrBridgeListeners(qrSessionId);
  };

  function updateQrStatusUI(message, isConnected = false) {
    const box = document.getElementById('scannerQrLiveStatusBox');
    const textEl = document.getElementById('scannerQrLiveStatusText');
    if (textEl) textEl.textContent = message;
    if (box) {
      box.classList.toggle('connected', Boolean(isConnected));
    }
  }

  function startQrBridgeListeners(sessionId) {
    stopQrBridgeListeners();
    updateQrStatusUI('بانتظار مسح رمز QR بكاميرا الموبايل...', false);

    // 1. BroadcastChannel (للتزامن الفوري على نفس الجهاز أو المتصفح)
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        qrBroadcastChannel = new BroadcastChannel('masar_qr_bridge_' + sessionId);
        qrBroadcastChannel.onmessage = (ev) => {
          handleIncomingMobileBridgePayload(ev.data);
        };
      } catch (e) {}
    }

    // 2. Supabase Realtime Broadcast Channel (يعمل عبر الإنترنت بين الموبايل واللابتوب في أي مكان)
    try {
      const sbClient = window.supabaseClient || (window.supabaseAuth && window.supabaseAuth.getClient && window.supabaseAuth.getClient());
      if (sbClient && typeof sbClient.channel === 'function') {
        qrSupabaseChannel = sbClient.channel('masar_qr_scan_' + sessionId, {
          config: { broadcast: { self: true } }
        });
        qrSupabaseChannel
          .on('broadcast', { event: 'mobile_connected' }, () => {
            updateQrStatusUI('📲 تم اتصال الموبايل بنجاح! التقط صورة الورقة الآن من هاتفك...', true);
            notify('تم اتصال الموبايل بالحاسبة! التقط صورة الورقة الآن 📸', 'info');
          })
          .on('broadcast', { event: 'paper_payload' }, (msg) => {
            if (msg && msg.payload) {
              handleIncomingMobileBridgePayload(msg.payload);
            }
          })
          .subscribe();
      }
    } catch (e) {
      console.warn('Supabase QR channel notice:', e);
    }

    // 3. استطلاع مسار الخادم المحلي (/api/paper-scan/bridge/<session_id>)
    if (window.location.protocol.startsWith('http')) {
      qrPollingTimer = setInterval(async () => {
        try {
          const resp = await fetch(`/api/paper-scan/bridge/${encodeURIComponent(sessionId)}`);
          if (!resp.ok) return;
          const data = await resp.json();
          if (data && data.status === 'connected') {
            updateQrStatusUI('📲 تم اتصال الموبايل! التقط صورة الورقة الآن...', true);
          } else if (data && data.status === 'received' && (data.imageDataUrl || data.rawText)) {
            handleIncomingMobileBridgePayload(data);
          }
        } catch (err) {}
      }, 2200);
    }
  }

  function stopQrBridgeListeners() {
    if (qrPollingTimer) {
      clearInterval(qrPollingTimer);
      qrPollingTimer = null;
    }
    if (qrBroadcastChannel) {
      try { qrBroadcastChannel.close(); } catch (e) {}
      qrBroadcastChannel = null;
    }
    if (qrSupabaseChannel && window.supabaseClient) {
      try { window.supabaseClient.removeChannel(qrSupabaseChannel); } catch (e) {}
      qrSupabaseChannel = null;
    }
  }

  async function handleIncomingMobileBridgePayload(payload) {
    if (!payload) return;
    if (payload.status === 'connected') {
      updateQrStatusUI('📲 تم اتصال الموبايل! التقط صورة الورقة الآن...', true);
      return;
    }

    updateQrStatusUI('✅ تم استلام صورة الورقة من الموبايل بنجاح! جاري تحويلها لأسئلة...', true);
    stopQrBridgeListeners();

    if (payload.imageDataUrl) {
      const enhancedUrl = await createEnhancedHandwritingDataUrl(payload.imageDataUrl);
      currentUploadedImages = [{
        dataUrl: payload.imageDataUrl,
        enhancedDataUrl: enhancedUrl,
        name: 'mobile_qr_paper.jpg',
        mimeType: 'image/jpeg'
      }];
      isUsingEnhancedImage = false;
      updateImagePreviewUI();
    }

    if (payload.rawText) {
      const rawTextarea = document.getElementById('scannerExtractedTextarea');
      if (rawTextarea) rawTextarea.value = payload.rawText;
      window.parseTextFromScannerBox(false);
      setActiveScannerStep(3);
      notify('تم استلام الورقة من الموبايل وتحويلها إلى أسئلة جاهزة! 🎉📱', 'success');
    } else if (payload.imageDataUrl) {
      await runSmartPaperRecognition(currentUploadedImages[0]);
    }
  }

  window.copyScannerQrMobileLink = function () {
    if (!qrSessionId) qrSessionId = generateQrSessionId();
    const url = getMobileBridgeUrl(qrSessionId);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        notify('تم نسخ رابط التصوير عبر الموبايل! يمكنك إرساله لتليفونك عبر واتساب أو تيليجرام 📲', 'success');
      });
    } else {
      prompt('انسخ رابط الموبايل التالي:', url);
    }
  };

  window.simulateMobileQrPaperReceive = function () {
    updateQrStatusUI('📲 جاري استلام صورة الورقة المرسلة من كاميرا الموبايل...', true);
    window.loadSampleHandwrittenPaper();
    updateQrStatusUI('✅ تم استلام الورقة من الموبايل وتحويلها إلى 4 أسئلة وزارية!', true);
  };

  // ==========================================================================
  // 5. شاشة الموبايل المخصصة عند مسح رمز QR (?mobile_scan=SESSION_ID)
  // ==========================================================================
  function checkAndInitMobileQrBridgeMode() {
    let params;
    try {
      params = new URLSearchParams(window.location.search);
    } catch (e) {
      return;
    }
    const mobileSession = (params.get('mobile_scan') || '').trim();
    if (!mobileSession) return;

    // إظهار شاشة تصوير الموبايل المباشرة الفائقة البساطة
    const overlay = document.createElement('div');
    overlay.id = 'mobileScannerBridgeScreen';
    overlay.className = 'mobile-scanner-bridge-screen';
    overlay.innerHTML = `
      <div class="mobile-bridge-card">
        <div class="mobile-bridge-header">
          <div class="mobile-bridge-logo">
            <i class="fa-solid fa-camera-retro"></i>
          </div>
          <h2>كاميرا مسار المعلم الذكية</h2>
          <p>متصل بحاسبة الأستاذ — رمز الجلسة: <strong>${escapeHtml(mobileSession)}</strong></p>
        </div>

        <input type="file" id="mobileBridgeCameraInput" accept="image/*" capture="environment" style="display: none;">
        <input type="file" id="mobileBridgeGalleryInput" accept="image/*" style="display: none;">

        <div class="mobile-bridge-body">
          <button type="button" class="btn-mobile-giant-cam" onclick="document.getElementById('mobileBridgeCameraInput').click()">
            <i class="fa-solid fa-camera"></i>
            <span>📸 صوّر ورقة الأسئلة الآن</span>
            <small>افتح الكاميرا الخلفية والتقط صورة واضحة للورقة</small>
          </button>

          <button type="button" class="btn-mobile-giant-gal" onclick="document.getElementById('mobileBridgeGalleryInput').click()">
            <i class="fa-solid fa-images"></i>
            <span>🖼️ اختر صورة الورقة من الاستوديو</span>
          </button>

          <div id="mobileBridgePreviewWrap" class="mobile-bridge-preview" style="display: none;">
            <img id="mobileBridgePreviewImg" src="" alt="معاينة الورقة">
            <div id="mobileBridgeStatusMsg" class="mobile-bridge-status">جاري ضغط وإرسال الورقة إلى الحاسبة...</div>
          </div>
        </div>

        <div class="mobile-bridge-footer">
          <button type="button" class="btn-mobile-close-bridge" onclick="document.getElementById('mobileScannerBridgeScreen').remove()">
            الدخول الكامل للمنصة على الموبايل
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // إشعار اللابتوب بأن الموبايل قد اتصل
    notifyLaptopSessionConnected(mobileSession);

    const handleMobileFile = async (file) => {
      if (!file) return;
      const previewWrap = document.getElementById('mobileBridgePreviewWrap');
      const previewImg = document.getElementById('mobileBridgePreviewImg');
      const statusMsg = document.getElementById('mobileBridgeStatusMsg');

      const dataUrl = await compressMobileImageDataUrl(file, 1280, 0.82);
      if (previewWrap && previewImg) {
        previewWrap.style.display = 'block';
        previewImg.src = dataUrl;
      }
      if (statusMsg) {
        statusMsg.textContent = '⏳ جاري إرسال صورة الورقة إلى شاشة الحاسبة...';
      }

      await sendMobilePaperPayloadToLaptop(mobileSession, {
        status: 'received',
        imageDataUrl: dataUrl,
        rawText: ''
      });

      if (statusMsg) {
        statusMsg.style.background = 'rgba(16, 185, 129, 0.2)';
        statusMsg.style.color = '#065f46';
        statusMsg.innerHTML = '✅ <strong>تم إرسال الورقة إلى الحاسبة بنجاح!</strong> انظر الآن إلى شاشة اللابتوب.';
      }
    };

    const camInp = document.getElementById('mobileBridgeCameraInput');
    const galInp = document.getElementById('mobileBridgeGalleryInput');
    if (camInp) camInp.addEventListener('change', (e) => handleMobileFile(e.target.files[0]));
    if (galInp) galInp.addEventListener('change', (e) => handleMobileFile(e.target.files[0]));
  }

  function compressMobileImageDataUrl(file, maxDim = 1280, quality = 0.82) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(ev.target.result);
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function notifyLaptopSessionConnected(sessionId) {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('masar_qr_bridge_' + sessionId);
        bc.postMessage({ status: 'connected' });
        bc.close();
      }
    } catch (e) {}

    try {
      const sbClient = window.supabaseClient || (window.supabaseAuth && window.supabaseAuth.getClient && window.supabaseAuth.getClient());
      if (sbClient && typeof sbClient.channel === 'function') {
        const ch = sbClient.channel('masar_qr_scan_' + sessionId, { config: { broadcast: { self: true } } });
        ch.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            ch.send({ type: 'broadcast', event: 'mobile_connected', payload: { status: 'connected' } });
          }
        });
      }
    } catch (e) {}

    if (window.location.protocol.startsWith('http')) {
      try {
        await fetch(`/api/paper-scan/bridge/${encodeURIComponent(sessionId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'connected' })
        });
      } catch (e) {}
    }
  }

  async function sendMobilePaperPayloadToLaptop(sessionId, payload) {
    // 1. BroadcastChannel
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('masar_qr_bridge_' + sessionId);
        bc.postMessage(payload);
        bc.close();
      }
    } catch (e) {}

    // 2. Supabase Realtime Broadcast
    try {
      const sbClient = window.supabaseClient || (window.supabaseAuth && window.supabaseAuth.getClient && window.supabaseAuth.getClient());
      if (sbClient && typeof sbClient.channel === 'function') {
        const ch = sbClient.channel('masar_qr_scan_' + sessionId, { config: { broadcast: { self: true } } });
        ch.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await ch.send({ type: 'broadcast', event: 'paper_payload', payload: payload });
          }
        });
      }
    } catch (e) {}

    // 3. Backend API
    if (window.location.protocol.startsWith('http')) {
      try {
        await fetch(`/api/paper-scan/bridge/${encodeURIComponent(sessionId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (e) {}
    }
  }

  // ==========================================================================
  // 6. التصوير بالكاميرا أو رفع صورة الورقة وتحسين التباين
  // ==========================================================================
  window.triggerPaperCameraCapture = async function () {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
    const camInput = document.getElementById('scannerCameraFileInput');

    if (isMobile && camInput) {
      camInput.click();
      return;
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1600 }, height: { ideal: 1200 } },
          audio: false
        });
        const liveBox = document.getElementById('scannerLiveCameraBox');
        const videoEl = document.getElementById('scannerLiveVideo');
        if (liveBox && videoEl) {
          videoEl.srcObject = cameraStream;
          liveBox.style.display = 'block';
          return;
        }
      } catch (err) {
        if (camInput) camInput.click();
        return;
      }
    }

    if (camInput) camInput.click();
  };

  window.stopLiveCameraStream = function () {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      cameraStream = null;
    }
    const liveBox = document.getElementById('scannerLiveCameraBox');
    if (liveBox) liveBox.style.display = 'none';
  };

  window.captureFrameFromLiveCamera = function () {
    const videoEl = document.getElementById('scannerLiveVideo');
    if (!videoEl || !videoEl.videoWidth) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

    window.stopLiveCameraStream();

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'captured_exam_paper.jpg', { type: 'image/jpeg' });
        handleUploadedPaperFiles([file]);
      }
    }, 'image/jpeg', 0.92);
  };

  window.handlePaperImageDrop = function (ev) {
    ev.preventDefault();
    const box = document.getElementById('scannerImagePreviewBox');
    if (box) box.classList.remove('drag-over');
    if (ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files.length > 0) {
      handleUploadedPaperFiles(ev.dataTransfer.files);
    }
  };

  async function handleUploadedPaperFiles(fileList) {
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) {
      notify('يرجى اختيار ملف صورة صالح (JPG أو PNG)', 'warning');
      return;
    }

    currentUploadedImages = [];
    for (const file of files) {
      const dataUrl = await readFileAsDataUrl(file);
      const enhancedUrl = await createEnhancedHandwritingDataUrl(dataUrl);
      currentUploadedImages.push({
        dataUrl,
        enhancedDataUrl: enhancedUrl,
        name: file.name,
        mimeType: file.type || 'image/jpeg'
      });
    }

    isUsingEnhancedImage = false;
    updateImagePreviewUI();
    await runSmartPaperRecognition(currentUploadedImages[0]);
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function createEnhancedHandwritingDataUrl(srcDataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1600;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        const imgData = ctx.getImageData(0, 0, w, h);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          const val = gray < 145 ? Math.max(0, (gray - 60) * 0.55) : Math.min(255, gray * 1.15 + 25);
          d[i] = d[i + 1] = d[i + 2] = val;
        }
        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = () => resolve(srcDataUrl);
      img.src = srcDataUrl;
    });
  }

  function updateImagePreviewUI() {
    const emptyEl = document.getElementById('scannerImageEmptyPlaceholder');
    const imgEl = document.getElementById('scannerPreviewImgEl');
    const enhanceBtn = document.getElementById('btnEnhancePaperContrast');
    const rescanBtn = document.getElementById('btnRescanPaperImage');

    if (currentUploadedImages.length === 0) {
      if (emptyEl) emptyEl.style.display = 'flex';
      if (imgEl) imgEl.style.display = 'none';
      if (enhanceBtn) enhanceBtn.style.display = 'none';
      if (rescanBtn) rescanBtn.style.display = 'none';
      return;
    }

    const activeImg = currentUploadedImages[0];
    if (emptyEl) emptyEl.style.display = 'none';
    if (imgEl) {
      imgEl.style.display = 'block';
      imgEl.src = isUsingEnhancedImage ? activeImg.enhancedDataUrl : activeImg.dataUrl;
    }
    if (enhanceBtn) {
      enhanceBtn.style.display = 'inline-flex';
      enhanceBtn.innerHTML = isUsingEnhancedImage
        ? '<i class="fa-solid fa-image"></i><span>الصورة الأصلية</span>'
        : '<i class="fa-solid fa-wand-sparkles"></i><span>توضيح الخط</span>';
    }
    if (rescanBtn) rescanBtn.style.display = 'inline-flex';
  }

  window.toggleEnhancePaperImage = function () {
    if (currentUploadedImages.length === 0) return;
    isUsingEnhancedImage = !isUsingEnhancedImage;
    updateImagePreviewUI();
  };

  window.rescanCurrentPaperImage = async function () {
    if (currentUploadedImages.length === 0) return;
    await runSmartPaperRecognition(currentUploadedImages[0]);
  };

  // ==========================================================================
  // 7. محرك القراءة الذكي للورقة (Gemini Vision AI + Tesseract.js OCR Fallback)
  // ==========================================================================
  function showScannerProgress(show, statusText = '', percent = 20) {
    const banner = document.getElementById('scannerProgressBanner');
    const txt = document.getElementById('scannerProgressStatusText');
    const pct = document.getElementById('scannerProgressPercent');
    const fill = document.getElementById('scannerProgressBarFill');

    if (!banner) return;
    if (!show) {
      banner.style.display = 'none';
      return;
    }
    banner.style.display = 'block';
    if (txt && statusText) txt.textContent = statusText;
    if (pct) pct.textContent = `${Math.round(percent)}%`;
    if (fill) fill.style.width = `${Math.min(100, Math.max(5, percent))}%`;
  }

  async function runSmartPaperRecognition(imageObj) {
    if (!imageObj || isScanningPaper) return;
    isScanningPaper = true;
    setActiveScannerStep(2);

    const rawTextarea = document.getElementById('scannerExtractedTextarea');
    const cfg = getStoredGeminiConfig();
    const quickKeyInput = document.getElementById('scannerQuickApiKeyInput');
    const apiKey = ((quickKeyInput && quickKeyInput.value) || cfg.apiKey || '').trim();

    try {
      showScannerProgress(true, 'جاري فحص الورقة وقراءة خط اليد بالذكاء الاصطناعي...', 25);

      if (apiKey) {
        const visionResult = await recognizeWithGeminiVision(imageObj, apiKey);
        if (visionResult && (visionResult.rawText || (visionResult.questions && visionResult.questions.length > 0))) {
          showScannerProgress(true, 'تمت قراءة خط اليد وتنسيق الأسئلة بنجاح!', 100);
          if (rawTextarea && visionResult.rawText) {
            rawTextarea.value = visionResult.rawText;
          }
          if (Array.isArray(visionResult.questions) && visionResult.questions.length > 0) {
            currentParsedQuestions = normalizeAiQuestionsArray(visionResult.questions);
            if (rawTextarea && !rawTextarea.value.trim()) {
              rawTextarea.value = formatQuestionsBackToRawText(currentParsedQuestions);
            }
          } else {
            currentParsedQuestions = parseRawPaperTextToQuestions(rawTextarea.value, getActiveSubjectMode());
          }
          renderScannedQuestionsPreview();
          setActiveScannerStep(3);
          setTimeout(() => showScannerProgress(false), 600);
          notify('تمت قراءة الورقة المكتوبة بخط اليد وتحويلها إلى أسئلة بنجاح! ✨', 'success');
          isScanningPaper = false;
          return;
        }
      }

      showScannerProgress(true, 'جاري تشغيل القارئ الضوئي المجاني (OCR) لقراءة الورقة...', 40);
      const ocrText = await recognizeWithTesseractOCR(
        isUsingEnhancedImage ? imageObj.enhancedDataUrl : imageObj.dataUrl
      );

      if (ocrText && ocrText.trim().length > 5) {
        showScannerProgress(true, 'تم استخراج النص! جاري تقسيم الأسئلة والفروع والدرجات...', 95);
        if (rawTextarea) rawTextarea.value = ocrText.trim();
        currentParsedQuestions = parseRawPaperTextToQuestions(ocrText, getActiveSubjectMode());
        renderScannedQuestionsPreview();
        setActiveScannerStep(3);
        notify('تمت قراءة الورقة وتقسيم الأسئلة بنجاح! يمكنك مراجعتها أو اعتمادها فوراً.', 'success');
      } else {
        notify('الصورة غير واضحة كفاية؛ يمكنك الضغط على «توضيح الخط» أو تعديل النص في المربع أدناه.', 'warning');
      }
    } catch (err) {
      console.warn('Paper recognition warning:', err);
      notify('تعذر قراءة الصورة تلقائياً، يمكنك كتابة أو إملاء الأسئلة بالصوت مباشرة.', 'warning');
    } finally {
      setTimeout(() => showScannerProgress(false), 600);
      isScanningPaper = false;
    }
  }

  async function recognizeWithGeminiVision(imageObj, apiKey) {
    const base64Data = (imageObj.dataUrl || '').split(',')[1] || '';
    if (!base64Data) return null;

    const prompt = `أنت خبير في قراءة أوراق الامتحانات العراقية المكتوبة بخط اليد باللغة العربية والإنجليزية والرياضيات.
قم بقراءة كل ما هو مكتوب في صورة الورقة المرفقة بدقة عالية، وصحح أي أخطاء إملائية ناتجة عن خط اليد، ثم أعد النتيجة بصيغة JSON فقط بهذا الهيكل:
{
  "rawText": "النص الكامل للورقة مرتباً سطراً بسطر",
  "questions": [
    {
      "title": "",
      "type": "essay | definitions | reasoning | fill_blanks | true_false | mcq | comparisons | matching | math_problem",
      "text": "منطوق السؤال والنقاط كاملاً",
      "score": 20,
      "branches": [
        { "title": "الفرع (أ)", "text": "نص الفرع ونقاطه", "score": 10 }
      ]
    }
  ]
}
أعد JSON صالح فقط بدون أي شرح إضافي.`;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: imageObj.mimeType || 'image/jpeg',
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096
          }
        })
      });

      if (!resp.ok) return null;
      const data = await resp.json();
      const candidates = data.candidates || [];
      if (!candidates.length) return null;
      const parts = (candidates[0].content && candidates[0].content.parts) || [];
      const replyText = parts.map(p => p.text || '').join('').trim();
      if (!replyText) return null;

      const jsonMatch = replyText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { rawText: replyText, questions: [] };
    } catch (e) {
      return null;
    }
  }

  function loadTesseractScriptOnce() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      s.onload = () => resolve(window.Tesseract);
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function recognizeWithTesseractOCR(imageDataUrl) {
    const TesseractLib = await loadTesseractScriptOnce();
    if (!TesseractLib) throw new Error('Tesseract not loaded');

    const result = await TesseractLib.recognize(imageDataUrl, 'ara+eng', {
      logger: (m) => {
        if (m && m.status === 'recognizing text' && typeof m.progress === 'number') {
          const pct = 40 + Math.round(m.progress * 50);
          showScannerProgress(true, 'جاري قراءة سطور الورقة وتحويل الحروف...', pct);
        }
      }
    });
    return (result && result.data && result.data.text) ? result.data.text : '';
  }

  // ==========================================================================
  // 8. الإملاء الصوتي المباشر + تجربة ورقة مكتوبة بخط اليد بنقرة واحدة
  // ==========================================================================
  window.toggleScannerVoiceDictation = function () {
    const voiceBtn = document.getElementById('btnScannerVoiceDictate');
    const rawTextarea = document.getElementById('scannerExtractedTextarea');
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRec) {
      notify('متصفحك الحالي لا يدعم الإملاء الصوتي المباشر؛ يفضل استخدام متصفح Chrome أو Edge.', 'warning');
      return;
    }

    if (isRecordingVoice && speechRecognitionInstance) {
      isRecordingVoice = false;
      try { speechRecognitionInstance.stop(); } catch (e) {}
      if (voiceBtn) {
        voiceBtn.classList.remove('recording');
        voiceBtn.innerHTML = '<i class="fa-solid fa-microphone"></i><span>إملاء صوتي</span>';
      }
      return;
    }

    speechRecognitionInstance = new SpeechRec();
    speechRecognitionInstance.lang = getActiveSubjectMode() === 'english' ? 'en-US' : 'ar-IQ';
    speechRecognitionInstance.continuous = true;
    speechRecognitionInstance.interimResults = false;

    speechRecognitionInstance.onstart = () => {
      isRecordingVoice = true;
      if (voiceBtn) {
        voiceBtn.classList.add('recording');
        voiceBtn.innerHTML = '<i class="fa-solid fa-circle-stop"></i><span>إيقاف الإملاء</span>';
      }
      notify('🎙️ تحدث الآن واقرأ الأسئلة بصوت واضح ليتم كتابتها وتقسيمها تلقائياً...', 'info');
    };

    speechRecognitionInstance.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript + '\n';
        }
      }
      if (transcript && rawTextarea) {
        rawTextarea.value = (rawTextarea.value ? rawTextarea.value.trim() + '\n' : '') + transcript.trim();
        window.parseTextFromScannerBox(true);
      }
    };

    speechRecognitionInstance.onerror = () => {
      isRecordingVoice = false;
      if (voiceBtn) {
        voiceBtn.classList.remove('recording');
        voiceBtn.innerHTML = '<i class="fa-solid fa-microphone"></i><span>إملاء صوتي</span>';
      }
    };

    speechRecognitionInstance.onend = () => {
      isRecordingVoice = false;
      if (voiceBtn) {
        voiceBtn.classList.remove('recording');
        voiceBtn.innerHTML = '<i class="fa-solid fa-microphone"></i><span>إملاء صوتي</span>';
      }
    };

    speechRecognitionInstance.start();
  };

  window.loadSampleHandwrittenPaper = function () {
    const sampleLines = [
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
      'س4 / ضع كلمة (صح) أمام العبارة الصحيحة وكلمة (خطأ) أمام العبارة غير الصحيحة: (20 درجة)',
      '1- الغشاء البلازمي غشاء اختياري النفوذية يحيط بالخلية النباتية والحيوانية.',
      '2- البلاستيدات الخضراء توجد في الخلايا الحيوانية والنباتية معاً.',
      '3- الرايبوسومات هي مراكز بناء البروتين في الخلية.'
    ];

    const canvas = document.createElement('canvas');
    canvas.width = 780;
    canvas.height = 560;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#fffef7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#dbeafe';
    ctx.lineWidth = 1;
    for (let y = 45; y < canvas.height; y += 26) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width - 55, 0);
    ctx.lineTo(canvas.width - 55, canvas.height);
    ctx.stroke();

    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 18px Amiri, Cairo, sans-serif';
    ctx.fillText('مسودة أسئلة امتحان الشهر الأول — مكتوبة بخط اليد', canvas.width - 70, 34);

    let yPos = 66;
    sampleLines.forEach((line) => {
      if (!line) {
        yPos += 10;
        return;
      }
      if (line.startsWith('س') || line.startsWith('فرع')) {
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 16px Amiri, Cairo, sans-serif';
      } else {
        ctx.fillStyle = '#1d4ed8';
        ctx.font = '15px Amiri, Cairo, sans-serif';
      }
      ctx.fillText(line, canvas.width - 70, yPos);
      yPos += 24;
    });

    const sampleDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    currentUploadedImages = [{
      dataUrl: sampleDataUrl,
      enhancedDataUrl: sampleDataUrl,
      name: 'handwritten_exam_sample.jpg',
      mimeType: 'image/jpeg'
    }];
    isUsingEnhancedImage = false;
    updateImagePreviewUI();

    const rawTextarea = document.getElementById('scannerExtractedTextarea');
    if (rawTextarea) {
      rawTextarea.value = sampleLines.join('\n');
    }
    window.parseTextFromScannerBox(false);
    setActiveScannerStep(3);
    notify('تم تحميل وقراءة نموذج الورقة المكتوبة بخط اليد وتقسيمها إلى 4 أسئلة وزارية! ✨', 'success');
  };

  // ==========================================================================
  // 9. المحلل الذكي لنص الورقة (Iraqi Ministerial Exam Parser)
  // ==========================================================================
  window.parseTextFromScannerBox = function (silent = false) {
    const rawTextarea = document.getElementById('scannerExtractedTextarea');
    if (!rawTextarea) return;
    const rawText = rawTextarea.value.trim();
    if (!rawText) {
      currentParsedQuestions = [];
      renderScannedQuestionsPreview();
      return;
    }

    currentParsedQuestions = parseRawPaperTextToQuestions(rawText, getActiveSubjectMode());
    renderScannedQuestionsPreview();
    setActiveScannerStep(3);
    if (!silent) {
      notify(`تم تقسيم الورقة إلى (${currentParsedQuestions.length}) أسئلة جاهزة للإدراج!`, 'info');
    }
  };

  function normalizeArabicDigits(str) {
    return String(str || '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  }

  function extractScoreFromLine(line, fallback = 20) {
    const norm = normalizeArabicDigits(line);
    const m = norm.match(/[\(\[]?\s*(\d{1,3})\s*(?:درجة|درجات|درجه|درجتان|د|marks?|pts?)\s*[\)\]]?/i);
    if (m && m[1]) {
      const val = parseInt(m[1], 10);
      if (val > 0 && val <= 100) return val;
    }
    return fallback;
  }

  function cleanScoreTagFromLine(line) {
    return String(line || '')
      .replace(/[\(\[]\s*[٠-٩\d]{1,3}\s*(?:درجة|درجات|درجه|د|marks?|pts?)\s*[\)\]]/gi, '')
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

    const mainQRegex = /^(?:س\s*[٠-٩\d]+\s*[\/:\-\)]?|السؤال\s+(?:الأول|الاول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|[٠-٩\d]+)\s*[\/:\-\)]?|Q\.?\s*\d+\s*[\/:\-\)]?|Question\s+\d+\s*[\/:\-\)]?)\s*(.*)$/i;
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

    return rawBlocks.map((block, idx) => {
      const ordinalTitle = subjectMode === 'english'
        ? `Question ${idx + 1}`
        : `السؤال ${ARABIC_ORDINALS[idx] || (idx + 1)}`;

      const combinedFirst = block.headerLine || block.remainderFirstLine;
      const detectedScore = extractScoreFromLine(combinedFirst, 20);
      const firstLineText = cleanScoreTagFromLine(block.remainderFirstLine || '');

      const branches = [];
      const mainBodyLines = [];
      if (firstLineText) {
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
        title: '',
        displayTitle: ordinalTitle,
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
        terms: [],
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
  // 10. عرض بطاقات الأسئلة المستخرجة وإمكانية تعديل نوعها أو درجتها قبل الإدراج
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
          <div class="empty-icon-circle">
            <i class="fa-solid fa-wand-magic-sparkles"></i>
          </div>
          <strong>بانتظار تصوير الورقة أو إرسالها من الموبايل</strong>
          <p>صوّر الورقة أو اكتب الأسئلة في المربع المجاور ليتم تقسيمها تلقائياً هنا.</p>
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
                <span class="branch-pill">${b.title} • ${b.score} د</span>
                <div class="branch-text">${escapeHtml(b.text).replace(/\n/g, '<br>')}</div>
              </div>
            `).join('')}
          </div>`
        : '';

      const displayTitle = q.displayTitle || q.title || ('السؤال ' + (ARABIC_ORDINALS[idx] || (idx + 1)));

      return `
        <div class="scanned-q-card">
          <div class="scanned-q-card-header">
            <div class="scanned-q-title-wrap">
              <span class="scanned-q-num-badge">س${idx + 1}</span>
              <strong>${escapeHtml(displayTitle)}</strong>
            </div>
            <div class="scanned-q-controls-wrap">
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
  // 11. اعتماد الأسئلة وإدراجها فوراً في ورقة الامتحان A4
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
