// app/api/proverbs/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { proverbSchema, checkTextQuality, normalizeHassaniyaText } from '@/lib/validations'
import { created, validationError, badRequest, serverError } from '@/lib/api-helpers'
import { normalizeTextViaEdge } from '@/app/actions/normalizeText'
import { getPublicContributorId } from '@/lib/public-contributor'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    // Resolution order for contributorId (same as dialogues & texts routes)
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
        resolvedContributorId = await getPublicContributorId()
      } catch {
        return NextResponse.json({ success: false, error: 'Unable to resolve contributor' }, { status: 400 })
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
    const parsed = proverbSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const rawText = parsed.data.proverbText
    const quality = checkTextQuality(rawText)
    if (!quality.passed) return badRequest(quality.errors.join(', '))

    // Attempt edge function normalization, fallback to local normalization if it fails
    let normalized: string
    try {
      const result = await normalizeTextViaEdge({ text: rawText })
      normalized = result.normalized
    } catch (edgeError) {
      // Fallback: Use local normalization
      normalized = normalizeHassaniyaText(rawText)
      if (!normalized || normalized.trim() === '') {
        return NextResponse.json(
          { success: false, error: 'Could not normalize text. Submission failed.' },
          { status: 400 }
        )
      }
      // Generate textHash locally
    }

    // No deduplication needed for Proverb

    const createdEntry = await prisma.proverb.create({
      data: {
        proverbText: rawText,
        rawText,
        normalizedText: normalized,
        meaningExplanation: parsed.data.meaningExplanation,
        literalTranslation: parsed.data.literalTranslation ?? null,
        frenchTranslation: parsed.data.frenchTranslation ?? null,
        usageContext: parsed.data.usageContext ?? null,
        category: parsed.data.category ?? 'PROVERB',
        domain: parsed.data.domain,
        region: parsed.data.region,
        verifiedByNativeSpeaker: parsed.data.verifiedByNativeSpeaker,
        contributorId: resolvedContributorId,
      },
    })

    return created(createdEntry, quality.warnings.length ? quality.warnings : undefined)
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

