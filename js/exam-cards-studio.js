/**
 * ==========================================================================
 * استوديو البطاقة الامتحانية وباجة الاختبارات المدرسية (Exam Admission ID Studio)
 * التطبيق رقم 10 في منصة مسار المعلم الذكي - الإصدار السيادي 5.5
 * ==========================================================================
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'masar_exam_cards_data_v1';

  // State
  let cardsData = null;
  let activeStudioView = 'cards'; // 'cards' (A4 Print Grid) | 'single' (Large Badge Preview) | 'table' (Roster List)
  let activeStudentIndex = 0; // For single preview mode
  let activeFilterGrade = 'all';

  // Default Seeding
  function getDefaultCardsData() {
    const cur = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    const school = (cur && cur.school) ? cur.school : 'ثانوية المتميزين للبنين';
    const gov = (cur && cur.governorate) ? cur.governorate : 'بغداد / الرصافة الأولى';

    const sampleTimetable = [
      { subject: 'التربية الإسلامية والقرآن', date: 'الأحد 12 / 01', time: '08:00 صباحاً' },
      { subject: 'اللغة العربية والإنشاء', date: 'الثلاثاء 14 / 01', time: '08:00 صباحاً' },
      { subject: 'اللغة الإنكليزية', date: 'الخميس 16 / 01', time: '08:00 صباحاً' },
      { subject: 'الرياضيات', date: 'الأحد 19 / 01', time: '08:00 صباحاً' },
      { subject: 'الاجتماعيات (التاريخ والجغرافية)', date: 'الثلاثاء 21 / 01', time: '08:00 صباحاً' },
      { subject: 'العلوم العامة والفيزياء', date: 'الخميس 23 / 01', time: '08:00 صباحاً' }
    ];

    const sampleStudents = [
      { id: 'ec_1', name: 'أحمد علي عبد الحسين', motherName: 'فاطمة كريم', dob: '2009 / 4 / 15', school: school, governorate: gov, rollNo: '1001', className: 'الثالث متوسط (أ)', hallName: 'القاعة (1)', seatNo: 1, photoUrl: '' },
      { id: 'ec_2', name: 'حيدر محمد رضا الباقر', motherName: 'زينب جواد', dob: '2009 / 7 / 20', school: school, governorate: gov, rollNo: '1002', className: 'الثالث متوسط (أ)', hallName: 'القاعة (1)', seatNo: 2, photoUrl: '' },
      { id: 'ec_3', name: 'مصطفى صادق جاسم', motherName: 'مريم هاشم', dob: '2008 / 11 / 03', school: school, governorate: gov, rollNo: '1003', className: 'الثالث متوسط (أ)', hallName: 'القاعة (1)', seatNo: 3, photoUrl: '' },
      { id: 'ec_4', name: 'زين العابدين خليل إبراهيم', motherName: 'أم البنين صالح', dob: '2009 / 1 / 18', school: school, governorate: gov, rollNo: '1004', className: 'الثالث متوسط (أ)', hallName: 'القاعة (1)', seatNo: 4, photoUrl: '' },
      { id: 'ec_5', name: 'كرار مهدي صالح', motherName: 'خديجة رحيم', dob: '2009 / 9 / 25', school: school, governorate: gov, rollNo: '1005', className: 'الثالث متوسط (أ)', hallName: 'القاعة (1)', seatNo: 5, photoUrl: '' },
      { id: 'ec_6', name: 'يوسف رعد عبد الأمير', motherName: 'نور الهدى حميد', dob: '2008 / 12 / 10', school: school, governorate: gov, rollNo: '1006', className: 'الثالث متوسط (أ)', hallName: 'القاعة (1)', seatNo: 6, photoUrl: '' },
      { id: 'ec_7', name: 'سجاد قاسم كريم', motherName: 'زهراء طالب', dob: '2009 / 3 / 30', school: school, governorate: gov, rollNo: '1007', className: 'الثالث متوسط (أ)', hallName: 'القاعة (1)', seatNo: 7, photoUrl: '' },
      { id: 'ec_8', name: 'عباس فاضل كاظم', motherName: 'سعاد رشيد', dob: '2009 / 6 / 14', school: school, governorate: gov, rollNo: '1008', className: 'الثالث متوسط (أ)', hallName: 'القاعة (1)', seatNo: 8, photoUrl: '' }
    ];

    return {
      schoolName: school,
      governorate: gov,
      ministryTitle: 'وزارة التربية / المديرية العامة للتقويم والامتحانات',
      examTitle: 'بطاقة الاشتراك في الامتحانات العامة',
      studyStage: 'للدراسة المتوسطة',
      examRound: 'الدور الأول',
      academicYear: '201 _ 201',
      cardsPerPage: 4, // 2 | 4 | 6 | 8
      cardColor: 'blue', // 'blue' | 'red'
      cardTheme: 'ministerialBlue', // ministerialBlue | ministerialRed | royalIndigo | officialGold | emeraldGreen | rubyBurgundy
      cardTemplate: 'ministerialOfficial', // ministerialOfficial | modernBadge
      printBlank: false, // true = Blank template matching official form | false = Filled with student data
      principalName: 'أ. حسين علي فاضل',
      principalTitle: 'اسم المدير',
      showPhoto: true,
      showQr: true,
      showBarcode: true,
      showHallInfo: true,
      showTimetable: true,
      showStamp: true,
      showPrincipalSign: true,
      instructionsText: '1. يمنع منعاً باتاً إدخال أجهزة الهاتف النقال والساعات الذكية داخل القاعة الامتحانية.\n2. إبراز هذه البطاقة شرط إلزامي وأساسي للسماح بدخول كافة الامتحانات.\n3. الالتزام بالزي المدرسي والحضور قبل بدء الامتحان بنصف ساعة.',
      timetable: sampleTimetable,
      students: sampleStudents
    };
  }

  function loadCardsData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        cardsData = JSON.parse(raw);
        if (!cardsData.students) cardsData.students = [];
        if (!cardsData.timetable || cardsData.timetable.length === 0) {
          cardsData.timetable = getDefaultCardsData().timetable;
        }
        // Upgrade existing data to ministerial template
        if (!cardsData.cardColor) cardsData.cardColor = 'blue';
        if (!cardsData.cardTemplate) cardsData.cardTemplate = 'ministerialOfficial';
        if (!cardsData.studyStage) cardsData.studyStage = 'للدراسة المتوسطة';
        if (!cardsData.academicYear || cardsData.academicYear === '2024 - 2025 م') cardsData.academicYear = '201 _ 201';
        if (cardsData.printBlank === undefined) cardsData.printBlank = false;
        if (!cardsData.ministryTitle || cardsData.ministryTitle === 'جمهورية العراق - وزارة التربية') {
          cardsData.ministryTitle = 'وزارة التربية / المديرية العامة للتقويم والامتحانات';
        }
        if (!cardsData.examTitle || cardsData.examTitle === 'البطاقة الامتحانية الرسمية لدخول الاختبارات') {
          cardsData.examTitle = 'بطاقة الاشتراك في الامتحانات العامة';
        }
        if (!cardsData.principalName) cardsData.principalName = 'أ. حسين علي فاضل';
        if (!cardsData.principalTitle) cardsData.principalTitle = 'اسم المدير';
        if (!cardsData.cardTheme || cardsData.cardTheme === 'royalIndigo') {
          cardsData.cardTheme = (cardsData.cardColor === 'red') ? 'ministerialRed' : 'ministerialBlue';
        }
        // Ensure student fields
        cardsData.students.forEach(st => {
          if (!st.motherName) st.motherName = 'فاطمة كريم';
          if (!st.dob) st.dob = '2009 / 4 / 15';
          if (!st.school) st.school = cardsData.schoolName || 'ثانوية المتميزين للبنين';
          if (!st.governorate) st.governorate = cardsData.governorate || 'بغداد / الرصافة الأولى';
        });
      } else {
        cardsData = getDefaultCardsData();
        saveCardsData(false);
      }
    } catch (e) {
      console.warn('loadCardsData failed:', e);
      cardsData = getDefaultCardsData();
    }
  }

  function saveCardsData(showToastFeedback = true) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cardsData));
      if (showToastFeedback && typeof showToast === 'function') {
        showToast('تم حفظ بيانات البطاقات الامتحانية بنجاح 💾', 'success');
      }
      const badge = document.getElementById('examCardsSaveStatusBadge');
      if (badge) {
        badge.innerHTML = '<i class="fa-solid fa-check"></i> تم الحفظ';
        setTimeout(() => {
          if (badge) badge.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> محفوظ تلقائياً';
        }, 2500);
      }
    } catch (e) {
      console.error('saveCardsData failed:', e);
    }
  }

  // Escape HTML helper
  function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Color Switcher & UI Sync
  function updateColorButtons() {
    if (!cardsData) return;
    const isRed = (cardsData.cardColor === 'red' || cardsData.cardTheme === 'ministerialRed');
    const color = isRed ? 'red' : 'blue';

    // Top Quick Toggle
    const topBlue = document.getElementById('ecTopColorBlue');
    const topRed = document.getElementById('ecTopColorRed');
    if (topBlue && topRed) {
      if (color === 'blue') {
        topBlue.classList.add('active');
        topBlue.style.borderColor = '#0b3577';
        topBlue.style.background = '#eff6ff';
        topBlue.style.color = '#0b3577';
        topRed.classList.remove('active');
        topRed.style.borderColor = '#cbd5e1';
        topRed.style.background = '#ffffff';
        topRed.style.color = '#64748b';
      } else {
        topRed.classList.add('active');
        topRed.style.borderColor = '#a81111';
        topRed.style.background = '#fef2f2';
        topRed.style.color = '#a81111';
        topBlue.classList.remove('active');
        topBlue.style.borderColor = '#cbd5e1';
        topBlue.style.background = '#ffffff';
        topBlue.style.color = '#64748b';
      }
    }

    // Sidebar color buttons
    const sideBlue = document.getElementById('ecColorBtnBlue');
    const sideRed = document.getElementById('ecColorBtnRed');
    const badge = document.getElementById('ecColorBadge');
    if (sideBlue && sideRed) {
      if (color === 'blue') {
        sideBlue.classList.add('active');
        sideBlue.style.borderColor = '#0b3577';
        sideBlue.style.background = '#eff6ff';
        sideBlue.style.color = '#0b3577';
        sideRed.classList.remove('active');
        sideRed.style.borderColor = '#cbd5e1';
        sideRed.style.background = '#ffffff';
        sideRed.style.color = '#64748b';
        if (badge) {
          badge.textContent = 'أزرق وزاري 🔵';
          badge.style.background = '#eff6ff';
          badge.style.color = '#0b3577';
          badge.style.borderColor = '#93c5fd';
        }
      } else {
        sideRed.classList.add('active');
        sideRed.style.borderColor = '#a81111';
        sideRed.style.background = '#fef2f2';
        sideRed.style.color = '#a81111';
        sideBlue.classList.remove('active');
        sideBlue.style.borderColor = '#cbd5e1';
        sideBlue.style.background = '#ffffff';
        sideBlue.style.color = '#64748b';
        if (badge) {
          badge.textContent = 'أحمر وزاري 🔴';
          badge.style.background = '#fef2f2';
          badge.style.color = '#a81111';
          badge.style.borderColor = '#fca5a5';
        }
      }
    }
  }

  function updateTopBlankButton() {
    if (!cardsData) return;
    const btn = document.getElementById('ecTopToggleBlankBtn');
    if (btn) {
      if (cardsData.printBlank) {
        btn.classList.add('active');
        btn.innerHTML = '<i class="fa-solid fa-file-pen"></i><span>نموذج فارغ (مفعل) 📄</span>';
        btn.style.background = '#0d9488';
        btn.style.color = '#ffffff';
        btn.style.borderColor = '#0d9488';
      } else {
        btn.classList.remove('active');
        btn.innerHTML = '<i class="fa-solid fa-file-lines"></i><span>نموذج فارغ كالصورة 📄</span>';
        btn.style.background = '#ffffff';
        btn.style.color = '#475569';
        btn.style.borderColor = '#cbd5e1';
      }
    }
  }

  window.examCardSetColor = function(color) {
    if (!cardsData) return;
    cardsData.cardColor = (color === 'red') ? 'red' : 'blue';
    cardsData.cardTheme = (color === 'red') ? 'ministerialRed' : 'ministerialBlue';
    saveCardsData(false);
    updateColorButtons();
    renderExamCardsStudio();
    if (typeof showToast === 'function') {
      showToast(cardsData.cardColor === 'red' ? 'تم اختيار اللون الأحمر الوزاري 🔴' : 'تم اختيار اللون الأزرق الوزاري 🔵', 'info');
    }
  };

  // Populate form controls from data
  function populateControls() {
    if (!cardsData) return;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    const setChk = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.checked = !!val;
    };

    setVal('ecSchoolInput', cardsData.schoolName);
    setVal('ecGovInput', cardsData.governorate);
    setVal('ecMinistryInput', cardsData.ministryTitle);
    setVal('ecExamTitleInput', cardsData.examTitle);
    setVal('ecRoundInput', cardsData.examRound);
    setVal('ecYearInput', cardsData.academicYear);
    setVal('ecCardsPerPageSelect', String(cardsData.cardsPerPage || 4));
    setVal('ecThemeSelect', cardsData.cardTheme || 'ministerialBlue');
    setVal('ecStageInput', cardsData.studyStage || 'للدراسة المتوسطة');
    setVal('ecPrincipalNameInput', cardsData.principalName || '');
    setVal('ecPrincipalTitleInput', cardsData.principalTitle || 'اسم المدير');
    setVal('ecTemplateSelect', cardsData.cardTemplate || 'ministerialOfficial');
    setVal('ecInstructionsInput', cardsData.instructionsText || '');

    setChk('ecShowPhotoChk', cardsData.showPhoto);
    setChk('ecShowQrChk', cardsData.showQr);
    setChk('ecShowBarcodeChk', cardsData.showBarcode);
    setChk('ecShowHallChk', cardsData.showHallInfo);
    setChk('ecShowTimetableChk', cardsData.showTimetable);
    setChk('ecShowStampChk', cardsData.showStamp);
    setChk('ecShowPrincipalSignChk', cardsData.showPrincipalSign);

    updateColorButtons();
    updateTopBlankButton();
  }

  // Update live statistics in dashboard hero
  function updateHeroStats() {
    if (!cardsData) return;
    const totalStudents = cardsData.students ? cardsData.students.length : 0;
    const perPage = cardsData.cardsPerPage || 4;
    const totalPages = Math.ceil(totalStudents / perPage) || 1;

    // Distinct Classes
    const classesSet = new Set();
    (cardsData.students || []).forEach(s => {
      if (s.className) classesSet.add(s.className.trim());
    });

    const elTotal = document.getElementById('ecStatTotalStudents');
    const elPages = document.getElementById('ecStatTotalPages');
    const elClasses = document.getElementById('ecStatTotalClasses');
    const elPerPage = document.getElementById('ecStatPerPage');

    if (elTotal) elTotal.textContent = totalStudents;
    if (elPages) elPages.textContent = totalPages;
    if (elClasses) elClasses.textContent = classesSet.size || (totalStudents > 0 ? 1 : 0);
    if (elPerPage) elPerPage.textContent = perPage;
  }

  // Populate grade filter dropdown
  function renderGradeFilterOptions() {
    const filterSelect = document.getElementById('ecGradeFilterSelect');
    if (!filterSelect || !cardsData) return;

    const classesSet = new Set();
    (cardsData.students || []).forEach(s => {
      if (s.className) classesSet.add(s.className.trim());
    });

    let html = `<option value="all" ${activeFilterGrade === 'all' ? 'selected' : ''}>جميع الصفوف والشعب (${cardsData.students.length} طالب)</option>`;
    classesSet.forEach(c => {
      const count = cardsData.students.filter(s => s.className === c).length;
      html += `<option value="${esc(c)}" ${activeFilterGrade === c ? 'selected' : ''}>${esc(c)} (${count} طالب)</option>`;
    });

    filterSelect.innerHTML = html;
  }

  // Filter students
  function getFilteredStudents() {
    if (!cardsData || !cardsData.students) return [];
    if (activeFilterGrade === 'all') return cardsData.students;
    return cardsData.students.filter(s => (s.className || '').trim() === activeFilterGrade.trim());
  }

  /**
   * ==========================================================================
   * RENDER VIEW 1: A4 PRINT SHEETS (بطاقات A4 جاهزة للطباعة والتغليف)
   * ==========================================================================
   */
  function renderA4PrintSheets() {
    const container = document.getElementById('examCardCanvasWrapper');
    if (!container || !cardsData) return;

    const students = getFilteredStudents();
    if (students.length === 0) {
      container.innerHTML = `
        <div class="empty-cards-notice">
          <div class="ecn-icon"><i class="fa-solid fa-address-card"></i></div>
          <h3>لا يوجد طلاب في البطاقة الامتحانية حالياً</h3>
          <p>يمكنك استيراد أسماء الطلاب من خريطة الجلوس، أو من سجل الدرجات، أو إضافة طالب يدوياً.</p>
          <div class="ecn-buttons">
            <button type="button" class="btn btn-primary" onclick="window.examCardImportFromSeating()"><i class="fa-solid fa-chair"></i> جلب من خريطة الجلوس (App 09)</button>
            <button type="button" class="btn btn-outline" onclick="window.examCardOpenAddStudentModal()"><i class="fa-solid fa-user-plus"></i> إضافة طالب جديد</button>
          </div>
        </div>
      `;
      return;
    }

    const perPage = Number(cardsData.cardsPerPage || 4);
    const pagesCount = Math.ceil(students.length / perPage);
    const isMinisterial = (cardsData.cardTemplate !== 'modernBadge');
    const isLandscapePaper = isMinisterial && (perPage === 4);
    const paperClass = isLandscapePaper ? 'exam-card-a4-paper paper-landscape' : 'exam-card-a4-paper';
    let html = '';

    for (let p = 0; p < pagesCount; p++) {
      const pageStudents = students.slice(p * perPage, (p + 1) * perPage);

      html += `
        <div class="${paperClass} card-theme-${esc(cardsData.cardTheme || 'ministerialBlue')}" data-page="${p + 1}">
          <!-- Sheet Header Strip (Optional Print Guide) -->
          <div class="ec-paper-header-strip no-print">
            <div class="ec-ph-info">
              <span class="badge-pill-page">صفحة ${p + 1} من ${pagesCount}</span>
              <span>${esc(cardsData.schoolName)} • ${esc(cardsData.examTitle)} (${esc(cardsData.examRound)})</span>
              ${cardsData.printBlank ? '<span class="badge-pill-blank" style="background:#0d9488;color:#fff;padding:2px 8px;border-radius:4px;font-size:7.5pt;margin-right:6px;"><i class="fa-solid fa-file-pen"></i> نموذج فارغ كالصورة للكتابة اليدوية</span>' : '<span class="badge-pill-filled" style="background:#2563eb;color:#fff;padding:2px 8px;border-radius:4px;font-size:7.5pt;margin-right:6px;"><i class="fa-solid fa-user-check"></i> بطاقات معبأة بالبيانات</span>'}
            </div>
            <div class="ec-ph-cut-note">
              <i class="fa-solid fa-scissors"></i> قص البطاقات على طول الخط المتقطع والتغليف الحراري A4
            </div>
          </div>

          <!-- Cards Grid for this Sheet -->
          <div class="exam-cards-grid grid-count-${perPage}">
      `;

      pageStudents.forEach((student, idx) => {
        const globalIdx = (p * perPage) + idx;
        html += renderSingleCardHtml(student, globalIdx);
      });

      // Fill empty slots with blank placeholder cut cards
      const emptySlots = perPage - pageStudents.length;
      for (let s = 0; s < emptySlots; s++) {
        html += `
          <div class="exam-card-item card-blank-placeholder">
            <div class="blank-card-inner">
              <i class="fa-regular fa-id-card"></i>
              <span>بطاقة شاغرة للقص المكتبي</span>
            </div>
          </div>
        `;
      }

      html += `
          </div><!-- /.exam-cards-grid -->

          <!-- Sheet Footer Guidance Strip -->
          <div class="ec-paper-footer-strip">
            <span><i class="fa-solid fa-shield-halved"></i> وثيقة رسمية معتمدة من اللجنة الامتحانية المدرسية • مسار المعلم الذكي</span>
            <span>صفحة ${p + 1} من ${pagesCount}</span>
          </div>
        </div><!-- /.exam-card-a4-paper -->
      `;
    }

    container.innerHTML = html;
  }

  /**
   * Ministerial Official Iraqi Exam Card Template (بطاقة الاشتراك في الامتحانات العامة)
   * تصميم مطابق 100% للنموذج العراقي الرسمي المعتمد (جمهورية العراق - وزارة التربية)
   */
  function renderMinisterialCardHtml(student, globalIdx, colorClass) {
    const isBlank = !!cardsData.printBlank;
    const rollNo = student.rollNo || String(globalIdx + 1001);
    const school = student.school || cardsData.schoolName || 'اسم المدرسة';
    const gov = student.governorate || cardsData.governorate || 'المديرية العامة للتربية';
    const mother = student.motherName || '';
    const dob = student.dob || '';
    const studentName = student.name || 'طالب جديد';
    const stage = cardsData.studyStage || 'للدراسة المتوسطة';
    const year = cardsData.academicYear || '201 _ 201';
    const principal = cardsData.principalName || '';

    // Authentic Arabesque Corner Flourish SVG matching the Iraqi Ministerial Card
    const cornerSvg = `
      <svg class="ec-min-corner-svg" viewBox="0 0 54 54" fill="currentColor">
        <!-- Outer Right Angle Boundary -->
        <path d="M 0,0 L 52,0 L 52,2.4 L 2.4,2.4 L 2.4,52 L 0,52 Z" />
        <!-- Corner Palmette & Scrollwork Tendrils -->
        <path d="M 5,5 C 15,7 23,15 25,25 C 27,15 35,7 45,5 C 37,13 34,22 38,31 C 31,30 26,34 25,44 C 23,34 18,30 11,31 C 15,22 12,13 5,5 Z" opacity="0.95"/>
        <path d="M 25,25 C 29,29 33,33 44,34 C 33,38 29,45 27,53 C 25,45 21,38 10,34 C 21,33 25,29 25,25 Z" opacity="0.9"/>
        <!-- Fine Accent Beads and Corner Leaflet Tips -->
        <circle cx="25" cy="25" r="2.8"/>
        <circle cx="10" cy="10" r="1.8"/>
        <path d="M 46,2 C 50,3 53,6 52,10 C 49,8 47,5 46,2 Z"/>
        <path d="M 2,46 C 3,50 6,53 10,52 C 8,49 5,47 2,46 Z"/>
      </svg>
    `;

    // Format DOB split with slashes exactly as on the ministerial card
    let dobContent = '';
    if (isBlank || !dob) {
      dobContent = `<span>...............</span> <span class="dob-slash">/</span> <span>....</span> <span class="dob-slash">/</span> <span>....</span>`;
    } else {
      const parts = dob.split(/[\/\-–\.]+/).map(p => p.trim());
      if (parts.length === 3) {
        dobContent = `<span>${esc(parts[0])}</span> <span class="dob-slash">/</span> <span>${esc(parts[1])}</span> <span class="dob-slash">/</span> <span>${esc(parts[2])}</span>`;
      } else {
        dobContent = `<span>${esc(dob)}</span>`;
      }
    }

    return `
      <div class="exam-card-item ministerial-card ${colorClass}" data-student-id="${esc(student.id)}">
        <!-- Outer Border Frame -->
        <div class="ec-min-outer-frame">
          <!-- 4 Arabesque Decorative Corners -->
          <div class="ec-min-corner ec-corner-tr">${cornerSvg}</div>
          <div class="ec-min-corner ec-corner-tl">${cornerSvg}</div>
          <div class="ec-min-corner ec-corner-br">${cornerSvg}</div>
          <div class="ec-min-corner ec-corner-bl">${cornerSvg}</div>

          <!-- Inner Border Frame -->
          <div class="ec-min-inner-frame">
            <!-- Header Section (Centered) -->
            <div class="ec-min-header">
              <div class="ec-min-ministry">${esc(cardsData.ministryTitle || 'وزارة التربية / المديرية العامة للتقويم والامتحانات')}</div>
              <h3 class="ec-min-title">${esc(cardsData.examTitle || 'بطاقة الاشتراك في الامتحانات العامة')}</h3>
              <div class="ec-min-stage">${esc(stage)}</div>
              <div class="ec-min-year">${esc(year)}</div>
            </div>

            <!-- Content Body: Fields on Right, Photo on Left -->
            <div class="ec-min-body" dir="rtl">
              <!-- Right Column: Form Fields with Dotted Lines -->
              <div class="ec-min-fields-col">
                <div class="ec-min-row">
                  <span class="ec-min-lbl">الأسم الرباعي :</span>
                  <div class="ec-min-dotted-line ec-name-val">${isBlank ? '' : esc(studentName)}</div>
                </div>

                <div class="ec-min-row">
                  <span class="ec-min-lbl">أســـــــم الام :</span>
                  <div class="ec-min-dotted-line">${isBlank ? '' : esc(mother)}</div>
                </div>

                <div class="ec-min-row">
                  <span class="ec-min-lbl">المواليــــــــد :</span>
                  <div class="ec-min-dotted-line ec-dob-split">${dobContent}</div>
                </div>

                <div class="ec-min-row">
                  <span class="ec-min-lbl">المدرســــــــة :</span>
                  <div class="ec-min-dotted-line">${isBlank ? '' : esc(school)}</div>
                </div>

                <div class="ec-min-row">
                  <span class="ec-min-lbl">الرقم الأمتحاني :</span>
                  <div class="ec-min-dotted-line ec-roll-val">${isBlank ? '' : esc(rollNo)}</div>
                </div>

                <div class="ec-min-row">
                  <span class="ec-min-lbl">المحافظــــــــة :</span>
                  <div class="ec-min-dotted-line">${isBlank ? '' : esc(gov)}</div>
                </div>
              </div>

              <!-- Left Column: Photo Box -->
              <div class="ec-min-photo-col">
                <div class="ec-min-photo-box">
                  ${(!isBlank && cardsData.showPhoto !== false && student.photoUrl) ? `
                    <img src="${esc(student.photoUrl)}" alt="صورة الطالب" class="ec-min-photo-img">
                  ` : `
                    <div class="ec-min-photo-text">
                      <span>صورة</span>
                      <span>حديثة تختم</span>
                      <span>وتوقع من قبل</span>
                      <span>المدير</span>
                    </div>
                  `}
                </div>
              </div>
            </div><!-- /.ec-min-body -->

            <!-- Bottom Footer: Signatures on the left -->
            <div class="ec-min-footer" dir="rtl">
              <div class="ec-min-sig-block">
                <div class="ec-min-sig-line">
                  <span class="ec-min-sig-lbl">اسم المدير :</span>
                  <div class="ec-min-sig-dots">${isBlank ? '' : esc(principal)}</div>
                </div>
                <div class="ec-min-sig-line">
                  <span class="ec-min-sig-lbl">التوقيـــــع :</span>
                  <div class="ec-min-sig-dots"></div>
                </div>
              </div>
              <div class="ec-min-footer-spacer"></div>
            </div><!-- /.ec-min-footer -->

          </div><!-- /.ec-min-inner-frame -->
        </div><!-- /.ec-min-outer-frame -->
      </div>
    `;
  }

  /**
   * Helper to render HTML for a single Exam Card Item
   */
  function renderSingleCardHtml(student, globalIdx) {
    const isRed = (cardsData.cardColor === 'red' || cardsData.cardTheme === 'ministerialRed');
    const colorClass = isRed ? 'theme-red' : 'theme-blue';
    const isMinisterial = (cardsData.cardTemplate !== 'modernBadge');

    if (isMinisterial) {
      return renderMinisterialCardHtml(student, globalIdx, colorClass);
    }

    // Modern Badge with QR, Barcode, and Timetable
    const theme = cardsData.cardTheme || 'ministerialBlue';
    const showPhoto = cardsData.showPhoto !== false;
    const showQr = cardsData.showQr !== false;
    const showBarcode = cardsData.showBarcode !== false;
    const showHall = cardsData.showHallInfo !== false;
    const showTimetable = cardsData.showTimetable !== false;
    const showStamp = cardsData.showStamp !== false;
    const showSign = cardsData.showPrincipalSign !== false;

    // Mini QR Matrix generation placeholder (deterministic per rollNo)
    const rollNo = student.rollNo || String(globalIdx + 1001);

    // Mini Timetable Rows (render first 3-4 subjects if enabled)
    const timetableList = cardsData.timetable || [];
    let timetableRowsHtml = '';
    if (showTimetable && timetableList.length > 0) {
      timetableList.slice(0, 4).forEach(t => {
        timetableRowsHtml += `
          <div class="ec-table-row">
            <span class="ec-td-subj">${esc(t.subject)}</span>
            <span class="ec-td-date">${esc(t.date || '')}</span>
            <span class="ec-td-sign">.........</span>
          </div>
        `;
      });
    }

    return `
      <div class="exam-card-item theme-${esc(theme)} ${colorClass}" data-student-id="${esc(student.id)}">
        <!-- Cutting Corner Marks -->
        <span class="ec-cut-corner tl"></span>
        <span class="ec-cut-corner tr"></span>
        <span class="ec-cut-corner bl"></span>
        <span class="ec-cut-corner br"></span>

        <!-- Lanyard Punch Hole Simulation -->
        <div class="ec-punch-hole-slot">
          <div class="punch-hole-inner"></div>
        </div>

        <!-- 1. Card Top Official Header -->
        <div class="ec-card-header">
          <div class="ec-hdr-crest">
            <i class="fa-solid fa-graduation-cap"></i>
          </div>
          <div class="ec-hdr-text">
            <div class="ec-ministry-title">${esc(cardsData.ministryTitle || 'جمهورية العراق - وزارة التربية')}</div>
            <div class="ec-gov-title">${esc(cardsData.governorate || 'المديرية العامة للتربية')} • ${esc(cardsData.schoolName || 'اسم المدرسة')}</div>
            <h4 class="ec-exam-card-title">${esc(cardsData.examTitle || 'البطاقة الامتحانية الرسمية')}</h4>
          </div>
          <div class="ec-hdr-badge">
            <span class="ec-round-pill">${esc(cardsData.examRound || 'الدور الأول')}</span>
            <span class="ec-year-text">${esc(cardsData.academicYear || '2024 - 2025 م')}</span>
          </div>
        </div>

        <!-- 2. Card Main Body: Student Photo & Essential Info -->
        <div class="ec-card-body">
          <!-- Student Photo Badge -->
          ${showPhoto ? `
            <div class="ec-photo-box">
              ${student.photoUrl ? `
                <img src="${esc(student.photoUrl)}" alt="صورة الطالب" class="ec-student-img">
              ` : `
                <div class="ec-avatar-placeholder">
                  <i class="fa-solid fa-user-graduate"></i>
                  <span class="ec-avatar-lbl">صورة شخصية</span>
                </div>
              `}
              <div class="ec-photo-hologram-seal" title="ختم الأمان المجسم"><i class="fa-solid fa-star"></i></div>
            </div>
          ` : ''}

          <!-- Student Metadata Column -->
          <div class="ec-student-details-col">
            <!-- Student Name -->
            <div class="ec-meta-row ec-name-row">
              <span class="ec-label"><i class="fa-solid fa-user"></i> اسم الطالب:</span>
              <strong class="ec-student-fullname">${esc(student.name || 'طالب مجهول')}</strong>
            </div>

            <!-- Roll Number Prominent Badge -->
            <div class="ec-roll-highlight-box">
              <div class="ec-roll-meta">
                <span class="ec-roll-lbl">الرقم الامتحاني</span>
                <strong class="ec-roll-val">${esc(rollNo)}</strong>
              </div>
              ${showBarcode ? `
                <div class="ec-barcode-strip">
                  <div class="barcode-lines"></div>
                  <small class="barcode-digits">*${esc(rollNo)}*</small>
                </div>
              ` : ''}
            </div>

            <!-- Grade, Hall & Seat Numbers -->
            <div class="ec-badges-cluster">
              <span class="ec-sub-badge ec-class-badge" title="الصف والشعبة">
                <i class="fa-solid fa-chalkboard"></i> ${esc(student.className || 'غير محدد')}
              </span>
              ${showHall ? `
                <span class="ec-sub-badge ec-hall-badge" title="القاعة الامتحانية">
                  <i class="fa-solid fa-door-open"></i> ${esc(student.hallName || 'القاعة 1')}
                </span>
                <span class="ec-sub-badge ec-seat-badge" title="رقم المقعد">
                  <i class="fa-solid fa-chair"></i> مقعد ${esc(student.seatNo || globalIdx + 1)}
                </span>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- 3. Micro Exam Schedule / Instructions Block -->
        ${showTimetable && timetableRowsHtml ? `
          <div class="ec-mini-timetable-block">
            <div class="ec-timetable-header">
              <span>المادة الامتحانية</span>
              <span>اليوم والتاريخ</span>
              <span>توقيع المراقب</span>
            </div>
            <div class="ec-timetable-body">
              ${timetableRowsHtml}
            </div>
          </div>
        ` : `
          <div class="ec-instructions-block">
            <div class="ec-inst-title"><i class="fa-solid fa-circle-exclamation"></i> ضوابط وتعليمات الاختبار:</div>
            <div class="ec-inst-body">${esc(cardsData.instructionsText || '').replace(/\n/g, '<br>')}</div>
          </div>
        `}

        <!-- 4. Card Bottom Footer: QR + Official Seal + Principal Sign -->
        <div class="ec-card-footer">
          <!-- QR Code for fast verification -->
          ${showQr ? `
            <div class="ec-qr-box" title="رمز التحقق الرقمي للطالب">
              <div class="qr-matrix-sim">
                <span class="qr-corner qtl"></span>
                <span class="qr-corner qtr"></span>
                <span class="qr-corner qbl"></span>
                <span class="qr-dot d1"></span>
                <span class="qr-dot d2"></span>
                <span class="qr-dot d3"></span>
                <span class="qr-dot d4"></span>
              </div>
              <small class="qr-verify-txt">تحقق رسمي</small>
            </div>
          ` : ''}

          <!-- Principal & Exam Committee Sign -->
          ${showSign ? `
            <div class="ec-sign-box">
              <span class="ec-sign-title">${esc(cardsData.principalTitle || 'مدير المدرسة / رئيس اللجنة')}</span>
              <div class="ec-sign-signature-line">
                <span class="sign-seal-watermark">معتمد وموقع</span>
              </div>
            </div>
          ` : ''}

          <!-- Golden Official School Stamp -->
          ${showStamp ? `
            <div class="ec-gold-stamp-box" title="الختم الرسمي للإدارة المدرسية">
              <div class="stamp-circular-ring">
                <div class="stamp-inner-text">اللجنة الامتحانية</div>
                <i class="fa-solid fa-certificate stamp-center-star"></i>
                <div class="stamp-footer-text">ختم معتمد</div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * ==========================================================================
   * RENDER VIEW 2: SINGLE BADGE PREVIEW (المعاينة الفردية لباجة الطالب)
   * ==========================================================================
   */
  function renderSingleBadgePreview() {
    const container = document.getElementById('examCardCanvasWrapper');
    if (!container || !cardsData) return;

    const students = getFilteredStudents();
    if (students.length === 0) {
      renderA4PrintSheets();
      return;
    }

    if (activeStudentIndex >= students.length) activeStudentIndex = 0;
    const student = students[activeStudentIndex];

    let optionsStudentsHtml = '';
    students.forEach((s, idx) => {
      optionsStudentsHtml += `<option value="${idx}" ${idx === activeStudentIndex ? 'selected' : ''}>${idx + 1}. ${esc(s.name)} - رقم: ${esc(s.rollNo)}</option>`;
    });

    container.innerHTML = `
      <div class="single-badge-view-container">
        <!-- Student Switcher Toolbar -->
        <div class="single-badge-nav-bar no-print">
          <div class="sb-nav-select-wrap">
            <label><i class="fa-solid fa-user-check"></i> اختر الطالب للمعاينة المباشرة:</label>
            <select class="form-control" onchange="window.examCardSelectStudent(Number(this.value))">
              ${optionsStudentsHtml}
            </select>
          </div>
          <div class="sb-nav-buttons">
            <button type="button" class="btn btn-sm btn-outline" onclick="window.examCardTogglePrintBlank()" title="التبديل بين نموذج فارغ مطابق للصورة ونموذج معبأ بالبيانات">
              <i class="fa-solid ${cardsData.printBlank ? 'fa-user-pen' : 'fa-file-lines'}"></i>
              <span>${cardsData.printBlank ? 'عرض بالبيانات 📝' : 'عرض فارغ كالصورة 📄'}</span>
            </button>
            <button type="button" class="btn btn-sm btn-outline" onclick="window.examCardStepStudent(-1)" ${activeStudentIndex === 0 ? 'disabled' : ''}>
              <i class="fa-solid fa-chevron-right"></i> السابق
            </button>
            <span class="sb-counter">${activeStudentIndex + 1} / ${students.length}</span>
            <button type="button" class="btn btn-sm btn-outline" onclick="window.examCardStepStudent(1)" ${activeStudentIndex === students.length - 1 ? 'disabled' : ''}>
              التالي <i class="fa-solid fa-chevron-left"></i>
            </button>
            <button type="button" class="btn btn-sm btn-primary" onclick="window.examCardPrint()"><i class="fa-solid fa-print"></i> طباعة الكل A4</button>
          </div>
        </div>

        ${(cardsData.cardTemplate !== 'modernBadge') ? `
          <!-- Ministerial Official Card Preview Presentation -->
          <div class="ministerial-single-preview-wrap" style="width: 100%; display: flex; justify-content: center; padding: 15px 0;">
            <div class="single-badge-card-wrapper card-theme-${esc(cardsData.cardTheme || 'ministerialBlue')}" style="max-width: 680px; width: 100%;">
              ${renderSingleCardHtml(student, activeStudentIndex)}
            </div>
          </div>
        ` : `
          <!-- Badge Lanyard Simulation Rig -->
          <div class="badge-hanging-rig">
            <div class="rig-ribbon"></div>
            <div class="rig-clip"></div>
            <div class="single-badge-card-wrapper card-theme-${esc(cardsData.cardTheme || 'royalIndigo')}">
              ${renderSingleCardHtml(student, activeStudentIndex)}
            </div>
          </div>
        `}
      </div>
    `;
  }

  /**
   * ==========================================================================
   * RENDER VIEW 3: ROSTER TABLE VIEW (كشف وجدول إدارة الطلاب)
   * ==========================================================================
   */
  function renderRosterTableView() {
    const container = document.getElementById('examCardCanvasWrapper');
    if (!container || !cardsData) return;

    const students = getFilteredStudents();

    let rowsHtml = '';
    if (students.length === 0) {
      rowsHtml = `<tr><td colspan="8" class="text-center p-4 text-muted">لا يوجد طلاب مطابقين للبحث أو التصفية الحالية.</td></tr>`;
    } else {
      students.forEach((st, idx) => {
        rowsHtml += `
          <tr>
            <td><span class="ec-seq-pill">${idx + 1}</span></td>
            <td>
              <div class="ec-table-student-name">
                <i class="fa-solid fa-user-graduate text-indigo"></i>
                <strong>${esc(st.name)}</strong>
              </div>
            </td>
            <td><span class="ec-roll-pill">${esc(st.rollNo || '?')}</span></td>
            <td><span class="ec-class-pill">${esc(st.className || 'عام')}</span></td>
            <td><span class="ec-hall-pill"><i class="fa-solid fa-door-open"></i> ${esc(st.hallName || 'القاعة 1')}</span></td>
            <td><span class="ec-seat-pill">مقعد ${esc(st.seatNo || idx + 1)}</span></td>
            <td class="text-center">
              <span class="badge ${st.photoUrl ? 'badge-success' : 'badge-light'}">
                ${st.photoUrl ? '<i class="fa-solid fa-check"></i> مرفقة' : 'افتراضية'}
              </span>
            </td>
            <td class="text-center">
              <button type="button" class="btn-action-icon" onclick="window.examCardOpenEditStudentModal('${st.id}')" title="تعديل بيانات الطالب"><i class="fa-solid fa-pen"></i></button>
              <button type="button" class="btn-action-icon btn-danger-icon" onclick="window.examCardDeleteStudent('${st.id}')" title="حذف الطالب"><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>
        `;
      });
    }

    container.innerHTML = `
      <div class="exam-cards-roster-card">
        <div class="ec-roster-toolbar no-print">
          <div class="rtt-search-box">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" id="ecSearchInput" placeholder="بحث بالاسم أو الرقم الامتحاني..." oninput="window.examCardSearchStudents(this.value)">
          </div>
          <div class="rtt-actions">
            <button type="button" class="btn btn-sm btn-primary" onclick="window.examCardOpenAddStudentModal()"><i class="fa-solid fa-user-plus"></i> إضافة طالب</button>
            <button type="button" class="btn btn-sm btn-success" onclick="window.examCardOpenAutoNumberModal()"><i class="fa-solid fa-arrow-down-1-9"></i> ترقيم تسلسلي</button>
            <button type="button" class="btn btn-sm btn-outline" onclick="window.examCardImportFromSeating()"><i class="fa-solid fa-chair"></i> استيراد من خريطة الجلوس</button>
            <button type="button" class="btn btn-sm btn-outline" onclick="window.examCardImportFromGrades()"><i class="fa-solid fa-users-viewfinder"></i> استيراد من سجل الدرجات</button>
            <button type="button" class="btn btn-sm btn-purple" onclick="window.examCardOpenTimetableModal()"><i class="fa-solid fa-calendar-days"></i> جدول المواد</button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table exam-cards-admin-table" id="examCardRosterTable">
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th>اسم الطالب</th>
                <th>الرقم الامتحاني</th>
                <th>الصف والشعبة</th>
                <th>القاعة الامتحانية</th>
                <th>رقم المقعد</th>
                <th class="text-center">الصورة</th>
                <th class="text-center" style="width: 100px;">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /**
   * Main Render Dispatcher
   */
  function renderExamCardsStudio() {
    if (!cardsData) loadCardsData();
    populateControls();
    updateHeroStats();
    renderGradeFilterOptions();

    // Update active view buttons
    document.querySelectorAll('.ec-view-mode-btn').forEach(btn => {
      const v = btn.getAttribute('data-view');
      btn.classList.toggle('active', v === activeStudioView);
    });

    if (activeStudioView === 'cards') {
      renderA4PrintSheets();
    } else if (activeStudioView === 'single') {
      renderSingleBadgePreview();
    } else if (activeStudioView === 'table') {
      renderRosterTableView();
    }
  }

  /**
   * ==========================================================================
   * ACTIONS & GLOBAL APIS
   * ==========================================================================
   */
  window.renderExamCardsStudio = renderExamCardsStudio;

  window.examCardSetView = function(viewMode) {
    activeStudioView = viewMode || 'cards';
    renderExamCardsStudio();
  };

  window.examCardFilterGrade = function(grade) {
    activeFilterGrade = grade || 'all';
    renderExamCardsStudio();
  };

  window.examCardSelectStudent = function(index) {
    activeStudentIndex = index || 0;
    renderSingleBadgePreview();
  };

  window.examCardStepStudent = function(delta) {
    const students = getFilteredStudents();
    activeStudentIndex = Math.max(0, Math.min(students.length - 1, activeStudentIndex + delta));
    renderSingleBadgePreview();
  };

  window.examCardUpdateField = function(field, value) {
    if (!cardsData) return;
    cardsData[field] = value;
    saveCardsData(false);
    renderExamCardsStudio();
  };

  window.examCardSaveData = function() {
    saveCardsData(true);
  };

  window.examCardTogglePrintBlank = function() {
    if (!cardsData) return;
    cardsData.printBlank = !cardsData.printBlank;
    saveCardsData(false);
    updateTopBlankButton();
    renderExamCardsStudio();
    if (typeof showToast === 'function') {
      showToast(cardsData.printBlank ? 'تم تفعيل النموذج الفارغ (مطابق للصورة 100% للكتابة اليدوية) 📄' : 'تم تفعيل وضع البيانات المعبأة بأسماء الطلاب 📝', 'info');
    }
  };

  // Quick Print A4
  window.examCardPrint = function() {
    window.examCardSetView('cards');
    if (typeof showToast === 'function') {
      showToast('جاري تحضير بطاقات الامتحان للطباعة A4... 🖨️', 'info');
    }
    setTimeout(() => {
      window.print();
    }, 250);
  };

  // PDF Export
  window.examCardExportPdf = async function() {
    window.examCardSetView('cards');
    const container = document.getElementById('examCardCanvasWrapper');
    if (!container) {
      if (typeof showToast === 'function') showToast('تعذر العثور على بطاقات الامتحان للتصدير', 'warning');
      return;
    }

    try {
      const printFn = (typeof window.masarPrintToPDF === 'function') ? window.masarPrintToPDF : (typeof window.exportToPDF === 'function' ? window.exportToPDF : null);
      if (printFn) {
        const sheets = container.querySelectorAll('.exam-card-a4-paper');
        const target = sheets.length > 0 ? Array.from(sheets) : container;
        if (typeof showToast === 'function') {
          showToast('جاري تجهيز بطاقات الامتحان وتصدير PDF عالي الدقة... 📄', 'info');
        }
        await printFn(target, {
          title: 'بطاقات-الدخول-الامتحانية-A4',
          pageSize: 'a4',
          orientation: 'portrait',
          margin: '0',
          fit: true
        });
        if (typeof showToast === 'function') {
          showToast('تم تصدير بطاقات الامتحان بنجاح! 🖨️', 'success');
        }
      } else {
        throw new Error('محرك تصدير PDF غير متوفر.');
      }
    } catch (e) {
      console.error('examCardExportPdf error:', e);
      if (typeof showToast === 'function') {
        showToast('تعذر تنزيل ملف PDF لبطاقات الامتحان: ' + (e.message || 'خطأ غير متوقع'), 'error');
      }
    }
  };

  // Excel Export via SheetJS
  window.examCardExportExcel = function() {
    if (!cardsData || !cardsData.students || cardsData.students.length === 0) {
      if (typeof showToast === 'function') showToast('لا يوجد طلاب لتصديرهم إلى ملف Excel', 'warning');
      return;
    }

    if (typeof XLSX === 'undefined') {
      if (typeof showToast === 'function') showToast('محرك Excel غير محمل، يرجى إعادة المحاولة', 'error');
      return;
    }

    const rows = cardsData.students.map((st, idx) => ({
      'ت': idx + 1,
      'اسم الطالب الرباعي': st.name || '',
      'اسم الأم': st.motherName || '',
      'المواليد': st.dob || '',
      'المدرسة': st.school || cardsData.schoolName || '',
      'الرقم الامتحاني': st.rollNo || '',
      'المحافظة': st.governorate || cardsData.governorate || '',
      'الصف والشعبة': st.className || '',
      'القاعة الامتحانية': st.hallName || '',
      'رقم المقعد': st.seatNo || (idx + 1),
      'العام الدراسي': cardsData.academicYear || '',
      'الدور الامتحاني': cardsData.examRound || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'البطاقات الامتحانية');
    XLSX.writeFile(workbook, `كشف_البطاقات_الامتحانية_${Date.now()}.xlsx`);

    if (typeof showToast === 'function') {
      showToast('تم تصدير كشف البطاقات الامتحانية إلى Excel بنجاح 📊', 'success');
    }
  };

  // Seamless 1-Click Import from Seating Studio (App 09)
  window.examCardImportFromSeating = function() {
    try {
      const raw = localStorage.getItem('masar_seating_studio_data_v2');
      if (!raw) {
        if (typeof showToast === 'function') showToast('لم يتم العثور على بيانات في خريطة الجلوس (App 09) بعد', 'warning');
        return;
      }

      const seating = JSON.parse(raw);
      if (!seating.students || seating.students.length === 0) {
        if (typeof showToast === 'function') showToast('خريطة الجلوس خالية من الطلاب حالياً', 'warning');
        return;
      }

      // Map hall names
      const hallsMap = {};
      (seating.halls || []).forEach(h => {
        hallsMap[h.id] = h.name;
      });

      let importedCount = 0;
      seating.students.forEach((st, idx) => {
        const existing = cardsData.students.find(s => s.name === st.name || (s.rollNo && s.rollNo === st.rollNo));
        if (existing) {
          existing.rollNo = st.rollNo || existing.rollNo;
          existing.hallName = hallsMap[st.hallId] || existing.hallName;
          existing.seatNo = st.seatNo || existing.seatNo;
          existing.className = st.className || existing.className;
        } else {
          cardsData.students.push({
            id: 'ec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            name: st.name,
            rollNo: st.rollNo || String(1001 + idx),
            className: st.className || 'الثالث متوسط',
            hallName: hallsMap[st.hallId] || 'القاعة (1)',
            seatNo: st.seatNo || (idx + 1),
            photoUrl: ''
          });
          importedCount++;
        }
      });

      // Also copy school info if empty
      if (seating.schoolName && !cardsData.schoolName) cardsData.schoolName = seating.schoolName;

      saveCardsData(false);
      renderExamCardsStudio();

      if (typeof showToast === 'function') {
        showToast(`تم استيراد وتحديث بيانات ${seating.students.length} طالباً وقاعاتهم من خريطة الجلوس بنجاح 🏛️`, 'success');
      }
    } catch (e) {
      console.error('Import from seating failed:', e);
      if (typeof showToast === 'function') showToast('حدث خطأ أثناء الاستيراد من خريطة الجلوس', 'error');
    }
  };

  // Seamless 1-Click Import from Grades Studio (App 04)
  window.examCardImportFromGrades = function() {
    try {
      let importedStudents = [];

      const rawRosters = localStorage.getItem('masar_teacher_grades_rosters_v1');
      if (rawRosters) {
        const rosters = JSON.parse(rawRosters);
        if (Array.isArray(rosters)) {
          rosters.forEach(r => {
            const cls = (r.grade || '') + ' - ' + (r.section || '');
            if (Array.isArray(r.students)) {
              r.students.forEach(st => {
                if (st && st.name) importedStudents.push({ name: st.name.trim(), className: cls });
              });
            }
          });
        }
      }

      if (importedStudents.length === 0) {
        const activeRaw = localStorage.getItem('sg_active_class_data_v1');
        if (activeRaw) {
          const act = JSON.parse(activeRaw);
          const cls = (act.grade || '') + ' - ' + (act.section || '');
          if (Array.isArray(act.students)) {
            act.students.forEach(st => {
              if (st && st.name) importedStudents.push({ name: st.name.trim(), className: cls });
            });
          }
        }
      }

      if (importedStudents.length === 0) {
        if (typeof showToast === 'function') showToast('لم يتم العثور على أسماء طلاب مسجلين في سجل الدرجات', 'warning');
        return;
      }

      let count = 0;
      importedStudents.forEach(st => {
        if (!cardsData.students.some(s => s.name === st.name)) {
          cardsData.students.push({
            id: 'ec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            name: st.name,
            rollNo: String(1001 + cardsData.students.length),
            className: st.className || 'الصف الثالث',
            hallName: 'القاعة (1)',
            seatNo: cardsData.students.length + 1,
            photoUrl: ''
          });
          count++;
        }
      });

      saveCardsData(false);
      renderExamCardsStudio();

      if (typeof showToast === 'function') {
        showToast(`تم استيراد ${count} طالباً جديداً من سجل الدرجات بنجاح 📋`, 'success');
      }
    } catch (e) {
      console.error('Import from grades failed:', e);
      if (typeof showToast === 'function') showToast('حدث خطأ أثناء الاستيراد من سجل الدرجات', 'error');
    }
  };

  // Auto Number Modal
  window.examCardOpenAutoNumberModal = function() {
    const modal = document.getElementById('examCardAutoNumberModal');
    if (modal) modal.classList.add('open');
  };

  window.examCardApplyAutoNumber = function() {
    const startInput = document.getElementById('ecAutoNumberStartInput');
    const startNo = parseInt(startInput ? startInput.value : '1001', 10) || 1001;

    cardsData.students.forEach((st, idx) => {
      st.rollNo = String(startNo + idx);
    });

    saveCardsData(false);
    renderExamCardsStudio();

    const modal = document.getElementById('examCardAutoNumberModal');
    if (modal) modal.classList.remove('open');

    if (typeof showToast === 'function') {
      showToast(`تم ترقيم جميع الطلاب تسلسلياً بدءاً من الرقم ${startNo} بنجاح 🔢`, 'success');
    }
  };

  // Add / Edit Student Modal
  window.examCardOpenAddStudentModal = function() {
    const titleEl = document.getElementById('examCardStudentModalTitle');
    if (titleEl) titleEl.textContent = 'إضافة طالب جديد للبطاقة الامتحانية';

    const idInput = document.getElementById('ecModalStudentId');
    const nameInput = document.getElementById('ecModalStudentName');
    const motherInput = document.getElementById('ecModalStudentMother');
    const dobInput = document.getElementById('ecModalStudentDob');
    const schoolInput = document.getElementById('ecModalStudentSchool');
    const govInput = document.getElementById('ecModalStudentGov');
    const rollInput = document.getElementById('ecModalStudentRoll');
    const classInput = document.getElementById('ecModalStudentClass');
    const hallInput = document.getElementById('ecModalStudentHall');
    const seatInput = document.getElementById('ecModalStudentSeat');
    const photoInput = document.getElementById('ecModalStudentPhoto');

    if (idInput) idInput.value = '';
    if (nameInput) nameInput.value = '';
    if (motherInput) motherInput.value = '';
    if (dobInput) dobInput.value = '2009 / 4 / 15';
    if (schoolInput) schoolInput.value = cardsData.schoolName || 'متوسطة الأمل للبنين';
    if (govInput) govInput.value = cardsData.governorate || 'بغداد / الرصافة الأولى';
    if (rollInput) rollInput.value = String(1001 + cardsData.students.length);
    if (classInput) classInput.value = 'الثالث متوسط (أ)';
    if (hallInput) hallInput.value = 'القاعة (1)';
    if (seatInput) seatInput.value = cardsData.students.length + 1;
    if (photoInput) photoInput.value = '';

    const modal = document.getElementById('examCardStudentModal');
    if (modal) modal.classList.add('open');
  };

  window.examCardOpenEditStudentModal = function(studentId) {
    const st = cardsData.students.find(s => s.id === studentId);
    if (!st) return;

    const titleEl = document.getElementById('examCardStudentModalTitle');
    if (titleEl) titleEl.textContent = 'تعديل بيانات بطاقة الطالب';

    const idInput = document.getElementById('ecModalStudentId');
    const nameInput = document.getElementById('ecModalStudentName');
    const motherInput = document.getElementById('ecModalStudentMother');
    const dobInput = document.getElementById('ecModalStudentDob');
    const schoolInput = document.getElementById('ecModalStudentSchool');
    const govInput = document.getElementById('ecModalStudentGov');
    const rollInput = document.getElementById('ecModalStudentRoll');
    const classInput = document.getElementById('ecModalStudentClass');
    const hallInput = document.getElementById('ecModalStudentHall');
    const seatInput = document.getElementById('ecModalStudentSeat');
    const photoInput = document.getElementById('ecModalStudentPhoto');

    if (idInput) idInput.value = st.id;
    if (nameInput) nameInput.value = st.name || '';
    if (motherInput) motherInput.value = st.motherName || '';
    if (dobInput) dobInput.value = st.dob || '';
    if (schoolInput) schoolInput.value = st.school || cardsData.schoolName || '';
    if (govInput) govInput.value = st.governorate || cardsData.governorate || '';
    if (rollInput) rollInput.value = st.rollNo || '';
    if (classInput) classInput.value = st.className || '';
    if (hallInput) hallInput.value = st.hallName || '';
    if (seatInput) seatInput.value = st.seatNo || '';
    if (photoInput) photoInput.value = st.photoUrl || '';

    const modal = document.getElementById('examCardStudentModal');
    if (modal) modal.classList.add('open');
  };

  window.examCardSaveStudentModal = function() {
    const idInput = document.getElementById('ecModalStudentId');
    const nameInput = document.getElementById('ecModalStudentName');
    const motherInput = document.getElementById('ecModalStudentMother');
    const dobInput = document.getElementById('ecModalStudentDob');
    const schoolInput = document.getElementById('ecModalStudentSchool');
    const govInput = document.getElementById('ecModalStudentGov');
    const rollInput = document.getElementById('ecModalStudentRoll');
    const classInput = document.getElementById('ecModalStudentClass');
    const hallInput = document.getElementById('ecModalStudentHall');
    const seatInput = document.getElementById('ecModalStudentSeat');
    const photoInput = document.getElementById('ecModalStudentPhoto');

    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) {
      if (typeof showToast === 'function') showToast('يرجى كتابة اسم الطالب', 'warning');
      return;
    }

    const motherName = motherInput ? motherInput.value.trim() : '';
    const dob = dobInput ? dobInput.value.trim() : '';
    const school = schoolInput ? schoolInput.value.trim() : (cardsData.schoolName || '');
    const governorate = govInput ? govInput.value.trim() : (cardsData.governorate || '');
    const rollNo = rollInput ? rollInput.value.trim() : '';
    const className = classInput ? classInput.value.trim() : 'الصف الثالث';
    const hallName = hallInput ? hallInput.value.trim() : 'القاعة (1)';
    const seatNo = parseInt(seatInput ? seatInput.value : '1', 10) || 1;
    const photoUrl = photoInput ? photoInput.value.trim() : '';
    const studentId = idInput ? idInput.value : '';

    if (studentId) {
      const st = cardsData.students.find(s => s.id === studentId);
      if (st) {
        st.name = name;
        st.motherName = motherName;
        st.dob = dob;
        st.school = school;
        st.governorate = governorate;
        st.rollNo = rollNo;
        st.className = className;
        st.hallName = hallName;
        st.seatNo = seatNo;
        st.photoUrl = photoUrl;
      }
    } else {
      cardsData.students.push({
        id: 'ec_' + Date.now(),
        name,
        motherName,
        dob,
        school,
        governorate,
        rollNo: rollNo || String(1001 + cardsData.students.length),
        className,
        hallName,
        seatNo,
        photoUrl
      });
    }

    saveCardsData(false);
    renderExamCardsStudio();

    const modal = document.getElementById('examCardStudentModal');
    if (modal) modal.classList.remove('open');

    if (typeof showToast === 'function') showToast('تم حفظ بيانات الطالب بنجاح ✅', 'success');
  };

  window.examCardDeleteStudent = function(studentId) {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب من البطاقات الامتحانية؟')) return;
    cardsData.students = cardsData.students.filter(s => s.id !== studentId);
    saveCardsData(false);
    renderExamCardsStudio();
    if (typeof showToast === 'function') showToast('تم حذف الطالب', 'info');
  };

  // Timetable Modal
  window.examCardOpenTimetableModal = function() {
    renderTimetableModalRows();
    const modal = document.getElementById('examCardTimetableModal');
    if (modal) modal.classList.add('open');
  };

  function renderTimetableModalRows() {
    const listCont = document.getElementById('ecTimetableRowsList');
    if (!listCont) return;

    let html = '';
    (cardsData.timetable || []).forEach((t, idx) => {
      html += `
        <div class="ec-tt-edit-row">
          <input type="text" class="form-control" value="${esc(t.subject)}" placeholder="المادة" id="ttSubj_${idx}">
          <input type="text" class="form-control" value="${esc(t.date)}" placeholder="التاريخ" id="ttDate_${idx}">
          <input type="text" class="form-control" value="${esc(t.time || '')}" placeholder="الوقت" id="ttTime_${idx}">
          <button type="button" class="btn btn-sm btn-danger" onclick="window.examCardDeleteTimetableRow(${idx})"><i class="fa-solid fa-trash"></i></button>
        </div>
      `;
    });

    listCont.innerHTML = html;
  }

  window.examCardAddTimetableRow = function() {
    cardsData.timetable.push({ subject: 'مادة جديدة', date: 'الأحد', time: '08:00 صباحاً' });
    renderTimetableModalRows();
  };

  window.examCardDeleteTimetableRow = function(index) {
    cardsData.timetable.splice(index, 1);
    renderTimetableModalRows();
  };

  window.examCardSaveTimetableModal = function() {
    (cardsData.timetable || []).forEach((t, idx) => {
      const s = document.getElementById(`ttSubj_${idx}`);
      const d = document.getElementById(`ttDate_${idx}`);
      const tm = document.getElementById(`ttTime_${idx}`);
      if (s) t.subject = s.value.trim();
      if (d) t.date = d.value.trim();
      if (tm) t.time = tm.value.trim();
    });

    saveCardsData(false);
    renderExamCardsStudio();

    const modal = document.getElementById('examCardTimetableModal');
    if (modal) modal.classList.remove('open');

    if (typeof showToast === 'function') showToast('تم حفظ جدول المواد بنجاح 📅', 'success');
  };

  // Close modals helper
  window.examCardCloseModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
  };

  // Search students
  window.examCardSearchStudents = function(query) {
    const q = (query || '').toLowerCase().trim();
    const rows = document.querySelectorAll('#examCardRosterTable tbody tr');
    rows.forEach(r => {
      const text = r.textContent.toLowerCase();
      r.style.display = text.includes(q) ? '' : 'none';
    });
  };

  // Clear All Exam Cards Data & Students
  window.examCardsClearAllData = function() {
    if (!cardsData) loadCardsData();
    const count = (cardsData.students || []).length;
    if (count === 0) {
      if (typeof window.showToast === 'function') {
        window.showToast('كشف البطاقات الامتحانية فارغ بالفعل! لا توجد بيانات لمسحها ℹ️', 'info');
      }
      return;
    }
    if (!confirm(`تحذير: هل أنت متأكد من تفريغ ومسح كافة بيانات البطاقات الامتحانية والطلاب (${count} طالب)؟\nسيتم تفريغ كافة البطاقات المفتوحة للبدء من جديد.`)) {
      return;
    }
    cardsData.students = [];
    activeStudentIndex = 0;
    saveCardsData(false);
    renderExamCardsStudio();
    if (typeof window.showToast === 'function') {
      window.showToast('تم تفريغ كافة البطاقات الامتحانية والطلاب بنجاح 🗑️', 'info');
    }
  };
  window.examCardClearAllData = window.examCardsClearAllData;
  window.examCardsClearAllOpenData = window.examCardsClearAllData;

  // Startup hook
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCardsData);
  } else {
    loadCardsData();
  }

})();
