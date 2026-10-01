import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function GET(_req: NextRequest) {
  const deals = await prisma.deal.findMany({
    include: {
      contact: {
        include: { company: true },
      },
    },
    orderBy: { expectedCloseDate: 'asc' },
  })
  return Response.json(deals)
}
