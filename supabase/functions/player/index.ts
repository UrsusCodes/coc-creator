import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import bcryptjs from 'https://esm.sh/bcryptjs@3.0.2'
const bcryptCompare = (pw: string, hash: string) => bcryptjs.compareSync(pw, hash)
import { create, verify } from 'https://deno.land/x/djwt@v3.0.2/mod.ts'
import { Image } from 'https://deno.land/x/imagescript@1.2.17/mod.ts'

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

// ─── Optional per-code roll constraints ───────────────────────
// A profile can pin a characteristic to a fixed value, bound it to a
// [min,max] band, and/or bound the mean of all eight. Bands are honoured by
// resampling the natural formula (keeping the ×5 granularity and a plausible
// distribution) and only clamped as a last-resort guarantee. Absent profile =
// unconstrained roll, identical to the original behaviour.
interface RollConstraint {
  fixed?: number | null
  min?: number | null
  max?: number | null
}
interface RollProfile {
  chars?: Record<string, RollConstraint>
  avgMin?: number | null
  avgMax?: number | null
}
interface RollOptions {
  initial?: RollProfile | null
  rerolls?: (RollProfile | null)[] | null
}

function clampVal(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function rollOneConstrained(key: string, c?: RollConstraint | null): number {
  const formula = CHARACTERISTIC_FORMULAS[key]
  // Snap fixed values to the ×5 grid so a pinned stat is indistinguishable
  // from a real dice result.
  if (c && c.fixed != null) return clampVal(Math.round(c.fixed / 5) * 5, 1, 99)
  const lo = c && c.min != null ? c.min : null
  const hi = c && c.max != null ? c.max : null
  let val = rollCharacteristic(formula)
  if (lo != null || hi != null) {
    for (let i = 0; i < 80; i++) {
      if ((lo == null || val >= lo) && (hi == null || val <= hi)) break
      val = rollCharacteristic(formula)
    }
    val = clampVal(val, lo ?? 1, hi ?? 99)
  }
  return val
}

// Nudge the closest attempt into the mean band deterministically: step the
// lowest adjustable stats up (or highest down) by 5 until the mean clears the
// bound. Keeps ×5 granularity, never touches fixed stats, and honours each
// stat's own [min,max]. Runs only as a fallback when resampling fell short, so
// natural rolls are untouched.
function adjustToBand(out: Record<string, number>, profile: RollProfile): Record<string, number> {
  const keys = Object.keys(CHARACTERISTIC_FORMULAS)
  const avgMin = profile.avgMin ?? null
  const avgMax = profile.avgMax ?? null
  const adjustable = keys.filter((k) => !(profile.chars?.[k]?.fixed != null))
  const boundsOf = (k: string) => {
    const c = profile.chars?.[k]
    return { lo: c?.min != null ? c.min : 1, hi: c?.max != null ? c.max : 99 }
  }
  const mean = () => keys.reduce((s, k) => s + out[k], 0) / keys.length

  let guard = 0
  while (avgMin != null && mean() < avgMin && guard++ < 2000) {
    let target: string | null = null
    for (const k of adjustable) {
      if (out[k] + 5 <= boundsOf(k).hi && (target === null || out[k] < out[target])) target = k
    }
    if (target === null) break
    out[target] += 5
  }
  guard = 0
  while (avgMax != null && mean() > avgMax && guard++ < 2000) {
    let target: string | null = null
    for (const k of adjustable) {
      if (out[k] - 5 >= boundsOf(k).lo && (target === null || out[k] > out[target])) target = k
    }
    if (target === null) break
    out[target] -= 5
  }
  return out
}

function rollAllCharacteristics(profile?: RollProfile | null): Record<string, number> {
  const keys = Object.keys(CHARACTERISTIC_FORMULAS)
  const rollOnce = (): Record<string, number> => {
    const out: Record<string, number> = {}
    for (const key of keys) out[key] = rollOneConstrained(key, profile?.chars?.[key])
    return out
  }
  const avgMin = profile?.avgMin ?? null
  const avgMax = profile?.avgMax ?? null
  if (avgMin == null && avgMax == null) return rollOnce()

  // Resample the whole set until the mean lands in the band; keep the closest
  // attempt as a fallback so a too-tight band never loops forever.
  let best: Record<string, number> | null = null
  let bestDist = Infinity
  for (let a = 0; a < 400; a++) {
    const out = rollOnce()
    const avg = keys.reduce((s, k) => s + out[k], 0) / keys.length
    if ((avgMin == null || avg >= avgMin) && (avgMax == null || avg <= avgMax)) return out
    const target = avgMin != null && avg < avgMin ? avgMin : avgMax != null && avg > avgMax ? avgMax : avg
    const dist = Math.abs(avg - target)
    if (dist < bestDist) { bestDist = dist; best = out }
  }
  return adjustToBand(best ?? rollOnce(), profile!)
}

// Load a code's roll options (if any). Returns null when the code has none, so
// callers fall straight through to the unconstrained roll.
async function loadRollOptions(
  supabase: ReturnType<typeof createClient>,
  inviteCodeId: string | null | undefined,
): Promise<RollOptions | null> {
  if (!inviteCodeId) return null
  const { data, error } = await supabase
    .from('invite_codes')
    .select('roll_options')
    .eq('id', inviteCodeId)
    .maybeSingle()
  if (error || !data) return null
  return (data.roll_options as RollOptions | null) ?? null
}

function rollLuckForAge(age: number): number {
  // "Young" bonus: 15–19 rolls twice takes best. Otherwise single 3d6x5.
  if (age >= 15 && age <= 19) {
    return Math.max(roll3d6x5(), roll3d6x5())
  }
  return roll3d6x5()
}

// Apply an optional luck constraint. `fixed` pins the value (snapped to ×5);
// a min/max band is honoured by resampling the age-appropriate luck roll, then
// clamped as a guarantee. `roller` re-rolls luck the same way as the base.
function constrainLuck(base: number, roller: () => number, c?: RollConstraint | null): number {
  if (!c) return base
  if (c.fixed != null) return clampVal(Math.round(c.fixed / 5) * 5, 1, 99)
  const lo = c.min != null ? c.min : null
  const hi = c.max != null ? c.max : null
  let val = base
  if (lo != null || hi != null) {
    for (let i = 0; i < 80; i++) {
      if ((lo == null || val >= lo) && (hi == null || val <= hi)) break
      val = roller()
    }
    val = clampVal(val, lo ?? 1, hi ?? 99)
  }
  return val
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
/**
 * Mirrors src/lib/ageModifiers.ts — endpoints below pull
 * `eduImprovementChecks`, `deductionPoints`, `appReduction` off the
 * returned object. AgeRange already has all three, so this is a thin
 * alias plus null-on-out-of-range. Kept as a separate function so
 * call sites read the same as the client lib.
 */
function getAgeModifications(age: number): AgeRange | null {
  return getAgeRange(age) ?? null
}

// ─── Portrait style transforms (post-Gemini, server-side) ──────
// Spec: docs/CoCCreator_obsidian/specs/portrait_prompt_methodology.md
// Each Gemini master image is decoded once, then transformed into 4
// stylistic variants in pixel space:
//   color  — master untouched, re-encoded as JPEG
//   faded  — saturation reduced (lerp toward grayscale)
//   sepia  — classic sepia matrix
//   bw     — luminance grayscale
// All 4 returned as JPEG Uint8Arrays for upload to Storage.
async function buildStyleVariants(
  master: Image,
): Promise<Record<'color' | 'faded' | 'sepia' | 'bw', Uint8Array>> {
  const colorImg = master.clone()
  const fadedImg = master.clone()
  const sepiaImg = master.clone()
  const bwImg = master.clone()

  // imagescript bitmap is RGBA Uint8ClampedArray (4 bytes per pixel).
  applyPixelTransform(fadedImg, (r, g, b) => {
    const y = 0.299 * r + 0.587 * g + 0.114 * b
    // 70% original color + 30% gray → muted
    return [r * 0.7 + y * 0.3, g * 0.7 + y * 0.3, b * 0.7 + y * 0.3]
  })

  applyPixelTransform(sepiaImg, (r, g, b) => [
    Math.min(255, 0.393 * r + 0.769 * g + 0.189 * b),
    Math.min(255, 0.349 * r + 0.686 * g + 0.168 * b),
    Math.min(255, 0.272 * r + 0.534 * g + 0.131 * b),
  ])

  applyPixelTransform(bwImg, (r, g, b) => {
    const y = 0.299 * r + 0.587 * g + 0.114 * b
    return [y, y, y]
  })

  // JPEG quality 85 — good balance for portraits + Storage size
  const [color, faded, sepia, bw] = await Promise.all([
    colorImg.encodeJPEG(85),
    fadedImg.encodeJPEG(85),
    sepiaImg.encodeJPEG(85),
    bwImg.encodeJPEG(85),
  ])

  return { color, faded, sepia, bw }
}

function applyPixelTransform(
  img: Image,
  fn: (r: number, g: number, b: number) => [number, number, number],
): void {
  const data = img.bitmap
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = fn(data[i], data[i + 1], data[i + 2])
    data[i] = Math.round(Math.max(0, Math.min(255, r)))
    data[i + 1] = Math.round(Math.max(0, Math.min(255, g)))
    data[i + 2] = Math.round(Math.max(0, Math.min(255, b)))
    // alpha (data[i + 3]) untouched
  }
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

    // ── POST /characters/:id/enhance-prompt ─────────────────────────
    // Calls Gemini 2.5 Flash in TEXT mode (free tier) to rewrite the
    // deterministic prompt into a single cohesive paragraph, folding in
    // character-specific visual cues. Different from the deactivated
    // image-gen endpoint — text mode is free for ~250 RPD across the
    // whole project, comfortably enough for a small play group.
    const enhanceMatch = path.match(/^\/characters\/([^/]+)\/enhance-prompt$/)
    if (enhanceMatch && req.method === 'POST') {
      const charId = enhanceMatch[1]

      // Ownership
      const { error: ownerErr } = await supabase
        .from('characters')
        .select('id')
        .eq('id', charId)
        .eq('player_id', playerId)
        .single()
      if (ownerErr) return errorResponse('Character not found', 404)

      // Server-side admin key
      const geminiApiKey = Deno.env.get('GEMINI_API_KEY') ?? ''
      if (!geminiApiKey) {
        return errorResponse(
          'Server is not configured for AI prompt enhancement.',
          503,
        )
      }

      const body = await req.json().catch(() => ({}))
      const rawPrompt = typeof body.rawPrompt === 'string' ? body.rawPrompt.trim() : ''
      const visualCues = typeof body.visualCues === 'string' ? body.visualCues.trim() : ''
      const occupationEn =
        typeof body.occupationEn === 'string' ? body.occupationEn.trim() : ''

      if (!rawPrompt || rawPrompt.length < 50) {
        return errorResponse('rawPrompt required (≥50 chars)', 400)
      }
      if (rawPrompt.length > 4000) {
        return errorResponse('rawPrompt too long (max 4000 chars)', 400)
      }

      const systemInstruction =
        'You are a prompt engineer for 1920s photorealistic portrait generation in a Call of Cthulhu RPG context. ' +
        'Rewrite the structured prompt below into a single cohesive English paragraph (250-450 words). ' +
        'Preserve every factual detail (era, framing, aspect ratio, photorealism, color treatment, no-text directive, age, gender, profession, appearance description, modifications). ' +
        'IMPORTANT — clothing skeleton is intentionally minimal: substitute era-appropriate accessories, jewelry, fabric textures, and small details that fit THIS specific character (their profession, personality cues, age). Do NOT copy the structured clothing list verbatim and do NOT default to stereotypical "feathered headpiece, art deco jewelry" for every elegant woman or "silk pocket square" for every elegant man — vary across requests. ' +
        'Use the character visual cues sparingly to add psychological texture (gaze, expression, posture) — only what would actually show in a photograph. ' +
        'Subtle uneasy / occult atmosphere is welcome ONLY when input mentions it explicitly. No fantasy or supernatural elements unless mentioned. ' +
        'Output ONLY the rewritten prompt — no preamble, no commentary, no quotes around it.'

      const userMessage =
        `=== STRUCTURED PROMPT (preserve all details) ===\n${rawPrompt}\n\n` +
        (occupationEn ? `=== PROFESSION (1920s) ===\n${occupationEn}\n\n` : '') +
        `=== CHARACTER VISUAL CUES (use sparingly) ===\n${visualCues || '- (none)'}\n\n` +
        `Output the rewritten prompt now.`

      const geminiUrl =
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ parts: [{ text: userMessage }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
            // gemini-2.5-flash defaults to thinking mode which consumes
            // tokens before final output. Prompt rewriting doesn't need
            // deep reasoning — disable to give all budget to the
            // response and avoid truncation at ~halfway through.
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      })

      if (!geminiRes.ok) {
        const txt = await geminiRes.text()
        const status = geminiRes.status
        console.error(`[enhance-prompt] Gemini ${status}:`, txt.slice(0, 600))
        if (status === 429) {
          return jsonResponse(
            {
              error: 'quota_exhausted',
              detail:
                'Dzienna pula darmowych ulepszeń AI została wyczerpana. Wróć jutro lub użyj wersji deterministycznej.',
            },
            429,
          )
        }
        if (status === 401 || status === 403) {
          return jsonResponse(
            { error: 'gemini_auth_failed', detail: txt.slice(0, 200) },
            502,
          )
        }
        return jsonResponse(
          { error: 'gemini_error', status, detail: txt.slice(0, 300) },
          502,
        )
      }

      const data = await geminiRes.json()
      const candidates = data.candidates ?? []
      const parts = candidates[0]?.content?.parts ?? []
      const enhancedPrompt = parts
        .filter((p: { text?: string }) => typeof p.text === 'string')
        .map((p: { text?: string }) => p.text)
        .join('')
        .trim()

      if (!enhancedPrompt) {
        const finishReason = candidates[0]?.finishReason
        console.error(
          `[enhance-prompt] No text in response. finishReason=${finishReason}`,
        )
        return jsonResponse(
          { error: 'no_text_in_response', finishReason: finishReason ?? null },
          502,
        )
      }

      return jsonResponse({ enhancedPrompt })
    }

    // ── POST /characters/:id/generate-portrait ─────────────────────
    // ⚠️  DEADCODE — disabled 2026-04-28 after Gemini API turned out to
    //     be paid-only for image generation (~$0.04/image). The CoC
    //     Creator pivoted to a Chat-paste flow (player runs gemini.google.com
    //     manually, pastes the result back into the panel, and the
    //     client does style transforms in canvas) — see
    //     docs/CoCCreator_obsidian/specs/portrait_prompt_methodology.md.
    //
    //     Kept here verbatim because it is a fully-working server-side
    //     pipeline (rate-limit + Gemini call + 4-style pixel transform +
    //     Storage upload + log row). Reactivation requires only:
    //       1) Remove the early-return guard below.
    //       2) Restore `playerGeneratePortrait` wrapper in src/lib/player.ts.
    //       3) Set GEMINI_API_KEY (or other provider key) in edge-fn secrets.
    //       4) Re-add the "Wygeneruj N" button in GeneratePortraitPanel.
    //
    //     The accompanying migration (020_portrait_generations) and the
    //     `imagescript` import stay in place too — both are needed when
    //     this endpoint comes back.
    const generateMatch = path.match(/^\/characters\/([^/]+)\/generate-portrait$/)
    if (generateMatch && req.method === 'POST') {
      return jsonResponse(
        {
          error: 'endpoint_deactivated',
          detail:
            'Portrait API generation is currently disabled. The app uses a Chat-paste flow — see GeneratePortraitPanel in the player viewer.',
        },
        410, // Gone — semantically correct for "feature retired"
      )
      // The body below is unreachable but preserved for reactivation.
      // eslint-disable-next-line no-unreachable
      const charId = generateMatch[1]

      // ── 1a. Ownership check ──
      const { data: charRow, error: ownerErr } = await supabase
        .from('characters')
        .select('id, art_gallery')
        .eq('id', charId)
        .eq('player_id', playerId)
        .single()
      if (ownerErr || !charRow) return errorResponse('Character not found', 404)

      // ── 1b. Server-side admin key (env, never sent from client) ──
      const geminiApiKey = Deno.env.get('GEMINI_API_KEY') ?? ''
      if (!geminiApiKey) {
        return errorResponse('Server is not configured for portrait generation', 503)
      }

      // ── 1c. Parse + validate body ──
      const body = await req.json().catch(() => ({}))
      const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
      const clothingChip = typeof body.clothingChip === 'string' ? body.clothingChip : ''
      const lightingChip = typeof body.lightingChip === 'string' ? body.lightingChip : ''
      const backgroundChipId =
        typeof body.backgroundChipId === 'string' ? body.backgroundChipId : ''
      const fieldOverrides =
        body.fieldOverrides && typeof body.fieldOverrides === 'object'
          ? body.fieldOverrides
          : {}
      const korekty = typeof body.korekty === 'string' ? body.korekty : ''
      const requestedCount = typeof body.count === 'number' ? Math.floor(body.count) : 2
      const masterCount = Math.max(1, Math.min(3, requestedCount))

      if (!prompt || prompt.length < 50) {
        return errorResponse('prompt required (≥50 chars)', 400)
      }
      if (prompt.length > 4000) {
        return errorResponse('prompt too long (max 4000 chars)', 400)
      }
      if (!['niedbale', 'codzienne', 'eleganckie', 'zawodowe'].includes(clothingChip)) {
        return errorResponse('clothingChip invalid', 400)
      }
      if (!['hollywood', 'natural', 'noir'].includes(lightingChip)) {
        return errorResponse('lightingChip invalid', 400)
      }

      // ── 1d. Rate limit ──
      const since30s = new Date(Date.now() - 30_000).toISOString()
      const since24h = new Date(Date.now() - 24 * 60 * 60_000).toISOString()
      const { count: cooldownCount, error: cooldownErr } = await supabase
        .from('portrait_generations')
        .select('id', { count: 'exact', head: true })
        .eq('player_id', playerId)
        .gte('created_at', since30s)
      if (cooldownErr) throw cooldownErr
      if ((cooldownCount ?? 0) > 0) {
        return jsonResponse(
          { error: 'rate_limited_cooldown', retry_after_sec: 30 },
          429,
        )
      }
      const { count: dayCount, error: dayErr } = await supabase
        .from('portrait_generations')
        .select('id', { count: 'exact', head: true })
        .eq('player_id', playerId)
        .gte('created_at', since24h)
      if (dayErr) throw dayErr
      const DAILY_LIMIT = 5
      if ((dayCount ?? 0) >= DAILY_LIMIT) {
        return jsonResponse(
          {
            error: 'rate_limited_daily',
            remaining_today: 0,
            daily_limit: DAILY_LIMIT,
          },
          429,
        )
      }

      // ── 2. Insert log row up-front (counts towards limit) ──
      const { data: logRow, error: logErr } = await supabase
        .from('portrait_generations')
        .insert({
          player_id: playerId,
          character_id: charId,
          clothing_chip: clothingChip,
          background_chip_id: backgroundChipId || null,
          lighting_chip: lightingChip,
          field_overrides: fieldOverrides,
          korekty: korekty || null,
          master_count: masterCount,
          succeeded_count: 0,
        })
        .select('id')
        .single()
      if (logErr) throw logErr

      // ── 3. Generate masters + style variants ──
      const wrappedPrompt =
        `Generate a portrait image based on this description. ` +
        `Do not add any text, watermarks, signatures, captions, or borders ` +
        `to the image.\n\n${prompt}`
      // Default model is the image-gen variant; override via GEMINI_MODEL
      // secret if Google rotates the preview alias.
      const geminiModel =
        Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash-image'
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`

      const galleryAdditions: { url: string; label: string; created_at: string }[] = []
      const errors: string[] = []
      let succeeded = 0

      for (let i = 0; i < masterCount; i++) {
        try {
          // 3a. Gemini call
          const geminiRes = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': geminiApiKey,
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: wrappedPrompt }] }],
              generationConfig: { responseModalities: ['IMAGE'] },
            }),
          })

          if (!geminiRes.ok) {
            const txt = await geminiRes.text()
            const status = geminiRes.status
            console.error(`[generate-portrait] Gemini ${status}:`, txt.slice(0, 800))
            // Auth issues — fail the whole batch and surface to user
            if (status === 401 || status === 403) {
              await supabase
                .from('portrait_generations')
                .update({ succeeded_count: succeeded })
                .eq('id', logRow.id)
              return jsonResponse(
                { error: 'gemini_auth_failed', detail: txt.slice(0, 400) },
                502,
              )
            }
            errors.push(`master_${i + 1}: gemini_${status} — ${txt.slice(0, 250)}`)
            continue
          }

          const data = await geminiRes.json()
          const candidates = data.candidates ?? []
          const parts = candidates[0]?.content?.parts ?? []
          const imagePart = parts.find(
            (p: { inlineData?: { mimeType?: string; data?: string } }) =>
              p.inlineData?.mimeType?.startsWith('image/'),
          )
          if (!imagePart?.inlineData?.data) {
            // Surface what the model did return (often a text refusal or
            // safety message) so the player knows what to adjust.
            const textParts = parts
              .filter((p: { text?: string }) => p.text)
              .map((p: { text?: string }) => p.text)
              .join(' ')
              .slice(0, 250)
            const finishReason = candidates[0]?.finishReason
            console.error(
              `[generate-portrait] No image in response. finishReason=${finishReason}, text=${textParts}`,
            )
            errors.push(
              `master_${i + 1}: no_image (${finishReason ?? 'unknown'}) ${textParts}`,
            )
            continue
          }

          // 3b. Decode + generate 4 style variants
          const masterBytes = Uint8Array.from(
            atob(imagePart.inlineData.data),
            (c) => c.charCodeAt(0),
          )
          const decoded = await Image.decode(masterBytes)

          const variants = await buildStyleVariants(decoded)

          // 3c. Upload all 4, append to gallery
          const masterUuid = crypto.randomUUID()
          const masterIdx = i + 1 // 1..masterCount within this batch
          const styleLabels: Record<keyof typeof variants, string> = {
            color: 'kolor',
            faded: 'wyblakły',
            sepia: 'sepia',
            bw: 'czarno-białe',
          }
          const styleOrder: (keyof typeof variants)[] = [
            'color',
            'faded',
            'sepia',
            'bw',
          ]

          for (const styleKey of styleOrder) {
            const filename = `gallery/${charId}/${masterUuid}-${styleKey}.jpg`
            const { error: uploadErr } = await supabase.storage
              .from('portraits')
              .upload(filename, variants[styleKey], {
                contentType: 'image/jpeg',
                upsert: false,
              })
            if (uploadErr) {
              errors.push(`master_${i + 1}_${styleKey}: upload_failed`)
              continue
            }
            const { data: urlData } = supabase.storage
              .from('portraits')
              .getPublicUrl(filename)
            galleryAdditions.push({
              url: urlData.publicUrl,
              label: `AI ${masterIdx} ${styleLabels[styleKey]}`,
              created_at: new Date().toISOString(),
            })
          }

          succeeded++
        } catch (err) {
          errors.push(
            `master_${i + 1}: ${err instanceof Error ? err.message : 'unknown'}`,
          )
        }
      }

      // ── 4a. Append to art_gallery ──
      if (galleryAdditions.length > 0) {
        const newGallery = [
          ...(Array.isArray(charRow.art_gallery) ? charRow.art_gallery : []),
          ...galleryAdditions,
        ]
        const { error: updateErr } = await supabase
          .from('characters')
          .update({ art_gallery: newGallery })
          .eq('id', charId)
        if (updateErr) throw updateErr
      }

      // ── 4b. Update log row's succeeded_count ──
      await supabase
        .from('portrait_generations')
        .update({ succeeded_count: succeeded })
        .eq('id', logRow.id)

      return jsonResponse({
        urls: galleryAdditions.map((g) => g.url),
        gallery_additions: galleryAdditions,
        errors,
        master_count: masterCount,
        succeeded_count: succeeded,
        remaining: {
          daily_limit: DAILY_LIMIT,
          remaining_today: Math.max(0, DAILY_LIMIT - ((dayCount ?? 0) + 1)),
          cooldown_sec: 30,
        },
      })
    }

    // ── POST /characters/:id/append-portraits ──────────────────────
    // Chat-paste flow: client uploaded N×4 style variants directly to
    // Storage (browser canvas + supabase-js anon key) and sends back the
    // resulting public URLs. We:
    //   1. Verify ownership.
    //   2. Whitelist URLs to belong to this character's gallery prefix
    //      (defense against another player attempting to inject URLs).
    //   3. Append entries to art_gallery JSONB.
    // Body: { variants: [{ url: string, label?: string, style?: string }, ...] }
    // (max 32 variants per call to keep the JSONB row reasonable.)
    const appendMatch = path.match(/^\/characters\/([^/]+)\/append-portraits$/)
    if (appendMatch && req.method === 'POST') {
      const charId = appendMatch[1]

      // Ownership check + load current gallery
      const { data: charRow, error: ownerErr } = await supabase
        .from('characters')
        .select('id, art_gallery')
        .eq('id', charId)
        .eq('player_id', playerId)
        .single()
      if (ownerErr || !charRow) return errorResponse('Character not found', 404)

      const body = await req.json().catch(() => ({}))
      const variants = Array.isArray(body.variants) ? body.variants : []
      if (variants.length === 0) return errorResponse('variants required', 400)
      if (variants.length > 32) return errorResponse('too many variants (max 32)', 400)

      // URL whitelist — must be from this project's portraits bucket and
      // start with this character's gallery prefix. We accept any path
      // segment after `gallery/<charId>/` so style suffixes don't matter.
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
      const expectedPrefix = `${supabaseUrl}/storage/v1/object/public/portraits/gallery/${charId}/`
      const cleaned: { url: string; label: string; created_at: string }[] = []
      for (const v of variants) {
        if (!v || typeof v.url !== 'string') {
          return errorResponse('invalid variant entry', 400)
        }
        if (!v.url.startsWith(expectedPrefix)) {
          return errorResponse(
            'variant URL outside this character\'s gallery prefix',
            400,
          )
        }
        const label =
          typeof v.label === 'string' && v.label.length > 0 && v.label.length <= 60
            ? v.label
            : 'AI'
        cleaned.push({
          url: v.url,
          label,
          created_at: new Date().toISOString(),
        })
      }

      const existingGallery = Array.isArray(charRow.art_gallery)
        ? charRow.art_gallery
        : []
      const newGallery = [...existingGallery, ...cleaned]

      const { error: updateErr } = await supabase
        .from('characters')
        .update({ art_gallery: newGallery })
        .eq('id', charId)
      if (updateErr) throw updateErr

      return jsonResponse({
        added_count: cleaned.length,
        gallery_additions: cleaned,
      })
    }

    // ── PUT /characters/:id/profile-portrait ────────────────────────
    // Sets the in-app avatar (full image, no crop). Migration 021 split
    // legacy portrait_url into profile + card variants — this endpoint
    // owns the profile side.
    const profilePortraitMatch = path.match(/^\/characters\/([^/]+)\/profile-portrait$/)
    if (profilePortraitMatch && req.method === 'PUT') {
      const charId = profilePortraitMatch[1]

      const { error: ownerErr } = await supabase
        .from('characters')
        .select('id')
        .eq('id', charId)
        .eq('player_id', playerId)
        .single()
      if (ownerErr) return errorResponse('Character not found', 404)

      const body = await req.json()
      const { url } = body
      if (typeof url !== 'string' || !url) {
        return errorResponse('url required', 400)
      }

      const { data, error } = await supabase
        .from('characters')
        .update({ profile_portrait_url: url })
        .eq('id', charId)
        .select('id, profile_portrait_url')
        .single()
      if (error) throw error
      return jsonResponse(data)
    }

    // ── PUT /characters/:id/card-portrait ───────────────────────────
    // Sets the PDF-card portrait (cropped/filtered image). Optional
    // crop_data is stored alongside for future render-time adjustments.
    const cardPortraitMatch = path.match(/^\/characters\/([^/]+)\/card-portrait$/)
    if (cardPortraitMatch && req.method === 'PUT') {
      const charId = cardPortraitMatch[1]

      const { error: ownerErr } = await supabase
        .from('characters')
        .select('id')
        .eq('id', charId)
        .eq('player_id', playerId)
        .single()
      if (ownerErr) return errorResponse('Character not found', 404)

      const body = await req.json()
      const { url, crop_data } = body
      if (typeof url !== 'string' || !url) {
        return errorResponse('url required', 400)
      }

      const updateData: Record<string, unknown> = { card_portrait_url: url }
      if (crop_data !== undefined) updateData.card_portrait_crop_data = crop_data

      const { data, error } = await supabase
        .from('characters')
        .update(updateData)
        .eq('id', charId)
        .select('id, card_portrait_url, card_portrait_crop_data')
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
    //
    // Era note (Wild West — Packet 7): the allowlist is era-agnostic. WW
    // drafts simply leave the wealth (`cash`/`assets`/`spending_level`/
    // `lifestyle_*`) and positions/contacts fields empty/null because the
    // wizard auto-skips those steps. No field-level era validation here.
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

      // Canonical-form check for spending_level (BUG-067 / D8).
      // Defensive complement to migration 023's CHECK constraint.
      if ('spending_level' in filtered) {
        const sl = filtered.spending_level
        if (sl !== null && sl !== '' && !/^\$[0-9]+(\.[0-9]+)?$/.test(String(sl))) {
          return errorResponse(`spending_level must match /^\\$\\d+(\\.\\d+)?$/, got ${JSON.stringify(sl)}`, 400)
        }
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
    //
    // Era note (Wild West — Packet 7): `inviteCode.era` is copied verbatim
    // onto the new character row; valid values are constrained by the
    // `invite_codes_era_check` CHECK constraint (migration 024 extends it
    // to include `'wild_west'`). No string-literal era check here.
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
        max_wealth: inviteCode.max_wealth ?? null,
        max_luck: inviteCode.max_luck ?? null,
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
      // Pick the profile for this reroll by its index (0 = first reroll),
      // derived from prior reroll-scoped history entries; fall back to the
      // last defined reroll profile, then to the initial profile.
      const rollOpts = await loadRollOptions(supabase, char.invite_code_id)
      const priorRerolls = Array.isArray(char.reroll_history)
        ? char.reroll_history.filter((e: { scope?: string }) => e?.scope === 'reroll').length
        : 0
      const rerollProfiles = rollOpts?.rerolls ?? null
      const rerollProfile = rerollProfiles && rerollProfiles.length > 0
        ? (rerollProfiles[priorRerolls] ?? rerollProfiles[rerollProfiles.length - 1])
        : null
      const newChars = rollAllCharacteristics(rerollProfile ?? rollOpts?.initial ?? null)
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
        .select('id, status, method, characteristics_committed_at, player_id, invite_code_id')
        .eq('id', charId)
        .eq('player_id', playerId)
        .single()
      if (charErr) return errorResponse('Character not found', 404)

      if (char.status !== 'draft') return errorResponse('Cannot roll on submitted character', 400)
      if (char.method !== 'dice') return errorResponse('Roll endpoint is dice-only; use /edit-characteristics', 400)
      if (char.characteristics_committed_at) {
        return errorResponse('Characteristics already committed; use /reroll to redo', 409)
      }

      const rollOpts = await loadRollOptions(supabase, char.invite_code_id)
      const newChars = rollAllCharacteristics(rollOpts?.initial ?? null)
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

    // ── POST /characters/:id/skip-swap — explicit "do not swap" ───
    // Step 2b alternative. Sets swap_used = true without changing chars.
    // Same window as /swap-characteristics: between chars commit and age commit.
    const skipSwapMatch = path.match(/^\/characters\/([^/]+)\/skip-swap$/)
    if (skipSwapMatch && req.method === 'POST') {
      const charId = skipSwapMatch[1]

      const { data: char, error: charErr } = await supabase
        .from('characters')
        .select('id, status, characteristics_committed_at, swap_available, swap_used, age_committed_at')
        .eq('id', charId)
        .eq('player_id', playerId)
        .single()
      if (charErr) return errorResponse('Character not found', 404)

      if (char.status !== 'draft') return errorResponse('Cannot skip swap on submitted character', 400)
      if (!char.swap_available) return errorResponse('Swap perk not available on this code', 403)
      if (char.swap_used) return errorResponse('Swap already used', 409)
      if (!char.characteristics_committed_at) {
        return errorResponse('Roll characteristics first', 409)
      }
      if (char.age_committed_at) {
        return errorResponse('Cannot skip swap after age committed', 409)
      }

      const nowIso = new Date().toISOString()
      const { data, error } = await supabase
        .from('characters')
        .update({ swap_used: true, swap_committed_at: nowIso })
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
        .select('id, status, age, aging_committed_at, luck_committed_at, max_luck, invite_code_id')
        .eq('id', charId)
        .eq('player_id', playerId)
        .single()
      if (charErr) return errorResponse('Character not found', 404)

      if (char.status !== 'draft') return errorResponse('Cannot roll on submitted character', 400)
      if (!char.aging_committed_at) return errorResponse('Apply aging penalties first', 409)
      if (char.luck_committed_at) return errorResponse('Luck already committed', 409)

      const age = char.age as number ?? 30
      let luck = rollLuckForAge(age)
      const luckOpts = await loadRollOptions(supabase, char.invite_code_id)
      if (luckOpts?.luck) {
        luck = constrainLuck(luck, () => rollLuckForAge(age), luckOpts.luck)
      }
      if (typeof char.max_luck === 'number') {
        luck = Math.min(luck, char.max_luck)
      }
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
    //
    // Era note (Wild West — Packet 7): the current implementation does NOT
    // validate presence of wealth (`cash`/`assets`/`spending_level`/
    // `lifestyle_*`) nor positions/contacts (`positions`/`contacts`/
    // `main_position`/`additional_positions`/`contacts_v2`) at submit time —
    // those steps live entirely in the wizard UI. If any such presence check
    // is added later, it MUST be gated by `char.era !== 'wild_west'` since
    // the wizard auto-skips StepWealth and StepPositionsContacts for WW and
    // those fields are intentionally left empty/null on WW submissions
    // (spec: docs/CoCCreator_obsidian/specs/wild_west_variant_spec.md
    //  → "Edge function" section, "Submission validation").
    const submitMatch = path.match(/^\/characters\/([^/]+)\/submit$/)
    if (submitMatch && req.method === 'POST') {
      const charId = submitMatch[1]

      const { data: char, error: charErr } = await supabase
        .from('characters')
        .select('id, status, method, era, characteristics_committed_at, age_committed_at, edu_committed_at, aging_committed_at, luck_committed_at, swap_available, swap_used')
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
      // (These commits are mechanical — characteristics/age/EDU/aging/luck/
      // swap — and apply to every era including wild_west. Wealth/contacts
      // skip applies to the soft-zone presence checks only; see header
      // comment above for the rationale.)
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
