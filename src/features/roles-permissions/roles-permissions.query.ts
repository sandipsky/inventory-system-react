import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createRole,
  deleteRole,
  getRoleOperations,
  getRoles,
  updateRole,
} from './roles-permissions.api'
import type { IRoleBody, IRoleParams } from './roles-permissions.types'

export const roleKeys = {
  all: ['role'] as const,
  list: (params: IRoleParams) => [...roleKeys.all, 'list', params] as const,
  operations: (id: number) => [...roleKeys.all, 'operations', id] as const,
}

export const useRoleList = (params: IRoleParams) =>
  useQuery({
    queryKey: roleKeys.list(params),
    queryFn: () => getRoles(params),
    placeholderData: keepPreviousData,
  })

/* id 0 is a real call: it returns the full permission tree with nothing selected, for the add form. */
export const useRoleOperations = (id: number) =>
  useQuery({
    queryKey: roleKeys.operations(id),
    queryFn: () => getRoleOperations(id),
  })

export const useCreateRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roleKeys.all }),
  })
}

export const useUpdateRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: IRoleBody }) => updateRole(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roleKeys.all }),
  })
}

export const useDeleteRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roleKeys.all }),
  })
}
