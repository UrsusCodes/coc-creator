import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { exportCharacterAsText } from '@/lib/exportText'
import { Button } from '@/components/ui/Button'



interface ExportCharacter {
  name: string
  age: number
  gender: string
  appearance: string
  residence?: string
  birthplace?: string
  characteristics: Record<string, number>
  luck: number
  derived: Record<string, unknown>
  occupation_id: string
  occupation_skill_points: Record<string, number>
  personal_skill_points: Record<string, number>
  backstory: Record<string, unknown>
  equipment: string[]
  cash: string
  assets: string
  spending_level: string
  era: string
  method: string
  player_name?: string
  invite_code?: string
  positions?: Record<string, unknown>[]
  contacts?: Record<string, unknown>[]
  main_position?: Record<string, unknown> | null
  additional_positions?: Record<string, unknown>[]
  contacts_v2?: Record<string, unknown>[]
  /** Legacy avatar URL (pre-migration 021); used as fallback for card export. */
  portrait_url?: string
  /** Workshop-edited card portrait — cropped + filtered, ready for PDF. Migration 021. */
  card_portrait_url?: string
}

interface ExportButtonsProps {
  character: ExportCharacter
}

/**
 * Text-only export. Card PDF download lives in CardV2DownloadButton — the
 * legacy pdf-lib pipeline (front PNG + back PNG with manual coords) was
 * retired in favor of browser-print of the new HTML cards.
 */
export function ExportButtons({ character }: ExportButtonsProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyText = async () => {
    const text = exportCharacterAsText(character)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <Button variant="secondary" onClick={handleCopyText}>
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {copied ? 'Skopiowano!' : 'Kopiuj tekst'}
    </Button>
  )
}
