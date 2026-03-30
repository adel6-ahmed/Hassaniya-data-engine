import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { proverbSchema, normalizeHassaniyaText } from '@/lib/validations'
import { ok, unauthorized, forbidden, notFound, serverError, validationError, requireAuth } from '@/lib/api-helpers'
import { normalizeTextViaEdge } from '@/app/actions/normalizeText'

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const proverb = await prisma.proverb.findUnique({
      where: { id: params.id },
      include: { contributor: { select: { id: true, name: true } }, reviewer: { select: { id: true, name: true } } },
    })
    if (!proverb) return notFound('المثل')
    return ok(proverb)
  } catch (e) { return serverError(e) }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth()
    if (!user) return unauthorized()

    const existing = await prisma.proverb.findUnique({ where: { id: params.id } })
    if (!existing) return notFound('المثل')

    const isOwner = existing.contributorId === (user as { id?: string }).id
    const isReviewer = ['REVIEWER', 'ADMIN'].includes((user as { role?: string }).role ?? '')
    if (!isOwner && !isReviewer) return forbidden()

    const body = await req.json()
    const parsed = proverbSchema.partial().safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const updates: any = {}
    if (parsed.data.proverbText) {
      updates.rawText = parsed.data.proverbText
      try {
        const result = await normalizeTextViaEdge({ text: parsed.data.proverbText })
        updates.normalizedText = result.normalized
      } catch {
        updates.normalizedText = normalizeHassaniyaText(parsed.data.proverbText)
      }
    }
    if (parsed.data.meaningExplanation !== undefined) updates.meaningExplanation = parsed.data.meaningExplanation
    if (parsed.data.literalTranslation !== undefined) updates.literalTranslation = parsed.data.literalTranslation
    if (parsed.data.frenchTranslation !== undefined) updates.frenchTranslation = parsed.data.frenchTranslation
    if (parsed.data.usageContext !== undefined) updates.usageContext = parsed.data.usageContext
    if (parsed.data.category !== undefined) updates.category = parsed.data.category
    if (parsed.data.domain !== undefined) updates.domain = parsed.data.domain
    if (parsed.data.region !== undefined) updates.region = parsed.data.region
    updates.version = { increment: 1 }

    const updated = await prisma.proverb.update({
      where: { id: params.id },
      data: updates,
    })
    return ok(updated)
  } catch (e) {
    console.error('PATCH /api/proverbs/[id] error:', e)
    return serverError(e)
  }
}
