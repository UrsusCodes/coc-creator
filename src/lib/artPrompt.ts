import { OCCUPATIONS } from '@/data/occupations'

interface ArtPromptCharacter {
  name: string
  age: number
  gender: string
  appearance: string
  characteristics: Record<string, number>
  occupation_id: string
  era: string
  spending_level: string
  equipment: string[]
  backstory: Record<string, unknown>
}

const ERA_STYLE: Record<string, string> = {
  classic_1920s: '1920s clothing, art deco era, prohibition era America',
  modern: 'modern clothing, contemporary setting',
  gaslight: 'Victorian era clothing, gas lamps, 1890s',
}

function describeBody(chars: Record<string, number>): string {
  const str = chars.STR ?? 50
  const siz = chars.SIZ ?? 50
  const con = chars.CON ?? 50

  const parts: string[] = []

  if (siz >= 75 && str >= 70) parts.push('large, muscular build')
  else if (siz >= 75) parts.push('tall, large frame')
  else if (siz <= 35) parts.push('small, slight build')
  else if (str >= 75) parts.push('muscular, athletic build')
  else if (str <= 30 && siz <= 45) parts.push('thin, frail build')

  if (con >= 80) parts.push('robust and healthy')
  else if (con <= 30) parts.push('sickly appearance')

  return parts.join(', ')
}

function describeAppearance(app: number): string {
  if (app >= 80) return 'strikingly beautiful'
  if (app >= 70) return 'very attractive'
  if (app >= 60) return 'good-looking'
  if (app <= 25) return 'ugly, unsettling features'
  if (app <= 35) return 'plain, unremarkable face'
  return '' // average, skip
}

function describeAge(age: number): string {
  if (age <= 20) return 'young'
  if (age <= 30) return 'young adult'
  if (age <= 45) return 'middle-aged'
  if (age <= 60) return 'mature'
  return 'elderly'
}

function extractVisualEquipment(equipment: string[]): string[] {
  const visual: string[] = []
  for (const item of equipment) {
    if (item.startsWith('[Broń]') || item.startsWith('[Wojsko]')) {
      const name = item.replace(/^\[.*?\]\s*/, '').replace(/\s*\(\$[\d.,]+\)$/, '')
      visual.push(name)
    }
  }
  return visual.slice(0, 3) // max 3 props
}

export function generateArtPrompt(char: ArtPromptCharacter): string {
  const parts: string[] = []

  // Core subject
  const occupation = OCCUPATIONS.find((o) => o.id === char.occupation_id)
  const genderWord = char.gender === 'Kobieta' ? 'woman' : char.gender === 'Mężczyzna' ? 'man' : 'person'
  const ageDesc = describeAge(char.age)

  parts.push(`portrait of a ${ageDesc} ${genderWord}, ${char.age} years old`)

  if (occupation) {
    parts.push(`${occupation.name.toLowerCase()} by profession`)
  }

  // Physical description from appearance text
  const appearanceText = (char.backstory.appearance_description as string) || char.appearance
  if (appearanceText) {
    // Take first sentence or first 100 chars
    const firstPart = appearanceText.split(/[.!]/).filter(Boolean)[0]?.trim()
    if (firstPart && firstPart.length <= 120) {
      parts.push(firstPart)
    }
  }

  // Body type from characteristics
  const body = describeBody(char.characteristics)
  if (body) parts.push(body)

  // Attractiveness
  const appDesc = describeAppearance(char.characteristics.APP ?? 50)
  if (appDesc) parts.push(appDesc)

  // Backstory traits for visual cues
  const traits = char.backstory.traits as string | undefined
  if (traits && traits.length <= 80) {
    parts.push(traits)
  }

  // Visual equipment/props
  const props = extractVisualEquipment(char.equipment)
  if (props.length > 0) {
    parts.push(`holding/wearing: ${props.join(', ')}`)
  }

  // Era and style
  const eraStyle = ERA_STYLE[char.era] ?? ERA_STYLE.classic_1920s
  parts.push(eraStyle)

  // Style modifiers
  parts.push('detailed face, realistic, dramatic lighting, painterly style')

  return parts.filter(Boolean).join(', ')
}

