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
