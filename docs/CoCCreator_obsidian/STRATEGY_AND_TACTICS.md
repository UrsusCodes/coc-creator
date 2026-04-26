---
date: 2026-04-21
status: active
tags:
  - strategy
  - roadmap
---

# Strategy and Tactics

## North star

CoC Creator exists to remove friction from running and playing Call of Cthulhu 7e campaigns for **one specific game group**. The tool should:

1. Let players create characters without needing to know the rulebook.
2. Let the admin (game master) manage characters, sessions, and handouts in one place.
3. Produce printable / app-viewable character sheets that look good on the table.
4. Generate evocative portraits cheaply (SD + Gemini) so every character has a face.

Non-goals:
- Public product / SaaS.
- Supporting rulesets other than CoC 7e.
- Replacing the GM's creative work (tool assists, doesn't automate the session).

## Current version focus (2026-04-21 → ongoing)

Core feature set is **shipped**. The new-version cycle is about:

1. **Rework** — user intends to change the general program structure/flow to solve a class of accumulated problems (scope TBD; user will describe).
2. **Stabilize** — clear accumulated bugs (PDF layout, UI edge cases, draft sync). See [[TASK_LIST]].
3. **Polish** — small UX improvements across wizard, admin editor, player viewer.
4. **Defer** — downtime / development rules remain the only un-started roadmap item; not in this cycle unless promoted.

> [!note]
> The exact rework scope will be captured here and in `specs/` as the user describes it.

## Roadmap status (historical)

Feature roadmap, last confirmed 2026-03-18. Verify before relying on specifics.

1. **Admin character editing** — ✅ DONE (full editing + quick create).
2. **Share links** — ✅ DONE (UUID view/edit tokens, `/c/{token}`).
3. **Version history** — ✅ DONE (snapshots, restore, change comments).
4. **PDF overlay on card images** — ✅ DONE (pdf-lib, front+back, classic/ToC variants, 50+ fields).
5. **Wealth v2** — ✅ DONE. See [[specs/wealth_v2_spec]].
6. **Equipment v2** — ✅ DONE (7 tags, ekwipunek/dobytek, weapons, black market, military).
7. **Contact/Position system v2** — ✅ DONE (occupation-based, synergy, 81+ additional positions).
8. **Drive+Pillars variant** — ✅ DONE (perk-based, `StepDrivePillars`, auto back-card selection).
9. **Portrait app feature** — ✅ DONE. See [[specs/portrait_app_feature_spec]].
10. **Development / downtime rules** — ⏸ NOT STARTED (CoC 7e improvement rolls, sanity recovery — lowest priority, deferred).

## Tactics / guardrails

- **Don't add features mid-implementation.** If something is out of scope for the current item, it goes in [[TASK_LIST]] backlog.
- **Every feature starts with a spec in `specs/`** before code is written.
- **PDF changes need a visual check** — UI tests don't catch layout regressions.
- **Migrations are forward-only in practice** — player data is real, no `drop table` shortcuts.
