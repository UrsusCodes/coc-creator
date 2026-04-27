import type { CharacterSheetData } from '@/components/shared/CharacterSheet'

interface NarrativeEditorProps {
  data: CharacterSheetData
  onChange: (field: string, value: string) => void
}

/**
 * Narrative-only editor for the player viewer. Covers exactly the fields
 * the v2.0 player edge function lets a player change anytime via the
 * /narrative + /distinguisher endpoints (no admin approval needed):
 *  - name, player_name, gender, appearance, residence, birthplace,
 *    distinguisher
 *
 * Backstory has its own dedicated editor (BackstoryEditor) and is invoked
 * separately. Portrait lives in PortraitGallery.
 *
 * Mechanical fields (age, characteristics, luck, occupation, skills,
 * equipment) are NOT here — those need an admin-granted edit_permission
 * and go through the wizard-edit flow from PlayerDashboard.
 */
export function NarrativeEditor({ data, onChange }: NarrativeEditorProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider">Dane narracyjne</h4>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Imię postaci" value={data.name ?? ''} onChange={(v) => onChange('name', v)} />
        <Field label="Gracz" value={data.player_name ?? ''} onChange={(v) => onChange('player_name', v)} />
        <Field label="Płeć" value={data.gender ?? ''} onChange={(v) => onChange('gender', v)} />
        <Field
          label="Identyfikator"
          value={data.distinguisher ?? ''}
          onChange={(v) => onChange('distinguisher', v)}
          placeholder="np. Detektyw, Kapitan…"
          help="3–60 znaków. Identyfikator jest Twój — możesz go zmienić w każdej chwili."
        />
        <Field label="Miejsce zamieszkania" value={data.residence ?? ''} onChange={(v) => onChange('residence', v)} />
        <Field label="Miejsce urodzenia" value={data.birthplace ?? ''} onChange={(v) => onChange('birthplace', v)} />
      </div>

      <div>
        <label className="block text-sm font-medium text-coc-text-muted mb-1">Wygląd</label>
        <textarea
          value={data.appearance ?? ''}
          onChange={(e) => onChange('appearance', e.target.value)}
          rows={3}
          className="w-full px-3 py-1.5 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text focus:outline-none focus:border-coc-accent-light transition-colors resize-y"
        />
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  help,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  help?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-coc-text-muted mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-1.5 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text focus:outline-none focus:border-coc-accent-light transition-colors"
      />
      {help && <p className="text-xs text-coc-text-muted/70 mt-0.5">{help}</p>}
    </div>
  )
}
