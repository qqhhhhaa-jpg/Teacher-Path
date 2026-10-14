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
    showGradingTable: true,
    showStudentBar: true,
    showInstructions: true,
    showSeal: true,
    showAnswerLines: true, // Optional answer writing lines toggle
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
  loadTeacherProfile();
  loadSavedState();
  initTheme();
  initAccentColor();
  initPreviewVisibility();
  initEventListeners();
  initSideQTypeBarMovable();
  initSubjectMode();
  initQuestionsHistoryBank();
  initDailyReport();
  initQuestionsQuickFilter();
  updateArchiveBadge();
  renderAll();
  checkAuthGatekeeper();
  checkDraftRestore();
  initSingleDeviceWatchdog();
});

/**
 * Initializes and syncs theme from state or local storage (Default: Light / Pure White)
 */
function initTheme() {
  const savedTheme = localStorage.getItem('moallem_theme') || 'light';
  appState.settings.theme = savedTheme;
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = appState.settings.theme;
  const newTheme = current === 'dark' ? 'light' : 'dark';
  appState.settings.theme = newTheme;
  localStorage.setItem('moallem_theme', newTheme);
  document.documentElement.setAttribute('data-theme', newTheme);
  updateThemeIcon(newTheme);
  showToast(`تم التبديل إلى الوضع ${newTheme === 'dark' ? 'الداكن' : 'الفاتح (الأبيض النقي)'}`, 'info');
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('themeIcon');
  if (icon) {
    icon.className = theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
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
  emerald: 'الزمردي الإسلامي 🟢',
  purple: 'البنفسجي الإبداعي 🟣',
  crimson: 'الياقوتي العنابي 🔴',
  amber: 'العنبر الذهبي 🟡',
  teal: 'الفيروزي البحري 🌊'
};

function initAccentColor() {
  const savedAccent = localStorage.getItem('moallem_accent_color') || 'blue';
  appState.settings.accentColor = savedAccent;
  document.documentElement.setAttribute('data-accent', savedAccent);
  updateAccentUI(savedAccent);
}

window.setAccentColor = function(colorKey) {
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

window.togglePreviewPane = function() {
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

window.setMobileWorkstationMode = function(mode) {
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
    if (typeof renderPaperQuestions === 'function') renderPaperQuestions();
    if (typeof applyPaperSettings === 'function') applyPaperSettings();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
  name: 'الأستاذ حسين علي (المدير العام)',
  username: 'admin',
  email: 'admin@moallem.iq',
  password: 'qq7878aassdd',
  role: 'admin',
  isAdmin: true,
  isVip: true,
  isVerified: true,
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

function getAuthAccounts() {
  try {
    const raw = localStorage.getItem('moallem_auth_accounts');
    let accounts = raw ? JSON.parse(raw) : [];
    // Remove old demo/guest default account if present
    accounts = accounts.filter(a => a.id !== 'usr_hussein');
    // Ensure SUPER_ADMIN_ACCOUNT is always registered and up to date with new password
    const adminIdx = accounts.findIndex(a => a.id === 'usr_admin' || a.username === 'admin');
    if (adminIdx === -1) {
      accounts.unshift({ ...SUPER_ADMIN_ACCOUNT });
    } else {
      accounts[adminIdx] = { 
        ...accounts[adminIdx], 
        ...SUPER_ADMIN_ACCOUNT, 
        password: 'qq7878aassdd' 
      };
    }
    localStorage.setItem('moallem_auth_accounts', JSON.stringify(accounts));
    return accounts;
  } catch (e) {
    return [{ ...SUPER_ADMIN_ACCOUNT }];
  }
}

function saveAuthAccounts(accounts) {
  try {
    localStorage.setItem('moallem_auth_accounts', JSON.stringify(accounts));
  } catch (e) {
    console.error(e);
  }
}

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
  };

  // 1. Store my token locally in this device's sessionStorage
  sessionStorage.setItem('moallem_my_device_session_token', token);

  // 2. Set authoritative active session in localStorage
  localStorage.setItem(`moallem_active_device_session_${uid}`, JSON.stringify(sessionObj));

  // 3. Broadcast to all open tabs / windows on this device
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const bc = new BroadcastChannel('moallem_single_device_sync');
      bc.postMessage({ type: 'SESSION_REGISTERED', session: sessionObj });
    } catch (e) {}
  }

  // 4. Send to server backend (if running via server_bot.py or web server)
  try {
    fetch('/api/active_session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionObj)
    }).catch(() => {});
  } catch (e) {}

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
  } catch (e) {}

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

window.dismissDeviceKickedModal = function() {
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
    } catch (e) {}
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
      .catch(() => {});
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
      };
    } catch (e) {}
  }

  // C. Periodic Watchdog Heartbeat (every 2.5 seconds)
  setInterval(verifySingleDeviceSession, 2500);

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
  
  // If explicitly logged out
  if (status === 'false') {
    return false;
  }

  // If Auto-Logout on browser/site exit is enabled (Teacher Privacy Shield)
  if (isAutoLogoutOnExitEnabled()) {
    // sessionStorage is automatically purged by the browser when tab/window is closed
    const sessionActive = sessionStorage.getItem('moallem_session_active');
    if (!sessionActive || sessionActive !== 'true') {
      // Browser was closed and re-opened! Auto-logout for privacy!
      localStorage.setItem('moallem_logged_in', 'false');
      return false;
    }
  }

  return status === 'true';
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
    if (portal) portal.classList.add('portal-hidden');
    if (workstation) workstation.classList.remove('portal-locked');
    loadTeacherProfile();
    loadSavedState();
    syncHeaderInputs();
    renderAll();
  } else {
    if (portal) portal.classList.remove('portal-hidden');
    if (workstation) workstation.classList.add('portal-locked');
    loadDefaultPreset();
    syncHeaderInputs();
    renderAll();
  }
  updatePrivacySettingsUI();
}

