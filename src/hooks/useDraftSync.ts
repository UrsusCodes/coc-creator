import { useEffect, useRef, useCallback } from 'react'
import { useCharacterStore } from '@/stores/characterStore'
import { playerSaveDraft, playerCreateDraft } from '@/lib/player'
import { supabase } from '@/lib/supabase'

function buildDraftData(store: ReturnType<typeof useCharacterStore.getState>): Record<string, unknown> {
  return {
    characteristics: store.characteristics,
    luck: store.luck,
    age: store.age,
    gender: store.gender,
    name: store.name,
    player_name: store.playerName,
    appearance: store.appearance,
    residence: store.residence,
    birthplace: store.birthplace,
    occupation_id: store.occupationId,
    occupation_skill_points: store.occupationSkillPoints,
    personal_skill_points: store.personalSkillPoints,
    backstory: store.backstory,
    main_position: store.mainPosition,
    additional_positions: store.additionalPositions,
    contacts_v2: store.contactsV2,
    portrait_url: store.portraitUrl,
    equipment: store.equipment,
    derived: store.derived,
    era: store.era,
    method: store.method,
    perks: store.perks,
    max_skill_value: store.maxSkillValue,
    draft_step: store.currentStep,
  }
}

let lastSavedJson = ''

export function useDraftSync() {
  const savingRef = useRef(false)

  const saveNow = useCallback(async () => {
    const playerToken = localStorage.getItem('player_token')
    if (!playerToken) return

    const store = useCharacterStore.getState()
    if (store.editMode || store.playerEditMode) return
    if (store.currentStep <= 0) return
    if (savingRef.current) return

    const data = buildDraftData(store)
    const json = JSON.stringify(data)
    if (json === lastSavedJson) return // Nothing changed

    savingRef.current = true
    try {
      let draftId = store.serverDraftId

      // If no serverDraftId but we have an invite code, try to find existing draft in DB
      if (!draftId && store.inviteCodeId) {
        const { data: existing } = await supabase
          .from('characters')
          .select('id')
          .eq('invite_code_id', store.inviteCodeId)
          .eq('status', 'draft')
          .maybeSingle()
        if (existing?.id) {
          draftId = existing.id
          store.setServerDraftId(draftId)
        }
      }

      if (draftId) {
        await playerSaveDraft(playerToken, draftId, data)
      } else if (store.inviteCodeId) {
        const result = await playerCreateDraft(playerToken, {
          invite_code_id: store.inviteCodeId,
          wizard_data: data,
        })
        if (result?.id) {
          store.setServerDraftId(result.id)
        }
      }
      lastSavedJson = json
    } catch {
      // Will retry on next interval
    } finally {
      savingRef.current = false
    }
  }, [])

  // Save on step change (immediate)
  const currentStep = useCharacterStore((s) => s.currentStep)
  useEffect(() => {
    if (currentStep > 0) saveNow()
  }, [currentStep, saveNow])

  // Save periodically (every 10 seconds) to catch within-step changes
  useEffect(() => {
    const interval = setInterval(saveNow, 10000)
    return () => clearInterval(interval)
  }, [saveNow])

  // Save on page visibility change (tab switch, minimize) and before unload
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') saveNow()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [saveNow])
}
