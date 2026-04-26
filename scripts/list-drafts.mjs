#!/usr/bin/env node
// List all draft characters via admin edge function.
// Usage: ADMIN_PASSWORD=... node scripts/list-drafts.mjs

import { readFileSync } from 'node:fs'

// Minimal .env.local loader
try {
  const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
  }
} catch {}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

if (!SUPABASE_URL || !ADMIN_PASSWORD) {
  console.error('Missing VITE_SUPABASE_URL or ADMIN_PASSWORD in env')
  process.exit(1)
}

const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/characters`, {
  headers: {
    'X-Admin-Password': ADMIN_PASSWORD,
    'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
  },
})

if (!res.ok) {
  console.error(`HTTP ${res.status}: ${await res.text()}`)
  process.exit(1)
}

const chars = await res.json()
const drafts = chars.filter((c) => c.status === 'draft')

console.log(`Total characters: ${chars.length}`)
console.log(`Drafts: ${drafts.length}`)
console.log(`Submitted: ${chars.filter((c) => c.status === 'submitted').length}`)
console.log()

if (drafts.length === 0) {
  console.log('No in-progress drafts.')
  process.exit(0)
}

console.log('In-progress drafts:')
console.log('─'.repeat(100))
for (const c of drafts) {
  const name = c.name || '(no name)'
  const updated = c.updated_at ? new Date(c.updated_at).toISOString().slice(0, 16).replace('T', ' ') : '—'
  const created = c.created_at ? new Date(c.created_at).toISOString().slice(0, 10) : '—'
  console.log(`  ${c.id}`)
  console.log(`    name:        ${name}`)
  console.log(`    player_id:   ${c.player_id || '(unassigned)'}`)
  console.log(`    invite_code: ${c.invite_code_id || '—'}`)
  console.log(`    draft_step:  ${c.draft_step ?? '—'}`)
  console.log(`    created:     ${created}`)
  console.log(`    updated:     ${updated}`)
  console.log()
}
