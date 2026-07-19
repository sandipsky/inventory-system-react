import { createFileRoute } from '@tanstack/react-router'
import PurchaseEntryPage from '@/features/purchase/purchase-entry/components/PurchaseEntryPage'

export const Route = createFileRoute('/_authenticated/purchase/purchase-entry')({
  component: PurchaseEntryPage,
})
