import { useState, useRef } from 'react'
import { X, Loader2, ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface PortraitUploadProps {
  value: string
  onChange: (url: string) => void
  label?: string
}

const MAX_SIZE = 2 * 1024 * 1024 // 2MB
const MAX_DIM = 500 // px

async function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width <= MAX_DIM && height <= MAX_DIM) {
        resolve(file)
        return
      }
      const scale = Math.min(MAX_DIM / width, MAX_DIM / height)
      width = Math.round(width * scale)
      height = Math.round(height * scale)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Canvas error')),
        'image/jpeg',
        0.85,
      )
    }
    img.onerror = () => reject(new Error('Image load error'))
    img.src = URL.createObjectURL(file)
  })
}

export function PortraitUpload({ value, onChange, label = 'Portret postaci' }: PortraitUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_SIZE) {
      setError('Plik za duży (max 2MB)')
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Tylko pliki graficzne')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const resized = await resizeImage(file)
      const filename = `${crypto.randomUUID()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('portraits')
        .upload(filename, resized, { contentType: 'image/jpeg' })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('portraits')
        .getPublicUrl(filename)

      onChange(urlData.publicUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd uploadu')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleRemove = () => {
    onChange('')
  }

  return (
    <div>
      <div className="text-xs text-coc-text-muted mb-1">{label}</div>
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Portret"
            className="w-32 h-32 object-cover rounded-lg border border-coc-border"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 p-1 bg-coc-surface border border-coc-border rounded-full text-coc-text-muted hover:text-coc-danger transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <label className="flex items-center gap-2 w-fit px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text-muted hover:text-coc-text hover:border-coc-accent-light transition-colors cursor-pointer">
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ImageIcon className="w-4 h-4" />
          )}
          {uploading ? 'Wysyłanie...' : 'Dodaj portret'}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
            disabled={uploading}
          />
        </label>
      )}
      {error && <p className="text-xs text-coc-danger mt-1">{error}</p>}
    </div>
  )
}
