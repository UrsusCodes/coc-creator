import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { WizardState } from '@/stores/characterStore'
import { getWealthBracket, calculateWealth, formatCurrency, WEALTH_FORMS } from '@/data/eras'
import { getSkillById } from '@/data/skills'
import type { Era } from '@/types/common'

interface UseCharacterSubmitReturn {
  loading: boolean
  error: string | null
  submit: (state: WizardState) => Promise<boolean>
}

export function useCharacterSubmit(): UseCharacterSubmitReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (state: WizardState): Promise<boolean> => {
    if (!state.inviteCodeId || !state.era || !state.method) {
      setError('Brak danych kodu zaproszenia.')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      // Delete any existing character for this invite code (re-roll replaces old)
      await supabase
        .from('characters')
        .delete()
        .eq('invite_code_id', state.inviteCodeId)

      // Build enriched cash/assets strings with lifestyle info
      const era = state.era as Era
      const creditRating = (state.occupationSkillPoints['majetnosc'] ?? 0) +
        (typeof getSkillById('majetnosc')?.base === 'number' ? (getSkillById('majetnosc')?.base as number) : 0)
      const bracket = getWealthBracket(era, creditRating)
      const wealth = calculateWealth(era, creditRating)
      const housing = bracket.housingOptions.find((h) => h.id === state.housingId)
      const transport = bracket.transportOptions.find((t) => t.id === state.transportId)
      const lifestyle = bracket.lifestyleOptions.find((l) => l.id === state.lifestyleId)

      const selectedForms = WEALTH_FORMS[era].filter((f) => state.wealthFormIds.includes(f.id))

      const cashDisplay = [
        `Gotówka: ${formatCurrency(era, state.cashOnHand)}`,
        selectedForms.length > 0 ? `Dobytek: ${selectedForms.map((f) => f.label).join(', ')}` : '',
      ].filter(Boolean).join(' | ')

      const assetsDisplay = formatCurrency(era, wealth.assets)

      // Insert the new character
      const { error: insertError } = await supabase.from('characters').insert({
        invite_code_id: state.inviteCodeId,
        status: 'submitted',
        player_name: state.playerName,
        invite_code: state.inviteCode,
        name: state.name,
        age: state.age,
        gender: state.gender,
        appearance: state.appearance,
        characteristics: state.characteristics,
        luck: state.luck,
        derived: state.derived,
        occupation_id: state.occupationId,
        occupation_skill_points: state.occupationSkillPoints,
        personal_skill_points: state.personalSkillPoints,
        backstory: state.backstory,
        equipment: [
          ...(housing ? [`[Mieszkanie] ${housing.label}`] : []),
          ...(transport ? [`[Transport] ${transport.label}`] : []),
          ...(lifestyle ? [`[Styl życia] ${lifestyle.label}`] : []),
          ...state.equipment,
          ...state.customItems,
        ],
        cash: cashDisplay,
        assets: assetsDisplay,
        spending_level: state.spendingLevel,
        era: state.era,
        method: state.method,
      })

      if (insertError) {
        setError('Błąd zapisu postaci: ' + insertError.message)
        return false
      }

      // Increment times_used atomically
      await supabase.rpc('increment_times_used', { code_id: state.inviteCodeId })

      return true
    } catch {
      setError('Błąd połączenia z serwerem.')
      return false
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, submit }
}