export function generateNegativePrompt(): string {
  return 'blurry, deformed, extra limbs, extra fingers, bad anatomy, watermark, text, signature, low quality, cartoon, anime'
}

export function generateSDParams(): { width: number; height: number; steps: number; cfg: number } {
  return {
    width: 512,
    height: 768,
    steps: 30,
    cfg: 7,
  }
}

// ============================================================================
// PLAYER-SIDE PORTRAIT GENERATION (Gemini API, layered prompt)
// ----------------------------------------------------------------------------
// Spec: docs/CoCCreator_obsidian/specs/portrait_prompt_methodology.md
// Architecture: defaults → chip overrides → modification layer.
// Stats are NOT injected into prompts; they surface as UI hints only.
// ============================================================================

import { OCCUPATION_NAMES_EN } from '@/data/occupationNamesEn'

/** Final visual style applied post-Gemini via pixel transform. */
export type PortraitStyle = 'color' | 'faded' | 'sepia' | 'bw'

export const PORTRAIT_STYLE_LABELS: Record<PortraitStyle, string> = {
  color: 'kolor naturalny',
  faded: 'wyblakły',
  sepia: 'sepia',
  bw: 'czarno-białe',
}

/** Player-chosen clothing style chip. */
export type ClothingChip = 'niedbale' | 'codzienne' | 'eleganckie' | 'zawodowe'

export const CLOTHING_CHIP_LABELS: Record<ClothingChip, string> = {
  niedbale: 'Niedbałe',
  codzienne: 'Codzienne',
  eleganckie: 'Eleganckie',
  zawodowe: 'Zawodowe',
}

/** Player-chosen lighting chip. */
export type LightingChip = 'hollywood' | 'natural' | 'noir'

export const LIGHTING_CHIP_LABELS: Record<LightingChip, string> = {
  hollywood: 'Hollywood',
  natural: 'Naturalne',
  noir: 'Noir',
}

const LIGHTING_FRAGMENTS: Record<LightingChip, string> = {
  hollywood:
    'dramatic studio lighting, strong contrast, classic portrait photography lighting',
  natural: 'soft natural light, even illumination, gentle shadows',
  noir: 'chiaroscuro, harsh shadows, half the face in shadow, low-key lighting',
}

export interface BackgroundChipDef {
  id: string
  label: string // PL — for UI
  fragment: string // EN — for prompt
}

export const BACKGROUND_CHIPS: BackgroundChipDef[] = [
  {
    id: 'studio',
    label: 'Studio (jasne)',
    fragment: 'uniform bright blurred background, plain studio backdrop',
  },
  {
    id: 'biblioteka',
    label: 'Biblioteka',
    fragment: 'dimly lit library with rows of leather-bound books, blurred background',
  },
  {
    id: 'gabinet',
    label: 'Gabinet detektywa',
    fragment: '1920s detective office, wooden desk with case files, blurred background',
  },
  {
    id: 'uliczka',
    label: 'Mglista uliczka',
    fragment: 'misty city alleyway at night, gas lamps, blurred background',
  },
  {
    id: 'salon',
    label: 'Salon hotelowy',
    fragment:
      'art deco hotel lounge with armchairs and decorative wallpaper, blurred background',
  },
  {
    id: 'cmentarz',
    label: 'Cmentarz',
    fragment: 'old cemetery with weathered headstones and bare trees, blurred background',
  },
  {
    id: 'statek',
    label: 'Pokład statku',
    fragment: 'wooden deck of a steamship at sea, ropes and railings, blurred background',
  },
  {
    id: 'plener',
    label: 'Plener leśny',
    fragment: 'woodland clearing with tall trees and dappled light, blurred background',
  },
]

const DEFAULT_BACKGROUND_FRAGMENT = BACKGROUND_CHIPS[0].fragment

// ── Clothing matrix: gender × wealth-bucket × type (3 non-professional) ──
type WealthBucket = 'skromny' | 'zamozny'
type ClothingChipNonProf = Exclude<ClothingChip, 'zawodowe'>

