import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Copy,
  Trash2,
  Plus,
  Loader2,
  RefreshCw,
  Pencil,
  Sparkles,
  Trash,
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-react'
import { useAdminStore } from '@/stores/adminStore'
import {
  adminGetCodes,
  adminCreateCode,
  adminDeleteCode,
  adminUpdateInviteCode,
  adminCleanupCodes,
  adminGrantReroll,
  adminGetCharacters,
  adminGetPlayers,
} from '@/lib/admin'
import { generateInviteCode } from '@/lib/inviteCode'
import { ERA_LABELS, METHOD_LABELS, type Era, type CreationMethod } from '@/types/common'
import { PERKS } from '@/data/perks'
import type { InviteCode, InviteCodeStatus } from '@/types/invite'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'

const ALL_METHODS: CreationMethod[] = ['dice', 'point_buy', 'direct']

interface CharacterLite {
  id: string
  invite_code_id?: string
  status: string
  distinguisher?: string
  rerolls_remaining?: number
  name?: string
  player_name?: string
}

interface PlayerLite {
  id: string
  name: string
  login: string
}

type FilterMode = 'active' | 'unused' | 'started'

function statusOf(char: CharacterLite | undefined): InviteCodeStatus {
  if (!char) return 'unused'
  if (char.status === 'submitted') return 'finished'
  return 'started'
}

const STATUS_LABELS: Record<InviteCodeStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' }> = {
  unused: { label: 'Niewykorzystany', variant: 'default' },
  started: { label: 'W trakcie', variant: 'warning' },
  finished: { label: 'Zakończony', variant: 'success' },
}

interface CodeFormData {
  label: string
  methods: CreationMethod[]
  era: Era
  rerollBudget: number
  perks: string[]
  maxSkillValue: number
  assignedPlayerId: string
}

const emptyForm: CodeFormData = {
  label: '',
  methods: ['dice'],
  era: 'classic_1920s',
  rerollBudget: 0,
  perks: [],
  maxSkillValue: 80,
  assignedPlayerId: '',
}

