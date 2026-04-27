import { useEffect, useRef, useCallback, useState } from 'react'
import { useCharacterStore } from '@/stores/characterStore'
import { playerSaveDraft, playerCreateDraft } from '@/lib/player'

export type DraftSyncStatus = 'idle' | 'saving' | 'saved' | 'error'

/**
 * Build the soft-zone draft payload. Hard-zone fields (characteristics, luck,
 * age, era, method, perks, max_skill_value) are server-canonical post v2.0 —
 * the edge function's /draft allowlist rejects them with 400. We mirror only
 * fields the soft zone owns (occupation+, narrative, derived snapshot,
 * draft_step progression).
 */
function buildDraftData(store: ReturnType<typeof useCharacterStore.getState>): Record<string, unknown> {
  return {
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
    draft_step: store.currentStep,
  }
}

/**
 * Hard-zone steps that own their state on the server through dedicated
 * commit endpoints (start-character / roll-characteristics / swap / set-age /
 * roll-edu / apply-aging-penalties / roll-luck). Autosave skips these — any
 * mutation that needs to land server-side has already been written by the
 * step component.
 */
const SOFT_ZONE_MIN_STEP = 8 // StepDerived and onwards

/**
 * Safe draft sync hook — saves wizard progress to server via player API.
 *
 * Security guarantees:
 * - ONLY saves through player edge function (verifies player_id ownership)
 * - NEVER writes directly to DB with anon key
 * - Validates serverDraftId belongs to current inviteCodeId before saving
 * - Resets serverDraftId on inviteCodeId change
 */
export function useDraftSync(): { status: DraftSyncStatus; retry: () => void } {
  const savingRef = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastJsonRef = useRef('')
  const lastInviteCodeRef = useRef<string | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [status, setStatus] = useState<DraftSyncStatus>('idle')

  const isLoggedIn = !!localStorage.getItem('player_token')

  const saveNow = useCallback(async () => {
    const playerToken = localStorage.getItem('player_token')
    if (!playerToken) return

    const store = useCharacterStore.getState()
    if (store.editMode || store.playerEditMode) return
    // Soft-zone autosave only. Hard-zone (steps 0-7) writes happen through
    // dedicated commit endpoints; PUT /draft would 400 on those fields.
    if (store.currentStep < SOFT_ZONE_MIN_STEP) return
    if (savingRef.current) return

    // SECURITY: Reset serverDraftId if inviteCodeId changed
    if (lastInviteCodeRef.current !== null && store.inviteCodeId !== lastInviteCodeRef.current) {
      store.setServerDraftId(null)
      lastJsonRef.current = ''
    }
    lastInviteCodeRef.current = store.inviteCodeId

    const data = buildDraftData(store)
    const json = JSON.stringify(data)
    if (json === lastJsonRef.current) return

    savingRef.current = true
    setStatus('saving')
    try {
      const draftId = store.serverDraftId

      if (draftId) {
        await playerSaveDraft(playerToken, draftId, data)
        lastJsonRef.current = json
      } else if (store.inviteCodeId) {
        const result = await playerCreateDraft(playerToken, {
          invite_code_id: store.inviteCodeId,
          wizard_data: data,
        })
        if (result?.id) {
          store.setServerDraftId(result.id)
          lastJsonRef.current = json
        } else {
          throw new Error('No draft ID returned')
        }
      }

      setStatus('saved')
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
      savedTimerRef.current = setTimeout(() => setStatus('idle'), 2500)
    } catch (err) {
      console.warn('[DraftSync] Save failed:', err)
      setStatus('error')
    } finally {
      savingRef.current = false
    }
  }, [])

  const retry = useCallback(() => {
    lastJsonRef.current = '' // Force save
    saveNow()
  }, [saveNow])

  // Subscribe to ALL store changes with 5s debounce
  useEffect(() => {
    const unsub = useCharacterStore.subscribe((state) => {
      if (state.currentStep < SOFT_ZONE_MIN_STEP) return
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

  // Cleanup
  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [])

  // If not logged in, no sync — always idle
  if (!isLoggedIn) return { status: 'idle', retry }

  return { status, retry }
}
