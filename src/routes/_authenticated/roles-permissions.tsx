import { createFileRoute } from '@tanstack/react-router'
import RolesPermissionsPage from '@/features/roles-permissions/components/RolesPermissionsPage'

export const Route = createFileRoute('/_authenticated/roles-permissions')({
  component: RolesPermissionsPage,
})
