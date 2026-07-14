import type { Era, CreationMethod } from './common'

/**
 * Per-code roll options (migration 026). Constrains how the server rolls the
 * eight characteristics for this code — on the first roll (`initial`) and on
 * each reroll (`rerolls[index]`, index 0 = first reroll; last entry reused for
 * further rerolls). Undefined/null = unconstrained roll (default behaviour).
 * Resolution is entirely server-side; only the generic engine ships to clients.
 */
export interface RollConstraint {
  fixed?: number | null
  min?: number | null
  max?: number | null
}
export interface RollProfile {
  chars?: Partial<Record<string, RollConstraint>>
  avgMin?: number | null
  avgMax?: number | null
}
export interface RollOptions {
  initial?: RollProfile | null
  rerolls?: (RollProfile | null)[] | null
  // Constraint on the Luck roll (global — applies to every luck roll on this
  // code, including after a reroll). Undefined/null = unconstrained.
  luck?: RollConstraint | null
}

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
  // Optional ceilings (migration 022). NULL/undefined = no ceiling.
  max_wealth?: number | null
  max_luck?: number | null
  // Per-code roll options (migration 026). NULL/undefined = unconstrained.
  roll_options?: RollOptions | null
}

/** Lifecycle bucket derived from the linked character (none/draft/submitted). */
export type InviteCodeStatus = 'unused' | 'started' | 'finished'
