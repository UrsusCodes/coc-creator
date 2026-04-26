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
