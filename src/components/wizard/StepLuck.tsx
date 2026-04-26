import { useEffect, useState } from 'react'
import { Dices, Loader2 } from 'lucide-react'
import { useCharacterStore } from '@/stores/characterStore'
import { usePlayerStore } from '@/stores/playerStore'
import { playerGetCharacter, playerRollLuck } from '@/lib/player'
import { isYoungCharacter } from '@/data/ageRanges'
import type { CharacterData } from '@/types/character'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function StepLuck() {
  const store = useCharacterStore()
  const token = usePlayerStore((s) => s.token)
  const charId = store.serverDraftId

  const [character, setCharacter] = useState<CharacterData | null>(null)
  const [loadingChar, setLoadingChar] = useState(true)
  const [rolling, setRolling] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  if (!token || !charId) {
    return (
      <Card title="Szczęście">
        <p className="text-sm text-coc-danger">Brak danych postaci. Wróć do poprzedniego kroku.</p>
        <div className="flex justify-start pt-4">
          <Button variant="secondary" onClick={() => store.prevStep()}>Wstecz</Button>
        </div>
      </Card>
    )
  }

  if (loadingChar || (!character && !error)) {
    return (
      <Card title="Szczęście">
        <div className="flex items-center gap-2 text-coc-text-muted">
          <Loader2 className="w-4 h-4 animate-spin" />
          Wczytywanie postaci…
        </div>
      </Card>
    )
  }

  if (!character) {
    return (
      <Card title="Szczęście">
        <p className="text-sm text-coc-danger">{error ?? 'Nie udało się wczytać postaci.'}</p>
        <div className="flex justify-start pt-4">
          <Button variant="secondary" onClick={() => store.prevStep()}>Wstecz</Button>
        </div>
      </Card>
    )
  }

  const age = character.age ?? store.age ?? 25
  const young = isYoungCharacter(age)
  const luck = character.luck ?? null
  const committed = !!character.luck_committed_at

  const handleRoll = async () => {
    if (!token || !charId) return
    setError(null)
    setRolling(true)
    try {
      const updated = await playerRollLuck(token, charId)
      setCharacter(updated)
      if (typeof updated.luck === 'number') store.setLuck(updated.luck)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nie udało się rzucić szczęścia')
    } finally {
      setRolling(false)
    }
  }

  return (
    <Card title="Szczęście">
      <p className="text-sm text-coc-text-muted mb-4">
        Ostatni rzut części mechanicznej: <span className="text-coc-text font-medium">3K6×5</span>
        {young && ' (młody Badacz: dwa rzuty, lepszy wynik)'}.
      </p>

      <div className="flex items-center gap-4 mb-6">
        <div
          className={`text-4xl font-bold font-mono px-6 py-3 rounded-lg border ${
            luck !== null
              ? 'border-coc-accent/30 bg-coc-accent/10 text-coc-accent-light'
              : 'border-coc-border bg-coc-surface-light text-coc-text-muted'
          }`}
        >
          {luck ?? '—'}
        </div>
        {!committed && (
          <Button onClick={handleRoll} disabled={rolling}>
            {rolling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Dices className="w-4 h-4" />
                Rzuć szczęście
              </>
            )}
          </Button>
        )}
      </div>

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
