const { chromium } = require('playwright');
const path = require('path');

const resolutions = [
  { name: 'laptop_browser_1366x668', width: 1366, height: 668 },
  { name: 'laptop_browser_1536x750', width: 1536, height: 750 },
  { name: 'laptop_browser_1440x780', width: 1440, height: 780 },
  { name: 'desktop_browser_1920x960', width: 1920, height: 960 }
];

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const fileUrl = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');

  for (const res of resolutions) {
    const context = await browser.newContext({
      viewport: { width: res.width, height: res.height }
    });
    const page = await context.newPage();
    await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);

    // Simulate Admin login view (like user's screenshot)
    await page.evaluate(() => {
      const portal = document.getElementById('fullscreenAuthPortal');
      if (portal) {
        portal.classList.add('portal-hidden');
        portal.style.setProperty('display', 'none', 'important');
      }
      const ws = document.getElementById('appWorkstation');
      if (ws) {
        ws.classList.remove('portal-locked');
        ws.style.setProperty('display', 'block', 'important');
        ws.style.setProperty('visibility', 'visible', 'important');
        ws.style.setProperty('opacity', '1', 'important');
      }
      // Hide trial guest strip so it matches Admin view
      const trialBanner = document.getElementById('trialReadOnlyBanner');
      if (trialBanner) trialBanner.style.setProperty('display', 'none', 'important');
      // Show admin buttons
      const subsBtn = document.getElementById('topbarAdminSubscribersBtn');
      if (subsBtn) {
        subsBtn.classList.remove('admin-only-hidden');
        subsBtn.style.removeProperty('display');
      }
      const srvBtn = document.getElementById('topbarServerStatusBtn');
      if (srvBtn) {
        srvBtn.classList.remove('admin-only-hidden');
        srvBtn.style.removeProperty('display');
      }
      const tName = document.getElementById('topbarTeacherName');
      if (tName) tName.textContent = 'الأستاذ حسين قصي (المدير العام)';
      const tRole = document.getElementById('topbarTeacherRole');
      if (tRole) tRole.textContent = 'المدير العام 👑';
      if (window.switchToTab) window.switchToTab('tab-apps');
    });
    await page.waitForTimeout(500);

    const shotPath = path.resolve(`C:/Users/pc/.gemini/antigravity/brain/6e5a3653-d0f4-453c-bee5-63faff5b8c7c/preview_${res.name}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log(`Saved screenshot for ${res.name}: ${shotPath}`);
    await context.close();
  }

  await browser.close();
  console.log('✓ All browser viewport previews captured successfully!');
})();
