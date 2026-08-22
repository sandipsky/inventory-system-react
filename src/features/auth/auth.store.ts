import { create } from 'zustand'

const TOKEN_KEY = 'token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)

interface AuthState {
  /** Operation names granted to the logged-in user, from /getUserRoleOperations. */
  operations: string[]
  setAuth: (token: string) => void
  setOperations: (operations: string[]) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  operations: [],
  setAuth: (token) => {
    localStorage.setItem(TOKEN_KEY, token)
  },
  setOperations: (operations) => set({ operations }),
  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    window.location.href = '/login'
  },
}))

/** Permission check usable outside React (guards, helpers). */
export const hasOperation = (operation: string) =>
  useAuthStore.getState().operations.includes(operation)
