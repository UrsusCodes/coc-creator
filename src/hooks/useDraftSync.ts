import { useEffect, useRef, useCallback } from 'react'
import { useCharacterStore } from '@/stores/characterStore'
import { playerSaveDraft, playerCreateDraft } from '@/lib/player'

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
    const playerToken = sessionStorage.getItem('player_token')
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
      const draftId = store.serverDraftId
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

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const playerToken = sessionStorage.getItem('player_token')
      if (!playerToken) return
      const store = useCharacterStore.getState()
      if (store.currentStep <= 0 || store.editMode || store.playerEditMode) return
      const draftId = store.serverDraftId
      if (!draftId) return
      const data = buildDraftData(store)
      // Use sendBeacon for reliable save on page close
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/player/characters/${draftId}/draft`
      navigator.sendBeacon(url, new Blob([JSON.stringify({ wizard_data: data })], { type: 'application/json' }))
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])
}
