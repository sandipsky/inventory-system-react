import { isAxiosError } from 'axios'
import { apiClient } from '@/lib'
import type { IPaginatedResponse } from '@/types/apiResponse.types'
import type { IMasterBody, IMasterEntity, IMasterParams } from './master.types'

export const createMasterApi = <T = IMasterEntity, TBody = IMasterBody>(basePath: string) => ({
  getAll: async (params: IMasterParams) => {
    const res = await apiClient.get<IPaginatedResponse<T>>(basePath, { params })
    return res.data
  },
  create: async (body: TBody) => {
    const res = await apiClient.post<T>(basePath, body)
    return res.data
  },
  update: async (id: number, body: TBody) => {
    const res = await apiClient.put<T>(`${basePath}/${id}`, body)
    return res.data
  },
  remove: async (id: number) => {
    const res = await apiClient.delete(`${basePath}/${id}`)
    return res.data
  },
})

export type MasterApi<T = IMasterEntity, TBody = IMasterBody> = ReturnType<
  typeof createMasterApi<T, TBody>
>

export const getErrorMessage = (error: unknown) =>
  isAxiosError(error)
    ? ((error.response?.data as { message?: string } | undefined)?.message ?? error.message)
    : 'Something went wrong'
