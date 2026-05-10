import { useRef, useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { CharacterSheetData } from '@/components/shared/CharacterSheet'
import { characterToCardFrontData } from '@/lib/cardFrontMap'
import { characterToCardBackData } from '@/lib/backTocV2Map'

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')
const FULL_URL = `${BASE}/templates/card-v2/card_full.html`

interface Props {
  character: CharacterSheetData
  variant?: 'primary' | 'secondary'
  label?: string
}

/**
 * Renders an off-screen iframe pointing at card_full.html (front+back wrapper),
 * pushes mapped data to both child iframes via postMessage, then triggers
 * print on the wrapper window. Browser print dialog → "Save as PDF" produces
 * a 2-page A4 PDF with vector text. No PNG overlay, no manual coordinates.
 */
export function CardV2DownloadButton({ character, variant = 'primary', label }: Props) {
  const [busy, setBusy] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  const handleClick = async () => {
    setBusy(true)
    try {
      // Tear down any previous iframe so the load + ready handshake runs fresh.
      iframeRef.current?.remove()

      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.left = '-99999px'
      iframe.style.top = '0'
      iframe.style.width = '210mm'
      iframe.style.height = '600mm' // tall enough for both pages
      iframe.style.border = 'none'
      iframe.setAttribute('aria-hidden', 'true')
      iframeRef.current = iframe
      document.body.appendChild(iframe)

      const front = characterToCardFrontData(character)
      const back = characterToCardBackData(character)

      const ready = await new Promise<Window>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout: card_full.html nie odpowiedział na ready')), 8000)
        const onMessage = (e: MessageEvent) => {
          if (e.source !== iframe.contentWindow) return
          if (e.data?.type === 'card-full:ready') {
            clearTimeout(timeout)
            window.removeEventListener('message', onMessage)
            resolve(iframe.contentWindow as Window)
          }
        }
        window.addEventListener('message', onMessage)
        iframe.src = FULL_URL
      })

      ready.postMessage({ type: 'card-full:set-character', payload: front }, '*')
      ready.postMessage({ type: 'card-full:set-back-data',  payload: back  }, '*')

      // Allow render + font swap before printing.
      await new Promise((r) => setTimeout(r, 400))
      ready.focus()
      ready.print()

      // Don't tear down immediately — Chrome's print can be async. Cleanup on next tick.
      setTimeout(() => { iframeRef.current?.remove(); iframeRef.current = null }, 1500)
    } catch (err) {
      console.error('[CardV2DownloadButton] error:', err)
      iframeRef.current?.remove()
      iframeRef.current = null
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button variant={variant} onClick={handleClick} disabled={busy}>
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
      {busy ? 'Generowanie...' : (label ?? 'Pobierz nowy PDF (przód+tył)')}
    </Button>
  )
}
