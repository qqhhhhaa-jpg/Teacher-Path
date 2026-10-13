/**
 * question-types.js
 * Definitive schemas and helpers for question types in Moallem Pro
 * All fields are completely empty by default for clean and immediate editing.
 */

const QUESTION_TYPES = {
  mcq: {
    id: 'mcq',
    name: 'اختيار من متعدد',
    icon: 'fa-solid fa-list-check',
    color: '#3b82f6',
    defaultScore: 5,
    defaultBloom: 'فهم',
    createDefault: () => ({
      id: generateId(),
      type: 'mcq',
      title: '',
      text: '',
      options: [
        { id: 'opt_1', text: '', isCorrect: true },
        { id: 'opt_2', text: '', isCorrect: false },
        { id: 'opt_3', text: '', isCorrect: false },
        { id: 'opt_4', text: '', isCorrect: false }
      ],
      explanation: '',
      score: 5,
      difficulty: 'متوسط',
      bloom: 'فهم'
    })
  },

  true_false: {
    id: 'true_false',
    name: 'صح أو خطأ',
    icon: 'fa-solid fa-square-check',
    color: '#10b981',
    defaultScore: 5,
    defaultBloom: 'تذكر',
    createDefault: () => ({
      id: generateId(),
      type: 'true_false',
      title: '',
      text: '',
      isTrue: true,
      correction: '',
      score: 5,
      difficulty: 'سهل',
      bloom: 'تذكر'
    })
  },

  fill_blanks: {
    id: 'fill_blanks',
    name: 'أكمل الفراغات',
    icon: 'fa-solid fa-pen-ruler',
    color: '#f59e0b',
    defaultScore: 5,
    defaultBloom: 'تذكر',
    createDefault: () => ({
      id: generateId(),
      type: 'fill_blanks',
      title: '',
      text: '',
      answers: [],
      score: 5,
      difficulty: 'متوسط',
      bloom: 'تذكر'
    })
  },

  matching: {
    id: 'matching',
    name: 'صل بين العمودين',
    icon: 'fa-solid fa-shuffle',
    color: '#8b5cf6',
    defaultScore: 5,
    defaultBloom: 'فهم',
    createDefault: () => ({
      id: generateId(),
      type: 'matching',
      title: '',
      text: '',
      pairs: [
        { id: 'p1', left: '', right: '' },
        { id: 'p2', left: '', right: '' },
        { id: 'p3', left: '', right: '' },
        { id: 'p4', left: '', right: '' }
      ],
      score: 5,
      difficulty: 'متوسط',
      bloom: 'تطبيق'
    })
  },

  essay: {
    id: 'essay',
    name: 'سؤال مقالي / شرح',
    icon: 'fa-solid fa-align-right',
    color: '#ec4899',
    defaultScore: 5,
    defaultBloom: 'تحليل',
    createDefault: () => ({
      id: generateId(),
      type: 'essay',
      title: '',
      text: '',
      modelAnswer: '',
      showAnswerLines: true,
      linesCount: 3,
      score: 5,
      difficulty: 'متوسط',
      bloom: 'تحليل'
    })
  },

  reasoning: {
    id: 'reasoning',
    name: 'علل / اذكر السبب',
    icon: 'fa-solid fa-circle-question',
    color: '#06b6d4',
    defaultScore: 5,
    defaultBloom: 'فهم',
    createDefault: () => ({
      id: generateId(),
      type: 'reasoning',
      title: '',
      text: '',
      modelAnswer: '',
      showAnswerLines: true,
      linesCount: 3,
      score: 5,
      difficulty: 'متوسط',
      bloom: 'فهم'
    })
  },

  math_problem: {
    id: 'math_problem',
    name: 'مسألة رياضية / علمية',
    icon: 'fa-solid fa-square-root-variable',
    color: '#6366f1',
    defaultScore: 5,
    defaultBloom: 'تطبيق',
    createDefault: () => ({
      id: generateId(),
      type: 'math_problem',
      title: '',
      text: '',
      modelAnswer: '',
      showAnswerLines: true,
      linesCount: 4,
      score: 5,
      difficulty: 'متوسط',
      bloom: 'تطبيق'
    })
  },

  definitions: {
    id: 'definitions',
    name: 'تعاريف ومفاهيم',
    icon: 'fa-solid fa-book-bookmark',
    color: '#0284c7',
    defaultScore: 10,
    defaultBloom: 'تذكر',
    createDefault: () => ({
      id: generateId(),
      type: 'definitions',
      title: 'السؤال: عرّف ما يأتي:',
      text: '',
      terms: [
        { id: 'term_1', term: '', definition: '' },
        { id: 'term_2', term: '', definition: '' },
        { id: 'term_3', term: '', definition: '' }
      ],
      modelAnswer: '',
      showAnswerLines: false,
      linesCount: 0,
      score: 10,
      difficulty: 'متوسط',
      bloom: 'تذكر',
      branches: []
    })
  },

  comparisons: {
    id: 'comparisons',
    name: 'مقارنات وفرق',
    icon: 'fa-solid fa-code-compare',
    color: '#9333ea',
    defaultScore: 5,
    defaultBloom: 'تحليل',
    createDefault: () => ({
      id: generateId(),
      type: 'comparisons',
      title: 'السؤال: قارن بين كل مما يأتي',
      text: '',
      item1: '',
      item2: '',
      modelAnswer: '',
      showAnswerLines: true,
      linesCount: 4,
      score: 5,
      difficulty: 'متوسط',
      bloom: 'تحليل',
      branches: []
    })
  }
};

function generateId() {
  return 'q_' + Math.random().toString(36).substring(2, 9);
}

// Global window exposure
window.QUESTION_TYPES = QUESTION_TYPES;
window.generateId = generateId;

