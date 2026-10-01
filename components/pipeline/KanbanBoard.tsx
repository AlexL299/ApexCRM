'use client'

import { useState, useCallback } from 'react'
import { TrendingUp, DollarSign, MoreHorizontal, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

// ─── Types ─────────────────────────────────────────────────────────────────

export type DealWithRelations = {
  id: string
  title: string
  value: number
  stage: string
  probability: number
  expectedCloseDate: string
  contactId: string
  contact: {
    id: string
    firstName: string
    lastName: string
    intentScore: number
    company: {
      name: string
    }
  }
}

// ─── Stage config ───────────────────────────────────────────────────────────

export const STAGES = [
  { key: 'discovery',    label: 'Discovery',       color: 'var(--slate-500)',  dot: '#64748b' },
  { key: 'qualification',label: 'Qualification',   color: 'var(--blue-500)',   dot: '#3b82f6' },
  { key: 'proposal',     label: 'Proposal',        color: 'var(--purple-500)', dot: '#a855f7' },
  { key: 'negotiation',  label: 'Negotiation',     color: 'var(--amber-500)',  dot: '#f59e0b' },
  { key: 'closed-won',   label: 'Closed Won',      color: 'var(--green-500)',  dot: '#22c55e' },
  { key: 'closed-lost',  label: 'Closed Lost',     color: 'var(--red-500)',    dot: '#ef4444' },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(val: number) {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000)     return `$${(val / 1_000).toFixed(0)}k`
  return `$${val}`
}

function intentColor(score: number) {
  if (score >= 75) return 'badge-green'
  if (score >= 50) return 'badge-amber'
  return 'badge-slate'
}

// ─── Deal Card ──────────────────────────────────────────────────────────────

function DealCard({
  deal,
  stages,
  onStageChange,
}: {
  deal: DealWithRelations
  stages: typeof STAGES
  onStageChange: (id: string, stage: string) => void
}) {
  const router = useRouter()
  const contactName = `${deal.contact.firstName} ${deal.contact.lastName}`

  return (
    <div
      className="deal-card"
      style={{ cursor: 'pointer' }}
      onClick={() => router.push(`/deals/${deal.id}`)}
    >
      <div className="deal-card-title">{deal.title}</div>
      <div className="deal-card-company">{deal.contact.company.name}</div>

      <div className="deal-card-meta">
        <Link
          href={`/contacts/${deal.contactId}`}
          className="deal-card-contact"
          style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
          onClick={(e) => e.stopPropagation()}
        >
          {contactName}
        </Link>
        <span className={`badge ${intentColor(deal.contact.intentScore)}`}>
          <TrendingUp size={9} />
          {deal.contact.intentScore}
        </span>
      </div>

      <div className="prob-bar">
        <div className="prob-bar-fill" style={{ width: `${deal.probability}%` }} />
      </div>

      <div className="deal-card-footer">
        <span className="deal-card-value">{formatCurrency(deal.value)}</span>

        <select
          className="stage-select"
          value={deal.stage}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation()
            onStageChange(deal.id, e.target.value)
          }}
          aria-label={`Move ${deal.title} to stage`}
        >
          {stages.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

// ─── Kanban Column ──────────────────────────────────────────────────────────

function KanbanColumn({
  stage,
  deals,
  onStageChange,
}: {
  stage: typeof STAGES[number]
  deals: DealWithRelations[]
  onStageChange: (id: string, stage: string) => void
}) {
  const totalValue = deals.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="kanban-column">
      <div className="kanban-column-header">
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: stage.dot,
            flexShrink: 0,
            boxShadow: `0 0 6px ${stage.dot}88`,
          }}
        />
        <span className="kanban-column-title">{stage.label}</span>
        <span className="kanban-column-count">{deals.length}</span>
        {totalValue > 0 && (
          <span className="kanban-column-value">{formatCurrency(totalValue)}</span>
        )}
      </div>

      <div className="kanban-cards">
        {deals.length === 0 ? (
          <div
            style={{
              padding: '24px 12px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 12,
              border: '1px dashed var(--border-subtle)',
              borderRadius: 8,
            }}
          >
            No deals
          </div>
        ) : (
          deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              stages={STAGES}
              onStageChange={onStageChange}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Main Board ─────────────────────────────────────────────────────────────

export function KanbanBoard({ initialDeals }: { initialDeals: DealWithRelations[] }) {
  const { success, error } = useToast()
  const [deals, setDeals] = useState<DealWithRelations[]>(initialDeals)
  const [movingId, setMovingId] = useState<string | null>(null)

  const handleStageChange = useCallback(async (id: string, newStage: string) => {
    // Optimistic update
    setDeals((prev) =>
      prev.map((d) => (d.id === id ? { ...d, stage: newStage } : d))
    )
    setMovingId(id)

    try {
      const res = await fetch(`/api/deals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      })
      if (!res.ok) throw new Error('Failed to update')
      const updated = await res.json()
      setDeals((prev) => prev.map((d) => (d.id === id ? updated : d)))
      success(`Deal stage updated to ${newStage.replace('-', ' ')}`)
    } catch {
      // Rollback on error
      setDeals((prev) =>
        prev.map((d) => (d.id === id ? initialDeals.find((od) => od.id === id)! : d))
      )
      error('Failed to update deal stage')
    } finally {
      setMovingId(null)
    }
  }, [initialDeals, success, error])

  const totalPipeline = deals
    .filter((d) => d.stage !== 'closed-won' && d.stage !== 'closed-lost')
    .reduce((s, d) => s + d.value, 0)

  const wonTotal = deals
    .filter((d) => d.stage === 'closed-won')
    .reduce((s, d) => s + d.value, 0)

  const wonCount = deals.filter((d) => d.stage === 'closed-won').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Open Pipeline</div>
          <div className="stat-value gradient-text">{formatCurrency(totalPipeline)}</div>
          <div className="stat-sub">{deals.filter(d => d.stage !== 'closed-won' && d.stage !== 'closed-lost').length} active deals</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Closed Won</div>
          <div className="stat-value text-green">{formatCurrency(wonTotal)}</div>
          <div className="stat-sub">{wonCount} deals closed</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Deals</div>
          <div className="stat-value">{deals.length}</div>
          <div className="stat-sub">across {STAGES.length} stages</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Deal Size</div>
          <div className="stat-value">{deals.length ? formatCurrency(Math.round(deals.reduce((s,d)=>s+d.value,0)/deals.length)) : '$0'}</div>
          <div className="stat-sub">weighted average</div>
        </div>
      </div>

      {/* Board */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {movingId && (
          <div
            style={{
              position: 'absolute',
              top: 0, right: 0,
              zIndex: 10,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 12,
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <div className="spinner" style={{ width: 12, height: 12 }} />
            Saving…
          </div>
        )}

        <div className="kanban-board">
          {STAGES.map((stage) => (
            <KanbanColumn
              key={stage.key}
              stage={stage}
              deals={deals.filter((d) => d.stage === stage.key)}
              onStageChange={handleStageChange}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
