// app/api/sentences/route.ts
// Parallel Sentences — List & Create

import { NextRequest, NextResponse } from 'next/server'
import { CurationStage, Domain, Intent, Prisma, Region, ReviewStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { parallelSentenceSchema, checkTextQuality, normalizeHassaniyaText } from '@/lib/validations'
import {
  ok, created, badRequest, serverError,
  validationError, parsePagination, buildMeta, parseFilters,
} from '@/lib/api-helpers'
import { auth } from '@/auth'
import { normalizeTextViaEdge } from '@/app/actions/normalizeText'
import { getPublicContributorId } from '@/lib/public-contributor'
import crypto from 'crypto'

type SentenceListFilters = {
  domain?: string
  intent?: string
  region?: string
  reviewStatus?: string
  curationStage?: string
  isExportReady?: boolean
  contributorId?: string
  search?: string
}

export async function GET(req: NextRequest) {
  try {
    const { page, pageSize, skip } = parsePagination(req)
    const filters = parseFilters(req) as SentenceListFilters

    const where: Prisma.ParallelSentenceWhereInput = {}
    if (filters.domain && Object.values(Domain).includes(filters.domain as Domain)) {
      where.domain = filters.domain as Domain
    }
    if (filters.intent && Object.values(Intent).includes(filters.intent as Intent)) {
      where.intent = filters.intent as Intent
    }
    if (filters.region && Object.values(Region).includes(filters.region as Region)) {
      where.region = filters.region as Region
    }
    if (filters.reviewStatus && Object.values(ReviewStatus).includes(filters.reviewStatus as ReviewStatus)) {
      where.reviewStatus = filters.reviewStatus as ReviewStatus
    }
    if (filters.curationStage && Object.values(CurationStage).includes(filters.curationStage as CurationStage)) {
      where.curationStage = filters.curationStage as CurationStage
    }
    if (filters.isExportReady !== undefined) {
      where.isExportReady = filters.isExportReady
    }
    if (filters.contributorId) where.contributorId = filters.contributorId
    if (filters.search) {
      where.OR = [
        { hassaniyaSentence: { contains: filters.search } },
        { msaTranslation: { contains: filters.search } },
      ]
    }
    const [total, sentences] = await Promise.all([
      prisma.parallelSentence.count({ where }),
      prisma.parallelSentence.findMany({
        where, skip, take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          contributor: { select: { id: true, name: true, region: true } },
          reviewer: { select: { id: true, name: true } },
          variationGroup: { select: { id: true, meaningArabic: true } },
        },
      }),
    ])
    return ok(sentences, buildMeta(total, page, pageSize))
  } catch (e) { return serverError(e) }
}

export async function POST(req: NextRequest) {
  try {
    // Resolution order for contributorId (same as dialogues, texts, proverbs & faq routes)
    let resolvedContributorId: string | null = null

    const session = await auth()
    if (session?.user) {
      const sessionUserId = (session.user as { id?: string }).id ?? null
      const sessionUserEmail = (session.user as { email?: string }).email ?? null

      // a) Try to find user by session.user.id
      if (sessionUserId) {
        const userById = await prisma.user.findUnique({
          where: { id: sessionUserId },
          select: { id: true },
        })
        if (userById) {
          resolvedContributorId = userById.id
        }
      }

      // b) If not found by id, try to find by email
      if (!resolvedContributorId && sessionUserEmail) {
        const userByEmail = await prisma.user.findUnique({
          where: { email: sessionUserEmail },
          select: { id: true },
        })
        if (userByEmail) {
          resolvedContributorId = userByEmail.id
        }
      }
    }

    // c) If still not resolved, use fallback public user
    if (!resolvedContributorId) {
      try {
        console.log('Attempting to get public contributor ID')
        resolvedContributorId = await getPublicContributorId()
        console.log('Got public contributor ID:', resolvedContributorId)
      } catch (error) {
        console.error('Failed to get public contributor:', error)
        return NextResponse.json({ success: false, error: 'Unable to resolve contributor', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 })
      }
    }

    // d) Final verification: ensure resolved contributor exists
    if (!resolvedContributorId) {
      return NextResponse.json({ success: false, error: 'Unable to resolve contributor' }, { status: 400 })
    }

    const verifyContributor = await prisma.user.findUnique({
      where: { id: resolvedContributorId },
      select: { id: true },
    })
    if (!verifyContributor) {
      return NextResponse.json({ success: false, error: 'Unable to resolve contributor' }, { status: 400 })
    }

    const body = await req.json()
    const parsed = parallelSentenceSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)
    const data = parsed.data
    const rawText = data.hassaniyaSentence
    
    // Attempt edge function normalization, fallback to local normalization if it fails
    let normalizedText: string
    try {
      const result = await normalizeTextViaEdge({ text: rawText })
      normalizedText = result.normalized
    } catch (edgeError) {
      // Fallback: Use local normalization
      normalizedText = normalizeHassaniyaText(rawText)
      if (!normalizedText || normalizedText.trim() === '') {
        return NextResponse.json(
          { success: false, error: 'Could not normalize text. Submission failed.' },
          { status: 400 }
        )
      }
      // Generate textHash locally
    }
    
    const quality = checkTextQuality(rawText)
    if (!quality.passed) return badRequest(quality.errors.join(', '))

    // No deduplication logic needed - ParallelSentence dedup handled by cron job

    const sentence = await prisma.parallelSentence.create({
      data: {
        hassaniyaSentence: rawText,
        msaTranslation: data.msaTranslation || null,
        frenchTranslation: data.frenchTranslation || null,
        rawText,
        normalizedText,
        category: data.category || null,
        domain: data.domain, intent: data.intent,
        region: data.region, emotionalTone: data.emotionalTone,
        contributorNotes: data.contributorNotes || null,
        verifiedByNativeSpeaker: data.verifiedByNativeSpeaker,
        isDuplicate: false,
        duplicateOfId: null,
        contributorId: resolvedContributorId,
        variationGroupId: data.variationGroupId || null,
      },
    })
    for (const warning of quality.warnings) {
      await prisma.qualityLog.create({
        data: { sourceTable: 'parallel_sentences', sourceId: sentence.id, checkType: 'warning', message: warning, severity: 'warning' },
      })
    }
    return created(sentence, quality.warnings.length ? quality.warnings : undefined)
  } catch (e) {
    // Handle Prisma foreign key constraint errors
    if (e instanceof Error) {
      const errorMessage = e.message || ''
      if (errorMessage.includes('P2003') || errorMessage.includes('Foreign key constraint')) {
        return NextResponse.json({ success: false, error: 'Invalid contributor reference' }, { status: 400 })
      }
    }
    return serverError(e)
  }
}