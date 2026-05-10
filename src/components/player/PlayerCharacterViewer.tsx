import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Loader2, Pencil, X, Clock, CheckCircle, XCircle, Crop, MessageSquarePlus, Trash2, Wrench, Lock, Palette } from 'lucide-react'
import { usePlayerStore } from '@/stores/playerStore'
import { useCharacterStore } from '@/stores/characterStore'
import {
  playerGetPending, playerCancelPending,
  playerSelectPortrait, playerSubmitPortraitFeedback,
  playerGetPortraitFeedback, playerDeletePortraitFeedback,
  playerUpdateNarrative, playerUpdateDistinguisher,
  playerGetEditPermission,
  playerAppendPortraits,
  playerEnhancePrompt,
} from '@/lib/player'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CharacterSheet, type CharacterSheetData } from '@/components/shared/CharacterSheet'
import { ExportButtons } from '@/components/shared/ExportButtons'
import { CardV2DownloadButton } from '@/components/shared/CardV2DownloadButton'
import { PortraitUpload } from '@/components/shared/PortraitUpload'
import { PortraitCropModal } from './PortraitCropModal'
import { PortraitFeedbackModal } from './PortraitFeedbackModal'
import { GeneratePortraitPanel } from './GeneratePortraitPanel'
import { NarrativeEditor } from './NarrativeEditor'
import { BackstoryEditor } from '@/components/admin/edit/BackstoryEditor'
import type { Backstory, NarrativeFields, PortraitCropData, PortraitFeedback } from '@/types/character'

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

interface EditPermissionRow {
  id: string
  character_id: string
  edit_mode: 'lore' | 'standard' | 'full'
  expires_at: string | null
}

