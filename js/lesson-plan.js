/**
 * مسار المعلم | استوديو وسجل الخطة اليومية للمعلم (معتمد للإدارة والإشراف التربوي)
 * مصمم خصيصاً للمدارس العراقية والعربية وفق معايير الإشراف التربوي التخصصي
 */

(function() {
  'use strict';

  const STORAGE_KEY_CURRENT = 'masar_current_lesson_plan';
  const STORAGE_KEY_ARCHIVE = 'masar_lesson_plans_archive';

  // Arabic days of the week
  const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  /**
   * Helper to format today's date as YYYY-MM-DD
   */
  function getTodayDateString() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Helper to format a Date object as YYYY-MM-DD
   */
  function formatDateObj(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /**
   * Helper to calculate week range (Sunday to Thursday)
   */
  function getWeekRange(offsetWeeks = 0) {
    const now = new Date();
    if (offsetWeeks !== 0) {
      now.setDate(now.getDate() + (offsetWeeks * 7));
    }
    const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
    const diffToSunday = currentDay;
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - diffToSunday);

    const thursday = new Date(sunday);
    thursday.setDate(sunday.getDate() + 4); // Sunday + 4 = Thursday

    return {
      start: formatDateObj(sunday),
      end: formatDateObj(thursday)
    };
  }

  /**
   * Helper to calculate current month range
   */
  function getMonthRange() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: formatDateObj(firstDay),
      end: formatDateObj(lastDay)
    };
  }

  /**
   * Helper to calculate Hijri date string
   */
  function getHijriDateString(dateObj = new Date()) {
    try {
      const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      return formatter.format(dateObj);
    } catch (e) {
      return '1448 هـ';
    }
  }

  /**
   * Initial default Lesson Plan
   */
  function getDefaultPlan() {
    const today = new Date();
    const dayName = ARABIC_DAYS[today.getDay()] || 'الأحد';
    const dateStr = getTodayDateString();
    const hijriStr = getHijriDateString(today);

    // Sync school and teacher from appState if available
    const schoolName = (window.appState && window.appState.header && window.appState.header.schoolName)
      ? window.appState.header.schoolName
      : 'ثانوية المتميزين للبنين';
    const teacherName = (window.appState && window.appState.header && window.appState.header.teacherName)
      ? window.appState.header.teacherName
      : 'أستاذ المادة';

    return {
      id: 'plan_' + Date.now(),
      schoolName: schoolName,
      teacherName: teacherName,
      subject: 'الرياضيات',
      grade: 'الثالث متوسط',
      section: 'أ',
      period: 'الحصة الأولى',
      date: dateStr,
      day: dayName,
      hijriDate: hijriStr,
      unitTitle: '',
      topicTitle: '',
      cognitiveGoals: `1. أن يتعرف الطالب على مفهوم النظام الخطي وكيفية حذف أحد المتغيرين.
2. أن يميز الطالب بين استخدام عمليتي الجمع أو الطرح حسب إشارات المعاملات.
3. أن يجد الطالب قيمة المتغير الأول ثم يعوض لإيجاد قيمة المتغير الثاني بدقة.`,
      skillGoals: `1. أن يطبق الطالب خطوات طريقة الحذف على السبورة وفي الدفتر الصفي.
2. أن يتحقق الطالب من صحة مجموعة الحل S = {(x, y)} بالتعويض في المعادلة الأصلية.`,
      affectiveGoals: `1. أن يقدر الطالب أهمية الرياضيات والأنظمة الخطية في حل المشكلات الحياتية.
2. أن يشارك الطالب بإيجابية في المناقشة الصفية وحل التمارين التفاعلية.`,
      aids: 'السبورة والأقلام الملونة، الكتاب المدرسي المقرر، بطاقات عمل تدريبية، شاشة العرض التفاعلية',
      strategies: 'العصف الذهني، الحوار والمناقشة، التعلم التعاوني، حل المشكلات',
      warmup: `التمهيد والتهيئة الحافزة (5 دقائق):
- مراجعة سريعة لحل المعادلة الخطية بمتغير واحد من الدرس السابق.
- طرح مسألة حياتية محفزة: "اشترى أحمد قلمين ودفتر بمبلغ 7 آلاف، واشترى علي قلماً ودفتراً بمبلغ 4 آلاف، كيف نحدد سعر القلم بمفرده؟" لإثارة الفضول وتكوين المعادلتين.`,
      instruction: `العرض والأنشطة وسير الدرس (25 دقيقة):
1. كتابة النظام الخطي على السبورة وشرح شرط تساوي المعاملات العددية لأحد المتغيرين (x أو y).
2. بيان قاعدة الإشارات: إذا كانت الإشارات مختلفة نجمع لحذف المتغير، وإذا كانت متماثلة نطرح.
3. حل مثال وزاري نموذجي على السبورة خطوة بخطوة مع توجيه أسئلة للطلبة لترسيخ الخطوات.
4. تقسيم الطلبة إلى ثنائيات لحل تمرين تدريبي مع تقديم التغذية الراجعة الفورية للمجموعات.`,
      realWorldConnection: 'ربط طريقة الحذف بالحسابات التجارية اليومية والتركيز على نمط السؤال الوزاري في الدور الأول والثاني.',
      formativeAssessment: `التقويم التكويني (أثناء الشرح):
- سؤال سريع: ما هو المتغير الأسهل في الحذف من النظام المكتوب ولماذا؟
- التحقق من تطبيق الطلبة لقاعدة الإشارات عند الجمع أو الطرح.`,
      summativeAssessment: `التقويم الختامي (نهاية الحصة):
حل مسألة وزارية فردية في الدفتر: (جد مجموعة حل النظام: 2x + y = 7 ، x - y = 2 بطريقة الحذف).`,
      homework: 'حل تمارين (تأكد من فهمك) صفحة 68 - التمارين ذات الأرقام (1 ، 3 ، 5) في الدفتر البيتي.',
      reflection: 'تفاعل ممتاز من جميع الطلبة، تحقق الهدف بنسبة 90%، وسيتم إعطاء تمرين إثرائي في بداية الحصة القادمة لتثبيت الفكرة.',
      supervisorNotes: '',
      principalNotes: '',
      savedAt: new Date().toISOString()
    };
  }

  // Active Plan State in Memory
  let activePlan = null;

  /**
   * Load active plan from LocalStorage or create default
   */
  function loadActivePlan() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT);
      if (saved) {
        activePlan = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Error loading active lesson plan:', e);
    }
    if (!activePlan) {
      activePlan = getDefaultPlan();
    }
    return activePlan;
  }

  /**
   * Save active plan to LocalStorage
   */
  function persistActivePlan() {
    if (!activePlan) return;
    try {
      activePlan.savedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(activePlan));
      if (typeof window.scheduleCloudAutoSync === 'function') {
        window.scheduleCloudAutoSync();
      }
    } catch (e) {
      console.warn('Error saving active plan:', e);
    }
  }

  /**
   * Get archive list
   */
  function getArchive() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ARCHIVE);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Save archive list
   */
  function saveArchive(list) {
    try {
      localStorage.setItem(STORAGE_KEY_ARCHIVE, JSON.stringify(list));
      if (typeof window.scheduleCloudAutoSync === 'function') {
        window.scheduleCloudAutoSync();
      }
    } catch (e) {}
  }

  /**
   * Pre-made Ministerial Curriculum Templates
   */
  const LESSON_TEMPLATES = {
    math: {
      name: 'رياضيات - حل المعادلات بالدستور (الثالث متوسط)',
      subject: 'الرياضيات',
      grade: 'الثالث متوسط',
      unitTitle: 'الفصل الثالث: المعادلات',
      topicTitle: 'حل المعادلة التربيعية بالقانون العام (الدستور)',
      cognitiveGoals: `1. أن يتعرف الطالب على الصيغة العامة للمعادلة التربيعية ax² + bx + c = 0.
2. أن يحفظ الطالب قانون الدستور x = (-b ± √(b² - 4ac)) / 2a بدقة.
3. أن يحدد الطالب المعاملات a و b و c مع مراعاة الإشارات.`,
      skillGoals: `1. أن يعوض الطالب المعاملات في قانون الدستور بصورة صحيحة.
2. أن يحسب المقدار المميز Δ = b² - 4ac ويحدد نوع جذري المعادلة.`,
      affectiveGoals: `1. أن يدرك الطالب أهمية القانون العام في حل المعادلات التي يصعب تحليلها بالتجربة.
2. أن ينمي الدقة والتنظيم في إجراء العمليات الجبرية والحسابية.`,
      aids: 'السبورة والأقلام، الكتاب المدرسي، بطاقات عمل لقانون الدستور، حاسبة توضيحية',
      strategies: 'العصف الذهني، الحوار والمناقشة، حل المشكلات، النمذجة',
      warmup: 'مراجعة حل المعادلات بالتجربة، وعرض معادلة يصعب تحليلها بالتجربة (مثل x² + 4x - 2 = 0) لإبراز الحاجة لقانون الدستور.',
      instruction: '1. كتابة قانون الدستور وقانون المميز على السبورة.\n2. توضيح خطوات الحل: ترتيب المعادلة، استخراج المعاملات، تطبيق القانون، تبسيط الجذور.\n3. حل مثال وزاري نموذجي ومشاركة الطلبة.\n4. تدريب الطلبة على حل تمرين فردي.',
      realWorldConnection: 'ربط حركة المقذوفات ومسائل المساحات الهندسية بالمعادلات التربيعية.',
      formativeAssessment: 'توجيه أسئلة سريعة حول تحديد قيم a, b, c لمعادلات مختلفة مع الانتباه للإشارة السالبة.',
      summativeAssessment: 'حل المعادلة: 2x² + 5x - 3 = 0 باستخدام الدستور.',
      homework: 'تمارين (تأكد من فهمك) ص 84: التمارين (1 ، 2 ، 4).'
    },
    arabic: {
      name: 'لغة عربية - أسلوب الاستفهام (السادس الإعدادي)',
      subject: 'اللغة العربية',
      grade: 'السادس الإعدادي (العلمي والأدبي)',
      unitTitle: 'قواعد اللغة العربية: أسلوب الاستفهام',
      topicTitle: 'أنواع الاستفهام: التصديق والتصور وأدواتهما',
      cognitiveGoals: `1. أن يعرف الطالب أسلوب الاستفهام وأدواته (حروف وأسماء).
2. أن يميز الطالب بين استفهام التصديق واستفهام التصور.
3. أن يحدد الطالب نوع (أم) المعادلة المتصلة ودورها في الاستفهام.`,
      skillGoals: `1. أن يعرب الطالب أدوات الاستفهام حسب موقعها في الجملة.
2. أن يستبدل (هل) بـ (الهمزة) وبالعكس مبيناً السبب والخصيصة.`,
      affectiveGoals: `1. أن يتذوق الطالب بلاغة القرآن الكريم والشعر العربي في توظيف الاستفهام.
2. أن يعتز بجماليات اللغة العربية ودقة تراكيبها.`,
      aids: 'السبورة، الكتاب المنهجي، شواهد قرآنية وشعرية مطبوعة',
      strategies: 'الاستقراء والاستنتاج، الحوار والمناقشة، التعلم التعاوني',
      warmup: 'عرض آيتين كريمتين إحداهما تصديق والأخرى تصور، ومناقشة طريقة الجواب في كل منهما.',
      instruction: '1. استعراض مفهوم الاستفهام وأقسامه.\n2. تفصيل خصائص الهمزة ومقارنتها بـ (هل).\n3. إعراب أمثلة وزارية تطبيقية.\n4. ورقة عمل تنافسية بين مجموعات الصف.',
      realWorldConnection: 'استخدام الاستفهام في الحوار اليومي والإقناع الصحفي والإعلامي.',
      formativeAssessment: 'بين نوع الاستفهام في قوله تعالى: (أأنتم تخلقونه أم نحن الخالقون) معللاً ذلك.',
      summativeAssessment: 'استخرج الاستفهام مبيناً أداته ونوعه والخصيصة من أبيات شعرية وزارية معطاة.',
      homework: 'حل التمرينين الأول والثاني من تمارين الكتاب الوزاري المقررة.'
    },
    physics: {
      name: 'فيزياء - قانون كولوم والمجال الكهربائي (الثالث متوسط)',
      subject: 'الفيزياء',
      grade: 'الثالث متوسط',
      unitTitle: 'الفصل الأول: الكهربائية الساكنة',
      topicTitle: 'قانون كولوم لحساب القوة الكهربائية المتبادلة',
      cognitiveGoals: `1. أن ينص الطالب على قانون كولوم للكهربائية الساكنة.
2. أن يكتب الصيغة الرياضية لقانون كولوم F = k (q₁ q₂) / r².
3. أن يذكر وحدة قياس كل كمية في القانون وثابت كولوم k.`,
      skillGoals: `1. أن يطبق الطالب قانون كولوم في حل المسائل الحسابية بدقة.
2. أن يحول البادئات (الميكروكولوم إلى كولوم، والسنتيمتر إلى متر).`,
      affectiveGoals: `1. أن يقدر جهود العلماء في اكتشاف القوانين الفيزيائية.
2. أن يدرك أهمية التطبيقات الكهروستاتيكية في الحياة (مثل المرذاذ وآلات الاستنساخ).`,
      aids: 'السبورة، شحنات نقطية توضيحية، الكتاب، جهاز عرض، بطاقات تحويل الوحدات',
      strategies: 'حل المشكلات، الاستقصاء، التعلم النشط، الحوار والمناقشة',
      warmup: 'مراجعة قوى التجاذب والتنافر بين الشحنات، وطرح سؤال: "على ماذا يعتمد مقدار هذه القوة؟".',
      instruction: '1. اشتقاق علاقة كولوم طردياً مع حاصل ضرب الشحنتين وعكسياً مع مربع البعد.\n2. التركيز على تحويل الوحدات (μC → C, cm → m).\n3. حل المسألة الوزارية الأولى على السبورة.\n4. حل مسألة تدريبية في الدفتر الصفي.',
      realWorldConnection: 'تفسير ظواهر الصواعق والتصاق الغبار بشاشات التلفاز والحاسوب.',
      formativeAssessment: 'ماذا يحدث للقوة الكهربائية المتبادلة بين شحنتين إذا تضاعف البعد بينهما إلى الضعف؟',
      summativeAssessment: 'حل مسألة: شحنتان نقطيتان موجبتان مقدارهما 4μC و 9μC والبعد بينهما 0.06m، احسب القوة المتبادلة ونوعها.',
      homework: 'حل المسألة رقم (1) ورقم (2) من مسائل نهاية الفصل الأول صفحة 30.'
    },
    english: {
      name: 'English - Past Simple & Past Continuous (3rd Intermediate)',
      subject: 'English (اللغة الإنكليزية)',
      grade: '3rd Intermediate (الثالث متوسط)',
      unitTitle: 'Unit 1: Information Technology & School Life',
      topicTitle: 'Past Continuous & Past Simple with (when / while / as)',
      cognitiveGoals: `1. Students will identify the structure of Past Continuous (was/were + v-ing).
2. Students will understand the use of Past Simple for interrupted actions.
3. Students will memorize linking words (while, as, when, and).`,
      skillGoals: `1. Students will combine two sentences using while or when correctly.
2. Students will write ministerial sentences with correct verb forms.`,
      affectiveGoals: `1. Build students' confidence in speaking about past events in English.
2. Foster collaborative learning through pair work exercises.`,
      aids: 'Whiteboard, Student\'s Book, Flashcards with verbs, Audio player',
      strategies: 'PPP (Presentation, Practice, Production), Communicative approach, Pair work',
      warmup: 'Ask students: "What were you doing at 7 PM yesterday?" to elicit past continuous naturally.',
      instruction: '1. Elicit timelines of long vs. short action.\n2. Write rule on board: (While/As + Past Continuous, Past Simple).\n3. Provide examples and guided practice.\n4. Pair work: Student\'s Book activity.',
      realWorldConnection: 'Describing daily incidents, accidents, and stories in real life.',
      formativeAssessment: 'Complete the sentence: While Ali (read) a book, his friend called.',
      summativeAssessment: 'Ministry exam question practice: join using "when" with correct punctuation.',
      homework: 'Activity Book page 12, exercises A and B.'
    },
    islamic: {
      name: 'تربية إسلامية - سورة النجم وأحكام التلاوة (السادس الإعدادي)',
      subject: 'التربية الإسلامية',
      grade: 'السادس الإعدادي',
      unitTitle: 'الوحدة الأولى: القرآن الكريم',
      topicTitle: 'سورة النجم (الآيات 1-18) مع أحكام النون الساكنة والتنوين',
      cognitiveGoals: `1. أن يتلو الطالب الآيات الكريمة تلاوة مجودة خالية من اللحن.
2. أن يتعرف الطالب على معاني المفردات القرآنية (ما ضل، وما غوى، قاب قوسين).
3. أن يحدد الطالب أحكام الإظهار والإدغام والإقلاب والإخفاء في الآيات.`,
      skillGoals: `1. أن يطبق الطالب أحكام التجويد عملياً أثناء التلاوة الصفية.
2. أن يحفظ الطالب النص القرآني المقرر عن ظهر قلب رسماً وضبطاً.`,
      affectiveGoals: `1. أن يستشعر الطالب عظمة رحلة الإسراء والمعراج ومكانة النبي محمد ﷺ.
2. أن يلتزم بآداب الاستماع للقرآن الكريم والتدبر في معانيه.`,
      aids: 'المصحف الشريف، السبورة، تسجيل صوتي لأحد القراء الكبار، شاشة عرض',
      strategies: 'التلقين والمحاكاة، الحوار والمناقشة، التعلم التعاوني، التدبر',
      warmup: 'الاستماع لآيات مباركة من سورة النجم بصوت الشيخ عبد الباسط عبد الصمد ثم التمهيد لأسباب النزول.',
      instruction: '1. قراءة المعلم النموذجية للآيات مع بيان الوقف والابتداء.\n2. قراءات فردية للطلبة وتصحيح التلاوة وتطبيق أحكام النون والتنوين.\n3. شرح المعاني والتفسير الإجمالي للآيات.\n4. استخراج الأحكام في جدول منظم.',
      realWorldConnection: 'ترسيخ الإيمان بصدق رسالة النبي ﷺ والالتزام بتعاليم القرآن في السلوك اليومي.',
      formativeAssessment: 'ما معنى قوله تعالى: (وما ينطق عن الهوى)؟ واستخرج حكم تجويد من الآية.',
      summativeAssessment: 'كتابة الآيات الخمس الأولى غيباً مع ضبط الحركات وتحديد حكمي تجويد.',
      homework: 'حفظ الآيات المقررة (1-18) مع معاني الكلمات وحل أسئلة المناقشة في الدفتر.'
    }
  };

  /**
   * Sync Form fields with activePlan object
   */
  function populateFormFromActivePlan() {
    if (!activePlan) return;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val !== undefined && val !== null ? val : '';
    };

    setVal('lpSchoolName', activePlan.schoolName);
    setVal('lpTeacherName', activePlan.teacherName);
    setVal('lpSubject', activePlan.subject);
    setVal('lpGrade', activePlan.grade);
    setVal('lpSection', activePlan.section);
    setVal('lpPeriod', activePlan.period);
    setVal('lpDate', activePlan.date);
    setVal('lpDay', activePlan.day);
    setVal('lpHijriDate', activePlan.hijriDate);
    setVal('lpUnitTitle', activePlan.unitTitle);
    setVal('lpTopicTitle', activePlan.topicTitle);

    setVal('lpCognitiveGoals', activePlan.cognitiveGoals);
    setVal('lpSkillGoals', activePlan.skillGoals);
    setVal('lpAffectiveGoals', activePlan.affectiveGoals);

    setVal('lpAids', activePlan.aids);
    setVal('lpStrategies', activePlan.strategies);
    setVal('lpWarmup', activePlan.warmup);
    setVal('lpInstruction', activePlan.instruction);
    setVal('lpRealWorld', activePlan.realWorldConnection);
    setVal('lpFormative', activePlan.formativeAssessment);
    setVal('lpSummative', activePlan.summativeAssessment);
    setVal('lpHomework', activePlan.homework);
    setVal('lpReflection', activePlan.reflection);
    setVal('lpSupervisorNotes', activePlan.supervisorNotes);
    setVal('lpPrincipalNotes', activePlan.principalNotes);

    updateLiveDateBadge();
    updateLiveLedgerPreview();

    setTimeout(() => {
      const container = document.getElementById('tab-lesson-plan');
      if (container) {
        container.querySelectorAll('textarea').forEach(ta => autoResizeLpTextarea(ta));
      }
    }, 50);
  }

  /**
   * Read form fields and update activePlan
   */
  function syncActivePlanFromForm() {
    if (!activePlan) activePlan = getDefaultPlan();

    const getVal = (id, fallback = '') => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : fallback;
    };

    activePlan.schoolName = getVal('lpSchoolName', activePlan.schoolName);
    activePlan.teacherName = getVal('lpTeacherName', activePlan.teacherName);
    activePlan.subject = getVal('lpSubject', activePlan.subject);
    activePlan.grade = getVal('lpGrade', activePlan.grade);
    activePlan.section = getVal('lpSection', activePlan.section);
    activePlan.period = getVal('lpPeriod', activePlan.period);
    activePlan.date = getVal('lpDate', activePlan.date);
    activePlan.day = getVal('lpDay', activePlan.day);
    activePlan.hijriDate = getVal('lpHijriDate', activePlan.hijriDate);
    activePlan.unitTitle = getVal('lpUnitTitle', activePlan.unitTitle);
    activePlan.topicTitle = getVal('lpTopicTitle', activePlan.topicTitle);

    activePlan.cognitiveGoals = getVal('lpCognitiveGoals');
    activePlan.skillGoals = getVal('lpSkillGoals');
    activePlan.affectiveGoals = getVal('lpAffectiveGoals');

    activePlan.aids = getVal('lpAids');
    activePlan.strategies = getVal('lpStrategies');
    activePlan.warmup = getVal('lpWarmup');
    activePlan.instruction = getVal('lpInstruction');
    activePlan.realWorldConnection = getVal('lpRealWorld');
    activePlan.formativeAssessment = getVal('lpFormative');
    activePlan.summativeAssessment = getVal('lpSummative');
    activePlan.homework = getVal('lpHomework');
    activePlan.reflection = getVal('lpReflection');
    activePlan.supervisorNotes = getVal('lpSupervisorNotes');
    activePlan.principalNotes = getVal('lpPrincipalNotes');

    persistActivePlan();
    updateLiveDateBadge();
    updateLiveLedgerPreview();
  }

  /**
   * Updates prominent date header badge (التركيز على التاريخ لإبرازه للمشرف والإدارة)
   */
  function updateLiveDateBadge() {
    const badgeEl = document.getElementById('lpLiveDateHighlightBadge');
    if (!badgeEl || !activePlan) return;

    badgeEl.innerHTML = `
      <div class="lp-date-badge-box">
        <div class="lp-date-badge-col">
          <span class="lp-badge-label"><i class="fa-solid fa-calendar-week"></i> اليوم الرسمي:</span>
          <strong class="lp-badge-val highlight-gold" id="lpBadgeDayVal">${activePlan.day || 'الأحد'}</strong>
        </div>
        <div class="lp-date-badge-divider"></div>
        <div class="lp-date-badge-col">
          <span class="lp-badge-label"><i class="fa-solid fa-calendar-day"></i> التاريخ الميلادي:</span>
          <strong class="lp-badge-val highlight-blue" id="lpBadgeDateVal">${activePlan.date || getTodayDateString()} م</strong>
        </div>
        <div class="lp-date-badge-divider"></div>
        <div class="lp-date-badge-col">
          <span class="lp-badge-label"><i class="fa-solid fa-moon"></i> التاريخ الهجري:</span>
          <strong class="lp-badge-val highlight-green" id="lpBadgeHijriVal">${activePlan.hijriDate || '1448 هـ'}</strong>
        </div>
        <div class="lp-date-badge-divider"></div>
        <div class="lp-date-badge-col">
          <span class="lp-badge-label"><i class="fa-solid fa-chalkboard-user"></i> الحصة / الشعبة:</span>
          <strong class="lp-badge-val highlight-purple" id="lpBadgePeriodVal">${activePlan.period || 'الحصة الأولى'} (${activePlan.section ? 'شعبة ' + activePlan.section : 'شعبة أ'})</strong>
        </div>
      </div>
    `;
  }

  /**
   * Quick Date Presets: 0 for today, +1 for tomorrow, -1 for yesterday
   */
  window.setLessonPlanQuickDate = function(offsetDays) {
    const d = new Date();
    if (offsetDays !== 0) {
      d.setDate(d.getDate() + offsetDays);
    }
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${dayNum}`;

    const dateInput = document.getElementById('lpDate');
    if (dateInput) {
      dateInput.value = dateStr;
      window.handleLessonPlanDateChange(dateStr);
    }
  };

  /**
   * Recalculate Hijri date from current date picker
   */
  window.recalcHijriDate = function() {
    const dateInput = document.getElementById('lpDate');
    const dateVal = dateInput ? dateInput.value : '';
    if (dateVal) {
      window.handleLessonPlanDateChange(dateVal);
    } else {
      const hijriInput = document.getElementById('lpHijriDate');
      if (hijriInput) hijriInput.value = getHijriDateString(new Date());
      syncActivePlanFromForm();
    }
    if (typeof window.showToast === 'function') {
      window.showToast('تم تحديث التاريخ الهجري تلقائياً 🌙', 'success');
    }
  };

  /**
   * Writing Toolbar Helpers: Bullet point insertion
   */
  window.insertLpBullet = function(textareaId) {
    const el = document.getElementById(textareaId);
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const val = el.value;
    const prefix = (start > 0 && val[start - 1] !== '\n') ? '\n• ' : '• ';
    el.value = val.substring(0, start) + prefix + val.substring(end);
    el.focus();
    el.selectionStart = el.selectionEnd = start + prefix.length;
    autoResizeLpTextarea(el);
    syncActivePlanFromForm();
  };

  /**
   * Writing Toolbar Helpers: Numbered step insertion
   */
  window.insertLpNumber = function(textareaId) {
    const el = document.getElementById(textareaId);
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const val = el.value;
    const lines = val.substring(0, start).split('\n');
    let nextNum = 1;
    const lastLine = lines[lines.length - 1];
    const numMatch = lastLine.match(/^(\d+)\./);
    if (numMatch) {
      nextNum = parseInt(numMatch[1], 10) + 1;
    } else {
      const matches = val.match(/^\d+\./gm);
      nextNum = matches ? matches.length + 1 : 1;
    }
    const prefix = (start > 0 && val[start - 1] !== '\n') ? `\n${nextNum}. ` : `${nextNum}. `;
    el.value = val.substring(0, start) + prefix + val.substring(end);
    el.focus();
    el.selectionStart = el.selectionEnd = start + prefix.length;
    autoResizeLpTextarea(el);
    syncActivePlanFromForm();
  };

  function autoResizeLpTextarea(el) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.max(el.scrollHeight + 4, 85) + 'px';
  }

  /**
   * Handle Date Picker change (auto calculates Day and Hijri)
   */
  window.handleLessonPlanDateChange = function(newDateVal) {
    if (!newDateVal) return;
    const parts = newDateVal.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const dayName = ARABIC_DAYS[d.getDay()] || 'الأحد';
      const hijri = getHijriDateString(d);

      const dayInput = document.getElementById('lpDay');
      if (dayInput) dayInput.value = dayName;

      const hijriInput = document.getElementById('lpHijriDate');
      if (hijriInput) hijriInput.value = hijri;

      syncActivePlanFromForm();

      if (typeof window.showToast === 'function') {
        window.showToast(`تم توثيق اليوم والتاريخ: (${dayName}) | ${hijri} 📅`, 'info');
      }
    }
  };

  /**
   * Real-time official A4 Preview inside the app
   */
  function updateLiveLedgerPreview() {
    const previewEl = document.getElementById('lpOfficialLedgerPreview');
    if (!previewEl || !activePlan) return;

    previewEl.innerHTML = generateOfficialHtml(activePlan, false);
  }

  /**
   * Helper to format user text into neat bullet points or paragraphs
   */
  function formatLpContent(text) {
    if (!text || !text.trim()) return '<span class="olp-empty-placeholder">—</span>';
    const lines = text.trim().split('\n');
    let html = '';
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const clean = trimmed.replace(/^[•\-\*]\s*/, '');
        html += `<div class="olp-list-item"><span class="olp-bullet">•</span><span class="olp-item-text">${clean}</span></div>`;
      } else if (/^\d+[\.\)]/.test(trimmed)) {
        const num = trimmed.match(/^(\d+)[\.\)]/)[1];
        const clean = trimmed.replace(/^\d+[\.\)]\s*/, '');
        html += `<div class="olp-list-item"><span class="olp-num">${num}.</span><span class="olp-item-text">${clean}</span></div>`;
      } else {
        html += `<div class="olp-paragraph">${trimmed}</div>`;
      }
    });
    return html || '<span class="olp-empty-placeholder">—</span>';
  }

  /**
   * Generate Full Official Lesson Plan HTML (conforming to Ministry standards)
   */
  function generateOfficialHtml(p, forPrint = false) {
    return `
      <div class="official-lesson-plan-page ${forPrint ? 'is-print-view' : ''}" dir="rtl">
        <div class="olp-master-border-frame">
          
          <!-- الترويسة الوزارية الرسمية -->
          <div class="olp-formal-header">
            <div class="olp-fh-right">
              <div class="olp-country">جمهورية العراق</div>
              <div class="olp-ministry">وزارة التربية</div>
              <div class="olp-school">${p.schoolName || 'اسم المدرسة'}</div>
            </div>

            <div class="olp-fh-center">
              <div class="olp-emblem"><i class="fa-solid fa-graduation-cap"></i></div>
              <h2 class="olp-main-title">سجل الخطة اليومية للمعلم</h2>
              <div class="olp-sub-badge">معتمد للإشراف التربوي التخصصي وإدارة المدرسة</div>
            </div>

            <div class="olp-fh-left">
              <table class="olp-info-mini-table">
                <tr><td>المعلم:</td><td><strong>${p.teacherName || '—'}</strong></td></tr>
                <tr><td>المادة:</td><td><strong>${p.subject || '—'}</strong></td></tr>
                <tr><td>الصف والشعبة:</td><td><strong>${p.grade || '—'} (${p.section || '—'})</strong></td></tr>
              </table>
            </div>
          </div>

          <!-- جدول السجل الشامل والمحكم -->
          <table class="olp-master-ledger-table">
            <!-- شريط الجدولة والتوثيق الرسمي -->
            <tr class="olp-header-row">
              <td class="olp-th-field" style="width: 10%;">اليوم:</td>
              <td class="olp-td-field olp-cell-day" style="width: 12%;">${p.day || 'الأحد'}</td>
              <td class="olp-th-field" style="width: 13%;">التاريخ الميلادي:</td>
              <td class="olp-td-field olp-cell-date" style="width: 15%;">${p.date || '—'} م</td>
              <td class="olp-th-field" style="width: 13%;">التاريخ الهجري:</td>
              <td class="olp-td-field olp-cell-hijri" style="width: 17%;">${p.hijriDate || '—'}</td>
              <td class="olp-th-field" style="width: 10%;">رقم الحصة:</td>
              <td class="olp-td-field" style="width: 10%; font-weight: 800;">${p.period || 'الأولى'}</td>
            </tr>

            <!-- موضوع الدرس / عنوان المحاضرة الرئيسي -->
            <tr class="olp-topic-row">
              <td class="olp-th-field olp-th-topic">موضوع الدرس:</td>
              <td colspan="7" class="olp-td-field olp-td-topic">
                <span class="olp-topic-name">${p.topicTitle || '—'}</span>
                ${p.unitTitle ? `<span class="olp-unit-tag">${p.unitTitle}</span>` : ''}
              </td>
            </tr>

            <!-- أولاً: الأهداف السلوكية للدرس -->
            <tr class="olp-section-divider-row">
              <th colspan="8">
                <div class="olp-sec-head">
                  <span class="olp-sec-title"><i class="fa-solid fa-bullseye text-primary"></i> أولاً: الأهداف السلوكية والتربوية للدرس</span>
                  <span class="olp-sec-hint">معايير الإشراف التربوي التخصصي (ينبغي في نهاية الدرس أن يكون الطالب قادراً على:)</span>
                </div>
              </th>
            </tr>
            <tr class="olp-sub-th-row">
              <th colspan="3" style="width: 34%;">1. المجال المعرفي (المفاهيم والحقائق)</th>
              <th colspan="3" style="width: 34%;">2. المجال المهاري (التطبيق والأداء العملي)</th>
              <th colspan="2" style="width: 32%;">3. المجال الوجداني (القيم والاتجاهات)</th>
            </tr>
            <tr class="olp-goals-data-row">
              <td colspan="3" class="olp-content-box">${formatLpContent(p.cognitiveGoals)}</td>
              <td colspan="3" class="olp-content-box">${formatLpContent(p.skillGoals)}</td>
              <td colspan="2" class="olp-content-box">${formatLpContent(p.affectiveGoals)}</td>
            </tr>

            <!-- ثانياً: الوسائل واستراتيجيات التدريس -->
            <tr class="olp-section-divider-row">
              <th colspan="8">
                <div class="olp-sec-head">
                  <span class="olp-sec-title"><i class="fa-solid fa-chalkboard-user text-warning"></i> ثانياً: الوسائل التعليمية واستراتيجيات التدريس الحديثة</span>
                </div>
              </th>
            </tr>
            <tr class="olp-two-halves-row">
              <td colspan="4" class="olp-half-cell">
                <div class="olp-cell-head"><i class="fa-solid fa-shapes"></i> الوسائل والتقنيات التعليمية المستخدمة:</div>
                <div class="olp-content-box-inner">${formatLpContent(p.aids)}</div>
              </td>
              <td colspan="4" class="olp-half-cell">
                <div class="olp-cell-head"><i class="fa-solid fa-lightbulb"></i> استراتيجيات التدريس المعتمدة:</div>
                <div class="olp-content-box-inner">${formatLpContent(p.strategies)}</div>
              </td>
            </tr>

            <!-- ثالثاً: خطوات سير وتنفيذ الدرس -->
            <tr class="olp-section-divider-row">
              <th colspan="8">
                <div class="olp-sec-head">
                  <span class="olp-sec-title"><i class="fa-solid fa-list-ol text-success"></i> ثالثاً: سير وخطوات تنفيذ الدرس والأنشطة الصفية (التدفق الزمني للحصة)</span>
                </div>
              </th>
            </tr>
            <tr class="olp-step-row">
              <td colspan="2" class="olp-step-label-cell">
                <strong>1. التمهيد والتهيئة الحافزة</strong>
                <small class="olp-time-pill">5 دقائق</small>
              </td>
              <td colspan="6" class="olp-content-box">${formatLpContent(p.warmup)}</td>
            </tr>
            <tr class="olp-step-row">
              <td colspan="2" class="olp-step-label-cell">
                <strong>2. العرض والشرح وتفاعل الطلبة</strong>
                <small class="olp-time-pill">25 دقيقة</small>
              </td>
              <td colspan="6" class="olp-content-box">${formatLpContent(p.instruction)}</td>
            </tr>
            ${p.realWorldConnection ? `
            <tr class="olp-step-row">
              <td colspan="2" class="olp-step-label-cell">
                <strong>3. التطبيق والربط الوزاري</strong>
                <small class="olp-time-pill">10 دقائق</small>
              </td>
              <td colspan="6" class="olp-content-box">${formatLpContent(p.realWorldConnection)}</td>
            </tr>
            ` : ''}

            <!-- رابعاً: التقويم والواجب والتأمل -->
            <tr class="olp-section-divider-row">
              <th colspan="8">
                <div class="olp-sec-head">
                  <span class="olp-sec-title"><i class="fa-solid fa-clipboard-check text-danger"></i> رابعاً: التقويم الصفي، الواجب البيتي، والتأمل الذاتي للمعلم</span>
                </div>
              </th>
            </tr>
            <tr class="olp-eval-data-row">
              <td colspan="3" class="olp-eval-cell">
                <div class="olp-cell-head"><i class="fa-solid fa-circle-question"></i> التقويم التكويني (أثناء الشرح):</div>
                <div class="olp-content-box-inner">${formatLpContent(p.formativeAssessment)}</div>
              </td>
              <td colspan="3" class="olp-eval-cell">
                <div class="olp-cell-head"><i class="fa-solid fa-circle-check"></i> التقويم الختامي (نهاية الحصة):</div>
                <div class="olp-content-box-inner">${formatLpContent(p.summativeAssessment)}</div>
              </td>
              <td colspan="2" class="olp-eval-cell">
                <div class="olp-cell-head"><i class="fa-solid fa-book-bookmark"></i> الواجب البيتي:</div>
                <div class="olp-content-box-inner">${formatLpContent(p.homework)}</div>
              </td>
            </tr>

            ${p.reflection ? `
            <tr class="olp-reflection-row">
              <td colspan="2" class="olp-th-field" style="font-size: 0.82rem;">التأمل الذاتي وملاحظات التنفيذ:</td>
              <td colspan="6" class="olp-td-field" style="font-size: 0.88rem; color: #334155;">${formatLpContent(p.reflection)}</td>
            </tr>
            ` : ''}

            <!-- خامساً: الاعتماد والمصادقة الرسمية -->
            <tr class="olp-signatures-row">
              <td colspan="3" class="olp-sig-block">
                <div class="olp-sig-title">إعداد وتوقيع المعلم</div>
                <div class="olp-sig-teacher-name">${p.teacherName || '—'}</div>
                <div class="olp-sig-line">التوقيع: ............................</div>
                <div class="olp-sig-date">التاريخ: ${p.date || '—'}</div>
              </td>
              <td colspan="3" class="olp-sig-block olp-sig-supervisor">
                <div class="olp-sig-title olp-sig-sup-title"><i class="fa-solid fa-signature"></i> توجيهات وتوقيع المشرف التربوي / الاختصاصي</div>
                <div class="olp-sup-notes-line">${p.supervisorNotes ? p.supervisorNotes : '................................................................................................'}</div>
                <div class="olp-sig-line">توقيع المشرف: ............................ الختم: [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]</div>
              </td>
              <td colspan="2" class="olp-sig-block">
                <div class="olp-sig-title">اطلاع وتوقيع مدير المدرسة</div>
                <div class="olp-sup-notes-line" style="min-height: 22px;">${p.principalNotes ? p.principalNotes : '......................................................'}</div>
                <div class="olp-sig-line">توقيع المدير: ............................</div>
                <div class="olp-sig-stamp-mark">ختم الإدارة المدرسية</div>
              </td>
            </tr>
          </table>

        </div>
      </div>
    `;
  }

  /**
   * Switch to Lesson Plan tab from anywhere
   */
  window.switchToLessonPlanTab = function() {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');

    const tabBtn = document.getElementById('mainTabLessonPlanBtn');
    if (tabBtn) tabBtn.classList.add('active');

    const content = document.getElementById('tab-lesson-plan');
    if (content) content.style.display = 'block';

    loadActivePlan();
    populateFormFromActivePlan();

    // Scroll smoothly to top of pane
    const pane = document.querySelector('.builder-body-scrollable');
    if (pane) pane.scrollTop = 0;
  };

  /**
   * Workspace Mode Switcher: 'edit', 'preview', or 'split'
   */
  let currentViewMode = 'edit';
  let currentSheetZoom = 1;

  window.setLessonPlanViewMode = function(mode) {
    currentViewMode = mode;
    const gridEl = document.getElementById('lpWorkspaceGrid');
    const formEl = document.getElementById('lpFormContainer');
    const previewSection = document.getElementById('lpOfficialLedgerPreviewSection');
    const zoomBar = document.getElementById('lpPreviewZoomBar');

    const btnEdit = document.getElementById('lpViewModeEditBtn');
    const btnPreview = document.getElementById('lpViewModePreviewBtn');
    const btnSplit = document.getElementById('lpViewModeSplitBtn');

    if (btnEdit) btnEdit.classList.toggle('active', mode === 'edit');
    if (btnPreview) btnPreview.classList.toggle('active', mode === 'preview');
    if (btnSplit) btnSplit.classList.toggle('active', mode === 'split');

    if (gridEl) {
      gridEl.classList.remove('mode-edit', 'mode-preview', 'mode-split');
      gridEl.classList.add(`mode-${mode}`);
    }

    if (mode === 'edit') {
      if (formEl) formEl.style.display = 'block';
      if (previewSection) previewSection.style.display = 'none';
      if (zoomBar) zoomBar.style.display = 'none';
    } else if (mode === 'preview') {
      if (formEl) formEl.style.display = 'none';
      if (previewSection) previewSection.style.display = 'block';
      if (zoomBar) zoomBar.style.display = 'flex';
      updateLiveLedgerPreview();
    } else if (mode === 'split') {
      if (formEl) formEl.style.display = 'block';
      if (previewSection) previewSection.style.display = 'block';
      if (zoomBar) zoomBar.style.display = 'flex';
      updateLiveLedgerPreview();
    }
  };

  window.changeLpSheetZoom = function(delta) {
    currentSheetZoom = Math.max(0.6, Math.min(1.4, Math.round((currentSheetZoom + delta) * 10) / 10));
    const sheet = document.querySelector('#lpOfficialLedgerPreview .official-lesson-plan-page');
    if (sheet) {
      sheet.style.transform = `scale(${currentSheetZoom})`;
      sheet.style.transformOrigin = 'top center';
    }
    const zoomLabel = document.getElementById('lpZoomPercentLabel');
    if (zoomLabel) zoomLabel.textContent = `${Math.round(currentSheetZoom * 100)}%`;
  };

  window.resetLpSheetZoom = function() {
    currentSheetZoom = 1;
    const sheet = document.querySelector('#lpOfficialLedgerPreview .official-lesson-plan-page');
    if (sheet) {
      sheet.style.transform = 'scale(1)';
    }
    const zoomLabel = document.getElementById('lpZoomPercentLabel');
    if (zoomLabel) zoomLabel.textContent = '100%';
  };

  /**
   * Helper generating CSS rules for official A4 printing
   */
  function getOfficialPrintCss(forBatch = false) {
    return `
      @page {
        size: A4 portrait;
        margin: 6mm 8mm;
      }
      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body {
        font-family: 'Cairo', sans-serif;
        margin: 0;
        padding: ${forBatch ? '0' : '4px'};
        background: #ffffff;
        color: #0f172a;
        font-size: 10pt;
        line-height: 1.4;
      }
      .official-lesson-plan-page {
        max-width: 100%;
        margin: 0 auto;
        background: #ffffff;
        ${forBatch ? 'page-break-after: always !important; break-after: page !important; min-height: 275mm; box-sizing: border-box; padding: 4px;' : ''}
      }
      ${forBatch ? '.official-lesson-plan-page:last-child { page-break-after: avoid !important; break-after: avoid !important; }' : ''}
      
      .olp-master-border-frame {
        border: 2px solid #0f2e5a;
        padding: 8px;
        border-radius: 4px;
        background: #ffffff;
      }
      .olp-formal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #0f2e5a;
        padding-bottom: 6px;
        margin-bottom: 6px;
      }
      .olp-fh-right {
        text-align: right;
        line-height: 1.35;
        font-size: 0.84rem;
        font-weight: 700;
        min-width: 160px;
      }
      .olp-country { font-size: 0.8rem; color: #475569; }
      .olp-ministry { font-size: 0.9rem; font-weight: 800; color: #0f2e5a; }
      .olp-school { font-size: 0.9rem; font-weight: 900; color: #1e3a8a; }

      .olp-fh-center {
        text-align: center;
        flex: 1;
      }
      .olp-emblem { font-size: 1.3rem; color: #0f2e5a; }
      .olp-main-title {
        margin: 0;
        font-size: 1.35rem;
        font-weight: 900;
        color: #0f2e5a;
      }
      .olp-sub-badge {
        display: inline-block;
        font-size: 0.7rem;
        font-weight: 800;
        color: #047857;
        background: #ecfdf5;
        border: 1px solid #a7f3d0;
        padding: 1px 8px;
        border-radius: 8px;
      }

      .olp-fh-left { text-align: left; min-width: 190px; }
      .olp-info-mini-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
      .olp-info-mini-table td { padding: 1px 3px; color: #334155; line-height: 1.3; }
      .olp-info-mini-table td:first-child { font-weight: 700; color: #64748b; width: 70px; }

      .olp-master-ledger-table {
        width: 100%;
        border-collapse: collapse;
        border: 1.5px solid #0f2e5a;
      }
      .olp-master-ledger-table td,
      .olp-master-ledger-table th {
        border: 1px solid #94a3b8;
        padding: 5px 8px;
        vertical-align: top;
        font-size: 0.84rem;
        line-height: 1.45;
      }
      .olp-th-field {
        background: #f8fafc;
        color: #0f2e5a;
        font-weight: 800;
        font-size: 0.8rem;
        white-space: nowrap;
      }
      .olp-td-field { color: #0f172a; font-weight: 700; }
      .olp-cell-day { color: #0f2e5a; font-weight: 900; font-size: 0.92rem; }
      .olp-cell-date { color: #1e40af; font-weight: 900; font-size: 0.92rem; }
      .olp-cell-hijri { color: #047857; font-weight: 800; font-size: 0.84rem; }
      .olp-th-topic { background: #f1f5f9; font-weight: 900; color: #0f2e5a; vertical-align: middle; }
      .olp-td-topic { background: #ffffff; vertical-align: middle; }
      .olp-topic-name { font-weight: 900; font-size: 1rem; color: #0f2e5a; }
      .olp-unit-tag {
        display: inline-block;
        margin-right: 6px;
        font-size: 0.78rem;
        font-weight: 700;
        color: #64748b;
        background: #f1f5f9;
        padding: 1px 6px;
        border-radius: 4px;
        border: 1px solid #e2e8f0;
      }

      .olp-section-divider-row th {
        background: #0f2e5a !important;
        color: #ffffff !important;
        padding: 4px 8px;
        border-color: #0f2e5a !important;
      }
      .olp-sec-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }
      .olp-sec-title { font-weight: 900; font-size: 0.84rem; }
      .olp-sec-hint { font-size: 0.72rem; color: #e2e8f0; }

      .olp-sub-th-row th {
        background: #f1f5f9;
        color: #1e293b;
        font-weight: 800;
        font-size: 0.8rem;
        padding: 4px 6px;
        text-align: right;
      }
      .olp-content-box { background: #ffffff; padding: 6px 8px !important; }
      .olp-content-box-inner { font-size: 0.84rem; line-height: 1.45; }
      .olp-cell-head {
        font-weight: 800;
        font-size: 0.8rem;
        color: #0f2e5a;
        margin-bottom: 3px;
        padding-bottom: 2px;
        border-bottom: 1px dashed #cbd5e1;
      }
      .olp-half-cell, .olp-eval-cell { background: #ffffff; padding: 6px 8px !important; }
      .olp-step-label-cell {
        background: #f8fafc;
        vertical-align: middle !important;
        font-size: 0.8rem;
      }
      .olp-time-pill {
        display: block;
        font-size: 0.72rem;
        color: #64748b;
        font-weight: 700;
      }

      .olp-signatures-row td {
        background: #f8fafc;
        padding: 8px 10px !important;
        text-align: center;
        border-top: 1.5px solid #0f2e5a;
      }
      .olp-sig-title { font-weight: 900; font-size: 0.82rem; color: #0f2e5a; margin-bottom: 4px; }
      .olp-sig-teacher-name { font-weight: 800; font-size: 0.84rem; color: #1e293b; }
      .olp-sig-line { margin-top: 14px; color: #64748b; font-size: 0.76rem; font-weight: 600; }
      .olp-sig-date, .olp-sig-stamp-mark { margin-top: 3px; color: #94a3b8; font-size: 0.72rem; }
      .olp-sig-supervisor {
        background: #fffdf5 !important;
        border-left: 1.5px dashed #ca8a04 !important;
        border-right: 1.5px dashed #ca8a04 !important;
      }
      .olp-sig-sup-title { color: #b45309 !important; }
      .olp-sup-notes-line { font-size: 0.74rem; color: #475569; min-height: 18px; margin: 2px 0; }

      .olp-list-item { display: flex; align-items: flex-start; gap: 5px; margin-bottom: 3px; line-height: 1.4; }
      .olp-list-item:last-child { margin-bottom: 0; }
      .olp-bullet { color: #2563eb; font-weight: 900; font-size: 0.95rem; line-height: 1.2; }
      .olp-num { color: #0f2e5a; font-weight: 800; font-size: 0.82rem; }
      .olp-item-text { flex: 1; }
      .olp-paragraph { margin-bottom: 3px; line-height: 1.4; }
      .olp-empty-placeholder { color: #94a3b8; font-style: italic; font-size: 0.78rem; }
    `;
  }

  /**
   * Apply a Curriculum Preset Template
   */
  window.applyLessonPlanTemplate = function(templateKey) {
    const tpl = LESSON_TEMPLATES[templateKey];
    if (!tpl) return;

    if (!activePlan) activePlan = getDefaultPlan();

    activePlan.subject = tpl.subject;
    activePlan.grade = tpl.grade;
    activePlan.unitTitle = tpl.unitTitle;
    activePlan.topicTitle = tpl.topicTitle;
    activePlan.cognitiveGoals = tpl.cognitiveGoals;
    activePlan.skillGoals = tpl.skillGoals;
    activePlan.affectiveGoals = tpl.affectiveGoals;
    activePlan.aids = tpl.aids;
    activePlan.strategies = tpl.strategies;
    activePlan.warmup = tpl.warmup;
    activePlan.instruction = tpl.instruction;
    activePlan.realWorldConnection = tpl.realWorldConnection;
    activePlan.formativeAssessment = tpl.formativeAssessment;
    activePlan.summativeAssessment = tpl.summativeAssessment;
    activePlan.homework = tpl.homework;

    populateFormFromActivePlan();
    persistActivePlan();

    if (typeof window.showToast === 'function') {
      window.showToast(`تم تحميل نموذج الخطة الوزارية: (${tpl.name}) بنجاح 📋⚡`, 'success');
    }
  };

  /**
   * AI Lesson Plan Generator
   */
  window.generateAiLessonPlan = function() {
    syncActivePlanFromForm();

    const topic = activePlan.topicTitle || 'المعادلات والقوانين';
    const subj = activePlan.subject || 'الرياضيات';
    const grade = activePlan.grade || 'الثالث متوسط';

    // Interactive confirmation or prompt
    const userTopic = prompt(`توليد خطة درس ذكية بالذكاء الاصطناعي للمادة (${subj}) - الصف (${grade}):\nاكتب عنوان الدرس أو الموضوع المطلوب:`, topic);
    if (!userTopic || !userTopic.trim()) return;

    const cleanTopic = userTopic.trim();
    activePlan.topicTitle = cleanTopic;

    // Generate enriched ministerial content
    activePlan.cognitiveGoals = `1. أن يستوعب الطالب المفاهيم والنظريات الأساسية المتعلقة بـ (${cleanTopic}).
2. أن يحلل الطالب الخطوات المنهجية المتبعة لحل مسائل وتمارين الموضوع.
3. أن يستنتج الطالب العلاقات الرياضية/العلمية الدقيقة ذات الصلة بالدرس.`;

    activePlan.skillGoals = `1. أن يطبق الطالب القوانين والخطوات عملياً في حل الأمثلة على السبورة بدقة.
2. أن يمارس الطالب مهارات التفكير الناقد وحل المشكلات في التمارين الفردية والجماعية.`;

    activePlan.affectiveGoals = `1. أن يقدر الطالب التطبيقات العملية لـ (${cleanTopic}) في الحياة اليومية والتقنية.
2. أن يعزز الطالب روح التعاون والمشاركة الإيجابية مع زملائه أثناء الأنشطة الصفية.`;

    activePlan.warmup = `التهيئة الحافزة (5 دقائق):
- مراجعة تمهيدية للمكتسبات السابقة ذات الصلة بـ (${cleanTopic}).
- طرح سؤال تحدٍ ذكي أو مشكلة واقعية لإثارة التساؤل ودافعية الاستكشاف لدى الطلبة.`;

    activePlan.instruction = `العرض وسير الدرس (25 دقيقة):
1. إعلان عنوان الدرس وأهدافه الرئيسة وتدوينها على السبورة.
2. شرح المفاهيم والمصطلحات الأساسية خطوة بخطوة مع إشراك الطلبة واستخدام التقنيات الحديثة.
3. حل مثال وزاري نموذجي وشرح طريقة تجنب الأخطاء الشائعة.
4. تنفيذ نشاط صفي تعاوني بين الطلبة وتوجيه الإرشادات والتغذية الراجعة الفورية.`;

    activePlan.formativeAssessment = `التقويم التكويني:
- طرح أسئلة استكشافية سريعة أثناء الشرح للتأكد من استيعاب 100% من المفاهيم الأساسية.
- إشراك الطلبة في تصويب الإجابات وتوضيح أسباب الحل.`;

    activePlan.summativeAssessment = `التقويم الختامي:
تطبيق وزاري فردي في نهاية الحصة للتأكد من تحقق الأهداف ومطابقة معايير الفهم.`;

    activePlan.homework = `الواجب البيتي:
حل التمارين المقررة في الكتاب المدرسي الخاصة بموضوع (${cleanTopic}) مع التركيز على الأسئلة الوزارية.`;

    activePlan.reflection = `تمت تغطية الدرس بكفاءة عالية وتفاعل معظم الطلبة مع الأنشطة التطبيقية.`;

    populateFormFromActivePlan();
    persistActivePlan();

    if (typeof window.showToast === 'function') {
      window.showToast(`تم توليد الخطة اليومية بالذكاء الاصطناعي لـ "${cleanTopic}" بنجاح 🪄✨`, 'success');
    }
  };

  /**
   * Save current lesson plan to the archive
   */
  window.saveCurrentLessonPlan = function() {
    syncActivePlanFromForm();

    const archive = getArchive();
    const existingIndex = archive.findIndex(x => x.id === activePlan.id);

    const planToSave = JSON.parse(JSON.stringify(activePlan));
    planToSave.savedAt = new Date().toISOString();

    if (existingIndex >= 0) {
      archive[existingIndex] = planToSave;
    } else {
      archive.unshift(planToSave);
    }

    saveArchive(archive);

    if (typeof window.showToast === 'function') {
      window.showToast(`تم حفظ الخطة في سجل الأرشيف بتاريخ (${activePlan.date}) بنجاح 💾✅`, 'success');
    }
  };

  /**
   * Reset Form to a fresh lesson plan
   */
  window.resetLessonPlanForm = function() {
    if (confirm('هل تريد تفريغ الحقول والبدء بنموذج خطة فارغة؟\n(الخطة السابقة ستظل محفوظة في الأرشيف)')) {
      activePlan = getDefaultPlan();
      populateFormFromActivePlan();
      persistActivePlan();
      if (typeof window.showToast === 'function') {
        window.showToast('تم تفريغ الحقول وبدء نموذج خطة فارغة 📄', 'info');
      }
    }
  };

  /**
   * Open Archive Modal
   */
  window.openLessonPlansArchiveModal = function() {
    syncActivePlanFromForm();
    const modal = document.getElementById('lessonPlansArchiveModal');
    if (!modal) return;

    renderArchiveList();
    modal.classList.add('open');
  };

  /**
   * Close Archive Modal
   */
  window.closeLessonPlansArchiveModal = function() {
    const modal = document.getElementById('lessonPlansArchiveModal');
    if (modal) modal.classList.remove('open');
  };

  /**
   * Render Archive Table in Modal
   */
  function renderArchiveList() {
    const listEl = document.getElementById('lpArchiveItemsList');
    if (!listEl) return;

    const archive = getArchive();
    if (!archive || archive.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
          <i class="fa-solid fa-folder-open" style="font-size: 2.5rem; margin-bottom: 0.75rem; color: #94a3b8;"></i>
          <h4 style="margin: 0 0 0.35rem 0; font-weight: 800; color: var(--text-main);">لا توجد خطط محفوظة في الأرشيف حتى الآن</h4>
          <p style="font-size: 0.82rem; margin: 0;">اضغط على زر (حفظ في سجل الخطط) لحفظ خطتك اليومية والرجوع إليها في أي وقت</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = archive.map((item, idx) => `
      <div class="lp-archive-item-card">
        <div class="lp-archive-item-main">
          <div class="lp-archive-item-date">
            <span class="lp-archive-day">${item.day || 'الأحد'}</span>
            <span class="lp-archive-date-num">${item.date || ''}</span>
          </div>
          <div class="lp-archive-details">
            <div class="lp-archive-title">${item.topicTitle || 'بدون عنوان'}</div>
            <div class="lp-archive-meta">
              <span><i class="fa-solid fa-book-open text-primary"></i> ${item.subject || ''}</span>
              <span><i class="fa-solid fa-users text-info"></i> ${item.grade || ''} (${item.section || ''})</span>
              <span><i class="fa-solid fa-clock text-warning"></i> ${item.period || ''}</span>
            </div>
          </div>
        </div>
        <div class="lp-archive-actions">
          <button type="button" class="btn btn-sm btn-primary" onclick="window.loadLessonPlanFromArchive('${item.id}')" title="فتح وتحرير هذه الخطة">
            <i class="fa-solid fa-folder-open"></i> فتح الخطة
          </button>
          <button type="button" class="btn btn-sm btn-outline" onclick="window.printLessonPlanById('${item.id}')" title="طباعة هذه الخطة مباشرة A4">
            <i class="fa-solid fa-print"></i> طباعة
          </button>
          <button type="button" class="btn btn-sm btn-outline text-danger" onclick="window.deleteLessonPlanFromArchive('${item.id}')" title="حذف من الأرشيف">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  /**
   * Load Plan from Archive
   */
  window.loadLessonPlanFromArchive = function(id) {
    const archive = getArchive();
    const found = archive.find(x => x.id === id);
    if (!found) return;

    activePlan = JSON.parse(JSON.stringify(found));
    populateFormFromActivePlan();
    persistActivePlan();
    window.closeLessonPlansArchiveModal();

    if (typeof window.showToast === 'function') {
      window.showToast(`تم فتح الخطة المؤرخة في: (${activePlan.date}) بنجاح 📋`, 'success');
    }
  };

  /**
   * Delete Plan from Archive
   */
  window.deleteLessonPlanFromArchive = function(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الخطة من الأرشيف؟')) return;
    let archive = getArchive();
    archive = archive.filter(x => x.id !== id);
    saveArchive(archive);
    renderArchiveList();

    if (typeof window.showToast === 'function') {
      window.showToast('تم حذف الخطة من الأرشيف 🗑️', 'info');
    }
  };

  /**
   * Print Specific Plan by ID
   */
  window.printLessonPlanById = function(id) {
    const archive = getArchive();
    const found = archive.find(x => x.id === id);
    if (!found) return;
    triggerPrintOfficialPlan(found);
  };

  /**
   * Print Current Active Plan
   */
  window.printLessonPlan = function() {
    syncActivePlanFromForm();
    if (!activePlan) return;
    triggerPrintOfficialPlan(activePlan);
  };

  // ==========================================================================
  // Batch Print Lesson Plans Suite (طباعة حزمة الخطط اليومية من تاريخ إلى تاريخ)
  // ==========================================================================
  let batchPoolPlans = [];
  let selectedPlanIds = new Set();

  /**
   * Open Batch Print Modal
   */
  window.openBatchPrintPlansModal = function() {
    syncActivePlanFromForm();

    const archive = getArchive();
    const poolMap = new Map();

    // Include archive plans
    archive.forEach(item => {
      if (item && item.id) poolMap.set(item.id, item);
    });

    // Also include activePlan if present
    if (activePlan && activePlan.id) {
      poolMap.set(activePlan.id, activePlan);
    }

    batchPoolPlans = Array.from(poolMap.values());

    // Populate subject filter
    const subjFilter = document.getElementById('batchPrintSubjectFilter');
    if (subjFilter) {
      const subjects = Array.from(new Set(batchPoolPlans.map(p => p.subject).filter(Boolean)));
      subjFilter.innerHTML = '<option value="ALL">كافة المواد الدراسية</option>' + 
        subjects.map(s => `<option value="${s}">${s}</option>`).join('');
    }

    // Default date range: this week, or all if empty
    if (batchPoolPlans.length > 0) {
      window.setBatchDateRange('thisWeek');
    } else {
      window.setBatchDateRange('all');
    }

    const modal = document.getElementById('batchPrintPlansModal');
    if (modal) modal.classList.add('open');
  };

  /**
   * Close Batch Print Modal
   */
  window.closeBatchPrintPlansModal = function() {
    const modal = document.getElementById('batchPrintPlansModal');
    if (modal) modal.classList.remove('open');
  };

  /**
   * Set Date Range Preset: thisWeek, lastWeek, thisMonth, all
   */
  window.setBatchDateRange = function(rangeKey) {
    const startInput = document.getElementById('batchPrintStartDate');
    const endInput = document.getElementById('batchPrintEndDate');
    if (!startInput || !endInput) return;

    if (rangeKey === 'thisWeek') {
      const range = getWeekRange(0);
      startInput.value = range.start;
      endInput.value = range.end;
    } else if (rangeKey === 'lastWeek') {
      const range = getWeekRange(-1);
      startInput.value = range.start;
      endInput.value = range.end;
    } else if (rangeKey === 'thisMonth') {
      const range = getMonthRange();
      startInput.value = range.start;
      endInput.value = range.end;
    } else if (rangeKey === 'all') {
      if (batchPoolPlans.length > 0) {
        const sorted = [...batchPoolPlans].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        startInput.value = sorted[0].date || '';
        endInput.value = sorted[sorted.length - 1].date || '';
      } else {
        startInput.value = '';
        endInput.value = '';
      }
    }

    window.filterBatchPlansList();
  };

  /**
   * Filter and Render Plans list inside the batch modal
   */
  window.filterBatchPlansList = function() {
    const startVal = document.getElementById('batchPrintStartDate')?.value || '';
    const endVal = document.getElementById('batchPrintEndDate')?.value || '';
    const subjVal = document.getElementById('batchPrintSubjectFilter')?.value || 'ALL';
    const container = document.getElementById('batchPlansItemsContainer');
    if (!container) return;

    let filtered = batchPoolPlans.filter(p => {
      const pDate = p.date || '';
      if (startVal && pDate < startVal) return false;
      if (endVal && pDate > endVal) return false;
      if (subjVal !== 'ALL' && p.subject !== subjVal) return false;
      return true;
    });

    // Chronological order: oldest date first -> newest date
    filtered.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    // By default, select all in range
    selectedPlanIds = new Set(filtered.map(p => p.id));
    updateBatchCountUI();

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted); background: var(--bg-surface); border-radius: 8px; border: 1px dashed var(--border-color);">
          <i class="fa-solid fa-calendar-xmark" style="font-size: 2.2rem; color: #94a3b8; margin-bottom: 0.5rem;"></i>
          <div style="font-weight: 800; font-size: 0.95rem; color: var(--text-main);">لا توجد خطط تطابق الفترة الزمنية المحددة</div>
          <small style="color: var(--text-muted);">جرّب توسيع نطاق التاريخ أو الضغط على (كافة الخطط) أعلاه</small>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(item => `
      <div class="lp-batch-item-card is-selected" id="batchCard_${item.id}" onclick="window.toggleBatchPlanSelection('${item.id}')">
        <div class="lp-batch-item-right">
          <input type="checkbox" class="lp-batch-checkbox" id="batchChk_${item.id}" checked onclick="event.stopPropagation(); window.toggleBatchPlanSelection('${item.id}')">
          <div class="lp-batch-date-box">
            <span class="lp-batch-day">${item.day || 'الأحد'}</span>
            <span class="lp-batch-date-val">${item.date || ''}</span>
          </div>
          <div class="lp-batch-info">
            <div class="lp-batch-title">${item.topicTitle || 'بدون عنوان'}</div>
            <div class="lp-batch-meta">
              <span><i class="fa-solid fa-book-open text-primary"></i> ${item.subject || ''}</span>
              <span><i class="fa-solid fa-users text-info"></i> ${item.grade || ''} (${item.section ? 'شعبة ' + item.section : ''})</span>
              <span><i class="fa-solid fa-clock text-warning"></i> ${item.period || ''}</span>
            </div>
          </div>
        </div>
        <button type="button" class="btn btn-sm btn-outline" onclick="event.stopPropagation(); window.printLessonPlanById('${item.id}')" title="معاينة وطباعة هذه الخطة منفردة">
          <i class="fa-solid fa-eye"></i> معاينة
        </button>
      </div>
    `).join('');
  };

  /**
   * Toggle single item selection
   */
  window.toggleBatchPlanSelection = function(id) {
    const chk = document.getElementById('batchChk_' + id);
    const card = document.getElementById('batchCard_' + id);
    if (!chk) return;

    if (selectedPlanIds.has(id)) {
      selectedPlanIds.delete(id);
      chk.checked = false;
      if (card) card.classList.remove('is-selected');
    } else {
      selectedPlanIds.add(id);
      chk.checked = true;
      if (card) card.classList.add('is-selected');
    }
    updateBatchCountUI();
  };

  /**
   * Toggle all checkboxes
   */
  window.toggleAllBatchSelection = function(state) {
    const chks = document.querySelectorAll('.lp-batch-checkbox');
    chks.forEach(chk => {
      const id = chk.id.replace('batchChk_', '');
      const card = document.getElementById('batchCard_' + id);
      chk.checked = state;
      if (state) {
        selectedPlanIds.add(id);
        if (card) card.classList.add('is-selected');
      } else {
        selectedPlanIds.delete(id);
        if (card) card.classList.remove('is-selected');
      }
    });
    updateBatchCountUI();
  };

  /**
   * Update count badge and button label
   */
  function updateBatchCountUI() {
    const badgeEl = document.getElementById('batchCountBadge');
    const btn = document.getElementById('btnExecuteBatchPrint');
    const count = selectedPlanIds.size;
    if (badgeEl) {
      badgeEl.innerHTML = `${count} خطة محددة للطباعة`;
    }
    if (btn) {
      btn.innerHTML = `<i class="fa-solid fa-print"></i> طباعة الحزمة (${count} خطة على ورق A4)`;
      btn.disabled = count === 0;
      btn.style.opacity = count === 0 ? '0.5' : '1';
    }
  }

  /**
   * Execute Batch Print (print all selected plans consecutively)
   */
  window.executeBatchPrintPlans = function() {
    if (selectedPlanIds.size === 0) {
      alert('يرجى تحديد خطة واحدة على الأقل لطباعتها في الحزمة.');
      return;
    }

    const plansToPrint = batchPoolPlans.filter(p => selectedPlanIds.has(p.id));
    plansToPrint.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    const startVal = document.getElementById('batchPrintStartDate')?.value || '';
    const endVal = document.getElementById('batchPrintEndDate')?.value || '';
    const title = `سجل خطط الدروس (${plansToPrint.length} خطة) - من ${startVal} إلى ${endVal}`;

    triggerPrintMultiplePlans(plansToPrint, title);

    if (typeof window.showToast === 'function') {
      window.showToast(`🖨️ تم تجهيز الحزمة لـ (${plansToPrint.length}) خطة، جاري فتح المعاينة والطباعة...`, 'success');
    }
  };

  /**
   * Multi-Plan Print Engine (Each plan on its own A4 page)
   */
  function triggerPrintMultiplePlans(plansArray, title) {
    if (!plansArray || plansArray.length === 0) return;

    const pagesHtml = plansArray.map(p => generateOfficialHtml(p, true)).join('\n');

    const printWin = window.open('', '_blank', 'width=980,height=900,menubar=no,toolbar=no,status=no');
    if (!printWin) {
      alert('يرجى السماح بالنوافذ المنبثقة (Popups) في المتصفح لطباعة حزمة الخطط.');
      return;
    }

    printWin.document.open();
    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Amiri:wght@400;700&display=swap">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
        <style>
          ${getOfficialPrintCss(true)}
        </style>
      </head>
      <body>
        ${pagesHtml}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 400);
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  }

  /**
   * Core Print Window Trigger (Official High-Resolution A4 Document)
   */
  function triggerPrintOfficialPlan(p) {
    const htmlContent = generateOfficialHtml(p, true);

    const printWin = window.open('', '_blank', 'width=950,height=900,menubar=no,toolbar=no,status=no');
    if (!printWin) {
      alert('يرجى السماح بالنوافذ المنبثقة (Popups) لمعاينة وطباعة الخطة اليومية الرسمية.');
      return;
    }

    printWin.document.open();
    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>خطة درس - ${p.subject} - ${p.day} ${p.date}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Amiri:wght@400;700&display=swap">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
        <style>
          ${getOfficialPrintCss(false)}
        </style>
      </head>
      <body>
        ${htmlContent}
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
    printWin.document.close();
  }

  // Hook inputs live changes and textarea auto-resizing
  document.addEventListener('DOMContentLoaded', () => {
    loadActivePlan();

    const container = document.getElementById('tab-lesson-plan');
    if (container) {
      container.addEventListener('input', (e) => {
        syncActivePlanFromForm();
        if (e.target && e.target.tagName === 'TEXTAREA') {
          autoResizeLpTextarea(e.target);
        }
      });
      container.addEventListener('change', () => {
        syncActivePlanFromForm();
      });

      // Initial auto-resizing after populating
      setTimeout(() => {
        container.querySelectorAll('textarea').forEach(ta => {
          autoResizeLpTextarea(ta);
        });
      }, 300);
    }
  });

  // Export module globally for cloud sync & real-time updates
  window.LessonPlanModule = {
    loadActivePlan: loadActivePlan,
    populateForm: populateFormFromActivePlan,
    reload: function() {
      loadActivePlan();
      populateFormFromActivePlan();
    },
    save: persistActivePlan
  };

})();
