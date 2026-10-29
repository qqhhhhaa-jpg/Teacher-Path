/**
 * ستوديو التربية الإسلامية والقرآن الكريم المعتمد | مسار المعلم PRO
 * الرسم القرآني، علامات الوقف، السور والآيات المقررة، الأحاديث النبوية، وأحكام التلاوة والتجويد الوزارية
 */

const ISLAMIC_QURANIC_SYMBOLS = [
  { char: '﴿ ﴾', name: 'أقواس الآيات المزخرفة', snippet: '﴿  ﴾', desc: 'لحصر نصوص الآيات القرآنية الكريمة' },
  { char: '« »', name: 'أقواس الحديث الشريف', snippet: '«  »', desc: 'لحصر نصوص الأحاديث النبوية الشريفة' },
  { char: '﷽', name: 'البسملة الشريفة', snippet: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', desc: 'بسم الله الرحمن الرحيم كاملة' },
  { char: 'ﷺ', name: 'صلى الله عليه وآله وسلم', snippet: 'ﷺ', desc: 'رمز الصلاة على النبي وآله' },
  { char: 'ﷻ', name: 'جل جلاله', snippet: 'ﷻ', desc: 'رمز الثناء على الله جل جلاله' },
  { char: 'ؑ', name: 'عليه السلام', snippet: 'ؑ', desc: 'رمز السلام على الأنبياء والأئمة' },
  { char: 'ؓ', name: 'رضي الله عنه', snippet: 'ؓ', desc: 'رمز الترضي عن الصحابة والصالحين' },
  { char: 'ؒ', name: 'رحمه الله', snippet: 'ؒ', desc: 'رمز الترحم على العلماء والمؤمنين' },
  { char: 'ۖ', name: 'علامة صلى (الوصل أولى)', snippet: ' ۖ ', desc: 'علامة الوصل أولى مع جواز الوقف' },
  { char: 'ۗ', name: 'علامة قلى (الوقف أولى)', snippet: ' ۗ ', desc: 'علامة الوقف أولى مع جواز الوصل' },
  { char: 'ۚ', name: 'علامة (ج) جواز الوقف', snippet: ' ۚ ', desc: 'جواز الوقف والوصل بالسوية' },
  { char: 'ۙ', name: 'علامة (لا) لا تقف', snippet: ' ۙ ', desc: 'النهي عن الوقف لتحاشي تغير المعنى' },
  { char: 'ۘ', name: 'علامة (مـ) لزوم الوقف', snippet: ' ۘ ', desc: 'لزوم الوقف التام' },
  { char: 'ۛ', name: 'علامة التعانق (المراقبة)', snippet: ' ۛ ', desc: 'إذا وقفت على أحدهما لا تقف على الآخر' },
  { char: 'ۜ', name: 'علامة السكت اللطيف', snippet: ' ۜ ', desc: 'سكتة لطيفة بدون تنفس' },
  { char: '۩', name: 'سجدة تلاوة', snippet: '۩', desc: 'موضع سجدة التلاوة الواجبة أو المستحبة' },
  { char: '۞', name: 'بداية الحزب / الربع', snippet: '۞', desc: 'رمز بداية الأجزاء والأحزاب القرآنية' },
  { char: 'ۢ', name: 'ميم الإقلاب الصغيرة', snippet: 'ۢ', desc: 'حرف الميم الصغير فوق النون الساكنة للإقلاب' },
  { char: 'ٓ', name: 'علامة المد الطويل', snippet: 'ٓ', desc: 'علامة المد الواجب والجائز واللازم' },
  { char: 'ٰ', name: 'ألف خنجرية صغيرة', snippet: 'ٰ', desc: 'ألف رسم المصحف العثماني (هَٰذَا، الرَّحْمَٰنِ)' }
];

const ISLAMIC_SURAHS_DB = [
  {
    surah: 'سورة الحشر',
    badge: 'مقررة للحفظ والشرح (السادس والثالث)',
    ayahs: 'الآيات (18 - 24)',
    text: `﴿يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ وَلْتَنظُرْ نَفْسٌ مَّا قَدَّمَتْ لِغَدٍ ۖ وَاتَّقُوا اللَّهَ ۚ إِنَّ اللَّهَ خَبِيرٌ بِمَا تَعْمَلُونَ ﴿18﴾ وَلَا تَكُونُوا كَالَّذِينَ نَسُوا اللَّهَ فَأَنسَاهُمْ أَنفُسَهُمْ ۚ أُولَٰئِكَ هُمُ الْفَاسِقُونَ ﴿19﴾ لَا يَسْتَوِي أَصْحَابُ النَّارِ وَأَصْحَابُ الْجَنَّةِ ۚ أَصْحَابُ الْجَنَّةِ هُمُ الْفَائِزُونَ ﴿20﴾ لَوْ أَنزَلْنَا هَٰذَا الْقُرْآنَ عَلَىٰ جَبَلٍ لَّرَأَيْتَهُ خَاشِعًا مُّتَصَدِّعًا مِّنْ خَشْيَةِ اللَّهِ ۚ وَتِلْكَ الْأَمْثَالُ نَضْرِبُهَا لِلنَّاسِ لَعَلَّهُمْ يَتَفَكَّرُونَ ﴿21﴾ هُوَ اللَّهُ الَّذِي لَا إِلَٰهَ إِلَّا هُوَ ۖ عَالِمُ الْغَيْبِ وَالشَّهَادَةِ ۖ هُوَ الرَّحْمَٰنُ الرَّحِيمُ ﴿22﴾ هُوَ اللَّهُ الَّذِي لَا إِلَٰهَ إِلَّا هُوَ الْمَلِكُ الْقُدُّوسُ السَّلَامُ الْمُؤْمِنُ الْمُهَيْمِنُ الْعَزِيزُ الْجَبَّارُ الْمُتَكَبِّرُ ۚ سُبْحَانَ اللَّهِ عَمَّا يُشْرِكُونَ ﴿23﴾ هُوَ اللَّهُ الْخَالِقُ الْبَارِئُ الْمُصَوِّرُ ۖ لَهُ الْأَسْمَاءُ الْحُسْنَىٰ ۚ يُسَبِّحُ لَهُ مَا فِي السَّمَاوَاتِ وَالْأَرْضِ ۖ وَهُوَ الْعَزِيزُ الْحَكِيمُ ﴿24﴾﴾`,
    desc: 'مقررة وزارياً للحفظ، التفسير، واستخراج أحكام النون الساكنة والمدود وأسماء الله الحسنى.'
  },
  {
    surah: 'سورة النجم',
    badge: 'مقررة للحفظ والشرح',
    ayahs: 'الآيات (1 - 18)',
    text: `﴿وَالنَّجْمِ إِذَا هَوَىٰ ﴿1﴾ مَا ضَلَّ صَاحِبُكُمْ وَمَا غَوَىٰ ﴿2﴾ وَمَا يَنطِقُ عَنِ الْهَوَىٰ ﴿3﴾ إِنْ هُوَ إِلَّا وَحْيٌ يُوحَىٰ ﴿4﴾ عَلَّمَهُ شَدِيدُ الْقُوَىٰ ﴿5﴾ ذُو مِرَّةٍ فَاسْتَوَىٰ ﴿6﴾ وَهُوَ بِالْأُفُقِ الْأَعْلَىٰ ﴿7﴾ ثُمَّ دَنَا فَتَدَلَّىٰ ﴿8﴾ فَكَانَ قَابَ قَوْسَيْنِ أَوْ أَدْنَىٰ ﴿9﴾ فَأَوْحَىٰ إِلَىٰ عَبْدِهِ مَا أَوْحَىٰ ﴿10﴾ مَا كَذَبَ الْفُؤَادُ مَا رَأَىٰ ﴿11﴾ أَفَتُمَارُونَهُ عَلَىٰ مَا يَرَىٰ ﴿12﴾ وَلَقَدْ رَآهُ نَزْلَةً أُخْرَىٰ ﴿13﴾ عِندَ سِدْرَةِ الْمُنتَهَىٰ ﴿14﴾ عِندَهَا جَنَّةُ الْمَأْوَىٰ ﴿15﴾ إِذْ يَغْشَى السِّدْرَةَ مَا يَغْشَىٰ ﴿16﴾ مَا زَاغَ الْبَصَرُ وَمَا طَغَىٰ ﴿17﴾ لَقَدْ رَأَىٰ مِنْ آيَاتِ رَبِّهِ الْكُبْرَىٰ ﴿18﴾﴾`,
    desc: 'بيان معجزة الإسراء والمعراج وصدق نبوة الرسول الأكرم ﷺ وعظمة الوحي الإلهي.'
  },
  {
    surah: 'سورة الرحمن',
    badge: 'مقررة للحفظ والشرح',
    ayahs: 'الآيات (1 - 16)',
    text: `﴿الرَّحْمَٰنُ ﴿1﴾ عَلَّمَ الْقُرْآنَ ﴿2﴾ خَلَقَ الْإِنسَانَ ﴿3﴾ عَلَّمَهُ الْبَيَانَ ﴿4﴾ الشَّمْسُ وَالْقَمَرُ بِحُسْبَانٍ ﴿5﴾ وَالنَّجْمُ وَالشَّجَرُ يَسْجُدَانِ ﴿6﴾ وَالسَّمَاءَ رَفَعَهَا وَوَضَعَ الْمِيزَانَ ﴿7﴾ أَلَّا تَطْغَوْا فِي الْمِيزَانِ ﴿8﴾ وَأَقِيمُوا الْوَزْنَ بِالْقِسْطِ وَلَا تُخْسِرُوا الْمِيزَانَ ﴿9﴾ وَالْأَرْضَ وَضَعَهَا لِلْأَنَامِ ﴿10﴾ فِيهَا فَاكِهَةٌ وَالنَّخْلُ ذَاتُ الْأَكْمَامِ ﴿11﴾ وَالْحَبُّ ذُو الْعَصْفِ وَالرَّيْحَانُ ﴿12﴾ فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ ﴿13﴾ خَلَقَ الْإِنسَانَ مِن صَلْصَالٍ كَالْفَخَّارِ ﴿14﴾ وَخَلَقَ الْجَانَّ مِن مَّارِجٍ مِّن نَّارٍ ﴿15﴾ فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ ﴿16﴾﴾`,
    desc: 'تعداد نعم الله الجليلة على الإنس والجن ودعوة للتفكر في خلق الكون والميزان والعدل.'
  },
  {
    surah: 'سورة الإسراء',
    badge: 'بر الوالدين والأخلاق',
    ayahs: 'الآيات (23 - 24)',
    text: `﴿وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا ۚ إِمَّا يَبْلُغَنَّ عِندَكَ الْكِبَرَ أَحَدُهُمَا أَوْ كِلَاهُمَا فَلَا تَقُل لَّهُمَا أُفٍّ وَلَا تَنْهَرْهُمَا وَقُل لَّهُمَا قَوْلًا كَرِيمًا ﴿23﴾ وَاخْفِضْ لَهُمَا جَنَاحَ الذُّلِّ مِنَ الرَّحْمَةِ وَقُل رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا ﴿24﴾﴾`,
    desc: 'وصايا القرآن الخالدة في التوحيد وبر الوالدين والإحسان إليهما في الكبر.'
  },
  {
    surah: 'سورة البقرة (آية الكرسي)',
    badge: 'أعظم آية في القرآن',
    ayahs: 'الآية (255)',
    text: `﴿اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ ﴿255﴾﴾`,
    desc: 'مقررة في التوحيد، التفسير، العقيدة الإسلامية واستخراج أحكام التلاوة والمدود.'
  }
];

const ISLAMIC_HADITHS_DB = [
  {
    title: 'حديث بر الوالدين وحسن المعاملة',
    badge: 'مقرر للحفظ والشرح',
    text: `«جاء رجلٌ إلى رسول الله ﷺ فقال: يا رسول الله، من أحقُّ الناسِ بحُسْنِ صَحابَتي؟ قال: أُمُّكَ، قال: ثم من؟ قال: ثم أُمُّكَ، قال: ثم من؟ قال: ثم أُمُّكَ، قال: ثم من؟ قال: ثم أبوكَ»`,
    notes: 'يؤكد على فضل الأم ثلاث مرات لعظيم تعبها في الحمل والولادة والرضاعة والتربية، ثم فضل الأب.'
  },
  {
    title: 'حديث كرامة الشهيد في سبيل الله',
    badge: 'مقرر للحفظ والشرح',
    text: `«ما مِن مَكلومٍ يُكْلَمُ في سبيلِ اللهِ إلَّا جاء يومَ القيامةِ وكَلْمُهُ يَدمى، اللونُ لونُ دَمٍ، والرِّيحُ ريحُ مِسْكٍ»`,
    notes: 'بيان المنزلة السامية للشهيد وتضحيته دفاعاً عن الوطن والمقدسات، وتكريمه يوم القيامة.'
  },
  {
    title: 'حديث الأمر بالمعروف والنهي عن المنكر',
    badge: 'مقرر للحفظ والشرح',
    text: `«مَن رأى مِنكُم مُنكراً فليُغَيِّرهُ بيَدِه، فإن لم يَستَطِع فبِلسانِه، فإن لم يَستَطِع فبقَلبِه، وذلِكَ أضعَفُ الإيمانِ»`,
    notes: 'بيان درجات الإصلاح والتغيير الإيجابي في المجتمع كلٌّ حسب موقعه ومسؤوليته وقدرته.'
  },
  {
    title: 'حديث حرمة المسلم والمؤاخاة',
    badge: 'مقرر للحفظ والشرح',
    text: `«كُلُّ المُسلِمِ علَى المُسلِمِ حَرامٌ: دَمُهُ، ومالُهُ، وعِرْضُهُ»`,
    notes: 'صيانة كرامة الإنسان وحقوقه الأساسية والأمن المجتمعي ومنع التعدي بالقول أو الفعل.'
  },
  {
    title: 'حديث التعاون والتكافل الاجتماعي',
    badge: 'مقرر للحفظ والشرح',
    text: `«المؤمنُ للمؤمِنِ كالبُنيانِ المَرصوصِ، يَشُدُّ بعضُهُ بعضاً» وشبَّكَ ﷺ بين أصابِعِه.`,
    notes: 'الحث على التآزر والتعاون ورعاية الفقراء والأيتام والاتحاد في مواجهة الأزمات.'
  },
  {
    title: 'حديث محاسبة النفس والاجتهاد في العمل',
    badge: 'مقرر للحفظ والشرح',
    text: `«الكَيِّسُ مَن دانَ نَفْسَهُ وعَمِلَ لِما بَعدَ المَوتِ، والعاجِزُ مَن أتبَعَ نَفْسَهُ هَواها وتَمنَّى علَى اللهِ الأمانِيَّ»`,
    notes: 'الكَيّس هو العاقل الفطن الذي يحاسب نفسه قبل أن يُحاسب، والتحذير من الأماني الفارغة دون عمل.'
  },
  {
    title: 'حديث الصدق والأمانة',
    badge: 'مقرر للحفظ والشرح',
    text: `«علَيكُم بالصِّدقِ؛ فإنَّ الصِّدقَ يَهْدي إلى البِرِّ، وإنَّ البِرَّ يَهْدي إلى الجَنَّةِ، وأدِّ الأمانَةَ إلى مَنِ ائتَمَنَكَ ولا تَخُن مَن خانَكَ»`,
    notes: 'الأخلاق الإسلامية الفاضلة والوفاء بالعهود ورد الأمانات والابتعاد عن الغش والخيانة.'
  },
  {
    title: 'حديث فضل طلب العلم والمعرفة',
    badge: 'مقرر للحفظ والشرح',
    text: `«مَن سَلَكَ طَريقاً يَلتَمِسُ فيهِ عِلماً سَهَّلَ اللهُ لهُ بهِ طَريقاً إلى الجَنَّةِ، وإنَّ المَلائِكَةَ لَتَضَعُ أجنِحَتَها رِضاً لِطالِبِ العِلمِ»`,
    notes: 'الحث على التفوق الدراسي وطلب العلم النافع الذي يبني الأوطان وينير العقول.'
  }
];

const ISLAMIC_TAJWEED_TEMPLATES = [
  {
    title: 'جدول استخراج الأحكام الوزاري (النموذجي المعتمد)',
    snippet: `الجدول الوزاري لاستخراج أحكام التلاوة:

| الكلمة القرآنية | الحكم التجويدي | السبب |
|:---:|:---:|:---:|
| أَنْعَمْتَ | إظهار حلقي | لمجيء النون الساكنة بعدها حرف العين (من حروف الحلق) |
| مَن يَقُولُ | إدغام بغنة | لمجيء النون الساكنة بعدها حرف الياء (من حروف ينمو) |
| مِنۢ بَعْدِ | إقلاب | لمجيء النون الساكنة بعدها حرف الباء فقلبت إلى ميم مخفاة |
| عَن صَلَاتِهِمْ | إخفاء حقيقي | لمجيء النون الساكنة بعدها حرف الصاد (من حروف الإخفاء) |
| السَّمَآء | مد متصل | لمجيء حرف المد وبعده الهمزة في كلمة واحدة (يُمَد 4 أو 5 حركات) |
| وَمَا أَدْرَاكَ | مد منفصل | لمجيء حرف المد في آخر الكلمة والهمزة في أول الكلمة الثانية |`,
    desc: 'جدول معتمد في كافة الامتحانات الوزارية لأسئلة أحكام التلاوة (الثالث والسادس).'
  },
  {
    title: 'سؤال أحكام النون الساكنة والتنوين (وزاري)',
    snippet: `س: استخرج أحكام النون الساكنة والتنوين من الآيات الكريمة التالية، مبيناً نوع الحكم والسبب لخمسٍ فقط:
﴿يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ وَلْتَنظُرْ نَفْسٌ مَّا قَدَّمَتْ لِغَدٍ ۖ وَاتَّقُوا اللَّهَ ۚ إِنَّ اللَّهَ خَبِيرٌ بِمَا تَعْمَلُونَ﴾`,
    desc: 'صيغة وزارية كلاسيكية مع توزيع الدرجات والخيارات.'
  },
  {
    title: 'سؤال أحكام لام التعريف (ال - إظهار قمري وإدغام شمسي)',
    snippet: `س: ما حكم لام التعريف في الكلمات التي تحتها خط في النص القرآني التالي؟ اذكر السبب مستعيناً بعبارة (ابغِ حجَّك وخَف عقيمَه):
﴿وَالسَّمَاءَ رَفَعَهَا وَوَضَعَ الْمِيزَانَ * أَلَّا تَطْغَوْا فِي الْمِيزَانِ * وَأَقِيمُوا الْوَزْنَ بِالْقِسْطِ وَلَا تُخْسِرُوا الْمِيزَانَ﴾`,
    desc: 'سؤال استخراج اللام القمرية واللام الشمسية.'
  },
  {
    title: 'سؤال أحكام القلقلة (صغرى وكبرى)',
    snippet: `س: عيّن حروف القلقلة في الآيات الكريمة التالية، وبيّن نوع القلقلة (صغرى أو كبرى) مع بيان السبب:
(حروف القلقلة مجموعة في كلمتي: قُطْبُ جَدٍّ)`,
    desc: 'سؤال استخراج حروف القلقلة الصغرى (وسط الكلمة) والكبرى (آخر الكلمة عند الوقف).'
  }
];

window.insertIslamicText = function(snippet) {
  let target = window.lastActiveMathInput || document.getElementById('modalQText');
  if (!target) return;
  const start = target.selectionStart ?? target.value.length;
  const end = target.selectionEnd ?? target.value.length;
  target.value = target.value.substring(0, start) + snippet + target.value.substring(end);
  target.focus();
  if (typeof window.updateModalMathPreview === 'function') window.updateModalMathPreview();
  if (typeof window.showToast === 'function') window.showToast('تم إدراج النص القرآني / الإسلامي بنجاح 📖✨', 'success');
};

window.toggleIslamicStudio = function() {
  const wrapper = document.getElementById('modalIslamicStudioWrapper');
  let container = document.getElementById('modalIslamicStudioContainer');
  if (!container && wrapper && typeof window.buildIslamicStudioHTML === 'function') {
    wrapper.innerHTML = window.buildIslamicStudioHTML(true);
    wrapper.innerHTML = window.buildIslamicStudioHTML(false);
    container = document.getElementById('modalIslamicStudioContainer');
  }
  if (!container) return;
  const isHidden = (container.style.display === 'none' || !container.style.display);
  if (isHidden && typeof window.closeAllQuestionStudiosExcept === 'function') {
    window.closeAllQuestionStudiosExcept('islamic');
  }
  container.style.display = isHidden ? 'block' : 'none';
  const toggleBtn = document.getElementById('btnToggleIslamicStudio');
  if (toggleBtn) {
    toggleBtn.classList.toggle('active', isHidden);
  }
};

window.switchIslamicStudioTab = function(tabId) {
  document.querySelectorAll('#islamicStudioTabs .islamic-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.islamic-tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === `islamicPane_${tabId}`);
  });
};

