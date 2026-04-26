import { useEffect, useState } from 'react'
import { ArrowLeftRight, Loader2 } from 'lucide-react'
import { useCharacterStore } from '@/stores/characterStore'
import { usePlayerStore } from '@/stores/playerStore'
import {
  playerGetCharacter,
  playerSwapCharacteristics,
  playerSkipSwap,
} from '@/lib/player'
import { CHARACTERISTICS, CHARACTERISTIC_MAP } from '@/data/characteristics'
import type { CharacterData, Characteristics } from '@/types/character'
import type { CharacteristicKey } from '@/types/common'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function StepSwap() {
  const store = useCharacterStore()
  const token = usePlayerStore((s) => s.token)
  const charId = store.serverDraftId

  const [character, setCharacter] = useState<CharacterData | null>(null)
  const [loadingChar, setLoadingChar] = useState(true)
  const [from, setFrom] = useState<CharacteristicKey | ''>('')
  const [to, setTo] = useState<CharacteristicKey | ''>('')
  const [submitting, setSubmitting] = useState(false)
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
      <Card title="Zamiana cech">
        <p className="text-sm text-coc-danger">Brak danych postaci. Wróć do poprzedniego kroku.</p>
        <div className="flex justify-start pt-4">
          <Button variant="secondary" onClick={() => store.prevStep()}>Wstecz</Button>
        </div>
      </Card>
    )
  }

  if (loadingChar) {
    return (
      <Card title="Zamiana cech">
        <div className="flex items-center gap-2 text-coc-text-muted">
          <Loader2 className="w-4 h-4 animate-spin" />
          Wczytywanie postaci…
        </div>
      </Card>
    )
  }

  if (!character) {
    return (
      <Card title="Zamiana cech">
        <p className="text-sm text-coc-danger">{error ?? 'Nie udało się wczytać postaci.'}</p>
        <div className="flex justify-start pt-4">
          <Button variant="secondary" onClick={() => store.prevStep()}>Wstecz</Button>
        </div>
      </Card>
    )
  }

  // Defensive — WizardShell will normally skip this step when not applicable.
  if (!character.swap_available) {
    return (
      <Card title="Zamiana cech">
        <p className="text-sm text-coc-text-muted">
          Twój kod nie ma perka zamiany cech.
        </p>
        <div className="flex justify-end pt-4">
          <Button onClick={() => store.nextStep()}>Dalej</Button>
        </div>
      </Card>
    )
  }

  if (character.swap_used) {
    return (
      <Card title="Zamiana cech">
        <p className="text-sm text-coc-accent-light">
          Decyzja o zamianie cech została już zapisana.
        </p>
        <div className="flex justify-end pt-4">
          <Button onClick={() => store.nextStep()}>Dalej</Button>
        </div>
      </Card>
    )
  }

  const chars = (character.characteristics ?? {}) as Characteristics

  const handleSwap = async () => {
    if (!from || !to || from === to) return
    setError(null)
    setSubmitting(true)
    try {
      const updated = await playerSwapCharacteristics(token, charId, { from, to })
      setCharacter(updated)
      store.setCharacteristics(updated.characteristics ?? {})
      store.nextStep()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nie udało się zamienić cech')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSkip = async () => {
    setError(null)
    setSubmitting(true)
    try {
      const updated = await playerSkipSwap(token, charId)
      setCharacter(updated)
      store.nextStep()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nie udało się pominąć zamiany')
    } finally {
      setSubmitting(false)
    }
  }

  const canSwap = from !== '' && to !== '' && from !== to && !submitting

  return (
    <Card title="Zamiana cech">
      <p className="text-sm text-coc-text-muted mb-4">
        Twój kod ma perk zamiany cech — możesz wymienić wartości dwóch dowolnych cech
        (jednorazowo). Zatwierdź zamianę lub pomiń ten krok.
      </p>

      {/* Current characteristics preview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {CHARACTERISTICS.map((c) => {
          const def = CHARACTERISTIC_MAP[c.key]
          const v = chars[c.key]
          const highlighted = c.key === from || c.key === to
          return (
            <div
              key={c.key}
              className={`text-center py-2 rounded-lg border ${
                highlighted
                  ? 'border-coc-accent bg-coc-accent/15'
                  : 'border-coc-border bg-coc-surface-light'
              }`}
            >
              <div className="text-xs text-coc-text-muted">{def.abbreviation}</div>
              <div className="text-xl font-bold font-mono">{v ?? '—'}</div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="block text-xs text-coc-text-muted mb-1">Cecha A</label>
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value as CharacteristicKey | '')}
            disabled={submitting}
            className="px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-coc-text text-sm focus:outline-none focus:border-coc-accent-light"
          >
            <option value="">Wybierz…</option>
            {CHARACTERISTICS.map((c) => (
              <option key={c.key} value={c.key}>
                {CHARACTERISTIC_MAP[c.key].abbreviation} ({chars[c.key] ?? '—'})
              </option>
            ))}
          </select>
        </div>
        <ArrowLeftRight className="w-4 h-4 text-coc-text-muted mb-2" />
        <div>
          <label className="block text-xs text-coc-text-muted mb-1">Cecha B</label>
          <select
            value={to}
            onChange={(e) => setTo(e.target.value as CharacteristicKey | '')}
            disabled={submitting}
            className="px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-coc-text text-sm focus:outline-none focus:border-coc-accent-light"
          >
            <option value="">Wybierz…</option>
            {CHARACTERISTICS.filter((c) => c.key !== from).map((c) => (
              <option key={c.key} value={c.key}>
                {CHARACTERISTIC_MAP[c.key].abbreviation} ({chars[c.key] ?? '—'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-coc-danger mb-4">{error}</p>}

      <div className="flex flex-wrap justify-between gap-2 pt-2">
        <Button variant="secondary" onClick={() => store.prevStep()} disabled={submitting}>
          Wstecz
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleSkip} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Pomiń zamianę'}
          </Button>
          <Button onClick={handleSwap} disabled={!canSwap}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Zamień'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
