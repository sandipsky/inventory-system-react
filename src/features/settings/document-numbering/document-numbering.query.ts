import { useQuery } from '@tanstack/react-query'
import { getDocumentNumbering } from './document-numbering.api'

export const documentNumberingKeys = {
  all: ['document-numbering'] as const,
  list: () => [...documentNumberingKeys.all, 'list'] as const,
}

export const useDocumentNumberingList = () =>
  useQuery({
    queryKey: documentNumberingKeys.list(),
    queryFn: getDocumentNumbering,
  })
