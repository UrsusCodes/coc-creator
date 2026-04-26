import { useState, useEffect, useCallback, useMemo } from 'react'
import { Eye, Trash2, Loader2, RefreshCw, Search } from 'lucide-react'
import { useAdminStore } from '@/stores/adminStore'
import { adminGetCharacters, adminDeleteCharacter } from '@/lib/admin'
import { ERA_LABELS, METHOD_LABELS } from '@/types/common'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CharacterViewer } from './CharacterViewer'
import { QuickCreateCharacter } from './QuickCreateCharacter'

interface CharacterRow {
  id: string
  name: string
  age: number
  gender: string
  occupation_id: string
  era: string
  method: string
  status: string
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
  created_at: string
  player_name?: string
  invite_code?: string
  admin_notes?: string
  distinguisher?: string
}

export function CharacterList() {
  const { password } = useAdminStore()
  const [characters, setCharacters] = useState<CharacterRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [autoEdit, setAutoEdit] = useState(false)
  const [search, setSearch] = useState('')

  const fetchCharacters = useCallback(async () => {
    if (!password) return
    setLoading(true)
    try {
      const data = await adminGetCharacters(password)
      setCharacters(data)
      setError(null)
    } catch {
      setError('Błąd pobierania postaci.')
    } finally {
      setLoading(false)
    }
  }, [password])

  useEffect(() => { fetchCharacters() }, [fetchCharacters])

  const handleDelete = async (id: string) => {
    if (!password || !confirm('Czy na pewno chcesz usunąć tę postać?')) return
    try {
      await adminDeleteCharacter(password, id)
      setCharacters((prev) => prev.filter((c) => c.id !== id))
      if (viewingId === id) setViewingId(null)
    } catch {
      setError('Błąd usuwania postaci.')
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return characters
    const q = search.toLowerCase()
    return characters.filter((c) =>
      c.name?.toLowerCase().includes(q) ||
      c.player_name?.toLowerCase().includes(q) ||
      c.invite_code?.toLowerCase().includes(q) ||
      c.admin_notes?.toLowerCase().includes(q)
    )
  }, [characters, search])

  const handleQuickCreated = (charData: { id: string } & Record<string, unknown>) => {
    const newChar = charData as unknown as CharacterRow
    setCharacters((prev) => [newChar, ...prev])
    setViewingId(newChar.id)
    setAutoEdit(true)
  }

  const viewingCharacter = characters.find((c) => c.id === viewingId)

  if (viewingCharacter) {
    return (
      <CharacterViewer
        character={viewingCharacter}
        onBack={() => { setViewingId(null); setAutoEdit(false) }}
        onUpdate={(updated) => setCharacters((prev) => prev.map((c) => c.id === updated.id ? { ...c, ...updated } : c))}
        initialEditMode={autoEdit}
      />
    )
  }

  return (
    <div className="space-y-4">
    <QuickCreateCharacter onCreated={handleQuickCreated} />
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-serif font-bold">Postacie ({characters.length})</h3>
        <Button size="sm" variant="ghost" onClick={fetchCharacters} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-coc-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Szukaj po nazwie, graczu, kodzie, notatkach..."
          className="w-full pl-9 pr-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light transition-colors"
        />
      </div>

      {error && <p className="text-sm text-coc-danger mb-3">{error}</p>}
      {loading && <Loader2 className="w-6 h-6 animate-spin mx-auto" />}

      {!loading && filtered.length === 0 && (
        <p className="text-sm text-coc-text-muted">{search ? 'Brak wyników.' : 'Brak postaci.'}</p>
      )}

      <div className="space-y-2">
        {filtered.map((char) => (
          <div
            key={char.id}
            className="flex items-center justify-between p-3 bg-coc-surface-light rounded-lg border border-coc-border"
          >
            <div className="space-y-1 min-w-0 flex-1">
              <div className="font-medium">
                {char.name || 'Bez nazwy'}
                {char.player_name && <span className="text-coc-text-muted font-normal text-sm"> ({char.player_name})</span>}
                {char.distinguisher && <span className="text-coc-accent-light font-normal text-sm ml-2">— {char.distinguisher}</span>}
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant={char.status === 'submitted' ? 'success' : 'warning'}>
                  {char.status === 'submitted' ? 'Zatwierdzona' : 'Szkic'}
                </Badge>
                {char.invite_code && <Badge variant="default">{char.invite_code}</Badge>}
                <Badge>{ERA_LABELS[char.era as keyof typeof ERA_LABELS] ?? char.era}</Badge>
                <Badge>{METHOD_LABELS[char.method as keyof typeof METHOD_LABELS] ?? char.method}</Badge>
                {char.occupation_id && <Badge variant="default">{char.occupation_id}</Badge>}
              </div>
              <div className="text-xs text-coc-text-muted">
                {char.age} lat, {char.gender} — utworzono {new Date(char.created_at).toLocaleDateString('pl')}
              </div>
              {char.admin_notes && (
                <div className="text-xs text-coc-text-muted truncate max-w-[300px]" title={char.admin_notes}>
                  Notatki: {char.admin_notes}
                </div>
              )}
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="secondary" onClick={() => setViewingId(char.id)}>
                <Eye className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="danger" onClick={() => handleDelete(char.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
    </div>
  )
}
