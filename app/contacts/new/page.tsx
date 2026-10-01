import type { Metadata } from 'next'
import { NewLeadForm } from '@/components/contacts/NewLeadForm'

export const metadata: Metadata = {
  title: 'New Lead / Contact — ApexCRM',
  description: 'Add a new contact or lead to ApexCRM',
}

export default function NewContactPage() {
  return <NewLeadForm />
}
