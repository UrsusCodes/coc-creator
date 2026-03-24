import { create } from 'zustand'
import { playerLogin as apiLogin } from '@/lib/player'

interface PlayerInfo {
  id: string
  name: string
  login: string
}

interface PlayerState {
  isAuthenticated: boolean
  token: string | null
  player: PlayerInfo | null
  login: (login: string, password: string) => Promise<boolean>
  logout: () => void
}

// Check if stored JWT is expired by decoding payload
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

// Clear expired tokens on startup
const storedToken = localStorage.getItem('player_token')
if (storedToken && isTokenExpired(storedToken)) {
  localStorage.removeItem('player_token')
  localStorage.removeItem('player_info')
}

export const usePlayerStore = create<PlayerState>((set) => ({
  isAuthenticated: !!localStorage.getItem('player_token'),
  token: localStorage.getItem('player_token'),
  player: JSON.parse(localStorage.getItem('player_info') ?? 'null'),

  login: async (login: string, password: string) => {
    try {
      const result = await apiLogin(login, password)
      localStorage.setItem('player_token', result.token)
      localStorage.setItem('player_info', JSON.stringify(result.player))
      set({ isAuthenticated: true, token: result.token, player: result.player })
      return true
    } catch {
      return false
    }
  },

  logout: () => {
    localStorage.removeItem('player_token')
    localStorage.removeItem('player_info')
    set({ isAuthenticated: false, token: null, player: null })
  },
}))
