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
  data: { methods: string[]; era: string; max_tries: number; code: string; perks: string[]; max_skill_value?: number }
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
