import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { TrendingUp, Building2, Mail, Phone, ChevronRight } from 'lucide-react'
import { ExportDataButton } from '@/components/ui/ExportDataButton'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contacts — ApexCRM',
  description: 'Browse and manage your contact directory.',
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

function intentColor(score: number) {
  if (score >= 75) return 'var(--green-400)'
  if (score >= 50) return 'var(--amber-400)'
  return 'var(--slate-500)'
}

function intentBgClass(score: number) {
  if (score >= 75) return 'badge-green'
  if (score >= 50) return 'badge-amber'
  return 'badge-slate'
}

export default async function ContactsPage() {
  const contacts = await prisma.contact.findMany({
    include: {
      company: true,
      deals: true,
    },
    orderBy: { intentScore: 'desc' },
  })

  const avgIntent = contacts.length
    ? Math.round(contacts.reduce((s, c) => s + c.intentScore, 0) / contacts.length)
    : 0

  const activeCount = contacts.filter((c) => c.status === 'active').length

  return (
    <div>
      <div className="page-header">
        <div style={{ flex: 1 }}>
          <h1 className="page-title">Contacts</h1>
          <p className="page-subtitle">Your complete contact directory</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ExportDataButton />
          <Link href="/contacts/new" className="btn btn-primary btn-sm">
            + New Contact
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Contacts</div>
          <div className="stat-value">{contacts.length}</div>
          <div className="stat-sub">{activeCount} active</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Intent Score</div>
          <div className="stat-value" style={{ color: intentColor(avgIntent) }}>{avgIntent}</div>
          <div className="stat-sub">across all contacts</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Companies</div>
          <div className="stat-value">
            {new Set(contacts.map((c) => c.companyId)).size}
          </div>
          <div className="stat-sub">unique accounts</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Open Deals</div>
          <div className="stat-value">
            {contacts.reduce((s, c) => s + c.deals.filter(d => !['closed-won','closed-lost'].includes(d.stage)).length, 0)}
          </div>
          <div className="stat-sub">in pipeline</div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <table className="contacts-table">
          <thead>
            <tr>
              <th>Contact</th>
              <th>Company</th>
              <th>Title</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Intent</th>
              <th style={{ textAlign: 'center' }}>Deals</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => {
              const initials = `${contact.firstName[0]}${contact.lastName[0]}`
              const openDeals = contact.deals.filter(
                (d) => !['closed-won', 'closed-lost'].includes(d.stage)
              ).length
              return (
                <tr key={contact.id}>
                  <td>
                    <Link
                      href={`/contacts/${contact.id}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          className="avatar"
                          style={{ fontSize: 11, flexShrink: 0 }}
                        >
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                            {contact.firstName} {contact.lastName}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Mail size={10} />
                            {contact.email}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Building2 size={13} color="var(--text-muted)" />
                      <span>{contact.company.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {contact.title ?? '—'}
                  </td>
                  <td>
                    <span className={`badge ${statusBadgeClass(contact.status)}`}>
                      {contact.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${intentBgClass(contact.intentScore)}`}>
                      <TrendingUp size={10} />
                      {contact.intentScore}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', color: openDeals > 0 ? 'var(--accent-300)' : 'var(--text-muted)', fontWeight: 600, fontSize: 13 }}>
                    {openDeals > 0 ? openDeals : '—'}
                  </td>
                  <td>
                    <Link href={`/contacts/${contact.id}`} className="btn btn-ghost btn-sm btn-icon">
                      <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
