import { useState, useRef } from 'react'
import { Copy, Check, RotateCcw, Save, Loader2, Plus, Trash2, ImageIcon } from 'lucide-react'
import { useAdminStore } from '@/stores/adminStore'
import { adminUpdateCharacter } from '@/lib/admin'
import { generateArtPrompt, generateNegativePrompt, generateSDParams } from '@/lib/artPrompt'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { GeneratePortraitPanel } from '@/components/player/GeneratePortraitPanel'
import type { CharacterSheetData } from '@/components/shared/CharacterSheet'

interface GalleryItem {
  url: string
  label: string
  created_at: string
}

interface ArtPromptSectionProps {
  characterId: string
  character: Record<string, unknown>
  artPrompt: string
  artGallery: GalleryItem[]
  portraitUrl?: string
  onUpdate: (fields: Record<string, unknown>) => void
}

const MAX_SIZE = 2 * 1024 * 1024

async function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      const MAX = 800
      if (width <= MAX && height <= MAX) { resolve(file); return }
      const scale = Math.min(MAX / width, MAX / height)
      width = Math.round(width * scale)
      height = Math.round(height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Canvas error')),
        'image/jpeg', 0.85,
      )
    }
    img.onerror = () => reject(new Error('Image load error'))
    img.src = URL.createObjectURL(file)
  })
}

