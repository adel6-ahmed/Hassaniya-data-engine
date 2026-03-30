'use client'
// app/(dashboard)/dashboard/contribute/texts/page.tsx

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { monolingualTextSchema } from '@/lib/validations'
import { z } from 'zod'
import { PublicNotice } from '@/components/ui/PublicNotice'

const DOMAINS = [
  { value: 'GENERAL', label: 'عام' },
  { value: 'TELECOM', label: 'اتصالات' },
  { value: 'ECOMMERCE', label: 'تجارة' },
  { value: 'EDUCATION', label: 'تعليم' },
  { value: 'HEALTHCARE', label: 'صحة' },
]

const TEXT_TYPES = [
  { value: 'story',        label: 'قصة' },
  { value: 'article',      label: 'مقال' },
  { value: 'conversation', label: 'محادثة' },
  { value: 'description',  label: 'وصف' },
  { value: 'news',         label: 'خبر' },
  { value: 'other',        label: 'أخرى' },
]

export default function ContributeTextsPage() {
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null)
  const [charCount, setCharCount] = useState(0)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.input<typeof monolingualTextSchema>>({
    resolver: zodResolver(monolingualTextSchema),
    defaultValues: {
      domain: 'GENERAL',
      region: 'OTHER',
      emotionalTone: 'NEUTRAL',
      writingStyle: 'COLLOQUIAL',
      sourceType: 'ORIGINAL',
      containsPersonalInfo: false,
      confidenceLevel: 3,
    },
  })

  const onSubmit = async (data: z.input<typeof monolingualTextSchema>) => {
    setSubmitting(true)
    setResult(null)
    try {
      const res = await fetch('/api/texts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (res.ok) {
        setResult({ type: json.warnings?.length ? 'warning' : 'success', message: 'تمت إضافة النص بنجاح ✓' })
        reset()
        setCharCount(0)
      } else {
        setResult({ type: 'error', message: json.error || 'حدث خطأ' })
      }
    } catch {
      setResult({ type: 'error', message: 'خطأ في الاتصال' })
    } finally {
      setSubmitting(false)
    }
  }

  const charColor = charCount < 300 ? 'var(--danger)' : charCount > 5500 ? 'var(--warning)' : 'var(--success)'

  return (
    <div className="animate-fade-in">
      <PublicNotice />

      <div className="page-header">
        <div>
          <h1 className="page-title">إضافة نص طويل</h1>
          <p className="page-subtitle">أضف نصوصاً حسانية مطولة لبناء مستودع اللغة</p>
        </div>
      </div>

      {result && (
        <div className={`alert alert-${result.type === 'success' ? 'success' : result.type === 'warning' ? 'warning' : 'error'}`}
          style={{ marginBottom: '1.5rem' }}>
          {result.type === 'success' ? '✅' : '⚠️'} {result.message}
        </div>
      )}

      <div className="card-raised">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-row">
            <div className="form-group">
              <label className="label">عنوان النص (اختياري)</label>
              <input {...register('title')} className="input" placeholder="عنوان النص..." />
            </div>
            <div className="form-group">
              <label className="label">نوع النص</label>
              <select {...register('textType')} className="select">
                {TEXT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {/* Main text area */}
          <div className="form-group">
            <label className="label">
              النص بالحسانية <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <textarea
              {...register('hassaniyaText')}
              className="input"
              placeholder="اكتب النص الحساني هنا... (300 حرف على الأقل)"
              style={{ minHeight: 280, fontSize: '.95rem', lineHeight: 1.8 }}
              onChange={e => setCharCount(e.target.value.length)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.3rem' }}>
              {errors.hassaniyaText
                ? <span className="error-msg">{errors.hassaniyaText.message}</span>
                : <span className="hint-msg">الحد الأدنى 300 حرف، الموصى به 300-1500</span>}
              <span style={{ fontSize: '.75rem', color: charColor, fontWeight: 600 }}>
                {charCount.toLocaleString('ar-MA')} / 6000
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="progress" style={{ marginBottom: '1.25rem' }}>
            <div className="progress-bar" style={{
              width: `${Math.min(100, (charCount / 300) * 100)}%`,
              background: charCount >= 300 ? 'var(--primary-glow)' : 'var(--warning)',
            }} />
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label className="label">المجال</label>
              <select {...register('domain')} className="select">
                {DOMAINS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">أسلوب الكتابة</label>
              <select {...register('writingStyle')} className="select">
                <option value="COLLOQUIAL">عامي</option>
                <option value="FORMAL">رسمي</option>
                <option value="NARRATIVE">سردي</option>
                <option value="POETIC">شعري</option>
                <option value="INSTRUCTIONAL">تعليمي</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">مصدر النص</label>
              <select {...register('sourceType')} className="select">
                <option value="ORIGINAL">نص أصلي</option>
                <option value="TRANSCRIBED">منقول</option>
                <option value="COLLECTED">مجمع</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '1.5rem', padding: '.75rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
            <input {...register('containsPersonalInfo')} type="checkbox" id="privacy"
              style={{ width: 16, height: 16, accentColor: 'var(--danger)' }} />
            <label htmlFor="privacy" style={{ fontSize: '.85rem', cursor: 'pointer', color: 'var(--ink-muted)' }}>
              ⚠️ النص يحتوي على معلومات شخصية وسيحتاج مراجعة
            </label>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting} style={{ width: '100%' }}>
            {submitting
              ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> جاري الحفظ...</>
              : '📖 إضافة النص'}
          </button>
        </form>
      </div>
    </div>
  )
}
