// app/api/export/route.ts
// Dataset Export — JSON / JSONL / CSV with train/val/test split

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { forbidden, serverError, validationError, requireRole } from '@/lib/api-helpers'
import { ExportRequestLegacySchema, ExportRequestSchema, ExportTypeEnum } from '@/lib/validations'
import { logExport } from '@/app/actions/logExport'
import { Domain, Intent, Prisma, Region } from '@prisma/client'
import { z } from 'zod'

// ── Types ────────────────────────────────────────────────────────

type ExportFilters = {
  domain?: string
  intent?: string
  region?: string
}

type ParallelRow = {
  id: string
  hassaniyaSentence: string
  msaTranslation: string | null
  frenchTranslation: string | null
  domain: string
  intent: string
  region: string
  emotionalTone: string
  styleType: string
}

type DialogueExportRow = {
  id: string
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[]
  metadata: { domain: string; topic: string | null }
}

type FaqExportRow = {
  id: string
  questionHassaniya: string
  questionMsa: string | null
  answerHassaniya: string
  answerMsa: string | null
  answerFrench: string | null
  domain: string
  intent: string
}

type ProverbExportRow = {
  id: string
  proverbText: string
  meaningExplanation: string
  literalTranslation: string | null
  frenchTranslation: string | null
  category: string
  domain: string
  region: string
}

type MonolingualExportRow = {
  id: string
  title: string | null
  hassaniyaText: string
  domain: string
  region: string
  wordCount: number | null
  characterCount: number | null
}

type InstructionRow = {
  instruction: string
  input: string
  output: string
  metadata: { domain: string; intent: string; region: string }
}

type ExportRow =
  | ParallelRow
  | DialogueExportRow
  | FaqExportRow
  | ProverbExportRow
  | MonolingualExportRow
  | InstructionRow

type ExportRowWithSplit = ExportRow & { split: 'train' | 'validation' | 'test' }

type ExportTypeEnumValue = z.infer<typeof ExportTypeEnum>

// ── Data fetchers ────────────────────────────────────────────────

async function fetchParallelData(filters: ExportFilters): Promise<ParallelRow[]> {
  const where: Prisma.ParallelSentenceWhereInput = {
    hassaniyaSentence: { not: '' },
    reviewStatus: 'APPROVED', // ✅ فقط الجمل الموافق عليها
  }
  if (filters.domain && Object.values(Domain).includes(filters.domain as Domain)) {
    where.domain = filters.domain as Domain
  }
  if (filters.intent && Object.values(Intent).includes(filters.intent as Intent)) {
    where.intent = filters.intent as Intent
  }
  if (filters.region && Object.values(Region).includes(filters.region as Region)) {
    where.region = filters.region as Region
  }

  const rows = await prisma.parallelSentence.findMany({
    where,
    select: {
      id: true,
      hassaniyaSentence: true,
      msaTranslation: true,
      frenchTranslation: true,
      domain: true,
      intent: true,
      region: true,
      emotionalTone: true,
      styleType: true,
    },
  })
  return rows
}

async function fetchInstructionData(filters: ExportFilters): Promise<InstructionRow[]> {
  const rows = await fetchParallelData(filters)
  return rows
    .filter((r): r is ParallelRow & { msaTranslation: string } => typeof r.msaTranslation === 'string' && r.msaTranslation.length > 0)
    .map((r) => ({
      instruction: 'ترجم الجملة التالية من الحسانية إلى العربية الفصحى',
      input: r.hassaniyaSentence,
      output: r.msaTranslation,
      metadata: { domain: r.domain, intent: r.intent, region: r.region },
    }))
}

