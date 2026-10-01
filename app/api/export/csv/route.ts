import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

function escapeCSV(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""'
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return `"${str}"`
}

/**
 * GET /api/export/csv
 * Returns downloadable CSV stream formatted with RFC 4180 rules.
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

    const headers = [
      'Contact Name',
      'Email',
      'Phone',
      'Title',
      'Company',
      'Industry',
      'Company Size',
      'Status',
      'Intent Score',
      'Deal Title',
      'Deal Value ($)',
      'Deal Stage',
      'Probability (%)',
      'Expected Close Date',
    ]

    const csvLines: string[] = [headers.map(escapeCSV).join(',')]

    for (const c of contacts) {
      if (c.deals.length === 0) {
        csvLines.push([
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
        ].map(escapeCSV).join(','))
      } else {
        for (const d of c.deals) {
          csvLines.push([
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
          ].map(escapeCSV).join(','))
        }
      }
    }

    const csvContent = '\uFEFF' + csvLines.join('\r\n')
    const filename = `ApexCRM-Export-${new Date().toISOString().split('T')[0]}.csv`

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache',
      },
    })
  } catch (error) {
    console.error('Error generating CSV export:', error)
    return Response.json({ error: 'Failed to generate CSV export' }, { status: 500 })
  }
}
