import { createFileRoute } from '@tanstack/react-router'
import ProductsPage from '@/features/setup/products/components/ProductsPage'

export const Route = createFileRoute('/_authenticated/setup/products')({
  component: ProductsPage,
})
