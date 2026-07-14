import { useState } from 'react'
import { CHARACTERISTICS } from '@/data/characteristics'
import type { RollOptions, RollProfile, RollConstraint } from '@/types/invite'

type CharMode = 'auto' | 'range' | 'fixed'

function modeOf(c: RollConstraint | undefined | null): CharMode {
  if (!c) return 'auto'
  if (c.fixed != null) return 'fixed'
  if (c.min != null || c.max != null) return 'range'
  return 'auto'
}

/** Parse an <input> value into a bounded int or null (empty → null). */
function toNum(raw: string): number | null {
  if (raw.trim() === '') return null
  const n = parseInt(raw, 10)
  if (Number.isNaN(n)) return null
  return Math.max(1, Math.min(99, n))
}

const NUM_CLASS =
  'w-16 px-2 py-1 bg-coc-surface border border-coc-border rounded text-coc-text text-sm ' +
  'focus:outline-none focus:border-coc-accent-light'

function ProfileEditor({
  value,
  onChange,
}: {
  value: RollProfile
  onChange: (next: RollProfile) => void
}) {
  const setChar = (key: string, next: RollConstraint | undefined) => {
    const chars = { ...(value.chars ?? {}) }
    if (next === undefined) delete chars[key]
    else chars[key] = next
    onChange({ ...value, chars })
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 items-center">
        {CHARACTERISTICS.map((c) => {
          const constraint = value.chars?.[c.key]
          const mode = modeOf(constraint)
          return (
            <div key={c.key} className="contents">
              <div className="text-xs font-medium text-coc-text-muted">
                {c.abbreviation}
                <span className="ml-1 opacity-60">({c.name})</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={mode}
                  onChange={(e) => {
                    const m = e.target.value as CharMode
                    if (m === 'auto') setChar(c.key, undefined)
                    else if (m === 'fixed') setChar(c.key, { fixed: constraint?.fixed ?? 50 })
                    else setChar(c.key, { min: constraint?.min ?? null, max: constraint?.max ?? null })
                  }}
                  className="px-2 py-1 bg-coc-surface border border-coc-border rounded text-xs text-coc-text focus:outline-none focus:border-coc-accent-light"
                >
                  <option value="auto">auto</option>
                  <option value="range">zakres</option>
                  <option value="fixed">stała</option>
                </select>
                {mode === 'range' && (
                  <>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      placeholder="min"
                      value={constraint?.min ?? ''}
                      onChange={(e) => setChar(c.key, { ...constraint, min: toNum(e.target.value) })}
                      className={NUM_CLASS}
                    />
                    <span className="text-coc-text-muted text-xs">–</span>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      placeholder="max"
                      value={constraint?.max ?? ''}
                      onChange={(e) => setChar(c.key, { ...constraint, max: toNum(e.target.value) })}
                      className={NUM_CLASS}
                    />
                  </>
                )}
                {mode === 'fixed' && (
                  <input
                    type="number"
                    min={1}
                    max={99}
                    placeholder="wartość"
                    value={constraint?.fixed ?? ''}
                    onChange={(e) => setChar(c.key, { fixed: toNum(e.target.value) })}
                    className={NUM_CLASS}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-coc-border/60">
        <span className="text-xs font-medium text-coc-text-muted">Średnia wszystkich cech:</span>
        <input
          type="number"
          min={1}
          max={99}
          placeholder="min"
          value={value.avgMin ?? ''}
          onChange={(e) => onChange({ ...value, avgMin: toNum(e.target.value) })}
          className={NUM_CLASS}
        />
        <span className="text-coc-text-muted text-xs">–</span>
        <input
          type="number"
          min={1}
          max={99}
          placeholder="max"
          value={value.avgMax ?? ''}
          onChange={(e) => onChange({ ...value, avgMax: toNum(e.target.value) })}
          className={NUM_CLASS}
        />
      </div>
    </div>
  )
}

export function AdvancedRollOptions({
  value,
  onChange,
  rerollBudget,
}: {
  value: RollOptions
  onChange: (next: RollOptions) => void
  rerollBudget: number
}) {
  // Tab 'initial' = first roll; numbers 0..rerollBudget-1 = each reroll.
  const [tab, setTab] = useState<'initial' | number>('initial')
  const rerollCount = Math.max(0, rerollBudget)

  const activeProfile: RollProfile =
    tab === 'initial' ? value.initial ?? {} : value.rerolls?.[tab] ?? {}

  const setActiveProfile = (next: RollProfile) => {
    if (tab === 'initial') {
      onChange({ ...value, initial: next })
      return
    }
    const rerolls = [...(value.rerolls ?? [])]
    while (rerolls.length < rerollCount) rerolls.push(null)
    rerolls[tab] = next
    onChange({ ...value, rerolls })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setTab('initial')}
          className={`px-2.5 py-1 text-xs rounded ${
            tab === 'initial'
              ? 'bg-coc-accent/20 text-coc-accent-light'
              : 'bg-coc-surface text-coc-text-muted hover:text-coc-text'
          }`}
        >
          Pierwszy rzut
        </button>
        {Array.from({ length: rerollCount }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setTab(i)}
            className={`px-2.5 py-1 text-xs rounded ${
              tab === i
                ? 'bg-coc-accent/20 text-coc-accent-light'
                : 'bg-coc-surface text-coc-text-muted hover:text-coc-text'
            }`}
          >
            Przerzut {i + 1}
          </button>
        ))}
      </div>

      <ProfileEditor value={activeProfile} onChange={setActiveProfile} />

      <p className="text-xs text-coc-text-muted">
        „auto" = zwykły rzut. „zakres" losuje w widełkach, „stała" ustawia wartość na sztywno.
        Zakres średniej dogrywa całość rzutu. Puste pola nie nakładają ograniczeń.
        {rerollCount === 0 && ' Ustaw budżet przerzutów, aby dodać zakładki przerzutów.'}
      </p>
    </div>
  )
}
