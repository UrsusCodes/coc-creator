import { useEffect, useRef, useState } from 'react'
import {
  ImagePlus,
  Loader2,
  AlertCircle,
  Crop as CropIcon,
  User as UserIcon,
  IdCard,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'
import {
  applyFilterToBlob,
  applyFilterAndCropToBlob,
  FILTER_LABELS_PL,
  type PortraitFilter,
} from '@/lib/portraitEditor'
import { PortraitCropModal } from './PortraitCropModal'
import type { CharacterSheetData } from '@/components/shared/CharacterSheet'
import type { PortraitCropData } from '@/types/character'

interface PortraitEditorProps {
  character: CharacterSheetData
  /** Caller persists profile_portrait_url after we've uploaded the blob. */
  onSetProfilePortrait: (publicUrl: string) => Promise<void>
  /** Caller persists card_portrait_url + card_portrait_crop_data after upload. */
  onSetCardPortrait: (publicUrl: string, cropData: PortraitCropData) => Promise<void>
}

const FILTER_OPTIONS: PortraitFilter[] = ['none', 'faded', 'sepia', 'bw']

export function PortraitEditor({
  character,
  onSetProfilePortrait,
  onSetCardPortrait,
}: PortraitEditorProps) {
  const [master, setMaster] = useState<Blob | null>(null)
  const [masterUrl, setMasterUrl] = useState<string | null>(null)
  const [filter, setFilter] = useState<PortraitFilter>('none')
  const [cropData, setCropData] = useState<PortraitCropData | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewBuilding, setPreviewBuilding] = useState(false)

  const [cropModalOpen, setCropModalOpen] = useState(false)

  const [resizing, setResizing] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingCard, setSavingCard] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Cleanup blob URLs on unmount / replace ──
  useEffect(() => {
    return () => {
      if (masterUrl) URL.revokeObjectURL(masterUrl)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Master upload via paste/drop/file ──
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const blob = items[i].getAsFile()
          if (blob) {
            e.preventDefault()
            acceptMaster(blob)
            return
          }
        }
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const acceptMaster = async (file: File | Blob) => {
    setError(null)
    setInfo(null)
    if (!file.type.startsWith('image/')) {
      setError('To nie jest obraz.')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('Plik za duży (max 20 MB).')
      return
    }

    // Always run the master through the canvas pipeline:
    // - Re-encoded as JPEG q85, max long-edge 1200px (handled inside
    //   applyFilterToBlob via drawScaled).
    // - The original (potentially 20 MB+) Blob is dropped — only the
    //   compact resized version is held in state from here on, so
    //   subsequent filter/crop steps don't repeatedly process the giant
    //   source on every preview rebuild.
    setResizing(true)
    try {
      const resized = await applyFilterToBlob(file, 'none')
      if (masterUrl) URL.revokeObjectURL(masterUrl)
      setMaster(resized)
      setMasterUrl(URL.createObjectURL(resized))
      setCropData(null) // new master ⇒ clear crop
      setFilter('none')

      const origMb = file.size / (1024 * 1024)
      const newMb = resized.size / (1024 * 1024)
      if (origMb >= 1 && origMb / newMb > 1.5) {
        setInfo(
          `Obraz zmniejszony: ${origMb.toFixed(1)} MB → ${newMb.toFixed(2)} MB (max 1200 px na dłuższym boku).`,
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się przetworzyć obrazu.')
    } finally {
      setResizing(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) acceptMaster(f)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) acceptMaster(f)
    e.target.value = ''
  }

  const handleClearMaster = () => {
    if (masterUrl) URL.revokeObjectURL(masterUrl)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setMaster(null)
    setMasterUrl(null)
    setPreviewUrl(null)
    setCropData(null)
    setFilter('none')
    setError(null)
    setInfo(null)
  }

  // ── Live preview: regenerate when master/filter changes ──
  // (Crop is shown as an overlay on top of the preview, not baked in,
  //  so the user can re-crop without losing the filter pass.)
  useEffect(() => {
    if (!master) {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      return
    }
    let cancelled = false
    setPreviewBuilding(true)
    applyFilterToBlob(master, filter)
      .then((blob) => {
        if (cancelled) return
        const url = URL.createObjectURL(blob)
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return url
        })
      })
      .catch(() => {
        if (!cancelled) setError('Nie udało się wygenerować podglądu.')
      })
      .finally(() => {
        if (!cancelled) setPreviewBuilding(false)
      })
    return () => {
      cancelled = true
    }
  }, [master, filter])

  // ── Upload helper ──
  const uploadBlob = async (blob: Blob, kind: 'profile' | 'card'): Promise<string> => {
    const uuid =
      typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const filename = `gallery/${character.id}/${kind}-${uuid}.jpg`
    const { error: uploadErr } = await supabase.storage
      .from('portraits')
      .upload(filename, blob, { contentType: 'image/jpeg', upsert: false })
    if (uploadErr) throw new Error(`Storage: ${uploadErr.message}`)
    const { data: urlData } = supabase.storage.from('portraits').getPublicUrl(filename)
    return urlData.publicUrl
  }

  // ── Save profile (filter only, no crop) ──
  const handleSaveProfile = async () => {
    if (!master) return
    setSavingProfile(true)
    setError(null)
    setInfo(null)
    try {
      const blob = await applyFilterToBlob(master, filter)
      const publicUrl = await uploadBlob(blob, 'profile')
      await onSetProfilePortrait(publicUrl)
      setInfo('Ustawiono jako portret profilowy.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd zapisu.')
    } finally {
      setSavingProfile(false)
    }
  }

  // ── Save card (filter + crop) ──
  const handleSaveCard = async () => {
    if (!master) return
    if (!cropData) {
      setError('Najpierw skadruj obraz (przycisk „Kadruj").')
      return
    }
    setSavingCard(true)
    setError(null)
    setInfo(null)
    try {
      const blob = await applyFilterAndCropToBlob(master, filter, cropData)
      const publicUrl = await uploadBlob(blob, 'card')
      await onSetCardPortrait(publicUrl, cropData)
      setInfo('Ustawiono portret na karcie postaci.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd zapisu.')
    } finally {
      setSavingCard(false)
    }
  }

  return (
    <Card>
      <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider mb-3">
        Edytor portretu
      </h4>

      {/* Empty state — no master yet */}
      {!master && !resizing && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-coc-border rounded-lg px-4 py-10 text-center cursor-pointer hover:border-coc-accent-light/50 transition-colors"
        >
          <ImagePlus className="w-8 h-8 mx-auto text-coc-text-muted mb-3" />
          <p className="text-sm text-coc-text-muted">
            Załaduj wygenerowany obrazek z czata AI
          </p>
          <p className="text-[11px] text-coc-text-muted/70 mt-1">
            Przeciągnij plik tutaj, kliknij żeby wybrać,
            albo wklej z schowka (<span className="font-mono">Ctrl+V</span>).
          </p>
          <p className="text-[10px] text-coc-text-muted/60 mt-1">
            Max 20 MB. Większe pliki są automatycznie zmniejszane do 1200 px.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInputChange}
          />
        </div>
      )}

      {!master && resizing && (
        <div className="border-2 border-dashed border-coc-border rounded-lg px-4 py-10 text-center">
          <Loader2 className="w-6 h-6 mx-auto text-coc-text-muted animate-spin mb-2" />
          <p className="text-sm text-coc-text-muted">Zmniejszanie obrazu…</p>
        </div>
      )}

      {/* Editor — master loaded */}
      {master && masterUrl && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LEFT: master + controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-coc-text uppercase tracking-wider">
                Wgrany obraz
              </p>
              <button
                onClick={handleClearMaster}
                className="text-xs text-coc-text-muted hover:text-coc-danger flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Wyczyść
              </button>
            </div>

            <img
              src={masterUrl}
              alt="Wgrany obraz"
              className="w-full rounded-lg border border-coc-border object-contain max-h-[50vh]"
            />

            <Button
              variant="success"
              size="sm"
              onClick={() => setCropModalOpen(true)}
              className="w-full"
            >
              <CropIcon className="w-4 h-4" />
              {cropData ? 'Zmień kadrowanie' : 'Kadruj (3:4)'}
            </Button>

            <div>
              <p className="text-[11px] font-medium text-coc-text-muted uppercase tracking-wider mb-1.5">
                Filtr
              </p>
              <div className="flex flex-wrap gap-2">
                {FILTER_OPTIONS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                      filter === f
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-coc-surface-light text-coc-text-muted border-coc-border hover:border-green-500/50'
                    }`}
                  >
                    {FILTER_LABELS_PL[f]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: live preview + save */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-coc-text uppercase tracking-wider">
                Podgląd
              </p>
              {previewBuilding && (
                <Loader2 className="w-3 h-3 animate-spin text-coc-text-muted" />
              )}
            </div>

            <div className="relative">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Podgląd"
                  className="w-full rounded-lg border border-coc-border object-contain max-h-[50vh]"
                />
              )}
              {/* Crop overlay — shows where the card crop will be cut */}
              {previewUrl && cropData && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `
                      linear-gradient(to bottom,
                        rgba(0,0,0,0.45) ${cropData.y}%,
                        transparent ${cropData.y}%,
                        transparent ${cropData.y + cropData.height}%,
                        rgba(0,0,0,0.45) ${cropData.y + cropData.height}%
                      ),
                      linear-gradient(to right,
                        rgba(0,0,0,0.45) ${cropData.x}%,
                        transparent ${cropData.x}%,
                        transparent ${cropData.x + cropData.width}%,
                        rgba(0,0,0,0.45) ${cropData.x + cropData.width}%
                      )
                    `,
                  }}
                />
              )}
              {previewUrl && cropData && (
                <div
                  className="absolute border-2 border-coc-accent-light pointer-events-none"
                  style={{
                    left: `${cropData.x}%`,
                    top: `${cropData.y}%`,
                    width: `${cropData.width}%`,
                    height: `${cropData.height}%`,
                  }}
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                variant="success"
                onClick={handleSaveProfile}
                disabled={savingProfile || savingCard}
                className="w-full"
              >
                {savingProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserIcon className="w-4 h-4" />
                )}
                Ustaw jako profilowe
              </Button>
              <Button
                variant="success"
                onClick={handleSaveCard}
                disabled={savingProfile || savingCard || !cropData}
                className="w-full"
                title={!cropData ? 'Najpierw skadruj obraz' : undefined}
              >
                {savingCard ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <IdCard className="w-4 h-4" />
                )}
                Wstaw w kartę
              </Button>
            </div>

            <p className="text-[11px] text-coc-text-muted/80">
              <strong>Profilowe</strong> — pełny obraz z filtrem (avatar w aplikacji).{' '}
              <strong>Karta</strong> — wycinka 3:4 z filtrem (slot portretu na karcie PDF).
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-coc-danger/10 border border-coc-danger/40 rounded-lg text-xs text-coc-danger">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {info && !error && (
        <div className="mt-3 px-3 py-2 bg-green-900/20 border border-green-700/40 rounded-lg text-xs text-green-400">
          {info}
        </div>
      )}

      {/* Crop modal */}
      {cropModalOpen && masterUrl && (
        <PortraitCropModal
          imageUrl={masterUrl}
          initialCrop={cropData}
          onConfirm={(data) => {
            setCropData(data)
            setCropModalOpen(false)
          }}
          onCancel={() => setCropModalOpen(false)}
        />
      )}
    </Card>
  )
}
