import { apiClient } from '@/lib'
import type { IDocumentNumbering } from './document-numbering.types'

export const getDocumentNumbering = async () => {
  const res = await apiClient.get<IDocumentNumbering[]>('/documentNumbering')
  return res.data
}
