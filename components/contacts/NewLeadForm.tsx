'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  UserPlus,
  Mail,
  Phone,
  Building,
  Briefcase,
  FileText,
  ArrowLeft,
  Loader2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

export function NewLeadForm() {
  const router = useRouter()
  const { addToast } = useToast()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState('prospect')
  const [notes, setNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError('First name, last name, and email are required.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          companyName: companyName.trim() || 'Independent / General',
          title: title.trim() || 'Lead',
          status,
          notes: notes.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create lead')
      }

      addToast({
        title: 'Lead Created Successfully',
        description: `${firstName} ${lastName} has been added to contacts.`,
        type: 'success',
      })

      if (data.contact?.id) {
        router.push(`/contacts/${data.contact.id}`)
      } else {
        router.push('/contacts')
      }
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Error saving lead')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header Back link */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link
          href="/contacts"
          className="btn btn-ghost btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={16} />
          Back to Contacts
        </Link>
      </div>

      <div className="page-header" style={{ marginBottom: 28 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserPlus className="text-indigo-400" size={26} />
            Create New Lead & Contact
          </h1>
          <p className="page-subtitle">
            Add a prospect or client to your CRM with real-time intent score initialization.
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
            {/* Name Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label" style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Jordan"
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

              <div>
                <label className="form-label" style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Vance"
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
            </div>

            {/* Email & Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label" style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Email Address *
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jordan.vance@company.com"
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
                  Phone Number
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={15} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 234-5678"
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

            {/* Company & Title */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label" style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Company Name
                </label>
                <div style={{ position: 'relative' }}>
                  <Building size={15} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Zenith Technologies"
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
                  Job Title
                </label>
                <div style={{ position: 'relative' }}>
                  <Briefcase size={15} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. VP of Product"
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

            {/* Status */}
            <div>
              <label className="form-label" style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                Lead Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
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
                <option value="prospect" style={{ background: '#111827', color: 'white' }}>
                  Prospect (Early discovery, initial outreach)
                </option>
                <option value="active" style={{ background: '#111827', color: 'white' }}>
                  Active (Evaluating, engaged in dialogue)
                </option>
                <option value="qualified" style={{ background: '#111827', color: 'white' }}>
                  Qualified (Budget & timeline confirmed)
                </option>
              </select>
            </div>

            {/* Initial Notes */}
            <div>
              <label className="form-label" style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                Initial Notes & Background Context
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Met at TechSummit 2026. Interested in automated email telemetry and AI note summarization..."
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: 'white',
                  fontSize: 13.5,
                  resize: 'vertical',
                }}
              />
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
                    Creating Lead...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Save Lead to ApexCRM
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Profile Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 22, background: 'rgba(255, 255, 255, 0.02)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-400)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={13} />
              Lead Card Preview
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent-600), #7c3aed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'white',
                }}
              >
                {firstName ? firstName[0].toUpperCase() : 'L'}
                {lastName ? lastName[0].toUpperCase() : 'D'}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'white' }}>
                  {firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Jane Prospect'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {title || 'Prospective Lead'} {companyName ? `at ${companyName}` : ''}
                </div>
              </div>
            </div>

            <div style={{ padding: 12, background: 'var(--bg-overlay)', borderRadius: 8, marginBottom: 14, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                <span style={{ color: 'white' }}>{email || 'Not provided'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <span style={{ textTransform: 'capitalize', color: 'var(--accent-300)', fontWeight: 600 }}>{status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Intent Score:</span>
                <span style={{ color: '#34d399', fontWeight: 700 }}>{status === 'active' ? '70 / 100' : '50 / 100'}</span>
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
              <CheckCircle2 size={14} /> 360° Profile Initialized
            </div>
            Saving this lead will auto-generate an initial contact history record and enable AI smart note drafting and intent score tracking.
          </div>
        </div>
      </div>
    </div>
  )
}
