import { apiClient } from '@/lib'
import type { IConfiguration } from './configuration.types'

const BASE_API = '/configurations';

export const getConfigurations = async () => {
  const res = await apiClient.get<IConfiguration[]>(`${BASE_API}`)
  return res.data
}

export const updateConfigurations = async (body: IConfiguration[]) => {
  const res = await apiClient.put<IConfiguration[]>(`${BASE_API}/edit`, body)
  return res.data
}
