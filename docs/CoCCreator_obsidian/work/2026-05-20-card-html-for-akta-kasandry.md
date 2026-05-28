---
date: 2026-05-20
status: active
tags:
  - work-note
  - akta-kasandry
  - card
  - integration
---

# Character card HTML — can akta-kasandry reuse it?

> [!success] Update 2026-05-21 — Path 1 chosen, bundle shipped
> akta-kasandry picked **Path 1** (vendor the responsive React component).
> Delivered `vendor-export/coc-character-sheet/` — self-contained 25-file bundle:
> `CharacterSheet.tsx` + transitive deps (cardFrontMap/backTocV2Map, derived,
> data tables, types) with relative imports, NEW `adapter.ts`
> (`mapCharacterRowToSheet(row) → {character}`, recomputes `derived`, omits
> `admin_notes`), `index.ts` barrel, `VENDOR.md` (deps=react only; coc-* token
> hex table; dark-theme wrapper caveat; extensionless-import note), and a real
> fixture (Arthur Henry Corwin + expected SheetProps).
> **Verification:** whole bundle `tsc --moduleResolution Bundler --jsx react-jsx`
> exit 0; adapter run on the fixture via tsx (derived computed correctly:
> hp 11 / mp 12 / san 60 / dodge 22; admin_notes absent from output).
> Ops scripts kept: `scripts/fetch-fixture-character.mjs`,
> `scripts/verify-vendor-fixture.ts`, `vendor-export/tsconfig.check.json`.

> [!question] Ask
> Akta-kasandry (player-facing wiki, shared Supabase) wants to display players'
> characters. Rather than rebuild the card from JSONB, they considered injecting
> coc-creator's card HTML directly (they have `rehype-raw`). This note answers
> their 7 questions and recommends a path.

## Headline verdict

**The card is NOT a server-rendered or persisted HTML string. It is a static,
EMPTY A4 print template (`public/templates/card-v2/*.html`) whose values are
injected at runtime by inline JavaScript.** Three consequences:

1. You cannot read a filled card off disk — the template on disk has zero
   character data in it.
2. A filled HTML string CAN be produced via a headless pre-render (verified —
   see §3), but it is A4-fixed (210mm×297mm) and depends on a large global
   `<style>` block + three web fonts, so it is **not** a good fit for
   `rehype-raw` injection into a responsive wiki page (sanitization strips the
   `<script>` engine and `<style>`; the fixed mm layout overflows).
3. **Recommended path: share the responsive React display component
   `CharacterSheet.tsx` + the decode/mapping layer**, since akta-kasandry is
   also React+Vite+TS. The A4 card is a *print* artifact; the wiki wants a
   *screen* artifact, and coc-creator already has the latter.

## Q1 — How is the card HTML produced?

Not React-to-string, not a server template, not an edge function. It is three
static files plus inline JS:

- `public/templates/card-v2/card_full.html` — wrapper, two iframes
  (`#frontFrame`, `#backFrame`).
- `public/templates/card-v2/card_front.html` — front (data, chars, indicators,
  skills, weapons, combat, move). ~1295 lines: a big `<style>` block, an empty
  HTML skeleton, and a `<script>` that builds the grids and binds values.
- `public/templates/card-v2/card_back_toc.html` — back (journal, friends,
  equipment/assets, position/contacts, expenses).

The React side (`src/components/shared/CardV2DownloadButton.tsx`) only
orchestrates: it creates an off-screen iframe, loads `card_full.html`, maps the
character (see Q7), pushes the mapped data into each inner iframe via
`window.setCharacter(...)` / `window.setCardBackData(...)`, then calls
`window.print()`. Browser "Save as PDF" produces the 2-page A4 PDF.

> [!note] The pdf-lib-on-images path is legacy
> `src/lib/exportCardPdf.ts` (pdf-lib drawing text onto background PNGs) is the
> OLD card and is NOT what "Pobierz kartę" uses today. The canonical card is the
> HTML v2 pipeline above. (Earlier audit notes that called pdf-lib "primary"
> were wrong — corrected 2026-05-20.)

The card render logic (chars 3×3 grid, 3-column skills, specialization
families, weapons table) lives in the inline `<script>` of `card_front.html`
(`renderChars`, `renderSkills`, `renderWeapons`, `renderBindings`). The API
contract is documented in `new_char_sheet/INTEGRATION.md`.

## Q2 — Is it persisted anywhere?

**No.** Grep of all migrations and Storage: there is no `card_html`,
`rendered_html`, or equivalent column, and no HTML object in any bucket. The
card exists only transiently in the print iframe's DOM. `public.characters`
stores the JSONB + portrait URLs; the card is regenerated on demand client-side
each time.

## Q3 — Can it be obtained as a self-contained string for a `character.id`?

**Not off the disk (the template is empty), but yes via a headless pre-render —
with caveats.**

Verified 2026-05-20: `scripts/render-card-sample.mjs` loads `card_front.html`
headless (Playwright, chromium already installed), lets the inline JS run with
the default character, and serializes the post-render `#card` node. Result:

