'use client'

import React, { useState, useEffect } from 'react'
import {
  User,
  Shield,
  Key,
  Globe,
  DollarSign,
  Layers,
  Database,
  Cpu,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  Save,
  Server,
  Sparkles,
  Download,
  FileSpreadsheet,
  FileCode2,
  Lock,
  Workflow,
  Check,
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface SystemStatus {
  database: {
    provider: string
    poolerHost: string
    poolerPort: number
    directPort: number
    status: string
    latencyMs: number
    error?: string | null
  }
  ai: {
    provider: string
    sdk: string
    status: string
    maskedKey?: string
    primaryModel: string
    fallbackModels: string[]
    features: string[]
  }
  runtime: {
    framework: string
    react: string
    orm: string
    environment: string
  }
}

const DEFAULT_STAGES = [
  { key: 'discovery', label: 'Lead In / Discovery', prob: 20, color: '#64748b', desc: 'Initial inbound inquiry or prospect research' },
  { key: 'contact_made', label: 'Contact Made', prob: 30, color: '#38bdf8', desc: 'First meeting or discovery call completed' },
  { key: 'qualification', label: 'Needs Defined / Qualification', prob: 45, color: '#3b82f6', desc: 'Budget, authority, and requirements validated' },
  { key: 'proposal', label: 'Proposal Sent', prob: 60, color: '#a855f7', desc: 'Formal quote or platform scope delivered' },
  { key: 'negotiation', label: 'In Negotiation', prob: 80, color: '#f59e0b', desc: 'Contract redlines, security review, and SLA alignment' },
  { key: 'closed_won', label: 'Won / Signed', prob: 100, color: '#10b981', desc: 'Contract executed and onboarding initialized' },
  { key: 'closed_lost', label: 'Lost / Closed', prob: 0, color: '#ef4444', desc: 'Deals disqualified or deferred to future quarters' },
]

export default function SettingsPage() {
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'system' | 'data'>('profile')

  // Profile Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('rep')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)

  // Preferences Form State
  const [currency, setCurrency] = useState('AUD')
  const [defaultStage, setDefaultStage] = useState('discovery')
  const [timezone, setTimezone] = useState('Australia/Sydney')
  const [highIntentThreshold, setHighIntentThreshold] = useState(75)

  // System Status State
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [testingHealth, setTestingHealth] = useState(false)

  // Data Export state
  const [exportingJson, setExportingJson] = useState(false)

  useEffect(() => {
    // Load profile
    fetch('/api/settings/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setName(data.user.name || '')
          setEmail(data.user.email || '')
          setRole(data.user.role || 'rep')
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false))

    // Load saved preferences from localStorage
    try {
      const savedPrefs = localStorage.getItem('apex_crm_preferences')
      if (savedPrefs) {
        const p = JSON.parse(savedPrefs)
        if (p.currency) setCurrency(p.currency)
        if (p.defaultStage) setDefaultStage(p.defaultStage)
        if (p.timezone) setTimezone(p.timezone)
        if (p.highIntentThreshold) setHighIntentThreshold(p.highIntentThreshold)
      }
    } catch {}

    // Check system status
    fetchStatus()
  }, [])

  const fetchStatus = () => {
    setTestingHealth(true)
    fetch('/api/settings/system-status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setSystemStatus(data)
      })
      .catch(() => {})
      .finally(() => setTestingHealth(false))
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword && newPassword !== confirmPassword) {
      addToast({
        title: 'Passwords Do Not Match',
        description: 'New password and confirmation must match exactly.',
        type: 'error',
      })
      return
    }

    setSavingProfile(true)
    try {
      const payload: any = { name, email }
      if (newPassword) {
        payload.currentPassword = currentPassword
        payload.newPassword = newPassword
      }

      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      addToast({
        title: 'Profile Updated',
        description: 'Your user profile and credentials have been updated.',
        type: 'success',
      })

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      addToast({
        title: 'Update Failed',
        description: err?.message || 'Could not save profile changes',
        type: 'error',
      })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault()
    const prefs = { currency, defaultStage, timezone, highIntentThreshold }
    localStorage.setItem('apex_crm_preferences', JSON.stringify(prefs))
    addToast({
      title: 'Preferences Saved',
      description: `Default currency set to ${currency}, timezone: ${timezone}.`,
      type: 'success',
    })
  }

  const handleExportJson = async () => {
    setExportingJson(true)
    try {
      const res = await fetch('/api/export/crm-json')
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `apexcrm-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)

      addToast({
        title: 'JSON Export Complete',
        description: 'Full database snapshot downloaded to your device.',
        type: 'success',
      })
    } catch (err: any) {
      addToast({
        title: 'Export Error',
        description: err?.message || 'Failed to export JSON backup',
        type: 'error',
      })
    } finally {
      setExportingJson(false)
    }
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', paddingBottom: 60 }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Workspace Settings</h1>
          <p className="page-subtitle">
            Manage your personal profile, CRM pipeline rules, cloud integrations, and data backups.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          borderBottom: '1px solid var(--border-default)',
          marginBottom: 28,
        }}
      >
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '10px 16px',
            fontSize: 13.5,
            fontWeight: 500,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderBottom: activeTab === 'profile' ? '2px solid var(--accent-500)' : '2px solid transparent',
            color: activeTab === 'profile' ? 'white' : 'var(--text-muted)',
            transition: 'all 0.15s ease',
          }}
        >
          <User size={15} />
          User Profile
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
          style={{
            padding: '10px 16px',
            fontSize: 13.5,
            fontWeight: 500,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderBottom: activeTab === 'preferences' ? '2px solid var(--accent-500)' : '2px solid transparent',
            color: activeTab === 'preferences' ? 'white' : 'var(--text-muted)',
            transition: 'all 0.15s ease',
          }}
        >
          <Globe size={15} />
          CRM Preferences
        </button>

        <button
          onClick={() => setActiveTab('system')}
          style={{
            padding: '10px 16px',
            fontSize: 13.5,
            fontWeight: 500,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderBottom: activeTab === 'system' ? '2px solid var(--accent-500)' : '2px solid transparent',
            color: activeTab === 'system' ? 'white' : 'var(--text-muted)',
            transition: 'all 0.15s ease',
          }}
        >
          <Server size={15} />
          System & Integrations
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: systemStatus?.database.status === 'connected' ? '#10b981' : '#f59e0b',
              display: 'inline-block',
            }}
          />
        </button>

        <button
          onClick={() => setActiveTab('data')}
          style={{
            padding: '10px 16px',
            fontSize: 13.5,
            fontWeight: 500,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderBottom: activeTab === 'data' ? '2px solid var(--accent-500)' : '2px solid transparent',
            color: activeTab === 'data' ? 'white' : 'var(--text-muted)',
            transition: 'all 0.15s ease',
          }}
        >
          <Download size={15} />
          Data Management
        </button>
      </div>

      {/* Tab 1: User Profile */}
      {activeTab === 'profile' && (
        <div className="card" style={{ padding: 28 }}>
          {loadingProfile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', padding: 20 }}>
              <Loader2 size={16} className="animate-spin" />
              Loading profile details...
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Profile Card Summary */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, paddingBottom: 20, borderBottom: '1px solid var(--border-subtle)' }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent-600), #7c3aed)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    fontWeight: 700,
                    color: 'white',
                  }}
                >
                  {name ? name.slice(0, 2).toUpperCase() : 'SC'}
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 600, color: 'white' }}>{name || 'Apex User'}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                    <span>{email}</span>
                    <span
                      style={{
                        padding: '2px 8px',
                        background: 'var(--accent-glow)',
                        color: 'var(--accent-300)',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    >
                      {role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Name & Email Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 8,
                      padding: '9px 12px',
                      color: 'white',
                      fontSize: 14,
                    }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 8,
                      padding: '9px 12px',
                      color: 'white',
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>

              {/* Change Password Form */}
              <div style={{ paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Key size={15} className="text-indigo-400" />
                  Change Password
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 16 }}>
                  Update your authentication credentials. Minimum 6 characters.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: 12.5, fontWeight: 500, marginBottom: 6 }}>
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 8,
                        padding: '8px 12px',
                        color: 'white',
                        fontSize: 13.5,
                      }}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: 12.5, fontWeight: 500, marginBottom: 6 }}>
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      style={{
                        width: '100%',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 8,
                        padding: '8px 12px',
                        color: 'white',
                        fontSize: 13.5,
                      }}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: 12.5, fontWeight: 500, marginBottom: 6 }}>
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      style={{
                        width: '100%',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 8,
                        padding: '8px 12px',
                        color: 'white',
                        fontSize: 13.5,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10 }}>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', fontSize: 13.5 }}
                >
                  {savingProfile ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Saving Profile...
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      Save Profile Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Tab 2: CRM Preferences & Deal Stage Manager */}
      {activeTab === 'preferences' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Preferences Form */}
          <div className="card" style={{ padding: 28 }}>
            <form onSubmit={handleSavePreferences} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'white', marginBottom: 4 }}>
                  Currency & Timezone Localization
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                  Configure active currency, initial opportunity staging, and active timezone.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Currency */}
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                    Workspace Currency
                  </label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={15} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 8,
                        padding: '9px 12px 9px 32px',
                        color: 'white',
                        fontSize: 14,
                      }}
                    >
                      <option value="AUD">AUD (A$) — Australian Dollar</option>
                      <option value="USD">USD ($) — United States Dollar</option>
                      <option value="EUR">EUR (€) — Euro</option>
                      <option value="GBP">GBP (£) — British Pound</option>
                      <option value="CAD">CAD ($) — Canadian Dollar</option>
                      <option value="SGD">SGD ($) — Singapore Dollar</option>
                    </select>
                  </div>
                </div>

                {/* Timezone */}
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                    Timezone
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Globe size={15} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 8,
                        padding: '9px 12px 9px 32px',
                        color: 'white',
                        fontSize: 14,
                      }}
                    >
                      <option value="Australia/Sydney">Australia/Sydney (AEST / AEDT, UTC+10/11)</option>
                      <option value="Australia/Melbourne">Australia/Melbourne (AEST, UTC+10)</option>
                      <option value="Australia/Perth">Australia/Perth (AWST, UTC+8)</option>
                      <option value="UTC">UTC (Universal Coordinated Time)</option>
                      <option value="America/New_York">America/New_York (Eastern Time, UTC-5)</option>
                      <option value="America/Chicago">America/Chicago (Central Time, UTC-6)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (Pacific Time, UTC-8)</option>
                      <option value="Europe/London">Europe/London (GMT / BST, UTC+0/1)</option>
                      <option value="Europe/Paris">Europe/Paris (CET, UTC+1)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST, UTC+9)</option>
                      <option value="Asia/Singapore">Asia/Singapore (SGT, UTC+8)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 6 }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', fontSize: 13.5 }}
                >
                  <Save size={15} />
                  Save Preferences
                </button>
              </div>
            </form>
          </div>

          {/* Deal Stage Manager */}
          <div className="card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Workflow size={16} className="text-indigo-400" />
                  Deal Stage Manager
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
                  Default sales pipeline stage progression, probability weighting, and criteria.
                </p>
              </div>
              <span
                style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  background: 'var(--accent-glow)',
                  color: 'var(--accent-300)',
                }}
              >
                7 Configured Stages
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DEFAULT_STAGES.map((stg, idx) => (
                <div
                  key={stg.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'var(--bg-overlay)',
                    borderRadius: 8,
                    borderLeft: `4px solid ${stg.color}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', width: 18 }}>
                      0{idx + 1}
                    </span>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'white' }}>{stg.label}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{stg.desc}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Win Probability</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: stg.prob >= 80 ? '#34d399' : stg.prob === 0 ? '#f87171' : 'white' }}>
                        {stg.prob}%
                      </div>
                    </div>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: stg.color,
                        boxShadow: `0 0 8px ${stg.color}aa`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: System & Integrations Status */}
      {activeTab === 'system' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Action Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'white' }}>Cloud Integrations & Service Health</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                Live operational health checks for Supabase Cloud PostgreSQL and Google Gemini AI.
              </div>
            </div>
            <button
              onClick={fetchStatus}
              disabled={testingHealth}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={13} className={testingHealth ? 'animate-spin' : ''} />
              Ping & Test Connection
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Supabase PostgreSQL Card */}
            <div className="card" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Database size={20} color="#10b981" />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'white' }}>Supabase PostgreSQL</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cloud Relational Database</div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 9px',
                    borderRadius: 12,
                    fontSize: 11.5,
                    fontWeight: 600,
                    background: systemStatus?.database.status === 'connected' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: systemStatus?.database.status === 'connected' ? '#34d399' : '#f87171',
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: systemStatus?.database.status === 'connected' ? '#10b981' : '#ef4444',
                    }}
                  />
                  {systemStatus?.database.status === 'connected' ? 'Connected' : 'Offline'}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Round-Trip Latency:</span>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>
                    {systemStatus?.database.latencyMs !== undefined ? `${systemStatus.database.latencyMs} ms` : 'Testing...'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Pooler Endpoint:</span>
                  <span style={{ color: 'white', fontFamily: 'monospace', fontSize: 11.5 }}>
                    {systemStatus?.database.poolerHost || 'aws-0-ap-southeast-2.pooler.supabase.com'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Connection Mode:</span>
                  <span style={{ color: 'white' }}>PgBouncer Transaction Pooler (:6543)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Direct Port:</span>
                  <span style={{ color: 'white' }}>Port 5432 (Migrations & Schema Push)</span>
                </div>
              </div>
            </div>

            {/* Google Gemini AI Card */}
            <div className="card" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Sparkles size={20} color="var(--accent-400)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'white' }}>Google Gemini AI</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cognitive Intelligence Engine</div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 9px',
                    borderRadius: 12,
                    fontSize: 11.5,
                    fontWeight: 600,
                    background: systemStatus?.ai.status === 'active' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: systemStatus?.ai.status === 'active' ? 'var(--accent-300)' : '#f87171',
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: systemStatus?.ai.status === 'active' ? 'var(--accent-400)' : '#ef4444',
                    }}
                  />
                  {systemStatus?.ai.status === 'active' ? 'Active' : 'Unavailable'}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>API Key:</span>
                  <span style={{ color: 'var(--accent-300)', fontFamily: 'monospace', fontSize: 11.5 }}>
                    {systemStatus?.ai.maskedKey || 'AQ.Ab8R••••••••••••••Fl0Fg1XmOg'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Primary Model:</span>
                  <span style={{ color: 'white', fontFamily: 'monospace' }}>
                    {systemStatus?.ai.primaryModel || 'gemini-3.5-flash'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>SDK Integration:</span>
                  <span style={{ color: 'white', fontFamily: 'monospace' }}>@google/genai (v1.0.0)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Active Pipelines:</span>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>Smart Notes, Deal Insights, Copilot</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Data Management & Backups */}
      {activeTab === 'data' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 28 }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'white', marginBottom: 4 }}>
                CRM Data Export & Disaster Recovery
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                Download real-time snapshots of contacts, companies, active pipeline deals, and timeline event logs.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              {/* CSV Export Option */}
              <div style={{ padding: 18, background: 'var(--bg-overlay)', borderRadius: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#34d399', marginBottom: 6 }}>
                    <FileSpreadsheet size={18} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>Contacts & Deals (CSV)</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 16 }}>
                    Formatted tabular export optimized for Excel, Google Sheets, or importing into external analytics platforms.
                  </p>
                </div>
                <a
                  href="/api/export/csv"
                  download
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}
                >
                  <Download size={13} /> Download CSV Export
                </a>
              </div>

              {/* JSON Backup Option */}
              <div style={{ padding: 18, background: 'var(--bg-overlay)', borderRadius: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-400)', marginBottom: 6 }}>
                    <FileCode2 size={18} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>Full CRM Backup (JSON)</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 16 }}>
                    Complete database relational snapshot including Users, Companies, Contacts, Deals, Notes, and Timelines.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportJson}
                  disabled={exportingJson}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  {exportingJson ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Generating Snapshot...
                    </>
                  ) : (
                    <>
                      <Download size={13} /> Export Full CRM Data (JSON)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Account & Storage Preferences */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 18 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'white', marginBottom: 4 }}>
                Client-Side Storage & Cache Preferences
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                ApexCRM caches active filter selections, recent copilot queries, and display preferences locally.
              </p>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('apex_crm_preferences')
                  addToast({
                    title: 'Local Cache Cleared',
                    description: 'Local workspace preferences have been reset to factory defaults.',
                    type: 'info',
                  })
                }}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 12, color: 'var(--text-muted)', border: '1px solid var(--border-default)' }}
              >
                Reset Local Storage Cache
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
