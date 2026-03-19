import { useState } from 'react'
import { publicProposeEdit } from '@/lib/public'
import { playerSubmitEdit } from '@/lib/player'
import type { WizardState } from '@/stores/characterStore'
import { getWealthBracket, calculateWealth, formatCurrency, WEALTH_FORMS } from '@/data/eras'
import { getSkillById } from '@/data/skills'
import type { Era } from '@/types/common'

interface UseEditSubmitReturn {
  loading: boolean
  error: string | null
  submitEdit: (state: WizardState, changeComment: string) => Promise<boolean>
}

/** Build the same proposed_data shape that the characters table expects */
function buildProposedData(state: WizardState): Record<string, unknown> {
  const era = (state.era ?? 'classic_1920') as Era
  const creditRating =
    (state.occupationSkillPoints['majetnosc'] ?? 0) +
    (typeof getSkillById('majetnosc')?.base === 'number'
      ? (getSkillById('majetnosc')?.base as number)
      : 0)
  const bracket = getWealthBracket(era, creditRating)
  const wealth = calculateWealth(era, creditRating)
  const housing = bracket.housingOptions.find((h) => h.id === state.housingId)
  const transport = bracket.transportOptions.find((t) => t.id === state.transportId)
  const lifestyle = bracket.lifestyleOptions.find((l) => l.id === state.lifestyleId)
  const selectedForms = WEALTH_FORMS[era].filter((f) => state.wealthFormIds.includes(f.id))

  const cashDisplay = [
    `Gotówka: ${formatCurrency(era, state.cashOnHand)}`,
    selectedForms.length > 0 ? `Dobytek: ${selectedForms.map((f) => f.label).join(', ')}` : '',
  ]
    .filter(Boolean)
    .join(' | ')

  const assetsDisplay = formatCurrency(era, wealth.assets)

  return {
    player_name: state.playerName,
    name: state.name,
    age: state.age,
    gender: state.gender,
    appearance: state.appearance,
    residence: state.residence,
    birthplace: state.birthplace,
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
    main_position: state.mainPosition ?? null,
    additional_positions: state.additionalPositions ?? [],
    contacts_v2: state.contactsV2 ?? [],
    portrait_url: state.portraitUrl || null,
  }
}

export function useEditSubmit(): UseEditSubmitReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitEdit = async (state: WizardState, changeComment: string): Promise<boolean> => {
    // Player-centric edit path: use player API
    const playerToken = sessionStorage.getItem('player_token')
    if (state.playerEditCharacterId && playerToken) {
      setLoading(true)
      setError(null)
      try {
        const proposedData = buildProposedData(state)
        await playerSubmitEdit(playerToken, state.playerEditCharacterId, proposedData, changeComment)
        return true
      } catch (err) {
        setError((err as Error).message ?? 'Błąd wysyłania propozycji zmian.')
        return false
      } finally {
        setLoading(false)
      }
    }

    // Token-based edit path (fallback)
    if (!state.editToken) {
      setError('Brak tokenu edycji.')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const proposedData = buildProposedData(state)
      await publicProposeEdit(state.editToken, proposedData, changeComment)
      return true
    } catch (err) {
      setError((err as Error).message ?? 'Błąd wysyłania propozycji zmian.')
      return false
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, submitEdit }
}
