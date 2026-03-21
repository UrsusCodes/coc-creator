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

/**
 * Safe draft sync hook — saves wizard progress to server via player API.
 *
 * Security guarantees:
 * - ONLY saves through player edge function (verifies player_id ownership)
 * - NEVER writes directly to DB with anon key
 * - Validates serverDraftId belongs to current inviteCodeId before saving
 * - Resets serverDraftId on inviteCodeId change
 */
export function useDraftSync() {
  const savingRef = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastJsonRef = useRef('')
  const lastInviteCodeRef = useRef<string | null>(null)

  const saveNow = useCallback(async () => {
    const playerToken = localStorage.getItem('player_token')
    if (!playerToken) return

    const store = useCharacterStore.getState()
    if (store.editMode || store.playerEditMode) return
    if (store.currentStep <= 0) return
    if (savingRef.current) return

    // SECURITY: Reset serverDraftId if inviteCodeId changed
    if (lastInviteCodeRef.current !== null && store.inviteCodeId !== lastInviteCodeRef.current) {
      store.setServerDraftId(null)
      lastJsonRef.current = ''
      console.log('[DraftSync] InviteCode changed, cleared serverDraftId')
    }
    lastInviteCodeRef.current = store.inviteCodeId

    const data = buildDraftData(store)
    const json = JSON.stringify(data)
    if (json === lastJsonRef.current) return

    savingRef.current = true
    try {
      const draftId = store.serverDraftId

      if (draftId) {
        // SECURITY: Save through player edge function — it verifies player_id ownership
        await playerSaveDraft(playerToken, draftId, data)
        lastJsonRef.current = json
        console.log('[DraftSync] Saved via API, step:', store.currentStep)
      } else if (store.inviteCodeId) {
        // No existing draft — create one through player edge function
        try {
          const result = await playerCreateDraft(playerToken, {
            invite_code_id: store.inviteCodeId,
            wizard_data: data,
          })
          if (result?.id) {
            store.setServerDraftId(result.id)
            lastJsonRef.current = json
            console.log('[DraftSync] Created draft:', result.id)
          }
        } catch (err) {
          console.warn('[DraftSync] Create draft failed:', err)
        }
      }
    } catch (err) {
      console.warn('[DraftSync] Save failed:', err)
    } finally {
      savingRef.current = false
    }
  }, [])

  // Subscribe to ALL store changes with 5s debounce
  useEffect(() => {
    const unsub = useCharacterStore.subscribe((state) => {
      if (state.currentStep <= 0) return
      if (state.editMode || state.playerEditMode) return

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(saveNow, 5000)
    })
    return () => {
      unsub()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [saveNow])

  // Immediate save on step change
  const currentStep = useCharacterStore((s) => s.currentStep)
  useEffect(() => {
    if (currentStep > 0) {
      lastJsonRef.current = '' // Force save
      saveNow()
    }
  }, [currentStep, saveNow])

  // Save when tab becomes hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        lastJsonRef.current = ''
        saveNow()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [saveNow])
}
