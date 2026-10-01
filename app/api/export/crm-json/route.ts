import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const [companies, contacts, deals, notes, events] = await Promise.all([
      prisma.company.findMany(),
      prisma.contact.findMany({ include: { company: true } }),
      prisma.deal.findMany({ include: { contact: true } }),
      prisma.note.findMany(),
      prisma.timelineEvent.findMany({ take: 200, orderBy: { createdAt: 'desc' } }),
    ])

    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      platform: 'ApexCRM',
      counts: {
        companies: companies.length,
        contacts: contacts.length,
        deals: deals.length,
        notes: notes.length,
        timelineEvents: events.length,
      },
      data: {
        companies,
        contacts,
        deals,
        notes,
        timelineEvents: events,
      },
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="apexcrm-backup-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error: any) {
    console.error('Error generating CRM JSON export:', error)
    return NextResponse.json({ error: error?.message || 'Export failed' }, { status: 500 })
  }
}
