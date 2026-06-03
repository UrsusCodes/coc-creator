import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, AlertTriangle, Pencil, Send } from 'lucide-react'
import { useCharacterStore } from '@/stores/characterStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useCharacterSubmit } from '@/hooks/useCharacterSubmit'
import { useEditSubmit } from '@/hooks/useEditSubmit'
import { playerSubmitCharacter } from '@/lib/player'
import { CHARACTERISTIC_MAP } from '@/data/characteristics'
import { OCCUPATIONS } from '@/data/occupations'
import { getSkillDisplayName, getSkillBase } from '@/data/skills'
import { LOKUM_OPTIONS, TRANSPORT_STYLES, LIFESTYLE_LEVELS, ASSET_FORMS } from '@/data/wealthV2'
import { ERA_LABELS, type CharacteristicKey, type Era } from '@/types/common'
import type { Characteristics } from '@/types/character'
import { halfValue, fifthValue } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PortraitUpload } from '@/components/shared/PortraitUpload'

const CHAR_KEYS: CharacteristicKey[] = ['STR', 'CON', 'SIZ', 'DEX', 'APP', 'INT', 'POW', 'EDU']

// ── Editable text field ──
// Behavior is controlled by a single page-level toggle: when `editing` is
// true, every field renders as a live input/textarea (changes commit to the
// store on each keystroke via `onSave`). When false, fields render as
// read-only text. The previous per-field hover-pencil UX was unreadable.
function EditableField({ label, value, onSave, multiline, editing }: {
  label: string
  value: string
  onSave: (val: string) => void
  multiline?: boolean
  editing: boolean
}) {
  if (editing) {
    return (
      <div className="mb-2">
        <label className="block text-xs text-coc-text-muted mb-0.5">{label}</label>
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onSave(e.target.value)}
            className="w-full px-2 py-1 bg-coc-surface-light border border-coc-accent/30 rounded text-sm text-coc-text focus:outline-none focus:border-coc-accent-light min-h-[50px] resize-y"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onSave(e.target.value)}
            className="w-full px-2 py-1 bg-coc-surface-light border border-coc-accent/30 rounded text-sm text-coc-text focus:outline-none focus:border-coc-accent-light"
          />
        )}
      </div>
    )
  }

  return (
    <div className="mb-1">
      <div className="text-xs text-coc-text-muted">{label}</div>
      <span className="text-sm whitespace-pre-wrap">
        {value || <span className="italic text-coc-text-muted/50">puste</span>}
      </span>
    </div>
  )
}

