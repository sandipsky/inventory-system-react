import { createFileRoute } from '@tanstack/react-router'
import CustomerPage from '@/features/sales/customer/components/CustomerPage'

export const Route = createFileRoute('/_authenticated/sales/customer')({
  component: CustomerPage,
})
