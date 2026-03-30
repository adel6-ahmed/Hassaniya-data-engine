'use client'

import { useState } from 'react'

const EXPORT_TYPES = [
  { value: 'parallel',    label: 'بيانات متوازية',      icon: '🔄', desc: 'الجمل + ترجماتها' },
  { value: 'instruction', label: 'Instruction Tuning',  icon: '🎓', desc: 'تنسيق Alpaca' },
  { value: 'dialogues',   label: 'حوارات ChatML',        icon: '💬', desc: 'تنسيق messages' },
  { value: 'faq',         label: 'قاعدة المعرفة RAG',   icon: '❓', desc: 'أسئلة وأجوبة' },
  { value: 'proverbs',    label: 'الأمثال والحكم',       icon: '🌿', desc: 'الموروث الثقافي' },
  { value: 'monolingual', label: 'نصوص أحادية اللغة',   icon: '📄', desc: 'نصوص طويلة' },
]

const DOMAINS = [
  { value: '',              label: 'كل المجالات' },
  { value: 'GENERAL',      label: 'عام' },
  { value: 'TELECOM',      label: 'اتصالات' },
  { value: 'BANKING',      label: 'بنوك' },
  { value: 'ECOMMERCE',    label: 'تجارة إلكترونية' },
  { value: 'HEALTHCARE',   label: 'صحة' },
]

const FORMAT_EXAMPLES: Record<string, string> = {
  instruction: `{\n  "instruction": "ترجم إلى العربية",\n  "input": "شماسي",\n  "output": "كيف حالك"\n}`,
  dialogues:   `{\n  "messages": [\n    {"role":"user","content":"شماسي"},\n    {"role":"assistant","content":"لاباس"}\n  ]\n}`,
  parallel:    `{\n  "hassaniya": "شماسي",\n  "msa": "كيف حالك",\n  "french": "Comment vas-tu"\n}`,
  faq:         `{\n  "question": "منين نخلص...",\n  "answer": "تقدر من التطبيق..."\n}`,
  proverbs:    `{\n  "text": "الگبل مگبل...",\n  "meaning": "القريب دائماً..."\n}`,
  monolingual: `{\n  "text": "نص حساني طويل...",\n  "domain": "GENERAL"\n}`,
}

export default function ExportPage() {
  const [exportType, setExportType] = useState('instruction')
  const [format, setFormat]         = useState('jsonl')
  const [domain, setDomain]         = useState('')
  const [splitOutput, setSplitOutput] = useState(true)
  const [trainRatio, setTrainRatio]   = useState(0.8)
  const [valRatio, setValRatio]       = useState(0.1)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  const testRatio = Math.max(0, 1 - trainRatio - valRatio)
  const selectedType = EXPORT_TYPES.find(t => t.value === exportType)

  const handleExport = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exportType, format, domain: domain || undefined, splitOutput, trainRatio, valRatio }),
      })
      if (!res.ok) {
        const j = await res.json()
        setError(j.error || 'حدث خطأ')
        return
      }
      const blob = await res.blob()
      if (blob.size === 0) {
        setError('الملف فارغ — لا توجد بيانات')
        return
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hassaniya_${exportType}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">تصدير مجموعات البيانات</h1>
          <p className="page-subtitle">صدّر البيانات المعتمدة لتدريب النماذج</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Export type */}
          <div className="card">
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>نوع البيانات</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.625rem' }}>
              {EXPORT_TYPES.map(t => (
                <button key={t.value} onClick={() => setExportType(t.value)} style={{
                  padding: '.875rem', borderRadius: 'var(--radius)',
                  border: `2px solid ${exportType === t.value ? 'var(--primary)' : 'var(--border-light)'}`,
                  background: exportType === t.value ? 'rgba(26,58,42,.06)' : 'white',
                  cursor: 'pointer', textAlign: 'right', transition: 'all .15s',
                }}>
                  <div style={{ fontSize: '1.25rem', marginBottom: '.25rem' }}>{t.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: '.9rem', color: exportType === t.value ? 'var(--primary)' : 'var(--ink)' }}>{t.label}</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--ink-faint)', marginTop: '2px' }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="card">
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>خيارات التصدير</h2>
            <div className="form-row" style={{ marginBottom: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">صيغة الملف</label>
                <select value={format} onChange={e => setFormat(e.target.value)} className="select">
                  <option value="jsonl">JSONL — للتدريب المباشر</option>
                  <option value="json">JSON — منظم</option>
                  <option value="csv">CSV — للمعالجة</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">المجال</label>
                <select value={domain} onChange={e => setDomain(e.target.value)} className="select">
                  {DOMAINS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
            </div>

            {/* Split */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.625rem', marginBottom: '1rem' }}>
              <input type="checkbox" id="split" checked={splitOutput}
                onChange={e => setSplitOutput(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
              <label htmlFor="split" style={{ fontSize: '.9rem', fontWeight: 600, cursor: 'pointer' }}>
                تقسيم train / validation / test
              </label>
            </div>

            {splitOutput && (
              <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                <div style={{ marginBottom: '.75rem' }}>
                  <label className="label" style={{ fontSize: '.8rem' }}>Train: <strong>{Math.round(trainRatio * 100)}%</strong></label>
                  <input type="range" min={0.5} max={0.9} step={0.05} value={trainRatio}
                    onChange={e => setTrainRatio(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--primary-glow)' }} />
                </div>
                <div style={{ marginBottom: '.75rem' }}>
                  <label className="label" style={{ fontSize: '.8rem' }}>Validation: <strong>{Math.round(valRatio * 100)}%</strong></label>
                  <input type="range" min={0.05} max={0.2} step={0.05} value={valRatio}
                    onChange={e => setValRatio(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#6c3483' }} />
                </div>
                <div style={{ display: 'flex', gap: 2, borderRadius: 4, overflow: 'hidden', height: 8 }}>
                  <div style={{ flex: trainRatio, background: 'var(--primary-glow)' }} />
                  <div style={{ flex: valRatio, background: '#6c3483' }} />
                  <div style={{ flex: testRatio, background: 'var(--accent)' }} />
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '.72rem', marginTop: '.375rem', color: 'var(--ink-faint)' }}>
                  <span>🟢 Train {Math.round(trainRatio * 100)}%</span>
                  <span>🟣 Val {Math.round(valRatio * 100)}%</span>
                  <span>🟡 Test {Math.round(testRatio * 100)}%</span>
                </div>
              </div>
            )}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button onClick={handleExport} disabled={loading} className="btn btn-primary btn-lg"
            style={{ justifyContent: 'center' }}>
            {loading
              ? <><span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> جاري التصدير...</>
              : `📦 تصدير ${selectedType?.label}`}
          </button>
        </div>

        {/* Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ background: 'var(--primary)', border: 'none' }}>
            <h3 style={{ color: 'var(--accent)', fontSize: '.9rem', fontWeight: 700, marginBottom: '.875rem' }}>
              {selectedType?.icon} مثال على التنسيق
            </h3>
            <pre style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.8)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {FORMAT_EXAMPLES[exportType]}
            </pre>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '.9rem', fontWeight: 700, marginBottom: '.75rem' }}>متوافق مع</h3>
            {['LLaMA / Qwen / Mistral 🦙', 'Hugging Face Datasets 🤗', 'QLoRA fine-tuning ⚡', 'RAG — LangChain / LlamaIndex 🔍'].map(m => (
              <div key={m} style={{ padding: '.5rem 0', borderBottom: '1px solid var(--border-light)', fontSize: '.85rem' }}>
                {m}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}