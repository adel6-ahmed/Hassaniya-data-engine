'use client'
// app/(dashboard)/dashboard/contribute/faq/page.tsx

import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { faqEntrySchema, type FaqEntryInput } from '@/lib/validations'
import { PublicNotice } from '@/components/ui/PublicNotice'

const DOMAINS = [
  { value: 'GENERAL',         label: 'عام' },
  { value: 'TELECOM',         label: 'اتصالات' },
  { value: 'BANKING',         label: 'بنوك' },
  { value: 'ECOMMERCE',       label: 'تجارة إلكترونية' },
  { value: 'PUBLIC_SERVICES', label: 'خدمات عامة' },
  { value: 'HEALTHCARE',      label: 'صحة' },
]

const INTENTS = [
  { value: 'FAQ_REQUEST',    label: 'سؤال شائع' },
  { value: 'BILLING_ISSUE',  label: 'مشكلة فاتورة' },
  { value: 'NETWORK_ISSUE',  label: 'مشكلة شبكة' },
  { value: 'ACCOUNT_HELP',   label: 'مساعدة حساب' },
  { value: 'BRANCH_LOCATION',label: 'موقع فرع' },
  { value: 'COMPLAINT',      label: 'شكوى' },
]

const EXAMPLES = [
  {
    q: 'منين انگد انخلص الفاتورة',
    a: 'اتگد اتخلصها من التطبيق ول من الفرع ول زاد من الوكيل المعتمد',
    domain: 'TELECOM',
  },
  {
    q: 'بسمحالة انغير كودي',
    a: 'ادخل التطبيق واختار إعدادات الحساب وغير كلمة المرور',
    domain: 'TELECOM',
  },
  {
    q: 'منين هو اقرب فرع مني',
    a: 'اتگد تلگ الفروع كاملها على الموقع الرسمي ول من على التطبيق',
    domain: 'BANKING',
  },
]

export default function ContributeFaqPage() {
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [count, setCount] = useState(0)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(faqEntrySchema),
    defaultValues: {
      domain: 'GENERAL',
      intent: 'FAQ_REQUEST',
      sourceType: 'ORIGINAL',
      isActive: true,
    },
  })

  const onSubmit: SubmitHandler<FaqEntryInput> = async (data) => {
    setSubmitting(true)
    setResult(null)
    try {
      const res = await fetch('/api/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (res.ok) {
        setResult({ type: 'success', message: 'تمت إضافة السؤال بنجاح ✓' })
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

  const wrappedSubmit = handleSubmit((data) => onSubmit(data as unknown as FaqEntryInput))

  return (
    <div className="animate-fade-in">
      <PublicNotice />

      <div className="page-header">
        <div>
          <h1 className="page-title">إضافة أسئلة شائعة</h1>
          <p className="page-subtitle">أنشئ قاعدة معرفية للمساعدين الذكيين وأنظمة دعم العملاء</p>
        </div>
        {count > 0 && (
          <div style={{ background: '#22c55e', color: 'white', padding: '.5rem 1.25rem', borderRadius: '99px', fontSize: '.9rem', fontWeight: 600 }}>
            أضفت {count} سؤال ❓
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        {/* Form */}
        <div className="card-raised">
          {result && (
            <div className={`alert alert-${result.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: '1.5rem' }}>
              {result.type === 'success' ? '✅' : '❌'} {result.message}
            </div>
          )}

          <form onSubmit={wrappedSubmit}>
            {/* Questions */}
            <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '.75rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                🙋 السؤال
              </div>
              <div className="form-group">
                <label className="label">السؤال بالحسانية <span style={{ color: 'var(--danger)' }}>*</span></label>
                <textarea {...register('questionHassaniya')} className="input"
                  placeholder="اكتب السؤال كما يقوله العميل بالحسانية..."
                  style={{ minHeight: 65, fontSize: '1rem' }} />
                {errors.questionHassaniya && <span className="error-msg">{errors.questionHassaniya.message}</span>}
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">السؤال بالعربية الفصحى</label>
                <input {...register('questionMsa')} className="input" placeholder="ترجمة السؤال..." />
              </div>
            </div>

            {/* Answers */}
            <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '1.25rem', borderRight: '3px solid var(--primary-glow)' }}>
              <div style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '.75rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                💬 الجواب
              </div>
              <div className="form-group">
                <label className="label">الجواب بالحسانية <span style={{ color: 'var(--danger)' }}>*</span></label>
                <textarea {...register('answerHassaniya')} className="input"
                  placeholder="اكتب الجواب الكامل بالحسانية..."
                  style={{ minHeight: 80 }} />
                {errors.answerHassaniya && <span className="error-msg">{errors.answerHassaniya.message}</span>}
              </div>
              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="label">الجواب بالعربية</label>
                  <textarea {...register('answerMsa')} className="input" placeholder="ترجمة الجواب..." style={{ minHeight: 65 }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="label">الجواب بالفرنسية</label>
                  <textarea {...register('answerFrench')} className="input" placeholder="Réponse en français..." dir="ltr" style={{ minHeight: 65 }} />
                </div>
              </div>
            </div>

            {/* Domain & Intent */}
            <div className="form-row">
              <div className="form-group">
                <label className="label">المجال</label>
                <select {...register('domain')} className="select">
                  {DOMAINS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">نوع السؤال</label>
                <select {...register('intent')} className="select">
                  {INTENTS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                </select>
              </div>
            </div>

            {/* Active toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '1.5rem', padding: '.75rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
              <input {...register('isActive')} type="checkbox" id="isActive"
                style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} defaultChecked />
              <label htmlFor="isActive" style={{ fontSize: '.88rem', cursor: 'pointer' }}>
                هذا السؤال نشط ومستخدم حالياً
              </label>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting} style={{ width: '100%' }}>
              {submitting
                ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> جاري الحفظ...</>
                : '❓ إضافة السؤال'}
            </button>
          </form>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ borderTop: '3px solid #22c55e' }}>
            <h3 style={{ fontSize: '.9rem', fontWeight: 700, marginBottom: '.75rem' }}>📋 أمثلة</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {EXAMPLES.map((ex, i) => (
                <div key={i} style={{ padding: '.75rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '.3rem' }}>
                    ❓ {ex.q}
                  </div>
                  <div style={{ fontSize: '.78rem', color: 'var(--ink-muted)' }}>
                    💬 {ex.a}
                  </div>
                  <span className="badge badge-pending" style={{ marginTop: '.4rem', fontSize: '.68rem' }}>{ex.domain}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ background: 'var(--primary)', color: 'white' }}>
            <h3 style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '.88rem', marginBottom: '.6rem' }}>
              🤖 للاستخدام في RAG
            </h3>
            <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.7)', lineHeight: 1.6 }}>
              هذه البيانات ستُستخدم مباشرة لتدريب مساعدي دعم العملاء وأنظمة RAG.
              تأكد من دقة الإجابات وشموليتها.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
