/**
 * مسار المعلم | سجل ورصد درجات وتقييم الطلاب الشامل
 * Teacher Path | Official Comprehensive Student Grades & Assessment Ledger
 * مصمم خصيصاً للمدارس العراقية والعربية وفق معايير الإشراف التربوي
 * يدعم رصد: شهر أول، شهر ثاني، نصف السنة، نهاية السنة، وحساب السعي والمعدل والتقديرات تلقائياً
 */

(function () {
  'use strict';

  function getRostersStorageKey() {
    if (typeof window !== 'undefined' && typeof window.getAccountStorageKey === 'function') {
      return window.getAccountStorageKey('masar_teacher_grades_rosters_v1');
    }
    const cur = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    const uid = cur ? (cur.id || cur.username || 'user') : 'guest';
    return `masar_teacher_grades_rosters_v1_${uid}`;
  }

  function getActiveIdStorageKey() {
    if (typeof window !== 'undefined' && typeof window.getAccountStorageKey === 'function') {
      return window.getAccountStorageKey('masar_teacher_grades_active_roster_id');
    }
    const cur = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    const uid = cur ? (cur.id || cur.username || 'user') : 'guest';
    return `masar_teacher_grades_active_roster_id_${uid}`;
  }

  function createEmptyRosterForCurrentUser() {
    const cur = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    const teacher = (cur && cur.name) ? cur.name : 'أستاذ المادة';
    const school = (cur && cur.school) ? cur.school : 'اسم المدرسة';
    const sub = (cur && cur.subject) ? cur.subject : 'الرياضيات';
    return {
      id: 'roster_' + Date.now(),
      name: 'الصف الثالث المتوسط - شعبة (أ)',
      schoolName: school,
      subject: sub,
      gradeLevel: 'الثالث المتوسط',
      section: 'أ',
      academicYear: '2024 - 2025',
      teacherName: teacher,
      maxScore: 100,
      passScore: 50,
      updatedAt: new Date().toISOString(),
      students: []
    };
  }

  // State
  let rosters = [];
  let activeRoster = null;
  let currentViewMode = 'full'; // 'full' | 'month1' | 'month2' | 'midYear' | 'month3' | 'month4' | 'final' | 'results'
  let searchQuery = '';
  let statusFilter = 'all'; // 'all' | 'passed' | 'failed' | 'top'
  let sortBy = 'seat'; // 'seat' | 'name' | 'finalDesc' | 'finalAsc'
  let autoSaveTimeout = null;

  /**
   * Safe Number Parser
   */
  function parseGrade(val) {
    if (val === '' || val === null || val === undefined) return null;
    const num = parseFloat(val);
    if (isNaN(num)) return null;
    return Math.max(0, Math.min(100, Math.round(num * 10) / 10));
  }

  /**
   * Calculate student results (Term averages, annual effort, final grade, status, appreciation)
   */
  function calculateStudentMetrics(st) {
    const m1 = parseGrade(st.m1);
    const m2 = parseGrade(st.m2);
    const act1 = parseGrade(st.act1);

    // Term 1 Average
    let term1Avg = null;
    const t1Components = [m1, m2].filter(v => v !== null);
    if (act1 !== null && t1Components.length > 0) {
      // If daily activity is provided: average of (m1+m2)/2 and act1, or average of all
      const examsAvg = t1Components.reduce((a, b) => a + b, 0) / t1Components.length;
      term1Avg = Math.round(((examsAvg + act1) / 2) * 10) / 10;
    } else if (t1Components.length > 0) {
      term1Avg = Math.round((t1Components.reduce((a, b) => a + b, 0) / t1Components.length) * 10) / 10;
    }

    // Mid Year
    const midYear = parseGrade(st.midYear);

    // Term 2
    const m3 = parseGrade(st.m3);
    const m4 = parseGrade(st.m4);
    const act2 = parseGrade(st.act2);

    let term2Avg = null;
    const t2Components = [m3, m4].filter(v => v !== null);
    if (act2 !== null && t2Components.length > 0) {
      const examsAvg = t2Components.reduce((a, b) => a + b, 0) / t2Components.length;
      term2Avg = Math.round(((examsAvg + act2) / 2) * 10) / 10;
    } else if (t2Components.length > 0) {
      term2Avg = Math.round((t2Components.reduce((a, b) => a + b, 0) / t2Components.length) * 10) / 10;
    }

    // Annual Effort (السعي السنوي): (سعي ف1 + نصف السنة + سعي ف2) / 3 or (سعي ف1 + سعي ف2) / 2
    let annualEffort = null;
    const effortParts = [];
    if (term1Avg !== null) effortParts.push(term1Avg);
    if (midYear !== null) effortParts.push(midYear);
    if (term2Avg !== null) effortParts.push(term2Avg);

    if (effortParts.length > 0) {
      annualEffort = Math.round((effortParts.reduce((a, b) => a + b, 0) / effortParts.length) * 10) / 10;
    }

    // Final Exam
    const finalExam = parseGrade(st.finalExam);

    // Final Grade (المعدل النهائي):
    // Ministerial rule in Iraq: If final exam exists: (السعي السنوي + امتحان نهاية السنة) / 2
    let finalGrade = null;
    if (finalExam !== null && annualEffort !== null) {
      finalGrade = Math.round(((annualEffort + finalExam) / 2) * 10) / 10;
    } else if (finalExam !== null) {
      finalGrade = finalExam;
    } else if (annualEffort !== null) {
      finalGrade = annualEffort;
    } else if (midYear !== null) {
      finalGrade = midYear;
    } else if (term1Avg !== null) {
      finalGrade = term1Avg;
    } else if (m1 !== null) {
      finalGrade = m1;
    }

    // Status (ناجح / مكمل / راسب)
    const passThreshold = activeRoster ? (activeRoster.passScore || 50) : 50;
    let status = 'قيد الرصد';
    let statusClass = 'status-pending';

    if (finalGrade !== null) {
      if (finalGrade >= passThreshold) {
        status = 'ناجح';
        statusClass = 'status-passed';
      } else if (finalExam !== null && finalGrade >= passThreshold - 10) {
        status = 'مكمل';
        statusClass = 'status-supplementary';
      } else {
        status = 'راسب';
        statusClass = 'status-failed';
      }
    }

    // Appreciation (التقدير - بدون دوائر وبنظام تظليل احترافي معتمد)
    let appreciation = '-';
    let appBadgeClass = '';
    if (finalGrade !== null) {
      if (finalGrade >= 90) {
        appreciation = 'ممتاز';
        appBadgeClass = 'badge-excellent';
      } else if (finalGrade >= 80) {
        appreciation = 'جيد جداً';
        appBadgeClass = 'badge-verygood';
      } else if (finalGrade >= 70) {
        appreciation = 'جيد';
        appBadgeClass = 'badge-good';
      } else if (finalGrade >= 60) {
        appreciation = 'متوسط';
        appBadgeClass = 'badge-medium';
      } else if (finalGrade >= passThreshold) {
        appreciation = 'مقبول';
        appBadgeClass = 'badge-acceptable';
      } else {
        appreciation = 'راسب';
        appBadgeClass = 'badge-failed';
      }
    }

    return {
      m1,
      m2,
      act1,
      term1Avg,
      midYear,
      m3,
      m4,
      act2,
      term2Avg,
      annualEffort,
      finalExam,
      finalGrade,
      status,
      statusClass,
      appreciation,
      appBadgeClass
    };
  }

  /**
   * Load rosters from localStorage (Isolated per teacher account)
   */
  function loadRosters(forceEmpty = false) {
    const rostersKey = getRostersStorageKey();
    const activeKey = getActiveIdStorageKey();
    const curUser = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    const isAdmin = !!(curUser && (curUser.isAdmin || curUser.role === 'admin' || (curUser.id && String(curUser.id).includes('admin'))));

    if (forceEmpty) {
      rosters = [createEmptyRosterForCurrentUser()];
      activeRoster = rosters[0];
      saveRosters(false);
      return;
    }

    try {
      let raw = localStorage.getItem(rostersKey);
      // Fallback only for Admin legacy data
      if (!raw && isAdmin) {
        raw = localStorage.getItem('masar_teacher_grades_rosters_v1');
      }
      if (raw) {
        rosters = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Error loading student grades rosters:', e);
    }

    if (!Array.isArray(rosters) || rosters.length === 0) {
      rosters = [createEmptyRosterForCurrentUser()];
      saveRosters(false);
    }

    let savedActiveId = localStorage.getItem(activeKey);
    if (!savedActiveId && isAdmin) {
      savedActiveId = localStorage.getItem('masar_teacher_grades_active_roster_id');
    }
    activeRoster = rosters.find(r => r.id === savedActiveId) || rosters[0];
  }

  /**
   * Save rosters to localStorage (Isolated per teacher account)
   */
  function saveRosters(triggerNotice = true) {
    try {
      if (activeRoster) {
        activeRoster.updatedAt = new Date().toISOString();
        const idx = rosters.findIndex(r => r.id === activeRoster.id);
        if (idx !== -1) {
          rosters[idx] = activeRoster;
        } else {
          rosters.push(activeRoster);
        }
      }

      localStorage.setItem(getRostersStorageKey(), JSON.stringify(rosters));
      if (activeRoster) {
        localStorage.setItem(getActiveIdStorageKey(), activeRoster.id);
      }

      if (typeof window.scheduleCloudAutoSync === 'function') {
        window.scheduleCloudAutoSync();
      }

      updateSaveStatusBadge('saved');

      if (triggerNotice && typeof window.showToast === 'function') {
        window.showToast('تم حفظ سجل الدرجات بنجاح 💾✅', 'success');
      }
    } catch (e) {
      console.error('Failed to save student grades:', e);
      if (triggerNotice && typeof window.showToast === 'function') {
        window.showToast('خطأ أثناء حفظ السجل في المتصفح!', 'error');
      }
    }
  }

  /**
   * Visual Save Status Indicator
   */
  function updateSaveStatusBadge(status) {
    const badge = document.getElementById('sgSaveStatusBadge');
    if (!badge) return;

    if (status === 'saving') {
      badge.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';
      badge.className = 'sg-status-badge sg-status-saving';
    } else if (status === 'dirty') {
      badge.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> تعديلات غير محفوظة';
      badge.className = 'sg-status-badge sg-status-dirty';
    } else {
      const timeStr = new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
      badge.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> محفوظ تلقائياً (${timeStr})`;
      badge.className = 'sg-status-badge sg-status-saved';
    }
  }

  /**
   * Trigger debounced auto-save
   */
  function triggerAutoSave() {
    updateSaveStatusBadge('dirty');
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      saveRosters(false);
      renderStats();
    }, 600);
  }

  /**
   * Switch Active Roster
   */
  window.sgSelectRoster = function (rosterId) {
    const found = rosters.find(r => r.id === rosterId);
    if (!found) return;
    activeRoster = found;
    localStorage.setItem(getActiveIdStorageKey(), activeRoster.id);
    renderRosterMetaForm();
    renderTable();
    renderStats();
    renderRosterSelector();
    if (typeof window.showToast === 'function') {
      window.showToast(`تم فتح سجل: ${activeRoster.name} 📂`, 'info');
    }
  };

  /**
   * Render Class Metadata Inputs
   */
  function renderRosterMetaForm() {
    if (!activeRoster) return;
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    setVal('sgMetaSchool', activeRoster.schoolName);
    setVal('sgMetaSubject', activeRoster.subject);
    setVal('sgMetaGrade', activeRoster.gradeLevel);
    setVal('sgMetaSection', activeRoster.section);
    setVal('sgMetaYear', activeRoster.academicYear);
    setVal('sgMetaTeacher', activeRoster.teacherName);
    setVal('sgMetaPassScore', activeRoster.passScore || 50);
    setVal('sgMetaMaxScore', activeRoster.maxScore || 100);

    const titleEl = document.getElementById('sgActiveRosterHeadingTitle');
    if (titleEl) {
      titleEl.textContent = activeRoster.name || 'سجل درجات الطلاب';
    }
  }

  /**
   * Sync Metadata Inputs
   */
  window.sgSyncMeta = function () {
    if (!activeRoster) return;
    const getVal = id => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };

    activeRoster.schoolName = getVal('sgMetaSchool');
    activeRoster.subject = getVal('sgMetaSubject');
    activeRoster.gradeLevel = getVal('sgMetaGrade');
    activeRoster.section = getVal('sgMetaSection');
    activeRoster.academicYear = getVal('sgMetaYear');
    activeRoster.teacherName = getVal('sgMetaTeacher');
    activeRoster.passScore = parseInt(getVal('sgMetaPassScore'), 10) || 50;
    activeRoster.maxScore = parseInt(getVal('sgMetaMaxScore'), 10) || 100;

    // Auto-update roster display name if standard
    if (activeRoster.gradeLevel && activeRoster.section) {
      activeRoster.name = `${activeRoster.gradeLevel} - شعبة (${activeRoster.section})`;
      const titleEl = document.getElementById('sgActiveRosterHeadingTitle');
      if (titleEl) titleEl.textContent = activeRoster.name;
    }

    triggerAutoSave();
    renderRosterSelector();
  };

  /**
   * Render Roster Selector in Header
   */
  function renderRosterSelector() {
    const sel = document.getElementById('sgRosterSelectDropdown');
    if (!sel) return;
    sel.innerHTML = rosters
      .map(
        r =>
          `<option value="${r.id}" ${activeRoster && activeRoster.id === r.id ? 'selected' : ''}>
          ${r.name || 'سجل بدون اسم'} (${(r.students || []).length} طالب)
        </option>`
      )
      .join('');
  }

  /**
   * Set View Mode (Filter visible columns)
   */
  window.sgSetViewMode = function (mode) {
    currentViewMode = mode;
    document.querySelectorAll('.sg-view-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
    });
    renderTable();
  };

  /**
   * Set Search Query
   */
  window.sgOnSearchInput = function (val) {
    searchQuery = (val || '').trim().toLowerCase();
    renderTable();
  };

  /**
   * Set Status Filter
   */
  window.sgSetStatusFilter = function (filter) {
    statusFilter = filter;
    document.querySelectorAll('.sg-filter-pill').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
    });
    renderTable();
  };

  /**
   * Set Sort Option
   */
  window.sgSetSortBy = function (val) {
    sortBy = val;
    renderTable();
  };

  /**
   * Live Table Rendering
   */
  function renderTable() {
    const tbody = document.getElementById('sgGradesTableBody');
    if (!tbody || !activeRoster) return;

    let students = (activeRoster.students || []).map((s, idx) => {
      const metrics = calculateStudentMetrics(s);
      return { ...s, originalIndex: idx, metrics };
    });

    // Apply Search
    if (searchQuery) {
      students = students.filter(
        s =>
          (s.name && s.name.toLowerCase().includes(searchQuery)) ||
          (s.seatNumber && s.seatNumber.includes(searchQuery)) ||
          (s.notes && s.notes.toLowerCase().includes(searchQuery))
      );
    }

    // Apply Status Filter
    if (statusFilter === 'passed') {
      students = students.filter(s => s.metrics.status === 'ناجح');
    } else if (statusFilter === 'failed') {
      students = students.filter(s => s.metrics.status === 'راسب' || s.metrics.status === 'مكمل');
    } else if (statusFilter === 'top') {
      students = students.filter(s => s.metrics.finalGrade !== null && s.metrics.finalGrade >= 85);
    } else if (statusFilter === 'incomplete') {
      students = students.filter(s => s.metrics.finalExam === null || s.metrics.m1 === null);
    }

    // Apply Sort
    if (sortBy === 'name') {
      students.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));
    } else if (sortBy === 'finalDesc') {
      students.sort((a, b) => (b.metrics.finalGrade || 0) - (a.metrics.finalGrade || 0));
    } else if (sortBy === 'finalAsc') {
      students.sort((a, b) => (a.metrics.finalGrade || 0) - (b.metrics.finalGrade || 0));
    } else {
      // Sort by seat number / sequence
      students.sort((a, b) => (parseInt(a.seatNumber, 10) || a.originalIndex) - (parseInt(b.seatNumber, 10) || b.originalIndex));
    }

    const visibleCountEl = document.getElementById('sgVisibleCountLabel');
    if (visibleCountEl) {
      visibleCountEl.textContent = `${students.length} من أصل ${(activeRoster.students || []).length} طالب`;
    }

    if (students.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="16" class="sg-empty-table-cell">
            <div style="padding: 2.5rem 1rem; text-align: center; color: var(--text-muted);">
              <i class="fa-solid fa-users-slash" style="font-size: 2.4rem; color: #94a3b8; margin-bottom: 0.75rem;"></i>
              <div style="font-weight: 800; font-size: 1.05rem; color: var(--text-main); margin-bottom: 0.35rem;">لا يوجد طلاب يطابقون خيارات البحث أو التصفية</div>
              <div style="font-size: 0.82rem;">يمكنك إضافة طالب جديد أو استيراد قائمة الأسماء دفعة واحدة عبر الأزرار بالأعلى</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    // Helper for input cell
    const renderGradeInput = (st, field, val, colKey) => {
      const isVisible = isColumnVisible(colKey);
      if (!isVisible) return '';
      const displayVal = val !== null && val !== undefined ? val : '';
      const numVal = parseGrade(val);
      let colorClass = '';
      if (numVal !== null) {
        if (numVal >= 90) colorClass = 'grade-excellent';
        else if (numVal >= (activeRoster.passScore || 50)) colorClass = 'grade-pass';
        else colorClass = 'grade-fail';
      }

      return `
        <td class="sg-cell-grade col-${colKey}">
          <input type="number" 
                 class="sg-grade-input ${colorClass}" 
                 data-student-id="${st.id}" 
                 data-field="${field}" 
                 data-col="${colKey}"
                 value="${displayVal}" 
                 min="0" 
                 max="${activeRoster.maxScore || 100}" 
                 step="0.5" 
                 placeholder="-"
                 onfocus="this.select()"
                 oninput="window.sgOnGradeInput(this)" 
                 onkeydown="window.sgOnGradeKeydown(event, this)">
        </td>
      `;
    };

    const isColumnVisible = colKey => {
      if (currentViewMode === 'full') return true;
      if (currentViewMode === 'month1') return colKey === 'm1' || colKey === 'term1Avg' || colKey === 'finalGrade';
      if (currentViewMode === 'month2') return colKey === 'm2' || colKey === 'term1Avg' || colKey === 'finalGrade';
      if (currentViewMode === 'midYear') return colKey === 'term1Avg' || colKey === 'midYear' || colKey === 'finalGrade';
      if (currentViewMode === 'month3') return colKey === 'm3' || colKey === 'term2Avg' || colKey === 'finalGrade';
      if (currentViewMode === 'month4') return colKey === 'm4' || colKey === 'term2Avg' || colKey === 'finalGrade';
      if (currentViewMode === 'final') return colKey === 'annualEffort' || colKey === 'finalExam' || colKey === 'finalGrade';
      if (currentViewMode === 'results') return colKey === 'term1Avg' || colKey === 'midYear' || colKey === 'term2Avg' || colKey === 'annualEffort' || colKey === 'finalExam' || colKey === 'finalGrade';
      return true;
    };

    tbody.innerHTML = students
      .map((st, i) => {
        const m = st.metrics;
        return `
        <tr data-student-id="${st.id}" class="${m.statusClass}">
          <!-- Sequence Number -->
          <td class="sg-cell-seq">
            <span class="sg-seq-badge">${i + 1}</span>
          </td>

          <!-- Student Name (Editable inline) -->
          <td class="sg-cell-name">
            <div class="sg-name-wrapper">
              <input type="text" 
                     class="sg-name-input" 
                     value="${escapeHtml(st.name || '')}" 
                     placeholder="اسم الطالب الثلاثي..."
                     data-student-id="${st.id}"
                     data-field="name"
                     onchange="window.sgOnStudentMetaChange(this)"
                     title="اضغط للتعديل المباشر">
            </div>
          </td>

          <!-- Student Seat / ID -->
          <td class="sg-cell-seat">
            <input type="text" 
                   class="sg-seat-input" 
                   value="${escapeHtml(st.seatNumber || (i + 1))}" 
                   placeholder="${i + 1}"
                   data-student-id="${st.id}"
                   data-field="seatNumber"
                   onchange="window.sgOnStudentMetaChange(this)">
          </td>

          <!-- Term 1: Month 1 -->
          ${renderGradeInput(st, 'm1', st.m1, 'm1')}

          <!-- Term 1: Month 2 -->
          ${renderGradeInput(st, 'm2', st.m2, 'm2')}

          <!-- Term 1: Daily Activity (optional) -->
          ${isColumnVisible('act1') ? renderGradeInput(st, 'act1', st.act1, 'act1') : ''}

          <!-- Term 1 Average -->
          ${
            isColumnVisible('term1Avg')
              ? `<td class="sg-cell-calc col-term1Avg" title="معدل الفصل الأول">${m.term1Avg !== null ? m.term1Avg : '-'}</td>`
              : ''
          }

          <!-- Mid Year Exam -->
          ${renderGradeInput(st, 'midYear', st.midYear, 'midYear')}

          <!-- Term 2: Month 1 (m3) -->
          ${renderGradeInput(st, 'm3', st.m3, 'm3')}

          <!-- Term 2: Month 2 (m4) -->
          ${renderGradeInput(st, 'm4', st.m4, 'm4')}

          <!-- Term 2: Daily Activity (optional) -->
          ${isColumnVisible('act2') ? renderGradeInput(st, 'act2', st.act2, 'act2') : ''}

          <!-- Term 2 Average -->
          ${
            isColumnVisible('term2Avg')
              ? `<td class="sg-cell-calc col-term2Avg" title="معدل الفصل الثاني">${m.term2Avg !== null ? m.term2Avg : '-'}</td>`
              : ''
          }

          <!-- Annual Effort (السعي السنوي) -->
          ${
            isColumnVisible('annualEffort')
              ? `<td class="sg-cell-calc sg-cell-highlight col-annualEffort" title="السعي السنوي">${m.annualEffort !== null ? m.annualEffort : '-'}</td>`
              : ''
          }

          <!-- Final Exam (نهاية السنة) -->
          ${renderGradeInput(st, 'finalExam', st.finalExam, 'finalExam')}

          <!-- Final Grade (المعدل النهائي العام) -->
          ${
            isColumnVisible('finalGrade')
              ? `<td class="sg-cell-calc sg-cell-final col-finalGrade">
                  <span class="sg-final-grade-badge ${m.finalGrade !== null && m.finalGrade >= (activeRoster.passScore || 50) ? 'is-pass' : 'is-fail'}">
                    ${m.finalGrade !== null ? m.finalGrade : '-'}
                  </span>
                </td>`
              : ''
          }

          <!-- Status & Appreciation -->
          <td class="sg-cell-status">
            <span class="sg-status-pill ${m.statusClass}">${m.status}</span>
            <span class="sg-appr-pill ${m.appBadgeClass}">${m.appreciation}</span>
          </td>

          <!-- Actions -->
          <td class="sg-cell-actions">
            <button type="button" class="sg-action-btn sg-btn-delete" onclick="window.sgDeleteStudent('${st.id}')" title="حذف هذا الطالب من السجل">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        </tr>
      `;
      })
      .join('');

    updateTableHeaderVisibility();
  }

  /**
   * Update Table Header Th Visibility based on currentViewMode
   */
  function updateTableHeaderVisibility() {
    const table = document.getElementById('sgGradesMasterTable');
    if (!table) return;

    table.classList.remove(
      'view-mode-full',
      'view-mode-month1',
      'view-mode-month2',
      'view-mode-midYear',
      'view-mode-month3',
      'view-mode-month4',
      'view-mode-final',
      'view-mode-results'
    );
    table.classList.add(`view-mode-${currentViewMode}`);
  }

  /**
   * Fast Grade Input Change Handler
   */
  window.sgOnGradeInput = function (input) {
    const studentId = input.getAttribute('data-student-id');
    const field = input.getAttribute('data-field');
    if (!studentId || !field || !activeRoster) return;

    let val = input.value.trim();
    if (val !== '') {
      let num = parseFloat(val);
      if (isNaN(num)) {
        input.value = '';
        val = '';
      } else {
        const max = activeRoster.maxScore || 100;
        if (num > max) {
          num = max;
          input.value = max;
        } else if (num < 0) {
          num = 0;
          input.value = 0;
        }
      }
    }

    const st = (activeRoster.students || []).find(s => s.id === studentId);
    if (!st) return;

    st[field] = val === '' ? null : parseFloat(val);

    // Update row calculated cells immediately for ultra responsiveness without full DOM rebuild
    updateRowVisuals(studentId);

    // Debounced auto-save & stats update
    triggerAutoSave();
  };

  /**
   * Real-time Single Row Visuals Update (No lag / No flickering)
   */
  function updateRowVisuals(studentId) {
    const row = document.querySelector(`tr[data-student-id="${studentId}"]`);
    if (!row || !activeRoster) return;

    const st = (activeRoster.students || []).find(s => s.id === studentId);
    if (!st) return;

    const m = calculateStudentMetrics(st);

    // Update calculated cells
    const t1Cell = row.querySelector('.col-term1Avg');
    if (t1Cell) t1Cell.textContent = m.term1Avg !== null ? m.term1Avg : '-';

    const t2Cell = row.querySelector('.col-term2Avg');
    if (t2Cell) t2Cell.textContent = m.term2Avg !== null ? m.term2Avg : '-';

    const effortCell = row.querySelector('.col-annualEffort');
    if (effortCell) effortCell.textContent = m.annualEffort !== null ? m.annualEffort : '-';

    const finalCell = row.querySelector('.col-finalGrade .sg-final-grade-badge');
    if (finalCell) {
      finalCell.textContent = m.finalGrade !== null ? m.finalGrade : '-';
      finalCell.className = `sg-final-grade-badge ${m.finalGrade !== null && m.finalGrade >= (activeRoster.passScore || 50) ? 'is-pass' : 'is-fail'}`;
    }

    // Update status & appreciation pills
    const statusPill = row.querySelector('.sg-status-pill');
    if (statusPill) {
      statusPill.textContent = m.status;
      statusPill.className = `sg-status-pill ${m.statusClass}`;
    }

    const apprPill = row.querySelector('.sg-appr-pill');
    if (apprPill) {
      apprPill.textContent = m.appreciation;
      apprPill.className = `sg-appr-pill ${m.appBadgeClass}`;
    }

    // Color inputs in this row
    row.querySelectorAll('.sg-grade-input').forEach(inp => {
      const v = parseGrade(inp.value);
      inp.classList.remove('grade-excellent', 'grade-pass', 'grade-fail');
      if (v !== null) {
        if (v >= 90) inp.classList.add('grade-excellent');
        else if (v >= (activeRoster.passScore || 50)) inp.classList.add('grade-pass');
        else inp.classList.add('grade-fail');
      }
    });

    row.className = m.statusClass;
  }

  /**
   * Keyboard Navigation (Excel-like flow: Up/Down arrow moves to same exam column for next/prev student; Enter moves down)
   */
  window.sgOnGradeKeydown = function (e, input) {
    const key = e.key;
    const colKey = input.getAttribute('data-col');

    if (key === 'ArrowDown' || key === 'Enter') {
      e.preventDefault();
      const currentRow = input.closest('tr');
      const nextRow = currentRow ? currentRow.nextElementSibling : null;
      if (nextRow) {
        const nextInput = nextRow.querySelector(`input[data-col="${colKey}"]`);
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      }
    } else if (key === 'ArrowUp') {
      e.preventDefault();
      const currentRow = input.closest('tr');
      const prevRow = currentRow ? currentRow.previousElementSibling : null;
      if (prevRow) {
        const prevInput = prevRow.querySelector(`input[data-col="${colKey}"]`);
        if (prevInput) {
          prevInput.focus();
          prevInput.select();
        }
      }
    }
  };

  /**
   * Student Meta (Name, Seat) Change
   */
  window.sgOnStudentMetaChange = function (input) {
    const studentId = input.getAttribute('data-student-id');
    const field = input.getAttribute('data-field');
    if (!studentId || !field || !activeRoster) return;

    const st = (activeRoster.students || []).find(s => s.id === studentId);
    if (!st) return;

    st[field] = input.value.trim();
    triggerAutoSave();
  };

  /**
   * Add Single Student
   */
  window.sgAddSingleStudent = function () {
    if (!activeRoster) return;
    if (!Array.isArray(activeRoster.students)) activeRoster.students = [];

    const newId = 'st_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const nextSeat = activeRoster.students.length + 1;

    activeRoster.students.push({
      id: newId,
      seatNumber: String(nextSeat),
      name: '',
      m1: null,
      m2: null,
      act1: null,
      midYear: null,
      m3: null,
      m4: null,
      act2: null,
      finalExam: null,
      notes: ''
    });

    renderTable();
    renderStats();
    triggerAutoSave();

    // Focus newly added student name
    setTimeout(() => {
      const row = document.querySelector(`tr[data-student-id="${newId}"]`);
      if (row) {
        const nameInp = row.querySelector('.sg-name-input');
        if (nameInp) {
          nameInp.focus();
          nameInp.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 100);

    if (typeof window.showToast === 'function') {
      window.showToast('تمت إضافة سطر طالب جديد ✍️', 'info');
    }
  };

  /**
   * Delete Student
   */
  window.sgDeleteStudent = function (studentId) {
    if (!activeRoster) return;
    const st = (activeRoster.students || []).find(s => s.id === studentId);
    const stName = st ? st.name || 'هذا الطالب' : 'هذا الطالب';

    if (!confirm(`هل أنت متأكد من حذف (${stName}) من السجل؟`)) {
      return;
    }

    activeRoster.students = activeRoster.students.filter(s => s.id !== studentId);
    renderTable();
    renderStats();
    triggerAutoSave();

    if (typeof window.showToast === 'function') {
      window.showToast(`تم حذف (${stName}) من السجل 🗑️`, 'info');
    }
  };

  /**
   * Open Batch Paste Students Modal
   */
  window.sgOpenBatchPasteModal = function () {
    const modal = document.getElementById('sgBatchPasteModal');
    if (modal) {
      modal.classList.add('open');
      const textarea = document.getElementById('sgBatchPasteTextarea');
      if (textarea) {
        textarea.value = '';
        setTimeout(() => textarea.focus(), 150);
      }
    }
  };

  /**
   * Close Batch Paste Students Modal
   */
  window.sgCloseBatchPasteModal = function () {
    const modal = document.getElementById('sgBatchPasteModal');
    if (modal) modal.classList.remove('open');
  };

  /**
   * Process Batch Paste Students
   */
  window.sgProcessBatchPaste = function () {
    const textarea = document.getElementById('sgBatchPasteTextarea');
    if (!textarea || !activeRoster) return;

    const text = textarea.value.trim();
    if (!text) {
      if (typeof window.showToast === 'function') {
        window.showToast('يرجى لصق قائمة الأسماء أولاً!', 'warning');
      }
      return;
    }

    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    if (!Array.isArray(activeRoster.students)) activeRoster.students = [];

    let startSeat = activeRoster.students.length + 1;
    let addedCount = 0;

    lines.forEach(line => {
      // Clean leading numbers like "1-", "1.", "1) ", or tabs
      let cleanName = line.replace(/^\d+[\.\-\)\s\t]+/, '').trim();
      if (!cleanName) return;

      activeRoster.students.push({
        id: 'st_' + Date.now() + '_' + Math.floor(Math.random() * 10000) + '_' + addedCount,
        seatNumber: String(startSeat + addedCount),
        name: cleanName,
        m1: null,
        m2: null,
        act1: null,
        midYear: null,
        m3: null,
        m4: null,
        act2: null,
        finalExam: null,
        notes: ''
      });
      addedCount++;
    });

    window.sgCloseBatchPasteModal();
    renderTable();
    renderStats();
    triggerAutoSave();

    if (typeof window.showToast === 'function') {
      window.showToast(`تمت إضافة (${addedCount}) طالب إلى السجل بنجاح 📋🎉`, 'success');
    }
  };

  /**
   * Helper for Circular Meter Animation in Student Grades Dashboard
   */
  function updateSgCircularMeter(id, val, targetMax = 20, suffix = '') {
    const el = document.getElementById(id);
    if (!el) return;
    const num = parseFloat(val) || 0;
    el.textContent = suffix ? `${Math.round(num)}${suffix}` : (num % 1 === 0 ? num : num.toFixed(1));

    const card = el.closest('.daily-metric-card');
    if (!card) return;
    const meterFill = card.querySelector('.meter-fill');
    if (!meterFill) return;

    const circumference = 188.5; // 2 * Math.PI * 30
    let ratio = 0;
    if (num > 0) {
      const maxVal = Math.max(targetMax, num);
      ratio = Math.min(Math.max(num / maxVal, 0.15), 0.98);
    } else {
      ratio = 0.04;
    }
    const offset = circumference * (1 - ratio);
    meterFill.style.strokeDashoffset = offset.toFixed(1);
  }

  /**
   * Live Statistics Calculation
   */
  function renderStats() {
    if (!activeRoster) return;
    const students = activeRoster.students || [];
    const totalCount = students.length;

    let passedCount = 0;
    let failedCount = 0;
    let excellentCount = 0;
    let validGrades = [];

    students.forEach(s => {
      const m = calculateStudentMetrics(s);
      if (m.finalGrade !== null) {
        validGrades.push(m.finalGrade);
        if (m.status === 'ناجح') passedCount++;
        else if (m.status === 'راسب' || m.status === 'مكمل') failedCount++;
        if (m.finalGrade >= 85) excellentCount++;
      }
    });

    const evaluatedCount = validGrades.length;
    const passRate = evaluatedCount > 0 ? Math.round((passedCount / evaluatedCount) * 100) : 0;
    const avgScore = evaluatedCount > 0 ? Math.round((validGrades.reduce((a, b) => a + b, 0) / evaluatedCount) * 10) / 10 : 0;
    const maxScore = evaluatedCount > 0 ? Math.max(...validGrades) : 0;
    const minScore = evaluatedCount > 0 ? Math.min(...validGrades) : 0;

    // Update Circular Meters
    updateSgCircularMeter('sgStatTotalStudents', totalCount, 30);
    updateSgCircularMeter('sgStatPassRate', passRate, 100, '%');
    updateSgCircularMeter('sgStatPassedCount', passedCount, Math.max(totalCount, 1));
    updateSgCircularMeter('sgStatFailedCount', failedCount, Math.max(totalCount, 1));
    updateSgCircularMeter('sgStatExcellentCount', excellentCount, Math.max(totalCount, 1));
    updateSgCircularMeter('sgStatAverageScore', avgScore, 100);

    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setText('sgStatMaxScore', maxScore);
    setText('sgStatMinScore', minScore);
  }

  /**
   * Reset / Clear Ledger
   */
  window.sgClearAllStudents = function (force = false) {
    if (!activeRoster) return;
    if (!force && (activeRoster.students || []).length > 0) {
      if (!confirm('هل أنت متأكد من تفريغ ومسح كافة أسماء وبيانات الطلاب (' + activeRoster.students.length + ' طالب) والدرجات المفتوحة من هذا السجل؟\nسيصبح السجل فارغاً تماماً وجاهزاً لتجربة استيراد ملف Excel جديد.')) {
        return;
      }
    }

    activeRoster.students = [];
    saveRosters(false);
    renderTable();
    renderStats();
    renderRosterSelector();

    if (typeof window.showToast === 'function') {
      window.showToast('تم تفريغ سجل الطلاب والدرجات المفتوحة بنجاح 🗑️✨', 'info');
    }
  };
  window.sgClearAllOpenData = window.sgClearAllStudents;

  window.sgClearAllGrades = function () {
    if (!activeRoster) return;
    if (!confirm('هل تريد مسح جميع الدرجات المرصودة في هذا الصف والبدء برصد جديد؟ (ستبقى أسماء الطلاب كما هي)')) {
      return;
    }

    (activeRoster.students || []).forEach(s => {
      s.m1 = null;
      s.m2 = null;
      s.act1 = null;
      s.midYear = null;
      s.m3 = null;
      s.m4 = null;
      s.act2 = null;
      s.finalExam = null;
    });

    renderTable();
    renderStats();
    triggerAutoSave();

    if (typeof window.showToast === 'function') {
      window.showToast('تم تصفير درجات الصف بنجاح 🧹', 'info');
    }
  };

  /**
   * Delete Entire Class Roster
   */
  window.sgDeleteActiveRoster = function () {
    if (!activeRoster) return;
    if (rosters.length <= 1) {
      if (typeof window.showToast === 'function') {
        window.showToast('لا يمكن حذف السجل الوحيد المتبقي! يمكنك تفريغ الأسماء والدرجات بدلاً من ذلك.', 'warning');
      }
      return;
    }

    if (!confirm(`هل أنت متأكد تماماً من حذف سجل (${activeRoster.name}) نهائياً بجميع طلابه ودرجاته؟`)) {
      return;
    }

    rosters = rosters.filter(r => r.id !== activeRoster.id);
    activeRoster = rosters[0];
    localStorage.setItem(getActiveIdStorageKey(), activeRoster.id);

    saveRosters(false);
    renderRosterMetaForm();
    renderRosterSelector();
    renderTable();
    renderStats();

    if (typeof window.showToast === 'function') {
      window.showToast('تم حذف السجل بنجاح 🗑️', 'info');
    }
  };

  /**
   * Create New Class Roster
   */
  window.sgOpenCreateRosterModal = function () {
    const modal = document.getElementById('sgCreateRosterModal');
    if (modal) {
      modal.classList.add('open');
      const input = document.getElementById('sgNewRosterNameInput');
      if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 150);
      }
    }
  };

  window.sgCloseCreateRosterModal = function () {
    const modal = document.getElementById('sgCreateRosterModal');
    if (modal) modal.classList.remove('open');
  };

  window.sgSubmitCreateRoster = function () {
    const nameInp = document.getElementById('sgNewRosterNameInput');
    const subjInp = document.getElementById('sgNewRosterSubjectInput');
    const gradeInp = document.getElementById('sgNewRosterGradeInput');
    const secInp = document.getElementById('sgNewRosterSectionInput');

    const name = nameInp ? nameInp.value.trim() : '';
    const subject = subjInp ? subjInp.value.trim() : (activeRoster ? activeRoster.subject : 'الرياضيات');
    const grade = gradeInp ? gradeInp.value.trim() : (activeRoster ? activeRoster.gradeLevel : 'الثالث المتوسط');
    const section = secInp ? secInp.value.trim() : 'أ';

    if (!name && (!grade || !section)) {
      if (typeof window.showToast === 'function') {
        window.showToast('يرجى كتابة اسم الصف أو الشعبة أولاً!', 'warning');
      }
      return;
    }

    const finalName = name || `${grade} - شعبة (${section})`;
    const newId = 'roster_' + Date.now();

    const newRoster = {
      id: newId,
      name: finalName,
      schoolName: activeRoster ? activeRoster.schoolName : 'اسم المدرسة',
      subject: subject,
      gradeLevel: grade,
      section: section,
      academicYear: activeRoster ? activeRoster.academicYear : '2024 - 2025',
      teacherName: activeRoster ? activeRoster.teacherName : 'أستاذ المادة',
      maxScore: 100,
      passScore: 50,
      updatedAt: new Date().toISOString(),
      students: []
    };

    rosters.push(newRoster);
    activeRoster = newRoster;
    localStorage.setItem(getActiveIdStorageKey(), activeRoster.id);

    saveRosters(false);
    window.sgCloseCreateRosterModal();

    renderRosterMetaForm();
    renderRosterSelector();
    renderTable();
    renderStats();

    if (typeof window.showToast === 'function') {
      window.showToast(`تم إنشاء سجل جديد: ${finalName} ✨`, 'success');
    }
  };

  /**
   * Export to CSV (Arabic Excel Compatible with UTF-8 BOM)
   */
  window.sgExportCsv = function () {
    if (!activeRoster) return;
    const students = activeRoster.students || [];
    if (students.length === 0) {
      if (typeof window.showToast === 'function') {
        window.showToast('السجل فارغ! لا يوجد طلاب للتصدير', 'warning');
      }
      return;
    }

    const headers = [
      'ت',
      'اسم الطالب',
      'رقم القيد',
      'شهر 1 (ف1)',
      'شهر 2 (ف1)',
      'نشاط (ف1)',
      'معدل ف1',
      'نصف السنة',
      'شهر 1 (ف2)',
      'شهر 2 (ف2)',
      'نشاط (ف2)',
      'معدل ف2',
      'السعي السنوي',
      'نهاية السنة',
      'المعدل النهائي',
      'الحالة',
      'التقدير',
      'ملاحظات'
    ];

    const rows = students.map((s, idx) => {
      const m = calculateStudentMetrics(s);
      return [
        idx + 1,
        `"${(s.name || '').replace(/"/g, '""')}"`,
        `"${s.seatNumber || (idx + 1)}"`,
        m.m1 !== null ? m.m1 : '',
        m.m2 !== null ? m.m2 : '',
        m.act1 !== null ? m.act1 : '',
        m.term1Avg !== null ? m.term1Avg : '',
        m.midYear !== null ? m.midYear : '',
        m.m3 !== null ? m.m3 : '',
        m.m4 !== null ? m.m4 : '',
        m.act2 !== null ? m.act2 : '',
        m.term2Avg !== null ? m.term2Avg : '',
        m.annualEffort !== null ? m.annualEffort : '',
        m.finalExam !== null ? m.finalExam : '',
        m.finalGrade !== null ? m.finalGrade : '',
        `"${m.status}"`,
        `"${m.appreciation}"`,
        `"${(s.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `سجل_درجات_${(activeRoster.name || 'الطلاب').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (typeof window.showToast === 'function') {
      window.showToast('تم تصدير ملف الإكسل (CSV) بنجاح 📥✨', 'success');
    }
  };

  /**
   * Official Ministerial Print Suite (طباعة سجل الدرجات الرسمي A4)
   */
  window.sgPrintOfficialLedger = function (targetPeriod = 'full') {
    if (!activeRoster) return;
    const students = activeRoster.students || [];
    if (students.length === 0) {
      if (typeof window.showToast === 'function') {
        window.showToast('لا توجد بيانات طلاب للطباعة!', 'warning');
      }
      return;
    }

    const isLandscape = targetPeriod === 'full' || targetPeriod === 'results';
    let periodTitle = 'سجل درجات وتقييم الطلاب الشامل لجميع الفصول والامتحانات';
    if (targetPeriod === 'month1') periodTitle = 'كشف درجات امتحان الشهر الأول (الفصل الأول)';
    if (targetPeriod === 'month2') periodTitle = 'كشف درجات امتحان الشهر الثاني (الفصل الأول)';
    if (targetPeriod === 'midYear') periodTitle = 'كشف درجات امتحان نصف السنة الرسمي';
    if (targetPeriod === 'final') periodTitle = 'كشف درجات امتحان نهاية السنة (الدور الأول) والنتيجة العامة';

    // Calculate Summary Stats
    let passCount = 0;
    let failCount = 0;
    let suppCount = 0;
    let totalAssessed = 0;
    let scoresList = [];

    students.forEach(s => {
      const m = calculateStudentMetrics(s);
      let targetGrade = m.finalGrade;
      if (targetPeriod === 'month1') targetGrade = m.m1;
      else if (targetPeriod === 'month2') targetGrade = m.m2;
      else if (targetPeriod === 'midYear') targetGrade = m.midYear;

      if (targetGrade !== null) {
        totalAssessed++;
        scoresList.push(targetGrade);
        if (targetGrade >= 50) passCount++;
        else failCount++;
      }
      if (targetPeriod === 'full' && m.finalGrade !== null) {
        if (m.status === 'مكمل') {
          suppCount++;
          failCount = Math.max(0, failCount - 1);
        }
      }
    });

    const passRate = totalAssessed > 0 ? Math.round((passCount / totalAssessed) * 100) : 0;
    const maxScore = scoresList.length > 0 ? Math.max(...scoresList) : 0;
    const minScore = scoresList.length > 0 ? Math.min(...scoresList) : 0;
    const avgScore = scoresList.length > 0 ? Math.round((scoresList.reduce((a, b) => a + b, 0) / scoresList.length) * 10) / 10 : 0;

    // Build Table Rows
    const rowsHtml = students
      .map((s, idx) => {
        const m = calculateStudentMetrics(s);
        let columnsHtml = '';

        // Helper for professional appreciation badge box without circles
        let appBoxStyle = 'background: #f8fafc; color: #475569; border: 1px solid #e2e8f0;';
        if (m.appreciation === 'ممتاز') appBoxStyle = 'background: #fef3c7; color: #92400e; border: 1px solid #fcd34d;';
        else if (m.appreciation === 'جيد جداً') appBoxStyle = 'background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;';
        else if (m.appreciation === 'جيد') appBoxStyle = 'background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;';
        else if (m.appreciation === 'متوسط') appBoxStyle = 'background: #fffbeb; color: #b45309; border: 1px solid #fde68a;';
        else if (m.appreciation === 'مقبول') appBoxStyle = 'background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa;';
        else if (m.appreciation === 'راسب') appBoxStyle = 'background: #fef2f2; color: #991b1b; border: 1px solid #fecaca;';

        if (targetPeriod === 'full') {
          const isPassed = m.finalGrade !== null && m.finalGrade >= 50;
          columnsHtml = `
            <td style="font-weight: 700; color: #0b2545;">${m.m1 !== null ? m.m1 : '-'}</td>
            <td style="font-weight: 700; color: #0b2545;">${m.m2 !== null ? m.m2 : '-'}</td>
            <td style="background: #f8fafc; font-weight: 900; color: #0b2545;">${m.term1Avg !== null ? m.term1Avg : '-'}</td>
            <td style="font-weight: 900; color: #92400e; background: #fffbeb;">${m.midYear !== null ? m.midYear : '-'}</td>
            <td style="font-weight: 700; color: #0b2545;">${m.m3 !== null ? m.m3 : '-'}</td>
            <td style="font-weight: 700; color: #0b2545;">${m.m4 !== null ? m.m4 : '-'}</td>
            <td style="background: #f8fafc; font-weight: 900; color: #0b2545;">${m.term2Avg !== null ? m.term2Avg : '-'}</td>
            <td style="background: #f0fdf4; font-weight: 900; color: #166534;">${m.annualEffort !== null ? m.annualEffort : '-'}</td>
            <td style="font-weight: 900; color: #1e40af; background: #eff6ff;">${m.finalExam !== null ? m.finalExam : '-'}</td>
            <td style="font-weight: 900; font-size: 0.95rem; background: #f8fafc; color: ${isPassed ? '#166534' : '#b91c1c'};">${m.finalGrade !== null ? m.finalGrade : '-'}</td>
            <td style="font-weight: 800;"><span style="display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 0.76rem; ${isPassed ? 'background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0;' : 'background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;'}">${m.status}</span></td>
            <td style="text-align: center; vertical-align: middle; padding: 3px;"><span style="display: block; width: 100%; box-sizing: border-box; padding: 3px 2px; border-radius: 4px; font-size: 0.78rem; font-weight: 800; text-align: center; ${appBoxStyle}">${m.appreciation}</span></td>
          `;
        } else if (targetPeriod === 'month1') {
          const isP = m.m1 !== null && m.m1 >= 50;
          columnsHtml = `
            <td style="font-weight: 900; font-size: 1.05rem; color: #0b2545;">${m.m1 !== null ? m.m1 : '-'}</td>
            <td style="font-weight: 800;"><span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; ${isP ? 'background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0;' : 'background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;'}">${m.m1 !== null ? (isP ? 'ناجح' : 'راسب') : '-'}</span></td>
            <td style="font-size: 0.82rem; color: #475569; text-align: right; padding-right: 8px;">${escapeHtml(s.notes || '-')}</td>
          `;
        } else if (targetPeriod === 'month2') {
          const isP = m.m2 !== null && m.m2 >= 50;
          columnsHtml = `
            <td style="font-weight: 900; font-size: 1.05rem; color: #0b2545;">${m.m2 !== null ? m.m2 : '-'}</td>
            <td style="font-weight: 800;"><span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; ${isP ? 'background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0;' : 'background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;'}">${m.m2 !== null ? (isP ? 'ناجح' : 'راسب') : '-'}</span></td>
            <td style="font-size: 0.82rem; color: #475569; text-align: right; padding-right: 8px;">${escapeHtml(s.notes || '-')}</td>
          `;
        } else if (targetPeriod === 'midYear') {
          const isP = m.midYear !== null && m.midYear >= 50;
          columnsHtml = `
            <td style="background: #f8fafc; font-weight: 800; color: #0b2545;">${m.term1Avg !== null ? m.term1Avg : '-'}</td>
            <td style="font-weight: 900; font-size: 1.05rem; color: #92400e; background: #fffbeb;">${m.midYear !== null ? m.midYear : '-'}</td>
            <td style="font-weight: 800;"><span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; ${isP ? 'background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0;' : 'background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;'}">${m.midYear !== null ? (isP ? 'ناجح' : 'راسب') : '-'}</span></td>
            <td style="font-size: 0.82rem; color: #475569; text-align: right; padding-right: 8px;">${escapeHtml(s.notes || '-')}</td>
          `;
        } else if (targetPeriod === 'final') {
          const isP = m.finalGrade !== null && m.finalGrade >= 50;
          columnsHtml = `
            <td style="background: #f0fdf4; font-weight: 900; color: #166534;">${m.annualEffort !== null ? m.annualEffort : '-'}</td>
            <td style="font-weight: 900; color: #1e40af; background: #eff6ff;">${m.finalExam !== null ? m.finalExam : '-'}</td>
            <td style="font-weight: 900; font-size: 1.05rem; background: #f8fafc; color: ${isP ? '#166534' : '#b91c1c'};">${m.finalGrade !== null ? m.finalGrade : '-'}</td>
            <td style="font-weight: 800;"><span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; ${isP ? 'background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0;' : 'background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;'}">${m.status}</span></td>
            <td style="text-align: center; vertical-align: middle; padding: 3px;"><span style="display: block; width: 100%; box-sizing: border-box; padding: 3px 2px; border-radius: 4px; font-size: 0.78rem; font-weight: 800; text-align: center; ${appBoxStyle}">${m.appreciation}</span></td>
            <td style="font-size: 0.82rem; color: #475569; text-align: right; padding-right: 8px;">${escapeHtml(s.notes || '-')}</td>
          `;
        }

        const zebraBg = idx % 2 === 1 ? '#fcfdfe' : '#ffffff';
        return `
          <tr style="background: ${zebraBg};">
            <td style="text-align: center; font-weight: 700; width: 34px; color: #64748b;">${idx + 1}</td>
            <td style="text-align: right; font-weight: 800; padding: 3px 8px; white-space: nowrap; color: #0f172a;">${escapeHtml(s.name || '')}</td>
            <td style="text-align: center; font-size: 0.78rem; width: 44px; color: #475569;">${escapeHtml(s.seatNumber || (idx + 1))}</td>
            ${columnsHtml}
          </tr>
        `;
      })
      .join('');

    let theadHtml = '';
    if (targetPeriod === 'full') {
      theadHtml = `
        <tr style="background: #0b2545; color: #ffffff; text-align: center; font-size: 0.78rem;">
          <th rowspan="2" style="width: 32px; border: 1px solid #334155;">ت</th>
          <th rowspan="2" style="text-align: right; padding-right: 8px; border: 1px solid #334155; min-width: 170px;">اسم الطالب الرباعي</th>
          <th rowspan="2" style="width: 42px; border: 1px solid #334155;">الرقم</th>
          <th colspan="3" style="background: #133b68; border: 1px solid #334155;">الفصل الأول</th>
          <th rowspan="2" style="background: #92400e; width: 56px; border: 1px solid #334155;">نصف السنة</th>
          <th colspan="3" style="background: #133b68; border: 1px solid #334155;">الفصل الثاني</th>
          <th rowspan="2" style="background: #166534; width: 56px; border: 1px solid #334155;">السعي السنوي</th>
          <th rowspan="2" style="background: #1e40af; width: 56px; border: 1px solid #334155;">نهاية السنة</th>
          <th rowspan="2" style="background: #0f172a; width: 58px; border: 1px solid #334155;">المعدل العام</th>
          <th rowspan="2" style="width: 54px; border: 1px solid #334155;">النتيجة</th>
          <th rowspan="2" style="width: 64px; border: 1px solid #334155;">التقدير</th>
        </tr>
        <tr style="background: #1e3a8a; color: #ffffff; text-align: center; font-size: 0.72rem;">
          <th style="width: 44px; border: 1px solid #334155;">شهر 1</th>
          <th style="width: 44px; border: 1px solid #334155;">شهر 2</th>
          <th style="width: 50px; background: #0b2545; border: 1px solid #334155;">معدل ف1</th>
          <th style="width: 44px; border: 1px solid #334155;">شهر 1</th>
          <th style="width: 44px; border: 1px solid #334155;">شهر 2</th>
          <th style="width: 50px; background: #0b2545; border: 1px solid #334155;">معدل ف2</th>
        </tr>
      `;
    } else if (targetPeriod === 'month1' || targetPeriod === 'month2') {
      const monthTitle = targetPeriod === 'month1' ? 'الشهر الأول' : 'الشهر الثاني';
      theadHtml = `
        <tr style="background: #0b2545; color: #ffffff; text-align: center; font-size: 0.82rem;">
          <th style="width: 38px; border: 1px solid #334155;">ت</th>
          <th style="text-align: right; padding-right: 8px; border: 1px solid #334155; min-width: 220px;">اسم الطالب الرباعي</th>
          <th style="width: 55px; border: 1px solid #334155;">رقم القيد</th>
          <th style="width: 100px; background: #133b68; border: 1px solid #334155;">درجة امتحان ${monthTitle}</th>
          <th style="width: 80px; border: 1px solid #334155;">النتيجة</th>
          <th style="border: 1px solid #334155; text-align: right; padding-right: 8px;">ملاحظات مدرس المادة</th>
        </tr>
      `;
    } else if (targetPeriod === 'midYear') {
      theadHtml = `
        <tr style="background: #0b2545; color: #ffffff; text-align: center; font-size: 0.82rem;">
          <th style="width: 38px; border: 1px solid #334155;">ت</th>
          <th style="text-align: right; padding-right: 8px; border: 1px solid #334155; min-width: 200px;">اسم الطالب الرباعي</th>
          <th style="width: 55px; border: 1px solid #334155;">رقم القيد</th>
          <th style="width: 85px; border: 1px solid #334155;">معدل ف1</th>
          <th style="width: 105px; background: #92400e; border: 1px solid #334155;">امتحان نصف السنة</th>
          <th style="width: 80px; border: 1px solid #334155;">النتيجة</th>
          <th style="border: 1px solid #334155; text-align: right; padding-right: 8px;">ملاحظات</th>
        </tr>
      `;
    } else if (targetPeriod === 'final') {
      theadHtml = `
        <tr style="background: #0b2545; color: #ffffff; text-align: center; font-size: 0.82rem;">
          <th style="width: 36px; border: 1px solid #334155;">ت</th>
          <th style="text-align: right; padding-right: 8px; border: 1px solid #334155; min-width: 190px;">اسم الطالب الرباعي</th>
          <th style="width: 50px; border: 1px solid #334155;">الرقم</th>
          <th style="width: 80px; background: #166534; border: 1px solid #334155;">السعي السنوي</th>
          <th style="width: 80px; background: #1e40af; border: 1px solid #334155;">الامتحان النهائي</th>
          <th style="width: 80px; background: #0f172a; border: 1px solid #334155;">المعدل العام</th>
          <th style="width: 75px; border: 1px solid #334155;">النتيجة</th>
          <th style="width: 80px; border: 1px solid #334155;">التقدير</th>
          <th style="border: 1px solid #334155; text-align: right; padding-right: 8px;">ملاحظات وتدقيق الإدارة</th>
        </tr>
      `;
    }

    let printDoc = null;
    let isIframeFallback = false;
    let printWin = null;
    try {
      printWin = window.open('', '_blank', 'width=1100,height=900,menubar=no,toolbar=no,status=no');
    } catch (_) {}

    if (printWin && printWin.document) {
      printDoc = printWin.document;
    } else {
      isIframeFallback = true;
      let printFrame = document.getElementById('sgDedicatedPrintIframe');
      if (printFrame) printFrame.remove();
      printFrame = document.createElement('iframe');
      printFrame.id = 'sgDedicatedPrintIframe';
      printFrame.style.cssText = 'position: fixed; left: 0; top: 0; width: 0; height: 0; border: 0; opacity: 0; pointer-events: none; z-index: -9999;';
      document.body.appendChild(printFrame);
      printDoc = printFrame.contentWindow.document;
    }

    printDoc.open();
    printDoc.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>سجل درجات الطلاب الرسمي - ${escapeHtml(activeRoster.subject || '')} - ${escapeHtml(activeRoster.name || '')}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap">
        <style>
          @page {
            size: A4 ${isLandscape ? 'landscape' : 'portrait'};
            margin: 7mm 8mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: 'Cairo', 'Traditional Arabic', 'Segoe UI', Tahoma, Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #0f172a;
            font-size: 8.5pt;
            line-height: 1.3;
            direction: rtl;
          }
          .print-ledger-container {
            width: 100%;
            border: 2px solid #0b2545;
            padding: 8px 10px;
            background: #ffffff;
          }
          .header-formal-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #0b2545;
            position: relative;
            padding-bottom: 6px;
            margin-bottom: 8px;
          }
          .header-formal-row::after {
            content: '';
            position: absolute;
            bottom: -3px;
            left: 0;
            right: 0;
            height: 1.5px;
            background: #c59b27;
          }
          .hf-col-right {
            text-align: right;
            font-size: 0.8rem;
            line-height: 1.3;
            font-weight: 700;
            min-width: 170px;
          }
          .hf-col-center {
            text-align: center;
            flex: 1;
            padding: 0 10px;
          }
          .hf-crest-wrap {
            display: flex;
            justify-content: center;
            margin-bottom: 2px;
          }
          .hf-main-title {
            margin: 0;
            font-size: 1.22rem;
            font-weight: 900;
            color: #0b2545;
            letter-spacing: -0.3px;
          }
          .hf-sub-badge {
            display: inline-block;
            font-size: 0.76rem;
            font-weight: 800;
            color: #0b2545;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-top: 2px solid #c59b27;
            padding: 2px 14px;
            border-radius: 4px;
            margin-top: 3px;
          }
          .hf-col-left {
            text-align: left;
            font-size: 0.78rem;
            min-width: 190px;
          }
          .info-table {
            border-collapse: collapse;
            font-size: 0.78rem;
            margin-left: auto;
          }
          .info-table td {
            padding: 1px 4px;
            font-weight: 700;
          }
          .info-label {
            color: #64748b;
            white-space: nowrap;
          }
          .info-val {
            color: #0b2545;
            font-weight: 900;
            white-space: nowrap;
          }
          .grades-print-table {
            width: 100%;
            border-collapse: collapse;
            border: 1.5px solid #0b2545;
            margin-bottom: 8px;
            page-break-inside: auto;
          }
          .grades-print-table thead {
            display: table-header-group;
          }
          .grades-print-table tfoot {
            display: table-footer-group;
          }
          .grades-print-table tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .grades-print-table th, .grades-print-table td {
            border: 1px solid #94a3b8;
            padding: 3px 4px;
            text-align: center;
            font-size: 0.8rem;
            line-height: 1.25;
            white-space: nowrap;
          }
          .stats-and-signatures {
            margin-top: 10px;
            page-break-inside: avoid;
            break-inside: avoid;
            border-top: 1.5px solid #0b2545;
            padding-top: 8px;
          }
          .stats-strip {
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
            background: #f8fafc;
            border: 1.5px solid #cbd5e1;
            border-right: 4px solid #c59b27;
            border-radius: 4px;
            padding: 5px 10px;
            font-size: 0.8rem;
            font-weight: 800;
            margin-bottom: 10px;
            gap: 8px;
          }
          .stats-strip span {
            color: #475569;
          }
          .stats-strip strong {
            color: #0b2545;
            font-size: 0.86rem;
          }
          .sig-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            text-align: center;
            font-size: 0.78rem;
          }
          .sig-card {
            border: 1.5px solid #cbd5e1;
            border-top: 2.5px solid #0b2545;
            border-radius: 4px;
            padding: 6px 8px;
            background: #ffffff;
            position: relative;
          }
          .sig-title {
            font-weight: 900;
            color: #0b2545;
            font-size: 0.82rem;
            margin-bottom: 2px;
          }
          .sig-name {
            font-weight: 800;
            color: #334155;
            font-size: 0.76rem;
            margin-bottom: 22px;
          }
          .sig-line {
            color: #64748b;
            font-size: 0.72rem;
            border-top: 1px dotted #94a3b8;
            padding-top: 3px;
          }
          .stamp-box {
            display: inline-block;
            border: 1.5px dashed #94a3b8;
            border-radius: 50%;
            width: 48px;
            height: 48px;
            line-height: 48px;
            text-align: center;
            font-size: 0.62rem;
            color: #94a3b8;
            font-weight: 800;
            margin-top: -6px;
            margin-bottom: 4px;
          }
        </style>
      </head>
      <body>
        <div class="print-ledger-container">
          
          <!-- Official Formal Header -->
          <div class="header-formal-row">
            <div class="hf-col-right">
              <div style="color: #64748b; font-size: 0.72rem;">جمهورية العراق</div>
              <div style="color: #0b2545; font-weight: 800;">وزارة التربية والتعليم</div>
              <div style="color: #475569; font-size: 0.74rem;">المديرية العامة للتربية</div>
              <div style="color: #0b2545; font-weight: 900; font-size: 0.85rem; margin-top: 1px;">${escapeHtml(activeRoster.schoolName || 'اسم المدرسة')}</div>
            </div>
            
            <div class="hf-col-center">
              <div class="hf-crest-wrap">
                <!-- Official Iraq MOE Seal (شعار وزارة التربية الرسمي) -->
                <img src="assets/iraq_moe_seal.png" alt="شعار وزارة التربية العراقية" style="width: 58px; height: 58px; object-fit: contain; margin-bottom: 2px;">
              </div>
              <h1 class="hf-main-title">سجل رصد ودرجات وتقييم الطلاب الرسمي</h1>
              <div class="hf-sub-badge">${periodTitle}</div>
            </div>

            <div class="hf-col-left">
              <table class="info-table">
                <tr><td class="info-label">المادة الدراسية:</td><td class="info-val">${escapeHtml(activeRoster.subject || '-')}</td></tr>
                <tr><td class="info-label">الصف والشعبة:</td><td class="info-val">${escapeHtml(activeRoster.name || '-')}</td></tr>
                <tr><td class="info-label">العام الدراسي:</td><td class="info-val">${escapeHtml(activeRoster.academicYear || '-')}</td></tr>
                <tr><td class="info-label">أستاذ المادة:</td><td class="info-val">${escapeHtml(activeRoster.teacherName || '-')}</td></tr>
              </table>
            </div>
          </div>

          <!-- Main Master Table -->
          <table class="grades-print-table">
            <thead>
              ${theadHtml}
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <!-- Official Statistics & Signatures Footer -->
          <div class="stats-and-signatures">
            <div class="stats-strip">
              <div><span>المسجلون بالصف:</span> <strong>${students.length}</strong></div>
              <div><span>الممتحنون:</span> <strong>${totalAssessed}</strong></div>
              <div><span>الناجحون:</span> <strong style="color: #166534;">${passCount}</strong></div>
              <div><span>نسبة النجاح:</span> <strong style="color: #166534;">${passRate}%</strong></div>
              <div><span>المكملون:</span> <strong style="color: #d97706;">${suppCount}</strong></div>
              <div><span>الراسبون:</span> <strong style="color: #dc2626;">${failCount}</strong></div>
              <div><span>أعلى درجة:</span> <strong style="color: #166534;">${maxScore}</strong></div>
              <div><span>أدنى درجة:</span> <strong style="color: #dc2626;">${minScore}</strong></div>
              <div><span>المعدل العام:</span> <strong style="color: #1e40af;">${avgScore}</strong></div>
            </div>

            <div class="sig-row">
              <!-- 1. Teacher -->
              <div class="sig-card">
                <div class="sig-title">أستاذ المادة</div>
                <div class="sig-name">${escapeHtml(activeRoster.teacherName || 'الأستاذ')}</div>
                <div class="sig-line">التوقيع: .......................... التاريخ: &nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;/ 2024</div>
              </div>

              <!-- 2. Auditor / Exam Committee -->
              <div class="sig-card">
                <div class="sig-title">مدقق الدرجات والكنترول</div>
                <div class="sig-name">عضو اللجنة الامتحانية</div>
                <div class="sig-line">التوقيع: .......................... التاريخ: &nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;/ 2024</div>
              </div>

              <!-- 3. Committee Head -->
              <div class="sig-card">
                <div class="sig-title">رئيس اللجنة الامتحانية</div>
                <div class="sig-name">معاون المدير / رئيس اللجنة</div>
                <div class="sig-line">التوقيع: .......................... التاريخ: &nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;/ 2024</div>
              </div>

              <!-- 4. School Principal & Official Stamp -->
              <div class="sig-card">
                <div class="sig-title">مصادقة مدير المدرسة</div>
                <div class="sig-name">إدارة المدرسة والختم الرسمي</div>
                <div class="sig-line">التوقيع: ................ الختم: [ خاتم الإدارة ]</div>
              </div>
            </div>
          </div>

        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printDoc.close();
    if (isIframeFallback) {
      setTimeout(() => {
        try {
          const frame = document.getElementById('sgDedicatedPrintIframe');
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
   * Direct PDF Exporter for Student Grades Official Ledger (تنزيل ملف PDF حقيقي ومباشر دون فتح نوافذ أو طباعة)
   */
  window.sgExportLedgerPdf = async function (targetPeriod = 'full') {
    if (!activeRoster) return;
    const students = activeRoster.students || [];
    if (students.length === 0) {
      if (typeof window.showToast === 'function') {
        window.showToast('لا توجد بيانات طلاب للتصدير بصيغة PDF!', 'warning');
      }
      return;
    }

    const isLandscape = targetPeriod === 'full' || targetPeriod === 'results';
    let periodTitle = 'سجل درجات وتقييم الطلاب الشامل لجميع الفصول والامتحانات';
    let periodSlug = 'الشامل';
    if (targetPeriod === 'month1') {
      periodTitle = 'كشف درجات امتحان الشهر الأول (الفصل الأول)';
      periodSlug = 'الشهر-الأول';
    } else if (targetPeriod === 'month2') {
      periodTitle = 'كشف درجات امتحان الشهر الثاني (الفصل الأول)';
      periodSlug = 'الشهر-الثاني';
    } else if (targetPeriod === 'midYear') {
      periodTitle = 'كشف درجات امتحان نصف السنة الرسمي';
      periodSlug = 'نصف-السنة';
    } else if (targetPeriod === 'final') {
      periodTitle = 'كشف درجات امتحان نهاية السنة (الدور الأول) والنتيجة العامة';
      periodSlug = 'نهاية-السنة';
    }

    // Calculate Summary Stats
    let passCount = 0;
    let failCount = 0;
    let suppCount = 0;
    let totalAssessed = 0;
    let scoresList = [];

    students.forEach(s => {
      const m = calculateStudentMetrics(s);
      let targetGrade = m.finalGrade;
      if (targetPeriod === 'month1') targetGrade = m.m1;
      else if (targetPeriod === 'month2') targetGrade = m.m2;
      else if (targetPeriod === 'midYear') targetGrade = m.midYear;

      if (targetGrade !== null) {
        totalAssessed++;
        scoresList.push(targetGrade);
        if (targetGrade >= 50) passCount++;
        else failCount++;
      }
      if (targetPeriod === 'full' && m.finalGrade !== null) {
        if (m.status === 'مكمل') {
          suppCount++;
          failCount = Math.max(0, failCount - 1);
        }
      }
    });

    const passRate = totalAssessed > 0 ? Math.round((passCount / totalAssessed) * 100) : 0;
    const maxScore = scoresList.length > 0 ? Math.max(...scoresList) : 0;
    const minScore = scoresList.length > 0 ? Math.min(...scoresList) : 0;
    const avgScore = scoresList.length > 0 ? Math.round((scoresList.reduce((a, b) => a + b, 0) / scoresList.length) * 10) / 10 : 0;

    // Build Table Rows
    const rowsHtml = students
      .map((s, idx) => {
        const m = calculateStudentMetrics(s);
        let columnsHtml = '';

        let appBoxStyle = 'background: #f8fafc; color: #475569; border: 1px solid #e2e8f0;';
        if (m.appreciation === 'ممتاز') appBoxStyle = 'background: #fef3c7; color: #92400e; border: 1px solid #fcd34d;';
        else if (m.appreciation === 'جيد جداً') appBoxStyle = 'background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;';
        else if (m.appreciation === 'جيد') appBoxStyle = 'background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;';
        else if (m.appreciation === 'متوسط') appBoxStyle = 'background: #fffbeb; color: #b45309; border: 1px solid #fde68a;';
        else if (m.appreciation === 'مقبول') appBoxStyle = 'background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa;';
        else if (m.appreciation === 'راسب') appBoxStyle = 'background: #fef2f2; color: #991b1b; border: 1px solid #fecaca;';

        if (targetPeriod === 'full') {
          const isPassed = m.finalGrade !== null && m.finalGrade >= 50;
          columnsHtml = `
            <td style="font-weight: 700; color: #0b2545; text-align: center; border: 1px solid #cbd5e1;">${m.m1 !== null ? m.m1 : '-'}</td>
            <td style="font-weight: 700; color: #0b2545; text-align: center; border: 1px solid #cbd5e1;">${m.m2 !== null ? m.m2 : '-'}</td>
            <td style="background: #f8fafc; font-weight: 900; color: #0b2545; text-align: center; border: 1px solid #cbd5e1;">${m.term1Avg !== null ? m.term1Avg : '-'}</td>
            <td style="font-weight: 900; color: #92400e; background: #fffbeb; text-align: center; border: 1px solid #cbd5e1;">${m.midYear !== null ? m.midYear : '-'}</td>
            <td style="font-weight: 700; color: #0b2545; text-align: center; border: 1px solid #cbd5e1;">${m.m3 !== null ? m.m3 : '-'}</td>
            <td style="font-weight: 700; color: #0b2545; text-align: center; border: 1px solid #cbd5e1;">${m.m4 !== null ? m.m4 : '-'}</td>
            <td style="background: #f8fafc; font-weight: 900; color: #0b2545; text-align: center; border: 1px solid #cbd5e1;">${m.term2Avg !== null ? m.term2Avg : '-'}</td>
            <td style="background: #f0fdf4; font-weight: 900; color: #166534; text-align: center; border: 1px solid #cbd5e1;">${m.annualEffort !== null ? m.annualEffort : '-'}</td>
            <td style="font-weight: 900; color: #1e40af; background: #eff6ff; text-align: center; border: 1px solid #cbd5e1;">${m.finalExam !== null ? m.finalExam : '-'}</td>
            <td style="font-weight: 900; font-size: 0.95rem; background: #f8fafc; color: ${isPassed ? '#166534' : '#b91c1c'}; text-align: center; border: 1px solid #cbd5e1;">${m.finalGrade !== null ? m.finalGrade : '-'}</td>
            <td style="font-weight: 800; text-align: center; border: 1px solid #cbd5e1;"><span style="display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 0.76rem; ${isPassed ? 'background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0;' : 'background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;'}">${m.status}</span></td>
            <td style="text-align: center; vertical-align: middle; padding: 3px; border: 1px solid #cbd5e1;"><span style="display: block; width: 100%; box-sizing: border-box; padding: 2px; border-radius: 4px; font-size: 0.76rem; font-weight: 800; text-align: center; ${appBoxStyle}">${m.appreciation}</span></td>
          `;
        } else if (targetPeriod === 'month1' || targetPeriod === 'month2') {
          const val = targetPeriod === 'month1' ? m.m1 : m.m2;
          const isP = val !== null && val >= 50;
          columnsHtml = `
            <td style="font-weight: 900; font-size: 1.05rem; color: #0b2545; text-align: center; border: 1px solid #cbd5e1;">${val !== null ? val : '-'}</td>
            <td style="font-weight: 800; text-align: center; border: 1px solid #cbd5e1;"><span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; ${isP ? 'background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0;' : 'background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;'}">${val !== null ? (isP ? 'ناجح' : 'راسب') : '-'}</span></td>
            <td style="font-size: 0.82rem; color: #475569; text-align: right; padding-right: 8px; border: 1px solid #cbd5e1;">${escapeHtml(s.notes || '-')}</td>
          `;
        } else if (targetPeriod === 'midYear') {
          const isP = m.midYear !== null && m.midYear >= 50;
          columnsHtml = `
            <td style="background: #f8fafc; font-weight: 800; color: #0b2545; text-align: center; border: 1px solid #cbd5e1;">${m.term1Avg !== null ? m.term1Avg : '-'}</td>
            <td style="font-weight: 900; font-size: 1.05rem; color: #92400e; background: #fffbeb; text-align: center; border: 1px solid #cbd5e1;">${m.midYear !== null ? m.midYear : '-'}</td>
            <td style="font-weight: 800; text-align: center; border: 1px solid #cbd5e1;"><span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; ${isP ? 'background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0;' : 'background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;'}">${m.midYear !== null ? (isP ? 'ناجح' : 'راسب') : '-'}</span></td>
            <td style="font-size: 0.82rem; color: #475569; text-align: right; padding-right: 8px; border: 1px solid #cbd5e1;">${escapeHtml(s.notes || '-')}</td>
          `;
        } else if (targetPeriod === 'final') {
          const isP = m.finalGrade !== null && m.finalGrade >= 50;
          columnsHtml = `
            <td style="background: #f0fdf4; font-weight: 900; color: #166534; text-align: center; border: 1px solid #cbd5e1;">${m.annualEffort !== null ? m.annualEffort : '-'}</td>
            <td style="font-weight: 900; color: #1e40af; background: #eff6ff; text-align: center; border: 1px solid #cbd5e1;">${m.finalExam !== null ? m.finalExam : '-'}</td>
            <td style="font-weight: 900; font-size: 1.05rem; background: #f8fafc; color: ${isP ? '#166534' : '#b91c1c'}; text-align: center; border: 1px solid #cbd5e1;">${m.finalGrade !== null ? m.finalGrade : '-'}</td>
            <td style="font-weight: 800; text-align: center; border: 1px solid #cbd5e1;"><span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; ${isP ? 'background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0;' : 'background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;'}">${m.status}</span></td>
            <td style="text-align: center; vertical-align: middle; padding: 3px; border: 1px solid #cbd5e1;"><span style="display: block; width: 100%; box-sizing: border-box; padding: 2px; border-radius: 4px; font-size: 0.76rem; font-weight: 800; text-align: center; ${appBoxStyle}">${m.appreciation}</span></td>
            <td style="font-size: 0.82rem; color: #475569; text-align: right; padding-right: 8px; border: 1px solid #cbd5e1;">${escapeHtml(s.notes || '-')}</td>
          `;
        }

        const zebraBg = idx % 2 === 1 ? '#fcfdfe' : '#ffffff';
        return `
          <tr style="background: ${zebraBg};">
            <td style="text-align: center; font-weight: 700; width: 34px; color: #64748b; border: 1px solid #cbd5e1;">${idx + 1}</td>
            <td style="text-align: right; font-weight: 800; padding: 3px 8px; white-space: nowrap; color: #0f172a; border: 1px solid #cbd5e1;">${escapeHtml(s.name || '')}</td>
            <td style="text-align: center; font-size: 0.78rem; width: 44px; color: #475569; border: 1px solid #cbd5e1;">${escapeHtml(s.seatNumber || (idx + 1))}</td>
            ${columnsHtml}
          </tr>
        `;
      })
      .join('');

    let theadHtml = '';
    if (targetPeriod === 'full') {
      theadHtml = `
        <tr style="background: #0b2545; color: #ffffff; text-align: center; font-size: 0.78rem;">
          <th rowspan="2" style="width: 32px; border: 1px solid #334155;">ت</th>
          <th rowspan="2" style="text-align: right; padding-right: 8px; border: 1px solid #334155; min-width: 170px;">اسم الطالب الرباعي</th>
          <th rowspan="2" style="width: 42px; border: 1px solid #334155;">الرقم</th>
          <th colspan="3" style="background: #133b68; border: 1px solid #334155;">الفصل الأول</th>
          <th rowspan="2" style="background: #92400e; width: 56px; border: 1px solid #334155;">نصف السنة</th>
          <th colspan="3" style="background: #133b68; border: 1px solid #334155;">الفصل الثاني</th>
          <th rowspan="2" style="background: #166534; width: 56px; border: 1px solid #334155;">السعي السنوي</th>
          <th rowspan="2" style="background: #1e40af; width: 56px; border: 1px solid #334155;">نهاية السنة</th>
          <th rowspan="2" style="background: #0f172a; width: 58px; border: 1px solid #334155;">المعدل العام</th>
          <th rowspan="2" style="width: 54px; border: 1px solid #334155;">النتيجة</th>
          <th rowspan="2" style="width: 64px; border: 1px solid #334155;">التقدير</th>
        </tr>
        <tr style="background: #1e3a8a; color: #ffffff; text-align: center; font-size: 0.72rem;">
          <th style="width: 44px; border: 1px solid #334155;">شهر 1</th>
          <th style="width: 44px; border: 1px solid #334155;">شهر 2</th>
          <th style="width: 50px; background: #0b2545; border: 1px solid #334155;">معدل ف1</th>
          <th style="width: 44px; border: 1px solid #334155;">شهر 1</th>
          <th style="width: 44px; border: 1px solid #334155;">شهر 2</th>
          <th style="width: 50px; background: #0b2545; border: 1px solid #334155;">معدل ف2</th>
        </tr>
      `;
    } else if (targetPeriod === 'month1' || targetPeriod === 'month2') {
      const monthTitle = targetPeriod === 'month1' ? 'الشهر الأول' : 'الشهر الثاني';
      theadHtml = `
        <tr style="background: #0b2545; color: #ffffff; text-align: center; font-size: 0.82rem;">
          <th style="width: 38px; border: 1px solid #334155;">ت</th>
          <th style="text-align: right; padding-right: 8px; border: 1px solid #334155; min-width: 220px;">اسم الطالب الرباعي</th>
          <th style="width: 55px; border: 1px solid #334155;">رقم القيد</th>
          <th style="width: 100px; background: #133b68; border: 1px solid #334155;">درجة امتحان ${monthTitle}</th>
          <th style="width: 80px; border: 1px solid #334155;">النتيجة</th>
          <th style="border: 1px solid #334155; text-align: right; padding-right: 8px;">ملاحظات مدرس المادة</th>
        </tr>
      `;
    } else if (targetPeriod === 'midYear') {
      theadHtml = `
        <tr style="background: #0b2545; color: #ffffff; text-align: center; font-size: 0.82rem;">
          <th style="width: 38px; border: 1px solid #334155;">ت</th>
          <th style="text-align: right; padding-right: 8px; border: 1px solid #334155; min-width: 200px;">اسم الطالب الرباعي</th>
          <th style="width: 55px; border: 1px solid #334155;">رقم القيد</th>
          <th style="width: 85px; border: 1px solid #334155;">معدل ف1</th>
          <th style="width: 105px; background: #92400e; border: 1px solid #334155;">امتحان نصف السنة</th>
          <th style="width: 80px; border: 1px solid #334155;">النتيجة</th>
          <th style="border: 1px solid #334155; text-align: right; padding-right: 8px;">ملاحظات</th>
        </tr>
      `;
    } else if (targetPeriod === 'final') {
      theadHtml = `
        <tr style="background: #0b2545; color: #ffffff; text-align: center; font-size: 0.82rem;">
          <th style="width: 36px; border: 1px solid #334155;">ت</th>
          <th style="text-align: right; padding-right: 8px; border: 1px solid #334155; min-width: 180px;">اسم الطالب الرباعي</th>
          <th style="width: 48px; border: 1px solid #334155;">الرقم</th>
          <th style="width: 85px; background: #166534; border: 1px solid #334155;">السعي السنوي</th>
          <th style="width: 90px; background: #1e40af; border: 1px solid #334155;">امتحان نهاية السنة</th>
          <th style="width: 80px; background: #0f172a; border: 1px solid #334155;">المعدل العام</th>
          <th style="width: 75px; border: 1px solid #334155;">النتيجة</th>
          <th style="width: 80px; border: 1px solid #334155;">التقدير</th>
          <th style="border: 1px solid #334155; text-align: right; padding-right: 8px;">ملاحظات وتدقيق الإدارة</th>
        </tr>
      `;
    }

    let exportDiv = document.getElementById('sgPdfExportContainer');
    if (!exportDiv) {
      exportDiv = document.createElement('div');
      exportDiv.id = 'sgPdfExportContainer';
      document.body.appendChild(exportDiv);
    }

    const cleanRosterName = (activeRoster.name || 'الصف').replace(/[\/\\?%*:|"<>]/g, '-').trim();
    const cleanSub = (activeRoster.subject || 'المادة').replace(/[\/\\?%*:|"<>]/g, '-').trim();
    const filename = `نتائج-${cleanRosterName}-${cleanSub}-${periodSlug}.pdf`;

    exportDiv.style.display = 'block';
    exportDiv.style.position = 'relative';
    exportDiv.innerHTML = `
      <div style="direction: rtl; text-align: right; font-family: 'Amiri', 'Cairo', serif; color: #000; padding: 15px 20px; line-height: 1.35; background: #fff; width: 100%; box-sizing: border-box;">
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0b2545; padding-bottom: 8px; margin-bottom: 10px;">
          <div style="text-align: right; font-size: 0.85rem; font-weight: 700; width: 30%;">
            <div style="color: #64748b;">جمهورية العراق</div>
            <div style="color: #0b2545; font-weight: 800;">وزارة التربية والتعليم</div>
            <div style="color: #475569;">المديرية العامة للتربية</div>
            <div style="color: #0b2545; font-weight: 900; margin-top: 2px;">${escapeHtml(activeRoster.schoolName || 'اسم المدرسة')}</div>
          </div>
          
          <div style="text-align: center; flex: 1;">
            <img src="assets/iraq_moe_seal.png" alt="شعار وزارة التربية" style="width: 56px; height: 56px; object-fit: contain; margin-bottom: 2px; display: inline-block;">
            <div style="font-size: 1.18rem; font-weight: 900; color: #0b2545;">سجل رصد ودرجات وتقييم الطلاب الرسمي</div>
            <div style="display: inline-block; font-size: 0.78rem; font-weight: 800; color: #0b2545; background: #f8fafc; border: 1px solid #cbd5e1; border-top: 2px solid #c59b27; padding: 2px 14px; border-radius: 4px; margin-top: 3px;">${periodTitle}</div>
          </div>

          <div style="text-align: left; font-size: 0.82rem; width: 30%;">
            <table style="margin-left: auto; border-collapse: collapse; font-size: 0.82rem;">
              <tr><td style="color: #64748b; font-weight: 700; padding: 1px 4px;">المادة الدراسية:</td><td style="color: #0b2545; font-weight: 900;">${escapeHtml(activeRoster.subject || '-')}</td></tr>
              <tr><td style="color: #64748b; font-weight: 700; padding: 1px 4px;">الصف والشعبة:</td><td style="color: #0b2545; font-weight: 900;">${escapeHtml(activeRoster.name || '-')}</td></tr>
              <tr><td style="color: #64748b; font-weight: 700; padding: 1px 4px;">العام الدراسي:</td><td style="color: #0b2545; font-weight: 900;">${escapeHtml(activeRoster.academicYear || '-')}</td></tr>
              <tr><td style="color: #64748b; font-weight: 700; padding: 1px 4px;">أستاذ المادة:</td><td style="color: #0b2545; font-weight: 900;">${escapeHtml(activeRoster.teacherName || '-')}</td></tr>
            </table>
          </div>
        </div>

        <!-- Table -->
        <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 12px;">
          <thead>
            ${theadHtml}
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <!-- Stats -->
        <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 4px; padding: 6px 10px; margin-bottom: 14px; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; font-size: 0.82rem;">
          <div><span>المسجلون:</span> <strong>${students.length}</strong></div>
          <div><span>الممتحنون:</span> <strong>${totalAssessed}</strong></div>
          <div><span>الناجحون:</span> <strong style="color: #166534;">${passCount}</strong></div>
          <div><span>نسبة النجاح:</span> <strong style="color: #166534;">${passRate}%</strong></div>
          <div><span>المكملون:</span> <strong style="color: #d97706;">${suppCount}</strong></div>
          <div><span>الراسبون:</span> <strong style="color: #dc2626;">${failCount}</strong></div>
          <div><span>أعلى درجة:</span> <strong style="color: #166534;">${maxScore}</strong></div>
          <div><span>أدنى درجة:</span> <strong style="color: #dc2626;">${minScore}</strong></div>
          <div><span>المعدل العام:</span> <strong style="color: #1e40af;">${avgScore}</strong></div>
        </div>

        <!-- Signatures -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; text-align: center; font-size: 0.78rem;">
          <div style="border: 1.5px solid #cbd5e1; border-top: 2.5px solid #0b2545; border-radius: 4px; padding: 6px 8px; background: #fff;">
            <div style="font-weight: 900; color: #0b2545;">أستاذ المادة</div>
            <div style="color: #334155; margin-bottom: 20px;">${escapeHtml(activeRoster.teacherName || 'الأستاذ')}</div>
            <div style="color: #64748b; font-size: 0.72rem; border-top: 1px dotted #94a3b8; padding-top: 3px;">التوقيع: ..................</div>
          </div>
          <div style="border: 1.5px solid #cbd5e1; border-top: 2.5px solid #0b2545; border-radius: 4px; padding: 6px 8px; background: #fff;">
            <div style="font-weight: 900; color: #0b2545;">مدقق الدرجات والكنترول</div>
            <div style="color: #334155; margin-bottom: 20px;">عضو اللجنة الامتحانية</div>
            <div style="color: #64748b; font-size: 0.72rem; border-top: 1px dotted #94a3b8; padding-top: 3px;">التوقيع: ..................</div>
          </div>
          <div style="border: 1.5px solid #cbd5e1; border-top: 2.5px solid #0b2545; border-radius: 4px; padding: 6px 8px; background: #fff;">
            <div style="font-weight: 900; color: #0b2545;">رئيس اللجنة الامتحانية</div>
            <div style="color: #334155; margin-bottom: 20px;">معاون المدير / رئيس اللجنة</div>
            <div style="color: #64748b; font-size: 0.72rem; border-top: 1px dotted #94a3b8; padding-top: 3px;">التوقيع: ..................</div>
          </div>
          <div style="border: 1.5px solid #cbd5e1; border-top: 2.5px solid #0b2545; border-radius: 4px; padding: 6px 8px; background: #fff;">
            <div style="font-weight: 900; color: #0b2545;">مصادقة مدير المدرسة</div>
            <div style="color: #334155; margin-bottom: 20px;">إدارة المدرسة والختم الرسمي</div>
            <div style="color: #64748b; font-size: 0.72rem; border-top: 1px dotted #94a3b8; padding-top: 3px;">التوقيع والختم: [ خاتم الإدارة ]</div>
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
          orientation: isLandscape ? 'landscape' : 'portrait',
          margin: '8mm',
          fit: true
        });
        if (typeof window.showToast === 'function') {
          window.showToast(`تم تنزيل ${periodTitle} بصيغة PDF مباشرة بنجاح ✅`, 'success');
        }
      } else {
        throw new Error('محرك تصدير PDF المباشر غير متوفر');
      }
    } catch (err) {
      console.error('sgExportLedgerPdf error:', err);
      if (typeof window.showToast === 'function') {
        window.showToast('تعذر تنزيل ملف PDF: ' + (err.message || 'خطأ غير متوقع'), 'danger');
      }
    } finally {
      if (exportDiv) exportDiv.style.display = 'none';
    }
  };


  /**
   * HTML escape helper
   */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Print Options Modal Controls
   */
  window.sgOpenPrintOptionsModal = function() {
    const modal = document.getElementById('sgPrintOptionsModal');
    if (modal) modal.classList.add('open');
  };

  window.sgClosePrintOptionsModal = function() {
    const modal = document.getElementById('sgPrintOptionsModal');
    if (modal) modal.classList.remove('open');
  };

  /**
   * Arabic Normalized Collation Key for Alphabetical Sorting (أ - ي)
   */
  function getArabicSortKey(str) {
    if (!str) return '';
    return String(str)
      .trim()
      // Remove diacritics / tashkeel
      .replace(/[\u064B-\u065F\u0670]/g, '')
      // Remove punctuation and numbers
      .replace(/[^\u0621-\u064A\s]/g, '')
      // Normalize Hamzas and Alefs
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[\s\t]+/g, ' ')
      .trim();
  }

  /**
   * Sort array of students strictly according to the Arabic Alphabet (أ - ي)
   */
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

  /**
   * Public function to sort active roster alphabetically with one click
   */
  window.sgSortAlphabetically = function (reindex = true) {
    if (!activeRoster || !Array.isArray(activeRoster.students) || activeRoster.students.length === 0) {
      if (typeof window.showToast === 'function') {
        window.showToast('لا يوجد طلاب في السجل لترتيبهم!', 'warning');
      }
      return;
    }

    activeRoster.students = sortStudentsArabicAlphabetical(activeRoster.students);

    if (reindex) {
      activeRoster.students.forEach((s, idx) => {
        s.seatNumber = String(idx + 1);
      });
    }

    renderTable();
    renderStats();
    triggerAutoSave();

    if (typeof window.showToast === 'function') {
      window.showToast(`تم فرز وترتيب جميع أسماء الطلاب أبجدياً (أ - ي) بالكامل بنجاح 🔤✅`, 'success');
    }
  };

  /**
   * Excel Import State & Controls
   */
  let pendingExcelStudents = [];

  window.sgOpenExcelImportModal = function () {
    pendingExcelStudents = [];
    const modal = document.getElementById('sgExcelImportModal');
    if (modal) {
      modal.classList.add('open');
      const fileInput = document.getElementById('sgExcelFileInput');
      if (fileInput) fileInput.value = '';

      const previewSection = document.getElementById('sgExcelPreviewSection');
      if (previewSection) previewSection.style.display = 'none';

      const confirmBtn = document.getElementById('sgBtnConfirmExcelImport');
      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = '0.5';
      }
    }
  };

  window.sgCloseExcelImportModal = function () {
    const modal = document.getElementById('sgExcelImportModal');
    if (modal) modal.classList.remove('open');
  };

  window.sgOnDragOver = function (e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('sgExcelDropzone');
    if (dropzone) dropzone.classList.add('dragover');
  };

  window.sgOnDragLeave = function (e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('sgExcelDropzone');
    if (dropzone) dropzone.classList.remove('dragover');
  };

  window.sgOnDropExcel = function (e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('sgExcelDropzone');
    if (dropzone) dropzone.classList.remove('dragover');

    const files = e.dataTransfer ? e.dataTransfer.files : null;
    if (files && files.length > 0) {
      processExcelFile(files[0]);
    }
  };

  window.sgOnExcelFileSelected = function (input) {
    if (input && input.files && input.files.length > 0) {
      processExcelFile(input.files[0]);
    }
  };

  /**
   * Process and Parse Excel File
   */
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
          // Fallback CSV text parser
          const decoder = new TextDecoder('utf-8');
          const text = decoder.decode(e.target.result);
          rows = parseCsvToRows(text);
        } else {
          throw new Error('مكتبة قراءة ملفات الإكسل غير جاهزة حالياً');
        }

        extractStudentsFromRows(rows, fileName);
      } catch (err) {
        console.error('Error reading Excel file:', err);
        if (typeof window.showToast === 'function') {
          window.showToast(`تعذر قراءة ملف الإكسل: ${err.message || 'خطأ غير معروف'}`, 'error');
        }
      }
    };

    reader.readAsArrayBuffer(file);
  }

  /**
   * Fallback CSV string parser
   */
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

  /**
   * Extract student names and marks from raw 2D array
   */
  function extractStudentsFromRows(rows, fileName) {
    if (!Array.isArray(rows) || rows.length === 0) {
      if (typeof window.showToast === 'function') {
        window.showToast('ملف الإكسل فارغ ولا يحتوي على بيانات!', 'warning');
      }
      return;
    }

    // Identify header row
    let headerRowIdx = -1;
    let nameCol = -1;
    let seatCol = -1;
    let m1Col = -1;
    let m2Col = -1;
    let act1Col = -1;
    let midCol = -1;
    let m3Col = -1;
    let m4Col = -1;
    let act2Col = -1;
    let finalCol = -1;
    let notesCol = -1;

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

    // If header row found, find other columns
    if (headerRowIdx !== -1) {
      const hRow = rows[headerRowIdx];
      for (let c = 0; c < hRow.length; c++) {
        if (c === nameCol) continue;
        const val = String(hRow[c] || '').trim().toLowerCase();

        if (seatCol === -1 && (val.includes('قيد') || val.includes('رقم') || val === 'ت' || val.includes('تسلسل') || val.includes('id'))) {
          seatCol = c;
        } else if (m1Col === -1 && (val.includes('شهر 1') || val.includes('شهر اول') || val.includes('شهر أول') || val.includes('م1'))) {
          m1Col = c;
        } else if (m2Col === -1 && (val.includes('شهر 2') || val.includes('شهر ثاني') || val.includes('م2'))) {
          m2Col = c;
        } else if (act1Col === -1 && (val.includes('نشاط') || val.includes('يومي'))) {
          act1Col = c;
        } else if (midCol === -1 && (val.includes('نصف') || val.includes('منتصف') || val.includes('نصف السنه') || val.includes('نصف السنة'))) {
          midCol = c;
        } else if (m3Col === -1 && (val.includes('شهر 3') || val.includes('شهر ثالث') || val.includes('شهر 1 ف2') || val.includes('فصل ثاني 1'))) {
          m3Col = c;
        } else if (m4Col === -1 && (val.includes('شهر 4') || val.includes('شهر رابع') || val.includes('شهر 2 ف2') || val.includes('فصل ثاني 2'))) {
          m4Col = c;
        } else if (finalCol === -1 && (val.includes('نهاية') || val.includes('نهائي') || val.includes('دور اول') || val.includes('دور أول') || val.includes('فاينل'))) {
          finalCol = c;
        } else if (notesCol === -1 && (val.includes('ملاحظ') || val.includes('notes'))) {
          notesCol = c;
        }
      }
    } else {
      // No explicit header: scan columns to find the one with the most Arabic names
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
        seatNumber: seat || String(extracted.length + 1),
        name: rawName,
        m1: m1Col !== -1 ? parseGrade(row[m1Col]) : null,
        m2: m2Col !== -1 ? parseGrade(row[m2Col]) : null,
        act1: act1Col !== -1 ? parseGrade(row[act1Col]) : null,
        midYear: midCol !== -1 ? parseGrade(row[midCol]) : null,
        m3: m3Col !== -1 ? parseGrade(row[m3Col]) : null,
        m4: m4Col !== -1 ? parseGrade(row[m4Col]) : null,
        act2: act2Col !== -1 ? parseGrade(row[act2Col]) : null,
        finalExam: finalCol !== -1 ? parseGrade(row[finalCol]) : null,
        notes: notesCol !== -1 ? String(row[notesCol] || '').trim() : ''
      });
    }

    if (extracted.length === 0) {
      if (typeof window.showToast === 'function') {
        window.showToast('لم يتم العثور على أي أسماء صالحة في ملف الإكسل!', 'warning');
      }
      return;
    }

    // Check alphabetical sort option
    const sortCheck = document.getElementById('sgExcelAlphabeticalSortCheck');
    const shouldSort = sortCheck ? sortCheck.checked : true;

    if (shouldSort) {
      pendingExcelStudents = sortStudentsArabicAlphabetical(extracted);
      pendingExcelStudents.forEach((s, idx) => {
        s.seatNumber = String(idx + 1);
      });
    } else {
      pendingExcelStudents = extracted;
    }

    renderExcelPreview(pendingExcelStudents, fileName);
  }

  /**
   * Render Excel Preview Box
   */
  function renderExcelPreview(studentsList, fileName) {
    const previewSection = document.getElementById('sgExcelPreviewSection');
    const tbody = document.getElementById('sgExcelPreviewTableBody');
    const countBadge = document.getElementById('sgExcelPreviewCountBadge');
    const statusLabel = document.getElementById('sgExcelPreviewStatusLabel');
    const confirmBtn = document.getElementById('sgBtnConfirmExcelImport');

    if (!previewSection || !tbody) return;

    previewSection.style.display = 'block';
    if (countBadge) countBadge.textContent = `${studentsList.length} طالب جاهز للاستيراد`;
    if (statusLabel) statusLabel.textContent = `تم التعرف على ملف: (${fileName}) وتنسيقه أبجدياً`;

    const previewSubset = studentsList.slice(0, 12);

    tbody.innerHTML = previewSubset
      .map((st, i) => `
        <tr>
          <td style="font-weight: 800; color: var(--text-dim);">${i + 1}</td>
          <td style="font-weight: 800; color: #38bdf8;">${escapeHtml(st.name)}</td>
          <td style="color: var(--text-muted);">${escapeHtml(st.seatNumber || (i + 1))}</td>
          <td>${st.m1 !== null ? st.m1 : '-'}</td>
          <td>${st.m2 !== null ? st.m2 : '-'}</td>
          <td>${st.midYear !== null ? st.midYear : '-'}</td>
          <td>${st.finalExam !== null ? st.finalExam : '-'}</td>
        </tr>
      `)
      .join('');

    if (studentsList.length > 12) {
      tbody.innerHTML += `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-dim); padding: 8px; font-style: italic;">
            ... و باقي الطلاب (${studentsList.length - 12} طالب إضافي) مرتبين أبجدياً بالكامل
          </td>
        </tr>
      `;
    }

    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.style.opacity = '1';
      confirmBtn.innerHTML = `<i class="fa-solid fa-file-import"></i> تأكيد استيراد (${studentsList.length}) طالب مرتبين أبجدياً 📥`;
    }
  }

  /**
   * Confirm Excel Import Action
   */
  window.sgConfirmExcelImport = function () {
    if (!activeRoster || !pendingExcelStudents || pendingExcelStudents.length === 0) return;

    const modeRadio = document.querySelector('input[name="sgExcelImportMode"]:checked');
    const mode = modeRadio ? modeRadio.value : 'replace';

    const sortCheck = document.getElementById('sgExcelAlphabeticalSortCheck');
    const shouldSort = sortCheck ? sortCheck.checked : true;

    if (mode === 'replace') {
      activeRoster.students = pendingExcelStudents;
    } else {
      // Append mode
      if (!Array.isArray(activeRoster.students)) activeRoster.students = [];
      activeRoster.students = activeRoster.students.concat(pendingExcelStudents);

      if (shouldSort) {
        activeRoster.students = sortStudentsArabicAlphabetical(activeRoster.students);
      }
      activeRoster.students.forEach((s, idx) => {
        s.seatNumber = String(idx + 1);
      });
    }

    window.sgCloseExcelImportModal();
    renderTable();
    renderStats();
    saveRosters(false);

    if (typeof window.showToast === 'function') {
      window.showToast(
        `تم استيراد وترتيب (${pendingExcelStudents.length}) طالب حسب حروف الأبجدية بالكامل (أ - ي) بنجاح 📥🎉`,
        'success'
      );
    }

    pendingExcelStudents = [];
  };

  /**
   * Initialize module
   */
  function initStudentGradesModule() {
    loadRosters();
    renderRosterMetaForm();
    renderRosterSelector();
    renderTable();
    renderStats();

    // Hook tab click to refresh if tab exists
    const tabBtn = document.getElementById('mainTabStudentGradesBtn');
    if (tabBtn) {
      tabBtn.addEventListener('click', () => {
        renderRosterMetaForm();
        renderTable();
        renderStats();
      });
    }
  }

  // Auto-init on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStudentGradesModule);
  } else {
    initStudentGradesModule();
  }

  /**
   * Save and navigate to Daily Report (حفظ السجل والانتقال للتقرير اليومي)
   */
  window.sgSaveAndGoToReport = function () {
    saveRosters(false);
    if (typeof window.showToast === 'function') {
      window.showToast('تم حفظ سجل درجات الطلاب بنجاح! جاري الانتقال إلى واجهة التقرير اليومي... 📋', 'success');
    }
    setTimeout(() => {
      if (typeof window.switchToReportTab === 'function') {
        window.switchToReportTab(true);
      }
    }, 350);
  };

  /**
   * Student Grades Archive Modal Implementation
   */
  window.sgOpenGradesArchiveModal = function () {
    const modal = document.getElementById('sgGradesArchiveModal');
    if (modal) {
      modal.classList.add('open');
      const searchInput = document.getElementById('sgArchiveSearchInput');
      if (searchInput) searchInput.value = '';
      window.sgRenderGradesArchiveList('');
    }
  };

  window.sgCloseGradesArchiveModal = function () {
    const modal = document.getElementById('sgGradesArchiveModal');
    if (modal) modal.classList.remove('open');
  };

  window.sgFilterArchiveRosters = function (query) {
    window.sgRenderGradesArchiveList(query);
  };

  window.sgRenderGradesArchiveList = function (filterQuery = '') {
    const container = document.getElementById('sgGradesArchiveList');
    const countLabel = document.getElementById('sgArchiveCountLabel');
    if (!container) return;

    const q = (filterQuery || '').trim().toLowerCase();
    const filtered = rosters.filter(r => {
      if (!q) return true;
      return (
        (r.name || '').toLowerCase().includes(q) ||
        (r.subject || '').toLowerCase().includes(q) ||
        (r.gradeLevel || '').toLowerCase().includes(q) ||
        (r.schoolName || '').toLowerCase().includes(q)
      );
    });

    if (countLabel) {
      countLabel.textContent = `${filtered.length} صفوف في الأرشيف (من إجمالي ${rosters.length})`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 12px; color: #64748b;">
          <i class="fa-solid fa-box-open" style="font-size: 2.2rem; color: #94a3b8; margin-bottom: 8px;"></i>
          <div style="font-weight: 800; font-size: 0.95rem; color: #334155;">لا توجد صفوف تطابق البحث</div>
          <small>يمكنك إنشاء صف جديد أو مسح كلمة البحث</small>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(r => {
      const students = r.students || [];
      const isActive = activeRoster && activeRoster.id === r.id;
      
      // Quick stats for this roster
      let passCount = 0;
      let evaluated = 0;
      students.forEach(st => {
        const m = calculateStudentMetrics(st);
        if (m.finalGrade !== null) {
          evaluated++;
          if (m.status === 'ناجح') passCount++;
        }
      });
      const passRate = evaluated > 0 ? Math.round((passCount / evaluated) * 100) : 0;
      const updatedDate = r.updatedAt ? new Date(r.updatedAt).toLocaleDateString('ar-IQ') : 'حديث';

      return `
        <div class="sg-archive-card ${isActive ? 'active-roster-card' : ''}" style="background: #ffffff; border: 1.5px solid ${isActive ? '#2563eb' : '#e2e8f0'}; border-radius: 12px; padding: 1rem 1.15rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 44px; height: 44px; border-radius: 10px; background: ${isActive ? 'rgba(37,99,235,0.15)' : 'rgba(245,158,11,0.15)'}; color: ${isActive ? '#2563eb' : '#d97706'}; display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">
              <i class="fa-solid fa-graduation-cap"></i>
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <h4 style="margin: 0; font-size: 0.96rem; font-weight: 900; color: #0f172a;">${escapeHtml(r.name || 'صف')}</h4>
                ${isActive ? '<span class="badge-tag" style="background: #dbeafe; color: #1e40af; font-weight: 800; font-size: 0.7rem;">الصف النشط حالياً 🟢</span>' : ''}
              </div>
              <div style="font-size: 0.78rem; color: #64748b; margin-top: 3px; display: flex; gap: 10px; flex-wrap: wrap;">
                <span><i class="fa-solid fa-book" style="color: #f59e0b;"></i> المادة: <b>${escapeHtml(r.subject || 'غير محدد')}</b></span>
                <span><i class="fa-solid fa-school" style="color: #2563eb;"></i> المدرسة: <b>${escapeHtml(r.schoolName || 'المدرسة')}</b></span>
                <span><i class="fa-solid fa-users" style="color: #059669;"></i> الطلاب: <b>${students.length}</b></span>
                <span><i class="fa-solid fa-percent" style="color: #059669;"></i> نسبة النجاح: <b>${passRate}%</b></span>
                <span><i class="fa-regular fa-clock"></i> آخر تعديل: <b>${updatedDate}</b></span>
              </div>
            </div>
          </div>

          <div class="sg-archive-card-actions">
            <button type="button" class="sg-archive-btn sg-archive-btn-open" onclick="window.sgSelectRosterFromArchive('${r.id}')">
              <i class="fa-solid fa-folder-open"></i>
              <span>فتح السجل</span>
            </button>
            <button type="button" class="sg-archive-btn" style="display: none !important; background: rgba(225,29,72,0.12); color: #e11d48; border-color: rgba(225,29,72,0.3); font-weight: 800;" onclick="window.sgExportRosterPdfFromArchive('${r.id}')" title="تنزيل كشف درجات هذا الصف بصيغة PDF مباشرة">
              <i class="fa-solid fa-file-pdf"></i>
              <span>تنزيل PDF</span>
            </button>
            <button type="button" class="sg-archive-btn sg-archive-btn-print" onclick="window.sgPrintRosterFromArchive('${r.id}')" title="طباعة رسمية A4 لهذا الصف">
              <i class="fa-solid fa-print"></i>
              <span>طباعة A4</span>
            </button>
            ${rosters.length > 1 ? `
              <button type="button" class="sg-archive-btn sg-archive-btn-delete" onclick="window.sgDeleteRosterFromArchive('${r.id}')" title="حذف هذا الصف من الأرشيف">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  };

  window.sgSelectRosterFromArchive = function (rosterId) {
    window.sgSelectRoster(rosterId);
    window.sgCloseGradesArchiveModal();
    if (typeof window.showToast === 'function') {
      window.showToast(`تم فتح سجل صف "${activeRoster ? activeRoster.name : ''}" بنجاح 📂`, 'success');
    }
  };

  window.sgExportRosterPdfFromArchive = function (rosterId) {
    if (rosterId !== (activeRoster ? activeRoster.id : '')) {
      window.sgSelectRoster(rosterId);
    }
    window.sgCloseGradesArchiveModal();
    window.sgExportLedgerPdf('full');
  };

  window.sgPrintRosterFromArchive = function (rosterId) {
    if (rosterId !== (activeRoster ? activeRoster.id : '')) {
      window.sgSelectRoster(rosterId);
    }
    window.sgCloseGradesArchiveModal();
    window.sgPrintOfficialLedger('full');
  };

  window.sgExportRosterFromArchive = function (rosterId) {
    if (rosterId !== (activeRoster ? activeRoster.id : '')) {
      window.sgSelectRoster(rosterId);
    }
    window.sgExportCsv();
  };

  window.sgDeleteRosterFromArchive = function (rosterId) {
    const target = rosters.find(r => r.id === rosterId);
    if (!target) return;
    if (!confirm(`هل أنت متأكد من حذف صف "${target.name}" نهائياً من الأرشيف؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      return;
    }
    rosters = rosters.filter(r => r.id !== rosterId);
    if (activeRoster && activeRoster.id === rosterId) {
      activeRoster = rosters[0] || null;
    }
    saveRosters(false);
    renderRosterSelector();
    renderRosterMetaForm();
    renderTable();
    renderStats();
    window.sgRenderGradesArchiveList('');
    if (typeof window.showToast === 'function') {
      window.showToast('تم حذف الصف من الأرشيف بنجاح 🗑️', 'info');
    }
  };

  window.reloadStudentGradesForCurrentUser = function (forceEmpty = false) {
    loadRosters(forceEmpty);
    renderRosterSelector();
    renderRosterMetaForm();
    renderTable();
    renderStats();
  };

  window.sgExportYearEndCertificates = function() {
    if (!activeRoster || !activeRoster.students || activeRoster.students.length === 0) {
      if (typeof window.showToast === 'function') {
        window.showToast('لا يوجد طلاب في السجل الحالي لتصدير شهاداتهم.', 'warning');
      }
      return;
    }

    const cur = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    const certBatch = {
      id: 'cert_batch_yearend_' + Date.now(),
      title: `شهادات درجات نهاية السنة - ${activeRoster.name || 'الصف'}`,
      schoolName: activeRoster.schoolName || (cur && cur.school) || 'ثانوية المتميزين للبنين',
      governorate: (cur && cur.governorate) || 'بغداد - الكرخ الثانية',
      gradeLevel: activeRoster.gradeLevel || 'الثالث المتوسط',
      section: activeRoster.section || 'أ',
      subject: activeRoster.subject || 'المناهج الدراسية العامة',
      academicYear: activeRoster.academicYear || '2024 - 2025 م',
      teacherName: activeRoster.teacherName || (cur && cur.name) || 'أستاذ المادة',
      principalName: 'إدارة المدرسة',
      certType: 'شهادة درجات نهاية السنة الرسمية',
      templateId: 'royalGold',
      orientation: 'portrait',
      showSeal: true,
      sealType: 'gold24k',
      showQr: true,
      issueDate: new Date().toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' }),
      updatedAt: new Date().toISOString(),
      students: activeRoster.students.map((st, idx) => {
        const m = calculateStudentMetrics(st);
        const finalSc = (m.finalGrade !== null && m.finalGrade !== undefined) 
          ? m.finalGrade 
          : (m.annualEffort !== null ? m.annualEffort : 95);
        return {
          id: 'cs_' + (st.id || (idx + 1)),
          seatNumber: st.seatNumber || `${10200 + idx + 1}`,
          name: st.name || `طالب ${idx + 1}`,
          gradeOrRank: m.status === 'ناجح' ? (idx === 0 ? 'المرتبة الأولى' : (idx === 1 ? 'المرتبة الثانية' : (idx === 2 ? 'المرتبة الثالثة' : m.appreciation))) : m.status,
          score: String(finalSc),
          customNote: `المعدل العام: ${finalSc}% - ${m.appreciation}`
        };
      })
    };

    if (window.CertificatesStudioModule && typeof window.CertificatesStudioModule.importBatchDirectly === 'function') {
      window.CertificatesStudioModule.importBatchDirectly(certBatch);
    } else {
      try {
        const key = window.getAccountStorageKey ? window.getAccountStorageKey('masar_teacher_cert_batches_v1') : 'masar_teacher_cert_batches_v1_guest';
        const raw = localStorage.getItem(key);
        let list = raw ? JSON.parse(raw) : [];
        list.unshift(certBatch);
        localStorage.setItem(key, JSON.stringify(list));
        const activeIdKey = window.getAccountStorageKey ? window.getAccountStorageKey('masar_teacher_cert_active_batch_id') : 'masar_teacher_cert_active_batch_id_guest';
        localStorage.setItem(activeIdKey, certBatch.id);
      } catch (e) {
        console.warn('Direct cert bridge save:', e);
      }
    }

    if (typeof window.switchToTab === 'function') {
      window.switchToTab('tab-certificates');
    }
    if (typeof window.showToast === 'function') {
      window.showToast(`تم تجهيز وتصدير شهادات نهاية السنة الرسمية لـ (${certBatch.students.length}) طالب بنجاح 🎓`, 'success');
    }
  };

  // Export module to global scope for debugging & integration
  window.StudentGradesModule = {
    init: initStudentGradesModule,
    reload: window.reloadStudentGradesForCurrentUser,
    save: saveRosters,
    getActiveRoster: () => activeRoster,
    getRosters: () => rosters
  };
})();
