/**
 * ستوديو الفيزياء العراقي المعتمد | مسار المعلم PRO
 * قوانين ومعادلات ومسائل الثالث متوسط والسادس الإعدادي (العلمي) والثوابت والوحدات الوزارية
 */

const PHYSICS_DB_3RD = [
  {
    topic: 'الكهربائية الساكنة',
    name: 'قانون كولوم للقوى الكهربائية',
    formula: '$F = k \\frac{q_1 \\cdot q_2}{r^2}$',
    displayFormula: 'F = k · (q₁ · q₂) / r²',
    desc: 'حساب القوة المتبادلة بين شحنتين نقطيتين (نيوتن). ثابت كولوم: k = 9 × 10⁹ N·m²/C²'
  },
  {
    topic: 'الكهربائية الساكنة',
    name: 'المجال الكهربائي',
    formula: '$E = \\frac{F}{q}$',
    displayFormula: 'E = F / q',
    desc: 'القوة الكهربائية المؤثرة في وحدة الشحنة الموجبة الموضوعة في تلك النقطة (N/C)'
  },
  {
    topic: 'التيار الكهربائي',
    name: 'شدة التيار الكهربائي',
    formula: '$I = \\frac{Q}{t}$',
    displayFormula: 'I = Q / t',
    desc: 'كمية الشحنة الكهربائية المارة خلال مقطع عرضي من موصل في وحدة الزمن (أمبير A)'
  },
  {
    topic: 'التيار الكهربائي',
    name: 'قانون أوم (المقاومة)',
    formula: '$R = \\frac{V}{I}$',
    displayFormula: 'R = V / I',
    desc: 'النسبة بين فرق الجهد الكهربائي بين طرفي المقاوم والتيار المنساب فيه (أوم Ω)'
  },
  {
    topic: 'التيار الكهربائي',
    name: 'ربط المقاومات على التوالي',
    formula: '$R_{eq} = R_1 + R_2 + R_3$',
    displayFormula: 'R_eq = R₁ + R₂ + R₃',
    desc: 'المقاومة المكافئة لمجموعة مقاومات مربوطة على التوالي (التيار متساوٍ I_total = I_1 = I_2)'
  },
  {
    topic: 'التيار الكهربائي',
    name: 'ربط المقاومات على التوازي',
    formula: '$\\frac{1}{R_{eq}} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\frac{1}{R_3}$',
    displayFormula: '1/R_eq = 1/R₁ + 1/R₂ + 1/R₃',
    desc: 'مقلوب المقاومة المكافئة للتوازي (فرق الجهد متساوٍ V_total = V_1 = V_2)'
  },
  {
    topic: 'القدرة والطاقة',
    name: 'القدرة الكهربائية (بدلالة الطاقة والزمن)',
    formula: '$P = \\frac{E}{t}$',
    displayFormula: 'P = E / t',
    desc: 'المعدل الزمني للطاقة المستهلكة أو المتحولة في الجهاز (واط W)'
  },
  {
    topic: 'القدرة والطاقة',
    name: 'القدرة الكهربائية (بدلالة التيار والجهد)',
    formula: '$P = I \\times V$',
    displayFormula: 'P = I × V',
    desc: 'حاصل ضرب التيار الكهربائي في فرق الجهد بين طرفي الجهاز'
  },
  {
    topic: 'القدرة والطاقة',
    name: 'القدرة بدلالة المقاومة والتيار',
    formula: '$P = I^2 \\times R$',
    displayFormula: 'P = I² × R',
    desc: 'تستخدم لحساب القدرة الضائعة أو الحرارية المتبددة في سلك المقاومة'
  },
  {
    topic: 'القدرة والطاقة',
    name: 'القدرة بدلالة الجهد والمقاومة',
    formula: '$P = \\frac{V^2}{R}$',
    displayFormula: 'P = V² / R',
    desc: 'تستخدم عند ثبوت فرق الجهد عبر الأجهزة المربوطة على التوازي'
  },
  {
    topic: 'القدرة والطاقة',
    name: 'كلفة استهلاك الطاقة الكهربائية',
    formula: '$\\text{Cost} = P(\\text{kW}) \\times t(\\text{h}) \\times \\text{Unit Price}$',
    displayFormula: 'Cost = P(kW) × t(h) × ثمن الوحدة',
    desc: 'حساب المبلغ الواجب دفعه (دينار) = القدرة بالكيلوواط × الزمن بالساعات × ثمن الوحدة'
  },
  {
    topic: 'المحولة الكهربائية',
    name: 'نسبة التحويل والفولتية في المحولة',
    formula: '$\\frac{V_2}{V_1} = \\frac{N_2}{N_1}$',
    displayFormula: 'V₂ / V₁ = N₂ / N₁',
    desc: 'تحديد نوع المحولة (رافعة إذا N2/N1 > 1 وخافضة إذا N2/N1 < 1)'
  },
  {
    topic: 'المحولة الكهربائية',
    name: 'نسبة التحويل والتيار في المحولة',
    formula: '$\\frac{I_1}{I_2} = \\frac{N_2}{N_1}$',
    displayFormula: 'I₁ / I₂ = N₂ / N₁',
    desc: 'العلاقة العكسية بين التيار وعدد لفات الملفين في المحولة المثالية'
  },
  {
    topic: 'المحولة الكهربائية',
    name: 'كفاءة المحولة الكهربائية',
    formula: '$\\eta = \\frac{P_2}{P_1} \\times 100\\%$',
    displayFormula: 'η = (P₂ / P₁) × 100%',
    desc: 'النسبة بين القدرة الخارجة من الملف الثانوي إلى القدرة الداخلة في الملف الابتدائي'
  },
  {
    topic: 'المحولة الكهربائية',
    name: 'خسائر القدرة في المحولة',
    formula: '$P_{loss} = P_1 - P_2$',
    displayFormula: 'P_loss = P₁ - P₂',
    desc: 'القدرة الضائعة نتيجة خسارة الأسلاك وخسارة التيارات الدوامة في القلب الحديدي'
  }
];

