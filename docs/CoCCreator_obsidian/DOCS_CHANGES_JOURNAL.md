---
date: 2026-04-21
status: active
tags:
  - journal
  - changelog
---

# Docs Changes Journal

Append a new dated entry per working session. Newest first.

---

## 2026-05-28 — Front B closed: residence/birthplace + spending_level (CONSTANTA-1)

**Focus:** bug-fix campaign Front B under MANAGER CONSTANTA-1 (command chain
opened this session; see [[operations/COMMAND_LOG]]). Two bug clusters owned:
BUG-064 (residence/birthplace integration) and BUG-067 (spending_level
inconsistency), absorbing BUG-049. BONAPARTE-1's briefing also flagged BUG-014
(admin allowlist gap) but recon proved it was already fixed in `53a2674` (Etap
C, 2026-04-27) — no further action on that.

**Method:** five-stage manager flow per BONAPARTE-1 doctrine:

1. **Recon** — inventoried DB via `backups/2026-04-27-post-v2-deploy/` (live
   snapshot tool wanted env vars that weren't in shell — fell back to last
   committed snapshot). Mapped 5 render paths for `spending_level` and 15+
   code touch-points for residence/birthplace. Wrote
   [[work/2026-05-28-front-b-recon]]. Key finding: BUG-064 was ~80% wired in
   HEAD (store, edge-fn allowlists, NarrativeEditor, wizard StepBasicInfo,
   PDF map, HTML template placeholders all done); only the admin edit form
   and on-screen sheet preview were missing — and both already sat in the
   working tree as uncommitted diffs from a prior session. BUG-067 had three
   render paths still leaking raw labels after the May 24 hotfixes
   (`5904e61`, `366a619`): the on-screen `CharacterSheet` Badge, the HTML
   front card via `cardFrontMap`, and the `.txt` export.

2. **Specs** — drafted two short specs in `specs/`:
   [[specs/birthplace_residence_integration]] and
   [[specs/spending_level_normalization]]. Each <400 words with explicit
   decision table.

3. **Sign-off** — presented 8 decisions (D1–D8) to Pawel via BONAPARTE-1.
   D1–D4 (residence/birthplace) ratified per recommendation. D5 (spending
   normalization strategy) overridden: GENERAL chose **Path B** (DB migration
   + CHECK constraint + helper) over CONSTANTA-1's recommended Path A
   (render-only helper). Rationale: akta-kasandry contract reads
   `SELECT * FROM public.characters` straight into `wiki.imported_characters.data`
   (per [[INTEGRATIONS]]) — legacy labels would leak across the integration
   boundary; plus BUG-067 has returned twice already after partial render-side
   hotfixes, so DB normalization closes the door. D6=`$N` pre-symbol confirmed
   by CONSTANTA-1. D7=`—` em-dash final fallback. D8=server-side `/draft`
   validation per Path B doctrine. Spec
   [[specs/spending_level_normalization]] rewritten to Path B before
   dispatch.

4. **Dispatch** — two workers dispatched **sequentially** (not parallel)
   because both touch `src/components/shared/CharacterSheet.tsx` at different
   sections, and worktree-merge for two commits was overkill:
   - WORKER #B1 — committed the two uncommitted local diffs as two
     separate commits, build green throughout, 5–10 min turnaround.
   - WORKER #B2 — wrote migration 023, new helper, edited 5 callsites,
     added server validation, 2 commits, build green throughout. Snapshot
     attempt failed gracefully (missing env vars per same constraint as
     CONSTANTA-1 hit during recon); worker used the 2026-04-27 baseline as
     comparison.

5. **QA + closing report** — spot-checked all 4 commits via `git show --stat`
   and `git log --oneline`; read full diff of migration and helper. Drafted
   Polish smoke-test plan for Pawel to execute pre-push. Updated vault
   (this entry + [[TASK_LIST]] + [[operations/COMMAND_LOG]]).

**Commits landed (all local on master — no push, per command-chain
protocol):**

| SHA | Subject | Files |
|---|---|---|
| `7d7ffa0` | feat(admin-edit): expose residence + birthplace inputs (BUG-064) | `BasicInfoEditor.tsx` +4 |
| `8685270` | feat(sheet): display residence + birthplace on-screen preview (BUG-064) | `CharacterSheet.tsx` +2 |
| `da9229e` | chore(db): migration 023 — normalize spending_level + CHECK constraint (BUG-067) | `023_spending_level_normalize.sql` +18 |
| `ed68966` | fix(wealth): unify spending_level rendering + server validation (BUG-067, BUG-049) | 7 files, +89/−68 |

**Decisions captured (long-term):**

- **Format flip on PDF front card**: previously `25$` post-symbol; now `$25`
  pre-symbol. Intentional per D6 — canonical form is `$N` everywhere. Drives
  consistency with HTML back card (`backTocV2Map`) which already emitted
  `$N` pre-symbol. Polish convention is post-symbol but the existing DB
  majority + integration concerns won.
- **DB CHECK constraint locks the format**: `spending_level IS NULL OR =
  '' OR ~ '^\$[0-9]+(\.[0-9]+)?$'`. Future writes that don't match get
  rejected at write time + server `/draft` endpoint also validates
  defensively. Two layers of protection against recurrence.
- **Em-dash `—` final fallback**: visible "missing" signal when raw value
  is non-empty but unrecognized. Used by `formatSpendingLevel` only —
  render-side conditional `{char.spending_level && ...}` short-circuits
  empty/null first.

**Migration NOT yet applied to live DB.** This is gated on push approval —
admin runs `npx supabase db push` (or equivalent) before deploying the
frontend, otherwise the constraint is missing on prod but render still safe
via helper's legacy-label fallback.

**Open items for GENERAL/Pawel push decision:**

- Bundled push of Front A (3 commits) + Front B (4 commits) = 7 commits.
- Sequence: (a) apply migration 023 to live DB, (b) verify via
  `snapshot-characters.mjs` + `verify-characters-post-migration.mjs`, (c)
  push frontend, GitHub Pages auto-deploys.

