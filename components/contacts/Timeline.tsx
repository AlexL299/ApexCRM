'use client'

import {
  Mail,
  Phone,
  Calendar,
  FileText,
  MousePointerClick,
  MessageSquare,
  Activity,
  Layers,
} from 'lucide-react'
import type { TimelineEvent } from '@/lib/types'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30)  return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

type IconConfig = {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string; className?: string }>
  bg: string
  color: string
}

function getIconConfig(type: string): IconConfig {
  switch (type) {
    case 'email_sent':
      return { icon: Mail, bg: 'var(--blue-bg)', color: 'var(--blue-400)' }
    case 'email_open':
      return { icon: MousePointerClick, bg: 'var(--accent-glow)', color: 'var(--accent-400)' }
    case 'call':
      return { icon: Phone, bg: 'var(--green-bg)', color: 'var(--green-400)' }
    case 'meeting':
      return { icon: Calendar, bg: 'var(--purple-bg)', color: 'var(--purple-500)' }
    case 'note':
      return { icon: FileText, bg: 'var(--amber-bg)', color: 'var(--amber-400)' }
    case 'demo':
      return { icon: Activity, bg: 'var(--green-bg)', color: 'var(--green-400)' }
    case 'deal_stage_change':
      return { icon: Layers, bg: 'var(--slate-bg)', color: 'var(--slate-500)' }
    case 'link_clicked':
      return { icon: MousePointerClick, bg: 'var(--amber-bg)', color: 'var(--amber-400)' }
    case 'sms_received':
      return { icon: MessageSquare, bg: 'var(--purple-bg)', color: 'var(--purple-400)' }
    default:
      return { icon: MessageSquare, bg: 'var(--slate-bg)', color: 'var(--slate-500)' }
  }
}

function typeLabel(type: string) {
  switch (type) {
    case 'email_sent':       return 'Email Sent'
    case 'email_open':       return 'Email Opened'
    case 'call':             return 'Call'
    case 'meeting':          return 'Meeting'
    case 'note':             return 'Note Added'
    case 'demo':             return 'Demo'
    case 'deal_stage_change':return 'Stage Changed'
    case 'link_clicked':     return 'Proposal Link Clicked'
    case 'sms_received':     return 'Inbound SMS Received'
    default: return type.replace(/_/g, ' ')
  }
}

function parseMetadata(raw: string): Record<string, unknown> {
  try { return JSON.parse(raw) } catch { return {} }
}

function eventSnippet(type: string, meta: Record<string, unknown>): string {
  switch (type) {
    case 'email_sent':
      return `"${meta.subject ?? ''}" — ${meta.snippet ?? ''}`
    case 'email_open':
      return `"${meta.subject ?? ''}" — ${meta.action ?? `opened ${meta.opens ?? 1}×`}`
    case 'call':
      return `${meta.outcome ? `${String(meta.outcome).charAt(0).toUpperCase() + String(meta.outcome).slice(1)} outcome` : ''} · ${meta.duration ? `${Math.round(Number(meta.duration) / 60)}m` : ''}`
    case 'meeting':
      return `${meta.title ?? ''} — ${meta.outcome ?? ''}`
    case 'demo':
      return `${meta.title ?? ''} · ${meta.duration ? `${Math.round(Number(meta.duration) / 60)}m` : ''}`
    case 'deal_stage_change':
      return `Moved from "${meta.from}" → "${meta.to}"`
    case 'link_clicked':
      return `${meta.asset ?? 'Proposal Link'} · ${meta.dwellTimeSeconds ? `${meta.dwellTimeSeconds}s dwell time` : 'viewed'}`
    case 'sms_received':
      return `"${meta.text ?? ''}"`
    case 'note':
      return String(meta.snippet ?? '')
    default:
      return ''
  }
}

export function Timeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <div
        style={{
          padding: '32px 16px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 13,
        }}
      >
        No timeline events yet
      </div>
    )
  }

  return (
    <div className="timeline">
      {events.map((ev) => {
        const cfg = getIconConfig(ev.type)
        const Icon = cfg.icon
        const meta = parseMetadata(ev.metadata)
        const snippet = eventSnippet(ev.type, meta)

        return (
          <div key={ev.id} className="timeline-item">
            <div
              className="timeline-icon-wrap"
              style={{ background: cfg.bg }}
            >
              <Icon size={14} strokeWidth={2} color={cfg.color} />
            </div>
            <div className="timeline-content">
              <div className="timeline-type">{typeLabel(ev.type)}</div>
              {snippet && (
                <div className="timeline-snippet">{snippet}</div>
              )}
              <div className="timeline-time">{timeAgo(ev.createdAt)}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
