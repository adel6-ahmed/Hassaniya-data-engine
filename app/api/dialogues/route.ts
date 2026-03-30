// app/api/dialogues/route.ts
// Create multi-turn dialogue entries with edge-function normalization and exact dedup via textHash.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { dialogueSchema, checkTextQuality, normalizeHassaniyaText } from '@/lib/validations'
import { created, validationError, serverError } from '@/lib/api-helpers'
import crypto from 'crypto'
import { levenshteinSimilarity } from '@/lib/dedup/dedup-utils'
import { SpeakerRole } from '@prisma/client'
import { getPublicContributorId } from '@/lib/public-contributor'

export async function POST(req: NextRequest) {
  try {
    // Resolution order for contributorId:
    // a) If session exists and session.user.id references an existing User, use it
    // b) Else if session.user.email matches an existing User.email, use that User.id
    // c) Else find or create a fallback public user
    // d) If still impossible, return 400

    let resolvedContributorId: string | null = null

    const session = await auth()
    if (session?.user) {
      const sessionUserId = (session.user as { id?: string }).id ?? null
      const sessionUserEmail = (session.user as { email?: string }).email ?? null

      // a) Try to find user by session.user.id
      if (sessionUserId) {
        const userById = await prisma.user.findUnique({
          where: { id: sessionUserId },
          select: { id: true },
        })
        if (userById) {
          resolvedContributorId = userById.id
        }
      }

      // b) If not found by id, try to find by email
      if (!resolvedContributorId && sessionUserEmail) {
        const userByEmail = await prisma.user.findUnique({
          where: { email: sessionUserEmail },
          select: { id: true },
        })
        if (userByEmail) {
          resolvedContributorId = userByEmail.id
        }
      }
    }

    // c) If still not resolved, use fallback public user
    if (!resolvedContributorId) {
      try {
        resolvedContributorId = await getPublicContributorId()
      } catch {
        return NextResponse.json({ success: false, error: 'Unable to resolve contributor' }, { status: 400 })
      }
    }

    // d) Final verification: ensure resolved contributor exists
    if (!resolvedContributorId) {
      return NextResponse.json({ success: false, error: 'Unable to resolve contributor' }, { status: 400 })
    }

    const verifyContributor = await prisma.user.findUnique({
      where: { id: resolvedContributorId },
      select: { id: true },
    })
    if (!verifyContributor) {
      return NextResponse.json({ success: false, error: 'Unable to resolve contributor' }, { status: 400 })
    }

    const body = await req.json()
    const parsed = dialogueSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const turnsSorted = [...parsed.data.turns].sort((a, b) => a.turnIndex - b.turnIndex)

    // Additional runtime checks matching the required validation rules.
    // (Zod already validates sequential indices order-independently, but we keep this explicit.)
    if (new Set(turnsSorted.map((t) => t.turnIndex)).size !== turnsSorted.length) {
      return NextResponse.json({ success: false, error: 'Duplicate turnIndex in the same request' }, { status: 400 })
    }
    if (!turnsSorted.every((t, i) => t.turnIndex === i)) {
      return NextResponse.json({ success: false, error: 'turnIndex must be sequential starting from 0' }, { status: 400 })
    }

    // Map API roles to DB enum.
    const toPrismaRole = (role: string): SpeakerRole | null => {
      if (role === 'user') return 'CUSTOMER'
      if (role === 'assistant') return 'ASSISTANT'
      if (role === 'system') return 'SYSTEM'
      return null
    }

    const prismaRoles: SpeakerRole[] = []
    for (const t of turnsSorted) {
      const mapped = toPrismaRole(t.speakerRole)
      if (!mapped) {
        return NextResponse.json({ success: false, error: 'Invalid speakerRole' }, { status: 400 })
      }
      prismaRoles.push(mapped)
    }

    // Normalize + compute dedup inside this request only.
    const normalizedByIndex: string[] = []
    const rawByIndex: string[] = []
    const isNearDuplicate: boolean[] = new Array(turnsSorted.length).fill(false)
    const firstNearLog: Map<number, { otherIndex: number; sim: number }> = new Map()

    for (let i = 0; i < turnsSorted.length; i++) {
      const t = turnsSorted[i]
      const rawText = t.utteranceText

      const quality = checkTextQuality(rawText)
      if (!quality.passed) {
        return NextResponse.json({ success: false, error: quality.errors.join(', ') }, { status: 400 })
      }

      const normalizedText = normalizeHassaniyaText(rawText)
      if (!normalizedText || normalizedText.trim() === '') {
        return NextResponse.json(
          {
            error: 'NORMALIZATION_FAILED',
            message: 'Could not normalize turn text. Dialogue not saved.',
            turnIndex: t.turnIndex,
          },
          { status: 400 }
        )
      }

      normalizedByIndex.push(normalizedText)
      rawByIndex.push(rawText)
    }

    // Exact duplicate detection within this request (normalizedText only).
    const seenExactNormalized = new Map<string, number>()
    for (let i = 0; i < normalizedByIndex.length; i++) {
      const norm = normalizedByIndex[i]
      if (seenExactNormalized.has(norm)) {
        return NextResponse.json({ success: false, error: 'Turn text is duplicated in the same request' }, { status: 409 })
      }
      seenExactNormalized.set(norm, i)
    }

    // Near-duplicate detection within this request (Levenshtein similarity >= 0.85).
    const SIM_THRESHOLD = 0.85
    for (let i = 0; i < normalizedByIndex.length; i++) {
      for (let j = i + 1; j < normalizedByIndex.length; j++) {
        const sim = levenshteinSimilarity(normalizedByIndex[i], normalizedByIndex[j])
        if (sim >= SIM_THRESHOLD) {
          isNearDuplicate[i] = true
          isNearDuplicate[j] = true
          if (!firstNearLog.has(i)) firstNearLog.set(i, { otherIndex: j, sim })
          if (!firstNearLog.has(j)) firstNearLog.set(j, { otherIndex: i, sim })
        }
      }
    }

    // Log near duplicates to `quality_logs`.
    for (let i = 0; i < turnsSorted.length; i++) {
      if (!isNearDuplicate[i]) continue
      const log = firstNearLog.get(i)
      await prisma.qualityLog.create({
        data: {
          sourceTable: 'dialogue_turns',
          sourceId: `turn_${turnsSorted[i].turnIndex}`,
          checkType: 'duplicate',
          message: log
            ? `near_duplicate_detected: turn_${turnsSorted[i].turnIndex} ~ turn_${turnsSorted[log.otherIndex].turnIndex} (sim=${log.sim.toFixed(3)})`
            : 'near_duplicate_detected',
          severity: 'warning',
        },
      })
    }

    // Dialogue-level exact dedup hash from normalized, sorted turns.
    const canonical = turnsSorted.map((t, i) => ({
      turnIndex: t.turnIndex,
      speakerRole: prismaRoles[i],
      normalizedText: normalizedByIndex[i],
    }))
    const dialogueHash = crypto.createHash('sha256').update(JSON.stringify(canonical), 'utf8').digest('hex')

    const existingDialogue = await prisma.dialogue.findUnique({
      where: { dialogueHash },
      select: { id: true },
    })
    if (existingDialogue) {
      return NextResponse.json(
        {
          error: 'DUPLICATE_DIALOGUE',
          message: 'This dialogue already exists in the database.',
          duplicateOfId: existingDialogue.id,
          dialogueHash,
        },
        { status: 409 },
      )
    }

    // Create dialogue first
    const createdDialogue = await prisma.dialogue.create({
      data: {
        dialogueHash,
        title: parsed.data.title ?? null,
        topic: parsed.data.topic ?? null,
        domain: parsed.data.domain,
        region: parsed.data.region,
        isExportReady: true,
        turnCount: parsed.data.turns.length,
      },
    })

    // Then create turns
    await prisma.dialogueTurn.createMany({
      data: turnsSorted.map((t, i) => ({
        dialogueId: createdDialogue.id,
        turnIndex: t.turnIndex,
        utteranceText: rawByIndex[i],
        rawText: rawByIndex[i],
        normalizedText: normalizedByIndex[i],
        textHash: crypto
          .createHash('sha256')
          .update(`${prismaRoles[i]}::${normalizedByIndex[i]}`, 'utf8')
          .digest('hex'),
        speakerRole: prismaRoles[i],
        dialogueStage: t.dialogueStage,
        intent: t.intent,
        domain: t.domain,
        topic: t.topic ?? null,
        region: t.region,
        emotionalTone: t.emotionalTone,
        confidenceLevel: t.confidenceLevel,
        verifiedByNativeSpeaker: t.verifiedByNativeSpeaker,
        variationGroupId: t.variationGroupId ?? null,
        contributorId: resolvedContributorId,
      })),
    })

    // Fetch the complete dialogue with turns
    const completeDialogue = await prisma.dialogue.findUnique({
      where: { id: createdDialogue.id },
      include: { turns: true },
    })

    return created(completeDialogue)
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

