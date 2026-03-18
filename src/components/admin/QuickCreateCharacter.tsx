import { useState } from 'react'
import { Loader2, Plus, Copy, Check } from 'lucide-react'
import { useAdminStore } from '@/stores/adminStore'
import { adminCreateCode } from '@/lib/admin'
import { supabase } from '@/lib/supabase'
import { generateInviteCode } from '@/lib/inviteCode'
import { PERKS } from '@/data/perks'
import { ERA_LABELS, METHOD_LABELS } from '@/types/common'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface QuickCreateProps {
  onCreated: (character: { id: string } & Record<string, unknown>) => void
}

const DEFAULT_CHARACTERISTICS = {
  STR: 50, CON: 50, SIZ: 50, DEX: 50,
  APP: 50, INT: 50, POW: 50, EDU: 50,
}

const DEFAULT_DERIVED = {
  hp: 10, mp: 10, san: 50,
  db: '0', build: 0, move_rate: 8, dodge: 25,
}

const ALL_METHODS = Object.keys(METHOD_LABELS) as string[]

export function QuickCreateCharacter({ onCreated }: QuickCreateProps) {
  const { password } = useAdminStore()

  const [era, setEra] = useState<string>('classic_1920s')
  const [methods, setMethods] = useState<string[]>(['dice', 'point_buy', 'direct'])
  const [characterName, setCharacterName] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [maxTries, setMaxTries] = useState(1)
  const [maxSkillValue, setMaxSkillValue] = useState(80)
  const [selectedPerks, setSelectedPerks] = useState<string[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const toggleMethod = (m: string) => {
    setMethods((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m])
  }

  const togglePerk = (id: string) => {
    setSelectedPerks((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const handleCreate = async () => {
    if (!password || methods.length === 0) return
    setLoading(true)
    setError(null)

    try {
      const code = generateInviteCode()
      const codeResult = await adminCreateCode(password, {
        methods,
        era,
        max_tries: maxTries,
        code,
        perks: selectedPerks,
        max_skill_value: maxSkillValue,
      })

      const codeId = codeResult.id

      const { data: charData, error: insertError } = await supabase
        .from('characters')
        .insert({
          invite_code_id: codeId,
          invite_code: code,
          status: 'draft',
          player_name: playerName || 'Admin (szybkie tworzenie)',
          name: characterName || 'Nowa postać',
          age: 30,
          gender: 'Mężczyzna',
          appearance: '',
          characteristics: DEFAULT_CHARACTERISTICS,
          luck: 50,
          derived: DEFAULT_DERIVED,
          occupation_id: '',
          occupation_skill_points: {},
          personal_skill_points: {},
          backstory: {},
          equipment: [],
          cash: '',
          assets: '',
          spending_level: '',
          era,
          method: methods[0],
          main_position: null,
          additional_positions: [],
          contacts_v2: [],
        })
        .select()
        .single()

      if (insertError) throw new Error(insertError.message)

      await supabase.rpc('increment_times_used', { code_id: codeId })

      setCreatedCode(code)
      onCreated(charData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd tworzenia postaci')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = () => {
    if (!createdCode) return
    navigator.clipboard.writeText(createdCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <h3 className="text-lg font-serif font-bold mb-3">Szybkie tworzenie postaci</h3>
      <p className="text-sm text-coc-text-muted mb-4">
        Tworzy kod zaproszenia + pustą postać i otwiera edytor.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-sm font-medium text-coc-text-muted mb-1">Era</label>
          <select
            value={era}
            onChange={(e) => setEra(e.target.value)}
            className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text focus:outline-none focus:border-coc-accent-light"
          >
            {Object.entries(ERA_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-coc-text-muted mb-1">Nazwa postaci</label>
          <input
            type="text"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            placeholder="Nowa postać"
            className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-coc-text-muted mb-1">Gracz</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Admin"
            className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-coc-text-muted mb-1">Maks. prób</label>
            <input
              type="number"
              min={1}
              max={99}
              value={maxTries}
              onChange={(e) => setMaxTries(Math.max(1, Math.min(99, Number(e.target.value))))}
              className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text focus:outline-none focus:border-coc-accent-light"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-coc-text-muted mb-1">Maks. skill</label>
            <input
              type="number"
              min={50}
              max={99}
              value={maxSkillValue}
              onChange={(e) => setMaxSkillValue(Math.max(50, Math.min(99, Number(e.target.value))))}
              className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text focus:outline-none focus:border-coc-accent-light"
            />
          </div>
        </div>
      </div>

      {/* Methods */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-coc-text-muted mb-1">Metody tworzenia</label>
        <div className="flex flex-wrap gap-2">
          {ALL_METHODS.map((m) => (
            <label key={m} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={methods.includes(m)}
                onChange={() => toggleMethod(m)}
                className="accent-coc-accent-light"
              />
              {METHOD_LABELS[m as keyof typeof METHOD_LABELS] ?? m}
            </label>
          ))}
        </div>
      </div>

      {/* Perks */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-coc-text-muted mb-1">Perki</label>
        <div className="space-y-1">
          {PERKS.map((perk) => (
            <label key={perk.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={selectedPerks.includes(perk.id)}
                onChange={() => togglePerk(perk.id)}
                className="accent-coc-accent-light"
              />
              <span>{perk.name}</span>
              <span className="text-coc-text-muted text-xs">— {perk.description}</span>
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-coc-danger mb-3">{error}</p>}

      {createdCode && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-coc-surface-light border border-coc-border rounded-lg">
          <span className="text-sm text-coc-text-muted">Kod:</span>
          <span className="font-mono text-sm font-bold text-coc-accent-light">{createdCode}</span>
          <button
            type="button"
            onClick={handleCopyCode}
            className="p-1 text-coc-text-muted hover:text-coc-text transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-coc-accent-light" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      <Button onClick={handleCreate} disabled={loading || methods.length === 0}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        Utwórz i edytuj
      </Button>
    </Card>
  )
}
