/**
 * Positions & Contacts System
 * System pozycji i kontaktów dla Zew Cthulhu
 * Era: Klasyczna (lata 20. XX wieku)
 */

// ── Position Categories ───────────────────────────────────────

export interface PositionCategory {
  id: string
  label: string
  examples: string[]
}

export const POSITION_CATEGORIES: PositionCategory[] = [
  {
    id: 'PRASA_I_MEDIA',
    label: 'Prasa i media',
    examples: ['Redakcja „New York Times"', 'Lokalna gazeta', 'Agencja prasowa', 'Stacja radiowa'],
  },
  {
    id: 'MEDYCYNA',
    label: 'Medycyna',
    examples: ['Szpital miejski', 'Klinika psychiatryczna', 'Prywatny gabinet', 'Laboratorium'],
  },
  {
    id: 'AKADEMIA',
    label: 'Akademia',
    examples: ['Uniwersytet Miskatonic', 'Biblioteka publiczna', 'Muzeum historii naturalnej', 'Instytut badawczy'],
  },
  {
    id: 'PRAWO_I_INSTYTUCJE',
    label: 'Prawo i instytucje',
    examples: ['Kancelaria prawna', 'Sąd okręgowy', 'Biuro prokuratora', 'Urząd miejski'],
  },
  {
    id: 'BIZNES_I_FINANSE',
    label: 'Biznes i finanse',
    examples: ['Bank', 'Firma handlowa', 'Giełda', 'Biuro ubezpieczeń'],
  },
  {
    id: 'KLUBY_I_STOWARZYSZENIA',
    label: 'Kluby i stowarzyszenia',
    examples: ['Klub dżentelmenów', 'Towarzystwo podróżnicze', 'Klub sportowy', 'Stowarzyszenie charytatywne'],
  },
  {
    id: 'KOSCIOL_I_ORGANIZACJE',
    label: 'Kościół i organizacje',
    examples: ['Parafia', 'Misja zagraniczna', 'Zakon', 'Organizacja charytatywna'],
  },
  {
    id: 'POLSWIATEK',
    label: 'Półświatek',
    examples: ['Szajka przemytników', 'Dom gry', 'Sieć paserów', 'Organizacja gangu'],
  },
  {
    id: 'WOJSKO_I_SLUZBY',
    label: 'Wojsko i służby',
    examples: ['Jednostka wojskowa', 'Baza marynarki', 'Biuro wywiadu', 'Straż przybrzeżna'],
  },
  {
    id: 'OKULTYZM',
    label: 'Okultyzm',
    examples: ['Salon spirytystyczny', 'Antykwariat okultystyczny', 'Tajne bractwo', 'Kolekcja prywatna'],
  },
]

// ── Contact Categories & Subcategories ────────────────────────

export interface ContactCategory {
  id: string
  label: string
}

export interface ContactSubcategory {
  id: string
  label: string
  categoryId: string
}

export const CONTACT_CATEGORIES: ContactCategory[] = [
  { id: 'PRAWO_I_SLUZBY', label: 'Prawo i służby' },
  { id: 'POLSWIATEK', label: 'Półświatek' },
  { id: 'AKADEMIA_I_WIEDZA', label: 'Akademia i wiedza' },
  { id: 'PRASA_I_MEDIA', label: 'Prasa i media' },
  { id: 'MEDYCYNA', label: 'Medycyna' },
  { id: 'WLADZA_I_BIZNES', label: 'Władza i biznes' },
  { id: 'TOWARZYSTWO_I_KLUBY', label: 'Towarzystwo i kluby' },
  { id: 'WOJSKO_I_WETERANI', label: 'Wojsko i weterani' },
  { id: 'OKULTYZM_I_TAJNE', label: 'Okultyzm i tajne' },
]

