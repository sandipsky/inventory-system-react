import { apiClient } from '@/lib'
import type {
  IAccountMaster,
  IAccountMasterBody,
  IAccountMasterParams,
  IAccountTypeGroup,
  IParentAccount,
} from './account-master.types'
import type { IPaginatedResponse } from '@/types/apiResponse.types';

const BASE_API = '/accountMaster';

export const getAccountMaster = async (params: IAccountMasterParams) => {
  const res = await apiClient.get<IPaginatedResponse<IAccountMaster>>(`${BASE_API}`, { params })
  return res.data
}

export const getAccountMasterById = async (id: number) => {
  const res = await apiClient.get<IAccountMaster>(`${BASE_API}/${id}`)
  return res.data
}

export const getAccountTypes = async () => {
  const res = await apiClient.get<IAccountTypeGroup[]>(`${BASE_API}/getAccountTypes`)
  return res.data
}

export const getParentAccounts = async (accountTypeName: string) => {
  const res = await apiClient.get<IParentAccount[]>(`${BASE_API}/getParentAccount/${accountTypeName}`)
  return res.data
}

export const createAccountMaster = async (body: IAccountMasterBody) => {
  const res = await apiClient.post<IAccountMaster>(`${BASE_API}`, body)
  return res.data
}

export const updateAccountMaster = async (id: number, body: IAccountMasterBody) => {
  const res = await apiClient.put<IAccountMaster>(`${BASE_API}/${id}`, body)
  return res.data
}

export const deleteAccountMaster = async (id: number) => {
  const res = await apiClient.delete(`${BASE_API}/${id}`)
  return res.data
}
