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

## In progress — v2.0 deploy (granular commits rework)

> [!success] Backend complete
> All migrations applied to live DB (016/017/018/019). All edge function endpoints written and committed locally. Client lib + types written. Build green. **Frontend wizard rewrite + deploy remains.**
>
> Master plan with full execution steps: [[work/v2-deploy-plan]]

### Done (in repo, not yet deployed)

- [x] **Migration 016** (auto-assign player trigger) — applied 2026-04-26.
- [x] **Migration 017** (sessions + distinguisher cols) — applied 2026-04-26.
- [x] **Migration 018** (code identity Step 1a — invite_codes + characters cols + RPCs) — applied 2026-04-26.
- [x] **Migration 019** (granular commits — 5 commit timestamps + swap state + edu_rolls + TOCTOU index + append_reroll_history RPC + backfills) — applied 2026-04-26. 22/22 submitted backfilled, Rafał's draft fully backfilled.
- [x] **Player endpoints — Etap A** (`3ac51b3`): REWRITE /start-character (identifier only), REWRITE /reroll (full hard-zone wipe), NEW /roll-characteristics, /swap-characteristics, /set-age, /roll-edu, /apply-aging-penalties, /roll-luck. +408 lines.
- [x] **Player endpoints — Etap B** (`fb500cc`): TIGHTEN /draft (strict allowlist), NEW /go-back-to-step, /distinguisher, /narrative, /submit. +327 lines.
- [x] **Admin endpoint tightening — Etap C** (`53a2674`): /pending-edits/:id/approve allowlist (blocks mechanical pre-occupation fields). +85 lines.
- [x] **Client lib + types** (`dffe4d2`): 12 new player wrappers + 3 admin wrappers (grantReroll, updateInviteCode, cleanupCodes) + 5 new types (EduRoll, RerollHistoryEntry, SoftZoneStep, AgingDeductions, NarrativeFields) + 8 fields added to CharacterData. +342 lines. Build green.
- [x] **Wizard sub-session 1 — 5 new step components + slim StepInviteCode + /skip-swap** (`e5043eb`): NEW StepIdentifier, StepSwap, StepEduRolls, StepAgingPenalties, StepLuck (all server-authoritative, mirror updated fields into legacy store fields for compatibility); slimmed StepInviteCode (dropped method picker → moved to StepIdentifier); NEW edge endpoint `POST /skip-swap` + `playerSkipSwap` wrapper. +1018 lines. Build green.
- [x] **Wizard sub-session 2 — routing rewrite, server-authoritative steps, store cleanup** (`e6a8fff`): WizardShell rewrite (17-step layout + conditional skips swap/edu/aging + reroll widget + serverCharacter loading); StepCharacteristics rewrite (server-authoritative dice/point_buy/direct, no locks); StepAge simplified (drop ageLocked, use playerSetAge); DELETED StepAgeModifiers; characterStore cleanup (removed all locks + characteristicSwap/ageDeductions/eduRolls fields, persist v9→v10 migrate); useDraftSync gated to soft zone (currentStep≥8); StepReview dual-path submit (granular playerSubmitCharacter + legacy fallback). +522/-736 lines. Build green.

### Outstanding for v2.0 release

> [!warning] Critical: any push to origin auto-deploys frontend
> Frontend will reference endpoints (and types) that ONLY exist on prod once edge functions are also redeployed. Do not push partial work.

**Wizard rewrite (sub-session 1) — DONE 2026-04-27:**
- [x] ~~`StepIdentifier.tsx` (NEW)~~ — distinguisher (3-60 chars) + method radio → `playerStartCharacter`. Persists serverDraftId+method. Mirrors distinguisher into `name` for legacy code.
- [x] ~~`StepSwap.tsx` (NEW)~~ — perk-gated, two selects + "Zamień"/"Pomiń zamianę" → `playerSwapCharacteristics` or new `playerSkipSwap`. Defensive guards on `swap_available`/`swap_used`.
- [x] ~~`StepEduRolls.tsx` (NEW)~~ — auto-rolls on mount via `playerRollEdu`. Renders per-roll detail from `edu_rolls`.
- [x] ~~`StepAgingPenalties.tsx` (NEW)~~ — manual distribution UI with +/- buttons, client validation via `validateDeductions`. Auto-commits with `{}` when `requiredTotal === 0`. → `playerApplyAgingPenalties`.
- [x] ~~`StepLuck.tsx` (NEW)~~ — single "Rzuć szczęście" button → `playerRollLuck`. Young-Badacz note.
- [x] ~~`StepInviteCode.tsx` (slim)~~ — dropped method picker (moved to StepIdentifier). Kept code + validate + resume + submitted-display.
- [x] ~~Decision: skip-swap UX~~ → **dedicated `/skip-swap` endpoint** (cleaner UX, ~30 lines edge fn). NEW `POST /characters/:id/skip-swap` + `playerSkipSwap` wrapper.

