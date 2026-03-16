import type { CharacterData, HistoryEntry } from '@/types/character'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

async function publicFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${SUPABASE_URL}/functions/v1/public${path}`
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      ...options.headers,
    },
  })
}

export async function publicGetCharacter(token: string): Promise<{
  character: CharacterData
  tokenType: 'view' | 'edit'
  tokenId: string
}> {
  const res = await publicFetch(`/character/${token}`)
  if (!res.ok) {
    if (res.status === 404) throw new Error('Link nie istnieje lub został usunięty')
    throw new Error('Błąd ładowania postaci')
  }
  return res.json()
}

export async function publicUpdateCharacter(
  token: string,
  data: Record<string, unknown>
): Promise<CharacterData> {
  const res = await publicFetch(`/character/${token}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    if (res.status === 403) throw new Error('Ten link jest tylko do odczytu')
    throw new Error('Błąd aktualizacji postaci')
  }
  return res.json()
}

export async function publicGetHistory(token: string): Promise<HistoryEntry[]> {
  const res = await publicFetch(`/character/${token}/history`)
  if (!res.ok) throw new Error('Błąd pobierania historii')
  return res.json()
}
