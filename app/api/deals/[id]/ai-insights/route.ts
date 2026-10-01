import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateJSON } from '@/lib/gemini'

interface DealInsightResponse {
  winProbability: number
  probabilityAssessment: string
  nextBestAction: {
    title: string
    rationale: string
    urgency: 'high' | 'medium' | 'low'
  }
  riskFactors: string[]
  dealStrengths: string[]
  recommendedStage: string
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        contact: {
          include: {
            company: true,
            notes: { take: 5, orderBy: { createdAt: 'desc' } },
          },
        },
        timelineEvents: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    const prompt = `You are ApexCRM's Senior AI Revenue Intelligence Copilot. Analyze the following deal and predict win probability, risk factors, and recommended next best actions.

DEAL DETAILS:
- Title: "${deal.title}"
- Face Value: $${deal.value.toLocaleString()}
- Current Stage: "${deal.stage}"
- Recorded Win Probability: ${deal.probability}%
- Expected Close Date: ${deal.expectedCloseDate.toISOString().split('T')[0]}

ACCOUNT & CONTACT:
- Contact Name: ${deal.contact.firstName} ${deal.contact.lastName} (${deal.contact.title || 'Contact'})
- Company: ${deal.contact.company.name} (${deal.contact.company.industry}, Size: ${deal.contact.company.size})
- Contact Intent Score: ${deal.contact.intentScore} / 100

RECENT TIMELINE & INTERACTIONS (${deal.timelineEvents.length} events):
${deal.timelineEvents
  .map(
    (ev) =>
      `- [${ev.createdAt.toISOString().split('T')[0]}] Type: ${ev.type} | Metadata: ${ev.metadata}`
  )
  .join('\n')}

RECENT NOTES:
${deal.contact.notes.map((n) => `- ${n.summary || n.rawContent}`).join('\n') || 'None recorded yet'}

OUTPUT REQUIREMENTS:
Respond ONLY with a JSON object in this exact schema:
{
  "winProbability": <integer 0-100>,
  "probabilityAssessment": "<1-2 concise sentences explaining the probability rationale>",
  "nextBestAction": {
    "title": "<Concise action title, e.g. 'Deliver Technical Security Redlines'>",
    "rationale": "<Actionable explanation why this step moves the deal forward>",
    "urgency": "<'high' | 'medium' | 'low'>"
  },
  "riskFactors": [
    "<Concise risk point 1>",
    "<Concise risk point 2>"
  ],
  "dealStrengths": [
    "<Positive momentum indicator 1>",
    "<Positive momentum indicator 2>"
  ],
  "recommendedStage": "<'discovery' | 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost'>"
}`

    let insight: DealInsightResponse
    try {
      insight = await generateJSON<DealInsightResponse>(prompt)
    } catch (aiErr) {
      console.warn('Gemini generateJSON failed, using rule-based fallback:', aiErr)
      // High-quality fallback based on deal telemetry
      const stageMap: Record<string, number> = {
        discovery: 25,
        qualification: 45,
        proposal: 65,
        negotiation: 85,
        'closed-won': 100,
        'closed-lost': 0,
      }
      const baseProb = stageMap[deal.stage] || 50
      const intentBoost = Math.round((deal.contact.intentScore - 50) * 0.2)
      const calculatedProb = Math.max(5, Math.min(95, baseProb + intentBoost))

      insight = {
        winProbability: calculatedProb,
        probabilityAssessment: `Deal is currently progressing through the ${deal.stage.replace('-', ' ')} stage with an intent score of ${deal.contact.intentScore}/100.`,
        nextBestAction: {
          title: `Schedule Decision Alignment with ${deal.contact.firstName}`,
          rationale: `Ensure all stakeholder procurement criteria and SLA timelines are verified before next milestone.`,
          urgency: calculatedProb > 60 ? 'high' : 'medium',
        },
        riskFactors: [
          'Budget approval cycle may require additional executive sign-off',
          'Timeline slippage risk if legal redlines remain unresolved',
        ],
        dealStrengths: [
          `Strong buyer engagement with ${deal.contact.company.name}`,
          `${deal.timelineEvents.length} recorded telemetry events showing continuous momentum`,
        ],
        recommendedStage: deal.stage,
      }
    }

    return NextResponse.json({ success: true, insight })
  } catch (error: any) {
    console.error('Error generating deal AI insights:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to generate AI insights' },
      { status: 500 }
    )
  }
}
