// lib/prisma.ts
// Singleton Prisma client for Next.js (prevents hot-reload connection leak)
// Enhanced with offline mode support for local development

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

const isDevelopment = process.env.NODE_ENV !== 'production'

const prismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Keep logs production-safe: errors only in dev, silence in prod.
    log: isDevelopment ? ['error', 'warn'] : [],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: process.env.DATABASE_URL || "postgresql://postgres.vrhcqcryleaqpzkicfqv:HO2u2suDcnbq5p6d@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
      }
    }
  })

// Prevent hot-reload connection leaks in development.
if (isDevelopment) globalForPrisma.prisma = prismaClient

export const prismaSingleton = prismaClient

// Backwards-compatible named export.
export const prisma = prismaClient

export default prismaClient