export function ArtPromptSection({ characterId, character, artPrompt: savedPrompt, artGallery: savedGallery, portraitUrl: savedPortraitUrl, onUpdate }: ArtPromptSectionProps) {
  const { password } = useAdminStore()

  const autoPrompt = generateArtPrompt(character as unknown as Parameters<typeof generateArtPrompt>[0])
  const negativePrompt = generateNegativePrompt()
  const sdParams = generateSDParams()

  const [prompt, setPrompt] = useState(savedPrompt || autoPrompt)
  const [gallery, setGallery] = useState<GalleryItem[]>(savedGallery ?? [])
  const [portraitUrl, setPortraitUrl] = useState<string | null>(savedPortraitUrl ?? null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [settingPortrait, setSettingPortrait] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleReset = () => {
    setPrompt(autoPrompt)
  }

  const handleSave = async () => {
    if (!password) return
    setSaving(true)
    try {
      await adminUpdateCharacter(password, characterId, {
        art_prompt: prompt,
        art_gallery: gallery,
      })
      onUpdate({ art_prompt: prompt, art_gallery: gallery })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Błąd zapisu')
    } finally {
      setSaving(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_SIZE) { setError('Plik za duży (max 2MB)'); return }
    if (!file.type.startsWith('image/')) { setError('Tylko pliki graficzne'); return }

    setUploading(true)
    setError(null)

    try {
      const resized = await resizeImage(file)
      const filename = `gallery/${characterId}/${crypto.randomUUID()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('portraits')
        .upload(filename, resized, { contentType: 'image/jpeg' })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('portraits').getPublicUrl(filename)
      const newItem: GalleryItem = {
        url: urlData.publicUrl,
        label: `Wariant ${gallery.length + 1}`,
        created_at: new Date().toISOString(),
      }
      setGallery((prev) => [...prev, newItem])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd uploadu')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleRemoveGalleryItem = (idx: number) => {
    setGallery((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSetPortrait = async (url: string) => {
    if (!password) return
    setSettingPortrait(true)
    setError(null)
    try {
      await adminUpdateCharacter(password, characterId, { portrait_url: url })
      setPortraitUrl(url)
      onUpdate({ portrait_url: url })
    } catch {
      setError('Błąd ustawienia portretu')
    } finally {
      setSettingPortrait(false)
    }
  }

  const fullPrompt = `${prompt}\n\nNegative prompt: ${negativePrompt}\n\nSteps: ${sdParams.steps}, CFG: ${sdParams.cfg}, Size: ${sdParams.width}x${sdParams.height}`

  const handleAdminAppendVariants = async (
    variants: { url: string; label: string; style: string }[],
  ) => {
    if (!password) throw new Error('Brak hasła administratora.')
    const additions = variants.map((v) => ({
      url: v.url,
      label: v.label,
      created_at: new Date().toISOString(),
    }))
    const newGallery = [...gallery, ...additions]
    await adminUpdateCharacter(password, characterId, { art_gallery: newGallery })
    setGallery(newGallery)
    onUpdate({ art_gallery: newGallery })
    return { gallery_additions: additions }
  }

  return (
    <Card>
      <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider mb-3">Grafika / Art Prompt</h4>

      {/* New: AI portrait generation (Chat-paste flow) */}
      <GeneratePortraitPanel
        character={character as unknown as CharacterSheetData}
        onAppendVariants={handleAdminAppendVariants}
      />

      {/* Prompt */}
      <div className="space-y-2 mb-4">
        <label className="block text-xs text-coc-text-muted">Prompt (Stable Diffusion)</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text focus:outline-none focus:border-coc-accent-light transition-colors min-h-[100px] resize-y font-mono"
        />
        <div className="flex flex-wrap gap-1">
          <Button size="sm" variant="ghost" onClick={() => handleCopy(prompt, 'prompt')}>
            {copied === 'prompt' ? <Check className="w-3 h-3 text-coc-accent-light" /> : <Copy className="w-3 h-3" />}
            Kopiuj prompt
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleCopy(negativePrompt, 'negative')}>
            {copied === 'negative' ? <Check className="w-3 h-3 text-coc-accent-light" /> : <Copy className="w-3 h-3" />}
            Kopiuj negative
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleCopy(fullPrompt, 'full')}>
            {copied === 'full' ? <Check className="w-3 h-3 text-coc-accent-light" /> : <Copy className="w-3 h-3" />}
            Kopiuj wszystko
          </Button>
          <Button size="sm" variant="ghost" onClick={handleReset}>
            <RotateCcw className="w-3 h-3" /> Resetuj do auto
          </Button>
        </div>

        <div className="text-xs text-coc-text-muted bg-coc-surface-light rounded p-2 font-mono">
          Negative: {negativePrompt}<br />
          Steps: {sdParams.steps}, CFG: {sdParams.cfg}, Size: {sdParams.width}x{sdParams.height}
        </div>
      </div>

      {/* Gallery */}
      <div className="space-y-2 mb-4">
        <label className="block text-xs text-coc-text-muted">Galeria wariantów</label>

        {gallery.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {gallery.map((item, idx) => {
              const isActive = item.url === portraitUrl
              return (
                <div key={idx} className="relative group">
                  <img
                    src={item.url}
                    alt={item.label}
                    className={`w-full aspect-square object-cover rounded-lg border-2 transition-colors ${isActive ? 'border-coc-accent-light' : 'border-coc-border'}`}
                  />
                  {isActive && (
                    <div className="absolute top-1 left-1 p-0.5 bg-coc-accent-light rounded-full">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveGalleryItem(idx)}
                    className="absolute top-1 right-1 p-1 bg-coc-surface/80 rounded-full text-coc-text-muted hover:text-coc-danger transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPortrait(item.url)}
                    disabled={settingPortrait || isActive}
                    className="absolute bottom-1 left-1 right-1 flex items-center justify-center gap-1 py-0.5 bg-coc-surface/90 rounded text-[9px] text-coc-text-muted hover:text-coc-text transition-colors cursor-pointer opacity-0 group-hover:opacity-100 disabled:cursor-default disabled:opacity-50"
                  >
                    <ImageIcon className="w-2.5 h-2.5" />
                    {isActive ? 'Portret' : 'Ustaw portret'}
                  </button>
                  <div className="text-[10px] text-coc-text-muted text-center mt-0.5 truncate">{item.label}</div>
                </div>
              )
            })}
          </div>
        )}

        <label className="flex items-center gap-2 w-fit px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text-muted hover:text-coc-text hover:border-coc-accent-light transition-colors cursor-pointer">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {uploading ? 'Wysyłanie...' : 'Dodaj wariant'}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {error && <p className="text-xs text-coc-danger mb-2">{error}</p>}

      <Button size="sm" onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        {saved ? 'Zapisano!' : 'Zapisz prompt i galerię'}
      </Button>
    </Card>
  )
}
