import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib'
import type { IDropdown } from '@/types/common.types'

const getDropdown = async (master: string, status: string) => {
  const res = await apiClient.get<IDropdown[]>(`/dropdown/${master}/${status}`)
  return res.data
}

/** Active-only `{ id, name }` options of a master resource, for selects and filters. */
export const useDropdown = (master: string) =>
  useQuery({
    queryKey: ['dropdown', master, 'active'],
    queryFn: () => getDropdown(master, 'active'),
  })
