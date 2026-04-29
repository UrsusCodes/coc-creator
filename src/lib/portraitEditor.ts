/**
 * Browser-side helpers for the live portrait editor (workshop page).
 * Spec: docs/CoCCreator_obsidian/specs/portrait_prompt_methodology.md
 *
 * Applies a single filter (none / faded / sepia / bw) and an optional
 * crop region (% based) to a master image blob, returning a JPEG blob
 * suitable for upload to Supabase Storage.
 *
 * Used by PortraitEditor for live preview AND for final save (profile
 * = filter only, card = filter + crop). The same arithmetic shaders
 * as portraitStyleTransforms.ts so the visual result matches what the
 * user sees in the gallery thumbnails.
 */

import type { PortraitCropData } from '@/types/character'

export type PortraitFilter = 'none' | 'faded' | 'sepia' | 'bw'

export const FILTER_LABELS_PL: Record<PortraitFilter, string> = {
  none: 'Brak',
  faded: 'Wyblakły',
  sepia: 'Sepia',
  bw: 'Czarno-biały',
}

// Default re-encode pass for filter / crop steps (master is already
// compressed by smartCompressBlob, so this is just to bake the shader).
const MAX_LONG_EDGE = 1600
const JPEG_QUALITY = 0.88

type Shader = (r: number, g: number, b: number) => [number, number, number]

const SHADERS: Record<Exclude<PortraitFilter, 'none'>, Shader> = {
  faded: (r, g, b) => {
    const y = 0.299 * r + 0.587 * g + 0.114 * b
    return [r * 0.7 + y * 0.3, g * 0.7 + y * 0.3, b * 0.7 + y * 0.3]
  },
  sepia: (r, g, b) => [
    0.393 * r + 0.769 * g + 0.189 * b,
    0.349 * r + 0.686 * g + 0.168 * b,
    0.272 * r + 0.534 * g + 0.131 * b,
  ],
  bw: (r, g, b) => {
    const y = 0.299 * r + 0.587 * g + 0.114 * b
    return [y, y, y]
  },
}

async function decodeImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob)
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Nie udało się zdekodować obrazu.'))
      img.src = url
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

function canvasToJpegBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas → JPEG nie powiodło się.'))),
      'image/jpeg',
      JPEG_QUALITY,
    )
  })
}

function drawScaled(img: HTMLImageElement): {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
} {
  const longEdge = Math.max(img.naturalWidth, img.naturalHeight)
  const scale = longEdge > MAX_LONG_EDGE ? MAX_LONG_EDGE / longEdge : 1
  const w = Math.round(img.naturalWidth * scale)
  const h = Math.round(img.naturalHeight * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Twoja przeglądarka nie wspiera Canvas 2D.')
  ctx.drawImage(img, 0, 0, w, h)
  return { canvas, ctx }
}

function applyShader(ctx: CanvasRenderingContext2D, shader: Shader): void {
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = shader(data[i], data[i + 1], data[i + 2])
    data[i] = Math.max(0, Math.min(255, Math.round(r)))
    data[i + 1] = Math.max(0, Math.min(255, Math.round(g)))
    data[i + 2] = Math.max(0, Math.min(255, Math.round(b)))
  }
  ctx.putImageData(imageData, 0, 0)
}

/**
 * Smart compression for incoming master uploads.
 * Tries successively more aggressive parameters until the resulting
 * JPEG is at most `targetMaxBytes`. Preserves natural resolution and
 * high quality at first; only shrinks long-edge or drops quality when
 * the image is genuinely too big. Iteration cap of 7 attempts.
 *
 * Used by the editor on master upload (raise the user's limit to
 * ~10 MB without flooding Storage with 20 MB phone-camera blobs).
 */
export async function smartCompressBlob(
  source: Blob,
  targetMaxBytes: number = 10 * 1024 * 1024,
): Promise<Blob> {
  // Already-small JPEGs pass through unchanged — preserve max quality
  if (source.size <= targetMaxBytes && source.type === 'image/jpeg') {
    return source
  }

  const img = await decodeImage(source)
  const naturalLong = Math.max(img.naturalWidth, img.naturalHeight)

  // Each row: longEdge cap (null = natural) and JPEG quality. We try
  // gentle settings first, then escalate.
  const passes: { longEdge: number | null; quality: number }[] = [
    { longEdge: null, quality: 0.95 },
    { longEdge: null, quality: 0.9 },
    { longEdge: null, quality: 0.85 },
    { longEdge: 2400, quality: 0.88 },
    { longEdge: 2000, quality: 0.85 },
    { longEdge: 1600, quality: 0.82 },
    { longEdge: 1200, quality: 0.8 },
  ]

  let last: Blob | null = null
  for (const pass of passes) {
    const targetLong = pass.longEdge ?? naturalLong
    // Skip "shrink" passes when the natural is already smaller — they'd
    // be no-ops and waste a roundtrip
    if (pass.longEdge !== null && naturalLong <= pass.longEdge && last) {
      continue
    }
    const blob = await encodeAtParams(img, targetLong, pass.quality)
    last = blob
    if (blob.size <= targetMaxBytes) return blob
  }

  return last!
}

async function encodeAtParams(
  img: HTMLImageElement,
  longEdge: number,
  quality: number,
): Promise<Blob> {
  const naturalLong = Math.max(img.naturalWidth, img.naturalHeight)
  const scale = naturalLong > longEdge ? longEdge / naturalLong : 1
  const w = Math.round(img.naturalWidth * scale)
  const h = Math.round(img.naturalHeight * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Twoja przeglądarka nie wspiera Canvas 2D.')
  ctx.drawImage(img, 0, 0, w, h)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      'image/jpeg',
      quality,
    )
  })
}

/** Apply a filter to the full master image — used for "profile" save (no crop). */
export async function applyFilterToBlob(
  master: Blob,
  filter: PortraitFilter,
): Promise<Blob> {
  const img = await decodeImage(master)
  const { canvas, ctx } = drawScaled(img)
  if (filter !== 'none') applyShader(ctx, SHADERS[filter])
  return canvasToJpegBlob(canvas)
}

/** Apply a filter + crop region to the master — used for "card" save. */
export async function applyFilterAndCropToBlob(
  master: Blob,
  filter: PortraitFilter,
  crop: PortraitCropData,
): Promise<Blob> {
  const img = await decodeImage(master)
  const { canvas: fullCanvas } = drawScaled(img)

  // Crop region in pixels relative to scaled canvas
  const cropX = Math.round((crop.x / 100) * fullCanvas.width)
  const cropY = Math.round((crop.y / 100) * fullCanvas.height)
  const cropW = Math.max(1, Math.round((crop.width / 100) * fullCanvas.width))
  const cropH = Math.max(1, Math.round((crop.height / 100) * fullCanvas.height))

  const cropCanvas = document.createElement('canvas')
  cropCanvas.width = cropW
  cropCanvas.height = cropH
  const cropCtx = cropCanvas.getContext('2d')
  if (!cropCtx) throw new Error('Twoja przeglądarka nie wspiera Canvas 2D.')

  cropCtx.drawImage(
    fullCanvas,
    cropX,
    cropY,
    cropW,
    cropH,
    0,
    0,
    cropW,
    cropH,
  )

  if (filter !== 'none') applyShader(cropCtx, SHADERS[filter])

  return canvasToJpegBlob(cropCanvas)
}
