---
date: 2026-04-27
status: active
tags:
  - plan
  - v2
  - rework/granular-commits
---

# CoC Creator v2.0 — execution plan to deploy

Complete punch list from "everything currently in repo" to "v2.0 live on prod with smoke test passed". Every remaining task. Authored 2026-04-27 after backend (migrations + edge functions + client lib) finished local-only.

> [!warning] No `git push` until deploy day
> Frontend changes already committed (sessions, distinguisher, F1, new types, new client wrappers) reference endpoints + columns deployed only after this plan finishes. Pushing partial work breaks live app.

> [!info] What's done already
> Migrations 016/017/018/019 applied 2026-04-26 (verify 31/31 OK). Edge functions Etap A/B/C committed (`3ac51b3`, `fb500cc`, `53a2674`). Client lib + types committed (`dffe4d2`). Build green.
>
> **Sub-session 1 done 2026-04-27** (`e5043eb`): 5 new step components + slim StepInviteCode + `/skip-swap` endpoint + `playerSkipSwap` wrapper.
>
> **Sub-session 2 done 2026-04-27** (`e6a8fff`): WizardShell rewrite (17-step layout + conditional skips + reroll widget + serverCharacter loading); StepCharacteristics rewrite (server-authoritative); StepAge simplified; DELETED StepAgeModifiers; characterStore cleanup; useDraftSync gated to soft zone; StepReview dual-path submit.
>
> **Sub-session 3 done 2026-04-27** (`e3e3a57`): InviteCodeManager full rewrite (label/reroll_budget/lifecycle status filter/cleanup preview/in-place edit/+1 reroll); CharacterList gets code label + rerolls badges; BasicInfoEditor distinguisher → read-only; PlayerDashboard codes section + collapsible finished. **Full v2.0 frontend stack now committed locally — only deploy day remains.**

---

## Sub-session 1 — Wizard step components (5 new + 1 slim) ✅ DONE 2026-04-27

> [!success] Completed in commit `e5043eb`
> All 5 new step components + slim StepInviteCode + dedicated `/skip-swap`
> endpoint (decision: dedicated endpoint over `/set-age` 409 forcing) +
> `playerSkipSwap` wrapper. Build green. Components not yet routed —
> sub-session 2 will wire them into WizardShell.

Goal: write the 5 new step components matching the 5 new player endpoints, plus slim StepInviteCode. Each component is small (~80-150 lines) and isolated. Build green at end.

### Step 1.1 — `src/components/wizard/StepInviteCode.tsx` (slim)
- Drop the distinguisher field (moves to StepIdentifier).
- Drop the method picker (moves to StepIdentifier).
- Keep: code input + validation. On valid code, advance to `identifier` step.
- Resume logic: if a draft already exists for this code, route to `character.draft_step` instead.

### Step 1.2 — `src/components/wizard/StepIdentifier.tsx` (NEW, ~120 lines)
- Form fields: `distinguisher` (3-60 chars, with live counter), `method` (radio: dice/point_buy/direct, filtered to `code.methods`).
- On submit: `playerStartCharacter(token, { code, distinguisher, method })`.
- Show 409 errors inline (Polish: "Identyfikator zajęty…" / "Kod już ma postać…").
- On success: write character to store, advance to `characteristics`.

### Step 1.3 — `src/components/wizard/StepSwap.tsx` (NEW, ~100 lines)
- Mounted only if `character.swap_available && !character.swap_used` (WizardShell handles routing skip).
- UI: explain perk in Polish, two `<select>` dropdowns (from / to), "Zamień" button + "Pomiń zamianę" button.
- "Zamień" → `playerSwapCharacteristics(token, charId, { from, to })`.
- "Pomiń zamianę" — DECISION POINT (see TASK_LIST open items): either dedicated `/skip-swap` endpoint that sets `swap_used = true`, OR rely on `/set-age` 409 message and add a "Skip" link that bypasses StepSwap by routing forward (and hitting 409 then auto-handling). **Recommendation:** add dedicated client function `playerSkipSwap` that hits a small new endpoint to keep UX clean. Add to edge function in this sub-session.
- Re-render character preview with swap applied (optimistic from server response).