- `#card` outerHTML = **24 206 bytes**, with values baked into the DOM
  (e.g. `<div class="name">SIŁ</div><div class="main">40</div>
  <div class="sub"><div class="half" data-lbl="½">20</div>
  <div class="fifth" data-lbl="⅕">8</div></div>`).
- Full document = **60 073 bytes** (the 24KB node + ~17KB `<style>` + the JS).

Saved artifacts for inspection:
- `new_char_sheet/sample-rendered-card-node.html` (just `#card`, 24KB)
- `new_char_sheet/sample-rendered-full.html` (whole doc, 60KB)

**Caveat — the 24KB node is NOT self-contained.** It is bare markup that
references CSS classes (`.char-cell`, `.skills-grid`, `.bar`, …) defined in the
page-level `<style>` (~17KB), plus three web fonts. To make a truly portable
string you must: inline that `<style>`, base64-embed the fonts (or accept the
Google Fonts CDN link), and rewrite the portrait `<img src>` to an absolute URL.
Doable in the same render script, but it produces a fixed-A4 fragment, not a
fluid web card.

## Q4 — Dependencies

| Dependency | Detail |
|---|---|
| **Web fonts** | EB Garamond, Cinzel, Cormorant Garamond. Variable TTFs (~3.6 MB), SIL OFL 1.1, bundled at `public/templates/card-v2/fonts/`. Card loads them via `<link rel="stylesheet" href="fonts/fonts.css">`. Default upstream is Google Fonts CDN. |
| **CSS** | One large inline `<style>` block in each file. Uses GLOBAL selectors: `html, body { background:#1d1d1d; font-family:'EB Garamond'… }`, `* { box-sizing… }`. Layout is 100% absolute-positioned mm coordinates. |
| **JS** | Mandatory. ALL field values + grids are built by the inline `<script>` at runtime. No JS ⇒ empty card. |
| **Images** | Portrait via `card_portrait_url ?? portrait_url` — an absolute Supabase Storage public URL. No other images required (frames/textures are CSS or optional `--asset-*` slots, all default `none`). |
| **Interactivity** | A print toolbar button `<button onclick="window.print()">`. No other interactivity; the card is static once rendered. |
| **Print rules** | `@page { size:A4; margin:0 }`, `@media print { … }`. |

Without the stylesheet the card completely falls apart — it is not
content-flow HTML, it is an absolutely-positioned A4 sheet.

## Q5 — Dimensions

Hard A4. `.card { width:210mm; height:297mm }` (≈794×1123 px at 96dpi),
`@page { size:A4 }`, body grid uses fixed mm rows (`64mm / auto / auto /
minmax(34mm,auto)`). It will **not** reflow into a responsive ~700px wiki
container — it would overflow horizontally and keep its fixed height. To embed
in a wiki you would need an `<iframe>` or a wrapper with `transform: scale(...)`
and a fixed aspect box. This alone makes it a poor inline-HTML citizen for a
fluid page.

## Q6 — Security / what `rehype-raw` + sanitizer would strip

The card contains exactly the things HTML sanitizers remove:

- **`<script>` blocks** — and these ARE the render engine. Strip them and you
  get a blank skeleton. (If you instead inject a *pre-rendered* node, there is
  no script, but then you depend on the `<style>`.)
- **Inline event handler** `onclick="window.print()"` on the toolbar button.
- **`<style>` with global selectors** — `html, body { background:#1d1d1d }`,
  `* {…}`. If a sanitizer keeps it, it bleeds a dark background and serif font
  onto the entire wiki page; if it strips it, the card is unstyled.
- **`@page` / `@media print`** rules.

Net: naive `rehype-raw` injection of the on-disk template yields a blank card;
injection of a pre-rendered node yields unstyled markup unless you also inject
the (page-polluting) global `<style>`. Neither is good.

## Q7 — If not extractable directly: the methodology (reconstruct)

The genuinely reusable IP — needed regardless of which path you pick — is the
**mapping layer + data tables**, all already documented:

### Data contract (authoritative)
`new_char_sheet/INTEGRATION.md` — §2.1 defines `window.character` (front), §3.2
defines `window.cardBackData` (back), §2.2 lists the exact skill keys, §2.3 the
`data-bind` paths. This is the spec; copy it.

