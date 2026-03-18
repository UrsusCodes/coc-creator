import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CheckCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getSkillDisplayName, getSkillBase } from '@/data/skills'
import { CHARACTERISTIC_MAP } from '@/data/characteristics'
import { OCCUPATIONS } from '@/data/occupations'
import { ERA_LABELS, METHOD_LABELS, type CharacteristicKey } from '@/types/common'
import { halfValue, fifthValue } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ExportButtons } from '@/components/shared/ExportButtons'

const CHAR_KEYS: CharacteristicKey[] = ['STR', 'CON', 'SIZ', 'DEX', 'APP', 'INT', 'POW', 'EDU']

interface CharacterRecord {
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
  main_position?: Record<string, unknown> | null
  additional_positions?: Record<string, unknown>[]
  contacts_v2?: Record<string, unknown>[]
  portrait_url?: string
}

export function SuccessPage() {
  const location = useLocation()
  const inviteCodeId = (location.state as { inviteCodeId?: string })?.inviteCodeId ?? null

  const [character, setCharacter] = useState<CharacterRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!inviteCodeId) return
    setLoading(true)
    supabase
      .from('characters')
      .select('*')
      .eq('invite_code_id', inviteCodeId)
      .single()
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError('Nie udało się pobrać danych postaci.')
        } else {
          setCharacter(data as CharacterRecord)
        }
        setLoading(false)
      })
  }, [inviteCodeId])

  return (
    <div className="flex flex-col items-center justify-center">
      <Card className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <CheckCircle className="w-16 h-16 text-coc-accent-light mx-auto mb-4" />
          <h2 className="text-2xl font-serif font-bold mb-2">Postać Zapisana!</h2>
          <p className="text-coc-text-muted">
            Twój Badacz został pomyślnie utworzony i przesłany do Strażnika Tajemnic.
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-coc-accent-light" />
            <span className="ml-2 text-sm text-coc-text-muted">Ładowanie postaci...</span>
          </div>
        )}

        {error && (
          <p className="text-sm text-coc-danger text-center mb-4">{error}</p>
        )}

        {character && <CharacterSummary character={character} />}

        <div className="text-center pt-4">
          <Link to="/create">
            <Button variant="secondary">Stwórz nową postać</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

function CharacterSummary({ character: char }: { character: CharacterRecord }) {
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
    <div className="space-y-4 border-t border-coc-border pt-4">
      {/* Portrait */}
      {char.portrait_url && (
        <div className="flex justify-center">
          <img src={char.portrait_url} alt="Portret" className="w-24 h-24 object-cover rounded-lg border border-coc-border" />
        </div>
      )}
      {/* Basic Info */}
      <div className="grid grid-cols-3 gap-2 text-sm">
        {char.player_name && <div><span className="text-coc-text-muted">Gracz:</span> {char.player_name}</div>}
        <div><span className="text-coc-text-muted">Imię:</span> {char.name}</div>
        <div><span className="text-coc-text-muted">Wiek:</span> {char.age}</div>
        <div><span className="text-coc-text-muted">Płeć:</span> {char.gender === 'M' ? 'Mężczyzna' : char.gender === 'F' ? 'Kobieta' : char.gender}</div>
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
      <div>
        <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider mb-2">Cechy</h4>
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
      </div>

      {/* Derived */}
      {derived && (
        <div>
          <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider mb-2">Atrybuty pochodne</h4>
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
        </div>
      )}

      {/* Skills */}
      <div>
        <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider mb-2">Umiejętności</h4>
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
      </div>

      {/* Backstory */}
      {Object.keys(char.backstory).length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider mb-2">Historia postaci</h4>
          <div className="space-y-2">
            {Object.entries(char.backstory).map(([key, value]) => {
              if (!value || typeof value !== 'string') return null
              const labels: Record<string, string> = {
                ideology: 'Ideologia / Przekonania',
                significant_people_who: 'Ważne osoby — Kto',
                significant_people_why: 'Ważne osoby — Dlaczego',
                meaningful_locations: 'Znaczące miejsca',
                treasured_possessions: 'Rzeczy osobiste',
                traits: 'Przymioty',
                appearance_description: 'Opis postaci',
                key_connection: 'Kluczowa więź',
                drive: 'Motywacja',
                drive_detail: 'Szczegóły motywacji',
                other_traits: 'Inne przymioty',
              }
              return (
                <div key={key}>
                  <div className="text-xs text-coc-text-muted">{labels[key] ?? key}</div>
                  <div className="text-sm whitespace-pre-wrap">{value}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Equipment */}
      {char.equipment.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider mb-2">Ekwipunek</h4>
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
        </div>
      )}

      {/* Export */}
      <div className="border-t border-coc-border pt-4">
        <ExportButtons character={char} />
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center bg-coc-accent/10 rounded p-1.5">
      <div className="text-[10px] text-coc-text-muted">{label}</div>
      <div className="font-bold font-mono">{value}</div>
    </div>
  )
}
