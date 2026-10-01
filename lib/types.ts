export type Company = {
  id: string
  name: string
  domain: string
  industry: string
  size: string
}

export type Deal = {
  id: string
  title: string
  value: number
  stage: string
  probability: number
  expectedCloseDate: string
  contactId: string
}

export type TimelineEvent = {
  id: string
  contactId: string | null
  dealId: string | null
  type: string
  metadata: string
  createdAt: string
}

export type Note = {
  id: string
  contactId: string
  authorId: string
  rawContent: string
  summary: string | null
  actionItems: string | null
  createdAt: string
  author: {
    id: string
    name: string
    email: string
    role: string
  }
}

export type Contact = {
  id: string
  companyId: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  title: string | null
  status: string
  intentScore: number
  company: Company
  deals?: Deal[]
  timelineEvents?: TimelineEvent[]
  notes?: Note[]
}
