import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Domain, Prisma } from '@prisma/client'
import { serverError } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
    const domain = url.searchParams.get('domain')
    const where: Prisma.VariationGroupWhereInput = {}
    if (domain && Object.values(Domain).includes(domain as Domain)) {
      where.domain = domain as Domain
    }
    const groups = await prisma.variationGroup.findMany({
      where,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { parallelSentences: true } },
      },
    })
    return NextResponse.json({ success: true, data: groups })
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const group = await prisma.variationGroup.create({ data: body })
    return NextResponse.json({ success: true, data: group }, { status: 201 })
  } catch (e) {
    return serverError(e)
  }
}
