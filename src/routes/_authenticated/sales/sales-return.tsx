import { createFileRoute } from '@tanstack/react-router'
import SalesReturnPage from '@/features/sales/sales-return/components/SalesReturnPage'

export const Route = createFileRoute('/_authenticated/sales/sales-return')({
  component: SalesReturnPage,
})
