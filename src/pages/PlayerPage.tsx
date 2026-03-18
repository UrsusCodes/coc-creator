import { usePlayerStore } from '@/stores/playerStore'
import { PlayerLogin } from '@/components/player/PlayerLogin'
import { PlayerDashboard } from '@/components/player/PlayerDashboard'

export function PlayerPage() {
  const { isAuthenticated } = usePlayerStore()

  return isAuthenticated ? <PlayerDashboard /> : <PlayerLogin />
}
