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

// ─── Server-side dice (port of src/lib/dice.ts) ────────────────
function rollDie(sides: number): number {
  // crypto.getRandomValues for unbiased rolls (prevents client reroll-on-refresh abuse)
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return (buf[0] % sides) + 1
}
function rollDice(count: number, sides: number): number {
  let total = 0
  for (let i = 0; i < count; i++) total += rollDie(sides)
  return total
}
function roll3d6x5(): number { return rollDice(3, 6) * 5 }
function roll2d6plus6x5(): number { return (rollDice(2, 6) + 6) * 5 }
function rollCharacteristic(formula: '3d6x5' | '2d6+6x5'): number {
  return formula === '3d6x5' ? roll3d6x5() : roll2d6plus6x5()
}

const CHARACTERISTIC_FORMULAS: Record<string, '3d6x5' | '2d6+6x5'> = {
  STR: '3d6x5', CON: '3d6x5', SIZ: '2d6+6x5', DEX: '3d6x5',
  APP: '3d6x5', INT: '2d6+6x5', POW: '3d6x5', EDU: '2d6+6x5',
}

function rollAllCharacteristics(): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [key, formula] of Object.entries(CHARACTERISTIC_FORMULAS)) {
    out[key] = rollCharacteristic(formula)
  }
  return out
}

function rollLuckForAge(age: number): number {
  // "Young" bonus: 15–19 rolls twice takes best. Otherwise single 3d6x5.
  if (age >= 15 && age <= 19) {
    return Math.max(roll3d6x5(), roll3d6x5())
  }
  return roll3d6x5()
}

// ─── Age modifications (port of src/lib/ageModifiers.ts + src/data/ageRanges.ts) ───
interface AgeRange {
  min: number
  max: number
  eduImprovementChecks: number
  deductionPoints: number
  appReduction: number
  moveReduction: number
}
const AGE_RANGES: AgeRange[] = [
  { min: 15, max: 19, eduImprovementChecks: 0, deductionPoints: 5,  appReduction: 0,  moveReduction: 0 },
  { min: 20, max: 39, eduImprovementChecks: 1, deductionPoints: 0,  appReduction: 0,  moveReduction: 0 },
  { min: 40, max: 49, eduImprovementChecks: 2, deductionPoints: 5,  appReduction: 5,  moveReduction: 1 },
  { min: 50, max: 59, eduImprovementChecks: 3, deductionPoints: 10, appReduction: 10, moveReduction: 2 },
  { min: 60, max: 69, eduImprovementChecks: 4, deductionPoints: 20, appReduction: 15, moveReduction: 3 },
  { min: 70, max: 79, eduImprovementChecks: 4, deductionPoints: 40, appReduction: 20, moveReduction: 4 },
  { min: 80, max: 89, eduImprovementChecks: 4, deductionPoints: 80, appReduction: 25, moveReduction: 5 },
]
function getAgeRange(age: number): AgeRange | undefined {
  return AGE_RANGES.find((r) => age >= r.min && age <= r.max)
}
function isYoungCharacter(age: number): boolean {
  return age >= 15 && age <= 19
}
function getDeductibleStats(age: number): string[] {
  return isYoungCharacter(age) ? ['STR', 'SIZ'] : ['STR', 'CON', 'DEX']
}

// Fields wiped on soft back-step (occupation onwards). Mechanical fields
// (cechy/wiek/luck/edu/aging/swap) are NOT here — those are wiped only by
// /reroll and replaced by the hard-zone endpoints.
const DOWNSTREAM_WIPE: Record<string, unknown> = {
  occupation_id: null,
  occupation_skill_points: {},
  personal_skill_points: {},
  backstory: {},
  equipment: [],
  cash: '',
  assets: '',
  spending_level: '',
  positions: [],
  contacts: [],
  main_position: null,
  additional_positions: [],
  contacts_v2: [],
  lifestyle_rating: null,
  lifestyle_stars: null,
  lifestyle_label: null,
  spending_free: null,
  assets_breakdown: [],
  equipment_catalogs_available: [],
  derived: {},
}

