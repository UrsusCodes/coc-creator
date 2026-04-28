const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

async function playerFetch(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${SUPABASE_URL}/functions/v1/player${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'X-Player-Token': token,
      ...options.headers,
    },
  })
  if (res.status === 401) {
    throw new Error('401: Sesja wygasła')
  }
  return res
}

export async function playerLogin(
  login: string,
  password: string
): Promise<{ token: string; player: { id: string; name: string; login: string } }> {
  const url = `${SUPABASE_URL}/functions/v1/player/login`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ login, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Login failed' }))
    throw new Error(err.error ?? 'Login failed')
  }
  return res.json()
}

export async function playerGetMe(token: string) {
  const res = await playerFetch('/me', token)
  if (!res.ok) throw new Error('Failed to get profile')
  return res.json()
}

export async function playerGetCodes(token: string) {
  const res = await playerFetch('/codes', token)
  if (!res.ok) throw new Error('Failed to get codes')
  return res.json()
}

export async function playerGetCharacters(token: string) {
  const res = await playerFetch('/characters', token)
  if (!res.ok) throw new Error('Failed to get characters')
  return res.json()
}

export async function playerGetCharacter(token: string, charId: string) {
  const res = await playerFetch(`/characters/${charId}`, token)
  if (!res.ok) throw new Error('Character not found')
  return res.json()
}

