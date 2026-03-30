'use client'

import { useSession } from 'next-auth/react'

export function PublicNotice() {
  const { data: session, status } = useSession()
  if (status === 'loading' || session?.user) return null

  return (
    <div
      className="card"
      style={{
        marginBottom: '1rem',
        background: 'color-mix(in srgb, var(--primary) 10%, var(--surface))',
        border: '1px solid color-mix(in srgb, var(--primary) 35%, var(--border))',
        color: 'var(--ink)',
        direction: 'rtl',
      }}
    >
      <div style={{ fontSize: '.9rem', fontWeight: 600 }}>
        يمكنك المساهمة بدون تسجيل الدخول • للوصول إلى لوحة المراجعة سجل دخولك
      </div>
    </div>
  )
}
