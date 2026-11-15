const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 920 }
  });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  const artifactDir = 'C:/Users/pc/.gemini/antigravity/brain/6e5a3653-d0f4-453c-bee5-63faff5b8c7c';
  const testResults = {
    authPortalLoads: false,
    newRegistration1YearFree: false,
    registrationData: null,
    tabsAccessCheck: {},
    qbuilderModesCheck: {},
    samplePaperOcrCheck: false,
    examSheetRenderCheck: false,
    studentGradesCheck: false,
    studentBehaviorCheck: false,
    certificatesCheck: false,
    printOutputCheck: false,
    consoleErrorsCount: 0
  };

  console.log('--- بدء الفحص الشامل لمنصة مسار المعلم ---');

  // Step 1: Open index.html without prior login
  await page.goto('file:///' + path.resolve('index.html').replace(/\\/g, '/'), { waitUntil: 'load' });
  await page.waitForTimeout(600);

  const isPortalVisible = await page.evaluate(() => {
    const portal = document.getElementById('fullscreenAuthPortal');
    return portal && window.getComputedStyle(portal).display !== 'none';
  });
  testResults.authPortalLoads = isPortalVisible;
  console.log('1. بوابة الدخول المعتمدة محملة وظاهرة:', isPortalVisible);
  await page.screenshot({ path: path.join(artifactDir, 'audit_step1_auth_portal.png') });

  // Step 2: Open Teacher Registration Modal and Register New Account
  console.log('2. اختبار إنشاء حساب معلم جديد مع اشتراك سنوي مجاني...');
  await page.evaluate(() => {
    window.openTeacherRegistrationModal();
  });
  await page.waitForTimeout(400);

  const testPhone = '0770' + Math.floor(1000000 + Math.random() * 9000000);
  const testUser = 'teacher_' + Date.now().toString().slice(-5);
  await page.fill('#regTeacherFullName', 'أستاذ حيدر الكرخي');
  await page.fill('#regTeacherUsername', testUser);
  await page.fill('#regTeacherPassword', 'password123');
  await page.fill('#regTeacherPhone', testPhone);
  await page.fill('#regTeacherEmail', `${testUser}@test.iq`);
  await page.fill('#regTeacherSubject', 'اللغة العربية والتربية الإسلامية');
  await page.fill('#regTeacherSchool', 'ثانوية بغداد النموذجية');
  await page.fill('#regTeacherGov', 'بغداد - الرصافة الأولى');
  await page.fill('#regTeacherRights', 'إعداد وتنظيم الأستاذ حيدر الكرخي - جميع الحقوق محفوظة');

  await page.evaluate(() => {
    window.submitSingleStepTeacherRegistration();
  });
  await page.waitForTimeout(900);

  // Verify newly created account subscription
  const regCheck = await page.evaluate(() => {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const isVip = user && user.isVip;
    const isSubscribed = user && user.isSubscribed;
    const isTrial = user && user.isTrial;
    const planName = user && user.subscriptionPlanName;
    const expDate = user && user.subscriptionExpiresAt;
    const expYear = expDate ? new Date(expDate).getFullYear() : 0;
    const currentYear = new Date().getFullYear();
    const isOneYear = expYear === currentYear + 1;
    const trialBanner = document.getElementById('trialWarningBanner');
    const isBannerHidden = !trialBanner || window.getComputedStyle(trialBanner).display === 'none';

    return {
      user: user ? { name: user.name, username: user.username, role: user.role } : null,
      isVip,
      isSubscribed,
      isTrial,
      planName,
      expDate,
      isOneYear,
      isBannerHidden
    };
  });

  testResults.registrationData = regCheck;
  testResults.newRegistration1YearFree = regCheck.isSubscribed && regCheck.isVip && !regCheck.isTrial && regCheck.isOneYear;
  console.log('نتيجة فحص الاشتراك السنوي المجاني للحساب الجديد:', regCheck);
  await page.screenshot({ path: path.join(artifactDir, 'audit_step2_registered_workspace.png') });

  // Step 3: Check full access to all sections (Grades, Behavior, Certificates, Question Builder)
  console.log('3. اختبار الوصول لكافة أقسام المنصة بدون أي قفل أو قيود...');
  const tabsToTest = ['tab-apps', 'tab-questions', 'tab-student-grades', 'tab-student-behavior', 'tab-report', 'tab-certificates', 'tab-settings'];
  for (const tabId of tabsToTest) {
    const tabAccessible = await page.evaluate((id) => {
      window.switchToTab(id);
      const tabEl = document.getElementById(id);
      const isVisible = tabEl && window.getComputedStyle(tabEl).display !== 'none';
      const isLockedModal = document.getElementById('subscriptionModal')?.classList.contains('open');
      return isVisible && !isLockedModal;
    }, tabId);
    testResults.tabsAccessCheck[tabId] = tabAccessible;
  }
  console.log('حالة الوصول لكافة الأقسام:', testResults.tabsAccessCheck);

  // Step 4: Test Question Builder Hub and Creation Modes
  console.log('4. فحص استوديو بناء الأسئلة والأنماط الثلاثة المفصولة...');
  await page.evaluate(() => {
    window.switchToTab('tab-questions');
    if (typeof window.returnToQBuilderModesHub === 'function') window.returnToQBuilderModesHub();
  });
  await page.waitForTimeout(400);

  const hubCheck = await page.evaluate(() => {
    const hub = document.getElementById('qbuilderWelcomeHub');
    const cards = hub ? hub.querySelectorAll('.qbuilder-mode-card').length : 0;
    return { isHubVisible: hub && window.getComputedStyle(hub).display !== 'none', cardsCount: cards };
  });
  testResults.qbuilderModesCheck.hub = hubCheck;
  await page.screenshot({ path: path.join(artifactDir, 'audit_step3_qbuilder_hub.png') });

  // Test Mode 1 (Manual Writing)
  await page.evaluate(() => {
    window.triggerModeManualQuestion();
  });
  await page.waitForTimeout(400);
  const mode1Ws = await page.evaluate(() => {
    const ws = document.getElementById('qbuilderQuestionsWorkspace');
    const bar = document.getElementById('qbuilderPaperScannerBar');
    return {
      wsVisible: ws && window.getComputedStyle(ws).display !== 'none',
      barHidden: !bar || window.getComputedStyle(bar).display === 'none'
    };
  });
  testResults.qbuilderModesCheck.mode1Manual = mode1Ws;

  // Test Mode 3 (Paper Scanner) & Load Sample Paper
  console.log('5. فحص قارئ وتصوير الورقة ونموذج خط اليد...');
  await page.evaluate(() => {
    window.triggerModePaperScanner();
  });
  await page.waitForTimeout(500);

  await page.evaluate(() => {
    window.loadSampleHandwrittenPaper();
  });
  await page.waitForTimeout(1000);

  const samplePaperCheck = await page.evaluate(() => {
    const questions = document.querySelectorAll('.scanner-parsed-q-card');
    const count = questions ? questions.length : 0;
    const btnApply = document.getElementById('btnReplaceScannedQuestions');
    const isApplyEnabled = btnApply && !btnApply.disabled;
    return { count, isApplyEnabled };
  });
  testResults.samplePaperOcrCheck = samplePaperCheck.count > 0;
  console.log('فحص استخراج نموذج الورقة:', samplePaperCheck);
  await page.screenshot({ path: path.join(artifactDir, 'audit_step4_paper_scanner_demo.png') });

  // Apply Scanned Questions to Exam Sheet
  await page.evaluate(() => {
    window.applyScannedQuestionsToExam(true);
  });
  await page.waitForTimeout(600);

  const examSheetCheck = await page.evaluate(() => {
    const questions = typeof appState !== 'undefined' ? appState.questions : [];
    const previewEl = document.getElementById('examPaperDoc') || document.getElementById('examPaperPage_1');
    const qCountInState = questions.length;
    const isPreviewRendered = previewEl && previewEl.innerHTML.length > 200;
    return { qCountInState, isPreviewRendered };
  });
  testResults.examSheetRenderCheck = examSheetCheck.qCountInState > 0 && examSheetCheck.isPreviewRendered;
  console.log('فحص ورقة الامتحان A4 بعد الاعتماد:', examSheetCheck);
  await page.screenshot({ path: path.join(artifactDir, 'audit_step5_exam_sheet_rendered.png') });

  // Step 6: Test Student Grades Studio
  console.log('6. فحص سجل درجات الطلاب...');
  await page.evaluate(() => {
    window.switchToTab('tab-student-grades');
  });
  await page.waitForTimeout(400);

  const gradesCheck = await page.evaluate(() => {
    const table = document.getElementById('sgGradesTableBody') || document.querySelector('.student-grades-table');
    return table !== null;
  });
  testResults.studentGradesCheck = gradesCheck;
  await page.screenshot({ path: path.join(artifactDir, 'audit_step6_student_grades.png') });

  // Step 7: Test Student Behavior Studio
  console.log('7. فحص سجل سلوك ومتابعة الطلاب...');
  await page.evaluate(() => {
    window.switchToTab('tab-student-behavior');
  });
  await page.waitForTimeout(400);
  const behaviorCheck = await page.evaluate(() => {
    const tab = document.getElementById('tab-student-behavior');
    return tab && window.getComputedStyle(tab).display !== 'none';
  });
  testResults.studentBehaviorCheck = behaviorCheck;
  await page.screenshot({ path: path.join(artifactDir, 'audit_step7_student_behavior.png') });

  // Step 8: Test Certificates Studio
  console.log('8. فحص استوديو شهادات التقدير...');
  await page.evaluate(() => {
    window.switchToTab('tab-certificates');
  });
  await page.waitForTimeout(400);
  const certCheck = await page.evaluate(() => {
    const certStudio = document.querySelector('.cert-studio-container');
    return certStudio !== null;
  });
  testResults.certificatesCheck = certCheck;
  await page.screenshot({ path: path.join(artifactDir, 'audit_step8_certificates.png') });

  // Step 9: Print Output Cleanliness Verification
  console.log('9. فحص خلو مخرجات الطباعة من أي نصوص أو شارات غير مرغوبة...');
  await page.evaluate(() => {
    window.switchToTab('tab-questions');
  });
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(300);

  const printBadgeCheck = await page.evaluate(() => {
    const html = document.body.innerHTML;
    const hasUnwantedBadge = html.includes('جمهورية العراق ــ وزارة التربية | ورقة الأسئلة الامتحانية') ||
      html.includes('[ نسخة الطالب ] ــ جمهورية العراق');
    return !hasUnwantedBadge;
  });
  testResults.printOutputCheck = printBadgeCheck;
  await page.screenshot({ path: path.join(artifactDir, 'audit_step9_print_clean.png') });

  testResults.consoleErrorsCount = consoleErrors.length;
  testResults.consoleErrors = consoleErrors;

  await browser.close();

  // Save audit report
  fs.writeFileSync(path.join(artifactDir, 'platform_full_audit_results.json'), JSON.stringify(testResults, null, 2), 'utf8');
  console.log('=== اكتمل الفحص الشامل بنجاح تام ===');
  console.log(JSON.stringify(testResults, null, 2));
})();
