import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Loader2, Pencil, X, Link, Copy, Check, Trash2, History, Clock, UserPlus, Shield } from 'lucide-react'
import { useAdminStore } from '@/stores/adminStore'
import {
  adminUpdateCharacter, adminGetCharacterHistory, adminCreateShareToken, adminGetShareTokens,
  adminDeleteShareToken, adminCreateEditPermission, adminRevokeEditPermission,
  adminAssignCharacterToPlayer, adminGetPlayers,
} from '@/lib/admin'
import { getSkillBase } from '@/data/skills'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ExportButtons } from '@/components/shared/ExportButtons'
import { CharacterSheet, type CharacterSheetData } from '@/components/shared/CharacterSheet'
import { CharacterHistory } from '@/components/shared/CharacterHistory'
import { BasicInfoEditor } from './edit/BasicInfoEditor'
import { CharacteristicsEditor } from './edit/CharacteristicsEditor'
import { DerivedEditor } from './edit/DerivedEditor'
import { SkillsEditor } from './edit/SkillsEditor'
import { BackstoryEditor } from './edit/BackstoryEditor'
import { EquipmentEditor } from './edit/EquipmentEditor'
import { SessionsEditor } from './edit/SessionsEditor'
import { ArtPromptSection } from './ArtPromptSection'
import type { ShareToken, HistoryEntry } from '@/types/character'

interface CharacterViewerProps {
  character: CharacterSheetData
  onBack: () => void
  onUpdate?: (updated: Partial<CharacterSheetData> & { id: string }) => void
  initialEditMode?: boolean
}

