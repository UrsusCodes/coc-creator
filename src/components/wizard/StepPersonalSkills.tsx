import { useState, useMemo } from 'react'
import { useCharacterStore } from '@/stores/characterStore'
import { getOccupationById } from '@/data/occupations'
import { getSkillById, getSkillsForEra, getSkillDisplayName, getSkillBase } from '@/data/skills'
import { useSkillPoints } from '@/hooks/useSkillPoints'
import type { Characteristics } from '@/types/character'
import type { Era } from '@/types/common'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SkillRow } from '@/components/shared/SkillRow'

function getBaseValue(skillId: string, chars: Partial<Characteristics>, era: Era): number {
  const base = getSkillBase(skillId, era)
  if (base === 'half_dex') return Math.floor((chars.DEX ?? 0) / 2)
  if (base === 'edu') return chars.EDU ?? 0
  return base
}

interface ExpandedSkillEntry {
  key: string
  displayName: string
  isCustom?: boolean
  baseSkillId: string
}

export function StepPersonalSkills() {
  const store = useCharacterStore()
  const chars = store.characteristics as Characteristics
  const era = store.era as Era
  const maxSkillValue = store.maxSkillValue
  const occupation = useMemo(
    () => getOccupationById(store.occupationId) ?? null,
    [store.occupationId]
  )

  const [personalPoints, setPersonalPoints] = useState<Record<string, number>>(
    store.personalSkillPoints
  )

  // Custom specialization text per base skill id
  const [customSpecTexts, setCustomSpecTexts] = useState<Record<string, string>>(() => {
    // Reconstruct custom spec texts from stored personal points
    const texts: Record<string, string> = {}
    for (const key of Object.keys(store.personalSkillPoints)) {
      const colonIdx = key.indexOf(':')
      if (colonIdx > 0) {
        const baseId = key.substring(0, colonIdx)
        const spec = key.substring(colonIdx + 1)
        const skill = getSkillById(baseId)
        // Only for regular specializations (not combat) where the spec is custom
        if (skill?.specializations && !skill.specializations.includes(spec)) {
          texts[baseId] = spec
        }
      }
    }
    return texts
  })

  const { totalPersonalPoints, usedPersonalPoints, remainingPersonalPoints } =
    useSkillPoints(occupation, chars, store.occupationSkillPoints, personalPoints)

  // Build expanded skill list: specialized skills become multiple entries
  const expandedSkills = useMemo(() => {
    const eraSkills = getSkillsForEra(era)
      .filter((s) => s.id !== 'mity_cthulhu' && s.id !== 'majetnosc')

    const entries: ExpandedSkillEntry[] = []

    for (const skill of eraSkills) {
      if (skill.combatSpecializations && skill.combatSpecializations.length > 0) {
        // Expand combat specializations into individual entries
        for (const spec of skill.combatSpecializations) {
          if (spec.era && !spec.era.includes(era)) continue
          entries.push({
            key: `${skill.id}:${spec.id}`,
            displayName: `${skill.name} (${spec.name})`,
            baseSkillId: skill.id,
          })
        }
      } else if (skill.specializations && skill.specializations.length > 0) {
        for (const spec of skill.specializations) {
          entries.push({
            key: `${skill.id}:${spec}`,
            displayName: `${skill.name} (${spec})`,
            baseSkillId: skill.id,
          })
        }
        // "Inne..." entry for custom specialization
        entries.push({
          key: `${skill.id}:__custom__`,
          displayName: `${skill.name} (Inne...)`,
          isCustom: true,
          baseSkillId: skill.id,
        })
      } else {
        entries.push({
          key: skill.id,
          displayName: skill.name,
          baseSkillId: skill.id,
        })
      }
    }

    return entries.sort((a, b) => a.displayName.localeCompare(b.displayName, 'pl'))
  }, [era])

  const handlePointChange = (skillId: string, delta: number) => {
    let effectiveDelta = delta
    if (delta > 0) {
      if (remainingPersonalPoints <= 0) return
      effectiveDelta = Math.min(delta, remainingPersonalPoints)
    }

    const current = personalPoints[skillId] ?? 0
    const occPts = store.occupationSkillPoints[skillId] ?? 0
    const base = getBaseValue(skillId, chars, era) + occPts
    const maxForSkill = Math.max(0, maxSkillValue - base)
    const newVal = Math.min(maxForSkill, Math.max(0, current + effectiveDelta))

    const newPoints = { ...personalPoints, [skillId]: newVal }
    if (newVal === 0) delete newPoints[skillId]
    setPersonalPoints(newPoints)
  }

  const handleCustomTextConfirm = (baseSkillId: string) => {
    const newText = customSpecTexts[baseSkillId]?.trim()
    if (!newText) return

    // Find existing custom key for this base skill in personalPoints
    const skill = getSkillById(baseSkillId)
    const oldKey = Object.keys(personalPoints).find((k) => {
      if (!k.startsWith(baseSkillId + ':')) return false
      const spec = k.substring(baseSkillId.length + 1)
      return skill?.specializations ? !skill.specializations.includes(spec) : false
    })

    const newKey = `${baseSkillId}:${newText}`
    if (oldKey && oldKey !== newKey) {
      // Transfer points from old custom key to new one
      const pts = personalPoints[oldKey] ?? 0
      const newPoints = { ...personalPoints }
      delete newPoints[oldKey]
      if (pts > 0) newPoints[newKey] = pts
      setPersonalPoints(newPoints)
    }
  }

  const getCustomKey = (baseSkillId: string): string | undefined => {
    const text = customSpecTexts[baseSkillId]?.trim()
    return text ? `${baseSkillId}:${text}` : undefined
  }

  const canContinue = remainingPersonalPoints === 0

  const handleNext = () => {
    store.setPersonalSkillPoints(personalPoints)
    store.nextStep()
  }

  return (
    <Card title="Umiejętności osobiste (zainteresowania)">
      <p className="text-sm text-coc-text-muted mb-3">
        Rozdziel INT × 2 = <strong>{totalPersonalPoints}</strong> punktów wśród dowolnych umiejętności (oprócz Mitów Cthulhu i Majętności).
      </p>

      <div className="mb-4">
        <Badge variant={remainingPersonalPoints === 0 ? 'success' : 'warning'}>
          Punkty: {usedPersonalPoints} / {totalPersonalPoints}
          {remainingPersonalPoints > 0 && ` (pozostało: ${remainingPersonalPoints})`}
        </Badge>
      </div>

      {/* Show skills that already have personal points first */}
      {Object.keys(personalPoints).length > 0 && (
        <div className="mb-3 border-b border-coc-border pb-3 min-h-[80px] max-h-[200px] overflow-y-auto">
          <h4 className="text-xs font-medium text-coc-text-muted mb-1 sticky top-0 bg-coc-surface z-10">Przydzielone punkty</h4>
          {Object.entries(personalPoints)
            .filter(([, pts]) => pts > 0)
            .map(([skillId, pts]) => {
              const occPts = store.occupationSkillPoints[skillId] ?? 0
              const base = getBaseValue(skillId, chars, era) + occPts
              return (
                <SkillRow
                  key={skillId}
                  name={getSkillDisplayName(skillId)}
                  baseValue={base}
                  addedPoints={pts}
                  onPointsChange={(d) => handlePointChange(skillId, d)}
                  maxAdd={maxSkillValue - base}
                />
              )
            })}
        </div>
      )}

      {/* All available skills (expanded specializations) - hide those already assigned */}
      <div className="max-h-[400px] overflow-y-auto space-y-0.5 pr-1">
        {expandedSkills.filter((entry) => {
          // Hide skills that already have personal points (they're shown in the "Przydzielone punkty" section above)
          if (!entry.isCustom && (personalPoints[entry.key] ?? 0) > 0) return false
          return true
        }).map((entry) => {
          if (entry.isCustom) {
            const customKey = getCustomKey(entry.baseSkillId)
            const occPts = customKey ? (store.occupationSkillPoints[customKey] ?? 0) : 0
            const persPts = customKey ? (personalPoints[customKey] ?? 0) : 0
            const base = getBaseValue(customKey ?? entry.baseSkillId, chars, era) + occPts

            return (
              <div key={entry.key} className="py-1 px-2 rounded bg-coc-surface-light/30">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-coc-text-muted whitespace-nowrap">
                    {getSkillById(entry.baseSkillId)?.name} (
                  </span>
                  <input
                    type="text"
                    value={customSpecTexts[entry.baseSkillId] ?? ''}
                    onChange={(e) =>
                      setCustomSpecTexts((prev) => ({ ...prev, [entry.baseSkillId]: e.target.value }))
                    }
                    onBlur={() => handleCustomTextConfirm(entry.baseSkillId)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCustomTextConfirm(entry.baseSkillId)}
                    placeholder="Inne..."
                    className="flex-1 px-2 py-0.5 text-sm bg-coc-surface-light border border-coc-border rounded text-coc-text min-w-0"
                  />
                  <span className="text-sm text-coc-text-muted">)</span>
                </div>
                {customKey && (
                  <SkillRow
                    name={getSkillDisplayName(customKey)}
                    baseValue={base}
                    addedPoints={persPts}
                    onPointsChange={(d) => handlePointChange(customKey, d)}
                    maxAdd={maxSkillValue - base}
                  />
                )}
              </div>
            )
          }

          const occPts = store.occupationSkillPoints[entry.key] ?? 0
          const persPts = personalPoints[entry.key] ?? 0
          const base = getBaseValue(entry.key, chars, era) + occPts
          return (
            <SkillRow
              key={entry.key}
              name={entry.displayName}
              baseValue={base}
              addedPoints={persPts}
              onPointsChange={(d) => handlePointChange(entry.key, d)}
              maxAdd={maxSkillValue - base}
            />
          )
        })}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="secondary" onClick={() => store.prevStep()}>Wstecz</Button>
        <Button onClick={handleNext} disabled={!canContinue}>Dalej</Button>
      </div>
    </Card>
  )
}
