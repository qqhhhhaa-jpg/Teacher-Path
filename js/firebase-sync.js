/**
 * مسار المعلم | محرك المصادقة الرسمية والمزامنة السحابية عبر Google Firebase
 * Google Firebase Authentication & Cloud Firestore Multi-Device Sync Engine
 * يتيح تسجيل الدخول بحساب Google الشخصي ومزامنة الأسئلة والاختبارات والحساب بين الحاسبة والهاتف من أي مكان في العالم.
 */

(function () {
  'use strict';

  // Default / Cached Firebase Config
  const STORAGE_KEY_CONFIG = 'moallem_firebase_config';
  const STORAGE_KEY_LAST_SYNC = 'moallem_firebase_last_sync';

  let firebaseApp = null;
  let firebaseAuth = null;
  let firebaseDb = null;
  let isInitializing = false;
  let isSyncingToCloud = false;

  // Retrieve saved Firebase configuration
  function getSavedFirebaseConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Error reading saved firebase config:', e);
    }
    // Check if injected in window
    if (window.FIREBASE_CONFIG && typeof window.FIREBASE_CONFIG === 'object') {
      return window.FIREBASE_CONFIG;
    }
    return null;
  }

  // Initialize Firebase App & Services
  function initFirebase() {
    if (firebaseApp && firebaseAuth && firebaseDb) {
      return true;
    }
    if (typeof firebase === 'undefined') {
      console.warn('Firebase SDK not loaded yet.');
      return false;
    }

    const config = getSavedFirebaseConfig();
    if (!config || !config.apiKey || !config.projectId) {
      updateFirebaseStatusUI(false, 'بانتظار إدخال إعدادات المشروع (Firebase Config)');
      return false;
    }

    try {
      if (!firebase.apps || firebase.apps.length === 0) {
        firebaseApp = firebase.initializeApp(config);
      } else {
        firebaseApp = firebase.app();
      }
      firebaseAuth = firebase.auth();
      firebaseDb = firebase.firestore();

      // Enable Firestore offline persistence if possible
      try {
        firebaseDb.enablePersistence({ synchronizeTabs: true }).catch(() => {});
      } catch (err) {}

      // Listen to Auth State Changes
      firebaseAuth.onAuthStateChanged(handleAuthStateChange);

      updateFirebaseStatusUI(true, 'متصل بسحابة Google Firebase بنجاح 🟢');
      return true;
    } catch (err) {
      console.error('Firebase initialization error:', err);
      updateFirebaseStatusUI(false, 'خطأ في التهيئة: ' + err.message);
      return false;
    }
  }

  // Update Status in UI
  function updateFirebaseStatusUI(isConnected, statusText) {
    const badge = document.getElementById('firebaseStatusBadge');
    if (badge) {
      badge.innerText = isConnected ? 'متصل 🟢' : 'غير متصل ⚪';
      badge.style.background = isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
      badge.style.color = isConnected ? '#10b981' : '#ef4444';
      badge.style.borderColor = isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)';
    }

    const textEl = document.getElementById('firebaseStatusDesc');
    if (textEl) {
      textEl.innerText = statusText || (isConnected ? 'سحابة Google متصلة' : 'غير متصل');
    }

    const navGoogleBtn = document.getElementById('navGoogleSyncStatusBtn');
    if (navGoogleBtn) {
      if (isConnected) {
        navGoogleBtn.style.display = 'inline-flex';
        navGoogleBtn.title = 'حساب Google متصل والمزامنة السحابية فعالة 🟢';
      }
    }
  }

  // Handle Firebase Auth State
  async function handleAuthStateChange(fbUser) {
    if (fbUser) {
      // User is logged in to Firebase
      const email = fbUser.email || '';
      const uid = fbUser.uid;
      const displayName = fbUser.displayName || email.split('@')[0];
      const photoURL = fbUser.photoURL || '';

      // Check Firestore doc for profile & permissions
      let remoteData = null;
      try {
        if (firebaseDb) {
          const docRef = firebaseDb.collection('users').doc(uid);
          const docSnap = await docRef.get();
          if (docSnap.exists) {
            remoteData = docSnap.data();
          }
        }
      } catch (e) {
        console.warn('Firestore fetch error:', e);
      }

      // Build local account object
      const nowIso = new Date().toISOString();
      const account = {
        id: 'usr_fb_' + uid,
        firebaseUid: uid,
        name: (remoteData && remoteData.name) || displayName,
        email: email,
        username: (remoteData && remoteData.username) || email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase(),
        avatar: photoURL || (remoteData && remoteData.avatar) || '',
        subject: (remoteData && remoteData.subject) || 'عام',
        school: (remoteData && remoteData.school) || '',
        governorate: (remoteData && remoteData.governorate) || '',
        rights: (remoteData && remoteData.rights) || `إعداد وتنظيم ${displayName} - جميع الحقوق محفوظة`,
        contact: (remoteData && remoteData.contact) || '',
        role: (remoteData && remoteData.role) || 'viewer',
        isAdmin: (remoteData && remoteData.isAdmin) || false,
        isVip: (remoteData && remoteData.isVip) || true, // Active cloud subscriber
        isSubscribed: (remoteData && remoteData.isSubscribed) || true,
        isGoogleUser: true,
        lastLoginAt: nowIso
      };

      // Add to accounts list in localStorage
      if (typeof window.getAuthAccounts === 'function') {
        const accounts = window.getAuthAccounts();
        const existingIdx = accounts.findIndex(a => a.firebaseUid === uid || (a.email && a.email.toLowerCase() === email.toLowerCase()));
        if (existingIdx >= 0) {
          accounts[existingIdx] = { ...accounts[existingIdx], ...account };
        } else {
          accounts.push(account);
        }
        if (typeof window.saveAuthAccounts === 'function') {
          window.saveAuthAccounts(accounts);
        }
      }

      // If user wasn't marked as logged in or different user
      const currentUser = (typeof window.getCurrentUser === 'function') ? window.getCurrentUser() : null;
      if (!currentUser || currentUser.firebaseUid !== uid) {
        if (typeof window.setCurrentUser === 'function') {
          window.setCurrentUser(account);
        }
        localStorage.setItem('moallem_logged_in', 'true');
        sessionStorage.setItem('moallem_session_active', 'true');

        // Close portal & unlock workstation
        const portal = document.getElementById('fullscreenAuthPortal');
        const workstation = document.getElementById('appWorkstation');
        if (portal) portal.classList.add('portal-hidden');
        if (workstation) workstation.classList.remove('portal-locked');

        if (typeof window.updateUserAuthUI === 'function') window.updateUserAuthUI();
        if (typeof window.syncHeaderInputs === 'function') window.syncHeaderInputs();
        if (typeof window.applyProfileToExamHeader === 'function') window.applyProfileToExamHeader();

        // Restore Exams & Question Bank from Cloud
        await restoreFromFirestore(uid);
      }
    }
  }

  // Interactive 1-Click Sign-in with Google Firebase
  window.loginWithGoogleFirebase = async function () {
    const isReady = initFirebase();
    if (!isReady) {
      window.openFirebaseConfigModal();
      if (typeof window.showToast === 'function') {
        window.showToast('يرجى ربط إعدادات Google Firebase للمتابعة وحفظ بياناتك سحابياً ☁️', 'info');
      }
      return;
    }

    try {
      if (typeof window.showToast === 'function') {
        window.showToast('جارٍ الاتصال بحساب Google الرسمي... ⏳', 'info');
      }
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({ prompt: 'select_account' });

      // Determine device: desktop popup, or fallback redirect for strict mobile popups
      let result = null;
      try {
        result = await firebaseAuth.signInWithPopup(provider);
      } catch (popupErr) {
        if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/popup-closed-by-user') {
          // Fallback to redirect
          await firebaseAuth.signInWithRedirect(provider);
          return;
        }
        throw popupErr;
      }

      if (result && result.user) {
        const u = result.user;
        const displayName = u.displayName || u.email;

        // Ensure user document exists in Firestore
        const userRef = firebaseDb.collection('users').doc(u.uid);
        const userSnap = await userRef.get();
        if (!userSnap.exists) {
          await userRef.set({
            uid: u.uid,
            name: u.displayName || '',
            email: u.email || '',
            avatar: u.photoURL || '',
            subject: 'عام',
            school: '',
            governorate: '',
            rights: `إعداد وتنظيم ${displayName} - جميع الحقوق محفوظة`,
            contact: '',
            isGoogleUser: true,
            isVip: true,
            isSubscribed: true,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString()
          }, { merge: true });
        } else {
          await userRef.set({
            lastLoginAt: new Date().toISOString()
          }, { merge: true });
        }

        // Restore cloud data
        await restoreFromFirestore(u.uid);

        if (typeof window.showToast === 'function') {
          window.showToast(`أهلاً بك أستاذ ${displayName}! تم تسجيل الدخول بنجاح عبر حساب Google الرسمي 🎓✨`, 'success');
        }

        // Close any open auth modals
        if (typeof window.closeGoogleAccountModal === 'function') window.closeGoogleAccountModal();
        const gModal = document.getElementById('googleAuthModal');
        if (gModal) gModal.classList.remove('open');
      }
    } catch (err) {
      console.error('Google Firebase sign-in error:', err);
      if (typeof window.showToast === 'function') {
        window.showToast('تعذر تسجيل الدخول عبر Google: ' + (err.message || 'خطأ غير معروف'), 'error');
      }
    }
  };

  // Sync Data to Firestore Cloud
  window.syncToFirestoreCloud = async function (isSilent = false) {
    if (!firebaseDb || !firebaseAuth || !firebaseAuth.currentUser) {
      return false;
    }
    if (isSyncingToCloud) return;
    isSyncingToCloud = true;

    try {
      const uid = firebaseAuth.currentUser.uid;
      const userDocRef = firebaseDb.collection('users').doc(uid);

      // Collect data
      let questionsBank = [];
      try {
        const rawBank = localStorage.getItem('moallem_questions_history_bank') || localStorage.getItem('moallem_questions_bank');
        if (rawBank) questionsBank = JSON.parse(rawBank);
      } catch (e) {}

      let examsArchive = [];
      if (typeof window.getSavedExamsArchive === 'function') {
        examsArchive = window.getSavedExamsArchive();
      } else {
        try {
          const rawArch = localStorage.getItem('moallem_saved_exams_archive');
          if (rawArch) examsArchive = JSON.parse(rawArch);
        } catch (e) {}
      }

      let teacherProfile = {};
      const user = (typeof window.getCurrentUser === 'function') ? window.getCurrentUser() : null;
      if (user) {
        teacherProfile = {
          name: user.name || '',
          email: user.email || '',
          avatar: user.avatar || '',
          subject: user.subject || '',
          school: user.school || '',
          governorate: user.governorate || '',
          rights: user.rights || '',
          contact: user.contact || ''
        };
      }

      const syncPayload = {
        teacherProfile: teacherProfile,
        questionsBank: questionsBank,
        examsArchive: examsArchive,
        currentExam: {
          header: (window.appState && window.appState.header) || {},
          questions: (window.appState && window.appState.questions) || [],
          settings: (window.appState && window.appState.settings) || {}
        },
        lastSyncedAt: new Date().toISOString(),
        device: navigator.userAgent || 'Web Client'
      };

      // Save to Firestore subcollection or doc
      await userDocRef.collection('cloud_data').doc('workspace').set(syncPayload);
      await userDocRef.set({
        ...teacherProfile,
        questionsCount: questionsBank.length,
        examsCount: examsArchive.length,
        lastSyncedAt: syncPayload.lastSyncedAt
      }, { merge: true });

      localStorage.setItem(STORAGE_KEY_LAST_SYNC, syncPayload.lastSyncedAt);

      if (!isSilent && typeof window.showToast === 'function') {
        window.showToast('تمت مزامنة كافة أسئلتك واختباراتك مع سحابة Google Firebase بنجاح! ☁️✨', 'success');
      }
      return true;
    } catch (err) {
      console.error('Error syncing to Firestore:', err);
      if (!isSilent && typeof window.showToast === 'function') {
        window.showToast('حدث خطأ أثناء المزامنة السحابية: ' + err.message, 'warning');
      }
      return false;
    } finally {
      isSyncingToCloud = false;
    }
  };

  // Restore Data from Firestore Cloud
  async function restoreFromFirestore(uid) {
    if (!firebaseDb || !uid) return false;

    try {
      const docRef = firebaseDb.collection('users').doc(uid).collection('cloud_data').doc('workspace');
      const snap = await docRef.get();

      if (snap.exists) {
        const data = snap.data();
        let restoredExams = 0;
        let restoredQuestions = 0;

        // 1. Restore Questions Bank
        if (Array.isArray(data.questionsBank) && data.questionsBank.length > 0) {
          localStorage.setItem('moallem_questions_history_bank', JSON.stringify(data.questionsBank));
          localStorage.setItem('moallem_questions_bank', JSON.stringify(data.questionsBank));
          restoredQuestions = data.questionsBank.length;
        }

        // 2. Restore Exams Archive
        if (Array.isArray(data.examsArchive) && data.examsArchive.length > 0) {
          localStorage.setItem('moallem_saved_exams_archive', JSON.stringify(data.examsArchive));
          if (typeof window.updateArchiveBadge === 'function') window.updateArchiveBadge();
          if (typeof window.renderArchiveList === 'function') window.renderArchiveList();
          restoredExams = data.examsArchive.length;
        }

        // 3. Restore Current Workspace if empty
        if (data.currentExam && window.appState) {
          if (!window.appState.questions || window.appState.questions.length === 0) {
            if (Array.isArray(data.currentExam.questions) && data.currentExam.questions.length > 0) {
              window.appState.questions = data.currentExam.questions;
              if (data.currentExam.header) {
                window.appState.header = { ...window.appState.header, ...data.currentExam.header };
              }
              if (typeof window.renderAll === 'function') window.renderAll();
            }
          }
        }

        // 4. Update Profile
        if (data.teacherProfile && window.teacherProfile) {
          Object.assign(window.teacherProfile, data.teacherProfile);
          if (typeof window.saveTeacherProfile === 'function') window.saveTeacherProfile();
          if (typeof window.syncHeaderInputs === 'function') window.syncHeaderInputs();
          if (typeof window.applyProfileToExamHeader === 'function') window.applyProfileToExamHeader();
        }

        if (typeof window.showToast === 'function' && (restoredExams > 0 || restoredQuestions > 0)) {
          window.showToast(`تم استيراد ${restoredExams} اختبار و ${restoredQuestions} سؤال من سحابة Google بنجاح! ☁️📂`, 'info');
        }
        return true;
      }
    } catch (err) {
      console.warn('Could not restore from Firestore:', err);
    }
    return false;
  }
  window.restoreFromFirestore = restoreFromFirestore;

  // Sign out from Google Firebase
  window.logoutGoogleFirebase = async function () {
    try {
      if (firebaseAuth) {
        await firebaseAuth.signOut();
      }
    } catch (e) {
      console.warn('Firebase signout error:', e);
    }
    if (typeof window.logoutAndOpenAuthPortal === 'function') {
      window.logoutAndOpenAuthPortal('تم تسجيل الخروج وقفل المنصة لحماية خصوصيتك 🔒');
    }
  };

  // Firebase Config Modal Controls
  window.openFirebaseConfigModal = function () {
    const modal = document.getElementById('firebaseConfigModal');
    if (!modal) return;
    modal.classList.add('open');

    const config = getSavedFirebaseConfig() || {};
    const inputApiKey = document.getElementById('fbCfgApiKey');
    const inputAuthDomain = document.getElementById('fbCfgAuthDomain');
    const inputProjectId = document.getElementById('fbCfgProjectId');
    const inputStorageBucket = document.getElementById('fbCfgStorageBucket');
    const inputMessagingSenderId = document.getElementById('fbCfgMessagingSenderId');
    const inputAppId = document.getElementById('fbCfgAppId');

    if (inputApiKey) inputApiKey.value = config.apiKey || '';
    if (inputAuthDomain) inputAuthDomain.value = config.authDomain || '';
    if (inputProjectId) inputProjectId.value = config.projectId || '';
    if (inputStorageBucket) inputStorageBucket.value = config.storageBucket || '';
    if (inputMessagingSenderId) inputMessagingSenderId.value = config.messagingSenderId || '';
    if (inputAppId) inputAppId.value = config.appId || '';

    updateFirebaseStatusUI(!!firebaseApp, firebaseApp ? 'متصل 🟢' : 'غير متصل ⚪');
  };

  window.closeFirebaseConfigModal = function () {
    const modal = document.getElementById('firebaseConfigModal');
    if (modal) modal.classList.remove('open');
  };

  // Save Config from inputs
  window.saveFirebaseConfigFromInputs = function () {
    const apiKey = (document.getElementById('fbCfgApiKey')?.value || '').trim();
    const authDomain = (document.getElementById('fbCfgAuthDomain')?.value || '').trim();
    const projectId = (document.getElementById('fbCfgProjectId')?.value || '').trim();
    const storageBucket = (document.getElementById('fbCfgStorageBucket')?.value || '').trim();
    const messagingSenderId = (document.getElementById('fbCfgMessagingSenderId')?.value || '').trim();
    const appId = (document.getElementById('fbCfgAppId')?.value || '').trim();

    if (!apiKey || !projectId) {
      if (typeof window.showToast === 'function') {
        window.showToast('يرجى إدخال apiKey و projectId على الأقل!', 'warning');
      }
      return;
    }

    const config = {
      apiKey: apiKey,
      authDomain: authDomain || `${projectId}.firebaseapp.com`,
      projectId: projectId,
      storageBucket: storageBucket || `${projectId}.appspot.com`,
      messagingSenderId: messagingSenderId,
      appId: appId
    };

    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    if (typeof window.showToast === 'function') {
      window.showToast('تم حفظ إعدادات Google Firebase بنجاح! جاري الاتصال...', 'success');
    }

    // Reset current app instance if exists
    if (firebaseApp) {
      try {
        firebaseApp.delete().catch(() => {});
      } catch (e) {}
      firebaseApp = null;
      firebaseAuth = null;
      firebaseDb = null;
    }

    initFirebase();
    window.closeFirebaseConfigModal();
  };

  // Paste raw JS / JSON snippet directly
  window.importFirebaseConfigSnippet = function () {
    const raw = prompt('الصق كود إعدادات Firebase (firebaseConfig) هنا مباشرة:');
    if (!raw) return;

    try {
      let configObj = null;
      // Try JSON parse
      try {
        configObj = JSON.parse(raw);
      } catch (e) {
        // Try extracting keys via Regex
        const extract = (key) => {
          const m = raw.match(new RegExp(`${key}\\s*:\\s*["']([^"']+)["']`, 'i'));
          return m ? m[1] : '';
        };
        configObj = {
          apiKey: extract('apiKey'),
          authDomain: extract('authDomain'),
          projectId: extract('projectId'),
          storageBucket: extract('storageBucket'),
          messagingSenderId: extract('messagingSenderId'),
          appId: extract('appId')
        };
      }

      if (configObj && configObj.apiKey && configObj.projectId) {
        localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(configObj));
        if (typeof window.showToast === 'function') {
          window.showToast('تم استيراد إعدادات Firebase بنجاح! ✔️', 'success');
        }
        initFirebase();
        window.closeFirebaseConfigModal();
      } else {
        alert('تعذر استخراج الإعدادات. يرجى التأكد من احتواء الكود على apiKey و projectId.');
      }
    } catch (err) {
      alert('خطأ أثناء قراءة الكود: ' + err.message);
    }
  };

  // Auto initialize on DOM Content Loaded
  document.addEventListener('DOMContentLoaded', () => {
    // Attempt init with slight delay to ensure scripts are fully parsed
    setTimeout(() => {
      initFirebase();
    }, 600);
  });

  // Expose global helpers
  window.initFirebase = initFirebase;
  window.getSavedFirebaseConfig = getSavedFirebaseConfig;

})();
