import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Check, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { PortraitCropData } from '@/types/character'

interface PortraitCropModalProps {
  imageUrl: string
  initialCrop?: PortraitCropData | null
  onConfirm: (cropData: PortraitCropData) => void
  onCancel: () => void
}

export function PortraitCropModal({ imageUrl, initialCrop, onConfirm, onCancel }: PortraitCropModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  // Crop rect in % (0-100) relative to rendered image
  const [crop, setCrop] = useState<PortraitCropData>(
    initialCrop ?? { x: 5, y: 5, width: 90, height: 90 }
  )

  // Drag state
  const dragRef = useRef<{
    type: 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br' | null
    startX: number
    startY: number
    startCrop: PortraitCropData
  }>({ type: null, startX: 0, startY: 0, startCrop: crop })

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

  const getImageRect = useCallback(() => {
    return imgRef.current?.getBoundingClientRect() ?? { left: 0, top: 0, width: 1, height: 1 }
  }, [])

  const toPercent = (px: number, size: number) => clamp((px / size) * 100, 0, 100)

  const handleMouseDown = (e: React.MouseEvent, type: typeof dragRef.current.type) => {
    e.preventDefault()
    e.stopPropagation()
    dragRef.current = { type, startX: e.clientX, startY: e.clientY, startCrop: { ...crop } }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const drag = dragRef.current
    if (!drag.type) return
    const rect = getImageRect()
    const dx = toPercent(e.clientX - drag.startX, rect.width)
    const dy = toPercent(e.clientY - drag.startY, rect.height)
    const sc = drag.startCrop

    if (drag.type === 'move') {
      const newX = clamp(sc.x + dx, 0, 100 - sc.width)
      const newY = clamp(sc.y + dy, 0, 100 - sc.height)
      setCrop((c) => ({ ...c, x: newX, y: newY }))
    } else if (drag.type === 'resize-br') {
      const newW = clamp(sc.width + dx, 10, 100 - sc.x)
      const newH = clamp(sc.height + dy, 10, 100 - sc.y)
      setCrop((c) => ({ ...c, width: newW, height: newH }))
    } else if (drag.type === 'resize-tl') {
      const newX = clamp(sc.x + dx, 0, sc.x + sc.width - 10)
      const newY = clamp(sc.y + dy, 0, sc.y + sc.height - 10)
      setCrop((c) => ({ ...c, x: newX, y: newY, width: sc.width - (newX - sc.x), height: sc.height - (newY - sc.y) }))
    } else if (drag.type === 'resize-tr') {
      const newY = clamp(sc.y + dy, 0, sc.y + sc.height - 10)
      const newW = clamp(sc.width + dx, 10, 100 - sc.x)
      setCrop((c) => ({ ...c, y: newY, width: newW, height: sc.height - (newY - sc.y) }))
    } else if (drag.type === 'resize-bl') {
      const newX = clamp(sc.x + dx, 0, sc.x + sc.width - 10)
      const newH = clamp(sc.height + dy, 10, 100 - sc.y)
      setCrop((c) => ({ ...c, x: newX, width: sc.width - (newX - sc.x), height: newH }))
    }
  }, [getImageRect])

  const handleMouseUp = useCallback(() => {
    dragRef.current.type = null
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove])

  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  const handleReset = () => setCrop({ x: 5, y: 5, width: 90, height: 90 })

  const handleConfirm = () => {
    onConfirm({
      x: Math.round(crop.x * 10) / 10,
      y: Math.round(crop.y * 10) / 10,
      width: Math.round(crop.width * 10) / 10,
      height: Math.round(crop.height * 10) / 10,
    })
  }

  const handleSize = 12

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-coc-surface border border-coc-border rounded-xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-coc-border">
          <h3 className="font-semibold text-coc-text">Przytnij portret</h3>
          <button onClick={onCancel} className="text-coc-text-muted hover:text-coc-text transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Crop area */}
        <div className="p-4">
          <p className="text-xs text-coc-text-muted mb-3">
            Przeciągnij ramkę, aby wybrać obszar. Rogi do skalowania, środek do przesuwania.
          </p>

          <div ref={containerRef} className="relative inline-block select-none w-full">
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Portret"
              className="w-full rounded-lg object-contain"
              draggable={false}
            />

            {/* Dark overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `
                  linear-gradient(to bottom,
                    rgba(0,0,0,0.55) ${crop.y}%,
                    transparent ${crop.y}%,
                    transparent ${crop.y + crop.height}%,
                    rgba(0,0,0,0.55) ${crop.y + crop.height}%
                  ),
                  linear-gradient(to right,
                    rgba(0,0,0,0.55) ${crop.x}%,
                    transparent ${crop.x}%,
                    transparent ${crop.x + crop.width}%,
                    rgba(0,0,0,0.55) ${crop.x + crop.width}%
                  )
                `,
              }}
            />

            {/* Crop rect border + drag move handle */}
            <div
              className="absolute border-2 border-coc-accent-light cursor-move"
              style={{
                left: `${crop.x}%`,
                top: `${crop.y}%`,
                width: `${crop.width}%`,
                height: `${crop.height}%`,
              }}
              onMouseDown={(e) => handleMouseDown(e, 'move')}
            >
              {/* Rule-of-thirds grid lines */}
              <div className="absolute inset-0 pointer-events-none opacity-30">
                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white" />
                <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white" />
                <div className="absolute top-1/3 left-0 right-0 h-px bg-white" />
                <div className="absolute top-2/3 left-0 right-0 h-px bg-white" />
              </div>

              {/* Corner handles */}
              {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
                <div
                  key={corner}
                  className="absolute bg-coc-accent-light rounded-sm cursor-nwse-resize z-10"
                  style={{
                    width: handleSize,
                    height: handleSize,
                    top: corner.startsWith('t') ? -handleSize / 2 : undefined,
                    bottom: corner.startsWith('b') ? -handleSize / 2 : undefined,
                    left: corner.endsWith('l') ? -handleSize / 2 : undefined,
                    right: corner.endsWith('r') ? -handleSize / 2 : undefined,
                    cursor: corner === 'tl' || corner === 'br' ? 'nwse-resize' : 'nesw-resize',
                  }}
                  onMouseDown={(e) => handleMouseDown(e, `resize-${corner}`)}
                />
              ))}
            </div>
          </div>

          <p className="text-xs text-coc-text-muted mt-2 text-right">
            {Math.round(crop.x)}%, {Math.round(crop.y)}% — {Math.round(crop.width)}×{Math.round(crop.height)}%
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-coc-border">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="w-3.5 h-3.5" /> Resetuj
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onCancel}>Anuluj</Button>
            <Button size="sm" onClick={handleConfirm}>
              <Check className="w-3.5 h-3.5" /> Zatwierdź kadrowanie
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
