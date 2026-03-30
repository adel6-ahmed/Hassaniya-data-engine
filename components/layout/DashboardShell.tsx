'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Close sidebar when route changes
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname, setIsSidebarOpen])

  // Detect mobile/tablet screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen && isMobile) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isSidebarOpen, isMobile])

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: '1rem', color: 'var(--ink-muted)' }}>جاري التحميل...</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--sand)', position: 'relative' }}>
      {/* Mobile/Tablet Header Bar - Hidden on desktop (>= 1024px) */}
      <div
        style={{
          display: isMobile ? 'flex' : 'none',
          position: 'fixed',
          top: 0,
          right: 0,
          left: 0,
          height: '60px',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingRight: '1rem',
          paddingLeft: '1rem',
          zIndex: 30,
        }}
      >
        {/* Hamburger Button (Left side for RTL) */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '1.4rem',
            color: 'var(--primary)',
            cursor: 'pointer',
            padding: '.5rem',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 200ms ease',
          }}
          aria-label="toggle sidebar"
          title="فتح القائمة"
        >
          ☰
        </button>

        {/* Platform Name (Center) */}
        <div
          style={{
            fontFamily: 'var(--font-amiri)',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'var(--primary)',
          }}
        >
          منصة الحسانية
        </div>

        {/* User Avatar (Right side for RTL) */}
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '.9rem',
            fontWeight: 700,
          }}
        >
          {session?.user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>

      {/* Backdrop Overlay for Mobile Sidebar - Only visible on mobile/tablet */}
      {isMobile && isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            left: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40,
            animation: 'fadeIn 300ms ease-in-out',
          }}
        />
      )}

      {/* Sidebar - Desktop always visible, Mobile/Tablet as overlay */}
      <div
        style={{
          position: isMobile ? 'fixed' : 'relative',
          top: isMobile ? 0 : 'auto',
          right: isMobile ? 0 : 'auto',
          width: isMobile ? '280px' : '260px',
          height: isMobile ? '100vh' : 'auto',
          transform: isMobile ? (isSidebarOpen ? 'translateX(0)' : 'translateX(100%)') : 'translateX(0)',
          transition: isMobile ? 'transform 300ms ease-in-out' : 'none',
          zIndex: 50,
        }}
      >
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          padding: isMobile ? 'calc(60px + 1rem) 1rem 1rem 1rem' : '2rem',
          overflowY: 'auto',
          maxWidth: isMobile ? '100%' : 'calc(100vw - 260px)',
        }}
      >
        {children}
      </main>

      <style>{`
        @media (max-width: 767px) {
          main {
            padding: calc(60px + 0.75rem) 0.75rem 0.75rem 0.75rem !important;
          }
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          main {
            padding: calc(60px + 1rem) 1rem 1rem 1rem !important;
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

