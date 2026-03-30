import { PrismaClient, UserRole, ApprovalStatus } from '@prisma/client'

const PUBLIC_EMAIL = 'public@system.local'
const PUBLIC_NAME = 'Public Contributor'

export async function getPublicContributorId(): Promise<string> {
  const prisma = new PrismaClient({
    log: ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL || "postgresql://postgres.vrhcqcryleaqpzkicfqv:HO2u2suDcnbq5p6d@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
      }
    }
  })

  try {
    const existing = await prisma.user.findUnique({
      where: { email: PUBLIC_EMAIL },
      select: { id: true },
    })
    if (existing) {
      await prisma.$disconnect()
      return existing.id
    }

    const created = await prisma.user.create({
      data: {
        name: PUBLIC_NAME,
        email: PUBLIC_EMAIL,
        role: UserRole.CONTRIBUTOR,
        isActive: true,
        isApproved: true,
        approvalStatus: ApprovalStatus.APPROVED,
      },
      select: { id: true },
    })
    await prisma.$disconnect()
    return created.id
  } catch (error) {
    console.error('[PublicContributor] Failed to resolve public contributor', error)
    await prisma.$disconnect()
    throw new Error('Public contributor unavailable')
  }
}
