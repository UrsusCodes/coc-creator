import { CHARACTERISTIC_MAP } from '@/data/characteristics'
import type { CharacteristicKey } from '@/types/common'

const CHAR_KEYS: CharacteristicKey[] = ['STR', 'CON', 'SIZ', 'DEX', 'APP', 'INT', 'POW', 'EDU']

interface CharacteristicsEditorProps {
  characteristics: Record<string, number>
  luck: number
  onCharChange: (key: string, value: number) => void
  onLuckChange: (value: number) => void
}

export function CharacteristicsEditor({ characteristics, luck, onCharChange, onLuckChange }: CharacteristicsEditorProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider">Cechy</h4>
      <div className="grid grid-cols-4 gap-2">
        {CHAR_KEYS.map((key) => (
          <div key={key} className="text-center bg-coc-surface-light rounded-lg p-2">
            <div className="text-xs text-coc-text-muted mb-1">{CHARACTERISTIC_MAP[key].abbreviation}</div>
            <input
              type="number"
              value={characteristics[key] ?? 0}
              onChange={(e) => onCharChange(key, parseInt(e.target.value) || 0)}
              min={0}
              max={99}
              className="w-full text-center px-1 py-1 bg-coc-surface border border-coc-border rounded text-coc-text font-mono font-bold text-lg focus:outline-none focus:border-coc-accent-light [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-coc-text-muted">Szczęście:</span>
        <input
          type="number"
          value={luck}
          onChange={(e) => onLuckChange(parseInt(e.target.value) || 0)}
          min={0}
          max={99}
          className="w-20 text-center px-2 py-1 bg-coc-surface-light border border-coc-border rounded text-coc-text font-mono font-bold focus:outline-none focus:border-coc-accent-light [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>
    </div>
  )
}
