import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(_req: NextRequest) {
  try {
    const contacts = await prisma.contact.findMany({
      include: {
        company: true,
        deals: true,
      },
      orderBy: { intentScore: 'desc' },
    })
    return NextResponse.json(contacts)
  } catch (error: any) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch contacts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser()
    const body = await req.json()
    const { firstName, lastName, email, phone, title, status, companyId, companyName, notes } = body

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    // Check if contact already exists
    const existing = await prisma.contact.findUnique({
      where: { email: normalizedEmail },
    })

    if (existing) {
      return NextResponse.json(
        { error: `Contact with email "${normalizedEmail}" already exists` },
        { status: 409 }
      )
    }

    // Resolve company
    let targetCompanyId = companyId

    if (!targetCompanyId) {
      const cleanCompanyName = String(companyName || 'General Enterprise').trim()
      // Generate domain from company name or email domain
      const emailDomain = normalizedEmail.includes('@') ? normalizedEmail.split('@')[1] : 'acme.com'
      const sanitizedName = cleanCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '')
      const domain = `${sanitizedName || 'company'}-${Date.now().toString(36)}.io`

      const comp = await prisma.company.create({
        data: {
          name: cleanCompanyName,
          domain: emailDomain || domain,
          industry: 'Technology',
          size: 'mid-market',
        },
      })
      targetCompanyId = comp.id
    }

    const contact = await prisma.contact.create({
      data: {
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        email: normalizedEmail,
        phone: phone ? String(phone).trim() : null,
        title: title ? String(title).trim() : 'Lead',
        status: status || 'prospect',
        intentScore: status === 'active' ? 70 : 50,
        companyId: targetCompanyId,
        userId: session?.userId || null,
      },
      include: {
        company: true,
      },
    })

    // Log initial timeline event
    await prisma.timelineEvent.create({
      data: {
        contactId: contact.id,
        type: 'note',
        metadata: JSON.stringify({
          source: 'Manual Entry',
          note: notes || 'New lead created in ApexCRM',
          createdByName: session?.name || 'System User',
        }),
      },
    })

    // If initial notes supplied, create Note record
    if (notes && String(notes).trim().length > 0) {
      await prisma.note.create({
        data: {
          contactId: contact.id,
          authorId: session?.userId || (await prisma.user.findFirst())?.id || '',
          rawContent: String(notes).trim(),
          summary: `Initial note for ${contact.firstName} ${contact.lastName}`,
          actionItems: JSON.stringify(['Follow up with new lead', 'Schedule introductory discovery call']),
        },
      })
    }

    return NextResponse.json({ success: true, contact }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating contact:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to create contact' },
      { status: 500 }
    )
  }
}
