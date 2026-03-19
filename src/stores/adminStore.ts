import { create } from 'zustand'

interface AdminState {
  isAuthenticated: boolean
  password: string | null
  login: (password: string) => void
  logout: () => void
}

export const useAdminStore = create<AdminState>()((set) => {
  // Restore from localStorage on init (persists across sessions)
  const storedPassword = typeof window !== 'undefined' ? localStorage.getItem('admin_password') : null

  return {
    isAuthenticated: !!storedPassword,
    password: storedPassword,

    login: (password: string) => {
      localStorage.setItem('admin_password', password)
      set({ isAuthenticated: true, password })
    },

    logout: () => {
      localStorage.removeItem('admin_password')
      set({ isAuthenticated: false, password: null })
    },
  }
})