export const CONTACT_SUBCATEGORIES: ContactSubcategory[] = [
  // PRAWO_I_SLUZBY
  { id: 'policja_miejska', label: 'Policja miejska', categoryId: 'PRAWO_I_SLUZBY' },
  { id: 'detektywi_prywatni', label: 'Detektywi prywatni', categoryId: 'PRAWO_I_SLUZBY' },
  { id: 'prokuratura_i_sady', label: 'Prokuratura i sądy', categoryId: 'PRAWO_I_SLUZBY' },
  { id: 'sluzby_celne', label: 'Służby celne', categoryId: 'PRAWO_I_SLUZBY' },
  { id: 'sluzby_specjalne', label: 'Służby specjalne', categoryId: 'PRAWO_I_SLUZBY' },
  { id: 'straz_wiezienna', label: 'Straż więzienna', categoryId: 'PRAWO_I_SLUZBY' },

  // POLSWIATEK
  { id: 'gangi_uliczne', label: 'Gangi uliczne', categoryId: 'POLSWIATEK' },
  { id: 'przemytnicy', label: 'Przemytnicy', categoryId: 'POLSWIATEK' },
  { id: 'hazard_i_domy_gry', label: 'Hazard i domy gry', categoryId: 'POLSWIATEK' },
  { id: 'paserzy_i_czarny_rynek', label: 'Paserzy i czarny rynek', categoryId: 'POLSWIATEK' },
  { id: 'rozrywka_i_domy_schadzek', label: 'Rozrywka i domy schadzek', categoryId: 'POLSWIATEK' },
  { id: 'lichwiarze', label: 'Lichwiarze', categoryId: 'POLSWIATEK' },

  // AKADEMIA_I_WIEDZA
  { id: 'profesorowie', label: 'Profesorowie', categoryId: 'AKADEMIA_I_WIEDZA' },
  { id: 'archiwisci', label: 'Archiwiści', categoryId: 'AKADEMIA_I_WIEDZA' },
  { id: 'muzea_i_kolekcjonerzy', label: 'Muzea i kolekcjonerzy', categoryId: 'AKADEMIA_I_WIEDZA' },
  { id: 'instytuty_badawcze', label: 'Instytuty badawcze', categoryId: 'AKADEMIA_I_WIEDZA' },
  { id: 'towarzystwa_naukowe', label: 'Towarzystwa naukowe', categoryId: 'AKADEMIA_I_WIEDZA' },
  { id: 'eksperci_sadowi', label: 'Eksperci sądowi', categoryId: 'AKADEMIA_I_WIEDZA' },

  // PRASA_I_MEDIA
  { id: 'dziennikarze', label: 'Dziennikarze', categoryId: 'PRASA_I_MEDIA' },
  { id: 'wydawcy', label: 'Wydawcy', categoryId: 'PRASA_I_MEDIA' },
  { id: 'fotografowie_prasowi', label: 'Fotografowie prasowi', categoryId: 'PRASA_I_MEDIA' },
  { id: 'radio', label: 'Radio', categoryId: 'PRASA_I_MEDIA' },
  { id: 'plotkarze', label: 'Plotkarze', categoryId: 'PRASA_I_MEDIA' },

  // MEDYCYNA
  { id: 'lekarze', label: 'Lekarze', categoryId: 'MEDYCYNA' },
  { id: 'psychiatrzy', label: 'Psychiatrzy', categoryId: 'MEDYCYNA' },
  { id: 'patolodzy', label: 'Patolodzy', categoryId: 'MEDYCYNA' },
  { id: 'farmaceuci', label: 'Farmaceuci', categoryId: 'MEDYCYNA' },
  { id: 'personel_szpitalny', label: 'Personel szpitalny', categoryId: 'MEDYCYNA' },

  // WLADZA_I_BIZNES
  { id: 'politycy', label: 'Politycy', categoryId: 'WLADZA_I_BIZNES' },
  { id: 'bankierzy', label: 'Bankierzy', categoryId: 'WLADZA_I_BIZNES' },
  { id: 'przemyslowcy', label: 'Przemysłowcy', categoryId: 'WLADZA_I_BIZNES' },
  { id: 'prawnicy_i_notariusze', label: 'Prawnicy i notariusze', categoryId: 'WLADZA_I_BIZNES' },
  { id: 'wlasciciele_ziemscy', label: 'Właściciele ziemscy', categoryId: 'WLADZA_I_BIZNES' },
  { id: 'dyplomaci', label: 'Dyplomaci', categoryId: 'WLADZA_I_BIZNES' },

  // TOWARZYSTWO_I_KLUBY
  { id: 'kluby_dzentelmenow', label: 'Kluby dżentelmenów', categoryId: 'TOWARZYSTWO_I_KLUBY' },
  { id: 'loze_masonskie', label: 'Loże masońskie', categoryId: 'TOWARZYSTWO_I_KLUBY' },
  { id: 'towarzystwa_podroznicze', label: 'Towarzystwa podróżnicze', categoryId: 'TOWARZYSTWO_I_KLUBY' },
  { id: 'kluby_sportowe', label: 'Kluby sportowe', categoryId: 'TOWARZYSTWO_I_KLUBY' },
  { id: 'towarzystwa_literackie', label: 'Towarzystwa literackie', categoryId: 'TOWARZYSTWO_I_KLUBY' },
  { id: 'stowarzyszenia_charytatywne', label: 'Stowarzyszenia charytatywne', categoryId: 'TOWARZYSTWO_I_KLUBY' },

  // WOJSKO_I_WETERANI
  { id: 'oficerowie', label: 'Oficerowie', categoryId: 'WOJSKO_I_WETERANI' },
  { id: 'weterani', label: 'Weterani', categoryId: 'WOJSKO_I_WETERANI' },
  { id: 'jednostki_rezerwowe', label: 'Jednostki rezerwowe', categoryId: 'WOJSKO_I_WETERANI' },
  { id: 'dostawcy_wojskowi', label: 'Dostawcy wojskowi', categoryId: 'WOJSKO_I_WETERANI' },
  { id: 'marynarze', label: 'Marynarze', categoryId: 'WOJSKO_I_WETERANI' },
  { id: 'lotnictwo_wojskowe', label: 'Lotnictwo wojskowe', categoryId: 'WOJSKO_I_WETERANI' },

  // OKULTYZM_I_TAJNE
  { id: 'spirytysci', label: 'Spirytyści', categoryId: 'OKULTYZM_I_TAJNE' },
  { id: 'kolekcjonerzy_antykow', label: 'Kolekcjonerzy antyków', categoryId: 'OKULTYZM_I_TAJNE' },
  { id: 'tajne_bractwa', label: 'Tajne bractwa', categoryId: 'OKULTYZM_I_TAJNE' },
  { id: 'eksperci_folkloru', label: 'Eksperci folkloru', categoryId: 'OKULTYZM_I_TAJNE' },
  { id: 'handlarze_rzadkimi_ksiegami', label: 'Handlarze rzadkimi księgami', categoryId: 'OKULTYZM_I_TAJNE' },
]