export function PlayerCharacterViewer({ character: char, onBack, onUpdate }: PlayerCharacterViewerProps) {
  const { token } = usePlayerStore()
  const loadForPlayerEdit = useCharacterStore((s) => s.loadForPlayerEdit)
  const navigate = useNavigate()

  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState<CharacterSheetData>(structuredClone(char))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [pending, setPending] = useState<PendingEdit | null>(null)
  const [pendingLoading, setPendingLoading] = useState(true)

  const [mechanicsPerm, setMechanicsPerm] = useState<EditPermissionRow | null>(null)
  const [openingMechanicsEdit, setOpeningMechanicsEdit] = useState(false)

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

  // Mechanics edit permission — surfaces the gated "Edytuj mechanikę" button.
  useEffect(() => {
    if (!token) return
    let cancelled = false
    playerGetEditPermission(token, char.id)
      .then((data) => {
        if (cancelled) return
        if (!data) {
          setMechanicsPerm(null)
          return
        }
        // Treat expired permissions as absent.
        if (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) {
          setMechanicsPerm(null)
        } else {
          setMechanicsPerm(data as EditPermissionRow)
        }
      })
      .catch(() => setMechanicsPerm(null))
    return () => {
      cancelled = true
    }
  }, [token, char.id])

  const handleOpenMechanicsEdit = async () => {
    if (!token || !mechanicsPerm) return
    setOpeningMechanicsEdit(true)
    try {
      loadForPlayerEdit({
        characterId: char.id,
        editMode: mechanicsPerm.edit_mode,
        character: char as unknown as Record<string, unknown>,
        era: char.era,
        perks: ((char as unknown as Record<string, unknown>).perks as string[]) ?? [],
        maxSkillValue: ((char as unknown as Record<string, unknown>).max_skill_value as number) ?? 80,
      })
      navigate('/create')
    } finally {
      setOpeningMechanicsEdit(false)
    }
  }

  const formatPermExpiry = (expiresAt: string | null): string => {
    if (!expiresAt) return 'do odwołania'
    const diff = new Date(expiresAt).getTime() - Date.now()
    if (diff <= 0) return 'wygasło'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 24) return `wygasa za ${hours}h`
    const days = Math.floor(hours / 24)
    return `wygasa za ${days}d`
  }

  const permLevelLabel: Record<'lore' | 'standard' | 'full', string> = {
    lore: 'lore (fabuła)',
    standard: 'standard (od zawodu)',
    full: 'pełny',
  }

  // ── Edit handlers (same as CharacterViewer) ────────────────────

  const handleFieldChange = (field: string, value: unknown) => {
    setEditData((prev) => ({ ...prev, [field]: value }))
  }

  const handleBackstoryChange = (key: string, value: unknown) => {
    setEditData((prev) => ({
      ...prev,
      backstory: { ...prev.backstory, [key]: value },
    }))
  }

  // ── Save narrative + distinguisher (direct, no admin approval) ──

  const handleSaveNarrative = async () => {
    if (!token) return
    setSaving(true)
    setError(null)

    try {
      // Distinguisher writes through its own endpoint (player-owned anytime).
      const distChanged = (editData.distinguisher ?? '').trim() !== (char.distinguisher ?? '').trim()
      if (distChanged) {
        const next = (editData.distinguisher ?? '').trim()
        if (next.length < 3 || next.length > 60) {
          setError('Identyfikator musi mieć od 3 do 60 znaków.')
          setSaving(false)
          return
        }
        await playerUpdateDistinguisher(token, char.id, next)
      }

      // Narrative payload — backend allowlist accepts only this set.
      const narrative: NarrativeFields = {
        name: editData.name,
        appearance: editData.appearance,
        residence: editData.residence,
        birthplace: editData.birthplace,
        player_name: editData.player_name,
        gender: editData.gender,
        backstory: editData.backstory as unknown as Backstory,
      }
      await playerUpdateNarrative(token, char.id, narrative)

      // Reflect server truth back into the parent list view.
      onUpdate?.({
        id: char.id,
        ...narrative,
        distinguisher: distChanged ? (editData.distinguisher ?? '').trim() : char.distinguisher,
      } as Partial<CharacterSheetData> & { id: string })

      setEditMode(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd zapisu fabuły')
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
    setEditMode(false)
    setError(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" /> Wróć do listy
        </Button>
        <div className="flex items-center gap-2">
          {!editMode && (
            <>
              <Button variant="secondary" size="sm" onClick={() => setEditMode(true)}>
                <Pencil className="w-3.5 h-3.5" /> Edytuj fabułę
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleOpenMechanicsEdit}
                disabled={!mechanicsPerm || openingMechanicsEdit}
                title={
                  mechanicsPerm
                    ? `Tryb: ${permLevelLabel[mechanicsPerm.edit_mode]} · ${formatPermExpiry(mechanicsPerm.expires_at)}`
                    : 'Strażnik Tajemnic musi nadać Ci uprawnienie, żeby edytować mechanikę'
                }
              >
                {openingMechanicsEdit ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : mechanicsPerm ? (
                  <Wrench className="w-3.5 h-3.5" />
                ) : (
                  <Lock className="w-3.5 h-3.5" />
                )}
                Edytuj mechanikę
              </Button>
              {mechanicsPerm && (
                <Badge variant="warning">
                  {permLevelLabel[mechanicsPerm.edit_mode]} · {formatPermExpiry(mechanicsPerm.expires_at)}
                </Badge>
              )}
            </>
          )}
          {editMode && (
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="w-3.5 h-3.5" /> Anuluj
            </Button>
          )}
        </div>
      </div>

      {/* Big eye-catching button to portrait workshop (player only) */}
      {!editMode && (
        <button
          type="button"
          onClick={() => navigate(`/portrait/${char.id}`)}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-coc-accent to-coc-accent-light text-white font-medium text-base shadow-lg hover:shadow-xl hover:brightness-110 transition-all border border-coc-accent-light/40 cursor-pointer"
        >
          <Palette className="w-5 h-5" />
          <span>Zrób / załaduj portret postaci</span>
          <ArrowLeft className="w-4 h-4 rotate-180" />
        </button>
      )}

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
            <div className="p-3 bg-coc-accent/10 border border-coc-accent/30 rounded-lg text-sm text-coc-accent-light">
              Edytujesz dane narracyjne (imię, identyfikator, miejsce, wygląd, fabułę).
              Zmiany zapisują się od razu — bez akceptacji Strażnika Tajemnic.
              Aby zmienić cechy / umiejętności / ekwipunek, poproś Strażnika Tajemnic o
              uprawnienie do edycji.
            </div>

            <NarrativeEditor
              data={editData}
              onChange={(field, value) => handleFieldChange(field, value)}
            />

            <BackstoryEditor
              backstory={editData.backstory}
              onChange={handleBackstoryChange}
            />

            {/* Save section */}
            <div className="border-t border-coc-border pt-4 space-y-3">
              {error && <p className="text-sm text-coc-danger">{error}</p>}
              <div className="flex gap-2">
                <Button onClick={handleSaveNarrative} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saved ? 'Zapisano!' : 'Zapisz zmiany'}
                </Button>
                <Button variant="secondary" onClick={handleCancel} disabled={saving}>
                  Anuluj
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <CharacterSheet character={char} />
        )}
      </Card>

      {/* Portrait management moved to dedicated workshop page —
          accessible via the "Zrób / załaduj portret postaci" CTA at the
          top of this viewer. The legacy embedded PortraitGallery was
          removed to keep the character view focused. */}

      {/* Export buttons */}
      {!editMode && (
        <Card>
          <div className="flex flex-wrap gap-2">
            <ExportButtons character={char as unknown as Parameters<typeof ExportButtons>[0]['character']} />
            <CardV2DownloadButton character={char} label="Pobierz kartę" />
          </div>
        </Card>
      )}
    </div>
  )
}

