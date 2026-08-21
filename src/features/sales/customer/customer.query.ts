import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  getCustomerById,
  updateCustomer,
} from './customer.api'
import type { ICustomerBody, ICustomerParams } from './customer.types'

export const customerKeys = {
  all: ['customer'] as const,
  list: (params: ICustomerParams) => [...customerKeys.all, 'list', params] as const,
  detail: (id: number) => [...customerKeys.all, 'detail', id] as const,
}

export const useCustomerList = (params: ICustomerParams) =>
  useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => getCustomer(params),
    placeholderData: keepPreviousData,
  })

export const useCustomerById = (id: number) =>
  useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => getCustomerById(id),
    enabled: id > 0,
  })

export const useCreateCustomer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerKeys.all }),
  })
}

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: ICustomerBody }) => updateCustomer(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerKeys.all }),
  })
}

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerKeys.all }),
  })
}
