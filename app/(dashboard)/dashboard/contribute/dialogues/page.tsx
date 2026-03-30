'use client'
// app/(dashboard)/dashboard/contribute/dialogues/page.tsx

import { useState } from 'react'
import { PublicNotice } from '@/components/ui/PublicNotice'

type SpeakerRole = 'user' | 'assistant' | 'system'
type DialogueStage = 'OPENING' | 'CLARIFICATION' | 'RESOLUTION' | 'ESCALATION' | 'CLOSING'

interface Turn {
  id: string
  speakerRole: SpeakerRole
  dialogueStage: DialogueStage
  utteranceText: string
  intent: string
}

const ROLES: { value: SpeakerRole; label: string; color: string; icon: string }[] = [
  { value: 'user',      label: 'عميل',          color: '#2471a3', icon: '👤' },
  { value: 'assistant', label: 'موظف/مساعد ذكي', color: '#1e8449', icon: '🎧' },
  { value: 'system',    label: 'نظام',          color: '#6c3483', icon: '⚙️' },
]

const STAGES: { value: DialogueStage; label: string }[] = [
  { value: 'OPENING',       label: 'افتتاح' },
  { value: 'CLARIFICATION', label: 'استيضاح' },
  { value: 'RESOLUTION',    label: 'حل' },
  { value: 'ESCALATION',    label: 'تصعيد' },
  { value: 'CLOSING',       label: 'إغلاق' },
]

const DOMAINS = [
  { value: 'GENERAL', label: 'عام' },
  { value: 'TELECOM', label: 'اتصالات' },
  { value: 'BANKING', label: 'بنوك' },
  { value: 'ECOMMERCE', label: 'تجارة إلكترونية' },
]

const INTENTS = [
  { value: 'GREETING',      label: 'تحية' },
  { value: 'BILLING_ISSUE', label: 'مشكلة فاتورة' },
  { value: 'NETWORK_ISSUE', label: 'مشكلة شبكة' },
  { value: 'COMPLAINT',     label: 'شكوى' },
  { value: 'OTHER',         label: 'أخرى' },
]

const EXAMPLE_DIALOGUE: Turn[] = [
  { id: '1', speakerRole: 'user',      dialogueStage: 'OPENING',      utteranceText: 'شماسي', intent: 'GREETING' },
  { id: '2', speakerRole: 'assistant', dialogueStage: 'OPENING',      utteranceText: 'الحمد لله لاباس، شنو نگدر نخدمك؟', intent: 'GREETING' },
  { id: '3', speakerRole: 'user',      dialogueStage: 'CLARIFICATION', utteranceText: 'باغي نعرف منين نخلص الفاتورة', intent: 'BILLING_ISSUE' },
  { id: '4', speakerRole: 'assistant', dialogueStage: 'RESOLUTION',    utteranceText: 'تقدر تخلصها من التطبيق أو من الفرع', intent: 'BILLING_ISSUE' },
]

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