### Mapping logic (JSONB → card shape)
- `src/lib/cardFrontMap.ts` — `characterToCardFrontData(char): CardFrontData`.
  Decodes:
  - **Skill key translation** pl→en: `SKILL_KEY_MAP` (e.g. `historia→history`,
    `nasluchiwanie→listen`), `COMBAT_KEY_MAP`
    (`bron_palna:krotka→firearms_handgun`, `walka_wrecz:bijatyka→fighting_brawl`).
  - **Open specialization slots**: `nauka→science_1..3`,
    `jezyk_obcy→lang_other_1..3`, `sztuka_rzemioslo→art_craft_1..3` (with
    `name` from `getSpecialization`).
  - **Base resolution**: `half_dex` → ⌊DEX/2⌋, `edu` → EDU, else numeric.
  - **Derived**: hp/mp/san/db/build/dodge/move from `char.derived`; walk =
    ⌊move/3⌋, sprint = ⌊move·5/3⌋; dodge total adds `unik` points.
  - **Weapons**: `parseWeaponsFromEquipment` reads `[Broń]`/`[Czarny rynek]`/
    `[Wojsko]` tags, looks them up in `WEAPONS` / `WEAPONS_CATALOG_V2` /
    `BLACK_MARKET_CATALOG`, always prepends "Nieuzbrojony", caps at 5.
  - **Cash/spending** normalization (strip `$`, parse "Gotówka: $X | …").
- `src/lib/backTocV2Map.ts` — `characterToCardBackData(char): CardBackData`.
  Decodes drive/pillars/sources (Drive+Pillars variant), splits
  `equipment[]` into ekwipunek / dobytek / pozycja / weapons buckets, formats
  positions + contacts with star badges, normalizes spending/cash. NOTE: it
  emits some inline HTML (`<span class="stars">…`, `<strong>`, `<em>`) and uses
  `escapeHtml` on user text — relevant if you feed it into your own sanitizer.

### Data tables the mapping needs
`@/data/skills` (`getSkillBase`, `getBaseSkillId`, `getSpecialization`,
`getSkillDisplayName`), `@/data/occupations`, `@/data/characteristics`,
`@/data/drivePillars`, `@/data/weapons`, `@/data/weaponsV2`,
`@/data/blackMarket`. These are static TS modules — portable as-is.

## Recommendation

> [!decision] Three paths, ranked for a wiki use-case

**Path 1 — Share the responsive React component (RECOMMENDED).**
akta-kasandry is React+Vite+TS. Port `src/components/shared/CharacterSheet.tsx`
(378 lines, Tailwind, web-native, scrollable, fits any container) and render it
natively on the character page. It already decodes everything for *screen*
display (chars, derived, skills via `getSkillDisplayName`, positions, contacts,
Drive+Pillars, equipment). Needs: the component + `@/data/*` tables +
`halfValue`/`fifthValue` + Tailwind with the `coc-*` color tokens
(`coc-surface-light`, `coc-text-muted`, `coc-accent`, `coc-border`). No HTML
injection, no sanitizer fight, fully responsive. **This is the right tool: the
wiki wants a screen card, and CharacterSheet IS the screen card.**

**Path 2 — Pre-rendered self-contained snapshot into `wiki.imported_characters.card_html`.**
If they specifically want pixel-fidelity of the A4 print card embedded: expose a
coc-creator helper `renderCardHtml(character) -> string` that headless-renders
`card_full.html`, injects the mapped data, serializes the filled node, inlines
the `<style>` + base64 fonts, strips `<script>`/toolbar, and rewrites the
portrait URL absolute. akta-kasandry stores that string and renders it inside an
`<iframe srcdoc=...>` (NOT via rehype-raw — iframe sandboxes the global CSS and
preserves the fixed A4 layout; scale with CSS transform for thumbnails).
Heavy (Playwright at import time) but truly self-contained and print-accurate.
`scripts/render-card-sample.mjs` is the proof-of-concept skeleton.

**Path 3 — Reconstruct from JSONB in akta-kasandry's own style.**
Share the Q7 mapping IP; akta-kasandry renders their own card markup. Most
work, most styling freedom, no coc-creator runtime coupling.

**Avoid:** raw `rehype-raw` injection of `card_front.html` (empty: no data) or
of a pre-rendered node (needs page-polluting global `<style>`; A4 overflow).

## What akta-kasandry should tell us back

1. Do they want a **screen card** (→ Path 1, share the React component) or
   **print-accurate A4** embedded (→ Path 2, snapshot + iframe)? For a wiki I'd
   bet Path 1.
2. If Path 2: do they want coc-creator to own a `get_character_card_html(uuid)`
   endpoint/function, or a build-time script that writes `card_html` at import?
   (Reminder from [[INTEGRATIONS]]: cross-app reads of `public.characters` are
   fine via anon RLS; a card-HTML endpoint would be a new coc-creator surface
   to design with explicit auth.)

## Reference artifacts produced this session
- `scripts/render-card-sample.mjs` — headless render PoC (read-only against the
  template).
- `new_char_sheet/sample-rendered-card-node.html` — real filled `#card` (24KB,
  Henry Armitage default data).
- `new_char_sheet/sample-rendered-full.html` — whole rendered doc (60KB).

## See also
- `new_char_sheet/INTEGRATION.md` — the card data-contract spec (§2.1, §3.2).
- `src/lib/cardFrontMap.ts`, `src/lib/backTocV2Map.ts` — the mapping layer.
- `src/components/shared/CharacterSheet.tsx` — the responsive screen card.
- [[INTEGRATIONS]] — cross-project coordination ledger.
