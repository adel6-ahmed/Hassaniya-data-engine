// app/api/dialogues/[id]/route.ts

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  ok, unauthorized, forbidden, notFound, serverError,
  requireAuth, requireRole,
} from '@/lib/api-helpers'

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const dialogue = await prisma.dialogue.findUnique({
      where: { id: params.id },
      include: {
        turns: {
          orderBy: { turnIndex: 'asc' },
          include: { contributor: { select: { id: true, name: true } } },
        },
      },
    })
    if (!dialogue) return notFound('الحوار')
    return ok(dialogue)
  } catch (e) { return serverError(e) }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth()
    if (!user) return unauthorized()

    const isReviewer = ['REVIEWER', 'ADMIN'].includes((user as { role?: string }).role ?? '')
    if (!isReviewer) return forbidden()

    const body = await req.json()
    const updated = await prisma.dialogue.update({
      where: { id: params.id },
      data: {
        ...(body.title        && { title: body.title }),
        ...(body.domain       && { domain: body.domain }),
        ...(body.reviewStatus && { reviewStatus: body.reviewStatus }),
        ...(body.curationStage && { curationStage: body.curationStage }),
        ...(body.isExportReady !== undefined && { isExportReady: body.isExportReady }),
        ...(body.reviewStatus === 'APPROVED' ? { isExportReady: true } : {}),
        ...((body.reviewStatus === 'REJECTED' || body.reviewStatus === 'NEEDS_REVISION') ? { isExportReady: false } : {}),
      },
    })
    return ok(updated)
  } catch (e) { return serverError(e) }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireRole('ADMIN')
    if (!user) return forbidden()
    await prisma.dialogue.delete({ where: { id: params.id } })
    return ok({ deleted: true })
  } catch (e) { return serverError(e) }
}
