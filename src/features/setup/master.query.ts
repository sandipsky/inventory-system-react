import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { MasterApi } from './master.api'
import type { IMasterBody, IMasterEntity, IMasterParams } from './master.types'

/** `name` is the query cache key — must be unique per resource. */
export const createMasterQueries = <T = IMasterEntity, TBody = IMasterBody>(
  name: string,
  api: MasterApi<T, TBody>,
) => {
  const allKey = [name] as const

  const useList = (params: IMasterParams) =>
    useQuery({
      queryKey: [...allKey, 'list', params],
      queryFn: () => api.getAll(params),
      placeholderData: keepPreviousData,
    })

  const useCreate = () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: api.create,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: allKey }),
    })
  }

  const useUpdate = () => {
    const queryClient = useQueryClient()
    return useMutation({
      /*
       * Pass `api.update` directly, never a wrapper arrow: the React Compiler
       * outlines a closure like `(vars) => api.update(vars)` to module scope,
       * where `api` is out of scope — the mutation then throws a ReferenceError
       * before any request is sent.
       */
      mutationFn: api.update,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: allKey }),
    })
  }

  const useDelete = () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: api.remove,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: allKey }),
    })
  }

  return { useList, useCreate, useUpdate, useDelete }
}

export type MasterQueries<T = IMasterEntity, TBody = IMasterBody> = ReturnType<
  typeof createMasterQueries<T, TBody>
>
