import { useMemo } from 'react'
import type { Characteristics } from '@/types/character'
import type { Occupation } from '@/types/occupation'
import { CHARACTERISTIC_MAP } from '@/data/characteristics'

/**
 * Calculate total occupation skill points from the occupation formula.
 * Supports optional `alternatives` — picks the best stat from the group.
 */
export function calculateOccupationPoints(
  occupation: Occupation,
  characteristics: Partial<Characteristics>
): number {
  const { characteristics: fixedStats, multiplier, alternatives } = occupation.skill_formula
  let total = 0

  for (const stat of fixedStats) {
    total += (characteristics[stat] ?? 0) * multiplier
  }

  if (alternatives && alternatives.length > 0) {
    const best = Math.max(...alternatives.map(s => characteristics[s] ?? 0))
    total += best * multiplier
  }

  return total
}

/**
 * Build a display label for the occupation formula badge.
 * E.g. "WYK + najl.(ZRĘ, SIŁ) × 2 = 280 pkt"
 */
export function getFormulaDisplay(
  occupation: Occupation,
  characteristics: Partial<Characteristics>
): string {
  const { characteristics: fixedStats, multiplier, alternatives } = occupation.skill_formula
  const total = calculateOccupationPoints(occupation, characteristics)

  const parts: string[] = fixedStats.map(c => CHARACTERISTIC_MAP[c].abbreviation)

  if (alternatives && alternatives.length > 0) {
    const altLabels = alternatives.map(c => CHARACTERISTIC_MAP[c].abbreviation).join(', ')
    parts.push(`najl.(${altLabels})`)
  }

  return `${parts.join(' + ')} \u00d7 ${multiplier} = ${total} pkt`
}

/**
 * Calculate personal interest skill points: INT × 2
 */
export function calculatePersonalPoints(int: number): number {
  return int * 2
}

interface UseSkillPointsReturn {
  totalOccupationPoints: number
  usedOccupationPoints: number
  remainingOccupationPoints: number
  totalPersonalPoints: number
  usedPersonalPoints: number
  remainingPersonalPoints: number
}

export function useSkillPoints(
  occupation: Occupation | null,
  characteristics: Partial<Characteristics>,
  occupationSkillPoints: Record<string, number>,
  personalSkillPoints: Record<string, number>
): UseSkillPointsReturn {
  return useMemo(() => {
    const totalOccupationPoints = occupation
      ? calculateOccupationPoints(occupation, characteristics)
      : 0
    const usedOccupationPoints = Object.values(occupationSkillPoints).reduce((s, v) => s + v, 0)

    const int = characteristics.INT ?? 0
    const totalPersonalPoints = calculatePersonalPoints(int)
    const usedPersonalPoints = Object.values(personalSkillPoints).reduce((s, v) => s + v, 0)

    return {
      totalOccupationPoints,
      usedOccupationPoints,
      remainingOccupationPoints: totalOccupationPoints - usedOccupationPoints,
      totalPersonalPoints,
      usedPersonalPoints,
      remainingPersonalPoints: totalPersonalPoints - usedPersonalPoints,
    }
  }, [occupation, characteristics, occupationSkillPoints, personalSkillPoints])
}
