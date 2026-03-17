import { CONTACT_CATEGORIES_NEW, findSubcategory, getAllSubcategories, type ContactSubcategoryData } from '@/data/contactCategories'
import { OCCUPATION_CONTACT_MAP } from '@/data/occupationContactMap'
import type { ContactV2 } from '@/types/character'

// ── Ile slotów zawodowych ──

export function countOccupationContactSlots(occupationId: string): number {
  const profile = OCCUPATION_CONTACT_MAP[occupationId] ?? OCCUPATION_CONTACT_MAP['_default']
  switch (profile.type) {
    case 'sieciowy': return 3
    case 'przeciętny': return 2
    case 'izolowany': return 2
  }
}

// ── Ile slotów dodatkowych ──

export function countAdditionalContactSlots(character: Record<string, number>): number {
  let slots = 0
  const maxSocial = Math.max(character['urok_osobisty'] ?? 0, character['gadanina'] ?? 0)
  if (maxSocial >= 60) slots += 1
  if ((character['majetnosc'] ?? 0) >= 50 || (character['wiek'] ?? 0) >= 45) slots += 1
  return Math.min(slots, 2)
}

// ── Siła bazowa kontaktu ──

export function calculateBaseStrength(
  subcategoryId: string,
  occupationId: string,
  character: Record<string, number>,
): 1 | 2 | 3 {
  const profile = OCCUPATION_CONTACT_MAP[occupationId] ?? OCCUPATION_CONTACT_MAP['_default']
  const isNatural = profile.natural_subcategories.includes(subcategoryId)
  const isPOW80 = (character['POW'] ?? 0) >= 80

  // POW 80+ → siła 3 dla okultyzmu
  const sub = findSubcategory(subcategoryId)
  if (isPOW80 && sub?.category_id === 'OKULTYZM') return 3

  if (!isNatural) return 1

  switch (profile.type) {
    case 'sieciowy': return 3
    case 'izolowany': return 3
    case 'przeciętny': return 2
  }
}

// ── Modyfikatory siły ──

export function applyStrengthModifiers(
  baseStrength: number,
  subcategoryId: string,
  occupationId: string,
  character: Record<string, number>,
): 1 | 2 | 3 {
  let strength = baseStrength
  const sub = findSubcategory(subcategoryId)
  if (!sub) return strength as 1 | 2 | 3

  const profile = OCCUPATION_CONTACT_MAP[occupationId] ?? OCCUPATION_CONTACT_MAP['_default']
  const isNatural = profile.natural_subcategories.includes(subcategoryId)

  const maxSocial = Math.max(character['urok_osobisty'] ?? 0, character['gadanina'] ?? 0)

  // +1 jeśli max social 60+ i naturalna kategoria
  if (maxSocial >= 60 && isNatural) strength += 1

  // +1 Majętność 60+ → Prawnicy/Biznes
  if ((character['majetnosc'] ?? 0) >= 60 && sub.category_id === 'PRAWNICY_BIZNES') strength += 1

  // +1 Wiek 50+ i naturalna kategoria
  if ((character['wiek'] ?? 0) >= 50 && isNatural) strength += 1

  return Math.max(1, Math.min(3, strength)) as 1 | 2 | 3
}

// ── Synergia ──

export function applySynergyContacts(contacts: ContactV2[]): ContactV2[] {
  const countByCategory: Record<string, number> = {}
  for (const c of contacts) {
    if (c.category_id) countByCategory[c.category_id] = (countByCategory[c.category_id] ?? 0) + 1
  }

  return contacts.map((c) => {
    const count = countByCategory[c.category_id] ?? 1
    const synBonus = (count >= 3 ? 2 : count === 2 ? 1 : 0) as 0 | 1 | 2
    const finalStrength = Math.min(3, c.base_strength + synBonus) as 1 | 2 | 3
    return {
      ...c,
      synergy_bonus: synBonus,
      strength: finalStrength,
      roll_value: (finalStrength * 30) as 30 | 60 | 90,
    }
  })
}

// ── Synergia preview ──

