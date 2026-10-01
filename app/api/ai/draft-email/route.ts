import { prisma } from '@/lib/prisma'
import { generateJSON } from '@/lib/gemini'
import { NextRequest } from 'next/server'

type DraftEmailResult = {
  subject: string
  body: string
  tone: string
}

const TONE_GOALS: Record<string, string> = {
  followup:  'Professional follow-up after previous conversation. Reference specific details. Express continued interest and ask for next steps.',
  pricing:   'Empathetically address pricing concerns. Focus on ROI, value delivered, and long-term cost savings. Offer to discuss further.',
  demo:      'Invite the contact to a personalized demo. Highlight 2-3 features most relevant to their industry. Keep it concise and enthusiastic.',
  checkin:   'Friendly, low-pressure check-in. Show genuine interest in their situation. No hard sell. End with an open-ended question.',
}

export async function POST(req: NextRequest) {
  const { contactId, toneKey } = await req.json()

  if (!contactId || !toneKey) {
    return Response.json({ error: 'contactId and toneKey are required' }, { status: 400 })
  }

  const toneInstructions = TONE_GOALS[toneKey as string]
  if (!toneInstructions) {
    return Response.json({ error: `Invalid toneKey. Valid: ${Object.keys(TONE_GOALS).join(', ')}` }, { status: 400 })
  }

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: {
      company: true,
      deals: { orderBy: { expectedCloseDate: 'asc' }, take: 3 },
      notes: {
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { author: true },
      },
      timelineEvents: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  })

  if (!contact) {
    return Response.json({ error: 'Contact not found' }, { status: 404 })
  }

  const notesContext = contact.notes.map((n) => (
    `  [${new Date(n.createdAt).toLocaleDateString()}] ${n.summary ?? n.rawContent.slice(0, 200)}`
  )).join('\n')

  const dealsContext = contact.deals.map((d) => (
    `  "${d.title}": ${d.stage}, $${d.value.toLocaleString()}`
  )).join('\n')

  const timelineContext = contact.timelineEvents.map((ev) => {
    let meta: Record<string, unknown> = {}
    try { meta = JSON.parse(ev.metadata) } catch { /* empty */ }
    const daysAgo = Math.round((Date.now() - ev.createdAt.getTime()) / 86400000)
    return `  - [${daysAgo}d ago] ${ev.type}: ${(meta.subject ?? meta.title ?? meta.outcome ?? '').toString().slice(0, 80)}`
  }).join('\n')

  const prompt = `You are a professional sales email writer for a B2B SaaS company called "ApexCRM". Write a personalized outreach email.

RECIPIENT:
  Name: ${contact.firstName} ${contact.lastName}
  Title: ${contact.title ?? 'Unknown'}
  Company: ${contact.company.name} (${contact.company.industry}, ${contact.company.size})
  Email: ${contact.email}

DEALS IN PROGRESS:
${dealsContext || '  (none)'}

RECENT NOTES / CONTEXT:
${notesContext || '  (none)'}

RECENT ACTIVITY:
${timelineContext || '  (none)'}

EMAIL GOAL: ${toneInstructions}

Write a professional, personalized B2B email. Requirements:
- Use the contact's first name in the salutation
- Reference specific, real details from notes/deals where relevant
- Keep the body to 3-4 short paragraphs
- End with a clear, single call-to-action
- Sign from "Sarah Chen, ApexCRM"
- Do NOT use generic filler phrases like "I hope this email finds you well"

Return ONLY raw JSON (no markdown):
{
  "subject": "Email subject line",
  "body": "Full email body with \\n for newlines",
  "tone": "${toneKey}"
}`

  const result = await generateJSON<DraftEmailResult>(prompt)

  return Response.json(result)
}
