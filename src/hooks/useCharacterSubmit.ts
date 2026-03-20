import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { WizardState } from '@/stores/characterStore'
import { getWealthBracket, calculateWealth, formatCurrency, WEALTH_FORMS } from '@/data/eras'
import { getSkillById } from '@/data/skills'
import { playerClaimCharacter } from '@/lib/player'
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
    // For draft continuations, era/method may be missing from old localStorage
    // Try to recover from invite code
    let era = state.era
    let method = state.method
    if ((!era || !method) && state.inviteCodeId) {
      const { data: code } = await supabase
        .from('invite_codes')
        .select('era, methods')
        .eq('id', state.inviteCodeId)
        .single()
      if (code) {
        if (!era) era = code.era as Era
        if (!method) method = (code.methods as string[])?.[0] as import('@/types/common').CreationMethod ?? 'direct'
      }
    }
    if (!state.inviteCodeId || !era || !method) {
      setError('Brak danych kodu zaproszenia.')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      // Check if there's an existing draft for this invite code to update
      const { data: existingDraft } = await supabase
        .from('characters')
        .select('id')
        .eq('invite_code_id', state.inviteCodeId)
        .eq('status', 'draft')
        .maybeSingle()
      const draftId = state.serverDraftId || existingDraft?.id

      // Delete any existing non-draft character for this invite code (re-roll replaces old)
      if (!draftId) {
        await supabase
          .from('characters')
          .delete()
          .eq('invite_code_id', state.inviteCodeId)
      }

      // Build enriched cash/assets strings with lifestyle info
      const finalEra = era as Era
      const creditRating = (state.occupationSkillPoints['majetnosc'] ?? 0) +
        (typeof getSkillById('majetnosc')?.base === 'number' ? (getSkillById('majetnosc')?.base as number) : 0)
      const bracket = getWealthBracket(finalEra, creditRating)
      const wealth = calculateWealth(finalEra, creditRating)
      const housing = bracket.housingOptions.find((h) => h.id === state.housingId)
      const transport = bracket.transportOptions.find((t) => t.id === state.transportId)
      const lifestyle = bracket.lifestyleOptions.find((l) => l.id === state.lifestyleId)

      const selectedForms = WEALTH_FORMS[finalEra].filter((f) => state.wealthFormIds.includes(f.id))

      const cashDisplay = [
        `Gotówka: ${formatCurrency(finalEra, state.cashOnHand)}`,
        selectedForms.length > 0 ? `Dobytek: ${selectedForms.map((f) => f.label).join(', ')}` : '',
      ].filter(Boolean).join(' | ')

      const assetsDisplay = formatCurrency(finalEra, wealth.assets)

      // Insert the new character
      const insertData: Record<string, unknown> = {
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
        era: finalEra,
        method,
        main_position: state.mainPosition ?? null,
        additional_positions: state.additionalPositions ?? [],
        contacts_v2: state.contactsV2 ?? [],
        portrait_url: state.portraitUrl || null,
        perks: state.perks ?? [],
        max_skill_value: state.maxSkillValue ?? 80,
      }

      // Attach player_id if player is logged in
      const playerInfo = JSON.parse(sessionStorage.getItem('player_info') ?? 'null')
      if (playerInfo?.id) {
        insertData.player_id = playerInfo.id
      }

      if (draftId) {
        // Draft continuation: update existing character instead of delete+insert
        const { error: updateError } = await supabase
          .from('characters')
          .update({ ...insertData, draft_locked_step: null, draft_step: null })
          .eq('id', draftId)
        if (updateError) {
          setError('Błąd zapisu postaci: ' + updateError.message)
          return false
        }
      } else {
        const { error: insertError } = await supabase.from('characters').insert(insertData)
        if (insertError) {
          setError('Błąd zapisu postaci: ' + insertError.message)
          return false
        }
      }

      // Increment times_used atomically
      await supabase.rpc('increment_times_used', { code_id: state.inviteCodeId })

      // If player is logged in, claim the character
      const playerToken = sessionStorage.getItem('player_token')
      if (playerToken) {
        try {
          await playerClaimCharacter(playerToken, state.inviteCodeId)
        } catch {
          // Non-critical: character created but not claimed (admin can assign later)
        }
      }

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
