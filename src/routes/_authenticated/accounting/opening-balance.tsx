import { createFileRoute } from '@tanstack/react-router'
import OpeningBalancePage from '@/features/accounting/opening-balance/components/OpeningBalancePage'

export const Route = createFileRoute('/_authenticated/accounting/opening-balance')({
  component: OpeningBalancePage,
})
