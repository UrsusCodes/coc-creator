import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useCharacterStore } from '@/stores/characterStore'
import { usePlayerStore } from '@/stores/playerStore'
import { isYoungCharacter, getAgeRange } from '@/data/ageRanges'
import { CHARACTERISTIC_MAP } from '@/data/characteristics'
import { getAgeModifications } from '@/lib/ageModifiers'
import { playerSetAge } from '@/lib/player'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { NumberInput } from '@/components/ui/NumberInput'
import { Badge } from '@/components/ui/Badge'

export function StepAge() {
  const store = useCharacterStore()
  const token = usePlayerStore((s) => s.token)
  const charId = store.serverDraftId
  const serverCharacter = store.serverCharacter
  const setServerCharacter = store.setServerCharacter
  const isEditReadonly = store.editMode === 'standard'

  const committedAge = serverCharacter?.age ?? null
  const isCommitted = !!serverCharacter?.age_committed_at

  const [age, setAge] = useState<number>(committedAge ?? store.age ?? 25)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (committedAge != null) setAge(committedAge)
  }, [committedAge])

  const young = isYoungCharacter(age)
  const mods = useMemo(() => getAgeModifications(age), [age])
  const ageRange = useMemo(() => getAgeRange(age), [age])

  // Standard edit mode: show readonly
  if (isEditReadonly) {
    return (
      <Card title="Wiek">
        <div className="mb-4 p-3 bg-coc-surface-light border border-coc-border rounded-lg">
          <p className="text-sm text-coc-text-muted">
            W trybie Standard wiek jest tylko do odczytu i nie może być zmieniony.
          </p>
        </div>
        <div className="flex gap-8 mb-6">
          <div>
            <div className="text-sm text-coc-text-muted mb-1">Wiek</div>
            <div className="text-3xl font-bold font-mono">{age}</div>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={() => store.nextStep()}>Dalej</Button>
        </div>
      </Card>
    )
  }

  if (!token || !charId) {
    return (
      <Card title="Wiek">
        <p className="text-sm text-coc-danger">
          Brak danych postaci. Wróć do kroku „Identyfikator".
        </p>
      </Card>
    )
  }

  const handleSubmit = async () => {
    if (age < 15 || age > 89) return
    setError(null)
    setSubmitting(true)
    try {
      const updated = await playerSetAge(token, charId, age)
      setServerCharacter(updated)
      store.setAge(age)
      store.nextStep()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nie udało się ustawić wieku')
    } finally {
      setSubmitting(false)
    }
  }

  const canContinue = age >= 15 && age <= 89

  return (
    <Card title="Wiek">
      {isCommitted && (
        <div className="mb-4">
          <p className="text-sm text-coc-accent-light">
            Wiek został zatwierdzony. Aby go zmienić, użyj „Przerzut" w pasku u góry.
          </p>
        </div>
      )}

      {/* Age input */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Wiek badacza (15–89)</label>
        {!isCommitted && (
          <p className="text-xs text-coc-text-muted mb-2">
            Wiek wpływa na rzuty na poprawę WYK, obniżenia wiekowe i sposób wyznaczania szczęścia.
          </p>
        )}
        <NumberInput value={age} onChange={setAge} min={15} max={89} disabled={isCommitted} />
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
                Rzuty na poprawę WYK:{' '}
                <span className="text-coc-accent-light font-medium">
                  {mods.eduImprovementChecks}
                </span>
              </li>
            )}
            {mods.physicalDeductionTotal > 0 && (
              <li>
                Odliczenia fizyczne:{' '}
                <span className="text-coc-warning font-medium">−{mods.physicalDeductionTotal} pkt</span>
                {' '}z {mods.deductibleStats.map((s) => CHARACTERISTIC_MAP[s].abbreviation).join(', ')}
              </li>
            )}
            {mods.appReduction > 0 && (
              <li>
                Wygląd:{' '}
                <span className="text-coc-warning font-medium">−{mods.appReduction} WYG</span>
              </li>
            )}
            {mods.moveReduction > 0 && (
              <li>
                Ruch: <span className="text-coc-warning font-medium">−{mods.moveReduction}</span>
              </li>
            )}
            {young && (
              <>
                <li>
                  Wykształcenie: <span className="text-coc-warning font-medium">−5 WYK</span>
                </li>
                <li>
                  Szczęście:{' '}
                  <span className="text-coc-accent-light font-medium">2 rzuty, lepszy wynik</span>
                </li>
              </>
            )}
            {!young && mods.physicalDeductionTotal === 0 && mods.eduImprovementChecks <= 1 && (
              <li className="text-coc-accent-light">Brak istotnych kar wiekowych.</li>
            )}
          </ul>
        </div>
      )}

      {error && <p className="text-sm text-coc-danger mb-4">{error}</p>}

      <div className="flex justify-end pt-2">
        {isCommitted ? (
          <Button onClick={() => store.nextStep()} disabled={submitting}>
            Dalej
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!canContinue || submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Zatwierdź wiek'}
          </Button>
        )}
      </div>
    </Card>
  )
}
