import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params
    const { action } = await req.json()

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: { deals: { orderBy: { value: 'desc' }, take: 1 } },
    })

    if (!contact) {
      return Response.json({ error: 'Contact not found' }, { status: 404 })
    }

    const primaryDealId = contact.deals[0]?.id ?? null
    let updatedIntentScore = contact.intentScore
    let eventType = ''
    let eventMetadata: Record<string, any> = {}
    let feedbackMessage = ''

    if (action === 'email_open') {
      updatedIntentScore = Math.min(100, contact.intentScore + 5)
      eventType = 'email_open'
      eventMetadata = {
        subject: 'Follow-up: Enterprise Architecture & SLA Review',
        device: 'Apple Mail / macOS Sonoma',
        openCount: 2,
        action: 'Opened contract attachment',
        simulated: true,
      }
      feedbackMessage = `Simulated Email Open (+5 Intent Score → ${updatedIntentScore})`
    } else if (action === 'proposal_click') {
      updatedIntentScore = Math.min(100, contact.intentScore + 15)
      eventType = 'link_clicked'
      eventMetadata = {
        url: 'https://docs.apexcrm.io/proposals/enterprise-msla.pdf',
        asset: 'Enterprise MSLA & Security Addendum',
        dwellTimeSeconds: 180,
        pagesViewed: 8,
        simulated: true,
      }
      feedbackMessage = `Simulated Proposal Link Click (+15 Intent Score → ${updatedIntentScore})`
    } else if (action === 'incoming_sms') {
      updatedIntentScore = Math.min(100, contact.intentScore + 10)
      eventType = 'sms_received'
      const sampleTexts = [
        "Hey! We reviewed the pricing proposal with our VP of Ops. Can you hop on a quick 10-min call tomorrow at 2 PM to clarify the SSO integration?",
        "Hi Sarah, just got approval from procurement for the Q1 timeline. Please send over the revised agreement!",
        "Quick question regarding the security rider — do you support SOC2 Type II automated audit logs?",
      ]
      const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)]
      eventMetadata = {
        from: contact.phone ?? '+1 (555) 892-4410',
        text: randomText,
        simulated: true,
      }
      feedbackMessage = `Simulated Incoming SMS (+10 Intent Score → ${updatedIntentScore})`
    } else {
      return Response.json({ error: `Invalid action: ${action}` }, { status: 400 })
    }

    // Update contact intent score
    const updatedContact = await prisma.contact.update({
      where: { id },
      data: { intentScore: updatedIntentScore },
    })

    // Log timeline event
    const event = await prisma.timelineEvent.create({
      data: {
        contactId: id,
        dealId: primaryDealId,
        type: eventType,
        metadata: JSON.stringify(eventMetadata),
      },
    })

    return Response.json({
      success: true,
      contact: updatedContact,
      event,
      message: feedbackMessage,
    })
  } catch (error: any) {
    console.error('Simulation error:', error)
    return Response.json({ error: error?.message || 'Simulation failed' }, { status: 500 })
  }
}
