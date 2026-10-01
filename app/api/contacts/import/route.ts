import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser()
    const { contacts } = await req.json()

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: 'No contact data provided for import' }, { status: 400 })
    }

    let importedCount = 0
    let skippedCount = 0
    const errors: string[] = []

    for (const item of contacts) {
      try {
        const rawEmail = String(item.email || '').trim().toLowerCase()
        if (!rawEmail || !rawEmail.includes('@')) {
          skippedCount++
          errors.push(`Row missing valid email: "${item.firstName || ''} ${item.lastName || ''}"`)
          continue
        }

        // Check duplicate
        const existing = await prisma.contact.findUnique({
          where: { email: rawEmail },
        })

        if (existing) {
          skippedCount++
          errors.push(`Email "${rawEmail}" already exists, skipped.`)
          continue
        }

        // Parse names
        let firstName = String(item.firstName || '').trim()
        let lastName = String(item.lastName || '').trim()

        if (!firstName && !lastName && item.name) {
          const parts = String(item.name).trim().split(' ')
          firstName = parts[0] || 'Unknown'
          lastName = parts.slice(1).join(' ') || 'Contact'
        }

        if (!firstName) firstName = 'New'
        if (!lastName) lastName = 'Contact'

        // Resolve company
        const compName = String(item.companyName || item.company || 'Imported Account').trim()
        const domainSlug = compName.toLowerCase().replace(/[^a-z0-9]/g, '')
        const domain = `${domainSlug || 'company'}-${Date.now().toString(36)}.io`

        const company = await prisma.company.create({
          data: {
            name: compName,
            domain: rawEmail.split('@')[1] || domain,
            industry: 'General',
            size: 'smb',
          },
        })

        const status = ['active', 'prospect', 'qualified'].includes(item.status?.toLowerCase())
          ? item.status.toLowerCase()
          : 'prospect'

        const contact = await prisma.contact.create({
          data: {
            firstName,
            lastName,
            email: rawEmail,
            phone: item.phone ? String(item.phone).trim() : null,
            title: item.title ? String(item.title).trim() : 'Contact',
            status,
            intentScore: status === 'active' ? 70 : 50,
            companyId: company.id,
            userId: session?.userId || null,
          },
        })

        // Log timeline event
        await prisma.timelineEvent.create({
          data: {
            contactId: contact.id,
            type: 'note',
            metadata: JSON.stringify({
              source: 'CSV Batch Import',
              note: `Contact imported via CSV batch. Status set to ${status}.`,
              importedByName: session?.name || 'System User',
            }),
          },
        })

        importedCount++
      } catch (err: any) {
        skippedCount++
        errors.push(`Error importing ${item.email || 'row'}: ${err?.message || 'DB error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      importedCount,
      skippedCount,
      totalProcessed: contacts.length,
      errors: errors.slice(0, 10), // return top errors
    })
  } catch (error: any) {
    console.error('Import API error:', error)
    return NextResponse.json({ error: error?.message || 'Import operation failed' }, { status: 500 })
  }
}
