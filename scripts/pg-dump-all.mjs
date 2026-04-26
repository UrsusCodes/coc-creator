#!/usr/bin/env node
// Full database backup via direct Postgres connection (bypass Supabase CLI Docker dep).
// Connects with SUPABASE_DB_PASSWORD from .env.local, lists every public table,
// dumps each as JSON to backups/YYYY-MM-DD-<tag>/pgdump/<table>.json plus a
// schema.sql for table definitions and a manifest.
//
// Usage:
//   node scripts/pg-dump-all.mjs                  # tag = "pgdump"
//   node scripts/pg-dump-all.mjs --tag pre-019    # custom tag
//
// Output:
//   backups/YYYY-MM-DD-<tag>/
//     _manifest.json                meta + sha256 + counts
//     schema.sql                    CREATE TABLE for every public table
//     <table>.json                  full rows for every public table
//
// This is the disaster-recovery backup of last resort: whole-DB dump, not
// just admin-endpoint-projected data. Independent from snapshot-characters.mjs.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

// ── env loader (CRLF-safe) ───────────────────────────────────────────────────
try {
  const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
  }
} catch {}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD

if (!SUPABASE_URL || !DB_PASSWORD) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_DB_PASSWORD in .env.local')
  process.exit(1)
}

// Extract project ref from VITE_SUPABASE_URL: https://<ref>.supabase.co
const refMatch = SUPABASE_URL.match(/^https?:\/\/([^.]+)\.supabase\.co/)
if (!refMatch) {
  console.error(`Cannot extract project ref from VITE_SUPABASE_URL: ${SUPABASE_URL}`)
  process.exit(1)
}
const PROJECT_REF = refMatch[1]

// ── parse args ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
let tag = 'pgdump'
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--tag' && args[i + 1]) {
    tag = args[i + 1]
    i++
  }
}

// ── output dir ───────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')
const today = new Date().toISOString().slice(0, 10)
const outDir = join(repoRoot, 'backups', `${today}-${tag}`)

if (existsSync(outDir)) {
  console.error(`Refusing to overwrite existing backup dir: ${outDir}`)
  console.error(`Pass a different --tag or delete the directory first.`)
  process.exit(1)
}
mkdirSync(outDir, { recursive: true })

// ── connection ───────────────────────────────────────────────────────────────
// Pooler URL discovered from supabase/.temp/pooler-url after `supabase link`.
// Falls back to manual candidates if the temp file is missing.
const POOLER_URL_PATH = join(repoRoot, 'supabase', '.temp', 'pooler-url')
const candidates = []
try {
  const raw = readFileSync(POOLER_URL_PATH, 'utf8').trim()
  // Format: postgresql://postgres.<ref>@aws-1-<region>.pooler.supabase.com:5432/postgres
  const m = raw.match(/^postgresql:\/\/([^@]+)@([^:]+):(\d+)\/(\w+)/)
  if (m) {
    candidates.push({
      label: `linked pooler (${m[2]}:${m[3]})`,
      config: {
        host: m[2], port: parseInt(m[3]),
        user: m[1], password: DB_PASSWORD,
        database: m[4], ssl: { rejectUnauthorized: false },
      },
    })
  }
} catch {}

// Fallbacks (manual guesses if no linked pooler URL is cached).
candidates.push(
  {
    label: 'direct',
    config: {
      host: `db.${PROJECT_REF}.supabase.co`, port: 5432,
      user: 'postgres', password: DB_PASSWORD,
      database: 'postgres', ssl: { rejectUnauthorized: false },
    },
  },
  {
    label: 'pooler-eu-central-1-session',
    config: {
      host: `aws-1-eu-central-1.pooler.supabase.com`, port: 5432,
      user: `postgres.${PROJECT_REF}`, password: DB_PASSWORD,
      database: 'postgres', ssl: { rejectUnauthorized: false },
    },
  },
)

let client = null
let connectedVia = null
for (const c of candidates) {
  try {
    console.log(`Trying ${c.label}: ${c.config.host}:${c.config.port}...`)
    const candidate = new pg.Client(c.config)
    await candidate.connect()
    client = candidate
    connectedVia = c.label
    console.log(`  ✓ Connected via ${c.label}`)
    break
  } catch (err) {
    console.log(`  ✗ ${err.message.split('\n')[0]}`)
  }
}

if (!client) {
  console.error('Failed to connect via any candidate. Check SUPABASE_DB_PASSWORD.')
  process.exit(1)
}

// ── helpers ──────────────────────────────────────────────────────────────────
function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']'
  const keys = Object.keys(value).sort()
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}'
}
function sha256(s) {
  return createHash('sha256').update(s).digest('hex')
}
function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

// ── list tables ──────────────────────────────────────────────────────────────
console.log()
console.log('Listing public tables...')
const tablesRes = await client.query(`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
  ORDER BY table_name
`)
const tableNames = tablesRes.rows.map((r) => r.table_name)
console.log(`  → ${tableNames.length} tables: ${tableNames.join(', ')}`)
console.log()

// ── dump schema (CREATE TABLE per table) ────────────────────────────────────
console.log('Dumping schema (CREATE TABLE)...')
const schemaParts = []
for (const t of tableNames) {
  const colsRes = await client.query(
    `SELECT column_name, data_type, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position`,
    [t],
  )
  const cols = colsRes.rows.map((c) => {
    const nullable = c.is_nullable === 'YES' ? '' : ' NOT NULL'
    const def = c.column_default != null ? ` DEFAULT ${c.column_default}` : ''
    return `  "${c.column_name}" ${c.data_type}${nullable}${def}`
  })
  schemaParts.push(`-- Table: public.${t}\nCREATE TABLE "public"."${t}" (\n${cols.join(',\n')}\n);\n`)
}
writeFileSync(join(outDir, 'schema.sql'), schemaParts.join('\n'), 'utf8')
console.log(`  ✓ schema.sql written`)

// ── dump data (full rows) ────────────────────────────────────────────────────
console.log()
console.log('Dumping table data...')
const tableData = {}
const rowCounts = {}
for (const t of tableNames) {
  const dataRes = await client.query(`SELECT * FROM "public"."${t}"`)
  tableData[t] = dataRes.rows
  rowCounts[t] = dataRes.rows.length
  writeJson(join(outDir, `${t}.json`), dataRes.rows)
  console.log(`  ${t.padEnd(30)} ${dataRes.rows.length} rows`)
}

await client.end()

// ── manifest ─────────────────────────────────────────────────────────────────
const fullPayload = Object.fromEntries(
  Object.entries(tableData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([t, rows]) => [t, [...rows].sort((a, b) => {
      // Sort by id if present, else stringify.
      if (a.id != null && b.id != null) return String(a.id).localeCompare(String(b.id))
      return stableStringify(a).localeCompare(stableStringify(b))
    })]),
)
const payloadHash = sha256(stableStringify(fullPayload))

const manifest = {
  tag,
  timestamp: new Date().toISOString(),
  source: `pg_dump-equivalent via node-pg over ${connectedVia}`,
  supabase_url: SUPABASE_URL,
  project_ref: PROJECT_REF,
  tables: tableNames,
  row_counts: rowCounts,
  total_rows: Object.values(rowCounts).reduce((a, b) => a + b, 0),
  payload_sha256: payloadHash,
}
writeJson(join(outDir, '_manifest.json'), manifest)

console.log()
console.log(`✓ Full DB dump complete.`)
console.log(`  ${tableNames.length} tables · ${manifest.total_rows} total rows`)
console.log(`  payload sha256: ${payloadHash}`)
console.log(`  → ${outDir}`)
