import { createFileRoute } from '@tanstack/react-router'
import VendorPage from '@/features/purchase/vendor/components/VendorPage'

export const Route = createFileRoute('/_authenticated/purchase/vendor')({
  component: VendorPage,
})
