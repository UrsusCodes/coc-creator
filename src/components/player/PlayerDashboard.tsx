import { useState, useEffect, useCallback } from 'react'
import { LogOut, KeyRound, Users, Loader2, RefreshCw, Copy, Check, Eye } from 'lucide-react'
import { usePlayerStore } from '@/stores/playerStore'
import { playerGetCodes, playerGetCharacters } from '@/lib/player'
import { ERA_LABELS, METHOD_LABELS } from '@/types/common'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PlayerCharacterViewer } from './PlayerCharacterViewer'

interface PlayerCode {
  id: string
  code: string
  era: string
  methods: string[]
  max_tries: number
  times_used: number
  assigned_at: string
}

interface PlayerCharacter {
  id: string
  name: string
  player_name: string
  age: number
  gender: string
  occupation_id: string
  era: string
  method: string
  status: string
  created_at: string
  characteristics: Record<string, number>
  luck: number
  derived: Record<string, unknown>
  occupation_skill_points: Record<string, number>
  personal_skill_points: Record<string, number>
  backstory: Record<string, unknown>
  equipment: string[]
  cash: string
  assets: string
  spending_level: string
  appearance: string
  invite_code?: string
}

export function PlayerDashboard() {
  const { player, token, logout } = usePlayerStore()

  const [codes, setCodes] = useState<PlayerCode[]>([])
  const [characters, setCharacters] = useState<PlayerCharacter[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const [codesData, charsData] = await Promise.all([
        playerGetCodes(token),
        playerGetCharacters(token),
      ])
      setCodes(codesData)
      setCharacters(charsData)
    } catch {
      // error silently
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const viewingCharacter = characters.find((c) => c.id === viewingId)

  if (viewingCharacter) {
    return (
      <PlayerCharacterViewer
        character={viewingCharacter}
        onBack={() => setViewingId(null)}
        onUpdate={(updated) => setCharacters((prev) => prev.map((c) => c.id === updated.id ? { ...c, ...updated } : c))}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif font-bold">
          Witaj, {player?.name ?? 'Graczu'}
        </h2>
        <Button size="sm" variant="ghost" onClick={logout}>
          <LogOut className="w-4 h-4" /> Wyloguj
        </Button>
      </div>

      {loading && <Loader2 className="w-6 h-6 animate-spin mx-auto" />}

      {/* Assigned codes */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-serif font-bold flex items-center gap-2">
            <KeyRound className="w-4 h-4" /> Moje kody ({codes.length})
          </h3>
          <Button size="sm" variant="ghost" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {!loading && codes.length === 0 && (
          <p className="text-sm text-coc-text-muted">Brak przypisanych kodów. Poproś Strażnika Tajemnic o kod zaproszenia.</p>
        )}

        <div className="space-y-2">
          {codes.map((code) => {
            const available = code.times_used < code.max_tries
            return (
              <div
                key={code.id}
                className="flex items-center justify-between p-3 bg-coc-surface-light rounded-lg border border-coc-border"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-coc-accent-light">{code.code}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(code.code)}
                      className="p-1 text-coc-text-muted hover:text-coc-text transition-colors cursor-pointer"
                    >
                      {copiedCode === code.code ? <Check className="w-3.5 h-3.5 text-coc-accent-light" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge>{ERA_LABELS[code.era as keyof typeof ERA_LABELS] ?? code.era}</Badge>
                    {code.methods?.map((m) => (
                      <Badge key={m} variant="default">{METHOD_LABELS[m as keyof typeof METHOD_LABELS] ?? m}</Badge>
                    ))}
                    <Badge variant={available ? 'success' : 'warning'}>
                      {code.times_used}/{code.max_tries} użyć
                    </Badge>
                  </div>
                </div>
                {available && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const base = window.location.pathname.replace(/\/player.*/, '')
                      window.location.href = `${base}/create?code=${code.code}`
                    }}
                  >
                    Użyj kodu
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Characters */}
      <Card>
        <h3 className="text-lg font-serif font-bold flex items-center gap-2 mb-3">
          <Users className="w-4 h-4" /> Moje postacie ({characters.length})
        </h3>

        {!loading && characters.length === 0 && (
          <p className="text-sm text-coc-text-muted">Brak postaci. Użyj kodu zaproszenia, aby stworzyć postać.</p>
        )}

        <div className="space-y-2">
          {characters.map((char) => (
            <div
              key={char.id}
              className="flex items-center justify-between p-3 bg-coc-surface-light rounded-lg border border-coc-border"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="font-medium">{char.name || 'Bez nazwy'}</div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant={char.status === 'submitted' ? 'success' : 'warning'}>
                    {char.status === 'submitted' ? 'Zatwierdzona' : 'Szkic'}
                  </Badge>
                  <Badge>{ERA_LABELS[char.era as keyof typeof ERA_LABELS] ?? char.era}</Badge>
                  {char.occupation_id && <Badge variant="default">{char.occupation_id}</Badge>}
                </div>
                <div className="text-xs text-coc-text-muted">
                  {char.age} lat, {char.gender} — utworzono {new Date(char.created_at).toLocaleDateString('pl')}
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setViewingId(char.id)}>
                <Eye className="w-3.5 h-3.5" /> Podgląd
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
