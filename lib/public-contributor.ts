import { prisma } from '@/lib/prisma'
import { UserRole, ApprovalStatus } from '@prisma/client'

const PUBLIC_EMAIL = 'public@system.local'
const PUBLIC_NAME = 'Public Contributor'

export async function getPublicContributorId(): Promise<string> {
  try {
    console.log('Looking for existing public contributor')
    const existing = await prisma.user.findUnique({
      where: { email: PUBLIC_EMAIL },
      select: { id: true },
    })
    if (existing) {
      console.log('Found existing public contributor:', existing.id)
      return existing.id
    }

    console.log('Creating new public contributor')
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
    console.log('Created new public contributor:', created.id)
    return created.id
  } catch (error) {
    console.error('[PublicContributor] Failed to resolve public contributor', error)
    throw new Error('Public contributor unavailable')
  }
}
