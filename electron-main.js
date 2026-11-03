// ==========================================================================
// منصة المعلم — مشغل سطح المكتب لنظام التشغيل ويندوز (Windows Desktop Host)
// ==========================================================================

const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');

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
        spellcheck: false
      }
    });

    // تحميل الواجهة الرئيسية للمنصة
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // إظهار النافذة بسلاسة فور جاهزيتها
    mainWindow.once('ready-to-show', () => {
      mainWindow.maximize();
      mainWindow.show();
    });

    // إدارة نوافذ المعاينة والطباعة (print.html)
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      // إذا كان الرابط خارجياً (مثل رابط يوتيوب أو تيليجرام)، افتحه في متصفح النظام الافتراضي
      if (url.startsWith('http://') || url.startsWith('https://')) {
        // إذا كان رابط خارجي افتحه في المتصفح الخارجي
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

