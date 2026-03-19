import { useState, useRef } from 'react'
import { X, Send, Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'

interface PortraitFeedbackModalProps {
  characterId: string
  variantUrl: string
  variantLabel?: string
  onSubmit: (data: { variant_url: string; comment: string; reference_image_url?: string }) => Promise<void>
  onCancel: () => void
}

export function PortraitFeedbackModal({
  variantUrl,
  variantLabel,
  onSubmit,
  onCancel,
}: PortraitFeedbackModalProps) {
  const [comment, setComment] = useState('')
  const [referenceUrl, setReferenceUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleReferenceUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Tylko pliki graficzne są dozwolone')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Maksymalny rozmiar pliku to 5MB')
      return
    }

    setUploading(true)
    setError(null)
    try {
      const filename = `feedback/${crypto.randomUUID()}.jpg`
      const { error: uploadErr } = await supabase.storage
        .from('portraits')
        .upload(filename, file, { contentType: file.type, upsert: false })
      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage.from('portraits').getPublicUrl(filename)
      setReferenceUrl(publicUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd przesyłania pliku')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!comment.trim()) {
      setError('Komentarz jest wymagany')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        variant_url: variantUrl,
        comment: comment.trim(),
        reference_image_url: referenceUrl ?? undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd wysyłania')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-coc-surface border border-coc-border rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-coc-border">
          <h3 className="font-semibold text-coc-text">Wyślij uwagi do portretu</h3>
          <button onClick={onCancel} className="text-coc-text-muted hover:text-coc-text transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Variant preview */}
          <div className="flex items-center gap-3">
            <img
              src={variantUrl}
              alt={variantLabel ?? 'Portret'}
              className="w-16 h-20 object-cover rounded-lg border border-coc-border"
            />
            <div>
              <p className="text-sm font-medium text-coc-text">{variantLabel ?? 'Wybrany portret'}</p>
              <p className="text-xs text-coc-text-muted mt-0.5">
                Opisz co chcesz zmienić w tym portrecie
              </p>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-coc-text-muted mb-1">
              Komentarz <span className="text-coc-danger">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="np. twarz wygląda zbyt staro, włosy powinny być ciemniejsze, brakuje blizny na policzku..."
              rows={4}
              className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light transition-colors resize-none"
            />
          </div>

          {/* Reference image upload */}
          <div>
            <label className="block text-sm font-medium text-coc-text-muted mb-1">
              Zdjęcie referencyjne <span className="text-coc-text-muted/60">(opcjonalne)</span>
            </label>
            {referenceUrl ? (
              <div className="flex items-center gap-2">
                <img
                  src={referenceUrl}
                  alt="Referencja"
                  className="w-16 h-16 object-cover rounded-lg border border-coc-border"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-green-400">Plik przesłany</p>
                  <button
                    onClick={() => setReferenceUrl(null)}
                    className="text-xs text-coc-text-muted hover:text-coc-danger transition-colors mt-0.5"
                  >
                    Usuń
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-3 py-2 border border-dashed border-coc-border rounded-lg text-sm text-coc-text-muted hover:border-coc-accent-light/50 hover:text-coc-text transition-colors w-full disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {uploading ? 'Przesyłanie...' : 'Wgraj zdjęcie referencyjne'}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleReferenceUpload(file)
              }}
            />
          </div>

          {error && <p className="text-sm text-coc-danger">{error}</p>}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-coc-border">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={submitting}>
            Anuluj
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={submitting || !comment.trim()}>
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Wyślij uwagi
          </Button>
        </div>
      </div>
    </div>
  )
}
