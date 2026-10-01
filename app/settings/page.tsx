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

export default function SettingsPage() {
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'system'>('profile')

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
  const [currency, setCurrency] = useState('USD')
  const [defaultStage, setDefaultStage] = useState('discovery')
  const [timezone, setTimezone] = useState('America/New_York')
  const [highIntentThreshold, setHighIntentThreshold] = useState(75)

  // System Status State
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [testingHealth, setTestingHealth] = useState(false)

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

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', paddingBottom: 60 }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Workspace Settings</h1>
          <p className="page-subtitle">
            Manage your personal profile, CRM pipeline rules, and inspect system telemetry.
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
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
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
          Profile & Security
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
          className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
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
          className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`}
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
          System & API Status
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
      </div>

      {/* Tab 1: Profile & Security */}
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
                    Full Display Name
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

              {/* Security / Password Change */}
              <div style={{ paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Key size={15} className="text-indigo-400" />
                  Security & Password Update
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 16 }}>
                  Leave password fields blank if you only wish to update your name or email.
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
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Tab 2: CRM Preferences */}
      {activeTab === 'preferences' && (
        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handleSavePreferences} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'white', marginBottom: 4 }}>
                Pipeline & Display Localization
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                Configure currency display, initial opportunity staging, and active timezone.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Currency */}
              <div>
                <label className="form-label" style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Default Workspace Currency
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
                    <option value="USD">USD ($) — United States Dollar</option>
                    <option value="EUR">EUR (€) — Euro</option>
                    <option value="GBP">GBP (£) — British Pound</option>
                    <option value="AUD">AUD ($) — Australian Dollar</option>
                    <option value="CAD">CAD ($) — Canadian Dollar</option>
                    <option value="SGD">SGD ($) — Singapore Dollar</option>
                  </select>
                </div>
              </div>

              {/* Default Pipeline Stage */}
              <div>
                <label className="form-label" style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Default New Deal Stage
                </label>
                <div style={{ position: 'relative' }}>
                  <Layers size={15} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
                  <select
                    value={defaultStage}
                    onChange={(e) => setDefaultStage(e.target.value)}
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
                    <option value="discovery">Discovery (20% Win Probability)</option>
                    <option value="qualification">Qualification (40% Win Probability)</option>
                    <option value="proposal">Proposal Sent (60% Win Probability)</option>
                    <option value="negotiation">Negotiation (80% Win Probability)</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Timezone */}
              <div>
                <label className="form-label" style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  System Timezone
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
                    <option value="America/New_York">Eastern Time (US & Canada) (UTC-5)</option>
                    <option value="America/Chicago">Central Time (US & Canada) (UTC-6)</option>
                    <option value="America/Los_Angeles">Pacific Time (US & Canada) (UTC-8)</option>
                    <option value="Europe/London">London / GMT (UTC+0)</option>
                    <option value="Europe/Paris">Paris / Berlin (UTC+1)</option>
                    <option value="Asia/Tokyo">Tokyo / Japan (UTC+9)</option>
                    <option value="Australia/Sydney">Sydney / Melbourne (UTC+10)</option>
                  </select>
                </div>
              </div>

              {/* High Intent Score Threshold */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label className="form-label" style={{ fontSize: 13, fontWeight: 500 }}>
                    High-Intent Lead Highlight Threshold
                  </label>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#34d399' }}>{highIntentThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={highIntentThreshold}
                  onChange={(e) => setHighIntentThreshold(parseInt(e.target.value, 10))}
                  style={{ width: '100%', accentColor: 'var(--accent-500)', height: 6, marginTop: 8 }}
                />
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
                  Contacts with intent score &ge; {highIntentThreshold} will display with priority status badges.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10 }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', fontSize: 13.5 }}
              >
                <Save size={15} />
                Save CRM Preferences
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: System & API Status */}
      {activeTab === 'system' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Action Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'white' }}>Live Cloud Integrations</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                Real-time operational health checks for Supabase PostgreSQL and Google Gemini AI.
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
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cloud Database Engine</div>
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
                  <span>Latency:</span>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>
                    {systemStatus?.database.latencyMs !== undefined ? `${systemStatus.database.latencyMs} ms` : 'Testing...'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Host:</span>
                  <span style={{ color: 'white', fontFamily: 'monospace', fontSize: 11.5 }}>
                    {systemStatus?.database.poolerHost || 'aws-0-ap-southeast-2.pooler.supabase.com'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Connection Mode:</span>
                  <span style={{ color: 'white' }}>Transaction Pooler (PgBouncer :6543)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Direct Port:</span>
                  <span style={{ color: 'white' }}>Port 5432 (Migrations/DDL)</span>
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
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cognitive Automation Layer</div>
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
                  {systemStatus?.ai.status === 'active' ? 'Operational' : 'Unavailable'}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Primary Model:</span>
                  <span style={{ color: 'var(--accent-300)', fontWeight: 600, fontFamily: 'monospace' }}>
                    {systemStatus?.ai.primaryModel || 'gemini-3.5-flash'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>SDK Integration:</span>
                  <span style={{ color: 'white', fontFamily: 'monospace' }}>@google/genai (v1.0.0)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Active Capabilities:</span>
                  <span style={{ color: 'white' }}>Notes, Next-Action, Email, Copilot</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>JSON Mode:</span>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>Enabled (Structured Schema)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Runtime Architecture Card */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'white', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Cpu size={16} className="text-indigo-400" />
              Runtime Stack & Build Architecture
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <div style={{ padding: 12, background: 'var(--bg-overlay)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Framework</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'white', marginTop: 2 }}>Next.js 16.3.7</div>
              </div>
              <div style={{ padding: 12, background: 'var(--bg-overlay)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>React Engine</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'white', marginTop: 2 }}>React 19.2.8</div>
              </div>
              <div style={{ padding: 12, background: 'var(--bg-overlay)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ORM Client</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'white', marginTop: 2 }}>Prisma 6.19.3</div>
              </div>
              <div style={{ padding: 12, background: 'var(--bg-overlay)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Bundler</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'white', marginTop: 2 }}>Turbopack</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
