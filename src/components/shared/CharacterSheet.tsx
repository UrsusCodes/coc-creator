import { getSkillDisplayName, getSkillBase } from '@/data/skills'
import { CHARACTERISTIC_MAP } from '@/data/characteristics'
import { OCCUPATIONS } from '@/data/occupations'
import { DRIVES } from '@/data/drivePillars'
import { ERA_LABELS, METHOD_LABELS, type CharacteristicKey } from '@/types/common'
import { halfValue, fifthValue } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import type { StabilitySource } from '@/types/character'

const CHAR_KEYS: CharacteristicKey[] = ['STR', 'CON', 'SIZ', 'DEX', 'APP', 'INT', 'POW', 'EDU']

const BACKSTORY_LABELS: Record<string, string> = {
  ideology: 'Ideologia / Przekonania',
  significant_people_who: 'Ważne osoby — Kto',
  significant_people_why: 'Ważne osoby — Dlaczego',
  meaningful_locations: 'Znaczące miejsca',
  treasured_possessions: 'Rzeczy osobiste',
  traits: 'Przymioty',
  appearance_description: 'Opis postaci',
  key_connection: 'Kluczowa więź',
}

export interface CharacterSheetData {
  id: string
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
  status: string
  player_name?: string
  invite_code?: string
  admin_notes?: string
}

interface CharacterSheetProps {
  character: CharacterSheetData
}

