import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Characteristics, DerivedAttributes, Backstory, CharacterData, CharacterPosition, CharacterContact, MainPosition, AdditionalPosition, ContactV2 } from '@/types/character'
import type { Era, CreationMethod } from '@/types/common'

export interface WizardState {
  // Current step (0-indexed)
  currentStep: number
  // Saved step for resume after page refresh
  savedStep: number

  // Invite code data
  inviteCodeId: string | null
  inviteCode: string | null
  methods: CreationMethod[]
  method: CreationMethod | null
  era: Era | null
  perks: string[]
  maxTries: number
  timesUsed: number
  maxSkillValue: number

  // Step 2: Basic info
  playerName: string
  name: string
  age: number | null
  gender: string
  appearance: string

  // Step 3: Characteristics
  characteristics: Partial<Characteristics>
  luck: number | null

  // Step 5: Derived (auto-calculated, stored for convenience)
  derived: DerivedAttributes | null

  // Step 6: Occupation
  occupationId: string | null

  // Step 11: Basic info extras
  residence: string
  birthplace: string

  // Step 7-8: Skill points
  occupationSkillPoints: Record<string, number>
  personalSkillPoints: Record<string, number>

  // Step 9: Positions & Contacts (legacy v1)
  positions: CharacterPosition[]
  contacts: CharacterContact[]
  // Step 9: Positions & Contacts (v2)
  mainPosition: MainPosition | null
  additionalPositions: AdditionalPosition[]
  contactsV2: ContactV2[]

  // Step 10: Backstory
  backstory: Partial<Backstory>

  // Portrait
  portraitUrl: string

  // Step 10: Equipment & Wealth
  equipment: string[]
  customItems: string[]
  housingId: string
  transportId: string
  lifestyleId: string
  wealthFormIds: string[]
  cashOnHand: number
  // Display strings (kept for DB backward compatibility)
  cash: string
  assets: string
  spendingLevel: string
  // Wealth v2 fields
  lokumOwnership: 'rent' | 'own'
  lokum2Id: string
  lokum2Ownership: 'rent' | 'own' | ''
  transportStyleId: string
  assetBreakdown: { type: string; percent: number; value: number }[]
  lifestyleRating: number
  lifestyleStars: string
  lifestyleLabel: string
  spendingFree: string
  catalogsAvailable: string[]
  presetUsed: string

  // Edit mode fields
  editMode: 'lore' | 'standard' | 'full' | null
  editCharacterId: string | null
  originalSnapshot: Record<string, unknown> | null

  // Player-centric edit fields
  playerEditMode: 'lore' | 'standard' | 'full' | null
  playerEditCharacterId: string | null
  isDraftContinuation: boolean
  draftLockedStep: number | null

  // Server-side draft ID (for wizard auto-save)
  serverDraftId: string | null

  // Server-authoritative snapshot of the character (granular commits flow).
  // Set by WizardShell on mount/after each commit, read by hard-zone steps
  // for swap_available/swap_used/*_committed_at/edu_rolls/rerolls_remaining.
  serverCharacter: CharacterData | null

  // Action to load character for player-centric editing
  loadForPlayerEdit: (data: {
    characterId: string
    editMode: 'lore' | 'standard' | 'full'
    character: Record<string, unknown>
    era: string
    perks: string[]
    maxSkillValue: number
  }) => void

  // Action to load a draft for continuation
  loadDraftForContinuation: (data: {
    character: Record<string, unknown>
    era: string
    perks: string[]
    maxSkillValue: number
    lockedStep: number
    inviteCodeId: string
    inviteCode: string
    method: string
  }) => void

