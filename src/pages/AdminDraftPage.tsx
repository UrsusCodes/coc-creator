import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, FilePlus } from 'lucide-react'
import { useAdminStore } from '@/stores/adminStore'
import { adminGetPlayers, adminCreateDraft } from '@/lib/admin'
import { PERKS } from '@/data/perks'
import { ERA_LABELS, METHOD_LABELS } from '@/types/common'
import type { Era, CreationMethod } from '@/types/common'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function AdminDraftPage() {
  const { password, isAuthenticated } = useAdminStore()
  const navigate = useNavigate()

  const [players, setPlayers] = useState<{ id: string; name: string; login: string }[]>([])
  const [playersLoading, setPlayersLoading] = useState(false)

  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [era, setEra] = useState<Era>('classic_1920s')
  const [method, setMethod] = useState<CreationMethod>('direct')
  const [selectedPerks, setSelectedPerks] = useState<string[]>([])
  const [maxSkillValue, setMaxSkillValue] = useState(80)

  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!password) return
    setPlayersLoading(true)
    adminGetPlayers(password)
      .then(setPlayers)
      .catch(() => {})
      .finally(() => setPlayersLoading(false))
  }, [password])

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-coc-text-muted">Zaloguj się jako admin, aby tworzyć szkice.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/admin')}>
          Przejdź do panelu admina
        </Button>
      </div>
    )
  }

  const handleTogglePerk = (perkId: string) => {
    setSelectedPerks((prev) =>
      prev.includes(perkId) ? prev.filter((p) => p !== perkId) : [...prev, perkId]
    )
  }

  const handleCreate = async () => {
    if (!password || !selectedPlayerId) return
    setCreating(true)
    setError(null)
    setSuccess(null)
    try {
      await adminCreateDraft(password, {
        player_id: selectedPlayerId,
        wizard_data: {},
        locked_step: 0,
        era,
        method,
        perks: selectedPerks,
        max_skill_value: maxSkillValue,
      })
      const player = players.find((p) => p.id === selectedPlayerId)
      setSuccess(`Szkic utworzony dla gracza ${player?.name ?? selectedPlayerId}. Gracz zobaczy go na swoim dashboardzie.`)
      setSelectedPlayerId('')
    } catch (err) {
      setError((err as Error).message ?? 'Błąd tworzenia szkicu')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin')}>
          <ArrowLeft className="w-4 h-4" /> Wróć do panelu
        </Button>
        <h2 className="text-xl font-serif font-bold">Utwórz szkic postaci dla gracza</h2>
      </div>

      <Card>
        <div className="space-y-4">
          <p className="text-sm text-coc-text-muted">
            Stwórz szkic postaci, który gracz będzie mógł dokończyć. Gracz zobaczy opcję
            "Kontynuuj tworzenie" na swoim dashboardzie.
          </p>

          {/* Player selection */}
          <div>
            <label className="block text-sm font-medium text-coc-text-muted mb-1">Gracz</label>
            {playersLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <select
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text focus:outline-none focus:border-coc-accent-light"
              >
                <option value="">— Wybierz gracza —</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.login})</option>
                ))}
              </select>
            )}
          </div>

          {/* Era */}
          <div>
            <label className="block text-sm font-medium text-coc-text-muted mb-1">Era</label>
            <select
              value={era}
              onChange={(e) => setEra(e.target.value as Era)}
              className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text focus:outline-none focus:border-coc-accent-light"
            >
              {(Object.entries(ERA_LABELS) as [Era, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Method */}
          <div>
            <label className="block text-sm font-medium text-coc-text-muted mb-1">Metoda tworzenia</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as CreationMethod)}
              className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text focus:outline-none focus:border-coc-accent-light"
            >
              {(Object.entries(METHOD_LABELS) as [CreationMethod, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Max skill value */}
          <div>
            <label className="block text-sm font-medium text-coc-text-muted mb-1">Maks. wartość umiejętności</label>
            <input
              type="number"
              value={maxSkillValue}
              onChange={(e) => setMaxSkillValue(Number(e.target.value))}
              min={50}
              max={99}
              className="w-32 px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text focus:outline-none focus:border-coc-accent-light"
            />
          </div>

          {/* Perks */}
          {PERKS.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-coc-text-muted mb-1">Perki</label>
              <div className="space-y-1">
                {PERKS.map((perk) => (
                  <label key={perk.id} className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPerks.includes(perk.id)}
                      onChange={() => handleTogglePerk(perk.id)}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="text-sm font-medium">{perk.name}</span>
                      <p className="text-xs text-coc-text-muted">{perk.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              {success}
            </div>
          )}

          <Button
            onClick={handleCreate}
            disabled={!selectedPlayerId || creating}
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FilePlus className="w-4 h-4" />}
            Utwórz szkic dla gracza
          </Button>
        </div>
      </Card>
    </div>
  )
}
