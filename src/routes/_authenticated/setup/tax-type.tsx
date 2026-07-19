import { createFileRoute } from '@tanstack/react-router'
import TaxTypePage from '@/features/setup/tax-type/components/TaxTypePage'

export const Route = createFileRoute('/_authenticated/setup/tax-type')({
  component: TaxTypePage,
})
