import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Check, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { PortraitCropData } from '@/types/character'

interface PortraitCropModalProps {
  imageUrl: string
  initialCrop?: PortraitCropData | null
  onConfirm: (cropData: PortraitCropData) => void
  onCancel: () => void
}

/** Crop is locked to 3:4 visual aspect (portrait orientation, matches the
 *  card portrait slot + the Gemini output we generate). */
const TARGET_VISUAL_ASPECT = 3 / 4 // width / height, in real pixels

type DragType =
  | 'move'
  | 'resize-tl'
  | 'resize-tr'
  | 'resize-bl'
  | 'resize-br'

export function PortraitCropModal({
  imageUrl,
  initialCrop,
  onConfirm,
  onCancel,
}: PortraitCropModalProps) {
  const imgRef = useRef<HTMLImageElement>(null)

  // Natural pixel dims of the loaded image — used to convert visual
  // aspect into a percent-aspect for crop coords (which are stored as
  // % of image natural dimensions).
  const [imgDims, setImgDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 })

  // percentAspect = (crop.width%) / (crop.height%) when 3:4 visual is locked.
  // visual_aspect = (crop.width% * imgW) / (crop.height% * imgH) = 3/4
  // => crop.width% / crop.height% = (3/4) * (imgH / imgW)
  const percentAspect =
    imgDims.w > 0 && imgDims.h > 0
      ? TARGET_VISUAL_ASPECT * (imgDims.h / imgDims.w)
      : TARGET_VISUAL_ASPECT // fallback before image loads (assume square source)

  const defaultCrop = useCallback((): PortraitCropData => {
    // Center crop, 80% of whichever axis is the limiting one
    let w = 80
    let h = w / percentAspect
    if (h > 100) {
      h = 100
      w = h * percentAspect
    }
    return {
      x: (100 - w) / 2,
      y: (100 - h) / 2,
      width: w,
      height: h,
    }
  }, [percentAspect])

  const [crop, setCrop] = useState<PortraitCropData>(
    initialCrop ?? { x: 10, y: 10, width: 80, height: 80 },
  )

  // After the image loads, recompute aspect-correct default if no initial
  // crop was given (or if the initial values clearly don't match aspect).
  const [seededAspect, setSeededAspect] = useState(false)
  useEffect(() => {
    if (!seededAspect && imgDims.w > 0 && imgDims.h > 0) {
      if (!initialCrop) {
        setCrop(defaultCrop())
      } else {
        // Re-snap to 3:4 around the centroid of the initial rect
        const cx = initialCrop.x + initialCrop.width / 2
        const cy = initialCrop.y + initialCrop.height / 2
        let w = initialCrop.width
        let h = w / percentAspect
        if (h > 100 || cy + h / 2 > 100 || cy - h / 2 < 0) {
          h = Math.min(100, initialCrop.height)
          w = h * percentAspect
        }
        const x = clamp(cx - w / 2, 0, 100 - w)
        const y = clamp(cy - h / 2, 0, 100 - h)
        setCrop({ x, y, width: w, height: h })
      }
      setSeededAspect(true)
    }
  }, [imgDims, percentAspect, initialCrop, seededAspect, defaultCrop])

  // ── Drag state ──
  const [dragType, setDragType] = useState<DragType | null>(null)
  const dragInfoRef = useRef<{
    startX: number
    startY: number
    startCrop: PortraitCropData
  }>({ startX: 0, startY: 0, startCrop: crop })

  // Stable listeners — useEffect re-installs them only when dragType changes
  useEffect(() => {
    if (!dragType) return

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const point = pointFromEvent(e)
      if (!point) return
      const rect = imgRef.current?.getBoundingClientRect()
      if (!rect || rect.width === 0 || rect.height === 0) return

      const dxPct = ((point.x - dragInfoRef.current.startX) / rect.width) * 100
      const dyPct = ((point.y - dragInfoRef.current.startY) / rect.height) * 100
      const sc = dragInfoRef.current.startCrop

      setCrop((prev) => applyDrag(prev, sc, dragType, dxPct, dyPct, percentAspect))
    }

    const handleEnd = () => setDragType(null)

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleEnd)
    window.addEventListener('touchmove', handleMove, { passive: false })
    window.addEventListener('touchend', handleEnd)
    window.addEventListener('touchcancel', handleEnd)

    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleEnd)
      window.removeEventListener('touchcancel', handleEnd)
    }
  }, [dragType, percentAspect])

  const handleStart = (
    e: React.MouseEvent | React.TouchEvent,
    type: DragType,
  ) => {
    e.preventDefault()
    e.stopPropagation()
    const point = pointFromEvent(e.nativeEvent)
    if (!point) return
    dragInfoRef.current = {
      startX: point.x,
      startY: point.y,
      startCrop: { ...crop },
    }
    setDragType(type)
  }

  const handleReset = () => setCrop(defaultCrop())

  const handleConfirm = () => {
    onConfirm({
      x: round1(crop.x),
      y: round1(crop.y),
      width: round1(crop.width),
      height: round1(crop.height),
    })
  }

  const handleSize = 14

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-coc-surface border border-coc-border rounded-xl shadow-2xl w-full max-w-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-coc-border">
          <h3 className="font-semibold text-coc-text">Przytnij portret</h3>
          <button
            onClick={onCancel}
            className="text-coc-text-muted hover:text-coc-text transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-xs text-coc-text-muted mb-3">
            Przeciągnij ramkę (3:4) — środek do przesuwania, rogi do skalowania.
            Aspekt jest stały, dopasowany do slotu portretu na karcie.
          </p>

          <div className="relative inline-block select-none w-full max-h-[70vh]">
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Portret"
              className="w-full max-h-[70vh] rounded-lg object-contain mx-auto"
              draggable={false}
              onLoad={() => {
                const img = imgRef.current
                if (img && img.naturalWidth && img.naturalHeight) {
                  setImgDims({ w: img.naturalWidth, h: img.naturalHeight })
                }
              }}
            />

            {/* Dark overlay outside crop */}
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

            {/* Crop rect + drag move handle */}
            <div
              className="absolute border-2 border-coc-accent-light cursor-move touch-none"
              style={{
                left: `${crop.x}%`,
                top: `${crop.y}%`,
                width: `${crop.width}%`,
                height: `${crop.height}%`,
              }}
              onMouseDown={(e) => handleStart(e, 'move')}
              onTouchStart={(e) => handleStart(e, 'move')}
            >
              {/* Rule-of-thirds */}
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
                  className="absolute bg-coc-accent-light rounded-sm z-10 touch-none"
                  style={{
                    width: handleSize,
                    height: handleSize,
                    top: corner.startsWith('t') ? -handleSize / 2 : undefined,
                    bottom: corner.startsWith('b') ? -handleSize / 2 : undefined,
                    left: corner.endsWith('l') ? -handleSize / 2 : undefined,
                    right: corner.endsWith('r') ? -handleSize / 2 : undefined,
                    cursor:
                      corner === 'tl' || corner === 'br'
                        ? 'nwse-resize'
                        : 'nesw-resize',
                  }}
                  onMouseDown={(e) => handleStart(e, `resize-${corner}`)}
                  onTouchStart={(e) => handleStart(e, `resize-${corner}`)}
                />
              ))}
            </div>
          </div>

          <p className="text-xs text-coc-text-muted mt-2 text-right">
            {Math.round(crop.x)}%, {Math.round(crop.y)}% — {Math.round(crop.width)}×
            {Math.round(crop.height)}% (3:4)
          </p>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-coc-border">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="w-3.5 h-3.5" /> Resetuj
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onCancel}>
              Anuluj
            </Button>
            <Button size="sm" onClick={handleConfirm}>
              <Check className="w-3.5 h-3.5" /> Zatwierdź kadrowanie
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Pure helpers (no React) ────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function round1(v: number) {
  return Math.round(v * 10) / 10
}

