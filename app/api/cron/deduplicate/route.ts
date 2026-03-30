// app/api/cron/deduplicate/route.ts
// Nightly near-duplicate detection.

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { nearDuplicateSimilarity, nearDuplicateThreshold } from '@/lib/dedup/dedup-utils'

const GROUP_WINDOW = 250
const MAX_GROUPS = 50
const MAX_COMPARE_PER_BASE = 60

async function flagNearDuplicatesParallelSentences() {
  const groups = await prisma.parallelSentence.groupBy({
    by: ['domain', 'region'],
    where: { isDuplicate: false },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: MAX_GROUPS,
  })

  let flagged = 0

  for (const g of groups) {
    const candidates = await prisma.parallelSentence.findMany({
      where: {
        domain: g.domain,
        region: g.region,
        isDuplicate: false,
      },
      select: {
        id: true,
        normalizedText: true,
        confidenceLevel: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: GROUP_WINDOW,
    })

    const sorted = [...candidates].sort((a, b) => {
      if (b.confidenceLevel !== a.confidenceLevel) return b.confidenceLevel - a.confidenceLevel
      return a.createdAt.getTime() - b.createdAt.getTime()
    })

    const alreadyFlagged = new Set<string>()
    for (let i = 0; i < sorted.length; i++) {
      const base = sorted[i]
      if (alreadyFlagged.has(base.id)) continue

      const baseText = base.normalizedText as string
      const thr = nearDuplicateThreshold(baseText)
      let compared = 0

      for (let j = i + 1; j < sorted.length && compared < MAX_COMPARE_PER_BASE; j++) {
        const cand = sorted[j]
        compared++
        if (alreadyFlagged.has(cand.id)) continue
        if (!cand.normalizedText) continue

        const sim = nearDuplicateSimilarity(baseText, cand.normalizedText as string)
        if (sim >= thr) {
          const shouldKeepBase =
            base.confidenceLevel > cand.confidenceLevel ||
            (base.confidenceLevel === cand.confidenceLevel && base.createdAt.getTime() <= cand.createdAt.getTime())
          if (!shouldKeepBase) continue

          await prisma.parallelSentence.update({
            where: { id: cand.id },
            data: {
              isDuplicate: true,
              duplicateOfId: base.id,
            },
          })
          alreadyFlagged.add(cand.id)
          flagged++
        }
      }
    }
  }

  return { flagged }
}

export async function POST(req: NextRequest) {
  try {
    // Verify cron secret if needed
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 })
    }

    const result = await flagNearDuplicatesParallelSentences()

    return Response.json(result)
  } catch (e) {
    console.error('POST /api/cron/deduplicate error:', e)
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}
