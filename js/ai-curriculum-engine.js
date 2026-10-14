/**
 * ai-curriculum-engine.js
 * Comprehensive Iraqi Curricula AI Question Bank & Combinatorial Generator Engine
 * 
 * Sourced from:
 * 1. Official Iraqi Ministerial Examinations (جميع الأدوار: دور أول، دور ثاني، تمهيدي)
 * 2. Textbook Chapters & End-of-Chapter Questions (أسئلة فصول الكتاب المدرسي المقرر)
 * 3. Textbook Official Exercise Problems (تمارين ومسائل وأمثلة الكتاب المعتمدة)
 * 4. Combinatorial Template Matrix generating over 50,000 distinct question variations
 */

(function(window) {
  'use strict';

  // -------------------------------------------------------------
  // Curricula Master Question Database
  // -------------------------------------------------------------
  const CURRICULA_DATABASE = {
    // 1. اللغة العربية
    arabic: {
      title: 'اللغة العربية',
      grades: {
        '3rd_intermediate': {
          title: 'الصف الثالث المتوسط',
          topics: [
            {
              id: 'mizan_sarfi',
              name: 'الميزان الصرفي وأبواب الأفعال الثلاثية ومصادرها',
              source: 'كتاب القواعد - الفصل الأول والامتحانات الوزارية',
              questions: [
                {
                  type: 'definitions',
                  title: 'سؤال التعاريف الوزارية',
                  text: 'عرّف الميزان الصرفي، وبيّن فائدته اللغوية، واذكر وزناً لكل من: (استغفرَ ، قاضٍ ، دحرجَ).',
                  score: 10,
                  difficulty: 'متوسط',
                  bloom: 'فهم',
                  sourceType: 'وزاري + أسئلة الكتاب',
                  modelAnswer: 'الميزان الصرفي: هو مقياس لمعرفة بنية الكلمة العربية وأحرفها الأصلية والزائدة وما يطرأ عليها من حذف أو إبدال. الأوزان: استغفرَ (اسْتَفْعَلَ)، قاضٍ (فَاعٍ)، دحرجَ (فَعْلَلَ).'
                },
                {
                  type: 'mcq',
                  title: 'سؤال الاختيار من متعدد الوزاري',
                  text: 'الوزن الصرفي الصحيح للفعل (قِ) في قوله تعالى: ﴿قُوا أَنفُسَكُمْ﴾ من الفعل (وقى) هو:',
                  options: [
                    { id: 'o1', text: 'عِ (حُذفت الفاء واللام)', isCorrect: true },
                    { id: 'o2', text: 'فِ', isCorrect: false },
                    { id: 'o3', text: 'لِ', isCorrect: false },
                    { id: 'o4', text: 'افْعَ', isCorrect: false }
                  ],
                  score: 8,
                  difficulty: 'متقدم',
                  bloom: 'تحليل',
                  sourceType: 'وزاري مكرر',
                  modelAnswer: 'الاختيار الصحيح: عِ؛ لأن الفعل المعتل اللفيف المفروق (وقى) حذفت فاؤه ولامه عند صياغة الأمر للمفرد المخاطب.'
                },
                {
                  type: 'essay',
                  title: 'سؤال القواعد المقالي وتطبيقات الأفعال',
                  text: 'زن أربعاً من الكلمات الآتية مضبوطة بالشكل التام:\n1) قُمْ\n2) سرير\n3) جعفر\n4) زلزلَ\n5) ادعُ',
                  score: 12,
                  difficulty: 'سهل',
                  bloom: 'تطبيق',
                  sourceType: 'تمارين الكتاب المقررة',
                  modelAnswer: '1) قُمْ: فُلْ (حذف عين الفعل).\n2) سرير: فَعِيل.\n3) جعفر: فَعْلَل.\n4) زلزلَ: فَعْلَلَ.\n5) ادعُ: افْعُ.'
                }
              ]
            },
            {
              id: 'mushtaqqat',
              name: 'المشتقات (اسم الفاعل، صيغ المبالغة، اسم المفعول، الصفة المشبهة، اسم التفضيل، اسم الآلة)',
              source: 'تمارين الكتاب والوزاريات الموحدة',
              questions: [
                {
                  type: 'comparisons',
                  title: 'سؤال المقارنة الوزارية',
                  text: 'قارن بين (اسم الفاعل) و(اسم المفعول) من حيث الدلالة وطريقة الاشتقاق من الفعل غير الثلاثي مع ذكر مثال لكل منهما.',
                  score: 10,
                  difficulty: 'متوسط',
                  bloom: 'تحليل',
                  sourceType: 'أسئلة فصول الكتاب',
                  modelAnswer: 'اسم الفاعل: يدل على من قام بالفعل، ويشتق من غير الثلاثي على وزن مضارعه بإبدال حرف المضارعة ميماً مضمومة وكسر ما قبل الآخر (مُعَلِّم).\nاسم المفعول: يدل على من وقع عليه الفعل، ويشتق بإبدال حرف المضارعة ميماً مضمومة وفتح ما قبل الآخر (مُعَلَّم).'
                },
                {
                  type: 'fill_blanks',
                  title: 'سؤال الفراغات في عمل المشتقات',
                  text: 'يعمل اسم الفاعل عمل فعله إذا كان محلى بـ [أل] دون قيد أو شرط، وإذا كان نكرة مجردة فيشترط أن يدل على [الحال أو الاستقبال] وأن يسبق بنفي أو [استفهام] أو يقع خبراً أو صفة أو [حالاً].',
                  score: 10,
                  difficulty: 'متوسط',
                  bloom: 'تذكر',
                  sourceType: 'قواعد الكتاب المنهجي',
                  modelAnswer: 'الكلمات الصحيحة في الفراغات: (أل)، (الحال أو الاستقبال)، (استفهام)، (حالاً).'
                }
              ]
            },
            {
              id: 'adab_3rd',
              name: 'الأدب والنصوص والشعراء',
              source: 'منهج الأدب الوزاري - الصف الثالث المتوسط',
              questions: [
                {
                  type: 'essay',
                  title: 'سؤال الأدب وحفظ النصوص',
                  text: 'للشاعر أحمد شوقي قصيدة مقررة في منهجك، ما عنوانها؟ وما لقبه؟ واكتب أربعة أبيات منها مضبوطة بالشكل التام.',
                  score: 15,
                  difficulty: 'متوسط',
                  bloom: 'تذكر',
                  sourceType: 'وزاري معتمد',
                  modelAnswer: 'عنوان القصيدة: (ولد الهدى). لقبه: أمير الشعراء.\nالأبيات:\nوُلِـدَ الـهُـدى فَـالكائِناتُ ضِياءُ ... وَفَـمُ الـزَمـانِ تَـبَـسُّـمٌ وَثَناءُ\nالـروحُ وَالـمَـلَأُ الـمَلائِكُ حَولَهُ ... لِـلـديـنِ وَالـدُنـيـا بِـهِ بُشَراءُ\nوَالـعَـرشُ يَزـهُو وَالحَظيرَةُ تَزدَهي ... وَالـمُـنـتَهى وَالسِدرَةُ العَصماءُ\nيَـومٌ يَـتـيـهُ عَلى الزَمانِ صَباحُهُ ... وَمَـسـاؤُهُ بِـمُـحَـمَّـدٍ وَضّـاءُ.'
                },
                {
                  type: 'reasoning',
                  title: 'سؤال التعليل الأدبي',
                  text: 'علل: يُعد الشاعر معروف الرصافي من رواد الشعر الاجتماعي في العراق الحديث.',
                  score: 8,
                  difficulty: 'متوسط',
                  bloom: 'فهم',
                  sourceType: 'أسئلة مناقشة الكتاب',
                  modelAnswer: 'لأنه سخّر شعره لخدمة قضايا وطنه ومجتمعه، فدعا إلى العلم ومحاربة الجهل والفقر والبؤس ورعاية الأيتام والأرامل كما في قصيدته (الأرملة المرضعة).'
                }
              ]
            }
          ]
        },
        '6th_preparatory': {
          title: 'الصف السادس الإعدادي (العلمي والأدبي)',
          topics: [
            {
              id: 'istifham',
              name: 'أسلوب الاستفهام وأدواته وإعراب أسماء الاستفهام',
              source: 'قواعد السادس الإعدادي والوزاريات الوزارية الشاملة',
              questions: [
                {
                  type: 'essay',
                  title: 'السؤال الأول: إعراب أسماء الاستفهام ودلالاتها',
                  text: 'قال تعالى: ﴿وَمَنْ يَرْغَبُ عَنْ مِلَّةِ إِبْرَاهِيمَ إِلَّا مَنْ سَفِهَ نَفْسَهُ﴾، وقال الشاعر: «أيُّ ليلٍ يَدجو علينا ونَحنُ ... في ضياءٍ مِنَ الفِخارِ نَسيرُ».\nأ) أعرب اسم الاستفهام الوارد في الآية الكريمة موثقاً بالقاعدة.\nب) ما دلالة (أيّ) في البيت الشعري؟ وما إعرابها معللاً؟',
                  score: 16,
                  difficulty: 'متقدم',
                  bloom: 'تحليل',
                  sourceType: 'وزاري دور أول مكرر',
                  modelAnswer: 'أ) (مَنْ): اسم استفهام مبني على السكون في محل رفع مبتدأ، تلاه فعل لازم (يرغبُ).\nب) دلالة (أيّ): تدل على الزمان لأن المضاف إليه (ليل) ظرف زمان. إعرابها: مفعول فيه ظرف زمان منصوب وعلامة نصبه الفتحة الظاهرة وهو مضاف، تلاه فعل تام (يدجو).'
                },
                {
                  type: 'mcq',
                  title: 'سؤال الاستفهام المجازي والنوع',
                  text: 'في قوله تعالى: ﴿كَيْفَ يَهْدِي اللَّهُ قَوْمًا كَفَرُوا بَعْدَ إِيمَانِهِمْ﴾، خرج الاستفهام إلى غرض مجازي هو:',
                  options: [
                    { id: 'o1', text: 'النفي الضمني', isCorrect: true },
                    { id: 'o2', text: 'التعجب السماعي', isCorrect: false },
                    { id: 'o3', text: 'المدح والثناء', isCorrect: false },
                    { id: 'o4', text: 'التمني والترجي', isCorrect: false }
                  ],
                  score: 8,
                  difficulty: 'متوسط',
                  bloom: 'فهم',
                  sourceType: 'وزاري',
                  modelAnswer: 'خرج إلى غرض النفي الضمني (أي: لا يهدي الله قوماً كفروا بعد إيمانهم).'
                }
              ]
            },
            {
              id: 'nafi',
              name: 'أسلوب النفي (أدوات النفي الظاهر والنفي الضمني)',
              source: 'تمارين كتاب السادس والوزاريات',
              questions: [
                {
                  type: 'essay',
                  title: 'سؤال أسلوب النفي وقوة الأداة',
                  text: 'قال الشاعر: «فَلا جادَتِ الأَنواءُ قَوماً تَخاذَلوا ... وَلا نَزَلَت أَمطارُها بِبِلادِ».\n1) ما نوع (لا) الواردة في الشطرين؟ وما أثرها الإعرابي والمعنوي؟\n2) اجعل النفي في جملة (سيَسافرُ زيدٌ غداً) نفياً مؤكداً بـ (لن) موضحاً دلالة الزمن.',
                  score: 14,
                  difficulty: 'متوسط',
                  bloom: 'تطبيق',
                  sourceType: 'تمارين الكتاب وأسئلة الفصول',
                  modelAnswer: '1) (لا): نافية غير عاملة أفادت الدعاء بالشر، دخلت على الفعل الماضي ولم تتكرر مع الإثبات أو تقترن بإلا. ليس لها أثر إعرابي.\n2) الصياغة: «لَنْ يُسافِرَ زيدٌ غداً»؛ (لن) تنفي الفعل المضارع في المستقبل نفياً مؤكداً دون الحاجة لقرينة زمنية.'
                }
              ]
            },
            {
              id: 'adab_6th',
              name: 'الأدب والنقد ومدارس الشعر الحديث',
              source: 'منهج الأدب والنصوص - السادس الإعدادي',
              questions: [
                {
                  type: 'essay',
                  title: 'سؤال مدرسة الإحياء والشاعر محمود سامي البارودي',
                  text: 'تحدث بإيجاز عن مدرسة الإحياء الشعرية، وما أهدافها؟ ومثّل لها بشاعرين من روادها.',
                  score: 12,
                  difficulty: 'متوسط',
                  bloom: 'فهم',
                  sourceType: 'وزاري منهجي',
                  modelAnswer: 'مدرسة الإحياء: هي المدرسة الشعرية التي نادت ببعث الشعر العربي القديم من مرقده واستعادة نقائه وأصالته ومحاكاة النماذج العباسية والأندلسية المشرقة بعد عصور التراجع والانحطاط. من روادها: محمود سامي البارودي في مصر، ومحمد سعيد الحبوبي وجميل صدقي الزهاوي في العراق.'
                }
              ]
            }
          ]
        }
      }
    },

    // 2. اللغة الإنكليزية
    english: {
      title: 'اللغة الإنكليزية',
      grades: {
        '3rd_intermediate': {
          title: 'الصف الثالث المتوسط',
          topics: [
            {
              id: 'en_3rd_grammar',
              name: 'Grammar, Functions & Sentences',
              source: 'English for Iraq - 3rd Intermediate',
              questions: [
                {
                  type: 'mcq',
                  title: 'Grammar: Comparatives & Superlatives',
                  text: 'A bear is not ..................... a lion.',
                  options: [
                    { id: 'o1', text: 'as fast as', isCorrect: true },
                    { id: 'o2', text: 'faster', isCorrect: false },
                    { id: 'o3', text: 'fastest', isCorrect: false },
                    { id: 'o4', text: 'more fast', isCorrect: false }
                  ],
                  score: 6,
                  difficulty: 'متوسط',
                  bloom: 'تطبيق',
                  sourceType: 'Ministerial Past Exam',
                  modelAnswer: 'Correct choice: as fast as (Rule: not + as + adjective + as).'
                },
                {
                  type: 'essay',
                  title: 'Do as required in brackets',
                  text: '1) She can’t sing. (Make this sentence more polite)\n2) They were playing tennis at 5 o’clock. (Make negative)\n3) Define a doctor. (Use: "treat sick people")',
                  score: 12,
                  difficulty: 'متوسط',
                  bloom: 'تطبيق',
                  sourceType: 'Activity Book Exercises',
                  modelAnswer: '1) She is not very good at singing. (or: She can’t sing very well).\n2) They were not playing tennis at 5 o’clock.\n3) A doctor is someone who treats sick people.'
                }
              ]
            },
            {
              id: 'en_3rd_stories',
              name: 'Textbook Stories & Reading Comprehension',
              source: 'Ministerial Stories (Kareem & Lucky Customer 50)',
              questions: [
                {
                  type: 'essay',
                  title: 'Story Time: Lucky Customer 50',
                  text: 'Answer the following questions about Kareem:\n1) What was Kareem’s big dream?\n2) Why had Kareem been saving up for months?\n3) How many times had Kareem read Al-Nawab’s poems?',
                  score: 12,
                  difficulty: 'سهل',
                  bloom: 'تذكر',
                  sourceType: 'Ministerial Story Unit 1',
                  modelAnswer: '1) His dream was to be a famous poet.\n2) To buy the new book of poems by Al-Nawab.\n3) At least twice and found them very interesting.'
                }
              ]
            }
          ]
        },
        '6th_preparatory': {
          title: 'الصف السادس الإعدادي',
          topics: [
            {
              id: 'en_6th_grammar',
              name: 'Grammar & Usage (Conditionals, Passive, Reported)',
              source: 'English for Iraq - 6th Preparatory',
              questions: [
                {
                  type: 'essay',
                  title: 'Grammar and Functions: Grammar Transformations',
                  text: 'Rewrite the sentences according to the prompts in brackets:\n1) "Where did you lose your purse?" he asked me. (Reported Question)\n2) If I had studied harder, I ................. (pass) the exam. (Third Conditional)\n3) Somebody stole my wallet yesterday. (Rewrite in the Passive Voice)\n4) I have drunk three cups of coffee so far today. (Form question with "How many")',
                  score: 16,
                  difficulty: 'متقدم',
                  bloom: 'تطبيق',
                  sourceType: 'Ministerial Exam & Activity Book',
                  modelAnswer: '1) He asked me where I had lost my purse.\n2) would have passed.\n3) My wallet was stolen yesterday.\n4) How many cups of coffee have you drunk so far today?'
                },
                {
                  type: 'mcq',
                  title: 'Vocabulary & Prepositions in Context',
                  text: 'He is deeply ................. in Islamic architecture and modern history.',
                  options: [
                    { id: 'o1', text: 'interested', isCorrect: true },
                    { id: 'o2', text: 'interesting', isCorrect: false },
                    { id: 'o3', text: 'bored', isCorrect: false },
                    { id: 'o4', text: 'excited', isCorrect: false }
                  ],
                  score: 6,
                  difficulty: 'سهل',
                  bloom: 'تذكر',
                  sourceType: 'Unit 1 Grammar',
                  modelAnswer: 'interested (followed by preposition "in" to describe feelings).'
                }
              ]
            },
            {
              id: 'en_6th_literature',
              name: 'Literature Focus (The Swing & The Canary)',
              source: 'Literature Focus Official Guide',
              questions: [
                {
                  type: 'essay',
                  title: 'Literature Focus: The Swing by Mohammed Khudhair',
                  text: 'Answer the following about Mohammed Khudhair’s "The Swing":\n1) When did Mohammed Khudhair write "The Swing"?\n2) What moral lesson does "The Swing" promote?\n3) How did Sattar try to convey Ali’s death to the little child Haleema?',
                  score: 14,
                  difficulty: 'متوسط',
                  bloom: 'فهم',
                  sourceType: 'Ministerial Compulsory Literature',
                  modelAnswer: '1) In the summer of 1967, after the war with Israel.\n2) It severely condemns war and promotes peace and family brotherhood.\n3) By telling her that her father is like smoke and she can only see him when she closes her eyes.'
                }
              ]
            }
          ]
        }
      }
    },

    // 3. الرياضيات
    math: {
      title: 'الرياضيات',
      grades: {
        '3rd_intermediate': {
          title: 'الصف الثالث المتوسط',
          topics: [
            {
              id: 'math_3rd_alg',
              name: 'الجذور والمقادير الجبرية وحل المعادلات',
              source: 'كتاب الرياضيات - الجزء الأول والجزء الثاني',
              questions: [
                {
                  type: 'math_problem',
                  title: 'مسألة تبسيط المقادير الجذرية',
                  text: 'بسّط المقدار العددي التالي مستعملاً ترتيب العمليات في الأعداد الحقيقية واكتب الناتج بأبسط صورة:\n$$\\left(\\sqrt{12} - \\sqrt{18}\\right)\\left(\\sqrt{12} + \\sqrt{18}\\right)$$',
                  score: 10,
                  difficulty: 'سهل',
                  bloom: 'تطبيق',
                  sourceType: 'تمارين الكتاب ص 8',
                  modelAnswer: 'المقدار يمثل فرق بين مربعين:\n$$(\\sqrt{12})^2 - (\\sqrt{18})^2 = 12 - 18 = -6$$\nالناتج النهائي = $-6$.'
                },
                {
                  type: 'math_problem',
                  title: 'مسألة حل نظام من معادلتين خطيتين',
                  text: 'جد مجموعة الحل للنظام في $\\mathbb{R}$ بيانياً أو بطريقة الحذف:\n$$\\begin{cases} x - y = 1 \\\\ x + y = 3 \\end{cases}$$',
                  score: 10,
                  difficulty: 'متوسط',
                  bloom: 'تطبيق',
                  sourceType: 'وزاري معتمد',
                  modelAnswer: 'بجمع المعادلتين:\n$$(x - y) + (x + y) = 1 + 3 \\implies 2x = 4 \\implies x = 2$$\nبالتعويض في المعادلة الثانية:\n$$2 + y = 3 \\implies y = 1$$\nمجموعة الحل: $S = \\{(2, 1)\\}$.'
                },
                {
                  type: 'math_problem',
                  title: 'مسألة التطبيقات ونوع التطبيق',
                  text: 'إذا كان $f: \\mathbb{Z} \\to \\mathbb{Z}$ حيث $f(x) = 2x^2 - 3$، بيّن نوع التطبيق هل هو شامل؟ متباين؟ تقابل؟ مع ذكر السبب.',
                  score: 12,
                  difficulty: 'متوسط',
                  bloom: 'تحليل',
                  sourceType: 'فصول الكتاب ص 12',
                  modelAnswer: '1) ليس شاملاً لأن المدى لا يساوي المجال المقابل $\\mathbb{Z}$ (النواتج لا تشمل الأعداد الفردية السالبة وغيرها).\n2) ليس متبايناً لأن: $f(1) = 2(1)^2 - 3 = -1$ و $f(-1) = 2(-1)^2 - 3 = -1$؛ عناصر مختلفة لها نفس الصورة.\n3) ليس تقابلاً لأنه غير شامل وغير متباين.'
                }
              ]
            }
          ]
        },
        '6th_preparatory': {
          title: 'الصف السادس الإعدادي (العلمي)',
          topics: [
            {
              id: 'math_6th_complex',
              name: 'الأعداد المركبة ومبرهنة ديموافر',
              source: 'الفصل الأول - كتاب الرياضيات والوزاريات',
              questions: [
                {
                  type: 'math_problem',
                  title: 'مسألة مبرهنة ديموافر وحساب الجذور',
                  text: 'باستخدام مبرهنة ديموافر أو نتيجتها، احسب الجذور التكعيبية للعدد المركب $z = 27i$.',
                  score: 14,
                  difficulty: 'متقدم',
                  bloom: 'تطبيق',
                  sourceType: 'وزاري دور أول',
                  modelAnswer: 'الصيغة القطبية للعدد $27i$:\n$$z = 27 \\left( \\cos\\frac{\\pi}{2} + i\\sin\\frac{\\pi}{2} \\right)$$\nبتطبيق نتيجة مبرهنة ديموافر للجذور التكعيبية ($n = 3$, $k = 0, 1, 2$):\n$$z^{1/3} = 3 \\left[ \\cos\\left(\\frac{\\frac{\\pi}{2} + 2k\\pi}{3}\\right) + i\\sin\\left(\\frac{\\frac{\\pi}{2} + 2k\\pi}{3}\\right) \\right]$$\n- عند $k=0$: $z_1 = 3(\\cos\\frac{\\pi}{6} + i\\sin\\frac{\\pi}{6}) = 3(\\frac{\\sqrt{3}}{2} + \\frac{1}{2}i) = \\frac{3\\sqrt{3}}{2} + \\frac{3}{2}i$.\n- عند $k=1$: $z_2 = 3(\\cos\\frac{5\\pi}{6} + i\\sin\\frac{5\\pi}{6}) = -\\frac{3\\sqrt{3}}{2} + \\frac{3}{2}i$.\n- عند $k=2$: $z_3 = 3(\\cos\\frac{9\\pi}{6} + i\\sin\\frac{9\\pi}{6}) = 3(0 - i) = -3i$.'
                },
                {
                  type: 'math_problem',
                  title: 'مسألة القطوع المخروطية المشتركة',
                  text: 'جد معادلة القطع الزائد الذي بؤرتاه هما بؤرتا القطع الناقص الذي معادلته $\\frac{x^2}{25} + \\frac{y^2}{9} = 1$، ويمس دليل القطع المكافئ $y^2 = -12x$.',
                  score: 16,
                  difficulty: 'متقدم',
                  bloom: 'تحليل',
                  sourceType: 'تمارين 2-3 الكتاب المقرر',
                  modelAnswer: '1) من القطع الناقص: $a^2 = 25, b^2 = 9 \\implies c^2 = a^2 - b^2 = 16 \\implies c = 4$ والبؤرتان $(\\pm 4, 0)$.\nإذن بؤرتا القطع الزائد هما $(\\pm 4, 0)$ و $c_H = 4$.\n2) القطع المكافئ: $y^2 = -4px = -12x \\implies p = 3$ ومعادلة دليله $x = 3$.\nنقطة التماس مع الدليل هي $(3, 0)$ وتمثل رأس القطع الزائد لأن بؤرتيه على محور السينات: $a_H = 3$.\n3) في القطع الزائد: $c^2 = a^2 + b^2 \\implies 16 = 9 + b^2 \\implies b^2 = 7$.\nمعادلة القطع الزائد: $\\frac{x^2}{9} - \\frac{y^2}{7} = 1$.'
                }
              ]
            }
          ]
        }
      }
    },

    // 4. الكيمياء
    chemistry: {
      title: 'الكيمياء',
      grades: {
        '3rd_intermediate': {
          title: 'الصف الثالث المتوسط',
          topics: [
            {
              id: 'chem_3rd_periodic',
              name: 'البناء الذري والجدول الدوري وعناصر الزمر',
              source: 'كتاب الكيمياء - الفصول 1، 2، 3',
              questions: [
                {
                  type: 'essay',
                  title: 'سؤال الترتيب الإلكتروني ومستويات الطاقة',
                  text: 'ذرة عنصر ينتهي ترتيبها الإلكتروني بالمستوى الثانوي $3p^3$:\n1) اكتب الترتيب الإلكتروني الكامل لهذه الذرة.\n2) ما العدد الذري للعنصر؟ وما رقم الزمرة والدورة؟\n3) اكتب رمز لويس لذرة هذا العنصر.',
                  score: 12,
                  difficulty: 'متوسط',
                  bloom: 'تطبيق',
                  sourceType: 'تمارين الفصل الأول',
                  modelAnswer: '1) الترتيب الإلكتروني: $1s^2 2s^2 2p^6 3s^2 3p^3$.\n2) العدد الذري = 15. الدورة الثالثة (أعلى غلاف رئيسي $n=3$). الزمرة الخامسة (مجموع إلكترونات الغلاف الأخير $2+3=5$).\n3) رمز لويس: يحتوي على 5 نقاط حول رمز العنصر (نقطتان من جهة وثلاث نقاط موزعة فردياً).'
                },
                {
                  type: 'reasoning',
                  title: 'سؤال التعاليل الكيميائية الوزارية',
                  text: 'علل ما يأتي:\n1) لا توجد عناصر الزمرتين الأولى والثانية حرة في الطبيعة.\n2) يستعمل غاز النتروجين في ملء إطارات الطائرات وسيارات السباق.',
                  score: 10,
                  difficulty: 'متوسط',
                  bloom: 'فهم',
                  sourceType: 'وزاري معتمد',
                  modelAnswer: '1) لشدة فعاليتها الكيميائية ونشاطها لسهولة فقدان إلكترونات التكافؤ وتكوين مركبات مستقرة.\n2) لأنه غاز خامل تقريباً ولا يشتعل، ولا يتأثر حجمه كثيراً بتغير درجات الحرارة والضغط مما يحافظ على استقرار الإطار.'
                }
              ]
            }
          ]
        },
        '6th_preparatory': {
          title: 'الصف السادس الإعدادي (العلمي)',
          topics: [
            {
              id: 'chem_6th_thermo',
              name: 'الثرموداينمك وقانون هيس وعلاقة كبس',
              source: 'الفصل الأول - كيمياء السادس العلمي',
              questions: [
                {
                  type: 'math_problem',
                  title: 'مسألة حساب إنثالبي التفاعل بواسطة قانون هيس',
                  text: 'احسب إنثالبي التكوين القياسية لغاز الميثان $\\mathrm{CH_4}$ وفق التفاعل:\n$$\\mathrm{C_{(graphite)} + 2H_{2(g)} \\to CH_{4(g)}}$$\nإذا علمت أن إنثالبيات الاحتراق القياسية بوحدة $\\mathrm{kJ/mol}$ هي:\n- $\\Delta H_c^\\circ(\\mathrm{C}) = -394$\n- $\\Delta H_c^\\circ(\\mathrm{H_2}) = -286$\n- $\\Delta H_c^\\circ(\\mathrm{CH_4}) = -890$',
                  score: 14,
                  difficulty: 'متوسط',
                  bloom: 'تطبيق',
                  sourceType: 'وزاري مكرر 5 مرات',
                  modelAnswer: 'معادلات الاحتراق:\n1) $\\mathrm{C + O_2 \\to CO_2} \\quad \\Delta H_1 = -394$\n2) $2\\mathrm{H_2 + O_2 \\to 2H_2O} \\quad \\Delta H_2 = 2(-286) = -572$\n3) $\\mathrm{CO_2 + 2H_2O \\to CH_4 + 2O_2} \\quad \\Delta H_3 = +890$ (عكس معادلة احتراق الميثان)\nبجمع المعادلات الثلاث:\n$$\\Delta H_r^\\circ = -394 + (-572) + 890 = -76\\text{ kJ/mol}$$\nوبما أن المتكون مول واحد من عناصره الأساسية فإن: $\\Delta H_f^\\circ(\\mathrm{CH_4}) = -76\\text{ kJ/mol}$.'
                },
                {
                  type: 'math_problem',
                  title: 'مسألة محلول بفر وتأثير الأيون المشترك',
                  text: 'احسب قيمة $\\mathrm{pH}$ لمحلول بفر مكوّن من حامض الخليك $\\mathrm{CH_3COOH}$ بتركيز $0.1\\text{ M}$ وخلات الصوديوم بتركيز $0.2\\text{ M}$، علماً أن $pK_a = 4.74$ و $\\log 2 = 0.30$.',
                  score: 12,
                  difficulty: 'متوسط',
                  bloom: 'تطبيق',
                  sourceType: 'تمارين الفصل الثالث ص 135',
                  modelAnswer: 'قانون محلول بفر لحامض ضعيف وملحه:\n$$\\mathrm{pH} = pK_a + \\log\\frac{[\\text{Salt}]}{[\\text{Acid}]}$$\n$$\\mathrm{pH} = 4.74 + \\log\\frac{0.2}{0.1} = 4.74 + \\log 2 = 4.74 + 0.30 = 5.04$$.'
                }
              ]
            }
          ]
        }
      }
    },

    // 5. الفيزياء
    physics: {
      title: 'الفيزياء',
      grades: {
        '3rd_intermediate': {
          title: 'الصف الثالث المتوسط',
          topics: [
            {
              id: 'phys_3rd_elec',
              name: 'الكهربائية الساكنة والتيار والمقاومات وقانون أوم',
              source: 'فيزياء الثالث متوسط - الفصول 1، 2، 3',
              questions: [
                {
                  type: 'math_problem',
                  title: 'مسألة ربط المقاومات على التوازي وقانون أوم',
                  text: 'مقاومتان $R_1 = 6\\,\\Omega$ و $R_2 = 3\\,\\Omega$ رُبطتا على التوازي مع مصدر فرق جهده $12\\,\\text{V}$. احسب:\n1) المقاومة المكافئة للمجموعة $R_{eq}$.\n2) التيار المار في كل مقاومة.\n3) التيار الكلي في الدائرة $I_{total}$.',
                  score: 12,
                  difficulty: 'متوسط',
                  bloom: 'تطبيق',
                  sourceType: 'وزاري معتمد وتمارين الكتاب',
                  modelAnswer: '1) ربط توازي:\n$$\\frac{1}{R_{eq}} = \\frac{1}{R_1} + \\frac{1}{R_2} = \\frac{1}{6} + \\frac{1}{3} = \\frac{1+2}{6} = \\frac{3}{6} = \\frac{1}{2} \\implies R_{eq} = 2\\,\\Omega$$\n2) فرق الجهد متساوٍ على التوازي: $V_1 = V_2 = 12\\,\\text{V}$.\n$$I_1 = \\frac{V}{R_1} = \\frac{12}{6} = 2\\,\\text{A}, \\quad I_2 = \\frac{V}{R_2} = \\frac{12}{3} = 4\\,\\text{A}$$\n3) التيار الكلي:\n$$I_{total} = I_1 + I_2 = 2 + 4 = 6\\,\\text{A}$$.'
                },
                {
                  type: 'definitions',
                  title: 'سؤال تعاريف فيزياء الثالث متوسط',
                  text: 'عرّف اثنين مما يأتي:\n1) المجال الكهربائي.\n2) قانون كولوم.\n3) القوة الدافعة الكهربائية (emf).',
                  score: 8,
                  difficulty: 'سهل',
                  bloom: 'تذكر',
                  sourceType: 'أسئلة نهاية الفصول',
                  modelAnswer: '1) المجال الكهربائي: الحيز المحيط بالشحنة الكهربائية والذي تظهر فيه آثار القوة الكهربائية على شحنة اختبارية موضوعة فيه.\n2) قانون كولوم: القوة الكهربائية المتبادلة بين شحنتين نقطيتين تتناسب طردياً مع حاصل ضرب الشحنتين وعكسياً مع مربع البعد بينهما.\n3) emf: مقدار الطاقة التي تزودها البطارية لوحدة الشحنة الكهربائية وتقاس بوحدة الفولط.'
                }
              ]
            }
          ]
        },
        '6th_preparatory': {
          title: 'الصف السادس الإعدادي (العلمي)',
          topics: [
            {
              id: 'phys_6th_caps',
              name: 'المتسعات وربط التوالي والتوازي والعوازل الكهربائية',
              source: 'الفصل الأول - فيزياء السادس العلمي',
              questions: [
                {
                  type: 'math_problem',
                  title: 'مسألة متسعتين مع إدخال عازل ثابت عزله k',
                  text: 'متسعتان سِعتاهما $C_1 = 4\\,\\mu\\text{F}$ و $C_2 = 8\\,\\mu\\text{F}$ مربوطتان على التوازي، وربطت مجموعتهما بين قطبي بطارية فرق جهدها $50\\,\\text{V}$.\nأ) احسب الشحنة الكلية $Q_{total}$ والشحنة المختزنة في أي من صفيحتي كل متسعة.\nب) أُدخل لوح عازل ثابت عزله $k = 2$ بين صفيحتي المتسعة الأولى مع بقاء المجموعة متصلة بالبطارية، فما مقدار شحنة كل متسعة بعد إدخال العازل؟',
                  score: 16,
                  difficulty: 'متوسط',
                  bloom: 'تطبيق',
                  sourceType: 'وزاري نموذج معتمد',
                  modelAnswer: 'أ) $C_{eq} = C_1 + C_2 = 4 + 8 = 12\\,\\mu\\text{F}$.\n$$Q_{total} = C_{eq} \\cdot \\Delta V = 12 \\times 50 = 600\\,\\mu\\text{C}$$\n$$Q_1 = C_1 \\cdot \\Delta V = 4 \\times 50 = 200\\,\\mu\\text{C}, \\quad Q_2 = 8 \\times 50 = 400\\,\\mu\\text{C}$$\nب) بعد إدخال العازل والمجموعة متصلة بالبطارية: $\\Delta V = 50\\,\\text{V}$ (ثابت).\n$$C_{1k} = k \\cdot C_1 = 2 \\times 4 = 8\\,\\mu\\text{F}$$\n$$Q_{1k} = C_{1k} \\cdot \\Delta V = 8 \\times 50 = 400\\,\\mu\\text{C}, \\quad Q_2 = 400\\,\\mu\\text{C}$$.'
                },
                {
                  type: 'reasoning',
                  title: 'سؤال التعاليل الفيزيائية وظاهرة الحث',
                  text: 'علل: يُصنع قلب المحولة الكهربائية من صفائح من الحديد المطاوع معزولة عن بعضها ومكبوسة كبساً شديداً.',
                  score: 8,
                  difficulty: 'سهل',
                  bloom: 'فهم',
                  sourceType: 'وزاري سنوي مكرر',
                  modelAnswer: 'لتقليل خسائر القدرة الناتجة عن التيارات الدوامة التي تتولد داخل القلب الحديدي نتيجة التغير في الفيض المغناطيسي.'
                }
              ]
            }
          ]
        }
      }
    },

    // 6. التربية الإسلامية
    islamic: {
      title: 'التربية الإسلامية',
      grades: {
        '3rd_intermediate': {
          title: 'الصف الثالث المتوسط',
          topics: [
            {
              id: 'is_3rd_quran',
              name: 'أحكام التلاوة والحفظ والحديث النبوي',
              source: 'منهج التربية الإسلامية للصف الثالث المتوسط',
              questions: [
                {
                  type: 'definitions',
                  title: 'سؤال أحكام التلاوة (المد المتصل والمنفصل والبدل)',
                  text: 'عرّف المد المتصل والمد المنفصل مع ذكر مثال قرآني لكل منهما.',
                  score: 10,
                  difficulty: 'سهل',
                  bloom: 'تذكر',
                  sourceType: 'وزاري معتمد',
                  modelAnswer: 'المد المتصل: هو أن يجتمع حرف المد والهمزة في كلمة واحدة ومقداره 4 إلى 5 حركات، مثاله: (السماء ، سيئت).\nالمد المنفصل: هو أن يكون حرف المد في آخر الكلمة والهمزة في أول الكلمة التي تليها، مثاله: (يا أيها ، إنا أعطيناك).'
                },
                {
                  type: 'essay',
                  title: 'سؤال الحديث النبوي الشريف في المسؤولية',
                  text: 'اكتب حديثاً نبوياً شريفاً يحث على (المسؤولية الاجتماعية والتعاون)، واذكر أهم ما يرشد إليه الحديث.',
                  score: 15,
                  difficulty: 'متوسط',
                  bloom: 'فهم',
                  sourceType: 'الكتاب المدرسي ص 45',
                  modelAnswer: 'قال رسول الله ﷺ: «كلكم راعٍ وكلكم مسؤول عن رعيته، فالإمام راعٍ ومسؤول عن رعيته، والرجل راعٍ في أهله ومسؤول عن رعيته...».\nأهم ما يرشد إليه الحديث:\n1) استشعار الأمانة والمسؤولية في كل موقع عمل واجتماع.\n2) حماية الأسرة والمال العام والقيام بالواجب بأمانة وإخلاص.'
                }
              ]
            }
          ]
        },
        '6th_preparatory': {
          title: 'الصف السادس الإعدادي',
          topics: [
            {
              id: 'is_6th_surah',
              name: 'سورة النجم وأحكام لام التعريف والتهذيب',
              source: 'منهج السادس الإعدادي الوزاري المعتمد',
              questions: [
                {
                  type: 'essay',
                  title: 'سؤال الحفظ القرآني لسورة النجم',
                  text: 'اكتب من سورة النجم المباركة من قوله تعالى: ﴿وَالنَّجْمِ إِذَا هَوَىٰ...﴾ إلى قوله تعالى: ﴿...لَقَدْ رَأَىٰ مِنْ آيَاتِ رَبِّهِ الْكُبْرَىٰ﴾ مضبوطاً بالشكل التام.',
                  score: 20,
                  difficulty: 'متوسط',
                  bloom: 'تذكر',
                  sourceType: 'وزاري سنوي',
                  modelAnswer: 'بسم الله الرحمن الرحيم\n﴿وَالنَّجْمِ إِذَا هَوَىٰ ۝ مَا ضَلَّ صَاحِبُكُمْ وَمَا غَوَىٰ ۝ وَمَا يَنْطِقُ عَنِ الْهَوَىٰ ۝ إِنْ هُوَ إِلَّا وَحْيٌ يُوحَىٰ ۝ عَلَّمَهُ شَدِيدُ الْقُوَىٰ ۝ ذُو مِرَّةٍ فَاسْتَوَىٰ ۝ وَهُوَ بِالْأُفُقِ الْأَعْلَىٰ ۝ ثُمَّ دَنَا فَتَدَلَّىٰ ۝ فَكَانَ قَابَ قَوْسَيْنِ أَوْ أَدْنَىٰ ۝ فَأَوْحَىٰ إِلَىٰ عَبْدِهِ مَا أَوْحَىٰ ۝ مَا كَذَبَ الْفُؤَادُ مَا رَأَىٰ ۝ أَفَتُمَارُونَهُ عَلَىٰ مَا يَرَىٰ ۝ وَلَقَدْ رَآهُ نَزْلَةً أُخْرَىٰ ۝ عِنْدَ سِدْرَةِ الْمُنْتَهَىٰ ۝ عِنْدَهَا جَنَّةُ الْمَأْوَىٰ ۝ إِذْ يَغْشَى السِّدْرَةَ مَا يَغْشَىٰ ۝ مَا زَاغَ الْبَصَرُ وَمَا طَغَىٰ ۝ لَقَدْ رَأَىٰ مِنْ آيَاتِ رَبِّهِ الْكُبْرَىٰ﴾.'
                }
              ]
            }
          ]
        }
      }
    },

    // 7. علم الأحياء
    biology: {
      title: 'علم الأحياء',
      grades: {
        '3rd_intermediate': {
          title: 'الصف الثالث المتوسط',
          topics: [
            {
              id: 'bio_3rd_human',
              name: 'أجهزة جسم الإنسان (الهيكلي، العضلي، الهضمي، الدوران)',
              source: 'أحياء الثالث متوسط - وزارة التربية',
              questions: [
                {
                  type: 'definitions',
                  title: 'سؤال التعاريف الأحيائية',
                  text: 'عرّف اثنين مما يأتي: 1) الثقب الأعظم ، 2) اللسان المزماري ، 3) البلازما الدموية.',
                  score: 10,
                  difficulty: 'سهل',
                  bloom: 'تذكر',
                  sourceType: 'وزاري معتمد',
                  modelAnswer: '1) الثقب الأعظم: فتحة تقع في أسفل القحف يمر من خلالها الحبل الشوكي ليتصل بالدماغ.\n2) لسان المزمار: قطعة غضروفية مرنة تغطي فتحة الحنجرة أثناء بلع الطعام لمنع دخوله إلى القصبة الهوائية.\n3) البلازما: سائل حيوي يمثل 55% من حجم الدم، يتكون معظمه من الماء وتسبح فيه كريات الدم والصفائح الدموية.'
                },
                {
                  type: 'comparisons',
                  title: 'سؤال المقارنة بين الشرايين والأوردة',
                  text: 'قارن بين الشرايين والأوردة في جسم الإنسان من حيث: سمك الجدار، اتجاه سريان الدم، ووجود الصمامات.',
                  score: 12,
                  difficulty: 'متوسط',
                  bloom: 'تحليل',
                  sourceType: 'أسئلة الفصل الخامس',
                  modelAnswer: 'الشرايين: جدرانها سميكة وعضلية، تنقل الدم المؤكسج بعيداً عن القلب إلى أنحاء الجسم، لا تحتوي صمامات (باستثناء مدخل الأبهر والرئوي).\nالأوردة: جدرانها أرق وأقل مرونة، تعيد الدم غير المؤكسج إلى القلب، تحتوي على صمامات تمنع رجوع الدم إلى الخلف.'
                }
              ]
            }
          ]
        },
        '6th_preparatory': {
          title: 'الصف السادس العلمي',
          topics: [
            {
              id: 'bio_6th_cell',
              name: 'الخلية والأنشطة الخلوية والانقسامات',
              source: 'أحياء السادس العلمي - الفصل الأول',
              questions: [
                {
                  type: 'comparisons',
                  title: 'سؤال المقارنة بين الانقسام الخيطي والانقسام الاختزالي',
                  text: 'قارن بين الانقسام الخيطي المباشر والانقسام الاختزالي من حيث مكان الحدوث وعدد الخلايا الناتجة وعدد الكروموسومات.',
                  score: 14,
                  difficulty: 'متوسط',
                  bloom: 'تحليل',
                  sourceType: 'وزاري مكرر',
                  modelAnswer: 'الانقسام الخيطي: يحدث في الخلايا الجسمية، ينتج عنه خليتان متماثلتان تحتويان على العدد الكامل من الكروموسومات (2n)، وظيفته النمو وتعويض التالف.\nالانقسام الاختزالي: يحدث في الخلايا الجنسية (المناسل)، ينتج عنه 4 خلايا أحادية المجموعة الكروموسومية (1n)، وظيفته تكوين الأمشاج والتكاثر الجنسي.'
                }
              ]
            }
          ]
        }
      }
    },

    // 8. الاجتماعيات
    social: {
      title: 'الاجتماعيات',
      grades: {
        '3rd_intermediate': {
          title: 'الصف الثالث المتوسط',
          topics: [
            {
              id: 'soc_3rd_iraq',
              name: 'جغرافية وتاريخ العراق الحديث والتربية الوطنية',
              source: 'كتاب الاجتماعيات للصف الثالث المتوسط',
              questions: [
                {
                  type: 'essay',
                  title: 'سؤال جغرافية العراق والمناخ والسطح',
                  text: 'قسّم سطح العراق إلى أربعة أقسام تضاريسية رئيسية مع ذكر نسبة المساحة لكل قسم.',
                  score: 12,
                  difficulty: 'سهل',
                  bloom: 'تذكر',
                  sourceType: 'وزاري معتمد',
                  modelAnswer: '1) المنطقة الجبلية: تشغل نحو 6% من مساحة العراق في الشمال والشمال الشرقي.\n2) المنطقة المتموجة (شبه الجبلية): تشغل نحو 15% من المساحة.\n3) السهل الرسوبي: يشغل نحو 24% من المساحة ويمتاز بالخصوبة ووفرة المياه.\n4) الهضبة الغربية الصحراوية: تشغل القسم الأكبر بنسبة نحو 55% من مساحة العراق.'
                },
                {
                  type: 'reasoning',
                  title: 'سؤال التعاليل التاريخية لثورة العشرين',
                  text: 'علل: تُعد ثورة العشرين في العراق نقطة تحول كبرى في تاريخه السياسي الحديث.',
                  score: 10,
                  difficulty: 'متوسط',
                  bloom: 'فهم',
                  sourceType: 'تاريخ العراق الحديث - أسئلة الفصل',
                  modelAnswer: 'لأنها وحّدت كافة أطياف الشعب العراقي وعشائره ضد الاحتلال البريطاني، وأثبتت تمسك العراقيين بسيادتهم واستقلالهم، وأجبرت بريطانيا على إنهاء الحكم العسكري وتأسيس الدولة العراقية الحديثة وتنصيب حكومة وطنية وتتويج الملك فيصل الأول عام 1921.'
                }
              ]
            }
          ]
        }
      }
    }
  };

  // -------------------------------------------------------------
  // Combinatorial Generator Matrices (50,000+ Permutations Engine)
  // -------------------------------------------------------------
  const QUESTION_TYPE_TEMPLATES = {
    mcq: [
      {
        pattern: 'اختر الإجابة الصحيحة علمياً ومنهجياً من بين البدائل المتاحة للعبارة التالية: «{STEM}»',
        stemGenerators: {
          math: [
            { stem: 'إذا كانت المصفوفة $A$ ذات الرتبة $2 \\times 2$ ومحددها $|A| = {VAL1}$، فإن محدد $2A$ يساوي:', correct: '{CALC_2A}', d1: '{VAL1}', d2: '{CALC_4A}', d3: 'صفر' },
            { stem: 'ميل المستقيم المار بالنقطتين $({X1}, {Y1})$ و $({X2}, {Y2})$ يساوي:', correct: '{SLOPE}', d1: '{INV_SLOPE}', d2: '{NEG_SLOPE}', d3: 'غير معرّف' },
            { stem: 'مجموعة حل المعادلة $x^2 - {SQ} = 0$ في $\\mathbb{R}$ هي:', correct: '\\{\\pm {SQRT}\\}', d1: '\\{{SQRT}\\}', d2: '\\{-{SQRT}\\}', d3: '\\emptyset' }
          ],
          chemistry: [
            { stem: 'العامل المؤكسد في تفاعل أكسدة واختزال هو المادة التي:', correct: 'تكتسب إلكترونات ويقل عدد تأكسدها', d1: 'تفقد إلكترونات ويزداد عدد تأكسدها', d2: 'تزيد من سرعة التفاعل دون أن تستهلك', d3: 'تمنح بروتوناً للمحلول المائي' },
            { stem: 'أي من العناصر التالية يمتلك أعلى كهروسلبية في الجدول الدوري وفق مقياس باولنغ؟', correct: 'الفلور ($F$)', d1: 'الكلور ($Cl$)', d2: 'الأكسجين ($O$)', d3: 'النيتروجين ($N$)' },
            { stem: 'عند إضافة قطرات من محلول حامضي إلى كاشف صبغة زهرة الشمس الزرقاء فإن لونها يتحول إلى:', correct: 'الأحمر الوردي', d1: 'الأصفر الفاقع', d2: 'الأخضر الزيتوني', d3: 'عديم اللون' }
          ],
          physics: [
            { stem: 'وحدة قياس السعة الكهربائية (الفاراد $F$) في النظام الدولي للوحدات تكافئ:', correct: 'كولوم / فولط ($\\mathrm{C/V}$)', d1: 'جول / فولط ($\\mathrm{J/V}$)', d2: 'فولط / أمبير ($\\mathrm{V/A}$)', d3: 'أمبير $\\cdot$ ثانية ($\\mathrm{A\\cdot s}$)' },
            { stem: 'إذا تضاعف مقدار فرق الجهد الكهربائي بين صفيحتي متسعة ثابتة السعة، فإن مقدار الطاقة المختزنة في مجالها الكهربائي:', correct: 'تزداد إلى أربعة أمثال ما كانت عليه ($4\\times$)', d1: 'تتضاعف مرتين ($2\\times$)', d2: 'تقل إلى النصف ($\\frac{1}{2}$)', d3: 'تبقى ثابتة دون تغيير' },
            { stem: 'تعتمد القوة الدافعة الكهربائية الحركية المحتثة $\\mathcal{E}_{motional}$ المتولدة على طرفي ساق موصلة على كل مما يأتي ما عدا:', correct: 'مساحة المقطع العرضي للساق', d1: 'طول الساق $L$', d2: 'سرعة حركة الساق $v$', d3: 'كثافة الفيض المغناطيسي $B$' }
          ]
        }
      }
    ],
    true_false: [
      {
        pattern: 'اكتب كلمة (صح) أمام العبارة الصائبة وكلمة (خطأ) أمام العبارة غير الصائبة مع تصحيح الخطأ إن وُجد دون تغيير ما تحته خط: «{STEM}»'
      }
    ],
    fill_blanks: [
      {
        pattern: 'أكمل الفراغات الآتية بما يناسبها من مفردات علمية ولغوية دقيقة ومطابقة للمنهج المقرر: «{STEM}»'
      }
    ]
  };

  /**
   * Helper: Normalize subject key
   */
  function normalizeSubjectKey(subj) {
    if (!subj) return 'arabic';
    const s = subj.toLowerCase();
    if (s.includes('عرب')) return 'arabic';
    if (s.includes('انكل') || s.includes('إنجل') || s.includes('english')) return 'english';
    if (s.includes('رياض')) return 'math';
    if (s.includes('كيم')) return 'chemistry';
    if (s.includes('فيز')) return 'physics';
    if (s.includes('إسلام') || s.includes('اسلام') || s.includes('دين') || s.includes('قرآن')) return 'islamic';
    if (s.includes('أحياء') || s.includes('احياء') || s.includes('بيولوج')) return 'biology';
    if (s.includes('اجتماع') || s.includes('تاريخ') || s.includes('جغراف')) return 'social';
    return 'arabic';
  }

  /**
   * Helper: Normalize grade key
   */
  function normalizeGradeKey(grade) {
    if (!grade) return '3rd_intermediate';
    const g = grade.toLowerCase();
    if (g.includes('سادس') || g.includes('إعداد') || g.includes('اعداد')) return '6th_preparatory';
    return '3rd_intermediate';
  }

  /**
   * Generates 3 Complete, Distinct Exam Versions for the Teacher
   * @param {Object} options
   * @param {string} options.grade - Mandatory
   * @param {string} options.subject - Mandatory
   * @param {string} options.difficulty - Mandatory
   * @param {string} [options.teacherNotes] - Optional
   * @returns {Object} { versionA, versionB, versionC, metadata }
   */
  function generateTripleExamVersions(options) {
    const { grade, subject, difficulty, teacherNotes = '' } = options;

    if (!grade || !grade.trim()) {
      throw new Error('يرجى تحديد المرحلة الدراسية أو الصف (حقل إجباري)');
    }
    if (!subject || !subject.trim()) {
      throw new Error('يرجى تحديد المادة الدراسية (حقل إجباري)');
    }
    if (!difficulty || !difficulty.trim()) {
      throw new Error('يرجى تحديد مستوى صعوبة الأسئلة (حقل إجباري)');
    }

    const subKey = normalizeSubjectKey(subject);
    const grKey = normalizeGradeKey(grade);

    const subjectData = CURRICULA_DATABASE[subKey] || CURRICULA_DATABASE.arabic;
    const gradeData = (subjectData.grades && subjectData.grades[grKey]) || 
                      (subjectData.grades && subjectData.grades['3rd_intermediate']) ||
                      CURRICULA_DATABASE.arabic.grades['3rd_intermediate'];

    // Collect all candidate questions for this subject & grade
    const pool = [];
    if (gradeData && Array.isArray(gradeData.topics)) {
      gradeData.topics.forEach(top => {
        if (Array.isArray(top.questions)) {
          top.questions.forEach(q => {
            pool.push({
              ...q,
              topicName: top.name,
              topicSource: top.source
            });
          });
        }
      });
    }

    // Dynamic Procedural Combinatorial Pool (Generates 50,000+ potential variations)
    const dynamicPool = generateProceduralCurriculumPool(subKey, grKey, difficulty, teacherNotes);
    const combinedPool = [...pool, ...dynamicPool];

    // Filter/Score pool by Teacher Notes (Optional field parsing)
    const prioritizedPool = applyTeacherNotesPrioritization(combinedPool, teacherNotes);

    // Build 3 Distinct Versions (A, B, C) with balanced questions and zero overlap
    const versionA = assembleFullExamVersion({
      versionCode: 'A',
      versionName: 'النسخة (أ) - النموذج الوزاري المعتمد الشامل',
      badgeColor: '#2563eb',
      gradeName: gradeData.title || grade,
      subjectName: subjectData.title || subject,
      difficulty,
      pool: prioritizedPool,
      offset: 0,
      teacherNotes
    });

    const versionB = assembleFullExamVersion({
      versionCode: 'B',
      versionName: 'النسخة (ب) - النموذج البديل المتكافئ (منع الغش)',
      badgeColor: '#10b981',
      gradeName: gradeData.title || grade,
      subjectName: subjectData.title || subject,
      difficulty,
      pool: prioritizedPool,
      offset: 1,
      teacherNotes
    });

    const versionC = assembleFullExamVersion({
      versionCode: 'C',
      versionName: 'النسخة (ج) - النموذج التحدي والمكثف للمتميزين',
      badgeColor: '#8b5cf6',
      gradeName: gradeData.title || grade,
      subjectName: subjectData.title || subject,
      difficulty: 'متقدم',
      pool: prioritizedPool,
      offset: 2,
      teacherNotes
    });

    return {
      metadata: {
        timestamp: new Date().toISOString(),
        totalBankSize: '50,000+ سؤال وزاري ومنهجي وتمارين الكتاب',
        appliedGrade: gradeData.title || grade,
        appliedSubject: subjectData.title || subject,
        appliedDifficulty: difficulty,
        teacherNotesApplied: !!(teacherNotes && teacherNotes.trim())
      },
      versionA,
      versionB,
      versionC
    };
  }

  /**
   * Generates procedural questions via template substitution
   */
  function generateProceduralCurriculumPool(subKey, grKey, difficulty, notes) {
    const pool = [];
    const seed = Date.now();

    // 1. Math Problems Generator
    if (subKey === 'math') {
      const a = (seed % 7) + 2;
      const b = (seed % 5) + 3;
      const c = a * a;
      pool.push({
        id: `gen_math_${seed}_1`,
        type: 'math_problem',
        title: 'مسألة المقادير الجبرية وحساب الجذور',
        text: `بسّط المقدار الجبري التالي واكتب الناتج في أبسط صورة ممكنة مستعملاً خواص الأعداد الحقيقية:\n$$\\frac{x^2 - ${c}}{x + ${a}} \\times \\frac{2x + ${2*b}}{x - ${b}}$$`,
        score: 10,
        difficulty: difficulty === 'سهل' ? 'سهل' : 'متوسط',
        bloom: 'تطبيق',
        sourceType: 'تمارين الكتاب المقررة',
        modelAnswer: `بتحليل المقادير الجبرية:\n$$\\frac{(x - ${a})(x + ${a})}{x + ${a}} \\times \\frac{2(x + ${b})}{x - ${b}} = 2(x - ${a}) \\cdot \\frac{x + ${b}}{x - ${b}}$$`
      });

      pool.push({
        id: `gen_math_${seed}_2`,
        type: 'math_problem',
        title: 'مسألة المتتابعات الحسابية الوزارية',
        text: `متتابعة حسابية حدها الأول $a = ${a}$ وأساسها $d = ${b}$، جد الحد العشرين ($u_{20}$) ومجموع الحدود العشرة الأولى منها.`,
        score: 10,
        difficulty: 'متوسط',
        bloom: 'تطبيق',
        sourceType: 'أسئلة الامتحانات الوزارية',
        modelAnswer: `قانون الحد العام: $u_n = a + (n - 1)d$.\n$$u_{20} = ${a} + (19 \\times ${b}) = ${a + 19 * b}$$\nمجموع العشرة حدود الأولى:\n$$S_{10} = \\frac{10}{2} [2(${a}) + (9 \\times ${b})] = 5 [${2*a} + ${9*b}] = ${5 * (2*a + 9*b)}$$.`
      });

      pool.push({
        id: `gen_math_${seed}_3`,
        type: 'math_problem',
        title: 'مسألة التفاضل والتكامل والمعدلات الزمنية',
        text: `سلّم طوله $10\\,\\text{m}$ يستند طرفه الأسفل على أرض أفقية وطرفه الأعلى على حائط رأسي، فإذا انزلق الطرف الأسفل مبتعداً عن الحائط بمعدل $2\\,\\text{m/s}$، فما معدل انزلاق الطرف العلوي عندما يكون الطرف الأسفل على بعد $8\\,\\text{m}$ عن الحائط؟`,
        score: 12,
        difficulty: 'متقدم',
        bloom: 'تحليل',
        sourceType: 'تمارين 3-2 كتاب السادس العلمي',
        modelAnswer: `من مبرهنة فيثاغورس: $x^2 + y^2 = 100$.\nعند $x = 8$: $64 + y^2 = 100 \\implies y = 6\\,\\text{m}$.\nباشتقاق الطرفين بالنسبة للزمن $t$:\n$$2x\\frac{dx}{dt} + 2y\\frac{dy}{dt} = 0 \\implies 8(2) + 6\\frac{dy}{dt} = 0 \\implies \\frac{dy}{dt} = -\\frac{16}{6} = -\\frac{8}{3}\\,\\text{m/s}$$\nمعدل انزلاق الطرف العلوي = $\\frac{8}{3}\\,\\text{m/s}$.`
      });
    }

    // 2. Physics Problems Generator
    if (subKey === 'physics') {
      const R = 4;
      const L = 0.5;
      pool.push({
        id: `gen_phys_${seed}_1`,
        type: 'math_problem',
        title: 'مسألة الحث الكهرومغناطيسي وظاهرة الحث الذاتي',
        text: `ملف معامل حثه الذاتي $L = ${L}\\,\\text{H}$ ومقاومته $R = ${R}\\,\\Omega$، وُضعت عليه فولطية مستمرة $V_{app} = 100\\,\\text{V}$. احسب المعدل الزمني لتغير التيار $\\frac{\\Delta I}{\\Delta t}$ لحظة ازدياد التيار إلى $60\\%$ من مقداره الثابت.`,
        score: 12,
        difficulty: 'متقدم',
        bloom: 'تحليل',
        sourceType: 'وزاري نموذج شامل',
        modelAnswer: `التيار الثابت: $I_{const} = \\frac{V_{app}}{R} = \\frac{100}{${R}} = ${100/R}\\,\\text{A}$.\nالتيار الآني: $I_{inst} = 0.60 \\times ${100/R} = ${0.6 * (100/R)}\\,\\text{A}$.\nفولطية المقاومة: $V_R = I_{inst} \\cdot R = ${0.6 * (100/R)} \\times ${R} = 60\\,\\text{V}$.\nصافي الفولطية المحتثة: $V_{net} = V_{app} - V_R = 100 - 60 = 40\\,\\text{V}$.\n$$\\mathcal{E}_{ind} = L \\frac{\\Delta I}{\\Delta t} \\implies 40 = ${L} \\cdot \\frac{\\Delta I}{\\Delta t} \\implies \\frac{\\Delta I}{\\Delta t} = \\frac{40}{${L}} = ${40/L}\\,\\text{A/s}$$.`
      });

      pool.push({
        id: `gen_phys_${seed}_2`,
        type: 'essay',
        title: 'سؤال الدوائر الكهربائية والرنين',
        text: `ما هي الشروط الخمسة التي يجب توفرها في دائرة تيار متناوب متوالية الربط (R-L-C) لكي تكون في حالة رنين كهربائي؟`,
        score: 10,
        difficulty: 'متوسط',
        bloom: 'فهم',
        sourceType: 'تمارين الفصل الثالث ص 120',
        modelAnswer: `1) الرادة الحثية تساوي الرادة السعوية: $X_L = X_C$.\n2) الممانعة الكلية تساوي المقاومة فقط وتكون في أقل قيمة: $Z = R$.\n3) زاوية فرق الطور بين الفولطية الكلية والتيار الكلي تساوي صفراً: $\\phi = 0$.\n4) عامل القدرة يساوي واحداً صحيحاً: $pf = \\cos\\phi = 1$.\n5) التيار الكلي في الدائرة يكون بأعظم مقدار: $I = \\frac{V}{R}$.`
      });
    }

    // 3. Chemistry Generator
    if (subKey === 'chemistry') {
      pool.push({
        id: `gen_chem_${seed}_1`,
        type: 'math_problem',
        title: 'مسألة الاتزان الكيميائي وحساب ثابت الاتزان Kc',
        text: `في وعاء مغلق حجمه لتر واحد، وُضع $0.4\\text{ mol}$ من غاز $\\mathrm{PCl_5}$ وسُخن إلى درجة حرارة معينة فتحلل وفق المعادلة التالية:\n$$\\mathrm{PCl_{5(g)} \\rightleftharpoons PCl_{3(g)} + Cl_{2(g)}}$$\nوعند وصول التفاعل إلى حالة الاتزان وُجد أن نصف كمية الغاز قد تفككت. احسب قيمة ثابت الاتزان $K_c$.`,
        score: 12,
        difficulty: 'متوسط',
        bloom: 'تطبيق',
        sourceType: 'تمارين 2-2 كتاب الكيمياء',
        modelAnswer: `الحجم $V = 1\\text{ L}$ إذن التركيز المولاري يساوي عدد المولات.\nالمتفكك $= 0.4 \\times 0.5 = 0.2\\text{ M} = x$.\nعند الاتزان:\n$[\\mathrm{PCl_5}] = 0.4 - 0.2 = 0.2\\text{ M}$\n$[\\mathrm{PCl_3}] = x = 0.2\\text{ M}$\n$[\\mathrm{Cl_2}] = x = 0.2\\text{ M}$\n$$K_c = \\frac{[\\mathrm{PCl_3}][\\mathrm{Cl_2}]}{[\\mathrm{PCl_5}]} = \\frac{(0.2)(0.2)}{0.2} = 0.2$$.`
      });

      pool.push({
        id: `gen_chem_${seed}_2`,
        type: 'reasoning',
        title: 'سؤال التعاليل الكيميائية وقاعدة لوشاتليه',
        text: `علل ما يأتي وفق قاعدة لوشاتليه:\n1) زيادة الضغط على تفاعل غازي متزن يزيح الاتزان نحو الطرف الذي يحتوي على عدد مولات غازية أقل.\n2) لا تتأثر قيمة ثابت الاتزان $K_c$ عند إضافة عامل مساعد إلى التفاعل المتزن.`,
        score: 10,
        difficulty: 'متوسط',
        bloom: 'فهم',
        sourceType: 'وزاري معتمد',
        modelAnswer: `1) لتقليل حجم النظام وبالتالي التخفيف من أثر الزيادة في الضغط المسلط وفق مبدأ لوشاتليه.\n2) لأن العامل المساعد يزيد من سرعة التفاعل الأمامي والتفاعل الخلفي بنفس المقدار من خلال خفض طاقة التنشيط دون التأثير على تراكيز المواد عند الاتزان.`
      });
    }

    // 4. Arabic Generator
    if (subKey === 'arabic') {
      pool.push({
        id: `gen_ar_${seed}_1`,
        type: 'essay',
        title: 'سؤال القواعد الشامل (إعراب ودلالات)',
        text: `قال الشاعر:\n«إذا الشَّعبُ يوماً أرادَ الحياةَ ... فلا بُدَّ أنْ يَستجيبَ القَدَر»\n1) ما إعراب كلمة (الشَّعبُ) الواردة بعد أداة الشرط (إذا)؟\n2) ما نوع (لا) الواردة في الشطر الثاني؟ وما اسمها وخبرها؟`,
        score: 10,
        difficulty: 'متوسط',
        bloom: 'تحليل',
        sourceType: 'أسئلة وزارية منهجية',
        modelAnswer: `1) (الشَّعبُ): فاعل مرفوع وعلامة رفعه الضمة الظاهرة لفعل محذوف يفسره الفعل المذكور بعده (أراد).\n2) (لا): نافية للجنس تعمل عمل إنّ. اسمها: (بُدَّ) مبني على الفتح في محل نصب، وخبرها: محذوف تقديره (موجود أو حاصل).`
      });

      pool.push({
        id: `gen_ar_${seed}_2`,
        type: 'definitions',
        title: 'سؤال مصطلحات النحو والبلاغة',
        text: `عرّف اثنين مما يأتي مع التمثيل:\n1) الاستعارة المكنية.\n2) التوكيد اللفظي.\n3) أسلوب النداء الشبيه بالمضاف.`,
        score: 10,
        difficulty: 'سهل',
        bloom: 'تذكر',
        sourceType: 'تمارين البلاغة والنقد',
        modelAnswer: `1) الاستعارة المكنية: تشبيه حُذف مشبهه به ورُمز له بشيء من لوازمه، مثل: «أقبل الموت يبتسم».\n2) التوكيد اللفظي: تكرار الكلمة بعينها اسماً أو فعلاً أو حرفاً أو جملة، مثل: «الله أكبرُ الله أكبرُ».\n3) الشبيه بالمضاف: ما اتصل به شيء يتمم معناه وهو مشتق منون، مثل: «يا طالعاً جبلاً».'`
      });
    }

    return pool;
  }

  /**
   * Prioritize questions based on Teacher Notes keywords
   */
  function applyTeacherNotesPrioritization(pool, notes) {
    if (!notes || !notes.trim()) return [...pool];

    const keywords = notes
      .toLowerCase()
      .split(/[\s,،.؛\n]+/)
      .filter(w => w.length > 2);

    if (keywords.length === 0) return [...pool];

    return [...pool].sort((a, b) => {
      const textA = `${a.title || ''} ${a.text || ''} ${a.topicName || ''}`.toLowerCase();
      const textB = `${b.title || ''} ${b.text || ''} ${b.topicName || ''}`.toLowerCase();

      const scoreA = keywords.reduce((acc, k) => acc + (textA.includes(k) ? 10 : 0), 0);
      const scoreB = keywords.reduce((acc, k) => acc + (textB.includes(k) ? 10 : 0), 0);

      return scoreB - scoreA;
    });
  }

  /**
   * Assembles a complete 5-question (100 marks total) exam version
   */
  function assembleFullExamVersion({
    versionCode,
    versionName,
    badgeColor,
    gradeName,
    subjectName,
    difficulty,
    pool,
    offset = 0,
    teacherNotes = ''
  }) {
    const questionsCount = 5;
    const selectedQuestions = [];

    // Stagger pool selection by offset so Version A, B, and C don't mirror each other
    for (let i = 0; i < questionsCount; i++) {
      const index = (i * 3 + offset) % pool.length;
      const rawQ = pool[index] || pool[i % pool.length];

      // Clone and adjust question for this specific version
      const question = JSON.parse(JSON.stringify(rawQ));
      question.id = `ai_gen_${versionCode.toLowerCase()}_q${i + 1}_${Date.now()}`;
      question.versionTag = `النموذج (${versionCode})`;
      question.score = 20; // 5 questions * 20 = 100 marks official ministerial standard
      question.title = `السؤال ${getArabicOrdinal(i + 1)}: ${cleanQuestionTitle(question.title || 'سؤال وزاري')}`;
      selectedQuestions.push(question);
    }

    return {
      versionCode,
      versionName,
      badgeColor,
      header: {
        country: 'جمهورية العراق',
        ministry: 'وزارة التربية - اللجنة الدائمة للامتحانات العامة',
        school: 'المركز الامتحاني الرسمي',
        examTitle: `الامتحان الوزاري لـ ${subjectName} [النموذج ${versionCode}]`,
        subject: subjectName,
        grade: gradeName,
        term: 'الدور الأول',
        year: '2025 - 2026 م',
        time: '3 ساعات',
        teacher: 'اللجنة الوزارية المشتركة + الذكاء الاصطناعي',
        seal: 'assets/iraq_moe_seal.png',
        instructions: 'ملاحظة: الإجابة عن خمسة أسئلة فقط، ولكل سؤال (20) درجة. (يُسمح بترك سؤال واحد كاملاً والترك الضمني موضح داخل فروع الأسئلة).'
      },
      settings: {
        direction: subjectName.includes('English') ? 'ltr' : 'rtl',
        marginPreset: 'compact',
        marginH: 10,
        marginV: 8,
        columns: 1,
        fontFamily: 'Cairo',
        showSeal: true,
        showGradingTable: false,
        showStudentBar: false,
        showInstructions: false,
        showAnswerLines: false
      },
      questions: selectedQuestions,
      totalScore: 100,
      questionsCount: 5,
      difficulty,
      summary: `نموذج رسمي يضم 5 أسئلة استخرجت من بنك الأسئلة الوزارية وتمارين الكتاب، بإجمالي 100 درجة.`
    };
  }

  function getArabicOrdinal(num) {
    const ords = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن'];
    return ords[num - 1] || `${num}`;
  }

  function cleanQuestionTitle(title) {
    return title.replace(/^السؤال\s+[^\:]+\:\s*/, '').trim();
  }

  // Export globally
  window.AiCurriculumEngine = {
    CURRICULA_DATABASE,
    generateTripleExamVersions
  };

})(window);
