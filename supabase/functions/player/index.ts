import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import bcryptjs from 'https://esm.sh/bcryptjs@3.0.2'
const bcryptCompare = (pw: string, hash: string) => bcryptjs.compareSync(pw, hash)
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

      const valid = bcryptCompare(password, player.password_hash)
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

    // ── PUT /characters/:id/portrait — direct portrait select + crop ──
    const portraitMatch = path.match(/^\/characters\/([^/]+)\/portrait$/)
    if (portraitMatch && req.method === 'PUT') {
      const charId = portraitMatch[1]

      // Verify ownership
      const { error: ownerErr } = await supabase
        .from('characters')
        .select('id')
        .eq('id', charId)
        .eq('player_id', playerId)
        .single()
      if (ownerErr) return errorResponse('Character not found', 404)

      const body = await req.json()
      const { portrait_url, portrait_crop_data } = body
      if (!portrait_url) return errorResponse('portrait_url required', 400)

      const updateData: Record<string, unknown> = { portrait_url }
      if (portrait_crop_data !== undefined) updateData.portrait_crop_data = portrait_crop_data

      const { data, error } = await supabase
        .from('characters')
        .update(updateData)
        .eq('id', charId)
        .select('id, portrait_url, portrait_crop_data')
        .single()
      if (error) throw error
      return jsonResponse(data)
    }

    // ── POST /characters/:id/portrait-feedback — submit feedback ──
    const feedbackPostMatch = path.match(/^\/characters\/([^/]+)\/portrait-feedback$/)
    if (feedbackPostMatch && req.method === 'POST') {
      const charId = feedbackPostMatch[1]

      // Verify ownership
      const { error: ownerErr } = await supabase
        .from('characters')
        .select('id')
        .eq('id', charId)
        .eq('player_id', playerId)
        .single()
      if (ownerErr) return errorResponse('Character not found', 404)

      const body = await req.json()
      const { variant_url, comment, reference_image_url } = body
      if (!variant_url) return errorResponse('variant_url required', 400)
      if (!comment) return errorResponse('comment required', 400)

      const { data, error } = await supabase
        .from('portrait_feedback')
        .insert({
          character_id: charId,
          player_id: playerId,
          variant_url,
          comment,
          reference_image_url: reference_image_url ?? null,
          status: 'pending_fix',
        })
        .select()
        .single()
      if (error) throw error
      return jsonResponse(data)
    }

    // ── GET /characters/:id/portrait-feedback — get own feedback ──
    const feedbackGetMatch = path.match(/^\/characters\/([^/]+)\/portrait-feedback$/)
    if (feedbackGetMatch && req.method === 'GET') {
      const charId = feedbackGetMatch[1]

      // Verify ownership
      const { error: ownerErr } = await supabase
        .from('characters')
        .select('id')
        .eq('id', charId)
        .eq('player_id', playerId)
        .single()
      if (ownerErr) return errorResponse('Character not found', 404)

      const { data, error } = await supabase
        .from('portrait_feedback')
        .select('*')
        .eq('character_id', charId)
        .eq('player_id', playerId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return jsonResponse(data)
    }

    // ── DELETE /characters/:id/portrait-feedback/:feedbackId ──────
    const feedbackDeleteMatch = path.match(/^\/characters\/([^/]+)\/portrait-feedback\/([^/]+)$/)
    if (feedbackDeleteMatch && req.method === 'DELETE') {
      const [, charId, feedbackId] = feedbackDeleteMatch

      // Verify ownership
      const { error: ownerErr } = await supabase
        .from('characters')
        .select('id')
        .eq('id', charId)
        .eq('player_id', playerId)
        .single()
      if (ownerErr) return errorResponse('Character not found', 404)

      const { error } = await supabase
        .from('portrait_feedback')
        .delete()
        .eq('id', feedbackId)
        .eq('player_id', playerId)
        .eq('status', 'pending_fix')
      if (error) throw error
      return jsonResponse({ deleted: true })
    }

    // ══════════════════════════════════════════════════════════════
    // EDIT PERMISSIONS (player-centric model)
    // ══════════════════════════════════════════════════════════════

    // ── GET /edit-permissions — list active edit permissions ───────
    if (path === '/edit-permissions' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('edit_permissions')
        .select('id, character_id, edit_mode, expires_at, characters(name)')
        .eq('player_id', playerId)
        .or(`expires_at.gt.${new Date().toISOString()},expires_at.is.null`)
        .order('expires_at', { ascending: true, nullsFirst: false })
      if (error) throw error

      const result = (data ?? []).map((row: Record<string, unknown>) => ({
        id: row.id,
        character_id: row.character_id,
        character_name: (row.characters as Record<string, unknown>)?.name ?? null,
        edit_mode: row.edit_mode,
        expires_at: row.expires_at,
      }))
      return jsonResponse(result)
    }

    // ── GET /characters/:id/edit-permission — check edit permission ─
    const editPermGetMatch = path.match(/^\/characters\/([^/]+)\/edit-permission$/)
    if (editPermGetMatch && req.method === 'GET') {
      const charId = editPermGetMatch[1]

      // Verify ownership
      const { error: ownerErr } = await supabase
        .from('characters')
        .select('id')
        .eq('id', charId)
        .eq('player_id', playerId)
        .single()
      if (ownerErr) return errorResponse('Character not found', 404)

      const { data, error } = await supabase
        .from('edit_permissions')
        .select('id, character_id, edit_mode, expires_at')
        .eq('character_id', charId)
        .or(`expires_at.gt.${new Date().toISOString()},expires_at.is.null`)
        .maybeSingle()
      if (error) throw error
      return jsonResponse(data)
    }

    // ── POST /characters/:id/submit-edit — submit edit via permission ─
    const submitEditMatch = path.match(/^\/characters\/([^/]+)\/submit-edit$/)
    if (submitEditMatch && req.method === 'POST') {
      const charId = submitEditMatch[1]

      // Verify ownership
      const { error: ownerErr } = await supabase
        .from('characters')
        .select('id')
        .eq('id', charId)
        .eq('player_id', playerId)
        .single()
      if (ownerErr) return errorResponse('Character not found', 404)

      // Verify active edit permission
      const { data: perm, error: permErr } = await supabase
        .from('edit_permissions')
        .select('id, edit_mode')
        .eq('character_id', charId)
        .eq('player_id', playerId)
        .or(`expires_at.gt.${new Date().toISOString()},expires_at.is.null`)
        .maybeSingle()
      if (permErr) throw permErr
      if (!perm) return errorResponse('No active edit permission', 403)

      const body = await req.json()
      const { proposed_data, change_comment } = body
      if (!proposed_data) return errorResponse('proposed_data required', 400)

      // Delete any existing pending edit for this character
      await supabase
        .from('pending_edits')
        .delete()
        .eq('character_id', charId)
        .eq('player_id', playerId)
        .eq('status', 'pending')

      // Insert new pending edit
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
      if (error) throw error
      return jsonResponse(data)
    }

    // ══════════════════════════════════════════════════════════════
    // PLAYER DRAFTS (wizard auto-save)
    // ══════════════════════════════════════════════════════════════

    // ── POST /drafts — create a new draft character for wizard auto-save ──
    if (path === '/drafts' && req.method === 'POST') {
      const body = await req.json()
      const { invite_code_id, wizard_data } = body

      if (!invite_code_id || !wizard_data) {
        return errorResponse('invite_code_id and wizard_data required', 400)
      }

      // Verify invite code exists and is active
      const { data: inviteCode, error: codeErr } = await supabase
        .from('invite_codes')
        .select('id')
        .eq('id', invite_code_id)
        .eq('is_active', true)
        .maybeSingle()
      if (codeErr) throw codeErr
      if (!inviteCode) return errorResponse('Invalid invite code', 400)

      // Delete any existing player-created draft for this invite code
      await supabase
        .from('characters')
        .delete()
        .eq('invite_code_id', invite_code_id)
        .eq('player_id', playerId)
        .eq('status', 'draft')
        .eq('created_by', 'player')

      // Create character with draft status
      const { data, error } = await supabase
        .from('characters')
        .insert({
          ...wizard_data,
          invite_code_id,
          status: 'draft',
          created_by: 'player',
          player_id: playerId,
        })
        .select()
        .single()
      if (error) throw error
      return jsonResponse(data)
    }

    // ── PUT /characters/:id/draft — update draft wizard data ──────
    const draftMatch = path.match(/^\/characters\/([^/]+)\/draft$/)
    if (draftMatch && req.method === 'PUT') {
      const charId = draftMatch[1]

      // Verify ownership
      const { data: char, error: ownerErr } = await supabase
        .from('characters')
        .select('id, status, created_by')
        .eq('id', charId)
        .eq('player_id', playerId)
        .single()
      if (ownerErr) return errorResponse('Character not found', 404)

      // Only allow updating drafts
      if (char.status !== 'draft') {
        return errorResponse('Character is not a draft', 400)
      }

      const body = await req.json()
      const { wizard_data } = body
      if (!wizard_data) return errorResponse('wizard_data required', 400)

      const { data, error } = await supabase
        .from('characters')
        .update(wizard_data)
        .eq('id', charId)
        .select()
        .single()
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