export function StepReview() {
  const store = useCharacterStore()
  const navigate = useNavigate()
  const playerToken = usePlayerStore((s) => s.token)
  const { loading: legacyLoading, error: legacyError, submit: legacySubmit } = useCharacterSubmit()
  const { loading: editLoading, error: editError, submitEdit } = useEditSubmit()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [changeComment, setChangeComment] = useState('')
  const [editSuccess, setEditSuccess] = useState(false)
  const [granularSubmitting, setGranularSubmitting] = useState(false)
  const [granularError, setGranularError] = useState<string | null>(null)
  // Page-level edit toggle. When true every editable narrative/backstory
  // field renders as an input. Single button at the top of the card flips
  // it. Replaces the old per-field hover-pencil UI which was unreadable.
  const [editing, setEditing] = useState(false)

  const isEditMode = !!store.editMode
  // Granular-commits flow: a server-side draft already exists from
  // StepIdentifier — submit just flips draft → submitted.
  const useGranularSubmit = !!store.serverDraftId && !!playerToken && !isEditMode
  const loading = granularSubmitting || legacyLoading
  const error = granularError ?? legacyError

  const chars = store.characteristics as Characteristics
  const era = (store.era ?? 'classic_1920s') as Era
  const occupation = OCCUPATIONS.find((o) => o.id === store.occupationId)

  const allSkillPoints = { ...store.occupationSkillPoints }
  for (const [id, pts] of Object.entries(store.personalSkillPoints)) {
    allSkillPoints[id] = (allSkillPoints[id] ?? 0) + pts
  }

  const getBase = (skillId: string) => {
    const base = getSkillBase(skillId, era)
    if (base === 'half_dex') return Math.floor((chars.DEX ?? 0) / 2)
    if (base === 'edu') return chars.EDU ?? 0
    return base
  }

  const handleSubmit = async () => {
    const inviteCodeId = store.inviteCodeId
    if (useGranularSubmit) {
      setGranularError(null)
      setGranularSubmitting(true)
      try {
        await playerSubmitCharacter(playerToken!, store.serverDraftId!)
        store.reset()
        navigate('/success', { state: { inviteCodeId } })
      } catch (e) {
        setGranularError(e instanceof Error ? e.message : 'Nie udało się zatwierdzić postaci')
      } finally {
        setGranularSubmitting(false)
      }
      return
    }
    // Legacy fallback (no server draft id — pre-v2.0 path).
    const success = await legacySubmit(store)
    if (success) {
      store.reset()
      navigate('/success', { state: { inviteCodeId } })
    }
  }

  const handleProposeEdit = async () => {
    const success = await submitEdit(store, changeComment)
    if (success) {
      setEditSuccess(true)
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
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-coc-text-muted">
          {editing
            ? 'Edytujesz dane narracyjne. Zmiany zapisują się na bieżąco.'
            : 'Sprawdź podsumowanie. Aby zmienić dane narracyjne (imię, opis, fabuła, opisy pozycji/kontaktów) — kliknij „Edytuj".'}
        </p>
        <Button
          size="sm"
          variant={editing ? 'secondary' : 'ghost'}
          onClick={() => setEditing((v) => !v)}
        >
          <Pencil className="w-3.5 h-3.5" />
          {editing ? 'Zakończ edycję' : 'Edytuj'}
        </Button>
      </div>

      {/* Basic Info */}
      <Section title="Dane podstawowe">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <EditableField label="Gracz" value={store.playerName} onSave={(v) => updateBasicInfo('playerName', v)} editing={editing} />
          <EditableField label="Imię" value={store.name} onSave={(v) => updateBasicInfo('name', v)} editing={editing} />
          <Field label="Wiek" value={String(store.age)} />
          <Field label="Płeć" value={store.gender} />
          <Field label="Era" value={store.era ? ERA_LABELS[store.era] : ''} />
          <Field label="Zawód" value={occupation?.name ?? ''} />
          <EditableField label="Miejsce zamieszkania" value={store.residence} onSave={(v) => updateBasicInfo('residence', v)} editing={editing} />
          <EditableField label="Miejsce urodzenia" value={store.birthplace} onSave={(v) => updateBasicInfo('birthplace', v)} editing={editing} />
        </div>
        <div className="mt-2">
          <EditableField label="Wygląd" value={store.appearance} onSave={(v) => updateBasicInfo('appearance', v)} multiline editing={editing} />
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
              onSave={(v) => updateBackstory(key, v)} multiline editing={editing} />
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
                onSave={(v) => updatePillar(i, v)} editing={editing} />
            ))}
          </div>
        )}
        {store.backstory.sources && store.backstory.sources.length > 0 && (
          <div className="mb-2">
            <div className="text-xs text-coc-text-muted mb-1">Źródła Stabilności</div>
            {store.backstory.sources.map((s, i) => (
              <div key={i} className="mb-2 pl-2 border-l-2 border-coc-border">
                <EditableField label={`Źródło ${i + 1}: nazwa`} value={s.name}
                  onSave={(v) => updateSource(i, 'name', v)} editing={editing} />
                <div className="text-xs text-coc-text-muted">
                  {s.category === 'person' ? 'Osoba' : s.category === 'place' ? 'Miejsce' : 'Organizacja'}
                </div>
                <EditableField label="Opis" value={s.description}
                  onSave={(v) => updateSource(i, 'description', v)} multiline editing={editing} />
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
                onSave={updateMainPositionDesc} multiline editing={editing} />
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
                    onSave={(v) => updateAdditionalPositionDesc(i, v)} multiline editing={editing} />
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
                      onSave={(v) => updateContactDesc(i, v)} multiline editing={editing} />
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
          {(() => {
            const all = [...store.equipment, ...store.customItems]
            const counts = new Map<string, number>()
            for (const item of all) {
              if (/\[x\d+\]$/.test(item)) { counts.set(item, 1); continue }
              counts.set(item, (counts.get(item) ?? 0) + 1)
            }
            return Array.from(counts.entries()).map(([item, count]) => (
              <li key={item} className="text-coc-text-muted">• {count > 1 ? `${item} [x${count}]` : item}</li>
            ))
          })()}
        </ul>
      </Section>

      {/* Submit / Propose Edit */}
      <div className="border-t border-coc-border pt-4 mt-4">
        {/* Portrait */}
        <Section title="Portret postaci (opcjonalnie)">
          <PortraitUpload
            value={store.portraitUrl}
            onChange={(url) => store.setPortraitUrl(url)}
          />
        </Section>

        {isEditMode ? (
          /* ── Edit mode: propose changes ── */
          editSuccess ? (
            <div className="bg-coc-accent/10 border border-coc-accent/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-coc-accent-light font-medium mb-1">
                <Send className="w-4 h-4" />
                Propozycja zmian wysłana!
              </div>
              <p className="text-sm text-coc-text-muted mb-3">
                Strażnik Tajemnic otrzymał Twoją propozycję zmian i zatwierdzi je lub odrzuci.
              </p>
              <Button variant="secondary" onClick={() => { store.reset(); navigate('/player') }}>
                Powrót do panelu gracza
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {(editError) && (
                <div className="flex items-center gap-2 text-coc-danger text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  {editError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-coc-text-muted mb-1">
                  Komentarz do zmian (opcjonalnie)
                </label>
                <textarea
                  value={changeComment}
                  onChange={(e) => setChangeComment(e.target.value)}
                  placeholder="Co chcesz zmienić i dlaczego..."
                  className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light transition-colors min-h-[60px] resize-y"
                />
              </div>
              {!confirmOpen ? (
                <div className="flex justify-between">
                  <Button variant="secondary" onClick={() => store.prevStep()}>Wstecz</Button>
                  <Button onClick={() => setConfirmOpen(true)}>
                    <Send className="w-4 h-4" />
                    Zaproponuj zmiany
                  </Button>
                </div>
              ) : (
                <div className="bg-coc-warning/10 border border-coc-warning/30 rounded-lg p-4">
                  <p className="text-sm text-coc-warning mb-3">
                    Propozycja zmian zostanie wysłana do Strażnika Tajemnic do zatwierdzenia.
                    Zmiany nie zostaną zastosowane od razu.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Anuluj</Button>
                    <Button onClick={handleProposeEdit} disabled={editLoading}>
                      {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Tak, wyślij
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          /* ── Normal mode: create character ── */
          <>
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
          </>
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
