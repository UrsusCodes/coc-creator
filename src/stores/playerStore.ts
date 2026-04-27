import { create } from 'zustand'
import { playerLogin as apiLogin } from '@/lib/player'
import { useCharacterStore } from './characterStore'

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

/**
 * Wizard state (characterStore) is persisted to localStorage via zustand
 * persist middleware. We MUST reset it on every login/logout transition
 * — otherwise a previous user's wizard step / serverDraftId / characteristics
 * leak into the next session, and the new user lands inside the old user's
 * draft (read-only, since the backend rejects cross-owner writes — but the
 * UI confusion is severe and autosave fails loudly).
 */
function resetWizardState() {
  useCharacterStore.getState().reset()
}

export const usePlayerStore = create<PlayerState>((set) => ({
  isAuthenticated: !!localStorage.getItem('player_token'),
  token: localStorage.getItem('player_token'),
  player: JSON.parse(localStorage.getItem('player_info') ?? 'null'),

  login: async (login: string, password: string) => {
    try {
      const result = await apiLogin(login, password)
      // Fresh login starts from a clean wizard slate.
      resetWizardState()
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
    // Clear wizard state so the next login can't inherit it.
    resetWizardState()
    set({ isAuthenticated: false, token: null, player: null })
  },
}))
