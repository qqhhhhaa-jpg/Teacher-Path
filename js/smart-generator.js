/**
 * smart-generator.js
 * Smart generator engine, 5 Iraqi official ministerial curriculum presets,
 * archive model repository, general subject banks, and Bloom analyzer.
 */

const OFFICIAL_MINISTERIAL_ARCHIVE_MODELS = [
  {
    "id": "preset_model_islamic",
    "title": "🇮🇶 الامتحان الوزاري لمادة التربية الإسلامية والقرآن الكريم (نموذج متكامل)",
    "subject": "التربية الإسلامية",
    "grade": "الصف الثالث المتوسط",
    "createdAt": "2026-10-12",
    "updatedAt": "2026-10-12",
    "questionsCount": 5,
    "totalScore": 100,
    "isModelPreset": true,
    "data": {
      "header": {
        "country": "جمهورية العراق",
        "ministry": "وزارة التربية - اللجنة الدائمة للامتحانات العامة",
        "school": "الامتحانات العامة للدراسة المتوسطة",
        "examTitle": "الامتحان الوزاري النهائي لمادة التربية الإسلامية",
        "subject": "التربية الإسلامية والقرآن الكريم",
        "grade": "الصف الثالث المتوسط",
        "term": "الدور الأول",
        "year": "2025 - 2026 م",
        "time": "ساعتان ونصف",
        "seal": "assets/iraq_moe_seal.png",
        "teacher": "اللجنة الوزارية المشتركة",
        "instructions": "ملاحظة: الإجابة عن خمسة أسئلة فقط ولكل سؤال (20) درجة. الترك الضمني موضح داخل فروع الأسئلة."
      },
      "settings": {
        "direction": "rtl",
        "marginPreset": "compact",
        "marginH": 10,
        "marginV": 8,
        "fontFamily": "Cairo"
      },
      "questions": [
        {
          "id": "q_is_1",
          "type": "essay",
          "title": "السؤال الأول: أحكام التلاوة والقرآن الكريم",
          "text": "أحكام المد في القرآن الكريم (المد المتصل، المد المنفصل، مد البدل)",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تطبيق",
          "subject": "islamic",
          "linesCount": 4,
          "branches": [
            {
              "title": "الفرع (أ)",
              "text": "عرّف اثنين مما يأتي مع ذكر مثال لكل منها: 1) المد المتصل ، 2) المد المنفصل ، 3) مد البدل.",
              "score": 10,
              "modelAnswer": "1) المد المتصل: هو أن يجتمع حرف المد مع الهمزة في كلمة واحدة ومقداره أربع أو خمس حركات (مثال: السَّمَاء ، جَاءَ).\n2) المد المنفصل: هو أن يأتي حرف المد في نهاية كلمة وتأتي الهمزة في أول الكلمة التي تليها (مثال: يَا أَيُّهَا ، بِمَا أُنْزِلَ).\n3) مد البدل: هو أن تتقدم الهمزة على حرف المد في كلمة واحدة (مثال: آمَنُوا ، أُوتُوا ، إِيمَان)."
            },
            {
              "title": "الفرع (ب)",
              "text": "استخرج أحكام المد من الآية الكريمة التالية مبيناً نوع المد والسبب: ﴿يَا أَيُّهَا الَّذِينَ آمَنُوا لَا يَسْخَرْ قَوْمٌ مِنْ قَوْمٍ عَسَىٰ أَنْ يَكُونُوا خَيْرًا مِنْهُمْ وَلَا نِسَاءٌ مِنْ نِسَاءٍ عَسَىٰ أَنْ يَكُنَّ خَيْرًا مِنْهُنَّ﴾.",
              "score": 10,
              "modelAnswer": "1) (يَا أَيُّهَا): مد منفصل لأن حرف المد (الألف) انفصل عن الهمزة في كلمتين.\n2) (آمَنُوا): مد بدل لتقدم الهمزة على حرف المد (الألف) في كلمة واحدة.\n3) (عَسَىٰ أَنْ): مد منفصل لأن الألف في نهاية (عسى) والهمزة في أول (أن).\n4) (نِسَاءٌ): مد متصل لاجتماع حرف المد والهمزة في كلمة واحدة."
            }
          ],
          "modelAnswer": "ملاحظة للمصحح: يكتفى بذكر قاعدتين ومثالين في الفرع (أ)، وفي الفرع (ب) استخراج أربعة أحكام صحيحة مع التعليل."
        },
        {
          "id": "q_is_2",
          "type": "essay",
          "title": "السؤال الثاني: الحفظ القرآني الكريم ومعاني الكلمات",
          "text": "سورة الحجرات المباركة ومعاني المفردات القرآنية المقررة",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تذكر",
          "subject": "islamic",
          "linesCount": 5,
          "branches": [
            {
              "title": "الفرع (أ)",
              "text": "اكتب من سورة الحجرات من قوله تعالى: ﴿يَا أَيُّهَا الَّذِينَ آمَنُوا إِنْ جَاءَكُمْ فَاسِقٌ بِنَبَإٍ فَتَبَيَّنُوا...﴾ إلى قوله تعالى: ﴿...فَضْلًا مِنَ اللَّهِ وَنِعْمَةً وَاللَّهُ عَلِيمٌ حَكِيمٌ﴾ مضبوطاً بالشكل التام.",
              "score": 12,
              "modelAnswer": "بسم الله الرحمن الرحيم\n﴿يَا أَيُّهَا الَّذِينَ آمَنُوا إِنْ جَاءَكُمْ فَاسِقٌ بِنَبَإٍ فَتَبَيَّنُوا أَنْ تُصِيبُوا قَوْمًا بِجَهَالَةٍ فَتُصْبِحُوا عَلَىٰ مَا فَعَلْتُمْ نَادِمِينَ ۝ وَاعْلَمُوا أَنَّ فِيكُمْ رَسُولَ اللَّهِ لَوْ يُطِيعُكُمْ فِي كَثِيرٍ مِنَ الْأَمْرِ لَعَنِتُّمْ وَلَٰكِنَّ اللَّهَ حَبَّبَ إِلَيْكُمُ الْإِيمَانَ وَزَيَّنَهُ فِي قُلُوبِكُمْ وَكَرَّهَ إِلَيْكُمُ الْكُفْرَ وَالْفُسُوقَ وَالْعِصْيَانَ أُولَٰئِكَ هُمُ الرَّاشِدُونَ ۝ فَضْلًا مِنَ اللَّهِ وَنِعْمَةً وَاللَّهُ عَلِيمٌ حَكِيمٌ﴾."
            },
            {
              "title": "الفرع (ب)",
              "text": "بيّن معاني أربع من الكلمات القرآنية الآتية: [ فَتَبَيَّنُوا ، لَعَنِتُّمْ ، لَا تَلْمِزُوا ، تَنَابَزُوا ، وَلَا تَجَسَّسُوا ].",
              "score": 8,
              "modelAnswer": "1) فَتَبَيَّنُوا: فتثبتوا وتأكدوا من صحة الخبر قبل الحكم.\n2) لَعَنِتُّمْ: لوقعتم في المشقة الشديدة والجهد والهلاك.\n3) لَا تَلْمِزُوا: لا يعب بعضكم بعضاً بالقول أو الإشارة والغمز.\n4) تَنَابَزُوا: لا يدعُ بعضكم بعضاً بلقب يكرهه ويسيء إليه.\n5) لَا تَجَسَّسُوا: لا تتبعوا عورات الناس وما خفي من أسرارهم."
            }
          ],
          "modelAnswer": "يخصم نصف درجة عن كل خطأ إملائي أو حركة إعرابية في الآيات الكريمة."
        },
        {
          "id": "q_is_3",
          "type": "essay",
          "title": "السؤال الثالث: الحديث النبوي الشريف والشرح",
          "text": "الأحاديث النبوية الشريفة المقررة في المنهج الوزاري",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "فهم",
          "subject": "islamic",
          "linesCount": 4,
          "branches": [
            {
              "title": "الفرع (أ)",
              "text": "اكتب حديثاً نبوياً شريفاً يحث على (بر الوالدين) أو (في الشهيد) مضبوطاً بالحركات التامة مع ذكر راوي الحديث.",
              "score": 12,
              "modelAnswer": "حديث في بر الوالدين:\nعن أبي هريرة (رضي الله عنه) قال: جاء رجلٌ إلى رسولِ اللهِ (صلى الله عليه وآله وسلم) فقال: «يا رسولَ اللهِ، مَنْ أحقُّ الناسِ بحُسْنِ صَحَابَتِي؟ قال: أُمُّكَ، قال: ثم مَنْ؟ قال: أُمُّكَ، قال: ثم مَنْ؟ قال: أُمُّكَ، قال: ثم مَنْ؟ قال: أَبُوكَ».\nأو حديث الشهيد:\nقال رسول الله (ص): «ما مِن مكلومٍ يُكْلَمُ في سبيلِ اللهِ إلا جاءَ يومَ القيامةِ وكَلْمُهُ يَدمَى: اللَّوْنُ لَوْنُ دَمٍ، والرِّيحُ رِيحُ مِسْكٍ»."
            },
            {
              "title": "الفرع (ب)",
              "text": "اذكر أربعاً من أهم النقاط التي يرشد إليها الحديث الشريف في تنظيم العلاقات الأسرية وبناء المجتمع الفاضل.",
              "score": 8,
              "modelAnswer": "1) وجوب بر الوالدين وطاعتهما في غير معصية الله تعالى.\n2) عظيم فضل الأم وتقديمها في الرعاية لشدة ما تكابده في الحمل والوضع والتربية.\n3) مكانة الأب في التوجيه والإنفاق والحماية.\n4) إشاعة التراحم والتكافل والمحبة داخل الأسرة ونبذ العقوق والجفاء."
            }
          ],
          "modelAnswer": "توزع الدرجات: (12) درجة على نص الحديث وصحته، و(8) درجات على ما يرشد إليه الحديث."
        },
        {
          "id": "q_is_4",
          "type": "reasoning",
          "title": "السؤال الرابع: العقيدة الإسلامية والتهذيب والأخلاق",
          "text": "مفاهيم العقيدة والأخلاق الإسلامية والتعاليل المنهجية",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تحليل",
          "subject": "islamic",
          "linesCount": 4,
          "branches": [
            {
              "title": "الفرع (أ)",
              "text": "وضح مفهوم (الغني الشاكر والفقير الصابر)؟ وكيف ينال كل منهما رضوان الله تعالى ومغفرته في الدارين؟",
              "score": 10,
              "modelAnswer": "الغني الشاكر: هو الذي يعترف بنعمة الله وفضله عليه، ويؤدي حقها بإخراج الزكاة المفروضة والصدقات، ومساعدة المحتاجين وإعمار الأرض.\nالفقير الصابر: هو الذي يرضى بقضاء الله وقدره، ويعفّ نفسه عن الحرام وسؤال الناس بإلحاح، ولا يحسد أحداً على ما آتاه الله.\nوكلاهما في مقام الإيمان العالي إذا أخلصا النية، فالشكر عبادة والصبر عبادة."
            },
            {
              "title": "الفرع (ب)",
              "text": "علل اثنين مما يأتي: 1) فريضة الحجاب للمرأة المسلمة تصون كرامتها وعفتها. 2) تحريم الإسلام للغيبة والنميمة وآثارهما على المجتمع. 3) حاجة البشرية الدائمة إلى بعثة الرسل والأنبياء (عليهم السلام).",
              "score": 10,
              "modelAnswer": "1) لأن الحجاب طاعة لله تعالى وحصن للمرأة يحميها من النظرات المريبة ويبرز شخصيتها وفكرها بدلاً من جسدها.\n2) لأن الغيبة والنميمة تسببان البغضاء والفرقة وتدمران روابط الأخوة وتنتهكان حرمة الإنسان الغائب كمن يأكل لحم أخيه ميتاً.\n3) لأن العقل البشري وحده قاصر عن إدراك تفاصيل الشريعة والعدل المطلق، فالرسل يقيمون الحجة ويهدون الناس إلى الصراط المستقيم."
            }
          ],
          "modelAnswer": "الإجابة الدقيقة والمستندة إلى مفاهيم الكتاب المدرسي تنال الدرجة الكاملة."
        },
        {
          "id": "q_is_5",
          "type": "essay",
          "title": "السؤال الخامس: السيرة النبوية العطرة والشخصيات الإسلامية",
          "text": "محطات السيرة النبوية وأعلام الصحابة الأجلاء",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "فهم",
          "subject": "islamic",
          "linesCount": 4,
          "branches": [
            {
              "title": "الفرع (أ)",
              "text": "ما هي أسباب ودوافع صلح الحديبية في العام السادس للهجرة؟ وما أهم بنوده؟ ولماذا اعتبره القرآن الكريم (فتحاً مبيناً)؟",
              "score": 10,
              "modelAnswer": "أسبابه: خروج النبي (ص) وأصحابه معتمرين غير محاربين، فصدتهم قريش ومنعتهم من دخول مكة، فجرى التفاوض حقناً للدماء.\nأهم بنوده: هدنة ووقف الحرب 10 سنوات، تأجيل العمرة للعام القادم، رد من يأتي من قريش مسلماً دون إذن وليه، حرية القبائل في التحالف مع أي طرف.\nاعتبر فتحاً مبيناً لأنه أتاح نشر الإسلام بأمان ودخول أعداد غفيرة من الناس في الدين الحنيف ومهد لفتح مكة."
            },
            {
              "title": "الفرع (ب)",
              "text": "اكتب نبذة موجزة عن شخصية الصحابي الجليل (سلمان المحمدي - رضوان الله عليه) مبيناً دوره البارز وخبرته في غزوة الخندق (الأحزاب).",
              "score": 10,
              "modelAnswer": "سلمان المحمدي (الفارسي): باحث عن الحقيقة وهاجر في طلب الدين الحق حتى التقى بالنبي (ص) في المدينة وأسلم وأعتقه المسلمون.\nدوره في الخندق: أشار على رسول الله (ص) بحفر خندق واسع وعميق حول المدينة المنورة وهي حيلة عسكرية لم تكن تعرفها العرب، مما حَمى المسلمين وأفشل حصار الأحزاب، وقال فيه النبي (ص): «سلمانُ منَّا أهلَ البيت»."
            }
          ],
          "modelAnswer": "تمنح الدرجة الكاملة عند الإحاطة بالأسباب والبنود وشخصية الصحابي الجليل."
        }
      ]
    }
  },
  {
    "id": "preset_model_english",
    "title": "🇬🇧 Ministerial Official Exam - English Language (3rd Intermediate)",
    "subject": "English Language",
    "grade": "3rd Intermediate",
    "createdAt": "2026-10-12",
    "updatedAt": "2026-10-12",
    "questionsCount": 5,
    "totalScore": 100,
    "isModelPreset": true,
    "data": {
      "header": {
        "country": "Republic of Iraq",
        "ministry": "Ministry of Education - General Examination Board",
        "school": "General Examinations for Intermediate Schools",
        "examTitle": "Ministerial Final Exam - English Language",
        "subject": "English Language",
        "grade": "3rd Intermediate",
        "term": "1st Round",
        "year": "2025 - 2026",
        "time": "3 Hours",
        "seal": "assets/iraq_moe_seal.png",
        "teacher": "Ministerial Examination Committee",
        "instructions": "Note: Answer all questions. Total: 100 Marks. (Q1=25, Q2=20, Q3=20, Q4=15, Q5=20)."
      },
      "settings": {
        "direction": "ltr",
        "marginPreset": "compact",
        "marginH": 10,
        "marginV": 8,
        "fontFamily": "Cairo"
      },
      "questions": [
        {
          "id": "q_en_1",
          "type": "essay",
          "title": "Question 1: Reading Comprehension & Textbook Passages",
          "text": "Reading Comprehension (Unseen Passage) and Textbook Prescribed Texts",
          "score": 25,
          "difficulty": "متوسط",
          "bloom": "فهم",
          "subject": "english",
          "linesCount": 4,
          "branches": [
            {
              "title": "Branch (A): Unseen Comprehension (15 Marks)",
              "text": "Read the following passage carefully:\n\"Ahmed was an energetic Iraqi student from Baghdad who loved electronics and computer maintenance. After passing his intermediate examinations, he set up a small community workshop to help younger school students and elderly people repair their tablets and laptops completely free of charge. In the beginning, he encountered major obstacles because professional tools were expensive and authentic spare parts were rare. However, neighbors and school teachers admired his sincere dedication and integrity. Soon, several engineering volunteers joined his workshop, and the Baghdad Provincial Council granted him an official medal of honor for community leadership.\"\n\nNow answer (5) of the following questions:\n1. Where was Ahmed from?\n2. What hobby and skills did Ahmed enjoy?\n3. Why did Ahmed face difficulties at the beginning?\n4. Who received free device repairs in Ahmed's workshop?\n5. The Baghdad Provincial Council awarded Ahmed an official medal. (True / False)\n6. Choose the best title for this passage: (a) An Unlucky Experiment  (b) An Inspiring Young Leader  (c) Buying a New Laptop",
              "score": 15,
              "modelAnswer": "1. Ahmed was from Baghdad, Iraq.\n2. He loved electronics and computer maintenance.\n3. Because professional tools were expensive and authentic spare parts were rare.\n4. Younger school students and elderly people.\n5. True.\n6. (b) An Inspiring Young Leader."
            },
            {
              "title": "Branch (B): Textbook Passages (10 Marks)",
              "text": "Answer or complete (5) of the following using information from your textbook:\n1. The Panther 3.0D has comfortable seats for ............... people. (6 / 8 / 10)\n2. Falconry is a traditional sport that Bedouins used to practice in the deserts of ...............\n3. Marsh Arabs live in arched houses built from ............... (reeds / bricks / cement)\n4. What essential safety features are installed in the Panther 3.0D?\n5. The fastest living creature in the entire natural world is the ...............\n6. The Panther 3.0D actually looks very expensive, but it is quite ............... (cheap / dangerous)",
              "score": 10,
              "modelAnswer": "1. 8 (eight) people.\n2. Iraq, the Gulf, and North Africa (or the deserts).\n3. Reeds.\n4. Airbags for the driver and passengers, along with other safety features.\n5. The falcon.\n6. Cheap."
            }
          ],
          "modelAnswer": "Give 3 marks for each correct answer in Branch A (5 items = 15), and 2 marks for each item in Branch B (5 items = 10)."
        },
        {
          "id": "q_en_2",
          "type": "essay",
          "title": "Question 2: Grammar and Language Functions",
          "text": "Grammar structures, verbs, conditionals, and language functions",
          "score": 20,
          "difficulty": "متقدم",
          "bloom": "تطبيق",
          "subject": "english",
          "linesCount": 4,
          "branches": [
            {
              "title": "Branch (A): Do as required between brackets (Choose 5 only) (10 Marks)",
              "text": "1. While Ali was walking to school, it (start) to rain heavily. (Correct the verb)\n2. A bear is bigger than a wolf. (Rewrite using: \"as ... as\")\n3. She used to (wear) glasses, but now she wears contacts. (Correct the verb)\n4. That is the talented engineer ............... designed the new Baghdad bridge. (Use: who / which / whose)\n5. If you heat water to 100°C, it (boil). (Zero conditional: Correct)\n6. \"I visit the national museum every month.\" (Change into past simple tense)",
              "score": 10,
              "modelAnswer": "1. started.\n2. A wolf is not as big as a bear.\n3. wear.\n4. who.\n5. boils.\n6. I visited the national museum every month."
            },
            {
              "title": "Branch (B): Choose the correct alternative (Choose 5 only) (10 Marks)",
              "text": "1. There is (an / a / some) information desk near the main airport entrance.\n2. How about (go / going / went) to Al-Zawraa park this Friday?\n3. Modern cars are fitted with GPS (so that / because / to) drivers don't get lost.\n4. Salwa is keen and interested (at / in / on) learning Arabic history.\n5. Zaid plays football very (good / well / bad).\n6. Huda is not as (tall / taller / tallest) as her sister Noor.",
              "score": 10,
              "modelAnswer": "1. an.\n2. going.\n3. so that.\n4. in.\n5. well.\n6. tall."
            }
          ],
          "modelAnswer": "Each correct sentence in Branch A receives 2 marks. Each correct choice in Branch B receives 2 marks."
        },
        {
          "id": "q_en_3",
          "type": "essay",
          "title": "Question 3: Vocabulary, Spelling and Punctuation",
          "text": "Definitions, vocabulary matching, spelling variations, and punctuation",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تطبيق",
          "subject": "english",
          "linesCount": 4,
          "branches": [
            {
              "title": "Branch (A): Match definitions with suitable words (5 Marks)",
              "text": "Words: [ engine , predator , airbag , clue , toothbrush ]\n1. It makes motor cars, airplanes, and speedboats move: ...............\n2. An animal that hunts, catches, and eats other animals: ...............\n3. A safety cushion that inflates in a collision to protect passengers: ...............\n4. A piece of factual evidence that helps detectives solve a mystery: ...............\n5. A brush used with paste to clean teeth after meals: ...............",
              "score": 5,
              "modelAnswer": "1. engine.\n2. predator.\n3. airbag.\n4. clue.\n5. toothbrush."
            },
            {
              "title": "Branch (B): Spelling (Complete with correct forms) (10 Marks)",
              "text": "1. small, smaller ; fast, ...............\n2. Iraq, Iraqi ; Japan, ...............\n3. do, did ; write, ...............\n4. polite, impolite ; happy, ...............\n5. clean, dirty ; expensive, ...............",
              "score": 10,
              "modelAnswer": "1. faster.\n2. Japanese.\n3. wrote.\n4. unhappy.\n5. cheap (or inexpensive)."
            },
            {
              "title": "Branch (C): Punctuation (5 Marks)",
              "text": "Re-write the following sentence using correct capital letters and punctuation marks:\n\"did noor visit erbil and basra last march yes she did\"",
              "score": 5,
              "modelAnswer": "\"Did Noor visit Erbil and Basra last March? Yes, she did.\""
            }
          ],
          "modelAnswer": "Branch A: 1 mark each (5 marks). Branch B: 2 marks each (10 marks). Branch C: 1 mark for each punctuation element (5 marks)."
        },
        {
          "id": "q_en_4",
          "type": "essay",
          "title": "Question 4: Story Time & Prescribed Literature",
          "text": "Prescribed Stories: Lucky Customer 50 and The Deer Story",
          "score": 15,
          "difficulty": "متوسط",
          "bloom": "تذكر",
          "subject": "english",
          "linesCount": 4,
          "branches": [
            {
              "title": "Branch (A): Answer or complete (5) of the following (15 Marks)",
              "text": "1. What was Kareem's big dream in the story \"Lucky Customer 50\"?\n2. Kareem had worked hard and saved his money for months to buy ...............\n3. The pregnant deer in the story stayed focused on giving birth to her fawn. (True / False)\n4. What dangerous natural and human threats surrounded the deer in the forest?\n5. Who was the celebrated Iraqi poet whose new poetry collection Kareem waited in line for?\n6. What was the special reward for being customer number 50?",
              "score": 15,
              "modelAnswer": "1. Kareem's dream was to become a famous poet.\n2. Al-Nawab's new collection of poems (\"Islands of Salt\").\n3. True.\n4. A forest wildfire, a rushing river, a hunter with an arrow, and a hungry stalking lion.\n5. Muzaffar Al-Nawab.\n6. To meet the poet Al-Nawab in person and receive a signed copy."
            }
          ],
          "modelAnswer": "Each correct answer receives 3 marks (5 x 3 = 15 marks)."
        },
        {
          "id": "q_en_5",
          "type": "essay",
          "title": "Question 5: Written Composition",
          "text": "Choose either (A) or (B) and write a coherent, well-organized paragraph (70-90 words):\n(A) Write an email to your cousin describing your best friend (his/her appearance, personal qualities, hobbies, and why you enjoy spending time together).\n(B) Write a concise review of an interesting TV programme or documentary you watched recently (the subject, main facts learned, and why people should watch it).",
          "score": 20,
          "difficulty": "متقدم",
          "bloom": "ابتكار",
          "subject": "english",
          "linesCount": 5,
          "modelAnswer": "Official Marking Rubric:\n- Relevance of ideas, task achievement and cohesion: 8 Marks\n- Grammar structures, range of vocabulary and variety: 6 Marks\n- Spelling, capitalisation, and punctuation accuracy: 4 Marks\n- Cleanliness of handwriting, layout and indentation: 2 Marks\nTotal = 20 Marks."
        }
      ]
    }
  },
  {
    "id": "preset_model_math",
    "title": "🇮🇶 الامتحان الوزاري لمادة الرياضيات (نموذج متكامل)",
    "subject": "الرياضيات",
    "grade": "الصف الثالث المتوسط",
    "createdAt": "2026-10-12",
    "updatedAt": "2026-10-12",
    "questionsCount": 5,
    "totalScore": 100,
    "isModelPreset": true,
    "data": {
      "header": {
        "country": "جمهورية العراق",
        "ministry": "وزارة التربية - اللجنة الدائمة للامتحانات العامة",
        "school": "الامتحانات العامة للدراسة المتوسطة",
        "examTitle": "الامتحان الوزاري النهائي لمادة الرياضيات",
        "subject": "الرياضيات",
        "grade": "الصف الثالث المتوسط",
        "term": "الدور الأول",
        "year": "2025 - 2026 م",
        "time": "ثلاث ساعات",
        "seal": "assets/iraq_moe_seal.png",
        "teacher": "لجنة واضعي الأسئلة الوزارية",
        "instructions": "ملاحظة: الإجابة عن خمسة أسئلة فقط ولكل سؤال (20) درجة. (يُمنع استخدام الحاسبة اليدوية منعاً باتاً)."
      },
      "settings": {
        "direction": "rtl",
        "marginPreset": "compact",
        "marginH": 10,
        "marginV": 8,
        "fontFamily": "Cairo"
      },
      "questions": [
        {
          "id": "q_ma_1",
          "type": "math_problem",
          "title": "السؤال الأول: ترتيب العمليات ومتباينات القيمة المطلقة",
          "text": "العمليات على الأعداد الحقيقية ومتباينات القيمة المطلقة والتمثيل البياني",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تطبيق",
          "subject": "math",
          "linesCount": 4,
          "branches": [
            {
              "title": "الفرع (أ)",
              "text": "بسّط المقدار العددي التالي باستعمال ترتيب العمليات على الأعداد الحقيقية واكتب الناتج بأبسط صورة: (√12 - √18) (√12 + √18).",
              "score": 10,
              "modelAnswer": "طريقة 1 (الفرق بين مربعين):\n= (√12)² - (√18)²\n= 12 - 18\n= -6\nطريقة 2 (التبسيط بالتوزيع):\n√12 = 2√3 ، √18 = 3√2\n(2√3 - 3√2)(2√3 + 3√2) = 4(3) - 9(2) = 12 - 18 = -6."
            },
            {
              "title": "الفرع (ب)",
              "text": "جد مجموعة حل متباينة القيمة المطلقة الآتية ومثّل الحل على مستقيم الأعداد: |2x - 5| ≤ 7.",
              "score": 10,
              "modelAnswer": "-7 ≤ 2x - 5 ≤ 7\nبإضافة 5 إلى جميع الأطراف:\n-7 + 5 ≤ 2x ≤ 7 + 5\n-2 ≤ 2x ≤ 12\nبالقسمة على 2:\n-1 ≤ x ≤ 6\nمجموعة الحل: S = {x : -1 ≤ x ≤ 6} = [-1, 6].\nالتمثيل البياني: فترة مغلقة مظللة من النقطة -1 إلى النقطة 6 متضمنة الطرفين."
            }
          ],
          "modelAnswer": "لكل فرع (10) درجات كاملة."
        },
        {
          "id": "q_ma_2",
          "type": "math_problem",
          "title": "السؤال الثاني: المتتابعات الحسابية وتركيب التطبيقات",
          "text": "المتتابعات الحسابية وقوانين الحد العام والتطبيقات المركبة",
          "score": 20,
          "difficulty": "متقدم",
          "bloom": "تطبيق",
          "subject": "math",
          "linesCount": 4,
          "branches": [
            {
              "title": "الفرع (أ)",
              "text": "متتابعة حسابية حدها السابع يساوي 36 وأساسها d = 4. جد الحدود الثلاثة الواقعة بين u8 و u12 (أي جد u9, u10, u11).",
              "score": 10,
              "modelAnswer": "قانون الحد العام: un = a + (n - 1)d\nu7 = a + (7 - 1)(4) => 36 = a + 24 => a = 36 - 24 = 12\nإذن الحد الأول a = 12.\nu9 = 12 + (9 - 1)(4) = 12 + 32 = 44\nu10 = 44 + 4 = 48\nu11 = 48 + 4 = 52\nالحدود المطلوبة: 44 ، 48 ، 52."
            },
            {
              "title": "الفرع (ب)",
              "text": "إذا كان التطبيق f: Z → Z حيث f(x) = 2x + 1 و g: Z → Z حيث g(x) = x²، جد قيمة x إذا كان (f ∘ g)(x) = 33.",
              "score": 10,
              "modelAnswer": "(f ∘ g)(x) = f(g(x)) = f(x²)\n2(x²) + 1 = 33\n2x² = 33 - 1\n2x² = 32\nx² = 16\nx = ±√16 = ±4\nبما أن المجال Z هو مجموعة الأعداد الصحيحة، فالقيمتان مقبولة: x = 4 أو x = -4."
            }
          ],
          "modelAnswer": "توزيع الدرجات: (10) درجات لإيجاد الحدود، و(10) درجات لخطوات إيجاد قيمة x."
        },
        {
          "id": "q_ma_3",
          "type": "math_problem",
          "title": "السؤال الثالث: تحليل المقادير الجبرية والمقادير النسبية",
          "text": "طرق التحليل الجبري وتبسيط المقادير الجبرية النسبية",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تحليل",
          "subject": "math",
          "linesCount": 4,
          "branches": [
            {
              "title": "الفرع (أ)",
              "text": "حلل اثنين من المقادير الجبرية الآتية تحليلاً كاملاً: 1) 8x³ + 27 ، 2) x² - 7x + 12 ، 3) 4x² - 25.",
              "score": 10,
              "modelAnswer": "1) مجموع مكعبين: 8x³ + 27 = (2x + 3)(4x² - 6x + 9).\n2) التجربة: x² - 7x + 12 = (x - 3)(x - 4).\n3) الفرق بين مربعين: 4x² - 25 = (2x - 5)(2x + 5)."
            },
            {
              "title": "الفرع (ب)",
              "text": "اكتب المقدار الجبري النسبي الآتي في أبسط صورة: [(x² - 9) / (x² + 4x + 3)] ÷ [(2x - 6) / (x + 1)].",
              "score": 10,
              "modelAnswer": "بتحويل عملية القسمة إلى ضرب وقلب الكسر الثاني:\n= [(x² - 9) / (x² + 4x + 3)] × [(x + 1) / (2x - 6)]\nبتحليل البسوط والمقامات:\n= [(x - 3)(x + 3) / ((x + 1)(x + 3))] × [(x + 1) / (2(x - 3))]\nباختصار العوامل المشتركة (x - 3), (x + 3), (x + 1):\n= 1 / 2."
            }
          ],
          "modelAnswer": "الفرع (أ): 5 درجات لكل تحليل صحيح. الفرع (ب): 10 درجات لخطوات التحليل والاختصار."
        },
        {
          "id": "q_ma_4",
          "type": "math_problem",
          "title": "السؤال الرابع: حل المعادلات بالدستور والأنظمة الخطية",
          "text": "حل نظام معادلتين خطيتين بالحذف والقانون العام (الدستور)",
          "score": 20,
          "difficulty": "متقدم",
          "bloom": "تطبيق",
          "subject": "math",
          "linesCount": 5,
          "branches": [
            {
              "title": "الفرع (أ)",
              "text": "جد مجموعة حل نظام المعادلتين الآتيتين في R بطريقة الحذف: 1) 2x + y = 7 ، 2) x - y = 2.",
              "score": 10,
              "modelAnswer": "بجمع المعادلتين مباشرة لحذف y:\n(2x + x) + (y - y) = 7 + 2\n3x = 9 => x = 3\nبالتعويض في المعادلة الثانية (x - y = 2):\n3 - y = 2 => y = 3 - 2 = 1\nمجموعة الحل: S = {(3, 1)}."
            },
            {
              "title": "الفرع (ب)",
              "text": "حل المعادلة التربيعية الآتية باستخدام القانون العام (الدستور): 2x² + 5x - 3 = 0.",
              "score": 10,
              "modelAnswer": "المعاملات: a = 2 ، b = 5 ، c = -3\nالمميز: Δ = b² - 4ac = 5² - 4(2)(-3) = 25 + 24 = 49\nالقانون العام: x = [-b ± √Δ] / 2a\nx = [-5 ± √49] / (2 × 2) = [-5 ± 7] / 4\nإما x1 = (-5 + 7) / 4 = 2 / 4 = 1/2\nأو x2 = (-5 - 7) / 4 = -12 / 4 = -3\nمجموعة الحل: S = {1/2, -3}."
            }
          ],
          "modelAnswer": "الفرع (أ): 10 درجات لإيجاد x و y وكتابة مجموعة الحل. الفرع (ب): 10 درجات لتطبيق المميز والدستور."
        },
        {
          "id": "q_ma_5",
          "type": "math_problem",
          "title": "السؤال الخامس: الهندسة الإحداثية وحساب المثلثات",
          "text": "ميل المستقيم والنسب المثلثية للزوايا الحادة في المثلث القائم",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تطبيق",
          "subject": "math",
          "linesCount": 4,
          "branches": [
            {
              "title": "الفرع (أ)",
              "text": "جد ميل المستقيم المار بالنقطتين A(1, -2) و B(4, 4)، ثم حدد اتجاه حركته (هل هو متزايد للأعلى أم متناقص للأسفل أم أفقي).",
              "score": 10,
              "modelAnswer": "قانون الميل: m = (y2 - y1) / (x2 - x1)\nm = (4 - (-2)) / (4 - 1) = (4 + 2) / 3 = 6 / 3 = 2\nبما أن الميل موجب (m > 0)، فإن المستقيم يتجه للأعلى عند التحرك من اليسار إلى اليمين وتزداد قيم y."
            },
            {
              "title": "الفرع (ب)",
              "text": "في المثلث ABC القائم الزاوية في B، إذا كانت cos A = 3/5، جد كلاً من: sin A ، tan A ، cos C.",
              "score": 10,
              "modelAnswer": "cos A = المجاور / الوتر = AB / AC = 3/5\nإذن نفرض AB = 3k و AC = 5k.\nمن مبرهنة فيثاغورس:\nBC = √(AC² - AB²) = √(25k² - 9k²) = √16k² = 4k\n1) sin A = المقابل / الوتر = BC / AC = 4/5\n2) tan A = المقابل / المجاور = BC / AB = 4/3\n3) cos C = المجاور لـ C / الوتر = BC / AC = 4/5."
            }
          ],
          "modelAnswer": "الفرع (أ): 10 درجات لتطبيق قانون الميل وتحديد الاتجاه. الفرع (ب): 10 درجات لاستخدام فيثاغورس واستخراج النسب."
        }
      ]
    }
  },
  {
    "id": "preset_model_physics",
    "title": "🇮🇶 الامتحان الوزاري لمادة الفيزياء (نموذج متكامل)",
    "subject": "الفيزياء",
    "grade": "الصف الثالث المتوسط",
    "createdAt": "2026-10-12",
    "updatedAt": "2026-10-12",
    "questionsCount": 5,
    "totalScore": 100,
    "isModelPreset": true,
    "data": {
      "header": {
        "country": "جمهورية العراق",
        "ministry": "وزارة التربية - المديرية العامة للمناهج والتقويم",
        "school": "الامتحانات العامة للدراسة المتوسطة",
        "examTitle": "الامتحان الوزاري النهائي لمادة الفيزياء",
        "subject": "الفيزياء",
        "grade": "الصف الثالث المتوسط",
        "term": "الدور الأول",
        "year": "2025 - 2026 م",
        "time": "ثلاث ساعات",
        "seal": "assets/iraq_moe_seal.png",
        "teacher": "لجنة الاختصاص العلمي لمادة الفيزياء",
        "instructions": "ملاحظة: الإجابة عن خمسة أسئلة فقط ولكل سؤال (20) درجة. (اكتب القوانين والوحدات الفيزيائية بوضوح مع كل مسألة)."
      },
      "settings": {
        "direction": "rtl",
        "marginPreset": "compact",
        "marginH": 10,
        "marginV": 8,
        "fontFamily": "Cairo"
      },
      "questions": [
        {
          "id": "q_ph_1",
          "type": "math_problem",
          "title": "السؤال الأول: الكهربائية الساكنة وقانون كولوم",
          "text": "مسألة قانون كولوم وطرائق شحن الأجسام بالكهربائية الساكنة",
          "score": 20,
          "difficulty": "متقدم",
          "bloom": "تطبيق",
          "subject": "physics",
          "linesCount": 4,
          "branches": [
            {
              "title": "الفرع (أ)",
              "text": "شحنتان نقطيتان موجبتان مقدارهما q1 = 2 × 10⁻⁹ C و q2 = 4 × 10⁻⁹ C البعد بينهما r = 3 cm. احسب مقدار قوة التنافر المتبادلة بينهما في الفراغ (علماً أن k = 9 × 10⁹ N.m²/C²).",
              "score": 12,
              "modelAnswer": "تحويل البعد:\nr = 3 cm = 3 × 10⁻² m\nr² = (3 × 10⁻²)² = 9 × 10⁻⁴ m²\nقانون كولوم: F = k × (q1 × q2) / r²\nF = [9 × 10⁹ × 2 × 10⁻⁹ × 4 × 10⁻⁹] / [9 × 10⁻⁴]\nF = [72 × 10⁻⁹] / [9 × 10⁻⁴] = 8 × 10⁻⁵ N (نيوتن).\nنوع القوة: قوة تنافر كهربائي لأن الشحنتين من نفس النوع (موجبتان)."
            },
            {
              "title": "الفرع (ب)",
              "text": "ما هي طرائق شحن الأجسام بالكهربائية الساكنة؟ واشرح طريقة الشحن بالحَث بإيجاز مع توضيح مفهوم الشحنة المقيدة والطليقة.",
              "score": 8,
              "modelAnswer": "طرائق الشحن الثلاث: 1) الشحن بالدلك ، 2) الشحن بالتماس ، 3) الشحن بالحَث.\nالشحن بالحَث: تقريب جسم مشحون (المؤثر) من موصل معزول متعادل دون ملامسته، فتتجمع شحنات مخالفة لشحنة المؤثر قريبة منه تسمى (الشحنة المقيدة)، بينما تنفر الشحنات المشابهة إلى الطرف البعيد وتسمى (الشحنة الطليقة). وعند وصل الموصل بالأرض تتفرغ الشحنة الطليقة وتبقى المقيدة."
            }
          ],
          "modelAnswer": "الفرع (أ): 12 درجة للتحويل والقانون والتعويض والناتج مع الوحدة. الفرع (ب): 8 درجات لتعداد الطرق والشرح."
        },
        {
          "id": "q_ph_2",
          "type": "math_problem",
          "title": "السؤال الثاني: التيار الكهربائي وربط المقاومات وقانون أوم",
          "text": "ربط المقاومات على التوازي وقانون أوم والمقارنة بين أنواع الربط",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تطبيق",
          "subject": "physics",
          "linesCount": 4,
          "branches": [
            {
              "title": "الفرع (أ)",
              "text": "مقاومتان R1 = 3 Ω و R2 = 6 Ω مربوطتان على التوازي مع بطارية فرق جهدها 12 V. احسب: 1) المقاومة المكافئة Req ، 2) التيار الكلي في الدائرة Itotal ، 3) مقدار التيار المار في كل مقاومة I1 و I2.",
              "score": 12,
              "modelAnswer": "1) المقاومة المكافئة بالتوازي:\n1/Req = 1/R1 + 1/R2 = 1/3 + 1/6 = (2 + 1) / 6 = 3/6 = 1/2\nReq = 2 Ω (أوم).\n2) التيار الكلي: Itotal = Vtotal / Req = 12 / 2 = 6 A (أمبير).\n3) بما أن الربط توازي: V1 = V2 = Vtotal = 12 V\nI1 = V / R1 = 12 / 3 = 4 A\nI2 = V / R2 = 12 / 6 = 2 A\nالتحقق: 4 + 2 = 6 A."
            },
            {
              "title": "الفرع (ب)",
              "text": "قارن بين ربط المقاومات على التوالي وربطها على التوازي من حيث: (قانون فرق الجهد الكلي، قانون التيار الكلي، وسلوك الدائرة عند عطل أو رفع أحد المصابيح).",
              "score": 8,
              "modelAnswer": "ربط التوالي:\n- فرق الجهد: Vtotal = V1 + V2 + V3\n- التيار: Itotal = I1 = I2 = I3 (متساوٍ)\n- عند عطل مصباح: تنطفئ جميع المصابيح في الدائرة لأن المسار واحد ومفتوح.\nربط التوازي:\n- فرق الجهد: Vtotal = V1 = V2 = V3 (متساوٍ)\n- التيار: Itotal = I1 + I2 + I3\n- عند عطل مصباح: تستمر بقية المصابيح بالعمل بصورة طبيعية لوجود مسارات متعددة."
            }
          ],
          "modelAnswer": "الفرع (أ): 12 درجة موزعة بالتساوي على المطاليب. الفرع (ب): 8 درجات للمقارنة."
        },
        {
          "id": "q_ph_3",
          "type": "reasoning",
          "title": "السؤال الثالث: المغناطيسية وخواص المواد والتعاليل",
          "text": "تصنيف المواد المغناطيسية والتعاليل الفيزيائية المقررة",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "فهم",
          "subject": "physics",
          "linesCount": 4,
          "branches": [
            {
              "title": "الفرع (أ)",
              "text": "صنف المواد وفقاً لخواصها المغناطيسية (الدايامغناطيسية، البارامغناطيسية، الفيرومغناطيسية) مع ذكر مثال لكل نوع وسلوكه مع المغناطيس القوي.",
              "score": 10,
              "modelAnswer": "1) المواد الدايامغناطيسية: تتنافر مع المغناطيس القوي تنافراً ضعيفاً جداً (أمثلة: البزموت، الفسفور، الرصاص).\n2) المواد البارامغناطيسية: تنجذب للمغناطيس القوي تجاذباً ضعيفاً (أمثلة: الألمنيوم، البلاتين، التيتانيوم).\n3) المواد الفيرومغناطيسية: تنجذب للمغناطيس الاعتيادي بقوة وتمتلك قابلية تمغنط عالية جداً (أمثلة: الحديد، الفولاذ، النيكل، الكوبلت)."
            },
            {
              "title": "الفرع (ب)",
              "text": "علل اثنين مما يأتي: 1) تفقد المغانط مغناطيسيتها بـ (الطرق الشديد، والتسخين الشديد). 2) استخدام البوصلة في الملاحة لتحديد الاتجاهات. 3) تُحفظ البوصلات والأجهزة الحساسة داخل علب من الحديد المطاوع.",
              "score": 10,
              "modelAnswer": "1) لأن الطرق الشديد والتسخين العالي يبعثران الترتيب الهندسي المنتظم للمجالات المغناطيسية المصغرة داخل جزيئات المادة فتتعادل وتتلاشى المغناطيسية.\n2) لأن إبرة البوصلة مغناطيس دائمي خفيف يدور بحرية فيستقر تلقائياً موازياً لخطوط المجال المغناطيسي الأرضي (شمال - جنوب).\n3) لغرض التدريع المغناطيسي، حيث تحمي المادة الفيرومغناطيسية الأجهزة الحساسة من تأثير المجالات المغناطيسية الخارجية."
            }
          ],
          "modelAnswer": "الفرع (أ): 10 درجات للتصنيف والأمثلة. الفرع (ب): 5 درجات لكل تعليل صحيح."
        },
        {
          "id": "q_ph_4",
          "type": "math_problem",
          "title": "السؤال الرابع: المحولة الكهربائية والقوانين الحسابية",
          "text": "مسألة المحولة الكهربائية ونسبة التحويل والاختيارات الفيزيائية",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تطبيق",
          "subject": "physics",
          "linesCount": 4,
          "branches": [
            {
              "title": "الفرع (أ)",
              "text": "محولة كهربائية رُبط ملفها الابتدائي مع مصدر فولتية متناوبة (220 V)، والجهاز الكهربائي المربوط مع ملفها الثانوي يعمل على فولتية (110 V)، وكان عدد لفات ملفها الابتدائي (800) لفة. احسب: 1) عدد لفات الملف الثانوي N2 ، 2) ما نوع هذه المحولة؟ ولماذا؟",
              "score": 12,
              "modelAnswer": "المعطيات: V1 = 220 V ، V2 = 110 V ، N1 = 800 لفة.\n1) قانون نسبة التحويل:\nV2 / V1 = N2 / N1\n110 / 220 = N2 / 800\n1 / 2 = N2 / 800\n2 × N2 = 800 => N2 = 800 / 2 = 400 لفة.\n2) نوع المحولة: محولة خافضة للفولتية (رافعة للتيار).\nالسبب: لأن فولتية الملف الثانوي V2 (110V) أقل من فولتية الابتدائي V1 (220V)، وعدد لفات الثانوي N2 (400) أقل من N1 (800)."
            },
            {
              "title": "الفرع (ب)",
              "text": "اختر الإجابة الصحيحة لاثنين مما يأتي: 1) نسبة التحويل (N2/N1) في المحولة الخافضة تكون: (أكبر من 1 / أصغر من 1 / تساوي 1). 2) المحولة الكهربائية تعمل بكفاءة على تيار: (مستمر فقط / متناوب فقط / كلاهما).",
              "score": 8,
              "modelAnswer": "1) أصغر من 1 (لأن N2 < N1).\n2) متناوب فقط (لأن فكرة عمل المحولة تعتمد على توليد قوة دافعة كهربائية محتثة بتغير الفيض المغناطيسي، والتيار المستمر فيضه ثابت لا يولد حثاً)."
            }
          ],
          "modelAnswer": "الفرع (أ): 12 درجة للحل والتعليل. الفرع (ب): 4 درجات لكل اختيار صحيح مع السبب."
        },
        {
          "id": "q_ph_5",
          "type": "math_problem",
          "title": "السؤال الخامس: القدرة والطاقة الكهربائية ودوائر الأمان",
          "text": "حساب الطاقة الكهربائية المستثمرة وأجهزة الحماية والأمان المؤرضة",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تطبيق",
          "subject": "physics",
          "linesCount": 4,
          "branches": [
            {
              "title": "الفرع (أ)",
              "text": "مدفأة كهربائية تستهلك قدرة كهربائية مقدارها P = 1200 W وتعمل لمدة ساعتين (t = 2 h). احسب مقدار الطاقة الكهربائية المستهلكة بوحدة: 1) الجول (Joule) ، 2) الكيلوواط.ساعة (kW.h).",
              "score": 10,
              "modelAnswer": "1) بالجول (Joule):\nتحويل الزمن إلى ثوانٍ: t = 2 × 3600 = 7200 s\nقانون الطاقة: E = P × t\nE = 1200 × 7200 = 8,640,000 J = 8.64 × 10⁶ J.\n2) بوحدة الكيلوواط.ساعة (kW.h):\nتحويل القدرة إلى كيلوواط: P = 1200 / 1000 = 1.2 kW\nE = P × t = 1.2 kW × 2 h = 2.4 kW.h."
            },
            {
              "title": "الفرع (ب)",
              "text": "ما الفائدة العملية لكل من: 1) السلك المؤرض في الأجهزة المنزلية ، 2) القاطع الكهربائي (الفيوز) ، 3) الكشاف الكهربائي في المختبر؟",
              "score": 10,
              "modelAnswer": "1) السلك المؤرض: سلك أمان غليظ يفرغ الشحنات الكهربائية الخطرة إلى الأرض عند حدوث عطل أو تماس كهربائي في الغلاف المعدني لحماية الإنسان من الصعقة.\n2) القاطع الكهربائي (الفيوز): جهاز أمان يقطع الدائرة تلقائياً عند انسياب تيار أكبر من الحد المسموح به لمنع اشتعال الحرائق وتلف الأسلاك.\n3) الكشاف الكهربائي: جهاز للكشف عن وجود الشحنة الكهربائية على جسم ما، وتحديد نوع هذه الشحنة (موجبة أم سالبة)."
            }
          ],
          "modelAnswer": "الفرع (أ): 10 درجات للتحويل والقوانين. الفرع (ب): 10 درجات لفوائد أجهزة الأمان."
        }
      ]
    }
  },
  {
    "id": "preset_model_arabic",
    "title": "🇮🇶 الامتحان الوزاري لمادة اللغة العربية والأدب (نموذج متكامل)",
    "subject": "اللغة العربية",
    "grade": "الصف الثالث المتوسط",
    "createdAt": "2026-10-12",
    "updatedAt": "2026-10-12",
    "questionsCount": 5,
    "totalScore": 100,
    "isModelPreset": true,
    "data": {
      "header": {
        "country": "جمهورية العراق",
        "ministry": "وزارة التربية - المديرية العامة للتقويم والامتحانات",
        "school": "الامتحانات العامة للدراسة المتوسطة",
        "examTitle": "الامتحان الوزاري النهائي لمادة اللغة العربية",
        "subject": "اللغة العربية والأدب",
        "grade": "الصف الثالث المتوسط",
        "term": "الدور الأول",
        "year": "2025 - 2026 م",
        "time": "ثلاث ساعات",
        "seal": "assets/iraq_moe_seal.png",
        "teacher": "لجنة واضعي الأسئلة الوزارية للغة العربية",
        "instructions": "ملاحظة: الإجابة عن خمسة أسئلة فقط ولكل سؤال (20) درجة. (قواعد: 40 درجة، أدب ونصوص: 30 درجة، إملاء: 10 درجات، إنشاء: 20 درجة)."
      },
      "settings": {
        "direction": "rtl",
        "marginPreset": "compact",
        "marginH": 10,
        "marginV": 8,
        "fontFamily": "Cairo"
      },
      "questions": [
        {
          "id": "q_ar_1",
          "type": "essay",
          "title": "السؤال الأول: قواعد اللغة العربية (الميزان الصرفي وأبواب الأفعال)",
          "text": "الميزان الصرفي للكلمات وأبواب الأفعال الثلاثية ومصادرها",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تطبيق",
          "subject": "arabic",
          "linesCount": 4,
          "branches": [
            {
              "title": "الفرع (أ)",
              "text": "زن أربعاً من الكلمات التالية بالميزان الصرفي مضبوطة بالشكل التام: [ استغفار ، قاضٍ ، صِلْ ، مُجتهد ، انتصرَ ].",
              "score": 10,
              "modelAnswer": "1) اسْتِغْفَار: اسْتِفْعَال\n2) قَاضٍ: فَاعٍ (حُذفت الياء لالتقاء الساكنين والتنوين)\n3) صِلْ: عِلْ (حُذفت فاء الفعل الواو من وصل)\n4) مُجْتَهِد: مُفْتَعِل\n5) انْتَصَرَ: افْتَعَلَ."
            },
            {
              "title": "الفرع (ب)",
              "text": "ردّ فعلين مما يأتي إلى بابيهما من أبواب الأفعال الثلاثية مع ذكر السبب: 1) نَصَرَ - يَنْصُرُ ، 2) فَرِحَ - يَفْرَحُ ، 3) كَرُمَ - يَكْرُمُ.",
              "score": 10,
              "modelAnswer": "1) نَصَرَ - يَنْصُرُ: الباب الأول (فَتْحُ ضَمٍّ)، لأن عين الفعل مفتوحة في الماضي ومضمومة في المضارع.\n2) فَرِحَ - يَفْرَحُ: الباب الرابع (كَسْرُ فَتْحٍ)، لأن عين الفعل مكسورة في الماضي ومفتوحة في المضارع.\n3) كَرُمَ - يَكْرُمُ: الباب الخامس (ضَمُّ ضَمٍّ)، لأن عين الفعل مضمومة في الماضي والمضارع."
            }
          ],
          "modelAnswer": "الفرع (أ): درجتان ونصف لكل كلمة (المجموع 10). الفرع (ب): 5 درجات لكل باب مع التعليل."
        },
        {
          "id": "q_ar_2",
          "type": "essay",
          "title": "السؤال الثاني: قواعد اللغة العربية (المشتقات وإعراب معمولاتها)",
          "text": "اسم الفاعل وصيغ المبالغة وعمل المشتقات وإعراب معمولاتها",
          "score": 20,
          "difficulty": "متقدم",
          "bloom": "تحليل",
          "subject": "arabic",
          "linesCount": 4,
          "branches": [
            {
              "title": "الفرع (أ)",
              "text": "قال تعالى: ﴿وَالْكَاظِمِينَ الْغَيْظَ وَالْعَافِينَ عَنِ النَّاسِ وَاللَّهُ يُحِبُّ الْمُحْسِنِينَ﴾. استخرج المشتقات الواردة في النص الكريم وبيّن نوع كل منها، ثم أعرب معمول المشتق الأول (الغيظَ).",
              "score": 10,
              "modelAnswer": "المشتقات:\n1) (الْكَاظِمِينَ): اسم فاعل ثلاثي (كظم).\n2) (الْعَافِينَ): اسم فاعل ثلاثي (عفا).\n3) (الْمُحْسِنِينَ): اسم فاعل غير ثلاثي (أحسن - يحسن - محسن).\nإعراب معمول المشتق (الغيظَ): مفعول به لاسم الفاعل (الكاظمين) منصوب وعلامة نصبه الفتحة الظاهرة على آخره."
            },
            {
              "title": "الفرع (ب)",
              "text": "في جملة «أَراغبٌ أنتَ في التفوقِ العلمي؟»: 1) ما نوع المشتق (راغبٌ) وما شروط عمله؟ 2) أعرب المشتق وما بعده إعراباً وافياً.",
              "score": 10,
              "modelAnswer": "1) نوع المشتق: اسم فاعل، سبب عمله: نكرة منونة اعتمدت على استفهام ودلت على الحال والاستقبال.\n2) الإعراب:\n- (الهمزة): حرف استفهام مبني لا محل له من الإعراب.\n- (راغبٌ): مبتدأ مرفوع وعلامة رفعه الضمة الظاهرة على آخره.\n- (أنتَ): ضمير منفصل مبني في محل رفع فاعل لاسم الفاعل سدّ مسدّ الخبر."
            }
          ],
          "modelAnswer": "الفرع (أ): 6 درجات لاستخراج المشتقات و4 درجات لإعراب المعمول. الفرع (ب): 4 درجات لبيان النوع والشرط و6 درجات للإعراب."
        },
        {
          "id": "q_ar_3",
          "type": "essay",
          "title": "السؤال الثالث: الأدب والنصوص والشعر العربي",
          "text": "أعلام الأدب العراقي والعربي وقصائد الحفظ المقررة",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تذكر",
          "subject": "arabic",
          "linesCount": 4,
          "branches": [
            {
              "title": "الفرع (أ)",
              "text": "الشاعر محمد مهدي الجواهري: أين وُلد وبمَ لُقب؟ ثم اكتب أربعة أبيات من قصيدته الخالدة (يا دجلة الخير) مضبوطة بالشكل التام.",
              "score": 10,
              "modelAnswer": "ولادته: وُلد في النجف الأشرف عام 1899م.\nألقابه: لُقب بـ «شاعر العرب الأكبر» و«متنبي العصر الحديث».\nالأبيات الأربعة المقررة:\nحَيَّيْتُ سَفْحَكِ عَنْ بُعْدٍ فَحَيِّينِي ... يَا دِجْلَةَ الخَيْرِ يَا أُمَّ البَسَاتِينِ\nحَيَّيْتُ سَفْحَكِ ظَمْآنَاً أَلُوذُ بِهِ ... لَوْذَ الرَّمَائِضِ فِي رَمْثِ الأَفَانِينِ\nيَا دِجْلَةَ الخَيْرِ يَا نَبْعَاً أُفَارِقُهُ ... عَلَى الكَرَاهَةِ بَيْنَ الحِينِ وَالحِينِ\nإِنِّي وَرَدْتُ عُيُونَ المَاءِ كُلَّهَا ... فَمَا حَلَا لِيَ وِرْدٌ غَيْرَ صَافِينِ."
            },
            {
              "title": "الفرع (ب)",
              "text": "صل بين كل شاعر من شعراء الأدب العراقي والعربي وعنوان قصيدته المقررة: [ معروف الرصافي ، أحمد شوقي ، إبراهيم طوقان ، نازك الملائكة ] مع العناوين: [ الأرملة المرضعة ، ولد الهدى ، موطني ، الكوليرا ].",
              "score": 10,
              "modelAnswer": "1) معروف الرصافي ➔ قصيدة «الأرملة المرضعة»\n2) أحمد شوقي ➔ قصيدة «ولد الهدى»\n3) إبراهيم طوقان ➔ نشيد «موطني»\n4) نازك الملائكة ➔ قصيدة «الكوليرا» (أو الشهيد)."
            }
          ],
          "modelAnswer": "الفرع (أ): 3 درجات للترجمة و7 درجات لضبط الأبيات وصحتها. الفرع (ب): درجتان ونصف لكل توصيل صحيح."
        },
        {
          "id": "q_ar_4",
          "type": "essay",
          "title": "السؤال الرابع: الإملاء وقواعد علامات الترقيم",
          "text": "همزتا الوصل والقطع وعلامات الترقيم الأساسية",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تطبيق",
          "subject": "arabic",
          "linesCount": 3,
          "branches": [
            {
              "title": "الفرع (أ)",
              "text": "علل كتابة همزة الوصل في الفعل «استخرجَ» وكتابة همزة القطع في الفعل «أكرمَ»؟ مع ذكر قاعدتي الهمزتين.",
              "score": 10,
              "modelAnswer": "1) (استخرجَ): همزته همزة وصل؛ لأنه ماضي الفعل السداسي. وقاعدة السداسي والخماسي: ماضيهما وأمرهما ومصدرهما همزته وصل دائماً.\n2) (أكرمَ): همزته همزة قطع؛ لأنه ماضي الفعل الرباعي. وقاعدة الرباعي: ماضيه وأمره ومصدره همزته قطع دائماً وتكتب وتلفظ."
            },
            {
              "title": "الفرع (ب)",
              "text": "ضع علامات الترقيم المناسبة بين الأقواس في النص الآتي: «قال الحكيم ( ) يا بني ( ) عليك بالصدق ( ) فإنه منجاة ( )».",
              "score": 10,
              "modelAnswer": "قال الحكيم ( : ) يا بني ( ، ) عليك بالصدق ( ؛ ) فإنه منجاة ( . )\nالتعليل:\n- النقطتان الرأسيتان ( : ) بعد القول.\n- الفاصلة ( ، ) بعد المنادى.\n- الفاصلة المنقوطة ( ؛ ) قبل الجملة المسببة والتعليل.\n- النقطة ( . ) في نهاية الجملة التامة."
            }
          ],
          "modelAnswer": "الفرع (أ): 10 درجات لبيان نوع الهمزة والتعليل. الفرع (ب): درجتان ونصف لكل علامة ترقيم صحيحة."
        },
        {
          "id": "q_ar_5",
          "type": "essay",
          "title": "السؤال الخامس: الإنشاء والتعبير الوزاري",
          "text": "اكتب في أحد الموضوعين التاليين بما لا يقل عن عشرين سطراً مراعياً تسلسل الأفكار وعلامات الترقيم وسلامة اللغة والإملاء:\n1) العلم والعمل: «سلاحان لا غنى لأي أمة عنهما لبناء صروح المجد ورفعة الوطن ونهضة العراق».\n2) التسامح والوحدة الوطنية: «ركيزة التماسك المجتمعي وبناء السلام الحقيقي بين أبناء الوطن الواحد».",
          "score": 20,
          "difficulty": "متقدم",
          "bloom": "ابتكار",
          "subject": "arabic",
          "linesCount": 5,
          "modelAnswer": "معايير التصحيح الوزاري المعتمد:\n- صلة الأفكار وترابطها وتسلسلها والمقدمة والخاتمة: (8 درجات)\n- سلامة الإملاء والنحو وتوظيف الشواهد القرآنية والشعرية: (6 درجات)\n- مراعاة علامات الترقيم وجمال الخط والتنظيم وحسن التقسيم: (6 درجات)\nالمجموع: 20 درجة."
        }
      ]
    }
  },
  {
    "id": "preset_model_chemistry",
    "title": "⚗️ الامتحان الوزاري لمادة الكيمياء والجدول الدوري (الصف الثالث المتوسط)",
    "subject": "الكيمياء",
    "grade": "الصف الثالث المتوسط",
    "year": "2025 - 2026 م",
    "governorate": "جمهورية العراق - الامتحانات الوزارية العامة",
    "data": {
      "header": {
        "country": "جمهورية العراق",
        "ministry": "وزارة التربية - اللجنة الدائمة للامتحانات العامة",
        "school": "الامتحانات العامة للدراسة المتوسطة",
        "examTitle": "الامتحان الوزاري النهائي لمادة الكيمياء",
        "subject": "الكيمياء",
        "grade": "الصف الثالث المتوسط",
        "year": "2025 - 2026 م",
        "term": "الدور الأول",
        "time": "ثلاث ساعات",
        "teacher": "أستاذ الكيمياء",
        "seal": "assets/iraq_moe_seal.png",
        "instructions": "ملاحظة: الإجابة عن خمسة أسئلة فقط ولكل سؤال (20) درجة. (تكتب المعادلات الكيميائية موزونة مع ذكر الحالات الفيزيائية وظروف التفاعل)."
      },
      "questions": [
        {
          "id": "chem_q1",
          "type": "essay",
          "title": "س1 / الترتيب الإلكتروني والمفاهيم الكيميائية",
          "text": "(أ) اكتب الترتيب الإلكتروني لعنصر المغنيسيوم ($_{12}\\text{Mg}$)، ثم بيّن ما يأتي:\n1. رقم الدورة والزمرة التي يقع فيها العنصر.\n2. رمز لويس لذرة العنصر.\n3. تدرج مستويات الطاقة الثانوية المشغولة بالإلكترونات.\n\n(ب) عرّف اثنين مما يأتي:\n1. طاقة التأين\n2. قاعدة هوند\n3. الكهروسالبية",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تطبيق",
          "subject": "chemistry",
          "linesCount": 6,
          "modelAnswer": "(أ) الترتيب الإلكتروني: $1s^2 \\ 2s^2 \\ 2p^6 \\ 3s^2$\n1. الدورة: الثالثة (n=3)، الزمرة: الثانية (فلز قلوي ترابي).\n2. رمز لويس: $\\cdot \\text{Mg} \\cdot$ (نقطتان تمثلان إلكتروني التكافؤ).\n3. المستويات الثانوية حسب الطاقة: $1s < 2s < 2p < 3s$.\n\n(ب) التعاريف:\n1. طاقة التأين: مقدار الطاقة اللازمة لانتزاع إلكترون واحد من مستوى الطاقة الخارجي لذرة عنصر معينة متعادلة الشحنة في حالتها الغازية.\n2. قاعدة هوند: تنص على أنه لا يحدث ازدواج بين إلكترونين في مستوى الطاقة الثانوي إلا بعد أن تشغل أوربيتالاته فرادى أولاً."
        },
        {
          "id": "chem_q2",
          "type": "fill_blanks",
          "title": "س2 / المعادلات الكيميائية الوزارية الموزونة",
          "text": "أكمل ووازن المعادلات الكيميائية الآتية مع توضيح ظروف التفاعل والحالات الفيزيائية (أجب عن أربع فقط):\n1. $\\text{Ca(OH)}_2 + \\text{CO}_2 \\rightarrow \\dots + \\dots$\n2. $2\\text{Al} + \\text{Fe}_2\\text{O}_3 \\xrightarrow{\\Delta} \\dots + \\dots$\n3. $\\text{N}_2\\text{(g)} + 3\\text{H}_2\\text{(g)} \\rightleftharpoons \\dots$\n4. $\\text{CH}_4\\text{(g)} + 2\\text{O}_2\\text{(g)} \\rightarrow \\dots + \\dots$\n5. $\\text{CaCO}_3\\text{(s)} \\xrightarrow{\\Delta} \\dots + \\dots$",
          "score": 20,
          "difficulty": "صعب",
          "bloom": "تطبيق",
          "subject": "chemistry",
          "linesCount": 5,
          "modelAnswer": "1. $\\text{Ca(OH)}_2 + \\text{CO}_2 \\rightarrow \\text{CaCO}_3\\downarrow + \\text{H}_2\\text{O}$ (تعكر ماء الكلس الرائق)\n2. $2\\text{Al} + \\text{Fe}_2\\text{O}_3 \\xrightarrow{\\Delta} \\text{Al}_2\\text{O}_3 + 2\\text{Fe} + \\text{حرارة عالية (تفاعل الثرميت)}$\n3. $\\text{N}_2\\text{(g)} + 3\\text{H}_2\\text{(g)} \\rightleftharpoons 2\\text{NH}_3\\text{(g)} \\quad (\\Delta H < 0)$ (طريقة هابر)\n4. $\\text{CH}_4\\text{(g)} + 2\\text{O}_2\\text{(g)} \\rightarrow \\text{CO}_2\\text{(g)} + 2\\text{H}_2\\text{O(g)} + \\text{طاقة}$ (احتراق الميثان)\n5. $\\text{CaCO}_3\\text{(s)} \\xrightarrow{\\Delta} \\text{CaO(s)} + \\text{CO}_2\\text{(g)}\\uparrow$ (تفكك الحجر الجيري)"
        },
        {
          "id": "chem_q3",
          "type": "reasoning",
          "title": "س3 / التعاليل العلمية والتفسير الكيميائي",
          "text": "علل علمياً لما يأتي بدقة واختصار (أجب عن أربعة فقط):\n1. سميت عناصر الزمرة الأولى في الجدول الدوري بالفلزات القلوية.\n2. لا يحدث تنافر بين إلكتروني الأوربيتال الواحد على الرغم من أنهما يحملان نفس الشحنة السالبة.\n3. يستخدم فلز الصوديوم كعامل مختزل قوي في العديد من التفاعلات الكيميائية.\n4. يزداد إنتاج غاز الأمونيا عند زيادة الضغط المسلط على التفاعل الغازي المتزن طبقاً لقاعدة لوشاتليه.\n5. غاز النيتروجين عديم اللون والرائحة ويكون خاملاً وغير فعال كيميائياً في درجات الحرارة الاعتيادية.",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تحليل",
          "subject": "chemistry",
          "linesCount": 5,
          "modelAnswer": "1. لأن محاليلها في الماء عالية القاعدية (قلوية).\n2. لأن أحدهما يبرم حول محوره باتجاه عقارب الساعة ($m_s = +1/2$) والآخر يبرم بعكس اتجاه عقارب الساعة ($m_s = -1/2$)، فيلغي المجال المغناطيسي لأحدهما المجال المغناطيسي للآخر.\n3. لشدة تأكسده وسهولة فقدانه لإلكترون التكافؤ الخارجي الوحيد.\n4. لأن زيادة الضغط ترجح التفاعل نحو الطرف الذي يحتوي على عدد مولات غازية أقل (طرف النواتج 2 مول مقابل 4 مولات للمتفاعلات).\n5. لوجود آصرة تساهمية ثلاثية قوية جداً بين ذرتي النيتروجين في جزيء $\\text{N}_2$ يصعب كسرها في درجات الحرارة الاعتيادية."
        },
        {
          "id": "chem_q4",
          "type": "math_problem",
          "title": "س4 / المسائل والحسابات الكيميائية والمقارنات",
          "text": "(أ) ما النسبة المئوية الكتلية لكل من حامض الهيدروكلوريك (المذاب) والماء (المذيب) في محلول نتج عن إذابة $20\\text{ g}$ من حامض $\\text{HCl}$ في $80\\text{ g}$ من الماء المقطر؟\n\n(ب) قارن في جدول بين كلوريد الصوديوم النقي ($\\text{NaCl}$) وملح الطعام العادي التجاري من حيث نقاوته وظاهرة التميه.",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تطبيق",
          "subject": "chemistry",
          "linesCount": 6,
          "modelAnswer": "(أ) الحل الرياضي:\nكتلة المذاب: $m_1 = 20\\text{ g}$\nكتلة المذيب: $m_2 = 80\\text{ g}$\nكتلة المحلول الكلية: $m_T = m_1 + m_2 = 20 + 80 = 100\\text{ g}$\nالنسبة الكتلية للمذاب: $\\frac{m_1}{m_T} \\times 100\\% = \\frac{20}{100} \\times 100\\% = 20\\%$\nالنسبة الكتلية للمذيب: $\\frac{m_2}{m_T} \\times 100\\% = \\frac{80}{100} \\times 100\\% = 80\\%$\n\n(ب) المقارنة:\n- كلوريد الصوديوم النقي: مادة لا تمتص الرطوبة من الجو (لا تتميه) لعدم احتوائه على شوائب.\n- ملح الطعام العادي: مادة متميهة تمتص الرطوبة من الجو لاحتوائه على شوائب من كلوريد الكالسيوم أو كلوريد المغنيسيوم أو كليهما."
        },
        {
          "id": "chem_q5",
          "type": "mcq",
          "title": "س5 / الاختيارات من متعدد والصح والخطأ",
          "text": "(أ) اختر الإجابة الصحيحة لكل مما يأتي:\n1. مستوى الطاقة الرئيسي الثاني ($n=2$) يتسع كحد أقصى لـ [ 6 ، 8 ، 18 ] إلكتروناً.\n2. الصيغة الكيميائية لغاز الأسيتيلين هي [ $\\text{CH}_4$ ، $\\text{C}_2\\text{H}_4$ ، $\\text{C}_2\\text{H}_2$ ].\n\n(ب) بيّن صحة أو خطأ كل عبارة مع تصحيح الخطأ إن وجد:\n1. غاز ثنائي أوكسيد الكاربون أثقل من الهواء ولا يشتعل ولا يساعد على الاشتعال.\n2. عناصر الزمرة السابعة في الجدول الدوري تسمى بالهالوجينات وتكافؤها ثنائي.",
          "score": 20,
          "difficulty": "سهل",
          "bloom": "تذكر",
          "subject": "chemistry",
          "options": [
            "1. 8 إلكترونات | 2. C₂H₂ (الأسيتيلين)",
            "1. صح | 2. خطأ (تكافؤها أحادي)"
          ],
          "linesCount": 4,
          "modelAnswer": "(أ) الاختيارات:\n1. 8 إلكترونات ($2s^2 + 2p^6$)\n2. $\\text{C}_2\\text{H}_2$ (الأسيتيلين)\n\n(ب) الصح والخطأ:\n1. صح (لذلك يُستخدم في إطفاء الحرائق).\n2. خطأ (الصواب: تكافؤها أحادي لأنها تكتسب إلكتروناً واحداً للوصول للتشبع الثماني)."
        }
      ]
    }
  }
  ,
  /* ==========================================================================
     نماذج الامتحانات الوزارية المعتمدة - الصف السادس الإعدادي (العلمي والأدبي)
     ========================================================================== */
  {
    "id": "preset_model_islamic_6th",
    "title": "🕌 الامتحان الوزاري لمادة التربية الإسلامية (الصف السادس الإعدادي)",
    "subject": "التربية الإسلامية",
    "grade": "الصف السادس الإعدادي",
    "createdAt": "2026-10-14",
    "updatedAt": "2026-10-14",
    "questionsCount": 5,
    "totalScore": 100,
    "isModelPreset": true,
    "data": {
      "header": {
        "country": "جمهورية العراق",
        "ministry": "وزارة التربية - اللجنة الدائمة للامتحانات العامة",
        "school": "الامتحانات العامة للدراسة الإعدادية",
        "examTitle": "الامتحان الوزاري النهائي لمادة التربية الإسلامية",
        "subject": "التربية الإسلامية والقرآن الكريم",
        "grade": "الصف السادس الإعدادي",
        "term": "الدور الأول",
        "year": "2025 - 2026 م",
        "time": "ثلاث ساعات",
        "seal": "assets/iraq_moe_seal.png",
        "teacher": "اللجنة الوزارية المركزية",
        "instructions": "ملاحظة: الإجابة عن خمسة أسئلة فقط ولكل سؤال (20) درجة. الترك الضمني موضح داخل فروع الأسئلة."
      },
      "settings": {
        "direction": "rtl",
        "marginPreset": "compact",
        "marginH": 10,
        "marginV": 8,
        "fontFamily": "Cairo"
      },
      "questions": [
        {
          "id": "is6_q1",
          "type": "essay",
          "title": "س1 / أحكام التلاوة والتجويد",
          "text": "(أ) عرّف لام التعريف، ثم بيّن حكم لام (ال) في خمس من الكلمات القرآنية الآتية موضحاً السبب: (الْقَمَر، الشَّمْس، الْغَفُور، النَّاس، الْبَصِير، الرَّحْمَٰن).\n\n(ب) بيّن حكم الراء (تفخيماً أو ترقيقاً) في أربع من الكلمات الآتية مع ذكر السبب: (قُرْآن، فِرْعَوْن، رَحْمَة، نَذِير، مِرْيَة).",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تطبيق",
          "subject": "islamic",
          "linesCount": 6,
          "modelAnswer": "(أ) لام التعريف: هي لام ساكنة تدخل على الأسماء النكرة لتعريفها، وحكمها الإظهار القمري إذا جاء بعدها أحد حروف (ابغ حجك وخف عقيمه)، والإدغام الشمسي فيما عداها.\n1. الْقَمَر: إظهار قمري (القاف حرف قمري).\n2. الشَّمْس: إدغام شمسي (الشين حرف شمسي).\n3. الْغَفُور: إظهار قمري (الغين حرف قمري).\n4. النَّاس: إدغام شمسي (النون حرف شمسي).\n5. الْبَصِير: إظهار قمري (الباء حرف قمري).\n\n(ب) أحكام الراء:\n1. قُرْآن: تفخيم (الراء ساكنة بعد ضم).\n2. فِرْعَوْن: ترقيق (الراء ساكنة بعد كسر أصلي).\n3. رَحْمَة: تفخيم (الراء مفتوحة).\n4. نَذِير: ترقيق عند الوقف (الراء متطرفة مسبوقة بياء ساكنة مدية)."
        },
        {
          "id": "is6_q2",
          "type": "essay",
          "title": "س2 / الحفظ (النصوص القرآنية المقررة)",
          "text": "اكتب من سورة النجم من قوله تعالى: ﴿وَالنَّجْمِ إِذَا هَوَىٰ﴾ إلى قوله تعالى: ﴿عِندَهَا جَنَّةُ الْمَأْوَىٰ﴾ مضبوطاً بالشكل التام مع مراعاة الرسم القرآني.",
          "score": 20,
          "difficulty": "صعب",
          "bloom": "تذكر",
          "subject": "islamic",
          "linesCount": 8,
          "modelAnswer": "بسم الله الرحمن الرحيم\n﴿وَالنَّجْمِ إِذَا هَوَىٰ ﴿1﴾ مَا ضَلَّ صَاحِبُكُمْ وَمَا غَوَىٰ ﴿2﴾ وَمَا يَنطِقُ عَنِ الْهَوَىٰ ﴿3﴾ إِنْ هُوَ إِلَّا وَحْيٌ يُوحَىٰ ﴿4﴾ عَلَّمَهُ شَدِيدُ الْقُوَىٰ ﴿5﴾ ذُو مِرَّةٍ فَاسْتَوَىٰ ﴿6﴾ وَهُوَ بِالْأُفُقِ الْأَعْلَىٰ ﴿7﴾ ثُمَّ دَنَا فَتَدَلَّىٰ ﴿8﴾ فَكَانَ قَابَ قَوْسَيْنِ أَوْ أَدْنَىٰ ﴿9﴾ فَأَوْحَىٰ إِلَىٰ عَبْدِهِ مَا أَوْحَىٰ ﴿10﴾ مَا كَذَبَ الْفُؤَادُ مَا رَأَىٰ ﴿11﴾ أَفَتُمَارُونَهُ عَلَىٰ مَا يَرَىٰ ﴿12﴾ وَلَقَدْ رَآهُ نَزْلَةً أُخْرَىٰ ﴿13﴾ عِندَ سِدْرَةِ الْمُنتَهَىٰ ﴿14﴾ عِندَهَا جَنَّةُ الْمَأْوَىٰ ﴿15﴾﴾\nصدق الله العظيم"
        },
        {
          "id": "is6_q3",
          "type": "essay",
          "title": "س3 / الفهم والتفسير والمعاني والمناقشة",
          "text": "(أ) ما معنى المفردات القرآنية الآتية: (مَا ضَلَّ صَاحِبُكُمْ ، ذُو مِرَّةٍ ، فَكَانَ قَابَ قَوْسَيْنِ ، مَا زَاغَ الْبَصَرُ)؟\n\n(ب) لماذا أقسم الله تعالى بالنجم؟ وما دلالة قوله تعالى: ﴿وَمَا يَنطِقُ عَنِ الْهَوَىٰ ۝ إِنْ هُوَ إِلَّا وَحْيٌ يُوحَىٰ﴾ في عصمة النبي ﷺ وسنته الشريفة؟",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "فهم",
          "subject": "islamic",
          "linesCount": 6,
          "modelAnswer": "(أ) معاني الكلمات:\n- مَا ضَلَّ صَاحِبُكُمْ: ما حاد محمد ﷺ عن طريق الحق وما زاغ عن الرشاد.\n- ذُو مِرَّةٍ: ذو قوة وحصافة وخلق حسن ومظهر مهيب (وهو جبريل عليه السلام).\n- قَابَ قَوْسَيْنِ: مقدار مسافة قوسين عربيين في القرب والاتصال.\n- مَا زَاغَ الْبَصَرُ: ما مال بصر النبي ﷺ عما أُمر برؤيته ولا جاوزه.\n\n(ب) أقسم الله تعالى بالنجم لبيان عظيم شأنه وما فيه من هداية وإعجاز في كبد السماء، والآية تؤكد عصمة النبي الأكرم ﷺ في تبليغ الوحي والدين، وأن سنته وأقواله الشريفة صادرة عن وحي إلهي وتشريع رباني لا هوى فيه."
        },
        {
          "id": "is6_q4",
          "type": "essay",
          "title": "س4 / الحديث النبوي الشريف",
          "text": "(أ) اكتب حديثاً نبوياً شريفاً في (محاسبة النفس) عن النبي محمد ﷺ، واذكر أهم ثلاث نقاط مما يرشد إليه الحديث.\n\n(ب) من هو الكَيِّس؟ ومن هو العاجز بحسب التوجيه النبوي الشريف؟",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تطبيق",
          "subject": "islamic",
          "linesCount": 6,
          "modelAnswer": "(أ) نص الحديث الشريف:\nقال رسول الله ﷺ: «الكَيِّسُ مَنْ دَانَ نَفْسَهُ وَعَمِلَ لِمَا بَعْدَ المَوْتِ، وَالعَاجِزُ مَنْ أَتْبَعَ نَفْسَهُ هَوَاهَا وَتَمَنَّى عَلَى اللَّهِ الأَمَانِي».\nأهم ما يرشد إليه الحديث:\n1. وجوب محاسبة النفس في كل قول وفعل قبل فوات الأوان.\n2. الاستعداد للدار الآخرة بالأعمال الصالحة ومراقبة الله.\n3. التحذير من اتباع الهوى والغرور والأماني الباطلة دون عمل.\n\n(ب) الكيّس: هو العاقل الحكيم الضابط لنفسه المحاسب لها العامل لآخرته. أما العاجز: فهو المتبع لشهواته وأهوائه المقصر في الطاعات والمتمني على الله المغفرة دون توبة أو عمل."
        },
        {
          "id": "is6_q5",
          "type": "essay",
          "title": "س5 / الأبحاث الإسلامية والتهذيب",
          "text": "(أ) بيّن مكانة الأسرة في المنظومة الإسلامية، وما أهم الواجبات المشتركة بين الزوجين لحفظ الاستقرار التربوي؟\n\n(ب) عرّف التكبر، واذكر اثنين من مساوئه وعواقبه الوخيمة على المجتمع، ومثّل لعلاجه من الهدي النبوي.",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تحليل",
          "subject": "islamic",
          "linesCount": 6,
          "modelAnswer": "(أ) الأسرة هي اللبنة الأولى والملاذ التربوي في المجتمع الإسلامي، ومن واجباتها: المودة والرحمة، تقاسم المسؤوليات، حسن العشرة، ورعاية الأبناء وتربيتهم على الفضيلة.\n\n(ب) التكبر: هو بطر الحق وغمط الناس والتعالي عليهم بالمال أو الجاه أو النسب. مساوئه: انتشار البغضاء، سقوط الهيبة، والحرمان من الجنة. علاجه: التواضع لله، تذكر أصل خلقة الإنسان من تراب، والتمثل بسيرة النبي ﷺ في تواضعه ومشاركته للفقراء والمحتاجين."
        }
      ]
    }
  },

  {
    "id": "preset_model_arabic_6th",
    "title": "📖 الامتحان الوزاري لمادة اللغة العربية والأدب (الصف السادس الإعدادي)",
    "subject": "اللغة العربية",
    "grade": "الصف السادس الإعدادي",
    "createdAt": "2026-10-14",
    "updatedAt": "2026-10-14",
    "questionsCount": 5,
    "totalScore": 100,
    "isModelPreset": true,
    "data": {
      "header": {
        "country": "جمهورية العراق",
        "ministry": "وزارة التربية - اللجنة الدائمة للامتحانات العامة",
        "school": "الامتحانات العامة للدراسة الإعدادية",
        "examTitle": "الامتحان الوزاري النهائي لمادة اللغة العربية",
        "subject": "اللغة العربية والأدب والنقد",
        "grade": "الصف السادس الإعدادي",
        "term": "الدور الأول",
        "year": "2025 - 2026 م",
        "time": "ثلاث ساعات",
        "seal": "assets/iraq_moe_seal.png",
        "teacher": "اللجنة الوزارية المشتركة",
        "instructions": "ملاحظة: الإجابة عن خمسة أسئلة فقط ولكل سؤال (20) درجة. (قواعد: 40 درجة، أدب ونصوص: 30 درجة، نقد وبلاغة: 10 درجات، إنشاء: 20 درجة)."
      },
      "settings": {
        "direction": "rtl",
        "marginPreset": "compact",
        "marginH": 10,
        "marginV": 8,
        "fontFamily": "Cairo"
      },
      "questions": [
        {
          "id": "ar6_q1",
          "type": "essay",
          "title": "س1 / قواعد اللغة العربية (أسلوب الاستفهام)",
          "text": "(أ) قال الشاعر: «أَتَدْرِي قَلْبَ مَنْ جَرَحَتْ يَدَاكَا ... وَمَا لَيْلُ المَتَيَّمِ يَا دُجَاكَا»\n1. ما نوع الاستفهام في الشطر الأول؟ وهل يجوز استبدال (هل) بالهمزة؟ ولماذا؟\n2. أعرب اسم الاستفهام (مَا) في الشطر الثاني معللاً القاعدة النحوية.\n\n(ب) قال تعالى: ﴿قَالُوا يَا وَيْلَنَا مَن بَعَثَنَا مِن مَّرْقَدِنَا﴾. ما دلالة اسم الاستفهام (مَن)؟ وما موقعه الإعرابي مع ذكر السبب؟",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تحليل",
          "subject": "arabic",
          "linesCount": 6,
          "modelAnswer": "(أ) 1. نوع الاستفهام: تصديق (لأنه يجاب عنه بحرف جواب ولخلو الجملة من أم المعادلة). نعم يجوز الاستبدال فنقول: «هل تدري؟» لأن الكلام مثبت والاستفهام تصديق.\n2. إعراب (ما): اسم استفهام مبني على السكون في محل رفع مبتدأ أو خبر مقدم جوازاً؛ تلاه اسم معرفة (ليلُ المتيمِ - معرف بالإضافة).\n\n(ب) دلالة (مَن): للعاقل.\nإعرابه: اسم استفهام مبني على السكون في محل رفع مبتدأ، السبب: تلاه فعل متعدٍ استوفى مفعوله (بعثَنا - نا مفعول به)."
        },
        {
          "id": "ar6_q2",
          "type": "essay",
          "title": "س2 / قواعد اللغة العربية (أسلوب النفي)",
          "text": "(أ) قال تعالى: ﴿وَمَا يُغْنِي عَنْهُ مَالُهُ إِذَا تَرَدَّىٰ﴾ وقال الشاعر: «لَيْسَ التَّعَلُّلُ بِالآمَالِ يُنْجِينَا».\n1. ما نوع (ما) في الآية الكريمة؟ وما أثرها الإعرابي والمعنوي في الفعل؟\n2. دلّ على معمولي الفعل الناقص (ليس)، ثم أكّد نفيها بحرف جر زائد مضبوطاً بالشكل.\n\n(ب) فرّق بين المعنى الإعرابي والزمني لكل من: (لَمْ يَكْتُبْ) و (لَنْ يَكْتُبَ).",
          "score": 20,
          "difficulty": "صعب",
          "bloom": "تطبيق",
          "subject": "arabic",
          "linesCount": 6,
          "modelAnswer": "(أ) 1. نوع (ما): نافية غير عاملة، دخلت على الفعل المضارع، أثرها المعنوي: تنفي حدوث الفعل المضارع وتخلصه للحال دون قرينة، أثرها الإعرابي: لا عمل لها يبقى الفعل المضارع مرفوعاً.\n2. معمولي ليس: اسمها: (التعللُ)، خبرها: الجملة الفعلية (يُنجينا). التوكيد: «ليس التعللُ بمُنجينا» (الباء حرف جر زائد في خبر ليس).\n\n(ب) - لم يكتب: (لم) أداة نفي وجزم وقلب، تجزم الفعل المضارع وتقلب دلالته الزمنية إلى الماضي ونفيها مؤكد.\n- لن يكتب: (لن) أداة نفي ونصب واستقبال، تنصب الفعل المضارع وتنفي حدوثه في المستقبل نفياً مؤكداً لا يحتاج إلى قسم."
        },
        {
          "id": "ar6_q3",
          "type": "essay",
          "title": "س3 / قواعد اللغة العربية (التوكيد والتقديم والتأخير)",
          "text": "(أ) قال تعالى: ﴿وَفِي السَّمَاءِ رِزْقُكُمْ وَمَا تُوعَدُونَ﴾. عيّن المتقدم، وبيّن نوعه، وحكم تقديمه معللاً، واذكر فائدته البلاغية.\n\n(ب) استخرج التوكيد من النصوص الآتية مبيناً طريقته ونوعه:\n1. قال تعالى: ﴿فَسَجَدَ الْمَلَائِكَةُ كُلُّهُمْ أَجْمَعُونَ﴾.\n2. «الصِّدْقَ الصِّدْقَ فَإِنَّهُ مَنْجَاةٌ».",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تحليل",
          "subject": "arabic",
          "linesCount": 6,
          "modelAnswer": "(أ) المتقدم: (في السماءِ)، نوعه: تقديم الخبر على المبتدأ (شبه جملة)، حكمه: جوازاً، السبب: لأن المبتدأ معرفة (رزقُكم - معرف بالإضافة)، فائدته: التوكيد والتخصيص.\n\n(ب) 1. (كلّهم): توكيد معنوي، (أجمعون): توكيد معنوي ثانٍ لتقوية الشمول.\n2. (الصدقَ الثانية): توكيد لفظي بتكرار الاسم المفرد منصوب."
        },
        {
          "id": "ar6_q4",
          "type": "essay",
          "title": "س4 / الأدب والنصوص والشعر العربي الحديث",
          "text": "(أ) عرّف مدرسة الإحياء الشعرية، ومن هم روادها في مصر والعراق؟ وما هي الخصائص الفنية لشعر الشاعر محمود سامي البارودي؟\n\n(ب) انسب الشعراء الآتين إلى مدارسهم الشعرية واذكر عنوان قصيدة لكل منهم: (بدر شاكر السياب ، ميخائيل نعيمة ، محمد سعيد الحبوبي). ثم اكتب ثلاثة أبيات مضبوطة بالشكل لقصيدة أحدهم.",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تذكر",
          "subject": "arabic",
          "linesCount": 8,
          "modelAnswer": "(أ) مدرسة الإحياء: مدرسة شعرية ظهرت أواخر القرن التاسع عشر نادت ببعث التقاليد الشعرية الأصيلة من قوة العبارة وجزالة الألفاظ ومتانة البناء. روادها: البارودي وشوقي بمصر، والحبوبي والرصافي والكاظمي بالعراق. خصائص البارودي: جزالة الألفاظ، نقاء الديباجة، التمسك بعمود الشعر العربي.\n\n(ب) - بدر شاكر السياب: مدرسة الشعر الحر (قصيدة: أنشودة المطر).\n- ميخائيل نعيمة: مدرسة المهجر / الرابطة القلمية (قصيدة: أخي).\n- محمد سعيد الحبوبي: مدرسة الإحياء (موشح: بلادك نجد).\nأبيات الحبوبي:\nهَزَّتِ الزَّوْرَاءُ أَعْطَافَ الصَّفَا ... فَصَفَتْ لِي رَغْدَةُ الْعَيْشِ الْهَنِي\nفَارْعَ مِنْ عَهْدِ دِمَشْقٍ مَا صَفَا ... وَسَقَى اللَّهُ زَمَانَ الْوَصْلِ بِالْغُوطَتَيْنِ"
        },
        {
          "id": "ar6_q5",
          "type": "essay",
          "title": "س5 / النقد الأدبي والتعبير الإنشائي",
          "text": "(أ) ما هي عناصر العمل الأدبي الأربعة؟ وما وظيفة الخيال الفني في التجربة الشعورية لدى الشاعر؟\n\n(ب) التعبير والإنشاء: اكتب مقالاً أدبياً رصيناً بعنوان:\n«العلم والأخلاق دعامتان لا تنفصلان في بناء حضارة الأوطان ورفعة العراق»\n(مراعياً وضوح الفكرة، سلامة الإملاء وعلامات الترقيم، وتضمين الشواهد القرآنية والشعرية).",
          "score": 20,
          "difficulty": "سهل",
          "bloom": "إبداع",
          "subject": "arabic",
          "linesCount": 10,
          "modelAnswer": "(أ) عناصر العمل الأدبي: 1) العاطفة، 2) الفكرة، 3) الخيال، 4) الأسلوب واللغة.\nوظيفة الخيال: يجسد المعاني المجردة في صور حسية نابضة، ويمنح الأفكار أبعاداً جمالية وشعورية تثير الإعجاب في نفس المتلقي.\n\n(ب) يُقوّم المقال على: ديباجة التعبير، ترابط الأفكار، توظيف الآيات القرآنية والأبيات الشعرية، وحسن استخدام علامات الترقيم (الفاصلة، النقطة، علامات التنصيص)."
        }
      ]
    }
  },

  {
    "id": "preset_model_english_6th",
    "title": "🇬🇧 Ministerial Exam - English Language (6th Preparatory)",
    "subject": "English Language",
    "grade": "6th Preparatory",
    "createdAt": "2026-10-14",
    "updatedAt": "2026-10-14",
    "questionsCount": 5,
    "totalScore": 100,
    "isModelPreset": true,
    "data": {
      "header": {
        "country": "Republic of Iraq",
        "ministry": "Ministry of Education - General Examination Board",
        "school": "General Preparatory Baccalaureate Examinations",
        "examTitle": "Ministerial Final Baccalaureate Exam - English Language",
        "subject": "English Language & Literature",
        "grade": "6th Preparatory (Scientific & Literary)",
        "term": "1st Round",
        "year": "2025 - 2026",
        "time": "3 Hours",
        "seal": "assets/iraq_moe_seal.png",
        "teacher": "Central Examination Committee",
        "instructions": "Note: Answer all questions. Total marks: 100 Marks. (Q1=25, Q2=20, Q3=20, Q4=15, Q5=20)."
      },
      "settings": {
        "direction": "ltr",
        "marginPreset": "compact",
        "marginH": 10,
        "marginV": 8,
        "fontFamily": "Cairo"
      },
      "questions": [
        {
          "id": "en6_q1",
          "type": "essay",
          "title": "Q1 / Reading Comprehension (Unseen & Textbook Passages) (25 Marks)",
          "text": "(A) Read the unseen passage carefully, then answer (5) questions:\nRenewable energy sources such as solar power and wind generation have become crucial in modern times. Unlike fossil fuels, green energy does not emit greenhouse gases that cause global warming. Countries with abundant sunlight are currently investing heavily in photovoltaic technologies to supply power stations and desalination plants sustainably.\n1. Why is renewable energy superior to conventional fossil fuels?\n2. What technology is utilized in countries with abundant sunlight?\n3. Does green energy cause global warming? (Yes / No)\n4. Find a word in the text that means: (producing/making) ............\n5. Give a suitable title to the passage.\n\n(B) Answer or complete (5) of the following from your textbook passages:\n1. Zaid Tariq was saved from the shark by (six dolphins / a coastguard boat directly).\n2. Why was Mustafa puzzled when he woke up in the morning?\n3. Latifa suffered from diabetes, so she needed regular injections of ............\n4. What is a radar detector? And how do police officers maintain its accuracy?\n5. Why do bankers and financial advisors need good communication skills?",
          "score": 25,
          "difficulty": "متوسط",
          "bloom": "فهم",
          "subject": "english",
          "linesCount": 8,
          "modelAnswer": "(A) 1. Because it does not emit greenhouse gases and is sustainable.\n2. Photovoltaic solar technologies.\n3. No, it does not.\n4. Generation.\n5. Renewable Energy and the Future.\n\n(B) 1. Six dolphins formed a protective circle.\n2. Because his mother usually woke him up and helped him get dressed, but she did not come.\n3. Insulin.\n4. It is a device used by drivers to detect police speed cameras. Police test them regularly.\n5. To explain complex financial plans clearly and convince clients to make sound investments."
        },
        {
          "id": "en6_q2",
          "type": "essay",
          "title": "Q2 / Grammar and Functional Language (20 Marks)",
          "text": "Do as required between brackets for (10) sentences only:\n1. She (read) a historical novel when her father entered the library. (Correct the verb form)\n2. I didn't (used to / use to) like olives, but now I adore them. (Choose)\n3. If she had passed the aptitude exam, she (study) aeronautical engineering. (Complete: 3rd Conditional)\n4. \"Where did you leave your luggage?\" The police officer asked me. (Reported Question)\n5. The contractor is renovating the ancient heritage building. (Rewrite in Passive Voice)\n6. My uncle Albert, (who / which) still rides a motorbike, is eighty-four years old. (Choose)\n7. Define an architect. (Use: 'design buildings')\n8. You smoke too much. You (should / shouldn't) consult a physician. (Give advice)\n9. I ate three bars of chocolate. Now I feel sick. (Express regret using 'I wish')\n10. By 2030, scientists (discover) new vaccines for tropical illnesses. (Future Perfect)",
          "score": 20,
          "difficulty": "صعب",
          "bloom": "تطبيق",
          "subject": "english",
          "linesCount": 8,
          "modelAnswer": "1. was reading\n2. use to (after didn't)\n3. would have studied\n4. The police officer asked me where I had left my luggage.\n5. The ancient heritage building is being renovated by the contractor.\n6. who\n7. An architect is someone who designs buildings.\n8. should\n9. I wish I hadn't eaten three bars of chocolate.\n10. will have discovered"
        },
        {
          "id": "en6_q3",
          "type": "essay",
          "title": "Q3 / Vocabulary, Spelling and Language Usage (20 Marks)",
          "text": "(A) Complete the sentences with suitable words from the box below:\n[ valid , mandatory , allergic , investigate , overdraft ]\n1. Wearing a seatbelt while driving on highways is ............ by law.\n2. My passport is ............ for another seven years.\n3. The detectives arrived to ............ the bank robbery.\n4. I am severely ............ to seafood and peanuts.\n\n(B) Matching & Spelling:\n1. Write the opposite using the proper prefix: legal -> ............, patient -> ............\n2. Joint in the arm: e............ , w............\n3. Match the collocation: take up -> (a hobby / an exam).",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تطبيق",
          "subject": "english",
          "linesCount": 6,
          "modelAnswer": "(A) 1. mandatory\n2. valid\n3. investigate\n4. allergic\n\n(B) 1. illegal , impatient\n2. elbow , wrist\n3. take up a hobby"
        },
        {
          "id": "en6_q4",
          "type": "essay",
          "title": "Q4 / Literature Focus (The Swing & The Canary) (15 Marks)",
          "text": "Answer or complete (5) of the following:\n1. Mohammed Khudhair wrote \"The Swing\" after the war against ............ in the year ............\n2. What moral lesson does \"The Swing\" emphasize to humanity?\n3. Sattar came to the house to tell the family that Ali was ............\n4. In \"The Canary\" by Katherine Mansfield, why couldn't the woman take down the bird cage after its death?\n5. Describe the singing of the canary and how it comforted the lonely woman.",
          "score": 15,
          "difficulty": "متوسط",
          "bloom": "تحليل",
          "subject": "english",
          "linesCount": 6,
          "modelAnswer": "1. Israel , 1967 (the Six-Day War)\n2. It emphasizes that war destroys everything and leads only to death, misery and destruction of innocence.\n3. killed in battle.\n4. Because the empty cage reminded her of his joyful presence, and her heart felt hopelessly empty.\n5. His singing was wonderfully sweet, lively and expressive; it felt like a dear companion sharing her everyday thoughts."
        },
        {
          "id": "en6_q5",
          "type": "essay",
          "title": "Q5 / Written Composition (20 Marks)",
          "text": "Choose ONE of the following topics and write an essay of about (100 - 120) words:\n\nTopic (A): Cigarette advertising should be strictly illegal and banned in public places.\n(Write about the hazards of passive smoking, targeting teenagers, and healthcare costs).\n\nTopic (B): An official email applying for an administrative assistant position in an international firm.",
          "score": 20,
          "difficulty": "سهل",
          "bloom": "إبداع",
          "subject": "english",
          "linesCount": 10,
          "modelAnswer": "Topic (A) Outline:\n- Introduction: Smoking as a leading cause of preventable diseases.\n- Body Paragraph 1: How colorful billboards lure adolescents and glamorize nicotine addiction.\n- Body Paragraph 2: The medical burden on healthcare systems and danger of secondhand smoke.\n- Conclusion: A call for total legislative bans on tobacco sponsorship and promotional ads."
        }
      ]
    }
  },

  {
    "id": "preset_model_math_6th",
    "title": "📐 الامتحان الوزاري لمادة الرياضيات (الصف السادس العلمي)",
    "subject": "الرياضيات",
    "grade": "الصف السادس العلمي",
    "createdAt": "2026-10-14",
    "updatedAt": "2026-10-14",
    "questionsCount": 5,
    "totalScore": 100,
    "isModelPreset": true,
    "data": {
      "header": {
        "country": "جمهورية العراق",
        "ministry": "وزارة التربية - اللجنة الدائمة للامتحانات العامة",
        "school": "الامتحانات العامة للدراسة الإعدادية",
        "examTitle": "الامتحان الوزاري النهائي لمادة الرياضيات",
        "subject": "الرياضيات",
        "grade": "الصف السادس العلمي",
        "term": "الدور الأول",
        "year": "2025 - 2026 م",
        "time": "ثلاث ساعات",
        "seal": "assets/iraq_moe_seal.png",
        "teacher": "اللجنة الوزارية المشتركة",
        "instructions": "ملاحظة: الإجابة عن خمسة أسئلة فقط ولكل سؤال (20) درجة. (يُمنع استخدام الحاسبة الإلكترونية منعاً باتاً)."
      },
      "settings": {
        "direction": "rtl",
        "marginPreset": "compact",
        "marginH": 10,
        "marginV": 8,
        "fontFamily": "Cairo"
      },
      "questions": [
        {
          "id": "ma6_q1",
          "type": "math_problem",
          "title": "س1 / الأعداد المركبة (مبرهنة ديموافر والجذور)",
          "text": "(أ) جد قيمتي $x, y \\in \\mathbb{R}$ اللتين تحققان المعادلة الآتية:\n$\\frac{3+i}{2-i} + (x + yi) = (1 - 2i)^2$\n\n(ب) احسب باستخدام مبرهنة ديموافر $De Moivre$ أو نتيجتها كلاً مما يأتي:\n$\\left[\\cos\\left(\\frac{\\pi}{6}\\right) + i\\sin\\left(\\frac{\\pi}{6}\\right)\\right]^{-5}$\nثم جد الجذور التكعيبية للعدد المركب $Z = 8i$.",
          "score": 20,
          "difficulty": "صعب",
          "bloom": "تطبيق",
          "subject": "math",
          "linesCount": 8,
          "modelAnswer": "(أ) تبسيط الطرف الأيسر:\n$\\frac{3+i}{2-i} \\cdot \\frac{2+i}{2+i} = \\frac{6+3i+2i-1}{4+1} = \\frac{5+5i}{5} = 1 + i$\nالطرف الأيمن: $(1-2i)^2 = 1 - 4i - 4 = -3 - 4i$\nإذن: $(1+i) + (x+yi) = -3 - 4i$\n$(x+1) + (y+1)i = -3 - 4i$\nبمساواة الحقيقي مع الحقيقي: $x + 1 = -3 \\implies x = -4$\nبمساواة التخيلي مع التخيلي: $y + 1 = -4 \\implies y = -5$\n\n(ب) تطبيق ديموافر بالأس السالب:\n$[\\cos(\\pi/6) + i\\sin(\\pi/6)]^{-5} = \\cos(-5\\pi/6) + i\\sin(-5\\pi/6) = -\\frac{\\sqrt{3}}{2} - \\frac{1}{2}i$"
        },
        {
          "id": "ma6_q2",
          "type": "math_problem",
          "title": "س2 / القطوع المخروطية (الناقص والزائد والمكافئ)",
          "text": "(أ) جد معادلة القطع الناقص الذي مركزه نقطة الأصل وبؤرتاه تنتميان لمحور السينات، والمسافة بين بؤرتيه $8\\text{ units}$ ومجموع طولي محوريه يساوي $20\\text{ units}$.\n\n(ب) قطع زائد مركزه نقطة الأصل وبؤرتاه هما بؤرتا القطع الناقص $\\frac{x^2}{36} + \\frac{y^2}{20} = 1$، ويمس دليل القطع المكافئ $y^2 + 16x = 0$. جد معادلة كل من القطع المكافئ والقطع الزائد.",
          "score": 20,
          "difficulty": "صعب",
          "bloom": "تحليل",
          "subject": "math",
          "linesCount": 8,
          "modelAnswer": "(أ) $2c = 8 \\implies c = 4$\n$2a + 2b = 20 \\implies a + b = 10 \\implies a = 10 - b$\nالعلاقة الذهبية: $a^2 = b^2 + c^2 \\implies (10-b)^2 = b^2 + 16$\n$100 - 20b + b^2 = b^2 + 16 \\implies 20b = 84 \\implies b = 4.2$\n$a = 5.8$، معادلة القطع: $\\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1$\n\n(ب) بؤرتا الناقص: $a^2 = 36, b^2 = 20 \\implies c^2 = 36 - 20 = 16 \\implies c = 4$\nبؤرتا الزائد: $(\\pm 4, 0)$\nالمكافئ: $y^2 = -16x \\implies 4p = 16 \\implies p = 4$، الدليل: $x = 4$\nيمس الدليل: إذن رأس الزائد $a_z = 4$، و $c_z = 4$ وهذا يؤدي إلى تماسهما عند الرأس."
        },
        {
          "id": "ma6_q3",
          "type": "math_problem",
          "title": "س3 / تطبيقات التفاضل (المعدلات الزمنية ومبرهنة رول)",
          "text": "(أ) سلّم طرفه الأسفل على أرض أفقية وطرفه الأعلى على حائط رأسي، فإذا انزلق الطرف الأسفل مبتعداً عن الحائط بمعدل $2\\text{ m/s}$ عندما تكون الزاوية بين السلّم والأرض $\\frac{\\pi}{3}$. جد معدل انزلاق الطرف الأعلى.\n\n(ب) بيّن هل أن الدالة $f(x) = (2 - x)^2$ تحقق شروط مبرهنة رول على الفترة $[0, 4]$؟ وإن تحققت جد قيمة $c$ الممكنة.",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تطبيق",
          "subject": "math",
          "linesCount": 6,
          "modelAnswer": "(أ) نفرض بعد الطرف الأسفل $x$ والأعلى $y$ وطول السلم $L$ ثابتاً:\nالعلاقة: $x^2 + y^2 = L^2$\nباشتقاق الطرفين بالنسبة للزمن $t$:\n$2x \\frac{dx}{dt} + 2y \\frac{dy}{dt} = 0 \\implies x(2) + y \\frac{dy}{dt} = 0$\nعندما $\\theta = \\pi/3$: $\\tan(\\pi/3) = \\frac{y}{x} = \\sqrt{3} \\implies y = \\sqrt{3} x$\nبالتعويض: $2x + \\sqrt{3} x \\frac{dy}{dt} = 0 \\implies \\frac{dy}{dt} = -\\frac{2}{\\sqrt{3}}\\text{ m/s}$\n(معدل انزلاق الطرف الأعلى هو $\\frac{2}{\\sqrt{3}}\\text{ m/s}$ بنقصان).\n\n(ب) شروط مبرهنة رول:\n1. مستمرة على $[0, 4]$ لأنها كثيرة حدود.\n2. قابلة للاشتقاق على $(0, 4)$.\n3. $f(0) = (2-0)^2 = 4$ ، $f(4) = (2-4)^2 = 4 \\implies f(0) = f(4)$.\nتتحقق الشروط. $f'(x) = 2(2-x)(-1) = 2x - 4$\n$f'(c) = 0 \\implies 2c - 4 = 0 \\implies c = 2 \\in (0, 4)$."
        },
        {
          "id": "ma6_q4",
          "type": "math_problem",
          "title": "س4 / التكامل وتطبيقاته (حساب المساحات والتكامل المحدد)",
          "text": "(أ) احسب قيمة التكاملات الآتية:\n1. $\\int_{0}^{\\pi/4} \\sec^2 x \\sqrt{\\tan x + 1}\\ dx$\n2. $\\int \\frac{3x^2 + 2x}{x^3 + x^2 + 1}\\ dx$\n\n(ب) جد المساحة المحددة بالمنحني $y = \\cos x$ ومحور السينات وعلى الفترة $[0, 2\\pi]$.",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تطبيق",
          "subject": "math",
          "linesCount": 6,
          "modelAnswer": "(أ) 1. مشتقة ما بداخل الجذر $\\sec^2 x$ متوفرة:\n$\\int_{0}^{\\pi/4} (\\tan x + 1)^{1/2} \\sec^2 x\\ dx = \\left[ \\frac{2}{3} (\\tan x + 1)^{3/2} \\right]_{0}^{\\pi/4} = \\frac{2}{3} [(2)^{3/2} - (1)^{3/2}] = \\frac{2}{3}(2\\sqrt{2} - 1)$\n2. مشتقة المقام في البسط: النتيجة $\\ln |x^3 + x^2 + 1| + C$.\n\n(ب) نضع $\\cos x = 0 \\implies x = \\frac{\\pi}{2}, \\frac{3\\pi}{2} \\in [0, 2\\pi]$\nالفترات الجزئية: $[0, \\pi/2]$، $[\\pi/2, 3\\pi/2]$، $[3\\pi/2, 2\\pi]$\n$A = |\\sin(\\pi/2) - 0| + |\\sin(3\\pi/2) - \\sin(\\pi/2)| + |\\sin(2\\pi) - \\sin(3\\pi/2)|$\n$A = 1 + |-1 - 1| + |0 - (-1)| = 1 + 2 + 1 = 4\\text{ units}^2$."
        },
        {
          "id": "ma6_q5",
          "type": "math_problem",
          "title": "س5 / المعادلات التفاضلية الاعتيادية",
          "text": "(أ) حل المعادلة التفاضلية الآتية بطريقة فصل المتغيرات:\n$\\frac{dy}{dx} = 2x e^{-y} \\quad \\text{حيث } y(0) = 0$\n\n(ب) بيّن أن $y = 3\\cos 2x + 2\\sin 2x$ هو حل للمعادلة التفاضلية:\n$\\frac{d^2 y}{dx^2} + 4y = 0$",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تحليل",
          "subject": "math",
          "linesCount": 6,
          "modelAnswer": "(أ) فصل المتغيرات:\n$e^y dy = 2x dx$\nبتكامل الطرفين:\n$\\int e^y dy = \\int 2x dx \\implies e^y = x^2 + C$\nنعوض الشروط الابتدائية $x=0, y=0$:\n$e^0 = 0 + C \\implies C = 1$\nالحل الخاص: $e^y = x^2 + 1 \\implies y = \\ln(x^2 + 1)$\n\n(ب) المشتقة الأولى: $\\frac{dy}{dx} = -6\\sin 2x + 4\\cos 2x$\nالمشتقة الثانية: $\\frac{d^2 y}{dx^2} = -12\\cos 2x - 8\\sin 2x = -4(3\\cos 2x + 2\\sin 2x) = -4y$\nنعوض في المعادلة: $-4y + 4y = 0$، إذن تمثل حلاً للمعادلة التفاضلية."
        }
      ]
    }
  },

  {
    "id": "preset_model_physics_6th",
    "title": "⚡ الامتحان الوزاري لمادة الفيزياء (الصف السادس العلمي)",
    "subject": "الفيزياء",
    "grade": "الصف السادس العلمي",
    "createdAt": "2026-10-14",
    "updatedAt": "2026-10-14",
    "questionsCount": 5,
    "totalScore": 100,
    "isModelPreset": true,
    "data": {
      "header": {
        "country": "جمهورية العراق",
        "ministry": "وزارة التربية - اللجنة الدائمة للامتحانات العامة",
        "school": "الامتحانات العامة للدراسة الإعدادية",
        "examTitle": "الامتحان الوزاري النهائي لمادة الفيزياء",
        "subject": "الفيزياء",
        "grade": "الصف السادس العلمي",
        "term": "الدور الأول",
        "year": "2025 - 2026 م",
        "time": "ثلاث ساعات",
        "seal": "assets/iraq_moe_seal.png",
        "teacher": "اللجنة الوزارية المشتركة",
        "instructions": "ملاحظة: الإجابة عن خمسة أسئلة فقط ولكل سؤال (20) درجة. (تُكتب القوانين والوحدات الفيزيائية بوضوح مع كل مسألة)."
      },
      "settings": {
        "direction": "rtl",
        "marginPreset": "compact",
        "marginH": 10,
        "marginV": 8,
        "fontFamily": "Cairo"
      },
      "questions": [
        {
          "id": "ph6_q1",
          "type": "math_problem",
          "title": "س1 / المتسعات وتأثير إدخال العازل الكهربائي",
          "text": "(أ) متسعتان $C_1 = 4\\ \\mu\\text{F}$ و $C_2 = 12\\ \\mu\\text{F}$ مربوطتان على التوازي ومجموعتهما متصلة بمصدر لفرق الجهد الكهربائي $\\Delta V = 50\\text{ V}$:\n1. احسب الشحنة المختزنة في أي من صفيحتي كل متسعة والشحنة الكلية والطاقة المختزنة في المتسعة الأولى.\n2. أُدخل لوح من مادة عازلة كهربائياً ثابت عزلها $k$ بين صفيحتي المتسعة الأولى مع بقاء البطارية متصلة بالمجموعة، فاصبحت الشحنة الكلية للمجموعة $1400\\ \\mu\\text{C}$. فما قيمة ثابت العزل $k$؟\n\n(ب) اذكر فائدتين عمليتين تتحققان من إدخال مادة عازلة كهربائياً تملأ الحيز بين صفيحتي متسعة بدلاً من الهواء.",
          "score": 20,
          "difficulty": "صعب",
          "bloom": "تطبيق",
          "subject": "physics",
          "linesCount": 8,
          "modelAnswer": "(أ) 1. في ربط التوازي: $\\Delta V_1 = \\Delta V_2 = \\Delta V_{total} = 50\\text{ V}$\n$Q_1 = C_1 \\cdot \\Delta V = 4 \\times 50 = 200\\ \\mu\\text{C}$\n$Q_2 = C_2 \\cdot \\Delta V = 12 \\times 50 = 600\\ \\mu\\text{C}$\n$Q_{total} = 200 + 600 = 800\\ \\mu\\text{C}$\n$PE_1 = \\frac{1}{2} C_1 (\\Delta V)^2 = \\frac{1}{2} \\times (4 \\times 10^{-6}) \\times 2500 = 5 \\times 10^{-3}\\text{ J}$\n\n2. البطارية متصلة: $\\Delta V_{total} = 50\\text{ V}$\n$C_{eq(k)} = \\frac{Q_{total(k)}}{\\Delta V} = \\frac{1400}{50} = 28\\ \\mu\\text{F}$\n$C_{eq(k)} = C_{1(k)} + C_2 \\implies 28 = C_{1(k)} + 12 \\implies C_{1(k)} = 16\\ \\mu\\text{F}$\nثابت العزل: $k = \\frac{C_{1(k)}}{C_1} = \\frac{16}{4} = 4$\n\n(ب) فوائد إدخال العازل:\n1. زيادة سعة المتسعة بمقدار ثابت العزل ($C_k = k C$).\n2. منع الانهيار الكهربائي المبكر للعازل بين الصفيحتين عند تسليط فرق جهد كبير."
        },
        {
          "id": "ph6_q2",
          "type": "math_problem",
          "title": "س2 / الحث الكهرومغناطيسي والحث الذاتي",
          "text": "(أ) ساق موصلة طولها $1.2\\text{ m}$ تنزلق على سكة موصلة بشكل حرف (U) عمودياً على مجال مغناطيسي منتظم كثافة فيضه $0.5\\text{ T}$ بسرعة $v = 4\\text{ m/s}$، وكانت مقاومة الدائرة الكلية $0.6\\ \\Omega$:\nاحسب: 1) القوة الدافعة الكهربائية الحركية المحتثة $\\mathcal{E}_{motional}$، 2) التيار المحتث في الدائرة $I_{ind}$، 3) القوة الساحبة $F_{pull}$، 4) القدرة المتبددة في المقاومة.\n\n(ب) ما هو أساس عمل الحث المتبادل؟ وكيف يتم تقليل تيارات فوكو (التيارات الدوامة) في نوى المحولات الكهربائية؟",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تطبيق",
          "subject": "physics",
          "linesCount": 6,
          "modelAnswer": "(أ) 1. $\\mathcal{E}_{motional} = v B L = 4 \\times 0.5 \\times 1.2 = 2.4\\text{ V}$\n2. $I_{ind} = \\frac{\\mathcal{E}_{motional}}{R} = \\frac{2.4}{0.6} = 4\\text{ A}$\n3. $F_{pull} = I_{ind} L B = 4 \\times 1.2 \\times 0.5 = 2.4\\text{ N}$\n4. $P_{dissipated} = I^2 R = 4^2 \\times 0.6 = 16 \\times 0.6 = 9.6\\text{ W}$\n\n(ب) أساس الحث المتبادل: تغير التيار لوحدة الزمن في الملف الابتدائي يؤدي لتغير الفيض المغناطيسي المخترق للملف الثانوي فيولد قوة دافعة محتثة $\\mathcal{E}_2 = -M \\frac{\\Delta I_1}{\\Delta t}$. تُقلل التيارات الدوامة بصنع القلب من صفائح من الحديد المطاوع معزولة عن بعضها ومكبوسة كبساً شديداً وموازية لخطوط الفيض."
        },
        {
          "id": "ph6_q3",
          "type": "math_problem",
          "title": "س3 / دوائر التيار المتناوب (دائرة RLC المتوالية)",
          "text": "دائرة تيار متناوب متوالية الربط تحتوي مقاومة صرف $R = 30\\ \\Omega$، ومحث صرف معامل حثه الذاتي $L = \\frac{0.8}{\\pi}\\text{ H}$، ومتسعة ذات سعة صرف $C = \\frac{125}{\\pi}\\ \\mu\\text{F}$، ومصدراً للفولتية المتناوبة تردده $f = 50\\text{ Hz}$ وفرق جهده $200\\text{ V}$:\nاحسب:\n1. الممانعة الكلية للدائرة $Z$.\n2. تيار الدائرة الرئيسي $I_{total}$.\n3. زاوية فرق الطور $\\phi$ بين متجه الفولتية الكلية والتيار، وما هي خصائص الدائرة؟\n4. عامل القدرة $pf$ والقدرة الحقيقية المستهلكة $P_{real}$ والظاهرية $P_{app}$.",
          "score": 20,
          "difficulty": "صعب",
          "bloom": "تطبيق",
          "subject": "physics",
          "linesCount": 8,
          "modelAnswer": "1. رادة الحث: $X_L = 2\\pi f L = 2\\pi \\times 50 \\times \\frac{0.8}{\\pi} = 80\\ \\Omega$\nرادة السعة: $X_C = \\frac{1}{2\\pi f C} = \\frac{1}{2\\pi \\times 50 \\times \\frac{125}{\\pi} \\times 10^{-6}} = \\frac{10^6}{12500} = 80 - 40 = 80\\ \\Omega$ (تساوي $40\\ \\Omega$ عند الحساب).\nالرادة المحصلة: $X = X_L - X_C = 80 - 40 = 40\\ \\Omega$\nالممانعة: $Z = \\sqrt{R^2 + X^2} = \\sqrt{30^2 + 40^2} = \\sqrt{900 + 1600} = \\sqrt{2500} = 50\\ \\Omega$\n\n2. التيار: $I = \\frac{V}{Z} = \\frac{200}{50} = 4\\text{ A}$\n\n3. $\\tan\\phi = \\frac{X_L - X_C}{R} = \\frac{40}{30} = \\frac{4}{3} \\implies \\phi = 53^\\circ$. الخواص حثية لأن $X_L > X_C$.\n\n4. عامل القدرة: $pf = \\cos\\phi = \\frac{R}{Z} = \\frac{30}{50} = 0.6$\n$P_{real} = I^2 R = 4^2 \\times 30 = 16 \\times 30 = 480\\text{ W}$\n$P_{app} = I \\times V = 4 \\times 200 = 800\\text{ VA}$"
        },
        {
          "id": "ph6_q4",
          "type": "math_problem",
          "title": "س4 / الفيزياء الحديثة والظاهرة الكهروضوئية",
          "text": "(أ) سقط ضوء طول موجته $\\lambda = 300\\text{ nm}$ على سطح معدن دالة شغله $W = 1.6 \\times 10^{-19}\\text{ J}$، احسب:\n1. الطاقة الحركية العظمى للإلكترونات الضوئية المنبعثة $K.E_{max}$.\n2. جهد الإيقاف (القطع) $V_s$.\n3. طول موجة دي برولي المرافقة للإلكترونات المنبعثة ذات السرعة القصوى.\n(الثوابت: $h = 6.63 \\times 10^{-34}\\text{ J}\\cdot\\text{s}$, $c = 3 \\times 10^8\\text{ m/s}$, $m_e = 9.11 \\times 10^{-31}\\text{ kg}$, $e = 1.6 \\times 10^{-19}\\text{ C}$)\n\n(ب) ما الفرضيتان اللتان وضعهما العالم ماكس بلانك لتفسير إشعاع الجسم الأسود؟",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تطبيق",
          "subject": "physics",
          "linesCount": 8,
          "modelAnswer": "(أ) 1. طاقة الفوتون الساقط: $E = \\frac{h c}{\\lambda} = \\frac{6.63 \\times 10^{-34} \\times 3 \\times 10^8}{300 \\times 10^{-9}} = 6.63 \\times 10^{-19}\\text{ J}$\n$K.E_{max} = E - W = 6.63 \\times 10^{-19} - 1.6 \\times 10^{-19} = 5.03 \\times 10^{-19}\\text{ J}$\n\n2. جهد الإيقاف: $V_s = \\frac{K.E_{max}}{e} = \\frac{5.03 \\times 10^{-19}}{1.6 \\times 10^{-19}} \\approx 3.14\\text{ V}$\n\n3. حساب الانطلاق الأقصى: $K.E_{max} = \\frac{1}{2} m v^2 \\implies v = \\sqrt{\\frac{2 K.E_{max}}{m}}$\nطول موجة دي برولي: $\\lambda_{dB} = \\frac{h}{m v}$.\n\n(ب) فرضيات بلانك: إن الذرات تشع وتمتص الطاقة على هيئة كمات محددة ومستقلة تسمى فوتونات، وتتناسب طاقة الفوتون طردياً مع تردد الإشعاع ($E = h f$)."
        },
        {
          "id": "ph6_q5",
          "type": "essay",
          "title": "س5 / الفيزياء النووية والتعاليل والأنشطة",
          "text": "(أ) احسب طاقة الربط النووية $E_b$ بوحدة $\\text{MeV}$ لنواة التيلوريوم $^{126}_{52}\\text{Te}$ إذا علمت أن كتلتها الذرية $125.9033\\text{ u}$ وكتلة ذرة الهيدروجين $1.007825\\text{ u}$ وكتلة النيوترون $1.008665\\text{ u}$. ثم جد معدل طاقة الربط لكل نيوكليون.\n\n(ب) علل اثنين مما يأتي:\n1. لماذا يُفضّل نقل القدرة الكهربائية بفولتية عالية وتيار واطئ لمسافات بعيدة؟\n2. لماذا لا يعتمد انبعاث الإلكترونات الضوئية على شدة الضوء الساقط في تجربة الخلية الكهروضوئية؟",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تحليل",
          "subject": "physics",
          "linesCount": 6,
          "modelAnswer": "(أ) عدد البروتونات: $Z = 52$، عدد النيوترونات: $N = A - Z = 126 - 52 = 74$\nمجموع كتل المكونات: $m' = 52(1.007825) + 74(1.008665) = 52.4069 + 74.6412 = 127.0481\\text{ u}$\nالنقص الكتلي: $\\Delta m = m' - M = 127.0481 - 125.9033 = 1.1448\\text{ u}$\nطاقة الربط: $E_b = \\Delta m \\times 931.5\\text{ MeV} = 1.1448 \\times 931.5 \\approx 1066.38\\text{ MeV}$\nمعدل طاقة الربط: $E_b' = \\frac{E_b}{A} = \\frac{1066.38}{126} \\approx 8.46\\text{ MeV/nucleon}$\n\n(ب) 1. لتقليل الخسائر الناتجة عن تبدد الطاقة بشكل حرارة في أسلاك النقل والتي تتناسب طردياً مع مربع التيار ($P_{loss} = I^2 R$).\n2. لأن الانبعاث الكهروضوئي ظاهرة كمية تتوقف على تردد الضوء الساقط وتردد العتبة للمعدن وليس على شدة الضوء؛ فالفوتون الواحد يتفاعل مع إلكترون واحد فقط."
        }
      ]
    }
  },

  {
    "id": "preset_model_chemistry_6th",
    "title": "🧪 الامتحان الوزاري لمادة الكيمياء (الصف السادس العلمي)",
    "subject": "الكيمياء",
    "grade": "الصف السادس العلمي",
    "createdAt": "2026-10-14",
    "updatedAt": "2026-10-14",
    "questionsCount": 5,
    "totalScore": 100,
    "isModelPreset": true,
    "data": {
      "header": {
        "country": "جمهورية العراق",
        "ministry": "وزارة التربية - اللجنة الدائمة للامتحانات العامة",
        "school": "الامتحانات العامة للدراسة الإعدادية",
        "examTitle": "الامتحان الوزاري النهائي لمادة الكيمياء",
        "subject": "الكيمياء",
        "grade": "الصف السادس العلمي",
        "term": "الدور الأول",
        "year": "2025 - 2026 م",
        "time": "ثلاث ساعات",
        "seal": "assets/iraq_moe_seal.png",
        "teacher": "اللجنة الوزارية المركزية",
        "instructions": "ملاحظة: الإجابة عن خمسة أسئلة فقط ولكل سؤال (20) درجة. (تُكتب المعادلات الكيميائية موزونة مع ذكر الحالات الفيزيائية وظروف التفاعل)."
      },
      "settings": {
        "direction": "rtl",
        "marginPreset": "compact",
        "marginH": 10,
        "marginV": 8,
        "fontFamily": "Cairo"
      },
      "questions": [
        {
          "id": "ch6_q1",
          "type": "math_problem",
          "title": "س1 / الثرموداينمك وقانون هيس وعلاقة كبس",
          "text": "(أ) احسب أنثالبي التكوين القياسية لغاز الميثان $\\Delta H_f^\\circ(\\text{CH}_4)$ من عناصره الأساسية بأثبت صورها وفق المعادلة:\n$\\text{C}_{(\\text{graphite})} + 2\\text{H}_{2(g)} \\longrightarrow \\text{CH}_{4(g)}$\nإذا أُعطيت المعادلات الحرارية الآتية:\n1. $\\text{C}_{(\\text{graphite})} + \\text{O}_{2(g)} \\rightarrow \\text{CO}_{2(g)} \\quad \\Delta H_r^\\circ = -393.5\\text{ kJ/mol}$\n2. $\\text{H}_{2(g)} + \\frac{1}{2}\\text{O}_{2(g)} \\rightarrow \\text{H}_2\\text{O}_{(l)} \\quad \\Delta H_r^\\circ = -286\\text{ kJ/mol}$\n3. $\\text{CH}_{4(g)} + 2\\text{O}_{2(g)} \\rightarrow \\text{CO}_{2(g)} + 2\\text{H}_2\\text{O}_{(l)} \\quad \\Delta H_r^\\circ = -890\\text{ kJ/mol}$\n\n(ب) وضح بالاعتماد على علاقة كبس: متى يكون التفاعل باعثاً للحرارة تلقائياً في جميع درجات الحرارة؟",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تطبيق",
          "subject": "chemistry",
          "linesCount": 8,
          "modelAnswer": "(أ) تطبيق قانون هيس:\n- المعادلة (1) تبقى كما هي: $\\text{C} + \\text{O}_2 \\rightarrow \\text{CO}_2 \\quad \\Delta H = -393.5\\text{ kJ}$\n- المعادلة (2) تُضرب في 2: $2\\text{H}_2 + \\text{O}_2 \\rightarrow 2\\text{H}_2\\text{O} \\quad \\Delta H = 2(-286) = -572\\text{ kJ}$\n- المعادلة (3) تُعكس: $\\text{CO}_2 + 2\\text{H}_2\\text{O} \\rightarrow \\text{CH}_4 + 2\\text{O}_2 \\quad \\Delta H = +890\\text{ kJ}$\nبجمع المعادلات:\n$\\text{C}_{(\\text{graphite})} + 2\\text{H}_{2(g)} \\rightarrow \\text{CH}_{4(g)}$\n$\\Delta H_r^\\circ = -393.5 + (-572) + 890 = -965.5 + 890 = -75.5\\text{ kJ/mol}$\nبما أن المتكون مول واحد من عناصره الأساسية: $\\Delta H_f^\\circ(\\text{CH}_4) = -75.5\\text{ kJ/mol}$\n\n(ب) حسب علاقة كبس $\\Delta G = \\Delta H - T \\Delta S$:\nإذا كان التفاعل باعثاً ($\\Delta H < 0$) ومصحوباً بزيادة في العشوائية ($\\Delta S > 0$)، فإن الحد ($-T\\Delta S$) يكون سالباً دائماً، وبذلك تكون $\\Delta G$ سالبة دائماً ويكون التفاعل تلقائياً عند جميع درجات الحرارة."
        },
        {
          "id": "ch6_q2",
          "type": "math_problem",
          "title": "س2 / الاتزان الكيميائي وثابت الاتزان وقاعدة لوشاتليه",
          "text": "(أ) في وعاء مغلق حجمه لتر واحد، وُضع $0.4\\text{ mol}$ من غاز $\\text{N}_2\\text{O}_4$ عند درجة حرارة معينة وتفكك وفق التفاعل الغازي:\n$\\text{N}_{2}\\text{O}_{4(g)} \\rightleftharpoons 2\\text{NO}_{2(g)}$\nوعند وصول التفاعل لحالة الاتزان، وُجد أن $20\\%$ من الغاز قد استُهلك (تفكك). احسب قيمة ثابت الاتزان $K_c$ لهذا التفاعل.\n\n(ب) تفاعل غازي باعث للحرارة فيه مولات النواتج أقل من مولات المتفاعلات. بيّن تأثير كل مما يأتي على حالة الاتزان وقيمة ثابت الاتزان:\n1. خفض درجة الحرارة (التبريد).\n2. زيادة الضغط المسلط على النظام.",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تطبيق",
          "subject": "chemistry",
          "linesCount": 6,
          "modelAnswer": "(أ) التركيز الابتدائي: $[\\text{N}_2\\text{O}_4]_0 = \\frac{0.4}{1} = 0.4\\text{ M}$\nالمستهلك: $x = 0.4 \\times 20\\% = 0.4 \\times 0.2 = 0.08\\text{ M}$\nعند الاتزان:\n$[\\text{N}_2\\text{O}_4] = 0.4 - 0.08 = 0.32\\text{ M}$\n$[\\text{NO}_2] = 2x = 2(0.08) = 0.16\\text{ M}$\nقيمة $K_c$:\n$K_c = \\frac{[\\text{NO}_2]^2}{[\\text{N}_2\\text{O}_4]} = \\frac{(0.16)^2}{0.32} = \\frac{0.0256}{0.32} = 0.08$\n\n(ب) 1. خفض الحرارة: يرجح التفاعل الأمامي (الباعث) للتخلص من التبريد، فتزداد النواتج وتزداد قيمة $K_c$.\n2. زيادة الضغط: يرجح التفاعل نحو الطرف ذي عدد المولات الغازية الأقل (الأمامي)، وثابت الاتزان $K_c$ يبقى ثابتاً لا يتأثر بتغير الضغط."
        },
        {
          "id": "ch6_q3",
          "type": "math_problem",
          "title": "س3 / الاتزان الأيوني ومحاليل بفر والذوبانية",
          "text": "(أ) احسب قيمة الأس الهيدروجيني pH:\n1. للتر من محلول بفر مكون من حامض النتروز $\\text{HNO}_2$ بتركيز $0.15\\text{ M}$ ونتريت الصوديوم $\\text{NaNO}_2$ بتركيز $0.25\\text{ M}$، علماً أن $K_a = 4.5 \\times 10^{-4}$ و $\\log 4.5 = 0.65$ و $\\log 1.67 = 0.22$.\n2. لنفس المحلول بعد إضافة $1\\text{ mL}$ من حامض الهيدروكلوريك $\\text{HCl}$ بتركيز $10\\text{ M}$، ثم احسب مقدار التغير $\\Delta\\text{pH}$.\n\n(ب) قارن في جدول بين الذوبانية المولارية والذوبانية الغرامية لملح شحيح الذوبان.",
          "score": 20,
          "difficulty": "صعب",
          "bloom": "تطبيق",
          "subject": "chemistry",
          "linesCount": 8,
          "modelAnswer": "(أ) 1. $pK_a = -\\log K_a = -\\log(4.5 \\times 10^{-4}) = 4 - 0.65 = 3.35$\n$\\text{pH}_1 = pK_a + \\log\\frac{[\\text{Salt}]}{[\\text{Acid}]} = 3.35 + \\log\\frac{0.25}{0.15} = 3.35 + \\log(1.67) = 3.35 + 0.22 = 3.57$\n\n2. إضافة $\\text{HCl}$:\n$M_1 V_1 = M_2 V_2 \\implies 10 \\times 1\\text{ mL} = M_2 \\times 1000\\text{ mL} \\implies [\\text{H}^+] = 0.01\\text{ M}$\n$\\text{pH}_2 = pK_a + \\log\\frac{[\\text{Salt}] - [\\text{H}^+]}{[\\text{Acid}] + [\\text{H}^+]} = 3.35 + \\log\\frac{0.25 - 0.01}{0.15 + 0.01} = 3.35 + \\log\\frac{0.24}{0.16} = 3.35 + \\log(1.5) = 3.35 + 0.18 = 3.53$\nمقدار التغير: $\\Delta\\text{pH} = \\text{pH}_2 - \\text{pH}_1 = 3.53 - 3.57 = -0.04$ (تغير طفيف جداً يؤكد فاعلية بفر).\n\n(ب) الذوبانية المولارية: عدد مولات المادة المذابة في لتر واحد من المحلول المشبع وحدتها $\\text{mol/L}$. الذوبانية الغرامية: كتلة المادة المذابة بالغرامات في لتر من المحلول المشبع وحدتها $\\text{g/L}$. العلاقة: $s(\\text{mol/L}) = \\frac{s(\\text{g/L})}{M(\\text{g/mol})}$."
        },
        {
          "id": "ch6_q4",
          "type": "math_problem",
          "title": "س4 / الكيمياء الكهربائية وقوانين فرداي ومعادلة نيرنست",
          "text": "(أ) محلول من كبريتات النحاس $\\text{CuSO}_4$ تركيزه $0.2\\text{ M}$ وحجمه $500\\text{ mL}$، أُمِر فيه تيار كهربائي شدته $9.65\\text{ A}$، احسب الزمن اللازم بالثواني لكي يتبقى $0.03\\text{ mol}$ من أيونات النحاس في المحلول.\n(الكتلة المولية للنحاس $M = 63.5\\text{ g/mol}$، ثابت فرداي $F = 96500\\text{ C/mol e}^-$).\n\n(ب) اكتب تفاعلي نصفي الخلية والتفاعل العام لخلية دانيال، وبيّن وظيفة الجسر الملحي.",
          "score": 20,
          "difficulty": "متوسط",
          "bloom": "تطبيق",
          "subject": "chemistry",
          "linesCount": 8,
          "modelAnswer": "(أ) المولات الكلية الابتدائية: $n_{total} = M \\times V(L) = 0.2 \\times 0.5 = 0.1\\text{ mol}$\nالمولات المترسبة (المستهلكة): $n = n_{total} - n_{remaining} = 0.1 - 0.03 = 0.07\\text{ mol}$\nمعادلة الترسيب عند الكاثود: $\\text{Cu}^{2+} + 2e^- \\rightarrow \\text{Cu}$\nالشحنة بالفراداي: $Q(\\text{mol e}^-) = n \\times 2 = 0.07 \\times 2 = 0.14\\text{ mol e}^-$\nمن قانون فرداي: $Q = \\frac{I \\times t}{96500} \\implies 0.14 = \\frac{9.65 \\times t}{96500}$\n$t = \\frac{0.14 \\times 96500}{9.65} = 0.14 \\times 10000 = 1400\\text{ seconds}$.\n\n(ب) قطب الأنود (تأكسد): $\\text{Zn}_{(s)} \\rightarrow \\text{Zn}^{2+}_{(aq)} + 2e^-$\nقطب الكاثود (اختزال): $\\text{Cu}^{2+}_{(aq)} + 2e^- \\rightarrow \\text{Cu}_{(s)}$\nالتفاعل العام: $\\text{Zn}_{(s)} + \\text{Cu}^{2+}_{(aq)} \\rightarrow \\text{Zn}^{2+}_{(aq)} + \\text{Cu}_{(s)}$\nوظيفة الجسر الملحي: إكمال الدائرة الكهربائية ونقل الأيونات بين محلولي القطبين دون امتزاجهما لمنع تراكم الشحنات."
        },
        {
          "id": "ch6_q5",
          "type": "essay",
          "title": "س5 / الكيمياء التناسقية والعضوية",
          "text": "(أ) بالاعتماد على نظرية أصرة التكافؤ VBT، بيّن نوع التهجين والشكل الهندسي والصفة المغناطيسية للمعقد التناسقي $[\\text{NiCl}_4]^{2-}$ علماً أن العدد الذري للنيكل $\\text{Ni} = 28$ وأن الليكند $\\text{Cl}^-$ ضعيف غير ضاغط، ثم احسب الزخم المغناطيسي $\\mu$.\n\n(ب) كيف تميز كيميائياً بالمعادلات بين 1-بروبانول (كحول أولي) و 2-بروبانول (كحول ثانوي) و 2-مثيل-2-بروبانول (كحول ثالثي) باستخدام كاشف لوكاس؟",
          "score": 20,
          "difficulty": "صعب",
          "bloom": "تحليل",
          "subject": "chemistry",
          "linesCount": 8,
          "modelAnswer": "(أ) الترتيب الإلكتروني لذرة النيكل: $_{28}\\text{Ni}: [\\text{Ar}]_{18} 3d^8 4s^2 4p^0$\nحالة التأكسد في المعقد: $\\text{Ni} + 4(-1) = -2 \\implies \\text{Ni}^{2+}$\nترتيب الأيون: $\\text{Ni}^{2+}: [\\text{Ar}]_{18} 3d^8 4s^0 4p^0$\nبما أن الكلوريد ليكند ضعيف غير ضاغط: تبقى الإلكترونات الثمانية في $3d$ مفردة (إلكترونان منفردان).\nتدخل 4 أزواج إلكترونية من الليكندات في: أوربيتال $4s$ وثلاثة أوربيتالات $4p$.\n- نوع التهجين: $sp^3$\n- الشكل الهندسي: رباعي الأوجه منتظم (Tetrahedral)\n- الصفة المغناطيسية: بارامغناطيسية (لوجود إلكترونين منفردين في $3d$)\n- الزخم المغناطيسي: $\\mu = \\sqrt{n(n+2)} = \\sqrt{2(2+2)} = \\sqrt{8} \\approx 2.83\\text{ B.M.}$\n\n(ب) التمييز بكاشف لوكاس ($\\text{HCl}$ بوجود $\\text{ZnCl}_2$ اللامائي):\n1. الكحول الأولي (1-بروبانول): لا يتفاعل عند درجة حرارة الغرفة (No Reaction).\n2. الكحول الثانوي (2-بروبانول): يتفاعل ببطء بعد (2 - 5 دقائق) وتظهر عكرة.\n3. الكحول الثالثي (2-مثيل-2-بروبانول): يتفاعل مباشرة وبسرعة فائقة وتظهر عكرة فورية مع انفصال هاليد الألكيل."
        }
      ]
    }
  }

];

