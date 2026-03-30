// lib/validations.ts
// Zod schemas for all dataset modules

import { z } from 'zod'

// ── Shared enums ────────────────────────────────────────────────

const DomainEnum = z.enum([
  'GENERAL', 'TELECOM', 'BANKING', 'ECOMMERCE',
  'LOGISTICS', 'PUBLIC_SERVICES', 'EDUCATION', 'HEALTHCARE'
])

const IntentEnum = z.enum([
  'GREETING', 'BILLING_ISSUE', 'NETWORK_ISSUE', 'ACCOUNT_HELP',
  'PASSWORD_RESET', 'BRANCH_LOCATION', 'PACKAGE_INFO', 'COMPLAINT',
  'FAQ_REQUEST', 'OTHER'
])

const RegionEnum = z.enum([
  'NOUAKCHOTT', 'NOUADHIBOU', 'ROSSO', 'KIFFA', 'KAEDI', 'ZOUERATE', 'ATAR', 'TIDJIKJA', 'NEMA', 'AIOUN', 'OTHER'
])

const EmotionalToneEnum = z.enum([
  'NEUTRAL',
  'POSITIVE',
  'NEGATIVE',
  'FORMAL',
  'INFORMAL',
  'HUMOROUS',
])

const StyleTypeEnum = z.enum([
  'FORMAL',
  'COLLOQUIAL',
  'NARRATIVE',
  'POETIC',
  'INSTRUCTIONAL',
])

const ReviewStatusEnum = z.enum([
  'PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVISION'
])

// ── Text normalization ──────────────────────────────────────────

export function normalizeHassaniyaText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')              // collapse whitespace
    .replace(/ـ/g, '')                 // remove tatweel
    .replace(/[،,]/g, '،')             // normalize comma
    .replace(/[؟?]/g, '؟')            // normalize question mark
    .replace(/[.\.]+/g, '.')           // normalize period
}

// ── Quality checks ──────────────────────────────────────────────

export interface QualityCheck {
  passed: boolean
  warnings: string[]
  errors: string[]
}

export function checkTextQuality(text: string): QualityCheck {
  const warnings: string[] = []
  const errors: string[] = []

  // Count words
  const words = text.trim().split(/\s+/)
  
  // Check for emoji spam
  const emojiCount = (text.match(/\p{Emoji}/gu) || []).length
  if (emojiCount > 3) errors.push('النص يحتوي على رموز تعبيرية كثيرة')
  if (emojiCount === words.length) errors.push('النص يحتوي على رموز تعبيرية فقط')

  // Check for repeated words
  const wordFreq: Record<string, number> = {}
  for (const w of words) {
    wordFreq[w] = (wordFreq[w] || 0) + 1
  }
  const maxFreq = Math.max(...Object.values(wordFreq))
  if (maxFreq > 5 && words.length < 20) errors.push('الكلمات مكررة بشكل مفرط')

  // Check for Latin character dominance
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length
  if (latinChars > arabicChars && arabicChars > 0) {
    warnings.push('النص يحتوي على أحرف لاتينية كثيرة')
  }

  // Check for MSA patterns (basic heuristic)
  const msaIndicators = ['لقد', 'إنني', 'حيث أن', 'وفقاً', 'استناداً']
  for (const ind of msaIndicators) {
    if (text.includes(ind)) {
      warnings.push('النص قد يكون بالعربية الفصحى وليس الحسانية')
      break
    }
  }

  return {
    passed: errors.length === 0,
    warnings,
    errors,
  }
}

// ── Module 1: Parallel Sentences ────────────────────────────────

