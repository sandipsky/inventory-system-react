import { createFileRoute } from '@tanstack/react-router'
import StockAdjustmentPage from '@/features/inventory/stock-adjustment/components/StockAdjustmentPage'

export const Route = createFileRoute('/_authenticated/inventory/stock-adjustment')({
  component: StockAdjustmentPage,
})
