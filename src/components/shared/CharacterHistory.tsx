import { useState } from 'react'
import { ChevronDown, ChevronRight, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { HistoryEntry } from '@/types/character'

interface CharacterHistoryProps {
  entries: HistoryEntry[]
  onRestore?: (snapshot: HistoryEntry['snapshot']) => void
}

function formatChangedBy(changedBy: string): string {
  if (changedBy === 'admin') return 'Admin'
  if (changedBy.startsWith('link:')) return 'Link edycji'
  return changedBy
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function CharacterHistory({ entries, onRestore }: CharacterHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (entries.length === 0) {
    return <p className="text-sm text-coc-text-muted">Brak historii zmian.</p>
  }

  return (
    <div className="space-y-1">
      {entries.map((entry) => {
        const isExpanded = expandedId === entry.id
        return (
          <div key={entry.id} className="border border-coc-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : entry.id)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-coc-surface-light transition-colors cursor-pointer"
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
              <span className="text-coc-text-muted">{formatDate(entry.created_at)}</span>
              <span className="font-medium">{formatChangedBy(entry.changed_by)}</span>
              {entry.change_comment && (
                <span className="text-coc-text-muted truncate">— {entry.change_comment}</span>
              )}
            </button>
            {isExpanded && (
              <div className="px-3 pb-3 border-t border-coc-border">
                <div className="mt-2 text-xs text-coc-text-muted space-y-1 max-h-[200px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-mono">{JSON.stringify(entry.snapshot, null, 2)}</pre>
                </div>
                {onRestore && (
                  <Button variant="ghost" size="sm" onClick={() => onRestore(entry.snapshot)} className="mt-2">
                    <RotateCcw className="w-3.5 h-3.5" /> Przywróć tę wersję
                  </Button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
