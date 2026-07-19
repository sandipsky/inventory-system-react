import { createFileRoute } from '@tanstack/react-router'
import UnitPage from '@/features/setup/unit/components/UnitPage'

export const Route = createFileRoute('/_authenticated/setup/unit')({
  component: UnitPage,
})
