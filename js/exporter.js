/**
 * exporter.js
 * Exporting, printing, Word doc generation, and exam variations (Model A / Model B)
 * Enhanced with: Dual Copy Printing (Student & Committee copies separated),
 * Definitions, Comparisons, and Question Branches.
 */

const ExamExporter = {
  /**
   * Helper to retrieve app state safely
   */
  getState: function() {
    return window.appState || (typeof appState !== 'undefined' ? appState : null);
  },

  /**
   * Opens print options modal or triggers print
   */
  printExam: function() {
    const modal = document.getElementById('printOptionsModal');
    if (modal) {
      modal.classList.add('open');
      modal.style.display = 'flex';
      modal.style.opacity = '1';
      modal.style.pointerEvents = 'auto';
    } else {
      this.printBothCopiesSeparated();
    }
  },

  closePrintModal: function() {
    const modal = document.getElementById('printOptionsModal');
    if (modal) {
      modal.classList.remove('open');
      modal.style.display = '';
      modal.style.opacity = '';
      modal.style.pointerEvents = '';
    }
  },

  ensurePreviewVisible: function() {
    const mainContainer = document.querySelector('.main-container');
    if (mainContainer) {
      if (mainContainer.classList.contains('preview-hidden')) {
        mainContainer.classList.remove('preview-hidden');
      }
      mainContainer.setAttribute('data-mobile-mode', 'preview');

      const toggleText = document.getElementById('togglePreviewText');
      const toggleIcon = document.getElementById('togglePreviewIcon');
      if (toggleText) toggleText.innerText = 'المحرر';
      if (toggleIcon) toggleIcon.className = 'fa-solid fa-pen-to-square';

      const bBtn = document.getElementById('mobileTabBuilderBtn');
      const pBtn = document.getElementById('mobileTabPreviewBtn');
      if (bBtn) bBtn.classList.remove('active');
      if (pBtn) pBtn.classList.add('active');
    }
    const state = this.getState();
    if (state && state.settings) {
      state.settings.previewVisible = true;
    }
  },

  /**
   * Generates clean HTML for a copy (student or committee) without modifying screen state
   */
  generatePaperCopyHTML: function(mode = 'student') {
    const state = this.getState();
    const paper = document.getElementById('examPaperDoc');
    if (!paper) return '';

    const currentMode = state ? state.viewMode : 'student';
    if (state) state.viewMode = mode;

    if (mode === 'answer_key') {
      document.body.classList.add('answer-key-mode');
      paper.classList.add('answer-key-mode');
      const badge = document.getElementById('paperAnswerKeyBadge');
      if (badge) {
        badge.style.display = 'block';
        badge.classList.add('show-in-print');
      }
    } else {
      document.body.classList.remove('answer-key-mode');
      paper.classList.remove('answer-key-mode');
      const badge = document.getElementById('paperAnswerKeyBadge');
      if (badge) {
        badge.style.display = 'none';
        badge.classList.remove('show-in-print');
      }
    }

    if (typeof window.renderPaperHeader === 'function') window.renderPaperHeader();
    if (typeof window.renderPaperQuestions === 'function') window.renderPaperQuestions();
    if (typeof window.applyPaperSettings === 'function') window.applyPaperSettings();

    let copyHTML = paper.innerHTML;

    if (mode === 'student') {
      const temp = document.createElement('div');
      temp.innerHTML = copyHTML;
      const b = temp.querySelector('#paperAnswerKeyBadge') || temp.querySelector('.paper-model-answer-banner');
      if (b) b.remove();
      temp.querySelectorAll('.paper-model-answer').forEach(el => el.remove());
      temp.querySelectorAll('.highlight-correct strong').forEach(el => el.remove());
      temp.querySelectorAll('.highlight-correct').forEach(el => el.classList.remove('highlight-correct'));
      copyHTML = temp.innerHTML;
    }

    // Restore original on-screen state
    if (state) state.viewMode = currentMode;
    if (currentMode === 'answer_key') {
      document.body.classList.add('answer-key-mode');
      paper.classList.add('answer-key-mode');
      const badge = document.getElementById('paperAnswerKeyBadge');
      if (badge) {
        badge.style.display = 'block';
        badge.classList.add('show-in-print');
      }
    } else {
      document.body.classList.remove('answer-key-mode');
      paper.classList.remove('answer-key-mode');
      const badge = document.getElementById('paperAnswerKeyBadge');
      if (badge) {
        badge.style.display = 'none';
        badge.classList.remove('show-in-print');
      }
    }

    if (typeof window.renderPaperHeader === 'function') window.renderPaperHeader();
    if (typeof window.renderPaperQuestions === 'function') window.renderPaperQuestions();
    if (typeof window.applyPaperSettings === 'function') window.applyPaperSettings();

    return copyHTML;
  },

  /**
   * Print Both Copies in a SINGLE Print Command separated by an automatic Page Break!
   * Non-destructive, isolated container avoids tab freezes & Chromium preview crashes!
   */
  printBothCopiesSeparated: function() {
    this.closePrintModal();
    this.ensurePreviewVisible();

    let dualPrint = document.getElementById('dualPrintContainer');
    if (!dualPrint) {
      dualPrint = document.createElement('div');
      dualPrint.id = 'dualPrintContainer';
      document.body.appendChild(dualPrint);
    }

    const state = this.getState() || {};
    const isLtr = (state.settings && state.settings.direction === 'ltr');
    const dirAttr = isLtr ? 'dir="ltr"' : 'dir="rtl"';
    const ltrClass = isLtr ? 'paper-ltr' : '';

    const studentHTML = this.generatePaperCopyHTML('student');
    const committeeHTML = this.generatePaperCopyHTML('answer_key');

    const studentBadge = isLtr
      ? 'Official Examination Paper ── [ Student Copy ]'
      : 'جمهورية العراق ــ وزارة التربية | ورقة الأسئلة الامتحانية ــ [ نسخة الطالب ]';

    const committeeBadge = isLtr
      ? '★ Examination Committee & Evaluation Center Copy (Approved Model Answers & Score Rubric) ★'
      : '★ نسخة اللجنة الامتحانية ومركز الفحص (الأجوبة النموذجية المعتمدة وسلّم توزيع الدرجات) ★';

    dualPrint.innerHTML = `
      <div class="dual-copy-section student-copy ${ltrClass}" ${dirAttr}>
        <div class="print-copy-badge student-badge" style="border: 1.5px solid #000; text-align: center; padding: 4px 12px; margin-bottom: 8px; font-weight: 800; font-size: 10pt; background: #fff;">
          ${studentBadge}
        </div>
        ${studentHTML}
      </div>
      <div class="print-page-break" style="page-break-before: always !important; break-before: page !important; height: 0 !important; margin: 0 !important; border: none !important;"></div>
      <div class="dual-copy-section committee-copy answer-key-mode ${ltrClass}" ${dirAttr}>
        <div class="print-copy-badge committee-badge" style="border: 2px solid #b45309; background: #fef3c7; color: #78350f; text-align: center; padding: 5px 12px; margin-bottom: 8px; font-weight: 800; font-size: 10pt;">
          ${committeeBadge}
        </div>
        ${committeeHTML}
      </div>
    `;

    if (typeof window.openPrintWindow === 'function') {
      window.openPrintWindow('ورقة الامتحان الوزاري المعتمد A4 (نسخة الطالب + نسخة اللجنة الامتحانية)', dualPrint.innerHTML, {
        pageSize: 'A4',
        orientation: 'portrait'
      });
      if (dualPrint) dualPrint.innerHTML = '';
    } else {
      document.body.classList.add('dual-print-active');
      setTimeout(() => { window.print(); }, 80);
    }
  },

  /**
   * Print Student Copy Only (ورقة الطالب بدون إجابات مع خانة الاسم)
   */
  printStudentCopy: function() {
    this.closePrintModal();
    this.ensurePreviewVisible();

    const state = this.getState() || {};
    const isLtr = (state.settings && state.settings.direction === 'ltr');
    const studentHTML = this.generatePaperCopyHTML('student');
    const badge = isLtr
      ? 'Official Examination Paper ── [ Student Copy ]'
      : 'جمهورية العراق ــ وزارة التربية | ورقة الأسئلة الامتحانية ــ [ نسخة الطالب ]';

    const fullContent = `
      <div class="exam-print-single-copy ${isLtr ? 'paper-ltr' : ''}" ${isLtr ? 'dir="ltr"' : 'dir="rtl"'}>
        <div class="print-copy-badge student-badge" style="border: 1.5px solid #000; text-align: center; padding: 4px 12px; margin-bottom: 8px; font-weight: 800; font-size: 10pt; background: #fff;">
          ${badge}
        </div>
        ${studentHTML}
      </div>
    `;

    if (typeof window.openPrintWindow === 'function') {
      window.openPrintWindow('ورقة الامتحان الرسمي A4 (نسخة الطالب)', fullContent, {
        pageSize: 'A4',
        orientation: 'portrait'
      });
    } else {
      setTimeout(() => { window.print(); }, 80);
    }
  },

  /**
   * Print Committee / Model Answer Copy Only (نسخة اللجنة الامتحانية والأجوبة النموذجية)
   */
  printCommitteeCopy: function() {
    this.closePrintModal();
    this.ensurePreviewVisible();

    const state = this.getState() || {};
    const isLtr = (state.settings && state.settings.direction === 'ltr');
    const committeeHTML = this.generatePaperCopyHTML('answer_key');
    const badge = isLtr
      ? '★ Examination Committee & Evaluation Center Copy (Approved Model Answers & Score Rubric) ★'
      : '★ نسخة اللجنة الامتحانية ومركز الفحص (الأجوبة النموذجية المعتمدة وسلّم توزيع الدرجات) ★';

    const fullContent = `
      <div class="exam-print-single-copy answer-key-mode ${isLtr ? 'paper-ltr' : ''}" ${isLtr ? 'dir="ltr"' : 'dir="rtl"'}>
        <div class="print-copy-badge committee-badge" style="border: 2px solid #b45309; background: #fef3c7; color: #78350f; text-align: center; padding: 5px 12px; margin-bottom: 8px; font-weight: 800; font-size: 10pt;">
          ${badge}
        </div>
        ${committeeHTML}
      </div>
    `;

    if (typeof window.openPrintWindow === 'function') {
      window.openPrintWindow('ورقة الامتحان الرسمي A4 (نسخة اللجنة الامتحانية والأجوبة النموذجية)', fullContent, {
        pageSize: 'A4',
        orientation: 'portrait'
      });
    } else {
      setTimeout(() => { window.print(); }, 80);
    }
  },

  /**
   * Exports the exam as an editable Microsoft Word (.doc) file with RTL support
   */
  exportToWord: function(examState, isAnswerKey = false) {
    this.closePrintModal();
    const state = examState || this.getState();
    if (!state || !state.header) return;

    const isLtr = (state.settings && state.settings.direction === 'ltr');
    const title = state.header.examTitle || (isLtr ? 'Exam_Paper' : 'اختبار_مدرسي');
    const filename = `${title}_${isAnswerKey ? (isLtr ? 'Committee_Answer_Key' : 'نسخة_اللجنة_الامتحانية') : (isLtr ? 'Student_Copy' : 'نسخة_الطالب')}.doc`;
    const settings = state.settings || {};
    const dir = isLtr ? 'ltr' : 'rtl';
    const align = isLtr ? 'left' : 'right';

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${title}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Cairo', 'Arial', sans-serif; direction: ${dir}; text-align: ${align}; margin: 15mm 20mm; font-size: 11pt; }
          .header-box { border: 2px solid #000; padding: 12px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          .meta-table td { padding: 4px; vertical-align: top; font-weight: bold; }
          .student-box { border: 1.5px solid #555; padding: 8px 12px; margin-bottom: 16px; background: #fbfbfb; }
          .section-title { background: #eee; border-${isLtr ? 'left' : 'right'}: 4px solid #000; padding: 6px 10px; font-weight: bold; font-size: 12pt; margin: 15px 0 10px 0; }
          .question-item { margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1.5px solid #000000; page-break-inside: avoid; }
          .q-title { font-weight: bold; font-size: 11.5pt; margin-bottom: 4px; }
          .mcq-table td { padding: 4px 8px; }
          .line-dotted { border-bottom: 1px dotted #888; height: 18px; margin-bottom: 8px; }
          .answer-key-box { background: #fef9c3; border: 1.5px solid #ca8a04; border-${isLtr ? 'left' : 'right'}: 4px solid #b45309; padding: 8px 12px; color: #713f12; font-weight: bold; margin-top: 6px; }
          .branch-item { margin: 8px 0; padding-${isLtr ? 'left' : 'right'}: 12px; border-${isLtr ? 'left' : 'right'}: 2px solid #2563eb; }
          .def-table td, .def-table th { border: 1px solid #777; padding: 6px 10px; }
          .compare-table td, .compare-table th { border: 1px solid #000; padding: 6px 10px; }
        </style>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
      </head>
      <body>
        <div class="header-box">
          <table class="meta-table">
            <tr>
              <td width="35%" align="${isLtr ? 'left' : 'right'}">
                ${state.header.country || (isLtr ? 'Republic of Iraq' : 'جمهورية العراق')}<br/>
                ${state.header.ministry || (isLtr ? 'Ministry of Education' : 'وزارة التربية')}<br/>
                ${state.header.school || ''}
              </td>
              <td width="30%" align="center">
                <h2 style="margin: 0; font-size: 14pt;">${state.header.examTitle || (isLtr ? 'School Examination' : 'امتحان مدرسي')}</h2>
                <div style="font-size: 10pt; color: #444; margin-top: 4px;">${state.header.term || ''} - ${state.header.year || ''}</div>
                ${isAnswerKey ? `<div style="background-color: #fef3c7; border: 2px solid #b45309; color: #78350f; font-weight: bold; padding: 6px 10px; margin-top: 6px; border-radius: 4px; text-align: center; font-size: 10pt;">${isLtr ? '★ Official Model Answer Key & Evaluation Rubric ★' : 'نسخة الأجوبة النموذجية الرسمية المعتمدة وتوزيع الدرجات ★ سري للغاية وللجنة التصحيح ★'}</div>` : ''}
              </td>
              <td width="35%" align="${isLtr ? 'right' : 'left'}" style="direction: ${dir};">
                ${isLtr ? `
                  Subject: ${state.header.subject || 'English'}<br/>
                  Grade: ${state.header.grade || ''}<br/>
                  Time: ${state.header.time || ''}<br/>
                  Teacher: ${state.header.teacher || ''}
                ` : `
                  المادة: ${state.header.subject || ''}<br/>
                  الصف: ${state.header.grade || ''}<br/>
                  الزمن: ${state.header.time || ''}<br/>
                  واضع الأسئلة: ${state.header.teacher || ''}
                `}
              </td>
            </tr>
          </table>
        </div>

        ${!isAnswerKey ? `
        <div class="student-box">
          <table style="width: 100%; border: none;">
            <tr>
              <td>${isLtr ? "Student's Full Name: ............................................................................" : 'اسم الطالب الرباعي: ............................................................................'}</td>
              <td>${isLtr ? 'Exam Roll No: ....................' : 'رقم الجلوس: ....................'}</td>
              <td>${isLtr ? 'Hall: .............' : 'القاعة: .............'}</td>
            </tr>
          </table>
        </div>
        ` : ''}

        ${state.header.instructions && !isAnswerKey ? `
        <div style="border-${isLtr ? 'left' : 'right'}: 3px solid #2563eb; background: #f0f7ff; padding: 6px 12px; margin-bottom: 15px; font-size: 10pt;">
          <strong>${isLtr ? 'Exam Instructions & Notes:' : 'ملاحظات وتوجيهات الاختبار:'}</strong><br/>
          ${state.header.instructions.replace(/\n/g, '<br/>')}
        </div>
        ` : ''}

        <div class="questions-body">
          ${state.questions.map((q, idx) => `
            <div class="question-item">
              <div class="q-title">
                ${isLtr ? `Question (${idx + 1}):` : `السؤال (${idx + 1}):`} ${q.title ? `<b>${window.formatMathText ? window.formatMathText(q.title) : q.title}</b>` : ''}
                ${!isAnswerKey ? (
                  (q.title && q.text && q.text !== q.title) ? `<br/>${window.formatMathText ? window.formatMathText(q.text.replace(/\n/g, '<br/>')) : q.text.replace(/\n/g, '<br/>')}` : (!q.title ? `<br/>${window.formatMathText ? window.formatMathText(q.text || '') : (q.text || '')}` : '')
                ) : ''}
                <span style="font-size: 9.5pt; color: #555; font-weight: normal;">[ ${isLtr ? 'Marks' : 'الدرجة'}: ${q.score || 1} ]</span>
              </div>

              <!-- Question Sub-branches if any -->
              ${(q.branches && q.branches.length > 0) ? `
                <div style="margin: 8px 0;">
                  ${q.branches.map((b, bIdx) => `
                    <div class="branch-item">
                      <b>${b.title || (isLtr ? `Branch (${String.fromCharCode(65 + bIdx)})` : `الفرع (${String.fromCharCode(1571 + bIdx)})`)}:</b> ${isAnswerKey ? '' : (b.text || '')}
                      ${b.score ? `<span style="font-size: 9pt; color: #666;"> [${b.score} ${isLtr ? 'Marks' : 'درجة'}]</span>` : ''}
                      ${isAnswerKey ? `
                        <div class="answer-key-box" style="margin-top: 4px; font-size: 9.5pt;">
                          <b>${isLtr ? 'Branch Solution:' : 'حل الفرع:'}</b> ${b.modelAnswer ? b.modelAnswer : (isLtr ? '(Approved model answer)' : '(راجع نموذج الإجابة)')}
                        </div>
                      ` : ''}
                    </div>
                  `).join('')}
                </div>
              ` : ''}

              <!-- MCQ Options -->
              ${q.type === 'mcq' && q.options ? (
                isAnswerKey ? `
                  <div class="answer-key-box" style="margin-top: 6px;">
                    <b>${isLtr ? '[ Approved Model Answer ]:' : '[ الإجابة النموذجية المعتمدة ]:'}</b>
                    ${(() => {
                      const letters = isLtr ? ['A', 'B', 'C', 'D', 'E'] : ['أ', 'ب', 'ج', 'د', 'هـ'];
                      const cOpt = q.options.find(o => o.isCorrect);
                      const cIdx = q.options.findIndex(o => o.isCorrect);
                      const cLetter = cIdx !== -1 ? (letters[cIdx] || (cIdx + 1)) : '';
                      return cOpt ? `${isLtr ? 'Option' : 'الخيار'} (${cLetter}) : ${cOpt.text}` : (isLtr ? '(No correct answer specified)' : '(لم يتم تحديد الخيار الصحيح)');
                    })()}
                    ${q.explanation ? `<br/><small><b>${isLtr ? 'Explanation:' : 'التعليل:'}</b> ${q.explanation}</small>` : ''}
                  </div>
                ` : `
                  <table class="mcq-table" style="margin-top: 6px;">
                    <tr>
                      ${q.options.map((opt, oIdx) => `
                        <td>(${isLtr ? String.fromCharCode(65 + oIdx) : String.fromCharCode(1571 + oIdx)}) ${opt.text}</td>
                      `).join('')}
                    </tr>
                  </table>
                `
              ) : ''}

              <!-- Matching Pairs -->
              ${q.type === 'matching' && q.pairs ? (
                isAnswerKey ? `
                  <div class="answer-key-box" style="margin-top: 8px;">
                    <b>${isLtr ? '[ Approved Matching Solution ]:' : '[ التوافق والربط النموذجي المعتمد ]:'}</b><br/>
                    ${q.pairs.map((p, pIdx) => {
                      const letter = isLtr ? String.fromCharCode(65 + pIdx) : String.fromCharCode(1571 + pIdx);
                      return `(${pIdx + 1}) ${p.left} ➔ (${letter}) ${p.right}`;
                    }).join(isLtr ? ' , ' : ' ، ')}
                  </div>
                ` : `
                  <table border="1" cellpadding="5" style="border-collapse: collapse; margin-top: 8px;">
                    <tr style="background: #f2f2f2;"><th>${isLtr ? 'Column (A)' : 'العمود (أ)'}</th><th>${isLtr ? 'Column (B)' : 'العمود (ب)'}</th></tr>
                    ${q.pairs.map((p, pIdx) => `
                      <tr>
                        <td>(${pIdx + 1}) ${p.left}</td>
                        <td>( &nbsp; ) ${p.right}</td>
                      </tr>
                    `).join('')}
                  </table>
                `
              ) : ''}

              <!-- Definitions (تعاريف بنمط 1_ 2_ تعريف بصف الثاني بدون خطوط) -->
              ${q.type === 'definitions' && q.terms ? (
                isAnswerKey ? `
                  <div class="answer-key-box" style="margin-top: 6px;">
                    <b>${isLtr ? '[ Model Definitions & Marking Scheme ]:' : '[ الأجوبة النموذجية للتعاريف وسلّم توزيع الدرجات ]:'}</b>
                    ${q.terms.map((t, tIdx) => `
                      <div style="margin-top: 3px;">
                        <b>${tIdx + 1}_ ${t.term || t.word || (isLtr ? `Term ${tIdx + 1}` : `المصطلح ${tIdx + 1}`)}:</b> ${t.definition || (isLtr ? '(Approved definition)' : '(التعريف المعتمد)')}
                      </div>
                    `).join('')}
                  </div>
                ` : `
                  <div style="margin-top: 4px; line-height: 1.8;">
                    ${q.terms.map((t, tIdx) => `
                      <span style="display: inline-block; ${isLtr ? 'margin-right: 22px;' : 'margin-left: 22px;'} font-size: 11pt;">
                        <b>${tIdx + 1}_</b> <b>${t.term || t.word || (isLtr ? `Term ${tIdx + 1}` : `المصطلح ${tIdx + 1}`)}</b>
                      </span>
                    `).join('')}
                  </div>
                `
              ) : ''}

              <!-- Comparisons (مقارنات) -->
              ${q.type === 'comparisons' ? `
                <table class="compare-table" style="margin-top: 6px;">
                  <tr style="background: #e5e7eb;">
                    <th width="30%">${isLtr ? 'Comparison Point' : 'وجه المقارنة'}</th>
                    <th>${q.item1 || (isLtr ? 'Item 1' : 'الطرف الأول')}</th>
                    <th>${q.item2 || (isLtr ? 'Item 2' : 'الطرف الثاني')}</th>
                  </tr>
                  ${(q.aspects && q.aspects.length > 0) ? q.aspects.map(asp => `
                    <tr>
                      <td><b>${asp.aspect || (isLtr ? 'Point' : 'وجه المقارنة')}</b></td>
                      <td>${isAnswerKey ? (asp.item1Val || '') : ''}</td>
                      <td>${isAnswerKey ? (asp.item2Val || '') : ''}</td>
                    </tr>
                  `).join('') : `
                    <tr>
                      <td>${isLtr ? 'Comparison' : 'وجه الشبه والاختلاف'}</td>
                      <td>${isAnswerKey ? (q.modelAnswer || '') : ''}</td>
                      <td>${isAnswerKey ? (q.modelAnswer || '') : ''}</td>
                    </tr>
                  `}
                </table>
              ` : ''}

              <!-- Answer Lines for essay -->
              ${(q.type === 'essay' || q.type === 'reasoning' || q.type === 'math_problem') && !isAnswerKey && (settings.showAnswerLines !== false) && (q.linesCount > 0) ? `
                <div style="margin: 8px 0;">
                  ${Array.from({ length: q.linesCount }).map(() => '<div class="line-dotted"></div>').join('')}
                </div>
              ` : ''}

              <!-- Model Answer Box -->
              ${isAnswerKey && (q.modelAnswer || q.explanation || q.correction || q.answers) ? `
                <div class="answer-key-box" style="margin-top: 6px;">
                  <strong>${isLtr ? 'Official Model Answer & Marking Rubric:' : 'نموذج الحل الوزاري المعتمد وتوزيع الدرجات:'}</strong><br/>
                  ${q.modelAnswer || q.explanation || q.correction || (q.answers ? q.answers.join(isLtr ? ', ' : '، ') : '')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>

        <div style="margin-top: 30px; text-align: center; border-top: 1px solid #aaa; padding-top: 10px; font-weight: bold; font-size: 11pt;">
          ${isLtr ? '— Best wishes for success and distinction to all students —' : 'مع تمنياتنا لجميع الطلبة بالتوفيق والنجاح الدائم'}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], {
      type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Generates Exam Variation (Model A or Model B with shuffled questions and options)
   */
  createModelVariation: function(originalQuestions, modelName = 'نموذج (ب)') {
    const cloned = JSON.parse(JSON.stringify(originalQuestions));
    
    // Shuffle questions
    for (let i = cloned.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
    }

    // Shuffle options inside MCQ
    cloned.forEach(q => {
      if (q.type === 'mcq' && q.options) {
        for (let i = q.options.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [q.options[i], q.options[j]] = [q.options[j], q.options[i]];
        }
      }
    });

    return cloned;
  },

  /**
   * Export entire exam config as JSON for backup or exchange
   */
  exportJSON: function(examState) {
    const state = examState || this.getState();
    if (!state) return;
    const filename = `${(state.header && state.header.examTitle) || 'اختبار'}_backup.json`;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    a.remove();
  },

  /**
   * Direct PDF download without opening print interface or switching tabs
   */
  exportPDF: async function(options) {
    options = options || {};
    const state = this.getState();
    const isLtr = (state && state.settings && state.settings.direction === 'ltr');
    const rawTitle = (state && state.header && state.header.examTitle) || 'امتحان_مسار_المعلم';
    const safeTitle = rawTitle.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'امتحان_مسار_المعلم';
    const filename = options.filename || options.path || `${safeTitle}.pdf`;

    const paper = document.getElementById('examPaperDoc');
    if (!paper) {
      throw new Error('لم يتم العثور على ورقة الامتحان للتصدير.');
    }

    this.ensurePreviewVisible();
    if (typeof window.renderPaperQuestions === 'function') window.renderPaperQuestions();
    if (typeof window.applyPaperSettings === 'function') window.applyPaperSettings();

    if (window.MasarPDF && typeof window.MasarPDF.exportExam === 'function') {
      return await window.MasarPDF.exportExam(options);
    }

    if (typeof window.exportToPDF === 'function') {
      return await window.exportToPDF(paper, {
        filename: filename,
        format: options.format || 'a4',
        orientation: options.orientation || 'portrait',
        margin: options.margin || 8,
        scale: options.scale || 2
      });
    } else {
      if (typeof showToast === 'function') {
        showToast('تعذر العثور على محرك تصدير الـ PDF في الصفحة.', 'error');
      }
      throw new Error('محرك تصدير PDF غير متاح.');
    }
  }
};

// Expose ExamExporter on window globally
window.ExamExporter = ExamExporter;

// Global fallback before print handler ensuring preview and paper are prepared
if (typeof window !== 'undefined') {
  window.addEventListener('beforeprint', () => {
    if (window.ExamExporter && typeof window.ExamExporter.ensurePreviewVisible === 'function') {
      window.ExamExporter.ensurePreviewVisible();
    }
    if (typeof window.renderPaperQuestions === 'function') {
      window.renderPaperQuestions();
    }
    if (typeof window.applyPaperSettings === 'function') {
      window.applyPaperSettings();
    }
  });
}

