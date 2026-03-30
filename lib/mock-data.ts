// lib/mock-data.ts
// Mock data provider for offline/local development
// When database is unreachable, use this instead

export const mockUsers = [
  {
    id: 'user-admin-001',
    name: 'Admin',
    email: 'admin@hassaniya-dataset.com',
    role: 'ADMIN',
    region: 'NOUAKCHOTT',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'user-reviewer-001',
    name: 'Reviewer',
    email: 'reviewer@hassaniya-dataset.com',
    role: 'REVIEWER',
    region: 'NOUADHIBOU',
    isActive: true,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: 'user-contrib-001',
    name: 'Contributor Demo',
    email: 'contributor@hassaniya-dataset.com',
    role: 'CONTRIBUTOR',
    region: 'KIFFA',
    isActive: true,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
  },
]

export const mockStats = {
  totalSentences: 2450,
  totalTexts: 156,
  totalProverbs: 348,
  totalDialogues: 89,
  totalFaqEntries: 234,
  totalDuplicateFlags: 12,
  totalExportReady: 1205,
  totalPendingReview: 445,
  rawCount: 895,
  reviewedCount: 678,
  normalizedCount: 523,
  exportReadyCount: 1205,
}

export const mockModules = [
  {
    href: '/dashboard/contribute/sentences',
    icon: '📝',
    title: 'جمل متوازية',
    desc: 'جمل حسانية مع ترجماتها للعربية والفرنسية',
    color: 'var(--primary)',
    tip: '3 → 40 كلمة',
    useCase: 'Translation • Instruction Tuning',
    count: 2450,
  },
  {
    href: '/dashboard/contribute/texts',
    icon: '📖',
    title: 'نصوص طويلة',
    desc: 'مقالات وقصص وحوارات مطولة بالحسانية',
    color: '#6c3483',
    tip: '300 → 6000 حرف',
    useCase: 'Language Modeling • Corpus',
    count: 156,
  },
  {
    href: '/dashboard/contribute/proverbs',
    icon: '🌿',
    title: 'أمثال وتعابير',
    desc: 'الموروث الثقافي والتعابير الاصطلاحية',
    color: 'var(--accent)',
    tip: '2 → 30 كلمة',
    useCase: 'Cultural Knowledge • NLP',
    count: 348,
  },
  {
    href: '/dashboard/contribute/dialogues',
    icon: '💬',
    title: 'حوارات متعددة',
    desc: 'محادثات واقعية بين عملاء وموظفين',
    color: '#2471a3',
    tip: '2+ جولات',
    useCase: 'Conversational AI • ChatML',
    count: 89,
  },
  {
    href: '/dashboard/contribute/faq',
    icon: '❓',
    title: 'أسئلة شائعة',
    desc: 'قاعدة معرفية لمساعدي دعم العملاء',
    color: '#1e8449',
    tip: 'سؤال + جواب',
    useCase: 'RAG • Customer Support AI',
    count: 234,
  },
]

export const mockSentences = [
  {
    id: 'sent-001',
    hassaniyaSentence: 'شماسي',
    msaTranslation: 'كيف حالك',
    frenchTranslation: 'Comment vas-tu',
    domain: 'GENERAL',
    intent: 'GREETING',
    region: 'NOUAKCHOTT',
    confidenceLevel: 5,
    verifiedByNativeSpeaker: true,
    contributorId: 'user-contrib-001',
  },
  {
    id: 'sent-002',
    hassaniyaSentence: 'اشحالك',
    msaTranslation: 'كيف حالك',
    frenchTranslation: 'Comment tu vas',
    domain: 'GENERAL',
    intent: 'GREETING',
    region: 'NOUAKCHOTT',
    confidenceLevel: 5,
    verifiedByNativeSpeaker: true,
    contributorId: 'user-contrib-001',
  },
]

export const mockProverbs = [
  {
    id: 'prov-001',
    proverbText: 'الگبل مگبل والبعد مبعد',
    meaningExplanation: 'القريب قريب والبعيد بعيد، أي أن الأهل والأقارب دائماً حاضرون',
    literalTranslation: 'القريب مقرّب والبعيد مُبعَد',
    frenchTranslation: 'Le proche est rapproché et l\'éloigné est éloigné',
    category: 'PROVERB',
    domain: 'GENERAL',
    region: 'NOUAKCHOTT',
    confidenceLevel: 5,
    verifiedByNativeSpeaker: true,
    contributorId: 'user-contrib-001',
  },
]

export function getMockData(type: 'users' | 'stats' | 'modules' | 'sentences' | 'proverbs') {
  switch (type) {
    case 'users':
      return mockUsers
    case 'stats':
      return mockStats
    case 'modules':
      return mockModules
    case 'sentences':
      return mockSentences
    case 'proverbs':
      return mockProverbs
    default:
      return null
  }
}
