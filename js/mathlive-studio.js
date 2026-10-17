/**
 * مسار المعلم | MathLive Studio Engine
 * أقوى وأحدث محرر تفاعلي لمسائل ومعادلات الرياضيات والفيزياء والكيمياء (CortexJS MathLive)
 * دعم كامل لمناهج الثالث متوسط والسادس الإعدادي (العلمي) الوزارية العراقية
 */

(function() {
  'use strict';

  // 1. Configure MathLive fonts directory to offline local fonts
  if (window.MathfieldElement) {
    try {
      window.MathfieldElement.fontsDirectory = 'js/fonts';
    } catch (e) {
      console.warn('MathLive fontsDirectory init:', e);
    }
  }

  // 2. Iraqi Ministerial Curated Presets
  const IRAQI_MATH_PRESETS = {
    presets_g9: [
      {
        title: 'قانون الدستور (حل المعادلة التربيعية)',
        sub: 'الثالث متوسط - الفصل الثالث',
        latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}'
      },
      {
        title: 'تبسيط ضرب وقسمة المقادير الجبرية النسبية',
        sub: 'الثالث متوسط - الفصل الثاني',
        latex: '\\frac{x^2 - 4}{x^2 + 5x + 6} \\times \\frac{x + 3}{x - 2}'
      },
      {
        title: 'جمع وطرح الكسور الجبرية بتوحيد المقامات',
        sub: 'الثالث متوسط - الفصل الثاني',
        latex: '\\frac{7x - 14}{x^2 - 4} + \\frac{5}{x + 2}'
      },
      {
        title: 'تبسيط الجذور والعمليات على الأعداد الحقيقية',
        sub: 'الثالث متوسط - الفصل الأول',
        latex: '\\sqrt{12}(\\sqrt{3} - \\sqrt{8}) - 6'
      },
      {
        title: 'المتباينة المركبة ومتباينة القيمة المطلقة',
        sub: 'الثالث متوسط - الفصل الأول',
        latex: '|2x - 5| \\le 7 \\iff -7 \\le 2x - 5 \\le 7'
      },
      {
        title: 'الحد العام للمتتابعة الحسابية',
        sub: 'الثالث متوسط - الفصل الأول',
        latex: 'u_n = a + (n - 1)d'
      },
      {
        title: 'قانون المسافة بين نقطتين في المستوي الإحداثي',
        sub: 'الثالث متوسط - الفصل الرابع',
        latex: 'd = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}'
      },
      {
        title: 'قانون ميل المستقيم ومعادلته',
        sub: 'الثالث متوسط - الفصل الرابع',
        latex: 'm = \\frac{y_2 - y_1}{x_2 - x_1} \\quad , \\quad y - y_1 = m(x - x_1)'
      },
      {
        title: 'تركيب التطبيقات f بعد g',
        sub: 'الثالث متوسط - الفصل الأول',
        latex: '(f \\circ g)(x) = f(g(x)) = 2(x^2) + 1'
      },
      {
        title: 'حل نظام معادلتين بالحذف والتعويض',
        sub: 'الثالث متوسط - الفصل الثالث',
        latex: '\\begin{cases} 2x + y = 7 \\\\ x - y = 2 \\end{cases}'
      }
    ],
    presets_g12: [
      {
        title: 'مبرهنة ديموافر De Moivre Theorem',
        sub: 'السادس العلمي - الفصل الأول (الأعداد المركبة)',
        latex: 'z^n = [r(\\cos\\theta + i\\sin\\theta)]^n = r^n(\\cos(n\\theta) + i\\sin(n\\theta))'
      },
      {
        title: 'نتيجة مبرهنة ديموافر (الجذور النونية للعدد المركب)',
        sub: 'السادس العلمي - الفصل الأول',
        latex: 'z^{\\frac{1}{n}} = r^{\\frac{1}{n}} \\left[ \\cos\\left(\\frac{\\theta + 2k\\pi}{n}\\right) + i\\sin\\left(\\frac{\\theta + 2k\\pi}{n}\\right) \\right]'
      },
      {
        title: 'قسمة وتبسيط الأعداد المركبة بالمرافق',
        sub: 'السادس العلمي - الفصل الأول',
        latex: '\\frac{3 + i}{2 - i} = \\frac{(3 + i)(2 + i)}{(2 - i)(2 + i)} = \\frac{5 + 5i}{5} = 1 + i'
      },
      {
        title: 'معادلة القطع الناقص والعلاقة المساعدة (الذهبية)',
        sub: 'السادس العلمي - الفصل الثاني (القطوع المخروطية)',
        latex: '\\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1 \\quad , \\quad a^2 = b^2 + c^2'
      },
      {
        title: 'معادلة القطع الزائد والبؤرتين',
        sub: 'السادس العلمي - الفصل الثاني',
        latex: '\\frac{x^2}{a^2} - \\frac{y^2}{b^2} = 1 \\quad , \\quad c^2 = a^2 + b^2'
      },
      {
        title: 'معادلة القطع المكافئ ودليله',
        sub: 'السادس العلمي - الفصل الثاني',
        latex: 'y^2 = 4px \\quad \\implies \\quad F(p, 0) \\quad , \\quad x = -p'
      },
      {
        title: 'مبرهنة القيمة المتوسطة ومبرهنة رول',
        sub: 'السادس العلمي - الفصل الثالث (تطبيقات التفاضل)',
        latex: 'f\'(c) = \\frac{f(b) - f(a)}{b - a} \\quad , \\quad c \\in (a, b)'
      },
      {
        title: 'تكامل الدوال المثلثية والتربيعية',
        sub: 'السادس العلمي - الفصل الرابع (التكامل)',
        latex: '\\int \\sin^2(x) \\, dx = \\frac{1}{2} \\int (1 - \\cos 2x) \\, dx = \\frac{x}{2} - \\frac{\\sin 2x}{4} + C'
      },
      {
        title: 'تكامل محدد بالدالة والمشتقة',
        sub: 'السادس العلمي - الفصل الرابع',
        latex: '\\int_{0}^{2} x \\sqrt{x^2 + 1} \\, dx = \\frac{1}{2} \\int_{0}^{2} (x^2 + 1)^{\\frac{1}{2}} (2x) \\, dx'
      },
      {
        title: 'معادلة تفاضلية اعتيادية مفصولة المتغيرات',
        sub: 'السادس العلمي - الفصل الخامس (المعادلات التفاضلية)',
        latex: '\\frac{dy}{dx} = 2x e^{-y} \\implies e^y dy = 2x dx \\implies e^y = x^2 + C'
      }
    ],
    presets_advanced: [
      {
        title: 'مصفوفة مربعة 2x2',
        sub: 'المصفوفات والمحددات',
        latex: '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}'
      },
      {
        title: 'محدد مصفوفة ثنائية وقيمته',
        sub: 'المحددات',
        latex: '\\Delta = \\begin{vmatrix} 3 & -1 \\\\ 2 & 4 \\end{vmatrix} = (3)(4) - (-1)(2) = 14'
      },
      {
        title: 'مصفوفة ثلاثية 3x3',
        sub: 'المصفوفات الموسعة',
        latex: '\\begin{bmatrix} a_{11} & a_{12} & a_{13} \\\\ a_{21} & a_{22} & a_{23} \\\\ a_{31} & a_{32} & a_{33} \\end{bmatrix}'
      },
      {
        title: 'غاية دالة كسرية وتحليل فرق مربعين',
        sub: 'الغايات والاستمرارية',
        latex: '\\lim_{x \\to 2} \\frac{x^2 - 4}{x - 2} = \\lim_{x \\to 2} (x + 2) = 4'
      },
      {
        title: 'غاية الدوال الدائرية الشهيرة',
        sub: 'الغايات المثلثية',
        latex: '\\lim_{x \\to 0} \\frac{\\sin ax}{bx} = \\frac{a}{b} \\quad , \\quad \\lim_{x \\to 0} \\frac{\\tan ax}{x} = a'
      },
      {
        title: 'مشتقة ضرب وقسمة دالتين',
        sub: 'قواعد الاشتقاق',
        latex: '\\frac{d}{dx}[u \\cdot v] = u \\frac{dv}{dx} + v \\frac{du}{dx} \\quad , \\quad \\frac{d}{dx}\\left[\\frac{u}{v}\\right] = \\frac{v u\' - u v\'}{v^2}'
      },
      {
        title: 'مجموع متسلسلة لانهائية متقاربة',
        sub: 'المتسلسلات والتفاضل المتقدم',
        latex: '\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}'
      },
      {
        title: 'معادلة كيميائية حرارية متزنة (قانون هيس)',
        sub: 'الكيمياء الوزارية',
        latex: '\\text{CH}_{4(g)} + 2\\text{O}_{2(g)} \\longrightarrow \\text{CO}_{2(g)} + 2\\text{H}_2\\text{O}_{(l)} \\quad \\Delta H_r^\\circ = -890 \\text{ kJ/mol}'
      }
    ]
  };

  /**
   * Render presets grid into container
   */
  function renderPresetsGrid(gridId, presets) {
    const el = document.getElementById(gridId);
    if (!el) return;
    el.innerHTML = presets.map((p, idx) => `
      <div class="mathlive-preset-card" onclick="window.applyPresetToMathLive('${gridId}', ${idx})" title="انقر لتحميل المعادلة في MathLive للتعديل">
        <div class="preset-card-header">
          <span class="preset-card-title">${p.title}</span>
          <span class="preset-card-sub">${p.sub}</span>
        </div>
        <div class="preset-card-render" dir="ltr">
          ${typeof window.renderLatexBlock === 'function' ? window.renderLatexBlock(p.latex, false) : `<code>${p.latex}</code>`}
        </div>
      </div>
    `).join('');
  }

  /**
   * Apply preset to active standalone MathLive field
   */
  window.applyPresetToMathLive = function(category, index) {
    const preset = IRAQI_MATH_PRESETS[category] ? IRAQI_MATH_PRESETS[category][index] : null;
    if (!preset) return;
    const mf = document.getElementById('standaloneMathfield');
    if (mf) {
      mf.value = preset.latex;
      mf.focus();
      if (typeof window.updateStandaloneMathPreview === 'function') {
        window.updateStandaloneMathPreview();
      }
      if (typeof window.showToast === 'function') {
        window.showToast(`تم تحميل نموذج: "${preset.title}" في المحرر ⚡`, 'info');
      }
    }
  };

  /**
   * Switch Presets Tab in Standalone Modal
   */
  window.switchMathLivePresetsTab = function(tabId, btn) {
    document.querySelectorAll('#mathlivePresetNav .preset-chip').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    ['presets_g9', 'presets_g12', 'presets_advanced'].forEach(id => {
      const g = document.getElementById(id);
      if (g) {
        g.style.display = (id === tabId) ? 'grid' : 'none';
      }
    });
  };

  /**
   * Update Standalone Modal KaTeX Live Preview
   */
  window.updateStandaloneMathPreview = function() {
    const mf = document.getElementById('standaloneMathfield');
    const previewEl = document.getElementById('standaloneMathPreview');
    if (!previewEl) return;
    const val = mf ? mf.value.trim() : '';
    if (!val) {
      previewEl.innerHTML = '<span style="color: #64748b; font-size: 0.85rem;">(اكتب المعادلة أو اختر قالباً أعلاه لمعاينتها فوراً بالطريقة الوزارية)</span>';
      return;
    }
    if (typeof window.renderLatexBlock === 'function') {
      previewEl.innerHTML = window.renderLatexBlock(val, true);
    } else if (typeof window.katex !== 'undefined' && typeof window.katex.renderToString === 'function') {
      try {
        previewEl.innerHTML = window.katex.renderToString(val, { displayMode: true, throwOnError: false });
      } catch (e) {
        previewEl.innerText = val;
      }
    } else {
      previewEl.innerText = val;
    }
  };

  /**
   * Open Standalone MathLive Modal
   */
  window.openStandaloneMathLiveModal = function(initialLatex = null) {
    const modal = document.getElementById('mathliveStudioModal');
    if (!modal) return;

    // Render presets if not rendered
    renderPresetsGrid('presets_g9', IRAQI_MATH_PRESETS.presets_g9);
    renderPresetsGrid('presets_g12', IRAQI_MATH_PRESETS.presets_g12);
    renderPresetsGrid('presets_advanced', IRAQI_MATH_PRESETS.presets_advanced);

    const mf = document.getElementById('standaloneMathfield');
    if (mf) {
      if (initialLatex && typeof initialLatex === 'string') {
        mf.value = initialLatex.trim();
      } else if (!mf.value || mf.value.trim() === '') {
        mf.value = 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}';
      }
      setTimeout(() => {
        mf.focus();
        window.updateStandaloneMathPreview();
      }, 100);

      // Attach input event once
      if (!mf._mathliveBound) {
        mf.addEventListener('input', () => {
          window.updateStandaloneMathPreview();
        });
        mf._mathliveBound = true;
      }
    }

    modal.classList.add('open');
  };

  /**
   * Close Standalone MathLive Modal
   */
  window.closeStandaloneMathLiveModal = function() {
    const modal = document.getElementById('mathliveStudioModal');
    if (modal) modal.classList.remove('open');
    if (window.mathVirtualKeyboard && typeof window.mathVirtualKeyboard.hide === 'function') {
      window.mathVirtualKeyboard.hide();
    }
  };

  /**
   * Toggle MathLive Virtual Keyboard
   */
  window.toggleMathLiveVirtualKeyboard = function(fieldId) {
    const mf = document.getElementById(fieldId);
    if (mf) mf.focus();

    if (window.mathVirtualKeyboard) {
      if (typeof window.mathVirtualKeyboard.toggle === 'function') {
        window.mathVirtualKeyboard.toggle();
      } else if (window.mathVirtualKeyboard.visible) {
        window.mathVirtualKeyboard.hide();
      } else {
        window.mathVirtualKeyboard.show();
      }
    } else {
      if (typeof window.showToast === 'function') {
        window.showToast('لوحة المفاتيح الرياضية تتفعل تلقائياً عند النقر داخل المحرر ⌨️', 'info');
      }
    }
  };

  /**
   * Clear MathLive field
   */
  window.clearMathLiveField = function(fieldId) {
    const mf = document.getElementById(fieldId);
    if (mf) {
      mf.value = '';
      mf.focus();
      if (fieldId === 'standaloneMathfield') {
        window.updateStandaloneMathPreview();
      } else if (typeof window.updateModalMathPreview === 'function') {
        window.updateModalMathPreview();
      }
      if (typeof window.showToast === 'function') {
        window.showToast('تم مسح المحرر 🧹', 'info');
      }
    }
  };

  /**
   * Copy MathLive LaTeX to clipboard
   */
  window.copyMathLiveLatex = function(fieldId) {
    const mf = document.getElementById(fieldId);
    if (!mf || !mf.value) {
      if (typeof window.showToast === 'function') {
        window.showToast('المحرر فارغ حالياً!', 'warning');
      }
      return;
    }
    const val = mf.value;
    navigator.clipboard.writeText(val).then(() => {
      if (typeof window.showToast === 'function') {
        window.showToast('تم نسخ كود LaTeX إلى الحافظة بنجاح 📋✨', 'success');
      }
    }).catch(() => {
      // Fallback prompt
      prompt('انسخ كود LaTeX:', val);
    });
  };

  /**
   * Set Preset into specific MathLive field
   */
  window.setMathLivePreset = function(fieldId, latexFormula) {
    const mf = document.getElementById(fieldId);
    if (!mf) return;
    mf.value = latexFormula;
    mf.focus();
    if (fieldId === 'standaloneMathfield') {
      window.updateStandaloneMathPreview();
    } else if (typeof window.updateModalMathPreview === 'function') {
      window.updateModalMathPreview();
    }
    if (typeof window.showToast === 'function') {
      window.showToast('تم إدراج النموذج في محرر MathLive ⚡', 'info');
    }
  };

  /**
   * Insert Standalone Math into currently opened question modal
   */
  window.insertStandaloneMathIntoActiveQuestion = function() {
    const mf = document.getElementById('standaloneMathfield');
    const val = mf ? mf.value.trim() : '';
    if (!val) {
      if (typeof window.showToast === 'function') {
        window.showToast('المحرر فارغ! اكتب مسألة أو اختر قالباً أولاً', 'warning');
      }
      return;
    }

    const qText = document.getElementById('modalQText');
    if (!qText) {
      if (typeof window.showToast === 'function') {
        window.showToast('نافذة تعديل السؤال غير مفتوحة حالياً! يمكنك استخدام زر (إنشاء سؤال مسألة رياضية فوراً) أدناه ⬇️', 'info');
      }
      return;
    }

    // Insert formatted into question
    const snippet = `\n$$${val}$$\n`;
    const start = qText.selectionStart ?? qText.value.length;
    const end = qText.selectionEnd ?? qText.value.length;
    const old = qText.value;
    qText.value = old.substring(0, start) + snippet + old.substring(end);
    qText.selectionStart = qText.selectionEnd = start + snippet.length;

    window.closeStandaloneMathLiveModal();

    if (typeof window.updateModalMathPreview === 'function') {
      window.updateModalMathPreview();
    }
    if (typeof window.showToast === 'function') {
      window.showToast('تم إدراج المعادلة في السؤال المفتوح بنجاح 📐✨', 'success');
    }
  };

  /**
   * Directly create a new Math Problem question on the exam paper from MathLive
   */
  window.createMathProblemQuestionFromMathLive = function() {
    const mf = document.getElementById('standaloneMathfield');
    const val = mf ? mf.value.trim() : '';
    if (!val) {
      if (typeof window.showToast === 'function') {
        window.showToast('يرجى كتابة معادلة أو اختيار مسألة من النماذج أولاً!', 'warning');
      }
      return;
    }

    if (!window.appState || !Array.isArray(window.appState.questions)) {
      if (typeof window.showToast === 'function') {
        window.showToast('تعذر العثور على ورقة الاختبار الحالية!', 'error');
      }
      return;
    }

    const newId = typeof window.generateId === 'function' ? window.generateId() : ('q_' + Date.now());
    const qCount = window.appState.questions.length + 1;

    const newQuestion = {
      id: newId,
      type: 'math_problem',
      subject: 'math',
      customLabel: `السؤال (${qCount}):`,
      title: 'مسألة ومعادلة رياضية وزارية',
      text: `حل المسألة الرياضية الآتية أو جد ناتج المقدار:\n$$${val}$$`,
      modelAnswer: `خطوات الحل المعتمدة للمعادلة:\n1. تبسيط المقدار وترتيب الحدود.\n2. التعويض أو التحليل وإيجاد مجموعة الحل.`,
      score: 5,
      bloom: 'تطبيق',
      difficulty: 'متوسط',
      fontSize: 100,
      linesCount: 4
    };

    window.appState.questions.push(newQuestion);

    if (typeof window.saveStateToStorage === 'function') {
      window.saveStateToStorage();
    }
    if (typeof window.renderAll === 'function') {
      window.renderAll();
    }

    window.closeStandaloneMathLiveModal();

    if (typeof window.showToast === 'function') {
      window.showToast(`تمت إضافة السؤال (${qCount}) مسألة رياضية إلى ورقة الامتحان بنجاح 📐🎉`, 'success');
    }

    // Smooth scroll down to questions
    const cardEl = document.querySelector(`[data-id="${newId}"]`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  /**
   * Open MathLive for active question in Question Modal
   */
  window.openMathLiveForQuestion = function() {
    const qModal = document.getElementById('questionModal');
    const isQModalOpen = qModal && qModal.classList.contains('open');

    if (!isQModalOpen) {
      // Question modal is closed, open standalone modal directly
      window.openStandaloneMathLiveModal();
      return;
    }

    // Ensure Math Studio container is displayed
    const studioContainer = document.getElementById('modalMathStudioContainer');
    const wrapper = document.getElementById('modalMathStudioWrapper');
    if (!studioContainer && wrapper && typeof window.buildMathStudioHTML === 'function') {
      wrapper.innerHTML = window.buildMathStudioHTML(true);
    } else if (studioContainer) {
      studioContainer.style.display = 'block';
    }

    const toggleBtn = document.getElementById('btnToggleMathStudio');
    if (toggleBtn) toggleBtn.classList.add('active');

    // Switch to mathlive_builder tab
    if (typeof window.switchMathStudioTab === 'function') {
      window.switchMathStudioTab('mathlive_builder');
    }

    // Try to import from modalQText if empty
    const mf = document.getElementById('modalMathLiveField');
    if (mf) {
      const qText = document.getElementById('modalQText');
      if (qText && qText.value) {
        // Look for $...$ or $$...$$
        const match = qText.value.match(/\$\$([\s\S]+?)\$\$/) || qText.value.match(/\$([^\$\n]+?)\$/);
        if (match && match[1]) {
          mf.value = match[1].trim();
        }
      }
      setTimeout(() => {
        mf.scrollIntoView({ behavior: 'smooth', block: 'center' });
        mf.focus();
      }, 150);
    }
  };

  /**
   * Insert formula from Question Modal's MathLive field into question textarea
   */
  window.insertMathLiveIntoQuestion = function(fieldId, isDisplay = false) {
    const mf = document.getElementById(fieldId);
    const val = mf ? mf.value.trim() : '';
    if (!val) {
      if (typeof window.showToast === 'function') {
        window.showToast('يرجى كتابة معادلة في المحرر أولاً!', 'warning');
      }
      return;
    }

    const snippet = isDisplay ? `\n$$${val}$$\n` : `$${val}$`;
    if (typeof window.insertMathFormula === 'function') {
      window.insertMathFormula(snippet);
    } else {
      const qText = document.getElementById('modalQText');
      if (qText) {
        const start = qText.selectionStart ?? qText.value.length;
        const end = qText.selectionEnd ?? qText.value.length;
        const old = qText.value;
        qText.value = old.substring(0, start) + snippet + old.substring(end);
        qText.selectionStart = qText.selectionEnd = start + snippet.length;
        qText.focus();
      }
    }

    if (typeof window.updateModalMathPreview === 'function') {
      window.updateModalMathPreview();
    }
    if (typeof window.showToast === 'function') {
      window.showToast(`تم إدراج المعادلة في السؤال ${isDisplay ? '(لسطر مستقل)' : '(ضمن النص)'} ⚡`, 'success');
    }
  };

  /**
   * Import formula or selected text from question textarea into MathLive
   */
  window.importQuestionTextToMathLive = function(fieldId) {
    const qText = document.getElementById('modalQText');
    const mf = document.getElementById(fieldId);
    if (!qText || !mf) return;

    let selected = '';
    if (qText.selectionStart !== undefined && qText.selectionEnd !== undefined && qText.selectionEnd > qText.selectionStart) {
      selected = qText.value.substring(qText.selectionStart, qText.selectionEnd).trim();
    }

    if (!selected) {
      // Find LaTeX between $ or $$
      const match = qText.value.match(/\$\$([\s\S]+?)\$\$/) || qText.value.match(/\$([^\$\n]+?)\$/);
      if (match && match[1]) {
        selected = match[1].trim();
      } else {
        selected = qText.value.trim();
      }
    }

    // Strip leading and trailing $ if any
    selected = selected.replace(/^\$+|\$+$/g, '').trim();

    if (selected) {
      mf.value = selected;
      mf.focus();
      if (typeof window.showToast === 'function') {
        window.showToast('تم استيراد التعبير الرياضي إلى المحرر 📥⚡', 'success');
      }
    } else {
      if (typeof window.showToast === 'function') {
        window.showToast('لم يتم العثور على نص أو معادلة للاستيراد من نص السؤال!', 'warning');
      }
    }
  };

  // 3. Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    if (window.MathfieldElement) {
      try {
        window.MathfieldElement.fontsDirectory = 'js/fonts';
      } catch (e) {}
    }
  });

})();
