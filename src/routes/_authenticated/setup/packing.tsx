import { createFileRoute } from '@tanstack/react-router'
import PackingPage from '@/features/setup/packing/components/PackingPage'

export const Route = createFileRoute('/_authenticated/setup/packing')({
  component: PackingPage,
})
