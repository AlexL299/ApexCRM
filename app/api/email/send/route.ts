import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { sendContactOutreachEmail } from '@/lib/email'

/**
 * POST /api/email/send
 * Authenticated. Sends an outreach email to a contact and logs a timeline event.
 *
 * Body: { contactId, subject, body }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { contactId, subject, body: emailBody } = body

    if (!contactId || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'contactId, subject, and body are required' },
        { status: 400 }
      )
    }

    // Fetch contact
    const contact = await prisma.contact.findUnique({
      where: { id: String(contactId) },
      include: { company: true },
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // Send email
    const result = await sendContactOutreachEmail({
      contactEmail: contact.email,
      contactName: `${contact.firstName} ${contact.lastName}`,
      senderName: session.name,
      senderEmail: session.email,
      subject: String(subject).trim(),
      body: String(emailBody).trim(),
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      )
    }

    // Log timeline event
    await prisma.timelineEvent.create({
      data: {
        contactId: contact.id,
        type: 'email_sent',
        metadata: JSON.stringify({
          subject: String(subject).trim(),
          preview: String(emailBody).trim().slice(0, 200),
          sentBy: session.name,
          messageId: result.messageId,
        }),
      },
    })

    return NextResponse.json({ success: true, messageId: result.messageId })
  } catch (error: any) {
    console.error('[Email Send] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}
