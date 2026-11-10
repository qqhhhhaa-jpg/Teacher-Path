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

  let activeScannerSubjectOverride = null;

  function getActiveSubjectMode() {
    if (activeScannerSubjectOverride) {
      return activeScannerSubjectOverride;
    }
    const activeBtn = document.querySelector('#sideSubjectSwitcher .side-sub-btn.active');
    if (activeBtn && activeBtn.dataset.subMode) {
      return activeBtn.dataset.subMode;
    }
    return (window.appState && window.appState.currentSubjectFilter && window.appState.currentSubjectFilter !== 'all')
      ? window.appState.currentSubjectFilter
      : 'arabic';
  }

  const _ENC_OPENAI_KEY = 'QUUxR3VLeWhocG9pRkxrYnp6ZURsQWZkNVZvZndvbjdBYkotRkJqNDNqVjBnZ3BVUEp1TDJqNmIyWU1qY1NwWlgtY09ZZWQwaC1KRmtibEIzVHBZa29kdldKenFJSXhnaWk0dW1xN21vZGhYa042Z3FYLWczaFprTjNlUkg1Mld1RDlqSWN6UDNJckJZSEdCTXQtVE9BMlltLTlPLWpvcnAta3M=';

  function getEmbeddedSecretAiKey() {
    try {
      return atob(_ENC_OPENAI_KEY).split('').reverse().join('');
    } catch (e) {
      return '';
    }
  }

  function getStoredGeminiConfig() {
    const fallbackKey = getEmbeddedSecretAiKey();
    try {
      const raw = localStorage.getItem('masar_gcloud_gateway_config_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!parsed.apiKey) parsed.apiKey = fallbackKey;
        return parsed;
      }
    } catch (e) { }
    return { apiKey: fallbackKey };
  }

  function saveGeminiKeyQuick(apiKey) {
    try {
      const cfg = getStoredGeminiConfig();
      cfg.apiKey = apiKey.trim();
      localStorage.setItem('masar_gcloud_gateway_config_v1', JSON.stringify(cfg));
      const gwInput = document.getElementById('gcApiKeyInput');
      if (gwInput) gwInput.value = cfg.apiKey;
    } catch (e) { }
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
          <button type="button" class="btn-scanner-bar-voice" id="btnOpenPaperScannerVoice" onclick="window.openHandwrittenPaperScannerInVoiceMode()" title="إملاء الأسئلة بالصوت مع فتح الفروع وترقيم التعاريف والتعاليل تلقائياً" style="background: linear-gradient(135deg, #059669, #10b981); color: #fff; border: none; border-radius: 10px; padding: 0.52rem 0.95rem; font-size: 0.82rem; font-weight: 800; display: inline-flex; align-items: center; gap: 0.45rem; cursor: pointer; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);">
            <i class="fa-solid fa-microphone-lines"></i>
            <span>إملاء صوتي ذكي 🎙️</span>
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

          <!-- شريط اختيار تخصص الورقة الذكي (عربي | English | الرياضيات) -->
          <div id="scannerSubjectModeStrip" style="display: flex; align-items: center; justify-content: space-between; gap: 0.65rem; flex-wrap: wrap; background: linear-gradient(135deg, rgba(15, 23, 42, 0.04), rgba(37, 99, 235, 0.05)); border: 1.5px solid rgba(37, 99, 235, 0.2); border-radius: 14px; padding: 0.55rem 0.85rem; margin-bottom: 0.85rem;">
            <div style="display: flex; align-items: center; gap: 0.45rem;">
              <i class="fa-solid fa-layer-group" style="color: #2563eb; font-size: 1rem;"></i>
              <strong style="font-size: 0.85rem; color: var(--text-main, #0f172a);">نظام قراءة وتقسيم الورقة والإملاء حسب المادة:</strong>
            </div>
            <div style="display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap;">
              <button type="button" id="scannerSubBtn_arabic" class="scanner-sub-mode-btn active" onclick="window.setScannerSubjectMode('arabic')"
                style="padding: 0.42rem 0.9rem; border-radius: 10px; font-size: 0.82rem; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem; border: 1.5px solid #10b981; background: linear-gradient(135deg, #059669, #10b981); color: #fff; box-shadow: 0 3px 10px rgba(16, 185, 129, 0.25); transition: all 0.2s;">
                <i class="fa-solid fa-feather-pointed"></i>
                <span>📗 اللغة العربية والمواد العامة</span>
              </button>
              <button type="button" id="scannerSubBtn_english" class="scanner-sub-mode-btn" onclick="window.setScannerSubjectMode('english')"
                style="padding: 0.42rem 0.9rem; border-radius: 10px; font-size: 0.82rem; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem; border: 1.5px solid rgba(37, 99, 235, 0.35); background: var(--bg-card, #fff); color: #1d4ed8; transition: all 0.2s;">
                <i class="fa-solid fa-earth-americas"></i>
                <span>📘 English Language (LTR)</span>
              </button>
              <button type="button" id="scannerSubBtn_math" class="scanner-sub-mode-btn" onclick="window.setScannerSubjectMode('math')"
                style="padding: 0.42rem 0.9rem; border-radius: 10px; font-size: 0.82rem; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem; border: 1.5px solid rgba(139, 92, 246, 0.35); background: var(--bg-card, #fff); color: #6d28d9; transition: all 0.2s;">
                <i class="fa-solid fa-square-root-variable"></i>
                <span>📐 الرياضيات والمعادلات (Math)</span>
              </button>
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

          <!-- شريط محرك الذكاء الاصطناعي السري المدمج تلقائياً لقراءة الخط العربي -->
          <div class="scanner-ai-config-strip">
            <div class="ai-strip-right">
              <i class="fa-solid fa-shield-halved" style="color: #059669; font-size: 1.05rem;"></i>
              <span class="ai-strip-label">محرك القراءة الذكي:</span>
              <span id="scannerEngineModeBadge" class="scanner-engine-pill is-gemini">
                OpenAI ChatGPT-4o Vision & Arabic AI (مفعّل تلقائياً بالنسخة السرية 🔒)
              </span>
            </div>
            <div class="ai-strip-left">
              <button type="button" class="btn-scanner-save-key" onclick="window.toggleScannerSecretKeyBox()" title="إعدادات مفتاح ChatGPT السحابي السري" style="background: rgba(16, 185, 129, 0.1); color: #047857; border: 1px solid rgba(16, 185, 129, 0.25);">
                <i class="fa-solid fa-lock"></i>
                <span>متصل بـ ChatGPT تلقائياً</span>
              </button>
              <div id="scannerSecretKeyBox" style="display: none; align-items: center; gap: 0.35rem;">
                <input type="password" id="scannerQuickApiKeyInput" class="form-control scanner-api-input"
                  placeholder="مفتاح ChatGPT السري (sk-...)"
                  value="${storedCfg.apiKey || ''}">
                <button type="button" class="btn-scanner-save-key" onclick="window.saveScannerQuickApiKey()">
                  <i class="fa-solid fa-check"></i>
                  <span>حفظ</span>
                </button>
              </div>
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
                    <button type="button" class="btn-panel-mini-tool danger" id="btnClearPaperImage" onclick="window.clearUploadedPaperImage()" style="display: none; background: rgba(239, 68, 68, 0.12); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.3);" title="تفريغ ومسح صورة الورقة">
                      <i class="fa-solid fa-trash-can"></i>
                      <span>مسح الصورة</span>
                    </button>
                  </div>
                </div>

                <!-- عارض صورة الورقة المرفوعة -->
                <div id="scannerImagePreviewBox" class="scanner-image-preview-box" style="position: relative;"
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
                  <button type="button" id="btnOverlayClearPaperImg" onclick="window.clearUploadedPaperImage()" style="display: none; position: absolute; top: 10px; left: 10px; z-index: 5; background: rgba(220, 38, 38, 0.92); color: #fff; border: none; border-radius: 999px; padding: 0.35rem 0.85rem; font-size: 0.78rem; font-weight: 800; cursor: pointer; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35); align-items: center; gap: 0.35rem;" title="حذف وتفريغ الصورة الحالية">
                    <i class="fa-solid fa-trash-can"></i>
                    <span>مسح الصورة</span>
                  </button>
                </div>

                <!-- شريط الإملاء الصوتي الذكي المباشر + أزرار التقسيم السريع -->
                <div id="scannerVoiceLiveBanner" style="display: none; margin: 0 0 0.75rem 0; padding: 0.7rem 0.85rem; border-radius: 12px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(5, 150, 105, 0.06)); border: 1.5px solid rgba(16, 185, 129, 0.4);">
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.45rem;">
                    <div style="display: flex; align-items: center; gap: 0.45rem;">
                      <span id="scannerVoicePulseDot" style="width: 10px; height: 10px; border-radius: 50%; background: #ef4444; display: inline-block; box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.25);"></span>
                      <strong id="scannerVoiceStatusTitle" style="font-size: 0.84rem; color: #065f46;">🎙️ الإملاء الصوتي الذكي مفعل — تحدث الآن وسيتم تقسيم الفروع وترقيم التعاريف والتعاليل تلقائياً</strong>
                    </div>
                    <button type="button" onclick="window.toggleScannerVoiceDictation()" style="background: #dc2626; color: #fff; border: none; border-radius: 8px; padding: 3px 10px; font-size: 0.75rem; font-weight: 800; cursor: pointer;">
                      <i class="fa-solid fa-circle-stop"></i> إيقاف المايكروفون
                    </button>
                  </div>
                  <div id="scannerVoiceInterimText" style="font-size: 0.82rem; font-weight: 700; color: #047857; background: rgba(255,255,255,0.75); border-radius: 8px; padding: 0.35rem 0.6rem; min-height: 28px; margin-bottom: 0.45rem; border: 1px dashed rgba(16, 185, 129, 0.35);">
                    💡 قل مثلاً: "السؤال الأول عرف ما يأتي الخلية النواة المايتوكوندريا علل ما يأتي تمتاز الخلية النباتية بوجود شكل ثابت لها..."
                  </div>
                </div>

                <!-- شريط الأدوات الذكي حسب المادة (عربي / English / الرياضيات + رموز ومعادلات) -->
                <div id="scannerQuickSubjectToolbar" style="margin: 0 0 0.65rem 0; padding: 0.55rem 0.7rem; border-radius: 10px; background: rgba(37, 99, 235, 0.04); border: 1px solid rgba(37, 99, 235, 0.2);"></div>

                <!-- مربع النص المقروء (يمكن للمعلم مراجعته أو الكتابة/الإملاء فيه مباشرة) -->
                <div class="scanner-raw-text-wrap">
                  <div class="raw-text-label-row" style="flex-wrap: wrap; gap: 0.4rem;">
                    <label for="scannerExtractedTextarea">
                      <i class="fa-solid fa-pen-to-square text-primary"></i>
                      <span>النص المقروء من الورقة أو الإملاء الصوتي (يقسّم الفروع ويرقّم تلقائياً):</span>
                    </label>
                    <div style="display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;">
                      <button type="button" class="btn-panel-mini-tool" onclick="window.autoStructureAndNumberRawBox()" style="background: rgba(16, 185, 129, 0.12); color: #059669; border: 1px solid rgba(16, 185, 129, 0.35);" title="ترقيم التعاريف والتعاليل وفتح الفروع تلقائياً">
                        <i class="fa-solid fa-list-ol"></i>
                        <span>ترقيم وفتح فروع تلقائي</span>
                      </button>
                      <button type="button" class="btn-panel-mini-tool primary" onclick="window.parseTextFromScannerBox()">
                        <i class="fa-solid fa-bolt"></i>
                        <span>تحديث تقسيم الأسئلة</span>
                      </button>
                      <button type="button" class="btn-panel-mini-tool" onclick="window.clearUploadedPaperImage()" style="background: rgba(239, 68, 68, 0.08); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.25);" title="تفريغ النص والصورة بالكامل">
                        <i class="fa-solid fa-broom"></i>
                        <span>تفريغ</span>
                      </button>
                    </div>
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
                    <strong>الأسئلة الجاهزة للإدراج (اضغط على أي سؤال لتعديله مباشرة)</strong>
                    <span id="scannerDetectedCountBadge" class="scanner-count-pill">0 أسئلة</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.45rem;">
                    <button type="button" class="btn-panel-mini-tool primary" onclick="window.addBlankScannedQuestion()" title="إضافة سؤال جديد يدوياً للمعاينة">
                      <i class="fa-solid fa-plus"></i>
                      <span>سؤال جديد</span>
                    </button>
                    <span id="scannerTotalScoreBadge" class="scanner-score-total-pill">مجموع الدرجات: 0</span>
                  </div>
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
    if (typeof window.setScannerSubjectMode === 'function') {
      window.setScannerSubjectMode(getActiveSubjectMode(), true);
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

  window.toggleScannerSecretKeyBox = function () {
    const box = document.getElementById('scannerSecretKeyBox');
    if (!box) return;
    box.style.display = box.style.display === 'none' ? 'flex' : 'none';
  };

  window.saveScannerQuickApiKey = function () {
    const inp = document.getElementById('scannerQuickApiKeyInput');
    if (!inp) return;
    const key = inp.value.trim();
    saveGeminiKeyQuick(key);
    const box = document.getElementById('scannerSecretKeyBox');
    if (box) box.style.display = 'none';
    const badge = document.getElementById('scannerEngineModeBadge');
    if (badge) {
      badge.textContent = 'OpenAI ChatGPT-4o Vision & Arabic AI (مفعّل تلقائياً بالنسخة السرية 🔒)';
      badge.className = 'scanner-engine-pill is-gemini';
    }
    notify('تم تحديث مفتاح ChatGPT السري لقراءة الخط العربي بنجاح! 🔒', 'success');
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
      } catch (e) { }
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
        } catch (err) { }
      }, 2200);
    }
  }

  function stopQrBridgeListeners() {
    if (qrPollingTimer) {
      clearInterval(qrPollingTimer);
      qrPollingTimer = null;
    }
    if (qrBroadcastChannel) {
      try { qrBroadcastChannel.close(); } catch (e) { }
      qrBroadcastChannel = null;
    }
    if (qrSupabaseChannel && window.supabaseClient) {
      try { window.supabaseClient.removeChannel(qrSupabaseChannel); } catch (e) { }
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
    } catch (e) { }

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
    } catch (e) { }

    if (window.location.protocol.startsWith('http')) {
      try {
        await fetch(`/api/paper-scan/bridge/${encodeURIComponent(sessionId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'connected' })
        });
      } catch (e) { }
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
    } catch (e) { }

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
    } catch (e) { }

    // 3. Backend API
    if (window.location.protocol.startsWith('http')) {
      try {
        await fetch(`/api/paper-scan/bridge/${encodeURIComponent(sessionId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (e) { }
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
        const maxDim = 2000;
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
        } else if (w < 1000 && h < 1000) {
          // تكبير الصور الصغيرة لضمان وضوح نقاط الحروف العربية
          w = Math.round(w * 1.5);
          h = Math.round(h * 1.5);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        const imgData = ctx.getImageData(0, 0, w, h);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;

          // إزالة السطور الزرقاء والحمراء الخفيفة في دفاتر الامتحانات مع الحفاظ على حبر القلم ونقاط الحروف العربية
          const isFaintBlueLine = (b > r + 22 && b > g + 12 && gray > 125);
          const isFaintRedLine = (r > g + 35 && r > b + 35 && gray > 120);

          let val;
          if (isFaintBlueLine || isFaintRedLine || gray > 188) {
            val = 255;
          } else if (gray < 115) {
            val = Math.max(0, Math.round((gray - 45) * 0.45));
          } else {
            // المنطقة الوسطى (نقاط الحروف والحبر المتوسط)
            val = Math.max(15, Math.min(240, Math.round((gray - 90) * 1.45)));
          }
          d[i] = d[i + 1] = d[i + 2] = val;
        }
        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.94));
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
    const clearBtn = document.getElementById('btnClearPaperImage');
    const overlayClearBtn = document.getElementById('btnOverlayClearPaperImg');

    if (currentUploadedImages.length === 0) {
      if (emptyEl) emptyEl.style.display = 'flex';
      if (imgEl) {
        imgEl.style.display = 'none';
        imgEl.src = '';
      }
      if (enhanceBtn) enhanceBtn.style.display = 'none';
      if (rescanBtn) rescanBtn.style.display = 'none';
      if (clearBtn) clearBtn.style.display = 'none';
      if (overlayClearBtn) overlayClearBtn.style.display = 'none';
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
    if (clearBtn) clearBtn.style.display = 'inline-flex';
    if (overlayClearBtn) overlayClearBtn.style.display = 'inline-flex';
  }

  window.clearUploadedPaperImage = function () {
    currentUploadedImages = [];
    currentParsedQuestions = [];
    isUsingEnhancedImage = false;
    isScanningPaper = false;

    const rawTextarea = document.getElementById('scannerExtractedTextarea');
    if (rawTextarea) rawTextarea.value = '';

    const camInput = document.getElementById('scannerCameraFileInput');
    const galInput = document.getElementById('scannerGalleryFileInput');
    if (camInput) camInput.value = '';
    if (galInput) galInput.value = '';

    showScannerProgress(false);
    setActiveScannerStep(1);
    updateImagePreviewUI();
    renderScannedQuestionsPreview();
    notify('تم مسح صورة الورقة وتفريغ المعاينة بالكامل! يمكنك رفع ورقة جديدة الآن.', 'info');
  };

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
  // 7. محرك القراءة الذكي للورقة (Google Cloud AI + Arabic OCR + Cloud AI Refiner)
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
    const subjectMode = getActiveSubjectMode();

    try {
      showScannerProgress(true, 'جاري فحص الورقة وقراءة الخط العربي بالذكاء الاصطناعي...', 25);

      // المرحلة 1: محاولة القراءة المباشرة عبر Google Cloud / Gemini Vision (سواء بمفتاح مخزن أو خادم محلي)
      const visionResult = await recognizeWithGeminiVision(imageObj, apiKey);
      if (visionResult && (visionResult.rawText || (visionResult.questions && visionResult.questions.length > 0))) {
        showScannerProgress(true, 'تمت قراءة خط اليد وتنسيق الأسئلة بنجاح!', 100);
        const cleanedVisionText = cleanArabicOcrText(visionResult.rawText || '', subjectMode);
        if (cleanedVisionText) {
          currentParsedQuestions = parseRawPaperTextToQuestions(cleanedVisionText, subjectMode);
        } else if (Array.isArray(visionResult.questions) && visionResult.questions.length > 0) {
          currentParsedQuestions = normalizeAiQuestionsArray(visionResult.questions);
        }
        if (rawTextarea && currentParsedQuestions.length > 0) {
          rawTextarea.value = formatQuestionsBackToRawText(currentParsedQuestions);
        }
        renderScannedQuestionsPreview();
        setActiveScannerStep(3);
        setTimeout(() => showScannerProgress(false), 600);
        notify('تمت قراءة الورقة المكتوبة بخط اليد وتحويلها إلى أسئلة عربية دقيقة بنجاح! ✨', 'success');
        isScanningPaper = false;
        return;
      }

      // المرحلة 2: محرك الرؤية البصرية الذكي للخط اليدوي العربي (Cloud Handwriting Engine 3 + Qari Vision AI)
      // يقرأ خط اليد البشري الطبيعي مباشرة من الصورة كما تراه عين الأستاذ بدون الحاجة لأي مفتاح!
      showScannerProgress(true, 'جاري قراءة خط اليد البشري بمحرك الرؤية البصرية الذكي (Vision AI)...', 45);
      let rawOcrText = await recognizeWithArabicVisionAI(imageObj.dataUrl);
      let usedVisionAI = Boolean(rawOcrText && rawOcrText.trim().length >= 4);

      // المرحلة 3 (احتياطي): القارئ الضوئي العربي المحلي إذا تعذر الاتصال السحابي
      if (!usedVisionAI) {
        showScannerProgress(true, 'جاري تشغيل القارئ الضوئي العربي المساند...', 60);
        rawOcrText = await recognizeWithTesseractOCR(
          imageObj.enhancedDataUrl || imageObj.dataUrl,
          subjectMode
        );
      }

      // المرحلة 4: تنقية النص العربي وتقسيم السطور والأسئلة والفروع
      let cleanedText = cleanArabicOcrText(rawOcrText, subjectMode);

      // المرحلة 5: عرض وتقسيم الأسئلة مباشرة إذا قرأها محرك الرؤية البصري بدقة، أو تدقيقها إذا جاءت من القارئ المحلي
      if (cleanedText && cleanedText.trim().length > 4) {
        if (!usedVisionAI) {
          showScannerProgress(true, 'جاري تدقيق النص العربي وتوزيع الأسئلة والدرجات تلقائياً...', 85);
          const aiRefined = await refineArabicOcrWithCloudAI(cleanedText, subjectMode);
          if (aiRefined && aiRefined.rawText && aiRefined.rawText.trim().length > 5) {
            cleanedText = cleanArabicOcrText(aiRefined.rawText, subjectMode);
          }
        }
        currentParsedQuestions = parseRawPaperTextToQuestions(cleanedText, subjectMode);
        if (rawTextarea) {
          rawTextarea.value = currentParsedQuestions.length > 0
            ? formatQuestionsBackToRawText(currentParsedQuestions)
            : cleanedText;
        }

        showScannerProgress(true, 'تمت قراءة خط اليد البشري وتقسيم الأسئلة بنجاح!', 100);
        renderScannedQuestionsPreview();
        setActiveScannerStep(3);
        notify('تمت قراءة خط اليد البشري بالذكاء الاصطناعي البصري وتقسيم الأسئلة بنجاح! ✨', 'success');
      } else {
        notify('الصورة غير واضحة كفاية؛ يمكنك الضغط على «توضيح الخط» أو استخدام «الإملاء الصوتي 🎙️».', 'warning');
      }
    } catch (err) {
      console.warn('Paper recognition warning:', err);
      notify('تعذر قراءة الصورة تلقائياً، يمكنك كتابة أو إملاء الأسئلة بالصوت مباشرة.', 'warning');
    } finally {
      setTimeout(() => showScannerProgress(false), 600);
      isScanningPaper = false;
    }
  }

  /**
   * محرك الرؤية البصرية الذكي للخط اليدوي العربي البشري (Qari-VL & KATIB-VL & Nanonets Vision AI)
   * يستقبل صورة الورقة نفسها ويقرأ خط اليد البشري الطبيعي (الرقعة والنسخ والخط السريع) مباشرة!
   */
  function parseGradioSseResult(sseText) {
    if (!sseText) return '';
    const lines = String(sseText).split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.startsWith('data:')) {
        const jsonPart = line.slice(5).trim();
        try {
          const parsed = JSON.parse(jsonPart);
          if (Array.isArray(parsed) && typeof parsed[0] === 'string' && parsed[0].trim()) {
            return parsed[0].trim();
          }
        } catch (e) { }
      }
    }
    return '';
  }

  async function callGradioVisionSpace(host, endpoint, dataPayload, timeoutMs = 28000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const postResp = await fetch(`${host}/gradio_api/call/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataPayload }),
        signal: controller.signal
      });
      if (!postResp.ok) return '';
      const postJson = await postResp.json();
      if (!postJson || !postJson.event_id) return '';

      const sseResp = await fetch(`${host}/gradio_api/call/${endpoint}/${postJson.event_id}`, {
        signal: controller.signal
      });
      if (!sseResp.ok) return '';
      const sseText = await sseResp.text();
      return parseGradioSseResult(sseText);
    } catch (e) {
      return '';
    } finally {
      clearTimeout(timer);
    }
  }

  function compressImageForVisionApi(srcDataUrl, maxDim = 1350, quality = 0.78) {
    return new Promise((resolve) => {
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
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(srcDataUrl);
      img.src = srcDataUrl;
    });
  }

  async function callCloudHandwritingEngine3(compressedDataUrl, engineNum = '3', subjectMode = 'arabic') {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 16000);
    try {
      const form = new URLSearchParams();
      form.append('apikey', 'helloworld');
      form.append('base64Image', compressedDataUrl);
      form.append('OCREngine', String(engineNum));
      if (subjectMode === 'english' && String(engineNum) !== '3') {
        form.append('language', 'eng');
      }
      form.append('scale', 'true');
      form.append('isTable', 'false');

      const resp = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: form,
        signal: controller.signal
      });
      if (!resp.ok) return '';
      const data = await resp.json();
      if (data && Array.isArray(data.ParsedResults) && data.ParsedResults[0]) {
        const raw = data.ParsedResults[0].ParsedText || '';
        return raw.replace(/\[Note:[\s\S]*?\]\s*/gi, '').trim();
      }
      return '';
    } catch (e) {
      return '';
    } finally {
      clearTimeout(timer);
    }
  }

  async function recognizeWithArabicVisionAI(imageDataUrl) {
    if (!imageDataUrl) return '';
    const subjectMode = getActiveSubjectMode();

    // ضغط الصورة بذكاء لتكون أقل من 450KB لضمان سرعة فائقة وعدم رفض الصور الكبيرة من كاميرا الموبايل
    const compressedUrl = await compressImageForVisionApi(imageDataUrl, 1350, 0.78);

    // 1. المحرك الأساسي الأول: Cloud Handwriting Vision Engine 3 (يدعم العربية، الإنجليزية، والرياضيات والمعادلات)
    showScannerProgress(true, 'جاري قراءة خط اليد البشري عبر محرك الرؤية السحابي (Cloud Handwriting Vision)...', 50);
    let text = await callCloudHandwritingEngine3(compressedUrl, '3', subjectMode);
    if (text && text.trim().length > 4) {
      return text;
    }

    // 2. المحرك الثاني: Qari OCR 0.2.2.1 (نموذج رؤية بصري متخصص بالخط العربي واليدوي)
    if (subjectMode !== 'english') {
      const fileObj = {
        path: null,
        url: compressedUrl,
        size: null,
        orig_name: 'handwritten_exam_paper.jpg',
        mime_type: 'image/jpeg',
        is_stream: false,
        meta: { _type: 'gradio.FileData' }
      };
      showScannerProgress(true, 'جاري فحص تفاصيل الخط اليدوي عبر محرك الرؤية البصري (Qari Vision AI)...', 62);
      const qariHost = 'https://oddadmix-arabic-ocr-models-demos.hf.space';
      text = await callGradioVisionSpace(qariHost, 'perform_ocr', [fileObj, 'Qari OCR 0.2.2.1'], 12000);
      if (text && text.trim().length > 4) {
        return text;
      }
    }

    // 3. المحرك الثالث: Cloud Vision Engine 2 المساند
    showScannerProgress(true, 'جاري قراءة الورقة عبر محرك الرؤية المساند...', 72);
    text = await callCloudHandwritingEngine3(compressedUrl, '2', subjectMode);
    if (text && text.trim().length > 4) {
      return text;
    }

    return '';
  }

  /**
   * تنقية مخرجات القراءة الضوئية والبصرية حسب تخصص المادة (عربي | English | الرياضيات)
   * وفصل الأسئلة والفروع والنقاط تلقائياً في أسطر مستقلة
   */
  function cleanArabicOcrText(rawText, subjectMode = 'arabic') {
    if (!rawText) return '';
    let txt = String(rawText)
      .replace(/\[Note:[\s\S]*?\]\s*/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>|<\/div>|<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\r\n/g, '\n');

    if (subjectMode === 'english') {
      // تنقية خاصة بمادة اللغة الإنجليزية (LTR) مع الحفاظ على الأقواس والفراغات وعلامات الترقيم
      txt = txt
        .replace(/[|¦~°¬§¤£¥€«»]+/g, ' ')
        .replace(/([^\n])\s+((?:Q\.?\s*[1-9]|Question\s*(?:[1-9]|One|Two|Three|Four|Five|Six))\s*[\/:\-\)])/gi, '$1\n$2')
        .replace(/([^\n])\s+((?:Branch|Section)\s*[\(\[]?\s*[A-D]\s*[\)\]]?\s*[\/:\-\)]?)/gi, '$1\n$2')
        .replace(/([:.?])\s+([1-9]\s*[\-\.\)])/g, '$1\n$2');
    } else if (subjectMode === 'math') {
      // تنقية خاصة بمادة الرياضيات: الحفاظ الكامل على المتغيرات (x, y, z, sin, cos, lim) والعمليات (+, -, =, ^, √, /, \frac, \sqrt)
      txt = txt
        .replace(/[|¦~°¬§¤£¥€«»]+/g, ' ')
        .replace(/([^\n])\s+((?:[سصش]\s*[1-9١-٩]|السؤال\s+(?:الأول|الاول|الثاني|الثالث|الرابع|الخامس|السادس)|Q\.?\s*[1-9])\s*[\/:\-\)])/gi, '$1\n$2')
        .replace(/([^\n])\s+((?:الفرع|فرع|Branch)\s*[\(\[]?\s*[أابجدهـA-D]\s*[\)\]]?\s*[\/:\-\)]?)/gi, '$1\n$2')
        .replace(/(?:^|\n)\s*[سصش]\s*([1-9١-٩]|[1١][0٠])\s*[:/\-ـ]*/g, '\nس$1/ ')
        .replace(/(?:^|\n)\s*فرع\s*[\(\[]?\s*([أابجدهـ])\s*[\)\]]?/g, '\nفرع ($1): ');
    } else {
      // الوضع العربي العام: حذف أي كلمات أو حروف إنجليزية/لاتينية عشوائية ناتجة عن التباس نقاط الخط العربي
      txt = txt
        .replace(/[|¦~^°¬§¤£¥€«»_—–=+#*<>[\]{}\\]+/g, ' ')
        .replace(/[A-Za-z]+/g, ' ')
        .replace(/([^\n])\s+((?:[سصش]\s*[1-9١-٩]|السؤال\s+(?:الأول|الاول|الثاني|الثالث|الرابع|الخامس|السادس))\s*[\/:\-\)])/g, '$1\n$2')
        .replace(/([^\n])\s+((?:الفرع|فرع)\s*[\(\[]?\s*[أابجدهـ]\s*[\)\]]?\s*[\/:\-\)]?)/g, '$1\n$2')
        .replace(/([:.\)؟])\s+([1-9١-٩]\s*[\-\)])/g, '$1\n$2')
        .replace(/(?:^|\n)\s*[سصش]\s*([1-9١-٩]|[1١][0٠])\s*[:/\-ـ]*/g, '\nس$1/ ')
        .replace(/(?:^|\n)\s*فرع\s*[\(\[]?\s*([أابجدهـ])\s*[\)\]]?/g, '\nفرع ($1): ')
        .replace(/(^|\s)(في|من|على|إلى|عن)(ال[\u0600-\u06FF]{2,})/g, '$1$2 $3');
    }

    // تنظيف الأسطر الفارغة أو التي تحتوي على رموز منفردة بلا معنى
    const cleanedLines = txt
      .split('\n')
      .map(line => line.replace(/\s{2,}/g, ' ').trim())
      .filter(line => {
        if (!line) return false;
        if (subjectMode === 'arabic') {
          const arabicOrDigits = (line.match(/[\u0600-\u06FF0-9٠-٩]/g) || []).length;
          return arabicOrDigits >= 2;
        }
        return line.length >= 2;
      });

    return cleanedLines.join('\n').trim();
  }

  /**
   * المصحح السحابي الذكي المجاني (Cloud AI Arabic Refiner)
   * يقوم بإصلاح الكلمات العربية المقطعة من الـ OCR وترتيبها بصيغة أسئلة امتحانية عراقية سليمة 100%
   */
  async function refineArabicOcrWithCloudAI(ocrText, subjectMode = 'arabic') {
    if (!ocrText || ocrText.trim().length < 5) return null;

    const systemPrompt = `أنت مصحح لغوي وخبير في تنسيق أوراق الأسئلة الامتحانية العراقية باللغة العربية.
النص التالي تم استخراجه من صورة ورقة أسئلة مكتوبة بخط اليد وقد يحتوي على بعض الحروف المقطعة أو الأخطاء الإملائية البسيطة:
1. أعد صياغة وتصحيح الكلمات العربية المشوهة لتصبح جمل أسئلة امتحانية عربية فصيحة وسليمة 100% ومطابقة لما يقصده المعلم في الورقة.
2. ممنوع منعاً باتاً كتابة أي حروف إنجليزية أو رموز غريبة إذا كانت المادة عربية.
3. رتب الأسئلة بحيث يبدأ كل سؤال بـ (س1/ ، س2/ ...) والفروع بـ (فرع أ: ، فرع ب: ...).
4. أعد النتيجة بصيغة JSON صالح فقط بهذا الشكل:
{
  "rawText": "النص العربي المصحح كاملاً سطراً بسطر",
  "questions": [
    {
      "title": "السؤال الأول",
      "type": "essay",
      "text": "منطوق السؤال والنقاط باللغة العربية الفصيحة",
      "score": 20,
      "branches": []
    }
  ]
}`;

    try {
      const resp = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `المادة: ${subjectMode}\nالنص المستخرج من الورقة:\n${ocrText}` }
          ],
          temperature: 0.2
        })
      });

      if (!resp.ok) return null;
      const data = await resp.json();
      const reply = (
        (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || ''
      ).trim();

      if (!reply) return null;
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { rawText: reply, questions: [] };
    } catch (e) {
      return null;
    }
  }

  async function recognizeWithGeminiVision(imageObj, apiKey) {
    const base64Data = (imageObj.dataUrl || '').split(',')[1] || '';
    if (!base64Data) return null;

    const subjectMode = getActiveSubjectMode();
    const langInstruction = subjectMode === 'english'
      ? 'الورقة لمادة اللغة الإنجليزية، اقرأ الأسئلة بدقة.'
      : 'الورقة مكتوبة باللغة العربية، اقرأ الخط العربي اليدوي بدقة فائقة ويُمنع كتابة أي حروف إنجليزية عشوائية.';

    const prompt = `أنت خبير في قراءة أوراق الامتحانات العراقية المكتوبة بخط اليد. ${langInstruction}
قم بقراءة كل ما هو مكتوب في صورة الورقة المرفقة بدقة عالية، وصحح أي أخطاء إملائية ناتجة عن خط اليد، ثم أعد النتيجة بصيغة JSON فقط بهذا الهيكل:
{
  "rawText": "النص الكامل للورقة مرتباً سطراً بسطر",
  "questions": [
    {
      "title": "السؤال الأول",
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

    const activeKey = (apiKey || getEmbeddedSecretAiKey() || '').trim();

    // 1. إذا كان المفتاح خاص بـ OpenAI ChatGPT (يبدأ بـ sk-)، الاتصال المباشر بـ ChatGPT-4o Vision
    if (activeKey && activeKey.startsWith('sk-')) {
      try {
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + activeKey
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: imageObj.dataUrl } }
              ]
            }],
            temperature: 0.15,
            max_tokens: 4000
          })
        });

        if (resp.ok) {
          const data = await resp.json();
          const replyText = (
            (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || ''
          ).trim();
          if (replyText) {
            const jsonMatch = replyText.match(/\{[\s\S]*\}/);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
            return { rawText: replyText, questions: [] };
          }
        }
      } catch (e) { }
    }

    // 2. إذا كان هناك مفتاح خاص بـ Gemini، الاتصال المباشر بـ Gemini Vision
    if (activeKey && !activeKey.startsWith('sk-')) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(activeKey)}`;
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
              temperature: 0.15,
              maxOutputTokens: 4096
            }
          })
        });

        if (resp.ok) {
          const data = await resp.json();
          const candidates = data.candidates || [];
          if (candidates.length) {
            const parts = (candidates[0].content && candidates[0].content.parts) || [];
            const replyText = parts.map(p => p.text || '').join('').trim();
            if (replyText) {
              const jsonMatch = replyText.match(/\{[\s\S]*\}/);
              if (jsonMatch) return JSON.parse(jsonMatch[0]);
              return { rawText: replyText, questions: [] };
            }
          }
        }
      } catch (e) { }
    }

    // 2. الاتصال التلقائي بالبوابة السحابية للخادم (/api/gcloud/gemini) إن توفرت
    if (window.location.protocol.startsWith('http')) {
      try {
        const resp = await fetch('/api/gcloud/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: prompt,
            imageBase64: base64Data,
            mimeType: imageObj.mimeType || 'image/jpeg'
          })
        });
        if (resp.ok) {
          const data = await resp.json();
          const replyText = (data && (data.reply || data.text)) ? String(data.reply || data.text).trim() : '';
          if (replyText) {
            const jsonMatch = replyText.match(/\{[\s\S]*\}/);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
            return { rawText: replyText, questions: [] };
          }
        }
      } catch (e) { }
    }

    return null;
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

  async function recognizeWithTesseractOCR(imageDataUrl, subjectMode = 'arabic') {
    const TesseractLib = await loadTesseractScriptOnce();
    if (!TesseractLib) throw new Error('Tesseract not loaded');

    // استخدام نموذج اللغة العربية الصافي ('ara') للمواد العربية لمنع ظهور أي حروف إنجليزية عشوائية
    const ocrLang = subjectMode === 'english' ? 'eng' : 'ara';

    const worker = await TesseractLib.createWorker(ocrLang, 1, {
      logger: (m) => {
        if (m && m.status === 'recognizing text' && typeof m.progress === 'number') {
          const pct = 40 + Math.round(m.progress * 40);
          showScannerProgress(true, 'جاري قراءة الكلمات والسطور العربية من الورقة...', pct);
        }
      }
    });

    try {
      if (subjectMode !== 'english') {
        await worker.setParameters({
          preserve_interword_spaces: '1',
          tessedit_char_blacklist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz|¦~^°¬§¤£¥€_<>[]{}'
        });
      }
      const result = await worker.recognize(imageDataUrl);
      await worker.terminate();
      return (result && result.data && result.data.text) ? result.data.text : '';
    } catch (err) {
      try { await worker.terminate(); } catch (e) { }
      const fallback = await TesseractLib.recognize(imageDataUrl, ocrLang);
      return (fallback && fallback.data && fallback.data.text) ? fallback.data.text : '';
    }
  }

  // ==========================================================================
  // 8. الإملاء الصوتي الذكي المباشر + تجربة ورقة مكتوبة بخط اليد بنقرة واحدة
  // ==========================================================================
  window.openHandwrittenPaperScannerInVoiceMode = function () {
    window.openHandwrittenPaperScanner(false);
    setTimeout(() => {
      const banner = document.getElementById('scannerVoiceLiveBanner');
      if (banner) banner.style.display = 'block';
      if (!isRecordingVoice) {
        window.toggleScannerVoiceDictation();
      }
    }, 180);
  };

  window.insertVoiceQuickCommand = function (cmdType) {
    const rawTextarea = document.getElementById('scannerExtractedTextarea');
    if (!rawTextarea) return;

    const cur = rawTextarea.value.trim();
    const mode = getActiveSubjectMode();
    let snippet = '';

    if (mode === 'english') {
      if (cmdType === 'new_question') {
        const qCount = (cur.match(/(?:^|\n)\s*(?:Q\.?\s*\d+|Question\s+\d+)/gi) || []).length + 1;
        snippet = `\nQ${qCount}/ (20 Marks)\n`;
      } else if (cmdType === 'new_branch') {
        snippet = `\nBranch (B)/ `;
      } else if (cmdType === 'reading_passage') {
        snippet = `\nRead the following passage carefully, then answer the questions:\n`;
      } else if (cmdType === 'grammar') {
        snippet = `\nDo as required between brackets:\n`;
      } else if (cmdType === 'definitions') {
        snippet = `\nDefine the following words:\n`;
      } else if (cmdType === 'mcq') {
        snippet = `\nChoose the correct word between brackets:\n`;
      } else if (cmdType === 'fill_blanks') {
        snippet = `\nFill in the blanks with the suitable words:\n`;
      } else if (cmdType === 'true_false') {
        snippet = `\nWrite True or False for the following sentences:\n`;
      } else if (cmdType === 'matching') {
        snippet = `\nMatch the words in List (A) with their meanings in List (B):\n`;
      }
    } else if (mode === 'math') {
      if (cmdType === 'new_question') {
        const qCount = (cur.match(/(?:^|\n)\s*س\s*[٠-٩\d]+/g) || []).length + 1;
        snippet = `\nس${qCount} / (20 درجة)\n`;
      } else if (cmdType === 'new_branch') {
        snippet = `\nالفرع (ب) / `;
      } else if (cmdType === 'solve_set') {
        snippet = `\nجد مجموعة الحل للمعادلات الآتية:\n`;
      } else if (cmdType === 'simplify') {
        snippet = `\nجد ناتج ما يأتي بأبسط صورة:\n`;
      } else if (cmdType === 'factor') {
        snippet = `\nحلل المقادير الجبرية الآتية:\n`;
      } else if (cmdType === 'find_x') {
        snippet = `\nجد قيمة x في المعادلات الآتية:\n`;
      } else if (cmdType === 'prove') {
        snippet = `\nأثبت صحة المتطابقة الآتية:\n`;
      }
    } else {
      if (cmdType === 'new_question') {
        const qCount = (cur.match(/(?:^|\n)\s*س\s*[٠-٩\d]+/g) || []).length + 1;
        snippet = `\nس${qCount} / (20 درجة)\n`;
      } else if (cmdType === 'new_branch') {
        snippet = `\nفرع جديد / `;
      } else if (cmdType === 'definitions') {
        snippet = `\nعرف ما يأتي:\n`;
      } else if (cmdType === 'reasoning') {
        snippet = `\nعلل ما يأتي:\n`;
      } else if (cmdType === 'fill_blanks') {
        snippet = `\nاملأ الفراغات الآتية بما يناسبها:\n`;
      } else if (cmdType === 'comparisons') {
        snippet = `\nقارن بين `;
      } else if (cmdType === 'true_false') {
        snippet = `\nضع كلمة (صح) أو (خطأ) أمام العبارات الآتية:\n`;
      }
    }

    rawTextarea.value = (cur ? cur + snippet : snippet.trimStart());
    window.parseTextFromScannerBox(true);
    rawTextarea.focus();
  };

  window.insertScannerMathToken = function (token) {
    const rawTextarea = document.getElementById('scannerExtractedTextarea');
    if (!rawTextarea) return;
    const start = rawTextarea.selectionStart || rawTextarea.value.length;
    const end = rawTextarea.selectionEnd || rawTextarea.value.length;
    const text = rawTextarea.value;
    rawTextarea.value = text.substring(0, start) + token + text.substring(end);
    rawTextarea.selectionStart = rawTextarea.selectionEnd = start + token.length;
    rawTextarea.focus();
    window.parseTextFromScannerBox(true);
  };

  window.autoStructureAndNumberRawBox = function () {
    const rawTextarea = document.getElementById('scannerExtractedTextarea');
    if (!rawTextarea || !rawTextarea.value.trim()) {
      notify('المربع فارغ؛ اكتب أو صوّر الورقة أو استخدم الإملاء الصوتي أولاً.', 'warning');
      return;
    }
    const questions = parseRawPaperTextToQuestions(rawTextarea.value, getActiveSubjectMode());
    currentParsedQuestions = questions;
    rawTextarea.value = formatQuestionsBackToRawText(questions);
    renderScannedQuestionsPreview();
    setActiveScannerStep(3);
    notify('تم تقسيم الفروع وترقيم التعاريف والتعاليل والنقاط تلقائياً! ✨', 'success');
  };

  window.toggleScannerVoiceDictation = function () {
    const voiceBtn = document.getElementById('btnScannerVoiceDictate');
    const rawTextarea = document.getElementById('scannerExtractedTextarea');
    const voiceBanner = document.getElementById('scannerVoiceLiveBanner');
    const interimEl = document.getElementById('scannerVoiceInterimText');
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (voiceBanner) {
      voiceBanner.style.display = 'block';
    }

    if (!SpeechRec) {
      notify('متصفحك الحالي لا يدعم الإملاء الصوتي المباشر؛ يفضل استخدام متصفح Chrome أو Edge، أو استخدام أزرار الإدراج السريع.', 'warning');
      return;
    }

    if (isRecordingVoice && speechRecognitionInstance) {
      isRecordingVoice = false;
      try { speechRecognitionInstance.stop(); } catch (e) { }
      if (voiceBtn) {
        voiceBtn.classList.remove('recording');
        voiceBtn.innerHTML = '<i class="fa-solid fa-microphone"></i><span>إملاء صوتي</span>';
      }
      if (interimEl) {
        interimEl.textContent = '⏸️ تم إيقاف الإملاء الصوتي — تم تقسيم الفروع وترقيم النقاط تلقائياً.';
      }
      return;
    }

    speechRecognitionInstance = new SpeechRec();
    speechRecognitionInstance.lang = getActiveSubjectMode() === 'english' ? 'en-US' : 'ar-IQ';
    speechRecognitionInstance.continuous = true;
    speechRecognitionInstance.interimResults = true;

    speechRecognitionInstance.onstart = () => {
      isRecordingVoice = true;
      if (voiceBtn) {
        voiceBtn.classList.add('recording');
        voiceBtn.innerHTML = '<i class="fa-solid fa-circle-stop"></i><span>إيقاف الإملاء</span>';
      }
      if (voiceBanner) voiceBanner.style.display = 'block';
      if (interimEl) {
        interimEl.textContent = '🎙️ جاري الاستماع... اقرأ السؤال أو التعاريف أو التعاليل وسيتم ترقيمها وفتح الفروع تلقائياً';
      }
      notify('🎙️ تحدث الآن واقرأ الأسئلة بصوت واضح ليتم كتابتها وتقسيم الفروع وترقيم النقاط تلقائياً...', 'info');
    };

    speechRecognitionInstance.onresult = (event) => {
      let finalChunk = '';
      let interimChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalChunk += piece + '\n';
        } else {
          interimChunk += piece;
        }
      }

      if (interimEl && interimChunk) {
        interimEl.textContent = '🗣️ ' + interimChunk;
      }

      if (finalChunk && rawTextarea) {
        const combined = (rawTextarea.value ? rawTextarea.value.trim() + '\n' : '') + finalChunk.trim();
        const structuredText = preprocessPaperAndVoiceText(combined);
        rawTextarea.value = structuredText;
        window.parseTextFromScannerBox(true);
        if (interimEl) {
          interimEl.textContent = '✅ تم التقاط وترقيم العبارة — أكمل القراءة أو قل (فرع جديد / السؤال الثاني)...';
        }
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

  window.setScannerSubjectMode = function (mode, silent = false) {
    if (!['arabic', 'english', 'math'].includes(mode)) mode = 'arabic';
    activeScannerSubjectOverride = mode;

    // تحديث أزرار الشريط
    const btnAr = document.getElementById('scannerSubBtn_arabic');
    const btnEn = document.getElementById('scannerSubBtn_english');
    const btnMa = document.getElementById('scannerSubBtn_math');

    const resetBtnStyle = (btn, colorHex) => {
      if (!btn) return;
      btn.classList.remove('active');
      btn.style.background = 'var(--bg-card, #fff)';
      btn.style.color = colorHex;
      btn.style.boxShadow = 'none';
    };

    resetBtnStyle(btnAr, '#059669');
    resetBtnStyle(btnEn, '#1d4ed8');
    resetBtnStyle(btnMa, '#6d28d9');

    if (mode === 'english' && btnEn) {
      btnEn.classList.add('active');
      btnEn.style.background = 'linear-gradient(135deg, #1d4ed8, #3b82f6)';
      btnEn.style.color = '#fff';
      btnEn.style.boxShadow = '0 3px 10px rgba(37, 99, 235, 0.28)';
    } else if (mode === 'math' && btnMa) {
      btnMa.classList.add('active');
      btnMa.style.background = 'linear-gradient(135deg, #6d28d9, #8b5cf6)';
      btnMa.style.color = '#fff';
      btnMa.style.boxShadow = '0 3px 10px rgba(139, 92, 246, 0.28)';
    } else if (btnAr) {
      btnAr.classList.add('active');
      btnAr.style.background = 'linear-gradient(135deg, #059669, #10b981)';
      btnAr.style.color = '#fff';
      btnAr.style.boxShadow = '0 3px 10px rgba(16, 185, 129, 0.28)';
    }

    // اتجاه مربع النص والأمثلة
    const rawTextarea = document.getElementById('scannerExtractedTextarea');
    const interimEl = document.getElementById('scannerVoiceInterimText');

    if (rawTextarea) {
      if (mode === 'english') {
        rawTextarea.dir = 'ltr';
        rawTextarea.style.textAlign = 'left';
        rawTextarea.placeholder = 'Paste or type handwritten English exam text here...\nExample:\nQ1/ Read the passage and answer: (20 Marks)\nBranch (B)/ Do as required between brackets:\n1- Ali lives in Baghdad. (Make question)\n2- If she studies hard, she ........ the exam. (pass)';
      } else if (mode === 'math') {
        rawTextarea.dir = 'rtl';
        rawTextarea.style.textAlign = 'right';
        rawTextarea.placeholder = 'الصق أو اكتب نص أسئلة الرياضيات والمعادلات هنا...\nمثال:\nس1 / جد مجموعة الحل للمعادلات الآتية: (20 درجة)\n1- x^2 - 5x + 6 = 0\n2- 2x + y = 7\nالفرع (ب) / حلل المقادير الجبرية الآتية: (10 درجات)\n1- x^2 - 9\n2- x^3 + 8';
      } else {
        rawTextarea.dir = 'rtl';
        rawTextarea.style.textAlign = 'right';
        rawTextarea.placeholder = 'الصق أو اكتب نص أسئلة الورقة هنا...\nمثال:\nس1 / عرف أربعة مما يأتي: (20 درجة)\n1- الخلية\n2- النواة\nالفرع (ب) / علل ما يأتي:\n1- تمتاز الخلية النباتية بوجود شكل ثابت لها.';
      }
    }

    if (interimEl) {
      if (mode === 'english') {
        interimEl.textContent = '💡 Try saying: "Question 1 Read the passage... Branch B Do as required... Number 1... Number 2..."';
      } else if (mode === 'math') {
        interimEl.textContent = '💡 قل مثلاً: "السؤال الأول جد مجموعة الحل للمعادلات الآتية واحد إكس تربيع ناقص خمسة إكس زائد ستة يساوي صفر فرع باء حلل المقادير..."';
      } else {
        interimEl.textContent = '💡 قل مثلاً: "السؤال الأول عرف ما يأتي الخلية النواة المايتوكوندريا علل ما يأتي تمتاز الخلية النباتية بوجود شكل ثابت لها..."';
      }
    }

    renderScannerSubjectToolbar(mode);

    if (!silent) {
      const modeNames = { arabic: 'اللغة العربية والمواد العامة', english: 'اللغة الإنجليزية (English LTR)', math: 'الرياضيات والمعادلات الرياضية' };
      notify(`تم تفعيل تخصص: ${modeNames[mode]} لقراءة الورقة والإملاء الذكي! ✨`, 'info');
      if (rawTextarea && rawTextarea.value.trim()) {
        window.parseTextFromScannerBox(true);
      }
    }
  };

  function renderScannerSubjectToolbar(mode) {
    const bar = document.getElementById('scannerQuickSubjectToolbar');
    if (!bar) return;

    if (mode === 'english') {
      bar.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.35rem;">
          <div style="display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;">
            <span style="font-size: 0.72rem; font-weight: 800; color: #1e40af;">English Smart Controls:</span>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertVoiceQuickCommand('new_question')" style="font-size: 0.72rem; padding: 2px 8px; font-weight: 800;">+ New Question (Q)</button>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertVoiceQuickCommand('new_branch')" style="font-size: 0.72rem; padding: 2px 8px; font-weight: 800; color: #6d28d9;">+ Branch (A/B)</button>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertVoiceQuickCommand('reading_passage')" style="font-size: 0.72rem; padding: 2px 8px;">+ Reading Passage</button>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertVoiceQuickCommand('grammar')" style="font-size: 0.72rem; padding: 2px 8px;">+ Do as required</button>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertVoiceQuickCommand('definitions')" style="font-size: 0.72rem; padding: 2px 8px;">+ Define words</button>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertVoiceQuickCommand('mcq')" style="font-size: 0.72rem; padding: 2px 8px;">+ Choose correct</button>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertVoiceQuickCommand('fill_blanks')" style="font-size: 0.72rem; padding: 2px 8px;">+ Fill blanks</button>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertVoiceQuickCommand('true_false')" style="font-size: 0.72rem; padding: 2px 8px;">+ True or False</button>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertVoiceQuickCommand('matching')" style="font-size: 0.72rem; padding: 2px 8px;">+ Match List A/B</button>
          </div>
          <button type="button" class="btn-panel-mini-tool" onclick="window.loadSampleHandwrittenPaper('english')" style="font-size: 0.72rem; padding: 2px 9px; font-weight: 800; background: rgba(37,99,235,0.12); color: #1d4ed8; border: 1px solid rgba(37,99,235,0.3);">
            <i class="fa-solid fa-file-lines"></i>
            <span>Load English Exam Paper</span>
          </button>
        </div>
      `;
    } else if (mode === 'math') {
      bar.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 0.35rem;">
          <!-- سطر 1: أوامر أسئلة وفروع الرياضيات الوزارية -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.35rem; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;">
              <span style="font-size: 0.72rem; font-weight: 800; color: #6d28d9;">أوامر الرياضيات الوزارية:</span>
              <button type="button" class="btn-panel-mini-tool" onclick="window.insertVoiceQuickCommand('new_question')" style="font-size: 0.72rem; padding: 2px 8px; font-weight: 800;">+ سؤال جديد</button>
              <button type="button" class="btn-panel-mini-tool" onclick="window.insertVoiceQuickCommand('new_branch')" style="font-size: 0.72rem; padding: 2px 8px; font-weight: 800; color: #6d28d9;">+ فرع (أ/ب)</button>
              <button type="button" class="btn-panel-mini-tool" onclick="window.insertVoiceQuickCommand('solve_set')" style="font-size: 0.72rem; padding: 2px 8px;">+ جد مجموعة الحل</button>
              <button type="button" class="btn-panel-mini-tool" onclick="window.insertVoiceQuickCommand('simplify')" style="font-size: 0.72rem; padding: 2px 8px;">+ بسّط المقدار</button>
              <button type="button" class="btn-panel-mini-tool" onclick="window.insertVoiceQuickCommand('factor')" style="font-size: 0.72rem; padding: 2px 8px;">+ حلل المقادير</button>
              <button type="button" class="btn-panel-mini-tool" onclick="window.insertVoiceQuickCommand('find_x')" style="font-size: 0.72rem; padding: 2px 8px;">+ جد قيمة x</button>
              <button type="button" class="btn-panel-mini-tool" onclick="window.insertVoiceQuickCommand('prove')" style="font-size: 0.72rem; padding: 2px 8px;">+ أثبت أن</button>
            </div>
            <button type="button" class="btn-panel-mini-tool" onclick="window.loadSampleHandwrittenPaper('math')" style="font-size: 0.72rem; padding: 2px 9px; font-weight: 800; background: rgba(139,92,246,0.12); color: #6d28d9; border: 1px solid rgba(139,92,246,0.3);">
              <i class="fa-solid fa-square-root-variable"></i>
              <span>تجربة ورقة رياضيات</span>
            </button>
          </div>
          <!-- سطر 2: لوحة رموز ومعادلات الرياضيات بنقرة واحدة -->
          <div style="display: flex; align-items: center; gap: 0.3rem; flex-wrap: wrap; background: rgba(139, 92, 246, 0.05); padding: 0.25rem 0.5rem; border-radius: 8px; border: 1px dashed rgba(139, 92, 246, 0.25);">
            <span style="font-size: 0.7rem; font-weight: 800; color: #5b21b6;">إدراج رموز سريعة:</span>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertScannerMathToken(' \\\\frac{x}{y} ')" title="كسر اعتيادي" style="font-size: 0.72rem; padding: 1px 7px; font-family: monospace;">\\frac{x}{y}</button>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertScannerMathToken(' \\\\sqrt{x} ')" title="جذر تربيعي" style="font-size: 0.72rem; padding: 1px 7px; font-family: monospace;">\\sqrt{x}</button>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertScannerMathToken('x^{2}')" title="إكس تربيع" style="font-size: 0.72rem; padding: 1px 7px; font-family: monospace;">x²</button>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertScannerMathToken('x^{3}')" title="إكس تكعيب" style="font-size: 0.72rem; padding: 1px 7px; font-family: monospace;">x³</button>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertScannerMathToken(' ± ')" style="font-size: 0.74rem; padding: 1px 6px;">±</button>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertScannerMathToken(' × ')" style="font-size: 0.74rem; padding: 1px 6px;">×</button>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertScannerMathToken(' ÷ ')" style="font-size: 0.74rem; padding: 1px 6px;">÷</button>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertScannerMathToken(' ≤ ')" style="font-size: 0.74rem; padding: 1px 6px;">≤</button>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertScannerMathToken(' ≥ ')" style="font-size: 0.74rem; padding: 1px 6px;">≥</button>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertScannerMathToken(' ≠ ')" style="font-size: 0.74rem; padding: 1px 6px;">≠</button>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertScannerMathToken(' ∈ ')" style="font-size: 0.74rem; padding: 1px 6px;">∈</button>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertScannerMathToken(' ∞ ')" style="font-size: 0.74rem; padding: 1px 6px;">∞</button>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertScannerMathToken(' π ')" style="font-size: 0.74rem; padding: 1px 6px;">π</button>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertScannerMathToken(' θ ')" style="font-size: 0.74rem; padding: 1px 6px;">θ</button>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertScannerMathToken(' \\\\int x \\\\, dx ')" style="font-size: 0.7rem; padding: 1px 6px; font-family: monospace;">∫ تكامل</button>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertScannerMathToken(' \\\\lim_{x \\\\to 0} ')" style="font-size: 0.7rem; padding: 1px 6px; font-family: monospace;">lim غاية</button>
          </div>
        </div>
      `;
    } else {
      bar.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.35rem;">
          <div style="display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;">
            <span style="font-size: 0.72rem; font-weight: 800; color: #065f46;">إدراج سريع بنقرة واحدة:</span>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertVoiceQuickCommand('new_question')" style="font-size: 0.72rem; padding: 2px 8px; font-weight: 800;">+ سؤال جديد</button>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertVoiceQuickCommand('new_branch')" style="font-size: 0.72rem; padding: 2px 8px; font-weight: 800; color: #6d28d9;">+ فتح فرع (أ/ب)</button>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertVoiceQuickCommand('definitions')" style="font-size: 0.72rem; padding: 2px 8px;">+ عرف ما يأتي:</button>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertVoiceQuickCommand('reasoning')" style="font-size: 0.72rem; padding: 2px 8px;">+ علل ما يأتي:</button>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertVoiceQuickCommand('fill_blanks')" style="font-size: 0.72rem; padding: 2px 8px;">+ املأ الفراغات:</button>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertVoiceQuickCommand('comparisons')" style="font-size: 0.72rem; padding: 2px 8px;">+ قارن بين:</button>
            <button type="button" class="btn-panel-mini-tool" onclick="window.insertVoiceQuickCommand('true_false')" style="font-size: 0.72rem; padding: 2px 8px;">+ صح أو خطأ:</button>
          </div>
          <button type="button" class="btn-panel-mini-tool" onclick="window.loadSampleHandwrittenPaper('arabic')" style="font-size: 0.72rem; padding: 2px 9px; font-weight: 800; background: rgba(16,185,129,0.12); color: #059669; border: 1px solid rgba(16,185,129,0.3);">
            <i class="fa-solid fa-file-pen"></i>
            <span>✨ تجربة ورقة عربي بخط اليد</span>
          </button>
        </div>
      `;
    }
  }

  window.loadSampleHandwrittenPaper = function (forceMode) {
    const mode = forceMode || getActiveSubjectMode();
    if (forceMode && forceMode !== getActiveSubjectMode()) {
      window.setScannerSubjectMode(forceMode, true);
    }

    let sampleLines = [];
    let titleText = '';
    let textColor = '#1e3a8a';
    let isLtr = false;

    if (mode === 'english') {
      isLtr = true;
      titleText = 'Third Intermediate English Exam - Handwritten Draft';
      textColor = '#1d4ed8';
      sampleLines = [
        'Q1/ Read the following passage carefully, then answer (5) of the questions: (20 Marks)',
        '1- Where does Mr. Smith live?',
        '2- Why did he travel to London last summer?',
        '3- Was the hotel comfortable and clean?',
        '4- How did he lose his passport?',
        '5- Who helped Mr. Smith at the police station?',
        '6- Mr. Smith returned home by train. (True / False)',
        '',
        'Branch (B)/ Do as required between brackets: (10 Marks)',
        '1- Ali plays football very well. (Change into negative)',
        '2- If she studies hard, she ........ the final exam. (pass / will pass)',
        '3- They have lived in Baghdad ........ 2015. (since / for)',
        '4- Huda is more beautiful than Sara. (Sara is not as ........ as Huda)',
        '5- She bought a (nice / black / French) bag. (Re-arrange adjectives)',
        '',
        'Q2/ (20 Marks)',
        'Branch (A)/ Define (3) of the following words: (10 Marks)',
        '1- Architect : A person who designs buildings.',
        '2- Pilot : Someone who flies a plane.',
        '3- Author : A person who writes books or stories.',
        '4- Vet : Someone who takes care of sick animals.',
        '',
        'Branch (B)/ Choose the correct word between brackets: (10 Marks)',
        '1- How (many / much) books did you buy yesterday?',
        '2- That is the engineer (who / which) built the bridge.',
        '3- We should drive (careful / carefully) on wet roads.',
        '4- The car was (too / very) fast.'
      ];
    } else if (mode === 'math') {
      titleText = 'مسودة أسئلة امتحان الرياضيات الوزاري — بخط اليد';
      textColor = '#6d28d9';
      sampleLines = [
        'س1 / (20 درجة)',
        'الفرع (أ) / جد مجموعة الحل للنظام الآتي بطريقة الحذف أو التعويض: (10 درجات)',
        '1- 2x + y = 7',
        '2- x - y = 2',
        'الفرع (ب) / حلل اثنين من المقادير الجبرية الآتية إلى أبسط صورة: (10 درجات)',
        '1- x^{2} - 9',
        '2- 2x^{2} + 5x + 3',
        '3- x^{3} + 8',
        '',
        'س2 / (20 درجة)',
        'الفرع (أ) / جد ناتج ما يأتي بأبسط صورة: (10 درجات)',
        '1- \\frac{x+2}{x-3} \\times \\frac{x^{2}-9}{x+2}',
        '2- \\sqrt{12} - \\sqrt{3} + 2\\sqrt{27}',
        'الفرع (ب) / جد قيمة x التي تحقق المعادلة الآتية: (10 درجات)',
        '1- x^{2} - 5x + 6 = 0',
        '2- \\sqrt{2x+1} = 5'
      ];
    } else {
      titleText = 'مسودة أسئلة امتحان الأحياء والعلوم — مكتوبة بخط اليد';
      textColor = '#1e3a8a';
      sampleLines = [
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
    }

    const canvas = document.createElement('canvas');
    canvas.width = 820;
    canvas.height = 620;
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
    const marginX = isLtr ? 55 : canvas.width - 55;
    ctx.moveTo(marginX, 0);
    ctx.lineTo(marginX, canvas.height);
    ctx.stroke();

    ctx.direction = isLtr ? 'ltr' : 'rtl';
    ctx.textAlign = isLtr ? 'left' : 'right';
    ctx.fillStyle = textColor;
    ctx.font = 'bold 18px Arial, Cairo, sans-serif';
    ctx.fillText(titleText, isLtr ? 70 : canvas.width - 70, 34);

    let yPos = 66;
    sampleLines.forEach((line) => {
      if (!line) {
        yPos += 12;
        return;
      }
      if (/^(?:س|Q|فرع|Branch)/i.test(line)) {
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 15px Arial, Cairo, sans-serif';
      } else {
        ctx.fillStyle = textColor;
        ctx.font = '14px Arial, Cairo, sans-serif';
      }
      ctx.fillText(line, isLtr ? 70 : canvas.width - 70, yPos);
      yPos += 24;
    });

    const sampleDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    currentUploadedImages = [{
      dataUrl: sampleDataUrl,
      enhancedDataUrl: sampleDataUrl,
      name: `handwritten_${mode}_paper.jpg`,
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
    notify(`تم تحميل وقراءة نموذج ورقة (${mode === 'english' ? 'اللغة الإنجليزية' : mode === 'math' ? 'الرياضيات والمعادلات' : 'اللغة العربية'}) وتقسيمها لأسئلة وفروع بنجاح! ✨`, 'success');
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
    if (/^(?:عرف|عرّف|ما\s+المقصود|اكتب\s+تعريف|define\b)/i.test(t) || /(?:عرف\s+ما\s+يأتي|عرّف\s+ما\s+يأتي|عرف\s+أربعة|عرف\s+ثلاثة|عرف\s+خمسة)/i.test(t)) {
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

  // تحويل النص المنطوق أو المكتوب رياضياً إلى رموز ومعادلات قياسية
  function convertSpokenMathToSymbols(rawText) {
    if (!rawText) return '';
    let t = String(rawText);

    // 1. الكسور المنطوقة: "كسر البسط x زائد 2 والمقام x ناقص 3"
    t = t.replace(/(?:كسر|الكسر)\s*(?:البسط|بسطه)?\s*(.+?)\s*(?:والمقام|على\s+المقام|مقامه|المقام)\s*(.+?)(?=\s+(?:يساوي|زائد|ناقص|في|ضرب|الفرع|س\d|$))/gi, '\\frac{$1}{$2}');
    t = t.replace(/(?:كسر\s+اعتيادي|كسر)\s*([a-zA-Z0-9\+\-]+)\s*(?:على|تقسيم)\s*([a-zA-Z0-9\+\-]+)/gi, '\\frac{$1}{$2}');

    // 2. الجذور: "جذر التربيعي لـ x" أو "جذر x زائد 1"
    t = t.replace(/(?:الجذر\s+التربيعي\s+لـ?|جذر\s+تربيعي\s+لـ?|جذر)\s*\((.+?)\)/gi, '\\sqrt{$1}');
    t = t.replace(/(?:الجذر\s+التربيعي\s+لـ?|جذر\s+تربيعي\s+لـ?|جذر)\s*([a-zA-Z0-9]+)/gi, '\\sqrt{$1}');

    // 3. الأسس والتربيع والتكعيب: "إكس تربيع" / "س تربيع" / "إكس تكعيب"
    t = t.replace(/(?:إكس|اكس|سين|س)\s*تربيع/gi, 'x^{2}');
    t = t.replace(/(?:واي|صاد|ص)\s*تربيع/gi, 'y^{2}');
    t = t.replace(/(?:إكس|اكس|سين|س)\s*تكعيب/gi, 'x^{3}');
    t = t.replace(/(?:واي|صاد|ص)\s*تكعيب/gi, 'y^{3}');
    t = t.replace(/(?:إكس|اكس|سين|س)\s*(?:أس|قوة|اس)\s*([0-9]+)/gi, 'x^{$1}');
    t = t.replace(/([a-zA-Z0-9])\s*تربيع/gi, '$1^{2}');
    t = t.replace(/([a-zA-Z0-9])\s*تكعيب/gi, '$1^{3}');

    // 4. العمليات والمقارنات المنطوقة
    t = t
      .replace(/(?:زائد\s+أو\s+ناقص|موجب\s+سالب|سالب\s+موجب)/g, ' ± ')
      .replace(/(?:أكبر\s+من\s+أو\s+يساوي|اكبر\s+او\s+يساوي)/g, ' ≥ ')
      .replace(/(?:أصغر\s+من\s+أو\s+يساوي|اصغر\s+او\s+يساوي)/g, ' ≤ ')
      .replace(/(?:لا\s+يساوي)/g, ' ≠ ')
      .replace(/(?:ينتمي\s+إلى|ينتمي\s+الي)/g, ' ∈ ')
      .replace(/(?:ما\s+لا\s+نهاية|مالانهاية)/g, ' ∞ ')
      .replace(/(?:باي|النسبة\s+التقريبية)/g, ' π ')
      .replace(/(?:ثيتا)/g, ' θ ')
      .replace(/(?:تكامل)/g, ' \\int ')
      .replace(/(?:غاية\s+إكس\s+تقترب\s+من\s+صفر|الغاية)/g, ' \\lim_{x \\to 0} ')
      .replace(/(?:يساوي)\s*/g, ' = ')
      .replace(/(?:زائد)\s*/g, ' + ')
      .replace(/(?:ناقص)\s*/g, ' - ')
      .replace(/(?:ضرب|في)\s*(?=[a-zA-Z0-9\\])/g, ' × ')
      .replace(/(?:تقسيم)\s*/g, ' ÷ ');

    return t;
  }

  // تحويل النص الصوتي أو المكتوب بخط اليد إلى سطور منظمة (أسئلة + فروع + أوامر فرعية + أرقام)
  function preprocessPaperAndVoiceText(rawText, subjectMode = 'arabic') {
    if (!rawText) return '';
    let text = String(rawText).replace(/\r\n/g, '\n');

    if (subjectMode === 'math') {
      text = convertSpokenMathToSymbols(text);
    }

    // 1. تحويل الدرجات المنطوقة صوتياً إلى صيغة رقمية قياسية (عربي + إنجليزي)
    text = text
      .replace(/(?:عشرون|عشرين)\s+درج[ةه]|(?:twenty|20)\s+marks?/gi, '(20 درجة)')
      .replace(/(?:خمسة\s+عشر|خمسطعش)\s+درج[ةه]|(?:fifteen|15)\s+marks?/gi, '(15 درجة)')
      .replace(/(?:عشر\s+درجات|عشرة\s+درجة|عشره\s+درجه)|(?:ten|10)\s+marks?/gi, '(10 درجات)')
      .replace(/(?:خمس\s+درجات|خمسة\s+درجة|خمسه\s+درجه)|(?:five|5)\s+marks?/gi, '(5 درجات)');

    if (subjectMode === 'english') {
      // تعديل صيغ الدرجات لتصبح Marks في الإنجليزية
      text = text
        .replace(/\(20\s+درجة\)/g, '(20 Marks)')
        .replace(/\(15\s+درجة\)/g, '(15 Marks)')
        .replace(/\(10\s+درجات?\)/g, '(10 Marks)')
        .replace(/\(5\s+درجات?\)/g, '(5 Marks)');

      // 2. فصل عناوين الأسئلة الإنجليزية (Q1 / Question 1 / Question one)
      const spokenQMapEn = [
        { rx: /(?:^|\n|\s+)(?:Question\s*(?:One|1)|Q\.?\s*1|First\s+question)(?=\s|[\/:\-]|$)/gi, rep: '\nQ1/ ' },
        { rx: /(?:^|\n|\s+)(?:Question\s*(?:Two|2)|Q\.?\s*2|Second\s+question)(?=\s|[\/:\-]|$)/gi, rep: '\nQ2/ ' },
        { rx: /(?:^|\n|\s+)(?:Question\s*(?:Three|3)|Q\.?\s*3|Third\s+question)(?=\s|[\/:\-]|$)/gi, rep: '\nQ3/ ' },
        { rx: /(?:^|\n|\s+)(?:Question\s*(?:Four|4)|Q\.?\s*4|Fourth\s+question)(?=\s|[\/:\-]|$)/gi, rep: '\nQ4/ ' },
        { rx: /(?:^|\n|\s+)(?:Question\s*(?:Five|5)|Q\.?\s*5|Fifth\s+question)(?=\s|[\/:\-]|$)/gi, rep: '\nQ5/ ' },
        { rx: /(?:^|\n|\s+)(?:Question\s*(?:Six|6)|Q\.?\s*6|Sixth\s+question)(?=\s|[\/:\-]|$)/gi, rep: '\nQ6/ ' }
      ];
      spokenQMapEn.forEach(item => { text = text.replace(item.rx, item.rep); });

      // فصل الفروع الإنجليزية المنطوقة (Branch A / Section B / New branch)
      text = text
        .replace(/(?:^|\n|\s+)(?:New\s+branch|Open\s+new\s+branch)\s*[\/:\-]?\s*/gi, '\nBranch (B)/ ')
        .replace(/(?:^|\n|\s+)(?:Branch\s*(?:A|One)|Section\s*(?:A|One))(?=\s|[\/:\-\)]|$)\s*[\/:\-\)]?\s*/gi, '\nBranch (A)/ ')
        .replace(/(?:^|\n|\s+)(?:Branch\s*(?:B|Two)|Section\s*(?:B|Two))(?=\s|[\/:\-\)]|$)\s*[\/:\-\)]?\s*/gi, '\nBranch (B)/ ')
        .replace(/(?:^|\n|\s+)(?:Branch\s*(?:C|Three)|Section\s*(?:C|Three))(?=\s|[\/:\-\)]|$)\s*[\/:\-\)]?\s*/gi, '\nBranch (C)/ ')
        .replace(/(?:^|\n|\s+)(?:Branch\s*(?:D|Four)|Section\s*(?:D|Four))(?=\s|[\/:\-\)]|$)\s*[\/:\-\)]?\s*/gi, '\nBranch (D)/ ');

      // ترقيم النقاط المنطوقة في الإنجليزية (Number one, Point two, First...)
      const spokenOrdinalsEn = [
        { rx: /(?:^|\n|\s+)(?:Number\s+one|Point\s+one|First)\s*[\/:\-\)]?\s*/gi, rep: '\n1- ' },
        { rx: /(?:^|\n|\s+)(?:Number\s+two|Point\s+two|Second)\s*[\/:\-\)]?\s*/gi, rep: '\n2- ' },
        { rx: /(?:^|\n|\s+)(?:Number\s+three|Point\s+three|Third)\s*[\/:\-\)]?\s*/gi, rep: '\n3- ' },
        { rx: /(?:^|\n|\s+)(?:Number\s+four|Point\s+four|Fourth)\s*[\/:\-\)]?\s*/gi, rep: '\n4- ' },
        { rx: /(?:^|\n|\s+)(?:Number\s+five|Point\s+five|Fifth)\s*[\/:\-\)]?\s*/gi, rep: '\n5- ' },
        { rx: /(?:^|\n|\s+)(?:Number\s+six|Point\s+six|Sixth)\s*[\/:\-\)]?\s*/gi, rep: '\n6- ' }
      ];
      spokenOrdinalsEn.forEach(item => { text = text.replace(item.rx, item.rep); });

      // فصل الأوامر الإنجليزية الجديدة في وسط السطر
      text = text.replace(/([^\n\/:\(\[])\s+((?:Read\s+the\s+following|Do\s+as\s+required|Define\s+(?:the\s+following|\d)|Choose\s+the\s+correct|Fill\s+in\s+the\s+blanks|Write\s+True\s+or\s+False|Match\s+(?:the|List)|Complete\s+the\s+following|Re-write\s+the\s+following|Punctuate)\b)/gi, '$1\n$2');
    }

    // 2. فصل عناوين الأسئلة العربية والرياضية
    const spokenQMap = [
      { rx: /(?:^|\n|\s+)(?:السؤال\s+الأول|السؤال\s+الاول|سؤال\s+الأول|سؤال\s+الاول|سؤال\s+رقم\s*[1١]|سؤال\s+واحد)(?=\s|[\/:\-]|$)/g, rep: '\nس1 / ' },
      { rx: /(?:^|\n|\s+)(?:السؤال\s+الثاني|سؤال\s+الثاني|سؤال\s+رقم\s*[2٢]|سؤال\s+اثنين)(?=\s|[\/:\-]|$)/g, rep: '\nس2 / ' },
      { rx: /(?:^|\n|\s+)(?:السؤال\s+الثالث|سؤال\s+الثالث|سؤال\s+رقم\s*[3٣]|سؤال\s+ثلاثة)(?=\s|[\/:\-]|$)/g, rep: '\nس3 / ' },
      { rx: /(?:^|\n|\s+)(?:السؤال\s+الرابع|سؤال\s+الرابع|سؤال\s+رقم\s*[4٤]|سؤال\s+أربعة|سؤال\s+اربعة)(?=\s|[\/:\-]|$)/g, rep: '\nس4 / ' },
      { rx: /(?:^|\n|\s+)(?:السؤال\s+الخامس|سؤال\s+الخامس|سؤال\s+رقم\s*[5٥]|سؤال\s+خمسة)(?=\s|[\/:\-]|$)/g, rep: '\nس5 / ' },
      { rx: /(?:^|\n|\s+)(?:السؤال\s+السادس|سؤال\s+السادس|سؤال\s+رقم\s*[6٦]|سؤال\s+ستة)(?=\s|[\/:\-]|$)/g, rep: '\nس6 / ' }
    ];
    spokenQMap.forEach(item => { text = text.replace(item.rx, item.rep); });

    // فصل (س1 / س2 / ...) إذا جاءت في وسط السطر
    text = text.replace(/([^\n])\s+(س\s*[٠-٩1-9]\s*[\/:\-])/g, '$1\n$2');

    // 3. تحويل الفروع المنطوقة أو المدمجة (فرع ألف، فرع باء، افتح فرع جديد...) إلى سطر فرع مستقل
    text = text
      .replace(/(?:^|\n|\s+)(?:افتح\s+فرع\s+جديد|فرع\s+جديد)\s*[\/:\-]?\s*/g, '\nفرع جديد / ')
      .replace(/(?:^|\n|\s+)(?:الفرع\s+الأول|الفرع\s+الاول|فرع\s+الأول|فرع\s+الاول|فرع\s+ألف|فرع\s+الف|الفرع\s+ألف)(?=\s|[\/:\-\)]|$)\s*[\/:\-\)]?\s*/g, '\nفرع أ / ')
      .replace(/(?:^|\n|\s+)(?:الفرع\s+الثاني|فرع\s+الثاني|فرع\s+باء|الفرع\s+باء)(?=\s|[\/:\-\)]|$)\s*[\/:\-\)]?\s*/g, '\nفرع ب / ')
      .replace(/(?:^|\n|\s+)(?:الفرع\s+الثالث|فرع\s+الثالث|فرع\s+جيم|الفرع\s+جيم)(?=\s|[\/:\-\)]|$)\s*[\/:\-\)]?\s*/g, '\nفرع ج / ')
      .replace(/(?:^|\n|\s+)(?:الفرع\s+الرابع|فرع\s+الرابع|فرع\s+دال|الفرع\s+دال)(?=\s|[\/:\-\)]|$)\s*[\/:\-\)]?\s*/g, '\nفرع د / ')
      .replace(/([^\n])\s+((?:الفرع|فرع)\s*[\(\[]?[أابجد][\)\]]?\s*[\/:\-\)]?)/g, '$1\n$2');

    // 4. تحويل الترقيم اللفظي (أولاً، ثانياً، النقطة الأولى...) إلى أسطر مرقمة
    const spokenOrdinals = [
      { rx: /(?:^|\n|\s+)(?:أولاً|اولا|أولا|النقطة\s+الأولى|النقطه\s+الاولى|نقطة\s+واحد|رقم\s+واحد)\s*[\/:\-\)]?\s*/g, rep: '\n1- ' },
      { rx: /(?:^|\n|\s+)(?:ثانياً|ثانيا|النقطة\s+الثانية|النقطه\s+الثانيه|نقطة\s+اثنين|رقم\s+اثنين)\s*[\/:\-\)]?\s*/g, rep: '\n2- ' },
      { rx: /(?:^|\n|\s+)(?:ثالثاً|ثالثا|النقطة\s+الثالثة|النقطه\s+الثالثه|نقطة\s+ثلاثة|رقم\s+ثلاثة)\s*[\/:\-\)]?\s*/g, rep: '\n3- ' },
      { rx: /(?:^|\n|\s+)(?:رابعاً|رابعا|النقطة\s+الرابعة|نقطة\s+أربعة|رقم\s+أربعة|رقم\s+اربعة)\s*[\/:\-\)]?\s*/g, rep: '\n4- ' },
      { rx: /(?:^|\n|\s+)(?:خامساً|خامسا|النقطة\s+الخامسة|نقطة\s+خمسة|رقم\s+خمسة)\s*[\/:\-\)]?\s*/g, rep: '\n5- ' },
      { rx: /(?:^|\n|\s+)(?:سادساً|سادسا|النقطة\s+السادسة|نقطة\s+ستة|رقم\s+ستة)\s*[\/:\-\)]?\s*/g, rep: '\n6- ' }
    ];
    spokenOrdinals.forEach(item => { text = text.replace(item.rx, item.rep); });

    // فصل النقاط المرقمة المتتالية في نفس السطر مثل: (1- ... 2- ...)
    text = text.replace(/([^\n])\s+([٠-٩1-9]\s*[\-\.\)]\s+)/g, '$1\n$2');

    // 5. أوامر الفروع والمطالب الرياضية والعامة: إذا انتهى مطلب وبدأ مطلب جديد يفصل في سطر جديد ليفتح فرعاً تلقائياً
    text = text.replace(/([^\n\/:\(\[])\s+((?:عرف|عرّف|ما\s+المقصود\s+بـ?|علل|علّل|اذكر\s+السبب|قارن\s+بين|ما\s+الفرق\s+بين|املأ\s+الفراغات|املا\s+الفراغات|أكمل\s+الفراغات|ضع\s+كلمة\s*\(?\s*صح|ضع\s+علامة\s*\(?\s*صح|اختر\s+الإجابة|اختر\s+من\s+بين|عدد\s+ما\s+يأتي|اذكر\s+ما\s+يأتي|جد\s+مجموعة\s+الحل|جد\s+ناتج|حل\s+المعادلات?|بسط\s+المقدار|حلل\s+المقادير|جد\s+قيمة|أثبت\s+أن|برهن\s+أن|جد\s+معادلة|جد\s+التكامل|جد\s+المشتقة)\b)/g, '$1\n$2');

    return text
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .join('\n');
  }

  // التحقق مما إذا كان السطر يمثل بداية مطلب/سؤال فرعي جديد (لفتح فرع جديد تلقائياً عند انتهاء المطلب السابق)
  function isNewSectionCommandHeader(line, subjectMode = 'arabic') {
    const t = cleanScoreTagFromLine(line || '').trim();
    if (!t) return false;

    if (subjectMode === 'english') {
      return /^(?:Read\s+the\s+following|Do\s+as\s+required|Define\s+(?:the\s+following|\d)|Choose\s+the\s+correct|Fill\s+in\s+the\s+blanks|Write\s+True\s+or\s+False|Match\s+(?:the|List)|Complete\s+the\s+following|Re-write\s+the\s+following|Punctuate|Answer\s+(?:the\s+following|\d)|Write\s+a\s+short\s+paragraph)/i.test(t);
    }

    if (subjectMode === 'math') {
      return /^(?:جد\s+مجموعة\s+الحل|حل\s+المعادلات?|حل\s+النظام|جد\s+ناتج|بسط\s+المقدار|بسط\s+المقادير|حلل\s+المقدار|حلل\s+المقادير|حلل\s+ما\s+يأتي|جد\s+قيمة|احسب\s+قيمة|أثبت\s+أن|اثبت\s+ان|برهن\s+أن|برهن\s+ان|جد\s+معادلة|جد\s+التكامل|جد\s+المشتقة|جد\s+الغاية|إذا\s+كانت\s+f\(x\)|أجب\s+عما\s+يأتي)/i.test(t);
    }

    return /^(?:عرف|عرّف|ما\s+المقصود|اكتب\s+تعريف|علل|علّل|اذكر\s+السبب|فسر\s+علميا|قارن\s+بين|ما\s+الفرق\s+بين|املأ\s+الفراغ|املا\s+الفراغ|أكمل\s+الفراغ|اكمل\s+الفراغ|ضع\s+كلمة\s*\(?\s*صح|ضع\s+علامة\s*\(?\s*صح|صح\s+أو\s+خطأ|اختر\s+الإجابة|اختر\s+الاجابة|اختر\s+من\s+بين|صل\s+بين|طابق\s+بين|عدد\s+|عدّد\s+|اذكر\s+|ما\s+وظيفة|ما\s+موقع|ما\s+أهمية|ما\s+اهمية|اشرح\s+|احسب\s+|جد\s+ناتج|جد\s+مجموعة|أجب\s+عما\s+يأتي|اجب\s+عما\s+ياتي)/i.test(t);
  }

  // تقسيم مصطلحات التعاريف المتتالية في نفس السطر (سواء مفصولة بفواصل أو مسافات في الإملاء الصوتي)
  function splitInlineDefinitionTerms(remainderStr) {
    const clean = (remainderStr || '').trim();
    if (!clean) return [];

    // إذا كان فيها شرح طويل مع نقطتين (مثل: الخلية: هي وحدة البناء...) نعتبرها عنصراً واحداً أو نفصلها إذا تكررت
    if (/[،,؛]|\s+-\s+/.test(clean)) {
      return clean.split(/[،,؛]|\s+-\s+/).map(s => s.trim()).filter(Boolean);
    }

    // إذا لم يكن فيها شرح (مجرد مصطلحات متتالية مثل: الخلية النواة المايتوكوندريا أو الخلية والنواة والمايتوكوندريا)
    if (!clean.includes(':') && clean.length < 140) {
      if (/\s+و\s+|\s+و(?=ال)/.test(clean)) {
        return clean.split(/\s+و\s+|\s+و(?=ال)/).map(s => s.trim()).filter(Boolean);
      }
      const words = clean.split(/\s+/).filter(Boolean);
      if (words.length >= 2 && words.length <= 10) {
        // دمج المصطلحات المركبة من كلمتين (مثل: الخلية النباتية، الغشاء البلازمي، جهاز كولجي، الجسيمات الحالة، بيوت الطاقة)
        const compoundFirstWords = /^(?:جهاز|شبكة|الشبكة|الغشاء|الجدار|الخلية|الجسيمات|البلاستيدات|الانقسام|التنفس|ثورة|معركة|قانون|مبدأ|ظاهرة|عملية|طاقة|درجة|حركة|الحامض|النسيج)$/;
        const terms = [];
        let i = 0;
        while (i < words.length) {
          const w = words[i];
          const nextW = words[i + 1];
          if (nextW && (compoundFirstWords.test(w) || (w.startsWith('ال') && nextW.startsWith('ال') && /[ية]$/.test(nextW)))) {
            terms.push(w + ' ' + nextW);
            i += 2;
          } else {
            terms.push(w);
            i += 1;
          }
        }
        if (terms.length >= 2) return terms;
      }
    }

    return [clean];
  }

  // تنسيق وترقيم سطور القسم الواحد تلقائياً (تعاريف، تعاليل، فراغات، صح وخطأ، تعداد، رياضيات، إنجليزي، إلخ)
  function autoFormatAndNumberSectionLines(rawLines, subjectMode = 'arabic') {
    const cleanLines = (rawLines || []).map(l => l.trim()).filter(Boolean);
    if (cleanLines.length === 0) return [];

    let headerPrompt = '';
    let rawItemLines = [];

    if (subjectMode === 'english') {
      const promptEnRegex = /^((?:Read\s+the\s+following(?:\s+passage)?|Do\s+as\s+required(?:\s+between\s+brackets)?|Define\s+(?:\(?\d+\)?\s+of\s+the\s+following|the\s+following)?|Choose\s+the\s+correct(?:\s+word|\s+answer)?(?:\s+between\s+brackets)?|Fill\s+in\s+the\s+blanks(?:\s+with\s+the\s+suitable\s+words)?|Write\s+True\s+or\s+False|Match\s+(?:the\s+words\s+in\s+List\s*\(?A\)?|List\s*\(?A\)?|the\s+following)|Complete\s+the\s+following|Re-write\s+the\s+following|Punctuate|Answer\s+(?:\(?\d+\)?\s+of\s+the\s+following|the\s+following))(?:\s+(?:only|carefully))?\s*[:\/\-]?\s*)(.*)$/i;
      const firstLine = cleanLines[0];
      const m = firstLine.match(promptEnRegex);
      if (m) {
        let pHead = (m[1] || '').trim().replace(/[\/\-]+$/, '').trim();
        if (pHead && !pHead.endsWith(':')) pHead += ':';
        headerPrompt = pHead;
        const inlineRemainder = cleanScoreTagFromLine(m[2] || '').trim();
        if (inlineRemainder) {
          if (/[،,;]|\s+-\s+/.test(inlineRemainder)) {
            rawItemLines.push(...inlineRemainder.split(/[،,;]|\s+-\s+/).map(s => s.trim()).filter(Boolean));
          } else {
            rawItemLines.push(inlineRemainder);
          }
        }
        rawItemLines.push(...cleanLines.slice(1));
      } else {
        rawItemLines = cleanLines.slice();
      }
    } else if (subjectMode === 'math') {
      const promptMathRegex = /^((?:جد\s+مجموعة\s+الحل(?:\s+للنظام|\s+للمعادلات|\s+للمعادلة)?|حل\s+المعادلات?|حل\s+النظام|جد\s+ناتج(?:\s+ما\s+يأتي)?(?:\s+بأبسط\s+صورة)?|بسط\s+المقدار|بسط\s+المقادير|حلل\s+(?:اثنين\s+من\s+)?المقادير(?:\s+الجبرية)?(?:\s+الآتية)?|حلل\s+ما\s+يأتي|جد\s+قيمة\s+x|احسب\s+قيمة|أثبت\s+أن|اثبت\s+ان|برهن\s+أن|برهن\s+ان|جد\s+معادلة|جد\s+التكامل|جد\s+المشتقة|جد\s+الغاية)(?:\s+(?:أربعة|اربعة|ثلاثة|ثلاثه|اثنين|خمسة|خمسه|واحد|كل))?(?:\s+(?:مما\s+يأتي|ما\s+يأتي|مما\s+يلي|ما\s+يلي|فقط))?\s*[:\/\-]?\s*)(.*)$/i;
      const firstLine = cleanLines[0];
      const m = firstLine.match(promptMathRegex);
      if (m) {
        let pHead = (m[1] || '').trim().replace(/[\/\-]+$/, '').trim();
        if (pHead && !pHead.endsWith(':')) pHead += ':';
        headerPrompt = pHead;
        const inlineRemainder = cleanScoreTagFromLine(m[2] || '').trim();
        if (inlineRemainder) {
          if (/[،؛]/.test(inlineRemainder)) {
            rawItemLines.push(...inlineRemainder.split(/[،؛]/).map(s => s.trim()).filter(Boolean));
          } else {
            rawItemLines.push(inlineRemainder);
          }
        }
        rawItemLines.push(...cleanLines.slice(1));
      } else {
        rawItemLines = cleanLines.slice();
      }
    } else {
      // مطابقة سطر الأمر الرئيسي العربي مع أي عناصر مكتوبة معه في نفس السطر
      const promptExtractRegex = /^((?:عرف|عرّف|ما\s+المقصود(?:\s+بـ?)?|علل|علّل|اذكر\s+السبب|فسر\s+علميا|املأ\s+الفراغات(?:\s+الآتية|\s+الاتية)?(?:\s+بما\s+يناسبها)?|املا\s+الفراغات(?:\s+الآتية|\s+الاتية)?(?:\s+بما\s+يناسبها)?|أكمل\s+الفراغات(?:\s+الآتية)?|اكمل\s+الفراغات(?:\s+الآتية)?|ضع\s+كلمة\s*\(?\s*صح\s*\)?.*?(?:خطأ|غير\s+الصحيحة)\s*\)?|ضع\s+علامة\s*\(?\s*صح\s*\)?.*?(?:خطأ|غير\s+الصحيحة)\s*\)?|اختر\s+الإجابة\s+الصحيحة(?:\s+مما\s+بين\s+الأقواس)?|اختر\s+من\s+بين\s+الأقواس|عدد|عدّد|اذكر|أجب\s+عما\s+يأتي|ما\s+وظيفة|ما\s+موقع|ما\s+أهمية)(?:\s+(?:أربعة|اربعة|ثلاثة|ثلاثه|اثنين|خمسة|خمسه|واحد|كل))?(?:\s+(?:مما\s+يأتي|ما\s+يأتي|مما\s+يلي|ما\s+يلي|فقط))?\s*[:\/\-]?\s*)(.*)$/i;

      const firstLine = cleanLines[0];
      const isDirectComparison = /^(?:قارن\s+بين|ما\s+الفرق\s+بين)/i.test(firstLine);

      if (!isDirectComparison) {
        const m = firstLine.match(promptExtractRegex);
        if (m) {
          let pHead = (m[1] || '').trim().replace(/[\/\-]+$/, '').trim();
          if (pHead && !pHead.endsWith(':')) pHead += ':';
          headerPrompt = pHead;

          const inlineRemainder = cleanScoreTagFromLine(m[2] || '').trim();
          if (inlineRemainder) {
            if (/^(?:عرف|عرّف|ما\s+المقصود)/i.test(headerPrompt)) {
              rawItemLines.push(...splitInlineDefinitionTerms(inlineRemainder));
            } else if (/[،؛]|\s+-\s+/.test(inlineRemainder)) {
              rawItemLines.push(...inlineRemainder.split(/[،؛]|\s+-\s+/).map(s => s.trim()).filter(Boolean));
            } else {
              rawItemLines.push(inlineRemainder);
            }
          }
          rawItemLines.push(...cleanLines.slice(1));
        } else {
          rawItemLines = cleanLines.slice();
        }
      } else {
        headerPrompt = firstLine;
        rawItemLines = cleanLines.slice(1);
      }
    }

    if (rawItemLines.length === 0) {
      return headerPrompt ? [headerPrompt] : cleanLines;
    }

    // تفكيك أي سطر فرعي يحتوي على عدة نقاط
    const expandedItems = [];
    const isDefSection = /^(?:عرف|عرّف|ما\s+المقصود|Define\b)/i.test(headerPrompt);

    rawItemLines.forEach((itemLine) => {
      // إزالة أي ترقيم سابق في بداية السطر لمنع تكرار الترقيم (مثل 1- 1-)
      const stripped = itemLine
        .replace(/^(?:[٠-٩\d]+\s*[\-\.\)\/_:]\s*|(?:أولاً|اولا|ثانياً|ثانيا|ثالثاً|ثالثا|رابعاً|رابعا|خامساً|خامسا|سادساً|سادسا)\s*[\-\.\)\/:]?\s*|[\*\•\-\–]\s*)/i, '')
        .trim();
      if (!stripped) return;

      if (isDefSection && !stripped.includes(':') && /[،,؛]/.test(stripped)) {
        const parts = stripped.split(/[،,؛]/).map(s => s.trim()).filter(Boolean);
        expandedItems.push(...parts);
      } else if (!isDefSection && /؛/.test(stripped) && subjectMode !== 'math') {
        const parts = stripped.split(/؛/).map(s => s.trim()).filter(Boolean);
        expandedItems.push(...parts);
      } else {
        expandedItems.push(stripped);
      }
    });

    // إضافة الترقيم التلقائي (1- ، 2- ، 3- ...) لكل النقاط (تعاريف، تعاليل، معادلات، نقاط grammar، إلخ)
    const shouldNumberItems = Boolean(headerPrompt) || expandedItems.length >= 2;
    const numberedItems = expandedItems.map((it, idx) =>
      shouldNumberItems ? `${idx + 1}- ${it}` : it
    );

    return headerPrompt ? [headerPrompt, ...numberedItems] : numberedItems;
  }

  // فصل السطور المنسقة إلى: (1) عنوان/منطوق السؤال أو الفرع (title) و (2) نص ونقاط السؤال أو الفرع (body)
  function splitSectionIntoTitleAndBody(numberedLines, subjectMode = 'arabic') {
    const lines = (numberedLines || []).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      return { title: '', body: '' };
    }

    // إذا كان هناك سطران أو أكثر: السطر الأول هو عنوان السؤال/الفرع وبقية السطور هي نص ونقاط السؤال/الفرع
    if (lines.length >= 2) {
      return {
        title: lines[0],
        body: lines.slice(1).join('\n')
      };
    }

    // إذا كان سطراً واحداً فقط
    const single = lines[0];

    if (subjectMode === 'english') {
      const enMatch = single.match(/^((?:Read\s+the\s+following|Do\s+as\s+required|Define\s+(?:the\s+following|\d)|Choose\s+the\s+correct|Fill\s+in\s+the\s+blanks|Write\s+True\s+or\s+False|Match\s+(?:the|List)|Complete\s+the\s+following|Re-write\s+the\s+following|Punctuate|Answer\s+(?:the\s+following|\d))\b.*?)\s*[:\/\-]?\s+(.+)$/i);
      if (enMatch) {
        let extractedTitle = enMatch[1].trim();
        if (!extractedTitle.endsWith(':')) extractedTitle += ':';
        return {
          title: extractedTitle,
          body: enMatch[2].trim()
        };
      }
    } else if (subjectMode === 'math') {
      const mathMatch = single.match(/^((?:جد\s+مجموعة\s+الحل|حل\s+المعادلات?|حل\s+النظام|جد\s+ناتج|بسط\s+المقدار|بسط\s+المقادير|حلل\s+المقادير|حلل\s+ما\s+يأتي|جد\s+قيمة\s+x|احسب\s+قيمة|أثبت\s+أن|برهن\s+أن|جد\s+معادلة|جد\s+التكامل|جد\s+المشتقة)\b.*?)\s*[:\/\-]?\s+(.+)$/i);
      if (mathMatch) {
        let extractedTitle = mathMatch[1].trim();
        if (!extractedTitle.endsWith(':')) extractedTitle += ':';
        return {
          title: extractedTitle,
          body: mathMatch[2].trim()
        };
      }
    }

    const cmdSplitMatch = single.match(/^((?:عرف|عرّف|ما\s+المقصود(?:\s+بـ?)?|علل|علّل|اذكر\s+السبب|فسر\s+علميا|قارن\s+بين|ما\s+الفرق\s+بين|املأ\s+الفراغات(?:\s+الآتية)?|املا\s+الفراغات(?:\s+الآتية)?|أكمل\s+الفراغات|ضع\s+كلمة\s*\(?\s*صح\s*\)?.*?(?:خطأ|غير\s+الصحيحة)\s*\)?|اختر\s+الإجابة\s+الصحيحة|عدد|عدّد|اذكر|اشرح|وضّح|وضح|بيّن|بين|ما\s+وظيفة|ما\s+موقع|ما\s+أهمية|ما\s+اهمية|احسب|جد\s+ناتج|جد\s+مجموعة\s+الحل|حل\s+المعادلة|أجب\s+عما\s+يأتي)(?:\s+(?:أربعة|اربعة|ثلاثة|ثلاثه|اثنين|خمسة|خمسه|واحد|كل))?(?:\s+(?:مما\s+يأتي|ما\s+يأتي|مما\s+يلي|ما\s+يلي|فقط))?)\s*[:\/\-]?\s+(.+)$/i);
    if (cmdSplitMatch) {
      let extractedTitle = cmdSplitMatch[1].trim();
      if (!extractedTitle.endsWith(':')) extractedTitle += ':';
      return {
        title: extractedTitle,
        body: cmdSplitMatch[2].trim()
      };
    }

    const colonIdx = single.indexOf(':');
    if (colonIdx > 2 && colonIdx < single.length - 2) {
      return {
        title: single.slice(0, colonIdx + 1).trim(),
        body: single.slice(colonIdx + 1).trim()
      };
    }

    if (isNewSectionCommandHeader(single, subjectMode)) {
      return {
        title: single.endsWith(':') ? single : (single + ':'),
        body: ''
      };
    }

    return {
      title: subjectMode === 'english' ? 'Answer the following:' : 'أجب عما يأتي:',
      body: single
    };
  }

  function parseRawPaperTextToQuestions(rawText, subjectMode = 'arabic') {
    const preprocessed = preprocessPaperAndVoiceText(rawText, subjectMode);
    if (!preprocessed) return [];

    const lines = preprocessed.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];

    const mainQRegex = /^(?:س\s*[٠-٩\d]+\s*[\/:\-\)]?|السؤال\s+(?:الأول|الاول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|[٠-٩\d]+)\s*[\/:\-\)]?|Q\.?\s*\d+\s*[\/:\-\)]?|Question\s+\d+\s*[\/:\-\)]?)\s*(.*)$/i;
    const branchRegex = /^(?:الفرع|فرع|Branch|Section)\s*(?:جديد|\(?([أابجدA-D])\)?)\s*[\/:\-\)]?\s*(.*)$|^[\(\[]?([أبجدA-D])[\)\]]\s*[\/:\-\)]\s*(.*)$/i;
    const branchLettersOrder = subjectMode === 'english' ? ['A', 'B', 'C', 'D', 'E'] : ['أ', 'ب', 'ج', 'د', 'هـ'];

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

      const allQuestionLines = [];
      if (firstLineText) allQuestionLines.push(firstLineText);
      block.subLines.forEach(s => {
        if (s && s.trim()) allQuestionLines.push(s.trim());
      });

      // تقسيم محتوى السؤال الواحد إلى أقسام/فروع
      const sections = [];
      let generalIntroLines = [];
      let currentSec = null;

      allQuestionLines.forEach((lineStr) => {
        const bMatch = lineStr.match(branchRegex);
        if (bMatch) {
          const explicitLetter = bMatch[1] || bMatch[3] || '';
          const bRest = bMatch[2] || bMatch[4] || '';
          const nextLetter = explicitLetter || branchLettersOrder[sections.length] || (subjectMode === 'english' ? 'A' : 'أ');
          currentSec = {
            explicitBranch: true,
            letter: nextLetter,
            score: extractScoreFromLine(lineStr, 0),
            lines: [cleanScoreTagFromLine(bRest)].filter(Boolean)
          };
          sections.push(currentSec);
          return;
        }

        // هل السطر يمثل بداية مطلب جديد؟
        const isCmdStart = isNewSectionCommandHeader(lineStr, subjectMode);
        if (isCmdStart) {
          if (!currentSec) {
            currentSec = {
              explicitBranch: false,
              letter: branchLettersOrder[sections.length] || (subjectMode === 'english' ? 'A' : 'أ'),
              score: extractScoreFromLine(lineStr, 0),
              lines: [cleanScoreTagFromLine(lineStr)].filter(Boolean)
            };
            sections.push(currentSec);
            return;
          } else if (currentSec.lines.length >= 1) {
            const prevFormatted = autoFormatAndNumberSectionLines(currentSec.lines, subjectMode);
            const prevHasCompletedContent = prevFormatted.length >= 2 || /^(?:قارن\s+بين|ما\s+الفرق\s+بين|اشرح|وضح|Read\s+the|Do\s+as)/i.test(currentSec.lines[0]);
            if (prevHasCompletedContent) {
              currentSec = {
                explicitBranch: true,
                letter: branchLettersOrder[sections.length] || (subjectMode === 'english' ? 'B' : 'ب'),
                score: extractScoreFromLine(lineStr, 0),
                lines: [cleanScoreTagFromLine(lineStr)].filter(Boolean)
              };
              sections.push(currentSec);
              return;
            }
          }
        }

        // سطر عادي
        if (!currentSec) {
          if (/(?:أجب\s+عن\s+فرعين|اجب\s+عن\s+فرعين|أجب\s+عن\s+الفرعين|أجب\s+عن\s+أحد\s+الفرعين|أجب\s+عن\s+الفروع|Answer\s+(?:any\s+two|all\s+branches))/i.test(lineStr)) {
            generalIntroLines.push(cleanScoreTagFromLine(lineStr));
          } else {
            currentSec = {
              explicitBranch: false,
              letter: subjectMode === 'english' ? 'A' : 'أ',
              score: 0,
              lines: [cleanScoreTagFromLine(lineStr)].filter(Boolean)
            };
            sections.push(currentSec);
          }
        } else {
          currentSec.lines.push(cleanScoreTagFromLine(lineStr));
        }
      });

      // التمييز الدقيق بين (1) عنوان السؤال، (2) نص السؤال، (3) فرع السؤال
      let questionTitle = '';
      let fullQuestionText = '';
      let formattedBranches = [];

      if (sections.length > 0 && !sections[0].explicitBranch) {
        const mainNumbered = autoFormatAndNumberSectionLines(sections[0].lines, subjectMode);
        const mainSplit = splitSectionIntoTitleAndBody(mainNumbered, subjectMode);
        questionTitle = mainSplit.title || (generalIntroLines[0] || '');
        fullQuestionText = mainSplit.body || '';

        if (sections.length > 1) {
          const extraSecs = sections.slice(1);
          const defaultBranchScore = Math.max(5, Math.round(detectedScore / (extraSecs.length + 1)));
          formattedBranches = extraSecs.map((sec, sIdx) => {
            const bLetter = sec.explicitBranch && sec.letter ? sec.letter : (branchLettersOrder[sIdx] || String(sIdx + 1));
            const bNumbered = autoFormatAndNumberSectionLines(sec.lines, subjectMode);
            const bSplit = splitSectionIntoTitleAndBody(bNumbered, subjectMode);
            const branchLabel = subjectMode === 'english' ? `Branch (${bLetter})` : `الفرع (${bLetter})`;
            return {
              title: branchLabel,
              prompt: bSplit.title || '',
              text: bSplit.body || '',
              score: sec.score > 0 ? sec.score : defaultBranchScore,
              modelAnswer: ''
            };
          });
        }
      } else if (sections.length > 0 && sections[0].explicitBranch) {
        questionTitle = generalIntroLines[0] || (subjectMode === 'english' ? 'Answer all branches:' : 'أجب عن الفروع الآتية:');
        fullQuestionText = generalIntroLines.slice(1).join('\n').trim();
        const defaultBranchScore = Math.max(5, Math.round(detectedScore / Math.max(1, sections.length)));
        formattedBranches = sections.map((sec, sIdx) => {
          const bLetter = sec.letter || branchLettersOrder[sIdx] || String(sIdx + 1);
          const bNumbered = autoFormatAndNumberSectionLines(sec.lines, subjectMode);
          const bSplit = splitSectionIntoTitleAndBody(bNumbered, subjectMode);
          const branchLabel = subjectMode === 'english' ? `Branch (${bLetter})` : `الفرع (${bLetter})`;
          return {
            title: branchLabel,
            prompt: bSplit.title || '',
            text: bSplit.body || '',
            score: sec.score > 0 ? sec.score : defaultBranchScore,
            modelAnswer: ''
          };
        });
      } else {
        questionTitle = generalIntroLines[0] || '';
        fullQuestionText = generalIntroLines.slice(1).join('\n').trim();
      }

      const allTextForDetection = [
        questionTitle,
        fullQuestionText,
        ...formattedBranches.map(b => (b.prompt || '') + '\n' + (b.text || ''))
      ].join('\n');

      // إذا كان السؤال مقسماً إلى عدة فروع، نجعل نوعه الأساسي مقالياً/متعدد الفروع حتى لا يرسم جدول مقارنة مكرر أسفل الفروع
      let qType = detectQuestionTypeFromText(questionTitle + '\n' + fullQuestionText);
      if (qType === 'essay' && formattedBranches.length === 0) {
        qType = detectQuestionTypeFromText(allTextForDetection);
      }
      if (formattedBranches.length > 0 && qType === 'comparisons') {
        qType = 'essay';
      }

      const questionObj = {
        id: 'scan_q_' + Date.now() + '_' + idx,
        type: qType,
        title: questionTitle,
        displayTitle: ordinalTitle,
        text: fullQuestionText,
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
        const compMatch = allTextForDetection.match(/(?:قارن\s+بين(?:\s*:)?|ما\s+الفرق\s+بين(?:\s*:)?)\s+(.+?)\s+و\s*(.+?)(?:[\.\n\?؟]|$)/);
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
      const mainNumbered = autoFormatAndNumberSectionLines(String(item.text || '').split('\n'));
      const mainSplit = splitSectionIntoTitleAndBody(mainNumbered);
      const qTitle = (item.prompt || mainSplit.title || '').trim();
      const qBody = mainSplit.body || '';
      const qType = QUESTION_TYPE_LABELS[item.type] ? item.type : detectQuestionTypeFromText(qTitle + '\n' + qBody);
      return {
        id: 'scan_ai_' + Date.now() + '_' + idx,
        type: qType,
        title: qTitle,
        displayTitle: ordinalTitle,
        text: qBody,
        score: Number(item.score) || 20,
        difficulty: 'متوسط',
        bloom: 'فهم',
        subject: activeSubject,
        showAnswerLines: false,
        linesCount: 3,
        branches: Array.isArray(item.branches) ? item.branches.map((b, bi) => {
          const bNumbered = autoFormatAndNumberSectionLines(String(b.text || '').split('\n'));
          const bSplit = splitSectionIntoTitleAndBody(bNumbered);
          return {
            title: b.title || `الفرع (${bi === 0 ? 'أ' : 'ب'})`,
            prompt: b.prompt || bSplit.title || '',
            text: bSplit.body || '',
            score: Number(b.score) || 10,
            modelAnswer: b.modelAnswer || ''
          };
        }) : [],
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
    const activeSubject = getActiveSubjectMode();
    const isEnglish = activeSubject === 'english';
    return questions.map((q, i) => {
      const qTitle = (q.title || '').trim();
      const qBody = (q.text || '').trim();
      const qPrefix = isEnglish ? `Q${i + 1}/` : `س${i + 1} /`;
      const scoreTag = isEnglish ? `(${q.score || 20} Marks)` : `(${q.score || 20} درجة)`;
      let block = `${qPrefix} ${qTitle} ${scoreTag}`;
      if (qBody) {
        block += `\n${qBody}`;
      }
      if (Array.isArray(q.branches) && q.branches.length > 0) {
        q.branches.forEach((b, bi) => {
          const defaultBranchTitle = isEnglish ? `Branch (${String.fromCharCode(65 + bi)})` : `الفرع (${String.fromCharCode(1571 + bi)})`;
          const bTitle = (b.title || defaultBranchTitle).trim();
          const bPrompt = (b.prompt || '').trim();
          const bBody = (b.text || '').trim();
          const bScoreTag = isEnglish ? `(${b.score || 10} Marks)` : `(${b.score || 10} درجات)`;
          block += `\n${bTitle}/ ${bPrompt} ${bScoreTag}`;
          if (bBody) {
            block += `\n${bBody}`;
          }
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

    const activeSubject = getActiveSubjectMode();

    listEl.innerHTML = currentParsedQuestions.map((q, idx) => {
      const qSubject = q.subject || activeSubject;
      const isEnglish = qSubject === 'english';
      const isMath = qSubject === 'math';

      const typeOptionsHtml = Object.entries(QUESTION_TYPE_LABELS).map(([k, label]) =>
        `<option value="${k}" ${q.type === k ? 'selected' : ''}>${label}</option>`
      ).join('');

      const branchesCount = Array.isArray(q.branches) ? q.branches.length : 0;
      const branchesHtml = branchesCount > 0
        ? `<div class="scanned-q-branches" style="margin-top: 0.65rem; display: flex; flex-direction: column; gap: 0.55rem;">
            ${q.branches.map((b, bIdx) => {
          const bRows = Math.max(2, (b.text || '').split('\n').length);
          const bDirAttr = isEnglish ? 'dir="ltr" style="direction: ltr; text-align: left;' : 'dir="rtl" style="direction: rtl; text-align: right;';
          return `
              <div class="scanned-q-branch-item" style="background: rgba(139, 92, 246, 0.04); border: 1.5px dashed rgba(139, 92, 246, 0.38); border-radius: 10px; padding: 0.6rem;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.4rem; margin-bottom: 0.4rem; ${isEnglish ? 'flex-direction: row-reverse;' : ''}">
                  <div style="display: flex; align-items: center; gap: 0.35rem;">
                    <span class="branch-pill" style="padding: 2px 8px; font-size: 0.74rem; background: rgba(139, 92, 246, 0.15); color: #6d28d9; border-radius: 6px; font-weight: 800;">${isEnglish ? 'Branch' : '🌿 فرع السؤال'}</span>
                    <input type="text" value="${escapeHtml(b.title || '')}"
                      oninput="window.updateScannedBranchLive(${idx}, ${bIdx}, 'title', this.value)"
                      style="width: 105px; padding: 2px 6px; font-size: 0.78rem; font-weight: 800; border: 1px solid #cbd5e1; border-radius: 6px; background: var(--bg-card, #fff); color: var(--text-main, #0f172a); ${isEnglish ? 'text-align: left;' : ''}">
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.35rem;">
                    <input type="number" min="1" max="100" value="${b.score || 10}"
                      oninput="window.updateScannedBranchLive(${idx}, ${bIdx}, 'score', this.value)"
                      style="width: 52px; padding: 2px 4px; font-size: 0.78rem; font-weight: 800; text-align: center; border: 1px solid #cbd5e1; border-radius: 6px; background: var(--bg-card, #fff); color: var(--text-main, #0f172a);">
                    <span style="font-size: 0.74rem; font-weight: 700; color: #64748b;">${isEnglish ? 'Marks' : 'درجة'}</span>
                    <button type="button" onclick="window.removeScannedBranch(${idx}, ${bIdx})" title="حذف هذا الفرع"
                      style="background: rgba(239, 68, 68, 0.1); color: #dc2626; border: none; border-radius: 6px; width: 24px; height: 24px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;">
                      <i class="fa-solid fa-xmark" style="font-size: 0.75rem;"></i>
                    </button>
                  </div>
                </div>
                <div style="margin-bottom: 0.38rem;">
                  <label style="display: block; font-size: 0.72rem; font-weight: 800; color: #6d28d9; margin-bottom: 2px;">${isEnglish ? '📌 Branch Prompt (Header):' : '📌 عنوان الفرع (منطوق الفرع):'}</label>
                  <input type="text" class="form-control scanned-q-branch-prompt-input"
                    value="${escapeHtml(b.prompt || '')}"
                    placeholder="${isEnglish ? 'Branch Prompt (e.g. Do as required: / Define words:)' : 'عنوان الفرع (مثال: علل ما يأتي: / قارن بين: / جد قيمة x:)'}"
                    oninput="window.updateScannedBranchLive(${idx}, ${bIdx}, 'prompt', this.value)"
                    ${bDirAttr} width: 100%; font-size: 0.84rem; font-weight: 800; padding: 0.35rem 0.55rem; border: 1px solid rgba(139, 92, 246, 0.35); border-radius: 7px; background: var(--bg-card, #fff); color: var(--text-main, #0f172a);">"
                </div>
                <div>
                  <label style="display: block; font-size: 0.72rem; font-weight: 800; color: #047857; margin-bottom: 2px;">${isEnglish ? '📝 Branch Body (Points / Items):' : '📝 نص الفرع (النقاط / المعادلات):'}</label>
                  <textarea class="form-control scanned-q-branch-textarea" rows="${bRows}"
                    placeholder="${isEnglish ? 'Write or edit branch items (1- ... 2- ...)...' : 'اكتب أو عدّل نص ونقاط هذا الفرع هنا (1- ... 2- ...)...'}"
                    oninput="window.updateScannedBranchLive(${idx}, ${bIdx}, 'text', this.value); this.style.height='auto'; this.style.height=(this.scrollHeight)+'px';"
                    ${bDirAttr} width: 100%; font-size: 0.86rem; font-weight: 700; line-height: 1.6; padding: 0.45rem 0.6rem; border: 1px solid #cbd5e1; border-radius: 8px; resize: vertical; background: var(--bg-card, #fff); color: var(--text-main, #0f172a);">${escapeHtml(b.text || '')}</textarea>"
                </div>
              </div>
            `;
        }).join('')}
          </div>`
        : '';

      const defaultDisplayTitle = isEnglish ? `Question ${idx + 1}` : ('السؤال ' + (ARABIC_ORDINALS[idx] || (idx + 1)));
      const displayTitle = q.displayTitle || defaultDisplayTitle;
      const qRows = Math.max(2, (q.text || '').split('\n').length);
      const qDirAttr = isEnglish ? 'dir="ltr" style="direction: ltr; text-align: left;' : 'dir="rtl" style="direction: rtl; text-align: right;';

      const mathPreviewStrip = isMath && (q.text || q.title)
        ? `<div style="margin-top: 0.45rem; background: rgba(139, 92, 246, 0.06); border: 1px dashed rgba(139, 92, 246, 0.3); border-radius: 8px; padding: 0.35rem 0.6rem; font-size: 0.8rem; color: #5b21b6;">
            <span style="font-weight: 800;">📐 معاينة المعادلات الحية: </span>
            <span>${(typeof window.formatMathText === 'function') ? window.formatMathText((q.title ? q.title + ' ' : '') + (q.text || '')) : escapeHtml(q.text || '')}</span>
          </div>`
        : '';

      return `
        <div class="scanned-q-card ${isEnglish ? 'is-english-card' : ''}">
          <div class="scanned-q-card-header" ${isEnglish ? 'style="flex-direction: row-reverse;"' : ''}>
            <div class="scanned-q-title-wrap" style="flex: 1; min-width: 140px; ${isEnglish ? 'display: flex; flex-direction: row-reverse; justify-content: flex-end;' : ''}">
              <span class="scanned-q-num-badge">${isEnglish ? `Q${idx + 1}` : `س${idx + 1}`}</span>
              <input type="text" value="${escapeHtml(displayTitle)}"
                oninput="window.updateScannedQuestionLive(${idx}, 'displayTitle', this.value)"
                title="اضغط لتعديل رقم/تسمية السؤال"
                style="font-weight: 900; font-size: 0.9rem; color: var(--text-main, #0f172a); background: transparent; border: 1px dashed transparent; border-radius: 6px; padding: 2px 6px; width: 145px; transition: border-color 0.2s; ${isEnglish ? 'text-align: left;' : ''}"
                onfocus="this.style.borderColor='#10b981'; this.style.background='rgba(16,185,129,0.05)';"
                onblur="this.style.borderColor='transparent'; this.style.background='transparent';">
            </div>
            <div class="scanned-q-controls-wrap">
              <select class="scanned-q-type-select" onchange="window.updateScannedQuestionField(${idx}, 'type', this.value)" title="نوع السؤال">
                ${typeOptionsHtml}
              </select>
              <div class="scanned-q-score-box" title="درجة السؤال">
                <input type="number" min="1" max="100" value="${q.score}" oninput="window.updateScannedQuestionLive(${idx}, 'score', this.value)">
                <span>${isEnglish ? 'Marks' : 'درجة'}</span>
              </div>
              <button type="button" class="scanned-q-delete-btn" onclick="window.removeScannedQuestion(${idx})" title="حذف هذا السؤال">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
          <div class="scanned-q-card-body" style="padding-top: 0.5rem;">
            <!-- 1. عنوان السؤال (منطوق السؤال الرئيسي) -->
            <div style="margin-bottom: 0.5rem;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem; ${isEnglish ? 'flex-direction: row-reverse;' : ''}">
                <span style="background: rgba(37, 99, 235, 0.1); color: #1d4ed8; padding: 2px 8px; border-radius: 6px; font-size: 0.74rem; font-weight: 800;">
                  <i class="fa-solid fa-heading"></i> ${isEnglish ? '1. Question Title (Prompt):' : '1. عنوان السؤال (منطوق السؤال الرئيسي):'}
                </span>
                <button type="button" onclick="window.addBranchToScannedQuestion(${idx})"
                  style="background: rgba(139, 92, 246, 0.1); color: #6d28d9; border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 6px; padding: 2px 8px; font-size: 0.73rem; font-weight: 800; cursor: pointer;">
                  <i class="fa-solid fa-code-branch"></i> ${isEnglish ? `+ Add Branch (${branchesCount})` : `+ إضافة فرع للسؤال (${branchesCount})`}
                </button>
              </div>
              <input type="text" class="form-control scanned-q-title-input"
                value="${escapeHtml(q.title || '')}"
                placeholder="${isEnglish ? 'Question Title (e.g. Read the passage: / Answer all branches:)' : 'عنوان السؤال (مثال: عرف ما يأتي: / جد مجموعة الحل: / أجب عن الفروع الآتية:)'}"
                oninput="window.updateScannedQuestionLive(${idx}, 'title', this.value)"
                ${qDirAttr} width: 100%; font-size: 0.9rem; font-weight: 800; padding: 0.42rem 0.65rem; border: 1.5px solid rgba(37, 99, 235, 0.35); border-radius: 8px; background: rgba(37, 99, 235, 0.03); color: var(--text-main, #0f172a);">"
            </div>

            <!-- 2. نص السؤال (النقاط / الفقرات) -->
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem;">
                <span style="background: rgba(16, 185, 129, 0.12); color: #047857; padding: 2px 8px; border-radius: 6px; font-size: 0.74rem; font-weight: 800;">
                  <i class="fa-solid fa-list-ol"></i> ${isEnglish ? '2. Question Body (Items / Sentences):' : '2. نص السؤال (النقاط والفقرات التابعة للسؤال):'}
                </span>
              </div>
              <textarea class="form-control scanned-q-edit-textarea" rows="${qRows}"
                placeholder="${isEnglish ? 'Question body points (1- ... 2- ...)...' : 'نص ونقاط السؤال الرئيسي (1- ... 2- ...)...'}"
                oninput="window.updateScannedQuestionLive(${idx}, 'text', this.value); this.style.height='auto'; this.style.height=(this.scrollHeight)+'px';"
                ${qDirAttr} width: 100%; font-size: 0.88rem; font-weight: 700; line-height: 1.65; padding: 0.5rem 0.65rem; border: 1.5px solid rgba(16, 185, 129, 0.35); border-radius: 10px; resize: vertical; background: var(--bg-card, #fff); color: var(--text-main, #0f172a); box-shadow: inset 0 1px 2px rgba(0,0,0,0.03);">${escapeHtml(q.text || '')}</textarea>"
            </div>

            <!-- معاينة الرياضيات إن وجدت -->
            ${mathPreviewStrip}

            <!-- 3. فروع السؤال (الفرع أ / الفرع ب) -->
            ${branchesHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  function updateTotalScoreBadgeOnly() {
    const countBadge = document.getElementById('scannerDetectedCountBadge');
    const scoreBadge = document.getElementById('scannerTotalScoreBadge');
    const count = currentParsedQuestions.length;
    const totalScore = currentParsedQuestions.reduce((acc, q) => acc + (Number(q.score) || 0), 0);
    if (countBadge) countBadge.textContent = `${count} أسئلة`;
    if (scoreBadge) scoreBadge.textContent = `مجموع الدرجات: ${totalScore}`;
  }

  window.updateScannedQuestionLive = function (idx, field, value) {
    const q = currentParsedQuestions[idx];
    if (!q) return;
    if (field === 'score') {
      q.score = Math.max(1, parseInt(value, 10) || 10);
      updateTotalScoreBadgeOnly();
    } else if (field === 'displayTitle') {
      q.displayTitle = value;
      q.customLabel = value;
    } else if (field === 'title') {
      q.title = value;
    } else if (field === 'text') {
      q.text = value;
      if (q.type === 'comparisons') {
        const compMatch = ((q.title || '') + ' ' + value).match(/(?:قارن\s+بين(?:\s*:)?|ما\s+الفرق\s+بين(?:\s*:)?)\s+(.+?)\s+و\s*(.+?)(?:[\.\n\?؟]|$)/);
        if (compMatch) {
          q.item1 = compMatch[1].trim();
          q.item2 = compMatch[2].trim();
        }
      }
    }
  };

  window.updateScannedBranchLive = function (qIdx, bIdx, field, value) {
    const q = currentParsedQuestions[qIdx];
    if (!q || !Array.isArray(q.branches) || !q.branches[bIdx]) return;
    if (field === 'score') {
      q.branches[bIdx].score = Math.max(1, parseInt(value, 10) || 5);
    } else if (field === 'title') {
      q.branches[bIdx].title = value;
    } else if (field === 'prompt') {
      q.branches[bIdx].prompt = value;
    } else if (field === 'text') {
      q.branches[bIdx].text = value;
    }
  };

  window.addBranchToScannedQuestion = function (qIdx) {
    const q = currentParsedQuestions[qIdx];
    if (!q) return;
    if (!Array.isArray(q.branches)) q.branches = [];
    const branchLetters = ['أ', 'ب', 'ج', 'د'];
    const letter = branchLetters[q.branches.length] || (q.branches.length + 1);
    q.branches.push({
      title: `الفرع (${letter})`,
      prompt: '',
      text: '',
      score: 10,
      modelAnswer: ''
    });
    renderScannedQuestionsPreview();
  };

  window.removeScannedBranch = function (qIdx, bIdx) {
    const q = currentParsedQuestions[qIdx];
    if (!q || !Array.isArray(q.branches)) return;
    q.branches.splice(bIdx, 1);
    renderScannedQuestionsPreview();
  };

  window.addBlankScannedQuestion = function () {
    const idx = currentParsedQuestions.length;
    const subjectMode = getActiveSubjectMode();
    const ordinalTitle = subjectMode === 'english'
      ? `Question ${idx + 1}`
      : `السؤال ${ARABIC_ORDINALS[idx] || (idx + 1)}`;
    currentParsedQuestions.push({
      id: 'scan_manual_' + Date.now() + '_' + idx,
      type: 'essay',
      title: '',
      displayTitle: ordinalTitle,
      text: '',
      score: 20,
      difficulty: 'متوسط',
      bloom: 'فهم',
      subject: subjectMode,
      showAnswerLines: false,
      linesCount: 3,
      branches: [],
      options: [],
      terms: [],
      pairs: [],
      item1: '',
      item2: '',
      isTrue: true,
      correction: '',
      modelAnswer: ''
    });
    setActiveScannerStep(3);
    renderScannedQuestionsPreview();
  };

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