### Step 1.4 — `src/components/wizard/StepEduRolls.tsx` (NEW, ~100 lines)
- Extracted from StepAgeModifiers (current file blends EDU + aging).
- On mount, if `!character.edu_committed_at`, call `playerRollEdu(token, charId)`.
- Render the per-roll detail from `character.edu_rolls`: list of `{roll, improved, gained, new_edu}`. Highlight successes in green, fails in muted gray.
- Show pre/post EDU summary with delta.
- "Dalej" button advances when committed.
- If `requiredRolls = 0` (age 20-39 = 1 check, age 15-19 = 0): empty state with informational panel + auto-commit timestamp via the call.

### Step 1.5 — `src/components/wizard/StepAgingPenalties.tsx` (NEW, ~150 lines)
- Extracted from StepAgeModifiers.
- Compute `requiredTotal = getAgeModifications(age).deductionPoints` and `allowedStats = isYoung ? ['STR','SIZ'] : ['STR','CON','DEX']`.
- UI: number inputs per allowed stat with live sum + remaining counter. Disable "Zatwierdź" until sum matches requiredTotal.
- Validate client-side (block submit) but server is the authority — surface 400 errors.
- On submit: `playerApplyAgingPenalties(token, charId, deductions)`.
- If `deductionPoints = 0` (age 20-39): empty state + auto-commit by calling endpoint with `{}`.

### Step 1.6 — `src/components/wizard/StepLuck.tsx` (NEW, ~80 lines)
- Single-button flow. On mount, if `!character.luck_committed_at`, render "Rzuć szczęście" button.
- Click → `playerRollLuck(token, charId)`. Render result as big number with brief explanation (young chars: "Wziąłeś lepszy z dwóch rzutów").
- Then advance to `derived` step.

### Step 1.7 — Add `playerSkipSwap` (if chosen approach)
- Tiny edge function endpoint `POST /characters/:id/skip-swap` — sets `swap_used = true`, `swap_committed_at = now()`. Validates `swap_available && !swap_used && characteristics_committed_at && !age_committed_at`.
- Tiny client wrapper in `src/lib/player.ts`.
- This change touches `supabase/functions/player/index.ts` — counts as additional edge function diff for the eventual deploy.

### Build + commit
- `npm run build` green.
- One commit per step or one consolidated; either is fine. Suggested: one commit per step component for git log clarity.

---

## Sub-session 2 — WizardShell + StepCharacteristics rewrite + cleanup ✅ DONE 2026-04-27

> [!success] Completed in commit `e6a8fff`
> All 6 steps below landed except: back-step modal for soft zone (deferred
> to S3 — `prevStep()` works without server-side wipe, fine until polished),
> and "auto-skip empty steps" UX (handled both by WizardShell auto-advance
> and the per-component auto-roll/auto-commit fallback from S1, so the user
> never sees a blank step).

Goal: rewire wizard navigation around the new step IDs, make StepCharacteristics server-authoritative, remove all client-side locks. Build green + manual click-through smoke test in dev (npm run dev) end at end.

### Step 2.1 — `src/components/wizard/StepCharacteristics.tsx` rewrite
- Rip out: `handleAbandon`, client-side `rollAll`, `characteristicsLocked` flag reads.
- For dice method: button "Rzuć cechy" → `playerRollCharacteristics(token, charId)`. After response, render values from server. Show "Przerzuć" button only when `rerolls_remaining > 0` (calls `playerReroll`).
- For point_buy / direct method: keep manual-input UI, on submit call `playerEditCharacteristics(token, charId, characteristics)`.
- After commit (server returns `characteristics_committed_at`), the values are read-only here — further changes go through reroll or wizard back-step.

### Step 2.2 — `src/components/wizard/WizardShell.tsx` routing rewrite
- New step ID order constant:
  ```
  invite_code → identifier → characteristics → swap → age → edu_improvement →
  aging_penalties → luck → derived → occupation → occupation_skills →
  personal_skills → wealth_equipment → positions_contacts → backstory → review
  ```
- Conditional skips:
  - `swap` skipped if `!character.swap_available`.
  - `edu_improvement` skipped if `getAgeModifications(age).eduImprovementChecks === 0`.
  - `aging_penalties` skipped if `getAgeModifications(age).deductionPoints === 0`.
