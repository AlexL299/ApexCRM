import { prisma } from '@/lib/prisma'
import { generateJSON } from '@/lib/gemini'
import { NextRequest } from 'next/server'

type NextActionResult = {
  recommendation: string
  urgency: 'HIGH' | 'MEDIUM' | 'LOW'
  suggestedAction: string
  reasoning: string
}

export async function POST(req: NextRequest) {
  const { contactId } = await req.json()

  if (!contactId) {
    return Response.json({ error: 'contactId is required' }, { status: 400 })
  }

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: {
      company: true,
      deals: { orderBy: { expectedCloseDate: 'asc' }, take: 5 },
      timelineEvents: { orderBy: { createdAt: 'desc' }, take: 5 },
      notes: { orderBy: { createdAt: 'desc' }, take: 2 },
    },
  })

  if (!contact) {
    return Response.json({ error: 'Contact not found' }, { status: 404 })
  }

  // Format timeline for AI context
  const timelineContext = contact.timelineEvents.map((ev) => {
    let meta: Record<string, unknown> = {}
    try { meta = JSON.parse(ev.metadata) } catch { /* empty */ }
    const daysAgo = Math.round((Date.now() - ev.createdAt.getTime()) / 86400000)
    return `  - [${daysAgo}d ago] ${ev.type.replace(/_/g, ' ')}: ${JSON.stringify(meta).slice(0, 120)}`
  }).join('\n')

  const dealsContext = contact.deals.map((d) => (
    `  - "${d.title}": ${d.stage}, $${d.value.toLocaleString()}, ${d.probability}% probability, closes ${d.expectedCloseDate.toLocaleDateString()}`
  )).join('\n')

  const notesContext = contact.notes.map((n) => (
    `  - ${n.summary ?? n.rawContent.slice(0, 150)}`
  )).join('\n')

  const prompt = `You are an expert sales AI assistant. Analyze this contact's data and recommend the single best next action for the sales rep.

CONTACT: ${contact.firstName} ${contact.lastName} | ${contact.title} @ ${contact.company.name}
STATUS: ${contact.status} | Intent Score: ${contact.intentScore}/100

ACTIVE DEALS:
${dealsContext || '  (none)'}

LAST 5 INTERACTIONS:
${timelineContext || '  (none)'}

RECENT NOTES:
${notesContext || '  (none)'}

Return a JSON object with EXACTLY this structure (no markdown, raw JSON only):
{
  "recommendation": "A single punchy sentence describing the #1 recommended action and why (max 20 words)",
  "urgency": "HIGH" | "MEDIUM" | "LOW",
  "suggestedAction": "Short button label for the one-click action (max 5 words, e.g. 'Draft Follow-Up Email')",
  "reasoning": "1-2 sentences explaining the data signals that led to this recommendation"
}

Urgency guide: HIGH = deal at risk or hot opportunity this week, MEDIUM = proactive outreach needed, LOW = nurture/maintenance.`

  const result = await generateJSON<NextActionResult>(prompt)

  return Response.json(result)
}
