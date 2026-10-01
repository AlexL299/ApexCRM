import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { DealDetailView } from '@/components/deals/DealDetailView'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const deal = await prisma.deal.findUnique({
    where: { id },
    select: { title: true },
  })

  return {
    title: deal ? `${deal.title} — ApexCRM` : 'Deal Not Found — ApexCRM',
  }
}

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      contact: {
        include: {
          company: true,
        },
      },
      timelineEvents: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!deal) {
    notFound()
  }

  // Serialize dates for client component
  const serializedDeal = {
    ...deal,
    expectedCloseDate: deal.expectedCloseDate.toISOString(),
    timelineEvents: deal.timelineEvents.map((ev) => ({
      ...ev,
      createdAt: ev.createdAt.toISOString(),
    })),
  }

  return <DealDetailView deal={serializedDeal} />
}
