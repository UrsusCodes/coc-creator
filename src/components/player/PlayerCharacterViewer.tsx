import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Loader2, Pencil, X, Clock, CheckCircle, XCircle, Crop, MessageSquarePlus, Trash2 } from 'lucide-react'
import { usePlayerStore } from '@/stores/playerStore'
import {
  playerProposeEdit, playerGetPending, playerCancelPending,
  playerSelectPortrait, playerSubmitPortraitFeedback,
  playerGetPortraitFeedback, playerDeletePortraitFeedback,
} from '@/lib/player'
import { getSkillBase } from '@/data/skills'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CharacterSheet, type CharacterSheetData } from '@/components/shared/CharacterSheet'
import { ExportButtons } from '@/components/shared/ExportButtons'
import { PortraitUpload } from '@/components/shared/PortraitUpload'
import { PortraitCropModal } from './PortraitCropModal'
import { PortraitFeedbackModal } from './PortraitFeedbackModal'
import { BasicInfoEditor } from '@/components/admin/edit/BasicInfoEditor'
import { CharacteristicsEditor } from '@/components/admin/edit/CharacteristicsEditor'
import { DerivedEditor } from '@/components/admin/edit/DerivedEditor'
import { SkillsEditor } from '@/components/admin/edit/SkillsEditor'
import { BackstoryEditor } from '@/components/admin/edit/BackstoryEditor'
import { EquipmentEditor } from '@/components/admin/edit/EquipmentEditor'
import type { PortraitCropData, PortraitFeedback } from '@/types/character'

interface PendingEdit {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  change_comment: string
  admin_comment: string
  created_at: string
  resolved_at: string | null
}

interface PlayerCharacterViewerProps {
  character: CharacterSheetData
  onBack: () => void
  onUpdate?: (updated: Partial<CharacterSheetData> & { id: string }) => void
}

