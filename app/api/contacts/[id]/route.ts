import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/contacts/[id]'>
) {
  const { id } = await ctx.params
  const contact = await prisma.contact.findUniqueOrThrow({
    where: { id },
    include: {
      company: true,
      deals: { orderBy: { expectedCloseDate: 'asc' } },
      timelineEvents: { orderBy: { createdAt: 'desc' } },
      notes: {
        include: { author: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  return Response.json(contact)
}

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<'/api/contacts/[id]'>
) {
  const { id } = await ctx.params
  const body = await req.json()

  const allowedFields = ['status', 'intentScore', 'phone', 'title']
  const data: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (key in body) data[key] = body[key]
  }

  const contact = await prisma.contact.update({
    where: { id },
    data,
    include: { company: true },
  })
  return Response.json(contact)
}
