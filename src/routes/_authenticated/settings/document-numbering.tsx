import { createFileRoute } from '@tanstack/react-router'
import DocumentNumberingPage from '@/features/settings/document-numbering/components/DocumentNumberingPage'

export const Route = createFileRoute('/_authenticated/settings/document-numbering')({
  component: DocumentNumberingPage,
})
