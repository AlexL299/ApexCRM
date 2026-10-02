import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateJSON } from '@/lib/gemini'
import { sendNewLeadNotification } from '@/lib/email'

/**
 * Public webhook endpoint — no auth required.
 * Accepts: POST { name, email, phone?, company?, message?, source? }
 *
 * On receipt:
 *  1. Upsert contact in Prisma
 *  2. Gemini scores lead intent (Hot / Warm / Cold + score 0-100)
 *  3. Auto-creates a deal if score >= 60
 *  4. Logs timeline event
 *  5. Sends email notification (if RESEND_API_KEY + LEAD_NOTIFY_EMAIL set)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, company, message, source = 'webhook' } = body

    // ── Validation ────────────────────────────────────────────────────────
    if (!name || !email) {
      return NextResponse.json(
        { error: 'name and email are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const cleanName = String(name).trim()
    const nameParts = cleanName.split(' ')
    const firstName = nameParts[0] || 'Lead'
    const lastName = nameParts.slice(1).join(' ') || 'Unknown'

    // ── Gemini Lead Scoring ───────────────────────────────────────────────
    let intentScore = 50
    let intentCategory: 'hot' | 'warm' | 'cold' = 'warm'
    let aiSummary = ''

    try {
      const scoreResult = await generateJSON<{
        score: number
        category: 'hot' | 'warm' | 'cold'
        summary: string
        suggestedNextAction: string
      }>(`
You are a CRM lead scoring AI. Analyze this inbound lead and respond with JSON only.

Lead Details:
- Name: ${cleanName}
- Email: ${normalizedEmail}
- Company: ${company || 'Unknown'}
- Message: ${message || 'No message provided'}
- Source: ${source}

Respond with JSON:
{
  "score": <integer 0-100>,
  "category": "hot" | "warm" | "cold",
  "summary": "<1-2 sentence summary of the lead>",
  "suggestedNextAction": "<specific next step for the sales rep>"
}

Scoring guide: 70-100 = hot (strong intent, clear need), 40-69 = warm (some interest), 0-39 = cold (unclear intent).
      `)

      intentScore = Math.max(0, Math.min(100, Math.round(scoreResult.score ?? 50)))
      intentCategory = scoreResult.category ?? 'warm'
      aiSummary = scoreResult.summary ?? ''
    } catch (geminiErr) {
      console.warn('[Webhook] Gemini scoring failed, using defaults:', geminiErr)
    }

    // ── Resolve or Create Company (safe upsert) ───────────────────────────
    // Public email provider domains must never be used as company domains —
    // they are shared across millions of users and will always collide.
    const PUBLIC_EMAIL_DOMAINS = new Set([
      'gmail.com', 'googlemail.com',
      'yahoo.com', 'yahoo.co.uk', 'yahoo.com.au',
      'outlook.com', 'hotmail.com', 'hotmail.co.uk',
      'live.com', 'msn.com',
      'icloud.com', 'me.com', 'mac.com',
      'protonmail.com', 'proton.me',
      'aol.com', 'mail.com', 'zoho.com',
    ])

    const emailDomain = normalizedEmail.split('@')[1] || 'unknown.com'
    const isPublicDomain = PUBLIC_EMAIL_DOMAINS.has(emailDomain)

    /**
     * Safely find or create a company, never crashing on unique domain conflicts.
     * Priority order:
     *   1. Match by exact name (case-insensitive)
     *   2. Match by domain (if not a public provider)
     *   3. Create a new record with a guaranteed-unique synthetic domain
     */
    async function findOrCreateCompany(
      companyName: string,
      preferredDomain: string | null
    ): Promise<string> {
      // 1. Try match by name first
      const byName = await prisma.company.findFirst({
        where: { name: { equals: companyName, mode: 'insensitive' } },
      })
      if (byName) return byName.id

      // 2. Try match by domain (only if it's a real business domain)
      if (preferredDomain && !isPublicDomain) {
        const byDomain = await prisma.company.findFirst({
          where: { domain: preferredDomain },
        })
        if (byDomain) return byDomain.id
      }

      // 3. Build a guaranteed-unique domain for the new record
      const sanitized = companyName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'company'
      const uniqueDomain =
        preferredDomain && !isPublicDomain
          ? preferredDomain
          : `${sanitized}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}.crm`

      // 4. Create — if another request races us, fall back to the winner's record
      try {
        const created = await prisma.company.create({
          data: {
            name: companyName,
            domain: uniqueDomain,
            industry: 'Technology',
            size: 'startup',
          },
        })
        return created.id
      } catch (createErr: any) {
        // Unique constraint race — another request already created this company
        if (createErr?.code === 'P2002') {
          const fallback = await prisma.company.findFirst({
            where: {
              OR: [
                { name: { equals: companyName, mode: 'insensitive' } },
                ...(preferredDomain && !isPublicDomain ? [{ domain: preferredDomain }] : []),
              ],
            },
          })
          if (fallback) return fallback.id
        }
        throw createErr
      }
    }

    let companyId: string

    if (company && String(company).trim().length > 0) {
      const cleanCompanyName = String(company).trim()
      // Only use email domain as company domain if it's a real business domain
      const companyDomain = isPublicDomain ? null : emailDomain
      companyId = await findOrCreateCompany(cleanCompanyName, companyDomain)
    } else {
      // No company name supplied — use the shared "Inbound Leads" bucket
      companyId = await findOrCreateCompany('Inbound Leads', null)
    }


    // ── Upsert Contact ────────────────────────────────────────────────────
    const existing = await prisma.contact.findUnique({
      where: { email: normalizedEmail },
    })

    let contact
    if (existing) {
      // Update intent score if the new score is higher
      contact = await prisma.contact.update({
        where: { id: existing.id },
        data: {
          intentScore: Math.max(existing.intentScore, intentScore),
          phone: phone ? String(phone).trim() : existing.phone,
        },
        include: { company: true },
      })
    } else {
      contact = await prisma.contact.create({
        data: {
          firstName,
          lastName,
          email: normalizedEmail,
          phone: phone ? String(phone).trim() : null,
          title: 'Inbound Lead',
          status: intentCategory === 'hot' ? 'active' : 'prospect',
          intentScore,
          companyId,
        },
        include: { company: true },
      })
    }

    // ── Timeline Event ────────────────────────────────────────────────────
    await prisma.timelineEvent.create({
      data: {
        contactId: contact.id,
        type: 'note',
        metadata: JSON.stringify({
          source,
          note: message || `Inbound lead from ${source}`,
          aiSummary,
          intentScore,
          intentCategory,
          createdByName: 'Webhook',
        }),
      },
    })

    // ── Auto-Create Deal for Hot Leads (score >= 60) ──────────────────────
    let deal = null
    if (intentScore >= 60) {
      const systemUser = await prisma.user.findFirst()
      deal = await prisma.deal.create({
        data: {
          title: `${cleanName} - ${company || 'Inbound'} Opportunity`,
          value: 5000, // Default discovery value — rep will update
          stage: intentCategory === 'hot' ? 'qualification' : 'discovery',
          probability: intentCategory === 'hot' ? 40 : 20,
          expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
          contactId: contact.id,
          userId: systemUser?.id || null,
        },
      })

      // Log deal creation timeline event
      await prisma.timelineEvent.create({
        data: {
          contactId: contact.id,
          dealId: deal.id,
          type: 'deal_stage_change',
          metadata: JSON.stringify({
            from: null,
            to: deal.stage,
            dealTitle: deal.title,
            dealValue: deal.value,
            changedBy: 'AI Webhook (auto)',
          }),
        },
      })
    }

    // ── Email Notification ────────────────────────────────────────────────
    const notifyEmail = process.env.LEAD_NOTIFY_EMAIL
    if (notifyEmail) {
      await sendNewLeadNotification({
        recipientEmail: notifyEmail,
        leadName: cleanName,
        leadEmail: normalizedEmail,
        company: company || undefined,
        source,
        intentScore,
        message: message || undefined,
        contactId: contact.id,
      }).catch((err) => console.warn('[Webhook] Email notification failed:', err))
    }

    return NextResponse.json(
      {
        success: true,
        contact: {
          id: contact.id,
          name: `${contact.firstName} ${contact.lastName}`,
          email: contact.email,
          intentScore,
          intentCategory,
        },
        deal: deal ? { id: deal.id, title: deal.title, stage: deal.stage } : null,
        aiSummary,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[Webhook] Lead processing error:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'POST /api/leads/webhook',
    accepts: { name: 'string', email: 'string', phone: 'string?', company: 'string?', message: 'string?', source: 'string?' },
  })
}
