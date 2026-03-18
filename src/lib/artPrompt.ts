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
