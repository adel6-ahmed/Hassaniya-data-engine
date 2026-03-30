// app/api/review/queue/route.ts
// Pending review queue — all modules combined

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, forbidden, serverError, requireRole } from '@/lib/api-helpers'
import { ReviewStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole('REVIEWER')
    if (!user) return forbidden()

    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '10')

    const [sentences, texts, proverbs, faqs] = await Promise.all([
      prisma.parallelSentence.findMany({
        where: { reviewStatus: 'PENDING' as ReviewStatus },
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: { contributor: { select: { id: true, name: true } } },
      }),
      prisma.monolingualText.findMany({
        where: { reviewStatus: 'PENDING' as ReviewStatus },
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: { contributor: { select: { id: true, name: true } } },
      }),
      prisma.proverb.findMany({
        where: { reviewStatus: 'PENDING' as ReviewStatus },
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: { contributor: { select: { id: true, name: true } } },
      }),
      prisma.faqEntry.findMany({
        where: { reviewStatus: 'PENDING' as ReviewStatus },
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: { contributor: { select: { id: true, name: true } } },
      }),
    ])

    return ok({
      sentences: { count: sentences.length, items: sentences },
      texts: { count: texts.length, items: texts },
      proverbs: { count: proverbs.length, items: proverbs },
      faqs: { count: faqs.length, items: faqs },
      total: sentences.length + texts.length + proverbs.length + faqs.length,
    })
  } catch (e) {
    return serverError(e)
  }
}