// ── Category Base Values (for "Własne" option) ───────────────

export const POSITION_CATEGORY_BASE_WEIGHT: Record<string, number> = {
  PRASA_I_MEDIA: 1,
  MEDYCYNA: 2,
  AKADEMIA: 1,
  PRAWO_I_INSTYTUCJE: 2,
  BIZNES_I_FINANSE: 2,
  KLUBY_I_STOWARZYSZENIA: 1,
  KOSCIOL_I_ORGANIZACJE: 1,
  POLSWIATEK: 1,
  WOJSKO_I_SLUZBY: 2,
  OKULTYZM: 1,
}

export const CONTACT_CATEGORY_BASE_STRENGTH: Record<string, number> = {
  PRAWO_I_SLUZBY: 2,
  POLSWIATEK: 1,
  AKADEMIA_I_WIEDZA: 1,
  PRASA_I_MEDIA: 1,
  MEDYCYNA: 2,
  WLADZA_I_BIZNES: 2,
  TOWARZYSTWO_I_KLUBY: 1,
  WOJSKO_I_WETERANI: 2,
  OKULTYZM_I_TAJNE: 1,
}

// ── Job → Position Category Map ──────────────────────────────

export const JOB_POSITION_CATEGORY_MAP: Record<string, string[]> = {
  // Prawo i porządek
  detektyw_agencji: ['PRAWO_I_INSTYTUCJE', 'BIZNES_I_FINANSE'],
  detektyw_policyjny: ['PRAWO_I_INSTYTUCJE'],
  oficer_policji: ['PRAWO_I_INSTYTUCJE', 'WOJSKO_I_SLUZBY'],
  prawnik: ['PRAWO_I_INSTYTUCJE', 'BIZNES_I_FINANSE'],
  prywatny_detektyw: ['PRAWO_I_INSTYTUCJE', 'POLSWIATEK'],
  sedzia: ['PRAWO_I_INSTYTUCJE'],
  agent_federalny: ['PRAWO_I_INSTYTUCJE', 'WOJSKO_I_SLUZBY'],

  // Wojsko i służby
  oficer_wojskowy: ['WOJSKO_I_SLUZBY'],
  wojskowy_zolnierz: ['WOJSKO_I_SLUZBY'],
  szpieg: ['WOJSKO_I_SLUZBY', 'POLSWIATEK'],

  // Medycyna
  lekarz: ['MEDYCYNA'],
  psychiatra: ['MEDYCYNA', 'AKADEMIA'],
  farmaceuta: ['MEDYCYNA', 'BIZNES_I_FINANSE'],
  pielegniarka: ['MEDYCYNA'],
  salowy: ['MEDYCYNA'],

  // Nauka i edukacja
  naukowiec: ['AKADEMIA'],
  profesor: ['AKADEMIA', 'KLUBY_I_STOWARZYSZENIA'],
  archeolog: ['AKADEMIA', 'KLUBY_I_STOWARZYSZENIA'],
  bibliotekarz: ['AKADEMIA'],
  antykwariusz: ['AKADEMIA', 'BIZNES_I_FINANSE'],
  kustosz: ['AKADEMIA'],
  parapsycholog: ['AKADEMIA', 'OKULTYZM'],
  pracownik_naukowy: ['AKADEMIA'],
  laborant: ['AKADEMIA', 'MEDYCYNA'],

  // Sztuka i rozrywka
  artysta: ['PRASA_I_MEDIA', 'KLUBY_I_STOWARZYSZENIA'],
  dziennikarz: ['PRASA_I_MEDIA'],
  dziennikarz_sledczy: ['PRASA_I_MEDIA', 'PRAWO_I_INSTYTUCJE'],
  reporter: ['PRASA_I_MEDIA'],
  fotograf: ['PRASA_I_MEDIA'],
  pisarz: ['PRASA_I_MEDIA', 'KLUBY_I_STOWARZYSZENIA'],
  redaktor: ['PRASA_I_MEDIA'],
  muzyk: ['PRASA_I_MEDIA', 'KLUBY_I_STOWARZYSZENIA'],
  korespondent_zagraniczny: ['PRASA_I_MEDIA', 'WOJSKO_I_SLUZBY'],

  // Przestępczość
  gangster: ['POLSWIATEK'],
  przestepca: ['POLSWIATEK'],
  hazardzista: ['POLSWIATEK'],
  szmugler: ['POLSWIATEK', 'BIZNES_I_FINANSE'],
  kieszonkowiec: ['POLSWIATEK'],
  prostytutka: ['POLSWIATEK'],

  // Przyroda i podróże
  marynarz: ['WOJSKO_I_SLUZBY', 'POLSWIATEK'],
  pilot: ['WOJSKO_I_SLUZBY', 'BIZNES_I_FINANSE'],
  odkrywca: ['KLUBY_I_STOWARZYSZENIA', 'AKADEMIA'],

  // Handel i usługi
  bogaty_hobbysta: ['KLUBY_I_STOWARZYSZENIA', 'BIZNES_I_FINANSE'],
  dzentelmen_dama: ['KLUBY_I_STOWARZYSZENIA', 'BIZNES_I_FINANSE'],
  sklepikarz: ['BIZNES_I_FINANSE'],
  komiwojazer: ['BIZNES_I_FINANSE'],
  polityk: ['PRAWO_I_INSTYTUCJE', 'BIZNES_I_FINANSE'],
  dyplomata: ['PRAWO_I_INSTYTUCJE', 'KLUBY_I_STOWARZYSZENIA'],

  // Administracja
  ksiegowy: ['BIZNES_I_FINANSE'],
  funkcjonariusz_publiczny: ['PRAWO_I_INSTYTUCJE'],

  // Religia i okultyzm
  duchowny: ['KOSCIOL_I_ORGANIZACJE'],
  misjonarz: ['KOSCIOL_I_ORGANIZACJE', 'AKADEMIA'],
  okultysta: ['OKULTYZM'],
  przywodca_kultu: ['OKULTYZM', 'KOSCIOL_I_ORGANIZACJE'],
  medium: ['OKULTYZM'],
  deprogramator: ['KOSCIOL_I_ORGANIZACJE', 'PRAWO_I_INSTYTUCJE'],

  // Sport i czyn
  inzynier: ['BIZNES_I_FINANSE', 'AKADEMIA'],

  // Fallback
  default: ['KLUBY_I_STOWARZYSZENIA'],
}

