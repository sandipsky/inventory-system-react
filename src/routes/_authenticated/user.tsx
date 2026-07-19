import { createFileRoute } from '@tanstack/react-router'
import UserPage from '@/features/user/components/UserPage'

export const Route = createFileRoute('/_authenticated/user')({
  component: UserPage,
})