export const parallelSentenceSchema = z.object({
  hassaniyaSentence: z
    .string()
    .min(3, 'الجملة قصيرة جداً (3 كلمات على الأقل)')
    .max(500, 'الجملة طويلة جداً (40 كلمة كحد أقصى)')
    .refine(
      (val) => val.trim().split(/\s+/).length >= 3,
      'الجملة يجب أن تحتوي على 3 كلمات على الأقل'
    )
    .refine(
      (val) => val.trim().split(/\s+/).length <= 40,
      'الجملة يجب أن تحتوي على 40 كلمة كحد أقصى'
    ),
  msaTranslation: z.string().min(2, 'الترجمة قصيرة جداً').optional().or(z.literal('')),
  frenchTranslation: z.string().optional().or(z.literal('')),
  category: z.string().optional(),
  domain: DomainEnum.default('GENERAL'),
  intent: IntentEnum.default('OTHER'),
  region: RegionEnum.default('OTHER'),
  emotionalTone: EmotionalToneEnum.default('NEUTRAL'),
  styleType: StyleTypeEnum.default('COLLOQUIAL'),
  confidenceLevel: z.number().int().min(1).max(5).default(3),
  contributorNotes: z.string().optional(),
  verifiedByNativeSpeaker: z.boolean().default(false),
  variationGroupId: z.string().optional(),
})

export type ParallelSentenceInput = z.infer<typeof parallelSentenceSchema>

// ── Module 2: Monolingual Texts ─────────────────────────────────

export const monolingualTextSchema = z.object({
  title: z.string().optional(),
  hassaniyaText: z
    .string()
    .min(300, 'النص قصير جداً (300 حرف على الأقل)')
    .max(6000, 'النص طويل جداً (6000 حرف كحد أقصى)'),
  topic: z.string().optional(),
  textType: z.string().optional(),
  domain: DomainEnum.default('GENERAL'),
  region: RegionEnum.default('OTHER'),
  emotionalTone: EmotionalToneEnum.default('NEUTRAL'),
  writingStyle: StyleTypeEnum.default('COLLOQUIAL'),
  sourceType: z.enum(['ORIGINAL', 'TRANSCRIBED', 'COLLECTED', 'GENERATED', 'CROWDSOURCED']).default('ORIGINAL'),
  sourceUrl: z.string().url().optional().or(z.literal('')),
  sourcePlatform: z.string().optional(),
  containsPersonalInfo: z.boolean().default(false),
  isSegmented: z.boolean().optional(),
  confidenceLevel: z.number().int().min(1).max(5).default(3),
})

export type MonolingualTextInput = z.infer<typeof monolingualTextSchema>

// ── Module 3: Proverbs ──────────────────────────────────────────

export const proverbSchema = z.object({
  proverbText: z
    .string()
    .min(2, 'المثل قصير جداً')
    .max(200, 'المثل طويل جداً')
    .refine(
      (val) => val.trim().split(/\s+/).length >= 2,
      'يجب أن يحتوي المثل على كلمتين على الأقل'
    )
    .refine(
      (val) => val.trim().split(/\s+/).length <= 30,
      'يجب أن يحتوي المثل على 30 كلمة كحد أقصى'
    ),
  meaningExplanation: z.string().min(10, 'شرح المعنى قصير جداً'),
  literalTranslation: z.string().optional(),
  frenchTranslation: z.string().optional(),
  usageContext: z.string().optional(),
  category: z.enum(['PROVERB', 'IDIOM', 'EXPRESSION', 'SAYING']).default('PROVERB'),
  domain: DomainEnum.default('GENERAL'),
  region: RegionEnum.default('OTHER'),
  confidenceLevel: z.number().int().min(1).max(5).default(3),
  verifiedByNativeSpeaker: z.boolean().default(false),
})

export type ProverbInput = z.infer<typeof proverbSchema>

// ── Module 4: Dialogue Turn ─────────────────────────────────────

export const dialogueTurnSchema = z.object({
  turnIndex: z.number().int().min(0),
  utteranceText: z.string().min(1, 'النص مطلوب').max(2000),
  speakerRole: z.enum(['user', 'assistant', 'system']).default('user'),
  dialogueStage: z.enum(['OPENING', 'CLARIFICATION', 'RESOLUTION', 'ESCALATION', 'CLOSING']).default('OPENING'),
  intent: IntentEnum.default('OTHER'),
  domain: DomainEnum.default('GENERAL'),
  topic: z.string().optional(),
  region: RegionEnum.default('OTHER'),
  emotionalTone: EmotionalToneEnum.default('NEUTRAL'),
  confidenceLevel: z.number().int().min(1).max(5).default(3),
  verifiedByNativeSpeaker: z.boolean().default(false),
  variationGroupId: z.string().optional(),
})