function pointFromEvent(
  e: MouseEvent | TouchEvent,
): { x: number; y: number } | null {
  if ('touches' in e) {
    const t = e.touches[0] ?? e.changedTouches[0]
    if (!t) return null
    return { x: t.clientX, y: t.clientY }
  }
  return { x: e.clientX, y: e.clientY }
}

const MIN_W = 10 // % — minimum crop width

/**
 * Compute the new crop given a drag event. All deltas are in % of image
 * dimensions. `percentAspect` is the locked ratio between width% and
 * height% that produces a 3:4 visual portrait.
 */
function applyDrag(
  prev: PortraitCropData,
  start: PortraitCropData,
  type: DragType,
  dxPct: number,
  dyPct: number,
  percentAspect: number,
): PortraitCropData {
  if (type === 'move') {
    return {
      ...prev,
      x: clamp(start.x + dxPct, 0, 100 - start.width),
      y: clamp(start.y + dyPct, 0, 100 - start.height),
    }
  }

  // Resize: width-driven, height locked by aspect, opposite corner stays.
  // Driving by horizontal motion only is the most predictable behaviour
  // — diagonal mouse motion still works, but the user controls the size
  // through the X axis exclusively. (Earlier `Math.max(projW, projH)`
  // approach picked the more-positive of two signed deltas, which broke
  // shrink-then-grow because shrinking left projW negative while a
  // small accidental projH stayed near zero, winning the max.)
  const startAnchor = anchorFor(type, start)
  const signX: 1 | -1 = type.endsWith('r') ? 1 : -1

  let newWidth = Math.max(MIN_W, start.width + signX * dxPct)
  let newHeight = newWidth / percentAspect

  // Compute new top-left from the anchor + new size
  let newX: number
  let newY: number

  if (type === 'resize-br') {
    // Anchor: top-left
    newX = startAnchor.x
    newY = startAnchor.y
  } else if (type === 'resize-bl') {
    // Anchor: top-right
    newX = startAnchor.x - newWidth
    newY = startAnchor.y
  } else if (type === 'resize-tr') {
    // Anchor: bottom-left
    newX = startAnchor.x
    newY = startAnchor.y - newHeight
  } else {
    // resize-tl, anchor: bottom-right
    newX = startAnchor.x - newWidth
    newY = startAnchor.y - newHeight
  }

  // Clamp to image bounds — if we overflow on one axis, shrink uniformly
  if (newX < 0) {
    const overshoot = -newX
    newWidth -= overshoot
    newHeight = newWidth / percentAspect
    newX = 0
    if (type.startsWith('resize-t')) newY = startAnchor.y - newHeight
  }
  if (newY < 0) {
    const overshoot = -newY
    newHeight -= overshoot
    newWidth = newHeight * percentAspect
    newY = 0
    if (type.endsWith('l')) newX = startAnchor.x - newWidth
  }
  if (newX + newWidth > 100) {
    newWidth = 100 - newX
    newHeight = newWidth / percentAspect
    if (type.startsWith('resize-t')) newY = startAnchor.y - newHeight
  }
  if (newY + newHeight > 100) {
    newHeight = 100 - newY
    newWidth = newHeight * percentAspect
    if (type.endsWith('l')) newX = startAnchor.x - newWidth
  }

  // Final min-size enforcement
  if (newWidth < MIN_W) {
    newWidth = MIN_W
    newHeight = newWidth / percentAspect
  }

  return {
    x: clamp(newX, 0, 100 - newWidth),
    y: clamp(newY, 0, 100 - newHeight),
    width: newWidth,
    height: newHeight,
  }
}

function anchorFor(
  type: Exclude<DragType, 'move'>,
  start: PortraitCropData,
): { x: number; y: number } {
  switch (type) {
    case 'resize-br':
      return { x: start.x, y: start.y } // top-left stays
    case 'resize-bl':
      return { x: start.x + start.width, y: start.y } // top-right stays
    case 'resize-tr':
      return { x: start.x, y: start.y + start.height } // bottom-left stays
    case 'resize-tl':
      return { x: start.x + start.width, y: start.y + start.height } // bottom-right stays
  }
}
