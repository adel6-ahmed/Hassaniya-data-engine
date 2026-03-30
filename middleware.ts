import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export const config = {
  matcher: ['/dashboard/:path*', '/api/review/:path*', '/api/admin/:path*', '/api/export/:path*'],
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Public contribution pages - no auth required
  if (pathname === '/dashboard/contribute' || pathname.startsWith('/dashboard/contribute/')) {
    return NextResponse.next()
  }

  // If path is not protected, let it through
  const isDashboardProtected = pathname === '/dashboard' || pathname.startsWith('/dashboard/')
  const isApiProtected = pathname.startsWith('/api/review/') || pathname.startsWith('/api/admin/') || pathname.startsWith('/api/export/')

  if (!isDashboardProtected && !isApiProtected) {
    return NextResponse.next()
  }

  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
  const token = await getToken({ req, secret })
  const role = (token as { role?: string } | null)?.role
  const isApproved = (token as { isApproved?: boolean } | null)?.isApproved

  // Protected routes require authentication
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Authentication required' }, { status: 401 })
    }
    const signInUrl = new URL('/auth/signin', req.url)
    signInUrl.searchParams.set('callbackUrl', req.url)
    return NextResponse.redirect(signInUrl)
  }

  // Check approval status for privileged roles
  if (role === 'REVIEWER' || role === 'ADMIN') {
    if (!isApproved) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Account pending approval', message: 'Your account is pending admin approval' }, { status: 403 })
      }
      const signInUrl = new URL('/auth/signin', req.url)
      signInUrl.searchParams.set('error', 'pending-approval')
      return NextResponse.redirect(signInUrl)
    }
  }

  // Role-based API access
  if (pathname.startsWith('/api/review/')) {
    if (role !== 'REVIEWER' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden', message: 'Reviewer or admin access required' }, { status: 403 })
    }
  }

  if (pathname.startsWith('/api/admin/') || pathname.startsWith('/api/export/')) {
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden', message: 'Admin access required' }, { status: 403 })
    }
  }

  // Protected dashboard pages
  if (pathname.startsWith('/dashboard/admin/')) {
    if (role !== 'ADMIN') {
      const dashboardUrl = new URL('/dashboard', req.url)
      return NextResponse.redirect(dashboardUrl)
    }
  }

  if (pathname.startsWith('/dashboard/review/')) {
    if (role !== 'REVIEWER' && role !== 'ADMIN') {
      const dashboardUrl = new URL('/dashboard', req.url)
      return NextResponse.redirect(dashboardUrl)
    }
  }

  // Dashboard pages (non-contribute) require authentication
  if (pathname.startsWith('/dashboard/')) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