  // Actions
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  setInviteCode: (data: { id: string; code: string; methods: CreationMethod[]; method: CreationMethod | null; era: Era; perks: string[]; maxTries: number; timesUsed: number; maxSkillValue: number }) => void
  setMethod: (method: CreationMethod) => void
  setAge: (age: number) => void
  setBasicInfo: (data: { playerName: string; name: string; gender: string; appearance: string; residence?: string; birthplace?: string }) => void
  setCharacteristics: (chars: Partial<Characteristics>) => void
  setLuck: (luck: number) => void
  setDerived: (derived: DerivedAttributes) => void
  setOccupation: (id: string) => void
  setOccupationSkillPoints: (points: Record<string, number>) => void
  setPersonalSkillPoints: (points: Record<string, number>) => void
  setPositionsAndContacts: (positions: CharacterPosition[], contacts: CharacterContact[]) => void
  setMainPosition: (pos: MainPosition) => void
  setPositionsAndContactsV2: (positions: AdditionalPosition[], contacts: ContactV2[]) => void
  setBackstory: (backstory: Partial<Backstory>) => void
  setEquipment: (equipment: string[]) => void
  setCustomItems: (items: string[]) => void
  setPortraitUrl: (url: string) => void
  setLifestyle: (data: {
    housingId: string; transportId: string; lifestyleId: string;
    wealthFormIds: string[]; cashOnHand: number;
    cash: string; assets: string; spendingLevel: string;
    lokumOwnership?: 'rent' | 'own'; lokum2Id?: string; lokum2Ownership?: 'rent' | 'own' | '';
    transportStyleId?: string; assetBreakdown?: { type: string; percent: number; value: number }[];
    lifestyleRating?: number; lifestyleStars?: string; lifestyleLabel?: string;
    spendingFree?: string; catalogsAvailable?: string[]; presetUsed?: string;
  }) => void
  /** Set the server-side draft ID for auto-save */
  setServerDraftId: (id: string | null) => void
  /** Replace the server-authoritative character snapshot. */
  setServerCharacter: (char: CharacterData | null) => void
  /** Update server-side invite code data without resetting character progress */
  updateInviteCodeMeta: (data: { timesUsed: number }) => void
  /** Abandon current character, increment timesUsed, reset character data, go to step 1 */
  abandonCharacter: () => void
  reset: () => void
}

const editModeDefaults = {
  editMode: null as 'lore' | 'standard' | 'full' | null,
  editCharacterId: null as string | null,
  originalSnapshot: null as Record<string, unknown> | null,
  playerEditMode: null as 'lore' | 'standard' | 'full' | null,
  playerEditCharacterId: null as string | null,
  isDraftContinuation: false,
  draftLockedStep: null as number | null,
  serverDraftId: null as string | null,
  serverCharacter: null as CharacterData | null,
}

const characterDataDefaults = {
  playerName: '',
  name: '',
  age: null,
  gender: '',
  appearance: '',
  residence: '',
  birthplace: '',
  characteristics: {},
  luck: null,
  derived: null,
  occupationId: null,
  occupationSkillPoints: {},
  personalSkillPoints: {},
  positions: [],
  contacts: [],
  mainPosition: null,
  additionalPositions: [],
  contactsV2: [],
  backstory: {},
  portraitUrl: '',
  equipment: [],
  customItems: [],
  housingId: '',
  transportId: '',
  lifestyleId: '',
  wealthFormIds: [],
  cashOnHand: 0,
  cash: '',
  assets: '',
  spendingLevel: '',
  lokumOwnership: 'rent' as const,
  lokum2Id: '',
  lokum2Ownership: '' as const,
  transportStyleId: '',
  assetBreakdown: [],
  lifestyleRating: 0,
  lifestyleStars: '',
  lifestyleLabel: '',
  spendingFree: '',
  catalogsAvailable: ['standard'],
  presetUsed: '',
}

const initialState = {
  currentStep: 0,
  savedStep: 0,
  inviteCodeId: null,
  inviteCode: null,
  methods: [],
  method: null,
  era: null,
  perks: [],
  maxTries: 1,
  timesUsed: 0,
  maxSkillValue: 80,
  ...editModeDefaults,
  ...characterDataDefaults,
}

