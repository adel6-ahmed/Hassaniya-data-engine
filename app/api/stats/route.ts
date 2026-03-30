import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, serverError, unauthorized } from '@/lib/api-helpers'
import { ReviewStatus } from '@prisma/client'

export async function GET(_req: NextRequest) {
  try {
    const user = await requireAuth()
    if (!user) return unauthorized()

    // Fail fast if DB is unavailable.
    if (!prisma || process.env.SKIP_DB_INIT === 'true') {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })
    }

    const [
      totalSentences,
      totalTexts,
      totalProverbs,
      totalDialogues,
      totalFaqs,
      pendingSentences,
      exportReadySentences,
      duplicateFlags,
      sentencesByDomain,
      recentActivity,
    ] = await Promise.all([
      prisma.parallelSentence.count(),
      prisma.monolingualText.count(),
      prisma.proverb.count(),
      prisma.dialogue.count(),
      prisma.faqEntry.count(),
      prisma.parallelSentence.count({ where: { reviewStatus: 'PENDING' as ReviewStatus } }),
      prisma.parallelSentence.count({ where: { isExportReady: true } }),
      prisma.duplicateFlag.count({ where: { isResolved: false } }),
      prisma.parallelSentence.groupBy({
        by: ['domain'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.parallelSentence.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          hassaniyaSentence: true,
          createdAt: true,
          reviewStatus: true,
          contributor: { select: { name: true } },
        },
      }),
    ])

    const totalEntries = totalSentences + totalTexts + totalProverbs + totalDialogues + totalFaqs

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalEntries,
          totalSentences,
          totalTexts,
          totalProverbs,
          totalDialogues,
          totalFaqs,
        },
        quality: {
          totalPending: pendingSentences,
          exportReadySentences,
          duplicateFlags,
        },
        breakdown: {
          sentencesByDomain,
        },
        recentActivity,
      },
    })
  } catch (error) {
    return serverError(error)
  }
}