**Files changed (vault — this session's writes):**

- `docs/CoCCreator_obsidian/work/2026-05-28-front-b-recon.md` (NEW)
- `docs/CoCCreator_obsidian/specs/birthplace_residence_integration.md` (NEW)
- `docs/CoCCreator_obsidian/specs/spending_level_normalization.md` (NEW, status `signed-off`)
- `docs/CoCCreator_obsidian/operations/COMMAND_LOG.md` — Front B status, decision log
- `docs/CoCCreator_obsidian/TASK_LIST.md` — "Recently completed" entry
- `docs/CoCCreator_obsidian/DOCS_CHANGES_JOURNAL.md` — this entry
- `docs/CoCCreator_obsidian/work/Index.md` — link to new recon note

---

## 2026-05-20 — Akta-kasandry plan landed: integration surface registered

**Context:** akta-kasandry side delivered their `SUPABASE_AND_SYNC.md` —
schema (`wiki.profiles`, `wiki.pages`, `wiki.revisions`, `wiki.pins`,
`wiki.imported_characters`), RLS, sync pipeline, migration order. Explicitly
calls out one cross-project read: `SELECT * FROM public.characters` via the
existing `anon_read_characters` policy, snapshotted into
`wiki.imported_characters.data` (jsonb) at admin trigger time.

**Verdict after cross-checking against the handoff [[work/akta-kasandry-handoff]]:**
aligned on every point of the isolation contract — `wiki` schema only, no FKs
to `public.*`, no edge function reuse, trigger on `auth.users INSERT` writes
only to `wiki.profiles`, no `supabase.auth.*` consumption asked of us.

**Done this session (docs only — no app code touched):**

- **NEW `docs/CoCCreator_obsidian/INTEGRATIONS.md`** — formal registry of
  cross-project surfaces. Lists what akta-kasandry reads, what they don't,
  what triggers coordination. Currently one consumer (`public.characters`
  via anon SELECT, `portraits` bucket via public read). "Coordination
  triggers" section lists four operations on coc-creator side that need a
  ping-before-push to akta-kasandry.
- **`TECHNOLOGY_MASTERMIND.md`** — Shared-Supabase section gained a final
  subsection "Documented integration surfaces" pointing at INTEGRATIONS.md.
  Short version of the constraint inline.
- **`TASK_LIST.md`** — Hardening section gained an info callout noting that
  the integration surface is now registered; future tasks tightening
  `anon_read_characters` / `public.characters` columns / `portraits` bucket
  must coordinate.
- **`work/akta-kasandry-handoff.md`** — appended "Update 2026-05-20 —
  akta-kasandry's plan reviewed". Records: verdict aligned + 4 things we
  flagged back (whole-row jsonb brittleness, migration table collision
  reminder, stale-URL caveat on portraits, `anon_read_characters` is now a
  load-bearing public API).

**Flagged back to akta-kasandry side (no blocker for them):**

1. `select *` snapshot of `public.characters` is forward-risky. Today's
   columns are character data only (no secrets), but a future column with
   PII or a secret would leak silently into `wiki.imported_characters.data`.
   Recommend explicit allowlist in their snapshot extractor.
2. Migration table (`supabase_migrations.schema_migrations`) is shared with
   coc-creator. Their plan to "apply each migration in a separate file with
   GM pause between" implies manual application — confirmed safe as long as
   `supabase db push` is never run from akta-kasandry's repo.
3. Portrait URLs in `wiki.imported_characters.portrait_url` are snapshots.
   coc-creator-side deletes/moves leave wiki with broken images. Their
   "imported (stale)" state catches data drift but not URL drift. Admin
   re-imports as needed. We won't proactively ping on portrait reshuffles.
4. `anon_read_characters` RLS was internal yesterday, is a public API today
   — they should treat it as such on their side, and we treat coordination
   on it as binding.

**Decisions:**

- **Stay with No-SSO (option #1 from handoff section E).** They're going
  Supabase Auth on their side without bridging into coc-creator's bcrypt
  accounts. coc-creator's auth stays untouched. Per-app login is the
  accepted UX trade.
- **`public.characters` shape is now stable contract.** Adding columns is
  fine (their `select *` will just snapshot them too). Renaming, removing,
  or repurposing columns requires coordination.
- **No new tasks on coc-creator side.** The two RLS gaps already in
  [[TASK_LIST#Hardening (pre-akta-kasandry coexistence)]] remain the only
  outstanding hardening work.

**Files changed:**
- `docs/CoCCreator_obsidian/INTEGRATIONS.md` (NEW)
- `docs/CoCCreator_obsidian/TECHNOLOGY_MASTERMIND.md`
- `docs/CoCCreator_obsidian/TASK_LIST.md`
- `docs/CoCCreator_obsidian/work/akta-kasandry-handoff.md`

---

## 2026-05-19 — Audit: sharing Supabase project with `akta-kasandry`

**Focus:** decision came in to start a second app ("Akta Kasandry" — RPG wiki/CMS
for the "Rozdarte Sumienie" campaign, separate repo + GitHub Pages deploy) and
share the existing Supabase project (`okbrsoomtomexilxxsyd`) with it, because
the free-tier limit of 2 projects per org is already taken. Akta Kasandry will
use its own Postgres schema (`wiki`), its own storage bucket (`wiki-attachments`),
and — unlike coc-creator — **will** use Supabase Auth.

Task this session: evaluate impact on coc-creator. No code changes to the app.

**Audit method:**
- Dispatched two parallel `Explore` agents over `supabase/migrations/*.sql`,
  `supabase/functions/`, and `src/`.
- Wrote `scripts/check-supabase-usage.mjs` (new, read-only diagnostic) and
  ran it against live DB to measure current usage and confirm `auth.users` is
  empty.

**Findings (matrix in [[TECHNOLOGY_MASTERMIND#Shared Supabase project with akta-kasandry]]):**

1. **Supabase Auth is unused by coc-creator.** Zero `auth.uid()`,
   `auth.users`, or `supabase.auth.*` references anywhere. Player auth =
   bcrypt + invite codes (custom JWT in `localStorage.player_token`). Admin
   auth = `X-Admin-Password` env-var header. Confirmed `auth.users` count is
   `0` rows on the live DB.
2. **All public RLS policies are `anon`-scoped or `service_role`-only.** No
   policy grants `authenticated`. Adding wiki users (who land in the
   `authenticated` role) does NOT widen access to coc-creator data.
3. **No `auth.users` triggers exist.** Wiki signups will not create rows in
   `public.*`.
4. **All edge functions use `SUPABASE_SERVICE_ROLE_KEY`** and bypass RLS.
   RLS is a defense-in-depth layer; actual access control lives in function
   code (admin password / player JWT / share token).
5. **Frontend never reads `supabase.auth.*`.** A user with a valid akta-kasandry
   session in the same browser opens coc-creator and is treated as anonymous.
   No crash, no leakage.
6. **No realtime subscriptions in `src/`.** Only Zustand store subscriptions
   (unrelated). Wiki write activity can't page coc-creator clients.
7. **Storage `portraits` bucket is already public-read + anon-upload.** UUID
   path obscurity is the only privacy layer. Akta Kasandry doesn't change the
   threat model — wiki users already had this level of access as anon.

**Two pre-existing RLS gaps to close** (independent of akta-kasandry, but bumps
priority once `auth.users` starts populating):

- `public.portrait_feedback` (migration `010_portrait_feedback.sql`) — no
  `ENABLE ROW LEVEL SECURITY`. Default GRANTs let anon read+write via anon key.
- `public.portrait_generations` (migration `020_portrait_generations.sql`) —
  same gap. Holds rate-limit counters; cross-tenant spam writes could skew
  per-player limits.

Both tracked in [[TASK_LIST#Hardening (pre-akta-kasandry coexistence)]]. Low
priority today (only service-role edge functions touch them), medium once Akta
Kasandry ships.

**Live usage measured 2026-05-19:**

- DB: 13 MB / 500 MB (2.6%). Public schema = 1.3 MB.
- Storage: 55 MB / 1 GB (5.5%). 28 portrait objects.
- `auth.users`: 0 rows.

Headroom for wiki: ~487 MB DB, ~945 MB storage. Markdown is cheap (~30 KB per
5000-word page); the realistic constraint is `wiki-attachments` if the GM
uploads many high-res maps/handouts.

**Files changed:**
- `docs/CoCCreator_obsidian/TECHNOLOGY_MASTERMIND.md` — new section
  "Shared Supabase project with `akta-kasandry`": audit matrix, isolation
  contract, do-not list, capacity numbers, verification recipe.
- `docs/CoCCreator_obsidian/TASK_LIST.md` — new "Hardening
  (pre-akta-kasandry coexistence)" section with the two RLS gap tasks.
- `scripts/check-supabase-usage.mjs` (NEW) — read-only diagnostic; queries
  `pg_database_size`, schema sizes, top tables, `storage.objects` totals per
  bucket, and `auth.users` count. Use this for periodic spot-checks once
  akta-kasandry is live.

**Decisions:**
- **Go-ahead for Akta Kasandry as second tenant** on `okbrsoomtomexilxxsyd`.
  No defensive code changes required in coc-creator before akta-kasandry can
  start. The two RLS gaps are queued in TASK_LIST and should be addressed
  before akta-kasandry's first production deploy, not before its repo init.
- **Isolation contract** (TECHNOLOGY_MASTERMIND): schemas, buckets, and edge
  functions are walls. No cross-schema FKs, no cross-schema queries from
  edge functions. `auth.users` is owned by akta-kasandry; coc-creator MUST
  NOT start reading `auth.uid()` without re-evaluating this contract.

**Out of scope (not touched):**
- coc-creator application code.
- Akta Kasandry repo / migrations / RLS design (lives in the other repo when
  it exists).
- Backup strategy update beyond the note that `pg-dump-all.mjs` only dumps
  `public` and akta-kasandry needs its own dump tooling.

---

## 2026-04-28 — v2.0 stabilization: 8 hotfixes + UX polish

**Focus:** browser smoke testing the live v2.0 stack uncovered six bugs and
two UX requests. All fixed and pushed to production the same session.

**Done (chronological — 8 commits, all pushed to origin/master):**

1. **`fb3552b` — Hotfix: drop portrait_url from /draft autosave payload.**
   First soft-zone autosave 400'd with "Nie udało się zapisać. Nie zamykaj
   przeglądarki." because `useDraftSync.buildDraftData` was including
   `portrait_url` but the player edge function's `DRAFT_ALLOWLIST` (Etap B
   tightening) rejects it — portrait writes have dedicated endpoints
   (PUT /portrait via `playerSelectPortrait` or PUT /narrative). Client-only
   fix; one line removed from `buildDraftData`.

2. **`3683c24` — Hotfix: mirror invite_codes.assigned_player_id to
   player_codes junction.** Player `/codes` endpoint reads from junction
   table `player_codes`, but admin `POST /codes` and `PATCH /codes` only
   updated the new `assigned_player_id` column on `invite_codes`. So a code
   "assigned" via the admin dropdown never appeared in the assigned
   player's dashboard. Fixed: POST/PATCH now upsert/delete the junction
   row whenever `assigned_player_id` is in the body. Reconciled the two
   already-orphaned codes manually via `adminAssignCode`. Edge function
   admin redeployed v15 → v16.

3. **`c847c50` — Hotfix: clear wizard state on login/logout/code-change.**
   `usePlayerStore.logout()` cleared the JWT but the persisted
   characterStore (`coc-character-wizard` in localStorage) survived. Next
   login inherited the previous user's `currentStep` / `serverDraftId` /
   characteristics — clicking "Użyj kodu" rebooted the wizard at e.g.
   step 14 (StepDrivePillars) showing the previous user's draft. Backend
   was unaffected (player_id ownership gate rejected every cross-owner
   write), but UX looked like a privacy leak. Three layered fixes:
   - `usePlayerStore.login()` and `.logout()` call
     `useCharacterStore.getState().reset()` — every auth boundary clears
     the slate.
   - `characterStore.setInviteCode()` resets `currentStep` to 0 (was only
     resetting `savedStep`).
   - PlayerDashboard "Użyj kodu" fresh-start branch calls `reset()` before
     `window.location.href`.

4. **`6aae375` — StepAge: −5/−1/+1/+5 buttons + always-clamped value.**
   User saw "Wiek 3" displayed despite min=15 — typing in the controlled
   `<input type="number">` updated the DOM optimistically while
   `NumberInput.handleInput` silently rejected the value, leaving DOM and
   state diverged. Replaced StepAge's NumberInput with a bespoke row:
   `[−5] [−1] [<input>] [+1] [+5]`; every state path goes through
   `clampAge()`; out-of-range typed values snap on blur. Other wizard
   steps still use the shared NumberInput (1-99 ranges with less drama).

5. **`15b0921` — Hotfix: define missing getAgeModifications in player
   edge function.** `/roll-edu` and `/apply-aging-penalties` (Etap A)
   referenced `getAgeModifications()` but the function was never defined
   in the Deno runtime. Smoke tests caught only auth (401), so the code
   path never ran during deploy day. First real call from the wizard
   surfaced as `ReferenceError` rendered inline as red text. Fix: thin
   alias above the existing `getAgeRange` helper — endpoints already read
   `eduImprovementChecks` / `deductionPoints` / `appReduction` off the
   returned object, all on `AgeRange`. Edge function player redeployed
   v14 → v15.

6. **`3867e4a` — StepReview: single Edytuj toggle replaces per-field
   hover-pencil UX.** Per-field 0.30-opacity hover pencils were unreadable
   and tedious. Replaced with a single page-level `editing` state + one
   "Edytuj" / "Zakończ edycję" button at the top of the card; in editing
   mode every field renders as a live input/textarea, changes commit to
   the wizard store on each keystroke, no separate save click. Read-only
   mode shows label + value with "puste" placeholder.

7. **`15128f8` — PlayerCharacterViewer: always-on narrative edit (no
   admin approval).** Previously "Zaproponuj zmiany" opened a single edit
   form for ALL fields and submitted via `playerProposeEdit` (admin
   approve queue) — but Etap C blocks mechanical pre-occupation fields
   from approval, so the UX was misleading. Replaced with:
   - New `src/components/player/NarrativeEditor.tsx` — clean form for the
     seven narrative fields the `/narrative` endpoint accepts plus
     distinguisher (`/distinguisher` endpoint).
   - Button label "Zaproponuj zmiany" → "Edytuj fabułę", always visible.
   - Edit mode renders only NarrativeEditor + BackstoryEditor.
   - Save split into `playerUpdateDistinguisher` (only when changed,
     client-side validates 3-60 chars) + `playerUpdateNarrative` (single
     payload for the rest). Both bypass admin approval — server enforces
     ownership.
   - Removed change-comment input and propose-edit submit.
   - `CharacterSheetData` extended with `residence?` / `birthplace?`.

8. **`4c49b76` — PlayerCharacterViewer: add gated 'Edytuj mechanikę'
   button.** Sits next to "Edytuj fabułę". Wired to the existing
   edit_permission system (admin already controls from CharacterViewer's
   "Uprawnienia edycji" panel — Tryb: lore/standard/full, Czas:
   24h/1tydzień/Do odwołania). Behaviour:
   - On mount fetches `playerGetEditPermission`. Treats expired rows as
     absent.
   - No permission → button disabled, lock icon, hover title:
     "Strażnik Tajemnic musi nadać Ci uprawnienie…".
   - Permission present → button enabled, wrench icon, hover title shows
     level + remaining time. Adjacent badge surfaces same info inline
     ("standard (od zawodu) · wygasa za 18h").
   - Click → `loadForPlayerEdit` with the granted `edit_mode` →
     `navigate('/create')`. Same path PlayerDashboard's "Edytuj" button
     uses; wizard's existing `getAllowedSteps` filters which steps are
     reachable.
   - No backend / admin-side changes — admin lifecycle was already wired,
     just surfaced as a player-side button.

**Bonus ops (not commits, but state changes):**

- Created tester account via admin endpoint: login `tester`, password
  `tester`, id `be71d778-af66-468a-b686-1db86d48e993`.
- Created two test codes assigned to tester:
  `GCC-4858-EUK` (label "Test smoke deploy v2.0", dice+point_buy+direct,
  reroll_budget 3, perks: swap_characteristics, classic_1920s, max
  skill 80) and `VNB-1251-VLP` (user-created, label "do testów v2 #2").
- Manually backfilled both into `player_codes` junction via
  `adminAssignCode` (before hotfix `3683c24` landed) — not needed
  going forward.

**Smoke validated end-to-end:**

- Rafał (`7d54eec4`): "Kontynuuj tworzenie" → lands on StepDrivePillars
  (step 14 in v2 layout, mapped from v1 step 10 by deploy-day migration).
- Tester full flow: identifier → cech (dice + reroll button works) →
  swap (test "Pomiń zamianę") → wiek (new −5/−1/+1/+5 widget) →
  EDU/aging/luck → derived → soft zone → review (single Edytuj toggle)
  → submit. Character flipped draft → submitted via
  `playerSubmitCharacter` (granular submit path).
- Tester PlayerCharacterViewer post-submit: "Edytuj fabułę" round-trips
  through `/narrative` + `/distinguisher`. "Edytuj mechanikę" disabled
  by default, enabled after admin grants edit_permission, wizard opens
  in the right edit mode.

**Deferred / nice-to-have (none blocking):**

- Hard-zone "Wstecz" buttons in StepSwap/StepEduRolls/StepAgingPenalties/
  StepLuck — left in place; clicking them harmlessly returns to a step
  whose data is already committed (renders read-only with only "Dalej").
  Plan said "blocked at UI level"; lazy compromise.
- Distinguisher backfill across 22 submitted chars — left empty per
  deploy-day decision (player-owned, partial unique idx ignores blanks).
  Players can fill via `playerUpdateDistinguisher` whenever they choose.
- Soft-zone back-step modal (`playerGoBackToStep` server-side wipe) —
  client-side `prevStep()` works without server wipe; tracked for a
  later polish pass.
- Admin edit duration UI shows 3 options (24h / 1tydzień / Do odwołania).
  User said "na stałe lub na 24h" — 1-tydzień option kept as bonus.
- Migration 020 (drop `invite_codes.max_tries`) — still deferred.

**Edge function versions live:**

- `admin` v16 (last deploy 2026-04-28, after junction sync hotfix).
- `player` v15 (last deploy 2026-04-28, after getAgeModifications hotfix).

**Files touched (8 commits, dozens of small surgical edits):**

- `src/hooks/useDraftSync.ts`
- `src/stores/playerStore.ts`, `src/stores/characterStore.ts`
- `src/components/player/PlayerDashboard.tsx`
- `src/components/player/PlayerCharacterViewer.tsx`
- `src/components/player/NarrativeEditor.tsx` (NEW)
- `src/components/wizard/StepAge.tsx`
- `src/components/wizard/StepReview.tsx`
- `src/components/shared/CharacterSheet.tsx`
- `supabase/functions/admin/index.ts`
- `supabase/functions/player/index.ts`

**Status:** v2.0 stable on production. Smoke validated by browser test
across both admin and player roles. Tester account + code retained for
future verification.

---

## 2026-04-27 — v2.0 deployed to production

**Focus:** deploy day for the granular-commits rework. Edge functions
deployed to live (admin v14→v15, player v13→v14), frontend pushed (24
commits to origin/master), DB cleaned up + Rafał's draft remapped to the
new step numbering.

**Done (chronological):**

1. **list-drafts (read-only sanity)** — confirmed 31 chars (9 drafts incl.
   1 active = Rafał's `7d54eec4` step 10, 8 balast).

2. **Snapshot pre-v2** (admin-API JSON) — `backups/2026-04-27-pre-v2/`
   sha256 `56db2b85…` (31 chars · 59 codes · 1 pending edits).

3. **pgdump pre-v2** (gitignored, contains bcrypt hashes) —
   `backups/2026-04-27-pre-v2-pgdump/` sha256 `963a6b5e…` (matches the
   2026-04-26 post-019 dump → DB unchanged since migrations).

4. **Inspected Rafał's draft 7d54eec4** — characteristics committed,
   age 27, occupation `okultysta`, skills + main_position +
   contacts_v2 + equipment populated; backstory empty; distinguisher
   empty; `swap_available=false`; all hard-zone commit timestamps
   already backfilled by migration 019. Step 10 in v1 numbering =
   `StepBackstory`.

5. **Balast cleanup** — DELETE 8 chars via admin endpoint
   `DELETE /admin/characters/:id` (all returned HTTP 200):
   - `1d172a84` Superbase_trigger
   - `cf2487f1` test
   - `6fd1af43`, `a3f36e7a`, `0fdc9f5b` — 3× "Nowa postać" unassigned
   - `e3cc702f`, `7f610d4c`, `785ff771` — 3× Rafał abandoned

6. **draft_step v1→v2 remap** — wrote one-shot tool
   `scripts/migrate-draft-step-v1-to-v2.mjs` with explicit mapping
   table (1→2, 2→4, 3→7, 4→8, 5→9, 6→10, 7→11, 8→12, 9→13, 10→14,
   11→15, 12→16). Dry-run printed plan, `--execute` applied via admin
   `PUT /characters/:id`. Result: only Rafał's `7d54eec4` had a
   non-null `draft_step` after balast cleanup → `10 → 14`
   (StepBackstory in the new layout, exactly where he should resume).

7. **Snapshot post-cleanup** —
   `backups/2026-04-27-pre-v2-deploy/` sha256 `4a83e90e…` (23 chars ·
   59 codes · 1 pending edits). Used as the baseline for post-deploy
   verify.

8. **Edge function deploys**:
   ```
   npx supabase functions deploy admin player --project-ref okbrsoomtomexilxxsyd
   ```
   Verified via `supabase functions list`:
   - `admin`  v15  ACTIVE  2026-04-27 19:29:14 UTC
   - `player` v14  ACTIVE  2026-04-27 19:29:31 UTC

9. **Curl smoke tests** (all passed — see commit message for full matrix):
   - admin auth gate (200 with right pass, 401 with wrong, ping cold-start
     503 once then 200).
   - admin `/codes` 200 + 59, `/characters` 200 + 23 (1+22),
     `/codes/cleanup` dry_run 200 + 38 to_delete (NEW Etap C endpoint OK).
   - all 6 NEW player endpoints (skip-swap, roll-characteristics, set-age,
     roll-edu, roll-luck, submit) returned 401 without token = routes
     loaded, auth gate active. Would 404 if not deployed.

10. **`git push origin master`** — 24 commits pushed
    (`68a9bcb..f6c447e`), Vercel/Netlify auto-deployed. Remote warned
    "repository moved" to `UrsusCodes/coc-creator` — informational only,
    push succeeded; remote URL update for next session if desired:
    `git remote set-url origin https://github.com/UrsusCodes/coc-creator.git`.

11. **Post-deploy verify**:
    - `snapshot-characters.mjs --tag post-v2-deploy` → sha256
      `4a83e90e…` IDENTICAL to `pre-v2-deploy` (zero drift, expected —
      no traffic landed before the snapshot).
    - `pg-dump-all.mjs --tag post-v2-pgdump` (gitignored) → sha256
      `db94d5aa…`, 137 rows (8 fewer than pre-v2-pgdump → balast
      cleanup confirmed at row level).
    - `verify-characters-post-migration.mjs --snapshot
      backups/2026-04-27-pre-v2-deploy` → 23/23 OK.

12. **Commit `87340ce`** — staged and committed: migration script,
    pre-v2 snapshot, pre-v2-deploy snapshot, post-v2-deploy snapshot.
    pgdump backups remain gitignored (bcrypt + tokens).

**Decisions:**

- **Rafał's draft preserved end-to-end across the deploy.** Migration
  019 backfilled all hard-zone commit timestamps on 2026-04-26 (because
  his age + occupation are populated, the DO block conditions matched).
  All this deploy needed to do was remap his `draft_step` from v1
  numbering (10 = backstory) to v2 numbering (14 = backstory). After
  deploy, `loadDraftForContinuation` reads `draft_step=14` and
  WizardShell lands him on StepBackstory directly — no replay, no data
  loss.

- **Distinguisher left empty across all 23 chars** (was already empty
  on every char in v1; migration 018 added the column with default ''
  and the partial unique index ignores empty strings). Rafał will see
  empty distinguisher when he resumes; he can fill it via the player
  flow if he chooses, or leave it (`/distinguisher` PUT works
  anytime). Submitted chars (22) keep empty distinguisher; admin
  `BasicInfoEditor` shows "—" with helper note explaining player
  ownership; players can set their own via `playerUpdateDistinguisher`
  later if desired.

- **Reroll budget unchanged on existing chars.** Migration 018
  backfilled `reroll_budget = max(0, max_tries - 1)` for all 59 codes;
  legacy 1-try codes get 0 rerolls. Future codes use the new form
  field directly.

- **Migration script kept in git** — `scripts/migrate-draft-step-v1-to-v2.mjs`
  is one-shot but useful as audit / pattern for similar future remaps.
  Idempotent against current DB state (no v1-numbered drafts left).

- **`/admin/ping` cold-start 503**: first request after deploy hit
  Deno's cold start + service initialization. Retry was 200; subsequent
  requests fine. Worth knowing: first user request after a deploy may
  see this. Acceptable transient.

- **Repo remote shows "moved"**: GitHub redirect from
  `storagestation2023/coc-creator` to `UrsusCodes/coc-creator`. Push
  goes through transparently. Optional cleanup deferred.

**Files (1 commit, +36707 / -0 lines, mostly snapshot JSON):**
- `scripts/migrate-draft-step-v1-to-v2.mjs` (NEW, +140).
- `backups/2026-04-27-pre-v2/**` (NEW, snapshot).
- `backups/2026-04-27-pre-v2-deploy/**` (NEW, baseline for verify).
- `backups/2026-04-27-post-v2-deploy/**` (NEW, post-deploy snapshot).

**Edge functions live (production):**
- `admin` v15 → 2026-04-27 19:29:14 UTC.
- `player` v14 → 2026-04-27 19:29:31 UTC.

**Frontend live:** Vercel/Netlify deployed `f6c447e` automatically after
push.

**Outstanding (user-side smoke):**
- Login admin → InviteCodeManager renders + edit/cleanup work.
- Login Rafał → "Kontynuuj tworzenie" lands on StepBackstory; finish
  backstory + basic_info + review → submit flips draft → submitted via
  `playerSubmitCharacter`.
- Optional player communication (Polish message draft in
  [[work/v2-deploy-plan#PT.2 — Player communication]]).

**Commit:** `87340ce` "Deploy v2.0 to production: edge functions live +
frontend pushed".

**Status:** v2.0 LIVE.

---

## 2026-04-27 — Wizard sub-session 3: admin + player UI for granular-commits

**Focus:** finalize the v2.0 frontend by exposing the new code-identity rework
features (label, reroll budget, lifecycle status, distinguisher ownership)
end-to-end across admin and player views ([[work/v2-deploy-plan]] sub-session 3).
After this commit the only remaining work before deploy is balast cleanup +
pre-deploy snapshot + deploy day procedure.

**Done:**

- **`src/components/admin/InviteCodeManager.tsx` full rewrite** (+400/-150):
  - Form (create + edit, shared `CodeForm` component): label, methods, era,
    `reroll_budget`, perks, `max_skill_value`, `assigned_player_id` (dropdown
    over `adminGetPlayers`).
  - List rows show derived lifecycle status (unused / started / finished
    based on the linked character's `status`), assignee name, methods, era,
    reroll budget, distinguisher, `rerolls_remaining`, perks, created date.
  - Filter chips: **Aktywne** (default — hides finished), **Niewykorzystane**,
    **W trakcie**.
  - Collapsible **"Kody zużyte/zakończone"** hidden by default (archive view).
  - **Cleanup button** → `adminCleanupCodes(dryRun:true)` preview modal
    listing deletable rows → "Potwierdź usunięcie" → `adminCleanupCodes()` +
    refetch.
  - **In-place edit**: opens `editForm` under the row, calls
    `adminUpdateInviteCode`. Cancel + Save buttons.
  - **"+1 przerzut" action** per linked character → `adminGrantReroll`,
    optimistic update of `rerolls_remaining` in local state.
  - Joins three sources client-side (`codes` / `characters` / `players`) on
    mount via `Promise.all` + per-id `Map`s.

- **`src/components/admin/CharacterList.tsx` touches**:
  - New "Etykieta kodu" badge (joined from `invite_codes.label` via parallel
    `adminGetCodes` fetch + `Map<id, label>` lookup).
  - New "Przerzuty" badge with sparkles icon when `rerolls_remaining > 0`.
  - `CharacterRow` type extended with `invite_code_id` + `rerolls_remaining`.

- **`src/components/admin/edit/BasicInfoEditor.tsx`**:
  - Distinguisher input replaced with read-only display + helper note
    ("Identyfikator jest własnością gracza i edytuje go on sam"). Aligns
    with v2.0 rule: distinguisher is player-owned and edited via
    `PUT /distinguisher` only. Admin edit path no longer carries it.

- **`src/components/player/PlayerDashboard.tsx` touches**:
  - Codes section shows derived lifecycle status (Niewykorzystany / W trakcie
    / Zakończony based on linked character), label badge, distinguisher
    badge, `rerolls_left` badge with sparkles icon.
  - **"Użyj kodu" → "Kontynuuj"** when an in-flight draft exists for the
    code; routes through `handleContinueDraft` (existing loader) instead of
    fresh `/create?code=...`. Disabled while another action is loading.
  - Characters split into **drafts** (always visible) + collapsible
    **"Zakończone postacie"** (hidden by default).
  - Rerolls_left badge on draft character cards.
  - `PlayerCode` extended with `label` + `reroll_budget`; `PlayerCharacter`
    with `rerolls_remaining`.
  - Refactored character row rendering into a shared `renderCharacterRow`
    helper to avoid duplicating the JSX between drafts and finished sections.

- **`src/types/invite.ts`**:
  - `InviteCode` gains `label?` / `reroll_budget?` / `assigned_player_id?`.
  - New `InviteCodeStatus = 'unused' | 'started' | 'finished'`.

**Decisions:**

- **Lifecycle status derived client-side, not stored on `invite_codes`.**
  Each row computes status from the joined character snapshot (no character
  → unused; draft → started; submitted → finished). Avoids schema churn for
  what's purely a UI projection. Source of truth stays the character's
  `status` column.

- **InviteCodeManager joins three datasets locally** (`codes` × `characters`
  × `players`) instead of returning a precomputed view from the edge
  function. Keeps `GET /codes` cheap and the join cost is trivial for the
  expected catalog size (~60 codes, ~30 chars, ~10 players).

- **"Kontynuuj" routing for in-flight drafts** uses the same
  `handleContinueDraft` path PlayerDashboard already used for "Kontynuuj
  tworzenie" on character cards. Single code path → consistent resume
  behavior whether the user clicks the code row or the character row.

- **Distinguisher made read-only in BasicInfoEditor** (admin edit path).
  Server-side enforcement of player ownership is via the
  `/distinguisher` endpoint that requires player auth; making the admin
  field read-only mirrors that boundary in the UI rather than relying on
  the user to know not to type there.

- **CodeForm shared between create + edit** to keep the create / edit
  schemas in sync. Submitting an edit funnels through `adminUpdateInviteCode`
  (PATCH `/codes/:id`); creating goes through `adminCreateCode` (POST
  `/codes`). Same field set in both modes (sans `code`, which create
  generates server-side via `generateInviteCode()`).

**Build:** `npm run build` zielone (tsc -b + vite build, 6.47s, 2078 modules).

**Not done (pre-deploy / deploy day):**
- Balast cleanup — 8 abandoned/test drafts to delete before deploy. Listed
  in [[work/v2-deploy-plan#PD.2 — Balast cleanup (8 abandoned drafts)]].
- Final pre-deploy snapshot (`scripts/snapshot-characters.mjs --tag pre-v2`
  + `scripts/pg-dump-all.mjs --tag pre-v2-pgdump`).
- Edge function deploy (`npx supabase functions deploy admin player`).
- Frontend `git push` (auto-deploys via Vercel / Netlify).
- Smoke test endpoint matrix.

**Files touched (1 commit, +792 / -255 lines):**
- `src/components/admin/InviteCodeManager.tsx`
- `src/components/admin/CharacterList.tsx`
- `src/components/admin/edit/BasicInfoEditor.tsx`
- `src/components/player/PlayerDashboard.tsx`
- `src/types/invite.ts`

**Commit:** `e3e3a57`. **No git push** — deploy is the next session.

---

## 2026-04-27 — Wizard sub-session 2: routing rewrite, server-authoritative steps, store cleanup

**Focus:** end-to-end wire of v2.0 granular-commits flow ([[work/v2-deploy-plan]]
sub-session 2). After this commit the wizard runs against the new edge
function endpoints with the new step layout — what remains is admin/dashboard
polish (sub-session 3) and the actual deploy.

**Done:**

- **`src/components/wizard/WizardShell.tsx` rewrite** (+249/-60 net):
  - New 17-step layout: invite_code, identifier, characteristics, swap, age,
    edu, aging, luck, derived, occupation, occupation_skills, personal_skills,
    equipment, positions_contacts, backstory, basic_info, review.
  - `useEffect` auto-skips irrelevant hard-zone steps when `serverCharacter`
    signals `swap_available=false` / `eduImprovementChecks=0` /
    `physicalDeductionTotal=0`. Direction-aware (forward vs backward).
  - Loads `serverCharacter` on mount + every step transition (single GET via
    `playerGetCharacter`). Stored in characterStore.
  - Reroll widget in the header (visible on hard-zone steps when
    `rerolls_remaining > 0`); opens Polish confirmation panel listing what
    will be wiped, then calls `playerReroll` and routes back to
    StepCharacteristics.
  - Removed legacy abandon button + `handleAbandon` (replaced by reroll flow).

- **`src/components/wizard/StepCharacteristics.tsx` rewrite** (+200/-280 net):
  - Server-authoritative. Dice → `playerRollCharacteristics`; point_buy/direct
    → `playerEditCharacteristics`. Reads `characteristics_committed_at` from
    `serverCharacter` to gate edits.
  - Removed: `handleAbandon`, client-side `rollAll`, `characteristicsLocked`
    check, `characteristicSwap` perk section (separate StepSwap), `Wstecz`
    button (hard zone — back is via reroll only).

- **`src/components/wizard/StepAge.tsx` simplification** (+50/-90 net):
  - Drops `ageLocked` / `lockAge` state. Commits via `playerSetAge`, then
    advances. Luck UI removed (moved to dedicated StepLuck). `Wstecz` removed.

- **DELETED `src/components/wizard/StepAgeModifiers.tsx`** (-315 lines).
  Replaced by StepEduRolls + StepAgingPenalties (sub-session 1) + auto-skip
  logic in WizardShell.

- **`src/components/wizard/StepEduRolls.tsx` / `StepAgingPenalties.tsx`**:
  drop the legacy mirror calls (`setEduRolls` / `setAgeDeductions`).
  `serverCharacter` is the source of truth; `setServerCharacter` persists it.

- **`src/components/wizard/StepReview.tsx` dual-path submit**: if
  `serverDraftId` is set (granular flow), `playerSubmitCharacter` flips
  draft → submitted; otherwise falls back to legacy `useCharacterSubmit`
  for any pre-v2.0 entry path. Surfaces `granularError` separately.

- **`src/stores/characterStore.ts` cleanup** (+50/-65 net):
  - NEW: `serverCharacter` field + `setServerCharacter` setter (the
    server-authoritative snapshot wizard steps read).
  - REMOVED: `characteristicsLocked`, `ageLocked`, `ageModifiersLocked`,
    `characteristicSwap`, `ageDeductions`, `eduRolls`, `eduAfterRolls`
    (and matching setters `lockCharacteristics` / `lockAge` /
    `lockAgeModifiers` / `setAgeDeductions` / `setEduRolls`). Server commit
    timestamps replace them.
  - `loadForPlayerEdit` / `loadDraftForContinuation`: drop the lock fields,
    remap edit-mode entry steps to the new numbering (lore→14 backstory,
    standard→9 occupation, full→1 identifier). Resume from `char.draft_step`.
  - Persist version 9 → 10 with a migrate that strips stale local fields and
    resets `currentStep` to 0 (old step indexes are meaningless under the
    new layout — user re-validates the invite code, then WizardShell
    resumes from server `draft_step`).

- **`src/hooks/useDraftSync.ts` review**:
  - Strip hard-zone fields from the `/draft` payload (`characteristics`,
    `luck`, `age`, `era`, `method`, `perks`, `max_skill_value`) — those land
    via dedicated commit endpoints; PUT `/draft` would 400 on them after
    Etap B tightening.
  - Gate autosave on `currentStep >= 8` (StepDerived). Hard-zone steps own
    their persistence via their commit endpoints.

**Decisions:**

- **Hard-zone "Wstecz" buttons in sub-session 1 components** (StepSwap,
  StepEduRolls, StepAgingPenalties, StepLuck): left in place. Plan said
  "blocked at UI level", but in practice clicking lands on a previous
  hard-zone step that's already committed (renders read-only with only
  "Dalej" available). No state damage. Tightening to actually hide the
  buttons can land in sub-session 3 if we feel they confuse players.

- **Edit-mode entry step remap** for new wizard layout (was 1/5/10 → now
  1/9/14). full-edit still starts at identifier (idx 1), standard at
  occupation (idx 9), lore at backstory (idx 14). Verified against
  `getAllowedSteps` consumer in WizardShell — works since `allowedSteps`
  is just `[14, 15, 16]` / `[9..16]` / `[1..16]` analogue.

- **Persist version 10 migrate is destructive on currentStep**: any saved
  step pointing at the old numbering becomes step 0 (re-validate invite
  code). Acceptable: only Rafał has a real draft and he's submitted; the
  rest are balast pre-deploy.

- **Auto-skip is direction-aware**: WizardShell tracks `lastStepRef` so
  going *back* through a skipped step (e.g. via reroll → back-step) hops
  in the same direction.

- **StepReview legacy fallback retained**: easier than ripping
  `useCharacterSubmit` out today. Deletable in a follow-up after we're
  confident every entry path goes through StepIdentifier.

**Build:** `npm run build` zielone (tsc -b + vite build, 5.19s, 2078 modules).

**Not done (sub-session 3):**
- `InviteCodeManager.tsx` rewrite (full UI overhaul: label, status, rerolls,
  cleanup button, edit modal).
- `CharacterList.tsx` + `BasicInfoEditor.tsx` touches (code_label column,
  rerolls_left, distinguisher read-only).
- `PlayerDashboard.tsx` touches (assigned codes section, "Użyj kodu"
  routing, collapsible finished section, rerolls badge).
- Back-step modal for soft zone (currently `prevStep()` works without
  server-side wipe — fine because `playerGoBackToStep` isn't strictly
  required for soft moves, but a polished UX would call it explicitly).
- Hide hard-zone "Wstecz" buttons in StepSwap/EduRolls/AgingPenalties/Luck
  (low priority — currently harmless).

**Files touched (1 commit, +522 / -736 lines):**
- `src/components/wizard/WizardShell.tsx`
- `src/components/wizard/StepCharacteristics.tsx`
- `src/components/wizard/StepAge.tsx`
- `src/components/wizard/StepAgeModifiers.tsx` (DELETED)
- `src/components/wizard/StepEduRolls.tsx`
- `src/components/wizard/StepAgingPenalties.tsx`
- `src/components/wizard/StepReview.tsx`
- `src/stores/characterStore.ts`
- `src/hooks/useDraftSync.ts`

**Commit:** `e6a8fff`. **No git push** — gated on rest of v2.0 punch list.

---

## 2026-04-27 — Wizard sub-session 1 + skip-swap endpoint

**Focus:** first frontend sub-session of v2.0 deploy plan
([[work/v2-deploy-plan]] sub-session 1). Five new wizard step components
matching the new hard-zone endpoints + slim StepInviteCode + tiny
`/skip-swap` endpoint.

**Done:**

Edge function (`supabase/functions/player/index.ts`):
- NEW `POST /characters/:id/skip-swap` (+36 lines) — symmetric guards to
  `/swap-characteristics` (`swap_available && !swap_used &&
  characteristics_committed_at && !age_committed_at`); sets `swap_used=true`
  + `swap_committed_at=now()` without mutating `characteristics`. Polish
  error messages.

Client lib (`src/lib/player.ts`):
- NEW `playerSkipSwap(token, charId)` (+12 lines) — `POST /skip-swap`,
  no body, returns `CharacterData`.

Wizard components (`src/components/wizard/`):
- **`StepInviteCode.tsx`** — slimmed down (-56/+0 net cleanup): dropped
  method picker (moved to StepIdentifier). Kept code input, validation,
  URL-param auto-validate, resume logic, submitted-character display.
- **`StepIdentifier.tsx`** (NEW, ~155 lines) — distinguisher input
  (3-60 chars, live counter) + method radio (filtered to `inviteCode.methods`,
  auto-pick if single). Submit → `playerStartCharacter`, persists
  `serverDraftId` + `method` to store, mirrors distinguisher into existing
  `name` field for legacy consumers.
- **`StepSwap.tsx`** (NEW, ~205 lines) — perk-gated; on mount
  `playerGetCharacter` to read fresh `swap_available` / `swap_used`. Two
  selects, "Zamień" → `playerSwapCharacteristics`, "Pomiń zamianę"
  → `playerSkipSwap`. Defensive guard renders informational state if
  perk missing or already used.
- **`StepEduRolls.tsx`** (NEW, ~175 lines) — auto-rolls on mount via
  `playerRollEdu` if `!edu_committed_at`. Renders per-roll detail
  (`{roll, improved, gained, new_edu}` from server). Mirrors `edu_rolls` +
  final EDU into legacy store fields.
- **`StepAgingPenalties.tsx`** (NEW, ~225 lines) — `getAgeModifications(age)`
  drives `requiredTotal` + `allowedStats`. Manual deduction UI with
  +/- buttons, live sum + remaining counter, client validation via
  `validateDeductions`. Submit → `playerApplyAgingPenalties`. Auto-commits
  with `{}` payload when `requiredTotal === 0` (age 20-39).
- **`StepLuck.tsx`** (NEW, ~125 lines) — single "Rzuć szczęście" button
  → `playerRollLuck`. Young-Badacz note ("dwa rzuty, lepszy wynik").
  After commit: button disappears, only "Dalej" remains.

**Decisions:**

- **Skip-swap UX = dedicated endpoint** (chosen over `/set-age` 409 forcing
  or auto-set semantics). Cleaner UX (one explicit click "Pomiń zamianę"),
  ~30 lines in edge function, deploys atomically with the rest.
- **Nowe komponenty trzymają `CharacterData` w lokalnym useState** (po
  każdym endpoincie), mirror selected fields (`characteristics`, `luck`,
  `eduRolls`) do istniejących pól store dla kompatybilności wstecznej z
  legacy code (StepDerived, useDraftSync, useCharacterSubmit). Sub-session 2
  cleanup characterStore zastąpi to proper character object.
- **Defensive auth checks** — każdy step pokazuje "Musisz być zalogowany"
  jeśli `usePlayerStore().token === null`, zamiast crashować.
- **WizardShell nie tknięty** — komponenty są napisane i kompilują się, ale
  nie są jeszcze podłączone do flow. Routing rewrite to sub-session 2.

**Build:** `npm run build` zielone (tsc -b + vite build, 4.43s, 2074 modules).

**Verify:**
- `playerSkipSwap` wrapper exists ([src/lib/player.ts:197](src/lib/player.ts:197)).
- `/skip-swap` handler exists ([supabase/functions/player/index.ts:994](supabase/functions/player/index.ts:994)).
- Wszystkie 5 nowych plików istnieją w `src/components/wizard/`.

**Not done (sub-session 2):**
- WizardShell routing rewrite (kolejność stepów, conditional skips, resume).
- StepCharacteristics rewrite (rip `handleAbandon`, `rollAll`,
  `characteristicsLocked`).
- DELETE `StepAgeModifiers.tsx` (po podłączeniu nowych).
- characterStore cleanup (usuń locks, dorzuć server-synced character object).
- useDraftSync — narrative-only sync na post-submit.

**Files touched (1 commit, +1018 / -53 lines):**
- `supabase/functions/player/index.ts` (+36) — file now 1601 lines.
- `src/lib/player.ts` (+12) — file now 421 lines.
- `src/components/wizard/StepInviteCode.tsx` (-56 net cleanup).
- `src/components/wizard/Step{Identifier,Swap,EduRolls,AgingPenalties,Luck}.tsx` (NEW, +1067).

**Commit:** `e5043eb` — "Wizard sub-session 1: 5 new step components + slim
StepInviteCode + skip-swap". **No git push** — gated on rest of v2.0
punch list.

---

## 2026-04-27 — Edge functions rework + client lib (Etap A/B/C + types)

**Focus:** code-only sub-sessions of the granular-commits-v2 rework — write all
new player + admin endpoints and the matching typed client wrappers. Zero
deploys, zero pushes; everything local in git, prod still on edge function
v14/v13 from 2026-03-21.

**Done:**

Edge functions (`supabase/functions/{player,admin}/index.ts`) — 3 commits:

- **Etap A** (`3ac51b3`, +408 lines `player/index.ts`) — hard-zone server-authoritative endpoints:
  - REWRITE `POST /start-character` — body shrunk to `{ code, distinguisher, method }`. No auto-roll. Sets `swap_available` from `code.perks.includes('swap_characteristics')`. All 6 commit timestamps NULL on insert. 1-code-1-character enforced (partial unique idx + 409 pre-check).
  - REWRITE `POST /characters/:id/reroll` — full `HARD_ZONE_WIPE` (cech/wiek/luck/edu/aging/swap_used/narrative + downstream); rolls new chars only; atomic via `consume_reroll` + `append_reroll_history` RPCs.
  - NEW `POST /characters/:id/roll-characteristics` (dice only).
  - NEW `POST /characters/:id/swap-characteristics` (perk-gated, single-use, between chars-commit and age-commit).
  - NEW `POST /characters/:id/set-age` (forces swap decision via 409 if perk available + unused).
  - NEW `POST /characters/:id/roll-edu` — N improvement rolls per `getAgeModifications(age).eduImprovementChecks`; persists per-roll detail in `edu_rolls` JSONB.
  - NEW `POST /characters/:id/apply-aging-penalties` — validates total === `deductionPoints`, allowed stats per age (young: STR/SIZ; 40+: STR/CON/DEX), no stat below 1; auto-applies APP reduction (40+).
  - NEW `POST /characters/:id/roll-luck` — final hard-zone step, age-aware (young: max(2 rolls)).
  - Helpers added: `AGE_RANGES` + `getAgeRange` + `isYoungCharacter` + `getDeductibleStats` (Deno-side port of `src/data/ageRanges.ts` + `src/lib/ageModifiers.ts`); `HARD_ZONE_WIPE` constant.

- **Etap B** (`fb500cc`, +327 lines `player/index.ts`) — soft-zone + cross-cutting:
  - TIGHTEN `PUT /characters/:id/draft` — strict `DRAFT_ALLOWLIST` (occupation+, narrative, draft progression metadata, derived mirror). Anything else → 400.
  - NEW `POST /characters/:id/go-back-to-step` — soft back-step with per-step cascade wipe; preserves pre-occupation state and narrative; no token cost.
  - NEW `PUT /characters/:id/distinguisher` — anytime, also post-submit; uniqueness by partial unique idx from 018.
  - NEW `PUT /characters/:id/narrative` — anytime, also post-submit; allowlist = name/appearance/residence/birthplace/player_name/gender/backstory/portrait_*.
  - NEW `POST /characters/:id/submit` — flips draft → submitted; validates all hard-zone commits present for dice flow.

- **Etap C** (`53a2674`, +85 lines `admin/index.ts`) — admin pending-edits tightening:
  - TIGHTEN `POST /pending-edits/:id/approve` — `APPROVE_ALLOWLIST` covers narrative + soft-zone + distinguisher; mechanical pre-occupation fields (cech/wiek/luck/EDU/aging/swap and timestamps) blocked even for admin via this endpoint. Polish error message points at direct PUT `/characters/:id` as the explicit override path.

Client lib + types (`dffe4d2`, +342 lines):

- `src/types/character.ts` — added 8 new fields to `CharacterData` (rerolls_remaining, characteristics_committed_at, reroll_history, 5 timestamps, swap_*, edu_rolls). New types: `EduRoll`, `RerollHistoryEntry`, `SoftZoneStep`, `AgingDeductions`, `NarrativeFields`.
- `src/lib/player.ts` — 12 new typed wrappers (one per endpoint above) with shared `throwEdgeError()` helper for surfacing Polish error messages from edge function failure responses.
- `src/lib/admin.ts` — 3 new wrappers: `adminUpdateInviteCode` (PATCH /codes/:id), `adminCleanupCodes` (POST /codes/cleanup with optional dry_run), `adminGrantReroll` (POST /characters/:id/grant-reroll). Extended `adminCreateCode` signature with optional 018 fields.

**Decisions:**

- **Edge function wipe semantics for /reroll** — wipes narrative too (per user spec "wszystko co nastąpiło potem, łącznie z fabułą jest usuwane"). Preserves portrait fields (expensive to regenerate), distinguisher, identity (method/era/perks/max_skill_value/swap_available), reroll_history (appended), rerolls_remaining (decremented separately).
- **EDU young (15-19) handling** — `-5` baseline applied in `/roll-edu` before improvement rolls (per `applyAgeModifiers` semantics). 0 improvement rolls but timestamp still committed so the wizard can advance.
- **Swap forcing via /set-age 409** — explicit reject + Polish message, NOT auto-set `swap_used = true`. Requires player to make conscious decision (use or skip swap).
- **Edge function not deployed** — all changes utrwalone lokalnie. Deploy will happen in big-bang release with frontend (next sub-sessions: wizard rewrite). Justification: TIGHTEN of `/draft` will break old frontend on first request (legacy frontend writes characteristics through it).

**Not done (outstanding work for v2.0 deploy):**

Tracked in detail in `work/v2-deploy-plan.md` (this session). Summary:
1. Wizard rewrite — 5 new step components + WizardShell routing + StepCharacteristics rewrite + StepAgeModifiers deletion + StepEquipment reorder + StepInviteCode slim. Estimated 2-3 sub-sessions.
2. State store cleanup — remove `characteristicsLocked`/`ageLocked` from characterStore, narrative-only autosave in useDraftSync post-submit.
3. InviteCodeManager rewrite — full UI overhaul.
4. Small touchups — CharacterList, BasicInfoEditor, PlayerDashboard.
5. Balast cleanup — 8 abandoned/test drafts before deploy.
6. Big-bang deploy — supabase functions deploy + git push (auto-deploy frontend).
7. Smoke test each role.
8. Update specs (code_identity_rework_spec.md → status implemented).

**Files touched this session (5 commits, +1162 lines):**
- `supabase/functions/player/index.ts` — Etap A (+408) + Etap B (+327) = +735 net, file now 1565 lines.
- `supabase/functions/admin/index.ts` — Etap C (+85), file now 904 lines.
- `src/types/character.ts` (+64), `src/lib/player.ts` (+196), `src/lib/admin.ts` (+83).
- `docs/CoCCreator_obsidian/{DOCS_CHANGES_JOURNAL,memories/project,TASK_LIST}.md` — this update.
- `docs/CoCCreator_obsidian/work/v2-deploy-plan.md` (new — full execution plan).

---

## 2026-04-26 — Migration sequence applied to live DB (016/017/018/019)

**Focus:** apply all 4 pending migrations to production Supabase, prove zero data
damage on existing 31 characters, ensure Rafał's in-flight draft is fully
backfilled to "as if went through new flow" semantics.

**Done:**

Pre-flight checks (read-only, against live DB via direct Postgres pooler):
- 0 codes with >1 draft (TOCTOU index from 019 won't fail).
- 0 orphan drafts without invite_code_id.
- 0 new columns from 016/017/018/019 already present (clean state).
- 31 total / 9 drafts / 22 submitted (matches snapshots).
- `player_codes` table exists (016 trigger has its FK).
- `invite_codes.max_tries` exists (018 reroll_budget backfill has source).

Defensive backups taken (parallel admin-API JSON + full pgdump):
- `backups/2026-04-26-pre-migrations/` — admin-API snapshot (sha256 `c4b7bcfa…`, identical to safety baseline).
- `backups/2026-04-26-pre-migrations-pgdump/` — direct Postgres dump (gitignored — contains bcrypt password hashes and active share_tokens).
- `backups/2026-04-26-post-019-pgdump/` — post-migration pgdump (gitignored, sha256 `963a6b5e…`).

Migrations applied in transaction-with-rollback-on-error sequence:
- **016** (auto-assign player trigger) — applied; trigger + function present.
- **017** (sessions, distinguisher cols) — applied; both cols added with defaults.
- **018** (code identity Step 1a) — applied; 3 invite_codes cols + 3 characters cols + grant_reroll/consume_reroll RPCs. Backfill: 22/22 submitted got `characteristics_committed_at = created_at`; all 59 codes got `reroll_budget = max(0, max_tries - 1)`.
- **019** (granular commits) — first attempt rolled back on `jsonb @> text[]` operator mismatch (`perks` is JSONB, not TEXT[]); fix used JSONB literal. Retry succeeded. 8 new characters columns + `append_reroll_history` RPC + `idx_characters_one_per_code_active` partial unique index. Backfill: 22/22 submitted got 4 timestamps backfilled to `created_at`; 27 chars got `swap_available = true` from code perks.

Verify (`scripts/verify-characters-post-migration.mjs` against pre-migrations snapshot):
- 31/31 OK on all existing fields. Zero drift on characteristics, age, luck, equipment, occupation, backstory, contacts, positions, skills.
- Verify script extended: `NEW_019_FIELDS` allowlist now also includes 017/018 fields (sessions, distinguisher, characteristics_committed_at, rerolls_remaining, reroll_history); new `TRIVIAL_DRIFT_FIELDS` allowlist for `updated_at` (backfill UPDATEs bump it as expected side effect).

Rafał's draft (`7d54eec4`) post-migration check:
- Field-by-field comparison vs pre-migration snapshot: 0 issues (excluding `updated_at` and serialization-only `+00:00` vs `Z` on `created_at`).
- All 13 new fields backfilled correctly: `characteristics_committed_at`, `age_committed_at`, `edu_committed_at`, `aging_committed_at`, `luck_committed_at` all set to `created_at` (because his age + occupation are populated, the draft DO block conditions matched). `swap_available = false` (his code lacks perk), `swap_used = false`, `edu_rolls = []` (default — historic info unknown), `rerolls_remaining = 0` (his code had `max_tries = 1`).
- **No restore needed** — backfill captures him in full.

Supporting tooling (committed earlier this session):
- `scripts/pg-dump-all.mjs` (`a3ebc2e`) — full DB backup via direct Postgres connection (bypass Supabase CLI Docker dep). Discovers pooler URL from `supabase/.temp/pooler-url`. Disaster-recovery layer #3 (alongside the 2 admin-API snapshots).
- `.gitignore` updated: `backups/*-pgdump/` (contains credential material), `supabase/.temp/`.

**Decisions:**

- **Migration application order: option A** (per user) — keep 016/017/018/019 as separate files, apply sequentially. Cleaner audit, more rollback granularity than monolithic squash.
- **Each migration in single transaction with rollback-on-error** — if anything inside the BEGIN fails, schema stays untouched. This caught the JSONB operator bug in 019 with zero damage.
- **Rafał's draft is preserved automatically** — backfill DO block in 019 handles "in-flight drafts" gracefully (per-state conditional commits based on what's populated). User won't need to ask him to redo anything.
- **Submitted characters bit-exact preserved** — verify confirmed. No frontend impact: submitted chars render the same; new commit timestamp columns are extra metadata not used by old viewer.
- **Edge functions on prod still old (v14/v13 from 2026-03-21)** — they don't read the new columns, so the schema change is invisible to live users. Deliberate: defer edge function deploy until matching frontend exists (next sub-sessions).

**Files touched this session (1 commit beyond migrations):**
- `supabase/migrations/019_granular_commits.sql` (new — 88 lines, additive, with 3 backfill blocks).
- `scripts/verify-characters-post-migration.mjs` (extended allowlist + trivial drift handling).
- `scripts/pg-dump-all.mjs` (new — 401 lines).
- `backups/2026-04-26-{safety,pre-rework-commit,pre-migrations}/` — 3 admin-API JSON snapshots committed.
- `backups/2026-04-26-{pre-migrations-pgdump,post-019-pgdump}/` — 2 pg dumps, gitignored.
- `.gitignore`, `package.json`/`lock` (pg dep).

**Status:** schema and edge function code complete in repo for v2.0. Wizard rewrite + deploy next.

---

## 2026-04-26 — Feature 1 shipped: "Portret z cech" descriptive paragraphs

**Focus:** implement Plan A from the future-features plan — deterministic narrative paragraphs derived from character stats. Pure additive client-side rendering, zero DB / migration impact.

**Done:**
- Wrote `src/lib/characterDescriptions.ts` — per-stat threshold buckets keyed by `rollFormula` (3d6×5: ≤25/≤35/≥70/≥80; 2d6+6×5: ≤50/≤60/≥75/≥85). 32 paragraphs total: 8 stats × 4 categories. Average values (category 0) intentionally produce no entry.
- Wrote `src/components/shared/CharacterDescriptions.tsx` — presentational; renders `<section>` with `Portret z cech` header + `<ul>` of `[ABBREV] paragraph` lines. Returns `null` when no stat is in a tail bucket.
- Wired into `src/components/shared/CharacterSheet.tsx` between `Atrybuty pochodne` and `Umiejętności`. Single insertion point reaches both `admin/CharacterViewer` and `player/PlayerCharacterViewer` (both render via shared `CharacterSheet`).
- Build green: `npm run build` (tsc -b + vite build) compiled clean, no new TS errors.

**Decisions:**
- **Insertion point chosen: stat-area (post-derived, pre-skills).** Alternative was post-backstory; chose stat-area to keep the deterministic stat → narrative relationship visually adjacent.
- **Polish abbreviations corrected:** plan said BC/ZR; actual `CHARACTERISTIC_MAP` uses BUD/ZRĘ. Component uses canonical abbreviations from data.
- **No PDF integration.** Kept v1 web-only as specced — paragraphs are too long for the existing card layout.
- **No DB persistence.** Fully tranzytowe — derived from `character.characteristics` on render.

**Not done (v2 backlog from plan):**
- Random variants per slot (seed = character.id)
- Stat combinations (otyły / kolos / magnetyczny / etc.)
- Age / occupation context-aware text variants
- Editability (player can hide individual paragraphs)
- PDF rendering

**Files touched:**
- `src/lib/characterDescriptions.ts` (new)
- `src/components/shared/CharacterDescriptions.tsx` (new)
- `src/components/shared/CharacterSheet.tsx` (import + 1 component insert)

---

## 2026-04-26 — Future-features brainstorm + safety snapshot tooling

**Focus:** discuss next-cycle features (descriptive text from stats; Gemini API portraits) and harden the deploy path for migration 019 with a snapshot/verify tooling layer.

**Done:**
- Plan written at `~/.claude/plans/zacznijmy-od-f1-kr-tkie-deep-rivest.md` covering two streams: Plan A (Feature 1 — descriptive text per stat, 32 paragraphs, deterministic, no DB) and Plan B (snapshot+verify scripts before migration 019). Plan approved.
- Wrote `scripts/snapshot-characters.mjs` — fetches `/admin/characters`, `/admin/codes`, `/admin/pending-edits`, and per-character `/admin/characters/:id/history` and dumps to `backups/YYYY-MM-DD-<tag>/{characters,invite_codes,pending_edits,character_history}/*.json` plus `_manifest.json` with sha256 of stable-stringified payload. Refuses to overwrite existing snapshot dirs.
- Wrote `scripts/verify-characters-post-migration.mjs` — diffs a snapshot vs current DB. Hard-coded `NEW_019_FIELDS` allowlist (`swap_committed_at`, `age_committed_at`, `edu_committed_at`, `aging_committed_at`, `luck_committed_at`, `swap_available`, `swap_used`, `edu_rolls`). Non-NEW field changes → DRIFT (exit code 1). New fields with unexpected defaults / partial backfill → NEEDS_REVIEW. Writes `_verify_report.json` next to snapshot.
- **Took live safety snapshot:** `backups/2026-04-26-safety/` — payload sha256 `c4b7bcfabc6ba95da911b4eaf61bde37b6b771d936f530c94b1909183eca4b95`.
- Self-tested verify script on the fresh snapshot → 31/31 OK.

**Decisions:**
- **Plan A (Feature 1) defer to after Plan B + granular-commits-v2 ships.** Feature work waits for the rework cycle to finish.
- **Snapshot scope:** characters + invite_codes + pending_edits + per-character character_history. `share_tokens` not included (low value, externally invalidatable). `pg_dump` mentioned in plan as optional second backup, not implemented (Supabase dashboard backup covers it).
- **Backup commit policy:** files commitable to git (small, audit trail, closed-group repo). `.gitignore` already does NOT ignore `backups/`.
- **Password handling:** `ADMIN_PASSWORD` not added to `.env.local` — passed inline per invocation, same pattern as existing `list-drafts.mjs` / `submit-characters.mjs`.

**Reality-check on prior docs:**
- DB has **31 characters total (9 drafts, 22 submitted)** and **59 invite codes** — vault docs (project.md, journal 2026-04-22) said "~12–14 characters". Vault was tracking only the recently-touched ones, missed the bulk of historical submitted characters from earlier sessions. Updating `memories/project.md` accordingly.

**Open threads / next up:**
- Plan B operational steps remain pending **Rafał finishing `e1cd6edf`** before deploy of migration 019.
- Plan A (Feature 1 — descriptive text) implementation pending — deferred until rework cycle wraps.
- `TASK_LIST.md` updated with new pre-deploy checklist replacing the old 2-step one.

**Files touched:**
- `scripts/snapshot-characters.mjs` (new)
- `scripts/verify-characters-post-migration.mjs` (new)
- `backups/2026-04-26-safety/**` (new — 31 characters, 59 codes, 1 pending edit, 31 history files, manifest, verify report)
- `~/.claude/plans/zacznijmy-od-f1-kr-tkie-deep-rivest.md` (new — outside repo)
- `docs/CoCCreator_obsidian/{TASK_LIST,DOCS_CHANGES_JOURNAL,memories/project}.md`

---

## 2026-04-22 — Granular commits plan + Jakub M characters submitted

**Focus:** rework Step 1b scope after Q&A with user. User described target flow in full: per-step server-authoritative commits across the hard zone (identifier → characteristics → swap → age → EDU → aging → luck), soft back-step in the middle zone, narrative editable anytime. Scope grew beyond "fix 3 blockers" — decided on Plan option C (full plan to `~/.claude/plans/`, ready-to-execute, no prod changes until Rafał finishes).

**Done:**
- Q&A resolved open items 4–8 + follow-up A–E from code review + swap/aging sequencing questions.
- Verified current code model against planned flow via Explore agent: `CharacterData` has no `eduRolls` / `swap_used` / commit timestamps; `StepEquipment` bundles majątek+ekwipunek (OK per user — just reorder internally); narrative fields = all `backstory.*` + identity/portrait fields.
- Wrote `scripts/list-drafts.mjs` (admin edge function client, CRLF-safe .env parser, Authorization + X-Admin-Password headers).
- Wrote `scripts/submit-characters.mjs` (batch submit via PUT /characters/:id).
- **Submitted 3 characters of Jakub M**: Arthur Henry Corwin, Mortimer "Mort" Flannery, James "Jimmy" Harding. All were on draft_step=12 (review), needed admin push. Jakub can request unlock via pending-edits if he wants further changes.
- Inventoried remaining drafts: Rafał (`377fe97d…`) still on `e1cd6edf` step 10 (active); 8 abandoned/test drafts as balast for pre-deploy cleanup.
- Wrote full implementation plan at `~/.claude/plans/granular-commits-v2.md` — supersedes `sunny-puzzling-garden.md` and partially-implemented Step 1b. Covers: migration 019 (additive to 018) with 5 granular commit timestamps + swap state + edu_rolls + TOCTOU index + append_reroll_history RPC; 13 new/rewritten endpoints; two wipe scopes (FULL on reroll, SOFT on back-step); narrative allowlist; admin pending-edit allowlist; wizard split into 5 new steps; pre-deploy checklist; rollback + E2E test plan.

**Decisions:**
- **Plan option C** (write full plan, no prod work) — scope too large for ad-hoc coding; spec `code_identity_rework_spec.md` now outdated.
- **In-place rework, not greenfield** — schema delta is additive (~8 columns + 1 RPC + 1 index), not a fundamental redesign. Greenfield overhead not justified for closed-group app.
- **Narrative fields = full `backstory.*` + identity + portrait fields** — editable anytime including post-submit. Mechanical fields pre-occupation locked permanently; occupation-and-after unlockable by admin via pending-edits.
- **Swap is two commits** (roll, then separate swap decision) — player must see rolls before choosing swap targets.
- **Aging penalties as separate commit** — not bundled with `/roll-edu`.
- **Distinguisher editable anytime server-side**, even post-submit.
- **Cleanup `dry_run` default becomes `true`** — safer.
- **Admin pending-edit allowlist**: blocks characteristics/luck/age/edu/commit timestamps/rerolls_remaining/status/method/era/swap/invite_code_id/perks/max_skill_value. These are only reset via player reroll on draft.
- **Majątek + ekwipunek stay in one step** (StepEquipment) — just reorder internally so majątek is above.
- **Jakub M's drafts submitted without his explicit confirmation** — user decision, always unlockable via pending-edits if needed.

**Open threads / next up:**
- Plan execution is **gated on Rafał finishing `e1cd6edf`** on legacy system. Check via `node scripts/list-drafts.mjs` before starting.
- 6 open items flagged in plan to verify during implementation (portrait-on-reroll, max_tries deprecation timing, draft_locked_step removability, StepAgeModifiers deletion safety, empty-step auto-skip UX, one-code-one-character policy for re-use after submit).
- Future-features discussion moved to a separate conversation (cleaner context).

**Files touched:**
- `scripts/list-drafts.mjs` (new) — ops tool, in repo.
- `scripts/submit-characters.mjs` (new) — ops tool, in repo.
- `~/.claude/plans/granular-commits-v2.md` (new) — plan file, outside repo.
- `docs/CoCCreator_obsidian/TASK_LIST.md`, `DOCS_CHANGES_JOURNAL.md`, `memories/project.md` (this session end).

**DB state after session:**
- Jakub M: 3 submitted (Arthur, Mort, James).
- Rafał: 1 draft in progress (`e1cd6edf`, step 10).
- 8 abandoned/test drafts remain as pre-deploy cleanup targets.

---

## 2026-04-21 — Code identity rework: edge functions (Step 1b)

**Focus:** implement server side of the code-identity/characteristics rework — the part that actually fixes the reroll-on-refresh bug.

**Done:**
- Added to `supabase/functions/player/index.ts`:
  - Server-side dice helpers (`crypto.getRandomValues`-based; no `Math.random`).
  - `POST /start-character` — creates character with distinguisher, rolls characteristics server-side for dice method, seeds `rerolls_remaining` from code's `reroll_budget`, sets `characteristics_committed_at`.
  - `POST /characters/:id/reroll` — dice-only; validates budget via `consume_reroll` RPC, regenerates characteristics + luck, cascade-wipes downstream (`DOWNSTREAM_WIPE`), appends to `reroll_history`.
  - `POST /characters/:id/edit-characteristics` — non-dice; accepts new values, wipes downstream, logs `scope: 'manual_edit'`, no counter change.
  - Tightened `PUT /characters/:id/draft` — rejects `characteristics`/`luck` in payload when `characteristics_committed_at IS NOT NULL` (returns 409).
- Added to `supabase/functions/admin/index.ts`:
  - `PATCH /codes/:id` — edits label, reroll_budget, assignee, perks, max_skill_value, era, methods, is_active.
  - `POST /codes/cleanup` — deletes unused codes (no linked character). Dry-run mode via `{ dry_run: true }`.
  - `POST /characters/:id/grant-reroll` — admin increment via `grant_reroll` RPC.
  - `POST /codes` extended with `label`, `reroll_budget`, `assigned_player_id` fields.
- Created `scripts/cleanup_legacy_codes.sql` — one-shot pre-deploy cleanup with preview-first safety pattern.

**Decisions:**
- **Cleanup preserves codes linked to submitted characters.** Original user-suggested rule would have deleted them; FK `ON DELETE CASCADE` means the approved character would be destroyed alongside. Since user rule is "zatwierdzone postaci OK", only truly unused codes are deleted. If the user wants to drop finished codes later, we need a pre-step to sever the FK or migrate the character.
- **`crypto.getRandomValues` for rolls**, not `Math.random` — closes the abuse vector of predictable client-side rolls and defends against edge-function runtime quirks.
- **Downstream wipe preserves name/age/gender/appearance/residence/birthplace** — identity-bound fields stay. Plan marked these as open; defaulted to preserve.
- **`reroll_history` entry shape** — `{ at, scope: 'reroll' | 'manual_edit', previous_characteristics, previous_luck }`.

**Open threads / next up:**
- Step 2: client lib (`src/lib/player.ts`, `src/lib/admin.ts`) + types (`src/types/character.ts`, `src/types/inviteCode.ts`).
- Step 3–4: new `StepIdentifier` + `StepCharacteristics` rewrite.
- Step 5: `InviteCodeManager` rewrite with collapsible used/finished section + cleanup button.
- **Not deployed.** Waits for Rafał to finish his character on the legacy system.

**Files touched:**
- `supabase/functions/player/index.ts`
- `supabase/functions/admin/index.ts`
- `scripts/cleanup_legacy_codes.sql` (new)
- `docs/CoCCreator_obsidian/TASK_LIST.md`, `specs/code_identity_rework_spec.md` (UX decision: hide used codes behind click)

---

## 2026-04-21 — Obsidian vault bootstrap

**Focus:** introduce Obsidian vault methodology to the project before starting the new-version bug/feature push.

**Done:**
- Analyzed project and proposed vault structure (code + creative pipeline + TTRPG domain + ops workflow).
- Created `docs/CoCCreator_obsidian/` vault with: `CLAUDE.md` (root), `memories/project.md`, `TASK_LIST.md`, `STRATEGY_AND_TACTICS.md`, `TECHNOLOGY_MASTERMIND.md`, `DOMAIN_COC.md`, `PORTRAIT_PIPELINE.md`, `DESIGN.md`, `LOGGING_INSTRUCTIONS.md`, `DOCS_CHANGES_JOURNAL.md`, `work/Index.md`, and stub READMEs in `specs/`, `outputs/characters/`, `outputs/prompts/`.
- Rewrote repo-root `CLAUDE.md` to point at the vault (Session Start / Session End workflow + conventions). Previous portrait-generation content folded into [[PORTRAIT_PIPELINE]].
- Preserved legacy docs in place: `docs/RULES_MODIFICATIONS.md` (linked from [[DOMAIN_COC]]) and `docs/TASKLIST.md` (legacy completed-work log).

**Decisions:**
- Vault path: `docs/CoCCreator_obsidian/` (not `/vault/` or similar).
- No `bugs/` folder — all bugs live in [[TASK_LIST]].
- `outputs/` organized per-character (`outputs/characters/[id]/`), not per-asset-type.
- `DESIGN.md` kept as a separate file for UI/card layout — doesn't belong in `TECHNOLOGY_MASTERMIND`.
- `DOMAIN_COC.md` references but doesn't duplicate `docs/RULES_MODIFICATIONS.md`.
- English in docs, Polish in chat.

**Open threads / next up:**
- Populate [[TASK_LIST]] with the accumulated bug/feature list the user has in mind for the new version.
- Capture the user's planned **structural rework** for the new version as a spec in `specs/` once described.
- Fill `TECHNOLOGY_MASTERMIND` dependency list from `package.json`.

**Files touched:**
- `CLAUDE.md` (root) — rewritten.
- `docs/CoCCreator_obsidian/**` — created.

---

## 2026-04-21 — Spec migration from auto-memory

**Focus:** move prior feature specs out of user auto-memory into the vault `specs/` folder. Reconcile vault with actual project state.

**Done:**
- Created [[specs/wealth_v2_spec]] (status: implemented). Full v2 spec — tiers A–F, gap formula, star rating, presets, 3 catalogs.
- Created [[specs/portrait_app_feature_spec]] (status: implemented). Push/gallery/crop/feedback/status-dashboard. Verified against files: `PortraitStatusDashboard.tsx`, `PortraitFeedbackModal.tsx`, migration `010_portrait_feedback.sql`.
- Created [[specs/back_card_spec]] (status: implemented). Four sections (ekwipunek/dobytek/pozycja/kontakty) as separate line items.
- Updated [[specs/README]] index with implemented specs grouped separately from planned.
- Corrected [[STRATEGY_AND_TACTICS]] — original strategy doc assumed features in-progress; reality per 2026-03-18 roadmap memory + recent commits is that **all 9 roadmap features are shipped except downtime rules**. Updated current-version focus to reflect rework/stabilize/polish cycle.
- Corrected `memories/project.md` current-status section (same reconciliation). Expanded decisions log.

**Decisions:**
- Mark migrated specs as `status: implemented` rather than `done` — leaves door open if user reworks them in the new-version cycle.
- Keep migrated specs as historical reference + reality-check source for future rework, with explicit "verify against current code" callouts.

**Open threads / next up:**
- User will describe the structural rework scope and bug list — capture into `specs/` and [[TASK_LIST]].

**Files touched:**
- `docs/CoCCreator_obsidian/specs/{wealth_v2_spec,portrait_app_feature_spec,back_card_spec,README}.md`
- `docs/CoCCreator_obsidian/STRATEGY_AND_TACTICS.md`
- `docs/CoCCreator_obsidian/memories/project.md`
