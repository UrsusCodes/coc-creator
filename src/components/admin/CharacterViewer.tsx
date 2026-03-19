import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Loader2, Pencil, X, Link, Copy, Check, Trash2, History } from 'lucide-react'
import { useAdminStore } from '@/stores/adminStore'
import { adminUpdateCharacter, adminGetCharacterHistory, adminCreateShareToken, adminGetShareTokens, adminDeleteShareToken } from '@/lib/admin'
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

  const handleSkillChange = (skillId: string, totalValue: number) => {
    const base = getSkillBase(skillId)
    let baseVal: number
    if (base === 'half_dex') baseVal = Math.floor((editData.characteristics['DEX'] ?? 0) / 2)
    else if (base === 'edu') baseVal = editData.characteristics['EDU'] ?? 0
    else baseVal = base
    const points = Math.max(0, totalValue - baseVal)
    setEditData((prev) => ({
      ...prev,
      occupation_skill_points: { ...prev.occupation_skill_points, [skillId]: points },
      personal_skill_points: { ...prev.personal_skill_points },
    }))
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
        onUpdate={(fields) => onUpdate?.({ id: char.id, ...fields })}
      />

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
