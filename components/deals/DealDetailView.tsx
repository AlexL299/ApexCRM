'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Briefcase,
  DollarSign,
  Calendar,
  Building2,
  Mail,
  Phone,
  User,
  TrendingUp,
  ArrowLeft,
  Sparkles,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Loader2,
  ArrowRight,
  PhoneCall,
  CalendarDays,
  FileText,
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

export const STAGES = [
  { key: 'discovery', label: 'Discovery', prob: 20 },
  { key: 'qualification', label: 'Qualification', prob: 40 },
  { key: 'proposal', label: 'Proposal Sent', prob: 60 },
  { key: 'negotiation', label: 'Negotiation', prob: 80 },
  { key: 'closed-won', label: 'Closed Won', prob: 100 },
  { key: 'closed-lost', label: 'Closed Lost', prob: 0 },
]

interface TimelineEventItem {
  id: string
  type: string
  metadata: string
  createdAt: string
}

interface DealDetailProps {
  deal: {
    id: string
    title: string
    value: number
    stage: string
    probability: number
    expectedCloseDate: string
    contactId: string
    contact: {
      id: string
      firstName: string
      lastName: string
      email: string
      phone?: string | null
      title?: string | null
      status: string
      intentScore: number
      company: {
        id: string
        name: string
        industry: string
        size: string
      }
    }
    timelineEvents: TimelineEventItem[]
  }
}

interface AIInsight {
  winProbability: number
  probabilityAssessment: string
  nextBestAction: {
    title: string
    rationale: string
    urgency: 'high' | 'medium' | 'low'
  }
  riskFactors: string[]
  dealStrengths: string[]
  recommendedStage: string
}

