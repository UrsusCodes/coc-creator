#!/usr/bin/env node
// Verify that no character was mechanically damaged by migration 019 by
// diffing a previously-taken snapshot against current DB state.
//
// Usage:
//   ADMIN_PASSWORD=... node scripts/verify-characters-post-migration.mjs --snapshot backups/2026-04-26-safety
//
// Logic:
//   - Load all character JSON files from <snapshot>/characters/
//   - For each, fetch current state via GET /admin/characters
//   - Diff key-by-key:
//     * Fields NOT in NEW_019_FIELDS → must be bit-exact identical (stable JSON).
//       Any drift = DRIFT (data damage).
//     * Fields IN NEW_019_FIELDS → expected to be added by migration. Verify
//       defaults / backfilled values match the migration plan. Flag oddities
//       as NEEDS_REVIEW.
//   - Backed-up character no longer in DB → MISSING.
//   - Exit code != 0 if any DRIFT or MISSING.

import { readFileSync, readdirSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

// ── env loader ───────────────────────────────────────────────────────────────
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
let snapshotDir = null
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--snapshot' && args[i + 1]) {
    snapshotDir = args[i + 1]
    i++
  }
}

if (!snapshotDir) {
  console.error('Usage: node scripts/verify-characters-post-migration.mjs --snapshot <dir>')
  process.exit(1)
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')
const resolvedSnapshotDir = snapshotDir.match(/^([a-zA-Z]:|\/)/) ? snapshotDir : join(repoRoot, snapshotDir)

if (!existsSync(resolvedSnapshotDir) || !statSync(resolvedSnapshotDir).isDirectory()) {
  console.error(`Snapshot dir not found: ${resolvedSnapshotDir}`)
  process.exit(1)
}

const charactersDir = join(resolvedSnapshotDir, 'characters')
if (!existsSync(charactersDir)) {
  console.error(`Missing characters/ subdir in: ${resolvedSnapshotDir}`)
  process.exit(1)
}

// ── known new fields from migration 019 ──────────────────────────────────────
const NEW_019_FIELDS = new Set([
  'swap_committed_at',
  'age_committed_at',
  'edu_committed_at',
  'aging_committed_at',
  'luck_committed_at',
  'swap_available',
  'swap_used',
  'edu_rolls',
])

// ── helpers ──────────────────────────────────────────────────────────────────
async function adminGet(path) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/admin${path}`, {
    headers: {
      'X-Admin-Password': ADMIN_PASSWORD,
      'Authorization': `Bearer ${ANON_KEY}`,
    },
  })
  if (!res.ok) {
    throw new Error(`GET ${path} → HTTP ${res.status}: ${await res.text()}`)
  }
  return res.json()
}

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']'
  const keys = Object.keys(value).sort()
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}'
}

function diffFields(backup, current) {
  const drift = []        // [{ field, backup, current }]  for non-NEW_019 fields that changed
  const newFields = []    // [{ field, value }]            for NEW_019 fields present in current
  const review = []       // [{ field, reason, value }]    odd defaults to flag

  const allKeys = new Set([...Object.keys(backup), ...Object.keys(current)])

  for (const key of allKeys) {
    const inBackup = key in backup
    const inCurrent = key in current
    const isNew019 = NEW_019_FIELDS.has(key)

    if (isNew019) {
      // NEW_019 fields: expect either both sides match (snapshot taken post-migration)
      // or only present in current (snapshot taken pre-migration; field was added).
      if (inCurrent && !inBackup) {
        newFields.push({ field: key, value: current[key] })
      } else if (inCurrent && inBackup) {
        // Compare — should match if both are post-migration snapshots
        if (stableStringify(backup[key]) !== stableStringify(current[key])) {
          drift.push({ field: key, backup: backup[key], current: current[key], note: 'NEW_019 field changed between snapshots' })
        }
      } else if (inBackup && !inCurrent) {
        review.push({ field: key, reason: 'present in backup, absent in current — schema regression?', value: backup[key] })
      }
      continue
    }

    // Non-NEW_019 fields: must be bit-exact
    if (inBackup && !inCurrent) {
      drift.push({ field: key, backup: backup[key], current: undefined, note: 'field removed from current' })
    } else if (!inBackup && inCurrent) {
      review.push({ field: key, reason: 'unexpected field in current (not in NEW_019_FIELDS)', value: current[key] })
    } else if (stableStringify(backup[key]) !== stableStringify(current[key])) {
      drift.push({ field: key, backup: backup[key], current: current[key] })
    }
  }

  return { drift, newFields, review }
}

function checkBackfillExpectations(character, current, newFields) {
  // Per migration 019 plan:
  //   submitted + characteristics_committed_at IS NOT NULL → 4 commit timestamps
  //     (age, edu, aging, luck) backfilled to created_at via COALESCE.
  //   swap_available, swap_used → false default.
  //   edu_rolls → [] default.
  const issues = []
  const isSubmitted = current.status === 'submitted'
  const hasCharCommit = current.characteristics_committed_at != null

  if (isSubmitted && hasCharCommit) {
    for (const ts of ['age_committed_at', 'edu_committed_at', 'aging_committed_at', 'luck_committed_at']) {
      const v = current[ts]
      if (v == null) {
        issues.push(`${ts} is NULL on submitted char (expected backfill = created_at)`)
      } else if (v !== current.created_at) {
        // OK if it differs — could be set explicitly later. Just info.
      }
    }
  }

  // swap_available depends on code perks; can be true if perk applies. Don't flag.
  // swap_used: if false, fine; if true on submitted, was actively swapped — fine.
  // edu_rolls: [] default; non-empty = post-migration EDU rolling on this char.

  // If snapshot pre-migration and current post-migration, NEW_019 fields should appear.
  if (newFields.length > 0 && newFields.length < NEW_019_FIELDS.size) {
    const missing = [...NEW_019_FIELDS].filter((f) => !(f in current))
    if (missing.length > 0) {
      issues.push(`only some NEW_019 fields present in current: missing [${missing.join(', ')}]`)
    }
  }

  return issues
}

// ── load backups ─────────────────────────────────────────────────────────────
const backupFiles = readdirSync(charactersDir).filter((f) => f.endsWith('.json'))
const backups = backupFiles.map((f) => {
  const data = JSON.parse(readFileSync(join(charactersDir, f), 'utf8'))
  return { file: f, data }
})

console.log(`Loaded ${backups.length} character backups from: ${resolvedSnapshotDir}`)
console.log(`Fetching current characters from DB...`)
const currentList = await adminGet('/characters')
const currentById = new Map(currentList.map((c) => [c.id, c]))
console.log(`  → ${currentList.length} characters in DB`)
console.log()

// ── verify ───────────────────────────────────────────────────────────────────
const results = []  // { id, name, status, verdict, ... }

for (const { file, data: backup } of backups) {
  const current = currentById.get(backup.id)
  if (!current) {
    results.push({
      id: backup.id,
      name: backup.name,
      status: backup.status,
      verdict: 'MISSING',
      detail: 'Character no longer in DB',
    })
    continue
  }

  const { drift, newFields, review } = diffFields(backup, current)
  const backfillIssues = checkBackfillExpectations(backup, current, newFields)

  let verdict = 'OK'
  if (drift.length > 0) verdict = 'DRIFT'
  else if (review.length > 0 || backfillIssues.length > 0) verdict = 'NEEDS_REVIEW'

  results.push({
    id: backup.id,
    name: backup.name,
    status: current.status,
    verdict,
    drift,
    new_fields_added: newFields.map((nf) => nf.field),
    review,
    backfill_issues: backfillIssues,
  })
}

// Detect chars in DB but not in backup (new since snapshot)
const backupIds = new Set(backups.map((b) => b.data.id))
for (const c of currentList) {
  if (!backupIds.has(c.id)) {
    results.push({
      id: c.id,
      name: c.name,
      status: c.status,
      verdict: 'NEW_SINCE_SNAPSHOT',
      detail: 'Character not in backup (created after snapshot)',
    })
  }
}

// ── report ───────────────────────────────────────────────────────────────────
const summary = { OK: 0, DRIFT: 0, NEEDS_REVIEW: 0, MISSING: 0, NEW_SINCE_SNAPSHOT: 0 }
for (const r of results) summary[r.verdict] = (summary[r.verdict] || 0) + 1

console.log('═'.repeat(80))
console.log('SUMMARY')
console.log('═'.repeat(80))
for (const [k, v] of Object.entries(summary)) {
  if (v > 0) console.log(`  ${k.padEnd(20)} ${v}`)
}
console.log()

const interesting = results.filter((r) => r.verdict !== 'OK')
if (interesting.length > 0) {
  console.log('═'.repeat(80))
  console.log('NON-OK ENTRIES')
  console.log('═'.repeat(80))
  for (const r of interesting) {
    console.log()
    console.log(`[${r.verdict}] ${r.id} — ${r.name || '(no name)'} (${r.status})`)
    if (r.detail) console.log(`  ${r.detail}`)
    if (r.drift?.length) {
      console.log(`  DRIFT (${r.drift.length}):`)
      for (const d of r.drift) {
        const note = d.note ? ` [${d.note}]` : ''
        console.log(`    - ${d.field}${note}`)
        console.log(`        backup:  ${JSON.stringify(d.backup)?.slice(0, 100)}`)
        console.log(`        current: ${JSON.stringify(d.current)?.slice(0, 100)}`)
      }
    }
    if (r.new_fields_added?.length) {
      console.log(`  NEW_019 fields added: [${r.new_fields_added.join(', ')}]`)
    }
    if (r.review?.length) {
      console.log(`  REVIEW (${r.review.length}):`)
      for (const x of r.review) console.log(`    - ${x.field}: ${x.reason}`)
    }
    if (r.backfill_issues?.length) {
      console.log(`  BACKFILL:`)
      for (const issue of r.backfill_issues) console.log(`    - ${issue}`)
    }
  }
}

// Write JSON report next to snapshot
const reportPath = join(resolvedSnapshotDir, '_verify_report.json')
writeFileSync(
  reportPath,
  JSON.stringify(
    {
      snapshot: resolvedSnapshotDir,
      timestamp: new Date().toISOString(),
      summary,
      results,
    },
    null,
    2,
  ) + '\n',
  'utf8',
)
console.log()
console.log(`Report written: ${reportPath}`)

// Exit code: non-zero if any drift or missing
if (summary.DRIFT > 0 || summary.MISSING > 0) {
  console.log()
  console.log('✗ VERIFY FAILED — drift or missing characters detected.')
  process.exit(1)
}
console.log()
console.log('✓ Verify passed.')
