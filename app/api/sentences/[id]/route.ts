import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parallelSentenceSchema, normalizeHassaniyaText } from '@/lib/validations'
import { ok, unauthorized, forbidden, notFound, serverError, validationError, requireAuth } from '@/lib/api-helpers'
import { normalizeTextViaEdge } from '@/app/actions/normalizeText'

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const sentence = await prisma.parallelSentence.findUnique({
      where: { id: params.id },
      include: { contributor: { select: { id: true, name: true } }, reviewer: { select: { id: true, name: true } } },
    })
    if (!sentence) return notFound('الجملة')
    return ok(sentence)
  } catch (e) { return serverError(e) }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth()
    if (!user) return unauthorized()

    const existing = await prisma.parallelSentence.findUnique({ where: { id: params.id } })
    if (!existing) return notFound('الجملة')

    const isOwner = existing.contributorId === (user as { id?: string }).id
    const isReviewer = ['REVIEWER', 'ADMIN'].includes((user as { role?: string }).role ?? '')
    if (!isOwner && !isReviewer) return forbidden()

    const body = await req.json()
    const parsed = parallelSentenceSchema.partial().safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const updates: any = {}
    if (parsed.data.hassaniyaSentence) {
      updates.rawText = parsed.data.hassaniyaSentence
      try {
        const result = await normalizeTextViaEdge({ text: parsed.data.hassaniyaSentence })
        updates.normalizedText = result.normalized
      } catch {
        updates.normalizedText = normalizeHassaniyaText(parsed.data.hassaniyaSentence)
      }
    }
    if (parsed.data.msaTranslation !== undefined) updates.msaTranslation = parsed.data.msaTranslation
    if (parsed.data.frenchTranslation !== undefined) updates.frenchTranslation = parsed.data.frenchTranslation
    if (parsed.data.category !== undefined) updates.category = parsed.data.category
    if (parsed.data.domain !== undefined) updates.domain = parsed.data.domain
    if (parsed.data.intent !== undefined) updates.intent = parsed.data.intent
    if (parsed.data.region !== undefined) updates.region = parsed.data.region
    if (parsed.data.emotionalTone !== undefined) updates.emotionalTone = parsed.data.emotionalTone
    if (parsed.data.styleType !== undefined) updates.styleType = parsed.data.styleType
    updates.version = { increment: 1 }

    const updated = await prisma.parallelSentence.update({
      where: { id: params.id },
      data: updates,
    })
    return ok(updated)
  } catch (e) {
    console.error('PATCH /api/sentences/[id] error:', e)
    return serverError(e)
  }
}