const PHYSICS_DB_6TH = [
  // الفصل الأول: المتسعات
  {
    topic: 'الفصل 1: المتسعات',
    name: 'سعة المتسعة',
    formula: '$C = \\frac{Q}{\\Delta V}$',
    displayFormula: 'C = Q / ΔV',
    desc: 'النسبة بين الشحنة المختزنة على أي من صفيحتيها إلى فرق الجهد (فاراد F)'
  },
  {
    topic: 'الفصل 1: المتسعات',
    name: 'العوامل المؤثرة في سعة المتسعة',
    formula: '$C = \\varepsilon_0 \\frac{A}{d}$',
    displayFormula: 'C = ε₀ · (A / d)',
    desc: 'تعتمد طردياً على المساحة السطحية المتقابلة A وعكسياً على البعد d بين الصفيحتين'
  },
  {
    topic: 'الفصل 1: المتسعات',
    name: 'سعة المتسعة بوجود العازل (ثابت العزل k)',
    formula: '$C_k = k \\cdot C$',
    displayFormula: 'C_k = k · C',
    desc: 'زيادة سعة المتسعة بمقدار ثابت العزل الكهربائي k عند إدخال مادة عازلة'
  },
  {
    topic: 'الفصل 1: المتسعات',
    name: 'فرق الجهد بوجود العازل (متسعة مفصولة)',
    formula: '$\\Delta V_k = \\frac{\\Delta V}{k}$',
    displayFormula: 'ΔV_k = ΔV / k',
    desc: 'هبوط فرق الجهد الكهربائي بين الصفيحتين بنسبة ثابت العزل k عند بقاء المتسعة مفصولة'
  },
  {
    topic: 'الفصل 1: المتسعات',
    name: 'ربط المتسعات على التوازي',
    formula: '$C_{eq} = C_1 + C_2 + C_3$',
    displayFormula: 'C_eq = C₁ + C₂ + C₃',
    desc: 'السعة المكافئة لربط التوازي (زيادة المساحة السطحية A، ثبوت فرق الجهد ΔV)'
  },
  {
    topic: 'الفصل 1: المتسعات',
    name: 'ربط المتسعات على التوالي',
    formula: '$\\frac{1}{C_{eq}} = \\frac{1}{C_1} + \\frac{1}{C_2} + \\frac{1}{C_3}$',
    displayFormula: '1/C_eq = 1/C₁ + 1/C₂ + 1/C₃',
    desc: 'السعة المكافئة للتوالي أصغر من أصغر سعة (زيادة البعد d، ثبوت الشحنة Q)'
  },
  {
    topic: 'الفصل 1: المتسعات',
    name: 'الطاقة الكامنة المختزنة في المتسعة',
    formula: '$PE = \\frac{1}{2} Q \\Delta V = \\frac{1}{2} C (\\Delta V)^2 = \\frac{Q^2}{2C}$',
    displayFormula: 'PE = ½ Q ΔV = ½ C (ΔV)² = Q² / (2C)',
    desc: 'الطاقة الكامنة الكهربائية المختزنة في المجال الكهربائي بين صفيحتي المتسعة (جول J)'
  },

  // الفصل الثاني: الحث الكهرومغناطيسي
  {
    topic: 'الفصل 2: الحث الكهرومغناطيسي',
    name: 'القوة الدافعة الكهربائية الحركية المحتثة',
    formula: '$\\mathcal{E}_{motional} = v B L \\sin\\theta$',
    displayFormula: 'ℰ_motional = v · B · L · sin θ',
    desc: 'تتولد على طرفي ساق موصلة تتحرك بسرعة v عمودياً على مجال مغناطيسي منتظم B'
  },
  {
    topic: 'الفصل 2: الحث الكهرومغناطيسي',
    name: 'الفيض المغناطيسي',
    formula: '$\\Phi_B = B A \\cos\\theta$',
    displayFormula: 'Φ_B = B · A · cos θ',
    desc: 'الفيض المغناطيسي المخترق لمساحة A ويقاس بالويبر (Weber Wb)'
  },
  {
    topic: 'الفصل 2: الحث الكهرومغناطيسي',
    name: 'قانون فراداي في الحث الكهرومغناطيسي',
    formula: '$\\mathcal{E}_{ind} = -N \\frac{\\Delta \\Phi_B}{\\Delta t}$',
    displayFormula: 'ℰ_ind = -N (ΔΦ_B / Δt)',
    desc: 'القوة الدافعة المحتثة تتناسب طردياً مع المعدل الزمني لتغير الفيض. الإشارة السالبة لقانون لنز'
  },
  {
    topic: 'الفصل 2: الحث الكهرومغناطيسي',
    name: 'القوة الدافعة المحتثة الذاتية',
    formula: '$\\mathcal{E}_{ind} = -L \\frac{\\Delta I}{\\Delta t}$',
    displayFormula: 'ℰ_ind = -L (ΔI / Δt)',
    desc: 'ظاهرة الحث الذاتي، معامل الحث الذاتي L ويقاس بالهنري (Henry H)'
  },
  {
    topic: 'الفصل 2: الحث الكهرومغناطيسي',
    name: 'الطاقة المختزنة في المجال المغناطيسي للمحث',
    formula: '$PE = \\frac{1}{2} L I^2$',
    displayFormula: 'PE = ½ L I²',
    desc: 'الطاقة الكهرومغناطيسية المختزنة في المحث عند ثبوت التيار I (جول J)'
  },
  {
    topic: 'الفصل 2: الحث الكهرومغناطيسي',
    name: 'معامل الحث المتبادل بين ملفين',
    formula: '$M = \\sqrt{L_1 L_2}$',
    displayFormula: 'M = √(L₁ · L₂)',
    desc: 'في حالة الترابط المغناطيسي التام بين الملفين، E_ind2 = -M (ΔI_1 / Δt)'
  },

  // الفصل الثالث: دوائر التيار المتناوب
  {
    topic: 'الفصل 3: التيار المتناوب',
    name: 'رادة الحث (المحث الصرف)',
    formula: '$X_L = 2\\pi f L = \\omega L$',
    displayFormula: 'X_L = 2π f L = ω L',
    desc: 'المعاكسة التي يبديها المحث لتغير التيار، تتناسب طردياً مع التردد f ومعامل الحث L (أوم Ω)'
  },
  {
    topic: 'الفصل 3: التيار المتناوب',
    name: 'رادة السعة (المتسعة الصرف)',
    formula: '$X_C = \\frac{1}{2\\pi f C} = \\frac{1}{\\omega C}$',
    displayFormula: 'X_C = 1 / (2π f C) = 1 / (ω C)',
    desc: 'المعاكسة التي تبديها المتسعة لتغير الفولتية، تتناسب عكسياً مع التردد f والسعة C (أوم Ω)'
  },
  {
    topic: 'الفصل 3: التيار المتناوب',
    name: 'الممانعة الكلية لدائرة توالي (R-L-C)',
    formula: '$Z = \\sqrt{R^2 + (X_L - X_C)^2}$',
    displayFormula: 'Z = √[R² + (X_L - X_C)²]',
    desc: 'الممانعة الكلية المعاكسة للمصدر المتناوب (أوم Ω)'
  },
  {
    topic: 'الفصل 3: التيار المتناوب',
    name: 'عامل القدرة وزاوية فرق الطور',
    formula: '$pf = \\cos\\phi = \\frac{R}{Z} = \\frac{P_{real}}{P_{app}}$',
    displayFormula: 'pf = cos φ = R / Z = P_real / P_app',
    desc: 'النسبة بين القدرة الحقيقية المستهلكة في المقاومة إلى القدرة الظاهرية المجهزة من المصدر'
  },
  {
    topic: 'الفصل 3: التيار المتناوب',
    name: 'القدرة الحقيقية والقدرة الظاهرية',
    formula: '$P_{real} = I^2 R = I V \\cos\\phi \\quad , \\quad P_{app} = I_{total} V_{total}$',
    displayFormula: 'P_real = I² R = I V cos φ  |  P_app = I_tot × V_tot',
    desc: 'القدرة الحقيقية بالواط (W) والظاهرية بالفولت-أمبير (V·A)'
  },
  {
    topic: 'الفصل 3: التيار المتناوب',
    name: 'تردد الرنين الكهربائي',
    formula: '$f_r = \\frac{1}{2\\pi \\sqrt{LC}} \\quad , \\quad \\omega_r = \\frac{1}{\\sqrt{LC}}$',
    displayFormula: 'f_r = 1 / (2π √LC)  |  ω_r = 1 / √LC',
    desc: 'في حالة الرنين تكون X_L = X_C والممانعة Z = R بأصغر ما يمكن والتيار بأعظم ما يمكن'
  },
  {
    topic: 'الفصل 3: التيار المتناوب',
    name: 'عامل النوعية في دائرة الرنين',
    formula: '$Q_f = \\frac{\\omega_r}{\\Delta \\omega} = \\frac{1}{R} \\sqrt{\\frac{L}{C}}$',
    displayFormula: 'Q_f = (1 / R) · √(L / C)',
    desc: 'النسبة بين التردد الزاوي الرنيني ونطاق التردد الزاوي (مجرد من الوحدات)'
  },

  // البصريات والفيزياء الحديثة
  {
    topic: 'الفصل 4 و5: البصريات والحديثة',
    name: 'تجربة شق يونك (فواصل الهدب المضيئة)',
    formula: '$\\Delta y = \\frac{\\lambda L}{d}$',
    displayFormula: 'Δy = (λ · L) / d',
    desc: 'المسافة بين هدابين مضيئين متتاليين، λ طول الموجة، L بعد الشاشة، d البعد بين الشقين'
  },
  {
    topic: 'الفصل 4 و5: البصريات والحديثة',
    name: 'فرضية بلانك وطاقة الفوتون',
    formula: '$E = h f = \\frac{h c}{\\lambda}$',
    displayFormula: 'E = h · f = h · c / λ',
    desc: 'طاقة فوتون الإشعاع الكهرومغناطيسي، h ثابت بلانك = 6.63 × 10⁻³⁴ J·s'
  },
  {
    topic: 'الفصل 4 و5: البصريات والحديثة',
    name: 'المعادلة الكهروضوئية لأينشتاين',
    formula: '$K.E_{max} = h f - W_0 = e V_s$',
    displayFormula: 'K.E_max = h · f - W₀ = e · V_s',
    desc: 'الطاقة الحركية العظمى للإلكترونات الضوئية المنبعثة، W_0 دالة الشغل، V_s جهد الإيقاف'
  },
  {
    topic: 'الفصل 4 و5: البصريات والحديثة',
    name: 'طول موجة دي برولي المادية',
    formula: '$\\lambda = \\frac{h}{p} = \\frac{h}{m v}$',
    displayFormula: 'λ = h / p = h / (m · v)',
    desc: 'الموجات المرافقة لحركة الجسيمات المادية (الإلكترونات والأجسام)'
  },
  {
    topic: 'الفصل 4 و5: البصريات والحديثة',
    name: 'مبدأ اللادقة (الريب) لهايزنبرغ',
    formula: '$\\Delta x \\cdot \\Delta p \\ge \\frac{h}{4\\pi}$',
    displayFormula: 'Δx · Δp ≥ h / (4π)',
    desc: 'حاصل ضرب اللادقة في الموضع في اللادقة في الزخم الخطي أكبر أو يساوي h/4π'
  },
  {
    topic: 'الفصول 6-8: الليزر والأشعة والنووية',
    name: 'أقصر طول موجي للأشعة السينية (Bremsstrahlung)',
    formula: '$\\lambda_{min} = \\frac{h c}{e V}$',
    displayFormula: 'λ_min = (h · c) / (e · V)',
    desc: 'يعتمد عكسياً على فرق الجهد المسلط V بين قطبي أنبوبة الأشعة السينية'
  },
  {
    topic: 'الفصول 6-8: الليزر والأشعة والنووية',
    name: 'تأثير كومبتون',
    formula: '$\\lambda\' - \\lambda = \\frac{h}{m_e c} (1 - \\cos\\theta)$',
    displayFormula: 'λ\' - λ = [h / (m_e · c)] · (1 - cos θ)',
    desc: 'الزيادة في طول موجة فوتون الأشعة السينية المستطار بعد استطامته بإلكترون حر'
  },
  {
    topic: 'الفصول 6-8: الليزر والأشعة والنووية',
    name: 'طاقة الربط النووي',
    formula: '$E_b = \\Delta m \\cdot c^2 = \\Delta m \\times 931 \\text{ MeV}$',
    displayFormula: 'E_b = Δm · c² = Δm × 931 MeV',
    desc: 'الطاقة اللازمة لتفكيك النواة إلى مكوناتها من بروتونات ونيوترونات، Δm النقص الكتلي'
  },
  {
    topic: 'الفصول 6-8: الليزر والأشعة والنووية',
    name: 'نصف قطر النواة',
    formula: '$R = R_0 A^{1/3}$',
    displayFormula: 'R = R₀ · A¹/³',
    desc: 'A العدد الكتلي، R_0 = 1.2 × 10⁻¹⁵ m (أو 1.2 فمتومتر fm)'
  }
];

