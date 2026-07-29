---
date: 2026-04-21
status: active
tags:
  - specs
  - index
---

# Feature Specs

One markdown per feature. Created before implementation; iterated as design evolves.

## Index

### Implemented (historical reference)

- [[wealth_v2_spec]] — 6 tiers (A–F), gap formula, 5-star rating, presets, 3 catalogs. #feature/wealth
- [[portrait_app_feature_spec]] — push-to-player portraits, player gallery + crop, feedback with comments, "check app" status dashboard. #feature/portrait-app
- [[back_card_spec]] — ekwipunek / dobytek / pozycja / kontakty as separate line items on card back. #feature/card

### In progress — new version

- [[code_identity_rework_spec]] — **structural rework**: player-entered identifier commits character, server-authoritative characteristic rolls (fixes reroll-on-refresh bug), code list gains labels/assignees/status/rerolls-left columns + filter. #feature/invite-codes #feature/characteristics #structural-rework

### Planned / new version

- [[campaign_layer_spec]] — **campaign-layer overhaul** (design complete, not implemented): Zew (4 categories replacing 14 ToC drives), filary as shields against madness states, 5-slot źródła model, development rework (3 checks/session + carry-over + downtime learning), k6-unified reward economy with the Sanity gate, towarzysze, Majętność/Szacunek split, Wygląd as social reach, kontakty rebuilt as person+favour. #feature/drive #feature/pillars #feature/sources-of-stability #feature/companions #feature/contacts #feature/wealth #feature/development

## Template

```markdown
---
date: YYYY-MM-DD
status: draft | active | implementing | done
tags:
  - spec
  - feature/<slug>
---

# <Feature name>

## Problem
What pain this addresses. Who feels it.

## Scope
In scope / out of scope (bullets).

## Design
Data model, UI, API changes. Diagrams/callouts as needed.

## Migration plan
Schema changes, backfills, rollout order.

## Open questions
Things to resolve before coding.

## Acceptance
How we know it's done.
```
