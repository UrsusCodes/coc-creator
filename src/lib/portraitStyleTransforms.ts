/**
 * Browser-side portrait style transforms (Chat-paste flow).
 * Spec: docs/CoCCreator_obsidian/specs/portrait_prompt_methodology.md
 *
 * Takes one master image (Blob/File) and returns 4 stylistic variants
 * as JPEG Blobs:
 *   color  — re-encoded as JPEG, no transform
 *   faded  — saturation reduction (lerp 70% original + 30% gray)
 *   sepia  — sepia matrix transform
 *   bw     — luminance grayscale
 *
 * The same arithmetic shaders as the (now deadcoded) edge-fn version,
 * but running in `<canvas>` via getImageData / putImageData.
 *
 * The master is also resized to a max dimension to keep Storage usage
 * predictable (default 800x1200 for full-body 2:3 portraits).
 */

import type { PortraitStyle } from './artPrompt'

export const STYLE_ORDER: PortraitStyle[] = ['color', 'faded', 'sepia', 'bw']

export const STYLE_LABELS_PL: Record<PortraitStyle, string> = {
  color: 'kolor',
  faded: 'wyblakły',
  sepia: 'sepia',
  bw: 'czarno-białe',
}

const MAX_LONG_EDGE = 1200 // resize to this on the long edge before transforms
const JPEG_QUALITY = 0.82

/**
 * Decode a Blob/File into an HTMLImageElement (via blob URL).
 * Caller should `URL.revokeObjectURL` if needed; we revoke internally.
 */
async function decodeImage(source: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(source)
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Nie udało się zdekodować obrazu.'))
      img.src = url
    })
  } finally {
    // Defer revoke so the image stays valid during drawImage. Browsers
    // tolerate revoke after the image is decoded; revoking immediately
    // is fine in practice.
    URL.revokeObjectURL(url)
  }
}

/**
 * Draw the source onto a freshly sized canvas and return the 2D context
 * with pixel data ready for transformation.
 */
function drawToCanvas(
  img: HTMLImageElement,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
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

/**
 * Apply a per-pixel RGB transform in-place on the given canvas context's
 * full-frame ImageData.
 */
function applyTransform(
  ctx: CanvasRenderingContext2D,
  fn: (r: number, g: number, b: number) => [number, number, number],
): void {
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = fn(data[i], data[i + 1], data[i + 2])
    data[i] = Math.max(0, Math.min(255, Math.round(r)))
    data[i + 1] = Math.max(0, Math.min(255, Math.round(g)))
    data[i + 2] = Math.max(0, Math.min(255, Math.round(b)))
    // alpha (data[i + 3]) untouched
  }
  ctx.putImageData(imageData, 0, 0)
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

/**
 * Generate all 4 style variants from a single master image.
 * Returns the same 4 keys as PortraitStyle.
 */
export async function buildAllStyleVariants(
  master: Blob,
): Promise<Record<PortraitStyle, Blob>> {
  const img = await decodeImage(master)

  // Helper: fresh canvas per variant so transforms don't compound.
  const makeColorCanvas = () => drawToCanvas(img)

  // 1. Color — just re-encode at our quality/size baseline
  const colorBlob = await canvasToJpegBlob(makeColorCanvas().canvas)

  // 2. Faded — saturation reduction (70% original + 30% luminance)
  const fadedSetup = makeColorCanvas()
  applyTransform(fadedSetup.ctx, (r, g, b) => {
    const y = 0.299 * r + 0.587 * g + 0.114 * b
    return [r * 0.7 + y * 0.3, g * 0.7 + y * 0.3, b * 0.7 + y * 0.3]
  })
  const fadedBlob = await canvasToJpegBlob(fadedSetup.canvas)

  // 3. Sepia — classic sepia matrix
  const sepiaSetup = makeColorCanvas()
  applyTransform(sepiaSetup.ctx, (r, g, b) => [
    0.393 * r + 0.769 * g + 0.189 * b,
    0.349 * r + 0.686 * g + 0.168 * b,
    0.272 * r + 0.534 * g + 0.131 * b,
  ])
  const sepiaBlob = await canvasToJpegBlob(sepiaSetup.canvas)

  // 4. Black & white — luminance grayscale
  const bwSetup = makeColorCanvas()
  applyTransform(bwSetup.ctx, (r, g, b) => {
    const y = 0.299 * r + 0.587 * g + 0.114 * b
    return [y, y, y]
  })
  const bwBlob = await canvasToJpegBlob(bwSetup.canvas)

  return {
    color: colorBlob,
    faded: fadedBlob,
    sepia: sepiaBlob,
    bw: bwBlob,
  }
}
