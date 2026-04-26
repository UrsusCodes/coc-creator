---
date: 2026-03-16
status: implemented
tags:
  - spec
  - feature/card
  - feature/pdf
  - implemented
---

# Back Card Fields — Spec

> [!info] Status
> **Implemented.** PDF back card (both classic and ToC/Drive+Pillars variants) renders these fields. Recent commits (`f6854d1` card back v4, `fb26ee4` duplicate lifestyle fix) hardened layout. Verify against `src/components/shared/CharacterSheet.tsx` and `src/lib/exportCardPdf.ts`.

## Problem

The back card needs to surface four distinct categories of character data, each with different semantics. Merging them loses meaning; players and GMs need to see what's what at a glance.

## Scope

**In scope:**
- Four back-card sections: `ekwipunek`, `dobytek`, `pozycja`, `kontakty`.
- Each section renders as a list, one item per line.
- Wizard support for categorizing items into the right bucket.

**Out of scope:**
- Icons or typography beyond current card design ([[DESIGN]]).

## Design

### Four sections

| Section | Semantics | Source |
|---|---|---|
| **Ekwipunek** | Portable, practical items — weapons, tools, camera, car, flashlight | Equipment step (items tagged `[Ekwipunek]`, `[Broń]`, `[Czarny rynek]`, `[Wojsko]`) |
| **Dobytek** | Expensive / long-term assets — apartments, bank accounts, bonds, property | Equipment step (items tagged `[Lokum]`, `[Transport]` long-term, asset-form breakdown) |
| **Pozycja** | Social positions — occupation + credit-rating derived | Positions system (81+ options, see [[DOMAIN_COC]]) |
| **Kontakty** | Loose contacts — people/groups through profession/lifestyle | Contacts system (50+ subcategories) |

### Line-item rendering

Each section is a vertical list. One item per line. No merging, no bullet clusters — readability on print.

**Position_1 field** (first line of `pozycja` section) receives the lifestyle star rating from wealth v2 — see [[specs/wealth_v2_spec]].

### Wizard flow (how items reach the card)

- **Equipment step** categorizes items into ekwipunek vs dobytek via the tag system from [[specs/wealth_v2_spec]].
- **Positions step** pulls from the 81-option catalog, filtered by occupation + characteristic/wealth/age unlocks.
- **Contacts step** pulls from the 50+ subcategory tree, gated by occupation and social-skill thresholds.
- All four sections end up as arrays on the character record, rendered line-by-line on PDF.

## Variants

- **Back classic** — traditional CoC layout.
- **Back ToC (Drive+Pillars)** — alternative layout for characters with the `drive_pillars` perk (replaces standard backstory with Motivation + Sanity Pillars).

PDF generator auto-picks the back variant based on the perk.

## Known issues history

- `1b560b1` — Dodge box was showing base `DEX/2` instead of trained Unik value; fixed.
- `fb26ee4` — Duplicate lifestyle entries appeared on PDF; fixed.
- `f6854d1` — Lifestyle star display inconsistency; card back bumped to v4.
- `e064ba8` — PDF card layout and skill-update issues batched.

## Related

- [[DESIGN]] — full card layout and typography.
- [[DOMAIN_COC]] — positions & contacts rules detail.
- [[specs/wealth_v2_spec]] — upstream source of ekwipunek/dobytek tags and lifestyle stars.
- `src/components/shared/CharacterSheet.tsx` — card renderer.
- `src/lib/exportCardPdf.ts` — PDF export.

## Changelog

- **2026-03-16** — Requirements captured.
- **(later)** — Implemented; v4 hardening done.
- **2026-04-21** — Migrated from auto-memory to vault.
