'use client'
// app/(dashboard)/dashboard/contribute/page.tsx

import Link from 'next/link'
import { useState, useEffect } from 'react'

interface StatsOverview {
  totalEntries?: number
  totalSentences?: number
  totalTexts?: number
  totalProverbs?: number
  totalDialogues?: number
  totalFaqs?: number
}

interface StatsResponse {
  overview?: StatsOverview
}

const MODULES = [
  {
    href: '/dashboard/contribute/sentences',
    icon: '📝',
    title: 'جمل متوازية',
    desc: 'جمل حسانية مع ترجماتها للعربية والفرنسية',
    color: 'var(--primary)',
    tip: '3 → 40 كلمة',
    useCase: 'Translation • Instruction Tuning',
  },
  {
    href: '/dashboard/contribute/texts',
    icon: '📖',
    title: 'نصوص طويلة',
    desc: 'مقالات وقصص وحوارات مطولة بالحسانية',
    color: '#6c3483',
    tip: '300 → 6000 حرف',
    useCase: 'Language Modeling • Corpus',
  },
  {
    href: '/dashboard/contribute/proverbs',
    icon: '🌿',
    title: 'أمثال وتعابير',
    desc: 'الموروث الثقافي والتعابير الاصطلاحية',
    color: 'var(--accent)',
    tip: '2 → 30 كلمة',
    useCase: 'Cultural Knowledge • NLP',
  },
  {
    href: '/dashboard/contribute/dialogues',
    icon: '💬',
    title: 'حوارات متعددة',
    desc: 'محادثات واقعية بين عملاء وموظفين',
    color: '#2471a3',
    tip: '2+ جولات',
    useCase: 'Conversational AI • ChatML',
  },
  {
    href: '/dashboard/contribute/faq',
    icon: '❓',
    title: 'أسئلة شائعة',
    desc: 'قاعدة معرفية لمساعدي دعم العملاء',
    color: '#1e8449',
    tip: 'سؤال + جواب',
    useCase: 'RAG • Customer Support AI',
  },
]

export default function ContributePage() {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => setStats(d.data))
  }, [])

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const counts: Record<string, number> = {
    '/dashboard/contribute/sentences': stats?.overview?.totalSentences || 0,
    '/dashboard/contribute/texts':     stats?.overview?.totalTexts || 0,
    '/dashboard/contribute/proverbs':  stats?.overview?.totalProverbs || 0,
    '/dashboard/contribute/dialogues': stats?.overview?.totalDialogues || 0,
    '/dashboard/contribute/faq':       stats?.overview?.totalFaqs || 0,
  }

  return (
    <div className="animate-fade-in">
      {/* Responsive Page Header */}
      <div
        className="page-header"
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '2rem',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        <div>
          <h1 className="page-title" style={{ fontSize: isMobile ? '1.5rem' : '1.8rem' }}>
            المساهمة في البيانات
          </h1>
          <p className="page-subtitle">اختر نوع البيانات الذي تريد المساهمة به</p>
        </div>
        <div
          style={{
            background: 'var(--primary)',
            color: 'white',
            padding: isMobile ? '.5rem 1.2rem' : '.6rem 1.5rem',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center',
            flexShrink: 0,
            minWidth: isMobile ? 'auto' : '150px',
          }}
        >
          <div style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 800, fontFamily: 'var(--font-amiri)' }}>
            {(stats?.overview?.totalEntries || 0).toLocaleString('ar-MA')}
          </div>
          <div style={{ fontSize: '.72rem', opacity: 0.7 }}>سجل مجمّع</div>
        </div>
      </div>

      {/* Responsive Modules Grid - 5 cards on desktop, 3 on tablet, 2 on mobile, 1 on small phones */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile
            ? 'repeat(auto-fill, minmax(160px, 1fr))'
            : window.innerWidth < 1024
            ? 'repeat(3, 1fr)'
            : 'repeat(5, 1fr)',
          gap: isMobile ? '1rem' : '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {MODULES.map((mod, i) => (
          <Link key={mod.href} href={mod.href} style={{ textDecoration: 'none' }}>
            <div
              className={`card animate-fade-in stagger-${i + 1}`}
              style={{
                cursor: 'pointer',
                borderTop: `3px solid ${mod.color}`,
                transition: 'all .2s ease',
                padding: isMobile ? '1rem' : '1.5rem',
              }}
              onMouseEnter={e => {
                if (!isMobile) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = 'translateY(-4px)';
                  el.style.boxShadow = 'var(--shadow-lg)';
                }
              }}
              onMouseLeave={e => {
                if (!isMobile) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = 'none';
                  el.style.boxShadow = 'none';
                }
              }}
            >
              {/* Card Header - Icon & Count */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: isMobile ? 40 : 50,
                    height: isMobile ? 40 : 50,
                    borderRadius: 'var(--radius)',
                    background: mod.color + '15',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isMobile ? '1.2rem' : '1.5rem',
                    flexShrink: 0,
                  }}
                >
                  {mod.icon}
                </div>
                <div style={{ textAlign: 'left', direction: 'ltr' }}>
                  <div style={{ fontSize: isMobile ? '1.1rem' : '1.4rem', fontWeight: 800, color: mod.color, fontFamily: 'var(--font-amiri)' }}>
                    {(counts[mod.href] || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '.65rem', color: 'var(--ink-faint)' }}>سجل</div>
                </div>
              </div>

              {/* Card Title */}
              <h3 style={{ fontSize: isMobile ? '.95rem' : '1.05rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '.4rem', lineHeight: 1.3 }}>
                {mod.title}
              </h3>

              {/* Card Description - Hidden on very small phones */}
              {!isMobile && (
                <p style={{ fontSize: '.85rem', color: 'var(--ink-muted)', marginBottom: '.75rem', lineHeight: 1.5 }}>
                  {mod.desc}
                </p>
              )}

              {/* Card Footer - Badge & Use Case */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '.5rem',
                  marginTop: isMobile ? '.5rem' : '.75rem',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: isMobile ? '.65rem' : '.72rem', color: 'var(--ink-faint)', background: 'var(--surface-raised)', padding: '.2rem .5rem', borderRadius: '99px', whiteSpace: 'nowrap' }}>
                  {mod.tip}
                </span>
                <span style={{ fontSize: isMobile ? '.65rem' : '.7rem', color: mod.color, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {mod.useCase}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Responsive Info Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: isMobile ? '1.5rem 1rem' : '2rem',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: isMobile ? '1rem' : '2rem',
          color: 'white',
        }}
      >
        <div style={{ fontSize: isMobile ? '2rem' : '3rem', flexShrink: 0 }}>🎯</div>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontFamily: 'var(--font-amiri)',
              fontSize: isMobile ? '1.1rem' : '1.3rem',
              marginBottom: '.4rem',
              fontWeight: 700,
            }}
          >
            هدف المنصة: 50,000+ سجل لغوي
          </h3>
          <p style={{ fontSize: isMobile ? '.8rem' : '.85rem', opacity: 0.8, lineHeight: 1.6 }}>
            مساهمتك تساعد في بناء أول نموذج ذكاء اصطناعي باللهجة الحسانية.
            كل جملة تضيفها تقربنا خطوة من هذا الهدف.
          </p>
        </div>
        <Link
          href="/dashboard/tasks"
          className="btn btn-accent btn-lg"
          style={{
            flexShrink: 0,
            width: isMobile ? '100%' : 'auto',
            textAlign: 'center',
          }}
        >
          📋 المهام المتاحة
        </Link>
      </div>
    </div>
  )
}
