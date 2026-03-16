import { useState } from 'react'
import { useCharacterStore } from '@/stores/characterStore'
import { DRIVES, PILLAR_EXAMPLES, SOURCE_CATEGORIES, getPillarCount, getSourceCount } from '@/data/drivePillars'
import type { Backstory, StabilitySource } from '@/types/character'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'

export function StepDrivePillars() {
  const store = useCharacterStore()
  const san = store.derived?.san ?? 0
  const pillarCount = getPillarCount(san)
  const sourceCount = getSourceCount(san)

  const [backstory, setBackstory] = useState<Partial<Backstory>>({
    ...store.backstory,
    pillars: store.backstory.pillars ?? Array(pillarCount).fill(''),
    sources: store.backstory.sources ?? Array(sourceCount).fill(null).map(() => ({ name: '', category: 'person' as const, description: '' })),
  })

  const [errors, setErrors] = useState<string[]>([])

  const selectedDrive = DRIVES.find((d) => d.id === backstory.drive)

  // --- Pillars ---
  const pillars = backstory.pillars ?? []

  const updatePillar = (index: number, value: string) => {
    const updated = [...pillars]
    updated[index] = value
    setBackstory((prev) => ({ ...prev, pillars: updated }))
  }

  // --- Sources ---
  const sources = backstory.sources ?? []

  const updateSource = (index: number, field: keyof StabilitySource, value: string) => {
    const updated = [...sources]
    updated[index] = { ...updated[index], [field]: value }
    setBackstory((prev) => ({ ...prev, sources: updated }))
  }

  // --- Validation ---
  const validate = (): boolean => {
    const errs: string[] = []
    if (!backstory.drive) errs.push('Wybierz motywację.')
    for (let i = 0; i < pillarCount; i++) {
      if (!pillars[i]?.trim()) errs.push(`Filar ${i + 1} nie może być pusty.`)
    }
    // Check pillar duplicates
    const trimmedPillars = pillars.slice(0, pillarCount).map((p) => p.trim().toLowerCase()).filter(Boolean)
    if (new Set(trimmedPillars).size !== trimmedPillars.length) errs.push('Filary nie mogą się powtarzać.')

    for (let i = 0; i < sourceCount; i++) {
      if (!sources[i]?.name?.trim()) errs.push(`Źródło ${i + 1}: podaj nazwę.`)
      if (!sources[i]?.category) errs.push(`Źródło ${i + 1}: wybierz kategorię.`)
    }
    const trimmedSources = sources.slice(0, sourceCount).map((s) => s.name.trim().toLowerCase()).filter(Boolean)
    if (new Set(trimmedSources).size !== trimmedSources.length) errs.push('Źródła nie mogą się powtarzać.')

    setErrors(errs)
    return errs.length === 0
  }

  const handleNext = () => {
    if (!validate()) return
    store.setBackstory(backstory)
    store.nextStep()
  }

  return (
    <Card title="Motywacja, Filary i Źródła">
      <div className="space-y-8">

        {/* 1. Character description */}
        <section>
          <h4 className="text-sm font-medium uppercase tracking-wider text-coc-text-muted mb-1">Opis postaci</h4>
          <p className="text-xs text-coc-text-muted mb-2">Opisz wygląd, zachowanie i pierwsze wrażenie jakie twój Badacz robi na innych.</p>
          <textarea
            value={backstory.appearance_description ?? ''}
            onChange={(e) => setBackstory((prev) => ({ ...prev, appearance_description: e.target.value }))}
            placeholder="np. Wysoki, szczupły mężczyzna o przenikliwym spojrzeniu..."
            className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light transition-colors min-h-[80px] resize-y"
          />
        </section>

        {/* 2. Drive */}
        <section>
          <h4 className="text-sm font-medium uppercase tracking-wider text-coc-text-muted mb-1">Motywacja</h4>
          <p className="text-xs text-coc-text-muted mb-3">
            Motywacja to główny powód, dla którego twój Badacz angażuje się w sprawy Mitów — coś ważniejszego niż życie czy zdrowie psychiczne. Wybierz jedną motywację z listy.
          </p>
          <Select
            value={backstory.drive ?? ''}
            onChange={(e) => setBackstory((prev) => ({ ...prev, drive: e.target.value }))}
            options={DRIVES.map((d) => ({ value: d.id, label: d.name }))}
            placeholder="Wybierz motywację..."
          />
          {selectedDrive && (
            <div className="mt-2 p-3 bg-coc-surface-light border border-coc-border rounded-lg">
              <div className="text-sm font-medium mb-1">{selectedDrive.name}</div>
              <div className="text-xs text-coc-text-muted">{selectedDrive.description}</div>
            </div>
          )}
          <div className="mt-2">
            <input
              value={backstory.drive_detail ?? ''}
              onChange={(e) => setBackstory((prev) => ({ ...prev, drive_detail: e.target.value }))}
              placeholder="Opcjonalne uszczegółowienie motywacji..."
              className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light transition-colors"
            />
          </div>
        </section>

        {/* 3. Pillars of Sanity */}
        <section>
          <h4 className="text-sm font-medium uppercase tracking-wider text-coc-text-muted mb-1">
            Filary Poczytalności ({pillarCount})
          </h4>
          <p className="text-xs text-coc-text-muted mb-2">
            Filary to abstrakcyjne zasady lub przekonania, które utrzymują twojego Badacza przy zdrowych zmysłach. Odkrycie prawdy Mitów, która podważa dany filar, powoduje dodatkową utratę Poczytalności.
          </p>
          <p className="text-xs text-coc-text-muted mb-3">
            Poczytalność: <span className="font-mono font-bold">{san}</span> → <span className="font-bold">{pillarCount}</span> {pillarCount === 1 ? 'filar' : pillarCount < 5 ? 'filary' : 'filarów'}
            {' '}(1 na każde pełne 20 PP)
          </p>
          {pillarCount === 0 ? (
            <p className="text-sm text-coc-text-muted italic">Za mała poczytalność na filary.</p>
          ) : (
            <div className="space-y-2">
              {Array.from({ length: pillarCount }).map((_, i) => (
                <div key={i}>
                  <label className="text-xs text-coc-text-muted mb-0.5 block">Filar {i + 1}</label>
                  <input
                    value={pillars[i] ?? ''}
                    onChange={(e) => updatePillar(i, e.target.value)}
                    placeholder="Wpisz filar lub wybierz z przykładów poniżej..."
                    className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light transition-colors"
                  />
                </div>
              ))}
              <details className="mt-2">
                <summary className="text-xs text-coc-text-muted cursor-pointer hover:text-coc-text transition-colors">
                  Przykłady filarów (kliknij aby wybrać)
                </summary>
                <div className="mt-1 space-y-0.5">
                  {PILLAR_EXAMPLES.map((example) => {
                    const name = example.split(' — ')[0]
                    return (
                      <button
                        key={example}
                        type="button"
                        onClick={() => {
                          const emptyIdx = pillars.findIndex((p, idx) => idx < pillarCount && !p.trim())
                          if (emptyIdx >= 0) updatePillar(emptyIdx, name)
                        }}
                        className="block w-full text-left text-xs py-1 px-2 rounded hover:bg-coc-surface-light text-coc-text-muted hover:text-coc-text transition-colors cursor-pointer"
                      >
                        {example}
                      </button>
                    )
                  })}
                </div>
              </details>
            </div>
          )}
        </section>

        {/* 4. Sources of Stability */}
        <section>
          <h4 className="text-sm font-medium uppercase tracking-wider text-coc-text-muted mb-1">
            Źródła Stabilności ({sourceCount})
          </h4>
          <p className="text-xs text-coc-text-muted mb-2">
            Źródło to konkretna osoba, miejsce lub organizacja, która utrzymuje Badacza przy zdrowych zmysłach. Zagrożenie lub zniszczenie źródła powoduje utratę Poczytalności. Między przygodami, kontakt ze źródłem może pomóc ją odzyskać.
          </p>
          <p className="text-xs text-coc-text-muted mb-3">
            Poczytalność: <span className="font-mono font-bold">{san}</span> → <span className="font-bold">{sourceCount}</span> {sourceCount === 1 ? 'źródło' : sourceCount < 5 ? 'źródła' : 'źródeł'}
            {' '}(1 na każde pełne 15 PP)
          </p>
          {sourceCount === 0 ? (
            <p className="text-sm text-coc-text-muted italic">Za mała poczytalność na źródła stabilności.</p>
          ) : (
            <div className="space-y-4">
              {Array.from({ length: sourceCount }).map((_, i) => (
                <div key={i} className="p-3 bg-coc-surface-light border border-coc-border rounded-lg space-y-2">
                  <div className="text-xs font-medium text-coc-text-muted">Źródło {i + 1}</div>
                  <input
                    value={sources[i]?.name ?? ''}
                    onChange={(e) => updateSource(i, 'name', e.target.value)}
                    placeholder="Nazwa (np. Ojciec Thomas, Biblioteka Widener, Loża Oddfellows)"
                    className="w-full px-3 py-1.5 bg-coc-surface border border-coc-border rounded text-sm text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light transition-colors"
                  />
                  <div className="flex gap-2">
                    {SOURCE_CATEGORIES.map((cat) => {
                      const isSelected = sources[i]?.category === cat.value
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => updateSource(i, 'category', cat.value)}
                          className={`flex-1 text-xs py-1.5 px-2 rounded border transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-coc-accent/20 border-coc-accent/50 text-coc-accent-light'
                              : 'bg-coc-surface border-coc-border text-coc-text-muted hover:border-coc-accent/30'
                          }`}
                        >
                          <div className="font-medium">{cat.label}</div>
                          <div className="text-[10px] opacity-70">{cat.description}</div>
                        </button>
                      )
                    })}
                  </div>
                  <textarea
                    value={sources[i]?.description ?? ''}
                    onChange={(e) => updateSource(i, 'description', e.target.value)}
                    placeholder="Krótki opis..."
                    rows={2}
                    className="w-full px-3 py-1.5 bg-coc-surface border border-coc-border rounded text-sm text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light transition-colors resize-y"
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 5. Other traits */}
        <section>
          <h4 className="text-sm font-medium uppercase tracking-wider text-coc-text-muted mb-1">Inne przymioty</h4>
          <p className="text-xs text-coc-text-muted mb-2">Dodatkowe cechy charakteru, nawyki, dziwactwa — wszystko co nie zmieściło się powyżej.</p>
          <textarea
            value={backstory.other_traits ?? ''}
            onChange={(e) => setBackstory((prev) => ({ ...prev, other_traits: e.target.value }))}
            placeholder="np. Nie rozstaje się z zegarkiem kieszonkowym po dziadku..."
            className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light transition-colors min-h-[80px] resize-y"
          />
        </section>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="p-3 bg-coc-danger/10 border border-coc-danger/30 rounded-lg">
            {errors.map((err, i) => (
              <p key={i} className="text-sm text-coc-danger">{err}</p>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="secondary" onClick={() => store.prevStep()}>Wstecz</Button>
        <Button onClick={handleNext}>Dalej</Button>
      </div>
    </Card>
  )
}
