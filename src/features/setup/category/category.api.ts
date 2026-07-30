import { apiClient } from '@/lib'
import type { ICategory, ICategoryBody, ICategoryParams } from './category.types'
import type { IPaginatedResponse } from '@/types/apiResponse.types';

const BASE_API = '/master/categorys';

export const getCategories = async (params: ICategoryParams) => {
  const res = await apiClient.get<IPaginatedResponse<ICategory>>(`${BASE_API}`, { params })
  return res.data
}

export const getCategoryById = async (id: number) => {
  const res = await apiClient.get<ICategory>(`${BASE_API}/${id}`)
  return res.data
}

export const createCategory = async (body: ICategoryBody) => {
  const res = await apiClient.post<ICategory>(`${BASE_API}`, body)
  return res.data
}

export const updateCategory = async (id: number, body: ICategoryBody) => {
  const res = await apiClient.put<ICategory>(`${BASE_API}/${id}`, body)
  return res.data
}

export const deleteCategory = async (id: number) => {
  const res = await apiClient.delete(`${BASE_API}/${id}`)
  return res.data
}
