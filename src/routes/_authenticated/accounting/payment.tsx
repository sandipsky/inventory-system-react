import { createFileRoute } from '@tanstack/react-router'
import PaymentPage from '@/features/accounting/payment/components/PaymentPage'

export const Route = createFileRoute('/_authenticated/accounting/payment')({
  component: PaymentPage,
})
