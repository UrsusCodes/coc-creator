import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface EquipmentEditorProps {
  equipment: string[]
  cash: string
  assets: string
  spendingLevel: string
  onEquipmentChange: (equipment: string[]) => void
  onFieldChange: (field: string, value: string) => void
}

export function EquipmentEditor({ equipment, cash, assets, spendingLevel, onEquipmentChange, onFieldChange }: EquipmentEditorProps) {
  const updateItem = (index: number, value: string) => {
    const updated = [...equipment]
    updated[index] = value
    onEquipmentChange(updated)
  }

  const removeItem = (index: number) => {
    onEquipmentChange(equipment.filter((_, i) => i !== index))
  }

  const addItem = () => {
    onEquipmentChange([...equipment, ''])
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider">Ekwipunek i majątek</h4>
      <div className="grid grid-cols-3 gap-3">
        <Input label="Gotówka" value={cash} onChange={(e) => onFieldChange('cash', e.target.value)} />
        <Input label="Dobytek" value={assets} onChange={(e) => onFieldChange('assets', e.target.value)} />
        <Input label="Poziom życia" value={spendingLevel} onChange={(e) => onFieldChange('spending_level', e.target.value)} />
      </div>
      <div className="space-y-1">
        {equipment.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={item}
              onChange={(e) => updateItem(i, e.target.value)}
              className="flex-1 px-3 py-1.5 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text focus:outline-none focus:border-coc-accent-light transition-colors"
            />
            <button type="button" onClick={() => removeItem(i)} className="p-1 text-coc-text-muted hover:text-coc-danger transition-colors cursor-pointer">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={addItem}>
          <Plus className="w-3.5 h-3.5" /> Dodaj przedmiot
        </Button>
      </div>
    </div>
  )
}
