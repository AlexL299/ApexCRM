import type { Metadata } from 'next'
import { NewDealForm } from '@/components/deals/NewDealForm'

export const metadata: Metadata = {
  title: 'New Deal — ApexCRM',
  description: 'Create a new opportunity in the pipeline',
}

export default function PipelineNewDealPage() {
  return <NewDealForm />
}
