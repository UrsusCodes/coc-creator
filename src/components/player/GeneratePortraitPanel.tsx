import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Lightbulb,
  Copy,
  CheckCircle2,
  ExternalLink,
  Upload,
  X,
  ImagePlus,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import {
  buildPlayerPortraitPrompt,
  buildStatHints,
  buildVisualCues,
  defaultClothingChipForEra,
  sanitizePortraitFreeText,
  BACKGROUND_CHIPS,
  CLOTHING_CHIP_LABELS,
  LIGHTING_CHIP_LABELS,
  type ClothingChip,
  type LightingChip,
  type PortraitFieldOverrides,
  type PortraitStyle,
} from '@/lib/artPrompt'
import { OCCUPATION_NAMES_EN } from '@/data/occupationNamesEn'
import {
  buildAllStyleVariants,
  STYLE_LABELS_PL,
  STYLE_ORDER,
} from '@/lib/portraitStyleTransforms'
import type { CharacterSheetData } from '@/components/shared/CharacterSheet'

interface GalleryItem {
  url: string
  label: string
  created_at: string
}

/** Variants ready for append to art_gallery — uploaded to Storage, paths stable. */
export interface PortraitVariantUploaded {
  url: string
  label: string
  style: PortraitStyle
}

export interface AppendVariantsResult {
  gallery_additions: GalleryItem[]
}

export interface EnhancePromptArgs {
  rawPrompt: string
  visualCues?: string
  occupationEn?: string
}

interface GeneratePortraitPanelProps {
  character: CharacterSheetData
  /**
   * Optional — when omitted, the paste + save-to-gallery (4 style
   * variants) flow is hidden and the panel is prompt-only. Workshop
   * page uses the prompt-only mode (the live editor below it owns the
   * paste/save flow). PlayerCharacterViewer compact mode still passes
   * a handler for backward-compat.
   */
  onAppendVariants?: (variants: PortraitVariantUploaded[]) => Promise<AppendVariantsResult>
  /** Optional UI hook — called with the same additions so caller can update local state. */
  onVariantsAdded?: (additions: GalleryItem[]) => void
  /**
   * Optional — calls Gemini text mode to rewrite the deterministic prompt.
   * If omitted, the AI-enhance feature is hidden.
   */
  onEnhancePrompt?: (args: EnhancePromptArgs) => Promise<{ enhancedPrompt: string }>
}

// Suggested wealth-rating ranges per clothing chip (informational only —
// chips no longer gate by wealth, but the hint helps players match style
// to their character's station). Refers to lifestyle_rating (0-100 scale
// from wealth v2).
const CLOTHING_CHIP_HINTS: Record<ClothingChip, string> = {
  niedbale: 'majętność < 10',
  codzienne: 'majętność ≥ 10',
  eleganckie: 'majętność ≥ 30',
  zawodowe: 'dowolne',
}

const FIELD_DEFS: { key: keyof PortraitFieldOverrides; label: string; placeholder: string }[] = [
  { key: 'face', label: 'Twarz', placeholder: 'np. blizna nad lewą brwią, ciemne podkrążone oczy' },
  { key: 'body', label: 'Ciało', placeholder: 'np. szerokie ramiona, zgarbiona postura' },
  { key: 'clothing', label: 'Ubrania', placeholder: 'np. tweedowy garnitur, krawat w paski' },
  { key: 'props', label: 'Rekwizyty', placeholder: 'np. trzyma laskę, w kieszeni zegarek na łańcuszku' },
  { key: 'background', label: 'Tło', placeholder: 'np. zaśnieżony park, mglisty wieczór' },
]

const AI_CHAT_LINKS: { id: string; label: string; url: string }[] = [
  { id: 'gemini', label: 'Otwórz Gemini', url: 'https://gemini.google.com/app' },
  { id: 'chatgpt', label: 'Otwórz ChatGPT', url: 'https://chatgpt.com/' },
  { id: 'grok', label: 'Otwórz Grok', url: 'https://grok.com/' },
]

