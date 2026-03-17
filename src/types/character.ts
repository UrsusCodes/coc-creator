import type { CharacteristicKey, Era, CreationMethod } from './common'

export type Characteristics = Record<CharacteristicKey, number>

export interface DerivedAttributes {
  hp: number
  mp: number
  san: number
  db: string
  build: number
  move_rate: number
  dodge: number
}

export interface Backstory {
  ideology: string
  significant_people_who: string
  significant_people_why: string
  meaningful_locations: string
  treasured_possessions: string
  traits: string
  appearance_description: string
  key_connection: string
  // Drive+Pillars variant fields
  drive?: string
  drive_detail?: string
  pillars?: string[]
  sources?: StabilitySource[]
  other_traits?: string
}

export interface StabilitySource {
  name: string
  category: 'person' | 'place' | 'organization'
  description: string
}

export interface CharacterPosition {
  description: string
  category: string
  weight: number
  weightDisplay: string
  rollValue: number
  custom: boolean
  pendingSt: boolean
}

export interface CharacterContact {
  subcategory: string
  category: string
  strength: number
  strengthDisplay: string
  rollValue: number
  synergyBonus: number
  custom: boolean
  customName: string
  pendingSt: boolean
}

export interface AssetBreakdown {
  type: string
  percent: number
  value: number
}

export interface CharacterData {
  id?: string
  invite_code_id: string
  status: 'draft' | 'submitted'
  name: string
  age: number
  gender: string
  appearance: string
  characteristics: Characteristics
  luck: number
  derived: DerivedAttributes
  occupation_id: string
  occupation_skill_points: Record<string, number>
  personal_skill_points: Record<string, number>
  backstory: Backstory
  equipment: string[]
  cash: string
  assets: string
  spending_level: string
  era: Era
  method: CreationMethod
  player_name?: string
  invite_code?: string
  admin_notes?: string
  created_at?: string
  updated_at?: string
  // Positions & Contacts
  positions?: CharacterPosition[]
  contacts?: CharacterContact[]
  // Wealth v2 fields
  lifestyle_rating?: number
  lifestyle_stars?: string
  lifestyle_label?: string
  spending_free?: string
  assets_breakdown?: AssetBreakdown[]
  equipment_catalogs_available?: string[]
}

export interface ShareToken {
  id: string
  character_id: string
  token: string
  type: 'view' | 'edit'
  created_at: string
}

export interface HistoryEntry {
  id: string
  character_id: string
  snapshot: CharacterData
  changed_by: string
  change_comment: string
  created_at: string
}
