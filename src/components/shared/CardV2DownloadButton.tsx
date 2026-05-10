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

interface FrontWin extends Window { setCharacter?: (d: unknown) => void }
interface BackWin extends Window { setCardBackData?: (d: unknown) => void }

/**
 * Builds an off-screen iframe loading card_full.html (which itself loads
 * card_front.html and card_back_toc.html), pushes mapped data straight to
 * each inner iframe's API (skipping the postMessage bridge for reliability),
 * then triggers print on the wrapper window. Browser print dialog →
 * "Save as PDF" produces a 2-page A4 PDF with vector text.
 */
export function CardV2DownloadButton({ character, variant = 'primary', label }: Props) {
  const [busy, setBusy] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  const handleClick = async () => {
    setBusy(true)
    try {
      iframeRef.current?.remove()

      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.left = '-99999px'
      iframe.style.top = '0'
      iframe.style.width = '210mm'
      iframe.style.height = '600mm'
      iframe.style.border = 'none'
      iframe.setAttribute('aria-hidden', 'true')
      iframeRef.current = iframe
      document.body.appendChild(iframe)

      const front = characterToCardFrontData(character)
      const back = characterToCardBackData(character)
      console.log('[CardV2] front data:', front)
      console.log('[CardV2] back data:', back)

      const wrapperWin = await new Promise<Window>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error('Timeout: card_full.html nie odpowiedział na ready')),
          8000,
        )
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

      // Direct same-origin function calls, skipping the postMessage bridge.
      // The bridge stays as fallback for cases where direct access fails
      // (e.g. data:-URL iframes).
      const fullDoc = wrapperWin.document
      const frontFrame = fullDoc.getElementById('frontFrame') as HTMLIFrameElement | null
      const backFrame = fullDoc.getElementById('backFrame') as HTMLIFrameElement | null

      const frontWin = frontFrame?.contentWindow as FrontWin | null
      const backWin = backFrame?.contentWindow as BackWin | null

      let pushedFront = false
      let pushedBack = false
      try {
        if (frontWin && typeof frontWin.setCharacter === 'function') {
          frontWin.setCharacter(front)
          pushedFront = true
          console.log('[CardV2] pushed front directly')
        }
      } catch (e) { console.warn('[CardV2] direct front push failed, will postMessage', e) }
      try {
        if (backWin && typeof backWin.setCardBackData === 'function') {
          backWin.setCardBackData(back)
          pushedBack = true
          console.log('[CardV2] pushed back directly')
        }
      } catch (e) { console.warn('[CardV2] direct back push failed, will postMessage', e) }

      if (!pushedFront) {
        wrapperWin.postMessage({ type: 'card-full:set-character', payload: front }, '*')
        console.log('[CardV2] front via bridge postMessage')
      }
      if (!pushedBack) {
        wrapperWin.postMessage({ type: 'card-full:set-back-data', payload: back }, '*')
        console.log('[CardV2] back via bridge postMessage')
      }

      // Give the browser a tick to paint after data binding before printing.
      await new Promise((r) => setTimeout(r, 450))
      wrapperWin.focus()
      wrapperWin.print()

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