// ── Job → Contact Subcategory Map ────────────────────────────

export const JOB_CONTACT_MAP: Record<string, string[]> = {
  // Prawo i porządek
  detektyw_agencji: ['Detektywi prywatni', 'Policja miejska'],
  detektyw_policyjny: ['Policja miejska', 'Prokuratura i sądy'],
  oficer_policji: ['Policja miejska', 'Prokuratura i sądy', 'Straż więzienna'],
  prawnik: ['Prawnicy i notariusze', 'Prokuratura i sądy'],
  prywatny_detektyw: ['Detektywi prywatni', 'Policja miejska', 'Plotkarze'],
  sedzia: ['Prokuratura i sądy', 'Prawnicy i notariusze'],
  agent_federalny: ['Służby specjalne', 'Policja miejska'],

  // Wojsko i służby
  oficer_wojskowy: ['Oficerowie', 'Weterani'],
  wojskowy_zolnierz: ['Weterani', 'Jednostki rezerwowe'],
  szpieg: ['Służby specjalne', 'Przemytnicy'],

  // Medycyna
  lekarz: ['Lekarze', 'Personel szpitalny'],
  psychiatra: ['Psychiatrzy', 'Lekarze', 'Profesorowie'],
  farmaceuta: ['Farmaceuci', 'Lekarze'],
  pielegniarka: ['Personel szpitalny', 'Lekarze'],
  salowy: ['Personel szpitalny'],

  // Nauka i edukacja
  naukowiec: ['Profesorowie', 'Instytuty badawcze', 'Towarzystwa naukowe'],
  profesor: ['Profesorowie', 'Towarzystwa naukowe', 'Archiwiści'],
  archeolog: ['Muzea i kolekcjonerzy', 'Profesorowie', 'Towarzystwa podróżnicze'],
  bibliotekarz: ['Archiwiści', 'Profesorowie'],
  antykwariusz: ['Muzea i kolekcjonerzy', 'Kolekcjonerzy antyków', 'Handlarze rzadkimi księgami'],
  kustosz: ['Muzea i kolekcjonerzy', 'Archiwiści'],
  parapsycholog: ['Spirytyści', 'Profesorowie', 'Eksperci folkloru'],
  pracownik_naukowy: ['Instytuty badawcze', 'Profesorowie'],
  laborant: ['Instytuty badawcze', 'Personel szpitalny'],

  // Sztuka i rozrywka
  artysta: ['Wydawcy', 'Towarzystwa literackie'],
  dziennikarz: ['Dziennikarze', 'Wydawcy', 'Plotkarze'],
  dziennikarz_sledczy: ['Dziennikarze', 'Policja miejska', 'Plotkarze'],
  reporter: ['Dziennikarze', 'Fotografowie prasowi', 'Radio'],
  fotograf: ['Fotografowie prasowi', 'Dziennikarze'],
  pisarz: ['Wydawcy', 'Towarzystwa literackie', 'Dziennikarze'],
  redaktor: ['Wydawcy', 'Dziennikarze'],
  muzyk: ['Kluby dżentelmenów', 'Plotkarze'],
  korespondent_zagraniczny: ['Dziennikarze', 'Dyplomaci'],

  // Przestępczość
  gangster: ['Gangi uliczne', 'Paserzy i czarny rynek', 'Lichwiarze'],
  przestepca: ['Gangi uliczne', 'Paserzy i czarny rynek'],
  hazardzista: ['Hazard i domy gry', 'Lichwiarze'],
  szmugler: ['Przemytnicy', 'Paserzy i czarny rynek', 'Służby celne'],
  kieszonkowiec: ['Gangi uliczne', 'Paserzy i czarny rynek'],
  prostytutka: ['Rozrywka i domy schadzek', 'Plotkarze'],

  // Przyroda i podróże
  marynarz: ['Weterani', 'Przemytnicy'],
  pilot: ['Oficerowie', 'Dostawcy wojskowi'],
  odkrywca: ['Towarzystwa podróżnicze', 'Muzea i kolekcjonerzy'],

  // Handel i usługi
  bogaty_hobbysta: ['Kluby dżentelmenów', 'Bankierzy'],
  dzentelmen_dama: ['Kluby dżentelmenów', 'Politycy'],
  sklepikarz: ['Bankierzy', 'Przemysłowcy'],
  komiwojazer: ['Przemysłowcy', 'Bankierzy'],
  polityk: ['Politycy', 'Bankierzy', 'Dziennikarze'],
  dyplomata: ['Dyplomaci', 'Politycy'],

  // Administracja
  ksiegowy: ['Bankierzy', 'Prawnicy i notariusze'],
  funkcjonariusz_publiczny: ['Politycy', 'Prawnicy i notariusze'],

  // Religia i okultyzm
  duchowny: ['Stowarzyszenia charytatywne', 'Towarzystwa literackie'],
  misjonarz: ['Stowarzyszenia charytatywne', 'Towarzystwa podróżnicze'],
  okultysta: ['Spirytyści', 'Tajne bractwa', 'Handlarze rzadkimi księgami'],
  przywodca_kultu: ['Tajne bractwa', 'Spirytyści'],
  medium: ['Spirytyści', 'Plotkarze'],
  deprogramator: ['Eksperci folkloru', 'Psychiatrzy'],

  // Technika
  inzynier: ['Instytuty badawcze', 'Przemysłowcy'],

  // Fallback
  default: ['Plotkarze', 'Kluby sportowe'],
}

