import { createFileRoute } from '@tanstack/react-router'
import JournalEntryPage from '@/features/accounting/journal-entry/components/JournalEntryPage'

export const Route = createFileRoute('/_authenticated/accounting/journal-entry')({
  component: JournalEntryPage,
})
