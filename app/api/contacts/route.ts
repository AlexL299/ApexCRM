import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
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

    // Resolve company — safe find-or-create to avoid unique constraint crashes
    const PUBLIC_EMAIL_DOMAINS = new Set([
      'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'yahoo.com.au',
      'outlook.com', 'hotmail.com', 'hotmail.co.uk', 'live.com', 'msn.com',
      'icloud.com', 'me.com', 'mac.com', 'protonmail.com', 'proton.me',
      'aol.com', 'mail.com', 'zoho.com',
    ])

    let targetCompanyId = companyId

    if (!targetCompanyId) {
      const cleanCompanyName = String(companyName || 'General Enterprise').trim()
      const emailDomain = normalizedEmail.includes('@') ? normalizedEmail.split('@')[1] : ''
      const isPublicDomain = PUBLIC_EMAIL_DOMAINS.has(emailDomain)

      // 1. Match by company name first (case-insensitive)
      const byName = await prisma.company.findFirst({
        where: { name: { equals: cleanCompanyName, mode: 'insensitive' } },
      })
      if (byName) {
        targetCompanyId = byName.id
      } else if (emailDomain && !isPublicDomain) {
        // 2. Match by business email domain
        const byDomain = await prisma.company.findFirst({
          where: { domain: emailDomain },
        })
        if (byDomain) {
          targetCompanyId = byDomain.id
        }
      }

      if (!targetCompanyId) {
        // 3. Create with a guaranteed-unique synthetic domain
        const sanitizedName = cleanCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'company'
        const uniqueDomain =
          emailDomain && !isPublicDomain
            ? emailDomain
            : `${sanitizedName}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}.crm`

        try {
          const comp = await prisma.company.create({
            data: {
              name: cleanCompanyName,
              domain: uniqueDomain,
              industry: 'Technology',
              size: 'mid-market',
            },
          })
          targetCompanyId = comp.id
        } catch (err: any) {
          if (err?.code === 'P2002') {
            // Race condition — another request won; find the existing record
            const existing = await prisma.company.findFirst({
              where: {
                OR: [
                  { name: { equals: cleanCompanyName, mode: 'insensitive' } },
                  ...(emailDomain && !isPublicDomain ? [{ domain: emailDomain }] : []),
                ],
              },
            })
            if (existing) {
              targetCompanyId = existing.id
            } else {
              throw err
            }
          } else {
            throw err
          }
        }
      }
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

    // Revalidate so server pages show the new contact immediately
    revalidatePath('/contacts')
    revalidatePath('/dashboard')
    revalidatePath('/')

    return NextResponse.json({ success: true, contact }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating contact:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to create contact' },
      { status: 500 }
    )
  }
}
