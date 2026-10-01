import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  TrendingUp,
  DollarSign,
  Briefcase,
  Phone,
  FileText,
  Mail,
  MessageSquare,
  Users,
  Calendar,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  Award,
  Layers,
  ChevronRight,
} from 'lucide-react'
import { ExportDataButton } from '@/components/ui/ExportDataButton'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Analytics & Reporting — ApexCRM',
  description: 'Executive pipeline analytics, lead intent leaderboard, and activity performance.',
}

function formatCurrency(val: number) {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}k`
  return `$${val.toLocaleString()}`
}

export default async function AnalyticsPage() {
  // Fetch deals with contact and company
  const deals = await prisma.deal.findMany({
    include: {
      contact: {
        include: { company: true },
      },
    },
  })

  // Fetch contacts ordered by intent score
  const contacts = await prisma.contact.findMany({
    include: {
      company: true,
      deals: true,
      timelineEvents: true,
      notes: true,
    },
    orderBy: { intentScore: 'desc' },
  })

  // Fetch timeline events and notes for activity breakdown
  const timelineEvents = await prisma.timelineEvent.findMany({
    orderBy: { createdAt: 'desc' },
  })
  const notesCount = await prisma.note.count()

  // ─── 1. Pipeline Metrics ───────────────────────────────────────────────────
  const activeDeals = deals.filter((d) => d.stage !== 'closed-lost')
  const openDeals = deals.filter(
    (d) => d.stage !== 'closed-won' && d.stage !== 'closed-lost'
  )
  const wonDeals = deals.filter((d) => d.stage === 'closed-won')
  const lostDeals = deals.filter((d) => d.stage === 'closed-lost')

  const totalPipelineValue = activeDeals.reduce((sum, d) => sum + d.value, 0)
  const openPipelineValue = openDeals.reduce((sum, d) => sum + d.value, 0)
  const wonPipelineValue = wonDeals.reduce((sum, d) => sum + d.value, 0)

  // Weighted Pipeline Value = sum(value * probability / 100)
  const weightedPipelineValue = Math.round(
    activeDeals.reduce((sum, d) => sum + d.value * (d.probability / 100), 0)
  )

  const avgDealSize = activeDeals.length
    ? Math.round(totalPipelineValue / activeDeals.length)
    : 0

  const closedCount = wonDeals.length + lostDeals.length
  const winRate = closedCount
    ? Math.round((wonDeals.length / closedCount) * 100)
    : 100

  // ─── 2. Activity Breakdown ─────────────────────────────────────────────────
  const callsCount = timelineEvents.filter((e) => e.type === 'call').length
  const notesEventsCount = timelineEvents.filter((e) => e.type === 'note').length
  const totalNotes = Math.max(notesCount, notesEventsCount)
  const emailsTracked = timelineEvents.filter((e) =>
    ['email_open', 'email_sent'].includes(e.type)
  ).length
  const meetingsAndDemos = timelineEvents.filter((e) =>
    ['meeting', 'demo'].includes(e.type)
  ).length
  const stageChangesCount = timelineEvents.filter(
    (e) => e.type === 'deal_stage_change'
  ).length

  const totalActivities =
    callsCount + totalNotes + emailsTracked + meetingsAndDemos + stageChangesCount || 1

  const activityStats = [
    {
      label: 'Calls Logged',
      count: callsCount,
      icon: Phone,
      color: 'var(--blue-400)',
      bg: 'var(--blue-bg)',
      pct: Math.round((callsCount / totalActivities) * 100),
    },
    {
      label: 'Notes Added',
      count: totalNotes,
      icon: FileText,
      color: 'var(--accent-400)',
      bg: 'var(--accent-glow)',
      pct: Math.round((totalNotes / totalActivities) * 100),
    },
    {
      label: 'Emails Tracked',
      count: emailsTracked,
      icon: Mail,
      color: 'var(--green-400)',
      bg: 'var(--green-bg)',
      pct: Math.round((emailsTracked / totalActivities) * 100),
    },
    {
      label: 'Meetings & Demos',
      count: meetingsAndDemos,
      icon: Calendar,
      color: 'var(--purple-400)',
      bg: 'var(--purple-bg)',
      pct: Math.round((meetingsAndDemos / totalActivities) * 100),
    },
  ]

  // ─── 3. Stage Funnel Breakdown ─────────────────────────────────────────────
  const stageOrder = [
    { key: 'discovery', label: 'Discovery', color: '#64748b' },
    { key: 'qualification', label: 'Qualification', color: '#3b82f6' },
    { key: 'proposal', label: 'Proposal', color: '#a855f7' },
    { key: 'negotiation', label: 'Negotiation', color: '#f59e0b' },
    { key: 'closed-won', label: 'Closed Won', color: '#22c55e' },
  ]

  const stageBreakdown = stageOrder.map((s) => {
    const stageDeals = deals.filter((d) => d.stage === s.key)
    const val = stageDeals.reduce((sum, d) => sum + d.value, 0)
    const pct = totalPipelineValue ? Math.round((val / totalPipelineValue) * 100) : 0
    return {
      ...s,
      count: stageDeals.length,
      value: val,
      percentage: pct,
    }
  })

  // ─── 4. Top Intent Contacts Leaderboard ────────────────────────────────────
  const topContacts = contacts.slice(0, 6)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '2px 8px',
                borderRadius: 6,
                background: 'var(--accent-glow)',
                border: '1px solid var(--accent-500)44',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--accent-300)',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              <Sparkles size={11} />
              AI Intelligence
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Updated real-time</span>
          </div>
          <h1 className="page-title">Analytics & Reporting</h1>
          <p className="page-subtitle">
            Executive revenue forecasting, lead intent intelligence, and sales velocity
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <ExportDataButton label="Export CRM Data" />
          <Link href="/pipeline" className="btn btn-primary btn-sm">
            <Layers size={13} />
            View Pipeline
          </Link>
        </div>
      </div>

      {/* ── 1. Top Executive KPI Cards ────────────────────────────────────── */}
      <div className="stats-row">
        {/* Total Pipeline Value */}
        <div className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 80,
              height: 80,
              background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div className="stat-label">Total Pipeline Value</div>
          <div className="stat-value gradient-text" style={{ fontSize: 26 }}>
            {formatCurrency(totalPipelineValue)}
          </div>
          <div className="stat-sub" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: 'var(--green-400)', fontWeight: 600 }}>
              {formatCurrency(openPipelineValue)}
            </span>{' '}
            open in pipeline
          </div>
        </div>

        {/* Weighted Pipeline Value */}
        <div className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 80,
              height: 80,
              background: 'radial-gradient(circle, #22c55e26 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div className="stat-label">Weighted Pipeline ($)</div>
          <div className="stat-value text-green" style={{ fontSize: 26 }}>
            {formatCurrency(weightedPipelineValue)}
          </div>
          <div className="stat-sub">Probability-adjusted revenue forecast</div>
        </div>

        {/* Active Deals & Win Rate */}
        <div className="stat-card">
          <div className="stat-label">Total Active Deals</div>
          <div className="stat-value" style={{ fontSize: 26 }}>
            {activeDeals.length}
          </div>
          <div className="stat-sub">
            Avg deal size <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(avgDealSize)}</span>
          </div>
        </div>

        {/* Closed Won Revenue */}
        <div className="stat-card">
          <div className="stat-label">Closed Won Revenue</div>
          <div className="stat-value" style={{ fontSize: 26, color: 'var(--accent-300)' }}>
            {formatCurrency(wonPipelineValue)}
          </div>
          <div className="stat-sub">
            {wonDeals.length} deals closed · {winRate}% win rate
          </div>
        </div>
      </div>

      {/* ── 2. Two-Column Analytics Layout ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 20 }}>
        
        {/* Left Column: Lead Intent Leaderboard */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'var(--green-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Award size={15} color="var(--green-400)" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Lead Intent Leaderboard
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                  Ranked by AI behavioral score & engagement velocity
                </div>
              </div>
            </div>
            <Link href="/contacts" className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>
              View all ({contacts.length})
            </Link>
          </div>

          <div style={{ padding: '8px 12px', flex: 1 }}>
            {topContacts.map((contact, idx) => {
              const openDeals = contact.deals.filter(
                (d) => !['closed-lost'].includes(d.stage)
              )
              const highestDeal = openDeals[0]
              const interactionsCount =
                contact.timelineEvents.length + contact.notes.length

              return (
                <Link
                  key={contact.id}
                  href={`/contacts/${contact.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 8,
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'background 0.15s',
                  }}
                  className="hover-row"
                >
                  {/* Rank */}
                  <span
                    style={{
                      width: 22,
                      fontSize: 12,
                      fontWeight: 700,
                      color:
                        idx === 0
                          ? 'var(--amber-400)'
                          : idx === 1
                          ? 'var(--text-primary)'
                          : idx === 2
                          ? 'var(--accent-400)'
                          : 'var(--text-muted)',
                      textAlign: 'center',
                    }}
                  >
                    #{idx + 1}
                  </span>

                  {/* Avatar */}
                  <div
                    className="avatar"
                    style={{
                      width: 32,
                      height: 32,
                      fontSize: 11,
                      border:
                        contact.intentScore >= 80
                          ? '1.5px solid var(--green-500)88'
                          : '1px solid var(--border-default)',
                    }}
                  >
                    {contact.firstName[0]}
                    {contact.lastName[0]}
                  </div>

                  {/* Contact Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      <span style={{ color: 'var(--text-primary)' }}>
                        {contact.firstName} {contact.lastName}
                      </span>
                      <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                        · {contact.company.name}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginTop: 2,
                      }}
                    >
                      <span>{interactionsCount} interactions</span>
                      {highestDeal && (
                        <>
                          <span>•</span>
                          <span style={{ color: 'var(--accent-300)' }}>
                            {formatCurrency(highestDeal.value)} deal
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Intent Score Badge & Meter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 70,
                        height: 5,
                        background: 'var(--bg-overlay)',
                        borderRadius: 3,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${contact.intentScore}%`,
                          background:
                            contact.intentScore >= 75
                              ? 'linear-gradient(90deg, var(--green-500), var(--green-400))'
                              : contact.intentScore >= 50
                              ? 'linear-gradient(90deg, var(--amber-500), var(--amber-400))'
                              : 'var(--slate-500)',
                        }}
                      />
                    </div>
                    <span
                      className={`badge ${
                        contact.intentScore >= 75
                          ? 'badge-green'
                          : contact.intentScore >= 50
                          ? 'badge-amber'
                          : 'badge-slate'
                      }`}
                      style={{ minWidth: 46, justifyContent: 'center' }}
                    >
                      <TrendingUp size={9} />
                      {contact.intentScore}
                    </span>
                    <ChevronRight size={14} color="var(--text-muted)" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Right Column: Activity Breakdown & Distribution */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Activity Breakdown */}
          <div className="card">
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: 'var(--accent-glow)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BarChart3 size={15} color="var(--accent-400)" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Activity Breakdown
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    {totalActivities} total team interactions tracked
                  </div>
                </div>
              </div>
              <span className="badge badge-accent">This Month</span>
            </div>

            {/* Combined Activity Progress Bar */}
            <div style={{ padding: '16px 20px 8px' }}>
              <div
                style={{
                  height: 10,
                  width: '100%',
                  background: 'var(--bg-overlay)',
                  borderRadius: 6,
                  overflow: 'hidden',
                  display: 'flex',
                }}
              >
                {activityStats.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      height: '100%',
                      width: `${item.pct}%`,
                      background: item.color,
                      transition: 'width 0.5s ease',
                    }}
                    title={`${item.label}: ${item.count} (${item.pct}%)`}
                  />
                ))}
              </div>
            </div>

            {/* Activity 2x2 Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                padding: 16,
              }}
            >
              {activityStats.map((act) => {
                const Icon = act.icon
                return (
                  <div
                    key={act.label}
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 10,
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: act.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={14} color={act.color} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: act.color }}>
                        {act.pct}%
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {act.count}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                        {act.label}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Pipeline Stage Distribution */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
              Pipeline Volume by Stage
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stageBreakdown.map((stg) => (
                <div key={stg.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: stg.color,
                        }}
                      />
                      {stg.label} ({stg.count})
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {formatCurrency(stg.value)} ({stg.percentage}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: 'var(--bg-overlay)',
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.max(stg.percentage, 2)}%`,
                        background: stg.color,
                        borderRadius: 3,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
