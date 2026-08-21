import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createUser,
  deleteUser,
  getUser,
  getUserById,
  updateUser,
} from './user.api'
import type { IUserBody, IUserParams } from './user.types'

export const userKeys = {
  all: ['user'] as const,
  list: (params: IUserParams) => [...userKeys.all, 'list', params] as const,
  detail: (id: number) => [...userKeys.all, 'detail', id] as const,
}

export const useUserList = (params: IUserParams) =>
  useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => getUser(params),
    placeholderData: keepPreviousData,
  })

export const useUserById = (id: number) =>
  useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => getUserById(id),
    enabled: id > 0,
  })

export const useCreateUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ body, image }: { body: IUserBody; image?: File | null }) =>
      createUser(body, image),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  })
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body, image }: { id: number; body: IUserBody; image?: File | null }) =>
      updateUser(id, body, image),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  })
}
