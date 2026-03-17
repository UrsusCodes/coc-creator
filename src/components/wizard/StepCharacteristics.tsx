import { useState, useCallback } from 'react'
import { Dices, Trash2, Loader2, ArrowLeftRight } from 'lucide-react'
import { useCharacterStore } from '@/stores/characterStore'
import { CHARACTERISTICS, CHARACTERISTIC_MAP, POINT_BUY_TOTAL, POINT_BUY_MIN, POINT_BUY_MAX } from '@/data/characteristics'
import { rollCharacteristic } from '@/lib/dice'
import { supabase } from '@/lib/supabase'
import type { Characteristics } from '@/types/character'
import type { CharacteristicKey } from '@/types/common'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { NumberInput } from '@/components/ui/NumberInput'

export function StepCharacteristics() {
  const store = useCharacterStore()
  const method = store.method!
  const isLocked = store.characteristicsLocked
  const hasSwapPerk = store.perks.includes('swap_characteristics')

  const [chars, setChars] = useState<Partial<Characteristics>>(store.characteristics)
  const [rolled, setRolled] = useState(Object.keys(store.characteristics).length > 0)
  const [abandoning, setAbandoning] = useState(false)

  // Swap state
  const [swapFrom, setSwapFrom] = useState<CharacteristicKey | ''>(store.characteristicSwap?.from ?? '')
  const [swapTo, setSwapTo] = useState<CharacteristicKey | ''>(store.characteristicSwap?.to ?? '')
  const [swapDone, setSwapDone] = useState(store.characteristicSwap !== null)

  const remainingTries = store.maxTries - store.timesUsed - 1
  const canAbandon = remainingTries > 0

  const setStat = useCallback((key: CharacteristicKey, value: number) => {
    if (isLocked) return
    setChars((prev) => ({ ...prev, [key]: value }))
  }, [isLocked])

  const rollAll = useCallback(() => {
    if (isLocked) return
    const newChars: Partial<Characteristics> = {}
    for (const c of CHARACTERISTICS) {
      newChars[c.key] = rollCharacteristic(c.rollFormula)
    }
    setChars(newChars)
    store.setCharacteristics(newChars)
    setRolled(true)
  }, [isLocked, store])

  const handleSwap = () => {
    if (!swapFrom || !swapTo || swapFrom === swapTo || swapDone) return
    const valA = chars[swapFrom]
    const valB = chars[swapTo]
    if (valA === undefined || valB === undefined) return
    const swapped = { ...chars, [swapFrom]: valB, [swapTo]: valA }
    setChars(swapped)
    store.setCharacteristics(swapped)
    useCharacterStore.setState({ characteristicSwap: { from: swapFrom as CharacteristicKey, to: swapTo as CharacteristicKey } })
    setSwapDone(true)
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

  const allFilled = CHARACTERISTICS.every((c) => {
    const v = chars[c.key]
    return v !== undefined && v > 0
  })

  const pointBuyTotal = CHARACTERISTICS.reduce((sum, c) => sum + (chars[c.key] ?? 0), 0)
  const pointBuyValid = method !== 'point_buy' || pointBuyTotal === POINT_BUY_TOTAL

  const canContinue = allFilled && pointBuyValid

  const handleNext = () => {
    store.setCharacteristics(chars)
    store.lockCharacteristics()
    store.nextStep()
  }

  return (
    <Card title="Cechy">
      {method === 'dice' && !isLocked && (
        <div className="mb-4 space-y-2">
          <p className="text-sm text-coc-text-muted">
            Rzuć kośćmi, aby wylosować wartości cech. SIŁ, KON, ZRĘ, WYG, MOC: 3K6×5. BUD, INT, WYK: (2K6+6)×5.
          </p>
          {!rolled && (
            <Button onClick={rollAll}>
              <Dices className="w-4 h-4" />
              Rzuć wszystkie
            </Button>
          )}
        </div>
      )}

      {method === 'dice' && isLocked && (
        <div className="mb-4">
          <p className="text-sm text-coc-accent-light">
            Cechy zostały zatwierdzone i nie mogą być zmienione.
          </p>
        </div>
      )}

      {method === 'point_buy' && !isLocked && (
        <div className="mb-4">
          <p className="text-sm text-coc-text-muted mb-1">
            Rozdziel {POINT_BUY_TOTAL} punktów pomiędzy cechy. Każda cecha: {POINT_BUY_MIN}–{POINT_BUY_MAX}.
          </p>
          <p className={`text-sm font-medium ${pointBuyTotal === POINT_BUY_TOTAL ? 'text-coc-accent-light' : pointBuyTotal > POINT_BUY_TOTAL ? 'text-coc-danger' : 'text-coc-warning'}`}>
            Wykorzystano: {pointBuyTotal} / {POINT_BUY_TOTAL}
          </p>
        </div>
      )}

      {method === 'direct' && !isLocked && (
        <p className="text-sm text-coc-text-muted mb-4">
          Wprowadź wartości cech (1–99).
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {CHARACTERISTICS.map((c) => {
          const def = CHARACTERISTIC_MAP[c.key]
          return (
            <div key={c.key} className="space-y-1">
              <div className="text-sm font-medium">
                {def.abbreviation}
                <span className="text-coc-text-muted ml-1 text-xs">({def.name})</span>
              </div>
              {method === 'dice' || isLocked ? (
                <div className={`text-2xl font-bold font-mono text-center py-2 rounded-lg border ${
                  chars[c.key] ? 'border-coc-accent/30 bg-coc-accent/10' : 'border-coc-border bg-coc-surface-light'
                }`}>
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

      {/* Swap characteristics perk */}
      {hasSwapPerk && allFilled && (
        <div className="border-t border-coc-border pt-4 mb-4">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-coc-accent-light" />
            Zamiana cech
          </h4>
          {swapDone ? (
            <p className="text-sm text-coc-accent-light">
              Zamieniono: {CHARACTERISTIC_MAP[swapFrom as CharacteristicKey]?.abbreviation} ↔ {CHARACTERISTIC_MAP[swapTo as CharacteristicKey]?.abbreviation}
            </p>
          ) : (
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs text-coc-text-muted mb-1">Cecha A</label>
                <select
                  value={swapFrom}
                  onChange={(e) => setSwapFrom(e.target.value as CharacteristicKey)}
                  className="px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-coc-text text-sm focus:outline-none focus:border-coc-accent-light"
                >
                  <option value="">Wybierz...</option>
                  {CHARACTERISTICS.map((c) => (
                    <option key={c.key} value={c.key}>
                      {CHARACTERISTIC_MAP[c.key].abbreviation} ({chars[c.key]})
                    </option>
                  ))}
                </select>
              </div>
              <ArrowLeftRight className="w-4 h-4 text-coc-text-muted mb-2" />
              <div>
                <label className="block text-xs text-coc-text-muted mb-1">Cecha B</label>
                <select
                  value={swapTo}
                  onChange={(e) => setSwapTo(e.target.value as CharacteristicKey)}
                  className="px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-coc-text text-sm focus:outline-none focus:border-coc-accent-light"
                >
                  <option value="">Wybierz...</option>
                  {CHARACTERISTICS.filter((c) => c.key !== swapFrom).map((c) => (
                    <option key={c.key} value={c.key}>
                      {CHARACTERISTIC_MAP[c.key].abbreviation} ({chars[c.key]})
                    </option>
                  ))}
                </select>
              </div>
              <Button
                size="sm"
                onClick={handleSwap}
                disabled={!swapFrom || !swapTo || swapFrom === swapTo}
              >
                Zamień
              </Button>
            </div>
          )}
          <p className="text-xs text-coc-text-muted mt-1">
            Możesz zamienić jedną parę cech miejscami (jednorazowo).
          </p>
        </div>
      )}

      {/* Abandon character button */}
      {rolled && (
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
      )}

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={() => store.prevStep()}>Wstecz</Button>
        <Button onClick={handleNext} disabled={!canContinue}>Dalej</Button>
      </div>
    </Card>
  )
}
