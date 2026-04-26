---
date: 2026-04-21
status: active
tags:
  - domain
  - coc
  - rules
---

# CoC Domain — Rules as Implemented

This project implements Call of Cthulhu 7e with significant custom extensions. The canonical, complete rule delta is in the legacy doc:

> [!info] Canonical source
> `docs/RULES_MODIFICATIONS.md` (outside this vault) — full breakdown of ✅ STANDARD / 🔧 MODIFIED / 🆕 CUSTOM across all rule areas.

Read that document first. This file layers **app-specific mechanics and interpretation notes** on top — things that live in code but aren't in the rules doc.

## App-specific mechanics (layered on top of rules)

### Wealth v2 — star rating & gap cost

The rules doc describes the 6 tiers and base multipliers. The app adds:

- **5-star rating (0–5★)** for lifestyle — combination of housing + transport + lifestyle level. Stars are **display only** on the card; computed from picks.
- **Gap cost formula** — penalty when the player configures a lifestyle above their wealth tier. Eats into monthly cash.
- **Presets** — three quick-picks:
  - *Oszczędny* — minimum lifestyle within tier.
  - *Wygodny* — centered within tier.
  - *Ekstrawagancki* — top of tier, may trigger gap cost.
- **Three catalogs:**
  - Standard equipment catalog (per era).
  - Weapons catalog.
  - Locked catalogs behind perks: `black_market` (17 items), `military_gear`.

See [[specs/wealth_v2_spec]] for the full spec (once migrated from memory into vault).

### Card layout (front vs back)

- **Front card:** portrait, basic info, characteristics, derived attributes, skills.
- **Back card:** ekwipunek, dobytek, pozycja, kontakty — **as separate line items**, not merged.

See [[DESIGN]] for layout and typography decisions.

### Occupations — choice slots

Beyond the rules-doc description, the implementation uses:
- `choice:N:skill1,skill2,...` — player picks N from the list.
- `any` — any skill.
- `any_academic` — any academic skill.

This drives a custom wizard UI in `StepOccupationSkills`.

### Perks (4 total)

Attached to invite codes. Gate features in the wizard:
- `swap_characteristics` — one pair-swap after roll, before age modifiers.
- `drive_pillars` — replaces standard backstory with Motivation + Sanity Pillars system.
- `black_market` — unlocks illegal catalog.
- `military_gear` — unlocks military catalog.

### Motivation + Sanity Pillars (alternative backstory)

When `drive_pillars` perk is active, instead of standard backstory:
- 14 motivations to pick from.
- Sanity pillars: anchors sized by POW score.
- Sources of stability: people, places, organizations.

### Positions (81 options, 11 categories)

- **Slot count:** 1 base. +1 each if age ≥40, wealth ≥50, INT ≥80, or a social skill ≥80.
- **Weight:** 1–3 stars based on fit.
- **Main position** comes from the occupation's cluster (10 clusters mapping to occupations).

### Contacts (50+ subcategories)

- **Occupation slots:** 2–3 depending on occupation type (networked / average / isolated).
- **Extra slots:** +1 for social skill ≥60, +1 for wealth ≥50 / age ≥45.
- **Strength:** 1–3 based on fit to occupation.
- **Modifiers:** +1 per threshold crossed on social skill, wealth, age, POW.
- **Synergy:** +1 per additional contact in same category, max +2.
- **Roll value:** strength × 30.

## Era system

Three eras supported: `1920s`, `modern`, `gaslight`.
- Gate skill availability (e.g., Elektronika only in modern).
- Determine equipment catalog and prices.
- Drive portrait prompt style modifiers (see [[PORTRAIT_PIPELINE]]).

## Editing permissions (3 levels)

Admin grants temporarily:
- **Lore** — text only (backstory, basic data).
- **Standard** — from occupation upward.
- **Full** — characteristics and everything.

Cascades: occupation change → resets skills → resets positions/contacts.
After edit: character enters "for review" state; admin approves; prior version archived.

## Invite codes

Control character creation:
- `max_tries`, `max_skill_value`.
- Allowed generation methods (dice / point buy / direct).
- Perks.
- Era.

Draft sync attaches to the invite code, so a player can resume on any device.
