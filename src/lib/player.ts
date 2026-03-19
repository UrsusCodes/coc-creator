const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

async function playerFetch(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${SUPABASE_URL}/functions/v1/player${path}`
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'X-Player-Token': token,
      ...options.headers,
    },
  })
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
