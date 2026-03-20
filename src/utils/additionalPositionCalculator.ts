import { ADDITIONAL_POSITIONS, type AdditionalPositionOption } from '@/data/additionalPositions'

/**
 * Ile slotów dodatkowych pozycji dostaje postać (1 lub 2).
 */
export function countAdditionalSlots(character: {
  wiek: number
  majetnosc: number
  INT: number
  urok_osobisty: number
  perswazja: number
  gadanina: number
}): number {
  let slots = 1

  const maxSocial = Math.max(
    character.urok_osobisty,
    character.perswazja,
    character.gadanina,
  )

  if (
    character.wiek >= 40 ||
    character.majetnosc >= 50 ||
    character.INT >= 80 ||
    maxSocial >= 80
  ) {
    slots = 2
  }

  return slots
}

/**
 * Waga pozycji (gwiazdki 1-3).
 */
export function calculatePositionWeight(
  option: AdditionalPositionOption,
  character: Record<string, number>,
): 1 | 2 | 3 {
  if (option.is_attribute_special) return 3

  let maxValue = 0
  for (const cond of option.unlock) {
    const val = getCharacterValue(character, cond.type, cond.key)
    if (val >= cond.threshold) {
      maxValue = Math.max(maxValue, val)
    }
  }

  if (maxValue >= 70) return 3
  if (maxValue >= 50) return 2
  return 1
}

/**
 * Score pasowania opcji do postaci (wyższy = lepiej pasuje).
 */
export function scoreOption(
  option: AdditionalPositionOption,
  character: Record<string, number>,
): number {
  let score = 0

  for (const cond of option.unlock) {
    const val = getCharacterValue(character, cond.type, cond.key)
    if (val >= cond.threshold) {
      const excess = val - cond.threshold
      score += cond.weight * (1 + excess / 100)
    }
  }

  return score
}

/**
 * Sprawdza czy opcja jest odblokowana (spełniony choć 1 warunek).
 */
export function isOptionUnlocked(
  option: AdditionalPositionOption,
  character: Record<string, number>,
  occupationId: string,
): boolean {
  // Sprawdź occupation_group jeśli wymagane
  if (option.occupation_group_required && !option.occupation_group_required.includes(occupationId)) {
    return false
  }
  // Przynajmniej 1 warunek musi być spełniony
  return option.unlock.some((cond) => {
    const val = getCharacterValue(character, cond.type, cond.key)
    return val >= cond.threshold
  })
}

/**
 * Generowanie 3 propozycji na slot.
 */
export function generateOptions(
  character: Record<string, number>,
  occupationId: string,
  mainPositionCategory: string,
  existingChoices: string[],
): AdditionalPositionOption[] {
  const candidates = ADDITIONAL_POSITIONS
    .filter((opt) => isOptionUnlocked(opt, character, occupationId))
    .filter((opt) => !existingChoices.includes(opt.id))
    .map((opt) => ({ opt, score: scoreOption(opt, character) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)

  // Wybierz max 3 z różnych kategorii, unikaj kategorii pozycji głównej
  // NIE dopychaj do 3 — jeśli brak pasujących, zwróć mniej (nawet 0)
  const result: AdditionalPositionOption[] = []
  const usedCategories = new Set<string>()

  for (const { opt } of candidates) {
    if (result.length >= 3) break
    if (usedCategories.has(opt.category)) continue
    if (opt.category === mainPositionCategory && !opt.is_attribute_special) continue
    result.push(opt)
    usedCategories.add(opt.category)
  }

  return result
}

/**
 * Opis warunku do wyświetlenia w UI.
 */
export function describeUnlock(option: AdditionalPositionOption): string {
  if (option.is_attribute_special && option.attribute_key) {
    return `${option.attribute_key} ≥ 80`
  }
  const bestCond = option.unlock.reduce((best, c) => (c.weight > best.weight ? c : best), option.unlock[0])
  if (!bestCond) return ''
  const keyLabel = bestCond.key.replace(/_/g, ' ').replace(/:/g, ' ')
  return `${keyLabel} ≥ ${bestCond.threshold}`
}

function getCharacterValue(
  character: Record<string, number>,
  type: string,
  key: string,
): number {
  if (type === 'age') return character['wiek'] ?? 0
  if (type === 'wealth') return character['majetnosc'] ?? 0

  // Direct match
  if (character[key] !== undefined) return character[key]

  // For composite skills like 'jezyk_obcy': find max of 'jezyk_obcy:*'
  const compositeMax = Object.entries(character)
    .filter(([k]) => k.startsWith(key + ':'))
    .reduce((max, [, v]) => Math.max(max, v), 0)
  if (compositeMax > 0) return compositeMax

  return 0
}
