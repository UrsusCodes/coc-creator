const BACKSTORY_LABELS: Record<string, string> = {
  ideology: 'Ideologia / Przekonania',
  significant_people_who: 'Ważne osoby — Kto',
  significant_people_why: 'Ważne osoby — Dlaczego',
  meaningful_locations: 'Znaczące miejsca',
  treasured_possessions: 'Rzeczy osobiste',
  traits: 'Przymioty',
  appearance_description: 'Opis postaci',
  key_connection: 'Kluczowa więź',
}

interface BackstoryEditorProps {
  backstory: Record<string, string>
  onChange: (key: string, value: string) => void
}

export function BackstoryEditor({ backstory, onChange }: BackstoryEditorProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider">Historia postaci</h4>
      <div className="space-y-2">
        {Object.entries(BACKSTORY_LABELS).map(([key, label]) => (
          <div key={key}>
            <label className="block text-xs text-coc-text-muted mb-0.5">{label}</label>
            <textarea
              value={backstory[key] ?? ''}
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
