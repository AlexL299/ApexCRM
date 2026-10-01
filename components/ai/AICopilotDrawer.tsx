'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Loader2,
  ChevronDown,
  RotateCcw,
  Zap,
  TrendingUp,
  Clock,
  Briefcase,
  Layers,
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

const PROMPT_CHIPS = [
  {
    icon: Clock,
    label: "Deals not contacted in >7 days",
    prompt: "Which deals haven't been contacted in over 7 days?",
  },
  {
    icon: TrendingUp,
    label: "High-intent leads with email opens",
    prompt: "Show me high-intent leads who opened an email more than twice.",
  },
  {
    icon: Layers,
    label: "Pipeline & forecast summary",
    prompt: "Summarize my active pipeline and forecast for this month.",
  },
  {
    icon: Zap,
    label: "Top contacts needing urgent outreach",
    prompt: "Who are the top contacts needing urgent follow-up today?",
  },
]

export function AICopilotDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "👋 Hi! I'm **Apex Copilot**, your AI sales companion. I have full context on your contacts, deals, pipeline value, and recent activities. Ask me anything or select a prompt below!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [input, setInput] = useState('')
  const [isPending, setIsPending] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  const sendMessage = async (textToSend?: string) => {
    const query = (textToSend ?? input).trim()
    if (!query || isPending) return

    const userMsg: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsPending(true)

    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      })

      if (!res.ok) throw new Error('Failed to generate response')
      const data = await res.json()

      const assistantMsg: Message = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          role: 'assistant',
          content: '⚠️ Sorry, I encountered an error analyzing your CRM data. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setIsPending(false)
    }
  }

  const resetChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: "Chat cleared. What can I help you analyze in your pipeline today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
  }

  // Parse simple markdown with links [Text](/path) and **bold**
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n')
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, lineHeight: 1.55 }}>
        {lines.map((line, lineIdx) => {
          if (!line.trim()) return <div key={lineIdx} style={{ height: 4 }} />

          const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ')
          const cleanLine = isBullet ? line.trim().replace(/^[\*\-]\s+/, '') : line

          // Regex to parse [label](url) and **bold**
          const parts: React.ReactNode[] = []
          let cursor = 0
          const pattern = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g
          let match: RegExpExecArray | null

          while ((match = pattern.exec(cleanLine)) !== null) {
            if (match.index > cursor) {
              parts.push(cleanLine.slice(cursor, match.index))
            }

            if (match[1] && match[2]) {
              // Markdown link [Text](/url)
              parts.push(
                <Link
                  key={`link-${lineIdx}-${cursor}`}
                  href={match[2]}
                  onClick={() => setIsOpen(false)}
                  style={{
                    color: 'var(--accent-300)',
                    fontWeight: 600,
                    textDecoration: 'underline',
                    textUnderlineOffset: 3,
                  }}
                >
                  {match[1]}
                </Link>
              )
            } else if (match[3]) {
              // Bold text **Text**
              parts.push(
                <strong key={`bold-${lineIdx}-${cursor}`} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {match[3]}
                </strong>
              )
            }
            cursor = pattern.lastIndex
          }

          if (cursor < cleanLine.length) {
            parts.push(cleanLine.slice(cursor))
          }

          return (
            <div
              key={lineIdx}
              style={{
                display: isBullet ? 'flex' : 'block',
                gap: isBullet ? 6 : 0,
                alignItems: 'flex-start',
                paddingLeft: line.startsWith('    *') || line.startsWith('    -') ? 14 : 0,
              }}
            >
              {isBullet && (
                <span style={{ color: 'var(--accent-400)', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>•</span>
              )}
              <div style={{ flex: 1 }}>{parts}</div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <>
      {/* Floating Trigger Button (when drawer is closed) */}
      {!isOpen && (
        <button
          id="open-copilot-btn"
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 90,
            background: 'linear-gradient(135deg, var(--accent-600), #8b5cf6)',
            color: 'white',
            border: '1px solid var(--accent-400)66',
            borderRadius: 9999,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            cursor: 'pointer',
            boxShadow: '0 8px 30px var(--accent-glow), 0 4px 12px #00000060',
            fontWeight: 600,
            fontSize: 13.5,
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            backdropFilter: 'blur(8px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
            e.currentTarget.style.boxShadow = '0 12px 36px var(--accent-glow), 0 6px 16px #00000080'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = '0 8px 30px var(--accent-glow), 0 4px 12px #00000060'
          }}
          aria-label="Open AI Copilot"
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: '#ffffff22',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={13} color="white" />
          </div>
          <span>AI Copilot</span>
          <span
            style={{
              fontSize: 9.5,
              background: '#ffffff26',
              padding: '1px 6px',
              borderRadius: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
            }}
          >
            Live
          </span>
        </button>
      )}

      {/* Slide-in Sidecar Chat Drawer */}
      {isOpen && (
        <div
          id="copilot-drawer"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 440,
            maxWidth: 'calc(100vw - 32px)',
            height: 620,
            maxHeight: 'calc(100vh - 48px)',
            zIndex: 100,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 18,
            boxShadow: '0 24px 80px #00000099, 0 0 24px var(--accent-glow)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Drawer Header */}
          <div
            style={{
              padding: '14px 18px',
              background: 'linear-gradient(180deg, var(--bg-elevated) 0%, var(--bg-surface) 100%)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: 'linear-gradient(135deg, var(--accent-600), #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px var(--accent-glow)',
              }}
            >
              <Bot size={16} color="white" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Apex Copilot
                </span>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--green-400)',
                    boxShadow: '0 0 6px var(--green-400)',
                  }}
                />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Gemini 3.5 Flash · CRM Database Connected
              </div>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              <button
                className="btn btn-ghost btn-icon btn-sm"
                onClick={resetChat}
                title="Reset conversation"
              >
                <RotateCcw size={13} />
              </button>
              <button
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setIsOpen(false)}
                title="Minimize Copilot"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Quick Prompt Chips */}
          <div
            style={{
              padding: '10px 14px',
              background: 'var(--bg-base)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              flexShrink: 0,
            }}
          >
            {PROMPT_CHIPS.map((chip, idx) => {
              const Icon = chip.icon
              return (
                <button
                  key={idx}
                  onClick={() => sendMessage(chip.prompt)}
                  disabled={isPending}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 20,
                    padding: '5px 10px',
                    color: 'var(--text-secondary)',
                    fontSize: 11.5,
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    cursor: isPending ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-500)55'
                    e.currentTarget.style.color = 'var(--accent-300)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }}
                >
                  <Icon size={11} color="var(--accent-400)" />
                  <span>{chip.label}</span>
                </button>
              )
            })}
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  gap: 10,
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    background:
                      msg.role === 'user'
                        ? 'var(--accent-600)'
                        : 'linear-gradient(135deg, var(--accent-600), #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {msg.role === 'user' ? <User size={13} color="white" /> : <Bot size={13} color="white" />}
                </div>

                {/* Content Bubble */}
                <div
                  style={{
                    maxWidth: '82%',
                    background: msg.role === 'user' ? 'var(--accent-600)' : 'var(--bg-elevated)',
                    border: `1px solid ${
                      msg.role === 'user' ? 'var(--accent-500)' : 'var(--border-subtle)'
                    }`,
                    borderRadius: 14,
                    borderTopRightRadius: msg.role === 'user' ? 4 : 14,
                    borderTopLeftRadius: msg.role === 'assistant' ? 4 : 14,
                    padding: '10px 14px',
                    color: msg.role === 'user' ? '#ffffff' : 'var(--text-secondary)',
                    boxShadow: '0 4px 12px #00000030',
                  }}
                >
                  {msg.role === 'user' ? (
                    <div style={{ fontSize: 13, lineHeight: 1.45 }}>{msg.content}</div>
                  ) : (
                    renderFormattedContent(msg.content)
                  )}
                  <div
                    style={{
                      fontSize: 10,
                      color: msg.role === 'user' ? '#ffffff88' : 'var(--text-muted)',
                      marginTop: 4,
                      textAlign: 'right',
                    }}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {isPending && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--text-muted)' }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    background: 'var(--accent-glow)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Bot size={13} color="var(--accent-400)" />
                </div>
                <div
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 12,
                    padding: '8px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12.5,
                  }}
                >
                  <Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite' }} />
                  Analyzing CRM database with Gemini…
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Drawer Input */}
          <div
            style={{
              padding: 12,
              background: 'var(--bg-elevated)',
              borderTop: '1px solid var(--border-subtle)',
              flexShrink: 0,
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault()
                sendMessage()
              }}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <input
                id="copilot-input"
                type="text"
                placeholder="Ask Copilot about deals, contacts, pipeline…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isPending}
                style={{
                  flex: 1,
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 10,
                  padding: '9px 12px',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <button
                id="copilot-send-btn"
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={!input.trim() || isPending}
                style={{
                  height: 36,
                  padding: '0 12px',
                  borderRadius: 10,
                }}
              >
                <Send size={13} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
