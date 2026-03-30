'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

interface StatsData {
  overview?: {
    totalEntries?: number
    totalSentences?: number
    totalTexts?: number
    totalProverbs?: number
    totalDialogues?: number
    totalFaqs?: number
  }
}

const MODULES = [
  {
    href: '/dashboard/contribute/sentences',
    icon: '📝',
    title: 'جمل متوازية',
    desc: 'جمل حسانية مع ترجماتها بالعربية الفصحى والفرنسية',
    color: '#1a3a2a',
    tip: '3 إلى 40 كلمة',
    useCase: 'الترجمة والتدريب',
  },
  {
    href: '/dashboard/contribute/texts',
    icon: '📖',
    title: 'نصوص طويلة',
    desc: 'مقالات وقصص ومحادثات طويلة بالحسانية',
    color: '#6c3483',
    tip: '300 إلى 6000 حرف',
    useCase: 'نمذجة لغة وبناء المستودع',
  },
  {
    href: '/dashboard/contribute/proverbs',
    icon: '🌿',
    title: 'أمثال وتعابير',
    desc: 'الموروث الثقافي والتعابير الاصطلاحية',
    color: '#d4a853',
    tip: '2 إلى 30 كلمة',
    useCase: 'المعرفة الثقافية ومعالجة اللغة',
  },
  {
    href: '/dashboard/contribute/dialogues',
    icon: '💬',
    title: 'حوارات',
    desc: 'محادثات حقيقية بين العملاء والموظفين',
    color: '#2471a3',
    tip: 'جولتين أو أكثر',
    useCase: 'التحاور الذكي و ChatML',
  },
  {
    href: '/dashboard/contribute/faq',
    icon: '❓',
    title: 'أسئلة شائعة',
    desc: 'قاعدة معرفية لأنظمة دعم العملاء الذكية',
    color: '#1e8449',
    tip: 'سؤال وجواب',
    useCase: 'الاسترجاع والمساعدات الذكية',
  },
]

export default function ContributePage() {
  const [stats, setStats] = useState<StatsData | null>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => setStats(d.data))
      .catch(() => {})
  }, [])

  const counts: Record<string, number> = {
    '/dashboard/contribute/sentences': stats?.overview?.totalSentences ?? 0,
    '/dashboard/contribute/texts':     stats?.overview?.totalTexts ?? 0,
    '/dashboard/contribute/proverbs':  stats?.overview?.totalProverbs ?? 0,
    '/dashboard/contribute/dialogues': stats?.overview?.totalDialogues ?? 0,
    '/dashboard/contribute/faq':       stats?.overview?.totalFaqs ?? 0,
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid #ede8de' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-amiri)', fontSize: '1.8rem', color: '#1a3a2a', fontWeight: 700 }}>
            المساهمة بالبيانات
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#8a7a6a', marginTop: '0.25rem' }}>
            اختر نوع البيانات التي تريد المساهمة بها
          </p>
        </div>
        <div style={{ background: '#1a3a2a', color: 'white', padding: '0.6rem 1.5rem', borderRadius: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            {(stats?.overview?.totalEntries ?? 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', opacity: 0.7 }}>إجمالي التسجيلات</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {MODULES.map((mod) => (
          <Link key={mod.href} href={mod.href} style={{ textDecoration: 'none' }}>
            <div
              style={{
                background: 'white',
                border: '1px solid #ede8de',
                borderTop: '3px solid ' + mod.color,
                borderRadius: '1rem',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = ''
                e.currentTarget.style.boxShadow = ''
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ width: 50, height: 50, borderRadius: '0.5rem', background: mod.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                  {mod.icon}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: mod.color }}>
                    {(counts[mod.href] ?? 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#8a7a6a' }}>تسجيلات</div>
                </div>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1a1410', marginBottom: '0.4rem' }}>
                {mod.title}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#4a3f35', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                {mod.desc}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#8a7a6a', background: '#faf7f2', padding: '0.2rem 0.6rem', borderRadius: '99px' }}>
                  {mod.tip}
                </span>
                <span style={{ fontSize: '0.7rem', color: mod.color, fontWeight: 600 }}>
                  {mod.useCase}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ background: 'linear-gradient(135deg, #1a3a2a 0%, #2d6a4f 100%)', borderRadius: '1.5rem', padding: '2rem', display: 'flex', alignItems: 'center', gap: '2rem', color: 'white' }}>
        <div style={{ fontSize: '3rem' }}>🎯</div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '0.4rem' }}>
            الهدف: 50,000+ تسجيل لغوي
          </h3>
          <p style={{ fontSize: '0.85rem', opacity: 0.8, lineHeight: 1.6 }}>
            مساهمتك تساعد في بناء أول نموذج ذكي للهجة الحسانية.
          </p>
        </div>
        <Link href="/dashboard/tasks" style={{ flexShrink: 0, background: '#d4a853', color: '#1a1410', padding: '0.85rem 2rem', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 700, fontSize: '1rem' }}>
          عرض المهام
        </Link>
      </div>
    </div>
  )
}
