---
date: 2026-04-21
status: active
tags:
  - tasks
  - backlog
---

# Task List

Active work, backlog, and known bugs for CoC Creator.

> [!note]
> Completed work from the previous iteration is preserved in `docs/TASKLIST.md` (legacy, read-only). New completions go into [[DOCS_CHANGES_JOURNAL]] with a date, then get checked off here.

## In progress — Granular commits rework (supersedes code identity rework)

> [!warning] Scope expanded
> Original spec `code_identity_rework_spec.md` was too narrow. After Q&A on 2026-04-22, the full flow is **per-step server-authoritative commits** across the hard zone, not just one characteristics commit. New plan lives at `~/.claude/plans/granular-commits-v2.md` (ready-to-execute). Spec in repo needs rewrite to match (deferred until plan lands).

**Deploy gated on:** Rafał finishing character `e1cd6edf` on legacy system. Check with `node scripts/list-drafts.mjs`.

- [x] **Step 1a** — Migration `018_code_identity_rework.sql` (schema + backfill + RPCs). #spec/code-identity
- [x] **Step 1b (partial)** — Edge function updates: `POST /player/start-character`, `POST /player/characters/:id/reroll`, `POST /player/characters/:id/edit-characteristics`, `PATCH /admin/codes/:id`, `POST /admin/characters/:id/grant-reroll`, `POST /admin/codes/cleanup`. Cleanup SQL at `scripts/cleanup_legacy_codes.sql`. **Note:** /start-character and /reroll will be rewritten in plan v2; they currently bundle too much into one commit.
- [ ] **Migration 019** — additive to 018: 5 granular commit timestamps (swap/age/edu/aging/luck), swap_available/used, edu_rolls JSONB, TOCTOU partial unique index, `append_reroll_history` RPC, backfill for submitted chars.
- [ ] **Player endpoints (rewrite + new)** — /start-character (identifier-only), /roll-characteristics, /swap-characteristics, /set-age, /roll-edu, /apply-aging-penalties, /roll-luck, /reroll (full-wipe), /go-back-to-step (soft-wipe), /distinguisher (anytime), /narrative (anytime), /submit. Tighten /draft with strict allowlist.
- [ ] **Admin endpoint tightening** — /pending-edits/:id/approve with allowlist (blocks mechanical pre-occupation fields).
- [ ] **Client lib + types** — `src/lib/{player,admin}.ts` gains one function per endpoint. `src/types/character.ts` adds commit timestamps + swap state + edu_rolls.
- [ ] **New wizard steps** — `StepIdentifier`, `StepSwap`, `StepEduRolls`, `StepAgingPenalties`, `StepLuck`. Delete `StepAgeModifiers` (split into EduRolls + AgingPenalties).
- [ ] **WizardShell routing** — new hard-zone step order, conditional skip, reroll button global, back-step confirmation modal.
- [ ] **`StepCharacteristics.tsx` rewrite** — server-authoritative, remove `handleAbandon`, `rollAll`, client locks.
- [ ] **`StepEquipment.tsx` reorder** — majątek section above ekwipunek section (bundle stays, just internal order).
- [ ] **`InviteCodeManager.tsx`** — new form fields, list columns, filter, edit modal, grant-reroll action, collapsible "zużyte/zakończone", cleanup button with preview modal.
- [ ] **`CharacterList.tsx` + `BasicInfoEditor.tsx`** — small touches (code-label column, distinguisher read-only in admin).
- [ ] **`PlayerDashboard.tsx`** — new columns, resume-by-character routing, collapsible "zakończone".
- [ ] **Cleanup code removal** — `handleAbandon`, `rollAll`, `characteristicsLocked`/`ageLocked` client flags, `StepAgeModifiers.tsx`, legacy "Kontynuuj/Zacznij od nowa" branching.

### Deploy-time cleanup (pre-v2 bundled deploy, one-shot)

> [!info] 2026-04-26 — safety snapshot already taken
> `backups/2026-04-26-safety/` (31 chars, 59 codes, sha256 `c4b7bcfa…`). This is the
> "no matter what" baseline — even if we don't re-run snapshot at deploy time,
> we can reconstruct any character from this dump.

Order at deploy time:

- [ ] **Rafał check** — `node scripts/list-drafts.mjs` → confirm `e1cd6edf` is `submitted`.
- [ ] **Snapshot pre-cleanup** — `ADMIN_PASSWORD=… node scripts/snapshot-characters.mjs --tag pre-cleanup`. Defends against accidental over-deletion in the next step.
- [ ] **Balast cleanup** — 8 abandoned/test drafts to delete before migration 019. List: `1d172a84` (Superbase_trigger), `cf2487f1` (test), `6fd1af43`/`a3f36e7a`/`0fdc9f5b` (Nowa postać unassigned), `e3cc702f`/`7f610d4c` (Rafał step 1 abandoned), `785ff771` (Rafał step 5 unnamed). Preserve `e1cd6edf` if still Rafał's active draft.
- [ ] **Snapshot pre-019** — `ADMIN_PASSWORD=… node scripts/snapshot-characters.mjs --tag pre-019`. This is the "source of truth" baseline for verify post-migration.
- [ ] **Pre-flight SQL** — `SELECT invite_code_id, count(*) FROM characters WHERE status='draft' GROUP BY 1 HAVING count(*)>1` must return 0.
- [ ] **DB backup** through Supabase dashboard (Settings → Database → Backups → Create backup) — third independent backup.
- [ ] **Cleanup SQL** — `scripts/cleanup_legacy_codes.sql`: preview SELECT first, then delete. #rework/cleanup
- [ ] **Apply migration 019.**
- [ ] **Verify** — `ADMIN_PASSWORD=… node scripts/verify-characters-post-migration.mjs --snapshot backups/YYYY-MM-DD-pre-019`. Submitted characters must come back as OK (mechanical fields bit-exact, NEW_019 fields backfilled). Drafts must be OK on non-NEW fields. Any DRIFT → halt and investigate.
- [ ] **Admin cleanup UI** — button in `InviteCodeManager.tsx` with preview modal, uses `POST /admin/codes/cleanup`. Retained for ongoing hygiene. #rework/cleanup

### Open items to verify during plan execution

- [ ] Portrait fields on reroll — preserve or wipe? (default: preserve)
- [ ] `max_tries` column drop timing — follow-up migration 020
- [ ] `draft_locked_step` removability with commit timestamps taking over
- [ ] `StepAgeModifiers.tsx` deletion — verify no other imports
- [ ] Empty-step auto-skip UX when `requiredRolls=0` or `requiredDeductions=0`
- [ ] Re-use of submitted code for new character — spec says 1:1 forever; confirm with user

## Next up (prioritized)

_(user will describe the next structural rework / bug cluster after this one lands)_

## Backlog

### Bugs
_(to be populated)_

### Features
_(to be populated)_

### Polish / UX
_(to be populated)_

## Parking lot (deprioritized / needs decision)

_(empty)_

## Recently completed

> [!info]
> Completions during the current new-version cycle. Older completions live in `docs/TASKLIST.md`.

- **2026-04-22** — Submitted Jakub M's 3 draft characters (Arthur Henry Corwin, Mortimer "Mort" Flannery, James "Jimmy" Harding) via batch admin script. All were on step 12 (review).
- **2026-04-22** — Plan v2 written at `~/.claude/plans/granular-commits-v2.md` — ready-to-execute when Rafał finishes.
- **2026-04-22** — Ops scripts added: `scripts/list-drafts.mjs`, `scripts/submit-characters.mjs`.
