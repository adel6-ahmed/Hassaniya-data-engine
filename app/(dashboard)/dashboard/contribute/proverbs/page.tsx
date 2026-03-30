'use client'
// app/(dashboard)/dashboard/contribute/proverbs/page.tsx

import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { proverbSchema, type ProverbInput } from '@/lib/validations'
import { PublicNotice } from '@/components/ui/PublicNotice'

const CATEGORIES = [
  { value: 'PROVERB',    label: 'مثل' },
  { value: 'IDIOM',      label: 'تعبير اصطلاحي' },
  { value: 'EXPRESSION', label: 'عبارة' },
  { value: 'SAYING',     label: 'قول مأثور' },
]

const REGIONS = [
  { value: 'NOUAKCHOTT', label: 'نواكشوط' },
  { value: 'NOUADHIBOU', label: 'نواذيبو' },
  { value: 'ROSSO', label: 'روصو' },
  { value: 'KIFFA', label: 'كيفة' },
  { value: 'KAEDI', label: 'كايدي' },
  { value: 'ZOUERATE', label: 'زويرات' },
  { value: 'ATAR', label: 'أتار' },
  { value: 'TIDJIKJA', label: 'تجكجة' },
  { value: 'NEMA', label: 'نيما' },
  { value: 'AIOUN', label: 'أيون' },
  { value: 'OTHER', label: 'أخرى' },
]

const EXAMPLES = [
  { proverb: 'أيد وحدة ماتصفگ', meaning: 'يضرب هذا المثل في إبراز قيمة الوحدة والتعاون ولزوم الجماعة والعمل بداخلها ' },
  { proverb: 'اللي اصبر يلحگو الظل', meaning: 'في المثل حث على خلق الصبر والتحلي به وانتظار الفرج والذي سيكون جزاء الصابرين' },
  { proverb: 'اللي وصاك على أمك حگرك', meaning: 'ويضرب هذا المثل عند الحديث عن بر الوالدين ووجوب الرفق والإحسان إليهما دون انتظار وصية أحد لأن ذلك من الواجبات المؤكدة في الدين الحنيف وأعراف المجتمعز' },
]

