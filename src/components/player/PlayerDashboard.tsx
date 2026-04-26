import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, KeyRound, Users, Loader2, RefreshCw, Copy, Check, Eye, PenLine, PlayCircle } from 'lucide-react'
import { usePlayerStore } from '@/stores/playerStore'
import { useCharacterStore } from '@/stores/characterStore'
import { playerGetCodes, playerGetCharacters, playerGetEditPermissions, playerGetCharacter } from '@/lib/player'
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
  created_by?: string
  draft_locked_step?: number | null
  draft_step?: number | null
  perks?: string[]
  max_skill_value?: number
  invite_code_id?: string
  distinguisher?: string
}

interface EditPermission {
  id: string
  character_id: string
  edit_mode: 'lore' | 'standard' | 'full'
  expires_at: string | null  // null = until disabled
  character_name?: string
}

export function PlayerDashboard() {
  const { player, token, logout } = usePlayerStore()
  const loadForPlayerEdit = useCharacterStore((s) => s.loadForPlayerEdit)
  const loadDraftForContinuation = useCharacterStore((s) => s.loadDraftForContinuation)
  const navigate = useNavigate()

  const [codes, setCodes] = useState<PlayerCode[]>([])
  const [characters, setCharacters] = useState<PlayerCharacter[]>([])
  const [editPermissions, setEditPermissions] = useState<EditPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [fetchError, setFetchError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setFetchError(null)
    try {
      const [codesData, charsData, permsData] = await Promise.all([
        playerGetCodes(token),
        playerGetCharacters(token),
        playerGetEditPermissions(token).catch(() => []),
      ])
      setCodes(codesData)
      setCharacters(charsData)
      setEditPermissions(permsData)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Błąd połączenia'
      // Token expired or invalid → auto-logout
      if (msg.includes('401') || msg.includes('expired') || msg.includes('Unauthorized')) {
        logout()
        return
      }
      setFetchError(msg)
    } finally {
      setLoading(false)
    }
  }, [token, logout])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const getEditPermission = (charId: string) => {
    return editPermissions.find(
      (p) => p.character_id === charId && (p.expires_at === null || new Date(p.expires_at) > new Date())
    )
  }

  const formatTimeLeft = (expiresAt: string | null) => {
    if (expiresAt === null) return 'do odwołania'
    const diff = new Date(expiresAt).getTime() - Date.now()
    if (diff <= 0) return 'wygasło'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}d`
  }

  const getEditLevelLabel = (mode: 'lore' | 'standard' | 'full') => {
    if (mode === 'lore') return 'Lore'
    if (mode === 'standard') return 'Standard'
    return 'Pełny'
  }

  const hasPendingEdit = (charId: string) => {
    return characters.some(
      (c) => c.id === charId && (c as unknown as Record<string, unknown>).pending_edit === true
    )
  }

  const isDraft = (char: PlayerCharacter) =>
    (char.created_by === 'admin_draft' || char.created_by === 'player') && char.status === 'draft'

  const handleEditCharacter = async (char: PlayerCharacter) => {
    if (!token) return
    setActionLoading(char.id)
    try {
      const perm = getEditPermission(char.id)
      if (!perm) return
      const fullChar = await playerGetCharacter(token, char.id)
      loadForPlayerEdit({
        characterId: char.id,
        editMode: perm.edit_mode,
        character: fullChar,
        era: char.era,
        perks: char.perks ?? [],
        maxSkillValue: char.max_skill_value ?? 80,
      })
      navigate('/create')
    } catch {
      // error silently
    } finally {
      setActionLoading(null)
    }
  }

  const handleContinueDraft = async (char: PlayerCharacter) => {
    if (!token) return
    setActionLoading(char.id)
    try {
      const fullChar = await playerGetCharacter(token, char.id)
      // Player-created drafts: no locked steps, resume from draft_step
      // Admin-created drafts: lock steps up to draft_locked_step
      const isPlayerDraft = char.created_by === 'player'
      const lockedStep = isPlayerDraft ? -1 : (char.draft_locked_step ?? 0)
      loadDraftForContinuation({
        character: fullChar,
        era: char.era,
        perks: char.perks ?? [],
        maxSkillValue: char.max_skill_value ?? 80,
        lockedStep,
        inviteCodeId: char.invite_code_id ?? '',
        inviteCode: char.invite_code ?? '',
        method: char.method,
      })
      navigate('/create')
    } catch {
      // error silently
    } finally {
      setActionLoading(null)
    }
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

      {fetchError && (
        <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-sm text-red-300">
          Błąd ładowania danych: {fetchError}
        </div>
      )}

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
          {characters.map((char) => {
            const perm = getEditPermission(char.id)
            const charIsDraft = isDraft(char)
            const isActionLoading = actionLoading === char.id

            return (
              <div
                key={char.id}
                className="flex items-center justify-between p-3 bg-coc-surface-light rounded-lg border border-coc-border"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="font-medium">
                    {char.name || 'Bez nazwy'}
                    {char.distinguisher && <span className="text-coc-accent-light font-normal text-sm ml-2">— {char.distinguisher}</span>}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant={char.status === 'submitted' ? 'success' : 'warning'}>
                      {char.status === 'submitted' ? 'Zatwierdzona' : 'Szkic'}
                    </Badge>
                    <Badge>{ERA_LABELS[char.era as keyof typeof ERA_LABELS] ?? char.era}</Badge>
                    {char.occupation_id && <Badge variant="default">{char.occupation_id}</Badge>}
                    {perm && (
                      <>
                        <Badge variant="warning">
                          Edycja: jeszcze {formatTimeLeft(perm.expires_at)}
                        </Badge>
                        <Badge variant="default">
                          {getEditLevelLabel(perm.edit_mode)}
                        </Badge>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-coc-text-muted">
                    {char.age} lat, {char.gender} — utworzono {new Date(char.created_at).toLocaleDateString('pl')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {charIsDraft && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleContinueDraft(char)}
                      disabled={isActionLoading}
                    >
                      {isActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
                      Kontynuuj tworzenie
                    </Button>
                  )}
                  {perm && !charIsDraft && (
                    hasPendingEdit(char.id) ? (
                      <Badge variant="warning">Zmiana oczekuje na zatwierdzenie</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEditCharacter(char)}
                        disabled={isActionLoading}
                      >
                        {isActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PenLine className="w-3.5 h-3.5" />}
                        Edytuj
                      </Button>
                    )
                  )}
                  <Button size="sm" variant="secondary" onClick={() => setViewingId(char.id)}>
                    <Eye className="w-3.5 h-3.5" /> Podgląd
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
