import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  updateCategory,
} from './category.api'
import type { ICategoryBody, ICategoryParams } from './category.types'

export const categoryKeys = {
  all: ['categories'] as const,
  list: (params: ICategoryParams) => [...categoryKeys.all, 'list', params] as const,
  detail: (id: number) => [...categoryKeys.all, 'detail', id] as const,
}

export const useCategories = (params: ICategoryParams) =>
  useQuery({
    queryKey: categoryKeys.list(params),
    queryFn: () => getCategories(params),
    placeholderData: keepPreviousData,
  })

export const useCategory = (id: number) =>
  useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => getCategoryById(id),
    enabled: id > 0,
  })

export const useCreateCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
  })
}

export const useUpdateCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: ICategoryBody }) => updateCategory(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
  })
}

export const useDeleteCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
  })
}
