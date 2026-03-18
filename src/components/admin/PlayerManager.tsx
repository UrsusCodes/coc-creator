import { useState, useEffect, useCallback } from 'react'
import { Loader2, RefreshCw, Plus, Trash2, UserPlus, KeyRound, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'
import { useAdminStore } from '@/stores/adminStore'
import {
  adminGetPlayers, adminCreatePlayer, adminDeletePlayer, adminUpdatePlayer,
  adminGetPlayerCodes, adminAssignCode, adminUnassignCode, adminGetCodes,
} from '@/lib/admin'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface PlayerRow {
  id: string
  name: string
  login: string
  is_active: boolean
  created_at: string
  code_count: number
  character_count: number
}

interface CodeRow {
  id: string
  code: string
  era: string
  methods: string[]
  max_tries: number
  times_used: number
}

interface AssignedCode {
  id: string
  invite_code_id: string
  assigned_at: string
  invite_codes: CodeRow
}

export function PlayerManager() {
  const { password } = useAdminStore()
  const [players, setPlayers] = useState<PlayerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newLogin, setNewLogin] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [creating, setCreating] = useState(false)

  // Expanded player (codes)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [assignedCodes, setAssignedCodes] = useState<AssignedCode[]>([])
  const [allCodes, setAllCodes] = useState<CodeRow[]>([])
  const [codesLoading, setCodesLoading] = useState(false)
  const [assignCodeId, setAssignCodeId] = useState('')
  const [copiedLogin, setCopiedLogin] = useState<string | null>(null)

  const fetchPlayers = useCallback(async () => {
    if (!password) return
    setLoading(true)
    try {
      const data = await adminGetPlayers(password)
      setPlayers(data)
      setError(null)
    } catch {
      setError('Błąd pobierania graczy')
    } finally {
      setLoading(false)
    }
  }, [password])

  useEffect(() => { fetchPlayers() }, [fetchPlayers])

  const handleCreate = async () => {
    if (!password || !newName.trim() || !newLogin.trim() || !newPassword.trim()) return
    setCreating(true)
    try {
      const player = await adminCreatePlayer(password, {
        name: newName.trim(),
        login: newLogin.trim(),
        password: newPassword.trim(),
      })
      setPlayers((prev) => [{ ...player, code_count: 0, character_count: 0 }, ...prev])
      setNewName('')
      setNewLogin('')
      setNewPassword('')
      setShowCreate(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd tworzenia gracza')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!password || !confirm('Usunąć gracza? Jego postacie nie zostaną usunięte.')) return
    try {
      await adminDeletePlayer(password, id)
      setPlayers((prev) => prev.filter((p) => p.id !== id))
      if (expandedId === id) setExpandedId(null)
    } catch {
      setError('Błąd usuwania gracza')
    }
  }

  const handleToggleActive = async (player: PlayerRow) => {
    if (!password) return
    try {
      await adminUpdatePlayer(password, player.id, { is_active: !player.is_active })
      setPlayers((prev) => prev.map((p) => p.id === player.id ? { ...p, is_active: !p.is_active } : p))
    } catch {
      setError('Błąd aktualizacji gracza')
    }
  }

  const handleExpand = async (playerId: string) => {
    if (expandedId === playerId) {
      setExpandedId(null)
      return
    }
    setExpandedId(playerId)
    setCodesLoading(true)
    try {
      const [assigned, codes] = await Promise.all([
        adminGetPlayerCodes(password!, playerId),
        adminGetCodes(password!),
      ])
      setAssignedCodes(assigned)
      setAllCodes(codes)
    } catch {
      // error silently
    } finally {
      setCodesLoading(false)
    }
  }

  const handleAssignCode = async () => {
    if (!password || !expandedId || !assignCodeId) return
    try {
      await adminAssignCode(password, expandedId, assignCodeId)
      // Refresh
      const assigned = await adminGetPlayerCodes(password, expandedId)
      setAssignedCodes(assigned)
      setAssignCodeId('')
      setPlayers((prev) => prev.map((p) => p.id === expandedId ? { ...p, code_count: assigned.length } : p))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd przypisywania kodu')
    }
  }

  const handleUnassignCode = async (codeId: string) => {
    if (!password || !expandedId) return
    try {
      await adminUnassignCode(password, expandedId, codeId)
      setAssignedCodes((prev) => prev.filter((c) => c.invite_code_id !== codeId))
      setPlayers((prev) => prev.map((p) => p.id === expandedId ? { ...p, code_count: Math.max(0, p.code_count - 1) } : p))
    } catch {
      setError('Błąd usuwania przypisania')
    }
  }

  const handleCopyLogin = (login: string) => {
    navigator.clipboard.writeText(login)
    setCopiedLogin(login)
    setTimeout(() => setCopiedLogin(null), 2000)
  }

  // Filter unassigned codes for dropdown
  const assignedCodeIds = new Set(assignedCodes.map((c) => c.invite_code_id))
  const availableCodes = allCodes.filter((c) => !assignedCodeIds.has(c.id))

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-serif font-bold">Gracze ({players.length})</h3>
        <div className="flex gap-1">
          <Button size="sm" variant="secondary" onClick={() => setShowCreate(!showCreate)}>
            <UserPlus className="w-4 h-4" /> Nowy gracz
          </Button>
          <Button size="sm" variant="ghost" onClick={fetchPlayers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-coc-danger mb-3">{error}</p>}

      {/* Create form */}
      {showCreate && (
        <div className="mb-4 p-3 bg-coc-surface-light border border-coc-border rounded-lg space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Imię / nick"
              className="px-3 py-2 bg-coc-surface border border-coc-border rounded-lg text-sm text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light"
            />
            <input
              type="text"
              value={newLogin}
              onChange={(e) => setNewLogin(e.target.value)}
              placeholder="Login"
              className="px-3 py-2 bg-coc-surface border border-coc-border rounded-lg text-sm text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light"
            />
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Hasło"
              className="px-3 py-2 bg-coc-surface border border-coc-border rounded-lg text-sm text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light"
            />
          </div>
          <Button size="sm" onClick={handleCreate} disabled={creating || !newName.trim() || !newLogin.trim() || !newPassword.trim()}>
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Utwórz
          </Button>
        </div>
      )}

      {loading && <Loader2 className="w-6 h-6 animate-spin mx-auto" />}

      {!loading && players.length === 0 && (
        <p className="text-sm text-coc-text-muted">Brak graczy.</p>
      )}

      <div className="space-y-2">
        {players.map((player) => (
          <div key={player.id}>
            <div className="flex items-center justify-between p-3 bg-coc-surface-light rounded-lg border border-coc-border">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{player.name}</span>
                  <span className="text-sm text-coc-text-muted font-mono">{player.login}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyLogin(player.login)}
                    className="p-0.5 text-coc-text-muted hover:text-coc-text transition-colors cursor-pointer"
                  >
                    {copiedLogin === player.login ? <Check className="w-3 h-3 text-coc-accent-light" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant={player.is_active ? 'success' : 'warning'}>
                    {player.is_active ? 'Aktywny' : 'Nieaktywny'}
                  </Badge>
                  <Badge variant="default">{player.code_count} kodów</Badge>
                  <Badge variant="default">{player.character_count} postaci</Badge>
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="secondary" onClick={() => handleExpand(player.id)}>
                  <KeyRound className="w-3.5 h-3.5" />
                  {expandedId === player.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleToggleActive(player)}>
                  {player.is_active ? 'Dezaktywuj' : 'Aktywuj'}
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(player.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Expanded: assigned codes */}
            {expandedId === player.id && (
              <div className="ml-4 mt-1 p-3 bg-coc-surface border border-coc-border rounded-lg space-y-2">
                {codesLoading && <Loader2 className="w-4 h-4 animate-spin" />}

                {!codesLoading && assignedCodes.length === 0 && (
                  <p className="text-sm text-coc-text-muted">Brak przypisanych kodów.</p>
                )}

                {assignedCodes.map((ac) => (
                  <div key={ac.invite_code_id} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-coc-accent-light">{ac.invite_codes?.code ?? ac.invite_code_id}</span>
                    <Button size="sm" variant="ghost" onClick={() => handleUnassignCode(ac.invite_code_id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}

                {/* Assign new code */}
                {!codesLoading && (
                  <div className="flex gap-2 pt-2 border-t border-coc-border">
                    <select
                      value={assignCodeId}
                      onChange={(e) => setAssignCodeId(e.target.value)}
                      className="flex-1 px-2 py-1 bg-coc-surface-light border border-coc-border rounded text-sm text-coc-text focus:outline-none focus:border-coc-accent-light"
                    >
                      <option value="">Wybierz kod...</option>
                      {availableCodes.map((c) => (
                        <option key={c.id} value={c.id}>{c.code} ({c.era})</option>
                      ))}
                    </select>
                    <Button size="sm" onClick={handleAssignCode} disabled={!assignCodeId}>
                      <Plus className="w-3 h-3" /> Przypisz
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
