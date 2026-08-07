import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createVendor,
  deleteVendor,
  getVendor,
  getVendorById,
  updateVendor,
} from './vendor.api'
import type { IVendorBody, IVendorParams } from './vendor.types'

export const vendorKeys = {
  all: ['vendor'] as const,
  list: (params: IVendorParams) => [...vendorKeys.all, 'list', params] as const,
  detail: (id: number) => [...vendorKeys.all, 'detail', id] as const,
}

export const useVendorList = (params: IVendorParams) =>
  useQuery({
    queryKey: vendorKeys.list(params),
    queryFn: () => getVendor(params),
    placeholderData: keepPreviousData,
  })

export const useVendorById = (id: number) =>
  useQuery({
    queryKey: vendorKeys.detail(id),
    queryFn: () => getVendorById(id),
    enabled: id > 0,
  })

export const useCreateVendor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createVendor,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.all }),
  })
}

export const useUpdateVendor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: IVendorBody }) => updateVendor(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.all }),
  })
}

export const useDeleteVendor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteVendor,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.all }),
  })
}
