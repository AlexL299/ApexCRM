'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, Zap, Users, TrendingUp, Shield } from 'lucide-react'

const SOURCES = ['Website', 'Referral', 'LinkedIn', 'Conference', 'Cold Outreach', 'Partnership', 'Other']

export default function LeadCapturePage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
    source: 'Website',
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [result, setResult] = useState<{
    contact?: { name: string; intentScore: number; intentCategory: string }
    aiSummary?: string
    deal?: { title: string; stage: string } | null
  } | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    try {
      const res = await fetch('/api/leads/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Submission failed')
      }

      setResult(data)
      setStatus('success')
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'success' && result) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={successIconWrap}>
            <CheckCircle2 size={48} color="#22c55e" />
          </div>
          <h1 style={headingStyle}>You're on the list!</h1>
          <p style={subStyle}>
            Thanks for reaching out. Our team will be in touch soon.
          </p>

          {result.aiSummary && (
            <div style={aiPanel}>
              <div style={aiLabel}>
                <Zap size={12} /> AI Analysis
              </div>
              <p style={{ margin: 0, fontSize: 14, color: '#cbd5e1', lineHeight: 1.6 }}>
                {result.aiSummary}
              </p>
            </div>
          )}

          {result.contact && (
            <div style={statsRow}>
              <div style={statBox}>
                <div style={statValue}>{result.contact.intentScore}</div>
                <div style={statLabel}>Intent Score</div>
              </div>
              <div style={statBox}>
                <div style={{ ...statValue, textTransform: 'capitalize' as const }}>
                  {result.contact.intentCategory}
                </div>
                <div style={statLabel}>Priority</div>
              </div>
              {result.deal && (
                <div style={statBox}>
                  <div style={{ ...statValue, textTransform: 'capitalize' as const }}>
                    {result.deal.stage}
                  </div>
                  <div style={statLabel}>Pipeline Stage</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      {/* Left: Value Props */}
      <div style={valuePropPanel}>
        <div style={{ marginBottom: 48 }}>
          <div style={logoBadge}>ApexCRM</div>
          <h2 style={{ fontSize: 32, fontWeight: 800, margin: '16px 0 12px', color: '#f1f5f9', lineHeight: 1.15 }}>
            Supercharge your sales with AI
          </h2>
          <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>
            Join thousands of sales teams using ApexCRM to close more deals with intelligent lead scoring, automated follow-ups, and real-time insights.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 20 }}>
          {[
            { icon: <Zap size={18} />, title: 'AI Lead Scoring', desc: 'Every inbound lead is instantly scored by Gemini AI for intent and priority.' },
            { icon: <TrendingUp size={18} />, title: 'Smart Pipeline', desc: 'Hot leads are automatically moved into your pipeline at the right stage.' },
            { icon: <Users size={18} />, title: 'Team Notifications', desc: 'Your sales team is notified the moment a high-intent lead comes in.' },
            { icon: <Shield size={18} />, title: 'Enterprise Security', desc: 'Your data is protected with industry-grade encryption and compliance.' },
          ].map((item) => (
            <div key={item.title} style={featureRow}>
              <div style={featureIcon}>{item.icon}</div>
              <div>
                <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 14, marginBottom: 3 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Form */}
      <div style={formPanel}>
        <div style={cardStyle}>
          <h1 style={{ ...headingStyle, fontSize: 22, marginBottom: 6 }}>Get in touch</h1>
          <p style={{ ...subStyle, marginBottom: 28 }}>Fill in your details and we&apos;ll reach out within 24 hours.</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
            <div style={fieldRow}>
              <Field label="Full Name *" name="name" value={form.name} onChange={handleChange} placeholder="Jane Smith" required />
              <Field label="Work Email *" name="email" type="email" value={form.email} onChange={handleChange} placeholder="jane@company.com" required />
            </div>

            <div style={fieldRow}>
              <Field label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+1 555 000 0000" />
              <Field label="Company" name="company" value={form.company} onChange={handleChange} placeholder="Acme Corp" />
            </div>

            <div>
              <label style={labelStyle}>How did you hear about us?</label>
              <select
                name="source"
                value={form.source}
                onChange={handleChange}
                style={inputStyle}
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Message</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Tell us about your team size, current CRM challenges, or what you're hoping to achieve..."
                rows={4}
                style={{ ...inputStyle, resize: 'vertical' as const, minHeight: 90 }}
              />
            </div>

            {status === 'error' && (
              <div style={errorBanner}>{errorMsg}</div>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              style={submitBtn}
            >
              {status === 'submitting' ? (
                <>
                  <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                  Submitting...
                </>
              ) : (
                'Submit — Get a Demo'
              )}
            </button>

            <p style={{ textAlign: 'center' as const, fontSize: 11, color: '#475569', margin: 0 }}>
              No spam. Unsubscribe anytime. Your data is safe with us.
            </p>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: #475569; }
        select option { background: #1e293b; }
      `}</style>
    </div>
  )
}

function Field({
  label, name, value, onChange, placeholder, type = 'text', required,
}: {
  label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div style={{ flex: 1 }}>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={inputStyle}
      />
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #0f172a 0%, #0c1428 50%, #0f172a 100%)',
  display: 'flex',
  alignItems: 'stretch',
  fontFamily: "'Inter', -apple-system, sans-serif",
}

const valuePropPanel: React.CSSProperties = {
  flex: 1,
  padding: '64px 48px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  maxWidth: 480,
}

const formPanel: React.CSSProperties = {
  flex: 1,
  background: 'rgba(30, 41, 59, 0.5)',
  borderLeft: '1px solid #1e293b',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '48px 32px',
}

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 480,
  background: '#0f1623',
  borderRadius: 16,
  border: '1px solid #1e293b',
  padding: '36px 32px',
}

const headingStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  color: '#f1f5f9',
  margin: '0 0 8px',
  letterSpacing: '-0.5px',
}

const subStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#64748b',
  margin: 0,
  lineHeight: 1.6,
}

const logoBadge: React.CSSProperties = {
  display: 'inline-block',
  background: 'linear-gradient(135deg, #1e40af, #2563eb)',
  color: '#fff',
  fontWeight: 800,
  fontSize: 14,
  letterSpacing: '0.3px',
  padding: '5px 14px',
  borderRadius: 8,
}

const featureRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 14,
}

const featureIcon: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 8,
  background: 'rgba(37, 99, 235, 0.15)',
  border: '1px solid rgba(37, 99, 235, 0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#60a5fa',
  flexShrink: 0,
}

const fieldRow: React.CSSProperties = {
  display: 'flex',
  gap: 12,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11.5,
  fontWeight: 600,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 8,
  padding: '10px 14px',
  color: '#f1f5f9',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
}

const submitBtn: React.CSSProperties = {
  width: '100%',
  background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
  color: '#fff',
  fontWeight: 700,
  fontSize: 14,
  border: 'none',
  borderRadius: 10,
  padding: '13px 20px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  transition: 'opacity 0.15s',
}

const errorBanner: React.CSSProperties = {
  background: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  borderRadius: 8,
  padding: '10px 14px',
  color: '#f87171',
  fontSize: 13,
}

const successIconWrap: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: 20,
}

const aiPanel: React.CSSProperties = {
  background: 'rgba(37, 99, 235, 0.08)',
  border: '1px solid rgba(37, 99, 235, 0.2)',
  borderRadius: 10,
  padding: '14px 16px',
  marginTop: 20,
}

const aiLabel: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
  color: '#60a5fa',
  marginBottom: 8,
}

const statsRow: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  marginTop: 20,
}

const statBox: React.CSSProperties = {
  flex: 1,
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 10,
  padding: '12px 14px',
  textAlign: 'center',
}

const statValue: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  color: '#f1f5f9',
  marginBottom: 4,
}

const statLabel: React.CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: '#64748b',
  fontWeight: 600,
}
