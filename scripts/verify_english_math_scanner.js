const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('file:///' + path.resolve('index.html').replace(/\\/g, '/'), { waitUntil: 'load' });

  // Remove auth overlay if any
  await page.evaluate(() => {
    const authOverlay = document.getElementById('authGateOverlay');
    if (authOverlay) authOverlay.remove();
    const layout = document.getElementById('appMainLayout');
    if (layout) layout.style.display = 'flex';
  });

  // Open scanner modal
  await page.evaluate(() => {
    if (typeof window.openHandwrittenPaperScanner === 'function') {
      window.openHandwrittenPaperScanner(false);
    }
  });

  await page.waitForTimeout(500);

  // 1. Test Math Mode
  console.log('Testing Math Mode...');
  await page.evaluate(() => {
    window.setScannerSubjectMode('math');
    window.loadSampleHandwrittenPaper('math');
  });

  await page.waitForTimeout(600);

  // Take screenshot of modal in Math mode
  const artifactDir = 'C:/Users/pc/.gemini/antigravity/brain/6e5a3653-d0f4-453c-bee5-63faff5b8c7c';
  await page.screenshot({ path: path.join(artifactDir, 'scanner_v9_math_mode_modal.png') });

  // Apply Math questions to exam sheet
  await page.evaluate(() => {
    window.applyScannedQuestionsToExam(true);
  });

  await page.waitForTimeout(600);

  // Take screenshot of A4 exam sheet with Math questions
  await page.screenshot({ path: path.join(artifactDir, 'scanner_v9_math_a4_exam_sheet.png') });

  // 2. Test English Mode
  console.log('Testing English Mode...');
  await page.evaluate(() => {
    window.openHandwrittenPaperScanner(false);
    window.setScannerSubjectMode('english');
    window.loadSampleHandwrittenPaper('english');
  });

  await page.waitForTimeout(600);

  // Take screenshot of modal in English mode
  await page.screenshot({ path: path.join(artifactDir, 'scanner_v9_english_mode_modal.png') });

  // Apply English questions to exam sheet
  await page.evaluate(() => {
    window.applyScannedQuestionsToExam(true);
  });

  await page.waitForTimeout(600);

  // Take screenshot of A4 exam sheet with English questions (LTR)
  await page.screenshot({ path: path.join(artifactDir, 'scanner_v9_english_a4_exam_sheet.png') });

  console.log('All tests completed successfully!');
  await browser.close();
})();