const PHYSICS_CONSTANTS = [
  { name: 'سرعة الضوء في الفراغ (c)', snippet: '$c = 3 \\times 10^8 \\text{ m/s}$', val: '3 × 10⁸ m/s' },
  { name: 'ثابت بلانك (h)', snippet: '$h = 6.63 \\times 10^{-34} \\text{ J}\\cdot\\text{s}$', val: '6.63 × 10⁻³⁴ J·s' },
  { name: 'شحنة الإلكترون (e)', snippet: '$e = 1.6 \\times 10^{-19} \\text{ C}$', val: '1.6 × 10⁻¹⁹ C' },
  { name: 'كتلة الإلكترون (mₑ)', snippet: '$m_e = 9.11 \\times 10^{-31} \\text{ kg}$', val: '9.11 × 10⁻³¹ kg' },
  { name: 'ثابت كولوم (k)', snippet: '$k = 9 \\times 10^9 \\text{ N}\\cdot\\text{m}^2/\\text{C}^2$', val: '9 × 10⁹ N·m²/C²' },
  { name: 'سماحية الفراغ الكهربائية (ε₀)', snippet: '$\\varepsilon_0 = 8.85 \\times 10^{-12} \\text{ F/m}$', val: '8.85 × 10⁻¹² F/m' },
  { name: 'التعجيل الأرضي (g)', snippet: '$g = 9.8 \\text{ m/s}^2$', val: '9.8 m/s² (أو 10)' },
  { name: 'عدد أفوكادرو (N_A)', snippet: '$N_A = 6.02 \\times 10^{23} \\text{ mol}^{-1}$', val: '6.02 × 10²³' }
];

