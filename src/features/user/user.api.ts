import { apiClient } from '@/lib'
import type { IUser, IUserBody, IUserParams } from './user.types'
import type { IPaginatedResponse } from '@/types/apiResponse.types';
import { isAxiosError } from 'axios';

const BASE_API = '/users';

export const getUser = async (params: IUserParams) => {
  const res = await apiClient.get<IPaginatedResponse<IUser>>(`${BASE_API}`, { params })
  return res.data
}

export const getUserById = async (id: number) => {
  const res = await apiClient.get<IUser>(`${BASE_API}/${id}`)
  return res.data
}

/* Users are sent as multipart: a `user` JSON part plus an optional `image` part. */
const toFormData = (body: IUserBody, image?: File | null) => {
  const formData = new FormData()
  formData.append('user', new Blob([JSON.stringify(body)], { type: 'application/json' }))
  if (image) formData.append('image', image)
  return formData
}

/* Override the client's JSON default — with it set, axios serializes FormData to JSON
   instead of letting the browser send multipart with a boundary. */
const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } }

export const createUser = async (body: IUserBody, image?: File | null) => {
  const res = await apiClient.post<IUser>(`${BASE_API}`, toFormData(body, image), MULTIPART)
  return res.data
}

export const updateUser = async (id: number, body: IUserBody, image?: File | null) => {
  const res = await apiClient.put<IUser>(`${BASE_API}/${id}`, toFormData(body, image), MULTIPART)
  return res.data
}

export const deleteUser = async (id: number) => {
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
