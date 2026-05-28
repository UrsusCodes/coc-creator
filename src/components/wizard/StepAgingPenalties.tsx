import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Minus, Plus } from 'lucide-react'
import { useCharacterStore } from '@/stores/characterStore'
import { usePlayerStore } from '@/stores/playerStore'
import { playerApplyAgingPenalties, playerGetCharacter } from '@/lib/player'
import { getAgeModifications, validateDeductions } from '@/lib/ageModifiers'
import { CHARACTERISTIC_MAP } from '@/data/characteristics'
import type { AgingDeductions, CharacterData, Characteristics } from '@/types/character'
import type { CharacteristicKey } from '@/types/common'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function StepAgingPenalties() {
  const store = useCharacterStore()
  const token = usePlayerStore((s) => s.token)
  const charId = store.serverDraftId

  const [character, setCharacter] = useState<CharacterData | null>(null)
  const [loadingChar, setLoadingChar] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deductions, setDeductions] = useState<Partial<Record<CharacteristicKey, number>>>({})
  const autoCommittedRef = useRef(false)

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

  const age = character?.age ?? store.age ?? 25
  const mods = useMemo(() => getAgeModifications(age), [age])
  const requiredTotal = mods?.physicalDeductionTotal ?? 0
  const allowedStats = mods?.deductibleStats ?? []
  const chars = (character?.characteristics ?? {}) as Characteristics
  const committed = !!character?.aging_committed_at

  // Auto-commit when no deductions are required (e.g. age 20-39)
  useEffect(() => {
    if (!token || !charId || !character || committed || autoCommittedRef.current) return
    if (requiredTotal !== 0) return
    autoCommittedRef.current = true
    void submit({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character, requiredTotal, committed, token, charId])

  const submit = async (payload: AgingDeductions) => {
    if (!token || !charId) return
    setError(null)
    setSubmitting(true)
    try {
      const updated = await playerApplyAgingPenalties(token, charId, payload)
      setCharacter(updated)
      store.setServerCharacter(updated)
      if (updated.characteristics) {
        store.setCharacteristics(updated.characteristics)
      }
      store.nextStep()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nie udało się zastosować obniżeń wiekowych')
    } finally {
      setSubmitting(false)
    }
  }

  if (!token || !charId) {
    return (
      <Card title="Obniżenia wiekowe">
        <p className="text-sm text-coc-danger">Brak danych postaci. Wróć do poprzedniego kroku.</p>
        <div className="flex justify-start pt-4">
          <Button variant="secondary" onClick={() => store.prevStep()}>Wstecz</Button>
        </div>
      </Card>
    )
  }

  if (loadingChar || (!character && !error)) {
    return (
      <Card title="Obniżenia wiekowe">
        <div className="flex items-center gap-2 text-coc-text-muted">
          <Loader2 className="w-4 h-4 animate-spin" />
          Wczytywanie postaci…
        </div>
      </Card>
    )
  }

  if (!character || !mods) {
    return (
      <Card title="Obniżenia wiekowe">
        <p className="text-sm text-coc-danger">{error ?? 'Nieprawidłowy wiek lub brak postaci.'}</p>
        <div className="flex justify-start pt-4">
          <Button variant="secondary" onClick={() => store.prevStep()}>Wstecz</Button>
        </div>
      </Card>
    )
  }

  // Back-step into an already-committed aging step: server rejects re-commit
  // with 409, so render a read-only summary and let the player advance.
  // Edits require Przerzut (full hard-zone wipe).
  if (committed) {
    const displayedStats = allowedStats.length > 0
      ? allowedStats
      : (Object.keys(chars) as CharacteristicKey[])
    return (
      <Card title="Obniżenia wiekowe">
        <p className="text-sm text-coc-accent-light mb-4">
          Obniżenia wiekowe zostały już zatwierdzone. Aby je zmienić, użyj
          „Przerzut" w pasku u góry.
        </p>
        {displayedStats.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
            {displayedStats.map((key) => (
              <div
                key={key}
                className="text-center py-2 rounded-lg border border-coc-border bg-coc-surface-light"
              >
                <div className="text-xs text-coc-text-muted">
                  {CHARACTERISTIC_MAP[key]?.abbreviation ?? key}
                </div>
                <div className="text-lg font-bold font-mono">{chars[key] ?? '—'}</div>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-between pt-2">
          <Button variant="secondary" onClick={() => store.prevStep()}>Wstecz</Button>
          <Button onClick={() => store.nextStep()}>Dalej</Button>
        </div>
      </Card>
    )
  }

  if (requiredTotal === 0) {
    return (
      <Card title="Obniżenia wiekowe">
        <p className="text-sm text-coc-text-muted mb-4">
          Twój wiek nie wymaga rozdzielenia obniżeń cech.
        </p>
        {error && <p className="text-sm text-coc-danger mb-4">{error}</p>}
        <div className="flex justify-between pt-2">
          <Button variant="secondary" onClick={() => store.prevStep()} disabled={submitting}>
            Wstecz
          </Button>
          <Button onClick={() => (committed ? store.nextStep() : submit({}))} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Dalej'}
          </Button>
        </div>
      </Card>
    )
  }

  const setDeduction = (key: CharacteristicKey, value: number) => {
    setDeductions((prev) => ({ ...prev, [key]: Math.max(0, value) }))
  }

  const totalDeducted = Object.values(deductions).reduce((sum, v) => sum + (v ?? 0), 0)
  const remaining = requiredTotal - totalDeducted
  const validation = validateDeductions(chars, deductions, allowedStats, requiredTotal)
  const canSubmit = validation.valid && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    // Filter empty entries to keep payload tight.
    const payload: AgingDeductions = {}
    for (const [k, v] of Object.entries(deductions)) {
      if (v && v > 0) payload[k as keyof AgingDeductions] = v
    }
    await submit(payload)
  }

  return (
    <Card title="Obniżenia wiekowe">
      <p className="text-sm text-coc-text-muted mb-4">
        Twój wiek wymaga obniżenia łącznie{' '}
        <span className="text-coc-text font-medium">{requiredTotal}</span>{' '}
        {requiredTotal === 1 ? 'punktu' : 'punktów'} z cech:{' '}
        <span className="text-coc-text font-medium">
          {allowedStats.map((s) => CHARACTERISTIC_MAP[s].abbreviation).join(', ')}
        </span>
        .
      </p>

      <div className="grid grid-cols-3 gap-4 mb-4">
        {allowedStats.map((key) => {
          const base = chars[key] ?? 0
          const ded = deductions[key] ?? 0
          const result = base - ded
          const canDeductMore = ded < Math.min(requiredTotal, base - 1) && remaining > 0
          const canRestore = ded > 0
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
                  disabled={!canDeductMore || submitting}
                  className="p-1.5 rounded bg-coc-surface-light border border-coc-border hover:bg-coc-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Odejmij punkt"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span
                  className={`w-12 text-center py-1.5 text-sm font-mono font-bold rounded border ${
                    ded > 0
                      ? 'text-coc-warning border-coc-warning/30 bg-coc-warning/10'
                      : 'text-coc-text border-coc-border bg-coc-surface-light'
                  }`}
                >
                  {result}
                </span>
                <button
                  type="button"
                  onClick={() => setDeduction(key, ded - 1)}
                  disabled={!canRestore || submitting}
                  className="p-1.5 rounded bg-coc-surface-light border border-coc-border hover:bg-coc-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Przywróć punkt"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {ded > 0 && <div className="text-xs text-coc-warning">−{ded}</div>}
            </div>
          )
        })}
      </div>

      <p
        className={`text-sm mb-2 ${
          totalDeducted === requiredTotal ? 'text-coc-accent-light' : 'text-coc-warning'
        }`}
      >
        Rozdzielono: {totalDeducted} / {requiredTotal}
      </p>
      {!validation.valid && validation.error && (
        <p className="text-sm text-coc-danger">{validation.error}</p>
      )}

      {/* Auto-applied bonuses (server side) */}
      {(mods.appReduction > 0 || mods.moveReduction > 0) && (
        <div className="border-t border-coc-border pt-4 mt-4 mb-4 space-y-1">
          {mods.appReduction > 0 && (
            <p className="text-sm text-coc-text-muted">
              Wygląd zostanie obniżony o {mods.appReduction} (automatycznie po stronie serwera).
            </p>
          )}
          {mods.moveReduction > 0 && (
            <p className="text-sm text-coc-text-muted">
              Ruch zostanie obniżony o {mods.moveReduction}.
            </p>
          )}
        </div>
      )}

      {error && <p className="text-sm text-coc-danger mb-4">{error}</p>}

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={() => store.prevStep()} disabled={submitting}>
          Wstecz
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Zatwierdź'}
        </Button>
      </div>
    </Card>
  )
}
