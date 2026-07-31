import { apiClient } from '@/lib'
import type { IProducts, IProductsBody, IProductsParams } from './products.types'
import type { IPaginatedResponse } from '@/types/apiResponse.types';

const BASE_API = '/master/products';

export const getCategories = async (params: IProductsParams) => {
  const res = await apiClient.get<IPaginatedResponse<IProducts>>(`${BASE_API}`, { params })
  return res.data
}

export const getProductsById = async (id: number) => {
  const res = await apiClient.get<IProducts>(`${BASE_API}/${id}`)
  return res.data
}

export const createProducts = async (body: IProductsBody) => {
  const res = await apiClient.post<IProducts>(`${BASE_API}`, body)
  return res.data
}

export const updateProducts = async (id: number, body: IProductsBody) => {
  const res = await apiClient.put<IProducts>(`${BASE_API}/${id}`, body)
  return res.data
}

export const deleteProducts = async (id: number) => {
  const res = await apiClient.delete(`${BASE_API}/${id}`)
  return res.data
}
