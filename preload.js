// ==========================================================================
// منصة المعلم — Preload Script
// جسر التواصل الآمن لنظام التحديث التلقائي الصامت مع GitHub Releases
// ==========================================================================

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronUpdater', {
  onUpdateMessage: (callback) => {
    ipcRenderer.on('updater-message', (_event, data) => callback(data));
  },
  checkForUpdates: () => {
    ipcRenderer.send('check-for-updates');
  },
  restartAndInstall: () => {
    ipcRenderer.send('restart-and-install-update');
  }
});

