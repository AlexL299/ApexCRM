import type { Metadata } from 'next'
import { Settings } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Settings — ApexCRM',
}

export default function SettingsPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure your workspace and integrations</p>
        </div>
      </div>
      <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
        <Settings size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Workspace Settings</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Coming soon — team members, integrations, AI configuration, and billing.
        </div>
      </div>
    </div>
  )
}
