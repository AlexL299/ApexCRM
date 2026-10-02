import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(_req: NextRequest) {
  try {
    const deals = await prisma.deal.findMany({
      include: {
        contact: {
          include: { company: true },
        },
      },
      orderBy: { expectedCloseDate: 'asc' },
    })
    return NextResponse.json(deals)
  } catch (error: any) {
    console.error('Error fetching deals:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch deals' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser()
    const body = await req.json()
    const {
      title,
      value,
      stage = 'discovery',
      probability,
      expectedCloseDate,
      contactId,
      contactName,
      contactEmail,
      companyName,
    } = body

    if (!title || value === undefined || value === null) {
      return NextResponse.json(
        { error: 'Deal title and dollar value are required' },
        { status: 400 }
      )
    }

    const numValue = parseFloat(String(value))
    if (isNaN(numValue) || numValue < 0) {
      return NextResponse.json(
        { error: 'Deal value must be a valid positive number' },
        { status: 400 }
      )
    }

    let targetContactId = contactId

    // If no existing contact selected, resolve or create contact
    if (!targetContactId) {
      if (contactEmail) {
        const existing = await prisma.contact.findUnique({
          where: { email: String(contactEmail).trim().toLowerCase() },
        })
        if (existing) targetContactId = existing.id
      }

      if (!targetContactId) {
        // Resolve or create company — safe find-or-create to avoid unique domain collisions
        const cleanCompanyName = String(companyName || 'Apex Prospects').trim()

        let comp = await prisma.company.findFirst({
          where: { name: { equals: cleanCompanyName, mode: 'insensitive' } },
        })

        if (!comp) {
          const sanitized = cleanCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'company'
          const uniqueDomain = `${sanitized}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}.crm`
          try {
            comp = await prisma.company.create({
              data: {
                name: cleanCompanyName,
                domain: uniqueDomain,
                industry: 'Technology',
                size: 'mid-market',
              },
            })
          } catch (err: any) {
            if (err?.code === 'P2002') {
              comp = await prisma.company.findFirst({
                where: { name: { equals: cleanCompanyName, mode: 'insensitive' } },
              })
              if (!comp) throw err
            } else {
              throw err
            }
          }
        }

        const rawName = String(contactName || 'Primary Contact').trim()
        const nameParts = rawName.split(' ')
        const firstName = nameParts[0] || 'Primary'
        const lastName = nameParts.slice(1).join(' ') || 'Contact'
        const email = contactEmail
          ? String(contactEmail).trim().toLowerCase()
          : `contact.${Date.now().toString(36)}@${comp.domain}`

        const newContact = await prisma.contact.create({
          data: {
            firstName,
            lastName,
            email,
            title: 'Decision Maker',
            status: 'active',
            intentScore: 75,
            companyId: comp.id,
            userId: session?.userId || null,
          },
        })
        targetContactId = newContact.id
      }
    }

    // Default probability mapping if not manually provided
    const stageProbabilities: Record<string, number> = {
      discovery: 20,
      qualification: 40,
      proposal: 60,
      negotiation: 80,
      'closed-won': 100,
      'closed-lost': 0,
    }

    const finalProbability =
      probability !== undefined && probability !== null
        ? parseInt(String(probability), 10)
        : stageProbabilities[stage] ?? 50

    const closeDate = expectedCloseDate
      ? new Date(expectedCloseDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    const deal = await prisma.deal.create({
      data: {
        title: String(title).trim(),
        value: numValue,
        stage,
        probability: isNaN(finalProbability) ? 50 : finalProbability,
        expectedCloseDate: closeDate,
        contactId: targetContactId,
        userId: session?.userId || null,
      },
      include: {
        contact: {
          include: { company: true },
        },
      },
    })

    // Log timeline event for deal creation
    await prisma.timelineEvent.create({
      data: {
        contactId: targetContactId,
        dealId: deal.id,
        type: 'deal_stage_change',
        metadata: JSON.stringify({
          from: null,
          to: stage,
          dealTitle: deal.title,
          dealValue: deal.value,
          changedBy: session?.name || 'System User',
        }),
      },
    })

    return NextResponse.json({ success: true, deal }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating deal:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to create deal' },
      { status: 500 }
    )
  }
}
