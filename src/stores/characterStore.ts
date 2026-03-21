import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Characteristics, DerivedAttributes, Backstory, CharacterPosition, CharacterContact, MainPosition, AdditionalPosition, ContactV2 } from '@/types/character'
import type { Era, CreationMethod, CharacteristicKey } from '@/types/common'

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

  // Step 3 lock: characteristics + luck are locked after proceeding
  characteristicsLocked: boolean
  // Swap characteristics perk
  characteristicSwap: { from: CharacteristicKey; to: CharacteristicKey } | null

  // Age + age modifiers lock
  ageLocked: boolean
  ageModifiersLocked: boolean

  // Step 4: Age deductions (player distributes deduction points)
  ageDeductions: Partial<Record<CharacteristicKey, number>>
  // EDU improvement rolls are permanent once rolled
  eduRolls: { roll: number; improved: boolean; newEdu: number }[]
  eduAfterRolls: number | null

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
  editMode: 'standard' | 'full' | null
  editCharacterId: string | null
  editToken: string | null
  originalSnapshot: Record<string, unknown> | null

  // Player-centric edit fields
  playerEditMode: 'standard' | 'full' | null
  playerEditCharacterId: string | null
  isDraftContinuation: boolean
  draftLockedStep: number | null

  // Server-side draft ID (for wizard auto-save)
  serverDraftId: string | null

  // Action to load character for editing
  loadForEdit: (data: {
    characterId: string
    token: string
    editMode: 'standard' | 'full'
    character: Record<string, unknown>
    era: string
    perks: string[]
    maxSkillValue: number
  }) => void

  // Action to load character for player-centric editing
  loadForPlayerEdit: (data: {
    characterId: string
    editMode: 'standard' | 'full'
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
  setAgeDeductions: (deductions: Partial<Record<CharacteristicKey, number>>) => void
  lockCharacteristics: () => void
  lockAge: () => void
  lockAgeModifiers: () => void
  setEduRolls: (rolls: { roll: number; improved: boolean; newEdu: number }[], eduAfter: number) => void
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
  /** Update server-side invite code data without resetting character progress */
  updateInviteCodeMeta: (data: { timesUsed: number }) => void
  /** Abandon current character, increment timesUsed, reset character data, go to step 1 */
  abandonCharacter: () => void
  reset: () => void
}

const editModeDefaults = {
  editMode: null as 'standard' | 'full' | null,
  editCharacterId: null as string | null,
  editToken: null as string | null,
  originalSnapshot: null as Record<string, unknown> | null,
  playerEditMode: null as 'standard' | 'full' | null,
  playerEditCharacterId: null as string | null,
  isDraftContinuation: false,
  draftLockedStep: null as number | null,
  serverDraftId: null as string | null,
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
  characteristicsLocked: false,
  characteristicSwap: null,
  ageLocked: false,
  ageModifiersLocked: false,
  ageDeductions: {},
  eduRolls: [],
  eduAfterRolls: null,
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

export const useCharacterStore = create<WizardState>()(
  persist(
    (set) => ({
      ...initialState,

      setStep: (step) => set((s) => ({
        currentStep: step,
        // When navigating away from step 0, save the step for resume
        savedStep: step > 0 ? step : s.savedStep,
      })),
      nextStep: () => set((s) => ({ currentStep: s.currentStep + 1, savedStep: s.currentStep + 1 })),
      prevStep: () => set((s) => {
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
      setAgeDeductions: (deductions) => set({ ageDeductions: deductions }),
      lockCharacteristics: () => set({ characteristicsLocked: true }),
      lockAge: () => set({ ageLocked: true }),
      lockAgeModifiers: () => set({ ageModifiersLocked: true }),
      setEduRolls: (rolls, eduAfter) => set({ eduRolls: rolls, eduAfterRolls: eduAfter }),
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

      loadForEdit: (data) =>
        set(() => {
          const char = data.character
          const isStandard = data.editMode === 'standard'
          return {
            // Reset to clean state first
            ...initialState,
            // Edit mode metadata
            editMode: data.editMode,
            editCharacterId: data.characterId,
            editToken: data.token,
            originalSnapshot: char,
            // Wizard navigation: skip step 0
            currentStep: 1,
            savedStep: 1,
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
            // Locks: standard mode locks steps 1-3, full mode leaves them open
            characteristicsLocked: isStandard,
            ageLocked: isStandard,
            ageModifiersLocked: isStandard,
            // Age deductions already baked into characteristics in DB
            ageDeductions: {},
            eduRolls: [],
            eduAfterRolls: null,
          }
        }),

      loadForPlayerEdit: (data) =>
        set(() => {
          const char = data.character
          const isStandard = data.editMode === 'standard'
          return {
            // Reset to clean state first
            ...initialState,
            // Player edit mode metadata
            playerEditMode: data.editMode,
            playerEditCharacterId: data.characterId,
            editMode: data.editMode,
            editCharacterId: data.characterId,
            originalSnapshot: char,
            // Wizard navigation: skip step 0
            currentStep: 1,
            savedStep: 1,
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
            // Locks: standard mode locks steps 1-3, full mode leaves them open
            characteristicsLocked: isStandard,
            ageLocked: isStandard,
            ageModifiersLocked: isStandard,
            // Age deductions already baked into characteristics in DB
            ageDeductions: {},
            eduRolls: [],
            eduAfterRolls: null,
          }
        }),

      loadDraftForContinuation: (data) =>
        set(() => {
          const char = data.character
          // Resume from the furthest point: either past locked steps or saved draft_step
          const minStep = data.lockedStep < 0 ? 1 : data.lockedStep + 1
          const savedStep = (char.draft_step as number) ?? 0
          const startStep = Math.max(minStep, savedStep)
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
            characteristicsLocked: data.lockedStep >= 0,
            ageLocked: data.lockedStep >= 2,
            ageModifiersLocked: data.lockedStep >= 3,
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
            // Age deductions already baked into characteristics in DB
            ageDeductions: {},
            eduRolls: [],
            eduAfterRolls: null,
          }
        }),

      setServerDraftId: (id) => set({ serverDraftId: id }),

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
      version: 8,
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
        return state as unknown as WizardState
      },
    }
  )
)

// Draft sync is handled by useDraftSync hook in WizardShell (safe, with ownership checks)
