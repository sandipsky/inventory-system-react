import { create } from 'zustand'
import type { IConfiguration } from './configuration.types'

interface ConfigState {
  /** name -> value map of every configuration, for global lookups. */
  configs: Record<string, string>
  setConfigs: (list: IConfiguration[]) => void
}

export const useConfigStore = create<ConfigState>()((set) => ({
  configs: {},
  setConfigs: (list) =>
    set({ configs: Object.fromEntries(list.map((config) => [config.name, config.value])) }),
}))

/** Read a configuration value outside React (interceptors, helpers). */
export const getConfig = (name: string) => useConfigStore.getState().configs[name]
