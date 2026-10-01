import { prisma } from '@/lib/prisma'
import { generateText } from '@/lib/gemini'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json()

    if (!message || typeof message !== 'string') {
      return Response.json({ error: 'Message is required' }, { status: 400 })
    }

    // Fetch snapshot of CRM data for context
    const [contacts, deals, recentEvents, recentNotes] = await Promise.all([
      prisma.contact.findMany({
        include: { company: true },
        orderBy: { intentScore: 'desc' },
      }),
      prisma.deal.findMany({
        include: {
          contact: { include: { company: true } },
        },
        orderBy: { value: 'desc' },
      }),
      prisma.timelineEvent.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { contact: true },
      }),
      prisma.note.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { contact: true },
      }),
    ])

    const now = Date.now()

    // Format contacts list
    const contactsContext = contacts
      .map((c) => {
        const matchingEvents = recentEvents.filter((e) => e.contactId === c.id)
        const emailOpens = matchingEvents.filter((e) => e.type === 'email_open').length
        return `- ID: ${c.id} | Name: ${c.firstName} ${c.lastName} | Company: ${c.company.name} | Title: ${c.title ?? 'N/A'} | Status: ${c.status} | Intent: ${c.intentScore}/100 | Email: ${c.email} | Recent Email Opens: ${emailOpens}`
      })
      .join('\n')

    // Format deals list
    const dealsContext = deals
      .map((d) => {
        const contactEvents = recentEvents.filter((e) => e.contactId === d.contactId)
        const lastContactDays = contactEvents.length > 0
          ? Math.round((now - contactEvents[0].createdAt.getTime()) / 86400000)
          : 'None recorded'
        return `- ID: ${d.id} | Title: "${d.title}" | Contact: ${d.contact.firstName} ${d.contact.lastName} (Contact ID: ${d.contact.id}) | Company: ${d.contact.company.name} | Stage: ${d.stage} | Value: $${d.value.toLocaleString()} | Probability: ${d.probability}% | Closes: ${d.expectedCloseDate.toISOString().split('T')[0]} | Days Since Last Activity: ${lastContactDays}`
      })
      .join('\n')

    // Format recent timeline events
    const timelineContext = recentEvents
      .slice(0, 15)
      .map((e) => {
        const daysAgo = Math.round((now - e.createdAt.getTime()) / 86400000)
        let meta = ''
        try {
          const parsed = JSON.parse(e.metadata)
          meta = Object.entries(parsed)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ')
        } catch {
          meta = e.metadata
        }
        const contactName = e.contact ? `${e.contact.firstName} ${e.contact.lastName}` : 'General'
        return `- [${daysAgo}d ago] ${e.type} for ${contactName}: ${meta.slice(0, 100)}`
      })
      .join('\n')

    // Format recent notes
    const notesContext = recentNotes
      .map((n) => {
        return `- ${n.contact ? `${n.contact.firstName} ${n.contact.lastName}` : 'Contact'}: ${n.summary ?? n.rawContent.slice(0, 120)}`
      })
      .join('\n')

    const prompt = `You are "Apex Copilot", the AI sales companion built into ApexCRM.
You have direct, real-time access to the user's CRM database.

CURRENT CRM SNAPSHOT:
---------------------
CONTACTS:
${contactsContext}

ACTIVE DEALS:
${dealsContext}

RECENT TIMELINE INTERACTIONS:
${timelineContext}

RECENT NOTES:
${notesContext}
---------------------

USER QUESTION: "${message}"

INSTRUCTIONS:
1. Answer concisely, directly, and authoritatively based ONLY on the data above.
2. Whenever you mention a contact, ALWAYS format it as a markdown link using their ID: [Full Name](/contacts/{contactId}).
3. Whenever you mention a deal, bold the deal title and state its value and stage, e.g. **Enterprise Platform License** ($185,000, Negotiation).
4. When asked about deals not contacted in over X days, check "Days Since Last Activity". If Days >= X or 'None recorded', list them clearly with recommended next steps.
5. When asked about high-intent leads who opened emails, filter contacts by Intent score (>= 70) and email opens (> 1).
6. When summarizing the active pipeline, provide the total value, weighted forecast, breakdown by stage, and highlight top opportunities.
7. Keep tone professional, crisp, and high-velocity. Use bullet points for easy scanning.`

    const reply = await generateText(prompt)

    return Response.json({
      reply,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Copilot error:', error)
    return Response.json(
      { error: error?.message || 'Failed to generate copilot reply' },
      { status: 500 }
    )
  }
}
