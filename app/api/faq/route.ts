// app/api/faq/route.ts
// Create FAQ entry with edge-function normalization.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { faqEntrySchema, checkTextQuality, normalizeHassaniyaText } from '@/lib/validations'
import { created, validationError, badRequest, serverError } from '@/lib/api-helpers'
import { normalizeTextViaEdge } from '@/app/actions/normalizeText'
import { getPublicContributorId } from '@/lib/public-contributor'

export async function POST(req: NextRequest) {
  try {
    // Resolution order for contributorId (same as dialogues, texts, & proverbs routes)
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
    const parsed = faqEntrySchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const rawQuestion = parsed.data.questionHassaniya
    const quality = checkTextQuality(rawQuestion)
    if (!quality.passed) return badRequest(quality.errors.join(', '))

    // Attempt edge function normalization, fallback to local normalization if it fails
    let normalized: string
    try {
      const result = await normalizeTextViaEdge({ text: rawQuestion })
      normalized = result.normalized
    } catch (edgeError) {
      // Fallback: Use local normalization
      normalized = normalizeHassaniyaText(rawQuestion)
      if (!normalized || normalized.trim() === '') {
        return NextResponse.json(
          { success: false, error: 'Could not normalize text. Submission failed.' },
          { status: 400 }
        )
      }
    }

    const validFrom = parsed.data.validFrom ? new Date(parsed.data.validFrom) : null
    const validUntil = parsed.data.validUntil ? new Date(parsed.data.validUntil) : null

    const createdEntry = await prisma.faqEntry.create({
      data: {
        questionHassaniya: rawQuestion,
        rawQuestion,
        normalizedQuestion: normalized,
        questionMsa: parsed.data.questionMsa ?? null,
        answerHassaniya: parsed.data.answerHassaniya,
        answerMsa: parsed.data.answerMsa ?? null,
        answerFrench: parsed.data.answerFrench ?? null,
        domain: parsed.data.domain,
        intent: parsed.data.intent,
        sourceType: parsed.data.sourceType,
        validFrom,
        validUntil,
        isActive: parsed.data.isActive,
        contributorId: resolvedContributorId,
      },
    })

    return created(createdEntry)
  } catch (e) {
    console.error('POST /api/faq error:', e)
    return serverError(e)
  }
}