// ── Weight & Strength Calculation ─────────────────────────────

/**
 * Calculate position weights for 5 slots.
 * Higher occupational points, wealth, charm, and age yield stronger positions.
 * Returns array of 5 weights (each 1–3).
 */
export function calcPositionWeights(
  occupationalPoints: number,
  majetnosc: number,
  maxUrokPerswazja: number,
  age: number,
): number[] {
  // Base budget from occupation skill points (range ~100–400 → normalized 0–1)
  const occNorm = Math.min(1, Math.max(0, (occupationalPoints - 100) / 300))
  // Wealth factor
  const wealthNorm = Math.min(1, majetnosc / 80)
  // Charm factor
  const charmNorm = Math.min(1, maxUrokPerswazja / 90)
  // Age factor — more experience means better positions
  const ageNorm = Math.min(1, Math.max(0, (age - 18) / 50))

  const composite = occNorm * 0.35 + wealthNorm * 0.30 + charmNorm * 0.15 + ageNorm * 0.20

  // Distribute across 5 slots: first slots get more weight
  const slotMultipliers = [1.0, 0.85, 0.70, 0.55, 0.40]
  return slotMultipliers.map((mult) => {
    const raw = composite * mult * 3
    return Math.max(1, Math.min(3, Math.round(raw)))
  })
}

