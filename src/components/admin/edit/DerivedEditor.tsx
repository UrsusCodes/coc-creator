interface DerivedEditorProps {
  derived: { hp: number; mp: number; san: number; db: string; build: number; move_rate: number; dodge: number }
  onChange: (field: string, value: number | string) => void
}

const DERIVED_FIELDS = [
  { key: 'hp', label: 'PW', type: 'number' },
  { key: 'mp', label: 'PM', type: 'number' },
  { key: 'san', label: 'PP', type: 'number' },
  { key: 'db', label: 'PO', type: 'text' },
  { key: 'build', label: 'Krzepa', type: 'number' },
  { key: 'move_rate', label: 'Ruch', type: 'number' },
  { key: 'dodge', label: 'Unik', type: 'number' },
] as const

export function DerivedEditor({ derived, onChange }: DerivedEditorProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider">Atrybuty pochodne</h4>
      <div className="grid grid-cols-4 gap-2">
        {DERIVED_FIELDS.map(({ key, label, type }) => (
          <div key={key} className="text-center bg-coc-accent/10 rounded p-2">
            <div className="text-[10px] text-coc-text-muted mb-1">{label}</div>
            <input
              type={type}
              value={derived[key as keyof typeof derived]}
              onChange={(e) => onChange(key, type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)}
              className="w-full text-center px-1 py-0.5 bg-coc-surface border border-coc-border rounded text-coc-text font-mono font-bold focus:outline-none focus:border-coc-accent-light [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
