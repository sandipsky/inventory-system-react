import { apiClient } from '@/lib'
import type { IVendor, IVendorBody, IVendorParams } from './vendor.types'
import type { IPaginatedResponse } from '@/types/apiResponse.types';
import { isAxiosError } from 'axios';

const BASE_API = '/vendor';

export const getVendor = async (params: IVendorParams) => {
  const res = await apiClient.get<IPaginatedResponse<IVendor>>(`${BASE_API}`, { params })
  return res.data
}

export const getVendorById = async (id: number) => {
  const res = await apiClient.get<IVendor>(`${BASE_API}/${id}`)
  return res.data
}

export const createVendor = async (body: IVendorBody) => {
  const res = await apiClient.post<IVendor>(`${BASE_API}`, body)
  return res.data
}

export const updateVendor = async (id: number, body: IVendorBody) => {
  const res = await apiClient.put<IVendor>(`${BASE_API}/${id}`, body)
  return res.data
}

export const deleteVendor = async (id: number) => {
  const res = await apiClient.delete(`${BASE_API}/${id}`)
  return res.data
}

export const getErrorMessage = (error: unknown) => {
  if (isAxiosError(error)) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? error.message
  }
  /* Anything else never reached the server — surface it instead of swallowing it. */
  console.error(error)
  return 'Something went wrong'
}
