import { useEffect, useState } from 'react'
import { Dices, Loader2 } from 'lucide-react'
import { useCharacterStore } from '@/stores/characterStore'
import { usePlayerStore } from '@/stores/playerStore'
import {
  CHARACTERISTICS,
  CHARACTERISTIC_MAP,
  POINT_BUY_TOTAL,
  POINT_BUY_MIN,
  POINT_BUY_MAX,
} from '@/data/characteristics'
import { playerEditCharacteristics, playerRollCharacteristics } from '@/lib/player'
import type { CharacterData, Characteristics } from '@/types/character'
import type { CharacteristicKey } from '@/types/common'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { NumberInput } from '@/components/ui/NumberInput'

export function StepCharacteristics() {
  const store = useCharacterStore()
  const token = usePlayerStore((s) => s.token)
  const charId = store.serverDraftId
  const serverCharacter = store.serverCharacter
  const setServerCharacter = store.setServerCharacter
  const method = store.method ?? 'direct'
  const isEditReadonly = store.editMode === 'standard'

  const initialChars: Partial<Characteristics> = serverCharacter?.characteristics ?? store.characteristics
  const [chars, setChars] = useState<Partial<Characteristics>>(initialChars)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Re-sync local state when server character refreshes (e.g. after reroll).
  useEffect(() => {
    if (serverCharacter?.characteristics) {
      setChars(serverCharacter.characteristics)
    }
  }, [serverCharacter?.characteristics, serverCharacter?.characteristics_committed_at])

  // Standard edit mode: readonly view, just allow proceeding.
  if (isEditReadonly) {
    return (
      <Card title="Cechy">
        <div className="mb-4 p-3 bg-coc-surface-light border border-coc-border rounded-lg">
          <p className="text-sm text-coc-text-muted">
            W trybie Standard cechy są tylko do odczytu i nie mogą być zmienione.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {CHARACTERISTICS.map((c) => {
            const def = CHARACTERISTIC_MAP[c.key]
            return (
              <div key={c.key} className="space-y-1">
                <div className="text-sm font-medium">
                  {def.abbreviation}
                  <span className="text-coc-text-muted ml-1 text-xs">({def.name})</span>
                </div>
                <div className="text-2xl font-bold font-mono text-center py-2 rounded-lg border border-coc-accent/30 bg-coc-accent/10">
                  {chars[c.key] ?? '—'}
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex justify-end pt-4">
          <Button onClick={() => store.nextStep()}>Dalej</Button>
        </div>
      </Card>
    )
  }

  // Wizard requires a server-side draft (created by StepIdentifier).
  if (!token || !charId) {
    return (
      <Card title="Cechy">
        <p className="text-sm text-coc-danger">
          Brak danych postaci. Wróć do kroku „Identyfikator".
        </p>
      </Card>
    )
  }

  const committedAt = serverCharacter?.characteristics_committed_at ?? null
  const isCommitted = !!committedAt

  const allFilled = CHARACTERISTICS.every((c) => {
    const v = chars[c.key]
    return v !== undefined && v > 0
  })

  const pointBuyTotal = CHARACTERISTICS.reduce((sum, c) => sum + (chars[c.key] ?? 0), 0)
  const pointBuyValid = method !== 'point_buy' || pointBuyTotal === POINT_BUY_TOTAL

  const setStat = (key: CharacteristicKey, value: number) => {
    if (isCommitted) return
    setChars((prev) => ({ ...prev, [key]: value }))
  }

  const apply = (updated: CharacterData) => {
    setServerCharacter(updated)
    if (updated.characteristics) {
      setChars(updated.characteristics)
      store.setCharacteristics(updated.characteristics)
    }
    if (typeof updated.luck === 'number') {
      store.setLuck(updated.luck)
    }
  }

  const handleRollDice = async () => {
    setError(null)
    setSubmitting(true)
    try {
      const updated = await playerRollCharacteristics(token, charId)
      apply(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nie udało się rzucić cech')
    } finally {
      setSubmitting(false)
    }
  }

  const handleManualSubmit = async () => {
    if (!allFilled || !pointBuyValid) return
    setError(null)
    setSubmitting(true)
    try {
      const updated = await playerEditCharacteristics(
        token,
        charId,
        chars as Record<CharacteristicKey, number>,
      )
      apply(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nie udało się zapisać cech')
    } finally {
      setSubmitting(false)
    }
  }

  const canContinue = isCommitted

  return (
    <Card title="Cechy">
      {method === 'dice' && !isCommitted && (
        <div className="mb-4 space-y-2">
          <p className="text-sm text-coc-text-muted">
            Rzuć kośćmi, aby wylosować wartości cech. Rzuty wykonuje serwer, więc wynik jest
            ostateczny — możesz go przerzucić tylko za pomocą tokenu „Przerzut".
            SIŁ, KON, ZRĘ, WYG, MOC: 3K6×5. BUD, INT, WYK: (2K6+6)×5.
          </p>
          <Button onClick={handleRollDice} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Dices className="w-4 h-4" />}
            Rzuć cechy
          </Button>
        </div>
      )}

      {isCommitted && (
        <div className="mb-4">
          <p className="text-sm text-coc-accent-light">
            Cechy zostały zatwierdzone. Aby je zmienić, użyj „Przerzut" w pasku u góry.
          </p>
        </div>
      )}

      {method === 'point_buy' && !isCommitted && (
        <div className="mb-4">
          <p className="text-sm text-coc-text-muted mb-1">
            Rozdziel {POINT_BUY_TOTAL} punktów pomiędzy cechy. Każda cecha:{' '}
            {POINT_BUY_MIN}–{POINT_BUY_MAX}.
          </p>
          <p
            className={`text-sm font-medium ${
              pointBuyTotal === POINT_BUY_TOTAL
                ? 'text-coc-accent-light'
                : pointBuyTotal > POINT_BUY_TOTAL
                  ? 'text-coc-danger'
                  : 'text-coc-warning'
            }`}
          >
            Wykorzystano: {pointBuyTotal} / {POINT_BUY_TOTAL}
          </p>
        </div>
      )}

      {method === 'direct' && !isCommitted && (
        <p className="text-sm text-coc-text-muted mb-4">Wprowadź wartości cech (1–99).</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {CHARACTERISTICS.map((c) => {
          const def = CHARACTERISTIC_MAP[c.key]
          const valuePresent = chars[c.key] !== undefined
          return (
            <div key={c.key} className="space-y-1">
              <div className="text-sm font-medium">
                {def.abbreviation}
                <span className="text-coc-text-muted ml-1 text-xs">({def.name})</span>
              </div>
              {method === 'dice' || isCommitted ? (
                <div
                  className={`text-2xl font-bold font-mono text-center py-2 rounded-lg border ${
                    valuePresent
                      ? 'border-coc-accent/30 bg-coc-accent/10'
                      : 'border-coc-border bg-coc-surface-light'
                  }`}
                >
                  {chars[c.key] ?? '—'}
                </div>
              ) : (
                <NumberInput
                  value={chars[c.key] ?? (method === 'point_buy' ? POINT_BUY_MIN : 0)}
                  onChange={(v) => setStat(c.key, v)}
                  min={method === 'point_buy' ? POINT_BUY_MIN : 1}
                  max={method === 'point_buy' ? POINT_BUY_MAX : 99}
                />
              )}
              <div className="text-xs text-coc-text-muted text-center">
                {c.rollFormula === '3d6x5' ? '3K6×5' : '(2K6+6)×5'}
              </div>
            </div>
          )
        })}
      </div>

      {error && <p className="text-sm text-coc-danger mb-4">{error}</p>}

      <div className="flex justify-end pt-2 gap-2">
        {(method === 'point_buy' || method === 'direct') && !isCommitted && (
          <Button
            onClick={handleManualSubmit}
            disabled={!allFilled || !pointBuyValid || submitting}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Zatwierdź cechy'}
          </Button>
        )}
        <Button onClick={() => store.nextStep()} disabled={!canContinue || submitting}>
          Dalej
        </Button>
      </div>
    </Card>
  )
}
