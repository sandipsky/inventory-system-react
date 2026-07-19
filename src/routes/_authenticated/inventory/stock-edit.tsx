import { createFileRoute } from '@tanstack/react-router'
import StockEditPage from '@/features/inventory/stock-edit/components/StockEditPage'

export const Route = createFileRoute('/_authenticated/inventory/stock-edit')({
  component: StockEditPage,
})
