import { createFileRoute } from '@tanstack/react-router'
import OpeningStockPage from '@/features/inventory/opening-stock/components/OpeningStockPage'

export const Route = createFileRoute('/_authenticated/inventory/opening-stock')({
  component: OpeningStockPage,
})