export function CharacterSheet({ character: char }: CharacterSheetProps) {
  const occupation = OCCUPATIONS.find((o) => o.id === char.occupation_id)
  const derived = char.derived as { hp: number; mp: number; san: number; db: string; build: number; move_rate: number; dodge: number }

  const allSkillPoints: Record<string, number> = { ...char.occupation_skill_points }
  for (const [id, pts] of Object.entries(char.personal_skill_points)) {
    allSkillPoints[id] = (allSkillPoints[id] ?? 0) + pts
  }

  const getBase = (skillId: string) => {
    const base = getSkillBase(skillId)
    if (base === 'half_dex') return Math.floor((char.characteristics['DEX'] ?? 0) / 2)
    if (base === 'edu') return char.characteristics['EDU'] ?? 0
    return base
  }

  return (
    <div className="space-y-4">
      {/* Basic info */}
      <div className="grid grid-cols-3 gap-2 text-sm">
        {char.player_name && <div><span className="text-coc-text-muted">Gracz:</span> {char.player_name}</div>}
        {char.invite_code && <div><span className="text-coc-text-muted">Kod:</span> <span className="font-mono">{char.invite_code}</span></div>}
        <div><span className="text-coc-text-muted">Wiek:</span> {char.age}</div>
        <div><span className="text-coc-text-muted">Płeć:</span> {char.gender}</div>
        <div><span className="text-coc-text-muted">Zawód:</span> {occupation?.name ?? char.occupation_id}</div>
        <div><span className="text-coc-text-muted">Era:</span> {ERA_LABELS[char.era as keyof typeof ERA_LABELS]}</div>
        <div><span className="text-coc-text-muted">Metoda:</span> {METHOD_LABELS[char.method as keyof typeof METHOD_LABELS]}</div>
      </div>
      {char.appearance && (
        <div className="text-sm">
          <span className="text-coc-text-muted">Wygląd:</span> {char.appearance}
        </div>
      )}

      {/* Characteristics */}
      <SectionHeader>Cechy</SectionHeader>
      <div className="grid grid-cols-4 gap-2">
        {CHAR_KEYS.map((key) => {
          const val = char.characteristics[key] ?? 0
          return (
            <div key={key} className="text-center bg-coc-surface-light rounded-lg p-2">
              <div className="text-xs text-coc-text-muted">{CHARACTERISTIC_MAP[key].abbreviation}</div>
              <div className="text-lg font-bold font-mono">{val}</div>
              <div className="text-xs text-coc-text-muted">{halfValue(val)} / {fifthValue(val)}</div>
            </div>
          )
        })}
      </div>

      {/* Derived */}
      {derived && (
        <>
          <SectionHeader>Atrybuty pochodne</SectionHeader>
          <div className="grid grid-cols-4 gap-2">
            <MiniStat label="PW" value={derived.hp} />
            <MiniStat label="PM" value={derived.mp} />
            <MiniStat label="PP" value={derived.san} />
            <MiniStat label="Szczęście" value={char.luck} />
            <MiniStat label="PO" value={derived.db} />
            <MiniStat label="Krzepa" value={derived.build} />
            <MiniStat label="Ruch" value={derived.move_rate} />
            <MiniStat label="Unik" value={derived.dodge} />
          </div>
        </>
      )}

      {/* Skills */}
      <SectionHeader>Umiejętności</SectionHeader>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm max-h-[250px] overflow-y-auto">
        {Object.entries(allSkillPoints)
          .filter(([, pts]) => pts > 0)
          .sort(([a], [b]) => getSkillDisplayName(a).localeCompare(getSkillDisplayName(b), 'pl'))
          .map(([skillId, pts]) => {
            const base = getBase(skillId)
            return (
              <div key={skillId} className="flex justify-between py-0.5">
                <span className="text-coc-text-muted truncate">{getSkillDisplayName(skillId)}</span>
                <span className="font-mono font-bold ml-2">{base + pts}%</span>
              </div>
            )
          })}
      </div>

      {/* Backstory — Drive+Pillars variant or traditional */}
      {char.backstory.drive ? (
        <DrivePillarsDisplay backstory={char.backstory} />
      ) : (
        Object.keys(char.backstory).length > 0 && (
          <>
            <SectionHeader>Historia postaci</SectionHeader>
            <div className="space-y-2">
              {Object.entries(char.backstory).map(([key, value]) => {
                if (!value || typeof value !== 'string') return null
                return (
                  <div key={key}>
                    <div className="text-xs text-coc-text-muted">{BACKSTORY_LABELS[key] ?? key}</div>
                    <div className="text-sm whitespace-pre-wrap">{value}</div>
                  </div>
                )
              })}
            </div>
          </>
        )
      )}

      {/* Equipment */}
      {char.equipment.length > 0 && (
        <>
          <SectionHeader>Ekwipunek</SectionHeader>
          <div className="flex flex-wrap gap-2 mb-2">
            {char.cash && <Badge>Gotówka: {char.cash}</Badge>}
            {char.assets && <Badge>Dobytek: {char.assets}</Badge>}
            {char.spending_level && <Badge>Poziom życia: {char.spending_level}</Badge>}
          </div>
          <ul className="text-sm space-y-0.5">
            {char.equipment.map((item, i) => (
              <li key={i} className="text-coc-text-muted">• {item}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider">{children}</h4>
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center bg-coc-accent/10 rounded p-1.5">
      <div className="text-[10px] text-coc-text-muted">{label}</div>
      <div className="font-bold font-mono">{value}</div>
    </div>
  )
}

const SOURCE_CATEGORY_LABELS: Record<string, string> = {
  person: 'Osoba',
  place: 'Miejsce',
  organization: 'Organizacja',
}

function DrivePillarsDisplay({ backstory }: { backstory: Record<string, unknown> }) {
  const driveId = backstory.drive as string
  const driveDetail = backstory.drive_detail as string | undefined
  const pillars = (backstory.pillars as string[]) ?? []
  const sources = (backstory.sources as StabilitySource[]) ?? []
  const otherTraits = backstory.other_traits as string | undefined
  const appearanceDesc = backstory.appearance_description as string | undefined

  const drive = DRIVES.find((d) => d.id === driveId)

  return (
    <>
      {appearanceDesc && (
        <>
          <SectionHeader>Opis postaci</SectionHeader>
          <div className="text-sm whitespace-pre-wrap">{appearanceDesc}</div>
        </>
      )}

      <SectionHeader>Motywacja</SectionHeader>
      <div className="text-sm">
        <span className="font-medium">{drive?.name ?? driveId}</span>
        {drive && <span className="text-coc-text-muted"> — {drive.description}</span>}
        {driveDetail && <div className="text-coc-text-muted mt-1 italic">{driveDetail}</div>}
      </div>

      {pillars.length > 0 && (
        <>
          <SectionHeader>Filary Poczytalności</SectionHeader>
          <ul className="text-sm space-y-0.5">
            {pillars.map((p, i) => (
              <li key={i} className="text-coc-text-muted">• {p}</li>
            ))}
          </ul>
        </>
      )}

      {sources.length > 0 && (
        <>
          <SectionHeader>Źródła Stabilności</SectionHeader>
          <div className="space-y-2">
            {sources.map((s, i) => (
              <div key={i} className="text-sm">
                <span className="font-medium">{s.name}</span>
                <span className="text-coc-text-muted"> ({SOURCE_CATEGORY_LABELS[s.category] ?? s.category})</span>
                {s.description && <div className="text-coc-text-muted text-xs">{s.description}</div>}
              </div>
            ))}
          </div>
        </>
      )}

      {otherTraits && (
        <>
          <SectionHeader>Inne przymioty</SectionHeader>
          <div className="text-sm whitespace-pre-wrap">{otherTraits}</div>
        </>
      )}
    </>
  )
}
