import { useState } from 'react'
import { Dices } from 'lucide-react'
import { useCharacterStore } from '@/stores/characterStore'
import { BACKSTORY_TABLES, APPEARANCE_ADJECTIVES } from '@/data/backstoryTables'
import { roll1d10 } from '@/lib/dice'
import type { Backstory } from '@/types/character'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const BACKSTORY_FIELD_MAP: Record<string, keyof Backstory> = {
  ideology: 'ideology',
  significant_people_who: 'significant_people_who',
  significant_people_why: 'significant_people_why',
  meaningful_locations: 'meaningful_locations',
  treasured_possessions: 'treasured_possessions',
  traits: 'traits',
}

export function StepBackstory() {
  const store = useCharacterStore()
  const [backstory, setBackstory] = useState<Partial<Backstory>>(store.backstory)

  const updateField = (key: keyof Backstory, value: string) => {
    setBackstory((prev) => ({ ...prev, [key]: value }))
  }

  const handleRoll = (tableId: string, fieldKey: keyof Backstory) => {
    const table = BACKSTORY_TABLES.find((t) => t.id === tableId)
    if (!table) return
    const rollResult = roll1d10()
    const option = table.options.find((o) => o.roll === rollResult)
    if (option) {
      const current = backstory[fieldKey] ?? ''
      const newValue = current ? `${current}\n\n[Wylosowano ${rollResult}]: ${option.text}` : `[Wylosowano ${rollResult}]: ${option.text}`
      updateField(fieldKey, newValue)
    }
  }

  const handleRandomAppearance = () => {
    const idx = Math.floor(Math.random() * APPEARANCE_ADJECTIVES.length)
    const adj = APPEARANCE_ADJECTIVES[idx]
    const current = backstory.appearance_description ?? ''
    updateField('appearance_description', current ? `${current}, ${adj}` : adj)
  }

  const handleNext = () => {
    store.setBackstory(backstory)
    store.nextStep()
  }

  return (
    <Card title="Historia postaci">
      <p className="text-sm text-coc-text-muted mb-6">
        Opisz historię swojego Badacza. Możesz użyć losowania (1K10) jako inspiracji, a następnie napisać własny tekst.
      </p>

      <div className="space-y-6">
        {/* Random backstory tables */}
        {BACKSTORY_TABLES.map((table) => {
          const fieldKey = BACKSTORY_FIELD_MAP[table.id]
          if (!fieldKey) return null

          return (
            <BackstoryField
              key={table.id}
              label={table.label}
              description={table.description}
              value={(backstory[fieldKey] as string) ?? ''}
              onChange={(v) => updateField(fieldKey, v)}
              onRoll={() => handleRoll(table.id, fieldKey)}
            />
          )
        })}

        {/* Appearance description */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium">Opis postaci</label>
            <Button size="sm" variant="ghost" onClick={handleRandomAppearance}>
              <Dices className="w-3.5 h-3.5" /> Losuj przymiotnik
            </Button>
          </div>
          <p className="text-xs text-coc-text-muted mb-2">
            Wybierz przymiotniki opisujące wygląd i zachowanie postaci.
          </p>
          <textarea
            value={backstory.appearance_description ?? ''}
            onChange={(e) => updateField('appearance_description', e.target.value)}
            placeholder="np. Elegancki, Bystry, Muskularny..."
            className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light transition-colors min-h-[60px] resize-y"
          />
          <div className="flex flex-wrap gap-1 mt-1">
            {APPEARANCE_ADJECTIVES.map((adj) => (
              <button
                key={adj}
                type="button"
                onClick={() => {
                  const current = backstory.appearance_description ?? ''
                  updateField('appearance_description', current ? `${current}, ${adj}` : adj)
                }}
                className="text-xs px-1.5 py-0.5 rounded bg-coc-surface-light border border-coc-border hover:border-coc-accent-light text-coc-text-muted hover:text-coc-text transition-colors cursor-pointer"
              >
                {adj}
              </button>
            ))}
          </div>
        </div>

        {/* Key connection */}
        <div>
          <label className="text-sm font-medium block mb-1">Kluczowa więź</label>
          <p className="text-xs text-coc-text-muted mb-2">
            Opisz najważniejszą więź twojego Badacza — osobę, miejsce, lub rzecz, z którą jest silnie związany.
          </p>
          <textarea
            value={backstory.key_connection ?? ''}
            onChange={(e) => updateField('key_connection', e.target.value)}
            placeholder="np. Moja siostra Alice jest dla mnie najważniejsza na świecie..."
            className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light transition-colors min-h-[80px] resize-y"
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="secondary" onClick={() => store.prevStep()}>Wstecz</Button>
        <Button onClick={handleNext}>Dalej</Button>
      </div>
    </Card>
  )
}

interface BackstoryFieldProps {
  label: string
  description: string
  value: string
  onChange: (value: string) => void
  onRoll: () => void
}

function BackstoryField({ label, description, value, onChange, onRoll }: BackstoryFieldProps) {
  const [showTable, setShowTable] = useState(false)
  const table = BACKSTORY_TABLES.find((t) => t.label === label)

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium">{label}</label>
        <div className="flex gap-1">
          {table && (
            <Button size="sm" variant="ghost" onClick={() => setShowTable(!showTable)}>
              {showTable ? 'Ukryj tabelę' : 'Pokaż tabelę'}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onRoll}>
            <Dices className="w-3.5 h-3.5" /> Losuj (1K10)
          </Button>
        </div>
      </div>
      <p className="text-xs text-coc-text-muted mb-2">{description}</p>

      {showTable && table && (
        <div className="bg-coc-surface-light border border-coc-border rounded-lg p-3 mb-2 max-h-[200px] overflow-y-auto">
          {table.options.map((opt) => (
            <div
              key={opt.roll}
              onClick={() => {
                onChange(value ? `${value}\n\n${opt.text}` : opt.text)
                setShowTable(false)
              }}
              className="text-xs py-1.5 px-2 rounded hover:bg-coc-border/50 cursor-pointer transition-colors"
            >
              <span className="font-mono text-coc-accent-light mr-2">{opt.roll}.</span>
              {opt.text}
            </div>
          ))}
        </div>
      )}

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Wpisz lub wylosuj inspirację powyżej..."
        className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light transition-colors min-h-[80px] resize-y"
      />
    </div>
  )
}
