#!/usr/bin/env node
// One-shot workaround when manual characteristic input in the wizard is broken.
// Creates an invite code + draft character on a player's account with
// pre-committed characteristics, ready to continue from StepAge.
//
// Edit the CONFIG block below if you want different values, then run:
//   ADMIN_PASSWORD=... node scripts/admin-create-character-with-traits.mjs
//
// Reads VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY from .env.local automatically.

import { readFileSync } from 'node:fs'

// ─── CONFIG ────────────────────────────────────────────────────────────────
const PLAYER_LOGIN = 'pawel'

const CHARACTERISTICS = {
  STR: 25, // SIŁ
  CON: 40, // KON
  SIZ: 40, // BUD
  DEX: 60, // ZRĘ
  APP: 70, // WYG
  INT: 80, // INT
  POW: 70, // MOC
  EDU: 60, // WYK
}

const CODE_CONFIG = {
  era: 'classic_1920s',
  method: 'direct',
  perks: ['drive_pillars'],
  max_skill_value: 80,
  max_wealth: 9,
  max_luck: 25,
  reroll_budget: 0,
  label: 'Workaround – cechy wpisane ręcznie przez admina',
}

// Land the wizard on StepAge (index 4 in v2 layout).
// Hard-zone steps are: 1=Identifier, 2=Characteristics, 3=Swap (auto-skipped
// when no swap_characteristics perk), 4=Age, 5=EduRolls, 6=Aging, 7=Luck.
const RESUME_STEP = 4
// ───────────────────────────────────────────────────────────────────────────

try {
  const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
  }
} catch {
  console.error('⚠ Could not read .env.local — relying on shell env')
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

if (!SUPABASE_URL || !ANON_KEY || !ADMIN_PASSWORD) {
  console.error('Missing env. Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, ADMIN_PASSWORD')
  process.exit(1)
}

function adminFetch(path, options = {}) {
  return fetch(`${SUPABASE_URL}/functions/v1/admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
      'X-Admin-Password': ADMIN_PASSWORD,
      ...(options.headers ?? {}),
    },
  })
}

async function ensureOk(res, label) {
  if (res.ok) return res.json()
  const body = await res.text()
  throw new Error(`${label}: HTTP ${res.status} ${body}`)
}

// 1. Find player by login.
console.log(`→ Looking up player by login=${PLAYER_LOGIN}…`)
const players = await ensureOk(await adminFetch('/players'), 'GET /players')
const player = players.find((p) => p.login === PLAYER_LOGIN)
if (!player) {
  console.error(`✗ No player with login "${PLAYER_LOGIN}". Available logins:`)
  for (const p of players) console.error(`  - ${p.login} (${p.name}) ${p.id}`)
  process.exit(1)
}
console.log(`  ✓ ${player.name} (${player.id})`)

// 2. Create draft via POST /drafts (creates code + character + junction).
const nowIso = new Date().toISOString()
const wizardData = {
  characteristics: CHARACTERISTICS,
  characteristics_committed_at: nowIso,
  swap_available: CODE_CONFIG.perks.includes('swap_characteristics'),
  swap_used: false,
  draft_step: RESUME_STEP,
  distinguisher: '',
  rerolls_remaining: CODE_CONFIG.reroll_budget,
  max_wealth: CODE_CONFIG.max_wealth,
  max_luck: CODE_CONFIG.max_luck,
}

console.log('→ Creating draft (code + character)…')
const draftRes = await ensureOk(
  await adminFetch('/drafts', {
    method: 'POST',
    body: JSON.stringify({
      player_id: player.id,
      era: CODE_CONFIG.era,
      method: CODE_CONFIG.method,
      perks: CODE_CONFIG.perks,
      max_skill_value: CODE_CONFIG.max_skill_value,
      wizard_data: wizardData,
    }),
  }),
  'POST /drafts',
)
const { character, invite_code: code } = draftRes
console.log(`  ✓ code=${code.code}  char_id=${character.id}`)

// 3. PATCH the code to add fields /drafts didn't accept (max_wealth, max_luck,
//    label, reroll_budget, assignee).
console.log('→ Patching code with ceilings + assignee + label…')
await ensureOk(
  await adminFetch(`/codes/${code.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      max_wealth: CODE_CONFIG.max_wealth,
      max_luck: CODE_CONFIG.max_luck,
      label: CODE_CONFIG.label,
      reroll_budget: CODE_CONFIG.reroll_budget,
      assigned_player_id: player.id,
    }),
  }),
  `PATCH /codes/${code.id}`,
)
console.log('  ✓ code updated')

console.log('\n────────────────────────────────────────')
console.log(`Player:        ${player.name} (login=${player.login})`)
console.log(`Invite code:   ${code.code}`)
console.log(`Character id:  ${character.id}`)
console.log(`Resume step:   ${RESUME_STEP} (StepAge)`)
console.log(`Cechy:         STR=${CHARACTERISTICS.STR} CON=${CHARACTERISTICS.CON} SIZ=${CHARACTERISTICS.SIZ} DEX=${CHARACTERISTICS.DEX} APP=${CHARACTERISTICS.APP} INT=${CHARACTERISTICS.INT} POW=${CHARACTERISTICS.POW} EDU=${CHARACTERISTICS.EDU}`)
console.log(`Perks:         ${CODE_CONFIG.perks.join(', ')}`)
console.log(`Max wealth:    ${CODE_CONFIG.max_wealth}`)
console.log(`Max luck:      ${CODE_CONFIG.max_luck}`)
console.log('────────────────────────────────────────')
console.log('Zaloguj się jako Paweł → kafelek nowego kodu → "Kontynuuj" trafi na StepAge.')
