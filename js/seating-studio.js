/**
 * ==========================================================================
 * استوديو خريطة الجلوس وتوزيع القاعات الامتحانية (Seating Chart Studio Pro)
 * إعداد بطاقات المقاعد والجلوس A4 عمودية وتوزيع الطلاب على القاعات الدراسية
 * مسار المعلم الذكي - الإصدار السيادي 5.5
 * ==========================================================================
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'masar_seating_studio_data_v2';

  // State
  let seatingData = null;
  let activeHallTab = 'all'; // 'all' or hall id
  let activeStudioView = 'cards'; // 'cards' (A4 Print Cards) | 'map' (Hall Floor Plan) | 'list' (Students Table)
  let currentSeatingPage = 1; // الصفحة الحالية المعروضة في معاينة A4
  let totalSeatingPages = 1;  // إجمالي عدد صفحات A4

  // Default Seeding
  function getDefaultSeatingData() {
    const cur = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    const school = (cur && cur.school) ? cur.school : 'ثانوية المتميزين للبنين';
    const gov = (cur && cur.governorate) ? cur.governorate : 'المديرية العامة للتربية';

    const sampleHalls = [
      { id: 'hall_1', name: 'القاعة (1) - قاعة المتفوقين', capacity: 20, rows: 5, cols: 4 },
      { id: 'hall_2', name: 'القاعة (2) - قاعة النور', capacity: 20, rows: 5, cols: 4 },
      { id: 'hall_3', name: 'القاعة (3) - قاعة الأمل', capacity: 20, rows: 5, cols: 4 }
    ];

    const sampleStudents = [
      { id: 'st_1', name: 'أحمد علي عبد الحسين', rollNo: '1001', hallId: 'hall_1', seatNo: 1, className: 'الثالث متوسط (أ)' },
      { id: 'st_2', name: 'حيدر محمد رضا الباقر', rollNo: '1002', hallId: 'hall_1', seatNo: 2, className: 'الثالث متوسط (أ)' },
      { id: 'st_3', name: 'مصطفى صادق جاسم', rollNo: '1003', hallId: 'hall_1', seatNo: 3, className: 'الثالث متوسط (أ)' },
      { id: 'st_4', name: 'زين العابدين خليل إبراهيم', rollNo: '1004', hallId: 'hall_1', seatNo: 4, className: 'الثالث متوسط (أ)' },
      { id: 'st_5', name: 'كرار مهدي صالح', rollNo: '1005', hallId: 'hall_1', seatNo: 5, className: 'الثالث متوسط (أ)' },
      { id: 'st_6', name: 'يوسف رعد عبد الأمير', rollNo: '1006', hallId: 'hall_1', seatNo: 6, className: 'الثالث متوسط (أ)' },
      { id: 'st_7', name: 'سجاد قاسم كريم', rollNo: '1007', hallId: 'hall_1', seatNo: 7, className: 'الثالث متوسط (أ)' },
      { id: 'st_8', name: 'عباس فاضل كاظم', rollNo: '1008', hallId: 'hall_1', seatNo: 8, className: 'الثالث متوسط (أ)' },
      { id: 'st_9', name: 'منتظر عقيل هاشم', rollNo: '1009', hallId: 'hall_1', seatNo: 9, className: 'الثالث متوسط (أ)' },
      { id: 'st_10', name: 'محمد باقر حسن علي', rollNo: '1010', hallId: 'hall_1', seatNo: 10, className: 'الثالث متوسط (أ)' },
      { id: 'st_11', name: 'أمير سلام ناصر', rollNo: '1011', hallId: 'hall_2', seatNo: 1, className: 'الثالث متوسط (ب)' },
      { id: 'st_12', name: 'حسين جواد طاهر', rollNo: '1012', hallId: 'hall_2', seatNo: 2, className: 'الثالث متوسط (ب)' },
      { id: 'st_13', name: 'علي رضا صباح', rollNo: '1013', hallId: 'hall_2', seatNo: 3, className: 'الثالث متوسط (ب)' },
      { id: 'st_14', name: 'مرتضى سعد عواد', rollNo: '1014', hallId: 'hall_2', seatNo: 4, className: 'الثالث متوسط (ب)' },
      { id: 'st_15', name: 'ليث ميثم عبد الزهرة', rollNo: '1015', hallId: 'hall_2', seatNo: 5, className: 'الثالث متوسط (ب)' },
      { id: 'st_16', name: 'حسام نوري حميد', rollNo: '1016', hallId: 'hall_2', seatNo: 6, className: 'الثالث متوسط (ب)' },
      { id: 'st_17', name: 'عمر ياسين طه', rollNo: '1017', hallId: 'hall_2', seatNo: 7, className: 'الثالث متوسط (ب)' },
      { id: 'st_18', name: 'يحيى عادل عزيز', rollNo: '1018', hallId: 'hall_2', seatNo: 8, className: 'الثالث متوسط (ب)' },
      { id: 'st_19', name: 'طارق زياد رشيد', rollNo: '1019', hallId: 'hall_2', seatNo: 9, className: 'الثالث متوسط (ب)' },
      { id: 'st_20', name: 'بشير ماجد حامد', rollNo: '1020', hallId: 'hall_2', seatNo: 10, className: 'الثالث متوسط (ب)' }
    ];

    return {
      schoolName: school,
      governorate: gov,
      examTitle: 'امتحانات نصف السنة للعام الدراسي',
      academicYear: '2024 - 2025 م',
      studentsPerDesk: 1, // 1: طالب واحد بالمقعد (فردي) | 2: طالبان بالمقعد (رحلة مزدوجة - بطاقة مشتركة)
      cardsPerPage: 10, // 8 | 10 | 12 | 14 | 16 | 18 | 20
      cardTheme: 'royalNavy', // royalNavy | emeraldGold | deepTeal | crimson
      cardBorder: 'dashed', // dashed | solid | double | ornate
      showBarcode: false,
      showHallName: true,
      showClassName: true,
      showSeatNo: true,
      halls: sampleHalls,
      students: sampleStudents
    };
  }

  function loadSeatingData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        seatingData = JSON.parse(raw);
        if (!seatingData.halls || seatingData.halls.length === 0) {
          seatingData.halls = getDefaultSeatingData().halls;
        }
        if (!seatingData.students) {
          seatingData.students = [];
        }
        if (typeof seatingData.studentsPerDesk === 'undefined') {
          seatingData.studentsPerDesk = 1;
        }
      } else {
        seatingData = getDefaultSeatingData();
        saveSeatingData(false);
      }
    } catch (e) {
      console.warn('loadSeatingData failed:', e);
      seatingData = getDefaultSeatingData();
    }
  }

  function saveSeatingData(showToastFeedback = true) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seatingData));
      if (showToastFeedback && typeof showToast === 'function') {
        showToast('تم حفظ بيانات خريطة الجلوس والطلاب بنجاح 💾', 'success');
      }
      const badge = document.getElementById('seatingSaveStatusBadge');
      if (badge) {
        badge.innerHTML = '<i class="fa-solid fa-check"></i> تم الحفظ';
        setTimeout(() => {
          badge.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> محفوظ تلقائياً';
        }, 1500);
      }
    } catch (e) {
      console.error('saveSeatingData error:', e);
    }
  }

  // Escape helper
  function esc(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Helper: Extract Educational Stage / Grade without Section (مثال: الثالث متوسط بدون (أ) أو شعبة)
  function formatGradeWithoutSection(str) {
    if (!str) return 'المرحلة الدراسية';
    let s = String(str).trim();
    // إزالة الأقواس وما بداخلها: (أ), (ب), (شعبة 1), etc.
    s = s.replace(/\s*\([^)]*\)/g, '');
    // إزالة عبارات "شعبة أ", "شعبة 1", إلخ
    s = s.replace(/\s*شعبة\s*[\w\u0600-\u06FF]+/g, '');
    // إزالة الشرطات أو الفواصل التابعة للشعبة مثل "- أ", "/ ب"
    s = s.replace(/\s*[-/ـ]\s*[\w\u0600-\u06FF]+$/g, '');
    // تنظيف أي علامات ترقيم زائدة في النهاية
    s = s.replace(/[-/ـ،,]\s*$/g, '').trim();
    return s || 'المرحلة الدراسية';
  }

  // Main Render
  function renderSeatingStudio() {
    if (!seatingData) loadSeatingData();

    syncSettingsInputs();
    updateStatsCounters();
    renderHallFilterTabs();

    ['seatToolbarPrevBtn', 'seatToolbarPageIndicator', 'seatToolbarNextBtn'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = (activeStudioView === 'cards') ? 'inline-flex' : 'none';
    });

    if (activeStudioView === 'cards') {
      renderA4SeatingCards();
    } else if (activeStudioView === 'map') {
      renderHallFloorPlan();
    } else {
      renderStudentsRosterTable();
    }
  }

  function syncSettingsInputs() {
    if (!seatingData) return;
    const elSchool = document.getElementById('seatSchoolInput');
    const elTitle = document.getElementById('seatExamTitleInput');
    const elYear = document.getElementById('seatYearInput');
    const elGov = document.getElementById('seatGovInput');
    const elStudentsPerDesk = document.getElementById('seatStudentsPerDeskSelect');
    const elModalStudentsPerDesk = document.getElementById('seatModalStudentsPerDeskSelect');
    const elCardsPerPage = document.getElementById('seatCardsPerPageSelect');
    const elTheme = document.getElementById('seatThemeSelect');
    const elShowBarcode = document.getElementById('seatShowBarcodeChk');
    const elShowClass = document.getElementById('seatShowClassChk');
    const elShowSeat = document.getElementById('seatShowSeatChk');
    const elShowHall = document.getElementById('seatShowHallChk');

    if (elSchool) elSchool.value = seatingData.schoolName || '';
    if (elTitle) elTitle.value = seatingData.examTitle || '';
    if (elYear) elYear.value = seatingData.academicYear || '';
    if (elGov) elGov.value = seatingData.governorate || '';
    if (elStudentsPerDesk) elStudentsPerDesk.value = String(seatingData.studentsPerDesk || 1);
    if (elModalStudentsPerDesk) elModalStudentsPerDesk.value = String(seatingData.studentsPerDesk || 1);
    if (elCardsPerPage) elCardsPerPage.value = String(seatingData.cardsPerPage || 10);
    if (elTheme) elTheme.value = seatingData.cardTheme || 'royalNavy';
    if (elShowBarcode) elShowBarcode.checked = seatingData.showBarcode === true;
    if (elShowClass) elShowClass.checked = seatingData.showClassName !== false;
    if (elShowSeat) elShowSeat.checked = seatingData.showSeatNo !== false;
    if (elShowHall) elShowHall.checked = seatingData.showHallName !== false;
  }

  function updateStatsCounters() {
    if (!seatingData) return;
    const studentsPerDesk = Number(seatingData.studentsPerDesk || 1);
    const totalStudents = seatingData.students.length;
    const totalDesks = Math.ceil(totalStudents / studentsPerDesk);
    const totalHalls = seatingData.halls.length;
    const perPage = Number(seatingData.cardsPerPage || 10);
    const totalPages = Math.max(1, Math.ceil(totalDesks / perPage));

    let totalCap = 0;
    seatingData.halls.forEach(h => { totalCap += Number(h.capacity || 0); });

    const elTotalSt = document.getElementById('seatStatTotalStudents');
    const elTotalHalls = document.getElementById('seatStatTotalHalls');
    const elTotalPages = document.getElementById('seatStatTotalPages');
    const elTotalCap = document.getElementById('seatStatTotalCapacity');

    if (elTotalSt) elTotalSt.textContent = totalStudents;
    if (elTotalHalls) elTotalHalls.textContent = totalHalls;
    if (elTotalPages) elTotalPages.textContent = totalPages;
    if (elTotalCap) elTotalCap.textContent = totalCap;
  }

  function renderHallFilterTabs() {
    const container = document.getElementById('seatingHallsTabsList');
    if (!container) return;

    let html = `
      <button type="button" class="seat-hall-tab-btn ${activeHallTab === 'all' ? 'active' : ''}" onclick="window.seatingFilterHall('all')">
        <i class="fa-solid fa-border-all"></i>
        <span>جميع القاعات (${seatingData.students.length})</span>
      </button>
    `;

    seatingData.halls.forEach(hall => {
      const count = seatingData.students.filter(s => s.hallId === hall.id).length;
      html += `
        <button type="button" class="seat-hall-tab-btn ${activeHallTab === hall.id ? 'active' : ''}" onclick="window.seatingFilterHall('${hall.id}')">
          <i class="fa-solid fa-door-open"></i>
          <span>${esc(hall.name)} (${count}/${hall.capacity || '—'})</span>
        </button>
      `;
    });

    container.innerHTML = html;
  }

  // Filter students by activeHallTab
  function getFilteredStudents() {
    if (!seatingData || !seatingData.students) return [];
    if (activeHallTab === 'all') return seatingData.students;
    return seatingData.students.filter(s => s.hallId === activeHallTab);
  }

  function getHallName(hallId) {
    if (!seatingData || !seatingData.halls) return 'قاعة غير محددة';
    const found = seatingData.halls.find(h => h.id === hallId);
    return found ? found.name : 'قاعة عامة';
  }

  /**
   * 1. Render A4 Seating Cards (المربعات الأنيقة المصغرة على ورقة A4 عمودية)
   * تصميم مصغر ومرتب ليتسع أكبر عدد من الطلاب في الورقة
   * رقم واسم القاعة في الهامش العلوي للورقة وليس داخل البطاقة
   * داخل البطاقة: اسم الطالب والرقم الامتحاني والمرحلة الدراسية بدون شعبة
   * دعم خيار: مقعد فردي (طالب واحد) أو رحلة مزدوجة (طالبين بنفس الرحلة ببطاقة واحدة)
   */
  function renderA4SeatingCards() {
    const container = document.getElementById('seatingCanvasWrapper');
    if (!container) return;

    const list = getFilteredStudents();
    const studentsPerDesk = Number(seatingData.studentsPerDesk || 1);
    const perPage = Number(seatingData.cardsPerPage || 10);

    // تجميع الطلاب بحسب سعة الرحلة (فردي = 1 طالب لكل بطاقة / مزدوج = طالبين لكل بطاقة)
    const desks = [];
    if (studentsPerDesk === 2) {
      for (let i = 0; i < list.length; i += 2) {
        const deskIndex = Math.floor(i / 2) + 1;
        const st1 = list[i];
        const st2 = (i + 1 < list.length) ? list[i + 1] : null;
        desks.push({
          deskNo: deskIndex,
          st1: st1,
          st2: st2,
          hallId: st1.hallId || (st2 ? st2.hallId : null),
          className: st1.className || (st2 ? st2.className : '')
        });
      }
    } else {
      // مقعد فردي: طالب واحد في كل رحلة/بطاقة
      for (let i = 0; i < list.length; i++) {
        const st = list[i];
        desks.push({
          deskNo: st.seatNo || (i + 1),
          st1: st,
          st2: null,
          hallId: st.hallId,
          className: st.className || ''
        });
      }
    }

    const pagesCount = Math.max(1, Math.ceil(desks.length / perPage));
    totalSeatingPages = pagesCount;
    if (currentSeatingPage > pagesCount) currentSeatingPage = pagesCount;
    if (currentSeatingPage < 1) currentSeatingPage = 1;

    let html = buildSeatingPaginationBarHTML(currentSeatingPage, pagesCount, 'top');

    for (let p = 0; p < pagesCount; p++) {
      const pageNo = p + 1;
      const isPageActive = (pageNo === currentSeatingPage);
      const pageDesks = desks.slice(p * perPage, (p + 1) * perPage);

      // تحديد اسم ورقم القاعة ليظهر في الهامش العلوي للورقة
      let pageHallName = '';
      if (activeHallTab !== 'all') {
        pageHallName = getHallName(activeHallTab);
      } else {
        const uniqueHalls = [...new Set(pageDesks.map(d => d.hallId).filter(Boolean))];
        if (uniqueHalls.length === 1) {
          pageHallName = getHallName(uniqueHalls[0]);
        } else if (uniqueHalls.length > 1) {
          pageHallName = 'قاعات امتحانية متعددة';
        } else {
          pageHallName = 'القاعة الامتحانية';
        }
      }

      html += `
        <div class="seating-a4-paper paper-theme-${esc(seatingData.cardTheme || 'royalNavy')} ${isPageActive ? 'seating-page-active' : 'seating-page-hidden-screen'}" data-page="${pageNo}">
          <!-- Page Header Strip: الهامش العلوي للورقة يضم اسم ورقم القاعة وبيانات الامتحان والمدرسة -->
          <div class="seating-paper-header-strip">
            <div class="sp-hdr-right">
              <span>جمهورية العراق</span> • <span>وزارة التربية</span>
              <small>${esc(seatingData.governorate || 'المديرية العامة للتربية')}</small>
            </div>
            <div class="sp-hdr-center">
              <h2 class="sp-hdr-title">${esc(seatingData.examTitle || 'بطاقات جلوس الطلاب للقاعات الامتحانية')}</h2>
              ${(seatingData.showHallName !== false && pageHallName) ? `
                <div class="sp-hdr-hall-emblem" title="رقم واسم القاعة الامتحانية">
                  <i class="fa-solid fa-door-open"></i>
                  <span>${esc(pageHallName)}</span>
                </div>
              ` : ''}
              <span class="sp-hdr-year">${esc(seatingData.academicYear || '2024 - 2025 م')}</span>
            </div>
            <div class="sp-hdr-left">
              <span class="sp-hdr-school">${esc(seatingData.schoolName || 'اسم المدرسة')}</span>
              <span class="sp-hdr-badge">صفحة ${p + 1} من ${pagesCount}</span>
            </div>
          </div>

          <!-- Cards Grid on A4 Portrait: شبكة البطاقات عالية الكثافة والتنظيم -->
          <div class="seating-cards-grid grid-count-${perPage} ${studentsPerDesk === 2 ? 'dual-desk-mode' : ''}">
      `;

      pageDesks.forEach((desk, idx) => {
        const globalDeskIdx = p * perPage + idx + 1;

        if (studentsPerDesk === 2) {
          // نمط الرحلة المزدوجة: طالبان بنفس المقعد في بطاقة واحدة مستطيلة مقسمة (يظهر لكل طالب الصف الخاص به)
          const st1 = desk.st1;
          const st2 = desk.st2;
          const st1Class = (st1 && st1.className) ? String(st1.className).trim() : 'غير محدد';
          const st2Class = (st2 && st2.className) ? String(st2.className).trim() : 'غير محدد';

          html += `
            <div class="seating-desk-card seating-dual-desk-card">
              <!-- علامات القص الدقيقة -->
              <div class="card-cut-corner tl"></div>
              <div class="card-cut-corner tr"></div>
              <div class="card-cut-corner bl"></div>
              <div class="card-cut-corner br"></div>

              <!-- رأس بطاقة الرحلة: رقم المقعد/الرحلة -->
              <div class="desk-card-header dc-dual-header">
                <span class="dc-seat-pill dc-dual-seat-badge">
                  <i class="fa-solid fa-couch"></i> رحلة رقم: ${esc(desk.deskNo)}
                </span>
                <span class="dc-dual-mode-tag">
                  <i class="fa-solid fa-user-group"></i> مقعد مزدوج
                </span>
              </div>

              <!-- بطاقة تضم اسمين للطالبين جنباً إلى جنب مع صف ورقم كل طالب بشكل مستقل -->
              <div class="dc-dual-students-wrap">
                <!-- الطالب الأول (يمين في RTL) -->
                <div class="dc-dual-student-slot">
                  <div class="dc-slot-top-row">
                    <span class="dc-slot-tag"><i class="fa-solid fa-user"></i> الطالب (1)</span>
                    ${(seatingData.showClassName !== false) ? `
                      <span class="dc-slot-class-pill" title="الصف: ${esc(st1Class)}">
                        <i class="fa-solid fa-graduation-cap"></i> ${esc(st1Class)}
                      </span>
                    ` : ''}
                  </div>
                  <div class="dc-name-block">
                    <span class="dc-field-label">اسم الطالب:</span>
                    <h4 class="dc-dual-name" title="${esc(st1.name)}">${esc(st1.name || 'اسم الطالب')}</h4>
                  </div>
                  <div class="dc-roll-badge dc-dual-roll">
                    <span class="dc-roll-label">الرقم:</span>
                    <span class="dc-roll-number">${esc(st1.rollNo || String(globalDeskIdx * 2 + 999))}</span>
                  </div>
                </div>

                <!-- فاصل عمودي بين الطالبين -->
                <div class="dc-dual-v-divider"></div>

                <!-- الطالب الثاني (يسار في RTL) -->
                ${st2 ? `
                  <div class="dc-dual-student-slot">
                    <div class="dc-slot-top-row">
                      <span class="dc-slot-tag"><i class="fa-solid fa-user"></i> الطالب (2)</span>
                      ${(seatingData.showClassName !== false) ? `
                        <span class="dc-slot-class-pill" title="الصف: ${esc(st2Class)}">
                          <i class="fa-solid fa-graduation-cap"></i> ${esc(st2Class)}
                        </span>
                      ` : ''}
                    </div>
                    <div class="dc-name-block">
                      <span class="dc-field-label">اسم الطالب:</span>
                      <h4 class="dc-dual-name" title="${esc(st2.name)}">${esc(st2.name || 'اسم الطالب')}</h4>
                    </div>
                    <div class="dc-roll-badge dc-dual-roll">
                      <span class="dc-roll-label">الرقم:</span>
                      <span class="dc-roll-number">${esc(st2.rollNo || String(globalDeskIdx * 2 + 1000))}</span>
                    </div>
                  </div>
                ` : `
                  <div class="dc-dual-student-slot slot-empty">
                    <div class="dc-empty-notice">
                      <i class="fa-regular fa-circle-xmark"></i>
                      <span>مقعد شاغر</span>
                    </div>
                  </div>
                `}
              </div>
            </div>
          `;
        } else {
          // نمط المقعد الفردي: بطاقة مدمجة لطالب واحد (اسم الطالب + الرقم الامتحاني + الصف)
          const student = desk.st1;
          const globalIdx = p * perPage + idx + 1;
          const studentClass = (student && student.className) ? String(student.className).trim() : formatGradeWithoutSection(desk.className);

          html += `
            <div class="seating-desk-card">
              <!-- علامات القص الدقيقة -->
              <div class="card-cut-corner tl"></div>
              <div class="card-cut-corner tr"></div>
              <div class="card-cut-corner bl"></div>
              <div class="card-cut-corner br"></div>

              <!-- رأس البطاقة: رقم المقعد وصف الطالب -->
              <div class="desk-card-header">
                ${seatingData.showSeatNo !== false ? `
                  <span class="dc-seat-pill">
                    <i class="fa-solid fa-chair"></i> مقعد ${esc(desk.deskNo)}
                  </span>
                ` : '<span></span>'}
                ${seatingData.showClassName !== false ? `
                  <span class="dc-grade-pill" title="الصف الدراسي">
                    <i class="fa-solid fa-graduation-cap"></i> ${esc(studentClass)}
                  </span>
                ` : ''}
              </div>

              <!-- محتوى البطاقة: اسم الطالب والرقم الامتحاني فقط -->
              <div class="desk-card-body dc-single-body">
                <div class="dc-student-name-box">
                  <span class="dc-field-label">اسم الطالب:</span>
                  <h3 class="dc-student-name" title="${esc(student.name)}">${esc(student.name || 'اسم الطالب')}</h3>
                </div>

                <div class="dc-roll-badge">
                  <span class="dc-roll-label">الرقم الامتحاني:</span>
                  <span class="dc-roll-number">${esc(student.rollNo || String(globalIdx + 1000))}</span>
                </div>
              </div>
            </div>
          `;
        }
      });

      // إكمال الخانات الفارغة في الصفحة الأخيرة للحفاظ على تنسيق الشبكة المنظم
      const remainder = pageDesks.length;
      if (remainder < perPage) {
        for (let k = remainder; k < perPage; k++) {
          html += `
            <div class="seating-desk-card card-blank-placeholder">
              <div class="blank-card-inner">
                <i class="fa-regular fa-square-check"></i>
                <span>${studentsPerDesk === 2 ? 'رحلة شاغرة / احتياط' : 'مقعد شاغر / احتياط'}</span>
              </div>
            </div>
          `;
        }
      }

      html += `
          </div>
          <!-- Page Footer Strip -->
          <div class="seating-paper-footer-strip">
            <small>مسار المعلم الذكي • بطاقات جلوس معتمدة رسمياً للطباعة والقص A4 • نظام توزيع القاعات الفوري</small>
          </div>
        </div>
      `;
    }

    if (pagesCount > 1) {
      html += buildSeatingPaginationBarHTML(currentSeatingPage, pagesCount, 'bottom');
    }

    container.innerHTML = html;
    syncToolbarPaginationControls(currentSeatingPage, pagesCount);
  }

  function buildSeatingPaginationBarHTML(currentPage, pagesCount, pos) {
    let pageDots = '';
    for (let i = 1; i <= pagesCount; i++) {
      pageDots += `
        <button type="button" class="seat-page-num-btn ${i === currentPage ? 'active' : ''}" onclick="window.seatingGoToPage(${i})" title="الانتقال إلى صفحة ${i}">
          ${i}
        </button>
      `;
    }

    return `
      <div class="seating-pagination-bar seating-pagination-${pos} no-print" role="navigation" aria-label="شريط التنقل بين صفحات خريطة الجلوس">
        <button type="button" class="seat-page-nav-btn" onclick="window.seatingPrevPage()" ${currentPage <= 1 ? 'disabled' : ''} title="الصفحة السابقة">
          <i class="fa-solid fa-chevron-right"></i>
          <span>الصفحة السابقة</span>
        </button>

        <div class="seat-page-center-group">
          <span class="seat-page-status-text">
            <i class="fa-solid fa-file-lines"></i>
            صفحة <strong>${currentPage}</strong> من <strong>${pagesCount}</strong>
          </span>
          <div class="seat-page-numbers-list">
            ${pageDots}
          </div>
        </div>

        <button type="button" class="seat-page-nav-btn" onclick="window.seatingNextPage()" ${currentPage >= pagesCount ? 'disabled' : ''} title="الصفحة التالية">
          <span>الصفحة التالية</span>
          <i class="fa-solid fa-chevron-left"></i>
        </button>
      </div>
    `;
  }

  function syncToolbarPaginationControls(currentPage, pagesCount) {
    const prevBtn = document.getElementById('seatToolbarPrevBtn');
    const nextBtn = document.getElementById('seatToolbarNextBtn');
    const indicator = document.getElementById('seatToolbarPageIndicator');

    if (prevBtn) prevBtn.disabled = (currentPage <= 1);
    if (nextBtn) nextBtn.disabled = (currentPage >= pagesCount);
    if (indicator) indicator.textContent = `صفحة ${currentPage} من ${pagesCount}`;
  }

  function updateActiveSeatingPageView() {
    const container = document.getElementById('seatingCanvasWrapper');
    if (!container) return;

    const papers = container.querySelectorAll('.seating-a4-paper');
    const total = papers.length || 1;
    totalSeatingPages = total;
    if (currentSeatingPage > total) currentSeatingPage = total;
    if (currentSeatingPage < 1) currentSeatingPage = 1;

    papers.forEach(paper => {
      const pNo = parseInt(paper.getAttribute('data-page'), 10);
      if (pNo === currentSeatingPage) {
        paper.classList.remove('seating-page-hidden-screen');
        paper.classList.add('seating-page-active');
      } else {
        paper.classList.remove('seating-page-active');
        paper.classList.add('seating-page-hidden-screen');
      }
    });

    const topBar = container.querySelector('.seating-pagination-top');
    if (topBar) {
      topBar.outerHTML = buildSeatingPaginationBarHTML(currentSeatingPage, total, 'top');
    }
    const bottomBar = container.querySelector('.seating-pagination-bottom');
    if (bottomBar) {
      bottomBar.outerHTML = buildSeatingPaginationBarHTML(currentSeatingPage, total, 'bottom');
    }

    syncToolbarPaginationControls(currentSeatingPage, total);
  }

  /**
   * 2. Render Hall Interactive Floor Plan (خريطة القاعة التفاعلية وتوزيع المقاعد)
   */
  function renderHallFloorPlan() {
    const container = document.getElementById('seatingCanvasWrapper');
    if (!container) return;

    const currentHallId = (activeHallTab !== 'all') ? activeHallTab : (seatingData.halls[0] ? seatingData.halls[0].id : null);
    if (!currentHallId) {
      container.innerHTML = '<div class="alert alert-info p-4 text-center">لا توجد قاعات مضافة حالياً. يرجى إضافة قاعة أولاً.</div>';
      return;
    }

    const hall = seatingData.halls.find(h => h.id === currentHallId) || seatingData.halls[0];
    const hallStudents = seatingData.students.filter(s => s.hallId === hall.id);
    const capacity = Number(hall.capacity || 20);
    const cols = Number(hall.cols || 4);

    let html = `
      <div class="seating-floor-plan-card">
        <div class="floor-plan-header">
          <div class="fph-info">
            <h2><i class="fa-solid fa-map-location-dot"></i> ${esc(hall.name)}</h2>
            <span>سعة القاعة: <strong>${hallStudents.length}</strong> / ${capacity} مقعد | عدد الصفوف: ${Math.ceil(capacity / cols)}</span>
          </div>
          <div class="fph-actions">
            <button type="button" class="btn btn-sm btn-primary" onclick="window.seatingOpenAddStudentModal('${hall.id}')">
              <i class="fa-solid fa-user-plus"></i> إضافة طالب للقاعة
            </button>
            <button type="button" class="btn btn-sm btn-outline" onclick="window.seatingPrintCards()">
              <i class="fa-solid fa-print"></i> طباعة كشف القاعة
            </button>
          </div>
        </div>

        <!-- Blackboard / Teacher Podium Front -->
        <div class="floor-plan-podium">
          <i class="fa-solid fa-chalkboard-user"></i> منصة المراقبة والسبورة (مقدمة القاعة الامتحانية)
        </div>

        <!-- Desks Grid in Rows and Columns -->
        <div class="floor-desks-grid" style="grid-template-columns: repeat(${cols}, 1fr);">
    `;

    for (let seat = 1; seat <= capacity; seat++) {
      const student = hallStudents.find(s => Number(s.seatNo) === seat) || hallStudents[seat - 1];

      if (student) {
        html += `
          <div class="floor-desk-item is-occupied" title="مقعد رقم ${seat}: ${esc(student.name)}">
            <div class="desk-seat-tag">مقعد ${seat}</div>
            <div class="desk-roll-tag">${esc(student.rollNo || '—')}</div>
            <div class="desk-student-name">${esc(student.name)}</div>
            <div class="desk-class-tag">${esc(student.className || '')}</div>
            <div class="desk-actions-hover">
              <button type="button" class="btn-desk-action" onclick="window.seatingOpenEditStudentModal('${student.id}')" title="تعديل الطالب"><i class="fa-solid fa-pen"></i></button>
              <button type="button" class="btn-desk-action btn-del" onclick="window.seatingDeleteStudent('${student.id}')" title="حذف الطالب"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        `;
      } else {
        html += `
          <div class="floor-desk-item is-empty" onclick="window.seatingOpenAddStudentModal('${hall.id}', ${seat})" title="مقعد فارغ - انقر لإضافة طالب">
            <div class="desk-seat-tag">مقعد ${seat}</div>
            <div class="empty-desk-content">
              <i class="fa-solid fa-chair"></i>
              <span>مقعد شاغر</span>
            </div>
          </div>
        `;
      }
    }

    html += `
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * 3. Render Students Roster Table (جدول إدارة الطلاب)
   */
  function renderStudentsRosterTable() {
    const container = document.getElementById('seatingCanvasWrapper');
    if (!container) return;

    const list = getFilteredStudents();

    let html = `
      <div class="seating-roster-table-card">
        <div class="roster-table-toolbar">
          <div class="rtt-search-box">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" id="seatSearchStudentInput" placeholder="بحث باسم الطالب أو الرقم الامتحاني..." oninput="window.seatingSearchStudents(this.value)">
          </div>
          <div class="rtt-actions">
            <button type="button" class="btn btn-sm btn-primary" onclick="window.seatingOpenAddStudentModal()">
              <i class="fa-solid fa-user-plus"></i> إضافة طالب جديد
            </button>
            <button type="button" class="btn btn-sm btn-success" onclick="window.seatingOpenAutoNumberModal()">
              <i class="fa-solid fa-arrow-down-1-9"></i> ترقيم امتحاني تلقائي
            </button>
            <button type="button" class="btn btn-sm btn-purple" onclick="window.seatingOpenAutoDistributeModal()">
              <i class="fa-solid fa-arrows-split-up-and-left"></i> توزيع آلي على القاعات
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table seating-admin-table" id="seatingRosterTable">
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th>اسم الطالب الرباعي</th>
                <th>الرقم الامتحاني</th>
                <th>القاعة الامتحانية</th>
                <th>رقم المقعد</th>
                <th>الصف والشعبة</th>
                <th style="width: 100px; text-align: center;">إجراءات</th>
              </tr>
            </thead>
            <tbody>
    `;

    if (list.length === 0) {
      html += `<tr><td colspan="7" class="text-center p-4 text-muted">لا يوجد طلاب مضافون في هذه القاعة حالياً.</td></tr>`;
    } else {
      list.forEach((st, idx) => {
        html += `
          <tr data-student-id="${st.id}">
            <td><span class="st-seq-pill">${idx + 1}</span></td>
            <td><strong>${esc(st.name)}</strong></td>
            <td><span class="st-roll-pill">${esc(st.rollNo || '—')}</span></td>
            <td><span class="st-hall-pill"><i class="fa-solid fa-door-open"></i> ${esc(getHallName(st.hallId))}</span></td>
            <td><span class="st-seat-badge">${esc(st.seatNo || idx + 1)}</span></td>
            <td>${esc(st.className || '—')}</td>
            <td class="text-center">
              <button type="button" class="btn-action-icon" onclick="window.seatingOpenEditStudentModal('${st.id}')" title="تعديل"><i class="fa-solid fa-pen"></i></button>
              <button type="button" class="btn-action-icon btn-danger-icon" onclick="window.seatingDeleteStudent('${st.id}')" title="حذف"><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>
        `;
      });
    }

    html += `
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // Window API
  window.renderSeatingStudio = renderSeatingStudio;

  window.seatingSetView = function(viewMode) {
    activeStudioView = viewMode;
    document.querySelectorAll('.seat-view-mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === viewMode);
    });
    renderSeatingStudio();
  };

  window.seatingFilterHall = function(hallId) {
    activeHallTab = hallId;
    currentSeatingPage = 1;
    renderSeatingStudio();
  };

  window.seatingPrevPage = function() {
    if (activeStudioView !== 'cards') {
      window.seatingSetView('cards');
      return;
    }
    if (currentSeatingPage > 1) {
      currentSeatingPage--;
      updateActiveSeatingPageView();
    }
  };

  window.seatingNextPage = function() {
    if (activeStudioView !== 'cards') {
      window.seatingSetView('cards');
      return;
    }
    if (currentSeatingPage < totalSeatingPages) {
      currentSeatingPage++;
      updateActiveSeatingPageView();
    }
  };

  window.seatingGoToPage = function(pageNo) {
    const p = parseInt(pageNo, 10);
    if (isNaN(p) || p < 1 || p > totalSeatingPages) return;
    currentSeatingPage = p;
    updateActiveSeatingPageView();
  };

  window.seatingUpdateField = function(field, value) {
    if (!seatingData) return;
    seatingData[field] = value;
    if (field === 'cardsPerPage' || field === 'studentsPerDesk') {
      currentSeatingPage = 1;
    }
    saveSeatingData(false);
    renderSeatingStudio();
  };

  window.seatingSaveData = function() {
    saveSeatingData(true);
  };

  // Printing A4 Portrait (100% Crisp Output with All Desk Cards, Zero Blank Paper)
  window.seatingPrintCards = function() {
    window.seatingSetView('cards');
    const wrapper = document.getElementById('seatingCanvasWrapper');
    document.body.classList.add('printing-seating');
    if (wrapper) {
      wrapper.classList.add('seating-print-all-mode');
      wrapper.querySelectorAll('.seating-a4-paper').forEach(p => {
        p.style.opacity = '1';
        p.style.display = 'flex';
      });
    }

    let isCleaned = false;
    const cleanup = () => {
      if (isCleaned) return;
      isCleaned = true;
      document.body.classList.remove('printing-seating');
      if (wrapper) {
        wrapper.classList.remove('seating-print-all-mode');
        // Restore active pagination display
        const perPage = Number(seatingData?.cardsPerPage || 10);
        const activePage = window.activeSeatingPage || 1;
        const papers = wrapper.querySelectorAll('.seating-a4-paper');
        papers.forEach((p, idx) => {
          if (idx + 1 === activePage) {
            p.classList.remove('seating-page-hidden-screen');
            p.classList.add('seating-page-active');
            p.style.display = 'flex';
          } else {
            p.classList.add('seating-page-hidden-screen');
            p.classList.remove('seating-page-active');
            p.style.display = '';
          }
        });
      }
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);

    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 1500);
    }, 280);
  };

  // Keyboard shortcut Ctrl+P / browser print integration
  window.addEventListener('beforeprint', () => {
    const tabSeating = document.getElementById('tab-seating');
    if (tabSeating && tabSeating.style.display !== 'none') {
      document.body.classList.add('printing-seating');
      const wrapper = document.getElementById('seatingCanvasWrapper');
      if (wrapper) wrapper.classList.add('seating-print-all-mode');
    }
  });

  window.addEventListener('afterprint', () => {
    document.body.classList.remove('printing-seating');
    const wrapper = document.getElementById('seatingCanvasWrapper');
    if (wrapper) wrapper.classList.remove('seating-print-all-mode');
  });

  // PDF Export
  window.seatingExportPdf = async function() {
    window.seatingSetView('cards');
    const wrapper = document.getElementById('seatingCanvasWrapper');
    if (wrapper) wrapper.classList.add('seating-print-all-mode');
    if (typeof showToast === 'function') {
      showToast('جاري تجهيز وتصدير ملف PDF عالي الدقة لبطاقات الجلوس A4... 📄', 'info');
    }

    try {
      const printFn = (typeof window.masarPrintToPDF === 'function') ? window.masarPrintToPDF : (typeof window.exportToPDF === 'function' ? window.exportToPDF : null);
      if (printFn) {
        await printFn('#seatingCanvasWrapper', {
          title: 'بطاقات_جلوس_الطلاب_A4',
          orientation: 'portrait',
          pageSize: 'a4',
          margin: '6mm',
          fit: true
        });
        if (typeof showToast === 'function') {
          showToast('تم تصدير بطاقات الجلوس بصيغة PDF بنجاح! 📄✨', 'success');
        }
        return;
      }
      throw new Error('محرك تصدير PDF غير متوفر.');
    } catch (e) {
      console.error('seatingExportPdf error:', e);
      if (typeof showToast === 'function') {
        showToast('تعذر إنشاء ملف الـ PDF لبطاقات الجلوس: ' + (e.message || 'خطأ غير معروف'), 'error');
      }
    } finally {
      if (wrapper) wrapper.classList.remove('seating-print-all-mode');
    }
  };

  // Excel Export
  window.seatingExportExcel = function() {
    if (!seatingData || !seatingData.students || seatingData.students.length === 0) {
      if (typeof showToast === 'function') showToast('لا توجد بيانات طلاب للتصدير', 'warning');
      return;
    }

    try {
      if (typeof XLSX === 'undefined') {
        if (typeof showToast === 'function') showToast('مكتبة Excel غير محملة', 'error');
        return;
      }

      const rows = [
        ['كشف توزيع الطلاب على القاعات الامتحانية والجلوس'],
        ['المدرسة:', seatingData.schoolName || '', 'العام الدراسي:', seatingData.academicYear || '', 'الامتحان:', seatingData.examTitle || ''],
        [],
        ['ت', 'اسم الطالب الرباعي', 'الرقم الامتحاني', 'القاعة الامتحانية', 'رقم المقعد', 'الصف والشعبة']
      ];

      seatingData.students.forEach((st, idx) => {
        rows.push([
          idx + 1,
          st.name || '',
          st.rollNo || '',
          getHallName(st.hallId),
          st.seatNo || (idx + 1),
          st.className || ''
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'توزيع القاعات');
      const filename = `كشف_توزيع_القاعات_${String(seatingData.schoolName || 'مدرسة').replace(/\s+/g, '_')}.xlsx`;
      XLSX.writeFile(wb, filename);

      if (typeof showToast === 'function') showToast('تم تصدير ملف كشف القاعات Excel بنجاح 📗', 'success');
    } catch (e) {
      console.error('seatingExportExcel error:', e);
      if (typeof showToast === 'function') showToast('حدث خطأ أثناء تصدير ملف Excel', 'error');
    }
  };

  // Import from Platform Student Grades
  window.seatingImportFromGrades = function() {
    try {
      let raw = localStorage.getItem('masar_teacher_grades_rosters_v1');
      if (!raw) {
        raw = localStorage.getItem('sg_active_class_data_v1');
      }

      if (!raw) {
        if (typeof showToast === 'function') {
          showToast('لم يتم العثور على سجلات سابقة في سجل الدرجات. يمكنك إضافة الطلاب يدوياً أو استيراد Excel.', 'warning');
        }
        return;
      }

      let parsed = JSON.parse(raw);
      let studentNames = [];
      let className = 'الثالث متوسط';

      if (Array.isArray(parsed)) {
        parsed.forEach(roster => {
          if (roster.students && Array.isArray(roster.students)) {
            roster.students.forEach(st => {
              const name = (typeof st === 'string') ? st : (st.name || '');
              if (name && !studentNames.includes(name)) {
                studentNames.push(name);
              }
            });
          }
        });
      } else if (parsed && parsed.students && Array.isArray(parsed.students)) {
        className = parsed.className || className;
        parsed.students.forEach(st => {
          const name = (typeof st === 'string') ? st : (st.name || '');
          if (name && !studentNames.includes(name)) studentNames.push(name);
        });
      }

      if (studentNames.length === 0) {
        if (typeof showToast === 'function') showToast('لا توجد أسماء طلاب متاحة في السجل', 'info');
        return;
      }

      // Add students to seatingData
      let addedCount = 0;
      const defaultHall = (seatingData.halls[0] && seatingData.halls[0].id) || 'hall_1';
      let maxRoll = 1000;
      seatingData.students.forEach(s => {
        const n = parseInt(s.rollNo, 10);
        if (!isNaN(n) && n > maxRoll) maxRoll = n;
      });

      studentNames.forEach((name, i) => {
        const exists = seatingData.students.some(s => s.name === name);
        if (!exists) {
          maxRoll++;
          seatingData.students.push({
            id: 'st_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            name: name,
            rollNo: String(maxRoll),
            hallId: defaultHall,
            seatNo: seatingData.students.length + 1,
            className: className
          });
          addedCount++;
        }
      });

      saveSeatingData(false);
      renderSeatingStudio();

      if (typeof showToast === 'function') {
        showToast(`تم استيراد ${addedCount} طالب بنجاح من سجل درجات المنصة! 🎉`, 'success');
      }
    } catch (e) {
      console.error('seatingImportFromGrades error:', e);
      if (typeof showToast === 'function') showToast('حدث خطأ أثناء قراءة سجل الدرجات', 'error');
    }
  };

  // Auto Numbering
  window.seatingOpenAutoNumberModal = function() {
    const modal = document.getElementById('seatAutoNumberModal');
    if (modal) modal.classList.add('open');
  };

  window.seatingApplyAutoNumber = function() {
    const startInput = document.getElementById('seatAutoNumberStartInput');
    const startNo = parseInt(startInput ? startInput.value : '1001', 10) || 1001;

    seatingData.students.forEach((st, idx) => {
      st.rollNo = String(startNo + idx);
    });

    saveSeatingData(false);
    renderSeatingStudio();

    const modal = document.getElementById('seatAutoNumberModal');
    if (modal) modal.classList.remove('open');

    if (typeof showToast === 'function') {
      showToast(`تم ترقيم جميع الطلاب تسلسلياً بدءاً من الرقم ${startNo} بنجاح 🔢`, 'success');
    }
  };

  // Auto Distribute into Halls
  window.seatingOpenAutoDistributeModal = function() {
    const modal = document.getElementById('seatAutoDistributeModal');
    if (modal) modal.classList.add('open');
  };

  window.seatingApplyAutoDistribute = function() {
    if (!seatingData.halls || seatingData.halls.length === 0) {
      if (typeof showToast === 'function') showToast('يرجى إضافة قاعة واحدة على الأقل أولاً', 'warning');
      return;
    }

    let currentHallIdx = 0;
    let seatInHall = 1;

    seatingData.students.forEach((st) => {
      const hall = seatingData.halls[currentHallIdx];
      const cap = Number(hall.capacity || 20);

      st.hallId = hall.id;
      st.seatNo = seatInHall;

      seatInHall++;
      if (seatInHall > cap) {
        if (currentHallIdx < seatingData.halls.length - 1) {
          currentHallIdx++;
          seatInHall = 1;
        }
      }
    });

    saveSeatingData(false);
    renderSeatingStudio();

    const modal = document.getElementById('seatAutoDistributeModal');
    if (modal) modal.classList.remove('open');

    if (typeof showToast === 'function') {
      showToast('تم التوزيع التلقائي الذكي للطلاب على القاعات الامتحانية بنجاح 🏛️', 'success');
    }
  };

  // Student CRUD
  window.seatingOpenAddStudentModal = function(preferredHallId, preferredSeatNo) {
    const nameInput = document.getElementById('seatModalStudentName');
    const rollInput = document.getElementById('seatModalStudentRoll');
    const hallSelect = document.getElementById('seatModalStudentHall');
    const seatInput = document.getElementById('seatModalStudentSeat');
    const classInput = document.getElementById('seatModalStudentClass');
    const modalTitle = document.getElementById('seatStudentModalTitle');
    const editIdInput = document.getElementById('seatModalStudentEditId');

    if (editIdInput) editIdInput.value = '';
    if (modalTitle) modalTitle.textContent = 'إضافة طالب جديد للجلوس الامتحاني';
    if (nameInput) nameInput.value = '';

    // Auto next roll number
    let nextRoll = 1001;
    seatingData.students.forEach(s => {
      const n = parseInt(s.rollNo, 10);
      if (!isNaN(n) && n >= nextRoll) nextRoll = n + 1;
    });
    if (rollInput) rollInput.value = String(nextRoll);

    // Populate hall select
    if (hallSelect) {
      hallSelect.innerHTML = seatingData.halls.map(h => `
        <option value="${h.id}" ${preferredHallId === h.id ? 'selected' : ''}>${esc(h.name)}</option>
      `).join('');
    }

    if (seatInput) seatInput.value = preferredSeatNo || (seatingData.students.length + 1);
    if (classInput) classInput.value = (seatingData.students[0] && seatingData.students[0].className) || 'الثالث متوسط (أ)';

    const modal = document.getElementById('seatStudentModal');
    if (modal) modal.classList.add('open');
  };

  window.seatingOpenEditStudentModal = function(studentId) {
    const student = seatingData.students.find(s => s.id === studentId);
    if (!student) return;

    const nameInput = document.getElementById('seatModalStudentName');
    const rollInput = document.getElementById('seatModalStudentRoll');
    const hallSelect = document.getElementById('seatModalStudentHall');
    const seatInput = document.getElementById('seatModalStudentSeat');
    const classInput = document.getElementById('seatModalStudentClass');
    const modalTitle = document.getElementById('seatStudentModalTitle');
    const editIdInput = document.getElementById('seatModalStudentEditId');

    if (editIdInput) editIdInput.value = student.id;
    if (modalTitle) modalTitle.textContent = 'تعديل بيانات الطالب';
    if (nameInput) nameInput.value = student.name || '';
    if (rollInput) rollInput.value = student.rollNo || '';

    if (hallSelect) {
      hallSelect.innerHTML = seatingData.halls.map(h => `
        <option value="${h.id}" ${student.hallId === h.id ? 'selected' : ''}>${esc(h.name)}</option>
      `).join('');
    }

    if (seatInput) seatInput.value = student.seatNo || '';
    if (classInput) classInput.value = student.className || '';

    const modal = document.getElementById('seatStudentModal');
    if (modal) modal.classList.add('open');
  };

  window.seatingSaveStudentModal = function() {
    const editIdInput = document.getElementById('seatModalStudentEditId');
    const nameInput = document.getElementById('seatModalStudentName');
    const rollInput = document.getElementById('seatModalStudentRoll');
    const hallSelect = document.getElementById('seatModalStudentHall');
    const seatInput = document.getElementById('seatModalStudentSeat');
    const classInput = document.getElementById('seatModalStudentClass');

    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) {
      if (typeof showToast === 'function') showToast('يرجى إدخال اسم الطالب', 'warning');
      return;
    }

    const editId = editIdInput ? editIdInput.value : '';
    const rollNo = rollInput ? rollInput.value.trim() : '1001';
    const hallId = hallSelect ? hallSelect.value : (seatingData.halls[0] && seatingData.halls[0].id);
    const seatNo = parseInt(seatInput ? seatInput.value : '1', 10) || 1;
    const className = classInput ? classInput.value.trim() : '';

    if (editId) {
      const st = seatingData.students.find(s => s.id === editId);
      if (st) {
        st.name = name;
        st.rollNo = rollNo;
        st.hallId = hallId;
        st.seatNo = seatNo;
        st.className = className;
      }
    } else {
      seatingData.students.push({
        id: 'st_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        name,
        rollNo,
        hallId,
        seatNo,
        className
      });
    }

    saveSeatingData(false);
    renderSeatingStudio();

    const modal = document.getElementById('seatStudentModal');
    if (modal) modal.classList.remove('open');

    if (typeof showToast === 'function') {
      showToast(editId ? 'تم تعديل بيانات الطالب بنجاح' : 'تمت إضافة الطالب لبطاقات الجلوس بنجاح ✅', 'success');
    }
  };

  window.seatingDeleteStudent = function(studentId) {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب من خريطة الجلوس؟')) return;
    seatingData.students = seatingData.students.filter(s => s.id !== studentId);
    saveSeatingData(false);
    renderSeatingStudio();
    if (typeof showToast === 'function') showToast('تم حذف الطالب', 'info');
  };

  // Close modals helper
  window.seatingCloseModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
  };

  // Hall Management Modal
  window.seatingOpenHallsModal = function() {
    renderHallsManagerList();
    const modal = document.getElementById('seatHallsModal');
    if (modal) modal.classList.add('open');
  };

  function renderHallsManagerList() {
    const listCont = document.getElementById('seatHallsManagerList');
    if (!listCont) return;

    listCont.innerHTML = seatingData.halls.map((h, i) => `
      <div class="hall-manager-item">
        <div class="hmi-info">
          <strong><i class="fa-solid fa-door-open"></i> ${esc(h.name)}</strong>
          <span>سعة: ${h.capacity} مقعد | ${h.cols || 4} أعمدة</span>
        </div>
        <button type="button" class="btn btn-sm btn-danger" onclick="window.seatingDeleteHall('${h.id}')" title="حذف القاعة">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `).join('');
  }

  window.seatingAddNewHall = function() {
    const nameInput = document.getElementById('seatNewHallNameInput');
    const capInput = document.getElementById('seatNewHallCapInput');
    const colsInput = document.getElementById('seatNewHallColsInput');

    const name = nameInput ? nameInput.value.trim() : '';
    const cap = parseInt(capInput ? capInput.value : '20', 10) || 20;
    const cols = parseInt(colsInput ? colsInput.value : '4', 10) || 4;

    if (!name) {
      if (typeof showToast === 'function') showToast('يرجى إدخال اسم القاعة', 'warning');
      return;
    }

    seatingData.halls.push({
      id: 'hall_' + Date.now(),
      name,
      capacity: cap,
      rows: Math.ceil(cap / cols),
      cols
    });

    if (nameInput) nameInput.value = '';
    renderHallsManagerList();
    saveSeatingData(false);
    renderSeatingStudio();

    if (typeof showToast === 'function') showToast('تمت إضافة القاعة بنجاح 🏛️', 'success');
  };

  window.seatingDeleteHall = function(hallId) {
    if (seatingData.halls.length <= 1) {
      if (typeof showToast === 'function') showToast('يجب الاحتفاظ بقاعة واحدة على الأقل', 'warning');
      return;
    }
    if (!confirm('هل أنت متأكد من حذف هذه القاعة؟ سيتم تحويل طلابها للقاعة الأولى.')) return;

    const fallbackId = seatingData.halls.find(h => h.id !== hallId).id;
    seatingData.students.forEach(s => {
      if (s.hallId === hallId) s.hallId = fallbackId;
    });

    seatingData.halls = seatingData.halls.filter(h => h.id !== hallId);
    if (activeHallTab === hallId) activeHallTab = 'all';

    renderHallsManagerList();
    saveSeatingData(false);
    renderSeatingStudio();
  };

  // Search Students in Table View
  window.seatingSearchStudents = function(query) {
    const q = (query || '').toLowerCase().trim();
    const rows = document.querySelectorAll('#seatingRosterTable tbody tr');
    rows.forEach(r => {
      const text = r.textContent.toLowerCase();
      r.style.display = text.includes(q) ? '' : 'none';
    });
  };

  // Clear All Seating Data & Students
  window.seatingClearAllData = function() {
    if (!seatingData) loadSeatingData();
    const count = (seatingData.students || []).length;
    if (count === 0) {
      if (typeof window.showToast === 'function') {
        window.showToast('كشف توزيع المقاعد فارغ بالفعل! لا توجد بيانات لمسحها ℹ️', 'info');
      }
      return;
    }
    if (!confirm(`تحذير: هل أنت متأكد من تفريغ ومسح كافة بيانات توزيع المقاعد والطلاب (${count} طالب) من جميع القاعات؟\nسيتم تفريغ كافة المقاعد للبدء من جديد.`)) {
      return;
    }
    seatingData.students = [];
    saveSeatingData(false);
    renderSeatingStudio();
    if (typeof window.showToast === 'function') {
      window.showToast('تم تفريغ كافة مقاعد وبيانات الطلاب بنجاح 🗑️', 'info');
    }
  };
  window.seatingClearAllOpenData = window.seatingClearAllData;

  // Startup hook
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSeatingData);
  } else {
    loadSeatingData();
  }

})();
