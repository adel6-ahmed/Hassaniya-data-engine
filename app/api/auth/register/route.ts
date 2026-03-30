import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['CONTRIBUTOR', 'REVIEWER', 'ADMIN']).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const { name, email, password, role = 'CONTRIBUTOR' } = parsed.data

    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    }

    // For privileged roles, create as pending approval
    const isApproved = role === 'CONTRIBUTOR'
    const approvalStatus = isApproved ? 'APPROVED' : 'PENDING'

    const passwordHash = await bcrypt.hash(password, 12)

    // Create user with password hash
    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: role as 'CONTRIBUTOR' | 'REVIEWER' | 'ADMIN',
        isApproved,
        approvalStatus: approvalStatus as 'PENDING' | 'APPROVED' | 'REJECTED',
        passwordHash,
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        approvalStatus: user.approvalStatus
      },
      message: role === 'CONTRIBUTOR' ? 'Account created successfully' : 'Account request submitted. Please wait for admin approval.'
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
