// ==========================================================================
// منصة المعلم — نظام إشعارات وتطبيق التحديث التلقائي الصامت (Desktop Auto-Updater UI)
// ==========================================================================

(function () {
  'use strict';

  if (!window.electronUpdater) {
    // التطبيق يعمل في المتصفح العادي أو بيئة ويب، لا داعي لتفعيل التحديث التلقائي
    return;
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.electronUpdater.onUpdateMessage((data) => {
      if (!data) return;

      if (data.status === 'available') {
        console.log('[AutoUpdater] Update available:', data.version);
      } else if (data.status === 'downloading') {
        console.log('[AutoUpdater] Downloading:', data.percent + '%');
      } else if (data.status === 'downloaded') {
        showUpdateToast(data.version);
      }
    });
  });

  function showUpdateToast(version) {
    // منع تكرار الإشعار
    if (document.getElementById('desktopAutoUpdateToast')) return;

    const toast = document.createElement('div');
    toast.id = 'desktopAutoUpdateToast';
    toast.setAttribute('role', 'alert');
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 24px;
      z-index: 999999;
      background: linear-gradient(135deg, rgba(30, 27, 75, 0.98), rgba(15, 23, 42, 0.98));
      border: 1.5px solid rgba(139, 92, 246, 0.6);
      border-radius: 16px;
      padding: 16px 20px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(124, 58, 237, 0.25);
      color: #ffffff;
      font-family: 'Alexandria', 'Cairo', sans-serif;
      display: flex;
      align-items: center;
      gap: 16px;
      max-width: 440px;
      direction: rtl;
      animation: slideUpToast 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    toast.innerHTML = `
      <div style="width: 42px; height: 42px; border-radius: 12px; background: linear-gradient(135deg, #8b5cf6, #3b82f6); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);">
        <i class="fa-solid fa-cloud-arrow-down" style="color: #fff;"></i>
      </div>
      <div style="flex: 1;">
        <div style="font-weight: 900; font-size: 0.92rem; margin-bottom: 3px; color: #f8fafc;">
          تحديث جديد جاهز للتثبيت! (${version || 'v' + (window.PLATFORM_VERSION || '4.0.1')})
        </div>
        <div style="font-size: 0.76rem; color: #cbd5e1; line-height: 1.35;">
          تم تنزيل أحدث ملفات ومميزات المنصة تلقائياً. اضغط للتحديث فوراً.
        </div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <button id="btnApplyUpdateNow" type="button" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; border-radius: 9px; padding: 7px 14px; font-size: 0.78rem; font-weight: 800; cursor: pointer; white-space: nowrap; transition: transform 0.2s; font-family: inherit;">
          تحديث الآن 🚀
        </button>
        <button id="btnDismissUpdateToast" type="button" style="background: transparent; color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.3); border-radius: 8px; padding: 4px 8px; font-size: 0.7rem; font-weight: 700; cursor: pointer; white-space: nowrap; font-family: inherit;">
          تحديث لاحقاً
        </button>
      </div>
    `;

    // Add animation style if not already added
    if (!document.getElementById('toastSlideAnimStyle')) {
      const style = document.createElement('style');
      style.id = 'toastSlideAnimStyle';
      style.textContent = `
        @keyframes slideUpToast {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    document.getElementById('btnApplyUpdateNow').addEventListener('click', () => {
      if (window.electronUpdater && window.electronUpdater.restartAndInstall) {
        window.electronUpdater.restartAndInstall();
      }
    });

    document.getElementById('btnDismissUpdateToast').addEventListener('click', () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    });
  }
})();

