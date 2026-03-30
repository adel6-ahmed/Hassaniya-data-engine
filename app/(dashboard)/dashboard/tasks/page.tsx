'use client'
// app/(dashboard)/dashboard/tasks/page.tsx

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Task {
  id: string
  title: string
  description: string
  instructions: string
  moduleTarget: string
  domain: string
  targetCount: number
  status: string
  dueDate: string | null
  createdAt: string
  createdBy: { name: string }
  assignee: { name: string } | null
  _count: { submissions: number }
}

const NOW = Date.now()

const MODULE_LINKS: Record<string, string> = {
  parallel_sentences: '/dashboard/contribute/sentences',
  monolingual_texts:  '/dashboard/contribute/texts',
  proverbs:           '/dashboard/contribute/proverbs',
  dialogues:          '/dashboard/contribute/dialogues',
  faq:                '/dashboard/contribute/faq',
}

const MODULE_ICONS: Record<string, string> = {
  parallel_sentences: '📝',
  monolingual_texts:  '📖',
  proverbs:           '🌿',
  dialogues:          '💬',
  faq:                '❓',
}

const MODULE_LABELS: Record<string, string> = {
  parallel_sentences: 'جمل متوازية',
  monolingual_texts:  'نصوص',
  proverbs:           'أمثال',
  dialogues:          'حوارات',
  faq:                'أسئلة شائعة',
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        if (!cancelled) setLoading(true)
        const res = await fetch(`/api/tasks?status=${activeTab}`)
        const json = await res.json()
        if (!cancelled) {
          setTasks((json.data as Task[]) || [])
          setLoading(false)
        }
      } catch {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [activeTab])

  const getDaysLeft = (dueDate: string | null) => {
    if (!dueDate) return null
    const diff = new Date(dueDate).getTime() - NOW
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const getProgress = (task: Task) => {
    return Math.min(100, Math.round((task._count.submissions / task.targetCount) * 100))
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">المهام الأسبوعية</h1>
          <p className="page-subtitle">أنجز المهام المطلوبة وساهم في بناء قاعدة البيانات</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'ACTIVE' ? 'active' : ''}`}
          onClick={() => setActiveTab('ACTIVE')}>
          ⚡ مهام نشطة
        </button>
        <button className={`tab ${activeTab === 'COMPLETED' ? 'active' : ''}`}
          onClick={() => setActiveTab('COMPLETED')}>
          ✅ مكتملة
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            {activeTab === 'ACTIVE' ? '🎉' : '📋'}
          </div>
          <div style={{ color: 'var(--ink-muted)', fontSize: '.95rem' }}>
            {activeTab === 'ACTIVE' ? 'لا توجد مهام نشطة حالياً' : 'لا توجد مهام مكتملة'}
          </div>
          <Link href="/dashboard/contribute" className="btn btn-primary btn-sm" style={{ marginTop: '1rem', display: 'inline-flex' }}>
            ساهم بحرية
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tasks.map((task, i) => {
            const progress = getProgress(task)
            const daysLeft = getDaysLeft(task.dueDate)
            const link = MODULE_LINKS[task.moduleTarget] || '/dashboard/contribute'
            const icon = MODULE_ICONS[task.moduleTarget] || '📋'
            const moduleLabel = MODULE_LABELS[task.moduleTarget] || task.moduleTarget

            return (
              <div key={task.id} className={`card animate-fade-in stagger-${Math.min(i + 1, 5)}`}
                style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  {/* Icon */}
                  <div style={{
                    width: 52, height: 52, borderRadius: 'var(--radius)',
                    background: 'var(--primary)', color: 'white', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
                  }}>
                    {icon}
                  </div>

                  <div style={{ flex: 1 }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{task.title}</h3>
                        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginTop: '.3rem', flexWrap: 'wrap' }}>
                          <span className="badge badge-pending" style={{ fontSize: '.72rem' }}>{moduleLabel}</span>
                          <span className="badge badge-info" style={{ fontSize: '.72rem', background: '#eaf2ff', color: '#1a5276', border: '1px solid #a9cce3' }}>{task.domain}</span>
                          {task.assignee && (
                            <span style={{ fontSize: '.75rem', color: 'var(--ink-faint)' }}>→ {task.assignee.name}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'left', flexShrink: 0 }}>
                        {daysLeft !== null && (
                          <div style={{
                            fontSize: '.78rem', fontWeight: 600,
                            color: daysLeft <= 2 ? 'var(--danger)' : daysLeft <= 5 ? 'var(--warning)' : 'var(--ink-faint)',
                          }}>
                            {daysLeft > 0 ? `${daysLeft} يوم متبقي` : daysLeft === 0 ? 'اليوم آخر يوم!' : 'منتهي'}
                          </div>
                        )}
                        <div style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--primary)', direction: 'ltr', textAlign: 'right', marginTop: '.2rem' }}>
                          {task._count.submissions} / {task.targetCount}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p style={{ fontSize: '.85rem', color: 'var(--ink-muted)', marginBottom: '.75rem', lineHeight: 1.6 }}>
                      {task.description}
                    </p>

                    {/* Instructions */}
                    <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '.75rem', marginBottom: '1rem', borderRight: '2px solid var(--accent)', fontSize: '.83rem', color: 'var(--ink-muted)', lineHeight: 1.6 }}>
                      📋 {task.instructions}
                    </div>

                    {/* Progress */}
                    <div style={{ marginBottom: '.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', color: 'var(--ink-faint)', marginBottom: '.3rem' }}>
                        <span>التقدم</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="progress">
                        <div className="progress-bar" style={{
                          width: `${progress}%`,
                          background: progress >= 100 ? 'var(--success)' : 'var(--primary-glow)',
                        }} />
                      </div>
                    </div>

                    {/* CTA */}
                    <Link href={link} className="btn btn-primary btn-sm">
                      {icon} ابدأ المساهمة
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
