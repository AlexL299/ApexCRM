'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  DollarSign,
  Briefcase,
  User,
  Building,
  Calendar,
  Layers,
  Percent,
  ArrowLeft,
  Loader2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface ContactOption {
  id: string
  firstName: string
  lastName: string
  email: string
  company: {
    id: string
    name: string
  }
}

const STAGES = [
  { value: 'discovery', label: 'Discovery', prob: 20 },
  { value: 'qualification', label: 'Qualification', prob: 40 },
  { value: 'proposal', label: 'Proposal Sent', prob: 60 },
  { value: 'negotiation', label: 'Negotiation', prob: 80 },
  { value: 'closed-won', label: 'Closed Won', prob: 100 },
  { value: 'closed-lost', label: 'Closed Lost', prob: 0 },
]

export function NewDealForm() {
  const router = useRouter()
  const { addToast } = useToast()

  const [title, setTitle] = useState('')
  const [value, setValue] = useState('')
  const [stage, setStage] = useState('discovery')
  const [probability, setProbability] = useState<number>(20)
  const [expectedCloseDate, setExpectedCloseDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  })

  const [contactMode, setContactMode] = useState<'existing' | 'new'>('existing')
  const [contacts, setContacts] = useState<ContactOption[]>([])
  const [selectedContactId, setSelectedContactId] = useState('')
  const [loadingContacts, setLoadingContacts] = useState(true)

  // New contact fields
  const [newContactName, setNewContactName] = useState('')
  const [newContactEmail, setNewContactEmail] = useState('')
  const [newCompanyName, setNewCompanyName] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/contacts')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          setContacts(data)
          if (data.length > 0) {
            setSelectedContactId(data[0].id)
          } else {
            setContactMode('new')
          }
        }
      })
      .catch(() => setContactMode('new'))
      .finally(() => setLoadingContacts(false))
  }, [])

  const handleStageChange = (newStage: string) => {
    setStage(newStage)
    const match = STAGES.find((s) => s.value === newStage)
    if (match) setProbability(match.prob)
  }

  const numValue = parseFloat(value) || 0
  const weightedValue = Math.round(numValue * (probability / 100))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !value) {
      setError('Please provide a deal title and value.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const payload: any = {
        title: title.trim(),
        value: numValue,
        stage,
        probability,
        expectedCloseDate,
      }

      if (contactMode === 'existing' && selectedContactId) {
        payload.contactId = selectedContactId
      } else {
        payload.contactName = newContactName || 'Decision Maker'
        payload.contactEmail = newContactEmail
        payload.companyName = newCompanyName || 'New Enterprise Account'
      }

      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create deal')
      }

      addToast({
        title: 'Deal Created Successfully',
        description: `"${title}" ($${numValue.toLocaleString()}) was added to pipeline.`,
        type: 'success',
      })

      router.push('/pipeline')
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Error saving deal')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link
          href="/pipeline"
          className="btn btn-ghost btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={16} />
          Back to Pipeline
        </Link>
      </div>

      <div className="page-header" style={{ marginBottom: 28 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Briefcase className="text-indigo-400" size={26} />
            Create New Deal
          </h1>
          <p className="page-subtitle">
            Track revenue potential, pipeline velocity, and deal probabilities.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* Form Card */}
        <div className="card" style={{ padding: 28 }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                marginBottom: 20,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 8,
                color: '#f87171',
                fontSize: 13,
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Title */}
            <div>
              <label className="form-label" style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                Deal Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Acme Enterprise Cloud Platform License"
                className="input-field"
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 8,
                  padding: '9px 12px',
                  color: 'white',
                  fontSize: 14,
                }}
              />
            </div>

            {/* Value & Stage */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label" style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Deal Value ($) *
                </label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={16} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="75,000"
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 8,
                      padding: '9px 12px 9px 32px',
                      color: 'white',
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Initial Pipeline Stage
                </label>
                <div style={{ position: 'relative' }}>
                  <Layers size={15} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--text-muted)' }} />
                  <select
                    value={stage}
                    onChange={(e) => handleStageChange(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 8,
                      padding: '9px 12px 9px 32px',
                      color: 'white',
                      fontSize: 14,
                    }}
                  >
                    {STAGES.map((s) => (
                      <option key={s.value} value={s.value} style={{ background: '#111827', color: 'white' }}>
                        {s.label} ({s.prob}%)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Probability & Close Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label className="form-label" style={{ fontSize: 13, fontWeight: 500 }}>
                    Win Probability
                  </label>
                  <span style={{ fontSize: 12, color: 'var(--accent-400)', fontWeight: 600 }}>{probability}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={probability}
                  onChange={(e) => setProbability(parseInt(e.target.value, 10))}
                  style={{ width: '100%', accentColor: 'var(--accent-500)', height: 6 }}
                />
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Target Close Date
                </label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={15} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
                  <input
                    type="date"
                    value={expectedCloseDate}
                    onChange={(e) => setExpectedCloseDate(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 8,
                      padding: '9px 12px 9px 32px',
                      color: 'white',
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Primary Contact Association */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Primary Contact & Account
                </label>
                <div style={{ display: 'flex', gap: 4, background: 'var(--bg-overlay)', padding: 2, borderRadius: 6 }}>
                  <button
                    type="button"
                    onClick={() => setContactMode('existing')}
                    disabled={contacts.length === 0}
                    style={{
                      padding: '3px 8px',
                      fontSize: 11.5,
                      borderRadius: 4,
                      border: 'none',
                      background: contactMode === 'existing' ? 'var(--accent-500)' : 'transparent',
                      color: contactMode === 'existing' ? 'white' : 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    Existing Contact
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactMode('new')}
                    style={{
                      padding: '3px 8px',
                      fontSize: 11.5,
                      borderRadius: 4,
                      border: 'none',
                      background: contactMode === 'new' ? 'var(--accent-500)' : 'transparent',
                      color: contactMode === 'new' ? 'white' : 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    + New Lead
                  </button>
                </div>
              </div>

              {contactMode === 'existing' ? (
                <div>
                  {loadingContacts ? (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading contacts...</div>
                  ) : (
                    <select
                      value={selectedContactId}
                      onChange={(e) => setSelectedContactId(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 8,
                        padding: '9px 12px',
                        color: 'white',
                        fontSize: 14,
                      }}
                    >
                      {contacts.map((c) => (
                        <option key={c.id} value={c.id} style={{ background: '#111827', color: 'white' }}>
                          {c.firstName} {c.lastName} — {c.company?.name || 'Independent'} ({c.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <input
                        type="text"
                        placeholder="Contact Name (e.g. John Doe)"
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        style={{
                          width: '100%',
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-default)',
                          borderRadius: 8,
                          padding: '8px 12px',
                          color: 'white',
                          fontSize: 13,
                        }}
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="Contact Email"
                        value={newContactEmail}
                        onChange={(e) => setNewContactEmail(e.target.value)}
                        style={{
                          width: '100%',
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-default)',
                          borderRadius: 8,
                          padding: '8px 12px',
                          color: 'white',
                          fontSize: 13,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Company Name (e.g. Stripe, OpenAI)"
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 8,
                        padding: '8px 12px',
                        color: 'white',
                        fontSize: 13,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <div style={{ marginTop: 8 }}>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '11px 16px', display: 'flex', justifyContent: 'center', gap: 8, fontSize: 14 }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating Deal...
                  </>
                ) : (
                  <>
                    <Briefcase size={16} />
                    Create Deal & Add to Pipeline
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Deal Preview Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 22, background: 'rgba(255, 255, 255, 0.02)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-400)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={13} />
              Live Deal Preview
            </div>

            <div style={{ fontSize: 17, fontWeight: 600, color: title ? 'white' : 'var(--text-muted)', marginBottom: 14 }}>
              {title || 'Untitled Deal'}
            </div>

            <div style={{ padding: 14, background: 'var(--bg-overlay)', borderRadius: 10, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Face Value</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'white' }}>
                ${numValue.toLocaleString()}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--accent-300)', marginTop: 4 }}>
                Weighted: ${weightedValue.toLocaleString()} ({probability}% probability)
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Target Stage:</span>
                <span style={{ color: 'white', textTransform: 'capitalize', fontWeight: 500 }}>
                  {stage.replace('-', ' ')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Target Close:</span>
                <span style={{ color: 'white' }}>{expectedCloseDate || 'Not specified'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Account:</span>
                <span style={{ color: 'white', fontWeight: 500 }}>
                  {contactMode === 'existing'
                    ? contacts.find((c) => c.id === selectedContactId)?.company?.name || 'Selected Contact'
                    : newCompanyName || 'New Account'}
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              fontSize: 12,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--accent-300)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={14} /> AI Telemetry Ready
            </div>
            Once created, ApexCRM will automatically track email opens, stage velocity, and compute predictive next-best-actions with Gemini AI.
          </div>
        </div>
      </div>
    </div>
  )
}