export const dialogueSchema = z.object({
  title: z.string().optional(),
  topic: z.string().optional(),
  domain: DomainEnum.default('GENERAL'),
  region: RegionEnum.default('OTHER'),
  turns: z
    .array(dialogueTurnSchema)
    .min(2, 'يجب أن يحتوي الحوار على جولتين على الأقل')
    .refine(
      // Order-independent sequential validation: turnIndex must be exactly [0..n-1].
      (turns) => {
        const sorted = [...turns].sort((a, b) => a.turnIndex - b.turnIndex)
        return sorted.every((t, i) => t.turnIndex === i)
      },
      { message: 'turn_index must be sequential starting from 0' },
    ),
})

export type DialogueInput = z.infer<typeof dialogueSchema>

// ── Module 5: FAQ Entry ─────────────────────────────────────────

export const faqEntrySchema = z.object({
  questionHassaniya: z.string().min(5, 'السؤال قصير جداً').max(500),
  questionMsa: z.string().optional(),
  answerHassaniya: z.string().min(10, 'الجواب قصير جداً').max(2000),
  answerMsa: z.string().optional(),
  answerFrench: z.string().optional(),
  domain: DomainEnum.default('GENERAL'),
  intent: IntentEnum.default('FAQ_REQUEST'),
  sourceType: z.enum(['ORIGINAL', 'TRANSCRIBED', 'COLLECTED', 'GENERATED', 'CROWDSOURCED']).default('ORIGINAL'),
  confidenceLevel: z.number().int().min(1).max(5).default(3),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
})

export type FaqEntryInput = z.infer<typeof faqEntrySchema>

// ── Review schema ───────────────────────────────────────────────

export const reviewSchema = z.object({
  reviewStatus: ReviewStatusEnum,
  reviewNotes: z.string().optional(),
  curationStage: z.enum(['RAW', 'REVIEWED', 'NORMALIZED', 'EXPORT_READY']).optional(),
  isExportReady: z.boolean().optional(),
})

export type ReviewInput = z.infer<typeof reviewSchema>

// ── Variation group ─────────────────────────────────────────────

export const variationGroupSchema = z.object({
  meaningArabic: z.string().min(2, 'المعنى بالعربية مطلوب'),
  meaningFrench: z.string().optional(),
  domain: DomainEnum.default('GENERAL'),
  intent: IntentEnum.default('OTHER'),
})

export type VariationGroupInput = z.infer<typeof variationGroupSchema>

// ── Data Export (Fix 1) ─────────────────────────────────────────

export const ExportTypeEnum = z.enum([
  'PARALLEL',
  'MONOLINGUAL',
  'PROVERBS',
  'DIALOGUE',
  'FAQ',
  'INSTRUCTION_TUNING',
  'CHAT',
])

export const ExportRequestSchema = z.object({
  exportType: ExportTypeEnum,
  datasetVersion: z.string().regex(/^v\d+\.\d+\.\d+$/),
  filters: z
    .object({
      domain: z.string().optional(),
      region: z.string().optional(),
    })
    .optional(),
})

// Backwards-compatible schema for the current export UI.
// (The UI currently does not send `datasetVersion` or uppercase exportType values.)
export const ExportRequestLegacySchema = z.object({
  exportType: z.enum(['parallel', 'monolingual', 'proverbs', 'dialogues', 'instruction', 'faq']),
  format: z.enum(['json', 'jsonl', 'csv']).default('jsonl'),
  domain: z.string().optional(),
  intent: z.string().optional(),
  region: z.string().optional(),
  trainRatio: z.number().min(0).max(1).default(0.8),
  valRatio: z.number().min(0).max(1).default(0.1),
  splitOutput: z.boolean().default(false),
  // Optional override for the new dataset version header.
  datasetVersion: z.string().regex(/^v\d+\.\d+\.\d+$/).optional(),
})

export type ExportRequestLegacyInput = z.infer<typeof ExportRequestLegacySchema>