async function fetchDialogueData(filters: ExportFilters): Promise<DialogueExportRow[]> {
  const where: Prisma.DialogueWhereInput = {
    reviewStatus: 'APPROVED', // ✅ فقط الحوارات الموافق عليها
  }
  if (filters.domain && Object.values(Domain).includes(filters.domain as Domain)) {
    where.domain = filters.domain as Domain
  }

  const dialogues = await prisma.dialogue.findMany({
    where,
    include: { turns: { orderBy: { turnIndex: 'asc' } } },
  })

  return dialogues
    .filter(d => d.turns.length >= 2)
    .map((d) => ({
      id: d.id,
      messages: d.turns.map((t) => ({
        role: t.speakerRole === 'CUSTOMER' ? 'user' : t.speakerRole === 'ASSISTANT' || t.speakerRole === 'AGENT' ? 'assistant' : 'system',
        content: t.utteranceText,
      })),
      metadata: { domain: d.domain, topic: d.topic },
    }))
}

async function fetchFaqData(filters: ExportFilters): Promise<FaqExportRow[]> {
  const where: Prisma.FaqEntryWhereInput = {
    questionHassaniya: { not: '' },
    answerHassaniya: { not: '' },
    isActive: true,
    reviewStatus: 'APPROVED', // ✅ فقط الأسئلة الموافق عليها
  }
  if (filters.domain && Object.values(Domain).includes(filters.domain as Domain)) {
    where.domain = filters.domain as Domain
  }
  if (filters.intent && Object.values(Intent).includes(filters.intent as Intent)) {
    where.intent = filters.intent as Intent
  }

  return prisma.faqEntry.findMany({
    where,
    select: {
      id: true,
      questionHassaniya: true,
      questionMsa: true,
      answerHassaniya: true,
      answerMsa: true,
      answerFrench: true,
      domain: true,
      intent: true,
    },
  })
}

async function fetchProverbData(filters: ExportFilters): Promise<ProverbExportRow[]> {
  const where: Prisma.ProverbWhereInput = {
    proverbText: { not: '' },
    reviewStatus: 'APPROVED', // ✅ فقط الأمثال الموافق عليها
  }
  if (filters.domain && Object.values(Domain).includes(filters.domain as Domain)) {
    where.domain = filters.domain as Domain
  }
  if (filters.region && Object.values(Region).includes(filters.region as Region)) {
    where.region = filters.region as Region
  }

  return prisma.proverb.findMany({
    where,
    select: {
      id: true,
      proverbText: true,
      meaningExplanation: true,
      literalTranslation: true,
      frenchTranslation: true,
      category: true,
      domain: true,
      region: true,
    },
  })
}

async function fetchMonolingualData(filters: ExportFilters): Promise<MonolingualExportRow[]> {
  const where: Prisma.MonolingualTextWhereInput = {
    hassaniyaText: { not: '' },
    characterCount: { gt: 100 },
    reviewStatus: 'APPROVED', // ✅ فقط النصوص الموافق عليها
  }
  if (filters.domain && Object.values(Domain).includes(filters.domain as Domain)) {
    where.domain = filters.domain as Domain
  }
  if (filters.region && Object.values(Region).includes(filters.region as Region)) {
    where.region = filters.region as Region
  }

  return prisma.monolingualText.findMany({
    where,
    select: {
      id: true,
      title: true,
      hassaniyaText: true,
      domain: true,
      region: true,
      wordCount: true,
      characterCount: true,
    },
  })
}

const EXPORT_TYPE_TO_INTERNAL: Record<
  ExportTypeEnumValue,
  'parallel' | 'monolingual' | 'proverbs' | 'dialogues' | 'instruction' | 'faq' | 'chat'
> = {
  PARALLEL: 'parallel',
  MONOLINGUAL: 'monolingual',
  PROVERBS: 'proverbs',
  DIALOGUE: 'dialogues',
  FAQ: 'faq',
  INSTRUCTION_TUNING: 'instruction',
  CHAT: 'chat',
}

const LEGACY_EXPORT_TO_CANONICAL: Record<string, ExportTypeEnumValue> = {
  parallel: 'PARALLEL',
  monolingual: 'MONOLINGUAL',
  proverbs: 'PROVERBS',
  dialogues: 'DIALOGUE',
  instruction: 'INSTRUCTION_TUNING',
  faq: 'FAQ',
}

