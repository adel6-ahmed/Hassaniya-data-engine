'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { parallelSentenceSchema } from '@/lib/validations'
import { z } from 'zod'
import { PublicNotice } from '@/components/ui/PublicNotice'

const DOMAINS = [
  { value: 'GENERAL', label: 'عام' },
  { value: 'TELECOM', label: 'اتصالات' },
  { value: 'BANKING', label: 'بنوك' },
  { value: 'ECOMMERCE', label: 'تجارة إلكترونية' },
  { value: 'LOGISTICS', label: 'لوجستيك' },
  { value: 'PUBLIC_SERVICES', label: 'خدمات عامة' },
  { value: 'EDUCATION', label: 'تعليم' },
  { value: 'HEALTHCARE', label: 'صحة' },
]

const INTENTS = [
  { value: 'GREETING', label: 'تحية' },
  { value: 'BILLING_ISSUE', label: 'مشكلة فاتورة' },
  { value: 'NETWORK_ISSUE', label: 'مشكلة شبكة' },
  { value: 'ACCOUNT_HELP', label: 'مساعدة حساب' },
  { value: 'COMPLAINT', label: 'شكوى' },
  { value: 'FAQ_REQUEST', label: 'سؤال شائع' },
  { value: 'OTHER', label: 'أخرى' },
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

const TONES = [
  { value: 'NEUTRAL', label: 'محايد' },
  { value: 'POSITIVE', label: 'إيجابي' },
  { value: 'NEGATIVE', label: 'سلبي' },
  { value: 'ANGRY', label: 'غاضب' },
  { value: 'HAPPY', label: 'سعيد' },
  { value: 'SAD', label: 'حزين' },
]

const EXAMPLES = [
  { hassaniya: 'أسلام عليكم، أشحالك', msa: 'مرحباً، كيف حالك', domain: 'GENERAL' },
  { hassaniya: 'گتلك، فاتورة تلفون ابكم', msa: 'عفواً، كم هو سعر فاتورة الهاتف', domain: 'TELECOM' },
  { hassaniya: 'منين انگد نسحب فظتي', msa: 'من أين يمكنني سحب أموالي', domain: 'BANKING' },
]
interface RecentEntry {
  id: string
  hassaniyaSentence: string
  msaTranslation?: string
  reviewStatus: string
  domain: string
  createdAt: string
}

export default function ContributeSentencesPage() {
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null)
  const [recent, setRecent] = useState<RecentEntry[]>([])
  const [wordCount, setWordCount] = useState(0)

  const {
    register, handleSubmit, reset, watch,
    formState: { errors },
  } = useForm<z.input<typeof parallelSentenceSchema>>({
    resolver: zodResolver(parallelSentenceSchema),
    defaultValues: {
      domain: 'GENERAL',
      intent: 'OTHER',
      region: 'OTHER',
      emotionalTone: 'NEUTRAL',
      styleType: 'COLLOQUIAL',
      confidenceLevel: 3,
      verifiedByNativeSpeaker: false,
    },
  })

  const hassaniyaValue = watch('hassaniyaSentence')
  const confidenceValue = watch('confidenceLevel')

  useEffect(() => {
    if (hassaniyaValue) {
      setWordCount(hassaniyaValue.trim().split(/\s+/).filter(Boolean).length)
    } else {
      setWordCount(0)
    }
  }, [hassaniyaValue])

  useEffect(() => {
    fetch('/api/sentences?pageSize=8')
      .then(r => r.json())
      .then(d => setRecent(d.data || []))
  }, [])

  const onSubmit = async (data: z.input<typeof parallelSentenceSchema>) => {
    setSubmitting(true)
    setResult(null)
    try {
      const res = await fetch('/api/sentences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (res.ok) {
        setResult({
          type: json.warnings?.length ? 'warning' : 'success',
          message: json.warnings?.length
            ? `تمت الإضافة مع تحذيرات: ${json.warnings.join(', ')}`
            : 'تمت إضافة الجملة بنجاح ✓',
        })
        reset()
        fetch('/api/sentences?pageSize=8')
          .then(r => r.json())
          .then(d => setRecent(d.data || []))
      } else {
        setResult({ type: 'error', message: json.error || 'حدث خطأ' })
      }
    } catch {
      setResult({ type: 'error', message: 'خطأ في الاتصال بالخادم' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <PublicNotice />

      <div className="page-header">
        <div>
          <h1 className="page-title">إضافة جمل متوازية</h1>
          <p className="page-subtitle">أضف جمل حسانية مع ترجماتها للعربية الفصحى والفرنسية</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        {/* Form */}
        <div className="card-raised">
          {result && (
            <div className={`alert alert-${result.type === 'success' ? 'success' : result.type === 'warning' ? 'warning' : 'error'}`}
              style={{ marginBottom: '1.25rem' }}>
              <span>{result.type === 'success' ? '✓' : result.type === 'warning' ? '⚠️' : '✗'}</span>
              {result.message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Hassaniya sentence */}
            <div className="form-group">
              <label className="label">
                الجملة بالحسانية <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <textarea
                {...register('hassaniyaSentence')}
                className="input"
                placeholder="اكتب الجملة هنا..."
                style={{ minHeight: 80, fontSize: '1.1rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {errors.hassaniyaSentence
                  ? <span className="error-msg">{errors.hassaniyaSentence.message}</span>
                  : <span />}
                <span style={{ fontSize: '.75rem', color: wordCount < 3 ? 'var(--danger)' : wordCount > 40 ? 'var(--warning)' : 'var(--ink-faint)' }}>
                  {wordCount} / 40 كلمة
                </span>
              </div>
            </div>

            {/* Translations */}
            <div className="form-row">
              <div className="form-group">
                <label className="label">الترجمة بالعربية الفصحى</label>
                <input {...register('msaTranslation')} className="input" placeholder="ترجمة عربية..." />
              </div>
              <div className="form-group">
                <label className="label">الترجمة بالفرنسية</label>
                <input {...register('frenchTranslation')} className="input" placeholder="Traduction..." dir="ltr" />
              </div>
            </div>

            {/* Domain, Intent, Region */}
            <div className="form-row-3">
              <div className="form-group">
                <label className="label">المجال</label>
                <select {...register('domain')} className="select">
                  {DOMAINS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">النية</label>
                <select {...register('intent')} className="select">
                  {INTENTS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">المنطقة</label>
                <select {...register('region')} className="select">
                  {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>

            {/* Tone */}
            <div className="form-group">
              <label className="label">النبرة العاطفية</label>
              <select {...register('emotionalTone')} className="select">
                {TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {/* Confidence */}
            <div className="form-group">
              <label className="label">
                مستوى الثقة: {'★'.repeat(confidenceValue || 3)}{'☆'.repeat(5 - (confidenceValue || 3))}
              </label>
              <input
                {...register('confidenceLevel', { valueAsNumber: true })}
                type="range" min={1} max={5} step={1}
                style={{ width: '100%', accentColor: 'var(--primary-glow)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', color: 'var(--ink-faint)' }}>
                <span>غير متأكد</span><span>متأكد جداً</span>
              </div>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label className="label">ملاحظات (اختياري)</label>
              <input {...register('contributorNotes')} className="input" placeholder="أي ملاحظات إضافية..." />
            </div>

            {/* Verified */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1.5rem', padding: '.75rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
              <input {...register('verifiedByNativeSpeaker')} type="checkbox" id="verified"
                style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
              <label htmlFor="verified" style={{ fontSize: '.88rem', cursor: 'pointer' }}>
                أنا متحدث أصلي بالحسانية وأؤكد صحة هذه الجملة
              </label>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting} style={{ width: '100%' }}>
              {submitting
                ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> جاري الحفظ...</>
                : '+ إضافة الجملة'}
            </button>
          </form>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ background: 'var(--primary)', color: 'white' }}>
            <h3 style={{ color: 'var(--accent)', fontSize: '.9rem', fontWeight: 700, marginBottom: '.75rem' }}>💡 نصائح</h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {[
                'استخدم جمل تعبر عن اللهجة الحسانية الأصيلة',
                'تأكد من صحة الترجمة للعربية الفصحى',
                '3 كلمات كحد أدنى، 40 كلمة كحد أقصى',
                'تجنب الجمل المكررة أو المنسوخة',
                'حاول تنويع المجالات والمناطق',
              ].map((tip, i) => (
                <li key={i} style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.7)', display: 'flex', gap: '.5rem' }}>
                  <span style={{ color: 'var(--accent)', flexShrink: 0 }}>•</span> {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="card" style={{ borderTop: '3px solid var(--primary)' }}>
            <h3 style={{ fontSize: '.9rem', fontWeight: 700, marginBottom: '.75rem', color: 'var(--primary)' }}>
              📝 أمثلة
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {EXAMPLES.map((ex, i) => (
                <div key={i} style={{ padding: '.75rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', borderRight: '2px solid var(--primary)' }}>
                  <div style={{ fontFamily: 'var(--font-amiri)', fontSize: '1rem', fontWeight: 600, marginBottom: '.3rem' }}>
                    {ex.hassaniya}
                  </div>
                  <div style={{ fontSize: '.8rem', color: 'var(--ink-muted)' }}>{ex.msa}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '.9rem', fontWeight: 700, marginBottom: '.875rem' }}>آخر الإضافات</h3>
            {recent.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.625rem' }}>
                {recent.map(r => (
                  <div key={r.id} style={{ padding: '.625rem .75rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', borderRight: '2px solid var(--primary-glow)' }}>
                    <div style={{ fontSize: '.9rem', fontWeight: 600 }}>{r.hassaniyaSentence}</div>
                    {r.msaTranslation && (
                      <div style={{ fontSize: '.78rem', color: 'var(--ink-muted)', marginTop: '2px' }}>{r.msaTranslation}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--ink-faint)', padding: '1.5rem', fontSize: '.85rem' }}>
                لا توجد جمل بعد
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}