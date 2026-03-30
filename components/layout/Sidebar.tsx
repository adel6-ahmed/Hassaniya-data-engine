'use client'
// components/layout/Sidebar.tsx
// Responsive sidebar component
// - Desktop: always visible, static position
// - Mobile/Tablet: overlay with slide-in animation from right (RTL)

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

type UserRole = 'ADMIN' | 'REVIEWER' | 'CONTRIBUTOR'

interface SessionUserWithRole {
  name?: string | null
  role?: UserRole
}

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

const NAV_ITEMS = [
  { href: '/dashboard',                             icon: '📊', label: 'لوحة التحكم' },
  { href: '/dashboard/contribute',                  icon: '✍️', label: 'المساهمة' },
  { href: '/dashboard/contribute/sentences',        icon: '📝', label: 'الجمل المتوازية' },
  { href: '/dashboard/contribute/texts',            icon: '📖', label: 'النصوص' },
  { href: '/dashboard/contribute/proverbs',         icon: '🌿', label: 'الأمثال' },
  { href: '/dashboard/contribute/dialogues',        icon: '💬', label: 'الحوارات' },
  { href: '/dashboard/contribute/faq',              icon: '❓', label: 'الأسئلة الشائعة' },
  { href: '/dashboard/tasks',                       icon: '📋', label: 'المهام' },
]
const REVIEWER_NAV = [
  { href: '/dashboard/review', icon: '🔍', label: 'قائمة المراجعة' },
]

const ADMIN_NAV = [
  { href: '/dashboard/export', icon: '⬇️', label: 'تصدير البيانات' },
  { href: '/dashboard/admin/users', icon: '👥', label: 'موافقة المستخدمين' },
]

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role: UserRole = (session?.user as SessionUserWithRole)?.role ?? 'CONTRIBUTOR'
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile/tablet screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <aside
      style={{
        width: isMobile ? '280px' : '260px',
        minHeight: isMobile ? '100vh' : '100vh',
        flexShrink: 0,
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border-light)',
        display: 'flex',
        flexDirection: 'column',
        padding: isMobile ? '1rem 1rem' : '1.5rem 1rem',
        overflow: isMobile ? 'auto' : 'auto',
        // Add padding-top for mobile to account for header
        paddingTop: isMobile ? '1rem' : '1.5rem',
      }}
    >
      {/* Close Button (Mobile only) */}
      {isMobile && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            background: 'transparent',
            border: 'none',
            fontSize: '1.4rem',
            color: 'var(--ink-muted)',
            cursor: 'pointer',
            padding: '.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            zIndex: 100,
          }}
          title="إغلاق القائمة"
        >
          ✕
        </button>
      )}

      {/* Logo */}
      <div style={{ marginBottom: '2rem', padding: '0 .5rem', marginTop: isMobile ? '2rem' : 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-amiri)',
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'var(--primary)',
            lineHeight: 1.2,
          }}
        >
          منصة الحسانية
        </div>
        <div style={{ fontSize: '.75rem', color: 'var(--ink-faint)', marginTop: '.2rem' }}>
          Hassaniya Dataset Platform
        </div>
      </div>

      {/* Main nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '.2rem', flex: 1 }}>
        <div
          style={{
            fontSize: '.72rem',
            fontWeight: 700,
            color: 'var(--ink-faint)',
            padding: '0 .5rem',
            marginBottom: '.4rem',
            textTransform: 'uppercase',
            letterSpacing: '.05em',
          }}
        >
          الرئيسية
        </div>
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link ${pathname === item.href ? 'active' : ''}`}
            onClick={isMobile ? onClose : undefined}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}

        {['REVIEWER', 'ADMIN'].includes(role) && (
          <>
            <div
              style={{
                fontSize: '.72rem',
                fontWeight: 700,
                color: 'var(--ink-faint)',
                padding: '1rem .5rem .4rem',
                textTransform: 'uppercase',
                letterSpacing: '.05em',
              }}
            >
              المراجعة
            </div>
            {REVIEWER_NAV.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                onClick={isMobile ? onClose : undefined}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </>
        )}

        {role === 'ADMIN' && (
          <>
            <div
              style={{
                fontSize: '.72rem',
                fontWeight: 700,
                color: 'var(--ink-faint)',
                padding: '1rem .5rem .4rem',
                textTransform: 'uppercase',
                letterSpacing: '.05em',
              }}
            >
              الإدارة
            </div>
            {ADMIN_NAV.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                onClick={isMobile ? onClose : undefined}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User info */}
      <div
        style={{
          borderTop: '1px solid var(--border-light)',
          paddingTop: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '.5rem',
          marginTop: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '.9rem',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {session?.user?.name?.[0] || '؟'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '.85rem',
                fontWeight: 600,
                color: 'var(--ink)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {session?.user?.name || 'مستخدم'}
            </div>
            <div style={{ fontSize: '.72rem', color: 'var(--ink-faint)' }}>
              {role === 'ADMIN' ? 'مدير' : role === 'REVIEWER' ? 'مراجع' : 'مساهم'}
            </div>
          </div>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => signOut()}
          style={{ width: '100%' }}
        >
          تسجيل الخروج
        </button>
      </div>
    </aside>
  )
}