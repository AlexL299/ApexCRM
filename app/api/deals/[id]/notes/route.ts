import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getCurrentUser()
    const { content, type = 'note', outcome } = await req.json()

    if (!content || !String(content).trim()) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 })
    }

    const deal = await prisma.deal.findUnique({
      where: { id },
      include: { contact: true },
    })

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    const trimmedContent = String(content).trim()
    const authorName = session?.name || 'Sales Rep'
    const authorId = session?.userId || (await prisma.user.findFirst())?.id || ''

    // 1. Create Timeline Event
    const event = await prisma.timelineEvent.create({
      data: {
        dealId: deal.id,
        contactId: deal.contactId,
        type: type === 'call' || type === 'meeting' ? type : 'note',
        metadata: JSON.stringify({
          note: trimmedContent,
          outcome: outcome || 'recorded',
          rep: authorName,
          dealTitle: deal.title,
        }),
      },
    })

    // 2. Create Note entry
    const note = await prisma.note.create({
      data: {
        contactId: deal.contactId,
        authorId,
        rawContent: trimmedContent,
        summary: `Note logged on deal: ${deal.title}`,
        actionItems: JSON.stringify(['Follow up on deal action items']),
      },
    })

    return NextResponse.json({ success: true, event, note }, { status: 201 })
  } catch (error: any) {
    console.error('Error logging deal note:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to save note' },
      { status: 500 }
    )
  }
}
