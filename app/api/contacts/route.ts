import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function GET(_req: NextRequest) {
  const contacts = await prisma.contact.findMany({
    include: {
      company: true,
      deals: true,
    },
    orderBy: { intentScore: 'desc' },
  })
  return Response.json(contacts)
}
