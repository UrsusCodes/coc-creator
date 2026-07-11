---
date: 2026-06-27
status: done
tags:
  - feature/easy-test
  - spec/card
  - domain/coc-rules
---

> [!done] Implemented 2026-06-27 — variant B (`norm | łatwy | ½ | ⅕`).
> `easyValue()` util, template + generator (regenerated `cardFrontV2.generated.ts`
> and `karta_front_v2.pdf`), `cardFrontV2.types.ts`, `exportCardPdf.ts`, and the
> characteristics block of `CharacterSheet.tsx`. `npm run build` passes.

# Easy Test Mechanic — Design

## Problem

Call of Cthulhu 7e defines difficulty levels for any d100 roll: Regular (skill
value), Hard (value ÷ 2), Extreme (value ÷ 5). This app already computes and
prints Regular / Hard / Extreme on the character card.

We want a new house-rule difficulty: **Easy test (łatwy test)** = `value × 2`,
capped at **99**. The cap guarantees that a roll of 100 is always a failure even
on an easy test (CoC convention: 100 is a fumble / automatic failure).

This applies to **skills** and **characteristics** (not weapons, not derived
attributes like Luck/SAN).

## Decisions (locked)

- **Derived, not stored.** The easy value is a pure function of the base value,
  exactly like Hard/Extreme today. It is computed at render time. **No Supabase
  migration, no new DB column.** Works retroactively for every existing
  character. "Add to the data model" means exposing it in the card data shape
  (`CardFrontData` / render loops), not persisting it.
- **Scope: skills + characteristics only.** Weapons (which already carry
  norm/hard/extreme) and derived stats do not get an easy value.
