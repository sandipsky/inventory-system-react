import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createAccountMaster,
  deleteAccountMaster,
  getAccountMaster,
  getAccountMasterById,
  getAccountTypes,
  getParentAccounts,
  updateAccountMaster,
} from './account-master.api'
import type { IAccountMasterBody, IAccountMasterParams } from './account-master.types'

export const accountMasterKeys = {
  all: ['account-master'] as const,
  list: (params: IAccountMasterParams) => [...accountMasterKeys.all, 'list', params] as const,
  detail: (id: number) => [...accountMasterKeys.all, 'detail', id] as const,
  types: () => [...accountMasterKeys.all, 'types'] as const,
  parents: (accountType: string) => [...accountMasterKeys.all, 'parents', accountType] as const,
}

export const useAccountMasterList = (params: IAccountMasterParams) =>
  useQuery({
    queryKey: accountMasterKeys.list(params),
    queryFn: () => getAccountMaster(params),
    placeholderData: keepPreviousData,
  })

export const useAccountMasterById = (id: number) =>
  useQuery({
    queryKey: accountMasterKeys.detail(id),
    queryFn: () => getAccountMasterById(id),
    enabled: id > 0,
  })

export const useAccountTypes = () =>
  useQuery({
    queryKey: accountMasterKeys.types(),
    queryFn: getAccountTypes,
  })

export const useParentAccounts = (accountType: string) =>
  useQuery({
    queryKey: accountMasterKeys.parents(accountType),
    queryFn: () => getParentAccounts(accountType),
    enabled: !!accountType,
  })

export const useCreateAccountMaster = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAccountMaster,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountMasterKeys.all }),
  })
}

export const useUpdateAccountMaster = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: IAccountMasterBody }) =>
      updateAccountMaster(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountMasterKeys.all }),
  })
}

export const useDeleteAccountMaster = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAccountMaster,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountMasterKeys.all }),
  })
}
