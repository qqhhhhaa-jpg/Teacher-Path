/**
 * ==============================================================================
 * مسار المعلم | سجل المتابعة اليومية وحسن السلوك والغياب للطلاب
 * Student Daily Conduct, Attendance & Formative Evaluation Suite
 * ==============================================================================
 * يشمل:
 * 1. رصد الحضور والغياب والإجازات والتأخر اليومي بدقة
 * 2. تقييم المشاركة والتفاعل الصفي أثناء سير الدرس
 * 3. متابعة إنجاز الواجبات البيتية والدفاتر المدرسية
 * 4. رصد درجات التقييم والنشاط اليومي (من 10)
 * 5. توثيق السلوك والانضباط الصفي والملاحظات الميدانية
 * 6. الربط والمزامنة التلقائية مع أسماء طلاب سجل الدرجات
 * 7. إحصائيات يومية فورية وطباعة كشف المتابعة والسلوك A4 معتمد للإشراف
 * ==============================================================================
 */

(function () {
  'use strict';

  function getBehaviorRecordsStorageKey() {
    if (typeof window !== 'undefined' && typeof window.getAccountStorageKey === 'function') {
      return window.getAccountStorageKey('masar_student_behavior_records');
    }
    const cur = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    const uid = cur ? (cur.id || cur.username || 'user') : 'guest';
    return `masar_student_behavior_records_${uid}`;
  }

  function getBehaviorRostersStorageKey() {
    if (typeof window !== 'undefined' && typeof window.getAccountStorageKey === 'function') {
      return window.getAccountStorageKey('masar_student_rosters');
    }
    const cur = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    const uid = cur ? (cur.id || cur.username || 'user') : 'guest';
    return `masar_student_rosters_${uid}`;
  }

  function createDefaultBehaviorRoster() {
    const cur = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    const teacher = (cur && cur.name) ? cur.name : 'أستاذ المادة';
    const school = (cur && cur.school) ? cur.school : 'اسم المدرسة';
    const sub = (cur && cur.subject) ? cur.subject : 'الرياضيات';
    return {
      id: 'roster_1',
      name: 'الصف الثالث المتوسط - شعبة (أ)',
      meta: {
        school: school,
        subject: sub,
        grade: 'الثالث المتوسط',
        section: 'أ',
        teacher: teacher,
        academicYear: '2024 - 2025'
      },
      students: []
    };
  }

  // State
  let behaviorRecords = {};
  let rosters = [];
  let activeRosterId = 'roster_1';
  let activeDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  let statusFilter = 'all'; // 'all', 'present', 'absent', 'excused', 'participated', 'no_hw'
  let searchQuery = '';

  // Arabic day names
  const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  /**
   * Initialize Behavior Module
   */
  function initStudentBehaviorModule() {
    loadRosters();
    loadBehaviorRecords();
    initDateControls();
    ensureRecordForActiveDate();
    renderClassSelector();
    renderHeaderInfo();
    renderStats();
    renderTable();

    // Hook tab button click to refresh
    const tabBtn = document.getElementById('mainTabStudentBehaviorBtn');
    if (tabBtn) {
      tabBtn.addEventListener('click', () => {
        loadRosters();
        ensureRecordForActiveDate();
        renderClassSelector();
        renderStats();
        renderTable();
      });
    }
  }

  /**
   * Load Rosters from shared student rosters storage (Isolated per teacher)
   */
  function loadRosters(forceEmpty = false) {
    const rostKey = getBehaviorRostersStorageKey();
    const curUser = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    const isAdmin = !!(curUser && (curUser.isAdmin || curUser.role === 'admin' || (curUser.id && String(curUser.id).includes('admin'))));

    if (forceEmpty) {
      rosters = [createDefaultBehaviorRoster()];
      activeRosterId = rosters[0].id;
      try {
        localStorage.setItem(rostKey, JSON.stringify(rosters));
      } catch (e) {}
      return;
    }

    try {
      let raw = localStorage.getItem(rostKey);
      if (!raw && isAdmin) {
        raw = localStorage.getItem('masar_student_rosters');
      }
      if (raw) {
        rosters = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not parse shared rosters for behavior module:', e);
    }

    if (!Array.isArray(rosters) || rosters.length === 0) {
      // Check if current user's grades module has rosters created by this teacher
      try {
        const gradesKey = (typeof window.getAccountStorageKey === 'function') 
          ? window.getAccountStorageKey('masar_teacher_grades_rosters_v1') 
          : 'masar_teacher_grades_rosters_v1';
        let gradesRaw = localStorage.getItem(gradesKey);
        if (!gradesRaw && isAdmin) {
          gradesRaw = localStorage.getItem('masar_teacher_grades_rosters_v1');
        }
        if (gradesRaw) {
          const parsed = JSON.parse(gradesRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            rosters = parsed.map(r => ({
              id: r.id,
              name: r.name,
              meta: {
                school: r.schoolName || 'اسم المدرسة',
                subject: r.subject || 'الرياضيات',
                grade: r.gradeLevel || 'المرحلة',
                section: r.section || 'أ',
                teacher: r.teacherName || 'أستاذ المادة',
                academicYear: r.academicYear || '2024 - 2025'
              },
              gradeLevel: r.gradeLevel || 'المرحلة',
              section: r.section || 'أ',
              subject: r.subject || 'الرياضيات',
              students: (r.students || []).map((st, i) => ({
                id: st.id || `std_${i + 1}`,
                seat: parseInt(st.seatNumber) || i + 1,
                name: st.name
              }))
            }));
            localStorage.setItem(rostKey, JSON.stringify(rosters));
          }
        }
      } catch (e) {}
    }

    if (!Array.isArray(rosters) || rosters.length === 0) {
      rosters = [createDefaultBehaviorRoster()];
    }

    // Validate active roster
    const exists = rosters.some(r => r.id === activeRosterId);
    if (!exists && rosters.length > 0) {
      activeRosterId = rosters[0].id;
    }
  }

  /**
   * Load Behavior Records (Isolated per teacher)
   */
  function loadBehaviorRecords(forceEmpty = false) {
    if (forceEmpty) {
      behaviorRecords = {};
      return;
    }
    const behKey = getBehaviorRecordsStorageKey();
    const curUser = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    const isAdmin = !!(curUser && (curUser.isAdmin || curUser.role === 'admin' || (curUser.id && String(curUser.id).includes('admin'))));

    try {
      let raw = localStorage.getItem(behKey);
      if (!raw && isAdmin) {
        raw = localStorage.getItem('masar_student_behavior_records');
      }
      if (raw) {
        behaviorRecords = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not parse behavior records:', e);
    }
    if (!behaviorRecords || typeof behaviorRecords !== 'object') {
      behaviorRecords = {};
    }
  }

  /**
   * Save Behavior Records to LocalStorage (Isolated per teacher)
   */
  function saveBehaviorRecords(showToast = false) {
    try {
      localStorage.setItem(getBehaviorRecordsStorageKey(), JSON.stringify(behaviorRecords));
      if (typeof window.scheduleCloudAutoSync === 'function') {
        window.scheduleCloudAutoSync();
      }
      updateSaveStatusBadge('saved');
      if (showToast && typeof window.showToast === 'function') {
        window.showToast('تم حفظ سجل المتابعة والسلوك بنجاح 📋', 'success');
      }
    } catch (e) {
      console.error('Failed to save behavior records:', e);
      updateSaveStatusBadge('dirty');
    }
  }

  function updateSaveStatusBadge(status) {
    const badge = document.getElementById('sbSaveStatusBadge');
    if (!badge) return;
    if (status === 'saved') {
      badge.className = 'sb-status-badge sb-status-saved';
      badge.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> محفوظ تلقائياً';
    } else if (status === 'dirty') {
      badge.className = 'sb-status-badge sb-status-dirty';
      badge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> غير محفوظ';
    }
  }

  /**
   * Record Key Generator
   */
  function getRecordKey(date, rosterId) {
    return `${rosterId}_${date}`;
  }

  /**
   * Get Active Roster
   */
  function getActiveRoster() {
    return rosters.find(r => r.id === activeRosterId) || rosters[0];
  }

  /**
   * Ensure a record exists for the selected date and class
   */
  function ensureRecordForActiveDate() {
    const key = getRecordKey(activeDate, activeRosterId);
    const roster = getActiveRoster();
    if (!roster) return;

    if (!behaviorRecords[key]) {
      // Create new daily session based on roster students
      behaviorRecords[key] = {
        date: activeDate,
        rosterId: activeRosterId,
        className: roster.name || 'الصف',
        subject: (roster.meta && roster.meta.subject) || roster.subject || 'الرياضيات',
        period: 'الأولى',
        topic: 'متابعة الدرس الصفي',
        notes: '',
        students: (roster.students || []).map((st, idx) => ({
          studentId: st.id || `std_${idx + 1}`,
          seat: st.seat || idx + 1,
          name: st.name || `طالب ${idx + 1}`,
          attendance: 'present', // 'present' | 'absent' | 'excused' | 'late'
          participation: 'active', // 'excellent' | 'active' | 'average' | 'none'
          homework: 'done', // 'done' | 'partial' | 'not_done'
          conduct: 'excellent', // 'excellent' | 'good' | 'needs_attention' | 'warning'
          score: 10,
          notes: ''
        }))
      };
      saveBehaviorRecords(false);
    } else {
      if (!behaviorRecords[key].className && roster.name) {
        behaviorRecords[key].className = roster.name;
      }
      if (!behaviorRecords[key].rosterId) {
        behaviorRecords[key].rosterId = activeRosterId;
      }
      if (!behaviorRecords[key].date) {
        behaviorRecords[key].date = activeDate;
      }
      // Sync any newly added students from roster
      const currentMap = new Map();
      (behaviorRecords[key].students || []).forEach(st => currentMap.set((st.name || '').trim(), st));

      let hasNew = false;
      (roster.students || []).forEach((rst, idx) => {
        const cleanName = (rst.name || '').trim();
        if (cleanName && !currentMap.has(cleanName)) {
          behaviorRecords[key].students.push({
            studentId: rst.id || `std_${idx + 1}`,
            seat: rst.seat || idx + 1,
            name: rst.name,
            attendance: 'present',
            participation: 'active',
            homework: 'done',
            conduct: 'excellent',
            score: 10,
            notes: ''
          });
          hasNew = true;
        }
      });
      if (hasNew) saveBehaviorRecords(false);
    }
  }

  /**
   * Date Controls
   */
  function initDateControls() {
    const dateInput = document.getElementById('sbActiveDateInput');
    if (dateInput) {
      dateInput.value = activeDate;
      dateInput.addEventListener('change', (e) => {
        if (e.target.value) {
          activeDate = e.target.value;
          ensureRecordForActiveDate();
          renderHeaderInfo();
          renderStats();
          renderTable();
        }
      });
    }
    updateDayNameDisplay();
  }

  function updateDayNameDisplay() {
    const dayLabel = document.getElementById('sbDayNameLabel');
    if (!dayLabel) return;
    try {
      const d = new Date(activeDate);
      const dayIndex = d.getDay();
      dayLabel.textContent = ARABIC_DAYS[dayIndex] || 'اليوم';
    } catch {
      dayLabel.textContent = 'اليوم';
    }
  }

  /**
   * Class Selector Rendering
   */
  function renderClassSelector() {
    const select = document.getElementById('sbClassSelectDropdown');
    if (!select) return;
    select.innerHTML = '';
    rosters.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = `${r.name || 'صف'} (${(r.students || []).length} طالب)`;
      if (r.id === activeRosterId) opt.selected = true;
      select.appendChild(opt);
    });
  }

  /**
   * Header Information
   */
  function renderHeaderInfo() {
    updateDayNameDisplay();
    const roster = getActiveRoster();
    const key = getRecordKey(activeDate, activeRosterId);
    const record = behaviorRecords[key];
    const currentClassName = (record && record.className) || (roster && roster.name) || 'الصف الثالث المتوسط';

    const titleEl = document.getElementById('sbActiveHeadingTitle');
    if (titleEl) {
      titleEl.textContent = `سجل المتابعة والسلوك — ${currentClassName}`;
    }

    const classNameInput = document.getElementById('sbClassNameInput');
    if (classNameInput) {
      classNameInput.value = currentClassName;
    }

    const subjectInput = document.getElementById('sbSubjectInput');
    if (subjectInput && record) subjectInput.value = record.subject || '';

    const periodInput = document.getElementById('sbPeriodInput');
    if (periodInput && record) periodInput.value = record.period || 'الأولى';

    const topicInput = document.getElementById('sbTopicInput');
    if (topicInput && record) topicInput.value = record.topic || '';
  }

  /**
   * Calculate and Render Statistics
   */
  function renderStats() {
    const key = getRecordKey(activeDate, activeRosterId);
    const record = behaviorRecords[key];
    if (!record || !Array.isArray(record.students)) return;

    const list = record.students;
    const total = list.length;
    let present = 0, absent = 0, excused = 0, late = 0;
    let participated = 0, hwDone = 0;

    list.forEach(st => {
      if (st.attendance === 'present') present++;
      else if (st.attendance === 'absent') absent++;
      else if (st.attendance === 'excused') excused++;
      else if (st.attendance === 'late') late++;

      if (st.participation === 'excellent' || st.participation === 'active') participated++;
      if (st.homework === 'done') hwDone++;
    });

    const attendedTotal = present + late;
    const attendanceRate = total > 0 ? Math.round((attendedTotal / total) * 100) : 0;

    // DOM Elements
    const totalEl = document.getElementById('sbStatTotal');
    if (totalEl) totalEl.textContent = total;

    const rateEl = document.getElementById('sbStatRate');
    if (rateEl) rateEl.textContent = `${attendanceRate}%`;

    const progEl = document.getElementById('sbStatProgressBar');
    if (progEl) progEl.style.width = `${attendanceRate}%`;

    const presentEl = document.getElementById('sbStatPresent');
    if (presentEl) presentEl.textContent = present;

    const absentEl = document.getElementById('sbStatAbsent');
    if (absentEl) absentEl.textContent = absent;

    const excusedEl = document.getElementById('sbStatExcused');
    if (excusedEl) excusedEl.textContent = excused;

    const partEl = document.getElementById('sbStatParticipated');
    if (partEl) partEl.textContent = participated;

    const subEl = document.getElementById('sbStatRateSub');
    if (subEl) {
      subEl.innerHTML = `حاضر: <strong style="color: #059669;">${present}</strong> | غائب: <strong style="color: #dc2626;">${absent}</strong> | متأخر: <strong>${late}</strong>`;
    }
  }

  /**
   * Filter and Search students
   */
  function getFilteredStudents() {
    const key = getRecordKey(activeDate, activeRosterId);
    const record = behaviorRecords[key];
    if (!record || !Array.isArray(record.students)) return [];

    return record.students.filter(st => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = st.name.toLowerCase().includes(q);
        const matchesSeat = String(st.seat).includes(q);
        if (!matchesName && !matchesSeat) return false;
      }

      // Filter
      if (statusFilter === 'all') return true;
      if (statusFilter === 'present') return st.attendance === 'present';
      if (statusFilter === 'absent') return st.attendance === 'absent';
      if (statusFilter === 'excused') return st.attendance === 'excused';
      if (statusFilter === 'participated') return st.participation === 'excellent' || st.participation === 'active';
      if (statusFilter === 'no_hw') return st.homework === 'not_done';

      return true;
    });
  }

  /**
   * Render Master Table
   */
  function renderTable() {
    const tbody = document.getElementById('sbBehaviorTableBody');
    if (!tbody) return;

    const key = getRecordKey(activeDate, activeRosterId);
    const record = behaviorRecords[key];
    if (!record) {
      tbody.innerHTML = '<tr><td colspan="9" style="padding: 2rem; color: #64748b;">لا توجد سجلات لهذا اليوم. اضغط مزامنة أو إضافة طلاب.</td></tr>';
      return;
    }

    const students = getFilteredStudents();

    if (students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="padding: 2rem; color: #64748b;">لا يوجد طلاب يطابقون خيارات البحث أو التصفية الحالية.</td></tr>';
      return;
    }

    const countLabel = document.getElementById('sbVisibleCountLabel');
    if (countLabel) {
      countLabel.textContent = `عرض ${students.length} من أصل ${record.students.length} طالب`;
    }

    let html = '';

    students.forEach((st, idx) => {
      // Real index in full array
      const realIndex = record.students.findIndex(s => s.name === st.name);

      // Attendance Pill Badges
      const attPills = `
        <div class="sb-att-group" data-idx="${realIndex}">
          <button type="button" class="sb-att-btn ${st.attendance === 'present' ? 'active-present' : ''}" onclick="window.sbSetAttendance(${realIndex}, 'present')" title="حاضر في الدرس">حاضر 🟢</button>
          <button type="button" class="sb-att-btn ${st.attendance === 'absent' ? 'active-absent' : ''}" onclick="window.sbSetAttendance(${realIndex}, 'absent')" title="غائب عن الدرس">غائب 🔴</button>
          <button type="button" class="sb-att-btn ${st.attendance === 'excused' ? 'active-excused' : ''}" onclick="window.sbSetAttendance(${realIndex}, 'excused')" title="مجاز بإجازة رسمية">مجاز 🟡</button>
          <button type="button" class="sb-att-btn ${st.attendance === 'late' ? 'active-late' : ''}" onclick="window.sbSetAttendance(${realIndex}, 'late')" title="تأخر عن الحصة">متأخر 🟠</button>
        </div>
      `;

      // Participation Dropdown
      const partSelect = `
        <select class="sb-table-select sb-select-part" onchange="window.sbUpdateField(${realIndex}, 'participation', this.value)">
          <option value="excellent" ${st.participation === 'excellent' ? 'selected' : ''}>🌟 متميز جداً</option>
          <option value="active" ${st.participation === 'active' ? 'selected' : ''}>👍 مشارك ومتفاعل</option>
          <option value="average" ${st.participation === 'average' ? 'selected' : ''}>➖ مشاركة متوسطة</option>
          <option value="none" ${st.participation === 'none' ? 'selected' : ''}>❌ لم يشارك</option>
        </select>
      `;

      // Homework Dropdown
      const hwSelect = `
        <select class="sb-table-select sb-select-hw" onchange="window.sbUpdateField(${realIndex}, 'homework', this.value)">
          <option value="done" ${st.homework === 'done' ? 'selected' : ''}>📘 كامل ومتقن</option>
          <option value="partial" ${st.homework === 'partial' ? 'selected' : ''}>📙 منجز جزئياً</option>
          <option value="not_done" ${st.homework === 'not_done' ? 'selected' : ''}>📕 غير منجز / نسي الدفتر</option>
        </select>
      `;

      // Conduct Dropdown
      const conductSelect = `
        <select class="sb-table-select sb-select-conduct" onchange="window.sbUpdateField(${realIndex}, 'conduct', this.value)">
          <option value="excellent" ${st.conduct === 'excellent' ? 'selected' : ''}>🌟 مثالي ومؤدب</option>
          <option value="good" ${st.conduct === 'good' ? 'selected' : ''}>🟢 منضبط ومحترم</option>
          <option value="needs_attention" ${st.conduct === 'needs_attention' ? 'selected' : ''}>⚠️ يحتاج تنبيه</option>
          <option value="warning" ${st.conduct === 'warning' ? 'selected' : ''}>⛔ مخالف / استدعاء</option>
        </select>
      `;

      // Daily Score Input (0 to 10)
      const scoreInput = `
        <div class="sb-score-control">
          <input type="number" min="0" max="10" step="1" class="sb-score-input" value="${st.score !== undefined ? st.score : 10}" 
                 onchange="window.sbUpdateField(${realIndex}, 'score', Number(this.value))">
          <span style="font-size: 0.72rem; color: #94a3b8; font-weight: 700;">/10</span>
        </div>
      `;

      // Notes Input
      const notesInput = `
        <input type="text" class="sb-notes-input" placeholder="ملاحظة أو سبب الغياب أو نشاط بارز..." 
               value="${(st.notes || '').replace(/"/g, '&quot;')}" 
               onchange="window.sbUpdateField(${realIndex}, 'notes', this.value)">
      `;

      // Row construction
      html += `
        <tr class="sb-row ${st.attendance === 'absent' ? 'row-absent' : ''}">
          <td class="sb-cell-seq"><span class="sb-seq-badge">${idx + 1}</span></td>
          <td class="sb-cell-name">
            <div style="font-weight: 800; color: #0f172a; font-size: 0.88rem;">${st.name}</div>
            <small style="color: #94a3b8; font-size: 0.72rem;">قيد: ${st.seat || idx + 1}</small>
          </td>
          <td>${attPills}</td>
          <td>${partSelect}</td>
          <td>${hwSelect}</td>
          <td>${conductSelect}</td>
          <td>${scoreInput}</td>
          <td>${notesInput}</td>
          <td>
            <button type="button" class="btn btn-sm btn-outline" style="border: none; color: #ef4444; padding: 4px 6px;" 
                    onclick="window.sbDeleteStudent(${realIndex})" title="حذف الطالب من جلسة اليوم">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }

  /**
   * Field Updaters
   */
  window.sbSetAttendance = function (realIndex, status) {
    const key = getRecordKey(activeDate, activeRosterId);
    if (!behaviorRecords[key] || !behaviorRecords[key].students[realIndex]) return;

    behaviorRecords[key].students[realIndex].attendance = status;
    saveBehaviorRecords(false);
    renderStats();
    renderTable();
  };

  window.sbUpdateField = function (realIndex, field, value) {
    const key = getRecordKey(activeDate, activeRosterId);
    if (!behaviorRecords[key] || !behaviorRecords[key].students[realIndex]) return;

    behaviorRecords[key].students[realIndex][field] = value;
    saveBehaviorRecords(false);
    renderStats();
  };

  window.sbDeleteStudent = function (realIndex) {
    const key = getRecordKey(activeDate, activeRosterId);
    if (!behaviorRecords[key]) return;

    const st = behaviorRecords[key].students[realIndex];
    if (!st) return;

    if (confirm(`هل أنت متأكد من حذف الطالب (${st.name}) من كشف هذا اليوم فقط؟`)) {
      behaviorRecords[key].students.splice(realIndex, 1);
      saveBehaviorRecords(false);
      renderStats();
      renderTable();
    }
  };

  /**
   * Batch Actions
   */
  window.sbClearAllStudents = function (force = false) {
    const key = getRecordKey(activeDate, activeRosterId);
    const record = behaviorRecords[key];
    const roster = getActiveRoster();

    const countInRecord = (record && Array.isArray(record.students)) ? record.students.length : 0;
    const countInRoster = (roster && Array.isArray(roster.students)) ? roster.students.length : 0;
    const totalCount = Math.max(countInRecord, countInRoster);

    if (totalCount === 0) {
      if (typeof window.showToast === 'function') {
        window.showToast('سجل الطلاب فارغ بالفعل! لا توجد بيانات لمسحها ℹ️', 'info');
      }
      return;
    }

    if (!force) {
      const className = (roster && roster.name) ? roster.name : 'الصف الحالي';
      const msg = `هل أنت متأكد من تفريغ ومسح كافة أسماء وبيانات الطلاب (${totalCount} طالب) من "${className}"؟\n\n` +
        `• سيصبح السجل فارغاً تماماً للبدء من جديد أو تجربة استيراد ملف Excel جديد 📥✨`;
      if (!confirm(msg)) {
        return;
      }
    }

    // 1. Clear students in current daily behavior record
    if (record) {
      record.students = [];
    }

    // 2. Clear students in active class roster
    if (roster) {
      roster.students = [];
    }

    // 3. Persist changes
    saveBehaviorRecords(false);
    try {
      localStorage.setItem(getBehaviorRostersStorageKey(), JSON.stringify(rosters));
    } catch (e) {}

    // 4. Update UI
    renderStats();
    renderTable();
    renderHeaderInfo();

    if (typeof window.showToast === 'function') {
      window.showToast('تم تفريغ سجل الطلاب بنجاح! السجل الآن فارغ وجاهز لإضافة طلاب أو استيراد ملف إكسل 🗑️✨', 'success');
    }
  };
  window.sbClearAllOpenData = window.sbClearAllStudents;

  window.sbMarkAllPresent = function () {
    const key = getRecordKey(activeDate, activeRosterId);
    if (!behaviorRecords[key]) return;

    behaviorRecords[key].students.forEach(st => {
      st.attendance = 'present';
    });
    saveBehaviorRecords(true);
    renderStats();
    renderTable();
    if (typeof window.showToast === 'function') {
      window.showToast('تم تسجيل حضور جميع الطلاب بنقرة واحدة ✅', 'success');
    }
  };

  window.sbSyncRosterStudents = function () {
    loadRosters();
    const roster = getActiveRoster();
    if (!roster) return;

    const key = getRecordKey(activeDate, activeRosterId);
    if (!behaviorRecords[key]) {
      ensureRecordForActiveDate();
    } else {
      const existingNames = new Set(behaviorRecords[key].students.map(s => s.name.trim()));
      let added = 0;
      roster.students.forEach((st, idx) => {
        if (!existingNames.has(st.name.trim())) {
          behaviorRecords[key].students.push({
            studentId: st.id || `std_${idx + 1}`,
            seat: st.seat || idx + 1,
            name: st.name,
            attendance: 'present',
            participation: 'active',
            homework: 'done',
            conduct: 'excellent',
            score: 10,
            notes: ''
          });
          added++;
        }
      });
      saveBehaviorRecords(true);
      if (typeof window.showToast === 'function') {
        window.showToast(`تمت مزامنة ${added} طالب جديد من سجل الدرجات 🔄`, 'info');
      }
    }
    renderStats();
    renderTable();
  };

  window.sbSelectClass = function (rosterId) {
    activeRosterId = rosterId;
    ensureRecordForActiveDate();
    renderHeaderInfo();
    renderStats();
    renderTable();
  };

  window.sbSetStatusFilter = function (filter) {
    statusFilter = filter;
    document.querySelectorAll('.sb-filter-pill').forEach(pill => {
      pill.classList.toggle('active', pill.getAttribute('data-filter') === filter);
    });
    renderTable();
  };

  window.sbOnSearchInput = function (val) {
    searchQuery = (val || '').trim();
    renderTable();
  };

  window.sbSyncMeta = function () {
    const key = getRecordKey(activeDate, activeRosterId);
    if (!behaviorRecords[key]) return;

    const s = document.getElementById('sbSubjectInput');
    if (s) behaviorRecords[key].subject = s.value;

    const p = document.getElementById('sbPeriodInput');
    if (p) behaviorRecords[key].period = p.value;

    const t = document.getElementById('sbTopicInput');
    if (t) behaviorRecords[key].topic = t.value;

    saveBehaviorRecords(false);
  };

  /**
   * Add Single Student to today's session
   */
  window.sbAddSingleStudent = function () {
    const name = prompt('أدخل اسم الطالب الثلاثي أو الرباعي:');
    if (!name || !name.trim()) return;

    const key = getRecordKey(activeDate, activeRosterId);
    if (!behaviorRecords[key]) ensureRecordForActiveDate();

    const students = behaviorRecords[key].students;
    const nextSeat = students.length + 1;

    students.push({
      studentId: `std_${Date.now()}`,
      seat: nextSeat,
      name: name.trim(),
      attendance: 'present',
      participation: 'active',
      homework: 'done',
      conduct: 'excellent',
      score: 10,
      notes: ''
    });

    saveBehaviorRecords(true);
    renderStats();
    renderTable();
  };

  /**
   * Export to CSV
   */
  window.sbExportCsv = function () {
    const key = getRecordKey(activeDate, activeRosterId);
    const record = behaviorRecords[key];
    const roster = getActiveRoster();
    if (!record || !record.students.length) {
      alert('لا توجد بيانات لتصديرها.');
      return;
    }

    let csv = '\uFEFF'; // UTF-8 BOM
    csv += `"سجل المتابعة اليومية وحسن السلوك - ${roster ? roster.name : ''}"\n`;
    csv += `"التاريخ:","${activeDate}","اليوم:","${ARABIC_DAYS[new Date(activeDate).getDay()] || ''}","المادة:","${record.subject || ''}","الحصة:","${record.period || ''}"\n\n`;
    csv += `"ت","اسم الطالب","حالة الحضور","المشاركة الصفية","الواجب البيتي","السلوك والانضباط","الدرجة اليومية","ملاحظات المعلم"\n`;

    record.students.forEach((st, idx) => {
      const attMap = { present: 'حاضر', absent: 'غائب', excused: 'مجاز', late: 'متأخر' };
      const partMap = { excellent: 'متميز', active: 'متفاعل', average: 'متوسط', none: 'لم يشارك' };
      const hwMap = { done: 'كامل ومتقن', partial: 'جزئي', not_done: 'غير منجز' };
      const conductMap = { excellent: 'مثالي', good: 'منضبط', needs_attention: 'يحتاج تنبيه', warning: 'مخالف' };

      csv += `"${idx + 1}","${st.name}","${attMap[st.attendance] || ''}","${partMap[st.participation] || ''}","${hwMap[st.homework] || ''}","${conductMap[st.conduct] || ''}","${st.score || 10}","${(st.notes || '').replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `سجل_المتابعة_والسلوك_${activeDate}_${roster ? roster.name.replace(/\s+/g, '_') : 'الصف'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Official A4 Printable Report (كشف رسمي معتمد للإشراف المدرسي)
   */
  window.sbPrintOfficialReport = function () {
    const key = getRecordKey(activeDate, activeRosterId);
    const record = behaviorRecords[key];
    const roster = getActiveRoster();
    if (!record || !record.students.length) {
      alert('لا توجد بيانات للطباعة.');
      return;
    }

    const meta = roster.meta || {};
    const school = meta.school || 'ثانوية المتميزين للبنين';
    const teacher = meta.teacher || 'أستاذ المادة';
    const subject = record.subject || meta.subject || 'الرياضيات';
    const grade = meta.grade || 'الثالث المتوسط';
    const section = meta.section || 'أ';
    const dayName = ARABIC_DAYS[new Date(activeDate).getDay()] || 'اليوم';

    // Stats
    let present = 0, absent = 0, excused = 0, late = 0;
    record.students.forEach(st => {
      if (st.attendance === 'present') present++;
      else if (st.attendance === 'absent') absent++;
      else if (st.attendance === 'excused') excused++;
      else if (st.attendance === 'late') late++;
    });

    let rowsHtml = '';
    record.students.forEach((st, idx) => {
      const attMap = {
        present: '<span style="color: #059669; font-weight: 800;">حاضر ✔</span>',
        absent: '<span style="color: #dc2626; font-weight: 800; background: #fee2e2; padding: 2px 6px; border-radius: 4px;">غائب ✖</span>',
        excused: '<span style="color: #d97706; font-weight: 800;">مجاز 📋</span>',
        late: '<span style="color: #ea580c; font-weight: 800;">متأخر ⏱</span>'
      };
      const partMap = { excellent: '🌟 متميز', active: '👍 متفاعل', average: '➖ متوسط', none: '❌ لم يشارك' };
      const hwMap = { done: '📘 منجز', partial: '📙 جزئي', not_done: '📕 غير منجز' };
      const conductMap = { excellent: '🌟 مثالي', good: '🟢 منضبط', needs_attention: '⚠️ تنبيه', warning: '⛔ مخالف' };

      rowsHtml += `
        <tr>
          <td style="text-align: center; font-weight: 800;">${idx + 1}</td>
          <td style="text-align: right; font-weight: 800; padding: 6px 8px;">${st.name}</td>
          <td style="text-align: center;">${attMap[st.attendance] || ''}</td>
          <td style="text-align: center;">${partMap[st.participation] || ''}</td>
          <td style="text-align: center;">${hwMap[st.homework] || ''}</td>
          <td style="text-align: center;">${conductMap[st.conduct] || ''}</td>
          <td style="text-align: center; font-weight: 900; font-size: 1rem;">${st.score !== undefined ? st.score : 10}</td>
          <td style="text-align: right; font-size: 0.8rem; color: #475569;">${st.notes || '—'}</td>
        </tr>
      `;
    });

    let printDoc = null;
    let isIframeFallback = false;
    let printWin = null;
    try {
      printWin = window.open('', '_blank');
    } catch (_) {}

    if (printWin && printWin.document) {
      printDoc = printWin.document;
    } else {
      isIframeFallback = true;
      let printFrame = document.getElementById('sbDedicatedPrintIframe');
      if (printFrame) printFrame.remove();
      printFrame = document.createElement('iframe');
      printFrame.id = 'sbDedicatedPrintIframe';
      printFrame.style.cssText = 'position: fixed; left: 0; top: 0; width: 0; height: 0; border: 0; opacity: 0; pointer-events: none; z-index: -9999;';
      document.body.appendChild(printFrame);
      printDoc = printFrame.contentWindow.document;
    }

    printDoc.open();
    printDoc.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>كشف المتابعة اليومية وحسن السلوك — ${school}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          body { font-family: 'Cairo', sans-serif; margin: 0; padding: 0; color: #000; direction: rtl; background: #fff; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          .header-table td { vertical-align: middle; }
          .title-box { text-align: center; }
          .title-main { font-size: 1.25rem; font-weight: 900; margin: 2px 0; }
          .title-sub { font-size: 0.88rem; font-weight: 700; color: #333; }
          .meta-strip { display: flex; justify-content: space-between; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 6px 12px; margin-bottom: 10px; font-size: 0.85rem; font-weight: 700; }
          .stats-strip { display: flex; gap: 15px; margin-bottom: 10px; font-size: 0.82rem; }
          .stat-pill { border: 1px solid #cbd5e1; border-radius: 4px; padding: 3px 8px; font-weight: 800; background: #fafafa; }
          table.data-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; margin-bottom: 15px; }
          table.data-table th, table.data-table td { border: 1px solid #334155; padding: 5px 6px; }
          table.data-table th { background: #f1f5f9; font-weight: 900; }
          .signatures { display: flex; justify-content: space-between; margin-top: 20px; padding: 0 20px; font-weight: 800; font-size: 0.88rem; }
          .sig-box { text-align: center; width: 180px; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="width: 28%; font-size: 0.82rem; font-weight: 700; line-height: 1.6;">
              جمهورية العراق<br>
              وزارة التربية<br>
              المديرية العامة للتربية<br>
              <strong>${school}</strong>
            </td>
            <td class="title-box" style="width: 44%;">
              <img src="assets/iraq_moe_seal.png" alt="شعار وزارة التربية" style="width: 52px; height: 52px; object-fit: contain; margin-bottom: 2px;">
              <div class="title-main">سجل المتابعة والتقييم اليومي وحسن السلوك</div>
              <div class="title-sub">كشف رسمي معتمد للإشراف التربوي والإدارة المدرسية</div>
            </td>
            <td style="width: 28%; text-align: left; font-size: 0.82rem; font-weight: 700; line-height: 1.6;">
              اليوم: <strong>${dayName}</strong><br>
              التاريخ: <strong>${activeDate}</strong><br>
              الصف: <strong>${grade} (${section})</strong><br>
              المادة: <strong>${subject}</strong>
            </td>
          </tr>
        </table>

        <div class="meta-strip">
          <div>الحصة: <strong>${record.period || 'الأولى'}</strong></div>
          <div>عنوان الدرس / الموضوع: <strong>${record.topic || 'سير الدرس اليومي'}</strong></div>
          <div>مدرس المادة: <strong>${teacher}</strong></div>
        </div>

        <div class="stats-strip">
          <div class="stat-pill">العدد الكلي: <strong>${record.students.length}</strong></div>
          <div class="stat-pill" style="border-color: #10b981; color: #059669;">الحاضرون: <strong>${present}</strong></div>
          <div class="stat-pill" style="border-color: #ef4444; color: #dc2626;">الغائبون: <strong>${absent}</strong></div>
          <div class="stat-pill" style="border-color: #f59e0b; color: #d97706;">المجازون: <strong>${excused}</strong></div>
          <div class="stat-pill">نسبة الحضور: <strong>${record.students.length > 0 ? Math.round(((present + late) / record.students.length) * 100) : 0}%</strong></div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 32px;">ت</th>
              <th>اسم الطالب الثلاثي والرباعي</th>
              <th style="width: 80px;">الحضور</th>
              <th style="width: 85px;">المشاركة</th>
              <th style="width: 85px;">الواجب البيتي</th>
              <th style="width: 85px;">السلوك والمواظبة</th>
              <th style="width: 55px;">الدرجة</th>
              <th>ملاحظات المعلم / أسباب الغياب</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="signatures">
          <div class="sig-box">
            <div>مدرس / معلم المادة</div>
            <div style="margin-top: 35px; border-bottom: 1px dotted #000;">${teacher}</div>
          </div>
          <div class="sig-box">
            <div>المشرف التربوي الزائر</div>
            <div style="margin-top: 35px; border-bottom: 1px dotted #000;">التوقيع والختم</div>
          </div>
          <div class="sig-box">
            <div>مدير المدرسة</div>
            <div style="margin-top: 35px; border-bottom: 1px dotted #000;">الختم والتوقيع الرسمي</div>
          </div>
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `);
    printDoc.close();
    if (isIframeFallback) {
      setTimeout(() => {
        try {
          const frame = document.getElementById('sbDedicatedPrintIframe');
          if (frame && frame.contentWindow) {
            frame.contentWindow.focus();
            frame.contentWindow.print();
          }
        } catch (_) {
          window.print();
        }
      }, 500);
    } else {
      try {
        printWin.focus();
      } catch (_) {}
    }
  };

  /**
   * Direct PDF Exporter for Student Behavior & Conduct Sheet (تنزيل ملف PDF حقيقي ومباشر دون نوافذ طباعة)
   */
  window.sbExportOfficialPdf = async function (targetDate, targetRosterId) {
    const theDate = targetDate || activeDate;
    const theRosterId = targetRosterId || activeRosterId;
    const key = getRecordKey(theDate, theRosterId);
    const record = behaviorRecords[key];
    const roster = (rosters && rosters.find(r => r.id === theRosterId)) || getActiveRoster();
    if (!record || !record.students || !record.students.length) {
      if (typeof window.showToast === 'function') {
        window.showToast('لا توجد بيانات طلاب في جلسة المتابعة لتنزيل PDF!', 'warning');
      } else {
        alert('لا توجد بيانات طلاب لتنزيل PDF.');
      }
      return;
    }

    const meta = (roster && roster.meta) || {};
    const school = meta.school || (roster && roster.schoolName) || 'ثانوية المتميزين للبنين';
    const teacher = meta.teacher || (roster && roster.teacherName) || 'أستاذ المادة';
    const subject = record.subject || meta.subject || 'الرياضيات';
    const grade = meta.grade || (roster && roster.name) || 'الثالث المتوسط';
    let dayName = 'اليوم';
    try {
      dayName = ARABIC_DAYS[new Date(theDate).getDay()] || 'اليوم';
    } catch (e) {
      dayName = 'اليوم';
    }

    let present = 0, absent = 0, excused = 0, late = 0;
    record.students.forEach(st => {
      if (st.attendance === 'present') present++;
      else if (st.attendance === 'absent') absent++;
      else if (st.attendance === 'excused') excused++;
      else if (st.attendance === 'late') late++;
    });

    let rowsHtml = '';
    record.students.forEach((st, idx) => {
      const attMap = {
        present: '<span style="color: #059669; font-weight: 800;">حاضر ✔</span>',
        absent: '<span style="color: #dc2626; font-weight: 800; background: #fee2e2; padding: 2px 6px; border-radius: 4px;">غائب ✖</span>',
        excused: '<span style="color: #d97706; font-weight: 800;">مجاز 📋</span>',
        late: '<span style="color: #ea580c; font-weight: 800;">متأخر ⏱</span>'
      };
      const partMap = { excellent: '🌟 متميز', active: '👍 متفاعل', average: '➖ متوسط', none: '❌ لم يشارك' };
      const hwMap = { done: '📘 منجز', partial: '📙 جزئي', not_done: '📕 غير منجز' };
      const conductMap = { excellent: '🌟 مثالي', good: '🟢 منضبط', needs_attention: '⚠️ تنبيه', warning: '⛔ مخالف' };

      rowsHtml += `
        <tr style="border-bottom: 1px solid #cbd5e1; background: ${idx % 2 === 1 ? '#f8fafc' : '#ffffff'};">
          <td style="text-align: center; font-weight: 800; padding: 4px; border: 1px solid #cbd5e1;">${idx + 1}</td>
          <td style="text-align: right; font-weight: 800; padding: 4px 8px; border: 1px solid #cbd5e1;">${escapeHtml(st.name || '')}</td>
          <td style="text-align: center; padding: 4px; border: 1px solid #cbd5e1;">${attMap[st.attendance] || ''}</td>
          <td style="text-align: center; padding: 4px; border: 1px solid #cbd5e1;">${partMap[st.participation] || ''}</td>
          <td style="text-align: center; padding: 4px; border: 1px solid #cbd5e1;">${hwMap[st.homework] || ''}</td>
          <td style="text-align: center; padding: 4px; border: 1px solid #cbd5e1;">${conductMap[st.conduct] || ''}</td>
          <td style="text-align: center; font-weight: 900; font-size: 0.95rem; padding: 4px; border: 1px solid #cbd5e1;">${st.score !== undefined ? st.score : 10}</td>
          <td style="text-align: right; font-size: 0.8rem; color: #475569; padding: 4px 8px; border: 1px solid #cbd5e1;">${escapeHtml(st.notes || '—')}</td>
        </tr>
      `;
    });

    let exportDiv = document.getElementById('sbPdfExportContainer');
    if (!exportDiv) {
      exportDiv = document.createElement('div');
      exportDiv.id = 'sbPdfExportContainer';
      document.body.appendChild(exportDiv);
    }

    const cleanClassName = (record.className || (roster && roster.name) || 'الصف').replace(/[\/\\?%*:|"<>]/g, '-').trim();
    const cleanSub = subject.replace(/[\/\\?%*:|"<>]/g, '-').trim();
    const filename = `كشف-متابعة-وسلوك-${cleanClassName}-${cleanSub}-${theDate}.pdf`;

    exportDiv.style.display = 'block';
    exportDiv.style.position = 'relative';
    exportDiv.innerHTML = `
      <div style="direction: rtl; text-align: right; font-family: 'Amiri', 'Cairo', serif; color: #000; padding: 20px 25px; line-height: 1.35; background: #fff; width: 100%; box-sizing: border-box;">
        
        <!-- Header -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
          <tr>
            <td style="width: 28%; font-size: 0.85rem; font-weight: 700; line-height: 1.6; vertical-align: middle;">
              جمهورية العراق<br>
              وزارة التربية<br>
              المديرية العامة للتربية<br>
              <strong>${escapeHtml(school)}</strong>
            </td>
            <td style="width: 44%; text-align: center; vertical-align: middle;">
              <img src="assets/iraq_moe_seal.png" alt="شعار وزارة التربية" style="width: 54px; height: 54px; object-fit: contain; margin-bottom: 2px; display: inline-block;">
              <div style="font-size: 1.25rem; font-weight: 900; margin: 2px 0;">سجل المتابعة والتقييم اليومي وحسن السلوك</div>
              <div style="font-size: 0.88rem; font-weight: 700; color: #333;">كشف رسمي معتمد للإشراف التربوي والإدارة المدرسية</div>
            </td>
            <td style="width: 28%; text-align: left; font-size: 0.85rem; font-weight: 700; line-height: 1.6; vertical-align: middle;">
              اليوم: <strong>${dayName}</strong><br>
              التاريخ: <strong>${theDate}</strong><br>
              الصف: <strong>${escapeHtml(cleanClassName)}</strong><br>
              المادة: <strong>${escapeHtml(subject)}</strong>
            </td>
          </tr>
        </table>

        <!-- Meta Strip -->
        <div style="display: flex; justify-content: space-between; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 6px 12px; margin-bottom: 10px; font-size: 0.85rem; font-weight: 700;">
          <div>الحصة: <strong>${escapeHtml(record.period || 'الأولى')}</strong></div>
          <div>عنوان الدرس / الموضوع: <strong>${escapeHtml(record.topic || 'سير الدرس اليومي')}</strong></div>
          <div>مدرس المادة: <strong>${escapeHtml(teacher)}</strong></div>
        </div>

        <!-- Stats Strip -->
        <div style="display: flex; gap: 12px; margin-bottom: 10px; font-size: 0.82rem; flex-wrap: wrap;">
          <div style="border: 1px solid #cbd5e1; border-radius: 4px; padding: 3px 8px; font-weight: 800; background: #fafafa;">العدد الكلي: <strong>${record.students.length}</strong></div>
          <div style="border: 1px solid #10b981; border-radius: 4px; padding: 3px 8px; font-weight: 800; background: #ecfdf5; color: #059669;">الحاضرون: <strong>${present}</strong></div>
          <div style="border: 1px solid #ef4444; border-radius: 4px; padding: 3px 8px; font-weight: 800; background: #fef2f2; color: #dc2626;">الغائبون: <strong>${absent}</strong></div>
          <div style="border: 1px solid #f59e0b; border-radius: 4px; padding: 3px 8px; font-weight: 800; background: #fffbeb; color: #d97706;">المجازون: <strong>${excused}</strong></div>
          <div style="border: 1px solid #cbd5e1; border-radius: 4px; padding: 3px 8px; font-weight: 800; background: #fafafa;">نسبة الحضور: <strong>${record.students.length > 0 ? Math.round(((present + late) / record.students.length) * 100) : 0}%</strong></div>
        </div>

        <!-- Data Table -->
        <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 15px;">
          <thead>
            <tr style="background: #f1f5f9; font-weight: 900;">
              <th style="width: 32px; border: 1px solid #334155; padding: 5px 4px; text-align: center;">ت</th>
              <th style="border: 1px solid #334155; padding: 5px 6px; text-align: right;">اسم الطالب الثلاثي والرباعي</th>
              <th style="width: 75px; border: 1px solid #334155; padding: 5px 4px; text-align: center;">الحضور</th>
              <th style="width: 80px; border: 1px solid #334155; padding: 5px 4px; text-align: center;">المشاركة</th>
              <th style="width: 80px; border: 1px solid #334155; padding: 5px 4px; text-align: center;">الواجب البيتي</th>
              <th style="width: 85px; border: 1px solid #334155; padding: 5px 4px; text-align: center;">السلوك والمواظبة</th>
              <th style="width: 50px; border: 1px solid #334155; padding: 5px 4px; text-align: center;">الدرجة</th>
              <th style="border: 1px solid #334155; padding: 5px 6px; text-align: right;">ملاحظات المعلم / أسباب الغياب</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <!-- Signatures -->
        <div style="display: flex; justify-content: space-between; margin-top: 25px; padding: 0 15px; font-weight: 800; font-size: 0.85rem;">
          <div style="text-align: center; width: 170px;">
            <div>مدرس / معلم المادة</div>
            <div style="margin-top: 30px; border-bottom: 1px dotted #000;">${escapeHtml(teacher)}</div>
          </div>
          <div style="text-align: center; width: 170px;">
            <div>المشرف التربوي الزائر</div>
            <div style="margin-top: 30px; border-bottom: 1px dotted #000;">التوقيع والختم</div>
          </div>
          <div style="text-align: center; width: 170px;">
            <div>مدير المدرسة</div>
            <div style="margin-top: 30px; border-bottom: 1px dotted #000;">الختم والتوقيع الرسمي</div>
          </div>
        </div>

      </div>
    `;

    try {
      if (typeof window.exportToPDF === 'function') {
        await window.exportToPDF(exportDiv, {
          title: filename.replace(/\.pdf$/i, ''),
          filename: filename,
          pageSize: 'a4',
          format: 'a4',
          orientation: 'portrait',
          margin: '8mm',
          fit: true
        });
        if (typeof window.showToast === 'function') {
          window.showToast('تم تنزيل كشف المتابعة وحسن السلوك بصيغة PDF بنجاح ✅', 'success');
        }
      } else {
        throw new Error('محرك تصدير PDF المباشر غير متوفر');
      }
    } catch (err) {
      console.error('sbExportOfficialPdf error:', err);
      if (typeof window.showToast === 'function') {
        window.showToast('تعذر تنزيل ملف PDF: ' + (err.message || 'خطأ غير متوقع'), 'danger');
      }
    } finally {
      if (exportDiv) exportDiv.style.display = 'none';
    }
  };

  window.sbExportSessionFromArchivePdf = async function (date, rosterId) {
    await window.sbExportOfficialPdf(date, rosterId);
  };


  // Auto Init on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStudentBehaviorModule);
  } else {
    initStudentBehaviorModule();
  }

  /**
   * Direct Full Control on Class Name (التحكم الكامل باسم الصف والشعبة)
   */
  window.sbOnClassNameChange = function (newVal) {
    const key = getRecordKey(activeDate, activeRosterId);
    if (!behaviorRecords[key]) ensureRecordForActiveDate();
    const record = behaviorRecords[key];
    if (record) {
      record.className = newVal;
      const titleEl = document.getElementById('sbActiveHeadingTitle');
      if (titleEl) {
        titleEl.textContent = `سجل المتابعة والسلوك — ${newVal || 'الصف'}`;
      }
      const roster = getActiveRoster();
      if (roster) {
        roster.name = newVal;
        const select = document.getElementById('sbClassSelectDropdown');
        if (select && select.selectedOptions && select.selectedOptions[0]) {
          select.selectedOptions[0].textContent = `${newVal} (${(roster.students || []).length} طالب)`;
        }
      }
      saveBehaviorRecords(false);
    }
  };

  /**
   * Direct Save Behavior Record (حفظ سجل المتابعة وحسن السلوك في الأرشيف)
   */
  window.sbSaveRecordDirectly = function (showToast = true) {
    const key = getRecordKey(activeDate, activeRosterId);
    if (!behaviorRecords[key]) {
      ensureRecordForActiveDate();
    }
    const record = behaviorRecords[key];
    const roster = getActiveRoster();

    // Read values from DOM inputs if present
    const cNameInput = document.getElementById('sbClassNameInput');
    const subjInput = document.getElementById('sbSubjectInput');
    const periodInput = document.getElementById('sbPeriodInput');
    const topicInput = document.getElementById('sbTopicInput');

    if (cNameInput && cNameInput.value.trim()) {
      record.className = cNameInput.value.trim();
      if (roster) roster.name = record.className;
    } else if (!record.className && roster) {
      record.className = roster.name;
    }

    if (subjInput && subjInput.value.trim()) record.subject = subjInput.value.trim();
    if (periodInput && periodInput.value.trim()) record.period = periodInput.value.trim();
    if (topicInput && topicInput.value.trim()) record.topic = topicInput.value.trim();

    record.date = activeDate;
    record.rosterId = activeRosterId;

    // Save behavior records
    saveBehaviorRecords(false);

    // Save rosters
    try {
      localStorage.setItem(getBehaviorRostersStorageKey(), JSON.stringify(rosters));
    } catch (e) {
      console.warn('Could not save rosters:', e);
    }

    if (typeof window.scheduleCloudAutoSync === 'function') {
      window.scheduleCloudAutoSync();
    }

    renderHeaderInfo();
    renderClassSelector();

    if (showToast && typeof window.showToast === 'function') {
      window.showToast('تم حفظ كشف السلوك والمتابعة في الأرشيف بنجاح! 🗄️✅', 'success');
    }
  };

  /**
   * Save and navigate to Daily Report (حفظ السجل والانتقال للتقرير اليومي)
   */
  window.sbSaveAndGoToReport = function () {
    window.sbSaveRecordDirectly(false);
    if (typeof window.showToast === 'function') {
      window.showToast('تم حفظ سجل المتابعة وحسن السلوك بنجاح! جاري الانتقال إلى واجهة التقرير اليومي... 📋', 'success');
    }
    setTimeout(() => {
      if (typeof window.switchToReportTab === 'function') {
        window.switchToReportTab(true);
      }
    }, 350);
  };

  /**
   * Modal to Create New Class / Section for Student Behavior (إضافة صف أو شعبة جديدة)
   */
  window.sbOpenCreateClassModal = function () {
    const modal = document.getElementById('sbCreateClassModal');
    if (modal) {
      modal.classList.add('open');
      const gradeInp = document.getElementById('sbNewClassGradeInput');
      const secInp = document.getElementById('sbNewClassSectionInput');
      const subjInp = document.getElementById('sbNewClassSubjectInput');
      const nameInp = document.getElementById('sbNewClassNameInput');

      if (gradeInp) gradeInp.value = '';
      if (secInp) secInp.value = '';
      if (subjInp) {
        const curRoster = getActiveRoster();
        subjInp.value = (curRoster && curRoster.meta && curRoster.meta.subject) || (curRoster && curRoster.subject) || 'الرياضيات';
      }
      if (nameInp) nameInp.value = '';

      setTimeout(() => {
        if (gradeInp) gradeInp.focus();
      }, 150);
    }
  };

  window.sbCloseCreateClassModal = function () {
    const modal = document.getElementById('sbCreateClassModal');
    if (modal) modal.classList.remove('open');
  };

  window.sbSubmitCreateClass = function () {
    const gradeInp = document.getElementById('sbNewClassGradeInput');
    const secInp = document.getElementById('sbNewClassSectionInput');
    const subjInp = document.getElementById('sbNewClassSubjectInput');
    const nameInp = document.getElementById('sbNewClassNameInput');

    const grade = gradeInp ? gradeInp.value.trim() : '';
    const section = secInp ? secInp.value.trim() : '';
    const subject = subjInp ? subjInp.value.trim() : 'الرياضيات';
    const customName = nameInp ? nameInp.value.trim() : '';

    if (!customName && (!grade || !section)) {
      if (typeof window.showToast === 'function') {
        window.showToast('يرجى تحديد المرحلة والشعبة أو كتابة اسم الصف أولاً!', 'warning');
      }
      return;
    }

    const finalName = customName || `الصف ${grade} - شعبة (${section})`;
    const newId = 'roster_' + Date.now();

    const curRoster = getActiveRoster();
    const newRoster = {
      id: newId,
      name: finalName,
      meta: {
        school: (curRoster && curRoster.meta && curRoster.meta.school) || (curRoster && curRoster.schoolName) || 'اسم المدرسة',
        subject: subject,
        grade: grade || 'المرحلة الدراسية',
        section: section || 'أ',
        teacher: (curRoster && curRoster.meta && curRoster.meta.teacher) || (curRoster && curRoster.teacherName) || 'أستاذ المادة',
        academicYear: '2024 - 2025'
      },
      gradeLevel: grade || 'المرحلة الدراسية',
      section: section || 'أ',
      subject: subject,
      students: []
    };

    rosters.push(newRoster);
    activeRosterId = newId;

    try {
      localStorage.setItem(getBehaviorRostersStorageKey(), JSON.stringify(rosters));
    } catch (e) {}

    // Initialize daily record for this new class
    ensureRecordForActiveDate();
    saveBehaviorRecords(false);

    window.sbCloseCreateClassModal();
    renderClassSelector();
    renderHeaderInfo();
    renderStats();
    renderTable();

    if (typeof window.showToast === 'function') {
      window.showToast(`تم إنشاء صف (${finalName}) بنجاح! يمكنك الآن رصد المتابعة والغياب أو إضافة طلاب 🏫✨`, 'success');
    }
  };

  /**
   * Delete Active Class / Section from Behavior Module
   */
  window.sbDeleteActiveClass = function () {
    if (!rosters || rosters.length <= 1) {
      if (typeof window.showToast === 'function') {
        window.showToast('لا يمكن حذف هذا الصف لأنه الصف الوحيد المتبقي!', 'warning');
      }
      return;
    }
    const curRoster = getActiveRoster();
    const curName = curRoster ? curRoster.name : 'هذا الصف';
    if (!confirm(`هل أنت متأكد من رغبتك في حذف "${curName}"؟`)) {
      return;
    }
    const deletedId = activeRosterId;
    rosters = rosters.filter(r => r.id !== deletedId);
    activeRosterId = rosters[0].id;
    try {
      localStorage.setItem(getBehaviorRostersStorageKey(), JSON.stringify(rosters));
    } catch(e) {}
    
    ensureRecordForActiveDate();
    saveBehaviorRecords(false);
    renderClassSelector();
    renderHeaderInfo();
    renderStats();
    renderTable();

    if (typeof window.showToast === 'function') {
      window.showToast(`تم حذف الصف (${curName}) بنجاح! 🗑️`, 'info');
    }
  };

  /**
   * Behavior Archive Modal Implementation
   */
  window.sbOpenBehaviorArchiveModal = function () {
    loadRosters();
    loadBehaviorRecords();
    const modal = document.getElementById('sbBehaviorArchiveModal');
    if (modal) {
      modal.classList.add('open');
      const searchInput = document.getElementById('sbArchiveSearchInput');
      if (searchInput) searchInput.value = '';
      window.sbRenderBehaviorArchiveList('');
    }
  };

  window.sbCloseBehaviorArchiveModal = function () {
    const modal = document.getElementById('sbBehaviorArchiveModal');
    if (modal) modal.classList.remove('open');
  };

  window.sbFilterArchiveRecords = function (query) {
    window.sbRenderBehaviorArchiveList(query);
  };

  window.sbRenderBehaviorArchiveList = function (filterQuery = '') {
    const container = document.getElementById('sbBehaviorArchiveList');
    const countLabel = document.getElementById('sbArchiveCountLabel');
    if (!container) return;

    const q = (filterQuery || '').trim().toLowerCase();
    const keys = Object.keys(behaviorRecords || {}).sort().reverse();

    const filteredKeys = keys.filter(k => {
      const rec = behaviorRecords[k];
      if (!rec) return false;
      if (!q) return true;
      const r = rosters.find(ros => ros.id === rec.rosterId);
      const cName = (rec.className || (r && r.name) || '').toLowerCase();
      const sName = (rec.subject || '').toLowerCase();
      const dName = (rec.date || '').toLowerCase();
      return cName.includes(q) || sName.includes(q) || dName.includes(q);
    });

    if (countLabel) {
      countLabel.textContent = `${filteredKeys.length} جلسات في الأرشيف (من إجمالي ${keys.length})`;
    }

    if (filteredKeys.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 12px; color: #64748b;">
          <i class="fa-solid fa-box-open" style="font-size: 2.2rem; color: #94a3b8; margin-bottom: 8px;"></i>
          <div style="font-weight: 800; font-size: 0.95rem; color: #334155;">لا توجد جلسات متابعة تطابق البحث</div>
          <small>يتم حفظ جلسات المتابعة تلقائياً عند تسجيل الحضور والغياب أو الضغط على "حفظ في الأرشيف"</small>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredKeys.map(k => {
      const rec = behaviorRecords[k];
      const r = rosters.find(ros => ros.id === rec.rosterId);
      const cName = rec.className || (r && r.name) || 'الصف غير محدد';
      const students = rec.students || [];

      let present = 0, absent = 0, excused = 0, late = 0;
      students.forEach(st => {
        if (st.attendance === 'present') present++;
        else if (st.attendance === 'absent') absent++;
        else if (st.attendance === 'excused') excused++;
        else if (st.attendance === 'late') late++;
      });

      const total = students.length;
      const attRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
      
      let dayName = 'اليوم';
      try {
        const d = new Date(rec.date);
        dayName = ARABIC_DAYS[d.getDay()] || 'اليوم';
      } catch {}

      const isCurrentSession = (rec.date === activeDate && rec.rosterId === activeRosterId);

      return `
        <div class="sb-archive-card ${isCurrentSession ? 'active-session-card' : ''}" style="background: #ffffff; border: 1.5px solid ${isCurrentSession ? '#0284c7' : '#e2e8f0'}; border-radius: 12px; padding: 1rem 1.15rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 44px; height: 44px; border-radius: 10px; background: ${isCurrentSession ? 'rgba(2,132,199,0.15)' : 'rgba(16,185,129,0.15)'}; color: ${isCurrentSession ? '#0284c7' : '#059669'}; display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">
              <i class="fa-solid fa-calendar-check"></i>
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <h4 style="margin: 0; font-size: 0.96rem; font-weight: 900; color: #0f172a;">${escapeHtml(cName)}</h4>
                <span class="badge-tag" style="background: #f0f9ff; color: #0284c7; font-weight: 800; font-size: 0.72rem;">${dayName} ${rec.date}</span>
                ${isCurrentSession ? '<span class="badge-tag" style="background: #ecfdf5; color: #059669; font-weight: 800; font-size: 0.7rem;">الجلسة المفتوحة حالياً 🟢</span>' : ''}
              </div>
              <div style="font-size: 0.78rem; color: #64748b; margin-top: 3px; display: flex; gap: 10px; flex-wrap: wrap;">
                <span><i class="fa-solid fa-book" style="color: #f59e0b;"></i> المادة: <b>${escapeHtml(rec.subject || '-')}</b></span>
                <span><i class="fa-solid fa-clock" style="color: #6366f1;"></i> الحصة: <b>${escapeHtml(rec.period || 'الأولى')}</b></span>
                <span><i class="fa-solid fa-users" style="color: #3b82f6;"></i> المقيدون: <b>${total}</b></span>
                <span><i class="fa-solid fa-circle-check" style="color: #059669;"></i> حضور: <b>${present + late}</b></span>
                <span><i class="fa-solid fa-circle-xmark" style="color: #ef4444;"></i> غياب: <b>${absent}</b></span>
                <span><i class="fa-solid fa-percent" style="color: #059669;"></i> نسبة الحضور: <b>${attRate}%</b></span>
              </div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <button type="button" class="btn btn-sm btn-primary" onclick="window.sbSelectSessionFromArchive('${rec.date}', '${rec.rosterId}')" style="background: linear-gradient(135deg, #0284c7, #0369a1); font-weight: 800; padding: 0.35rem 0.75rem;">
              <i class="fa-solid fa-folder-open"></i> فتح الكشف
            </button>
            <button type="button" class="btn btn-sm btn-danger" onclick="window.sbExportSessionFromArchivePdf('${rec.date}', '${rec.rosterId}')" style="background: linear-gradient(135deg, #e11d48, #be123c); font-weight: 800; padding: 0.35rem 0.75rem; border: none;" title="تنزيل كشف هذا اليوم بصيغة PDF مباشرة">
              <i class="fa-solid fa-file-pdf"></i> تنزيل PDF
            </button>
            <button type="button" class="btn btn-sm btn-outline" onclick="window.sbPrintSessionFromArchive('${rec.date}', '${rec.rosterId}')" style="border-color: #7c3aed; color: #7c3aed; font-weight: 700; padding: 0.35rem 0.75rem;" title="طباعة كشف هذا اليوم A4">
              <i class="fa-solid fa-print"></i> طباعة A4
            </button>
            <button type="button" class="btn btn-sm btn-outline" onclick="window.sbDeleteSessionFromArchive('${k}')" style="color: #dc2626; border-color: rgba(220,38,38,0.3); padding: 0.35rem 0.6rem;" title="حذف هذا الكشف من الأرشيف">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  };

  window.sbSelectSessionFromArchive = function (date, rosterId) {
    activeDate = date;
    activeRosterId = rosterId;
    const dateInput = document.getElementById('sbActiveDateInput');
    if (dateInput) dateInput.value = date;
    ensureRecordForActiveDate();
    renderClassSelector();
    renderHeaderInfo();
    renderStats();
    renderTable();
    window.sbCloseBehaviorArchiveModal();
    if (typeof window.showToast === 'function') {
      window.showToast(`تم فتح كشف يوم ${date} بنجاح 📂`, 'success');
    }
  };

  window.sbPrintSessionFromArchive = function (date, rosterId) {
    activeDate = date;
    activeRosterId = rosterId;
    const dateInput = document.getElementById('sbActiveDateInput');
    if (dateInput) dateInput.value = date;
    ensureRecordForActiveDate();
    renderClassSelector();
    renderHeaderInfo();
    renderStats();
    renderTable();
    window.sbCloseBehaviorArchiveModal();
    window.sbPrintOfficialReport();
  };

  window.sbExportSessionFromArchive = function (date, rosterId) {
    activeDate = date;
    activeRosterId = rosterId;
    window.sbExportCsv();
  };

  window.sbDeleteSessionFromArchive = function (key) {
    if (!confirm('هل أنت متأكد من حذف هذا الكشف اليومي من الأرشيف نهائياً؟')) {
      return;
    }
    delete behaviorRecords[key];
    saveBehaviorRecords(false);
    ensureRecordForActiveDate();
    renderStats();
    renderTable();
    window.sbRenderBehaviorArchiveList('');
    if (typeof window.showToast === 'function') {
      window.showToast('تم حذف الكشف من الأرشيف بنجاح 🗑️', 'info');
    }
  };

  /* ==========================================================================
     Excel & CSV Import Suite for Student Behavior Module
     (استيراد وقراءة ملفات إكسل مع الترتيب الأبجدي العربي الكامل أ - ي)
     ========================================================================== */
  let pendingExcelStudents = [];

  /**
   * Arabic Normalized Collation Key for Alphabetical Sorting (أ - ي)
   */
  function getArabicSortKey(str) {
    if (!str) return '';
    return String(str)
      .trim()
      .replace(/[\u064B-\u065F\u0670]/g, '') // remove diacritics / tashkeel
      .replace(/[^\u0621-\u064A\s]/g, '') // remove punctuation & numbers
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[\s\t]+/g, ' ')
      .trim();
  }

  function sortStudentsArabicAlphabetical(studentsList) {
    const collator = new Intl.Collator('ar', {
      sensitivity: 'base',
      numeric: true
    });

    return studentsList.slice().sort((a, b) => {
      const keyA = getArabicSortKey(a.name);
      const keyB = getArabicSortKey(b.name);
      const cmp = collator.compare(keyA, keyB);
      if (cmp !== 0) return cmp;
      return (a.name || '').localeCompare(b.name || '', 'ar');
    });
  }

  window.sbOpenExcelImportModal = function () {
    pendingExcelStudents = [];
    const modal = document.getElementById('sbExcelImportModal');
    if (modal) {
      modal.classList.add('open');
      const fileInput = document.getElementById('sbExcelFileInput');
      if (fileInput) fileInput.value = '';

      const previewSection = document.getElementById('sbExcelPreviewSection');
      if (previewSection) previewSection.style.display = 'none';

      const confirmBtn = document.getElementById('sbBtnConfirmExcelImport');
      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = '0.5';
      }
    }
  };

  window.sbCloseExcelImportModal = function () {
    const modal = document.getElementById('sbExcelImportModal');
    if (modal) modal.classList.remove('open');
  };

  window.sbOnDragOver = function (e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('sbExcelDropzone');
    if (dropzone) dropzone.classList.add('dragover');
  };

  window.sbOnDragLeave = function (e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('sbExcelDropzone');
    if (dropzone) dropzone.classList.remove('dragover');
  };

  window.sbOnDropExcel = function (e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('sbExcelDropzone');
    if (dropzone) dropzone.classList.remove('dragover');

    const files = e.dataTransfer ? e.dataTransfer.files : null;
    if (files && files.length > 0) {
      processExcelFile(files[0]);
    }
  };

  window.sbOnExcelFileSelected = function (input) {
    if (input && input.files && input.files.length > 0) {
      processExcelFile(input.files[0]);
    }
  };

  function processExcelFile(file) {
    if (!file) return;

    const fileName = file.name || '';
    const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();

    if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
      if (typeof window.showToast === 'function') {
        window.showToast('يرجى اختيار ملف بصيغة Excel (.xlsx, .xls) أو CSV!', 'warning');
      }
      return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        let rows = [];

        if (typeof XLSX !== 'undefined') {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        } else if (ext === '.csv') {
          const decoder = new TextDecoder('utf-8');
          const text = decoder.decode(e.target.result);
          rows = parseCsvToRows(text);
        } else {
          throw new Error('مكتبة قراءة ملفات الإكسل غير جاهزة حالياً');
        }

        extractStudentsFromRows(rows, fileName);
      } catch (err) {
        console.error('Error reading Excel file in student-behavior:', err);
        if (typeof window.showToast === 'function') {
          window.showToast(`تعذر قراءة ملف الإكسل: ${err.message || 'خطأ غير معروف'}`, 'error');
        }
      }
    };

    reader.readAsArrayBuffer(file);
  }

  function parseCsvToRows(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    return lines.map(line => {
      const row = [];
      let inQuotes = false;
      let token = '';
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"' || ch === "'") {
          inQuotes = !inQuotes;
        } else if ((ch === ',' || ch === '\t' || ch === ';') && !inQuotes) {
          row.push(token.trim());
          token = '';
        } else {
          token += ch;
        }
      }
      row.push(token.trim());
      return row;
    });
  }

  function extractStudentsFromRows(rows, fileName) {
    if (!Array.isArray(rows) || rows.length === 0) {
      if (typeof window.showToast === 'function') {
        window.showToast('ملف الإكسل فارغ ولا يحتوي على بيانات!', 'warning');
      }
      return;
    }

    // Identify header row and name column
    let headerRowIdx = -1;
    let nameCol = -1;
    let seatCol = -1;

    for (let r = 0; r < Math.min(15, rows.length); r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;

      for (let c = 0; c < row.length; c++) {
        const val = String(row[c] || '').trim().toLowerCase();
        if (
          (val.includes('اسم') || val.includes('طالب') || val.includes('تلميذ') || val.includes('student') || val.includes('name')) &&
          !val.includes('مدرسة') &&
          !val.includes('معلم') &&
          !val.includes('مدرس')
        ) {
          nameCol = c;
          headerRowIdx = r;
        }
      }
      if (nameCol !== -1) break;
    }

    if (headerRowIdx !== -1) {
      const hRow = rows[headerRowIdx];
      for (let c = 0; c < hRow.length; c++) {
        if (c === nameCol) continue;
        const val = String(hRow[c] || '').trim().toLowerCase();
        if (seatCol === -1 && (val.includes('قيد') || val.includes('رقم') || val === 'ت' || val.includes('تسلسل') || val.includes('id'))) {
          seatCol = c;
        }
      }
    } else {
      // No explicit header: scan columns for Arabic names (2+ words)
      let maxArabicCount = 0;
      for (let c = 0; c < 20; c++) {
        let arabicCount = 0;
        for (let r = 0; r < Math.min(30, rows.length); r++) {
          const val = String((rows[r] && rows[r][c]) || '').trim();
          if (/[\u0600-\u06FF]/.test(val) && val.split(/\s+/).length >= 2) {
            arabicCount++;
          }
        }
        if (arabicCount > maxArabicCount) {
          maxArabicCount = arabicCount;
          nameCol = c;
        }
      }
    }

    if (nameCol === -1) {
      if (typeof window.showToast === 'function') {
        window.showToast('لم نتمكن من العثور على عمود أسماء الطلاب في الملف!', 'warning');
      }
      return;
    }

    const startRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;
    const extracted = [];

    for (let r = startRow; r < rows.length; r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;

      let rawName = String(row[nameCol] || '').trim();
      rawName = rawName.replace(/^\d+[\.\-\)\s\t]+/, '').trim();

      if (!rawName || rawName.length < 2) continue;

      if (rawName.includes('اسم الطالب') || rawName.includes('الاسم الرباعي') || rawName.includes('المجموع') || rawName.includes('المعدل')) {
        continue;
      }

      const seat = seatCol !== -1 ? String(row[seatCol] || '').trim() : '';

      extracted.push({
        id: 'st_imp_' + Date.now() + '_' + Math.floor(Math.random() * 10000) + '_' + extracted.length,
        seat: seat || String(extracted.length + 1),
        name: rawName
      });
    }

    if (extracted.length === 0) {
      if (typeof window.showToast === 'function') {
        window.showToast('لم يتم العثور على أي أسماء صالحة في ملف الإكسل!', 'warning');
      }
      return;
    }

    // Check alphabetical sort option
    const sortCheck = document.getElementById('sbExcelAlphabeticalSortCheck');
    const shouldSort = sortCheck ? sortCheck.checked : true;

    if (shouldSort) {
      pendingExcelStudents = sortStudentsArabicAlphabetical(extracted);
      pendingExcelStudents.forEach((s, idx) => {
        s.seat = String(idx + 1);
      });
    } else {
      pendingExcelStudents = extracted;
    }

    renderExcelPreview(pendingExcelStudents, fileName);
  }

  function renderExcelPreview(studentsList, fileName) {
    const previewSection = document.getElementById('sbExcelPreviewSection');
    const tbody = document.getElementById('sbExcelPreviewTableBody');
    const countBadge = document.getElementById('sbExcelPreviewCountBadge');
    const statusLabel = document.getElementById('sbExcelPreviewStatusLabel');
    const confirmBtn = document.getElementById('sbBtnConfirmExcelImport');

    if (!previewSection || !tbody) return;

    previewSection.style.display = 'block';
    if (countBadge) countBadge.textContent = `${studentsList.length} طالب جاهز للاستيراد`;
    if (statusLabel) statusLabel.textContent = `تم التعرف على ملف: (${fileName}) وتنسيقه أبجدياً`;

    const previewSubset = studentsList.slice(0, 12);

    function esc(s) {
      if (!s) return '';
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    tbody.innerHTML = previewSubset
      .map((st, i) => `
        <tr>
          <td style="font-weight: 800; color: var(--text-dim); text-align: center;">${i + 1}</td>
          <td style="font-weight: 800; color: #0284c7;">${esc(st.name)}</td>
          <td style="color: var(--text-muted); text-align: center;">${esc(st.seat || (i + 1))}</td>
          <td style="color: #059669; font-weight: 700; text-align: center;"><i class="fa-solid fa-circle-check"></i> حاضر</td>
        </tr>
      `)
      .join('');

    if (studentsList.length > 12) {
      tbody.innerHTML += `
        <tr>
          <td colspan="4" style="text-align: center; color: var(--text-dim); padding: 8px; font-style: italic;">
            ... و باقي الطلاب (${studentsList.length - 12} طالب إضافي) مرتبين أبجدياً بالكامل
          </td>
        </tr>
      `;
    }

    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.style.opacity = '1';
      confirmBtn.innerHTML = `<i class="fa-solid fa-file-import"></i> تأكيد استيراد (${studentsList.length}) طالب لسجل السلوك 📥`;
    }
  }

  window.sbConfirmExcelImport = function () {
    if (!pendingExcelStudents || pendingExcelStudents.length === 0) return;

    const roster = getActiveRoster();
    if (!roster) return;

    const key = getRecordKey(activeDate, activeRosterId);
    if (!behaviorRecords[key]) ensureRecordForActiveDate();

    const modeRadio = document.querySelector('input[name="sbExcelImportMode"]:checked');
    const mode = modeRadio ? modeRadio.value : 'replace';

    const sortCheck = document.getElementById('sbExcelAlphabeticalSortCheck');
    const shouldSort = sortCheck ? sortCheck.checked : true;

    let finalStudents = [];

    if (mode === 'replace') {
      finalStudents = pendingExcelStudents.map((st, idx) => ({
        studentId: st.id || `std_${Date.now()}_${idx + 1}`,
        seat: idx + 1,
        name: st.name,
        attendance: 'present',
        participation: 'active',
        homework: 'done',
        conduct: 'excellent',
        score: 10,
        notes: ''
      }));

      // Update class roster students too
      roster.students = pendingExcelStudents.map((st, idx) => ({
        id: st.id || `std_${Date.now()}_${idx + 1}`,
        seat: idx + 1,
        name: st.name
      }));
    } else {
      // Append mode
      const existing = (behaviorRecords[key].students || []).slice();
      const existingNames = new Set(existing.map(s => (s.name || '').trim()));

      const toAdd = [];
      pendingExcelStudents.forEach((st, idx) => {
        if (!existingNames.has((st.name || '').trim())) {
          toAdd.push({
            studentId: st.id || `std_${Date.now()}_${idx + 1}`,
            seat: existing.length + toAdd.length + 1,
            name: st.name,
            attendance: 'present',
            participation: 'active',
            homework: 'done',
            conduct: 'excellent',
            score: 10,
            notes: ''
          });
        }
      });

      finalStudents = existing.concat(toAdd);

      if (shouldSort) {
        finalStudents = sortStudentsArabicAlphabetical(finalStudents);
        finalStudents.forEach((s, idx) => {
          s.seat = idx + 1;
        });
      }

      // Update class roster
      if (!Array.isArray(roster.students)) roster.students = [];
      const rosterNames = new Set(roster.students.map(s => (s.name || '').trim()));
      pendingExcelStudents.forEach((st, idx) => {
        if (!rosterNames.has((st.name || '').trim())) {
          roster.students.push({
            id: st.id || `std_${Date.now()}_${idx + 1}`,
            seat: roster.students.length + 1,
            name: st.name
          });
        }
      });
      if (shouldSort) {
        roster.students = sortStudentsArabicAlphabetical(roster.students);
        roster.students.forEach((s, idx) => {
          s.seat = idx + 1;
        });
      }
    }

    behaviorRecords[key].students = finalStudents;

    // Persist records & rosters
    saveBehaviorRecords(false);
    try {
      localStorage.setItem(getBehaviorRostersStorageKey(), JSON.stringify(rosters));
    } catch (e) {}

    window.sbCloseExcelImportModal();
    renderStats();
    renderTable();
    renderHeaderInfo();

    if (typeof window.showToast === 'function') {
      window.showToast(
        `تم استيراد وترتيب (${pendingExcelStudents.length}) طالب في سجل حسن السلوك بنجاح! 📥🎉`,
        'success'
      );
    }

    pendingExcelStudents = [];
  };

  window.reloadStudentBehaviorForCurrentUser = function (forceEmpty = false) {
    loadRosters(forceEmpty);
    loadBehaviorRecords(forceEmpty);
    ensureRecordForActiveDate();
    renderClassSelector();
    renderHeaderInfo();
    renderStats();
    renderTable();
  };

  // Export module globally
  window.StudentBehaviorModule = {
    init: initStudentBehaviorModule,
    reload: window.reloadStudentBehaviorForCurrentUser,
    save: saveBehaviorRecords,
    clearStudents: window.sbClearAllStudents,
    getActiveRecord: () => behaviorRecords[getRecordKey(activeDate, activeRosterId)],
    getRecords: () => behaviorRecords
  };
})();
