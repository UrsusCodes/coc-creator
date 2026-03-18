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

export const usePlayerStore = create<PlayerState>((set) => ({
  isAuthenticated: !!sessionStorage.getItem('player_token'),
  token: sessionStorage.getItem('player_token'),
  player: JSON.parse(sessionStorage.getItem('player_info') ?? 'null'),

  login: async (login: string, password: string) => {
    try {
      const result = await apiLogin(login, password)
      sessionStorage.setItem('player_token', result.token)
      sessionStorage.setItem('player_info', JSON.stringify(result.player))
      set({ isAuthenticated: true, token: result.token, player: result.player })
      return true
    } catch {
      return false
    }
  },

  logout: () => {
    sessionStorage.removeItem('player_token')
    sessionStorage.removeItem('player_info')
    set({ isAuthenticated: false, token: null, player: null })
  },
}))
