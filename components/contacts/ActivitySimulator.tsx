'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Zap,
  Mail,
  ExternalLink,
  MessageSquare,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

export function ActivitySimulator({
  contactId,
  contactName,
}: {
  contactId: string
  contactName: string
}) {
  const router = useRouter()
  const { success, error } = useToast()
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)

  const triggerSimulation = async (action: 'email_open' | 'proposal_click' | 'incoming_sms') => {
    setLoadingAction(action)
    try {
      const res = await fetch(`/api/contacts/${contactId}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!res.ok) throw new Error('Simulation failed')
      const data = await res.json()

      success(data.message)
      window.dispatchEvent(new CustomEvent('apex:crm-refresh-ai'))
      router.refresh()
    } catch (err: any) {
      error('Failed to simulate customer activity')
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
        border: '1px solid var(--accent-500)33',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 4px 20px #00000040',
        marginBottom: 16,
      }}
    >
      {/* Simulator Header */}
      <div
        style={{
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: isExpanded ? '1px solid var(--border-subtle)' : 'none',
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: 'var(--accent-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={13} color="var(--accent-400)" />
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
              Telemetry & Activity Simulator
            </div>
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              background: 'var(--accent-glow)',
              border: '1px solid var(--accent-500)44',
              color: 'var(--accent-300)',
              padding: '1px 6px',
              borderRadius: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
            }}
          >
            Interactive Demo
          </span>
        </div>

        <button
          className="btn btn-ghost btn-icon btn-sm"
          style={{ width: 24, height: 24 }}
          aria-label={isExpanded ? 'Collapse simulator' : 'Expand simulator'}
        >
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Simulator Toolbar Content */}
      {isExpanded && (
        <div style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 10 }}>
            Simulate real customer telemetry to watch the activity timeline and AI Next-Best-Action update in real time:
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
            {/* Simulate Email Open */}
            <button
              id="simulate-email-open-btn"
              onClick={() => triggerSimulation('email_open')}
              disabled={loadingAction !== null}
              className="btn btn-secondary btn-sm"
              style={{
                justifyContent: 'flex-start',
                padding: '8px 10px',
                fontSize: 12,
                gap: 8,
              }}
            >
              {loadingAction === 'email_open' ? (
                <Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite' }} />
              ) : (
                <Mail size={13} color="var(--blue-400)" />
              )}
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div>Simulate Email Open</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>+5 Intent · Apple Mail</div>
              </div>
            </button>

            {/* Simulate Proposal Link Click */}
            <button
              id="simulate-link-click-btn"
              onClick={() => triggerSimulation('proposal_click')}
              disabled={loadingAction !== null}
              className="btn btn-secondary btn-sm"
              style={{
                justifyContent: 'flex-start',
                padding: '8px 10px',
                fontSize: 12,
                gap: 8,
              }}
            >
              {loadingAction === 'proposal_click' ? (
                <Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite' }} />
              ) : (
                <ExternalLink size={13} color="var(--amber-400)" />
              )}
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div>Simulate Proposal Click</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>+15 Intent · MSLA Viewed</div>
              </div>
            </button>

            {/* Log Incoming SMS */}
            <button
              id="simulate-incoming-sms-btn"
              onClick={() => triggerSimulation('incoming_sms')}
              disabled={loadingAction !== null}
              className="btn btn-secondary btn-sm"
              style={{
                justifyContent: 'flex-start',
                padding: '8px 10px',
                fontSize: 12,
                gap: 8,
              }}
            >
              {loadingAction === 'incoming_sms' ? (
                <Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite' }} />
              ) : (
                <MessageSquare size={13} color="var(--purple-400)" />
              )}
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div>Log Incoming SMS</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>+10 Intent · Inbound Query</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