export function DealDetailView({ deal: initialDeal }: DealDetailProps) {
  const router = useRouter()
  const { addToast } = useToast()

  const [deal, setDeal] = useState(initialDeal)
  const [stage, setStage] = useState(initialDeal.stage)
  const [updatingStage, setUpdatingStage] = useState(false)

  // Note form state
  const [noteContent, setNoteContent] = useState('')
  const [noteType, setNoteType] = useState<'note' | 'call' | 'meeting'>('note')
  const [savingNote, setSavingNote] = useState(false)
  const [events, setEvents] = useState<TimelineEventItem[]>(initialDeal.timelineEvents || [])

  // AI Insights state
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null)
  const [loadingAI, setLoadingAI] = useState(false)

  const handleStageChange = async (newStage: string) => {
    setStage(newStage)
    setUpdatingStage(true)
    const stageObj = STAGES.find((s) => s.key === newStage)
    const newProb = stageObj?.prob ?? deal.probability

    try {
      const res = await fetch(`/api/deals/${deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage, probability: newProb }),
      })

      if (!res.ok) throw new Error('Failed to update stage')
      const updated = await res.json()
      setDeal((prev) => ({ ...prev, stage: newStage, probability: newProb }))

      addToast({
        title: 'Stage Updated',
        description: `Deal moved to ${newStage.replace('-', ' ')}.`,
        type: 'success',
      })
    } catch (err: any) {
      setStage(deal.stage)
      addToast({
        title: 'Update Failed',
        description: err?.message || 'Could not update deal stage',
        type: 'error',
      })
    } finally {
      setUpdatingStage(false)
    }
  }

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteContent.trim()) return

    setSavingNote(true)
    try {
      const res = await fetch(`/api/deals/${deal.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: noteContent.trim(),
          type: noteType,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save note')

      if (data.event) {
        setEvents((prev) => [data.event, ...prev])
      }

      setNoteContent('')
      addToast({
        title: 'Activity Logged',
        description: 'Note was attached to the deal and contact timeline.',
        type: 'success',
      })
    } catch (err: any) {
      addToast({
        title: 'Failed to Save',
        description: err?.message || 'Error recording activity',
        type: 'error',
      })
    } finally {
      setSavingNote(false)
    }
  }

  const handleGenerateAIInsights = async () => {
    setLoadingAI(true)
    try {
      const res = await fetch(`/api/deals/${deal.id}/ai-insights`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate insights')

      setAiInsight(data.insight)
      addToast({
        title: 'AI Insights Ready',
        description: 'Gemini calculated win probability and risk factors.',
        type: 'success',
      })
    } catch (err: any) {
      addToast({
        title: 'AI Analysis Failed',
        description: err?.message || 'Could not generate deal insights',
        type: 'error',
      })
    } finally {
      setLoadingAI(false)
    }
  }

  const parseEventMetadata = (metadata: string) => {
    try {
      return JSON.parse(metadata)
    } catch {
      return { note: metadata }
    }
  }

  const formattedCloseDate = new Date(deal.expectedCloseDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 60 }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Link
          href="/pipeline"
          className="btn btn-ghost btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={16} />
          Back to Pipeline
        </Link>
      </div>

      {/* Main Deal Header Card */}
      <div className="card" style={{ padding: 28, marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background: 'var(--accent-glow)',
                  color: 'var(--accent-300)',
                }}
              >
                Deal #{deal.id.slice(-6)}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {deal.contact.company.name}
              </span>
            </div>
            <h1 className="page-title" style={{ fontSize: 24, marginBottom: 8 }}>
              {deal.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13, color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Calendar size={14} color="var(--text-muted)" /> Target Close: {formattedCloseDate}
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <User size={14} color="var(--text-muted)" /> Rep: {deal.contact.firstName} {deal.contact.lastName}
              </span>
            </div>
          </div>

          {/* Value & Stage Control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Face Value</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'white' }}>
                ${deal.value.toLocaleString()}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--accent-300)' }}>
                Weighted: ${Math.round(deal.value * (deal.probability / 100)).toLocaleString()} ({deal.probability}%)
              </div>
            </div>

            <div style={{ borderLeft: '1px solid var(--border-default)', paddingLeft: 16 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Stage
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={stage}
                  disabled={updatingStage}
                  onChange={(e) => handleStageChange(e.target.value)}
                  style={{
                    background: 'var(--bg-overlay)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 8,
                    padding: '8px 14px',
                    color: 'white',
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {STAGES.map((s) => (
                    <option key={s.key} value={s.key} style={{ background: '#111827', color: 'white' }}>
                      {s.label} ({s.prob}%)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left Column: Timeline, Notes & Associated Contact */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Associated Entities */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'white', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={16} className="text-indigo-400" />
              Associated Account & Stakeholder
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Primary Contact */}
              <div style={{ padding: 14, background: 'var(--bg-overlay)', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Primary Contact</span>
                  <span
                    style={{
                      padding: '1px 6px',
                      borderRadius: 10,
                      fontSize: 10.5,
                      fontWeight: 700,
                      background: deal.contact.intentScore >= 75 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: deal.contact.intentScore >= 75 ? '#34d399' : '#fbbf24',
                    }}
                  >
                    Intent {deal.contact.intentScore}
                  </span>
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: 'white', marginBottom: 2 }}>
                  <Link
                    href={`/contacts/${deal.contact.id}`}
                    style={{ color: 'white', textDecoration: 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-300)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'white')}
                  >
                    {deal.contact.firstName} {deal.contact.lastName} ↗
                  </Link>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                  {deal.contact.title || 'Decision Maker'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Mail size={12} color="var(--text-muted)" /> {deal.contact.email}
                  </span>
                  {deal.contact.phone && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={12} color="var(--text-muted)" /> {deal.contact.phone}
                    </span>
                  )}
                </div>
              </div>

              {/* Company Details */}
              <div style={{ padding: 14, background: 'var(--bg-overlay)', borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Company Account
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: 'white', marginBottom: 2 }}>
                  {deal.contact.company.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                  {deal.contact.company.industry} • {deal.contact.company.size}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Active Deals: {deal.contact.company.name} Pipeline Member
                </div>
              </div>
            </div>
          </div>

          {/* Activity / Notes Log Form */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'white', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={16} className="text-indigo-400" />
              Log Deal Activity & Notes
            </div>

            <form onSubmit={handleSaveNote} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setNoteType('note')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 12,
                    cursor: 'pointer',
                    background: noteType === 'note' ? 'var(--accent-500)' : 'var(--bg-overlay)',
                    color: noteType === 'note' ? 'white' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <FileText size={12} /> Note
                </button>
                <button
                  type="button"
                  onClick={() => setNoteType('call')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 12,
                    cursor: 'pointer',
                    background: noteType === 'call' ? 'var(--accent-500)' : 'var(--bg-overlay)',
                    color: noteType === 'call' ? 'white' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <PhoneCall size={12} /> Call Summary
                </button>
                <button
                  type="button"
                  onClick={() => setNoteType('meeting')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 12,
                    cursor: 'pointer',
                    background: noteType === 'meeting' ? 'var(--accent-500)' : 'var(--bg-overlay)',
                    color: noteType === 'meeting' ? 'white' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <CalendarDays size={12} /> Meeting Note
                </button>
              </div>

              <textarea
                rows={3}
                required
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Log discussion points, redlines, or next steps for this deal..."
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 8,
                  padding: 12,
                  color: 'white',
                  fontSize: 13,
                  resize: 'vertical',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={savingNote || !noteContent.trim()}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {savingNote ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Send size={13} /> Save to Timeline
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Deal Timeline Stream */}
            <div style={{ marginTop: 20, borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Deal Timeline ({events.length} events)
              </div>

              {events.length === 0 ? (
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                  No activities recorded yet for this deal.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {events.map((ev) => {
                    const meta = parseEventMetadata(ev.metadata)
                    const dateStr = new Date(ev.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })

                    return (
                      <div
                        key={ev.id}
                        style={{
                          padding: 12,
                          background: 'var(--bg-overlay)',
                          borderRadius: 8,
                          borderLeft: '3px solid var(--accent-500)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'white', textTransform: 'capitalize' }}>
                            {ev.type.replace(/_/g, ' ')}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{dateStr}</span>
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          {meta.note || meta.snippet || meta.subject || `Stage updated: ${meta.from || 'new'} ➔ ${meta.to}`}
                        </div>
                        {meta.rep && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                            Logged by {meta.rep}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Insights Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 22, background: 'rgba(99, 102, 241, 0.04)', borderColor: 'rgba(99, 102, 241, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} color="var(--accent-400)" />
                <span style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>Gemini AI Deal Intelligence</span>
              </div>
            </div>

            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.4 }}>
              Evaluate probability scores, identify critical deal stall risks, and receive cognitive next-best-actions.
            </p>

            <button
              onClick={handleGenerateAIInsights}
              disabled={loadingAI}
              className="btn btn-primary"
              style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 8, fontSize: 13, marginBottom: 16 }}
            >
              {loadingAI ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Analyzing Deal Telemetry...
                </>
              ) : (
                <>
                  <Sparkles size={15} /> {aiInsight ? 'Refresh AI Insights' : 'Generate AI Insights'}
                </>
              )}
            </button>

            {/* AI Insights Display */}
            {aiInsight && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Win Probability Assessment */}
                <div style={{ padding: 14, background: 'var(--bg-overlay)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Predicted Win Probability
                    </span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#34d399' }}>
                      {aiInsight.winProbability}%
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {aiInsight.probabilityAssessment}
                  </div>
                </div>

                {/* Recommended Next Best Action */}
                {aiInsight.nextBestAction && (
                  <div
                    style={{
                      padding: 14,
                      background: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: 10,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-300)', textTransform: 'uppercase' }}>
                        Next Best Action
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '1px 6px',
                          borderRadius: 8,
                          background: aiInsight.nextBestAction.urgency === 'high' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                          color: aiInsight.nextBestAction.urgency === 'high' ? '#f87171' : 'var(--accent-300)',
                        }}
                      >
                        {aiInsight.nextBestAction.urgency} urgency
                      </span>
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'white', marginBottom: 4 }}>
                      {aiInsight.nextBestAction.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {aiInsight.nextBestAction.rationale}
                    </div>
                  </div>
                )}

                {/* Risk Factors */}
                {aiInsight.riskFactors && aiInsight.riskFactors.length > 0 && (
                  <div style={{ padding: 14, background: 'var(--bg-overlay)', borderRadius: 10 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <AlertTriangle size={13} /> Identified Risk Factors
                    </div>
                    <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {aiInsight.riskFactors.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Deal Strengths */}
                {aiInsight.dealStrengths && aiInsight.dealStrengths.length > 0 && (
                  <div style={{ padding: 14, background: 'var(--bg-overlay)', borderRadius: 10 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: '#34d399', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <CheckCircle2 size={13} /> Positive Signals & Momentum
                    </div>
                    <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {aiInsight.dealStrengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
