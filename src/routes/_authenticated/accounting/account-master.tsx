import { createFileRoute } from '@tanstack/react-router'
import AccountMasterPage from '@/features/accounting/account-master/components/AccountMasterPage'

export const Route = createFileRoute('/_authenticated/accounting/account-master')({
  component: AccountMasterPage,
})
