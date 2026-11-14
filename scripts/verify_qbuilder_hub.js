const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('file:///' + path.resolve('index.html').replace(/\\/g, '/'), { waitUntil: 'load' });

  // Remove auth overlay if any
  await page.evaluate(() => {
    const authOverlay = document.getElementById('authGateOverlay');
    if (authOverlay) authOverlay.remove();
    const layout = document.getElementById('appMainLayout');
    if (layout) layout.style.display = 'flex';
    // Switch to tab-questions
    if (typeof window.switchToTab === 'function') {
      window.switchToTab('tab-questions');
    }
  });

  await page.waitForTimeout(600);

  const artifactDir = 'C:/Users/pc/.gemini/antigravity/brain/6e5a3653-d0f4-453c-bee5-63faff5b8c7c';
  await page.screenshot({ path: path.join(artifactDir, 'qbuilder_new_modes_hub.png') });

  console.log('Screenshot captured successfully!');
  await browser.close();
})();