// ── Split helper ─────────────────────────────────────────────────

function splitDataset<T>(data: T[], trainRatio: number, valRatio: number) {
  const shuffled = [...data].sort(() => Math.random() - 0.5)
  const trainEnd = Math.floor(shuffled.length * trainRatio)
  const valEnd = trainEnd + Math.floor(shuffled.length * valRatio)
  return {
    train: shuffled.slice(0, trainEnd),
    validation: shuffled.slice(trainEnd, valEnd),
    test: shuffled.slice(valEnd),
  }
}

// ── Format converters ─────────────────────────────────────────────

function toJsonl<T extends ExportRow>(data: T[]): string {
  return data.map((row) => JSON.stringify(row)).join('\n')
}

function toCsv<T extends ExportRow>(data: T[]): string {
  if (!data.length) return ''
  const headers = Object.keys(data[0]) as Array<keyof T>
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h]
      if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`
      return `"${String(val ?? '').replace(/"/g, '""')}"`
    }).join(',')
  )
  return [headers.map((h) => String(h)).join(','), ...rows].join('\n')
}

// ── POST /api/export ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole('ADMIN')
    if (!user) return forbidden()

    const body = await req.json()
    const strictParsed = ExportRequestSchema.safeParse(body)
    const legacyParsed = ExportRequestLegacySchema.safeParse(body)

    if (!strictParsed.success && !legacyParsed.success) {
      return validationError((strictParsed.error ?? legacyParsed.error) as any)
    }

    const format = (body?.format === 'json' || body?.format === 'jsonl' || body?.format === 'csv' ? body.format : 'jsonl') as
      | 'json'
      | 'jsonl'
      | 'csv'

    const trainRatio = typeof body?.trainRatio === 'number' ? Math.min(1, Math.max(0, body.trainRatio)) : 0.8
    const valRatio = typeof body?.valRatio === 'number' ? Math.min(1, Math.max(0, body.valRatio)) : 0.1
    const splitOutput = typeof body?.splitOutput === 'boolean' ? body.splitOutput : false

    let exportTypeCanonical: ExportTypeEnumValue
    if (strictParsed.success) {
      exportTypeCanonical = strictParsed.data.exportType
    } else {
      if (!legacyParsed.success) return validationError(legacyParsed.error)
      exportTypeCanonical = LEGACY_EXPORT_TO_CANONICAL[legacyParsed.data.exportType]
    }

    const exportTypeInternal = EXPORT_TYPE_TO_INTERNAL[exportTypeCanonical] as
      | 'parallel'
      | 'monolingual'
      | 'proverbs'
      | 'dialogues'
      | 'instruction'
      | 'faq'
      | 'chat'

    const allowedExportTypes = ['parallel', 'instruction', 'dialogues', 'faq', 'proverbs', 'monolingual'] as const
    if (!allowedExportTypes.includes(exportTypeInternal as any)) {
      return NextResponse.json({ success: false, error: 'Invalid export type' }, { status: 400 })
    }

    let datasetVersion: string
    const filters: ExportFilters = {}
    if (strictParsed.success) {
      datasetVersion = strictParsed.data.datasetVersion
      filters.domain = strictParsed.data.filters?.domain
      filters.region = strictParsed.data.filters?.region
      filters.intent = typeof body?.intent === 'string' ? body.intent : undefined
    } else {
      if (!legacyParsed.success) return validationError(legacyParsed.error)
      datasetVersion = legacyParsed.data.datasetVersion ?? 'v1.0.0'
      filters.domain = legacyParsed.data.domain
      filters.intent = legacyParsed.data.intent
      filters.region = legacyParsed.data.region
    }

    // Fetch data by type
    let rawData: ExportRow[]
    switch (exportTypeInternal) {
      case 'parallel':    rawData = await fetchParallelData(filters); break
      case 'instruction': rawData = await fetchInstructionData(filters); break
      case 'dialogues':   rawData = await fetchDialogueData(filters); break
      case 'faq':         rawData = await fetchFaqData(filters); break
      case 'proverbs':    rawData = await fetchProverbData(filters); break
      case 'monolingual': rawData = await fetchMonolingualData(filters); break
      default:            rawData = []
    }

    if (rawData.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'لا توجد بيانات موافق عليها للتصدير',
          hint: 'تأكد من وجود بيانات بحالة APPROVED في قاعدة البيانات',
        },
        { status: 404 }
      )
    }

    // Split if requested
    const split = splitOutput ? splitDataset(rawData, trainRatio, valRatio) : null
    const jsonData = split ?? rawData

    // Format output
    let content: string
    let contentType: string
    let filename: string

    if (format === 'jsonl') {
      if (split) {
        const rows: ExportRowWithSplit[] = [
          ...split.train.map((r) => ({ ...r, split: 'train' as const })),
          ...split.validation.map((r) => ({ ...r, split: 'validation' as const })),
          ...split.test.map((r) => ({ ...r, split: 'test' as const })),
        ]
        content = toJsonl(rows)
      } else content = toJsonl(rawData)
      contentType = 'application/x-ndjson'
      filename = `hassaniya_${exportTypeInternal}.jsonl`
    } else if (format === 'csv') {
      if (split) {
        const rows: ExportRowWithSplit[] = [
          ...split.train.map((r) => ({ ...r, split: 'train' as const })),
          ...split.validation.map((r) => ({ ...r, split: 'validation' as const })),
          ...split.test.map((r) => ({ ...r, split: 'test' as const })),
        ]
        content = toCsv(rows)
      } else content = toCsv(rawData)
      contentType = 'text/csv; charset=utf-8'
      filename = `hassaniya_${exportTypeInternal}.csv`
    } else {
      content = JSON.stringify(jsonData, null, 2)
      contentType = 'application/json; charset=utf-8'
      filename = `hassaniya_${exportTypeInternal}.json`
    }

    const requesterId = (user as { id?: string }).id ?? ''
    const requesterExists = requesterId
      ? await prisma.user.findUnique({ where: { id: requesterId }, select: { id: true } })
      : null

    try {
      if (requesterExists) {
        await prisma.dataExport.create({
          data: {
            name: `${exportTypeInternal}_${format}_${new Date().toISOString().slice(0, 10)}`,
            exportType: exportTypeInternal,
            format,
            filters,
            trainRatio,
            valRatio,
            testRatio: 1 - trainRatio - valRatio,
            totalEntries: rawData.length,
            status: 'ready',
            completedAt: new Date(),
            requestedById: requesterExists.id,
          },
        })
      }
    } catch (error) {
      const prismaError = error as { code?: string }
      if (prismaError?.code !== 'P2003') throw error
    }

    const fileSize = Buffer.byteLength(content, 'utf8')
    const exportHash = crypto.createHash('sha256').update(content, 'utf8').digest('hex')

    const logUserId = requesterExists?.id ?? ''
    if (logUserId) {
      try {
        await logExport({
          userId: logUserId,
          exportType: exportTypeCanonical,
          datasetVersion,
          recordCount: rawData.length,
          fileUrl: null,
          fileSize,
          exportHash,
        })
      } catch {
        // Export response is primary; audit logging is best-effort in local/dev.
      }
    }

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Total-Entries': rawData.length.toString(),
        'X-Export-Hash': exportHash,
      },
    })
  } catch (e) {
    return serverError(e)
  }
}

// ── GET /api/export — list previous exports ───────────────────────

export async function GET() {
  try {
    const user = await requireRole('ADMIN')
    if (!user) return forbidden()

    const exports = await prisma.dataExport.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { requestedBy: { select: { id: true, name: true } } },
    })

    const { NextResponse: NR } = await import('next/server')
    return NR.json({ success: true, data: exports })
  } catch (e) {
    return serverError(e)
  }
}