const CLOTHING_MATRIX: Record<
  'M' | 'F',
  Record<WealthBucket, Record<ClothingChipNonProf, string>>
> = {
  M: {
    skromny: {
      niedbale: 'rumpled work shirt with rolled sleeves, suspenders, plain wool trousers',
      codzienne: 'plain shirt with worn vest, wool trousers, soft cap',
      eleganckie: 'modest two-piece wool suit with worn collar, plain narrow tie',
    },
    zamozny: {
      niedbale: 'open-collared dress shirt, casual blazer, comfortable flannel trousers',
      codzienne: 'tailored three-piece suit, silk tie, polished oxfords',
      eleganckie:
        'black formal dinner jacket, white bow tie, silk pocket square, cufflinks',
    },
  },
  F: {
    skromny: {
      niedbale:
        'simple cotton blouse, ankle-length plain skirt, headscarf or pinned-up hair',
      codzienne: 'modest belted day dress, low heels, plain wool coat',
      eleganckie: 'modest drop-waist evening dress in subdued color, simple shawl',
    },
    zamozny: {
      niedbale:
        'casual drop-waist day dress, soft cashmere cardigan, T-strap low pumps',
      codzienne: 'fashionable drop-waist dress, cloche hat, pearl strand necklace',
      eleganckie:
        'beaded silk evening gown, long satin gloves, feathered headpiece, art deco jewelry',
    },
  },
}

/** Wealth tier (A–F from wealth v2) → 2 buckets used by the matrix. */
function bucketFromWealth(spending_level: string | undefined): WealthBucket {
  const upper = (spending_level ?? '').trim().toUpperCase()
  return upper === 'A' || upper === 'B' || upper === 'C' ? 'zamozny' : 'skromny'
}

/** Default chip selected at panel-open time, derived from wealth tier. */
export function defaultClothingChip(spending_level: string | undefined): ClothingChip {
  const upper = (spending_level ?? '').trim().toUpperCase()
  if (upper === 'A' || upper === 'B') return 'eleganckie'
  if (upper === 'E' || upper === 'F') return 'niedbale'
  return 'codzienne' // C, D, or unknown
}

/** Normalise gender across wizard ('M'|'F') and legacy DB rows. */
function normaliseGender(gender: string | undefined): 'M' | 'F' {
  if (gender === 'M' || gender === 'Mężczyzna') return 'M'
  // 'F' | 'Kobieta' | unknown → 'F' as a stable fallback. The matrix is
  // meaningful for both M and F; defaulting to F for unknown matches the
  // fact that the wizard requires choosing one of the two.
  return 'F'
}

function genderToWord(gender: string | undefined): string {
  return normaliseGender(gender) === 'M' ? 'man' : 'woman'
}

function occupationNameEn(occupationId: string | undefined): string {
  if (!occupationId) return 'person'
  return OCCUPATION_NAMES_EN[occupationId] ?? occupationId.replace(/_/g, ' ')
}

// ── Field overrides (5 checkmark inputs) ──
export interface PortraitFieldOverrides {
  /** "Twarz" — appended as Face details modification */
  face?: string
  /** "Ciało" — appended as Body details modification */
  body?: string
  /** "Ubrania" — replaces the chip-driven clothing fragment */
  clothing?: string
  /** "Rekwizyty" — sets the visible-props fragment */
  props?: string
  /** "Tło" — replaces the chip-driven background fragment */
  background?: string
}

export interface BuildPortraitPromptInput {
  character: {
    age: number
    gender: string
    occupation_id: string
    appearance?: string
    spending_level?: string
    backstory?: { appearance_description?: string; [key: string]: unknown }
  }
  clothingChip: ClothingChip
  /** ID of one of BACKGROUND_CHIPS, or `'custom'` (use fields.background) */
  backgroundChipId: string
  lightingChip: LightingChip
  fields: PortraitFieldOverrides
  /** Optional small adjustments box ("no hat, slight smile") */
  korekty?: string
}

