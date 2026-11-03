const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 }
  });
  const page = await context.newPage();

  const fileUrl = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  // Bypass portal
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
    if (window.switchToTab) window.switchToTab('tab-apps');
  });
  await page.waitForTimeout(1000);

  // Take screenshot at 1366x768
  const shot1366 = path.resolve('C:/Users/pc/.gemini/antigravity/brain/6e5a3653-d0f4-453c-bee5-63faff5b8c7c/compact_dashboard_1366.png');
  await page.screenshot({ path: shot1366, fullPage: false });
  console.log('Saved 1366x768 dashboard screenshot:', shot1366);

  // Resize to 1440x900
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(500);
  const shot1440 = path.resolve('C:/Users/pc/.gemini/antigravity/brain/6e5a3653-d0f4-453c-bee5-63faff5b8c7c/compact_dashboard_1440.png');
  await page.screenshot({ path: shot1440, fullPage: false });
  console.log('Saved 1440x900 dashboard screenshot:', shot1440);

  await browser.close();
})();
