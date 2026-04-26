import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { OCCUPATIONS } from '@/data/occupations'

interface BasicInfoEditorProps {
  data: {
    name: string
    age: number
    gender: string
    appearance: string
    player_name?: string
    status: string
    occupation_id: string
    distinguisher?: string
  }
  onChange: (field: string, value: string | number) => void
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Szkic' },
  { value: 'submitted', label: 'Zatwierdzona' },
]

export function BasicInfoEditor({ data, onChange }: BasicInfoEditorProps) {
  const occupationOptions = OCCUPATIONS.map((o) => ({ value: o.id, label: o.name }))

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider">Informacje podstawowe</h4>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Imię postaci" value={data.name} onChange={(e) => onChange('name', e.target.value)} />
        <Input label="Gracz" value={data.player_name ?? ''} onChange={(e) => onChange('player_name', e.target.value)} />
        <Input label="Wiek" type="number" value={data.age} onChange={(e) => onChange('age', parseInt(e.target.value) || 0)} />
        <Input label="Płeć" value={data.gender} onChange={(e) => onChange('gender', e.target.value)} />
        <Select label="Status" value={data.status} options={STATUS_OPTIONS} onChange={(e) => onChange('status', e.target.value)} />
        <Select label="Zawód" value={data.occupation_id} options={occupationOptions} onChange={(e) => onChange('occupation_id', e.target.value)} />
        <Input label="Wyróżnik" value={data.distinguisher ?? ''} onChange={(e) => onChange('distinguisher', e.target.value)} placeholder="np. Śledczy, Kapitan..." />
      </div>
      <div>
        <label className="block text-sm font-medium text-coc-text-muted mb-1">Wygląd</label>
        <textarea
          value={data.appearance}
          onChange={(e) => onChange('appearance', e.target.value)}
          className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text focus:outline-none focus:border-coc-accent-light transition-colors min-h-[60px] resize-y"
        />
      </div>
    </div>
  )
}
