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

    if (typeof window.switchToTab === 'function') {
      window.switchToTab('tab-apps');
    }
  });

  await page.waitForTimeout(600);

  // Scroll to App 10 card
  await page.evaluate(() => {
    const card = document.querySelector('.card-locked-soon');
    if (card) card.scrollIntoView({ behavior: 'instant', block: 'center' });
  });

  await page.waitForTimeout(400);

  const artifactDir = 'C:/Users/pc/.gemini/antigravity/brain/6e5a3653-d0f4-453c-bee5-63faff5b8c7c';
  await page.screenshot({ path: path.join(artifactDir, 'exam_cards_locked_coming_soon.png') });
  console.log('Exam Cards Locked screenshot captured successfully!');

  // Test click on locked card
  await page.evaluate(() => {
    const card = document.querySelector('.card-locked-soon');
    if (card) card.click();
  });
  await page.waitForTimeout(500);

  await page.screenshot({ path: path.join(artifactDir, 'exam_cards_locked_toast_alert.png') });
  console.log('Exam Cards Toast screenshot captured successfully!');

  await browser.close();
})();
