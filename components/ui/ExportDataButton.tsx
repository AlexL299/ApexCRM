'use client'

import React, { useState } from 'react'
import { Download, FileSpreadsheet, Cloud, Loader2, Check, ChevronDown, ExternalLink } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

export function ExportDataButton({
  label = 'Export Data',
  className = 'btn btn-secondary btn-sm',
}: {
  label?: string
  className?: string
}) {
  const { success, error } = useToast()
  const [loading, setLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showSheetsModal, setShowSheetsModal] = useState(false)
  const [sheetsData, setSheetsData] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const downloadCSV = async () => {
    setShowMenu(false)
    setLoading(true)
    try {
      const res = await fetch('/api/export/csv')
      if (!res.ok) throw new Error('Export failed')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ApexCRM-Export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      success('Data exported to CSV successfully')
    } catch (e) {
      console.error(e)
      error('Failed to export data')
    } finally {
      setLoading(false)
    }
  }

  const viewSheetsFormat = async () => {
    setShowMenu(false)
    setLoading(true)
    try {
      const res = await fetch('/api/export/sheets')
      if (!res.ok) throw new Error('Failed to fetch Sheets format')
      const data = await res.json()
      setSheetsData(JSON.stringify(data, null, 2))
      setShowSheetsModal(true)
      success('Google Sheets API payload generated')
    } catch (e) {
      console.error(e)
      error('Failed to generate Sheets payload')
    } finally {
      setLoading(false)
    }
  }

  const copySheetsPayload = () => {
    if (!sheetsData) return
    navigator.clipboard.writeText(sheetsData)
    setCopied(true)
    success('Google Sheets API payload copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button
          id="export-data-btn"
          className={className}
          onClick={downloadCSV}
          disabled={loading}
          style={{ gap: 6 }}
        >
          {loading ? (
            <Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite' }} />
          ) : (
            <Download size={13} />
          )}
          {label}
        </button>
        <button
          id="export-options-toggle"
          className="btn btn-secondary btn-sm"
          onClick={() => setShowMenu((prev) => !prev)}
          style={{
            paddingLeft: 6,
            paddingRight: 6,
            marginLeft: 2,
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
          }}
          aria-label="Export options"
        >
          <ChevronDown size={12} />
        </button>
      </div>

      {/* Dropdown Menu */}
      {showMenu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            onClick={() => setShowMenu(false)}
          />
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 6px)',
              zIndex: 50,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 10,
              padding: 6,
              minWidth: 220,
              boxShadow: '0 12px 32px #00000080',
              animation: 'fade-in 0.15s ease',
            }}
          >
            <button
              onClick={downloadCSV}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                background: 'none',
                border: 'none',
                borderRadius: 6,
                color: 'var(--text-primary)',
                fontSize: 12.5,
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-overlay)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <FileSpreadsheet size={14} color="var(--green-400)" />
              <div>
                <div>Download CSV</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Excel & Google Sheets compatible</div>
              </div>
            </button>

            <button
              onClick={viewSheetsFormat}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                background: 'none',
                border: 'none',
                borderRadius: 6,
                color: 'var(--text-primary)',
                fontSize: 12.5,
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-overlay)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <Cloud size={14} color="var(--accent-400)" />
              <div>
                <div>Google Sheets API Format</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Cloud sync ValueRange payload</div>
              </div>
            </button>
          </div>
        </>
      )}

      {/* Google Sheets API Payload Modal */}
      {showSheetsModal && sheetsData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: '#000000bb',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSheetsModal(false)
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 16,
              width: '100%',
              maxWidth: 720,
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 80px #00000099',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'var(--green-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileSpreadsheet size={16} color="var(--green-400)" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Google Sheets API v4 Export
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                  Standard ValueRange object ready for batchUpdate or values.update
                </div>
              </div>
            </div>

            {/* Code preview */}
            <div style={{ flex: 1, overflow: 'auto', padding: 16, background: 'var(--bg-base)' }}>
              <pre
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontFamily: 'ui-monospace, monospace',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {sheetsData}
              </pre>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <button
                className="btn btn-primary btn-sm"
                onClick={copySheetsPayload}
                style={{ gap: 6 }}
              >
                {copied ? <Check size={13} /> : <Cloud size={13} />}
                {copied ? 'Copied Payload!' : 'Copy ValueRange JSON'}
              </button>
              <a
                href="/api/export/sheets"
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ gap: 6 }}
              >
                <ExternalLink size={13} />
                Open Raw Endpoint
              </a>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowSheetsModal(false)}
                style={{ marginLeft: 'auto' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