export function CharacterViewer({ character: char, onBack, onUpdate, initialEditMode }: CharacterViewerProps) {
  const { password } = useAdminStore()

  // Edit mode
  const [editMode, setEditMode] = useState(initialEditMode ?? false)
  const [editData, setEditData] = useState<CharacterSheetData>(structuredClone(char))
  const [changeComment, setChangeComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Share tokens
  const [tokens, setTokens] = useState<ShareToken[]>([])
  const [tokensLoading, setTokensLoading] = useState(false)
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null)
  const [showTokens, setShowTokens] = useState(false)

  // History
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)


  // Admin notes (independent of edit mode)
  const [notes, setNotes] = useState(char.admin_notes ?? '')
  const [notesSaving, setNotesSaving] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)

  // Edit permissions (player-centric)
  const [showEditPermissions, setShowEditPermissions] = useState(false)
  const [editPermMode, setEditPermMode] = useState<'lore' | 'standard' | 'full'>('standard')
  const [editPermDuration, setEditPermDuration] = useState<string>('24h')
  const [editPermResult, setEditPermResult] = useState<{ edit_mode: string; expires_at: string | null } | null>(null)
  const [editPermLoading, setEditPermLoading] = useState(false)

  // Player assignment
  const [showPlayerAssignment, setShowPlayerAssignment] = useState(false)
  const [players, setPlayers] = useState<{ id: string; name: string; login: string }[]>([])
  const [playersLoading, setPlayersLoading] = useState(false)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('')
  const [assignLoading, setAssignLoading] = useState(false)

  useEffect(() => {
    setEditData(structuredClone(char))
    setNotes(char.admin_notes ?? '')
  }, [char])

  // --- Edit mode handlers ---

  const handleFieldChange = (field: string, value: unknown) => {
    setEditData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCharacteristicChange = (key: string, value: number) => {
    setEditData((prev) => ({
      ...prev,
      characteristics: { ...prev.characteristics, [key]: value },
    }))
  }

  const handleDerivedChange = (field: string, value: number | string) => {
    setEditData((prev) => ({
      ...prev,
      derived: { ...prev.derived, [field]: value },
    }))
  }

  const resolveBase = (skillId: string) => {
    const base = getSkillBase(skillId)
    if (base === 'half_dex') return Math.floor((editData.characteristics['DEX'] ?? 0) / 2)
    if (base === 'edu') return editData.characteristics['EDU'] ?? 0
    return base
  }

  const handleSkillChange = (skillId: string, totalValue: number) => {
    const baseVal = resolveBase(skillId)
    const points = Math.max(0, totalValue - baseVal)
    setEditData((prev) => {
      // Remove personal contribution so total = base + occupation only
      const { [skillId]: _per, ...restPer } = prev.personal_skill_points
      return {
        ...prev,
        occupation_skill_points: { ...prev.occupation_skill_points, [skillId]: points },
        personal_skill_points: restPer,
      }
    })
  }

  const handleSkillDelete = (skillId: string) => {
    setEditData((prev) => {
      const { [skillId]: _occ, ...restOcc } = prev.occupation_skill_points
      const { [skillId]: _per, ...restPer } = prev.personal_skill_points
      return { ...prev, occupation_skill_points: restOcc, personal_skill_points: restPer }
    })
  }

  const handleSkillTransfer = (fromId: string, toId: string, points: number) => {
    setEditData((prev) => {
      const fromOcc = prev.occupation_skill_points[fromId] ?? 0
      const fromPer = prev.personal_skill_points[fromId] ?? 0
      const fromTotal = fromOcc + fromPer
      const transfer = Math.min(points, fromTotal)
      const remaining = fromTotal - transfer

      const newOcc = { ...prev.occupation_skill_points }
      const newPer = { ...prev.personal_skill_points }

      // Source: consolidate remaining into occupation, clear personal
      if (remaining > 0) {
        newOcc[fromId] = remaining
      } else {
        delete newOcc[fromId]
      }
      delete newPer[fromId]

      // Target: add transferred points to occupation
      newOcc[toId] = (newOcc[toId] ?? 0) + transfer

      return { ...prev, occupation_skill_points: newOcc, personal_skill_points: newPer }
    })
  }

  const handleBackstoryChange = (key: string, value: unknown) => {
    setEditData((prev) => ({
      ...prev,
      backstory: { ...prev.backstory, [key]: value },
    }))
  }

  const handleSave = async () => {
    if (!password) return
    setSaving(true)
    try {
      const { id, created_at, updated_at, ...fields } = editData as CharacterSheetData & { created_at?: string; updated_at?: string }
      const updated = await adminUpdateCharacter(password, char.id, { ...fields, _change_comment: changeComment })
      onUpdate?.({ ...updated, id: char.id })
      setEditMode(false)
      setChangeComment('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      // Refresh history
      if (showHistory) loadHistory()
    } catch {
      // error silently
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditData(structuredClone(char))
    setChangeComment('')
    setEditMode(false)
  }

  const handleRestore = (snapshot: HistoryEntry['snapshot']) => {
    setEditData(snapshot as unknown as CharacterSheetData)
    setEditMode(true)
    setChangeComment('Przywrócenie wcześniejszej wersji')
  }

  // --- Notes (independent) ---

  const handleSaveNotes = async () => {
    if (!password) return
    setNotesSaving(true)
    try {
      await adminUpdateCharacter(password, char.id, { admin_notes: notes })
      onUpdate?.({ id: char.id, admin_notes: notes })
      setNotesSaved(true)
      setTimeout(() => setNotesSaved(false), 2000)
    } catch {
      // error silently
    } finally {
      setNotesSaving(false)
    }
  }

  // --- Share tokens ---

  const loadTokens = async () => {
    if (!password) return
    setTokensLoading(true)
    try {
      const data = await adminGetShareTokens(password, char.id)
      setTokens(data)
    } catch {
      // error silently
    } finally {
      setTokensLoading(false)
    }
  }

  const createToken = async (type: 'view' | 'edit') => {
    if (!password) return
    try {
      const token = await adminCreateShareToken(password, char.id, type)
      setTokens((prev) => [token, ...prev])
    } catch {
      // error silently
    }
  }

  const deleteToken = async (tokenId: string) => {
    if (!password) return
    try {
      await adminDeleteShareToken(password, tokenId)
      setTokens((prev) => prev.filter((t) => t.id !== tokenId))
    } catch {
      // error silently
    }
  }

  const copyTokenUrl = (token: string) => {
    const baseUrl = window.location.origin + window.location.pathname.replace(/\/admin.*/, '')
    navigator.clipboard.writeText(`${baseUrl}/c/${token}`)
    setCopiedTokenId(token)
    setTimeout(() => setCopiedTokenId(null), 2000)
  }

  const handleToggleTokens = () => {
    if (!showTokens && tokens.length === 0) loadTokens()
    setShowTokens(!showTokens)
  }

  // --- History ---

  const loadHistory = async () => {
    if (!password) return
    setHistoryLoading(true)
    try {
      const data = await adminGetCharacterHistory(password, char.id)
      setHistory(data)
    } catch {
      // error silently
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleToggleHistory = () => {
    if (!showHistory && history.length === 0) loadHistory()
    setShowHistory(!showHistory)
  }


  // --- Edit permissions ---

  const handleGrantEditPermission = async () => {
    if (!password) return
    setEditPermLoading(true)
    setEditPermResult(null)
    try {
      const result = await adminCreateEditPermission(password, char.id, {
        edit_mode: editPermMode,
        duration: editPermDuration,
      })
      setEditPermResult({ edit_mode: result.edit_mode, expires_at: result.expires_at })
    } catch {
      // error silently
    } finally {
      setEditPermLoading(false)
    }
  }

  const handleRevokeEditPermission = async () => {
    if (!password) return
    setEditPermLoading(true)
    try {
      await adminRevokeEditPermission(password, char.id)
      setEditPermResult(null)
    } catch {
      // error silently
    } finally {
      setEditPermLoading(false)
    }
  }

  // --- Player assignment ---

  const loadPlayers = async () => {
    if (!password) return
    setPlayersLoading(true)
    try {
      const data = await adminGetPlayers(password)
      setPlayers(data)
    } catch {
      // error silently
    } finally {
      setPlayersLoading(false)
    }
  }

  const handleTogglePlayerAssignment = () => {
    if (!showPlayerAssignment && players.length === 0) loadPlayers()
    setShowPlayerAssignment(!showPlayerAssignment)
  }

  const handleAssignPlayer = async () => {
    if (!password || !selectedPlayerId) return
    setAssignLoading(true)
    try {
      await adminAssignCharacterToPlayer(password, char.id, selectedPlayerId)
      const assignedPlayer = players.find((p) => p.id === selectedPlayerId)
      onUpdate?.({ id: char.id, player_id: selectedPlayerId, player_name: assignedPlayer?.name } as Partial<CharacterSheetData> & { id: string })
      setSelectedPlayerId('')
    } catch {
      // error silently
    } finally {
      setAssignLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" /> Wróć do listy
        </Button>
        <div className="flex items-center gap-2">
          {!editMode && (
            <Button variant="secondary" size="sm" onClick={() => setEditMode(true)}>
              <Pencil className="w-3.5 h-3.5" /> Edytuj
            </Button>
          )}
          {editMode && (
            <>
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="w-3.5 h-3.5" /> Anuluj
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif font-bold">{editMode ? editData.name : char.name}</h2>
          <Badge variant={char.status === 'submitted' ? 'success' : 'warning'}>
            {char.status === 'submitted' ? 'Zatwierdzona' : 'Szkic'}
          </Badge>
        </div>

        {editMode ? (
          <div className="space-y-6">
            <BasicInfoEditor
              data={editData}
              onChange={(field, value) => handleFieldChange(field, value)}
            />
            <CharacteristicsEditor
              characteristics={editData.characteristics}
              luck={editData.luck}
              onCharChange={handleCharacteristicChange}
              onLuckChange={(v) => handleFieldChange('luck', v)}
            />
            <DerivedEditor
              derived={editData.derived as { hp: number; mp: number; san: number; db: string; build: number; move_rate: number; dodge: number }}
              onChange={handleDerivedChange}
            />
            <SkillsEditor
              occupationSkillPoints={editData.occupation_skill_points}
              personalSkillPoints={editData.personal_skill_points}
              characteristics={editData.characteristics}
              onChange={handleSkillChange}
              onDelete={handleSkillDelete}
              onTransfer={handleSkillTransfer}
            />
            <BackstoryEditor
              backstory={editData.backstory}
              onChange={handleBackstoryChange}
            />
            <EquipmentEditor
              equipment={editData.equipment}
              cash={editData.cash}
              assets={editData.assets}
              spendingLevel={editData.spending_level}
              onEquipmentChange={(eq) => handleFieldChange('equipment', eq)}
              onFieldChange={(field, value) => handleFieldChange(field, value)}
            />
            <SessionsEditor
              sessions={editData.sessions ?? []}
              onChange={(sessions) => handleFieldChange('sessions', sessions)}
            />

            {/* Save section */}
            <div className="border-t border-coc-border pt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-coc-text-muted mb-1">Komentarz do zmiany</label>
                <input
                  value={changeComment}
                  onChange={(e) => setChangeComment(e.target.value)}
                  placeholder="Co zostało zmienione..."
                  className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light transition-colors"
                />
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saved ? 'Zapisano!' : 'Zapisz zmiany'}
              </Button>
            </div>
          </div>
        ) : (
          <CharacterSheet character={char} />
        )}
      </Card>

      {/* Admin notes */}
      <Card>
        <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider mb-2">Notatki MG</h4>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notatki dla Strażnika Tajemnic..."
          className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light transition-colors min-h-[80px] resize-y"
        />
        <div className="flex items-center gap-2 mt-2">
          <Button size="sm" onClick={handleSaveNotes} disabled={notesSaving}>
            {notesSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {notesSaved ? 'Zapisano!' : 'Zapisz notatki'}
          </Button>
        </div>
      </Card>

      {/* Art Prompt & Gallery */}
      <ArtPromptSection
        characterId={char.id}
        character={char as unknown as Record<string, unknown>}
        artPrompt={(char as unknown as Record<string, unknown>).art_prompt as string ?? ''}
        artGallery={((char as unknown as Record<string, unknown>).art_gallery as { url: string; label: string; created_at: string }[]) ?? []}
        portraitUrl={(char as unknown as Record<string, unknown>).portrait_url as string ?? undefined}
        onUpdate={(fields) => onUpdate?.({ id: char.id, ...fields })}
      />

      {/* Edit permissions (player-centric) */}
      <Card>
        <button
          type="button"
          onClick={() => setShowEditPermissions(!showEditPermissions)}
          className="flex items-center gap-2 text-sm font-medium text-coc-text-muted uppercase tracking-wider cursor-pointer hover:text-coc-text transition-colors w-full"
        >
          <Shield className="w-4 h-4" />
          Uprawnienia edycji
        </button>
        {showEditPermissions && (
          <div className="mt-3 space-y-3">
            {(char as unknown as Record<string, unknown>).player_id ? (
              <>
                <p className="text-xs text-coc-text-muted">
                  Odblokuj edycję postaci dla przypisanego gracza. Zmiany wymagają zatwierdzenia.
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="text-sm text-coc-text-muted">Tryb:</label>
                  <select
                    value={editPermMode}
                    onChange={(e) => { setEditPermMode(e.target.value as 'lore' | 'standard' | 'full'); setEditPermResult(null) }}
                    className="px-3 py-1.5 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text focus:outline-none focus:border-coc-accent-light"
                  >
                    <option value="lore">Lore (tylko historia i dane podstawowe)</option>
                    <option value="standard">Standard (od zawodu wzwyż)</option>
                    <option value="full">Pełny (edycja wszystkiego)</option>
                  </select>
                  <label className="text-sm text-coc-text-muted">Czas:</label>
                  <select
                    value={editPermDuration}
                    onChange={(e) => { setEditPermDuration(e.target.value); setEditPermResult(null) }}
                    className="px-3 py-1.5 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text focus:outline-none focus:border-coc-accent-light"
                  >
                    <option value="24h">24 godziny</option>
                    <option value="1w">1 tydzień</option>
                    <option value="until_disabled">Do odwołania</option>
                  </select>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleGrantEditPermission}
                    disabled={editPermLoading}
                  >
                    {editPermLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                    Odblokuj edycję
                  </Button>
                </div>
                {editPermResult && (
                  <div className="bg-coc-surface-light border border-coc-accent/30 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-coc-text-muted shrink-0" />
                        <span className="text-xs text-coc-text-muted">
                          Aktywne uprawnienie ({editPermResult.edit_mode}) — {editPermResult.expires_at ? `wygasa: ${new Date(editPermResult.expires_at).toLocaleString('pl-PL')}` : 'Bezterminowo'}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRevokeEditPermission}
                        disabled={editPermLoading}
                      >
                        <X className="w-3.5 h-3.5" /> Cofnij
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-amber-400">
                Przypisz postać do gracza aby włączyć edycję.
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Player assignment */}
      <Card>
        <button
          type="button"
          onClick={handleTogglePlayerAssignment}
          className="flex items-center gap-2 text-sm font-medium text-coc-text-muted uppercase tracking-wider cursor-pointer hover:text-coc-text transition-colors w-full"
        >
          <UserPlus className="w-4 h-4" />
          Przypisanie do gracza
          {playersLoading && <Loader2 className="w-3.5 h-3.5 animate-spin ml-auto" />}
        </button>
        {showPlayerAssignment && (
          <div className="mt-3 space-y-3">
            {(char as unknown as Record<string, unknown>).player_id ? (
              <div className="text-sm text-coc-text">
                <span className="text-coc-text-muted">Przypisany gracz: </span>
                <span className="font-medium">{(char as unknown as Record<string, unknown>).player_name as string ?? 'Nieznany'}</span>
                <p className="text-xs text-coc-text-muted mt-1">Aby zmienić, wybierz innego gracza poniżej.</p>
              </div>
            ) : (
              <p className="text-xs text-coc-text-muted">Postać nie jest przypisana do żadnego gracza.</p>
            )}
            <div className="flex items-center gap-3">
              <select
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="px-3 py-1.5 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text focus:outline-none focus:border-coc-accent-light flex-1"
              >
                <option value="">— Wybierz gracza —</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.login})</option>
                ))}
              </select>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAssignPlayer}
                disabled={!selectedPlayerId || assignLoading}
              >
                {assignLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                Przypisz
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Share links */}
      <Card>
        <button
          type="button"
          onClick={handleToggleTokens}
          className="flex items-center gap-2 text-sm font-medium text-coc-text-muted uppercase tracking-wider cursor-pointer hover:text-coc-text transition-colors w-full"
        >
          <Link className="w-4 h-4" />
          Linki udostępniania
          {tokensLoading && <Loader2 className="w-3.5 h-3.5 animate-spin ml-auto" />}
        </button>
        {showTokens && (
          <div className="mt-3 space-y-3">
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => createToken('view')}>
                Generuj link do podglądu
              </Button>
              <Button variant="secondary" size="sm" onClick={() => createToken('edit')}>
                Generuj link do edycji
              </Button>
            </div>
            {tokens.length > 0 && (
              <div className="space-y-1">
                {tokens.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 text-sm py-1">
                    <Badge variant={t.type === 'edit' ? 'warning' : 'default'}>
                      {t.type === 'edit' ? 'Edycja' : 'Podgląd'}
                    </Badge>
                    <span className="font-mono text-xs text-coc-text-muted truncate flex-1">{t.token}</span>
                    <button
                      type="button"
                      onClick={() => copyTokenUrl(t.token)}
                      className="p-1 text-coc-text-muted hover:text-coc-text transition-colors cursor-pointer"
                      title="Kopiuj link"
                    >
                      {copiedTokenId === t.token ? <Check className="w-3.5 h-3.5 text-coc-accent-light" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteToken(t.id)}
                      className="p-1 text-coc-text-muted hover:text-coc-danger transition-colors cursor-pointer"
                      title="Usuń token"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* History */}
      <Card>
        <button
          type="button"
          onClick={handleToggleHistory}
          className="flex items-center gap-2 text-sm font-medium text-coc-text-muted uppercase tracking-wider cursor-pointer hover:text-coc-text transition-colors w-full"
        >
          <History className="w-4 h-4" />
          Historia zmian
          {historyLoading && <Loader2 className="w-3.5 h-3.5 animate-spin ml-auto" />}
        </button>
        {showHistory && (
          <div className="mt-3">
            <CharacterHistory entries={history} onRestore={handleRestore} />
          </div>
        )}
      </Card>

      {/* Export buttons */}
      <Card>
        <ExportButtons character={char as unknown as Parameters<typeof ExportButtons>[0]['character']} />
      </Card>
    </div>
  )
}
