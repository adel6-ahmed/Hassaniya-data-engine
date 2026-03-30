// lib/api-helpers.ts
// Shared utilities for API routes

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { ZodError } from 'zod'

// ── Types ────────────────────────────────────────────────────────

export type UserRole = 'ADMIN' | 'REVIEWER' | 'CONTRIBUTOR'

export interface AppUser {
  id?: string
  role?: UserRole
}

export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
  warnings?: string[]
  meta?: {
    total?: number
    page?: number
    pageSize?: number
    totalPages?: number
  }
}

// ── Response helpers ─────────────────────────────────────────────

export function ok<T>(data: T, meta?: ApiResponse['meta'], warnings?: string[]): NextResponse {
  return NextResponse.json({ success: true, data, meta, warnings }, { status: 200 })
}

export function created<T>(data: T, warnings?: string[]): NextResponse {
  return NextResponse.json({ success: true, data, warnings }, { status: 201 })
}

export function badRequest(error: string): NextResponse {
  return NextResponse.json({ success: false, error }, { status: 400 })
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
}

export function forbidden(): NextResponse {
  return NextResponse.json({ success: false, error: 'ليس لديك صلاحية' }, { status: 403 })
}

export function notFound(resource = 'السجل'): NextResponse {
  return NextResponse.json({ success: false, error: `${resource} غير موجود` }, { status: 404 })
}

export function conflict(error: string): NextResponse {
  return NextResponse.json({ success: false, error }, { status: 409 })
}

export function serverError(error: unknown): NextResponse {
  const isDev = process.env.NODE_ENV !== 'production'

  const isDatabaseUnavailable = (): boolean => {
    const anyError = error as Record<string, unknown>
    const code = typeof anyError?.code === 'string' ? anyError.code : undefined
    const name = typeof anyError?.name === 'string' ? anyError.name : undefined
    const message = error instanceof Error ? error.message : typeof error === 'string' ? error : undefined

    const dbCodes = new Set(['P1000', 'P1001', 'P1002', 'P1010', 'P1011', 'P1012'])
    if (code && dbCodes.has(code)) return true

    const combined = `${name ?? ''} ${message ?? ''}`.toLowerCase()
    return (
      combined.includes('prismaclientinitializationerror') ||
      combined.includes('unable to connect') ||
      combined.includes('failed to connect') ||
      combined.includes('connect timed out') ||
      combined.includes('ecconnrefused') ||
      combined.includes('etimedout') ||
      combined.includes('database unavailable')
    )
  }

  if (isDatabaseUnavailable()) {
    return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })
  }

  if (isDev) console.error('[API Error]', error)
  return NextResponse.json({ success: false, error: 'خطأ في الخادم' }, { status: 500 })
}

export function validationError(error: ZodError): NextResponse {
  const messages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
  return NextResponse.json({ success: false, error: messages }, { status: 422 })
}

// ── Auth helpers ─────────────────────────────────────────────────

export async function requireAuth(): Promise<AppUser | null> {
  const session = await auth()
  if (!session?.user) return null
  return session.user
}

export async function requireRole(role: UserRole): Promise<AppUser | null> {
  const user = await requireAuth()
  if (!user) return null
  const roleHierarchy: Record<UserRole, number> = { CONTRIBUTOR: 0, REVIEWER: 1, ADMIN: 2 }
  const required = roleHierarchy[role]
  const actual = user.role ? roleHierarchy[user.role] : 0
  if (actual < required) return null
  return user
}

// ── Pagination ───────────────────────────────────────────────────

export function parsePagination(req: NextRequest) {
  const url = new URL(req.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '20')))
  const skip = (page - 1) * pageSize
  return { page, pageSize, skip }
}

export function buildMeta(total: number, page: number, pageSize: number) {
  return { total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

// ── Filter helpers ───────────────────────────────────────────────

export function parseFilters(req: NextRequest) {
  const url = new URL(req.url)
  return {
    domain: url.searchParams.get('domain') || undefined,
    intent: url.searchParams.get('intent') || undefined,
    region: url.searchParams.get('region') || undefined,
    reviewStatus: url.searchParams.get('reviewStatus') || undefined,
    curationStage: url.searchParams.get('curationStage') || undefined,
    isExportReady: url.searchParams.get('isExportReady') === 'true' ? true : undefined,
    contributorId: url.searchParams.get('contributorId') || undefined,
    search: url.searchParams.get('search') || undefined,
  }
}
