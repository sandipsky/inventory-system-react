import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getConfigurations, updateConfigurations } from './configuration.api'
import { useConfigStore } from './configuration.store'

export const configurationKeys = {
  all: ['configuration'] as const,
  list: () => [...configurationKeys.all, 'list'] as const,
}

export const useConfigurations = () =>
  useQuery({
    queryKey: configurationKeys.list(),
    queryFn: getConfigurations,
  })

/** Fetch configurations at startup and mirror them into the global name -> value store. */
export const useLoadConfigurations = () => {
  const { data } = useConfigurations()
  const setConfigs = useConfigStore((s) => s.setConfigs)

  useEffect(() => {
    if (data) setConfigs(data)
  }, [data, setConfigs])
}

export const useUpdateConfigurations = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateConfigurations,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: configurationKeys.all }),
  })
}
