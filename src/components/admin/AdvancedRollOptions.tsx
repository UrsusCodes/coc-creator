import { useState } from 'react'
import { CHARACTERISTICS } from '@/data/characteristics'
import type { RollOptions, RollProfile, RollConstraint } from '@/types/invite'

type CharMode = 'auto' | 'range' | 'fixed'

// A present constraint object without `fixed` is a range (even with empty
// min/max) — that is what keeps the range inputs visible while the admin types.
function modeOf(c: RollConstraint | undefined | null): CharMode {
  if (c == null) return 'auto'
  if (c.fixed != null) return 'fixed'
  return 'range'
}

/** Parse an <input> value into a bounded int or null (empty → null). */
function toNum(raw: string): number | null {
  if (raw.trim() === '') return null
  const n = parseInt(raw, 10)
  if (Number.isNaN(n)) return null
  return Math.max(1, Math.min(99, n))
}

/** Like toNum but snapped to the ×5 dice grid and the real 15–90 roll range. */
function toNum5(raw: string): number | null {
  const n = toNum(raw)
  if (n == null) return null
  return Math.max(15, Math.min(90, Math.round(n / 5) * 5))
}

const NUM_CLASS =
  'w-16 px-2 py-1 bg-coc-surface border border-coc-border rounded text-coc-text text-sm ' +
  'focus:outline-none focus:border-coc-accent-light'
const SELECT_CLASS =
  'px-2 py-1 bg-coc-surface border border-coc-border rounded text-xs text-coc-text ' +
  'focus:outline-none focus:border-coc-accent-light'

/** auto / zakres / stała control for a single constraint (chars + luck). */
function ConstraintControls({
  value,
  onChange,
}: {
  value?: RollConstraint | null
  onChange: (next: RollConstraint | undefined) => void
}) {
  const mode = modeOf(value)
  return (
    <div className="flex items-center gap-2">
      <select
        value={mode}
        onChange={(e) => {
          const m = e.target.value as CharMode
          if (m === 'auto') onChange(undefined)
          else if (m === 'fixed') onChange({ fixed: value?.fixed ?? 60 })
          else onChange({ min: value?.min ?? null, max: value?.max ?? null })
        }}
        className={SELECT_CLASS}
      >
        <option value="auto">auto</option>
        <option value="range">zakres</option>
        <option value="fixed">stała</option>
      </select>
      {mode === 'range' && (
        <>
          <input
            type="number"
            min={15}
            max={90}
            step={5}
            placeholder="min"
            value={value?.min ?? ''}
            onChange={(e) => onChange({ ...value, min: toNum5(e.target.value) })}
            className={NUM_CLASS}
          />
          <span className="text-coc-text-muted text-xs">–</span>
          <input
            type="number"
            min={15}
            max={90}
            step={5}
            placeholder="max"
            value={value?.max ?? ''}
            onChange={(e) => onChange({ ...value, max: toNum5(e.target.value) })}
            className={NUM_CLASS}
          />
        </>
      )}
      {mode === 'fixed' && (
        <input
          type="number"
          min={15}
          max={90}
          step={5}
          placeholder="wartość"
          value={value?.fixed ?? ''}
          onChange={(e) => onChange({ fixed: toNum5(e.target.value) })}
          className={NUM_CLASS}
        />
      )}
    </div>
  )
}

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
        {CHARACTERISTICS.map((c) => (
          <div key={c.key} className="contents">
            <div className="text-xs font-medium text-coc-text-muted">
              {c.abbreviation}
              <span className="ml-1 opacity-60">({c.name})</span>
            </div>
            <ConstraintControls
              value={value.chars?.[c.key]}
              onChange={(next) => setChar(c.key, next)}
            />
          </div>
        ))}
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

      <div className="flex items-center gap-2 pt-2 border-t border-coc-border/60">
        <span className="text-xs font-medium text-coc-text-muted">Szczęście (rzut):</span>
        <ConstraintControls
          value={value.luck}
          onChange={(next) => onChange({ ...value, luck: next ?? null })}
        />
      </div>

      <p className="text-xs text-coc-text-muted">
        „auto" = zwykły rzut. „zakres" losuje w widełkach, „stała" ustawia wartość na sztywno
        (wielokrotności 5, jak wyniki kości). Zakres średniej dogrywa całość rzutu. Szczęście
        dotyczy każdego rzutu na szczęście na tym kodzie (także po przerzucie). Puste pola nie
        nakładają ograniczeń.
        {rerollCount === 0 && ' Ustaw budżet przerzutów, aby dodać zakładki przerzutów.'}
      </p>
    </div>
  )
}