export default function ContributeProverbsPage() {
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null)
  const [count, setCount] = useState(0)

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: zodResolver(proverbSchema),
    defaultValues: {
      category: 'PROVERB',
      region: 'OTHER',
      confidenceLevel: 3,
      verifiedByNativeSpeaker: false,
    },
  })

  const proverbValue = watch('proverbText')
  const wordCount = proverbValue?.trim().split(/\s+/).filter(Boolean).length || 0

  const onSubmit: SubmitHandler<ProverbInput> = async (data) => {
    setSubmitting(true)
    setResult(null)
    try {
      const res = await fetch('/api/proverbs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (res.ok) {
        setResult({ type: 'success', message: 'تمت إضافة المثل بنجاح ✓' })
        setCount(c => c + 1)
        reset()
      } else {
        setResult({ type: 'error', message: json.error || 'حدث خطأ' })
      }
    } catch {
      setResult({ type: 'error', message: 'خطأ في الاتصال' })
    } finally {
      setSubmitting(false)
    }
  }

  const wrappedSubmit = handleSubmit((data) => onSubmit(data as unknown as ProverbInput))

  return (
    <div className="animate-fade-in">
      <PublicNotice />

      <div className="page-header">
        <div>
          <h1 className="page-title">إضافة أمثال وتعابير</h1>
          <p className="page-subtitle">ساهم في توثيق الأمثال والتعابير الحسانية الأصيلة</p>
        </div>
        {count > 0 && (
          <div style={{ background: 'var(--primary)', color: 'white', padding: '.5rem 1.25rem', borderRadius: '99px', fontSize: '.9rem', fontWeight: 600 }}>
            أضفت {count} {count === 1 ? 'مثل' : 'أمثال'} اليوم 🌿
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        {/* Form */}
        <div className="card-raised">
          {result && (
            <div className={`alert alert-${result.type === 'success' ? 'success' : result.type === 'warning' ? 'warning' : 'error'}`}
              style={{ marginBottom: '1.5rem' }}>
              {result.type === 'success' ? '✅' : '⚠️'} {result.message}
            </div>
          )}

          <form onSubmit={wrappedSubmit}>
            {/* Proverb text */}
            <div className="form-group">
              <label className="label">
                نص المثل بالحسانية <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <textarea
                {...register('proverbText')}
                className="input"
                placeholder="اكتب المثل هنا..."
                style={{ minHeight: 70, fontSize: '1.15rem', fontFamily: 'var(--font-amiri)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {errors.proverbText
                  ? <span className="error-msg">{errors.proverbText.message}</span>
                  : <span />}
                <span style={{ fontSize: '.75rem', color: wordCount < 2 ? 'var(--danger)' : 'var(--ink-faint)' }}>
                  {wordCount} / 30 كلمة
                </span>
              </div>
            </div>

            {/* Meaning */}
            <div className="form-group">
              <label className="label">
                شرح المعنى <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <textarea
                {...register('meaningExplanation')}
                className="input"
                placeholder="اشرح معنى المثل..."
                style={{ minHeight: 80 }}
              />
              {errors.meaningExplanation && <span className="error-msg">{errors.meaningExplanation.message}</span>}
            </div>

            {/* Translations */}
            <div className="form-row">
              <div className="form-group">
                <label className="label">الترجمة الحرفية</label>
                <input {...register('literalTranslation')} className="input" placeholder="الترجمة الحرفية..." />
              </div>
              <div className="form-group">
                <label className="label">الترجمة الفرنسية</label>
                <input {...register('frenchTranslation')} className="input" placeholder="Traduction..." dir="ltr" />
              </div>
            </div>

            {/* Usage context */}
            <div className="form-group">
              <label className="label">سياق الاستخدام</label>
              <input {...register('usageContext')} className="input" placeholder="متى يُستخدم هذا المثل؟" />
            </div>

            {/* Category, Region, Confidence */}
            <div className="form-row-3">
              <div className="form-group">
                <label className="label">النوع</label>
                <select {...register('category')} className="select">
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">المنطقة</label>
                <select {...register('region')} className="select">
                  {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">مستوى الثقة</label>
                <select {...register('confidenceLevel', { valueAsNumber: true })} className="select">
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} {'★'.repeat(n)}</option>)}
                </select>
              </div>
            </div>

            {/* Verified */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '1.5rem', padding: '.75rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
              <input {...register('verifiedByNativeSpeaker')} type="checkbox" id="verified"
                style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
              <label htmlFor="verified" style={{ fontSize: '.88rem', cursor: 'pointer' }}>
                أنا متحدث أصلي بالحسانية وأؤكد صحة هذا المثل
              </label>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}
              style={{ width: '100%' }}>
              {submitting ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> جاري الحفظ...</> : '🌿 إضافة المثل'}
            </button>
          </form>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ borderTop: '3px solid var(--accent)' }}>
            <h3 style={{ fontSize: '.9rem', fontWeight: 700, marginBottom: '.75rem', color: 'var(--primary)' }}>
              📚 أمثلة
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {EXAMPLES.map((ex, i) => (
                <div key={i} style={{ padding: '.75rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', borderRight: '2px solid var(--accent)' }}>
                  <div style={{ fontFamily: 'var(--font-amiri)', fontSize: '1rem', fontWeight: 700, marginBottom: '.3rem' }}>
                    {ex.proverb}
                  </div>
                  <div style={{ fontSize: '.8rem', color: 'var(--ink-muted)' }}>{ex.meaning}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ background: 'var(--primary)', color: 'white' }}>
            <h3 style={{ fontSize: '.88rem', fontWeight: 700, marginBottom: '.6rem', color: 'var(--accent)' }}>💡 نصائح</h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
              {['اكتب المثل كما ينطق في اللهجة الحسانية', 'أضف شرحاً واضحاً للمعنى', 'حدد سياق استخدام المثل', 'تأكد من أن المثل حسانية وليس فصحى'].map((t, i) => (
                <li key={i} style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.7)', display: 'flex', gap: '.4rem' }}>
                  <span style={{ color: 'var(--accent)', flexShrink: 0 }}>•</span> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
