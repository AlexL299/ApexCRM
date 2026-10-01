import { prisma } from '@/lib/prisma'
import { generateJSON } from '@/lib/gemini'
import { NextRequest } from 'next/server'

type ParseNoteResult = {
  summary: string
  actionItems: string[]
  suggestedStageChange: string | null
  stageSuggestionReason: string | null
}

export async function POST(req: NextRequest) {
  const { contactId, rawContent, authorId } = await req.json()

  if (!contactId || !rawContent) {
    return Response.json({ error: 'contactId and rawContent are required' }, { status: 400 })
  }

  // Fetch context for better AI results
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: {
      company: true,
      deals: { orderBy: { expectedCloseDate: 'asc' }, take: 3 },
    },
  })

  if (!contact) {
    return Response.json({ error: 'Contact not found' }, { status: 404 })
  }

  const dealContext = contact.deals
    .map((d) => `  - "${d.title}" (${d.stage}, $${d.value.toLocaleString()})`)
    .join('\n')

  const prompt = `You are an AI assistant for a CRM system. Analyze the following sales note and return structured JSON.

CONTACT: ${contact.firstName} ${contact.lastName}
COMPANY: ${contact.company.name} (${contact.company.industry}, ${contact.company.size})
ACTIVE DEALS:
${dealContext || '  (none)'}

RAW NOTE:
"""
${rawContent}
"""

Return a JSON object with EXACTLY this structure (no markdown, no explanation, raw JSON only):
{
  "summary": "1-2 sentence summary of what happened / was discussed",
  "actionItems": ["action item 1", "action item 2"],
  "suggestedStageChange": "negotiation" | null,
  "stageSuggestionReason": "reason for stage change suggestion" | null
}

Rules:
- summary: concise, factual, past tense
- actionItems: concrete, owner-assignable next steps only. Empty array if none.
- suggestedStageChange: only suggest if the note clearly indicates a stage change is warranted. Use one of: discovery, qualification, proposal, negotiation, closed-won, closed-lost. Otherwise null.
- stageSuggestionReason: brief reason for the suggestion, or null.`

  const parsed = await generateJSON<ParseNoteResult>(prompt)

  // Find a default author if not provided
  const resolvedAuthorId = authorId ?? (await prisma.user.findFirst())?.id
  if (!resolvedAuthorId) {
    return Response.json({ error: 'No author found' }, { status: 500 })
  }

  // Save note with AI-enriched fields
  const note = await prisma.note.create({
    data: {
      contactId,
      authorId: resolvedAuthorId,
      rawContent,
      summary: parsed.summary,
      actionItems: JSON.stringify(parsed.actionItems),
    },
    include: { author: true },
  })

  // Log timeline event
  await prisma.timelineEvent.create({
    data: {
      contactId,
      type: 'note',
      metadata: JSON.stringify({
        snippet: rawContent.slice(0, 150),
        summary: parsed.summary,
        actionItemCount: parsed.actionItems.length,
      }),
    },
  })

  return Response.json({
    note: {
      ...note,
      createdAt: note.createdAt.toISOString(),
    },
    aiAnalysis: {
      summary: parsed.summary,
      actionItems: parsed.actionItems,
      suggestedStageChange: parsed.suggestedStageChange,
      stageSuggestionReason: parsed.stageSuggestionReason,
    },
  }, { status: 201 })
}
