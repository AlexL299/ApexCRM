'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Kanban,
  Users,
  Activity,
  Settings,
  Zap,
  BarChart3,
  LogOut,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',          label: 'Pipeline',    icon: Kanban,     badge: null },
  { href: '/contacts',  label: 'Contacts',    icon: Users,      badge: '8' },
  { href: '/activities',label: 'Activities',  icon: Activity,   badge: null },
  { href: '/analytics', label: 'Analytics',   icon: BarChart3,  badge: null },
]

const SETTINGS_ITEMS = [
  { href: '/settings',  label: 'Settings',    icon: Settings,   badge: null },
]

interface AuthUser {
  id: string
  name: string
  email: string
  role: string
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user)
      })
      .catch(() => {})
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch {
      setLoggingOut(false)
    }
  }

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname.startsWith('/pipeline')
    }
    if (href === '/analytics') {
      return pathname.startsWith('/analytics') || pathname.startsWith('/dashboard')
    }
    return pathname.startsWith(href)
  }

  const getInitials = (name?: string) => {
    if (!name) return 'U'
    const parts = name.split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">A</div>
        <span className="sidebar-logo-text">ApexCRM</span>
        <span className="sidebar-logo-badge">AI</span>
      </div>

      {/* Main nav */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Workspace</div>

        {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => (
          <Link
            key={href}
            href={href}
            className={`nav-link ${isActive(href) ? 'active' : ''}`}
          >
            <Icon className="nav-link-icon" strokeWidth={1.75} />
            {label}
            {badge && <span className="nav-badge">{badge}</span>}
          </Link>
        ))}

        <div className="nav-section-label" style={{ marginTop: 16 }}>System</div>

        {SETTINGS_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`nav-link ${isActive(href) ? 'active' : ''}`}
          >
            <Icon className="nav-link-icon" strokeWidth={1.75} />
            {label}
          </Link>
        ))}

        {/* AI badge */}
        <div
          style={{
            marginTop: 'auto',
            marginLeft: 4,
            marginRight: 4,
            marginBottom: 4,
            padding: '10px 12px',
            background: 'var(--accent-glow)',
            border: '1px solid var(--accent-500)44',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Zap size={14} color="var(--accent-400)" />
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--accent-300)' }}>
              AI Insights Active
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>
              Gemini 3.5 Flash
            </div>
          </div>
        </div>
      </nav>

      {/* Footer user */}
      <div className="sidebar-footer">
        <div className="sidebar-user" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div className="avatar">{getInitials(user?.name)}</div>
            <div className="sidebar-user-info" style={{ minWidth: 0 }}>
              <div className="sidebar-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'Sarah Chen'}
              </div>
              <div className="sidebar-user-role" style={{ textTransform: 'capitalize' }}>
                {user?.role || 'Admin'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Sign out"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
