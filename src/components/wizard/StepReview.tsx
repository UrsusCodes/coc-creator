import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, AlertTriangle, Pencil, Check } from 'lucide-react'
import { useCharacterStore } from '@/stores/characterStore'
import { useCharacterSubmit } from '@/hooks/useCharacterSubmit'
import { CHARACTERISTIC_MAP } from '@/data/characteristics'
import { OCCUPATIONS } from '@/data/occupations'
import { getSkillDisplayName, getSkillBase } from '@/data/skills'
import { LOKUM_OPTIONS, TRANSPORT_STYLES, LIFESTYLE_LEVELS, ASSET_FORMS } from '@/data/wealthV2'
import { ERA_LABELS, type CharacteristicKey } from '@/types/common'
import type { Characteristics } from '@/types/character'
import { halfValue, fifthValue } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const CHAR_KEYS: CharacteristicKey[] = ['STR', 'CON', 'SIZ', 'DEX', 'APP', 'INT', 'POW', 'EDU']

// ── Inline editable text field ──
function EditableField({ label, value, onSave, multiline }: {
  label: string
  value: string
  onSave: (val: string) => void
  multiline?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const handleSave = () => {
    onSave(draft)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="mb-1">
        <div className="text-xs text-coc-text-muted">{label}</div>
        <div className="flex gap-1 items-start mt-0.5">
          {multiline ? (
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)}
              className="flex-1 px-2 py-1 bg-coc-surface-light border border-coc-accent/30 rounded text-sm text-coc-text focus:outline-none focus:border-coc-accent-light min-h-[50px] resize-y" />
          ) : (
            <input type="text" value={draft} onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="flex-1 px-2 py-1 bg-coc-surface-light border border-coc-accent/30 rounded text-sm text-coc-text focus:outline-none focus:border-coc-accent-light" />
          )}
          <button type="button" onClick={handleSave}
            className="p-1 text-green-400 hover:text-green-300 cursor-pointer">
            <Check className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group mb-1">
      <div className="text-xs text-coc-text-muted">{label}</div>
      <div className="flex items-start gap-1">
        <span className="text-sm whitespace-pre-wrap flex-1">{value || <span className="italic text-coc-text-muted/50">puste</span>}</span>
        <button type="button" onClick={() => { setDraft(value); setEditing(true) }}
          className="p-0.5 text-coc-text-muted/30 hover:text-coc-accent-light cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
          <Pencil className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

export function StepReview() {
  const store = useCharacterStore()
  const navigate = useNavigate()
  const { loading, error, submit } = useCharacterSubmit()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const chars = store.characteristics as Characteristics
  const occupation = OCCUPATIONS.find((o) => o.id === store.occupationId)

  const allSkillPoints = { ...store.occupationSkillPoints }
  for (const [id, pts] of Object.entries(store.personalSkillPoints)) {
    allSkillPoints[id] = (allSkillPoints[id] ?? 0) + pts
  }

  const getBase = (skillId: string) => {
    const base = getSkillBase(skillId)
    if (base === 'half_dex') return Math.floor((chars.DEX ?? 0) / 2)
    if (base === 'edu') return chars.EDU ?? 0
    return base
  }

  const handleSubmit = async () => {
    const inviteCodeId = store.inviteCodeId
    const success = await submit(store)
    if (success) {
      store.reset()
      navigate('/success', { state: { inviteCodeId } })
    }
  }

  // ── Store update helpers ──
  const updateBasicInfo = (field: string, value: string) => {
    store.setBasicInfo({
      playerName: field === 'playerName' ? value : store.playerName,
      name: field === 'name' ? value : store.name,
      gender: store.gender,
      appearance: field === 'appearance' ? value : store.appearance,
      residence: field === 'residence' ? value : store.residence,
      birthplace: field === 'birthplace' ? value : store.birthplace,
    })
  }

  const updateBackstory = (key: string, value: string) => {
    store.setBackstory({ [key]: value })
  }

  const updatePillar = (index: number, value: string) => {
    const pillars = [...(store.backstory.pillars ?? [])]
    pillars[index] = value
    store.setBackstory({ pillars })
  }

  const updateSource = (index: number, field: 'name' | 'description', value: string) => {
    const sources = [...(store.backstory.sources ?? [])]
    if (sources[index]) {
      sources[index] = { ...sources[index], [field]: value }
      store.setBackstory({ sources })
    }
  }

  const updateMainPositionDesc = (value: string) => {
    if (store.mainPosition) {
      store.setMainPosition({ ...store.mainPosition, custom_description: value })
    }
  }

  const updateAdditionalPositionDesc = (index: number, value: string) => {
    const positions = [...store.additionalPositions]
    if (positions[index]) {
      positions[index] = { ...positions[index], custom_description: value }
      store.setPositionsAndContactsV2(positions, store.contactsV2)
    }
  }

  const updateContactDesc = (index: number, value: string) => {
    const contacts = [...store.contactsV2]
    if (contacts[index]) {
      contacts[index] = { ...contacts[index], custom_description: value }
      store.setPositionsAndContactsV2(store.additionalPositions, contacts)
    }
  }

  return (
    <Card title="Podsumowanie">
      <p className="text-xs text-coc-text-muted mb-4">Najedź na dowolny tekst i kliknij ✏️ żeby edytować.</p>

      {/* Basic Info */}
      <Section title="Dane podstawowe">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <EditableField label="Gracz" value={store.playerName} onSave={(v) => updateBasicInfo('playerName', v)} />
          <EditableField label="Imię" value={store.name} onSave={(v) => updateBasicInfo('name', v)} />
          <Field label="Wiek" value={String(store.age)} />
          <Field label="Płeć" value={store.gender} />
          <Field label="Era" value={store.era ? ERA_LABELS[store.era] : ''} />
          <Field label="Zawód" value={occupation?.name ?? ''} />
          <EditableField label="Miejsce zamieszkania" value={store.residence} onSave={(v) => updateBasicInfo('residence', v)} />
          <EditableField label="Miejsce urodzenia" value={store.birthplace} onSave={(v) => updateBasicInfo('birthplace', v)} />
        </div>
        <div className="mt-2">
          <EditableField label="Wygląd" value={store.appearance} onSave={(v) => updateBasicInfo('appearance', v)} multiline />
        </div>
      </Section>

      {/* Characteristics */}
      <Section title="Cechy">
        <div className="grid grid-cols-4 gap-2">
          {CHAR_KEYS.map((key) => (
            <div key={key} className="text-center bg-coc-surface-light rounded-lg p-2">
              <div className="text-xs text-coc-text-muted">{CHARACTERISTIC_MAP[key].abbreviation}</div>
              <div className="text-lg font-bold font-mono">{chars[key]}</div>
              <div className="text-xs text-coc-text-muted">
                {halfValue(chars[key])} / {fifthValue(chars[key])}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Derived */}
      {store.derived && (
        <Section title="Atrybuty pochodne">
          <div className="grid grid-cols-4 gap-2 text-sm">
            <MiniStat label="PW" value={store.derived.hp} />
            <MiniStat label="PM" value={store.derived.mp} />
            <MiniStat label="PP" value={store.derived.san} />
            <MiniStat label="Szczęście" value={store.luck ?? 0} />
            <MiniStat label="PO" value={store.derived.db} />
            <MiniStat label="Krzepa" value={store.derived.build} />
            <MiniStat label="Ruch" value={store.derived.move_rate} />
            <MiniStat label="Unik" value={store.derived.dodge} />
          </div>
        </Section>
      )}

      {/* Skills */}
      <Section title="Umiejętności">
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm max-h-[250px] overflow-y-auto">
          {Object.entries(allSkillPoints)
            .filter(([, pts]) => pts > 0)
            .sort(([a], [b]) => getSkillDisplayName(a).localeCompare(getSkillDisplayName(b), 'pl'))
            .map(([skillId, pts]) => {
              const base = getBase(skillId)
              const total = base + pts
              return (
                <div key={skillId} className="flex justify-between py-0.5">
                  <span className="text-coc-text-muted truncate">{getSkillDisplayName(skillId)}</span>
                  <span className="font-mono font-bold ml-2">{total}%</span>
                </div>
              )
            })}
        </div>
      </Section>

      {/* Backstory */}
      <Section title={store.backstory.drive ? 'Motywacja i Filary' : 'Historia postaci'}>
        {Object.entries(store.backstory).map(([key, value]) => {
          if (!value) return null
          if (key === 'pillars' || key === 'sources') return null
          if (key === 'drive') return null // drive is a select, not free text
          if (typeof value !== 'string') return null
          const labels: Record<string, string> = {
            ideology: 'Ideologia / Przekonania',
            significant_people_who: 'Ważne osoby: Kto',
            significant_people_why: 'Ważne osoby: Dlaczego',
            meaningful_locations: 'Znaczące miejsca',
            treasured_possessions: 'Rzeczy osobiste',
            traits: 'Przymioty',
            appearance_description: 'Opis postaci',
            key_connection: 'Kluczowa więź',
            drive_detail: 'Szczegóły motywacji',
            other_traits: 'Inne przymioty',
          }
          return (
            <EditableField key={key} label={labels[key] ?? key} value={value}
              onSave={(v) => updateBackstory(key, v)} multiline />
          )
        })}
        {store.backstory.drive && (
          <div className="mb-2">
            <div className="text-xs text-coc-text-muted">Motywacja</div>
            <div className="text-sm">{store.backstory.drive}</div>
          </div>
        )}
        {store.backstory.pillars && store.backstory.pillars.length > 0 && (
          <div className="mb-2">
            <div className="text-xs text-coc-text-muted mb-1">Filary Poczytalności</div>
            {store.backstory.pillars.map((p, i) => (
              <EditableField key={i} label={`Filar ${i + 1}`} value={p}
                onSave={(v) => updatePillar(i, v)} />
            ))}
          </div>
        )}
        {store.backstory.sources && store.backstory.sources.length > 0 && (
          <div className="mb-2">
            <div className="text-xs text-coc-text-muted mb-1">Źródła Stabilności</div>
            {store.backstory.sources.map((s, i) => (
              <div key={i} className="mb-2 pl-2 border-l-2 border-coc-border">
                <EditableField label={`Źródło ${i + 1}: nazwa`} value={s.name}
                  onSave={(v) => updateSource(i, 'name', v)} />
                <div className="text-xs text-coc-text-muted">
                  {s.category === 'person' ? 'Osoba' : s.category === 'place' ? 'Miejsce' : 'Organizacja'}
                </div>
                <EditableField label="Opis" value={s.description}
                  onSave={(v) => updateSource(i, 'description', v)} />
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Positions & Contacts */}
      {(store.mainPosition || store.additionalPositions.length > 0 || store.contactsV2.length > 0) && (
        <Section title="Pozycje i kontakty">
          {store.mainPosition && (
            <div className="mb-3 bg-coc-surface-light rounded-lg p-2">
              <div className="text-xs text-coc-text-muted mb-1">Pozycja główna</div>
              <div className="text-sm font-medium">
                {store.mainPosition.option_name}
                <span className="text-xs text-coc-text-muted ml-2">{store.mainPosition.organization_size}</span>
                <span className="text-sm font-mono font-bold text-coc-accent-light ml-2">{store.mainPosition.strength_percent}%</span>
              </div>
              <EditableField label="Opis pozycji" value={store.mainPosition.custom_description}
                onSave={updateMainPositionDesc} multiline />
            </div>
          )}
          {store.additionalPositions.filter(p => p.option_name).length > 0 && (
            <div className="mb-2">
              <div className="text-xs text-coc-text-muted mb-1">Dodatkowe pozycje</div>
              {store.additionalPositions.filter(p => p.option_name).map((p, i) => (
                <div key={i} className="mb-2">
                  <div className="text-sm py-0.5">
                    {'★'.repeat(p.weight)} {p.option_name} [{p.roll_value}%]{p.pending_st_approval ? ' [ST]' : ''}
                  </div>
                  <EditableField label="Opis" value={p.custom_description}
                    onSave={(v) => updateAdditionalPositionDesc(i, v)} multiline />
                </div>
              ))}
            </div>
          )}
          {store.contactsV2.filter(c => c.subcategory_name).length > 0 && (
            <div>
              <div className="text-xs text-coc-text-muted mb-1">Kontakty</div>
              {store.contactsV2.filter(c => c.subcategory_name).map((c, i) => {
                const d = Math.max(1, Math.min(3, c.strength))
                return (
                  <div key={i} className="mb-2">
                    <div className="text-sm py-0.5">
                      {'◆'.repeat(d)}{'░'.repeat(3 - d)}{' '}
                      <span className="text-coc-text-muted">{c.category_name}: </span>
                      {c.subcategory_name} [{c.roll_value}%]{c.synergy_bonus > 0 ? ' ✨' : ''}{c.pending_st_approval ? ' [ST]' : ''}
                    </div>
                    <EditableField label="Opis kontaktu" value={c.custom_description}
                      onSave={(v) => updateContactDesc(i, v)} multiline />
                  </div>
                )
              })}
            </div>
          )}
        </Section>
      )}

      {/* Lifestyle & Equipment */}
      <Section title="Dobytek i ekwipunek">
        {(() => {
          const lokumOption = LOKUM_OPTIONS.find((l) => l.id === store.housingId)
          const transportOption = TRANSPORT_STYLES.find((t) => t.id === store.transportStyleId)
          const lifestyleOption = LIFESTYLE_LEVELS.find((l) => l.id === store.lifestyleId)
          const selectedForms = ASSET_FORMS.filter((f) => store.wealthFormIds.includes(f.id))
          return (
            <>
              <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                <Field label="Miejsce zamieszkania" value={lokumOption?.label ?? '-'} />
                <Field label="Transport" value={transportOption?.label ?? '-'} />
                <Field label="Styl życia" value={lifestyleOption?.label ?? '-'} />
                <Field label="Poz. wydatków" value={store.spendingLevel} />
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge>{store.cash}</Badge>
                {selectedForms.length > 0 && (
                  <Badge>Dobytek: {selectedForms.map((f) => f.label).join(', ')}</Badge>
                )}
              </div>
            </>
          )
        })()}
        <ul className="text-sm space-y-0.5">
          {[...store.equipment, ...store.customItems].map((item, i) => (
            <li key={i} className="text-coc-text-muted">• {item}</li>
          ))}
        </ul>
      </Section>

      {/* Submit */}
      <div className="border-t border-coc-border pt-4 mt-4">
        {error && (
          <div className="flex items-center gap-2 text-coc-danger text-sm mb-3">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        {!confirmOpen ? (
          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => store.prevStep()}>Wstecz</Button>
            <Button onClick={() => setConfirmOpen(true)}>Zatwierdź postać</Button>
          </div>
        ) : (
          <div className="bg-coc-warning/10 border border-coc-warning/30 rounded-lg p-4">
            <p className="text-sm text-coc-warning mb-3">
              Czy na pewno chcesz zatwierdzić postać? Po zatwierdzeniu nie będzie możliwości edycji.
              {store.inviteCode && ' Twoja poprzednia postać (jeśli istnieje) zostanie zastąpiona.'}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Anuluj</Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Tak, zatwierdź
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 pb-4 border-b border-coc-border last:border-0">
      <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider mb-2">{title}</h4>
      {children}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-coc-text-muted">{label}: </span>
      <span className="text-sm">{value}</span>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center bg-coc-surface-light rounded p-1.5">
      <div className="text-[10px] text-coc-text-muted">{label}</div>
      <div className="font-bold font-mono">{value}</div>
    </div>
  )
}
