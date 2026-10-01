'use client'

import Link from 'next/link'
import { Search, Plus, UserPlus, Bell, Command } from 'lucide-react'

export function Topbar() {
  return (
    <div className="topbar">
      {/* Search */}
      <div className="search-bar">
        <Search className="search-bar-icon" strokeWidth={1.75} />
        <input
          type="text"
          placeholder="Search contacts, deals, companies…"
          id="global-search"
        />
        <div
          style={{
            position: 'absolute',
            right: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: 'var(--bg-overlay)',
            border: '1px solid var(--border-default)',
            borderRadius: 4,
            padding: '1px 5px',
            fontSize: 10,
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        >
          <Command size={9} />K
        </div>
      </div>

      {/* Actions */}
      <div className="topbar-actions">
        <button
          id="topbar-notifications"
          className="btn btn-ghost btn-icon"
          aria-label="Notifications"
        >
          <Bell size={16} strokeWidth={1.75} />
        </button>

        <Link href="/contacts/new" id="new-lead-btn" className="btn btn-secondary btn-sm">
          <UserPlus size={13} strokeWidth={2} />
          New Lead
        </Link>

        <Link href="/deals/new" id="new-deal-btn" className="btn btn-primary btn-sm">
          <Plus size={13} strokeWidth={2.5} />
          New Deal
        </Link>
      </div>
    </div>
  )
}
