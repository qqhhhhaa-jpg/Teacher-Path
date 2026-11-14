const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  await context.addInitScript(() => {
    localStorage.setItem('moallem_logged_in', 'true');
    localStorage.setItem('moallem_auth_portal_open', 'false');
    localStorage.setItem('moallem_current_user', JSON.stringify({
      username: 'admin',
      role: 'admin',
      fullName: 'الأستاذ أحمد الشمري',
      isAdmin: true,
      subscriptionPlan: 'plan3'
    }));
  });

  const page = await context.newPage();
  await page.goto('file:///' + path.resolve('index.html').replace(/\\/g, '/'), { waitUntil: 'load' });

  await page.evaluate(() => {
    const portal = document.getElementById('fullscreenAuthPortal');
    if (portal) {
      portal.classList.add('portal-hidden');
      portal.style.display = 'none';
    }
    const workstation = document.getElementById('appWorkstation');
    if (workstation) workstation.classList.remove('portal-locked');

    if (typeof window.openQuestionBuilderHub === 'function') {
      window.openQuestionBuilderHub();
    }
  });

  await page.waitForTimeout(600);

  const artifactDir = 'C:/Users/pc/.gemini/antigravity/brain/6e5a3653-d0f4-453c-bee5-63faff5b8c7c';

  // 1. Capture Clean Hub (Only quote + 3 mode cards)
  await page.screenshot({ path: path.join(artifactDir, 'qbuilder_state1_clean_hub_only.png') });
  console.log('State 1 (Clean Hub Only) captured successfully!');

  // 2. Click Mode 1: Manual Questions
  await page.evaluate(() => {
    window.triggerModeManualQuestion();
  });
  await page.waitForTimeout(600);

  // Capture State 2: Active Workspace Revealed
  await page.screenshot({ path: path.join(artifactDir, 'qbuilder_state2_workspace_revealed.png') });
  console.log('State 2 (Workspace Revealed) captured successfully!');

  // 3. Return back to 3 modes Hub
  await page.evaluate(() => {
    window.returnToQBuilderModesHub();
  });
  await page.waitForTimeout(600);

  // Capture State 3: Clean Hub again
  await page.screenshot({ path: path.join(artifactDir, 'qbuilder_state3_returned_to_hub.png') });
  console.log('State 3 (Returned to Clean Hub) captured successfully!');

  await browser.close();
})();
