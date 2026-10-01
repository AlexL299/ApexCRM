'use client'

import { useState, useTransition } from 'react'
import { Send, Loader2 } from 'lucide-react'

export function QuickNote({ contactId }: { contactId: string }) {
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const submit = () => {
    if (!content.trim()) return
    startTransition(async () => {
      await fetch(`/api/contacts/${contactId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawContent: content }),
      })
      setContent('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <textarea
        id={`note-input-${contactId}`}
        className="note-textarea"
        placeholder="Add a note, call summary, or activity…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit()
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {saved ? '✓ Saved!' : '⌘↵ to save'}
        </span>
        <button
          id={`save-note-${contactId}`}
          className="btn btn-primary btn-sm"
          disabled={!content.trim() || isPending}
          onClick={submit}
        >
          {isPending ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Send size={12} />
          )}
          {isPending ? 'Saving…' : 'Save Note'}
        </button>
      </div>
    </div>
  )
}
