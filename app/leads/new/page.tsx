import type { Metadata } from 'next'
import { NewLeadForm } from '@/components/contacts/NewLeadForm'

export const metadata: Metadata = {
  title: 'New Lead — ApexCRM',
  description: 'Add a new lead to ApexCRM',
}

export default function NewLeadPage() {
  return <NewLeadForm />
}
