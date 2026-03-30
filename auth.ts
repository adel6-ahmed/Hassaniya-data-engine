import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import { getMockUserByEmail } from '@/lib/mock-users'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const configuredProviders = []

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  configuredProviders.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  )
} else {
  console.warn('Google OAuth provider is not configured (AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET missing)')
}

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  configuredProviders.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  )
} else {
  console.warn('GitHub OAuth provider is not configured (AUTH_GITHUB_ID/AUTH_GITHUB_SECRET missing)')
}

configuredProviders.push(
  Credentials({
    credentials: {
      email:    { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
        // In development mode, allow login with email only
        // In production, require both email and password
        const isDevMode = process.env.NODE_ENV === 'development'

        const emailSchema = z.string().email()
        const passwordSchema = isDevMode 
          ? z.string().optional() 
          : z.string().min(6)

        const parsed = z.object({
          email:    emailSchema,
          password: passwordSchema,
        }).safeParse(credentials)

        if (!parsed.success) return null

        // Try to find user in database first, fall back to mock users
        let user = null
        
        try {
          if (prisma) {
            user = await prisma.user.findUnique({
              where: { email: parsed.data.email },
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isApproved: true,
                isActive: true,
                approvalStatus: true,
                passwordHash: true,
              }
            })
          }
        } catch (error) {
          console.warn('Database query failed, falling back to mock users', error)
        }

        // Fall back to mock users if database query fails, is offline, or user record is missing password hash
        if (!user || !('passwordHash' in user) || !user.passwordHash) {
          user = getMockUserByEmail(parsed.data.email)
        }

        if (!user) return null

        // Check if user is active
        if (!user.isActive) {
          console.warn('[auth] login attempt for inactive user', parsed.data.email)
          throw new Error('Account is inactive')
        }

        // Ensure user has approval fields (for mock users or database users)
        const userWithApproval = {
          ...user,
          isApproved: (user as any).isApproved ?? (user.role === 'CONTRIBUTOR'),
          approvalStatus: (user as any).approvalStatus ?? 'APPROVED',
          passwordHash: (user as any).passwordHash || null,
        }

        console.warn('[auth] verify credentials', {
          email: parsed.data.email,
          role: userWithApproval.role,
          userFromMock: user.id && user.id.length <= 3, // simple heuristic for mock vs db in this setup
          hasPasswordHash: Boolean(userWithApproval.passwordHash),
        })

        // Check approval status for privileged roles
        if (userWithApproval.role === 'REVIEWER' || userWithApproval.role === 'ADMIN') {
          if (!userWithApproval.isApproved) {
            throw new Error('Account pending approval')
          }
        }

        // Password validation (critical for security in all environments)
        if (!parsed.data.password || !userWithApproval.passwordHash) {
          return null
        }

        const validPassword = await bcrypt.compare(parsed.data.password, userWithApproval.passwordHash)
        if (!validPassword) {
          console.warn('[auth] invalid password for', parsed.data.email)
          return null
        }

        return {
          id:    userWithApproval.id,
          name:  userWithApproval.name,
          email: userWithApproval.email,
          role:  userWithApproval.role,
          isApproved: userWithApproval.isApproved,
          isActive: userWithApproval.isActive,
        }
      },
    }),
)

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET,
  providers: configuredProviders,
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        let resolvedUserId = user.id
        const userEmail = typeof user.email === 'string' ? user.email : null

        if (userEmail) {
          const existingUser = await prisma.user.findUnique({
            where: { email: userEmail },
            select: { id: true },
          })

          if (existingUser) {
            resolvedUserId = existingUser.id
          } else {
            try {
              const createdUser = await prisma.user.create({
                data: {
                  email: userEmail,
                  name: user.name ?? null,
                  role: 'CONTRIBUTOR',
                },
                select: { id: true },
              })
              resolvedUserId = createdUser.id
            } catch (error) {
              const prismaError = error as { code?: string }
              // Handle concurrent first-login creates by refetching by email.
              if (prismaError?.code === 'P2002') {
                const raceWinner = await prisma.user.findUnique({
                  where: { email: userEmail },
                  select: { id: true },
                })
                if (raceWinner) resolvedUserId = raceWinner.id
              }
            }
          }
        }

        token.id   = resolvedUserId
        token.role = user.role ?? 'CONTRIBUTOR'
        token.isApproved = user.isApproved ?? false
        token.isActive = user.isActive ?? true
      }
      return token
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id   = token.id
        session.user.isApproved = token.isApproved
        session.user.isActive = token.isActive
        session.user.role = token.role
      }
      return session
    },
  },
  pages: { signIn: '/auth/signin' },
})