const PHYSICS_SYMBOLS = [
  { char: 'Δ', latex: '$\\Delta$', name: 'دلتا (التغير)' },
  { char: 'λ', latex: '$\\lambda$', name: 'لامدا (طول الموجة)' },
  { char: 'Φ', latex: '$\\Phi_B$', name: 'الفيض المغناطيسي' },
  { char: 'θ', latex: '$\\theta$', name: 'ثيتا (الزاوية)' },
  { char: 'ω', latex: '$\\omega$', name: 'أوميغا (التردد الزاوي)' },
  { char: 'Ω', latex: '$\\Omega$', name: 'أوم (وحدة المقاومة)' },
  { char: 'μ', latex: '$\\mu$', name: 'مايكرو (10⁻⁶)' },
  { char: 'π', latex: '$\\pi$', name: 'باي (3.14)' },
  { char: 'ρ', latex: '$\\rho$', name: 'رو (الكثافة / المقاومية)' },
  { char: 'η', latex: '$\\eta$', name: 'إيتا (الكفاءة)' },
  { char: 'ε', latex: '$\\varepsilon$', name: 'إبسيلون (السماحية)' },
  { char: 'ℰ', latex: '$\\mathcal{E}_{ind}$', name: 'قوة دافعة محتثة' }
];

window.insertPhysicsFormula = function(snippet) {
  if (typeof window.insertMathFormula === 'function') {
    window.insertMathFormula(snippet);
  } else {
    let target = window.lastActiveMathInput || document.getElementById('modalQText');
    if (!target) return;
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    target.value = target.value.substring(0, start) + snippet + target.value.substring(end);
    target.focus();
    if (typeof window.updateModalMathPreview === 'function') window.updateModalMathPreview();
  }
};

