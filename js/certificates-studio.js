/**
 * مسار المعلم | استوديو تصميم وإصدار شهادات التقدير والتفوق للطلبة
 * Teacher Path | Official Student Honors & Certificates Studio 🎓📜
 * يدعم: استيراد ملفات Excel، الطباعة الجماعية والفردية A4/PDF، المعاينة الحية المباشرة، والأرشفة الشاملة
 */

(function () {
  'use strict';

  // ==========================================
  // Puppeteer Page API Compatibility Layer (Browser & Node PDF Engine)
  // Enables: await page.emulateMedia({ media: 'screen' }); await page.pdf({ path: 'page.pdf' });
  // ==========================================
  window.page = window.page || {};
  window.page.media = 'screen';

  window.page.emulateMedia = async function(options) {
    const media = (options && (options.media || options.mediaType)) || 'screen';
    window.page.media = media;
    window.__activePdfMediaType = media;

    let styleEl = document.getElementById('puppeteer-emulate-media-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'puppeteer-emulate-media-style';
      document.head.appendChild(styleEl);
    }

    if (media === 'screen') {
      styleEl.textContent = `
        *, *::before, *::after {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        @media print {
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `;
      document.documentElement.setAttribute('data-emulated-media', 'screen');
    } else {
      styleEl.textContent = '';
      document.documentElement.removeAttribute('data-emulated-media');
    }
    return Promise.resolve(true);
  };

  window.page.pdf = async function(options) {
    options = options || {};
    const targetPath = options.path || 'page.pdf';

    // Route to appropriate exporter based on active tab / state
    const certTab = document.getElementById('tab-certificates');
    const isCertActive = certTab && (certTab.classList.contains('active') || certTab.style.display !== 'none');

    const schedTab = document.getElementById('tab-schedules');
    const isSchedActive = schedTab && (schedTab.classList.contains('active') || schedTab.style.display !== 'none');

    if (isCertActive || (typeof window.executeCertificatesBatchPdf === 'function' && typeof activeBatch !== 'undefined' && activeBatch)) {
      return await window.executeCertificatesBatchPdf({ ...options, path: targetPath });
    } else if (isSchedActive && typeof window.executeSchedulePdf === 'function') {
      return await window.executeSchedulePdf({ ...options, path: targetPath });
    } else if (typeof window.executeExamPaperPdf === 'function') {
      return await window.executeExamPaperPdf({ ...options, path: targetPath });
    } else if (typeof window.executeCertificatesBatchPdf === 'function') {
      return await window.executeCertificatesBatchPdf({ ...options, path: targetPath });
    }
    return Promise.resolve(false);
  };

  var page = window.page;

  // 1. Storage Helpers
  function getCertBatchesStorageKey() {
    if (typeof window !== 'undefined' && typeof window.getAccountStorageKey === 'function') {
      return window.getAccountStorageKey('masar_teacher_cert_batches_v1');
    }
    const cur = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    const uid = cur ? (cur.id || cur.username || 'user') : 'guest';
    return `masar_teacher_cert_batches_v1_${uid}`;
  }

  function getActiveBatchIdStorageKey() {
    if (typeof window !== 'undefined' && typeof window.getAccountStorageKey === 'function') {
      return window.getAccountStorageKey('masar_teacher_cert_active_batch_id');
    }
    const cur = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    const uid = cur ? (cur.id || cur.username || 'user') : 'guest';
    return `masar_teacher_cert_active_batch_id_${uid}`;
  }

  // Standard Iraqi Curriculum Subjects for Year-End Report Cards
  const DEFAULT_YEAR_END_SUBJECTS = [
    { name: 'التربية الإسلامية والقرآن الكريم', effort: 95, finalExam: 97, maxScore: 100 },
    { name: 'اللغة العربية وقواعدها', effort: 92, finalExam: 94, maxScore: 100 },
    { name: 'اللغة الإنكليزية', effort: 90, finalExam: 95, maxScore: 100 },
    { name: 'الرياضيات', effort: 96, finalExam: 98, maxScore: 100 },
    { name: 'الكيمياء / العلوم', effort: 94, finalExam: 96, maxScore: 100 },
    { name: 'الفيزياء', effort: 93, finalExam: 95, maxScore: 100 },
    { name: 'علوم الحياة (الأحياء)', effort: 95, finalExam: 98, maxScore: 100 },
    { name: 'الاجتماعيات والتربية الوطنية', effort: 96, finalExam: 97, maxScore: 100 },
    { name: 'الحاسوب وتقنية المعلومات', effort: 98, finalExam: 99, maxScore: 100 },
    { name: 'التربية الفنية والنشاط المدرسي', effort: 98, finalExam: 100, maxScore: 100 },
    { name: 'السلوك والمواظبة العامة', effort: 100, finalExam: 100, maxScore: 100 }
  ];

  // Arabic Number-to-Words Converter (0 - 100) for Official Academic Transcripts
  function convertGradeToWordsArabic(num) {
    const n = Math.round(Number(num) || 0);
    if (n <= 0) return 'صفر';
    if (n === 100) return 'مئة';
    if (n > 100) return 'أكثر من مئة';

    const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة'];
    const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
    const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];

    if (n <= 10) return ones[n];
    if (n < 20) return teens[n - 10];

    const unit = n % 10;
    const ten = Math.floor(n / 10);

    if (unit === 0) return tens[ten];
    return `${ones[unit]} و${tens[ten]}`;
  }

  function getAppreciationArabic(score) {
    const s = Number(score) || 0;
    if (s >= 90) return 'امتياز';
    if (s >= 80) return 'جيد جداً';
    if (s >= 70) return 'جيد';
    if (s >= 60) return 'متوسط';
    if (s >= 50) return 'مقبول';
    return 'معيد';
  }

  function getNextGradeArabic(gradeLevel) {
    if (!gradeLevel) return 'الصف الأعلى التالي';
    const g = String(gradeLevel).trim();
    if (g.includes('الأول المتوسط')) return 'الصف الثاني المتوسط';
    if (g.includes('الثاني المتوسط')) return 'الصف الثالث المتوسط';
    if (g.includes('الثالث المتوسط')) return 'الصف الرابع الإعدادي';
    if (g.includes('الرابع العلمي') || g.includes('الرابع')) return 'الصف الخامس العلمي';
    if (g.includes('الخامس العلمي') || g.includes('الخامس')) return 'الصف السادس الإعدادي';
    if (g.includes('السادس الابتدائي') || g.includes('السادس')) return 'الصف الأول المتوسط';
    if (g.includes('الخامس الابتدائي')) return 'الصف السادس الابتدائي';
    if (g.includes('الرابع الابتدائي')) return 'الصف الخامس الابتدائي';
    return 'الصف الأعلى التالي';
  }

  function ensureStudentSubjects(student) {
    if (student.subjects && Array.isArray(student.subjects) && student.subjects.length > 0) {
      return student.subjects;
    }
    const target = parseFloat(student.score) || 95;
    student.subjects = DEFAULT_YEAR_END_SUBJECTS.map((sub, idx) => {
      let offset = 0;
      if (idx === 0) offset = 2;
      else if (idx === 1) offset = -2;
      else if (idx === 2) offset = -3;
      else if (idx === 3) offset = 1;
      else if (idx === 8) offset = 3;
      else if (idx >= 9) offset = 4;
      const eff = Math.min(100, Math.max(50, Math.round(target + offset - 1)));
      const fin = Math.min(100, Math.max(50, Math.round(target + offset + 1)));
      return {
        id: 'sub_' + (idx + 1),
        name: sub.name,
        effort: eff,
        finalExam: fin,
        maxScore: 100
      };
    });
    return student.subjects;
  }

  function calculateStudentSubjectsMetrics(student) {
    const subs = ensureStudentSubjects(student);
    let totalScore = 0;
    let maxTotal = 0;
    let failedCount = 0;

    const rows = subs.map((sub, i) => {
      const eff = Number(sub.effort) || 0;
      const fin = Number(sub.finalExam) || 0;
      const finalScore = (sub.finalScore !== undefined && sub.finalScore !== null) 
        ? Number(sub.finalScore) 
        : Math.round((eff + fin) / 2);
      const max = Number(sub.maxScore) || 100;
      totalScore += finalScore;
      maxTotal += max;
      const isPass = finalScore >= (max * 0.5);
      if (!isPass) failedCount++;
      const written = convertGradeToWordsArabic(finalScore);
      const appreciation = getAppreciationArabic(finalScore);

      return {
        index: i + 1,
        name: sub.name,
        effort: eff,
        finalExam: fin,
        finalScore: finalScore,
        written: written,
        appreciation: appreciation,
        isPass: isPass,
        max: max
      };
    });

    const average = subs.length > 0 ? (totalScore / subs.length).toFixed(1) : 0;
    const isPassed = failedCount === 0;
    const overallAppreciation = getAppreciationArabic(average);

    return {
      rows: rows,
      totalScore: totalScore,
      maxTotal: maxTotal,
      average: average,
      isPassed: isPassed,
      failedCount: failedCount,
      overallAppreciation: overallAppreciation,
      writtenTotal: convertGradeToWordsArabic(Math.min(100, Math.round(average)))
    };
  }

  // 1.9 Smart Educational Date Helpers (Arabic Device Sync & Calendar)
  const ARABIC_MONTHS = [
    'كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران',
    'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'
  ];

  function getDeviceLocalDateFormatted(d = new Date()) {
    try {
      const day = d.getDate();
      const monthName = ARABIC_MONTHS[d.getMonth()] || '';
      const year = d.getFullYear();
      return `${day} ${monthName} ${year}`;
    } catch(e) {
      return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
    }
  }

  function getDeviceLocalDateIso(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // 2. Default Initial Batch Factory
  function createDefaultCertBatch() {
    const cur = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    const teacher = (cur && cur.name) ? cur.name : 'أستاذ المادة';
    const school = (cur && cur.school) ? cur.school : 'ثانوية المتميزين للبنين';
    const gov = (cur && cur.governorate) ? cur.governorate : 'بغداد - الكرخ الثانية';
    const sub = (cur && cur.subject) ? cur.subject : 'اللغة العربية والرياضيات';

    return {
      id: 'cert_batch_' + Date.now(),
      title: 'شهادات تكريم وتفوق الطلبة المتميزين',
      schoolName: school,
      governorate: gov,
      gradeLevel: 'الثالث المتوسط',
      section: '',
      subject: sub,
      academicYear: '2024 - 2025 م',
      teacherName: teacher,
      principalName: 'إدارة المدرسة',
      certType: 'شهادة شكر وتقدير وتفوق', // شهادة تفوق دراسي | شهادة شكر وتقدير | شهادة إتقان وسلوك متميز | شهادة ختامية
      templateId: 'royalGold', // 'royalGold' | 'navyAcademic' | 'emeraldExcellence' | 'purpleLuxury'
      orientation: 'landscape', // 'landscape' | 'portrait'
      showSeal: false,
      sealType: 'gold24k', // 'gold24k' | 'royalRed' | 'emeraldHonor'
      showQr: true,
      customTributeText: 'نظراً لجهوده المتميزة وتفوقه الدراسي الباهر وأخلاقه العالية طيلة العام الدراسي، متمنين له دوام التألق والنجاح في مسيرته العلمية المباركة.',
      issueDate: getDeviceLocalDateFormatted(new Date()),
      updatedAt: new Date().toISOString(),
      students: [
        { id: 'cs_1', name: 'أحمد علي حسن', gradeOrRank: 'المرتبة الأولى', score: '98', customNote: 'بمعدل امتياز 98%' },
        { id: 'cs_2', name: 'محمد حسين خليل', gradeOrRank: 'المرتبة الثانية', score: '96', customNote: 'بمعدل امتياز 96%' },
        { id: 'cs_3', name: 'زين العابدين حيدر', gradeOrRank: 'المرتبة الثالثة', score: '95', customNote: 'بمعدل امتياز 95%' },
        { id: 'cs_4', name: 'حسين مصطفى كامل', gradeOrRank: 'متفوق', score: '92', customNote: 'تقدير ممتاز' },
        { id: 'cs_5', name: 'كرار باسم عبد الرضا', gradeOrRank: 'متفوق', score: '90', customNote: 'تقدير ممتاز' }
      ]
    };
  }

  // 3. State
  let batches = [];
  let activeBatch = null;
  let activeStudentIndex = 0;
  let pendingImportStudents = [];
  let autoSaveTimer = null;
  let zoomLevel = 1.0;

  // 4. Persistence
  function loadBatches() {
    try {
      const key = getCertBatchesStorageKey();
      const raw = localStorage.getItem(key);
      if (raw) {
        batches = JSON.parse(raw);
      } else {
        batches = [createDefaultCertBatch()];
      }
    } catch (e) {
      console.warn('loadBatches error:', e);
      batches = [createDefaultCertBatch()];
    }

    // Set Active Batch
    try {
      const activeIdKey = getActiveBatchIdStorageKey();
      const savedActiveId = localStorage.getItem(activeIdKey);
      if (savedActiveId) {
        activeBatch = batches.find(b => b.id === savedActiveId) || batches[0] || null;
      } else {
        activeBatch = batches[0] || null;
      }
    } catch (_) {
      activeBatch = batches[0] || null;
    }

    if (!activeBatch && batches.length > 0) {
      activeBatch = batches[0];
    }
  }

  function saveBatches(showFeedback = true) {
    try {
      const key = getCertBatchesStorageKey();
      localStorage.setItem(key, JSON.stringify(batches));
      if (activeBatch) {
        const activeIdKey = getActiveBatchIdStorageKey();
        localStorage.setItem(activeIdKey, activeBatch.id);
      }
      if (showFeedback) {
        const badge = document.getElementById('certSaveStatusBadge');
        if (badge) {
          badge.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> تم الحفظ تلقائياً';
          badge.className = 'sg-status-badge sg-status-saved';
        }
      }
    } catch (e) {
      console.error('saveBatches error:', e);
    }
  }

  function triggerAutoSave() {
    const badge = document.getElementById('certSaveStatusBadge');
    if (badge) {
      badge.innerHTML = '<i class="fa-solid fa-arrows-rotate fa-spin"></i> جاري الحفظ...';
      badge.className = 'sg-status-badge sg-status-pending';
    }
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      saveBatches(true);
    }, 450);
  }

  // 5. Tribute Text Presets
  const TRIBUTE_PRESETS = [
    {
      label: 'تفوق واجتهاد أكاديمي عام 🌟',
      text: 'نظراً لجهوده المتميزة وتفوقه الدراسي الباهر وأخلاقه العالية طيلة العام الدراسي، متمنين له دوام التألق والنجاح في مسيرته العلمية المباركة.'
    },
    {
      label: 'المراتب الأولى والمعدل العالي 🥇',
      text: 'تقديراً لاجتهاده ومثابرته وحصوله على المراتب الأولى بجدارة واستحقاق، سائلين الله العلي القدير أن يوفقه دائماً لخدمة وطنه وأهله.'
    },
    {
      label: 'التميز في مادة المدرس الخاصة 📚',
      text: 'تقديراً لتميزه الإبداعي وتفوقه اللامع في مادة {المادة} وتفاعله الإيجابي والملهم، متمنين له مستقبلاً زاهراً مكللاً بالنجاح.'
    },
    {
      label: 'حسن السلوك والانضباط المدرسي 🎖️',
      text: 'تثميناً لأخلاقه النبيلة وسلوكه المثالي ومواظبته النموذجية وحرصه على رفع راية العلم والفضيلة داخل الصرح التعليمي.'
    },
    {
      label: 'شهادة إتمام وتخرج ختامية 🎓',
      text: 'شهادة إتمام وتفوق ختامية بمناسبة اجتياز العام الدراسي بنجاح واقتدار وإثبات الجدارة العالية في التحصيل العلمي.'
    }
  ];

  window.certApplyTributePreset = function(index) {
    if (!activeBatch) return;
    const preset = TRIBUTE_PRESETS[index];
    if (preset) {
      activeBatch.customTributeText = preset.text;
      const input = document.getElementById('certCustomTributeInput');
      if (input) input.value = preset.text;
      renderLiveCertificatePreview();
      triggerAutoSave();
      if (typeof window.showToast === 'function') {
        window.showToast(`تم تطبيق صيغة: ${preset.label} ✍️`, 'success');
      }
    }
  };

  // 6. Template Configuration
  const TEMPLATES_CONFIG = {
    royalGold: {
      id: 'royalGold',
      name: 'الملكي الذهبي الكلاسيكي',
      themeClass: 'cert-theme-royal-gold',
      primaryColor: '#b45309',
      accentColor: '#f59e0b',
      borderStyle: 'double-gold',
      badge: 'الأكثر فخامة 👑'
    },
    navyAcademic: {
      id: 'navyAcademic',
      name: 'الكحلي الأكاديمي والذهبي',
      themeClass: 'cert-theme-navy-academic',
      primaryColor: '#0f2744',
      accentColor: '#d97706',
      borderStyle: 'executive-navy',
      badge: 'النمط الوزاري الرسمي 🏛️'
    },
    emeraldExcellence: {
      id: 'emeraldExcellence',
      name: 'الزمردي الحديث (المتميزون)',
      themeClass: 'cert-theme-emerald',
      primaryColor: '#064e3b',
      accentColor: '#10b981',
      borderStyle: 'emerald-arabesque',
      badge: 'نمط التميز والإتقان 🌿'
    },
    purpleLuxury: {
      id: 'purpleLuxury',
      name: 'البنفسجي الماسي VIP',
      themeClass: 'cert-theme-purple',
      primaryColor: '#581c87',
      accentColor: '#a855f7',
      borderStyle: 'purple-diamond',
      badge: 'إصدار ماسي VIP 💎'
    },
    rubyImperial: {
      id: 'rubyImperial',
      name: 'الياقوتي الإمبراطوري 🍷',
      themeClass: 'cert-theme-ruby',
      primaryColor: '#881337',
      accentColor: '#e11d48',
      borderStyle: 'ruby-ornate',
      badge: 'قرمزي ملوكي مذهب 🍷'
    },
    amberHeritage: {
      id: 'amberHeritage',
      name: 'العنبري التراثي العريق 📜',
      themeClass: 'cert-theme-amber-heritage',
      primaryColor: '#78350f',
      accentColor: '#d97706',
      borderStyle: 'amber-parchment',
      badge: 'مخطوطات أصيلة 📜'
    },
    turquoisePrestige: {
      id: 'turquoisePrestige',
      name: 'الفيروزي الأندلسي 🦚',
      themeClass: 'cert-theme-turquoise',
      primaryColor: '#0f766e',
      accentColor: '#14b8a6',
      borderStyle: 'turquoise-arabesque',
      badge: 'أندلسي ملكي فاخر 🦚'
    },
    midnightOnyx: {
      id: 'midnightOnyx',
      name: 'الأسود الأونيكس VIP 🖤',
      themeClass: 'cert-theme-midnight-onyx',
      primaryColor: '#0f172a',
      accentColor: '#d97706',
      borderStyle: 'onyx-gold',
      badge: 'نخبوي وذهب 24K 🖤'
    }
  };

  // 7. Render Forms and Controls
  function renderBatchMetaForm() {
    if (!activeBatch) return;

    const elTitle = document.getElementById('certBatchTitleInput');
    const elSchool = document.getElementById('certSchoolNameInput');
    const elGov = document.getElementById('certGovernorateInput');
    const elGrade = document.getElementById('certGradeLevelInput');
    const elSection = document.getElementById('certSectionInput');
    const elSubject = document.getElementById('certSubjectInput');
    const elYear = document.getElementById('certAcademicYearInput');
    const elTeacher = document.getElementById('certTeacherNameInput');
    const elPrincipal = document.getElementById('certPrincipalNameInput');
    const elType = document.getElementById('certTypeSelect');
    const elTribute = document.getElementById('certCustomTributeInput');
    const elDate = document.getElementById('certIssueDateInput');
    const elOrientation = document.getElementById('certOrientationSelect');

    if (elTitle) elTitle.value = activeBatch.title || '';
    if (elSchool) elSchool.value = activeBatch.schoolName || '';
    if (elGov) elGov.value = activeBatch.governorate || '';
    if (elGrade) elGrade.value = activeBatch.gradeLevel || '';
    if (elSection) elSection.value = activeBatch.section || '';
    if (elSubject) elSubject.value = activeBatch.subject || '';
    if (elYear) elYear.value = activeBatch.academicYear || '';
    if (elTeacher) elTeacher.value = activeBatch.teacherName || '';
    if (elPrincipal) elPrincipal.value = activeBatch.principalName || '';
    if (elType) elType.value = activeBatch.certType || 'شهادة شكر وتقدير وتفوق';
    if (elDate) {
      if (!activeBatch.issueDate) {
        activeBatch.issueDate = getDeviceLocalDateFormatted(new Date());
      }
      elDate.value = activeBatch.issueDate || '';
      const nativePicker = document.getElementById('certIssueDatePickerNative');
      if (nativePicker) {
        nativePicker.value = getDeviceLocalDateIso(new Date());
      }
    }
    if (elOrientation) elOrientation.value = activeBatch.orientation || 'landscape';

    // Highlight active template pill
    document.querySelectorAll('.cert-template-pill').forEach(btn => {
      const tid = btn.getAttribute('data-template');
      btn.classList.toggle('active', tid === (activeBatch.templateId || 'royalGold'));
    });

    updateCategorySwitcherUI();
  }

  // 8. Live Certificate Renderer (The Visual Engine)
  function buildYearEndCertificateHtml(student, batch, currentTmpl, isLandscape, isPrintMode, certIndex = 0) {
    const metrics = calculateStudentSubjectsMetrics(student);
    const nextGrade = getNextGradeArabic(batch.gradeLevel);
    const seatNum = (student.seatNumber && !student.seatNumber.startsWith('cs_')) ? student.seatNumber : String(certIndex + 1).padStart(3, '0');

    const renderedSubjectRows = metrics.rows.map(r => `
      <tr>
        <td class="cye-cell-num">${r.index}</td>
        <td class="cye-cell-name">${escapeHtml(r.name)}</td>
        <td class="cye-cell-num">${r.effort}</td>
        <td class="cye-cell-num">${r.finalExam}</td>
        <td class="cye-cell-num ${r.isPass ? 'cye-cell-score-pass' : 'cye-cell-score-fail'} font-bold">${r.finalScore}</td>
        <td class="cye-cell-written">${r.written}</td>
        <td class="cye-cell-appreciation">${r.appreciation}</td>
        <td class="cye-cell-result">
          <span class="${r.isPass ? 'cye-badge-pass' : 'cye-badge-fail'}">${r.isPass ? 'ناجح' : 'مكمل'}</span>
        </td>
      </tr>
    `).join('');

    return `
      <div class="certificate-paper ${currentTmpl.themeClass} ${isLandscape ? 'orientation-landscape' : 'orientation-portrait'} ${isPrintMode ? 'is-print-mode' : ''} is-year-end" id="${isPrintMode ? 'renderedCertPaper_' + certIndex : 'renderedCertPaper'}">
        
        <!-- Ornate Outer Border Frame -->
        <div class="cert-outer-border">
          <div class="cert-inner-border">
            <div class="cert-fine-border">

              <!-- Guilloche Corner Ornaments -->
              <div class="cert-corner corner-top-right"></div>
              <div class="cert-corner corner-top-left"></div>
              <div class="cert-corner corner-bottom-right"></div>
              <div class="cert-corner corner-bottom-left"></div>

              <div class="cert-year-end-container">
                
                <!-- 1. Official Ministerial Header -->
                <header class="cye-header">
                  <div class="cye-header-right">
                    <div class="cye-gov-line">جمهورية العراق</div>
                    <div class="cye-gov-line">وزارة التربية والتعليم</div>
                    <div class="cye-gov-line">المديرية العامة لتربية ${escapeHtml(batch.governorate || 'بغداد')}</div>
                    <div class="cye-gov-line font-bold">${escapeHtml(batch.schoolName || 'ثانوية المتميزين للبنين')}</div>
                  </div>

                  <div class="cye-header-center">
                    <div class="cye-eagle-badge">
                      <img src="assets/iraq_moe_seal.png" class="cye-eagle-img" alt="شعار جمهورية العراق" onerror="this.style.display='none'">
                    </div>
                    <h1 class="cye-title">وثيقة وشهادة درجات نهاية السنة الدراسية</h1>
                    <div class="cye-subtitle">للعام الدراسي: <strong>${escapeHtml(batch.academicYear || '2024 - 2025 م')}</strong> • الدور الأول الرسمي</div>
                  </div>

                  <div class="cye-header-left">
                    <!-- Clean balanced header spacer (meta box removed per user request) -->
                  </div>
                </header>

                <!-- 2. Student Identity Bar -->
                <div class="cye-student-card">
                  <div class="cye-st-item cye-st-item-name">
                    <span class="cye-st-label">اسم الطالب:</span>
                    <span class="cye-st-val cye-st-val-name">${escapeHtml(student.name || 'اسم الطالب')}</span>
                  </div>
                  <div class="cye-st-item">
                    <span class="cye-st-label">المدرسة:</span>
                    <span class="cye-st-val">${escapeHtml(batch.schoolName || 'المدرسة')}</span>
                  </div>
                  <div class="cye-st-item">
                    <span class="cye-st-label">الصف:</span>
                    <span class="cye-st-val">${escapeHtml(batch.gradeLevel || 'الثالث المتوسط')}${batch.section ? ` (${escapeHtml(batch.section)})` : ''}</span>
                  </div>
                </div>

                <!-- 3. Grades & Subjects Compact Table -->
                <div class="cye-table-wrap">
                  <table class="cye-grades-table">
                    <thead>
                      <tr>
                        <th style="width: 28px;">ت</th>
                        <th style="text-align: right; width: 33%;">المادة الدراسية</th>
                        <th style="width: 65px;">السعي السنوي</th>
                        <th style="width: 70px;">الامتحان النهائي</th>
                        <th style="width: 65px;">الدرجة رقماً</th>
                        <th style="text-align: right; width: 24%;">الدرجة كتابةً (بالحروف)</th>
                        <th style="width: 58px;">التقدير</th>
                        <th style="width: 50px;">النتيجة</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${renderedSubjectRows}
                    </tbody>
                    <tfoot>
                      <tr class="cye-summary-row">
                        <td colspan="4" class="cye-sum-label">المجموع الكلي والمعدل العام:</td>
                        <td class="cye-sum-total font-mono">${metrics.totalScore} / ${metrics.maxTotal}</td>
                        <td class="cye-sum-written font-bold">${metrics.writtenTotal} بالمئة</td>
                        <td class="cye-sum-appreciation">${metrics.overallAppreciation}</td>
                        <td class="cye-sum-status font-bold ${metrics.isPassed ? 'text-success' : 'text-danger'}">${metrics.isPassed ? 'ناجح' : 'مكمل'}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <!-- 4. Decision Banner -->
                <div class="cye-decision-banner ${metrics.isPassed ? 'cye-passed' : 'cye-referred'}">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="cye-dec-badge"><i class="fa-solid fa-award"></i> القرار الرسمي:</span>
                    <span class="cye-dec-text">
                      ${metrics.isPassed ? `تقرر نجاح الطالب (${escapeHtml(student.name)}) وتأهيله إلى (${escapeHtml(nextGrade)}) للعام القادم بنجاح وتفوق.` : `الطالب مكمل في (${metrics.failedCount}) مواد وله الحق بأداء امتحان الدور الثاني.`}
                    </span>
                  </div>
                  <div class="cye-decision-left">
                    <span class="cye-avg-chip"><i class="fa-solid fa-chart-line"></i> المعدل العام: <strong>${metrics.average}%</strong></span>
                    <span class="cye-rank-chip"><i class="fa-solid fa-medal"></i> المرتبة: <strong>${escapeHtml(student.gradeOrRank || 'الأول')}</strong></span>
                  </div>
                </div>

                <!-- 5. Footer Signatures -->
                <footer class="cye-footer-grid">
                  <div class="cye-sig-item">
                    <span class="cye-sig-title">مدرس ومسؤول الصف</span>
                    <span class="cye-sig-person">${escapeHtml(batch.teacherName || 'أستاذ المادة')}</span>
                    <div class="cye-sig-dots">التوقيع: ..........................</div>
                  </div>

                  <div class="cye-sig-item">
                    <span class="cye-sig-title">معاون شؤون الامتحانات</span>
                    <span class="cye-sig-person">رئيس لجنة التدقيق</span>
                    <div class="cye-sig-dots">التوقيع: ..........................</div>
                  </div>

                  <div class="cye-sig-item">
                    <span class="cye-sig-title">مدير المدرسة والمصادقة</span>
                    <span class="cye-sig-person">${escapeHtml(batch.principalName || 'إدارة المدرسة')}</span>
                    <div class="cye-sig-dots">الختم والتوقيع الرسمي</div>
                  </div>
                </footer>

                <!-- 6. Legal & Security Strip -->
                <div class="cye-security-strip" style="justify-content: center; text-align: center;">
                  <span>وثيقة درجات مدرسية رسمية صادرة من منظومة مسار المعلم الرقمية Teacher's Path Iraq 🇮🇶</span>
                </div>

              </div><!-- /.cert-year-end-container -->

            </div>
          </div>
        </div>

      </div>
    `;
  }

  function isGradesModeBatch(batch) {
    if (!batch) return false;
    if (batch.certCategory === 'grades') return true;
    if (batch.certCategory === 'appreciation') return false;
    if (batch.isYearEndMode === true) return true;
    return Boolean(batch.certType && (
      batch.certType.includes('نهاية السنة') || 
      batch.certType.includes('درجات') || 
      batch.certType.includes('وثيقة')
    ));
  }

  function buildCertificateHtml(student, batch, isPrintMode = false, certIndex = 0) {
    if (!student || !batch) return '';

    const currentTmpl = TEMPLATES_CONFIG[batch.templateId] || TEMPLATES_CONFIG.royalGold;
    const isLandscape = (batch.orientation || 'landscape') === 'landscape';

    const isYearEnd = isGradesModeBatch(batch);

    if (isYearEnd) {
      return buildYearEndCertificateHtml(student, batch, currentTmpl, isLandscape, isPrintMode, certIndex);
    }

    // Format tribute text with dynamic replacements
    let tribute = batch.customTributeText || 'نظراً لجهوده وتفوقه الدراسي الباهر وأخلاقه العالية.';
    tribute = tribute
      .replace(/\{اسم_الطالب\}/g, student.name || 'الطالب')
      .replace(/\{المادة\}/g, batch.subject || 'المادة')
      .replace(/\{المدرسة\}/g, batch.schoolName || 'المدرسة')
      .replace(/\{المرتبة\}/g, student.gradeOrRank || 'المتفوق')
      .replace(/\{الدرجة\}/g, student.score ? `${student.score}%` : '')
      .replace(/\{العام_الدراسي\}/g, batch.academicYear || '');

    const honorBadgeText = student.gradeOrRank || 'طالب متميز';
    const scoreBadge = student.score ? `<span class="cert-score-chip"><i class="fa-solid fa-star"></i> المعدل: ${escapeHtml(String(student.score))}%</span>` : '';
    // Note badge removed per user request: "طالب صف ... بمادة ..."
    const noteBadge = '';

    return `
      <div class="certificate-paper ${currentTmpl.themeClass} ${isLandscape ? 'orientation-landscape' : 'orientation-portrait'} ${isPrintMode ? 'is-print-mode' : ''}" id="${isPrintMode ? 'renderedCertPaper_' + certIndex : 'renderedCertPaper'}">
        
        <!-- Ornate Outer Border Frame -->
        <div class="cert-outer-border">
          <div class="cert-inner-border">
            <div class="cert-fine-border">

              <!-- Guilloche Corner Ornaments -->
              <div class="cert-corner corner-top-right"></div>
              <div class="cert-corner corner-top-left"></div>
              <div class="cert-corner corner-bottom-right"></div>
              <div class="cert-corner corner-bottom-left"></div>

              <!-- Top Educational Header -->
              <header class="cert-official-header">
                <div class="cert-header-side cert-header-right">
                  <span class="cert-gov-title">جمهورية العراق</span>
                  <span class="cert-min-title">وزارة التربية والتعليم</span>
                  <span class="cert-dir-title">${escapeHtml(batch.governorate || 'المديرية العامة للتربية')}</span>
                  <span class="cert-school-title">${escapeHtml(batch.schoolName || 'إدارة المدرسة')}</span>
                </div>

                <div class="cert-header-center">
                  <!-- Coat of Arms / Educational Emblem -->
                  <div class="cert-emblem-wrap">
                    <img src="assets/iraq_moe_seal.png" alt="شعار وزارة التربية" class="cert-emblem-img" onerror="this.style.display='none'" />
                    <div class="cert-crest-stars">
                      <i class="fa-solid fa-star"></i>
                      <i class="fa-solid fa-star main-star"></i>
                      <i class="fa-solid fa-star"></i>
                    </div>
                  </div>
                  <h2 class="cert-type-headline">${escapeHtml(batch.certType || 'شهادة شكر وتقدير')}</h2>
                  <div class="cert-motto-ribbon">
                    <span>مَسارُ التَفَوُّقِ والإبْدَاعِ الأكَادِيمِي</span>
                  </div>
                </div>

                <div class="cert-header-side cert-header-left">
                  <span class="cert-meta-item"><strong>العام الدراسي:</strong> ${escapeHtml(batch.academicYear || '-')}</span>
                  <span class="cert-meta-item"><strong>المرحلة:</strong> ${escapeHtml(batch.gradeLevel || '-')}</span>
                  ${batch.section ? `<span class="cert-meta-item"><strong>الشعبة:</strong> ${escapeHtml(batch.section)}</span>` : ''}
                  <span class="cert-meta-item"><strong>المادة:</strong> ${escapeHtml(batch.subject || '-')}</span>
                </div>
              </header>

              <!-- Central Citation / Certificate Body -->
              <main class="cert-content-body">
                <p class="cert-intro-text">
                  تتشرف إدارة المدرسة والكادر التدريسي بمنح هذه الشهادة التقديرية إلى:
                </p>

                <!-- Student Name Spotlight Banner -->
                <div class="cert-student-name-box">
                  <div class="cert-name-wings wing-right"></div>
                  <h1 class="cert-student-name">${escapeHtml(student.name || 'اسم الطالب')}</h1>
                  <div class="cert-name-wings wing-left"></div>
                </div>

                <!-- Honor Rank / Distinction Badge -->
                <div class="cert-rank-strip">
                  <span class="cert-rank-pill"><i class="fa-solid fa-medal"></i> ${escapeHtml(honorBadgeText)}</span>
                  ${scoreBadge}
                </div>

                <!-- Tribute / Commendation Paragraph -->
                <div class="cert-tribute-box">
                  <p class="cert-tribute-text">
                    ${escapeHtml(tribute)}
                  </p>
                </div>
              </main>

              <!-- Footer: Seals, QR Code, Signatures -->
              <footer class="cert-official-footer">
                <!-- Right: Teacher Signature -->
                <div class="cert-sig-box">
                  <span class="cert-sig-role">أستاذ المادة المشرف</span>
                  <span class="cert-sig-name">${escapeHtml(batch.teacherName || 'أستاذ المادة')}</span>
                  <div class="cert-sig-line">
                    <span class="cert-sig-dots">التوقيع: ............................</span>
                  </div>
                </div>

                <!-- Center: Issue Date -->
                <div class="cert-center-stamp-col">
                  <div class="cert-issue-date">
                    <span>تاريخ التحرير: ${escapeHtml(batch.issueDate || '')}</span>
                  </div>
                </div>

                <!-- Left: School Principal & Official Stamp -->
                <div class="cert-sig-box">
                  <span class="cert-sig-role">مدير المدرسة والمصادقة</span>
                  <span class="cert-sig-name">${escapeHtml(batch.principalName || 'إدارة المدرسة')}</span>
                  <div class="cert-sig-line">
                    <span class="cert-sig-dots">الختم والتوقيع الرسمي</span>
                  </div>
                </div>
              </footer>
              <!-- Bottom Watermark -->
              <div class="cert-bottom-bar">
                <span class="cert-platform-credit">منظومة مسار المعلم الرقمية الرسمية • Teacher's Path Iraq 🇮🇶</span>
              </div>

            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderLiveCertificatePreview() {
    const canvasWrap = document.getElementById('certPreviewCanvasWrapper');
    if (!canvasWrap) return;

    if (!activeBatch || !activeBatch.students || activeBatch.students.length === 0) {
      canvasWrap.innerHTML = `
        <div class="cert-empty-preview">
          <div class="cert-empty-icon">
            <i class="fa-solid fa-graduation-cap"></i>
          </div>
          <h3>لا يوجد طلاب في الدفعة الحالية</h3>
          <p>أضف طلاباً يدوياً أو استورد كشف الدرجات من ملف Excel للبدء فوراً بمعاينة الشهادات.</p>
          <div style="display: flex; gap: 10px; margin-top: 1rem; justify-content: center; flex-wrap: wrap;">
            <button type="button" class="btn btn-primary" onclick="window.certAddSingleStudent()">
              <i class="fa-solid fa-plus"></i> إضافة طالب جديد
            </button>
            <button type="button" class="btn btn-accent" onclick="window.certOpenExcelImportModal()">
              <i class="fa-solid fa-file-excel"></i> استيراد ملف Excel
            </button>
          </div>
        </div>
      `;
      updateStudentsCounterPill();
      return;
    }

    if (activeStudentIndex < 0) activeStudentIndex = 0;
    if (activeStudentIndex >= activeBatch.students.length) {
      activeStudentIndex = activeBatch.students.length - 1;
    }

    const currentStudent = activeBatch.students[activeStudentIndex];
    canvasWrap.innerHTML = buildCertificateHtml(currentStudent, activeBatch, false);

    // Apply zoom transform
    const paper = document.getElementById('renderedCertPaper');
    if (paper) {
      paper.style.transform = `scale(${zoomLevel})`;
    }

    updateStudentsCounterPill();
    renderStudentNavigationPills();
  }

  function updateStudentsCounterPill() {
    const total = (activeBatch && activeBatch.students) ? activeBatch.students.length : 0;
    const currentNum = total > 0 ? (activeStudentIndex + 1) : 0;

    const counterText = document.getElementById('certNavCounterText');
    if (counterText) {
      counterText.innerText = `${currentNum} من ${total}`;
    }

    const prevBtn = document.getElementById('certPrevStudentBtn');
    const nextBtn = document.getElementById('certNextStudentBtn');
    if (prevBtn) prevBtn.disabled = activeStudentIndex <= 0;
    if (nextBtn) nextBtn.disabled = activeStudentIndex >= total - 1;

    const batchCountPill = document.getElementById('certBatchStudentCountBadge');
    if (batchCountPill) {
      batchCountPill.innerText = `${total} طالب 🎓`;
    }

    const printAllBtnText = document.getElementById('certPrintAllBtnText');
    if (printAllBtnText) {
      printAllBtnText.innerText = total > 0 ? `طباعة جميع الشهادات (${total} طالب)` : 'طباعة جميع الشهادات';
    }

    const topPrintBtnText = document.getElementById('certTopPrintBtnText');
    if (topPrintBtnText) {
      topPrintBtnText.innerText = total > 0 ? `طباعة جميع الشهادات (${total})` : 'طباعة جميع الشهادات (A4)';
    }
  }

  function renderStudentNavigationPills() {
    const listContainer = document.getElementById('certStudentsFastPills');
    if (!listContainer || !activeBatch || !activeBatch.students) return;

    listContainer.innerHTML = activeBatch.students.map((s, idx) => {
      const isActive = idx === activeStudentIndex;
      return `
        <button type="button" class="cert-student-nav-pill ${isActive ? 'active' : ''}" onclick="window.certGoToStudent(${idx})" title="${escapeHtml(s.name)} - ${escapeHtml(s.gradeOrRank || '')}">
          <span class="pill-idx">${idx + 1}</span>
          <span class="pill-name">${escapeHtml(s.name || 'طالب')}</span>
          ${s.score ? `<span class="pill-score">${s.score}%</span>` : ''}
        </button>
      `;
    }).join('');
  }

  let studentTableFilterQuery = '';

  window.certFilterStudentsTable = function(val) {
    studentTableFilterQuery = val || '';
    renderStudentsManagerTable();
  };

  function renderStudentsManagerTable() {
    const tbody = document.getElementById('certStudentsManagerTableBody');
    const thead = document.getElementById('certStudentsTableHead');
    if (!tbody || !activeBatch || !activeBatch.students) return;

    const isGrades = isGradesModeActive();

    // 1. Update Title & Subtitle based on active category
    const titleEl = document.getElementById('certTableHeaderTitle');
    const subtitleEl = document.getElementById('certTableHeaderSubtitle');
    if (titleEl) {
      titleEl.innerHTML = isGrades
        ? '<i class="fa-solid fa-graduation-cap text-primary"></i> سجل وثائق وكشوفات درجات نهاية السنة الرسمية'
        : '<i class="fa-solid fa-award text-gold"></i> سجل وطلاب التكريم والتفوق (الشهادات التقديرية)';
    }
    if (subtitleEl) {
      subtitleEl.textContent = isGrades
        ? 'إدارة الأرقام الامتحانية وكشوفات درجات السعي والامتحان النهائي والمجموع العام والقرار والنتيجة'
        : 'تحرير رتب التكريم والشرف والمعدل ومعاينة وطباعة شهادات التقدير الفاخرة لكل طالب';
    }

    // 2. Update Counter Badge
    const countText = document.getElementById('certStudentsCountText');
    if (countText) {
      countText.textContent = `${activeBatch.students.length} طالباً مسجلاً`;
    }

    // 3. Render Table Head dynamically
    if (thead) {
      if (isGrades) {
        thead.innerHTML = `
          <tr>
            <th style="width: 48px; text-align: center;">ت</th>
            <th style="width: 140px;"><i class="fa-solid fa-id-card text-primary"></i> الرقم الامتحاني</th>
            <th><i class="fa-solid fa-user-graduate text-primary"></i> اسم الطالب الرباعي الرسمي</th>
            <th style="width: 115px; text-align: center;"><i class="fa-solid fa-calculator text-primary"></i> المجموع</th>
            <th style="width: 95px; text-align: center;"><i class="fa-solid fa-percent text-primary"></i> المعدل</th>
            <th style="width: 110px; text-align: center;"><i class="fa-solid fa-clipboard-check text-primary"></i> النتيجة</th>
            <th style="width: 185px; text-align: center;"><i class="fa-solid fa-table-list text-primary"></i> كشف المواد والدرجات</th>
            <th style="width: 145px; text-align: center;"><i class="fa-solid fa-sliders"></i> إجراءات</th>
          </tr>
        `;
      } else {
        thead.innerHTML = `
          <tr>
            <th style="width: 48px; text-align: center;">ت</th>
            <th><i class="fa-solid fa-user-graduate text-gold"></i> اسم الطالب الرباعي الرسمي</th>
            <th style="width: 220px;"><i class="fa-solid fa-award text-gold"></i> المرتبة / التقدير</th>
            <th style="width: 130px; text-align: center;"><i class="fa-solid fa-chart-simple text-gold"></i> المعدل %</th>
            <th style="width: 155px; text-align: center;"><i class="fa-solid fa-sliders"></i> إجراءات</th>
          </tr>
        `;
      }
    }

    // Empty state
    const colSpan = isGrades ? 8 : 5;
    if (activeBatch.students.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="${colSpan}" style="text-align: center; padding: 3rem 1rem; color: #64748b;">
            <div style="font-size: 2.2rem; color: #f59e0b; margin-bottom: 0.5rem;"><i class="fa-solid fa-user-slash"></i></div>
            <div style="font-weight: 800; font-size: 1.05rem; color: #0f172a;">لا يوجد طلاب حالياً في هذه الدفعة</div>
            <p style="margin-top: 4px; font-size: 0.85rem;">استخدم زر «إضافة طالب جديد» بالأعلى أو استورد الأسماء مباشرة من ملف Excel.</p>
          </td>
        </tr>
      `;
      return;
    }

    const q = (studentTableFilterQuery || '').trim().toLowerCase();

    // 4. Render Rows according to category
    const rowsHtml = activeBatch.students.map((s, idx) => {
      if (q) {
        const matchName = (s.name || '').toLowerCase().includes(q);
        const matchRank = (s.gradeOrRank || '').toLowerCase().includes(q);
        const matchSeat = (s.seatNumber || '').toLowerCase().includes(q);
        if (!matchName && !matchRank && !matchSeat) {
          return '';
        }
      }

      const isSelected = idx === activeStudentIndex;

      if (isGrades) {
        // Mode 2: كشوفات ووثائق درجات نهاية السنة
        const metrics = calculateStudentSubjectsMetrics(s);
        const seatVal = s.seatNumber || `10${String(idx + 1).padStart(3, '0')}`;

        return `
          <tr class="${isSelected ? 'active-preview-row' : ''}">
            <td style="text-align: center; width: 48px;">
              <div class="cert-row-idx">${idx + 1}</div>
            </td>
            <td style="width: 140px;">
              <div class="cert-field-wrap">
                <input type="text" class="cert-modern-input cert-input-seat" value="${escapeHtml(seatVal)}" 
                  onchange="window.certUpdateStudentField(${idx}, 'seatNumber', this.value)" placeholder="الرقم الامتحاني..." />
                <i class="fa-solid fa-id-badge cert-field-icon text-primary"></i>
              </div>
            </td>
            <td>
              <div class="cert-field-wrap">
                <input type="text" class="cert-modern-input cert-input-name" value="${escapeHtml(s.name || '')}" 
                  onchange="window.certUpdateStudentField(${idx}, 'name', this.value)" placeholder="اسم الطالب الرباعي..." />
                <i class="fa-solid fa-user-pen cert-field-icon"></i>
              </div>
            </td>
            <td style="text-align: center; width: 115px;">
              <span class="badge-total-score"><strong>${metrics.totalScore}</strong> <small>/ ${metrics.maxTotal}</small></span>
            </td>
            <td style="text-align: center; width: 95px;">
              <span class="badge-avg-score ${metrics.average >= 50 ? 'pass' : 'fail'}">${metrics.average}%</span>
            </td>
            <td style="text-align: center; width: 110px;">
              ${metrics.isPassed 
                ? '<span class="cye-badge-pass"><i class="fa-solid fa-circle-check"></i> ناجح</span>' 
                : `<span class="cye-badge-fail"><i class="fa-solid fa-circle-xmark"></i> مكمل (${metrics.failedCount})</span>`}
            </td>
            <td style="text-align: center; width: 185px;">
              <button type="button" class="btn-cert-table-grades-pill" onclick="window.certOpenStudentGradesModal(${idx})" title="تعديل درجات ومواد هذا الطالب">
                <i class="fa-solid fa-graduation-cap text-primary"></i>
                <span>كشف الدرجات (${metrics.rows.length} مواد)</span>
              </button>
            </td>
            <td style="text-align: center; width: 145px; white-space: nowrap;">
              <div class="cert-actions-pill-group">
                <button type="button" class="cert-btn-act act-preview" onclick="window.certGoToStudent(${idx})" title="معاينة وثيقة الدرجات الحية 👁️">
                  <i class="fa-solid fa-eye"></i>
                </button>
                <button type="button" class="cert-btn-act act-print" onclick="window.certPrintSingleIndex(${idx})" title="طباعة وثيقة هذا الطالب (A4) 🖨️">
                  <i class="fa-solid fa-print"></i>
                </button>
                <button type="button" class="cert-btn-act act-delete" onclick="window.certDeleteStudent(${idx})" title="حذف الطالب من الدفعة 🗑️">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      } else {
        // Mode 1: شهادات التقدير والتفوق
        const numScore = Number(s.score) || 0;
        let scoreTier = 'score-tier-pass';
        if (numScore >= 90) scoreTier = 'score-tier-high';
        else if (numScore >= 75) scoreTier = 'score-tier-good';
        else if (numScore < 50 && numScore > 0) scoreTier = 'score-tier-low';

        return `
          <tr class="${isSelected ? 'active-preview-row' : ''}">
            <td style="text-align: center; width: 48px;">
              <div class="cert-row-idx">${idx + 1}</div>
            </td>
            <td>
              <div class="cert-field-wrap">
                <input type="text" class="cert-modern-input cert-input-name" value="${escapeHtml(s.name || '')}" 
                  onchange="window.certUpdateStudentField(${idx}, 'name', this.value)" placeholder="اسم الطالب الرباعي..." />
                <i class="fa-solid fa-user-pen cert-field-icon"></i>
              </div>
            </td>
            <td style="width: 220px;">
              <div class="cert-field-wrap">
                <input type="text" class="cert-modern-input cert-input-rank" value="${escapeHtml(s.gradeOrRank || '')}" 
                  onchange="window.certUpdateStudentField(${idx}, 'gradeOrRank', this.value)" placeholder="المرتبة / التقدير..." />
                <i class="fa-solid fa-award cert-field-icon" style="color: #d97706;"></i>
              </div>
            </td>
            <td style="width: 130px;">
              <div class="cert-score-wrap">
                <input type="number" min="0" max="100" class="cert-score-input ${scoreTier}" value="${escapeHtml(String(s.score || ''))}" 
                  onchange="window.certUpdateStudentField(${idx}, 'score', this.value)" placeholder="100" />
                <span class="cert-score-pct">%</span>
              </div>
            </td>
            <td style="text-align: center; width: 155px; white-space: nowrap;">
              <div class="cert-actions-pill-group">
                <button type="button" class="cert-btn-act act-preview" onclick="window.certGoToStudent(${idx})" title="معاينة الشهادة التقديرية الحية 👁️">
                  <i class="fa-solid fa-eye"></i>
                </button>
                <button type="button" class="cert-btn-act act-print" onclick="window.certPrintSingleIndex(${idx})" title="طباعة شهادة التقدير لهذا الطالب (A4) 🖨️">
                  <i class="fa-solid fa-print"></i>
                </button>
                <button type="button" class="cert-btn-act act-delete" onclick="window.certDeleteStudent(${idx})" title="حذف الطالب من الدفعة 🗑️">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }
    }).join('');

    tbody.innerHTML = rowsHtml || `
      <tr>
        <td colspan="${colSpan}" style="text-align: center; padding: 2rem; color: #64748b;">
          لا توجد نتائج مطابقة لبحثك: «<strong>${escapeHtml(q)}</strong>».
        </td>
      </tr>
    `;
  }

  // 9. Interactive Controls
  window.certGoToStudent = function(index) {
    if (!activeBatch || !activeBatch.students) return;
    if (index >= 0 && index < activeBatch.students.length) {
      activeStudentIndex = index;
      renderLiveCertificatePreview();
      renderStudentsManagerTable();
    }
  };
  window.certSelectStudent = window.certGoToStudent;

  window.certPrevStudent = function() {
    if (activeStudentIndex > 0) {
      window.certGoToStudent(activeStudentIndex - 1);
    }
  };

  window.certNextStudent = function() {
    if (activeBatch && activeBatch.students && activeStudentIndex < activeBatch.students.length - 1) {
      window.certGoToStudent(activeStudentIndex + 1);
    }
  };

  window.certZoomIn = function() {
    zoomLevel = Math.min(1.4, zoomLevel + 0.1);
    applyZoom();
  };

  window.certZoomOut = function() {
    zoomLevel = Math.max(0.65, zoomLevel - 0.1);
    applyZoom();
  };

  window.certZoomReset = function() {
    zoomLevel = 1.0;
    applyZoom();
  };

  function applyZoom() {
    const paper = document.getElementById('renderedCertPaper');
    if (paper) paper.style.transform = `scale(${zoomLevel})`;
    const zoomText = document.getElementById('certZoomPercentText');
    if (zoomText) zoomText.innerText = `${Math.round(zoomLevel * 100)}%`;
  }

  window.certZoomFit = function() {
    const wrap = document.getElementById('certPreviewCanvasWrapper');
    if (wrap) {
      const containerWidth = wrap.clientWidth || 900;
      zoomLevel = Math.min(1.0, Math.max(0.55, (containerWidth - 40) / 1150));
      applyZoom();
    }
  };

  // 9. Preview Drawer Controller (Collapsible - user opens and closes on demand)
  let isCertPreviewOpen = true;

  window.certTogglePreview = function() {
    window.certSetPreviewOpen(!isCertPreviewOpen);
  };

  window.certOpenPreview = function() {
    window.certSetPreviewOpen(true);
  };

  window.certClosePreview = function() {
    window.certSetPreviewOpen(false);
  };

  window.certSetPreviewOpen = function(open) {
    isCertPreviewOpen = !!open;
    const section = document.getElementById('certPreviewCollapsibleSection');
    const heroBtnText = document.getElementById('certHeroPreviewBtnText');
    const topBtnLabel = document.getElementById('certTopPreviewBtnLabel');
    const topBtn = document.getElementById('certTopPreviewBtn');

    if (section) {
      section.style.display = isCertPreviewOpen ? 'flex' : 'none';
      if (isCertPreviewOpen) {
        renderLiveCertificatePreview();
      }
    }

    if (heroBtnText) {
      heroBtnText.innerText = isCertPreviewOpen ? 'إغلاق ورقة المعاينة ✖️' : 'معاينة ورقة الشهادة A4';
    }

    if (topBtnLabel) {
      topBtnLabel.innerText = isCertPreviewOpen ? 'إغلاق المعاينة' : 'معاينة ورقة الشهادة';
    }

    if (topBtn) {
      topBtn.classList.toggle('active', isCertPreviewOpen);
    }
  };

  window.certSelectTemplate = function(templateId) {
    if (!activeBatch) return;
    activeBatch.templateId = templateId;
    document.querySelectorAll('.cert-template-pill').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-template') === templateId);
    });
    if (!isCertPreviewOpen) {
      window.certSetPreviewOpen(true);
    } else {
      renderLiveCertificatePreview();
    }
    triggerAutoSave();
  };

  window.certGetActiveBatch = function() {
    return activeBatch;
  };

  window.certGetOrientation = function() {
    return (activeBatch && activeBatch.orientation) || (document.getElementById('certOrientationSelect')?.value) || 'landscape';
  };

  window.certUpdateMetaField = function(fieldName, value) {
    if (!activeBatch) return;
    activeBatch[fieldName] = value;
    if (fieldName === 'orientation' && typeof window.setDynamicPrintPage === 'function') {
      window.setDynamicPrintPage(value === 'portrait' ? 'portrait' : 'landscape', '0', 'A4');
    }
    renderLiveCertificatePreview();
    triggerAutoSave();
  };

  window.certSetTypeQuick = function(typeName) {
    const el = document.getElementById('certTypeSelect');
    if (el) {
      el.value = typeName;
    }
    window.certUpdateMetaField('certType', typeName);
  };

  window.certUpdateStudentField = function(studentIndex, field, value) {
    if (!activeBatch || !activeBatch.students || !activeBatch.students[studentIndex]) return;
    activeBatch.students[studentIndex][field] = value;
    if (studentIndex === activeStudentIndex) {
      renderLiveCertificatePreview();
    }
    triggerAutoSave();
  };

  window.certAddSingleStudent = function() {
    if (!activeBatch) return;
    if (!Array.isArray(activeBatch.students)) activeBatch.students = [];
    const newIdx = activeBatch.students.length + 1;
    activeBatch.students.push({
      id: 'cs_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      name: `طالب جديد (${newIdx})`,
      gradeOrRank: 'متفوق',
      score: '95',
      customNote: 'تقدير امتياز'
    });
    activeStudentIndex = activeBatch.students.length - 1;
    renderLiveCertificatePreview();
    renderStudentsManagerTable();
    triggerAutoSave();
    if (typeof window.showToast === 'function') {
      window.showToast('تمت إضافة طالب جديد للدفعة بنجاح 🎓', 'success');
    }
  };

  window.certDeleteStudent = function(index) {
    if (!activeBatch || !activeBatch.students || !activeBatch.students[index]) return;
    const name = activeBatch.students[index].name;
    if (!confirm(`هل أنت متأكد من حذف الطالب (${name}) من قائمة الشهادات؟`)) return;

    activeBatch.students.splice(index, 1);
    if (activeStudentIndex >= activeBatch.students.length) {
      activeStudentIndex = Math.max(0, activeBatch.students.length - 1);
    }
    renderLiveCertificatePreview();
    renderStudentsManagerTable();
    triggerAutoSave();
    if (typeof window.showToast === 'function') {
      window.showToast('تم حذف الطالب بنجاح 🗑️', 'info');
    }
  };

  window.certClearCurrentStudents = function() {
    if (!activeBatch || !activeBatch.students || activeBatch.students.length === 0) {
      if (typeof window.showToast === 'function') window.showToast('قائمة الطلاب والشهادات فارغة بالفعل!', 'info');
      return;
    }
    const count = activeBatch.students.length;
    if (!confirm(`هل أنت متأكد من تفريغ ومسح جميع شهادات وبيانات الطلاب (${count} طالب) المفتوحة في استوديو الشهادات؟\nسيتم تفريغ القائمة للبدء بدفعة جديدة.`)) return;
    activeBatch.students = [];
    activeStudentIndex = 0;
    renderLiveCertificatePreview();
    renderStudentsManagerTable();
    triggerAutoSave();
    if (typeof window.showToast === 'function') {
      window.showToast('تم تفريغ قائمة شهادات الطلاب بنجاح 🗑️', 'info');
    }
  };
  window.certClearAllOpenData = window.certClearCurrentStudents;

  // 10. Arabic Alphabetical Sorting
  function getArabicSortKey(str) {
    if (!str) return '';
    return String(str)
      .trim()
      .replace(/[\u064B-\u065F\u0670]/g, '')
      .replace(/[^\u0621-\u064A\s]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[\s\t]+/g, ' ')
      .trim();
  }

  window.certSortAlphabetically = function() {
    if (!activeBatch || !activeBatch.students || activeBatch.students.length === 0) {
      if (typeof window.showToast === 'function') window.showToast('لا يوجد طلاب للترتيب!', 'warning');
      return;
    }
    const collator = new Intl.Collator('ar', { sensitivity: 'base', numeric: true });
    activeBatch.students.sort((a, b) => {
      const keyA = getArabicSortKey(a.name);
      const keyB = getArabicSortKey(b.name);
      const cmp = collator.compare(keyA, keyB);
      if (cmp !== 0) return cmp;
      return (a.name || '').localeCompare(b.name || '', 'ar');
    });

    renderLiveCertificatePreview();
    renderStudentsManagerTable();
    triggerAutoSave();
    if (typeof window.showToast === 'function') {
      window.showToast('تم ترتيب أسماء الطلبة أبجدياً (أ - ي) بالكامل بنجاح 🔤✅', 'success');
    }
  };

  // 11. Excel Import System
  window.certOpenExcelImportModal = function() {
    pendingImportStudents = [];
    const modal = document.getElementById('certExcelImportModal');
    if (modal) {
      modal.classList.add('open');
      const input = document.getElementById('certExcelFileInput');
      if (input) input.value = '';
      const previewSec = document.getElementById('certExcelPreviewSection');
      if (previewSec) previewSec.style.display = 'none';
      const confirmBtn = document.getElementById('certBtnConfirmImport');
      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = '0.5';
      }
    }
  };

  window.certCloseExcelImportModal = function() {
    const modal = document.getElementById('certExcelImportModal');
    if (modal) modal.classList.remove('open');
  };

  window.certOnExcelFileSelected = function(input) {
    if (input && input.files && input.files.length > 0) {
      processCertExcelFile(input.files[0]);
    }
  };

  window.certOnDropExcel = function(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('certExcelDropzone');
    if (dropzone) dropzone.classList.remove('dragover');
    const files = e.dataTransfer ? e.dataTransfer.files : null;
    if (files && files.length > 0) {
      processCertExcelFile(files[0]);
    }
  };

  window.certOnDragOver = function(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('certExcelDropzone');
    if (dropzone) dropzone.classList.add('dragover');
  };

  window.certOnDragLeave = function(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('certExcelDropzone');
    if (dropzone) dropzone.classList.remove('dragover');
  };

  function processCertExcelFile(file) {
    if (!file) return;
    const fileName = file.name || '';
    const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();

    if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
      if (typeof window.showToast === 'function') {
        window.showToast('يرجى اختيار ملف Excel بصيغة (.xlsx, .xls) أو CSV!', 'warning');
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        let rows = [];
        if (typeof XLSX !== 'undefined') {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
        } else {
          throw new Error('مكتبة قراءة ملفات Excel غير محملة');
        }

        extractCertStudentsFromRows(rows, fileName);
      } catch (err) {
        console.error('processCertExcelFile error:', err);
        if (typeof window.showToast === 'function') {
          window.showToast(`خطأ في قراءة ملف الإكسل: ${err.message}`, 'error');
        }
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function extractCertStudentsFromRows(rows, fileName) {
    if (!Array.isArray(rows) || rows.length === 0) {
      if (typeof window.showToast === 'function') window.showToast('ملف الإكسل فارغ!', 'warning');
      return;
    }

    // Identify header row
    let headerIdx = -1;
    let nameCol = -1;
    let rankCol = -1;
    let scoreCol = -1;
    let noteCol = -1;

    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const row = rows[i].map(c => String(c || '').trim().toLowerCase());
      for (let j = 0; j < row.length; j++) {
        const val = row[j];
        if (val.includes('اسم') || val.includes('طالب') || val.includes('name')) nameCol = j;
        if (val.includes('مرتبة') || val.includes('ترتيب') || val.includes('تقدير') || val.includes('rank')) rankCol = j;
        if (val.includes('درجة') || val.includes('معدل') || val.includes('سعي') || val.includes('score') || val.includes('grade')) scoreCol = j;
        if (val.includes('ملاحظ') || val.includes('شكر') || val.includes('note')) noteCol = j;
      }
      if (nameCol !== -1) {
        headerIdx = i;
        break;
      }
    }

    // Fallback if no header explicitly detected: assuming col 0 or 1 is name
    if (nameCol === -1) {
      nameCol = 0;
      headerIdx = 0;
    }

    pendingImportStudents = [];
    const startRow = headerIdx + 1;

    for (let r = startRow; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;
      const rawName = String(row[nameCol] || '').trim();
      // Skip numeric IDs or empty strings
      if (!rawName || /^[\d\s\-_.,]+$/.test(rawName) || rawName.length < 2) continue;

      const rank = rankCol !== -1 ? String(row[rankCol] || '').trim() : 'متفوق';
      const score = scoreCol !== -1 ? String(row[scoreCol] || '').trim() : '';
      const note = noteCol !== -1 ? String(row[noteCol] || '').trim() : '';

      pendingImportStudents.push({
        id: 'cs_imp_' + Date.now() + '_' + r,
        name: rawName,
        gradeOrRank: rank || (score && Number(score) >= 90 ? 'امتياز' : 'متفوق'),
        score: score,
        customNote: note
      });
    }

    if (pendingImportStudents.length === 0) {
      if (typeof window.showToast === 'function') {
        window.showToast('لم يتم العثور على أسماء طلاب صالحة في ملف الإكسل!', 'warning');
      }
      return;
    }

    // Render Preview Table in Modal
    const previewSec = document.getElementById('certExcelPreviewSection');
    const previewBody = document.getElementById('certExcelPreviewTableBody');
    const previewCount = document.getElementById('certExcelFoundCountText');
    const confirmBtn = document.getElementById('certBtnConfirmImport');

    if (previewCount) previewCount.innerText = `تم استخراج ${pendingImportStudents.length} طالباً بنجاح من (${fileName})`;
    if (previewBody) {
      previewBody.innerHTML = pendingImportStudents.slice(0, 50).map((s, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><strong>${escapeHtml(s.name)}</strong></td>
          <td>${escapeHtml(s.gradeOrRank || '-')}</td>
          <td>${escapeHtml(s.score || '-')}</td>
          <td>${escapeHtml(s.customNote || '-')}</td>
        </tr>
      `).join('') + (pendingImportStudents.length > 50 ? `<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">... و ${pendingImportStudents.length - 50} طالباً إضافياً</td></tr>` : '');
    }

    if (previewSec) previewSec.style.display = 'block';
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.style.opacity = '1';
    }
  }

  window.certConfirmImport = function() {
    if (!activeBatch || pendingImportStudents.length === 0) return;

    const modeRadio = document.querySelector('input[name="certImportMode"]:checked');
    const isReplace = modeRadio ? modeRadio.value === 'replace' : true;

    if (isReplace) {
      activeBatch.students = [...pendingImportStudents];
    } else {
      activeBatch.students.push(...pendingImportStudents);
    }

    activeStudentIndex = 0;
    renderLiveCertificatePreview();
    renderStudentsManagerTable();
    window.certCloseExcelImportModal();
    triggerAutoSave();

    if (typeof window.showToast === 'function') {
      window.showToast(`🎉 تم استيراد ${pendingImportStudents.length} شهادة طالب من الإكسل بنجاح!`, 'success');
    }
  };

  // 12. Download Sample Excel Template
  window.certDownloadSampleExcel = function() {
    if (typeof XLSX === 'undefined') {
      if (typeof window.showToast === 'function') window.showToast('مكتبة الإكسل غير جاهزة!', 'error');
      return;
    }

    const sampleRows = [
      ['ت', 'اسم الطالب الرباعي', 'المرتبة / التقدير', 'المعدل العام %', 'ملاحظة خاصة بالشهادة'],
      [1, 'أحمد علي حسن الشمري', 'المرتبة الأولى', 99, 'الأول على مرحلة الثالث المتوسط'],
      [2, 'محمد حسين خليل العبيدي', 'المرتبة الثانية', 97, 'حاصل على المركز الثاني بتفوق باهر'],
      [3, 'زين العابدين حيدر الجبوري', 'المرتبة الثالثة', 95, 'تقدير امتياز مع مرتبة الشرف'],
      [4, 'حسين مصطفى كامل الزيدي', 'متفوق', 92, 'تميز استثنائي في مادة الرياضيات'],
      [5, 'كرار باسم عبد الرضا الخفاجي', 'متفوق', 90, 'أخلاق وسلوك مثالي ومواظبة تامة']
    ];

    const ws = XLSX.utils.aoa_to_sheet(sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'كشف شهادات الطلبة');
    XLSX.writeFile(wb, 'نموذج_استيراد_شهادات_الطلبة_مسار_المعلم.xlsx');

    if (typeof window.showToast === 'function') {
      window.showToast('تم تحميل نموذج الإكسل الرسمي الجاهز للتعبئة بنجاح 📥📊', 'success');
    }
  };

  // 13. Import Directly From Active Grade Ledger (سجل الدرجات)
  window.certImportFromGradesLedger = function(filterMode = 'all') {
    if (typeof window.StudentGradesModule === 'undefined' || typeof window.StudentGradesModule.getActiveRoster !== 'function') {
      if (typeof window.showToast === 'function') window.showToast('تطبيق سجل الدرجات غير متاح حالياً!', 'warning');
      return;
    }

    const roster = window.StudentGradesModule.getActiveRoster();
    if (!roster || !roster.students || roster.students.length === 0) {
      if (typeof window.showToast === 'function') window.showToast('لا توجد بيانات طلاب في سجل الدرجات النشط لاستيرادها!', 'warning');
      return;
    }

    let sourceList = roster.students.map(s => {
      // Calculate final score if exists
      const finalVal = s.finalExam != null && s.finalExam !== '' ? Number(s.finalExam) : null;
      const m1Val = s.m1Exam != null && s.m1Exam !== '' ? Number(s.m1Exam) : null;
      const score = finalVal !== null ? finalVal : (m1Val !== null ? m1Val : null);
      return {
        name: s.name || '',
        score: score
      };
    }).filter(s => s.name.trim().length > 0);

    // Sort descending by score
    sourceList.sort((a, b) => (b.score || 0) - (a.score || 0));

    if (filterMode === 'top3') {
      sourceList = sourceList.slice(0, 3);
    } else if (filterMode === 'top10') {
      sourceList = sourceList.slice(0, 10);
    } else if (filterMode === 'honors') {
      sourceList = sourceList.filter(s => s.score !== null && s.score >= 85);
    }

    if (sourceList.length === 0) {
      if (typeof window.showToast === 'function') window.showToast('لم يتم العثور على درجات مطابقة للشرط المختار!', 'info');
      return;
    }

    activeBatch.students = sourceList.map((s, idx) => {
      let rank = 'متفوق';
      if (idx === 0) rank = 'المرتبة الأولى 🥇';
      else if (idx === 1) rank = 'المرتبة الثانية 🥈';
      else if (idx === 2) rank = 'المرتبة الثالثة 🥉';
      else if (s.score && s.score >= 90) rank = 'امتياز 🌟';
      else if (s.score && s.score >= 80) rank = 'جيد جداً ✨';

      return {
        id: 'cs_ledger_' + Date.now() + '_' + idx,
        name: s.name,
        gradeOrRank: rank,
        score: s.score ? String(s.score) : '',
        customNote: ''
      };
    });

    // Also auto-sync metadata from roster
    if (roster.schoolName) activeBatch.schoolName = roster.schoolName;
    if (roster.subject) activeBatch.subject = roster.subject;
    if (roster.teacherName) activeBatch.teacherName = roster.teacherName;
    if (roster.gradeLevel) activeBatch.gradeLevel = roster.gradeLevel;
    if (roster.section) activeBatch.section = roster.section;
    if (roster.academicYear) activeBatch.academicYear = roster.academicYear;

    renderBatchMetaForm();
    activeStudentIndex = 0;
    renderLiveCertificatePreview();
    renderStudentsManagerTable();
    triggerAutoSave();

    if (typeof window.showToast === 'function') {
      window.showToast(`🎉 تم استيراد ${activeBatch.students.length} طالباً مباشرة من سجل الدرجات بنجاح!`, 'success');
    }
  };

  // 14. Batch Pasting Modal
  window.certOpenBatchPasteModal = function() {
    const modal = document.getElementById('certBatchPasteModal');
    if (modal) {
      modal.classList.add('open');
      const ta = document.getElementById('certBatchPasteTextarea');
      if (ta) {
        ta.value = '';
        ta.focus();
      }
    }
  };

  window.certCloseBatchPasteModal = function() {
    const modal = document.getElementById('certBatchPasteModal');
    if (modal) modal.classList.remove('open');
  };

  window.certConfirmBatchPaste = function() {
    const ta = document.getElementById('certBatchPasteTextarea');
    if (!ta) return;
    const text = ta.value || '';
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

    if (lines.length === 0) {
      if (typeof window.showToast === 'function') window.showToast('يرجى لصق قائمة بأسماء الطلاب أولاً!', 'warning');
      return;
    }

    const newStudents = lines.map((line, idx) => {
      // Split by tab or comma if present (Name [tab] Rank [tab] Score)
      const parts = line.split(/[\t,;]+/).map(p => p.trim());
      const name = parts[0].replace(/^\d+[\.\-\s)]+/, '').trim(); // clean leading numbers
      const rank = parts[1] || 'متفوق';
      const score = parts[2] || '';
      return {
        id: 'cs_paste_' + Date.now() + '_' + idx,
        name: name,
        gradeOrRank: rank,
        score: score,
        customNote: ''
      };
    }).filter(s => s.name.length > 0);

    if (newStudents.length === 0) return;

    if (!activeBatch.students) activeBatch.students = [];
    activeBatch.students.push(...newStudents);

    activeStudentIndex = 0;
    renderLiveCertificatePreview();
    renderStudentsManagerTable();
    window.certCloseBatchPasteModal();
    triggerAutoSave();

    if (typeof window.showToast === 'function') {
      window.showToast(`تمت إضافة ${newStudents.length} طالباً بنجاح من القائمة المنسوخة 📋`, 'success');
    }
  };

  // 15. Single Certificate Printing
  window.certPrintCurrent = function() {
    if (!activeBatch || !activeBatch.students || !activeBatch.students[activeStudentIndex]) {
      if (typeof window.showToast === 'function') window.showToast('لا توجد شهادة للمعاينة والطباعة!', 'warning');
      return;
    }
    if (typeof window.showToast === 'function') {
      window.showToast('جاري فتح نافذة الطباعة فوراً... ⚡', 'info', 1400);
    }
    const student = activeBatch.students[activeStudentIndex];
    printCertificates([student], activeBatch);
  };

  window.certPrintSingleIndex = function(index) {
    if (!activeBatch || !activeBatch.students || !activeBatch.students[index]) return;
    if (typeof window.showToast === 'function') {
      window.showToast('جاري فتح نافذة الطباعة فوراً... ⚡', 'info', 1400);
    }
    const student = activeBatch.students[index];
    printCertificates([student], activeBatch);
  };

  // Direct PDF Download for Single Certificate
  window.certExportSinglePdf = async function(index) {
    const idx = (typeof index === 'number') ? index : activeStudentIndex;
    if (!activeBatch || !activeBatch.students || !activeBatch.students[idx]) {
      if (typeof window.showToast === 'function') window.showToast('لا توجد شهادة محددة لتنزيلها كـ PDF!', 'warning');
      return;
    }
    const student = activeBatch.students[idx];
    const studentName = (student.name || 'طالب').replace(/[/\\?%*:|"<>]/g, '-').trim();
    const filename = `شهادة-${studentName}.pdf`;

    const tempHost = document.createElement('div');
    tempHost.style.cssText = 'position: fixed; left: -9999px; top: 0; width: 794px; min-height: 1120px; background: #ffffff; z-index: -9999;';
    tempHost.innerHTML = typeof generateCertificateHTML === 'function' ? generateCertificateHTML(student, activeBatch, 0, 1) : '';
    document.body.appendChild(tempHost);

    try {
      if (typeof window.exportToPDF === 'function') {
        await window.exportToPDF(tempHost, {
          filename: filename,
          format: 'a4',
          orientation: (activeBatch.orientation || 'portrait'),
          margin: 0,
          scale: 2
        });
      }
    } catch (e) {
      console.error('certExportSinglePdf error:', e);
    } finally {
      if (tempHost.parentNode) tempHost.remove();
    }
  };

  window.certExportCurrentSinglePdf = async function() {
    return await window.certExportSinglePdf(activeStudentIndex);
  };

  // 16. Batch Print All Certificates (كل شهادة في صفحة A4 منفصلة)
  window.certPrintAllBatch = function() {
    if (!activeBatch || !activeBatch.students || activeBatch.students.length === 0) {
      if (typeof window.showToast === 'function') window.showToast('لا توجد شهادات للطباعة الجماعية!', 'warning');
      return;
    }
    if (typeof window.showToast === 'function') {
      window.showToast('جاري فتح نافذة طباعة جميع الشهادات فوراً... ⚡', 'info', 1400);
    }
    printCertificates(activeBatch.students, activeBatch);
  };

  window.executeCertificatesBatchPdf = async function(options) {
    options = options || {};
    if (!activeBatch || !activeBatch.students || activeBatch.students.length === 0) {
      if (typeof window.showToast === 'function') window.showToast('لا توجد شهادات لتصدير وتنزيل ملف PDF!', 'warning');
      return;
    }

    const totalStudents = activeBatch.students.length;
    const isLandscape = (activeBatch.orientation || 'landscape') === 'landscape';
    const isYearEnd = isGradesModeBatch(activeBatch);
    const rawTitle = activeBatch.title || activeBatch.subject || (isYearEnd ? 'شهادات_درجات_نهاية_السنة' : 'شهادات_تقديرية');
    const safeTitle = rawTitle.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'شهادات_الطلاب';
    const defaultBatchFilename = `${safeTitle}_(${totalStudents}_طالب).pdf`;
    const filename = (options && options.path) ? options.path : defaultBatchFilename;

    // 1. Show interactive progress overlay
    const overlay = document.createElement('div');
    overlay.id = 'certDirectPdfExportOverlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 99999999; background: rgba(15, 23, 42, 0.88); backdrop-filter: blur(8px); display: flex; flex-direction: column; align-items: center; justify-content: center; color: #ffffff; font-family: "Cairo", sans-serif;';
    overlay.innerHTML = `
      <div style="position: relative; text-align: center; background: rgba(30, 41, 59, 0.98); padding: 2.2rem 2.4rem; border-radius: 20px; border: 1.5px solid rgba(245, 158, 11, 0.4); box-shadow: 0 25px 60px rgba(0,0,0,0.7); max-width: 460px; width: 90%;">
        <div style="font-size: 2.8rem; color: #f59e0b; margin-bottom: 0.8rem;">
          <i class="fa-solid fa-file-pdf fa-bounce"></i>
        </div>
        <h3 style="margin: 0; font-size: 1.25rem; font-weight: 800; color: #ffffff;">جاري تجميع وحفظ ملف PDF... 📥📄</h3>
        <p style="margin: 0.6rem 0 0; color: #cbd5e1; font-size: 0.88rem;">يتم إنشاء صفحات الشهادات بدقة عالية ودمجها في ملف واحد (${totalStudents} شهادة).</p>
        
        <div style="margin-top: 18px; width: 100%; background: rgba(255,255,255,0.12); border-radius: 999px; height: 10px; overflow: hidden; box-shadow: inset 0 1px 3px rgba(0,0,0,0.4);">
          <div id="certPdfProgressBar" style="width: 5%; height: 100%; background: linear-gradient(90deg, #f59e0b, #10b981); transition: width 0.25s ease-out; border-radius: 999px;"></div>
        </div>

        <div id="certPdfProgressStatus" style="margin-top: 12px; font-size: 0.84rem; color: #94a3b8; display: flex; align-items: center; justify-content: center; gap: 7px; font-weight: 600;">
          <i class="fa-solid fa-spinner fa-spin"></i> جاري تجهيز الشهادة 1 من ${totalStudents}...
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const progressBar = document.getElementById('certPdfProgressBar');
    const progressStatus = document.getElementById('certPdfProgressStatus');

    // Page dimensions in mm and css units
    const pageW_mm = isLandscape ? 297 : 210;
    const pageH_mm = isLandscape ? 210 : 297;
    const pageW_css = `${pageW_mm}mm`;
    const pageH_css = `${pageH_mm}mm`;

    // 2. Prepare isolated render host mounted in DOM with opacity 1 (behind the modal)
    let renderHost = document.getElementById('certPdfRenderHost');
    if (!renderHost) {
      renderHost = document.createElement('div');
      renderHost.id = 'certPdfRenderHost';
      document.body.appendChild(renderHost);
    }
    renderHost.style.cssText = `position: fixed; left: 0; top: 0; width: ${pageW_css}; height: ${pageH_css}; overflow: hidden; opacity: 1; pointer-events: none; z-index: -99999; background: #ffffff;`;
    renderHost.innerHTML = `
      <style id="certPdfStaticStyles">
        ${getCertificatesPrintCss(isLandscape)}
        *, *::before, *::after {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        .cert-pdf-export-single-page {
          display: block !important;
          width: ${pageW_css} !important;
          height: ${pageH_css} !important;
          max-width: ${pageW_css} !important;
          max-height: ${pageH_css} !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          overflow: hidden !important;
        }
      </style>
      <div id="certPdfCurrentPageSlot"></div>
    `;

    const slot = document.getElementById('certPdfCurrentPageSlot');

    function buildCertPageWrapper(student, idx) {
      const wrap = document.createElement('div');
      wrap.className = 'cert-pdf-export-single-page cert-sheet';
      wrap.setAttribute('data-pdf-page', '1');
      wrap.style.cssText = `display: block; width: ${pageW_css}; height: ${pageH_css}; max-width: ${pageW_css}; max-height: ${pageH_css}; box-sizing: border-box; margin: 0; padding: 0; background: #ffffff; overflow: hidden;`;
      wrap.innerHTML = `
        <div class="print-cert-page-wrapper" data-student-index="${idx}">
          ${buildCertificateHtml(student, activeBatch, true, idx)}
        </div>
      `;
      return wrap;
    }

    const printFn = (typeof window.masarPrintToPDF === 'function') ? window.masarPrintToPDF : (typeof window.exportToPDF === 'function' ? window.exportToPDF : null);
    if (printFn) {
      try {
        const pages = [];
        for (let idx = 0; idx < totalStudents; idx++) {
          const wrap = buildCertPageWrapper(activeBatch.students[idx], idx);
          wrap.classList.add('pdf-page');
          pages.push(wrap);
        }
        if (overlay && overlay.parentNode) overlay.remove();
        if (renderHost && renderHost.parentNode) renderHost.remove();

        await printFn(pages, {
          title: filename.replace(/\.pdf$/i, ''),
          orientation: isLandscape ? 'landscape' : 'portrait',
          pageSize: 'a4',
          margin: '0',
          fit: true
        });
        if (typeof window.showToast === 'function') {
          window.showToast('تم تصدير وتنزيل كافة الشهادات بصيغة PDF بنجاح! 🎓✨', 'success');
        }
        return true;
      } catch (e) {
        console.warn('exportToPDF for certificates failed, falling back:', e);
      }
    }

    const JsPdfConstructor = window.jsPDF || (window.html2pdf && window.html2pdf.jsPDF);
    const html2canvasFn = window.html2canvas || (window.html2pdf && window.html2pdf.html2canvas);

    let exportSuccess = false;

    if (JsPdfConstructor && html2canvasFn) {
      try {
        const orientation = isLandscape ? 'landscape' : 'portrait';
        const pdf = new JsPdfConstructor({
          orientation: orientation,
          unit: 'mm',
          format: 'a4',
          compress: true
        });

        const scale = (totalStudents > 40) ? 1.2 : ((totalStudents > 15) ? 1.35 : 1.75);

        for (let idx = 0; idx < totalStudents; idx++) {
          const currentStudent = activeBatch.students[idx];
          const studentName = currentStudent ? currentStudent.name : '';
          const percent = Math.min(100, Math.round(((idx + 1) / totalStudents) * 100));

          if (progressBar) {
            progressBar.style.width = `${percent}%`;
          }
          if (progressStatus) {
            progressStatus.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-warning"></i> جاري تجهيز الشهادة ${idx + 1} من ${totalStudents} (${percent}%) ${studentName ? `«${escapeHtml(studentName)}»` : ''}`;
          }

          if (slot) slot.innerHTML = '';
          const wrap = buildCertPageWrapper(currentStudent, idx);
          if (slot) slot.appendChild(wrap);

          // Allow the browser to repaint the progress bar and status text
          await new Promise(r => setTimeout(r, 20));

          const canvas = await html2canvasFn(wrap, {
            scale: scale,
            useCORS: true,
            allowTaint: false, // Ensure this is false to respect CORS
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 1123,
            windowHeight: 794,
            scrollX: 0,
            scrollY: 0,
            onclone: (clonedDoc) => {
              clonedDoc.querySelectorAll('img').forEach(img => {
                try { img.crossOrigin = 'anonymous'; } catch(e){}
              });
            }
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.94);

          if (idx > 0) {
            pdf.addPage('a4', orientation);
          }

          pdf.addImage(imgData, 'JPEG', 0, 0, pageW_mm, pageH_mm);
        }

        if (progressBar) progressBar.style.width = '100%';
        if (progressStatus) {
          progressStatus.innerHTML = `<i class="fa-solid fa-circle-check text-success"></i> تم إنشاء ملف PDF بالكامل بنجاح! جاري التنزيل... 📥`;
        }
        await new Promise(r => setTimeout(r, 350));

        pdf.save(filename);
        exportSuccess = true;
      } catch (err) {
        console.warn('Direct jsPDF/html2canvas batch export failed:', err);
        exportSuccess = false;
      }
    } else if (typeof window.html2pdf !== 'undefined') {
      try {
        const opt = {
          margin: 0,
          filename: filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: (totalStudents > 25) ? 1.5 : 2,
            useCORS: true,
            allowTaint: false, // Ensure this is false to respect CORS
            logging: false,
            backgroundColor: '#ffffff'
          },
          jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: isLandscape ? 'landscape' : 'portrait'
          }
        };

        const firstWrap = buildCertPageWrapper(activeBatch.students[0], 0);
        renderHost.innerHTML = '';
        renderHost.appendChild(firstWrap);

        const worker = window.html2pdf().set(opt);
        await worker.from(firstWrap).toPdf();
        const pdf = await worker.get('pdf');

        for (let idx = 1; idx < totalStudents; idx++) {
          if (progressStatus) progressStatus.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> جاري تجهيز الشهادة ${idx + 1} من ${totalStudents}...`;
          if (progressBar) progressBar.style.width = `${Math.round(((idx + 1) / totalStudents) * 100)}%`;

          const wrap = buildCertPageWrapper(activeBatch.students[idx], idx);
          renderHost.innerHTML = '';
          renderHost.appendChild(wrap);

          const canvas = await window.html2pdf().set(opt).from(wrap).toCanvas().get('canvas');
          const imgData = canvas.toDataURL('image/jpeg', 0.98);

          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, 0, pageW_mm, pageH_mm);
        }

        pdf.save(filename);
        exportSuccess = true;
      } catch (err) {
        console.warn('html2pdf sequential export fallback failed:', err);
        exportSuccess = false;
      }
    }

    // Cleanup
    if (renderHost && renderHost.parentNode) renderHost.remove();
    const ov = document.getElementById('certDirectPdfExportOverlay');
    if (ov) ov.remove();

    if (exportSuccess) {
      if (typeof window.showToast === 'function') {
        window.showToast(`تم تنزيل ملف «${filename}» الذي يحتوي على كافة الشهادات (${totalStudents} شهادة) بنجاح! 📥🎉`, 'success', 3500);
      }
    } else {
      if (typeof window.showToast === 'function') {
        window.showToast('تعذر إنشاء ملف الـ PDF للشهادات. يرجى التأكد من بيانات الطلاب والمحاولة مجدداً ⚠️', 'error', 4500);
      }
    }
  };

  window.certExportBatchPdf = async function(options) {
    options = options || {};
    // Generates a PDF with 'screen' media type.
    await page.emulateMedia({ media: 'screen' });
    await page.pdf({ path: options.path || 'page.pdf' });
  };

  window.certSaveBatchToArchive = function() {
    saveBatches(true);
    if (typeof window.showToast === 'function') {
      window.showToast('تم حفظ وتحديث دفعة الشهادات في الأرشيف بنجاح 💾', 'success');
    }
  };

  // 17. Master Printable System (Animated Interactive Progress Modal for Instant, Zero-Hang Printing)
  async function printCertificates(studentsList, batch) {
    if (!studentsList || studentsList.length === 0) {
      if (typeof window.showToast === 'function') window.showToast('لا توجد شهادات للطباعة!', 'warning');
      return;
    }

    const isLandscape = (batch.orientation || 'landscape') === 'landscape';
    const totalStudents = studentsList.length;

    // Sync global page orientation so browser print dialog matches preview orientation
    if (typeof window.setDynamicPrintPage === 'function') {
      window.setDynamicPrintPage(isLandscape ? 'landscape' : 'portrait', '0', 'A4');
    }

    // 1. Interactive Animated Progress Modal (طراز ملكي فاخر مع شريط متحرك حي)
    const overlay = document.createElement('div');
    overlay.id = 'certPrintProgressOverlay';
    overlay.style.cssText = 'position: fixed; inset: 0; background: rgba(15, 23, 42, 0.88); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); z-index: 999999; display: flex; align-items: center; justify-content: center; font-family: "Cairo", "Alexandria", system-ui, sans-serif; direction: rtl; padding: 1.5rem;';
    overlay.innerHTML = `
      <div style="background: #0f172a; border: 1.5px solid rgba(245, 158, 11, 0.35); border-radius: 20px; padding: 2.2rem 2.5rem; max-width: 520px; width: 100%; text-align: center; color: #ffffff; box-shadow: 0 25px 60px rgba(0,0,0,0.6); position: relative; overflow: hidden;">
        <div style="width: 72px; height: 72px; margin: 0 auto 1.25rem auto; background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.3)); border: 2px solid #f59e0b; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #fbbf24; box-shadow: 0 0 25px rgba(245, 158, 11, 0.35);">
          <i class="fa-solid fa-print"></i>
        </div>
        <h3 id="certPrintModalTitle" style="font-size: 1.35rem; font-weight: 900; margin: 0 0 0.5rem 0; color: #ffffff; letter-spacing: -0.3px;">
          جاري تجهيز وطباعة جميع الشهادات... 🖨️📄
        </h3>
        <p style="font-size: 0.88rem; color: #94a3b8; margin: 0 0 1.6rem 0; line-height: 1.5;">
          يتم الآن تجميع صفحات الشهادات وتنسيقها بدقة عالية لتكون جاهزة للطباعة على الفور (${totalStudents} شهادة).
        </p>
        <div style="width: 100%; height: 12px; background: #1e293b; border-radius: 999px; overflow: hidden; border: 1px solid #334155; position: relative;">
          <div id="certPrintProgressBar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #f59e0b, #10b981); border-radius: 999px; transition: width 0.12s ease; box-shadow: 0 0 12px rgba(16, 185, 129, 0.5);"></div>
        </div>
        <div id="certPrintProgressStatus" style="margin-top: 14px; font-size: 0.88rem; color: #cbd5e1; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 700;">
          <i class="fa-solid fa-spinner fa-spin text-warning"></i> جاري تجهيز الشهادة 1 من ${totalStudents}...
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const progressBar = document.getElementById('certPrintProgressBar');
    const progressStatus = document.getElementById('certPrintProgressStatus');
    const modalTitle = document.getElementById('certPrintModalTitle');

    // 2. Build pages progressively in chunks so the progress bar moves smoothly and visibly
    const pagesHtmlList = [];
    const chunkSize = (totalStudents > 60) ? 4 : ((totalStudents > 25) ? 2 : 1);

    for (let i = 0; i < totalStudents; i += chunkSize) {
      const end = Math.min(i + chunkSize, totalStudents);
      for (let j = i; j < end; j++) {
        const st = studentsList[j];
        pagesHtmlList.push(`
          <div class="print-cert-page-wrapper" data-student-index="${j}">
            ${buildCertificateHtml(st, batch, true, j)}
          </div>
        `);
      }

      const percent = Math.min(100, Math.round((end / totalStudents) * 100));
      if (progressBar) progressBar.style.width = `${percent}%`;
      if (progressStatus) {
        const curName = studentsList[end - 1]?.name || '';
        progressStatus.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-warning"></i> جاري تجهيز الشهادة ${end} من ${totalStudents} (${percent}%) ${curName ? `«${escapeHtml(curName)}»` : ''}`;
      }

      // Small async yield to allow UI repaint of progress bar
      await new Promise(r => setTimeout(r, 20));
    }

    if (progressBar) progressBar.style.width = '100%';
    if (progressStatus) {
      progressStatus.innerHTML = `<i class="fa-solid fa-circle-check text-success"></i> اكتمل تجهيز جميع الشهادات (${totalStudents} شهادة)! جاري فتح نافذة الطباعة فوراً... ⚡`;
    }
    if (modalTitle) {
      modalTitle.innerHTML = `اكتمل التجهيز بنجاح! جاري فتح الطباعة... 🖨️✨`;
    }

    // 3. Mount into dedicated print iframe
    const printDocHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${escapeHtml(batch.title || 'شهادات_الطلاب')}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Alexandria:wght@300;400;600;700;800;900&family=Amiri:ital,wght@0,400;0,700;1,400&family=Cairo:wght@400;600;700;800;900&family=Reem+Kufi:wght@500;600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <link rel="stylesheet" href="css/style.css">
        <style>
          ${getCertificatesPrintCss(isLandscape)}
        </style>
      </head>
      <body>
        <div class="all-certificates-print-container">
          ${pagesHtmlList.join('\n')}
        </div>
      </body>
      </html>
    `;

    // Remove any previous print frame
    let oldFrame = document.getElementById('certDedicatedPrintIframe');
    if (oldFrame) oldFrame.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'certDedicatedPrintIframe';
    const frameW = isLandscape ? '1123px' : '794px';
    const frameH = isLandscape ? '794px' : '1123px';
    iframe.style.cssText = `position: fixed; left: 0; top: 0; width: ${frameW}; height: ${frameH}; z-index: -99999; opacity: 0.01; pointer-events: none; border: 0; overflow: hidden;`;
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(printDocHtml);
    doc.close();

    // 4. Preload fonts & images
    try {
      if (doc.fonts) await doc.fonts.ready;
    } catch (_) {}

    try {
      const imgs = Array.from(doc.images || []);
      if (imgs.length > 0) {
        await Promise.all(imgs.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(res => { img.onload = res; img.onerror = res; });
        }));
      }
    } catch (_) {}

    // 5. Brief layout settling
    await new Promise(r => setTimeout(r, 120));

    // Remove overlay right as print triggers
    if (overlay && overlay.parentNode) {
      overlay.remove();
    }

    try {
      if (typeof window.setDynamicPrintPage === 'function') {
        window.setDynamicPrintPage(isLandscape ? 'landscape' : 'portrait', '0', 'A4');
      }
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (err) {
      console.warn('iframe.print failed, fallback to window.print', err);
      if (typeof window.setDynamicPrintPage === 'function') {
        window.setDynamicPrintPage(isLandscape ? 'landscape' : 'portrait', '0', 'A4');
      }
      window.print();
    }

    // Delayed cleanup of frame
    setTimeout(function() {
      if (iframe && iframe.parentNode) iframe.remove();
    }, 120000);
  }

  // 18. CSS Stylesheet for High Definition Multi-page Certificates (Rock-Solid No-Loop Print)
  function getCertificatesPrintCss(isLandscape) {
    const pageW = isLandscape ? '297mm' : '210mm';
    const pageH = isLandscape ? '209mm' : '296mm';

    return `
      @page {
        size: A4 ${isLandscape ? 'landscape' : 'portrait'} !important;
        margin: 0 !important;
      }
      *, *::before, *::after {
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        font-family: 'Cairo', 'Amiri', 'Alexandria', serif !important;
        direction: rtl !important;
        width: 100% !important;
        height: 100% !important;
        overflow: visible !important;
      }
      .all-certificates-print-container {
        display: block !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .print-cert-page-wrapper,
      .cert-pdf-export-single-page {
        display: block !important;
        width: ${pageW} !important;
        height: ${pageH} !important;
        max-width: ${pageW} !important;
        max-height: ${pageH} !important;
        box-sizing: border-box !important;
        margin: 0 auto !important;
        padding: 0 !important;
        page-break-before: auto !important;
        page-break-after: always !important;
        break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        break-inside: avoid-page !important;
        overflow: hidden !important;
        position: relative !important;
        background: #ffffff !important;
      }
      .print-cert-page-wrapper:last-child,
      .cert-pdf-export-single-page:last-child {
        page-break-after: auto !important;
        break-after: auto !important;
      }
      .certificate-paper {
        width: 100% !important;
        height: 100% !important;
        max-width: 100% !important;
        max-height: 100% !important;
        box-sizing: border-box !important;
        margin: 0 !important;
        padding: ${isLandscape ? '5mm 7mm' : '7mm 5mm'} !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        transform: none !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        position: relative !important;
        overflow: hidden !important;
        display: flex !important;
        flex-direction: column !important;
        background: #ffffff !important;
        font-family: 'Cairo', 'Amiri', 'Traditional Arabic', serif !important;
        direction: rtl !important;
        color: #0f172a !important;
      }
      .certificate-paper.is-year-end {
        padding: 0 !important;
      }
      .cert-outer-border {
        width: 100% !important;
        height: 100% !important;
        box-sizing: border-box !important;
        flex: 1 !important;
        min-height: 0 !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: hidden !important;
        border-width: 5px !important;
        border-radius: 12px !important;
        padding: 7px !important;
        position: relative !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .cert-inner-border {
        width: 100% !important;
        height: 100% !important;
        box-sizing: border-box !important;
        flex: 1 !important;
        min-height: 0 !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: hidden !important;
        border-width: 2px !important;
        border-radius: 10px !important;
        padding: 7px !important;
        position: relative !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .cert-fine-border {
        width: 100% !important;
        height: 100% !important;
        box-sizing: border-box !important;
        flex: 1 !important;
        min-height: 0 !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        border-width: 1.5px !important;
        border-radius: 8px !important;
        padding: ${isLandscape ? '22px 34px 14px 34px' : '28px 24px 20px 24px'} !important;
        overflow: hidden !important;
        position: relative !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .cert-corner {
        position: absolute !important;
        width: 38px !important;
        height: 38px !important;
        pointer-events: none !important;
      }
      .corner-top-right { top: 5px !important; right: 5px !important; border-width: 5px 5px 0 0 !important; }
      .corner-top-left { top: 5px !important; left: 5px !important; border-width: 5px 0 0 5px !important; }
      .corner-bottom-right { bottom: 5px !important; right: 5px !important; border-width: 0 5px 5px 0 !important; }
      .corner-bottom-left { bottom: 5px !important; left: 5px !important; border-width: 0 0 5px 5px !important; }

      .cert-official-header {
        display: flex !important;
        justify-content: space-between !important;
        align-items: flex-start !important;
        width: 100% !important;
        margin-bottom: 4px !important;
        flex-shrink: 0 !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .cert-header-side {
        width: 29% !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 4px !important;
        font-size: ${isLandscape ? '11pt' : '11.5pt'} !important;
        color: #334155 !important;
        box-sizing: border-box !important;
      }
      .cert-header-right {
        text-align: right !important;
        padding-right: ${isLandscape ? '20px' : '14px'} !important;
      }
      .cert-header-left {
        text-align: left !important;
        padding-left: ${isLandscape ? '20px' : '14px'} !important;
      }
      .cert-gov-title {
        font-size: ${isLandscape ? '10pt' : '10.5pt'} !important;
        font-weight: 700 !important;
        color: #64748b !important;
        letter-spacing: 0.5px !important;
      }
      .cert-min-title {
        font-weight: 900 !important;
        font-size: ${isLandscape ? '12.5pt' : '13pt'} !important;
        color: #0f172a !important;
      }
      .cert-dir-title {
        font-size: ${isLandscape ? '10.5pt' : '11pt'} !important;
        font-weight: 700 !important;
        color: #475569 !important;
      }
      .cert-school-title {
        font-weight: 900 !important;
        font-size: ${isLandscape ? '14pt' : '15pt'} !important;
        color: #78350f !important;
        margin-top: 3px !important;
        font-family: 'Amiri', 'Cairo', serif !important;
        line-height: 1.25 !important;
      }
      .cert-meta-item {
        font-size: ${isLandscape ? '11pt' : '11.5pt'} !important;
        line-height: 1.55 !important;
        color: #334155 !important;
        display: block !important;
      }
      .cert-meta-item strong {
        color: #0f172a !important;
        font-weight: 800 !important;
        margin-left: 4px !important;
      }
      .cert-header-center {
        width: 42% !important;
        text-align: center !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
      }
      .cert-emblem-wrap {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: 3px !important;
      }
      .cert-emblem-img {
        width: ${isLandscape ? '62px' : '68px'} !important;
        height: ${isLandscape ? '62px' : '68px'} !important;
        object-fit: contain !important;
      }
      .cert-crest-stars {
        font-size: ${isLandscape ? '12pt' : '13pt'} !important;
        letter-spacing: 5px !important;
        margin: 2px 0 3px 0 !important;
        color: #f59e0b !important;
      }
      .cert-crest-stars .main-star {
        font-size: ${isLandscape ? '15.5pt' : '16.5pt'} !important;
        margin: 0 5px !important;
      }
      .cert-type-headline {
        margin: 3px 0 5px 0 !important;
        font-family: 'Amiri', 'Cairo', serif !important;
        font-weight: 900 !important;
        font-size: ${isLandscape ? '30pt' : '33pt'} !important;
        letter-spacing: 0.5px !important;
        line-height: 1.2 !important;
      }
      .cert-motto-ribbon {
        display: inline-block !important;
        padding: ${isLandscape ? '4px 24px' : '5px 28px'} !important;
        border-radius: 999px !important;
        font-size: ${isLandscape ? '10.5pt' : '11.5pt'} !important;
        font-weight: 800 !important;
        letter-spacing: 0.8px !important;
      }
      .cert-content-body {
        text-align: center !important;
        margin: ${isLandscape ? '8px 0' : '16px 0'} !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        flex: 1 !important;
        min-height: 0 !important;
        overflow: hidden !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .cert-intro-text {
        font-family: 'Amiri', 'Traditional Arabic', serif !important;
        font-size: ${isLandscape ? '19pt' : '20pt'} !important;
        font-weight: 700 !important;
        color: #475569 !important;
        margin: 0 0 8px 0 !important;
        letter-spacing: 0.4px !important;
        line-height: 1.35 !important;
      }
      .cert-student-name-box {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: ${isLandscape ? '24px' : '20px'} !important;
        margin: ${isLandscape ? '6px 0 12px 0' : '10px 0 16px 0'} !important;
        width: 100% !important;
      }
      .cert-student-name {
        font-family: 'Amiri', 'Cairo', serif !important;
        font-weight: 900 !important;
        font-size: ${isLandscape ? '38pt' : '40pt'} !important;
        margin: 0 !important;
        line-height: 1.2 !important;
        letter-spacing: 0.8px !important;
        padding: 0 8px !important;
      }
      .cert-name-wings {
        height: 3px !important;
        width: ${isLandscape ? '95px' : '85px'} !important;
        position: relative !important;
      }
      .cert-name-wings::after {
        font-size: 8.5pt !important;
        top: -6.5px !important;
      }
      .cert-name-wings.wing-left::after {
        right: auto !important;
        left: -3px !important;
      }
      .cert-name-wings.wing-right::after {
        left: auto !important;
        right: -3px !important;
      }
      .cert-rank-strip {
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        gap: ${isLandscape ? '16px' : '14px'} !important;
        margin-bottom: ${isLandscape ? '12px' : '16px'} !important;
      }
      .cert-rank-pill {
        display: inline-flex !important;
        align-items: center !important;
        gap: 7px !important;
        font-size: ${isLandscape ? '13pt' : '13.5pt'} !important;
        font-weight: 900 !important;
        padding: ${isLandscape ? '5px 22px' : '6px 24px'} !important;
        border-radius: 999px !important;
        letter-spacing: 0.4px !important;
      }
      .cert-score-chip {
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
        font-size: ${isLandscape ? '12.5pt' : '13pt'} !important;
        font-weight: 900 !important;
        padding: ${isLandscape ? '4.5px 20px' : '5.5px 22px'} !important;
        border-radius: 999px !important;
        border-width: 2px !important;
      }
      .cert-tribute-box {
        max-width: ${isLandscape ? '84%' : '88%'} !important;
        margin: 0 auto !important;
      }
      .cert-tribute-text {
        font-family: 'Amiri', 'Traditional Arabic', serif !important;
        font-size: ${isLandscape ? '19pt' : '20.5pt'} !important;
        line-height: ${isLandscape ? '1.7' : '1.75'} !important;
        font-weight: 700 !important;
        margin: 0 !important;
        letter-spacing: 0.35px !important;
      }
      .cert-custom-note {
        display: none !important;
      }
      .cert-official-footer {
        width: 100% !important;
        margin-top: 4px !important;
        padding-top: 4px !important;
        margin-bottom: 2px !important;
        flex-shrink: 0 !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: flex-end !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .cert-sig-box {
        width: 32% !important;
        text-align: center !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        box-sizing: border-box !important;
      }
      .cert-official-footer .cert-sig-box:first-child {
        padding-right: ${isLandscape ? '22px' : '14px'} !important;
      }
      .cert-official-footer .cert-sig-box:last-child {
        padding-left: ${isLandscape ? '22px' : '14px'} !important;
      }
      .cert-sig-role {
        font-size: ${isLandscape ? '11.5pt' : '12pt'} !important;
        font-weight: 800 !important;
        color: #475569 !important;
        letter-spacing: 0.3px !important;
      }
      .cert-sig-name {
        font-size: ${isLandscape ? '14pt' : '15pt'} !important;
        font-weight: 900 !important;
        color: #0f172a !important;
        margin: 2px 0 6px 0 !important;
        font-family: 'Amiri', 'Cairo', serif !important;
      }
      .cert-sig-line {
        min-width: 160px !important;
      }
      .cert-sig-dots {
        font-size: 11pt !important;
        color: #94a3b8 !important;
        letter-spacing: 1.2px !important;
      }
      .cert-center-stamp-col {
        width: 36% !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: flex-end !important;
        position: relative !important;
      }
      .cert-wax-seal {
        width: ${isLandscape ? '76px' : '84px'} !important;
        height: ${isLandscape ? '76px' : '84px'} !important;
        border-radius: 50% !important;
      }
      .seal-inner-circle {
        width: ${isLandscape ? '60px' : '68px'} !important;
        height: ${isLandscape ? '60px' : '68px'} !important;
      }
      .seal-icon {
        font-size: ${isLandscape ? '15pt' : '17pt'} !important;
      }
      .seal-text-top {
        font-size: 6pt !important;
      }
      .seal-text-bottom {
        font-size: 7pt !important;
      }
      .seal-stars {
        font-size: 5.5pt !important;
      }
      .seal-ribbon {
        position: absolute !important;
        bottom: -15px !important;
        width: 16px !important;
        height: 25px !important;
      }
      .cert-issue-date {
        font-size: ${isLandscape ? '10.5pt' : '11pt'} !important;
        font-weight: 800 !important;
        color: #64748b !important;
        margin-top: 6px !important;
        letter-spacing: 0.3px !important;
      }
      .cert-bottom-bar {
        display: flex !important;
        justify-content: center !important;
        border-top: 1px solid rgba(180, 83, 9, 0.25) !important;
        padding: 5px 8px 0 8px !important;
        margin-top: 5px !important;
        font-size: 9.5pt !important;
        font-weight: 700 !important;
        color: #64748b !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
      .cert-platform-credit {
        letter-spacing: 0.4px !important;
        font-size: 9.5pt !important;
      }

      /* ==========================================================
         YEAR-END OFFICIAL REPORT / CERTIFICATE PRINT & PDF STYLES
         ========================================================== */
      .certificate-paper.is-year-end {
        padding: ${isLandscape ? '4mm 6mm' : '6mm 4mm'} !important;
        background: #ffffff !important;
      }
      .certificate-paper.is-year-end .cert-corner {
        display: none !important;
      }
      .is-year-end .cert-outer-border {
        border-width: 5px !important;
        border-radius: 12px !important;
        padding: 6px !important;
      }
      .is-year-end .cert-inner-border {
        border-width: 2px !important;
        border-radius: 9px !important;
        padding: 6px !important;
      }
      .is-year-end .cert-fine-border {
        padding: ${isLandscape ? '8px 14px 6px 14px' : '12px 10px 8px 10px'} !important;
        border-width: 1.5px !important;
        border-radius: 8px !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
      }
      .cert-year-end-container {
        width: 100% !important;
        height: 100% !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        flex: 1 !important;
        box-sizing: border-box !important;
        font-family: 'Cairo', 'Amiri', 'Traditional Arabic', serif !important;
        direction: rtl !important;
        text-align: right !important;
      }

      /* 1. Official Header */
      .is-year-end .cye-header {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        border-bottom: 2px solid #b45309 !important;
        padding-bottom: 5px !important;
        margin-bottom: 5px !important;
        gap: 12px !important;
      }
      .is-year-end .cye-header-right {
        text-align: right !important;
        min-width: 220px !important;
      }
      .is-year-end .cye-gov-line {
        font-size: ${isLandscape ? '9.5pt' : '10pt'} !important;
        font-weight: 800 !important;
        color: #334155 !important;
        line-height: 1.35 !important;
      }
      .is-year-end .cye-gov-line.font-bold {
        font-size: ${isLandscape ? '10.8pt' : '11.5pt'} !important;
        font-weight: 900 !important;
        color: #0f172a !important;
      }
      .is-year-end .cye-header-center {
        text-align: center !important;
        flex: 1 !important;
      }
      .is-year-end .cye-eagle-badge {
        display: inline-flex !important;
        flex-direction: column !important;
        align-items: center !important;
        margin-bottom: 2px !important;
      }
      .is-year-end .cye-eagle-img {
        width: ${isLandscape ? '38px' : '44px'} !important;
        height: ${isLandscape ? '38px' : '44px'} !important;
        object-fit: contain !important;
      }
      .is-year-end .cye-title {
        font-family: 'Amiri', 'Cairo', serif !important;
        font-size: ${isLandscape ? '16.5pt' : '18pt'} !important;
        font-weight: 900 !important;
        color: #78350f !important;
        margin: 2px 0 1px 0 !important;
        line-height: 1.2 !important;
        letter-spacing: 0.3px !important;
      }
      .is-year-end .cye-subtitle {
        font-size: ${isLandscape ? '9.5pt' : '10pt'} !important;
        font-weight: 700 !important;
        color: #475569 !important;
        margin-top: 2px !important;
      }
      .is-year-end .cye-header-left {
        text-align: left !important;
        min-width: 220px !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: flex-end !important;
      }
      .is-year-end .cye-meta-box {
        font-size: ${isLandscape ? '9pt' : '9.5pt'} !important;
        background: rgba(245, 158, 11, 0.06) !important;
        border: 1px solid rgba(245, 158, 11, 0.3) !important;
        border-radius: 6px !important;
        padding: 4px 10px !important;
        gap: 3px !important;
      }

      /* 2. Student Identity Card */
      .is-year-end .cye-student-card {
        background: linear-gradient(135deg, rgba(254, 243, 199, 0.45), rgba(241, 245, 249, 0.6)) !important;
        border: 1.5px solid rgba(180, 83, 9, 0.3) !important;
        border-radius: 6px !important;
        padding: ${isLandscape ? '4px 12px' : '6px 14px'} !important;
        margin-bottom: 5px !important;
        display: grid !important;
        grid-template-columns: 1.8fr 1.5fr 1fr !important;
        align-items: center !important;
        gap: 10px !important;
        box-sizing: border-box !important;
      }
      .is-year-end .cye-st-item {
        display: flex !important;
        align-items: baseline !important;
        gap: 6px !important;
      }
      .is-year-end .cye-st-label {
        font-size: ${isLandscape ? '9.5pt' : '10pt'} !important;
        font-weight: 800 !important;
        color: #64748b !important;
      }
      .is-year-end .cye-st-val {
        font-size: ${isLandscape ? '10.5pt' : '11pt'} !important;
        font-weight: 800 !important;
        color: #0f172a !important;
      }
      .is-year-end .cye-st-val-name {
        font-size: ${isLandscape ? '13pt' : '14pt'} !important;
        font-weight: 900 !important;
        color: #78350f !important;
        font-family: 'Amiri', 'Cairo', serif !important;
      }

      /* 3. Grades & Subjects Expanded Table */
      .is-year-end .cye-table-wrap {
        width: 100% !important;
        margin-bottom: 5px !important;
        flex: 1 !important;
        display: flex !important;
        flex-direction: column !important;
        min-height: 0 !important;
      }
      .is-year-end .cye-grades-table {
        width: 100% !important;
        border-collapse: collapse !important;
        flex: 1 !important;
        height: 100% !important;
        font-size: ${isLandscape ? '9.5pt' : '10pt'} !important;
        line-height: 1.25 !important;
      }
      .is-year-end .cye-grades-table th {
        background: linear-gradient(135deg, #78350f, #b45309) !important;
        color: #ffffff !important;
        font-weight: 900 !important;
        font-size: ${isLandscape ? '9.8pt' : '10.2pt'} !important;
        padding: 5px 6px !important;
        border: 1px solid #78350f !important;
        text-align: center !important;
        height: 28px !important;
      }
      .is-year-end .cye-grades-table td {
        padding: ${isLandscape ? '3px 6px' : '4px 6px'} !important;
        border: 1px solid #cbd5e1 !important;
        color: #0f172a !important;
        vertical-align: middle !important;
        font-size: ${isLandscape ? '9.5pt' : '10pt'} !important;
      }
      .is-year-end .cye-grades-table tbody tr:nth-child(even) {
        background: rgba(248, 250, 252, 0.75) !important;
      }
      .is-year-end .cye-cell-num {
        text-align: center !important;
        font-family: monospace, system-ui !important;
        font-weight: 800 !important;
        font-size: ${isLandscape ? '9.8pt' : '10.2pt'} !important;
      }
      .is-year-end .cye-cell-name {
        font-weight: 800 !important;
        font-size: ${isLandscape ? '9.8pt' : '10.2pt'} !important;
        color: #0f172a !important;
      }
      .is-year-end .cye-cell-written {
        font-weight: 700 !important;
        color: #1e293b !important;
        font-size: ${isLandscape ? '9pt' : '9.5pt'} !important;
      }
      .is-year-end .cye-cell-score-pass {
        color: #047857 !important;
        font-weight: 900 !important;
      }
      .is-year-end .cye-cell-score-fail {
        color: #dc2626 !important;
        font-weight: 900 !important;
      }
      .is-year-end .cye-cell-appreciation {
        text-align: center !important;
        font-weight: 800 !important;
        font-size: ${isLandscape ? '9.5pt' : '10pt'} !important;
        color: #047857 !important;
      }
      .is-year-end .cye-cell-result {
        text-align: center !important;
      }
      .is-year-end .cye-badge-pass {
        background: rgba(16, 185, 129, 0.18) !important;
        color: #065f46 !important;
        border: 1px solid rgba(16, 185, 129, 0.5) !important;
        padding: 1px 7px !important;
        border-radius: 999px !important;
        font-weight: 800 !important;
        font-size: ${isLandscape ? '8.8pt' : '9.2pt'} !important;
        line-height: 1.3 !important;
        display: inline-block !important;
      }
      .is-year-end .cye-badge-fail {
        background: rgba(239, 68, 68, 0.18) !important;
        color: #991b1b !important;
        border: 1px solid rgba(239, 68, 68, 0.5) !important;
        padding: 1px 7px !important;
        border-radius: 999px !important;
        font-weight: 800 !important;
        font-size: ${isLandscape ? '8.8pt' : '9.2pt'} !important;
        line-height: 1.3 !important;
        display: inline-block !important;
      }

      /* Summary Row */
      .is-year-end .cye-summary-row {
        background: #fef3c7 !important;
        border-top: 2px solid #b45309 !important;
      }
      .is-year-end .cye-summary-row td {
        border-top: 2px solid #b45309 !important;
        border-bottom: 2px solid #b45309 !important;
        padding: 4px 6px !important;
        font-size: ${isLandscape ? '10pt' : '10.5pt'} !important;
        height: 28px !important;
      }
      .is-year-end .cye-sum-label {
        font-weight: 900 !important;
        color: #78350f !important;
        text-align: right !important;
        font-size: ${isLandscape ? '10.2pt' : '10.8pt'} !important;
      }
      .is-year-end .cye-sum-total {
        text-align: center !important;
        font-weight: 900 !important;
        color: #78350f !important;
        font-size: ${isLandscape ? '10.8pt' : '11.5pt'} !important;
      }
      .is-year-end .cye-sum-written {
        color: #78350f !important;
        font-size: ${isLandscape ? '9.5pt' : '10pt'} !important;
        font-weight: 800 !important;
      }
      .is-year-end .cye-sum-appreciation {
        text-align: center !important;
        font-weight: 900 !important;
        color: #b45309 !important;
        font-size: ${isLandscape ? '10.2pt' : '10.8pt'} !important;
      }
      .is-year-end .cye-sum-status {
        text-align: center !important;
        font-size: ${isLandscape ? '10.2pt' : '10.8pt'} !important;
        font-weight: 900 !important;
      }

      /* 4. Decision Banner */
      .is-year-end .cye-decision-banner {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        padding: ${isLandscape ? '4px 12px' : '6px 14px'} !important;
        border-radius: 6px !important;
        margin-bottom: 5px !important;
        gap: 10px !important;
        font-size: ${isLandscape ? '9.8pt' : '10.2pt'} !important;
        box-sizing: border-box !important;
      }
      .is-year-end .cye-decision-banner.cye-passed {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(5, 150, 105, 0.08)) !important;
        border: 1.5px solid #10b981 !important;
        color: #064e3b !important;
      }
      .is-year-end .cye-decision-banner.cye-referred {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(220, 38, 38, 0.08)) !important;
        border: 1.5px solid #ef4444 !important;
        color: #7f1d1d !important;
      }
      .is-year-end .cye-dec-badge {
        font-size: ${isLandscape ? '9.8pt' : '10.2pt'} !important;
        font-weight: 900 !important;
        margin-left: 6px !important;
      }
      .is-year-end .cye-dec-text {
        font-size: ${isLandscape ? '10pt' : '10.5pt'} !important;
        font-weight: 800 !important;
      }
      .is-year-end .cye-decision-left {
        display: flex !important;
        gap: 8px !important;
        align-items: center !important;
        white-space: nowrap !important;
      }
      .is-year-end .cye-avg-chip {
        background: #ffffff !important;
        border: 1.5px solid #10b981 !important;
        color: #047857 !important;
        padding: 2px 8px !important;
        border-radius: 4px !important;
        font-size: ${isLandscape ? '9.5pt' : '10pt'} !important;
        font-weight: 800 !important;
      }
      .is-year-end .cye-rank-chip {
        background: #fef3c7 !important;
        border: 1.5px solid #f59e0b !important;
        color: #b45309 !important;
        padding: 2px 8px !important;
        border-radius: 4px !important;
        font-size: ${isLandscape ? '9.5pt' : '10pt'} !important;
        font-weight: 800 !important;
      }

      /* 5. Footer Signatures */
      .is-year-end .cye-footer-grid {
        display: grid !important;
        grid-template-columns: repeat(3, 1fr) !important;
        align-items: center !important;
        gap: 16px !important;
        border-top: 1.5px dashed rgba(180, 83, 9, 0.35) !important;
        padding-top: 6px !important;
        margin-top: 3px !important;
      }
      .is-year-end .cye-sig-item {
        text-align: center !important;
      }
      .is-year-end .cye-sig-title {
        font-size: ${isLandscape ? '10pt' : '10.5pt'} !important;
        font-weight: 900 !important;
        color: #0f172a !important;
        display: block !important;
      }
      .is-year-end .cye-sig-person {
        font-size: ${isLandscape ? '9.5pt' : '10pt'} !important;
        font-weight: 800 !important;
        color: #475569 !important;
        display: block !important;
        margin-top: 2px !important;
      }
      .is-year-end .cye-sig-dots {
        font-size: ${isLandscape ? '8.5pt' : '9pt'} !important;
        color: #94a3b8 !important;
        margin-top: 4px !important;
      }

      /* 6. Legal & Security Strip */
      .is-year-end .cye-security-strip {
        display: flex !important;
        justify-content: center !important;
        text-align: center !important;
        font-size: ${isLandscape ? '8pt' : '8.5pt'} !important;
        color: #94a3b8 !important;
        border-top: 1px solid #e2e8f0 !important;
        padding-top: 3px !important;
        margin-top: 3px !important;
      }

      .no-print {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }
    `;
  }

  // 19. Batch Archive Modal & Actions
  window.certOpenArchiveModal = function() {
    const modal = document.getElementById('certArchiveModal');
    if (modal) {
      modal.classList.add('open');
      renderCertArchiveList();
    }
  };

  window.certCloseArchiveModal = function() {
    const modal = document.getElementById('certArchiveModal');
    if (modal) modal.classList.remove('open');
  };

  // 19.1 Certificate Category State & Dual Switcher (الشهادة التقديرية vs شهادة الدرجات)
  function isGradesModeActive() {
    return isGradesModeBatch(activeBatch);
  }

  function updateCategorySwitcherUI() {
    const isGrades = isGradesModeActive();

    // 0. Header Toolbar Mode Pills (معاينة الشريط العلوي السريعة)
    const pillApprec = document.getElementById('certModePillApprec');
    const pillGrades = document.getElementById('certModePillGrades');
    if (pillApprec) {
      pillApprec.className = isGrades ? 'btn btn-sm btn-outline' : 'btn btn-sm btn-primary';
      pillApprec.style.boxShadow = isGrades ? 'none' : '0 2px 8px rgba(245, 158, 11, 0.3)';
    }
    if (pillGrades) {
      pillGrades.className = isGrades ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-outline';
      pillGrades.style.boxShadow = isGrades ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none';
    }

    // 1. Dual Main Switcher Buttons
    const btnApprec = document.getElementById('certBtnCategoryAppreciation');
    const btnGrades = document.getElementById('certBtnCategoryGrades');
    if (btnApprec) btnApprec.classList.toggle('active', !isGrades);
    if (btnGrades) btnGrades.classList.toggle('active', isGrades);

    // 2. Return Bar Top Pills
    const topPillApprec = document.getElementById('certTopPillAppreciation');
    const topPillGrades = document.getElementById('certTopPillGrades');
    if (topPillApprec) topPillApprec.classList.toggle('active', !isGrades);
    if (topPillGrades) topPillGrades.classList.toggle('active', isGrades);

    // 3. Quick Toolbar Buttons
    const qApprec = document.getElementById('certQuickAppreciationBtn');
    const qGrades = document.getElementById('certQuickGradesBtn');
    if (qApprec) {
      qApprec.classList.toggle('btn-primary', !isGrades);
      qApprec.classList.toggle('btn-outline', isGrades);
    }
    if (qGrades) {
      qGrades.classList.toggle('btn-primary', isGrades);
      qGrades.classList.toggle('btn-outline', !isGrades);
    }

    // 4. Return Bar Info
    const returnPill = document.getElementById('certReturnAppPill');
    const returnTitle = document.getElementById('certReturnAppTitle');
    if (returnPill) {
      if (isGrades) {
        returnPill.style.background = 'linear-gradient(135deg, #0284c7, #0369a1)';
        returnPill.innerHTML = '<i class="fa-solid fa-graduation-cap"></i> شهادة درجات';
      } else {
        returnPill.style.background = 'linear-gradient(135deg, #b45309, #d97706)';
        returnPill.innerHTML = '<i class="fa-solid fa-award"></i> شهادة تقديرية';
      }
    }
    if (returnTitle) {
      returnTitle.innerText = isGrades 
        ? 'استوديو شهادات وكشوفات درجات نهاية السنة الرسمية'
        : 'استوديو إصدار شهادات التقدير والتفوق للطلبة';
    }

    // 5. Hero Dashboard Labels & Badges
    const heroIcon = document.getElementById('certHeroIconBadge');
    const heroTitle = document.getElementById('certHeroTitleText');
    const heroBadge = document.getElementById('certHeroBadgeText');
    const heroSub = document.getElementById('certHeroSubText');
    const heroPreviewBtnText = document.getElementById('certHeroPreviewBtnText');
    const topPreviewBtnLabel = document.getElementById('certTopPreviewBtnLabel');

    if (heroIcon) {
      heroIcon.innerHTML = isGrades ? '<i class="fa-solid fa-graduation-cap"></i>' : '<i class="fa-solid fa-award"></i>';
      heroIcon.style.color = isGrades ? '#0284c7' : '#f59e0b';
      heroIcon.style.background = isGrades 
        ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.15), rgba(3, 105, 161, 0.22))'
        : 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.25))';
    }

    if (heroTitle) {
      heroTitle.innerText = isGrades
        ? 'استوديو وثائق وكشوفات درجات نهاية السنة الرسمية 📊'
        : 'استوديو تصميم وإصدار شهادات التقدير والتفوق المدرسي 🏅';
    }

    if (heroBadge) {
      heroBadge.innerText = isGrades
        ? 'وثيقة درجات معتمدة بمواد وسعي رسمي 🎓'
        : 'طباعة رسمية A4 فاخرة 👑';
      heroBadge.style.background = isGrades ? 'rgba(2, 132, 199, 0.15)' : 'rgba(245, 158, 11, 0.15)';
      heroBadge.style.color = isGrades ? '#0284c7' : '#b45309';
    }

    if (heroSub) {
      heroSub.innerText = isGrades
        ? 'إصدار وثائق وكشوفات درجات نهاية السنة المعتمدة، جداول المواد، درجات السعي والامتحان النهائي، المجموع العام والقرار الوزاري، طباعة A4 فاخرة وتصدير PDF جماعي وفردي.'
        : 'توليد شهادات تقدير وطباعتها على ورق A4 بجودة مطبعية 300DPI، استيراد من Excel وسجل الدرجات، تصاميم مذهبة ملكية وأختام الشرف الرسمية.';
    }

    const heroPreviewBtn = document.getElementById('certHeroPreviewBtn');
    if (heroPreviewBtn) {
      heroPreviewBtn.style.background = isGrades
        ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
        : 'linear-gradient(135deg, #b45309 0%, #d97706 100%)';
      heroPreviewBtn.style.boxShadow = isGrades
        ? '0 4px 18px rgba(2, 132, 199, 0.35)'
        : '0 4px 18px rgba(217, 119, 6, 0.35)';
    }

    if (heroPreviewBtnText) {
      heroPreviewBtnText.innerText = isGrades ? 'معاينة وثيقة درجات نهاية السنة A4' : 'معاينة ورقة الشهادة التقديرية A4';
    }
    if (topPreviewBtnLabel) {
      topPreviewBtnLabel.innerText = isGrades ? 'معاينة وثيقة الدرجات' : 'معاينة الشهادة التقديرية';
    }

    // 6. Commendation & Tribute Customizer Panel (تظهر فقط في قسم شهادة التقدير وتختفي في قسم شهادة الدرجات)
    const commendationPanel = document.getElementById('certCommendationPanelCard');
    const panelsGrid = document.getElementById('certPanelsGrid');
    if (commendationPanel) {
      commendationPanel.style.display = isGrades ? 'none' : '';
    }
    if (panelsGrid) {
      panelsGrid.classList.toggle('grades-mode-grid', isGrades);
    }
  }

  window.certSwitchCategory = function(category) {
    if (!activeBatch) return;

    if (category === 'grades') {
      activeBatch.certCategory = 'grades';
      activeBatch.isYearEndMode = true;
      activeBatch.certType = 'شهادة درجات نهاية السنة الرسمية';
      if (activeBatch.students) {
        activeBatch.students.forEach(st => ensureStudentSubjects(st));
      }
      if (typeof window.showToast === 'function') {
        window.showToast('تم التبديل إلى: شهادة الدرجات وكشف المواد الرسمي 🎓📊', 'info');
      }
    } else {
      activeBatch.certCategory = 'appreciation';
      activeBatch.isYearEndMode = false;
      activeBatch.certType = 'شهادة شكر وتقدير وتفوق';
      if (typeof window.showToast === 'function') {
        window.showToast('تم التبديل إلى: الشهادة التقديرية والتفوق المدرسي 🏅', 'info');
      }
    }

    const select = document.getElementById('certTypeSelect');
    if (select) select.value = activeBatch.certType;

    updateCategorySwitcherUI();
    renderLiveCertificatePreview();
    renderStudentsManagerTable();
    triggerAutoSave();
  };

  window.certToggleYearEndMode = function() {
    const isGrades = isGradesModeActive();
    window.certSwitchCategory(isGrades ? 'appreciation' : 'grades');
  };

  // 19.3 Smart Date Calendar & Device Synchronization
  window.certOpenCalendarPicker = function() {
    const nativePicker = document.getElementById('certIssueDatePickerNative');
    if (!nativePicker) return;
    try {
      if (typeof nativePicker.showPicker === 'function') {
        nativePicker.showPicker();
      } else {
        nativePicker.focus();
        nativePicker.click();
      }
    } catch(e) {
      nativePicker.focus();
      nativePicker.click();
    }
  };

  window.certOnNativeDatePicked = function(isoStr) {
    if (!isoStr) return;
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const formatted = getDeviceLocalDateFormatted(d);
      const elText = document.getElementById('certIssueDateInput');
      if (elText) elText.value = formatted;
      window.certUpdateMetaField('issueDate', formatted);
      if (typeof window.showToast === 'function') {
        window.showToast(`تم تحديد التاريخ: ${formatted} 📅`, 'success');
      }
    }
  };

  window.certSyncTodayDate = function() {
    const now = new Date();
    const formatted = getDeviceLocalDateFormatted(now);
    const isoStr = getDeviceLocalDateIso(now);
    const elText = document.getElementById('certIssueDateInput');
    const nativePicker = document.getElementById('certIssueDatePickerNative');
    if (elText) elText.value = formatted;
    if (nativePicker) nativePicker.value = isoStr;
    window.certUpdateMetaField('issueDate', formatted);
    if (typeof window.showToast === 'function') {
      window.showToast(`تمت مزامنة التاريخ مع جهازك: ${formatted} 🔄`, 'success');
    }
  };

  window.masarGetDeviceDateFormatted = getDeviceLocalDateFormatted;
  window.masarGetDeviceDateIso = getDeviceLocalDateIso;

  let editingStudentIndexForGrades = -1;
  let editingStudentSubjectsTemp = [];

  window.certOpenStudentGradesModal = function(index) {
    if (!activeBatch || !activeBatch.students || !activeBatch.students[index]) return;
    editingStudentIndexForGrades = index;
    const st = activeBatch.students[index];
    const subs = ensureStudentSubjects(st);
    editingStudentSubjectsTemp = JSON.parse(JSON.stringify(subs));

    const modal = document.getElementById('certStudentGradesEditorModal');
    const title = document.getElementById('certGradesModalStudentNameTitle');
    const seatInput = document.getElementById('certModalSeatNumberInput');

    if (title) title.innerText = `كشف مواد ودرجات الطالب: ${st.name || 'طالب'}`;
    if (seatInput) seatInput.value = st.seatNumber || `10${String(index + 1).padStart(3, '0')}`;

    renderModalSubjectsTable();
    if (modal) modal.classList.add('open');
  };

  window.certCloseStudentGradesModal = function() {
    const modal = document.getElementById('certStudentGradesEditorModal');
    if (modal) modal.classList.remove('open');
    editingStudentIndexForGrades = -1;
  };

  function getAppClassSlug(app) {
    if (!app) return 'pass';
    if (app.includes('امتياز')) return 'excellent';
    if (app.includes('جيد جداً') || app.includes('جيد جدا')) return 'vgood';
    if (app.includes('جيد')) return 'good';
    if (app.includes('متوسط')) return 'medium';
    if (app.includes('مقبول')) return 'pass';
    return 'fail';
  }

  function updateModalLiveSummary() {
    const countEl = document.getElementById('cgSumSubjectsCount');
    const totalEl = document.getElementById('cgSumTotalScore');
    const avgEl = document.getElementById('cgSumAverage');
    const badgeEl = document.getElementById('cgSumStatusBadge');

    const subs = editingStudentSubjectsTemp || [];
    if (subs.length === 0) {
      if (countEl) countEl.textContent = '0';
      if (totalEl) totalEl.textContent = '0';
      if (avgEl) avgEl.textContent = '0%';
      if (badgeEl) {
        badgeEl.textContent = 'لا توجد مواد';
        badgeEl.className = 'cg-sum-badge';
      }
      return;
    }

    let sum = 0;
    let failed = 0;
    subs.forEach(s => {
      const eff = Number(s.effort) || 0;
      const fin = Number(s.finalExam) || 0;
      const total = (s.finalScore !== undefined && s.finalScore !== null) ? Number(s.finalScore) : Math.round((eff + fin) / 2);
      sum += total;
      if (total < 50) failed++;
    });

    const avg = (sum / subs.length).toFixed(1);
    const isPassed = failed === 0;

    if (countEl) countEl.textContent = `${subs.length} مادة`;
    if (totalEl) totalEl.textContent = `${sum} / ${subs.length * 100}`;
    if (avgEl) avgEl.textContent = `${avg}%`;
    if (badgeEl) {
      if (isPassed) {
        badgeEl.textContent = 'ناجح ومؤهل 🏆';
        badgeEl.className = 'cg-sum-badge cg-sum-pass';
      } else {
        badgeEl.textContent = `مكمل (${failed} مواد) ⚠️`;
        badgeEl.className = 'cg-sum-badge cg-sum-fail';
      }
    }
  }

  function renderModalSubjectsTable() {
    const tbody = document.getElementById('certModalSubjectsTableBody');
    if (!tbody) return;

    if (!editingStudentSubjectsTemp || editingStudentSubjectsTemp.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:35px; color:#94a3b8; font-size:0.9rem;">لا توجد مواد مضافة حالياً. انقر على "المنهج العراقي القياسي" للبدء.</td></tr>`;
      updateModalLiveSummary();
      return;
    }

    tbody.innerHTML = editingStudentSubjectsTemp.map((sub, sIdx) => {
      const eff = Number(sub.effort) || 0;
      const fin = Number(sub.finalExam) || 0;
      const total = Math.round((eff + fin) / 2);
      const app = getAppreciationArabic(total);
      const isPass = total >= 50;
      const isFirst = (sIdx === 0);
      const isLast = (sIdx === editingStudentSubjectsTemp.length - 1);

      return `
        <tr class="cg-row-item" data-sidx="${sIdx}">
          <td class="cg-cell-seq">
            <span class="cg-seq-pill">${sIdx + 1}</span>
          </td>
          <td class="cg-cell-name">
            <input type="text" class="cg-input-name" value="${escapeHtml(sub.name)}" placeholder="اسم المادة الدراسية..." oninput="window.certModalUpdateSubjectField(${sIdx}, 'name', this.value, this)" />
          </td>
          <td class="cg-cell-score">
            <input type="number" min="0" max="100" class="cg-input-number" value="${eff}" oninput="window.certModalUpdateSubjectField(${sIdx}, 'effort', this.value, this)" />
          </td>
          <td class="cg-cell-score">
            <input type="number" min="0" max="100" class="cg-input-number" value="${fin}" oninput="window.certModalUpdateSubjectField(${sIdx}, 'finalExam', this.value, this)" />
          </td>
          <td class="cg-cell-total">
            <span class="cg-score-total-val ${isPass ? 'is-pass' : 'is-fail'}">${total}</span>
          </td>
          <td class="cg-cell-appreciation">
            <span class="cg-badge-app cg-app-${getAppClassSlug(app)}">${app}</span>
          </td>
          <td class="cg-cell-reorder">
            <div class="cg-reorder-group">
              <button type="button" class="btn-cg-reorder btn-cg-up" onclick="window.certModalMoveSubjectUp(${sIdx})" ${isFirst ? 'disabled style="opacity:0.25;cursor:not-allowed;"' : ''} title="تصعيد للأعلى 🔼">
                <i class="fa-solid fa-chevron-up"></i>
              </button>
              <button type="button" class="btn-cg-reorder btn-cg-down" onclick="window.certModalMoveSubjectDown(${sIdx})" ${isLast ? 'disabled style="opacity:0.25;cursor:not-allowed;"' : ''} title="تنزيل للأسفل 🔽">
                <i class="fa-solid fa-chevron-down"></i>
              </button>
            </div>
          </td>
          <td class="cg-cell-action">
            <button type="button" class="btn-cg-delete" onclick="window.certModalDeleteSubject(${sIdx})" title="حذف المادة">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    updateModalLiveSummary();
  }

  window.certModalMoveSubjectUp = function(sIdx) {
    if (!editingStudentSubjectsTemp || sIdx <= 0) return;
    const item = editingStudentSubjectsTemp.splice(sIdx, 1)[0];
    editingStudentSubjectsTemp.splice(sIdx - 1, 0, item);
    renderModalSubjectsTable();
  };

  window.certModalMoveSubjectDown = function(sIdx) {
    if (!editingStudentSubjectsTemp || sIdx >= editingStudentSubjectsTemp.length - 1) return;
    const item = editingStudentSubjectsTemp.splice(sIdx, 1)[0];
    editingStudentSubjectsTemp.splice(sIdx + 1, 0, item);
    renderModalSubjectsTable();
  };

  window.certModalUpdateSubjectField = function(sIdx, field, value, inputEl) {
    if (!editingStudentSubjectsTemp[sIdx]) return;
    editingStudentSubjectsTemp[sIdx][field] = value;
    if (field === 'effort' || field === 'finalExam') {
      const eff = Number(editingStudentSubjectsTemp[sIdx].effort) || 0;
      const fin = Number(editingStudentSubjectsTemp[sIdx].finalExam) || 0;
      const total = Math.round((eff + fin) / 2);
      editingStudentSubjectsTemp[sIdx].finalScore = total;

      if (inputEl) {
        const row = inputEl.closest('tr');
        if (row) {
          const totalValEl = row.querySelector('.cg-score-total-val');
          const badgeEl = row.querySelector('.cg-badge-app');
          const app = getAppreciationArabic(total);
          const isPass = total >= 50;
          if (totalValEl) {
            totalValEl.textContent = total;
            totalValEl.className = `cg-score-total-val ${isPass ? 'is-pass' : 'is-fail'}`;
          }
          if (badgeEl) {
            badgeEl.textContent = app;
            badgeEl.className = `cg-badge-app cg-app-${getAppClassSlug(app)}`;
          }
        }
      }
      updateModalLiveSummary();
    }
  };

  window.certModalAddNewSubject = function() {
    editingStudentSubjectsTemp.push({
      id: 'sub_' + Date.now(),
      name: 'مادة دراسية إضافية',
      effort: 90,
      finalExam: 95,
      maxScore: 100
    });
    renderModalSubjectsTable();
  };

  window.certModalResetToStandardCurriculum = function() {
    editingStudentSubjectsTemp = DEFAULT_YEAR_END_SUBJECTS.map((s, idx) => ({
      id: 'sub_' + (idx + 1),
      name: s.name,
      effort: s.effort,
      finalExam: s.finalExam,
      maxScore: 100
    }));
    renderModalSubjectsTable();
    if (typeof window.showToast === 'function') {
      window.showToast('تمت استعادة مواد المنهج العراقي القياسي (11 مادة) 🇮🇶', 'info');
    }
  };

  window.certModalDeleteSubject = function(sIdx) {
    if (editingStudentSubjectsTemp.length <= 1) {
      if (typeof window.showToast === 'function') {
        window.showToast('يجب أن تحتوي الشهادة على مادة دراسية واحدة على الأقل.', 'warning');
      }
      return;
    }
    editingStudentSubjectsTemp.splice(sIdx, 1);
    renderModalSubjectsTable();
  };

  window.certSaveStudentGradesFromModal = function() {
    if (editingStudentIndexForGrades < 0 || !activeBatch || !activeBatch.students[editingStudentIndexForGrades]) return;
    const st = activeBatch.students[editingStudentIndexForGrades];
    st.subjects = JSON.parse(JSON.stringify(editingStudentSubjectsTemp));

    const seatInput = document.getElementById('certModalSeatNumberInput');
    if (seatInput) st.seatNumber = seatInput.value.trim();

    const metrics = calculateStudentSubjectsMetrics(st);
    st.score = String(metrics.average);
    st.customNote = `المعدل العام: ${metrics.average}% - ${metrics.overallAppreciation}`;

    renderLiveCertificatePreview();
    renderStudentsManagerTable();
    triggerAutoSave();
    window.certCloseStudentGradesModal();

    if (typeof window.showToast === 'function') {
      window.showToast(`تم حفظ وتحديث درجات الطالب (${st.name}) بنجاح 💾`, 'success');
    }
  };

  function renderCertArchiveList() {
    const listWrap = document.getElementById('certArchiveListWrapper');
    if (!listWrap) return;

    if (batches.length === 0) {
      listWrap.innerHTML = `
        <div style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          لا توجد دفعات شهادات محفوظة في الأرشيف حالياً.
        </div>
      `;
      return;
    }

    listWrap.innerHTML = batches.map((b, idx) => {
      const isCurrent = activeBatch && activeBatch.id === b.id;
      const studentCount = b.students ? b.students.length : 0;
      return `
        <div class="cert-archive-card ${isCurrent ? 'active' : ''}">
          <div class="cert-archive-card-main">
            <div class="cert-archive-badge">
              <i class="fa-solid fa-graduation-cap"></i>
            </div>
            <div>
              <div style="font-weight: 800; font-size: 1.05rem; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
                <span>${escapeHtml(b.title || 'دفعة شهادات')}</span>
                ${isCurrent ? '<span class="badge-tag" style="background:#10b981; color:#fff; font-size:0.68rem;">الدفعة الحالية النشطة ✔</span>' : ''}
              </div>
              <small style="color: var(--text-muted); font-size: 0.8rem; display: block; margin-top: 3px;">
                ${[b.schoolName, b.gradeLevel, b.section].filter(Boolean).map(escapeHtml).join(' • ')}${b.schoolName || b.gradeLevel || b.section ? ' • ' : ''}(${studentCount} طالب)
              </small>
            </div>
          </div>
          <div class="cert-archive-actions">
            <button type="button" class="btn btn-primary btn-sm" onclick="window.certSelectBatchFromArchive('${b.id}')" title="فتح وتحرير هذه الدفعة">
              <i class="fa-solid fa-folder-open"></i> فتح الدفعة
            </button>
            <button type="button" class="btn btn-soft-danger btn-sm" onclick="window.certExportBatchPdfFromArchive('${b.id}')" title="تنزيل وحفظ كافة شهادات هذه الدفعة كملف PDF لجهازك">
              <i class="fa-solid fa-file-pdf"></i> تنزيل PDF
            </button>
            <button type="button" class="btn btn-outline btn-sm" onclick="window.certPrintBatchFromArchive('${b.id}')" title="طباعة كافة شهادات هذه الدفعة فوراً">
              <i class="fa-solid fa-print"></i> طباعة الكل
            </button>
            ${batches.length > 1 ? `
              <button type="button" class="btn btn-delete btn-sm" onclick="window.certDeleteBatchFromArchive('${b.id}')" title="حذف هذه الدفعة من الأرشيف">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  window.certSelectBatchFromArchive = function(batchId) {
    const target = batches.find(b => b.id === batchId);
    if (!target) return;
    activeBatch = target;
    activeStudentIndex = 0;
    saveBatches(false);
    renderBatchMetaForm();
    renderLiveCertificatePreview();
    renderStudentsManagerTable();
    window.certCloseArchiveModal();
    if (typeof window.showToast === 'function') {
      window.showToast(`تم فتح دفعة شهادات: ${activeBatch.title} 📂`, 'success');
    }
  };

  window.certExportBatchPdfFromArchive = function(batchId) {
    const target = batches.find(b => b.id === batchId);
    if (!target) return;
    activeBatch = target;
    activeStudentIndex = 0;
    window.certCloseArchiveModal();
    window.certExportBatchPdf();
  };

  window.certPrintBatchFromArchive = function(batchId) {
    const target = batches.find(b => b.id === batchId);
    if (!target) return;
    window.certCloseArchiveModal();
    printCertificates(target.students || [], target);
  };

  window.certDeleteBatchFromArchive = function(batchId) {
    const target = batches.find(b => b.id === batchId);
    if (!target) return;
    if (!confirm(`هل أنت متأكد من حذف دفعة "${target.title}" نهائياً من الأرشيف؟`)) return;

    batches = batches.filter(b => b.id !== batchId);
    if (activeBatch && activeBatch.id === batchId) {
      activeBatch = batches[0] || null;
      activeStudentIndex = 0;
    }
    saveBatches(false);
    renderBatchMetaForm();
    renderLiveCertificatePreview();
    renderStudentsManagerTable();
    renderCertArchiveList();
    if (typeof window.showToast === 'function') {
      window.showToast('تم حذف الدفعة من الأرشيف بنجاح 🗑️', 'info');
    }
  };

  window.certCreateNewBatch = function() {
    const newB = createDefaultCertBatch();
    newB.title = `دفعة شهادات جديدة (${batches.length + 1})`;
    batches.unshift(newB);
    activeBatch = newB;
    activeStudentIndex = 0;
    saveBatches(false);
    renderBatchMetaForm();
    renderLiveCertificatePreview();
    renderStudentsManagerTable();
    if (typeof window.showToast === 'function') {
      window.showToast('تم إنشاء دفعة شهادات جديدة وجاهزة للتخصيص 🎉', 'success');
    }
  };

  // 20. Initialization
  function initCertificatesStudio() {
    loadBatches();
    renderBatchMetaForm();
    updateCategorySwitcherUI();
    renderLiveCertificatePreview();
    renderStudentsManagerTable();
  }

  window.renderCertificatesStudio = function() {
    initCertificatesStudio();
  };

  // Expose module globally
  window.CertificatesStudioModule = {
    init: initCertificatesStudio,
    getActiveBatch: () => activeBatch,
    getBatches: () => batches,
    renderPreview: renderLiveCertificatePreview,
    importBatchDirectly: function(newBatch) {
      if (!newBatch) return;
      batches.unshift(newBatch);
      activeBatch = newBatch;
      activeStudentIndex = 0;
      saveBatches(false);
      renderBatchMetaForm();
      renderLiveCertificatePreview();
      renderStudentsManagerTable();
    }
  };

  // Auto-init on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCertificatesStudio);
  } else {
    setTimeout(initCertificatesStudio, 100);
  }

  // Handle Ctrl+P / Cmd+P print intercept when certificates tab is active
  window.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
      const tabCert = document.getElementById('tab-certificates');
      if (tabCert && tabCert.style.display !== 'none') {
        e.preventDefault();
        e.stopPropagation();
        window.certPrintAllBatch();
      }
    }
  }, true);

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

})();
