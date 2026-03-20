import { useEffect, useRef } from 'react'
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

export function useDraftSync() {
  const currentStep = useCharacterStore((s) => s.currentStep)
  const editMode = useCharacterStore((s) => s.editMode)
  const playerEditMode = useCharacterStore((s) => s.playerEditMode)
  const inviteCodeId = useCharacterStore((s) => s.inviteCodeId)
  const serverDraftId = useCharacterStore((s) => s.serverDraftId)
  const setServerDraftId = useCharacterStore((s) => s.setServerDraftId)

  const lastStepRef = useRef(currentStep)
  const savingRef = useRef(false)

  useEffect(() => {
    const playerToken = sessionStorage.getItem('player_token')
    if (!playerToken) return // Not logged in, skip server sync
    if (editMode || playerEditMode) return // Edit mode, not draft creation
    if (currentStep <= 0) return // Still on invite code step
    if (currentStep === lastStepRef.current) return // Step didn't change

    lastStepRef.current = currentStep

    // Avoid concurrent saves
    if (savingRef.current) return
    savingRef.current = true

    const saveToServer = async () => {
      try {
        const store = useCharacterStore.getState()
        const data = buildDraftData(store)
        const draftId = store.serverDraftId

        if (draftId) {
          // Update existing draft
          await playerSaveDraft(playerToken, draftId, data)
        } else if (store.inviteCodeId) {
          // Create new draft
          const result = await playerCreateDraft(playerToken, {
            invite_code_id: store.inviteCodeId,
            wizard_data: data,
          })
          if (result?.id) {
            setServerDraftId(result.id)
          }
        }
      } catch {
        // Silent fail — localStorage is the fallback
      } finally {
        savingRef.current = false
      }
    }

    saveToServer()
  }, [currentStep, editMode, playerEditMode, inviteCodeId, serverDraftId, setServerDraftId])
}
