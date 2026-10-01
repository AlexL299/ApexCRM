import { prisma } from '@/lib/prisma'
import { KanbanBoard } from '@/components/pipeline/KanbanBoard'
import { ExportDataButton } from '@/components/ui/ExportDataButton'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pipeline — ApexCRM',
  description: 'Manage your sales pipeline with a visual Kanban board.',
}

export default async function PipelinePage() {
  const deals = await prisma.deal.findMany({
    include: {
      contact: {
        include: { company: true },
      },
    },
    orderBy: { expectedCloseDate: 'asc' },
  })

  // Serialize dates so they are safe to pass as props to a Client Component
  const serialized = deals.map((d) => ({
    ...d,
    expectedCloseDate: d.expectedCloseDate.toISOString(),
  }))

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Pipeline</h1>
          <p className="page-subtitle">Drag deals through stages to track progress</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <ExportDataButton />
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <KanbanBoard initialDeals={serialized} />
      </div>
    </div>
  )
}