/**
 * Calculate contact base strength for a given subcategory.
 * Returns value 1–3.
 */
export function calcContactStrength(
  subcategoryLabel: string,
  categoryId: string,
  jobId: string,
  character: {
    majetnosc: number
    moc: number
    maxGadaninaUrok: number
    age: number
    isIsolated: boolean
  },
): number {
  let score = 0

  // Job affinity bonus
  const jobContacts = JOB_CONTACT_MAP[jobId] ?? JOB_CONTACT_MAP['default']
  if (jobContacts.includes(subcategoryLabel)) {
    score += 1.2
  }

  // Category base value
  const catBase = CONTACT_CATEGORY_BASE_STRENGTH[categoryId] ?? 1
  score += catBase * 0.4

  // Wealth influence
  score += Math.min(0.6, character.majetnosc / 100)

  // Personal power (MOC) factor
  score += Math.min(0.4, character.moc / 200)

  // Charm factor
  score += Math.min(0.5, character.maxGadaninaUrok / 150)

  // Age — older = more contacts
  score += Math.min(0.3, (character.age - 18) / 150)

  // Isolation penalty
  if (character.isIsolated) {
    score *= 0.5
  }

  return Math.max(1, Math.min(3, Math.round(score)))
}

/**
 * Calculate contact roll value (percentile for checks).
 * Combines strength with personal charm.
 */
