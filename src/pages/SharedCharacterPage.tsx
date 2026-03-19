import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, Save, Pencil, X, History } from 'lucide-react'
import { publicGetCharacter, publicUpdateCharacter, publicGetHistory } from '@/lib/public'
import { getSkillBase } from '@/data/skills'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CharacterSheet, type CharacterSheetData } from '@/components/shared/CharacterSheet'
import { CharacterHistory } from '@/components/shared/CharacterHistory'
import { BasicInfoEditor } from '@/components/admin/edit/BasicInfoEditor'
import { CharacteristicsEditor } from '@/components/admin/edit/CharacteristicsEditor'
import { DerivedEditor } from '@/components/admin/edit/DerivedEditor'
import { SkillsEditor } from '@/components/admin/edit/SkillsEditor'
import { BackstoryEditor } from '@/components/admin/edit/BackstoryEditor'
import { EquipmentEditor } from '@/components/admin/edit/EquipmentEditor'
import { ExportButtons } from '@/components/shared/ExportButtons'
import type { HistoryEntry } from '@/types/character'

export function SharedCharacterPage() {
  const { token } = useParams<{ token: string }>()

  const [character, setCharacter] = useState<CharacterSheetData | null>(null)
  const [tokenType, setTokenType] = useState<'view' | 'edit'>('view')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edit mode
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState<CharacterSheetData | null>(null)
  const [changeComment, setChangeComment] = useState('')
  const [saving, setSaving] = useState(false)

  // History
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)

  const loadCharacter = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const data = await publicGetCharacter(token)
      setCharacter(data.character as unknown as CharacterSheetData)
      setTokenType(data.tokenType)
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { loadCharacter() }, [loadCharacter])

  const loadHistory = async () => {
    if (!token) return
    setHistoryLoading(true)
    try {
      const data = await publicGetHistory(token)
      setHistory(data)
    } catch {
      // silently
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleToggleHistory = () => {
    if (!showHistory && history.length === 0) loadHistory()
    setShowHistory(!showHistory)
  }

  // --- Edit handlers (same pattern as CharacterViewer) ---

  const startEdit = () => {
    if (character) {
      setEditData(structuredClone(character))
      setEditMode(true)
    }
  }

  const handleFieldChange = (field: string, value: unknown) => {
    setEditData((prev) => prev ? { ...prev, [field]: value } : prev)
  }

  const handleCharacteristicChange = (key: string, value: number) => {
    setEditData((prev) => prev ? {
      ...prev,
      characteristics: { ...prev.characteristics, [key]: value },
    } : prev)
  }

  const handleDerivedChange = (field: string, value: number | string) => {
    setEditData((prev) => prev ? {
      ...prev,
      derived: { ...prev.derived, [field]: value },
    } : prev)
  }

  const handleSkillChange = (skillId: string, totalValue: number) => {
    if (!editData) return
    const base = getSkillBase(skillId)
    let baseVal: number
    if (base === 'half_dex') baseVal = Math.floor((editData.characteristics['DEX'] ?? 0) / 2)
    else if (base === 'edu') baseVal = editData.characteristics['EDU'] ?? 0
    else baseVal = base
    const points = Math.max(0, totalValue - baseVal)
    setEditData((prev) => prev ? {
      ...prev,
      occupation_skill_points: { ...prev.occupation_skill_points, [skillId]: points },
    } : prev)
  }

  const handleBackstoryChange = (key: string, value: unknown) => {
    setEditData((prev) => prev ? {
      ...prev,
      backstory: { ...prev.backstory, [key]: value },
    } : prev)
  }

  const handleSave = async () => {
    if (!token || !editData) return
    setSaving(true)
    try {
      const { id, created_at, updated_at, admin_notes, ...fields } = editData as CharacterSheetData & { created_at?: string; updated_at?: string }
      const updated = await publicUpdateCharacter(token, { ...fields, _change_comment: changeComment })
      setCharacter(updated as unknown as CharacterSheetData)
      setEditMode(false)
      setChangeComment('')
      if (showHistory) loadHistory()
    } catch {
      // silently
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditData(null)
    setChangeComment('')
    setEditMode(false)
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
      </div>
    )
  }

  if (error || !character) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <p className="text-coc-danger">{error ?? 'Nie znaleziono postaci.'}</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-serif font-bold">{editMode && editData ? editData.name : character.name}</h1>
          <Badge variant={tokenType === 'edit' ? 'warning' : 'default'}>
            {tokenType === 'edit' ? 'Edycja' : 'Podgląd'}
          </Badge>
        </div>
        {tokenType === 'edit' && !editMode && (
          <Button variant="secondary" size="sm" onClick={startEdit}>
            <Pencil className="w-3.5 h-3.5" /> Edytuj
          </Button>
        )}
        {editMode && (
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X className="w-3.5 h-3.5" /> Anuluj
          </Button>
        )}
      </div>

      <Card>
        {editMode && editData ? (
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
                Zapisz zmiany
              </Button>
            </div>
          </div>
        ) : (
          <CharacterSheet character={character} />
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
            <CharacterHistory entries={history} />
          </div>
        )}
      </Card>

      {/* Export */}
      <Card>
        <ExportButtons character={character as unknown as Parameters<typeof ExportButtons>[0]['character']} />
      </Card>
    </div>
  )
}
