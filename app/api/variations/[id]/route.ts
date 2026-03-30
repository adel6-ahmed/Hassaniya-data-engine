// app/api/variations/[id]/route.ts
// Get group details + add a sentence to an existing variation group

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { EmotionalTone, Region, StyleType } from '@prisma/client'
import {
  ok, created, unauthorized, forbidden, notFound, serverError,
  validationError, requireAuth, requireRole,
} from '@/lib/api-helpers'
import { checkTextQuality, normalizeHassaniyaText } from '@/lib/validations'
import { normalizeTextViaEdge } from '@/app/actions/normalizeText'

type Params = { params: { id: string } }

// ── GET /api/variations/:id ──────────────────────────────────────
// Full group with all its variants

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const group = await prisma.variationGroup.findUnique({
      where: { id: params.id },
      include: {
        createdBy: { select: { id: true, name: true } },
        parallelSentences: {
          orderBy: { createdAt: 'asc' },
          include: { contributor: { select: { id: true, name: true } } },
        },
        _count: { select: { parallelSentences: true } },
      },
    })
    if (!group) return notFound('مجموعة التنويع')
    return ok(group)
  } catch (e) { return serverError(e) }
}

// ── POST /api/variations/:id ─────────────────────────────────────
// Add a new sentence variant to this group

const addVariantSchema = z.object({
  hassaniyaSentence: z
    .string()
    .min(1, 'الجملة مطلوبة')
    .refine(v => v.trim().split(/\s+/).length >= 2, 'كلمتان على الأقل')
    .refine(v => v.trim().split(/\s+/).length <= 40, '40 كلمة كحد أقصى'),
  msaTranslation:    z.string().optional(),
  frenchTranslation: z.string().optional(),
  region:            z.string().optional(),
  emotionalTone:     z.string().optional(),
  styleType:         z.string().optional(),
  confidenceLevel:   z.number().int().min(1).max(5).default(3),
  verifiedByNativeSpeaker: z.boolean().default(false),
})

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth()
    if (!user) return unauthorized()

    // Verify user exists in database and get their ID
    const sessionUserId = (user as { id?: string }).id ?? null
    const sessionUserEmail = (user as { email?: string }).email ?? null
    
    let resolvedContributorId: string | null = null
    
    if (sessionUserId) {
      const userById = await prisma.user.findUnique({
        where: { id: sessionUserId },
        select: { id: true },
      })
      if (userById) {
        resolvedContributorId = userById.id
      }
    }
    
    if (!resolvedContributorId && sessionUserEmail) {
      const userByEmail = await prisma.user.findUnique({
        where: { email: sessionUserEmail },
        select: { id: true },
      })
      if (userByEmail) {
        resolvedContributorId = userByEmail.id
      }
    }
    
    if (!resolvedContributorId) {
      return NextResponse.json({ success: false, error: 'Unable to resolve contributor' }, { status: 400 })
    }

    // Verify group exists
    const group = await prisma.variationGroup.findUnique({ where: { id: params.id } })
    if (!group) return notFound('مجموعة التنويع')

    const body   = await req.json()
    const parsed = addVariantSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const rawText = parsed.data.hassaniyaSentence
    
    // Attempt edge function normalization, fallback to local normalization if it fails
    let normalizedText: string
    try {
      const result = await normalizeTextViaEdge({ text: rawText })
      normalizedText = result.normalized
    } catch (edgeError) {
      // Fallback: Use local normalization
      normalizedText = normalizeHassaniyaText(rawText)
      if (!normalizedText || normalizedText.trim() === '') {
        return NextResponse.json(
          { success: false, error: 'Could not normalize text. Submission failed.' },
          { status: 400 }
        )
      }
    }

    const region: Region =
      parsed.data.region && Object.values(Region).includes(parsed.data.region as Region)
        ? (parsed.data.region as Region)
        : Region.OTHER
    const emotionalTone: EmotionalTone =
      parsed.data.emotionalTone && Object.values(EmotionalTone).includes(parsed.data.emotionalTone as EmotionalTone)
        ? (parsed.data.emotionalTone as EmotionalTone)
        : EmotionalTone.NEUTRAL
    const styleType: StyleType =
      parsed.data.styleType && Object.values(StyleType).includes(parsed.data.styleType as StyleType)
        ? (parsed.data.styleType as StyleType)
        : StyleType.COLLOQUIAL

    // Quality check
    const quality = checkTextQuality(rawText)
    if (!quality.passed) {
      return NextResponse.json({ success: false, error: quality.errors.join(', ') }, { status: 400 })
    }

    const sentence = await prisma.parallelSentence.create({
      data: {
        hassaniyaSentence:      rawText,
        msaTranslation:         parsed.data.msaTranslation  || null,
        frenchTranslation:      parsed.data.frenchTranslation || null,
        rawText,
        normalizedText,
        domain:                 group.domain,
        intent:                 group.intent,
        region,
        emotionalTone,
        styleType,
        confidenceLevel:        parsed.data.confidenceLevel,
        verifiedByNativeSpeaker: parsed.data.verifiedByNativeSpeaker,
        isDuplicate:            false,
        duplicateOfId:         null,
        contributorId:          resolvedContributorId,
        variationGroupId:       params.id,
      },
    })

    return created({ sentence, warnings: quality.warnings })
  } catch (e) {
    // Handle Prisma foreign key constraint errors
    if (e instanceof Error) {
      const errorMessage = e.message || ''
      if (errorMessage.includes('P2003') || errorMessage.includes('Foreign key constraint')) {
        return NextResponse.json({ success: false, error: 'Invalid contributor reference' }, { status: 400 })
      }
    }
    return serverError(e)
  }
}

// ── DELETE /api/variations/:id ───────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireRole('ADMIN')
    if (!user) return forbidden()

    // Only delete if group has no sentences, else just mark inactive
    const count = await prisma.parallelSentence.count({ where: { variationGroupId: params.id } })
    if (count > 0) {
      return NextResponse.json(
        { success: false, error: `لا يمكن الحذف، المجموعة تحتوي على ${count} جملة` },
        { status: 409 }
      )
    }

    await prisma.variationGroup.delete({ where: { id: params.id } })
    return ok({ deleted: true })
  } catch (e) { return serverError(e) }
}
