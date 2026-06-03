import { useState, useMemo } from 'react'
import { useCharacterStore } from '@/stores/characterStore'
import { getOccupationById, parseSkillSlot, isSpecialSlot } from '@/data/occupations'
import { getSkillById, getSkillsForEra, getSkillDisplayName, getSkillBase } from '@/data/skills'
import { getWealthBracket, calculateWealth, formatCurrency } from '@/data/eras'
import { useSkillPoints } from '@/hooks/useSkillPoints'
import type { Characteristics } from '@/types/character'
import type { Era } from '@/types/common'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SkillRow } from '@/components/shared/SkillRow'

interface SkillOption {
  key: string
  displayName: string
  base: number | 'half_dex' | 'edu'
}

function getBaseValue(skillId: string, chars: Partial<Characteristics>, era: Era): number {
  const base = getSkillBase(skillId, era)
  if (base === 'half_dex') return Math.floor((chars.DEX ?? 0) / 2)
  if (base === 'edu') return chars.EDU ?? 0
  return base
}

export function StepOccupationSkills() {
  const store = useCharacterStore()
  const chars = store.characteristics as Characteristics
  const era = store.era as Era
  const maxSkillValue = store.maxSkillValue
  // Optional per-code wealth ceiling (migration 022). NULL/undefined = no
  // ceiling — fall back to occupation.credit_rating range. When set, hard
  // occupation-range validation becomes a soft warning.
  const wealthCeiling: number | null = store.serverCharacter?.max_wealth ?? null
  const occupation = useMemo(
    () => getOccupationById(store.occupationId) ?? null,
    [store.occupationId]
  )

  const [skillPoints, setSkillPoints] = useState<Record<string, number>>(store.occupationSkillPoints)

  // Handle special skill slots: player picks from pool or specific options
  const [chosenSlotSkills, setChosenSlotSkills] = useState<Record<number, string>>(() => {
    // Reconstruct chosen skills from stored points
    const slots: Record<number, string> = {}
    if (occupation) {
      const fixedSkills = occupation.skills.filter((s) => !isSpecialSlot(s))
      occupation.skills.forEach((sid, i) => {
        const parsed = parseSkillSlot(sid)
        if (parsed.type === 'any' || parsed.type === 'any_academic') {
          for (const [skillId] of Object.entries(store.occupationSkillPoints)) {
            if (!fixedSkills.includes(skillId) && !Object.values(slots).includes(skillId)) {
              slots[i] = skillId
              break
            }
          }
        } else if (parsed.type === 'choice') {
          for (const optId of parsed.choice.options) {
            if (store.occupationSkillPoints[optId] && !Object.values(slots).includes(optId)) {
              slots[i] = optId
              break
            }
          }
        } else if (parsed.type === 'specialized' && parsed.locked === null) {
          // Open specialization - find matching composite key in stored points
          const baseId = parsed.id
          for (const [skillId] of Object.entries(store.occupationSkillPoints)) {
            if (skillId.startsWith(baseId + ':') && !Object.values(slots).includes(skillId)) {
              // Check if this specialization is valid for this slot
              if (parsed.options) {
                const spec = skillId.substring(baseId.length + 1)
                if (parsed.options.includes(spec)) {
                  slots[i] = skillId
                  break
                }
              } else {
                slots[i] = skillId
                break
              }
            }
          }
        }
      })
    }
    return slots
  })

  // Custom specialization text input state
  const [customSpecTexts, setCustomSpecTexts] = useState<Record<number, string>>({})

  const { totalOccupationPoints, usedOccupationPoints, remainingOccupationPoints } =
    useSkillPoints(occupation, chars, skillPoints, {})

  // Credit rating points (part of occupation points)
  const [creditRatingPoints, setCreditRatingPoints] = useState(skillPoints['majetnosc'] ?? 0)

  // Expanded skill list for "any" dropdowns — includes combat specializations as individual entries
  const expandedAvailableSkills = useMemo(() => {
    const eraSkills = getSkillsForEra(era).filter((s) => s.id !== 'mity_cthulhu')
    const options: SkillOption[] = []

    for (const skill of eraSkills) {
      if (skill.combatSpecializations) {
        for (const spec of skill.combatSpecializations) {
          if (spec.era && !spec.era.includes(era)) continue
          options.push({
            key: `${skill.id}:${spec.id}`,
            displayName: `${skill.name} (${spec.name})`,
            base: spec.base,
          })
        }
      } else {
        options.push({
          key: skill.id,
          displayName: skill.name,
          base: skill.base,
        })
      }
    }

    return options.sort((a, b) => a.displayName.localeCompare(b.displayName, 'pl'))
  }, [era])

  const academicSkillOptions = useMemo(
    () => expandedAvailableSkills.filter((o) => {
      const skill = getSkillById(o.key)
      return skill?.category === 'academic'
    }),
    [expandedAvailableSkills]
  )

  if (!occupation) {
    return <Card title="Umiejętności zawodowe"><p>Brak wybranego zawodu.</p></Card>
  }

  // Collect all used skill IDs (fixed + chosen) to prevent duplicates
  const usedIds = new Set([
    ...occupation.skills.filter((s) => !isSpecialSlot(s)),
    ...Object.values(chosenSlotSkills),
    'majetnosc',
  ])

  const handlePointChange = (skillId: string, delta: number) => {
    let effectiveDelta = delta
    if (delta > 0) {
      if (remainingOccupationPoints <= 0) return
      effectiveDelta = Math.min(delta, remainingOccupationPoints)
    }

    const current = skillPoints[skillId] ?? 0
    const base = getBaseValue(skillId, chars, era)
    const maxForSkill = skillId === 'majetnosc'
      ? Math.max(0, (wealthCeiling ?? occupation?.credit_rating.max ?? maxSkillValue) - base)
      : Math.max(0, maxSkillValue - base)
    const newVal = Math.min(maxForSkill, Math.max(0, current + effectiveDelta))
    const newPoints = { ...skillPoints, [skillId]: newVal }
    if (newVal === 0) delete newPoints[skillId]
    setSkillPoints(newPoints)

    if (skillId === 'majetnosc') setCreditRatingPoints(newVal)
  }

  const handleChooseSlotSkill = (slotIndex: number, skillId: string) => {
    // Remove points from old choice
    const oldChoice = chosenSlotSkills[slotIndex]
    if (oldChoice && skillPoints[oldChoice]) {
      const newPoints = { ...skillPoints }
      delete newPoints[oldChoice]
      setSkillPoints(newPoints)
    }
    setChosenSlotSkills((prev) => ({ ...prev, [slotIndex]: skillId }))
  }

  // Credit rating validation. When the invite code carries `max_wealth`,
  // we relax the hard occupation-range gate into a soft warning — admin
  // explicitly opted into the ceiling, so the character may legitimately
  // sit outside the typical range for the chosen occupation.
  const creditRatingBase = getBaseValue('majetnosc', chars, era)
  const creditRatingTotal = creditRatingBase + creditRatingPoints
  const wealthCeilingActive = wealthCeiling !== null
  const inOccupationRange =
    creditRatingTotal >= occupation.credit_rating.min &&
    creditRatingTotal <= occupation.credit_rating.max
  const creditRatingValid = wealthCeilingActive ? true : inOccupationRange

  const canContinue = remainingOccupationPoints === 0 && creditRatingValid

  const handleNext = () => {
    store.setOccupationSkillPoints(skillPoints)
    store.nextStep()
  }

  const formatBase = (base: number | 'half_dex' | 'edu'): string => {
    if (base === 'half_dex') return '½ZRĘ'
    if (base === 'edu') return 'WYK'
    return String(base)
  }

  const renderSlot = (sid: string, i: number) => {
    const parsed = parseSkillSlot(sid)

    // Fixed skill (no specialization)
    if (parsed.type === 'fixed') {
      const skill = getSkillById(parsed.id)
      if (!skill) return null
      return (
        <SkillRow
          key={parsed.id}
          name={skill.name}
          baseValue={getBaseValue(parsed.id, chars, era)}
          addedPoints={skillPoints[parsed.id] ?? 0}
          onPointsChange={(d) => handlePointChange(parsed.id, d)}
          maxAdd={maxSkillValue - getBaseValue(parsed.id, chars, era)}
        />
      )
    }

    // Specialized skill with locked or open specialization
    if (parsed.type === 'specialized') {
      const skill = getSkillById(parsed.id)
      if (!skill) return null

      // Locked specialization - no dropdown needed
      if (parsed.locked) {
        const compositeKey = `${parsed.id}:${parsed.locked}`
        return (
          <SkillRow
            key={compositeKey}
            name={getSkillDisplayName(compositeKey)}
            baseValue={getBaseValue(compositeKey, chars, era)}
            addedPoints={skillPoints[compositeKey] ?? 0}
            onPointsChange={(d) => handlePointChange(compositeKey, d)}
            maxAdd={maxSkillValue - getBaseValue(compositeKey, chars, era)}
          />
        )
      }

      // Open or limited specialization - show dropdown
      const chosenCompositeKey = chosenSlotSkills[i]

      // For combat specializations, use combatSpec IDs; for regular, use specialization names
      let specOptions: { value: string; label: string }[] = []
      if (skill.combatSpecializations) {
        const filteredSpecs = parsed.options
          ? skill.combatSpecializations.filter((cs) => parsed.options!.includes(cs.id))
          : skill.combatSpecializations.filter((cs) => !cs.era || cs.era.includes(era))
        specOptions = filteredSpecs.map((cs) => ({
          value: `${parsed.id}:${cs.id}`,
          label: cs.name,
        }))
      } else {
        const rawOptions = parsed.options ?? skill.specializations ?? []
        specOptions = rawOptions.map((spec) => ({
          value: `${parsed.id}:${spec}`,
          label: spec,
        }))
      }

      const chosenValues = Object.values(chosenSlotSkills)
      const isCustom = chosenCompositeKey === `${parsed.id}:__custom__` || (customSpecTexts[i] !== undefined && chosenCompositeKey?.startsWith(`${parsed.id}:`))

      const handleSpecChange = (value: string) => {
        if (value === '__custom__') {
          const oldKey = chosenSlotSkills[i]
          if (oldKey && skillPoints[oldKey]) {
            const newPoints = { ...skillPoints }
            delete newPoints[oldKey]
            setSkillPoints(newPoints)
          }
          setCustomSpecTexts((prev) => ({ ...prev, [i]: '' }))
          setChosenSlotSkills((prev) => ({ ...prev, [i]: `${parsed.id}:__custom__` }))
        } else {
          setCustomSpecTexts((prev) => {
            const next = { ...prev }
            delete next[i]
            return next
          })
          handleChooseSlotSkill(i, value)
        }
      }

      const handleCustomTextConfirm = () => {
        const text = customSpecTexts[i]?.trim()
        if (text) {
          const compositeKey = `${parsed.id}:${text}`
          const oldKey = chosenSlotSkills[i]
          if (oldKey && oldKey !== compositeKey && skillPoints[oldKey]) {
            const newPoints = { ...skillPoints }
            delete newPoints[oldKey]
            setSkillPoints(newPoints)
          }
          setChosenSlotSkills((prev) => ({ ...prev, [i]: compositeKey }))
        }
      }

      let selectValue = ''
      if (chosenCompositeKey) {
        if (customSpecTexts[i] !== undefined) {
          selectValue = '__custom__'
        } else {
          selectValue = chosenCompositeKey
        }
      }

      const actualKey = chosenCompositeKey && chosenCompositeKey !== `${parsed.id}:__custom__` ? chosenCompositeKey : undefined

      return (
        <div key={`slot-${i}`} className="py-1.5 px-2 rounded bg-coc-surface-light/30">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="default">
              {skill.name}
            </Badge>
            <select
              value={selectValue}
              onChange={(e) => handleSpecChange(e.target.value)}
              className="flex-1 px-2 py-1 text-sm bg-coc-surface-light border border-coc-border rounded text-coc-text cursor-pointer"
            >
              <option value="">— Wybierz specjalizację —</option>
              {specOptions.map((opt) => {
                const alreadyUsed = chosenValues.includes(opt.value) && chosenSlotSkills[i] !== opt.value
                if (alreadyUsed) return null
                return (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                )
              })}
              {!parsed.options && !skill.combatSpecializations && (
                <option value="__custom__">Inne...</option>
              )}
            </select>
          </div>
          {isCustom && customSpecTexts[i] !== undefined && (
            <div className="flex items-center gap-2 mb-1 px-1">
              <input
                type="text"
                value={customSpecTexts[i]}
                onChange={(e) => setCustomSpecTexts((prev) => ({ ...prev, [i]: e.target.value }))}
                onBlur={handleCustomTextConfirm}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomTextConfirm()}
                placeholder="Wpisz specjalizację..."
                className="flex-1 px-2 py-1 text-sm bg-coc-surface-light border border-coc-border rounded text-coc-text"
                autoFocus
              />
            </div>
          )}
          {actualKey && (
            <SkillRow
              name={getSkillDisplayName(actualKey)}
              baseValue={getBaseValue(actualKey, chars, era)}
              addedPoints={skillPoints[actualKey] ?? 0}
              onPointsChange={(d) => handlePointChange(actualKey, d)}
              maxAdd={maxSkillValue - getBaseValue(actualKey, chars, era)}
            />
          )}
        </div>
      )
    }

    // 'any', 'any_academic', or 'choice' slot
    const chosenId = chosenSlotSkills[i]

    if (parsed.type === 'choice') {
      // Choice options may be composite keys (e.g., bron_palna:krotka) — use them directly
      const optionDisplayNames = parsed.choice.options.map((k) => getSkillDisplayName(k))
      const label = `Wybierz z: ${optionDisplayNames.join(', ')}`

      return (
        <div key={`slot-${i}`} className="py-1.5 px-2 rounded bg-coc-surface-light/30">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="default">Wybór</Badge>
            <select
              value={chosenId ?? ''}
              onChange={(e) => handleChooseSlotSkill(i, e.target.value)}
              className="flex-1 px-2 py-1 text-sm bg-coc-surface-light border border-coc-border rounded text-coc-text cursor-pointer"
            >
              <option value="">— Wybierz umiejętność —</option>
              {parsed.choice.options
                .filter((k) => !usedIds.has(k) || k === chosenId)
                .map((k) => (
                  <option key={k} value={k}>
                    {getSkillDisplayName(k)} ({formatBase(getSkillBase(k, era))}%)
                  </option>
                ))
              }
            </select>
          </div>
          <p className="text-xs text-coc-text-muted px-1 mb-1">{label}</p>
          {chosenId && (
            <SkillRow
              name={getSkillDisplayName(chosenId)}
              baseValue={getBaseValue(chosenId, chars, era)}
              addedPoints={skillPoints[chosenId] ?? 0}
              onPointsChange={(d) => handlePointChange(chosenId, d)}
              maxAdd={maxSkillValue - getBaseValue(chosenId, chars, era)}
            />
          )}
        </div>
      )
    }

    // any / any_academic — use expanded skill list with combat specs
    let pool: SkillOption[]
    let label: string

    if (parsed.type === 'any') {
      pool = expandedAvailableSkills
      label = 'Dowolna'
    } else {
      pool = academicSkillOptions
      label = 'Dowolna (akademicka)'
    }

    return (
      <div key={`slot-${i}`} className="py-1.5 px-2 rounded bg-coc-surface-light/30">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="warning">{label}</Badge>
          <select
            value={chosenId ?? ''}
            onChange={(e) => handleChooseSlotSkill(i, e.target.value)}
            className="flex-1 px-2 py-1 text-sm bg-coc-surface-light border border-coc-border rounded text-coc-text cursor-pointer"
          >
            <option value="">— Wybierz umiejętność —</option>
            {pool
              .filter((o) => !usedIds.has(o.key) || o.key === chosenId)
              .map((o) => (
                <option key={o.key} value={o.key}>
                  {o.displayName} ({formatBase(o.base)}%)
                </option>
              ))
            }
          </select>
        </div>
        {chosenId && (
          <SkillRow
            name={getSkillDisplayName(chosenId)}
            baseValue={getBaseValue(chosenId, chars, era)}
            addedPoints={skillPoints[chosenId] ?? 0}
            onPointsChange={(d) => handlePointChange(chosenId, d)}
            maxAdd={maxSkillValue - getBaseValue(chosenId, chars, era)}
          />
        )}
      </div>
    )
  }

  return (
    <Card title="Umiejętności zawodowe">
      <div className="flex flex-wrap gap-3 mb-4">
        <Badge variant={remainingOccupationPoints === 0 ? 'success' : 'warning'}>
          Punkty: {usedOccupationPoints} / {totalOccupationPoints}
          {remainingOccupationPoints > 0 && ` (pozostało: ${remainingOccupationPoints})`}
        </Badge>
        <Badge variant={creditRatingValid ? 'success' : 'danger'}>
          Majętność: {creditRatingTotal} (wymagane: {occupation.credit_rating.min}–{occupation.credit_rating.max})
        </Badge>
      </div>

      {occupation.suggested_skills_note && (
        <p className="text-xs text-coc-text-muted italic mb-3 px-1">
          {occupation.suggested_skills_note}
        </p>
      )}

      <div className="space-y-1 mb-4">
        {occupation.skills.map((sid, i) => renderSlot(sid, i))}

        {/* Credit Rating (always part of occupation) */}
        <div className="border-t border-coc-border pt-2 mt-2">
          <SkillRow
            name="Majętność"
            baseValue={creditRatingBase}
            addedPoints={creditRatingPoints}
            onPointsChange={(d) => handlePointChange('majetnosc', d)}
            maxAdd={(wealthCeiling ?? occupation.credit_rating.max) - creditRatingBase}
          />
          {!wealthCeilingActive && !inOccupationRange && (
            <p className="text-xs text-coc-danger px-2">
              Majętność musi być w zakresie {occupation.credit_rating.min}–{occupation.credit_rating.max}
            </p>
          )}
          {wealthCeilingActive && !inOccupationRange && (
            <p className="text-xs text-coc-warning px-2">
              Twoja majętność ({creditRatingTotal}) jest poza typowym zakresem zawodu
              ({occupation.credit_rating.min}–{occupation.credit_rating.max}) — prawdopodobnie
              nie pracujesz już w tym zawodzie.
            </p>
          )}
          {creditRatingTotal > 0 && era && (() => {
            try {
              const bracket = getWealthBracket(era, creditRatingTotal)
              const wealth = calculateWealth(era, creditRatingTotal)
              const housingRange = bracket.housingOptions?.length > 1
                ? `${bracket.housingOptions[0].label} – ${bracket.housingOptions[bracket.housingOptions.length - 1].label}`
                : bracket.housingOptions?.[0]?.label ?? ''
              const transportRange = bracket.transportOptions?.length > 1
                ? `${bracket.transportOptions[0].label} – ${bracket.transportOptions[bracket.transportOptions.length - 1].label}`
                : bracket.transportOptions?.[0]?.label ?? ''
              return (
                <div className="mt-1.5 px-2 py-1.5 bg-coc-surface-light/50 rounded text-xs text-coc-text-muted space-y-0.5">
                  <div>Dobytek: {formatCurrency(era, wealth.assets)} | Mieszkanie: {housingRange}</div>
                  <div>Transport: {transportRange}</div>
                </div>
              )
            } catch {
              return null
            }
          })()}
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={() => store.prevStep()}>Wstecz</Button>
        <Button onClick={handleNext} disabled={!canContinue}>Dalej</Button>
      </div>
    </Card>
  )
}
