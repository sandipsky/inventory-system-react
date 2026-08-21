import { create } from 'zustand'

const TOKEN_KEY = 'token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)

interface AuthState {
  setAuth: (token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(() => ({
  setAuth: (token) => {
    localStorage.setItem(TOKEN_KEY, token)
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    window.location.href = '/login'
  },
}))