export default function ContributeDialoguesPage() {
  const [turns, setTurns] = useState<Turn[]>([
    { id: generateId(), speakerRole: 'user', dialogueStage: 'OPENING', utteranceText: '', intent: 'GREETING' },
    { id: generateId(), speakerRole: 'assistant',    dialogueStage: 'OPENING', utteranceText: '', intent: 'GREETING' },
  ])
  const [domain, setDomain] = useState('GENERAL')
  const [title, setTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showExample, setShowExample] = useState(false)

  const addTurn = () => {
    const lastRole = turns[turns.length - 1]?.speakerRole
    const nextRole: SpeakerRole = lastRole === 'user' ? 'assistant' : 'user'
    setTurns(prev => [...prev, {
      id: generateId(), speakerRole: nextRole,
      dialogueStage: 'CLARIFICATION', utteranceText: '', intent: 'OTHER',
    }])
  }

  const removeTurn = (id: string) => {
    if (turns.length > 2) setTurns(prev => prev.filter(t => t.id !== id))
  }

  const updateTurn = (id: string, field: keyof Turn, value: string) => {
    setTurns(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t))
  }

  const loadExample = () => {
    setTurns(EXAMPLE_DIALOGUE.map(t => ({ ...t, id: generateId() })))
    setDomain('TELECOM')
    setTitle('محادثة دفع فاتورة')
    setShowExample(false)
  }

  const onSubmit = async () => {
    const filled = turns.filter(t => t.utteranceText.trim())
    if (filled.length < 2) {
      setResult({ type: 'error', message: 'يجب إضافة جولتين على الأقل' })
      return
    }
    setSubmitting(true)
    setResult(null)
    try {
      const res = await fetch('/api/dialogues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || null,
          domain,
          region: 'OTHER',
          turns: filled.map((t, idx) => ({
            turnIndex: idx,
            utteranceText: t.utteranceText,
            speakerRole: t.speakerRole,
            dialogueStage: t.dialogueStage,
            intent: t.intent,
            domain,
            region: 'OTHER',
            emotionalTone: 'NEUTRAL',
            confidenceLevel: 3,
            verifiedByNativeSpeaker: false,
          })),
        }),
      })
      const json = await res.json().catch(() => null)
      if (res.ok) {
        setResult({ type: 'success', message: 'تمت إضافة الحوار بنجاح ✓' })
        setTurns([
          { id: generateId(), speakerRole: 'user', dialogueStage: 'OPENING', utteranceText: '', intent: 'GREETING' },
          { id: generateId(), speakerRole: 'assistant',    dialogueStage: 'OPENING', utteranceText: '', intent: 'GREETING' },
        ])
        setTitle('')
      } else {
        if (res.status === 409) {
          const duplicateId = json?.duplicateOfId
          setResult({
            type: 'error',
            message: `تم اكتشاف حوار مكرر. معرف الأصلي: ${duplicateId ?? 'unknown'}`,
          })
        } else {
          setResult({ type: 'error', message: json?.error || 'حدث خطأ' })
        }
      }
    } catch {
      setResult({ type: 'error', message: 'خطأ في الاتصال' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <PublicNotice />

      <div className="page-header">
        <div>
          <h1 className="page-title">إضافة حوار متعدد الأدوار</h1>
          <p className="page-subtitle">أنشئ حوارات واقعية بين عميل وموظف أو مساعد ذكي</p>
        </div>
        <button className="btn btn-ghost" onClick={() => setShowExample(!showExample)}>
          💡 مثال تعليمي
        </button>
      </div>

      {showExample && (
        <div className="alert alert-info animate-fade-in" style={{ marginBottom: '1.5rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, marginBottom: '.5rem' }}>مثال: محادثة دفع فاتورة</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
              {EXAMPLE_DIALOGUE.map((t, i) => {
                const role = ROLES.find(r => r.value === t.speakerRole)!
                return (
                  <div key={i} style={{ fontSize: '.85rem', color: role.color }}>
                    <strong>{role.icon} {role.label}:</strong> {t.utteranceText}
                  </div>
                )
              })}
            </div>
            <button className="btn btn-primary btn-sm" style={{ marginTop: '.75rem' }} onClick={loadExample}>
              تحميل هذا المثال
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className={`alert alert-${result.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: '1.5rem' }}>
          {result.type === 'success' ? '✅' : '❌'} {result.message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        {/* Dialogue builder */}
        <div>
          {/* Header settings */}
          <div className="card" style={{ marginBottom: '1rem', padding: '1.25rem' }}>
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">عنوان الحوار (اختياري)</label>
                <input className="input" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="مثل: محادثة شكوى عميل..." />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">المجال</label>
                <select className="select" value={domain} onChange={e => setDomain(e.target.value)}>
                  {DOMAINS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Turns */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {turns.map((turn, index) => {
              const roleInfo = ROLES.find(r => r.value === turn.speakerRole)!
              return (
                <div key={turn.id} className="card animate-fade-in"
                  style={{ padding: '1.1rem', borderRight: `3px solid ${roleInfo.color}` }}>
                  <div style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
                    {/* Turn number */}
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: roleInfo.color, color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '.75rem', fontWeight: 700, flexShrink: 0, marginTop: 2,
                    }}>{index + 1}</div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.5rem', flexWrap: 'wrap' }}>
                        <select
                          value={turn.speakerRole}
                          onChange={e => updateTurn(turn.id, 'speakerRole', e.target.value)}
                          className="select" style={{ width: 'auto', paddingLeft: '.75rem' }}>
                          {ROLES.map(r => <option key={r.value} value={r.value}>{r.icon} {r.label}</option>)}
                        </select>
                        <select
                          value={turn.dialogueStage}
                          onChange={e => updateTurn(turn.id, 'dialogueStage', e.target.value)}
                          className="select" style={{ width: 'auto', paddingLeft: '.75rem' }}>
                          {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        <select
                          value={turn.intent}
                          onChange={e => updateTurn(turn.id, 'intent', e.target.value)}
                          className="select" style={{ width: 'auto', paddingLeft: '.75rem' }}>
                          {INTENTS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                        </select>
                      </div>
                      <textarea
                        className="input"
                        placeholder={`${roleInfo.icon} ماذا يقول ${roleInfo.label}...`}
                        value={turn.utteranceText}
                        onChange={e => updateTurn(turn.id, 'utteranceText', e.target.value)}
                        style={{ minHeight: 60, fontSize: '.95rem' }}
                      />
                    </div>

                    {turns.length > 2 && (
                      <button onClick={() => removeTurn(turn.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', fontSize: '1.1rem', padding: '.25rem', marginTop: 2 }}>
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Add turn + Submit */}
          <div style={{ display: 'flex', gap: '.75rem', marginTop: '1rem' }}>
            <button className="btn btn-ghost" onClick={addTurn} style={{ flex: 1 }}>
              + إضافة جولة
            </button>
            <button className="btn btn-primary" onClick={onSubmit} disabled={submitting} style={{ flex: 2 }}>
              {submitting
                ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> جاري الحفظ...</>
                : `💬 حفظ الحوار (${turns.filter(t => t.utteranceText.trim()).length} جولات)`}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div>
          <div className="card" style={{ position: 'sticky', top: '1.5rem' }}>
            <h3 style={{ fontSize: '.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--primary)' }}>
              👁️ معاينة الحوار
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', maxHeight: 400, overflowY: 'auto' }}>
              {turns.filter(t => t.utteranceText.trim()).length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--ink-faint)', padding: '2rem', fontSize: '.85rem' }}>
                  ابدأ بكتابة الحوار...
                </div>
              ) : turns.filter(t => t.utteranceText.trim()).map((turn) => {
                const role = ROLES.find(r => r.value === turn.speakerRole)!
                const isRight = turn.speakerRole === 'user'
                return (
                  <div key={turn.id} style={{
                    display: 'flex', justifyContent: isRight ? 'flex-end' : 'flex-start',
                  }}>
                    <div style={{
                      maxWidth: '80%',
                      background: isRight ? role.color : 'var(--surface-raised)',
                      color: isRight ? 'white' : 'var(--ink)',
                      padding: '.5rem .85rem',
                      borderRadius: isRight ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                      fontSize: '.88rem', lineHeight: 1.5,
                    }}>
                      <div style={{ fontSize: '.7rem', opacity: .7, marginBottom: '.2rem' }}>
                        {role.icon} {role.label}
                      </div>
                      {turn.utteranceText}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="divider" />
            <div style={{ fontSize: '.78rem', color: 'var(--ink-faint)', textAlign: 'center' }}>
              {turns.filter(t => t.utteranceText.trim()).length} جولة — {domain}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
