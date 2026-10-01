import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<'/api/deals/[id]'>
) {
  const { id } = await ctx.params
  const body = await req.json()

  const allowedFields = ['stage', 'probability', 'value', 'title', 'expectedCloseDate']
  const data: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (key in body) data[key] = body[key]
  }

  const deal = await prisma.deal.update({
    where: { id },
    data,
    include: {
      contact: { include: { company: true } },
    },
  })

  return Response.json(deal)
}

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/deals/[id]'>
) {
  const { id } = await ctx.params
  const deal = await prisma.deal.findUniqueOrThrow({
    where: { id },
    include: {
      contact: { include: { company: true } },
      timelineEvents: { orderBy: { createdAt: 'desc' } },
    },
  })
  return Response.json(deal)
}
