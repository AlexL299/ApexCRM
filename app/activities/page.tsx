import type { Metadata } from 'next'
import { Activity, Calendar, Mail, Phone } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Activities — ApexCRM',
  description: 'View all recent activities, calls, emails, and meetings.',
}

export default function ActivitiesPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Activities</h1>
          <p className="page-subtitle">All recent interactions across your pipeline</p>
        </div>
      </div>
      <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
        <Activity size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Activity Feed</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Coming soon — unified feed of emails, calls, meetings, and notes.
        </div>
      </div>
    </div>
  )
}
