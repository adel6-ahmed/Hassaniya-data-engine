// lib/duplicate-detection.ts
// Duplicate and near-duplicate detection for Hassaniya text

import { normalizeHassaniyaText } from './validations'

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
export function levenshteinSimilarity(a: string, b: string): number {
  const la = a.length
  const lb = b.length
  if (la === 0) return lb === 0 ? 1 : 0
  if (lb === 0) return 0

  const matrix: number[][] = Array.from({ length: la + 1 }, (_, i) =>
    Array.from({ length: lb + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )

  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }

  const maxLen = Math.max(la, lb)
  return 1 - matrix[la][lb] / maxLen
}

/**
 * Normalize text for comparison
 */
export function prepareForComparison(text: string): string {
  return normalizeHassaniyaText(text)
    .replace(/[^\u0600-\u06FF\s]/g, '') // keep Arabic chars only
    .replace(/\s+/g, ' ')
    .trim()
}

export interface DuplicateResult {
  isExactDuplicate: boolean
  isNearDuplicate: boolean
  similarity: number
  duplicateOfId?: string
}

/**
 * Check if text is duplicate against existing normalized texts
 */
export function checkDuplicate(
  newText: string,
  existingEntries: Array<{ id: string; normalizedText: string }>,
  threshold = 0.85
): DuplicateResult {
  const normalized = prepareForComparison(newText)

  for (const entry of existingEntries) {
    const existing = prepareForComparison(entry.normalizedText)

    // Exact match
    if (normalized === existing) {
      return {
        isExactDuplicate: true,
        isNearDuplicate: false,
        similarity: 1.0,
        duplicateOfId: entry.id,
      }
    }

    // Near-duplicate
    const similarity = levenshteinSimilarity(normalized, existing)
    if (similarity >= threshold) {
      return {
        isExactDuplicate: false,
        isNearDuplicate: true,
        similarity,
        duplicateOfId: entry.id,
      }
    }
  }

  return { isExactDuplicate: false, isNearDuplicate: false, similarity: 0 }
}
