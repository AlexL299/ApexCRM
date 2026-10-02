'use client'

import { useState } from 'react'
import { Mail, Sparkles, Send } from 'lucide-react'
import { EmailDraftModal } from '@/components/ai/EmailDraftModal'
import { NextBestAction } from '@/components/ai/NextBestAction'
import { SendEmailModal } from '@/components/email/SendEmailModal'

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
 * Left-column action buttons: AI email drafter + direct send email.
 */
export function ContactAIActions({
  contactId,
  contactName,
  contactEmail,
}: {
  contactId: string
  contactName: string
  contactEmail?: string
}) {
  const [showAIModal, setShowAIModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)

  return (
    <>
      <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          id={`draft-email-btn-${contactId}`}
          className="btn btn-secondary btn-sm"
          onClick={() => setShowAIModal(true)}
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

        {contactEmail && (
          <button
            id={`send-email-btn-${contactId}`}
            className="btn btn-ghost btn-sm"
            onClick={() => setShowSendModal(true)}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <Send size={13} />
            Send Email
          </button>
        )}
      </div>

      {showAIModal && (
        <EmailDraftModal
          contactId={contactId}
          contactName={contactName}
          onClose={() => setShowAIModal(false)}
        />
      )}

      {showSendModal && contactEmail && (
        <SendEmailModal
          contactId={contactId}
          contactName={contactName}
          contactEmail={contactEmail}
          onClose={() => setShowSendModal(false)}
        />
      )}
    </>
  )
}

