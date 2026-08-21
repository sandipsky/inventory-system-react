import { useMutation, useQuery } from '@tanstack/react-query'
import { getUserRoleOperations, login } from './auth.api'
import { getToken } from './auth.store'

export const useLogin = () => useMutation({ mutationFn: login })

/** Current user's profile and permitted modules/operations — runs after login and on every app load. */
export const useUserRoleOperations = () =>
  useQuery({
    queryKey: ['auth', 'user-role-operations'],
    queryFn: getUserRoleOperations,
    enabled: !!getToken(),
  })
