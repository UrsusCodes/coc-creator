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

export function useDraftSync() {
  const savingRef = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastJsonRef = useRef('')

  const saveNow = useCallback(async () => {
    const playerToken = localStorage.getItem('player_token')
    if (!playerToken) {
      console.warn('[DraftSync] No player token — skipping')
      return
    }

    const store = useCharacterStore.getState()
    if (store.editMode || store.playerEditMode) return
    if (store.currentStep <= 0) return
    if (savingRef.current) return

    const data = buildDraftData(store)
    const json = JSON.stringify(data)
    if (json === lastJsonRef.current) return

    savingRef.current = true
    try {
      let draftId = store.serverDraftId

      // If no serverDraftId, find existing draft in DB
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
          console.log('[DraftSync] Found existing draft:', draftId)
        }
      }

      if (draftId) {
        // Try player API first
        try {
          await playerSaveDraft(playerToken, draftId, data)
          console.log('[DraftSync] Saved via API, step:', store.currentStep)
        } catch {
          // Fallback: direct DB update (bypasses edge function auth issues)
          console.warn('[DraftSync] API failed, trying direct DB update')
          const { error } = await supabase
            .from('characters')
            .update(data)
            .eq('id', draftId)
          if (error) {
            console.error('[DraftSync] Direct DB update failed:', error.message)
          } else {
            console.log('[DraftSync] Saved via direct DB, step:', store.currentStep)
          }
        }
      } else if (store.inviteCodeId) {
        try {
          const result = await playerCreateDraft(playerToken, {
            invite_code_id: store.inviteCodeId,
            wizard_data: data,
          })
          if (result?.id) {
            store.setServerDraftId(result.id)
            console.log('[DraftSync] Created new draft:', result.id)
          }
        } catch (err) {
          console.error('[DraftSync] Failed to create draft:', err)
        }
      } else {
        console.warn('[DraftSync] No draftId and no inviteCodeId — cannot save')
      }

      lastJsonRef.current = json
    } catch (err) {
      console.error('[DraftSync] Unexpected error:', err)
    } finally {
      savingRef.current = false
    }
  }, [])

  // Subscribe to ALL store changes with 3-second debounce
  useEffect(() => {
    const unsub = useCharacterStore.subscribe(() => {
      const store = useCharacterStore.getState()
      if (store.currentStep <= 0) return
      if (store.editMode || store.playerEditMode) return

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(saveNow, 3000)
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
      lastJsonRef.current = '' // Reset to force save on step change
      saveNow()
    }
  }, [currentStep, saveNow])

  // Save when tab becomes hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        lastJsonRef.current = '' // Force save
        saveNow()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [saveNow])
}