export function PortraitGallery({
  character,
  onPortraitChange,
}: {
  character: CharacterSheetData
  onPortraitChange: (url: string, cropData?: PortraitCropData | null) => void
}) {
  const { token } = usePlayerStore()
  const persistedGallery =
    ((character as unknown as Record<string, unknown>).art_gallery as
      | { url: string; label: string; created_at: string }[]
      | undefined) ?? []
  const currentCrop = (character as unknown as Record<string, unknown>).portrait_crop_data as PortraitCropData | undefined

  const [cropModal, setCropModal] = useState<{ url: string; label: string } | null>(null)
  const [feedbackModal, setFeedbackModal] = useState<{ url: string; label: string } | null>(null)
  const [feedbackList, setFeedbackList] = useState<PortraitFeedback[]>([])
  const [selectingUrl, setSelectingUrl] = useState<string | null>(null)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [freshAdditions, setFreshAdditions] = useState<{ url: string; label: string; created_at: string }[]>([])

  // Server is the source of truth for art_gallery. `freshAdditions` is a
  // local-only optimistic merge so AI-generated variants show up
  // immediately after a successful generate call.
  const persistedUrls = new Set(persistedGallery.map((g) => g.url))
  const gallery = [
    ...persistedGallery,
    ...freshAdditions.filter((a) => !persistedUrls.has(a.url)),
  ]

  // Load existing feedbacks
  useEffect(() => {
    if (!token) return
    playerGetPortraitFeedback(token, character.id)
      .then(setFeedbackList)
      .catch(() => setFeedbackList([]))
  }, [token, character.id, feedbackSubmitted])

  // Always render — generation panel is useful even when gallery is empty.

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

        <GeneratePortraitPanel
          character={character}
          onAppendVariants={async (variants) => {
            if (!token) throw new Error('Sesja wygasła — zaloguj się ponownie.')
            const res = await playerAppendPortraits(token, character.id, variants)
            return { gallery_additions: res.gallery_additions }
          }}
          onEnhancePrompt={async (args) => {
            if (!token) throw new Error('Sesja wygasła — zaloguj się ponownie.')
            return await playerEnhancePrompt(token, character.id, args)
          }}
          onVariantsAdded={(additions) =>
            setFreshAdditions((prev) => [...prev, ...additions])
          }
        />

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