/**
 * Builds the layered Gemini prompt per spec:
 *   layer 0 — fixed era constants
 *   layer 1 — person from character
 *   layer 2 — chip-driven blocks (with overrides)
 *   layer 3 — modifications (face/body/korekty), only if any
 */
export function buildPlayerPortraitPrompt(input: BuildPortraitPromptInput): string {
  const { character, clothingChip, backgroundChipId, lightingChip, fields, korekty } =
    input

  // ── Layer 0 — fixed era constants ──
  const layer0 = [
    '1920s era photograph.',
    'Half-body portrait, framed tightly from upper chest up to top of head.',
    'Hands and any held props visible at the bottom edge of frame if applicable.',
    '3:4 aspect ratio (portrait orientation).',
    'Face fills approximately one third of the frame.',
    'Photorealistic.',
    'High detail on facial features.',
    'Heavily muted, faded vintage color palette — low saturation, washed-out tones, gentle tonal grading; color preserved (not sepia, not grayscale).',
    'No text, no watermarks, no captions, no borders.',
  ].join(' ')

  // ── Layer 1 — person from character ──
  const ageDesc = describeAge(character.age)
  const gWord = genderToWord(character.gender)
  const occupationEn = occupationNameEn(character.occupation_id)

  const personParts: string[] = [
    `${ageDesc} ${gWord}, ${character.age} years old.`,
    `${occupationEn} by profession.`,
  ]

  const apprText =
    (character.backstory?.appearance_description as string | undefined)?.trim() ||
    character.appearance?.trim() ||
    ''
  if (apprText) {
    // Keep a single line, trim trailing punctuation, then re-add.
    const cleaned = apprText.replace(/[.!?]+\s*$/, '')
    personParts.push(`${cleaned}.`)
  }

  const layer1 = personParts.join(' ')

  // ── Layer 2 — chip-driven blocks (with overrides) ──
  // Clothing
  let clothingFragment: string
  const overrideClothing = fields.clothing?.trim()
  if (overrideClothing) {
    clothingFragment = overrideClothing
  } else if (clothingChip === 'zawodowe') {
    clothingFragment = `clothing typical for a ${occupationEn} in 1920s`
  } else {
    const g = normaliseGender(character.gender)
    const bucket = bucketFromWealth(character.spending_level)
    clothingFragment = CLOTHING_MATRIX[g][bucket][clothingChip]
  }

  // Background
  let backgroundFragment: string
  const overrideBg = fields.background?.trim()
  if (overrideBg) {
    backgroundFragment = overrideBg
  } else {
    const chip = BACKGROUND_CHIPS.find((c) => c.id === backgroundChipId)
    backgroundFragment = chip?.fragment ?? DEFAULT_BACKGROUND_FRAGMENT
  }

  // Lighting
  const lightingFragment = LIGHTING_FRAGMENTS[lightingChip]

  // Props (independent — only present if override or Zawodowe chip)
  let propsFragment: string | null = null
  const overrideProps = fields.props?.trim()
  if (overrideProps) {
    propsFragment = overrideProps
  } else if (clothingChip === 'zawodowe') {
    propsFragment = `carrying tools or props typical for a ${occupationEn}`
  }

  const layer2Parts = [
    `Wearing: ${clothingFragment}.`,
    `Background: ${backgroundFragment}.`,
    `Lighting: ${lightingFragment}.`,
  ]
  if (propsFragment) layer2Parts.push(`Props: ${propsFragment}.`)
  const layer2 = layer2Parts.join(' ')

  // ── Layer 3 — modifications (optional) ──
  const mods: string[] = []
  const faceMod = fields.face?.trim()
  const bodyMod = fields.body?.trim()
  if (faceMod) mods.push(`Face details: ${faceMod}`)
  if (bodyMod) mods.push(`Body details: ${bodyMod}`)
  if (korekty?.trim()) {
    korekty
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((s) => mods.push(s))
  }

  const sections = [layer0, layer1, layer2]
  if (mods.length > 0) {
    sections.push(
      'Apply these modifications on top of the above:\n' +
        mods.map((m) => `- ${m}`).join('\n'),
    )
  }

  return sections.join('\n\n')
}

