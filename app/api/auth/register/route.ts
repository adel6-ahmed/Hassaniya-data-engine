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
    let existing = null
    let dbConnected = true
    try {
      existing = await prisma.user.findUnique({ where: { email } })
    } catch (dbError) {
      dbConnected = false
      console.warn('Database connection failed during signup check', dbError)
      // Allow signup but note that it may fail on actual save
    }

    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    }

    // For privileged roles, create as pending approval
    const isApproved = role === 'CONTRIBUTOR'
    const approvalStatus = isApproved ? 'APPROVED' : 'PENDING'

    const passwordHash = await bcrypt.hash(password, 12)

    // Try to create user with password hash
    try {
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
    } catch (createError) {
      console.error('Database create error during signup:', createError)
      // If database is unavailable, provide helpful message
      if (!dbConnected) {
        return NextResponse.json({
          error: 'Database is currently unavailable. Please try again later or contact administrator. For testing, use existing demo accounts.'
        }, { status: 503 })
      }
      throw createError
    }
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Server error. Database may be unavailable.' }, { status: 500 })
  }
}
