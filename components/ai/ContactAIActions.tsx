'use client'

import { useState } from 'react'
import { Mail, Sparkles } from 'lucide-react'
import { EmailDraftModal } from '@/components/ai/EmailDraftModal'
import { NextBestAction } from '@/components/ai/NextBestAction'

/**
 * Full-width top banner displaying the AI Next-Best-Action recommendation card.
 * Clicking the action button automatically opens the AI Email Drafter.
 */
export function ContactAIBanner({
  contactId,
  contactName,
}: {
  contactId: string
  contactName: string
}) {
  const [showEmailModal, setShowEmailModal] = useState(false)

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <NextBestAction
          contactId={contactId}
          onActionClick={() => setShowEmailModal(true)}
        />
      </div>

      {showEmailModal && (
        <EmailDraftModal
          contactId={contactId}
          contactName={contactName}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </>
  )
}

/**
 * Left-column action button to draft email with AI.
 */
export function ContactAIActions({
  contactId,
  contactName,
}: {
  contactId: string
  contactName: string
}) {
  const [showEmailModal, setShowEmailModal] = useState(false)

  return (
    <>
      <div style={{ padding: '0 16px 12px' }}>
        <button
          id={`draft-email-btn-${contactId}`}
          className="btn btn-secondary btn-sm"
          onClick={() => setShowEmailModal(true)}
          style={{
            width: '100%',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--accent-glow), #8b5cf61a)',
            borderColor: 'var(--accent-500)55',
            color: 'var(--accent-300)',
            fontWeight: 600,
          }}
        >
          <Sparkles size={13} color="var(--accent-400)" />
          Draft Email with AI
        </button>
      </div>

      {showEmailModal && (
        <EmailDraftModal
          contactId={contactId}
          contactName={contactName}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </>
  )
}
