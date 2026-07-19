import { createFileRoute } from '@tanstack/react-router'
import PurchaseReturnPage from '@/features/purchase/purchase-return/components/PurchaseReturnPage'

export const Route = createFileRoute('/_authenticated/purchase/purchase-return')({
  component: PurchaseReturnPage,
})
