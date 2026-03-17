import { CONTACT_SUBCATEGORIES_V2 } from '@/data/contactSubcategories'

/**
 * Oblicza siłę bazową kontaktu dla danej postaci.
 */
export function calculateContactStrength(params: {
  subcategoryId: string
  occupationId: string
  skillTotals: Record<string, number>
  isIsolatedOccupation: boolean
}): 1 | 2 | 3 {
  const { subcategoryId, occupationId, skillTotals, isIsolatedOccupation } = params
  const sub = CONTACT_SUBCATEGORIES_V2.find((s) => s.id === subcategoryId)
  if (!sub) return 1

  const isNatural = sub.natural_for_occupations.includes(occupationId)
  const isOccult = sub.category === 'OKULTYZM I TAJNE KRĘGI'

  // Siła bazowa
  let strength: number = 1
  if (isOccult && (skillTotals['okultyzm'] ?? 0) >= 80) strength = 3
  else if (isIsolatedOccupation && isNatural) strength = 3
  else if (isNatural) strength = 2

  // Modyfikatory socjalne
  const socialCategories = ['TOWARZYSTWO I KLUBY', 'PRASA I MEDIA', 'WŁADZA I BIZNES']
  const maxSocial = Math.max(skillTotals['urok_osobisty'] ?? 0, skillTotals['gadanina'] ?? 0)
  if (maxSocial >= 60 && socialCategories.includes(sub.category)) {
    strength = Math.min(3, strength + 1)
  }

  // Modyfikator majętności
  const majetnosc = skillTotals['majetnosc'] ?? 0
  if (majetnosc >= 60 && sub.category === 'WŁADZA I BIZNES') {
    strength = Math.min(3, strength + 1)
  }

  return Math.max(1, Math.min(3, strength)) as 1 | 2 | 3
}

/**
 * Oblicza wartość rzutu kontaktu.
 */
export function calculateContactRollValue(
  strength: number,
  skillTotals: Record<string, number>,
): number {
  const maxSocial = Math.max(skillTotals['urok_osobisty'] ?? 0, skillTotals['perswazja'] ?? 0)
  let bonus = 0
  if (maxSocial >= 60) bonus = 15
  else if (maxSocial >= 30) bonus = 5

  return Math.min(90, strength * 25 + bonus)
}

/**
 * Przelicza synergie dla wszystkich wybranych kontaktów.
 */
export function applySynergies<T extends { category: string; strength: number; synergy_bonus: number }>(
  contacts: T[],
): T[] {
  const categoryCounts: Record<string, number> = {}
  for (const c of contacts) {
    categoryCounts[c.category] = (categoryCounts[c.category] ?? 0) + 1
  }

  return contacts.map((c) => {
    const count = categoryCounts[c.category] ?? 1
    let synergyBonus = 0
    if (count >= 3) synergyBonus = 2
    else if (count === 2) synergyBonus = 1

    const baseStrength = c.strength - c.synergy_bonus // recover base
    const newStrength = Math.min(3, baseStrength + synergyBonus)
    return { ...c, strength: newStrength as 1 | 2 | 3, synergy_bonus: synergyBonus }
  })
}

/**
 * Lista izolowanych zawodów (mniejsza sieć kontaktów, ale silniejsze w swojej dziedzinie).
 */
export const ISOLATED_OCCUPATIONS = new Set([
  'naukowiec', 'artysta', 'pisarz', 'prywatny_detektyw', 'archeolog',
  'parapsycholog', 'okultysta', 'traper', 'farmer',
])