window.togglePhysicsStudio = function() {
  const wrapper = document.getElementById('modalPhysicsStudioWrapper');
  let container = document.getElementById('modalPhysicsStudioContainer');
  if (!container && wrapper && typeof window.buildPhysicsStudioHTML === 'function') {
    wrapper.innerHTML = window.buildPhysicsStudioHTML(true);
    wrapper.innerHTML = window.buildPhysicsStudioHTML(false);
    container = document.getElementById('modalPhysicsStudioContainer');
  }
  if (!container) return;
  const isHidden = (container.style.display === 'none' || !container.style.display);
  if (isHidden && typeof window.closeAllQuestionStudiosExcept === 'function') {
    window.closeAllQuestionStudiosExcept('physics');
  }
  container.style.display = isHidden ? 'block' : 'none';
  const toggleBtn = document.getElementById('btnTogglePhysicsStudio');
  if (toggleBtn) {
    toggleBtn.classList.toggle('active', isHidden);
  }
};

window.switchPhysicsStudioTab = function(tabId) {
  document.querySelectorAll('#physicsStudioTabs .physics-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.physics-tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === `physicsPane_${tabId}`);
  });
};

window.buildPhysicsStudioHTML = function(isOpen = false) {
  const cards3rdHTML = PHYSICS_DB_3RD.map(item => `
    <div class="physics-law-card" onclick="window.insertPhysicsFormula('${item.formula}')" title="انقر لإدراج القانون: ${item.name}">
      <div class="physics-law-title">
        <span>${item.name}</span>
        <span class="physics-law-topic">${item.topic}</span>
      </div>
      <div class="physics-law-formula">${item.displayFormula || item.formula.replace(/\$/g, '')}</div>
      <div class="physics-law-desc">${item.desc}</div>
    </div>
  `).join('');

  const cards6thHTML = PHYSICS_DB_6TH.map(item => `
    <div class="physics-law-card" onclick="window.insertPhysicsFormula('${item.formula}')" title="انقر لإدراج القانون: ${item.name}">
      <div class="physics-law-title">
        <span>${item.name}</span>
        <span class="physics-law-topic">${item.topic}</span>
      </div>
      <div class="physics-law-formula">${item.displayFormula || item.formula.replace(/\$/g, '')}</div>
      <div class="physics-law-desc">${item.desc}</div>
    </div>
  `).join('');

  const constantsHTML = PHYSICS_CONSTANTS.map(c => `
    <button type="button" class="physics-constant-btn" onclick="window.insertPhysicsFormula('${c.snippet}')" title="إدراج ${c.name}">
      <span style="font-size: 0.76rem; font-weight: 700;">${c.name}</span>
      <span style="direction: ltr; font-size: 0.78rem; font-family: monospace; color: #fbbf24;">${c.val}</span>
    </button>
  `).join('');

  const symbolsHTML = PHYSICS_SYMBOLS.map(s => `
    <button type="button" class="physics-constant-btn" style="justify-content: center; gap: 6px;" onclick="window.insertPhysicsFormula('${s.latex}')" title="${s.name}">
      <span style="font-size: 1.1rem; color: #38bdf8; font-weight: 700;">${s.char}</span>
      <span style="font-size: 0.7rem; color: var(--text-muted);">${s.name}</span>
    </button>
  `).join('');

  return `
    <!-- ستوديو الفيزياء العراقي (ثالث متوسط وسادس إعدادي) -->
    <div class="physics-studio-container" id="modalPhysicsStudioContainer" style="display: ${isOpen ? 'block' : 'none'};">
      <div class="physics-studio-header">
        <div class="physics-studio-title">
          <i class="fa-solid fa-atom" style="color: #f59e0b;"></i>
          <span>ستوديو الفيزياء العراقي المعتمد</span>
          <span class="badge-physics-iq">الثالث متوسط والسادس الإعدادي</span>
        </div>
        <div>
          <span style="font-size: 0.72rem; color: var(--text-muted);">انقر على أي قانون، معادلة، أو ثابت لإدراجه فوراً في موضع المؤشر ⚡</span>
        </div>
      </div>

      <!-- تبويبات أقسام الفيزياء -->
      <div class="physics-studio-tabs" id="physicsStudioTabs">
        <button type="button" class="physics-tab-btn active" data-tab="phys_3rd" onclick="window.switchPhysicsStudioTab('phys_3rd')">
          <i class="fa-solid fa-bolt"></i> قوانين الثالث متوسط
        </button>
        <button type="button" class="physics-tab-btn" data-tab="phys_6th" onclick="window.switchPhysicsStudioTab('phys_6th')">
          <i class="fa-solid fa-graduation-cap"></i> قوانين السادس إعدادي (العلمي)
        </button>
        <button type="button" class="physics-tab-btn" data-tab="phys_constants" onclick="window.switchPhysicsStudioTab('phys_constants')">
          <i class="fa-solid fa-scale-balanced"></i> الثوابت والرموز الفيزيائية
        </button>
      </div>

      <!-- تبويب 1: الثالث متوسط -->
      <div class="physics-tab-pane active" id="physicsPane_phys_3rd">
        <div class="physics-laws-grid">
          ${cards3rdHTML}
        </div>
      </div>

      <!-- تبويب 2: السادس إعدادي -->
      <div class="physics-tab-pane" id="physicsPane_phys_6th">
        <div class="physics-laws-grid">
          ${cards6thHTML}
        </div>
      </div>

      <!-- تبويب 3: الثوابت والرموز -->
      <div class="physics-tab-pane" id="physicsPane_phys_constants">
        <div style="margin-bottom: 10px;">
          <div style="font-size: 0.78rem; font-weight: 800; color: #fbbf24; margin-bottom: 6px;">
            <i class="fa-solid fa-microchip"></i> الثوابت الفيزيائية الوزارية:
          </div>
          <div class="physics-constants-grid">
            ${constantsHTML}
          </div>
        </div>

        <div>
          <div style="font-size: 0.78rem; font-weight: 800; color: #38bdf8; margin-bottom: 6px;">
            <i class="fa-solid fa-shapes"></i> الرموز والكميات الفيزيائية الإغريقية:
          </div>
          <div class="physics-constants-grid">
            ${symbolsHTML}
          </div>
        </div>
      </div>
    </div>
  `;
};