window.buildIslamicStudioHTML = function(isOpen = false) {
  const symbolsHTML = ISLAMIC_QURANIC_SYMBOLS.map(item => `
    <button type="button" class="quranic-symbol-btn" onclick="window.insertIslamicText('${item.snippet}')" title="${item.name}: ${item.desc}">
      <span class="quranic-symbol-char">${item.char}</span>
      <span style="font-size: 0.73rem; font-weight: 700;">${item.name}</span>
    </button>
  `).join('');

  const surahsHTML = ISLAMIC_SURAHS_DB.map(s => `
    <div class="islamic-text-card">
      <div class="islamic-card-header">
        <div class="islamic-card-title">
          <i class="fa-solid fa-book-quran text-accent"></i> ${s.surah} - ${s.ayahs}
        </div>
        <span class="islamic-card-badge">${s.badge}</span>
      </div>
      <div class="islamic-ayah-content">${s.text}</div>
      <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 6px;">${s.desc}</div>
      <div class="islamic-card-actions">
        <button type="button" class="btn-islamic-insert" onclick="window.insertIslamicText(\`${s.text.replace(/`/g, "\\`")}\`)">
          <i class="fa-solid fa-plus-circle"></i> إدراج النص القرآني كاملاً في السؤال
        </button>
      </div>
    </div>
  `).join('');

  const hadithsHTML = ISLAMIC_HADITHS_DB.map(h => `
    <div class="islamic-text-card">
      <div class="islamic-card-header">
        <div class="islamic-card-title">
          <i class="fa-solid fa-feather text-warning"></i> ${h.title}
        </div>
        <span class="islamic-card-badge">${h.badge}</span>
      </div>
      <div class="islamic-ayah-content" style="border-right-color: #f59e0b;">${h.text}</div>
      <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 6px;">💡 ما يرشد إليه الحديث: ${h.notes}</div>
      <div class="islamic-card-actions">
        <button type="button" class="btn-islamic-insert" style="border-color: #f59e0b; color: #fbbf24; background: rgba(245, 158, 11, 0.15);" onclick="window.insertIslamicText(\`${h.text.replace(/`/g, "\\`")}\`)">
          <i class="fa-solid fa-plus-circle"></i> إدراج نص الحديث الشريف في السؤال
        </button>
      </div>
    </div>
  `).join('');

  const tajweedHTML = ISLAMIC_TAJWEED_TEMPLATES.map(t => `
    <div class="islamic-text-card">
      <div class="islamic-card-header">
        <div class="islamic-card-title">
          <i class="fa-solid fa-table-list text-primary"></i> ${t.title}
        </div>
      </div>
      <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 6px;">${t.desc}</div>
      <pre style="font-family: inherit; font-size: 0.78rem; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px; border: 1px dashed rgba(16, 185, 129, 0.3); white-space: pre-wrap; color: #e2e8f0; margin-bottom: 6px;">${t.snippet}</pre>
      <div class="islamic-card-actions">
        <button type="button" class="btn-islamic-insert" onclick="window.insertIslamicText(\`${t.snippet.replace(/`/g, "\\`")}\`)">
          <i class="fa-solid fa-paste"></i> إدراج قالب السؤال والجدول في نص السؤال
        </button>
      </div>
    </div>
  `).join('');

  return `
    <!-- ستوديو التربية الإسلامية العراقي (سور، آيات، أحاديث، ورسم قرآني) -->
    <div class="islamic-studio-container" id="modalIslamicStudioContainer" style="display: ${isOpen ? 'block' : 'none'};">
      <div class="islamic-studio-header">
        <div class="islamic-studio-title">
          <i class="fa-solid fa-book-quran" style="color: #34d399;"></i>
          <span>ستوديو التربية الإسلامية والقرآن الكريم المعتمد</span>
          <span class="badge-islamic-iq">المنهج العراقي الوزاري</span>
        </div>
        <div>
          <span style="font-size: 0.72rem; color: var(--text-muted);">انقر على أي رمز، آية، حديث، أو جدول تجويد لإدراجه في السؤال 📖</span>
        </div>
      </div>

      <!-- تبويبات التربية الإسلامية -->
      <div class="islamic-studio-tabs" id="islamicStudioTabs">
        <button type="button" class="islamic-tab-btn active" data-tab="isl_symbols" onclick="window.switchIslamicStudioTab('isl_symbols')">
          <i class="fa-solid fa-shapes"></i> الرسم القرآني والرموز التجويدية
        </button>
        <button type="button" class="islamic-tab-btn" data-tab="isl_surahs" onclick="window.switchIslamicStudioTab('isl_surahs')">
          <i class="fa-solid fa-quran"></i> السور والآيات المقررة وزارياً
        </button>
        <button type="button" class="islamic-tab-btn" data-tab="isl_hadiths" onclick="window.switchIslamicStudioTab('isl_hadiths')">
          <i class="fa-solid fa-feather"></i> الأحاديث النبوية الشريفة
        </button>
        <button type="button" class="islamic-tab-btn" data-tab="isl_tajweed" onclick="window.switchIslamicStudioTab('isl_tajweed')">
          <i class="fa-solid fa-table-list"></i> أحكام التلاوة والجداول الوزارية
        </button>
      </div>

      <!-- تبويب 1: الرسم والرموز -->
      <div class="islamic-tab-pane active" id="islamicPane_isl_symbols">
        <div class="quranic-symbols-grid">
          ${symbolsHTML}
        </div>
      </div>

      <!-- تبويب 2: السور والآيات -->
      <div class="islamic-tab-pane" id="islamicPane_isl_surahs">
        <div class="islamic-texts-list">
          ${surahsHTML}
        </div>
      </div>

      <!-- تبويب 3: الأحاديث النبوية -->
      <div class="islamic-tab-pane" id="islamicPane_isl_hadiths">
        <div class="islamic-texts-list">
          ${hadithsHTML}
        </div>
      </div>

      <!-- تبويب 4: أحكام التلاوة -->
      <div class="islamic-tab-pane" id="islamicPane_isl_tajweed">
        <div class="islamic-texts-list">
          ${tajweedHTML}
        </div>
      </div>
    </div>
  `;
};
