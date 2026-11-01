/**
 * مسار المعلم | استوديو تصميم وإصدار جدول الحصص والدروس الأسبوعي A3 العريض
 * Teacher Path | Official A3 Weekly Timetable & School Schedule Studio 📅📐
 * يدعم: طباعة A3 بالعرض الفاخرة، معاينة حية تفاعلية، أرشفة الجداول، تصدير PDF وإكسل، وتنسيقات رسمية
 */

(function () {
  'use strict';

  // 1. Storage Helpers
  function getScheduleStorageKey() {
    if (typeof window !== 'undefined' && typeof window.getAccountStorageKey === 'function') {
      return window.getAccountStorageKey('masar_weekly_schedules_v1');
    }
    const cur = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    const uid = cur ? (cur.id || cur.username || 'user') : 'guest';
    return `masar_weekly_schedules_v1_${uid}`;
  }

  function getActiveScheduleIdStorageKey() {
    if (typeof window !== 'undefined' && typeof window.getAccountStorageKey === 'function') {
      return window.getAccountStorageKey('masar_active_schedule_id');
    }
    const cur = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    const uid = cur ? (cur.id || cur.username || 'user') : 'guest';
    return `masar_active_schedule_id_${uid}`;
  }

  // 2. Predefined Subject Database with Color Tokens
  const SUBJECTS_DB = [
    { name: 'التربية الإسلامية', icon: 'fa-solid fa-mosque', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
    { name: 'اللغة العربية', icon: 'fa-solid fa-book-quran', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
    { name: 'الرياضيات', icon: 'fa-solid fa-calculator', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
    { name: 'اللغة الإنجليزية', icon: 'fa-solid fa-language', color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff' },
    { name: 'العلوم العامة', icon: 'fa-solid fa-flask-vial', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    { name: 'الفيزياء', icon: 'fa-solid fa-atom', color: '#be185d', bg: '#fdf2f8', border: '#fbcfe8' },
    { name: 'الكيمياء', icon: 'fa-solid fa-vial', color: '#c026d3', bg: '#fdf4ff', border: '#f5d0fe' },
    { name: 'الأحياء', icon: 'fa-solid fa-dna', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    { name: 'الاجتماعيات', icon: 'fa-solid fa-earth-asia', color: '#b45309', bg: '#fffbeb', border: '#fed7aa' },
    { name: 'الحاسوب والذكاء', icon: 'fa-solid fa-laptop-code', color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
    { name: 'التربية الفنية', icon: 'fa-solid fa-palette', color: '#ea580c', bg: '#fff7ed', border: '#ffedd5' },
    { name: 'التربية الرياضية', icon: 'fa-solid fa-medal', color: '#65a30d', bg: '#f7fee7', border: '#d9f99d' },
    { name: 'شاغر / نشاط', icon: 'fa-solid fa-hourglass-half', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' }
  ];

  const DAYS_LIST = [
    { key: 'sun', label: 'الأحد' },
    { key: 'mon', label: 'الإثنين' },
    { key: 'tue', label: 'الثلاثاء' },
    { key: 'wed', label: 'الأربعاء' },
    { key: 'thu', label: 'الخميس' }
  ];

  const SATURDAY_ITEM = { key: 'sat', label: 'السبت' };

  // 3. Default Schedule Generator
  function createDefaultSchedule() {
    const cur = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    const school = (cur && cur.school) ? cur.school : 'مدرسة النخبة النموذجية';
    const gov = (cur && cur.governorate) ? cur.governorate : 'بغداد - الكرخ الثانية';
    const teacher = (cur && cur.name) ? cur.name : 'أستاذ المادة';

    // Standard school structure matching the master timetable blueprint
    const defaultClasses = [
      'الأول (أ)', 'الأول (ب)', 'الأول (ج)',
      'الثاني (أ)', 'الثاني (ب)', 'الثاني (ج)',
      'الثالث (أ)', 'الثالث (ب)',
      'الرابع (أ)', 'الرابع (ب)',
      'الخامس (أ)', 'الخامس (ب)',
      'السادس (أ)', 'السادس (ب)'
    ];

    // Seed realistic sample timetable
    const grid = {};
    const sampleSubjs = [
      'اللغة العربية', 'الرياضيات', 'العلوم', 'القرآن والإسلامية', 
      'اللغة الإنجليزية', 'التربية الرياضية', 'التربية الفنية', 'الاجتماعيات', 'الحاسوب'
    ];

    defaultClasses.forEach((cls, cIdx) => {
      DAYS_LIST.forEach((day, dIdx) => {
        for (let p = 1; p <= 6; p++) {
          const slotKey = `${cls}__${day.key}__${p}`;
          const sIdx = (cIdx * 2 + dIdx * 3 + p) % sampleSubjs.length;
          const subjName = sampleSubjs[sIdx];
          const matchedObj = SUBJECTS_DB.find(s => s.name === subjName) || SUBJECTS_DB[0];
          grid[slotKey] = {
            subject: subjName,
            teacher: `معلم ${((cIdx + p) % 18) + 1}`,
            room: `قاعة ${cIdx + 1}`,
            color: matchedObj.color
          };
        }
      });
    });

    return {
      id: 'sched_' + Date.now(),
      title: 'جدول توزيع الحصص والدروس الأسبوعي العام',
      schoolName: school,
      governorate: gov,
      shiftType: 'دوام صباحي', // صباحي | مسائي | دوام مزدوج
      academicYear: '2024 - 2025 م',
      semester: 'الفصل الدراسي الأول',
      pageSize: 'A3', // 'A3' | 'A4'
      orientation: 'landscape', // landscape only for massive A3 sheet
      theme: 'royalNavy', // 'royalNavy' | 'emeraldGold' | 'deepPurple' | 'modernSlate'
      viewLayout: 'masterScheme', // 'masterScheme' (blueprint table) | 'singleClass'
      includeSaturday: false,
      periodsCount: 6, // 6, 7, 8
      breakAfterPeriod: 3, // Break period
      classes: defaultClasses,
      grid: grid,
      periodTimes: [
        { period: 1, start: '08:00', end: '08:45' },
        { period: 2, start: '08:50', end: '09:35' },
        { period: 3, start: '09:40', end: '10:25' },
        { period: 4, start: '10:50', end: '11:35' },
        { period: 5, start: '11:40', end: '12:25' },
        { period: 6, start: '12:30', end: '01:15' }
      ],
      committeeSign: 'لجنة إعداد الجداول المدرسية',
      assistantSign: 'معاون شؤون الطلبة',
      principalSign: 'مدير المدرسة والختم الرسمي',
      notes: '• يبدأ الاصطفاف الصباحي الساعة 07:45 صباحاً.\n• مدة الحصة الدراسية 45 دقيقة كاملة.\n• الاستراحة والفسحة الكبرى تبدأ بعد الحصة الثالثة ولمدة 25 دقيقة.',
      updatedAt: new Date().toISOString()
    };
  }

  // 4. State
  let schedules = [];
  let activeSchedule = null;
  let activeSelectedClass = null; // Currently selected class
  let autoSaveTimer = null;
  let zoomLevel = 1.0;
  let activeSlotTarget = null; // for modal slot editor

  window.schedGetActiveSchedule = function() {
    return activeSchedule;
  };

  window.schedGetConfig = function() {
    return {
      isA3: (activeSchedule && activeSchedule.pageSize === 'A4') ? false : true,
      orientation: (activeSchedule && activeSchedule.orientation) || 'landscape'
    };
  };

  // 5. Themes Configuration
  const THEMES = {
    royalNavy: {
      id: 'royalNavy',
      name: 'الكحلي الملكي الرسمي 🏛️',
      primary: '#0f2744',
      accent: '#0284c7',
      gold: '#d97706',
      headerBg: 'linear-gradient(135deg, #0f2744 0%, #1e3a5f 100%)',
      dayHeaderBg: '#1e293b',
      border: '#cbd5e1'
    },
    emeraldGold: {
      id: 'emeraldGold',
      name: 'الزمردي الذهبي الفاخر 🌿',
      primary: '#064e3b',
      accent: '#059669',
      gold: '#d97706',
      headerBg: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
      dayHeaderBg: '#064e3b',
      border: '#a7f3d0'
    },
    deepPurple: {
      id: 'deepPurple',
      name: 'البنفسجي الأكاديمي VIP 💎',
      primary: '#4c1d95',
      accent: '#7c3aed',
      gold: '#f59e0b',
      headerBg: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%)',
      dayHeaderBg: '#581c87',
      border: '#ddd6fe'
    },
    modernSlate: {
      id: 'modernSlate',
      name: 'الرمادي العصري الحديث ⚡',
      primary: '#1e293b',
      accent: '#0ea5e9',
      gold: '#f59e0b',
      headerBg: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
      dayHeaderBg: '#1e293b',
      border: '#cbd5e1'
    }
  };

  // 6. Persistence
  function loadSchedules() {
    try {
      const key = getScheduleStorageKey();
      const raw = localStorage.getItem(key);
      if (raw) {
        schedules = JSON.parse(raw);
      } else {
        schedules = [createDefaultSchedule()];
      }
    } catch (e) {
      console.warn('loadSchedules error:', e);
      schedules = [createDefaultSchedule()];
    }

    try {
      const activeIdKey = getActiveScheduleIdStorageKey();
      const savedActiveId = localStorage.getItem(activeIdKey);
      if (savedActiveId) {
        activeSchedule = schedules.find(s => s.id === savedActiveId) || schedules[0] || null;
      } else {
        activeSchedule = schedules[0] || null;
      }
    } catch (_) {
      activeSchedule = schedules[0] || null;
    }

    if (!activeSchedule && schedules.length > 0) {
      activeSchedule = schedules[0];
    }

    if (activeSchedule) {
      if (!activeSchedule.viewLayout) activeSchedule.viewLayout = 'masterScheme';
      if (!activeSchedule.periodsCount) activeSchedule.periodsCount = 6;
      if (!activeSelectedClass || (activeSchedule.classes && !activeSchedule.classes.includes(activeSelectedClass))) {
        activeSelectedClass = (activeSchedule.classes && activeSchedule.classes.length > 0) ? activeSchedule.classes[0] : 'الأول (أ)';
      }
    }
  }

  function saveSchedules(showFeedback = true) {
    try {
      const key = getScheduleStorageKey();
      localStorage.setItem(key, JSON.stringify(schedules));
      if (activeSchedule) {
        const activeIdKey = getActiveScheduleIdStorageKey();
        localStorage.setItem(activeIdKey, activeSchedule.id);
      }
      if (showFeedback) {
        const badge = document.getElementById('schedSaveStatusBadge');
        if (badge) {
          badge.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> محفوظ تلقائياً';
          badge.className = 'sg-status-badge sg-status-saved';
        }
      }
    } catch (e) {
      console.error('saveSchedules error:', e);
    }
  }

  function triggerAutoSave() {
    const badge = document.getElementById('schedSaveStatusBadge');
    if (badge) {
      badge.innerHTML = '<i class="fa-solid fa-arrows-rotate fa-spin"></i> جاري الحفظ...';
      badge.className = 'sg-status-badge sg-status-pending';
    }
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      saveSchedules(true);
    }, 450);
  }

  // 7. Render Settings Form
  function renderScheduleMetaForm() {
    if (!activeSchedule) return;

    const elTitle = document.getElementById('schedTitleInput');
    const elSchool = document.getElementById('schedSchoolInput');
    const elGov = document.getElementById('schedGovInput');
    const elShift = document.getElementById('schedShiftSelect');
    const elYear = document.getElementById('schedYearInput');
    const elSemester = document.getElementById('schedSemesterInput');
    const elPageSize = document.getElementById('schedPageSizeSelect');
    const elPeriods = document.getElementById('schedPeriodsSelect');
    const elBreak = document.getElementById('schedBreakSelect');
    const elSat = document.getElementById('schedSatCheckbox');
    const elNotes = document.getElementById('schedNotesTextarea');

    if (elTitle) elTitle.value = activeSchedule.title || '';
    if (elSchool) elSchool.value = activeSchedule.schoolName || '';
    if (elGov) elGov.value = activeSchedule.governorate || '';
    if (elShift) elShift.value = activeSchedule.shiftType || 'دوام صباحي';
    if (elYear) elYear.value = activeSchedule.academicYear || '';
    if (elSemester) elSemester.value = activeSchedule.semester || '';
    if (elPageSize) elPageSize.value = activeSchedule.pageSize || 'A3';
    if (elPeriods) elPeriods.value = String(activeSchedule.periodsCount || 7);
    if (elBreak) elBreak.value = String(activeSchedule.breakAfterPeriod || 3);
    if (elSat) elSat.checked = !!activeSchedule.includeSaturday;
    if (elNotes) elNotes.value = activeSchedule.notes || '';

    // Highlight active theme pill
    document.querySelectorAll('.sched-theme-pill').forEach(btn => {
      const tid = btn.getAttribute('data-theme');
      btn.classList.toggle('active', tid === (activeSchedule.theme || 'royalNavy'));
    });

    renderClassesPills();
  }

  function renderClassesPills() {
    if (!activeSchedule) return;

    if (!activeSchedule.viewLayout) {
      activeSchedule.viewLayout = 'masterScheme';
    }

    if (!activeSelectedClass || !activeSchedule.classes || !activeSchedule.classes.includes(activeSelectedClass)) {
      activeSelectedClass = (activeSchedule.classes && activeSchedule.classes[0]) || 'الأول (أ)';
    }

    const badge = document.getElementById('schedActiveClassNameBadge');
    if (badge) {
      if (activeSchedule.viewLayout === 'masterScheme') {
        const count = activeSchedule.classes ? activeSchedule.classes.length : 0;
        badge.innerHTML = `<i class="fa-solid fa-table-cells-large text-gold"></i> المخطط العام الشامل (${count} شعبة)`;
      } else {
        badge.innerHTML = `<i class="fa-solid fa-graduation-cap"></i> ${escapeHtml(activeSelectedClass)}`;
      }
    }

    const wrap = document.getElementById('schedClassesPillsWrapper');
    if (!wrap) return;

    if (!activeSchedule.classes || activeSchedule.classes.length === 0) {
      wrap.innerHTML = '<span class="text-muted" style="font-size: 0.85rem;">لا توجد صفوف مضافة حالياً.</span>';
      return;
    }

    const isMaster = (activeSchedule.viewLayout === 'masterScheme');

    wrap.innerHTML = `
      <div style="display: flex; gap: 6px; align-items: center; border-left: 1.5px solid #cbd5e1; padding-left: 8px; margin-left: 6px;">
        <button type="button" class="btn btn-sm ${isMaster ? 'btn-primary' : 'btn-outline'}" onclick="window.schedSetViewLayout('masterScheme')" title="عرض مخطط الجدول العام الشامل لجميع المراحل والشعب معاً كالصورة المعتمدة">
          <i class="fa-solid fa-table-cells-large"></i> المخطط الشامل لكافة الصفوف
        </button>
        <button type="button" class="btn btn-sm ${!isMaster ? 'btn-primary' : 'btn-outline'}" onclick="window.schedSetViewLayout('singleClass')" title="عرض جدول الحصص لصف واحد محدد">
          <i class="fa-solid fa-user-graduate"></i> صف منفرد
        </button>
      </div>

      ${!isMaster ? activeSchedule.classes.map(cls => `
        <button type="button" class="btn btn-sm ${activeSelectedClass === cls ? 'btn-primary' : 'btn-outline'}" onclick="window.schedFilterClass('${escapeHtml(cls)}')">
          <i class="fa-solid fa-graduation-cap"></i> ${escapeHtml(cls)}
        </button>
      `).join('') : `
        <span class="text-muted" style="font-size: 0.82rem; padding: 2px 6px;">
          <i class="fa-solid fa-layer-group text-primary"></i> معروض الآن: ${activeSchedule.classes.length} صفوف وشعب بمخطط شامل موحد
        </span>
      `}

      <button type="button" class="btn btn-sm btn-soft-info" onclick="window.schedOpenManageClassesModal()" title="إضافة وتعديل الصفوف">
        <i class="fa-solid fa-plus"></i> إضافة صف / شعبة
      </button>
      <button type="button" class="btn btn-sm btn-soft-warning" onclick="window.schedPrintAllClasses()" title="طباعة كافة الصفوف المدرسية دفعة واحدة (صفحة لكل صف)">
        <i class="fa-solid fa-print"></i> طباعة صفحة لكل صف
      </button>
    `;
  }

  window.schedSetViewLayout = function(mode) {
    if (!activeSchedule) return;
    activeSchedule.viewLayout = mode;
    renderClassesPills();
    renderLiveSchedulePreview();
    triggerAutoSave();
  };

  window.schedFilterClass = function(clsName) {
    activeSelectedClass = clsName;
    renderClassesPills();
    renderLiveSchedulePreview();
  };

  // Distinct, Eye-Friendly Luxury Color Palettes for Days of the Week
  const DAY_PALETTES = {
    'sat': {
      bg: 'linear-gradient(180deg, #334155 0%, #1e293b 100%)', // السبت: سلايت رصاصي وقور
      border: '#0f172a',
      lightBg: '#f8fafc',
      accent: '#64748b'
    },
    'sun': {
      bg: 'linear-gradient(180deg, #1e3a8a 0%, #0f2744 100%)', // الأحد: كحلي ملكي
      border: '#0f2744',
      lightBg: '#eff6ff',
      accent: '#3b82f6'
    },
    'mon': {
      bg: 'linear-gradient(180deg, #0369a1 0%, #075985 100%)', // الإثنين: أزرق ياقوتي محيطي
      border: '#075985',
      lightBg: '#f0f9ff',
      accent: '#0284c7'
    },
    'tue': {
      bg: 'linear-gradient(180deg, #065f46 0%, #022c22 100%)', // الثلاثاء: زمردي إسلامي فخم
      border: '#022c22',
      lightBg: '#f0fdf4',
      accent: '#10b981'
    },
    'wed': {
      bg: 'linear-gradient(180deg, #9a3412 0%, #7c2d12 100%)', // الأربعاء: عنبري نحاسي دافئ
      border: '#431407',
      lightBg: '#fff7ed',
      accent: '#f97316'
    },
    'thu': {
      bg: 'linear-gradient(180deg, #4338ca 0%, #312e81 100%)', // الخميس: بنفسجي إنديجو ملوكي
      border: '#1e1b4b',
      lightBg: '#eef2ff',
      accent: '#818cf8'
    }
  };

  // Distinct Executive Luxury Palettes for Grade Stages (المراحل الدراسية)
  const GRADE_PALETTES = [
    { gradeBg: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)', text: '#ffffff', border: '#172554' }, // الأول: كحلي ملكي
    { gradeBg: 'linear-gradient(135deg, #047857 0%, #059669 100%)', text: '#ffffff', border: '#064e3b' }, // الثاني: زمردي نبيل
    { gradeBg: 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)', text: '#ffffff', border: '#450a0a' }, // الثالث: ياقوتي أحمر
    { gradeBg: 'linear-gradient(135deg, #581c87 0%, #7c3aed 100%)', text: '#ffffff', border: '#3b0764' }, // الرابع: بنفسجي إمبراطوري
    { gradeBg: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)', text: '#ffffff', border: '#134e4a' }, // الخامس: تيل فيروزي
    { gradeBg: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)', text: '#ffffff', border: '#78350f' }, // السادس: عنبري ذهبي
    { gradeBg: 'linear-gradient(135deg, #334155 0%, #475569 100%)', text: '#ffffff', border: '#0f172a' }, // السابع: سلايت رصاصي
    { gradeBg: 'linear-gradient(135deg, #831843 0%, #be185d 100%)', text: '#ffffff', border: '#500724' }  // الثامن: قرمزي مخملي
  ];

  function getGradePalette(gradeName, fallbackIndex) {
    const g = String(gradeName).trim();
    if (g.includes('أول') || g.includes('1')) return GRADE_PALETTES[0];
    if (g.includes('ثان') || g.includes('2')) return GRADE_PALETTES[1];
    if (g.includes('ثالث') || g.includes('3')) return GRADE_PALETTES[2];
    if (g.includes('رابع') || g.includes('4')) return GRADE_PALETTES[3];
    if (g.includes('خامس') || g.includes('5')) return GRADE_PALETTES[4];
    if (g.includes('سادس') || g.includes('6')) return GRADE_PALETTES[5];
    if (g.includes('سابع') || g.includes('7')) return GRADE_PALETTES[6];
    if (g.includes('ثامن') || g.includes('8')) return GRADE_PALETTES[7];
    return GRADE_PALETTES[fallbackIndex % GRADE_PALETTES.length];
  }

  // Distinct Color Codes for Sections (الشعب: أ، ب، ج، د، هـ...)
  const SECTION_PALETTES_MAP = {
    'أ': { bg: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)', color: '#1d4ed8' }, // شعبة أ: أزرق ملكي ناصع
    'ب': { bg: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)', color: '#0284c7' }, // شعبة ب: سماوي محيطي
    'ج': { bg: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: '#059669' }, // شعبة ج: زمردي مشرق
    'د': { bg: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)', color: '#7c3aed' }, // شعبة د: بنفسجي زاهي
    'هـ': { bg: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)', color: '#d97706' }, // شعبة هـ: عنبري مشرق
    'ه': { bg: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)', color: '#d97706' }, // شعبة ه: عنبري مشرق
    'و': { bg: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)', color: '#e11d48' }, // شعبة و: وردي قرمزي
    'ز': { bg: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)', color: '#0f766e' }, // شعبة ز: تيل بترولي
    'ح': { bg: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)', color: '#4338ca' }  // شعبة ح: نيلي
  };

  function getSectionPalette(sectionName, sectionIndex) {
    const s = String(sectionName).trim();
    if (SECTION_PALETTES_MAP[s]) return SECTION_PALETTES_MAP[s];
    if (s.toLowerCase() === 'a' || s === '1') return SECTION_PALETTES_MAP['أ'];
    if (s.toLowerCase() === 'b' || s === '2') return SECTION_PALETTES_MAP['ب'];
    if (s.toLowerCase() === 'c' || s === '3') return SECTION_PALETTES_MAP['ج'];
    if (s.toLowerCase() === 'd' || s === '4') return SECTION_PALETTES_MAP['د'];
    if (s.toLowerCase() === 'e' || s === '5') return SECTION_PALETTES_MAP['هـ'];
    if (s.toLowerCase() === 'f' || s === '6') return SECTION_PALETTES_MAP['و'];
    const fallbackList = Object.values(SECTION_PALETTES_MAP);
    return fallbackList[sectionIndex % fallbackList.length];
  }

  // Group classes by grade name and section
  function getGroupedClasses(classesList) {
    const gradeMap = new Map();

    classesList.forEach((cls) => {
      let grade = cls;
      let section = 'أ';

      const parenMatch = cls.match(/^(.*?)\s*[\(\[\{](.+?)[\)\]\}]$/);
      if (parenMatch) {
        grade = parenMatch[1].trim();
        section = parenMatch[2].trim();
      } else {
        const dashMatch = cls.match(/^(.*?)\s*[-–—/]\s*(.+?)$/);
        if (dashMatch) {
          grade = dashMatch[1].trim();
          section = dashMatch[2].trim();
        } else {
          const words = cls.trim().split(/\s+/);
          if (words.length > 1 && words[words.length - 1].length <= 2) {
            section = words.pop();
            grade = words.join(' ');
          }
        }
      }

      if (!gradeMap.has(grade)) {
        const pal = getGradePalette(grade, gradeMap.size);
        gradeMap.set(grade, {
          grade: grade,
          palette: pal,
          sections: []
        });
      }

      const secPal = getSectionPalette(section, gradeMap.get(grade).sections.length);
      gradeMap.get(grade).sections.push({
        fullClass: cls,
        section: section,
        color: secPal.color,
        bg: secPal.bg
      });
    });

    return Array.from(gradeMap.values());
  }

  // Soft pastel subject tinting - Eye-friendly, distinctive, luxurious
  function getSubjectPastelColor(subjectName) {
    if (!subjectName || subjectName === 'شاغر') {
      return { bg: '#ffffff', text: '#94a3b8', border: '#e2e8f0' };
    }
    const s = subjectName.trim();
    if (s.includes('عرب') || s.includes('لغة عربية') || s.includes('قراءة') || s.includes('قواعد')) {
      return { bg: '#f0f9ff', text: '#0369a1', border: '#bae6fd' }; // Soft Sky Blue
    }
    if (s.includes('رياض') && !s.includes('رياضة')) {
      return { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' }; // Soft Warm Peach
    }
    if (s.includes('علوم') || s.includes('أحياء') || s.includes('كيمياء') || s.includes('فيزياء')) {
      return { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' }; // Soft Mint Green
    }
    if (s.includes('إسلام') || s.includes('قرآن') || s.includes('دين')) {
      return { bg: '#fefce8', text: '#a16207', border: '#fef08a' }; // Soft Golden Amber
    }
    if (s.includes('إنكليز') || s.includes('انجليز') || s.includes('English')) {
      return { bg: '#fdf2f8', text: '#be185d', border: '#fbcfe8' }; // Soft Rose Pink
    }
    if (s.includes('رياضة') || s.includes('ألعاب') || s.includes('العاب')) {
      return { bg: '#f0fdfa', text: '#0f766e', border: '#99f6e4' }; // Soft Ocean Teal
    }
    if (s.includes('فني') || s.includes('رسم') || s.includes('موسيقى')) {
      return { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' }; // Soft Velvet Lavender
    }
    if (s.includes('اجتماع') || s.includes('تاريخ') || s.includes('جغرافي') || s.includes('وطنية')) {
      return { bg: '#f8fafc', text: '#334155', border: '#e2e8f0' }; // Soft Classic Slate
    }
    if (s.includes('حاسوب') || s.includes('تقني')) {
      return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' }; // Soft Technical Indigo
    }
    if (s.includes('أعمال') || s.includes('أخلاق') || s.includes('فرنس') || s.includes('اتيكيت')) {
      return { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' }; // Soft Warm Coral
    }
    // High-harmony pastel hash fallback
    let hash = 0;
    for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash % 360);
    return {
      bg: `hsl(${hue}, 85%, 96%)`,
      text: `hsl(${hue}, 85%, 26%)`,
      border: `hsl(${hue}, 65%, 85%)`
    };
  }

  // Master Scheme Blueprint HTML Generator (Executive Royal Blue Table)
  function buildMasterSchemeTableHtml(schedule) {
    if (!schedule) return '';
    const days = schedule.includeSaturday ? [SATURDAY_ITEM, ...DAYS_LIST] : DAYS_LIST;
    const periodsNum = schedule.periodsCount || 6;
    const grouped = getGroupedClasses(schedule.classes || []);

    if (grouped.length === 0) {
      return '<div class="alert alert-info">يرجى إضافة صفوف وشعب أولاً من زر "إدارة الصفوف".</div>';
    }

    let totalSections = 0;
    grouped.forEach(g => { totalSections += g.sections.length; });

    // Dynamic widths for Day and Period columns depending on total sections count
    const dayColWidth = (totalSections > 22) ? '26px' : (totalSections > 14 ? '32px' : (totalSections > 8 ? '38px' : '44px'));
    const periodColWidth = (totalSections > 22) ? '16px' : (totalSections > 14 ? '18px' : (totalSections > 8 ? '22px' : '26px'));

    let html = `
      <table class="master-scheme-table" style="table-layout: fixed; width: 100%;">
        <colgroup>
          <col style="width: ${dayColWidth};">
          <col style="width: ${periodColWidth};">
          ${grouped.map(g => g.sections.map(() => '<col>').join('')).join('')}
        </colgroup>
        <thead>
          <!-- Row 1: Grade Headers (Royal Blue & Sapphire Luxury Gradients) -->
          <tr>
            <th rowspan="2" class="mth-day-col" style="width: ${dayColWidth};">اليـوم</th>
            <th rowspan="2" class="mth-period-col" style="width: ${periodColWidth};">د</th>
            ${grouped.map(g => `
              <th colspan="${g.sections.length}" class="mth-grade-header" style="background: ${g.palette.gradeBg}; color: ${g.palette.text};">
                ${escapeHtml(g.grade)}
              </th>
            `).join('')}
          </tr>
          <!-- Row 2: Section Headers (Distinct Coordinated Chips) -->
          <tr>
            ${grouped.map(g => 
              g.sections.map(s => `
                <th class="mth-section-header" style="background: ${s.bg || s.color} !important;">
                  ${escapeHtml(s.section)}
                </th>
              `).join('')
            ).join('')}
          </tr>
        </thead>
        <tbody>
    `;

    days.forEach((day) => {
      const dayPal = DAY_PALETTES[day.key] || DAY_PALETTES['sun'];
      for (let p = 1; p <= periodsNum; p++) {
        const isStart = (p === 1);
        const isEnd = (p === periodsNum);
        const isEven = (p % 2 === 0);
        const rowClass = `${isStart ? 'master-day-start-row' : ''} ${isEnd ? 'master-day-end-row' : ''} ${isEven ? 'master-period-even-row' : 'master-period-odd-row'}`;

        html += `<tr class="${rowClass}">`;

        if (isStart) {
          html += `
            <td rowspan="${periodsNum}" class="master-td-day-label" style="background: ${dayPal.bg} !important; border: 1.5px solid ${dayPal.border} !important;">
              <div class="master-day-text">${escapeHtml(day.label)}</div>
            </td>
          `;
        }

        html += `<td class="master-td-period-num">${p}</td>`;

        grouped.forEach(g => {
          g.sections.forEach(s => {
            const slotKey = `${s.fullClass}__${day.key}__${p}`;
            const slot = (schedule.grid && schedule.grid[slotKey]) ? schedule.grid[slotKey] : null;
            const subj = slot ? (slot.subject || '') : '';
            const teacher = slot ? (slot.teacher || '') : '';
            const pastel = getSubjectPastelColor(subj);

            html += `
              <td class="master-td-cell"
                  onclick="window.schedOpenSlotEditor('${escapeHtml(slotKey)}', '${escapeHtml(s.fullClass)}', '${escapeHtml(day.label)}', ${p})"
                  title="${escapeHtml(s.fullClass)} • ${escapeHtml(day.label)} • الحصة ${p} • ${escapeHtml(subj || 'شاغر')}">
                <div class="m-cell-content" style="background-color: ${pastel.bg}; color: ${pastel.text}; border: 1px solid ${pastel.border};">
                  <span class="m-cell-subj">${escapeHtml(subj || '—')}</span>
                  ${teacher ? `<span class="m-cell-teacher">${escapeHtml(teacher)}</span>` : ''}
                </div>
              </td>
            `;
          });
        });

        html += `</tr>`;
      }
    });

    html += `
        </tbody>
      </table>
    `;

    return html;
  }

  // Single Class Traditional Table HTML Generator
  function buildSingleClassTableHtml(schedule, currentClass, days, periodsNum, breakAfter) {
    return `
      <table class="timetable-table">
        <thead>
          <tr>
            <th class="th-day-head" style="width: 120px;">اليـوم</th>
            ${Array.from({ length: periodsNum }, (_, idx) => {
              const p = idx + 1;
              const timeInfo = (schedule.periodTimes && schedule.periodTimes[idx]) ? schedule.periodTimes[idx] : null;
              const isAfterBreak = (p === breakAfter + 1);
              const isBreakPeriod = (p === breakAfter);
              return `
                <th class="th-period ${isAfterBreak ? 'is-after-break' : ''}">
                  <div class="th-period-title">الحصة ${p}</div>
                  ${timeInfo ? `<div class="th-period-time">${timeInfo.start} - ${timeInfo.end}</div>` : ''}
                  ${isBreakPeriod ? `<div class="break-notice-tag"><i class="fa-solid fa-mug-hot"></i> استراحة</div>` : ''}
                </th>
              `;
            }).join('')}
          </tr>
        </thead>
        <tbody>
          ${days.map(day => {
            const dayPal = DAY_PALETTES[day.key] || DAY_PALETTES['sun'];
            return `
              <tr class="tr-schedule-row">
                <td class="td-day-cell" style="background: ${dayPal.lightBg} !important; border-right: 4px solid ${dayPal.border} !important;">
                  <span class="day-arabic-name" style="color: ${dayPal.border} !important;">${escapeHtml(day.label)}</span>
                </td>
                ${Array.from({ length: periodsNum }, (_, pIdx) => {
                  const p = pIdx + 1;
                  const isAfterBreak = (p === breakAfter + 1);
                  const slotKey = `${currentClass}__${day.key}__${p}`;
                  const slot = (schedule.grid && schedule.grid[slotKey]) ? schedule.grid[slotKey] : null;
                  const subj = slot ? (slot.subject || 'شاغر') : 'شاغر';
                  const teacher = slot ? (slot.teacher || '') : '';
                  const room = slot ? (slot.room || '') : '';
                  const color = slot ? (slot.color || '#0284c7') : '#94a3b8';
                  const isVacant = (!slot || !slot.subject || slot.subject === 'شاغر');

                  return `
                    <td class="td-slot-cell ${isAfterBreak ? 'cell-after-break' : ''} ${isVacant ? 'is-vacant' : ''}" 
                        onclick="window.schedOpenSlotEditor('${escapeHtml(slotKey)}', '${escapeHtml(currentClass)}', '${escapeHtml(day.label)}', ${p})"
                        title="انقر لتعديل الحصة (${day.label} - ${currentClass} - الحصة ${p})">
                      <div class="slot-card" style="border-right-color: ${color};">
                        <div class="slot-subject" style="color: ${isVacant ? '#94a3b8' : color};">
                          ${escapeHtml(subj)}
                        </div>
                        ${teacher ? `<div class="slot-teacher"><i class="fa-solid fa-user-tie"></i> ${escapeHtml(teacher)}</div>` : ''}
                        ${room ? `<div class="slot-room"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(room)}</div>` : ''}
                      </div>
                    </td>
                  `;
                }).join('')}
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  // Interactive Workspace Schedule Grid
  function renderInteractiveEditorGrid() {
    const wrap = document.getElementById('schedInteractiveEditorGrid');
    if (!wrap || !activeSchedule) return;

    const isMaster = (activeSchedule.viewLayout !== 'singleClass');
    if (isMaster) {
      wrap.innerHTML = buildMasterSchemeTableHtml(activeSchedule);
    } else {
      const periodsNum = activeSchedule.periodsCount || 6;
      const breakAfter = activeSchedule.breakAfterPeriod || 3;
      const days = activeSchedule.includeSaturday ? [SATURDAY_ITEM, ...DAYS_LIST] : DAYS_LIST;
      const currentClass = activeSelectedClass || (activeSchedule.classes && activeSchedule.classes[0]) || 'الصف الدراسي';
      wrap.innerHTML = buildSingleClassTableHtml(activeSchedule, currentClass, days, periodsNum, breakAfter);
    }
  }

  // Core Timetable HTML Generator (Single Page Architecture)
  function buildScheduleHtml(schedule, isPrintMode = false, forcedClass = null) {
    if (!schedule) return '';

    const theme = THEMES[schedule.theme] || THEMES.royalNavy;
    const periodsNum = schedule.periodsCount || 6;
    const breakAfter = schedule.breakAfterPeriod || 3;
    const days = schedule.includeSaturday ? [SATURDAY_ITEM, ...DAYS_LIST] : DAYS_LIST;
    const currentClass = forcedClass || activeSelectedClass || (schedule.classes && schedule.classes[0]) || 'الصف الدراسي';
    const isMaster = !forcedClass && (schedule.viewLayout !== 'singleClass');

    const isA3 = (schedule.pageSize || 'A3') === 'A3';

    const grouped = getGroupedClasses(schedule.classes || []);
    let totalSections = 0;
    grouped.forEach(g => { totalSections += g.sections.length; });

    const totalDays = days.length;
    const totalRows = isMaster ? (totalDays * periodsNum) : totalDays;

    // Smart density classification to ensure single-page fit
    let densityClass = 'density-normal';
    if (isMaster) {
      if (totalRows >= 40 || totalSections > 18) {
        densityClass = 'density-ultra-compact';
      } else if (totalRows >= 34 || totalSections > 12) {
        densityClass = 'density-super-compact';
      } else if (totalRows >= 28 || totalSections > 6) {
        densityClass = 'density-compact';
      }
    }

    return `
      <div class="a3-timetable-paper theme-${schedule.theme || 'royalNavy'} ${isA3 ? 'paper-size-a3' : 'paper-size-a4'} ${isPrintMode ? 'is-print-mode' : ''} ${densityClass}" id="renderedTimetablePaper">
        
        <!-- Clean Single Sheet Frame (Zero Vertical Waste) -->
        <div class="timetable-sheet-frame">

          <!-- Ultra-Minimalist Official Single-Line Header Strip (No Bulky Bar, No Yellow Accents) -->
          <header class="tt-minimal-header-strip">
            <div class="tt-min-side tt-min-right">
              <span>جمهورية العراق - وزارة التربية</span>
              ${schedule.governorate ? `<span class="tt-min-dot">•</span><span>${escapeHtml(schedule.governorate)}</span>` : ''}
            </div>

            <div class="tt-min-center">
              <span class="tt-min-title">${escapeHtml(schedule.title || 'جدول توزيع الحصص والدروس الأسبوعي')}</span>
              ${schedule.academicYear ? `<span class="tt-min-meta">(${escapeHtml(schedule.academicYear)})</span>` : ''}
              ${schedule.shiftType ? `<span class="tt-min-meta">(${escapeHtml(schedule.shiftType)})</span>` : ''}
            </div>

            <div class="tt-min-side tt-min-left">
              <span class="tt-min-school">${escapeHtml(schedule.schoolName || 'اسم المدرسة')}</span>
            </div>
          </header>

          <!-- Main Timetable Grid Container -->
          <main class="timetable-grid-container">
            ${isMaster ? buildMasterSchemeTableHtml(schedule) : buildSingleClassTableHtml(schedule, currentClass, days, periodsNum, breakAfter)}
          </main>

        </div>

      </div>
    `;
  }

  // 9. Preview Toggle & Drawer Controller (User opens and closes on demand)
  let isPreviewOpen = false;

  window.schedTogglePreview = function() {
    window.schedSetPreviewOpen(!isPreviewOpen);
  };

  window.schedOpenPreview = function() {
    window.schedSetPreviewOpen(true);
  };

  window.schedClosePreview = function() {
    window.schedSetPreviewOpen(false);
  };

  window.schedSetPreviewOpen = function(open) {
    isPreviewOpen = !!open;
    const section = document.getElementById('schedPreviewCollapsibleSection');
    const heroBtnText = document.getElementById('schedHeroPreviewBtnText');
    const topBtnLabel = document.getElementById('schedTopPreviewBtnLabel');
    const topBtn = document.getElementById('schedTopPreviewBtn');

    if (section) {
      section.style.display = isPreviewOpen ? 'flex' : 'none';
      if (isPreviewOpen) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        renderLiveSchedulePreview();
      }
    }

    if (heroBtnText) {
      heroBtnText.innerText = isPreviewOpen ? 'إغلاق ورقة المعاينة ✖️' : 'معاينة ورقة الجدول A3';
    }

    if (topBtnLabel) {
      topBtnLabel.innerText = isPreviewOpen ? 'إغلاق المعاينة' : 'المعاينة الرسمية A3';
    }

    if (topBtn) {
      topBtn.classList.toggle('active', isPreviewOpen);
    }
  };

  // 10. Live Preview Renderer
  function renderLiveSchedulePreview() {
    renderInteractiveEditorGrid();

    const wrap = document.getElementById('schedPreviewCanvasWrapper');
    if (!wrap || !activeSchedule) return;

    wrap.innerHTML = buildScheduleHtml(activeSchedule, false);

    const paper = document.getElementById('renderedTimetablePaper');
    if (paper) {
      paper.style.transform = `scale(${zoomLevel})`;
    }

    const zoomText = document.getElementById('schedZoomPercentText');
    if (zoomText) {
      zoomText.innerText = `${Math.round(zoomLevel * 100)}%`;
    }
  }

  // 10. Zoom Controls
  window.schedZoomIn = function() {
    zoomLevel = Math.min(1.5, zoomLevel + 0.1);
    applyZoom();
  };

  window.schedZoomOut = function() {
    zoomLevel = Math.max(0.5, zoomLevel - 0.1);
    applyZoom();
  };

  window.schedZoomReset = function() {
    zoomLevel = 1.0;
    applyZoom();
  };

  window.schedZoomFit = function() {
    // Fit A3 width into container
    const wrap = document.getElementById('schedPreviewCanvasWrapper');
    if (wrap) {
      const containerWidth = wrap.clientWidth || 1000;
      // standard A3 width in px around 1280px
      zoomLevel = Math.min(1.0, Math.max(0.55, (containerWidth - 40) / 1300));
      applyZoom();
    }
  };

  function applyZoom() {
    const paper = document.getElementById('renderedTimetablePaper');
    if (paper) paper.style.transform = `scale(${zoomLevel})`;
    const zoomText = document.getElementById('schedZoomPercentText');
    if (zoomText) zoomText.innerText = `${Math.round(zoomLevel * 100)}%`;
  }

  // 11. Interactive Slot Editor Modal
  window.schedOpenSlotEditor = function(slotKey, cls, dayLabel, periodNum) {
    if (!activeSchedule) return;
    activeSlotTarget = slotKey;

    const modal = document.getElementById('schedSlotEditorModal');
    if (!modal) return;

    const currentSlot = (activeSchedule.grid && activeSchedule.grid[slotKey]) ? activeSchedule.grid[slotKey] : null;

    const elTitle = document.getElementById('schedSlotModalTitle');
    const elSubj = document.getElementById('schedSlotSubjectSelect');
    const elTeacher = document.getElementById('schedSlotTeacherInput');
    const elRoom = document.getElementById('schedSlotRoomInput');

    if (elTitle) {
      elTitle.innerText = `تعديل الحصة (${dayLabel} • ${cls} • الحصة ${periodNum})`;
    }

    if (elSubj) {
      elSubj.value = currentSlot ? (currentSlot.subject || '') : 'التربية الإسلامية';
    }

    if (elTeacher) {
      elTeacher.value = currentSlot ? (currentSlot.teacher || '') : '';
    }

    if (elRoom) {
      elRoom.value = currentSlot ? (currentSlot.room || '') : '';
    }

    renderSubjectChipsPicker(currentSlot ? currentSlot.subject : '');

    modal.classList.add('open');
  };

  function renderSubjectChipsPicker(selectedSubject) {
    const wrap = document.getElementById('schedSubjectChipsPicker');
    if (!wrap) return;

    wrap.innerHTML = SUBJECTS_DB.map(s => {
      const isAct = s.name === selectedSubject;
      return `
        <button type="button" class="sched-subject-chip-btn ${isAct ? 'active' : ''}" 
                style="border-color: ${s.color}; color: ${s.color}; background: ${isAct ? s.bg : '#fff'};"
                onclick="window.schedPickSubjectChip('${escapeHtml(s.name)}', '${s.color}')">
          <i class="${s.icon}"></i>
          <span>${escapeHtml(s.name)}</span>
        </button>
      `;
    }).join('');
  }

  window.schedPickSubjectChip = function(subjName, color) {
    const elSubj = document.getElementById('schedSlotSubjectSelect');
    if (elSubj) elSubj.value = subjName;
    renderSubjectChipsPicker(subjName);
  };

  window.schedCloseSlotEditor = function() {
    const modal = document.getElementById('schedSlotEditorModal');
    if (modal) modal.classList.remove('open');
    activeSlotTarget = null;
  };

  window.schedSaveSlotChanges = function() {
    if (!activeSchedule || !activeSlotTarget) return;

    const elSubj = document.getElementById('schedSlotSubjectSelect');
    const elTeacher = document.getElementById('schedSlotTeacherInput');
    const elRoom = document.getElementById('schedSlotRoomInput');

    const subjName = elSubj ? elSubj.value : 'شاغر';
    const subjMatch = SUBJECTS_DB.find(s => s.name === subjName) || SUBJECTS_DB[0];

    if (!activeSchedule.grid) activeSchedule.grid = {};

    activeSchedule.grid[activeSlotTarget] = {
      subject: subjName,
      teacher: elTeacher ? elTeacher.value.trim() : '',
      room: elRoom ? elRoom.value.trim() : '',
      color: subjMatch.color
    };

    window.schedCloseSlotEditor();
    renderLiveSchedulePreview();
    triggerAutoSave();

    if (typeof window.showToast === 'function') {
      window.showToast('تم تحديث الحصة في الجدول بنجاح ✏️', 'success');
    }
  };

  window.schedClearSlot = function() {
    if (!activeSchedule || !activeSlotTarget) return;

    if (!activeSchedule.grid) activeSchedule.grid = {};
    activeSchedule.grid[activeSlotTarget] = {
      subject: 'شاغر',
      teacher: '',
      room: '',
      color: '#94a3b8'
    };

    window.schedCloseSlotEditor();
    renderLiveSchedulePreview();
    triggerAutoSave();

    if (typeof window.showToast === 'function') {
      window.showToast('تم تفريغ الحصة الدراسية 🗑️', 'info');
    }
  };

  // 12. Smart Fill / Autofill Sample Schedule
  window.schedAutofillSample = function() {
    if (!activeSchedule) return;
    if (!confirm('هل تريد ملء الجدول بنموذج كامل وجاهز للحصص والمواد والأساتذة لجميع الصفوف؟')) return;

    const days = activeSchedule.includeSaturday ? [SATURDAY_ITEM, ...DAYS_LIST] : DAYS_LIST;
    const periodsNum = activeSchedule.periodsCount || 7;
    const classes = activeSchedule.classes || ['الأول المتوسط (أ)', 'الثاني المتوسط (أ)', 'الثالث المتوسط (أ)'];

    if (!activeSchedule.grid) activeSchedule.grid = {};

    classes.forEach((cls, cIdx) => {
      days.forEach((day, dIdx) => {
        for (let p = 1; p <= periodsNum; p++) {
          const slotKey = `${cls}__${day.key}__${p}`;
          const sIdx = (cIdx * 3 + dIdx * 2 + p) % (SUBJECTS_DB.length - 1);
          const subj = SUBJECTS_DB[sIdx] || SUBJECTS_DB[0];
          activeSchedule.grid[slotKey] = {
            subject: subj.name,
            teacher: (p % 2 === 0) ? 'أستاذ المادة' : 'مدرس الصف',
            room: `قاعة ${cIdx + 1}`,
            color: subj.color
          };
        }
      });
    });

    renderLiveSchedulePreview();
    triggerAutoSave();

    if (typeof window.showToast === 'function') {
      window.showToast('تمت تعبئة جدول الحصص الأسبوعي بنموذج أكاديمي متكامل بنجاح 📅✨', 'success');
    }
  };

  window.schedClearEntireGrid = function() {
    if (!activeSchedule) return;
    if (!confirm('تحذير: هل أنت متأكد من تفريغ ومسح كافة الحصص والدروس من جدول الحصص الأسبوعي المفتوح؟\nسيتم تفريغ كافة الحصص والبدء بجدول فارغ تماماً.')) return;

    activeSchedule.grid = {};
    renderLiveSchedulePreview();
    triggerAutoSave();

    if (typeof window.showToast === 'function') {
      window.showToast('تم تفريغ جدول الحصص الأسبوعي بنجاح 🗑️', 'info');
    }
  };
  window.schedClearAllOpenData = window.schedClearEntireGrid;

  // 13. Meta Fields Update
  window.schedUpdateMetaField = function(field, value) {
    if (!activeSchedule) return;
    activeSchedule[field] = value;
    renderLiveSchedulePreview();
    triggerAutoSave();
  };

  window.schedSelectTheme = function(themeId) {
    if (!activeSchedule) return;
    activeSchedule.theme = themeId;
    document.querySelectorAll('.sched-theme-pill').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-theme') === themeId);
    });
    renderLiveSchedulePreview();
    triggerAutoSave();
  };

  // 14. Manage Classes Modal
  window.schedOpenManageClassesModal = function() {
    const modal = document.getElementById('schedManageClassesModal');
    if (!modal || !activeSchedule) return;
    renderManageClassesList();
    modal.classList.add('open');
  };

  window.schedCloseManageClassesModal = function() {
    const modal = document.getElementById('schedManageClassesModal');
    if (modal) modal.classList.remove('open');
  };

  window.schedToggleCustomStage = function(val) {
    const customInp = document.getElementById('schedFastCustomStageInput');
    if (!customInp) return;
    if (val === '__CUSTOM__') {
      customInp.style.display = 'block';
      customInp.focus();
    } else {
      customInp.style.display = 'none';
    }
  };

  window.schedToggleCustomSections = function(val) {
    const customInp = document.getElementById('schedFastCustomSectionsInput');
    if (!customInp) return;
    if (val === '__CUSTOM_SECT__') {
      customInp.style.display = 'block';
      customInp.focus();
    } else {
      customInp.style.display = 'none';
    }
  };

  window.schedQuickAddBatchSections = function() {
    if (!activeSchedule) return;
    if (!activeSchedule.classes) activeSchedule.classes = [];

    const stageSelect = document.getElementById('schedFastStageSelect');
    const stageCustomInput = document.getElementById('schedFastCustomStageInput');
    let stageName = stageSelect ? stageSelect.value : '';

    if (stageName === '__CUSTOM__') {
      stageName = stageCustomInput ? stageCustomInput.value.trim() : '';
    }

    if (!stageName) {
      if (typeof window.showToast === 'function') {
        window.showToast('يرجى تحديد أو كتابة اسم المرحلة أولاً!', 'warning');
      } else {
        alert('يرجى تحديد أو كتابة اسم المرحلة أولاً!');
      }
      return;
    }

    const sectSelect = document.getElementById('schedFastSectionsSelect');
    const sectCustomInput = document.getElementById('schedFastCustomSectionsInput');
    const sectKey = sectSelect ? sectSelect.value : 'AB';
    let letters = [];

    const mapPresets = {
      'A': ['أ'],
      'AB': ['أ', 'ب'],
      'ABC': ['أ', 'ب', 'ج'],
      'ABCD': ['أ', 'ب', 'ج', 'د'],
      'ABCDE': ['أ', 'ب', 'ج', 'د', 'هـ'],
      'ABCDEF': ['أ', 'ب', 'ج', 'د', 'هـ', 'و'],
      'ABCDEFG': ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز'],
      'ABCDEFGH': ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح'],
      'NUM3': ['1', '2', '3'],
      'NUM4': ['1', '2', '3', '4']
    };

    if (sectKey === '__CUSTOM_SECT__') {
      const rawLetters = sectCustomInput ? sectCustomInput.value.trim() : '';
      if (!rawLetters) {
        letters = ['أ', 'ب'];
      } else {
        letters = rawLetters.split(/[,،\s]+/).filter(Boolean);
      }
    } else {
      letters = mapPresets[sectKey] || ['أ', 'ب'];
    }

    let addedCount = 0;
    letters.forEach(letter => {
      const formattedName = `${stageName} (${letter})`;
      if (!activeSchedule.classes.includes(formattedName)) {
        activeSchedule.classes.push(formattedName);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      if (!activeSelectedClass || !activeSchedule.classes.includes(activeSelectedClass)) {
        activeSelectedClass = activeSchedule.classes[0];
      }
      renderManageClassesList();
      renderClassesPills();
      renderLiveSchedulePreview();
      triggerAutoSave();
      if (typeof window.showToast === 'function') {
        window.showToast(`تم بنجاح إدراج (${addedCount}) شُعب لـ (${stageName})! 🚀`, 'success');
      }
    } else {
      if (typeof window.showToast === 'function') {
        window.showToast(`كافة الشُعب المحددة لـ (${stageName}) مضافة مسبقاً بالجدول!`, 'info');
      }
    }
  };

  window.schedApplySchoolPreset = function(presetType) {
    if (!activeSchedule) return;
    const presetsMap = {
      primary: {
        title: 'مدرسة ابتدائية كاملة (الأول إلى السادس - شعبتان أ، ب)',
        classes: [
          'الأول الابتدائي (أ)', 'الأول الابتدائي (ب)',
          'الثاني الابتدائي (أ)', 'الثاني الابتدائي (ب)',
          'الثالث الابتدائي (أ)', 'الثالث الابتدائي (ب)',
          'الرابع الابتدائي (أ)', 'الرابع الابتدائي (ب)',
          'الخامس الابتدائي (أ)', 'الخامس الابتدائي (ب)',
          'السادس الابتدائي (أ)', 'السادس الابتدائي (ب)'
        ]
      },
      intermediate: {
        title: 'مدرسة متوسطة كاملة (الأول إلى الثالث المتوسط - شعبتان أ، ب)',
        classes: [
          'الأول المتوسط (أ)', 'الأول المتوسط (ب)',
          'الثاني المتوسط (أ)', 'الثاني المتوسط (ب)',
          'الثالث المتوسط (أ)', 'الثالث المتوسط (ب)'
        ]
      },
      secondary: {
        title: 'مدرسة إعدادية / ثانوية كاملة (علمي وأدبي)',
        classes: [
          'الرابع العلمي (أ)', 'الرابع العلمي (ب)', 'الرابع الأدبي (أ)',
          'الخامس العلمي (أ)', 'الخامس العلمي (ب)', 'الخامس الأدبي (أ)',
          'السادس العلمي (أ)', 'السادس العلمي (ب)', 'السادس الأدبي (أ)'
        ]
      }
    };

    const target = presetsMap[presetType];
    if (!target) return;

    if (!confirm(`هل ترغب في تطبيق قالب "${target.title}"؟\nسيتم استبدال قائمة الصفوف الحالية بصفوف هذا القالب.`)) {
      return;
    }

    activeSchedule.classes = [...target.classes];
    activeSelectedClass = activeSchedule.classes[0];
    renderManageClassesList();
    renderClassesPills();
    renderLiveSchedulePreview();
    triggerAutoSave();

    if (typeof window.showToast === 'function') {
      window.showToast(`تم تطبيق قالب "${target.title}" بنجاح (${activeSchedule.classes.length} شعبة)! 🌟`, 'success');
    }
  };

  window.schedClearAllClasses = function() {
    if (!activeSchedule) return;
    if (!confirm('هل أنت متأكد من تفريغ كافة الصفوف والشعب من الجدول؟')) return;
    activeSchedule.classes = ['الصف الأول (أ)'];
    activeSelectedClass = 'الصف الأول (أ)';
    renderManageClassesList();
    renderClassesPills();
    renderLiveSchedulePreview();
    triggerAutoSave();
    if (typeof window.showToast === 'function') {
      window.showToast('تمت إعادة ضبط الصفوف.', 'info');
    }
  };

  window.schedMoveClassUp = function(idx) {
    if (!activeSchedule || !activeSchedule.classes || idx <= 0) return;
    const item = activeSchedule.classes.splice(idx, 1)[0];
    activeSchedule.classes.splice(idx - 1, 0, item);
    renderManageClassesList();
    renderClassesPills();
    renderLiveSchedulePreview();
    triggerAutoSave();
  };

  window.schedMoveClassDown = function(idx) {
    if (!activeSchedule || !activeSchedule.classes || idx >= activeSchedule.classes.length - 1) return;
    const item = activeSchedule.classes.splice(idx, 1)[0];
    activeSchedule.classes.splice(idx + 1, 0, item);
    renderManageClassesList();
    renderClassesPills();
    renderLiveSchedulePreview();
    triggerAutoSave();
  };

  function renderManageClassesList() {
    const wrap = document.getElementById('schedClassesListWrapper');
    const countBadge = document.getElementById('schedClassesCountBadge');
    if (!wrap || !activeSchedule) return;

    const classes = activeSchedule.classes || [];
    if (countBadge) {
      countBadge.textContent = `${classes.length} شعبة`;
    }

    if (classes.length === 0) {
      wrap.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 25px 0; font-size: 0.88rem;">لا توجد صفوف حالياً، استخدم شريط الإدراج السريع بالأعلى لإضافة الشعب!</div>';
      return;
    }

    wrap.innerHTML = classes.map((cls, idx) => {
      let assignedCount = 0;
      if (activeSchedule.grid) {
        Object.keys(activeSchedule.grid).forEach(k => {
          if (k.startsWith(`${cls}__`) && activeSchedule.grid[k] && activeSchedule.grid[k].subject) {
            assignedCount++;
          }
        });
      }

      const isFirst = (idx === 0);
      const isLast = (idx === classes.length - 1);

      return `
        <div class="sched-class-item-row">
          <span class="class-num-badge" title="تسلسل الصف">${idx + 1}</span>
          <input type="text" class="form-control" style="font-weight: 700; font-size: 0.88rem;" value="${escapeHtml(cls)}" onchange="window.schedRenameClass(${idx}, this.value)" title="انقر لتعديل اسم الصف" />
          
          <span class="class-slots-badge" title="عدد الحصص المثبتة لهذا الصف في الجدول">
            <i class="fa-solid fa-clock-rotate-left"></i> ${assignedCount} حصة
          </span>

          <div style="display: flex; gap: 2px;">
            <button type="button" class="btn-sort-mini" onclick="window.schedMoveClassUp(${idx})" ${isFirst ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''} title="تحريك للأعلى">
              <i class="fa-solid fa-chevron-up"></i>
            </button>
            <button type="button" class="btn-sort-mini" onclick="window.schedMoveClassDown(${idx})" ${isLast ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''} title="تحريك للأسفل">
              <i class="fa-solid fa-chevron-down"></i>
            </button>
          </div>

          <button type="button" class="btn btn-delete btn-sm" onclick="window.schedRemoveClass(${idx})" title="حذف هذا الصف">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `;
    }).join('');
  }

  window.schedRenameClass = function(idx, newName) {
    if (!activeSchedule || !activeSchedule.classes || !newName.trim()) return;
    const oldName = activeSchedule.classes[idx];
    activeSchedule.classes[idx] = newName.trim();

    // Migrate grid slots from old name to new name
    if (activeSchedule.grid) {
      Object.keys(activeSchedule.grid).forEach(k => {
        if (k.startsWith(`${oldName}__`)) {
          const suffix = k.substring(oldName.length);
          const newKey = `${newName.trim()}${suffix}`;
          activeSchedule.grid[newKey] = activeSchedule.grid[k];
          delete activeSchedule.grid[k];
        }
      });
    }

    if (activeSelectedClass === oldName) {
      activeSelectedClass = newName.trim();
    }

    renderClassesPills();
    renderLiveSchedulePreview();
    triggerAutoSave();
  };

  window.schedAddClass = function() {
    if (!activeSchedule) return;
    if (!activeSchedule.classes) activeSchedule.classes = [];
    const count = activeSchedule.classes.length + 1;
    activeSchedule.classes.push(`صف دراسي جديد (${count})`);
    renderManageClassesList();
    renderClassesPills();
    renderLiveSchedulePreview();
    triggerAutoSave();
  };

  window.schedRemoveClass = function(idx) {
    if (!activeSchedule || !activeSchedule.classes) return;
    if (activeSchedule.classes.length <= 1) {
      if (typeof window.showToast === 'function') window.showToast('يجب أن يحتوي الجدول على صف دراسي واحد على الأقل!', 'warning');
      return;
    }
    const removed = activeSchedule.classes[idx];
    if (!confirm(`هل أنت متأكد من حذف (${removed}) وكافة حصصه من الجدول؟`)) return;

    activeSchedule.classes.splice(idx, 1);
    if (activeSelectedClass === removed) {
      activeSelectedClass = activeSchedule.classes[0] || null;
    }
    renderManageClassesList();
    renderClassesPills();
    renderLiveSchedulePreview();
    triggerAutoSave();
  };

  // 15. Master Print & PDF Export Window (A3 Landscape 300DPI)
  window.schedPrintA3 = function() {
    if (!activeSchedule) return;

    const isMaster = (activeSchedule.viewLayout !== 'singleClass');
    const currentClass = activeSelectedClass || (activeSchedule.classes && activeSchedule.classes[0]) || 'الصف الدراسي';
    const isA3 = (activeSchedule.pageSize || 'A3') === 'A3';
    const css = getSchedulePrintCss(isA3);
    const contentHtml = `
      <div class="print-content-wrapper" style="width: 100%;">
        ${buildScheduleHtml(activeSchedule, true, isMaster ? null : currentClass)}
      </div>
    `;

    const docTitle = isMaster 
      ? `المخطط الشامل لجدول الحصص المدرسي الموحد A3 - ${escapeHtml(activeSchedule.schoolName || 'المدرسة')}`
      : `جدول الحصص الأسبوعي A3 - ${escapeHtml(currentClass)}`;

    if (typeof window.openPrintWindow === 'function') {
      window.openPrintWindow(docTitle, contentHtml, {
        pageSize: isA3 ? 'A3' : 'A4',
        orientation: 'landscape',
        margin: '6mm 6mm',
        extraStyles: css
      });
    } else {
      window.print();
    }
  };

  window.schedPrintAllClasses = function() {
    if (!activeSchedule || !activeSchedule.classes || activeSchedule.classes.length === 0) {
      if (typeof window.showToast === 'function') window.showToast('لا توجد صفوف دراسية للطباعة!', 'warning');
      return;
    }

    const isA3 = (activeSchedule.pageSize || 'A3') === 'A3';
    const css = getSchedulePrintCss(isA3);
    const pagesHtml = `
      <div class="print-content-wrapper" style="display: block; width: 100%;">
        ${activeSchedule.classes.map(cls => `
          <div class="print-page-break" style="page-break-after: always; break-after: page; margin-bottom: 20px;">
            ${buildScheduleHtml(activeSchedule, true, cls)}
          </div>
        `).join('')}
      </div>
    `;

    const docTitle = `طباعة جداول كافة الصفوف (${activeSchedule.classes.length} صفاً) - ${escapeHtml(activeSchedule.title || 'مسار المعلم')}`;

    if (typeof window.openPrintWindow === 'function') {
      window.openPrintWindow(docTitle, pagesHtml, {
        pageSize: isA3 ? 'A3' : 'A4',
        orientation: 'landscape',
        margin: '6mm 6mm',
        extraStyles: css
      });
    } else {
      window.print();
    }
  };

  window.schedExportPdf = async function(options) {
    if (!activeSchedule) {
      if (typeof window.showToast === 'function') window.showToast('لا يوجد جدول محدد لتصديره!', 'warning');
      return;
    }

    const isMaster = (activeSchedule.viewLayout !== 'singleClass');
    const currentClass = activeSelectedClass || (activeSchedule.classes && activeSchedule.classes[0]) || 'الصف الدراسي';
    const isA3 = (activeSchedule.pageSize || 'A3') === 'A3';
    const contentHtml = buildScheduleHtml(activeSchedule, true, isMaster ? null : currentClass);

    const safeTitle = isMaster 
      ? `جدول-الحصص-المدرسي-الشامل-A3` 
      : `جدول-الحصص-(${String(currentClass).replace(/[/\\?%*:|"<>]/g, '-')})`;
    const filename = (options && (options.filename || options.path)) ? (options.filename || options.path) : `${safeTitle}.pdf`;

    if (typeof window.showToast === 'function') {
      window.showToast(`جاري إنشاء وتنزيل ملف «${filename}» بصيغة PDF مباشرة... 📥📄`, 'info', 2500);
    }

    // Exact full bleed A3 / A4 landscape single-page dimensions
    const targetW = isA3 ? 1560 : 1095;
    const targetH = isA3 ? 1092 : 765;

    // Temporary container with clean styles
    const tempCont = document.createElement('div');
    tempCont.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: ${targetW}px;
      height: ${targetH}px;
      max-height: ${targetH}px;
      background: #ffffff;
      color: #0f172a;
      direction: rtl;
      font-family: 'Cairo', 'Amiri', sans-serif;
      z-index: -9999;
      padding: 0;
      margin: 0;
      box-sizing: border-box;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: stretch;
    `;
    tempCont.innerHTML = `
      <style>
        ${getSchedulePrintCss(isA3)}
        .no-print, .print-actions-toolbar { display: none !important; }
        .print-content-wrapper { padding: 0 !important; margin: 0 !important; width: 100% !important; height: 100% !important; display: flex !important; flex-direction: column !important; justify-content: stretch !important; overflow: hidden !important; }
        .a3-timetable-paper { width: 100% !important; height: 100% !important; max-width: none !important; max-height: none !important; min-height: 0 !important; padding: 1.5px !important; margin: 0 !important; border: none !important; box-shadow: none !important; transform: none !important; display: flex !important; flex-direction: column !important; }
        .timetable-sheet-frame { height: 100% !important; flex: 1 !important; min-height: 0 !important; display: flex !important; flex-direction: column !important; box-sizing: border-box !important; border: 1.5px solid #1e3a8a !important; padding: 1.5px !important; }
        .timetable-outer-border, .timetable-inner-border { height: 100% !important; flex: 1 !important; min-height: 0 !important; display: flex !important; flex-direction: column !important; box-sizing: border-box !important; border: none !important; padding: 0 !important; }
        .timetable-grid-container { height: 100% !important; flex: 1 !important; min-height: 0 !important; display: flex !important; flex-direction: column !important; overflow: hidden !important; }
        .master-scheme-table { width: 100% !important; height: 100% !important; flex: 1 !important; table-layout: fixed !important; }
        .master-td-cell { height: auto !important; padding: 0.5px 1px !important; }
      </style>
      <div class="print-content-wrapper">
        ${contentHtml}
      </div>
    `;
    document.body.appendChild(tempCont);

    try {
      const printFn = (typeof window.masarPrintToPDF === 'function') ? window.masarPrintToPDF : (typeof window.exportToPDF === 'function' ? window.exportToPDF : null);
      if (printFn) {
        await printFn(tempCont, {
          title: filename.replace(/\.pdf$/i, ''),
          pageSize: isA3 ? 'a3' : 'a4',
          orientation: 'landscape',
          margin: '3.5mm',
          fit: true
        });
        if (typeof window.showToast === 'function') {
          window.showToast('تم تصدير جدول الحصص بصيغة PDF بنجاح! 📅✨', 'success');
        }
      }
    } catch (err) {
      console.error('schedExportPdf error:', err);
      if (typeof window.showToast === 'function') {
        window.showToast('تعذر تنزيل ملف PDF للجدول: ' + (err.message || 'خطأ غير معروف'), 'error', 4500);
      }
    } finally {
      if (tempCont.parentNode) tempCont.remove();
    }
  };

  window.executeSchedulePdf = window.schedExportPdf;

  // 16. Print CSS Rules for Flawless Single-Page A3/A4 Landscape
  function getSchedulePrintCss(isA3) {
    const pageSize = isA3 ? 'A3 landscape' : 'A4 landscape';
    return `
      @page {
        size: ${pageSize};
        margin: 3mm;
      }
      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body {
        margin: 0;
        padding: 0;
        background: #f1f5f9;
        font-family: 'Cairo', 'Amiri', 'Traditional Arabic', serif;
        direction: rtl;
        height: 100vh;
        max-height: 100vh;
        overflow: hidden;
      }
      .no-print {
        display: flex;
      }
      @media print {
        html, body {
          background: #ffffff !important;
          height: 100vh !important;
          max-height: 100vh !important;
          overflow: hidden !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .no-print {
          display: none !important;
        }
        .print-content-wrapper {
          padding: 0 !important;
          margin: 0 !important;
          width: 100% !important;
          height: 100vh !important;
          max-height: 100vh !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: stretch !important;
          align-items: stretch !important;
          overflow: hidden !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .a3-timetable-paper {
          box-shadow: none !important;
          border: none !important;
          width: 100% !important;
          height: 100vh !important;
          max-height: 100vh !important;
          margin: 0 !important;
          padding: 1.5px !important;
          box-sizing: border-box !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-after: avoid !important;
          break-after: avoid !important;
          overflow: hidden !important;
          display: flex !important;
          flex-direction: column !important;
        }
        .timetable-sheet-frame {
          height: 100% !important;
          padding: 1.5px !important;
          box-sizing: border-box !important;
          display: flex !important;
          flex-direction: column !important;
          flex: 1 !important;
          min-height: 0 !important;
          border: 1.5px solid #1e3a8a !important;
        }
        .timetable-outer-border,
        .timetable-inner-border {
          height: 100% !important;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
          display: flex !important;
          flex-direction: column !important;
          flex: 1 !important;
          min-height: 0 !important;
        }
        .tt-minimal-header-strip {
          flex-shrink: 0 !important;
          margin-bottom: 1.5px !important;
          padding: 1px 6px !important;
        }
        .timetable-grid-container {
          flex: 1 !important;
          min-height: 0 !important;
          height: 100% !important;
          display: flex !important;
          flex-direction: column !important;
          overflow: hidden !important;
        }
        .master-scheme-table {
          height: 100% !important;
          width: 100% !important;
          flex: 1 !important;
          table-layout: fixed !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .timetable-table {
          height: 100% !important;
          width: 100% !important;
          flex: 1 !important;
          table-layout: fixed !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
      }
      .print-actions-toolbar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 60px;
        background: #0f172a;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 2rem;
        z-index: 10000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      }
      .btn-print-go {
        background: #f59e0b;
        color: #000;
        border: none;
        padding: 0.55rem 1.4rem;
        font-weight: 800;
        font-family: inherit;
        font-size: 0.95rem;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .btn-print-cancel {
        background: rgba(255,255,255,0.15);
        color: #fff;
        border: none;
        padding: 0.55rem 1rem;
        font-weight: 700;
        font-family: inherit;
        border-radius: 8px;
        cursor: pointer;
      }
      .print-content-wrapper {
        padding: 65px 10px 10px;
        display: flex;
        justify-content: center;
        align-items: flex-start;
      }

      /* Timetable Paper Layout */
      .a3-timetable-paper {
        background: #ffffff;
        width: 100%;
        max-width: 1540px;
        min-height: 940px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.12);
        border: 1.5px solid #cbd5e1;
        border-radius: 4px;
        padding: 3px;
        position: relative;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
      }
      .timetable-sheet-frame {
        border: 1.5px solid #1e3a8a;
        border-radius: 3px;
        padding: 2px;
        background: #ffffff;
        height: 100%;
        display: flex;
        flex-direction: column;
        flex: 1;
        box-sizing: border-box;
      }
      .timetable-outer-border,
      .timetable-inner-border {
        border: none !important;
        padding: 0 !important;
        height: 100% !important;
        display: flex !important;
        flex-direction: column !important;
        flex: 1 !important;
      }

      /* Ultra-Minimalist Official Single-Line Header Strip (Zero Waste, No Bulky Bar, No Yellow Text) */
      .tt-minimal-header-strip {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 2px 8px;
        background: #f8fafc;
        border-bottom: 1px solid #cbd5e1;
        color: #0f172a;
        font-family: inherit;
        font-size: 8.5pt;
        line-height: 1.2;
        margin-bottom: 2px;
        flex-shrink: 0;
        border-radius: 2px;
      }
      .tt-min-side {
        display: flex;
        align-items: center;
        gap: 5px;
        font-weight: 700;
        color: #334155;
        white-space: nowrap;
      }
      .tt-min-right {
        font-size: 8pt;
      }
      .tt-min-dot {
        color: #94a3b8;
        font-size: 7.5pt;
      }
      .tt-min-center {
        display: flex;
        align-items: center;
        gap: 8px;
        white-space: nowrap;
      }
      .tt-min-title {
        font-size: 9.5pt;
        font-weight: 900;
        color: #0f2744;
      }
      .tt-min-meta {
        font-size: 8pt;
        font-weight: 700;
        color: #475569;
      }
      .tt-min-left {
        font-size: 8.5pt;
        font-weight: 900;
        color: #0f2744;
      }
      .tt-min-school {
        font-size: 9pt;
        font-weight: 900;
        color: #0f2744;
      }

      /* Grid Container */
      .timetable-grid-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .timetable-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 8pt;
      }
      .timetable-table th, .timetable-table td {
        border: 1px solid #94a3b8;
        padding: 4px;
        text-align: center;
      }
      .th-day-head {
        background: #0f172a;
        color: #ffffff;
        font-weight: 900;
        font-size: 9.5pt;
        padding: 6px 8px;
      }
      .th-period {
        background: #f1f5f9;
        color: #0f172a;
        font-weight: 900;
        padding: 5px 3px;
        border: 1px solid #94a3b8;
      }
      .th-period.is-after-break {
        border-right: 3px solid #0284c7 !important;
      }
      .th-period-title {
        font-size: 9pt;
        font-weight: 900;
        color: #0369a1;
      }
      .th-period-time {
        font-size: 6.8pt;
        color: #64748b;
        font-weight: 700;
      }
      .break-notice-tag {
        font-size: 6.2pt;
        background: #e0f2fe;
        color: #0369a1;
        padding: 1px 5px;
        border-radius: 3px;
        font-weight: 800;
        display: inline-block;
        margin-top: 2px;
      }

      /* Row Data (Single Class View) */
      .tr-schedule-row {
        height: 68px;
      }
      .td-day-cell {
        background: #f8fafc;
        font-weight: 900;
        color: #0f2744;
        vertical-align: middle;
        padding: 6px 10px;
        border: 1px solid #94a3b8;
      }
      .day-arabic-name {
        font-family: 'Amiri', 'Cairo', serif;
        font-size: 12pt;
        font-weight: 900;
        color: #0f2744;
        white-space: nowrap;
      }

      .td-slot-cell {
        background: #ffffff;
        padding: 3px;
        border: 1px solid #94a3b8;
        vertical-align: middle;
        height: 68px;
      }
      .td-slot-cell.cell-after-break {
        border-right: 3px solid #0284c7 !important;
      }
      .slot-card {
        border-right: 3.5px solid #0284c7;
        padding: 3px 5px;
        text-align: right;
        display: flex;
        flex-direction: column;
        gap: 2px;
        background: rgba(248, 250, 252, 0.7);
        border-radius: 4px;
        height: 100%;
        justify-content: center;
      }
      .slot-subject {
        font-weight: 900;
        font-size: 8.5pt;
        line-height: 1.25;
      }
      .slot-teacher {
        font-size: 6.6pt;
        color: #475569;
        font-weight: 700;
      }
      .slot-room {
        font-size: 6pt;
        color: #94a3b8;
      }
      .is-vacant .slot-subject {
        color: #cbd5e1 !important;
        font-weight: 600;
      }
      .print-page-break {
        page-break-after: always;
        break-after: page;
        min-height: 98vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      /* Master Blueprint Table Print Rules (Full A3 Bleed - Single Page Guaranteed) */
      .master-scheme-table {
        width: 100%;
        height: 100% !important;
        flex: 1 !important;
        border-collapse: collapse;
        font-size: 8pt;
        table-layout: fixed;
        border: 1.5px solid #1e3a8a;
        background: #ffffff;
      }
      .master-scheme-table th,
      .master-scheme-table td {
        border: 1px solid #cbd5e1;
        padding: 0.5px 1px !important;
        text-align: center;
        vertical-align: middle;
      }
      .mth-day-col {
        background: #1e3a8a !important;
        color: #ffffff !important;
        font-weight: 900;
        font-size: 8.5pt;
        width: 38px;
        padding: 1px;
        border: 1px solid #0f2744 !important;
      }
      .master-td-day-label {
        color: #ffffff !important;
        font-family: 'Amiri', 'Cairo', serif;
        font-weight: 900;
        font-size: 9pt;
        vertical-align: middle;
        padding: 0 !important;
      }
      .master-day-text {
        writing-mode: vertical-rl;
        transform: rotate(180deg);
        margin: 0 auto;
        letter-spacing: 1px;
        white-space: nowrap;
      }
      .mth-period-col {
        background: #0284c7 !important;
        color: #ffffff !important;
        font-weight: 900;
        font-size: 8.5pt;
        width: 22px;
        padding: 1px;
        border: 1px solid #0369a1 !important;
      }
      .master-td-period-num {
        background: #eff6ff !important;
        color: #1e40af !important;
        font-weight: 900;
        font-size: 8pt;
        vertical-align: middle;
        border: 1px solid #bfdbfe !important;
        width: 22px;
        padding: 0 !important;
      }
      .master-period-even-row {
        background-color: #fafcff;
      }
      .master-period-odd-row {
        background-color: #ffffff;
      }
      .mth-grade-header {
        color: #ffffff !important;
        font-weight: 900;
        font-size: 8pt;
        padding: 2px 1px;
        border: 1px solid rgba(255, 255, 255, 0.4) !important;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .mth-section-header {
        color: #ffffff !important;
        font-weight: 900;
        font-size: 7.5pt;
        padding: 1px 0.5px;
        border: 1px solid rgba(255, 255, 255, 0.35) !important;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .master-td-cell {
        height: auto !important; /* Stretches dynamically to fill 100% of A3 paper */
        padding: 0.5px 1px !important;
        vertical-align: middle;
      }
      .m-cell-content {
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        line-height: 1.05;
        border-radius: 2px;
        border: 1px solid rgba(0, 0, 0, 0.06);
        padding: 0.5px 1px;
        box-sizing: border-box;
      }
      .m-cell-subj {
        font-weight: 900;
        font-size: 7.5pt;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        display: block;
        line-height: 1.05;
      }
      .m-cell-teacher {
        font-size: 5.8pt;
        color: #475569;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        display: block;
        line-height: 1;
        margin-top: 0;
      }
      .master-day-start-row {
        border-top: 2px solid #1e3a8a !important;
      }
      .master-day-end-row {
        border-bottom: 2px solid #1e3a8a !important;
      }

      /* Dynamic Typography Scaling for Large Section Sets & Guaranteed Fit */
      .a3-timetable-paper.density-compact .m-cell-subj { font-size: 7.2pt; line-height: 1.05; }
      .a3-timetable-paper.density-compact .m-cell-teacher { font-size: 5.6pt; line-height: 1; }
      .a3-timetable-paper.density-compact .mth-grade-header { font-size: 7.8pt; padding: 1.5px 1px; }
      .a3-timetable-paper.density-compact .mth-section-header { font-size: 7.2pt; padding: 1px 0.5px; }
      .a3-timetable-paper.density-compact .master-td-day-label { font-size: 8.5pt; }
      .a3-timetable-paper.density-compact .master-td-period-num { font-size: 7.8pt; }

      .a3-timetable-paper.density-super-compact .tt-minimal-header-strip { padding: 1px 5px; font-size: 7.5pt; }
      .a3-timetable-paper.density-super-compact .tt-min-title { font-size: 8.5pt; }
      .a3-timetable-paper.density-super-compact .tt-min-school { font-size: 8.5pt; }
      .a3-timetable-paper.density-super-compact .m-cell-subj { font-size: 6.5pt; line-height: 1.02; }
      .a3-timetable-paper.density-super-compact .m-cell-teacher { font-size: 5.2pt; line-height: 0.98; }
      .a3-timetable-paper.density-super-compact .mth-grade-header { font-size: 7.4pt; padding: 1px 0.5px; }
      .a3-timetable-paper.density-super-compact .mth-section-header { font-size: 6.8pt; padding: 0.8px 0.3px; }
      .a3-timetable-paper.density-super-compact .master-td-day-label { font-size: 8.2pt; }
      .a3-timetable-paper.density-super-compact .master-td-period-num { font-size: 7.2pt; }

      .a3-timetable-paper.density-ultra-compact .tt-minimal-header-strip { padding: 1px 4px; font-size: 7pt; }
      .a3-timetable-paper.density-ultra-compact .tt-min-title { font-size: 8pt; }
      .a3-timetable-paper.density-ultra-compact .tt-min-school { font-size: 8pt; }
      .a3-timetable-paper.density-ultra-compact .m-cell-subj { font-size: 5.8pt; line-height: 1; }
      .a3-timetable-paper.density-ultra-compact .m-cell-teacher { font-size: 4.6pt; line-height: 0.95; }
      .a3-timetable-paper.density-ultra-compact .mth-grade-header { font-size: 6.8pt; padding: 0.8px 0.3px; }
      .a3-timetable-paper.density-ultra-compact .mth-section-header { font-size: 6.2pt; padding: 0.5px 0.2px; }
      .a3-timetable-paper.density-ultra-compact .master-td-day-label { font-size: 7.8pt; }
      .a3-timetable-paper.density-ultra-compact .master-td-period-num { font-size: 6.8pt; }

      /* Footer & Watermark Removed */
      .timetable-official-footer,
      .tt-bottom-watermark {
        display: none !important;
      }
    `;
  }

  // 17. Excel Export
  window.schedExportExcel = function() {
    if (!activeSchedule) return;
    if (typeof XLSX === 'undefined') {
      if (typeof window.showToast === 'function') window.showToast('مكتبة الإكسل غير جاهزة!', 'error');
      return;
    }

    const days = activeSchedule.includeSaturday ? [SATURDAY_ITEM, ...DAYS_LIST] : DAYS_LIST;
    const periodsNum = activeSchedule.periodsCount || 7;
    const classes = activeSchedule.classes || [];

    const rows = [
      [`جدول الحصص والدروس الأسبوعي - ${activeSchedule.schoolName || ''}`],
      [`العام الدراسي: ${activeSchedule.academicYear || ''} • ${activeSchedule.semester || ''} • الدوام: ${activeSchedule.shiftType || ''}`],
      [],
      ['اليوم', 'الصف والشعبة', ...Array.from({ length: periodsNum }, (_, i) => `الحصة ${i + 1}`)]
    ];

    days.forEach(day => {
      classes.forEach(cls => {
        const row = [day.label, cls];
        for (let p = 1; p <= periodsNum; p++) {
          const slotKey = `${cls}__${day.key}__${p}`;
          const slot = (activeSchedule.grid && activeSchedule.grid[slotKey]) ? activeSchedule.grid[slotKey] : null;
          const txt = slot ? `${slot.subject || 'شاغر'} (${slot.teacher || ''})` : 'شاغر';
          row.push(txt);
        }
        rows.push(row);
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'جدول الحصص الأسبوعي');
    XLSX.writeFile(wb, `جدول_الحصص_الأسبوعي_${String(activeSchedule.schoolName || 'المدرسة').replace(/\s+/g, '_')}.xlsx`);

    if (typeof window.showToast === 'function') {
      window.showToast('تم تصدير جدول الحصص إلى ملف Excel بنجاح 📊📥', 'success');
    }
  };

  // 18. Archive Modal & Management
  window.schedOpenArchiveModal = function() {
    const modal = document.getElementById('schedArchiveModal');
    if (!modal) return;
    renderArchiveList();
    modal.classList.add('open');
  };

  window.schedCloseArchiveModal = function() {
    const modal = document.getElementById('schedArchiveModal');
    if (modal) modal.classList.remove('open');
  };

  function renderArchiveList() {
    const wrap = document.getElementById('schedArchiveListWrapper');
    if (!wrap) return;

    if (schedules.length === 0) {
      wrap.innerHTML = '<div style="text-align: center; padding: 2rem; color: #64748b;">لا توجد جداول محفوظة بالأرشيف حالياً.</div>';
      return;
    }

    wrap.innerHTML = schedules.map(s => {
      const isCur = activeSchedule && activeSchedule.id === s.id;
      return `
        <div class="sched-archive-card ${isCur ? 'active' : ''}">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="sched-archive-icon">
              <i class="fa-solid fa-calendar-days"></i>
            </div>
            <div>
              <div style="font-weight: 800; font-size: 1.05rem; color: #0f172a; display: flex; align-items: center; gap: 8px;">
                <span>${escapeHtml(s.title || 'جدول مدرسي')}</span>
                ${isCur ? '<span class="badge-tag" style="background:#10b981; color:#fff; font-size:0.7rem;">الجدول النشط حالياً ✔</span>' : ''}
              </div>
              <small style="color: #64748b; font-size: 0.8rem; display: block; margin-top: 2px;">
                ${escapeHtml(s.schoolName || '')} • ${escapeHtml(s.shiftType || '')} • ${escapeHtml(s.academicYear || '')} • (${(s.classes || []).length} صفوف)
              </small>
            </div>
          </div>

          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-primary btn-sm" onclick="window.schedSelectFromArchive('${s.id}')">
              <i class="fa-solid fa-folder-open"></i> فتح وتحرير
            </button>
            <button type="button" class="btn btn-outline btn-sm" onclick="window.schedDuplicateFromArchive('${s.id}')" title="إنشاء نسخة مطابقة">
              <i class="fa-solid fa-copy"></i> تكرار
            </button>
            ${schedules.length > 1 ? `
              <button type="button" class="btn btn-delete btn-sm" onclick="window.schedDeleteFromArchive('${s.id}')" title="حذف هذا الجدول">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  window.schedSelectFromArchive = function(id) {
    const target = schedules.find(s => s.id === id);
    if (!target) return;
    activeSchedule = target;
    activeSelectedClass = (activeSchedule.classes && activeSchedule.classes[0]) ? activeSchedule.classes[0] : 'الصف الثالث المتوسط (أ)';
    saveSchedules(false);
    renderScheduleMetaForm();
    renderLiveSchedulePreview();
    window.schedCloseArchiveModal();
    if (typeof window.showToast === 'function') {
      window.showToast(`تم فتح: ${activeSchedule.title} 📂`, 'success');
    }
  };

  window.schedDuplicateFromArchive = function(id) {
    const target = schedules.find(s => s.id === id);
    if (!target) return;
    const copy = JSON.parse(JSON.stringify(target));
    copy.id = 'sched_' + Date.now();
    copy.title = `${copy.title} (نسخة جديدة)`;
    schedules.unshift(copy);
    activeSchedule = copy;
    saveSchedules(false);
    renderScheduleMetaForm();
    renderLiveSchedulePreview();
    renderArchiveList();
    if (typeof window.showToast === 'function') {
      window.showToast('تم تكرار الجدول المدرسي بنجاح 📋', 'success');
    }
  };

  window.schedDeleteFromArchive = function(id) {
    const target = schedules.find(s => s.id === id);
    if (!target) return;
    if (!confirm(`هل أنت متأكد من حذف "${target.title}" نهائياً من الأرشيف؟`)) return;

    schedules = schedules.filter(s => s.id !== id);
    if (activeSchedule && activeSchedule.id === id) {
      activeSchedule = schedules[0] || null;
    }
    saveSchedules(false);
    renderScheduleMetaForm();
    renderLiveSchedulePreview();
    renderArchiveList();
    if (typeof window.showToast === 'function') {
      window.showToast('تم حذف الجدول من الأرشيف 🗑️', 'info');
    }
  };

  window.schedCreateNew = function() {
    const newS = createDefaultSchedule();
    newS.title = `جدول حصص أسبوعي جديد (${schedules.length + 1})`;
    schedules.unshift(newS);
    activeSchedule = newS;
    activeSelectedClass = (activeSchedule.classes && activeSchedule.classes[0]) ? activeSchedule.classes[0] : 'الصف الثالث المتوسط (أ)';
    saveSchedules(false);
    renderScheduleMetaForm();
    renderLiveSchedulePreview();
    if (typeof window.showToast === 'function') {
      window.showToast('تم إنشاء جدول أسبوعي A3 جديد وجاهز للتخصيص 🎉', 'success');
    }
  };

  // 19. Initializer
  function initScheduleStudio() {
    loadSchedules();
    renderScheduleMetaForm();
    renderLiveSchedulePreview();
  }

  window.renderScheduleStudio = function() {
    initScheduleStudio();
  };

  window.ScheduleStudioModule = {
    init: initScheduleStudio,
    getActiveSchedule: () => activeSchedule,
    getSchedules: () => schedules,
    renderPreview: renderLiveSchedulePreview
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScheduleStudio);
  } else {
    setTimeout(initScheduleStudio, 120);
  }

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
