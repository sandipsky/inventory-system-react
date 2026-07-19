import { createFileRoute } from '@tanstack/react-router'
import SalesEntryPage from '@/features/sales/sales-entry/components/SalesEntryPage'

export const Route = createFileRoute('/_authenticated/sales/sales-entry')({
  component: SalesEntryPage,
})
