import { apiClient } from '@/lib'
import type { ICustomer, ICustomerBody, ICustomerParams } from './customer.types'
import type { IPaginatedResponse } from '@/types/apiResponse.types';
import { isAxiosError } from 'axios';

const BASE_API = '/customer';

export const getCustomer = async (params: ICustomerParams) => {
  const res = await apiClient.get<IPaginatedResponse<ICustomer>>(`${BASE_API}`, { params })
  return res.data
}

export const getCustomerById = async (id: number) => {
  const res = await apiClient.get<ICustomer>(`${BASE_API}/${id}`)
  return res.data
}

export const createCustomer = async (body: ICustomerBody) => {
  const res = await apiClient.post<ICustomer>(`${BASE_API}`, body)
  return res.data
}

export const updateCustomer = async (id: number, body: ICustomerBody) => {
  const res = await apiClient.put<ICustomer>(`${BASE_API}/${id}`, body)
  return res.data
}

export const deleteCustomer = async (id: number) => {
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
