---
date: 2026-05-28
status: signed-off
tags:
  - spec
  - feature/wealth
  - bug/data-integrity
  - bug-067
  - bug-049
---

# Spending Level Normalization — Spec (Path B)

> [!info] Owner
> Front B / [[CONSTANTA-1]]. Recon: [[../work/2026-05-28-front-b-recon]].
> Closes BUG-067, absorbs BUG-049. Signed off by Pawel via BONAPARTE-1 2026-05-28
> (Path B chosen over CONSTANTA-1's Path A — see [[../operations/COMMAND_LOG]] decision log).

## Problem

`characters.spending_level` accumulated 5 raw formats across wizard generations.
Recent hotfixes (`5904e61`, `366a619`) normalized 2 of the 5 render paths (PDF +
HTML back card), but 3 paths still leak the raw label and the helper has no
final-fallback for unexpected values (BUG-049). User report: "Niektóre postacie
nie wyświetlają poprawnie wartości… puste pola albo słowo 'przeciętny'".

## Why Path B (DB migration), not Path A (render-only helper)

CONSTANTA-1 originally recommended Path A (on-render normalization + shared helper).
BONAPARTE-1 chose Path B for these reasons (ratified by Pawel):

1. **Akta-kasandry contract risk.** `wiki.imported_characters.data` snapshots whole
   `public.characters` rows via anon `SELECT *`. Legacy `"Przeciętny"` / `"Zamożny"`
   strings leak into the wiki database verbatim. See [[../INTEGRATIONS]].
2. **Recurrence pattern.** BUG-067 has returned twice after partial render-side
   hotfixes. Every new call-site that reads `spending_level` without the helper
   re-opens the bug. DB normalization closes the door.
3. **Low backfill volume.** Only 8 rows need rewriting (6× "Przeciętny", 1× "Zamożny",
   1× "Biedny"). Risk-adjusted cost minimal.
4. **Safety tooling already exists.** `snapshot-characters.mjs`,
   `verify-characters-post-migration.mjs`, `backups/2026-04-26-safety/` baseline.

## DB inventory (snapshot 2026-04-27, 19/23 chars set)

| Raw value | Count | Backfill target |
|---|---|---|
| `"$7"` | 8 | unchanged (canonical) |
| `"$25"` | 5 | unchanged (canonical) |
| `"Przeciętny"` | 6 | `"$7"` (TIERS lookup tier C) |
| `"Zamożny"` | 1 | `"$25"` (TIERS lookup tier D) |
| `"Biedny"` | 1 | `"$2"` (legacy alias → tier B) |
| missing / NULL | 4 | leave as-is (drafts pre-StepEquipment) |

13/19 already canonical; 6 rewrites needed.

## Decisions (signed off)

| # | Question | Outcome | Note |
|---|---|---|---|
| **D5** | DB migration vs on-render? | **DB migration + CHECK constraint** | Path B; see "Why Path B" above. |
| **D6** | Canonical format? | **`$N` (pre-symbol)** | Matches dominant DB form (13/19), matches `backTocV2Map.ts:211` output, matches `cardFrontMap.ts:275` strip logic. BONAPARTE-1 read; CONSTANTA-1 confirms pragmatic fit. |
| **D7** | Unknown-format fallback? | **`'—'` em-dash** | Display helper outputs em-dash when raw value passes the regex but `null`/`undefined` is rendered, OR for in-flight drafts pre-StepEquipment. |
| **D8** | Wizard-write normalization? | **Server-side validation in `/draft`** | Reject non-canonical writes at the edge function. StepEquipment already writes `formatDollars($N)`, but server is the defensive boundary. |

## Scope

WORKER #B2 ships in this order:

### 1. Snapshot baseline

```
ADMIN_PASSWORD=… VITE_SUPABASE_URL=… VITE_SUPABASE_ANON_KEY=… \
  node scripts/snapshot-characters.mjs --tag 2026-05-28-pre-bug-067
```

Save snapshot to `backups/2026-05-28-pre-bug-067/`. Worker reports the resulting
sha256 in handoff. **If env vars unavailable**, worker reads
`backups/2026-04-27-post-v2-deploy/` as the baseline and notes this in the report.

### 2. Migration `024_spending_level_normalize.sql`

> [!warning] Migration number
> Worker must verify the next available migration number by listing
> `supabase/migrations/`. Briefing assumes 024 but check before writing.

```sql
BEGIN;

-- Backfill legacy tier labels to canonical $N form.
UPDATE public.characters SET spending_level = '$7'  WHERE spending_level = 'Przeciętny';
UPDATE public.characters SET spending_level = '$25' WHERE spending_level = 'Zamożny';
UPDATE public.characters SET spending_level = '$2'  WHERE spending_level = 'Biedny';

-- Defensive: trim whitespace on any other rows (no-op if already clean).
UPDATE public.characters
  SET spending_level = TRIM(spending_level)
  WHERE spending_level IS NOT NULL AND spending_level != TRIM(spending_level);

-- CHECK constraint: NULL OR empty string OR canonical $N form (integer or decimal).
ALTER TABLE public.characters
  ADD CONSTRAINT spending_level_canonical
  CHECK (spending_level IS NULL OR spending_level = '' OR spending_level ~ '^\$[0-9]+(\.[0-9]+)?$');

COMMIT;
```

Notes:
- Decimal allowed: tier A "Bezdomny" spends `$0.5/day`. Regex `\$[0-9]+(\.[0-9]+)?` permits it.
- Empty string `''` allowed because in-flight drafts have it before StepEquipment.
- No `IF NOT EXISTS` on the constraint — migration is forward-only per
  [[../STRATEGY_AND_TACTICS#Tactics / guardrails]].

### 3. NEW `src/lib/spendingLevel.ts`

```ts
// Display formatter. DB now stores canonical $N (per 024_spending_level_normalize.sql),
// but this helper still guards against:
//  (a) legacy tier labels in case migration is skipped on a dev/branch DB
//  (b) [Lifestyle] equipment tag fallback for drafts where spending_level is empty
//  (c) unknown formats → em-dash
export function formatSpendingLevel(
  raw: string | null | undefined,
  equipment: string[] = [],
): string  // returns "$7" or "—"
```

- Logic mirrors current `resolveSpendingLabel` in `exportCardPdf.ts` (TIERS + LIFESTYLE_LEVELS + Biedny alias + tag fallback) BUT final fallback returns `'—'` instead of `raw`.
- Output: `$N` pre-symbol (D6).
- Empty input `''` / `null` / `undefined` → callers handle via `&&` short-circuit; helper itself returns `'—'`.

### 4. Edit 5 callsites to use helper

- `src/components/shared/CharacterSheet.tsx:209` —
  `<Badge>Poziom życia: {formatSpendingLevel(char.spending_level, char.equipment)}</Badge>`.
  Keep the `{char.spending_level && ...}` conditional outer wrap (em-dash only renders on unknown non-empty values).
- `src/lib/exportCardPdf.ts` — replace inline `resolveSpendingLabel` + `spendingFromLabel` with import. **Important**: PDF callsite currently outputs `N$` (post-symbol per `${tier.spending}$`). Update to `$N` (pre-symbol) per D6 — consistent everywhere now.
- `src/lib/backTocV2Map.ts` — replace inline `resolveSpending` block. (Already outputs `$N` — no format change there.)
- `src/lib/cardFrontMap.ts:273-277` — replace `spendingDisplay` ternary with helper call.
- `src/lib/exportText.ts:136` — replace raw interpolation: `Poziom życia: ${formatSpendingLevel(char.spending_level, char.equipment)}`.

### 5. Server-side validation in `/draft` (D8)

In `supabase/functions/player/index.ts`, find the `DRAFT_ALLOWLIST` block (line ~1266).
After the allowlist filter, add a canonical-form check for `spending_level` specifically:

```ts
if ('spending_level' in filtered) {
  const sl = filtered.spending_level
  if (sl !== null && sl !== '' && !/^\$[0-9]+(\.[0-9]+)?$/.test(String(sl))) {
    return errorResponse(`spending_level must match /^\\$\\d+(\\.\\d+)?$/, got ${JSON.stringify(sl)}`, 400)
  }
}
```

Same check on `/narrative` endpoint? **No** — `NARRATIVE_ALLOWLIST` doesn't include
`spending_level` (only narrative fields). Wizard-only.

### 6. Verify post-migration

```
node scripts/verify-characters-post-migration.mjs \
  --snapshot backups/2026-05-28-pre-bug-067
```

Expect: 23/23 OK (all rows present, only spending_level changed on the 8 backfilled rows).
Worker reports sha256 of post-snapshot.

### 7. Commit strategy

Two commits, in this order:

1. `chore(db): migration 024 — normalize spending_level + CHECK constraint (BUG-067)`
   - Files: `supabase/migrations/024_spending_level_normalize.sql`.
2. `fix(wealth): unify spending_level rendering + server validation (BUG-067, BUG-049)`
   - Files: `src/lib/spendingLevel.ts` (new), 5 callsite edits, `supabase/functions/player/index.ts`.

Optional 3rd commit for snapshot artefacts if worker has env vars to run the snapshot
tool: `chore(backups): pre/post BUG-067 snapshots`.

## Smoke test plan (Stage 5 — Pawel runs)

1. **DB**: query 4–5 rows directly (admin viewer or SQL): `howard-hayes` (was `Zamożny`)
   now `$25`; `edmund-ed-krawczyk` (was `Biedny`) now `$2`; `cecil-cavendish` ($7)
   unchanged.
2. **CHECK constraint**: try `UPDATE public.characters SET spending_level = 'foo'
   WHERE id = ...` via direct SQL — must fail.
3. **On-screen**: admin viewer / player viewer Badge shows `$7`, `$25`, `$2` — never
   raw "Przeciętny".
4. **PDF front card**: regenerate for `howard-hayes` → shows `$25`.
5. **HTML back card**: regenerate → ZASOBY box shows `$25`.
6. **Text export**: shows `Poziom życia: $25`.
7. **Wizard write**: create a new test character via tester account → StepEquipment
   → submit → DB row matches `^\$\d+$`.
8. **Server validation**: hack a `PUT /draft` with `spending_level: "Przeciętny"` via
   curl + player token → expect 400.
9. **Em-dash fallback**: temporarily set a row to `"$abc"` via admin direct PUT
   (bypassing constraint via service role) → Badge shows `—`. Skip if too contrived;
   covered by code review of helper.

## Edge cases

- Decimal tier (`$0.5` for Bezdomny) — regex permits, helper handles.
- Whitespace input — trimmed by migration + tolerated by helper.
- Legacy `LIFESTYLE_LEVELS` labels in raw (`Skromny`, `Komfortowy`) — not in DB inventory,
  but helper still maps via parent tier lookup as safety net.
- Future tier label changes in `wealthV2.ts` — helper auto-updates (reads TIERS at
  runtime). Migration values are frozen at 2026-05-28.

## Out of scope

- `cash` / `assets` normalization (separate format, separate follow-up if needed).
- i18n / Polish-currency formatting.
- Migration rollback. Forward-only per project convention.