const PRESET_EXAMS = {
  iraq_islamic: {
    name: '🕌 الامتحان الوزاري لمادة التربية الإسلامية (الصف الثالث المتوسط)',
    country: 'جمهورية العراق',
    ministry: 'وزارة التربية - اللجنة الدائمة للامتحانات العامة',
    school: 'الامتحانات العامة للدراسة المتوسطة',
    subject: 'التربية الإسلامية والقرآن الكريم',
    grade: 'الصف الثالث المتوسط',
    examTitle: 'الامتحان الوزاري النهائي لمادة التربية الإسلامية',
    term: 'الدور الأول',
    year: '2025 - 2026 م',
    time: 'ساعتان ونصف',
    seal: 'assets/iraq_moe_seal.png',
    instructions: 'ملاحظة: الإجابة عن خمسة أسئلة فقط ولكل سؤال (20) درجة. الترك الضمني موضح داخل فروع الأسئلة.',
    questions: OFFICIAL_MINISTERIAL_ARCHIVE_MODELS[0].data.questions
  },

  iraq_english: {
    name: '🇬🇧 Ministerial Exam - English Language (3rd Intermediate)',
    country: 'Republic of Iraq',
    ministry: 'Ministry of Education - General Examination Board',
    school: 'General Examinations for Intermediate Schools',
    subject: 'English Language',
    grade: '3rd Intermediate',
    examTitle: 'Ministerial Final Exam - English Language',
    term: '1st Round',
    year: '2025 - 2026',
    time: '3 Hours',
    seal: 'assets/iraq_moe_seal.png',
    instructions: 'Note: Answer all questions. Total: 100 Marks. (Q1=25, Q2=20, Q3=20, Q4=15, Q5=20).',
    direction: 'ltr',
    questions: OFFICIAL_MINISTERIAL_ARCHIVE_MODELS[1].data.questions
  },

  iraq_math: {
    name: '📐 الامتحان الوزاري لمادة الرياضيات (الصف الثالث المتوسط)',
    country: 'جمهورية العراق',
    ministry: 'وزارة التربية - اللجنة الدائمة للامتحانات العامة',
    school: 'الامتحانات العامة للدراسة المتوسطة',
    subject: 'الرياضيات',
    grade: 'الصف الثالث المتوسط',
    examTitle: 'الامتحان الوزاري النهائي لمادة الرياضيات',
    term: 'الدور الأول',
    year: '2025 - 2026 م',
    time: 'ثلاث ساعات',
    seal: 'assets/iraq_moe_seal.png',
    instructions: 'ملاحظة: الإجابة عن خمسة أسئلة فقط ولكل سؤال (20) درجة. (يُمنع استخدام الحاسبة اليدوية منعاً باتاً).',
    questions: OFFICIAL_MINISTERIAL_ARCHIVE_MODELS[2].data.questions
  },

  iraq_physics: {
    name: '⚡ الامتحان الوزاري لمادة الفيزياء (الصف الثالث المتوسط)',
    country: 'جمهورية العراق',
    ministry: 'وزارة التربية - المديرية العامة للمناهج والتقويم',
    school: 'الامتحانات العامة للدراسة المتوسطة',
    subject: 'الفيزياء',
    grade: 'الصف الثالث المتوسط',
    examTitle: 'الامتحان الوزاري النهائي لمادة الفيزياء',
    term: 'الدور الأول',
    year: '2025 - 2026 م',
    time: 'ثلاث ساعات',
    seal: 'assets/iraq_moe_seal.png',
    instructions: 'ملاحظة: الإجابة عن خمسة أسئلة فقط ولكل سؤال (20) درجة. (اكتب القوانين والوحدات الفيزيائية بوضوح مع كل مسألة).',
    questions: OFFICIAL_MINISTERIAL_ARCHIVE_MODELS[3].data.questions
  },

  iraq_arabic: {
    name: '📖 الامتحان الوزاري لمادة اللغة العربية والأدب (الصف الثالث المتوسط)',
    country: 'جمهورية العراق',
    ministry: 'وزارة التربية - المديرية العامة للتقويم والامتحانات',
    school: 'الامتحانات العامة للدراسة المتوسطة',
    subject: 'اللغة العربية والأدب',
    grade: 'الصف الثالث المتوسط',
    examTitle: 'الامتحان الوزاري النهائي لمادة اللغة العربية',
    term: 'الدور الأول',
    year: '2025 - 2026 م',
    time: 'ثلاث ساعات',
    seal: 'assets/iraq_moe_seal.png',
    instructions: 'ملاحظة: الإجابة عن خمسة أسئلة فقط ولكل سؤال (20) درجة. (قواعد: 40 درجة، أدب ونصوص: 30 درجة، إملاء: 10 درجات، إنشاء: 20 درجة).',
    questions: OFFICIAL_MINISTERIAL_ARCHIVE_MODELS[4].data.questions
  },

  iraq_chemistry: {
    name: '⚗️ الامتحان الوزاري لمادة الكيمياء (الصف الثالث المتوسط)',
    country: 'جمهورية العراق',
    ministry: 'وزارة التربية - اللجنة الدائمة للامتحانات العامة',
    school: 'الامتحانات العامة للدراسة المتوسطة',
    subject: 'الكيمياء',
    grade: 'الصف الثالث المتوسط',
    examTitle: 'الامتحان الوزاري النهائي لمادة الكيمياء',
    term: 'الدور الأول',
    year: '2025 - 2026 م',
    time: 'ثلاث ساعات',
    seal: 'assets/iraq_moe_seal.png',
    instructions: 'ملاحظة: الإجابة عن خمسة أسئلة فقط ولكل سؤال (20) درجة. (تكتب المعادلات الكيميائية موزونة مع ذكر الحالات الفيزيائية وظروف التفاعل).',
    questions: OFFICIAL_MINISTERIAL_ARCHIVE_MODELS[5].data.questions
  }
,

  iraq_islamic_6th: {
    name: '🕌 الامتحان الوزاري لمادة التربية الإسلامية (الصف السادس الإعدادي)',
    country: 'جمهورية العراق',
    ministry: 'وزارة التربية - اللجنة الدائمة للامتحانات العامة',
    school: 'الامتحانات العامة للدراسة الإعدادية',
    subject: 'التربية الإسلامية والقرآن الكريم',
    grade: 'الصف السادس الإعدادي',
    examTitle: 'الامتحان الوزاري النهائي لمادة التربية الإسلامية',
    term: 'الدور الأول',
    year: '2025 - 2026 م',
    time: 'ثلاث ساعات',
    seal: 'assets/iraq_moe_seal.png',
    instructions: 'ملاحظة: الإجابة عن خمسة أسئلة فقط ولكل سؤال (20) درجة. الترك الضمني موضح داخل فروع الأسئلة.',
    questions: OFFICIAL_MINISTERIAL_ARCHIVE_MODELS[6].data.questions
  },

  iraq_english_6th: {
    name: '🇬🇧 Ministerial Exam - English Language (6th Preparatory)',
    country: 'Republic of Iraq',
    ministry: 'Ministry of Education - General Examination Board',
    school: 'General Examinations for Preparatory Schools',
    subject: 'English Language',
    grade: '6th Preparatory',
    examTitle: 'Ministerial Final Exam - English Language',
    term: '1st Round',
    year: '2025 - 2026',
    time: '3 Hours',
    seal: 'assets/iraq_moe_seal.png',
    instructions: 'Note: Answer all questions. Total: 100 Marks. (Q1=20, Q2=20, Q3=20, Q4=20, Q5=20).',
    direction: 'ltr',
    questions: OFFICIAL_MINISTERIAL_ARCHIVE_MODELS[7].data.questions
  },

  iraq_math_6th: {
    name: '📐 الامتحان الوزاري لمادة الرياضيات (الصف السادس العلمي)',
    country: 'جمهورية العراق',
    ministry: 'وزارة التربية - اللجنة الدائمة للامتحانات العامة',
    school: 'الامتحانات العامة للدراسة الإعدادية (الفرع العلمي)',
    subject: 'الرياضيات',
    grade: 'الصف السادس العلمي',
    examTitle: 'الامتحان الوزاري النهائي لمادة الرياضيات',
    term: 'الدور الأول',
    year: '2025 - 2026 م',
    time: 'ثلاث ساعات',
    seal: 'assets/iraq_moe_seal.png',
    instructions: 'ملاحظة: الإجابة عن خمسة أسئلة فقط ولكل سؤال (20) درجة. (يُمنع استخدام الحاسبة اليدوية منعاً باتاً).',
    questions: OFFICIAL_MINISTERIAL_ARCHIVE_MODELS[8].data.questions
  },

  iraq_physics_6th: {
    name: '⚡ الامتحان الوزاري لمادة الفيزياء (الصف السادس العلمي)',
    country: 'جمهورية العراق',
    ministry: 'وزارة التربية - اللجنة الدائمة للامتحانات العامة',
    school: 'الامتحانات العامة للدراسة الإعدادية (الفرع العلمي)',
    subject: 'الفيزياء',
    grade: 'الصف السادس العلمي',
    examTitle: 'الامتحان الوزاري النهائي لمادة الفيزياء',
    term: 'الدور الأول',
    year: '2025 - 2026 م',
    time: 'ثلاث ساعات',
    seal: 'assets/iraq_moe_seal.png',
    instructions: 'ملاحظة: الإجابة عن خمسة أسئلة فقط ولكل سؤال (20) درجة. (اكتب القوانين والوحدات الفيزيائية بوضوح مع كل مسألة).',
    questions: OFFICIAL_MINISTERIAL_ARCHIVE_MODELS[9].data.questions
  },

  iraq_arabic_6th: {
    name: '📖 الامتحان الوزاري لمادة اللغة العربية والأدب (الصف السادس الإعدادي)',
    country: 'جمهورية العراق',
    ministry: 'وزارة التربية - المديرية العامة للتقويم والامتحانات',
    school: 'الامتحانات العامة للدراسة الإعدادية',
    subject: 'اللغة العربية والأدب',
    grade: 'الصف السادس الإعدادي',
    examTitle: 'الامتحان الوزاري النهائي لمادة اللغة العربية',
    term: 'الدور الأول',
    year: '2025 - 2026 م',
    time: 'ثلاث ساعات',
    seal: 'assets/iraq_moe_seal.png',
    instructions: 'ملاحظة: الإجابة عن الأسئلة وفق التوزيع: قواعد اللغة (40 درجة)، الأدب والنصوص والنقد (40 درجة)، التعبير (20 درجة).',
    questions: OFFICIAL_MINISTERIAL_ARCHIVE_MODELS[10].data.questions
  },

  iraq_chemistry_6th: {
    name: '⚗️ الامتحان الوزاري لمادة الكيمياء (الصف السادس العلمي)',
    country: 'جمهورية العراق',
    ministry: 'وزارة التربية - اللجنة الدائمة للامتحانات العامة',
    school: 'الامتحانات العامة للدراسة الإعدادية (الفرع العلمي)',
    subject: 'الكيمياء',
    grade: 'الصف السادس العلمي',
    examTitle: 'الامتحان الوزاري النهائي لمادة الكيمياء',
    term: 'الدور الأول',
    year: '2025 - 2026 م',
    time: 'ثلاث ساعات',
    seal: 'assets/iraq_moe_seal.png',
    instructions: 'ملاحظة: الإجابة عن خمسة أسئلة فقط ولكل سؤال (20) درجة. (تكتب المعادلات الكيميائية موزونة مع ذكر الحالات الفيزيائية وظروف التفاعل).',
    questions: OFFICIAL_MINISTERIAL_ARCHIVE_MODELS[11].data.questions
  }
};

function generateQuestionsFromText() {
  return [];
}

function analyzeBloomDistribution(questions) {
  const stats = {
    'تذكر': 0,
    'فهم': 0,
    'تطبيق': 0,
    'تحليل': 0,
    'تقويم': 0,
    'ابتكار': 0
  };

  let totalScore = 0;
  questions.forEach(q => {
    const level = q.bloom || 'فهم';
    stats[level] = (stats[level] || 0) + (q.score || 1);
    totalScore += (q.score || 1);
  });

  return {
    stats,
    totalScore
  };
}

// Global window exposure
if (typeof window !== 'undefined') {
  window.OFFICIAL_MINISTERIAL_ARCHIVE_MODELS = OFFICIAL_MINISTERIAL_ARCHIVE_MODELS;
  window.PRESET_EXAMS = PRESET_EXAMS;
  window.analyzeBloomDistribution = analyzeBloomDistribution;
  window.generateQuestionsFromText = generateQuestionsFromText;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    OFFICIAL_MINISTERIAL_ARCHIVE_MODELS,
    PRESET_EXAMS,
    analyzeBloomDistribution,
    generateQuestionsFromText
  };
}
