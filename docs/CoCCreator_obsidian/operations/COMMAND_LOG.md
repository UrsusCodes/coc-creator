---
date: 2026-05-28
status: active
tags:
  - operations
  - command-log
  - meta
---

# Command Log

Chronological log of strategic decisions, command-chain handovers, and active fronts in the CoC Creator bug-fix campaign.

> [!info] Why this file exists
> CoC Creator entered an extended bug-fix campaign on 2026-05-28 after a deep parallel code review surfaced ~72 unique findings (see this conversation's consolidated report; will be persisted to `BUG_MAP.md` once first fronts return). The user (Pawel) adopted a command-chain operating model: GENERAL (strategy), MANAGER (multi-step coordination), WORKERS (one-shot fixes). This file is the authoritative state-of-operations.

## Command chain (current)

| Role | Identity | Activated | Status |
|---|---|---|---|
| **GENERAL** | BONAPARTE-1 | 2026-05-28 | active |
| **MANAGER (Front B)** | CONSTANTA-1 | 2026-05-28 | brief issued, pending session start |
| **WORKERS** | (one-shot) | per dispatch | — |

## Operating protocol

- **GENERAL**: strategy, evaluation, conversation with user. Writes no code. Issues *briefs* (prompts for new Claude Code sessions) to workers or managers.
- **MANAGER**: domain owner for multi-step work. Writes worker briefs, syncs with user on design decisions, QAs worker output, reports to GENERAL.
- **WORKER**: one-shot. Self-contained prompt → focused fix → commit (no push) → report back. No persistent memory.
- **Commits**: workers commit locally. **NO `git push`** without GENERAL approval — push auto-deploys to GitHub Pages (per CLAUDE.md).
- **Handover (context budget)**: when GENERAL's or MANAGER's context fills, they hand off to a numbered successor (BONAPARTE-2, CONSTANTA-2, …) with a handover brief.
- **Communication language**: user-facing chat in **Polish** (per CLAUDE.md); internal docs (vault, briefs, code, commits) in **English**.

## Active fronts

### Front A — Wizard hard-zone unblock (CRITICAL)
- **Owner**: WORKER #1 (single-shot)
- **Bugs**: BUG-004 (WizardShell auto-skip out-of-bounds), BUG-062 (direct method blocks progression), BUG-063 (aging-penalties post-backstep lock)
- **Started**: 2026-05-28
- **Status**: ✅ **Completed 2026-05-28** — three commits local, build green, awaiting GENERAL push decision
- **Commits**: `5465ec4` BUG-004 (clamp), `7c141f0` BUG-062 (userTouchedRef pattern), `139e20b` BUG-063 (committed branch in 40+ path)
- **Root causes confirmed**:
  - BUG-004 — pure defensive (skip loop currently only fires for STEP_SWAP, but unbounded `target` would crash).
  - BUG-062 — typing-before-GET race: WizardShell refetch on currentStep change brought back `characteristics: {}` after user started typing; useEffect wiped local state. Fixed via `userTouchedRef` pattern (lifted from StepIdentifier).
  - BUG-063 — StepAgingPenalties had inline `if (committed) nextStep()` only on the `requiredTotal === 0` path; 40+ path always rendered the deduction UI regardless of `aging_committed_at`. Added early `if (committed)` branch with read-only summary.
- **Bonus**: WORKER #1 confirmed StepEduRolls + StepLuck already handle backstep correctly; StepCharacteristics + StepAge have own isCommitted renders. Three additional findings flagged for GENERAL (see decision log).
- **Why packet**: all three touch `WizardShell.tsx` + `Step*.tsx` server-authoritative flow. Same mental model, same browser smoke test.

### Front B — Data integrity: residence/birthplace + spending_level (HIGH)
- **Owner**: MANAGER CONSTANTA-1
- **Bugs**: BUG-014 (admin allowlist — already fixed in `53a2674`; briefing outdated, no further action), BUG-064 (residence/birthplace integration), BUG-067 (spending_level inconsistent — Path B), absorbs BUG-049
- **Started**: 2026-05-28
- **Status**: ✅ **Completed 2026-05-28** — 4 commits local on master, build green at each step, awaiting GENERAL sign-off for bundled push with Front A (Front A 3 + Front B 4 = 7 commits total local since `88a72be`)
- **Commits**:
  - `7d7ffa0` BUG-064: feat(admin-edit): expose residence + birthplace inputs (WORKER #B1)
  - `8685270` BUG-064: feat(sheet): display residence + birthplace on-screen preview (WORKER #B1)
  - `da9229e` BUG-067: chore(db): migration 023 — normalize spending_level + CHECK constraint (WORKER #B2)
  - `ed68966` BUG-067 + BUG-049: fix(wealth): unify spending_level rendering + server validation (WORKER #B2)
- **Specs (signed off)**: [[../specs/birthplace_residence_integration]] + [[../specs/spending_level_normalization]]
- **Recon**: [[../work/2026-05-28-front-b-recon]]
- **Deploy gating**: migration 023 NOT yet applied to live DB — admin (`npx supabase db push` or equivalent) must run BEFORE frontend push, otherwise CHECK constraint missing on prod. Helper code path still safe without it (legacy-label fallback retained).
- **Format flip note for GENERAL/Pawel**: `exportCardPdf.ts` previously emitted `25$` post-symbol; now `$25` pre-symbol per decision D6. Visible change in the front PDF.
- **Why manager**: required DB research, design decisions (Path A vs Path B), spec drafting, multi-file refactor across edge-fn + UI + maps. Classic manager case.

### Front C — Pending (strategic decisions required from user)
- **BUG-065** — mobile / responsive audit. Awaiting decision: standalone audit vs fold into admin redesign.
- **BUG-066** — admin panel redesign. Awaiting brainstorm session with user; will spawn its own spec.

## Decision log

- **2026-05-28** — Operations vault location: confirmed `docs/CoCCreator_obsidian/operations/` for command-chain artefacts (Pawel approved).
- **2026-05-28** — No-push policy: workers commit locally; GENERAL approves push (Pawel approved).
- **2026-05-28** — Granularity: packet model (3–5 similar bugs) for MEDIUM/LOW; single-bug-with-smoke-test for CRITICAL/HIGH (BONAPARTE-1 doctrine, ratified).
- **2026-05-28** — Bug map: full ~72-item surface lives in this conversation thread until persisted to `BUG_MAP.md`. To be created after Fronts A+B return (so we can compress with hindsight).
- **2026-05-28** — Front B specs sign-off (Pawel via BONAPARTE-1):
  - **D1** ACCEPT — commit local diff as-is (BasicInfoEditor + CharacterSheet)
  - **D2** ACCEPT — no backfill for 16 empty residence/birthplace strings
  - **D3** ACCEPT — wizard fields stay optional
  - **D4** ACCEPT — defer death_place to separate task
  - **D5 Path B** — migration + DB CHECK constraint (BONAPARTE-1 recommended over CONSTANTA-1's Path A, ratified by Pawel). Reason: akta-kasandry contract risk + recurrence pattern (BUG-067 already returned after 2 hotfixes). 8 rows is trivial backfill volume.
  - **D6** $7 (BONAPARTE-1 read from ambiguous bullet — needs CONSTANTA-1 confirm before B2 ships)
  - **D7** ACCEPT — '—' em-dash as final fallback
  - **D8** per Path B → ADD validation in /draft endpoint (defensive; reject non-canonical spending_level)
- **2026-05-28** — Front A WORKER #1 report accepted by BONAPARTE-1. Three new findings raised by worker during fix:
  - **BUG-073** (NEW, MEDIUM) — `/edit-characteristics` doesn't extend wipe to downstream `*_committed_at` (age/edu/aging/luck). Re-committing characteristics via reroll path could leave new chars + stale edu_rolls. UI currently gates this, but reroll path exposes it.
  - **BUG-074** (NEW, LOW — class-of-bug) — typing-before-GET race pattern repeats across hard-zone Step* components. WORKER #1's `userTouchedRef` fix is local to StepCharacteristics; the pattern should be reviewed in other Steps. Worth a sweep in a future iteration if the bug recurs.
  - **BUG-007 confirmed in-the-wild** — StepLuck.handleRoll only updates `store.setLuck`, not `store.setServerCharacter(updated)`. Downstream gating in StepDerived doesn't read `luck_committed_at`, so impact bounded today; consistency-only fix. Priority **downgraded** from HIGH (review estimate) to LOW (post-investigation).
- **2026-05-28** — Front B CONSTANTA-1 closing report accepted by BONAPARTE-1. Outcomes:
  - **BUG-014 DROPPED** from BUG_MAP — already fixed in `53a2674` (Etap C, 2026-04-27). Briefing was outdated; no action required.
  - **BUG-074 expanded** — class-of-bug now includes the render-side normalizer pattern. Originally typing-vs-GET race (WORKER #1 finding); now also covers `cash` field (legacy `"Gotówka: X $ | Dobytek: …"` vs modern `$X`) and other duplicated normalizers across renderers. Future sweep should target consolidation analogous to `src/lib/spendingLevel.ts`.
  - **Format flip side-effect noted** — PDF front card was `25$` (post-symbol), now `$25` (pre-symbol) per D6. Visible to anyone re-generating PDFs of legacy chars. Acceptable per D6 sign-off, but worth a one-line player heads-up if Pawel sends a comms message after deploy.
- **2026-05-28** — Database safety priority asserted by Pawel; BONAPARTE-1 took ownership of pre-flight backups before any further operation:
  - **L1 (in-repo pg_dump)** ✅ `backups/2026-05-28-pre-mig023-pgdump/` — 10 tables, 224 rows, payload sha256 `eea2be2a22c5f1f5345a37b715bb6bd6bb45e24341fab06a790763fab1f9172d`. Schema.sql + per-table JSON + manifest.
  - **L2 (admin-projected JSON)** ⏭ skipped — script requires `ADMIN_PASSWORD` (per project convention not in `.env.local`); L1 already captures all 10 public-schema tables in full. L2 was a redundant safety layer for migration 019's complex reconstruction. Migration 023 is 3 trivial UPDATEs + a CHECK; L1 fully covers rollback needs.
  - **L3 (offsite copy)** ✅ `C:\Users\Pawel\coc-creator-backup\2026-05-28-pre-mig023-pgdump\` — `diff -r` exit 0 vs L1, sha256 of characters.json identical. Lives outside the repo so a repo/disk disaster doesn't take both.
  - **Fresh inventory** (re-run from live DB 2026-05-28T19:28 UTC) — 40 chars total (DB grew +17 since 2026-04-27 baseline of 23). `spending_level` distribution: `(empty)`×15, `$7`×8, `Przeciętny`×6, `(null)`×5, `$25`×4, `Zamożny`×1, `Biedny`×1. **Migration 023 will affect exactly 8 rows** (6+1+1) — matches CONSTANTA-1's recon perfectly; the 17 newer chars adopted canonical format already.
- **2026-05-28** — Deploy sequence (post-safety) ratified by BONAPARTE-1:
  1. BONAPARTE-1 commits vault campaign artefacts.
  2. Pawel: apply migration 023 to live DB (Supabase SQL editor or `npx supabase db push`).
  3. Pawel: spot-verify (e.g. `SELECT id, name, spending_level FROM characters WHERE spending_level IN ('$2','$7','$25')` — expect 18 rows: 6+1+1 newly normalized + 8 already-canonical $7 + 4 already-canonical $25 - some collation).
  4. BONAPARTE-1: `git push origin master` (8 commits: 7 fix + 1 vault) → GH Pages auto-deploy.
  5. Pawel: browser smoke test per CONSTANTA-1's 13-step plan.

## Open threads / TODOs for GENERAL

- [ ] Create `operations/BUG_MAP.md` after Front A and Front B report back.
- [ ] Brainstorm session for BUG-066 (admin redesign) — schedule when user signals readiness.
- [ ] Decide responsive-audit scope (BUG-065).
- [ ] Continue ingesting user-reported bugs (Pawel signalled "mam więcej").

## Handover artefacts (template for future iterations)

When GENERAL hands off to BONAPARTE-N+1:
- Updated COMMAND_LOG (this file)
- BUG_MAP (once created)
- One-page handover note: what's in flight, what's blocked, where user is mid-decision, next intended move.

When MANAGER hands off to CONSTANTA-N+1:
- Their domain mini-spec in `specs/`
- List of dispatched workers + statuses
- Outstanding user decisions

## Session journal

### 2026-05-28 — Campaign opening

- Parallel 6-agent deep review of codebase by BONAPARTE-1 → ~110 raw findings → ~72 deduplicated unique bugs across CRITICAL/HIGH/MEDIUM/LOW.
- User contributed 6 additional findings (BUG-062..BUG-067), 2 of which promoted to CRITICAL (BUG-062, BUG-063) — both block player progression in wizard.
- Command-chain model adopted. BONAPARTE-1 in command, CONSTANTA-1 designated Manager for Front B.
- Front A (WORKER #1) and Front B (CONSTANTA-1) briefs issued.

### 2026-05-28 — Front A returns; CONSTANTA-1 catches outdated briefing data

- **Front A complete**: WORKER #1 delivered 3 commits, build green, smoke-test plans documented. Three additional bugs flagged (BUG-073, BUG-074, BUG-007-confirmed).
- **CONSTANTA-1 audit**: caught that BUG-014 (admin allowlist) was already fixed in `53a2674` (briefing carried outdated info); BUG-064 is ~80% wired with 2 uncommitted local diffs landing it; BUG-067 has only 3 leak paths remaining. Front B scope tightened accordingly.
- **CONSTANTA-1 status**: Stage 3 (specs drafted, awaiting Pawel sign-off on D1–D8). Specs in `specs/birthplace_residence_integration.md` + `specs/spending_level_normalization.md`. Recon in `work/2026-05-28-front-b-recon.md`.
- **GENERAL pending decisions**: (1) push Front A immediately or batch with Front B; (2) review CONSTANTA-1's D1–D8 sign-off requests when Pawel relays them.
