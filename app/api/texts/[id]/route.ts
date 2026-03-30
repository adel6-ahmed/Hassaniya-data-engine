import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { monolingualTextSchema, normalizeHassaniyaText } from '@/lib/validations'
import { ok, unauthorized, forbidden, notFound, serverError, validationError, requireAuth } from '@/lib/api-helpers'
import { normalizeTextViaEdge } from '@/app/actions/normalizeText'

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const text = await prisma.monolingualText.findUnique({
      where: { id: params.id },
      include: { contributor: { select: { id: true, name: true } }, reviewer: { select: { id: true, name: true } } },
    })
    if (!text) return notFound('النص')
    return ok(text)
  } catch (e) { return serverError(e) }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth()
    if (!user) return unauthorized()

    const existing = await prisma.monolingualText.findUnique({ where: { id: params.id } })
    if (!existing) return notFound('النص')

    const isOwner = existing.contributorId === (user as { id?: string }).id
    const isReviewer = ['REVIEWER', 'ADMIN'].includes((user as { role?: string }).role ?? '')
    if (!isOwner && !isReviewer) return forbidden()

    const body = await req.json()
    const parsed = monolingualTextSchema.partial().safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const updates: any = {}
    if (parsed.data.hassaniyaText) {
      updates.rawText = parsed.data.hassaniyaText
      try {
        const result = await normalizeTextViaEdge({ text: parsed.data.hassaniyaText })
        updates.normalizedText = result.normalized
      } catch {
        updates.normalizedText = normalizeHassaniyaText(parsed.data.hassaniyaText)
      }
      updates.wordCount = parsed.data.hassaniyaText.trim().split(/\s+/).length
      updates.characterCount = parsed.data.hassaniyaText.length
    }
    if (parsed.data.title !== undefined) updates.title = parsed.data.title
    if (parsed.data.topic !== undefined) updates.topic = parsed.data.topic
    if (parsed.data.domain !== undefined) updates.domain = parsed.data.domain
    if (parsed.data.region !== undefined) updates.region = parsed.data.region
    if (parsed.data.writingStyle !== undefined) updates.writingStyle = parsed.data.writingStyle
    if (parsed.data.emotionalTone !== undefined) updates.emotionalTone = parsed.data.emotionalTone
    if (parsed.data.sourceType !== undefined) updates.sourceType = parsed.data.sourceType
    if (parsed.data.sourceUrl !== undefined) updates.sourceUrl = parsed.data.sourceUrl
    if (parsed.data.isSegmented !== undefined) updates.isSegmented = parsed.data.isSegmented
    updates.version = { increment: 1 }

    const updated = await prisma.monolingualText.update({
      where: { id: params.id },
      data: updates,
    })
    return ok(updated)
  } catch (e) {
    console.error('PATCH /api/texts/[id] error:', e)
    return serverError(e)
  }
}
