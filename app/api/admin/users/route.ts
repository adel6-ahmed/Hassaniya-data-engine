import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    // Only ADMIN can access this endpoint
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden', message: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'PENDING'

    // Fetch users by approval status, prioritizing reviewer/admin roles
    const users = await prisma.user.findMany({
      where: {
        approvalStatus: status as any,
        role: {
          in: ['REVIEWER', 'ADMIN'],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isApproved: true,
        isActive: true,
        approvalStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ users }, { status: 200 })
  } catch (error) {
    console.error('GET /api/admin/users error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()

    // Only ADMIN can access this endpoint
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden', message: 'Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { userId, action } = body

    if (!userId || !['approve', 'reject', 'deactivate'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request', message: 'userId and valid action required' }, { status: 400 })
    }

    let updatedUser

    if (action === 'approve') {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          isApproved: true,
          approvalStatus: 'APPROVED',
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isApproved: true,
          isActive: true,
          approvalStatus: true,
        },
      })
    } else if (action === 'reject') {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          isApproved: false,
          approvalStatus: 'REJECTED',
          isActive: false,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isApproved: true,
          isActive: true,
          approvalStatus: true,
        },
      })
    } else if (action === 'deactivate') {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isApproved: true,
          isActive: true,
          approvalStatus: true,
        },
      })
    }

    return NextResponse.json({ user: updatedUser }, { status: 200 })
  } catch (error) {
    console.error('PATCH /api/admin/users error:', error)
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}