export function calcContactRoll(strength: number, maxUrokPerswazja: number): number {
  const base = strength * 15
  const charm = Math.min(20, maxUrokPerswazja * 0.25)
  return Math.min(90, Math.max(10, Math.round(base + charm)))
}

// ── Synergy ───────────────────────────────────────────────────

export interface ContactEntry {
  subcategoryLabel: string
  categoryId: string
  baseStrength: number
}

export interface SynergyResult {
  strength: number
  synBonus: number
}

/**
 * Apply synergy bonuses to selected contacts.
 * Contacts in the same category reinforce each other.
 */
export function applySynergy(
  contacts: ContactEntry[],
): SynergyResult[] {
  // Count contacts per category
  const catCount: Record<string, number> = {}
  for (const c of contacts) {
    catCount[c.categoryId] = (catCount[c.categoryId] ?? 0) + 1
  }

  return contacts.map((c) => {
    const count = catCount[c.categoryId] ?? 1
    // Synergy: +1 if 2+ contacts in same category, +2 if 3+
    const synBonus = count >= 3 ? 2 : count >= 2 ? 1 : 0
    const strength = Math.min(3, c.baseStrength + synBonus)
    return { strength, synBonus }
  })
}

// ── Option Generation ─────────────────────────────────────────

/**
 * Generate 3 position options for a given slot.
 * Prioritizes job-related categories, avoids already-used ones.
 */
export function generatePositionOptions(
  slotIndex: number,
  jobId: string,
  weight: number,
  usedCategories: string[],
): { description: string; category: string; weight: number }[] {
  const jobCategories = JOB_POSITION_CATEGORY_MAP[jobId] ?? JOB_POSITION_CATEGORY_MAP['default']
  const available = POSITION_CATEGORIES.filter((c) => !usedCategories.includes(c.id))

  const options: { description: string; category: string; weight: number }[] = []

  // Option 1: job-related category (if available)
  const jobRelated = available.filter((c) => jobCategories.includes(c.id))
  if (jobRelated.length > 0) {
    const cat = jobRelated[slotIndex % jobRelated.length]
    const example = cat.examples[slotIndex % cat.examples.length]
    options.push({ description: example, category: cat.id, weight })
  }

  // Option 2: another category with slightly lower weight
  const remaining = available.filter((c) => !options.some((o) => o.category === c.id))
  if (remaining.length > 0) {
    const cat = remaining[(slotIndex + 1) % remaining.length]
    const example = cat.examples[(slotIndex + 1) % cat.examples.length]
    options.push({ description: example, category: cat.id, weight: Math.max(1, weight - 1) })
  }

  // Option 3: "Własne" — player chooses any category
  if (remaining.length > 1) {
    const cat = remaining[(slotIndex + 2) % remaining.length]
    const baseWeight = POSITION_CATEGORY_BASE_WEIGHT[cat.id] ?? 1
    options.push({ description: `Własne: ${cat.label}`, category: cat.id, weight: baseWeight })
  }

  // Ensure at least 3 options
  while (options.length < 3) {
    const fallback = POSITION_CATEGORIES[options.length % POSITION_CATEGORIES.length]
    options.push({
      description: fallback.examples[0],
      category: fallback.id,
      weight: 1,
    })
  }

  return options.slice(0, 3)
}

