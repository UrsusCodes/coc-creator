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
  setLifestyle: (data: {
    housingId: string; transportId: string; lifestyleId: string;
    wealthFormIds: string[]; cashOnHand: number;
    cash: string; assets: string; spendingLevel: string;
    lokumOwnership?: 'rent' | 'own'; lokum2Id?: string; lokum2Ownership?: 'rent' | 'own' | '';
    transportStyleId?: string; assetBreakdown?: { type: string; percent: number; value: number }[];
    lifestyleRating?: number; lifestyleStars?: string; lifestyleLabel?: string;
    spendingFree?: string; catalogsAvailable?: string[]; presetUsed?: string;
  }) => void
  /** Update server-side invite code data without resetting character progress */
  updateInviteCodeMeta: (data: { timesUsed: number }) => void
  /** Abandon current character, increment timesUsed, reset character data, go to step 1 */
  abandonCharacter: () => void
  reset: () => void
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
        const prev = Math.max(0, s.currentStep - 1)
        return { currentStep: prev, savedStep: prev > 0 ? prev : s.savedStep }
      }),

      setInviteCode: (data) =>
        set({
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
          ...characterDataDefaults,
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
      version: 5,
      migrate: (persisted, version) => {
        // Version 0/1 → 2: combat skills restructured, wealth reworked
        if (version < 2) {
          const old = persisted as Record<string, unknown>
          return {
            ...initialState,
            inviteCodeId: old.inviteCodeId ?? null,
            inviteCode: old.inviteCode ?? null,
            methods: old.methods ?? [],
            method: old.method ?? null,
            era: old.era ?? null,
            perks: old.perks ?? [],
            maxTries: old.maxTries ?? 1,
            timesUsed: old.timesUsed ?? 0,
            maxSkillValue: old.maxSkillValue ?? 80,
            currentStep: 1,
            savedStep: 0,
          }
        }
        // Version 2 → 3: added playerName field
        if (version < 3) {
          const old = persisted as Record<string, unknown>
          return { ...old, playerName: (old.playerName as string) ?? '' }
        }
        // Version 3 → 4: wealth v2 fields
        if (version < 4) {
          const old = persisted as Record<string, unknown>
          return {
            ...old,
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
          const old = persisted as Record<string, unknown>
          // Remove safe_cash from wealthFormIds if present
          const wealthFormIds = (old.wealthFormIds as string[] ?? []).filter((id: string) => id !== 'safe_cash')
          return {
            ...old,
            wealthFormIds,
            mainPosition: null,
            additionalPositions: [],
            contactsV2: [],
            residence: (old.residence as string) ?? '',
            birthplace: (old.birthplace as string) ?? '',
          }
        }
        return persisted as WizardState
      },
    }
  )
)
