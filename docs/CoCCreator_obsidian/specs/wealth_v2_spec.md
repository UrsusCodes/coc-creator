---
date: 2026-03-17
status: implemented
tags:
  - spec
  - feature/wealth
  - implemented
---

# Wealth System v2 — Spec

> [!info] Status
> **Implemented** in the current codebase. This document is preserved as historical spec + reference for the mechanic. Verify against `src/components/wizard/StepEquipment.tsx`, `src/data/eras.ts`, `src/data/equipment.ts`, `src/lib/exportCardPdf.ts` before acting on specifics.

> [!warning] New-version context
> This may be revisited in the current new-version cycle if the user wants to tune tiers, presets, or gap formula.

## Problem

The original wealth system was simplified and didn't model CoC 7e wealth properly. Players couldn't express lifestyle nuance (apartments, transport, clothing), and the wealth→equipment link was flat.

## Scope

**In scope:**
- Redesigned wealth tiers with 6 brackets (A–F).
- Formalized daily spending / assets / cash relationship.
- Lifestyle composition (lokum + transport + lifestyle level) with star rating.
- Gap cost formula (penalty for lifestyle above wealth tier).
- Presets (Oszczędny / Wygodny / Ekstrawagancki) + custom mode.
- Asset form breakdown (bank / bonds / gold / etc.).
- Three equipment catalogs (standard / black market / military) with tag system.

**Out of scope (at spec time):**
- Downtime / wealth-change rules (future roadmap item).

## Design

### Majętność range
- **Max 80** (was 99). Aligns credit rating ceiling with CoC 7e character generation reality.

### Tiers (A–F)
Six brackets based on credit rating ranges. Each tier defines:
- Daily spending level.
- Assets multiplier.
- Cash multiplier.
- Available lokum / transport / lifestyle options.

### Three resources
- **Spending/day** — daily burn rate.
- **Assets** — total accumulated wealth.
- **Cash** — liquid on-hand.

New formulas per tier (vs old flat multipliers) — see `src/data/eras.ts` for current values.

### Star rating (0–5, half-steps)

```
stars = (lokum_pts + transport_pts + lifestyle_pts) / 9 × 5
```

Displayed on the card; computed from player's picks.

### Gap formula
Extra daily cost when lifestyle configuration exceeds wealth tier. Cost scales with tier distance.

### Presets
Three auto-generated per-majętność starting points:
- **Oszczędny** — minimum lifestyle within tier.
- **Wygodny** — centered within tier.
- **Ekstrawagancki** — top of tier; may trigger gap cost.

### Custom mode
Real-time validation while player builds lifestyle. Hard floor: `spending_free >= $2`.

### Asset breakdown
Checkboxes + % sliders for wealth forms: bank account, bonds, gold, jewelry, art, real estate, stocks, goods.

### Three catalogs

| Catalog | Gating |
|---|---|
| `standard` | always available |
| `black_market` | perk `black_market` on invite code |
| `military` | perk `military_gear` on invite code |

### Equipment tags

Each item has a tag: `[Lokum]`, `[Transport]`, `[Lifestyle]`, `[Broń]`, `[Ekwipunek]`, `[Czarny rynek]`, `[Wojsko]`.

### Card rendering
- **Lifestyle stars** render in the first `position_1` field on the card.
- **Daily spending** renders as `"$X.XX / dzień"`.

## Migration plan (historical, executed)
- Rewrote `StepEquipment.tsx`.
- Updated `eras.ts` wealth data.
- Updated `equipment.ts` catalog.
- Updated `exportCardPdf` equipment parsing to use the new tag system.
- Updated card PDF to place `lifestyle_stars` in `position_1`.

## Related

- [[DOMAIN_COC]] — rules-level summary.
- `docs/RULES_MODIFICATIONS.md` §8 — canonical rule delta.
- [[DESIGN]] — card layout.

## Changelog

- **2026-03-17** — Spec received and implemented.
- **2026-04-21** — Migrated from auto-memory to vault.
