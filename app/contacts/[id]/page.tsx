import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Mail,
  Phone,
  Building2,
  TrendingUp,
  ArrowLeft,
  ExternalLink,
  DollarSign,
  Calendar,
  FileText,
  CheckCircle2,
} from 'lucide-react'
import { Timeline } from '@/components/contacts/Timeline'
import { ActivitySimulator } from '@/components/contacts/ActivitySimulator'
import { SmartNoteInput } from '@/components/ai/SmartNoteInput'
import { ContactAIBanner, ContactAIActions } from '@/components/ai/ContactAIActions'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const contact = await prisma.contact.findUnique({ where: { id } })
  if (!contact) return { title: 'Contact Not Found' }
  return {
    title: `${contact.firstName} ${contact.lastName} — ApexCRM`,
    description: `360° profile for ${contact.firstName} ${contact.lastName}`,
  }
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'active':      return 'badge-green'
    case 'prospect':    return 'badge-blue'
    case 'churned':     return 'badge-red'
    case 'closed-won':  return 'badge-purple'
    case 'closed-lost': return 'badge-slate'
    default:            return 'badge-slate'
  }
}

function intentBadgeClass(score: number) {
  if (score >= 75) return 'badge-green'
  if (score >= 50) return 'badge-amber'
  return 'badge-slate'
}

function stageBadgeClass(stage: string) {
  switch (stage) {
    case 'closed-won':   return 'badge-green'
    case 'closed-lost':  return 'badge-red'
    case 'negotiation':  return 'badge-amber'
    case 'proposal':     return 'badge-purple'
    case 'qualification':return 'badge-blue'
    default:             return 'badge-slate'
  }
}

function formatCurrency(val: number) {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000)     return `$${(val / 1_000).toFixed(0)}k`
  return `$${val}`
}

