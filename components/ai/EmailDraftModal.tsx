import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Sparkles, Loader2, Copy, CheckCheck, X, SendHorizonal, Check } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

type DraftResult = {
  subject: string
  body: string
  tone: string
}

const TONE_OPTIONS = [
  { key: 'followup',  label: 'Follow-Up',                  desc: 'Reference last conversation' },
  { key: 'pricing',   label: 'Overcome Pricing Objection', desc: 'Focus on ROI & value'        },
  { key: 'demo',      label: 'Schedule Demo',              desc: 'Invite to personalized demo' },
  { key: 'checkin',   label: 'Check In',                   desc: 'Friendly, low-pressure touch'},
]

export function EmailDraftModal({
  contactId,
  contactName,
  onClose,
}: {
  contactId: string
  contactName: string
  onClose: () => void
}) {
  const router = useRouter()
  const { success } = useToast()
  const [selectedTone, setSelectedTone] = useState<string | null>(null)
  const [draft, setDraft] = useState<DraftResult | null>(null)
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const [logged, setLogged] = useState(false)
  const [isLogging, setIsLogging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = (toneKey: string) => {
    setSelectedTone(toneKey)
    setDraft(null)
    setError(null)
    setLogged(false)

    startTransition(async () => {
      try {
        const res = await fetch('/api/ai/draft-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactId, toneKey }),
        })
        if (!res.ok) throw new Error('API error')
        setDraft(await res.json())
      } catch {
        setError('Failed to generate email. Please try again.')
      }
    })
  }

  const copyAll = () => {
    if (!draft) return
    const text = `Subject: ${draft.subject}\n\n${draft.body}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    success('Email copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const logToTimeline = async () => {
    if (!draft || isLogging || logged) return
    setIsLogging(true)
    try {
      const res = await fetch(`/api/contacts/${contactId}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'email_sent',
          metadata: {
            subject: draft.subject,
            snippet: draft.body.slice(0, 160) + '…',
            tone: draft.tone,
          },
        }),
      })
      if (res.ok) {
        setLogged(true)
        success('Email logged to contact timeline')
        router.refresh()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLogging(false)
    }
  }

  return (
    /* Backdrop */
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: '#000000aa',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        animation: 'fade-in 0.2s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 80px #00000060',
        }}
      >
        {/* Modal header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent-600), var(--purple-500))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px var(--accent-glow)',
          }}>
            <Mail size={14} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
              AI Email Drafter
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
              Personalized email for {contactName}
            </div>
          </div>
          <button
            id="close-email-modal"
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            style={{ marginLeft: 'auto' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tone selector */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 10 }}>
            Select email goal
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {TONE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                id={`tone-btn-${opt.key}`}
                onClick={() => generate(opt.key)}
                disabled={isPending}
                style={{
                  background: selectedTone === opt.key ? 'var(--accent-glow)' : 'var(--bg-elevated)',
                  border: `1px solid ${selectedTone === opt.key ? 'var(--accent-500)' : 'var(--border-default)'}`,
                  borderRadius: 10,
                  padding: '10px 14px',
                  textAlign: 'left',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  opacity: isPending && selectedTone !== opt.key ? 0.5 : 1,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: selectedTone === opt.key ? 'var(--accent-300)' : 'var(--text-primary)', marginBottom: 2 }}>
                  {isPending && selectedTone === opt.key ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Loader2 size={12} style={{ animation: 'spin 0.7s linear infinite' }} />
                      Generating…
                    </span>
                  ) : opt.label}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Draft output */}
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {!selectedTone && !draft && !error && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
              <Sparkles size={28} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <div style={{ fontSize: 13 }}>Select an email goal above to generate a draft</div>
            </div>
          )}

          {isPending && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>
              <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} />
              Gemini is crafting your personalized email…
            </div>
          )}

          {error && !isPending && (
            <div style={{
              padding: '12px 14px', background: 'var(--red-bg)',
              border: '1px solid var(--red-500)33', borderRadius: 8,
              fontSize: 13, color: 'var(--red-400)',
            }}>
              {error}
            </div>
          )}

          {draft && !isPending && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'fade-in 0.3s ease' }}>
              {/* Subject */}
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-muted)', marginBottom: 6 }}>
                  Subject Line
                </div>
                <div style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}>
                  {draft.subject}
                </div>
              </div>

              {/* Body */}
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-muted)', marginBottom: 6 }}>
                  Email Body
                </div>
                <div style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 8,
                  padding: '14px',
                  fontSize: 13.5,
                  color: 'var(--text-primary)',
                  lineHeight: 1.65,
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'Georgia, serif',
                }}>
                  {draft.body}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {draft && !isPending && (
          <div style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            gap: 8,
            flexShrink: 0,
          }}>
            <button
              id="copy-email-draft"
              className="btn btn-primary btn-sm"
              onClick={copyAll}
              style={{ gap: 5 }}
            >
              {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy Email'}
            </button>
            <button
              id="log-email-timeline"
              className="btn btn-secondary btn-sm"
              onClick={logToTimeline}
              disabled={isLogging || logged}
              style={{ gap: 5 }}
            >
              {isLogging ? (
                <Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite' }} />
              ) : logged ? (
                <Check size={13} color="var(--green-400)" />
              ) : (
                <SendHorizonal size={13} />
              )}
              {logged ? 'Logged to Timeline' : 'Log to Timeline'}
            </button>
            <button
              id="regenerate-email"
              className="btn btn-secondary btn-sm"
              onClick={() => selectedTone && generate(selectedTone)}
            >
              <Sparkles size={12} />
              Regenerate
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ marginLeft: 'auto' }}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
