'use client'

import React, { useState, useRef } from 'react'
import {
  UploadCloud,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertCircle,
  Download,
  Loader2,
  Table,
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface ParsedContact {
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  title: string
  status: string
}

interface ImportContactsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ImportContactsModal({ isOpen, onClose, onSuccess }: ImportContactsModalProps) {
  const { addToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload')
  const [csvText, setCsvText] = useState('')
  const [parsedRows, setParsedRows] = useState<ParsedContact[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [resultSummary, setResultSummary] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null)

  if (!isOpen) return null

  // Simple CSV parser
  const parseCSV = (content: string) => {
    const lines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)

    if (lines.length < 2) {
      setParsedRows([])
      return
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/["']/g, ''))
    const rows: ParsedContact[] = []

    for (let i = 1; i < lines.length; i++) {
      // Split by comma ignoring commas inside quotes
      const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((v) => v.trim().replace(/^["']|["']$/g, ''))
      if (values.length === 0 || !values.some((v) => v.length > 0)) continue

      const rowMap: Record<string, string> = {}
      headers.forEach((h, idx) => {
        rowMap[h] = values[idx] || ''
      })

      // Extract properties
      let firstName = rowMap['first name'] || rowMap['firstname'] || ''
      let lastName = rowMap['last name'] || rowMap['lastname'] || ''
      const fullName = rowMap['name'] || rowMap['full name'] || ''

      if (!firstName && !lastName && fullName) {
        const parts = fullName.split(' ')
        firstName = parts[0] || 'Unknown'
        lastName = parts.slice(1).join(' ') || 'Contact'
      }

      const email = rowMap['email'] || rowMap['email address'] || ''
      const phone = rowMap['phone'] || rowMap['telephone'] || rowMap['mobile'] || ''
      const company = rowMap['company'] || rowMap['company name'] || rowMap['organization'] || 'General'
      const title = rowMap['title'] || rowMap['job title'] || rowMap['role'] || 'Lead'
      const status = rowMap['status'] || rowMap['lead status'] || 'prospect'

      if (email && email.includes('@')) {
        rows.push({
          firstName: firstName || 'New',
          lastName: lastName || 'Contact',
          email,
          phone,
          company,
          title,
          status,
        })
      }
    }

    setParsedRows(rows)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setResultSummary(null)
    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = String(evt.target?.result || '')
      parseCSV(text)
    }
    reader.readAsText(file)
  }

  const handlePasteChange = (text: string) => {
    setCsvText(text)
    setResultSummary(null)
    parseCSV(text)
  }

  const handleDownloadSample = () => {
    const sample = `Name,Email,Phone,Company,Title,Status\nJordan Vance,jordan.vance@solaris.ai,+1-555-0144,Solaris AI,VP of Engineering,active\nElena Rostova,elena.rostova@quantumcloud.co,+1-555-0188,Quantum Cloud,CEO,prospect\nLiam O'Connor,liam.oconnor@apexventures.io,+1-555-0192,Apex Ventures,Partner,active`
    const blob = new Blob([sample], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_contacts_import.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return

    setImporting(true)
    setResultSummary(null)

    try {
      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: parsedRows }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to import contacts')
      }

      setResultSummary({
        imported: data.importedCount,
        skipped: data.skippedCount,
        errors: data.errors || [],
      })

      addToast({
        title: 'Contacts Imported',
        description: `Successfully added ${data.importedCount} new contacts.`,
        type: 'success',
      })

      onSuccess()
    } catch (err: any) {
      addToast({
        title: 'Import Failed',
        description: err?.message || 'Error occurred while saving contacts',
        type: 'error',
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 720,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 24,
          background: '#111827',
          border: '1px solid var(--border-default)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: 'rgba(99, 102, 241, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-400)',
              }}
            >
              <UploadCloud size={20} />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'white' }}>Import Contacts from CSV</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                Batch-import leads into Supabase PostgreSQL with auto-company mapping
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab selection */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 6, background: 'var(--bg-overlay)', padding: 3, borderRadius: 6 }}>
            <button
              onClick={() => setActiveTab('upload')}
              style={{
                padding: '4px 12px',
                fontSize: 12,
                borderRadius: 4,
                border: 'none',
                background: activeTab === 'upload' ? 'var(--accent-500)' : 'transparent',
                color: activeTab === 'upload' ? 'white' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              Upload File (.csv)
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              style={{
                padding: '4px 12px',
                fontSize: 12,
                borderRadius: 4,
                border: 'none',
                background: activeTab === 'paste' ? 'var(--accent-500)' : 'transparent',
                color: activeTab === 'paste' ? 'white' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              Paste CSV Text
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownloadSample}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 12,
              color: 'var(--accent-400)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Download size={13} /> Download Sample Template
          </button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 20 }}>
          {activeTab === 'upload' ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--border-default)',
                borderRadius: 12,
                padding: '36px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.01)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-500)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <FileSpreadsheet size={32} color="var(--accent-400)" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>
                {fileName ? fileName : 'Click or drag & drop a .csv file'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Supported headers: Name, Email, Phone, Company, Title, Status
              </div>
            </div>
          ) : (
            <div>
              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => handlePasteChange(e.target.value)}
                placeholder="Name,Email,Phone,Company,Title,Status&#10;Alice Johnson,alice@matrix.io,+1-555-0100,Matrix Corp,Director of IT,active"
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 8,
                  padding: 12,
                  color: 'white',
                  fontFamily: 'monospace',
                  fontSize: 12.5,
                  resize: 'vertical',
                }}
              />
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedRows.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'white' }}>
                  Preview: {parsedRows.length} valid contacts detected
                </span>
                <span style={{ fontSize: 11.5, color: '#34d399' }}>✓ Headers mapped successfully</span>
              </div>
              <div
                style={{
                  maxHeight: 180,
                  overflowY: 'auto',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  background: 'var(--bg-overlay)',
                }}
              >
                <table style={{ width: '100%', fontSize: 12, textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '6px 10px' }}>Name</th>
                      <th style={{ padding: '6px 10px' }}>Email</th>
                      <th style={{ padding: '6px 10px' }}>Company</th>
                      <th style={{ padding: '6px 10px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 10).map((r, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                        <td style={{ padding: '6px 10px', color: 'white' }}>
                          {r.firstName} {r.lastName}
                        </td>
                        <td style={{ padding: '6px 10px', color: 'var(--text-secondary)' }}>{r.email}</td>
                        <td style={{ padding: '6px 10px', color: 'var(--text-muted)' }}>{r.company}</td>
                        <td style={{ padding: '6px 10px', textTransform: 'capitalize', color: 'var(--accent-300)' }}>
                          {r.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Result Summary */}
          {resultSummary && (
            <div
              style={{
                marginTop: 16,
                padding: 14,
                borderRadius: 8,
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontSize: 12.5,
              }}
            >
              <div style={{ color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} /> Import Complete!
              </div>
              <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
                Added {resultSummary.imported} contacts. ({resultSummary.skipped} skipped or already existing).
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} className="btn btn-secondary btn-sm" disabled={importing}>
            Cancel
          </button>
          <button
            onClick={handleExecuteImport}
            disabled={importing || parsedRows.length === 0}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {importing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <UploadCloud size={14} />
                Import {parsedRows.length} Contacts
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