export default async function ContactProfilePage({ params }: Props) {
  const { id } = await params

  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      company: true,
      deals: { orderBy: { expectedCloseDate: 'asc' } },
      timelineEvents: { orderBy: { createdAt: 'desc' } },
      notes: {
        include: { author: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!contact) notFound()

  const fullName = `${contact.firstName} ${contact.lastName}`
  const initials = `${contact.firstName[0]}${contact.lastName[0]}`

  // Serialize dates for client components
  const serializedEvents = contact.timelineEvents.map((e) => ({
    ...e,
    createdAt: e.createdAt.toISOString(),
  }))

  const serializedNotes = contact.notes.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
  }))

  const serializedDeals = contact.deals.map((d) => ({
    ...d,
    expectedCloseDate: d.expectedCloseDate.toISOString(),
  }))

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Back nav */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Link href="/contacts" className="btn btn-ghost btn-sm">
          <ArrowLeft size={13} />
          Contacts
        </Link>
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>/</span>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{fullName}</span>
      </div>

      {/* AI Next-Best-Action banner */}
      <ContactAIBanner contactId={contact.id} contactName={fullName} />

      {/* 3-column grid */}
      <div className="profile-grid" style={{ flex: 1, minHeight: 0 }}>

        {/* ── Left Column: Contact Info ───────────────────────── */}
        <div className="profile-col">
          {/* Identity card */}
          <div className="profile-section">
            <div
              style={{
                padding: '20px 16px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                borderBottom: '1px solid var(--border-subtle)',
                background: 'linear-gradient(180deg, var(--bg-elevated) 0%, transparent 100%)',
              }}
            >
              <div
                className="avatar avatar-lg"
                style={{
                  boxShadow: '0 0 20px var(--accent-glow)',
                  border: '2px solid var(--accent-500)44',
                }}
              >
                {initials}
              </div>
              <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{fullName}</h1>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '4px 0 8px' }}>
                  {contact.title ?? 'No title'} · {contact.company.name}
                </p>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <span className={`badge ${statusBadgeClass(contact.status)}`}>
                    {contact.status}
                  </span>
                  <span className={`badge ${intentBadgeClass(contact.intentScore)}`}>
                    <TrendingUp size={9} />
                    Intent {contact.intentScore}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ paddingTop: 12 }}>
              <ContactAIActions contactId={contact.id} contactName={fullName} />
            </div>

            <div className="profile-section-body">
              <div className="detail-row">
                <div className="detail-label">Email</div>
                <div className="detail-value">
                  <Mail size={13} color="var(--text-muted)" />
                  <a
                    href={`mailto:${contact.email}`}
                    style={{ color: 'var(--accent-300)', textDecoration: 'none', fontSize: 13 }}
                  >
                    {contact.email}
                  </a>
                </div>
              </div>

              {contact.phone && (
                <div className="detail-row">
                  <div className="detail-label">Phone</div>
                  <div className="detail-value">
                    <Phone size={13} color="var(--text-muted)" />
                    <span style={{ fontSize: 13 }}>{contact.phone}</span>
                  </div>
                </div>
              )}

              <div className="detail-row">
                <div className="detail-label">Company</div>
                <div className="detail-value">
                  <Building2 size={13} color="var(--text-muted)" />
                  <span style={{ fontSize: 13 }}>{contact.company.name}</span>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-label">Industry</div>
                <div className="detail-value" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {contact.company.industry}
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-label">Company Size</div>
                <div className="detail-value">
                  <span className="badge badge-slate" style={{ textTransform: 'capitalize' }}>
                    {contact.company.size}
                  </span>
                </div>
              </div>

              {/* Intent score bar */}
              <div className="detail-row">
                <div className="detail-label" style={{ marginBottom: 6 }}>AI Intent Signal</div>
                <div
                  style={{
                    height: 6,
                    background: 'var(--bg-elevated)',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${contact.intentScore}%`,
                      borderRadius: 4,
                      background:
                        contact.intentScore >= 75
                          ? 'linear-gradient(90deg, var(--green-500), var(--green-400))'
                          : contact.intentScore >= 50
                          ? 'linear-gradient(90deg, var(--amber-500), var(--amber-400))'
                          : 'linear-gradient(90deg, var(--slate-500), var(--slate-500))',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    marginTop: 4,
                    textAlign: 'right',
                  }}
                >
                  {contact.intentScore}/100
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Center Column: Timeline ─────────────────────────── */}
        <div className="profile-col">
          <ActivitySimulator contactId={contact.id} contactName={fullName} />

          <div className="profile-section" style={{ flex: 1 }}>
            <div className="profile-section-header">
              <div className="profile-section-title">Activity Timeline</div>
              <span
                className="badge badge-slate"
                style={{ marginLeft: 'auto' }}
              >
                {contact.timelineEvents.length} events
              </span>
            </div>
            <Timeline events={serializedEvents} />
          </div>

          {/* Notes */}
          {serializedNotes.length > 0 && (
            <div className="profile-section">
              <div className="profile-section-header">
                <FileText size={14} color="var(--text-muted)" />
                <div className="profile-section-title">Notes</div>
                <span className="badge badge-slate" style={{ marginLeft: 'auto' }}>
                  {serializedNotes.length}
                </span>
              </div>
              <div className="timeline">
                {serializedNotes.map((note) => {
                  let actionItems: string[] = []
                  try {
                    actionItems = note.actionItems ? JSON.parse(note.actionItems) : []
                  } catch { /* empty */ }

                  return (
                    <div key={note.id} className="timeline-item" style={{ flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar" style={{ width: 24, height: 24, fontSize: 9 }}>
                            {note.author.name[0]}
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                            {note.author.name}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {new Date(note.createdAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric',
                          })}
                        </span>
                      </div>

                      {note.summary && (
                        <div
                          style={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 8,
                            padding: '8px 12px',
                            fontSize: 12.5,
                            color: 'var(--text-secondary)',
                            lineHeight: 1.55,
                          }}
                        >
                          <span style={{ fontWeight: 600, color: 'var(--accent-400)', fontSize: 10, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                            AI Summary ·{' '}
                          </span>
                          {note.summary}
                        </div>
                      )}

                      {actionItems.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {actionItems.map((item, i) => (
                            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                              <CheckCircle2 size={12} color="var(--accent-400)" style={{ marginTop: 2, flexShrink: 0 }} />
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Column: Deals + Quick Note ───────────────── */}
        <div className="profile-col">
          {/* Deals */}
          <div className="profile-section">
            <div className="profile-section-header">
              <DollarSign size={14} color="var(--text-muted)" />
              <div className="profile-section-title">Deals</div>
              <span className="badge badge-accent" style={{ marginLeft: 'auto' }}>
                {serializedDeals.length}
              </span>
            </div>

            {serializedDeals.length === 0 ? (
              <div
                style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: 13,
                }}
              >
                No deals yet
              </div>
            ) : (
              <div style={{ padding: '8px' }}>
                {serializedDeals.map((deal) => (
                  <div
                    key={deal.id}
                    style={{
                      padding: '12px',
                      background: 'var(--bg-elevated)',
                      borderRadius: 8,
                      marginBottom: 8,
                      border: '1px solid var(--border-subtle)',
                      transition: 'border-color 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, flex: 1, paddingRight: 8 }}>
                        {deal.title}
                      </div>
                      <Link href={`/pipeline`} className="btn btn-ghost btn-sm btn-icon">
                        <ExternalLink size={11} />
                      </Link>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {formatCurrency(deal.value)}
                      </span>
                      <span className={`badge ${stageBadgeClass(deal.stage)}`}>
                        {deal.stage}
                      </span>
                    </div>

                    <div
                      style={{
                        height: 3,
                        background: 'var(--bg-overlay)',
                        borderRadius: 2,
                        overflow: 'hidden',
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${deal.probability}%`,
                          background: 'linear-gradient(90deg, var(--accent-600), var(--accent-400))',
                          borderRadius: 2,
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {deal.probability}% probability
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                        <Calendar size={10} />
                        {new Date(deal.expectedCloseDate).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Smart Note / AI Activity */}
          <div className="profile-section">
            <div className="profile-section-header">
              <FileText size={14} color="var(--text-muted)" />
              <div className="profile-section-title">AI Smart Note</div>
            </div>
            <div className="profile-section-body">
              <SmartNoteInput contactId={contact.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
