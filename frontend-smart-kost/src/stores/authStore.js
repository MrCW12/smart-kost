import { create } from 'zustand'
import { authApi } from '@/api'

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  isLoading: false,

  login: async (credentials) => {
    set({ isLoading: true })
    try {
      const { data } = await authApi.login(credentials)
      const { user, token } = data.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      set({ user, token, isLoading: false })
      return { success: true }
    } catch (error) {
      set({ isLoading: false })
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      }
    }
  },

  logout: async () => {
    try {
      await authApi.logout()
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null })
  },

  fetchMe: async () => {
    try {
      const { data } = await authApi.me()
      const user = data.data
      localStorage.setItem('user', JSON.stringify(user))
      set({ user })
    } catch (e) {
      if (e?.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        set({ user: null, token: null })
      }
    }
  },

  isAuthenticated: () => !!get().token,

  hasRole: (role) => {
    const user = get().user
    if (!user) return false
    return user.roles?.some((r) => r.name === role)
  },

  hasAnyRole: (roles) => {
    const user = get().user
    if (!user) return false
    return user.roles?.some((r) => roles.includes(r.name))
  },
}))

export default useAuthStore
