// Utility functions for deduplication similarity + ingestion rejection rules.

export function confidenceIntTo01(confidenceLevel: number): number {
  // Existing UI/DB uses Int 1-5. Map to 0-1 for Fix 4 rejection rules.
  return Math.max(0, Math.min(1, confidenceLevel / 5))
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function singleCharRepetitionRatio(text: string): number {
  const normalized = text.replace(/\s+/g, '')
  if (!normalized.length) return 0
  const freq: Record<string, number> = {}
  for (const ch of normalized) {
    freq[ch] = (freq[ch] || 0) + 1
  }
  const maxFreq = Math.max(...Object.values(freq))
  return maxFreq / normalized.length
}

// Levenshtein distance based similarity in [0,1]
export function levenshteinSimilarity(a: string, b: string): number {
  const la = a.length
  const lb = b.length
  if (la === 0) return lb === 0 ? 1 : 0
  if (lb === 0) return 0

  const dp: number[][] = Array.from({ length: la + 1 }, () => new Array(lb + 1).fill(0))
  for (let i = 0; i <= la; i++) dp[i][0] = i
  for (let j = 0; j <= lb; j++) dp[0][j] = j

  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      )
    }
  }

  const dist = dp[la][lb]
  const maxLen = Math.max(la, lb)
  return 1 - dist / maxLen
}

export function jaccardSimilarityOnTokens(a: string, b: string): number {
  const tokensA = new Set(a.trim().split(/\s+/).filter(Boolean))
  const tokensB = new Set(b.trim().split(/\s+/).filter(Boolean))
  if (tokensA.size === 0 && tokensB.size === 0) return 1
  if (tokensA.size === 0 || tokensB.size === 0) return 0

  let intersection = 0
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++
  }
  const union = tokensA.size + tokensB.size - intersection
  return union === 0 ? 0 : intersection / union
}

export function nearDuplicateSimilarity(normalizedTextA: string, normalizedTextB: string): number {
  // Fix 4: short texts (<=100 chars) => Levenshtein similarity
  // long texts (>100 chars) => Jaccard similarity on word tokens
  const len = normalizedTextA.length
  if (len <= 100) {
    return levenshteinSimilarity(normalizedTextA, normalizedTextB)
  }
  return jaccardSimilarityOnTokens(normalizedTextA, normalizedTextB)
}

export function nearDuplicateThreshold(normalizedText: string): number {
  return normalizedText.length <= 100 ? 0.85 : 0.75
}

// Re-export to keep legacy imports stable across API routes.
export { dedupRejectionRules } from './rejection'

