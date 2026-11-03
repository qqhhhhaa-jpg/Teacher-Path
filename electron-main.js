// ==========================================================================
// منصة المعلم — مشغل سطح المكتب لنظام التشغيل ويندوز (Windows Desktop Host)
// مع نظام التحديث التلقائي الصامت المتصل بـ GitHub Releases (Auto-Updater)
// ==========================================================================

const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// منع تكرار فتح عدة نوافذ لنفس التطبيق (Single Instance Lock)
const gotTheLock = app.requestSingleInstanceLock();
let mainWindow = null;

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 1366,
      height: 768,
      minWidth: 1024,
      minHeight: 640,
      center: true,
      title: 'منصة المعلم',
      autoHideMenuBar: true,
      backgroundColor: '#f8fafc',
      show: false, // لا تظهر النافذة إلا بعد اكتمال التحميل لمنع الوميض الأبيض
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
        spellcheck: false,
        preload: path.join(__dirname, 'preload.js')
      }
    });

    // تحميل الواجهة الرئيسية للمنصة
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // إظهار النافذة بسلاسة فور جاهزيتها
    mainWindow.once('ready-to-show', () => {
      mainWindow.maximize();
      mainWindow.show();

      // فحص التحديثات التلقائية في الخلفية بهدوء
      setTimeout(() => {
        setupAutoUpdater();
      }, 4000);
    });

    // إدارة نوافذ المعاينة والطباعة (print.html)
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      // إذا كان الرابط خارجياً (مثل رابط يوتيوب أو تيليجرام)، افتحه في متصفح النظام الافتراضي
      if (url.startsWith('http://') || url.startsWith('https://')) {
        if (!url.includes('localhost') && !url.includes('127.0.0.1')) {
          shell.openExternal(url);
          return { action: 'deny' };
        }
      }

      // إذا كانت نافذة طباعة داخلية أو رابط محلي
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 1100,
          height: 820,
          autoHideMenuBar: true,
          title: 'معاينة الطباعة — منصة المعلم',
          center: true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
          }
        }
      };
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }

  // ==========================================================================
  // إعدادات التحديث التلقائي الصامت عبر GitHub Releases
  // ==========================================================================
  function setupAutoUpdater() {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('update-available', (info) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('updater-message', {
          status: 'available',
          version: info.version,
          message: `يتوفر إصدار جديد (${info.version})، جاري التنزيل في الخلفية تلقائياً...`
        });
      }
    });

    autoUpdater.on('download-progress', (progressObj) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('updater-message', {
          status: 'downloading',
          percent: Math.round(progressObj.percent)
        });
      }
    });

    autoUpdater.on('update-downloaded', (info) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('updater-message', {
          status: 'downloaded',
          version: info.version,
          message: `تم تنزيل الإصدار الجديد (${info.version}) بنجاح! جاهز للتطبيق الفوري.`
        });
      }
    });

    autoUpdater.on('error', (err) => {
      // تجاهل أخطاء عدم الاتصال بهدوء لضمان تجربة مستخدم سلسة
      console.log('[AutoUpdater] Notice:', err ? err.message : err);
    });

    // افحص إذا كان التطبيق مجمّعاً وليس في بيئة التطوير
    if (app.isPackaged) {
      autoUpdater.checkForUpdates().catch(() => {});
    }
  }

  ipcMain.on('check-for-updates', () => {
    if (app.isPackaged) {
      autoUpdater.checkForUpdates().catch(() => {});
    }
  });

  ipcMain.on('restart-and-install-update', () => {
    autoUpdater.quitAndInstall();
  });

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
