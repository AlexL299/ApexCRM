'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Send, Loader2, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

type AIAnalysis = {
  summary: string
  actionItems: string[]
  suggestedStageChange: string | null
  stageSuggestionReason: string | null
}

type NoteResult = {
  note: { id: string }
  aiAnalysis: AIAnalysis
}

export function SmartNoteInput({ contactId, onNoteSaved }: {
  contactId: string
  onNoteSaved?: (analysis: AIAnalysis) => void
}) {
  const router = useRouter()
  const { success, error: showError } = useToast()
  const [content, setContent] = useState('')
  const [result, setResult] = useState<NoteResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const submit = () => {
    if (!content.trim() || isPending) return
    setResult(null)
    setError(null)

    startTransition(async () => {
      try {
        const res = await fetch('/api/ai/parse-note', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactId, rawContent: content }),
        })
        if (!res.ok) throw new Error('API error')
        const data: NoteResult = await res.json()
        setResult(data)
        setContent('')
        onNoteSaved?.(data.aiAnalysis)
        success('Note saved and parsed by AI')
        window.dispatchEvent(new CustomEvent('apex:crm-refresh-ai'))
        router.refresh()
      } catch {
        const msg = 'Failed to save note. Please try again.'
        setError(msg)
        showError(msg)
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Input */}
      <div style={{ position: 'relative' }}>
        <textarea
          ref={textareaRef}
          id={`smart-note-${contactId}`}
          className="note-textarea"
          placeholder="Summarize a call, meeting, or interaction. AI will extract key insights and action items automatically…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit()
          }}
          style={{ minHeight: 110 }}
          disabled={isPending}
        />
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'var(--accent-glow)',
            border: '1px solid var(--accent-500)44',
            borderRadius: 6,
            padding: '2px 7px',
            fontSize: 9.5,
            fontWeight: 600,
            color: 'var(--accent-400)',
            letterSpacing: '0.3px',
            textTransform: 'uppercase',
            pointerEvents: 'none',
          }}
        >
          <Sparkles size={8} />
          AI-Enhanced
        </div>
      </div>

      {/* Submit row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {isPending ? 'Analyzing with Gemini…' : '⌘↵ to save with AI analysis'}
        </span>
        <button
          id={`submit-smart-note-${contactId}`}
          className="btn btn-primary btn-sm"
          disabled={!content.trim() || isPending}
          onClick={submit}
          style={{ gap: 5 }}
        >
          {isPending ? (
            <Loader2 size={12} style={{ animation: 'spin 0.7s linear infinite' }} />
          ) : (
            <Sparkles size={12} />
          )}
          {isPending ? 'Processing…' : 'Save + AI Analyze'}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 12px', background: 'var(--red-bg)',
          border: '1px solid var(--red-500)33', borderRadius: 8,
          fontSize: 12, color: 'var(--red-400)',
        }}>
          <AlertCircle size={13} />
          {error}
        </div>
      )}

      {/* AI Result */}
      {result && (
        <div
          style={{
            background: 'var(--accent-glow)',
            border: '1px solid var(--accent-500)44',
            borderRadius: 10,
            overflow: 'hidden',
            animation: 'fade-in 0.3s ease',
          }}
        >
          {/* Summary */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--accent-500)22' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-400)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>
              ✦ AI Summary
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
              {result.aiAnalysis.summary}
            </p>
          </div>

          {/* Action items */}
          {result.aiAnalysis.actionItems.length > 0 && (
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--accent-500)22' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-400)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
                Action Items
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {result.aiAnalysis.actionItems.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                    <CheckCircle2 size={12} color="var(--accent-400)" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stage suggestion */}
          {result.aiAnalysis.suggestedStageChange && (
            <div style={{ padding: '10px 14px', background: 'var(--amber-bg)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--amber-400)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>
                Stage Change Suggested
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="badge badge-amber" style={{ textTransform: 'capitalize' }}>
                  → {result.aiAnalysis.suggestedStageChange}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {result.aiAnalysis.stageSuggestionReason}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