export function PlayerCharacterViewer({ character: char, onBack, onUpdate }: PlayerCharacterViewerProps) {
  const { token } = usePlayerStore()

  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState<CharacterSheetData>(structuredClone(char))
  const [changeComment, setChangeComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [pending, setPending] = useState<PendingEdit | null>(null)
  const [pendingLoading, setPendingLoading] = useState(true)

  useEffect(() => {
    setEditData(structuredClone(char))
  }, [char])

  useEffect(() => {
    if (!token) return
    setPendingLoading(true)
    playerGetPending(token, char.id)
      .then((data) => setPending(data))
      .catch(() => setPending(null))
      .finally(() => setPendingLoading(false))
  }, [token, char.id])

  // ── Edit handlers (same as CharacterViewer) ────────────────────

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

  // ── Submit as proposed edit ────────────────────────────────────

  const handleSubmitProposal = async () => {
    if (!token) return
    setSaving(true)
    setError(null)

    try {
      const result = await playerProposeEdit(token, char.id, editData as unknown as Record<string, unknown>, changeComment)
      setPending(result)
      setEditMode(false)
      setChangeComment('')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd wysyłania propozycji')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelPending = async () => {
    if (!token || !confirm('Anulować oczekującą propozycję?')) return
    try {
      await playerCancelPending(token, char.id)
      setPending(null)
    } catch {
      // error silently
    }
  }

  const handleCancel = () => {
    setEditData(structuredClone(char))
    setChangeComment('')
    setEditMode(false)
    setError(null)
  }

  const hasPendingEdit = pending?.status === 'pending'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" /> Wróć do listy
        </Button>
        <div className="flex items-center gap-2">
          {!editMode && !hasPendingEdit && (
            <Button variant="secondary" size="sm" onClick={() => setEditMode(true)}>
              <Pencil className="w-3.5 h-3.5" /> Zaproponuj zmiany
            </Button>
          )}
          {editMode && (
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="w-3.5 h-3.5" /> Anuluj
            </Button>
          )}
        </div>
      </div>

      {/* Pending edit status banner */}
      {!pendingLoading && pending && (
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {pending.status === 'pending' && (
                <>
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm">Propozycja zmian oczekuje na zatwierdzenie przez Strażnika Tajemnic</span>
                  <Badge variant="warning">Oczekuje</Badge>
                </>
              )}
              {pending.status === 'approved' && (
                <>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm">Ostatnia propozycja została zatwierdzona</span>
                  <Badge variant="success">Zatwierdzona</Badge>
                </>
              )}
              {pending.status === 'rejected' && (
                <>
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm">Propozycja została odrzucona</span>
                  <Badge variant="danger">Odrzucona</Badge>
                </>
              )}
            </div>
            {pending.status === 'pending' && (
              <Button size="sm" variant="danger" onClick={handleCancelPending}>
                Anuluj propozycję
              </Button>
            )}
          </div>
          {pending.admin_comment && (
            <p className="text-sm text-coc-text-muted mt-2">
              Komentarz MG: <span className="text-coc-text">{pending.admin_comment}</span>
            </p>
          )}
          {pending.change_comment && (
            <p className="text-sm text-coc-text-muted mt-1">
              Twój komentarz: {pending.change_comment}
            </p>
          )}
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif font-bold">{editMode ? editData.name : char.name}</h2>
          <Badge variant={char.status === 'submitted' ? 'success' : 'warning'}>
            {char.status === 'submitted' ? 'Zatwierdzona' : 'Szkic'}
          </Badge>
        </div>

        {editMode ? (
          <div className="space-y-6">
            <div className="p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg text-sm text-yellow-200">
              Edytujesz propozycję zmian. Po wysłaniu Strażnik Tajemnic będzie musiał ją zatwierdzić.
            </div>

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

            {/* Submit section */}
            <div className="border-t border-coc-border pt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-coc-text-muted mb-1">Komentarz do zmian</label>
                <input
                  value={changeComment}
                  onChange={(e) => setChangeComment(e.target.value)}
                  placeholder="Opisz co i dlaczego zmieniasz..."
                  className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light transition-colors"
                />
              </div>
              {error && <p className="text-sm text-coc-danger">{error}</p>}
              <Button onClick={handleSubmitProposal} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saved ? 'Wysłano!' : 'Wyślij propozycję zmian'}
              </Button>
            </div>
          </div>
        ) : (
          <CharacterSheet character={char} />
        )}
      </Card>

      {/* Portrait gallery */}
      {!editMode && (
        <PortraitGallery
          character={char}
          onPortraitChange={(url, cropData) =>
            onUpdate?.({ id: char.id, portrait_url: url, portrait_crop_data: cropData ?? undefined })
          }
        />
      )}

      {/* Export buttons */}
      {!editMode && (
        <Card>
          <ExportButtons character={char as unknown as Parameters<typeof ExportButtons>[0]['character']} />
        </Card>
      )}
    </div>
  )
}

function PortraitGallery({
  character,
  onPortraitChange,
}: {
  character: CharacterSheetData
  onPortraitChange: (url: string, cropData?: PortraitCropData | null) => void
}) {
  const { token } = usePlayerStore()
  const gallery = (character as unknown as Record<string, unknown>).art_gallery as { url: string; label: string }[] ?? []
  const currentCrop = (character as unknown as Record<string, unknown>).portrait_crop_data as PortraitCropData | undefined

  const [cropModal, setCropModal] = useState<{ url: string; label: string } | null>(null)
  const [feedbackModal, setFeedbackModal] = useState<{ url: string; label: string } | null>(null)
  const [feedbackList, setFeedbackList] = useState<PortraitFeedback[]>([])
  const [selectingUrl, setSelectingUrl] = useState<string | null>(null)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  // Load existing feedbacks
  useEffect(() => {
    if (!token) return
    playerGetPortraitFeedback(token, character.id)
      .then(setFeedbackList)
      .catch(() => setFeedbackList([]))
  }, [token, character.id, feedbackSubmitted])

  if (gallery.length === 0 && !character.portrait_url) return null

  const pendingFeedbackUrls = new Set(
    feedbackList.filter((f) => f.status === 'pending_fix').map((f) => f.variant_url)
  )

  const handleSelectPortrait = async (url: string) => {
    if (!token || selectingUrl) return
    setSelectingUrl(url)
    try {
      await playerSelectPortrait(token, character.id, url, null)
      onPortraitChange(url, null)
    } catch {
      onPortraitChange(url, null)
    } finally {
      setSelectingUrl(null)
    }
  }

  const handleCropConfirm = async (cropData: PortraitCropData) => {
    if (!token || !cropModal) return
    try {
      await playerSelectPortrait(token, character.id, cropModal.url, cropData)
      onPortraitChange(cropModal.url, cropData)
    } catch {
      onPortraitChange(cropModal.url, cropData)
    }
    setCropModal(null)
  }

  const handleFeedbackSubmit = async (data: {
    variant_url: string
    comment: string
    reference_image_url?: string
  }) => {
    if (!token) return
    await playerSubmitPortraitFeedback(token, character.id, data)
    setFeedbackModal(null)
    setFeedbackSubmitted((v) => !v)
  }

  const handleDeleteFeedback = async (feedbackId: string) => {
    if (!token) return
    await playerDeletePortraitFeedback(token, character.id, feedbackId)
    setFeedbackSubmitted((v) => !v)
  }

  return (
    <>
      <Card>
        <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider mb-3">Portrety</h4>

        {gallery.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {gallery.map((item, idx) => {
              const isSelected = character.portrait_url === item.url
              const hasFeedback = pendingFeedbackUrls.has(item.url)
              const isLoading = selectingUrl === item.url

              return (
                <div key={idx} className="relative group">
                  {/* Portrait image */}
                  <div
                    className={`relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-coc-accent-light shadow-lg shadow-coc-accent-light/20'
                        : 'border-coc-border hover:border-coc-accent-light/50'
                    }`}
                    onClick={() => !isSelected && handleSelectPortrait(item.url)}
                  >
                    <img
                      src={item.url}
                      alt={item.label}
                      className="w-full aspect-[3/4] object-cover"
                    />

                    {/* Loading overlay */}
                    {isLoading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                      </div>
                    )}

                    {/* Selected checkmark */}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-coc-accent-light rounded-full flex items-center justify-center shadow">
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}

                    {/* Feedback badge */}
                    {hasFeedback && (
                      <div className="absolute top-1.5 left-1.5 bg-orange-500 rounded-full w-4 h-4 flex items-center justify-center">
                        <MessageSquarePlus className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}

                    {/* Crop indicator */}
                    {isSelected && currentCrop && (
                      <div className="absolute bottom-1.5 left-1.5 bg-black/60 rounded px-1 py-0.5">
                        <span className="text-[9px] text-white">kadr</span>
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  <div className="text-[10px] text-coc-text-muted text-center mt-1 truncate">{item.label}</div>

                  {/* Action buttons (visible on hover / when selected) */}
                  <div className={`flex gap-1 mt-1 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity'}`}>
                    {isSelected && (
                      <button
                        onClick={() => setCropModal(item)}
                        className="flex-1 flex items-center justify-center gap-1 px-1.5 py-1 bg-coc-surface-light border border-coc-border rounded text-[10px] text-coc-text-muted hover:text-coc-text hover:border-coc-accent-light/50 transition-colors"
                        title="Przytnij"
                      >
                        <Crop className="w-2.5 h-2.5" /> Kadruj
                      </button>
                    )}
                    <button
                      onClick={() => setFeedbackModal(item)}
                      className="flex-1 flex items-center justify-center gap-1 px-1.5 py-1 bg-coc-surface-light border border-coc-border rounded text-[10px] text-coc-text-muted hover:text-coc-text hover:border-orange-400/50 transition-colors"
                      title="Wyślij uwagi"
                    >
                      <MessageSquarePlus className="w-2.5 h-2.5" /> Uwagi
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Existing feedback list */}
        {feedbackList.filter((f) => f.status !== 'resolved').length > 0 && (
          <div className="mb-4 space-y-2">
            <p className="text-xs font-medium text-coc-text-muted uppercase tracking-wider">Wysłane uwagi</p>
            {feedbackList
              .filter((f) => f.status !== 'resolved')
              .map((fb) => (
                <div key={fb.id} className="flex items-start gap-2 bg-orange-900/20 border border-orange-700/30 rounded-lg px-3 py-2">
                  <img
                    src={fb.variant_url}
                    alt="portret"
                    className="w-8 h-10 object-cover rounded flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-coc-text">{fb.comment}</p>
                    {fb.admin_comment && (
                      <p className="text-xs text-green-400 mt-0.5">MG: {fb.admin_comment}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={fb.status === 'in_progress' ? 'default' : 'warning'}>
                        {fb.status === 'in_progress' ? 'W trakcie' : 'Oczekuje'}
                      </Badge>
                    </div>
                  </div>
                  {fb.status === 'pending_fix' && (
                    <button
                      onClick={() => handleDeleteFeedback(fb.id)}
                      className="text-coc-text-muted hover:text-coc-danger transition-colors flex-shrink-0"
                      title="Usuń uwagę"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
          </div>
        )}

        <PortraitUpload
          value={character.portrait_url ?? ''}
          onChange={(url) => handleSelectPortrait(url)}
          label="Wgraj własny portret"
        />
      </Card>

      {/* Crop modal */}
      {cropModal && (
        <PortraitCropModal
          imageUrl={cropModal.url}
          initialCrop={character.portrait_url === cropModal.url ? currentCrop : null}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropModal(null)}
        />
      )}

      {/* Feedback modal */}
      {feedbackModal && (
        <PortraitFeedbackModal
          characterId={character.id}
          variantUrl={feedbackModal.url}
          variantLabel={feedbackModal.label}
          onSubmit={handleFeedbackSubmit}
          onCancel={() => setFeedbackModal(null)}
        />
      )}
    </>
  )
}