// Fields wiped on /reroll (full wipe — token-cost). Resets character to
// just-post-/start-character state. swap_available preserved (it's perm
// property derived from code.perks). swap_used reset to false.
// rerolls_remaining decremented separately by consume_reroll RPC.
// reroll_history appended (not wiped) by append_reroll_history RPC.
// Identity (distinguisher/method/era/perks/max_skill_value) preserved.
// Narrative (name/appearance/residence/birthplace/player_name/gender/
// backstory/portrait_*) — wiped by /reroll per spec ("wszystko co
// nastąpiło potem, łącznie z fabułą jest usuwane").
const HARD_ZONE_WIPE: Record<string, unknown> = {
  characteristics: {},
  luck: 0,
  age: 0,
  edu_rolls: [],
  characteristics_committed_at: null,
  swap_committed_at: null,
  age_committed_at: null,
  edu_committed_at: null,
  aging_committed_at: null,
  luck_committed_at: null,
  swap_used: false,
  // narrative wiped on reroll per user spec
  name: '',
  gender: '',
  appearance: '',
  residence: '',
  birthplace: '',
  player_name: '',
  ...DOWNSTREAM_WIPE,
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

    // ── PUT /characters/:id/draft — soft-zone autosave only ────────
    // Strict allowlist of fields the wizard can write directly. All
    // mechanical pre-occupation state (cech/wiek/luck/edu/aging/swap and
    // their commit timestamps) goes through dedicated endpoints. status,
    // method, era, perks, distinguisher, max_skill_value, invite_code_id
    // also blocked — none of those are draft-time mutable.
    const DRAFT_ALLOWLIST = new Set([
      // Soft-zone wizard state
      'occupation_id',
      'occupation_skill_points',
      'personal_skill_points',
      'equipment',
      'cash',
      'assets',
      'spending_level',
      'lifestyle_rating',
      'lifestyle_stars',
      'lifestyle_label',
      'spending_free',
      'assets_breakdown',
      'equipment_catalogs_available',
      'positions',
      'contacts',
      'main_position',
      'additional_positions',
      'contacts_v2',
      // Narrative — also editable via dedicated /narrative endpoint, but
      // permitting here too lets wizard autosave during backstory step.
      'backstory',
      'name',
      'appearance',
      'residence',
      'birthplace',
      'player_name',
      'gender',
      // Sessions + admin_notes (player can self-annotate during draft)
      'sessions',
      'admin_notes',
      // Client progression tracker
      'draft_step',
      'draft_locked_step',
      // Derived block — purely computed mirror; client persists for fast UI
      'derived',
    ])

    const draftMatch = path.match(/^\/characters\/([^/]+)\/draft$/)
    if (draftMatch && req.method === 'PUT') {
      const charId = draftMatch[1]

      const { data: char, error: ownerErr } = await supabase
        .from('characters')
        .select('id, status')
        .eq('id', charId)
        .eq('player_id', playerId)
        .single()
      if (ownerErr) return errorResponse('Character not found', 404)
      if (char.status !== 'draft') {
        return errorResponse('Character is not a draft', 400)
      }

      const body = await req.json()
      const { wizard_data } = body
      if (!wizard_data || typeof wizard_data !== 'object') {
        return errorResponse('wizard_data required', 400)
      }

      // Allowlist enforcement: reject if any field outside allowlist.
      const rejected: string[] = []
      const filtered: Record<string, unknown> = {}
      for (const k of Object.keys(wizard_data)) {
        if (DRAFT_ALLOWLIST.has(k)) {
          filtered[k] = (wizard_data as Record<string, unknown>)[k]
        } else {
          rejected.push(k)
        }
      }
      if (rejected.length > 0) {
        return errorResponse(
          `Fields not allowed via /draft: ${rejected.join(', ')}. Use the dedicated endpoint.`,
          400,
        )
      }
      if (Object.keys(filtered).length === 0) {
        return errorResponse('wizard_data has no allowed fields', 400)
      }

      const { data, error } = await supabase
        .from('characters')
        .update(filtered)
        .eq('id', charId)
        .select()
        .single()
      if (error) throw error
      return jsonResponse(data)
    }

    // ══════════════════════════════════════════════════════════════
    // NEW IDENTITY/CHARACTERISTICS ENDPOINTS (rework 018)
    // ══════════════════════════════════════════════════════════════

    // ── POST /start-character — identifier only; no auto-roll ──────
    // body: { code, distinguisher, method }
    // Per plan v2: this endpoint creates a draft with NO mechanical state.
    // Rolling characteristics happens via /roll-characteristics (dice) or
    // /edit-characteristics (point_buy/direct) as a separate commit.
    if (path === '/start-character' && req.method === 'POST') {
      const body = await req.json()
      const { code, distinguisher, method } = body

      if (!code) return errorResponse('code required', 400)
      if (!distinguisher || typeof distinguisher !== 'string') {
        return errorResponse('distinguisher required', 400)
      }
      const trimmed = distinguisher.trim()
      if (trimmed.length < 3 || trimmed.length > 60) {
        return errorResponse('distinguisher must be 3–60 characters', 400)
      }
      if (!method || !['dice', 'point_buy', 'direct'].includes(method)) {
        return errorResponse('method must be dice | point_buy | direct', 400)
      }

      // Resolve code, verify player has it assigned
      const { data: inviteCode, error: codeErr } = await supabase
        .from('invite_codes')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle()
      if (codeErr) throw codeErr
      if (!inviteCode) return errorResponse('Invalid or inactive code', 400)

      if (!(inviteCode.methods ?? [inviteCode.method]).includes(method)) {
        return errorResponse('Method not allowed for this code', 400)
      }

      const { data: assignment, error: assignErr } = await supabase
        .from('player_codes')
        .select('id')
        .eq('player_id', playerId)
        .eq('invite_code_id', inviteCode.id)
        .maybeSingle()
      if (assignErr) throw assignErr
      if (!assignment) return errorResponse('Code not assigned to you', 403)

      // Enforce 1 code = 1 character forever (also enforced by partial unique
      // index idx_characters_one_per_code_active on draft rows; checking here
      // gives a clean 409 instead of letting the DB error bubble up).
      const { data: existing, error: existErr } = await supabase
        .from('characters')
        .select('id, status')
        .eq('invite_code_id', inviteCode.id)
        .limit(1)
        .maybeSingle()
      if (existErr) throw existErr
      if (existing) {
        return errorResponse('Code already in use — ask admin for a new one', 409)
      }

      const perks: string[] = Array.isArray(inviteCode.perks) ? inviteCode.perks : []
      const insertPayload: Record<string, unknown> = {
        invite_code_id: inviteCode.id,
        player_id: playerId,
        status: 'draft',
        created_by: 'player',
        distinguisher: trimmed,
        method,
        era: inviteCode.era,
        perks,
        max_skill_value: inviteCode.max_skill_value ?? 99,
        // No mechanical state yet — rolled by dedicated endpoints.
        characteristics: {},
        luck: 0,
        age: 0,
        edu_rolls: [],
        rerolls_remaining: inviteCode.reroll_budget ?? 0,
        swap_available: perks.includes('swap_characteristics'),
        swap_used: false,
        reroll_history: [],
        // All commit timestamps NULL — will be set by per-step endpoints.
        characteristics_committed_at: null,
        swap_committed_at: null,
        age_committed_at: null,
        edu_committed_at: null,
        aging_committed_at: null,
        luck_committed_at: null,
        // Empty narrative + soft zone scaffolding.
        name: '', gender: '', appearance: '',
        occupation_skill_points: {}, personal_skill_points: {},
        backstory: {}, equipment: [],
        cash: '', assets: '', spending_level: '',
        derived: {},
      }

      const { data, error } = await supabase
        .from('characters')
        .insert(insertPayload)
        .select()
        .single()
      if (error) {
        if (error.code === '23505') {
          // Could be the per-player distinguisher unique idx OR the
          // one-per-code partial idx — message covers both contexts.
          return errorResponse('Identyfikator zajęty albo kod już ma postać', 409)
        }
        throw error
      }
      return jsonResponse(data)
    }

    // ── POST /characters/:id/reroll — full wipe + new characteristics ─
    // Per plan v2: wipes ALL hard-zone state (cech, wiek, EDU, aging, luck)
    // PLUS soft zone (occupation+) PLUS narrative. Consumes one reroll token.
    // Then rolls new characteristics ONLY — luck/age/edu/aging come from the
    // per-step endpoints again. Dice method only.
    const rerollMatch = path.match(/^\/characters\/([^/]+)\/reroll$/)
    if (rerollMatch && req.method === 'POST') {
      const charId = rerollMatch[1]

      const { data: char, error: charErr } = await supabase
        .from('characters')
        .select('*')
        .eq('id', charId)
        .eq('player_id', playerId)
        .single()
      if (charErr) return errorResponse('Character not found', 404)

      if (char.method !== 'dice') {
        return errorResponse('Reroll is dice-only; use edit-characteristics for other methods', 400)
      }
      if (char.status !== 'draft') {
        return errorResponse('Cannot reroll a submitted character', 400)
      }
      if ((char.rerolls_remaining ?? 0) <= 0) {
        return errorResponse('No rerolls remaining', 403)
      }

      const nowIso = new Date().toISOString()
      const historyEntry = {
        at: nowIso,
        scope: 'reroll',
        previous_characteristics: char.characteristics,
        previous_luck: char.luck,
        previous_age: char.age,
        previous_edu_rolls: char.edu_rolls,
      }

      // Atomic decrement; raises if nothing to consume (race safety).
      const { data: newRemaining, error: rpcErr } = await supabase
        .rpc('consume_reroll', { character_id: charId })
      if (rpcErr) return errorResponse(rpcErr.message, 403)

      // Atomic append (race-safe; replaces read-modify-write).
      const { error: appendErr } = await supabase
        .rpc('append_reroll_history', { character_id: charId, entry: historyEntry })
      if (appendErr) return errorResponse(appendErr.message, 500)

      // Apply HARD_ZONE_WIPE then immediately roll new cechy + commit.
      const newChars = rollAllCharacteristics()
      const { data, error } = await supabase
        .from('characters')
        .update({
          ...HARD_ZONE_WIPE,
          characteristics: newChars,
          characteristics_committed_at: nowIso,
          rerolls_remaining: newRemaining,
        })
        .eq('id', charId)
        .select()
        .single()
      if (error) throw error
      return jsonResponse(data)
    }

    // ── POST /characters/:id/roll-characteristics — dice only, server-side ─
    // Step 2 of new hard-zone flow. Sets characteristics + commit timestamp.
    // Does NOT roll luck/age (those are separate commits).
    const rollCharsMatch = path.match(/^\/characters\/([^/]+)\/roll-characteristics$/)
    if (rollCharsMatch && req.method === 'POST') {
      const charId = rollCharsMatch[1]

      const { data: char, error: charErr } = await supabase
        .from('characters')
        .select('id, status, method, characteristics_committed_at, player_id')
        .eq('id', charId)
        .eq('player_id', playerId)
        .single()
      if (charErr) return errorResponse('Character not found', 404)

      if (char.status !== 'draft') return errorResponse('Cannot roll on submitted character', 400)
      if (char.method !== 'dice') return errorResponse('Roll endpoint is dice-only; use /edit-characteristics', 400)
      if (char.characteristics_committed_at) {
        return errorResponse('Characteristics already committed; use /reroll to redo', 409)
      }

      const newChars = rollAllCharacteristics()
      const nowIso = new Date().toISOString()
      const { data, error } = await supabase
        .from('characters')
        .update({ characteristics: newChars, characteristics_committed_at: nowIso })
        .eq('id', charId)
        .select()
        .single()
      if (error) throw error
      return jsonResponse(data)
    }

    // ── POST /characters/:id/swap-characteristics — perk-gated value swap ─
    // Step 2b. Optional. Requires swap_available (perk on code) + not yet used.
    // Must be after characteristics commit, before age commit.
    // body: { from: CharacteristicKey, to: CharacteristicKey }
    const swapCharsMatch = path.match(/^\/characters\/([^/]+)\/swap-characteristics$/)
    if (swapCharsMatch && req.method === 'POST') {
      const charId = swapCharsMatch[1]
      const body = await req.json()
      const { from, to } = body

      const VALID_KEYS = ['STR', 'CON', 'SIZ', 'DEX', 'APP', 'INT', 'POW', 'EDU']
      if (!VALID_KEYS.includes(from) || !VALID_KEYS.includes(to)) {
        return errorResponse('from/to must be valid characteristic keys', 400)
      }
      if (from === to) return errorResponse('from and to must differ', 400)

      const { data: char, error: charErr } = await supabase
        .from('characters')
        .select('id, status, characteristics, characteristics_committed_at, swap_available, swap_used, age_committed_at')
        .eq('id', charId)
        .eq('player_id', playerId)
        .single()
      if (charErr) return errorResponse('Character not found', 404)

      if (char.status !== 'draft') return errorResponse('Cannot swap on submitted character', 400)
      if (!char.swap_available) return errorResponse('Swap perk not available on this code', 403)
      if (char.swap_used) return errorResponse('Swap already used', 409)
      if (!char.characteristics_committed_at) {
        return errorResponse('Roll characteristics first', 409)
      }
      if (char.age_committed_at) {
        return errorResponse('Cannot swap after age committed', 409)
      }

      const chars = { ...(char.characteristics as Record<string, number>) }
      const tmp = chars[from]
      chars[from] = chars[to]
      chars[to] = tmp

      const nowIso = new Date().toISOString()
      const { data, error } = await supabase
        .from('characters')
        .update({
          characteristics: chars,
          swap_used: true,
          swap_committed_at: nowIso,
        })
        .eq('id', charId)
        .select()
        .single()
      if (error) throw error
      return jsonResponse(data)
    }

    // ── POST /characters/:id/set-age — commit age ─────────────────
    // Step 3. Forces swap decision before age (swap is a one-shot pre-age
    // window). body: { age: number }
    const setAgeMatch = path.match(/^\/characters\/([^/]+)\/set-age$/)
    if (setAgeMatch && req.method === 'POST') {
      const charId = setAgeMatch[1]
      const body = await req.json()
      const { age } = body

      if (typeof age !== 'number' || age < 15 || age > 99) {
        return errorResponse('age must be a number in [15, 99]', 400)
      }

      const { data: char, error: charErr } = await supabase
        .from('characters')
        .select('id, status, characteristics_committed_at, age_committed_at, swap_available, swap_used')
        .eq('id', charId)
        .eq('player_id', playerId)
        .single()
      if (charErr) return errorResponse('Character not found', 404)

      if (char.status !== 'draft') return errorResponse('Cannot set age on submitted character', 400)
      if (!char.characteristics_committed_at) {
        return errorResponse('Commit characteristics first', 409)
      }
      if (char.age_committed_at) return errorResponse('Age already committed', 409)
      if (char.swap_available && !char.swap_used) {
        return errorResponse(
          'Wykorzystaj zamianę cech lub zrezygnuj z niej przed ustawieniem wieku',
          409,
        )
      }

      const nowIso = new Date().toISOString()
      const { data, error } = await supabase
        .from('characters')
        .update({ age, age_committed_at: nowIso })
        .eq('id', charId)
        .select()
        .single()
      if (error) throw error
      return jsonResponse(data)
    }

    // ── POST /characters/:id/roll-edu — improvement rolls per age ─
    // Step 4. Rolls N times where N = ageRange.eduImprovementChecks.
    // Each roll: if d100 > current EDU, EDU += 1d10. Persists rolls + EDU.
    // For young characters: EDU -5 applied here (per ageModifiers.ts spec).
    const rollEduMatch = path.match(/^\/characters\/([^/]+)\/roll-edu$/)
    if (rollEduMatch && req.method === 'POST') {
      const charId = rollEduMatch[1]

      const { data: char, error: charErr } = await supabase
        .from('characters')
        .select('id, status, age, characteristics, age_committed_at, edu_committed_at')
        .eq('id', charId)
        .eq('player_id', playerId)
        .single()
      if (charErr) return errorResponse('Character not found', 404)

      if (char.status !== 'draft') return errorResponse('Cannot roll on submitted character', 400)
      if (!char.age_committed_at) return errorResponse('Commit age first', 409)
      if (char.edu_committed_at) return errorResponse('EDU rolls already committed', 409)

      const age = char.age as number
      const mods = getAgeModifications(age)
      if (!mods) return errorResponse('Invalid age (no age range)', 400)

      const characteristics = { ...(char.characteristics as Record<string, number>) }
      let edu = characteristics.EDU ?? 0

      // Young: EDU -5 (clamped at 1).
      if (isYoungCharacter(age)) {
        edu = Math.max(1, edu - 5)
      }

      // Improvement rolls.
      const rolls: { roll: number; improved: boolean; gained: number; new_edu: number }[] = []
      for (let i = 0; i < mods.eduImprovementChecks; i++) {
        const roll = rollDie(100)
        const improved = roll > edu
        const gained = improved ? rollDie(10) : 0
        if (improved) edu = Math.min(99, edu + gained)
        rolls.push({ roll, improved, gained, new_edu: edu })
      }

      characteristics.EDU = edu
      const nowIso = new Date().toISOString()
      const { data, error } = await supabase
        .from('characters')
        .update({
          characteristics,
          edu_rolls: rolls,
          edu_committed_at: nowIso,
        })
        .eq('id', charId)
        .select()
        .single()
      if (error) throw error
      return jsonResponse(data)
    }

    // ── POST /characters/:id/apply-aging-penalties — physical deductions ─
    // Step 5. body: { deductions: { STR?: number, CON?: number, DEX?: number, SIZ?: number } }
    // Validates: total matches required, all stats are deductible for age,
    // no stat goes below 1. Also applies APP reduction (40+) automatically.
    const agingMatch = path.match(/^\/characters\/([^/]+)\/apply-aging-penalties$/)
    if (agingMatch && req.method === 'POST') {
      const charId = agingMatch[1]
      const body = await req.json()
      const { deductions } = body

      if (!deductions || typeof deductions !== 'object') {
        return errorResponse('deductions object required', 400)
      }

      const { data: char, error: charErr } = await supabase
        .from('characters')
        .select('id, status, age, characteristics, edu_committed_at, aging_committed_at')
        .eq('id', charId)
        .eq('player_id', playerId)
        .single()
      if (charErr) return errorResponse('Character not found', 404)

      if (char.status !== 'draft') return errorResponse('Cannot apply on submitted character', 400)
      if (!char.edu_committed_at) return errorResponse('Roll EDU first', 409)
      if (char.aging_committed_at) return errorResponse('Aging penalties already committed', 409)

      const age = char.age as number
      const mods = getAgeModifications(age)
      if (!mods) return errorResponse('Invalid age', 400)

      const allowed = getDeductibleStats(age)
      const characteristics = { ...(char.characteristics as Record<string, number>) }

      // Validate deductions sum + allowed stats + min-1 invariant.
      let total = 0
      for (const [k, v] of Object.entries(deductions)) {
        if (typeof v !== 'number' || v < 0) {
          return errorResponse(`deductions.${k} must be a non-negative number`, 400)
        }
        if (v > 0 && !allowed.includes(k)) {
          return errorResponse(`Cannot deduct from ${k} at age ${age} (allowed: ${allowed.join(', ')})`, 400)
        }
        if ((characteristics[k] ?? 0) - v < 1) {
          return errorResponse(`${k} would drop below 1`, 400)
        }
        total += v
      }
      if (total !== mods.deductionPoints) {
        return errorResponse(`Must distribute exactly ${mods.deductionPoints} deduction points (got ${total})`, 400)
      }

      // Apply deductions.
      for (const [k, v] of Object.entries(deductions)) {
        characteristics[k] = Math.max(1, (characteristics[k] ?? 0) - (v as number))
      }

      // Apply APP reduction (40+).
      if (mods.appReduction > 0) {
        characteristics.APP = Math.max(1, (characteristics.APP ?? 0) - mods.appReduction)
      }

      const nowIso = new Date().toISOString()
      const { data, error } = await supabase
        .from('characters')
        .update({
          characteristics,
          aging_committed_at: nowIso,
        })
        .eq('id', charId)
        .select()
        .single()
      if (error) throw error
      return jsonResponse(data)
    }

    // ── POST /characters/:id/roll-luck — final hard-zone step ─────
    // Step 6. Young (15–19): max(3d6×5, 3d6×5). Otherwise: 3d6×5.
    const rollLuckMatch = path.match(/^\/characters\/([^/]+)\/roll-luck$/)
    if (rollLuckMatch && req.method === 'POST') {
      const charId = rollLuckMatch[1]

      const { data: char, error: charErr } = await supabase
        .from('characters')
        .select('id, status, age, aging_committed_at, luck_committed_at')
        .eq('id', charId)
        .eq('player_id', playerId)
        .single()
      if (charErr) return errorResponse('Character not found', 404)

      if (char.status !== 'draft') return errorResponse('Cannot roll on submitted character', 400)
      if (!char.aging_committed_at) return errorResponse('Apply aging penalties first', 409)
      if (char.luck_committed_at) return errorResponse('Luck already committed', 409)

      const luck = rollLuckForAge(char.age as number ?? 30)
      const nowIso = new Date().toISOString()
      const { data, error } = await supabase
        .from('characters')
        .update({ luck, luck_committed_at: nowIso })
        .eq('id', charId)
        .select()
        .single()
      if (error) throw error
      return jsonResponse(data)
    }

    // ── POST /characters/:id/edit-characteristics — point_buy/direct manual edit ─
    const editCharMatch = path.match(/^\/characters\/([^/]+)\/edit-characteristics$/)
    if (editCharMatch && req.method === 'POST') {
      const charId = editCharMatch[1]

      const { data: char, error: charErr } = await supabase
        .from('characters')
        .select('*')
        .eq('id', charId)
        .eq('player_id', playerId)
        .single()
      if (charErr) return errorResponse('Character not found', 404)

      if (char.method === 'dice') {
        return errorResponse('Dice method must use /reroll', 400)
      }
      if (char.status !== 'draft') {
        return errorResponse('Cannot edit a submitted character', 400)
      }

      const body = await req.json()
      const { characteristics, luck } = body
      if (!characteristics || typeof characteristics !== 'object') {
        return errorResponse('characteristics required', 400)
      }

      const required = ['STR', 'CON', 'SIZ', 'DEX', 'APP', 'INT', 'POW', 'EDU']
      for (const k of required) {
        if (typeof characteristics[k] !== 'number') {
          return errorResponse(`characteristics.${k} must be a number`, 400)
        }
      }

      const nowIso = new Date().toISOString()
      const history = Array.isArray(char.reroll_history) ? char.reroll_history : []
      history.push({
        at: nowIso,
        scope: 'manual_edit',
        previous_characteristics: char.characteristics,
        previous_luck: char.luck,
      })

      const { data, error } = await supabase
        .from('characters')
        .update({
          ...DOWNSTREAM_WIPE,
          characteristics,
          luck: typeof luck === 'number' ? luck : (char.luck ?? 0),
          characteristics_committed_at: nowIso,
          reroll_history: history,
        })
        .eq('id', charId)
        .select()
        .single()
      if (error) throw error
      return jsonResponse(data)
    }

    // ── POST /characters/:id/go-back-to-step — soft back-step ─────
    // Soft zone only (occupation onward). Wipes fields ≥ target step;
    // pre-occupation state (cech/wiek/luck/edu/aging/swap) and narrative
    // and identity preserved. No reroll token consumed.
    // body: { step: 'occupation' | 'occupation_skills' | 'personal_skills' |
    //                'wealth_equipment' | 'positions_contacts' }
    const goBackMatch = path.match(/^\/characters\/([^/]+)\/go-back-to-step$/)
    if (goBackMatch && req.method === 'POST') {
      const charId = goBackMatch[1]
      const body = await req.json()
      const { step } = body

      const VALID_STEPS = ['occupation', 'occupation_skills', 'personal_skills', 'wealth_equipment', 'positions_contacts']
      if (!VALID_STEPS.includes(step)) {
        return errorResponse(`step must be one of: ${VALID_STEPS.join(', ')}`, 400)
      }

      const { data: char, error: charErr } = await supabase
        .from('characters')
        .select('id, status, draft_step')
        .eq('id', charId)
        .eq('player_id', playerId)
        .single()
      if (charErr) return errorResponse('Character not found', 404)
      if (char.status !== 'draft') return errorResponse('Cannot back-step on submitted character', 400)

      // Cascade wipe: each step wipes itself + everything below.
      // Order matters; SOFT_WIPE_CASCADE[i] wipes stage i and all later.
      const cascade: Record<string, Record<string, unknown>> = {
        occupation: {
          occupation_id: null,
          occupation_skill_points: {},
          personal_skill_points: {},
          equipment: [],
          cash: '',
          assets: '',
          spending_level: '',
          lifestyle_rating: null,
          lifestyle_stars: null,
          lifestyle_label: null,
          spending_free: null,
          assets_breakdown: [],
          equipment_catalogs_available: [],
          positions: [],
          contacts: [],
          main_position: null,
          additional_positions: [],
          contacts_v2: [],
        },
        occupation_skills: {
          occupation_skill_points: {},
          personal_skill_points: {},
          equipment: [],
          cash: '',
          assets: '',
          spending_level: '',
          lifestyle_rating: null,
          lifestyle_stars: null,
          lifestyle_label: null,
          spending_free: null,
          assets_breakdown: [],
          equipment_catalogs_available: [],
          positions: [],
          contacts: [],
          main_position: null,
          additional_positions: [],
          contacts_v2: [],
        },
        personal_skills: {
          personal_skill_points: {},
          equipment: [],
          cash: '',
          assets: '',
          spending_level: '',
          lifestyle_rating: null,
          lifestyle_stars: null,
          lifestyle_label: null,
          spending_free: null,
          assets_breakdown: [],
          equipment_catalogs_available: [],
          positions: [],
          contacts: [],
          main_position: null,
          additional_positions: [],
          contacts_v2: [],
        },
        wealth_equipment: {
          equipment: [],
          cash: '',
          assets: '',
          spending_level: '',
          lifestyle_rating: null,
          lifestyle_stars: null,
          lifestyle_label: null,
          spending_free: null,
          assets_breakdown: [],
          equipment_catalogs_available: [],
          positions: [],
          contacts: [],
          main_position: null,
          additional_positions: [],
          contacts_v2: [],
        },
        positions_contacts: {
          positions: [],
          contacts: [],
          main_position: null,
          additional_positions: [],
          contacts_v2: [],
        },
      }

      const wipeFields = cascade[step]
      const { data, error } = await supabase
        .from('characters')
        .update({ ...wipeFields, draft_step: step })
        .eq('id', charId)
        .select()
        .single()
      if (error) throw error
      return jsonResponse(data)
    }

    // ── PUT /characters/:id/distinguisher — anytime, even post-submit ─
    // body: { distinguisher: string (3–60 chars) }
    // Uniqueness per-player enforced by partial unique index from 018.
    const distMatch = path.match(/^\/characters\/([^/]+)\/distinguisher$/)
    if (distMatch && req.method === 'PUT') {
      const charId = distMatch[1]
      const body = await req.json()
      const { distinguisher } = body

      if (typeof distinguisher !== 'string') {
        return errorResponse('distinguisher must be a string', 400)
      }
      const trimmed = distinguisher.trim()
      if (trimmed.length < 3 || trimmed.length > 60) {
        return errorResponse('distinguisher must be 3–60 characters', 400)
      }

      // Verify ownership only — no status check; editable post-submit per spec.
      const { data: char, error: ownerErr } = await supabase
        .from('characters')
        .select('id')
        .eq('id', charId)
        .eq('player_id', playerId)
        .single()
      if (ownerErr) return errorResponse('Character not found', 404)

      const { data, error } = await supabase
        .from('characters')
        .update({ distinguisher: trimmed })
        .eq('id', char.id)
        .select()
        .single()
      if (error) {
        if (error.code === '23505') {
          return errorResponse('Identyfikator już zajęty przez inną twoją postać', 409)
        }
        throw error
      }
      return jsonResponse(data)
    }

    // ── PUT /characters/:id/narrative — anytime, also post-submit ──
    // Allowlist of narrative fields. Body subset of:
    //   name, appearance, residence, birthplace, player_name, gender,
    //   backstory (full object replacement),
    //   portrait_url, art_prompt, art_gallery, portrait_crop_data
    const NARRATIVE_ALLOWLIST = new Set([
      'name', 'appearance', 'residence', 'birthplace', 'player_name', 'gender',
      'backstory',
      'portrait_url', 'art_prompt', 'art_gallery', 'portrait_crop_data',
    ])
    const narrMatch = path.match(/^\/characters\/([^/]+)\/narrative$/)
    if (narrMatch && req.method === 'PUT') {
      const charId = narrMatch[1]
      const body = await req.json()
      if (!body || typeof body !== 'object') return errorResponse('body required', 400)

      const { data: char, error: ownerErr } = await supabase
        .from('characters')
        .select('id')
        .eq('id', charId)
        .eq('player_id', playerId)
        .single()
      if (ownerErr) return errorResponse('Character not found', 404)

      const rejected: string[] = []
      const filtered: Record<string, unknown> = {}
      for (const k of Object.keys(body)) {
        if (NARRATIVE_ALLOWLIST.has(k)) {
          filtered[k] = (body as Record<string, unknown>)[k]
        } else {
          rejected.push(k)
        }
      }
      if (rejected.length > 0) {
        return errorResponse(
          `Fields not allowed via /narrative: ${rejected.join(', ')}`,
          400,
        )
      }
      if (Object.keys(filtered).length === 0) {
        return errorResponse('No allowed narrative fields in body', 400)
      }

      const { data, error } = await supabase
        .from('characters')
        .update(filtered)
        .eq('id', char.id)
        .select()
        .single()
      if (error) throw error
      return jsonResponse(data)
    }

    // ── POST /characters/:id/submit — flip draft → submitted ──────
    // Validates all hard-zone commits are present (for dice flow).
    // For point_buy/direct: only characteristics_committed_at required.
    const submitMatch = path.match(/^\/characters\/([^/]+)\/submit$/)
    if (submitMatch && req.method === 'POST') {
      const charId = submitMatch[1]

      const { data: char, error: charErr } = await supabase
        .from('characters')
        .select('id, status, method, characteristics_committed_at, age_committed_at, edu_committed_at, aging_committed_at, luck_committed_at, swap_available, swap_used')
        .eq('id', charId)
        .eq('player_id', playerId)
        .single()
      if (charErr) return errorResponse('Character not found', 404)
      if (char.status === 'submitted') return errorResponse('Already submitted', 409)
      if (char.status !== 'draft') return errorResponse('Character is not a draft', 400)

      if (!char.characteristics_committed_at) {
        return errorResponse('Cechy nie zostały jeszcze zatwierdzone', 409)
      }
      // For dice flow, all per-step commits must be present.
      if (char.method === 'dice') {
        const missing: string[] = []
        if (!char.age_committed_at) missing.push('wiek')
        if (!char.edu_committed_at) missing.push('rzuty EDU')
        if (!char.aging_committed_at) missing.push('obniżenia wiekowe')
        if (!char.luck_committed_at) missing.push('szczęście')
        if (char.swap_available && !char.swap_used) missing.push('decyzja o zamianie cech')
        if (missing.length > 0) {
          return errorResponse(`Brakujące kroki przed zatwierdzeniem: ${missing.join(', ')}`, 409)
        }
      }

      const { data, error } = await supabase
        .from('characters')
        .update({ status: 'submitted' })
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
