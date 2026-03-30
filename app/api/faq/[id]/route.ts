// app/api/faq/[id]/route.ts

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { faqEntrySchema } from '@/lib/validations'
import {
  ok, unauthorized, forbidden, notFound, serverError,
  validationError, requireAuth,
} from '@/lib/api-helpers'
import { normalizeTextViaEdge } from '@/app/actions/normalizeText'
import { normalizeHassaniyaText } from '@/lib/validations'

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const entry = await prisma.faqEntry.findUnique({
      where: { id: params.id },
      include: {
        contributor: { select: { id: true, name: true } },
        reviewer:    { select: { id: true, name: true } },
      },
    })
    if (!entry) return notFound('السؤال')
    return ok(entry)
  } catch (e) { return serverError(e) }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth()
    if (!user) return unauthorized()

    const existing = await prisma.faqEntry.findUnique({ where: { id: params.id } })
    if (!existing) return notFound('السؤال')

    const isOwner    = existing.contributorId === (user as { id?: string }).id
    const isReviewer = ['REVIEWER', 'ADMIN'].includes((user as { role?: string }).role ?? '')
    if (!isOwner && !isReviewer) return forbidden()

    const body   = await req.json()
    const parsed = faqEntrySchema.partial().safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    // Prepare update data with only existing fields
    const updates: any = {}
    
    if (parsed.data.questionHassaniya) {
      updates.rawQuestion = parsed.data.questionHassaniya
      try {
        const result = await normalizeTextViaEdge({ text: parsed.data.questionHassaniya })
        updates.normalizedQuestion = result.normalized
      } catch {
        updates.normalizedQuestion = normalizeHassaniyaText(parsed.data.questionHassaniya)
      }
    }
    
    if (parsed.data.questionMsa !== undefined) updates.questionMsa = parsed.data.questionMsa
    if (parsed.data.answerHassaniya !== undefined) updates.answerHassaniya = parsed.data.answerHassaniya
    if (parsed.data.answerMsa !== undefined) updates.answerMsa = parsed.data.answerMsa
    if (parsed.data.answerFrench !== undefined) updates.answerFrench = parsed.data.answerFrench
    if (parsed.data.domain !== undefined) updates.domain = parsed.data.domain
    if (parsed.data.intent !== undefined) updates.intent = parsed.data.intent
    if (parsed.data.sourceType !== undefined) updates.sourceType = parsed.data.sourceType
    if (parsed.data.validFrom !== undefined) updates.validFrom = parsed.data.validFrom ? new Date(parsed.data.validFrom) : null
    if (parsed.data.validUntil !== undefined) updates.validUntil = parsed.data.validUntil ? new Date(parsed.data.validUntil) : null
    if (parsed.data.isActive !== undefined) updates.isActive = parsed.data.isActive

    updates.version = { increment: 1 }

    const updated = await prisma.faqEntry.update({
      where: { id: params.id },
      data: updates,
    })

    return ok(updated)
  } catch (e) {
    console.error('PATCH /api/faq/[id] error:', e)
    return serverError(e)
  }
}
