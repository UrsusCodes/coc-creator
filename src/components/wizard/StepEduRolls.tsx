import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useCharacterStore } from '@/stores/characterStore'
import { usePlayerStore } from '@/stores/playerStore'
import { playerGetCharacter, playerRollEdu } from '@/lib/player'
import { getAgeModifications } from '@/lib/ageModifiers'
import type { CharacterData, Characteristics, EduRoll } from '@/types/character'
// Note: edu_rolls & EDU now live on serverCharacter (single source of truth).
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function StepEduRolls() {
  const store = useCharacterStore()
  const token = usePlayerStore((s) => s.token)
  const charId = store.serverDraftId

  const [character, setCharacter] = useState<CharacterData | null>(null)
  const [loadingChar, setLoadingChar] = useState(true)
  const [rolling, setRolling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const triedRollRef = useRef(false)

  // Initial load
  useEffect(() => {
    if (!token || !charId) {
      setLoadingChar(false)
      return
    }
    let cancelled = false
    playerGetCharacter(token, charId)
      .then((c) => {
        if (!cancelled) setCharacter(c as CharacterData)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Nie udało się pobrać postaci')
      })
      .finally(() => {
        if (!cancelled) setLoadingChar(false)
      })
    return () => {
      cancelled = true
    }
  }, [token, charId])

  // Auto-roll on first mount when not yet committed
  useEffect(() => {
    if (!token || !charId || !character) return
    if (character.edu_committed_at) return
    if (triedRollRef.current) return
    triedRollRef.current = true
    void rollEdu()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character, token, charId])

  // Auto-advance when there's nothing to roll (age 40+) and the commit
  // already landed. Guarantees aging/luck gates further down the hard zone
  // can read edu_committed_at without forcing the user to click "Dalej" on
  // a step that has no actionable UI.
  const autoAdvancedRef = useRef(false)
  useEffect(() => {
    if (!character || autoAdvancedRef.current) return
    if (!character.edu_committed_at) return
    const age = character.age ?? store.age ?? 25
    const mods = getAgeModifications(age)
    if ((mods?.eduImprovementChecks ?? 0) > 0) return
    autoAdvancedRef.current = true
    store.nextStep()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character])

  const rollEdu = async () => {
    if (!token || !charId) return
    setError(null)
    setRolling(true)
    try {
      const updated = await playerRollEdu(token, charId)
      setCharacter(updated)
      store.setServerCharacter(updated)
      // Mirror updated EDU into the existing flat store field used by
      // legacy consumers (StepDerived calculation, useDraftSync payload).
      if (updated.characteristics) {
        store.setCharacteristics(updated.characteristics)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nie udało się wykonać rzutów EDU')
    } finally {
      setRolling(false)
    }
  }

  if (!token || !charId) {
    return (
      <Card title="Rzuty na poprawę WYK">
        <p className="text-sm text-coc-danger">Brak danych postaci. Wróć do poprzedniego kroku.</p>
        <div className="flex justify-start pt-4">
          <Button variant="secondary" onClick={() => store.prevStep()}>Wstecz</Button>
        </div>
      </Card>
    )
  }

  if (loadingChar || (!character && !error)) {
    return (
      <Card title="Rzuty na poprawę WYK">
        <div className="flex items-center gap-2 text-coc-text-muted">
          <Loader2 className="w-4 h-4 animate-spin" />
          Wczytywanie postaci…
        </div>
      </Card>
    )
  }

  if (!character) {
    return (
      <Card title="Rzuty na poprawę WYK">
        <p className="text-sm text-coc-danger">{error ?? 'Nie udało się wczytać postaci.'}</p>
        <div className="flex justify-start pt-4">
          <Button variant="secondary" onClick={() => store.prevStep()}>Wstecz</Button>
        </div>
      </Card>
    )
  }

  const age = character.age ?? store.age ?? 25
  const mods = getAgeModifications(age)
  const requiredRolls = mods?.eduImprovementChecks ?? 0
  const eduRolls = (character.edu_rolls ?? []) as EduRoll[]
  const chars = (character.characteristics ?? {}) as Characteristics
  const currentEdu = chars.EDU ?? 0
  const totalGained = eduRolls.reduce((sum, r) => sum + (r.improved ? r.gained : 0), 0)
  const committed = !!character.edu_committed_at

  return (
    <Card title="Rzuty na poprawę WYK">
      <p className="text-sm text-coc-text-muted mb-4">
        {requiredRolls > 0 ? (
          <>
            Twój wiek pozwala na <span className="text-coc-text font-medium">{requiredRolls}</span>{' '}
            {requiredRolls === 1 ? 'rzut' : requiredRolls < 5 ? 'rzuty' : 'rzutów'} na poprawę
            Wykształcenia. Rzuty są wykonywane przez serwer.
          </>
        ) : (
          'Twój wiek nie pozwala na rzuty na poprawę Wykształcenia.'
        )}
      </p>

      {rolling && (
        <div className="flex items-center gap-2 text-coc-text-muted mb-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Wykonywanie rzutów…
        </div>
      )}

      {!rolling && eduRolls.length > 0 && (
        <div className="bg-coc-surface-light border border-coc-border rounded-lg p-4 mb-4 space-y-1">
          {eduRolls.map((r, i) => (
            <div
              key={i}
              className={`text-sm ${r.improved ? 'text-coc-accent-light' : 'text-coc-text-muted'}`}
            >
              Rzut {i + 1}: <span className="font-mono">{r.roll}</span>{' '}
              {r.improved
                ? `— Sukces! +${r.gained} (WYK: ${r.new_edu})`
                : '— Bez zmian'}
            </div>
          ))}
        </div>
      )}

      {!rolling && committed && (
        <div className="border-t border-coc-border pt-4 mb-4">
          <div className="text-sm text-coc-text-muted">Aktualne WYK:</div>
          <div className="text-3xl font-bold font-mono text-coc-accent-light">
            {currentEdu}
            {totalGained > 0 && (
              <span className="text-sm text-coc-accent-light/70 font-normal ml-2">
                (+{totalGained})
              </span>
            )}
          </div>
        </div>
      )}

      {!rolling && requiredRolls === 0 && committed && (
        <p className="text-sm text-coc-accent-light mb-4">
          Brak rzutów do wykonania. Możesz przejść dalej.
        </p>
      )}

      {error && <p className="text-sm text-coc-danger mb-4">{error}</p>}

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={() => store.prevStep()} disabled={rolling}>
          Wstecz
        </Button>
        <Button onClick={() => store.nextStep()} disabled={!committed || rolling}>
          Dalej
        </Button>
      </div>
    </Card>
  )
}
