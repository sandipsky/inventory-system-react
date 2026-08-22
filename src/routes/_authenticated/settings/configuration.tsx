import { createFileRoute } from '@tanstack/react-router'
import ConfigurationPage from '@/features/settings/configuration/components/ConfigurationPage'

export const Route = createFileRoute('/_authenticated/settings/configuration')({
  component: ConfigurationPage,
})
