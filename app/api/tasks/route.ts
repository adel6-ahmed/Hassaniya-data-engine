import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma, TaskStatus } from '@prisma/client'
import { serverError } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const status = url.searchParams.get('status') || 'ACTIVE'
    const where: Prisma.ContributorTaskWhereInput = {}
    if (Object.values(TaskStatus).includes(status as TaskStatus)) {
      where.status = status as TaskStatus
    }

    const tasks = await prisma.contributorTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true } },
        assignee:  { select: { id: true, name: true } },
        _count: { select: { submissions: true } },
      },
    })
    return NextResponse.json({ success: true, data: tasks })
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const task = await prisma.contributorTask.create({ data: body })
    return NextResponse.json({ success: true, data: task }, { status: 201 })
  } catch (e) {
    return serverError(e)
  }
}