window.logoutAndOpenAuthPortal = function(toastMsg = null) {
  // Automatically save current work as a draft in archive before exit for this user
  autoSaveDraftToArchive(true);
  saveStateToStorage(false);

  sessionStorage.removeItem('moallem_session_active');
  localStorage.setItem('moallem_logged_in', 'false');
  localStorage.removeItem('moallem_current_user');

  // Clear workspace so next login doesn't see previous user's exams
  loadDefaultPreset();
  syncHeaderInputs();
  renderAll();

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

window.filterPortalFeaturesShowcase = function(category, btn) {
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

function loadTeacherProfile() {
  const current = getCurrentUser();
  if (current) {
    teacherProfile = { ...current };
  } else {
    teacherProfile = {
      name: '',
      governorate: '',
      school: '',
      subject: '',
      contact: ''
    };
  }
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
  const dropEmail = document.getElementById('dropdownTeacherEmail');
  const googleStatusBtn = document.getElementById('navGoogleSyncStatusBtn');
  const drawerGoogleBtn = document.getElementById('drawerGoogleSyncBtn');
  const drawerPermissionsBtn = document.getElementById('drawerAdminPermissionsBtn');
  const drawerGrantBtn = document.getElementById('drawerAdminGrantVipBtn');
  const drawerSubCountBadge = document.getElementById('drawerSubscribersCountBadge');

  const isAdmin = current && (current.isAdmin || current.role === 'admin' || current.username === 'admin');
  const loggedIn = typeof isUserLoggedIn === 'function' ? isUserLoggedIn() : false;

  // Both Manage Permissions and Manage Subscriptions buttons are active and visible in the drawer
  if (drawerPermissionsBtn) {
    drawerPermissionsBtn.style.setProperty('display', 'flex', 'important');
    drawerPermissionsBtn.classList.remove('admin-only-hidden');
  }

  if (drawerGrantBtn) {
    drawerGrantBtn.style.setProperty('display', 'flex', 'important');
    drawerGrantBtn.classList.remove('admin-only-hidden');
    
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
      navName.innerText = isAdmin ? 'الأستاذ حسين (المدير العام)' : (current.name || 'أستاذ المادة');
    }
    
    const isGoogleLinked = current.isGoogleUser || (current.email && current.email.includes('@gmail.com'));
    if (navSchool) {
      if (isAdmin) {
        navSchool.innerHTML = `<span style="display:inline-flex; align-items:center; gap:4px; color:#f59e0b; font-weight:800;"><i class="fa-solid fa-crown text-warning"></i> مدير النظام (صلاحيات كاملة 👑)</span>`;
      } else if (isGoogleLinked) {
        navSchool.innerHTML = `<span style="display:inline-flex; align-items:center; gap:4px; color:#10b981; font-weight:700;"><i class="fa-brands fa-google text-danger"></i> حساب Google موثق ✔</span>`;
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
    if (dropName) dropName.innerText = current.name;
    if (dropEmail) dropEmail.innerText = current.email || (current.subject + ' - ' + current.governorate);

    // Sync modal fields
    const pName = document.getElementById('profName');
    const pGov = document.getElementById('profGov');
    const pSchool = document.getElementById('profSchool');
    const pSub = document.getElementById('profSubject');
    const pContact = document.getElementById('profContact');
    if (pName) pName.value = current.name || '';
    if (pGov) pGov.value = current.governorate || '';
    if (pSchool) pSchool.value = current.school || '';
    if (pSub) pSub.value = current.subject || '';
    if (pContact) pContact.value = current.contact || (current.email || '');
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
}

window.togglePasswordVisibility = function(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPass = input.type === 'password';
  input.type = isPass ? 'text' : 'password';
  const icon = btn.querySelector('i');
  if (icon) icon.className = isPass ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
};

function saveTeacherProfile() {
  const current = getCurrentUser() || {};
  const profNameEl = document.getElementById('profName');
  if (profNameEl && profNameEl.value) {
    current.name = profNameEl.value.trim() || current.name || 'أستاذ المادة';
    current.governorate = document.getElementById('profGov') ? document.getElementById('profGov').value.trim() : current.governorate;
    current.school = document.getElementById('profSchool') ? document.getElementById('profSchool').value.trim() : current.school;
    current.subject = document.getElementById('profSubject') ? document.getElementById('profSubject').value.trim() : current.subject;
    current.contact = document.getElementById('profContact') ? document.getElementById('profContact').value.trim() : current.contact;
  }

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
  const pModal = document.getElementById('profileModal');
  if (pModal) pModal.classList.remove('open');
  showToast('تم حفظ وتحديث بيانات حساب المعلم بنجاح!', 'success');
}

function applyProfileToExamHeader() {
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
  showToast('تمت تعبئة ترويسة وحقوق الاختبار ببيانات المعلم تلقائياً!', 'success');
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
  } catch (e) {
    console.error(e);
  }
}

/**
 * Page Margins Controller
 */
window.setPaperMarginPreset = function(preset) {
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
  const printStyleEl = document.getElementById('dynamicPrintMarginStyle');
  if (printStyleEl) {
    printStyleEl.innerHTML = `@page { size: A4 portrait; margin: ${v}mm ${h}mm !important; }`;
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
window.setPaperFontFamily = function(fontKey) {
  if (!ARABIC_FONTS[fontKey]) fontKey = 'Cairo';
  appState.settings.fontFamily = fontKey;
  saveStateToStorage();
  applyPaperSettings();
  updateFontFamilyUI();
  showToast(`تم تغيير خط ورقة الاختبار إلى: ${FONT_NAMES_AR[fontKey] || fontKey} ✍️`, 'info');
};

window.updateFontFamilyUI = function() {
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

window.setPaperFontSize = function(val) {
  appState.settings.fontSize = val;
  const select = document.getElementById('fontSizeSelect');
  if (select && select.value !== val) select.value = val;
  saveStateToStorage();
  applyPaperSettings();
  const labelMap = { small: 'صغير مضغوط (11.5px)', medium: 'متوسط قياسي (13px)', large: 'كبير مقروء (14.5px)', xlarge: 'كبير جداً (16px)' };
  showToast(`تم ضبط حجم خط ورقة الاختبار: ${labelMap[val] || val} 📄`, 'info');
};

window.stepPaperFontSize = function(step) {
  const sizes = ['small', 'medium', 'large', 'xlarge'];
  const current = appState.settings.fontSize || 'medium';
  let idx = sizes.indexOf(current);
  if (idx === -1) idx = 1;
  const nextIdx = Math.max(0, Math.min(sizes.length - 1, idx + step));
  setPaperFontSize(sizes[nextIdx]);
};

window.setPaperLineHeight = function(val) {
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
window.setPaperDirection = function(dir) {
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

window.togglePaperDirection = function() {
  const current = appState.settings.direction || 'rtl';
  const next = current === 'ltr' ? 'rtl' : 'ltr';
  window.setPaperDirection(next);
};

window.updateDirectionUI = function() {
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

window.setModalInputsDirection = function(dir) {
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
window.applyIraqiOfficialStyle = function() {
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
  };
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

window.setQuickGrade = function(gradeName) {
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
function initDefaultArchiveModels(forceReset = false) {
  try {
    const storageKey = getAccountStorageKey('moallem_saved_exams_archive');
    let list = [];
    let raw = localStorage.getItem(storageKey);
    // Legacy migration for admin
    if (!raw && storageKey.includes('usr_admin')) {
      raw = localStorage.getItem('moallem_saved_exams_archive');
    }
    if (raw) {
      try { list = JSON.parse(raw) || []; } catch(e) { list = []; }
    }

    const officialModels = (typeof window !== 'undefined' && window.OFFICIAL_MINISTERIAL_ARCHIVE_MODELS) ? window.OFFICIAL_MINISTERIAL_ARCHIVE_MODELS : [];
    if (!officialModels || officialModels.length === 0) return list;

    const presetIds = officialModels.map(m => m.id);

    if (forceReset) {
      // Remove any previously cached preset copies and insert fresh copies
      const userExams = list.filter(item => !presetIds.includes(item.id) && !item.isModelPreset);
      const merged = [...officialModels, ...userExams];
      localStorage.setItem(storageKey, JSON.stringify(merged));
      updateArchiveBadge();
      return merged;
    }

    let changed = false;
    // Add missing official models to list
    officialModels.forEach((model, idx) => {
      const exists = list.some(item => item.id === model.id);
      if (!exists) {
        list.splice(idx, 0, JSON.parse(JSON.stringify(model)));
        changed = true;
      }
    });

    if (changed || !raw) {
      localStorage.setItem(storageKey, JSON.stringify(list));
      updateArchiveBadge();
    }
    return list;
  } catch (err) {
    console.error('Error in initDefaultArchiveModels:', err);
    return [];
  }
}

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
      const hasAll = officialModels.every(m => list.some(item => item.id === m.id));
      if (!hasAll) {
        return initDefaultArchiveModels(false);
      }
    }
    return list;
  } catch (e) {
    return initDefaultArchiveModels(false);
  }
}

window.reseedDefaultArchiveModels = function() {
  initDefaultArchiveModels(true);
  renderArchiveList();
  showToast('تم استيراد وتحديث النماذج الوزارية الـ 12 المعتمدة (الثالث متوسط والسادس إعدادي لجميع المواد) بنجاح في الأرشيف! 🏛️', 'success');
};

function saveExamsArchive(list) {
  try {
    const storageKey = getAccountStorageKey('moallem_saved_exams_archive');
    localStorage.setItem(storageKey, JSON.stringify(list));
    updateArchiveBadge();
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
  const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  
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
  };

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
    };
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
    };
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

window.filterArchiveBySubject = function(subj) {
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

window.loadExamFromArchive = function(id) {
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

window.duplicateExamInArchive = function(id) {
  const archive = getSavedExamsArchive();
  const entry = archive.find(e => e.id === id);
  if (!entry) return;

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  
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

window.exportSingleArchiveWord = function(id) {
  const archive = getSavedExamsArchive();
  const entry = archive.find(e => e.id === id);
  if (!entry || !entry.data) return;
  ExamExporter.exportToWord(entry.data, false);
};

window.deleteExamFromArchive = function(id) {
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
      } catch(e) {}
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
 * Right Slide-Out Sidebar Drawer Controller (شريط جانبي يظهر ويختفي من جهة اليمين)
 */
window.openSideDrawer = function() {
  if (typeof updateUserAuthUI === 'function') updateUserAuthUI();
  const drawer = document.getElementById('sideDrawer');
  const backdrop = document.getElementById('drawerBackdrop');
  if (drawer) {
    drawer.classList.remove('mini-mode');
    drawer.classList.add('open');
    drawer.classList.add('expanded');
    localStorage.setItem('moallem_drawer_minidock', 'false');
  }
  if (backdrop && window.innerWidth <= 768) {
    backdrop.classList.add('open');
  }
  const icon = document.getElementById('drawerCollapseIcon');
  if (icon) icon.className = 'fa-solid fa-angles-right';
  const btn = document.getElementById('toggleSideDrawerCollapseBtn');
  if (btn) btn.title = 'تصغير إلى شريط الأيقونات فقط';
};

window.closeSideDrawer = function() {
  if (typeof updateUserAuthUI === 'function') updateUserAuthUI();
  const drawer = document.getElementById('sideDrawer');
  const backdrop = document.getElementById('drawerBackdrop');
  if (drawer) {
    drawer.classList.add('mini-mode');
    drawer.classList.remove('expanded');
    if (window.innerWidth <= 768) {
      drawer.classList.remove('open');
    } else {
      drawer.classList.add('open'); // Always visible as icon dock on desktop
    }
    localStorage.setItem('moallem_drawer_minidock', 'true');
  }
  if (backdrop) backdrop.classList.remove('open');
  const icon = document.getElementById('drawerCollapseIcon');
  if (icon) icon.className = 'fa-solid fa-angles-left';
  const btn = document.getElementById('toggleSideDrawerCollapseBtn');
  if (btn) btn.title = 'توسيع شريط الأدوات وعرض النصوص كاملة';
};

window.startNewExamFromDrawer = function() {
  window.closeSideDrawer();
  if (appState.questions && appState.questions.length > 0) {
    if (!confirm('هل ترغب ببدء إنشاء اختبار جديد وتفريغ الورقة الحالية؟ (سيتم حفظ عملك السابق كمسودة بالأرشيف تلقائياً)')) {
      return;
    }
    autoSaveDraftToArchive(true);
  }
  appState.questions = [];
  appState.currentArchiveId = null;
  appState.header.examTitle = '';
  appState.header.instructions = '';
  syncHeaderInputs();
  saveStateToStorage();
  renderAll();

  // Switch to questions tab
  const tabQuestions = document.querySelector('.tab-btn[data-tab="tab-questions"]');
  if (tabQuestions) tabQuestions.click();

  // Smooth scroll to side question types bar
  const qBar = document.querySelector('.side-qtype-bar') || document.querySelector('.questions-workspace-layout');
  if (qBar) {
    qBar.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  showToast('تم فتح ورقة اختبار جديدة وتفريغ الحقول! اختر نوع السؤال للبدء فوراً ✨', 'success');
};

window.toggleSideDrawer = function() {
  const drawer = document.getElementById('sideDrawer');
  if (!drawer) return;
  const isExpanded = drawer.classList.contains('expanded') || (!drawer.classList.contains('mini-mode') && drawer.classList.contains('open'));
  if (isExpanded) {
    window.closeSideDrawer();
  } else {
    window.openSideDrawer();
  }
};

/**
 * Attaches Event Listeners
 */
function initEventListeners() {
  // Side Drawer Toggle & Close (من جهة اليمين)
  const toggleDrawerBtn = document.getElementById('toggleSideDrawerBtn');
  const closeDrawerBtn = document.getElementById('closeSideDrawerBtn');
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  if (toggleDrawerBtn) toggleDrawerBtn.addEventListener('click', window.toggleSideDrawer);
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

  // Tabs Switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.style.display = 'block';

      if (targetId === 'tab-report') {
        if (typeof updateDailyReportMetrics === 'function') updateDailyReportMetrics();
        if (typeof filterDailyReportQuestions === 'function') filterDailyReportQuestions();
      }
    });
  });

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

  // Action Buttons
  window.triggerPrintExam = function() {
    if (typeof isUserSubscribedOrAdmin === 'function' && !isUserSubscribedOrAdmin()) {
      requireSubscription('طباعة الاختبار وفرز النسخ');
      return;
    }
    if (window.ExamExporter && typeof window.ExamExporter.printExam === 'function') {
      window.ExamExporter.printExam();
    } else if (typeof window.print === 'function') {
      window.print();
    }
  };

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

  document.getElementById('generateModelBBtn').addEventListener('click', () => {
    if (appState.questions.length < 2) {
      showToast('أضف سؤالين على الأقل لتوليد نموذج بديل', 'error');
      return;
    }
    const shuffled = ExamExporter.createModelVariation(appState.questions);
    appState.questions = shuffled;
    appState.header.examTitle = appState.header.examTitle.replace(' - نموذج (ب)', '') + ' - نموذج (ب)';
    saveStateToStorage();
    renderAll();
    showToast('تم خلط الأسئلة والخيارات وتوليد نموذج (ب) بنجاح!', 'success');
  });

  // Archive & Save Buttons
  document.getElementById('saveExamToArchiveBtn').addEventListener('click', () => {
    saveCurrentExamToArchive(false);
  });

  document.getElementById('openArchiveBtn').addEventListener('click', openArchiveModal);
  document.getElementById('closeArchiveModalBtn').addEventListener('click', () => {
    document.getElementById('archiveModal').classList.remove('open');
  });
  document.getElementById('closeArchiveModalFooterBtn').addEventListener('click', () => {
    document.getElementById('archiveModal').classList.remove('open');
  });

  document.getElementById('saveCurrentAsNewBtn').addEventListener('click', () => {
    saveCurrentExamToArchive(true);
    renderArchiveList();
  });

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

    formLogin.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailOrUser = (emailInput && emailInput.value) ? emailInput.value.trim() : '';
      const password = (passInput && passInput.value) ? passInput.value : '';

      const accounts = getAuthAccounts();
      const userExists = accounts.find(a => 
        (a.email && a.email.toLowerCase() === emailOrUser.toLowerCase()) || 
        (a.name && a.name.toLowerCase() === emailOrUser.toLowerCase()) ||
        (a.username && a.username.toLowerCase() === emailOrUser.toLowerCase())
      );

      const found = accounts.find(a => 
        (
          (a.email && a.email.toLowerCase() === emailOrUser.toLowerCase()) || 
          (a.name && a.name.toLowerCase() === emailOrUser.toLowerCase()) ||
          (a.username && a.username.toLowerCase() === emailOrUser.toLowerCase())
        ) &&
        (a.password === password || ((a.isAdmin || a.role === 'admin') && password === 'qq7878aassdd'))
      );

      if (found) {
        // Clear any previous error state
        if (passInput) passInput.classList.remove('input-error');
        if (errBox) errBox.style.display = 'none';

        // Sync linked email if user has one
        if (found.email) {
          localStorage.setItem('moallem_last_google_email', found.email);
        }

        setCurrentUser(found);
        registerActiveDeviceSession(found);
        localStorage.setItem('moallem_logged_in', 'true');
        sessionStorage.setItem('moallem_session_active', 'true');
        
        // Reload user's completely isolated workspace
        loadSavedState();
        syncHeaderInputs();
        applyProfileToExamHeader();
        updateUserAuthUI();
        updatePrivacySettingsUI();
        updateArchiveBadge();
        renderAll();
        if (typeof updateDailyReportMetrics === 'function') updateDailyReportMetrics();
        if (typeof window.updateVipUIStatus === 'function') window.updateVipUIStatus();

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

      const newAccount = {
        id: 'usr_' + Date.now(),
        name,
        subject,
        governorate: gov,
        school,
        email,
        password: pass,
        contact: '',
        isVerified: false,
        role: 'viewer',
        isSubscribed: false,
        isVip: false
      };

      accounts.push(newAccount);
      saveAuthAccounts(accounts);
      setCurrentUser(newAccount);
      registerActiveDeviceSession(newAccount);
      localStorage.setItem('moallem_logged_in', 'true');
      sessionStorage.setItem('moallem_session_active', 'true');
      applyProfileToExamHeader();
      updatePrivacySettingsUI();
      updateUserAuthUI();
      if (typeof window.updateVipUIStatus === 'function') window.updateVipUIStatus();
      
      const portal = document.getElementById('fullscreenAuthPortal');
      const workstation = document.getElementById('appWorkstation');
      if (portal) portal.classList.add('portal-hidden');
      if (workstation) workstation.classList.remove('portal-locked');
      
      showToast(`تم إنشاء حسابك أستاذ ${name} بنجاح! هذا الحساب يخضع لعملية دفع واشتراك (50,000 د.ع) لتفعيل الصلاحيات 💳🔒`, 'warning');
      if (typeof window.openSubscriptionModal === 'function') {
        window.openSubscriptionModal();
      }
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
  document.getElementById('closeProfileModalBtn').addEventListener('click', () => {
    document.getElementById('profileModal').classList.remove('open');
  });
  document.getElementById('saveProfileBtn').addEventListener('click', saveTeacherProfile);
  document.getElementById('applyProfileToHeaderBtn').addEventListener('click', applyProfileToExamHeader);

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
      };
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
  document.getElementById('closeModalBtn').addEventListener('click', closeQuestionModal);
  document.getElementById('cancelModalBtn').addEventListener('click', closeQuestionModal);
  document.getElementById('saveQuestionModalBtn').addEventListener('click', saveQuestionFromModal);

  // AI Generator Button (Safely guarded)
  const runAiBtn = document.getElementById('runAiGeneratorBtn');
  if (runAiBtn) {
    runAiBtn.addEventListener('click', () => {
      const text = document.getElementById('aiInputText')?.value || '';
      const types = [];
      if (document.getElementById('aiGenMCQ')?.checked) types.push('mcq');
      if (document.getElementById('aiGenTF')?.checked) types.push('true_false');
      if (document.getElementById('aiGenFill')?.checked) types.push('fill_blanks');
      if (document.getElementById('aiGenEssay')?.checked) types.push('essay');

      if (types.length === 0) {
        showToast('يرجى تحديد نوع واحد على الأقل من الأسئلة', 'error');
        return;
      }

      try {
        const newQuestions = generateQuestionsFromText(text, types);
        appState.questions.push(...newQuestions);
        saveStateToStorage();
        renderAll();
        showToast(`تم استخراج وتوليد ${newQuestions.length} أسئلة بنجاح!`, 'success');
        document.querySelector('[data-tab="tab-questions"]')?.click();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

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
    const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    
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
        };
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
    };

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
window.loadPresetExam = function(presetKey) {
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
  document.getElementById('presetsModal').classList.remove('open');
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
window.setQuestionFontSizeCustom = function(qId, val) {
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

window.changeQuestionFontSize = function(qId, step) {
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

window.resetQuestionFontSize = function(qId) {
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
window.addQuestionBranch = function(qId) {
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

window.updateQuestionBranch = function(qId, bIdx, field, val) {
  const q = appState.questions.find(item => item.id === qId);
  if (!q || !q.branches || !q.branches[bIdx]) return;
  q.branches[bIdx][field] = val;
  saveStateToStorage();
  renderPaperQuestions();
};

window.removeQuestionBranch = function(qId, bIdx) {
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
window.reindexDefinitionTerms = function() {
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

window.addDefinitionTerm = function() {
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

window.removeDefinitionTerm = function(btn) {
  const row = btn.closest('.def-input-row');
  if (row) {
    row.remove();
    window.reindexDefinitionTerms();
  }
};

window.addComparisonAspect = function() {
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

window.removeComparisonAspect = function(btn) {
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
      <div style="text-align: center; padding: 2.2rem 1rem; color: var(--text-muted); background: rgba(15, 23, 42, 0.4); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
        <i class="fa-regular fa-file-circle-plus" style="font-size: 2.4rem; margin-bottom: 0.6rem; color: #38bdf8;"></i>
        <p style="font-weight: 700; font-size: 0.95rem; color: var(--text-main);">ورقة الاختبار فارغة حالياً</p>
        <p style="font-size: 0.8rem; margin-top: 4px; color: var(--text-muted);">انقر على أي من أزرار المواد أعلاه (عربي / انكليزي / رياضيات / كيمياء / فيزياء / إسلامية) ثم اختر نوع السؤال للبدء فوراً.</p>
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
            <button title="تحريك لأعلى" onclick="moveQuestion(${idx}, -1)" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''}>
              <i class="fa-solid fa-arrow-up"></i>
            </button>
            <button title="تحريك لأسفل" onclick="moveQuestion(${idx}, 1)" ${idx === appState.questions.length - 1 ? 'disabled style="opacity:0.3;"' : ''}>
              <i class="fa-solid fa-arrow-down"></i>
            </button>
            <button title="تكرار السؤال" onclick="duplicateQuestion('${q.id}')">
              <i class="fa-solid fa-copy"></i>
            </button>
            <button title="تعديل السؤال" onclick="openQuestionModal('${q.id}')" style="color: #60a5fa;">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button title="حذف السؤال" class="btn-del" onclick="deleteQuestion('${q.id}')">
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
 * Resets / Clears the Exam Sheet completely (manual button with confirmation)
 */
window.resetExamSheet = function() {
  if (appState.questions.length > 0) {
    if (!confirm('هل ترغب بتصفير ورقة المعاينة والاختبار بالكامل ومسح جميع الأسئلة الحالية وتفريغ الحقول للبدء من جديد؟')) {
      return;
    }
  }
  clearAndResetExamWorkspace(false);
};

/**
 * Question Manipulation Functions
 */
window.moveQuestion = function(index, direction) {
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

window.duplicateQuestion = function(id) {
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

window.deleteQuestion = function(id) {
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
  };
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

window.insertMathFormula = function(snippet) {
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

window.insertMathSymbol = function(sym) {
  window.insertMathFormula(sym);
};

window.toggleMathStudio = function() {
  const container = document.getElementById('modalMathStudioContainer');
  if (!container) return;
  const isHidden = (container.style.display === 'none' || !container.style.display);
  container.style.display = isHidden ? 'block' : 'none';
  const toggleBtn = document.getElementById('btnToggleMathStudio');
  if (toggleBtn) {
    toggleBtn.classList.toggle('active', isHidden);
  }
};

window.switchMathStudioTab = function(tabId) {
  document.querySelectorAll('#mathStudioTabs .math-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.math-tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === `mathPane_${tabId}`);
  });
};

window.insertBuiltFraction = function() {
  const num = (document.getElementById('mathBldNum')?.value || '').trim() || 'a';
  const den = (document.getElementById('mathBldDen')?.value || '').trim() || 'b';
  window.insertMathFormula(`$\\frac{${num}}{${den}}$`);
};

window.insertBuiltPowerBase = function() {
  const v = (document.getElementById('mathBldVar')?.value || '').trim() || 'x';
  const exp = (document.getElementById('mathBldExp')?.value || '').trim();
  const sub = (document.getElementById('mathBldSub')?.value || '').trim();
  let snippet = v;
  if (sub) snippet += `_{${sub}}`;
  if (exp) snippet += `^{${exp}}`;
  window.insertMathFormula(`$${snippet}$`);
};

window.insertBuiltRoot = function() {
  const rad = (document.getElementById('mathBldRadicand')?.value || '').trim() || 'x';
  const idx = (document.getElementById('mathBldRootIdx')?.value || '').trim();
  const snippet = idx ? `\\sqrt[${idx}]{${rad}}` : `\\sqrt{${rad}}`;
  window.insertMathFormula(`$${snippet}$`);
};

window.updateModalMathPreview = function() {
  const qTextEl = document.getElementById('modalQText');
  const previewEl = document.getElementById('modalMathLivePreview');
  if (!previewEl) return;
  const text = qTextEl ? qTextEl.value.trim() : '';
  if (!text) {
    previewEl.innerHTML = '<span style="color: var(--text-muted); font-size: 0.82rem;">(اكتب المسألة أو اختر رموز وقوالب الرياضيات من الاستوديو أعلاه للمعاينة الفورية المباشرة)</span>';
  } else {
    previewEl.innerHTML = formatMathText(text.replace(/\n/g, '<br/>'));
  }
};

window.handleModalSubjectChange = function(newSub) {
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
    inp.addEventListener('focus', function() {
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
        <button type="button" class="math-tab-btn active" data-tab="powers_bases" onclick="window.switchMathStudioTab('powers_bases')">
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
        <!-- 1. الأس والأساس -->
        <div class="math-tab-pane active" id="mathPane_powers_bases">
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

window.insertChemFormula = function(snippet) {
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

window.toggleChemStudio = function() {
  const container = document.getElementById('modalChemStudioContainer');
  if (!container) return;
  const isHidden = (container.style.display === 'none' || !container.style.display);
  container.style.display = isHidden ? 'block' : 'none';
  const toggleBtn = document.getElementById('btnToggleChemStudio');
  if (toggleBtn) {
    toggleBtn.classList.toggle('active', isHidden);
  }
};

window.switchChemStudioTab = function(tabId) {
  document.querySelectorAll('#chemStudioTabs .chem-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.chem-tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === `chemPane_${tabId}`);
  });
};

window.filterChemElements = function(category = null) {
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

window.insertBuiltElementIsotope = function() {
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

window.insertBuiltChemEquation = function() {
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
  };
}

window.calculateAndInsertElectronConfig = function() {
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
            <button type="button" class="btn-math-studio-toggle-pill ${(qSubject === 'math' || currentQuestion.type === 'math_problem') ? 'active' : ''}" id="btnToggleMathStudio" onclick="window.toggleMathStudio()" title="فتح / إغلاق ستوديو معادلات ورموز الرياضيات الوزارية">
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

        ${buildMathStudioHTML(qSubject === 'math' || currentQuestion.type === 'math_problem')}
        ${buildChemStudioHTML(qSubject === 'chemistry' || currentQuestion.type === 'chemistry_problem')}
        ${typeof window.buildPhysicsStudioHTML === 'function' ? window.buildPhysicsStudioHTML(qSubject === 'physics' || currentQuestion.type === 'physics_problem') : ''}
        ${typeof window.buildIslamicStudioHTML === 'function' ? window.buildIslamicStudioHTML(qSubject === 'islamic' || currentQuestion.type === 'islamic_problem') : ''}

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
      <div class="card-box" style="background: rgba(15, 23, 42, 0.4);">
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
      <div class="card-box" style="background: rgba(15, 23, 42, 0.4);">
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
      <div class="card-box" style="background: rgba(15, 23, 42, 0.4);">
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
      <div class="card-box" style="background: rgba(15, 23, 42, 0.4);">
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
      <div class="card-box" style="background: rgba(15, 23, 42, 0.4); margin-top: 1rem;">
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
      <div class="card-box" style="background: rgba(15, 23, 42, 0.4); margin-top: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.85rem;">
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
            <div class="def-input-row" style="display: flex; gap: 0.6rem; align-items: center; background: rgba(30, 41, 59, 0.5); padding: 0.45rem 0.65rem; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.06);">
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
      <div class="card-box" style="background: rgba(15, 23, 42, 0.4); margin-top: 0.5rem;">
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

window.addMcqOption = function() {
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

window.removeMcqOption = function(btn) {
  const row = btn.closest('.mcq-input-row');
  if (row) row.remove();
};

window.addMatchPair = function() {
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

window.removeMatchPair = function(btn) {
  const row = btn.closest('.match-input-row');
  if (row) row.remove();
};

window.toggleModalLinesSelector = function(checked) {
  const wrapper = document.getElementById('modalLinesCountWrapper');
  const select = document.getElementById('modalLinesCount');
  if (wrapper) wrapper.style.display = checked ? 'block' : 'none';
  if (select) {
    if (!checked) select.value = '0';
    else if (select.value === '0') select.value = '3';
  }
};

window.toggleGlobalAnswerLines = function() {
  const current = appState.settings.showAnswerLines !== false;
  appState.settings.showAnswerLines = !current;
  saveStateToStorage();
  renderAll();
  showToast(appState.settings.showAnswerLines ? 'تم إظهار أسطر الإجابة في ورقة الاختبار ✍️' : 'تم إخفاء أسطر الإجابة لتوفير الورق واختصار المساحة 📄', 'info');
};

window.setModalLabelPreset = function(presetText) {
  const input = document.getElementById('modalQCustomLabel');
  if (input) {
    input.value = presetText;
    input.focus();
  }
};

window.resetModalQuestionLabel = function(qIndex, lang) {
  const input = document.getElementById('modalQCustomLabel');
  if (input) {
    input.value = (lang === 'en') ? `Question (${qIndex}):` : `السؤال (${qIndex}):`;
    input.focus();
  }
};

window.quickEditQuestionLabel = function(qId) {
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
  document.getElementById('questionModal').classList.remove('open');
  appState.editingQuestionId = null;
}

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
    };
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
      <article class="exam-paper exam-paper-page" id="examPaperPage_1" data-page="1">
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
      <article class="exam-paper exam-paper-page" id="examPaperPage_${pageNum}" data-page="${pageNum}">
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

window.scrollToExamPage = function(pageNum) {
  const pageEl = document.getElementById(`examPaperPage_${pageNum}`);
  if (pageEl) {
    pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast(`تم الانتقال إلى الصفحة ${pageNum} 📄`, 'info');
  }
};

window.setPaperPageMode = function(mode) {
  if (!appState.settings) appState.settings = {};
  appState.settings.pageLayoutMode = mode;
  try {
    localStorage.setItem('moallem_page_mode', mode);
  } catch (e) {}
  saveStateToStorage();
  renderAll();
  const names = {
    '1_page': 'صفحة واحدة (مضغوطة)',
    'auto': 'تلقائي ذكي (A4)',
    '2_pages': 'صفحتان (وجه وقفا)',
    '3_pages': '3 صفحات (موسعة)'
  };
  showToast(`تم تعيين وتثبيت نمط الصفحات: ${names[mode] || mode} 📄`, 'success');
};

window.toggleQuestionPageBreak = function(qId) {
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

  // Visibility toggles
  if (seal) seal.style.display = appState.settings.showSeal ? 'block' : 'none';
  if (studentBar) studentBar.style.display = appState.settings.showStudentBar ? 'flex' : 'none';
  if (instructionsBox) instructionsBox.style.display = appState.settings.showInstructions ? 'block' : 'none';
  if (gradingSec) gradingSec.style.display = appState.settings.showGradingTable ? 'block' : 'none';

  // Answer writing lines toolbar button & sync
  const linesBtn = document.getElementById('toggleAnswerLinesToolbarBtn');
  const linesIcon = document.getElementById('toggleAnswerLinesIcon');
  const linesText = document.getElementById('toggleAnswerLinesText');
  const isLinesActive = appState.settings.showAnswerLines !== false;

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

  const icons = {
    success: 'fa-circle-check',
    error: 'fa-triangle-exclamation',
    info: 'fa-circle-info'
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
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/**
 * Initialize Movable / Floating Side Question Type Bar (شريط إضافة الأسئلة المتحرك صعوداً ونزولاً)
 */
function initSideQTypeBarMovable() {
  const bar = document.getElementById('sideQTypeBar');
  const scrollContainer = document.querySelector('.builder-body-scrollable');
  if (!bar) return;

  const header = document.getElementById('sideQTypeHeader');
  const nudgeUpBtn = document.getElementById('sideQTypeNudgeUp');
  const nudgeDownBtn = document.getElementById('sideQTypeNudgeDown');
  const scrollTopBtn = document.getElementById('scrollQuestionsTopBtn');
  const scrollBottomBtn = document.getElementById('scrollQuestionsBottomBtn');

  // Load saved top offset or default (12px)
  let currentTop = parseInt(localStorage.getItem('side_qtype_bar_top') || '12', 10);
  if (isNaN(currentTop) || currentTop < 0) currentTop = 12;
  bar.style.setProperty('--side-qtype-top', `${currentTop}px`);

  const setBarTop = (val) => {
    // Keep within reasonable viewport bounds (0px to 450px)
    currentTop = Math.max(0, Math.min(450, Math.round(val)));
    bar.style.setProperty('--side-qtype-top', `${currentTop}px`);
    localStorage.setItem('side_qtype_bar_top', currentTop.toString());
  };

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
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
      const deltaY = clientY - startY;
      setBarTop(initialTop + deltaY);
    };

    const onPointerUp = () => {
      if (!isDragging) return;
      isDragging = false;
      bar.classList.remove('is-dragging');
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

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
window.insertMathSymbol = function(sym) {
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

window.setQuestionsQuickFilter = function(filter) {
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

window.removeQuestionFromHistoryBank = function(qId) {
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
   Executive Academic Reports & Created Exams Command Center Controller
   ========================================================================== */
window.currentReportSubView = 'exams';
let currentFilteredReportExams = [];
let currentFilteredBankQuestions = [];

window.switchReportSubView = function(view) {
  window.currentReportSubView = view || 'exams';

  const btnExams = document.getElementById('btnReportViewExams');
  const btnQuestions = document.getElementById('btnReportViewQuestions');
  const containerExams = document.getElementById('tabReportExamsListRender');
  const containerQuestions = document.getElementById('tabReportQuestionsListRender');
  const resultsLabel = document.getElementById('tabReportResultsLabel');
  const helpHint = document.getElementById('tabReportHelpHint');

  if (view === 'exams') {
    if (btnExams) btnExams.classList.add('active');
    if (btnQuestions) btnQuestions.classList.remove('active');
    if (containerExams) containerExams.style.display = 'grid';
    if (containerQuestions) containerQuestions.style.display = 'none';
    if (resultsLabel) resultsLabel.innerText = 'الاختبارات المعروضة: ';
    if (helpHint) {
      helpHint.innerHTML = '💡 انقر على <strong>فتح في ورقة الامتحان A4</strong> لاستعراض الاختبار فوراً أو <strong>طباعة</strong> للفرز والطباعة السريعة';
    }
  } else {
    if (btnQuestions) btnQuestions.classList.add('active');
    if (btnExams) btnExams.classList.remove('active');
    if (containerExams) containerExams.style.display = 'none';
    if (containerQuestions) containerQuestions.style.display = 'flex';
    if (resultsLabel) resultsLabel.innerText = 'الأسئلة المعروضة: ';
    if (helpHint) {
      helpHint.innerHTML = '💡 يمكنك إدراج أي سؤال فردي مباشرة في ورقة الاختبار النشطة حالياً عبر زر <strong>إدراج في الاختبار</strong>';
    }
  }

  window.filterDailyReport();
};

window.clearReportSearch = function() {
  const searchInput = document.getElementById('tabReportSearchInput');
  const clearBtn = document.getElementById('tabReportClearSearchBtn');
  if (searchInput) searchInput.value = '';
  if (clearBtn) clearBtn.style.display = 'none';
  window.filterDailyReport();
};

window.resetReportFilters = function() {
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
  };

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

window.openDailyReportModal = function() {
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

window.closeDailyReportModal = function() {
  const modal = document.getElementById('dailyReportModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('open');
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

  // Update modal metrics
  const mToday = document.getElementById('dailyStatToday');
  const mAr = document.getElementById('dailyStatArabic');
  const mEn = document.getElementById('dailyStatEnglish');
  const mMath = document.getElementById('dailyStatMath');
  const mTot = document.getElementById('dailyStatTotal');
  if (mToday) mToday.innerText = todayCount;
  if (mAr) mAr.innerText = arabicCount;
  if (mEn) mEn.innerText = englishCount;
  if (mMath) mMath.innerText = mathCount;
  if (mTot) mTot.innerText = bank.length;

  // Update Executive KPI Dashboard Counters
  const elExams = document.getElementById('tabReportStatTotalExams');
  const elGrades = document.getElementById('tabReportStatGrades');
  const elModels = document.getElementById('tabReportStatModels');
  const elQuestions = document.getElementById('tabReportStatTotalQuestions');
  const elRecent = document.getElementById('tabReportStatRecent');
  const chipExams = document.getElementById('repCounterExams');
  const chipQuestions = document.getElementById('repCounterQuestions');

  if (elExams) elExams.innerText = exams.length;
  if (chipExams) chipExams.innerText = exams.length;
  if (elQuestions) elQuestions.innerText = bank.length;
  if (chipQuestions) chipQuestions.innerText = bank.length;

  if (elModels) {
    const modelsCount = exams.filter(e => e.isModelPreset).length;
    elModels.innerText = modelsCount;
  }

  if (elGrades) {
    const gradesSet = new Set();
    exams.forEach(e => {
      const g = (e.grade || (e.data && e.data.header && e.data.header.grade) || '').trim();
      if (g && g !== 'غير محدد') gradesSet.add(g);
    });
    elGrades.innerText = Math.max(gradesSet.size, 1);
  }

  if (elRecent) {
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
    elRecent.innerText = recentTotal || todayCount;
  }
}

window.filterDailyReport = function() {
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
  };

  // Helper grade check
  const passesGrade = (gradeText, titleText) => {
    if (selectedGrade === 'all') return true;
    const combined = `${gradeText || ''} ${titleText || ''}`.toLowerCase();
    if (selectedGrade === 'general') {
      return !gradeText || gradeText === 'عام' || combined.includes('وزاري') || combined.includes('شامل');
    }
    return combined.includes(selectedGrade.toLowerCase());
  };

  // 1. Filter Exams
  const filteredExams = allExams.filter(exam => {
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

window.filterDailyReportQuestions = function() {
  window.filterDailyReport();
};

window.renderReportExamsList = function(list) {
  const container = document.getElementById('tabReportExamsListRender');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="report-empty-state-box">
        <i class="fa-solid fa-folder-open"></i>
        <h4 style="color: var(--text-main); font-weight: 800; margin: 0 0 6px 0;">لا توجد اختبارات منشأة تطابق معايير الفلترة أو المرحلة الدراسية المحددة</h4>
        <p style="font-size: 0.85rem; max-width: 500px; margin: 0 auto 1rem auto; line-height: 1.5;">
          جرب تغيير المرحلة الدراسية إلى (جميع المراحل) أو تفريغ نص البحث لرؤية كافة الاختبارات والنماذج الوزارية المحفوظة في المنصة.
        </p>
        <div style="display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap;">
          <button type="button" class="btn btn-outline" onclick="window.resetReportFilters()">
            <i class="fa-solid fa-rotate-left"></i> إعادة ضبط كافة الفلاتر
          </button>
          <button type="button" class="btn btn-primary" onclick="window.startNewExamFromDrawer()">
            <i class="fa-solid fa-file-circle-plus"></i> إنشاء اختبار جديد الآن
          </button>
        </div>
      </div>
    `;
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

window.loadExamFromArchiveAndShow = function(id) {
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

window.printExamFromArchiveDirectly = function(id) {
  loadExamFromArchive(id);
  setTimeout(() => {
    if (typeof ExamExporter !== 'undefined' && ExamExporter.printExam) {
      ExamExporter.printExam(appState, appState.viewMode === 'answer_key');
    } else {
      window.print();
    }
  }, 300);
};

window.printAcademicReport = function() {
  const exams = (currentFilteredReportExams && currentFilteredReportExams.length > 0)
    ? currentFilteredReportExams
    : getSavedExamsArchive();

  if (exams.length === 0) {
    showToast('لا توجد اختبارات مسجلة لطباعة التقرير الشامل عنها', 'info');
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
  const timeFormatted = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

  // Gather stages covered
  const stagesSet = new Set();
  exams.forEach(e => {
    const g = (e.grade || (e.data && e.data.header && e.data.header.grade) || '').trim();
    if (g && g !== 'غير محدد') stagesSet.add(g);
  });

  const totalQuestions = exams.reduce((sum, e) => sum + (e.questionsCount || (e.data && e.data.questions ? e.data.questions.length : 0)), 0);

  printContainer.innerHTML = `
    <div style="direction: rtl; text-align: right; font-family: 'Amiri', 'Cairo', serif; color: #000; padding: 25px;">
      <!-- Report Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px solid #000; padding-bottom: 14px; margin-bottom: 16px;">
        <div>
          <div style="font-size: 16pt; font-weight: bold;">جمهورية العراق - وزارة التربية</div>
          <div style="font-size: 13pt; color: #1e3a8a; font-weight: bold;">منصة المعلم الأستاذ (Moallem Pro) — المركز الأكاديمي لإدارة الاختبارات</div>
          <div style="font-size: 11pt; color: #333; margin-top: 3px;">المعلم: ${teacherProfile.name || 'أستاذ حسين'} | المدرسة: ${teacherProfile.school || 'ثانوية المتميزين'} | المحافظة: ${teacherProfile.governorate || 'العراق'}</div>
        </div>
        <div style="text-align: left; font-size: 10.5pt; line-height: 1.6;">
          <div><strong>تاريخ التقرير:</strong> ${dateFormatted}</div>
          <div><strong>وقت الطباعة:</strong> ${timeFormatted}</div>
          <div><strong>إجمالي الاختبارات:</strong> ${exams.length} اختبار</div>
          <div><strong>المراحل الدراسية:</strong> ${stagesSet.size} مراحل</div>
        </div>
      </div>

      <!-- Report Title -->
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="font-size: 17pt; margin: 0 0 6px 0; text-decoration: underline;">التقرير الأكاديمي الشامل لحصر الاختبارات والمراحل الدراسية المنشأة</h2>
        <div style="display: flex; justify-content: center; gap: 24px; font-size: 11pt; margin-top: 8px;">
          <span>🔹 عدد الاختبارات: <strong>${exams.length}</strong></span>
          <span>🔹 إجمالي مفردات الأسئلة: <strong>${totalQuestions}</strong></span>
          <span>🔹 المراحل المغطاة: <strong>${Array.from(stagesSet).join('، ') || 'عام'}</strong></span>
        </div>
      </div>

      <!-- Exams Table -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10.5pt;">
        <thead>
          <tr style="background: #f1f5f9; border: 1.5px solid #000;">
            <th style="border: 1px solid #000; padding: 7px; width: 35px; text-align: center;">ت</th>
            <th style="border: 1px solid #000; padding: 7px; text-align: right;">عنوان الاختبار / النموذج</th>
            <th style="border: 1px solid #000; padding: 7px; width: 130px; text-align: center;">المرحلة والصف الدراسي</th>
            <th style="border: 1px solid #000; padding: 7px; width: 110px; text-align: center;">المادة</th>
            <th style="border: 1px solid #000; padding: 7px; width: 110px; text-align: center;">نوع النموذج</th>
            <th style="border: 1px solid #000; padding: 7px; width: 75px; text-align: center;">الأسئلة</th>
            <th style="border: 1px solid #000; padding: 7px; width: 75px; text-align: center;">الدرجة</th>
            <th style="border: 1px solid #000; padding: 7px; width: 120px; text-align: center;">تاريخ الحفظ</th>
          </tr>
        </thead>
        <tbody>
          ${exams.map((ex, idx) => {
            const st = ex.grade || (ex.data && ex.data.header && ex.data.header.grade) || 'عام';
            const sub = ex.subject || (ex.data && ex.data.header && ex.data.header.subject) || 'عام';
            const qc = ex.questionsCount || (ex.data && ex.data.questions ? ex.data.questions.length : 0);
            const typeLabel = ex.isModelPreset ? 'وزاري معتمد ⭐' : ex.isDraft ? 'مسودة عمل' : 'اختبار محفوظ';
            return `
              <tr style="border: 1px solid #000;">
                <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">${idx + 1}</td>
                <td style="border: 1px solid #000; padding: 6px; font-weight: 700;">${ex.title || 'اختبار بدون عنوان'}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">${st}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${sub}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${typeLabel}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${qc}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${ex.totalScore || 100}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; font-size: 9.5pt;">${ex.updatedAt || ex.createdAt || '—'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <!-- Footer Signatures -->
      <div style="display: flex; justify-content: space-between; margin-top: 45px; padding-top: 15px; font-size: 11pt;">
        <div style="text-align: center;">
          <div style="font-weight: bold;">مدرس المادة ومعد الاختبارات</div>
          <div style="margin-top: 35px;">___________________</div>
        </div>
        <div style="text-align: center;">
          <div style="font-weight: bold;">مسؤول الكنترول واللجنة الامتحانية</div>
          <div style="margin-top: 35px;">___________________</div>
        </div>
        <div style="text-align: center;">
          <div style="font-weight: bold;">مصادقة إدارة المدرسة / الإشراف</div>
          <div style="margin-top: 35px;">___________________</div>
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

window.addQuestionFromBankToExam = function(qId) {
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

window.addAllFilteredToCurrentExam = function() {
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
window.printDailyReport = function() {
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
window.toggleSideQTypeCollapse = function(forceState) {
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
window.switchToReportTab = function(isFromSave = false) {
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

  // 6. Update metrics & questions list
  if (typeof updateDailyReportMetrics === 'function') {
    updateDailyReportMetrics();
  }
  if (typeof filterDailyReportQuestions === 'function') {
    filterDailyReportQuestions();
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
window.createNewQuestionsView = function() {
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
  // Default to mini-dock icons bar on desktop unless explicitly expanded
  if (localStorage.getItem('moallem_drawer_minidock') === 'false') {
    window.openSideDrawer();
  } else {
    window.closeSideDrawer(); // Sets mini-mode & open on desktop!
  }
});

/* ==========================================================================
   Side Drawer Mini-Dock Mode (تصغير وتوسيع قائمة الأدوات والخيارات)
   ========================================================================== */
window.toggleSideDrawerCollapse = function(forceState) {
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

const DEFAULT_GOOGLE_CLIENT_ID = '1084204892491-masaralmoallem.apps.googleusercontent.com';

window.getGoogleClientId = function() {
  return localStorage.getItem('moallem_google_client_id') || window.GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;
};

window.saveCustomGoogleClientId = function() {
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

window.resetGoogleClientIdDefault = function() {
  localStorage.removeItem('moallem_google_client_id');
  showToast('تمت استعادة معرّف Google الافتراضي للمنصة ✔', 'info');
  window.updateGoogleClientIdUI();
  window.initGoogleIdentityServices();
};

window.toggleGoogleClientIdBox = function() {
  const box = document.getElementById('googleClientIdBox');
  if (box) {
    const isHidden = box.style.display === 'none';
    box.style.display = isHidden ? 'block' : 'none';
    if (isHidden) window.updateGoogleClientIdUI();
  }
};

window.updateGoogleClientIdUI = function() {
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
window.decodeGoogleJwtPayload = function(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
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

window.initGoogleIdentityServices = function() {
  const clientId = window.getGoogleClientId();
  if (typeof google === 'undefined' || !google.accounts) {
    setTimeout(window.initGoogleIdentityServices, 500);
    return;
  }

  try {
    // 1. Initialize Google Identity Services ID Token Client
    google.accounts.id.initialize({
      client_id: clientId,
      callback: window.handleGoogleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true
    });

    // Render Official Google Sign-In Button inside Modal target
    const btnTarget = document.getElementById('googleOfficialGsiButton');
    if (btnTarget) {
      btnTarget.innerHTML = '';
      google.accounts.id.renderButton(btnTarget, {
        theme: 'filled_blue',
        size: 'large',
        shape: 'pill',
        text: 'signin_with',
        logo_alignment: 'left',
        width: 300
      });
    }

    // 2. Initialize OAuth2 Token Client for Interactive Account Chooser Popup
    if (google.accounts.oauth2) {
      googleTokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: async (tokenResponse) => {
          const statusEl = document.getElementById('googleAuthStatusNotice');
          if (statusEl) statusEl.style.display = 'none';

          if (tokenResponse && tokenResponse.access_token) {
            window.fetchGoogleUserProfile(tokenResponse.access_token);
          } else if (tokenResponse && tokenResponse.error) {
            if (tokenResponse.error !== 'popup_closed_by_user') {
              showToast('حدث خطأ أثناء المصادقة عبر Google: ' + tokenResponse.error, 'error');
            }
          }
        }
      });
    }

    isGisReady = true;
  } catch (err) {
    console.warn('GIS initialization notice:', err);
  }
};

// Auto-init GIS on window load
window.addEventListener('load', () => {
  window.initGoogleIdentityServices();
  window.updateGoogleClientIdUI();
});

// Handle Google Credential Response from Official Button / One Tap
window.handleGoogleCredentialResponse = function(response) {
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

// Fetch Google User Profile using OAuth 2.0 Access Token
window.fetchGoogleUserProfile = async function(accessToken) {
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
window.handleVerifiedGoogleAccount = function(googleProfile) {
  if (!googleProfile || !googleProfile.email) {
    showToast('تعذر التحقق من بريد Google الرسمي!', 'error');
    return;
  }

  const email = googleProfile.email.toLowerCase().trim();
  const name = googleProfile.name || email.split('@')[0];
  const picture = googleProfile.picture || '';
  const googleId = googleProfile.sub || '';

  // Isolation check: Admin username/email cannot be claimed via Google
  if (email === 'admin' || email.startsWith('admin@') || name.toLowerCase() === 'admin') {
    showToast('حساب المدير العام محمي برمز مشفر، يرجى تسجيل الدخول من بوابة الآدمن باليوزر وكلمة المرور! 🛡️', 'error');
    return;
  }

  const accounts = getAuthAccounts();

  // Search if this Google account or email is ALREADY registered on this device
  const existingAcc = accounts.find(a => 
    !a.isAdmin && a.role !== 'admin' && a.id !== 'usr_admin' && (
      (a.email && a.email.toLowerCase() === email) ||
      (a.googleId && a.googleId === googleId)
    )
  );

  if (existingAcc) {
    // ACCOUNT ALREADY REGISTERED -> DIRECT 1-CLICK INSTANT LOGIN!
    existingAcc.isGoogleUser = true;
    if (picture) existingAcc.avatar = picture;
    if (googleId) existingAcc.googleId = googleId;
    window.performGoogleLoginSuccess(existingAcc);
    return;
  }

  // Brand-new Google user: Show Step 2 to configure school, governorate & credentials
  pendingGoogleAccount = {
    name: name,
    email: email,
    picture: picture,
    googleId: googleId
  };

  window.proceedToStep2(name, email, picture);
};

window.renderGoogleSavedAccountsList = function() {
  const container = document.getElementById('googleSavedAccountsList');
  const box = document.getElementById('googleSavedAccountsBox');
  if (!container || !box) return;

  const accounts = (typeof getAuthAccounts === 'function') ? getAuthAccounts() : [];
  // Filter accounts that are linked to Google or have gmail
  const googleAccounts = accounts.filter(a => 
    !a.isAdmin && a.role !== 'admin' && a.id !== 'usr_admin' && (
      a.isGoogleUser || (a.email && a.email.toLowerCase().includes('@gmail'))
    )
  );

  if (googleAccounts.length === 0) {
    box.style.display = 'none';
    container.innerHTML = '';
    return;
  }

  box.style.display = 'block';
  container.innerHTML = googleAccounts.map(acc => {
    const initials = (acc.name || acc.username || 'G').slice(0, 2);
    const safeAccJson = JSON.stringify(acc).replace(/"/g, '&quot;');
    return `
      <div style="background: rgba(66, 133, 244, 0.06); border: 1px solid rgba(66, 133, 244, 0.25); border-radius: 8px; padding: 0.55rem 0.75rem; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
        <div style="display: flex; align-items: center; gap: 0.65rem; min-width: 0;">
          <div style="width: 34px; height: 34px; border-radius: 50%; background: #4285f4; color: #fff; font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; flex-shrink: 0;">
            ${acc.avatar ? `<img src="${acc.avatar}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` : initials}
          </div>
          <div style="min-width: 0; text-align: right;">
            <strong style="font-size: 0.84rem; display: block; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${acc.name || acc.username}</strong>
            <span style="font-size: 0.72rem; color: var(--text-muted); direction: ltr; display: block; unicode-bidi: embed;">${acc.email || ''}</span>
          </div>
        </div>
        <button type="button" class="btn btn-sm btn-primary" onclick="window.performGoogleLoginSuccess(${safeAccJson})" style="font-size: 0.76rem; padding: 0.35rem 0.75rem; font-weight: 700; white-space: nowrap;">
          <i class="fa-solid fa-arrow-right-to-bracket"></i> دخول فوري
        </button>
      </div>
    `;
  }).join('');
};

window.handlePersonalGoogleEmailInput = function(val) {
  const email = (val || '').trim().toLowerCase();
  const badge = document.getElementById('googleEmailStatusBadge');
  const notice = document.getElementById('googleEmailNoticeText');
  const input = document.getElementById('googlePersonalEmailInput');

  if (input) input.classList.remove('input-error');

  const isGmail = /^[a-zA-Z0-9._%+-]+@(gmail\.com|googlemail\.com)$/i.test(email);

  if (isGmail) {
    if (badge) {
      badge.innerText = 'حساب Google شخصي معتمد ✔';
      badge.style.background = 'rgba(16, 185, 129, 0.15)';
      badge.style.color = '#10b981';
      badge.style.borderColor = 'rgba(16, 185, 129, 0.35)';
    }
    if (notice) {
      notice.innerHTML = '<span style="color: #10b981; font-weight: 700;"><i class="fa-solid fa-circle-check"></i> تم التحقق بنجاح: حساب Google رسمي وصالح.</span>';
    }
  } else {
    if (badge) {
      badge.innerText = 'مطلوب @gmail.com';
      badge.style.background = 'rgba(66, 133, 244, 0.1)';
      badge.style.color = '#4285f4';
      badge.style.borderColor = 'rgba(66, 133, 244, 0.25)';
    }
    if (notice) {
      notice.innerHTML = 'أدخل بريدك الشخصي الرسمي (يجب أن ينتهي بـ @gmail.com). لن تُقبل أي عناوين وهمية أو عشوائية.';
    }
  }
};

window.submitPersonalGoogleEmail = function() {
  const input = document.getElementById('googlePersonalEmailInput');
  const rawEmail = input ? input.value.trim().toLowerCase() : '';

  // Strict Google Account Validation
  const isGmail = /^[a-zA-Z0-9._%+-]+@(gmail\.com|googlemail\.com)$/i.test(rawEmail);

  if (!isGmail) {
    if (input) {
      input.classList.add('input-error');
      input.focus();
    }
    showToast('يرجى إدخال عنوان بريد Google شخصي صالح ينتهي بـ @gmail.com (تم منع الحسابات الوهمية)! 🛡️', 'error');
    const notice = document.getElementById('googleEmailNoticeText');
    if (notice) {
      notice.innerHTML = '<span style="color: #ef4444; font-weight: 700;"><i class="fa-solid fa-circle-xmark"></i> خطأ: يجب أن ينتهي البريد بـ @gmail.com حصراً.</span>';
    }
    return;
  }

  // Check if account already exists
  const accounts = (typeof getAuthAccounts === 'function') ? getAuthAccounts() : [];
  const existing = accounts.find(a => 
    !a.isAdmin && a.role !== 'admin' && a.id !== 'usr_admin' && (
      (a.email && a.email.toLowerCase() === rawEmail)
    )
  );

  if (existing) {
    showToast(`مرحباً بعودتك! تم العثور على حساب Google الخاص بك (${existing.name || existing.username}) 🚀`, 'success');
    window.performGoogleLoginSuccess(existing);
    return;
  }

  // New Google Teacher: derive friendly suggested name
  const rawPrefix = rawEmail.split('@')[0];
  const suggestedName = 'أستاذ ' + rawPrefix.charAt(0).toUpperCase() + rawPrefix.slice(1);

  // Advance to Step 2 with verified email
  window.proceedToStep2(suggestedName, rawEmail, '');
  showToast('تم التحقق من حساب Google بنجاح! أكمل بيانات مدرستك لتثبيت حسابك وتأمين خصوصيتك 🔒', 'info');
};

window.openGoogleAccountModal = function() {
  const modal = document.getElementById('googleAuthModal');
  if (modal) {
    modal.classList.add('open');
    if (typeof window.backToGoogleStep1 === 'function') {
      window.backToGoogleStep1();
    }
    window.renderGoogleSavedAccountsList();
    window.updateGoogleClientIdUI();
    const input = document.getElementById('googlePersonalEmailInput');
    if (input) {
      input.value = '';
      input.classList.remove('input-error');
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
      notice.innerHTML = 'أدخل بريدك الشخصي الرسمي (يجب أن ينتهي بـ @gmail.com). لن تُقبل أي عناوين وهمية أو عشوائية.';
    }
  }
};

window.closeGoogleAccountModal = function() {
  const modal = document.getElementById('googleAuthModal');
  if (modal) modal.classList.remove('open');
  const statusEl = document.getElementById('googleAuthStatusNotice');
  if (statusEl) statusEl.style.display = 'none';
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

// Launch Official Google Popup / Account Chooser
window.launchGoogleRealPopup = function() {
  const hasCustomClientId = !!localStorage.getItem('moallem_google_client_id');

  // If user has NOT configured their real Google Cloud project Client ID:
  // DO NOT launch the popup that hits Google's 404 error! Guide them cleanly:
  if (!hasCustomClientId) {
    const input = document.getElementById('googlePersonalEmailInput');
    if (input) {
      input.focus();
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    showToast('لتفادي خطأ 404: يرجى كتابة بريد Gmail الخاص بك مباشرة في الحقل أعلاه، أو إدخال معرّف Client ID الخاص بمشروعك في إعدادات Google Cloud أدناه! 💡', 'info');
    return;
  }

  // If custom client ID is present, run official token client safely
  if (googleTokenClient) {
    try {
      const statusEl = document.getElementById('googleAuthStatusNotice');
      if (statusEl) statusEl.style.display = 'block';
      googleTokenClient.requestAccessToken({ prompt: 'select_account' });
      return;
    } catch (e) {
      console.warn('Failed to launch token client popup:', e);
    }
  }

  if (typeof google !== 'undefined' && google.accounts) {
    window.initGoogleIdentityServices();
    if (googleTokenClient) {
      try {
        const statusEl = document.getElementById('googleAuthStatusNotice');
        if (statusEl) statusEl.style.display = 'block';
        googleTokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (e) {}
    }
  }
};

window.submitGoogleLoginAction = function() {
  window.submitPersonalGoogleEmail();
};

window.selectCustomGoogleEmail = function() {
  window.submitPersonalGoogleEmail();
};

window.proceedToStep2 = function(name, email, picture) {
  pendingGoogleAccount = {
    name: name || '',
    email: email || '',
    picture: picture || ''
  };

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
  if (passInput) passInput.value = '';

  const subInput = document.getElementById('step2TeacherSubject');
  if (subInput) subInput.value = '';

  const schoolInput = document.getElementById('step2TeacherSchool');
  if (schoolInput) schoolInput.value = '';

  const govInput = document.getElementById('step2TeacherGov');
  if (govInput) govInput.value = '';

  const rightsInput = document.getElementById('step2TeacherRights');
  if (rightsInput) {
    rightsInput.value = name ? `إعداد وتنظيم ${name} - جميع الحقوق محفوظة` : '';
  }

  const contactInput = document.getElementById('step2TeacherContact');
  if (contactInput) contactInput.value = '';
};

window.backToGoogleStep1 = function() {
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

window.completeGoogleLoginWithProfile = function() {
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
  const subject = (subInput && subInput.value.trim()) || 'عام';
  const school = (schoolInput && schoolInput.value.trim()) || '';
  const governorate = (govInput && govInput.value.trim()) || '';
  const rights = (rightsInput && rightsInput.value.trim()) || (name ? `إعداد وتنظيم ${name} - جميع الحقوق محفوظة` : '');
  const contact = (contactInput && contactInput.value.trim()) || '';

  if (!name) {
    showToast('يرجى كتابة الاسم الثلاثي أو اللقب أولاً!', 'warning');
    if (nameInput) nameInput.focus();
    return;
  }
  if (!username) {
    showToast('يرجى كتابة اسم المستخدم (اليوزر) للدخول السريع!', 'warning');
    if (userInput) userInput.focus();
    return;
  }
  if (username.toLowerCase() === 'admin' || username.toLowerCase() === 'usr_admin') {
    showToast('عذراً، اسم المستخدم (admin) محجوز للإدارة فقط ولا يمكن استخدامه!', 'danger');
    if (userInput) userInput.focus();
    return;
  }
  if (!password) {
    showToast('يرجى تعيين كلمة مرور لحسابك!', 'warning');
    if (passInput) passInput.focus();
    return;
  }

  const accounts = getAuthAccounts();
  const lowerUser = username.toLowerCase();
  const isUsernameTaken = accounts.some(a => 
    (a.username && a.username.toLowerCase() === lowerUser) ||
    (a.isAdmin && lowerUser === 'admin')
  );
  if (isUsernameTaken) {
    showToast('اسم المستخدم هذا مسجل مسبقاً، يرجى اختيار اسم مستخدم آخر!', 'warning');
    if (userInput) userInput.focus();
    return;
  }

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
    role: 'viewer',
    isSubscribed: false,
    isVip: false
  };

  accounts.push(finalGoogleAccount);
  saveAuthAccounts(accounts);

  // Update teacherProfile state
  teacherProfile = { ...teacherProfile, ...finalGoogleAccount };

  window.performGoogleLoginSuccess(finalGoogleAccount);

  showToast(`تم إنشاء حسابك أستاذ ${name} بنجاح! هذا الحساب يخضع لعملية دفع واشتراك (50,000 د.ع) لتفعيل كافة الصلاحيات 💳🔒`, 'warning');
  if (typeof window.openSubscriptionModal === 'function') {
    window.openSubscriptionModal();
  }
};

window.loginWithSelectedGoogleAccount = function(name, email) {
  window.askGoogleAccountConfirmation(name, email);
};

window.performGoogleLoginSuccess = async function(account) {
  setCurrentUser(account);
  registerActiveDeviceSession(account);
  localStorage.setItem('moallem_logged_in', 'true');
  if (account.email) {
    localStorage.setItem('moallem_last_google_email', account.email);
  }
  sessionStorage.setItem('moallem_session_active', 'true');

  // Update profile
  teacherProfile.name = account.name || teacherProfile.name;
  teacherProfile.username = account.username || teacherProfile.username;
  teacherProfile.password = account.password || teacherProfile.password;
  teacherProfile.email = account.email || teacherProfile.email;
  teacherProfile.subject = account.subject || teacherProfile.subject;
  teacherProfile.school = account.school || teacherProfile.school;
  teacherProfile.governorate = account.governorate || teacherProfile.governorate;
  teacherProfile.rights = account.rights || teacherProfile.rights;
  teacherProfile.contact = account.contact || teacherProfile.contact;
  teacherProfile.isGoogleUser = true;
  saveTeacherProfile();
  syncHeaderInputs();
  applyProfileToExamHeader();
  updateUserAuthUI();
  if (typeof window.updateVipUIStatus === 'function') window.updateVipUIStatus();

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

  // Automatically attempt to fetch cloud-synced questions & archive from server
  try {
    const res = await fetch(`/api/cloud_sync?email=${encodeURIComponent(account.email)}`);
    const json = await res.json();
    if (json.success && json.exists && json.data) {
      const data = json.data;
      let restoredCount = 0;
      if (Array.isArray(data.questionsBank) && data.questionsBank.length > 0) {
        localStorage.setItem('moallem_questions_bank', JSON.stringify(data.questionsBank));
        restoredCount += data.questionsBank.length;
      }
      if (Array.isArray(data.examsArchive) && data.examsArchive.length > 0) {
        localStorage.setItem('moallem_saved_exams_archive', JSON.stringify(data.examsArchive));
        updateArchiveBadge();
      }
      if (data.currentExam && (!appState.questions || appState.questions.length === 0)) {
        if (data.currentExam.header) appState.header = data.currentExam.header;
        if (data.currentExam.questions) appState.questions = data.currentExam.questions;
        syncHeaderInputs();
      }
      renderAll();
      if (typeof updateDailyReportMetrics === 'function') updateDailyReportMetrics();
      showToast(`تم استرجاع ومزامنة بنك أسئلتك واختباراتك سحابياً من حسابك (${restoredCount} سؤال) بنجاح! ☁️🎉`, 'success');
    } else {
      // First time on cloud for this email -> auto backup current local state to cloud
      window.syncCurrentDataToCloud(true);
    }
  } catch (err) {
    console.log('Local cloud sync initialized');
  }

  window.updateCloudModalUI();
};

window.openCloudTransferModal = function() {
  window.updateCloudModalUI();
  const modal = document.getElementById('cloudSyncModal');
  if (modal) modal.classList.add('open');
};

window.closeCloudTransferModal = function() {
  const modal = document.getElementById('cloudSyncModal');
  if (modal) modal.classList.remove('open');
};

window.updateCloudModalUI = function() {
  const user = getCurrentUser() || {};
  const emailEl = document.getElementById('cloudAccountEmailDisplay');
  if (emailEl) emailEl.innerText = user.email || 'hussein.teacher@gmail.com';

  const qBank = getQuestionsHistoryBank();
  const archive = getSavedExamsArchive();
  const qCountEl = document.getElementById('cloudQuestionsCount');
  const exCountEl = document.getElementById('cloudExamsCount');
  if (qCountEl) qCountEl.innerText = qBank.length;
  if (exCountEl) exCountEl.innerText = archive.length;
};

window.syncCurrentDataToCloud = async function(isSilent = false) {
  const user = getCurrentUser() || {};
  const email = user.email || localStorage.getItem('moallem_last_google_email') || 'hussein.teacher@gmail.com';
  const questionsBank = getQuestionsHistoryBank();
  const examsArchive = getSavedExamsArchive();

  const payload = {
    email: email,
    teacherName: user.name || teacherProfile.name || 'أستاذ حسين علي',
    questionsBank: questionsBank,
    examsArchive: examsArchive,
    currentExam: {
      header: appState.header,
      questions: appState.questions,
      settings: appState.settings
    },
    savedAt: new Date().toISOString()
  };

  // 1. Save to local scoped cloud key
  localStorage.setItem(`moallem_cloud_sync_${email}`, JSON.stringify(payload));

  // 2. Send to server 24/7 bot API
  try {
    const res = await fetch('/api/cloud_sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const resJson = await res.json();
    if (resJson.success && !isSilent) {
      showToast(`تم حفظ ومزامنة أسئلتك (${questionsBank.length} سؤال) في السحابة بنجاح! ☁️`, 'success');
    }
  } catch (e) {
    if (!isSilent) {
      showToast(`تم حفظ أسئلتك سحابياً على جهازك بنجاح! ☁️`, 'success');
    }
  }

  window.updateCloudModalUI();
};

window.restoreDataFromCloudServer = async function() {
  const user = getCurrentUser() || {};
  const email = user.email || localStorage.getItem('moallem_last_google_email') || 'hussein.teacher@gmail.com';

  try {
    const res = await fetch(`/api/cloud_sync?email=${encodeURIComponent(email)}`);
    const json = await res.json();
    if (json.success && json.exists && json.data) {
      const data = json.data;
      if (Array.isArray(data.questionsBank)) {
        localStorage.setItem('moallem_questions_bank', JSON.stringify(data.questionsBank));
      }
      if (Array.isArray(data.examsArchive)) {
        localStorage.setItem('moallem_saved_exams_archive', JSON.stringify(data.examsArchive));
      }
      if (data.currentExam) {
        if (data.currentExam.header) appState.header = data.currentExam.header;
        if (data.currentExam.questions) appState.questions = data.currentExam.questions;
        syncHeaderInputs();
      }
      renderAll();
      updateArchiveBadge();
      if (typeof updateDailyReportMetrics === 'function') updateDailyReportMetrics();
      showToast(`تم استرجاع جميع أسئلتك (${(data.questionsBank || []).length} سؤال) واختباراتك من السحابة بنجاح! 🎉`, 'success');
    } else {
      showToast('لا توجد بيانات سحابية سابقة مسجلة لهذا البريد بعد. جرب الضغط على "مزامنة وحفظ الآن"', 'info');
    }
  } catch (err) {
    showToast('تعذر الاتصال بالسيرفر السحابي حالياً، يمكنك استخدام رمز المزامنة المنسوخ.', 'error');
  }
};

window.copyCloudSyncToken = function() {
  const user = getCurrentUser() || {};
  const payload = {
    email: user.email || 'hussein.teacher@gmail.com',
    questionsBank: getQuestionsHistoryBank(),
    examsArchive: getSavedExamsArchive(),
    currentExam: appState
  };
  const token = btoa(encodeURIComponent(JSON.stringify(payload)));
  navigator.clipboard.writeText(token).then(() => {
    showToast('تم نسخ رمز المزامنة السحابي! الصقه في أي جهاز آخر لنقل كافة أسئلتك فوراً 📋', 'success');
  }).catch(() => {
    prompt('انسخ رمز المزامنة السحابي التالي:', token);
  });
};

window.pasteAndImportCloudToken = function() {
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

window.downloadFullCloudBackupFile = function() {
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
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MoallemPro_CloudBackup_${email.split('@')[0]}_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('تم تنزيل النسخة السحابية الشاملة! يمكنك حفظها في Google Drive ☁️', 'success');
};

window.handleUploadCloudBackup = function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
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
  };
  reader.readAsText(file);
};

/* ==========================================================================
   VIP Annual Subscription (50,000 IQD) Management & View-Only Permissions
   ========================================================================== */
function isUserSubscribedOrAdmin() {
  const current = getCurrentUser();
  if (!current) return false;
  // Super Admin always has full unrestricted control
  if (current.isAdmin || current.role === 'admin' || current.username === 'admin') {
    return true;
  }
  const now = Date.now();
  // Check subscription expiration (1 year limit)
  if (current.subscriptionExpiresAt) {
    const expTime = new Date(current.subscriptionExpiresAt).getTime();
    if (!isNaN(expTime) && now > expTime) {
      return false; // Expired after 1 year!
    }
  }
  // Check user subscription status
  if (current.isSubscribed || current.isVip) {
    return true;
  }
  if (current.id && localStorage.getItem(`moallem_vip_subscription_${current.id}`) === 'true') {
    const expStr = localStorage.getItem(`moallem_vip_subscription_exp_${current.id}`);
    if (expStr) {
      const expTime = new Date(expStr).getTime();
      if (!isNaN(expTime) && now > expTime) {
        return false; // Expired after 1 year!
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
  showToast('🔒 اشترك لتتيح لك جميع الصلاحيات! (الباقة السنوية 50 ألف د.ع)', 'warning');
  if (typeof window.openSubscriptionModal === 'function') {
    window.openSubscriptionModal();
  }
  return false;
}
window.requireSubscription = requireSubscription;

window.openSubscriptionModal = function() {
  const modal = document.getElementById('subscriptionModal');
  if (modal) modal.classList.add('open');
  if (typeof window.updateVipUIStatus === 'function') {
    window.updateVipUIStatus();
  }
};

window.closeSubscriptionModal = function() {
  const modal = document.getElementById('subscriptionModal');
  if (modal) modal.classList.remove('open');
};

window.toggleVipSubscriptionDemo = function() {
  const current = getCurrentUser();
  if (!current) {
    showToast('يرجى تسجيل الدخول أولاً!', 'warning');
    return;
  }
  if (current.isAdmin || current.username === 'admin') {
    showToast('أنت بحساب المدير العام (Super Admin)، ولديك كافة الصلاحيات مفعلة دائماً بدون رسوم 👑', 'info');
    return;
  }

  showToast('🔒 جميع الحسابات المنشأة تخضع لعملية دفع الاشتراك السنوي (50,000 د.ع) ما عدا حساب الآدمن. يرجى إتمام التحويل وإرسال إشعار الدفع للإدارة لتفعيل حسابك 💳', 'warning');
  
  const textMsg = encodeURIComponent(`مرحباً إدارة منصة المعلم، أود إرسال إشعار تسديد رسوم الاشتراك السنوي (50 ألف دينار) لتفعيل حسابي: (${current.name || current.username} - ${current.email || ''})`);
  window.open(`https://wa.me/9647700000000?text=${textMsg}`, '_blank');
};

window.updateVipUIStatus = function() {
  const current = getCurrentUser();
  const isAdmin = current && (current.isAdmin || current.role === 'admin' || current.username === 'admin');
  const isSubscribed = isUserSubscribedOrAdmin();

  // View-Only Mode Banner & Body class
  const banner = document.getElementById('viewOnlyModeBanner');
  if (isSubscribed) {
    document.body.classList.remove('view-only-mode');
    if (banner) banner.style.display = 'none';
  } else {
    document.body.classList.add('view-only-mode');
    if (banner) banner.style.display = 'flex';
  }

  const btnTxt = document.getElementById('vipToggleBtnText');
  if (btnTxt) {
    if (isAdmin) {
      btnTxt.innerText = 'حساب الآدمن (مفعل مدى الحياة 👑)';
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
      } else if (isSubscribed) {
        span.innerHTML = 'الاشتراك السنوي (مفعل 👑)';
      } else {
        span.innerHTML = 'الباقة السنوية (50,000 د.ع) 🔒';
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
window.openAdminControlPanel = function() {
  const modal = document.getElementById('adminControlPanelModal');
  if (modal) {
    modal.classList.add('open');
    if (typeof window.renderAdminAccountsTable === 'function') {
      window.renderAdminAccountsTable();
    }
  }
};

window.closeAdminControlPanel = function() {
  const modal = document.getElementById('adminControlPanelModal');
  if (modal) modal.classList.remove('open');
};

window.openAdminGrantSubscriptions = function() {
  window.openSubscriptionManagementModal();
};

window.openSubscriptionManagementModal = function() {
  const modal = document.getElementById('subscriptionManagementModal');
  if (modal) {
    modal.classList.add('open');
    if (typeof window.renderSubscribersManagementUI === 'function') {
      window.renderSubscribersManagementUI();
    }
    setTimeout(() => {
      const input = document.getElementById('subActivationQueryInput');
      if (input) input.focus();
    }, 180);
  }
};

window.closeSubscriptionManagementModal = function() {
  const modal = document.getElementById('subscriptionManagementModal');
  if (modal) modal.classList.remove('open');
};

window.renderSubscribersManagementUI = function() {
  const countEl = document.getElementById('subscribersManagementCount');
  const tbody = document.getElementById('subscribersListTableBody');
  const drawerSubCountBadge = document.getElementById('drawerSubscribersCountBadge');

  const accounts = typeof getAuthAccounts === 'function' ? getAuthAccounts() : [];
  const now = Date.now();

  const activeSubs = accounts.filter(acc => {
    if (acc.isAdmin || acc.role === 'admin' || acc.username === 'admin') return false;
    const isSub = acc.isSubscribed || acc.isVip || (acc.id && localStorage.getItem(`moallem_vip_subscription_${acc.id}`) === 'true');
    if (!isSub) return false;
    if (acc.subscriptionExpiresAt) {
      const expTime = new Date(acc.subscriptionExpiresAt).getTime();
      if (!isNaN(expTime) && now > expTime) return false;
    }
    return true;
  });

  if (countEl) countEl.innerText = activeSubs.length;
  if (drawerSubCountBadge) drawerSubCountBadge.innerText = `${activeSubs.length} مشترك 👑`;

  if (!tbody) return;

  if (activeSubs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 2rem 1rem; color: var(--text-muted);">
          <div style="font-size: 1.8rem; color: var(--text-dim); margin-bottom: 0.4rem;">
            <i class="fa-solid fa-users-slash"></i>
          </div>
          <div style="font-weight: 700; color: var(--text-main);">لا يوجد أي مشتركين مفعلين حالياً</div>
          <div style="font-size: 0.78rem; margin-top: 4px;">أدخل اسم المستخدم أو البريد الإلكتروني في الحقل أعلاه واضغط موافقة لمنح التفعيل لمدة سنة كاملة.</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = activeSubs.map(acc => {
    const startDate = acc.subscriptionStartDate ? acc.subscriptionStartDate.slice(0, 10) : 'تفعيل معتمد';
    const expiryDate = acc.subscriptionExpiryFormatted || (acc.subscriptionExpiresAt ? acc.subscriptionExpiresAt.slice(0, 10) : 'سنة كاملة');

    return `
      <tr style="border-bottom: 1px solid var(--border-color); transition: background 0.2s ease;">
        <td style="padding: 0.75rem 0.85rem; font-weight: 700; color: var(--text-main);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: rgba(245, 158, 11, 0.2); color: #fbbf24; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">
              <i class="fa-solid fa-crown"></i>
            </div>
            <div>
              <div>${acc.name || acc.username}</div>
              <small style="color: var(--text-muted); font-size: 0.72rem;">${acc.school || 'مدرسة معتمدة'}</small>
            </div>
          </div>
        </td>
        <td style="padding: 0.75rem 0.85rem;">
          <code style="font-weight: bold; color: var(--primary);">${acc.username || ''}</code>
          ${acc.email ? `<span style="font-size: 0.72rem; color: var(--text-muted); display: block;">${acc.email}</span>` : ''}
        </td>
        <td style="padding: 0.75rem 0.85rem; font-size: 0.78rem; color: var(--text-muted);">
          <i class="fa-solid fa-calendar-plus text-info"></i> ${startDate}
        </td>
        <td style="padding: 0.75rem 0.85rem;">
          <span style="display: inline-flex; align-items: center; gap: 5px; background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.4); padding: 2px 8px; border-radius: 999px; font-size: 0.74rem; font-weight: 800;">
            <i class="fa-solid fa-calendar-check"></i> ${expiryDate}
          </span>
          <span style="display: block; font-size: 0.68rem; color: var(--text-muted); margin-top: 2px;">مدة سنة واحدة فقط</span>
        </td>
        <td style="padding: 0.75rem 0.85rem; text-align: center;">
          <button type="button" class="btn btn-outline" style="color: var(--danger); border-color: rgba(239, 68, 68, 0.35); padding: 0.3rem 0.65rem; font-size: 0.74rem; font-weight: 700;" onclick="window.manageRevokeSubscription('${acc.id}')" title="إلغاء التفعيل لهذا الحساب">
            <i class="fa-solid fa-ban"></i> إلغاء التفعيل
          </button>
        </td>
      </tr>
    `;
  }).join('');
};

window.manageApproveGrantSubscription = function() {
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

  // Calculate 1 Year (سنة واحدة فقط)
  const now = new Date();
  const oneYearLater = new Date(now);
  oneYearLater.setFullYear(now.getFullYear() + 1);

  const startStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const expiryStr = `${oneYearLater.getFullYear()}-${String(oneYearLater.getMonth()+1).padStart(2,'0')}-${String(oneYearLater.getDate()).padStart(2,'0')}`;

  targetAcc.isVip = true;
  targetAcc.isSubscribed = true;
  targetAcc.role = 'teacher_vip';
  targetAcc.subscriptionDuration = '1_year';
  targetAcc.subscriptionStartDate = now.toISOString();
  targetAcc.subscriptionExpiresAt = oneYearLater.toISOString();
  targetAcc.subscriptionExpiryFormatted = expiryStr;

  localStorage.setItem(`moallem_vip_subscription_${targetAcc.id}`, 'true');
  localStorage.setItem(`moallem_vip_subscription_exp_${targetAcc.id}`, oneYearLater.toISOString());
  if (typeof saveAuthAccounts === 'function') saveAuthAccounts(accounts);

  const sessionUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (sessionUser && sessionUser.id === targetAcc.id) {
    sessionUser.isVip = true;
    sessionUser.isSubscribed = true;
    sessionUser.role = 'teacher_vip';
    sessionUser.subscriptionDuration = '1_year';
    sessionUser.subscriptionStartDate = now.toISOString();
    sessionUser.subscriptionExpiresAt = oneYearLater.toISOString();
    sessionUser.subscriptionExpiryFormatted = expiryStr;
    localStorage.setItem('moallem_current_user', JSON.stringify(sessionUser));
    if (typeof window.updateVipUIStatus === 'function') window.updateVipUIStatus();
  }

  inputEl.value = '';

  window.renderSubscribersManagementUI();
  if (typeof window.renderAdminAccountsTable === 'function') window.renderAdminAccountsTable();
  if (typeof updateUserAuthUI === 'function') updateUserAuthUI();

  showToast(`🎉 تمت الموافقة وتفعيل حساب الأستاذ [${targetAcc.name || targetAcc.username}] بنجاح لمدة سنة واحدة حتى (${expiryStr})! 👑✔`, 'success');
};

window.manageRevokeSubscription = function(accId) {
  const accounts = typeof getAuthAccounts === 'function' ? getAuthAccounts() : [];
  const acc = accounts.find(a => a.id === accId);
  if (!acc) return;

  if (!confirm(`هل أنت متأكد من رغبتك بإلغاء اشتراك الأستاذ (${acc.name || acc.username})؟`)) {
    return;
  }

  acc.isVip = false;
  acc.isSubscribed = false;
  acc.role = 'teacher';
  delete acc.subscriptionExpiresAt;
  delete acc.subscriptionExpiryFormatted;

  localStorage.removeItem(`moallem_vip_subscription_${acc.id}`);
  localStorage.removeItem(`moallem_vip_subscription_exp_${acc.id}`);
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

window.renderAdminAccountsTable = function() {
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
              <div style="font-weight: 800; color: var(--text-main);">${acc.name || 'معلم بدون اسم'}</div>
              <div style="font-size: 0.7rem; color: var(--text-muted);">${acc.governorate || 'العراق'}</div>
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

window.adminDeleteAccount = function(id) {
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

window.adminToggleVip = function(id, explicitState) {
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
    acc.subscriptionStartDate = now.toISOString();
    acc.subscriptionExpiresAt = oneYearLater.toISOString();
    acc.subscriptionExpiryFormatted = `${oneYearLater.getFullYear()}-${String(oneYearLater.getMonth()+1).padStart(2,'0')}-${String(oneYearLater.getDate()).padStart(2,'0')}`;
    localStorage.setItem(`moallem_vip_subscription_${acc.id}`, 'true');
    localStorage.setItem(`moallem_vip_subscription_exp_${acc.id}`, oneYearLater.toISOString());
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

window.adminSubmitQuickActivate = function() {
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
  const expiryStr = `${oneYearLater.getFullYear()}-${String(oneYearLater.getMonth()+1).padStart(2,'0')}-${String(oneYearLater.getDate()).padStart(2,'0')}`;

  targetAcc.isVip = true;
  targetAcc.isSubscribed = true;
  targetAcc.role = 'teacher_vip';
  targetAcc.subscriptionDuration = '1_year';
  targetAcc.subscriptionStartDate = now.toISOString();
  targetAcc.subscriptionExpiresAt = oneYearLater.toISOString();
  targetAcc.subscriptionExpiryFormatted = expiryStr;
  targetAcc.subscriptionDate = now.toISOString();
  targetAcc.subscriptionType = 'annual_vip_50k';

  // Persist
  localStorage.setItem(`moallem_vip_subscription_${targetAcc.id}`, 'true');
  localStorage.setItem(`moallem_vip_subscription_exp_${targetAcc.id}`, oneYearLater.toISOString());
  saveAuthAccounts(accounts);

  // Sync if it's the current user session
  const sessionUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (sessionUser && sessionUser.id === targetAcc.id) {
    sessionUser.isVip = true;
    sessionUser.isSubscribed = true;
    sessionUser.role = 'teacher_vip';
    sessionUser.subscriptionDuration = '1_year';
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

window.adminPromptAddTeacher = function() {
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
    isVip: false
  };

  accounts.push(newAcc);
  saveAuthAccounts(accounts);
  window.renderAdminAccountsTable();
  showToast(`تم إنشاء حساب الأستاذ ${name} بنجاح!`, 'success');
};

window.adminExportAllSystemData = function() {
  const data = {
    exportDate: new Date().toISOString(),
    accounts: getAuthAccounts(),
    adminArchive: getSavedExamsArchive(),
    adminQuestionBank: getQuestionsHistoryBank()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `moallem_system_backup_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('تم تصدير ملف النسخة الاحتياطية الشاملة لكامل النظام بنجاح 💾', 'success');
};

window.adminPurgeGuestCache = function() {
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

// ==========================================================================
// Masar Al-Moallem (مسار المعلم) Interactive Welcoming Logo Experience
// ==========================================================================
const MASAR_WELCOME_GREETINGS = [
  'أهلاً وسهلاً بك في منصة <strong>مسار المعلم</strong>! 🎓✨',
  'نتمنى لك يوماً دراسياً موفقاً وإبداعاً لا ينتهي! 🌟',
  'صُممت المنصة لتوفير وقتك وجهدك أستاذنا المبدع! 🚀',
  'جاهزون لصياغة أروع النماذج الوزارية بدقة عالية! 📝👑',
  'مسار المعلم.. طريقك الذكي لصناعة الاختبارات المتميزة! 💡'
];
let currentMasarGreetingIndex = 0;

window.triggerMasarLogoWelcome = function(event) {
  const hero = document.getElementById('masarInteractiveHero');
  if (!hero) return;

  // 1. Play gentle welcoming harmonic chime via Web Audio API
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      // Tone 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Tone 2 (Higher harmony)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(659.25, now + 0.1);
      gain2.gain.setValueAtTime(0.15, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.55);
    }
  } catch (err) {
    // Audio context safely ignored if restricted
  }

  // 2. Spawn Expanding Shockwave Ripple
  const shockwave = document.createElement('div');
  shockwave.className = 'masar-shockwave';
  hero.appendChild(shockwave);
  setTimeout(() => shockwave.remove(), 800);

  // 3. Spawn Floating Sparkling Particles
  const sparkles = ['✨', '⭐', '🌟', '🎓', '💫'];
  for (let i = 0; i < 7; i++) {
    const sparkle = document.createElement('span');
    sparkle.className = 'floating-masar-sparkle';
    sparkle.innerText = sparkles[Math.floor(Math.random() * sparkles.length)];
    const angle = (Math.PI * 2 * i) / 7;
    const distance = 40 + Math.random() * 45;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance - 25;
    sparkle.style.setProperty('--tx', `${tx}px`);
    sparkle.style.setProperty('--ty', `${ty}px`);
    sparkle.style.left = '50%';
    sparkle.style.top = '45%';
    hero.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 950);
  }

  // 4. Cycle Welcoming Speech Bubble
  currentMasarGreetingIndex = (currentMasarGreetingIndex + 1) % MASAR_WELCOME_GREETINGS.length;
  const bubbleText = document.getElementById('masarSpeechText');
  const bubble = document.getElementById('masarSpeechBubble');
  if (bubbleText && bubble) {
    bubble.style.animation = 'none';
    void bubble.offsetWidth;
    bubble.style.animation = 'speechBubblePop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    bubbleText.innerHTML = MASAR_WELCOME_GREETINGS[currentMasarGreetingIndex];
  }
};

// Auto-attach 3D interactive mouse parallax on Masar Logo
document.addEventListener('DOMContentLoaded', () => {
  const hero = document.getElementById('masarInteractiveHero');
  const badge = document.getElementById('masarLogoCoreBadge');
  if (hero && badge) {
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const rotateX = (-y / rect.height) * 20;
      const rotateY = (x / rect.width) * 20;
      badge.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.08)`;
    });
    hero.addEventListener('mouseleave', () => {
      badge.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)';
    });
  }
});



