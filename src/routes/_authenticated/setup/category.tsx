import { createFileRoute } from '@tanstack/react-router'
import CategoryPage from '@/features/setup/category/components/CategoryPage'

export const Route = createFileRoute('/_authenticated/setup/category')({
  component: CategoryPage,
})
