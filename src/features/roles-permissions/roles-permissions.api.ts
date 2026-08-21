import { apiClient } from '@/lib'
import type { IRole, IRoleBody, IRoleMasterModule, IRoleParams } from './roles-permissions.types'
import type { IPaginatedResponse } from '@/types/apiResponse.types';

const BASE_API = '/roles';

export const getRoles = async (params: IRoleParams) => {
  const res = await apiClient.get<IPaginatedResponse<IRole>>(`${BASE_API}`, { params })
  return res.data
}

export const getRoleOperations = async (id: number) => {
  const res = await apiClient.get<IRoleMasterModule[]>(`${BASE_API}/operations/${id}`)
  return res.data
}

export const createRole = async (body: IRoleBody) => {
  const res = await apiClient.post<IRole>(`${BASE_API}`, body)
  return res.data
}

export const updateRole = async (id: number, body: IRoleBody) => {
  const res = await apiClient.put<IRole>(`${BASE_API}/${id}`, body)
  return res.data
}

export const deleteRole = async (id: number) => {
  const res = await apiClient.delete(`${BASE_API}/${id}`)
  return res.data
}