**Wizard rewrite (sub-session 2) — DONE 2026-04-27:**
- [x] ~~`StepCharacteristics.tsx` rewrite~~ — server-authoritative. Dice/point_buy/direct paths. Removed handleAbandon, rollAll, characteristicsLocked. Reroll button moved to WizardShell footer.
- [x] ~~`WizardShell.tsx` routing~~ — 17-step layout with new hard-zone order. Conditional auto-skip via useEffect on serverCharacter (swap if !swap_available, edu/aging if mods.x===0). Resume from server `draft_step` via existing `loadDraftForContinuation` (now points at new step indexes). Reroll widget visible on hard zone. **Note: back-step confirmation modal for soft zone deferred to S3** — soft `prevStep()` works without server-side wipe, fine for now.
- [x] ~~DELETE `StepAgeModifiers.tsx`~~ — split into EduRolls + AgingPenalties (both already in S1).
- [x] ~~Cleanup `characterStore.ts`~~ — removed characteristicsLocked, ageLocked, ageModifiersLocked, characteristicSwap, ageDeductions, eduRolls, eduAfterRolls + setters. NEW serverCharacter field + setter. Persist v9→v10 with migrate that strips stale fields and resets currentStep.
- [x] ~~`useDraftSync.ts`~~ — gated to soft zone (currentStep≥8); strips hard-zone fields from /draft payload (characteristics/luck/age/era/method/perks/max_skill_value).

**Wizard rewrite (sub-session 3) + admin/UI touches:**
- [ ] **`StepEquipment.tsx` reorder** — majątek section above ekwipunek section (bundle stays, just internal order).
- [ ] **`InviteCodeManager.tsx` rewrite** — full overhaul. Form fields: label, assigned_player_id, reroll_budget, perks, max_skill_value, era, methods. List columns: code, label, assignee, era, methods, reroll_budget, status (unused/started/finished derived from linked char), distinguisher, rerolls_left, created, perks, actions. Filter (active default / unused / started). Collapsible "Kody zużyte/zakończone" hidden by default. Cleanup button → preview modal → `adminCleanupCodes(dryRun:true)` then `adminCleanupCodes()`.
- [ ] **`CharacterList.tsx` + `BasicInfoEditor.tsx`** — code_label column, rerolls_left, distinguisher read-only in admin (player owns it).
- [ ] **`PlayerDashboard.tsx`** — assigned codes section with label/status/distinguisher/rerolls_left columns. "Użyj kodu" → navigate to `identifier` step (or resume at `draft_step`). Collapsible "Zakończone postacie". Rerolls_left badge on draft cards.

**Pre-deploy cleanup:**
- [ ] **Rafał check** — `node scripts/list-drafts.mjs` → confirm `7d54eec4` is `submitted` OR user accepts wipe. (NB: `e1cd6edf` is already submitted — Herbert West.)
- [ ] **Balast cleanup** — 8 abandoned/test drafts to delete before deploy. List: `1d172a84` (Superbase_trigger), `cf2487f1` (test), `6fd1af43`/`a3f36e7a`/`0fdc9f5b` (Nowa postać unassigned), `e3cc702f`/`7f610d4c` (Rafał step 1 abandoned), `785ff771` (Rafał step 5 unnamed). Use `scripts/cleanup_legacy_codes.sql` (preview first, then delete) or new `scripts/cleanup-abandoned-drafts.mjs`.
- [ ] **Final pre-deploy snapshot** — `ADMIN_PASSWORD=… node scripts/snapshot-characters.mjs --tag pre-v2` + `node scripts/pg-dump-all.mjs --tag pre-v2-pgdump`.

**Deploy:**
- [ ] **Build verify** — `npm run build` green.
- [ ] **Edge functions deploy** — `npx supabase functions deploy admin player --project-ref okbrsoomtomexilxxsyd`. Verify v15+/v14+ in `npx supabase functions list`.
- [ ] **Smoke test edge functions** — curl each new endpoint with a test player token; expect 200/4xx as appropriate. Cataloged in [[work/v2-deploy-plan#smoke-test-endpoint-matrix]].
- [ ] **Frontend push** — `git push origin master`. Triggers Vercel/Netlify auto-deploy.
- [ ] **Frontend smoke test** — admin login OK, player login OK, view existing char OK, create new char end-to-end on test code.
- [ ] **Verify post-deploy** — pgdump again, diff vs pre-v2 baseline. New mechanical fields on test char only. No drift on production chars.

**Post-deploy:**
- [ ] **Update spec** — `docs/CoCCreator_obsidian/specs/code_identity_rework_spec.md` → frontmatter `status: implemented`, body diff vs plan v2 if any divergences.
- [ ] **Player communication** — write a short Polish message to share group: "system się zmienił, wasze postaci są nietknięte, drobne UI inaczej, dajcie znać jak coś". Optional but nice — players hit a re-rolled flow at next character creation.
- [ ] **Follow-up migration 020** (deferred) — drop `invite_codes.max_tries` once edge functions no longer read it. Confirm by grep `max_tries` in `supabase/functions/`.

### Open items to verify during execution

- [x] ~~Portrait fields on reroll — preserve or wipe?~~ → **preserve** (HARD_ZONE_WIPE in player edge function does not touch them).
- [ ] `draft_locked_step` removability with commit timestamps taking over — verify in WizardShell rewrite.
- [ ] `StepAgeModifiers.tsx` deletion — verify no other imports (single grep before delete).
- [ ] Empty-step auto-skip UX when `requiredRolls=0` (age 15-19) or `deductionPoints=0` (age 20-39) — auto-advance vs informational panel + skip button. Decide during sub-session 2.
- [x] ~~Re-use of submitted code for new character~~ → **no** (1:1 forever per spec; new character = new code).
- [ ] Swap step UX when player wants to skip — explicit "skip" button in StepSwap that auto-sets swap_used=true via dedicated endpoint, vs leaving it to /set-age 409. Decide during sub-session 1.

## Next up (prioritized)

_(after v2.0 ships, user will describe the next iteration)_

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
