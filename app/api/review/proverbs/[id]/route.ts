import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { forbidden, requireRole, serverError } from '@/lib/api-helpers'
import { CurationStage, ReviewStatus } from '@prisma/client'
import { z } from 'zod'

type Params = { params: { id: string } }

const reviewPatchSchema = z.object({
  action: z.enum(['approve', 'review', 'reject']).optional(),
  reviewStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVISION']).optional(),
  curationStage: z.enum(['RAW', 'REVIEWED', 'NORMALIZED', 'EXPORT_READY']).optional(),
  // Edit fields
  proverbText: z.string().optional(),
  meaningExplanation: z.string().optional(),
  literalTranslation: z.string().optional(),
  frenchTranslation: z.string().optional(),
})

const actionToReviewStatus = {
  approve: 'APPROVED',
  review: 'NEEDS_REVISION',
  reject: 'REJECTED',
} as const

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const reviewer = await requireRole('REVIEWER')
    if (!reviewer) return forbidden()
    if (!prisma) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })
    }

    // Verify reviewer exists in database
    const reviewerInDb = await prisma.user.findUnique({
      where: { id: reviewer.id },
      select: { id: true },
    })

    const body = await req.json()
    const parsed = reviewPatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: `Invalid review payload: ${parsed.error.message}` }, { status: 422 })
    }

    let { action, reviewStatus, curationStage, proverbText, meaningExplanation, literalTranslation, frenchTranslation } = parsed.data
    if (action) {
      reviewStatus = actionToReviewStatus[action]
    }

    if (!reviewStatus) {
      return NextResponse.json({ success: false, error: 'reviewStatus is required' }, { status: 400 })
    }

    if (!Object.values(ReviewStatus).includes(reviewStatus as ReviewStatus)) {
      return NextResponse.json({ success: false, error: 'Invalid reviewStatus value' }, { status: 400 })
    }

    if (!curationStage && (reviewStatus === 'APPROVED' || reviewStatus === 'NEEDS_REVISION')) {
      curationStage = 'REVIEWED'
    }

    const updateData: any = {
      reviewStatus,
      lastVerifiedAt: new Date(),
      isExportReady: reviewStatus === 'APPROVED',
      reviewerId: reviewer.id,
    }
    if (curationStage) updateData.curationStage = curationStage
    if (proverbText !== undefined) updateData.proverbText = proverbText
    if (meaningExplanation !== undefined) updateData.meaningExplanation = meaningExplanation
    if (literalTranslation !== undefined) updateData.literalTranslation = literalTranslation
    if (frenchTranslation !== undefined) updateData.frenchTranslation = frenchTranslation
    const updated = await prisma.proverb.update({
      where: { id: params.id },
      data: updateData,
    })
    
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return serverError(error)
  }
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const reviewer = await requireRole('REVIEWER')
    if (!reviewer) return forbidden()
    if (!prisma) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })
    }

    const item = await prisma.proverb.findUnique({
      where: { id: params.id },
    })
    if (!item) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: item })
  } catch (error) {
    return serverError(error)
  }
}
