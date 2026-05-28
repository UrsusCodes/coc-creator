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

## ✅ v2.0 LIVE + smoke-validated — granular commits rework deployed 2026-04-27, stabilized 2026-04-28

> [!success] v2.0 production status (as of 2026-04-28)
> Edge functions live: **admin v16, player v15** (post-hotfix versions).
> Frontend last commit `4c49b76`. DB: 23 chars (1 active draft = Rafał +
> 22 submitted). 8 hotfixes shipped 2026-04-28 after browser smoke
> uncovered them — all detail in
> [[DOCS_CHANGES_JOURNAL#2026-04-28 — v2.0 stabilization 8 hotfixes UX polish]].
>
> Deploy day journal: [[DOCS_CHANGES_JOURNAL#2026-04-27 — v2.0 deployed to production]].
>
> Tester account retained: login `tester` / pass `tester`, has 2 test
> codes (`GCC-4858-EUK`, `VNB-1251-VLP`) for future verification.

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
- [x] **Wizard sub-session 3 — admin + player UI for granular-commits** (`e3e3a57`): InviteCodeManager full rewrite (label/reroll_budget/assignee in form, lifecycle status filter, collapsible finished section, cleanup preview modal, in-place edit, +1 reroll action); CharacterList (code label + rerolls badges via parallel fetch+join); BasicInfoEditor (distinguisher → read-only with helper note); PlayerDashboard (codes section status/distinguisher/rerolls badges, "Kontynuuj" routing for in-flight drafts, collapsible finished characters, rerolls badge on draft cards); InviteCode/PlayerCode/PlayerCharacter types extended. +792/-255 lines. Build green.

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

**Wizard rewrite (sub-session 3) + admin/UI touches — DONE 2026-04-27:**
- [x] ~~`StepEquipment.tsx` reorder~~ — majątek section ("Podział dobytku") already above ekwipunek section in current code; no change needed (verified in S2 prep).
- [x] ~~`InviteCodeManager.tsx` rewrite~~ — full overhaul (form: label/methods/era/reroll_budget/perks/max_skill_value/assignee; list: lifecycle status/assignee/distinguisher/rerolls_left badges; filter chips active/unused/started; collapsible "Kody zużyte/zakończone"; cleanup button with preview modal; in-place edit; +1 reroll action).
- [x] ~~`CharacterList.tsx` + `BasicInfoEditor.tsx`~~ — code_label badge (parallel fetch+join), rerolls_remaining badge with sparkles icon. BasicInfoEditor: distinguisher read-only with helper note explaining player ownership.
- [x] ~~`PlayerDashboard.tsx`~~ — codes section shows label/status/distinguisher/rerolls badges; "Użyj kodu" routes to "Kontynuuj" via `handleContinueDraft` when an in-flight draft exists for the code; characters split into drafts (always visible) + collapsible "Zakończone postacie"; rerolls_left badge on draft cards.

**Pre-deploy cleanup — DONE 2026-04-27:**
- [x] ~~Rafał check~~ — `7d54eec4` confirmed at draft_step 10 (active in v1 numbering = StepBackstory). draft_step migrated 10 → 14 to land on StepBackstory in v2 layout.
- [x] ~~Balast cleanup~~ — 8 abandoned/test drafts deleted via admin `DELETE /characters/:id` (all HTTP 200).
- [x] ~~Final pre-deploy snapshot~~ — `backups/2026-04-27-pre-v2/` (sha256 `56db2b85…`) + `backups/2026-04-27-pre-v2-pgdump/` (sha256 `963a6b5e…`, gitignored). Plus post-cleanup `backups/2026-04-27-pre-v2-deploy/` (sha256 `4a83e90e…`) used as verify baseline.

**Deploy — DONE 2026-04-27:**
- [x] ~~Build verify~~ — `npm run build` green throughout S1/S2/S3.
- [x] ~~Edge functions deploy~~ — `admin` v15 (2026-04-27 19:29:14 UTC), `player` v14 (2026-04-27 19:29:31 UTC).
- [x] ~~Smoke test edge functions~~ — admin auth gate + 5 endpointów; player auth + all 6 NEW endpoints (skip-swap, roll-characteristics, set-age, roll-edu, roll-luck, submit) returned 401 without token = routes loaded.
- [x] ~~Frontend push~~ — `git push origin master` (24 commits `68a9bcb..f6c447e`), GH Pages auto-deploy. Note: remote shows "moved" to `UrsusCodes/coc-creator` — informational, push works fine.
- [ ] **Frontend browser smoke test** (USER) — admin login → InviteCodeManager + char list; Rafał login → "Kontynuuj" lands on StepBackstory.
- [x] ~~Verify post-deploy~~ — `verify-characters-post-migration.mjs --snapshot backups/2026-04-27-pre-v2-deploy` → 23/23 OK. Snapshot post-v2-deploy identyczny payload sha256 (zero drift).

**Post-deploy:**
- [ ] **Update spec** — `docs/CoCCreator_obsidian/specs/code_identity_rework_spec.md` → frontmatter `status: implemented`, body diff vs plan v2 if any divergences.
- [ ] **Player communication** — write a short Polish message to share group. Draft in [[work/v2-deploy-plan#PT.2 — Player communication]]. Optional but nice.
- [ ] **Follow-up migration 020** (deferred) — drop `invite_codes.max_tries` once edge functions no longer read it. Confirm by grep `max_tries` in `supabase/functions/`.
- [ ] **Hard-zone "Wstecz" buttons in S1 stepy** (StepSwap/StepEduRolls/StepAgingPenalties/StepLuck) — currently land harmlessly on a committed previous step that renders read-only. Hide them per plan, optional polish.
- [ ] **Soft-zone back-step modal** — wire `playerGoBackToStep` server-side wipe to `prevStep()` in soft zone, plus confirmation modal listing what gets wiped. Currently `prevStep()` just navigates without server wipe.
- [ ] **Distinguisher backfill** — 22 submitted chars have empty distinguisher. Plan was "leave empty, players fill via /distinguisher". Could backfill `LEFT(SPLIT_PART(name,' ',1), 60)` as a one-shot if it becomes annoying.
- [ ] **Repo remote URL** — `git remote set-url origin https://github.com/UrsusCodes/coc-creator.git` to silence the "repository moved" warning on every push.

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

### Hardening (pre-akta-kasandry coexistence)

> [!note] Context
> 2026-05-19 — auditing the shared-Supabase decision uncovered two
> pre-existing RLS gaps that are harmless today (only service-role edge
> functions touch them) but become exploitable once `auth.users` is populated
> by Akta Kasandry. See [[TECHNOLOGY_MASTERMIND#Shared Supabase project with akta-kasandry]].

- [ ] **Enable RLS on `public.portrait_feedback`** — migration `010_portrait_feedback.sql` created the table without `ENABLE ROW LEVEL SECURITY`. Default GRANTs let `anon`/`authenticated` read+write directly via the anon key. Add a `service_role`-only policy to match the pattern in `005`/`006`/`012`. Low priority — there is no `authenticated` role in use today; bumps to medium priority the moment Akta Kasandry ships and starts creating `auth.users` rows.
- [ ] **Enable RLS on `public.portrait_generations`** — same gap, migration `020`. Same fix and same priority tier as above. This table holds rate-limit counters; spam writes from a wiki user would skew per-player limits.

These two are the **only** coc-creator changes needed for Akta Kasandry to coexist safely. Everything else is already isolation-clean (verified 2026-05-19).

> [!info] Integration surface registered 2026-05-20
> Akta-kasandry's plan landed. They depend on `public.characters` anon SELECT (their `/admin/import-characters` flow snapshots whole rows into `wiki.imported_characters.data`). Documented as a coordinated integration surface in [[INTEGRATIONS]]. Practical impact on this TASK_LIST: **before any future task that tightens `anon_read_characters`, renames/drops columns on `public.characters`, or restricts the `portraits` bucket, ping akta-kasandry side first.** That's not a task — it's a constraint on future tasks.

## Parking lot (deprioritized / needs decision)

_(empty)_

## Recently completed

> [!info]
> Completions during the current new-version cycle. Older completions live in `docs/TASKLIST.md`.

- **2026-05-28** — **Front B (BUG-064 + BUG-067 + BUG-049) — 4 commits local, awaiting push.** CONSTANTA-1 managed two workers under Path B:
  - WORKER #B1 (`7d7ffa0`, `8685270`) — committed residence/birthplace integration (admin BasicInfoEditor + on-screen CharacterSheet display). 80% of integration was already wired in earlier sessions; only the UI surfaces remained.
  - WORKER #B2 (`da9229e`, `ed68966`) — migration 023 (backfills 8 legacy `Przeciętny`/`Zamożny`/`Biedny` rows to canonical `$N` + adds CHECK constraint), new shared helper `src/lib/spendingLevel.ts`, 5 callsites unified, server-side `/draft` validation. Closes BUG-049 (em-dash final fallback).
  - Note: BUG-014 (briefing claim that APPROVE_ALLOWLIST missed residence/birthplace) was already fixed in `53a2674` (Etap C). No further action.
  - Specs: [[specs/birthplace_residence_integration]] + [[specs/spending_level_normalization]].
  - Recon: [[work/2026-05-28-front-b-recon]].
  - Status: build green, no `git push`, migration NOT yet applied to live DB. Open in [[operations/COMMAND_LOG#Front B]].
- **2026-04-22** — Submitted Jakub M's 3 draft characters (Arthur Henry Corwin, Mortimer "Mort" Flannery, James "Jimmy" Harding) via batch admin script. All were on step 12 (review).
- **2026-04-22** — Plan v2 written at `~/.claude/plans/granular-commits-v2.md` — ready-to-execute when Rafał finishes.
- **2026-04-22** — Ops scripts added: `scripts/list-drafts.mjs`, `scripts/submit-characters.mjs`.
