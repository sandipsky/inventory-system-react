import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createProducts,
  deleteProducts,
  getCategories,
  getProductsById,
  updateProducts,
} from './products.api'
import type { IProductsBody, IProductsParams } from './products.types'

export const productsKeys = {
  all: ['categories'] as const,
  list: (params: IProductsParams) => [...productsKeys.all, 'list', params] as const,
  detail: (id: number) => [...productsKeys.all, 'detail', id] as const,
}

export const useCategories = (params: IProductsParams) =>
  useQuery({
    queryKey: productsKeys.list(params),
    queryFn: () => getCategories(params),
    placeholderData: keepPreviousData,
  })

export const useProducts = (id: number) =>
  useQuery({
    queryKey: productsKeys.detail(id),
    queryFn: () => getProductsById(id),
    enabled: id > 0,
  })

export const useCreateProducts = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createProducts,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productsKeys.all }),
  })
}

export const useUpdateProducts = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: IProductsBody }) => updateProducts(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productsKeys.all }),
  })
}

export const useDeleteProducts = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteProducts,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productsKeys.all }),
  })
}
