import { OCCUPATION_CLUSTER_MAP, CLUSTER_OPTIONS } from '@/data/occupationClusters'
import type { PositionOption } from '@/types/character'

export const SIZE_MODIFIERS: Record<string, number> = {
  'Mikro': 20, 'Mała': 10, 'Średnia': 0, 'Duża': -10, 'Wielka': -20,
}

/**
 * Oblicza siłę pozycji (%) na podstawie danych postaci i rozmiaru organizacji.
 * Zakres 20-100%, krok 5%.
 */
export function calculatePositionStrength(params: {
  occupationalPoints: number
  socialSkills: {
    urokOsobisty: number
    perswazja: number
    gadatliwosc: number
    zastraszanie: number
  }
  wiek: number
  organizationSize: string
}): number {
  const { occupationalPoints, socialSkills, wiek, organizationSize } = params

  // Baza z punktów zawodowych
  let base = 20
  if (occupationalPoints >= 400) base = 80
  else if (occupationalPoints >= 300) base = 65
  else if (occupationalPoints >= 200) base = 50
  else if (occupationalPoints >= 100) base = 35

  // Top 2 umiejętności społeczne (najwyższe dwie z czterech)
  const socialValues = Object.values(socialSkills).sort((a, b) => b - a)
  let socialBonus = 0
  for (let i = 0; i < 2; i++) {
    if (socialValues[i] >= 60) socialBonus += 10
    else if (socialValues[i] >= 30) socialBonus += 5
  }

  // Bonus wieku
  let ageBonus = 0
  if (wiek >= 50) ageBonus = 10
  else if (wiek >= 30) ageBonus = 5

  // Modyfikator rozmiaru
  const sizeMod = SIZE_MODIFIERS[organizationSize] ?? 0

  // Suma, zakres 20-100, zaokrąglenie do 5
  const raw = base + socialBonus + ageBonus + sizeMod
  const clamped = Math.max(20, Math.min(100, raw))
  return Math.round(clamped / 5) * 5
}

/**
 * Sprawdza czy warunek odblokowania jest spełniony.
 * Format warunku: "ZAWSZE" | "skillId_prog" np. "okultyzm_30"
 */
export function isUnlocked(
  unlockCondition: string,
  skillTotals: Record<string, number>,
): boolean {
  if (unlockCondition === 'ZAWSZE') return true

  // Find last underscore to split skillId from threshold
  const lastUnderscore = unlockCondition.lastIndexOf('_')
  if (lastUnderscore <= 0) return false

  const skillKey = unlockCondition.substring(0, lastUnderscore)
  const threshold = parseInt(unlockCondition.substring(lastUnderscore + 1))
  if (isNaN(threshold)) return false

  // Check direct skill match
  if (skillTotals[skillKey] !== undefined) {
    return skillTotals[skillKey] >= threshold
  }

  // Check composite skills (e.g., jezyk_obcy → max of jezyk_obcy:*)
  const compositeMax = Object.entries(skillTotals)
    .filter(([k]) => k.startsWith(skillKey + ':'))
    .reduce((max, [, v]) => Math.max(max, v), 0)

  return compositeMax >= threshold
}

/**
 * Zwraca dostępne opcje pozycji dla danego zawodu.
 * Opcje ZAWSZE pierwsze, odblokowane na końcu.
 */
export function getAvailablePositionOptions(
  occupationId: string,
  skillTotals: Record<string, number>,
): PositionOption[] {
  const clusterId = OCCUPATION_CLUSTER_MAP[occupationId] ?? 'ZAWODY_NISZOWE'
  const clusterOptions = CLUSTER_OPTIONS[clusterId] ?? []

  // Filter by occupation if the option specifies allowed occupations
  const forOccupation = clusterOptions.filter(
    (o) => !o.occupations || o.occupations.includes(occupationId),
  )

  const always = forOccupation.filter((o) => o.unlock_condition === 'ZAWSZE')
  const unlocked = forOccupation.filter(
    (o) => o.unlock_condition !== 'ZAWSZE' && isUnlocked(o.unlock_condition, skillTotals),
  )

  return [...always, ...unlocked]
}

/**
 * Oblicza wagę dla dodatkowych pozycji (1-3 gwiazdki).
 */
export function getAdditionalPositionWeight(
  slotIndex: number,
  baseWeight: number,
): 1 | 2 | 3 {
  if (slotIndex >= 3) return 1
  return Math.max(1, Math.min(3, baseWeight - 1)) as 1 | 2 | 3
}
