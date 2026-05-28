---
date: 2026-05-28
status: draft
tags:
  - spec
  - feature/basic-info
  - bug/data-integrity
  - bug-064
---

# Birthplace + Residence Integration — Spec

> [!info] Owner
> Front B / [[CONSTANTA-1]]. Recon: [[../work/2026-05-28-front-b-recon]].
> Closes BUG-064. Overlaps with BUG-014 (already fixed in `53a2674`, see recon).

## Problem

Migration 014 added `residence` + `birthplace` columns to `public.characters` 2026-02
(approx). Most of the integration shipped over subsequent sessions (store, edge
allowlists, narrative editor, wizard input, PDF map, HTML template placeholders).
Two pieces never landed:

1. **Admin edit form** (`BasicInfoEditor.tsx`) had no inputs — admin couldn't fix a
   player's typo or backfill via admin UI.
2. **On-screen sheet preview** (`CharacterSheet.tsx`) didn't display the fields — even
   when populated, the admin/player viewer didn't show them.

Both have **uncommitted local diffs** in the working tree that add exactly these
pieces (verified via `git diff`). Worker #B1 simply commits them.

## DB state (snapshot 2026-04-27)

- 7/23 chars have non-empty residence + birthplace (filled via wizard or NarrativeEditor).
- 16/23 have empty strings `""`.
- 0 NULLs (column has default `''`).

## Decisions

| # | Question | CONSTANTA-1 recommendation |
|---|---|---|
| **D1** | Commit local uncommitted diff as-is, or expand scope? | **As-is.** Minimal blast radius. Don't bundle. |
| **D2** | Backfill the 16 empty chars? | **No.** Empty hides cleanly via `{x && <div>}`. Players fill via NarrativeEditor. CLAUDE.md cautions against unsolicited writes. |
| **D3** | Wizard required vs optional? | **Optional.** Status quo; lore-light campaigns shouldn't be blocked. |
| **D4** | Also wire `death_place`? Template has placeholder; today renders `''`. | **No.** Out of scope. Open a follow-up task if wanted — needs schema column first. |

## Scope (assuming sign-off on recommendations)

WORKER #B1 commits two files (local diffs already there):

1. `src/components/admin/edit/BasicInfoEditor.tsx`
   - Extend props type: `+ residence?: string; birthplace?: string`.
   - Add two `<Input>` rows wired to `onChange('residence', …)` / `('birthplace', …)`.
2. `src/components/shared/CharacterSheet.tsx`
   - Add two `<div>` rows under basic-info grid: `{char.residence && <div>…</div>}` and same for birthplace.

Each as a separate commit:
- `feat(admin-edit): expose residence + birthplace inputs (BUG-064)`
- `feat(sheet): display residence + birthplace on-screen preview (BUG-064)`

OR one bundled commit — worker decides.

**No edge-function changes.** Allowlists already include both fields
(`53a2674` + `1cd4ed1` line refs in [[../work/2026-05-28-front-b-recon]]).

**No template changes.** `card_front.html:807-808` already has `data-bind` placeholders.

## Smoke test (Stage 5)

Pawel runs in browser after worker reports back:
1. **Admin**: open any submitted char in admin editor → see "Miejsce zamieszkania" /
   "Miejsce urodzenia" inputs → type → save → verify persisted.
2. **Admin sheet preview**: visit `/admin/character/<id>` → see the two fields rendered
   under basic-info when non-empty, hidden when empty.
3. **Player viewer**: log in as `tester` → submitted char → see fields on sheet view.
4. **PDF**: regenerate front card on a char with non-empty residence → verify rendered
   (already works per `exportCardPdf.ts:281-282`).

## Edge cases

- Empty string `""` → conditional render hides the field. No `—` placeholder needed.
- Old chars where `residence`/`birthplace` is absent from JSON entirely (drafts pre-014) →
  TS type allows `undefined`; `{char.residence && …}` handles it.
- Player tries to save via /narrative → already allowlisted; no change needed.
- Pending-edit approval flow → already allowlisted (Etap C); admin can approve them.

## Out of scope

- `death_place` (separate column needed first).
- Backfilling the 16 empty chars.
- Required-field validation in wizard.
- ToC back card (no design slot for them; lives on front card only per `card_front.html`).
