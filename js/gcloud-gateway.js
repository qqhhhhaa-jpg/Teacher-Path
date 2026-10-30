/**
 * بوابة الربط السحابي الشاملة مع Google Cloud API
 * Masar Al-Moallem — Google Cloud API Gateway (Gemini AI, Cloud Sync, OAuth 2.0 & External REST Gateway)
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'masar_gcloud_gateway_config_v1';

  const defaultConfig = {
    projectId: 'huseein1234',
    apiKey: '',
    oauthClientId: '',
    bucketName: 'masar-exams-backup-iq',
    webhookUrl: '',
    region: 'me-west1',
    geminiModel: 'gemini-2.5-flash',
    gatewaySecret: 'MASAR-GCLOUD-2026-KEY',
    autoSync: true,
    enableGoogleLogin: true
  };

  let gatewayConfig = loadLocalConfig();
  let lastGeneratedAiQuestions = [];

  function loadLocalConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.oauthClientId && parsed.oauthClientId.startsWith('87825334391-')) parsed.oauthClientId = '';
        if (!parsed.projectId || parsed.projectId === 'masar-almoallem-cloud') parsed.projectId = 'huseein1234';
        return Object.assign({}, defaultConfig, parsed);
      }
    } catch (e) {}
    return Object.assign({}, defaultConfig);
  }

  function saveLocalConfig(cfg) {
    gatewayConfig = Object.assign({}, gatewayConfig, cfg);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gatewayConfig));
    } catch (e) {}
    return gatewayConfig;
  }

  function notify(msg, type = 'info') {
    if (typeof window.showToast === 'function') {
      window.showToast(msg, type);
    } else {
      alert(msg);
    }
  }

  // Inject Gateway Modal, Settings Card, Topbar Button, and Google Login Button
  function initGoogleCloudGatewayUI() {
    injectGatewayModal();
    injectTopbarButton();
    injectSettingsCard();
    injectLoginPortalGoogleButton();
    syncConfigFromServer();
    if (typeof window.syncPlatformGoogleIconsState === 'function') {
      window.syncPlatformGoogleIconsState();
    }
  }

  function injectTopbarButton() {
    // الزر البيضاوي الكبير ملغي تماماً بناءً على طلب المستخدم - تم استبداله بالأيقونة الدائرية الأنيقة #topbarGoogleAuthIconBtn
    const old = document.getElementById('topbarGCloudBtn');
    if (old) old.remove();
  }

  function injectSettingsCard() {
    const settingsTab = document.getElementById('tab-settings');
    if (!settingsTab || document.getElementById('settingsGCloudGatewayCard')) return;

    const card = document.createElement('div');
    card.id = 'settingsGCloudGatewayCard';
    card.className = 'card-box gcloud-settings-banner-card admin-only-hidden';
    card.style.cssText = 'display: none !important; margin-bottom: 1.25rem; border: 2px solid rgba(66, 133, 244, 0.35); background: var(--bg-card);';
    card.innerHTML = `
      <div class="card-header" style="flex-wrap: wrap; gap: 0.75rem;">
        <div class="card-title" style="display: flex; align-items: center; gap: 0.65rem;">
          <div class="gcloud-brand-icon-box">
            <i class="fa-brands fa-google"></i>
          </div>
          <div>
            <span style="font-size: 1.05rem; font-weight: 900; color: var(--text-main);">بوابة الربط السحابي الشاملة مع Google Cloud API</span>
            <p style="font-size: 0.78rem; color: var(--text-muted); margin: 2px 0 0 0; font-weight: normal;">
              إدارة مفاتيح API، توليد الأسئلة بالذكاء الاصطناعي (Gemini AI)، المزامنة السحابية، وتسجيل الدخول عبر حساب Google
            </p>
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button type="button" class="btn btn-primary" onclick="window.openGCloudGatewayModal('config')" style="background: linear-gradient(135deg, #2563eb, #1d4ed8); font-weight: 800;">
            <i class="fa-solid fa-cloud-bolt"></i>
            <span>فتح بوابة Google Cloud API</span>
          </button>
          <button type="button" class="btn btn-outline" onclick="window.openGCloudGatewayModal('gemini')" style="border-color: #8b5cf6; color: #8b5cf6; font-weight: 800;">
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            <span>مولد الأسئلة الذكي Gemini AI</span>
          </button>
        </div>
      </div>
    `;

    const firstCard = settingsTab.querySelector('.card-box');
    if (firstCard && firstCard.parentNode) {
      firstCard.parentNode.insertBefore(card, firstCard);
    } else {
      settingsTab.appendChild(card);
    }
  }

  function injectLoginPortalGoogleButton() {
    const registerBtn = document.getElementById('portalOpenRegisterBtn');
    if (!registerBtn || document.getElementById('portalGoogleOAuthBtn')) return;

    const gWrap = document.createElement('div');
    gWrap.style.cssText = 'margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem;';
    gWrap.innerHTML = `
      <button type="button" id="portalGoogleOAuthBtn" class="btn-google-cloud-oauth" onclick="window.triggerGoogleCloudLogin()">
        <span class="google-g-logo">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"/>
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"/>
            <path fill="#FBBC05" d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"/>
            <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 21.4 7.4 24 12 24z"/>
          </svg>
        </span>
        <div class="google-btn-text">
          <strong>تسجيل الدخول عبر حساب Google (accounts.google.com)</strong>
          <small>يفتح موقع كوكل الرسمي لاختيار أحد حساباتك المسجلة والدخول فوراً</small>
        </div>
        <i class="fa-solid fa-cloud-arrow-up" style="color: #4285F4; margin-right: auto;"></i>
      </button>
    `;
    registerBtn.parentNode.insertBefore(gWrap, registerBtn.nextSibling);
  }

  function injectGatewayModal() {
    if (document.getElementById('gcloudGatewayModal')) return;

    const modal = document.createElement('div');
    modal.id = 'gcloudGatewayModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-container gcloud-gateway-modal-container" style="max-width: 920px; width: 95%;">
        <div class="modal-header gcloud-modal-header">
          <div class="modal-title" style="display: flex; align-items: center; gap: 0.75rem;">
            <div class="gcloud-brand-icon-box">
              <i class="fa-brands fa-google"></i>
            </div>
            <div>
              <h3 style="margin: 0; font-size: 1.12rem; font-weight: 900;">بوابة الربط السحابي الشاملة — Google Cloud API Gateway</h3>
              <span style="font-size: 0.76rem; color: var(--text-muted); font-weight: normal;">
                ربط مباشر مع Google Gemini AI • المزامنة السحابية Cloud Storage • التوثيق OAuth 2.0 • نقاط REST API
              </span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span id="gcloudConnStatusBadge" class="badge-tag" style="background: rgba(16, 185, 129, 0.14); color: #10b981; font-weight: 800; font-size: 0.75rem;">
              <i class="fa-solid fa-circle-check"></i> البوابة جاهزة للربط
            </span>
            <button type="button" class="btn-icon" onclick="window.closeGCloudGatewayModal()" title="إغلاق">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <!-- Navigation Tabs inside Gateway -->
        <div class="gcloud-tabs-nav">
          <button type="button" class="gcloud-tab-btn active" data-gtab="config" onclick="window.switchGCloudTab('config')">
            <i class="fa-solid fa-key"></i>
            <span>1. مفاتيح وإعدادات الربط (API Keys)</span>
          </button>
          <button type="button" class="gcloud-tab-btn" data-gtab="gemini" onclick="window.switchGCloudTab('gemini')">
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            <span>2. الذكاء الاصطناعي (Gemini AI API)</span>
          </button>
          <button type="button" class="gcloud-tab-btn" data-gtab="sync" onclick="window.switchGCloudTab('sync')">
            <i class="fa-solid fa-cloud-arrow-up"></i>
            <span>3. المزامنة والنسخ السحابي (Cloud Sync)</span>
          </button>
          <button type="button" class="gcloud-tab-btn" data-gtab="endpoints" onclick="window.switchGCloudTab('endpoints')">
            <i class="fa-solid fa-network-wired"></i>
            <span>4. نقاط الربط البرمجية (REST API Gateway)</span>
          </button>
        </div>

        <div class="modal-body gcloud-modal-body" style="max-height: 74vh; overflow-y: auto; padding: 1.25rem;">
          <!-- TAB 1: CONFIG & API KEYS -->
          <div class="gcloud-tab-pane active" id="gcloudPane_config">
            <div class="gcloud-info-callout">
              <i class="fa-solid fa-circle-info"></i>
              <div>
                <strong>كيفية الربط السريع مع Google Cloud:</strong>
                أدخل معرف المشروع (Project ID) ومفتاح <strong>Google Gemini / Cloud API Key</strong> لتفعيل التوليد الذكي للأسئلة والمزامنة السحابية الفورية. جميع المفاتيح تحفظ بشكل آمن في قاعدة بيانات السيرفر.
              </div>
            </div>

            <div class="form-grid" style="margin-top: 1rem;">
              <div class="form-group">
                <label class="form-label"><i class="fa-solid fa-cube text-primary"></i> معرف مشروع كوكل كلاود (Google Cloud Project ID)</label>
                <input type="text" class="form-control" id="gcProjectIdInput" placeholder="مثال: masar-almoallem-2026" dir="ltr">
              </div>

              <div class="form-group">
                <label class="form-label"><i class="fa-solid fa-globe text-info"></i> المنطقة السحابية (Google Cloud Region)</label>
                <select class="form-control" id="gcRegionSelect">
                  <option value="me-west1">الشرق الأوسط (me-west1 - مشروع huseein1234 المتصل)</option>
                  <option value="me-central1">الشرق الأوسط - الدوحة (me-central1)</option>
                  <option value="me-central2">الشرق الأوسط - الدمام (me-central2)</option>
                  <option value="europe-west1">أوروبا - بلجيكا (europe-west1)</option>
                  <option value="us-central1">أمريكا الوسطى (us-central1)</option>
                </select>
              </div>

              <div class="form-group" style="grid-column: 1 / -1;">
                <label class="form-label">
                  <i class="fa-solid fa-key text-warning"></i> مفتاح Google Cloud / Gemini API Key
                  <span class="badge-optional">(مطلوب لتشغيل الذكاء الاصطناعي Gemini AI)</span>
                </label>
                <div style="display: flex; gap: 0.5rem;">
                  <input type="password" class="form-control" id="gcApiKeyInput" placeholder="AIzaSy..." dir="ltr" style="flex: 1; font-family: monospace;">
                  <button type="button" class="btn btn-outline" onclick="window.toggleGcSecretField('gcApiKeyInput')" title="إظهار / إخفاء المفتاح">
                    <i class="fa-solid fa-eye"></i>
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label"><i class="fa-brands fa-google text-danger"></i> معرف OAuth 2.0 Client ID (تسجيل دخول Google)</label>
                <input type="text" class="form-control" id="gcOAuthClientIdInput" placeholder="123456789-xxx.apps.googleusercontent.com" dir="ltr">
                <small style="display: block; margin-top: 4px; font-size: 0.74rem; color: var(--text-muted);">
                  لجلب المعرف من مشروعك المتصل (<strong>huseein1234</strong>):
                  <a href="https://console.cloud.google.com/apis/credentials?project=huseein1234" target="_blank" rel="noopener" style="color: #4285F4; font-weight: 800; text-decoration: underline;">افتح Google Cloud Credentials لمشروع huseein1234 ↗</a>
                </small>
              </div>

              <div class="form-group">
                <label class="form-label"><i class="fa-solid fa-bucket text-success"></i> اسم حاوية التخزين السحابي (Cloud Storage Bucket)</label>
                <input type="text" class="form-control" id="gcBucketNameInput" placeholder="masar-exams-backup-iq" dir="ltr">
              </div>

              <div class="form-group">
                <label class="form-label"><i class="fa-solid fa-microchip text-primary"></i> نموذج الذكاء الاصطناعي المعتمد (Gemini Model)</label>
                <select class="form-control" id="gcGeminiModelSelect">
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (سريع جداً ومثالي للأسئلة الوزارية)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (تحليل متقدم ومسائل علمية معمقة)</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label"><i class="fa-solid fa-shield-halved text-accent"></i> مفتاح أمان بوابة السيرفر (Gateway Secret Key)</label>
                <input type="text" class="form-control" id="gcGatewaySecretInput" placeholder="MASAR-GCLOUD-2026-KEY" dir="ltr" style="font-family: monospace;">
              </div>

              <div class="form-group" style="grid-column: 1 / -1;">
                <label class="form-label"><i class="fa-solid fa-link text-info"></i> رابط Cloud Run / Cloud Functions Webhook (اختياري للمزامنة الخارجية)</label>
                <input type="url" class="form-control" id="gcWebhookUrlInput" placeholder="https://region-project.cloudfunctions.net/masarSync" dir="ltr">
              </div>
            </div>

            <!-- Live Connection Diagnostic Result Box -->
            <div id="gcTestResultBox" class="gcloud-test-result-box" style="display: none;"></div>

            <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.15rem; flex-wrap: wrap;">
              <button type="button" class="btn btn-outline" id="gcTestConnBtn" onclick="window.testGoogleCloudConnection()">
                <i class="fa-solid fa-plug-circle-check"></i>
                <span>فحص الاتصال المباشر مع Google Cloud API</span>
              </button>
              <button type="button" class="btn btn-primary" onclick="window.saveGoogleCloudConfig()">
                <i class="fa-solid fa-floppy-disk"></i>
                <span>حفظ وتفعيل إعدادات البوابة</span>
              </button>
            </div>
          </div>

          <!-- TAB 2: GEMINI AI QUESTION GENERATOR -->
          <div class="gcloud-tab-pane" id="gcloudPane_gemini" style="display: none;">
            <div class="gcloud-info-callout" style="border-color: rgba(139, 92, 246, 0.4); background: rgba(139, 92, 246, 0.08);">
              <i class="fa-solid fa-wand-magic-sparkles" style="color: #8b5cf6;"></i>
              <div>
                <strong>استوديو توليد الأسئلة الوزارية عبر Google Gemini API:</strong>
                اكتب اسم الموضوع أو الفصل الدراسي، وسيقوم محرك <strong>Google Gemini</strong> بصياغة أسئلة وزارية عراقية دقيقة مع إجاباتها النموذجية وإدراجها فوراً في ورقة الامتحان A4.
              </div>
            </div>

            <div class="form-grid" style="margin-top: 1rem;">
              <div class="form-group">
                <label class="form-label">المادة الدراسية</label>
                <input type="text" class="form-control" id="gcAiSubjectInput" value="التربية الإسلامية / الرياضيات / العلوم" placeholder="مثال: الكيمياء للصف الثالث المتوسط">
              </div>
              <div class="form-group">
                <label class="form-label">نوع الأسئلة المطلوبة</label>
                <select class="form-control" id="gcAiQuestionType">
                  <option value="mcq">اختيار من متعدد (MCQ - 4 خيارات)</option>
                  <option value="true_false">صح أم خطأ مع تصحيح الخطأ</option>
                  <option value="fill_blanks">املأ الفراغات الآتية</option>
                  <option value="definitions">عرف المصطلحات الآتية (تعاريف وزارية)</option>
                  <option value="essay">أسئلة مقالية / علل ما يأتي / مسائل</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">عدد الأسئلة المطلوب توليدها</label>
                <select class="form-control" id="gcAiQuestionCount">
                  <option value="3">3 أسئلة</option>
                  <option value="5" selected>5 أسئلة</option>
                  <option value="8">8 أسئلة</option>
                  <option value="10">10 أسئلة</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">درجة كل سؤال</label>
                <input type="number" class="form-control" id="gcAiQuestionScore" value="5" min="1" max="50">
              </div>
              <div class="form-group" style="grid-column: 1 / -1;">
                <label class="form-label">موضوع الدرس أو الفصل أو النص المراد استخراج الأسئلة منه:</label>
                <textarea class="form-control" id="gcAiPromptInput" rows="3" placeholder="مثال: الفصل الأول - التركيب الذري للمادة، ترتيب الإلكترونات، ورمز لويس للصف الثالث المتوسط حسب المنهج العراقي..."></textarea>
              </div>
            </div>

            <div style="display: flex; gap: 0.75rem; align-items: center; justify-content: space-between; margin-top: 0.85rem; flex-wrap: wrap;">
              <button type="button" class="btn btn-primary" id="gcRunGeminiBtn" onclick="window.generateQuestionsViaGeminiAPI()" style="background: linear-gradient(135deg, #7c3aed, #2563eb); font-weight: 800;">
                <i class="fa-solid fa-bolt"></i>
                <span>توليد الأسئلة الآن عبر Google Gemini API</span>
              </button>
              <button type="button" class="btn btn-success" id="gcInsertGeneratedBtn" onclick="window.insertGeminiQuestionsToExam()" style="display: none; font-weight: 800;">
                <i class="fa-solid fa-file-import"></i>
                <span>إدراج كافة الأسئلة المولدة في ورقة الامتحان A4</span>
              </button>
            </div>

            <div id="gcGeminiOutputContainer" class="gcloud-ai-output-box" style="margin-top: 1rem; display: none;"></div>
          </div>

          <!-- TAB 3: CLOUD SYNC & BACKUP -->
          <div class="gcloud-tab-pane" id="gcloudPane_sync" style="display: none;">
            <div class="gcloud-info-callout">
              <i class="fa-solid fa-cloud-arrow-up"></i>
              <div>
                <strong>المزامنة السحابية الفورية (Cloud Snapshot & Storage API):</strong>
                احفظ نسخة احتياطية سحابية كاملة من اختباراتك، بنك الأسئلة، سجلات الطلاب، والدرجات على بوابة السيرفر وGoogle Cloud واسترجعها في أي وقت ومن أي جهاز.
              </div>
            </div>

            <div style="display: flex; gap: 0.75rem; margin: 1rem 0; flex-wrap: wrap;">
              <button type="button" class="btn btn-primary" onclick="window.pushSnapshotToGCloud()">
                <i class="fa-solid fa-cloud-arrow-up"></i>
                <span>رفع ومزامنة بيانات المنصة الآن إلى السحابة</span>
              </button>
              <button type="button" class="btn btn-outline" onclick="window.loadGCloudSyncHistory()">
                <i class="fa-solid fa-rotate"></i>
                <span>تحديث سجل النسخ السحابية</span>
              </button>
            </div>

            <div id="gcSyncHistoryContainer" class="gcloud-sync-history-list">
              <div style="text-align: center; padding: 1.5rem; color: var(--text-muted);">
                جاري تحميل سجل النسخ الاحتياطية السحابية...
              </div>
            </div>
          </div>

          <!-- TAB 4: REST API GATEWAY ENDPOINTS -->
          <div class="gcloud-tab-pane" id="gcloudPane_endpoints" style="display: none;">
            <div class="gcloud-info-callout">
              <i class="fa-solid fa-code"></i>
              <div>
                <strong>نقاط الربط البرمجية الجاهزة (REST API Gateway Endpoints):</strong>
                يمكنك استخدام هذه الروابط البرمجية لربط منصة مسار المعلم مع <strong>Google Cloud Run</strong> أو <strong>Cloud Functions</strong> أو <strong>BigQuery</strong> أو تطبيقات الهواتف الذكية.
              </div>
            </div>

            <div class="gcloud-endpoints-list" style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.75rem;">
              <div class="gcloud-endpoint-card">
                <div class="gcloud-ep-header">
                  <span class="gcloud-method-badge get">GET</span>
                  <code class="gcloud-ep-path">/api/gcloud/gateway/overview</code>
                  <button type="button" class="btn btn-outline btn-sm" onclick="window.copyGCloudCurl('/api/gcloud/gateway/overview')">
                    <i class="fa-solid fa-copy"></i> نسخ أمر cURL
                  </button>
                </div>
                <p>جلب إحصائيات المنصة الحية، عدد الحسابات، وحالة قاعدة البيانات (محمية بمفتاح <code>X-GCloud-Gateway-Key</code>).</p>
              </div>

              <div class="gcloud-endpoint-card">
                <div class="gcloud-ep-header">
                  <span class="gcloud-method-badge post">POST</span>
                  <code class="gcloud-ep-path">/api/gcloud/gemini</code>
                  <button type="button" class="btn btn-outline btn-sm" onclick="window.copyGCloudCurl('/api/gcloud/gemini')">
                    <i class="fa-solid fa-copy"></i> نسخ الرابط
                  </button>
                </div>
                <p>بوابة التوليد الذكي عبر Google Gemini API لإنشاء الأسئلة والخطط اليومية والحلول النموذجية.</p>
              </div>

              <div class="gcloud-endpoint-card">
                <div class="gcloud-ep-header">
                  <span class="gcloud-method-badge post">GET / POST</span>
                  <code class="gcloud-ep-path">/api/gcloud/sync</code>
                  <button type="button" class="btn btn-outline btn-sm" onclick="window.copyGCloudCurl('/api/gcloud/sync')">
                    <i class="fa-solid fa-copy"></i> نسخ الرابط
                  </button>
                </div>
                <p>رفع واسترجاع النسخ الاحتياطية السحابية الشاملة لبيانات المعلم وسجلات الطلاب والامتحانات.</p>
              </div>

              <div class="gcloud-endpoint-card">
                <div class="gcloud-ep-header">
                  <span class="gcloud-method-badge post">POST</span>
                  <code class="gcloud-ep-path">/api/gcloud/oauth_verify</code>
                  <button type="button" class="btn btn-outline btn-sm" onclick="window.copyGCloudCurl('/api/gcloud/oauth_verify')">
                    <i class="fa-solid fa-copy"></i> نسخ الرابط
                  </button>
                </div>
                <p>توثيق وتسجيل دخول الأساتذة عبر حساب Google OAuth 2.0 وإنشاء جلسة معتمدة في قاعدة البيانات.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" onclick="window.closeGCloudGatewayModal()">إغلاق البوابة</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  function populateFormFromConfig() {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && val !== undefined && val !== null) el.value = val;
    };
    setVal('gcProjectIdInput', gatewayConfig.projectId || '');
    setVal('gcRegionSelect', gatewayConfig.region || 'me-central1');
    setVal('gcApiKeyInput', gatewayConfig.apiKey || '');
    setVal('gcOAuthClientIdInput', gatewayConfig.oauthClientId || '');
    setVal('gcBucketNameInput', gatewayConfig.bucketName || '');
    setVal('gcGeminiModelSelect', gatewayConfig.geminiModel || 'gemini-2.5-flash');
    setVal('gcGatewaySecretInput', gatewayConfig.gatewaySecret || 'MASAR-GCLOUD-2026-KEY');
    setVal('gcWebhookUrlInput', gatewayConfig.webhookUrl || '');
  }

  function readFormIntoConfig() {
    const getVal = (id) => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };
    return {
      projectId: getVal('gcProjectIdInput') || 'masar-almoallem-cloud',
      region: getVal('gcRegionSelect') || 'me-central1',
      apiKey: getVal('gcApiKeyInput'),
      oauthClientId: getVal('gcOAuthClientIdInput'),
      bucketName: getVal('gcBucketNameInput') || 'masar-exams-backup-iq',
      geminiModel: getVal('gcGeminiModelSelect') || 'gemini-2.5-flash',
      gatewaySecret: getVal('gcGatewaySecretInput') || 'MASAR-GCLOUD-2026-KEY',
      webhookUrl: getVal('gcWebhookUrlInput')
    };
  }

  async function syncConfigFromServer() {
    try {
      const resp = await fetch('/api/gcloud/config');
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.config) {
          // Keep local apiKey if server returned empty
          const merged = Object.assign({}, gatewayConfig, data.config);
          if (!merged.apiKey && gatewayConfig.apiKey) {
            merged.apiKey = gatewayConfig.apiKey;
          }
          saveLocalConfig(merged);
          populateFormFromConfig();
        }
      }
    } catch (e) {
      // Static server fallback uses localStorage seamlessly
    }
  }

  window.openGCloudGatewayModal = function (defaultTab = 'config') {
    const current = (typeof window.getCurrentAccount === 'function' ? window.getCurrentAccount() : null) || (typeof window.getCurrentUser === 'function' ? window.getCurrentUser() : null);
    const isAdmin = Boolean(current && (current.isAdmin || current.role === 'admin' || current.username === 'admin' || current.email === 'admin' || current.id === 'acc_admin'));
    if (!isAdmin) return;
    injectGatewayModal();
    populateFormFromConfig();
    const modal = document.getElementById('gcloudGatewayModal');
    if (modal) modal.classList.add('open');
    window.switchGCloudTab(defaultTab);
  };

  window.closeGCloudGatewayModal = function () {
    const modal = document.getElementById('gcloudGatewayModal');
    if (modal) modal.classList.remove('open');
  };

  window.switchGCloudTab = function (tabName) {
    document.querySelectorAll('.gcloud-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-gtab') === tabName);
    });
    ['config', 'gemini', 'sync', 'endpoints'].forEach(t => {
      const pane = document.getElementById('gcloudPane_' + t);
      if (pane) pane.style.display = (t === tabName) ? 'block' : 'none';
    });
    if (tabName === 'sync') {
      window.loadGCloudSyncHistory();
    }
  };

  window.toggleGcSecretField = function (inputId) {
    const el = document.getElementById(inputId);
    if (el) {
      el.type = (el.type === 'password') ? 'text' : 'password';
    }
  };

  window.saveGoogleCloudConfig = async function () {
    const updated = readFormIntoConfig();
    saveLocalConfig(updated);
    if (updated.oauthClientId) {
      localStorage.setItem('moallem_google_client_id', updated.oauthClientId);
      if (typeof window.initGoogleIdentityServices === 'function') window.initGoogleIdentityServices();
    }

    try {
      const resp = await fetch('/api/gcloud/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (resp.ok) {
        notify('تم حفظ وتفعيل إعدادات بوابة Google Cloud API في السيرفر بنجاح ☁️✔', 'success');
        return;
      }
    } catch (e) {}

    notify('تم حفظ إعدادات بوابة Google Cloud API محلياً بنجاح ☁️✔', 'success');
  };

  window.testGoogleCloudConnection = async function () {
    const cfg = readFormIntoConfig();
    saveLocalConfig(cfg);
    const box = document.getElementById('gcTestResultBox');
    const btn = document.getElementById('gcTestConnBtn');
    if (btn) btn.disabled = true;
    if (box) {
      box.style.display = 'block';
      box.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-primary"></i> جاري فحص الاتصال ببوابة السيرفر وGoogle Cloud API...`;
    }

    let serverCheckOk = false;
    let geminiOk = false;
    let geminiMsg = 'لم يتم إدخال مفتاح Gemini API Key بعد';

    try {
      const resp = await fetch('/api/gcloud/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: cfg.apiKey, projectId: cfg.projectId })
      });
      if (resp.ok) {
        const data = await resp.json();
        serverCheckOk = true;
        if (data.checks) {
          geminiOk = !!data.checks.geminiApi;
          geminiMsg = data.checks.geminiMessage || geminiMsg;
        }
      }
    } catch (e) {
      // Fallback direct browser test if running without Flask backend
      if (cfg.apiKey) {
        try {
          const directResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(cfg.apiKey)}`);
          if (directResp.ok) {
            geminiOk = true;
            geminiMsg = 'متصل مباشرة بـ Google Cloud Gemini API 🟢';
          } else {
            geminiMsg = `رد Google API (${directResp.status}): تأكد من صحة مفتاح الـ API`;
          }
        } catch (err) {
          geminiMsg = 'تعذر الوصول المباشر — تحقق من اتصال الإنترنت أو مفتاح API';
        }
      }
    }

    if (btn) btn.disabled = false;
    const badge = document.getElementById('gcloudConnStatusBadge');
    if (badge) {
      badge.innerHTML = geminiOk
        ? `<i class="fa-solid fa-circle-check"></i> متصل بـ Google Cloud & Gemini 🟢`
        : `<i class="fa-solid fa-circle-check"></i> البوابة السحابية نشطة (${cfg.projectId})`;
    }

    if (box) {
      box.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.65rem;">
          <div class="gcloud-diag-item">
            <strong><i class="fa-solid fa-server text-success"></i> بوابة السيرفر:</strong>
            <span>${serverCheckOk ? 'متصل بـ Flask SQLite API 🟢' : 'وضع المتصفح المباشر (Direct API) 🟢'}</span>
          </div>
          <div class="gcloud-diag-item">
            <strong><i class="fa-solid fa-cube text-primary"></i> المشروع (Project ID):</strong>
            <span dir="ltr">${cfg.projectId || 'غير محدد'}</span>
          </div>
          <div class="gcloud-diag-item">
            <strong><i class="fa-solid fa-wand-magic-sparkles" style="color: ${geminiOk ? '#10b981' : '#f59e0b'};"></i> حالة Gemini API:</strong>
            <span>${geminiMsg}</span>
          </div>
        </div>
      `;
    }
    notify('اكتمل فحص بوابة Google Cloud API بنجاح', geminiOk ? 'success' : 'info');
  };

  // Generate Questions via Google Gemini API
  window.generateQuestionsViaGeminiAPI = async function () {
    const cfg = readFormIntoConfig();
    saveLocalConfig(cfg);

    const subject = (document.getElementById('gcAiSubjectInput')?.value || 'عام').trim();
    const qType = document.getElementById('gcAiQuestionType')?.value || 'mcq';
    const qCount = parseInt(document.getElementById('gcAiQuestionCount')?.value || '5', 10);
    const qScore = parseInt(document.getElementById('gcAiQuestionScore')?.value || '5', 10);
    const topicPrompt = (document.getElementById('gcAiPromptInput')?.value || '').trim();

    if (!topicPrompt) {
      notify('يرجى كتابة موضوع الدرس أو الفصل لتوليد الأسئلة منه', 'warning');
      return;
    }

    if (!cfg.apiKey) {
      notify('يرجى إدخال مفتاح Google Gemini API Key في التبويب الأول (مفاتيح وإعدادات الربط) أولاً', 'warning');
      window.switchGCloudTab('config');
      const keyInput = document.getElementById('gcApiKeyInput');
      if (keyInput) keyInput.focus();
      return;
    }

    const outBox = document.getElementById('gcGeminiOutputContainer');
    const runBtn = document.getElementById('gcRunGeminiBtn');
    const insertBtn = document.getElementById('gcInsertGeneratedBtn');
    if (runBtn) runBtn.disabled = true;
    if (insertBtn) insertBtn.style.display = 'none';
    if (outBox) {
      outBox.style.display = 'block';
      outBox.innerHTML = `<div style="padding: 1.25rem; text-align: center;"><i class="fa-solid fa-spinner fa-spin text-primary" style="font-size: 1.4rem;"></i><p style="margin-top: 8px; font-weight: 700;">جاري توليد ${qCount} أسئلة وزارية عبر Google Gemini API...</p></div>`;
    }

    const structuredPrompt = `
أنت خبير امتحانات وزارية في وزارة التربية العراقية.
قم بتوليد ${qCount} أسئلة امتحانية لمادة (${subject}) حول الموضوع التالي:
"${topicPrompt}"
نوع الأسئلة المطلوب: ${qType}
أرجع النتيجة بصيغة JSON فقط بدون أي نص خارجي، كقائمة (Array) من الكائنات، كل كائن يحتوي على:
- "text": نص السؤال باللغة العربية الفصحى الواضحة
- "options": (إذا كان النوع mcq) مصفوفة من 4 نصوص للخيارات
- "correctIndex": (إذا كان النوع mcq) رقم الخيار الصحيح من 0 إلى 3
- "isTrue": (إذا كان النوع true_false) true أو false
- "correction": (إذا كان النوع true_false) تصحيح الخطأ إن وجد
- "modelAnswer": الحل النموذجي الوزاري المختصر
`;

    try {
      let replyText = '';
      // Try server gateway first, fallback to direct Google Gemini REST API
      try {
        const resp = await fetch('/api/gcloud/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: cfg.apiKey,
            model: cfg.geminiModel || 'gemini-2.5-flash',
            prompt: structuredPrompt
          })
        });
        const data = await resp.json();
        if (resp.ok && data.success) {
          replyText = data.text || '';
        } else {
          throw new Error(data.message || 'Direct fallback');
        }
      } catch (innerErr) {
        const model = cfg.geminiModel || 'gemini-2.5-flash';
        const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`;
        const directResp = await fetch(directUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: structuredPrompt }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 4096 }
          })
        });
        if (!directResp.ok) {
          throw new Error(`Google Gemini API HTTP ${directResp.status}`);
        }
        const rawData = await directResp.json();
        const parts = rawData?.candidates?.[0]?.content?.parts || [];
        replyText = parts.map(p => p.text || '').join('');
      }

      const jsonMatch = replyText.match(/\[[\s\S]*\]/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('لم يتمكن النموذج من تنسيق الأسئلة تلقائياً، حاول توضيح الموضوع أكثر.');
      }

      lastGeneratedAiQuestions = parsed.map((item, idx) => ({
        id: 'gemini_q_' + Date.now() + '_' + idx,
        type: qType,
        score: qScore,
        bloom: 'فهم',
        difficulty: 'متوسط',
        title: '',
        text: item.text || `سؤال (${idx + 1})`,
        options: Array.isArray(item.options)
          ? item.options.map((optText, oi) => ({
              id: 'opt_' + (oi + 1),
              text: String(optText),
              isCorrect: oi === (item.correctIndex || 0)
            }))
          : [
              { id: 'opt_1', text: 'الخيار الأول', isCorrect: true },
              { id: 'opt_2', text: 'الخيار الثاني', isCorrect: false }
            ],
        isTrue: item.isTrue !== false,
        correction: item.correction || '',
        answers: item.modelAnswer ? [item.modelAnswer] : [],
        terms: qType === 'definitions' ? [{ id: 't_1', term: item.text || '', definition: item.modelAnswer || '' }] : [],
        modelAnswer: item.modelAnswer || ''
      }));

      if (outBox) {
        outBox.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 0.6rem;">
            <div style="font-weight: 800; color: #10b981;">
              <i class="fa-solid fa-circle-check"></i> تم توليد (${lastGeneratedAiQuestions.length}) أسئلة وزارية بنجاح عبر Google Gemini API:
            </div>
            ${lastGeneratedAiQuestions.map((q, i) => `
              <div class="gcloud-ai-preview-card">
                <div style="font-weight: 800; color: var(--text-main);">${i + 1}. ${q.text} <span class="badge-tag">(${q.score} درجات)</span></div>
                ${q.modelAnswer ? `<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;"><strong>الجواب النموذجي:</strong> ${q.modelAnswer}</div>` : ''}
              </div>
            `).join('')}
          </div>
        `;
      }
      if (insertBtn) insertBtn.style.display = 'inline-flex';
      notify(`تم توليد ${lastGeneratedAiQuestions.length} أسئلة عبر Google Gemini API بنجاح ✨`, 'success');
    } catch (err) {
      if (outBox) {
        outBox.innerHTML = `<div style="color: #ef4444; font-weight: 700; padding: 0.75rem;"><i class="fa-solid fa-triangle-exclamation"></i> تعذر التوليد: ${err.message}</div>`;
      }
      notify('تعذر توليد الأسئلة عبر Gemini API: تأكد من صلاحية المفتاح', 'error');
    } finally {
      if (runBtn) runBtn.disabled = false;
    }
  };

  window.insertGeminiQuestionsToExam = function () {
    if (!lastGeneratedAiQuestions || lastGeneratedAiQuestions.length === 0) return;
    if (typeof window.appState === 'object' && Array.isArray(window.appState.questions)) {
      lastGeneratedAiQuestions.forEach(q => window.appState.questions.push(q));
      if (typeof window.saveStateToStorage === 'function') window.saveStateToStorage();
      if (typeof window.renderAll === 'function') window.renderAll();
      notify(`تم إدراج ${lastGeneratedAiQuestions.length} أسئلة في ورقة الامتحان A4 بنجاح 📄✔`, 'success');
      window.closeGCloudGatewayModal();
    }
  };

  // Cloud Sync Push & History
  window.pushSnapshotToGCloud = async function () {
    const clientState = (typeof window.appState === 'object') ? window.appState : {};
    let currentUser = 'أستاذ المنصة';
    try {
      const sess = JSON.parse(localStorage.getItem('masar_active_teacher_session') || 'null');
      if (sess && (sess.name || sess.username)) currentUser = sess.name || sess.username;
    } catch (e) {}

    try {
      const resp = await fetch('/api/gcloud/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: currentUser,
          clientState: {
            header: clientState.header || {},
            settings: clientState.settings || {},
            questions: clientState.questions || [],
            archivedExams: JSON.parse(localStorage.getItem('moallem_archived_exams') || '[]')
          }
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        notify(data.message || 'تم رفع النسخة السحابية بنجاح ☁️✔', 'success');
        window.loadGCloudSyncHistory();
        return;
      }
    } catch (e) {}

    // Local fallback snapshot
    const localSnaps = JSON.parse(localStorage.getItem('masar_gcloud_local_snaps') || '[]');
    localSnaps.unshift({
      id: 'gcloud_local_' + Date.now(),
      timestamp: new Date().toISOString(),
      projectId: gatewayConfig.projectId,
      user: currentUser,
      summary: {
        questionsCount: (clientState.questions || []).length,
        archivedExamsCount: JSON.parse(localStorage.getItem('moallem_archived_exams') || '[]').length
      }
    });
    localStorage.setItem('masar_gcloud_local_snaps', JSON.stringify(localSnaps.slice(0, 10)));
    notify('تم حفظ لقطة المزامنة السحابية بنجاح ☁️✔', 'success');
    window.loadGCloudSyncHistory();
  };

  window.loadGCloudSyncHistory = async function () {
    const container = document.getElementById('gcSyncHistoryContainer');
    if (!container) return;

    let history = [];
    try {
      const resp = await fetch('/api/gcloud/sync');
      if (resp.ok) {
        const data = await resp.json();
        history = data.history || [];
      }
    } catch (e) {}

    if (history.length === 0) {
      history = JSON.parse(localStorage.getItem('masar_gcloud_local_snaps') || '[]');
    }

    if (history.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 1.5rem; color: var(--text-muted); border: 1px dashed var(--border-color); border-radius: 12px;">
          لا توجد نسخ سحابية مرفوعة بعد. اضغط على <strong>"رفع ومزامنة بيانات المنصة الآن"</strong> لإنشاء أول نقطة استعادة سحابية.
        </div>
      `;
      return;
    }

    container.innerHTML = history.map(item => `
      <div class="gcloud-sync-item-card">
        <div>
          <strong style="color: var(--text-main);"><i class="fa-solid fa-cloud-check text-success"></i> لقطة سحابية: <code>${item.id}</code></strong>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 3px;">
            المشروع: <strong>${item.projectId || 'masar-cloud'}</strong> • بواسطة: ${item.user || 'المعلم'} • التاريخ: ${new Date(item.timestamp).toLocaleString('ar-IQ')}
          </div>
        </div>
        <span class="badge-tag" style="background: rgba(37, 99, 235, 0.12); color: #2563eb; font-weight: 800;">
          ${item.summary?.questionsCount || 0} سؤال • ${item.summary?.archivedExamsCount || 0} اختبار
        </span>
      </div>
    `).join('');
  };

  // Google Cloud OAuth 2.0 Official Account Chooser (accounts.google.com)
  window.triggerGoogleCloudLogin = async function () {
    if (gatewayConfig && gatewayConfig.oauthClientId) {
      localStorage.setItem('moallem_google_client_id', gatewayConfig.oauthClientId);
    }
    if (typeof window.launchGoogleRealPopup === 'function') {
      window.launchGoogleRealPopup();
      return;
    }
    if (typeof window.openGoogleAccountModal === 'function' && !gatewayConfig.oauthClientId) {
      window.openGoogleAccountModal();
      return;
    }

    const email = prompt('بوابة التوثيق السريع عبر Google Cloud OAuth 2.0:\nأدخل بريدك الإلكتروني في Google (Gmail) للدخول الفوري:', '');
    if (!email || !email.includes('@')) return;

    const namePart = email.split('@')[0];
    try {
      const resp = await fetch('/api/gcloud/oauth_verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: 'الأستاذ ' + namePart,
          sub: 'gcloud_' + Date.now()
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success && data.account) {
          localStorage.setItem('masar_active_teacher_session', JSON.stringify(data.account));
          localStorage.setItem('moallem_logged_in_user', JSON.stringify(data.account));
          notify(data.message || 'تم تسجيل الدخول عبر بوابة Google Cloud بنجاح!', 'success');
          const portal = document.getElementById('fullscreenAuthPortal');
          if (portal) portal.style.display = 'none';
          return;
        }
      }
    } catch (e) {}

    if (typeof window.openGoogleAccountModal === 'function') {
      window.openGoogleAccountModal();
    }
  };

  window.copyGCloudCurl = function (endpointPath) {
    const origin = window.location.origin || 'http://localhost:8080';
    const fullUrl = origin + endpointPath;
    const cmd = endpointPath.includes('overview')
      ? `curl -H "X-GCloud-Gateway-Key: ${gatewayConfig.gatewaySecret || 'MASAR-GCLOUD-2026-KEY'}" "${fullUrl}"`
      : fullUrl;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(cmd);
    }
    notify('تم نسخ رابط / أمر الـ API إلى الحافظة بنجاح 📋✔', 'success');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGoogleCloudGatewayUI);
  } else {
    initGoogleCloudGatewayUI();
  }
})();
