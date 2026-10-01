import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

/**
 * GET /api/export/sheets
 * Formats CRM contact and deal data into Google Sheets API v4 ValueRange structure
 * ready for batchUpdate or values.update API requests.
 */
export async function GET(req: NextRequest) {
  try {
    const contacts = await prisma.contact.findMany({
      include: {
        company: true,
        deals: {
          orderBy: { value: 'desc' },
        },
      },
      orderBy: { intentScore: 'desc' },
    })

    const header = [
      'Contact Name',
      'Email',
      'Phone',
      'Title',
      'Company',
      'Industry',
      'Company Size',
      'Status',
      'Intent Score',
      'Primary Deal Title',
      'Deal Value ($)',
      'Deal Stage',
      'Probability (%)',
      'Expected Close Date',
    ]

    const rows: (string | number)[][] = []

    for (const c of contacts) {
      if (c.deals.length === 0) {
        rows.push([
          `${c.firstName} ${c.lastName}`,
          c.email,
          c.phone ?? '',
          c.title ?? '',
          c.company.name,
          c.company.industry,
          c.company.size,
          c.status,
          c.intentScore,
          '—',
          0,
          '—',
          0,
          '—',
        ])
      } else {
        for (const d of c.deals) {
          rows.push([
            `${c.firstName} ${c.lastName}`,
            c.email,
            c.phone ?? '',
            c.title ?? '',
            c.company.name,
            c.company.industry,
            c.company.size,
            c.status,
            c.intentScore,
            d.title,
            d.value,
            d.stage,
            d.probability,
            d.expectedCloseDate.toISOString().split('T')[0],
          ])
        }
      }
    }

    const totalPipelineValue = contacts.reduce(
      (sum, c) =>
        sum +
        c.deals
          .filter((d) => !['closed-lost'].includes(d.stage))
          .reduce((s, d) => s + d.value, 0),
      0
    )

    const payload = {
      range: `Sheet1!A1:N${rows.length + 1}`,
      majorDimension: 'ROWS',
      values: [header, ...rows],
      metadata: {
        source: 'ApexCRM Export Engine',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        totalContacts: contacts.length,
        totalDataRows: rows.length,
        totalPipelineValue,
        sheetFormat: 'Google Sheets API v4 ValueRange Compatible',
      },
    }

    return Response.json(payload, { status: 200 })
  } catch (error) {
    console.error('Error exporting to sheets format:', error)
    return Response.json({ error: 'Failed to generate sheets export' }, { status: 500 })
  }
}
