/**
 * Email utility using Resend.
 * Server-side only — never import from client components.
 *
 * Set RESEND_API_KEY in .env.local to enable sending.
 * Without the key, emails are logged to the console (dev mode).
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_ADDRESS = process.env.EMAIL_FROM || 'ApexCRM <noreply@apexcrm.app>'

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send an email via Resend.
 * Falls back to console.log if RESEND_API_KEY is not set (dev/test mode).
 */
export async function sendEmail(opts: SendEmailOptions): Promise<EmailResult> {
  const { to, subject, html, replyTo } = opts

  if (!RESEND_API_KEY) {
    // Dev mode — log instead of sending
    console.log('[Email - DEV MODE] Would send:')
    console.log(`  To: ${Array.isArray(to) ? to.join(', ') : to}`)
    console.log(`  Subject: ${subject}`)
    console.log(`  Body length: ${html.length} chars`)
    return { success: true, messageId: `dev-${Date.now()}` }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        reply_to: replyTo,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('[Email] Resend API error:', errorBody)
      return { success: false, error: errorBody }
    }

    const data = await response.json()
    return { success: true, messageId: data.id }
  } catch (err: any) {
    console.error('[Email] Send failed:', err)
    return { success: false, error: err?.message || 'Unknown email error' }
  }
}

// ─── Template Helpers ──────────────────────────────────────────────────────

/**
 * Generate a styled HTML email body using the ApexCRM brand.
 */
function wrapEmailHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
    .card { background: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden; }
    .header { background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%); padding: 28px 32px; }
    .header h1 { margin: 0; color: #fff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
    .header p { margin: 6px 0 0; color: #bfdbfe; font-size: 13px; }
    .body { padding: 28px 32px; color: #cbd5e1; font-size: 14px; line-height: 1.6; }
    .body h2 { color: #f1f5f9; font-size: 16px; margin: 0 0 12px; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; color: #64748b; font-weight: 600; margin-bottom: 4px; }
    .value { color: #e2e8f0; font-size: 14px; margin-bottom: 16px; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; background: #1d4ed8; color: #bfdbfe; }
    .badge.green { background: #14532d; color: #86efac; }
    .badge.amber { background: #78350f; color: #fcd34d; }
    .divider { border: none; border-top: 1px solid #334155; margin: 20px 0; }
    .cta { display: inline-block; margin-top: 8px; padding: 10px 22px; background: #2563eb; color: #fff; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; }
    .footer { padding: 16px 32px; text-align: center; font-size: 11px; color: #475569; border-top: 1px solid #1e293b; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>ApexCRM</h1>
        <p>AI-Native CRM Platform</p>
      </div>
      <div class="body">
        ${body}
      </div>
      <div class="footer">
        ApexCRM - AI-powered sales intelligence
      </div>
    </div>
  </div>
</body>
</html>`
}

// ─── Pre-built Templates ───────────────────────────────────────────────────

/**
 * Send a new inbound lead notification to the CRM admin/team.
 */
export async function sendNewLeadNotification(opts: {
  recipientEmail: string
  leadName: string
  leadEmail: string
  company?: string
  source?: string
  intentScore?: number
  message?: string
  contactId?: string
}): Promise<EmailResult> {
  const {
    recipientEmail,
    leadName,
    leadEmail,
    company,
    source = 'Webhook',
    intentScore,
    message,
    contactId,
  } = opts

  const scoreClass = intentScore !== undefined
    ? (intentScore >= 70 ? 'green' : intentScore >= 40 ? 'amber' : '')
    : ''

  const body = `
    <h2>New Inbound Lead: ${leadName}</h2>
    <hr class="divider" />
    <div class="label">Name</div>
    <div class="value">${leadName}</div>
    <div class="label">Email</div>
    <div class="value">${leadEmail}</div>
    ${company ? `<div class="label">Company</div><div class="value">${company}</div>` : ''}
    <div class="label">Source</div>
    <div class="value"><span class="badge">${source}</span></div>
    ${intentScore !== undefined ? `<div class="label">AI Intent Score</div><div class="value"><span class="badge ${scoreClass}">${intentScore}/100</span></div>` : ''}
    ${message ? `<hr class="divider" /><div class="label">Message</div><div class="value">${message}</div>` : ''}
    <hr class="divider" />
    ${contactId ? `<a class="cta" href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/contacts/${contactId}">View in ApexCRM</a>` : ''}
  `

  return sendEmail({
    to: recipientEmail,
    subject: `New Lead: ${leadName} (${company || leadEmail})`,
    html: wrapEmailHtml(`New Lead: ${leadName}`, body),
  })
}

/**
 * Send an outreach email to a contact on behalf of the CRM user.
 */
export async function sendContactOutreachEmail(opts: {
  contactEmail: string
  contactName: string
  senderName: string
  senderEmail: string
  subject: string
  body: string
}): Promise<EmailResult> {
  const { contactEmail, contactName, senderName, senderEmail, subject, body } = opts

  const html = wrapEmailHtml(
    subject,
    `<h2>${subject}</h2>
    <hr class="divider" />
    <p>Hi ${contactName},</p>
    <p>${body}</p>
    <hr class="divider" />
    <p style="font-size:12px;color:#64748b;">Sent by ${senderName} via ApexCRM</p>`
  )

  return sendEmail({
    to: contactEmail,
    subject,
    html,
    replyTo: senderEmail,
  })
}

/**
 * Send a deal follow-up email.
 */
export async function sendDealFollowUpEmail(opts: {
  contactEmail: string
  contactName: string
  dealTitle: string
  stage: string
  senderName: string
  senderEmail: string
  customMessage?: string
}): Promise<EmailResult> {
  const {
    contactEmail,
    contactName,
    dealTitle,
    stage,
    senderName,
    senderEmail,
    customMessage,
  } = opts

  const body = `
    <h2>Following up on: ${dealTitle}</h2>
    <hr class="divider" />
    <p>Hi ${contactName},</p>
    <p>${customMessage || `I wanted to follow up on our discussion regarding <strong>${dealTitle}</strong>. I would love to schedule some time to continue the conversation.`}</p>
    <div class="label">Current Stage</div>
    <div class="value"><span class="badge">${stage}</span></div>
    <hr class="divider" />
    <p style="font-size:12px;color:#64748b;">Sent by ${senderName} via ApexCRM</p>
  `

  return sendEmail({
    to: contactEmail,
    subject: `Following up: ${dealTitle}`,
    html: wrapEmailHtml(`Deal Follow-up: ${dealTitle}`, body),
    replyTo: senderEmail,
  })
}