export async function playerProposeEdit(
  token: string,
  charId: string,
  proposedData: Record<string, unknown>,
  changeComment: string
) {
  const res = await playerFetch(`/characters/${charId}/propose-edit`, token, {
    method: 'POST',
    body: JSON.stringify({ proposed_data: proposedData, change_comment: changeComment }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to propose edit' }))
    throw new Error(err.error ?? 'Failed to propose edit')
  }
  return res.json()
}

export async function playerGetPending(token: string, charId: string) {
  const res = await playerFetch(`/characters/${charId}/pending`, token)
  if (!res.ok) throw new Error('Failed to get pending edit')
  return res.json()
}

export async function playerCancelPending(token: string, charId: string) {
  const res = await playerFetch(`/characters/${charId}/pending`, token, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to cancel pending edit')
  return res.json()
}

export async function playerClaimCharacter(token: string, inviteCodeId: string) {
  const res = await playerFetch('/claim', token, {
    method: 'POST',
    body: JSON.stringify({ invite_code_id: inviteCodeId }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to claim character' }))
    throw new Error(err.error ?? 'Failed to claim character')
  }
  return res.json()
}

export async function playerGetHistory(token: string, charId: string) {
  const res = await playerFetch(`/characters/${charId}/history`, token)
  if (!res.ok) throw new Error('Failed to get history')
  return res.json()
}

// ── Drafts (wizard auto-save) ────────────────────────────────────

export async function playerCreateDraft(token: string, data: { invite_code_id: string; wizard_data: Record<string, unknown> }) {
  const res = await playerFetch('/drafts', token, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Błąd tworzenia szkicu' }))
    throw new Error(err.error ?? 'Błąd tworzenia szkicu')
  }
  return res.json()
}

export async function playerSaveDraft(token: string, charId: string, wizardData: Record<string, unknown>) {
  const res = await playerFetch(`/characters/${charId}/draft`, token, {
    method: 'PUT',
    body: JSON.stringify({ wizard_data: wizardData }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Błąd zapisu postępu' }))
    throw new Error(err.error ?? 'Błąd zapisu postępu')
  }
  return res.json()
}

// ── Granular commits — hard zone (cech/wiek/luck/edu/aging/swap) ──

import type { AgingDeductions, CharacterData, NarrativeFields, SoftZoneStep } from '@/types/character'
import type { CharacteristicKey, CreationMethod } from '@/types/common'

/** Helper: parse JSON error from edge function and surface a useful message. */
async function throwEdgeError(res: Response, fallback: string): Promise<never> {
  const err = await res.json().catch(() => ({ error: fallback }))
  throw new Error(err.error ?? fallback)
}

/**
 * Step 1 — start a new character on a given code.
 * Identifier-only: no roll, no luck, no age. Subsequent endpoints commit
 * each part of the hard zone separately.
 */
export async function playerStartCharacter(
  token: string,
  args: { code: string; distinguisher: string; method: CreationMethod },
): Promise<CharacterData> {
  const res = await playerFetch('/start-character', token, {
    method: 'POST',
    body: JSON.stringify(args),
  })
  if (!res.ok) await throwEdgeError(res, 'Nie udało się utworzyć postaci')
  return res.json()
}

/** Step 2 — server-side dice roll for all 8 characteristics (dice method only). */
export async function playerRollCharacteristics(
  token: string,
  charId: string,
): Promise<CharacterData> {
  const res = await playerFetch(`/characters/${charId}/roll-characteristics`, token, {
    method: 'POST',
  })
  if (!res.ok) await throwEdgeError(res, 'Nie udało się rzucić cech')
  return res.json()
}

/** Step 2b (optional) — perk-gated swap of two characteristic values. */
export async function playerSwapCharacteristics(
  token: string,
  charId: string,
  args: { from: CharacteristicKey; to: CharacteristicKey },
): Promise<CharacterData> {
  const res = await playerFetch(`/characters/${charId}/swap-characteristics`, token, {
    method: 'POST',
    body: JSON.stringify(args),
  })
  if (!res.ok) await throwEdgeError(res, 'Nie udało się zamienić cech')
  return res.json()
}

/** Step 2b alternative — skip the swap perk without changing characteristics. */
export async function playerSkipSwap(
  token: string,
  charId: string,
): Promise<CharacterData> {
  const res = await playerFetch(`/characters/${charId}/skip-swap`, token, {
    method: 'POST',
  })
  if (!res.ok) await throwEdgeError(res, 'Nie udało się pominąć zamiany cech')
  return res.json()
}

/** Step 3 — commit age. Forces swap decision first if perk is available. */
export async function playerSetAge(
  token: string,
  charId: string,
  age: number,
): Promise<CharacterData> {
  const res = await playerFetch(`/characters/${charId}/set-age`, token, {
    method: 'POST',
    body: JSON.stringify({ age }),
  })
  if (!res.ok) await throwEdgeError(res, 'Nie udało się ustawić wieku')
  return res.json()
}

/**
 * Step 4 — server-rolls EDU improvement checks based on age range.
 * Returns the updated character including edu_rolls with per-check detail.
 */
export async function playerRollEdu(
  token: string,
  charId: string,
): Promise<CharacterData> {
  const res = await playerFetch(`/characters/${charId}/roll-edu`, token, {
    method: 'POST',
  })
  if (!res.ok) await throwEdgeError(res, 'Nie udało się wykonać rzutów EDU')
  return res.json()
}

/** Step 5 — apply aging penalties (player chooses distribution). */
export async function playerApplyAgingPenalties(
  token: string,
  charId: string,
  deductions: AgingDeductions,
): Promise<CharacterData> {
  const res = await playerFetch(`/characters/${charId}/apply-aging-penalties`, token, {
    method: 'POST',
    body: JSON.stringify({ deductions }),
  })
  if (!res.ok) await throwEdgeError(res, 'Nie udało się zastosować obniżeń wiekowych')
  return res.json()
}

/** Step 6 — final hard-zone roll. Young chars (15-19): max(3d6×5, 3d6×5). */
export async function playerRollLuck(
  token: string,
  charId: string,
): Promise<CharacterData> {
  const res = await playerFetch(`/characters/${charId}/roll-luck`, token, {
    method: 'POST',
  })
  if (!res.ok) await throwEdgeError(res, 'Nie udało się rzucić szczęścia')
  return res.json()
}

/**
 * Reroll — full wipe (cech/wiek/luck/edu/aging + downstream + narrative).
 * Consumes one rerolls_remaining token. Dice method only; for point_buy /
 * direct, use playerEditCharacteristics instead (no token cost).
 */
export async function playerReroll(
  token: string,
  charId: string,
): Promise<CharacterData> {
  const res = await playerFetch(`/characters/${charId}/reroll`, token, {
    method: 'POST',
  })
  if (!res.ok) await throwEdgeError(res, 'Nie udało się przerzucić cech')
  return res.json()
}

/** Manual characteristics edit (point_buy / direct methods). Implicit reroll, no token cost. */
export async function playerEditCharacteristics(
  token: string,
  charId: string,
  characteristics: Record<CharacteristicKey, number>,
  luck?: number,
): Promise<CharacterData> {
  const res = await playerFetch(`/characters/${charId}/edit-characteristics`, token, {
    method: 'POST',
    body: JSON.stringify({ characteristics, luck }),
  })
  if (!res.ok) await throwEdgeError(res, 'Nie udało się zapisać cech')
  return res.json()
}

// ── Granular commits — soft zone + cross-cutting ──

/** Soft back-step (occupation onwards). Wipes target step + below. No token cost. */
export async function playerGoBackToStep(
  token: string,
  charId: string,
  step: SoftZoneStep,
): Promise<CharacterData> {
  const res = await playerFetch(`/characters/${charId}/go-back-to-step`, token, {
    method: 'POST',
    body: JSON.stringify({ step }),
  })
  if (!res.ok) await throwEdgeError(res, 'Nie udało się cofnąć kroku')
  return res.json()
}

/** Distinguisher edit — works anytime, also post-submit. */
export async function playerUpdateDistinguisher(
  token: string,
  charId: string,
  distinguisher: string,
): Promise<CharacterData> {
  const res = await playerFetch(`/characters/${charId}/distinguisher`, token, {
    method: 'PUT',
    body: JSON.stringify({ distinguisher }),
  })
  if (!res.ok) await throwEdgeError(res, 'Nie udało się zaktualizować identyfikatora')
  return res.json()
}

/** Narrative edit — works anytime, also post-submit. Allowlist enforced server-side. */
export async function playerUpdateNarrative(
  token: string,
  charId: string,
  fields: NarrativeFields,
): Promise<CharacterData> {
  const res = await playerFetch(`/characters/${charId}/narrative`, token, {
    method: 'PUT',
    body: JSON.stringify(fields),
  })
  if (!res.ok) await throwEdgeError(res, 'Nie udało się zapisać fabuły')
  return res.json()
}

/** Submit — flip draft → submitted. Validates all hard-zone commits for dice flow. */
export async function playerSubmitCharacter(
  token: string,
  charId: string,
): Promise<CharacterData> {
  const res = await playerFetch(`/characters/${charId}/submit`, token, {
    method: 'POST',
  })
  if (!res.ok) await throwEdgeError(res, 'Nie udało się zatwierdzić postaci')
  return res.json()
}

// ── Portrait ──────────────────────────────────────────────────────

export async function playerSelectPortrait(
  token: string,
  charId: string,
  portraitUrl: string,
  cropData?: { x: number; y: number; width: number; height: number } | null
) {
  const res = await playerFetch(`/characters/${charId}/portrait`, token, {
    method: 'PUT',
    body: JSON.stringify({ portrait_url: portraitUrl, portrait_crop_data: cropData ?? null }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to select portrait' }))
    throw new Error(err.error ?? 'Failed to select portrait')
  }
  return res.json()
}

// ── Append uploaded portrait variants to character's gallery ────
// Used by the Chat-paste flow: client uploads N variants directly to
// Storage via supabase-js, then calls this endpoint to register them
// in the character's art_gallery JSONB. See spec at
// docs/CoCCreator_obsidian/specs/portrait_prompt_methodology.md

export interface PortraitVariantToAppend {
  url: string
  label?: string
  /** color | faded | sepia | bw — informational only on this endpoint */
  style?: string
}

export interface PlayerAppendPortraitsResult {
  added_count: number
  gallery_additions: { url: string; label: string; created_at: string }[]
}

export async function playerAppendPortraits(
  token: string,
  charId: string,
  variants: PortraitVariantToAppend[],
): Promise<PlayerAppendPortraitsResult> {
  const res = await playerFetch(`/characters/${charId}/append-portraits`, token, {
    method: 'POST',
    body: JSON.stringify({ variants }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Błąd zapisu portretów' }))
    throw new Error(err.error ?? 'Błąd zapisu portretów')
  }
  return res.json()
}

export async function playerSubmitPortraitFeedback(
  token: string,
  charId: string,
  data: { variant_url: string; comment: string; reference_image_url?: string }
) {
  const res = await playerFetch(`/characters/${charId}/portrait-feedback`, token, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to submit feedback' }))
    throw new Error(err.error ?? 'Failed to submit feedback')
  }
  return res.json()
}

export async function playerGetPortraitFeedback(token: string, charId: string) {
  const res = await playerFetch(`/characters/${charId}/portrait-feedback`, token)
  if (!res.ok) throw new Error('Failed to get feedback')
  return res.json()
}

export async function playerDeletePortraitFeedback(token: string, charId: string, feedbackId: string) {
  const res = await playerFetch(`/characters/${charId}/portrait-feedback/${feedbackId}`, token, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete feedback')
  return res.json()
}

// ── Edit permissions (player-centric) ────────────────────────────

export async function playerGetEditPermissions(token: string) {
  const res = await playerFetch('/edit-permissions', token)
  if (!res.ok) throw new Error('Błąd pobierania uprawnień')
  return res.json()
}

export async function playerGetEditPermission(token: string, charId: string) {
  const res = await playerFetch(`/characters/${charId}/edit-permission`, token)
  if (!res.ok) return null
  return res.json()
}

export async function playerSubmitEdit(token: string, charId: string, proposedData: Record<string, unknown>, changeComment: string) {
  const res = await playerFetch(`/characters/${charId}/submit-edit`, token, {
    method: 'POST',
    body: JSON.stringify({ proposed_data: proposedData, change_comment: changeComment }),
  })
  if (!res.ok) throw new Error('Błąd wysyłania zmian')
  return res.json()
}
