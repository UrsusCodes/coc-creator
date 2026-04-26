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
