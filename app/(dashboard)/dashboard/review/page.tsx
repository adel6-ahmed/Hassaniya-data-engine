'use client'

import { useState, useEffect, useCallback } from 'react'

type Module = 'sentences' | 'texts' | 'proverbs' | 'faqs'

type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION'

type ReviewActionId = 'approve' | 'review' | 'reject'

type ReviewAction = {
  id: ReviewActionId
  label: string
  status: ReviewStatus
  bgColor: string
  textColor: string
  icon: string
}

const REVIEW_ACTIONS: ReviewAction[] = [
  { id: 'approve', label: '✅ موافقة', status: 'APPROVED', bgColor: '#eafaf1', textColor: '#1e8449', icon: '✅' },
  { id: 'review', label: '✏️ مراجعة', status: 'NEEDS_REVISION', bgColor: '#eaf2ff', textColor: '#2471a3', icon: '✏️' },
  { id: 'reject', label: '❌ رفض', status: 'REJECTED', bgColor: '#fdedec', textColor: '#c0392b', icon: '❌' },
]

interface QueueItem {
  id: string
  reviewStatus: ReviewStatus
  domain: string
  createdAt: string
  contributor?: { name?: string }
  hassaniyaSentence?: string
  msaTranslation?: string
  frenchTranslation?: string
  hassaniyaText?: string
  title?: string
  proverbText?: string
  meaningExplanation?: string
  literalTranslation?: string
  questionHassaniya?: string
  answerHassaniya?: string
  answerFrench?: string
}

interface Queue {
  sentences: { count: number; items: QueueItem[] }
  texts:     { count: number; items: QueueItem[] }
  proverbs:  { count: number; items: QueueItem[] }
  faqs:      { count: number; items: QueueItem[] }
  total: number
}

const MODULE_MAP: Record<Module, string> = {
  sentences: 'sentences',
  texts: 'texts',
  proverbs: 'proverbs',
  faqs: 'faq',
}

const MODULE_LABELS: Record<Module, { label: string; icon: string; color: string }> = {
  sentences: { label: 'الجمل',   icon: '💬', color: 'var(--primary)' },
  texts:     { label: 'النصوص',  icon: '📄', color: '#6c3483' },
  proverbs:  { label: 'الأمثال', icon: '🌿', color: 'var(--accent)' },
  faqs:      { label: 'الأسئلة', icon: '❓', color: '#1e8449' },
}

function getItemText(item: QueueItem, module: Module): { primary: string; secondary?: string } {
  switch (module) {
    case 'sentences': return { primary: item.hassaniyaSentence || '', secondary: item.msaTranslation }
    case 'texts':     return { primary: item.title || 'نص بدون عنوان', secondary: item.hassaniyaText?.slice(0, 100) + '...' }
    case 'proverbs':  return { primary: item.proverbText || '', secondary: item.meaningExplanation }
    case 'faqs':      return { primary: item.questionHassaniya || '', secondary: item.answerHassaniya }
  }
}

interface EditValues {
  [key: string]: string | undefined
}

