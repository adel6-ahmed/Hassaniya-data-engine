// app/api/admin/duplicates/route.ts
// ADMIN-only endpoint: list flagged near-duplicate parallel sentence entries for review.

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, forbidden, ok, parsePagination, serverError } from '@/lib/api-helpers'

function truncate(text: string | null | undefined, max = 250) {
  if (!text) return null
  return text.length > max ? text.slice(0, max) + '...' : text
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole('ADMIN')
    if (!user) return forbidden()

    const { page, pageSize, skip } = parsePagination(req)

    // Fetch parallel sentence duplicates.
    const parallel = await prisma.parallelSentence.findMany({
      where: { isDuplicate: true },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true,
        normalizedText: true,
        rawText: true,
        domain: true,
        region: true,
        confidenceLevel: true,
        duplicateOfId: true,
        updatedAt: true,
      },
    })

    // Resolve duplicateOf objects
    const originalIds = parallel.map((d) => d.duplicateOfId).filter(Boolean) as string[]

    const originals = originalIds.length
      ? await prisma.parallelSentence.findMany({
          where: { id: { in: originalIds } },
          select: { id: true, rawText: true, normalizedText: true, domain: true, region: true },
        })
      : []

    const originalMap = new Map(originals.map((x) => [x.id, x] as const))

    const duplicates = parallel.map((d) => ({
      sourceType: 'ParallelSentence',
      entry: {
        id: d.id,
        rawText: truncate(d.rawText, 500),
        normalizedText: d.normalizedText,
        domain: d.domain,
        region: d.region,
        confidenceLevel: d.confidenceLevel,
      },
      duplicateOf: d.duplicateOfId ? originalMap.get(d.duplicateOfId) ?? null : null,
      updatedAt: d.updatedAt,
    }))

    return ok(duplicates, { page, pageSize, total: duplicates.length } as any)
  } catch (e) {
    console.error('GET /api/admin/duplicates error:', e)
    return serverError((e as Error).message)
  }
}
