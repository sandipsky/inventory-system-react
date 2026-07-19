import { createFileRoute } from '@tanstack/react-router'
import PaymentAdjustmentPage from '@/features/accounting/payment-adjustment/components/PaymentAdjustmentPage'

export const Route = createFileRoute('/_authenticated/accounting/payment-adjustment')({
  component: PaymentAdjustmentPage,
})
