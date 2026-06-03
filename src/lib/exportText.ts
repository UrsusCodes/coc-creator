import { CHARACTERISTIC_MAP } from '@/data/characteristics'
import { getOccupationById } from '@/data/occupations'
import { getSkillDisplayName, getSkillBase } from '@/data/skills'
import { ERA_LABELS, METHOD_LABELS, type CharacteristicKey, type Era } from '@/types/common'
import { halfValue, fifthValue } from '@/lib/utils'
import { formatSpendingLevel } from '@/lib/spendingLevel'

const CHAR_KEYS: CharacteristicKey[] = ['STR', 'CON', 'SIZ', 'DEX', 'APP', 'INT', 'POW', 'EDU']

interface ExportCharacter {
  name: string
  age: number
  gender: string
  appearance: string
  characteristics: Record<string, number>
  luck: number
  derived: Record<string, unknown>
  occupation_id: string
  occupation_skill_points: Record<string, number>
  personal_skill_points: Record<string, number>
  backstory: Record<string, unknown>
  equipment: string[]
  cash: string
  assets: string
  spending_level: string
  era: string
  method: string
  player_name?: string
  invite_code?: string
}

export function exportCharacterAsText(char: ExportCharacter): string {
  const lines: string[] = []
  const occupation = getOccupationById(char.occupation_id)
  const derived = char.derived as { hp: number; mp: number; san: number; db: string; build: number; move_rate: number; dodge: number }

  lines.push('═══════════════════════════════════════════')
  lines.push('       KARTA BADACZA — Zew Cthulhu 7e')
  lines.push('═══════════════════════════════════════════')
  lines.push('')

  // Basic info
  if (char.player_name) lines.push(`Gracz: ${char.player_name}`)
  if (char.invite_code) lines.push(`Kod zaproszenia: ${char.invite_code}`)
  lines.push(`Imię i nazwisko: ${char.name}`)
  lines.push(`Wiek: ${char.age}    Płeć: ${char.gender}`)
  lines.push(`Zawód: ${occupation?.name ?? char.occupation_id}`)
  lines.push(`Era: ${ERA_LABELS[char.era as keyof typeof ERA_LABELS] ?? char.era}`)
  lines.push(`Metoda: ${METHOD_LABELS[char.method as keyof typeof METHOD_LABELS] ?? char.method}`)
  if (char.appearance) lines.push(`Wygląd: ${char.appearance}`)
  lines.push('')

  // Characteristics
  lines.push('───── CECHY ─────')
  for (const key of CHAR_KEYS) {
    const val = char.characteristics[key] ?? 0
    const def = CHARACTERISTIC_MAP[key]
    lines.push(
      `${def.abbreviation.padEnd(4)} ${String(val).padStart(3)}   (½: ${halfValue(val)}, ⅕: ${fifthValue(val)})`
    )
  }
  lines.push('')

  // Derived
  lines.push('───── ATRYBUTY POCHODNE ─────')
  if (derived) {
    lines.push(`PW: ${derived.hp}    PM: ${derived.mp}    PP: ${derived.san}    Szczęście: ${char.luck}`)
    lines.push(`PO: ${derived.db}    Krzepa: ${derived.build}    Ruch: ${derived.move_rate}    Unik: ${derived.dodge}`)
  }
  lines.push('')

  // Skills
  lines.push('───── UMIEJĘTNOŚCI ─────')
  const allSkillPoints: Record<string, number> = { ...char.occupation_skill_points }
  for (const [id, pts] of Object.entries(char.personal_skill_points)) {
    allSkillPoints[id] = (allSkillPoints[id] ?? 0) + pts
  }

  const getBase = (skillId: string) => {
    const base = getSkillBase(skillId, char.era as Era)
    if (base === 'half_dex') return Math.floor((char.characteristics['DEX'] ?? 0) / 2)
    if (base === 'edu') return char.characteristics['EDU'] ?? 0
    return base
  }

  const skillEntries = Object.entries(allSkillPoints)
    .filter(([, pts]) => pts > 0)
    .sort(([a], [b]) => getSkillDisplayName(a).localeCompare(getSkillDisplayName(b), 'pl'))

  for (const [skillId, pts] of skillEntries) {
    const base = getBase(skillId)
    const total = base + pts
    const name = getSkillDisplayName(skillId)
    lines.push(`${name.padEnd(30)} ${String(total).padStart(3)}%  (baza: ${base}, +${pts})`)
  }
  lines.push('')

  // Backstory
  const backstoryLabels: Record<string, string> = {
    ideology: 'Ideologia / Przekonania',
    significant_people_who: 'Ważne osoby — Kto',
    significant_people_why: 'Ważne osoby — Dlaczego',
    meaningful_locations: 'Znaczące miejsca',
    treasured_possessions: 'Rzeczy osobiste',
    traits: 'Przymioty',
    appearance_description: 'Opis postaci',
    key_connection: 'Kluczowa więź',
  }

  const backstoryEntries = Object.entries(char.backstory).filter(([, v]) => v && typeof v === 'string')
  if (backstoryEntries.length > 0) {
    lines.push('───── HISTORIA POSTACI ─────')
    for (const [key, value] of backstoryEntries) {
      lines.push(`${backstoryLabels[key] ?? key}:`)
      lines.push(`  ${value}`)
      lines.push('')
    }
  }

  // Drive+Pillars variant
  const pillars = char.backstory.pillars as string[] | undefined
  const sources = char.backstory.sources as { name: string; category: string; description: string }[] | undefined
  if (pillars && pillars.length > 0) {
    lines.push('Filary Poczytalności:')
    for (const p of pillars) lines.push(`  • ${p}`)
    lines.push('')
  }
  if (sources && sources.length > 0) {
    lines.push('Źródła Stabilności:')
    for (const s of sources) lines.push(`  • ${s.name} (${s.category}) — ${s.description}`)
    lines.push('')
  }

  // Equipment
  if (char.equipment.length > 0) {
    lines.push('───── EKWIPUNEK ─────')
    if (char.spending_level) lines.push(`Poziom życia: ${formatSpendingLevel(char.spending_level, char.equipment ?? [])}`)
    if (char.cash) lines.push(`Gotówka: ${char.cash}`)
    if (char.assets) lines.push(`Dobytek: ${char.assets}`)
    lines.push('')
    for (const item of char.equipment) {
      lines.push(`• ${item}`)
    }
    lines.push('')
  }

  lines.push('═══════════════════════════════════════════')
  lines.push('Wygenerowano przez Kreator Badacza — Zew Cthulhu 7e')

  return lines.join('\n')
}