function CodeForm({
  value,
  onChange,
  players,
}: {
  value: CodeFormData
  onChange: (next: CodeFormData) => void
  players: PlayerLite[]
}) {
  const toggleMethod = (m: CreationMethod) => {
    const next = value.methods.includes(m)
      ? value.methods.length === 1
        ? value.methods
        : value.methods.filter((x) => x !== m)
      : [...value.methods, m]
    onChange({ ...value, methods: next })
  }
  const togglePerk = (id: string) => {
    const next = value.perks.includes(id)
      ? value.perks.filter((p) => p !== id)
      : [...value.perks, id]
    onChange({ ...value, perks: next })
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-coc-text-muted mb-1">Etykieta (opcjonalna)</label>
        <input
          type="text"
          value={value.label}
          onChange={(e) => onChange({ ...value, label: e.target.value })}
          placeholder="np. „Dla Marka — kampania jesień 2026"
          className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-coc-text focus:outline-none focus:border-coc-accent-light"
        />
        <p className="text-xs text-coc-text-muted mt-1">Tylko do wewnętrznego użytku — gracz jej nie widzi.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-coc-text-muted mb-1">Dozwolone metody</label>
        <div className="flex flex-wrap gap-3">
          {ALL_METHODS.map((m) => (
            <label key={m} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value.methods.includes(m)}
                onChange={() => toggleMethod(m)}
                className="accent-coc-accent"
              />
              <span className="text-sm">{METHOD_LABELS[m]}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          label="Era"
          value={value.era}
          onChange={(e) => onChange({ ...value, era: e.target.value as Era })}
          options={[
            { value: 'classic_1920s', label: ERA_LABELS.classic_1920s },
            { value: 'modern', label: ERA_LABELS.modern },
            { value: 'gaslight', label: ERA_LABELS.gaslight },
          ]}
        />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-coc-text-muted">Budżet przerzutów</label>
          <input
            type="number"
            min={0}
            max={10}
            value={value.rerollBudget}
            onChange={(e) => onChange({ ...value, rerollBudget: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-coc-text focus:outline-none focus:border-coc-accent-light"
          />
          <p className="text-xs text-coc-text-muted">Liczba przerzutów cech, które gracz może użyć.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-coc-text-muted">Maks. wartość umiejętności</label>
          <input
            type="number"
            min={50}
            max={99}
            value={value.maxSkillValue}
            onChange={(e) => onChange({ ...value, maxSkillValue: parseInt(e.target.value) || 80 })}
            className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-coc-text focus:outline-none focus:border-coc-accent-light"
          />
        </div>
        <Select
          label="Przypisany gracz (opcjonalny)"
          value={value.assignedPlayerId}
          onChange={(e) => onChange({ ...value, assignedPlayerId: e.target.value })}
          options={[
            { value: '', label: '— brak —' },
            ...players.map((p) => ({ value: p.id, label: `${p.name} (${p.login})` })),
          ]}
        />
      </div>

      {PERKS.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-coc-text-muted mb-1">Perki</label>
          <div className="space-y-2">
            {PERKS.map((perk) => (
              <label key={perk.id} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value.perks.includes(perk.id)}
                  onChange={() => togglePerk(perk.id)}
                  className="accent-coc-accent mt-0.5"
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
    </div>
  )
}

interface CleanupPreview {
  count: number
  codes: { id: string; code: string; label?: string }[]
}

export function InviteCodeManager() {
  const { password } = useAdminStore()
  const [codes, setCodes] = useState<InviteCode[]>([])
  const [characters, setCharacters] = useState<CharacterLite[]>([])
  const [players, setPlayers] = useState<PlayerLite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [createForm, setCreateForm] = useState<CodeFormData>(emptyForm)
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterMode>('active')
  const [showFinished, setShowFinished] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<CodeFormData>(emptyForm)
  const [savingEdit, setSavingEdit] = useState(false)

  const [cleanupPreview, setCleanupPreview] = useState<CleanupPreview | null>(null)
  const [cleanupBusy, setCleanupBusy] = useState(false)

  const fetchAll = useCallback(async () => {
    if (!password) return
    setLoading(true)
    try {
      const [codesData, charsData, playersData] = await Promise.all([
        adminGetCodes(password),
        adminGetCharacters(password).catch(() => []),
        adminGetPlayers(password).catch(() => []),
      ])
      setCodes(codesData as InviteCode[])
      setCharacters(charsData as CharacterLite[])
      setPlayers((playersData as PlayerLite[]) ?? [])
      setError(null)
    } catch {
      setError('Błąd pobierania danych.')
    } finally {
      setLoading(false)
    }
  }, [password])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Joined view ────────────────────────────────────────────────
  const charByCode = useMemo(() => {
    const map = new Map<string, CharacterLite>()
    for (const c of characters) {
      if (!c.invite_code_id) continue
      // Prefer non-submitted (draft in progress) then submitted
      const existing = map.get(c.invite_code_id)
      if (!existing) {
        map.set(c.invite_code_id, c)
      } else if (existing.status === 'submitted' && c.status !== 'submitted') {
        map.set(c.invite_code_id, c)
      }
    }
    return map
  }, [characters])

  const playerById = useMemo(() => {
    const map = new Map<string, PlayerLite>()
    for (const p of players) map.set(p.id, p)
    return map
  }, [players])

  const enriched = useMemo(() => {
    return codes.map((code) => {
      const char = charByCode.get(code.id)
      return {
        code,
        character: char,
        status: statusOf(char),
        assignee: code.assigned_player_id ? playerById.get(code.assigned_player_id) : undefined,
      }
    })
  }, [codes, charByCode, playerById])

  const visible = useMemo(() => {
    return enriched.filter(({ status }) => {
      if (filter === 'unused') return status === 'unused'
      if (filter === 'started') return status === 'started'
      // 'active' = unused + started (not finished)
      return status !== 'finished'
    })
  }, [enriched, filter])

  const finished = useMemo(() => enriched.filter(({ status }) => status === 'finished'), [enriched])

  // ── Create code ────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!password || createForm.methods.length === 0) return
    setCreating(true)
    try {
      const code = generateInviteCode()
      const created = await adminCreateCode(password, {
        code,
        methods: createForm.methods,
        era: createForm.era,
        max_tries: 1,
        perks: createForm.perks,
        max_skill_value: createForm.maxSkillValue,
        label: createForm.label || undefined,
        reroll_budget: createForm.rerollBudget,
        assigned_player_id: createForm.assignedPlayerId || null,
      })
      setCodes((prev) => [created, ...prev])
      setCreateForm(emptyForm)
    } catch {
      setError('Błąd tworzenia kodu.')
    } finally {
      setCreating(false)
    }
  }

  // ── Delete ─────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!password) return
    if (!confirm('Usunąć kod? Tej operacji nie można cofnąć.')) return
    try {
      await adminDeleteCode(password, id)
      setCodes((prev) => prev.filter((c) => c.id !== id))
    } catch {
      setError('Błąd usuwania kodu.')
    }
  }

  // ── Copy code text ─────────────────────────────────────────────
  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // ── Edit ───────────────────────────────────────────────────────
  const startEdit = (code: InviteCode) => {
    setEditingId(code.id)
    setEditForm({
      label: code.label ?? '',
      methods: code.methods ?? [code.method],
      era: code.era,
      rerollBudget: code.reroll_budget ?? 0,
      perks: code.perks ?? [],
      maxSkillValue: code.max_skill_value ?? 80,
      assignedPlayerId: code.assigned_player_id ?? '',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm(emptyForm)
  }

  const handleSaveEdit = async () => {
    if (!password || !editingId) return
    setSavingEdit(true)
    try {
      const updated = await adminUpdateInviteCode(password, editingId, {
        label: editForm.label,
        methods: editForm.methods,
        era: editForm.era,
        reroll_budget: editForm.rerollBudget,
        perks: editForm.perks,
        max_skill_value: editForm.maxSkillValue,
        assigned_player_id: editForm.assignedPlayerId || null,
      })
      setCodes((prev) => prev.map((c) => (c.id === editingId ? { ...c, ...(updated as InviteCode) } : c)))
      cancelEdit()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Błąd zapisu zmian.')
    } finally {
      setSavingEdit(false)
    }
  }

  // ── Grant reroll ───────────────────────────────────────────────
  const handleGrantReroll = async (charId: string) => {
    if (!password) return
    try {
      const result = await adminGrantReroll(password, charId, 1)
      const newCount = result.new_remaining ?? result.rerolls_remaining ?? 0
      setCharacters((prev) =>
        prev.map((c) => (c.id === charId ? { ...c, rerolls_remaining: newCount } : c)),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Błąd przyznawania przerzutu.')
    }
  }

  // ── Cleanup ────────────────────────────────────────────────────
  const handleCleanupPreview = async () => {
    if (!password) return
    setCleanupBusy(true)
    setError(null)
    try {
      const result = await adminCleanupCodes(password, { dryRun: true })
      const list = (result.to_delete ?? result.codes ?? []) as { id: string; code: string; label?: string }[]
      setCleanupPreview({ count: list.length, codes: list })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Błąd preview cleanup.')
    } finally {
      setCleanupBusy(false)
    }
  }

  const handleCleanupConfirm = async () => {
    if (!password || !cleanupPreview) return
    setCleanupBusy(true)
    try {
      await adminCleanupCodes(password, { dryRun: false })
      setCleanupPreview(null)
      await fetchAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Błąd cleanup.')
    } finally {
      setCleanupBusy(false)
    }
  }

  // ── Render row ─────────────────────────────────────────────────
  const renderRow = ({ code, character, status, assignee }: typeof enriched[number]) => {
    const methods = code.methods ?? [code.method]
    const perks = code.perks ?? []
    const statusInfo = STATUS_LABELS[status]
    const distinguisher = character?.distinguisher
    const rerollsLeft = character?.rerolls_remaining ?? code.reroll_budget ?? 0
    const isEditing = editingId === code.id

    if (isEditing) {
      return (
        <div key={code.id} className="p-4 bg-coc-surface-light rounded-lg border border-coc-accent/40 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-mono font-bold tracking-wider">{code.code}</div>
            <button
              type="button"
              onClick={cancelEdit}
              className="text-coc-text-muted hover:text-coc-text"
              title="Zamknij"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <CodeForm value={editForm} onChange={setEditForm} players={players} />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={cancelEdit} disabled={savingEdit}>
              Anuluj
            </Button>
            <Button size="sm" onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Zapisz'}
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div
        key={code.id}
        className="flex items-start justify-between p-3 bg-coc-surface-light rounded-lg border border-coc-border gap-3"
      >
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold tracking-wider">{code.code}</span>
            <button
              type="button"
              onClick={() => handleCopy(code.code, code.id)}
              className="text-coc-text-muted hover:text-coc-accent-light cursor-pointer"
              title="Skopiuj kod"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            {copiedId === code.id && (
              <span className="text-xs text-coc-accent-light">Skopiowano!</span>
            )}
            {code.label && <span className="text-sm text-coc-text-muted truncate">— {code.label}</span>}
          </div>
          <div className="flex flex-wrap gap-1">
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            {assignee && <Badge variant="default">{assignee.name}</Badge>}
            <Badge>{ERA_LABELS[code.era]}</Badge>
            {methods.map((m) => (
              <Badge key={m} variant="success">{METHOD_LABELS[m as CreationMethod]}</Badge>
            ))}
            <Badge variant={rerollsLeft > 0 ? 'warning' : 'default'}>
              Przerzuty: {rerollsLeft}
            </Badge>
            {distinguisher && (
              <Badge variant="default">„{distinguisher}"</Badge>
            )}
            {!code.is_active && <Badge variant="danger">Nieaktywny</Badge>}
            {code.max_skill_value && code.max_skill_value !== 80 && (
              <Badge variant="warning">Maks. um.: {code.max_skill_value}</Badge>
            )}
            {perks.map((p) => (
              <Badge key={p} variant="warning">{PERKS.find((pk) => pk.id === p)?.name ?? p}</Badge>
            ))}
          </div>
          <div className="text-xs text-coc-text-muted">
            Utworzono: {new Date(code.created_at).toLocaleDateString('pl')}
            {character?.player_name && ` · Gracz: ${character.player_name}`}
            {character?.name && ` · Postać: ${character.name}`}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Button size="sm" variant="ghost" onClick={() => startEdit(code)}>
            <Pencil className="w-3.5 h-3.5" /> Edytuj
          </Button>
          {character && status !== 'unused' && (
            <Button size="sm" variant="ghost" onClick={() => handleGrantReroll(character.id)}>
              <Sparkles className="w-3.5 h-3.5" /> +1 przerzut
            </Button>
          )}
          <Button size="sm" variant="danger" onClick={() => handleDelete(code.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Create */}
      <Card title="Nowy kod zaproszenia">
        <CodeForm value={createForm} onChange={setCreateForm} players={players} />
        <div className="mt-4">
          <Button onClick={handleCreate} disabled={creating || createForm.methods.length === 0}>
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Wygeneruj kod
          </Button>
        </div>
      </Card>

      {/* List */}
      <Card>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-lg font-serif font-bold">Kody zaproszenia ({enriched.length})</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-coc-surface-light rounded-lg p-1">
              {(['active', 'unused', 'started'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setFilter(m)}
                  className={`px-2 py-1 text-xs rounded ${
                    filter === m
                      ? 'bg-coc-accent/20 text-coc-accent-light'
                      : 'text-coc-text-muted hover:text-coc-text'
                  }`}
                >
                  {m === 'active' ? 'Aktywne' : m === 'unused' ? 'Niewykorzystane' : 'W trakcie'}
                </button>
              ))}
            </div>
            <Button size="sm" variant="ghost" onClick={handleCleanupPreview} disabled={cleanupBusy} title="Sprzątanie nieużywanych kodów">
              {cleanupBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash className="w-4 h-4" />}
              Sprzątanie
            </Button>
            <Button size="sm" variant="ghost" onClick={fetchAll} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-coc-danger mb-3">{error}</p>}

        {/* Cleanup preview modal */}
        {cleanupPreview && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-amber-300">
                Cleanup: do usunięcia {cleanupPreview.count} {cleanupPreview.count === 1 ? 'kod' : 'kodów'}
              </div>
              <button
                type="button"
                onClick={() => setCleanupPreview(null)}
                className="text-coc-text-muted hover:text-coc-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-coc-text-muted mb-2">
              Operacja usunie wszystkie kody, do których nie jest przypisana żadna postać. Kody
              powiązane z zatwierdzonymi postaciami pozostają nietknięte.
            </p>
            {cleanupPreview.codes.length > 0 && (
              <div className="max-h-32 overflow-y-auto bg-coc-surface-light rounded p-2 mb-2 text-xs space-y-0.5">
                {cleanupPreview.codes.map((c) => (
                  <div key={c.id} className="font-mono">
                    {c.code}{c.label ? ` — ${c.label}` : ''}
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="secondary" onClick={() => setCleanupPreview(null)} disabled={cleanupBusy}>
                Anuluj
              </Button>
              <Button size="sm" variant="danger" onClick={handleCleanupConfirm} disabled={cleanupBusy || cleanupPreview.count === 0}>
                {cleanupBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Potwierdź usunięcie'}
              </Button>
            </div>
          </div>
        )}

        {visible.length === 0 && !loading && (
          <p className="text-sm text-coc-text-muted">Brak kodów dla tego filtra.</p>
        )}

        <div className="space-y-2">{visible.map(renderRow)}</div>

        {/* Collapsible finished */}
        {finished.length > 0 && (
          <div className="mt-4 border-t border-coc-border pt-3">
            <button
              type="button"
              onClick={() => setShowFinished((s) => !s)}
              className="flex items-center gap-1.5 text-sm text-coc-text-muted hover:text-coc-text cursor-pointer"
            >
              {showFinished ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              Kody zużyte/zakończone ({finished.length})
            </button>
            {showFinished && (
              <div className="space-y-2 mt-3">{finished.map(renderRow)}</div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
