import { useState } from 'react'
import { Loader2, Plus, Copy, Check } from 'lucide-react'
import { useAdminStore } from '@/stores/adminStore'
import { adminCreateCode } from '@/lib/admin'
import { supabase } from '@/lib/supabase'
import { generateInviteCode } from '@/lib/inviteCode'
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

export function QuickCreateCharacter({ onCreated }: QuickCreateProps) {
  const { password } = useAdminStore()

  const [era, setEra] = useState<string>('classic_1920s')
  const [method, setMethod] = useState<string>('direct')
  const [characterName, setCharacterName] = useState('')
  const [playerName, setPlayerName] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCreate = async () => {
    if (!password) return
    setLoading(true)
    setError(null)

    try {
      // 1. Generate and create invite code
      const code = generateInviteCode()
      const codeResult = await adminCreateCode(password, {
        methods: [method],
        era,
        max_tries: 1,
        code,
        perks: [],
        max_skill_value: 80,
      })

      const codeId = codeResult.id

      // 2. Insert minimal character
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
          method,
          main_position: null,
          additional_positions: [],
          contacts_v2: [],
        })
        .select()
        .single()

      if (insertError) throw new Error(insertError.message)

      // 3. Increment times_used
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
        Tworzy kod zaproszenia + pustą postać i otwiera edytor. Do testów i szybkiego prototypowania.
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
          <label className="block text-sm font-medium text-coc-text-muted mb-1">Metoda</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text focus:outline-none focus:border-coc-accent-light"
          >
            {Object.entries(METHOD_LABELS).map(([value, label]) => (
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

      <Button onClick={handleCreate} disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        Utwórz i edytuj
      </Button>
    </Card>
  )
}
