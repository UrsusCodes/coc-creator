import { useState, useCallback, useMemo } from 'react'
import { Dices } from 'lucide-react'
import { useCharacterStore } from '@/stores/characterStore'
import { isYoungCharacter, getAgeRange } from '@/data/ageRanges'
import { CHARACTERISTIC_MAP } from '@/data/characteristics'
import { getAgeModifications } from '@/lib/ageModifiers'
import { rollLuck, rollLuckYoung } from '@/lib/dice'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { NumberInput } from '@/components/ui/NumberInput'
import { Badge } from '@/components/ui/Badge'

export function StepAge() {
  const store = useCharacterStore()
  const isLocked = store.ageLocked
  const isEditReadonly = store.editMode === 'standard'

  const [age, setAge] = useState<number>(store.age ?? 25)
  const [luck, setLuck] = useState<number | null>(store.luck)
  const [luckRolled, setLuckRolled] = useState(store.luck !== null)

  const young = isYoungCharacter(age)
  const mods = useMemo(() => getAgeModifications(age), [age])
  const ageRange = useMemo(() => getAgeRange(age), [age])

  const handleRollLuck = useCallback(() => {
    if (isLocked) return
    const value = young ? rollLuckYoung() : rollLuck()
    setLuck(value)
    store.setLuck(value)
    setLuckRolled(true)
  }, [young, isLocked, store])

  // When age changes, reset luck if it was already rolled (young/adult may differ)
  const handleAgeChange = (newAge: number) => {
    if (isLocked) return
    setAge(newAge)
    store.setAge(newAge)
    if (luckRolled) {
      const wasYoung = isYoungCharacter(age)
      const isNowYoung = isYoungCharacter(newAge)
      if (wasYoung !== isNowYoung) {
        setLuck(null)
        setLuckRolled(false)
        useCharacterStore.setState({ luck: null })
      }
    }
  }

  const method = store.method ?? 'direct'
  const canContinue = age >= 15 && age <= 89 && luck !== null

  const handleNext = () => {
    if (!isLocked) {
      store.setAge(age)
      store.setLuck(luck!)
      store.lockAge()
    }
    store.nextStep()
  }

  // Standard edit mode: show readonly
  if (isEditReadonly) {
    return (
      <Card title="Wiek i Szczęście">
        <div className="mb-4 p-3 bg-coc-surface-light border border-coc-border rounded-lg">
          <p className="text-sm text-coc-text-muted">
            W trybie Standard wiek i szczęście są tylko do odczytu i nie mogą być zmienione.
          </p>
        </div>
        <div className="flex gap-8 mb-6">
          <div>
            <div className="text-sm text-coc-text-muted mb-1">Wiek</div>
            <div className="text-3xl font-bold font-mono">{age}</div>
          </div>
          <div>
            <div className="text-sm text-coc-text-muted mb-1">Szczęście</div>
            <div className="text-3xl font-bold font-mono">{luck ?? '—'}</div>
          </div>
        </div>
        <div className="flex justify-between pt-2">
          <Button variant="secondary" onClick={() => store.prevStep()}>Wstecz</Button>
          <Button onClick={() => store.nextStep()}>Dalej</Button>
        </div>
      </Card>
    )
  }

  return (
    <Card title="Wiek i Szczęście">
      {isLocked && (
        <div className="mb-4">
          <p className="text-sm text-coc-accent-light">
            Wiek i Szczęście zostały zatwierdzone i nie mogą być zmienione.
          </p>
        </div>
      )}

      {/* Age input */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Wiek badacza (15–89)</label>
        {!isLocked && (
          <p className="text-xs text-coc-text-muted mb-2">
            Wiek wpływa na modyfikatory cech w następnym kroku.
          </p>
        )}
        <NumberInput
          value={age}
          onChange={handleAgeChange}
          min={15}
          max={89}
          disabled={isLocked}
        />
      </div>

      {/* Age effects preview */}
      {mods && ageRange && (
        <div className="bg-coc-surface-light border border-coc-border rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Badge>{ageRange.label}</Badge>
          </div>
          <ul className="text-sm text-coc-text-muted space-y-1">
            {mods.eduImprovementChecks > 0 && (
              <li>
                Rzuty na poprawę WYK: <span className="text-coc-accent-light font-medium">{mods.eduImprovementChecks}</span>
              </li>
            )}
            {mods.physicalDeductionTotal > 0 && (
              <li>
                Odliczenia fizyczne: <span className="text-coc-warning font-medium">−{mods.physicalDeductionTotal} pkt</span>
                {' '}z {mods.deductibleStats.map((s) => CHARACTERISTIC_MAP[s].abbreviation).join(', ')}
              </li>
            )}
            {mods.appReduction > 0 && (
              <li>
                Wygląd: <span className="text-coc-warning font-medium">−{mods.appReduction} WYG</span>
              </li>
            )}
            {mods.moveReduction > 0 && (
              <li>
                Ruch: <span className="text-coc-warning font-medium">−{mods.moveReduction}</span>
              </li>
            )}
            {mods.isYoung && (
              <>
                <li>
                  Wykształcenie: <span className="text-coc-warning font-medium">−5 WYK</span>
                </li>
                <li>
                  Szczęście: <span className="text-coc-accent-light font-medium">2 rzuty, lepszy wynik</span>
                </li>
              </>
            )}
            {!mods.isYoung && mods.physicalDeductionTotal === 0 && mods.eduImprovementChecks <= 1 && (
              <li className="text-coc-accent-light">Brak kar wiekowych.</li>
            )}
          </ul>
        </div>
      )}

      {/* Luck */}
      <div className="border-t border-coc-border pt-4 mb-4">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-sm font-medium">Szczęście</div>
            <div className="text-xs text-coc-text-muted">
              3K6×5{young ? ' (2 rzuty, lepszy)' : ''}
            </div>
          </div>
          {method === 'dice' || isLocked ? (
            <>
              <div className={`text-2xl font-bold font-mono px-4 py-2 rounded-lg border ${
                luck ? 'border-coc-accent/30 bg-coc-accent/10' : 'border-coc-border bg-coc-surface-light'
              }`}>
                {luck ?? '—'}
              </div>
              {!luckRolled && !isLocked && (
                <Button size="sm" onClick={handleRollLuck}>
                  <Dices className="w-4 h-4" />
                  Rzuć
                </Button>
              )}
            </>
          ) : (
            <NumberInput
              value={luck ?? 0}
              onChange={(v) => { setLuck(v); store.setLuck(v); setLuckRolled(true) }}
              min={1}
              max={99}
            />
          )}
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={() => store.prevStep()}>Wstecz</Button>
        <Button onClick={handleNext} disabled={!canContinue}>Dalej</Button>
      </div>
    </Card>
  )
}
