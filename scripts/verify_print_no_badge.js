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

  // Test what ExamExporter produces
  const checkResult = await page.evaluate(() => {
    let capturedHtml = '';
    // Mock openPrintWindow to inspect bodyContent
    window.openPrintWindow = function(title, bodyContent) {
      capturedHtml = bodyContent;
    };

    if (window.ExamExporter && typeof window.ExamExporter.printStudentCopy === 'function') {
      window.ExamExporter.printStudentCopy();
    }

    const hasBadge = capturedHtml.includes('جمهورية العراق ــ وزارة التربية | ورقة الأسئلة الامتحانية ــ [ نسخة الطالب ]') ||
                     capturedHtml.includes('student-badge') ||
                     capturedHtml.includes('Official Examination Paper');

    return {
      capturedLength: capturedHtml.length,
      hasBadge: hasBadge
    };
  });

  console.log('Test Print Verification Result:', checkResult);
  if (!checkResult.hasBadge) {
    console.log('SUCCESS: Badge is completely removed from print outputs!');
  } else {
    console.error('FAILURE: Badge still present!');
  }

  await browser.close();
})();
