---
date: 2026-04-21
status: active
tags:
  - design
  - ui
  - cards
---

# Design — UI/UX & Card Layout

Visual and layout conventions for the CoC Creator app, with emphasis on the printable / app-viewable character cards.

## Cards

### Front card
- **Status:** done.
- **Contents:** portrait, basic info (name, occupation, era), characteristics block, derived attributes (PW, PM, PP, Ruch, Unik, DB), skill list.
- **Canonical version reference:** v4 (see prior card-back fix commits).

### Back card
- **Status:** in progress.
- **Layout principle:** `ekwipunek`, `dobytek`, `pozycja`, `kontakty` rendered as **separate line items** — do not merge into one block.
- **Known constraints / past bugs:**
  - No duplicate lifestyle entries on PDF (past bug `fb26ee4`).
  - Lifestyle star display must match the wealth-v2 5-star rating.
  - Dodge box shows trained Unik value, **not** base DEX/2 (past bug `1b560b1`).

### General card rules
- Polish text throughout (UI language).
- Bilingual field labels not used — stick to Polish.
- Print-safe — no colors that vanish on grayscale printouts for critical info.

## UI conventions (wizard + admin)

- **Wizard:** step-based. Each step maps to a data block. Persist draft on step change.
- **Admin editors:** per-section (Basic Info, Skills, Sessions, etc.). Save indicator visible per editor.
- **Portrait gallery:** thumbnail grid + modal preview on click. Player picks one as "active."

## Iconography

- Use `lucide-react` (current choice — `KeyRound` used for "Zmień kod" button, etc.).
- No custom SVGs unless necessary.

## Open design questions

_(populate as they come up during new-version work — e.g., typography on back card, color accents for wealth tiers, portrait aspect ratio on player dashboard)_