export default function ReviewQueuePage() {
  const [queue, setQueue] = useState<Queue | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeModule, setActiveModule] = useState<Module>('sentences')
  const [reviewing, setReviewing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<QueueItem | null>(null)
  const [editValues, setEditValues] = useState<EditValues>({})
  const [savingEdit, setSavingEdit] = useState(false)

  const fetchQueue = useCallback(() => {
    setLoading(true)
    fetch('/api/review/queue?limit=15')
      .then(r => r.json())
      .then(d => { setQueue(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { fetchQueue() }, [fetchQueue])

  const handleReview = async (itemId: string, actionId: ReviewActionId, status: ReviewStatus) => {
    setReviewing(itemId)
    setError(null)
    const apiModule = MODULE_MAP[activeModule]
    const curationStage = status === 'APPROVED' || status === 'NEEDS_REVISION' ? 'REVIEWED' : undefined

    // If the action is 'review', open the edit modal instead
    if (actionId === 'review') {
      const currentItem = (queue?.[activeModule]?.items || []).find(item => item.id === itemId)
      if (currentItem) {
        setEditingItem(currentItem)
        setEditValues(getInitialEditValues(currentItem, activeModule))
      }
      setReviewing(null)
      return
    }

    try {
      const res = await fetch(`/api/review/${apiModule}/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionId, reviewStatus: status, curationStage }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error || 'Failed to update review status')
      }

      await fetchQueue()
    } catch (error) {
      console.error('handleReview error', error)
      setError((error as Error).message || 'An error occurred')
    } finally {
      setReviewing(null)
    }
  }

  const getInitialEditValues = (item: QueueItem, module: Module): EditValues => {
    switch (module) {
      case 'sentences':
        return {
          hassaniyaSentence: item.hassaniyaSentence,
          msaTranslation: item.msaTranslation,
          frenchTranslation: item.frenchTranslation,
        }
      case 'texts':
        return {
          title: item.title,
          hassaniyaText: item.hassaniyaText,
        }
      case 'proverbs':
        return {
          proverbText: item.proverbText,
          meaningExplanation: item.meaningExplanation,
          literalTranslation: item.literalTranslation,
          frenchTranslation: item.frenchTranslation,
        }
      case 'faqs':
        return {
          questionHassaniya: item.questionHassaniya,
          answerHassaniya: item.answerHassaniya,
          answerFrench: item.answerFrench,
        }
    }
  }

  const handleEditChange = (field: string, value: string) => {
    setEditValues(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveEdit = async () => {
    if (!editingItem) return
    setSavingEdit(true)
    setError(null)

    try {
      const apiModule = MODULE_MAP[activeModule]
      const payload: any = {
        action: 'review',
        reviewStatus: 'NEEDS_REVISION',
        curationStage: 'REVIEWED',
        ...editValues,
      }

      const res = await fetch(`/api/review/${apiModule}/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error || 'Failed to save edits')
      }

      setEditingItem(null)
      setEditValues({})
      await fetchQueue()
    } catch (error) {
      console.error('handleSaveEdit error', error)
      setError((error as Error).message || 'An error occurred')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingItem(null)
    setEditValues({})
    setError(null)
  }

  const activeItems = queue?.[activeModule]?.items || []

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">لوحة المراجعة</h1>
          <p className="page-subtitle">راجع وقيّم مساهمات المتطوعين</p>
        </div>
        <div style={{ background: 'var(--primary)', color: 'white', padding: '.5rem 1.25rem', borderRadius: '99px', fontSize: '.9rem', fontWeight: 600 }}>
          {queue?.total ?? 0} معلق
        </div>
      </div>

      {error && (
        <div style={{ background: '#fdedec', border: '1px solid #f5b7b1', color: '#922b21', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
          خطأ: {error}
        </div>
      )}

      {/* Module tabs */}
      <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {(Object.keys(MODULE_LABELS) as Module[]).map(mod => {
          const meta = MODULE_LABELS[mod]
          const count = queue?.[mod]?.count ?? 0
          return (
            <button key={mod} onClick={() => setActiveModule(mod)}
              className={`btn ${activeModule === mod ? 'btn-primary' : 'btn-ghost'}`}
              style={activeModule === mod ? { background: meta.color } : {}}>
              {meta.icon} {meta.label}
              {count > 0 && (
                <span style={{ background: activeModule === mod ? 'rgba(255,255,255,.25)' : 'var(--danger)', color: 'white', borderRadius: '999px', fontSize: '.7rem', padding: '.1rem .45rem', fontWeight: 700 }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" />
        </div>
      ) : activeItems.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <div style={{ color: 'var(--ink-muted)' }}>لا توجد سجلات تنتظر المراجعة</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {activeItems.map(item => {
            const text = getItemText(item, activeModule)
            const meta = MODULE_LABELS[activeModule]
            const isProcessing = reviewing === item.id
            return (
              <div key={item.id} className="card" style={{ padding: '1.25rem', borderRight: `3px solid ${meta.color}` }}>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginBottom: '.5rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-pending" style={{ fontSize: '.7rem' }}>{item.domain}</span>
                      <span style={{ fontSize: '.78rem', color: 'var(--ink-faint)' }}>
                        {item.contributor?.name || 'مجهول'} — {new Date(item.createdAt).toLocaleDateString('ar-MA')}
                      </span>
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '.375rem', lineHeight: 1.5 }}>
                      {text.primary}
                    </div>
                    {text.secondary && (
                      <div style={{ fontSize: '.85rem', color: 'var(--ink-muted)' }}>{text.secondary}</div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', minWidth: 150 }}>
                    {REVIEW_ACTIONS.map(action => (
                      <button
                        key={action.id}
                        data-action-id={action.id}
                        data-action-status={action.status}
                        onClick={() => handleReview(item.id, action.id, action.status)}
                        disabled={isProcessing}
                        className="btn btn-sm"
                        style={{ background: action.bgColor, color: action.textColor, justifyContent: 'center' }}
                      >
                        {isProcessing ? '...' : action.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div className="card" style={{
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '2rem',
            direction: 'rtl',
          }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 700 }}>تعديل المحتوى</h2>
            
            {error && (
              <div style={{ background: '#fdedec', border: '1px solid #f5b7b1', color: '#922b21', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                خطأ: {error}
              </div>
            )}

            {/* Edit form fields based on module type */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {activeModule === 'sentences' && (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: '.5rem', fontWeight: 600 }}>الجملة الحسانية</label>
                    <input
                      type="text"
                      value={editValues.hassaniyaSentence || ''}
                      onChange={(e) => handleEditChange('hassaniyaSentence', e.target.value)}
                      style={{ width: '100%', padding: '.75rem', border: '1px solid #ccc', borderRadius: '0.5rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '.5rem', fontWeight: 600 }}>الترجمة للعربية الفصحى</label>
                    <input
                      type="text"
                      value={editValues.msaTranslation || ''}
                      onChange={(e) => handleEditChange('msaTranslation', e.target.value)}
                      style={{ width: '100%', padding: '.75rem', border: '1px solid #ccc', borderRadius: '0.5rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '.5rem', fontWeight: 600 }}>الترجمة للفرنسية</label>
                    <input
                      type="text"
                      value={editValues.frenchTranslation || ''}
                      onChange={(e) => handleEditChange('frenchTranslation', e.target.value)}
                      style={{ width: '100%', padding: '.75rem', border: '1px solid #ccc', borderRadius: '0.5rem' }}
                    />
                  </div>
                </>
              )}

              {activeModule === 'texts' && (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: '.5rem', fontWeight: 600 }}>العنوان</label>
                    <input
                      type="text"
                      value={editValues.title || ''}
                      onChange={(e) => handleEditChange('title', e.target.value)}
                      style={{ width: '100%', padding: '.75rem', border: '1px solid #ccc', borderRadius: '0.5rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '.5rem', fontWeight: 600 }}>النص الحسانى</label>
                    <textarea
                      value={editValues.hassaniyaText || ''}
                      onChange={(e) => handleEditChange('hassaniyaText', e.target.value)}
                      style={{ width: '100%', padding: '.75rem', border: '1px solid #ccc', borderRadius: '0.5rem', minHeight: '150px' }}
                    />
                  </div>
                </>
              )}

              {activeModule === 'proverbs' && (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: '.5rem', fontWeight: 600 }}>المثل</label>
                    <input
                      type="text"
                      value={editValues.proverbText || ''}
                      onChange={(e) => handleEditChange('proverbText', e.target.value)}
                      style={{ width: '100%', padding: '.75rem', border: '1px solid #ccc', borderRadius: '0.5rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '.5rem', fontWeight: 600 }}>معنى المثل</label>
                    <textarea
                      value={editValues.meaningExplanation || ''}
                      onChange={(e) => handleEditChange('meaningExplanation', e.target.value)}
                      style={{ width: '100%', padding: '.75rem', border: '1px solid #ccc', borderRadius: '0.5rem', minHeight: '100px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '.5rem', fontWeight: 600 }}>الترجمة الحرفية</label>
                    <input
                      type="text"
                      value={editValues.literalTranslation || ''}
                      onChange={(e) => handleEditChange('literalTranslation', e.target.value)}
                      style={{ width: '100%', padding: '.75rem', border: '1px solid #ccc', borderRadius: '0.5rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '.5rem', fontWeight: 600 }}>الترجمة للفرنسية</label>
                    <input
                      type="text"
                      value={editValues.frenchTranslation || ''}
                      onChange={(e) => handleEditChange('frenchTranslation', e.target.value)}
                      style={{ width: '100%', padding: '.75rem', border: '1px solid #ccc', borderRadius: '0.5rem' }}
                    />
                  </div>
                </>
              )}

              {activeModule === 'faqs' && (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: '.5rem', fontWeight: 600 }}>السؤال (الحسانية)</label>
                    <input
                      type="text"
                      value={editValues.questionHassaniya || ''}
                      onChange={(e) => handleEditChange('questionHassaniya', e.target.value)}
                      style={{ width: '100%', padding: '.75rem', border: '1px solid #ccc', borderRadius: '0.5rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '.5rem', fontWeight: 600 }}>الإجابة (الحسانية)</label>
                    <textarea
                      value={editValues.answerHassaniya || ''}
                      onChange={(e) => handleEditChange('answerHassaniya', e.target.value)}
                      style={{ width: '100%', padding: '.75rem', border: '1px solid #ccc', borderRadius: '0.5rem', minHeight: '100px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '.5rem', fontWeight: 600 }}>الإجابة (الفرنسية)</label>
                    <textarea
                      value={editValues.answerFrench || ''}
                      onChange={(e) => handleEditChange('answerFrench', e.target.value)}
                      style={{ width: '100%', padding: '.75rem', border: '1px solid #ccc', borderRadius: '0.5rem', minHeight: '100px' }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelEdit}
                disabled={savingEdit}
                className="btn btn-ghost"
                style={{ padding: '.5rem 1.25rem' }}
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="btn btn-primary"
                style={{ padding: '.5rem 1.25rem' }}
              >
                {savingEdit ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}