export function getAllowedSteps(level: 'lore' | 'standard' | 'full'): number[] {
  if (level === 'lore') return [10, 11, 12]
  if (level === 'standard') return [5, 6, 7, 8, 9, 10, 11, 12]
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
}

export const useCharacterStore = create<WizardState>()(
  persist(
    (set) => ({
      ...initialState,

      setStep: (step) => set((s) => ({
        currentStep: step,
        // When navigating away from step 0, save the step for resume
        savedStep: step > 0 ? step : s.savedStep,
      })),
      nextStep: () => set((s) => {
        const level = s.playerEditMode ?? s.editMode
        if (level) {
          const allowed = getAllowedSteps(level)
          const next = allowed.find(step => step > s.currentStep)
          if (next !== undefined) return { currentStep: next, savedStep: next }
          return {}
        }
        return { currentStep: s.currentStep + 1, savedStep: s.currentStep + 1 }
      }),
      prevStep: () => set((s) => {
        const level = s.playerEditMode ?? s.editMode
        if (level) {
          const allowed = getAllowedSteps(level)
          const prev = [...allowed].reverse().find(step => step < s.currentStep)
          if (prev !== undefined) return { currentStep: prev, savedStep: prev }
          return {}
        }
        const minStep = s.isDraftContinuation && s.draftLockedStep != null ? s.draftLockedStep + 1 : 0
        const prev = Math.max(minStep, s.currentStep - 1)
        return { currentStep: prev, savedStep: prev > 0 ? prev : s.savedStep }
      }),

      setInviteCode: (data) =>
        set({
          ...editModeDefaults,
          ...characterDataDefaults,
          inviteCodeId: data.id,
          inviteCode: data.code,
          methods: data.methods,
          method: data.method,
          era: data.era,
          perks: data.perks,
          maxTries: data.maxTries,
          timesUsed: data.timesUsed,
          maxSkillValue: data.maxSkillValue,
          // A new code means a new flow — start at step 0 (StepInviteCode).
          // Without this, a leftover currentStep from a previous code/user
          // pointed the wizard at the middle of a different draft.
          currentStep: 0,
          savedStep: 0,
        }),

      setMethod: (method) => set({ method }),
      setAge: (age) => set({ age }),

      setBasicInfo: (data) =>
        set({
          playerName: data.playerName,
          name: data.name,
          gender: data.gender,
          appearance: data.appearance,
          ...(data.residence !== undefined && { residence: data.residence }),
          ...(data.birthplace !== undefined && { birthplace: data.birthplace }),
        }),

      setCharacteristics: (chars) => set({ characteristics: chars }),
      setLuck: (luck) => set({ luck }),
      setDerived: (derived) => set({ derived }),
      setOccupation: (id) =>
        set({ occupationId: id, occupationSkillPoints: {}, personalSkillPoints: {} }),

      setOccupationSkillPoints: (points) => set({ occupationSkillPoints: points }),
      setPersonalSkillPoints: (points) => set({ personalSkillPoints: points }),
      setPositionsAndContacts: (positions, contacts) => set({ positions, contacts }),
      setMainPosition: (pos) => set({ mainPosition: pos }),
      setPositionsAndContactsV2: (positions, contacts) => set({ additionalPositions: positions, contactsV2: contacts }),
      setBackstory: (backstory) => set((s) => ({ backstory: { ...s.backstory, ...backstory } })),
      setEquipment: (equipment) => set({ equipment }),
      setCustomItems: (items) => set({ customItems: items }),
      setPortraitUrl: (url) => set({ portraitUrl: url }),
      setLifestyle: (data) =>
        set({
          housingId: data.housingId,
          transportId: data.transportId, lifestyleId: data.lifestyleId,
          wealthFormIds: data.wealthFormIds, cashOnHand: data.cashOnHand,
          cash: data.cash, assets: data.assets, spendingLevel: data.spendingLevel,
          ...(data.lokumOwnership !== undefined && { lokumOwnership: data.lokumOwnership }),
          ...(data.lokum2Id !== undefined && { lokum2Id: data.lokum2Id }),
          ...(data.lokum2Ownership !== undefined && { lokum2Ownership: data.lokum2Ownership }),
          ...(data.transportStyleId !== undefined && { transportStyleId: data.transportStyleId }),
          ...(data.assetBreakdown !== undefined && { assetBreakdown: data.assetBreakdown }),
          ...(data.lifestyleRating !== undefined && { lifestyleRating: data.lifestyleRating }),
          ...(data.lifestyleStars !== undefined && { lifestyleStars: data.lifestyleStars }),
          ...(data.lifestyleLabel !== undefined && { lifestyleLabel: data.lifestyleLabel }),
          ...(data.spendingFree !== undefined && { spendingFree: data.spendingFree }),
          ...(data.catalogsAvailable !== undefined && { catalogsAvailable: data.catalogsAvailable }),
          ...(data.presetUsed !== undefined && { presetUsed: data.presetUsed }),
        }),

      loadForPlayerEdit: (data) =>
        set(() => {
          const char = data.character
          // After v2.0 the wizard uses 17 logical steps (granular commits).
          // Edit-mode entry points stay roughly equivalent: lore→backstory,
          // standard→occupation, full→identifier (lets full-edit users tweak
          // identifier + characteristics without going through invite_code).
          const startStep = data.editMode === 'lore'
            ? 14
            : data.editMode === 'standard'
              ? 9
              : 1
          return {
            // Reset to clean state first
            ...initialState,
            // Player edit mode metadata
            playerEditMode: data.editMode,
            playerEditCharacterId: data.characterId,
            editMode: data.editMode,
            editCharacterId: data.characterId,
            originalSnapshot: char,
            // Wizard navigation: start at the appropriate step for edit level
            currentStep: startStep,
            savedStep: startStep,
            // Invite-code-equivalent fields from character
            era: (char.era as import('@/types/common').Era) ?? null,
            perks: (char.perks as string[]) ?? data.perks,
            maxSkillValue: data.maxSkillValue,
            method: (char.method as import('@/types/common').CreationMethod) ?? 'direct',
            // Map character DB fields to wizard store fields
            playerName: (char.player_name as string) ?? '',
            name: (char.name as string) ?? '',
            age: (char.age as number) ?? null,
            gender: (char.gender as string) ?? '',
            appearance: (char.appearance as string) ?? '',
            residence: (char.residence as string) ?? '',
            birthplace: (char.birthplace as string) ?? '',
            characteristics: (char.characteristics as import('@/types/character').Characteristics) ?? {},
            luck: (char.luck as number) ?? null,
            derived: (char.derived as import('@/types/character').DerivedAttributes) ?? null,
            occupationId: (char.occupation_id as string) ?? null,
            occupationSkillPoints: (char.occupation_skill_points as Record<string, number>) ?? {},
            personalSkillPoints: (char.personal_skill_points as Record<string, number>) ?? {},
            backstory: (char.backstory as import('@/types/character').Backstory) ?? {},
            mainPosition: (char.main_position as import('@/types/character').MainPosition) ?? null,
            additionalPositions: (char.additional_positions as import('@/types/character').AdditionalPosition[]) ?? [],
            contactsV2: (char.contacts_v2 as import('@/types/character').ContactV2[]) ?? [],
            portraitUrl: (char.portrait_url as string) ?? '',
            // Equipment: strip system-prefixed items, keep regular ones
            equipment: ((char.equipment as string[]) ?? []).filter(
              (e: string) => !e.startsWith('[Mieszkanie]') && !e.startsWith('[Transport]') && !e.startsWith('[Styl życia]')
            ),
            customItems: [],
            // Wealth fields from DB
            lifestyleRating: (char.lifestyle_rating as number) ?? 0,
            lifestyleStars: (char.lifestyle_stars as string) ?? '',
            lifestyleLabel: (char.lifestyle_label as string) ?? '',
            spendingLevel: (char.spending_level as string) ?? '',
            spendingFree: (char.spending_free as string) ?? '',
            cash: (char.cash as string) ?? '',
            assets: (char.assets as string) ?? '',
          }
        }),

      loadDraftForContinuation: (data) =>
        set(() => {
          const char = data.character
          // After granular commits, draft_step is the canonical resume point.
          // Falls back to step 1 (Identifier) if we have a draft but no saved
          // step (legacy data). Locked-step ranges no longer apply — server
          // commit timestamps gate forward progress per step.
          const savedStep = (char.draft_step as number) ?? 1
          const startStep = Math.max(1, savedStep)
          return {
            // Reset to clean state first
            ...initialState,
            // Draft continuation metadata
            isDraftContinuation: true,
            draftLockedStep: data.lockedStep,
            serverDraftId: (char.id as string) ?? null,
            inviteCodeId: data.inviteCodeId,
            inviteCode: data.inviteCode,
            method: data.method as import('@/types/common').CreationMethod,
            era: data.era as import('@/types/common').Era,
            perks: data.perks,
            maxSkillValue: data.maxSkillValue,
            methods: [data.method as import('@/types/common').CreationMethod],
            currentStep: startStep,
            savedStep: startStep,
            // Map character DB fields to wizard store fields
            playerName: (char.player_name as string) ?? '',
            name: (char.name as string) ?? '',
            age: (char.age as number) ?? null,
            gender: (char.gender as string) ?? '',
            appearance: (char.appearance as string) ?? '',
            residence: (char.residence as string) ?? '',
            birthplace: (char.birthplace as string) ?? '',
            characteristics: (char.characteristics as import('@/types/character').Characteristics) ?? {},
            luck: (char.luck as number) ?? null,
            derived: (char.derived as import('@/types/character').DerivedAttributes) ?? null,
            occupationId: (char.occupation_id as string) ?? null,
            occupationSkillPoints: (char.occupation_skill_points as Record<string, number>) ?? {},
            personalSkillPoints: (char.personal_skill_points as Record<string, number>) ?? {},
            backstory: (char.backstory as import('@/types/character').Backstory) ?? {},
            mainPosition: (char.main_position as import('@/types/character').MainPosition) ?? null,
            additionalPositions: (char.additional_positions as import('@/types/character').AdditionalPosition[]) ?? [],
            contactsV2: (char.contacts_v2 as import('@/types/character').ContactV2[]) ?? [],
            portraitUrl: (char.portrait_url as string) ?? '',
            // Equipment: strip system-prefixed items, keep regular ones
            equipment: ((char.equipment as string[]) ?? []).filter(
              (e: string) => !e.startsWith('[Mieszkanie]') && !e.startsWith('[Transport]') && !e.startsWith('[Styl życia]')
            ),
            customItems: [],
            // Wealth fields from DB
            lifestyleRating: (char.lifestyle_rating as number) ?? 0,
            lifestyleStars: (char.lifestyle_stars as string) ?? '',
            lifestyleLabel: (char.lifestyle_label as string) ?? '',
            spendingLevel: (char.spending_level as string) ?? '',
            spendingFree: (char.spending_free as string) ?? '',
            cash: (char.cash as string) ?? '',
            assets: (char.assets as string) ?? '',
          }
        }),

      setServerDraftId: (id) => set({ serverDraftId: id }),

      setServerCharacter: (char) => set({ serverCharacter: char }),

      updateInviteCodeMeta: (data) => set({ timesUsed: data.timesUsed }),

      abandonCharacter: () =>
        set((s) => ({
          currentStep: 1,
          inviteCodeId: s.inviteCodeId,
          inviteCode: s.inviteCode,
          methods: s.methods,
          method: s.method,
          era: s.era,
          perks: s.perks,
          maxTries: s.maxTries,
          timesUsed: s.timesUsed + 1,
          maxSkillValue: s.maxSkillValue,
          ...characterDataDefaults,
        })),

      reset: () => set(initialState),
    }),
    {
      name: 'coc-character-wizard',
      version: 10,
      migrate: (persisted, version) => {
        let state = persisted as Record<string, unknown>

        // Version 0/1 → 2: combat skills restructured, wealth reworked
        if (version < 2) {
          state = {
            ...initialState,
            inviteCodeId: state.inviteCodeId ?? null,
            inviteCode: state.inviteCode ?? null,
            methods: state.methods ?? [],
            method: state.method ?? null,
            era: state.era ?? null,
            perks: state.perks ?? [],
            maxTries: state.maxTries ?? 1,
            timesUsed: state.timesUsed ?? 0,
            maxSkillValue: state.maxSkillValue ?? 80,
            currentStep: 1,
            savedStep: 0,
          }
        }
        // Version 2 → 3: added playerName field
        if (version < 3) {
          state = { ...state, playerName: (state.playerName as string) ?? '' }
        }
        // Version 3 → 4: wealth v2 fields
        if (version < 4) {
          state = {
            ...state,
            lokumOwnership: 'rent',
            lokum2Id: '',
            lokum2Ownership: '',
            transportStyleId: '',
            assetBreakdown: [],
            lifestyleRating: 0,
            lifestyleStars: '',
            lifestyleLabel: '',
            spendingFree: '',
            catalogsAvailable: ['standard'],
            presetUsed: '',
          }
        }
        // Version 4 → 5: positions v2, contacts v2, clean stale data
        if (version < 5) {
          const wealthFormIds = (state.wealthFormIds as string[] ?? []).filter((id: string) => id !== 'safe_cash')
          state = {
            ...state,
            wealthFormIds,
            mainPosition: null,
            additionalPositions: [],
            contactsV2: [],
            residence: (state.residence as string) ?? '',
            birthplace: (state.birthplace as string) ?? '',
          }
        }
        // Version 5 → 6: player-centric edit fields
        if (version < 6) {
          state = {
            ...state,
            playerEditMode: null,
            playerEditCharacterId: null,
            isDraftContinuation: false,
            draftLockedStep: null,
          }
        }
        // Version 6 → 7 → 8: server-side draft auto-save
        if (version < 8) {
          state = {
            ...state,
            serverDraftId: (state.serverDraftId as string) ?? null,
          }
        }
        // Version 8 → 9: remove editToken (edit system v2)
        if (version < 9) {
          state = { ...state }
          delete (state as Record<string, unknown>).editToken
        }
        // Version 9 → 10: granular commits (v2.0). Step numbering changed
        // completely (StepIdentifier inserted at index 1, StepAgeModifiers
        // split into EduRolls + AgingPenalties), so any saved currentStep
        // pointing into the old numbering is meaningless. Reset to step 0
        // and let the user re-validate the invite code. Drop stale local
        // lock/scratch fields (server commit timestamps replace them).
        if (version < 10) {
          state = { ...state }
          for (const k of [
            'characteristicsLocked',
            'characteristicSwap',
            'ageLocked',
            'ageModifiersLocked',
            'ageDeductions',
            'eduRolls',
            'eduAfterRolls',
          ]) {
            delete (state as Record<string, unknown>)[k]
          }
          state = {
            ...state,
            currentStep: 0,
            savedStep: 0,
            serverCharacter: null,
            serverDraftId: (state.serverDraftId as string) ?? null,
          }
        }
        return state as unknown as WizardState
      },
    }
  )
)

// Draft sync is handled by useDraftSync hook in WizardShell (safe, with ownership checks)
