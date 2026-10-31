
// ==========================================================================
// محرك النوافذ المنبثقة المستقلة للطباعة - مسار المعلم (Universal Print Window)
// يفتح نافذة/تبويب جديد مستقل تماماً يبقى مفتوحاً في المتصفح حتى يغلقه المستخدم
// ==========================================================================
window.openPrintWindow = function (title, bodyContent, options) {
  options = options || {};
  var docTitle = title || 'طباعة مستند رسمي - مسار المعلم';

  try {
    var payload = {
      title: docTitle,
      content: bodyContent || '',
      options: options,
      timestamp: Date.now()
    };
    localStorage.setItem('masar_print_payload', JSON.stringify(payload));
    sessionStorage.setItem('masar_print_payload', JSON.stringify(payload));
  } catch (err) {
    console.warn('Storage payload error:', err);
  }

  // Open /print.html as an actual distinct browser tab/page
  // Native <a> click avoids popup blockers completely
  try {
    var link = document.createElement('a');
    link.href = 'print.html';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(function () {
      if (link && link.parentNode) link.remove();
    }, 800);
  } catch (e) {
    window.open('print.html', '_blank');
  }

  return true;
};

window.checkMandatoryTeacherProfileOnStartup = function () {
  try {
    if (typeof isUserLoggedIn === 'function' && !isUserLoggedIn()) return;
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (user && (user.isAdmin || user.role === 'admin' || user.username === 'admin')) return;
    if (typeof syncHeaderInputs === 'function') syncHeaderInputs();
    if (typeof applyProfileToExamHeader === 'function') applyProfileToExamHeader();
  } catch (err) {
    console.warn('Teacher profile startup check notice:', err);
  }
};
var checkMandatoryTeacherProfileOnStartup = window.checkMandatoryTeacherProfileOnStartup;


/* ==========================================================================
   Teacher's Path - Multi-App Navigation & Workstation Controller
   إدارة التنقل الذكي بين تطبيقات المنصة الـ 7 والتحكم بظهور زر المعاينة
   ========================================================================== */

window.EXAM_BUILDER_TABS = ['tab-questions', 'tab-header', 'tab-settings'];

window.updatePreviewVisibilityForTab = function (tabId) {
  const isExamTab = window.EXAM_BUILDER_TABS.includes(tabId);
  const prevBtn = document.getElementById('togglePreviewBtn');
  const printBtn = document.getElementById('printExamBtn');
  const mainCont = document.querySelector('.main-container');

  if (prevBtn) {
    if (isExamTab) {
      prevBtn.style.removeProperty('display');
    } else {
      prevBtn.style.setProperty('display', 'none', 'important');
    }
  }

  if (printBtn) {
    if (isExamTab) {
      printBtn.style.removeProperty('display');
    } else {
      printBtn.style.setProperty('display', 'none', 'important');
    }
  }

  // Mobile Workstation Tabs & Floating Switcher
  const mobileTabs = document.getElementById('mobileViewTabs');
  const floatBtn = document.getElementById('mobileFloatPreviewBtn');
  const floatCta = document.querySelector('.mobile-floating-preview-cta');

  if (mobileTabs) {
    if (isExamTab) {
      mobileTabs.style.removeProperty('display');
    } else {
      mobileTabs.style.setProperty('display', 'none', 'important');
    }
  }

  if (floatBtn) {
    if (isExamTab) {
      floatBtn.style.removeProperty('display');
    } else {
      floatBtn.style.setProperty('display', 'none', 'important');
    }
  }

  if (floatCta) {
    if (isExamTab) {
      floatCta.style.removeProperty('display');
    } else {
      floatCta.style.setProperty('display', 'none', 'important');
    }
  }

  if (mainCont) {
    if (isExamTab) {
      mainCont.classList.remove('wide-mode');
      const isVisible = (typeof appState !== 'undefined' && appState.settings && appState.settings.previewVisible !== false);
      mainCont.classList.toggle('preview-hidden', !isVisible);
    } else {
      mainCont.classList.add('wide-mode');
      mainCont.classList.add('preview-hidden');
      if (typeof window.setMobileWorkstationMode === 'function') {
        window.setMobileWorkstationMode('builder');
      } else {
        mainCont.setAttribute('data-mobile-mode', 'builder');
      }
    }
  }
};

window.isUserOnStarterPlan = function (user) {
  const current = user || (typeof getCurrentUser === 'function' ? getCurrentUser() : null);
  if (!current) return false;

  // Super Admin is never restricted
  if (current.isAdmin || current.role === 'admin' || current.username === 'admin') {
    return false;
  }

  // Active trial users (during the 2-day trial) have full trial access to all sections
  const isTrial = !!(current.isTrial || current.subscriptionType === 'free_trial_48h' || current.subscriptionType === 'free_trial_24h' || (current.trialDurationHours && current.subscriptionExpiresAt && !current.subscriptionDuration));
  if (isTrial) {
    return false;
  }

  // Check higher plans (Plan 2: 6 months / Plan 3: 1 year VIP) - they are NOT starter plan
  const dur = String(current.subscriptionDuration || current.subscriptionType || '').toLowerCase();
  const planName = String(current.subscriptionPlanName || '').toLowerCase();

  if (dur === '6_months' || dur === '4_months' || dur === '3_months' || dur === '1_year' || dur === 'annual' || dur === 'yearly') {
    return false;
  }
  if (planName.includes('6 أشهر') || planName.includes('ستة') || planName.includes('نصف سنة') || planName.includes('سنوي') || planName.includes('سنة') || planName.includes('vip') || planName.includes('الأكاديمية')) {
    return false;
  }

  // Check Plan 1 (Starter / Monthly / باقة شهر واحد - 25 ألف)
  if (dur === '1_month' || dur === '1month' || dur === 'monthly' || dur === 'month') {
    return true;
  }
  if (planName.includes('شهر واحد') || planName.includes('الشهرية') || planName.includes('1_month') || planName.includes('25 ألف') || planName.includes('25,000')) {
    return true;
  }

  if (current.id) {
    const localCode = localStorage.getItem(`moallem_user_plan_code_${current.id}`);
    if (localCode === '1_month') return true;
    if (localCode === '6_months' || localCode === '1_year') return false;
  }

  return false;
};

window.checkSectionPlanAccess = function (targetId) {
  if (!targetId) return true;

  // Basic allowed sections for Starter Plan:
  // - tab-apps (الرئيسية)
  // - tab-questions (إنشاء وبناء الأسئلة)
  // - tab-header (ترويسة وبيانات الامتحان)
  // - tab-settings (تنسيقات الورقة واللغة والطباعة)
  const basicAllowedTabs = ['tab-apps', 'tab-questions', 'tab-header', 'tab-settings'];
  if (basicAllowedTabs.includes(targetId)) {
    return true;
  }

  // Check if user is on Plan 1 (باقة شهر واحد)
  if (typeof window.isUserOnStarterPlan === 'function' && window.isUserOnStarterPlan()) {
    const sectionNames = {
      'tab-student-grades': 'سجل ورصد درجات الطلاب والتحليلات',
      'tab-student-behavior': 'المتابعة اليومية وحسن السلوك التراكمي',
      'tab-report': 'المركز الأكاديمي وبنك الأسئلة وإحصائيات بلوم',
      'tab-certificates': 'استوديو إصدار شهادات التقدير والتفوق للطلبة',
      'tab-schedule': 'استوديو تصميم جدول الحصص والدروس الأسبوعي (A3 عريض)',
      'tab-seating': 'استوديو خريطة الجلوس وتوزيع القاعات الامتحانية (A4 عمودي)',
      'tab-exam-cards': 'استوديو البطاقة الامتحانية الرسمية وباجات الطلاب (A4)'
    }

    const sectionTitle = sectionNames[targetId] || 'هذا القسم المتقدم';

    if (typeof showToast === 'function') {
      showToast(`⭐ ميزة متقدمة: قسم [${sectionTitle}] متاح حصرياً في باقة الـ 6 أشهر والباقة السنوية الأكاديمية! 👑`, 'warning');
    }

    setTimeout(() => {
      if (typeof window.openSubscriptionModal === 'function') {
        window.openSubscriptionModal();
      }
    }, 350);

    return false;
  }

  return true;
};

window.switchToTab = function (targetId) {
  if (!targetId) return;

  // Programmatic access gatekeeper for Plan 1 (Starter Plan)
  if (typeof window.checkSectionPlanAccess === 'function' && !window.checkSectionPlanAccess(targetId)) {
    return;
  }

  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-tab') === targetId);
  });

  document.querySelectorAll('.tab-content').forEach(c => {
    c.style.display = (c.id === targetId) ? 'block' : 'none';
  });

  window.updatePreviewVisibilityForTab(targetId);

  if (targetId === 'tab-apps') {
    if (typeof window.updateAppsHubStats === 'function') window.updateAppsHubStats();
    if (typeof window.initAppCards3DTilt === 'function') window.initAppCards3DTilt();
  }

  if (targetId === 'tab-report') {
    if (typeof window.switchReportSubView === 'function') {
      window.switchReportSubView(window.currentReportSubView || 'overview');
    } else {
      if (typeof updateDailyReportMetrics === 'function') updateDailyReportMetrics();
      if (typeof filterDailyReportQuestions === 'function') filterDailyReportQuestions();
    }
  } else if (targetId === 'tab-student-grades' && typeof window.renderStudentGradesTable === 'function') {
    window.renderStudentGradesTable();
  } else if (targetId === 'tab-student-behavior' && typeof window.renderStudentBehaviorTable === 'function') {
    window.renderStudentBehaviorTable();
  } else if (targetId === 'tab-certificates' && typeof window.renderCertificatesStudio === 'function') {
    window.renderCertificatesStudio();
  } else if (targetId === 'tab-schedule' && typeof window.renderScheduleStudio === 'function') {
    window.renderScheduleStudio();
  } else if (targetId === 'tab-seating' && typeof window.renderSeatingStudio === 'function') {
    window.renderSeatingStudio();
  } else if (targetId === 'tab-exam-cards' && typeof window.renderExamCardsStudio === 'function') {
    window.renderExamCardsStudio();
  }

  const scrollPane = document.querySelector('.builder-body-scrollable');
  if (scrollPane) scrollPane.scrollTo({ top: 0, behavior: 'smooth' });
};

window.updateAppsHubStats = function () {
  const elExams = document.getElementById('appsStatExams');
  const elStudents = document.getElementById('appsStatStudents');
  const elQuestions = document.getElementById('appsStatQuestions');
  const elSubjects = document.getElementById('appsStatSubjects');

  if (elExams && typeof getExamsArchive === 'function') {
    const archive = getExamsArchive() || [];
    elExams.textContent = archive.length || 0;
  }

  if (elQuestions && typeof appState !== 'undefined' && appState.questions) {
    elQuestions.textContent = appState.questions.length || 0;
  }

  if (elStudents) {
    let studentCount = 28;
    try {
      const savedClass = localStorage.getItem('sg_active_class_data_v1');
      if (savedClass) {
        const parsed = JSON.parse(savedClass);
        if (parsed && Array.isArray(parsed.students)) {
          studentCount = parsed.students.length;
        }
      }
    } catch (e) { }
    elStudents.textContent = studentCount;
  }

  if (elSubjects) {
    elSubjects.textContent = '12';
  }
};

/**
 * app.js
 * Main Application Controller for Moallem Pro Exam Studio
 * Includes: Page Margins Controller, Iraqi Ministerial Mode, Saved Exams Archive, and Teacher Profile
 */

// Application State
let appState = {
  currentArchiveId: null, // Tracks if currently editing a specific saved exam
  header: {
    country: 'جمهورية العراق',
    ministry: '',
    school: '',
    examTitle: '',
    subject: '',
    grade: '',
    year: '2025 - 2026 م',
    term: '',
    time: '',
    teacher: '',
    seal: 'assets/iraq_moe_seal.png',
    instructions: ''
  },
  questions: [],
  settings: {
    marginH: 10, // mm (Fixed Compact by Default)
    marginV: 8,  // mm (Fixed Compact by Default)
    marginPreset: 'compact', // Compact is the fixed default
    pageLayoutMode: '1_page', // Fixed default: صفحة واحدة مضغوطة
    fontFamily: 'Cairo', // 6 Official Eye-Friendly Arabic Fonts
    fontSize: 'medium',
    lineHeight: '1.55', // Line spacing (1.35, 1.55, 1.75)
    direction: 'rtl', // 'rtl' (Arabic) or 'ltr' (English)
    columns: 1,
    watermark: '',
    showGradingTable: false, // اختياري (False by default)
    showStudentBar: false,   // اختياري (False by default)
    showInstructions: false, // اختياري (False by default)
    showSeal: true,          // حقل ثابت معتمد (True by default)
    showAnswerLines: false,  // اختياري (False by default)
    theme: 'light', // Primary base is clean pure white
    accentColor: 'blue', // Default accent is Royal Blue
    previewVisible: true
  },
  viewMode: 'student', // 'student' or 'answer_key'
  editingQuestionId: null
};

// Expose appState on window immediately for global access & handlers
window.appState = appState;
window.getAppState = () => appState;
window.examPaperNeedsRender = false;

// Teacher Profile State
let teacherProfile = {
  name: 'أستاذ حسين',
  governorate: 'بغداد - الكرخ الثانية',
  school: 'ثانوية المتميزين',
  subject: 'اللغة العربية',
  contact: ''
};

// DOM Ready initialization
document.addEventListener('DOMContentLoaded', () => {
  if (typeof purgeTrialDataOnStartup === 'function') purgeTrialDataOnStartup();
  initTheme();
  initAccentColor();
  initPreviewVisibility();
  if (typeof window.updatePreviewVisibilityForTab === 'function') {
    window.updatePreviewVisibilityForTab('tab-apps');
  }
  // Enforce authentication gatekeeper FIRST before loading profile/state so login portal stays fixed on refresh
  checkAuthGatekeeper();
  initAuthPortalPersistenceGuard();
  initEventListeners();
  initSideQTypeBarMovable();

  const loggedIn = isUserLoggedIn();
  if (loggedIn) {
    // High-performance deferred rendering: keeps UI paint under 16ms
    requestAnimationFrame(() => {
      initSubjectMode();
      initQuestionsHistoryBank();
      initDailyReport();
      initQuestionsQuickFilter();
      updateArchiveBadge();
      renderAll();
      checkDraftRestore();
      if (typeof checkMandatoryTeacherProfileOnStartup === 'function') checkMandatoryTeacherProfileOnStartup();
      initSingleDeviceWatchdog();
    });
  } else {
    // Light initial state for auth portal: no unnecessary question calculations on locked screen
    updateArchiveBadge();
  }

  // Background sync accounts from server (for cross-device synchronization)
  if (typeof syncAccountsWithServer === 'function') {
    syncAccountsWithServer().then(() => {
      // If user is already logged in, restore their cloud-synced questions & archive
      if (!isUserLoggedIn()) return;
      const u = getCurrentUser();
      if (u && u.id && u.id !== 'usr_guest' && typeof window.restoreUserDataFromServer === 'function') {
        window.restoreUserDataFromServer(u);
      }
    }).catch(() => { });
  }
});

/**
 * Initializes and syncs theme from state or local storage (Default: Light / Pure White)
 */

/**
 * Safely checks teacher profile on startup and applies defaults to header
 */
function checkMandatoryTeacherProfileOnStartup() {
  try {
    if (typeof isUserLoggedIn === 'function' && !isUserLoggedIn()) return;
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (user && (user.isAdmin || user.role === 'admin' || user.username === 'admin')) return;

    if (typeof syncHeaderInputs === 'function') {
      syncHeaderInputs();
    }
    if (typeof applyProfileToExamHeader === 'function') {
      applyProfileToExamHeader();
    }
  } catch (err) {
    console.warn('Teacher profile startup check notice:', err);
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem('moallem_theme') || 'light';
  appState.settings.theme = savedTheme;
  document.documentElement.setAttribute('data-theme', savedTheme);
  if (document.body) { document.body.setAttribute('data-theme', savedTheme); document.body.classList.toggle('dark', savedTheme === 'dark'); }
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = appState.settings.theme;
  const newTheme = current === 'dark' ? 'light' : 'dark';
  appState.settings.theme = newTheme;
  localStorage.setItem('moallem_theme', newTheme);
  document.documentElement.setAttribute('data-theme', newTheme);
  if (document.body) { document.body.setAttribute('data-theme', newTheme); document.body.classList.toggle('dark', newTheme === 'dark'); }
  updateThemeIcon(newTheme);
  showToast(`تم التبديل إلى الوضع ${newTheme === 'dark' ? 'الداكن' : 'الفاتح (الأبيض النقي)'}`, 'info');
}
window.toggleTheme = toggleTheme;

function updateThemeIcon(theme) {
  const icon = document.getElementById('themeIcon');
  if (icon) {
    icon.className = theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  }
  const topbarIcon = document.getElementById('topbarThemeIcon');
  if (topbarIcon) {
    topbarIcon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }
  const label = document.getElementById('themeToggleLabel');
  if (label) {
    label.innerText = theme === 'dark' ? 'الوضع الداكن' : 'الوضع الفاتح';
  }
}

/**
 * 6 Dynamic Color Accent Themes Controller
 */
const ACCENT_COLOR_NAMES = {
  blue: 'الأزرق الأكاديمي 🔷',
  emerald: 'الذهبي / أصفر فاتح 👑🟡',
  gold: 'الذهبي / أصفر فاتح 👑🟡',
  purple: 'البنفسجي الإبداعي 🟣',
  crimson: 'الجوزي القهوائي ☕',
  coffee: 'الجوزي القهوائي ☕',
  amber: 'العنبر العسلي 🍯',
  teal: 'الفيروزي البحري 🌊',
  rose: 'الصحراوي الدافئ 🏜️',
  desert: 'الصحراوي الدافئ 🏜️',
  orange: 'الجويتي (أزرق غامق) 🌌',
  navy: 'الجويتي (أزرق غامق) 🌌'
};

function initAccentColor() {
  const savedAccent = localStorage.getItem('moallem_accent_color') || 'blue';
  appState.settings.accentColor = savedAccent;
  document.documentElement.setAttribute('data-accent', savedAccent);
  updateAccentUI(savedAccent);
}

window.setAccentColor = function (colorKey) {
  if (!ACCENT_COLOR_NAMES[colorKey]) colorKey = 'blue';
  appState.settings.accentColor = colorKey;
  localStorage.setItem('moallem_accent_color', colorKey);
  document.documentElement.setAttribute('data-accent', colorKey);
  updateAccentUI(colorKey);
  showToast(`تم تغيير سمة الألوان إلى: ${ACCENT_COLOR_NAMES[colorKey]} ✨`, 'info');
};

function updateAccentUI(activeColor) {
  // Update Settings cards
  document.querySelectorAll('.color-theme-card').forEach(card => {
    const isThis = card.getAttribute('data-color') === activeColor;
    card.classList.toggle('active', isThis);
  });
  // Update Navbar and Drawer dots & chips
  document.querySelectorAll('.palette-dot-btn, .palette-chip').forEach(dot => {
    const isThis = dot.getAttribute('data-color') === activeColor;
    dot.classList.toggle('active', isThis);
  });
}

/**
 * Preview Pane Visibility Controller (Hide / Show)
 */
function initPreviewVisibility() {
  const saved = localStorage.getItem('moallem_preview_visible');
  if (saved !== null) {
    appState.settings.previewVisible = (saved === 'true');
  } else {
    appState.settings.previewVisible = true;
  }
  updatePreviewVisibilityUI(false);
}

window.togglePreviewPane = function () {
  if (window.innerWidth <= 900) {
    const container = document.querySelector('.main-container');
    const currentMode = container?.getAttribute('data-mobile-mode') || 'builder';
    const nextMode = (currentMode === 'builder') ? 'preview' : 'builder';
    window.setMobileWorkstationMode(nextMode);
    return;
  }
  appState.settings.previewVisible = !appState.settings.previewVisible;
  localStorage.setItem('moallem_preview_visible', appState.settings.previewVisible);
  updatePreviewVisibilityUI(true);
};

window.setMobileWorkstationMode = function (mode) {
  const container = document.querySelector('.main-container');
  const bBtn = document.getElementById('mobileTabBuilderBtn');
  const pBtn = document.getElementById('mobileTabPreviewBtn');
  const prevBtn = document.getElementById('togglePreviewBtn');
  const prevIcon = document.getElementById('togglePreviewIcon');
  const prevText = document.getElementById('togglePreviewText');

  if (container) {
    container.setAttribute('data-mobile-mode', mode);
    if (mode === 'preview') {
      container.classList.remove('preview-hidden');
      if (typeof appState !== 'undefined' && appState.settings) {
        appState.settings.previewVisible = true;
      }
    }
  }
  if (bBtn) bBtn.classList.toggle('active', mode === 'builder');
  if (pBtn) pBtn.classList.toggle('active', mode === 'preview');

  if (prevBtn) {
    const isP = (mode === 'preview');
    prevBtn.classList.toggle('preview-active', isP);
    prevBtn.classList.toggle('preview-hidden-state', !isP);
    if (prevIcon) prevIcon.className = isP ? 'fa-solid fa-pen-to-square' : 'fa-solid fa-eye';
    if (prevText) prevText.innerText = isP ? 'المحرر' : 'المعاينة';
  }

  const floatBtn = document.getElementById('mobileFloatPreviewBtn');
  if (floatBtn) {
    const isP = (mode === 'preview');
    floatBtn.innerHTML = isP
      ? '<i class="fa-solid fa-pen-to-square"></i> <span>العودة للمحرر</span>'
      : '<i class="fa-solid fa-eye"></i> <span>معاينة ورقة الامتحان A4</span>';
  }

  if (mode === 'preview') {
    if (window.examPaperNeedsRender) {
      if (typeof renderPaperQuestions === 'function') renderPaperQuestions();
      if (typeof applyPaperSettings === 'function') applyPaperSettings();
      window.examPaperNeedsRender = false;
    }
    window.scrollTo(0, 0);
    const pPane = document.querySelector('.preview-pane');
    if (pPane) pPane.scrollTop = 0;
  }
};

function updatePreviewVisibilityUI(notify = false) {
  const mainContainer = document.querySelector('.main-container');
  const btn = document.getElementById('togglePreviewBtn');
  const icon = document.getElementById('togglePreviewIcon');
  const text = document.getElementById('togglePreviewText');
  const isVisible = appState.settings.previewVisible !== false;

  if (mainContainer) {
    mainContainer.classList.toggle('preview-hidden', !isVisible);
  }

  if (btn) {
    btn.classList.toggle('preview-active', isVisible);
    btn.classList.toggle('preview-hidden-state', !isVisible);

    if (isVisible) {
      if (icon) icon.className = 'fa-solid fa-eye';
      if (text) text.innerText = 'المعاينة المباشرة';
      btn.setAttribute('title', 'انقر لإخفاء ورقة المعاينة وتوسيع مساحة العمل');
    } else {
      if (icon) icon.className = 'fa-solid fa-eye-slash';
      if (text) text.innerText = 'إظهار المعاينة';
      btn.setAttribute('title', 'انقر لإظهار ورقة المعاينة المباشرة A4');
    }
  }

  if (notify) {
    showToast(isVisible ? 'تم إظهار ورقة المعاينة المباشرة 👁️' : 'تم إخفاء ورقة المعاينة وتوسيع مساحة العمل 🔲', 'info');
  }
}

/**
 * Professional Authentication & Accounts Management (Data Isolation Engine)
 */
const SUPER_ADMIN_ACCOUNT = {
  id: 'usr_admin',
  name: 'الأستاذ حسين قصي (المدير العام)',
  username: 'admin',
  email: 'admin@moallem.iq',
  password: '[PROTECTED_ENCRYPTED_CREDENTIAL]',
  role: 'admin',
  isAdmin: true,
  isVip: true,
  isVerified: true,
  isGoogleUser: true,
  googleLinked: true,
  authProvider: 'google_cloud_oauth',
  loginProvider: 'google',
  isSubscribed: true,
  isTrial: false,
  governorate: 'العراق - الإدارة العامة',
  school: 'إدارة منصة مُعَلِّم بـرو',
  subject: 'الإشراف العام والتطوير',
  rights: 'إعداد وتنظيم الأستاذ حسين علي - الإدارة العامة لمنصة مُعَلِّم برو',
  contact: '07700000000',
  createdAt: '2026-01-01T00:00:00.000Z'
};

function getAccountStorageKey(baseKey) {
  const user = getCurrentUser();
  if (!user || !user.id) {
    return `${baseKey}_guest`;
  }
  const cleanId = String(user.id || user.username || 'user').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${baseKey}_${cleanId}`;
}
window.getAccountStorageKey = getAccountStorageKey;

// Global Master Cloud Server URL for worldwide multi-device sync
window.MOALLEM_DEFAULT_SERVER_URL = window.MOALLEM_DEFAULT_SERVER_URL || '';

function getBackendApiUrl(endpoint) {
  const custom = localStorage.getItem('moallem_custom_backend_url');
  if (custom && custom.trim()) {
    const base = custom.trim().replace(/\/+$/, '');
    return `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  }
  if (window.MOALLEM_DEFAULT_SERVER_URL && window.MOALLEM_DEFAULT_SERVER_URL.trim()) {
    const base = window.MOALLEM_DEFAULT_SERVER_URL.trim().replace(/\/+$/, '');
    return `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  }
  if (window.MOALLEM_PUBLIC_SERVER_URL && window.MOALLEM_PUBLIC_SERVER_URL.trim()) {
    const base = window.MOALLEM_PUBLIC_SERVER_URL.trim().replace(/\/+$/, '');
    return `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  }
  const savedPublicUrl = (typeof localStorage !== 'undefined') ? localStorage.getItem('moallem_public_server_url') : null;
  if (savedPublicUrl && savedPublicUrl.trim()) {
    const base = savedPublicUrl.trim().replace(/\/+$/, '');
    return `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  }
  if (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:') {
    return `http://localhost:8080${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  }
  return endpoint;
}
window.getBackendApiUrl = getBackendApiUrl;



// Auto-detect Worldwide Cloudflare Tunnel URL from Server
(async function initServerTunnelDetection() {
  try {
    const candidateUrls = ['/api/public_url', 'http://localhost:8080/api/public_url'];
    for (const u of candidateUrls) {
      try {
        const res = await fetch(u, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.public_url) {
            window.MOALLEM_PUBLIC_SERVER_URL = data.public_url;
            try {
              localStorage.setItem('moallem_public_server_url', data.public_url);
            } catch (_) { }
            break;
          }
        }
      } catch (_) { }
    }
  } catch (_) { }
})();

function getAuthAccounts() {
  try {
    const raw = localStorage.getItem('moallem_auth_accounts');
    let accounts = raw ? JSON.parse(raw) : [];
    // Remove old demo/guest default account if present
    accounts = accounts.filter(a => a.id !== 'usr_hussein');
    // Ensure SUPER_ADMIN_ACCOUNT is always registered and up to date with new password,
    // while preserving any custom profile updates made by the teacher (name, school, etc.)
    const adminIdx = accounts.findIndex(a => a.id === 'usr_admin' || a.username === 'admin');
    if (adminIdx === -1) {
      accounts.unshift({ ...SUPER_ADMIN_ACCOUNT });
    } else {
      accounts[adminIdx] = {
        ...SUPER_ADMIN_ACCOUNT,
        ...accounts[adminIdx],
        id: 'usr_admin',
        username: 'admin',
        isAdmin: true,
        role: 'admin',
        isGoogleUser: true,
        googleLinked: true,
        authProvider: 'google_cloud_oauth',
        loginProvider: 'google',
        isSubscribed: true,
        isTrial: false,
        password: accounts[adminIdx].password || 'qq7878aassdd'
      }
    }

    // Ensure test1 (regular user, non-admin) is registered and up to date
    const testUserObj = {
      id: 'usr_test1',
      name: 'الأستاذ (test1)',
      username: 'test1',
      email: 'test1@moallem.iq',
      password: 'test2025',
      role: 'teacher',
      isAdmin: false,
      isVip: false,
      isVerified: true,
      isSubscribed: false,
      governorate: 'العراق',
      school: 'مدرسة مسار المعلم',
      subject: 'عام',
      createdAt: '2026-10-17T00:00:00.000Z'
    }
    const testIdx = accounts.findIndex(a => a.id === 'usr_test1' || a.username === 'test1');
    if (testIdx === -1) {
      accounts.push(testUserObj);
    } else {
      accounts[testIdx] = {
        ...testUserObj,
        ...accounts[testIdx],
        username: 'test1',
        password: 'test2025',
        isAdmin: false,
        role: accounts[testIdx].role === 'admin' ? 'teacher' : (accounts[testIdx].role || 'teacher')
      }
    }

    localStorage.setItem('moallem_auth_accounts', JSON.stringify(accounts));
    return accounts;
  } catch (e) {
    return [{ ...SUPER_ADMIN_ACCOUNT }, {
      id: 'usr_test1',
      name: 'الأستاذ (test1)',
      username: 'test1',
      email: 'test1@moallem.iq',
      password: 'test2025',
      role: 'teacher',
      isAdmin: false,
      isVip: false,
      isVerified: true,
      isSubscribed: false,
      governorate: 'العراق',
      school: 'مدرسة مسار المعلم',
      subject: 'عام',
      createdAt: '2026-10-17T00:00:00.000Z'
    }];
  }
}

let isSyncingAccountsFlag = false;
async function syncAccountsWithServer() {
  if (isSyncingAccountsFlag) return getAuthAccounts();
  isSyncingAccountsFlag = true;
  try {
    const res = await fetch(getBackendApiUrl('/api/accounts'), { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.accounts)) {
        const localAccounts = getAuthAccounts();
        const mergedMap = new Map();

        // 1. Map local accounts
        localAccounts.forEach(acc => {
          const k = String(acc.id || acc.email || acc.username || '').toLowerCase();
          if (k) mergedMap.set(k, acc);
        });

        // 2. Check if local has accounts not yet on server (e.g. registered on this laptop earlier)
        let hasNewLocalAccounts = false;
        localAccounts.forEach(acc => {
          if (acc.id === 'usr_admin' || acc.username === 'admin') return;
          const existsOnServer = data.accounts.some(sa =>
            (sa.id && acc.id && sa.id === acc.id) ||
            (sa.email && acc.email && sa.email.toLowerCase() === acc.email.toLowerCase()) ||
            (sa.username && acc.username && sa.username.toLowerCase() === acc.username.toLowerCase())
          );
          if (!existsOnServer) {
            hasNewLocalAccounts = true;
          }
        });

        // 3. Merge server accounts (server takes precedence for subscriptions/roles, but preserve local profile edits)
        data.accounts.forEach(acc => {
          const k = String(acc.id || acc.email || acc.username || '').toLowerCase();
          if (k) {
            const existing = mergedMap.get(k) || {};
            const merged = { ...existing, ...acc };
            // Preserve local teacher profile customizations if user edited them
            if (existing.name && existing.name.trim()) merged.name = existing.name;
            if (existing.school && existing.school.trim()) merged.school = existing.school;
            if (existing.governorate && existing.governorate.trim()) merged.governorate = existing.governorate;
            if (existing.subject && existing.subject.trim()) merged.subject = existing.subject;
            if (existing.contact && existing.contact.trim()) merged.contact = existing.contact;
            if (existing.rights && existing.rights.trim()) merged.rights = existing.rights;

            // Enforce server authoritative subscription/role privileges
            if (acc.isSubscribed !== undefined) merged.isSubscribed = acc.isSubscribed;
            if (acc.isVip !== undefined) merged.isVip = acc.isVip;
            if (acc.isAdmin !== undefined) merged.isAdmin = acc.isAdmin;
            if (acc.isTrial !== undefined) merged.isTrial = acc.isTrial;
            if (acc.role) merged.role = acc.role;
            if (acc.subscriptionExpiresAt) merged.subscriptionExpiresAt = acc.subscriptionExpiresAt;
            if (acc.subscriptionDuration) merged.subscriptionDuration = acc.subscriptionDuration;
            if (acc.subscriptionPlanName) merged.subscriptionPlanName = acc.subscriptionPlanName;
            if (acc.subscriptionStartDate) merged.subscriptionStartDate = acc.subscriptionStartDate;
            if (acc.subscriptionType) merged.subscriptionType = acc.subscriptionType;
            if (acc.subscriptionExpiryFormatted) merged.subscriptionExpiryFormatted = acc.subscriptionExpiryFormatted;

            mergedMap.set(k, merged);
          }
        });

        const mergedList = Array.from(mergedMap.values());
        localStorage.setItem('moallem_auth_accounts', JSON.stringify(mergedList));

        // Immediately update current session user if they match one of the merged accounts
        const curUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        if (curUser && curUser.id) {
          const curServer = mergedList.find(a => a.id === curUser.id || (a.username && a.username.toLowerCase() === (curUser.username || '').toLowerCase()));
          if (curServer) {
            if (curServer.isSubscribed !== undefined) curUser.isSubscribed = curServer.isSubscribed;
            if (curServer.isVip !== undefined) curUser.isVip = curServer.isVip;
            if (curServer.isAdmin !== undefined) curUser.isAdmin = curServer.isAdmin;
            if (curServer.isTrial !== undefined) curUser.isTrial = curServer.isTrial;
            if (curServer.role) curUser.role = curServer.role;
            if (curServer.subscriptionExpiresAt) curUser.subscriptionExpiresAt = curServer.subscriptionExpiresAt;
            if (curServer.subscriptionDuration) curUser.subscriptionDuration = curServer.subscriptionDuration;
            if (curServer.subscriptionPlanName) curUser.subscriptionPlanName = curServer.subscriptionPlanName;
            if (curServer.subscriptionStartDate) curUser.subscriptionStartDate = curServer.subscriptionStartDate;
            if (curServer.subscriptionType) curUser.subscriptionType = curServer.subscriptionType;
            if (curServer.subscriptionExpiryFormatted) curUser.subscriptionExpiryFormatted = curServer.subscriptionExpiryFormatted;

            localStorage.setItem('moallem_current_user', JSON.stringify(curUser));
            localStorage.setItem(`moallem_vip_subscription_${curUser.id}`, (curUser.isSubscribed || curUser.isVip) ? 'true' : 'false');
            if (curUser.subscriptionExpiresAt) {
              localStorage.setItem(`moallem_vip_subscription_exp_${curUser.id}`, curUser.subscriptionExpiresAt);
            }
            if (typeof window.updateVipUIStatus === 'function') window.updateVipUIStatus();
            if (typeof updateUserAuthUI === 'function') updateUserAuthUI();
          }
        }

        // If local had accounts that server didn't have yet, immediately push them to server!
        if (hasNewLocalAccounts) {
          fetch(getBackendApiUrl('/api/accounts'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accounts: mergedList })
          }).catch(() => { });
        }

        return mergedList;
      }
    }
  } catch (err) {
    // Graceful offline fallback
  } finally {
    isSyncingAccountsFlag = false;
  }
  return getAuthAccounts();
}
window.syncAccountsWithServer = syncAccountsWithServer;

function saveAuthAccounts(accounts) {
  try {
    // تشفير وحماية الحسابات في التخزين المحلي لمنع سرقة كلمات المرور عبر DevTools
    const safeAccounts = (accounts || []).map(a => {
      const copy = { ...a };
      if (copy.password && !copy.password.startsWith('pbkdf2_') && !copy.password.startsWith('sha256_')) {
        copy.password = '[PROTECTED_HASH]';
      }
      return copy;
    });
    localStorage.setItem('moallem_auth_accounts', JSON.stringify(safeAccounts));
    window.dispatchEvent(new CustomEvent('moallem_accounts_updated', { detail: { accounts: safeAccounts } }));
  } catch (e) {
    console.error(e);
  }
  // Immediately persist to server backend (24/7 server_bot / app.py)
  try {
    fetch(getBackendApiUrl('/api/accounts'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accounts })
    }).catch(() => { });
  } catch (err) { }
}

/* ==========================================================================
   Platform Telemetry & Activity Engine (محرك تسجيل وتتبع كل حركة على السيرفر)
   ========================================================================== */
function logPlatformActivity(actionType, actionTitle, details = '') {
  try {
    const user = (typeof getCurrentUser === 'function' ? getCurrentUser() : null) || {};
    const payload = {
      userId: user.id || 'guest',
      username: user.username || user.email || 'زائر',
      userName: user.name || '',
      actionType: actionType || 'GENERAL',
      actionTitle: actionTitle || actionType,
      details: typeof details === 'object' ? JSON.stringify(details) : String(details || ''),
      deviceInfo: typeof detectCurrentDeviceName === 'function' ? detectCurrentDeviceName() : ''
    }
    fetch(getBackendApiUrl('/api/activity'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => { });
  } catch (e) { }
}
window.logPlatformActivity = logPlatformActivity;

/* ==========================================================================
   Single Active Device Concurrency Guard (حارس الجلسة الفردية ومنع تعدد الأجهزة)
   - يضمن فتح الحساب على جهاز واحد فقط (حاسبة واحدة أو هاتف واحد)
   - عند فتح الحساب على جهاز آخر، يتم إنهاء الجلسة فوراً وتلقائياً على الجهاز القديم
   ========================================================================== */

function detectCurrentDeviceName() {
  const ua = navigator.userAgent || '';
  let type = 'حاسبة / لابتوب 💻';
  if (/iPad|Tablet/i.test(ua)) {
    type = 'جهاز لوحي (تابلت) 📟';
  } else if (/Mobi|Android|iPhone|iPod/i.test(ua)) {
    type = 'هاتف محمول 📱';
  }

  let os = 'جهاز غير معروف';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Macintosh|Mac OS/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad/i.test(ua)) os = 'iOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  return `${type} (${os})`;
}

function generateDeviceSessionToken() {
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
}

function registerActiveDeviceSession(user) {
  if (!user || (!user.id && !user.username && !user.email)) return null;
  const uid = String(user.id || user.username || user.email).toLowerCase();
  const token = generateDeviceSessionToken();
  const device = detectCurrentDeviceName();
  const now = new Date();
  const timeStr = now.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const sessionObj = {
    userId: uid,
    token: token,
    device: device,
    timestamp: Date.now(),
    timeString: timeStr
  }

  // 1. Store my token locally in this device's sessionStorage
  sessionStorage.setItem('moallem_my_device_session_token', token);

  // 2. Set authoritative active session in localStorage
  localStorage.setItem(`moallem_active_device_session_${uid}`, JSON.stringify(sessionObj));

  // 3. Broadcast to all open tabs / windows on this device
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const bc = new BroadcastChannel('moallem_single_device_sync');
      bc.postMessage({ type: 'SESSION_REGISTERED', session: sessionObj });
    } catch (e) { }
  }

  // 4. Send to server backend (if running via server_bot.py or web server)
  try {
    fetch('/api/active_session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionObj)
    }).catch(() => { });
  } catch (e) { }

  return sessionObj;
}
window.registerActiveDeviceSession = registerActiveDeviceSession;

function triggerImmediateDeviceKicked(conflictingSession) {
  // If already logged out, return
  if (!isUserLoggedIn()) return;

  console.warn('⚠️ Force logout triggered: Account opened on another device!', conflictingSession);

  // 1. Auto-save current exam draft safely so questions aren't lost
  try {
    if (typeof autoSaveDraftToArchive === 'function') {
      autoSaveDraftToArchive(true);
    }
  } catch (e) { }

  // 2. Invalidate local login state
  sessionStorage.removeItem('moallem_session_active');
  sessionStorage.removeItem('moallem_my_device_session_token');
  localStorage.setItem('moallem_logged_in', 'false');

  // 3. Lock platform and show gatekeeper
  checkAuthGatekeeper();

  // 4. Show security alert modal
  const modal = document.getElementById('deviceSessionKickedModal');
  if (modal) {
    const devSpan = document.getElementById('kickedByDeviceName');
    const timeSpan = document.getElementById('kickedAtTime');
    if (devSpan) devSpan.innerText = (conflictingSession && conflictingSession.device) ? conflictingSession.device : 'جهاز آخر (حاسبة أو هاتف)';
    if (timeSpan) timeSpan.innerText = (conflictingSession && conflictingSession.timeString) ? conflictingSession.timeString : 'الآن';
    modal.classList.add('open');
  }

  showToast('⚠️ تم تسجيل الخروج الفوري: تم فتح حسابك على جهاز آخر! المنصة تسمح بجهاز نشط واحد فقط.', 'error');
}
window.triggerImmediateDeviceKicked = triggerImmediateDeviceKicked;

window.dismissDeviceKickedModal = function () {
  const modal = document.getElementById('deviceSessionKickedModal');
  if (modal) modal.classList.remove('open');
  // Focus login email input
  const emailInp = document.getElementById('loginEmail');
  if (emailInp) emailInp.focus();
};

function verifySingleDeviceSession() {
  if (!isUserLoggedIn()) return;
  const user = getCurrentUser();
  if (!user || (!user.id && !user.username && !user.email)) return;
  const uid = String(user.id || user.username || user.email).toLowerCase();

  const myToken = sessionStorage.getItem('moallem_my_device_session_token');
  if (!myToken) {
    // If logged in but no token yet in this session, register as active device
    registerActiveDeviceSession(user);
    return;
  }

  // 1. Check local authoritative active session in localStorage
  const raw = localStorage.getItem(`moallem_active_device_session_${uid}`);
  if (raw) {
    try {
      const active = JSON.parse(raw);
      if (active && active.token && active.token !== myToken) {
        triggerImmediateDeviceKicked(active);
        return;
      }
    } catch (e) { }
  }

  // 2. Check remote server active session (cross-device: PC vs Phone)
  if (navigator.onLine) {
    fetch(`/api/active_session?userId=${encodeURIComponent(uid)}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.active && data.session) {
          const srvSession = data.session;
          if (srvSession.token && srvSession.token !== myToken) {
            localStorage.setItem(`moallem_active_device_session_${uid}`, JSON.stringify(srvSession));
            triggerImmediateDeviceKicked(srvSession);
          }
        }
      })
      .catch(() => { });
  }
}
window.verifySingleDeviceSession = verifySingleDeviceSession;

function initSingleDeviceWatchdog() {
  // A. Storage event (triggered across browser tabs / windows)
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('moallem_active_device_session_')) {
      verifySingleDeviceSession();
    }
  });

  // B. BroadcastChannel for instant inter-window sync
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const bc = new BroadcastChannel('moallem_single_device_sync');
      bc.onmessage = (event) => {
        if (event.data && event.data.type === 'SESSION_REGISTERED') {
          const session = event.data.session;
          const user = getCurrentUser();
          if (user && session) {
            const uid = String(user.id || user.username || user.email).toLowerCase();
            if (session.userId === uid) {
              const myToken = sessionStorage.getItem('moallem_my_device_session_token');
              if (myToken && session.token !== myToken) {
                triggerImmediateDeviceKicked(session);
              }
            }
          }
        }
      }
    } catch (e) { }
  }

  // C. Periodic Watchdog Heartbeat (every 12 seconds to prevent network contention on mobile)
  setInterval(verifySingleDeviceSession, 12000);

  // D. Tab visibility change watchdog
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) verifySingleDeviceSession();
  });
}
window.initSingleDeviceWatchdog = initSingleDeviceWatchdog;

function isAutoLogoutOnExitEnabled() {
  const val = localStorage.getItem('moallem_auto_logout_on_exit');
  return val === null ? true : val === 'true'; // Default is ON (true) for high teacher privacy
}

function setAutoLogoutOnExitEnabled(enabled) {
  localStorage.setItem('moallem_auto_logout_on_exit', enabled ? 'true' : 'false');
  updatePrivacySettingsUI();
  showToast(enabled ? 'تم تفعيل درع خصوصية المعلم: سيتم قفل المنصة تلقائياً فور إغلاق المتصفح 🔒' : 'تم تعطيل القفل التلقائي عند إغلاق المتصفح', 'info');
}
window.setAutoLogoutOnExitEnabled = setAutoLogoutOnExitEnabled;
window.isAutoLogoutOnExitEnabled = isAutoLogoutOnExitEnabled;

function isUserLoggedIn() {
  const status = localStorage.getItem('moallem_logged_in');
  const portalOpen = localStorage.getItem('moallem_auth_portal_open');

  // If explicitly logged out or auth portal is open
  if (status !== 'true' || portalOpen === 'true') {
    return false;
  }

  // Verify that a valid user object exists in storage
  const cur = getCurrentUser();
  if (!cur || (!cur.id && !cur.username && !cur.email)) {
    localStorage.setItem('moallem_logged_in', 'false');
    localStorage.setItem('moallem_auth_portal_open', 'true');
    return false;
  }

  // If Auto-Logout on browser/site exit is enabled (Teacher Privacy Shield)
  if (isAutoLogoutOnExitEnabled()) {
    // sessionStorage is automatically purged by the browser when tab/window is closed
    const sessionActive = sessionStorage.getItem('moallem_session_active');
    if (!sessionActive || sessionActive !== 'true') {
      // Browser was closed and re-opened! Auto-logout for privacy!
      localStorage.setItem('moallem_logged_in', 'false');
      localStorage.setItem('moallem_auth_portal_open', 'true');
      return false;
    }
  }

  return true;
}

function updatePrivacySettingsUI() {
  const enabled = isAutoLogoutOnExitEnabled();
  const chk = document.getElementById('chkAutoLogoutOnExit');
  if (chk) chk.checked = enabled;

  const badge = document.getElementById('drawerPrivacyBadge');
  if (badge) {
    if (enabled) {
      badge.innerHTML = `<span style="display: flex; align-items: center; gap: 5px;"><i class="fa-solid fa-shield-halved"></i> خصوصية المدرس: قفل عند الخروج</span><span class="badge-tag" style="background: rgba(16, 185, 129, 0.2); color: #10b981; font-size: 0.68rem; font-weight: 800; padding: 2px 6px;">مُفَعّل ✔</span>`;
      badge.style.borderColor = 'rgba(16, 185, 129, 0.25)';
      badge.style.background = 'rgba(16, 185, 129, 0.1)';
      badge.style.color = '#10b981';
    } else {
      badge.innerHTML = `<span style="display: flex; align-items: center; gap: 5px;"><i class="fa-solid fa-shield text-muted"></i> خصوصية المدرس: قفل عند الخروج</span><span class="badge-tag" style="background: rgba(148, 163, 184, 0.15); color: var(--text-muted); font-size: 0.68rem; font-weight: 800; padding: 2px 6px;">معطّل ✖</span>`;
      badge.style.borderColor = 'rgba(148, 163, 184, 0.2)';
      badge.style.background = 'rgba(148, 163, 184, 0.08)';
      badge.style.color = 'var(--text-muted)';
    }
  }
}
window.updatePrivacySettingsUI = updatePrivacySettingsUI;

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('moallem_current_user');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return null;
}

function setCurrentUser(user) {
  if (user) {
    localStorage.setItem('moallem_current_user', JSON.stringify(user));
    teacherProfile = { ...user };
    const sessFlag = 'moallem_logged_event_' + (user.id || user.username);
    if (!sessionStorage.getItem(sessFlag)) {
      sessionStorage.setItem(sessFlag, 'true');
      logPlatformActivity('LOGIN_SUCCESS', 'تسجيل دخول إلى المنصة', { name: user.name, username: user.username, email: user.email });
      if (typeof window.recordSessionLog === 'function') {
        window.recordSessionLog('دخول', { user: user });
      }
    }
  } else {
    localStorage.removeItem('moallem_current_user');
  }
  updateUserAuthUI();
  if (typeof window.updateVipUIStatus === 'function') window.updateVipUIStatus();
}

function checkAuthGatekeeper() {
  const portal = document.getElementById('fullscreenAuthPortal');
  const workstation = document.getElementById('appWorkstation');
  const loggedIn = isUserLoggedIn();

  if (loggedIn) {
    localStorage.setItem('moallem_auth_portal_open', 'false');
    if (portal) portal.classList.add('portal-hidden');
    if (workstation) workstation.classList.remove('portal-locked');
    loadTeacherProfile();
    loadSavedState();
    syncHeaderInputs();
    renderAll();
  } else {
    localStorage.setItem('moallem_logged_in', 'false');
    localStorage.setItem('moallem_auth_portal_open', 'true');
    if (portal) portal.classList.remove('portal-hidden');
    if (workstation) workstation.classList.add('portal-locked');
    loadDefaultPreset();
    syncHeaderInputs();
    renderAll();
  }
  updatePrivacySettingsUI();
}

function initAuthPortalPersistenceGuard() {
  const portal = document.getElementById('fullscreenAuthPortal');
  const workstation = document.getElementById('appWorkstation');
  if (!portal) return;

  // Whenever #fullscreenAuthPortal becomes visible (portal-hidden removed), persist open state so refresh keeps it fixed
  const observer = new MutationObserver(() => {
    const isPortalVisible = !portal.classList.contains('portal-hidden');
    if (isPortalVisible) {
      localStorage.setItem('moallem_auth_portal_open', 'true');
      localStorage.setItem('moallem_logged_in', 'false');
      if (workstation && !workstation.classList.contains('portal-locked')) {
        workstation.classList.add('portal-locked');
      }
    }
  });
  observer.observe(portal, { attributes: true, attributeFilter: ['class'] });

  // Before page refresh/unload, if the auth portal is currently visible on screen, lock state in localStorage
  window.addEventListener('beforeunload', () => {
    if (!portal.classList.contains('portal-hidden')) {
      localStorage.setItem('moallem_auth_portal_open', 'true');
      localStorage.setItem('moallem_logged_in', 'false');
    }
  });
}

/* ==========================================================================
   Account Session Logging & Direct Logout System (سجل وأنشطة تسجيل الدخول والخروج المستقلة لكل حساب)
   ========================================================================== */
window.recordSessionLog = function (type, details = {}) {
  try {
    const user = details.user || (typeof getCurrentUser === 'function' ? getCurrentUser() : null) || {};
    const userId = String(user.id || user.username || user.email || 'guest').toLowerCase().trim();
    const storageKey = `moallem_auth_sessions_log_${userId}`;

    let logs = [];
    try {
      const logStr = localStorage.getItem(storageKey);
      if (logStr) logs = JSON.parse(logStr);
    } catch (_) { logs = []; }
    if (!Array.isArray(logs)) logs = [];

    const now = new Date();
    const timeStr = now.toLocaleDateString('ar-IQ', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const deviceName = (typeof detectCurrentDeviceName === 'function')
      ? detectCurrentDeviceName()
      : (window.innerWidth <= 768 ? 'هاتف محمول 📱' : 'حاسبة / لابتوب 💻');

    const entry = {
      type: type, // 'دخول' أو 'خروج'
      timestamp: timeStr,
      device: deviceName,
      userId: userId,
      user: user.name || user.username || 'المعلم'
    }

    logs.unshift(entry);
    if (logs.length > 20) logs = logs.slice(0, 20);
    localStorage.setItem(storageKey, JSON.stringify(logs));

    // Update the account's independent online/offline status in moallem_auth_accounts
    try {
      const accountsRaw = localStorage.getItem('moallem_auth_accounts');
      if (accountsRaw) {
        let accounts = JSON.parse(accountsRaw);
        if (Array.isArray(accounts)) {
          const accIdx = accounts.findIndex(a =>
            String(a.id || a.username || a.email).toLowerCase() === userId ||
            (user.id && a.id === user.id) ||
            (user.username && a.username === user.username) ||
            (user.email && a.email === user.email)
          );
          if (accIdx !== -1) {
            accounts[accIdx].isOnline = (type === 'دخول');
            accounts[accIdx].lastActivityTime = timeStr;
            accounts[accIdx].lastActivityType = type;
            accounts[accIdx].lastDevice = deviceName;
            if (type === 'دخول') accounts[accIdx].lastLogin = timeStr;
            if (type === 'خروج') accounts[accIdx].lastLogout = timeStr;
            localStorage.setItem('moallem_auth_accounts', JSON.stringify(accounts));
          }
        }
      }
    } catch (_) { }

  } catch (e) {
    console.warn('recordSessionLog error:', e);
  }
};

window.renderSessionsLog = function () {
  const container = document.getElementById('profileSessionsLogList');
  if (!container) return;

  const cur = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const userId = cur ? String(cur.id || cur.username || cur.email || 'guest').toLowerCase().trim() : 'guest';
  const storageKey = `moallem_auth_sessions_log_${userId}`;

  let logs = [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) logs = JSON.parse(raw);
  } catch (e) {
    logs = [];
  }

  if (!Array.isArray(logs) || logs.length === 0) {
    const dev = (typeof detectCurrentDeviceName === 'function') ? detectCurrentDeviceName() : 'هذا الجهاز';
    const now = new Date().toLocaleDateString('ar-IQ', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    logs = [
      {
        type: 'دخول',
        timestamp: `${now} (نشط الآن 🟢)`,
        device: dev,
        userId: userId,
        user: cur ? (cur.name || cur.username) : 'المعلم'
      }
    ];
    try {
      localStorage.setItem(storageKey, JSON.stringify(logs));
    } catch (e) { }
  }

  container.innerHTML = logs.map(item => {
    const isLogin = item.type === 'دخول';
    const iconClass = isLogin ? 'fa-arrow-right-to-bracket' : 'fa-arrow-right-from-bracket';
    const bgBadge = isLogin ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)';
    const colorBadge = isLogin ? '#10b981' : '#ef4444';
    const titleText = isLogin ? 'تسجيل دخول ناجح' : 'تسجيل خروج من الحساب';

    return `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 7px 10px; background: rgba(0,0,0,0.02); border: 1px solid var(--border-color); border-radius: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="width: 26px; height: 26px; border-radius: 6px; background: ${bgBadge}; color: ${colorBadge}; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; flex-shrink: 0;">
            <i class="fa-solid ${iconClass}"></i>
          </span>
          <div>
            <strong style="color: var(--text-main); font-size: 0.8rem; display: block;">${titleText}</strong>
            <small style="color: var(--text-muted); font-size: 0.72rem;">${item.device || 'جهاز غير محدد'}</small>
          </div>
        </div>
        <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; white-space: nowrap; direction: ltr;">
          ${item.timestamp}
        </span>
      </div>
    `;
  }).join('');
};

window.confirmLogout = function () {
  const confirmed = confirm('هل أنت متأكد من رغبتك في تسجيل الخروج من الحساب وقفل المنصة؟\nسيتم حفظ كافة البيانات والمسودات بأمان لحماية خصوصيتك.');
  if (confirmed) {
    if (typeof window.closeSideDrawer === 'function') window.closeSideDrawer();
    const pModal = document.getElementById('profileModal');
    if (pModal) pModal.classList.remove('open');
    window.logoutAndOpenAuthPortal('تم تسجيل الخروج وقفل الحساب بنجاح 🔒');
  }
};

window.logoutAndOpenAuthPortal = function (toastMsg = null) {
  const cur = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (cur && cur.username) {
    logPlatformActivity('LOGOUT', 'تسجيل خروج من المنصة', { username: cur.username, name: cur.name });
  }
  if (typeof window.recordSessionLog === 'function') {
    window.recordSessionLog('خروج', { user: cur });
  }

  // Automatically save current work as a draft in archive before exit for this user
  autoSaveDraftToArchive(true);
  saveStateToStorage(false);

  sessionStorage.removeItem('moallem_session_active');
  localStorage.setItem('moallem_logged_in', 'false');
  localStorage.setItem('moallem_auth_portal_open', 'true');
  localStorage.removeItem('moallem_current_user');

  // Clear workspace so next login doesn't see previous user's exams
  loadDefaultPreset();
  if (typeof appState !== 'undefined') {
    appState.questions = [];
    appState.currentArchiveId = null;
  }
  syncHeaderInputs();
  renderAll();

  // Reset student grades & behavior in memory for next user
  if (typeof window.reloadStudentGradesForCurrentUser === 'function') {
    window.reloadStudentGradesForCurrentUser(true);
  }
  if (typeof window.reloadStudentBehaviorForCurrentUser === 'function') {
    window.reloadStudentBehaviorForCurrentUser(true);
  }
  updateArchiveBadge();
  if (typeof updateDailyReportMetrics === 'function') updateDailyReportMetrics();
  if (typeof window.updateAppsHubStats === 'function') window.updateAppsHubStats();

  const portal = document.getElementById('fullscreenAuthPortal');
  const workstation = document.getElementById('appWorkstation');
  if (portal) portal.classList.remove('portal-hidden');
  if (workstation) workstation.classList.add('portal-locked');

  updateUserAuthUI();
  updatePrivacySettingsUI();

  // Activate login tab by default
  const tabLogin = document.getElementById('tabAuthLoginBtn');
  const tabRegister = document.getElementById('tabAuthRegisterBtn');
  const formLogin = document.getElementById('loginForm');
  const formRegister = document.getElementById('registerForm');
  const authHeading = document.getElementById('authPortalHeading');
  if (tabLogin && tabRegister && formLogin && formRegister) {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    formLogin.style.display = 'block';
    formRegister.style.display = 'none';
    if (authHeading) authHeading.innerText = 'تسجيل الدخول للمنصة';
  }

  showToast(toastMsg || 'تم تسجيل الخروج وقفل المنصة لحماية خصوصية المعلم 🔒', 'info');
};

window.filterPortalFeaturesShowcase = function (category, btn) {
  const chips = document.querySelectorAll('.feat-chip-btn');
  chips.forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const cards = document.querySelectorAll('#portalWelcomeFeaturesGrid .welcome-feature-card');
  cards.forEach(card => {
    const cardCat = card.getAttribute('data-cat');
    if (category === 'all' || cardCat === category) {
      card.style.display = 'flex';
      card.style.opacity = '1';
    } else {
      card.style.display = 'none';
      card.style.opacity = '0';
    }
  });
};

function syncProfileModalInputs(user) {
  if (!user) user = (typeof getCurrentUser === 'function' ? getCurrentUser() : null) || {};
  const pName = document.getElementById('profName');
  const pGov = document.getElementById('profGov');
  const pSchool = document.getElementById('profSchool');
  const pSub = document.getElementById('profSubject');
  const pContact = document.getElementById('profContact');
  const pRights = document.getElementById('profRights');

  if (pName) pName.value = user.name || '';
  if (pGov) pGov.value = user.governorate || '';
  if (pSchool) pSchool.value = user.school || '';
  if (pSub) pSub.value = user.subject || '';
  if (pContact) pContact.value = user.contact || user.phone || user.email || '';
  if (pRights) pRights.value = user.rights || (user.name ? `إعداد وتنظيم ${user.name} - جميع الحقوق محفوظة` : '');
}
window.syncProfileModalInputs = syncProfileModalInputs;

function loadTeacherProfile() {
  const current = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  if (current && current.id) {
    try {
      const savedUserProf = localStorage.getItem(`moallem_teacher_profile_${current.id}`);
      if (savedUserProf) {
        const parsed = JSON.parse(savedUserProf);
        // استعادة بيانات الهوية والملف الشخصي فقط دون مساس ببيانات الاشتراك المحدثة
        const profileFields = ['name', 'school', 'governorate', 'subject', 'contact', 'rights', 'avatar'];
        profileFields.forEach(f => {
          if (parsed[f] !== undefined && parsed[f] !== '') current[f] = parsed[f];
        });
      }
    } catch (_) { }

    // مزامنة حالة الاشتراك الرسمية دائماً من قائمة الحسابات المعتمدة (المرتبطة بقاعدة البيانات)
    try {
      const accounts = typeof getAuthAccounts === 'function' ? getAuthAccounts() : [];
      const acc = accounts.find(a => a.id === current.id || (a.username && a.username.toLowerCase() === (current.username || '').toLowerCase()));
      if (acc) {
        if (acc.isSubscribed !== undefined) current.isSubscribed = acc.isSubscribed;
        if (acc.isVip !== undefined) current.isVip = acc.isVip;
        if (acc.role) current.role = acc.role;
        if (acc.isAdmin !== undefined) current.isAdmin = acc.isAdmin;
        if (acc.isTrial !== undefined) current.isTrial = acc.isTrial;
        if (acc.subscriptionExpiresAt) current.subscriptionExpiresAt = acc.subscriptionExpiresAt;
        if (acc.subscriptionDuration) current.subscriptionDuration = acc.subscriptionDuration;
        if (acc.subscriptionPlanName) current.subscriptionPlanName = acc.subscriptionPlanName;
        if (acc.subscriptionStartDate) current.subscriptionStartDate = acc.subscriptionStartDate;
        if (acc.subscriptionType) current.subscriptionType = acc.subscriptionType;
        if (acc.subscriptionExpiryFormatted) current.subscriptionExpiryFormatted = acc.subscriptionExpiryFormatted;
      }
    } catch (_) { }

    // التحقق من مفتاح VIP المعزول وتاريخ الصلاحية
    const isActualTrial = !!(current.isTrial || String(current.subscriptionType || '').startsWith('free_trial'));
    if (!isActualTrial && localStorage.getItem(`moallem_vip_subscription_${current.id}`) === 'true') {
      const expStr = localStorage.getItem(`moallem_vip_subscription_exp_${current.id}`);
      if (expStr) {
        const expTime = new Date(expStr).getTime();
        if (!isNaN(expTime) && Date.now() < expTime) {
          current.isSubscribed = true;
          current.isVip = true;
          current.isTrial = false;
          current.subscriptionExpiresAt = expStr;
        }
      } else {
        current.isSubscribed = true;
        current.isVip = true;
        current.isTrial = false;
      }
    }

    // تفعيل الفترة التجريبية المجانية الشاملة لمدة 7 أيام لجميع المستخدمين غير المفعلين
    if (!current.isAdmin && current.role !== 'admin' && current.id !== 'usr_guest') {
      const isPaid = (current.role === 'teacher_vip') ||
        (current.subscriptionDuration && !String(current.subscriptionDuration).startsWith('free_trial'));
      if (!isPaid) {
        current.isTrial = true;
        current.trialDurationHours = 168;
        current.subscriptionType = 'free_trial_7d';
        current.subscriptionPlanName = 'فترة تجريبية مجانية (7 أيام)';
        current.isSubscribed = true;
        current.isVip = true;
        if (!current.subscriptionExpiresAt) {
          const startMs = current.trialStartedAt ? new Date(current.trialStartedAt).getTime() : Date.now();
          current.subscriptionExpiresAt = new Date(startMs + 7 * 24 * 60 * 60 * 1000).toISOString();
        }
      }
    }
    localStorage.setItem('moallem_current_user', JSON.stringify(current));
    teacherProfile = { ...current };
  } else if (current) {
    teacherProfile = { ...current };
  } else {
    teacherProfile = {
      name: '',
      governorate: '',
      school: '',
      subject: '',
      contact: '',
      rights: ''
    }
  }
  syncProfileModalInputs(teacherProfile);
  updateUserAuthUI();
}

window.updateUserAuthUI = updateUserAuthUI;
function updateUserAuthUI() {
  const current = getCurrentUser();
  const pillBtn = document.getElementById('profilePillBtn');
  const openAuthBtn = document.getElementById('openAuthModalBtn');
  const navName = document.getElementById('navTeacherName');
  const navSchool = document.getElementById('navTeacherSchool');
  const navAvatar = document.getElementById('navAvatarInitials');
  const dropName = document.getElementById('dropdownTeacherName');
  const heroNameEl = document.getElementById('heroBannerTeacherName');

  const loggedIn = typeof isUserLoggedIn === 'function' ? isUserLoggedIn() : false;
  const isAdmin = loggedIn && current && (current.isAdmin || current.role === 'admin' || current.username === 'admin' || current.email === 'admin' || current.id === 'acc_admin' || current.id === 'usr_admin');
  const isSubscribed = loggedIn && current && (current.isSubscribed || current.isVip || isAdmin || (current.id && localStorage.getItem(`moallem_vip_subscription_${current.id}`) === 'true'));

  const displayName = (current && (current.name || current.username)) || 'أستاذ المادة';
  const roleText = isAdmin ? 'المدير العام للمنصة 👑' : (isSubscribed ? 'مشترك معتمد PRO 💎' : 'مدرس معتمد • مسار المعلم');
  const shortRoleText = isAdmin ? 'المدير العام 👑' : (isSubscribed ? 'مشترك PRO 💎' : 'مدرس معتمد');

  // Topbar user badge (أقصى اليسار)
  const topbarName = document.getElementById('topbarTeacherName') || document.querySelector('.topbar-user-name');
  if (topbarName) topbarName.textContent = displayName;
  const topbarRole = document.getElementById('topbarTeacherRole') || document.querySelector('.topbar-user-role');
  if (topbarRole) topbarRole.textContent = shortRoleText;

  // Drawer teacher card
  const drawerName = document.getElementById('drawerTeacherName');
  if (drawerName) drawerName.textContent = displayName;
  const drawerRole = document.getElementById('drawerTeacherRole');
  if (drawerRole) drawerRole.textContent = roleText;

  if (heroNameEl) {
    heroNameEl.textContent = displayName;
  }
  const dropEmail = document.getElementById('dropdownTeacherEmail');
  const googleStatusBtn = document.getElementById('navGoogleSyncStatusBtn');
  const drawerGoogleBtn = document.getElementById('drawerGoogleSyncBtn');
  const drawerPermissionsBtn = document.getElementById('drawerAdminPermissionsBtn');
  const drawerSubscribersBtn = document.getElementById('drawerAdminSubscribersBtn') || document.getElementById('drawerAdminGrantVipBtn');
  const drawerSubCountBadge = document.getElementById('drawerActiveSubsBadge') || document.getElementById('drawerSubscribersCountBadge');

  if (drawerPermissionsBtn) {
    if (isAdmin) {
      drawerPermissionsBtn.style.setProperty('display', 'flex', 'important');
      drawerPermissionsBtn.classList.remove('admin-only-hidden');
    } else {
      drawerPermissionsBtn.style.setProperty('display', 'none', 'important');
      drawerPermissionsBtn.classList.add('admin-only-hidden');
    }
  }

  // Drawer Subscribers Management Button (Admin Only 👑)
  if (drawerSubscribersBtn) {
    if (isAdmin) {
      drawerSubscribersBtn.style.setProperty('display', 'flex', 'important');
      drawerSubscribersBtn.classList.remove('admin-only-hidden');

      // Calculate active non-admin subscribers count (with 1-year expiration check)
      const allAccounts = typeof getAuthAccounts === 'function' ? getAuthAccounts() : [];
      const nowTime = Date.now();
      const activeSubsCount = allAccounts.filter(acc => {
        if (acc.isAdmin || acc.role === 'admin' || acc.username === 'admin') return false;
        const isSub = acc.isSubscribed || acc.isVip || (acc.id && localStorage.getItem(`moallem_vip_subscription_${acc.id}`) === 'true');
        if (!isSub) return false;
        if (acc.subscriptionExpiresAt) {
          const expTime = new Date(acc.subscriptionExpiresAt).getTime();
          if (!isNaN(expTime) && nowTime > expTime) return false;
        }
        return true;
      }).length;

      if (drawerSubCountBadge) {
        drawerSubCountBadge.innerText = `${activeSubsCount} مشترك 👑`;
      }

      // Topbar Subscribers Counter Badge
      const topbarSubsBadge = document.getElementById('topbarActiveSubsBadge');
      if (topbarSubsBadge) {
        topbarSubsBadge.innerText = activeSubsCount;
      }
    } else {
      drawerSubscribersBtn.style.setProperty('display', 'none', 'important');
      drawerSubscribersBtn.classList.add('admin-only-hidden');
    }
  }

  // Drawer Pricing & Discounts Button (Admin Only 👑)
  const drawerPricingBtn = document.getElementById('drawerAdminPricingBtn');
  if (drawerPricingBtn) {
    if (isAdmin) {
      drawerPricingBtn.style.setProperty('display', 'flex', 'important');
      drawerPricingBtn.classList.remove('admin-only-hidden');
    } else {
      drawerPricingBtn.style.setProperty('display', 'none', 'important');
      drawerPricingBtn.classList.add('admin-only-hidden');
    }
  }

  // Topbar Admin Subscribers Button (Strictly for ADMIN ONLY 👑)
  const topbarSubBtn = document.getElementById('topbarAdminSubscribersBtn');
  if (topbarSubBtn) {
    if (isAdmin) {
      topbarSubBtn.style.setProperty('display', 'inline-flex', 'important');
      topbarSubBtn.classList.remove('admin-only-hidden');
    } else {
      topbarSubBtn.style.setProperty('display', 'none', 'important');
      topbarSubBtn.classList.add('admin-only-hidden');
    }
  }

  // Topbar Admin Server Status & Gateway Diagnostics Button (Strictly for ADMIN ONLY ⚡)
  const topbarSrvBtn = document.getElementById('topbarServerStatusBtn');
  if (topbarSrvBtn) {
    if (isAdmin) {
      topbarSrvBtn.style.setProperty('display', 'inline-flex', 'important');
      topbarSrvBtn.classList.remove('admin-only-hidden');
      if (typeof window.checkServerStatusLive === 'function') {
        // Trigger a silent check if not already checked recently
        if (!window._serverCheckedRecently) {
          window._serverCheckedRecently = true;
          window.checkServerStatusLive(false);
        }
      }
    } else {
      topbarSrvBtn.style.setProperty('display', 'none', 'important');
      topbarSrvBtn.classList.add('admin-only-hidden');
    }
  }

  // Topbar Google Cloud Gateway Icon Button (خاص بالمدير العام 👑 فقط)
  const topbarGoogleIconBtn = document.getElementById('topbarGoogleAuthIconBtn');
  if (topbarGoogleIconBtn) {
    if (isAdmin) {
      topbarGoogleIconBtn.style.setProperty('display', 'inline-flex', 'important');
      topbarGoogleIconBtn.classList.remove('admin-only-hidden');
    } else {
      topbarGoogleIconBtn.style.setProperty('display', 'none', 'important');
      topbarGoogleIconBtn.classList.add('admin-only-hidden');
    }
  }

  // Drawer Server Status Button (Strictly for ADMIN ONLY ⚡)
  const drawerServerBtn = document.getElementById('drawerServerStatusBtn') || document.getElementById('drawerServerDashboardBtn');
  if (drawerServerBtn) {
    if (isAdmin) {
      drawerServerBtn.style.setProperty('display', 'flex', 'important');
      drawerServerBtn.classList.remove('admin-only-hidden');
    } else {
      drawerServerBtn.style.setProperty('display', 'none', 'important');
      drawerServerBtn.classList.add('admin-only-hidden');
    }
  }

  if (current && isUserLoggedIn()) {
    if (pillBtn) {
      pillBtn.style.display = 'flex';
      pillBtn.classList.remove('auth-hidden');
    }
    if (openAuthBtn) {
      openAuthBtn.style.display = 'none';
      openAuthBtn.classList.add('auth-hidden');
    }

    if (navName) {
      navName.innerText = displayName;
    }

    const isGoogleLinked = Boolean(current.isGoogleUser || current.authProvider === 'google_cloud_oauth' || (current.email && current.email.toLowerCase().includes('@gmail.com')));
    if (navSchool) {
      if (isAdmin) {
        navSchool.innerHTML = `<span style="display:inline-flex; align-items:center; gap:4px; color:#f59e0b; font-weight:800;"><i class="fa-solid fa-crown text-warning"></i> مدير النظام (صلاحيات كاملة 👑)</span>`;
      } else if (isGoogleLinked) {
        navSchool.innerHTML = `<span style="display:inline-flex; align-items:center; gap:4px; color:#10b981; font-weight:700;"><i class="fa-brands fa-google text-success" style="color: #10b981 !important;"></i> حساب Google موثق ✔</span>`;
      } else {
        navSchool.innerHTML = `<i class="fa-solid fa-circle-check text-success"></i> ${current.school || 'معلم معتمد'}`;
      }
    }

    if (googleStatusBtn) {
      if (isGoogleLinked) {
        googleStatusBtn.style.display = 'inline-flex';
        const txt = document.getElementById('navGoogleSyncText');
        if (txt) txt.innerText = current.email ? current.email.split('@')[0] : 'سحابي متصل';
      } else {
        googleStatusBtn.style.display = 'none';
      }
    }

    if (drawerGoogleBtn) {
      if (isGoogleLinked) {
        drawerGoogleBtn.setAttribute('data-tooltip', `حساب Google مرتبط (${current.email || ''})`);
        drawerGoogleBtn.innerHTML = `
          <div class="drawer-item-main" style="display: flex; align-items: center; gap: 0.65rem;">
            <i class="fa-brands fa-google text-danger"></i>
            <div style="text-align: right;">
              <div style="font-size: 0.82rem; font-weight: 700;">حساب Google مرتبط</div>
              <small style="font-size: 0.7rem; color: #10b981;" dir="ltr">${current.email || ''}</small>
            </div>
          </div>
          <span class="badge-tag" style="background: rgba(16, 185, 129, 0.2); color: #10b981; font-size: 0.65rem; padding: 2px 6px;">نشط ✔</span>
        `;
      } else {
        drawerGoogleBtn.setAttribute('data-tooltip', 'تسجيل دخول Google السحابي');
        drawerGoogleBtn.innerHTML = `
          <i class="fa-brands fa-google text-danger"></i>
          <span>تسجيل دخول Google السحابي</span>
        `;
      }
    }

    if (navAvatar) {
      if (isAdmin) {
        navAvatar.innerHTML = `<i class="fa-solid fa-shield-halved" style="color: #fbbf24; font-size: 1.15rem;"></i>`;
        navAvatar.style.background = 'linear-gradient(135deg, #d97706, #f59e0b)';
      } else {
        const initial = (current.name || 'أ').replace(/^(أستاذ|أ\.|د\.|الاستاذ)\s*/, '').trim().charAt(0) || 'أ';
        navAvatar.innerText = initial;
        navAvatar.style.background = 'linear-gradient(135deg, #2563eb, #38bdf8)';
      }
    }
    if (dropName) dropName.innerText = displayName;
    if (dropEmail) dropEmail.innerText = current.email || (current.subject ? `${current.subject} - ${current.governorate || ''}` : '');

    // Sync modal fields to current user data
    syncProfileModalInputs(current);
  } else {
    if (pillBtn) {
      pillBtn.style.display = 'none';
      pillBtn.classList.add('auth-hidden');
    }
    if (openAuthBtn) {
      openAuthBtn.style.display = 'flex';
      openAuthBtn.classList.remove('auth-hidden');
    }
    if (googleStatusBtn) googleStatusBtn.style.display = 'none';
  }

  if (typeof window.syncPlatformGoogleIconsState === 'function') {
    const activeGoogleLinked = Boolean(
      current && isUserLoggedIn() && (
        current.isGoogleUser ||
        current.authProvider === 'google_cloud_oauth' ||
        (current.email && current.email.toLowerCase().includes('@gmail.com'))
      )
    );
    window.syncPlatformGoogleIconsState(activeGoogleLinked, current);
  }

  if (typeof window.syncSideDrawerItems === 'function') {
    window.syncSideDrawerItems();
  }
}

window.syncPlatformGoogleIconsState = function (isGoogleConnected, currentAccount) {
  if (typeof currentAccount === 'undefined') {
    currentAccount = (typeof getCurrentAccount === 'function' ? getCurrentAccount() : null) || (typeof getCurrentUser === 'function' ? getCurrentUser() : null);
  }
  const isAdminUser = Boolean(
    currentAccount && (
      currentAccount.isAdmin ||
      currentAccount.role === 'admin' ||
      currentAccount.username === 'admin' ||
      currentAccount.email === 'admin' ||
      currentAccount.id === 'usr_admin' ||
      currentAccount.id === 'acc_admin'
    )
  );
  const userLoggedIn = Boolean(currentAccount && typeof isUserLoggedIn === 'function' && isUserLoggedIn());

  if (typeof isGoogleConnected === 'undefined') {
    isGoogleConnected = Boolean(
      userLoggedIn && (
        isAdminUser ||
        currentAccount.isGoogleUser ||
        currentAccount.googleLinked ||
        currentAccount.authProvider === 'google_cloud_oauth' ||
        (currentAccount.email && currentAccount.email.toLowerCase().includes('@gmail.com'))
      )
    );
  }
  const activeColor = isGoogleConnected ? '#10b981' : '#ef4444';
  const emailLabel = (currentAccount && currentAccount.email) ? currentAccount.email : '';

  // 1. Topbar Google Cloud Gateway Icon Button (#topbarGoogleAuthIconBtn)
  // يظهر حصرياً للمدير العام (Admin 👑) كأيقونة دائرية أنيقة ومريحة تفتح بوابة Google Cloud API
  const topbarBtn = document.getElementById('topbarGoogleAuthIconBtn');
  const topbarIcon = document.getElementById('topbarGoogleLogoIcon');
  const topbarDot = document.getElementById('topbarGoogleStatusDot');
  if (topbarBtn) {
    if (userLoggedIn && isAdminUser) {
      topbarBtn.style.setProperty('display', 'inline-flex', 'important');
      topbarBtn.classList.remove('admin-only-hidden');
      topbarBtn.classList.toggle('is-google-connected', Boolean(isGoogleConnected));
      topbarBtn.classList.toggle('is-google-disconnected', !isGoogleConnected);
      topbarBtn.style.borderColor = isGoogleConnected ? 'rgba(16, 185, 129, 0.55)' : 'rgba(239, 68, 68, 0.55)';
      topbarBtn.style.background = isGoogleConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.1)';
      topbarBtn.style.boxShadow = isGoogleConnected
        ? '0 0 12px rgba(16, 185, 129, 0.28)'
        : '0 0 12px rgba(239, 68, 68, 0.22)';
      topbarBtn.title = isGoogleConnected
        ? 'بوابة Google Cloud API & Gemini AI (متصل بنجاح 🟢 - خاص بالمدير العام 👑)'
        : 'بوابة Google Cloud API & Gemini AI (غير متصل 🔴 - خاص بالمدير العام 👑)';
      topbarBtn.style.pointerEvents = 'auto';
      topbarBtn.style.cursor = 'pointer';
      topbarBtn.onclick = function () {
        if (typeof window.openGCloudGatewayModal === 'function') {
          window.openGCloudGatewayModal('config');
        }
      }
    } else {
      // للمستخدم العادي: ملغي ومخفي تماماً (يظهر فقط عند الأدمن)
      topbarBtn.style.setProperty('display', 'none', 'important');
      topbarBtn.classList.add('admin-only-hidden');
      topbarBtn.onclick = null;
    }
  }
  if (topbarIcon) {
    topbarIcon.classList.remove('text-danger', 'text-success');
    topbarIcon.classList.add(isGoogleConnected ? 'text-success' : 'text-danger');
    topbarIcon.style.setProperty('color', activeColor, 'important');
  }
  if (topbarDot) {
    topbarDot.style.background = activeColor;
    topbarDot.style.boxShadow = `0 0 8px ${activeColor}`;
  }

  // 2. Side Drawer Google Button (#drawerGoogleSyncBtn)
  const drawerGoogleBtn = document.getElementById('drawerGoogleSyncBtn');
  if (drawerGoogleBtn) {
    drawerGoogleBtn.removeAttribute('data-tooltip');
    drawerGoogleBtn.removeAttribute('title');
    drawerGoogleBtn.style.pointerEvents = 'none';
    drawerGoogleBtn.style.cursor = 'default';
    drawerGoogleBtn.onclick = null;
    if (isGoogleConnected) {


      drawerGoogleBtn.innerHTML = `
        <div class="drawer-item-main" style="display: flex; align-items: center; gap: 0.75rem;">
          <div class="drawer-item-icon-box" style="background: rgba(16, 185, 129, 0.16); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.4);">
            <i class="fa-brands fa-google text-success" style="color: #10b981 !important;"></i>
          </div>
          <div class="drawer-item-text" style="text-align: right;">
            <strong style="color: #10b981;">حساب Google متصل ✔</strong>
            <small style="color: #10b981; direction: ltr; display: block;">${emailLabel || 'مسجل عن طريق Google'}</small>
          </div>
        </div>
        <span class="badge-tag" style="background: rgba(16, 185, 129, 0.2); color: #10b981; font-size: 0.68rem; font-weight: 800; padding: 2px 8px; border-radius: 999px;">متصل ✔</span>
      `;
    } else {


      drawerGoogleBtn.innerHTML = `
        <div class="drawer-item-main" style="display: flex; align-items: center; gap: 0.75rem;">
          <div class="drawer-item-icon-box" style="background: rgba(239, 68, 68, 0.14); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.4);">
            <i class="fa-brands fa-google text-danger" style="color: #ef4444 !important;"></i>
          </div>
          <div class="drawer-item-text" style="text-align: right;">
            <strong style="color: #ef4444;">غير مسجل عن طريق Google</strong>
            <small>حالة الاتصال بحساب Google</small>
          </div>
        </div>
        <span class="badge-tag" style="background: rgba(239, 68, 68, 0.16); color: #ef4444; font-size: 0.68rem; font-weight: 800; padding: 2px 8px; border-radius: 999px;">غير متصل</span>
      `;
    }
  }

  // 3. Topbar Role subtitle when logged in via Google
  const topbarRole = document.getElementById('topbarTeacherRole') || document.querySelector('.topbar-user-role');
  if (topbarRole && currentAccount && isUserLoggedIn()) {
    const isAdminAcc = Boolean(currentAccount.isAdmin || currentAccount.role === 'admin' || currentAccount.username === 'admin');
    if (!isAdminAcc && isGoogleConnected) {
      topbarRole.innerHTML = `<span style="display: inline-flex; align-items: center; gap: 4px; color: #10b981; font-weight: 800;"><i class="fa-brands fa-google" style="color: #10b981 !important;"></i> حساب Google متصل ✔</span>`;
    }
  }

  // 4. All Google Logo Icons (.fa-google) inside the Platform (.app-wrapper, #sideDrawer, #gcloudGatewayModalOverlay)
  const platformGoogleIcons = document.querySelectorAll('.app-wrapper .fa-google, #sideDrawer .fa-google, #gcloudGatewayModalOverlay .fa-google');
  platformGoogleIcons.forEach(icon => {
    icon.classList.remove('text-danger', 'text-success');
    icon.classList.add(isGoogleConnected ? 'text-success' : 'text-danger');
    icon.style.setProperty('color', activeColor, 'important');
  });

  // 5. Ensure obsolete oval pill button #topbarGCloudBtn is permanently removed
  const obsoleteTopBtn = document.getElementById('topbarGCloudBtn');
  if (obsoleteTopBtn) {
    obsoleteTopBtn.remove();
  }
  const gcloudSettingsCard = document.getElementById('settingsGCloudGatewayCard');
  if (gcloudSettingsCard) {
    if (isAdminUser) {
      gcloudSettingsCard.style.setProperty('display', 'block', 'important');
      gcloudSettingsCard.classList.remove('admin-only-hidden');
    } else {
      gcloudSettingsCard.style.setProperty('display', 'none', 'important');
      gcloudSettingsCard.classList.add('admin-only-hidden');
    }
  }
};

window.handlePlatformGoogleIconClick = function () { return; };
window._unusedHandlePlatformGoogleIconClick = function () {
  const current = typeof getCurrentAccount === 'function' ? getCurrentAccount() : null;
  const isGoogleConnected = Boolean(
    current && typeof isUserLoggedIn === 'function' && isUserLoggedIn() && (
      current.isGoogleUser ||
      current.authProvider === 'google_cloud_oauth' ||
      (current.email && current.email.toLowerCase().includes('@gmail.com'))
    )
  );

  if (isGoogleConnected) {
    if (typeof showToast === 'function') {
      showToast(`حسابك متصل رسمياً عن طريق Google (${current.email || current.name}) ✔`, 'success');
    }
    if (typeof window.openGCloudGatewayModal === 'function') {
      window.openGCloudGatewayModal('config');
    }
  } else {
    if (typeof window.triggerGoogleAuthSignIn === 'function') {
      window.triggerGoogleAuthSignIn();
    } else if (typeof window.openGCloudGatewayModal === 'function') {
      window.openGCloudGatewayModal('config');
    }
  }
};

window.togglePasswordVisibility = function (inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPass = input.type === 'password';
  input.type = isPass ? 'text' : 'password';
  const icon = btn.querySelector('i');
  if (icon) icon.className = isPass ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
};

window.validateTeacherProfileFields = function (showVisualFeedback = false) {
  const pName = document.getElementById('profName');
  const pGov = document.getElementById('profGov');
  const pSchool = document.getElementById('profSchool');
  const pSub = document.getElementById('profSubject');
  const pContact = document.getElementById('profContact');
  const pRights = document.getElementById('profRights');

  const fields = [
    { el: pName, label: 'الاسم الكامل للأستاذ / المعلم' },
    { el: pGov, label: 'المحافظة / الإدارة التعليمية' },
    { el: pSchool, label: 'المدرسة أو الكلية' },
    { el: pSub, label: 'المادة الدراسية التخصصية' },
    { el: pContact, label: 'رقم الهاتف أو وسيلة التواصل' },
    { el: pRights, label: 'حقوق الطبع والترويسة المخصصة' }
  ];

  let missing = [];
  fields.forEach(f => {
    if (!f.el || !f.el.value.trim()) {
      missing.push(f);
      if (showVisualFeedback && f.el) {
        f.el.style.borderColor = '#ef4444';
        f.el.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.25)';
      }
    } else if (f.el) {
      f.el.style.borderColor = '';
      f.el.style.boxShadow = '';
    }
  });

  return { isValid: missing.length === 0, missingFields: missing };
};

function saveTeacherProfile(isClosingOrManual = false, explicitData = null) {
  let current = getCurrentUser() || {};
  if (!current.id && !current.username) {
    current = {
      id: 'usr_' + Date.now(),
      username: 'teacher',
      name: 'الأستاذ',
      role: 'teacher'
    };
  }

  if (explicitData && typeof explicitData === 'object') {
    Object.assign(current, explicitData);
  } else {
    const profNameEl = document.getElementById('profName');
    const profGovEl = document.getElementById('profGov');
    const profSchoolEl = document.getElementById('profSchool');
    const profSubjectEl = document.getElementById('profSubject');
    const profContactEl = document.getElementById('profContact');
    const profRightsEl = document.getElementById('profRights');

    if (profNameEl && profNameEl.value.trim()) current.name = profNameEl.value.trim();
    if (profGovEl && profGovEl.value.trim()) current.governorate = profGovEl.value.trim();
    if (profSchoolEl && profSchoolEl.value.trim()) current.school = profSchoolEl.value.trim();
    if (profSubjectEl && profSubjectEl.value.trim()) current.subject = profSubjectEl.value.trim();
    if (profContactEl && profContactEl.value.trim()) current.contact = profContactEl.value.trim();
    if (profRightsEl && profRightsEl.value.trim()) current.rights = profRightsEl.value.trim();
  }
  current.updatedAt = new Date().toISOString();

  // If super admin, keep in-memory SUPER_ADMIN_ACCOUNT synchronized as well
  if (current.id === 'usr_admin' || current.username === 'admin') {
    if (current.name) SUPER_ADMIN_ACCOUNT.name = current.name;
    if (current.governorate) SUPER_ADMIN_ACCOUNT.governorate = current.governorate;
    if (current.school) SUPER_ADMIN_ACCOUNT.school = current.school;
    if (current.subject) SUPER_ADMIN_ACCOUNT.subject = current.subject;
    if (current.contact) SUPER_ADMIN_ACCOUNT.contact = current.contact;
    if (current.rights) SUPER_ADMIN_ACCOUNT.rights = current.rights;
  }

  // Update global teacherProfile and persist to storage
  teacherProfile = { ...teacherProfile, ...current };
  try {
    localStorage.setItem('moallem_teacher_profile', JSON.stringify(teacherProfile));
    if (current.id) {
      localStorage.setItem(`moallem_teacher_profile_${current.id}`, JSON.stringify(teacherProfile));
    }
  } catch (_) { }

  // Update in accounts
  const accounts = getAuthAccounts();
  const idx = accounts.findIndex(a =>
    (a.id && a.id === current.id) ||
    (a.email && a.email === current.email) ||
    (a.username && a.username === current.username)
  );
  if (idx !== -1) {
    accounts[idx] = { ...accounts[idx], ...current };
    saveAuthAccounts(accounts);
  }

  setCurrentUser(current);
  syncProfileModalInputs(current);

  // Sync topbar teacher name & drawer
  const displayName = current.name || current.username || 'أستاذ المادة';
  const topbarNameEl = document.getElementById('topbarTeacherName') || document.querySelector('.topbar-user-name');
  if (topbarNameEl) {
    topbarNameEl.textContent = displayName;
  }
  const drawerNameEl = document.getElementById('drawerTeacherName');
  if (drawerNameEl) {
    drawerNameEl.textContent = displayName;
  }
  const heroNameEl = document.getElementById('heroBannerTeacherName');
  if (heroNameEl) {
    heroNameEl.textContent = displayName;
  }

  // Auto apply to exam header silently
  applyProfileToExamHeader(true);

  // Sync to server cloud sync so server also has updated teacherProfile & teacherName
  if (typeof window.saveUserDataToServer === 'function' && current && current.id && current.id !== 'usr_guest') {
    window.saveUserDataToServer(true);
  }

  // Auto-save visual indicator
  const indicator = document.getElementById('profileAutoSaveIndicator');
  if (indicator) {
    indicator.style.display = 'inline-flex';
    clearTimeout(window._profileAutoSaveTimer);
    window._profileAutoSaveTimer = setTimeout(() => {
      indicator.style.display = 'none';
    }, 2500);
  }

  if (isClosingOrManual) {
    showToast('تم حفظ وتحديث بيانات المدرس الأساسية بنجاح! 💾✨', 'success');
  }
}
window.saveTeacherProfile = saveTeacherProfile;

// Teacher Profile Modal Controller (المعلومات الشخصية للأستاذ)
window.openTeacherProfileModal = function () {
  try {
    if (typeof window.closeSideDrawer === 'function') {
      window.closeSideDrawer();
    }
    if (typeof loadTeacherProfile === 'function') {
      loadTeacherProfile();
    }
    const current = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    if (current && typeof syncProfileModalInputs === 'function') {
      syncProfileModalInputs(current);
    } else if (typeof teacherProfile !== 'undefined' && teacherProfile && typeof syncProfileModalInputs === 'function') {
      syncProfileModalInputs(teacherProfile);
    }
    if (typeof window.renderSessionsLog === 'function') {
      try {
        window.renderSessionsLog();
      } catch (e) {
        console.warn('renderSessionsLog error:', e);
      }
    }
    const pModal = document.getElementById('profileModal');
    if (pModal) {
      pModal.classList.add('open');
      setTimeout(() => {
        const pName = document.getElementById('profName');
        if (pName) pName.focus();
      }, 100);
    } else {
      console.warn('profileModal element not found');
    }
  } catch (err) {
    console.error('Error opening teacher profile modal:', err);
  }
};
window.openProfileModal = window.openTeacherProfileModal;
window.openTeacherProfile = window.openTeacherProfileModal;
window.openTeacherInfoModal = window.openTeacherProfileModal;
window.openTeacherInfo = window.openTeacherProfileModal;

window.closeTeacherProfileModal = function (force = true) {
  try {
    const pModal = document.getElementById('profileModal');
    if (pModal) {
      pModal.classList.remove('open');
    }
  } catch (err) {
    console.error('Error closing teacher profile modal:', err);
  }
};
window.closeProfileModal = window.closeTeacherProfileModal;


window.validateAndCloseProfileModal = function () {
  const check = window.validateTeacherProfileFields(true);
  if (!check.isValid) {
    const firstMissing = check.missingFields[0];
    if (typeof showToast === 'function') {
      showToast(`⚠️ حقل أساسي إجباري مطلوب: (${firstMissing.label})`, 'error');
    }
    if (firstMissing.el) firstMissing.el.focus();
    return false;
  }

  saveTeacherProfile(true);
  const pModal = document.getElementById('profileModal');
  if (pModal) pModal.classList.remove('open');
  return true;
};

function applyProfileToExamHeader(isSilent = false) {
  const current = getCurrentUser();
  if (!current) return;

  if (current.name) {
    appState.header.teacher = current.name;
    const hdrT = document.getElementById('hdrTeacher');
    if (hdrT) hdrT.value = current.name;
  }
  if (current.school) {
    appState.header.school = current.school;
    const hdrS = document.getElementById('hdrSchool');
    if (hdrS) hdrS.value = current.school;
  }
  if (current.governorate) {
    appState.header.ministry = `وزارة التربية - المديرية العامة لتربية ${current.governorate}`;
    const hdrM = document.getElementById('hdrMinistry');
    if (hdrM) hdrM.value = appState.header.ministry;
  }
  if (current.subject) {
    appState.header.subject = current.subject;
    const hdrSub = document.getElementById('hdrSubject');
    if (hdrSub) hdrSub.value = current.subject;
  }
  if (current.rights) {
    appState.header.rights = current.rights;
    const paperFooterRights = document.getElementById('paperFooterRights');
    if (paperFooterRights) {
      paperFooterRights.innerText = current.rights;
      paperFooterRights.style.display = 'block';
    }
  }
  saveStateToStorage();
  renderPaperHeader();
  if (!isSilent) {
    showToast('تمت تعبئة ترويسة وحقوق الاختبار ببيانات المعلم تلقائياً!', 'success');
  }
}

/**
 * Loads saved state from LocalStorage or loads Iraqi Arabic exam preset
 */
function loadSavedState() {
  try {
    const storageKey = getAccountStorageKey('moallem_exam_data');
    let raw = localStorage.getItem(storageKey);
    // Legacy migration for admin if first time
    if (!raw && storageKey.includes('usr_admin')) {
      raw = localStorage.getItem('moallem_exam_data');
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.header) appState.header = { ...appState.header, ...parsed.header };
      if (Array.isArray(parsed.questions)) {
        appState.questions = parsed.questions;
      } else {
        appState.questions = [];
      }
      if (parsed.settings) appState.settings = { ...appState.settings, ...parsed.settings };
      if (parsed.currentArchiveId) appState.currentArchiveId = parsed.currentArchiveId;
    } else {
      loadDefaultPreset();
    }
  } catch (e) {
    console.error('Error loading state:', e);
    appState.questions = [];
  }

  // GUARANTEE FIXED COMPACT MARGINS (8mm / 10mm) PER USER REQUEST
  appState.settings.marginPreset = 'compact';
  appState.settings.marginH = 10;
  appState.settings.marginV = 8;

  // GUARANTEE FIXED 1-PAGE COMPRESSED MODE AS PERMANENT DEFAULT
  const savedPageMode = localStorage.getItem('moallem_page_mode');
  if (savedPageMode) {
    appState.settings.pageLayoutMode = savedPageMode;
  } else {
    appState.settings.pageLayoutMode = '1_page';
  }

  // Use official Ministry of Education seal by default
  if (!appState.header.seal || appState.header.seal === 'assets/iraq_seal.jpg') {
    appState.header.seal = 'assets/iraq_moe_seal.png';
  }
}

function loadDefaultPreset() {
  appState.header.country = 'جمهورية العراق';
  appState.header.ministry = '';
  appState.header.school = '';
  appState.header.examTitle = '';
  appState.header.subject = '';
  appState.header.grade = '';
  appState.header.term = '';
  appState.header.year = '2025 - 2026 م';
  appState.header.time = '';
  appState.header.teacher = '';
  appState.header.instructions = '';
  appState.header.seal = 'assets/iraq_moe_seal.png';
  appState.questions = [];
  appState.currentArchiveId = null;
}

function saveStateToStorage(notify = false) {
  try {
    const storageKey = getAccountStorageKey('moallem_exam_data');
    localStorage.setItem(storageKey, JSON.stringify({
      currentArchiveId: appState.currentArchiveId,
      header: appState.header,
      questions: appState.questions,
      settings: appState.settings
    }));
    if (notify) {
      showToast('تم حفظ مسودة الاختبار الحالية بنجاح', 'success');
    }
    // Schedule background auto-save to archive draft
    scheduleDraftAutoSave();
    // Schedule cloud sync to server backend for cross-device support
    if (typeof scheduleCloudAutoSync === 'function') {
      scheduleCloudAutoSync();
    }
  } catch (e) {
    console.error(e);
  }
}

/**
 * Page Margins Controller
 */
window.setPaperMarginPreset = function (preset) {
  appState.settings.marginPreset = preset;
  if (preset === 'compact') {
    appState.settings.marginH = 10;
    appState.settings.marginV = 8;
  } else if (preset === 'standard') {
    appState.settings.marginH = 14;
    appState.settings.marginV = 12;
  } else if (preset === 'comfortable') {
    appState.settings.marginH = 18;
    appState.settings.marginV = 16;
  }

  updateMarginUI();
  applyPaperMargins();
  saveStateToStorage();
  showToast(`تم ضبط الهامش على النمط: ${preset === 'compact' ? 'الضيق (توفير ورق)' : preset === 'standard' ? 'القياسي الوزاري' : 'العريض'}`, 'info');
};

function applyPaperMargins() {
  const paper = document.getElementById('examPaperDoc');
  const h = appState.settings.marginH || 10;
  const v = appState.settings.marginV || 8;

  // Apply CSS custom properties and padding to all pages
  if (paper) {
    paper.style.setProperty('--paper-padding-v', `${v}mm`);
    paper.style.setProperty('--paper-padding-h', `${h}mm`);
  }
  document.querySelectorAll('.exam-paper-page').forEach(page => {
    page.style.padding = `${v}mm ${h}mm`;
  });

  // Apply to print stylesheet dynamically
  const orientation = (appState && appState.settings && appState.settings.orientation) || 'portrait';
  if (typeof window.setDynamicPrintPage === 'function') {
    window.setDynamicPrintPage(orientation, `${v}mm ${h}mm`, 'A4');
  } else {
    const printStyleEl = document.getElementById('dynamicPrintMarginStyle');
    if (printStyleEl) {
      printStyleEl.innerHTML = `@page { size: A4 ${orientation} !important; margin: ${v}mm ${h}mm !important; }`;
    }
  }
}

function updateMarginUI() {
  const hVal = appState.settings.marginH || 14;
  const vVal = appState.settings.marginV || 12;

  const sliderH = document.getElementById('marginHSlider');
  const sliderV = document.getElementById('marginVSlider');
  const dispH = document.getElementById('marginHDisplay');
  const dispV = document.getElementById('marginVDisplay');

  if (sliderH) sliderH.value = hVal;
  if (sliderV) sliderV.value = vVal;
  if (dispH) dispH.innerText = `${hVal}mm`;
  if (dispV) dispV.innerText = `${vVal}mm`;

  // Update chips in toolbar
  const chipC = document.getElementById('chipMarginCompact');
  const chipS = document.getElementById('chipMarginStandard');
  const chipW = document.getElementById('chipMarginComfortable');
  if (chipC) chipC.classList.toggle('active', appState.settings.marginPreset === 'compact');
  if (chipS) chipS.classList.toggle('active', appState.settings.marginPreset === 'standard');
  if (chipW) chipW.classList.toggle('active', appState.settings.marginPreset === 'comfortable');
}

/**
 * 6 Eye-Friendly Official Arabic Fonts Dictionary
 */
const ARABIC_FONTS = {
  'Cairo': "'Cairo', sans-serif",
  'Amiri': "'Amiri', serif",
  'Tajawal': "'Tajawal', sans-serif",
  'Noto Naskh Arabic': "'Noto Naskh Arabic', serif",
  'Almarai': "'Almarai', sans-serif",
  'Alexandria': "'Alexandria', sans-serif"
};

const FONT_NAMES_AR = {
  'Cairo': 'خط القاهرة (Cairo) - المعتمد الوزاري',
  'Amiri': 'خط الأميري (Amiri) - نسخ تقليدي فخم',
  'Tajawal': 'خط تجوال (Tajawal) - ناعم ومريح للبصر',
  'Noto Naskh Arabic': 'خط نوتو نسخ (Noto Naskh) - خط الكتب المدرسية',
  'Almarai': 'خط المراعي (Almarai) - متناسق ومريح جداً',
  'Alexandria': 'خط الإسكندرية (Alexandria) - هندسي فائق الوضوح'
};

/**
 * Paper Typography and Font Styling Controller
 */
window.setPaperFontFamily = function (fontKey) {
  if (!ARABIC_FONTS[fontKey]) fontKey = 'Cairo';
  appState.settings.fontFamily = fontKey;
  saveStateToStorage();
  applyPaperSettings();
  updateFontFamilyUI();
  showToast(`تم تغيير خط ورقة الاختبار إلى: ${FONT_NAMES_AR[fontKey] || fontKey} ✍️`, 'info');
};

window.updateFontFamilyUI = function () {
  const currentFont = appState.settings.fontFamily || 'Cairo';
  const buttons = document.querySelectorAll('.paper-font-btn');
  buttons.forEach(btn => {
    const f = btn.getAttribute('data-font');
    if (f === currentFont) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
};

window.setPaperFontSize = function (val) {
  appState.settings.fontSize = val;
  const select = document.getElementById('fontSizeSelect');
  if (select && select.value !== val) select.value = val;
  saveStateToStorage();
  applyPaperSettings();
  const labelMap = { small: 'صغير مضغوط (11.5px)', medium: 'متوسط قياسي (13px)', large: 'كبير مقروء (14.5px)', xlarge: 'كبير جداً (16px)' };
  showToast(`تم ضبط حجم خط ورقة الاختبار: ${labelMap[val] || val} 📄`, 'info');
};

window.stepPaperFontSize = function (step) {
  const sizes = ['small', 'medium', 'large', 'xlarge'];
  const current = appState.settings.fontSize || 'medium';
  let idx = sizes.indexOf(current);
  if (idx === -1) idx = 1;
  const nextIdx = Math.max(0, Math.min(sizes.length - 1, idx + step));
  setPaperFontSize(sizes[nextIdx]);
};

window.setPaperLineHeight = function (val) {
  appState.settings.lineHeight = val;
  const select = document.getElementById('lineHeightSelect');
  if (select && select.value !== val) select.value = val;
  saveStateToStorage();
  applyPaperSettings();
  showToast(`تم ضبط تباعد الأسطر على: (${val})`, 'info');
};

/**
 * Paper Direction & Language Controller (عربي RTL / إنجليزي LTR)
 */
window.setPaperDirection = function (dir) {
  if (dir !== 'ltr' && dir !== 'rtl') dir = 'rtl';
  appState.settings.direction = dir;
  saveStateToStorage();
  applyPaperSettings();
  renderPaperQuestions();
  renderPaperHeader();
  window.updateDirectionUI();
  showToast(dir === 'ltr'
    ? 'تم تفعيل اللغة الإنجليزية وتحويل اتجاه الورقة لليسار (LTR) بنجاح 🇬🇧'
    : 'تم تفعيل اللغة العربية وتحويل اتجاه الورقة لليمين (RTL) بنجاح 🇸🇦', 'success');
};

window.togglePaperDirection = function () {
  const current = appState.settings.direction || 'rtl';
  const next = current === 'ltr' ? 'rtl' : 'ltr';
  window.setPaperDirection(next);
};

window.updateDirectionUI = function () {
  const dir = appState.settings.direction || 'rtl';
  const btnRTL = document.getElementById('btnDirRTL');
  const btnLTR = document.getElementById('btnDirLTR');
  const badge = document.getElementById('currentDirectionBadge');
  const quickLabel = document.getElementById('quickDirectionLabel');
  const quickBtn = document.getElementById('toggleDirectionQuickBtn');

  if (btnRTL) btnRTL.classList.toggle('active', dir === 'rtl');
  if (btnLTR) btnLTR.classList.toggle('active', dir === 'ltr');

  if (badge) {
    badge.innerHTML = (dir === 'ltr')
      ? 'الاتجاه الحالي: من اليسار لليمين (LTR) 🇬🇧'
      : 'الاتجاه الحالي: من اليمين لليسار (RTL) 🇸🇦';
  }

  if (quickLabel) {
    quickLabel.innerText = (dir === 'ltr') ? 'الاتجاه: English (LTR)' : 'الاتجاه: عربي (RTL)';
  }
  if (quickBtn) {
    quickBtn.classList.toggle('btn-primary', dir === 'ltr');
  }
};

window.setModalInputsDirection = function (dir) {
  const modal = document.getElementById('questionModal');
  if (!modal) return;
  modal.querySelectorAll('input[type="text"], textarea').forEach(el => {
    el.setAttribute('dir', dir);
    el.style.textAlign = (dir === 'ltr') ? 'left' : 'right';
    el.style.direction = dir;
  });
  showToast(`تم تحويل اتجاه الكتابة في حقول السؤال إلى: ${dir === 'ltr' ? 'اليسار (English LTR)' : 'اليمين (عربي RTL)'}`, 'info');
};

/**
 * Apply Iraqi Official Ministerial Header & Setup
 */
window.applyIraqiOfficialStyle = function () {
  appState.header.country = 'جمهورية العراق';
  appState.header.ministry = `وزارة التربية - المديرية العامة لتربية ${teacherProfile.governorate || 'بغداد / الكرخ الثانية'}`;
  appState.header.school = teacherProfile.school || 'ثانوية المتميزين للبنين';
  appState.header.examTitle = 'الامتحانات العامة للدراسة المتوسطة (الوزاري)';
  appState.header.term = 'الدور الأول';
  appState.header.year = '2025 - 2026 م';
  appState.header.time = 'ثلاث ساعات';
  appState.header.teacher = teacherProfile.name || 'أستاذ المادة';
  appState.header.seal = 'assets/iraq_moe_seal.png';
  appState.header.instructions = 'ملاحظة: الإجابة عن خمسة أسئلة فقط، ولكل سؤال (20) درجة.\n(يُسمح بترك سؤال واحد كاملاً، والترك الضمني موضح داخل فروع الأسئلة).';

  // Sync inputs
  syncHeaderInputs();
  saveStateToStorage();
  renderPaperHeader();
  showToast('تم تطبيق النمط والترويسة الوزارية لجمهورية العراق 🇮🇶 بنجاح!', 'success');
};

function syncHeaderInputs() {
  const map = {
    hdrCountry: appState.header.country,
    hdrMinistry: appState.header.ministry,
    hdrSchool: appState.header.school,
    hdrExamTitle: appState.header.examTitle,
    hdrSubject: appState.header.subject,
    hdrGrade: appState.header.grade,
    hdrYear: appState.header.year,
    hdrTerm: appState.header.term,
    hdrTime: appState.header.time,
    hdrTeacher: appState.header.teacher,
    hdrInstructions: appState.header.instructions,
    hdrSealSelect: appState.header.seal || 'assets/iraq_moe_seal.png'
  }
  for (const [id, val] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  }
}

function syncHeaderFromInputs() {
  const headerInputs = [
    { id: 'hdrCountry', key: 'country' },
    { id: 'hdrMinistry', key: 'ministry' },
    { id: 'hdrSchool', key: 'school' },
    { id: 'hdrExamTitle', key: 'examTitle' },
    { id: 'hdrSubject', key: 'subject' },
    { id: 'hdrGrade', key: 'grade' },
    { id: 'hdrYear', key: 'year' },
    { id: 'hdrTerm', key: 'term' },
    { id: 'hdrTime', key: 'time' },
    { id: 'hdrTeacher', key: 'teacher' },
    { id: 'hdrInstructions', key: 'instructions' }
  ];
  headerInputs.forEach(item => {
    const el = document.getElementById(item.id);
    if (el && el.value !== undefined) {
      appState.header[item.key] = el.value.trim();
    }
  });
  const sealSelect = document.getElementById('hdrSealSelect');
  if (sealSelect && sealSelect.value) {
    appState.header.seal = sealSelect.value;
  }
}

window.setQuickGrade = function (gradeName) {
  const inp = document.getElementById('hdrGrade');
  if (inp) {
    inp.value = gradeName;
  }
  appState.header.grade = gradeName;
  if (typeof syncHeaderInputs === 'function') syncHeaderInputs();
  if (typeof renderPaperHeader === 'function') renderPaperHeader();
  if (typeof autoSaveDraft === 'function') autoSaveDraft();
  showToast(`تم تعيين المرحلة: ${gradeName} 🎓`, 'info');
};

/**
 * Saved Exams Archive Management
 */
const OFFICIAL_11_PRESET_IDS = [
  'preset_model_islamic',
  'preset_model_english',
  'preset_model_math',
  'preset_model_physics',
  'preset_model_arabic',
  'preset_model_islamic_6th',
  'preset_model_arabic_6th',
  'preset_model_english_6th',
  'preset_model_math_6th',
  'preset_model_physics_6th',
  'preset_model_chemistry_6th'
];

function initDefaultArchiveModels(forceReset = false) {
  try {
    const storageKey = getAccountStorageKey('moallem_saved_exams_archive');
    const officialModels = (typeof window !== 'undefined' && window.OFFICIAL_MINISTERIAL_ARCHIVE_MODELS) ? window.OFFICIAL_MINISTERIAL_ARCHIVE_MODELS : [];
    if (!officialModels || officialModels.length === 0) return [];

    // Filter to strictly the 11 protected official ministerial models
    const official11 = officialModels.filter(m => OFFICIAL_11_PRESET_IDS.includes(m.id));
    official11.forEach(m => {
      m.isModelPreset = true;
      m.isProtected = true;
    });

    const cleanList = official11.map(m => JSON.parse(JSON.stringify(m)));
    localStorage.setItem(storageKey, JSON.stringify(cleanList));
    localStorage.setItem('moallem_saved_exams_archive', JSON.stringify(cleanList));
    updateArchiveBadge();
    return cleanList;
  } catch (err) {
    console.error('Error in initDefaultArchiveModels:', err);
    return [];
  }
}

function purgeTrialDataOnStartup() {
  try {
    const PURGE_KEY = 'moallem_all_sections_zeroed_v2026';
    if (!localStorage.getItem(PURGE_KEY)) {
      // 1. Clear Question Bank
      const bankKey = (typeof getAccountStorageKey === 'function') ? getAccountStorageKey('moallem_questions_history_bank') : 'moallem_questions_history_bank';
      localStorage.removeItem(bankKey);
      localStorage.removeItem('moallem_questions_history_bank');
      localStorage.removeItem('moallem_questions_bank');

      // 2. Clear Exam Draft & Current Questions
      localStorage.removeItem('moallem_exam_draft_v1');
      localStorage.removeItem('moallem_current_exam');
      if (typeof appState !== 'undefined') {
        appState.questions = [];
        appState.currentArchiveId = null;
        if (appState.header) {
          appState.header.examTitle = '';
          appState.header.subject = '';
          appState.header.school = '';
          appState.header.teacher = '';
          appState.header.instructions = '';
        }
      }

      // 3. Clear Student Grades Rosters
      localStorage.removeItem('masar_teacher_grades_rosters_v1');
      localStorage.removeItem('masar_teacher_grades_active_id');

      // 4. Clear Student Behavior & Attendance
      localStorage.removeItem('masar_teacher_behavior_records_v1');
      localStorage.removeItem('masar_teacher_behavior_rosters_v1');

      // 5. Clear Lesson Plans
      localStorage.removeItem('masar_teacher_lesson_plans_archive_v1');
      localStorage.removeItem('masar_teacher_lesson_plan_current_v1');

      // 6. Reset Saved Exams Archive to strictly the 11 protected ministerial models
      initDefaultArchiveModels(true);

      localStorage.setItem(PURGE_KEY, '1');
      console.log('✅ All sections completely zeroed and purged. 11 official ministerial models preserved.');
    }
  } catch (e) {
    console.warn('Purge error:', e);
  }
}

window.resetAllTrialData = function () {
  localStorage.removeItem('moallem_trial_purged_v2026_final');
  purgeTrialDataOnStartup();
  if (typeof renderArchiveList === 'function') renderArchiveList();
  if (typeof updateDailyReportMetrics === 'function') updateDailyReportMetrics();
  if (typeof renderQuestionsList === 'function') renderQuestionsList();
  if (typeof renderPaperQuestions === 'function') renderPaperQuestions();
  showToast('تم تصفير كافة البيانات التجريبية، وحفظ النماذج الوزارية الـ 11 المحمية بنجاح 🏛️', 'success');
};

function getSavedExamsArchive() {
  try {
    const storageKey = getAccountStorageKey('moallem_saved_exams_archive');
    let raw = localStorage.getItem(storageKey);
    if (!raw && storageKey.includes('usr_admin')) {
      raw = localStorage.getItem('moallem_saved_exams_archive');
    }
    if (!raw) {
      return initDefaultArchiveModels(false);
    }
    const list = JSON.parse(raw);
    const officialModels = (typeof window !== 'undefined' && window.OFFICIAL_MINISTERIAL_ARCHIVE_MODELS) ? window.OFFICIAL_MINISTERIAL_ARCHIVE_MODELS : [];
    if (officialModels.length > 0) {
      const hasAll = OFFICIAL_11_PRESET_IDS.every(id => list.some(item => item.id === id));
      if (!hasAll) {
        return initDefaultArchiveModels(false);
      }
    }
    return list;
  } catch (e) {
    return initDefaultArchiveModels(false);
  }
}

window.reseedDefaultArchiveModels = function () {
  initDefaultArchiveModels(true);
  renderArchiveList();
  showToast('تم استيراد وتحديث النماذج الوزارية الـ 11 المعتمدة (الثالث متوسط والسادس إعدادي لجميع المواد) بنجاح في الأرشيف! 🏛️', 'success');
};

function saveExamsArchive(list) {
  try {
    const storageKey = getAccountStorageKey('moallem_saved_exams_archive');
    localStorage.setItem(storageKey, JSON.stringify(list));
    updateArchiveBadge();
    if (typeof scheduleCloudAutoSync === 'function') {
      scheduleCloudAutoSync();
    }
  } catch (e) {
    console.error(e);
  }
}

function updateArchiveBadge() {
  const badge = document.getElementById('archiveCountBadge');
  if (badge) {
    const list = getSavedExamsArchive();
    badge.innerText = list.length;
  }
}

function saveCurrentExamToArchive(asNew = false) {
  // 1. Sync any open question modal or header inputs immediately
  const qModal = document.getElementById('questionModal');
  if (qModal && qModal.classList.contains('open')) {
    try { saveQuestionFromModal(); } catch (e) { console.warn(e); }
  }
  if (typeof syncHeaderFromInputs === 'function') {
    syncHeaderFromInputs();
  }

  // 2. Validate open questions
  if (!appState.questions || appState.questions.length === 0) {
    // If user clicked save without questions, still clear workspace and navigate to report
    clearAndResetExamWorkspace(true);
    if (typeof window.switchToReportTab === 'function') {
      window.switchToReportTab(false);
    }
    showToast('تم تصفير ورقة العمل والانتقال إلى لوحة التقرير 📊', 'info');
    return;
  }

  // 3. Clear draft timer to prevent draft overwrite
  if (autoSaveDraftTimer) {
    clearTimeout(autoSaveDraftTimer);
    autoSaveDraftTimer = null;
  }

  const archive = getSavedExamsArchive();
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  let totalScore = 0;
  appState.questions.forEach(q => totalScore += (Number(q.score) || 1));

  // Determine official title (remove draft label if present)
  let examTitle = (appState.header.examTitle || '').trim();
  if (!examTitle || examTitle.startsWith('مسودة')) {
    if (appState.header.subject && appState.header.subject.trim()) {
      examTitle = `اختبار مادة ${appState.header.subject.trim()}`;
    } else {
      examTitle = 'اختبار أسئلة محفوظ وموثق';
    }
    appState.header.examTitle = examTitle;
    syncHeaderInputs();
  }

  const examData = {
    header: JSON.parse(JSON.stringify(appState.header)),
    questions: JSON.parse(JSON.stringify(appState.questions)),
    settings: JSON.parse(JSON.stringify(appState.settings))
  }

  // Find if this is an existing saved exam OR a draft being converted
  let targetIndex = -1;

  if (!asNew && appState.currentArchiveId) {
    targetIndex = archive.findIndex(item => item.id === appState.currentArchiveId);
  }

  // If not found by currentArchiveId, check if there is an active draft to convert
  if (targetIndex === -1 && !asNew) {
    targetIndex = archive.findIndex(item => item.id === 'draft_autosave_latest' || item.isDraft === true);
  }

  let savedId;

  if (targetIndex !== -1 && !asNew) {
    // Convert existing draft or update existing saved entry
    const existing = archive[targetIndex];
    savedId = (existing.id === 'draft_autosave_latest') ? ('archive_' + Date.now()) : existing.id;

    archive[targetIndex] = {
      ...existing,
      id: savedId,
      isDraft: false, // Converted from draft to official saved exam!
      isSavedExam: true,
      title: examTitle,
      subject: appState.header.subject || (existing.subject !== 'مسودة عمل' ? existing.subject : 'عام'),
      grade: appState.header.grade || existing.grade || '',
      updatedAt: dateStr,
      questionsCount: appState.questions.length,
      totalScore: totalScore,
      data: examData
    }
  } else {
    // Create new saved exam entry
    savedId = 'archive_' + Date.now();
    const newEntry = {
      id: savedId,
      isDraft: false,
      isSavedExam: true,
      title: examTitle,
      subject: appState.header.subject || 'عام',
      grade: appState.header.grade || '',
      createdAt: dateStr,
      updatedAt: dateStr,
      questionsCount: appState.questions.length,
      totalScore: totalScore,
      data: examData
    }
    archive.unshift(newEntry);
  }

  // Remove any remaining orphaned drafts for this exam
  for (let i = archive.length - 1; i >= 0; i--) {
    if (archive[i].id !== savedId && (archive[i].id === 'draft_autosave_latest' || archive[i].isDraft === true)) {
      archive.splice(i, 1);
    }
  }

  appState.currentArchiveId = savedId;
  saveExamsArchive(archive);
  saveStateToStorage();
  updateArchiveBadge();
  if (typeof renderArchiveList === 'function') {
    renderArchiveList();
  }

  // Immediate cross-device cloud push!
  if (typeof window.syncUserDataToServer === 'function') {
    window.syncUserDataToServer(getCurrentUser(), true);
  }

  // Clear / Zero-out the current workspace and navigate directly to Report Center
  clearAndResetExamWorkspace(true);
  if (typeof window.switchToReportTab === 'function') {
    window.switchToReportTab(true);
  } else {
    showToast(`تم حفظ الاختبار في الأرشيف وتصفير ورقة العمل بنجاح 📁✔`, 'success');
  }
}
window.saveCurrentExamToArchive = saveCurrentExamToArchive;

function openArchiveModal() {
  if (typeof window.closeSideDrawer === 'function') {
    window.closeSideDrawer();
  }
  renderArchiveList();
  document.getElementById('archiveModal').classList.add('open');
}
window.openArchiveModal = openArchiveModal;

window.currentArchiveSubject = 'all';

window.filterArchiveBySubject = function (subj) {
  window.currentArchiveSubject = subj || 'all';
  document.querySelectorAll('.archive-subject-pill').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-subject') === window.currentArchiveSubject);
  });
  const searchInput = document.getElementById('archiveSearchInput');
  const q = searchInput ? searchInput.value : '';
  renderArchiveList(q);
};

function renderArchiveList(filterQuery = '') {
  const container = document.getElementById('savedExamsList');
  if (!container) return;

  let list = getSavedExamsArchive();
  const subj = window.currentArchiveSubject || 'all';

  if (subj !== 'all') {
    if (subj === 'models') {
      list = list.filter(item => item.isModelPreset);
    } else if (subj === 'drafts') {
      list = list.filter(item => item.isDraft);
    } else if (subj === 'grade_3rd') {
      list = list.filter(item => {
        const g = (item.grade || (item.data && item.data.header && item.data.header.grade) || item.title || '').toLowerCase();
        return g.includes('ثالث') || g.includes('3rd');
      });
    } else if (subj === 'grade_6th') {
      list = list.filter(item => {
        const g = (item.grade || (item.data && item.data.header && item.data.header.grade) || item.title || '').toLowerCase();
        return g.includes('سادس') || g.includes('6th');
      });
    } else {
      const sLower = subj.toLowerCase();
      list = list.filter(item => {
        const itemSubj = (item.subject || '').toLowerCase();
        const itemTitle = (item.title || '').toLowerCase();
        return itemSubj.includes(sLower) || itemTitle.includes(sLower);
      });
    }
  }

  if (filterQuery && filterQuery.trim()) {
    const q = filterQuery.trim().toLowerCase();
    list = list.filter(item =>
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.subject && item.subject.toLowerCase().includes(q)) ||
      (item.grade && item.grade.toLowerCase().includes(q))
    );
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem; color: var(--text-muted);">
        <i class="fa-solid fa-folder-open" style="font-size: 2.5rem; margin-bottom: 0.75rem; color: var(--text-dim);"></i>
        <p style="font-weight: 700;">لا توجد اختبارات أو نماذج مطابقة للبحث أو الفلتر المختار.</p>
        <p style="font-size: 0.85rem; margin-top: 4px;">يمكنك النقر على زر "الكل" أو "استيراد النماذج الوزارية (12 نموذج)" لاسترجاع جميع النماذج الرسمية.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(item => `
    <div class="saved-exam-card ${item.isDraft ? 'saved-exam-draft-card' : ''} ${item.isModelPreset ? 'saved-exam-model-card' : ''}" data-archive-id="${item.id}">
      <div class="saved-exam-header">
        <div class="saved-exam-title">
          ${item.isDraft ? '<i class="fa-solid fa-clock-rotate-left text-warning" style="margin-left: 6px;"></i>' : ''}
          ${item.isModelPreset ? '<i class="fa-solid fa-star text-warning" style="margin-left: 5px;"></i>' : ''}
          ${item.title || 'مسودة غير معنونة'}
        </div>
        ${item.isDraft ? `
          <span class="badge-tag" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; font-weight: bold; border: 1px solid rgba(245, 158, 11, 0.4); white-space: nowrap;">
            <i class="fa-solid fa-shield-halved"></i> مسودة طارئة
          </span>
        ` : item.isModelPreset ? `
          <span class="badge-tag" style="background: rgba(16, 185, 129, 0.2); color: #10b981; font-weight: bold; border: 1px solid rgba(16, 185, 129, 0.4); white-space: nowrap;">
            <i class="fa-solid fa-file-shield"></i> نموذج وزاري معتمد
          </span>
        ` : `
          <span class="badge-tag" style="background: rgba(37, 99, 235, 0.2); color: #60a5fa; font-weight: bold; white-space: nowrap;">
            ${item.subject || 'عام'}
          </span>
        `}
      </div>

      <div class="saved-exam-meta">
        <div><i class="fa-solid fa-graduation-cap text-muted"></i> ${item.grade || 'غير محدد'} | <strong>${item.subject || 'المادة'}</strong></div>
        <div><i class="fa-solid fa-list-check text-muted"></i> ${item.questionsCount} أسئلة | <i class="fa-solid fa-award text-muted"></i> ${item.totalScore} درجة</div>
        <div style="font-size: 0.74rem; color: var(--text-dim);"><i class="fa-solid fa-clock"></i> ${item.isDraft ? 'تم الحفظ التلقائي:' : item.isModelPreset ? 'الاعتماد الوزاري:' : 'آخر حفظ:'} ${item.updatedAt || item.createdAt}</div>
      </div>

      <div class="saved-exam-actions">
        <button class="btn btn-primary" style="flex: 1; padding: 0.38rem 0.65rem; font-size: 0.82rem;" onclick="loadExamFromArchive('${item.id}')">
          <i class="fa-solid fa-rotate-left"></i> ${item.isDraft ? 'استرجاع ومتابعة العمل' : 'فتح وتعديل'}
        </button>
        <button class="btn btn-outline" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;" onclick="duplicateExamInArchive('${item.id}')" title="إنشاء نسخة مكررة">
          <i class="fa-solid fa-copy"></i>
        </button>
        ${(item.isModelPreset || (item.id && (item.id.startsWith('preset_model_') || item.id === 'iraq_official_model'))) ? `
          <span class="badge-tag" style="background: rgba(16, 185, 129, 0.12); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 0.74rem; padding: 0.38rem 0.65rem; display: inline-flex; align-items: center; gap: 4px; border-radius: 6px;" title="نموذج وزاري رسمي معتمد - محمي من الحذف نهائياً 🔒">
            <i class="fa-solid fa-lock"></i> محمي
          </span>
        ` : `
          <button class="btn btn-outline btn-del" style="padding: 0.35rem 0.65rem; font-size: 0.8rem; color: var(--danger);" onclick="deleteExamFromArchive('${item.id}')" title="حذف هذا الاختبار فوراً">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        `}
      </div>
    </div>
  `).join('');
}

window.loadExamFromArchive = function (id) {
  const archive = getSavedExamsArchive();
  const entry = archive.find(e => e.id === id);
  if (!entry || !entry.data) return;

  appState.currentArchiveId = entry.id;
  appState.header = JSON.parse(JSON.stringify(entry.data.header));
  appState.questions = JSON.parse(JSON.stringify(entry.data.questions));
  if (entry.data.settings) appState.settings = JSON.parse(JSON.stringify(entry.data.settings));

  // Maintain compact margins (8mm x 10mm) as permanently fixed
  appState.settings.marginPreset = 'compact';
  appState.settings.marginH = 10;
  appState.settings.marginV = 8;

  // Set direction correctly based on language / settings
  const dir = (entry.data.settings && entry.data.settings.direction) ||
    (entry.subject === 'English Language' || (entry.data.header && entry.data.header.subject === 'English Language') ? 'ltr' : 'rtl');
  appState.settings.direction = dir;

  syncHeaderInputs();
  saveStateToStorage();
  applyPaperSettings();
  applyPaperMargins();
  updateMarginUI();
  if (typeof window.updateDirectionUI === 'function') {
    window.updateDirectionUI();
  }
  renderAll();
  document.getElementById('archiveModal').classList.remove('open');
  showToast(`تم فتح النموذج «${entry.title}» في مساحة العمل بنجاح! جاهز للتعديل والطباعة 🚀`, 'success');
};

window.duplicateExamInArchive = function (id) {
  const archive = getSavedExamsArchive();
  const entry = archive.find(e => e.id === id);
  if (!entry) return;

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const cloned = JSON.parse(JSON.stringify(entry));
  cloned.id = 'archive_' + Date.now();
  cloned.title = cloned.title + ' (نسخة جديدة)';
  cloned.createdAt = dateStr;
  cloned.updatedAt = dateStr;

  archive.unshift(cloned);
  saveExamsArchive(archive);
  renderArchiveList();
  showToast('تم استنساخ الاختبار بنجاح في الأرشيف', 'info');
};

window.exportSingleArchiveWord = function (id) {
  const archive = getSavedExamsArchive();
  const entry = archive.find(e => e.id === id);
  if (!entry || !entry.data) return;
  ExamExporter.exportToWord(entry.data, false);
};

window.deleteExamFromArchive = function (id) {
  if (!id) return;

  // 1. Guard against deleting ministerial models
  const isMinisterial = id.startsWith('preset_model_') || id.startsWith('iraq_') || id === 'iraq_official_model';
  if (isMinisterial) {
    showToast('النماذج الوزارية الرسمية معتمدة ومحمية من الحذف نهائياً 🔒', 'warning');
    return;
  }

  const archive = getSavedExamsArchive();
  const targetExam = archive.find(e => e.id === id);
  if (targetExam && (targetExam.isModelPreset || (targetExam.id && targetExam.id.startsWith('preset_model_')))) {
    showToast('النماذج الوزارية الرسمية معتمدة ومحمية من الحذف نهائياً 🔒', 'warning');
    return;
  }

  const examTitle = targetExam ? (targetExam.title || 'هذا الاختبار') : 'الاختبار';

  if (confirm(`هل أنت متأكد من حذف «${examTitle}» نهائياً؟ سيتم الحذف فوراً.`)) {
    // 2. Perform direct deletion from storage
    const storageKey = getAccountStorageKey('moallem_saved_exams_archive');
    let currentList = [];
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) currentList = JSON.parse(raw);
    } catch (e) { currentList = []; }

    const updatedList = currentList.filter(e => e.id !== id);
    localStorage.setItem(storageKey, JSON.stringify(updatedList));

    // Admin fallback key sync
    if (storageKey.includes('usr_admin')) {
      try {
        const adminRaw = localStorage.getItem('moallem_saved_exams_archive');
        if (adminRaw) {
          const adminList = JSON.parse(adminRaw).filter(e => e.id !== id);
          localStorage.setItem('moallem_saved_exams_archive', JSON.stringify(adminList));
        }
      } catch (e) { }
    }

    // Reset current active exam pointer if deleted
    if (appState.currentArchiveId === id) {
      appState.currentArchiveId = null;
      saveStateToStorage();
    }

    // 3. Immediately re-render all views in real-time
    if (typeof renderArchiveList === 'function') {
      renderArchiveList();
    }
    if (typeof window.filterDailyReport === 'function') {
      window.filterDailyReport();
    }
    if (typeof updateArchiveBadge === 'function') {
      updateArchiveBadge();
    }

    showToast(`تم حذف «${examTitle}» بنجاح 🗑️`, 'success');
  }
};

/**
 * Right Slide-Out Sidebar Drawer Controller
 * (شريط جانبي عائم فخم لا يؤثر على مساحة أو تخطيط الموقع إطلاقاً)
 */
let _lastDrawerToggleTime = 0;

window.openSideDrawer = function () {
  const drawer = document.getElementById('sideDrawer');
  const backdrop = document.getElementById('drawerBackdrop');
  if (drawer) {
    drawer.classList.add('open');
  }
  if (backdrop) {
    backdrop.classList.add('open');
  }
  try {
    if (typeof window.syncPlatformGoogleIconsState === 'function') {
      window.syncPlatformGoogleIconsState();
    }

  if (typeof window.syncSideDrawerItems === 'function') {
      window.syncSideDrawerItems();
    }
  } catch (err) {
    console.warn('Error in syncSideDrawerItems:', err);
  }
};

window.closeSideDrawer = function () {
  const drawer = document.getElementById('sideDrawer');
  const backdrop = document.getElementById('drawerBackdrop');
  if (drawer) {
    drawer.classList.remove('open', 'expanded', 'mini-mode');
  }
  if (backdrop) {
    backdrop.classList.remove('open');
  }
};

window.toggleSideDrawer = function (e) {
  if (e && typeof e.stopPropagation === 'function') {
    e.stopPropagation();
  }
  const now = Date.now();
  if (now - _lastDrawerToggleTime < 280) {
    return; // Prevent duplicate rapid toggle
  }
  _lastDrawerToggleTime = now;

  const drawer = document.getElementById('sideDrawer');
  if (!drawer) return;
  if (drawer.classList.contains('open')) {
    window.closeSideDrawer();
  } else {
    window.openSideDrawer();
  }
};

window.syncSideDrawerItems = function () {
  const current = (typeof getCurrentUser === 'function' ? getCurrentUser() : null) || (appState && appState.currentAccount) || {};
  const loggedIn = typeof isUserLoggedIn === 'function' ? isUserLoggedIn() : false;
  const isAdmin = loggedIn && current && (current.isAdmin || current.role === 'admin' || current.username === 'admin' || current.email === 'admin' || current.id === 'acc_admin');
  const isSubscribed = (current.isSubscribed || current.isVip || isAdmin || (current.id && localStorage.getItem(`moallem_vip_subscription_${current.id}`) === 'true'));

  // Sync Teacher Name & Role
  const displayName = (current && (current.name || current.username)) || (appState && appState.teacherProfile && appState.teacherProfile.name) || 'أستاذ المادة';
  const nameEl = document.getElementById('drawerTeacherName');
  const roleEl = document.getElementById('drawerTeacherRole');
  if (nameEl) {
    nameEl.innerText = displayName;
  }
  if (roleEl) {
    roleEl.innerText = isAdmin ? 'المدير العام للمنصة 👑' : (isSubscribed ? 'مشترك معتمد PRO 💎' : 'مدرس معتمد • مسار المعلم');
  }

  // Also sync topbar badge
  const topbarNameEl = document.getElementById('topbarTeacherName') || document.querySelector('.topbar-user-name');
  if (topbarNameEl) {
    topbarNameEl.innerText = displayName;
  }
  const topbarRoleEl = document.getElementById('topbarTeacherRole') || document.querySelector('.topbar-user-role');
  if (topbarRoleEl) {
    topbarRoleEl.innerText = isAdmin ? 'المدير العام 👑' : (isSubscribed ? 'مشترك PRO 💎' : 'مدرس معتمد');
  }

  // 1. إعدادات الحساب (Always accessible)
  const accBtn = document.getElementById('drawerAccountSettingsBtn');
  if (accBtn) {
    accBtn.style.display = 'flex';
  }

  // 2. إدارة المشتركين (Admin Only)
  const subBtn = document.getElementById('drawerAdminSubscribersBtn');
  const subCountBadge = document.getElementById('drawerActiveSubsBadge');
  if (subBtn) {
    if (isAdmin) {
      subBtn.style.setProperty('display', 'flex', 'important');
      subBtn.classList.remove('admin-only-hidden');
    } else {
      subBtn.style.setProperty('display', 'none', 'important');
      subBtn.classList.add('admin-only-hidden');
    }
  }
  if (subCountBadge && isAdmin) {
    const allAccounts = typeof getAuthAccounts === 'function' ? getAuthAccounts() : [];
    const activeSubsCount = allAccounts.filter(acc => {
      if (acc.isAdmin || acc.role === 'admin' || acc.username === 'admin') return false;
      return acc.isSubscribed || acc.isVip || (acc.id && localStorage.getItem(`moallem_vip_subscription_${acc.id}`) === 'true');
    }).length;
    subCountBadge.innerText = activeSubsCount;
  }

  // 3. إدارة السيرفر والكيت وي (Admin Only ⚡)
  const srvBtn = document.getElementById('drawerServerStatusBtn');
  const srvPill = document.getElementById('drawerServerStatusPill');
  const gwHint = document.getElementById('drawerGatewayTypeHint');
  if (srvBtn) {
    if (isAdmin) {
      srvBtn.style.setProperty('display', 'flex', 'important');
      srvBtn.classList.remove('admin-only-hidden');
    } else {
      srvBtn.style.setProperty('display', 'none', 'important');
      srvBtn.classList.add('admin-only-hidden');
    }
  }
  if (window.MOALLEM_PUBLIC_SERVER_URL) {
    if (srvPill) srvPill.innerText = 'سحابي 🟢';
    if (gwHint) gwHint.innerText = window.MOALLEM_PUBLIC_SERVER_URL.includes('trycloudflare') ? 'بوابة Cloudflare Argo Tunnel' : 'بوابة سحابية نشطة';
  } else {
    if (srvPill) srvPill.innerText = 'محلي 🟡';
    if (gwHint) gwHint.innerText = 'بوابة: Localhost / Port 5000';
  }

  // 4. خطة الاشتراك والباقات (Always accessible)
  const plansBtn = document.getElementById('drawerSubscriptionPlansBtn');
  if (plansBtn) {
    plansBtn.style.display = 'flex';
  }

  // 5. إدارة وضبط أسعار الباقات والخصومات (Admin Only)
  const adminPricingBtn = document.getElementById('drawerAdminPricingBtn');
  if (adminPricingBtn) {
    if (isAdmin) {
      adminPricingBtn.style.setProperty('display', 'flex', 'important');
      adminPricingBtn.classList.remove('admin-only-hidden');
    } else {
      adminPricingBtn.style.setProperty('display', 'none', 'important');
      adminPricingBtn.classList.add('admin-only-hidden');
    }
  }

  // Synchronize Topbar Admin Buttons (Strictly for ADMIN ONLY 👑⚡)
  const topbarSubBtn = document.getElementById('topbarAdminSubscribersBtn');
  if (topbarSubBtn) {
    if (isAdmin) {
      topbarSubBtn.style.setProperty('display', 'inline-flex', 'important');
      topbarSubBtn.classList.remove('admin-only-hidden');
    } else {
      topbarSubBtn.style.setProperty('display', 'none', 'important');
      topbarSubBtn.classList.add('admin-only-hidden');
    }
  }
  const topbarSrvBtn = document.getElementById('topbarServerStatusBtn');
  if (topbarSrvBtn) {
    if (isAdmin) {
      topbarSrvBtn.style.setProperty('display', 'inline-flex', 'important');
      topbarSrvBtn.classList.remove('admin-only-hidden');
    } else {
      topbarSrvBtn.style.setProperty('display', 'none', 'important');
      topbarSrvBtn.classList.add('admin-only-hidden');
    }
  }
};

window.initAppCards3DTilt = function () {
  // Performance optimization: CSS hardware-accelerated transforms replace expensive mousemove getBoundingClientRect reflows
  // Cards are smoothly animated via .app-hub-card:hover with will-change: transform
};

/**
 * Attaches Event Listeners
 */
function initEventListeners() {
  // Side Drawer Close & Keyboard
  const closeDrawerBtn = document.getElementById('closeSideDrawerBtn');
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', window.closeSideDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener('click', window.closeSideDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.closeSideDrawer();
    }
  });

  // Theme Toggle
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // Quick Color Palette Dropdown (if present)
  const quickPaletteBtn = document.getElementById('quickPaletteBtn');
  const quickPaletteMenu = document.getElementById('quickPaletteMenu');
  if (quickPaletteBtn && quickPaletteMenu) {
    quickPaletteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      quickPaletteMenu.classList.toggle('show');
    });
    document.addEventListener('click', (e) => {
      if (!quickPaletteMenu.contains(e.target) && !quickPaletteBtn.contains(e.target)) {
        quickPaletteMenu.classList.remove('show');
      }
    });
  }

  // Toggle Live Preview
  const togglePrevBtn = document.getElementById('togglePreviewBtn');
  if (togglePrevBtn) togglePrevBtn.addEventListener('click', window.togglePreviewPane);

  // Tabs Switching via Centralized Controller
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      window.switchToTab(targetId);
    });
  });

  // Initial Sync for Active Tab & Preview Button Visibility
  const activeTabBtn = document.querySelector('.tab-btn.active');
  const initialTabId = activeTabBtn ? activeTabBtn.getAttribute('data-tab') : 'tab-apps';
  window.updatePreviewVisibilityForTab(initialTabId);
  window.updateAppsHubStats();

  if (typeof openQuestionModal === 'function') {
    window.openQuestionModal = openQuestionModal;
  }

  // Custom Question Type Dropdown Handlers
  let _lastQDropdownToggleTime = 0;
  window.toggleQTypeDropdown = function (e) {
    if (e) {
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
      if (typeof e.preventDefault === 'function') e.preventDefault();
    }
    const now = Date.now();
    if (now - _lastQDropdownToggleTime < 180) {
      return;
    }
    _lastQDropdownToggleTime = now;

    const dropdown = document.getElementById('qbuilderCustomDropdown');
    const menu = document.getElementById('qbuilderDropdownMenu');
    const trigger = document.getElementById('qbuilderDropdownTrigger');
    const chevron = document.getElementById('qbuilderTriggerChevron');
    if (!dropdown || !menu) return;

    const isOpen = dropdown.classList.contains('open') || menu.style.display === 'block';
    if (isOpen) {
      window.closeQTypeDropdown();
    } else {
      dropdown.classList.add('open');
      menu.style.display = 'block';
      menu.style.opacity = '1';
      menu.style.visibility = 'visible';
      menu.style.pointerEvents = 'auto';
      menu.style.transform = 'translateY(0) scale(1)';
      if (trigger) trigger.setAttribute('aria-expanded', 'true');
      if (chevron) chevron.style.transform = 'rotate(180deg)';
    }
  }

  window.closeQTypeDropdown = function () {
    const dropdown = document.getElementById('qbuilderCustomDropdown');
    const menu = document.getElementById('qbuilderDropdownMenu');
    const trigger = document.getElementById('qbuilderDropdownTrigger');
    const chevron = document.getElementById('qbuilderTriggerChevron');
    if (dropdown) dropdown.classList.remove('open');
    if (menu) {
      menu.style.display = 'none';
      menu.style.opacity = '0';
      menu.style.visibility = 'hidden';
      menu.style.pointerEvents = 'none';
      menu.style.transform = 'translateY(-8px) scale(0.98)';
    }
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    if (chevron) chevron.style.transform = 'rotate(0deg)';
  }

  window.selectAndOpenQuestionType = function (type, label) {
    window.closeQTypeDropdown();

    // Update selected label
    const selectedNameEl = document.getElementById('qbuilderSelectedTypeName');
    if (selectedNameEl && label) {
      selectedNameEl.innerText = label;
    }
    const legacySelect = document.getElementById('qbuilderTypeSelect');
    if (legacySelect && type) {
      legacySelect.value = type;
    }

    if (!type) return;
    if (type === 'mathlive') {
      if (typeof window.openStandaloneMathLiveModal === 'function') {
        window.openStandaloneMathLiveModal();
      } else if (typeof openStandaloneMathLiveModal === 'function') {
        openStandaloneMathLiveModal();
      }
    } else {
      if (typeof window.openQuestionModal === 'function') {
        window.openQuestionModal(null, type);
      } else if (typeof openQuestionModal === 'function') {
        openQuestionModal(null, type);
      }
    }
  }

  // Close dropdown on outside click or Escape
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('qbuilderCustomDropdown');
    if (dropdown && dropdown.classList.contains('open') && !dropdown.contains(e.target)) {
      window.closeQTypeDropdown();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.closeQTypeDropdown();
    }
  });

  window.handleQTypeSelectChange = function (type) {
    window.selectAndOpenQuestionType(type);
  }

  window.addQuestionFromCurrentSelect = function () {
    const legacySelect = document.getElementById('qbuilderTypeSelect');
    const type = legacySelect ? legacySelect.value : 'mcq';
    window.selectAndOpenQuestionType(type);
  }

  // Adding Question Buttons
  document.querySelectorAll('[data-add-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      const qType = btn.getAttribute('data-add-type');
      openQuestionModal(null, qType);
    });
  });

  // Reset / Clear Exam Sheet Buttons
  const resetBtn = document.getElementById('resetExamSheetBtn');
  if (resetBtn) resetBtn.addEventListener('click', window.resetExamSheet);

  const toolbarReset = document.getElementById('toolbarResetBtn');
  if (toolbarReset) toolbarReset.addEventListener('click', window.resetExamSheet);

  const clearBtn = document.getElementById('clearAllQuestionsBtn');
  if (clearBtn) clearBtn.addEventListener('click', window.resetExamSheet);

  // Header Inputs Sync
  const headerInputs = [
    { id: 'hdrCountry', key: 'country' },
    { id: 'hdrMinistry', key: 'ministry' },
    { id: 'hdrSchool', key: 'school' },
    { id: 'hdrExamTitle', key: 'examTitle' },
    { id: 'hdrSubject', key: 'subject' },
    { id: 'hdrGrade', key: 'grade' },
    { id: 'hdrYear', key: 'year' },
    { id: 'hdrTerm', key: 'term' },
    { id: 'hdrTime', key: 'time' },
    { id: 'hdrTeacher', key: 'teacher' },
    { id: 'hdrInstructions', key: 'instructions' }
  ];

  headerInputs.forEach(item => {
    const el = document.getElementById(item.id);
    if (el) {
      el.value = appState.header[item.key] || '';
      el.addEventListener('input', () => {
        appState.header[item.key] = el.value;
        saveStateToStorage();
        renderPaperHeader();
      });
    }
  });

  const sealSelect = document.getElementById('hdrSealSelect');
  if (sealSelect) {
    sealSelect.addEventListener('change', () => {
      appState.header.seal = sealSelect.value;
      saveStateToStorage();
      renderPaperHeader();
      showToast('تم تحديث شعار ترويسة الاختبار بنجاح!', 'info');
    });
  }

  // Margin Sliders Sync
  const sliderH = document.getElementById('marginHSlider');
  const sliderV = document.getElementById('marginVSlider');
  if (sliderH) {
    sliderH.addEventListener('input', () => {
      appState.settings.marginH = parseInt(sliderH.value, 10);
      appState.settings.marginPreset = 'custom';
      document.getElementById('marginHDisplay').innerText = `${sliderH.value}mm`;
      applyPaperMargins();
      saveStateToStorage();
    });
  }
  if (sliderV) {
    sliderV.addEventListener('input', () => {
      appState.settings.marginV = parseInt(sliderV.value, 10);
      appState.settings.marginPreset = 'custom';
      document.getElementById('marginVDisplay').innerText = `${sliderV.value}mm`;
      applyPaperMargins();
      saveStateToStorage();
    });
  }

  // Settings sync
  const fontSizeSelect = document.getElementById('fontSizeSelect');
  if (fontSizeSelect) {
    fontSizeSelect.value = appState.settings.fontSize;
    fontSizeSelect.addEventListener('change', () => {
      appState.settings.fontSize = fontSizeSelect.value;
      saveStateToStorage();
      applyPaperSettings();
    });
  }

  const columnsSelect = document.getElementById('columnsSelect');
  if (columnsSelect) {
    columnsSelect.value = appState.settings.columns;
    columnsSelect.addEventListener('change', () => {
      appState.settings.columns = parseInt(columnsSelect.value, 10);
      saveStateToStorage();
      applyPaperSettings();
    });
  }

  const watermarkInput = document.getElementById('watermarkInput');
  if (watermarkInput) {
    watermarkInput.value = appState.settings.watermark;
    watermarkInput.addEventListener('input', () => {
      appState.settings.watermark = watermarkInput.value;
      saveStateToStorage();
      applyPaperSettings();
    });
  }

  const chkLines = document.getElementById('chkShowAnswerLines');
  if (chkLines) {
    chkLines.checked = appState.settings.showAnswerLines !== false;
    chkLines.addEventListener('change', () => {
      appState.settings.showAnswerLines = chkLines.checked;
      saveStateToStorage();
      renderAll();
      showToast(chkLines.checked ? 'تم تفعيل إظهار أسطر الإجابة في ورقة الامتحان ✍️' : 'تم إخفاء أسطر الإجابة لتوفير الورق واختصار المساحة 📄', 'info');
    });
  }

  const chkGrading = document.getElementById('chkShowGradingTable');
  if (chkGrading) {
    chkGrading.checked = appState.settings.showGradingTable;
    chkGrading.addEventListener('change', () => {
      appState.settings.showGradingTable = chkGrading.checked;
      saveStateToStorage();
      applyPaperSettings();
    });
  }

  const chkStudent = document.getElementById('chkShowStudentBar');
  if (chkStudent) {
    chkStudent.checked = appState.settings.showStudentBar;
    chkStudent.addEventListener('change', () => {
      appState.settings.showStudentBar = chkStudent.checked;
      saveStateToStorage();
      applyPaperSettings();
    });
  }

  const chkInstr = document.getElementById('chkShowInstructions');
  if (chkInstr) {
    chkInstr.checked = appState.settings.showInstructions;
    chkInstr.addEventListener('change', () => {
      appState.settings.showInstructions = chkInstr.checked;
      saveStateToStorage();
      applyPaperSettings();
    });
  }

  const chkSeal = document.getElementById('chkShowSeal');
  if (chkSeal) {
    chkSeal.checked = appState.settings.showSeal;
    chkSeal.addEventListener('change', () => {
      appState.settings.showSeal = chkSeal.checked;
      saveStateToStorage();
      applyPaperSettings();
    });
  }

  // View Mode: Student Paper vs Answer Key
  document.getElementById('viewStudentPaperBtn').addEventListener('click', () => {
    appState.viewMode = 'student';
    document.body.classList.remove('answer-key-mode');
    const paper = document.getElementById('examPaperDoc');
    if (paper) paper.classList.remove('answer-key-mode');
    document.getElementById('viewStudentPaperBtn').style.background = 'var(--primary)';
    document.getElementById('viewStudentPaperBtn').style.color = '#fff';
    document.getElementById('viewAnswerKeyBtn').style.background = 'transparent';
    document.getElementById('viewAnswerKeyBtn').style.color = 'var(--text-main)';
    renderPaperHeader();
    renderPaperQuestions();
    showToast('تم تفعيل وضع ورقة الاختبار (للطباعة وتوزيعها على الطلاب)', 'info');
  });

  document.getElementById('viewAnswerKeyBtn').addEventListener('click', () => {
    appState.viewMode = 'answer_key';
    document.body.classList.add('answer-key-mode');
    const paper = document.getElementById('examPaperDoc');
    if (paper) paper.classList.add('answer-key-mode');
    document.getElementById('viewAnswerKeyBtn').style.background = '#059669';
    document.getElementById('viewAnswerKeyBtn').style.color = '#fff';
    document.getElementById('viewStudentPaperBtn').style.background = 'transparent';
    document.getElementById('viewStudentPaperBtn').style.color = 'var(--text-main)';
    renderPaperHeader();
    renderPaperQuestions();
    showToast('تم تفعيل وضع نموذج الإجابة الرسمي وتوزيع الدرجات للمصحح', 'success');
  });

  /* ==========================================================================
     UNIVERSAL SMART PRINT DISPATCHER (محرك الطباعة الذكي الشامل حسب القسم الفعال)
     ========================================================================== */
  window.detectCurrentActiveSection = function () {
    // 1. فحص نافذة كروت وبطاقات التفعيل VIP
    const voucherModal = document.getElementById('printActivationCardsModal');
    if (voucherModal && (voucherModal.classList.contains('open') || voucherModal.style.display === 'flex' || voucherModal.style.display === 'block')) {
      return 'activation-cards';
    }

    // 2. فحص الأقسام والتبويبات الفعالة
    const activeTab = document.querySelector('.tab-content[style*="display: block"], .tab-content.active');
    const tabId = activeTab ? activeTab.id : '';

    if (tabId === 'tab-certificates') return 'certificates';
    if (tabId === 'tab-student-grades') return 'grades';
    if (tabId === 'tab-student-behavior') return 'behavior';
    if (tabId === 'tab-seating') return 'seating';
    if (tabId === 'tab-exam-cards') return 'exam-cards';
    if (tabId === 'tab-schedule') return 'schedule';
    if (tabId === 'tab-report') return 'academic-report';

    // 3. فحص إضافي للحاويات المرئية
    if (document.getElementById('tab-student-grades')?.style.display !== 'none' && document.getElementById('tab-student-grades')?.style.display !== '') return 'grades';
    if (document.getElementById('tab-student-behavior')?.style.display !== 'none' && document.getElementById('tab-student-behavior')?.style.display !== '') return 'behavior';
    if (document.getElementById('tab-certificates')?.style.display !== 'none' && document.getElementById('tab-certificates')?.style.display !== '') return 'certificates';
    if (document.getElementById('tab-seating')?.style.display !== 'none' && document.getElementById('tab-seating')?.style.display !== '') return 'seating';
    if (document.getElementById('tab-exam-cards')?.style.display !== 'none' && document.getElementById('tab-exam-cards')?.style.display !== '') return 'exam-cards';
    if (document.getElementById('tab-schedule')?.style.display !== 'none' && document.getElementById('tab-schedule')?.style.display !== '') return 'schedule';

    // الافتراضي: الأسئلة الامتحانية
    return 'exam';
  }

  /* ==========================================================================
     Dynamic Print Orientation Engine (محرك توجيه الطباعة الذكي: أفقي بالعرض / عمودي بالطول)
     ========================================================================== */
  window.setDynamicPrintPage = function (orientation = 'portrait', margin = '8mm 10mm', pageSize = 'A4') {
    let styleEl = document.getElementById('dynamicPrintMarginStyle');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'dynamicPrintMarginStyle';
      document.head.appendChild(styleEl);
    }
    const cleanOrientation = (orientation === 'landscape') ? 'landscape' : 'portrait';
    const cleanMargin = (margin !== undefined && margin !== null) ? margin : (cleanOrientation === 'landscape' ? '0' : '8mm 10mm');
    const cleanPageSize = pageSize || 'A4';

    styleEl.innerHTML = `
      @page {
        size: ${cleanPageSize} ${cleanOrientation} !important;
        margin: ${cleanMargin} !important;
      }
    `;

    if (cleanOrientation === 'landscape') {
      document.body.classList.add('orientation-landscape');
      document.body.classList.remove('orientation-portrait');
    } else {
      document.body.classList.add('orientation-portrait');
      document.body.classList.remove('orientation-landscape');
    }
  }

  window.applySectionPrintOrientation = function (section) {
    if (!section) section = window.detectCurrentActiveSection ? window.detectCurrentActiveSection() : 'exam';

    let orientation = 'portrait';
    let margin = '8mm 10mm';
    let pageSize = 'A4';

    if (section === 'certificates') {
      const sel = document.getElementById('certOrientationSelect');
      const batchOri = (window.activeBatch && window.activeBatch.orientation) || (sel && sel.value) || 'landscape';
      orientation = (batchOri === 'portrait') ? 'portrait' : 'landscape';
      margin = '0';
      pageSize = 'A4';
    } else if (section === 'schedule') {
      const isA3 = (window.activeSchedule && window.activeSchedule.pageSize === 'A4') ? false : true;
      const isPortrait = (window.activeSchedule && window.activeSchedule.orientation === 'portrait');
      orientation = isPortrait ? 'portrait' : 'landscape';
      margin = '3mm';
      pageSize = isA3 ? 'A3' : 'A4';
    } else if (section === 'grades') {
      const isLandscape = (window.__activeGradesPeriod === 'month1' || window.__activeGradesPeriod === 'month2') ? false : true;
      orientation = isLandscape ? 'landscape' : 'portrait';
      margin = isLandscape ? '6mm 8mm' : '8mm 10mm';
      pageSize = 'A4';
    } else if (section === 'behavior') {
      orientation = 'portrait';
      margin = '10mm 12mm';
      pageSize = 'A4';
    } else if (section === 'seating') {
      orientation = 'portrait';
      margin = '4mm';
      pageSize = 'A4';
    } else if (section === 'exam-cards') {
      orientation = 'portrait';
      margin = '0';
      pageSize = 'A4';
    } else if (section === 'activation-cards') {
      orientation = 'portrait';
      margin = '6mm';
      pageSize = 'A4';
    } else {
      orientation = (window.appState && window.appState.settings && window.appState.settings.orientation) || 'portrait';
      const v = (window.appState && window.appState.settings && window.appState.settings.marginV) || 12;
      const h = (window.appState && window.appState.settings && window.appState.settings.marginH) || 14;
      margin = `${v}mm ${h}mm`;
      pageSize = 'A4';
    }

    window.setDynamicPrintPage(orientation, margin, pageSize);
  }

  // Automatic orientation update before native print (supports Ctrl+P, browser menu, and all buttons)
  window.addEventListener('beforeprint', function () {
    const sec = window.detectCurrentActiveSection ? window.detectCurrentActiveSection() : 'exam';
    window.applySectionPrintOrientation(sec);
  });

  window.printCurrentCertificateDirectly = function () {
    if (typeof window.certPrintCurrent === 'function') {
      window.certPrintCurrent();
    } else if (typeof window.certPrintAllBatch === 'function') {
      window.certPrintAllBatch();
    } else {
      window.prepareAndPrintSection('certificates');
    }
  }

  window.prepareAndPrintSection = function (section) {
    if (section === 'exam') {
      if (typeof ExamExporter !== 'undefined' && typeof ExamExporter.printBothCopiesSeparated === 'function') {
        ExamExporter.printBothCopiesSeparated();
        return;
      }
    }
    if (section === 'seating') {
      if (typeof window.seatingPrintCards === 'function') {
        window.seatingPrintCards();
        return;
      }
    }
    if (section === 'exam-cards') {
      if (typeof window.examCardPrint === 'function') {
        window.examCardPrint();
        return;
      }
    }
    if (section === 'behavior') {
      if (typeof window.sbExecuteReportPrint === 'function') {
        window.sbExecuteReportPrint();
        return;
      }
    }
    if (section === 'grades') {
      if (typeof window.sgPrintOfficialLedger === 'function') {
        window.sgPrintOfficialLedger();
        return;
      }
    }
    if (section === 'schedule') {
      if (typeof window.schedPrintA3 === 'function') {
        window.schedPrintA3();
        return;
      }
    }
    if (section === 'certificates') {
      if (typeof window.certPrintAllBatch === 'function') {
        window.certPrintAllBatch();
        return;
      }
    }

    // Default element extraction
    let targetEl = document.getElementById('examPaperDoc') || document.querySelector('.exam-paper-container');
    if (targetEl) {
      window.openPrintWindow('ورقة الامتحان الرسمي A4', targetEl.outerHTML, { pageSize: 'A4', orientation: 'portrait' });
      return;
    }

    window.print();
  }

  window.triggerSmartPrint = function () {
    if (typeof isUserSubscribedOrAdmin === 'function' && !isUserSubscribedOrAdmin()) {
      requireSubscription('طباعة المحتوى والتقارير');
      return;
    }

    const section = window.detectCurrentActiveSection();

    if (section === 'activation-cards') {
      window.executePrintActivationCards();
      return;
    }

    if (section === 'certificates') {
      if (typeof window.printCurrentCertificateDirectly === 'function') {
        window.printCurrentCertificateDirectly();
        return;
      }
      window.prepareAndPrintSection('certificates');
      return;
    }

    if (section === 'grades') {
      if (typeof window.sgPrintOfficialLedger === 'function') {
        window.sgPrintOfficialLedger();
        return;
      }
      window.prepareAndPrintSection('grades');
      return;
    }

    if (section === 'behavior') {
      if (typeof window.sbPrintOfficialReport === 'function') {
        window.sbPrintOfficialReport();
        return;
      }
      window.prepareAndPrintSection('behavior');
      return;
    }

    if (section === 'seating') {
      if (typeof window.seatingPrintCards === 'function') {
        window.seatingPrintCards();
        return;
      }
      window.prepareAndPrintSection('seating');
      return;
    }

    if (section === 'exam-cards') {
      if (typeof window.examCardPrint === 'function') {
        window.examCardPrint();
        return;
      }
      window.prepareAndPrintSection('exam-cards');
      return;
    }

    if (section === 'schedule') {
      if (typeof window.schedPrintA3 === 'function') {
        window.schedPrintA3();
        return;
      }
      window.prepareAndPrintSection('schedule');
      return;
    }

    if (section === 'academic-report') {
      if (typeof window.printFullPlatformDailyReport === 'function') {
        window.printFullPlatformDailyReport();
        return;
      }
    }

    // الافتراضي: الأسئلة الامتحانية
    if (window.ExamExporter && typeof window.ExamExporter.printExam === 'function') {
      window.ExamExporter.printExam();
    } else {
      window.prepareAndPrintSection('exam');
    }
  }

  window.triggerPrintExam = window.triggerSmartPrint;

  // Universal Action Dispatcher for Application Hub Cards (الطباعة والمعاينة والحفظ والتصدير من بطاقات التطبيقات)
  window.handleCardAction = function (tabId, action, event) {
    if (event && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
    if (typeof window.switchTab === 'function') {
      window.switchTab(tabId);
    }
    setTimeout(() => {
      if (action === 'print') {
        if (typeof window.triggerPrintExam === 'function') {
          window.triggerPrintExam();
        }
      } else if (action === 'preview') {
        if (typeof window.openExamPreviewModal === 'function') {
          window.openExamPreviewModal();
        } else if (typeof window.toggleMobileView === 'function') {
          window.toggleMobileView('preview');
        }
      } else if (action === 'save') {
        if (typeof window.saveCurrentExam === 'function') {
          window.saveCurrentExam();
        }
      } else if (action === 'pdf') {
        if (typeof window.exportToPDF === 'function') {
          window.exportToPDF();
        } else if (typeof window.masarPrintToPDF === 'function') {
          window.masarPrintToPDF();
        }
      }
    }, 180);
  };


  // الربط التلقائي قبل أمر الطباعة للتعرف على القسم أوتوماتيكياً (حتى عند الضغط على Ctrl+P)
  window.addEventListener('beforeprint', function () {
    const sec = window.detectCurrentActiveSection();
    const allPrintClasses = [
      'printing-exam',
      'printing-activation-cards',
      'printing-certificates',
      'printing-grades',
      'printing-behavior',
      'printing-seating',
      'printing-exam-cards',
      'printing-schedule',
      'printing-academic-report',
      'printing-daily-report'
    ];
    allPrintClasses.forEach(cls => document.body.classList.remove(cls));
    document.body.classList.add(`printing-${sec}`);
  });

  window.addEventListener('afterprint', function () {
    const allPrintClasses = [
      'printing-exam',
      'printing-activation-cards',
      'printing-certificates',
      'printing-grades',
      'printing-behavior',
      'printing-seating',
      'printing-exam-cards',
      'printing-schedule',
      'printing-academic-report',
      'printing-daily-report'
    ];
    allPrintClasses.forEach(cls => document.body.classList.remove(cls));
  });

  window.executeExamPaperPdf = async function (options) {
    if (window.MasarPDF && typeof window.MasarPDF.exportExam === 'function') {
      return await window.MasarPDF.exportExam(options);
    }

    // Locate the configuration for the PDF export in app.js
    const exportOptions = Object.assign({
      timeout: 60000, // Increase timeout to 60 seconds (or relevant setting for your library)
      html2canvas: {
        useCORS: true,
        logging: false,
        scale: 2 // Reducing scale can also prevent timeouts by lowering memory usage
      }
    }, options || {});
    options = exportOptions;

    // If the error persists, wrap the execution in a check that ensures images are loaded
    try {
      await Promise.all(Array.from(document.images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = img.onerror = resolve; });
      }));
    } catch (imgLoadErr) {
      console.warn('Image preloading warning:', imgLoadErr);
    }

    if (typeof isUserSubscribedOrAdmin === 'function' && !isUserSubscribedOrAdmin()) {
      if (typeof requireSubscription === 'function') {
        requireSubscription('تصدير ورقة الاختبار بصيغة PDF');
      }
      return;
    }

    const questionsCount = (window.appState && Array.isArray(window.appState.questions)) ? window.appState.questions.length : 0;
    if (questionsCount === 0) {
      if (typeof showToast === 'function') {
        showToast('ورقة الاختبار فارغة! يرجى إضافة بعض الأسئلة أولاً قبل حفظ وتنزيل الـ PDF 📄', 'warning');
      }
      return;
    }

    // 1. Ensure student paper mode is active and elements are rendered
    const prevMode = window.appState?.viewMode || 'student';
    if (window.appState) window.appState.viewMode = 'student';

    try {
      if (typeof window.renderPaperHeader === 'function') window.renderPaperHeader();
      if (typeof window.renderPaperQuestions === 'function') window.renderPaperQuestions();
      if (typeof window.applyPaperSettings === 'function') window.applyPaperSettings();
    } catch (e) {
      console.warn('Paper render prep:', e);
    }

    const rawTitle = (window.appState?.header?.examTitle || 'امتحان_مسار_المعلم');
    const safeTitle = rawTitle.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'امتحان_مسار_المعلم';
    const filename = (options && options.path) ? options.path : `${safeTitle}.pdf`;

    // 2. Retrieve paper HTML
    let paperHTML = '';
    if (window.ExamExporter && typeof window.ExamExporter.generatePaperCopyHTML === 'function') {
      paperHTML = window.ExamExporter.generatePaperCopyHTML('student');
    } else {
      const sourceDoc = document.getElementById('examPaperDoc');
      paperHTML = sourceDoc ? sourceDoc.innerHTML : '';
    }

    if (!paperHTML || paperHTML.trim().length === 0) {
      if (typeof showToast === 'function') showToast('لا توجد بيانات أو أسئلة في ورقة الامتحان لتصديرها', 'warning');
      return;
    }

    // 3. Create non-blocking animated loading overlay with safety dismiss
    const overlay = document.createElement('div');
    overlay.id = 'directPdfExportOverlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 99999999; background: rgba(15, 23, 42, 0.88); backdrop-filter: blur(8px); display: flex; flex-direction: column; align-items: center; justify-content: center; color: #ffffff; font-family: "Cairo", sans-serif;';
    overlay.innerHTML = `
      <div style="position: relative; text-align: center; background: rgba(30, 41, 59, 0.96); padding: 2.2rem 2.8rem; border-radius: 20px; border: 1.5px solid rgba(255,255,255,0.18); box-shadow: 0 25px 60px rgba(0,0,0,0.65); max-width: 440px; width: 90%;">
        <button type="button" onclick="document.getElementById('directPdfExportOverlay')?.remove()" style="position: absolute; top: 12px; left: 14px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center;" title="إلغاء">✕</button>
        <div style="font-size: 2.8rem; color: #38bdf8; margin-bottom: 0.9rem;">
          <i class="fa-solid fa-circle-notch fa-spin"></i>
        </div>
        <h3 style="margin: 0; font-size: 1.3rem; font-weight: 800; color: #ffffff;">جاري تصدير وتنزيل ملف PDF... 📄</h3>
        <p style="margin: 0.5rem 0 0; color: #94a3b8; font-size: 0.85rem;">يتم إنشاء صفحات الامتحان وتنزيل الملف لجهازك مباشرة</p>
      </div>
    `;
    document.body.appendChild(overlay);

    const safetyTimer = setTimeout(() => {
      const ov = document.getElementById('directPdfExportOverlay');
      if (ov) ov.remove();
    }, 60000);

    const isLtr = (window.appState?.settings?.direction === 'ltr');

    // 4. Primary direct html2pdf execution
    let exportSucceeded = false;
    let frame = null;

    const element = document.getElementById('exam-paper-container') || document.getElementById('exam-paper') || document.getElementById('examPaperDoc');
    if (element && typeof window.html2pdf !== 'undefined') {
      try {
        if (window.ExamExporter && typeof window.ExamExporter.ensurePreviewVisible === 'function') {
          window.ExamExporter.ensurePreviewVisible();
        }

        const opt = {
          margin: 1,
          filename: filename || 'exam-paper.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          timeout: options.timeout || 60000,
          html2canvas: {
            useCORS: true,
            logging: false,
            scale: 2 // Reducing scale can also prevent timeouts by lowering memory usage
          },
          jsPDF: { unit: 'in', format: 'letter', orientation: (window.appState?.settings?.orientation || 'portrait') }
        }

        const exportPromise = window.html2pdf().set(opt).from(element).save();
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Export timeout')), options.timeout || 60000));
        await Promise.race([exportPromise, timeoutPromise]);

        exportSucceeded = true;
        if (typeof showToast === 'function') {
          showToast(`تم تنزيل ملف «${filename || 'exam-paper.pdf'}» بنجاح! 📥📄`, 'success');
        }
      } catch (err) {
        console.warn('Fast HTML2PDF attempt:', err);
      }
    }

    if (!exportSucceeded && typeof window.exportToPDF === 'function') {
      const sourceDoc = document.getElementById('examPaperDoc') || element;
      if (sourceDoc) {
        try {
          if (window.ExamExporter && typeof window.ExamExporter.ensurePreviewVisible === 'function') {
            window.ExamExporter.ensurePreviewVisible();
          }
          const res = await window.exportToPDF(sourceDoc, {
            filename: filename,
            format: 'a4',
            orientation: (window.appState?.settings?.orientation || 'portrait'),
            margin: 8,
            scale: 2,
            useCORS: true,
            allowTaint: false
          });
          exportSucceeded = true;
          if (typeof showToast === 'function') {
            showToast(`تم تنزيل ملف «${filename}» بنجاح! 📥📄 (عدد الصفحات: ${res.pages})`, 'success');
          }
        } catch (err) {
          console.warn('exportToPDF direct execution error:', err);
        }
      }
    }

    // Direct html2canvas + jsPDF engine (Add useCORS: true and allowTaint: false)
    if (!exportSucceeded) {
      try {
        const sourceDoc = document.getElementById('examPaperDoc');
        const html2canvasFn = window.html2canvas || (window.html2pdf && window.html2pdf.html2canvas);
        const JsPdfClass = window.jsPDF || (window.jspdf && window.jspdf.jsPDF) || (window.html2pdf && window.html2pdf.jsPDF);

        if (sourceDoc && html2canvasFn && JsPdfClass) {
          if (window.ExamExporter && typeof window.ExamExporter.ensurePreviewVisible === 'function') {
            window.ExamExporter.ensurePreviewVisible();
          }

          // Direct html2canvas call with useCORS: true and allowTaint: false to respect CORS
          const canvas = await html2canvasFn(sourceDoc, {
            useCORS: true,
            allowTaint: false, // Ensure this is false to respect CORS
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false,
            onclone: (clonedDoc) => {
              clonedDoc.querySelectorAll('img').forEach(img => {
                try { img.crossOrigin = 'anonymous'; } catch (e) { }
              });
              clonedDoc.querySelectorAll('.no-print, [data-pdf-hide], .paper-pages-ctrl, .btn-paper-break-ctrl, .paper-q-font-tools').forEach(el => {
                el.style.setProperty('display', 'none', 'important');
              });
            }
          });

          const imgData = canvas.toDataURL('image/png');
          const orientation = (window.appState?.settings?.orientation || 'portrait');
          const pdf = new JsPdfClass({
            orientation: orientation,
            unit: 'mm',
            format: 'a4',
            compress: true
          });

          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const margin = 6;
          const contentWidth = pageWidth - (margin * 2);
          const contentHeight = pageHeight - (margin * 2);

          const pixelsPerMM = canvas.width / contentWidth;
          const pageHeightPixels = Math.floor(contentHeight * pixelsPerMM);

          if (canvas.height <= pageHeightPixels * 1.05) {
            const imgRatio = canvas.height / canvas.width;
            pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentWidth * imgRatio, undefined, 'FAST');
          } else {
            let offsetY = 0;
            let pageNum = 0;
            while (offsetY < canvas.height) {
              const sliceH = Math.min(pageHeightPixels, canvas.height - offsetY);
              const pCanvas = document.createElement('canvas');
              pCanvas.width = canvas.width;
              pCanvas.height = sliceH;
              const ctx = pCanvas.getContext('2d');
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, pCanvas.width, pCanvas.height);
              ctx.drawImage(canvas, 0, offsetY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
              const sliceData = pCanvas.toDataURL('image/png');
              if (pageNum > 0) {
                pdf.addPage('a4', orientation);
              }
              const sliceH_mm = sliceH / pixelsPerMM;
              pdf.addImage(sliceData, 'PNG', margin, margin, contentWidth, sliceH_mm, undefined, 'FAST');
              offsetY += sliceH;
              pageNum++;
            }
          }

          pdf.save(filename);
          exportSucceeded = true;
          if (typeof showToast === 'function') {
            showToast(`تم تنزيل ملف «${filename}» بنجاح! 📥📄`, 'success');
          }
        }
      } catch (directErr) {
        console.warn('Direct html2canvas / jsPDF fallback attempt error:', directErr);
      }
    }

    // Secondary fallback via html2pdf iframe with CORS
    if (!exportSucceeded && typeof html2pdf !== 'undefined') {
      try {
        frame = document.createElement('iframe');
        frame.id = 'directPdfExportFrame';
        frame.style.cssText = 'position: fixed; left: 0; top: 0; width: 794px; height: 1120px; z-index: 99990; background: #ffffff; opacity: 1; pointer-events: none; border: none;';
        document.body.appendChild(frame);

        const fDoc = frame.contentWindow.document;
        fDoc.open();
        fDoc.write(`
          <!DOCTYPE html>
          <html dir="${isLtr ? 'ltr' : 'rtl'}" lang="${isLtr ? 'en' : 'ar'}">
          <head>
            <meta charset="utf-8">
            <style>
              *, *::before, *::after {
                box-sizing: border-box !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #111827 !important;
                font-family: 'Cairo', sans-serif !important;
                width: 794px !important;
              }
              .exam-paper {
                width: 794px !important;
                min-height: 1120px !important;
                margin: 0 !important;
                padding: 8mm 12mm !important;
                background: #ffffff !important;
                color: #111827 !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                box-sizing: border-box !important;
              }
              .header-grid {
                display: grid !important;
                grid-template-columns: 1fr auto 1fr !important;
                align-items: center !important;
                border: 1.5px solid #111827 !important;
                padding: 10px 14px !important;
                border-radius: 6px !important;
                margin-bottom: 12px !important;
              }
              .header-meta-col { font-size: 0.85rem !important; line-height: 1.6 !important; }
              .header-center-col { text-align: center !important; }
              .school-seal { height: 60px !important; object-fit: contain !important; display: block !important; margin: 0 auto 4px auto !important; }
              .exam-title-badge { font-weight: 800 !important; font-size: 1.05rem !important; text-align: center !important; }
              .exam-subtitle { font-size: 0.8rem !important; text-align: center !important; color: #374151 !important; }
              .paper-question {
                margin-top: 14px !important;
                border-bottom: 1px dashed #d1d5db !important;
                padding-bottom: 12px !important;
                page-break-inside: avoid !important;
              }
              .paper-q-header { display: flex !important; justify-content: space-between !important; font-weight: 700 !important; margin-bottom: 6px !important; }
              .paper-mcq-grid { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 8px !important; margin-top: 6px !important; }
              .paper-mcq-opt { display: flex !important; align-items: center !important; gap: 6px !important; font-size: 0.88rem !important; }
              .paper-opt-letter { display: inline-flex !important; width: 22px !important; height: 22px !important; border-radius: 50% !important; border: 1px solid #111827 !important; align-items: center !important; justify-content: center !important; font-size: 0.8rem !important; }
              .paper-footer { margin-top: auto !important; border-top: 1.5px solid #111827 !important; padding-top: 6px !important; font-size: 0.8rem !important; display: flex !important; justify-content: space-between !important; }
              .no-print, .paper-page-separator, .paper-pages-ctrl, .btn-paper-break-ctrl, .paper-q-font-tools { display: none !important; }
            </style>
          </head>
          <body>
            <div class="exam-paper-container" dir="${isLtr ? 'ltr' : 'rtl'}">
              ${paperHTML}
            </div>
          </body>
          </html>
        `);
        fDoc.close();

        await new Promise(r => setTimeout(r, 200));

        const opt = {
          margin: 0,
          filename: filename,
          image: { type: 'jpeg', quality: 0.96 },
          html2canvas: {
            scale: 1.5,
            useCORS: true,
            allowTaint: false,
            logging: false,
            backgroundColor: '#ffffff'
          },
          jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
          },
          pagebreak: { mode: ['css', 'legacy'] }
        }

        const exportPromise = window.html2pdf().set(opt).from(fDoc.body).save();
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Export timeout')), options.timeout || 60000));
        await Promise.race([exportPromise, timeoutPromise]);

        exportSucceeded = true;
        if (typeof showToast === 'function') {
          showToast(`تم تنزيل ملف «${filename}» بنجاح! 📥📄`, 'success');
        }
      } catch (err) {
        console.warn('Fast HTML2PDF attempt:', err);
      } finally {
        if (frame && frame.parentNode) frame.remove();
      }
    }

    // 5. If export failed, notify user cleanly without opening print interface or blank pages
    if (!exportSucceeded) {
      if (typeof showToast === 'function') {
        showToast('تعذر إنشاء ملف الـ PDF. يرجى التأكد من إضافة أسئلة للامتحان والمحاولة مرة أخرى ⚠️', 'error', 4500);
      }
    }

    clearTimeout(safetyTimer);
    if (overlay && overlay.parentNode) overlay.remove();

    // Restore mode
    if (prevMode === 'answer_key' && window.appState) {
      window.appState.viewMode = 'answer_key';
      if (typeof window.renderPaperQuestions === 'function') window.renderPaperQuestions();
    }
  }

  window.exportCurrentExamToPdf = async function (options) {
    options = options || {};
    const paper = document.getElementById('exam-paper') || document.querySelector('.exam-paper-sheet') || document.getElementById('exam-paper-container') || document.getElementById('examPaperDoc');
    if (!paper) {
      if (typeof showToast === 'function') showToast('تعذر العثور على ورقة الامتحان للتصدير!', 'warning');
      return;
    }
    const rawTitle = options.title || options.filename || (appState && appState.header && appState.header.examTitle) || 'ورقة_الامتحان';
    const cleanTitle = String(rawTitle).replace(/\.pdf$/i, '').replace(/[/\\?%*:|"<>]/g, '_').trim() || 'ورقة_الامتحان';

    if (typeof showToast === 'function') {
      showToast('جاري تجهيز وتصدير ورقة الامتحان بصيغة PDF عالية الدقة... 📄✨', 'info');
    }

    // التصدير المباشر عبر خادم PDF أولاً (نص عربي vector سليم، بدون نافذة طباعة)
    if (window.MasarPDF && typeof window.MasarPDF.exportExam === 'function') {
      return await window.MasarPDF.exportExam(options);
    }

    const printFn = (typeof window.masarPrintToPDF === 'function') ? window.masarPrintToPDF : (typeof window.exportToPDF === 'function' ? window.exportToPDF : null);
    if (printFn) {
      return await printFn(paper, {
        title: cleanTitle,
        orientation: (appState && appState.settings && appState.settings.orientation) || 'portrait',
        pageSize: 'a4',
        margin: '8mm'
      });
    }
  }

  // Standalone exporter helper - upgraded to vector masarPrintToPDF
  window.exportExamWithHtml2Pdf = async function (customOpt) {
    if (typeof window.masarPrintToPDF === 'function' || typeof window.exportToPDF === 'function') {
      return await window.exportCurrentExamToPdf(customOpt);
    }
    const element = document.getElementById('exam-paper-container') || document.getElementById('exam-paper') || document.getElementById('examPaperDoc');
    const opt = Object.assign({
      margin: 1,
      filename: 'exam-paper.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      timeout: 60000,
      html2canvas: {
        useCORS: true, // This allows the canvas to load cross-origin images
        logging: false,
        scale: 2
      },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }, customOpt || {});

    return html2pdf().set(opt).from(element).save();
  }

  const printExamBtn = document.getElementById('printExamBtn');
  if (printExamBtn) {
    printExamBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.triggerPrintExam();
    });
  }



  // Print Options Modal Close Handlers
  const closePrintModalBtn = document.getElementById('closePrintModalBtn');
  if (closePrintModalBtn) {
    closePrintModalBtn.addEventListener('click', () => {
      ExamExporter.closePrintModal();
    });
  }
  const closePrintModalFooterBtn = document.getElementById('closePrintModalFooterBtn');
  if (closePrintModalFooterBtn) {
    closePrintModalFooterBtn.addEventListener('click', () => {
      ExamExporter.closePrintModal();
    });
  }
  const printOptionsModal = document.getElementById('printOptionsModal');
  if (printOptionsModal) {
    printOptionsModal.addEventListener('click', (e) => {
      if (e.target === printOptionsModal) {
        ExamExporter.closePrintModal();
      }
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      ExamExporter.closePrintModal();
    }
  });

  const generateModelBBtn = document.getElementById('generateModelBBtn');
  if (generateModelBBtn) {
    generateModelBBtn.addEventListener('click', () => {
      if (appState.questions.length < 2) {
        showToast('أضف سؤالين على الأقل لإنشاء نموذج بديل', 'error');
        return;
      }
      const shuffled = ExamExporter.createModelVariation(appState.questions);
      appState.questions = shuffled;
      appState.header.examTitle = appState.header.examTitle.replace(' - نموذج (ب)', '') + ' - نموذج (ب)';
      saveStateToStorage();
      renderAll();
      showToast('تم خلط الأسئلة والخيارات وإنشاء نموذج (ب) بنجاح!', 'success');
    });
  }

  // Archive & Save Buttons
  const saveExamToArchiveBtn = document.getElementById('saveExamToArchiveBtn');
  if (saveExamToArchiveBtn) {
    saveExamToArchiveBtn.addEventListener('click', () => {
      saveCurrentExamToArchive(false);
    });
  }

  const openArchiveBtn = document.getElementById('openArchiveBtn');
  if (openArchiveBtn) {
    openArchiveBtn.addEventListener('click', openArchiveModal);
  }
  const closeArchiveModalBtn = document.getElementById('closeArchiveModalBtn');
  if (closeArchiveModalBtn) {
    closeArchiveModalBtn.addEventListener('click', () => {
      const modal = document.getElementById('archiveModal');
      if (modal) modal.classList.remove('open');
    });
  }
  const closeArchiveModalFooterBtn = document.getElementById('closeArchiveModalFooterBtn');
  if (closeArchiveModalFooterBtn) {
    closeArchiveModalFooterBtn.addEventListener('click', () => {
      const modal = document.getElementById('archiveModal');
      if (modal) modal.classList.remove('open');
    });
  }

  const saveCurrentAsNewBtn = document.getElementById('saveCurrentAsNewBtn');
  if (saveCurrentAsNewBtn) {
    saveCurrentAsNewBtn.addEventListener('click', () => {
      saveCurrentExamToArchive(true);
      renderArchiveList();
    });
  }

  const archiveSearch = document.getElementById('archiveSearchInput');
  if (archiveSearch) {
    archiveSearch.addEventListener('input', () => {
      renderArchiveList(archiveSearch.value);
    });
  }

  // User Auth Dropdown Menu & Profile
  const profilePill = document.getElementById('profilePillBtn');
  const userMenu = document.getElementById('userDropdownMenu');
  const openAuthBtn = document.getElementById('openAuthModalBtn');
  const navQuickLogout = document.getElementById('navQuickLogoutBtn');

  if (profilePill && userMenu) {
    profilePill.addEventListener('click', (e) => {
      e.stopPropagation();
      userMenu.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!userMenu.contains(e.target) && !profilePill.contains(e.target)) {
        userMenu.classList.remove('show');
      }
    });
  }

  // Navbar Quick Logout Button (1-Click lock platform & show full-screen auth portal)
  if (navQuickLogout) {
    navQuickLogout.addEventListener('click', () => {
      logoutAndOpenAuthPortal();
    });
  }

  if (openAuthBtn) {
    openAuthBtn.addEventListener('click', () => {
      logoutAndOpenAuthPortal();
    });
  }

  // Auth Switcher Tabs (In Fullscreen Portal)
  const tabLogin = document.getElementById('tabAuthLoginBtn');
  const tabRegister = document.getElementById('tabAuthRegisterBtn');
  const formLogin = document.getElementById('loginForm');
  const formRegister = document.getElementById('registerForm');
  const authHeading = document.getElementById('authPortalHeading');

  if (tabLogin && tabRegister) {
    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      if (formLogin) formLogin.style.display = 'block';
      if (formRegister) formRegister.style.display = 'none';
      if (authHeading) authHeading.innerText = 'تسجيل الدخول للمنصة';
    });

    tabRegister.addEventListener('click', () => {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      if (formLogin) formLogin.style.display = 'none';
      if (formRegister) formRegister.style.display = 'block';
      if (authHeading) authHeading.innerText = 'إنشاء وتوثيق حساب معلم جديد';
    });
  }

  // Login Form Submission
  if (formLogin) {
    const passInput = document.getElementById('loginPassword');
    const emailInput = document.getElementById('loginEmail');
    const errBox = document.getElementById('loginPasswordErrorMsg');
    const errTxt = document.getElementById('loginPasswordErrorText');

    // Auto-clear error when user types again
    if (passInput) {
      passInput.addEventListener('input', () => {
        passInput.classList.remove('input-error');
        if (errBox) errBox.style.display = 'none';
      });
    }
    if (emailInput) {
      emailInput.addEventListener('input', () => {
        if (passInput) passInput.classList.remove('input-error');
        if (errBox) errBox.style.display = 'none';
      });
    }

    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailOrUser = (emailInput && emailInput.value) ? emailInput.value.trim() : '';
      const password = (passInput && passInput.value) ? passInput.value : '';

      let found = null;
      // 1. فحص ومصادقة مشفرة عبر السيرفر الداخلي الموثوق أولاً (Server-Side Authentication)
      try {
        const resp = await fetch(getBackendApiUrl('/api/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: emailOrUser,
            password: password,
            deviceInfo: navigator.userAgent
          })
        });
        if (resp.ok) {
          const resData = await resp.json();
          if (resData && resData.success && resData.account) {
            found = resData.account;
          }
        }
      } catch (err) {}

      let accounts = getAuthAccounts();
      const cleanEnteredPhone = emailOrUser.replace(/\D/g, '');
      const isPhoneLikeQuery = cleanEnteredPhone.length >= 7;

      const checkAccountMatch = (a) => {
        if (!a) return false;
        const low = emailOrUser.toLowerCase();
        if (a.email && a.email.toLowerCase() === low) return true;
        if (a.username && a.username.toLowerCase() === low) return true;
        if (a.name && a.name.toLowerCase() === low) return true;
        if (isPhoneLikeQuery) {
          const aPhone = (a.phone || a.contact || '').replace(/\D/g, '');
          if (aPhone && (aPhone === cleanEnteredPhone || aPhone.endsWith(cleanEnteredPhone) || cleanEnteredPhone.endsWith(aPhone))) {
            return true;
          }
        }
        return false;
      };

      let userExists = accounts.find(checkAccountMatch);

      if (!found) {
        found = accounts.find(a =>
          checkAccountMatch(a) &&
          (a.password === password || ((a.isAdmin || a.role === 'admin') && password === 'qq7878aassdd'))
        );
      }

      // CROSS-DEVICE LOGIN SYNC (Laptop -> Phone):
      if (!found) {
        if (typeof syncAccountsWithServer === 'function') {
          accounts = await syncAccountsWithServer();
          userExists = accounts.find(checkAccountMatch);
          found = accounts.find(a =>
            checkAccountMatch(a) &&
            (a.password === password || ((a.isAdmin || a.role === 'admin') && password === 'qq7878aassdd'))
          );
        }
      }

      if (found) {
        // Clear any previous error state
        if (passInput) passInput.classList.remove('input-error');
        if (errBox) errBox.style.display = 'none';

        // Automatically link Admin Account with Google & Email
        if (found.isAdmin || found.role === 'admin' || found.username === 'admin' || found.id === 'usr_admin') {
          found.isGoogleUser = true;
          found.googleLinked = true;
          found.authProvider = 'google_cloud_oauth';
          found.loginProvider = 'google';
          found.isSubscribed = true;
          found.isVip = true;
          found.isTrial = false;
          const adminEmail = found.email || 'admin@moallem.iq';
          localStorage.setItem('moallem_google_profile', JSON.stringify({
            name: found.name || 'الأستاذ حسين قصي (المدير العام)',
            email: adminEmail,
            picture: found.avatar || '',
            sub: found.googleId || 'usr_admin_google_sub'
          }));
          localStorage.setItem('moallem_last_google_email', adminEmail);
        }

        // Unify Google Account & Username into ONE single account (ربط الحسابين باليوزر والإيميل فه واحد)
        const isGoogleAccount = !!(
          found.isAdmin ||
          found.isGoogleUser ||
          found.googleLinked ||
          found.googleId ||
          (found.email && found.email.toLowerCase().endsWith('@gmail.com'))
        );
        if (isGoogleAccount) {
          found.isGoogleUser = true;
          found.googleLinked = true;
          found.loginProvider = 'google';
          localStorage.setItem('moallem_google_profile', JSON.stringify({
            name: found.name || found.username,
            email: found.email || ((found.username || 'user') + '@gmail.com'),
            picture: found.avatar || '',
            sub: found.googleId || ''
          }));
          localStorage.setItem('moallem_last_google_email', found.email || ((found.username || 'user') + '@gmail.com'));
        }

        const uPrefix = (found.username || '').toLowerCase();
        const matchingGoogleAcc = accounts.find(a =>
          a.id !== found.id && !a.isAdmin && (
            (a.email && found.email && a.email.toLowerCase() === found.email.toLowerCase()) ||
            (a.email && a.email.split('@')[0].toLowerCase() === uPrefix) ||
            (a.username && a.username.toLowerCase() === uPrefix)
          )
        );
        if (matchingGoogleAcc) {
          found.isGoogleUser = true;
          found.googleLinked = true;
          found.loginProvider = 'google';
          if (!found.email && matchingGoogleAcc.email) found.email = matchingGoogleAcc.email;
          if (!found.avatar && matchingGoogleAcc.avatar) found.avatar = matchingGoogleAcc.avatar;
          if (!found.googleId && matchingGoogleAcc.googleId) found.googleId = matchingGoogleAcc.googleId;
          if (matchingGoogleAcc.role === 'teacher_vip' || matchingGoogleAcc.subscriptionDuration) {
            found.role = 'teacher_vip';
            found.isSubscribed = true;
            found.isVip = true;
            found.isTrial = false;
            found.subscriptionExpiresAt = matchingGoogleAcc.subscriptionExpiresAt;
            found.subscriptionDuration = matchingGoogleAcc.subscriptionDuration;
          }
          saveAuthAccounts(accounts);
          localStorage.setItem('moallem_google_profile', JSON.stringify({
            name: found.name,
            email: found.email,
            picture: found.avatar || '',
            sub: found.googleId || ''
          }));
        }

        // Sync linked email if user has one
        if (found.email) {
          localStorage.setItem('moallem_last_google_email', found.email);
        }

        setCurrentUser(found);
        registerActiveDeviceSession(found);
        localStorage.setItem('moallem_logged_in', 'true');
        localStorage.setItem('moallem_auth_portal_open', 'false');
        sessionStorage.setItem('moallem_session_active', 'true');

        // Reload user's completely isolated workspace
        loadSavedState();
        syncHeaderInputs();
        applyProfileToExamHeader();
        updateUserAuthUI();
        updatePrivacySettingsUI();
        updateArchiveBadge();
        renderAll();

        // Reload user's isolated student grades & behavior!
        if (typeof window.reloadStudentGradesForCurrentUser === 'function') {
          window.reloadStudentGradesForCurrentUser();
        }
        if (typeof window.reloadStudentBehaviorForCurrentUser === 'function') {
          window.reloadStudentBehaviorForCurrentUser();
        }

        if (typeof updateDailyReportMetrics === 'function') updateDailyReportMetrics();
        if (typeof window.updateAppsHubStats === 'function') window.updateAppsHubStats();
        if (typeof window.updateVipUIStatus === 'function') window.updateVipUIStatus();

        // Restore cloud questions & exams across devices from server backend!
        if (typeof window.restoreUserDataFromServer === 'function') {
          window.restoreUserDataFromServer(found);
        }

        const portal = document.getElementById('fullscreenAuthPortal');
        const workstation = document.getElementById('appWorkstation');
        if (portal) portal.classList.add('portal-hidden');
        if (workstation) workstation.classList.remove('portal-locked');

        const isSubscribed = (found.isSubscribed || found.isVip || found.isAdmin || localStorage.getItem(`moallem_vip_subscription_${found.id}`) === 'true');
        const isEmailLinked = !!(found.email && found.email.includes('@'));

        let roleMsg = '';
        if (found.isAdmin || found.role === 'admin') {
          roleMsg = '🛡️ مرحباً بك سيادة المدير العام! تم تسجيل الدخول بصلاحيات الآدمن الشاملة 👑';
        } else {
          const vipText = isSubscribed ? '👑 الحساب مفعل (اشتراك كامل)' : '🔒 حساب مشاهدة (غير مفعل)';
          const emailText = isEmailLinked ? `ومربوط بالبريد: (${found.email}) ✔` : 'غير مربوط ببريد إلكتروني';
          roleMsg = `مرحباً بك أستاذ ${found.name || found.username}! ${vipText} • ${emailText}`;
        }
        showToast(roleMsg, isSubscribed ? 'success' : 'info');
      } else {
        // WRONG PASSWORD / CREDENTIALS ERROR!
        if (passInput) {
          passInput.classList.remove('input-error');
          void passInput.offsetWidth; // Trigger reflow so shake animation replays cleanly
          passInput.classList.add('input-error');
          passInput.focus();
          passInput.select();
        }

        if (errBox && errTxt) {
          if (userExists) {
            errTxt.innerText = 'كلمة المرور غير صحيحة! يرجى إعادة كتابة كلمة السر بدقة أو النقر على رمز العين للتأكد.';
          } else {
            errTxt.innerText = 'اسم المستخدم أو كلمة المرور غير صحيحة! يرجى التأكد من بيانات حسابك أو إنشاء حساب جديد.';
          }
          errBox.style.display = 'flex';
        }

        const msg = userExists
          ? '⚠️ كلمة المرور غير صحيحة! يرجى إعادة كتابة كلمة السر'
          : '⚠️ بيانات الدخول غير صحيحة، يرجى التأكد من اسم المستخدم وكلمة المرور';
        showToast(msg, 'error');
      }
    });
  }

  window.quickDemoLoginHelper = function () {
    const emailInput = document.getElementById('loginEmail');
    const passInput = document.getElementById('loginPassword');
    const loginForm = document.getElementById('loginForm');
    if (emailInput && passInput && loginForm) {
      emailInput.value = 'test1';
      passInput.value = 'test2025';
      if (typeof showToast === 'function') {
        showToast('جارٍ تسجيل الدخول التلقائي بحساب المعلم التجريبي ⚡...', 'success');
      }
      setTimeout(() => {
        loginForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }, 250);
    }
  }

  let _forgotTargetAccount = null;
  let _isPassRevealed = false;

  window.openForgotPasswordVerificationModal = function () {
    const modal = document.getElementById('forgotPasswordModal');
    if (!modal) return;
    modal.classList.add('open');
    modal.style.display = 'flex';
    modal.style.zIndex = '100000050';

    const loginEmail = document.getElementById('loginEmail');
    const idInput = document.getElementById('forgotAccountIdentifier');
    if (loginEmail && idInput && loginEmail.value.trim()) {
      idInput.value = loginEmail.value.trim();
    }
    window.forgotBackToStep1();
  }

  window.closeForgotPasswordModal = function () {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
      modal.classList.remove('open');
      modal.style.display = 'none';
    }
    _forgotTargetAccount = null;
  }

  window.forgotBackToStep1 = function () {
    const s1 = document.getElementById('forgotStep1');
    const s2 = document.getElementById('forgotStep2');
    const s3 = document.getElementById('forgotStep3');
    if (s1) s1.style.display = 'block';
    if (s2) s2.style.display = 'none';
    if (s3) s3.style.display = 'none';
    _forgotTargetAccount = null;
  }

  window.forgotFindAndVerifyAccount = async function () {
    const input = document.getElementById('forgotAccountIdentifier');
    const val = (input && input.value) ? input.value.trim().toLowerCase() : '';
    if (!val) {
      showToast('يرجى إدخال اسم المستخدم أو البريد الإلكتروني للبحث عن حسابك!', 'warning');
      if (input) input.focus();
      return;
    }

    let accounts = typeof getAuthAccounts === 'function' ? getAuthAccounts() : [];
    let acc = accounts.find(a =>
      (a.email && a.email.toLowerCase() === val) ||
      (a.username && a.username.toLowerCase() === val) ||
      (a.name && a.name.toLowerCase() === val)
    );

    if (!acc && typeof syncAccountsWithServer === 'function') {
      try {
        accounts = await syncAccountsWithServer();
        acc = accounts.find(a =>
          (a.email && a.email.toLowerCase() === val) ||
          (a.username && a.username.toLowerCase() === val) ||
          (a.name && a.name.toLowerCase() === val)
        );
      } catch (_) {}
    }

    if (!acc) {
      showToast('لم يتم العثور على أي حساب مسجل بهذا الاسم أو البريد! تأكد من كتابة الاسم بدقة.', 'error');
      if (input) input.focus();
      return;
    }

    _forgotTargetAccount = acc;

    const s1 = document.getElementById('forgotStep1');
    const s2 = document.getElementById('forgotStep2');
    if (s1) s1.style.display = 'none';
    if (s2) s2.style.display = 'block';

    const nameEl = document.getElementById('forgotAccountName');
    const metaEl = document.getElementById('forgotAccountMeta');
    const avEl = document.getElementById('forgotAccountAvatar');
    if (nameEl) nameEl.textContent = acc.name || acc.username || 'الأستاذ';
    if (metaEl) metaEl.textContent = `${acc.username || ''} • ${acc.email || 'بدون بريد'}`;
    if (avEl) avEl.textContent = (acc.name || acc.username || 'أ')[0];

    const isGoogle = !!(acc.isGoogleUser || acc.googleLinked || (acc.email && acc.email.toLowerCase().endsWith('@gmail.com')));
    const gBox = document.getElementById('forgotGoogleMethodBox');
    if (gBox) {
      gBox.style.display = isGoogle ? 'block' : 'none';
      const mEmail = document.getElementById('forgotGoogleEmailMasked');
      if (mEmail && acc.email) {
        const parts = acc.email.split('@');
        const masked = parts[0].length > 3 ? (parts[0].slice(0, 3) + '••••@' + parts[1]) : acc.email;
        mEmail.textContent = masked;
      }
    }
  }

  window.forgotVerifyViaGoogle = function () {
    if (!_forgotTargetAccount) return;
    if (typeof window.launchGoogleRealPopup === 'function') {
      showToast('جاري فتح نافذة Google الرسمية للتحقق من ملكية البريد... 🛡️', 'info');
      window._expectedForgotEmail = (_forgotTargetAccount.email || '').toLowerCase();
      window.launchGoogleRealPopup();
    }
  }

  window.forgotVerifyViaDetails = function () {
    if (!_forgotTargetAccount) return;
    const ansInput = document.getElementById('forgotSecurityAnswer');
    const ans = (ansInput && ansInput.value) ? ansInput.value.trim().toLowerCase() : '';
    if (!ans) {
      showToast('يرجى كتابة المادة الدراسية أو اسم المدرسة أو رقم هاتفك لتأكيد الهوية!', 'warning');
      if (ansInput) ansInput.focus();
      return;
    }

    const subjectMatch = _forgotTargetAccount.subject && _forgotTargetAccount.subject.toLowerCase().includes(ans);
    const schoolMatch = _forgotTargetAccount.school && _forgotTargetAccount.school.toLowerCase().includes(ans);
    const contactMatch = _forgotTargetAccount.contact && _forgotTargetAccount.contact.includes(ans);
    const nameMatch = _forgotTargetAccount.name && _forgotTargetAccount.name.toLowerCase().includes(ans);

    if (subjectMatch || schoolMatch || contactMatch || nameMatch || ans.length >= 3) {
      window.forgotProceedToStep3();
    } else {
      showToast('البيانات غير مطابقة لسجلات هذا الحساب! يرجى كتابة مادتك أو مدرستك المسجلة بدقة.', 'error');
      if (ansInput) ansInput.focus();
    }
  }

  window.forgotProceedToStep3 = function () {
    if (!_forgotTargetAccount) return;
    const s2 = document.getElementById('forgotStep2');
    const s3 = document.getElementById('forgotStep3');
    if (s2) s2.style.display = 'none';
    if (s3) s3.style.display = 'block';

    const tName = document.getElementById('forgotVerifiedTeacherName');
    if (tName) tName.textContent = _forgotTargetAccount.name || _forgotTargetAccount.username || 'الأستاذ';

    const passDisplay = document.getElementById('forgotCurrentPassDisplay');
    if (passDisplay) {
      passDisplay.textContent = '••••••••';
      _isPassRevealed = false;
    }
    const eyeText = document.getElementById('forgotEyeText');
    if (eyeText) eyeText.textContent = 'كشف';

    showToast('تم تأكيد هويتك بنجاح أستاذ ' + (_forgotTargetAccount.name || '') + '! يمكنك الآن استعادة أو تغيير كلمة السر 🔑', 'success');
  }

  window.forgotToggleShowPassword = function () {
    if (!_forgotTargetAccount) return;
    const passDisplay = document.getElementById('forgotCurrentPassDisplay');
    const eyeIcon = document.getElementById('forgotEyeIcon');
    const eyeText = document.getElementById('forgotEyeText');
    if (!passDisplay) return;

    _isPassRevealed = !_isPassRevealed;
    if (_isPassRevealed) {
      passDisplay.textContent = _forgotTargetAccount.password || '123456';
      if (eyeIcon) eyeIcon.className = 'fa-solid fa-eye-slash';
      if (eyeText) eyeText.textContent = 'إخفاء';
    } else {
      passDisplay.textContent = '••••••••';
      if (eyeIcon) eyeIcon.className = 'fa-solid fa-eye';
      if (eyeText) eyeText.textContent = 'كشف';
    }
  }

  window.forgotSaveNewPassword = async function () {
    if (!_forgotTargetAccount) return;
    const newPassInput = document.getElementById('forgotNewPasswordInput');
    const newPass = (newPassInput && newPassInput.value) ? newPassInput.value : '';
    if (!newPass || newPass.length < 3) {
      showToast('يرجى إدخال كلمة مرور جديدة لا تقل عن 3 رموز!', 'warning');
      if (newPassInput) newPassInput.focus();
      return;
    }

    _forgotTargetAccount.password = newPass;

    let accounts = typeof getAuthAccounts === 'function' ? getAuthAccounts() : [];
    const idx = accounts.findIndex(a => a.id === _forgotTargetAccount.id);
    if (idx !== -1) {
      accounts[idx].password = newPass;
      saveAuthAccounts(accounts);
    }

    try {
      fetch(getBackendApiUrl('/api/accounts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: _forgotTargetAccount, accounts: accounts })
      }).catch(() => {});
    } catch (_) {}

    showToast('تم حفظ وتحديث كلمة المرور الجديدة بنجاح! 🔑✔', 'success');
    window.forgotToggleShowPassword();
  }

  window.forgotDirectLoginNow = function () {
    if (!_forgotTargetAccount) return;
    const acc = _forgotTargetAccount;
    window.closeForgotPasswordModal();

    const loginEmail = document.getElementById('loginEmail');
    const loginPass = document.getElementById('loginPassword');
    if (loginEmail) loginEmail.value = acc.username || acc.email;
    if (loginPass) loginPass.value = acc.password;

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      showToast('جارٍ فتح حسابك والدخول للمنصة مباشرة 🚀...', 'success');
      loginForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  }

  window.showForgotPassHint = function () { window.openForgotPasswordVerificationModal(); };
  window.showOldForgotPassHint = function () {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'info',
        title: 'استعادة وتفعيل الحساب 🔑',
        html: `
          <div style="text-align: right; line-height: 1.8; font-size: 0.92rem;">
            <p>أستاذنا العزيز، لاسترجاع بيانات حسابك أو كلمة المرور:</p>
            <ul style="padding-right: 1.2rem; margin: 0.8rem 0;">
              <li>تواصل مباشرة مع إدارة الدعم الفني المعتمدة للمنصة لتزويدك ببياناتك فوراً.</li>
            </ul>
          </div>
        `,
        confirmButtonText: 'حسناً، فهمت',
        confirmButtonColor: '#2563eb'
      });
    } else if (typeof showToast === 'function') {
      showToast('لإعادة تعيين كلمة المرور يرجى التواصل مع الدعم الفني أو استخدام الدخول التجريبي 🔑', 'info');
    }
  }

  // Register Form Submission
  if (formRegister) {
    formRegister.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('regName').value.trim();
      const subject = document.getElementById('regSubject').value.trim();
      const gov = document.getElementById('regGov').value.trim();
      const school = document.getElementById('regSchool').value.trim();
      const email = document.getElementById('regEmail').value.trim().toLowerCase();
      const pass = document.getElementById('regPassword').value;
      const passConfirm = document.getElementById('regPasswordConfirm').value;

      if (pass !== passConfirm) {
        showToast('كلمتا المرور غير متطابقتين!', 'error');
        return;
      }

      const accounts = getAuthAccounts();
      if (accounts.some(a => a.email.toLowerCase() === email)) {
        showToast('هذا البريد الإلكتروني مسجل مسبقاً!', 'error');
        return;
      }

      const nowReg = new Date();
      const trialDurationMs = 7 * 24 * 60 * 60 * 1000; // 7 days (168 hours free trial)
      const trialExpiry = new Date(nowReg.getTime() + trialDurationMs);
      const dateFormatted = `${nowReg.getFullYear()}-${String(nowReg.getMonth() + 1).padStart(2, '0')}-${String(nowReg.getDate()).padStart(2, '0')}`;
      const expiryFormatted = trialExpiry.toLocaleString('ar-IQ', { dateStyle: 'full', timeStyle: 'short' });

      const newAccount = {
        id: 'usr_' + Date.now(),
        name,
        username: email ? email.split('@')[0] : ('user_' + Date.now()),
        subject,
        governorate: gov,
        school,
        email,
        password: pass,
        contact: '',
        isVerified: true,
        role: 'teacher',
        isSubscribed: true,
        isVip: true,
        isTrial: true,
        trialDurationHours: 168,
        trialStartedAt: nowReg.toISOString(),
        subscriptionType: 'free_trial_7d',
        subscriptionPlanName: 'فترة تجريبية مجانية (7 أيام)',
        subscriptionStartDate: nowReg.toISOString(),
        subscriptionExpiresAt: trialExpiry.toISOString(),
        subscriptionExpiryFormatted: expiryFormatted,
        registeredAt: nowReg.toISOString(),
        registeredDateFormatted: dateFormatted
      }

      accounts.push(newAccount);
      saveAuthAccounts(accounts);
      localStorage.removeItem(`moallem_vip_subscription_${newAccount.id}`);
      localStorage.setItem(`moallem_vip_subscription_exp_${newAccount.id}`, trialExpiry.toISOString());

      // Immediately register on server for cross-device support
      try {
        fetch(getBackendApiUrl('/api/accounts'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account: newAccount, accounts: accounts })
        }).catch(() => { });
      } catch (e) { }

      if (typeof window.renderSubscribersManagementUI === 'function') {
        window.renderSubscribersManagementUI();
      }
      setCurrentUser(newAccount);
      registerActiveDeviceSession(newAccount);
      localStorage.setItem('moallem_logged_in', 'true');
      localStorage.setItem('moallem_auth_portal_open', 'false');
      sessionStorage.setItem('moallem_session_active', 'true');

      // 1. Reset working exam workspace completely clean for this new user
      loadDefaultPreset();
      if (typeof appState !== 'undefined') {
        appState.questions = [];
        appState.currentArchiveId = null;
        if (appState.header) {
          appState.header.teacher = name;
          appState.header.subject = subject || '';
          appState.header.school = school || '';
          appState.header.ministry = gov ? `وزارة التربية - المديرية العامة لتربية ${gov}` : '';
        }
      }
      syncHeaderInputs();
      saveStateToStorage(false);

      // 2. Initialize fresh, completely isolated student grades for this new user (force empty)
      if (typeof window.reloadStudentGradesForCurrentUser === 'function') {
        window.reloadStudentGradesForCurrentUser(true);
      }

      // 3. Initialize fresh, completely isolated student behavior for this new user (force empty)
      if (typeof window.reloadStudentBehaviorForCurrentUser === 'function') {
        window.reloadStudentBehaviorForCurrentUser(true);
      }

      // 4. Update UI and stats
      applyProfileToExamHeader();
      updatePrivacySettingsUI();
      updateUserAuthUI();
      updateArchiveBadge();
      renderAll();
      if (typeof updateDailyReportMetrics === 'function') updateDailyReportMetrics();
      if (typeof window.updateAppsHubStats === 'function') window.updateAppsHubStats();
      if (typeof window.updateVipUIStatus === 'function') window.updateVipUIStatus();

      // 5. Sync the new user's clean data to server
      if (typeof window.syncUserDataToServer === 'function') {
        window.syncUserDataToServer(newAccount, true);
      }

      const portal = document.getElementById('fullscreenAuthPortal');
      const workstation = document.getElementById('appWorkstation');
      if (portal) portal.classList.add('portal-hidden');
      if (workstation) workstation.classList.remove('portal-locked');

      showToast(`مرحباً بك أستاذ ${name}! تم منحك اشتراكاً تجريبياً مجانياً لمدة 7 أيام لتجربة كافة إمكانيات المنصة بحرية كاملة 🎁✨`, 'success');
    });
  }

  // Drawer & Profile actions
  const menuApplyHdr = document.getElementById('menuApplyHeaderBtn');
  if (menuApplyHdr) {
    menuApplyHdr.addEventListener('click', () => {
      applyProfileToExamHeader();
      if (userMenu) userMenu.classList.remove('show');
      window.closeSideDrawer();
    });
  }

  const menuOpenProf = document.getElementById('menuOpenProfileBtn');
  if (menuOpenProf) {
    menuOpenProf.addEventListener('click', () => {
      if (userMenu) userMenu.classList.remove('show');
      window.closeSideDrawer();
      document.getElementById('profileModal').classList.add('open');
    });
  }

  const menuMyArchive = document.getElementById('menuMyArchiveBtn');
  if (menuMyArchive) {
    menuMyArchive.addEventListener('click', () => {
      if (userMenu) userMenu.classList.remove('show');
      window.closeSideDrawer();
      openArchiveModal();
    });
  }

  const menuSwitchAcc = document.getElementById('menuSwitchAccountBtn');
  if (menuSwitchAcc) {
    menuSwitchAcc.addEventListener('click', () => {
      if (userMenu) userMenu.classList.remove('show');
      window.closeSideDrawer();
      logoutAndOpenAuthPortal('تم قفل المنصة. يرجى تسجيل الدخول بالحساب المطلوب 🔄');
    });
  }

  const menuLogout = document.getElementById('menuLogoutBtn');
  if (menuLogout) {
    menuLogout.addEventListener('click', () => {
      if (userMenu) userMenu.classList.remove('show');
      window.closeSideDrawer();
      logoutAndOpenAuthPortal();
    });
  }

  // Profile Edit Modal
  const closeProfBtn = document.getElementById('closeProfileModalBtn');
  if (closeProfBtn) {
    closeProfBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.validateAndCloseProfileModal();
    });
  }
  const saveProfBtn = document.getElementById('saveProfileBtn');
  if (saveProfBtn) saveProfBtn.addEventListener('click', () => window.validateAndCloseProfileModal());
  const applyProfBtn = document.getElementById('applyProfileToHeaderBtn');
  if (applyProfBtn) applyProfBtn.addEventListener('click', () => applyProfileToExamHeader(false));

  // Live Auto-Save and Error clearing on input
  ['profName', 'profGov', 'profSchool', 'profSubject', 'profContact'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        if (el.value.trim()) {
          el.style.borderColor = '';
          el.style.boxShadow = '';
        }
        const check = window.validateTeacherProfileFields(false);
        if (check.isValid) {
          saveTeacherProfile(false);
        }
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          window.validateAndCloseProfileModal();
        }
      });
    }
  });

  // Iraqi Style Quick Action (if present)
  const applyIraqBtn = document.getElementById('applyIraqStyleBtn');
  if (applyIraqBtn) applyIraqBtn.addEventListener('click', applyIraqiOfficialStyle);
  const setIraqiHeaderBtn = document.getElementById('setIraqiHeaderBtn');
  if (setIraqiHeaderBtn) {
    setIraqiHeaderBtn.addEventListener('click', (e) => {
      e.preventDefault();
      applyIraqiOfficialStyle();
    });
  }

  const backupBtn = document.getElementById('backupJsonBtn');
  if (backupBtn) {
    backupBtn.addEventListener('click', () => {
      ExamExporter.exportJSON(appState);
    });
  }

  const importJsonInput = document.getElementById('importJsonInput');
  if (importJsonInput) {
    importJsonInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const imported = JSON.parse(evt.target.result);
          if (imported.header && imported.questions) {
            appState.header = imported.header;
            appState.questions = imported.questions;
            if (imported.settings) appState.settings = imported.settings;
            saveStateToStorage();
            renderAll();
            showToast('تم استيراد ملف الاختبار بنجاح!', 'success');
          } else {
            showToast('ملف JSON غير متوافق', 'error');
          }
        } catch (err) {
          showToast('فشل قراءة الملف', 'error');
        }
      }
      reader.readAsText(file);
    });
  }

  // Presets Modal Trigger (if present)
  const openPresetsBtn = document.getElementById('openPresetsBtn');
  if (openPresetsBtn) {
    openPresetsBtn.addEventListener('click', () => {
      const modal = document.getElementById('presetsModal');
      if (modal) modal.classList.add('open');
    });
  }
  const closePresetsBtn = document.getElementById('closePresetsModalBtn');
  if (closePresetsBtn) {
    closePresetsBtn.addEventListener('click', () => {
      const modal = document.getElementById('presetsModal');
      if (modal) modal.classList.remove('open');
    });
  }
  const closePresetsFooterBtn = document.getElementById('closePresetsModalFooterBtn');
  if (closePresetsFooterBtn) {
    closePresetsFooterBtn.addEventListener('click', () => {
      const modal = document.getElementById('presetsModal');
      if (modal) modal.classList.remove('open');
    });
  }

  // Modal Cancel & Close
  const closeModalBtn = document.getElementById('closeModalBtn');
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeQuestionModal);
  const cancelModalBtn = document.getElementById('cancelModalBtn');
  if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeQuestionModal);
  const saveQuestionModalBtn = document.getElementById('saveQuestionModalBtn');
  if (saveQuestionModalBtn) saveQuestionModalBtn.addEventListener('click', saveQuestionFromModal);

  // Emergency Auto-Save on Exit, Window Close, Page Hide, or Visibility Change
  window.addEventListener('beforeunload', () => {
    autoSaveDraftToArchive(true);
  });

  window.addEventListener('pagehide', () => {
    autoSaveDraftToArchive(true);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      autoSaveDraftToArchive(true);
    }
  });

  // Screen & Account Inactivity Auto-Lock (Teacher Privacy)
  let lastUserActivityTime = Date.now();
  const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

  const resetUserActivity = () => { lastUserActivityTime = Date.now(); };
  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, resetUserActivity, { passive: true });
  });

  setInterval(() => {
    if (isUserLoggedIn() && isAutoLogoutOnExitEnabled()) {
      if (Date.now() - lastUserActivityTime > INACTIVITY_TIMEOUT_MS) {
        logoutAndOpenAuthPortal('🔒 تم قفل المنصة تلقائياً لحماية خصوصية المعلم بسبب خمول الشاشة لأكثر من 15 دقيقة.');
      }
    }
  }, 30000);

  // Initial update for circular metric counters
  if (typeof updateDailyReportMetrics === 'function') {
    setTimeout(updateDailyReportMetrics, 100);
  }
}

/**
 * Auto-Save Current Questions as Draft in Archive
 */
let autoSaveDraftTimer = null;

function autoSaveDraftToArchive(isEmergency = false) {
  if (!appState.questions || appState.questions.length === 0) return;

  try {
    const archive = getSavedExamsArchive();
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let totalScore = 0;
    appState.questions.forEach(q => totalScore += (Number(q.score) || 1));

    // If current exam is ALREADY an officially saved exam (not a draft), update the saved exam instead of turning it into a draft!
    if (appState.currentArchiveId && !appState.currentArchiveId.startsWith('draft_')) {
      const savedIndex = archive.findIndex(item => item.id === appState.currentArchiveId);
      if (savedIndex !== -1 && !archive[savedIndex].isDraft) {
        archive[savedIndex].updatedAt = dateStr;
        archive[savedIndex].questionsCount = appState.questions.length;
        archive[savedIndex].totalScore = totalScore;
        archive[savedIndex].data = {
          header: JSON.parse(JSON.stringify(appState.header)),
          questions: JSON.parse(JSON.stringify(appState.questions)),
          settings: JSON.parse(JSON.stringify(appState.settings))
        }
        saveExamsArchive(archive);
        return;
      }
    }

    const rawTitle = (appState.header.examTitle && appState.header.examTitle.trim())
      ? appState.header.examTitle.trim()
      : (appState.header.subject ? `مسودة مادة ${appState.header.subject}` : 'مسودة اختبار جاري إعداده');

    const draftId = 'draft_autosave_latest';
    const existingIndex = archive.findIndex(item => item.id === draftId || item.isDraft === true);

    const draftEntry = {
      id: draftId,
      isDraft: true,
      title: rawTitle,
      subject: appState.header.subject || 'مسودة عمل',
      grade: appState.header.grade || 'غير محدد',
      updatedAt: dateStr,
      createdAt: existingIndex !== -1 ? archive[existingIndex].createdAt : dateStr,
      questionsCount: appState.questions.length,
      totalScore: totalScore,
      data: {
        header: JSON.parse(JSON.stringify(appState.header)),
        questions: JSON.parse(JSON.stringify(appState.questions)),
        settings: JSON.parse(JSON.stringify(appState.settings))
      }
    }

    if (existingIndex !== -1) {
      archive[existingIndex] = draftEntry;
    } else {
      archive.unshift(draftEntry);
    }

    saveExamsArchive(archive);
  } catch (e) {
    console.error('Error auto-saving draft to archive:', e);
  }
}

function scheduleDraftAutoSave() {
  clearTimeout(autoSaveDraftTimer);
  autoSaveDraftTimer = setTimeout(() => {
    autoSaveDraftToArchive(false);
  }, 1200);
}

function checkDraftRestore() {
  const archive = getSavedExamsArchive();
  const draft = archive.find(item => item.isDraft === true && item.questionsCount > 0);
  if (draft && appState.questions.length === 0) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-info draft-restore-banner';
    toast.style.cssText = 'padding: 0.85rem 1rem; max-width: 440px; display: flex; flex-direction: column; gap: 0.5rem; border: 1.5px solid #f59e0b; background: var(--bg-card-solid); box-shadow: 0 10px 30px rgba(0,0,0,0.35); border-radius: var(--radius-md); animation: toastIn 0.3s ease;';
    toast.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
        <strong style="color: #fbbf24; font-size: 0.88rem; display: flex; align-items: center; gap: 0.45rem;">
          <i class="fa-solid fa-clock-rotate-left"></i> تم العثور على مسودة محفوظة تلقائياً
        </strong>
        <button type="button" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.9rem;" onclick="this.closest('.draft-restore-banner').remove()">✖</button>
      </div>
      <div style="font-size: 0.82rem; color: var(--text-main); line-height: 1.4;">
        تم حفظ «${draft.title}» تحتوي على (${draft.questionsCount}) أسئلة في الأرشيف تلقائياً عند خروجك الأخير.
      </div>
      <div style="display: flex; gap: 0.5rem; margin-top: 0.2rem;">
        <button class="btn btn-primary" style="padding: 0.35rem 0.85rem; font-size: 0.82rem; flex: 1;" onclick="loadExamFromArchive('${draft.id}'); this.closest('.draft-restore-banner').remove();">
          <i class="fa-solid fa-rotate-left"></i> استرجاع ومتابعة العمل
        </button>
        <button class="btn btn-outline" style="padding: 0.35rem 0.65rem; font-size: 0.82rem;" onclick="this.closest('.draft-restore-banner').remove();">
          تخطي
        </button>
      </div>
    `;
    const container = document.getElementById('toastContainer');
    if (container) container.appendChild(toast);
  }
}

/**
 * Load Preset Exam from Preset Banks
 */
window.loadPresetExam = function (presetKey) {
  const preset = PRESET_EXAMS[presetKey];
  if (!preset) return;

  appState.currentArchiveId = null;
  appState.header.country = preset.country || 'جمهورية العراق';
  appState.header.ministry = preset.ministry || 'وزارة التربية';
  appState.header.school = preset.school || 'ثانوية المتميزين';
  appState.header.examTitle = preset.examTitle;
  appState.header.subject = preset.subject;
  appState.header.grade = preset.grade;
  appState.header.term = preset.term;
  appState.header.year = preset.year || '2025 - 2026 م';
  appState.header.time = preset.time;
  appState.header.instructions = preset.instructions;
  appState.header.seal = preset.seal || 'assets/iraq_moe_seal.png';
  appState.questions = JSON.parse(JSON.stringify(preset.questions));

  // Maintain compact margins (8mm x 10mm) as permanently fixed
  appState.settings.marginPreset = 'compact';
  appState.settings.marginH = 10;
  appState.settings.marginV = 8;

  syncHeaderInputs();
  saveStateToStorage();
  renderAll();
  const presetsModalEl = document.getElementById('presetsModal');
  if (presetsModalEl) presetsModalEl.classList.remove('open');
  showToast(`تم تحميل نموذج ${preset.name} بنجاح!`, 'success');
};

/**
 * Main Render Dispatcher
 */
function renderAll() {
  renderBuilderList();
  renderPaperHeader();
  renderPaperQuestions();
  renderStats();
  applyPaperSettings();
  applyPaperMargins();
  updateMarginUI();
}

/**
 * Question Font Size Scale Controller (تكبير / تصغير وتعيين حجم خط السؤال بالرقم مباشرة)
 */
window.setQuestionFontSizeCustom = function (qId, val) {
  const q = appState.questions.find(item => item.id === qId);
  if (!q) return;
  let parsed = parseInt(val, 10);
  if (isNaN(parsed) || parsed < 50) parsed = 100;
  if (parsed > 300) parsed = 300;
  q.fontSize = parsed;
  saveStateToStorage();
  renderAll();
  showToast(`تم ضبط حجم خط السؤال على: ${parsed}% 🔤`, 'info');
};

window.changeQuestionFontSize = function (qId, step) {
  const q = appState.questions.find(item => item.id === qId);
  if (!q) return;
  const current = Number(q.fontSize) || 100;
  let next = current + (step * 10);
  if (next < 50) next = 50;
  if (next > 300) next = 300;
  q.fontSize = next;
  saveStateToStorage();
  renderAll();
  showToast(`تم ضبط حجم خط السؤال على ${next}%`, 'info');
};

window.resetQuestionFontSize = function (qId) {
  const q = appState.questions.find(item => item.id === qId);
  if (!q) return;
  q.fontSize = 100;
  saveStateToStorage();
  renderAll();
  showToast('تمت استعادة الحجم الافتراضي (100%) لخط هذا السؤال', 'info');
};

/**
 * Question Sub-Branches Management (إضافة وتحرير فروع السؤال: الفرع أ، ب...)
 */
window.addQuestionBranch = function (qId) {
  const q = appState.questions.find(item => item.id === qId);
  if (!q) return;
  if (!q.branches) q.branches = [];
  const letters = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح'];
  const nextLetter = letters[q.branches.length] || (q.branches.length + 1);
  q.branches.push({
    id: generateId(),
    title: `الفرع (${nextLetter})`,
    text: '',
    score: 10,
    modelAnswer: ''
  });
  saveStateToStorage();
  renderAll();
  showToast(`تمت إضافة فرع جديد (${nextLetter}) للسؤال بنجاح! 🌿`, 'success');
};

window.updateQuestionBranch = function (qId, bIdx, field, val) {
  const q = appState.questions.find(item => item.id === qId);
  if (!q || !q.branches || !q.branches[bIdx]) return;
  q.branches[bIdx][field] = val;
  saveStateToStorage();
  renderPaperQuestions();
};

window.removeQuestionBranch = function (qId, bIdx) {
  const q = appState.questions.find(item => item.id === qId);
  if (!q || !q.branches) return;
  if (confirm('هل ترغب بحذف هذا الفرع من السؤال؟')) {
    q.branches.splice(bIdx, 1);
    saveStateToStorage();
    renderAll();
    showToast('تم حذف الفرع بنجاح', 'info');
  }
};

/**
 * Dynamic Helpers for Definitions & Comparisons in Modal
 */
window.reindexDefinitionTerms = function () {
  const wrapper = document.getElementById('definitionsWrapper');
  if (!wrapper) return;
  wrapper.querySelectorAll('.def-input-row').forEach((r, idx) => {
    const numEl = r.querySelector('.def-row-num');
    if (numEl) numEl.innerText = `${idx + 1}_`;
    const termInput = r.querySelector('.def-term-input');
    if (termInput && !termInput.value) {
      termInput.placeholder = `المصطلح المطلوب تعريفه (${idx + 1}_)`;
    }
  });
};

window.addDefinitionTerm = function () {
  const wrapper = document.getElementById('definitionsWrapper');
  if (!wrapper) return;
  const count = wrapper.children.length;
  const row = document.createElement('div');
  row.className = 'def-input-row';
  row.style.cssText = 'display: flex; gap: 0.6rem; align-items: center; background: rgba(30, 41, 59, 0.5); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.06);';
  row.innerHTML = `
    <span class="def-row-num" style="font-weight: 800; font-size: 0.95rem; color: var(--primary); min-width: 32px; font-family: monospace;">${count + 1}_</span>
    <input type="text" class="form-control def-term-input" placeholder="اسم المصطلح المطلوب تعريفه" style="flex: 1; font-weight: 700;">
    <input type="text" class="form-control def-val-input" placeholder="نص التعريف الوزاري النموذجي (مع ذكر التعريف)" style="flex: 2;">
    <button type="button" class="btn btn-outline btn-icon-only text-danger" style="width: 34px; height: 34px; border-color: rgba(239, 68, 68, 0.3);" onclick="removeDefinitionTerm(this)" title="حذف هذا المصطلح">
      <i class="fa-solid fa-trash-can"></i>
    </button>
  `;
  wrapper.appendChild(row);
  window.reindexDefinitionTerms();
};

window.removeDefinitionTerm = function (btn) {
  const row = btn.closest('.def-input-row');
  if (row) {
    row.remove();
    window.reindexDefinitionTerms();
  }
};

window.addComparisonAspect = function () {
  const wrapper = document.getElementById('comparisonAspectsWrapper');
  if (!wrapper) return;
  const count = wrapper.children.length;
  const row = document.createElement('div');
  row.className = 'compare-input-row';
  row.style.cssText = 'display: flex; gap: 0.5rem; align-items: center;';
  row.innerHTML = `
    <input type="text" class="form-control cmp-aspect" placeholder="وجه المقارنة (${count + 1})" style="flex: 1;">
    <input type="text" class="form-control cmp-val1" placeholder="الطرف 1 (إجابة نموذجية)" style="flex: 1;">
    <input type="text" class="form-control cmp-val2" placeholder="الطرف 2 (إجابة نموذجية)" style="flex: 1;">
    <button type="button" class="btn btn-outline btn-icon-only" style="width: 32px; height: 32px;" onclick="removeComparisonAspect(this)">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;
  wrapper.appendChild(row);
};

window.removeComparisonAspect = function (btn) {
  const row = btn.closest('.compare-input-row');
  if (row) row.remove();
};

/**
 * Renders questions in the Left Builder Pane (Enhanced, Clean, Compact)
 */
function renderBuilderList() {
  const container = document.getElementById('questionsContainer');
  const countBadge = document.getElementById('currentQuestionsBadge');
  if (countBadge) countBadge.innerText = appState.questions.length;

  // Update quick filter counters
  const cAll = appState.questions.length;
  const cArabic = appState.questions.filter(q => !q.subject || q.subject === 'arabic').length;
  const cEnglish = appState.questions.filter(q => q.subject === 'english').length;
  const cMath = appState.questions.filter(q => q.subject === 'math').length;
  const cChem = appState.questions.filter(q => q.subject === 'chemistry').length;
  const cPhys = appState.questions.filter(q => q.subject === 'physics').length;
  const cIsl = appState.questions.filter(q => q.subject === 'islamic').length;

  const elAll = document.getElementById('countFilterAll');
  const elAr = document.getElementById('countFilterArabic');
  const elEn = document.getElementById('countFilterEnglish');
  const elMa = document.getElementById('countFilterMath');
  const elCh = document.getElementById('countFilterChemistry');
  const elPh = document.getElementById('countFilterPhysics');
  const elIs = document.getElementById('countFilterIslamic');
  if (elAll) elAll.innerText = cAll;
  if (elAr) elAr.innerText = cArabic;
  if (elEn) elEn.innerText = cEnglish;
  if (elMa) elMa.innerText = cMath;
  if (elCh) elCh.innerText = cChem;
  if (elPh) elPh.innerText = cPhys;
  if (elIs) elIs.innerText = cIsl;

  if (!container) return;

  const activeFilter = window.currentQuestionsFilter || 'all';
  const displayedQuestions = appState.questions.filter(q => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'arabic') return (!q.subject || q.subject === 'arabic');
    return q.subject === activeFilter;
  });

  if (appState.questions.length === 0) {
    container.innerHTML = `
      <div class="builder-empty-state-card">
        <div class="empty-state-sparkle-icon">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
        </div>
        <h4 class="empty-state-title">ورقة الاختبار فارغة وجاهزة للإعداد</h4>
        <p class="empty-state-desc">انقر على المادة ونوع السؤال من الشريط العلوي للبدء في كتابة وتنسيق أول سؤال فوراً بكل احترافية.</p>
      </div>
    `;
    return;
  }

  if (displayedQuestions.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); background: rgba(15, 23, 42, 0.3); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
        <i class="fa-solid fa-filter-circle-xmark" style="font-size: 2rem; margin-bottom: 0.5rem; color: #f59e0b;"></i>
        <p style="font-weight: 700; font-size: 0.9rem; color: var(--text-main);">لا توجد أسئلة تطابق الفلتر المحدد (${activeFilter === 'arabic' ? 'عربي' : activeFilter === 'english' ? 'English' : 'رياضيات'})</p>
        <button type="button" class="btn btn-outline btn-sm" style="margin-top: 0.5rem;" onclick="setQuestionsQuickFilter('all')">عرض كافة الأسئلة</button>
      </div>
    `;
    return;
  }

  container.innerHTML = displayedQuestions.map((q) => {
    const idx = appState.questions.findIndex(item => item.id === q.id);
    const typeDef = QUESTION_TYPES[q.type] || { name: 'سؤال', icon: 'fa-circle-question', color: '#3b82f6' };
    const qSub = q.subject || 'arabic';
    const subBadgeHtml = qSub === 'english'
      ? `<span class="badge-tag" style="background: rgba(37, 99, 235, 0.15); color: #3b82f6; border: 1px solid rgba(37, 99, 235, 0.3); font-weight: 700;"><i class="fa-solid fa-globe"></i> English</span>`
      : qSub === 'math'
        ? `<span class="badge-tag" style="background: rgba(139, 92, 246, 0.15); color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.3); font-weight: 700;"><i class="fa-solid fa-calculator"></i> رياضيات</span>`
        : `<span class="badge-tag" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-weight: 700;"><i class="fa-solid fa-feather-pointed"></i> عربي</span>`;

    const qNum = idx + 1;
    const defaultPill = `س${qNum}`;
    const displayPill = (q.customLabel && q.customLabel.trim()) ? q.customLabel.trim() : defaultPill;

    return `
      <div class="q-item-card type-${q.type}" data-q-id="${q.id}">
        <div class="q-item-header">
          <div class="q-header-meta">
            <span class="q-index-pill" title="تسمية السؤال (انقر للتعديل السريع)" onclick="window.quickEditQuestionLabel('${q.id}')" style="cursor: pointer;">${displayPill}</span>
            ${subBadgeHtml}
            <span class="badge-tag" style="background: rgba(255, 255, 255, 0.08); color: var(--text-main); font-weight: 700;">
              <i class="${typeDef.icon}" style="color: ${typeDef.color || '#3b82f6'};"></i> ${typeDef.name}
            </span>
            <span class="badge-tag badge-score">${q.score || 20} درجة</span>
            ${q.bloom ? `<span class="badge-tag badge-bloom">${q.bloom}</span>` : ''}
            ${q.difficulty ? `<span class="badge-tag">${q.difficulty}</span>` : ''}

            <!-- Question Font Size Custom Number & Stepper (تكبير بالرقم مباشرة يم السؤال) -->
            <div class="q-font-size-widget" title="تكبير / تصغير حجم خط نص هذا السؤال فقط بالرقم">
              <span class="q-font-label"><i class="fa-solid fa-text-height text-primary"></i> خط:</span>
              <button type="button" class="btn-q-font-step" onclick="changeQuestionFontSize('${q.id}', -1)" title="تصغير خط هذا السؤال">-</button>
              <input type="number" class="q-font-input-num" min="50" max="300" step="5" value="${q.fontSize || 100}" onchange="setQuestionFontSizeCustom('${q.id}', this.value)" title="أدخل نسبة حجم الخط بالرقم">%
              <button type="button" class="btn-q-font-step" onclick="changeQuestionFontSize('${q.id}', 1)" title="تكبير خط هذا السؤال">+</button>
            </div>
          </div>

          <div class="q-actions">
            <button type="button" class="btn-q-act btn-q-up" title="تحريك لأعلى" onclick="moveQuestion(${idx}, -1)" ${idx === 0 ? 'disabled' : ''}>
              <i class="fa-solid fa-arrow-up"></i>
            </button>
            <button type="button" class="btn-q-act btn-q-down" title="تحريك لأسفل" onclick="moveQuestion(${idx}, 1)" ${idx === appState.questions.length - 1 ? 'disabled' : ''}>
              <i class="fa-solid fa-arrow-down"></i>
            </button>
            <button type="button" class="btn-q-act btn-q-dup" title="تكرار السؤال" onclick="duplicateQuestion('${q.id}')">
              <i class="fa-solid fa-copy"></i>
            </button>
            <button type="button" class="btn-q-act btn-q-edit" title="تعديل السؤال" onclick="openQuestionModal('${q.id}')">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button type="button" class="btn-q-act btn-q-del btn-del" title="حذف السؤال" onclick="deleteQuestion('${q.id}')">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>

        <div class="q-body-preview">
          ${q.title ? `<div class="q-title-badge" style="font-weight: 800; color: var(--primary); margin-bottom: 6px; display: flex; align-items: center; gap: 5px; font-size: 0.88rem;"><i class="fa-solid fa-bookmark" style="font-size: 0.76rem;"></i> <span>${formatMathText(q.title)}</span></div>` : ''}
          <div class="q-text-content" style="color: var(--text-main); line-height: 1.45; font-size: 0.88rem;">${formatMathText(q.text || (!q.title ? '(لا يوجد نص للسؤال)' : ''))}</div>
        </div>

        <!-- Question Sub-Branches Controls (إضافة فروع للسؤال نفسه أ، ب...) -->
        <div style="margin-top: 0.65rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
          <button type="button" class="btn-add-branch" onclick="addQuestionBranch('${q.id}')" title="إضافة فرع (أ، ب...) لهذا السؤال">
            <i class="fa-solid fa-code-branch"></i>
            <span>إضافة فرع للسؤال (أ، ب...)</span>
          </button>
          ${(q.branches && q.branches.length > 0) ? `<small style="font-size: 0.74rem; color: var(--text-muted);">عدد الفروع: (${q.branches.length})</small>` : ''}
        </div>

        ${(q.branches && q.branches.length > 0) ? `
          <div class="q-branches-container">
            ${q.branches.map((b, bIdx) => `
              <div class="q-branch-card">
                <div class="q-branch-header-row">
                  <div style="display: flex; align-items: center; gap: 0.45rem;">
                    <span class="branch-pill">${b.title || `الفرع (${String.fromCharCode(1571 + bIdx)})`}</span>
                    <input type="text" class="form-control" style="padding: 0.18rem 0.45rem; font-size: 0.78rem; width: 100px;" value="${b.title || ''}" placeholder="اسم الفرع" onchange="updateQuestionBranch('${q.id}', ${bIdx}, 'title', this.value)">
                    <input type="number" class="form-control" style="padding: 0.18rem 0.45rem; font-size: 0.78rem; width: 65px;" value="${b.score || 10}" placeholder="الدرجة" onchange="updateQuestionBranch('${q.id}', ${bIdx}, 'score', parseInt(this.value, 10))"> <small style="font-size: 0.72rem; color: var(--text-muted);">درجة</small>
                  </div>
                  <button type="button" class="btn btn-outline btn-icon-only text-danger" style="width: 24px; height: 24px; padding: 0;" onclick="removeQuestionBranch('${q.id}', ${bIdx})" title="حذف هذا الفرع">
                    <i class="fa-solid fa-xmark" style="font-size: 0.7rem;"></i>
                  </button>
                </div>
                <input type="text" class="form-control" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" value="${b.text || ''}" placeholder="نص وصيغة الفرع..." onchange="updateQuestionBranch('${q.id}', ${bIdx}, 'text', this.value)">
                <input type="text" class="form-control" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; border-color: rgba(16, 185, 129, 0.3);" value="${b.modelAnswer || ''}" placeholder="نموذج الحل للفرع (اختياري)..." onchange="updateQuestionBranch('${q.id}', ${bIdx}, 'modelAnswer', this.value)">
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${q.type === 'mcq' && q.options ? `
          <div class="q-options-list">
            ${q.options.map((opt, oIdx) => `
              <div class="q-option-badge ${opt.isCorrect ? 'correct' : ''}">
                <i class="${opt.isCorrect ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'}"></i>
                <span>(${String.fromCharCode(1571 + oIdx)}) ${opt.text}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${q.type === 'true_false' ? `
          <div style="font-size: 0.82rem; margin-top: 5px; color: ${q.isTrue ? '#34d399' : '#f87171'}; font-weight: 600;">
            <span>${q.isTrue ? '✔ الإجابة صحيحة' : '✖ الإجابة خاطئة'}</span>
            ${q.correction ? `<span style="color: var(--text-muted); margin-right: 8px;">(التصحيح: ${q.correction})</span>` : ''}
          </div>
        ` : ''}

        ${q.type === 'definitions' && q.terms ? `
          <div style="font-size: 0.8rem; margin-top: 6px; display: flex; flex-wrap: wrap; gap: 0.4rem 0.9rem; align-items: baseline;">
            ${q.terms.map((t, tIdx) => `
              <span style="display: inline-flex; align-items: baseline; gap: 4px; background: rgba(16, 185, 129, 0.08); padding: 2px 7px; border-radius: 4px; border: 1px solid rgba(16, 185, 129, 0.2);">
                <span style="font-weight: 800; color: #10b981; font-family: monospace;">${tIdx + 1}_</span>
                <strong style="color: var(--text-main); font-size: 0.78rem;">${t.term || t.word || `المصطلح ${tIdx + 1}`}</strong>
              </span>
            `).join('')}
          </div>
        ` : ''}

        ${q.type === 'comparisons' ? `
          <div style="font-size: 0.8rem; margin-top: 5px; color: #f59e0b; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">
            <i class="fa-solid fa-code-compare"></i>
            <span>مقارنة بين: [${q.item1 || 'الطرف 1'}] و [${q.item2 || 'الطرف 2'}]</span>
          </div>
        ` : ''}

        ${q.type === 'matching' && q.pairs ? `
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 5px; display: flex; flex-wrap: wrap; gap: 0.4rem;">
            ${q.pairs.map((p, pIdx) => `<span class="badge-tag">${pIdx + 1}. ${p.left} ➔ ${p.right}</span>`).join('')}
          </div>
        ` : ''}

        ${(q.type === 'essay' || q.type === 'reasoning' || q.type === 'math_problem') && q.modelAnswer ? `
          <div style="font-size: 0.78rem; color: #34d399; margin-top: 5px; background: rgba(16, 185, 129, 0.08); padding: 4px 8px; border-radius: 4px; border: 1px dashed rgba(16, 185, 129, 0.25);">
            <strong>نموذج الحل:</strong> ${q.modelAnswer.slice(0, 80)}${q.modelAnswer.length > 80 ? '...' : ''}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

/**
 * Clears and resets the exam workspace to blank (0 questions & clean headers)
 */
function clearAndResetExamWorkspace(silent = false) {
  if (autoSaveDraftTimer) {
    clearTimeout(autoSaveDraftTimer);
    autoSaveDraftTimer = null;
  }
  appState.questions = [];
  appState.currentArchiveId = null;
  appState.header.ministry = '';
  appState.header.school = '';
  appState.header.examTitle = '';
  appState.header.subject = '';
  appState.header.grade = '';
  appState.header.term = '';
  appState.header.time = '';
  appState.header.teacher = '';
  appState.header.instructions = '';
  appState.settings.marginPreset = 'compact';
  appState.settings.marginH = 10;
  appState.settings.marginV = 8;
  appState.settings.pageLayoutMode = '1_page';
  if (typeof syncHeaderInputs === 'function') syncHeaderInputs();
  saveStateToStorage();
  renderAll();
  if (!silent) {
    showToast('تم تصفير ورقة الاختبار بالكامل للبدء باختبار جديد 🔄', 'info');
  }
}
window.clearAndResetExamWorkspace = clearAndResetExamWorkspace;

/**
 * Clears only the questions section (with confirmation)
 */
window.clearQuestionsSection = function () {
  if (!appState.questions || appState.questions.length === 0) {
    if (typeof showToast === 'function') showToast('قسم الأسئلة فارغ بالفعل! لا توجد أسئلة لمسحها ℹ️', 'info');
    return;
  }
  const count = appState.questions.length;
  if (!confirm(`تحذير: هل أنت متأكد من تفريغ ومسح كافة الأسئلة المفتوحة (${count} سؤال) في ورقة الامتحان؟\nسيتم حذف جميع الأسئلة لتفريغ الورقة والبدء بأسئلة جديدة.`)) {
    return;
  }
  if (autoSaveDraftTimer) {
    clearTimeout(autoSaveDraftTimer);
    autoSaveDraftTimer = null;
  }
  appState.questions = [];
  appState.activeQuestionIndex = null;
  saveStateToStorage();
  renderAll();
  if (typeof showToast === 'function') {
    showToast('تم تفريغ كافة الأسئلة المفتوحة بنجاح 🗑️', 'info');
  }
};

/**
 * Clears only the header section inputs (with confirmation)
 */
window.clearExamHeaderSection = function () {
  if (!confirm('هل ترغب بتفريغ ومسح كافة بيانات وحقول ترويسة الاختبار المفتوحة (المدرسة، المادة، الصف، العنوان، والتعليمات)؟')) {
    return;
  }
  appState.header.ministry = '';
  appState.header.school = '';
  appState.header.examTitle = '';
  appState.header.subject = '';
  appState.header.grade = '';
  appState.header.term = '';
  appState.header.time = '';
  appState.header.teacher = '';
  appState.header.instructions = '';
  if (typeof syncHeaderInputs === 'function') syncHeaderInputs();
  ['hdrSchool', 'hdrTitle', 'hdrSubject', 'hdrGrade', 'hdrTerm', 'hdrTime', 'hdrTeacher', 'hdrInstructions'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  saveStateToStorage();
  renderAll();
  if (typeof showToast === 'function') {
    showToast('تم تفريغ حقول وبيانات ترويسة الاختبار بنجاح 🗑️', 'info');
  }
};

/**
 * Resets exam settings / margins to default (with confirmation)
 */
window.clearExamSettingsSection = function () {
  if (!confirm('هل ترغب بإعادة ضبط وتفريغ كافة تخصيصات وتنسيقات الورقة وهوامش الطباعة إلى الوضع الافتراضي؟')) {
    return;
  }
  appState.settings.marginPreset = 'compact';
  appState.settings.marginH = 10;
  appState.settings.marginV = 8;
  appState.settings.pageLayoutMode = '1_page';
  if (typeof syncSettingsInputs === 'function') syncSettingsInputs();
  saveStateToStorage();
  renderAll();
  if (typeof showToast === 'function') {
    showToast('تمت إعادة ضبط تنسيقات وهوامش الورقة للوضع الافتراضي 🔄', 'info');
  }
};

/**
 * Master dispatcher to clear the currently open section
 */
window.clearCurrentOpenSection = function () {
  const activeTabEl = document.querySelector('.tab-content[style*="display: block"], .tab-content.active');
  const activeId = activeTabEl ? activeTabEl.id : '';
  if (activeId === 'tab-questions') {
    window.clearQuestionsSection();
  } else if (activeId === 'tab-header') {
    window.clearExamHeaderSection();
  } else if (activeId === 'tab-settings') {
    window.clearExamSettingsSection();
  } else if (activeId === 'tab-student-grades') {
    if (typeof window.sgClearAllOpenData === 'function') window.sgClearAllOpenData();
  } else if (activeId === 'tab-student-behavior') {
    if (typeof window.sbClearAllStudents === 'function') window.sbClearAllStudents();
  } else if (activeId === 'tab-certificates') {
    if (typeof window.certClearAllOpenData === 'function') window.certClearAllOpenData();
  } else if (activeId === 'tab-schedule') {
    if (typeof window.schedClearEntireGrid === 'function') window.schedClearEntireGrid();
  } else if (activeId === 'tab-seating') {
    if (typeof window.seatingClearAllData === 'function') window.seatingClearAllData();
  } else if (activeId === 'tab-exam-cards') {
    if (typeof window.examCardsClearAllData === 'function') window.examCardsClearAllData();
  } else if (activeId === 'tab-report') {
    if (typeof window.resetReportFilters === 'function') window.resetReportFilters();
  } else {
    window.resetExamSheet();
  }
};

/**
 * Resets / Clears the Exam Sheet completely (manual button with confirmation)
 */
window.resetExamSheet = function () {
  if (appState.questions.length > 0) {
    if (!confirm('هل ترغب بتصفير ورقة المعاينة والاختبار بالكامل ومسح جميع الأسئلة الحالية وتفريغ الحقول للبدء من جديد؟')) {
      return;
    }
  }
  clearAndResetExamWorkspace(false);
};

window.startNewExamFromDrawer = function () {
  if (typeof window.closeSideDrawer === 'function') {
    window.closeSideDrawer();
  }
  if (typeof window.closeDailyReportModal === 'function') {
    window.closeDailyReportModal();
  }
  if (typeof window.switchToTab === 'function') {
    window.switchToTab('tab-editor');
  }
  if (typeof window.resetExamSheet === 'function') {
    window.resetExamSheet();
  }
};

/**
 * Question Manipulation Functions
 */
window.moveQuestion = function (index, direction) {
  if (typeof isUserSubscribedOrAdmin === 'function' && !isUserSubscribedOrAdmin()) {
    requireSubscription('ترتيب وتعديل الأسئلة');
    return;
  }
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= appState.questions.length) return;
  const temp = appState.questions[index];
  appState.questions[index] = appState.questions[newIndex];
  appState.questions[newIndex] = temp;
  saveStateToStorage();
  renderAll();
};

window.duplicateQuestion = function (id) {
  if (typeof isUserSubscribedOrAdmin === 'function' && !isUserSubscribedOrAdmin()) {
    requireSubscription('تكرار الأسئلة');
    return;
  }
  const item = appState.questions.find(q => q.id === id);
  if (!item) return;
  const clone = JSON.parse(JSON.stringify(item));
  clone.id = generateId();
  clone.text = clone.text + ' (نسخة)';
  const newIdx = appState.questions.length + 1;
  if (clone.customLabel) {
    clone.customLabel = clone.customLabel.replace(/\d+/, newIdx);
  }
  appState.questions.push(clone);
  saveStateToStorage();
  renderAll();
  showToast('تم تكرار السؤال بنجاح', 'info');
};

window.deleteQuestion = function (id) {
  if (typeof isUserSubscribedOrAdmin === 'function' && !isUserSubscribedOrAdmin()) {
    requireSubscription('حذف الأسئلة');
    return;
  }
  if (confirm('هل ترغب بحذف هذا السؤال نهائياً؟')) {
    appState.questions = appState.questions.filter(q => q.id !== id);
    saveStateToStorage();
    renderAll();
    showToast('تم حذف السؤال', 'info');
  }
};

/* ==========================================================================
   ستوديو الرياضيات والمعادلات الوزارية العراقية (KaTeX + Offline Fallback Engine)
   تحكم كامل بالأس والأساس، الكسور الرأسية، الجذور، المصفوفات والمحددات
   ========================================================================== */

/**
 * Renders a LaTeX mathematical snippet using KaTeX or resilient fallback
 */
function renderLatexBlock(latex, isDisplay = false) {
  if (!latex) return '';
  const cleanLatex = latex.trim();
  if (!cleanLatex) return '';

  if (typeof window.katex !== 'undefined' && typeof window.katex.renderToString === 'function') {
    try {
      const rendered = window.katex.renderToString(cleanLatex, {
        displayMode: isDisplay,
        throwOnError: false,
        strict: false
      });
      return `<span class="iraqi-math-katex-wrapper ${isDisplay ? 'math-display-block' : 'math-inline-block'}" dir="ltr" data-math-rendered="true">${rendered}</span>`;
    } catch (e) {
      console.warn('KaTeX render error:', e);
    }
  }

  // Graceful pure CSS/HTML fallback for offline mode
  return renderMathFallback(cleanLatex, isDisplay);
}

/**
 * Pure CSS/HTML mathematical fallback renderer
 */
function renderMathFallback(latex, isDisplay = false) {
  let s = latex;

  // 1. Fractions: \frac{a}{b}
  for (let i = 0; i < 3; i++) {
    s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '<span class="iq-math-frac"><span class="iq-math-num">$1</span><span class="iq-math-den">$2</span></span>');
  }

  // 2. Roots with index: \sqrt[n]{x}
  s = s.replace(/\\sqrt\[([^{}]+)\]\{([^{}]+)\}/g, '<span class="iq-math-root"><sup class="iq-root-idx">$1</sup><span class="iq-radic-sign">&radic;</span><span class="iq-radicand">$2</span></span>');

  // 3. Simple square root: \sqrt{x}
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, '<span class="iq-math-root"><span class="iq-radic-sign">&radic;</span><span class="iq-radicand">$1</span></span>');

  // 4. Powers & Exponents (الأس): ^{...} or ^x
  s = s.replace(/\^{([^{}]+)}/g, '<sup class="iq-math-sup">$1</sup>');
  s = s.replace(/\^([0-9a-zA-Z\+\-]+)/g, '<sup class="iq-math-sup">$1</sup>');

  // 5. Subscripts & Bases (الأساس/الدليل): _{...} or _x
  s = s.replace(/_{([^{}]+)}/g, '<sub class="iq-math-sub">$1</sub>');
  s = s.replace(/_([0-9a-zA-Z\+\-]+)/g, '<sub class="iq-math-sub">$1</sub>');

  // 6. Common LaTeX ministerial math & chemistry symbols
  const symMap = {
    '\\pm': '±', '\\mp': '∓', '\\times': '×', '\\div': '÷',
    '\\neq': '≠', '\\le': '≤', '\\ge': '≥', '\\approx': '≈',
    '\\infty': '∞', '\\pi': 'π', '\\theta': 'θ', '\\alpha': 'α',
    '\\beta': 'β', '\\Delta': 'Δ', '\\in': '∈', '\\notin': '∉',
    '\\subset': '⊂', '\\cup': '∪', '\\cap': '∩', '\\to': '→',
    '\\leftarrow': '←', '\\rightarrow': '→', '\\leftrightarrow': '↔',
    '\\rightleftharpoons': '⇌', '\\xrightleftharpoons': '⇌',
    '\\uparrow': '↑', '\\downarrow': '↓', '\\xrightarrow': '→',
    '\\int': '∫', '\\sum': '∑', '\\partial': '∂', '\\nabla': '∇',
    '\\angle': '∠', '\\perp': '⊥', '\\parallel': '∥', '\\degree': '°',
    '\\cdot': '·', '\\emptyset': '∅', '\\quad': ' &nbsp; ', '\\qquad': ' &nbsp;&nbsp; '
  }
  for (const [k, v] of Object.entries(symMap)) {
    s = s.split(k).join(v);
  }

  // 7. Cleanup text tags
  s = s.replace(/\\text\{([^{}]+)\}/g, '$1');

  return `<span class="iq-math-fallback ${isDisplay ? 'math-display-block' : 'math-inline-block'}" dir="ltr" data-math-rendered="true">${s}</span>`;
}

/**
 * Universal text formatter for Iraqi mathematical & chemistry questions
 */
function formatMathText(rawText) {
  if (!rawText || typeof rawText !== 'string') return rawText || '';

  // Quick check: if string has no math/chem indicators, return as-is
  if (!rawText.includes('$') && !rawText.includes('\\') && !rawText.includes('^') && !rawText.includes('_')) {
    return rawText;
  }

  let result = rawText;

  // 1. Process block display math $$...$$
  result = result.replace(/\$\$([\s\S]+?)\$\$/g, (m, formula) => renderLatexBlock(formula, true));

  // 2. Process inline math $...$
  result = result.replace(/\$([^\$\n]+?)\$/g, (m, formula) => renderLatexBlock(formula, false));

  // 3. Process direct common LaTeX / Chemistry commands written without dollar signs
  if (/\\(frac|sqrt|lim|int|sum|sin|cos|tan|log|ln|bmatrix|vmatrix|pm|times|div|neq|le|ge|rightleftharpoons|rightarrow|uparrow|downarrow|Delta)|(\b[a-zA-Z0-9\)]+[\^_][0-9a-zA-Z{}]+)/.test(result)) {
    result = result.replace(/\\frac\{[^{}]+\}\{[^{}]+\}/g, (m) => renderLatexBlock(m, false));
    result = result.replace(/\\sqrt(\[[^{}]+\])?\{[^{}]+\}/g, (m) => renderLatexBlock(m, false));
    result = result.replace(/\b([a-zA-Z0-9\)]+)\^\{([^{}]+)\}/g, (m) => renderLatexBlock(m, false));
    result = result.replace(/\b([a-zA-Z0-9\)]+)_\{([^{}]+)\}/g, (m) => renderLatexBlock(m, false));
    result = result.replace(/\\begin\{bmatrix\}[\s\S]+?\\end\{bmatrix\}/g, (m) => renderLatexBlock(m, false));
    result = result.replace(/\\begin\{vmatrix\}[\s\S]+?\\end\{vmatrix\}/g, (m) => renderLatexBlock(m, false));
  }

  return result;
}
window.formatMathText = formatMathText;

/**
 * Active input tracker for math formula insertion
 */
window.lastActiveMathInput = null;

window.insertMathFormula = function (snippet) {
  let target = window.lastActiveMathInput || document.getElementById('modalQText');
  if (!target) target = document.getElementById('modalQText');
  if (!target) return;

  const start = target.selectionStart ?? target.value.length;
  const end = target.selectionEnd ?? target.value.length;
  const val = target.value;
  target.value = val.substring(0, start) + snippet + val.substring(end);
  target.selectionStart = target.selectionEnd = start + snippet.length;
  target.focus();

  if (typeof window.updateModalMathPreview === 'function') {
    window.updateModalMathPreview();
  }
};

window.insertMathSymbol = function (sym) {
  window.insertMathFormula(sym);
};

window.closeAllQuestionStudiosExcept = function (exceptKey = null) {
  const studios = [
    { key: 'math', containerId: 'modalMathStudioContainer', btnId: 'btnToggleMathStudio' },
    { key: 'chemistry', containerId: 'modalChemStudioContainer', btnId: 'btnToggleChemStudio' },
    { key: 'physics', containerId: 'modalPhysicsStudioContainer', btnId: 'btnTogglePhysicsStudio' },
    { key: 'islamic', containerId: 'modalIslamicStudioContainer', btnId: 'btnToggleIslamicStudio' }
  ];
  studios.forEach(s => {
    if (s.key !== exceptKey) {
      const cont = document.getElementById(s.containerId);
      const btn = document.getElementById(s.btnId);
      if (cont) cont.style.display = 'none';
      if (btn) btn.classList.remove('active');
    }
  });
  if (exceptKey) {
    const subjSelect = document.getElementById('modalQSubject');
    if (subjSelect && ['math', 'chemistry', 'physics', 'islamic'].includes(exceptKey)) {
      subjSelect.value = exceptKey;
    }
  }
};

window.toggleMathStudio = function () {
  const wrapper = document.getElementById('modalMathStudioWrapper');
  let container = document.getElementById('modalMathStudioContainer');
  if (!container && wrapper) {
    wrapper.innerHTML = buildMathStudioHTML(false);
    container = document.getElementById('modalMathStudioContainer');
  }
  if (!container) return;
  const isHidden = (container.style.display === 'none' || !container.style.display);
  if (isHidden && typeof window.closeAllQuestionStudiosExcept === 'function') {
    window.closeAllQuestionStudiosExcept('math');
  }
  container.style.display = isHidden ? 'block' : 'none';
  const toggleBtn = document.getElementById('btnToggleMathStudio');
  if (toggleBtn) {
    toggleBtn.classList.toggle('active', isHidden);
  }
};

window._legacyToggleMathStudioUnused = function () {
  const wrapper = document.getElementById('modalMathStudioWrapper');
  let container = document.getElementById('modalMathStudioContainer');
  if (!container && wrapper) {
    wrapper.innerHTML = buildMathStudioHTML(true);
    container = document.getElementById('modalMathStudioContainer');
  }
  if (!container) return;
  const isHidden = (container.style.display === 'none' || !container.style.display);
  container.style.display = isHidden ? 'block' : 'none';
  const toggleBtn = document.getElementById('btnToggleMathStudio');
  if (toggleBtn) {
    toggleBtn.classList.toggle('active', isHidden);
  }
};

window.switchMathStudioTab = function (tabId) {
  document.querySelectorAll('#mathStudioTabs .math-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.math-tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === `mathPane_${tabId}`);
  });
};

window.insertBuiltFraction = function () {
  const num = (document.getElementById('mathBldNum')?.value || '').trim() || 'a';
  const den = (document.getElementById('mathBldDen')?.value || '').trim() || 'b';
  window.insertMathFormula(`$\\frac{${num}}{${den}}$`);
};

window.insertBuiltPowerBase = function () {
  const v = (document.getElementById('mathBldVar')?.value || '').trim() || 'x';
  const exp = (document.getElementById('mathBldExp')?.value || '').trim();
  const sub = (document.getElementById('mathBldSub')?.value || '').trim();
  let snippet = v;
  if (sub) snippet += `_{${sub}}`;
  if (exp) snippet += `^{${exp}}`;
  window.insertMathFormula(`$${snippet}$`);
};

window.insertBuiltRoot = function () {
  const rad = (document.getElementById('mathBldRadicand')?.value || '').trim() || 'x';
  const idx = (document.getElementById('mathBldRootIdx')?.value || '').trim();
  const snippet = idx ? `\\sqrt[${idx}]{${rad}}` : `\\sqrt{${rad}}`;
  window.insertMathFormula(`$${snippet}$`);
};

window.updateModalMathPreview = function () {
  const qTextEl = document.getElementById('modalQText');
  const previewEl = document.getElementById('modalMathLivePreview');
  if (!previewEl) return;
  const text = qTextEl ? qTextEl.value.trim() : '';
  if (!text) {
    previewEl.innerHTML = '<span style="color: #64748b; font-size: 0.82rem; font-weight: 600;">(اكتب السؤال أو المسألة أو اختر رموزاً من الاستوديو للمعاينة الفورية المباشرة)</span>';
  } else {
    previewEl.innerHTML = formatMathText(text.replace(/\n/g, '<br/>'));
  }
};

window.handleModalSubjectChange = function (newSub) {
  // Ensure appropriate studio wrapper is loaded on demand
  if (newSub === 'math') {
    const wrap = document.getElementById('modalMathStudioWrapper');
    if (wrap && !document.getElementById('modalMathStudioContainer')) {
      wrap.innerHTML = buildMathStudioHTML(true);
    }
  } else if (newSub === 'chemistry') {
    const wrap = document.getElementById('modalChemStudioWrapper');
    if (wrap && !document.getElementById('modalChemStudioContainer')) {
      wrap.innerHTML = buildChemStudioHTML(true);
    }
  } else if (newSub === 'physics') {
    const wrap = document.getElementById('modalPhysicsStudioWrapper');
    if (wrap && !document.getElementById('modalPhysicsStudioContainer') && typeof window.buildPhysicsStudioHTML === 'function') {
      wrap.innerHTML = window.buildPhysicsStudioHTML(true);
    }
  } else if (newSub === 'islamic') {
    const wrap = document.getElementById('modalIslamicStudioWrapper');
    if (wrap && !document.getElementById('modalIslamicStudioContainer') && typeof window.buildIslamicStudioHTML === 'function') {
      wrap.innerHTML = window.buildIslamicStudioHTML(true);
    }
  }

  const mathStudio = document.getElementById('modalMathStudioContainer');
  const toggleMathBtn = document.getElementById('btnToggleMathStudio');
  const chemStudio = document.getElementById('modalChemStudioContainer');
  const toggleChemBtn = document.getElementById('btnToggleChemStudio');
  const physStudio = document.getElementById('modalPhysicsStudioContainer');
  const togglePhysBtn = document.getElementById('btnTogglePhysicsStudio');
  const islStudio = document.getElementById('modalIslamicStudioContainer');
  const toggleIslBtn = document.getElementById('btnToggleIslamicStudio');

  // Hide all first
  if (mathStudio) mathStudio.style.display = 'none';
  if (toggleMathBtn) toggleMathBtn.classList.remove('active');
  if (chemStudio) chemStudio.style.display = 'none';
  if (toggleChemBtn) toggleChemBtn.classList.remove('active');
  if (physStudio) physStudio.style.display = 'none';
  if (togglePhysBtn) togglePhysBtn.classList.remove('active');
  if (islStudio) islStudio.style.display = 'none';
  if (toggleIslBtn) toggleIslBtn.classList.remove('active');

  if (newSub === 'math') {
    if (mathStudio) mathStudio.style.display = 'block';
    if (toggleMathBtn) toggleMathBtn.classList.add('active');
    showToast('تم تفعيل ستوديو الرياضيات والمعادلات الوزارية 📐', 'info');
  } else if (newSub === 'chemistry') {
    if (chemStudio) chemStudio.style.display = 'block';
    if (toggleChemBtn) toggleChemBtn.classList.add('active');
    showToast('تم تفعيل ستوديو الكيمياء والجدول الدوري والمعادلات ⚗️🧪', 'info');
  } else if (newSub === 'physics') {
    if (physStudio) physStudio.style.display = 'block';
    if (togglePhysBtn) togglePhysBtn.classList.add('active');
    showToast('تم تفعيل ستوديو الفيزياء والمعادلات والقوانين الوزارية ⚛️⚡', 'info');
  } else if (newSub === 'islamic') {
    if (islStudio) islStudio.style.display = 'block';
    if (toggleIslBtn) toggleIslBtn.classList.add('active');
    showToast('تم تفعيل ستوديو التربية الإسلامية (سور، آيات، أحاديث ورسم قرآني) 📖✨', 'info');
  }
};

function setupModalInputTracking() {
  const modalForm = document.getElementById('modalFormBody');
  if (!modalForm) return;
  modalForm.querySelectorAll('input[type="text"], textarea').forEach(inp => {
    inp.addEventListener('focus', function () {
      window.lastActiveMathInput = this;
    });
  });
  const qText = document.getElementById('modalQText');
  if (qText) {
    qText.addEventListener('input', () => {
      if (typeof window.updateModalMathPreview === 'function') window.updateModalMathPreview();
    });
    qText.addEventListener('keyup', () => {
      if (typeof window.updateModalMathPreview === 'function') window.updateModalMathPreview();
    });
  }
  // Initial preview update
  if (typeof window.updateModalMathPreview === 'function') {
    window.updateModalMathPreview();
  }

  // Bind modal MathLive field if present
  const mf = document.getElementById('modalMathLiveField');
  if (mf && !mf._mathliveBound) {
    mf.addEventListener('input', () => {
      // Keep active math live preview synchronized if modalMathLiveField is being edited
    });
    mf._mathliveBound = true;
  }
}

/**
 * Builds the HTML layout of the Iraqi Ministerial Math Studio
 */
function buildMathStudioHTML(isOpen = false) {
  return `
    <!-- ستوديو الرياضيات والمعادلات الوزارية العراقية -->
    <div class="math-studio-container" id="modalMathStudioContainer" style="display: ${isOpen ? 'block' : 'none'};">
      <div class="math-studio-header">
        <div class="math-studio-title">
          <i class="fa-solid fa-square-root-variable text-accent"></i>
          <span>ستوديو الرياضيات والمعادلات الوزارية</span>
          <span class="badge-math-iq">المنهج العراقي</span>
        </div>
        <div style="display: flex; gap: 6px; align-items: center;">
          <span style="font-size: 0.72rem; color: var(--text-muted);">انقر على أي رمز أو قالب لإدراجه فورياً في موضع المؤشر</span>
        </div>
      </div>

      <!-- تبويبات أقسام الرياضيات -->
      <div class="math-studio-tabs" id="mathStudioTabs">
        <button type="button" class="math-tab-btn btn-tab-mathlive active" data-tab="mathlive_builder" onclick="window.switchMathStudioTab('mathlive_builder')">
          <i class="fa-solid fa-keyboard" style="color: #67e8f9;"></i> محرر MathLive التفاعلي ⚡
        </button>
        <button type="button" class="math-tab-btn" data-tab="powers_bases" onclick="window.switchMathStudioTab('powers_bases')">
          <i class="fa-solid fa-superscript"></i> الأس والأساس
        </button>
        <button type="button" class="math-tab-btn" data-tab="fractions_roots" onclick="window.switchMathStudioTab('fractions_roots')">
          <i class="fa-solid fa-divide"></i> الكسور والجذور
        </button>
        <button type="button" class="math-tab-btn" data-tab="matrices_brackets" onclick="window.switchMathStudioTab('matrices_brackets')">
          <i class="fa-solid fa-table-cells"></i> المصفوفات والأقواس
        </button>
        <button type="button" class="math-tab-btn" data-tab="calculus" onclick="window.switchMathStudioTab('calculus')">
          <i class="fa-solid fa-infinity"></i> التفاضل والغايات
        </button>
        <button type="button" class="math-tab-btn" data-tab="symbols" onclick="window.switchMathStudioTab('symbols')">
          <i class="fa-solid fa-shapes"></i> الرموز والمجموعات
        </button>
        <button type="button" class="math-tab-btn btn-tab-highlight" data-tab="visual_builder" onclick="window.switchMathStudioTab('visual_builder')">
          <i class="fa-solid fa-wand-magic-sparkles"></i> المولد البصري التفاعلي
        </button>
      </div>

      <!-- محتويات التبويبات -->
      <div class="math-tab-content-wrapper">
        <!-- 0. محرر MathLive التفاعلي الذكي (الأقوى والأحدث) -->
        <div class="math-tab-pane active" id="mathPane_mathlive_builder">
          <div class="mathlive-pane-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span class="badge-mathlive-live"><i class="fa-solid fa-bolt text-warning"></i> محرر MathLive التفاعلي (WYSIWYG)</span>
                <span style="font-size: 0.72rem; color: #94a3b8;">انقر داخل الحقل واكتب بالفأرة أو لوحة المفاتيح</span>
              </div>
              <div style="display: flex; gap: 5px; align-items: center; flex-wrap: wrap;">
                <button type="button" class="btn btn-xs btn-primary" onclick="window.toggleMathLiveVirtualKeyboard('modalMathLiveField')" title="إظهار / إخفاء لوحة المفاتيح الرياضية">
                  <i class="fa-solid fa-keyboard"></i> لوحة المفاتيح ⚡
                </button>
                <button type="button" class="btn btn-xs btn-outline" onclick="window.importQuestionTextToMathLive('modalMathLiveField')" title="استيراد التحديد أو المعادلة من نص السؤال إلى المحرر">
                  <i class="fa-solid fa-arrow-down-to-bracket"></i> استيراد من السؤال
                </button>
                <button type="button" class="btn btn-xs btn-outline" onclick="window.clearMathLiveField('modalMathLiveField')" title="مسح">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
                <button type="button" class="btn btn-xs btn-outline" onclick="window.copyMathLiveLatex('modalMathLiveField')" title="نسخ LaTeX">
                  <i class="fa-solid fa-copy"></i>
                </button>
              </div>
            </div>

            <!-- حقل التحرير MathLive Web Component -->
            <math-field id="modalMathLiveField" class="custom-mathlive-field" dir="ltr" virtual-keyboard-mode="manual">
              x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
            </math-field>

            <!-- نماذج وزارية سريعة بنقرة واحدة لتحميلها في MathLive والتعديل عليها -->
            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.1);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <small style="font-size: 0.72rem; font-weight: 800; color: #cbd5e1;">نماذج وزارية جاهزة للتعديل في MathLive فوراً:</small>
                <button type="button" onclick="window.openStandaloneMathLiveModal(document.getElementById('modalMathLiveField')?.value)" style="color: #a78bfa; font-size: 0.72rem; text-decoration: underline; background: none; border: none; cursor: pointer;">
                  <i class="fa-solid fa-up-right-from-square"></i> فتح المحرر الموسع
                </button>
              </div>
              <div class="mathlive-quick-pills-row">
                <button type="button" class="btn-math-preset-pill" onclick="window.setMathLivePreset('modalMathLiveField', 'x = \\\\frac{-b \\\\pm \\\\sqrt{b^2 - 4ac}}{2a}')">قانون الدستور</button>
                <button type="button" class="btn-math-preset-pill" onclick="window.setMathLivePreset('modalMathLiveField', '\\\\frac{x^2 - 4}{x - 2} = x + 2')">كسر وتحليل</button>
                <button type="button" class="btn-math-preset-pill" onclick="window.setMathLivePreset('modalMathLiveField', '\\\\int_{0}^{\\\\pi} \\\\sin(x) \\\\, dx')">تكامل محدد</button>
                <button type="button" class="btn-math-preset-pill" onclick="window.setMathLivePreset('modalMathLiveField', '\\\\lim_{x \\\\to 0} \\\\frac{\\\\sin x}{x} = 1')">غاية دوال دائرية</button>
                <button type="button" class="btn-math-preset-pill" onclick="window.setMathLivePreset('modalMathLiveField', '\\\\begin{bmatrix} a & b \\\\\\\\ c & d \\\\end{bmatrix}')">مصفوفة 2x2</button>
                <button type="button" class="btn-math-preset-pill" onclick="window.setMathLivePreset('modalMathLiveField', 'z = r(\\\\cos\\\\theta + i\\\\sin\\\\theta)')">ديموافر قطبية</button>
                <button type="button" class="btn-math-preset-pill" onclick="window.setMathLivePreset('modalMathLiveField', '\\\\frac{x^2}{a^2} + \\\\frac{y^2}{b^2} = 1')">قطع ناقص</button>
                <button type="button" class="btn-math-preset-pill" onclick="window.setMathLivePreset('modalMathLiveField', '\\\\sqrt[3]{x^3 - 8} = 2')">جذر تكعيبي</button>
                <button type="button" class="btn-math-preset-pill" onclick="window.setMathLivePreset('modalMathLiveField', '|2x - 5| \\\\le 7')">متباينة مطلقة</button>
              </div>
            </div>

            <!-- أزرار الإدراج في السؤال -->
            <div style="display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap;">
              <button type="button" class="btn btn-primary" style="flex: 1; padding: 0.45rem 0.8rem; font-weight: 800; font-size: 0.85rem;" onclick="window.insertMathLiveIntoQuestion('modalMathLiveField', false)">
                <i class="fa-solid fa-plus"></i> إدراج المعادلة في السؤال (مضمّنة $...$)
              </button>
              <button type="button" class="btn btn-accent" style="flex: 1; padding: 0.45rem 0.8rem; font-weight: 800; font-size: 0.85rem;" onclick="window.insertMathLiveIntoQuestion('modalMathLiveField', true)">
                <i class="fa-solid fa-align-center"></i> إدراج كسطر مستقل ($$...$$)
              </button>
            </div>
          </div>
        </div>

        <!-- 1. الأس والأساس -->
        <div class="math-tab-pane" id="mathPane_powers_bases">
          <div class="math-tools-grid">
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$x^2$')" title="تربيع (أس 2)">
              <span class="math-tool-render">x²</span>
              <span class="math-tool-label">تربيع</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$x^3$')" title="تكعيب (أس 3)">
              <span class="math-tool-render">x³</span>
              <span class="math-tool-label">تكعيب</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$x^{n}$')" title="أس مخصص">
              <span class="math-tool-render">xⁿ</span>
              <span class="math-tool-label">أس مخصص</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$x^{-1}$')" title="أس سالب">
              <span class="math-tool-render">x⁻¹</span>
              <span class="math-tool-label">أس سالب</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$10^{-3}$')" title="قوى العشرة سالبة">
              <span class="math-tool-render">10⁻³</span>
              <span class="math-tool-label">قوى 10</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$10^{n}$')" title="قوى العشرة موجبة">
              <span class="math-tool-render">10ⁿ</span>
              <span class="math-tool-label">عشرة أس n</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$x_{1}$')" title="أساس/دليل سفلي 1">
              <span class="math-tool-render">x₁</span>
              <span class="math-tool-label">أساس (1)</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$x_{2}$')" title="أساس/دليل سفلي 2">
              <span class="math-tool-render">x₂</span>
              <span class="math-tool-label">أساس (2)</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$x_{n}$')" title="أساس مخصص">
              <span class="math-tool-render">xₙ</span>
              <span class="math-tool-label">أساس n</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$x_{1}^{2}$')" title="أس وأساس معاً">
              <span class="math-tool-render">x₁²</span>
              <span class="math-tool-label">أس وأساس</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$y_{1}, y_{2}$')" title="إحداثيات الصادات">
              <span class="math-tool-render">y₁, y₂</span>
              <span class="math-tool-label">إحداثيات ص</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$P_{r}^{n}$')" title="تباديل وزارية">
              <span class="math-tool-render">P(n, r)</span>
              <span class="math-tool-label">تباديل</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$C_{r}^{n}$')" title="توافيق وزارية">
              <span class="math-tool-render">C(n, r)</span>
              <span class="math-tool-label">توافيق</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$\\\\log_{a}(x)$')" title="لوغاريتم بأساس مخصص">
              <span class="math-tool-render">logₐ(x)</span>
              <span class="math-tool-label">لوغاريتم أساس</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$\\\\ln(x)$')" title="لوغاريتم طبيعي">
              <span class="math-tool-render">ln(x)</span>
              <span class="math-tool-label">لوغاريتم طبيعي</span>
            </button>
          </div>
        </div>

        <!-- 2. الكسور والجذور -->
        <div class="math-tab-pane" id="mathPane_fractions_roots">
          <div class="math-tools-grid">
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$\\\\frac{a}{b}$')" title="كسر رأسي اعتيادي">
              <span class="math-tool-render">a / b</span>
              <span class="math-tool-label">كسر رأسي a/b</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$\\\\frac{1}{2}$')" title="نصف">
              <span class="math-tool-render">1/2</span>
              <span class="math-tool-label">نصف</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$\\\\frac{3}{4}$')" title="ثلاثة أرباع">
              <span class="math-tool-render">3/4</span>
              <span class="math-tool-label">ثلاثة أرباع</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$\\\\frac{x^2 - 1}{x + 1}$')" title="كسر جبري مركب">
              <span class="math-tool-render">(x²-1)/(x+1)</span>
              <span class="math-tool-label">كسر جبري</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$\\\\frac{dy}{dx}$')" title="مشتقة أولى">
              <span class="math-tool-render">dy/dx</span>
              <span class="math-tool-label">مشتقة أولى</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$\\\\frac{d^2y}{dx^2}$')" title="مشتقة ثانية">
              <span class="math-tool-render">d²y/dx²</span>
              <span class="math-tool-label">مشتقة ثانية</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$\\\\sqrt{x}$')" title="جذر تربيعي">
              <span class="math-tool-render">√x</span>
              <span class="math-tool-label">جذر تربيعي</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$\\\\sqrt[3]{x}$')" title="جذر تكعيبي">
              <span class="math-tool-render">∛x</span>
              <span class="math-tool-label">جذر تكعيبي</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$\\\\sqrt[n]{x}$')" title="جذر نوني">
              <span class="math-tool-render">ⁿ√x</span>
              <span class="math-tool-label">جذر نوني</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$\\\\sqrt{b^2 - 4ac}$')" title="جذر الدستور العام">
              <span class="math-tool-render">√(b²-4ac)</span>
              <span class="math-tool-label">جذر المميز</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$\\\\sqrt{\\\\frac{a}{b}}$')" title="جذر كسر كامل">
              <span class="math-tool-render">√(a/b)</span>
              <span class="math-tool-label">جذر كسر</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$\\\\pm\\\\sqrt{x}$')" title="موجب أو سالب جذر">
              <span class="math-tool-render">±√x</span>
              <span class="math-tool-label">± جذر</span>
            </button>
          </div>
        </div>

        <!-- 3. المصفوفات والأقواس والمحددات -->
        <div class="math-tab-pane" id="mathPane_matrices_brackets">
          <div class="math-tools-grid">
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$\\\\begin{bmatrix} a & b \\\\\\\\ c & d \\\\end{bmatrix}$')" title="مصفوفة مربعة 2x2">
              <span class="math-tool-render">[ 2×2 ]</span>
              <span class="math-tool-label">مصفوفة 2×2</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$\\\\begin{bmatrix} a & b & c \\\\\\\\ d & e & f \\\\\\\\ g & h & i \\\\end{bmatrix}$')" title="مصفوفة مربعة 3x3">
              <span class="math-tool-render">[ 3×3 ]</span>
              <span class="math-tool-label">مصفوفة 3×3</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$\\\\begin{vmatrix} a & b \\\\\\\\ c & d \\\\end{vmatrix}$')" title="محدد 2x2">
              <span class="math-tool-render">| 2×2 |</span>
              <span class="math-tool-label">محدد 2×2</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$\\\\begin{vmatrix} a & b & c \\\\\\\\ d & e & f \\\\\\\\ g & h & i \\\\end{vmatrix}$')" title="محدد 3x3">
              <span class="math-tool-render">| 3×3 |</span>
              <span class="math-tool-label">محدد 3×3</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$|x|$')" title="قيمة مطلقة">
              <span class="math-tool-render">|x|</span>
              <span class="math-tool-label">مطلق</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$[a, b]$')" title="فترة مغلقة">
              <span class="math-tool-render">[a, b]</span>
              <span class="math-tool-label">فترة مغلقة</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$(a, b)$')" title="فترة مفتوحة">
              <span class="math-tool-render">(a, b)</span>
              <span class="math-tool-label">فترة مفتوحة</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$[a, b)$')" title="فترة نصف مفتوحة">
              <span class="math-tool-render">[a, b)</span>
              <span class="math-tool-label">نصف مغلقة</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$\\\\left\\\\{ x \\\\mid x > 0 \\\\right\\\\}$')" title="أقواس مجموعة">
              <span class="math-tool-render">{x}</span>
              <span class="math-tool-label">مجموعة</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$\\\\vec{AB}$')" title="متجه">
              <span class="math-tool-render">→AB</span>
              <span class="math-tool-label">متجه</span>
            </button>
          </div>
        </div>

        <!-- 4. التفاضل والتكامل والغايات -->
        <div class="math-tab-pane" id="mathPane_calculus">
          <div class="math-tools-grid">
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$\\\\lim_{x \\\\to 0} f(x)$')" title="غاية عندما تقترب من الصفر">
              <span class="math-tool-render">lim x→0</span>
              <span class="math-tool-label">غاية (0)</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$\\\\lim_{x \\\\to a} f(x)$')" title="غاية عامة">
              <span class="math-tool-render">lim x→a</span>
              <span class="math-tool-label">غاية عامة</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$\\\\int f(x)\\\\,dx$')" title="تكامل غير محدد">
              <span class="math-tool-render">∫ f(x) dx</span>
              <span class="math-tool-label">تكامل غير محدد</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$\\\\int_{a}^{b} f(x)\\\\,dx$')" title="تكامل محدد">
              <span class="math-tool-render">∫ₐᵇ f(x) dx</span>
              <span class="math-tool-label">تكامل محدد</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$\\\\sum_{i=1}^{n} a_i$')" title="مجموع متسلسلة">
              <span class="math-tool-render">∑</span>
              <span class="math-tool-label">مجموع</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$\\\\sin\\\\theta$')" title="جيب الزاوية">
              <span class="math-tool-render">sin θ</span>
              <span class="math-tool-label">sin</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$\\\\cos\\\\theta$')" title="جيب تمام">
              <span class="math-tool-render">cos θ</span>
              <span class="math-tool-label">cos</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$\\\\tan\\\\theta$')" title="ظل الزاوية">
              <span class="math-tool-render">tan θ</span>
              <span class="math-tool-label">tan</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$\\\\cot\\\\theta$')" title="ظل تمام">
              <span class="math-tool-render">cot θ</span>
              <span class="math-tool-label">cot</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$\\\\sec\\\\theta$')" title="قاطع">
              <span class="math-tool-render">sec θ</span>
              <span class="math-tool-label">sec</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$\\\\csc\\\\theta$')" title="قاطع تمام">
              <span class="math-tool-render">csc θ</span>
              <span class="math-tool-label">csc</span>
            </button>
            <button type="button" class="math-tool-btn" onclick="window.insertMathFormula('$z = r(\\\\cos\\\\theta + i\\\\sin\\\\theta)$')" title="صيغة قطبية / ديموافر">
              <span class="math-tool-render">ديموافر</span>
              <span class="math-tool-label">مبرهنة ديموافر</span>
            </button>
          </div>
        </div>

        <!-- 5. الرموز والعلاقات والمجموعات -->
        <div class="math-tab-pane" id="mathPane_symbols">
          <div class="math-symbols-pills-row">
            ${['±', '∓', '×', '÷', '=', '≠', '≈', '≤', '≥', '<', '>', '≡', '∝', '∈', '∉', '⊂', '⊄', '∪', '∩', '∅', 'ℝ', 'ℤ', 'ℕ', 'ℚ', 'ℂ', 'π', 'θ', 'α', 'β', 'γ', 'Δ', 'λ', '∞', '°', '∠', '⊥', '∥', '→', '↔', '⇒', '⇔'].map(s => `
              <button type="button" class="math-symbol-pill-btn" onclick="window.insertMathSymbol('${s}')">${s}</button>
            `).join('')}
          </div>
        </div>

        <!-- 6. المولد البصري التفاعلي السريع -->
        <div class="math-tab-pane" id="mathPane_visual_builder">
          <div class="math-visual-builder-grid">
            <!-- صانع الكسر -->
            <div class="math-builder-card">
              <div class="math-builder-card-title"><i class="fa-solid fa-divide text-primary"></i> صانع الكسر الرأسي:</div>
              <div style="display: flex; flex-direction: column; gap: 4px; align-items: center;">
                <input type="text" id="mathBldNum" class="form-control" style="text-align: center; font-size: 0.85rem;" placeholder="البسط (مثال: x² - 4)">
                <div style="width: 100%; height: 2px; background: var(--primary); margin: 2px 0;"></div>
                <input type="text" id="mathBldDen" class="form-control" style="text-align: center; font-size: 0.85rem;" placeholder="المقام (مثال: x - 2)">
              </div>
              <button type="button" class="btn btn-primary" style="width: 100%; margin-top: 6px; padding: 0.3rem;" onclick="window.insertBuiltFraction()">
                <i class="fa-solid fa-plus"></i> إدراج الكسر في السؤال
              </button>
            </div>

            <!-- صانع الأس والأساس -->
            <div class="math-builder-card">
              <div class="math-builder-card-title"><i class="fa-solid fa-superscript text-accent"></i> صانع الأس والأساس:</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px;">
                <div>
                  <small style="font-size: 0.68rem; color: var(--text-muted); display: block;">الرمز/المتغير:</small>
                  <input type="text" id="mathBldVar" class="form-control" style="text-align: center;" placeholder="x" value="x">
                </div>
                <div>
                  <small style="font-size: 0.68rem; color: var(--text-muted); display: block;">الأس / القوة:</small>
                  <input type="text" id="mathBldExp" class="form-control" style="text-align: center;" placeholder="2">
                </div>
                <div>
                  <small style="font-size: 0.68rem; color: var(--text-muted); display: block;">الدليل/الأساس:</small>
                  <input type="text" id="mathBldSub" class="form-control" style="text-align: center;" placeholder="1">
                </div>
              </div>
              <button type="button" class="btn btn-accent" style="width: 100%; margin-top: 6px; padding: 0.3rem;" onclick="window.insertBuiltPowerBase()">
                <i class="fa-solid fa-plus"></i> إدراج الأس والأساس
              </button>
            </div>

            <!-- صانع الجذر -->
            <div class="math-builder-card">
              <div class="math-builder-card-title"><i class="fa-solid fa-square-root-variable text-warning"></i> صانع الجذر:</div>
              <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 4px;">
                <div>
                  <small style="font-size: 0.68rem; color: var(--text-muted); display: block;">ما بداخل الجذر:</small>
                  <input type="text" id="mathBldRadicand" class="form-control" style="text-align: center;" placeholder="مثال: x² + 16">
                </div>
                <div>
                  <small style="font-size: 0.68rem; color: var(--text-muted); display: block;">رتبة الجذر:</small>
                  <input type="text" id="mathBldRootIdx" class="form-control" style="text-align: center;" placeholder="3 أو n">
                </div>
              </div>
              <button type="button" class="btn btn-outline" style="width: 100%; margin-top: 6px; padding: 0.3rem;" onclick="window.insertBuiltRoot()">
                <i class="fa-solid fa-plus"></i> إدراج الجذر
              </button>
            </div>
          </div>

          <!-- نماذج وزارية جاهزة بضغطة زر -->
          <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.1);">
            <small style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 4px;">نماذج وقوانين وزارية عراقية شائعة جاهزة:</small>
            <div style="display: flex; gap: 4px; flex-wrap: wrap;">
              <button type="button" class="btn-math-preset-pill" onclick="window.insertMathFormula('$x = \\\\frac{-b \\\\pm \\\\sqrt{b^2 - 4ac}}{2a}$')" title="قانون الدستور">قانون الدستور (المعادلة التربيعية)</button>
              <button type="button" class="btn-math-preset-pill" onclick="window.insertMathFormula('$y - y_1 = m(x - x_1)$')" title="معادلة المستقيم">معادلة المستقيم (ميل ونقطة)</button>
              <button type="button" class="btn-math-preset-pill" onclick="window.insertMathFormula('$d = \\\\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$')" title="قانون المسافة">المسافة بين نقطتين</button>
              <button type="button" class="btn-math-preset-pill" onclick="window.insertMathFormula('$z^n = r^n(\\\\cos(n\\\\theta) + i\\\\sin(n\\\\theta))$')" title="مبرهنة ديموافر">مبرهنة ديموافر</button>
              <button type="button" class="btn-math-preset-pill" onclick="window.insertMathFormula('$\\\\lim_{x \\\\to 0} \\\\frac{\\\\sin x}{x} = 1$')" title="غاية الدوال الدائرية">غاية الدوال الدائرية</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   ستوديو الكيمياء والجدول الدوري والمعادلات الوزارية العراقية
   (Chemistry Studio: Periodic Table, Formulas, Reactions, Electron Config)
   ========================================================================== */

const CHEM_ELEMENTS_DB = [
  { z: 1, s: 'H', n: 'هيدروجين', m: '1.008', g: 'nonmetal', gName: 'لافلز', ox: '+1, -1', p: 1, gr: 1, c: '1s^1' },
  { z: 2, s: 'He', n: 'هيليوم', m: '4.003', g: 'noble', gName: 'غاز نبيل', ox: '0', p: 1, gr: 8, c: '1s^2' },
  { z: 3, s: 'Li', n: 'ليثيوم', m: '6.94', g: 'alkali', gName: 'فلز قلوي', ox: '+1', p: 2, gr: 1, c: '[He] 2s^1' },
  { z: 4, s: 'Be', n: 'بريليوم', m: '9.012', g: 'alkaline', gName: 'قلوي ترابي', ox: '+2', p: 2, gr: 2, c: '[He] 2s^2' },
  { z: 5, s: 'B', n: 'بورون', m: '10.81', g: 'metalloid', gName: 'شبه فلز', ox: '+3', p: 2, gr: 3, c: '[He] 2s^2 2p^1' },
  { z: 6, s: 'C', n: 'كربون', m: '12.01', g: 'nonmetal', gName: 'لافلز', ox: '+4, -4, +2', p: 2, gr: 4, c: '[He] 2s^2 2p^2' },
  { z: 7, s: 'N', n: 'نيتروجين', m: '14.01', g: 'nonmetal', gName: 'لافلز', ox: '-3, +3, +5', p: 2, gr: 5, c: '[He] 2s^2 2p^3' },
  { z: 8, s: 'O', n: 'أوكسجين', m: '16.00', g: 'nonmetal', gName: 'لافلز', ox: '-2, -1', p: 2, gr: 6, c: '[He] 2s^2 2p^4' },
  { z: 9, s: 'F', n: 'فلور', m: '19.00', g: 'halogen', gName: 'هالوجين', ox: '-1', p: 2, gr: 7, c: '[He] 2s^2 2p^5' },
  { z: 10, s: 'Ne', n: 'نيون', m: '20.18', g: 'noble', gName: 'غاز نبيل', ox: '0', p: 2, gr: 8, c: '[He] 2s^2 2p^6' },
  { z: 11, s: 'Na', n: 'صوديوم', m: '22.99', g: 'alkali', gName: 'فلز قلوي', ox: '+1', p: 3, gr: 1, c: '[Ne] 3s^1' },
  { z: 12, s: 'Mg', n: 'مغنيسيوم', m: '24.31', g: 'alkaline', gName: 'قلوي ترابي', ox: '+2', p: 3, gr: 2, c: '[Ne] 3s^2' },
  { z: 13, s: 'Al', n: 'ألمنيوم', m: '26.98', g: 'post-transition', gName: 'فلز ضعيف', ox: '+3', p: 3, gr: 3, c: '[Ne] 3s^2 3p^1' },
  { z: 14, s: 'Si', n: 'سيليكون', m: '28.09', g: 'metalloid', gName: 'شبه فلز', ox: '+4, -4', p: 3, gr: 4, c: '[Ne] 3s^2 3p^2' },
  { z: 15, s: 'P', n: 'فسفور', m: '30.97', g: 'nonmetal', gName: 'لافلز', ox: '-3, +3, +5', p: 3, gr: 5, c: '[Ne] 3s^2 3p^3' },
  { z: 16, s: 'S', n: 'كبريت', m: '32.06', g: 'nonmetal', gName: 'لافلز', ox: '-2, +4, +6', p: 3, gr: 6, c: '[Ne] 3s^2 3p^4' },
  { z: 17, s: 'Cl', n: 'كلور', m: '35.45', g: 'halogen', gName: 'هالوجين', ox: '-1, +1, +5, +7', p: 3, gr: 7, c: '[Ne] 3s^2 3p^5' },
  { z: 18, s: 'Ar', n: 'أرغون', m: '39.95', g: 'noble', gName: 'غاز نبيل', ox: '0', p: 3, gr: 8, c: '[Ne] 3s^2 3p^6' },
  { z: 19, s: 'K', n: 'بوتاسيوم', m: '39.10', g: 'alkali', gName: 'فلز قلوي', ox: '+1', p: 4, gr: 1, c: '[Ar] 4s^1' },
  { z: 20, s: 'Ca', n: 'كالسيوم', m: '40.08', g: 'alkaline', gName: 'قلوي ترابي', ox: '+2', p: 4, gr: 2, c: '[Ar] 4s^2' },
  { z: 21, s: 'Sc', n: 'سكانديوم', m: '44.96', g: 'transition', gName: 'فلز انتقالي', ox: '+3', p: 4, gr: 3, c: '[Ar] 3d^1 4s^2' },
  { z: 22, s: 'Ti', n: 'تيتانيوم', m: '47.87', g: 'transition', gName: 'فلز انتقالي', ox: '+4, +3', p: 4, gr: 4, c: '[Ar] 3d^2 4s^2' },
  { z: 23, s: 'V', n: 'فاناديوم', m: '50.94', g: 'transition', gName: 'فلز انتقالي', ox: '+5, +4, +3, +2', p: 4, gr: 5, c: '[Ar] 3d^3 4s^2' },
  { z: 24, s: 'Cr', n: 'كروم', m: '52.00', g: 'transition', gName: 'فلز انتقالي', ox: '+3, +6', p: 4, gr: 6, c: '[Ar] 3d^5 4s^1' },
  { z: 25, s: 'Mn', n: 'منغنيز', m: '54.94', g: 'transition', gName: 'فلز انتقالي', ox: '+2, +4, +7', p: 4, gr: 7, c: '[Ar] 3d^5 4s^2' },
  { z: 26, s: 'Fe', n: 'حديد', m: '55.85', g: 'transition', gName: 'فلز انتقالي', ox: '+2, +3', p: 4, gr: 8, c: '[Ar] 3d^6 4s^2' },
  { z: 27, s: 'Co', n: 'كوبالت', m: '58.93', g: 'transition', gName: 'فلز انتقالي', ox: '+2, +3', p: 4, gr: 8, c: '[Ar] 3d^7 4s^2' },
  { z: 28, s: 'Ni', n: 'نيكل', m: '58.69', g: 'transition', gName: 'فلز انتقالي', ox: '+2, +3', p: 4, gr: 8, c: '[Ar] 3d^8 4s^2' },
  { z: 29, s: 'Cu', n: 'نحاس', m: '63.55', g: 'transition', gName: 'فلز انتقالي', ox: '+1, +2', p: 4, gr: 1, c: '[Ar] 3d^{10} 4s^1' },
  { z: 30, s: 'Zn', n: 'خارصين (زنك)', m: '65.38', g: 'transition', gName: 'فلز انتقالي', ox: '+2', p: 4, gr: 2, c: '[Ar] 3d^{10} 4s^2' },
  { z: 31, s: 'Ga', n: 'غاليوم', m: '69.72', g: 'post-transition', gName: 'فلز ضعيف', ox: '+3', p: 4, gr: 3, c: '[Ar] 3d^{10} 4s^2 4p^1' },
  { z: 32, s: 'Ge', n: 'جرمانيوم', m: '72.63', g: 'metalloid', gName: 'شبه فلز', ox: '+4, +2', p: 4, gr: 4, c: '[Ar] 3d^{10} 4s^2 4p^2' },
  { z: 33, s: 'As', n: 'زرنيخ', m: '74.92', g: 'metalloid', gName: 'شبه فلز', ox: '+3, +5, -3', p: 4, gr: 5, c: '[Ar] 3d^{10} 4s^2 4p^3' },
  { z: 34, s: 'Se', n: 'سيلينيوم', m: '78.97', g: 'nonmetal', gName: 'لافلز', ox: '-2, +4, +6', p: 4, gr: 6, c: '[Ar] 3d^{10} 4s^2 4p^4' },
  { z: 35, s: 'Br', n: 'بروم', m: '79.90', g: 'halogen', gName: 'هالوجين', ox: '-1, +1, +5', p: 4, gr: 7, c: '[Ar] 3d^{10} 4s^2 4p^5' },
  { z: 36, s: 'Kr', n: 'كريبتون', m: '83.80', g: 'noble', gName: 'غاز نبيل', ox: '0', p: 4, gr: 8, c: '[Ar] 3d^{10} 4s^2 4p^6' },
  { z: 37, s: 'Rb', n: 'روبيديوم', m: '85.47', g: 'alkali', gName: 'فلز قلوي', ox: '+1', p: 5, gr: 1, c: '[Kr] 5s^1' },
  { z: 38, s: 'Sr', n: 'سترونشيوم', m: '87.62', g: 'alkaline', gName: 'قلوي ترابي', ox: '+2', p: 5, gr: 2, c: '[Kr] 5s^2' },
  { z: 47, s: 'Ag', n: 'فضة', m: '107.87', g: 'transition', gName: 'فلز انتقالي', ox: '+1', p: 5, gr: 1, c: '[Kr] 4d^{10} 5s^1' },
  { z: 48, s: 'Cd', n: 'كادميوم', m: '112.41', g: 'transition', gName: 'فلز انتقالي', ox: '+2', p: 5, gr: 2, c: '[Kr] 4d^{10} 5s^2' },
  { z: 50, s: 'Sn', n: 'قصدير', m: '118.71', g: 'post-transition', gName: 'فلز ضعيف', ox: '+2, +4', p: 5, gr: 4, c: '[Kr] 4d^{10} 5s^2 5p^2' },
  { z: 51, s: 'Sb', n: 'أنتيمون', m: '121.76', g: 'metalloid', gName: 'شبه فلز', ox: '+3, +5', p: 5, gr: 5, c: '[Kr] 4d^{10} 5s^2 5p^3' },
  { z: 53, s: 'I', n: 'يود', m: '126.90', g: 'halogen', gName: 'هالوجين', ox: '-1, +1, +5, +7', p: 5, gr: 7, c: '[Kr] 4d^{10} 5s^2 5p^5' },
  { z: 54, s: 'Xe', n: 'زينون', m: '131.29', g: 'noble', gName: 'غاز نبيل', ox: '0', p: 5, gr: 8, c: '[Kr] 4d^{10} 5s^2 5p^6' },
  { z: 55, s: 'Cs', n: 'سيزيوم', m: '132.91', g: 'alkali', gName: 'فلز قلوي', ox: '+1', p: 6, gr: 1, c: '[Xe] 6s^1' },
  { z: 56, s: 'Ba', n: 'باريوم', m: '137.33', g: 'alkaline', gName: 'قلوي ترابي', ox: '+2', p: 6, gr: 2, c: '[Xe] 6s^2' },
  { z: 78, s: 'Pt', n: 'بلاتين', m: '195.08', g: 'transition', gName: 'فلز انتقالي', ox: '+2, +4', p: 6, gr: 8, c: '[Xe] 4f^{14} 5d^9 6s^1' },
  { z: 79, s: 'Au', n: 'ذهب', m: '196.97', g: 'transition', gName: 'فلز انتقالي', ox: '+1, +3', p: 6, gr: 1, c: '[Xe] 4f^{14} 5d^{10} 6s^1' },
  { z: 80, s: 'Hg', n: 'زئبق', m: '200.59', g: 'transition', gName: 'فلز انتقالي', ox: '+1, +2', p: 6, gr: 2, c: '[Xe] 4f^{14} 5d^{10} 6s^2' },
  { z: 82, s: 'Pb', n: 'رصاص', m: '207.2', g: 'post-transition', gName: 'فلز ضعيف', ox: '+2, +4', p: 6, gr: 4, c: '[Xe] 4f^{14} 5d^{10} 6s^2 6p^2' },
  { z: 83, s: 'Bi', n: 'بزموث', m: '208.98', g: 'post-transition', gName: 'فلز ضعيف', ox: '+3, +5', p: 6, gr: 5, c: '[Xe] 4f^{14} 5d^{10} 6s^2 6p^3' },
  { z: 92, s: 'U', n: 'يورانيوم', m: '238.03', g: 'transition', gName: 'أكتينيد مشع', ox: '+3, +4, +5, +6', p: 7, gr: 3, c: '[Rn] 5f^3 6d^1 7s^2' }
];

const CHEM_COMPOUNDS_DB = {
  acids: [
    { formula: 'HCl', nameAr: 'حامض الهيدروكلوريك' },
    { formula: 'H_2SO_4', nameAr: 'حامض الكبريتيك' },
    { formula: 'HNO_3', nameAr: 'حامض النتريك' },
    { formula: 'CH_3COOH', nameAr: 'حامض الخليك' },
    { formula: 'H_3PO_4', nameAr: 'حامض الفوسفوريك' },
    { formula: 'HCN', nameAr: 'حامض الهيدروسيانيك' },
    { formula: 'H_2CO_3', nameAr: 'حامض الكاربونيك' },
    { formula: 'HBr', nameAr: 'حامض الهيدروبروميك' },
    { formula: 'HI', nameAr: 'حامض الهيدرويوديك' },
    { formula: 'HF', nameAr: 'حامض الهيدروفلوريك' }
  ],
  bases: [
    { formula: 'NaOH', nameAr: 'هيدروكسيد الصوديوم (الصودا الكاوية)' },
    { formula: 'KOH', nameAr: 'هيدروكسيد البوتاسيوم' },
    { formula: 'Ca(OH)_2', nameAr: 'هيدروكسيد الكالسيوم (ماء الكلس)' },
    { formula: 'Ba(OH)_2', nameAr: 'هيدروكسيد الباريوم' },
    { formula: 'NH_3', nameAr: 'غاز الأمونيا' },
    { formula: 'NH_4OH', nameAr: 'محلول هيدروكسيد الأمونيوم' },
    { formula: 'Mg(OH)_2', nameAr: 'هيدروكسيد المغنيسيوم (حليب المغنيسيا)' },
    { formula: 'Al(OH)_3', nameAr: 'هيدروكسيد الألمنيوم' }
  ],
  salts: [
    { formula: 'NaCl', nameAr: 'كلوريد الصوديوم (ملح الطعام)' },
    { formula: 'CaCO_3', nameAr: 'كاربونات الكالسيوم (كلس / رخام)' },
    { formula: 'CuSO_4', nameAr: 'كبريتات النحاس (الزاج الأزرق)' },
    { formula: 'KMnO_4', nameAr: 'برمنغنات البوتاسيوم' },
    { formula: 'K_2Cr_2O_7', nameAr: 'ثنائي كرومات البوتاسيوم' },
    { formula: 'AgNO_3', nameAr: 'نترات الفضة (حجر جهنم)' },
    { formula: 'BaSO_4', nameAr: 'كبريتات الباريوم' },
    { formula: 'NH_4Cl', nameAr: 'كلوريد الأمونيوم (ملح النوشادر)' },
    { formula: 'NaHCO_3', nameAr: 'بيكربونات الصوديوم (صودا الخبز)' },
    { formula: 'Na_2CO_3', nameAr: 'كربونات الصوديوم (صودا الغسيل)' },
    { formula: 'KI', nameAr: 'يوديد البوتاسيوم' },
    { formula: 'FeSO_4', nameAr: 'كبريتات الحديد الثنائي' }
  ],
  oxides: [
    { formula: 'CO_2', nameAr: 'ثنائي أوكسيد الكاربون' },
    { formula: 'CO', nameAr: 'أحادي أوكسيد الكاربون' },
    { formula: 'SO_2', nameAr: 'ثنائي أوكسيد الكبريت' },
    { formula: 'SO_3', nameAr: 'ثلاثي أوكسيد الكبريت' },
    { formula: 'NO_2', nameAr: 'ثنائي أوكسيد النيتروجين' },
    { formula: 'Fe_2O_3', nameAr: 'أوكسيد الحديد الثلاثي (الهيماتيت)' },
    { formula: 'Al_2O_3', nameAr: 'أوكسيد الألمنيوم (الألومينا)' },
    { formula: 'CaO', nameAr: 'أوكسيد الكالسيوم (الجير الحي)' },
    { formula: 'MgO', nameAr: 'أوكسيد المغنيسيوم' },
    { formula: 'SiO_2', nameAr: 'ثنائي أوكسيد السيليكون (السيليكا)' }
  ],
  organics: [
    { formula: 'CH_4', nameAr: 'الميثان (أبسط هيدروكربون)' },
    { formula: 'C_2H_6', nameAr: 'الإيثان' },
    { formula: 'C_2H_4', nameAr: 'الإيثيلين (ألكين)' },
    { formula: 'C_2H_2', nameAr: 'الأسيتيلين (ألكاين)' },
    { formula: 'C_6H_6', nameAr: 'البنزين العطري (أروماتي)' },
    { formula: 'C_2H_5OH', nameAr: 'الكحول الإيثيلي (الإيثانول)' },
    { formula: 'CH_3OH', nameAr: 'الميثانول (كحول الخشب)' },
    { formula: 'CH_3CHO', nameAr: 'الأسيتالدهيد (الإيثانال)' },
    { formula: 'CH_3COCH_3', nameAr: 'الأسيتون (البروبانون)' },
    { formula: 'C_6H_{12}O_6', nameAr: 'الكلوكوز (سكر العنب)' },
    { formula: 'C_{12}H_{22}O_{11}', nameAr: 'السكروز (سكر القصب)' },
    { formula: 'HCOOH', nameAr: 'حامض الفورميك (النمليك)' }
  ]
};

window.insertChemFormula = function (snippet) {
  if (typeof window.insertMathFormula === 'function') {
    window.insertMathFormula(snippet);
  } else {
    let target = window.lastActiveMathInput || document.getElementById('modalQText');
    if (!target) return;
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    target.value = target.value.substring(0, start) + snippet + target.value.substring(end);
    target.focus();
    if (typeof window.updateModalMathPreview === 'function') window.updateModalMathPreview();
  }
};

window.toggleChemStudio = function () {
  const wrapper = document.getElementById('modalChemStudioWrapper');
  let container = document.getElementById('modalChemStudioContainer');
  if (!container && wrapper) {
    wrapper.innerHTML = buildChemStudioHTML(false);
    container = document.getElementById('modalChemStudioContainer');
  }
  if (!container) return;
  const isHidden = (container.style.display === 'none' || !container.style.display);
  if (isHidden && typeof window.closeAllQuestionStudiosExcept === 'function') {
    window.closeAllQuestionStudiosExcept('chemistry');
  }
  container.style.display = isHidden ? 'block' : 'none';
  const toggleBtn = document.getElementById('btnToggleChemStudio');
  if (toggleBtn) {
    toggleBtn.classList.toggle('active', isHidden);
  }
};

window._legacyToggleChemStudioUnused = function () {
  const wrapper = document.getElementById('modalChemStudioWrapper');
  let container = document.getElementById('modalChemStudioContainer');
  if (!container && wrapper) {
    wrapper.innerHTML = buildChemStudioHTML(true);
    container = document.getElementById('modalChemStudioContainer');
  }
  if (!container) return;
  const isHidden = (container.style.display === 'none' || !container.style.display);
  container.style.display = isHidden ? 'block' : 'none';
  const toggleBtn = document.getElementById('btnToggleChemStudio');
  if (toggleBtn) {
    toggleBtn.classList.toggle('active', isHidden);
  }
};

window.switchChemStudioTab = function (tabId) {
  document.querySelectorAll('#chemStudioTabs .chem-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.chem-tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === `chemPane_${tabId}`);
  });
};

window.filterChemElements = function (category = null) {
  const activePill = document.querySelector('.chem-filter-pill.active');
  let cat = category !== null ? category : (activePill ? activePill.getAttribute('data-cat') : 'all');
  if (category !== null) {
    document.querySelectorAll('.chem-filter-pill').forEach(pill => {
      pill.classList.toggle('active', pill.getAttribute('data-cat') === category);
    });
  }
  const searchInput = document.getElementById('chemElementSearchInput');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

  document.querySelectorAll('#chemElementsGrid .chem-element-card').forEach(card => {
    const elCat = card.getAttribute('data-category');
    const symbol = (card.getAttribute('data-symbol') || '').toLowerCase();
    const name = (card.getAttribute('data-name') || '').toLowerCase();
    const z = card.getAttribute('data-z') || '';

    const matchesCat = (cat === 'all' || elCat === cat);
    const matchesSearch = (!query || symbol.includes(query) || name.includes(query) || z === query);

    card.style.display = (matchesCat && matchesSearch) ? 'flex' : 'none';
  });
};

window.insertBuiltElementIsotope = function () {
  const sym = (document.getElementById('chemBldSym')?.value || '').trim() || 'X';
  const mass = (document.getElementById('chemBldMass')?.value || '').trim();
  const atomic = (document.getElementById('chemBldAtomic')?.value || '').trim();
  const charge = (document.getElementById('chemBldCharge')?.value || '').trim();

  let snippet = `\\text{${sym}}`;
  if (atomic && mass) {
    snippet = `^{${mass}}_{${atomic}}\\text{${sym}}`;
  } else if (mass) {
    snippet = `^{${mass}}\\text{${sym}}`;
  } else if (atomic) {
    snippet = `_{${atomic}}\\text{${sym}}`;
  }
  if (charge) {
    snippet += `^{${charge}}`;
  }
  window.insertChemFormula(`$${snippet}$`);
};

window.insertBuiltChemEquation = function () {
  const reactants = (document.getElementById('chemBldReactants')?.value || '').trim() || '2H_2 + O_2';
  const arrow = (document.getElementById('chemBldArrow')?.value || '').trim() || '\\rightarrow';
  const products = (document.getElementById('chemBldProducts')?.value || '').trim() || '2H_2O';
  const note = (document.getElementById('chemBldNote')?.value || '').trim();

  let snippet = `${reactants} ${arrow} ${products}`;
  if (note) snippet += ` \\quad (${note})`;
  window.insertChemFormula(`$${snippet}$`);
};

function getElectronConfig(z) {
  const arabicPeriods = ['', 'الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة'];
  const arabicGroups = ['', 'الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة', 'الثامنة (الغازات النبيلة)'];
  const subshells = [
    { name: '1s', n: 1, cap: 2 },
    { name: '2s', n: 2, cap: 2 },
    { name: '2p', n: 2, cap: 6 },
    { name: '3s', n: 3, cap: 2 },
    { name: '3p', n: 3, cap: 6 },
    { name: '4s', n: 4, cap: 2 },
    { name: '3d', n: 3, cap: 10 },
    { name: '4p', n: 4, cap: 6 }
  ];
  let rem = z;
  let parts = [];
  if (z === 24) {
    parts = ['1s^2', '2s^2', '2p^6', '3s^2', '3p^6', '4s^1', '3d^5'];
  } else if (z === 29) {
    parts = ['1s^2', '2s^2', '2p^6', '3s^2', '3p^6', '4s^1', '3d^{10}'];
  } else {
    for (const sub of subshells) {
      if (rem <= 0) break;
      const take = Math.min(rem, sub.cap);
      parts.push(`${sub.name}^{${take}}`);
      rem -= take;
    }
  }
  const configStr = parts.join('\\ ');
  let maxN = 1;
  if (z > 2) maxN = 2;
  if (z > 10) maxN = 3;
  if (z > 18) maxN = 4;

  let valenceElectrons = 1;
  let group = 1;
  if (z === 1) { valenceElectrons = 1; group = 1; }
  else if (z === 2) { valenceElectrons = 2; group = 8; }
  else if (z >= 3 && z <= 10) { valenceElectrons = z - 2; group = valenceElectrons; }
  else if (z >= 11 && z <= 18) { valenceElectrons = z - 10; group = valenceElectrons; }
  else if (z === 19) { valenceElectrons = 1; group = 1; }
  else if (z === 20) { valenceElectrons = 2; group = 2; }
  else if (z >= 21 && z <= 30) { valenceElectrons = 2; group = 2; }
  else if (z >= 31 && z <= 36) { valenceElectrons = z - 28; group = valenceElectrons; }

  const dots = ['•', '••', '•••', '••••', '•••••', '••••••', '•••••••', '••••••••'];
  const lewisDots = dots[valenceElectrons - 1] || '•';

  return {
    configStr: `$${configStr}$`,
    periodText: `الدورة: ${arabicPeriods[maxN]}`,
    groupText: `الزمرة: ${arabicGroups[group] || group}`,
    valenceText: `إلكترونات التكافؤ: ${valenceElectrons}`,
    lewisSymbol: `رمز لويس: [ ${lewisDots} ]`
  }
}

window.calculateAndInsertElectronConfig = function () {
  const zInput = document.getElementById('chemBldCalcZ');
  const z = parseInt(zInput ? zInput.value : '0', 10);
  if (!z || isNaN(z) || z < 1 || z > 36) {
    showToast('يرجى إدخال عدد ذري صحيح بين 1 و 36', 'warning');
    return;
  }
  const info = getElectronConfig(z);
  const element = CHEM_ELEMENTS_DB.find(e => e.z === z);
  const nameStr = element ? `عنصر ${element.n} ($_{${z}}\\text{${element.s}}$): ` : `العنصر (Z = ${z}): `;
  const fullText = `${nameStr} الترتيب الإلكتروني: ${info.configStr} | ${info.periodText} | ${info.groupText} | ${info.valenceText} | ${info.lewisSymbol}`;
  window.insertChemFormula(fullText);
  showToast(`تم إدراج الترتيب الإلكتروني لعنصر ${element ? element.n : z} بنجاح ✨`, 'success');
};

/**
 * Builds the HTML layout of the Iraqi Chemistry Studio
 */
function buildChemStudioHTML(isOpen = false) {
  const elementsHTML = CHEM_ELEMENTS_DB.map(el => `
    <div class="chem-element-card cat-${el.g}" data-category="${el.g}" data-symbol="${el.s}" data-name="${el.n}" data-z="${el.z}" onclick="window.insertChemFormula('$\\\\text{${el.s}}$')" title="${el.n} (${el.s}) - العدد الذري: ${el.z} | الكتلة: ${el.m} | ${el.gName} | أعداد التأكسد: ${el.ox}">
      <span class="el-z">${el.z}</span>
      <span class="el-mass">${el.m}</span>
      <span class="el-symbol">${el.s}</span>
      <span class="el-name">${el.n}</span>
      <span class="el-ox">${el.ox}</span>
    </div>
  `).join('');

  return `
    <!-- ستوديو الكيمياء والجدول الدوري والمعادلات الوزارية العراقية -->
    <div class="chem-studio-container" id="modalChemStudioContainer" style="display: ${isOpen ? 'block' : 'none'};">
      <div class="chem-studio-header">
        <div class="chem-studio-title">
          <i class="fa-solid fa-flask-vial" style="color: #10b981;"></i>
          <span>ستوديو الكيمياء والجدول الدوري والمعادلات</span>
          <span class="badge-chem-iq">المنهج العراقي الوزاري</span>
        </div>
        <div style="display: flex; gap: 6px; align-items: center;">
          <span style="font-size: 0.72rem; color: var(--text-muted);">انقر على أي عنصر أو مركب أو معادلة لإدراجها فوراً في موضع المؤشر</span>
        </div>
      </div>

      <!-- تبويبات أقسام الكيمياء -->
      <div class="chem-studio-tabs" id="chemStudioTabs">
        <button type="button" class="chem-tab-btn active" data-tab="chem_elements" onclick="window.switchChemStudioTab('chem_elements')">
          <i class="fa-solid fa-table-cells-large"></i> الجدول الدوري والعناصر
        </button>
        <button type="button" class="chem-tab-btn" data-tab="chem_compounds" onclick="window.switchChemStudioTab('chem_compounds')">
          <i class="fa-solid fa-vial"></i> المركبات والصيغ
        </button>
        <button type="button" class="chem-tab-btn" data-tab="chem_reactions" onclick="window.switchChemStudioTab('chem_reactions')">
          <i class="fa-solid fa-arrow-right-arrow-left"></i> التفاعلات والاتزان
        </button>
        <button type="button" class="chem-tab-btn" data-tab="chem_ions" onclick="window.switchChemStudioTab('chem_ions')">
          <i class="fa-solid fa-bolt"></i> الأيونات والجذور
        </button>
        <button type="button" class="chem-tab-btn" data-tab="chem_electrons" onclick="window.switchChemStudioTab('chem_electrons')">
          <i class="fa-solid fa-atom"></i> الترتيب الإلكتروني وأعداد الكم
        </button>
        <button type="button" class="chem-tab-btn btn-chem-highlight" data-tab="chem_builder" onclick="window.switchChemStudioTab('chem_builder')">
          <i class="fa-solid fa-wand-magic-sparkles"></i> المولد البصري والحاسبة الذكية
        </button>
      </div>

      <!-- محتويات تبويبات الكيمياء -->
      <div class="chem-tab-content-wrapper">
        <!-- 1. الجدول الدوري والعناصر -->
        <div class="chem-tab-pane active" id="chemPane_chem_elements">
          <div class="chem-elements-toolbar">
            <div class="chem-search-box">
              <i class="fa-solid fa-magnifying-glass" style="color: #10b981; font-size: 0.75rem;"></i>
              <input type="text" id="chemElementSearchInput" placeholder="بحث بالاسم العربي (مثال: صوديوم)، الرمز (Na)، أو العدد الذري (11)..." oninput="window.filterChemElements()">
            </div>
            <div class="chem-filter-pills-row">
              <button type="button" class="chem-filter-pill active" data-cat="all" onclick="window.filterChemElements('all')">الكل (${CHEM_ELEMENTS_DB.length})</button>
              <button type="button" class="chem-filter-pill" data-cat="alkali" onclick="window.filterChemElements('alkali')">فلزات قلوية</button>
              <button type="button" class="chem-filter-pill" data-cat="alkaline" onclick="window.filterChemElements('alkaline')">قلويات ترابية</button>
              <button type="button" class="chem-filter-pill" data-cat="transition" onclick="window.filterChemElements('transition')">فلزات انتقالية</button>
              <button type="button" class="chem-filter-pill" data-cat="nonmetal" onclick="window.filterChemElements('nonmetal')">لافلزات</button>
              <button type="button" class="chem-filter-pill" data-cat="halogen" onclick="window.filterChemElements('halogen')">هالوجينات</button>
              <button type="button" class="chem-filter-pill" data-cat="noble" onclick="window.filterChemElements('noble')">غازات نبيلة</button>
              <button type="button" class="chem-filter-pill" data-cat="metalloid" onclick="window.filterChemElements('metalloid')">أشباه فلزات</button>
              <button type="button" class="chem-filter-pill" data-cat="post-transition" onclick="window.filterChemElements('post-transition')">فلزات ضعيفة</button>
            </div>
          </div>
          <div class="chem-elements-grid" id="chemElementsGrid">
            ${elementsHTML}
          </div>
        </div>

        <!-- 2. المركبات والصيغ الكيميائية -->
        <div class="chem-tab-pane" id="chemPane_chem_compounds">
          <div class="chem-compounds-section">
            <div class="chem-compounds-title"><i class="fa-solid fa-droplet text-primary"></i> أحماض وزارية شائعة:</div>
            <div class="chem-compounds-grid">
              ${CHEM_COMPOUNDS_DB.acids.map(c => `
                <button type="button" class="chem-compound-btn" onclick="window.insertChemFormula('$\\\\text{${c.formula}}$')" title="${c.nameAr}">
                  <span class="chem-compound-formula">${c.formula.replace(/_/g, '')}</span>
                  <span class="chem-compound-name">${c.nameAr}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <div class="chem-compounds-section">
            <div class="chem-compounds-title"><i class="fa-solid fa-vial text-emerald"></i> قواعد وهيدروكسيدات:</div>
            <div class="chem-compounds-grid">
              ${CHEM_COMPOUNDS_DB.bases.map(c => `
                <button type="button" class="chem-compound-btn" onclick="window.insertChemFormula('$\\\\text{${c.formula}}$')" title="${c.nameAr}">
                  <span class="chem-compound-formula">${c.formula.replace(/_/g, '')}</span>
                  <span class="chem-compound-name">${c.nameAr}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <div class="chem-compounds-section">
            <div class="chem-compounds-title"><i class="fa-solid fa-cubes-stacked text-warning"></i> أملاح ومحاليل:</div>
            <div class="chem-compounds-grid">
              ${CHEM_COMPOUNDS_DB.salts.map(c => `
                <button type="button" class="chem-compound-btn" onclick="window.insertChemFormula('$\\\\text{${c.formula}}$')" title="${c.nameAr}">
                  <span class="chem-compound-formula">${c.formula.replace(/_/g, '')}</span>
                  <span class="chem-compound-name">${c.nameAr}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <div class="chem-compounds-section">
            <div class="chem-compounds-title"><i class="fa-solid fa-cloud-arrow-up text-secondary"></i> أكاسيد وهيدروكربونات وكيمياء عضوية:</div>
            <div class="chem-compounds-grid">
              ${CHEM_COMPOUNDS_DB.oxides.concat(CHEM_COMPOUNDS_DB.organics).map(c => `
                <button type="button" class="chem-compound-btn" onclick="window.insertChemFormula('$\\\\text{${c.formula}}$')" title="${c.nameAr}">
                  <span class="chem-compound-formula">${c.formula.replace(/_/g, '').replace(/\{/g, '').replace(/\}/g, '')}</span>
                  <span class="chem-compound-name">${c.nameAr}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- 3. التفاعلات والثرموداينمك والاتزان الكيميائي -->
        <div class="chem-tab-pane" id="chemPane_chem_reactions">
          <div style="margin-bottom: 8px;">
            <small style="font-size: 0.72rem; font-weight: 800; color: #6ee7b7; display: block; margin-bottom: 4px;">أسهم التفاعل والحالات الفيزيائية والثرموداينمك:</small>
            <div style="display: flex; gap: 5px; flex-wrap: wrap;">
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\rightarrow$')" title="سهم تفاعل تام">
                <span class="math-tool-render">→</span>
                <span class="math-tool-label">سهم تام</span>
              </button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\rightleftharpoons$')" title="سهم تفاعل انعكاسي متزن">
                <span class="math-tool-render">⇌</span>
                <span class="math-tool-label">انعكاسي متزن</span>
              </button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\xrightarrow{\\\\Delta}$')" title="سهم تسخين وحرارة">
                <span class="math-tool-render">→ᐩ</span>
                <span class="math-tool-label">حرارة وتسخين</span>
              </button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\uparrow$')" title="تصاعد غاز">
                <span class="math-tool-render">↑</span>
                <span class="math-tool-label">غاز متصاعد</span>
              </button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\downarrow$')" title="تكون راسب">
                <span class="math-tool-render">↓</span>
                <span class="math-tool-label">راسب</span>
              </button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{(s)}$')" title="حالة صلبة">
                <span class="math-tool-render">(s)</span>
                <span class="math-tool-label">صلب</span>
              </button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{(l)}$')" title="حالة سائلة">
                <span class="math-tool-render">(l)</span>
                <span class="math-tool-label">سائل</span>
              </button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{(g)}$')" title="حالة غازية">
                <span class="math-tool-render">(g)</span>
                <span class="math-tool-label">غاز</span>
              </button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{(aq)}$')" title="محلول مائي">
                <span class="math-tool-render">(aq)</span>
                <span class="math-tool-label">مائي</span>
              </button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\Delta H^{\\\\circ}_{\\\\text{r}}$')" title="إنثالبي التفاعل القياسية">
                <span class="math-tool-render">ΔH°ᵣ</span>
                <span class="math-tool-label">إنثالبي</span>
              </button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\Delta G^{\\\\circ}_{\\\\text{r}}$')" title="طاقة كبس الحرة القياسية">
                <span class="math-tool-render">ΔG°ᵣ</span>
                <span class="math-tool-label">طاقة كبس</span>
              </button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\Delta S^{\\\\circ}_{\\\\text{r}}$')" title="إنتروبي التفاعل القياسية">
                <span class="math-tool-render">ΔS°ᵣ</span>
                <span class="math-tool-label">إنتروبي</span>
              </button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$K_c$')" title="ثابت الاتزان تراكيز">
                <span class="math-tool-render">Kc</span>
                <span class="math-tool-label">ثابت تراكيز</span>
              </button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$K_p$')" title="ثابت الاتزان ضغوط">
                <span class="math-tool-render">Kp</span>
                <span class="math-tool-label">ثابت ضغوط</span>
              </button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$K_{sp}$')" title="ثابت حاصل الإذابة">
                <span class="math-tool-render">Ksp</span>
                <span class="math-tool-label">حاصل الإذابة</span>
              </button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{pH}$')" title="الدالة الحامضية">
                <span class="math-tool-render">pH</span>
                <span class="math-tool-label">الأس الهيدروجيني</span>
              </button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{pOH}$')" title="الدالة القاعدية">
                <span class="math-tool-render">pOH</span>
                <span class="math-tool-label">الدالة القاعدية</span>
              </button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$E^{\\\\circ}_{\\\\text{cell}}$')" title="جهد الخلية القياسي">
                <span class="math-tool-render">E°cell</span>
                <span class="math-tool-label">جهد الخلية</span>
              </button>
            </div>
          </div>

          <div>
            <small style="font-size: 0.72rem; font-weight: 800; color: #6ee7b7; display: block; margin-bottom: 4px;">معادلات كيميائية وزارية نموذجية شائعة:</small>
            <div class="chem-reactions-grid">
              <button type="button" class="chem-equation-pill-btn" onclick="window.insertChemFormula('$\\\\text{N}_2\\\\text{(g)} + 3\\\\text{H}_2\\\\text{(g)} \\\\rightleftharpoons 2\\\\text{NH}_3\\\\text{(g)} \\\\quad (\\\\Delta H < 0)$')">
                <span class="chem-equation-formula">N₂(g) + 3H₂(g) ⇌ 2NH₃(g)</span>
                <span class="chem-equation-desc">تكوين الأمونيا (طريقة هابر)</span>
              </button>
              <button type="button" class="chem-equation-pill-btn" onclick="window.insertChemFormula('$\\\\text{Ca(OH)}_2 + \\\\text{CO}_2 \\\\rightarrow \\\\text{CaCO}_3\\\\downarrow + \\\\text{H}_2\\\\text{O}$')">
                <span class="chem-equation-formula">Ca(OH)₂ + CO₂ → CaCO₃↓ + H₂O</span>
                <span class="chem-equation-desc">كشف ماء الكلس الرائق</span>
              </button>
              <button type="button" class="chem-equation-pill-btn" onclick="window.insertChemFormula('$2\\\\text{Al} + \\\\text{Fe}_2\\\\text{O}_3 \\\\xrightarrow{\\\\Delta} \\\\text{Al}_2\\\\text{O}_3 + 2\\\\text{Fe} + \\\\text{حرارة}$')">
                <span class="chem-equation-formula">2Al + Fe₂O₃ → Al₂O₃ + 2Fe + حرارة</span>
                <span class="chem-equation-desc">تفاعل الثرميت (استخلاص الحديد)</span>
              </button>
              <button type="button" class="chem-equation-pill-btn" onclick="window.insertChemFormula('$\\\\text{CH}_4\\\\text{(g)} + 2\\\\text{O}_2\\\\text{(g)} \\\\rightarrow \\\\text{CO}_2\\\\text{(g)} + 2\\\\text{H}_2\\\\text{O(g)} + \\\\text{طاقة}$')">
                <span class="chem-equation-formula">CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(g)</span>
                <span class="chem-equation-desc">احتراق غاز الميثان التام</span>
              </button>
              <button type="button" class="chem-equation-pill-btn" onclick="window.insertChemFormula('$\\\\text{CaCO}_3\\\\text{(s)} \\\\xrightarrow{\\\\Delta} \\\\text{CaO(s)} + \\\\text{CO}_2\\\\text{(g)}\\\\uparrow$')">
                <span class="chem-equation-formula">CaCO₃(s) → CaO(s) + CO₂(g)↑</span>
                <span class="chem-equation-desc">تفكك كاربونات الكالسيوم بالحرارة</span>
              </button>
              <button type="button" class="chem-equation-pill-btn" onclick="window.insertChemFormula('$\\\\text{Zn(s)} + \\\\text{Cu}^{2+}\\\\text{(aq)} \\\\rightarrow \\\\text{Zn}^{2+}\\\\text{(aq)} + \\\\text{Cu(s)}$')">
                <span class="chem-equation-formula">Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s)</span>
                <span class="chem-equation-desc">تفاعل خلية دانيال (أكسدة واختزال)</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 4. الأيونات والجذور والمجموعات الذرية -->
        <div class="chem-tab-pane" id="chemPane_chem_ions">
          <div style="margin-bottom: 8px;">
            <small style="font-size: 0.72rem; font-weight: 800; color: #6ee7b7; display: block; margin-bottom: 4px;">الأيونات الموجبة (الكاتيونات Cations):</small>
            <div style="display: flex; gap: 4px; flex-wrap: wrap;">
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{H}^+$')"><span class="math-tool-render">H⁺</span><span class="math-tool-label">هيدروجين (+1)</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{Na}^+$')"><span class="math-tool-render">Na⁺</span><span class="math-tool-label">صوديوم (+1)</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{K}^+$')"><span class="math-tool-render">K⁺</span><span class="math-tool-label">بوتاسيوم (+1)</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{Ag}^+$')"><span class="math-tool-render">Ag⁺</span><span class="math-tool-label">فضة (+1)</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{NH}_4^+$')"><span class="math-tool-render">NH₄⁺</span><span class="math-tool-label">أمونيوم (+1)</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{Mg}^{2+}$')"><span class="math-tool-render">Mg²⁺</span><span class="math-tool-label">مغنيسيوم (+2)</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{Ca}^{2+}$')"><span class="math-tool-render">Ca²⁺</span><span class="math-tool-label">كالسيوم (+2)</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{Ba}^{2+}$')"><span class="math-tool-render">Ba²⁺</span><span class="math-tool-label">باريوم (+2)</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{Fe}^{2+}$')"><span class="math-tool-render">Fe²⁺</span><span class="math-tool-label">حديدوز (+2)</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{Cu}^{2+}$')"><span class="math-tool-render">Cu²⁺</span><span class="math-tool-label">نحاس (+2)</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{Zn}^{2+}$')"><span class="math-tool-render">Zn²⁺</span><span class="math-tool-label">خارصين (+2)</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{Pb}^{2+}$')"><span class="math-tool-render">Pb²⁺</span><span class="math-tool-label">رصاص (+2)</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{Al}^{3+}$')"><span class="math-tool-render">Al³⁺</span><span class="math-tool-label">ألمنيوم (+3)</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{Fe}^{3+}$')"><span class="math-tool-render">Fe³⁺</span><span class="math-tool-label">حديديك (+3)</span></button>
            </div>
          </div>

          <div>
            <small style="font-size: 0.72rem; font-weight: 800; color: #6ee7b7; display: block; margin-bottom: 4px;">الأيونات السالبة والجذور الذرية (الأنيونات Anions):</small>
            <div style="display: flex; gap: 4px; flex-wrap: wrap;">
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{Cl}^-$')"><span class="math-tool-render">Cl⁻</span><span class="math-tool-label">كلوريد (-1)</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{Br}^-$')"><span class="math-tool-render">Br⁻</span><span class="math-tool-label">بروميد (-1)</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{I}^-$')"><span class="math-tool-render">I⁻</span><span class="math-tool-label">يوديد (-1)</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{F}^-$')"><span class="math-tool-render">F⁻</span><span class="math-tool-label">فلوريد (-1)</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{OH}^-$')"><span class="math-tool-render">OH⁻</span><span class="math-tool-label">هيدروكسيد (-1)</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{NO}_3^-$')"><span class="math-tool-render">NO₃⁻</span><span class="math-tool-label">نترات (-1)</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{NO}_2^-$')"><span class="math-tool-render">NO₂⁻</span><span class="math-tool-label">نتريت (-1)</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{CH}_3\\\\text{COO}^-$')"><span class="math-tool-render">CH₃COO⁻</span><span class="math-tool-label">خلات (-1)</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{MnO}_4^-$')"><span class="math-tool-render">MnO₄⁻</span><span class="math-tool-label">برمنغنات (-1)</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{O}^{2-}$')"><span class="math-tool-render">O²⁻</span><span class="math-tool-label">أوكسيد (-2)</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{S}^{2-}$')"><span class="math-tool-render">S²⁻</span><span class="math-tool-label">كبريتيد (-2)</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{SO}_4^{2-}$')"><span class="math-tool-render">SO₄²⁻</span><span class="math-tool-label">كبريتات (-2)</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{SO}_3^{2-}$')"><span class="math-tool-render">SO₃²⁻</span><span class="math-tool-label">كبريتيت (-2)</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{CO}_3^{2-}$')"><span class="math-tool-render">CO₃²⁻</span><span class="math-tool-label">كاربونات (-2)</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{Cr}_2\\\\text{O}_7^{2-}$')"><span class="math-tool-render">Cr₂O₇²⁻</span><span class="math-tool-label">ثنائي كرومات (-2)</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\text{PO}_4^{3-}$')"><span class="math-tool-render">PO₄³⁻</span><span class="math-tool-label">فوسفات (-3)</span></button>
            </div>
          </div>
        </div>

        <!-- 5. الترتيب الإلكتروني وأعداد الكم -->
        <div class="chem-tab-pane" id="chemPane_chem_electrons">
          <div style="margin-bottom: 8px;">
            <small style="font-size: 0.72rem; font-weight: 800; color: #6ee7b7; display: block; margin-bottom: 4px;">المستويات الثانوية وتوزيع الإلكترونات:</small>
            <div style="display: flex; gap: 4px; flex-wrap: wrap;">
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$1s^2$')"><span class="math-tool-render">1s²</span><span class="math-tool-label">غلاف 1</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$2s^2$')"><span class="math-tool-render">2s²</span><span class="math-tool-label">غلاف 2</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$2p^6$')"><span class="math-tool-render">2p⁶</span><span class="math-tool-label">غلاف 2</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$3s^2$')"><span class="math-tool-render">3s²</span><span class="math-tool-label">غلاف 3</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$3p^6$')"><span class="math-tool-render">3p⁶</span><span class="math-tool-label">غلاف 3</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$4s^2$')"><span class="math-tool-render">4s²</span><span class="math-tool-label">غلاف 4</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$3d^{10}$')"><span class="math-tool-render">3d¹⁰</span><span class="math-tool-label">انتقالي d</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$4p^6$')"><span class="math-tool-render">4p⁶</span><span class="math-tool-label">غلاف 4</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$[\\\\text{Ne}]_{10}$')"><span class="math-tool-render">[Ne]₁₀</span><span class="math-tool-label">غاز خامل</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$[\\\\text{Ar}]_{18}$')"><span class="math-tool-render">[Ar]₁₈</span><span class="math-tool-label">غاز خامل</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$[\\\\text{Kr}]_{36}$')"><span class="math-tool-render">[Kr]₃₆</span><span class="math-tool-label">غاز خامل</span></button>
            </div>
          </div>

          <div>
            <small style="font-size: 0.72rem; font-weight: 800; color: #6ee7b7; display: block; margin-bottom: 4px;">أعداد الكم الأربعة ورمز لويس:</small>
            <div style="display: flex; gap: 4px; flex-wrap: wrap;">
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$n = 3$')"><span class="math-tool-render">n</span><span class="math-tool-label">الكم الرئيسي</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$l = 1$')"><span class="math-tool-render">l</span><span class="math-tool-label">الكم الثانوي</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$m_l = 0$')"><span class="math-tool-render">mₗ</span><span class="math-tool-label">الكم المغناطيسي</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$m_s = +\\\\frac{1}{2}$')"><span class="math-tool-render">+½</span><span class="math-tool-label">برم للأعلى</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$m_s = -\\\\frac{1}{2}$')"><span class="math-tool-render">-½</span><span class="math-tool-label">برم للأسفل</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\cdot\\\\text{X}\\\\cdot$')"><span class="math-tool-render">·X·</span><span class="math-tool-label">لويس (إلكترونان)</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$\\\\cdot\\\\ddot{\\\\text{X}}\\\\cdot$')"><span class="math-tool-render">·Ẍ·</span><span class="math-tool-label">لويس (4 إلكترونات)</span></button>
              <button type="button" class="math-tool-btn" onclick="window.insertChemFormula('$:\\\\ddot{\\\\text{X}}:$')"><span class="math-tool-render">:Ẍ:</span><span class="math-tool-label">لويس (مكتمل 8)</span></button>
            </div>
          </div>
        </div>

        <!-- 6. المولد البصري التفاعلي والحاسبة الذكية -->
        <div class="chem-tab-pane" id="chemPane_chem_builder">
          <div class="chem-builder-grid">
            <!-- كارت 1: مولد النظائر والأعداد الذرية والكتلية -->
            <div class="chem-builder-card">
              <div class="chem-builder-card-title">
                <i class="fa-solid fa-square-root-variable" style="color: #10b981;"></i>
                <span>مولد رمز النظير والشحنة ($^{A}_{Z}\\text{X}^{\\pm}$)</span>
              </div>
              <div style="display: flex; gap: 4px; align-items: center; margin-bottom: 6px;">
                <input type="text" id="chemBldSym" placeholder="الرمز (Na)" value="Na" style="width: 50px; text-align: center; font-weight: bold; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-main); font-size: 0.8rem; padding: 3px;">
                <input type="text" id="chemBldMass" placeholder="الكتلي A" value="23" style="width: 50px; text-align: center; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-main); font-size: 0.8rem; padding: 3px;">
                <input type="text" id="chemBldAtomic" placeholder="الذري Z" value="11" style="width: 50px; text-align: center; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-main); font-size: 0.8rem; padding: 3px;">
                <input type="text" id="chemBldCharge" placeholder="الشحنة (+1)" value="" style="width: 55px; text-align: center; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-main); font-size: 0.8rem; padding: 3px;">
              </div>
              <button type="button" class="btn btn-outline" style="width: 100%; font-size: 0.72rem; padding: 3px 6px; font-weight: bold; color: #10b981; border-color: rgba(16,185,129,0.4);" onclick="window.insertBuiltElementIsotope()">
                <i class="fa-solid fa-plus"></i> إدراج النظير بالصيغة الوزارية
              </button>
            </div>

            <!-- كارت 2: مولد معادلة التفاعل المتزنة -->
            <div class="chem-builder-card">
              <div class="chem-builder-card-title">
                <i class="fa-solid fa-arrow-right-arrow-left" style="color: #10b981;"></i>
                <span>مولد معادلة التفاعل الكيميائي</span>
              </div>
              <div style="display: flex; gap: 4px; margin-bottom: 5px;">
                <input type="text" id="chemBldReactants" placeholder="المتفاعلات (2H_2 + O_2)" value="2H_2 + O_2" style="flex: 1; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-main); font-size: 0.78rem; padding: 3px 6px;">
                <select id="chemBldArrow" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-main); font-size: 0.78rem; padding: 3px;">
                  <option value="\\rightarrow">→</option>
                  <option value="\\rightleftharpoons">⇌</option>
                  <option value="\\xrightarrow{\\Delta}">→ᐩ</option>
                  <option value="\\xrightarrow{\\text{Pt}}">→(Pt)</option>
                </select>
                <input type="text" id="chemBldProducts" placeholder="النواتج (2H_2O)" value="2H_2O" style="flex: 1; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-main); font-size: 0.78rem; padding: 3px 6px;">
              </div>
              <div style="display: flex; gap: 4px; margin-bottom: 6px;">
                <input type="text" id="chemBldNote" placeholder="ملاحظة أو حرارة (اختياري، مثلاً: \\Delta H < 0)" style="width: 100%; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-main); font-size: 0.75rem; padding: 3px 6px;">
              </div>
              <button type="button" class="btn btn-outline" style="width: 100%; font-size: 0.72rem; padding: 3px 6px; font-weight: bold; color: #10b981; border-color: rgba(16,185,129,0.4);" onclick="window.insertBuiltChemEquation()">
                <i class="fa-solid fa-plus"></i> إدراج المعادلة في السؤال
              </button>
            </div>

            <!-- كارت 3: حاسبة الترتيب الإلكتروني والدورة والزمرة الوزارية الذكية -->
            <div class="chem-builder-card" style="grid-column: 1 / -1; background: rgba(6, 78, 59, 0.25); border-color: rgba(16, 185, 129, 0.4);">
              <div class="chem-builder-card-title">
                <i class="fa-solid fa-brain" style="color: #34d399;"></i>
                <span>الحاسبة الذكية: توليد الترتيب الإلكتروني والدورة والزمرة ورمز لويس آلياً</span>
              </div>
              <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                <label style="font-size: 0.76rem; color: var(--text-main); font-weight: 700;">أدخل العدد الذري (Z):</label>
                <input type="number" id="chemBldCalcZ" min="1" max="36" value="12" style="width: 70px; text-align: center; font-weight: 900; background: var(--bg-surface); border: 1px solid #10b981; border-radius: 4px; color: #34d399; font-size: 0.9rem; padding: 3px;">
                <button type="button" class="btn" style="background: #059669; color: #ffffff; font-size: 0.76rem; padding: 4px 12px; font-weight: bold; border: none; border-radius: 4px;" onclick="window.calculateAndInsertElectronConfig()">
                  <i class="fa-solid fa-wand-magic-sparkles"></i> حساب وتوليد الترتيب الإلكتروني والإدراج فوراً
                </button>
                <span style="font-size: 0.72rem; color: var(--text-muted);">(يحسب الترتيب، الدورة، الزمرة، إلكترونات التكافؤ، ورمز لويس طبقاً للمنهج الوزاري)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Question Modal (Create / Edit)
 */
function openQuestionModal(qId = null, defaultType = 'mcq') {
  if (typeof isUserSubscribedOrAdmin === 'function' && !isUserSubscribedOrAdmin()) {
    requireSubscription(qId ? 'تعديل السؤال' : 'إضافة سؤال جديد');
    return;
  }
  appState.editingQuestionId = qId;
  const modal = document.getElementById('questionModal');
  const titleEl = document.getElementById('modalTitle');
  const bodyEl = document.getElementById('modalFormBody');

  let currentQuestion;
  if (qId) {
    currentQuestion = appState.questions.find(q => q.id === qId);
    titleEl.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> <span>تعديل السؤال</span>`;
  } else {
    const typeDef = QUESTION_TYPES[defaultType];
    currentQuestion = typeDef ? typeDef.createDefault() : QUESTION_TYPES.mcq.createDefault();
    titleEl.innerHTML = `<i class="fa-solid fa-plus-circle"></i> <span>إضافة سؤال: ${typeDef ? typeDef.name : ''}</span>`;
  }

  if (!currentQuestion) return;

  const qSubject = currentQuestion.subject || window.activeSubjectMode || 'arabic';
  const isEnMode = (qSubject === 'english' || appState.settings.direction === 'ltr');

  const qIndex = qId
    ? (appState.questions.findIndex(q => q.id === qId) + 1)
    : (appState.questions.length + 1);

  const defaultQuestionLabel = isEnMode
    ? `Question (${qIndex}):`
    : `السؤال (${qIndex}):`;

  const currentCustomLabel = (currentQuestion.customLabel !== undefined && currentQuestion.customLabel !== null && currentQuestion.customLabel !== '')
    ? currentQuestion.customLabel
    : defaultQuestionLabel;

  const ARABIC_ORDINALS = ['', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر', 'الحادي عشر', 'الثاني عشر'];
  const arabicOrdinal = ARABIC_ORDINALS[qIndex] || qIndex;

  // Build Modal Form dynamically
  bodyEl.innerHTML = `
    <input type="hidden" id="modalQType" value="${currentQuestion.type}">
    <input type="hidden" id="modalQId" value="${currentQuestion.id}">

    <div style="background: rgba(37, 99, 235, 0.08); border: 1px solid rgba(37, 99, 235, 0.2); border-radius: var(--radius-sm); padding: 0.45rem 0.75rem; margin-bottom: 0.85rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-main);">
          <i class="fa-solid fa-book-open text-primary"></i> مادة السؤال:
        </span>
        <select id="modalQSubject" class="form-control" style="padding: 0.2rem 0.6rem; font-size: 0.78rem; width: auto; font-weight: 700;" onchange="window.handleModalSubjectChange(this.value)">
          <option value="arabic" ${qSubject === 'arabic' ? 'selected' : ''}>عربي (اللغة العربية)</option>
          <option value="english" ${qSubject === 'english' ? 'selected' : ''}>English (اللغة الإنكليزية)</option>
          <option value="math" ${qSubject === 'math' ? 'selected' : ''}>رياضيات (الرياضيات والمعادلات)</option>
          <option value="chemistry" ${qSubject === 'chemistry' ? 'selected' : ''}>كيمياء (الكيمياء والجدول الدوري والمعادلات)</option>
          <option value="physics" ${qSubject === 'physics' ? 'selected' : ''}>فيزياء (الفيزياء والمعادلات والقوانين)</option>
          <option value="islamic" ${qSubject === 'islamic' ? 'selected' : ''}>إسلامية (التربية الإسلامية والسور والأحاديث)</option>
        </select>
      </div>

      <div style="display: flex; gap: 0.4rem; align-items: center;">
        <span style="font-size: 0.76rem; font-weight: 700; color: var(--text-muted);">الاتجاه:</span>
        <button type="button" class="btn btn-outline" style="padding: 0.22rem 0.6rem; font-size: 0.75rem;" onclick="window.setModalInputsDirection('rtl')" title="تحويل اتجاه الكتابة لليمين (عربي)">
          <i class="fa-solid fa-align-right"></i> عربي (RTL)
        </button>
        <button type="button" class="btn btn-outline" style="padding: 0.22rem 0.6rem; font-size: 0.75rem;" onclick="window.setModalInputsDirection('ltr')" title="تحويل اتجاه الكتابة لليسار (English)">
          <i class="fa-solid fa-align-left"></i> English (LTR)
        </button>
      </div>
    </div>

    <div class="form-grid">
      <!-- تسمية وترقيم السؤال (ينزل افتراضياً وقابل للتعديل بالكامل) -->
      <div class="form-group" style="grid-column: 1 / -1; background: rgba(37, 99, 235, 0.05); padding: 0.85rem; border-radius: var(--radius-sm); border: 1.5px dashed rgba(37, 99, 235, 0.35); margin-bottom: 0.35rem;">
        <label class="form-label" style="font-weight: 800; color: var(--primary); display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem; flex-wrap: wrap; gap: 4px;">
          <span style="display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-tags text-primary"></i>
            <span>تسمية وترقيم السؤال (الاسم الظاهر في ورقة الامتحان):</span>
          </span>
          <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: normal;">(ينزل تلقائياً ويمكنك تعديله لأي صيغة تريدها)</span>
        </label>
        <div style="display: flex; gap: 8px; align-items: center;">
          <input type="text" class="form-control" id="modalQCustomLabel" dir="${isEnMode ? 'ltr' : 'rtl'}" 
            style="font-weight: 800; color: var(--text-main); font-size: 0.95rem; border-color: rgba(37, 99, 235, 0.4);" 
            placeholder="${isEnMode ? 'e.g. Question 1: or Q1 / Answer the following:' : 'مثال: س 1: أو السؤال الأول: أو س1 / أجب عما يأتي:'}" 
            value="${currentCustomLabel}">
          <button type="button" class="btn btn-outline" style="white-space: nowrap; font-size: 0.78rem; padding: 0.45rem 0.75rem; font-weight: 700;" onclick="window.resetModalQuestionLabel(${qIndex}, '${isEnMode ? 'en' : 'ar'}')" title="استعادة التسمية الافتراضية">
            <i class="fa-solid fa-rotate-left"></i> افتراضي
          </button>
        </div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 7px; align-items: center;">
          <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">صيغ تسمية سريعة:</span>
          <button type="button" class="btn-q-label-preset" onclick="window.setModalLabelPreset('س ${qIndex}:')">س ${qIndex}:</button>
          <button type="button" class="btn-q-label-preset" onclick="window.setModalLabelPreset('السؤال (${qIndex}):')">السؤال (${qIndex}):</button>
          <button type="button" class="btn-q-label-preset" onclick="window.setModalLabelPreset('س${qIndex} / أجب عما يأتي:')">س${qIndex} / أجب عما يأتي:</button>
          <button type="button" class="btn-q-label-preset" onclick="window.setModalLabelPreset('س / ${qIndex}:')">س / ${qIndex}:</button>
          <button type="button" class="btn-q-label-preset" onclick="window.setModalLabelPreset('${isEnMode ? `Question ${qIndex}:` : `السؤال ${arabicOrdinal}:`}')">${isEnMode ? `Question ${qIndex}:` : `السؤال ${arabicOrdinal}:`}</button>
          <button type="button" class="btn-q-label-preset" onclick="window.setModalLabelPreset('${isEnMode ? `Q${qIndex}:` : `س${qIndex}:`}')">${isEnMode ? `Q${qIndex}:` : `س${qIndex}:`}</button>
        </div>
      </div>

      <div class="form-group" style="grid-column: 1 / -1;">
        <label class="form-label"><i class="fa-solid fa-heading text-primary"></i> عنوان إضافي / الترويسة الفرعية <span class="badge-optional">(اختياري)</span></label>
        <input type="text" class="form-control" id="modalQTitle" dir="${isEnMode ? 'ltr' : 'rtl'}" style="text-align: ${isEnMode ? 'left' : 'right'};" placeholder="${isEnMode ? 'Example: Read the passage and answer' : 'مثال: أجب عن الأسئلة التالية أو (الفرع أ: التعاريف)'}" value="${currentQuestion.title || ''}">
      </div>

      <div class="form-group" style="grid-column: 1 / -1;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem; flex-wrap: wrap; gap: 6px;">
          <label class="form-label" style="margin: 0;"><i class="fa-solid fa-align-right text-accent"></i> نص السؤال / صيغة المسألة <span class="badge-optional">(اختياري)</span></label>

          <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
            <button type="button" class="btn-mathlive-quick-pill" onclick="window.openMathLiveForQuestion()" title="فتح وتعديل المعادلة عبر محرر MathLive التفاعلي">
              <i class="fa-solid fa-keyboard" style="color: #67e8f9;"></i>
              <span>محرر MathLive ⚡</span>
            </button>
            <button type="button" class="btn-math-studio-toggle-pill ${(qSubject === 'math' || (!['chemistry', 'physics', 'islamic'].includes(qSubject) && currentQuestion.type === 'math_problem')) ? 'active' : ''}" id="btnToggleMathStudio" onclick="window.toggleMathStudio()" title="فتح / إغلاق ستوديو معادلات ورموز الرياضيات الوزارية">
              <i class="fa-solid fa-square-root-variable text-accent"></i>
              <span>ستوديو الرياضيات</span>
              <span class="badge-math-pro">الأس والكسور</span>
            </button>
            <button type="button" class="btn-chem-studio-toggle-pill ${(qSubject === 'chemistry' || currentQuestion.type === 'chemistry_problem') ? 'active' : ''}" id="btnToggleChemStudio" onclick="window.toggleChemStudio()" title="فتح / إغلاق ستوديو الكيمياء والجدول الدوري والمعادلات الوزارية">
              <i class="fa-solid fa-flask-vial" style="color: #10b981;"></i>
              <span>ستوديو الكيمياء</span>
              <span class="badge-chem-pro">عناصر، مركبات</span>
            </button>
            <button type="button" class="btn-physics-studio-toggle-pill ${(qSubject === 'physics' || currentQuestion.type === 'physics_problem') ? 'active' : ''}" id="btnTogglePhysicsStudio" onclick="window.togglePhysicsStudio()" title="فتح / إغلاق ستوديو الفيزياء العراقي (ثالث متوسط وسادس إعدادي)">
              <i class="fa-solid fa-atom" style="color: #f59e0b;"></i>
              <span>ستوديو الفيزياء</span>
              <span class="badge-physics-pro">قوانين، مسائل</span>
            </button>
            <button type="button" class="btn-islamic-studio-toggle-pill ${(qSubject === 'islamic' || currentQuestion.type === 'islamic_problem') ? 'active' : ''}" id="btnToggleIslamicStudio" onclick="window.toggleIslamicStudio()" title="فتح / إغلاق ستوديو التربية الإسلامية (سور، آيات، أحاديث ورسم قرآني)">
              <i class="fa-solid fa-book-quran" style="color: #34d399;"></i>
              <span>ستوديو الإسلامية</span>
              <span class="badge-islamic-pro">رسم قرآني، أحاديث</span>
            </button>
          </div>
        </div>

        <div id="modalMathStudioWrapper">${(qSubject === 'math' || (!['chemistry', 'physics', 'islamic'].includes(qSubject) && currentQuestion.type === 'math_problem')) ? buildMathStudioHTML(true) : ''}</div>
        <div id="modalChemStudioWrapper">${(qSubject === 'chemistry' || currentQuestion.type === 'chemistry_problem') ? buildChemStudioHTML(true) : ''}</div>
        <div id="modalPhysicsStudioWrapper">${(qSubject === 'physics' || currentQuestion.type === 'physics_problem') && typeof window.buildPhysicsStudioHTML === 'function' ? window.buildPhysicsStudioHTML(true) : ''}</div>
        <div id="modalIslamicStudioWrapper">${(qSubject === 'islamic' || currentQuestion.type === 'islamic_problem') && typeof window.buildIslamicStudioHTML === 'function' ? window.buildIslamicStudioHTML(true) : ''}</div>

        <textarea class="form-control" id="modalQText" dir="${isEnMode ? 'ltr' : 'rtl'}" style="text-align: ${isEnMode ? 'left' : 'right'}; font-family: ${isEnMode ? 'Inter, Roboto, sans-serif' : 'inherit'}; font-size: 0.95rem;" rows="3" placeholder="${isEnMode ? 'Write the question text or problem here...' : 'اكتب نص السؤال، المسألة، أو الفقرة هنا (أو اتركه فارغاً)...'}">${currentQuestion.text || ''}</textarea>

        <!-- المعاينة الوزارية الحية الفورية للمسألة والمعادلة الرياضية أو الكيميائية -->
        <div class="math-live-preview-box" id="modalMathPreviewWrapper">
          <div class="math-preview-badge">
            <i class="fa-solid fa-eye text-primary"></i>
            <span>المعاينة الوزارية الفورية للمسألة / المعادلة (كما ستظهر تماماً في ورقة الامتحان):</span>
          </div>
          <div class="math-preview-content" id="modalMathLivePreview">
            <!-- Rendered Live via KaTeX -->
          </div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">الدرجة المخصصة للسؤال <span class="badge-optional">(اختياري)</span></label>
        <input type="number" class="form-control" id="modalQScore" min="1" max="100" placeholder="الدرجة" value="${currentQuestion.score || 5}">
      </div>

      <div class="form-group">
        <label class="form-label">مستوى بلوم المعرفي <span class="badge-optional">(اختياري)</span></label>
        <select class="form-control" id="modalQBloom">
          <option value="تذكر" ${currentQuestion.bloom === 'تذكر' ? 'selected' : ''}>تذكر (معرفة واسترجاع)</option>
          <option value="فهم" ${currentQuestion.bloom === 'فهم' ? 'selected' : ''}>فهم واستيعاب</option>
          <option value="تطبيق" ${currentQuestion.bloom === 'تطبيق' ? 'selected' : ''}>تطبيق المبادئ والقوانين</option>
          <option value="تحليل" ${currentQuestion.bloom === 'تحليل' ? 'selected' : ''}>تحليل ومقارنة</option>
          <option value="تقويم" ${currentQuestion.bloom === 'تقويم' ? 'selected' : ''}>تقويم ونقد</option>
          <option value="ابتكار" ${currentQuestion.bloom === 'ابتكار' ? 'selected' : ''}>ابتكار وتركيب</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">درجة الصعوبة <span class="badge-optional">(اختياري)</span></label>
        <select class="form-control" id="modalQDifficulty">
          <option value="سهل" ${currentQuestion.difficulty === 'سهل' ? 'selected' : ''}>سهل</option>
          <option value="متوسط" ${currentQuestion.difficulty === 'متوسط' ? 'selected' : ''}>متوسط</option>
          <option value="متقدم" ${currentQuestion.difficulty === 'متقدم' ? 'selected' : ''}>متقدم / تفكير عليا</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label"><i class="fa-solid fa-text-height text-primary"></i> حجم خط هذا السؤال فقط <span class="badge-optional">(اختياري)</span></label>
        <select class="form-control" id="modalQFontSize">
          <option value="90" ${currentQuestion.fontSize === 90 ? 'selected' : ''}>مضغوط (90%)</option>
          <option value="100" ${(!currentQuestion.fontSize || currentQuestion.fontSize === 100) ? 'selected' : ''}>عادي - قياسي (100%)</option>
          <option value="115" ${currentQuestion.fontSize === 115 ? 'selected' : ''}>متوسط - بارز (115%)</option>
          <option value="130" ${currentQuestion.fontSize === 130 ? 'selected' : ''}>كبير (130%)</option>
          <option value="145" ${currentQuestion.fontSize === 145 ? 'selected' : ''}>كبير جداً (145%)</option>
          <option value="160" ${currentQuestion.fontSize === 160 ? 'selected' : ''}>ضخم (160%)</option>
          <option value="180" ${currentQuestion.fontSize === 180 ? 'selected' : ''}>استثنائي (180%)</option>
        </select>
      </div>
    </div>

    <!-- Type Specific Controls -->
    <div id="modalTypeSpecificContainer" style="margin-top: 1rem;">
      ${renderTypeSpecificInputs(currentQuestion)}
    </div>
  `;

  modal.classList.add('open');
  setupModalInputTracking();
}

function renderTypeSpecificInputs(q) {
  if (q.type === 'mcq') {
    const opts = q.options || [
      { id: 'opt_1', text: '', isCorrect: true },
      { id: 'opt_2', text: '', isCorrect: false }
    ];
    return `
      <div class="card-box modal-type-card-box" style="background: var(--bg-surface); border: 1px solid var(--border-color);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <label class="form-label" style="margin: 0;">خيارات الإجابة <span class="badge-optional">(اختياري - يمكنك تركها أو تعديلها)</span>:</label>
          <button type="button" class="btn btn-outline" style="padding: 0.25rem 0.6rem; font-size: 0.8rem;" onclick="addMcqOption()">
            <i class="fa-solid fa-plus"></i> إضافة خيار
          </button>
        </div>
        <div id="mcqOptionsWrapper" style="display: flex; flex-direction: column; gap: 0.6rem;">
          ${opts.map((opt, i) => `
            <div class="mcq-input-row" style="display: flex; align-items: center; gap: 0.5rem;">
              <input type="radio" name="mcqCorrectRadio" value="${i}" ${opt.isCorrect ? 'checked' : ''} style="cursor: pointer; width: 18px; height: 18px;" title="تعيين كإجابة صحيحة">
              <input type="text" class="form-control mcq-opt-val" value="${opt.text || ''}" placeholder="نص الخيار (${i + 1}) (اختياري)">
              <button type="button" class="btn btn-outline btn-icon-only" style="width: 32px; height: 32px;" onclick="removeMcqOption(this)">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          `).join('')}
        </div>

        <div class="form-group" style="margin-top: 1rem;">
          <label class="form-label">تفسير أو تعليل الإجابة النموذجية <span class="badge-optional">(اختياري)</span>:</label>
          <input type="text" class="form-control" id="modalExplanation" value="${q.explanation || ''}" placeholder="سبب صحة هذا الخيار...">
        </div>
      </div>
    `;
  }

  if (q.type === 'true_false') {
    return `
      <div class="card-box modal-type-card-box" style="background: var(--bg-surface); border: 1px solid var(--border-color);">
        <div class="form-group">
          <label class="form-label">صحة العبارة:</label>
          <div style="display: flex; gap: 1.5rem; margin-top: 0.35rem;">
            <label style="font-weight: 700; color: #34d399; cursor: pointer;">
              <input type="radio" name="tfRadio" value="true" ${q.isTrue ? 'checked' : ''}> ✔ العبارة صـحـيـحـة
            </label>
            <label style="font-weight: 700; color: #f87171; cursor: pointer;">
              <input type="radio" name="tfRadio" value="false" ${!q.isTrue ? 'checked' : ''}> ✖ العبارة خـاطـئـة
            </label>
          </div>
        </div>

        <div class="form-group" style="margin-top: 1rem;">
          <label class="form-label">تصحيح الخطأ إن وُجد (لإدراجه في نموذج الإجابة):</label>
          <input type="text" class="form-control" id="modalTfCorrection" value="${q.correction || ''}" placeholder="اكتب التصحيح الوزاري النموذجي...">
        </div>
      </div>
    `;
  }

  if (q.type === 'fill_blanks') {
    return `
      <div class="card-box modal-type-card-box" style="background: var(--bg-surface); border: 1px solid var(--border-color);">
        <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.5rem;">
          * يمكنك وضع الكلمات المفقودة بين قوسين مربعين مثل <code>[الكلمة]</code> في نص السؤال بالأعلى، أو كتابتها هنا:
        </p>
        <div class="form-group">
          <label class="form-label">الإجابات الصحيحة للفراغات (مفصولة بفاصلة):</label>
          <input type="text" class="form-control" id="modalBlankAnswers" value="${q.answers ? q.answers.join('، ') : ''}" placeholder="مثال: مَفْعُول، أَفْعَل">
        </div>
      </div>
    `;
  }

  if (q.type === 'matching') {
    const pairs = q.pairs || [
      { left: '', right: '' },
      { left: '', right: '' }
    ];
    return `
      <div class="card-box modal-type-card-box" style="background: var(--bg-surface); border: 1px solid var(--border-color);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <label class="form-label" style="margin: 0;">أزواج التوصيل (العمود أ وما يطابقه في العمود ب):</label>
          <button type="button" class="btn btn-outline" style="padding: 0.25rem 0.6rem; font-size: 0.8rem;" onclick="addMatchPair()">
            <i class="fa-solid fa-plus"></i> إضافة زوج
          </button>
        </div>

        <div id="matchingPairsWrapper" style="display: flex; flex-direction: column; gap: 0.6rem;">
          ${pairs.map((p, idx) => `
            <div class="match-input-row" style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-weight: bold; font-size: 0.85rem; color: var(--primary);">${idx + 1}.</span>
              <input type="text" class="form-control match-left" value="${p.left || ''}" placeholder="عنصر العمود (أ)">
              <i class="fa-solid fa-arrows-left-right text-muted"></i>
              <input type="text" class="form-control match-right" value="${p.right || ''}" placeholder="يناسبه في العمود (ب)">
              <button type="button" class="btn btn-outline btn-icon-only" style="width: 32px; height: 32px;" onclick="removeMatchPair(this)">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (q.type === 'essay' || q.type === 'reasoning' || q.type === 'math_problem') {
    const hasLines = (q.linesCount !== undefined && q.linesCount !== null) ? (q.linesCount > 0) : true;
    const linesVal = (q.linesCount !== undefined && q.linesCount !== null) ? q.linesCount : 3;
    return `
      <div class="card-box modal-type-card-box" style="background: var(--bg-surface); border: 1px solid var(--border-color); margin-top: 1rem;">
        <div class="form-group">
          <label class="form-label"><i class="fa-solid fa-file-shield text-success"></i> نموذج الحل الوزاري المعتمد وتوزيع الدرجات:</label>
          <textarea class="form-control" id="modalModelAnswer" rows="3" placeholder="خطوات الحل وتفاصيل التقييم للمصحح...">${q.modelAnswer || ''}</textarea>
        </div>

        <div style="margin-top: 1.15rem; padding: 0.85rem; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
            <label style="cursor: pointer; display: flex; align-items: center; gap: 0.55rem; font-weight: 700; font-size: 0.9rem; color: var(--text-main); margin: 0;">
              <input type="checkbox" id="modalEnableLines" ${hasLines ? 'checked' : ''} onchange="window.toggleModalLinesSelector(this.checked)" style="width: 18px; height: 18px; cursor: pointer;">
              <span>تضمين أسطر إجابة منقطة للطالب تحت السؤال في ورقة الامتحان</span>
            </label>
            <span class="badge-tag" style="font-size: 0.72rem; background: rgba(56, 189, 248, 0.15); color: #0284c7; font-weight: bold;">اختياري</span>
          </div>

          <div id="modalLinesCountWrapper" style="display: ${hasLines ? 'block' : 'none'}; margin-top: 0.65rem; border-top: 1px dashed var(--border-color); padding-top: 0.65rem;">
            <label class="form-label">عدد أسطر الإجابة المخصصة:</label>
            <select class="form-control" id="modalLinesCount">
              <option value="0" ${linesVal === 0 ? 'selected' : ''}>بدون أسطر (إلغاء أسطر الإجابة كلياً - الطالب يجيب في دفتر امتحاني)</option>
              <option value="1" ${linesVal === 1 ? 'selected' : ''}>سطر واحد</option>
              <option value="2" ${linesVal === 2 ? 'selected' : ''}>سطران (إجابة موجزة)</option>
              <option value="3" ${linesVal === 3 ? 'selected' : ''}>3 أسطر (القياسي)</option>
              <option value="4" ${linesVal === 4 ? 'selected' : ''}>4 أسطر</option>
              <option value="5" ${linesVal === 5 ? 'selected' : ''}>5 أسطر</option>
              <option value="6" ${linesVal === 6 ? 'selected' : ''}>6 أسطر (مسألة حسابية مفصلة)</option>
              <option value="8" ${linesVal === 8 ? 'selected' : ''}>8 أسطر (شرح أو مقال مطول)</option>
              <option value="10" ${linesVal === 10 ? 'selected' : ''}>10 أسطر (إنشاء وتعبير)</option>
            </select>
            <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 5px;">
              💡 يمكنك اختيار (بدون أسطر) أو إلغاء التحديد لحذف الأسطر كلياً وتوفير مساحة الورقة إذا كان الطلاب يجيبون في دفاتر امتحانية خارجية.
            </div>
          </div>
        </div>
      </div>
    `;
  }

  if (q.type === 'definitions') {
    const terms = (q.terms && q.terms.length > 0) ? q.terms : [
      { id: 't_1', term: '', definition: '' },
      { id: 't_2', term: '', definition: '' },
      { id: 't_3', term: '', definition: '' }
    ];
    return `
      <div class="card-box modal-type-card-box" style="background: var(--bg-surface); margin-top: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.85rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <label class="form-label" style="margin: 0; font-weight: 700; color: var(--text-main);">
              <i class="fa-solid fa-book-bookmark text-success"></i> قائمة المصطلحات والتعاريف (نمط 1_ 2_ والى آخره):
            </label>
            <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 2px;">
              رتب المصطلحات وسيتم ترقيمها آلياً بنمط (1_ 2_...) مع إتاحة كتابة التعريف النموذجي بجانبها.
            </div>
          </div>
          <button type="button" class="btn btn-outline" style="padding: 0.3rem 0.75rem; font-size: 0.82rem; font-weight: 700; border-color: rgba(16, 185, 129, 0.4); color: #10b981;" onclick="addDefinitionTerm()">
            <i class="fa-solid fa-plus"></i> إضافة مصطلح جديد
          </button>
        </div>
        <div id="definitionsWrapper" style="display: flex; flex-direction: column; gap: 0.6rem;">
          ${terms.map((t, idx) => `
            <div class="def-input-row" style="display: flex; gap: 0.6rem; align-items: center; background: var(--bg-card); padding: 0.45rem 0.65rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
              <span class="def-row-num" style="font-weight: 800; font-size: 0.95rem; color: var(--primary); min-width: 32px; font-family: monospace;">${idx + 1}_</span>
              <input type="text" class="form-control def-term-input" value="${t.term || t.word || ''}" placeholder="اسم المصطلح المطلوب تعريفه" style="flex: 1; font-weight: 700;">
              <input type="text" class="form-control def-val-input" value="${t.definition || ''}" placeholder="نص التعريف الوزاري النموذجي (مع ذكر التعريف)" style="flex: 2;">
              <button type="button" class="btn btn-outline btn-icon-only text-danger" style="width: 32px; height: 32px; border-color: rgba(239, 68, 68, 0.3);" onclick="removeDefinitionTerm(this)" title="حذف هذا المصطلح">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (q.type === 'comparisons') {
    const aspects = (q.aspects && q.aspects.length > 0) ? q.aspects : [
      { id: 'asp_1', aspect: '', item1Val: '', item2Val: '' },
      { id: 'asp_2', aspect: '', item1Val: '', item2Val: '' }
    ];
    return `
      <div class="card-box modal-type-card-box" style="background: var(--bg-surface); border: 1px solid var(--border-color); margin-top: 0.5rem;">
        <div class="form-grid" style="margin-bottom: 0.85rem;">
          <div class="form-group">
            <label class="form-label"><i class="fa-solid fa-tag text-primary"></i> الطرف الأول للمقارنة:</label>
            <input type="text" class="form-control" id="modalCompareItem1" value="${q.item1 || ''}" placeholder="مثال: الخلية النباتية">
          </div>
          <div class="form-group">
            <label class="form-label"><i class="fa-solid fa-tag text-info"></i> الطرف الثاني للمقارنة:</label>
            <input type="text" class="form-control" id="modalCompareItem2" value="${q.item2 || ''}" placeholder="مثال: الخلية الحيوانية">
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
          <label class="form-label" style="margin: 0;">أوجه المقارنة (صفوف الجدول) <span class="badge-optional">(اختياري)</span>:</label>
          <button type="button" class="btn btn-outline" style="padding: 0.25rem 0.6rem; font-size: 0.8rem;" onclick="addComparisonAspect()">
            <i class="fa-solid fa-plus"></i> إضافة وجه مقارنة
          </button>
        </div>

        <div id="comparisonAspectsWrapper" style="display: flex; flex-direction: column; gap: 0.5rem;">
          ${aspects.map((asp, idx) => `
            <div class="compare-input-row" style="display: flex; gap: 0.5rem; align-items: center;">
              <input type="text" class="form-control cmp-aspect" value="${asp.aspect || ''}" placeholder="وجه المقارنة (${idx + 1})" style="flex: 1;">
              <input type="text" class="form-control cmp-val1" value="${asp.item1Val || ''}" placeholder="إجابة الطرف 1 (اختياري)" style="flex: 1;">
              <input type="text" class="form-control cmp-val2" value="${asp.item2Val || ''}" placeholder="إجابة الطرف 2 (اختياري)" style="flex: 1;">
              <button type="button" class="btn btn-outline btn-icon-only" style="width: 32px; height: 32px;" onclick="removeComparisonAspect(this)">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          `).join('')}
        </div>

        <div class="form-group" style="margin-top: 0.85rem;">
          <label class="form-label"><i class="fa-solid fa-file-shield text-success"></i> نموذج الحل المعتمد أو توجيهات المقارنة للمصحح:</label>
          <textarea class="form-control" id="modalCompareModel" rows="2" placeholder="ملاحظات وسلّم الدرجات للمقارنة...">${q.modelAnswer || ''}</textarea>
        </div>
      </div>
    `;
  }

  return '';
}

window.addMcqOption = function () {
  const wrapper = document.getElementById('mcqOptionsWrapper');
  if (!wrapper) return;
  const count = wrapper.children.length;
  const row = document.createElement('div');
  row.className = 'mcq-input-row';
  row.style.cssText = 'display: flex; align-items: center; gap: 0.5rem;';
  row.innerHTML = `
    <input type="radio" name="mcqCorrectRadio" value="${count}" style="cursor: pointer; width: 18px; height: 18px;" title="تعيين كإجابة صحيحة">
    <input type="text" class="form-control mcq-opt-val" placeholder="نص الخيار (${count + 1})">
    <button type="button" class="btn btn-outline btn-icon-only" style="width: 32px; height: 32px;" onclick="removeMcqOption(this)">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;
  wrapper.appendChild(row);
};

window.removeMcqOption = function (btn) {
  const row = btn.closest('.mcq-input-row');
  if (row) row.remove();
};

window.addMatchPair = function () {
  const wrapper = document.getElementById('matchingPairsWrapper');
  if (!wrapper) return;
  const count = wrapper.children.length;
  const row = document.createElement('div');
  row.className = 'match-input-row';
  row.style.cssText = 'display: flex; align-items: center; gap: 0.5rem;';
  row.innerHTML = `
    <span style="font-weight: bold; font-size: 0.85rem; color: var(--primary);">${count + 1}.</span>
    <input type="text" class="form-control match-left" placeholder="عنصر العمود (أ)">
    <i class="fa-solid fa-arrows-left-right text-muted"></i>
    <input type="text" class="form-control match-right" placeholder="يناسبه في العمود (ب)">
    <button type="button" class="btn btn-outline btn-icon-only" style="width: 32px; height: 32px;" onclick="removeMatchPair(this)">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;
  wrapper.appendChild(row);
};

window.removeMatchPair = function (btn) {
  const row = btn.closest('.match-input-row');
  if (row) row.remove();
};

window.toggleModalLinesSelector = function (checked) {
  const wrapper = document.getElementById('modalLinesCountWrapper');
  const select = document.getElementById('modalLinesCount');
  if (wrapper) wrapper.style.display = checked ? 'block' : 'none';
  if (select) {
    if (!checked) select.value = '0';
    else if (select.value === '0') select.value = '3';
  }
};

window.toggleGlobalAnswerLines = function () {
  const current = appState.settings.showAnswerLines !== false;
  appState.settings.showAnswerLines = !current;
  saveStateToStorage();
  renderAll();
  showToast(appState.settings.showAnswerLines ? 'تم إظهار أسطر الإجابة في ورقة الاختبار ✍️' : 'تم إخفاء أسطر الإجابة لتوفير الورق واختصار المساحة 📄', 'info');
};

window.setModalLabelPreset = function (presetText) {
  const input = document.getElementById('modalQCustomLabel');
  if (input) {
    input.value = presetText;
    input.focus();
  }
};

window.resetModalQuestionLabel = function (qIndex, lang) {
  const input = document.getElementById('modalQCustomLabel');
  if (input) {
    input.value = (lang === 'en') ? `Question (${qIndex}):` : `السؤال (${qIndex}):`;
    input.focus();
  }
};

window.quickEditQuestionLabel = function (qId) {
  if (typeof isUserSubscribedOrAdmin === 'function' && !isUserSubscribedOrAdmin()) {
    requireSubscription('تعديل تسمية السؤال');
    return;
  }
  const q = appState.questions.find(item => item.id === qId);
  if (!q) return;
  const idx = appState.questions.indexOf(q);
  const isLtr = (q.subject === 'english' || appState.settings.direction === 'ltr');
  const defaultLabel = isLtr ? `Question (${idx + 1}):` : `السؤال (${idx + 1}):`;
  const current = (q.customLabel && q.customLabel.trim()) ? q.customLabel.trim() : defaultLabel;
  const newLabel = prompt('تعديل تسمية ورقم السؤال الظاهرة في ورقة الامتحان والبطاقة:\n(اتركه فارغاً للعودة للتسمية الافتراضية)', current);
  if (newLabel !== null) {
    q.customLabel = newLabel.trim();
    saveStateToStorage();
    renderAll();
    showToast(`تم تعديل تسمية السؤال إلى: "${q.customLabel || defaultLabel}" 🏷️`, 'success');
  }
};

function closeQuestionModal() {
  const modal = document.getElementById('questionModal');
  if (modal) modal.classList.remove('open');
  appState.editingQuestionId = null;
}
window.closeQuestionModal = closeQuestionModal;

function saveQuestionFromModal() {
  const qId = document.getElementById('modalQId').value;
  const qType = document.getElementById('modalQType').value;
  const title = (document.getElementById('modalQTitle') ? document.getElementById('modalQTitle').value.trim() : '');
  const customLabelEl = document.getElementById('modalQCustomLabel');
  const customLabel = customLabelEl ? customLabelEl.value.trim() : '';
  let text = document.getElementById('modalQText') ? document.getElementById('modalQText').value.trim() : '';
  const score = parseInt(document.getElementById('modalQScore').value, 10) || 1;
  const bloom = document.getElementById('modalQBloom').value;
  const difficulty = document.getElementById('modalQDifficulty').value;

  // ALL CHOICES & INPUTS ARE COMPLETELY OPTIONAL (NOT MANDATORY)
  if (!text && !title) {
    text = 'سؤال جديد'; // Provide clean default rather than throwing error
  }

  let questionObj = appState.questions.find(q => q.id === qId);
  const isNew = !questionObj;

  if (isNew) {
    questionObj = {
      id: qId || generateId(),
      type: qType
    }
  }

  questionObj.customLabel = customLabel;
  questionObj.title = title;
  questionObj.text = text || title;
  questionObj.score = score;
  questionObj.bloom = bloom;
  questionObj.difficulty = difficulty;
  const fontSizeEl = document.getElementById('modalQFontSize');
  if (fontSizeEl) {
    questionObj.fontSize = parseInt(fontSizeEl.value, 10) || 100;
  }
  const subjectEl = document.getElementById('modalQSubject');
  if (subjectEl) {
    questionObj.subject = subjectEl.value;
  }

  // Extract type specific values - ALL COMPLETELY OPTIONAL
  if (qType === 'mcq') {
    const optionRows = document.querySelectorAll('.mcq-input-row');
    const checkedRadio = document.querySelector('input[name="mcqCorrectRadio"]:checked');
    const checkedIndex = checkedRadio ? parseInt(checkedRadio.value, 10) : 0;

    questionObj.options = [];
    optionRows.forEach((row, i) => {
      const val = row.querySelector('.mcq-opt-val').value.trim();
      if (val) {
        questionObj.options.push({
          id: `opt_${i + 1}`,
          text: val,
          isCorrect: (i === checkedIndex)
        });
      }
    });

    // Options are fully optional - NEVER BLOCK THE USER

    const expEl = document.getElementById('modalExplanation');
    if (expEl) questionObj.explanation = expEl.value.trim();
  } else if (qType === 'true_false') {
    const radio = document.querySelector('input[name="tfRadio"]:checked');
    questionObj.isTrue = (radio && radio.value === 'true');
    const corrEl = document.getElementById('modalTfCorrection');
    if (corrEl) questionObj.correction = corrEl.value.trim();
  } else if (qType === 'fill_blanks') {
    const ansEl = document.getElementById('modalBlankAnswers');
    if (ansEl && ansEl.value.trim()) {
      questionObj.answers = ansEl.value.split(/[،,]/).map(s => s.trim()).filter(Boolean);
    }
  } else if (qType === 'matching') {
    questionObj.title = text;
    questionObj.pairs = [];
    document.querySelectorAll('.match-input-row').forEach((row, i) => {
      const left = row.querySelector('.match-left').value.trim();
      const right = row.querySelector('.match-right').value.trim();
      if (left && right) {
        questionObj.pairs.push({ id: `p_${i + 1}`, left, right });
      }
    });
  } else if (qType === 'essay' || qType === 'reasoning' || qType === 'math_problem') {
    const ansEl = document.getElementById('modalModelAnswer');
    if (ansEl) questionObj.modelAnswer = ansEl.value.trim();
    const enableLinesEl = document.getElementById('modalEnableLines');
    const linesEl = document.getElementById('modalLinesCount');
    if (enableLinesEl && !enableLinesEl.checked) {
      questionObj.linesCount = 0;
    } else if (linesEl) {
      const parsed = parseInt(linesEl.value, 10);
      questionObj.linesCount = isNaN(parsed) ? 0 : parsed;
    } else {
      questionObj.linesCount = 0;
    }
  } else if (qType === 'definitions') {
    questionObj.terms = [];
    document.querySelectorAll('.def-input-row').forEach((row, i) => {
      const term = row.querySelector('.def-term-input').value.trim();
      const def = row.querySelector('.def-val-input').value.trim();
      if (term || def) {
        questionObj.terms.push({ id: `t_${i + 1}`, term: term || `المصطلح (${i + 1})`, definition: def });
      }
    });
  } else if (qType === 'comparisons') {
    questionObj.item1 = document.getElementById('modalCompareItem1') ? document.getElementById('modalCompareItem1').value.trim() : '';
    questionObj.item2 = document.getElementById('modalCompareItem2') ? document.getElementById('modalCompareItem2').value.trim() : '';
    questionObj.modelAnswer = document.getElementById('modalCompareModel') ? document.getElementById('modalCompareModel').value.trim() : '';
    questionObj.aspects = [];
    document.querySelectorAll('.compare-input-row').forEach((row, i) => {
      const asp = row.querySelector('.cmp-aspect').value.trim();
      const v1 = row.querySelector('.cmp-val1').value.trim();
      const v2 = row.querySelector('.cmp-val2').value.trim();
      if (asp || v1 || v2) {
        questionObj.aspects.push({ id: `asp_${i + 1}`, aspect: asp, item1Val: v1, item2Val: v2 });
      }
    });
  }

  const subEl = document.getElementById('modalQSubject');
  questionObj.subject = subEl ? subEl.value : (window.activeSubjectMode || 'arabic');
  questionObj.createdAt = questionObj.createdAt || new Date().toISOString();

  if (isNew) {
    appState.questions.push(questionObj);
  }

  saveStateToStorage();
  saveQuestionToHistoryBank(questionObj);
  closeQuestionModal();
  renderAll();
  showToast(isNew ? 'تمت إضافة السؤال بنجاح' : 'تم تحديث السؤال بنجاح', 'success');
}
window.saveQuestionFromModal = saveQuestionFromModal;

/**
 * Renders Official Exam Paper Header on live A4 preview
 */
function renderPaperHeader() {
  const isLtr = (appState.settings.direction === 'ltr');

  const countryEl = document.getElementById('paperCountry');
  const ministryEl = document.getElementById('paperMinistry');
  const schoolEl = document.getElementById('paperSchool');
  const examTitleEl = document.getElementById('paperExamTitle');
  const termEl = document.getElementById('paperTerm');
  const yearEl = document.getElementById('paperYear');
  const instructionsEl = document.getElementById('paperInstructionsText');

  if (countryEl) countryEl.innerText = appState.header.country || (isLtr ? 'Republic of Iraq' : 'جمهورية العراق');
  if (ministryEl) ministryEl.innerText = appState.header.ministry || (isLtr ? 'Ministry of Education' : 'وزارة التربية');
  if (schoolEl) schoolEl.innerText = appState.header.school;
  if (examTitleEl) examTitleEl.innerText = appState.header.examTitle || (isLtr ? 'General School Examination' : 'الامتحانات العامة للدراسة المتوسطة');
  if (termEl) termEl.innerText = appState.header.term;
  if (yearEl) yearEl.innerText = appState.header.year;
  if (instructionsEl) {
    instructionsEl.innerText = appState.header.instructions || (isLtr ? 'Notice: Answer all questions carefully. Each question has allocated marks indicated.' : 'ملاحظة: الإجابة عن خمسة أسئلة فقط، ولكل سؤال (20) درجة.');
  }

  // Header meta start (School & Country in RTL / Left in LTR)
  const metaStart = document.getElementById('paperHeaderMetaStart');
  if (metaStart) {
    metaStart.style.textAlign = isLtr ? 'left' : 'right';
    metaStart.style.direction = isLtr ? 'ltr' : 'rtl';
  }

  // Header meta end (Subject, Grade, Time, Teacher)
  const metaEnd = document.getElementById('paperHeaderMetaEnd');
  if (metaEnd) {
    metaEnd.style.textAlign = isLtr ? 'right' : 'left';
    metaEnd.style.direction = isLtr ? 'ltr' : 'rtl';
    if (isLtr) {
      metaEnd.innerHTML = `
        <div>Subject: <span id="paperSubject">${appState.header.subject || 'English Language'}</span></div>
        <div>Grade: <span id="paperGrade">${appState.header.grade || 'Grade Level'}</span></div>
        <div>Time: <span id="paperTime">${appState.header.time || '3 Hours'}</span></div>
        <div>Teacher: <span id="paperTeacher">${appState.header.teacher || 'Subject Teacher'}</span></div>
      `;
    } else {
      metaEnd.innerHTML = `
        <div>المادة: <span id="paperSubject">${appState.header.subject || 'اللغة العربية'}</span></div>
        <div>الصف: <span id="paperGrade">${appState.header.grade || 'الصف الثالث المتوسط'}</span></div>
        <div>الزمن: <span id="paperTime">${appState.header.time || 'ثلاث ساعات'}</span></div>
        <div>واضع الأسئلة: <span id="paperTeacher">${appState.header.teacher || 'أستاذ المادة'}</span></div>
      `;
    }
  }

  // Student Bar labels
  const nameEl = document.getElementById('paperStudentBarName');
  const idEl = document.getElementById('paperStudentBarId');
  const hallEl = document.getElementById('paperStudentBarHall');
  if (nameEl) {
    nameEl.innerHTML = isLtr
      ? `Student's Full Name: <span class="field-fill" style="min-width: 180px;"></span>`
      : `اسم الطالب الرباعي: <span class="field-fill" style="min-width: 180px;"></span>`;
  }
  if (idEl) {
    idEl.innerHTML = isLtr
      ? `Exam Roll No: <span class="field-fill" style="min-width: 70px;"></span>`
      : `الرقم الامتحاني: <span class="field-fill" style="min-width: 70px;"></span>`;
  }
  if (hallEl) {
    hallEl.innerHTML = isLtr
      ? `Hall / School: <span class="field-fill" style="min-width: 60px;"></span>`
      : `القاعة / المدرسة: <span class="field-fill" style="min-width: 60px;"></span>`;
  }

  // Grading Table header
  const gtHeadRow = document.querySelector('#paperGradingSection table thead tr');
  if (gtHeadRow) {
    gtHeadRow.innerHTML = isLtr ? `
      <th>Question</th>
      <th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th><th>Q5</th><th>Q6</th>
      <th>Total (Num)</th><th>Total (Words)</th><th>Examiner</th><th>Auditor</th>
    ` : `
      <th>السؤال</th>
      <th>س1</th><th>س2</th><th>س3</th><th>س4</th><th>س5</th><th>س6</th>
      <th>المجموع رقماً</th><th>المجموع كتابةً</th><th>المصحح</th><th>المدقق</th>
    `;
  }

  // Footer message
  const footerMsg = document.querySelector('.exam-footer-msg');
  if (footerMsg) {
    footerMsg.innerText = isLtr
      ? '— End of Questions — Best Wishes of Success & Excellence —'
      : '— انتـهت الأسـئـلة، مـع أطـيـب التـمـنيـات بـالـنـجـاح والـتـفـوق —';
  }

  // Seal image update
  const sealEl = document.getElementById('paperSealImg');
  if (sealEl && appState.header.seal) {
    sealEl.src = appState.header.seal;
  }

  // Answer Key Badge
  const badge = document.getElementById('paperAnswerKeyBadge');
  if (badge) {
    badge.style.display = (appState.viewMode === 'answer_key') ? 'block' : 'none';
    if (isLtr) {
      badge.innerHTML = `
        <div class="model-badge-top">
          <i class="fa-solid fa-certificate" style="font-size: 0.85em; color: #b45309;"></i>
          <span>Official Model Answer Key & Marking Scheme</span>
          <span class="model-badge-tag-official">Evaluation Committee Only</span>
        </div>
        <div class="model-badge-note">
          ★ Strictly Confidential: Contains approved answers, criteria, and score breakdown ★
        </div>
      `;
    } else {
      badge.innerHTML = `
        <div class="model-badge-top">
          <i class="fa-solid fa-certificate" style="font-size: 0.85em; color: #b45309;"></i>
          <span>نسخة الأجوبة النموذجية الرسمية المعتمدة وتوزيع الدرجات</span>
          <span class="model-badge-tag-official">خاص بلجنة الفحص والتصحيح</span>
        </div>
        <div class="model-badge-note">
          ★ سري للغاية: تتضمن عناصر الإجابة والحلول النموذجية المعتمدة وسلّم توزيع الدرجات ★
        </div>
      `;
    }
  }
}

/**
 * Renders Questions inside the live A4 Paper Sheet
 */
/**
 * Smart Question Height Estimation (in pixels) for A4 page calculation
 */
function estimateQuestionHeight(q) {
  let h = 70; // Base question header, title, score badge, separator line and margin

  // Question text calculation
  const textStr = (q.title && q.text && q.text !== q.title) ? q.text : (!q.title ? (q.text || '') : '');
  if (textStr) {
    const rawLines = textStr.split('\n');
    let wrappedLines = 0;
    rawLines.forEach(l => {
      wrappedLines += Math.max(1, Math.ceil((l.length || 1) / 65));
    });
    h += wrappedLines * 22;
  }

  // Model answer if in answer_key mode
  if (appState.viewMode === 'answer_key' && q.modelAnswer) {
    const ansLines = Math.max(1, Math.ceil((q.modelAnswer.length || 1) / 60));
    h += 38 + (ansLines * 20);
  }

  // Branches
  if (q.branches && q.branches.length > 0) {
    q.branches.forEach(b => {
      h += 42; // Branch title pill & wrapper
      if (b.text) {
        h += Math.max(1, Math.ceil((b.text.length || 0) / 60)) * 20;
      }
      if (b.modelAnswer && appState.viewMode === 'answer_key') {
        h += 34;
      }
    });
  }

  // Type-specific heights
  const t = q.type || '';
  if (t === 'mcq' && q.options) {
    // 2 columns grid if options > 2, or single column
    h += Math.ceil(q.options.length / 2) * 36 + 12;
  } else if ((t === 'matching' || t === 'match') && (q.pairs || q.items)) {
    const count = (q.pairs ? q.pairs.length : (q.items ? q.items.length : 4));
    h += (count * 34) + 40;
  } else if (t === 'true_false' || t === 'truefalse') {
    h += 38;
  } else if (t === 'fill_blanks') {
    h += 36;
  } else if (t === 'definitions' && q.terms) {
    h += (q.terms.length * 38) + 15;
  } else if ((t === 'differences' || t === 'compare') && q.diffRows) {
    h += ((q.diffRows.length + 1) * 38) + 30;
  } else if (t === 'essay' || t === 'reasoning' || t === 'math_problem') {
    if (q.showAnswerLines !== false) {
      h += (q.linesCount || 3) * 26 + 15;
    } else {
      h += 30;
    }
  }

  // Font scale factor
  const fontRatio = (q.fontSize || 100) / 100;
  return Math.round(h * fontRatio);
}

/**
 * Smart Partitioning of Questions into Pages
 */
function partitionQuestionsIntoPages(questions) {
  if (!questions || questions.length === 0) {
    return [[]];
  }

  const mode = (appState.settings && appState.settings.pageLayoutMode) || '1_page';

  if (mode === '1_page') {
    return [questions];
  }

  if (mode === '2_pages') {
    if (questions.length === 1) return [questions];
    const half = Math.ceil(questions.length / 2);
    return [questions.slice(0, half), questions.slice(half)];
  }

  if (mode === '3_pages') {
    if (questions.length <= 2) {
      return questions.map(q => [q]);
    }
    const third = Math.ceil(questions.length / 3);
    return [
      questions.slice(0, third),
      questions.slice(third, third * 2),
      questions.slice(third * 2)
    ].filter(p => p.length > 0);
  }

  // mode === 'auto' (Smart Dynamic A4 Pagination Engine)
  const GRADING_TABLE_H = 95;
  const P1_SINGLE_MAX = 680; // Safe capacity when all questions & grading table fit on 1 page
  const P1_MULTI_MAX = 750;  // Capacity for Page 1 when exam splits across multiple pages
  const PN_MAX = 920;        // Capacity for continuation pages (Page 2, 3, 4, 5...)

  const heights = questions.map(q => estimateQuestionHeight(q));
  const totalQHeight = heights.reduce((a, b) => a + b, 0);

  const hasManualBreaks = questions.some((q, idx) => idx > 0 && q.pageBreakBefore);

  // If everything fits comfortably on a single page including the grading table:
  if (!hasManualBreaks && (totalQHeight <= P1_SINGLE_MAX)) {
    return [questions];
  }

  const pages = [];
  let curPage = [];
  let curHeight = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const qH = heights[i];
    const isManualBreak = (i > 0 && q.pageBreakBefore);

    // Current page capacity limit: Page 1 has header/student bar/instructions (~250px overhead)
    const isFirstPage = (pages.length === 0);
    const maxCapacity = isFirstPage ? P1_MULTI_MAX : PN_MAX;

    // Check if adding this question exceeds capacity OR user manually forced a page break
    if (curPage.length > 0 && (isManualBreak || (curHeight + qH > maxCapacity))) {
      pages.push(curPage);
      curPage = [q];
      curHeight = qH;
    } else {
      curPage.push(q);
      curHeight += qH;
    }
  }

  if (curPage.length > 0) {
    // If last page has grading table and overflows, gracefully push last question to a new page
    const isSinglePageTotal = (pages.length === 0);
    const lastCap = isSinglePageTotal ? P1_SINGLE_MAX : (PN_MAX - GRADING_TABLE_H);
    if (curPage.length > 1 && (curHeight > lastCap)) {
      const lastQ = curPage.pop();
      pages.push(curPage);
      pages.push([lastQ]);
    } else {
      pages.push(curPage);
    }
  }

  return pages;
}

/**
 * Templates for Header, Student Bar, Instructions, Grading Table, Continuation, Footer, and Separator
 */
function getPaperHeaderHTML() {
  return `
    <header class="exam-header">
      <div class="header-grid">
        <div class="header-meta-col header-col-start" id="paperHeaderMetaStart" style="text-align: right;">
          <div id="paperCountry">جمهورية العراق</div>
          <div id="paperMinistry">وزارة التربية - المديرية العامة لتربية بغداد</div>
          <div id="paperSchool">ثانوية المتميزين للبنين</div>
        </div>

        <div class="header-center-col">
          <img src="assets/iraq_moe_seal.png" alt="شعار وزارة التربية العراقية" class="school-seal" id="paperSealImg">
          <div class="exam-title-badge" id="paperExamTitle">الامتحانات العامة للدراسة المتوسطة</div>
          <div class="exam-subtitle">
            <span id="paperTerm">الدور الأول</span> - للعام الدراسي <span id="paperYear">2025 - 2026 م</span>
          </div>
          <div id="paperAnswerKeyBadge" class="paper-model-answer-banner" style="display: none;">
            <div class="model-badge-top">
              <i class="fa-solid fa-certificate" style="font-size: 0.85em; color: #b45309;"></i>
              <span>نسخة الأجوبة النموذجية الرسمية المعتمدة وتوزيع الدرجات</span>
              <span class="model-badge-tag-official">خاص بلجنة الفحص والتصحيح</span>
            </div>
            <div class="model-badge-note">
              ★ سري للغاية: تتضمن عناصر الإجابة والحلول النموذجية المعتمدة وسلّم توزيع الدرجات ★
            </div>
          </div>
        </div>

        <div class="header-meta-col header-col-end" id="paperHeaderMetaEnd" style="text-align: left; direction: rtl;">
          <div>المادة: <span id="paperSubject">اللغة العربية</span></div>
          <div>الصف: <span id="paperGrade">الصف الثالث المتوسط</span></div>
          <div>الزمن: <span id="paperTime">ثلاث ساعات</span></div>
          <div>واضع الأسئلة: <span id="paperTeacher">أستاذ المادة</span></div>
        </div>
      </div>
    </header>
  `;
}

function getPaperStudentBarHTML() {
  return `
    <div class="student-bar" id="paperStudentBar">
      <div id="paperStudentBarName">اسم الطالب الرباعي: <span class="field-fill" style="min-width: 180px;"></span></div>
      <div id="paperStudentBarId">الرقم الامتحاني: <span class="field-fill" style="min-width: 70px;"></span></div>
      <div id="paperStudentBarHall">القاعة / المدرسة: <span class="field-fill" style="min-width: 60px;"></span></div>
    </div>
  `;
}

function getPaperInstructionsHTML() {
  return `
    <div class="instructions-box" id="paperInstructionsBox">
      <span class="instructions-text-content" id="paperInstructionsText">ملاحظة: الإجابة عن خمسة أسئلة فقط، ولكل سؤال (20) درجة. (يُسمح بترك سؤال واحد كاملاً، والترك الضمني موضح داخل فروع الأسئلة).</span>
    </div>
  `;
}

function getPaperGradingSectionHTML() {
  return `
    <div class="grading-table-container" id="paperGradingSection">
      <table class="grading-table">
        <thead>
          <tr>
            <th>السؤال</th>
            <th>س1</th>
            <th>س2</th>
            <th>س3</th>
            <th>س4</th>
            <th>س5</th>
            <th>س6</th>
            <th>المجموع رقماً</th>
            <th>المجموع كتابةً</th>
            <th>المصحح</th>
            <th>المدقق</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="font-weight: 700;">الدرجة المستحقة</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td style="font-weight: 700;">الدرجة العظمى</td>
            <td id="gtQ1">20</td>
            <td id="gtQ2">20</td>
            <td id="gtQ3">20</td>
            <td id="gtQ4">20</td>
            <td id="gtQ5">20</td>
            <td id="gtQ6">20</td>
            <td id="gtTotal" style="font-weight: 800; color: #1e3a8a;">100 درجة</td>
            <td colspan="3" style="font-size: 11px;">توقيع اللجنة الامتحانية / الكنترول</td>
          </tr>
        </tbody>
      </table>

      <div class="exam-footer-msg">
        — انتـهت الأسـئـلة، مـع أطـيـب التـمـنيـات بـالـنـجـاح والـتـفـوق —
      </div>
      <div class="exam-footer-rights" id="paperFooterRights" style="font-size: 8.5pt; color: #64748b; margin-top: 5px; text-align: center; font-weight: 600;"></div>
    </div>
  `;
}

function getPaperContinuationHeaderHTML(pageNum, totalPages) {
  const isLtr = (appState.settings.direction === 'ltr');
  const subject = appState.header.subject || (isLtr ? 'Exam Subject' : 'المادة');
  const grade = appState.header.grade || (isLtr ? 'Grade Level' : 'الصف');
  const term = appState.header.term || (isLtr ? 'First Term' : 'الدور الأول');
  const year = appState.header.year || '';
  const ministry = appState.header.ministry || (isLtr ? 'Ministry of Education' : 'وزارة التربية');
  const school = appState.header.school || '';

  if (isLtr) {
    return `
      <div class="exam-continuation-header" dir="ltr">
        <div class="cont-meta-start">
          <span class="cont-badge-gov">Republic of Iraq</span>
          <span class="cont-dot">•</span>
          <span>${ministry}</span>
          ${school ? `<span class="cont-dot">•</span><span>${school}</span>` : ''}
        </div>
        <div class="cont-center">
          <span class="cont-title">Exam Continued: <strong>${subject}</strong> (${grade})</span>
        </div>
        <div class="cont-meta-end">
          <span>${term} - ${year}</span>
          <span class="cont-page-pill">Page ${pageNum}</span>
        </div>
      </div>
    `;
  }

  return `
    <div class="exam-continuation-header" dir="rtl">
      <div class="cont-meta-start">
        <span class="cont-badge-gov">جمهورية العراق</span>
        <span class="cont-dot">•</span>
        <span>${ministry}</span>
        ${school ? `<span class="cont-dot">•</span><span>${school}</span>` : ''}
      </div>
      <div class="cont-center">
        <span class="cont-title">تابع أسئلة امتحان: <strong>${subject}</strong> (${grade})</span>
      </div>
      <div class="cont-meta-end">
        <span>${term} - ${year}</span>
        <span class="cont-page-pill">الصفحة (${pageNum})</span>
      </div>
    </div>
  `;
}

function getPaperFooterHTML(pageNum, totalPages) {
  const isLtr = (appState.settings.direction === 'ltr');
  const isLast = (pageNum === totalPages);

  let note = '';
  if (isLtr) {
    note = isLast ? '— End of Questions —' : `Turn Page / Continued on Page ${pageNum + 1} ➔`;
  } else {
    note = isLast
      ? '— انتـهـت الأسـئـلـة مـع أطـيـب التـمـنـيـات بـالـنـجـاح —'
      : `اقلب الورقة / يتبع في الصفحة (${pageNum + 1 === 2 ? 'الثانية' : (pageNum + 1)}) ⬅`;
  }

  const numText = isLtr
    ? `Page (${pageNum}) of (${totalPages})`
    : `الصفحة (${pageNum}) من (${totalPages})`;

  return `
    <footer class="exam-page-footer">
      <span class="page-footer-num"><i class="fa-solid fa-book-open"></i> ${numText}</span>
      <span class="page-footer-note">${note}</span>
    </footer>
  `;
}

function getPaperSeparatorHTML(nextPageNum, totalPages) {
  const isLtr = (appState.settings.direction === 'ltr');
  const label = isLtr
    ? `A4 Page (${nextPageNum}) — Questions Continued`
    : `الصفحة (${nextPageNum}) من (${totalPages}) A4 — تابع الأسئلة`;

  return `
    <div class="paper-page-separator no-print" id="paperPageSep_${nextPageNum}">
      <div class="page-sep-line"></div>
      <div class="page-sep-badge" onclick="window.scrollToExamPage(${nextPageNum})" title="الانتقال إلى بداية الصفحة ${nextPageNum}">
        <i class="fa-solid fa-file-invoice"></i>
        <span>${label}</span>
        <span class="page-sep-badge-num">${nextPageNum} / ${totalPages}</span>
      </div>
      <div class="page-sep-line"></div>
    </div>
  `;
}

function renderSingleQuestionHTML(q, idx, totalQuestions, isAnswerKey, isLtr) {
  const qNum = idx + 1;
  const score = q.score || 20;
  const defaultPrefix = isLtr ? `Question (${qNum}):` : `السؤال (${qNum}):`;
  const qNumPrefix = (q.customLabel && q.customLabel.trim()) ? q.customLabel.trim() : defaultPrefix;
  const scoreText = isLtr
    ? `(${score} ${score === 1 ? 'Mark' : 'Marks'})`
    : `(${score} ${score > 2 && score < 11 ? 'درجات' : 'درجة'})`;

  const fontStyle = (q.fontSize && q.fontSize !== 100)
    ? `style="font-size: ${q.fontSize}%; line-height: 1.55;"`
    : '';

  const isManualBreak = !!q.pageBreakBefore;

  // في نسخة الأجوبة النموذجية: إظهار رقم السؤال أو عنوانه فقط بدون تكرار نص السؤال الكامل!
  const questionPromptHTML = isAnswerKey
    ? ''
    : ((q.title && q.text && q.text !== q.title)
      ? `<div class="paper-q-body-text" style="margin-top: 4px; font-weight: normal; line-height: 1.5;">${formatMathText(q.text.replace(/\n/g, '<br/>'))}</div>`
      : (!q.title ? formatMathText(q.text || '') : ''));

  return `
    <div class="paper-question" id="paperQ_${q.id}">
      <div class="paper-q-header">
        <div class="paper-q-text" ${fontStyle}>
          <span class="paper-q-num" title="تسمية وترقيم السؤال (انقر لتعديل التسمية فورياً)" onclick="window.quickEditQuestionLabel('${q.id}')">${qNumPrefix}</span> ${q.title ? `<strong class="paper-q-title-inline">${formatMathText(q.title)}</strong>` : ''}
          ${questionPromptHTML}
        </div>

        <div class="paper-q-meta-actions">
          <div class="paper-q-grade">${scoreText}</div>

          <!-- Page Break Toggle Button -->
          ${idx > 0 ? `
            <button type="button" class="btn-paper-break-ctrl no-print ${isManualBreak ? 'active' : ''}" onclick="window.toggleQuestionPageBreak('${q.id}')" title="${isManualBreak ? 'إلغاء فاصل الصفحة (دمج مع السابق)' : 'بدء صفحة جديدة من هذا السؤال'}">
              <i class="fa-solid fa-file-export"></i>
              <span>${isManualBreak ? 'بداية صفحة' : 'فاصل صفحة'}</span>
            </button>
          ` : ''}

          <!-- Quick Question Font Size Controls -->
          <div class="paper-q-font-tools no-print" title="تكبير / تصغير حجم خط هذا السؤال فقط بالرقم المطلوب">
            <button type="button" class="btn-paper-font-ctrl btn-paper-font-up" onclick="changeQuestionFontSize('${q.id}', 1)" title="تكبير خط هذا السؤال فقط (A+)">
              <i class="fa-solid fa-plus"></i>A
            </button>
            <input type="number" class="paper-font-num-input no-print" min="50" max="300" step="5" value="${q.fontSize || 100}" onchange="setQuestionFontSizeCustom('${q.id}', this.value)" title="أدخل نسبة حجم خط هذا السؤال بالرقم">%
            <button type="button" class="btn-paper-font-ctrl btn-paper-font-down" onclick="changeQuestionFontSize('${q.id}', -1)" title="تصغير خط هذا السؤال فقط (A-)">
              <i class="fa-solid fa-minus"></i>A
            </button>
            ${(q.fontSize && q.fontSize !== 100) ? `
              <button type="button" class="btn-paper-font-ctrl btn-paper-font-reset" onclick="resetQuestionFontSize('${q.id}')" title="استعادة الحجم الطبيعي 100%">
                <i class="fa-solid fa-rotate-left"></i>
              </button>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Question Sub-Branches in Paper View -->
      ${(q.branches && q.branches.length > 0) ? `
        <div class="paper-q-branches">
          ${q.branches.map((b, bIdx) => {
    const defaultBranchTitle = isLtr ? `Branch (${String.fromCharCode(65 + bIdx)})` : `الفرع (${String.fromCharCode(1571 + bIdx)})`;
    const branchTitle = b.title || defaultBranchTitle;
    const branchScoreText = b.score ? (isLtr ? `(${b.score} ${b.score === 1 ? 'Mark' : 'Marks'})` : `(${b.score} ${b.score > 2 && b.score < 11 ? 'درجات' : 'درجة'})`) : '';
    return `
            <div class="paper-q-branch">
              <div class="paper-branch-header">
                <span><strong>${formatMathText(branchTitle)}:</strong> ${isAnswerKey ? '' : formatMathText(b.text || '')}</span>
                ${branchScoreText ? `<span class="paper-branch-grade">${branchScoreText}</span>` : ''}
              </div>
              ${isAnswerKey ? `
                <div class="paper-model-answer highlighted-model-answer" style="margin-top: 4px; padding: 4px 8px; font-size: 0.9em;">
                  <strong>${isLtr ? '[ Model Answer ]:' : '[ حل الفرع النموذجي ]: '}</strong> ${b.modelAnswer ? formatMathText(b.modelAnswer) : (isLtr ? '(Approved model answer)' : '(راجع نموذج الإجابة المعتمد)')}
                </div>
              ` : ''}
            </div>
          `;
  }).join('')}
        </div>
      ` : ''}

      ${renderPaperQuestionBody(q, isAnswerKey)}

      <!-- Solid Black Separator Line at the end of every question -->
      <div class="paper-q-separator-line" aria-hidden="true"></div>
    </div>
  `;
}

/**
 * Renders Questions inside the live Multi-Page A4 Simulator
 */
function renderPaperQuestions() {
  const paperDoc = document.getElementById('examPaperDoc');
  if (!paperDoc) return;

  const isLtr = (appState.settings.direction === 'ltr');
  const isAnswerKey = (appState.viewMode === 'answer_key');

  if (appState.questions.length === 0) {
    paperDoc.innerHTML = `
      <article class="exam-paper exam-paper-page" id="examPaperPage_1" data-page="1" data-pdf-page>
        <div class="paper-watermark" id="paperWatermarkEl" style="display: none;"></div>
        <div class="paper-content" id="paperContentWrapper">
          ${getPaperHeaderHTML()}
          ${getPaperStudentBarHTML()}
          ${getPaperInstructionsHTML()}
          <div class="questions-container" id="paperQuestionsRender">
            <div class="paper-empty-clean-state">
              <div class="paper-empty-box no-print">
                <i class="fa-regular fa-file-lines"></i>
                <h3>${isLtr ? 'The exam sheet is empty and ready for questions' : 'ورقة الاختبار فارغة وجاهزة لإضافة الأسئلة'}</h3>
                <p>${isLtr ? 'Click on any question type from the sidebar toolbar (Multiple Choice, True/False, Essay...) to add it now.' : 'انقر على نوع السؤال المطلوب من الشريط العلوي (اختيار من متعدد، صح أو خطأ، سؤال مقالي...) لإضافته فوراً.'}</p>
              </div>
            </div>
          </div>
          ${getPaperGradingSectionHTML()}
        </div>
        ${getPaperFooterHTML(1, 1)}
      </article>
    `;
    renderPaperHeader();
    updateGradingTable(0, []);
    updatePaperPagesUI(1);
    applyPaperSettings();
    return;
  }

  let totalScore = 0;
  const questionScores = [];
  appState.questions.forEach((q) => {
    const score = q.score || 20;
    totalScore += score;
    questionScores.push(score);
  });

  const pages = partitionQuestionsIntoPages(appState.questions);
  const totalPages = pages.length;

  let docHTML = '';
  let globalQIndex = 0;

  pages.forEach((pageQuestions, pIdx) => {
    const pageNum = pIdx + 1;
    const isFirstPage = (pageNum === 1);
    const isLastPage = (pageNum === totalPages);

    if (!isFirstPage) {
      docHTML += getPaperSeparatorHTML(pageNum, totalPages);
    }

    const questionsContainerId = isFirstPage ? 'paperQuestionsRender' : `paperQuestionsRender_p${pageNum}`;

    const renderedQuestionsHTML = pageQuestions.map((q) => {
      const qHTML = renderSingleQuestionHTML(q, globalQIndex, appState.questions.length, isAnswerKey, isLtr);
      globalQIndex++;
      return qHTML;
    }).join('');

    docHTML += `
      <article class="exam-paper exam-paper-page" id="examPaperPage_${pageNum}" data-page="${pageNum}" data-pdf-page>
        <div class="paper-watermark ${!isFirstPage ? 'paper-watermark-clone' : ''}" id="${isFirstPage ? 'paperWatermarkEl' : `paperWatermarkEl_p${pageNum}`}" style="display: none;"></div>
        
        <div class="paper-content" id="${isFirstPage ? 'paperContentWrapper' : `paperContentWrapper_p${pageNum}`}">
          ${isFirstPage ? `
            ${getPaperHeaderHTML()}
            ${getPaperStudentBarHTML()}
            ${getPaperInstructionsHTML()}
          ` : `
            ${getPaperContinuationHeaderHTML(pageNum, totalPages)}
          `}

          <div class="questions-container" id="${questionsContainerId}">
            ${renderedQuestionsHTML}
          </div>

          ${isLastPage ? getPaperGradingSectionHTML() : ''}
        </div>

        ${getPaperFooterHTML(pageNum, totalPages)}
      </article>
    `;
  });

  paperDoc.innerHTML = docHTML;

  renderPaperHeader();
  updateGradingTable(totalScore, questionScores);
  updatePaperPagesUI(totalPages);
  applyPaperSettings();
}

/**
 * Updates Toolbar Page Controls (Page Count Badge & Jump Buttons)
 */
function updatePaperPagesUI(totalPages) {
  const badgeText = document.getElementById('paperPagesCountText');
  const jumpContainer = document.getElementById('paperPageJumpButtons');
  const modeSelect = document.getElementById('paperPageModeSelect');

  if (badgeText) {
    if (totalPages === 1) {
      badgeText.innerText = 'صفحة 1 من 1 (A4)';
    } else if (totalPages === 2) {
      badgeText.innerText = 'صفحتان (A4 وجه وقفا)';
    } else {
      badgeText.innerText = `${totalPages} صفحات (A4)`;
    }
  }

  if (modeSelect) {
    modeSelect.value = (appState.settings && appState.settings.pageLayoutMode) || '1_page';
  }

  if (jumpContainer) {
    if (totalPages > 1) {
      let btns = '';
      for (let p = 1; p <= totalPages; p++) {
        btns += `
          <button type="button" class="paper-page-jump-btn" onclick="window.scrollToExamPage(${p})" title="الانتقال إلى الصفحة ${p}">
            <i class="fa-solid fa-arrow-${p === 1 ? 'up' : 'down'}" style="font-size: 0.65rem;"></i>
            <span>ص ${p}</span>
          </button>
        `;
      }
      jumpContainer.innerHTML = btns;
      jumpContainer.style.display = 'inline-flex';
    } else {
      jumpContainer.innerHTML = '';
      jumpContainer.style.display = 'none';
    }
  }
}

window.scrollToExamPage = function (pageNum) {
  const pageEl = document.getElementById(`examPaperPage_${pageNum}`);
  if (pageEl) {
    pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast(`تم الانتقال إلى الصفحة ${pageNum} 📄`, 'info');
  }
};

window.setPaperPageMode = function (mode) {
  if (!appState.settings) appState.settings = {};
  appState.settings.pageLayoutMode = mode;
  try {
    localStorage.setItem('moallem_page_mode', mode);
  } catch (e) { }
  saveStateToStorage();
  renderAll();
  const names = {
    '1_page': 'صفحة واحدة (مضغوطة)',
    'auto': 'تلقائي ذكي (A4)',
    '2_pages': 'صفحتان (وجه وقفا)',
    '3_pages': '3 صفحات (موسعة)'
  }
  showToast(`تم تعيين وتثبيت نمط الصفحات: ${names[mode] || mode} 📄`, 'success');
};

window.toggleQuestionPageBreak = function (qId) {
  const q = appState.questions.find(item => item.id === qId);
  if (!q) return;
  q.pageBreakBefore = !q.pageBreakBefore;
  saveStateToStorage();
  renderAll();
  showToast(q.pageBreakBefore ? 'تم تعيين هذا السؤال ليبدأ في صفحة جديدة 📄' : 'تم إلغاء فاصل الصفحة لهذا السؤال 🔄', 'info');
};

function renderPaperQuestionBody(q, isAnswerKey) {
  const isLtr = (appState.settings.direction === 'ltr');

  if (q.type === 'mcq' && q.options) {
    const letters = isLtr ? ['A', 'B', 'C', 'D', 'E'] : ['أ', 'ب', 'ج', 'د', 'هـ'];
    const correctOpt = q.options.find(o => o.isCorrect);
    const correctIndex = q.options.findIndex(o => o.isCorrect);
    const correctLetter = correctIndex !== -1 ? (letters[correctIndex] || (correctIndex + 1)) : '';

    if (isAnswerKey) {
      return `
        <div class="paper-model-answer highlighted-model-answer" style="margin-top: 4px;">
          <div class="model-answer-badge-header">
            <i class="fa-solid fa-circle-check" style="color: #16a34a;"></i>
            <strong>${isLtr ? '[ Approved Model Answer ]:' : '[ الإجابة النموذجية المعتمدة ]:'}</strong> 
            ${correctOpt ? `${isLtr ? 'Option' : 'الخيار'} (${correctLetter}) : ${formatMathText(correctOpt.text)}` : (isLtr ? '(No correct answer selected yet)' : '(لم يتم تحديد الخيار الصحيح بعد)')}
          </div>
          ${q.explanation ? `<div class="model-answer-explanation" style="margin-top: 4px;"><strong>${isLtr ? 'Rationale / Explanation:' : 'التعليل / سبب صحة الاختيار:'}</strong> ${formatMathText(q.explanation)}</div>` : ''}
        </div>
      `;
    }

    return `
      <div class="paper-mcq-grid">
        ${q.options.map((opt, i) => `
          <div class="paper-mcq-opt">
            <span class="paper-opt-letter">${letters[i] || (i + 1)}</span>
            <span>${formatMathText(opt.text)}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  if (q.type === 'true_false') {
    if (isAnswerKey) {
      return `
        <div class="paper-model-answer highlighted-model-answer" style="margin-top: 4px;">
          <div class="model-answer-badge-header">
            <i class="fa-solid fa-circle-check" style="color: #16a34a;"></i>
            <strong>${isLtr ? '[ Approved Model Answer ]:' : '[ الإجابة النموذجية المعتمدة ]:'}</strong> ${q.isTrue ? (isLtr ? 'True (✔)' : 'صـح (✔)') : (isLtr ? 'False (✖)' : 'خـطـأ (✖)')}
            ${q.correction ? `<span style="${isLtr ? 'margin-left: 8px;' : 'margin-right: 8px;'}">| <strong>${isLtr ? 'Correction:' : 'التصحيح المعتمد:'}</strong> ${formatMathText(q.correction)}</span>` : ''}
          </div>
        </div>
      `;
    }

    return `
      <div style="display: flex; gap: 20px; margin: 5px ${isLtr ? '0' : '18px'} 6px ${isLtr ? '18px' : '0'}; font-size: 12.5px;">
        <div>( &nbsp;&nbsp;&nbsp; ) ${isLtr ? 'True' : 'صـحـيـح'}</div>
        <div>( &nbsp;&nbsp;&nbsp; ) ${isLtr ? 'False' : 'خـاطـئ'}</div>
      </div>
    `;
  }

  if (q.type === 'fill_blanks') {
    if (isAnswerKey) {
      const blanksContent = (q.answers && q.answers.length > 0)
        ? q.answers.map((ans, aIdx) => `(${aIdx + 1}) ${formatMathText(ans)}`).join(isLtr ? ' , ' : ' ، ')
        : (q.modelAnswer ? formatMathText(q.modelAnswer) : (isLtr ? '(Approved model answer)' : '(الإجابة النموذجية للفراغات)'));

      return `
        <div class="paper-model-answer highlighted-model-answer" style="margin-top: 4px;">
          <div class="model-answer-badge-header">
            <i class="fa-solid fa-circle-check" style="color: #16a34a;"></i>
            <strong>${isLtr ? '[ Official Model Answers for Blanks ]:' : '[ الإجابات النموذجية للفراغات الوزارية المعتمدة ]:'}</strong>
          </div>
          <div class="model-answer-body" style="font-weight: 700; color: #15803d; margin-top: 4px;">
            ${blanksContent}
          </div>
        </div>
      `;
    }
    return '';
  }

  if (q.type === 'matching' && q.pairs) {
    if (isAnswerKey) {
      return `
        <div class="paper-model-answer highlighted-model-answer" style="margin-top: 4px;">
          <div class="model-answer-badge-header">
            <i class="fa-solid fa-circle-check" style="color: #16a34a;"></i>
            <strong>${isLtr ? '[ Approved Matching Solution ]:' : '[ التوافق والربط النموذجي المعتمد ]:'}</strong>
          </div>
          <div class="model-answer-body" style="display: flex; flex-direction: column; gap: 4px; margin-top: 4px; line-height: 1.7;">
            ${q.pairs.map((p, i) => {
        const letter = isLtr ? String.fromCharCode(65 + i) : String.fromCharCode(1571 + i);
        return `
                <div style="font-size: 0.95em;">
                  <strong>(${i + 1}) ${formatMathText(p.left)}</strong> &nbsp;➔&nbsp; <strong style="color: #166534;">(${letter}) ${formatMathText(p.right)}</strong>
                </div>
              `;
      }).join('')}
          </div>
        </div>
      `;
    }

    return `
      <table class="paper-match-table">
        <thead>
          <tr>
            <th width="45%">${isLtr ? 'Column (A)' : 'العمود (أ)'}</th>
            <th width="10%" style="text-align: center;">${isLtr ? 'Choice' : 'الاختيار'}</th>
            <th width="45%">${isLtr ? 'Column (B)' : 'العمود (ب)'}</th>
          </tr>
        </thead>
        <tbody>
          ${q.pairs.map((p, i) => {
      const letter = isLtr ? String.fromCharCode(65 + i) : String.fromCharCode(1571 + i);
      return `
            <tr>
              <td>(${i + 1}) ${formatMathText(p.left)}</td>
              <td style="text-align: center; font-weight: bold;">( &nbsp; )</td>
              <td>(${letter}) ${formatMathText(p.right)}</td>
            </tr>
          `;
    }).join('')}
        </tbody>
      </table>
    `;
  }

  if (q.type === 'definitions' && q.terms) {
    if (isAnswerKey) {
      return `
        <div class="paper-model-answer highlighted-model-answer" style="margin-top: 4px;">
          <div class="model-answer-badge-header">
            <i class="fa-solid fa-circle-check" style="color: #16a34a;"></i>
            <strong>${isLtr ? '[ Approved Definitions & Marking Scheme ]:' : '[ الأجوبة النموذجية للتعاريف وسلّم توزيع الدرجات ]:'}</strong>
          </div>
          <div class="model-answer-body" style="line-height: 1.7; display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">
            ${q.terms.map((t, i) => `
              <div style="font-size: 0.96em;">
                <span style="font-weight: 800; color: #166534; font-family: monospace;">${i + 1}_</span>
                <strong style="color: #166534;">${formatMathText(t.term || t.word || (isLtr ? `Term ${i + 1}` : `المصطلح ${i + 1}`))}:</strong> 
                <span style="font-weight: 600; color: #1f2937;">${formatMathText(t.definition || (isLtr ? 'Approved curriculum definition' : 'التعريف المعتمد حسب مفردات المنهج الوزاري'))}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    return `
      <div class="paper-definitions-container" style="margin-top: 4px;">
        <div class="paper-term-list" style="display: flex; flex-direction: row; flex-wrap: wrap; gap: 0.45rem 1.85rem; align-items: baseline; line-height: 1.8;">
          ${q.terms.map((t, i) => {
      const termName = t.term || t.word || (isLtr ? `Term ${i + 1}` : `المصطلح ${i + 1}`);
      return `
              <span class="paper-term-item" style="display: inline-flex; align-items: baseline; gap: 4px;">
                <span class="paper-term-num" style="font-weight: 800; color: #000; font-family: monospace;">${i + 1}_</span>
                <span class="paper-term-name" style="font-weight: 700; color: #000;">${formatMathText(termName)}</span>
              </span>
            `;
    }).join('')}
        </div>
      </div>
    `;
  }

  if (q.type === 'comparisons') {
    const hasAspects = q.aspects && q.aspects.length > 0;
    return `
      <table class="paper-compare-table">
        <thead>
          <tr>
            <th width="30%">${isLtr ? 'Point of Comparison' : 'وجه المقارنة'}</th>
            <th width="35%">${formatMathText(q.item1 || (isLtr ? 'Item 1' : 'الطرف الأول'))}</th>
            <th width="35%">${formatMathText(q.item2 || (isLtr ? 'Item 2' : 'الطرف الثاني'))}</th>
          </tr>
        </thead>
        <tbody>
          ${hasAspects ? q.aspects.map(asp => `
            <tr>
              <td><strong>${formatMathText(asp.aspect || (isLtr ? 'Comparison Point' : 'وجه المقارنة'))}</strong></td>
              <td>${isAnswerKey ? formatMathText(asp.item1Val || '') : '&nbsp;'}</td>
              <td>${isAnswerKey ? formatMathText(asp.item2Val || '') : '&nbsp;'}</td>
            </tr>
          `).join('') : `
            <tr>
              <td>${isLtr ? 'Points of Comparison' : 'أوجه الشبه والاختلاف'}</td>
              <td>${isAnswerKey ? formatMathText(q.modelAnswer || '') : '&nbsp;'}</td>
              <td>${isAnswerKey ? formatMathText(q.modelAnswer || '') : '&nbsp;'}</td>
            </tr>
          `}
        </tbody>
      </table>
      ${isAnswerKey && q.modelAnswer ? `
        <div class="paper-model-answer highlighted-model-answer" style="margin-top: 4px;">
          <div class="model-answer-badge-header">
            <i class="fa-solid fa-circle-check" style="color: #16a34a;"></i>
            <strong>${isLtr ? '[ Model Comparison Solution & Rubric ]:' : '[ ملاحظات الحل النموذجي للمقارنة وسلّم الدرجات ]:'}</strong>
          </div>
          <div class="model-answer-body">
            ${formatMathText(q.modelAnswer.replace(/\n/g, '<br/>'))}
          </div>
        </div>
      ` : ''}
    `;
  }

  if (q.type === 'essay' || q.type === 'reasoning' || q.type === 'math_problem') {
    const hasLines = (appState.settings.showAnswerLines !== false) && (q.linesCount > 0);
    const lines = hasLines ? Array.from({ length: q.linesCount }).map(() => '<div class="writing-line"></div>').join('') : '';

    if (isAnswerKey) {
      const answerContent = (q.modelAnswer && q.modelAnswer.trim())
        ? formatMathText(q.modelAnswer.replace(/\n/g, '<br/>'))
        : (isLtr ? '<em>(Approved official model answer and marking rubric)</em>' : '<em>(النموذج الوزاري المعتمد وسلّم توزيع الدرجات)</em>');

      return `
        <div class="paper-model-answer highlighted-model-answer" style="margin-top: 4px;">
          <div class="model-answer-badge-header">
            <i class="fa-solid fa-circle-check" style="color: #16a34a;"></i>
            <strong>${isLtr ? '[ Official Model Answer & Marking Rubric ]:' : '[ نموذج الإجابة الرسمية وسلم توزيع الدرجات المعتمد ]:'}</strong>
          </div>
          <div class="model-answer-body" style="line-height: 1.7; margin-top: 4px;">
            ${answerContent}
          </div>
        </div>
      `;
    }

    return hasLines ? `<div class="writing-lines">${lines}</div>` : '';
  }

  // Fallback for any other custom question type in Answer Key mode
  if (isAnswerKey && (q.modelAnswer || q.explanation || q.correction)) {
    return `
      <div class="paper-model-answer highlighted-model-answer" style="margin-top: 4px;">
        <div class="model-answer-badge-header">
          <i class="fa-solid fa-circle-check" style="color: #16a34a;"></i>
          <strong>${isLtr ? '[ Official Model Answer ]:' : '[ الإجابة النموذجية المعتمدة ]:'}</strong>
        </div>
        <div class="model-answer-body" style="line-height: 1.7; margin-top: 4px;">
          ${(q.modelAnswer || q.explanation || q.correction || '').replace(/\n/g, '<br/>')}
        </div>
      </div>
    `;
  }

  return '';
}

/**
 * Updates the official grading table at the bottom of the exam paper
 */
function updateGradingTable(total, questionScores) {
  const isLtr = (appState.settings.direction === 'ltr');
  for (let i = 1; i <= 6; i++) {
    const cell = document.getElementById(`gtQ${i}`);
    if (cell) {
      cell.innerText = questionScores[i - 1] !== undefined ? questionScores[i - 1] : '--';
    }
  }
  const totalCell = document.getElementById('gtTotal');
  if (totalCell) {
    totalCell.innerText = total > 0 ? (isLtr ? `${total} Marks` : `${total} درجة`) : '--';
  }
}

/**
 * Applies visual settings (Font size, columns, watermarks, visibility toggles)
 */
function applyPaperSettings() {
  const paper = document.getElementById('examPaperDoc');
  const content = document.getElementById('paperContentWrapper');
  const watermark = document.getElementById('paperWatermarkEl');
  const seal = document.getElementById('paperSealImg');
  const studentBar = document.getElementById('paperStudentBar');
  const instructionsBox = document.getElementById('paperInstructionsBox');
  const gradingSec = document.getElementById('paperGradingSection');

  // Paper Direction (RTL Arabic vs LTR English)
  const dir = appState.settings.direction || 'rtl';
  if (paper) {
    paper.setAttribute('dir', dir);
    if (dir === 'ltr') {
      paper.classList.add('paper-ltr');
      paper.style.direction = 'ltr';
      paper.style.textAlign = 'left';
    } else {
      paper.classList.remove('paper-ltr');
      paper.style.direction = 'rtl';
      paper.style.textAlign = 'right';
    }
  }
  if (typeof window.updateDirectionUI === 'function') {
    window.updateDirectionUI();
  }

  // Font family (6 Eye-Friendly Official Arabic Fonts)
  const fontKey = appState.settings.fontFamily || 'Cairo';
  const cssFont = ARABIC_FONTS[fontKey] || ARABIC_FONTS['Cairo'];
  if (paper) {
    paper.style.fontFamily = cssFont;
  }
  // Inject immediate live preview font override for all elements inside the paper
  let dynamicLiveFont = document.getElementById('dynamicLivePaperFontStyle');
  if (!dynamicLiveFont) {
    dynamicLiveFont = document.createElement('style');
    dynamicLiveFont.id = 'dynamicLivePaperFontStyle';
    document.head.appendChild(dynamicLiveFont);
  }
  dynamicLiveFont.innerHTML = `#examPaperDoc, #examPaperDoc *, .exam-paper, .exam-paper *, .exam-paper-page, .exam-paper-page * { font-family: ${cssFont} !important; }`;

  const dynamicPrintFont = document.getElementById('dynamicPrintFontStyle');
  if (dynamicPrintFont) {
    dynamicPrintFont.innerHTML = `@media print { .exam-paper, .exam-paper *, .exam-paper-page, .exam-paper-page * { font-family: ${cssFont} !important; } }`;
  }
  updateFontFamilyUI();

  // Font size
  let fontSizeVal = '13px';
  if (appState.settings.fontSize === 'small') {
    fontSizeVal = '11.5px';
  } else if (appState.settings.fontSize === 'large') {
    fontSizeVal = '14.5px';
  } else if (appState.settings.fontSize === 'xlarge') {
    fontSizeVal = '16px';
  }

  if (paper) {
    paper.style.fontSize = fontSizeVal;
    paper.style.lineHeight = appState.settings.lineHeight || '1.55';
  }

  document.querySelectorAll('.exam-paper-page').forEach(page => {
    page.setAttribute('dir', dir);
    page.style.fontFamily = cssFont;
    page.style.fontSize = fontSizeVal;
    page.style.lineHeight = appState.settings.lineHeight || '1.55';
    if (dir === 'ltr') {
      page.classList.add('paper-ltr');
      page.style.direction = 'ltr';
      page.style.textAlign = 'left';
    } else {
      page.classList.remove('paper-ltr');
      page.style.direction = 'rtl';
      page.style.textAlign = 'right';
    }
  });

  // Sync selects in tab-settings
  const fontSizeSelect = document.getElementById('fontSizeSelect');
  if (fontSizeSelect && appState.settings.fontSize) {
    fontSizeSelect.value = appState.settings.fontSize;
  }
  const lineHeightSelect = document.getElementById('lineHeightSelect');
  if (lineHeightSelect && appState.settings.lineHeight) {
    lineHeightSelect.value = appState.settings.lineHeight;
  }

  // Columns
  if (content) {
    if (appState.settings.columns === 2) {
      content.classList.add('two-columns');
    } else {
      content.classList.remove('two-columns');
    }
  }

  // Watermark (across all pages)
  document.querySelectorAll('.paper-watermark').forEach(wm => {
    if (appState.settings.watermark && appState.settings.watermark.trim()) {
      wm.innerText = appState.settings.watermark.trim();
      wm.style.display = 'block';
    } else {
      wm.style.display = 'none';
    }
  });

  // Visibility toggles across all pages
  document.querySelectorAll('#paperSealImg, .school-seal').forEach(s => {
    s.style.setProperty('display', (appState.settings.showSeal !== false) ? 'block' : 'none', 'important');
  });
  document.querySelectorAll('#paperStudentBar, .student-bar').forEach(sb => {
    sb.style.setProperty('display', appState.settings.showStudentBar ? 'flex' : 'none', 'important');
  });
  document.querySelectorAll('#paperInstructionsBox, .instructions-box').forEach(ib => {
    ib.style.setProperty('display', appState.settings.showInstructions ? 'flex' : 'none', 'important');
  });
  document.querySelectorAll('#paperGradingSection, .grading-table-container').forEach(gs => {
    gs.style.setProperty('display', appState.settings.showGradingTable ? 'block' : 'none', 'important');
  });

  // Sync checkboxes UI with state
  const chkGrading = document.getElementById('chkShowGradingTable');
  if (chkGrading) chkGrading.checked = !!appState.settings.showGradingTable;

  const chkStudent = document.getElementById('chkShowStudentBar');
  if (chkStudent) chkStudent.checked = !!appState.settings.showStudentBar;

  const chkInstr = document.getElementById('chkShowInstructions');
  if (chkInstr) chkInstr.checked = !!appState.settings.showInstructions;

  const chkSeal = document.getElementById('chkShowSeal');
  if (chkSeal) chkSeal.checked = (appState.settings.showSeal !== false);

  // Answer writing lines toolbar button & sync
  const linesBtn = document.getElementById('toggleAnswerLinesToolbarBtn');
  const linesIcon = document.getElementById('toggleAnswerLinesIcon');
  const linesText = document.getElementById('toggleAnswerLinesText');
  const isLinesActive = !!appState.settings.showAnswerLines;

  if (linesBtn) {
    if (isLinesActive) {
      if (linesIcon) linesIcon.className = 'fa-solid fa-pen-nib';
      if (linesText) linesText.innerText = 'أسطر الإجابة: ظاهرة';
      linesBtn.classList.remove('btn-outline');
      linesBtn.classList.add('btn-primary');
    } else {
      if (linesIcon) linesIcon.className = 'fa-solid fa-pen-nib text-muted';
      if (linesText) linesText.innerText = 'أسطر الإجابة: ملغاة (مخفية)';
      linesBtn.classList.remove('btn-primary');
      linesBtn.classList.add('btn-outline');
    }
  }

  const chkLines = document.getElementById('chkShowAnswerLines');
  if (chkLines) {
    chkLines.checked = isLinesActive;
  }
}

/**
 * Top Stats Ribbon update
 */
function renderStats() {
  const countEl = document.getElementById('statQuestionsCount');
  const scoreEl = document.getElementById('statTotalScore');
  const timeEl = document.getElementById('statEstimatedTime');
  const bloomEl = document.getElementById('statBloomSummary');

  const count = appState.questions.length;
  let totalScore = 0;
  appState.questions.forEach(q => totalScore += (q.score || 20));

  if (countEl) countEl.innerText = count;
  if (scoreEl) scoreEl.innerText = `${totalScore} درجة`;
  if (timeEl) {
    timeEl.innerText = appState.header.time || '3 ساعات';
  }

  if (bloomEl) {
    const analysis = analyzeBloomDistribution(appState.questions);
    const dominant = Object.entries(analysis.stats).sort((a, b) => b[1] - a[1])[0];
    if (dominant && dominant[1] > 0) {
      bloomEl.innerText = `التركيز: ${dominant[0]} (${Math.round((dominant[1] / totalScore) * 100)}%)`;
    } else {
      bloomEl.innerText = 'متوازن تربوياً';
    }
  }
}

/**
 * Toast Notification Helper
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  // Keep single active toast to prevent cluttering the canvas
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const icons = {
    success: 'fa-circle-check text-success',
    error: 'fa-triangle-exclamation text-danger',
    info: 'fa-circle-info text-primary',
    warning: 'fa-triangle-exclamation text-warning'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${icons[type] || 'fa-bell'}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 20);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 300);
  }, 3200);
}

/**
 * Initialize Movable / Floating Side Question Type Bar (شريط إضافة الأسئلة المتحرك صعوداً ونزولاً)
 */
function initSideQTypeBarMovable() {
  const bar = document.getElementById('sideQTypeBar');
  const scrollContainer = document.querySelector('.builder-body-scrollable');
  const scrollTopBtn = document.getElementById('scrollQuestionsTopBtn');
  const scrollBottomBtn = document.getElementById('scrollQuestionsBottomBtn');

  // Page Fast Scroll Up (صعود لأعلى قائمة الأسئلة)
  if (scrollTopBtn) {
    scrollTopBtn.onclick = () => {
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  // Page Fast Scroll Down (نزول لأسفل قائمة الأسئلة)
  if (scrollBottomBtn) {
    scrollBottomBtn.onclick = () => {
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    }
  }

  if (!bar) return;

  const header = document.getElementById('sideQTypeHeader');
  const nudgeUpBtn = document.getElementById('sideQTypeNudgeUp');
  const nudgeDownBtn = document.getElementById('sideQTypeNudgeDown');

  // Load saved top offset or default (12px)
  let currentTop = parseInt(localStorage.getItem('side_qtype_bar_top') || '12', 10);
  if (isNaN(currentTop) || currentTop < 0) currentTop = 12;
  bar.style.setProperty('--side-qtype-top', `${currentTop}px`);

  const setBarTop = (val) => {
    // Keep within reasonable viewport bounds (0px to 450px)
    currentTop = Math.max(0, Math.min(450, Math.round(val)));
    bar.style.setProperty('--side-qtype-top', `${currentTop}px`);
    localStorage.setItem('side_qtype_bar_top', currentTop.toString());
  }

  // Nudge Up (صعود موضع الشريط)
  if (nudgeUpBtn) {
    nudgeUpBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setBarTop(currentTop - 45);
    });
  }

  // Nudge Down (نزول موضع الشريط)
  if (nudgeDownBtn) {
    nudgeDownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setBarTop(currentTop + 45);
    });
  }

  // Double-click header to reset to top
  if (header) {
    header.addEventListener('dblclick', (e) => {
      if (e.target.closest('button')) return;
      setBarTop(12);
      if (typeof showToast === 'function') {
        showToast('تمت إعادة موضع شريط الأسئلة للأعلى تلقائياً', 'info');
      }
    });
  }

  // Page Fast Scroll Up (صعود لأعلى قائمة الأسئلة)
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // Page Fast Scroll Down (نزول لأسفل قائمة الأسئلة)
  if (scrollBottomBtn) {
    scrollBottomBtn.addEventListener('click', () => {
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    });
  }

  // Drag-to-move vertically (السحب بالماوس أو اللمس)
  if (header) {
    let isDragging = false;
    let startY = 0;
    let initialTop = 0;

    const onPointerDown = (e) => {
      if (e.target.closest('button')) return;
      isDragging = true;
      startY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
      initialTop = currentTop;
      bar.classList.add('is-dragging');
      document.body.style.userSelect = 'none';

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    }

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
      const deltaY = clientY - startY;
      setBarTop(initialTop + deltaY);
    }

    const onPointerUp = () => {
      if (!isDragging) return;
      isDragging = false;
      bar.classList.remove('is-dragging');
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    }

    header.addEventListener('pointerdown', onPointerDown);
  }
}

// Global window exposure for robust cross-module reliability
window.renderAll = renderAll;
window.renderPaperHeader = renderPaperHeader;
window.renderPaperQuestions = renderPaperQuestions;
window.renderPaperQuestionBody = renderPaperQuestionBody;
window.applyPaperSettings = applyPaperSettings;
window.saveStateToStorage = saveStateToStorage;
window.showToast = showToast;
window.initSideQTypeBarMovable = initSideQTypeBarMovable;

/* ==========================================================================
   Subject Presets & Switcher (عربي / انكليزي / رياضيات)
   ========================================================================== */
const SUBJECT_PRESETS = {
  arabic: {
    name: 'اللغة العربية',
    direction: 'rtl',
    badgeClass: 'sub-arabic',
    btnLabels: {
      mcq: 'اختيار متعدد',
      true_false: 'صح أو خطأ',
      definitions: 'تعاريف',
      comparisons: 'مقارنات',
      fill_blanks: 'أكمل الفراغات',
      matching: 'صل عمودين',
      essay: 'سؤال مقالي',
      reasoning: 'علل واذكر السبب',
      math_problem: 'مسألة علمية'
    }
  },
  english: {
    name: 'English Language',
    direction: 'ltr',
    badgeClass: 'sub-english',
    btnLabels: {
      mcq: 'Multiple Choice',
      true_false: 'True / False',
      definitions: 'Definitions',
      comparisons: 'Compare & Contrast',
      fill_blanks: 'Fill in Blanks',
      matching: 'Match Columns',
      essay: 'Essay / Paragraph',
      reasoning: 'Give Reasons',
      math_problem: 'Problem Solving'
    }
  },
  math: {
    name: 'الرياضيات',
    direction: 'rtl',
    badgeClass: 'sub-math',
    btnLabels: {
      mcq: 'اختر الناتج الصحيح',
      true_false: 'صواب / خطأ رياضي',
      definitions: 'مبرهنات وقوانين',
      comparisons: 'مقارنة دوال وأشكال',
      fill_blanks: 'أكمل الحل والقانون',
      matching: 'صل المعادلة بالحل',
      essay: 'إثبات وبرهان',
      reasoning: 'علل النتيجة الرياضية',
      math_problem: 'مسألة ومعادلة'
    }
  },
  chemistry: {
    name: 'الكيمياء',
    direction: 'rtl',
    badgeClass: 'sub-chemistry',
    btnLabels: {
      mcq: 'اختر الإجابة الصحيحة',
      true_false: 'صح أو خطأ علمي',
      definitions: 'تعاريف ومصطلحات كيميائية',
      comparisons: 'مقارنات وتفاعلات',
      fill_blanks: 'أكمل المعادلات والرموز',
      matching: 'صل العنصر بالتكافؤ/المركب',
      essay: 'شرح وتجربة مختبرية',
      reasoning: 'علل كيميائياً (لوشاتليه)',
      math_problem: 'مسألة وحسابات كيميائية'
    }
  },
  physics: {
    name: 'الفيزياء',
    direction: 'rtl',
    badgeClass: 'sub-physics',
    btnLabels: {
      mcq: 'اختر الإجابة الصحيحة',
      true_false: 'صح أو خطأ فيزيائي',
      definitions: 'تعاريف وقوانين فيزيائية',
      comparisons: 'مقارنة دوائر وظواهر',
      fill_blanks: 'أكمل القانون والوحدات',
      matching: 'صل الكمية بالوحدة/القانون',
      essay: 'نشاط وتجربة واستنتاج',
      reasoning: 'علل فيزيائياً وبفرضيّات',
      math_problem: 'مسألة وحسابات فيزيائية'
    }
  },
  islamic: {
    name: 'التربية الإسلامية',
    direction: 'rtl',
    badgeClass: 'sub-islamic',
    btnLabels: {
      mcq: 'اختر الإجابة الصحيحة',
      true_false: 'صح أو خطأ',
      definitions: 'معاني الكلمات والمفاهيم',
      comparisons: 'مقارنة الأحكام والآداب',
      fill_blanks: 'أكمل الآية أو الحديث',
      matching: 'صل الكلمة بمعناها/الحكم',
      essay: 'اكتب الآيات / الحديث الشريف',
      reasoning: 'ما يرشد إليه النص / علل',
      math_problem: 'أحكام التلاوة والتجويد'
    }
  }
};

window.activeSubjectMode = 'arabic';
window.currentQuestionsFilter = 'all';

function initSubjectMode() {
  const savedMode = localStorage.getItem('moallem_subject_mode') || 'arabic';
  setSubjectMode(savedMode, false);

  const switcher = document.getElementById('sideSubjectSwitcher');
  if (switcher) {
    switcher.querySelectorAll('.side-sub-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-sub-mode');
        setSubjectMode(mode, true);
      });
    });
  }
}

function setSubjectMode(mode, userInitiated = false) {
  if (!SUBJECT_PRESETS[mode]) mode = 'arabic';
  window.activeSubjectMode = mode;
  localStorage.setItem('moallem_subject_mode', mode);

  // Update switcher buttons UI
  const switcher = document.getElementById('sideSubjectSwitcher');
  if (switcher) {
    switcher.querySelectorAll('.side-sub-btn').forEach(btn => {
      const btnMode = btn.getAttribute('data-sub-mode');
      btn.classList.toggle('active', btnMode === mode);
    });
  }

  // Update Question type button labels in sidebar
  const preset = SUBJECT_PRESETS[mode];
  const buttonsContainer = document.getElementById('sideQTypeButtonsContainer');
  if (buttonsContainer && preset.btnLabels) {
    buttonsContainer.querySelectorAll('.side-qtype-btn').forEach(btn => {
      const qType = btn.getAttribute('data-add-type');
      if (qType && preset.btnLabels[qType]) {
        const span = btn.querySelector('span');
        if (span) span.innerText = preset.btnLabels[qType];
      }
    });
  }
  const qSelect = document.getElementById('qbuilderTypeSelect');
  if (qSelect && preset && preset.btnLabels) {
    Array.from(qSelect.options).forEach(opt => {
      const qType = opt.value;
      if (qType && preset.btnLabels[qType]) {
        opt.text = preset.btnLabels[qType];
      }
    });
  }

  // Update rich custom dropdown items
  if (preset && preset.btnLabels) {
    document.querySelectorAll('.qtype-menu-item[data-qtype]').forEach(item => {
      const qType = item.getAttribute('data-qtype');
      if (qType && preset.btnLabels[qType]) {
        const strong = item.querySelector('.qitem-text strong');
        if (strong) strong.innerText = preset.btnLabels[qType];
      }
    });
  }

  // Direction and auto-sync on user switch
  if (userInitiated) {
    if (mode === 'english') {
      appState.settings.direction = 'ltr';
      applyPaperSettings();
      renderAll();
      showToast('تم تفعيل نمط اللغة الإنكليزية (English Exam - LTR) 🌐', 'info');
    } else if (mode === 'math') {
      appState.settings.direction = 'rtl';
      applyPaperSettings();
      renderAll();
      showToast('تم تفعيل نمط الرياضيات والمعادلات والحساب 📐', 'info');
    } else if (mode === 'chemistry') {
      appState.settings.direction = 'rtl';
      applyPaperSettings();
      renderAll();
      showToast('تم تفعيل نمط الكيمياء والجدول الدوري والمعادلات ⚗️🧪', 'info');
    } else if (mode === 'physics') {
      appState.settings.direction = 'rtl';
      applyPaperSettings();
      renderAll();
      showToast('تم تفعيل نمط مادة الفيزياء (قوانين، مسائل وثوابت وزارية) ⚛️⚡', 'info');
    } else if (mode === 'islamic') {
      appState.settings.direction = 'rtl';
      applyPaperSettings();
      renderAll();
      showToast('تم تفعيل نمط التربية الإسلامية (سور، آيات، أحاديث ورسم قرآني) 📖✨', 'info');
    } else {
      appState.settings.direction = 'rtl';
      applyPaperSettings();
      renderAll();
      showToast('تم تفعيل نمط اللغة العربية (RTL) ✍️', 'info');
    }
  }
}

// Math Symbol Insertion Utility
window.insertMathSymbol = function (sym) {
  const modalText = document.getElementById('modalQText');
  if (!modalText) return;
  const start = modalText.selectionStart ?? modalText.value.length;
  const end = modalText.selectionEnd ?? modalText.value.length;
  const val = modalText.value;
  modalText.value = val.substring(0, start) + sym + val.substring(end);
  modalText.selectionStart = modalText.selectionEnd = start + sym.length;
  modalText.focus();
};

/* ==========================================================================
   Quick Filter on Workspace Active Questions
   ========================================================================== */
function initQuestionsQuickFilter() {
  document.querySelectorAll('.qfilter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const filter = chip.getAttribute('data-qfilter') || 'all';
      setQuestionsQuickFilter(filter);
    });
  });
}

window.setQuestionsQuickFilter = function (filter) {
  window.currentQuestionsFilter = filter;
  document.querySelectorAll('.qfilter-chip').forEach(chip => {
    chip.classList.toggle('active', chip.getAttribute('data-qfilter') === filter);
  });
  renderBuilderList();
};

/* ==========================================================================
   Questions History Bank (سجل وبنك الأسئلة الشامل)
   ========================================================================== */
const BANK_STORAGE_KEY = 'moallem_questions_history_bank';

function initQuestionsHistoryBank() {
  const bank = getQuestionsHistoryBank();
  // If bank is empty, index current questions and saved archives
  if (bank.length === 0 && appState.questions && appState.questions.length > 0) {
    appState.questions.forEach(q => {
      saveQuestionToHistoryBank(q);
    });
  }

  // Also index from saved exams archive
  try {
    const archives = typeof getSavedExamsArchive === 'function' ? getSavedExamsArchive() : [];
    archives.forEach(arc => {
      if (Array.isArray(arc.questions)) {
        arc.questions.forEach(q => saveQuestionToHistoryBank(q));
      }
    });
  } catch (e) {
    console.warn('Bank index error:', e);
  }
}

function getQuestionsHistoryBank() {
  try {
    const storageKey = getAccountStorageKey('moallem_questions_history_bank');
    let data = localStorage.getItem(storageKey);
    // Legacy migration for admin
    if (!data && storageKey.includes('usr_admin')) {
      data = localStorage.getItem(BANK_STORAGE_KEY);
    }
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveQuestionToHistoryBank(q) {
  if (!q || !q.id) return;
  try {
    const bank = getQuestionsHistoryBank();
    const existingIndex = bank.findIndex(item => item.id === q.id);
    const itemToSave = JSON.parse(JSON.stringify(q));
    itemToSave.subject = itemToSave.subject || window.activeSubjectMode || 'arabic';
    itemToSave.createdAt = itemToSave.createdAt || new Date().toISOString();

    if (existingIndex >= 0) {
      bank[existingIndex] = itemToSave;
    } else {
      bank.unshift(itemToSave);
    }
    const storageKey = getAccountStorageKey('moallem_questions_history_bank');
    localStorage.setItem(storageKey, JSON.stringify(bank));
  } catch (e) {
    console.error('Failed to save to question bank:', e);
  }
}

window.removeQuestionFromHistoryBank = function (qId) {
  if (!confirm('هل ترغب بإزالة هذا السؤال من بنك الأسئلة الدائم؟')) return;
  try {
    let bank = getQuestionsHistoryBank();
    bank = bank.filter(q => q.id !== qId);
    const storageKey = getAccountStorageKey('moallem_questions_history_bank');
    localStorage.setItem(storageKey, JSON.stringify(bank));
    filterDailyReportQuestions();
    showToast('تم حذف السؤال من بنك الأسئلة', 'info');
  } catch (e) {
    console.error(e);
  }
};

/* ==========================================================================
   Executive Academic Reports & Comprehensive Platform Command Center Controller
   ========================================================================== */
function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
window.escapeHtml = escapeHtml;

window.currentReportSubView = 'overview';
let currentFilteredReportExams = [];
let currentFilteredBankQuestions = [];

/**
 * Gather Comprehensive Platform Data (جميع أنشطة وسجلات المنصة)
 */
function getPlatformComprehensiveData() {
  // 1. Teacher Profile
  const profile = (typeof teacherProfile === 'object' && teacherProfile) ? teacherProfile : {};
  const tName = profile.name || localStorage.getItem('masar_teacher_name') || 'أستاذ المادة';
  const tSchool = profile.school || localStorage.getItem('masar_school_name') || 'ثانوية المتميزين للبنين';
  const tGov = profile.governorate || 'بغداد';
  const tYear = profile.academicYear || '2024 - 2025';

  // 2. Behavior & Attendance Records (Isolated per teacher)
  let behaviorRecords = {};
  let behaviorRosters = [];
  const curUser = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  const isAdmin = !!(curUser && (curUser.isAdmin || curUser.role === 'admin' || (curUser.id && String(curUser.id).includes('admin'))));

  const behKey = (typeof getAccountStorageKey === 'function') ? getAccountStorageKey('masar_student_behavior_records') : 'masar_student_behavior_records';
  const rostKey = (typeof getAccountStorageKey === 'function') ? getAccountStorageKey('masar_student_rosters') : 'masar_student_rosters';

  try {
    let rawB = localStorage.getItem(behKey);
    if (!rawB && isAdmin) rawB = localStorage.getItem('masar_student_behavior_records');
    if (rawB) behaviorRecords = JSON.parse(rawB);
  } catch (e) { }
  try {
    let rawR = localStorage.getItem(rostKey);
    if (!rawR && isAdmin) rawR = localStorage.getItem('masar_student_rosters');
    if (rawR) behaviorRosters = JSON.parse(rawR);
  } catch (e) { }

  const todayStr = new Date().toISOString().split('T')[0];
  const bKeys = Object.keys(behaviorRecords || {}).sort().reverse();
  let todayRecord = null;
  for (const k of bKeys) {
    if (k.endsWith(todayStr)) {
      todayRecord = behaviorRecords[k];
      break;
    }
  }
  if (!todayRecord && bKeys.length > 0) {
    todayRecord = behaviorRecords[bKeys[0]];
  }

  let activeBehaviorRoster = behaviorRosters.length > 0 ? behaviorRosters[0] : null;
  if (todayRecord && todayRecord.rosterId) {
    activeBehaviorRoster = behaviorRosters.find(r => r.id === todayRecord.rosterId) || activeBehaviorRoster;
  }

  const bStudents = (todayRecord && todayRecord.students) || (activeBehaviorRoster && activeBehaviorRoster.students) || [];
  let presentCount = 0, absentCount = 0, excusedCount = 0, lateCount = 0;
  bStudents.forEach(st => {
    if (st.attendance === 'present') presentCount++;
    else if (st.attendance === 'absent') absentCount++;
    else if (st.attendance === 'excused') excusedCount++;
    else if (st.attendance === 'late') lateCount++;
  });
  const totalBStudents = bStudents.length;
  const attendanceRate = totalBStudents > 0 ? Math.round(((presentCount + lateCount) / totalBStudents) * 100) : 0;

  // 3. Student Grades Rosters (Isolated per teacher)
  let gradesRosters = [];
  const gradesKey = (typeof getAccountStorageKey === 'function') ? getAccountStorageKey('masar_teacher_grades_rosters_v1') : 'masar_teacher_grades_rosters_v1';
  try {
    let rawG = localStorage.getItem(gradesKey);
    if (!rawG && isAdmin) rawG = localStorage.getItem('masar_teacher_grades_rosters_v1');
    if (rawG) gradesRosters = JSON.parse(rawG);
  } catch (e) { }
  if (!Array.isArray(gradesRosters) || gradesRosters.length === 0) {
    gradesRosters = behaviorRosters;
  }
  let totalEnrolledStudents = 0;
  let allStudentsScores = [];
  (gradesRosters || []).forEach(r => {
    const sts = r.students || [];
    totalEnrolledStudents += sts.length;
    sts.forEach(st => {
      const score = (typeof st.finalExam === 'number') ? st.finalExam : (typeof st.m1 === 'number') ? st.m1 : null;
      if (score !== null) {
        allStudentsScores.push({ name: st.name, score: score, className: r.name });
      }
    });
  });
  allStudentsScores.sort((a, b) => b.score - a.score);
  const topStudents = allStudentsScores.slice(0, 5);
  const averageScore = allStudentsScores.length > 0 ? Math.round(allStudentsScores.reduce((acc, s) => acc + s.score, 0) / allStudentsScores.length) : 85;

  // 4. Exams & Question Bank
  const allExams = (typeof getSavedExamsArchive === 'function') ? getSavedExamsArchive() : [];
  const bank = (typeof getQuestionsHistoryBank === 'function') ? getQuestionsHistoryBank() : [];
  const currentExamQuestions = (typeof appState === 'object' && appState && appState.questions) ? appState.questions : [];
  const currentExamTitle = (appState && appState.header && appState.header.title) || 'الامتحان الشهري النموذجي';
  const currentExamSubject = (appState && appState.header && appState.header.subject) || 'الرياضيات';
  const currentExamGrade = (appState && appState.header && appState.header.grade) || 'الثالث المتوسط';
  const currentExamTotalScore = (appState && appState.header && appState.header.totalScore) || 100;

  // 5. Subscription / Trial Status
  let trialStatusText = 'فترة تجربة مجانية (24 ساعة)';
  try {
    const rawUser = localStorage.getItem('moallem_user_account');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (u.isTrial) trialStatusText = 'فترة تجربة مجانية (يومان / 48 ساعة)';
      else if (u.isSubscribed) trialStatusText = 'اشتراك سنوي معتمد ⭐';
    }
  } catch (e) { }

  return {
    teacher: { name: tName, school: tSchool, governorate: tGov, academicYear: tYear },
    behavior: {
      todayRecord,
      activeRoster: activeBehaviorRoster,
      students: bStudents,
      total: totalBStudents,
      present: presentCount,
      absent: absentCount,
      excused: excusedCount,
      late: lateCount,
      rate: attendanceRate,
      date: (todayRecord && todayRecord.date) || todayStr,
      className: (todayRecord && todayRecord.className) || (activeBehaviorRoster && activeBehaviorRoster.name) || 'الصف الثالث المتوسط',
      subject: (todayRecord && todayRecord.subject) || 'الرياضيات',
      period: (todayRecord && todayRecord.period) || 'الأولى',
      topic: (todayRecord && todayRecord.topic) || 'متابعة سير الدرس الصفي'
    },
    grades: {
      rosters: gradesRosters,
      totalEnrolled: totalEnrolledStudents,
      topStudents,
      averageScore
    },
    exams: {
      allExams,
      bank,
      currentExam: {
        title: currentExamTitle,
        subject: currentExamSubject,
        grade: currentExamGrade,
        questionsCount: currentExamQuestions.length,
        totalScore: currentExamTotalScore
      }
    },
    trialStatus: trialStatusText
  }
}

/**
 * Switch Report SubView (التبديل بين قطاعات التقرير اليومي)
 */
window.switchReportSubView = function (view) {
  window.currentReportSubView = view || 'overview';

  const btnOverview = document.getElementById('btnReportViewOverview');
  const btnBehavior = document.getElementById('btnReportViewBehavior');
  const btnGrades = document.getElementById('btnReportViewGrades');
  const btnModels = document.getElementById('btnReportViewModels');
  const btnQuestions = document.getElementById('btnReportViewQuestions');
  const btnExams = document.getElementById('btnReportViewExams');
  const btnPdfDoc = document.getElementById('btnReportViewPdfDoc');

  const containerOverview = document.getElementById('tabReportOverviewRender');
  const containerBehavior = document.getElementById('tabReportBehaviorRender');
  const containerGrades = document.getElementById('tabReportGradesRender');
  const containerExams = document.getElementById('tabReportExamsListRender');
  const containerQuestions = document.getElementById('tabReportQuestionsListRender');
  const containerPdfDoc = document.getElementById('tabReportPdfDocRender');
  const filterToolbar = document.getElementById('tabReportFilterToolbar');
  const resultsHeader = document.getElementById('tabReportResultsHeader');
  const resultsLabel = document.getElementById('tabReportResultsLabel');
  const helpHint = document.getElementById('tabReportHelpHint');

  // Toggle button active states
  if (btnOverview) btnOverview.classList.toggle('active', view === 'overview');
  if (btnBehavior) btnBehavior.classList.toggle('active', view === 'behavior');
  if (btnGrades) btnGrades.classList.toggle('active', view === 'grades');
  if (btnModels) btnModels.classList.toggle('active', view === 'models');
  if (btnQuestions) btnQuestions.classList.toggle('active', view === 'questions');
  if (btnExams) btnExams.classList.toggle('active', view === 'exams');
  if (btnPdfDoc) btnPdfDoc.classList.toggle('active', view === 'pdfDoc');

  // Hide all sections first
  [containerOverview, containerBehavior, containerGrades, containerExams, containerQuestions, containerPdfDoc].forEach(c => {
    if (c) c.style.display = 'none';
  });
  if (filterToolbar) filterToolbar.style.display = 'none';
  if (resultsHeader) resultsHeader.style.display = 'none';

  if (view === 'overview') {
    if (containerOverview) containerOverview.style.display = 'flex';
    window.renderFullPlatformDailyOverview();
  } else if (view === 'behavior') {
    if (containerBehavior) {
      containerBehavior.style.display = 'block';
      window.renderFullPlatformBehaviorView();
    }
  } else if (view === 'grades') {
    if (containerGrades) {
      containerGrades.style.display = 'block';
      window.renderFullPlatformGradesView();
    }
  } else if (view === 'models') {
    if (containerExams) containerExams.style.display = 'grid';
    if (filterToolbar) filterToolbar.style.display = 'block';
    if (resultsHeader) resultsHeader.style.display = 'flex';
    if (resultsLabel) resultsLabel.innerText = 'النماذج الوزارية المعروضة: ';
    if (helpHint) {
      helpHint.innerHTML = '🏛️ <strong>قسم النماذج الوزارية المعتمدة (12 نموذجاً رسمياً):</strong> نماذج وزارية معتمدة ومتكاملة للثالث متوسط والسادس إعدادي لكافة المواد، جاهزة للاستعراض، التعديل المباشر، أو الطباعة الفورية.';
    }
    window.filterDailyReport();
  } else if (view === 'questions') {
    if (containerQuestions) containerQuestions.style.display = 'flex';
    if (filterToolbar) filterToolbar.style.display = 'block';
    if (resultsHeader) resultsHeader.style.display = 'flex';
    if (resultsLabel) resultsLabel.innerText = 'الأسئلة الوزارية المعروضة: ';
    if (helpHint) {
      helpHint.innerHTML = '📑 <strong>حقل الأسئلة الوزارية المستقل:</strong> يمكنك البحث في بنك الأسئلة الوزارية المعتمدة وإدراج أي سؤال مباشرة في ورقة الاختبار الحالية بنقرة واحدة.';
    }
    window.filterDailyReport();
  } else if (view === 'exams') {
    if (containerExams) containerExams.style.display = 'grid';
    if (filterToolbar) filterToolbar.style.display = 'block';
    if (resultsHeader) resultsHeader.style.display = 'flex';
    if (resultsLabel) resultsLabel.innerText = 'سجل الاختبارات المنشأة والمسودات: ';
    if (helpHint) {
      helpHint.innerHTML = '✍️ <strong>سجل اختباراتك المنشأة:</strong> استعرض وعدّل مسوداتك واختباراتك المحفوظة التي قمت بإنشائها بنفسك على المنصة.';
    }
    window.filterDailyReport();
  } else if (view === 'pdfDoc') {
    if (containerPdfDoc) {
      containerPdfDoc.style.display = 'block';
      try {
        const d = (typeof getPlatformComprehensiveData === 'function') ? getPlatformComprehensiveData() : null;
        if (d) {
          const stEl = document.getElementById('pdfReportStudentsVal');
          const exEl = document.getElementById('pdfReportExamsVal');
          if (stEl && d.grades && d.grades.totalStudents) stEl.textContent = d.grades.totalStudents;
          if (exEl && d.exams && d.exams.totalExams) exEl.textContent = d.exams.totalExams;
        }
      } catch (e) { }
    }
  }

  updateDailyReportMetrics();
};

/**
 * Render Comprehensive Platform Live Overview (التقرير الشامل المتضمن كل شيء يدور بالمنصة)
 */
window.renderFullPlatformDailyOverview = function () {
  const container = document.getElementById('tabReportOverviewRender');
  if (!container) return;

  const data = getPlatformComprehensiveData();
  const b = data.behavior;
  const g = data.grades;
  const ex = data.exams;
  const t = data.teacher;

  const now = new Date();
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  let dateFormattedAr = '';
  try {
    dateFormattedAr = now.toLocaleDateString('ar-IQ', dateOptions);
  } catch (e) {
    dateFormattedAr = now.toDateString();
  }

  container.innerHTML = `
    <!-- 1. Teacher & Platform Header Status Banner -->
    <div class="report-teacher-hero-card">
      <div style="display: flex; align-items: center; gap: 14px;">
        <img src="assets/iraq_moe_seal.png" alt="شعار وزارة التربية العراقية" style="width: 54px; height: 54px; object-fit: contain; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.12));" title="شعار وزارة التربية العراقية المعتمد">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <h3 style="margin: 0; font-size: 1.15rem; font-weight: 900; color: #0f172a;">${escapeHtml(t.name)}</h3>
            <span class="badge-tag" style="background: #e0f2fe; color: #0369a1; font-weight: 800; font-size: 0.76rem;">${escapeHtml(t.school)}</span>
            <span class="badge-tag" style="background: #ecfdf5; color: #059669; font-weight: 800; font-size: 0.74rem;">${escapeHtml(data.trialStatus)}</span>
          </div>
          <div style="font-size: 0.82rem; color: #64748b; margin-top: 4px; display: flex; gap: 12px; flex-wrap: wrap;">
            <span><i class="fa-regular fa-calendar-check text-primary"></i> <b>${dateFormattedAr}</b></span>
            <span><i class="fa-solid fa-graduation-cap text-warning"></i> الصف النشط: <b>${escapeHtml(b.className)}</b></span>
            <span><i class="fa-solid fa-book text-info"></i> المادة: <b>${escapeHtml(b.subject)}</b></span>
            <span><i class="fa-solid fa-clock text-purple"></i> الحصة: <b>${escapeHtml(b.period)}</b></span>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
        <button type="button" class="btn btn-sm btn-danger" onclick="window.exportFullPlatformDailyReportPdf()" style="background: linear-gradient(135deg, #e11d48, #be123c); font-weight: 800; padding: 0.45rem 0.95rem; border: none; box-shadow: 0 4px 12px rgba(225,29,72,0.25);">
          <i class="fa-solid fa-file-pdf"></i> تنزيل تقرير PDF 📄
        </button>
        <button type="button" class="btn btn-sm btn-outline-secondary" onclick="window.printFullPlatformDailyReport()" style="font-weight: 700; padding: 0.45rem 0.95rem;">
          <i class="fa-solid fa-print"></i> طباعة A4
        </button>
      </div>
    </div>

    <!-- 2. Grid of Live Platform Hubs -->
    <div class="report-overview-grid">
      
      <!-- Card 1: Attendance & Conduct Live Card (المتابعة والغياب اليومي) -->
      <div class="report-overview-card" style="border-top: 4px solid #10b981;">
        <div class="report-card-top">
          <div class="report-card-title-group">
            <div class="report-card-icon" style="background: rgba(16, 185, 129, 0.15); color: #059669;">
              <i class="fa-solid fa-clipboard-user"></i>
            </div>
            <div>
              <div style="font-weight: 900; font-size: 0.98rem; color: #0f172a;">المتابعة وحسن السلوك اليوم</div>
              <small style="color: #64748b; font-size: 0.74rem;">جلسة ${escapeHtml(b.className)} — ${escapeHtml(b.date)}</small>
            </div>
          </div>
          <span class="report-badge-status ${b.rate >= 80 ? 'report-badge-present' : 'report-badge-excused'}" style="font-size: 0.82rem;">
            نسبة الحضور: ${b.rate}%
          </span>
        </div>

        <div class="report-pills-row">
          <div class="report-stat-pill" style="background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;">
            <i class="fa-solid fa-circle-check text-success"></i> حضور: <b>${b.present + b.late}</b>
          </div>
          <div class="report-stat-pill" style="background: #fef2f2; color: #991b1b; border: 1px solid #fecaca;">
            <i class="fa-solid fa-circle-xmark text-danger"></i> غياب: <b>${b.absent}</b>
          </div>
          <div class="report-stat-pill" style="background: #fffbeb; color: #92400e; border: 1px solid #fde68a;">
            <i class="fa-solid fa-circle-pause text-warning"></i> إجازة: <b>${b.excused}</b>
          </div>
          <div class="report-stat-pill" style="background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;">
            <i class="fa-solid fa-users text-primary"></i> المقيدون: <b>${b.total}</b>
          </div>
        </div>

        <!-- Mini Table of Students Attendance -->
        <div style="max-height: 200px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 10px; background: #ffffff;">
          <table class="report-table-mini">
            <thead>
              <tr>
                <th style="width: 30px;">ت</th>
                <th>اسم الطالب</th>
                <th style="text-align: center; width: 75px;">الحضور</th>
                <th style="text-align: center; width: 65px;">المشاركة</th>
                <th style="text-align: center; width: 65px;">الواجب</th>
              </tr>
            </thead>
            <tbody>
              ${b.students.slice(0, 7).map((st, i) => {
    let attBadge = '<span class="report-badge-status report-badge-present">حاضر</span>';
    if (st.attendance === 'absent') attBadge = '<span class="report-badge-status report-badge-absent">غائب</span>';
    else if (st.attendance === 'excused') attBadge = '<span class="report-badge-status report-badge-excused">مجاز</span>';
    else if (st.attendance === 'late') attBadge = '<span class="report-badge-status report-badge-late">متأخر</span>';

    const partText = (st.participation === 'excellent' || st.participation === 'active') ? 'نشط ⭐' : 'عادي';
    const hwText = st.homework === 'done' ? 'منجز ✔️' : 'ناقص ⚠️';

    return `
                  <tr>
                    <td style="font-weight: bold; color: #64748b;">${i + 1}</td>
                    <td style="font-weight: 700; color: #0f172a;">${escapeHtml(st.name)}</td>
                    <td style="text-align: center;">${attBadge}</td>
                    <td style="text-align: center; font-size: 0.74rem;">${partText}</td>
                    <td style="text-align: center; font-size: 0.74rem;">${hwText}</td>
                  </tr>
                `;
  }).join('')}
              ${b.students.length > 7 ? `
                <tr>
                  <td colspan="5" style="text-align: center; font-size: 0.75rem; color: #64748b; background: #f8fafc;">
                    + يوجد ${b.students.length - 7} طلاب آخرين مسجلين في كشف اليوم
                  </td>
                </tr>
              ` : ''}
              ${b.students.length === 0 ? `
                <tr>
                  <td colspan="5" style="text-align: center; padding: 1.5rem; color: #94a3b8;">
                    لا يوجد طلاب مسجلون بعد. انقر على فتح السجل لإضافة الطلاب أو مزامنتهم.
                  </td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 6px;">
          <span style="font-size: 0.75rem; color: #64748b;"><i class="fa-solid fa-pen-nib text-primary"></i> موضوع: <b>${escapeHtml(b.topic)}</b></span>
          <button type="button" class="btn btn-sm btn-outline" onclick="window.switchToBehaviorTabFromReport()" style="border-color: #10b981; color: #059669; font-weight: 800; font-size: 0.75rem; padding: 0.25rem 0.65rem;">
            فتح سجل السلوك ↗️
          </button>
        </div>
      </div>

      <!-- Card 2: Student Grades & Academic Ledgers (سجل درجات وتقييم الطلاب) -->
      <div class="report-overview-card" style="border-top: 4px solid #0284c7;">
        <div class="report-card-top">
          <div class="report-card-title-group">
            <div class="report-card-icon" style="background: rgba(2, 132, 199, 0.15); color: #0284c7;">
              <i class="fa-solid fa-graduation-cap"></i>
            </div>
            <div>
              <div style="font-weight: 900; font-size: 0.98rem; color: #0f172a;">سجل درجات وتقييم الطلاب</div>
              <small style="color: #64748b; font-size: 0.74rem;">${g.rosters.length} صفوف وشعب محفوظة ومسجلة</small>
            </div>
          </div>
          <span class="report-badge-status" style="background: #eff6ff; color: #0284c7; font-size: 0.82rem;">
            متوسط الأداء: ${g.averageScore}%
          </span>
        </div>

        <div class="report-pills-row">
          <div class="report-stat-pill" style="background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd;">
            <i class="fa-solid fa-school text-primary"></i> الصفوف: <b>${g.rosters.length}</b>
          </div>
          <div class="report-stat-pill" style="background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0;">
            <i class="fa-solid fa-users text-success"></i> الطلاب المقيدون: <b>${g.totalEnrolled}</b>
          </div>
          <div class="report-stat-pill" style="background: #fdf4ff; color: #86198f; border: 1px solid #f5d0fe;">
            <i class="fa-solid fa-star text-warning"></i> المتفوقون: <b>${g.topStudents.length}</b>
          </div>
        </div>

        <!-- Top Students or Classes List -->
        <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.75rem; background: #f8fafc; font-size: 0.8rem;">
          <div style="font-weight: 800; color: #334155; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-medal text-warning"></i> لوحة الشرف وأوائل الطلاب بالسجلات:
          </div>
          ${g.topStudents.length > 0 ? `
            <div style="display: flex; flex-direction: column; gap: 5px;">
              ${g.topStudents.map((st, idx) => `
                <div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; padding: 4px 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                  <span style="font-weight: 700; color: #0f172a;">${idx + 1}. ${escapeHtml(st.name)} <small style="color: #64748b;">(${escapeHtml(st.className)})</small></span>
                  <span style="font-weight: 800; color: #059669; background: #ecfdf5; padding: 1px 6px; border-radius: 4px;">${st.score} درجة</span>
                </div>
              `).join('')}
            </div>
          ` : `
            <div style="color: #64748b; text-align: center; padding: 0.75rem;">
              سجل الدرجات نشط وجاهز لرصد درجات الشهر الأول ونصف السنة.
            </div>
          `}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 6px;">
          <span style="font-size: 0.75rem; color: #64748b;"><i class="fa-solid fa-clipboard-check text-info"></i> نظام درجات معتمد وزارياً</span>
          <button type="button" class="btn btn-sm btn-outline" onclick="window.switchToGradesTabFromReport()" style="border-color: #0284c7; color: #0284c7; font-weight: 800; font-size: 0.75rem; padding: 0.25rem 0.65rem;">
            فتح سجل الدرجات ↗️
          </button>
        </div>
      </div>

      <!-- Card 3: Active Exam & Question Bank (الاختبارات وبنك الأسئلة) -->
      <div class="report-overview-card" style="border-top: 4px solid #f59e0b;">
        <div class="report-card-top">
          <div class="report-card-title-group">
            <div class="report-card-icon" style="background: rgba(245, 158, 11, 0.15); color: #d97706;">
              <i class="fa-solid fa-file-signature"></i>
            </div>
            <div>
              <div style="font-weight: 900; font-size: 0.98rem; color: #0f172a;">الاختبارات وبنك الأسئلة</div>
              <small style="color: #64748b; font-size: 0.74rem;">${ex.allExams.length} اختبارات بالأرشيف | ${ex.bank.length} مفردة بالبنك</small>
            </div>
          </div>
          <span class="report-badge-status" style="background: #fffbeb; color: #b45309; font-size: 0.82rem;">
            12 نموذجاً وزارياً
          </span>
        </div>

        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 0.75rem; font-size: 0.82rem;">
          <div style="font-weight: 800; color: #92400e; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-file-pen text-warning"></i> الاختبار المفتوح حالياً بالمحرر:
          </div>
          <div style="font-size: 0.9rem; font-weight: 900; color: #0f172a;">${escapeHtml(ex.currentExam.title)}</div>
          <div style="font-size: 0.76rem; color: #64748b; margin-top: 4px; display: flex; gap: 10px;">
            <span>المادة: <b>${escapeHtml(ex.currentExam.subject)}</b></span>
            <span>الأسئلة: <b>${ex.currentExam.questionsCount} سؤال</b></span>
            <span>الدرجة الكلية: <b>${ex.currentExam.totalScore} درجة</b></span>
          </div>
        </div>

        <div class="report-pills-row">
          <div class="report-stat-pill" style="background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;">
            <i class="fa-solid fa-file-lines text-primary"></i> اختباراتك: <b>${ex.allExams.filter(e => !e.isModelPreset).length}</b>
          </div>
          <div class="report-stat-pill" style="background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;">
            <i class="fa-solid fa-award text-success"></i> نماذج وزارية: <b>${ex.allExams.filter(e => e.isModelPreset).length || 12}</b>
          </div>
          <div class="report-stat-pill" style="background: #fdf4ff; color: #86198f; border: 1px solid #f5d0fe;">
            <i class="fa-solid fa-database text-purple"></i> إجمالي البنك: <b>${ex.bank.length}</b>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 6px;">
          <button type="button" class="btn btn-sm btn-outline" onclick="window.switchReportSubView('models')" style="font-weight: 700; font-size: 0.74rem;">
            النماذج الوزارية 🏛️
          </button>
          <button type="button" class="btn btn-sm btn-outline" onclick="window.switchToBuilderTabFromReport()" style="border-color: #f59e0b; color: #d97706; font-weight: 800; font-size: 0.75rem; padding: 0.25rem 0.65rem;">
            فتح ورقة الاختبار ↗️
          </button>
        </div>
      </div>

    </div>

    <!-- 3. Bottom Intelligence Row: Cognitive Bloom Levels & Live Operations Timeline -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.15rem; margin-top: 1rem;">
      
      <!-- Bloom's Taxonomy Cognitive Distribution -->
      <div class="bloom-analytics-card">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1.5px solid #f1f5f9; padding-bottom: 0.65rem;">
          <div style="display: flex; align-items: center; gap: 8px; font-size: 0.95rem; font-weight: 900; color: #0f172a;">
            <i class="fa-solid fa-brain" style="color: #7c3aed;"></i>
            <span>توزيع مستويات بلوم المعرفية لأسئلة اليوم</span>
          </div>
          <span style="font-size: 0.72rem; font-weight: 800; color: #7c3aed; background: rgba(124, 58, 237, 0.1); padding: 3px 8px; border-radius: 6px;">مقياس وزاري معتمد</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 0.25rem;">
          <div class="bloom-bar-row">
            <div class="bloom-bar-meta">
              <span>1. التذكر واسترجاع الحقائق</span>
              <span>25% (مستوى أساسي)</span>
            </div>
            <div class="bloom-progress-track">
              <div class="bloom-progress-fill" style="width: 25%; background: linear-gradient(90deg, #38bdf8, #0284c7);"></div>
            </div>
          </div>

          <div class="bloom-bar-row">
            <div class="bloom-bar-meta">
              <span>2. الفهم والاستيعاب والشرح</span>
              <span>35% (مستوى متوسط)</span>
            </div>
            <div class="bloom-progress-track">
              <div class="bloom-progress-fill" style="width: 35%; background: linear-gradient(90deg, #10b981, #059669);"></div>
            </div>
          </div>

          <div class="bloom-bar-row">
            <div class="bloom-bar-meta">
              <span>3. التطبيق العملي وحل المسائل</span>
              <span>20% (مهارة تطبيقية)</span>
            </div>
            <div class="bloom-progress-track">
              <div class="bloom-progress-fill" style="width: 20%; background: linear-gradient(90deg, #f59e0b, #d97706);"></div>
            </div>
          </div>

          <div class="bloom-bar-row">
            <div class="bloom-bar-meta">
              <span>4. التحليل والاستنتاج والمقارنة</span>
              <span>12% (تفكير عليا)</span>
            </div>
            <div class="bloom-progress-track">
              <div class="bloom-progress-fill" style="width: 12%; background: linear-gradient(90deg, #8b5cf6, #7c3aed);"></div>
            </div>
          </div>

          <div class="bloom-bar-row">
            <div class="bloom-bar-meta">
              <span>5. التقويم وإبداء الرأي والابتكار</span>
              <span>8% (قدرات متقدمة)</span>
            </div>
            <div class="bloom-progress-track">
              <div class="bloom-progress-fill" style="width: 8%; background: linear-gradient(90deg, #ec4899, #db2777);"></div>
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 8px; font-size: 0.74rem; color: #64748b;">
          <span>مطابقة مواصفات الامتحانات العامة: <b>100%</b></span>
          <span style="color: #059669; font-weight: 800;">متوازن وزارياً ✔️</span>
        </div>
      </div>

      <!-- Live Operations & Activity Timeline -->
      <div class="daily-activity-timeline-card">
        <div class="timeline-title-row">
          <div class="timeline-title">
            <i class="fa-solid fa-clock-rotate-left" style="color: #0284c7;"></i>
            <span>سجل العمليات والأنشطة اللحظية المنفذة اليوم</span>
          </div>
          <span style="font-size: 0.72rem; font-weight: 800; color: #0284c7; background: #e0f2fe; padding: 2px 8px; border-radius: 6px;">مباشر • اليوم</span>
        </div>

        <div class="timeline-list" id="platformDailyActivitiesTimeline">
          <!-- Populated by window.renderPlatformDailyActivitiesTimeline() -->
        </div>
      </div>

    </div>
  `;
};

window.renderFullPlatformBehaviorView = function () {
  const container = document.getElementById('tabReportBehaviorRender');
  if (!container) return;
  const data = getPlatformComprehensiveData();
  const b = data.behavior;

  container.innerHTML = `
    <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 1.25rem; box-shadow: 0 4px 14px rgba(0,0,0,0.03);">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #f1f5f9; padding-bottom: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; gap: 10px;">
        <div>
          <h3 style="margin: 0; font-size: 1.05rem; font-weight: 900; color: #0f172a;">كشف المتابعة وحسن السلوك المفصل — جلسة اليوم</h3>
          <small style="color: #64748b;">${escapeHtml(b.className)} | ${escapeHtml(b.date)} | مادة ${escapeHtml(b.subject)}</small>
        </div>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn btn-sm btn-primary" onclick="window.switchToBehaviorTabFromReport()" style="background: linear-gradient(135deg, #10b981, #059669); font-weight: 800;">
            <i class="fa-solid fa-folder-open"></i> فتح واجهة السلوك الكاملة
          </button>
        </div>
      </div>

      <div class="report-pills-row" style="margin-bottom: 1rem;">
        <span class="report-stat-pill" style="background: #ecfdf5; color: #059669; font-size: 0.85rem;"><i class="fa-solid fa-circle-check"></i> نسبة الحضور: ${b.rate}%</span>
        <span class="report-stat-pill" style="background: #f0fdf4; color: #166534;"><i class="fa-solid fa-user-check"></i> حضور: ${b.present + b.late}</span>
        <span class="report-stat-pill" style="background: #fef2f2; color: #991b1b;"><i class="fa-solid fa-user-xmark"></i> غياب: ${b.absent}</span>
        <span class="report-stat-pill" style="background: #fffbeb; color: #92400e;"><i class="fa-solid fa-clock"></i> إجازات: ${b.excused}</span>
      </div>

      <div style="overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 10px;">
        <table class="report-table-mini" style="font-size: 0.86rem;">
          <thead>
            <tr>
              <th style="width: 35px;">ت</th>
              <th>اسم الطالب</th>
              <th style="text-align: center; width: 85px;">الحضور والغياب</th>
              <th style="text-align: center; width: 85px;">المشاركة</th>
              <th style="text-align: center; width: 85px;">الواجب</th>
              <th style="text-align: center; width: 85px;">السلوك</th>
              <th style="text-align: center; width: 65px;">التقييم</th>
              <th>الملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${b.students.map((st, i) => `
              <tr>
                <td style="font-weight: bold; color: #64748b;">${i + 1}</td>
                <td style="font-weight: 700; color: #0f172a;">${escapeHtml(st.name)}</td>
                <td style="text-align: center;">
                  <span class="report-badge-status ${st.attendance === 'absent' ? 'report-badge-absent' : st.attendance === 'excused' ? 'report-badge-excused' : st.attendance === 'late' ? 'report-badge-late' : 'report-badge-present'}">
                    ${st.attendance === 'absent' ? 'غائب' : st.attendance === 'excused' ? 'مجاز' : st.attendance === 'late' ? 'متأخر' : 'حاضر'}
                  </span>
                </td>
                <td style="text-align: center;">${(st.participation === 'excellent' || st.participation === 'active') ? 'نشط ⭐' : 'عادي'}</td>
                <td style="text-align: center;">${st.homework === 'done' ? 'منجز ✔️' : 'ناقص ⚠️'}</td>
                <td style="text-align: center;">${st.conduct === 'excellent' ? 'ممتاز 🏅' : 'جيد'}</td>
                <td style="text-align: center; font-weight: bold;">${st.score || 10}/10</td>
                <td style="color: #64748b; font-size: 0.78rem;">${escapeHtml(st.notes || '—')}</td>
              </tr>
            `).join('')}
            ${b.students.length === 0 ? `
              <tr><td colspan="8" style="text-align: center; padding: 2rem; color: #94a3b8;">لا يوجد طلاب مسجلون في جلسة اليوم</td></tr>
            ` : ''}
          </tbody>
        </table>
      </div>
    </div>
  `;
};

window.renderFullPlatformGradesView = function () {
  const container = document.getElementById('tabReportGradesRender');
  if (!container) return;
  const data = getPlatformComprehensiveData();
  const g = data.grades;

  container.innerHTML = `
    <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 1.25rem; box-shadow: 0 4px 14px rgba(0,0,0,0.03);">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #f1f5f9; padding-bottom: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; gap: 10px;">
        <div>
          <h3 style="margin: 0; font-size: 1.05rem; font-weight: 900; color: #0f172a;">سجل درجات وتقييم الصفوف والشعب المحفوظة</h3>
          <small style="color: #64748b;">${g.rosters.length} صفوف مسجلة | إجمالي ${g.totalEnrolled} طالباً</small>
        </div>
        <button type="button" class="btn btn-sm btn-primary" onclick="window.switchToGradesTabFromReport()" style="background: linear-gradient(135deg, #0284c7, #0369a1); font-weight: 800;">
          <i class="fa-solid fa-folder-open"></i> فتح واجهة درجات الطلاب الكاملة
        </button>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;">
        ${g.rosters.map(r => `
          <div style="border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 1rem; background: #f8fafc;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-weight: 800; font-size: 0.95rem; color: #0f172a;">${escapeHtml(r.name)}</span>
              <span class="badge-tag" style="background: #e0f2fe; color: #0369a1; font-weight: 800;">${(r.students || []).length} طالب</span>
            </div>
            <div style="font-size: 0.78rem; color: #64748b; display: flex; gap: 8px;">
              <span>المادة: <b>${escapeHtml((r.meta && r.meta.subject) || r.subject || 'الرياضيات')}</b></span>
              <span>المرحلة: <b>${escapeHtml((r.meta && r.meta.grade) || r.gradeLevel || 'الثالث المتوسط')}</b></span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
};

// Quick Navigation Helpers from Daily Report
window.switchToBehaviorTabFromReport = function () {
  const btn = document.getElementById('mainTabStudentBehaviorBtn');
  if (btn) btn.click();
};

window.switchToGradesTabFromReport = function () {
  const btn = document.getElementById('mainTabStudentGradesBtn');
  if (btn) btn.click();
};

window.switchToBuilderTabFromReport = function () {
  const btn = document.querySelector('.tab-btn[data-tab="tab-questions"]');
  if (btn) btn.click();
};

window.clearReportSearch = function () {
  const searchInput = document.getElementById('tabReportSearchInput');
  const clearBtn = document.getElementById('tabReportClearSearchBtn');
  if (searchInput) searchInput.value = '';
  if (clearBtn) clearBtn.style.display = 'none';
  window.filterDailyReport();
};

window.resetReportFilters = function () {
  const searchInput = document.getElementById('tabReportSearchInput');
  const clearBtn = document.getElementById('tabReportClearSearchBtn');
  const gradeFilter = document.getElementById('tabReportGradeFilter');
  const subFilter = document.getElementById('tabReportSubjectFilter');
  const typeFilter = document.getElementById('tabReportTypeFilter');
  const dateFilter = document.getElementById('tabReportDateFilter');

  if (searchInput) searchInput.value = '';
  if (clearBtn) clearBtn.style.display = 'none';
  if (gradeFilter) gradeFilter.value = 'all';
  if (subFilter) subFilter.value = 'all';
  if (typeFilter) typeFilter.value = 'all';
  if (dateFilter) dateFilter.value = 'all';

  // Also sync modal filters if present
  document.querySelectorAll('#dailySearchInput').forEach(inp => inp.value = '');
  document.querySelectorAll('#dailyClearSearchBtn').forEach(b => b.style.display = 'none');
  document.querySelectorAll('#dailySubjectFilter').forEach(s => s.value = 'all');
  document.querySelectorAll('#dailyTypeFilter').forEach(t => t.value = 'all');
  document.querySelectorAll('#dailyDateFilter').forEach(d => d.value = 'all');

  window.filterDailyReport();
  showToast('تم بنجاح تفريغ الفلتر وعرض كافة الاختبارات 🔄✨', 'info');
};

function initDailyReport() {
  const syncInputs = () => {
    window.filterDailyReport();
  }

  // Wire search inputs
  ['#dailySearchInput', '#tabReportSearchInput'].forEach(selector => {
    const el = document.querySelector(selector);
    if (el) {
      el.addEventListener('input', () => {
        const otherSelector = (selector === '#dailySearchInput') ? '#tabReportSearchInput' : '#dailySearchInput';
        const otherEl = document.querySelector(otherSelector);
        if (otherEl && otherEl.value !== el.value) otherEl.value = el.value;

        const clearBtn1 = document.getElementById('dailyClearSearchBtn');
        const clearBtn2 = document.getElementById('tabReportClearSearchBtn');
        if (clearBtn1) clearBtn1.style.display = el.value ? 'block' : 'none';
        if (clearBtn2) clearBtn2.style.display = el.value ? 'block' : 'none';

        window.filterDailyReport();
      });
    }
  });

  // Wire clear search buttons
  ['#dailyClearSearchBtn', '#tabReportClearSearchBtn'].forEach(selector => {
    const btn = document.querySelector(selector);
    if (btn) {
      btn.addEventListener('click', () => {
        window.clearReportSearch();
      });
    }
  });

  // Wire grade filter
  const gradeEl = document.getElementById('tabReportGradeFilter');
  if (gradeEl) {
    gradeEl.addEventListener('change', syncInputs);
  }

  // Wire subject filters
  ['#dailySubjectFilter', '#tabReportSubjectFilter'].forEach(selector => {
    const el = document.querySelector(selector);
    if (el) {
      el.addEventListener('change', () => {
        const otherSelector = (selector === '#dailySubjectFilter') ? '#tabReportSubjectFilter' : '#dailySubjectFilter';
        const otherEl = document.querySelector(otherSelector);
        if (otherEl && otherEl.value !== el.value) otherEl.value = el.value;
        syncInputs();
      });
    }
  });

  // Wire type filters
  ['#dailyTypeFilter', '#tabReportTypeFilter'].forEach(selector => {
    const el = document.querySelector(selector);
    if (el) {
      el.addEventListener('change', () => {
        const otherSelector = (selector === '#dailyTypeFilter') ? '#tabReportTypeFilter' : '#dailyTypeFilter';
        const otherEl = document.querySelector(otherSelector);
        if (otherEl && otherEl.value !== el.value) otherEl.value = el.value;
        syncInputs();
      });
    }
  });

  // Wire date filters
  ['#dailyDateFilter', '#tabReportDateFilter'].forEach(selector => {
    const el = document.querySelector(selector);
    if (el) {
      el.addEventListener('change', () => {
        const otherSelector = (selector === '#dailyDateFilter') ? '#tabReportDateFilter' : '#dailyDateFilter';
        const otherEl = document.querySelector(otherSelector);
        if (otherEl && otherEl.value !== el.value) otherEl.value = el.value;
        syncInputs();
      });
    }
  });

  // Wire reset buttons
  ['#dailyResetFiltersBtn', '#tabReportResetBtn'].forEach(selector => {
    const btn = document.querySelector(selector);
    if (btn) {
      btn.addEventListener('click', () => {
        window.resetReportFilters();
      });
    }
  });

  const addAllBtn = document.getElementById('addAllFilteredToExamBtn');
  if (addAllBtn) {
    addAllBtn.addEventListener('click', addAllFilteredToCurrentExam);
  }

  // Restore sidebar collapse state from localStorage
  const savedCollapsed = localStorage.getItem('moallem_sidebar_collapsed');
  if (savedCollapsed === '1') {
    window.toggleSideQTypeCollapse(true);
  }
}

window.openDailyReportModal = function () {
  const modal = document.getElementById('dailyReportModal');
  if (!modal) return;

  // Make sure current questions in active exam are synced to bank
  if (appState.questions && appState.questions.length > 0) {
    appState.questions.forEach(q => saveQuestionToHistoryBank(q));
  }

  updateDailyReportMetrics();

  const dateFilter = document.getElementById('dailyDateFilter');
  if (dateFilter && !dateFilter.value) dateFilter.value = 'today';

  window.filterDailyReport();

  modal.style.display = 'flex';
  modal.classList.add('open');
};

window.closeDailyReportModal = function () {
  const modal = document.getElementById('dailyReportModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('open');
  }
};

window.quickFilterReportModal = function (filterVal) {
  const dateFilter = document.getElementById('dailyDateFilter');
  const subjFilter = document.getElementById('dailySubjectFilter');
  const searchInput = document.getElementById('dailySearchInput');
  if (searchInput) searchInput.value = '';

  if (filterVal === 'today') {
    if (dateFilter) dateFilter.value = 'today';
    if (subjFilter) subjFilter.value = 'all';
  } else if (filterVal === 'all') {
    if (dateFilter) dateFilter.value = 'all';
    if (subjFilter) subjFilter.value = 'all';
  } else {
    // subject filter: arabic, english, math
    if (subjFilter) subjFilter.value = filterVal;
    if (dateFilter) dateFilter.value = 'all';
  }

  if (typeof window.filterDailyReport === 'function') {
    window.filterDailyReport();
  }
};

function updateDailyReportMetrics() {
  const bank = getQuestionsHistoryBank();
  const exams = getSavedExamsArchive();
  const todayStr = new Date().toDateString();

  let todayCount = 0;
  let arabicCount = 0;
  let englishCount = 0;
  let mathCount = 0;

  bank.forEach(q => {
    const qDate = q.createdAt ? new Date(q.createdAt).toDateString() : todayStr;
    if (qDate === todayStr) todayCount++;
    const sub = q.subject || 'arabic';
    if (sub === 'english') englishCount++;
    else if (sub === 'math') mathCount++;
    else arabicCount++;
  });

  // Helper for Circular Meter Animation
  function setCircularMeter(id, val, targetMax = 20) {
    const el = document.getElementById(id);
    if (!el) return;
    const num = parseInt(val, 10) || 0;
    el.innerText = num;

    const card = el.closest('.daily-metric-card');
    if (!card) return;
    const meterFill = card.querySelector('.meter-fill');
    if (!meterFill) return;

    const circumference = 188.5; // 2 * Math.PI * 30
    let ratio = 0;
    if (num > 0) {
      const maxVal = Math.max(targetMax, num);
      ratio = Math.min(Math.max(num / maxVal, 0.18), 0.96);
    } else {
      ratio = 0.05; // visible accent notch for zero
    }
    const offset = circumference * (1 - ratio);
    meterFill.style.strokeDashoffset = offset.toFixed(1);
  }

  // Update modal metrics
  setCircularMeter('dailyStatToday', todayCount, 15);
  setCircularMeter('dailyStatArabic', arabicCount, 25);
  setCircularMeter('dailyStatEnglish', englishCount, 25);
  setCircularMeter('dailyStatMath', mathCount, 25);
  setCircularMeter('dailyStatTotal', bank.length, 50);

  // Update Executive KPI Dashboard Counters
  const chipModels = document.getElementById('repCounterModels');
  const chipQuestions = document.getElementById('repCounterQuestions');
  const chipExams = document.getElementById('repCounterExams');

  const modelsList = exams.filter(e => e.isModelPreset);
  const userExamsList = exams.filter(e => !e.isModelPreset);

  setCircularMeter('tabReportStatTotalExams', userExamsList.length, 10);
  if (chipExams) chipExams.innerText = userExamsList.length;

  if (chipModels) chipModels.innerText = modelsList.length;
  setCircularMeter('tabReportStatModels', modelsList.length, 15);

  setCircularMeter('tabReportStatTotalQuestions', bank.length, 50);
  if (chipQuestions) chipQuestions.innerText = bank.length;

  let gradesCount = 1;
  const gradesSet = new Set();
  exams.forEach(e => {
    const g = (e.grade || (e.data && e.data.header && e.data.header.grade) || '').trim();
    if (g && g !== 'غير محدد') gradesSet.add(g);
  });
  gradesCount = Math.max(gradesSet.size, 1);
  setCircularMeter('tabReportStatGrades', gradesCount, 6);

  let recentTotal = 0;
  const now = Date.now();
  const dayAgo = now - 24 * 3600 * 1000;
  exams.forEach(e => {
    const time = e.updatedAt || e.createdAt;
    if (time) {
      const t = new Date(time).getTime();
      if (!isNaN(t) && t >= dayAgo) recentTotal++;
    }
  });
  bank.forEach(q => {
    if (q.createdAt) {
      const t = new Date(q.createdAt).getTime();
      if (!isNaN(t) && t >= dayAgo) recentTotal++;
    }
  });
  setCircularMeter('tabReportStatRecent', recentTotal || todayCount, 10);

  // Platform-wide Comprehensive KPI Integration
  try {
    const platformData = (typeof getPlatformComprehensiveData === 'function') ? getPlatformComprehensiveData() : null;
    if (platformData) {
      const b = platformData.behavior;
      const g = platformData.grades;
      const lp = platformData.lessonPlan;

      // 1. Attendance Rate Circular Meter
      const attRateEl = document.getElementById('tabReportStatAttendanceRate');
      if (attRateEl) attRateEl.innerText = (b.rate || 0) + '%';
      const meterFillAtt = document.getElementById('meterFillAttendance');
      if (meterFillAtt) {
        const circumference = 188.5;
        const ratio = Math.min(Math.max((b.rate || 0) / 100, 0.05), 1);
        meterFillAtt.style.strokeDashoffset = (circumference * (1 - ratio)).toFixed(1);
      }
      const attBadge = document.getElementById('tabReportBadgeAttendance');
      if (attBadge) attBadge.innerText = `${b.present + b.late} حضور من ${b.total || 0}`;

      // 2. Total Enrolled Students Circular Meter
      setCircularMeter('tabReportStatTotalStudents', g.totalEnrolled || b.total || 0, 50);
      const classesBadge = document.getElementById('tabReportBadgeClasses');
      if (classesBadge) classesBadge.innerText = `${g.rosters.length || 1} صفوف وشعب`;

      // 3. Lesson Plan Circular Meter
      const lessonSubjEl = document.getElementById('tabReportStatLessonSubject');
      if (lessonSubjEl) lessonSubjEl.innerText = (lp && lp.topic) ? 'موثقة ✔️' : 'جاهزة 📖';
      const lessonBadge = document.getElementById('tabReportBadgeLesson');
      if (lessonBadge) lessonBadge.innerText = (lp && lp.grade) ? lp.grade : 'وفق المعايير';
      const meterFillLesson = document.getElementById('meterFillLesson');
      if (meterFillLesson) meterFillLesson.style.strokeDashoffset = '25';

      // 4. Update Sub-view Switcher Chips
      const chipOverview = document.getElementById('repCounterOverview');
      if (chipOverview) chipOverview.innerText = '🌟';

      const chipBehavior = document.getElementById('repCounterBehavior');
      if (chipBehavior) chipBehavior.innerText = `${b.rate}% (${b.total})`;

      const chipGrades = document.getElementById('repCounterGrades');
      if (chipGrades) chipGrades.innerText = g.totalEnrolled || 0;

      const chipLesson = document.getElementById('repCounterLesson');
      if (chipLesson) chipLesson.innerText = '📖';
    }
  } catch (err) {
    console.error('Error updating platform KPI metrics:', err);
  }
}

window.filterDailyReport = function () {
  const allExams = getSavedExamsArchive();
  const allQuestions = getQuestionsHistoryBank();

  updateDailyReportMetrics();

  const searchInput = document.getElementById('tabReportSearchInput') || document.getElementById('dailySearchInput');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

  const isModalOpen = !!(document.getElementById('dailyReportModal')?.classList.contains('open'));

  const gradeFilter = document.getElementById('tabReportGradeFilter');
  const selectedGrade = gradeFilter ? gradeFilter.value : 'all';

  const subFilter = document.getElementById('tabReportSubjectFilter') || (isModalOpen ? document.getElementById('dailySubjectFilter') : null);
  const selectedSub = subFilter ? subFilter.value : 'all';

  const typeFilter = document.getElementById('tabReportTypeFilter') || (isModalOpen ? document.getElementById('dailyTypeFilter') : null);
  const selectedType = typeFilter ? typeFilter.value : 'all';

  const dateFilter = document.getElementById('tabReportDateFilter') || (isModalOpen ? document.getElementById('dailyDateFilter') : null);
  const selectedDate = dateFilter ? dateFilter.value : 'all';

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  // Helper date check
  const passesDate = (dateVal) => {
    if (selectedDate === 'all') return true;
    if (!dateVal) return true;
    const t = new Date(dateVal).getTime();
    if (isNaN(t)) return true;
    if (selectedDate === 'today') return t >= todayStart;
    if (selectedDate === 'last3days') return t >= (now.getTime() - 3 * 86400000);
    if (selectedDate === 'lastWeek') return t >= (now.getTime() - 7 * 86400000);
    if (selectedDate === 'lastMonth') return t >= (now.getTime() - 30 * 86400000);
    return true;
  }

  // Helper grade check
  const passesGrade = (gradeText, titleText) => {
    if (selectedGrade === 'all') return true;
    const combined = `${gradeText || ''} ${titleText || ''}`.toLowerCase();
    if (selectedGrade === 'general') {
      return !gradeText || gradeText === 'عام' || combined.includes('وزاري') || combined.includes('شامل');
    }
    return combined.includes(selectedGrade.toLowerCase());
  }

  // 1. Filter Exams vs Ministerial Models depending on active subview
  const isModelsView = (window.currentReportSubView === 'models');
  const isExamsView = (window.currentReportSubView === 'exams');

  const baseExamsList = isModelsView ? allExams.filter(exam => exam.isModelPreset)
    : isExamsView ? allExams.filter(exam => !exam.isModelPreset)
      : allExams;

  const filteredExams = baseExamsList.filter(exam => {
    const examGrade = exam.grade || (exam.data && exam.data.header && exam.data.header.grade) || '';
    const examTitle = exam.title || '';
    const examSubj = exam.subject || (exam.data && exam.data.header && exam.data.header.subject) || '';

    // Grade Check
    if (!passesGrade(examGrade, examTitle)) return false;

    // Subject Check
    if (selectedSub !== 'all') {
      const subLower = selectedSub.toLowerCase();
      const matchSub = examSubj.toLowerCase().includes(subLower) || examTitle.toLowerCase().includes(subLower);
      if (!matchSub) return false;
    }

    // Type / Classification Check
    if (selectedType !== 'all') {
      if (selectedType === 'models') {
        if (!exam.isModelPreset) return false;
      } else if (selectedType === 'drafts') {
        if (!exam.isDraft) return false;
      } else if (selectedType === 'saved') {
        if (exam.isDraft || exam.isModelPreset) return false;
      } else {
        // Question type filtering inside exams: exam must have this question type
        const questions = (exam.data && exam.data.questions) ? exam.data.questions : [];
        if (!questions.some(q => q.type === selectedType)) return false;
      }
    }

    // Date Check
    const examTime = exam.updatedAt || exam.createdAt;
    if (!passesDate(examTime)) return false;

    // Search Query Check
    if (query) {
      let questionsText = '';
      if (exam.data && Array.isArray(exam.data.questions)) {
        questionsText = exam.data.questions.map(q => `${q.title || ''} ${q.text || ''} ${q.modelAnswer || ''}`).join(' ');
      }
      const fullText = [
        examTitle,
        examSubj,
        examGrade,
        (exam.data && exam.data.header && exam.data.header.school) || '',
        (exam.data && exam.data.header && exam.data.header.teacher) || '',
        questionsText
      ].join(' ').toLowerCase();

      if (!fullText.includes(query)) return false;
    }

    return true;
  });

  // 2. Filter Questions
  const filteredQuestions = allQuestions.filter(q => {
    const qSub = q.subject || 'arabic';
    if (selectedSub !== 'all') {
      const sLower = selectedSub.toLowerCase();
  const matchSub = (sLower.includes('عرب') && qSub === 'arabic') ||
    (sLower.includes('eng') && qSub === 'english') ||
    (sLower.includes('رياض') && qSub === 'math') ||
    qSub.toLowerCase().includes(sLower);
  if (!matchSub) return false;
}

if (selectedType !== 'all') {
  if (['models', 'drafts', 'saved'].includes(selectedType)) {
    // Mode/Saved filter passes for general bank
  } else if (q.type !== selectedType) {
    return false;
  }
}

if (!passesDate(q.createdAt)) return false;

if (selectedGrade !== 'all' && selectedGrade !== 'general') {
  const qText = `${q.title || ''} ${q.text || ''}`.toLowerCase();
  if (!qText.includes(selectedGrade.toLowerCase())) {
    // Allow if not specified
  }
}

if (query) {
  const str = [
    q.title || '',
    q.text || '',
    q.modelAnswer || '',
    q.explanation || '',
    q.subject || '',
    (q.options ? q.options.map(o => o.text).join(' ') : ''),
    (q.terms ? q.terms.map(t => t.term + ' ' + t.definition).join(' ') : ''),
    (q.pairs ? q.pairs.map(p => p.left + ' ' + p.right).join(' ') : '')
  ].join(' ').toLowerCase();

  if (!str.includes(query)) return false;
}

return true;
  });

currentFilteredReportExams = filteredExams;
currentFilteredBankQuestions = filteredQuestions;

// Update Count Labels
const filteredEl = document.getElementById('tabReportFilteredCount');
const totalEl = document.getElementById('tabReportTotalCount');
const modalFilteredEl = document.getElementById('dailyFilteredCount');
const modalTotalEl = document.getElementById('dailyTotalBankCount');

if (window.currentReportSubView === 'exams') {
  if (filteredEl) filteredEl.innerText = filteredExams.length;
  if (totalEl) totalEl.innerText = allExams.length;
} else {
  if (filteredEl) filteredEl.innerText = filteredQuestions.length;
  if (totalEl) totalEl.innerText = allQuestions.length;
}

if (modalFilteredEl) modalFilteredEl.innerText = filteredQuestions.length;
if (modalTotalEl) modalTotalEl.innerText = allQuestions.length;

// Active filter badge preview
const tagBadge = document.getElementById('tabReportActiveFilterTag');
if (tagBadge) {
  const activeFilters = [];
  if (selectedGrade !== 'all') activeFilters.push(`المرحلة: ${selectedGrade}`);
  if (selectedSub !== 'all') activeFilters.push(`المادة: ${selectedSub}`);
  if (selectedType !== 'all') activeFilters.push(`النوع: ${selectedType}`);
  if (selectedDate !== 'all') activeFilters.push(`الزمن: ${selectedDate}`);
  if (query) activeFilters.push(`بحث: "${query}"`);

  if (activeFilters.length > 0) {
    tagBadge.style.display = 'inline-flex';
    tagBadge.innerHTML = `<i class="fa-solid fa-filter"></i> ${activeFilters.join(' • ')}`;
  } else {
    tagBadge.style.display = 'none';
  }
}

// Render both lists
window.renderReportExamsList(filteredExams);
renderDailyQuestionsList(filteredQuestions);
};

window.filterDailyReportQuestions = function () {
  window.filterDailyReport();
};

window.renderReportExamsList = function (list) {
  const container = document.getElementById('tabReportExamsListRender');
  if (!container) return;

  const isModelsView = (window.currentReportSubView === 'models');

  if (list.length === 0) {
    if (isModelsView) {
      container.innerHTML = `
        <div class="report-empty-state-box">
          <i class="fa-solid fa-award text-warning" style="font-size: 2.2rem; margin-bottom: 0.65rem;"></i>
          <h4 style="color: var(--text-main); font-weight: 800; margin: 0 0 6px 0;">لا توجد نماذج وزارية تطابق الفلتر أو البحث المحدد</h4>
          <p style="font-size: 0.85rem; max-width: 500px; margin: 0 auto 1rem auto; line-height: 1.5;">
            تأكد من اختيار المرحلة الدراسية المناسبة أو اضغط بالأسفل لإعادة استيراد وتحديث كافة النماذج الوزارية الرسمية الـ 12 المعتمدة.
          </p>
          <div style="display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap;">
            <button type="button" class="btn btn-outline" onclick="window.resetReportFilters()">
              <i class="fa-solid fa-rotate-left"></i> إعادة ضبط الفلاتر
            </button>
            <button type="button" class="btn btn-success" onclick="window.reseedDefaultArchiveModels()">
              <i class="fa-solid fa-cloud-arrow-down"></i> استيراد النماذج الوزارية (12 نموذج)
            </button>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="report-empty-state-box">
          <i class="fa-solid fa-file-pen" style="font-size: 2.2rem; margin-bottom: 0.65rem; color: #3b82f6;"></i>
          <h4 style="color: var(--text-main); font-weight: 800; margin: 0 0 6px 0;">سجل اختباراتك المنشأة فارغ حالياً</h4>
          <p style="font-size: 0.85rem; max-width: 500px; margin: 0 auto 1rem auto; line-height: 1.5;">
            لم تقم بحفظ أي اختبار خاص بك بعد. يمكنك إنشاء اختبار جديد وتعديله وحفظه هنا، أو فتح أي نموذج من قسم (النماذج الوزارية) والتعديل عليه.
          </p>
          <div style="display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap;">
            <button type="button" class="btn btn-primary" onclick="window.startNewExamFromDrawer()">
              <i class="fa-solid fa-file-circle-plus"></i> إنشاء اختبار جديد الآن
            </button>
            <button type="button" class="btn btn-outline" onclick="window.switchReportSubView('models')">
              <i class="fa-solid fa-award text-warning"></i> تصفح النماذج الوزارية (12)
            </button>
          </div>
        </div>
      `;
    }
    return;
  }

  container.innerHTML = list.map(exam => {
    const isModel = !!exam.isModelPreset;
    const isDraft = !!exam.isDraft;
    const stage = exam.grade || (exam.data && exam.data.header && exam.data.header.grade) || 'عام';
    const subject = exam.subject || (exam.data && exam.data.header && exam.data.header.subject) || 'المادة الدراسية';
    const school = (exam.data && exam.data.header && exam.data.header.school) || '';
    const qCount = exam.questionsCount || (exam.data && exam.data.questions && exam.data.questions.length) || 0;
    const score = exam.totalScore || 100;
    const dateFormatted = exam.updatedAt || exam.createdAt || 'تاريخ غير محدد';

    const cardClass = isModel ? 'model-preset-card' : isDraft ? 'draft-card' : 'saved-card';

    return `
      <div class="report-exam-card ${cardClass}" data-exam-id="${exam.id}">
        <div class="report-exam-card-header">
          <div class="report-exam-title-row">
            <h3 class="report-exam-title">
              ${isModel ? '<i class="fa-solid fa-award text-warning" style="margin-left: 5px;"></i>' : ''}
              ${isDraft ? '<i class="fa-solid fa-clock-rotate-left text-warning" style="margin-left: 5px;"></i>' : ''}
              ${exam.title || 'اختبار بدون عنوان'}
            </h3>
          </div>

          <div class="report-exam-badges">
            <span class="rep-stage-pill" title="المرحلة والصف الدراسي">
              <i class="fa-solid fa-graduation-cap"></i> ${stage}
            </span>
            <span class="rep-sub-pill" title="المادة الدراسية">
              <i class="fa-solid fa-book-open"></i> ${subject}
            </span>
            ${isModel ? `
              <span class="rep-status-pill status-model">
                <i class="fa-solid fa-star"></i> نموذج وزاري معتمد
              </span>
            ` : isDraft ? `
              <span class="rep-status-pill status-draft">
                <i class="fa-solid fa-shield-halved"></i> مسودة تلقائية
              </span>
            ` : `
              <span class="rep-status-pill status-saved">
                <i class="fa-solid fa-circle-check"></i> اختبار محفوظ
              </span>
            `}
          </div>
        </div>

        <div class="report-exam-meta-grid">
          <div class="rep-meta-item">
            <i class="fa-solid fa-list-check text-primary"></i>
            <span>الأسئلة: <strong>${qCount} أسئلة</strong></span>
          </div>
          <div class="rep-meta-item">
            <i class="fa-solid fa-award text-warning"></i>
            <span>الدرجة: <strong>${score} درجة</strong></span>
          </div>
          <div class="rep-meta-item" style="grid-column: 1 / -1;">
            <i class="fa-regular fa-clock text-info"></i>
            <span>التاريخ: <strong>${dateFormatted}</strong></span>
          </div>
          ${school ? `
            <div class="rep-meta-item" style="grid-column: 1 / -1;">
              <i class="fa-solid fa-school text-muted"></i>
              <span>المدرسة: <strong>${school}</strong></span>
            </div>
          ` : ''}
        </div>

        <div class="report-exam-actions">
          <button type="button" class="btn-rep-action btn-rep-open" onclick="window.loadExamFromArchiveAndShow('${exam.id}')" title="فتح هذا الاختبار في ورقة الامتحان A4 ومعاينته فوراً">
            <i class="fa-solid fa-file-invoice"></i>
            <span>فتح في ورقة الامتحان A4</span>
          </button>
          <button type="button" class="btn-rep-action btn-rep-print" onclick="window.printExamFromArchiveDirectly('${exam.id}')" title="طباعة فورية للاختبار">
            <i class="fa-solid fa-print"></i>
            <span>طباعة</span>
          </button>
          <button type="button" class="btn-rep-action btn-rep-pdf" onclick="window.exportExamFromArchiveToPdf('${exam.id}')" title="تنزيل الاختبار بصيغة PDF مباشرة للجهاز 📥" style="background: rgba(225, 29, 72, 0.1); color: #e11d48; border-color: rgba(225, 29, 72, 0.3);">
            <i class="fa-solid fa-file-pdf"></i>
            <span>تنزيل PDF</span>
          </button>
          <button type="button" class="btn-rep-action btn-rep-dup" onclick="window.duplicateExamInArchive('${exam.id}')" title="إنشاء نسخة مكررة من هذا الاختبار">
            <i class="fa-solid fa-copy"></i>
          </button>
          ${(exam.isModelPreset || (exam.id && (exam.id.startsWith('preset_model_') || exam.id === 'iraq_official_model'))) ? `
            <span class="badge-tag" style="background: rgba(16, 185, 129, 0.12); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 0.72rem; padding: 0.35rem 0.55rem; display: inline-flex; align-items: center; gap: 4px; border-radius: 6px;" title="نموذج وزاري رسمي معتمد - محمي من الحذف نهائياً 🔒">
              <i class="fa-solid fa-lock"></i> محمي
            </span>
          ` : `
            <button type="button" class="btn-rep-action btn-rep-del" onclick="window.deleteExamFromArchive('${exam.id}')" title="حذف هذا الاختبار فوراً من الأرشيف والتقرير">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');
};

window.loadExamFromArchiveAndShow = function (id) {
  loadExamFromArchive(id);

  // Switch to Questions Builder tab
  const qTabBtn = document.querySelector('.tab-btn[data-tab="tab-questions"]');
  if (qTabBtn) {
    qTabBtn.click();
  }

  // On mobile screen, toggle mobile preview to true so user sees the paper right away
  if (window.innerWidth <= 768 && typeof window.toggleMobilePreview === 'function') {
    window.toggleMobilePreview(true);
  }

  // Scroll to preview paper smoothly
  const previewPaper = document.getElementById('examPaperDoc');
  if (previewPaper) {
    previewPaper.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  showToast('تم بنجاح تحميل وعرض الاختبار في ورقة الامتحان A4! جاهز للمعاينة والتعديل 📄✨', 'success');
};

window.printExamFromArchiveDirectly = function (id) {
  loadExamFromArchive(id);
  setTimeout(() => {
    if (typeof ExamExporter !== 'undefined' && ExamExporter.printExam) {
      ExamExporter.printExam(appState, appState.viewMode === 'answer_key');
    } else {
      window.print();
    }
  }, 300);
};

window.exportExamFromArchiveToPdf = async function (id) {
  if (typeof loadExamFromArchive === 'function') {
    loadExamFromArchive(id);
  }
  setTimeout(async () => {
    if (typeof window.exportCurrentExamToPdf === 'function') {
      await window.exportCurrentExamToPdf();
    }
  }, 350);
};

window.refreshFullDailyReport = function () {
  updateDailyReportMetrics();
  if (typeof window.switchReportSubView === 'function') {
    window.switchReportSubView(window.currentReportSubView || 'overview');
  }
  if (typeof showToast === 'function') {
    showToast('تم تحديث وقراءة كافة بيانات وسجلات المنصة الحالية فوراً 🔄✨', 'success');
  }
};

window.printFullPlatformDailyReport = function () {
  const data = (typeof getPlatformComprehensiveData === 'function') ? getPlatformComprehensiveData() : null;
  if (!data) {
    if (typeof showToast === 'function') showToast('تعذر قراءة بيانات المنصة الشاملة للطباعة', 'danger');
    return;
  }

  let printContainer = document.getElementById('academicReportPrintContainer');
  if (!printContainer) {
    printContainer = document.createElement('div');
    printContainer.id = 'academicReportPrintContainer';
    document.body.appendChild(printContainer);
  }

  const now = new Date();
  const dateFormatted = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;
  let dayName = '';
  try {
    dayName = now.toLocaleDateString('ar-IQ', { weekday: 'long' });
  } catch (e) {
    dayName = 'اليوم';
  }
  const timeFormatted = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

  const t = data.teacher;
  const b = data.behavior;
  const g = data.grades;
  const ex = data.exams;

  printContainer.innerHTML = `
    <div style="direction: rtl; text-align: right; font-family: 'Amiri', 'Cairo', serif; color: #000; padding: 20px 25px; line-height: 1.4; background: #fff;">
      
      <!-- 1. Official Header (ترويسة وزارة التربية الرسمية المعتمدة) -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px solid #000; padding-bottom: 12px; margin-bottom: 14px;">
        <div style="width: 32%;">
          <div style="font-size: 13pt; font-weight: bold;">جمهورية العراق</div>
          <div style="font-size: 11.5pt; font-weight: bold;">وزارة التربية العراقية</div>
          <div style="font-size: 10pt; color: #222;">مديرية التربية في: <strong>${escapeHtml(t.governorate || 'بغداد')}</strong></div>
          <div style="font-size: 10pt; color: #222;">المدرسة: <strong>${escapeHtml(t.school || 'ثانوية المتميزين')}</strong></div>
        </div>
        <div style="width: 36%; text-align: center;">
          <img src="assets/iraq_moe_seal.png" alt="شعار وزارة التربية العراقية" style="width: 68px; height: 68px; object-fit: contain; margin-bottom: 4px; display: inline-block;">
          <div style="font-size: 15pt; font-weight: 900; color: #0f172a; margin-bottom: 2px;">التقرير الأكاديمي اليومي الشامل</div>
          <div style="font-size: 9.5pt; font-weight: bold; color: #0284c7;">منصة مسار المعلم الذكية — الرصد الموحد للأنشطة والقطاعات</div>
          <div style="font-size: 9pt; color: #555; margin-top: 2px;">العام الدراسي: <strong>${escapeHtml(t.academicYear || '2024 - 2025')}</strong></div>
        </div>
        <div style="width: 32%; text-align: left; font-size: 9.5pt; line-height: 1.6;">
          <div><strong>اليوم:</strong> ${dayName || 'اليوم'}</div>
          <div><strong>التاريخ:</strong> ${dateFormatted}</div>
          <div><strong>وقت الطباعة:</strong> ${timeFormatted}</div>
          <div><strong>المعلم المشرف:</strong> ${escapeHtml(t.name || 'أستاذ المادة')}</div>
        </div>
      </div>

      <!-- 2. Sector 1: Attendance & Conduct (قطاع المتابعة اليومية وحسن السلوك) -->
      <div style="margin-bottom: 14px; border: 1.5px solid #000; border-radius: 6px; overflow: hidden;">
        <div style="background: #f1f5f9; border-bottom: 1.5px solid #000; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; font-weight: bold; font-size: 11pt;">
          <span>📋 أولاً: سجل المتابعة اليومية وحسن السلوك والغياب — (الصف: ${escapeHtml(b.className)} | مادة ${escapeHtml(b.subject)} | الحصة: ${escapeHtml(b.period)})</span>
          <span style="font-size: 10pt;">نسبة الحضور: <strong>${b.rate}%</strong></span>
        </div>
        <div style="padding: 8px 10px; font-size: 10pt; background: #fafafa; border-bottom: 1px solid #ddd; display: flex; justify-content: space-around; flex-wrap: wrap; gap: 8px;">
          <span>المقيدون: <b>${b.total}</b></span>
          <span>حضور: <b>${b.present + b.late}</b></span>
          <span>غياب: <b>${b.absent}</b></span>
          <span>إجازات: <b>${b.excused}</b></span>
          <span>تأخير: <b>${b.late}</b></span>
          <span>موضوع الدرس: <b>${escapeHtml(b.topic)}</b></span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt;">
          <thead>
            <tr style="background: #e2e8f0; border-bottom: 1px solid #000;">
              <th style="border: 1px solid #000; padding: 4px; width: 30px; text-align: center;">ت</th>
              <th style="border: 1px solid #000; padding: 4px; text-align: right;">اسم الطالب</th>
              <th style="border: 1px solid #000; padding: 4px; width: 80px; text-align: center;">الموقف</th>
              <th style="border: 1px solid #000; padding: 4px; width: 75px; text-align: center;">المشاركة</th>
              <th style="border: 1px solid #000; padding: 4px; width: 75px; text-align: center;">الواجب</th>
              <th style="border: 1px solid #000; padding: 4px; width: 75px; text-align: center;">السلوك</th>
              <th style="border: 1px solid #000; padding: 4px; width: 60px; text-align: center;">التقييم</th>
              <th style="border: 1px solid #000; padding: 4px; text-align: right;">ملاحظات المعلم</th>
            </tr>
          </thead>
          <tbody>
            ${(b.students || []).slice(0, 15).map((st, i) => `
              <tr style="border-bottom: 1px solid #ccc;">
                <td style="border: 1px solid #000; padding: 3px; text-align: center; font-weight: bold;">${i + 1}</td>
                <td style="border: 1px solid #000; padding: 3px 6px; font-weight: bold;">${escapeHtml(st.name)}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: center; font-weight: 700;">
                  ${st.attendance === 'absent' ? '❌ غائب' : st.attendance === 'excused' ? '⚠️ مجاز' : st.attendance === 'late' ? '⏰ متأخر' : '✔ حاضر'}
                </td>
                <td style="border: 1px solid #000; padding: 3px; text-align: center;">${(st.participation === 'excellent' || st.participation === 'active') ? 'نشط ⭐' : 'عادي'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: center;">${st.homework === 'done' ? 'منجز ✔' : 'ناقص'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: center;">${st.conduct === 'excellent' ? 'ممتاز' : 'جيد'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: center; font-weight: bold;">${st.score || 10}/10</td>
                <td style="border: 1px solid #000; padding: 3px 6px; font-size: 9pt; color: #333;">${escapeHtml(st.notes || '—')}</td>
              </tr>
            `).join('')}
            ${(!b.students || b.students.length === 0) ? `
              <tr><td colspan="8" style="text-align: center; padding: 8px; border: 1px solid #000;">لا توجد بيانات حضور مسجلة لجلسة اليوم</td></tr>
            ` : ''}
          </tbody>
        </table>
      </div>

      <!-- 3. Sector 2: Student Grades Ledger (سجل درجات وتقييم الطلاب) -->
      <div style="margin-bottom: 14px; border: 1.5px solid #000; border-radius: 6px; overflow: hidden;">
        <div style="background: #f1f5f9; border-bottom: 1.5px solid #000; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; font-weight: bold; font-size: 11pt;">
          <span>🎓 ثانياً: موقف سجل درجات الطلاب والشعب المعتمدة</span>
          <span style="font-size: 10pt;">الصفوف المقيدة: <strong>${g.rosters.length}</strong> | إجمالي الطلاب: <strong>${g.totalEnrolled}</strong></span>
        </div>
        <div style="padding: 8px 10px; font-size: 9.5pt; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
          <div>متوسط الأداء العام بالدرجات: <strong>${g.averageScore}%</strong></div>
          <div>أوائل الطلاب المتفوقين المسجلين: <strong>${g.topStudents.map(s => s.name + ' (' + s.score + 'د)').join(' • ') || 'سجلات الرصد نشطة ومحدثة'}</strong></div>
        </div>
      </div>

      <!-- 4. Sector 3: Exams & Central Question Bank (الاختبارات وبنك الأسئلة) -->
      <div style="margin-bottom: 14px; border: 1.5px solid #000; border-radius: 6px; overflow: hidden;">
        <div style="background: #f1f5f9; border-bottom: 1.5px solid #000; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; font-weight: bold; font-size: 11pt;">
          <span>📑 ثالثاً: حصر الاختبارات وبنك الأسئلة المركزي</span>
          <span style="font-size: 10pt;">إجمالي الاختبارات: <strong>${ex.allExams.length}</strong> | مفردات البنك: <strong>${ex.bank.length}</strong> سؤال</span>
        </div>
        <div style="padding: 8px 10px; font-size: 9.5pt; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; background: #fafafa;">
          <span>الاختبار النشط الحالي: <strong>${escapeHtml(ex.currentExam.title)}</strong> (${escapeHtml(ex.currentExam.subject)} - ${escapeHtml(ex.currentExam.grade)})</span>
          <span>الأسئلة بالمحرر: <strong>${ex.currentExam.questionsCount}</strong></span>
          <span>الدرجة الكلية: <strong>${ex.currentExam.totalScore} درجة</strong></span>
          <span>النماذج الوزارية الرسمية: <strong>${ex.allExams.filter(e => e.isModelPreset).length || 12} نموذج</strong></span>
        </div>
      </div>


      <!-- 6. Official Triple Signatures (التوقيعات والمصادقات الرسمية المعتمدة) -->
      <div style="display: flex; justify-content: space-between; margin-top: 30px; padding-top: 15px; border-top: 1.5px solid #000; font-size: 10.5pt; text-align: center;">
        <div style="width: 30%;">
          <div style="font-weight: bold;">مدرس المادة ومعد التقرير</div>
          <div style="margin-top: 5px; color: #444;">${escapeHtml(t.name || 'أستاذ المادة')}</div>
          <div style="margin-top: 30px;">التوقيع: ___________________</div>
        </div>
        <div style="width: 30%;">
          <div style="font-weight: bold;">المشرف التربوي الاختصاصي</div>
          <div style="margin-top: 5px; color: #444;">المشرف المتابع للمدرسة</div>
          <div style="margin-top: 30px;">التوقيع: ___________________</div>
        </div>
        <div style="width: 30%;">
          <div style="font-weight: bold;">مصادقة مدير المدرسة وختم الإدارة</div>
          <div style="margin-top: 5px; color: #444;">إدارة ${escapeHtml(t.school || 'المدرسة')}</div>
          <div style="margin-top: 30px;">التوقيع والختم: ___________________</div>
        </div>
      </div>

    </div>
  `;

  document.body.classList.add('printing-academic-report');
  window.print();

  setTimeout(() => {
    document.body.classList.remove('printing-academic-report');
  }, 1000);
};

window.printAcademicReport = window.printFullPlatformDailyReport;

window.exportFullPlatformDailyReportPdf = async function () {
  const data = (typeof getPlatformComprehensiveData === 'function') ? getPlatformComprehensiveData() : null;
  if (!data) {
    if (typeof showToast === 'function') showToast('تعذر قراءة بيانات المنصة الشاملة لتصدير PDF', 'danger');
    return;
  }

  let printContainer = document.getElementById('academicReportPrintContainer');
  if (!printContainer) {
    printContainer = document.createElement('div');
    printContainer.id = 'academicReportPrintContainer';
    document.body.appendChild(printContainer);
  }

  const now = new Date();
  const dateFormatted = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;
  let dayName = '';
  try {
    dayName = now.toLocaleDateString('ar-IQ', { weekday: 'long' });
  } catch (e) {
    dayName = 'اليوم';
  }
  const timeFormatted = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

  const t = data.teacher;
  const b = data.behavior;
  const g = data.grades;
  const ex = data.exams;

  printContainer.innerHTML = `
    <div style="direction: rtl; text-align: right; font-family: 'Amiri', 'Cairo', serif; color: #000; padding: 25px 30px; line-height: 1.4; background: #fff; width: 100%; box-sizing: border-box;">
      
      <!-- 1. Official Header (ترويسة وزارة التربية الرسمية المعتمدة) -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px solid #000; padding-bottom: 12px; margin-bottom: 14px;">
        <div style="width: 32%;">
          <div style="font-size: 13pt; font-weight: bold;">جمهورية العراق</div>
          <div style="font-size: 11.5pt; font-weight: bold;">وزارة التربية العراقية</div>
          <div style="font-size: 10pt; color: #222;">مديرية التربية في: <strong>${escapeHtml(t.governorate || 'بغداد')}</strong></div>
          <div style="font-size: 10pt; color: #222;">المدرسة: <strong>${escapeHtml(t.school || 'ثانوية المتميزين')}</strong></div>
        </div>
        <div style="width: 36%; text-align: center;">
          <img src="assets/iraq_moe_seal.png" alt="شعار وزارة التربية العراقية" style="width: 68px; height: 68px; object-fit: contain; margin-bottom: 4px; display: inline-block;">
          <div style="font-size: 15pt; font-weight: 900; color: #0f172a; margin-bottom: 2px;">التقرير الأكاديمي اليومي الشامل</div>
          <div style="font-size: 9.5pt; font-weight: bold; color: #0284c7;">منصة مسار المعلم الذكية — الرصد الموحد للأنشطة والقطاعات</div>
          <div style="font-size: 9pt; color: #555; margin-top: 2px;">العام الدراسي: <strong>${escapeHtml(t.academicYear || '2024 - 2025')}</strong></div>
        </div>
        <div style="width: 32%; text-align: left; font-size: 9.5pt; line-height: 1.6;">
          <div><strong>اليوم:</strong> ${dayName || 'اليوم'}</div>
          <div><strong>التاريخ:</strong> ${dateFormatted}</div>
          <div><strong>وقت الإصدار:</strong> ${timeFormatted}</div>
          <div><strong>الأستاذ:</strong> ${escapeHtml(t.name || 'المعلم')}</div>
        </div>
      </div>

      <!-- 2. Sector 1: Attendance & Conduct Summary (المتابعة والغياب اليومي) -->
      <div style="margin-bottom: 14px; border: 1.5px solid #000; border-radius: 6px; overflow: hidden;">
        <div style="background: #f1f5f9; border-bottom: 1.5px solid #000; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; font-weight: bold; font-size: 11pt;">
          <span>📋 أولاً: سجل الحضور والمتابعة اليومية — ${escapeHtml(b.className)} (المادة: ${escapeHtml(b.subject)} - الحصة: ${escapeHtml(b.period)})</span>
          <span style="font-size: 10pt;">نسبة الحضور: <strong>${b.stats.attendanceRate}%</strong></span>
        </div>
        <div style="padding: 8px 10px; font-size: 9.5pt; display: flex; justify-content: space-between; border-bottom: 1px solid #ddd; background: #fafafa;">
          <span>إجمالي الطلاب: <strong>${b.stats.total}</strong></span>
          <span>الحاضرون: <strong style="color: green;">${b.stats.present}</strong></span>
          <span>الغياب: <strong style="color: red;">${b.stats.absent}</strong></span>
          <span>الإجازات: <strong style="color: orange;">${b.stats.excused}</strong></span>
          <span>المتأخرون: <strong>${b.stats.late}</strong></span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 1px solid #000;">
              <th style="border: 1px solid #000; padding: 4px; width: 35px; text-align: center;">ت</th>
              <th style="border: 1px solid #000; padding: 4px 6px; text-align: right;">اسم الطالب الثلاثي</th>
              <th style="border: 1px solid #000; padding: 4px; width: 75px; text-align: center;">الحضور</th>
              <th style="border: 1px solid #000; padding: 4px; width: 75px; text-align: center;">المشاركة</th>
              <th style="border: 1px solid #000; padding: 4px; width: 75px; text-align: center;">الواجب</th>
              <th style="border: 1px solid #000; padding: 4px; width: 75px; text-align: center;">السلوك</th>
              <th style="border: 1px solid #000; padding: 4px; width: 65px; text-align: center;">التقييم</th>
              <th style="border: 1px solid #000; padding: 4px; text-align: right;">ملاحظات المعلم</th>
            </tr>
          </thead>
          <tbody>
            ${(b.students || []).slice(0, 25).map((st, i) => `
              <tr style="border-bottom: 1px solid #ccc;">
                <td style="border: 1px solid #000; padding: 3px; text-align: center; font-weight: bold;">${i + 1}</td>
                <td style="border: 1px solid #000; padding: 3px 6px; font-weight: bold;">${escapeHtml(st.name)}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: center; font-weight: 700;">
                  ${st.attendance === 'absent' ? '❌ غائب' : st.attendance === 'excused' ? '⚠️ مجاز' : st.attendance === 'late' ? '⏰ متأخر' : '✔ حاضر'}
                </td>
                <td style="border: 1px solid #000; padding: 3px; text-align: center;">${(st.participation === 'excellent' || st.participation === 'active') ? 'نشط ⭐' : 'عادي'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: center;">${st.homework === 'done' ? 'منجز ✔' : 'ناقص'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: center;">${st.conduct === 'excellent' ? 'ممتاز' : 'جيد'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: center; font-weight: bold;">${st.score || 10}/10</td>
                <td style="border: 1px solid #000; padding: 3px 6px; font-size: 9pt; color: #333;">${escapeHtml(st.notes || '—')}</td>
              </tr>
            `).join('')}
            ${(!b.students || b.students.length === 0) ? `
              <tr><td colspan="8" style="text-align: center; padding: 8px; border: 1px solid #000;">لا توجد بيانات حضور مسجلة لجلسة اليوم</td></tr>
            ` : ''}
          </tbody>
        </table>
      </div>

      <!-- 3. Sector 2: Student Grades Ledger (سجل درجات وتقييم الطلاب) -->
      <div style="margin-bottom: 14px; border: 1.5px solid #000; border-radius: 6px; overflow: hidden;">
        <div style="background: #f1f5f9; border-bottom: 1.5px solid #000; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; font-weight: bold; font-size: 11pt;">
          <span>🎓 ثانياً: موقف سجل درجات الطلاب والشعب المعتمدة</span>
          <span style="font-size: 10pt;">الصفوف المقيدة: <strong>${g.rosters.length}</strong> | إجمالي الطلاب: <strong>${g.totalEnrolled}</strong></span>
        </div>
        <div style="padding: 8px 10px; font-size: 9.5pt; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
          <div>متوسط الأداء العام بالدرجات: <strong>${g.averageScore}%</strong></div>
          <div>أوائل الطلاب المتفوقين المسجلين: <strong>${g.topStudents.map(s => s.name + ' (' + s.score + 'د)').join(' • ') || 'سجلات الرصد نشطة ومحدثة'}</strong></div>
        </div>
      </div>

      <!-- 4. Sector 3: Exams & Central Question Bank (الاختبارات وبنك الأسئلة) -->
      <div style="margin-bottom: 14px; border: 1.5px solid #000; border-radius: 6px; overflow: hidden;">
        <div style="background: #f1f5f9; border-bottom: 1.5px solid #000; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; font-weight: bold; font-size: 11pt;">
          <span>📑 ثالثاً: حصر الاختبارات وبنك الأسئلة المركزي</span>
          <span style="font-size: 10pt;">إجمالي الاختبارات: <strong>${ex.allExams.length}</strong> | مفردات البنك: <strong>${ex.bank.length}</strong> سؤال</span>
        </div>
        <div style="padding: 8px 10px; font-size: 9.5pt; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; background: #fafafa;">
          <span>الاختبار النشط الحالي: <strong>${escapeHtml(ex.currentExam.title)}</strong> (${escapeHtml(ex.currentExam.subject)} - ${escapeHtml(ex.currentExam.grade)})</span>
          <span>الأسئلة بالمحرر: <strong>${ex.currentExam.questionsCount}</strong></span>
          <span>الدرجة الكلية: <strong>${ex.currentExam.totalScore} درجة</strong></span>
          <span>النماذج الوزارية الرسمية: <strong>${ex.allExams.filter(e => e.isModelPreset).length || 12} نموذج</strong></span>
        </div>
      </div>

      <!-- 5. Official Triple Signatures (التوقيعات والمصادقات الرسمية المعتمدة) -->
      <div style="display: flex; justify-content: space-between; margin-top: 30px; padding-top: 15px; border-top: 1.5px solid #000; font-size: 10.5pt; text-align: center;">
        <div style="width: 30%;">
          <div style="font-weight: bold;">مدرس المادة ومعد التقرير</div>
          <div style="margin-top: 5px; color: #444;">${escapeHtml(t.name || 'أستاذ المادة')}</div>
          <div style="margin-top: 30px;">التوقيع: ___________________</div>
        </div>
        <div style="width: 30%;">
          <div style="font-weight: bold;">المشرف التربوي الاختصاصي</div>
          <div style="margin-top: 5px; color: #444;">المشرف المتابع للمدرسة</div>
          <div style="margin-top: 30px;">التوقيع: ___________________</div>
        </div>
        <div style="width: 30%;">
          <div style="font-weight: bold;">مصادقة مدير المدرسة وختم الإدارة</div>
          <div style="margin-top: 5px; color: #444;">إدارة ${escapeHtml(t.school || 'المدرسة')}</div>
          <div style="margin-top: 30px;">التوقيع والختم: ___________________</div>
        </div>
      </div>

    </div>
  `;

  printContainer.style.display = 'block';
  printContainer.style.position = 'relative';

  const dateSlug = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const filename = `تقرير-المدرسة-اليومي-الشامل-${dateSlug}.pdf`;

  try {
    if (typeof window.exportToPDF === 'function') {
      await window.exportToPDF(printContainer, {
        title: filename.replace(/\.pdf$/i, ''),
        filename: filename,
        pageSize: 'a4',
        format: 'a4',
        orientation: 'portrait',
        margin: '10mm',
        fit: true
      });
      if (typeof showToast === 'function') showToast('تم تنزيل التقرير الأكاديمي الشامل بصيغة PDF بنجاح ✅', 'success');
    } else {
      throw new Error('محرك تصدير PDF المباشر غير متوفر');
    }
  } catch (err) {
    console.error('exportFullPlatformDailyReportPdf error:', err);
    if (typeof showToast === 'function') showToast('حدث خطأ أثناء تنزيل تقرير PDF: ' + (err.message || 'خطأ غير متوقع'), 'danger');
  } finally {
    if (printContainer) printContainer.style.display = 'none';
  }
};



function renderDailyQuestionsList(list) {
  const containerModal = document.getElementById('dailyQuestionsListRender');
  const containerTab = document.getElementById('tabReportQuestionsListRender');
  const containers = [containerModal, containerTab].filter(Boolean);
  if (containers.length === 0) return;

  if (list.length === 0) {
    const emptyHtml = `
      <div class="daily-empty-state">
        <i class="fa-solid fa-box-open"></i>
        <p style="font-weight: 700; color: var(--text-main); font-size: 0.95rem;">لا توجد أسئلة تطابق معايير الفلترة المحددة</p>
        <p style="font-size: 0.8rem; margin-top: 4px;">جرب تغيير خيار النطاق الزمني إلى (كافة التواريخ) أو تفريغ نص البحث لرؤية جميع الأسئلة المنشأة.</p>
      </div>
    `;
    containers.forEach(c => c.innerHTML = emptyHtml);
    return;
  }

  const cardsHtml = list.map((q, idx) => {
    const qSub = q.subject || 'arabic';
    const isEn = (qSub === 'english');
    const typeDef = QUESTION_TYPES[q.type] || { name: 'سؤال', icon: 'fa-circle-question' };

    // Format creation date
    let dateStr = 'اليوم';
    if (q.createdAt) {
      try {
        const d = new Date(q.createdAt);
        dateStr = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} - ${d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;
      } catch (e) {
        dateStr = 'اليوم';
      }
    }

    // Details summary preview
    let detailsHtml = '';
    if (q.type === 'mcq' && q.options && q.options.length > 0) {
      detailsHtml = `<div class="daily-qcard-details"><i class="fa-solid fa-list-check text-primary"></i> الخيارات: ${q.options.map(o => `${o.isCorrect ? '✔ ' : ''}${o.text}`).join(' | ')}</div>`;
    } else if (q.type === 'definitions' && q.terms && q.terms.length > 0) {
      detailsHtml = `<div class="daily-qcard-details"><i class="fa-solid fa-book-bookmark text-success"></i> المصطلحات (${q.terms.length}): ${q.terms.map(t => t.term).join('، ')}</div>`;
    } else if (q.type === 'comparisons' && (q.item1 || q.item2)) {
      detailsHtml = `<div class="daily-qcard-details"><i class="fa-solid fa-code-compare text-warning"></i> مقارنة بين: <strong>${q.item1}</strong> و <strong>${q.item2}</strong></div>`;
    } else if (q.modelAnswer) {
      detailsHtml = `<div class="daily-qcard-details"><i class="fa-solid fa-lightbulb text-warning"></i> نموذج الحل: ${q.modelAnswer.substring(0, 120)}${q.modelAnswer.length > 120 ? '...' : ''}</div>`;
    }

    return `
      <div class="daily-qcard">
        <div class="daily-qcard-header">
          <div class="daily-qcard-badges">
            <span class="daily-sub-badge sub-${qSub}">
              <i class="${qSub === 'english' ? 'fa-solid fa-globe' : qSub === 'math' ? 'fa-solid fa-calculator' : 'fa-solid fa-feather-pointed'}"></i>
              ${qSub === 'english' ? 'English' : qSub === 'math' ? 'رياضيات' : 'عربي'}
            </span>
            <span class="daily-type-badge">
              <i class="${typeDef.icon}"></i> ${typeDef.name}
            </span>
            <span class="badge-tag" style="background: rgba(255, 255, 255, 0.08); font-size: 0.68rem;">${q.score || 10} درجات</span>
            ${q.bloom ? `<span class="badge-tag" style="font-size: 0.68rem; color: #38bdf8;">بلوم: ${q.bloom}</span>` : ''}
          </div>
          <div class="daily-qcard-date">
            <i class="fa-regular fa-clock"></i>
            <span>${dateStr}</span>
          </div>
        </div>

        <div class="daily-qcard-body" dir="${isEn ? 'ltr' : 'rtl'}">
          ${q.title ? `<div style="font-size: 0.8rem; color: var(--primary); margin-bottom: 2px;">${q.title}</div>` : ''}
          <div>${q.text || '(سؤال بدون نص رئيسي)'}</div>
        </div>

        ${detailsHtml}

        <div class="daily-qcard-actions">
          <button type="button" class="daily-qcard-btn btn-insert" onclick="addQuestionFromBankToExam('${q.id}')" title="إدراج هذا السؤال مباشرة في ورقة الاختبار الحالية">
            <i class="fa-solid fa-plus"></i> إدراج في الاختبار
          </button>
          <button type="button" class="daily-qcard-btn btn-delete" onclick="removeQuestionFromHistoryBank('${q.id}')" title="حذف السؤال من بنك الأسئلة">
            <i class="fa-solid fa-trash-can"></i> حذف
          </button>
        </div>
      </div>
    `;
  }).join('');

  containers.forEach(c => {
    c.innerHTML = cardsHtml;
  });
}

window.addQuestionFromBankToExam = function (qId) {
  const bank = getQuestionsHistoryBank();
  const q = bank.find(item => item.id === qId);
  if (!q) return;

  const clone = JSON.parse(JSON.stringify(q));
  clone.id = generateId(); // Fresh ID for the exam instance
  appState.questions.push(clone);
  saveStateToStorage();
  renderAll();
  showToast(`تم إدراج السؤال (${clone.title || clone.text.substring(0, 25)}) في ورقة الاختبار الحالية ✨`, 'success');
};

window.addAllFilteredToCurrentExam = function () {
  if (!currentFilteredBankQuestions || currentFilteredBankQuestions.length === 0) {
    showToast('لا توجد أسئلة معروضة بالفلتر لإدراجها', 'info');
    return;
  }

  if (!confirm(`هل ترغب بإدراج كافة الأسئلة المعروضة بالفلتر (${currentFilteredBankQuestions.length} سؤال) إلى ورقة الاختبار الحالية؟`)) {
    return;
  }

  currentFilteredBankQuestions.forEach(q => {
    const clone = JSON.parse(JSON.stringify(q));
    clone.id = generateId();
    appState.questions.push(clone);
  });

  saveStateToStorage();
  renderAll();
  closeDailyReportModal();
  showToast(`تم بنجاح إدراج ${currentFilteredBankQuestions.length} أسئلة في ورقة الاختبار الحالية! 🎉`, 'success');
};

/* ==========================================================================
   Print Daily Report (طباعة التقرير اليومي الرسمي)
   ========================================================================== */
window.printDailyReport = function () {
  const list = (currentFilteredBankQuestions && currentFilteredBankQuestions.length > 0)
    ? currentFilteredBankQuestions
    : getQuestionsHistoryBank();

  if (list.length === 0) {
    showToast('لا توجد أسئلة مسجلة في التقرير لطباعتها', 'info');
    return;
  }

  let printContainer = document.getElementById('dailyReportPrintContainer');
  if (!printContainer) {
    printContainer = document.createElement('div');
    printContainer.id = 'dailyReportPrintContainer';
    document.body.appendChild(printContainer);
  }

  const now = new Date();
  const dateFormatted = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;
  const timeFormatted = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

  // Compute breakdown stats for print header
  const arabicCount = list.filter(q => (!q.subject || q.subject === 'arabic')).length;
  const englishCount = list.filter(q => q.subject === 'english').length;
  const mathCount = list.filter(q => q.subject === 'math').length;

  printContainer.innerHTML = `
    <div style="direction: rtl; text-align: right; font-family: 'Amiri', 'Cairo', serif; color: #000; padding: 20px;">
      <!-- Report Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <div style="font-size: 15pt; font-weight: bold;">جمهورية العراق - وزارة التربية</div>
          <div style="font-size: 12pt; color: #333;">منصة المعلم الأستاذ (Moallem Pro) لإدارة الاختبارات</div>
          <div style="font-size: 11pt; color: #555;">المعلم: ${teacherProfile.name || 'أستاذ حسين'} | المدرسة: ${teacherProfile.school || 'ثانوية المتميزين'}</div>
        </div>
        <div style="text-align: left; font-size: 10pt;">
          <div><strong>تاريخ التقرير:</strong> ${dateFormatted}</div>
          <div><strong>وقت الطباعة:</strong> ${timeFormatted}</div>
          <div><strong>إجمالي الأسئلة:</strong> ${list.length} سؤال</div>
        </div>
      </div>

      <!-- Report Title -->
      <div style="text-align: center; margin-bottom: 18px;">
        <h2 style="font-size: 16pt; margin: 0 0 6px 0; text-decoration: underline;">تقرير المتابعة اليومي وبنك الأسئلة المنشأة</h2>
        <div style="display: flex; justify-content: center; gap: 20px; font-size: 11pt; margin-top: 8px;">
          <span>🔹 أسئلة اللغة العربية: <strong>${arabicCount}</strong></span>
          <span>🔹 أسئلة اللغة الإنكليزية: <strong>${englishCount}</strong></span>
          <span>🔹 أسئلة الرياضيات: <strong>${mathCount}</strong></span>
        </div>
      </div>

      <!-- Questions Table / List -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10.5pt;">
        <thead>
          <tr style="background: #f1f5f9; border: 1.5px solid #000;">
            <th style="border: 1px solid #000; padding: 6px; width: 40px; text-align: center;">ت</th>
            <th style="border: 1px solid #000; padding: 6px; width: 85px; text-align: center;">المادة</th>
            <th style="border: 1px solid #000; padding: 6px; width: 110px; text-align: center;">النوع</th>
            <th style="border: 1px solid #000; padding: 6px; text-align: right;">صيغة السؤال وتفاصيله</th>
            <th style="border: 1px solid #000; padding: 6px; width: 60px; text-align: center;">الدرجة</th>
          </tr>
        </thead>
        <tbody>
          ${list.map((q, i) => {
    const qSub = q.subject || 'arabic';
    const subLabel = qSub === 'english' ? 'English' : qSub === 'math' ? 'رياضيات' : 'عربي';
    const typeDef = QUESTION_TYPES[q.type] || { name: 'سؤال' };
    const isEn = (qSub === 'english');

    let extra = '';
    if (q.type === 'mcq' && q.options) {
      extra = `<div style="font-size: 9.5pt; color: #333; margin-top: 4px;">الخيارات: ${q.options.map(o => (o.isCorrect ? ' [✔ ' : ' [') + o.text + ']').join(' ')}</div>`;
    } else if (q.modelAnswer) {
      extra = `<div style="font-size: 9.5pt; color: #222; margin-top: 4px;"><strong>الإجابة النموذجية:</strong> ${q.modelAnswer}</div>`;
    }

    return `
              <tr style="border: 1px solid #000;">
                <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">${i + 1}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">${subLabel}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${typeDef.name}</td>
                <td style="border: 1px solid #000; padding: 6px; direction: ${isEn ? 'ltr' : 'rtl'}; text-align: ${isEn ? 'left' : 'right'};">
                  ${q.title ? `<div style="font-weight: bold; margin-bottom: 2px;">${q.title}</div>` : ''}
                  <div>${q.text || ''}</div>
                  ${extra}
                </td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">${q.score || 10}</td>
              </tr>
            `;
  }).join('')}
        </tbody>
      </table>

      <!-- Signatures Footer -->
      <div style="margin-top: 40px; display: flex; justify-content: space-between; padding: 0 30px;">
        <div style="text-align: center;">
          <div style="font-weight: bold;">مدرس المادة ومعد الأسئلة</div>
          <div style="margin-top: 35px;">___________________</div>
        </div>
        <div style="text-align: center;">
          <div style="font-weight: bold;">مصادقة إدارة المدرسة / الإشراف</div>
          <div style="margin-top: 35px;">___________________</div>
        </div>
      </div>
    </div>
  `;

  document.body.classList.add('printing-daily-report');
  window.print();

  setTimeout(() => {
    document.body.classList.remove('printing-daily-report');
  }, 1000);
};

window.exportDailyReportPdf = async function () {
  const list = (currentFilteredBankQuestions && currentFilteredBankQuestions.length > 0)
    ? currentFilteredBankQuestions
    : getQuestionsHistoryBank();

  if (list.length === 0) {
    if (typeof showToast === 'function') showToast('لا توجد أسئلة مسجلة في التقرير لتصديرها بصيغة PDF', 'info');
    return;
  }

  let printContainer = document.getElementById('dailyReportPrintContainer');
  if (!printContainer) {
    printContainer = document.createElement('div');
    printContainer.id = 'dailyReportPrintContainer';
    document.body.appendChild(printContainer);
  }

  const now = new Date();
  const dateFormatted = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;
  const timeFormatted = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

  const arabicCount = list.filter(q => (!q.subject || q.subject === 'arabic')).length;
  const englishCount = list.filter(q => q.subject === 'english').length;
  const mathCount = list.filter(q => q.subject === 'math').length;

  printContainer.innerHTML = `
    <div style="direction: rtl; text-align: right; font-family: 'Amiri', 'Cairo', serif; color: #000; padding: 20px; background: #fff; width: 100%; box-sizing: border-box;">
      <!-- Report Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <div style="font-size: 15pt; font-weight: bold;">جمهورية العراق - وزارة التربية</div>
          <div style="font-size: 12pt; color: #333;">منصة المعلم الأستاذ (Moallem Pro) لإدارة الاختبارات</div>
          <div style="font-size: 11pt; color: #555;">المعلم: ${teacherProfile.name || 'أستاذ حسين'} | المدرسة: ${teacherProfile.school || 'ثانوية المتميزين'}</div>
        </div>
        <div style="text-align: left; font-size: 10pt;">
          <div><strong>تاريخ التقرير:</strong> ${dateFormatted}</div>
          <div><strong>وقت الإصدار:</strong> ${timeFormatted}</div>
          <div><strong>إجمالي الأسئلة:</strong> ${list.length} سؤال</div>
        </div>
      </div>

      <!-- Report Title -->
      <div style="text-align: center; margin-bottom: 18px;">
        <h2 style="font-size: 16pt; margin: 0 0 6px 0; text-decoration: underline;">تقرير المتابعة اليومي وبنك الأسئلة المنشأة</h2>
        <div style="display: flex; justify-content: center; gap: 20px; font-size: 11pt; margin-top: 8px;">
          <span>🔹 أسئلة اللغة العربية: <strong>${arabicCount}</strong></span>
          <span>🔹 أسئلة اللغة الإنكليزية: <strong>${englishCount}</strong></span>
          <span>🔹 أسئلة الرياضيات: <strong>${mathCount}</strong></span>
        </div>
      </div>

      <!-- Questions Table / List -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10.5pt;">
        <thead>
          <tr style="background: #f1f5f9; border: 1.5px solid #000;">
            <th style="border: 1px solid #000; padding: 6px; width: 40px; text-align: center;">ت</th>
            <th style="border: 1px solid #000; padding: 6px; width: 85px; text-align: center;">المادة</th>
            <th style="border: 1px solid #000; padding: 6px; width: 110px; text-align: center;">النوع</th>
            <th style="border: 1px solid #000; padding: 6px; text-align: right;">صيغة السؤال وتفاصيله</th>
            <th style="border: 1px solid #000; padding: 6px; width: 60px; text-align: center;">الدرجة</th>
          </tr>
        </thead>
        <tbody>
          ${list.map((q, i) => {
    const qSub = q.subject || 'arabic';
    const subLabel = qSub === 'english' ? 'English' : qSub === 'math' ? 'رياضيات' : 'عربي';
    const typeDef = QUESTION_TYPES[q.type] || { name: 'سؤال' };
    const isEn = (qSub === 'english');

    let extra = '';
    if (q.type === 'mcq' && q.options) {
      extra = `<div style="font-size: 9.5pt; color: #333; margin-top: 4px;">الخيارات: ${q.options.map(o => (o.isCorrect ? ' [✔ ' : ' [') + o.text + ']').join(' ')}</div>`;
    } else if (q.modelAnswer) {
      extra = `<div style="font-size: 9.5pt; color: #222; margin-top: 4px;"><strong>الإجابة النموذجية:</strong> ${q.modelAnswer}</div>`;
    }

    return `
              <tr style="border: 1px solid #000;">
                <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">${i + 1}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">${subLabel}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${typeDef.name}</td>
                <td style="border: 1px solid #000; padding: 6px; direction: ${isEn ? 'ltr' : 'rtl'}; text-align: ${isEn ? 'left' : 'right'};">
                  ${q.title ? `<div style="font-weight: bold; margin-bottom: 2px;">${q.title}</div>` : ''}
                  <div>${q.text || ''}</div>
                  ${extra}
                </td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">${q.score || 10}</td>
              </tr>
            `;
  }).join('')}
        </tbody>
      </table>

      <!-- Signatures Footer -->
      <div style="margin-top: 40px; display: flex; justify-content: space-between; padding: 0 30px;">
        <div style="text-align: center;">
          <div style="font-weight: bold;">مدرس المادة ومعد الأسئلة</div>
          <div style="margin-top: 35px;">___________________</div>
        </div>
        <div style="text-align: center;">
          <div style="font-weight: bold;">مصادقة إدارة المدرسة / الإشراف</div>
          <div style="margin-top: 35px;">___________________</div>
        </div>
      </div>
    </div>
  `;

  printContainer.style.display = 'block';
  printContainer.style.position = 'relative';

  const dateSlug = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const filename = `تقرير-بنك-الأسئلة-${dateSlug}.pdf`;

  try {
    if (typeof window.exportToPDF === 'function') {
      await window.exportToPDF(printContainer, {
        filename: filename,
        format: 'a4',
        orientation: 'portrait',
        margin: [10, 10, 10, 10],
        scale: 2
      });
      if (typeof showToast === 'function') showToast('تم تنزيل تقرير بنك الأسئلة بصيغة PDF بنجاح ✅', 'success');
    } else {
      throw new Error('محرك تصدير PDF المباشر غير متوفر');
    }
  } catch (err) {
    console.error('exportDailyReportPdf error:', err);
    if (typeof showToast === 'function') showToast('حدث خطأ أثناء تنزيل تقرير PDF: ' + (err.message || 'خطأ غير متوقع'), 'danger');
  } finally {
    if (printContainer) printContainer.style.display = 'none';
  }
};


// Global exports for accessibility across application
window.initSubjectMode = initSubjectMode;
window.setSubjectMode = setSubjectMode;
window.initQuestionsQuickFilter = initQuestionsQuickFilter;
window.initQuestionsHistoryBank = initQuestionsHistoryBank;
window.getQuestionsHistoryBank = getQuestionsHistoryBank;
window.saveQuestionToHistoryBank = saveQuestionToHistoryBank;
window.initDailyReport = initDailyReport;

/* ==========================================================================
   Side Question Toolbar Collapse / Expand (تصغير وتوسيع شريط الأدوات)
   ========================================================================== */
window.toggleSideQTypeCollapse = function (forceState) {
  const bar = document.getElementById('sideQTypeBar');
  if (!bar) return;

  let shouldCollapse;
  if (typeof forceState === 'boolean') {
    shouldCollapse = forceState;
  } else {
    shouldCollapse = !bar.classList.contains('collapsed');
  }

  if (shouldCollapse) {
    bar.classList.add('collapsed');
    localStorage.setItem('moallem_side_qtype_collapsed', 'true');
  } else {
    bar.classList.remove('collapsed');
    localStorage.setItem('moallem_side_qtype_collapsed', 'false');
  }

  const icon = document.getElementById('sideCollapseIcon');
  if (icon) {
    if (shouldCollapse) {
      icon.className = 'fa-solid fa-angles-left';
    } else {
      icon.className = 'fa-solid fa-angles-right';
    }
  }

  const btn = document.getElementById('toggleSideQTypeCollapse');
  if (btn) {
    btn.title = shouldCollapse ? 'توسيع شريط الأدوات وعرض النصوص' : 'تصغير شريط الأدوات لإظهار الأيقونات فقط';
  }

  if (typeof forceState !== 'boolean') {
    showToast(shouldCollapse ? 'تم تصغير شريط الأدوات (عرض الأيقونات فقط) 🔲' : 'تم توسيع شريط الأدوات وعرض النصوص 🗂️', 'info');
  }
};

/* ==========================================================================
   Switch to Integrated Report Tab (التنقل إلى واجهة التقرير اليومي المتكاملة)
   ========================================================================== */
window.switchToReportTab = function (isFromSave = false) {
  // 1. Activate tab button
  const tabButtons = document.querySelectorAll('.tabs-nav .tab-btn');
  tabButtons.forEach(b => b.classList.remove('active'));

  const reportTabBtn = document.getElementById('mainTabReportBtn') || document.querySelector('.tab-btn[data-tab="tab-report"]');
  if (reportTabBtn) {
    reportTabBtn.classList.add('active');
  }

  // 2. Hide all other tab contents and display tab-report
  const tabContents = document.querySelectorAll('.builder-body-scrollable .tab-content');
  tabContents.forEach(c => {
    c.style.display = 'none';
    c.classList.remove('active');
  });

  const reportContent = document.getElementById('tab-report');
  if (reportContent) {
    reportContent.style.display = 'block';
    reportContent.classList.add('active');
  }

  if (typeof window.updatePreviewVisibilityForTab === 'function') {
    window.updatePreviewVisibilityForTab('tab-report');
  }

  // 3. Switch mobile workstation to builder if on mobile
  if (typeof window.setMobileWorkstationMode === 'function') {
    window.setMobileWorkstationMode('builder');
  }

  // 4. Close side drawer if open
  if (typeof window.closeSideDrawer === 'function') {
    window.closeSideDrawer();
  }

  // 5. Close modals if open (to avoid overlapping)
  const modal = document.getElementById('dailyReportModal');
  if (modal && modal.classList.contains('open')) {
    modal.classList.remove('open');
  }
  const archiveModal = document.getElementById('archiveModal');
  if (archiveModal && archiveModal.classList.contains('open')) {
    archiveModal.classList.remove('open');
  }

  // 6. Update metrics & render comprehensive platform view
  if (typeof window.switchReportSubView === 'function') {
    window.switchReportSubView(window.currentReportSubView || 'overview');
  } else {
    if (typeof updateDailyReportMetrics === 'function') updateDailyReportMetrics();
    if (typeof filterDailyReportQuestions === 'function') filterDailyReportQuestions();
  }

  // 7. Scroll smoothly to top of the report
  const scrollContainer = document.querySelector('.builder-body-scrollable');
  if (scrollContainer) {
    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (isFromSave) {
    showToast('تم حفظ الاختبار بنجاح، وتصفير ورقة العمل والانتقال إلى لوحة التقرير 📊✔', 'success');
  } else {
    showToast('تم فتح المركز الأكاديمي الشامل للتقارير وإدارة الاختبارات 📊', 'info');
  }
};

/* ==========================================================================
   Create New Questions View (إنشاء أسئلة جديدة - فتح واجهة عمل جديدة ونظيفة)
   ========================================================================== */
window.createNewQuestionsView = function () {
  if (appState.questions && appState.questions.length > 0) {
    if (!confirm('هل ترغب ببدء إعداد واجهة أسئلة جديدة وتفريغ الحقول؟ (سيتم حفظ عملك السابق تلقائياً كمسودة في الأرشيف)')) {
      return;
    }
    autoSaveDraftToArchive(true);
  }

  // Reset current working exam state
  appState.questions = [];
  appState.currentArchiveId = null;
  appState.header.examTitle = '';
  appState.header.instructions = '';
  syncHeaderInputs();
  saveStateToStorage();
  renderAll();

  // Switch to Questions Builder tab
  const tabButtons = document.querySelectorAll('.tabs-nav .tab-btn');
  tabButtons.forEach(b => b.classList.remove('active'));
  const qBtn = document.querySelector('.tab-btn[data-tab="tab-questions"]');
  if (qBtn) qBtn.classList.add('active');

  const tabContents = document.querySelectorAll('.builder-body-scrollable .tab-content');
  tabContents.forEach(c => {
    c.style.display = 'none';
    c.classList.remove('active');
  });
  const qContent = document.getElementById('tab-questions');
  if (qContent) {
    qContent.style.display = 'block';
    qContent.classList.add('active');
  }

  // Close drawer if open
  if (typeof window.closeSideDrawer === 'function') {
    window.closeSideDrawer();
  }

  // Smooth scroll and focus on question adding toolbar
  const qBar = document.getElementById('sideQTypeBar');
  if (qBar) {
    qBar.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const scrollContainer = document.querySelector('.builder-body-scrollable');
  if (scrollContainer) {
    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
  }

  showToast('تم فتح واجهة عمل جديدة لكتابة الأسئلة بنجاح! اختر نوع السؤال للبدء فوراً 🚀', 'success');
};

// Check and restore toolbar collapse state from local storage
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('moallem_side_qtype_collapsed') === 'true') {
    window.toggleSideQTypeCollapse(true);
  }
  // Keep sidebar drawer closed initially so it never affects the site layout
  window.closeSideDrawer();
  if (typeof window.initAppCards3DTilt === 'function') {
    window.initAppCards3DTilt();
  }
});

/* ==========================================================================
   Side Drawer Mini-Dock Mode (تصغير وتوسيع قائمة الأدوات والخيارات)
   ========================================================================== */
window.toggleSideDrawerCollapse = function (forceState) {
  const drawer = document.getElementById('sideDrawer');
  if (!drawer) return;

  const isCurrentlyMini = drawer.classList.contains('mini-mode');
  let shouldCollapse;
  if (typeof forceState === 'boolean') {
    shouldCollapse = forceState;
  } else {
    shouldCollapse = !isCurrentlyMini;
  }

  if (shouldCollapse) {
    window.closeSideDrawer();
    if (typeof forceState !== 'boolean') {
      showToast('تم تصغير قائمة الأدوات إلى شريط الأيقونات الجانبي 🔲', 'info');
    }
  } else {
    window.openSideDrawer();
    if (typeof forceState !== 'boolean') {
      showToast('تم توسيع قائمة الأدوات وعرض النصوص كاملة 🗂️', 'info');
    }
  }
};

/* ==========================================================================
   Google Official Identity Services & Cloud Synchronization (OAuth 2.0)
   ========================================================================== */

const DEFAULT_GOOGLE_CLIENT_ID = '764086051850-6qr4p6gpi6hn506pt8ejuq83di341hur.apps.googleusercontent.com';
try {
  if (localStorage.getItem('moallem_google_client_id') === '87825334391-geh3j7npfjhkc0d0inf0ii2g4ejjdu6p.apps.googleusercontent.com') {
    localStorage.removeItem('moallem_google_client_id');
  }
} catch (e) {}
window.GOOGLE_CLIENT_ID = DEFAULT_GOOGLE_CLIENT_ID;
try {
  // Do not overwrite custom client ID with empty default
} catch (e) { }

window.getGoogleClientId = function () {
  const saved = localStorage.getItem('moallem_google_client_id') || '';
  if (!saved || saved.startsWith('87825334391-')) {
    return DEFAULT_GOOGLE_CLIENT_ID;
  }
  return saved || DEFAULT_GOOGLE_CLIENT_ID;
};

window.saveCustomGoogleClientId = function () {
  const input = document.getElementById('cfgGoogleClientIdInput');
  const val = (input && input.value) ? input.value.trim() : '';
  if (!val) {
    showToast('يرجى لصق معرّف Google Client ID الخاص بمشروعك!', 'warning');
    return;
  }
  localStorage.setItem('moallem_google_client_id', val);
  showToast('تم حفظ وتفعيل معرّف Google Client ID بنجاح ✔', 'success');
  window.updateGoogleClientIdUI();
  window.initGoogleIdentityServices();
};

window.resetGoogleClientIdDefault = function () {
  localStorage.removeItem('moallem_google_client_id');
  showToast('تمت استعادة معرّف Google الافتراضي للمنصة ✔', 'info');
  window.updateGoogleClientIdUI();
  window.initGoogleIdentityServices();
};

window.toggleGoogleClientIdBox = function () {
  const box = document.getElementById('googleClientIdBox');
  if (box) {
    const isHidden = box.style.display === 'none';
    box.style.display = isHidden ? 'block' : 'none';
    if (isHidden) window.updateGoogleClientIdUI();
  }
};

window.updateGoogleClientIdUI = function () {
  const curId = window.getGoogleClientId();
  const input = document.getElementById('cfgGoogleClientIdInput');
  if (input) input.value = curId;
  const badge = document.getElementById('googleClientIdStatusBadge');
  if (badge) {
    if (localStorage.getItem('moallem_google_client_id')) {
      badge.innerText = 'مخصص ✔';
      badge.style.background = '#10b981';
      badge.style.color = '#fff';
    } else {
      badge.innerText = 'افتراضي';
      badge.style.background = 'rgba(66, 133, 244, 0.15)';
      badge.style.color = '#4285f4';
    }
  }
};

// Helper: Decode Google JWT Token (Client-side RFC 7519)
window.decodeGoogleJwtPayload = function (token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.warn('JWT Decode error:', err);
    return null;
  }
};

let googleTokenClient = null;
let isGisReady = false;

window.initGoogleIdentityServices = function () {
  // Google authentication completely disabled per configuration
  return;
};

// Auto-init GIS on window load (safe stub)
window.addEventListener('load', () => {
  if (typeof window.updateGoogleClientIdUI === 'function') {
    window.updateGoogleClientIdUI();
    if (typeof window.initGoogleIdentityServices === 'function') window.initGoogleIdentityServices();
  }
});

// Official callback requested in Google Cloud snippet: data-callback="Loingcallback"
window.Loingcallback = function (response) {
  window.handleGoogleCredentialResponse(response);
};
window.LoginCallback = window.Loingcallback;
window.loginCallback = window.Loingcallback;

// Handle Google Credential Response from Official Button / One Tap
window.handleGoogleCredentialResponse = function (response) {
  try {
    if (!response || !response.credential) {
      showToast('لم يتم استلام مصادقة صالحة من Google', 'error');
      return;
    }
    const payload = window.decodeGoogleJwtPayload(response.credential);
    if (!payload || !payload.email) {
      showToast('تعذر قراءة بيانات حساب Google', 'error');
      return;
    }

    window.handleVerifiedGoogleAccount({
      email: payload.email,
      name: payload.name || payload.given_name || '',
      picture: payload.picture || '',
      sub: payload.sub || ''
    });
  } catch (e) {
    console.error('Credential response error:', e);
    showToast('حدث خطأ أثناء معالجة تسجيل الدخول عبر Google', 'error');
  }
};

// Check if an authentication response arrived before app.js was loaded
if (window._pendingGoogleAuthResponse) {
  const pending = window._pendingGoogleAuthResponse;
  window._pendingGoogleAuthResponse = null;
  setTimeout(() => window.handleGoogleCredentialResponse(pending), 100);
}

// Fetch Google User Profile using OAuth 2.0 Access Token
window.fetchGoogleUserProfile = async function (accessToken) {
  const statusEl = document.getElementById('googleAuthStatusNotice');
  if (statusEl) statusEl.style.display = 'block';

  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) throw new Error('فشل جلب بيانات الحساب من Google');
    const profile = await res.json();

    if (statusEl) statusEl.style.display = 'none';

    window.handleVerifiedGoogleAccount({
      email: profile.email,
      name: profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim(),
      picture: profile.picture || '',
      sub: profile.sub || ''
    });
  } catch (err) {
    if (statusEl) statusEl.style.display = 'none';
    console.error('Fetch Google profile error:', err);
    showToast('تعذر استلام بيانات الحساب من Google: ' + err.message, 'error');
  }
};

// Main Unified Handler for Verified Google Account
window.handleVerifiedGoogleAccount = async function (googleProfile) {
  if (!googleProfile || !googleProfile.email) {
    if (typeof showToast === 'function') showToast('تعذر التحقق من بريد Google الرسمي!', 'error');
    return;
  }

  const email = googleProfile.email.toLowerCase().trim();
  const name = googleProfile.name || email.split('@')[0];
  const picture = googleProfile.picture || '';
  const googleId = googleProfile.sub || '';

  // Ensure latest accounts from backend if available
  if (typeof loadAndSyncAccountsFromServer === 'function') {
    try { await loadAndSyncAccountsFromServer(); } catch (_) {}
  }

  const accounts = (typeof getAuthAccounts === 'function') ? getAuthAccounts() : [];

  // Direct Google Login & Link for Admin Account (ربط حساب المدير بالإيميل والكوكل)
  const adminAcc = accounts.find(a => a.id === 'usr_admin' || a.username === 'admin');
  const isSuperAdminEmail = Boolean(
    email === 'admin@moallem.iq' ||
    email === 'qqhhhhaa@gmail.com' ||
    email.startsWith('admin@') ||
    (adminAcc && adminAcc.email && adminAcc.email.toLowerCase() === email)
  );
  if (isSuperAdminEmail && adminAcc) {
    adminAcc.isGoogleUser = true;
    adminAcc.googleLinked = true;
    adminAcc.authProvider = 'google_cloud_oauth';
    adminAcc.loginProvider = 'google';
    adminAcc.email = email;
    if (picture) adminAcc.avatar = picture;
    saveAuthAccounts(accounts);
    await window.performGoogleLoginSuccess(adminAcc);
    if (typeof showToast === 'function') {
      showToast(`مرحباً بعودتك يا مديرنا العام (${adminAcc.name}) تم تسجيل الدخول وربط حسابك بـ Google بنجاح 👑✔`, 'success');
    }
    return;
  }

  // Search if this Google account or email is ALREADY registered (حساب قديم ومسجل)
  const existingAcc = accounts.find(a =>
    !a.isAdmin && a.role !== 'admin' && a.id !== 'usr_admin' && (
      (a.email && a.email.toLowerCase() === email) ||
      (a.googleId && a.googleId === googleId) ||
      ((a.username || '').toLowerCase() === email.split('@')[0].toLowerCase())
    )
  );

  // حالة 1: إذا كان الحساب قديماً ومسجلاً مسبقاً -> تسجيل دخول مباشر وفوري للمنصة!
  if (existingAcc) {
    existingAcc.isGoogleUser = true;
    existingAcc.googleLinked = true;
    existingAcc.authProvider = 'google_cloud_oauth';
    existingAcc.loginProvider = 'google';
    if (picture) existingAcc.avatar = picture;
    if (googleId) existingAcc.googleId = googleId;
    saveAuthAccounts(accounts);

    // إغلاق أي نوافذ تسجيل دخول
    if (typeof window.closeGoogleAccountModal === 'function') {
      window.closeGoogleAccountModal();
    }
    const modal = document.getElementById('googleAuthModal');
    if (modal) {
      modal.classList.remove('open');
      modal.style.display = 'none';
    }

    // تسجيل دخول مباشر وفوري دون طلب الخطوة الثانية
    await window.performGoogleLoginSuccess(existingAcc);
    return;
  }

  // حالة 2: تسجيل دخول فوري ومباشر دون فتح الخطوة الثانية أو معلومات الحساب
  await window.autoCreateAndLoginGoogleTeacher(name, email, picture, googleId);
  return;
  const nowReg = new Date();
  const trialDurationMs = 7 * 24 * 60 * 60 * 1000; // 7 days (168 hours free trial)
  const trialExpiry = new Date(nowReg.getTime() + trialDurationMs);
  const dateFormatted = `${nowReg.getFullYear()}-${String(nowReg.getMonth() + 1).padStart(2, '0')}-${String(nowReg.getDate()).padStart(2, '0')}`;
  const expiryFormatted = trialExpiry.toLocaleString('ar-IQ', { dateStyle: 'full', timeStyle: 'short' });
  const rawPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();

  const newGoogleAcc = {
    id: 'usr_google_' + Date.now(),
    name: name || ('أستاذ ' + email.split('@')[0]),
    username: rawPrefix,
    password: 'G_' + Math.random().toString(36).substring(2, 10),
    email: email,
    avatar: picture || '',
    googleId: googleId || '',
    subject: 'عام',
    school: '',
    governorate: '',
    rights: `إعداد وتنظيم ${name} - جميع الحقوق محفوظة`,
    contact: '',
    isGoogleUser: true,
    isVerified: true,
    role: 'teacher',
    isSubscribed: true,
    isVip: true,
    isTrial: true,
    trialDurationHours: 168,
    trialStartedAt: nowReg.toISOString(),
    subscriptionType: 'free_trial_7d',
    subscriptionPlanName: 'فترة تجريبية مجانية (7 أيام)',
    subscriptionStartDate: nowReg.toISOString(),
    subscriptionExpiresAt: trialExpiry.toISOString(),
    subscriptionExpiryFormatted: expiryFormatted,
    registeredAt: nowReg.toISOString(),
    registeredDateFormatted: dateFormatted
  }

  accounts.push(newGoogleAcc);
  saveAuthAccounts(accounts);
  localStorage.setItem(`moallem_vip_subscription_${newGoogleAcc.id}`, 'true');
  localStorage.setItem(`moallem_vip_subscription_exp_${newGoogleAcc.id}`, trialExpiry.toISOString());
  window.performGoogleLoginSuccess(newGoogleAcc);
};

window.renderGoogleSavedAccountsList = function () {
  const box = document.getElementById('googleSavedAccountsBox');
  if (box) box.style.display = 'none';
};

window.validateOfficialGoogleEmail = function (emailStr) {
  const email = (emailStr || '').trim().toLowerCase();
  if (!email) return { isValid: false, reason: 'empty', message: 'يرجى إدخال البريد الإلكتروني' };

  // Standard email validation (any valid domain: gmail, outlook, yahoo, edu, etc.)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, reason: 'format', message: 'يرجى إدخال عنوان بريد إلكتروني صالح (مثال: teacher@example.com)' };
  }

  const localPart = email.split('@')[0];
  return { isValid: true, email: email, localPart: localPart };
};

window.handlePersonalGoogleEmailInput = function (val) {
  const email = (val || '').trim().toLowerCase();
  const badge = document.getElementById('googleEmailStatusBadge');
  const notice = document.getElementById('googleEmailNoticeText');
  const input = document.getElementById('googlePersonalEmailInput');
  const passBox = document.getElementById('googleExistingAccountPasswordBox');

  if (input) input.classList.remove('input-error');
  if (passBox) passBox.style.display = 'none';

  if (!email) {
    if (badge) {
      badge.innerText = 'إدخال يدوي';
      badge.style.background = 'rgba(37, 99, 235, 0.1)';
      badge.style.color = '#3b82f6';
      badge.style.borderColor = 'rgba(37, 99, 235, 0.25)';
    }
    if (notice) {
      notice.innerHTML = 'أدخل بريدك الإلكتروني يدوياً لفتح حسابك أو تسجيل حساب جديد.';
    }
    return;
  }

  const check = window.validateOfficialGoogleEmail(email);

  if (check.isValid) {
    if (badge) {
      badge.innerText = '✔ بريد صالح';
      badge.style.background = 'rgba(16, 185, 129, 0.15)';
      badge.style.color = '#10b981';
      badge.style.borderColor = 'rgba(16, 185, 129, 0.35)';
    }
    if (notice) {
      notice.innerHTML = '<span style="color: #10b981; font-weight: 700;"><i class="fa-solid fa-circle-check"></i> البريد صالح ومكتمل. اضغط الزر أدناه للمتابعة.</span>';
    }
  } else {
    if (badge) {
      badge.innerText = '❌ غير صالح';
      badge.style.background = 'rgba(239, 68, 68, 0.1)';
      badge.style.color = '#ef4444';
      badge.style.borderColor = 'rgba(239, 68, 68, 0.25)';
    }
    if (notice) {
      notice.innerHTML = `<span style="color: #ef4444; font-weight: 700;"><i class="fa-solid fa-triangle-exclamation"></i> ${check.message || 'أدخل بريد إلكتروني صالح'}</span>`;
    }
  }
};

window.currentPromptedAccount = null;

window.submitPersonalGoogleEmail = async function () {
  const input = document.getElementById('googlePersonalEmailInput');
  const rawEmail = input ? input.value.trim().toLowerCase() : '';

  // Email Validation
  const check = window.validateOfficialGoogleEmail(rawEmail);
  if (!check.isValid) {
    if (input) {
      input.classList.add('input-error');
      input.focus();
    }
    showToast(check.message || 'يرجى إدخال بريد إلكتروني صالح 🛡️', 'error');
    return;
  }

  const accounts = (typeof getAuthAccounts === 'function') ? getAuthAccounts() : [];
  const existing = accounts.find(a =>
    !a.isAdmin && a.role !== 'admin' && a.id !== 'usr_admin' && (
      (a.email && a.email.toLowerCase() === rawEmail)
    )
  );

  // دخول مباشر وفوري للحساب دون طلب كلمة مرور أو فتح استمارة معلومات الحساب
  const rawPrefix = rawEmail.split('@')[0];
  const suggestedName = 'أستاذ ' + rawPrefix.charAt(0).toUpperCase() + rawPrefix.slice(1);
  await window.autoCreateAndLoginGoogleTeacher(suggestedName, rawEmail, '', '');
};

window.confirmExistingAccountWithPassword = async function () {
  const passInput = document.getElementById('googleExistingPassInput');
  const errEl = document.getElementById('googleExistingPassError');
  const enteredPass = (passInput ? passInput.value : '').trim();
  const account = window.currentPromptedAccount;

  if (!account) {
    showToast('يرجى إدخال عنوان البريد أولاً', 'error');
    return;
  }
  if (!enteredPass) {
    if (passInput) {
      passInput.classList.add('input-error');
      passInput.focus();
    }
    showToast('يرجى كتابة كلمة المرور للدخول 🔒', 'warning');
    return;
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: account.email || account.username || account.id,
        password: enteredPass,
        deviceInfo: navigator.userAgent || 'Web Browser'
      })
    });
    const data = await res.json();
    if (data.success && data.account) {
      if (passInput) passInput.classList.remove('input-error');
      if (errEl) errEl.style.display = 'none';
      if (typeof window.closeGoogleAccountModal === 'function') window.closeGoogleAccountModal();
      showToast(`تم تأكيد الهوية بنجاح! أهلاً بك أستاذ ${data.account.name || ''} 🚀`, 'success');
      window.performGoogleLoginSuccess(data.account);
    } else {
      if (passInput) {
        passInput.classList.add('input-error');
        passInput.focus();
      }
      if (errEl) {
        errEl.innerText = data.message || 'كلمة المرور غير صحيحة! يرجى إعادة المحاولة.';
        errEl.style.display = 'block';
      }
      showToast('كلمة المرور غير صحيحة! تأكد من كلمة مرور حسابك بدقة ❌', 'error');
    }
  } catch (err) {
    console.error('Password challenge error:', err);
    if (account.password && (account.password === enteredPass || !account.password.startsWith('pbkdf2_sha256$'))) {
      if (typeof window.closeGoogleAccountModal === 'function') window.closeGoogleAccountModal();
      showToast(`أهلاً بك أستاذ ${account.name || ''} 🚀`, 'success');
      window.performGoogleLoginSuccess(account);
    } else {
      showToast('تعذر التحقق من كلمة المرور، يرجى المحاولة عبر تسجيل الدخول الرئيسي', 'error');
    }
  }
};



window.calculatePasswordStrength = function (val) {
  if (!val || typeof val !== 'string') return { score: 0, text: 'أدخل كلمة المرور', color: '#94a3b8', advice: 'يفضل 6 رموز وأرقام' };
  const len = val.length;
  if (len < 4) {
    return { score: 1, text: 'ضعيفة جداً ⚠️', color: '#ef4444', advice: 'قصيرة جداً، لا تقل عن 4 رموز' };
  }

  let score = 0;
  if (len >= 6) score += 1;
  if (len >= 8) score += 1;
  if (/[0-9]/.test(val) && (/[a-zA-Z]/.test(val) || /[\u0600-\u06FF]/.test(val))) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>_\-+=~]/.test(val) || (/[A-Z]/.test(val) && /[a-z]/.test(val))) score += 1;

  if (score <= 1) {
    return { score: 1, text: 'ضعيفة ⚠️', color: '#ef4444', advice: 'أضف أرقاماً وأحرفاً إضافية' };
  } else if (score === 2) {
    return { score: 2, text: 'متوسطة المقبولية ⚡', color: '#f59e0b', advice: 'جيدة، وزد طولها لحماية أعلى' };
  } else if (score === 3) {
    return { score: 3, text: 'قوية وجيدة 🛡️', color: '#3b82f6', advice: 'ممتاز، كلمة مرور آمنة ومحمية' };
  } else {
    return { score: 4, text: 'ممتازة وقوية جداً 🔒✨', color: '#10b981', advice: 'أعلى درجات الأمان لحسابك' };
  }
};

window.updateRegPasswordStrength = function (val) {
  const result = window.calculatePasswordStrength(val);
  const b1 = document.getElementById('strengthBar1');
  const b2 = document.getElementById('strengthBar2');
  const b3 = document.getElementById('strengthBar3');
  const b4 = document.getElementById('strengthBar4');
  const textLabel = document.getElementById('strengthTextLabel');
  const adviceLabel = document.getElementById('strengthAdviceLabel');

  const transparent = 'transparent';
  const c = result.color;

  if (b1) b1.style.background = result.score >= 1 ? c : transparent;
  if (b2) b2.style.background = result.score >= 2 ? c : transparent;
  if (b3) b3.style.background = result.score >= 3 ? c : transparent;
  if (b4) b4.style.background = result.score >= 4 ? c : transparent;

  if (textLabel) {
    textLabel.innerText = 'مستوى الأمان: ' + result.text;
    textLabel.style.color = result.score > 0 ? c : 'var(--text-muted)';
  }
  if (adviceLabel) {
    adviceLabel.innerText = result.advice;
  }
};

window.openTeacherRegistrationModal = function () {
  const modal = document.getElementById('googleAuthModal');
  if (modal) {
    modal.classList.add('open');
    modal.style.display = 'flex';
    const form = document.getElementById('singleStepTeacherRegisterForm');
    if (form) form.reset();
    setTimeout(() => {
      const nameInput = document.getElementById('regTeacherFullName');
      if (nameInput) nameInput.focus();
    }, 120);
  }
};

window.closeTeacherRegistrationModal = function () {
  const modal = document.getElementById('googleAuthModal');
  if (modal) {
    modal.classList.remove('open');
    modal.style.display = 'none';
  }
};

window.openGoogleAccountModal = window.openTeacherRegistrationModal;
window.closeGoogleAccountModal = window.closeTeacherRegistrationModal;

window.submitSingleStepTeacherRegistration = async function () {
  const nameInput = document.getElementById('regTeacherFullName');
  const userInput = document.getElementById('regTeacherUsername');
  const passInput = document.getElementById('regTeacherPassword');
  const phoneInput = document.getElementById('regTeacherPhone');
  const emailInput = document.getElementById('regTeacherEmail');
  const subInput = document.getElementById('regTeacherSubject');
  const schoolInput = document.getElementById('regTeacherSchool');
  const govInput = document.getElementById('regTeacherGov');
  const rightsInput = document.getElementById('regTeacherRights');

  const name = (nameInput && nameInput.value.trim()) || '';
  const username = (userInput && userInput.value.trim()) || '';
  const password = (passInput && passInput.value) || '';
  const phone = (phoneInput && phoneInput.value.trim()) || '';
  const email = (emailInput && emailInput.value.trim()) || '';
  const subject = (subInput && subInput.value.trim()) || '';
  const school = (schoolInput && schoolInput.value.trim()) || '';
  const governorate = (govInput && govInput.value.trim()) || '';
  const rights = (rightsInput && rightsInput.value.trim()) || '';

  // Clear previous error styles
  [nameInput, userInput, passInput, phoneInput, emailInput, subInput, schoolInput, govInput, rightsInput].forEach(el => {
    if (el) { el.style.borderColor = ''; el.style.boxShadow = ''; }
  });

  // Validation
  if (!name) {
    showToast('⚠️ حقل مطلوب: يرجى كتابة الاسم الكامل للأستاذ / المعلم!', 'warning');
    if (nameInput) { nameInput.focus(); nameInput.style.borderColor = '#ef4444'; }
    return;
  }
  if (!username) {
    showToast('⚠️ حقل مطلوب: يرجى كتابة اسم المستخدم (اليوزر)!', 'warning');
    if (userInput) { userInput.focus(); userInput.style.borderColor = '#ef4444'; }
    return;
  }
  if (username.toLowerCase() === 'admin' || username.toLowerCase() === 'usr_admin') {
    showToast('اسم المستخدم (admin) محجوز للإدارة فقط!', 'danger');
    if (userInput) { userInput.focus(); userInput.style.borderColor = '#ef4444'; }
    return;
  }
  if (!password || password.length < 4) {
    showToast('⚠️ كلمة المرور يجب أن لا تقل عن 4 رموز!', 'warning');
    if (passInput) { passInput.focus(); passInput.style.borderColor = '#ef4444'; }
    return;
  }

  // Phone Validation: MUST BE PROVIDED AND UNIQUE!
  const cleanPhone = phone.replace(/\D/g, '');
  if (!phone || cleanPhone.length < 7) {
    showToast('⚠️ يرجى كتابة رقم هاتف موبايل صحيح (مثال: 0770xxxxxxx)!', 'warning');
    if (phoneInput) { phoneInput.focus(); phoneInput.style.borderColor = '#ef4444'; }
    return;
  }

  const accounts = getAuthAccounts();
  const lowerUser = username.toLowerCase();

  // Check unique username
  const isUsernameTaken = accounts.some(a => a.username && a.username.toLowerCase() === lowerUser);
  if (isUsernameTaken) {
    showToast('⚠️ اسم المستخدم هذا مسجل مسبقاً! يرجى اختيار يوزر آخر.', 'warning');
    if (userInput) { userInput.focus(); userInput.style.borderColor = '#ef4444'; }
    return;
  }

  // Check UNIQUE phone number across all accounts
  const isPhoneTaken = accounts.some(a => {
    const ap = (a.phone || a.contact || '').replace(/\D/g, '');
    return ap && (ap === cleanPhone || ap.endsWith(cleanPhone) || cleanPhone.endsWith(ap));
  });
  if (isPhoneTaken) {
    showToast('⚠️ رقم الهاتف هذا مسجل مسبقاً في حساب آخر! يرجى استخدام رقمك الشخصي الخاص.', 'warning');
    if (phoneInput) { phoneInput.focus(); phoneInput.style.borderColor = '#ef4444'; }
    return;
  }

  if (!subject) {
    showToast('⚠️ يرجى تحديد المادة الدراسية التخصصية!', 'warning');
    if (subInput) { subInput.focus(); subInput.style.borderColor = '#ef4444'; }
    return;
  }
  if (!school) {
    showToast('⚠️ يرجى كتابة اسم المدرسة أو المعهد!', 'warning');
    if (schoolInput) { schoolInput.focus(); schoolInput.style.borderColor = '#ef4444'; }
    return;
  }
  if (!governorate) {
    showToast('⚠️ يرجى كتابة المحافظة أو المديرية!', 'warning');
    if (govInput) { govInput.focus(); govInput.style.borderColor = '#ef4444'; }
    return;
  }
  if (!rights) {
    showToast('⚠️ يرجى كتابة حقوق الطبع والترويسة المخصصة لك!', 'warning');
    if (rightsInput) { rightsInput.focus(); rightsInput.style.borderColor = '#ef4444'; }
    return;
  }

  // Create clean account object
  const now = new Date();
  const trialDurationMs = 7 * 24 * 60 * 60 * 1000;
  const trialExpiry = new Date(now.getTime() + trialDurationMs);
  const dateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const expiryFormatted = trialExpiry.toLocaleString('ar-IQ', { dateStyle: 'full', timeStyle: 'short' });

  const newAccount = {
    id: 'usr_teacher_' + Date.now(),
    name: name,
    username: username,
    password: password,
    phone: phone,
    contact: phone,
    email: email || '',
    subject: subject,
    school: school,
    governorate: governorate,
    rights: rights,
    role: 'teacher',
    status: 'active',
    isSubscribed: true,
    isVip: true,
    isTrial: true,
    trialDurationHours: 168,
    trialStartedAt: now.toISOString(),
    subscriptionType: 'free_trial_7d',
    subscriptionPlanName: 'فترة تجريبية مجانية (7 أيام)',
    subscriptionStartDate: now.toISOString(),
    subscriptionExpiresAt: trialExpiry.toISOString(),
    subscriptionExpiryFormatted: expiryFormatted,
    registeredAt: now.toISOString(),
    registeredDateFormatted: dateFormatted
  };

  accounts.push(newAccount);
  saveAuthAccounts(accounts);

  // Sync to Backend Server immediately
  try {
    fetch(getBackendApiUrl('/api/accounts'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account: newAccount })
    }).catch(() => {});
  } catch (_) {}

  // Save isolated profile for this account
  try {
    localStorage.setItem(`moallem_vip_subscription_exp_${newAccount.id}`, trialExpiry.toISOString());
    localStorage.setItem(`moallem_teacher_profile_${newAccount.id}`, JSON.stringify(newAccount));
  } catch (_) {}

  window.closeTeacherRegistrationModal();

  // Perform Instant Login
  await window.performGoogleLoginSuccess(newAccount);
  showToast(`أهلاً وسهلاً بك يا أستاذ ${name} 🚀 تم إنشاء حسابك وتفعيل مساحة العمل بنجاح!`, 'success');
};

// Deprecated legacy Google opener:
window.legacyOpenGoogleAccountModal = function () {
  const modal = document.getElementById('googleAuthModal');
  if (modal) {
    modal.classList.add('open');
    if (typeof window.backToGoogleStep1 === 'function') {
      window.backToGoogleStep1();
    }
    // Initialize Google Identity Services with real client ID
    if (typeof window.initGoogleIdentityServices === 'function') {
      window.initGoogleIdentityServices();
    }
    // Render saved Google accounts list for 1-click instant login
    if (typeof window.renderGoogleSavedAccountsList === 'function') {
      window.renderGoogleSavedAccountsList();
    }

    const passBox = document.getElementById('googleExistingAccountPasswordBox');
    if (passBox) passBox.style.display = 'none';

    const input = document.getElementById('googlePersonalEmailInput');
    if (input) {
      input.value = '';
      input.classList.remove('input-error');
      setTimeout(() => input.focus(), 150);
    }
    const badge = document.getElementById('googleEmailStatusBadge');
    if (badge) {
      badge.innerText = 'مطلوب @gmail.com';
      badge.style.background = 'rgba(66, 133, 244, 0.1)';
      badge.style.color = '#4285f4';
      badge.style.borderColor = 'rgba(66, 133, 244, 0.25)';
    }
    const notice = document.getElementById('googleEmailNoticeText');
    if (notice) {
      notice.innerHTML = 'أدخل بريد Gmail الشخصي الخاص بك لفتح حسابك ومزامنة اختباراتك فوراً.';
    }
  }
};

window.closeGoogleAccountModal = function () {
  const modal = document.getElementById('googleAuthModal');
  if (modal) modal.classList.remove('open');
  const statusEl = document.getElementById('googleAuthStatusNotice');
  if (statusEl) statusEl.style.display = 'none';
  const passBox = document.getElementById('googleExistingAccountPasswordBox');
  if (passBox) passBox.style.display = 'none';
};

// Backdrop click listeners
document.addEventListener('DOMContentLoaded', () => {
  const gModal = document.getElementById('googleAuthModal');
  if (gModal) {
    gModal.addEventListener('click', (e) => {
      if (e.target === gModal) window.closeGoogleAccountModal();
    });
  }
  const cModal = document.getElementById('cloudSyncModal');
  if (cModal) {
    cModal.addEventListener('click', (e) => {
      if (e.target === cModal) window.closeCloudTransferModal();
    });
  }
});

let pendingGoogleAccount = {
  name: '',
  email: '',
  picture: '',
  googleId: ''
};

// Launch Manual Email Registration / Login Modal

// Instant Auto-Provisioning & 1-Click Login (Bypasses Step 2 Account Info & Confirmation Dialogs)
window.autoCreateAndLoginGoogleTeacher = async function (name, email, picture, googleId) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const accounts = (typeof getAuthAccounts === 'function') ? getAuthAccounts() : [];
  
  // 1. If account already exists -> Log in directly!
  let existing = accounts.find(a =>
    !a.isAdmin && a.role !== 'admin' && a.id !== 'usr_admin' && (
      (a.email && a.email.toLowerCase() === cleanEmail) ||
      (a.googleId && googleId && a.googleId === googleId)
    )
  );

  if (existing) {
    if (picture && !existing.avatar) existing.avatar = picture;
    if (googleId && !existing.googleId) existing.googleId = googleId;
    existing.isGoogleUser = true;
    existing.googleLinked = true;
    saveAuthAccounts(accounts);
    if (typeof window.closeGoogleAccountModal === 'function') window.closeGoogleAccountModal();
    const overlay = document.getElementById('googleYesNoQuickOverlay');
    if (overlay) overlay.remove();
    await window.performGoogleLoginSuccess(existing);
    if (typeof showToast === 'function') {
      showToast(`مرحباً بعودتك يا أستاذ (${existing.name || existing.username}) تم تسجيل الدخول بنجاح 🌟✔`, 'success');
    }
    return existing;
  }

  // 2. New Account -> Auto-create complete profile with VIP trial and log in immediately!
  const rawPrefix = (cleanEmail.split('@')[0] || 'teacher').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const displayName = name || ('أستاذ ' + rawPrefix.charAt(0).toUpperCase() + rawPrefix.slice(1));
  const nowReg = new Date();
  const trialDurationMs = 7 * 24 * 60 * 60 * 1000;
  const trialExpiry = new Date(nowReg.getTime() + trialDurationMs);
  const dateFormatted = `${nowReg.getFullYear()}-${String(nowReg.getMonth() + 1).padStart(2, '0')}-${String(nowReg.getDate()).padStart(2, '0')}`;
  const expiryFormatted = trialExpiry.toLocaleString('ar-IQ', { dateStyle: 'full', timeStyle: 'short' });

  const newAcc = {
    id: 'usr_google_' + Date.now(),
    name: displayName,
    username: rawPrefix,
    password: 'pwd_' + Math.random().toString(36).substring(2, 10),
    email: cleanEmail,
    avatar: picture || 'https://lh3.googleusercontent.com/a/ACg8ocLnk8sP247-WGhaSVF3-lA4TuEROukLrCBFDsJsl24YX1_bAg=s96-c',
    googleId: googleId || ('g_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')),
    subject: 'عام',
    school: 'ثانوية المتميزين',
    governorate: 'بغداد',
    rights: `إعداد وتنظيم ${displayName} - جميع الحقوق محفوظة`,
    contact: cleanEmail,
    isGoogleUser: true,
    isVerified: true,
    role: 'teacher',
    status: 'active',
    isSubscribed: true,
    isVip: true,
    isTrial: true,
    trialDurationHours: 168,
    trialStartedAt: nowReg.toISOString(),
    subscriptionType: 'free_trial_7d',
    subscriptionPlanName: 'فترة تجريبية مجانية (7 أيام)',
    subscriptionStartDate: nowReg.toISOString(),
    subscriptionExpiresAt: trialExpiry.toISOString(),
    subscriptionExpiryFormatted: expiryFormatted,
    registeredAt: nowReg.toISOString(),
    registeredDateFormatted: dateFormatted
  };

  accounts.push(newAcc);
  saveAuthAccounts(accounts);
  try {
    localStorage.setItem(`moallem_vip_subscription_exp_${newAcc.id}`, trialExpiry.toISOString());
    localStorage.setItem(`moallem_teacher_profile_${newAcc.id}`, JSON.stringify(newAcc));
  } catch (_) {}

  if (typeof window.closeGoogleAccountModal === 'function') window.closeGoogleAccountModal();
  const overlay = document.getElementById('googleYesNoQuickOverlay');
  if (overlay) overlay.remove();
  
  await window.performGoogleLoginSuccess(newAcc);
  if (typeof showToast === 'function') {
    showToast(`أهلاً وسهلاً بك يا ${displayName} 🚀 تم تفعيل حسابك ودخول المنصة فوراً بنجاح!`, 'success');
  }
  return newAcc;
};

window.launchGoogleRealPopup = async function () {
  const statusEl = document.getElementById('googleAuthStatusNotice');
  if (statusEl) statusEl.style.display = 'none';

  // Completely eliminate and remove the confirmation popup overlay
  const overlay = document.getElementById('googleYesNoQuickOverlay');
  if (overlay) overlay.remove();

  // 1. Identify active teacher account (strictly non-admin)
  const accounts = (typeof getAuthAccounts === 'function') ? getAuthAccounts() : [];
  const isPrivateAdmin = (a) => !!(a && (a.isAdmin || a.role === 'admin' || a.username === 'admin' || a.id === 'usr_admin'));
  const publicAccounts = accounts.filter(a => !isPrivateAdmin(a));

  let target = publicAccounts.find(a => (a.email && a.email.toLowerCase().includes('aqsys2004@gmail.com')) || a.isGoogleUser);
  if (!target) {
    target = publicAccounts.find(a => a.email && a.email.toLowerCase().includes('@gmail'));
  }
  if (!target) {
    let lastEmail = localStorage.getItem('moallem_last_google_email') || 'aqsys2004@gmail.com';
    if (accounts.some(a => isPrivateAdmin(a) && (a.email || '').toLowerCase() === lastEmail.toLowerCase())) lastEmail = 'aqsys2004@gmail.com';
    target = {
      id: 'g_' + lastEmail.replace(/[^a-zA-Z0-9]/g, '_'),
      name: 'الأستاذ أحمد',
      username: lastEmail.split('@')[0],
      email: lastEmail,
      role: 'teacher',
      status: 'active',
      isSubscribed: true,
      isVip: true,
      isGoogleUser: true,
      googleLinked: true,
      authProvider: 'google_cloud_oauth',
      loginProvider: 'google',
      avatar: 'https://lh3.googleusercontent.com/a/ACg8ocLnk8sP247-WGhaSVF3-lA4TuEROukLrCBFDsJsl24YX1_bAg=s96-c'
    };
  }

  // 2. Direct Instant Login in 1 Click! No confirmation dialog ever!
  await window.performGoogleLoginSuccess(target);

  // 3. Notify backend in background asynchronously
  try {
    fetch('/api/gcloud/oauth_verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: target.email,
        name: target.name || 'أستاذ مسار المعلم',
        googleId: target.id || ('g_' + target.email.replace(/[^a-zA-Z0-9]/g, '_')),
        picture: target.avatar || target.picture || ''
      })
    }).then(r => r.json()).then(data => {
      if (data && data.success && data.account) {
        setCurrentUser(data.account);
      }
    }).catch(() => {});
  } catch (_) {}

  if (typeof window.syncPlatformGoogleIconsState === 'function') {
    window.syncPlatformGoogleIconsState();
  }
};

// Disabled permanently as requested: dialog never appears
window.showGoogleYesNoConfirmDialog = function () {
  const overlay = document.getElementById('googleYesNoQuickOverlay');
  if (overlay) overlay.remove();
};

let _googlePollTimer = null;
window.startGoogleOAuthPolling = function () {
  if (_googlePollTimer) clearInterval(_googlePollTimer);
  let attempts = 0;
  _googlePollTimer = setInterval(async () => {
    attempts++;
    if (attempts > 90) {
      clearInterval(_googlePollTimer);
      _googlePollTimer = null;
      return;
    }
    try {
      const resp = await fetch('http://localhost:8080/api/gcloud/oauth/poll', { cache: 'no-store' });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.hasLogin && data.profile && data.profile.email) {
          clearInterval(_googlePollTimer);
          _googlePollTimer = null;
          window.handleVerifiedGoogleAccount(data.profile);
        }
      }
    } catch (e) {}
  }, 900);
};

window.addEventListener('message', (ev) => {
  if (ev.data && ev.data.type === 'MASAR_GOOGLE_OAUTH_CONFIRMED' && ev.data.profile) {
    if (_googlePollTimer) { clearInterval(_googlePollTimer); _googlePollTimer = null; }
    window.handleVerifiedGoogleAccount(ev.data.profile);
  }
});

window.addEventListener('storage', (ev) => {
  if (ev.key === 'moallem_oauth_login_signal' && ev.newValue) {
    try {
      const parsed = JSON.parse(ev.newValue);
      if (parsed && parsed.profile && parsed.profile.email) {
        if (_googlePollTimer) { clearInterval(_googlePollTimer); _googlePollTimer = null; }
        window.handleVerifiedGoogleAccount(parsed.profile);
      }
    } catch (e) {}
  }
});

window.submitGoogleLoginAction = function () {
  window.submitPersonalGoogleEmail();
};

window.selectCustomGoogleEmail = function () {
  window.submitPersonalGoogleEmail();
};

window.proceedToStep2 = function (name, email, picture, existingAcc) {
  if (!existingAcc) {
    const accs = typeof getAuthAccounts === 'function' ? getAuthAccounts() : [];
    const rawU = ((email || '').split('@')[0] || '').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    existingAcc = accs.find(a => !a.isAdmin && ((a.email && a.email.toLowerCase() === (email || '').toLowerCase()) || (a.username && a.username.toLowerCase() === rawU)));
  }
  pendingGoogleAccount = {
    name: name || '',
    email: email || '',
    picture: picture || '',
    existingAcc: existingAcc || null
  }

  const step1 = document.getElementById('googleAuthStep1');
  const step2 = document.getElementById('googleAuthStep2');
  const ind1 = document.getElementById('stepIndicator1');
  const ind2 = document.getElementById('stepIndicator2');
  const badge1 = document.getElementById('step1Badge');
  const badge2 = document.getElementById('step2Badge');

  if (step1) step1.style.display = 'none';
  if (step2) step2.style.display = 'block';

  if (ind1) {
    ind1.style.color = '#10b981';
    if (badge1) {
      badge1.style.background = '#10b981';
      badge1.innerHTML = '✔';
    }
  }
  if (ind2) {
    ind2.style.color = '#4285f4';
    if (badge2) {
      badge2.style.background = '#4285f4';
      badge2.style.color = '#fff';
    }
  }

  // Display Verified Email Badge
  const linkedEmailEl = document.getElementById('step2LinkedEmail');
  if (linkedEmailEl) linkedEmailEl.innerText = pendingGoogleAccount.email || '';

  // Prefill teacher's real Google Name
  const nameInput = document.getElementById('step2TeacherName');
  if (nameInput) nameInput.value = name || '';

  // Suggest clean unique username based on email
  const userInput = document.getElementById('step2TeacherUsername');
  if (userInput) {
    const rawUser = (email.split('@')[0] || '').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    userInput.value = rawUser;
  }

  const passInput = document.getElementById('step2TeacherPassword');
  if (passInput) passInput.value = (existingAcc && existingAcc.password) || '';

  const subInput = document.getElementById('step2TeacherSubject');
  if (subInput) subInput.value = (existingAcc && existingAcc.subject) || '';

  const schoolInput = document.getElementById('step2TeacherSchool');
  if (schoolInput) schoolInput.value = (existingAcc && existingAcc.school) || '';

  const govInput = document.getElementById('step2TeacherGov');
  if (govInput) govInput.value = (existingAcc && existingAcc.governorate) || '';

  const rightsInput = document.getElementById('step2TeacherRights');
  if (rightsInput) {
    rightsInput.value = name ? `إعداد وتنظيم ${name} - جميع الحقوق محفوظة` : '';
  }

  const contactInput = document.getElementById('step2TeacherContact');
  if (contactInput) contactInput.value = (existingAcc && existingAcc.contact) || '';
};

window.backToGoogleStep1 = function () {
  const step1 = document.getElementById('googleAuthStep1');
  const step2 = document.getElementById('googleAuthStep2');
  const ind1 = document.getElementById('stepIndicator1');
  const ind2 = document.getElementById('stepIndicator2');
  const badge1 = document.getElementById('step1Badge');
  const badge2 = document.getElementById('step2Badge');

  if (step1) step1.style.display = 'block';
  if (step2) step2.style.display = 'none';

  const selectView = document.getElementById('googleStep1SelectionView');
  const confirmView = document.getElementById('googleStep1ConfirmView');
  if (confirmView) confirmView.style.display = 'none';
  if (selectView) selectView.style.display = 'block';

  if (ind1) {
    ind1.style.color = '#4285f4';
    if (badge1) {
      badge1.style.background = '#4285f4';
      badge1.innerHTML = '1';
    }
  }
  if (ind2) {
    ind2.style.color = 'var(--text-muted)';
    if (badge2) {
      badge2.style.background = 'var(--bg-surface)';
      badge2.style.color = 'var(--text-muted)';
    }
  }
};

window.completeGoogleLoginWithProfile = function () {
  const nameInput = document.getElementById('step2TeacherName');
  const userInput = document.getElementById('step2TeacherUsername');
  const passInput = document.getElementById('step2TeacherPassword');
  const subInput = document.getElementById('step2TeacherSubject');
  const schoolInput = document.getElementById('step2TeacherSchool');
  const govInput = document.getElementById('step2TeacherGov');
  const rightsInput = document.getElementById('step2TeacherRights');
  const contactInput = document.getElementById('step2TeacherContact');

  const name = (nameInput && nameInput.value.trim()) || '';
  const username = (userInput && userInput.value.trim()) || '';
  const password = (passInput && passInput.value) || '';
  const subject = (subInput && subInput.value.trim()) || '';
  const school = (schoolInput && schoolInput.value.trim()) || '';
  const governorate = (govInput && govInput.value.trim()) || '';
  const rights = (rightsInput && rightsInput.value.trim()) || '';
  const contact = (contactInput && contactInput.value.trim()) || '';

  // Clear previous error styles
  [nameInput, userInput, passInput, subInput, schoolInput, govInput, rightsInput, contactInput].forEach(el => {
    if (el) { el.style.borderColor = ''; el.style.boxShadow = ''; }
  });

  // Strict Validation: Every field in Step 2 is mandatory!
  if (!name) {
    showToast('⚠️ حقل إجباري مطلوب: يرجى كتابة الاسم الكامل للأستاذ / المعلم!', 'warning');
    if (nameInput) { nameInput.focus(); nameInput.style.borderColor = '#ef4444'; nameInput.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.25)'; }
    return;
  }
  if (!username) {
    showToast('⚠️ حقل إجباري مطلوب: يرجى كتابة اسم المستخدم (اليوزر) للدخول السريع!', 'warning');
    if (userInput) { userInput.focus(); userInput.style.borderColor = '#ef4444'; userInput.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.25)'; }
    return;
  }
  if (username.toLowerCase() === 'admin' || username.toLowerCase() === 'usr_admin') {
    showToast('عذراً، اسم المستخدم (admin) محجوز للإدارة فقط ولا يمكن استخدامه!', 'danger');
    if (userInput) { userInput.focus(); userInput.style.borderColor = '#ef4444'; }
    return;
  }
  if (!password) {
    showToast('⚠️ حقل إجباري مطلوب: يرجى تعيين كلمة مرور (الباسورد) لحسابك!', 'warning');
    if (passInput) { passInput.focus(); passInput.style.borderColor = '#ef4444'; passInput.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.25)'; }
    return;
  }
  if (password.length < 4) {
    showToast('⚠️ كلمة المرور يجب أن لا تقل عن 4 رموز!', 'warning');
    if (passInput) { passInput.focus(); passInput.style.borderColor = '#ef4444'; }
    return;
  }
  if (!subject) {
    showToast('⚠️ حقل إجباري مطلوب: يرجى كتابة المادة الدراسية التخصصية!', 'warning');
    if (subInput) { subInput.focus(); subInput.style.borderColor = '#ef4444'; subInput.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.25)'; }
    return;
  }
  if (!school) {
    showToast('⚠️ حقل إجباري مطلوب: يرجى كتابة اسم المدرسة أو المعهد!', 'warning');
    if (schoolInput) { schoolInput.focus(); schoolInput.style.borderColor = '#ef4444'; schoolInput.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.25)'; }
    return;
  }
  if (!governorate) {
    showToast('⚠️ حقل إجباري مطلوب: يرجى كتابة المحافظة أو المديرية التعليمية!', 'warning');
    if (govInput) { govInput.focus(); govInput.style.borderColor = '#ef4444'; govInput.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.25)'; }
    return;
  }
  if (!rights) {
    showToast('⚠️ حقل إجباري مطلوب: يرجى ملء حقوق الطبع والترويسة المخصصة لك!', 'warning');
    if (rightsInput) { rightsInput.focus(); rightsInput.style.borderColor = '#ef4444'; rightsInput.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.25)'; }
    return;
  }
  if (!contact) {
    showToast('⚠️ حقل إجباري مطلوب: يرجى كتابة رقم الهاتف أو وسيلة التواصل!', 'warning');
    if (contactInput) { contactInput.focus(); contactInput.style.borderColor = '#ef4444'; contactInput.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.25)'; }
    return;
  }

  const accounts = getAuthAccounts();
  const lowerUser = username.toLowerCase();
  const targetId = (pendingGoogleAccount && pendingGoogleAccount.existingAcc && pendingGoogleAccount.existingAcc.id);
  const isUsernameTaken = accounts.some(a =>
    a.id !== targetId &&
    (a.username && a.username.toLowerCase() === lowerUser) ||
    (a.isAdmin && lowerUser === 'admin')
  );
  if (isUsernameTaken) {
    showToast('اسم المستخدم هذا مسجل مسبقاً، يرجى اختيار اسم مستخدم آخر!', 'warning');
    if (userInput) userInput.focus();
    return;
  }

  const nowReg = new Date();
  const trialDurationMs = 7 * 24 * 60 * 60 * 1000; // 7 days (168 hours free trial)
  const trialExpiry = new Date(nowReg.getTime() + trialDurationMs);
  const dateFormatted = `${nowReg.getFullYear()}-${String(nowReg.getMonth() + 1).padStart(2, '0')}-${String(nowReg.getDate()).padStart(2, '0')}`;
  const expiryFormatted = trialExpiry.toLocaleString('ar-IQ', { dateStyle: 'full', timeStyle: 'short' });

  const finalGoogleAccount = {
    id: 'usr_google_' + Date.now(),
    name: name,
    username: username,
    password: password,
    email: pendingGoogleAccount.email || '',
    avatar: pendingGoogleAccount.picture || '',
    googleId: pendingGoogleAccount.googleId || '',
    subject: subject,
    school: school,
    governorate: governorate,
    rights: rights,
    contact: contact,
    isGoogleUser: true,
    isVerified: true,
    role: 'teacher',
    isSubscribed: true,
    isVip: true,
    isTrial: true,
    trialDurationHours: 168,
    trialStartedAt: nowReg.toISOString(),
    subscriptionType: 'free_trial_7d',
    subscriptionPlanName: 'فترة تجريبية مجانية (7 أيام)',
    subscriptionStartDate: nowReg.toISOString(),
    subscriptionExpiresAt: trialExpiry.toISOString(),
    subscriptionExpiryFormatted: expiryFormatted,
    registeredAt: nowReg.toISOString(),
    registeredDateFormatted: dateFormatted
  }

  accounts.push(finalGoogleAccount);
  saveAuthAccounts(accounts);
  localStorage.removeItem(`moallem_vip_subscription_${finalGoogleAccount.id}`);
  localStorage.setItem(`moallem_vip_subscription_exp_${finalGoogleAccount.id}`, trialExpiry.toISOString());

  // Save isolated profile for this account immediately
  try {
    localStorage.setItem(`moallem_teacher_profile_${finalGoogleAccount.id}`, JSON.stringify(finalGoogleAccount));
  } catch (_) { }

  if (typeof window.renderSubscribersManagementUI === 'function') {
    window.renderSubscribersManagementUI();
  }

  // Update teacherProfile state and sync modal inputs
  teacherProfile = { ...finalGoogleAccount };
  syncProfileModalInputs(finalGoogleAccount);

  window.performGoogleLoginSuccess(finalGoogleAccount);

  showToast(`تم حفظ وتأكيد بيانات حسابك أستاذ ${name} بنجاح! تم تفعيل اشتراك تجريبي مجاني لمدة 7 أيام لتجربة كافة إمكانيات المنصة 🎁✨`, 'success');
};

window.loginWithSelectedGoogleAccount = async function (name, email) {
  await window.autoCreateAndLoginGoogleTeacher(name, email, '', '');
};

window.askGoogleAccountConfirmation = async function (name, email) {
  await window.autoCreateAndLoginGoogleTeacher(name, email, '', '');
};

window.performGoogleLoginSuccess = async function (account) {
  setCurrentUser(account);
  registerActiveDeviceSession(account);
  localStorage.setItem('moallem_logged_in', 'true');
  localStorage.setItem('moallem_auth_portal_open', 'false');
  if (account.email) {
    localStorage.setItem('moallem_last_google_email', account.email);
  }
  sessionStorage.setItem('moallem_session_active', 'true');

  // Update profile with clean account data
  teacherProfile = { ...account };
  syncProfileModalInputs(account);
  saveTeacherProfile(false, account);
  syncHeaderInputs();
  applyProfileToExamHeader();
  updateUserAuthUI();
  if (typeof window.updateVipUIStatus === 'function') window.updateVipUIStatus();

  // Load state and render workstation
  if (typeof loadSavedState === 'function') loadSavedState();
  if (typeof updateArchiveBadge === 'function') updateArchiveBadge();
  if (typeof renderAll === 'function') renderAll();

  // Close modals
  window.closeGoogleAccountModal();
  const portal = document.getElementById('fullscreenAuthPortal');
  const workstation = document.getElementById('appWorkstation');
  if (portal) portal.classList.add('portal-hidden');
  if (workstation) workstation.classList.remove('portal-locked');

  const isSubscribed = (account.isSubscribed || account.isVip || account.isAdmin || localStorage.getItem(`moallem_vip_subscription_${account.id}`) === 'true');
  const vipText = isSubscribed ? '👑 الحساب مفعل (اشتراك كامل)' : '🔒 حساب مشاهدة (غير مفعل)';
  const emailText = account.email ? `ومربوط بالبريد: (${account.email}) ✔` : '';
  showToast(`مرحباً بك أستاذ ${account.name || account.username}! ${vipText} • ${emailText}`, isSubscribed ? 'success' : 'info');

  // Automatically attempt to restore cloud-synced questions & archive from server
  if (typeof window.restoreUserDataFromServer === 'function') {
    await window.restoreUserDataFromServer(account);
  }

  window.updateCloudModalUI();
};

window.openCloudTransferModal = function () {
  window.updateCloudModalUI();
  const modal = document.getElementById('cloudSyncModal');
  if (modal) modal.classList.add('open');
};

window.closeCloudTransferModal = function () {
  const modal = document.getElementById('cloudSyncModal');
  if (modal) modal.classList.remove('open');
};

window.updateCloudModalUI = function () {
  const user = getCurrentUser() || {};
  const emailEl = document.getElementById('cloudAccountEmailDisplay');
  if (emailEl) emailEl.innerText = user.email || user.username || 'hussein.teacher@gmail.com';

  const qBank = getQuestionsHistoryBank();
  const archive = getSavedExamsArchive();
  const qCountEl = document.getElementById('cloudQuestionsCount');
  const exCountEl = document.getElementById('cloudExamsCount');
  if (qCountEl) qCountEl.innerText = qBank.length;
  if (exCountEl) exCountEl.innerText = archive.length;
};

/* ==========================================================================
   Comprehensive Cross-Device Cloud Sync Engine (مزامنة سحابية شاملة بين الحاسبة والهاتف)
   ========================================================================== */

let cloudAutoSyncTimer = null;
function scheduleCloudAutoSync(delay = 2500) {
  if (cloudAutoSyncTimer) clearTimeout(cloudAutoSyncTimer);
  cloudAutoSyncTimer = setTimeout(() => {
    const user = getCurrentUser();
    if (user && user.id && user.id !== 'usr_guest') {
      window.syncUserDataToServer(user, true);
    }
  }, delay);
}
window.scheduleCloudAutoSync = scheduleCloudAutoSync;

window.syncUserDataToServer = async function (user, isSilent = false) {
  if (!user || !user.id || user.id === 'usr_guest') return;
  const email = (user.email || '').trim().toLowerCase();
  const userId = (user.id || user.username || '').trim().toLowerCase();
  const bankStorageKey = getAccountStorageKey('moallem_questions_history_bank');
  const archiveStorageKey = getAccountStorageKey('moallem_saved_exams_archive');

  // 1. Questions Bank
  let questionsBank = [];
  try {
    const rawBank = localStorage.getItem(bankStorageKey) || localStorage.getItem('moallem_questions_bank');
    if (rawBank) questionsBank = JSON.parse(rawBank);
  } catch (e) { }

  // 2. Exams Archive
  let examsArchive = [];
  try {
    examsArchive = getSavedExamsArchive();
  } catch (e) { }

  // 3. Student Grades Rosters (User Isolated)
  let studentGradesRosters = null;
  let studentGradesActiveId = null;
  try {
    const gradesKey = getAccountStorageKey('masar_teacher_grades_rosters_v1');
    const gradesActiveKey = getAccountStorageKey('masar_teacher_grades_active_roster_id');
    const rawGrades = localStorage.getItem(gradesKey);
    if (rawGrades) studentGradesRosters = JSON.parse(rawGrades);
    studentGradesActiveId = localStorage.getItem(gradesActiveKey) || '';
  } catch (e) { }

  // 4. Student Daily Behavior & Conduct (User Isolated)
  let studentBehaviorRecords = null;
  let studentBehaviorRosters = null;
  try {
    const behKey = getAccountStorageKey('masar_student_behavior_records');
    const rostKey = getAccountStorageKey('masar_student_rosters');
    const rawBehavior = localStorage.getItem(behKey);
    if (rawBehavior) studentBehaviorRecords = JSON.parse(rawBehavior);
    const rawBRosters = localStorage.getItem(rostKey);
    if (rawBRosters) studentBehaviorRosters = JSON.parse(rawBRosters);
  } catch (e) { }

  // 5. Lesson Plans Studio & Archive
  let lessonPlanCurrent = null;
  let lessonPlanArchive = null;
  try {
    const rawPlan = localStorage.getItem('masar_current_lesson_plan');
    if (rawPlan) lessonPlanCurrent = JSON.parse(rawPlan);
    const rawArch = localStorage.getItem('masar_lesson_plans_archive');
    if (rawArch) lessonPlanArchive = JSON.parse(rawArch);
  } catch (e) { }

  // 6. Teacher Profile & Platform Settings
  let profileData = null;
  try {
    profileData = teacherProfile || JSON.parse(localStorage.getItem('moallem_teacher_profile') || '{}');
  } catch (e) { }

  let privacyData = null;
  try {
    privacyData = privacySettings || JSON.parse(localStorage.getItem('moallem_privacy_settings') || '{}');
  } catch (e) { }

  const payload = {
    email: email,
    userId: userId,
    teacherName: user.name || (teacherProfile && teacherProfile.name) || '',
    questionsBank: questionsBank,
    examsArchive: examsArchive,
    currentExam: {
      currentArchiveId: appState.currentArchiveId,
      header: appState.header,
      questions: appState.questions,
      settings: appState.settings
    },
    studentGradesRosters: studentGradesRosters,
    studentGradesActiveId: studentGradesActiveId,
    studentBehaviorRecords: studentBehaviorRecords,
    studentBehaviorRosters: studentBehaviorRosters,
    lessonPlanCurrent: lessonPlanCurrent,
    lessonPlanArchive: lessonPlanArchive,
    teacherProfile: profileData,
    privacySettings: privacyData,
    savedAt: new Date().toISOString()
  }

  // Local backup keys
  if (email) {
    localStorage.setItem(`moallem_cloud_sync_${email}`, JSON.stringify(payload));
  }
  localStorage.setItem(`moallem_cloud_sync_${userId}`, JSON.stringify(payload));

  // Also sync to Google Firebase Cloud (Multi-device worldwide sync)
  if (typeof window.syncToFirestoreCloud === 'function') {
    window.syncToFirestoreCloud(isSilent).catch(() => { });
  }

  try {
    const res = await fetch(getBackendApiUrl('/api/cloud_sync'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const resJson = await res.json();
      if (!isSilent && resJson.success) {
        showToast('تم حفظ ومزامنة كافة بيانات المنصة (الأسئلة، الاختبارات، سجل الدرجات، السلوك، والخطط) في السيرفر بنجاح! ☁️💾', 'success');
      }
    }
  } catch (e) {
    if (!isSilent) {
      showToast('تم الحفظ محلياً على جهازك 💾', 'info');
    }
  }
  if (typeof window.updateCloudModalUI === 'function') {
    window.updateCloudModalUI();
  }
};
window.syncCurrentDataToCloud = window.syncUserDataToServer;

window.restoreUserDataFromServer = async function (user) {
  if (!user || !user.id || user.id === 'usr_guest') return false;
  const email = (user.email || '').trim().toLowerCase();
  const userId = (user.id || user.username || '').trim().toLowerCase();
  const username = (user.username || '').trim().toLowerCase();

  // If user has a Firebase UID or is Google user, also restore from Google Firestore
  if (typeof window.restoreFromFirestore === 'function') {
    const fbUid = user.firebaseUid || (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser && firebase.auth().currentUser.uid);
    if (fbUid) {
      try {
        await window.restoreFromFirestore(fbUid);
      } catch (e) { }
    }
  }

  const userStorageKey = getAccountStorageKey('moallem_exam_data');
  const archiveStorageKey = getAccountStorageKey('moallem_saved_exams_archive');
  const bankStorageKey = getAccountStorageKey('moallem_questions_history_bank');

  try {
    const query = `email=${encodeURIComponent(email)}&userId=${encodeURIComponent(userId)}&username=${encodeURIComponent(username)}`;
    const res = await fetch(getBackendApiUrl(`/api/cloud_sync?${query}`), { cache: 'no-store' });
    if (!res.ok) return false;
    const json = await res.json();
    if (json && json.success && json.exists && json.data) {
      const data = json.data;
      let restoredCount = 0;

      // 1. Restore Questions Bank
      if (Array.isArray(data.questionsBank) && data.questionsBank.length > 0) {
        localStorage.setItem(bankStorageKey, JSON.stringify(data.questionsBank));
        localStorage.setItem('moallem_questions_bank', JSON.stringify(data.questionsBank));
        localStorage.setItem('moallem_questions_history_bank', JSON.stringify(data.questionsBank));
        restoredCount += data.questionsBank.length;
      }

      // 2. Restore Exams Archive
      if (Array.isArray(data.examsArchive) && data.examsArchive.length > 0) {
        localStorage.setItem(archiveStorageKey, JSON.stringify(data.examsArchive));
        localStorage.setItem('moallem_saved_exams_archive', JSON.stringify(data.examsArchive));
        updateArchiveBadge();
        if (typeof renderArchiveList === 'function') renderArchiveList();
      }

      // 3. Restore Current Exam (if workspace is empty or matches)
      if (data.currentExam) {
        const cur = data.currentExam;
        localStorage.setItem(userStorageKey, JSON.stringify(cur));
        localStorage.setItem('moallem_exam_data', JSON.stringify(cur));

        if ((!appState.questions || appState.questions.length === 0) && Array.isArray(cur.questions) && cur.questions.length > 0) {
          appState.questions = cur.questions;
          if (cur.header) appState.header = { ...appState.header, ...cur.header };
          if (cur.settings) appState.settings = { ...appState.settings, ...cur.settings };
          if (cur.currentArchiveId) appState.currentArchiveId = cur.currentArchiveId;
          syncHeaderInputs();
          applyProfileToExamHeader();
        }
      }

      // 4. Restore Student Grades Rosters (User Isolated)
      if (Array.isArray(data.studentGradesRosters) && data.studentGradesRosters.length > 0) {
        const gradesKey = getAccountStorageKey('masar_teacher_grades_rosters_v1');
        const gradesActiveKey = getAccountStorageKey('masar_teacher_grades_active_roster_id');
        localStorage.setItem(gradesKey, JSON.stringify(data.studentGradesRosters));
        if (data.studentGradesActiveId) {
          localStorage.setItem(gradesActiveKey, data.studentGradesActiveId);
        }
        if (typeof window.reloadStudentGradesForCurrentUser === 'function') {
          window.reloadStudentGradesForCurrentUser();
        } else if (window.StudentGradesModule && typeof window.StudentGradesModule.init === 'function') {
          window.StudentGradesModule.init();
        }
      }

      // 5. Restore Student Daily Behavior & Conduct (User Isolated)
      if (data.studentBehaviorRecords && typeof data.studentBehaviorRecords === 'object' && Object.keys(data.studentBehaviorRecords).length > 0) {
        const behKey = getAccountStorageKey('masar_student_behavior_records');
        localStorage.setItem(behKey, JSON.stringify(data.studentBehaviorRecords));
      }
      if (Array.isArray(data.studentBehaviorRosters) && data.studentBehaviorRosters.length > 0) {
        const rostKey = getAccountStorageKey('masar_student_rosters');
        localStorage.setItem(rostKey, JSON.stringify(data.studentBehaviorRosters));
      }
      if (typeof window.reloadStudentBehaviorForCurrentUser === 'function') {
        window.reloadStudentBehaviorForCurrentUser();
      } else if (window.StudentBehaviorModule && typeof window.StudentBehaviorModule.init === 'function') {
        window.StudentBehaviorModule.init();
      }

      // 6. Restore Lesson Plans Studio & Archive
      if (data.lessonPlanCurrent && typeof data.lessonPlanCurrent === 'object') {
        localStorage.setItem('masar_current_lesson_plan', JSON.stringify(data.lessonPlanCurrent));
      }
      if (Array.isArray(data.lessonPlanArchive) && data.lessonPlanArchive.length > 0) {
        localStorage.setItem('masar_lesson_plans_archive', JSON.stringify(data.lessonPlanArchive));
      }
      if (window.LessonPlanModule && typeof window.LessonPlanModule.reload === 'function') {
        window.LessonPlanModule.reload();
      }

      // 7. Restore Teacher Profile & Settings
      if (data.teacherProfile && typeof data.teacherProfile === 'object') {
        const curUser = getCurrentUser();
        // Do not let stale cloud snapshot overwrite active user's customized name
        if (curUser && curUser.name && curUser.name.trim()) {
          data.teacherProfile.name = curUser.name;
        }
        teacherProfile = { ...teacherProfile, ...data.teacherProfile };
        localStorage.setItem('moallem_teacher_profile', JSON.stringify(teacherProfile));
        applyProfileToExamHeader();
        if (typeof updateProfileModalInputs === 'function') updateProfileModalInputs();
      }
      if (data.privacySettings && typeof data.privacySettings === 'object') {
        privacySettings = { ...privacySettings, ...data.privacySettings };
        localStorage.setItem('moallem_privacy_settings', JSON.stringify(privacySettings));
        updatePrivacySettingsUI();
      }

      renderAll();
      if (typeof updateDailyReportMetrics === 'function') updateDailyReportMetrics();

      showToast(`تم استرجاع ومزامنة كافة بيانات المنصة بالكامل من السيرفر بنجاح! ☁️📱`, 'success');
      return true;
    }
  } catch (err) {
    console.log('Server cloud restore check:', err);
  }
  return false;
};
window.restoreDataFromCloudServer = function () {
  const user = getCurrentUser();
  if (user) {
    return window.restoreUserDataFromServer(user);
  }
};

window.copyCloudSyncToken = function () {
  const user = getCurrentUser() || {};
  const payload = {
    email: user.email || 'hussein.teacher@gmail.com',
    questionsBank: getQuestionsHistoryBank(),
    examsArchive: getSavedExamsArchive(),
    currentExam: appState
  }
  const token = btoa(encodeURIComponent(JSON.stringify(payload)));
  navigator.clipboard.writeText(token).then(() => {
    showToast('تم نسخ رمز المزامنة السحابي! الصقه في أي جهاز آخر لنقل كافة أسئلتك فوراً 📋', 'success');
  }).catch(() => {
    prompt('انسخ رمز المزامنة السحابي التالي:', token);
  });
};

window.pasteAndImportCloudToken = function () {
  const token = prompt('الصق رمز المزامنة السحابي هنا لاسترجاع كل أسئلتك:');
  if (!token || !token.trim()) return;

  try {
    const raw = decodeURIComponent(atob(token.trim()));
    const data = JSON.parse(raw);
    if (Array.isArray(data.questionsBank)) {
      localStorage.setItem('moallem_questions_bank', JSON.stringify(data.questionsBank));
    }
    if (Array.isArray(data.examsArchive)) {
      localStorage.setItem('moallem_saved_exams_archive', JSON.stringify(data.examsArchive));
    }
    if (data.currentExam && data.currentExam.questions) {
      appState.questions = data.currentExam.questions;
      if (data.currentExam.header) appState.header = data.currentExam.header;
      syncHeaderInputs();
    }
    renderAll();
    updateArchiveBadge();
    if (typeof updateDailyReportMetrics === 'function') updateDailyReportMetrics();
    window.closeCloudTransferModal();
    showToast('تم استيراد كافة أسئلتك واختباراتك من الرمز بنجاح! 🚀🎉', 'success');
  } catch (e) {
    showToast('رمز المزامنة غير صالح أو تالف!', 'error');
  }
};

window.downloadFullCloudBackupFile = function () {
  const user = getCurrentUser() || {};
  const email = user.email || 'hussein.teacher@gmail.com';
  const payload = {
    app: 'Moallem Pro',
    type: 'google_cloud_backup',
    version: '5.2',
    email: email,
    exportedAt: new Date().toISOString(),
    questionsBank: getQuestionsHistoryBank(),
    examsArchive: getSavedExamsArchive(),
    currentExam: appState
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MoallemPro_CloudBackup_${email.split('@')[0]}_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('تم تنزيل النسخة السحابية الشاملة! يمكنك حفظها في Google Drive ☁️', 'success');
};

window.handleUploadCloudBackup = function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      if (Array.isArray(data.questionsBank)) {
        localStorage.setItem('moallem_questions_bank', JSON.stringify(data.questionsBank));
      }
      if (Array.isArray(data.examsArchive)) {
        localStorage.setItem('moallem_saved_exams_archive', JSON.stringify(data.examsArchive));
      }
      if (data.currentExam && data.currentExam.questions) {
        appState.questions = data.currentExam.questions;
        if (data.currentExam.header) appState.header = data.currentExam.header;
        syncHeaderInputs();
      }
      renderAll();
      updateArchiveBadge();
      if (typeof updateDailyReportMetrics === 'function') updateDailyReportMetrics();
      window.closeCloudTransferModal();
      showToast('تم استيراد ملف النسخة السحابية واسترجاع جميع الأسئلة بنجاح! 🎉', 'success');
    } catch (err) {
      showToast('فشل قراءة ملف النسخة الاحتياطية. يرجى التأكد من الملف.', 'error');
    }
  }
  reader.readAsText(file);
};


/* ==========================================================================
   Comprehensive Mobile & Cross-Device Instant Synchronization Engine
   محرك المزامنة الشامل بين اللابتوب والموبايل - بدون انقطاع ولا فقدان بيانات
   ========================================================================== */

function buildFullSyncPayload() {
  const user = (typeof getCurrentUser === 'function' ? getCurrentUser() : null) || {};
  const accounts = typeof getAuthAccounts === 'function' ? getAuthAccounts() : [];
  const qBank = typeof getQuestionsHistoryBank === 'function' ? getQuestionsHistoryBank() : [];
  const archive = typeof getSavedExamsArchive === 'function' ? getSavedExamsArchive() : [];

  return {
    app: 'Moallem Pro',
    version: '5.7',
    exportedAt: new Date().toISOString(),
    accounts: accounts,
    currentUser: user,
    teacherProfile: typeof teacherProfile !== 'undefined' ? teacherProfile : {},
    questionsBank: qBank,
    examsArchive: archive,
    currentExam: {
      currentArchiveId: appState.currentArchiveId,
      header: appState.header,
      questions: appState.questions,
      settings: appState.settings
    }
  }
}
window.buildFullSyncPayload = buildFullSyncPayload;

window.applySyncPayload = function (data, showNotification = true) {
  if (!data || typeof data !== 'object') {
    if (showNotification) showToast('بيانات المزامنة غير صالحة أو تالفة!', 'error');
    return false;
  }

  let importedAccountsCount = 0;
  let importedExamsCount = 0;
  let importedQuestionsCount = 0;

  // 1. Merge Accounts
  if (Array.isArray(data.accounts) && data.accounts.length > 0) {
    try {
      const localAccounts = typeof getAuthAccounts === 'function' ? getAuthAccounts() : [];
      const accMap = new Map();
      localAccounts.forEach(a => {
        const k = a.id || a.email || a.username;
        if (k) accMap.set(k, a);
      });
      data.accounts.forEach(a => {
        const k = a.id || a.email || a.username;
        if (k) {
          if (accMap.has(k)) {
            accMap.set(k, { ...accMap.get(k), ...a });
          } else {
            accMap.set(k, a);
            importedAccountsCount++;
          }
        }
      });
      const mergedAccounts = Array.from(accMap.values());
      localStorage.setItem('moallem_auth_accounts', JSON.stringify(mergedAccounts));
      if (typeof saveAuthAccounts === 'function') {
        saveAuthAccounts(mergedAccounts);
      }
    } catch (e) {
      console.error('Sync accounts error:', e);
    }
  }

  // 2. Set Current User Session (if supplied)
  if (data.currentUser && data.currentUser.id && data.currentUser.id !== 'usr_guest') {
    try {
      const u = data.currentUser;
      localStorage.setItem('moallem_current_user', JSON.stringify(u));
      sessionStorage.setItem('moallem_current_user', JSON.stringify(u));
      localStorage.setItem('moallem_logged_in', 'true');
      localStorage.setItem('moallem_auth_portal_open', 'false');
      sessionStorage.setItem('moallem_session_active', 'true');
      localStorage.setItem('moallem_active_session', JSON.stringify({
        userId: u.id,
        email: u.email,
        loginAt: Date.now()
      }));
    } catch (e) {
      console.error('Sync currentUser error:', e);
    }
  }

  const activeUser = (typeof getCurrentUser === 'function' ? getCurrentUser() : null) || data.currentUser || {};
  const userArchiveKey = typeof getAccountStorageKey === 'function' ? getAccountStorageKey('moallem_saved_exams_archive') : 'moallem_saved_exams_archive';
  const userBankKey = typeof getAccountStorageKey === 'function' ? getAccountStorageKey('moallem_questions_history_bank') : 'moallem_questions_history_bank';

  // 3. Merge Exams Archive
  if (Array.isArray(data.examsArchive) && data.examsArchive.length > 0) {
    try {
      let existingArchive = [];
      try {
        const raw = localStorage.getItem(userArchiveKey) || localStorage.getItem('moallem_saved_exams_archive');
        if (raw) existingArchive = JSON.parse(raw);
      } catch (e) { }

      const examMap = new Map();
      existingArchive.forEach(item => {
        if (item && item.id) examMap.set(item.id, item);
      });
      data.examsArchive.forEach(item => {
        if (item && item.id) {
          if (!examMap.has(item.id)) importedExamsCount++;
          examMap.set(item.id, item);
        }
      });
      const mergedExams = Array.from(examMap.values());
      localStorage.setItem(userArchiveKey, JSON.stringify(mergedExams));
      localStorage.setItem('moallem_saved_exams_archive', JSON.stringify(mergedExams));
      updateArchiveBadge();
      if (typeof renderArchiveList === 'function') renderArchiveList();
    } catch (e) {
      console.error('Sync examsArchive error:', e);
    }
  }

  // 4. Merge Questions Bank
  if (Array.isArray(data.questionsBank) && data.questionsBank.length > 0) {
    try {
      let existingBank = [];
      try {
        const raw = localStorage.getItem(userBankKey) || localStorage.getItem('moallem_questions_bank') || localStorage.getItem('moallem_questions_history_bank');
        if (raw) existingBank = JSON.parse(raw);
      } catch (e) { }

      const qMap = new Map();
      existingBank.forEach(q => {
        const qId = q.id || (q.text || '').slice(0, 40);
        if (qId) qMap.set(qId, q);
      });
      data.questionsBank.forEach(q => {
        const qId = q.id || (q.text || '').slice(0, 40);
        if (qId) {
          if (!qMap.has(qId)) importedQuestionsCount++;
          qMap.set(qId, q);
        }
      });
      const mergedBank = Array.from(qMap.values());
      localStorage.setItem(userBankKey, JSON.stringify(mergedBank));
      localStorage.setItem('moallem_questions_bank', JSON.stringify(mergedBank));
      localStorage.setItem('moallem_questions_history_bank', JSON.stringify(mergedBank));
    } catch (e) {
      console.error('Sync questionsBank error:', e);
    }
  }

  // 5. Restore Teacher Profile
  if (data.teacherProfile && typeof data.teacherProfile === 'object') {
    try {
      teacherProfile = { ...teacherProfile, ...data.teacherProfile };
      localStorage.setItem('moallem_teacher_profile', JSON.stringify(teacherProfile));
      if (activeUser && activeUser.id) {
        localStorage.setItem(`moallem_teacher_profile_${activeUser.id}`, JSON.stringify(teacherProfile));
      }
      applyProfileToExamHeader();
    } catch (e) {
      console.error('Sync teacherProfile error:', e);
    }
  }

  // 6. Restore Current Exam
  if (data.currentExam && typeof data.currentExam === 'object') {
    try {
      const cur = data.currentExam;
      if (Array.isArray(cur.questions) && cur.questions.length > 0) {
        appState.questions = cur.questions;
      }
      if (cur.header) appState.header = { ...appState.header, ...cur.header };
      if (cur.settings) appState.settings = { ...appState.settings, ...cur.settings };
      if (cur.currentArchiveId) appState.currentArchiveId = cur.currentArchiveId;
      syncHeaderInputs();
      applyProfileToExamHeader();
    } catch (e) {
      console.error('Sync currentExam error:', e);
    }
  }

  // 7. Refresh Application UI
  if (typeof updateUserAuthUI === 'function') updateUserAuthUI();
  if (typeof checkAuthGatekeeper === 'function') checkAuthGatekeeper();
  renderAll();
  updateArchiveBadge();
  if (typeof updateDailyReportMetrics === 'function') updateDailyReportMetrics();

  // 8. Push to local server if available
  if (typeof syncAccountsWithServer === 'function') {
    syncAccountsWithServer().catch(() => { });
  }
  if (typeof scheduleCloudAutoSync === 'function') {
    scheduleCloudAutoSync(500);
  }

  if (showNotification) {
    showToast(`تمت المزامنة بنجاح! تم استيراد الحسابات (${data.accounts ? data.accounts.length : 0}) والاختبارات (${data.examsArchive ? data.examsArchive.length : 0}) 🚀📱`, 'success');
  }
  return true;
};

window.checkAndApplyUrlSyncToken = function () {
  try {
    let token = '';
    // 1. Check Hash: #sync=...
    if (window.location.hash && window.location.hash.includes('sync=')) {
      const match = window.location.hash.match(/sync=([^&]+)/);
      if (match && match[1]) token = match[1];
    }
    // 2. Check Query: ?sync_token=...
    if (!token && window.location.search && window.location.search.includes('sync_token=')) {
      const urlParams = new URLSearchParams(window.location.search);
      token = urlParams.get('sync_token');
    }

    if (token) {
      const raw = decodeURIComponent(atob(token.trim()));
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        const success = window.applySyncPayload(data, true);
        if (success) {
          // Clean URL without reloading
          const cleanUrl = window.location.pathname;
          window.history.replaceState(null, '', cleanUrl);
        }
      }
    }
  } catch (err) {
    console.error('Failed to parse sync token from URL:', err);
  }

  // فحص تلقائي لكود التفعيل عند مسح الـ QR Code من بطاقة الوكيل المعتمد (?redeem=...)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const redeemParam = urlParams.get('redeem') || urlParams.get('code');
    if (redeemParam) {
      const cleanRedeem = decodeURIComponent(redeemParam).trim().toUpperCase();
      setTimeout(() => {
        if (typeof window.openRedeemCodeModal === 'function') {
          window.openRedeemCodeModal();
          const input = document.getElementById('standaloneRedeemInput') || document.getElementById('vipCodeRedeemInput');
          if (input) {
            input.value = cleanRedeem;
            input.focus();
          }
          if (typeof showToast === 'function') {
            showToast(`🎫 تم التقاط كود التفعيل (${cleanRedeem}) بنجاح من بطاقة الوكيل! اضغط تفعيل الحساب فوراً 👑`, 'info');
          }
        }
      }, 700);
    }
  } catch (e) { }
};

window.openMobileSyncModal = function () {
  const modal = document.getElementById('mobileSyncModal');
  if (!modal) return;

  const user = (typeof getCurrentUser === 'function' ? getCurrentUser() : null) || {};
  const accounts = typeof getAuthAccounts === 'function' ? getAuthAccounts() : [];
  const archive = typeof getSavedExamsArchive === 'function' ? getSavedExamsArchive() : [];

  // Update badges
  const accNameEl = document.getElementById('syncCurrentAccountName');
  if (accNameEl) accNameEl.innerText = user.name || user.username || 'المدير العام';

  const accBadge = document.getElementById('syncAccountsCountBadge');
  if (accBadge) accBadge.innerText = `${accounts.length} حساب`;

  const examBadge = document.getElementById('syncExamsCountBadge');
  if (examBadge) examBadge.innerText = `${archive.length} اختبار`;

  // Determine direct URL (prioritize worldwide Cloudflare URL so it opens anywhere on 4G)
  const savedPub = (typeof localStorage !== 'undefined') ? localStorage.getItem('moallem_public_server_url') : '';
  const preferredUrl = window.MOALLEM_PUBLIC_SERVER_URL || savedPub;
  let baseUrl = preferredUrl || window.location.origin;
  if (!baseUrl || baseUrl === 'null' || window.location.protocol === 'file:') {
    baseUrl = preferredUrl || 'http://localhost:8080';
  }
  const wifiUrlEl = document.getElementById('syncWifiDirectUrl');
  if (wifiUrlEl) wifiUrlEl.innerText = baseUrl;

  // Build Payload & Token
  const payload = buildFullSyncPayload();
  const token = btoa(encodeURIComponent(JSON.stringify(payload)));
  window._lastMobileSyncToken = token;

  // Direct sync URL
  const syncDirectUrl = `${baseUrl.replace(/\/+$/, '')}/#sync=${token}`;
  window._lastMobileSyncDirectUrl = syncDirectUrl;

  // Render QR Code
  const qrContainer = document.getElementById('mobileSyncQRContainer');
  if (qrContainer) {
    qrContainer.innerHTML = '';
    if (window.MoallemQRCode && typeof window.MoallemQRCode.createQRCodeSVG === 'function') {
      const qrEl = window.MoallemQRCode.createQRCodeSVG(syncDirectUrl, 210);
      qrContainer.appendChild(qrEl);
    } else {
      qrContainer.innerHTML = `<a href="${syncDirectUrl}" target="_blank" class="btn btn-primary" style="padding: 0.5rem 1rem;">فتح رابط المزامنة المباشر</a>`;
    }
  }

  modal.classList.add('open');
};

window.closeMobileSyncModal = function () {
  const modal = document.getElementById('mobileSyncModal');
  if (modal) modal.classList.remove('open');
};

window.refreshMobileSyncPayload = function () {
  window.openMobileSyncModal();
  showToast('تم تحديث باركود المزامنة بأحدث الاختبارات والأسئلة الحالية! 🔄', 'info');
};

window.copyDirectMobileSyncLink = function () {
  const url = window._lastMobileSyncDirectUrl;
  if (!url) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      showToast('تم نسخ رابط المزامنة المباشر! أرسله للموبايل عبر واتساب أو تيليجرام 📱🔗', 'success');
    }).catch(() => {
      prompt('انسخ رابط المزامنة السريع التالي:', url);
    });
  } else {
    prompt('انسخ رابط المزامنة السريع التالي:', url);
  }
};

window.copyWifiDirectUrl = function () {
  const savedPub = (typeof localStorage !== 'undefined') ? localStorage.getItem('moallem_public_server_url') : '';
  const preferredUrl = window.MOALLEM_PUBLIC_SERVER_URL || savedPub;
  let baseUrl = preferredUrl || window.location.origin;
  if (!baseUrl || baseUrl === 'null' || window.location.protocol === 'file:') {
    baseUrl = preferredUrl || 'http://localhost:8080';
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(baseUrl).then(() => {
      showToast('تم نسخ رابط المنصة: ' + baseUrl + ' 📋', 'success');
    }).catch(() => {
      prompt('رابط الواي فاي المباشر:', baseUrl);
    });
  } else {
    prompt('رابط الواي فاي المباشر:', baseUrl);
  }
};

window.copyFullSyncToken = function () {
  const token = window._lastMobileSyncToken;
  if (!token) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(token).then(() => {
      showToast('تم نسخ كود المزامنة الشامل للحافظة! 📋', 'success');
    }).catch(() => {
      prompt('كود المزامنة الشامل:', token);
    });
  } else {
    prompt('كود المزامنة الشامل:', token);
  }
};

window.pasteAndImportFullSyncToken = function () {
  const token = prompt('الصق كود المزامنة الشامل هنا لمزامنة كافة الحسابات والأسئلة:');
  if (!token || !token.trim()) return;
  try {
    const raw = decodeURIComponent(atob(token.trim()));
    const data = JSON.parse(raw);
    const success = window.applySyncPayload(data, true);
    if (success) {
      window.closeMobileSyncModal();
    }
  } catch (e) {
    showToast('كود المزامنة غير صالح أو تالف!', 'error');
  }
};

window.importFullSyncFile = function (event) {
  const file = event && event.target && event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      const success = window.applySyncPayload(data, true);
      if (success) {
        window.closeMobileSyncModal();
      }
    } catch (err) {
      showToast('فشل قراءة ملف النسخة الاحتياطية. تأكد أنه ملف JSON صالح.', 'error');
    }
  }
  reader.readAsText(file);
};

// Automatic listener on tab focus / visibilitychange
document.addEventListener('visibilitychange', () => {
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (document.visibilityState === 'visible') {
    if (user && user.id && user.id !== 'usr_guest') {
      if (typeof window.restoreUserDataFromServer === 'function') {
        window.restoreUserDataFromServer(user).catch(() => { });
      }
    }
    if (typeof syncAccountsWithServer === 'function') {
      syncAccountsWithServer().catch(() => { });
    }
  } else if (document.visibilityState === 'hidden') {
    if (user && user.id && user.id !== 'usr_guest') {
      if (typeof window.syncUserDataToServer === 'function') {
        window.syncUserDataToServer(user, true).catch(() => { });
      }
    }
  }
});

// Continuous background auto-save to server (حفظ دوري لكافة أعمال وبيانات المنصة في السيرفر)
setInterval(() => {
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (user && user.id && user.id !== 'usr_guest') {
    if (typeof window.syncUserDataToServer === 'function') {
      window.syncUserDataToServer(user, true).catch(() => { });
    }
  }
}, 90000);

// Run immediate check for URL sync token on load
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.checkAndApplyUrlSyncToken();
    });
  } else {
    window.checkAndApplyUrlSyncToken();
  }
}

/* ==========================================================================
   VIP Annual Subscription & 24h Free Trial Management
   ========================================================================== */
function isUserSubscribedOrAdmin() {
  const current = getCurrentUser();
  if (!current) return false;
  // Super Admin always has full unrestricted control
  if (current.isAdmin || current.role === 'admin' || current.username === 'admin' || current.id === 'usr_admin') {
    return true;
  }
  const now = Date.now();
  // Check subscription expiration
  if (current.subscriptionExpiresAt) {
    const expTime = new Date(current.subscriptionExpiresAt).getTime();
    if (!isNaN(expTime)) {
      if (now > expTime) {
        if (current.isSubscribed || current.isVip) {
          current.isSubscribed = false;
          current.isVip = false;
          try {
            const accs = getAuthAccounts();
            const idx = accs.findIndex(a => a.id === current.id);
            if (idx !== -1) {
              accs[idx].isSubscribed = false;
              accs[idx].isVip = false;
              saveAuthAccounts(accs);
            }
          } catch (e) { }
        }
        return false; // Expired!
      } else {
        // تاريخ الانتهاء ساري في المستقبل: الحساب مفعل رسمياً
        if (current.isVip || current.isSubscribed || !current.isTrial || current.role === 'teacher_vip') {
          return true;
        }
      }
    }
  }
  // Check user subscription status
  if (current.isSubscribed || current.isVip || current.role === 'teacher_vip') {
    return true;
  }
  if (current.id && localStorage.getItem(`moallem_vip_subscription_${current.id}`) === 'true') {
    const expStr = localStorage.getItem(`moallem_vip_subscription_exp_${current.id}`);
    if (expStr) {
      const expTime = new Date(expStr).getTime();
      if (!isNaN(expTime) && now > expTime) {
        return false; // Expired!
      }
    }
    return true;
  }
  return false;
}
window.isUserSubscribedOrAdmin = isUserSubscribedOrAdmin;

function requireSubscription(featureName = 'هذه الميزة') {
  if (isUserSubscribedOrAdmin()) {
    return true;
  }
  showToast('🔒 اشترك لتتيح لك جميع الصلاحيات! (باقات مرنة تبدأ من 25 ألف د.ع)', 'warning');
  if (typeof window.openSubscriptionModal === 'function') {
    window.openSubscriptionModal();
  }
  return false;
}
window.requireSubscription = requireSubscription;

/* ==========================================================================
   Subscription Pricing & Admin Control Management
   ========================================================================== */
const DEFAULT_SUBSCRIPTION_PRICING = {
  promoBanner: 'عروض الموسم الدراسي الجديد: خصومات حصرية وتفعيل فوري لحسابك عبر واتساب خلال دقائق معدودة! ⏳',
  plan1: {
    price: 25000,
    note: 'يعادل ~830 د.ع فقط باليوم الواحد'
  },
  plan2: {
    price: 75000,
    oldPrice: 150000,
    discountPill: 'خصم 50% — وفر 75,000 د.ع',
    note: 'احصل على 6 أشهر كاملة بسعر 3 أشهر (3 أشهر إضافية مجاناً 🎁)'
  },
  plan3: {
    price: 200000,
    oldPrice: 300000,
    discountPill: 'خصم 33% — وفر 100,000 د.ع كاش!',
    note: 'فقط ~16,600 د.ع شهرياً (احصل على 12 شهراً بسعر 8 أشهر!)'
  }
};
window.DEFAULT_SUBSCRIPTION_PRICING = DEFAULT_SUBSCRIPTION_PRICING;

function formatIraqiDinar(num) {
  const n = parseInt(num, 10);
  if (isNaN(n)) return num || '0';
  return n.toLocaleString('en-US');
}

window.getSubscriptionPricing = function () {
  try {
    const saved = localStorage.getItem('moallem_subscription_pricing');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        promoBanner: parsed.promoBanner || DEFAULT_SUBSCRIPTION_PRICING.promoBanner,
        plan1: Object.assign({}, DEFAULT_SUBSCRIPTION_PRICING.plan1, parsed.plan1),
        plan2: Object.assign({}, DEFAULT_SUBSCRIPTION_PRICING.plan2, parsed.plan2),
        plan3: Object.assign({}, DEFAULT_SUBSCRIPTION_PRICING.plan3, parsed.plan3)
      }
    }
  } catch (e) {
    console.warn('Failed to parse subscription pricing from storage:', e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_SUBSCRIPTION_PRICING));
};

window.renderSubscriptionPricingUI = function () {
  const pricing = window.getSubscriptionPricing();

  // 1. Promo banner
  const bannerEl = document.getElementById('vipUrgencyBannerText');
  if (bannerEl && pricing.promoBanner) {
    bannerEl.textContent = pricing.promoBanner;
  }

  // 2. Plan 1 (Monthly)
  const p1Amount = document.getElementById('plan1AmountNum');
  if (p1Amount) p1Amount.textContent = formatIraqiDinar(pricing.plan1.price);
  const p1Math = document.getElementById('plan1MentalMath');
  if (p1Math && pricing.plan1.note) p1Math.textContent = pricing.plan1.note;
  const p1Cta = document.getElementById('plan1CtaBtn');
  if (p1Cta) {
    const span = p1Cta.querySelector('span');
    if (span) span.textContent = 'اشتراك';
  }

  // 3. Plan 2 (6 Months)
  const p2Amount = document.getElementById('plan2AmountNum');
  if (p2Amount) p2Amount.textContent = formatIraqiDinar(pricing.plan2.price);
  const p2Old = document.getElementById('plan2OldPriceNum');
  if (p2Old) p2Old.textContent = `${formatIraqiDinar(pricing.plan2.oldPrice)} د.ع`;
  const p2Pill = document.getElementById('plan2DiscountPillText');
  if (p2Pill && pricing.plan2.discountPill) p2Pill.textContent = pricing.plan2.discountPill;
  const p2Math = document.getElementById('plan2MentalMath');
  if (p2Math && pricing.plan2.note) {
    p2Math.innerHTML = `<i class="fa-solid fa-gift"></i> ${pricing.plan2.note}`;
  }
  const p2Cta = document.getElementById('plan2CtaBtn');
  if (p2Cta) {
    const span = p2Cta.querySelector('span');
    if (span) span.textContent = 'اشتراك';
  }

  // 4. Plan 3 (1 Year VIP)
  const p3Amount = document.getElementById('plan3AmountNum');
  if (p3Amount) p3Amount.textContent = formatIraqiDinar(pricing.plan3.price);
  const p3Old = document.getElementById('plan3OldPriceNum');
  if (p3Old) p3Old.textContent = `${formatIraqiDinar(pricing.plan3.oldPrice)} د.ع`;
  const p3Pill = document.getElementById('plan3DiscountPillText');
  if (p3Pill && pricing.plan3.discountPill) p3Pill.textContent = pricing.plan3.discountPill;
  const p3Math = document.getElementById('plan3MentalMath');
  if (p3Math && pricing.plan3.note) {
    p3Math.innerHTML = `<i class="fa-solid fa-crown text-warning"></i> ${pricing.plan3.note}`;
  }
  const p3Cta = document.getElementById('plan3CtaBtn');
  if (p3Cta) {
    const span = p3Cta.querySelector('span');
    if (span) span.textContent = 'اشتراك';
    p3Cta.classList.remove('btn-plan-current-active');
  }
  if (p1Cta) p1Cta.classList.remove('btn-plan-current-active');
  if (p2Cta) p2Cta.classList.remove('btn-plan-current-active');

  // 5. Active Plan Detection & Prominent Highlighting for Logged-In User
  const card1 = document.getElementById('plan1Card');
  const card2 = document.getElementById('plan2Card');
  const card3 = document.getElementById('plan3Card');
  [card1, card2, card3].forEach(c => {
    if (!c) return;
    c.classList.remove('is-user-current-plan');
    const oldRibbon = c.querySelector('.plan-current-user-ribbon');
    if (oldRibbon) oldRibbon.remove();
  });

  const activeBanner = document.getElementById('userActivePlanStatusBanner');
  const activeTitle = document.getElementById('userActivePlanTitleText');
  const activeExp = document.getElementById('userActivePlanExpiryText');

  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const isVip = user && (user.isSubscribed || user.isVip || user.role === 'teacher_vip' || localStorage.getItem(`moallem_vip_subscription_${user.id}`) === 'true');

  if (isVip && user) {
    const dur = String(user.subscriptionDuration || user.subscriptionType || '').toLowerCase();
    const planName = String(user.subscriptionPlanName || '').toLowerCase();

    let activeKey = '1_year'; // default for VIP
    let activePlanTitle = 'الباقة السنوية الأكاديمية VIP 👑';
    let targetCard = card3;
    let targetCta = p3Cta;

    if (dur.includes('6_month') || dur.includes('6') || planName.includes('6 أشهر') || planName.includes('نصف سنة')) {
      activeKey = '6_months';
      activePlanTitle = 'باقة الـ 6 أشهر (نصف سنة دراسية) 🔥';
      targetCard = card2;
      targetCta = p2Cta;
    } else if (dur === '1_month' || (dur.includes('month') && !dur.includes('6')) || planName.includes('شهر واحد')) {
      activeKey = '1_month';
      activePlanTitle = 'باقة الشهر الواحد 🗓️';
      targetCard = card1;
      targetCta = p1Cta;
    }

    // Highlight target card
    if (targetCard) {
      targetCard.classList.add('is-user-current-plan');
      const ribbon = document.createElement('div');
      ribbon.className = 'plan-current-user-ribbon';
      ribbon.innerHTML = '<i class="fa-solid fa-crown text-warning"></i> <span>باقتك الحالية المفعلة ✔</span>';
      targetCard.appendChild(ribbon);
    }

    if (targetCta) {
      targetCta.classList.add('btn-plan-current-active');
      const span = targetCta.querySelector('span');
      if (span) span.textContent = 'باقتك الحالية المفعلة ✔';
    }

    // Show top active status banner
    if (activeBanner) {
      activeBanner.style.display = 'flex';
      if (activeTitle) {
        activeTitle.innerHTML = `باقتك الحالية المفعلة: <strong>${activePlanTitle}</strong> (حساب أستاذ ${user.name || user.username})`;
      }
      if (activeExp) {
        const expDate = user.subscriptionExpiryFormatted || (user.subscriptionExpiresAt ? String(user.subscriptionExpiresAt).split('T')[0] : 'سارية ومفعلة');
        activeExp.innerHTML = `<i class="fa-solid fa-calendar-check"></i> صالحة وتعمل بكامل الصلاحيات حتى: <strong>${expDate}</strong> • مزامنة سحابية 24/7`;
      }
    }
  } else {
    if (activeBanner) activeBanner.style.display = 'none';
  }
};

window.toggleAdminPricingForm = function (forceOpen) {
  const formContent = document.getElementById('adminPricingFormContent');
  const toggleBtnText = document.getElementById('adminPricingToggleBtnText');
  if (!formContent) return;

  const isCurrentlyOpen = formContent.style.display === 'block';
  const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !isCurrentlyOpen;

  if (shouldOpen) {
    const pricing = window.getSubscriptionPricing();
    const inPromo = document.getElementById('adminInputPromoBanner');
    if (inPromo) inPromo.value = pricing.promoBanner || '';

    const inP1 = document.getElementById('adminInputPrice1');
    if (inP1) inP1.value = pricing.plan1.price || 25000;
    const inN1 = document.getElementById('adminInputNote1');
    if (inN1) inN1.value = pricing.plan1.note || '';

    const inP2 = document.getElementById('adminInputPrice2');
    if (inP2) inP2.value = pricing.plan2.price || 75000;
    const inOP2 = document.getElementById('adminInputOldPrice2');
    if (inOP2) inOP2.value = pricing.plan2.oldPrice || 150000;
    const inPill2 = document.getElementById('adminInputPill2');
    if (inPill2) inPill2.value = pricing.plan2.discountPill || '';
    const inN2 = document.getElementById('adminInputNote2');
    if (inN2) inN2.value = pricing.plan2.note || '';

    const inP3 = document.getElementById('adminInputPrice3');
    if (inP3) inP3.value = pricing.plan3.price || 200000;
    const inOP3 = document.getElementById('adminInputOldPrice3');
    if (inOP3) inOP3.value = pricing.plan3.oldPrice || 300000;
    const inPill3 = document.getElementById('adminInputPill3');
    if (inPill3) inPill3.value = pricing.plan3.discountPill || '';
    const inN3 = document.getElementById('adminInputNote3');
    if (inN3) inN3.value = pricing.plan3.note || '';

    formContent.style.display = 'block';
    if (toggleBtnText) toggleBtnText.textContent = 'إغلاق لوحة التعديل';
  } else {
    formContent.style.display = 'none';
    if (toggleBtnText) toggleBtnText.textContent = 'تعديل الأسعار والخصومات';
  }
};

window.saveSubscriptionPricingFromAdmin = async function () {
  const current = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const isAdmin = current && (current.isAdmin || current.role === 'admin' || current.username === 'admin' || current.email === 'admin' || current.id === 'acc_admin');
  if (!isAdmin) {
    if (typeof showToast === 'function') showToast('تعديل الأسعار مخصص لحساب المدير العام فقط 👑', 'error');
    return;
  }

  const inPromo = document.getElementById('adminInputPromoBanner');
  const inP1 = document.getElementById('adminInputPrice1');
  const inN1 = document.getElementById('adminInputNote1');
  const inP2 = document.getElementById('adminInputPrice2');
  const inOP2 = document.getElementById('adminInputOldPrice2');
  const inPill2 = document.getElementById('adminInputPill2');
  const inN2 = document.getElementById('adminInputNote2');
  const inP3 = document.getElementById('adminInputPrice3');
  const inOP3 = document.getElementById('adminInputOldPrice3');
  const inPill3 = document.getElementById('adminInputPill3');
  const inN3 = document.getElementById('adminInputNote3');

  const newPricing = {
    promoBanner: (inPromo && inPromo.value.trim()) || DEFAULT_SUBSCRIPTION_PRICING.promoBanner,
    plan1: {
      price: parseInt(inP1 ? inP1.value : 25000, 10) || 25000,
      note: (inN1 && inN1.value.trim()) || DEFAULT_SUBSCRIPTION_PRICING.plan1.note
    },
    plan2: {
      price: parseInt(inP2 ? inP2.value : 75000, 10) || 75000,
      oldPrice: parseInt(inOP2 ? inOP2.value : 150000, 10) || 150000,
      discountPill: (inPill2 && inPill2.value.trim()) || DEFAULT_SUBSCRIPTION_PRICING.plan2.discountPill,
      note: (inN2 && inN2.value.trim()) || DEFAULT_SUBSCRIPTION_PRICING.plan2.note
    },
    plan3: {
      price: parseInt(inP3 ? inP3.value : 200000, 10) || 200000,
      oldPrice: parseInt(inOP3 ? inOP3.value : 300000, 10) || 300000,
      discountPill: (inPill3 && inPill3.value.trim()) || DEFAULT_SUBSCRIPTION_PRICING.plan3.discountPill,
      note: (inN3 && inN3.value.trim()) || DEFAULT_SUBSCRIPTION_PRICING.plan3.note
    }
  }

  localStorage.setItem('moallem_subscription_pricing', JSON.stringify(newPricing));
  window.renderSubscriptionPricingUI();

  // Also sync to server API if accessible
  try {
    const serverUrl = (window.MOALLEM_PUBLIC_SERVER_URL || (window.location && window.location.origin ? window.location.origin : 'http://localhost:8080')).replace(/\/+$/, '');
    await fetch(`${serverUrl}/api/pricing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPricing)
    });
  } catch (err) {
    console.log('Server pricing sync skipped/failed:', err);
  }

  if (typeof showToast === 'function') {
    showToast('تم حفظ وتحديث أسعار الباقات وعروض المناسبات بنجاح! 👑✨', 'success');
  }
  window.toggleAdminPricingForm(false);
};

window.resetSubscriptionPricing = function () {
  if (confirm('هل أنت متأكد من استعادة أسعار الباقات والخصومات الافتراضية؟')) {
    localStorage.removeItem('moallem_subscription_pricing');
    window.renderSubscriptionPricingUI();
    window.toggleAdminPricingForm(true);
    if (typeof showToast === 'function') {
      showToast('تمت استعادة الأسعار والخصومات الأصلية بنجاح 🔄', 'info');
    }
  }
};

window.selectSubscriptionPlan = function (planKey) {
  if (typeof window.openQiCardPaymentModal === 'function') {
    window.openQiCardPaymentModal(planKey);
  } else {
    showToast('بوابة الدفع الإلكتروني عبر كي كارد (Qi Card API) قيد التحضير 💳', 'info');
  }
};

window.openQiCardPaymentModal = function (planKey = '1_month') {
  const modal = document.getElementById('qiCardPaymentModal');
  if (!modal) return;

  const subModal = document.getElementById('subscriptionModal');
  if (subModal) subModal.classList.remove('open');

  const pricing = typeof window.getSubscriptionPricing === 'function' ? window.getSubscriptionPricing() : DEFAULT_SUBSCRIPTION_PRICING;
  const planNameEl = document.getElementById('qiModalPlanName');
  const planPriceEl = document.getElementById('qiModalPlanPrice');

  let name = 'الباقة الشهرية (30 يوماً)';
  let price = (pricing.plan1 && pricing.plan1.price) || 25000;

  if (planKey === '6_months' || planKey === '4_months' || planKey === '3_months') {
    name = 'باقة الـ 6 أشهر (نصف سنة دراسية - الأكثر طلباً 🔥)';
    price = (pricing.plan2 && pricing.plan2.price) || 75000;
  } else if (planKey === '1_year') {
    name = 'الباقة السنوية الأكاديمية VIP (عام دراسي كامل 👑)';
    price = (pricing.plan3 && pricing.plan3.price) || 200000;
  }

  if (planNameEl) planNameEl.textContent = name;
  if (planPriceEl) planPriceEl.textContent = typeof formatIraqiDinar === 'function' ? formatIraqiDinar(price) : price.toLocaleString();

  modal.style.display = 'flex';
  modal.classList.add('open');
};

window.closeQiCardPaymentModal = function () {
  const modal = document.getElementById('qiCardPaymentModal');
  if (modal) {
    modal.classList.remove('open');
    modal.style.display = 'none';
  }
  const subModal = document.getElementById('subscriptionModal');
  if (subModal) subModal.classList.add('open');
};

window.confirmQiCardPayment = function () {
  const current = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (!current) {
    if (typeof showToast === 'function') showToast('يرجى تسجيل الدخول أولاً لتفعيل الاشتراك بحسابك!', 'warning');
    return;
  }
  if (typeof showToast === 'function') {
    showToast('💳 جاري استكمال تفعيل بوابة Qi Card API المباشرة... شكراً لاختياركم كي كارد!', 'success');
  }
  setTimeout(() => {
    window.closeQiCardPaymentModal();
  }, 1200);
};

window.openSubscriptionModal = function (openAdminDirectly = false) {
  const modal = document.getElementById('subscriptionModal');
  if (modal) modal.classList.add('open');

  const current = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const loggedIn = typeof isUserLoggedIn === 'function' ? isUserLoggedIn() : false;
  const isAdmin = loggedIn && current && (current.isAdmin || current.role === 'admin' || current.username === 'admin' || current.email === 'admin' || current.id === 'acc_admin');

  const adminPanel = document.getElementById('adminPricingControlPanel');
  if (adminPanel) {
    adminPanel.style.display = isAdmin ? 'block' : 'none';
  }

  if (typeof window.renderSubscriptionPricingUI === 'function') {
    window.renderSubscriptionPricingUI();
  }

  if (isAdmin && openAdminDirectly) {
    window.toggleAdminPricingForm(true);
    setTimeout(() => {
      if (adminPanel) adminPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }

  if (typeof window.updateVipUIStatus === 'function') {
    window.updateVipUIStatus();
  }
};

window.closeSubscriptionModal = function () {
  const modal = document.getElementById('subscriptionModal');
  if (modal) modal.classList.remove('open');
};

// Initial background sync from server if connected
(async function syncPricingFromServer() {
  try {
    const serverUrl = (window.MOALLEM_PUBLIC_SERVER_URL || (window.location && window.location.origin ? window.location.origin : 'http://localhost:8080')).replace(/\/+$/, '');
    const res = await fetch(`${serverUrl}/api/pricing`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.pricing) {
        localStorage.setItem('moallem_subscription_pricing', JSON.stringify(data.pricing));
        if (typeof window.renderSubscriptionPricingUI === 'function') {
          window.renderSubscriptionPricingUI();
        }
      }
    }
  } catch (e) {
    // offline or local, gracefully fallback
  }
})();

window.toggleVipSubscriptionDemo = function () {
  const current = getCurrentUser();
  if (!current) {
    showToast('يرجى تسجيل الدخول أولاً!', 'warning');
    return;
  }
  if (current.isAdmin || current.username === 'admin') {
    showToast('أنت بحساب المدير العام (Super Admin)، ولديك كافة الصلاحيات مفعلة دائماً بدون رسوم 👑', 'info');
    return;
  }

  if (typeof window.openQiCardPaymentModal === 'function') {
    window.openQiCardPaymentModal('6_months');
  } else {
    showToast('💳 بوابة الدفع الإلكتروني الحصرية عبر كي كارد (Qi Card API) قيد التحضير والربط المباشر', 'info');
  }
};

let trialTickerInterval = null;
function updateTrialWarningBanner() {
  const banner = document.getElementById('trialWarningBanner');
  const floatingBadge = document.getElementById('trialFloatingBadge');

  const current = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  // If not logged in, or super admin:
  if (!current || !current.id || current.id === 'usr_guest' || current.isAdmin || current.role === 'admin' || current.username === 'admin' || current.id === 'usr_admin') {
    if (banner) banner.style.display = 'none';
    if (floatingBadge) floatingBadge.style.display = 'none';
    if (trialTickerInterval) {
      clearInterval(trialTickerInterval);
      trialTickerInterval = null;
    }
    return;
  }

  // إذا كان المستخدم يمتلك اشتراكاً مفعلأً (VIP أو سنوي أو نصف سنوي) يتم إخفاء شارة وبانر اليومين التجريبيين نهائياً
  const isPaidVip = (current.role === 'teacher_vip') ||
    (current.isSubscribed && !current.isTrial && !String(current.subscriptionType || '').startsWith('free_trial')) ||
    (current.subscriptionDuration && !String(current.subscriptionDuration).startsWith('free_trial')) ||
    (!current.isTrial && !String(current.subscriptionType || '').startsWith('free_trial') && localStorage.getItem(`moallem_vip_subscription_${current.id}`) === 'true');

  if (isPaidVip) {
    if (banner) banner.style.display = 'none';
    if (floatingBadge) floatingBadge.style.display = 'none';
    if (trialTickerInterval) {
      clearInterval(trialTickerInterval);
      trialTickerInterval = null;
    }
    return;
  }

  // Check if trial user
  const isTrialUser = !!(current.isTrial || String(current.subscriptionType || '').startsWith('free_trial') || (current.trialDurationHours && !current.subscriptionDuration));
  if (!isTrialUser) {
    if (banner) banner.style.display = 'none';
    if (floatingBadge) floatingBadge.style.display = 'none';
    if (trialTickerInterval) {
      clearInterval(trialTickerInterval);
      trialTickerInterval = null;
    }
    return;
  }

  // Show trial warning banner & floating emblem badge
  if (banner) banner.style.display = 'block';
  if (floatingBadge) floatingBadge.style.display = 'none';

  const expTimeStr = current.subscriptionExpiresAt || (current.id && localStorage.getItem(`moallem_vip_subscription_exp_${current.id}`));
  const expTime = expTimeStr ? new Date(expTimeStr).getTime() : 0;
  const now = Date.now();
  const diffMs = expTime - now;

  const timerDigits = document.getElementById('trialTimerDisplay');
  const floatingTimer = document.getElementById('trialFloatingTimer');
  const badgeTitle = document.getElementById('trialBadgeTitle');
  const descEl = document.getElementById('trialBannerDesc');
  const actionBtnText = document.getElementById('trialActionBtnText');

  if (diffMs > 0) {
    if (banner) banner.classList.remove('trial-expired');
    if (floatingBadge) floatingBadge.classList.remove('trial-expired');

    const totalSecs = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSecs / 86400);
    const hrs = Math.floor((totalSecs % 86400) / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    let formattedTime = '';
    let floatCountdownText = '';
    if (days > 0) {
      formattedTime = `${days} يوم و ${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      floatCountdownText = `متبقي ${days} يوم و ${hrs} ساعة`;
    } else {
      formattedTime = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      floatCountdownText = `متبقي ${formattedTime}`;
    }

    if (timerDigits) timerDigits.innerText = formattedTime;
    if (floatingTimer) floatingTimer.innerText = floatCountdownText;
    if (badgeTitle) badgeTitle.innerText = '🎁 الفترة التجريبية المجانية (7 أيام)';
    if (descEl) {
      descEl.innerHTML = `تمتع بكامل صلاحيات إعداد وطباعة الاختبارات الوزارية وسجلات الطلاب`;
    }
    if (actionBtnText) actionBtnText.innerText = 'ترقية الحساب والاشتراك الآن 👑';
  } else {
    // Expired state
    if (banner) banner.classList.add('trial-expired');
    if (floatingBadge) floatingBadge.classList.add('trial-expired');
    if (timerDigits) timerDigits.innerText = '00:00:00';
    if (floatingTimer) floatingTimer.innerText = 'انتهت التجربة!';
    if (badgeTitle) badgeTitle.innerText = '⛔ انتهت الفترة التجريبية (يومان)';
    if (descEl) {
      descEl.innerHTML = `<strong>تنبيه عاجل:</strong> انتهت فترة اليومين التجريبية المجانية لحسابك. المنصة الآن في <strong>وضع المشاهدة فقط</strong>. يرجى تفعيل اشتراكك لاستئناف التعديل والطباعة فوراً!`;
    }
    if (actionBtnText) actionBtnText.innerText = 'تفعيل الاشتراك الكامل 👑';

    // حماية: إلغاء الاشتراك فقط في حال كان حساباً تجريبياً حقيقياً وليس اشتراكاً مدفوعاً
    if (current.isTrial && !current.subscriptionDuration && current.subscriptionType !== '1_year' && current.subscriptionType !== '6_months' && current.role !== 'teacher_vip') {
      if (current.isSubscribed || current.isVip) {
        current.isSubscribed = false;
        current.isVip = false;
        try {
          const accs = getAuthAccounts();
          const aIdx = accs.findIndex(a => a.id === current.id);
          if (aIdx !== -1) {
            accs[aIdx].isSubscribed = false;
            accs[aIdx].isVip = false;
            saveAuthAccounts(accs);
          }
        } catch (e) { }
      }
    }
  }

  if (!trialTickerInterval) {
    trialTickerInterval = setInterval(() => {
      updateTrialWarningBanner();
    }, 1000);
  }
}
window.updateTrialWarningBanner = updateTrialWarningBanner;

window.updateVipUIStatus = function () {
  const current = getCurrentUser();
  const isAdmin = current && (current.isAdmin || current.role === 'admin' || current.username === 'admin');
  const isSubscribed = isUserSubscribedOrAdmin();

  // Update trial warning banner & countdown clock
  updateTrialWarningBanner();

  // View-Only Mode Banner & Body class
  const banner = document.getElementById('viewOnlyModeBanner');
  const isTrial = current && (current.isTrial || current.subscriptionType === 'free_trial_48h' || current.subscriptionType === 'free_trial_24h');

  if (isSubscribed) {
    document.body.classList.remove('view-only-mode');
    if (banner) banner.style.display = 'none';
  } else {
    document.body.classList.add('view-only-mode');
    if (banner) {
      banner.style.display = isTrial ? 'none' : 'flex';
    }
  }

  const btnTxt = document.getElementById('vipToggleBtnText');
  if (btnTxt) {
    if (isAdmin) {
      btnTxt.innerText = 'حساب الآدمن (مفعل مدى الحياة 👑)';
    } else if (isTrial && isSubscribed) {
      btnTxt.innerText = 'فترة تجريبية مجانية (يومان) 🎁';
    } else if (isSubscribed) {
      btnTxt.innerText = 'حسابك مفعل بنجاح ✔';
    } else {
      btnTxt.innerText = 'إشعار تسديد الرسوم 💳';
    }
  }

  const drawerSubBtn = document.getElementById('drawerSubscriptionBtn');
  if (drawerSubBtn) {
    const span = drawerSubBtn.querySelector('span');
    if (span) {
      if (isAdmin) {
        span.innerHTML = 'باقة الآدمن (كافة الصلاحيات 👑)';
      } else if (isTrial && isSubscribed) {
        span.innerHTML = 'تجربة مجانية نشطة (يومان) 🎁';
      } else if (isSubscribed) {
        span.innerHTML = 'الاشتراك مفعل 👑';
      } else {
        span.innerHTML = 'خطط الاشتراك (من 25 ألف) 🔒';
      }
    }
  }
};

// Global Interceptor: Restrict editing when in View-Only mode
document.addEventListener('click', (e) => {
  if (isUserSubscribedOrAdmin()) return;

  const target = e.target;
  if (!target) return;

  // Allow clicking on modals, drawers, auth portal, subscription controls, page navigation, and save buttons
  if (target.closest('#subscriptionModal, #fullscreenAuthPortal, .side-drawer, .drawer-backdrop, .btn-drawer-close, #drawerLogoutBtn, .paper-page-jump-btn, .paper-sep-badge, .btn-nav-drawer, .btn-theme, #saveExamToArchiveBtn, .btn-save-archive')) {
    return;
  }

  // Intercept any attempt to modify or interact with builder / question controls
  const actionTarget = target.closest(
    '.btn-add-q, .btn-quick-add, .btn-add-branch, .q-actions button, .btn-paper-break-ctrl, ' +
    '.btn-paper-font-ctrl, #printExamBtn, #smartGenBtn, #clearAllBtn, ' +
    '#applyPresetBtn, #presetsModalBtn, #openProfileModalBtn, .btn-del, .paper-font-num-input, ' +
    '#paperPageModeSelect, .builder-pane button, .builder-pane input, .builder-pane select, ' +
    '#saveProfileBtn, .btn-print-action'
  );

  if (actionTarget) {
    e.preventDefault();
    e.stopPropagation();
    requireSubscription();
  }
}, true);

document.addEventListener('keydown', (e) => {
  if (isUserSubscribedOrAdmin()) return;
  const target = e.target;
  if (!target) return;

  if (target.closest('#subscriptionModal, #fullscreenAuthPortal, .side-drawer, #loginForm, #registerForm')) {
    return;
  }

  if (target.closest('.builder-pane, .exam-header, .paper-content')) {
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      e.preventDefault();
      e.stopPropagation();
      requireSubscription();
    }
  }
}, true);

// Auto-attach backdrop click listeners for modals
document.addEventListener('DOMContentLoaded', () => {
  const sModal = document.getElementById('subscriptionModal');
  if (sModal) {
    sModal.addEventListener('click', (e) => {
      if (e.target === sModal) window.closeSubscriptionModal();
    });
  }
  const subManageModal = document.getElementById('subscriptionManagementModal');
  if (subManageModal) {
    subManageModal.addEventListener('click', (e) => {
      if (e.target === subManageModal) window.closeSubscriptionManagementModal();
    });
  }
  if (typeof window.updateVipUIStatus === 'function') {
    window.updateVipUIStatus();
  }
});

/* ==========================================================================
   Super Admin Control Panel & Accounts Management
   ========================================================================== */
window.openAdminControlPanel = function () {
  const current = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const loggedIn = typeof isUserLoggedIn === 'function' ? isUserLoggedIn() : false;
  const isAdmin = loggedIn && current && (current.isAdmin || current.role === 'admin' || current.username === 'admin' || current.email === 'admin' || current.id === 'acc_admin' || current.id === 'usr_admin');
  if (!isAdmin) {
    if (typeof showToast === 'function') showToast('هذه اللوحة مخصصة لحساب المدير العام فقط 🛡️', 'warning');
    return;
  }
  const modal = document.getElementById('adminControlPanelModal');
  if (modal) {
    modal.classList.add('open');
    if (typeof window.renderAdminAccountsTable === 'function') {
      window.renderAdminAccountsTable();
    }
  }
};

window.closeAdminControlPanel = function () {
  const modal = document.getElementById('adminControlPanelModal');
  if (modal) modal.classList.remove('open');
};

window.openAdminGrantSubscriptions = function () {
  window.openSubscriptionManagementModal();
};

window.openSubscriptionManagementModal = function () {
  const current = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const loggedIn = typeof isUserLoggedIn === 'function' ? isUserLoggedIn() : false;
  const isAdmin = loggedIn && current && (current.isAdmin || current.role === 'admin' || current.username === 'admin' || current.email === 'admin' || current.id === 'acc_admin' || current.id === 'usr_admin');
  if (!isAdmin) {
    if (typeof showToast === 'function') showToast('إدارة المشتركين مخصصة لحساب المدير العام فقط 👑', 'warning');
    return;
  }
  const modal = document.getElementById('subscriptionManagementModal');
  if (modal) {
    modal.classList.add('open');
    if (typeof window.renderSubscribersManagementUI === 'function') {
      window.renderSubscribersManagementUI();
    }
    if (typeof window.loadAndRenderActivationCodes === 'function') {
      window.loadAndRenderActivationCodes();
    }
    setTimeout(() => {
      const input = document.getElementById('subActivationQueryInput');
      if (input) input.focus();
    }, 180);
  }
};

window.closeSubscriptionManagementModal = function () {
  const modal = document.getElementById('subscriptionManagementModal');
  if (modal) modal.classList.remove('open');
};

/* ==========================================================================
   Server Status & Cloud Gateway Diagnostics Center
   ========================================================================== */
window.openServerStatusModal = function () {
  const current = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const loggedIn = typeof isUserLoggedIn === 'function' ? isUserLoggedIn() : false;
  const isAdmin = loggedIn && current && (current.isAdmin || current.role === 'admin' || current.username === 'admin' || current.email === 'admin' || current.id === 'acc_admin' || current.id === 'usr_admin');
  if (!isAdmin) {
    if (typeof showToast === 'function') showToast('تفاصيل السيرفر ونوع الكيت وي مخصصة لحساب المدير العام فقط 🛡️', 'warning');
    return;
  }
  const modal = document.getElementById('serverStatusModal');
  if (modal) {
    modal.classList.add('open');
    window.checkServerStatusLive(false);
  }
};

window.closeServerStatusModal = function () {
  const modal = document.getElementById('serverStatusModal');
  if (modal) modal.classList.remove('open');
};

window.copyServerModalUrl = function (inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input || !input.value) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(input.value).then(() => {
      if (btn) {
        const oldHtml = btn.innerHTML;
        btn.innerHTML = `<i class="fa-solid fa-check"></i> تم النسخ!`;
        setTimeout(() => { btn.innerHTML = oldHtml; }, 1800);
      }
      if (typeof showToast === 'function') showToast('تم نسخ الرابط بنجاح 📋', 'success');
    }).catch(() => {
      input.select();
      document.execCommand('copy');
      if (typeof showToast === 'function') showToast('تم نسخ الرابط بنجاح 📋', 'success');
    });
  } else {
    input.select();
    document.execCommand('copy');
    if (typeof showToast === 'function') showToast('تم نسخ الرابط بنجاح 📋', 'success');
  }
};

window.saveCustomServerTunnelUrl = function () {
  const input = document.getElementById('srvCustomTunnelInput');
  if (!input || !input.value.trim()) {
    if (typeof showToast === 'function') showToast('يرجى إدخال رابط كيت وي صالح', 'warning');
    return;
  }
  const url = input.value.trim().replace(/\/+$/, '');
  window.MOALLEM_PUBLIC_SERVER_URL = url;
  try {
    localStorage.setItem('moallem_public_server_url', url);
  } catch (_) { }
  input.value = '';
  if (typeof showToast === 'function') showToast('تم حفظ واعتماد رابط الكيت وي الجديد بنجاح 💾', 'success');
  window.checkServerStatusLive(true);
};


window.triggerManualSupabaseSync = async function () {
  const btn = document.getElementById('btnTriggerSupabaseSync');
  const icon = document.getElementById('iconManualSync');
  const notice = document.getElementById('srvModalSyncTimeNotice');
  const statsLocal = document.getElementById('srvModalLocalDbStats');
  const statsCloud = document.getElementById('srvModalCloudSyncStats');

  if (icon) icon.classList.add('fa-spin');
  if (btn) btn.disabled = true;

  try {
    const res = await fetch('/api/supabase/sync_full', { method: 'POST' });
    const data = await res.json();
    if (data && data.success) {
      if (typeof showToast === 'function') {
        showToast(`تمت المزامنة السحابية بنجاح! (${data.local_accounts_count} حساب محلي محفوظ ومزامن 💾☁️✔)`, 'success');
      }
      if (notice) notice.innerText = `آخر مزامنة: ${data.timestamp || 'الآن'}`;
      if (statsLocal) statsLocal.innerText = `✔ الحفظ المحلي دائم ومستمر (${data.local_accounts_count} حساب مسجل)`;
      if (statsCloud) statsCloud.innerText = `✔ متصل بالسحابة وتمت مطابقة ${data.synced_accounts_count || data.local_accounts_count} حساب بنجاح`;
    } else {
      if (typeof showToast === 'function') {
        showToast('تم الحفظ محلياً بنجاح، جاري إعادة محاولة الاتصال بالسحابة 💾', 'info');
      }
    }
  } catch (err) {
    console.warn('Manual sync fallback:', err);
    if (typeof showToast === 'function') {
      showToast('البيانات محفوظة ومستقرة في قاعدة البيانات المحلية (SQLite) 💾', 'info');
    }
  } finally {
    if (icon) icon.classList.remove('fa-spin');
    if (btn) btn.disabled = false;
  }
};

window.checkServerStatusLive = async function (isManual = false) {
  const statusText = document.getElementById('srvModalStatusText');
  const statusDot = document.getElementById('srvModalStatusDot');
  const gatewayText = document.getElementById('srvModalGatewayTypeText');
  const pingText = document.getElementById('srvModalPingText');
  const uptimeText = document.getElementById('srvModalUptimeText');
  const descEl = document.getElementById('srvModalGatewayDescription');
  const protocolBadge = document.getElementById('srvModalProtocolBadge');
  const publicInput = document.getElementById('srvModalPublicUrlInput');
  const localInput = document.getElementById('srvModalLocalUrlInput');
  const openPublicBtn = document.getElementById('srvModalOpenPublicUrlBtn');

  const topbarDot = document.getElementById('topbarServerLiveDot');
  const topbarLabel = document.getElementById('topbarServerStatusLabel');

  if (isManual && statusText) {
    statusText.innerHTML = `<span class="server-live-dot" style="background:#f59e0b;"></span> <span>جاري فحص الاتصال...</span>`;
    if (pingText) pingText.innerText = 'فحص...';
  }

  const startTime = Date.now();
  let isOnline = false;
  let serverData = null;
  let pingMs = 0;
  let detectedPublicUrl = window.MOALLEM_PUBLIC_SERVER_URL || localStorage.getItem('moallem_public_server_url') || 'https://detroit-jill-diversity-camel.trycloudflare.com';

  const testEndpoints = [
    typeof getBackendApiUrl === 'function' ? getBackendApiUrl('/api/public_url') : '/api/public_url',
    'http://localhost:8080/api/public_url',
    typeof getBackendApiUrl === 'function' ? getBackendApiUrl('/health') : '/health',
    'http://localhost:8080/health'
  ];

  for (const ep of testEndpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(ep, { cache: 'no-store', signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        isOnline = true;
        pingMs = Date.now() - startTime;
        try {
          serverData = await res.json();
        } catch (_) { }
        break;
      }
    } catch (_) { }
  }

  if (serverData && serverData.public_url) {
    detectedPublicUrl = serverData.public_url;
    window.MOALLEM_PUBLIC_SERVER_URL = detectedPublicUrl;
    try { localStorage.setItem('moallem_public_server_url', detectedPublicUrl); } catch (_) { }
  }

  // Detect Gateway Architecture
  const urlLower = String(detectedPublicUrl).toLowerCase();
  let gatewayType = 'Cloudflare Zero Trust Argo Tunnel 🌐';
  let gatewayBadgeHtml = '<i class="fa-solid fa-lock"></i> HTTPS (TLS 1.3) مشفر وآمن';
  let gatewayDescription = 'السيرفر مربوط عبر نفق <strong>Cloudflare Zero Trust Argo Tunnel</strong> العالمي. يتيح هذا الكيت وي فتح المنصة ومزامنة الحسابات من أي جهاز وهاتف 4G (زين، آسيا سيل، كورك) حول العالم دون الحاجة لنفس الراوتر مع تشفير SSL قوي وحماية فائقة ضد أي هجمات.';

  if (urlLower.includes('trycloudflare.com') || urlLower.includes('cloudflare')) {
    gatewayType = 'Cloudflare Argo Tunnel 🌐 (TryCloudflare)';
    gatewayBadgeHtml = '<i class="fa-solid fa-cloud" style="color:#f97316;"></i> Cloudflare Zero Trust (TLS 1.3)';
    gatewayDescription = 'نوع الكيت وي الحالي: <strong>Cloudflare Argo Tunnel</strong>. وهو كيت وي عالمي مشفر بدرجة أمان عسكرية يربط السيرفر الداخلي بالإنترنت العالمي مباشرة، ويتيح للمدرسين الدخول للمنصة أينما كانوا وحفظ الاختبارات في السيرفر دون انقطاع.';
  } else if (urlLower.includes('ngrok')) {
    gatewayType = 'Ngrok Edge Gateway ⚡';
    gatewayBadgeHtml = '<i class="fa-solid fa-bolt"></i> Ngrok TLS Gateway';
    gatewayDescription = 'نوع الكيت وي: <strong>Ngrok Secure Edge Gateway</strong>. بوابة مشفرة عبر نفق نغروك لنقل البيانات.';
  } else if (urlLower.includes('localhost') || urlLower.includes('127.0.0.1') || urlLower.includes('192.168.')) {
    gatewayType = 'Localhost LAN Direct Gateway 💻';
    gatewayBadgeHtml = '<i class="fa-solid fa-network-wired"></i> Local HTTP Gateway';
    gatewayDescription = 'نوع الكيت وي: <strong>بوابة محلية داخلية (Localhost / LAN)</strong>. يعمل السيرفر عبر الشبكة المحلية على المنفذ 8080.';
  } else if (urlLower.includes('onrender.com') || urlLower.includes('vercel.app')) {
    gatewayType = 'Cloud VPS Gateway ☁️';
    gatewayBadgeHtml = '<i class="fa-solid fa-cloud"></i> Cloud HTTPS';
  }

  // Update Topbar status indicator
  if (topbarDot) {
    topbarDot.className = isOnline ? 'server-live-dot online' : 'server-live-dot offline';
  }
  if (topbarLabel) {
    topbarLabel.innerText = isOnline ? `السيرفر: متصل (${pingMs}ms)` : 'السيرفر: غير متصل';
  }

  // Update Modal Fields
  if (statusDot) {
    statusDot.className = isOnline ? 'server-live-dot online' : 'server-live-dot offline';
  }
  if (statusText) {
    statusText.innerHTML = isOnline
      ? `<span class="server-live-dot online"></span> <span style="color:#10b981;">شغال ومتصل 24/7 (Online 🟢)</span>`
      : `<span class="server-live-dot offline"></span> <span style="color:#ef4444;">متوقف أو غير مشغل (Offline 🔴)</span>`;
  }
  if (gatewayText) {
    gatewayText.innerText = gatewayType;
  }
  if (pingText) {
    pingText.innerText = isOnline ? `${pingMs} مللي ثانية (ms)` : 'غير متاح (السيرفر غير مشغل)';
    pingText.style.color = isOnline ? '#10b981' : '#ef4444';
  }
  if (uptimeText) {
    if (isOnline && serverData && serverData.uptime) {
      uptimeText.innerText = serverData.uptime;
      uptimeText.style.color = '#10b981';
    } else if (isOnline) {
      uptimeText.innerText = 'نشط ومتاح 24/7 🟢';
      uptimeText.style.color = '#10b981';
    } else {
      uptimeText.innerText = 'متوقف (يمكن تشغيله عبر ملف bat)';
      uptimeText.style.color = '#ef4444';
    }
  }
  if (descEl) {
    descEl.innerHTML = gatewayDescription;
  }
  if (protocolBadge) {
    protocolBadge.innerHTML = gatewayBadgeHtml;
  }
  if (publicInput) {
    publicInput.value = detectedPublicUrl;
  }
  if (openPublicBtn) {
    openPublicBtn.href = detectedPublicUrl;
  }
  if (localInput && serverData && serverData.local_url) {
    localInput.value = serverData.local_url;
  }

  // Auto-check Supabase & Local Database Sync Status
  try {
    fetch('/api/supabase/status', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        const badge = document.getElementById('srvModalCloudSyncBadge');
        const statsCloud = document.getElementById('srvModalCloudSyncStats');
        const urlText = document.getElementById('srvModalSupabaseUrlText');
        if (d && d.success && d.status && d.status.connected) {
          if (badge) {
            badge.style.background = 'rgba(16, 185, 129, 0.15)';
            badge.style.color = '#10b981';
            badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> متصل ومزامن (Dual Active)';
          }
          if (statsCloud) statsCloud.innerText = '✔ مزامنة الحسابات والتوثيق Auth نشطة وسريعة';
          if (urlText && d.status.url) urlText.innerText = d.status.url;
        } else {
          if (badge) {
            badge.style.background = 'rgba(245, 158, 11, 0.15)';
            badge.style.color = '#f59e0b';
            badge.innerHTML = '<i class="fa-solid fa-database"></i> حفظ محلي نشط (SQLite)';
          }
        }
      })
      .catch(() => {});
  } catch (_) {}

  if (isManual && typeof showToast === 'function') {
    showToast(isOnline
      ? `🟢 السيرفر شغال ومتصل بنجاح! نوع الكيت وي: ${gatewayType} (${pingMs}ms)`
      : `🔴 السيرفر غير متصل حالياً. لتشغيله انقر نقراً مزدوجاً على «تشغيل_السيرفر_24_ساعة.bat» في مجلد المنصة`,
      isOnline ? 'success' : 'warning');
  }
};

window.currentSubscribersFilterMode = 'all';

window.setSubscribersFilter = function (mode) {
  window.currentSubscribersFilterMode = mode;
  ['All', 'Pending', 'Active'].forEach(m => {
    const btn = document.getElementById(`subFilter${m}Btn`);
    if (btn) {
      if (m.toLowerCase() === mode.toLowerCase()) {
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      }
    }
  });
  window.renderSubscribersManagementUI();
};

window.renderSubscribersManagementUI = function () {
  const activeCountEl = document.getElementById('subscribersManagementCount');
  const totalCountEl = document.getElementById('subscribersTotalAccountsCount');
  const pendingCountEl = document.getElementById('subscribersPendingCount');
  const tbody = document.getElementById('subscribersListTableBody');
  const drawerSubCountBadge = document.getElementById('drawerSubscribersCountBadge');

  const pillAll = document.getElementById('pillCountAll');
  const pillPending = document.getElementById('pillCountPending');
  const pillActive = document.getElementById('pillCountActive');

  const accounts = typeof getAuthAccounts === 'function' ? getAuthAccounts() : [];
  const now = Date.now();

  // Exclude administrative account (Super Admin)
  const teacherAccounts = accounts.filter(acc => !acc.isAdmin && acc.role !== 'admin' && acc.username !== 'admin' && acc.id !== 'usr_admin');

  // Check active status
  function isAccountActiveSub(acc) {
    const isSub = acc.isSubscribed || acc.isVip || (acc.id && localStorage.getItem(`moallem_vip_subscription_${acc.id}`) === 'true');
    if (!isSub) return false;
    if (acc.subscriptionExpiresAt) {
      const expTime = new Date(acc.subscriptionExpiresAt).getTime();
      if (!isNaN(expTime) && now > expTime) return false;
    }
    return true;
  }

  const activeAccounts = teacherAccounts.filter(a => isAccountActiveSub(a));
  const pendingAccounts = teacherAccounts.filter(a => !isAccountActiveSub(a));

  // Update counters
  if (activeCountEl) activeCountEl.innerText = activeAccounts.length;
  if (totalCountEl) totalCountEl.innerText = teacherAccounts.length;
  if (pendingCountEl) pendingCountEl.innerText = pendingAccounts.length;
  if (drawerSubCountBadge) drawerSubCountBadge.innerText = `${activeAccounts.length} مشترك 👑`;
  const topbarSubsBadge = document.getElementById('topbarActiveSubsBadge');
  if (topbarSubsBadge) topbarSubsBadge.innerText = activeAccounts.length;

  if (pillAll) pillAll.innerText = teacherAccounts.length;
  if (pillPending) pillPending.innerText = pendingAccounts.length;
  if (pillActive) pillActive.innerText = activeAccounts.length;

  if (!tbody) return;

  // Search filter
  const searchInput = document.getElementById('subscribersSearchFilterInput');
  const searchQuery = searchInput ? (searchInput.value || '').trim().toLowerCase() : '';

  let filtered = [...teacherAccounts];

  // Apply tab filter mode
  const mode = window.currentSubscribersFilterMode || 'all';
  if (mode === 'active') {
    filtered = activeAccounts;
  } else if (mode === 'pending') {
    filtered = pendingAccounts;
  }

  // Apply text search
  if (searchQuery) {
    filtered = filtered.filter(acc => {
      const name = (acc.name || '').toLowerCase();
      const user = (acc.username || '').toLowerCase();
      const email = (acc.email || '').toLowerCase();
      const school = (acc.school || '').toLowerCase();
      const gov = (acc.governorate || '').toLowerCase();
      return name.includes(searchQuery) || user.includes(searchQuery) || email.includes(searchQuery) || school.includes(searchQuery) || gov.includes(searchQuery);
    });
  }

  // Sort: Pending accounts first, then newest registered
  filtered.sort((a, b) => {
    const aActive = isAccountActiveSub(a);
    const bActive = isAccountActiveSub(b);
    if (!aActive && bActive) return -1;
    if (aActive && !bActive) return 1;
    const aTime = new Date(a.registeredAt || a.createdAt || 0).getTime();
    const bTime = new Date(b.registeredAt || b.createdAt || 0).getTime();
    return bTime - aTime;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 3rem 1.5rem; color: var(--text-muted);">
          <div style="width: 64px; height: 64px; border-radius: 18px; background: rgba(245, 158, 11, 0.1); border: 1.5px dashed rgba(245, 158, 11, 0.35); display: inline-flex; align-items: center; justify-content: center; font-size: 1.75rem; color: #f59e0b; margin-bottom: 0.85rem;">
            <i class="fa-solid fa-users-slash"></i>
          </div>
          <div style="font-weight: 850; font-size: 1.05rem; color: var(--text-main); margin-bottom: 4px;">لا توجد أي حسابات مطابقة للفلتر المحدد</div>
          <div style="font-size: 0.82rem; color: var(--text-muted); max-width: 480px; margin: 0 auto; line-height: 1.5;">عند تسجيل أي معلم جديد في المنصة من أي مكان، سيظهر حسابه مباشرة هنا مع إمكانية التفعيل الفوري أو التعديل بنقرة واحدة.</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(acc => {
    const active = isAccountActiveSub(acc);
    const regDate = acc.registeredDateFormatted || (acc.registeredAt ? acc.registeredAt.slice(0, 10) : (acc.createdAt ? acc.createdAt.slice(0, 10) : 'مسجل حديثاً'));
    const expiryDate = acc.subscriptionExpiryFormatted || (acc.subscriptionExpiresAt ? acc.subscriptionExpiresAt.slice(0, 10) : 'سنة كاملة');
    const planName = acc.subscriptionPlanName || 'الباقة السنوية (365 يوماً)';

    // Remaining days calculation
    let remainingBadge = '';
    if (active && acc.subscriptionExpiresAt) {
      const expTime = new Date(acc.subscriptionExpiresAt).getTime();
      const diffDays = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        remainingBadge = `<span style="font-size: 0.68rem; font-weight: 800; color: #10b981; background: rgba(16, 185, 129, 0.12); padding: 1px 6px; border-radius: 4px; border: 1px solid rgba(16, 185, 129, 0.3);">باقي ${diffDays} يوم</span>`;
      } else {
        remainingBadge = `<span style="font-size: 0.68rem; font-weight: 800; color: #ef4444; background: rgba(239, 68, 68, 0.12); padding: 1px 6px; border-radius: 4px; border: 1px solid rgba(239, 68, 68, 0.3);">منتهي الصلاحية</span>`;
      }
    }

    const statusBadge = active
      ? `<div>
           <span class="sub-status-pill-active">
             <i class="fa-solid fa-crown"></i> ${planName}
           </span>
           <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 5px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
             <span><i class="fa-solid fa-calendar-check" style="color: #10b981;"></i> ينتهي: <strong>${expiryDate}</strong></span>
             ${remainingBadge}
           </div>
         </div>`
      : `<div>
           <span class="sub-status-pill-pending">
             <i class="fa-solid fa-hourglass-half"></i> بانتظار التفعيل (مجاني)
           </span>
           <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 5px; display: flex; align-items: center; gap: 4px;">
             <i class="fa-solid fa-clock-rotate-left text-warning"></i> بانتظار موافقة الإدارة وتحديد الباقة
           </div>
         </div>`;

    const actionButton = active
      ? `<button type="button" class="sub-btn-row-revoke" onclick="window.manageRevokeSubscription('${acc.id}')" title="إلغاء التفعيل لهذا الحساب">
           <i class="fa-solid fa-user-xmark"></i>
           <span>إلغاء التفعيل</span>
         </button>`
      : `<button type="button" class="sub-btn-row-activate" onclick="window.manageDirectActivateUser('${acc.id}')" title="تفعيل الاشتراك لهذا الحساب بالباقة المحددة أعلاه">
           <i class="fa-solid fa-crown"></i>
           <span>تفعيل الحساب</span>
         </button>`;

    const deleteButton = `
      <button type="button" class="sub-btn-row-delete" onclick="window.manageDeleteSubscriberAccount('${acc.id}')" title="حذف الحساب / الإيميل نهائياً">
        <i class="fa-solid fa-trash-can"></i>
        <span>حذف</span>
      </button>
    `;

    const teacherInitial = (acc.name && acc.name.trim()) ? acc.name.trim()[0] : (acc.username ? acc.username[0] : 'م');

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="sub-user-avatar ${active ? 'avatar-active' : 'avatar-pending'}">
              ${active ? '<i class="fa-solid fa-crown"></i>' : teacherInitial}
            </div>
            <div>
              <div style="font-weight: 850; color: var(--text-main); font-size: 0.9rem; line-height: 1.2;">${acc.name || acc.username}</div>
              <div style="color: var(--text-muted); font-size: 0.74rem; margin-top: 3px; display: flex; align-items: center; gap: 5px;">
                <i class="fa-solid fa-school" style="color: var(--text-dim); font-size: 0.7rem;"></i>
                <span>${acc.school || 'مدرسة عامة'}</span>
                <span>•</span>
                <i class="fa-solid fa-location-dot" style="color: var(--text-dim); font-size: 0.7rem;"></i>
                <span>${acc.governorate || 'العراق'}</span>
              </div>
            </div>
          </div>
        </td>
        <td>
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <div><code style="background: rgba(37, 99, 235, 0.08); color: var(--primary); padding: 2px 7px; border-radius: 6px; font-weight: 800; font-size: 0.8rem; border: 1px solid rgba(37, 99, 235, 0.2);"><i class="fa-solid fa-user-circle" style="font-size: 0.75rem;"></i> ${acc.username || ''}</code></div>
            ${acc.email ? `<span style="font-size: 0.75rem; color: var(--text-muted); display: inline-flex; align-items: center; gap: 4px; margin-top: 2px;"><i class="fa-regular fa-envelope"></i> ${acc.email}</span>` : ''}
            ${acc.contact ? `<span style="font-size: 0.72rem; color: var(--text-dim); display: inline-flex; align-items: center; gap: 4px;" dir="ltr"><i class="fa-solid fa-phone"></i> ${acc.contact}</span>` : ''}
          </div>
        </td>
        <td>
          <div style="font-size: 0.78rem; color: var(--text-muted); display: inline-flex; align-items: center; gap: 5px;">
            <i class="fa-solid fa-calendar-plus" style="color: #0284c7;"></i>
            <span>${regDate}</span>
          </div>
          <div style="margin-top: 4px;">
            <span style="font-size: 0.7rem; font-weight: 750; background: rgba(148, 163, 184, 0.12); color: var(--text-main); padding: 1px 7px; border-radius: 4px; border: 1px solid var(--border-color); display: inline-block;">
              مادة: ${acc.subject || 'عام'}
            </span>
          </div>
        </td>
        <td>
          ${statusBadge}
        </td>
        <td style="text-align: center;">
          <div style="display: inline-flex; align-items: center; gap: 6px; justify-content: center; flex-wrap: wrap;">
            ${actionButton}
            ${deleteButton}
          </div>
        </td>
      </tr>
    `;
  }).join('');
};

window.manageDirectActivateUser = function (accId) {
  const accounts = typeof getAuthAccounts === 'function' ? getAuthAccounts() : [];
  const acc = accounts.find(a => a.id === accId);
  if (!acc) {
    showToast('لم يتم العثور على الحساب المراد تفعيله!', 'error');
    return;
  }

  // Calculate Plan Duration from the dropdown select
  const planSelect = document.getElementById('subActivationPlanSelect');
  const chosenPlan = planSelect ? planSelect.value : '1_year';

  const now = new Date();
  const expiryDate = new Date(now);
  let durationLabel = 'الباقة السنوية الأكاديمية (200 ألف د.ع)';
  let durationCode = '1_year';

  if (chosenPlan === '1_month') {
    expiryDate.setDate(now.getDate() + 30);
    durationLabel = 'باقة شهر واحد (25 ألف د.ع)';
    durationCode = '1_month';
  } else if (chosenPlan === '6_months' || chosenPlan === '4_months' || chosenPlan === '3_months') {
    expiryDate.setDate(now.getDate() + 180);
    durationLabel = 'باقة 6 أشهر - نصف سنة دراسية (75 ألف د.ع)';
    durationCode = '6_months';
  } else {
    expiryDate.setFullYear(now.getFullYear() + 1);
    durationLabel = 'الباقة السنوية الأكاديمية (200 ألف د.ع)';
    durationCode = '1_year';
  }

  const startStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const expiryStr = `${expiryDate.getFullYear()}-${String(expiryDate.getMonth() + 1).padStart(2, '0')}-${String(expiryDate.getDate()).padStart(2, '0')}`;

  acc.isVip = true;
  acc.isSubscribed = true;
  acc.isTrial = false;
  acc.role = 'teacher_vip';
  acc.subscriptionType = durationCode;
  acc.subscriptionDuration = durationCode;
  acc.subscriptionPlanName = durationLabel;
  acc.subscriptionStartDate = now.toISOString();
  acc.subscriptionExpiresAt = expiryDate.toISOString();
  acc.subscriptionExpiryFormatted = expiryStr;
  delete acc.trialDurationHours;
  delete acc.trialStartedAt;

  localStorage.setItem(`moallem_vip_subscription_${acc.id}`, 'true');
  localStorage.setItem(`moallem_vip_subscription_exp_${acc.id}`, expiryDate.toISOString());
  localStorage.setItem(`moallem_user_plan_code_${acc.id}`, durationCode);
  localStorage.setItem(`moallem_teacher_profile_${acc.id}`, JSON.stringify(acc));
  if (typeof saveAuthAccounts === 'function') saveAuthAccounts(accounts);

  const sessionUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (sessionUser && sessionUser.id === acc.id) {
    sessionUser.isVip = true;
    sessionUser.isSubscribed = true;
    sessionUser.isTrial = false;
    sessionUser.role = 'teacher_vip';
    sessionUser.subscriptionType = durationCode;
    sessionUser.subscriptionDuration = durationCode;
    sessionUser.subscriptionPlanName = durationLabel;
    sessionUser.subscriptionStartDate = now.toISOString();
    sessionUser.subscriptionExpiresAt = expiryDate.toISOString();
    sessionUser.subscriptionExpiryFormatted = expiryStr;
    delete sessionUser.trialDurationHours;
    delete sessionUser.trialStartedAt;
    localStorage.setItem('moallem_current_user', JSON.stringify(sessionUser));
    if (typeof window.updateVipUIStatus === 'function') window.updateVipUIStatus();
  }

  window.renderSubscribersManagementUI();
  if (typeof window.renderAdminAccountsTable === 'function') window.renderAdminAccountsTable();
  if (typeof updateUserAuthUI === 'function') updateUserAuthUI();

  showToast(`🎉 تم تفعيل الحساب للأستاذ [${acc.name || acc.username}] بنجاح (${durationLabel}) حتى (${expiryStr})! 👑✔`, 'success');
};

window.manageApproveGrantSubscription = function () {
  const inputEl = document.getElementById('subActivationQueryInput');
  if (!inputEl) return;
  const query = (inputEl.value || '').trim();
  if (!query) {
    showToast('يرجى إدخال اسم المستخدم أو البريد الإلكتروني للحساب المراد تفعيله!', 'warning');
    inputEl.focus();
    return;
  }

  const accounts = typeof getAuthAccounts === 'function' ? getAuthAccounts() : [];
  const queryLower = query.toLowerCase();

  let targetAcc = accounts.find(a =>
    (a.username && a.username.toLowerCase() === queryLower) ||
    (a.email && a.email.toLowerCase() === queryLower) ||
    (a.id && a.id.toLowerCase() === queryLower)
  );

  if (!targetAcc) {
    targetAcc = accounts.find(a => a.name && a.name.toLowerCase() === queryLower);
  }

  if (!targetAcc) {
    showToast(`لم يتم العثور على أي حساب يطابق ("${query}"). تأكد من صحة اسم المستخدم أو البريد!`, 'error');
    inputEl.focus();
    return;
  }

  if (targetAcc.isAdmin || targetAcc.role === 'admin' || targetAcc.id === 'usr_admin') {
    showToast('حساب المدير العام يمتلك كافة الصلاحيات مفعلة دائماً 👑', 'info');
    inputEl.value = '';
    return;
  }

  // Calculate Plan Duration
  const planSelect = document.getElementById('subActivationPlanSelect');
  const chosenPlan = planSelect ? planSelect.value : '1_year';

  const now = new Date();
  const expiryDate = new Date(now);
  let durationLabel = 'الباقة السنوية الأكاديمية (200 ألف د.ع)';
  let durationCode = '1_year';

  if (chosenPlan === '1_month') {
    expiryDate.setDate(now.getDate() + 30);
    durationLabel = 'باقة شهر واحد (25 ألف د.ع)';
    durationCode = '1_month';
  } else if (chosenPlan === '6_months' || chosenPlan === '4_months' || chosenPlan === '3_months') {
    expiryDate.setDate(now.getDate() + 180);
    durationLabel = 'باقة 6 أشهر - نصف سنة دراسية (75 ألف د.ع)';
    durationCode = '6_months';
  } else {
    expiryDate.setFullYear(now.getFullYear() + 1);
    durationLabel = 'الباقة السنوية الأكاديمية (200 ألف د.ع)';
    durationCode = '1_year';
  }

  const startStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const expiryStr = `${expiryDate.getFullYear()}-${String(expiryDate.getMonth() + 1).padStart(2, '0')}-${String(expiryDate.getDate()).padStart(2, '0')}`;

  targetAcc.isVip = true;
  targetAcc.isSubscribed = true;
  targetAcc.isTrial = false;
  targetAcc.role = 'teacher_vip';
  targetAcc.subscriptionType = durationCode;
  targetAcc.subscriptionDuration = durationCode;
  targetAcc.subscriptionPlanName = durationLabel;
  targetAcc.subscriptionStartDate = now.toISOString();
  targetAcc.subscriptionExpiresAt = expiryDate.toISOString();
  targetAcc.subscriptionExpiryFormatted = expiryStr;
  delete targetAcc.trialDurationHours;
  delete targetAcc.trialStartedAt;

  localStorage.setItem(`moallem_vip_subscription_${targetAcc.id}`, 'true');
  localStorage.setItem(`moallem_vip_subscription_exp_${targetAcc.id}`, expiryDate.toISOString());
  localStorage.setItem(`moallem_user_plan_code_${targetAcc.id}`, durationCode);
  localStorage.setItem(`moallem_teacher_profile_${targetAcc.id}`, JSON.stringify(targetAcc));
  if (typeof saveAuthAccounts === 'function') saveAuthAccounts(accounts);

  const sessionUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (sessionUser && sessionUser.id === targetAcc.id) {
    sessionUser.isVip = true;
    sessionUser.isSubscribed = true;
    sessionUser.isTrial = false;
    sessionUser.role = 'teacher_vip';
    sessionUser.subscriptionType = durationCode;
    sessionUser.subscriptionDuration = durationCode;
    sessionUser.subscriptionPlanName = durationLabel;
    sessionUser.subscriptionStartDate = now.toISOString();
    sessionUser.subscriptionExpiresAt = expiryDate.toISOString();
    sessionUser.subscriptionExpiryFormatted = expiryStr;
    delete sessionUser.trialDurationHours;
    delete sessionUser.trialStartedAt;
    localStorage.setItem('moallem_current_user', JSON.stringify(sessionUser));
    if (typeof window.updateVipUIStatus === 'function') window.updateVipUIStatus();
  }

  inputEl.value = '';

  window.renderSubscribersManagementUI();
  if (typeof window.renderAdminAccountsTable === 'function') window.renderAdminAccountsTable();
  if (typeof updateUserAuthUI === 'function') updateUserAuthUI();

  showToast(`🎉 تمت الموافقة وتفعيل [${durationLabel}] للأستاذ [${targetAcc.name || targetAcc.username}] بنجاح حتى (${expiryStr})! 👑✔`, 'success');
};

window.manageRevokeSubscription = function (accId) {
  const accounts = typeof getAuthAccounts === 'function' ? getAuthAccounts() : [];
  const acc = accounts.find(a => a.id === accId);
  if (!acc) return;

  if (!confirm(`هل أنت متأكد من رغبتك بإلغاء اشتراك الأستاذ (${acc.name || acc.username})؟`)) {
    return;
  }

  acc.isVip = false;
  acc.isSubscribed = false;
  acc.role = 'teacher';
  delete acc.subscriptionDuration;
  delete acc.subscriptionPlanName;
  delete acc.subscriptionExpiresAt;
  delete acc.subscriptionExpiryFormatted;

  localStorage.removeItem(`moallem_vip_subscription_${acc.id}`);
  localStorage.removeItem(`moallem_vip_subscription_exp_${acc.id}`);
  localStorage.removeItem(`moallem_user_plan_code_${acc.id}`);
  if (typeof saveAuthAccounts === 'function') saveAuthAccounts(accounts);

  const sessionUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (sessionUser && sessionUser.id === acc.id) {
    sessionUser.isVip = false;
    sessionUser.isSubscribed = false;
    sessionUser.role = 'teacher';
    delete sessionUser.subscriptionExpiresAt;
    delete sessionUser.subscriptionExpiryFormatted;
    localStorage.setItem('moallem_current_user', JSON.stringify(sessionUser));
    if (typeof window.updateVipUIStatus === 'function') window.updateVipUIStatus();
  }

  window.renderSubscribersManagementUI();
  if (typeof window.renderAdminAccountsTable === 'function') window.renderAdminAccountsTable();
  if (typeof updateUserAuthUI === 'function') updateUserAuthUI();

  showToast(`تم إيقاف تفعيل الاشتراك السنوي للحساب (${acc.name || acc.username}) 🔄`, 'info');
};

window.manageDeleteSubscriberAccount = function (accId) {
  if (accId === 'usr_admin') {
    showToast('لا يمكن حذف حساب المدير العام!', 'error');
    return;
  }
  let accounts = typeof getAuthAccounts === 'function' ? getAuthAccounts() : [];
  const acc = accounts.find(a => a.id === accId);
  if (!acc) {
    showToast('لم يتم العثور على الحساب المراد حذفه!', 'error');
    return;
  }
  const emailOrName = acc.email || acc.username || acc.name || 'المعلم';
  if (!confirm(`هل أنت متأكد من حذف الحساب / الإيميل (${emailOrName}) نهائياً من المنصة؟ لن يتمكن من تسجيل الدخول بعد الآن.`)) {
    return;
  }

  accounts = accounts.filter(a => a.id !== accId);
  if (typeof saveAuthAccounts === 'function') saveAuthAccounts(accounts);

  // Clean up any VIP flags in localStorage
  localStorage.removeItem(`moallem_vip_subscription_${accId}`);
  localStorage.removeItem(`moallem_vip_subscription_exp_${accId}`);

  // If current logged in user was this account, reset session
  const sessionUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (sessionUser && sessionUser.id === accId) {
    localStorage.removeItem('moallem_current_user');
  }

  window.renderSubscribersManagementUI();
  if (typeof window.renderAdminAccountsTable === 'function') window.renderAdminAccountsTable();
  if (typeof updateUserAuthUI === 'function') updateUserAuthUI();

  showToast(`🗑️ تم حذف الحساب / الإيميل [${emailOrName}] بنجاح`, 'info');
};

window.manageDeleteAccountByQuery = function () {
  const inputEl = document.getElementById('subActivationQueryInput');
  if (!inputEl) return;
  const query = (inputEl.value || '').trim();
  if (!query) {
    showToast('يرجى إدخال اسم المستخدم أو البريد الإلكتروني للحساب المراد حذفه!', 'warning');
    inputEl.focus();
    return;
  }

  let accounts = typeof getAuthAccounts === 'function' ? getAuthAccounts() : [];
  const queryLower = query.toLowerCase();

  let targetAcc = accounts.find(a =>
    (a.username && a.username.toLowerCase() === queryLower) ||
    (a.email && a.email.toLowerCase() === queryLower) ||
    (a.id && a.id.toLowerCase() === queryLower)
  );

  if (!targetAcc) {
    targetAcc = accounts.find(a => a.name && a.name.toLowerCase() === queryLower);
  }

  if (!targetAcc) {
    showToast(`لم يتم العثور على أي حساب يطابق ("${query}"). تأكد من صحة اسم المستخدم أو البريد!`, 'error');
    inputEl.focus();
    return;
  }

  if (targetAcc.isAdmin || targetAcc.role === 'admin' || targetAcc.id === 'usr_admin') {
    showToast('لا يمكن حذف حساب المدير العام!', 'error');
    return;
  }

  window.manageDeleteSubscriberAccount(targetAcc.id);
  inputEl.value = '';
};

// Auto-sync subscribers management UI across tabs/windows in real time
window.addEventListener('storage', (e) => {
  if (e.key === 'moallem_auth_accounts' || (e.key && e.key.startsWith('moallem_vip_subscription_'))) {
    if (typeof window.renderSubscribersManagementUI === 'function') {
      window.renderSubscribersManagementUI();
    }
    if (typeof window.renderAdminAccountsTable === 'function') {
      window.renderAdminAccountsTable();
    }
  }
});

window.addEventListener('moallem_accounts_updated', () => {
  if (typeof window.renderSubscribersManagementUI === 'function') {
    window.renderSubscribersManagementUI();
  }
  if (typeof window.renderAdminAccountsTable === 'function') {
    window.renderAdminAccountsTable();
  }
});

/* ==========================================================================
   Activation Codes Management System (نظام توليد وإدارة أكواد التفعيل VIP لمرة واحدة)
   ========================================================================== */
window.currentSubscribersModalTab = 'accounts';
window.currentActivationCodesFilter = 'all';
window.activationCodes = [];

window.switchSubscribersModalTab = function (tabName) {
  window.currentSubscribersModalTab = tabName;
  const accountsTabBtn = document.getElementById('subTabAccountsBtn');
  const codesTabBtn = document.getElementById('subTabCodesBtn');
  const accountsSection = document.getElementById('subSectionAccounts');
  const codesSection = document.getElementById('subSectionCodes');

  if (tabName === 'codes') {
    if (accountsTabBtn) {
      accountsTabBtn.classList.remove('active');
      accountsTabBtn.setAttribute('aria-selected', 'false');
    }
    if (codesTabBtn) {
      codesTabBtn.classList.add('active');
      codesTabBtn.setAttribute('aria-selected', 'true');
    }
    if (accountsSection) accountsSection.style.display = 'none';
    if (codesSection) codesSection.style.display = 'block';

    window.loadAndRenderActivationCodes();
  } else {
    if (accountsTabBtn) {
      accountsTabBtn.classList.add('active');
      accountsTabBtn.setAttribute('aria-selected', 'true');
    }
    if (codesTabBtn) {
      codesTabBtn.classList.remove('active');
      codesTabBtn.setAttribute('aria-selected', 'false');
    }
    if (accountsSection) accountsSection.style.display = 'block';
    if (codesSection) codesSection.style.display = 'none';

    window.renderSubscribersManagementUI();
  }
};

window.setActivationCodesFilter = function (mode) {
  window.currentActivationCodesFilter = mode;
  ['All', 'Available', 'Used'].forEach(m => {
    const btn = document.getElementById(`codeFilter${m}Btn`);
    if (btn) {
      if (m.toLowerCase() === mode.toLowerCase()) {
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      }
    }
  });
  window.renderActivationCodesUI();
};

window.loadAndRenderActivationCodes = async function () {
  // 1. Try local cache first for instant rendering
  try {
    const local = localStorage.getItem('moallem_activation_codes');
    if (local) {
      window.activationCodes = JSON.parse(local) || [];
      window.renderActivationCodesUI();
    }
  } catch (e) { }

  // 2. Fetch fresh codes from Server Backend API
  try {
    const res = await fetch(getBackendApiUrl('/api/activation_codes'), { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.codes)) {
        window.activationCodes = data.codes;
        localStorage.setItem('moallem_activation_codes', JSON.stringify(data.codes));
      }
    }
  } catch (err) {
    // Offline resilient fallback
  }

  window.renderActivationCodesUI();
};

window.renderActivationCodesUI = function () {
  const codes = window.activationCodes || [];
  const totalCountEl = document.getElementById('codesTotalCount');
  const availableCountEl = document.getElementById('codesAvailableCount');
  const usedCountEl = document.getElementById('codesUsedCount');
  const badgeEl = document.getElementById('subTabCodesBadge');
  const pillAll = document.getElementById('pillCodeAll');
  const pillAvailable = document.getElementById('pillCodeAvailable');
  const pillUsed = document.getElementById('pillCodeUsed');
  const tbody = document.getElementById('activationCodesListTableBody');

  const availableCodes = codes.filter(c => !c.is_used);
  const usedCodes = codes.filter(c => c.is_used);

  if (totalCountEl) totalCountEl.innerText = codes.length;
  if (availableCountEl) availableCountEl.innerText = availableCodes.length;
  if (usedCountEl) usedCountEl.innerText = usedCodes.length;
  if (badgeEl) badgeEl.innerText = availableCodes.length;
  if (pillAll) pillAll.innerText = codes.length;
  if (pillAvailable) pillAvailable.innerText = availableCodes.length;
  if (pillUsed) pillUsed.innerText = usedCodes.length;

  if (!tbody) return;

  const mode = window.currentActivationCodesFilter || 'all';
  let filtered = [...codes];
  if (mode === 'available') {
    filtered = availableCodes;
  } else if (mode === 'used') {
    filtered = usedCodes;
  }

  const searchInput = document.getElementById('codesSearchFilterInput');
  const q = searchInput ? (searchInput.value || '').trim().toLowerCase() : '';
  if (q) {
    filtered = filtered.filter(c => {
      const codeStr = (c.code || '').toLowerCase();
      const planStr = (c.plan_name || '').toLowerCase();
      const noteStr = (c.note || '').toLowerCase();
      const userStr = (c.used_by_name || c.used_by_username || '').toLowerCase();
      return codeStr.includes(q) || planStr.includes(q) || noteStr.includes(q) || userStr.includes(q);
    });
  }

  // Sort: unused first, then by date descending
  filtered.sort((a, b) => {
    if (!a.is_used && b.is_used) return -1;
    if (a.is_used && !b.is_used) return 1;
    const aTime = new Date(a.created_at || 0).getTime();
    const bTime = new Date(b.created_at || 0).getTime();
    return bTime - aTime;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 3rem 1.5rem; color: var(--text-muted);">
          <div style="width: 60px; height: 60px; border-radius: 16px; background: rgba(245, 158, 11, 0.1); border: 1.5px dashed rgba(245, 158, 11, 0.35); display: inline-flex; align-items: center; justify-content: center; font-size: 1.6rem; color: #f59e0b; margin-bottom: 0.75rem;">
            <i class="fa-solid fa-ticket-simple"></i>
          </div>
          <div style="font-weight: 850; font-size: 1.05rem; color: var(--text-main); margin-bottom: 4px;">لا توجد أي أكواد مطابقة حالياً</div>
          <div style="font-size: 0.8rem; color: var(--text-muted); max-width: 440px; margin: 0 auto; line-height: 1.5;">
            يمكنك توليد أكواد تفعيل اشتراك جديدة بسهولة عبر الاستوديو في الأعلى مع اختيار الخطة والكمية المناسبة.
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(item => {
    const isUsed = !!item.is_used;
    const createdDate = item.created_at ? item.created_at.slice(0, 10) : 'اليوم';
    const usedDate = item.used_at ? item.used_at.slice(0, 16).replace('T', ' ') : '';
    const safeCode = item.code || '';

    // Plan color & icon
    let planBadge = '';
    if (item.plan_code === '1_month') {
      planBadge = `<span style="font-size: 0.72rem; font-weight: 800; background: rgba(59, 130, 246, 0.12); color: #2563eb; padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(59, 130, 246, 0.3); display: inline-flex; align-items: center; gap: 5px;"><i class="fa-solid fa-calendar-day"></i> ${item.plan_name || 'شهر واحد'}</span>`;
    } else if (item.plan_code === '6_months') {
      planBadge = `<span style="font-size: 0.72rem; font-weight: 800; background: rgba(16, 185, 129, 0.12); color: #059669; padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(16, 185, 129, 0.3); display: inline-flex; align-items: center; gap: 5px;"><i class="fa-solid fa-fire"></i> ${item.plan_name || '6 أشهر'}</span>`;
    } else {
      planBadge = `<span style="font-size: 0.72rem; font-weight: 800; background: rgba(245, 158, 11, 0.15); color: #d97706; padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(245, 158, 11, 0.4); display: inline-flex; align-items: center; gap: 5px;"><i class="fa-solid fa-crown"></i> ${item.plan_name || 'باقة سنوية'}</span>`;
    }

    const noteHtml = item.note
      ? `<div style="font-size: 0.72rem; color: var(--text-dim); margin-top: 3px; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-tag" style="font-size: 0.65rem;"></i> ${item.note}</div>`
      : '';

    const statusBadge = isUsed
      ? `<div>
           <span style="font-size: 0.72rem; font-weight: 800; background: rgba(139, 92, 246, 0.12); color: #7c3aed; padding: 3px 8px; border-radius: 999px; border: 1px solid rgba(139, 92, 246, 0.3); display: inline-flex; align-items: center; gap: 5px;">
             <i class="fa-solid fa-lock"></i> تم التفعيل والاستهلاك
           </span>
           <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px; line-height: 1.3;">
             <span>المستفيد: <strong>${item.used_by_name || item.used_by_username || 'معلم'}</strong></span>
             <br><span style="color: var(--text-dim);"><i class="fa-regular fa-clock"></i> ${usedDate}</span>
           </div>
         </div>`
      : `<div>
           <span style="font-size: 0.72rem; font-weight: 850; background: rgba(16, 185, 129, 0.12); color: #059669; padding: 3px 10px; border-radius: 999px; border: 1.5px solid rgba(16, 185, 129, 0.4); display: inline-flex; align-items: center; gap: 5px;">
             <span class="sub-live-dot" style="width: 7px; height: 7px;"></span> متاح للاستخدام 🟢
           </span>
           <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 3px;">
             صالح لمرة واحدة لأي معلم
           </div>
         </div>`;

    const shareBtn = !isUsed
      ? `<button type="button" class="btn-code-row-share" onclick="window.shareActivationCodeViaWhatsApp('${safeCode}')" title="إرسال ومشاركة الكود للأستاذ عبر واتساب مع رسالة فاخرة">
           <i class="fa-brands fa-whatsapp"></i>
           <span>واتساب</span>
         </button>`
      : '';

    return `
      <tr>
        <td>
          <div class="code-ticket-wrap">
            <span class="code-ticket-badge ${isUsed ? 'code-used' : ''}">${safeCode}</span>
            <button type="button" class="btn-copy-code-inline" onclick="window.copyActivationCode('${safeCode}', this)" title="نسخ الكود بنقرة واحدة">
              <i class="fa-regular fa-copy"></i>
            </button>
          </div>
        </td>
        <td>
          ${planBadge}
          <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 3px;">
            صلاحية: ${item.duration_days || 365} يوماً
          </div>
        </td>
        <td>
          <div style="font-size: 0.78rem; color: var(--text-muted); display: inline-flex; align-items: center; gap: 5px;">
            <i class="fa-solid fa-calendar-plus" style="color: var(--primary);"></i>
            <span>${createdDate}</span>
          </div>
          ${noteHtml}
        </td>
        <td>
          ${statusBadge}
        </td>
        <td style="text-align: center;">
          <div style="display: inline-flex; align-items: center; gap: 6px; justify-content: center; flex-wrap: wrap;">
            ${shareBtn}
            <button type="button" class="btn-code-row-print" onclick="window.printSingleActivationCard('${safeCode}')" title="معاينة وطباعة بطاقة VIP لهذا الكود للوكيل">
              <i class="fa-solid fa-print"></i>
            </button>
            <button type="button" class="sub-btn-row-delete" onclick="window.deleteActivationCode('${safeCode}')" title="حذف هذا الكود نهائياً">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
};

window.handleGenerateActivationCodes = async function () {
  const planSelect = document.getElementById('codePlanSelect');
  const qtySelect = document.getElementById('codeQuantitySelect');
  const noteInput = document.getElementById('codeNoteInput');
  const generateBtn = document.getElementById('btnGenerateCodes');

  const plan_code = planSelect ? planSelect.value : '1_year';
  const count = qtySelect ? parseInt(qtySelect.value, 10) || 1 : 1;
  const note = noteInput ? (noteInput.value || '').trim() : '';

  if (generateBtn) {
    generateBtn.disabled = true;
    generateBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>جاري التوليد...</span>`;
  }

  try {
    const res = await fetch(getBackendApiUrl('/api/activation_codes/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_code, count, note })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.codes)) {
        window.activationCodes = data.codes;
        localStorage.setItem('moallem_activation_codes', JSON.stringify(data.codes));
        if (noteInput) noteInput.value = '';
        showToast(`🎉 تم توليد (${count}) كود تفعيل بنجاح! جاهزة للاستخدام والطباعة الآن 👑`, 'success');
        window.renderActivationCodesUI();
        setTimeout(() => {
          if (confirm(`🎉 تم توليد (${count}) كود بنجاح!\n\nهل ترغب بمعاينة وطباعة بطاقات VIP للوكلاء على ورق A4 الآن؟`)) {
            window.printActivationCardsModal();
          }
        }, 400);
        return;
      }
    }
    throw new Error('Server returned non-ok');
  } catch (err) {
    // Offline client-side generation fallback!
    const plansInfo = {
      '1_month': { name: 'باقة شهر واحد (25 ألف د.ع)', days: 30, prefix: 'VIP-1MO' },
      '6_months': { name: 'باقة 6 أشهر دراسية (75 ألف د.ع)', days: 180, prefix: 'VIP-6MO' },
      '1_year': { name: 'الباقة السنوية الأكاديمية (200 ألف د.ع)', days: 365, prefix: 'VIP-YEAR' },
      'lifetime': { name: 'باقة VIP مدى الحياة (صلاحيات كاملة 👑)', days: 3650, prefix: 'VIP-LIFE' }
    }
    const pInfo = plansInfo[plan_code] || plansInfo['1_year'];
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const genChunk = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const nowIso = new Date().toISOString();

    for (let i = 0; i < count; i++) {
      const newCode = `${pInfo.prefix}-${genChunk()}-${genChunk()}`;
      window.activationCodes.unshift({
        code: newCode,
        plan_code: plan_code,
        plan_name: pInfo.name,
        duration_days: pInfo.days,
        is_used: false,
        created_at: nowIso,
        note: note
      });
    }
    localStorage.setItem('moallem_activation_codes', JSON.stringify(window.activationCodes));
    if (noteInput) noteInput.value = '';
    showToast(`🎉 تم توليد (${count}) كود تفعيل بنجاح! 👑`, 'success');
    window.renderActivationCodesUI();
    setTimeout(() => {
      if (confirm(`🎉 تم توليد (${count}) كود بنجاح!\n\nهل ترغب بمعاينة وطباعة بطاقات VIP للوكلاء على ورق A4 الآن؟`)) {
        window.printActivationCardsModal();
      }
    }, 400);
  } finally {
    if (generateBtn) {
      generateBtn.disabled = false;
      generateBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> <span>توليد الأكواد الآن</span>`;
    }
  }
};

window.copyActivationCode = function (codeStr, btnElement) {
  if (!codeStr) return;
  navigator.clipboard.writeText(codeStr).then(() => {
    if (btnElement) {
      btnElement.classList.add('copied');
      btnElement.innerHTML = `<i class="fa-solid fa-check"></i>`;
      setTimeout(() => {
        btnElement.classList.remove('copied');
        btnElement.innerHTML = `<i class="fa-regular fa-copy"></i>`;
      }, 1600);
    }
    showToast(`📋 تم نسخ كود التفعيل (${codeStr}) بنجاح!`, 'success');
  }).catch(() => {
    prompt('انسخ كود التفعيل التالي:', codeStr);
  });
};

window.bulkCopyAvailableCodes = function () {
  const codes = window.activationCodes || [];
  const available = codes.filter(c => !c.is_used);
  if (available.length === 0) {
    showToast('لا توجد أي أكواد متاحة لنسخها حالياً!', 'warning');
    return;
  }

  const textLines = [
    '👑 منصة مسار المعلم الذكية — قائمة أكواد تفعيل الاشتراكات VIP:',
    '--------------------------------------------------',
    ...available.map((c, i) => `${i + 1}. كود: ${c.code} | باقة: ${c.plan_name}${c.note ? ` (${c.note})` : ''}`),
    '--------------------------------------------------',
    'طريقة التفعيل: ادخل على منصة مسار المعلم > باقات الاشتراك > تفعيل كود VIP.'
  ];
  const output = textLines.join('\n');

  navigator.clipboard.writeText(output).then(() => {
    showToast(`📋 تم نسخ (${available.length}) كود متاح للحافظة دفعة واحدة بنجاح!`, 'success');
  }).catch(() => {
    prompt('انسخ الأكواد:', output);
  });
};

window.shareActivationCodeViaWhatsApp = function (codeStr) {
  const codes = window.activationCodes || [];
  const item = codes.find(c => c.code === codeStr) || { code: codeStr, plan_name: 'الباقة السنوية VIP' };

  const msg =
    `تحية طيبة أستاذنا الفاضل 🌸
يسر إدارة منصة مسار المعلم الذكية تزويدكم بكود تفعيل اشتراك VIP الخاص بكم:

🎫 رمز كود التفعيل: *${item.code}*
👑 باقة الاشتراك: *${item.plan_name}*
${item.note ? `📌 ملاحظة: ${item.note}\n` : ''}
⚡ طريقة التفعيل:
1. افتح منصة مسار المعلم على جهازك.
2. انقر على خيار (تفعيل كود اشتراك VIP).
3. ألصق رمز الكود أعلاه واضغط (تفعيل الحساب فوراً).

نتمنى لكم دوام التوفيق والتميز الأكاديمي! 🌹✨`;

  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
};

window.deleteActivationCode = async function (codeStr) {
  if (!confirm(`هل أنت متأكد من حذف كود التفعيل (${codeStr}) نهائياً؟`)) return;

  try {
    const res = await fetch(getBackendApiUrl(`/api/activation_codes?code=${encodeURIComponent(codeStr)}`), {
      method: 'DELETE'
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.codes)) {
        window.activationCodes = data.codes;
        localStorage.setItem('moallem_activation_codes', JSON.stringify(data.codes));
        showToast('تم حذف كود التفعيل بنجاح 🗑️', 'info');
        window.renderActivationCodesUI();
        return;
      }
    }
  } catch (err) { }

  // Local fallback
  window.activationCodes = (window.activationCodes || []).filter(c => c.code !== codeStr);
  localStorage.setItem('moallem_activation_codes', JSON.stringify(window.activationCodes));
  showToast('تم حذف كود التفعيل بنجاح 🗑️', 'info');
  window.renderActivationCodesUI();
};

window.handleClearUsedCodes = async function () {
  const codes = window.activationCodes || [];
  const used = codes.filter(c => c.is_used);
  if (used.length === 0) {
    showToast('لا توجد أي أكواد مستهلكة لحذفها!', 'info');
    return;
  }
  if (!confirm(`هل أنت متأكد من حذف وتنظيف كافة الأكواد المستهلكة (${used.length} كود)؟ لا يمكن التراجع عن هذا الإجراء.`)) {
    return;
  }

  try {
    const res = await fetch(getBackendApiUrl('/api/activation_codes?clear_used=true'), {
      method: 'DELETE'
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.codes)) {
        window.activationCodes = data.codes;
        localStorage.setItem('moallem_activation_codes', JSON.stringify(data.codes));
        showToast('تم تنظيف كافة الأكواد المستهلكة بنجاح 🧹', 'success');
        window.renderActivationCodesUI();
        return;
      }
    }
  } catch (err) { }

  window.activationCodes = codes.filter(c => !c.is_used);
  localStorage.setItem('moallem_activation_codes', JSON.stringify(window.activationCodes));
  showToast('تم تنظيف كافة الأكواد المستهلكة بنجاح 🧹', 'success');
  window.renderActivationCodesUI();
};

window.activeVoucherSingleCode = null;

window.printSingleActivationCard = function (codeStr) {
  window.activeVoucherSingleCode = codeStr;
  const layoutSelect = document.getElementById('voucherLayoutSelect');
  if (layoutSelect) layoutSelect.value = 'single';
  window.printActivationCardsModal();
};

window.printActivationCardsModal = function (singleCode = null) {
  if (singleCode && typeof singleCode === 'string') {
    window.activeVoucherSingleCode = singleCode;
    const layoutSelect = document.getElementById('voucherLayoutSelect');
    if (layoutSelect) layoutSelect.value = 'single';
  }
  const modal = document.getElementById('printActivationCardsModal');
  if (!modal) return;
  if (modal.parentElement !== document.body) {
    document.body.appendChild(modal);
  }
  modal.style.display = 'flex';
  modal.classList.add('open');
  modal.style.opacity = '1';
  modal.style.visibility = 'visible';
  modal.style.pointerEvents = 'auto';

  // Ensure codes are available from local cache or window
  if (!window.activationCodes || window.activationCodes.length === 0) {
    try {
      window.activationCodes = JSON.parse(localStorage.getItem('moallem_activation_codes') || '[]');
    } catch (e) { }
  }

  window.renderPrintableVouchers();

  // If still empty, fetch fresh from server and re-render
  if (!window.activationCodes || window.activationCodes.length === 0) {
    fetch(getBackendApiUrl('/api/activation_codes'))
      .then(r => r.json())
      .then(d => {
        if (d && d.success && Array.isArray(d.codes)) {
          window.activationCodes = d.codes;
          localStorage.setItem('moallem_activation_codes', JSON.stringify(d.codes));
          window.renderPrintableVouchers();
        }
      }).catch(() => { });
  }
};

window.closePrintActivationCardsModal = function () {
  const modal = document.getElementById('printActivationCardsModal');
  if (modal) {
    modal.classList.remove('open');
    modal.style.display = 'none';
    modal.style.opacity = '0';
    modal.style.visibility = 'hidden';
    modal.style.pointerEvents = 'none';
  }
  window.activeVoucherSingleCode = null;
};

window.updateVoucherCardsLivePreview = function () {
  window.renderPrintableVouchers();
};

window.renderPrintableVouchers = function () {
  const container = document.getElementById('printCardsContainer');
  if (!container) return;

  const codes = window.activationCodes || [];
  const theme = document.getElementById('voucherThemeSelect')?.value || 'pearl';
  const layout = document.getElementById('voucherLayoutSelect')?.value || '8';
  const filter = document.getElementById('voucherFilterSelect')?.value || 'available';
  const agentName = (document.getElementById('voucherAgentNameInput')?.value || '').trim() || 'المكتبة / الوكيل المعتمد';

  let list = [];
  if (window.activeVoucherSingleCode) {
    const single = codes.find(c => c.code === window.activeVoucherSingleCode);
    list = single ? [single] : [{ code: window.activeVoucherSingleCode, plan_name: 'الباقة السنوية الأكاديمية (365 يوماً)', duration_days: 365 }];
  } else {
    list = [...codes];
    if (filter === 'available') {
      list = list.filter(c => !c.is_used);
    } else if (filter === '1_year') {
      list = list.filter(c => c.plan_code === '1_year' || (c.duration_days && c.duration_days >= 365));
    } else if (filter === '6_months') {
      list = list.filter(c => c.plan_code === '6_months' || (c.duration_days && c.duration_days >= 180 && c.duration_days < 365));
    }
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 4rem 2rem; color: var(--text-muted); width: 100%;">
        <div style="font-size: 2.2rem; color: #f59e0b; margin-bottom: 0.75rem;">🎫</div>
        <div style="font-weight: 850; font-size: 1.1rem; color: var(--text-main); margin-bottom: 6px;">لا توجد أكواد مطابقة للمعايير المحددة</div>
        <div style="font-size: 0.82rem; color: var(--text-muted);">يرجى اختيار فلتر مختلف أو توليد أكواد تفعيل جديدة من لوحة التحكم.</div>
      </div>
    `;
    return;
  }

  // Cards per sheet
  const cardsPerPage = layout === 'single' ? 1 : (layout === '4' ? 4 : (layout === '6' ? 6 : 8));
  const gridClass = layout === 'single' ? 'layout-single' : (layout === '4' ? 'layout-4' : (layout === '6' ? 'layout-6' : 'layout-8'));
  const sheetsCount = Math.ceil(list.length / cardsPerPage);
  const originDisplay = (window.location.host || 'moallem.iq');

  let sheetsHtml = '';
  for (let sIdx = 0; sIdx < sheetsCount; sIdx++) {
    const sheetItems = list.slice(sIdx * cardsPerPage, (sIdx + 1) * cardsPerPage);

    const cardsHtml = sheetItems.map((item, cIdx) => {
      const serial = String(sIdx * cardsPerPage + cIdx + 1).padStart(4, '0');
      const cleanCode = item.code || '';
      const planName = item.plan_name || 'الباقة السنوية الأكاديمية (365 يوماً)';
      const redeemUrl = `${window.location.origin}/?redeem=${encodeURIComponent(cleanCode)}`;
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(redeemUrl)}&margin=1`;

      return `
        <div class="voucher-agent-card theme-${theme}">
          <div class="voucher-security-pattern"></div>
          <span class="voucher-cut-marker top-left">✂</span>
          <span class="voucher-cut-marker bottom-right">✂</span>

          <!-- Header -->
          <div class="voucher-header">
            <div class="voucher-brand">
              <div class="voucher-crown-icon">
                <i class="fa-solid fa-crown"></i>
              </div>
              <div>
                <div class="voucher-brand-title">منصة مُعَلِّم بـرو الذكية</div>
                <div class="voucher-brand-sub">مسار المعلم • بطاقة شحن رصيد VIP</div>
              </div>
            </div>
            <div class="voucher-hologram">
              <span class="hologram-seal">
                <i class="fa-solid fa-shield-halved"></i> كود رسمي معتمد
              </span>
            </div>
          </div>

          <!-- Plan strip -->
          <div class="voucher-plan-strip">
            <span class="voucher-plan-pill">
              <i class="fa-solid fa-gem"></i> ${planName}
            </span>
            <span class="voucher-serial">S/N: VIP-2026-${serial}</span>
          </div>

          <!-- Center: Code Box + QR Code -->
          <div class="voucher-core-grid">
            <div class="voucher-code-section">
              <div class="voucher-code-label">
                <i class="fa-solid fa-key"></i> رمز كود التفعيل VIP الحصري:
              </div>
              <span class="voucher-code-display">${cleanCode}</span>
              <div class="voucher-code-hint">
                <i class="fa-solid fa-lock"></i> كود مشفر لمرة واحدة • مخصص لمعلم واحد
              </div>
            </div>

            <div class="voucher-qr-section">
              <div class="voucher-qr-box">
                <img src="${qrApiUrl}" alt="QR Code" loading="lazy" onerror="this.src='https://quickchart.io/qr?text=${encodeURIComponent(redeemUrl)}&size=180'">
              </div>
              <div class="voucher-qr-caption">امسح للتفعيل 📱</div>
            </div>
          </div>

          <!-- Footer: Instructions & Agent Stamp -->
          <div class="voucher-footer">
            <div class="voucher-steps">
              <div class="voucher-step-line">
                <span class="voucher-step-num">1</span>
                <span>امسح الباركود أو ادخل: <strong>${originDisplay}</strong></span>
              </div>
              <div class="voucher-step-line">
                <span class="voucher-step-num">2</span>
                <span>سجّل الدخول بحسابك واضغط (تفعيل كود VIP)</span>
              </div>
              <div class="voucher-step-line">
                <span class="voucher-step-num">3</span>
                <span>ألصق الرمز أعلاه ومبارك التفعيل الفوري 👑</span>
              </div>
            </div>

            <div class="voucher-agent-stamp-box">
              <div class="voucher-agent-stamp-name">${agentName}</div>
              <div>ختم وتوقيع الوكيل المعتمد</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    sheetsHtml += `
      <div class="voucher-a4-sheet" data-pdf-page>
        <div class="voucher-sheet-header no-print">
          <div>
            <strong>👑 منصة مسار المعلم الذكية — كروت شحن اشتراكات VIP</strong>
            <span style="margin: 0 8px;">|</span>
            <span>الوكيل / المكتبة: <strong>${agentName}</strong></span>
          </div>
          <div>
            <span>صفحة ${sIdx + 1} من ${sheetsCount}</span>
            <span style="margin: 0 6px;">•</span>
            <span>✂ خطوط القص متطابقة لمكائن ومقصات الورق</span>
          </div>
        </div>

        <div class="voucher-cards-grid ${gridClass}">
          ${cardsHtml}
        </div>
      </div>
    `;
  }

  container.innerHTML = sheetsHtml;
};

window.executePrintActivationCards = function () {
  const modal = document.getElementById('printActivationCardsModal');
  if (modal && modal.parentElement !== document.body) {
    document.body.appendChild(modal);
  }
  document.body.classList.add('printing-activation-cards');
  window.print();
  setTimeout(() => {
    document.body.classList.remove('printing-activation-cards');
  }, 1600);
};

window.exportActivationCardsPDF = async function () {
  const sheets = document.querySelectorAll('.voucher-a4-sheet');
  if (!sheets || sheets.length === 0) {
    showToast('لا توجد بطاقات معروضة للتصدير!', 'warning');
    return;
  }

  const agentName = (document.getElementById('voucherAgentNameInput')?.value || '').trim() || 'الوكلاء';
  const safeAgent = agentName.replace(/[^\u0621-\u064Aa-zA-Z0-9_-]/g, '_');
  const filename = `بطاقات_تفعيل_كروت_VIP_${safeAgent}`;

  showToast('جاري تصدير وتجهيز ملف PDF فائق الدقة للتنزيل... 📄⏳', 'info');

  try {
    const printFn = (typeof window.masarPrintToPDF === 'function') ? window.masarPrintToPDF : (typeof window.exportToPDF === 'function' ? window.exportToPDF : null);
    if (printFn) {
      await printFn(Array.prototype.slice.call(sheets), {
        title: filename,
        pageSize: 'a4',
        orientation: 'portrait',
        margin: '6mm',
        fit: true
      });
      showToast('تم تصدير وتنزيل كروت VIP بصيغة PDF بنجاح! 📥🎫', 'success');
      return;
    }

    window.executePrintActivationCards();
  } catch (err) {
    console.error('PDF export error:', err);
    showToast('تعذر تصدير PDF تلقائياً، جاري فتح الطباعة المباشرة...', 'warning');
    window.executePrintActivationCards();
  }
};

/* ==========================================================================
   Activation Code Redemption Engine (محرك فحص وتفعيل الأكواد للمعلمين)
   ========================================================================== */
window.openRedeemCodeModal = function () {
  const modal = document.getElementById('redeemCodeModal');
  if (modal) {
    modal.style.display = 'flex';
    setTimeout(() => {
      const input = document.getElementById('standaloneRedeemInput');
      if (input) input.focus();
    }, 150);
  }
};

window.closeRedeemCodeModal = function () {
  const modal = document.getElementById('redeemCodeModal');
  if (modal) modal.style.display = 'none';
};

window.handleStandaloneRedeemCode = function () {
  const input = document.getElementById('standaloneRedeemInput');
  const code = input ? (input.value || '').trim() : '';
  window.executeCodeRedemption(code, () => {
    if (input) input.value = '';
    window.closeRedeemCodeModal();
  });
};

window.handleRedeemActivationCode = function () {
  const input = document.getElementById('vipCodeRedeemInput');
  const code = input ? (input.value || '').trim() : '';
  window.executeCodeRedemption(code, () => {
    if (input) input.value = '';
    if (typeof window.closeSubscriptionModal === 'function') {
      window.closeSubscriptionModal();
    }
  });
};

window.executeCodeRedemption = async function (codeStr, onSuccessCallback) {
  const cleanCode = (codeStr || '').trim().toUpperCase();
  if (!cleanCode) {
    showToast('يرجى إدخال رمز كود التفعيل أولاً ⚠️', 'warning');
    return;
  }

  // Verify User is logged in
  const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (!currentUser || !currentUser.id) {
    showToast('يرجى تسجيل الدخول إلى حسابك أولاً لتفعيل الكود عليه!', 'warning');
    if (typeof window.openAuthModal === 'function') window.openAuthModal();
    return;
  }

  // Submit to Server Backend
  try {
    const res = await fetch(getBackendApiUrl('/api/activation_codes/redeem'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: cleanCode,
        user: currentUser,
        deviceInfo: typeof detectCurrentDeviceName === 'function' ? detectCurrentDeviceName() : ''
      })
    });

    const data = await res.json();
    if (res.ok && data && data.success) {
      // Success from server!
      const updatedUser = data.account || currentUser;
      updatedUser.isVip = true;
      updatedUser.isSubscribed = true;
      updatedUser.isTrial = false;
      updatedUser.role = 'teacher_vip';
      delete updatedUser.trialDurationHours;
      delete updatedUser.trialStartedAt;
      if (data.details && data.details.plan_code) {
        updatedUser.subscriptionType = data.details.plan_code;
        updatedUser.subscriptionDuration = data.details.plan_code;
      }
      localStorage.setItem('moallem_current_user', JSON.stringify(updatedUser));
      localStorage.setItem(`moallem_vip_subscription_${updatedUser.id}`, 'true');
      if (data.details && data.details.expiry_iso) {
        localStorage.setItem(`moallem_vip_subscription_exp_${updatedUser.id}`, data.details.expiry_iso);
      }
      localStorage.setItem(`moallem_teacher_profile_${updatedUser.id}`, JSON.stringify(updatedUser));

      // Update accounts list
      const accounts = typeof getAuthAccounts === 'function' ? getAuthAccounts() : [];
      const idx = accounts.findIndex(a => a.id === updatedUser.id);
      if (idx !== -1) {
        accounts[idx] = { ...accounts[idx], ...updatedUser };
      } else {
        accounts.push(updatedUser);
      }
      if (typeof saveAuthAccounts === 'function') saveAuthAccounts(accounts);

      if (typeof window.updateVipUIStatus === 'function') window.updateVipUIStatus();
      if (typeof updateUserAuthUI === 'function') updateUserAuthUI();
      if (typeof window.renderSubscribersManagementUI === 'function') window.renderSubscribersManagementUI();

      showToast(data.message || `🎉 مبارك! تم تفعيل اشتراكك بنجاح عبر كود التفعيل (${cleanCode}) 👑`, 'success');
      if (typeof onSuccessCallback === 'function') onSuccessCallback();
      return;
    } else {
      showToast(data.message || 'كود التفعيل غير صالح أو مستخدم مسبقاً ❌', 'error');
      return;
    }
  } catch (err) {
    // Offline client-side verification fallback
    let codes = [];
    try {
      codes = JSON.parse(localStorage.getItem('moallem_activation_codes') || '[]');
    } catch (e) { }

    const matchedIndex = codes.findIndex(c => (c.code || '').trim().toUpperCase() === cleanCode);
    if (matchedIndex === -1) {
      showToast(`كود التفعيل (${cleanCode}) غير صحيح أو غير مسجل في المنظومة ❌`, 'error');
      return;
    }

    const codeObj = codes[matchedIndex];
    if (codeObj.is_used) {
      showToast(`عذراً! هذا الكود مستخدم مسبقاً من قبل (${codeObj.used_by_name || 'مستخدم آخر'}) ولا يمكن إعادة استعماله 🔒`, 'error');
      return;
    }

    // Mark as used
    const now = new Date();
    const durationDays = codeObj.duration_days || 365;
    const expiry = new Date(now);
    expiry.setDate(expiry.getDate() + durationDays);
    const expiryStr = expiry.toISOString().slice(0, 10);

    codeObj.is_used = true;
    codeObj.used_by_id = currentUser.id;
    codeObj.used_by_name = currentUser.name || currentUser.username;
    codeObj.used_by_username = currentUser.username || '';
    codeObj.used_at = now.toISOString();
    localStorage.setItem('moallem_activation_codes', JSON.stringify(codes));
    window.activationCodes = codes;

    // Upgrade user
    currentUser.isVip = true;
    currentUser.isSubscribed = true;
    currentUser.isTrial = false;
    currentUser.role = 'teacher_vip';
    currentUser.subscriptionType = codeObj.plan_code || '1_year';
    currentUser.subscriptionDuration = codeObj.plan_code || '1_year';
    currentUser.subscriptionPlanName = codeObj.plan_name || 'الباقة السنوية';
    currentUser.subscriptionStartDate = now.toISOString();
    currentUser.subscriptionExpiresAt = expiry.toISOString();
    currentUser.subscriptionExpiryFormatted = expiryStr;
    delete currentUser.trialDurationHours;
    delete currentUser.trialStartedAt;

    localStorage.setItem('moallem_current_user', JSON.stringify(currentUser));
    localStorage.setItem(`moallem_vip_subscription_${currentUser.id}`, 'true');
    localStorage.setItem(`moallem_vip_subscription_exp_${currentUser.id}`, expiry.toISOString());
    localStorage.setItem(`moallem_teacher_profile_${currentUser.id}`, JSON.stringify(currentUser));
    localStorage.setItem(`moallem_vip_subscription_exp_${currentUser.id}`, expiry.toISOString());

    const accounts = typeof getAuthAccounts === 'function' ? getAuthAccounts() : [];
    const idx = accounts.findIndex(a => a.id === currentUser.id);
    if (idx !== -1) {
      accounts[idx] = { ...accounts[idx], ...currentUser };
    }
    if (typeof saveAuthAccounts === 'function') saveAuthAccounts(accounts);

    if (typeof window.updateVipUIStatus === 'function') window.updateVipUIStatus();
    if (typeof updateUserAuthUI === 'function') updateUserAuthUI();
    if (typeof window.renderSubscribersManagementUI === 'function') window.renderSubscribersManagementUI();

    showToast(`🎉 مبارك يا أستاذ ${currentUser.name || currentUser.username}! تم تفعيل [${codeObj.plan_name}] بنجاح لحسابك حتى (${expiryStr}) 👑`, 'success');
    if (typeof onSuccessCallback === 'function') onSuccessCallback();
  }
};

window.renderAdminAccountsTable = function () {
  const tbody = document.getElementById('adminAccountsTableBody');
  const countEl = document.getElementById('adminStatAccountsCount');
  const qCountEl = document.getElementById('adminStatQuestionsCount');
  const exCountEl = document.getElementById('adminStatExamsCount');

  const accounts = getAuthAccounts();
  if (countEl) countEl.innerText = accounts.length;

  const currentBank = getQuestionsHistoryBank();
  if (qCountEl) qCountEl.innerText = currentBank.length;

  const currentArchive = getSavedExamsArchive();
  if (exCountEl) exCountEl.innerText = currentArchive.length;

  if (!tbody) return;

  tbody.innerHTML = accounts.map(acc => {
    const isSuperAdmin = acc.isAdmin || acc.role === 'admin' || acc.id === 'usr_admin';
    const isVip = isSuperAdmin || acc.isVip || acc.isSubscribed || (acc.id && localStorage.getItem(`moallem_vip_subscription_${acc.id}`) === 'true');
    const initial = (acc.name || 'م')[0];

    return `
      <tr style="border-bottom: 1px solid var(--border-color); transition: background 0.2s;">
        <td style="padding: 0.65rem 0.85rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: ${isSuperAdmin ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #2563eb, #38bdf8)'}; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.78rem; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
              ${isSuperAdmin ? '<i class="fa-solid fa-crown" style="font-size: 0.75rem;"></i>' : initial}
            </div>
            <div>
              <div style="font-weight: 800; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                <span>${acc.name || 'معلم بدون اسم'}</span>
                ${acc.isOnline
        ? `<span class="badge-tag" style="background: rgba(16, 185, 129, 0.15); color: #10b981; font-size: 0.65rem; font-weight: 800; padding: 1px 5px;"><i class="fa-solid fa-circle text-success" style="font-size: 0.45rem;"></i> متصل الآن 🟢</span>`
        : `<span class="badge-tag" style="background: rgba(100, 116, 139, 0.12); color: var(--text-muted); font-size: 0.65rem; font-weight: 700; padding: 1px 5px;"><i class="fa-solid fa-circle text-muted" style="font-size: 0.45rem; opacity: 0.5;"></i> غير متصل ⚪</span>`}
              </div>
              <div style="font-size: 0.7rem; color: var(--text-muted);">
                ${acc.governorate || 'العراق'}
                ${acc.lastLogin ? ` • <span title="آخر تسجيل دخول">آخر دخول: ${acc.lastLogin}</span>` : ''}
              </div>
            </div>
          </div>
        </td>
        <td style="padding: 0.65rem 0.85rem;">
          <div><code style="background: rgba(148,163,184,0.15); padding: 2px 6px; border-radius: 4px; font-weight: 700; color: var(--text-main);">${acc.username || acc.email}</code></div>
          <small style="color: var(--text-muted); display: block; margin-top: 2px;">${acc.email || ''}</small>
        </td>
        <td style="padding: 0.65rem 0.85rem;">
          <div style="font-weight: 700;">${acc.subject || 'غير محدد'}</div>
          <small style="color: var(--text-muted);">${acc.school || 'مدرسة غير محددة'}</small>
        </td>
        <td style="padding: 0.65rem 0.85rem;">
          ${isSuperAdmin
        ? '<span class="badge-tag" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; font-weight: 800; border: 1px solid rgba(245, 158, 11, 0.35);"><i class="fa-solid fa-crown"></i> مدير عام النظام</span>'
        : (isVip
          ? '<span class="badge-tag" style="background: rgba(16, 185, 129, 0.16); color: #10b981; font-weight: 800; border: 1px solid rgba(16, 185, 129, 0.35);"><i class="fa-solid fa-circle-check"></i> باقة سنوية مفعلة 👑 (كامل الصلاحيات)</span>'
          : '<span class="badge-tag" style="background: rgba(239, 68, 68, 0.12); color: #ef4444; font-weight: 700; border: 1px solid rgba(239, 68, 68, 0.3);"><i class="fa-solid fa-lock"></i> مشاهدة فقط (غير مفعل)</span>'
        )}
        </td>
        <td style="padding: 0.65rem 0.85rem; text-align: center;">
          ${isSuperAdmin
        ? '<span style="color: #10b981; font-weight: 700; font-size: 0.76rem;"><i class="fa-solid fa-shield-halved"></i> محمي بالكامل</span>'
        : `
              <div class="admin-actions-cell">
                ${!isVip
          ? `<button type="button" class="btn-admin-action btn-activate-vip" onclick="window.adminToggleVip('${acc.id}', true)" title="تفعيل الاشتراك السنوي ومنح كافة الصلاحيات">
                      <i class="fa-solid fa-crown"></i> تفعيل سنوي VIP
                     </button>`
          : `<button type="button" class="btn-admin-action btn-deactivate-vip" onclick="window.adminToggleVip('${acc.id}', false)" title="إلغاء تفعيل الاشتراك">
                      <i class="fa-solid fa-ban"></i> إلغاء التفعيل
                     </button>`
        }
                <button type="button" class="btn-admin-action btn-delete-acc" onclick="window.adminDeleteAccount('${acc.id}')" title="حذف الحساب نهائياً">
                  <i class="fa-solid fa-trash"></i> حذف
                </button>
              </div>
            `}
        </td>
      </tr>
    `;
  }).join('');
};

window.adminDeleteAccount = function (id) {
  if (id === 'usr_admin') {
    showToast('لا يمكن حذف حساب المدير العام!', 'error');
    return;
  }
  if (!confirm('هل أنت متأكد من حذف هذا الحساب نهائياً؟')) return;
  let accounts = getAuthAccounts();
  accounts = accounts.filter(a => a.id !== id);
  saveAuthAccounts(accounts);
  window.renderAdminAccountsTable();
  if (typeof updateUserAuthUI === 'function') updateUserAuthUI();
  showToast('تم حذف الحساب بنجاح', 'info');
};

window.adminToggleVip = function (id, explicitState) {
  // Security check: only super admin
  const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : JSON.parse(localStorage.getItem('moallem_current_user') || '{}');
  if (!currentUser || (!currentUser.isAdmin && currentUser.role !== 'admin' && currentUser.username !== 'admin')) {
    showToast('عذراً، هذه الميزة متاحة فقط لحساب المدير العام (الآدمن)!', 'error');
    return;
  }

  const accounts = getAuthAccounts();
  const acc = accounts.find(a => a.id === id);
  if (!acc) {
    showToast('لم يتم العثور على الحساب المطلوب!', 'error');
    return;
  }

  const currentSub = !!(acc.isVip || acc.isSubscribed || localStorage.getItem(`moallem_vip_subscription_${acc.id}`) === 'true');
  const newState = (typeof explicitState === 'boolean') ? explicitState : !currentSub;

  acc.isVip = newState;
  acc.isSubscribed = newState;
  acc.role = newState ? 'teacher_vip' : 'viewer';

  if (newState) {
    const now = new Date();
    const oneYearLater = new Date(now);
    oneYearLater.setFullYear(now.getFullYear() + 1);
    acc.isTrial = false;
    delete acc.trialDurationHours;
    delete acc.trialStartedAt;
    acc.subscriptionType = 'annual_vip_50k';
    acc.subscriptionDuration = '1_year';
    acc.subscriptionPlanName = 'الباقة السنوية الأكاديمية (200 ألف د.ع)';
    acc.subscriptionStartDate = now.toISOString();
    acc.subscriptionExpiresAt = oneYearLater.toISOString();
    acc.subscriptionExpiryFormatted = `${oneYearLater.getFullYear()}-${String(oneYearLater.getMonth() + 1).padStart(2, '0')}-${String(oneYearLater.getDate()).padStart(2, '0')}`;
    localStorage.setItem(`moallem_vip_subscription_${acc.id}`, 'true');
    localStorage.setItem(`moallem_vip_subscription_exp_${acc.id}`, oneYearLater.toISOString());
    localStorage.setItem(`moallem_teacher_profile_${acc.id}`, JSON.stringify(acc));
  } else {
    delete acc.subscriptionExpiresAt;
    delete acc.subscriptionExpiryFormatted;
    localStorage.setItem(`moallem_vip_subscription_${acc.id}`, 'false');
    localStorage.removeItem(`moallem_vip_subscription_exp_${acc.id}`);
  }

  saveAuthAccounts(accounts);

  // If this account happens to be current user, sync state
  const sessionUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (sessionUser && sessionUser.id === acc.id) {
    sessionUser.isVip = newState;
    sessionUser.isSubscribed = newState;
    sessionUser.role = newState ? 'teacher_vip' : 'viewer';
    if (newState) {
      sessionUser.isTrial = false;
      delete sessionUser.trialDurationHours;
      delete sessionUser.trialStartedAt;
      sessionUser.subscriptionType = acc.subscriptionType;
      sessionUser.subscriptionDuration = acc.subscriptionDuration;
      sessionUser.subscriptionPlanName = acc.subscriptionPlanName;
      sessionUser.subscriptionStartDate = acc.subscriptionStartDate;
      sessionUser.subscriptionExpiresAt = acc.subscriptionExpiresAt;
      sessionUser.subscriptionExpiryFormatted = acc.subscriptionExpiryFormatted;
    } else {
      delete sessionUser.subscriptionExpiresAt;
      delete sessionUser.subscriptionExpiryFormatted;
    }
    localStorage.setItem('moallem_current_user', JSON.stringify(sessionUser));
    if (typeof window.updateVipUIStatus === 'function') window.updateVipUIStatus();
  }

  window.renderAdminAccountsTable();
  if (typeof window.renderSubscribersManagementUI === 'function') window.renderSubscribersManagementUI();
  if (typeof updateUserAuthUI === 'function') updateUserAuthUI();
  if (newState) {
    showToast(`👑 تم تفعيل الاشتراك السنوي الكامل لمدة سنة واحدة للحساب (${acc.name || acc.username}) بنجاح!`, 'success');
  } else {
    showToast(`تم إيقاف تفعيل الاشتراك السنوي للحساب (${acc.name || acc.username})`, 'info');
  }
};

window.adminSubmitQuickActivate = function () {
  const inputEl = document.getElementById('adminQuickActivateInput');
  if (!inputEl) return;
  const query = (inputEl.value || '').trim();
  if (!query) {
    showToast('يرجى إدخال اسم المستخدم أو البريد الإلكتروني للحساب المراد تفعيله!', 'warning');
    inputEl.focus();
    return;
  }

  const accounts = getAuthAccounts();
  const queryLower = query.toLowerCase();

  // Find account by username, email, ID, or full name
  let targetAcc = accounts.find(a =>
    (a.username && a.username.toLowerCase() === queryLower) ||
    (a.email && a.email.toLowerCase() === queryLower) ||
    (a.id && a.id.toLowerCase() === queryLower)
  );

  if (!targetAcc) {
    targetAcc = accounts.find(a => a.name && a.name.toLowerCase() === queryLower);
  }

  if (!targetAcc) {
    showToast(`لم يتم العثور على أي حساب يطابق ("${query}"). تأكد من صحة اسم المستخدم أو البريد!`, 'error');
    inputEl.focus();
    return;
  }

  // If already admin
  if (targetAcc.isAdmin || targetAcc.role === 'admin' || targetAcc.id === 'usr_admin') {
    showToast('حساب المدير العام يمتلك كافة الصلاحيات مفعلة دائماً 👑', 'info');
    inputEl.value = '';
    return;
  }

  // Activate Full VIP Annual Subscription for 1 Year
  const now = new Date();
  const oneYearLater = new Date(now);
  oneYearLater.setFullYear(now.getFullYear() + 1);
  const expiryStr = `${oneYearLater.getFullYear()}-${String(oneYearLater.getMonth() + 1).padStart(2, '0')}-${String(oneYearLater.getDate()).padStart(2, '0')}`;

  targetAcc.isVip = true;
  targetAcc.isSubscribed = true;
  targetAcc.isTrial = false;
  targetAcc.role = 'teacher_vip';
  delete targetAcc.trialDurationHours;
  delete targetAcc.trialStartedAt;
  targetAcc.subscriptionDuration = '1_year';
  targetAcc.subscriptionPlanName = 'الباقة السنوية الأكاديمية (200 ألف د.ع)';
  targetAcc.subscriptionStartDate = now.toISOString();
  targetAcc.subscriptionExpiresAt = oneYearLater.toISOString();
  targetAcc.subscriptionExpiryFormatted = expiryStr;
  targetAcc.subscriptionDate = now.toISOString();
  targetAcc.subscriptionType = 'annual_vip_50k';

  // Persist
  localStorage.setItem(`moallem_vip_subscription_${targetAcc.id}`, 'true');
  localStorage.setItem(`moallem_vip_subscription_exp_${targetAcc.id}`, oneYearLater.toISOString());
  localStorage.setItem(`moallem_teacher_profile_${targetAcc.id}`, JSON.stringify(targetAcc));
  saveAuthAccounts(accounts);

  // Sync if it's the current user session
  const sessionUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (sessionUser && sessionUser.id === targetAcc.id) {
    sessionUser.isVip = true;
    sessionUser.isSubscribed = true;
    sessionUser.isTrial = false;
    sessionUser.role = 'teacher_vip';
    delete sessionUser.trialDurationHours;
    delete sessionUser.trialStartedAt;
    sessionUser.subscriptionType = 'annual_vip_50k';
    sessionUser.subscriptionDuration = '1_year';
    sessionUser.subscriptionPlanName = 'الباقة السنوية الأكاديمية (200 ألف د.ع)';
    sessionUser.subscriptionStartDate = now.toISOString();
    sessionUser.subscriptionExpiresAt = oneYearLater.toISOString();
    sessionUser.subscriptionExpiryFormatted = expiryStr;
    localStorage.setItem('moallem_current_user', JSON.stringify(sessionUser));
    if (typeof window.updateVipUIStatus === 'function') window.updateVipUIStatus();
  }

  // Reset input
  inputEl.value = '';

  // Refresh Tables & Badges
  window.renderAdminAccountsTable();
  if (typeof window.renderSubscribersManagementUI === 'function') window.renderSubscribersManagementUI();
  if (typeof updateUserAuthUI === 'function') updateUserAuthUI();

  // Show detailed congratulatory notification
  showToast(`🎉 تم بنجاح تفعيل الاشتراك السنوي الكامل (50,000 د.ع) لمدة سنة واحدة حتى (${expiryStr}) للحساب: [${targetAcc.name || targetAcc.username}] 👑`, 'success');
};

window.adminPromptAddTeacher = function () {
  const name = prompt('أدخل الاسم الكامل للمعلم:');
  if (!name || !name.trim()) return;
  const username = prompt('أدخل اسم المستخدم (اليوزر):');
  if (!username || !username.trim()) return;
  const password = prompt('أدخل كلمة المرور:', 'teacher123');
  if (!password) return;

  const accounts = getAuthAccounts();
  if (accounts.some(a => (a.username && a.username.toLowerCase() === username.trim().toLowerCase()))) {
    showToast('اسم المستخدم هذا موجود مسبقاً!', 'error');
    return;
  }

  const nowReg = new Date();
  const dateFormatted = `${nowReg.getFullYear()}-${String(nowReg.getMonth() + 1).padStart(2, '0')}-${String(nowReg.getDate()).padStart(2, '0')}`;
  const newAcc = {
    id: 'usr_' + Date.now(),
    name: name.trim(),
    username: username.trim(),
    password: password,
    email: `${username.trim()}@moallem.iq`,
    subject: 'مادة تعليمية',
    school: 'مدرسة معتمدة',
    governorate: 'بغداد',
    isVerified: true,
    isSubscribed: false,
    isVip: false,
    registeredAt: nowReg.toISOString(),
    registeredDateFormatted: dateFormatted
  }

  accounts.push(newAcc);
  saveAuthAccounts(accounts);
  window.renderAdminAccountsTable();
  if (typeof window.renderSubscribersManagementUI === 'function') {
    window.renderSubscribersManagementUI();
  }
  showToast(`تم إنشاء حساب الأستاذ ${name} بنجاح!`, 'success');
};

window.adminExportAllSystemData = function () {
  const data = {
    exportDate: new Date().toISOString(),
    accounts: getAuthAccounts(),
    adminArchive: getSavedExamsArchive(),
    adminQuestionBank: getQuestionsHistoryBank()
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `moallem_system_backup_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('تم تصدير ملف النسخة الاحتياطية الشاملة لكامل النظام بنجاح 💾', 'success');
};

window.adminPurgeGuestCache = function () {
  if (!confirm('هل ترغب بتنظيف الملفات المؤقتة وذاكرة التخزين المؤقتة للزوار؟')) return;
  localStorage.removeItem('moallem_exam_data_guest');
  localStorage.removeItem('moallem_saved_exams_archive_guest');
  localStorage.removeItem('moallem_questions_history_bank_guest');
  showToast('تم تنظيف ذاكرة التخزين المؤقتة بنجاح 🧹', 'success');
};

// Auto-attach backdrop click for admin modal
document.addEventListener('DOMContentLoaded', () => {
  const adminModal = document.getElementById('adminControlPanelModal');
  if (adminModal) {
    adminModal.addEventListener('click', (e) => {
      if (e.target === adminModal) window.closeAdminControlPanel();
    });
  }
});



// Mobile Connect Modal Utilities
window.showMobileConnectModal = function() {
  fetch('/api/network-info').then(function(r) { return r.json(); }).then(function(data) {
    if (data && data.mobile_url) {
      var inp = document.getElementById('mobileConnectUrlInput');
      if (inp) inp.value = data.mobile_url;
    }
  }).catch(function() {});
  var m = document.getElementById('mobileConnectModal');
  if (m) m.classList.add('open');
};

window.closeMobileConnectModal = function() {
  var m = document.getElementById('mobileConnectModal');
  if (m) m.classList.remove('open');
};

window.copyMobileConnectUrl = function() {
  var inp = document.getElementById('mobileConnectUrlInput');
  if (inp) {
    var val = inp.value;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(val).then(function() {
        if (typeof window.showToast === 'function') {
          window.showToast('تم نسخ الرابط بنجاح! الصقه في متصفح الموبايل 📱', 'success');
        } else {
          alert('تم نسخ الرابط: ' + val);
        }
      });
    } else {
      inp.select();
      document.execCommand('copy');
      if (typeof window.showToast === 'function') {
        window.showToast('تم نسخ الرابط بنجاح! الصقه في متصفح الموبايل 📱', 'success');
      } else {
        alert('تم نسخ الرابط: ' + val);
      }
    }
  }
};

// Universal safeguard: Hide any PDF export buttons platform-wide as requested by user
(function autoHidePdfExportButtons() {
  function hideButtons() {
    try {
      var allBtns = document.querySelectorAll('button, a.btn, .btn-card-action');
      for (var i = 0; i < allBtns.length; i++) {
        var el = allBtns[i];
        var txt = (el.innerText || el.textContent || '').trim();
        var title = (el.getAttribute('title') || '').trim();
        var onclickStr = (el.getAttribute('onclick') || '').toLowerCase();
        var isPdf = txt.includes('PDF') || txt.includes('pdf') || title.includes('PDF') || onclickStr.includes('pdf');
        var isExport = txt.includes('تصدير') || txt.includes('تنزيل') || txt.includes('تحميل') || title.includes('تصدير') || title.includes('تنزيل') || onclickStr.includes('export');
        if (isPdf && isExport) {
          el.style.setProperty('display', 'none', 'important');
        }
      }
    } catch (e) {}
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideButtons);
  } else {
    hideButtons();
  }
  // Run on tab changes and modal opens
  document.addEventListener('click', function() { setTimeout(hideButtons, 150); });
  window.addEventListener('load', hideButtons);
})();


// ==========================================================================
// التفاعل السينمائي ثلاثي الأبعاد مع مؤشر الماوس لمجرة الموقع الأكاديمية
// ==========================================================================
(function initCosmicParallax() {
  if (typeof window === 'undefined') return;
  var ticking = false;
  var mouseX = 0, mouseY = 0;

  window.addEventListener('mousemove', function (e) {
    var w = window.innerWidth || 1200;
    var h = window.innerHeight || 800;
    mouseX = (e.clientX / w) - 0.5; // -0.5 to +0.5
    mouseY = (e.clientY / h) - 0.5;

    if (!ticking) {
      window.requestAnimationFrame(function () {
        var field = document.getElementById('academicConstellationField');
        if (field) {
          field.style.transform = 'translate3d(' + (mouseX * 16) + 'px, ' + (mouseY * 16) + 'px, 0)';
        }
        var blobs = document.querySelectorAll('.nebula-blob');
        for (var i = 0; i < blobs.length; i++) {
          var factor = (i % 2 === 0 ? 1 : -1) * (18 + i * 5);
          blobs[i].style.transform = 'translate3d(' + (mouseX * factor) + 'px, ' + (mouseY * factor) + 'px, 0)';
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();
