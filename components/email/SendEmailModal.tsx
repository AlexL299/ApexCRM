'use client'

import { useState } from 'react'
import { X, Send, Loader2, CheckCircle2 } from 'lucide-react'

interface SendEmailModalProps {
  contactId: string
  contactName: string
  contactEmail: string
  onClose: () => void
}

export function SendEmailModal({
  contactId,
  contactName,
  contactEmail,
  onClose,
}: SendEmailModalProps) {
  const [subject, setSubject] = useState(`Following up — ${contactName}`)
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return
    setStatus('sending')
    setErrorMsg('')

    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, subject: subject.trim(), body: body.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Send failed')
      setStatus('sent')
      setTimeout(onClose, 1800)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send email')
      setStatus('error')
    }
  }

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modal} role="dialog" aria-modal="true" aria-label="Send Email">
        {/* Header */}
        <div style={modalHeader}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              Send Email
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              To: {contactName} &lt;{contactEmail}&gt;
            </div>
          </div>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose} aria-label="Close">
            <X size={15} />
          </button>
        </div>

        {status === 'sent' ? (
          <div style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <CheckCircle2 size={36} color="var(--green-500)" />
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Email sent!</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Activity has been logged to the timeline.</div>
          </div>
        ) : (
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Subject</label>
              <input
                style={inputStyle}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject..."
              />
            </div>

            <div>
              <label style={labelStyle}>Message</label>
              <textarea
                style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={`Hi ${contactName.split(' ')[0]},\n\nI wanted to follow up on...`}
              />
            </div>

            {status === 'error' && (
              <div style={errorStyle}>{errorMsg}</div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={onClose}>
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSend}
                disabled={status === 'sending' || !subject.trim() || !body.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {status === 'sending' ? (
                  <>
                    <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.65)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  backdropFilter: 'blur(4px)',
}

const modal: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 14,
  width: '100%',
  maxWidth: 520,
  margin: '0 16px',
  overflow: 'hidden',
  boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
}

const modalHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  borderBottom: '1px solid var(--border-subtle)',
  background: 'var(--bg-elevated)',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: 'var(--text-muted)',
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 8,
  padding: '9px 12px',
  color: 'var(--text-primary)',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const errorStyle: React.CSSProperties = {
  background: 'rgba(239,68,68,0.1)',
  border: '1px solid rgba(239,68,68,0.3)',
  borderRadius: 8,
  padding: '8px 12px',
  color: '#f87171',
  fontSize: 12,
}
