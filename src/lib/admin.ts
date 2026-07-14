import type { RollOptions } from '@/types/invite'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

/**
 * Make an authenticated admin API call through the Supabase Edge Function.
 * The Edge Function validates the admin password and proxies the request using service_role.
 */
export async function adminFetch(
  path: string,
  password: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${SUPABASE_URL}/functions/v1/admin${path}`
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'X-Admin-Password': password,
      ...options.headers,
    },
  })
}

export async function adminGetCodes(password: string) {
  const res = await adminFetch('/codes', password)
  if (!res.ok) throw new Error('Błąd pobierania kodów')
  return res.json()
}

export async function adminCreateCode(
  password: string,
  data: {
    methods: string[]
    era: string
    max_tries: number
    code: string
    perks: string[]
    max_skill_value?: number
    // Code identity rework (migration 018)
    label?: string
    reroll_budget?: number
    assigned_player_id?: string | null
    // Optional ceilings (migration 022)
    max_wealth?: number | null
    max_luck?: number | null
    // Per-code roll options (migration 026)
    roll_options?: RollOptions | null
  },
) {
  const res = await adminFetch('/codes', password, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Błąd tworzenia kodu')
  return res.json()
}

export async function adminDeleteCode(password: string, codeId: string) {
  const res = await adminFetch(`/codes/${codeId}`, password, { method: 'DELETE' })
  if (!res.ok) throw new Error('Błąd usuwania kodu')
  return res.json()
}

/**
 * Patch invite code metadata. Edge function enforces an allowlist (label,
 * reroll_budget, assigned_player_id, perks, max_skill_value, era, methods,
 * is_active). Returns the updated code row.
 */
export async function adminUpdateInviteCode(
  password: string,
  codeId: string,
  data: Partial<{
    label: string
    reroll_budget: number
    assigned_player_id: string | null
    perks: string[]
    max_skill_value: number
    max_wealth: number | null
    max_luck: number | null
    roll_options: RollOptions | null
    era: string
    methods: string[]
    is_active: boolean
  }>,
) {
  const res = await adminFetch(`/codes/${codeId}`, password, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Błąd aktualizacji kodu' }))
    throw new Error(err.error ?? 'Błąd aktualizacji kodu')
  }
  return res.json()
}

/**
 * Cleanup unused codes — codes with no linked character. Codes linked to
 * submitted characters are preserved (FK CASCADE would destroy approved
 * chars). Pass dry_run=true to preview.
 */
export async function adminCleanupCodes(
  password: string,
  options: { dryRun?: boolean } = {},
): Promise<{ dry_run?: boolean; deleted?: number; to_delete?: unknown[]; codes: unknown[]; count?: number }> {
  const res = await adminFetch('/codes/cleanup', password, {
    method: 'POST',
    body: JSON.stringify({ dry_run: options.dryRun === true }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Błąd czyszczenia kodów' }))
    throw new Error(err.error ?? 'Błąd czyszczenia kodów')
  }
  return res.json()
}

/**
 * Grant additional reroll tokens to a character. Atomically increments
 * rerolls_remaining via the grant_reroll RPC.
 */
export async function adminGrantReroll(
  password: string,
  charId: string,
  count = 1,
): Promise<{ id: string; rerolls_remaining: number; new_remaining: number }> {
  const res = await adminFetch(`/characters/${charId}/grant-reroll`, password, {
    method: 'POST',
    body: JSON.stringify({ count }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Błąd przyznawania przerzutu' }))
    throw new Error(err.error ?? 'Błąd przyznawania przerzutu')
  }
  return res.json()
}

export async function adminGetCharacters(password: string) {
  const res = await adminFetch('/characters', password)
  if (!res.ok) throw new Error('Błąd pobierania postaci')
  return res.json()
}

export async function adminDeleteCharacter(password: string, charId: string) {
  const res = await adminFetch(`/characters/${charId}`, password, { method: 'DELETE' })
  if (!res.ok) throw new Error('Błąd usuwania postaci')
  return res.json()
}

export async function adminUpdateCharacter(password: string, charId: string, data: Record<string, unknown>) {
  const res = await adminFetch(`/characters/${charId}`, password, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Błąd aktualizacji postaci')
  return res.json()
}

// ── AI prompt enhancement (Gemini text mode, free tier) ──
// Mirrors playerEnhancePrompt but admin-authenticated. Used by the
// portrait panel embedded in ArtPromptSection.

export interface AdminEnhancePromptArgs {
  rawPrompt: string
  visualCues?: string
  occupationEn?: string
}

export async function adminEnhancePrompt(
  password: string,
  charId: string,
  args: AdminEnhancePromptArgs,
): Promise<{ enhancedPrompt: string }> {
  const res = await adminFetch(`/characters/${charId}/enhance-prompt`, password, {
    method: 'POST',
    body: JSON.stringify(args),
  })
  if (res.status === 429) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      err.detail ??
        'Dzienna pula darmowych ulepszeń AI została wyczerpana. Wróć jutro lub użyj wersji deterministycznej.',
    )
  }
  if (res.status === 502) {
    const err = await res.json().catch(() => ({}))
    if (err.error === 'gemini_auth_failed') {
      throw new Error('Klucz Gemini API serwera odrzucony.')
    }
    const tail = err.detail
      ? ` — ${String(err.detail).slice(0, 200)}`
      : err.status
        ? ` (status ${err.status})`
        : ''
    throw new Error(`Błąd po stronie Gemini przy ulepszaniu promptu.${tail}`)
  }
  if (res.status === 503) {
    throw new Error('Ulepszanie AI chwilowo niedostępne (brak konfiguracji serwera).')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Błąd ulepszania promptu' }))
    throw new Error(err.error ?? 'Błąd ulepszania promptu')
  }
  return res.json()
}

/**
 * Validate admin password by making a test request
 */
export async function adminGetCharacterHistory(password: string, charId: string) {
  const res = await adminFetch(`/characters/${charId}/history`, password)
  if (!res.ok) throw new Error('Błąd pobierania historii')
  return res.json()
}

export async function adminCreateShareToken(password: string, charId: string, type: 'view' | 'edit') {
  const res = await adminFetch(`/characters/${charId}/share`, password, {
    method: 'POST',
    body: JSON.stringify({ type }),
  })
  if (!res.ok) throw new Error('Błąd tworzenia tokenu')
  return res.json()
}

export async function adminGetShareTokens(password: string, charId: string) {
  const res = await adminFetch(`/characters/${charId}/share`, password)
  if (!res.ok) throw new Error('Błąd pobierania tokenów')
  return res.json()
}

export async function adminDeleteShareToken(password: string, tokenId: string) {
  const res = await adminFetch(`/share/${tokenId}`, password, { method: 'DELETE' })
  if (!res.ok) throw new Error('Błąd usuwania tokenu')
  return res.json()
}

export async function adminValidatePassword(password: string): Promise<boolean> {
  try {
    const res = await adminFetch('/ping', password)
    return res.ok
  } catch {
    return false
  }
}

// ── Player management ────────────────────────────────────────────

export async function adminGetPlayers(password: string) {
  const res = await adminFetch('/players', password)
  if (!res.ok) throw new Error('Błąd pobierania graczy')
  return res.json()
}

export async function adminCreatePlayer(
  password: string,
  data: { name: string; login: string; password: string }
) {
  const res = await adminFetch('/players', password, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Błąd tworzenia gracza' }))
    throw new Error(err.error ?? 'Błąd tworzenia gracza')
  }
  return res.json()
}

export async function adminUpdatePlayer(
  password: string,
  playerId: string,
  data: Record<string, unknown>
) {
  const res = await adminFetch(`/players/${playerId}`, password, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Błąd aktualizacji gracza')
  return res.json()
}

export async function adminDeletePlayer(password: string, playerId: string) {
  const res = await adminFetch(`/players/${playerId}`, password, { method: 'DELETE' })
  if (!res.ok) throw new Error('Błąd usuwania gracza')
  return res.json()
}

export async function adminGetPlayerCodes(password: string, playerId: string) {
  const res = await adminFetch(`/players/${playerId}/codes`, password)
  if (!res.ok) throw new Error('Błąd pobierania kodów gracza')
  return res.json()
}

export async function adminAssignCode(password: string, playerId: string, inviteCodeId: string) {
  const res = await adminFetch(`/players/${playerId}/codes`, password, {
    method: 'POST',
    body: JSON.stringify({ invite_code_id: inviteCodeId }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Błąd przypisywania kodu' }))
    throw new Error(err.error ?? 'Błąd przypisywania kodu')
  }
  return res.json()
}

export async function adminUnassignCode(password: string, playerId: string, codeId: string) {
  const res = await adminFetch(`/players/${playerId}/codes/${codeId}`, password, { method: 'DELETE' })
  if (!res.ok) throw new Error('Błąd usuwania przypisania kodu')
  return res.json()
}

// ── Pending edits ────────────────────────────────────────────────

export async function adminGetPendingEdits(password: string) {
  const res = await adminFetch('/pending-edits', password)
  if (!res.ok) throw new Error('Błąd pobierania oczekujących edycji')
  return res.json()
}

export async function adminGetPendingEdit(password: string, editId: string) {
  const res = await adminFetch(`/pending-edits/${editId}`, password)
  if (!res.ok) throw new Error('Błąd pobierania edycji')
  return res.json()
}

export async function adminApprovePendingEdit(password: string, editId: string, adminComment?: string) {
  const res = await adminFetch(`/pending-edits/${editId}/approve`, password, {
    method: 'POST',
    body: JSON.stringify({ admin_comment: adminComment ?? '' }),
  })
  if (!res.ok) throw new Error('Błąd zatwierdzania edycji')
  return res.json()
}

export async function adminRejectPendingEdit(password: string, editId: string, adminComment: string) {
  const res = await adminFetch(`/pending-edits/${editId}/reject`, password, {
    method: 'POST',
    body: JSON.stringify({ admin_comment: adminComment }),
  })
  if (!res.ok) throw new Error('Błąd odrzucania edycji')
  return res.json()
}

// ── Portrait feedback ─────────────────────────────────────────────

export async function adminGetPortraitFeedback(password: string) {
  const res = await adminFetch('/portrait-feedback', password)
  if (!res.ok) throw new Error('Błąd pobierania feedbacku portretów')
  return res.json()
}

export async function adminGetPortraitStatus(password: string) {
  const res = await adminFetch('/portrait-feedback/status', password)
  if (!res.ok) throw new Error('Błąd pobierania statusu portretów')
  return res.json()
}

export async function adminGetCharacterPortraitFeedback(password: string, charId: string) {
  const res = await adminFetch(`/characters/${charId}/portrait-feedback`, password)
  if (!res.ok) throw new Error('Błąd pobierania feedbacku postaci')
  return res.json()
}

export async function adminUpdatePortraitFeedback(
  password: string,
  feedbackId: string,
  data: { status?: 'pending_fix' | 'in_progress' | 'resolved'; admin_comment?: string }
) {
  const res = await adminFetch(`/portrait-feedback/${feedbackId}`, password, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Błąd aktualizacji feedbacku')
  return res.json()
}

// ── Edit permissions (player-centric) ────────────────────────────

export async function adminCreateEditPermission(password: string, charId: string, data: { edit_mode: string; duration: string }) {
  const res = await adminFetch(`/characters/${charId}/edit-permission`, password, { method: 'POST', body: JSON.stringify(data) })
  if (!res.ok) throw new Error('Błąd nadawania uprawnień')
  return res.json()
}

export async function adminRevokeEditPermission(password: string, charId: string) {
  const res = await adminFetch(`/characters/${charId}/edit-permission`, password, { method: 'DELETE' })
  if (!res.ok) throw new Error('Błąd cofania uprawnień')
  return res.json()
}

export async function adminAssignCharacterToPlayer(password: string, charId: string, playerId: string) {
  const res = await adminFetch(`/characters/${charId}/assign-player`, password, { method: 'PUT', body: JSON.stringify({ player_id: playerId }) })
  if (!res.ok) throw new Error('Błąd przypisywania')
  return res.json()
}

export async function adminCreateDraft(password: string, data: Record<string, unknown>) {
  const res = await adminFetch('/drafts', password, { method: 'POST', body: JSON.stringify(data) })
  if (!res.ok) throw new Error('Błąd tworzenia szkicu')
  return res.json()
}