// ── Stat hints (UI only, NOT injected into prompt) ──
export interface PortraitStatHints {
  face?: string
  body?: string[]
  clothing?: string
  /** Always present — generic prompt to fill in props */
  props: string
}

export function buildStatHints(character: {
  characteristics?: Record<string, number>
  spending_level?: string
}): PortraitStatHints {
  const c = character.characteristics ?? {}
  const APP = c.APP ?? 50
  const STR = c.STR ?? 50
  const SIZ = c.SIZ ?? 50
  const CON = c.CON ?? 50

  const hints: PortraitStatHints = {
    props:
      'Brak auto-detekcji. Wpisz co postać widocznie trzyma lub nosi (broń, narzędzie, biżuteria).',
  }

  // Face — APP-driven
  if (APP <= 25)
    hints.face =
      'Bardzo niski wygląd. Prawdopodobnie odpychająca twarz, oszpecona lub o odstręczających rysach.'
  else if (APP <= 35)
    hints.face = 'Niski wygląd. Pospolita, niezbyt efektowna twarz.'
  else if (APP >= 80)
    hints.face = 'Bardzo wysoki wygląd. Uderzająco piękna lub urzekająca twarz.'
  else if (APP >= 70)
    hints.face = 'Wysoki wygląd. Atrakcyjne, wyraziste rysy.'

  // Body — SIZ × STR × CON, can stack 1–2 hints
  const bodyHints: string[] = []
  if (SIZ >= 75 && STR <= 40)
    bodyHints.push(
      'Wysoka i ciężka sylwetka, niska siła sugeruje otyłość lub miękkie ciało.',
    )
  else if (SIZ >= 75 && STR >= 70)
    bodyHints.push('Wysoka, masywna sylwetka, wyraźnie umięśniona.')
  else if (SIZ >= 75) bodyHints.push('Wysoki, postawny.')
  else if (SIZ <= 35) bodyHints.push('Niska, drobna budowa.')
  else if (STR >= 75) bodyHints.push('Średni wzrost, atletyczna sylwetka.')
  else if (STR <= 30 && SIZ <= 45) bodyHints.push('Drobna, słaba sylwetka.')

  if (CON <= 30)
    bodyHints.push('Słabe zdrowie. Wycieńczona, chudawa, niezdrowa cera.')
  else if (CON >= 80)
    bodyHints.push('Bardzo wysoka kondycja. Krzepka, zdrowo wyglądająca.')

  if (bodyHints.length > 0) hints.body = bodyHints

  // Clothing — wealth tier
  const sl = (character.spending_level ?? '').trim().toUpperCase()
  const slHints: Record<string, string> = {
    A: 'Bardzo zamożna postać. Może nosić luksusowe stroje z najlepszych materiałów.',
    B: 'Zamożna postać. Eleganckie, wysokiej jakości ubrania.',
    C: 'Średnia majętność. Solidne ubrania klasy mieszczańskiej.',
    D: 'Skromna majętność. Praktyczne, raczej proste ubrania.',
    E: 'Niska majętność. Zniszczone, wytarte rzeczy.',
    F: 'Bardzo biedna postać. Łachmany, używane lub łatane ubrania.',
  }
  if (slHints[sl]) hints.clothing = slHints[sl]

  return hints
}

// ── Free-text sanitiser (used by all 5 fields and Korekty box) ──
const FREE_TEXT_BLOCKLIST = /\b(nud|naked|nsfw|sex|porn|gore|erotic|fetish)\w*/i

export function sanitizePortraitFreeText(input: string, maxLen: number = 200): string {
  const collapsed = input.replace(/\s+/g, ' ').trim()
  if (collapsed.length === 0) return ''
  if (collapsed.length > maxLen) {
    throw new Error(`Tekst może mieć maksymalnie ${maxLen} znaków.`)
  }
  if (FREE_TEXT_BLOCKLIST.test(collapsed)) {
    throw new Error('Tekst zawiera niedozwolone słowa.')
  }
  return collapsed
}
