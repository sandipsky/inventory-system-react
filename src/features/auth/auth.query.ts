import { useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getUserRoleOperations, login } from './auth.api'
import { getToken, useAuthStore } from './auth.store'

export const useLogin = () => useMutation({ mutationFn: login })

/** Current user's profile and permitted modules/operations — runs after login and on every app load.
    The granted operations are mirrored into the auth store for permission checks anywhere. */
export const useUserRoleOperations = () => {
  const query = useQuery({
    queryKey: ['auth', 'user-role-operations'],
    queryFn: getUserRoleOperations,
    enabled: !!getToken(),
  })

  const setOperations = useAuthStore((s) => s.setOperations)
  useEffect(() => {
    if (query.data) setOperations(query.data.operations)
  }, [query.data, setOperations])

  return query
}
