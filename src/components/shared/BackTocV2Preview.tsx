import { useEffect, useMemo, useRef, useState } from 'react'
import { Printer } from 'lucide-react'
import type { CharacterSheetData } from '@/components/shared/CharacterSheet'
import { characterToCardBackData } from '@/lib/backTocV2Map'
import { Button } from '@/components/ui/Button'

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')
const TEMPLATE_URL = `${BASE}/templates/back-toc-v2/card_back_toc.html`

interface Props {
  character: CharacterSheetData
}

/**
 * Renders the new HTML back card (Drive+Pillars variant) in an iframe and
 * pushes mapped character data via window.setCardBackData.
 *
 * The template is A4 (210mm × 297mm) — ~794×1123 CSS px at 96dpi. We scale
 * it to fit the container width while preserving the print aspect ratio so
 * the layout renders identically to the eventual PDF.
 */
export function BackTocV2Preview({ character }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  const data = useMemo(() => characterToCardBackData(character), [character])

  // Push data to the iframe via setCardBackData (or postMessage if unreachable).
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    let pushed = false
    const push = () => {
      if (pushed) return
      try {
        const win = iframe.contentWindow as (Window & {
          setCardBackData?: (d: unknown) => void
        }) | null
        if (win && typeof win.setCardBackData === 'function') {
          win.setCardBackData(data)
          pushed = true
          return
        }
      } catch {
        // cross-origin guard — fall back to postMessage
      }
      iframe.contentWindow?.postMessage({ type: 'card-back-toc:set-data', payload: data }, '*')
      pushed = true
    }

    const handleReady = (e: MessageEvent) => {
      if (e.source === iframe.contentWindow && e.data?.type === 'card-back-toc:ready') push()
    }
    window.addEventListener('message', handleReady)

    iframe.addEventListener('load', push)
    // If the iframe was already loaded by the time effect ran, push immediately.
    if (iframe.contentDocument?.readyState === 'complete') push()

    return () => {
      window.removeEventListener('message', handleReady)
      iframe.removeEventListener('load', push)
    }
  }, [data])

  // Fit-to-width scaling.
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const A4_W_PX = 794 // 210mm @ 96dpi
    const update = () => {
      const w = wrapper.clientWidth
      setScale(Math.min(1, w / A4_W_PX))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(wrapper)
    return () => ro.disconnect()
  }, [])

  const handlePrint = () => {
    const win = iframeRef.current?.contentWindow
    if (!win) return
    win.focus()
    win.print()
  }

  return (
    <div ref={wrapperRef} className="w-full space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-coc-text-muted">
          Print → „Zapisz jako PDF" w dialogu drukowania.
        </div>
        <Button size="sm" variant="secondary" onClick={handlePrint}>
          <Printer className="w-3.5 h-3.5" />
          Pobierz tył (PDF)
        </Button>
      </div>
      <div
        style={{
          width: '100%',
          height: 1123 * scale,
          overflow: 'hidden',
          background: '#1d1d1d',
          borderRadius: 8,
        }}
      >
        <iframe
          ref={iframeRef}
          src={TEMPLATE_URL}
          title="Karta — tył (ToC v2)"
          style={{
            width: 794,
            height: 1123,
            border: 'none',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        />
      </div>
    </div>
  )
}