- Resume logic: on mount with existing character, navigate to `character.draft_step` (server-authoritative; falls back to last completed timestamp's step if `draft_step` not set).
- Reroll button: persistent footer-bar widget visible on every hard-zone step (characteristics through luck) when `rerolls_remaining > 0`. Disabled when 0. Click → confirmation modal ("Przerzut skasuje cechy, szczęście, wiek, rozwój EDU, obniżenia wiekowe ORAZ wszystko co wypełniłeś po cechach (zawód, umiejętności, ekwipunek, fabułę). Zostanie tylko identyfikator i kod. Na pewno?") → `playerReroll(token, charId)` → navigate to `characteristics`.
- Back button in soft zone: triggers `playerGoBackToStep(token, charId, targetStep)` after confirmation modal listing what will be wiped (per cascade).
- Back button in hard zone: blocked at UI level (only via reroll modal).

### Step 2.3 — DELETE `src/components/wizard/StepAgeModifiers.tsx`
- Pre-delete grep: `grep -rn "StepAgeModifiers" src/` — confirm only WizardShell imports it.
- Delete file. Remove import + step entry in WizardShell.

### Step 2.4 — `src/stores/characterStore.ts` cleanup
- Remove `characteristicsLocked`, `ageLocked`, `ageModifiersLocked` state and setters (server commit timestamps replace these).
- `eduRolls` becomes server-synced (read from `character.edu_rolls`, no local set during wizard except as optimistic mirror).
- Swap state from server (`swap_available`, `swap_used`).
- Search call sites — every removed setter has corresponding deletes in step components.

### Step 2.5 — `src/hooks/useDraftSync.ts` review
- Post-submit characters: only `narrative` field sync (via `playerUpdateNarrative`), not generic `playerSaveDraft`. Avoid 400s from /draft allowlist.
- Determine: is the hook used by the wizard at all (which only writes to draft chars), or by post-submit edit views? If both, branch on `character.status`.

### Step 2.6 — `src/components/wizard/StepEquipment.tsx` reorder
- No logic change. Render majątek section above ekwipunek section. Bundle stays one component.

### Build + dev smoke test
- `npm run build` green.
- `npm run dev`, log in as test player, walk through each step. Notice: still talking to OLD edge functions on prod — many endpoints will 404. **OK for this session** — we're verifying client compiles + step transitions work in mock mode. End-to-end smoke happens after edge function deploy.

---

## Sub-session 3 — Admin/Player UI touches + InviteCodeManager rewrite ✅ DONE 2026-04-27

> [!success] Completed in commit `e3e3a57`
> All 5 deliverables landed. StepEquipment reorder was already in place
> (verified during S2 prep; "Podział dobytku" already renders above
> "Ekwipunek").

Goal: complete remaining UI surface changes (admin code manager, dashboard, character list). Build green. Pre-deploy housekeeping.

### Step 3.1 — `src/components/admin/InviteCodeManager.tsx` rewrite
- **Form fields** (create + edit): code, label, assigned_player_id (dropdown), reroll_budget (number 0-10), perks (multi-select), max_skill_value (number 50-99), era (dropdown), methods (multi-select).
- **List columns**: code, label, assignee name, era, methods, reroll_budget, **status** (unused / started / finished — derived: no linked char = unused, linked draft = started, linked submitted = finished), **distinguisher** (from linked char), **rerolls_left** (from linked char), created date, perks, actions (edit / delete / grant +1 reroll).
- **Filter**: active (default — hides codes whose char is submitted), unused, started.
- **Collapsible "Kody zużyte/zakończone"** — hidden by default, click to expand. Shows submitted-char codes for archive view.
- **Cleanup button** at top: triggers `adminCleanupCodes(password, { dryRun: true })` → preview modal listing deletable codes → "Potwierdź usunięcie" → `adminCleanupCodes(password)`.
- **Edit modal**: opens in place, calls `adminUpdateInviteCode(password, codeId, data)`.
- **Grant reroll action**: button → `adminGrantReroll(password, charId, 1)` → re-fetch list to update rerolls_left column.

### Step 3.2 — `src/components/admin/CharacterList.tsx` touches
- Add "Etykieta kodu" column (from joined `invite_codes.label`).
- Add "Przerzuty" column (`rerolls_remaining`).
- Distinguisher already rendered (from 017 commit).

### Step 3.3 — `src/components/admin/edit/BasicInfoEditor.tsx` touches
- Make `distinguisher` read-only (player owns it). Remove input → display as `<div>` text. Add note: "Identyfikator jest własnością gracza i edytuje go on sam."

### Step 3.4 — `src/components/player/PlayerDashboard.tsx` touches
- Assigned codes section: columns label / status / distinguisher / rerolls_left.
- "Użyj kodu" action → navigate to `identifier` step (or resume at `draft_step` if a draft exists for this code).
- Collapsible "Zakończone postacie" hidden by default.
- Rerolls_left badge on draft cards.

### Step 3.5 — Verify no other components break
- Grep for any references to removed store flags (`characteristicsLocked`, `ageLocked`, `ageModifiersLocked`) in `src/components/`.
- Grep for `StepAgeModifiers` to confirm 0 references after deletion.
- `npm run build` green.

---

## Pre-deploy preparation

### PD.1 — Rafał + active drafts check
```bash
ADMIN_PASSWORD='keeperpass' node scripts/list-drafts.mjs
```
- Confirm `7d54eec4` (Rafał's current draft) is `submitted` OR user accepts wipe.
- Note `e1cd6edf` (Herbert West) is already submitted ✓ (gating from old TASK_LIST already cleared).
- If Rafał's draft is still active and we don't want to disturb him: **wait** before deploy.

### PD.2 — Balast cleanup (8 abandoned drafts)
List to delete (preserve `7d54eec4` if still active):
- `1d172a84` Superbase_trigger
- `cf2487f1` test
- `6fd1af43`, `a3f36e7a`, `0fdc9f5b` — Nowa postać unassigned
- `e3cc702f`, `7f610d4c` — Rafał step 1 abandoned (player_id 377fe97d)
- `785ff771` — Rafał step 5 unnamed (same player_id)

```sql
-- preview
SELECT id, name, status, draft_step, updated_at
FROM characters
WHERE id IN (
  '1d172a84-27dd-45f7-8a32-2069f4e4e8df',
  'cf2487f1-6050-44d0-8f0a-c286374d274d',
  '6fd1af43-950e-4d87-81de-ee056d300c42',
  'a3f36e7a-6b0b-4143-a61b-8b64a9fa3d5d',
  '0fdc9f5b-3c3a-44e0-8df5-096f04efeb23',
  'e3cc702f-d55f-4056-8885-667ee5453ae1',
  '7f610d4c-20ea-45e7-90f0-80448d58482a',
  '785ff771-4072-484f-b997-e2fa6ad0b72c'
);

-- delete (after preview matches expectations)
DELETE FROM characters WHERE id IN (...same list...);
```
Run via `scripts/pg-dump-all.mjs` connection (direct Postgres) or admin endpoint.

### PD.3 — Final pre-deploy snapshot (4 layers)
```bash
ADMIN_PASSWORD='keeperpass' node scripts/snapshot-characters.mjs --tag pre-v2
node scripts/pg-dump-all.mjs --tag pre-v2-pgdump
```
Both go to `backups/2026-XX-XX-{pre-v2,pre-v2-pgdump}/`. JSON snapshot committable to git; pgdump gitignored (credentials).

### PD.4 — Build + lint
```bash
npm run build
```
Must be green. No TS errors, no missing imports.

### PD.5 — Pre-deploy edge function smoke (against current prod)
Prod still serves v14/v13 — confirm baseline is healthy before we replace it:
```bash
# admin /characters → 200, count = 31
curl -s "https://okbrsoomtomexilxxsyd.supabase.co/functions/v1/admin/characters" \
  -H "X-Admin-Password: keeperpass" \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" | head -c 100
```

---

## Deploy day

### D.1 — Edge function deploy (player + admin)
```bash
npx supabase functions deploy admin --project-ref okbrsoomtomexilxxsyd
npx supabase functions deploy player --project-ref okbrsoomtomexilxxsyd
```
Wait for "Deployed function admin" / "Deployed function player". Verify:
```bash
npx supabase functions list --project-ref okbrsoomtomexilxxsyd
# admin should now be v15+, player v14+
```

### D.2 — Smoke test endpoint matrix (curl)
Run each against prod with a test code/character. Each row = one curl invocation. **Use a test code, NOT a real player's, to avoid polluting their data.**

| Endpoint | Method | Expected | Notes |
|---|---|---|---|
| `/me` | GET | 200 + player | sanity |
| `/codes` | GET | 200 + list | sanity |
| `/start-character` | POST | 200 + new draft | creates fresh char |
| `/roll-characteristics` | POST | 200 + chars + `characteristics_committed_at` | dice flow |
| `/swap-characteristics` | POST | 200 OR 403 (no perk) | depending on test code |
| `/set-age` | POST | 200 + age + timestamp | with age 30 |
| `/roll-edu` | POST | 200 + `edu_rolls` array | server-rolled |
| `/apply-aging-penalties` | POST | 200 OR 400 if mismatched | with valid deductions |
| `/roll-luck` | POST | 200 + luck | final hard zone |
| `/draft` (PUT, mechanical field) | PUT | 400 with rejected field name | tightening test |
| `/draft` (PUT, allowed field) | PUT | 200 | passes through |
| `/distinguisher` | PUT | 200 | anytime |
| `/narrative` | PUT | 200 | anytime |
| `/submit` | POST | 200 + status submitted | full chain |
| `/reroll` (post-submit) | POST | 400 | "Cannot reroll a submitted character" |
| admin `/codes` (POST with new fields) | POST | 200 + new code | label etc. |
| admin `/codes/:id` (PATCH) | PATCH | 200 | allowlist edit |
| admin `/codes/cleanup?dry_run=true` | POST | 200 + preview | safe |
| admin `/characters/:id/grant-reroll` | POST | 200 + new_remaining | RPC call |
| admin `/pending-edits/:id/approve` (with blocked field) | POST | 400 + Polish error | new tightening |

If anything 500s: check Supabase logs (`supabase functions logs admin/player`) and rollback (D.5).

### D.3 — Frontend push (auto-deploy)
```bash
# verify nothing weird in working tree
git status
git log --oneline origin/master..HEAD  # commits about to push

git push origin master
```
Wait for Vercel/Netlify deploy notification. Grab the new prod URL (or just refresh existing).

### D.4 — Frontend smoke test (manual, browser)
- **Admin role**:
  - Login as admin → ProgressList renders 31 chars with new columns.
  - Open Herbert West (submitted). All sections render. Try "Edytuj" — works. Save narrative change → goes through, character_history entry added.
  - Open InviteCodeManager. Create a new test code with label + reroll_budget=2. Edit it. Grant reroll on test char. Run cleanup (dry_run preview only first time).
- **Player role** (use test player):
  - Login → PlayerDashboard renders assigned codes with label/status.
  - "Użyj kodu" on a fresh test code → routes to identifier step.
  - Walk through full hard zone: identifier → characteristics → (swap if perk) → age → edu → aging → luck → derived. Each step commits server-side.
  - Walk through soft zone: occupation → skills → wealth+equipment → positions+contacts → backstory.
  - Submit. Status flips to `submitted`. View character — read-only mechanically, narrative still editable.
  - Try reroll mid-soft-zone. Confirmation modal lists everything wiped. Reroll → re-routes to characteristics step.
  - Try back-step in soft zone. Confirmation modal. Wipe goes through.

### D.5 — Rollback procedures (if smoke fails)

**Scenario: edge function bug (500 errors)**
- Re-deploy previous version: `git checkout <pre-rework-commit> supabase/functions/player/index.ts && npx supabase functions deploy player`
- Schema stays (additive — old code ignores new columns).

**Scenario: frontend broken**
- Vercel: revert via dashboard to previous deploy.
- Or: `git revert <push-commit>` and push (will need to push more in this case → take care).

**Scenario: data damage (verify post-deploy fails)**
- Restore from `backups/2026-XX-XX-pre-v2-pgdump/`. Procedure documented in `~/.claude/plans/zacznijmy-od-f1-kr-tkie-deep-rivest.md` "Restore procedury".
- Schema rollback unnecessary (additive).

### D.6 — Post-deploy verify
```bash
ADMIN_PASSWORD='keeperpass' node scripts/verify-characters-post-migration.mjs --snapshot backups/2026-XX-XX-pre-v2
node scripts/pg-dump-all.mjs --tag post-v2-pgdump
```
- All 22+ submitted chars (minus balast) → OK.
- Test char created during smoke test → NEW_SINCE_SNAPSHOT (expected).
- No DRIFT.

---

## Post-deploy tasks

### PT.1 — Update spec
- `docs/CoCCreator_obsidian/specs/code_identity_rework_spec.md` → frontmatter `status: implemented`. Add "Implementation notes" section listing any deviations from plan (e.g., `playerSkipSwap` if added).

### PT.2 — Player communication
Short Polish message to share with players (Discord / chat). Draft:
> Cześć, zaktualizowałem aplikację. Wasze postaci są nietknięte. Główne zmiany:
> - Tworzenie nowej postaci jest teraz krok-po-kroku (rzuty cech, wieku, EDU itp. zapisują się na serwerze, jak coś przerwiecie wracacie tam gdzie skończyliście).
> - Przerzut cech kasuje cały postęp — używajcie z głową, macie ograniczony budżet przerzutów per kod.
> - Identyfikator postaci (np. "Śledczy", "Kapitan") wpisujecie sami i możecie zmieniać kiedy chcecie.
> - Po zatwierdzeniu postaci możecie nadal edytować fabułę i identyfikator — mechanikę (cechy/wiek/luck) tylko admin po pending-edit.
> Jakby coś dziwnego — pingnijcie.

### PT.3 — Update DOCS_CHANGES_JOURNAL
- Append "2026-XX-XX — v2.0 deployed to production" entry: deploy timestamps, smoke test results, any rollback events.

### PT.4 — Migration 020 follow-up (deferred)
- Drop `invite_codes.max_tries` column (replaced by `reroll_budget`).
- Verify no edge function code reads it: `grep -rn "max_tries" supabase/functions/`.
- Write `supabase/migrations/020_drop_max_tries.sql`.

---

## Risk matrix

| Risk | Likelihood | Mitigation |
|---|---|---|
| Edge function deploy fails partway | Low | Each function deploys atomically; redeploy or rollback to v14/v13 |
| Frontend deploys before edge function | High if push goes first | **Always deploy edge functions first.** Vercel won't have issues serving old frontend during the brief window. |
| Rafał has new draft on deploy day | Medium | Check `list-drafts.mjs` morning of deploy. If active, message him to finish or accept reset before proceeding. |
| TOCTOU on /start-character with same code | Low | Partial unique idx from 019 enforces 1 active draft per code. |
| Backfill bug in 019 missed a draft case | Low (verified clean) | Re-run verify; admin PUT to fix individually if any drift. |
| Smoke test reveals unexpected 4xx | Medium | Don't push frontend until edge function smoke clean. Rollback edge functions if needed. |
| Player password cache issue | Low | bcrypt hashes unchanged; sessions JWT unchanged. |

---

## Decisions still open

1. ~~**Skip-swap UX** (sub-session 1) — dedicated `/skip-swap` endpoint vs `/set-age` 409 forcing?~~ **DECIDED 2026-04-27: dedicated endpoint.** Implemented in `e5043eb`.
2. **Auto-skip empty steps** (sub-session 2) — when `requiredRolls=0` or `deductionPoints=0`, auto-advance vs informational panel? **Default: informational panel + auto-commit on render** (player still sees what step did/didn't do). _Partially settled in sub-session 1: StepEduRolls auto-rolls on mount (server returns empty `edu_rolls` for age 15-19 / one roll for 20-39) and StepAgingPenalties auto-commits with empty `{}` payload when requiredTotal===0._
3. **Player communication channel** (post-deploy) — Discord? Direct message? GM session? **Decide post-D.4.**

---

## Estimated effort

- ~~Sub-session 1 (5 step components): 2-3 hours.~~ ✅ DONE 2026-04-27.
- ~~Sub-session 2 (WizardShell + StepCharacteristics + cleanup): 3-4 hours.~~ ✅ DONE 2026-04-27.
- ~~Sub-session 3 (UI touches): 2-3 hours.~~ ✅ DONE 2026-04-27.
- Pre-deploy + deploy day: **1-2 hours** (mostly waiting + clicking + verification).

Remaining: **deploy day only** (1-2 hours of focused work).