export function getSynergyPreview(
  categoryId: string,
  existingContacts: ContactV2[],
): string | null {
  const sameCategory = existingContacts.filter((c) => c.category_id === categoryId)
  if (sameCategory.length === 0) return null
  if (sameCategory.length === 1) {
    return `+ ${sameCategory[0].subcategory_name} → obie ◆◆◆ 90%`
  }
  if (sameCategory.length === 2) {
    return `Trzy kontakty z tej kategorii → wszystkie ◆◆◆ 90%`
  }
  return null
}

// ── Generowanie 3 propozycji per slot ──

export function generateContactOptions(
  slotIndex: number,
  occupationId: string,
  character: Record<string, number>,
  existingContactIds: string[],
): ContactSubcategoryData[] {
  const profile = OCCUPATION_CONTACT_MAP[occupationId] ?? OCCUPATION_CONTACT_MAP['_default']
  const occSlots = countOccupationContactSlots(occupationId)

  const natural = profile.natural_subcategories
    .map((id) => findSubcategory(id))
    .filter((s): s is ContactSubcategoryData => s !== null)
    .filter((s) => !existingContactIds.includes(s.id))

  const wild = getAllSubcategories()
    .filter((s) => !profile.natural_subcategories.includes(s.id))
    .filter((s) => !existingContactIds.includes(s.id))

  // Occupation slots: natural first. Additional slots: bonus + wild.
  const pool = slotIndex < occSlots
    ? [...natural, ...wild]
    : [...getBonusSubcategories(character).filter((s) => !existingContactIds.includes(s.id)), ...wild]

  // 3 z różnych kategorii
  const result: ContactSubcategoryData[] = []
  const usedCategories = new Set<string>()

  for (const sub of pool) {
    if (result.length >= 3) break
    if (usedCategories.has(sub.category_id)) continue
    result.push(sub)
    usedCategories.add(sub.category_id)
  }

  for (const sub of pool) {
    if (result.length >= 3) break
    if (!result.find((r) => r.id === sub.id)) result.push(sub)
  }

  return result
}

// ── Podkategorie odblokowane przez umiejętności/cechy ──

function getBonusSubcategories(character: Record<string, number>): ContactSubcategoryData[] {
  const bonus: string[] = []

  if ((character['okultyzm'] ?? 0) >= 40 || (character['POW'] ?? 0) >= 70)
    bonus.push('loze_ezoteryczne', 'spirytysci_media', 'handlarze_ksieg')
  if ((character['medycyna'] ?? 0) >= 50)
    bonus.push('lekarze_chirurdzy', 'patolodzy', 'farmaceuci')
  if ((character['historia'] ?? 0) >= 50 || (character['archeologia'] ?? 0) >= 50)
    bonus.push('profesorowie', 'archiwisci', 'muzea_kolekcje')
  if ((character['walka_wrecz:bijatyka'] ?? 0) >= 60)
    bonus.push('gangi_uliczne', 'hazard')
  if ((character['prawo'] ?? 0) >= 50)
    bonus.push('prawnicy_notariusze', 'sedziowie_prokuratorzy')
  if ((character['wiek'] ?? 0) >= 45)
    bonus.push('weterani', 'stowarzyszenia_bractwa')
  if ((character['majetnosc'] ?? 0) >= 50)
    bonus.push('bankierzy', 'ekskluzywne_kluby')

  return bonus
    .map((id) => findSubcategory(id))
    .filter((s): s is ContactSubcategoryData => s !== null)
}

// ── Domyślna siła dla "Własne" z kategorią ──

export const CUSTOM_CATEGORY_DEFAULT_STRENGTH: Record<string, 1 | 2 | 3> = {
  ORGANY_SCIGANIA: 2,
  POLSWIATEK: 2,
  AKADEMIA: 2,
  MEDYCY: 2,
  PRASA_MEDIA: 2,
  PRAWNICY_BIZNES: 2,
  KREGGI_TOWARZYSKIE: 1,
  WOJSKO_WETERANI: 2,
  OKULTYZM: 1,
  ZIEMIANSTWO_WIES: 1,
}

// ── Legacy exports for backward compatibility ──
export { ISOLATED_OCCUPATIONS } from '@/data/contactSubcategories'

// Re-export old functions that StepPositionsContacts might still reference
export { calculateContactStrength, calculateContactRollValue } from '@/utils/contactCalculatorLegacy'
