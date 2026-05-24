import { DRIVES, SOURCE_CATEGORIES } from '@/data/drivePillars'
import { Select } from '@/components/ui/Select'
import type { StabilitySource } from '@/types/character'

const TRADITIONAL_LABELS: Record<string, string> = {
  ideology: 'Ideologia / Przekonania',
  significant_people_who: 'Ważne osoby — Kto',
  significant_people_why: 'Ważne osoby — Dlaczego',
  meaningful_locations: 'Znaczące miejsca',
  treasured_possessions: 'Rzeczy osobiste',
  traits: 'Przymioty',
  appearance_description: 'Opis postaci',
  key_connection: 'Kluczowa więź',
}

const DRIVE_PILLARS_LABELS: Record<string, string> = {
  appearance_description: 'Opis postaci',
  drive_detail: 'Szczegóły motywacji',
  other_traits: 'Inne przymioty',
}

interface BackstoryEditorProps {
  backstory: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
}

export function BackstoryEditor({ backstory, onChange }: BackstoryEditorProps) {
  const isDrivePillars = 'drive' in backstory

  if (isDrivePillars) {
    const pillars = (backstory.pillars as string[]) ?? []
    const sources = (backstory.sources as StabilitySource[]) ?? []

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider">Motywacja i Filary</h4>

        {/* Drive */}
        <Select
          label="Motywacja"
          value={(backstory.drive as string) ?? ''}
          onChange={(e) => onChange('drive', e.target.value)}
          options={DRIVES.map((d) => ({ value: d.id, label: d.name }))}
        />

        {/* Text fields */}
        {Object.entries(DRIVE_PILLARS_LABELS).map(([key, label]) => (
          <div key={key}>
            <label className="block text-xs text-coc-text-muted mb-0.5">{label}</label>
            <textarea
              value={(backstory[key] as string) ?? ''}
              onChange={(e) => onChange(key, e.target.value)}
              rows={2}
              className="w-full px-3 py-1.5 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text focus:outline-none focus:border-coc-accent-light transition-colors resize-y"
            />
          </div>
        ))}

        {/* Pillars */}
        <div>
          <label className="block text-xs text-coc-text-muted mb-1">Filary Poczytalności</label>
          {pillars.map((p, i) => (
            <input
              key={i}
              value={p}
              onChange={(e) => {
                const updated = [...pillars]
                updated[i] = e.target.value
                onChange('pillars', updated)
              }}
              placeholder={`Filar ${i + 1}`}
              className="w-full px-3 py-1.5 mb-1 bg-coc-surface-light border border-coc-border rounded text-sm text-coc-text focus:outline-none focus:border-coc-accent-light transition-colors"
            />
          ))}
        </div>

        {/* Sources */}
        <div>
          <label className="block text-xs text-coc-text-muted mb-1">Źródła Stabilności</label>
          {sources.map((s, i) => (
            <div key={i} className="p-2 bg-coc-surface-light border border-coc-border rounded-lg mb-1 space-y-1">
              <input
                value={s.name}
                onChange={(e) => {
                  const updated = [...sources]
                  updated[i] = { ...updated[i], name: e.target.value }
                  onChange('sources', updated)
                }}
                placeholder="Nazwa"
                className="w-full px-2 py-1 bg-coc-surface border border-coc-border rounded text-sm text-coc-text focus:outline-none focus:border-coc-accent-light transition-colors"
              />
              <select
                value={s.category}
                onChange={(e) => {
                  const updated = [...sources]
                  updated[i] = { ...updated[i], category: e.target.value as StabilitySource['category'] }
                  onChange('sources', updated)
                }}
                className="w-full px-2 py-1 bg-coc-surface border border-coc-border rounded text-sm text-coc-text focus:outline-none focus:border-coc-accent-light transition-colors cursor-pointer"
              >
                {SOURCE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <textarea
                value={s.description}
                onChange={(e) => {
                  const updated = [...sources]
                  updated[i] = { ...updated[i], description: e.target.value }
                  onChange('sources', updated)
                }}
                placeholder="Opis"
                rows={1}
                className="w-full px-2 py-1 bg-coc-surface border border-coc-border rounded text-sm text-coc-text focus:outline-none focus:border-coc-accent-light transition-colors resize-y"
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Traditional backstory
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider">Historia postaci</h4>
      <div className="space-y-2">
        {Object.entries(TRADITIONAL_LABELS).map(([key, label]) => (
          <div key={key}>
            <label className="block text-xs text-coc-text-muted mb-0.5">{label}</label>
            <textarea
              value={(backstory[key] as string) ?? ''}
              onChange={(e) => onChange(key, e.target.value)}
              rows={2}
              className="w-full px-3 py-1.5 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text focus:outline-none focus:border-coc-accent-light transition-colors resize-y"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
