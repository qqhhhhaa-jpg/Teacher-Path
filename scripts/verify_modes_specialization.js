const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });

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
      window.switchToTab('tab-questions');
    }
  });

  await page.waitForTimeout(600);
  const artifactDir = 'C:/Users/pc/.gemini/antigravity/brain/6e5a3653-d0f4-453c-bee5-63faff5b8c7c';

  // 1. Test Mode 1: Manual Question Builder
  console.log('Testing Mode 1: Manual Question Builder...');
  await page.evaluate(() => {
    window.triggerModeManualQuestion();
  });
  await page.waitForTimeout(500);

  const mode1Check = await page.evaluate(() => {
    const ws = document.getElementById('qbuilderQuestionsWorkspace');
    const scannerBar = document.getElementById('qbuilderPaperScannerBar');
    const cardBtn = document.getElementById('btnOpenPaperScannerCard');
    const isScannerBarHidden = !scannerBar || window.getComputedStyle(scannerBar).display === 'none';
    const isCardBtnHidden = !cardBtn || window.getComputedStyle(cardBtn).display === 'none';
    const isWsVisible = ws && window.getComputedStyle(ws).display !== 'none';
    return { isWsVisible, isScannerBarHidden, isCardBtnHidden };
  });
  console.log('Mode 1 check:', mode1Check);
  await page.screenshot({ path: path.join(artifactDir, 'qbuilder_mode1_manual_pure.png') });

  // 2. Return to hub & Test Mode 2: Voice Dictation Studio
  console.log('Testing Mode 2: Voice Dictation Studio...');
  await page.evaluate(() => {
    window.returnToQBuilderModesHub();
    window.triggerModeVoiceDictation();
  });
  await page.waitForTimeout(600);

  const mode2Check = await page.evaluate(() => {
    const modal = document.getElementById('handwrittenPaperScannerModal');
    const hero = document.getElementById('dedicatedVoiceHeroBox');
    const grid = modal.querySelector('.scanner-giant-actions-grid');
    const imgPreview = document.getElementById('scannerImagePreviewBox');
    const banner = document.getElementById('scannerVoiceLiveBanner');
    const title = modal.querySelector('.header-title-row h3')?.textContent;
    const badge = modal.querySelector('.header-pro-pill')?.textContent;

    return {
      hasModeVoice: modal.classList.contains('mode-voice'),
      heroDisplay: hero ? window.getComputedStyle(hero).display : 'none',
      gridDisplay: grid ? window.getComputedStyle(grid).display : 'none',
      imgPreviewDisplay: imgPreview ? window.getComputedStyle(imgPreview).display : 'none',
      bannerDisplay: banner ? window.getComputedStyle(banner).display : 'none',
      title,
      badge
    };
  });
  console.log('Mode 2 check:', mode2Check);
  await page.screenshot({ path: path.join(artifactDir, 'qbuilder_mode2_voice_pure.png') });

  // 3. Close Voice modal & Test Mode 3: Paper Image Scanner Studio
  console.log('Testing Mode 3: Paper Image Scanner Studio...');
  await page.evaluate(() => {
    window.closeHandwrittenPaperScanner();
    window.returnToQBuilderModesHub();
    window.triggerModePaperScanner();
  });
  await page.waitForTimeout(600);

  const mode3Check = await page.evaluate(() => {
    const modal = document.getElementById('handwrittenPaperScannerModal');
    const hero = document.getElementById('dedicatedVoiceHeroBox');
    const grid = modal.querySelector('.scanner-giant-actions-grid');
    const imgPreview = document.getElementById('scannerImagePreviewBox');
    const banner = document.getElementById('scannerVoiceLiveBanner');
    const title = modal.querySelector('.header-title-row h3')?.textContent;
    const badge = modal.querySelector('.header-pro-pill')?.textContent;
    const card4Text = grid?.querySelectorAll('.scanner-giant-card')?.[3]?.textContent || '';

    return {
      hasModeScanner: modal.classList.contains('mode-scanner'),
      heroDisplay: hero ? window.getComputedStyle(hero).display : 'none',
      gridDisplay: grid ? window.getComputedStyle(grid).display : 'none',
      imgPreviewDisplay: imgPreview ? window.getComputedStyle(imgPreview).display : 'none',
      bannerDisplay: banner ? window.getComputedStyle(banner).display : 'none',
      title,
      badge,
      card4HasVoice: card4Text.includes('صوت') || card4Text.includes('مايك')
    };
  });
  console.log('Mode 3 check:', mode3Check);
  await page.screenshot({ path: path.join(artifactDir, 'qbuilder_mode3_scanner_pure.png') });

  await browser.close();
  console.log('All tests completed successfully!');
})();