- **Card column order: `norm | łatwy | ½ | ⅕`** (variant B — the full value
  stays first, green easy sits immediately to its right, then hard/extreme).
  Chosen over the ascending-difficulty order ("we'll try this, can change
  later"). The trying-it nature means the order may be revisited; everything is
  driven from the template, so swapping `.v`/`.e` order is a localized change.
- **Visual hierarchy:** **only the normal value is bold** (its white framed
  box). Easy / ½ / ⅕ are all regular weight. In the printed PDF the cell
  background colors are baked in from the template (cream = normal, **green =
  easy**, gray = ½, red = ⅕) and pdf-lib draws plain black numbers on top — so
  the easy value is set apart by its green cell fill, not by text color or
  weight. Do not bold the easy value.
- **No per-column headers** — consistent with the existing card, which has none;
  the four difficulty cells are distinguished by their baked fill colors.
- **Characteristics sub-column** becomes a 3-row stack (×2 / ½ / ⅕, easy on
  top), each row labelled (`×2`, `½`, `⅕`); the sub-column is widened
  (7mm → 8mm) and its font reduced (10pt → 8.5pt) to fit three rows.

## Formula

```ts
// src/lib/utils.ts — alongside halfValue() / fifthValue()
export function easyValue(value: number): number {
  return Math.min(99, value * 2)
}
```

Consequences (by design, not bugs):
- Any base value ≥ 50 yields easy = 99 (capped).
- Render only when the underlying total > 0, matching the existing
  `if (halfV > 0)` / `if (fifthV > 0)` guards, so untrained 0-value rows stay
  blank.

## Architecture

The card front is driven by an auto-generated layout. The data flow is:

```
public/templates/card_front_v2.html   ← source of truth (HTML + CSS)
        │  scripts/render-card-frame-v2.mjs (Playwright: measures DOM rects)
        ▼
src/data/cardFrontV2.generated.ts      ← coordinates (% of A4): FRONT_V2_FIELDS,
        │                                  FRONT_V2_SKILL_ROWS, FRONT_V2_SPEC_ROWS
        ▼
src/lib/exportCardPdf.ts               ← draws values into those boxes
```

Plus the on-screen sheet `src/components/shared/CharacterSheet.tsx`, which
renders half/fifth independently of the PDF and should gain easy for
consistency.

The new "easy" cell is a **fourth value box per row**. The skills grid and the
characteristic blocks are currently full-width; room is made by **narrowing the
(generously wide) skill-name column** and shifting the value cluster left, and
by **adding a third stacked sub-line** in each characteristic block.

### Components to change

1. **`src/lib/utils.ts`** — add `easyValue()`.

2. **`public/templates/card_front_v2.html`** (source of truth)
   - **Skills grid** (`.skills-grid .skill`): add an easy cell with a new class
     `.e`, placed **after** `.v` in the markup (order `.v .e .h .f`). Add a 4th
     value column to `.skill` `grid-template-columns` and steal the room from
     the base-% (`.pct`) column (7mm → 6mm), keeping each value cell at 4.4mm.
     Style `.e` like `.h`/`.f` (small, regular) with a green fill; keep `.v` as
     the emphasized framed+bold cell.
   - **Specializations grid** (`.skills-spec-grid .skill`): same `.e` cell,
     same ordering and styling. Open-spec name boxes already cap at 22% — verify
     no overlap with the shifted value cluster.
   - **Characteristics** (`.char-cell .sub`): add a third sub-line `.easy`
     **above** `.half` (order top→bottom: easy / ½ / ⅕). Shrink the three
     stacked lines to ~1.65% A4 height each so they fit the block. Green text on
     the easy line. The big `.main` value is unchanged.
   - **Legend/header:** if the card has a difficulty legend, add a green
     "łatwy ×2" entry. Add per-column mini-headers (`łatwy / norm / ½ / ⅕`) only
     if the current grid has headers; otherwise leave as-is.

3. **`scripts/render-card-frame-v2.mjs`** (generator) — mirror the existing
   half/fifth handling for easy:
   - PHASE 1 placeholder fill: include `.e` in the `.skill .v, .skill .h,
     .skill .f` selector list, and `.char-cell .sub .easy`.
   - Capture loop:
     - chars: read `cell.querySelector('.sub .easy')` → push `char_${key}_easy`.
     - skills: read `row.querySelector('.e')` → push `skill_${key}_e`.
     - specs: read `row.querySelector('.e')` → push `spec_${id}_e`.
   - `emitTypedLayout`:
     - chars: emit `char_${key}_easy` FieldBox (fontSize 8, center) next to
       half/fifth.
     - skills: add `easy: { … }` to each `SkillRowV2` literal.
     - specs: add `easy: { … }` to each `SpecRowV2` literal.
   - PHASE 2 blanking: clear `.e` cells and `.sub .easy` so they don't bake into
     the static background PDF.
   - Re-run requires Playwright + chromium (already a dev dependency). Output
     `public/karta_front_v2.pdf` and `src/data/cardFrontV2.generated.ts` are
     regenerated and committed.

4. **`src/data/cardFrontV2.types.ts`** — add `easy: BoxV2` to `SkillRowV2` and
   `SpecRowV2`.

5. **`src/lib/exportCardPdf.ts`**
   - Import `easyValue`.
   - Char field resolver (~line 267): add `_easy` suffix → `easyValue(val)`,
     alongside the existing `_half` / `_fifth` cases.
   - Skill row loop (~852–864): compute `easyV = easyValue(total)`; if
     `easyV > 0` draw it into `row.easy` in **green** at the ½/⅕ font size
     (5.5, regular). Keep `row.v` bold.
   - Spec row loop (~868–902): same.
   - Define a green color constant for pdf-lib, e.g.
     `const GREEN = rgb(0.06, 0.43, 0.34)` (≈ #0F6E56).

6. **`src/components/shared/CharacterSheet.tsx`** (on-screen sheet, Polish UI)
   - Characteristics (~line 119): add easy in green (`text-emerald-600`) before
     the existing `½ / ⅕`.
   - Skill rows: **no change** — the on-screen sheet only shows each skill's
     final `%`, not ½/⅕, so adding easy there would be inconsistent. Easy for
     skills lives on the printed card only.

### Out of scope

- Weapons easy value, derived-stat easy value.
- Any DB migration or backfill.
- Back card (`back_classic` / `back_toc`) — no skill/characteristic difficulty
  grid there.
- Wizard step screens beyond the shared sheet, unless they already render
  half/fifth and look inconsistent (re-check `StepReview` during implementation;
  add only if it currently shows ½/⅕).

## Testing

- **Unit:** `easyValue()` — `0→0`, `1→2`, `40→80`, `49→98`, `50→99` (cap),
  `99→99`, `120→99`.
- **PDF render (manual/visual):** generate a card for an existing character
  (e.g. Piotr S) and confirm: four columns per skill row in order
  `łatwy | norm | ½ | ⅕`; easy is green; normal stays framed+bold; characteristic
  blocks show easy/½/⅕ stacked; no overlap with name column or next column; a
  skill ≥ 50 shows easy = 99.
- **Generator:** after editing the template, re-run
  `scripts/render-card-frame-v2.mjs`; confirm `cardFrontV2.generated.ts` now has
  `easy` on every skill/spec row and `char_*_easy` fields, and the static
  `karta_front_v2.pdf` has blank (not "00") easy cells.
- **On-screen:** open `CharacterSheet` for a character; easy appears green next
  to ½ / ⅕ for both characteristics and skills.

## Risks / open points

- **Horizontal fit is tight.** Four 2-digit cells + checkbox + name in each
  grid column block is the main layout risk. If ~1.85% cells prove too cramped
  at fontSize 5.5, fall back to: (a) steal slightly more from the name column,
  or (b) drop easy cell width and rely on the green color for separation.
  Validate visually right after regenerating.
- **Print legibility of green** — the card is printed in color, so green is
  acceptable; ensure the chosen green is dark enough to read on white at small
  size (#0F6E56 is dark — OK).
