'use client'

import { useState, useEffect } from 'react'
import { Zap, ArrowRight, Loader2, AlertTriangle, TrendingUp, Clock } from 'lucide-react'

type NextAction = {
  recommendation: string
  urgency: 'HIGH' | 'MEDIUM' | 'LOW'
  suggestedAction: string
  reasoning: string
}

const URGENCY_CONFIG = {
  HIGH:   { badge: 'badge-red',    icon: AlertTriangle, label: 'High Urgency',   glow: '#ef44441a' },
  MEDIUM: { badge: 'badge-amber',  icon: TrendingUp,    label: 'Medium Urgency', glow: '#d9770620' },
  LOW:    { badge: 'badge-slate',  icon: Clock,         label: 'Low Urgency',    glow: 'transparent' },
}

export function NextBestAction({
  contactId,
  onActionClick,
}: {
  contactId: string
  onActionClick?: (action: string) => void
}) {
  const [data, setData] = useState<NextAction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshCount, setRefreshCount] = useState(0)

  useEffect(() => {
    const handleRefresh = () => {
      setRefreshCount((prev) => prev + 1)
    }
    window.addEventListener('apex:crm-refresh-ai', handleRefresh)
    return () => window.removeEventListener('apex:crm-refresh-ai', handleRefresh)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    fetch('/api/ai/next-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId }),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then(setData)
      .catch((e) => {
        if (e.name !== 'AbortError') setError('Failed to load AI recommendation')
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [contactId, refreshCount])

  const cfg = data ? URGENCY_CONFIG[data.urgency] : null
  const UrgencyIcon = cfg?.icon ?? Zap

  return (
    <div
      style={{
        background: cfg ? cfg.glow : 'var(--bg-elevated)',
        border: `1px solid ${
          data?.urgency === 'HIGH'   ? 'var(--red-500)33' :
          data?.urgency === 'MEDIUM' ? 'var(--amber-500)33' :
          'var(--border-default)'
        }`,
        borderRadius: 12,
        padding: '14px 16px',
        marginBottom: 16,
        transition: 'all 0.3s ease',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent-600), var(--purple-500))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px var(--accent-glow)',
          }}
        >
          <Zap size={13} color="white" />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.3px', color: 'var(--accent-300)', textTransform: 'uppercase' }}>
          AI Next-Best-Action
        </span>
        {data && (
          <span className={`badge ${cfg?.badge}`} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            <UrgencyIcon size={9} />
            {cfg?.label}
          </span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
          <Loader2 size={14} className="animate-spin" style={{ animation: 'spin 0.7s linear infinite' }} />
          Analyzing contact signals…
        </div>
      ) : error ? (
        <div style={{ color: 'var(--red-400)', fontSize: 12 }}>{error}</div>
      ) : data ? (
        <>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px', lineHeight: 1.4 }}>
            {data.recommendation}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
            {data.reasoning}
          </p>
          <button
            id={`next-action-btn-${contactId}`}
            className="btn btn-primary btn-sm"
            style={{ fontSize: 12 }}
            onClick={() => onActionClick?.(data.suggestedAction)}
          >
            <ArrowRight size={12} />
            {data.suggestedAction}
          </button>
        </>
      ) : null}
    </div>
  )
}
