'use client'

import React, { createContext, useContext, useState, useCallback, useId } from 'react'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
  warning: (message: string, duration?: number) => void
  addToast: (options: { title?: string; description?: string; message?: string; type?: ToastType; duration?: number }) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 3500) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      setToasts((prev) => [...prev, { id, message, type, duration }])

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }
    },
    [removeToast]
  )

  const success = useCallback((msg: string, d?: number) => showToast(msg, 'success', d), [showToast])
  const error = useCallback((msg: string, d?: number) => showToast(msg, 'error', d), [showToast])
  const info = useCallback((msg: string, d?: number) => showToast(msg, 'info', d), [showToast])
  const warning = useCallback((msg: string, d?: number) => showToast(msg, 'warning', d), [showToast])

  const addToast = useCallback(
    (options: { title?: string; description?: string; message?: string; type?: ToastType; duration?: number }) => {
      const msg = [options.title, options.description || options.message].filter(Boolean).join(' — ') || 'Notification'
      showToast(msg, options.type || 'info', options.duration)
    },
    [showToast]
  )

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning, addToast }}>
      {children}
      {/* Toast viewport */}
      <div
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'none',
          maxWidth: 400,
          width: 'calc(100vw - 48px)',
        }}
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const config = {
    success: {
      icon: CheckCircle2,
      border: 'var(--green-500)55',
      glow: '0 8px 32px #22c55e26',
      iconColor: 'var(--green-400)',
      badgeBg: 'var(--green-bg)',
    },
    error: {
      icon: AlertCircle,
      border: 'var(--red-500)55',
      glow: '0 8px 32px #ef444426',
      iconColor: 'var(--red-400)',
      badgeBg: 'var(--red-bg)',
    },
    warning: {
      icon: AlertTriangle,
      border: 'var(--amber-500)55',
      glow: '0 8px 32px #f59e0b26',
      iconColor: 'var(--amber-400)',
      badgeBg: 'var(--amber-bg)',
    },
    info: {
      icon: Info,
      border: 'var(--accent-500)55',
      glow: '0 8px 32px var(--accent-glow)',
      iconColor: 'var(--accent-400)',
      badgeBg: 'var(--accent-glow)',
    },
  }[toast.type]

  const Icon = config.icon

  return (
    <div
      style={{
        pointerEvents: 'auto',
        background: 'var(--bg-elevated)',
        border: `1px solid ${config.border}`,
        borderRadius: 12,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: `${config.glow}, 0 4px 16px #00000080`,
        backdropFilter: 'blur(12px)',
        animation: 'slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: config.badgeBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={16} color={config.iconColor} />
      </div>
      <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4 }}>
        {toast.message}
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          padding: 4,
          cursor: 'pointer',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4,
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
      >
        <X size={14} />
      </button>
    </div>
  )
}
