import { createFileRoute } from '@tanstack/react-router'
import ProductsPage from '@/features/products/components/ProductsPage'

export const Route = createFileRoute('/_authenticated/products')({
  component: ProductsPage,
})
