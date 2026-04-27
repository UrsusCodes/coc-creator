import type { Era, CreationMethod } from './common'

export interface InviteCode {
  id: string
  code: string
  method: CreationMethod
  methods: CreationMethod[]
  era: Era
  max_tries: number
  times_used: number
  is_active: boolean
  perks: string[]
  max_skill_value: number
  created_at: string
  // Code identity rework (migration 018)
  label?: string
  reroll_budget?: number
  assigned_player_id?: string | null
}

/** Lifecycle bucket derived from the linked character (none/draft/submitted). */
export type InviteCodeStatus = 'unused' | 'started' | 'finished'