/**
 * Generate 3 contact options for a given slot.
 * Prioritizes job-related subcategories, avoids duplicates.
 */
export function generateContactOptions(
  slotIndex: number,
  jobId: string,
  character: {
    majetnosc: number
    moc: number
    maxGadaninaUrok: number
    age: number
    isIsolated: boolean
  },
  usedSubcategories: string[],
): { subcategory: string; categoryId: string; strength: number }[] {
  const jobContacts = JOB_CONTACT_MAP[jobId] ?? JOB_CONTACT_MAP['default']
  const available = CONTACT_SUBCATEGORIES.filter((s) => !usedSubcategories.includes(s.label))

  const options: { subcategory: string; categoryId: string; strength: number }[] = []

  // Option 1: job-related subcategory
  const jobRelated = available.filter((s) => jobContacts.includes(s.label))
  if (jobRelated.length > 0) {
    const sub = jobRelated[slotIndex % jobRelated.length]
    const str = calcContactStrength(sub.label, sub.categoryId, jobId, character)
    options.push({ subcategory: sub.label, categoryId: sub.categoryId, strength: str })
  }

  // Option 2: same category, different subcategory
  if (options.length > 0) {
    const sameCat = available.filter(
      (s) => s.categoryId === options[0].categoryId && !options.some((o) => o.subcategory === s.label),
    )
    if (sameCat.length > 0) {
      const sub = sameCat[(slotIndex + 1) % sameCat.length]
      const str = calcContactStrength(sub.label, sub.categoryId, jobId, character)
      options.push({ subcategory: sub.label, categoryId: sub.categoryId, strength: str })
    }
  }

  // Option 3: different category
  const otherCat = available.filter(
    (s) => !options.some((o) => o.categoryId === s.categoryId),
  )
  if (otherCat.length > 0) {
    const sub = otherCat[(slotIndex + 2) % otherCat.length]
    const str = calcContactStrength(sub.label, sub.categoryId, jobId, character)
    options.push({ subcategory: sub.label, categoryId: sub.categoryId, strength: str })
  }

  // Ensure at least 3 options
  while (options.length < 3) {
    const fallbackIdx = (slotIndex + options.length) % available.length
    if (available.length > 0) {
      const sub = available[fallbackIdx]
      const str = calcContactStrength(sub.label, sub.categoryId, jobId, character)
      options.push({ subcategory: sub.label, categoryId: sub.categoryId, strength: str })
    } else {
      const sub = CONTACT_SUBCATEGORIES[options.length % CONTACT_SUBCATEGORIES.length]
      options.push({ subcategory: sub.label, categoryId: sub.categoryId, strength: 1 })
    }
  }

  // Deduplicate: replace duplicate subcategories with next available
  const seen = new Set<string>()
  for (let i = 0; i < options.length; i++) {
    if (seen.has(options[i].subcategory)) {
      const replacement = available.find(
        (s) => !seen.has(s.label) && !options.some((o) => o.subcategory === s.label),
      )
      if (replacement) {
        const str = calcContactStrength(replacement.label, replacement.categoryId, jobId, character)
        options[i] = { subcategory: replacement.label, categoryId: replacement.categoryId, strength: str }
      }
    }
    seen.add(options[i].subcategory)
  }

  return options.slice(0, 3)
}

// ── Display Helpers ───────────────────────────────────────────

/**
 * Render weight as star string.
 * 3 → "★★★", 2 → "★★", 1 → "★"
 */
export function weightStars(w: number): string {
  const clamped = Math.max(1, Math.min(3, w))
  return '★'.repeat(clamped)
}

/**
 * Render strength as diamond string with empty slots.
 * 3 → "◆◆◆", 2 → "◆◆░", 1 → "◆░░"
 */
export function strengthDiamonds(s: number): string {
  const clamped = Math.max(1, Math.min(3, s))
  return '◆'.repeat(clamped) + '░'.repeat(3 - clamped)
}
