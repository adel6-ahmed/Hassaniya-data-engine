import { nearDuplicateThreshold, singleCharRepetitionRatio, wordCount } from './dedup-utils'

export function dedupRejectionRules(input: {
  normalizedText: string
  confidenceLevelInt: number
  nearDuplicateCount: number
}): { passed: boolean; errors: string[] } {
  const errors: string[] = []

  // Fix 4: confidenceLevel is an integer 1..5 across the system.
  // Original threshold in spec was on a 0..1 scale: confidence/5 < 0.3
  // That rejects only confidenceLevelInt === 1 (1/5 = 0.2).
  if (input.confidenceLevelInt < 2) {
    errors.push('low_confidence: confidenceLevel must be >= 2')
  }

  const wc = wordCount(input.normalizedText)
  if (wc < 3) {
    errors.push('too_short: normalized text must contain at least 3 words')
  }

  const rep = singleCharRepetitionRatio(input.normalizedText)
  if (rep > 0.5) {
    errors.push('repetition: a single character repeated > 50% of the text')
  }

  // Fix 4: Reject if too many existing near-duplicates of the same text.
  if (input.nearDuplicateCount > 5) {
    errors.push(`too_many_near_duplicates: count=${input.nearDuplicateCount}`)
  }

  // Threshold is computed by nearDuplicateThreshold; rejection doesn't depend on it,
  // but we keep it deterministic for future introspection/debugging.
  const thr = nearDuplicateThreshold(input.normalizedText)
  if (!Number.isFinite(thr)) errors.push('invalid_threshold')

  return { passed: errors.length === 0, errors }
}

