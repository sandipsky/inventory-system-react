import { apiClient } from '@/lib'
import type { ILoginBody, ILoginResponse, IUserRoleOperations } from './auth.types';

export const login = async (body: ILoginBody) => {
  const res = await apiClient.post<ILoginResponse>(
    '/login',
    body,
  )
  return res.data
}

export const getUserRoleOperations = async () => {
  const res = await apiClient.get<IUserRoleOperations>('/getUserRoleOperations')
  return res.data
}
