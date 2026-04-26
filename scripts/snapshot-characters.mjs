#!/usr/bin/env node
// Snapshot all characters + invite codes + pending edits + per-character history
// to backups/YYYY-MM-DD-<tag>/. Used pre-migration as a safety net so we can
// manually reconstruct any character if migration 019 corrupts state.
//
// Usage:
//   ADMIN_PASSWORD=... node scripts/snapshot-characters.mjs            # tag = "snapshot"
//   ADMIN_PASSWORD=... node scripts/snapshot-characters.mjs --tag pre-019
//
// Output structure:
//   backups/YYYY-MM-DD-<tag>/
//     _manifest.json                         meta + sha256 of payload
//     characters/[id]__[slug].json           full row from GET /characters/:id
//     invite_codes/[id]__[code].json         full row from GET /codes
//     pending_edits/[id].json                full row from GET /pending-edits
//     character_history/[char-id].json       array of history entries per character

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

// ── env loader (CRLF-safe, copy of pattern from list-drafts.mjs) ─────────────
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
  console.error('Missing VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, or ADMIN_PASSWORD in env')
  process.exit(1)
}

// ── parse args ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
let tag = 'snapshot'
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--tag' && args[i + 1]) {
    tag = args[i + 1]
    i++
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────
function adminFetch(path) {
  return fetch(`${SUPABASE_URL}/functions/v1/admin${path}`, {
    headers: {
      'X-Admin-Password': ADMIN_PASSWORD,
      'Authorization': `Bearer ${ANON_KEY}`,
    },
  })
}

async function adminGet(path) {
  const res = await adminFetch(path)
  if (!res.ok) {
    throw new Error(`GET ${path} → HTTP ${res.status}: ${await res.text()}`)
  }
  return res.json()
}

// ASCII-safe slug for filenames (strip Polish diacritics, lowercase, dash-separated)
function slug(s) {
  if (!s) return 'unnamed'
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[łŁ]/g, 'l')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'unnamed'
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

function sha256(s) {
  return createHash('sha256').update(s).digest('hex')
}

// Stable JSON: keys sorted recursively, used for hash so reordering doesn't
// produce a false drift signal.
function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']'
  const keys = Object.keys(value).sort()
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}'
}

// ── resolve output dir ───────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')
const today = new Date().toISOString().slice(0, 10)
const outDir = join(repoRoot, 'backups', `${today}-${tag}`)

if (existsSync(outDir)) {
  console.error(`Refusing to overwrite existing snapshot: ${outDir}`)
  console.error(`Pass a different --tag or delete the directory first.`)
  process.exit(1)
}

mkdirSync(join(outDir, 'characters'), { recursive: true })
mkdirSync(join(outDir, 'invite_codes'), { recursive: true })
mkdirSync(join(outDir, 'pending_edits'), { recursive: true })
mkdirSync(join(outDir, 'character_history'), { recursive: true })

// ── fetch + write ────────────────────────────────────────────────────────────
console.log(`Snapshot tag: ${tag}`)
console.log(`Output dir:   ${outDir}`)
console.log()

console.log('Fetching characters...')
const characters = await adminGet('/characters')
console.log(`  → ${characters.length} characters (${characters.filter((c) => c.status === 'draft').length} draft, ${characters.filter((c) => c.status === 'submitted').length} submitted)`)

console.log('Fetching invite_codes...')
const codes = await adminGet('/codes')
console.log(`  → ${codes.length} codes`)

console.log('Fetching pending_edits...')
const pendingEdits = await adminGet('/pending-edits')
console.log(`  → ${pendingEdits.length} pending edits`)

console.log('Fetching per-character history...')
const historyByChar = {}
let historyTotal = 0
for (const c of characters) {
  const history = await adminGet(`/characters/${c.id}/history`)
  historyByChar[c.id] = history
  historyTotal += history.length
}
console.log(`  → ${historyTotal} history entries across ${characters.length} characters`)

console.log()
console.log('Writing files...')

for (const c of characters) {
  const filename = `${c.id}__${slug(c.name)}.json`
  writeJson(join(outDir, 'characters', filename), c)
}

for (const code of codes) {
  const filename = `${code.id}__${slug(code.code)}.json`
  writeJson(join(outDir, 'invite_codes', filename), code)
}

for (const edit of pendingEdits) {
  writeJson(join(outDir, 'pending_edits', `${edit.id}.json`), edit)
}

for (const [charId, history] of Object.entries(historyByChar)) {
  writeJson(join(outDir, 'character_history', `${charId}.json`), history)
}

// ── manifest ─────────────────────────────────────────────────────────────────
const fieldsByCharacter = {}
for (const c of characters) {
  fieldsByCharacter[c.id] = Object.keys(c).sort()
}

const fullPayload = {
  characters: [...characters].sort((a, b) => a.id.localeCompare(b.id)),
  codes: [...codes].sort((a, b) => a.id.localeCompare(b.id)),
  pending_edits: [...pendingEdits].sort((a, b) => a.id.localeCompare(b.id)),
  character_history: Object.fromEntries(
    Object.entries(historyByChar).sort(([a], [b]) => a.localeCompare(b)),
  ),
}
const payloadHash = sha256(stableStringify(fullPayload))

const manifest = {
  tag,
  timestamp: new Date().toISOString(),
  schema_version: 'pre-019',
  supabase_url: SUPABASE_URL,
  counts: {
    characters: characters.length,
    drafts: characters.filter((c) => c.status === 'draft').length,
    submitted: characters.filter((c) => c.status === 'submitted').length,
    invite_codes: codes.length,
    pending_edits: pendingEdits.length,
    character_history_entries: historyTotal,
  },
  payload_sha256: payloadHash,
  fields_by_character: fieldsByCharacter,
}

writeJson(join(outDir, '_manifest.json'), manifest)

console.log()
console.log(`✓ Snapshot complete.`)
console.log(`  ${characters.length} characters · ${codes.length} codes · ${pendingEdits.length} pending edits · ${historyTotal} history entries`)
console.log(`  payload sha256: ${payloadHash}`)
console.log(`  → ${outDir}`)
