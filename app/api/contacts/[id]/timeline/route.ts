import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const body = await req.json()

  const event = await prisma.timelineEvent.create({
    data: {
      contactId: id,
      dealId: body.dealId ?? null,
      type: body.type ?? 'email_sent',
      metadata: typeof body.metadata === 'string' ? body.metadata : JSON.stringify(body.metadata ?? {}),
    },
  })

  return Response.json(event, { status: 201 })
}
