// app/api/tasks/[id]/route.ts

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import {
  ok, unauthorized, forbidden, notFound, serverError,
  validationError, requireAuth, requireRole,
} from '@/lib/api-helpers'

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const task = await prisma.contributorTask.findUnique({
      where: { id: params.id },
      include: {
        createdBy:   { select: { id: true, name: true } },
        assignee:    { select: { id: true, name: true } },
        submissions: {
          take: 20,
          orderBy: { submittedAt: 'desc' },
          include: { contributor: { select: { id: true, name: true } } },
        },
        _count: { select: { submissions: true } },
      },
    })
    if (!task) return notFound('المهمة')
    return ok(task)
  } catch (e) { return serverError(e) }
}

const updateTaskSchema = z.object({
  status:     z.enum(['ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED']).optional(),
  assigneeId: z.string().optional().nullable(),
  dueDate:    z.string().datetime().optional().nullable(),
  targetCount: z.number().int().min(1).optional(),
})

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireRole('ADMIN')
    if (!user) return forbidden()

    const body   = await req.json()
    const parsed = updateTaskSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const updated = await prisma.contributorTask.update({
      where: { id: params.id },
      data: {
        ...(parsed.data.status      && { status: parsed.data.status }),
        ...(parsed.data.targetCount && { targetCount: parsed.data.targetCount }),
        ...(parsed.data.assigneeId !== undefined && { assigneeId: parsed.data.assigneeId }),
        ...(parsed.data.dueDate    !== undefined && { dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null }),
      },
    })
    return ok(updated)
  } catch (e) { return serverError(e) }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireRole('ADMIN')
    if (!user) return forbidden()
    await prisma.contributorTask.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' },
    })
    return ok({ cancelled: true })
  } catch (e) { return serverError(e) }
}

// ── POST /api/tasks/:id/submit — log a contribution to this task ──

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth()
    if (!user) return unauthorized()

    const body = await req.json()
    const { sourceTable, sourceId } = body

    if (!sourceTable || !sourceId) {
      return notFound('sourceTable و sourceId مطلوبان')
    }

    const submission = await prisma.taskSubmission.upsert({
      where: {
        taskId_contributorId_sourceId: {
          taskId:        params.id,
          contributorId: (user as { id?: string }).id ?? '',
          sourceId,
        },
      },
      create: {
        taskId:        params.id,
        contributorId: (user as { id?: string }).id ?? '',
        sourceTable,
        sourceId,
      },
      update: {},
    })

    return ok(submission)
  } catch (e) { return serverError(e) }
}
