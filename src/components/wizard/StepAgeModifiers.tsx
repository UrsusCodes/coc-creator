import { useState, useMemo } from 'react'
import { Trash2, Loader2, Minus, Plus } from 'lucide-react'
import { useCharacterStore } from '@/stores/characterStore'
import { getAgeModifications, validateDeductions } from '@/lib/ageModifiers'
import { eduImprovementRoll } from '@/lib/dice'
import { supabase } from '@/lib/supabase'
import type { Characteristics } from '@/types/character'
import type { CharacteristicKey } from '@/types/common'
import { CHARACTERISTIC_MAP } from '@/data/characteristics'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export function StepAgeModifiers() {
  const store = useCharacterStore()
  const age = store.age ?? 25
  const chars = store.characteristics as Characteristics
  const mods = useMemo(() => getAgeModifications(age), [age])
  const isEditReadonly = store.editMode === 'standard'

  // Persist EDU rolls: if all required rolls are already in the store, they're locked
  const requiredRolls = mods?.eduImprovementChecks ?? 0
  const allEduRollsDone = store.eduRolls.length >= requiredRolls && requiredRolls > 0
  const [deductions, setDeductions] = useState<Partial<Record<CharacteristicKey, number>>>(store.ageDeductions)
  const [eduRolls, setEduRolls] = useState<{ roll: number; improved: boolean; newEdu: number }[]>(
    store.eduRolls.length > 0 ? store.eduRolls : []
  )
  const [currentEdu, setCurrentEdu] = useState(
    store.eduAfterRolls ?? chars.EDU
  )
  const [abandoning, setAbandoning] = useState(false)

  const remainingTries = store.maxTries - store.timesUsed - 1
  const canAbandon = remainingTries > 0

  // Standard edit mode: skip this step entirely (age mods already baked into characteristics)
  if (isEditReadonly) {
    return (
      <Card title="Modyfikatory wiekowe">
        <div className="mb-4 p-3 bg-coc-surface-light border border-coc-border rounded-lg">
          <p className="text-sm text-coc-text-muted">
            W trybie Standard modyfikatory wiekowe są tylko do odczytu. Cechy postaci zawierają już zastosowane modyfikatory.
          </p>
        </div>
        {mods && (
          <div className="mb-4">
            <Badge>{mods.ageRange.label}</Badge>
            <p className="text-sm text-coc-text-muted mt-2">{mods.ageRange.deductionDescription}</p>
          </div>
        )}
        <div className="flex justify-between pt-2">
          <Button variant="secondary" onClick={() => store.prevStep()}>Wstecz</Button>
          <Button onClick={() => store.nextStep()}>Dalej</Button>
        </div>
      </Card>
    )
  }

  if (!mods) {
    return (
      <Card title="Modyfikatory wiekowe">
        <p className="text-coc-text-muted">Nieprawidłowy wiek.</p>
        <Button variant="secondary" onClick={() => store.prevStep()}>Wstecz</Button>
      </Card>
    )
  }

  const noModifiers = mods.physicalDeductionTotal === 0 && mods.eduImprovementChecks <= 1 && !mods.isYoung

  const handleEduRoll = () => {
    if (allEduRollsDone) return // Can't re-roll if all rolls already done
    const result = eduImprovementRoll(currentEdu)
    const newRolls = [...eduRolls, result]
    const newEdu = result.improved ? result.newEdu : currentEdu
    setEduRolls(newRolls)
    if (result.improved) {
      setCurrentEdu(result.newEdu)
    }
    // Persist immediately so they survive page refresh
    store.setEduRolls(newRolls, newEdu)
  }

  const handleAbandon = async () => {
    if (!canAbandon || !store.inviteCodeId) return
    setAbandoning(true)
    try {
      await supabase.rpc('increment_times_used', { code_id: store.inviteCodeId })
      store.abandonCharacter()
    } catch {
      setAbandoning(false)
    }
  }

  const setDeduction = (key: CharacteristicKey, value: number) => {
    setDeductions((prev) => ({ ...prev, [key]: value }))
  }

  const totalDeducted = Object.values(deductions).reduce((sum, v) => sum + (v ?? 0), 0)
  const deductionValid = mods.physicalDeductionTotal === 0 || totalDeducted === mods.physicalDeductionTotal
  const eduRollsDone = eduRolls.length >= mods.eduImprovementChecks

  const validation = mods.physicalDeductionTotal > 0
    ? validateDeductions(chars, deductions, mods.deductibleStats, mods.physicalDeductionTotal)
    : { valid: true }

  const canContinue = validation.valid && (mods.eduImprovementChecks === 0 || eduRollsDone)

  const isLocked = store.ageModifiersLocked

  const handleNext = () => {
    if (!isLocked) {
      // Persist EDU rolls in the store (permanent)
      if (eduRolls.length > 0) {
        store.setEduRolls(eduRolls, currentEdu)
      }
      // Save deductions and updated EDU
      store.setAgeDeductions(deductions)
      // Update characteristics with age modifications
      const updatedChars = { ...chars, EDU: Math.min(99, currentEdu) }
      // Apply deductions
      for (const [key, amount] of Object.entries(deductions)) {
        if (amount && amount > 0) {
          updatedChars[key as CharacteristicKey] = Math.max(1, updatedChars[key as CharacteristicKey] - amount)
        }
      }
      // Apply APP reduction
      if (mods.appReduction > 0) {
        updatedChars.APP = Math.max(1, updatedChars.APP - mods.appReduction)
      }
      // Young characters: EDU -5
      if (mods.isYoung) {
        updatedChars.EDU = Math.max(1, updatedChars.EDU - 5)
      }
      store.setCharacteristics(updatedChars)
      store.lockAgeModifiers()
    }
    store.nextStep()
  }

  return (
    <Card title="Modyfikatory wiekowe">
      {isLocked && (
        <div className="mb-4">
          <p className="text-sm text-coc-accent-light">
            Modyfikatory wiekowe zostały zatwierdzone i nie mogą być zmienione.
          </p>
        </div>
      )}

      <div className="mb-4">
        <Badge>{mods.ageRange.label}</Badge>
        <p className="text-sm text-coc-text-muted mt-2">{mods.ageRange.deductionDescription}</p>
      </div>

      {noModifiers && !mods.isYoung && mods.eduImprovementChecks <= 1 && (
        <p className="text-sm text-coc-accent-light mb-4">
          Brak dodatkowych modyfikatorów wiekowych dla tego przedziału.
        </p>
      )}

      {/* EDU improvement rolls */}
      {mods.eduImprovementChecks > 0 && (
        <div className="border-t border-coc-border pt-4 mb-4">
          <h4 className="font-medium mb-2">
            Rzuty na poprawę Wykształcenia ({eduRolls.length} / {mods.eduImprovementChecks})
          </h4>
          <p className="text-xs text-coc-text-muted mb-3">
            Rzuć 1K100. Jeśli wynik &gt; aktualnego WYK ({currentEdu}), dodaj 1K10 do WYK.
            {allEduRollsDone && (
              <span className="text-coc-accent-light ml-1">Rzuty zostały już wykonane i nie można ich cofnąć.</span>
            )}
          </p>

          {eduRolls.map((r, i) => (
            <div key={i} className={`text-sm mb-1 ${r.improved ? 'text-coc-accent-light' : 'text-coc-text-muted'}`}>
              Rzut {i + 1}: {r.roll} {r.improved ? `— Sukces! WYK: ${r.newEdu}` : '— Bez zmian'}
            </div>
          ))}

          {!eduRollsDone && !allEduRollsDone && !isLocked && (
            <Button size="sm" onClick={handleEduRoll} className="mt-2">
              Rzuć na poprawę WYK
            </Button>
          )}

          {eduRollsDone && (
            <p className="text-sm text-coc-accent-light mt-2">
              Aktualne WYK po poprawach: {currentEdu}
            </p>
          )}
        </div>
      )}

      {/* Physical deductions */}
      {mods.physicalDeductionTotal > 0 && (
        <div className="border-t border-coc-border pt-4 mb-4">
          <h4 className="font-medium mb-2">
            Odliczenia fizyczne: rozdziel {mods.physicalDeductionTotal} punktów
          </h4>
          <p className="text-xs text-coc-text-muted mb-3">
            Odejmij punkty od: {mods.deductibleStats.map((s) => CHARACTERISTIC_MAP[s].abbreviation).join(', ')}
          </p>

          <div className="grid grid-cols-3 gap-4">
            {mods.deductibleStats.map((key) => {
              const base = chars[key]
              const ded = deductions[key] ?? 0
              const result = base - ded
              const canDeductMore = !isLocked && ded < Math.min(mods.physicalDeductionTotal, base - 1)
              const canRestore = !isLocked && ded > 0
              return (
                <div key={key} className="space-y-1">
                  <div className="text-sm font-medium">
                    {CHARACTERISTIC_MAP[key].abbreviation}
                    <span className="text-coc-text-muted text-xs ml-1">({base})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDeduction(key, ded + 1)}
                      disabled={!canDeductMore}
                      className="p-1.5 rounded bg-coc-surface-light border border-coc-border hover:bg-coc-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Odejmij punkt"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className={`w-12 text-center py-1.5 text-sm font-mono font-bold rounded border ${
                      ded > 0
                        ? 'text-coc-warning border-coc-warning/30 bg-coc-warning/10'
                        : 'text-coc-text border-coc-border bg-coc-surface-light'
                    }`}>
                      {result}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDeduction(key, ded - 1)}
                      disabled={!canRestore}
                      className="p-1.5 rounded bg-coc-surface-light border border-coc-border hover:bg-coc-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Przywróć punkt"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {ded > 0 && (
                    <div className="text-xs text-coc-warning">−{ded}</div>
                  )}
                </div>
              )
            })}
          </div>

          <p className={`text-sm mt-2 ${deductionValid ? 'text-coc-accent-light' : 'text-coc-warning'}`}>
            Rozdzielono: {totalDeducted} / {mods.physicalDeductionTotal}
          </p>
          {!validation.valid && validation.error && (
            <p className="text-sm text-coc-danger">{validation.error}</p>
          )}
        </div>
      )}

      {/* APP reduction info */}
      {mods.appReduction > 0 && (
        <div className="border-t border-coc-border pt-4 mb-4">
          <p className="text-sm text-coc-text-muted">
            WYG zostanie obniżone o {mods.appReduction} (z {chars.APP} na {Math.max(1, chars.APP - mods.appReduction)}).
          </p>
        </div>
      )}

      {/* Move reduction info */}
      {mods.moveReduction > 0 && (
        <p className="text-sm text-coc-text-muted mb-4">
          Ruch zostanie obniżony o {mods.moveReduction}.
        </p>
      )}

      {/* Young character info */}
      {mods.isYoung && (
        <div className="border-t border-coc-border pt-4 mb-4">
          <p className="text-sm text-coc-text-muted">
            Młody Badacz: WYK zostanie obniżone o 5 (z {chars.EDU} na {Math.max(1, chars.EDU - 5)}).
            Szczęście zostało wylosowane z dwóch rzutów (lepszy wynik).
          </p>
        </div>
      )}

      {/* Abandon character button */}
      <div className="border-t border-coc-border pt-4 mb-4">
        <Button
          variant="ghost"
          onClick={handleAbandon}
          disabled={!canAbandon || abandoning}
          className="text-coc-danger hover:text-coc-danger"
        >
          {abandoning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          Porzuć postać i zrób nową
        </Button>
        <p className="text-xs text-coc-text-muted mt-1">
          {canAbandon
            ? `Zostało Ci ${remainingTries} ${remainingTries === 1 ? 'podejście' : remainingTries < 5 ? 'podejścia' : 'podejść'}`
            : 'Brak pozostałych podejść: to Twoja ostatnia szansa'}
        </p>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={() => store.prevStep()}>Wstecz</Button>
        <Button onClick={handleNext} disabled={!canContinue}>Dalej</Button>
      </div>
    </Card>
  )
}
