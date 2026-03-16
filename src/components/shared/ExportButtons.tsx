import { useState } from 'react'
import { Copy, Check, FileDown, Loader2 } from 'lucide-react'
import { exportCharacterAsText } from '@/lib/exportText'
import { Button } from '@/components/ui/Button'

interface ExportCharacter {
  name: string
  age: number
  gender: string
  appearance: string
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
}

interface ExportButtonsProps {
  character: ExportCharacter
}

export function ExportButtons({ character }: ExportButtonsProps) {
  const [copied, setCopied] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  const handleCopyText = async () => {
    const text = exportCharacterAsText(character)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const handleDownloadPdf = async () => {
    setPdfLoading(true)
    try {
      const { exportCharacterAsPdf } = await import('@/lib/exportPdf')
      const bytes = await exportCharacterAsPdf(character)
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${character.name || 'postac'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF export error:', err)
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" onClick={handleCopyText}>
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Skopiowano!' : 'Kopiuj tekst'}
      </Button>
      <Button variant="secondary" onClick={handleDownloadPdf} disabled={pdfLoading}>
        {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
        {pdfLoading ? 'Generowanie...' : 'Pobierz PDF'}
      </Button>
    </div>
  )
}
