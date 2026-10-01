import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function POST(
  req: NextRequest,
  ctx: RouteContext<'/api/contacts/[id]/notes'>
) {
  const { id } = await ctx.params
  const body = await req.json()

  const note = await prisma.note.create({
    data: {
      contactId: id,
      authorId: body.authorId ?? 'default-author',
      rawContent: body.rawContent,
      summary: body.summary ?? null,
      actionItems: body.actionItems ? JSON.stringify(body.actionItems) : null,
    },
    include: { author: true },
  })

  // Also create a timeline event for the note
  await prisma.timelineEvent.create({
    data: {
      contactId: id,
      type: 'note',
      metadata: JSON.stringify({ snippet: body.rawContent.slice(0, 150) }),
    },
  })

  return Response.json(note, { status: 201 })
}
