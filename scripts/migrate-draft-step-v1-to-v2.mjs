#!/usr/bin/env node
// One-time draft_step migration v1 → v2 (granular commits).
// v1 wizard had 13 steps; v2 has 17 (StepIdentifier inserted at idx 1,
// StepAgeModifiers split into StepEduRolls + StepAgingPenalties + StepLuck).
// This shifts every active draft's draft_step to the new numbering so
// "Kontynuuj" lands the player on the same logical step they left.
//
// Mapping (v1 → v2):
//   0 invite_code     → 0  invite_code
//   1 characteristics → 2  characteristics       (+1 for identifier)
//   2 age             → 4  age                   (+1 for swap)
//   3 age_modifiers   → 7  luck                  (split into edu+aging+luck;
//                                                  remap to last sub-step
//                                                  since both EDU+aging are
//                                                  backfilled by 019 if the
//                                                  draft had age committed)
//   4 derived         → 8  derived
//   5 occupation      → 9  occupation
//   6 occ_skills      → 10 occupation_skills
//   7 personal_skills → 11 personal_skills
//   8 equipment       → 12 equipment
//   9 positions       → 13 positions_contacts
//  10 backstory       → 14 backstory
//  11 basic_info      → 15 basic_info
//  12 review          → 16 review
//
// Usage:
//   ADMIN_PASSWORD=... node scripts/migrate-draft-step-v1-to-v2.mjs            # dry-run
//   ADMIN_PASSWORD=... node scripts/migrate-draft-step-v1-to-v2.mjs --execute  # apply

import { readFileSync } from 'node:fs'

try {
  const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
  }
} catch {}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

if (!SUPABASE_URL || !ANON_KEY || !ADMIN_PASSWORD) {
  console.error('Missing env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, ADMIN_PASSWORD')
  process.exit(1)
}

const execute = process.argv.includes('--execute')

const STEP_MAP = {
  0: 0,
  1: 2,
  2: 4,
  3: 7,
  4: 8,
  5: 9,
  6: 10,
  7: 11,
  8: 12,
  9: 13,
  10: 14,
  11: 15,
  12: 16,
}

const headers = {
  'X-Admin-Password': ADMIN_PASSWORD,
  'Authorization': `Bearer ${ANON_KEY}`,
  'Content-Type': 'application/json',
}

const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/characters`, { headers })
if (!res.ok) {
  console.error(`Failed to fetch characters: HTTP ${res.status}`)
  process.exit(1)
}
const characters = await res.json()
const drafts = characters.filter((c) => c.status === 'draft' && c.draft_step != null)

console.log(`Found ${drafts.length} drafts with non-null draft_step.`)
console.log(`Mode: ${execute ? 'EXECUTE' : 'DRY-RUN (pass --execute to apply)'}`)
console.log()

const planned = []
for (const c of drafts) {
  const oldStep = c.draft_step
  if (typeof oldStep !== 'number' || !(oldStep in STEP_MAP)) {
    console.log(`  ? ${c.id.slice(0, 8)} ${c.name || '(no name)'} — draft_step ${oldStep} (out of map, skip)`)
    continue
  }
  const newStep = STEP_MAP[oldStep]
  if (newStep === oldStep) {
    console.log(`  · ${c.id.slice(0, 8)} ${c.name || '(no name)'} — already ${oldStep}, no change`)
    continue
  }
  planned.push({ id: c.id, name: c.name || '(no name)', from: oldStep, to: newStep })
}

if (planned.length === 0) {
  console.log('Nothing to migrate.')
  process.exit(0)
}

console.log(`Planned changes (${planned.length}):`)
for (const p of planned) {
  console.log(`  ${p.id.slice(0, 8)}  ${p.name.padEnd(28)}  draft_step ${p.from} → ${p.to}`)
}

if (!execute) {
  console.log()
  console.log('Dry-run. Re-run with --execute to apply.')
  process.exit(0)
}

console.log()
console.log('Applying...')
let success = 0
let failure = 0
for (const p of planned) {
  const r = await fetch(`${SUPABASE_URL}/functions/v1/admin/characters/${p.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      draft_step: p.to,
      _change_comment: `v1→v2 draft_step remap (${p.from} → ${p.to}) for granular-commits flow`,
    }),
  })
  if (!r.ok) {
    failure++
    console.error(`  ✗ ${p.id.slice(0, 8)}: HTTP ${r.status} — ${await r.text()}`)
    continue
  }
  success++
  console.log(`  ✓ ${p.id.slice(0, 8)}  draft_step ${p.from} → ${p.to}`)
}

console.log()
console.log(`Done: ${success} updated, ${failure} failed.`)
