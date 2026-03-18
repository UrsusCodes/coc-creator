import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'
import { create, verify } from 'https://deno.land/x/djwt@v3.0.2/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-player-token, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function getJwtKey(): Promise<CryptoKey> {
  const secret = Deno.env.get('PLAYER_JWT_SECRET') ?? Deno.env.get('ADMIN_PASSWORD') ?? 'fallback-secret'
  const enc = new TextEncoder()
  return await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

async function createToken(playerId: string): Promise<string> {
  const key = await getJwtKey()
  return await create({ alg: 'HS256', typ: 'JWT' }, {
    sub: playerId,
    exp: Math.floor(Date.now() / 1000) + 86400, // 24h
  }, key)
}

async function verifyToken(token: string): Promise<string | null> {
  try {
    const key = await getJwtKey()
    const payload = await verify(token, key)
    return payload.sub as string
  } catch {
    return null
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const url = new URL(req.url)
  const path = url.pathname.replace(/^\/player/, '')

  try {
    // ── LOGIN (no token needed) ──────────────────────────────────
    if (path === '/login' && req.method === 'POST') {
      const { login, password } = await req.json()
      if (!login || !password) return errorResponse('Login and password required', 400)

      const { data: player, error } = await supabase
        .from('players')
        .select('*')
        .eq('login', login)
        .eq('is_active', true)
        .single()

      if (error || !player) return errorResponse('Invalid credentials', 401)

      const valid = await bcrypt.compare(password, player.password_hash)
      if (!valid) return errorResponse('Invalid credentials', 401)

      const token = await createToken(player.id)
      return jsonResponse({
        token,
        player: { id: player.id, name: player.name, login: player.login },
      })
    }

    // ── All other endpoints require auth ─────────────────────────
    const playerToken = req.headers.get('x-player-token')
    if (!playerToken) return errorResponse('Unauthorized', 401)

    const playerId = await verifyToken(playerToken)
    if (!playerId) return errorResponse('Token expired or invalid', 401)

    // ── GET /me ──────────────────────────────────────────────────
    if (path === '/me' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('players')
        .select('id, name, login, is_active')
        .eq('id', playerId)
        .single()
      if (error) throw error
      return jsonResponse(data)
    }

    // ── GET /codes — list assigned invite codes ──────────────────
    if (path === '/codes' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('player_codes')
        .select('invite_code_id, assigned_at, invite_codes(*)')
        .eq('player_id', playerId)
        .order('assigned_at', { ascending: false })
      if (error) throw error

      const codes = (data ?? []).map((row: Record<string, unknown>) => ({
        ...(row.invite_codes as Record<string, unknown>),
        assigned_at: row.assigned_at,
      }))
      return jsonResponse(codes)
    }

    // ── GET /characters — list player's characters ───────────────
    if (path === '/characters' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return jsonResponse(data)
    }

    // ── GET /characters/:id — single character (must own) ────────
    const charGetMatch = path.match(/^\/characters\/([^/]+)$/)
    if (charGetMatch && req.method === 'GET') {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', charGetMatch[1])
        .eq('player_id', playerId)
        .single()
      if (error) return errorResponse('Character not found', 404)
      return jsonResponse(data)
    }

    // ── GET /characters/:id/pending — current pending edit ───────
    const pendingGetMatch = path.match(/^\/characters\/([^/]+)\/pending$/)
    if (pendingGetMatch && req.method === 'GET') {
      // Verify ownership
      const { error: ownerErr } = await supabase
        .from('characters')
        .select('id')
        .eq('id', pendingGetMatch[1])
        .eq('player_id', playerId)
        .single()
      if (ownerErr) return errorResponse('Character not found', 404)

      const { data, error } = await supabase
        .from('pending_edits')
        .select('*')
        .eq('character_id', pendingGetMatch[1])
        .eq('player_id', playerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return jsonResponse(data)
    }

    // ── POST /characters/:id/propose-edit — submit pending edit ──
    const proposeMatch = path.match(/^\/characters\/([^/]+)\/propose-edit$/)
    if (proposeMatch && req.method === 'POST') {
      const charId = proposeMatch[1]

      // Verify ownership
      const { error: ownerErr } = await supabase
        .from('characters')
        .select('id')
        .eq('id', charId)
        .eq('player_id', playerId)
        .single()
      if (ownerErr) return errorResponse('Character not found', 404)

      const body = await req.json()
      const { proposed_data, change_comment } = body

      if (!proposed_data) return errorResponse('proposed_data required', 400)

      const { data, error } = await supabase
        .from('pending_edits')
        .insert({
          character_id: charId,
          player_id: playerId,
          proposed_data,
          change_comment: change_comment ?? '',
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          return errorResponse('A pending edit already exists for this character', 409)
        }
        throw error
      }
      return jsonResponse(data)
    }

    // ── DELETE /characters/:id/pending — cancel own pending edit ──
    const pendingDeleteMatch = path.match(/^\/characters\/([^/]+)\/pending$/)
    if (pendingDeleteMatch && req.method === 'DELETE') {
      const { error } = await supabase
        .from('pending_edits')
        .delete()
        .eq('character_id', pendingDeleteMatch[1])
        .eq('player_id', playerId)
        .eq('status', 'pending')
      if (error) throw error
      return jsonResponse({ deleted: true })
    }

    // ── GET /characters/:id/history — view history (read-only) ───
    const historyMatch = path.match(/^\/characters\/([^/]+)\/history$/)
    if (historyMatch && req.method === 'GET') {
      // Verify ownership
      const { error: ownerErr } = await supabase
        .from('characters')
        .select('id')
        .eq('id', historyMatch[1])
        .eq('player_id', playerId)
        .single()
      if (ownerErr) return errorResponse('Character not found', 404)

      const { data, error } = await supabase
        .from('character_history')
        .select('*')
        .eq('character_id', historyMatch[1])
        .order('created_at', { ascending: false })
      if (error) throw error
      return jsonResponse(data)
    }

    // ── POST /claim — claim character after wizard creation ──────
    if (path === '/claim' && req.method === 'POST') {
      const { invite_code_id } = await req.json()
      if (!invite_code_id) return errorResponse('invite_code_id required', 400)

      // Check code is assigned to this player
      const { data: assignment, error: assignErr } = await supabase
        .from('player_codes')
        .select('id')
        .eq('player_id', playerId)
        .eq('invite_code_id', invite_code_id)
        .maybeSingle()
      if (assignErr) throw assignErr
      if (!assignment) return errorResponse('Code not assigned to you', 403)

      // Find character with this invite_code_id and no player_id
      const { data: char, error: charErr } = await supabase
        .from('characters')
        .select('id')
        .eq('invite_code_id', invite_code_id)
        .is('player_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (charErr) throw charErr
      if (!char) return errorResponse('No unclaimed character found for this code', 404)

      // Claim it
      const { data, error } = await supabase
        .from('characters')
        .update({ player_id: playerId })
        .eq('id', char.id)
        .select()
        .single()
      if (error) throw error
      return jsonResponse(data)
    }

    return errorResponse('Not found', 404)
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