export function GeneratePortraitPanel({
  character,
  onAppendVariants,
  onVariantsAdded,
  onEnhancePrompt,
}: GeneratePortraitPanelProps) {
  const characterAsRecord = character as unknown as Record<string, unknown>
  const spendingLevel = (characterAsRecord.spending_level as string | undefined) ?? ''

  const hints = useMemo(() => buildStatHints({
    characteristics: character.characteristics,
    spending_level: spendingLevel,
    era: character.era,
  }), [character.characteristics, spendingLevel, character.era])

  // Era-aware visible background chips. Filter out chips tagged to other
  // eras; chips with no `era` field stay visible everywhere.
  const visibleBackgroundChips = useMemo(
    () => BACKGROUND_CHIPS.filter((c) => !c.era || c.era.includes(character.era as never)),
    [character.era],
  )

  const [open, setOpen] = useState(false)

  // Form state — same as before
  const [clothingChip, setClothingChip] = useState<ClothingChip>(() =>
    defaultClothingChipForEra(character.era, character.equipment, spendingLevel),
  )
  const [backgroundChipId, setBackgroundChipId] = useState<string>(
    visibleBackgroundChips[0]?.id ?? BACKGROUND_CHIPS[0].id,
  )
  const [customBackground, setCustomBackground] = useState('')
  const [lightingChip, setLightingChip] = useState<LightingChip>('natural')
  const [fieldsActive, setFieldsActive] = useState<Record<string, boolean>>({})
  const [fieldsValue, setFieldsValue] = useState<Record<string, string>>({})
  const [korekty, setKorekty] = useState('')

  // Step 1 — generated prompt (base + optional AI-expanded on demand)
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('')
  const [enhancedPrompt, setEnhancedPrompt] = useState<string>('')
  const [enhancing, setEnhancing] = useState(false)
  const [enhanceError, setEnhanceError] = useState<string | null>(null)
  const [copyStatusDet, setCopyStatusDet] = useState<'idle' | 'copied'>('idle')
  const [copyStatusAi, setCopyStatusAi] = useState<'idle' | 'copied'>('idle')
  const [promptError, setPromptError] = useState<string | null>(null)

  // Step 2 — pasted master
  const [pastedFile, setPastedFile] = useState<File | Blob | null>(null)
  const [pastedPreview, setPastedPreview] = useState<string | null>(null)
  const [pasteError, setPasteError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 3 — saving
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveInfo, setSaveInfo] = useState<string | null>(null)

  // Cleanup blob URL on change
  useEffect(() => {
    return () => {
      if (pastedPreview) URL.revokeObjectURL(pastedPreview)
    }
  }, [pastedPreview])

  // Listen for clipboard paste events when panel is open AND the legacy
  // 4-variant paste flow is active (workshop mode hides it via the
  // optional onAppendVariants prop, in which case the editor below the
  // panel owns the paste handler).
  useEffect(() => {
    if (!open || !onAppendVariants) return
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile()
          if (blob) {
            e.preventDefault()
            acceptImageFile(blob)
            return
          }
        }
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onAppendVariants])

  const buildOverrides = (): PortraitFieldOverrides => {
    const out: PortraitFieldOverrides = {}
    for (const def of FIELD_DEFS) {
      if (fieldsActive[def.key]) {
        const v = (fieldsValue[def.key] ?? '').trim()
        if (v) out[def.key] = v
      }
    }
    if (customBackground.trim()) {
      out.background = customBackground.trim()
    }
    return out
  }

  // ── Step 1: build prompt (+ optional AI enhance) ──
  const handleBuildPrompt = async () => {
    setPromptError(null)
    setEnhanceError(null)
    setCopyStatusDet('idle')
    setCopyStatusAi('idle')
    setEnhancedPrompt('')

    const overrides = buildOverrides()
    try {
      for (const k of Object.keys(overrides) as (keyof PortraitFieldOverrides)[]) {
        const v = overrides[k]
        if (v) overrides[k] = sanitizePortraitFreeText(v, 200)
      }
    } catch (err) {
      setPromptError(err instanceof Error ? err.message : 'Nieprawidłowe pole.')
      return
    }

    let cleanKorekty = ''
    try {
      cleanKorekty = sanitizePortraitFreeText(korekty, 150)
    } catch (err) {
      setPromptError(err instanceof Error ? err.message : 'Nieprawidłowe pole „Korekty".')
      return
    }

    try {
      const prompt = buildPlayerPortraitPrompt({
        character: {
          age: character.age,
          gender: character.gender,
          occupation_id: character.occupation_id,
          appearance: character.appearance,
          spending_level: spendingLevel,
          era: character.era,
          backstory: character.backstory as { appearance_description?: string; [k: string]: unknown },
        },
        clothingChip,
        backgroundChipId: customBackground.trim() ? 'custom' : backgroundChipId,
        lightingChip,
        fields: overrides,
        korekty: cleanKorekty,
      })
      setGeneratedPrompt(prompt)
    } catch (err) {
      setPromptError(err instanceof Error ? err.message : 'Nie udało się złożyć promptu.')
    }
  }

  const runEnhance = async (basePrompt: string) => {
    if (!onEnhancePrompt) return
    setEnhancing(true)
    setEnhanceError(null)
    try {
      const cues = buildVisualCues({ characteristics: character.characteristics })
      const occupationEn =
        OCCUPATION_NAMES_EN[character.occupation_id] ??
        character.occupation_id?.replace(/_/g, ' ') ??
        ''
      const result = await onEnhancePrompt({
        rawPrompt: basePrompt,
        visualCues: cues,
        occupationEn,
      })
      setEnhancedPrompt(result.enhancedPrompt)
    } catch (err) {
      setEnhanceError(err instanceof Error ? err.message : 'Błąd ulepszania promptu.')
    } finally {
      setEnhancing(false)
    }
  }

  const handleManualEnhance = () => {
    if (generatedPrompt) runEnhance(generatedPrompt)
  }

  const handleCopy = async (
    text: string,
    setter: (s: 'idle' | 'copied') => void,
  ) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setter('copied')
      setTimeout(() => setter('idle'), 1500)
    } catch {
      setPromptError('Nie udało się skopiować — zaznacz tekst ręcznie.')
    }
  }

  // ── Step 2: accept image (paste / drop / file) ──
  const acceptImageFile = (file: File | Blob) => {
    setPasteError(null)
    setSaveInfo(null)
    if (!file.type.startsWith('image/')) {
      setPasteError('To nie jest obraz.')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setPasteError('Plik za duży (max 8 MB).')
      return
    }
    if (pastedPreview) URL.revokeObjectURL(pastedPreview)
    setPastedFile(file)
    setPastedPreview(URL.createObjectURL(file))
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) acceptImageFile(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) acceptImageFile(file)
    e.target.value = '' // allow re-selecting the same file
  }

  const handleClearPasted = () => {
    if (pastedPreview) URL.revokeObjectURL(pastedPreview)
    setPastedFile(null)
    setPastedPreview(null)
    setPasteError(null)
    setSaveInfo(null)
  }

  // ── Step 3: save 4 variants to gallery ──
  const handleSave = async () => {
    if (!pastedFile || !onAppendVariants) return
    setSaving(true)
    setSaveError(null)
    setSaveInfo(null)

    try {
      // 3a. Generate 4 style variants in browser
      const variants = await buildAllStyleVariants(pastedFile)

      // 3b. Upload all 4 directly to Storage
      const masterUuid =
        typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`

      const uploaded: PortraitVariantUploaded[] = []
      const galleryNumber = nextGalleryNumber(character)

      for (const style of STYLE_ORDER) {
        const filename = `gallery/${character.id}/${masterUuid}-${style}.jpg`
        const blob = variants[style]
        const { error: uploadErr } = await supabase.storage
          .from('portraits')
          .upload(filename, blob, { contentType: 'image/jpeg', upsert: false })
        if (uploadErr) throw new Error(`Upload ${style}: ${uploadErr.message}`)
        const { data: urlData } = supabase.storage.from('portraits').getPublicUrl(filename)
        uploaded.push({
          url: urlData.publicUrl,
          label: `AI ${galleryNumber} ${STYLE_LABELS_PL[style]}`,
          style,
        })
      }

      // 3c. Caller persists the variants into art_gallery (player or admin path)
      const result = await onAppendVariants(uploaded)

      onVariantsAdded?.(result.gallery_additions)
      setSaveInfo(`Dodano ${result.gallery_additions.length} wariantów do galerii.`)
      handleClearPasted()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Błąd zapisu portretów.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border border-coc-border rounded-lg bg-coc-surface-light/40 mb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-coc-text hover:bg-coc-surface-light/60 transition-colors rounded-lg"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-coc-accent-light" />
          Wygeneruj portret AI
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 space-y-4">
          {/* ── Form (chips + 5 fields + korekty) ── */}
          <FormSection
            clothingChip={clothingChip}
            setClothingChip={setClothingChip}
            backgroundChipId={backgroundChipId}
            setBackgroundChipId={setBackgroundChipId}
            backgroundChips={visibleBackgroundChips}
            customBackground={customBackground}
            setCustomBackground={setCustomBackground}
            lightingChip={lightingChip}
            setLightingChip={setLightingChip}
            fieldsActive={fieldsActive}
            setFieldsActive={setFieldsActive}
            fieldsValue={fieldsValue}
            setFieldsValue={setFieldsValue}
            korekty={korekty}
            setKorekty={setKorekty}
            hints={hints}
          />

          {/* ── Step 1: prompt ── */}
          <div className="border-t border-coc-border/50 pt-3 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-xs font-semibold text-coc-text uppercase tracking-wider">
                1. Skopiuj prompt
              </p>
              <Button size="sm" variant="success" onClick={handleBuildPrompt}>
                <Sparkles className="w-3.5 h-3.5" />
                {generatedPrompt ? 'Odśwież' : 'Złóż prompt'}
              </Button>
            </div>

            {promptError && (
              <div className="flex items-start gap-2 px-3 py-2 bg-coc-danger/10 border border-coc-danger/40 rounded-lg text-xs text-coc-danger">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{promptError}</span>
              </div>
            )}

            {generatedPrompt && (
              <>
                {/* Base prompt — always shown after Złóż prompt */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-coc-text-muted">Prompt bazowy</p>
                  <textarea
                    value={generatedPrompt}
                    readOnly
                    rows={6}
                    className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-xs text-coc-text font-mono resize-y"
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleCopy(generatedPrompt, setCopyStatusDet)}
                  >
                    {copyStatusDet === 'copied' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copyStatusDet === 'copied' ? 'Skopiowano' : 'Skopiuj'}
                  </Button>
                </div>

                {/* AI-expand trigger — below base, above any expanded result */}
                {onEnhancePrompt && !enhancedPrompt && (
                  <Button
                    size="sm"
                    variant="success"
                    onClick={handleManualEnhance}
                    disabled={enhancing}
                  >
                    {enhancing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    {enhancing ? 'AI rozwija prompt…' : 'Rozwiń prompt przy pomocy AI'}
                  </Button>
                )}

                {enhanceError && (
                  <div className="flex items-start gap-2 px-3 py-2 bg-coc-danger/10 border border-coc-danger/40 rounded-lg text-xs text-coc-danger">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>{enhanceError}</span>
                  </div>
                )}

                {/* Expanded prompt — appears after Rozwiń */}
                {enhancedPrompt && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium text-coc-accent-light flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Prompt rozwinięty przez AI (możesz edytować)
                    </p>
                    <textarea
                      value={enhancedPrompt}
                      onChange={(e) => setEnhancedPrompt(e.target.value)}
                      rows={8}
                      className="w-full px-3 py-2 bg-coc-surface-light border-2 border-coc-accent/40 rounded-lg text-xs text-coc-text font-mono resize-y"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => handleCopy(enhancedPrompt, setCopyStatusAi)}>
                        {copyStatusAi === 'copied' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        {copyStatusAi === 'copied' ? 'Skopiowano' : 'Skopiuj rozwinięty'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleManualEnhance} disabled={enhancing}>
                        {enhancing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        Spróbuj inny wariant AI
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {AI_CHAT_LINKS.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-coc-surface-light border border-coc-border text-coc-text-muted hover:text-coc-text hover:border-coc-accent-light/50 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {link.label}
                    </a>
                  ))}
                </div>
                <p className="text-[11px] text-coc-text-muted/80">
                  Wklej prompt (bazowy lub rozwinięty) w wybranym czacie AI, pobierz
                  wygenerowany obraz, potem wklej go niżej.
                </p>
              </>
            )}
          </div>

          {/* ── Step 2: paste image (legacy 4-variant flow, hidden when caller has its own editor) ── */}
          {onAppendVariants && (
          <div className="border-t border-coc-border/50 pt-3 space-y-2">
            <p className="text-xs font-semibold text-coc-text uppercase tracking-wider">
              2. Wklej obrazek
            </p>

            {pastedPreview ? (
              <div className="flex items-start gap-3">
                <img
                  src={pastedPreview}
                  alt="Wklejony portret"
                  className="w-24 h-36 object-cover rounded-lg border border-coc-border"
                />
                <div className="flex-1 space-y-2">
                  <p className="text-xs text-coc-text-muted">
                    Gotowe — kliknij &bdquo;Zapisz do galerii&rdquo;, żeby utworzyć 4 warianty
                    stylowe (kolor / wyblakły / sepia / czarno-białe).
                  </p>
                  <Button size="sm" variant="ghost" onClick={handleClearPasted}>
                    <X className="w-3.5 h-3.5" />
                    Usuń i wklej inny
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-coc-border rounded-lg px-4 py-6 text-center cursor-pointer hover:border-coc-accent-light/50 transition-colors"
              >
                <ImagePlus className="w-6 h-6 mx-auto text-coc-text-muted mb-2" />
                <p className="text-xs text-coc-text-muted">
                  Przeciągnij obraz, kliknij żeby wybrać plik,
                  <br />
                  albo wklej z schowka (<span className="font-mono">Ctrl+V</span>) gdy panel
                  jest otwarty.
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

            {pasteError && (
              <div className="flex items-start gap-2 px-3 py-2 bg-coc-danger/10 border border-coc-danger/40 rounded-lg text-xs text-coc-danger">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{pasteError}</span>
              </div>
            )}
          </div>
          )}

          {/* ── Step 3: save (legacy 4-variant flow) ── */}
          {onAppendVariants && pastedFile && (
            <div className="border-t border-coc-border/50 pt-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-coc-text uppercase tracking-wider">
                  3. Zapisz do galerii
                </p>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  {saving ? 'Zapisywanie…' : 'Zapisz do galerii'}
                </Button>
              </div>

              {saveError && (
                <div className="flex items-start gap-2 px-3 py-2 bg-coc-danger/10 border border-coc-danger/40 rounded-lg text-xs text-coc-danger">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>{saveError}</span>
                </div>
              )}
              {saveInfo && !saveError && (
                <div className="px-3 py-2 bg-green-900/20 border border-green-700/40 rounded-lg text-xs text-green-400">
                  {saveInfo} Możesz wkleić kolejny obrazek lub zamknąć panel.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Helpers ──

function nextGalleryNumber(character: CharacterSheetData): number {
  const gallery =
    ((character as unknown as Record<string, unknown>).art_gallery as { url: string }[] | undefined) ??
    []
  // Count distinct masters by stripping the -<style>.jpg suffix and uniquifying.
  const masters = new Set<string>()
  for (const g of gallery) {
    const m = g.url.match(/\/([^/]+?)-(?:color|faded|sepia|bw)\.jpg$/i)
    if (m) masters.add(m[1])
  }
  return masters.size + 1
}

interface FormSectionProps {
  clothingChip: ClothingChip
  setClothingChip: (c: ClothingChip) => void
  backgroundChipId: string
  setBackgroundChipId: (id: string) => void
  backgroundChips: typeof BACKGROUND_CHIPS
  customBackground: string
  setCustomBackground: (s: string) => void
  lightingChip: LightingChip
  setLightingChip: (l: LightingChip) => void
  fieldsActive: Record<string, boolean>
  setFieldsActive: (
    updater: (prev: Record<string, boolean>) => Record<string, boolean>,
  ) => void
  fieldsValue: Record<string, string>
  setFieldsValue: (
    updater: (prev: Record<string, string>) => Record<string, string>,
  ) => void
  korekty: string
  setKorekty: (s: string) => void
  hints: ReturnType<typeof buildStatHints>
}

function FormSection(props: FormSectionProps) {
  const {
    clothingChip,
    setClothingChip,
    backgroundChipId,
    setBackgroundChipId,
    backgroundChips,
    customBackground,
    setCustomBackground,
    lightingChip,
    setLightingChip,
    fieldsActive,
    setFieldsActive,
    fieldsValue,
    setFieldsValue,
    korekty,
    setKorekty,
    hints,
  } = props

  return (
    <div className="space-y-3">
      {/* Clothing chip */}
      <div>
        <p className="text-xs font-medium text-coc-text-muted uppercase tracking-wider mb-1.5">
          Styl ubrań
        </p>
        <div className="flex flex-wrap gap-2">
          {(['niedbale', 'codzienne', 'eleganckie', 'zawodowe'] as ClothingChip[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setClothingChip(c)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg border transition-colors ${
                clothingChip === c
                  ? 'bg-coc-accent text-white border-coc-accent'
                  : 'bg-coc-surface-light text-coc-text-muted border-coc-border hover:border-coc-accent-light/50'
              }`}
            >
              <span className="text-xs">{CLOTHING_CHIP_LABELS[c]}</span>
              <span
                className={`text-[9px] leading-tight ${
                  clothingChip === c ? 'text-white/80' : 'text-coc-text-muted/70'
                }`}
              >
                {CLOTHING_CHIP_HINTS[c]}
              </span>
            </button>
          ))}
        </div>
        {hints.clothing && (
          <p className="mt-1.5 text-[11px] text-coc-text-muted/80 flex items-start gap-1">
            <Lightbulb className="w-3 h-3 flex-shrink-0 mt-0.5" />
            <span>{hints.clothing}</span>
          </p>
        )}
      </div>

      {/* Background */}
      <div>
        <p className="text-xs font-medium text-coc-text-muted uppercase tracking-wider mb-1.5">
          Tło
        </p>
        <div className="flex flex-wrap gap-2">
          {backgroundChips.map((bg) => (
            <button
              key={bg.id}
              type="button"
              onClick={() => {
                setBackgroundChipId(bg.id)
                setCustomBackground('')
              }}
              className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                backgroundChipId === bg.id && !customBackground.trim()
                  ? 'bg-coc-accent text-white border-coc-accent'
                  : 'bg-coc-surface-light text-coc-text-muted border-coc-border hover:border-coc-accent-light/50'
              }`}
            >
              {bg.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={customBackground}
          onChange={(e) => setCustomBackground(e.target.value.slice(0, 150))}
          placeholder="lub własne (np. salon herbaciany przy parku)"
          className="mt-2 w-full px-3 py-1.5 bg-coc-surface-light border border-coc-border rounded-lg text-xs text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light"
        />
      </div>

      {/* Lighting */}
      <div>
        <p className="text-xs font-medium text-coc-text-muted uppercase tracking-wider mb-1.5">
          Oświetlenie
        </p>
        <div className="flex gap-2">
          {(['hollywood', 'natural', 'noir'] as LightingChip[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLightingChip(l)}
              className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                lightingChip === l
                  ? 'bg-coc-accent text-white border-coc-accent'
                  : 'bg-coc-surface-light text-coc-text-muted border-coc-border hover:border-coc-accent-light/50'
              }`}
            >
              {LIGHTING_CHIP_LABELS[l]}
            </button>
          ))}
        </div>
      </div>

      {/* 5 fields with checkmarks */}
      <div className="border-t border-coc-border/50 pt-3">
        <p className="text-xs font-medium text-coc-text-muted uppercase tracking-wider mb-2">
          Opisz dokładniej (opcjonalnie)
        </p>
        <div className="space-y-2">
          {FIELD_DEFS.map((def) => {
            const active = !!fieldsActive[def.key]
            const fieldHint =
              def.key === 'face'
                ? hints.face
                : def.key === 'body'
                  ? hints.body?.join(' ')
                  : def.key === 'props'
                    ? hints.props
                    : undefined

            return (
              <div key={def.key}>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`field-${def.key}`}
                    checked={active}
                    onChange={(e) =>
                      setFieldsActive((prev) => ({
                        ...prev,
                        [def.key]: e.target.checked,
                      }))
                    }
                    className="cursor-pointer"
                  />
                  <label
                    htmlFor={`field-${def.key}`}
                    className="text-xs font-medium text-coc-text-muted cursor-pointer w-20"
                  >
                    {def.label}
                  </label>
                  <input
                    type="text"
                    value={fieldsValue[def.key] ?? ''}
                    onChange={(e) =>
                      setFieldsValue((prev) => ({
                        ...prev,
                        [def.key]: e.target.value.slice(0, 200),
                      }))
                    }
                    disabled={!active}
                    placeholder={def.placeholder}
                    className="flex-1 px-2 py-1 bg-coc-surface-light border border-coc-border rounded text-xs text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </div>
                {fieldHint && (
                  <p className="ml-[88px] mt-0.5 text-[11px] text-coc-text-muted/80 flex items-start gap-1">
                    <Lightbulb className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    <span>{fieldHint}</span>
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Korekty */}
      <div>
        <label className="block text-xs font-medium text-coc-text-muted uppercase tracking-wider mb-1">
          Drobne korekty (max 150 znaków)
        </label>
        <input
          type="text"
          value={korekty}
          onChange={(e) => setKorekty(e.target.value.slice(0, 150))}
          placeholder='np. "bez kapelusza, lekki uśmiech, wygląd o 5 lat młodszy"'
          className="w-full px-3 py-1.5 bg-coc-surface-light border border-coc-border rounded-lg text-xs text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light"
        />
        <div className="text-[10px] text-coc-text-muted/60 text-right mt-0.5">
          {korekty.length}/150
        </div>
      </div>
    </div>
  )
}
