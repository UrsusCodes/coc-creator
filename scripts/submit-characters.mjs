#!/usr/bin/env node
// Submit specific draft characters via admin endpoint.
// Usage: ADMIN_PASSWORD=... node scripts/submit-characters.mjs <id1> <id2> ...

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

const ids = process.argv.slice(2)
if (ids.length === 0) {
  console.error('Usage: node scripts/submit-characters.mjs <id1> <id2> ...')
  process.exit(1)
}

for (const id of ids) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/characters/${id}`, {
    method: 'PUT',
    headers: {
      'X-Admin-Password': ADMIN_PASSWORD,
      'Authorization': `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'submitted',
      _change_comment: 'Admin batch-submit — character marked complete',
    }),
  })
  if (!res.ok) {
    console.error(`  ✗ ${id}: HTTP ${res.status} — ${await res.text()}`)
    continue
  }
  const data = await res.json()
  console.log(`  ✓ ${id} — ${data.name || '(no name)'} → status=${data.status}`)
}
