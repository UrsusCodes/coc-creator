---
date: 2026-06-03
status: draft
tags:
  - spec
  - feature/wild-west
  - era
  - wizard
  - portrait
---

# Wild West Variant — Spec

A new era `wild_west` (Polish display: "Stary Zachód") added to the character creator. Mechanically Call of Cthulhu 7e — same characteristics, sanity, Mythos, magic — only the skin changes: new occupations, partly-overlapping skill list, frontier equipment and weapons, no housing/lifestyle/transport step, no contacts step, period-appropriate portrait prompts.

Triggered by selecting `wild_west` in the invite code era dropdown. Same wizard codebase, era-flag-driven routing.

Source material: Down Darker Trails (Old West setting for CoC 7e), pages 19–30 (occupations), 25–28 (skills), 33–37 (equipment & weapons), Table 7 Cash and Assets.

## Scope

**In:**
- New era `wild_west` in `types/common.ts`, `data/eras.ts`, `data/skills.ts`, weapons, equipment catalogs.
- 26 new occupations in a separate file `data/occupationsWildWest.ts`.
- Skill model extended (`baseByEra`, `specializationsByEra`, era-flagged combat specializations).
- New skills: `powozenie`, `hazard`, `jezyk_indianski`, `wladanie_lina`, `pulapki`. Two new combat specializations on `walka_wrecz`: `bicz`, `lasso`.
- Wealth table for WW (6 brackets, Penniless → Krezus), no housing/lifestyle/transport options.
- Wizard auto-skip for `StepWealth` and `StepPositionsContacts` when era is `wild_west`.
- Equipment catalog (~60 items) + weapons catalog (~35 weapons) added to the existing `equipmentV2.ts` / `weaponsV2.ts` files with era-flag.
- Portrait pipeline: era-aware `Layer 0`, new `CLOTHING_BY_CHIP` for WW, single default background chip "Pustynia (rozmyta)" + custom field, default clothing chip derived from purchased equipment (with spending-level fallback).
- Admin invite code dropdown gains `wild_west` option.
- Edge function (`player/index.ts`) accepts WW occupations and equipment; honors the wealth/contacts skip in submission validation.

**Out (deferred to future iterations):**
- Civil War Veteran perk.
- `gore_immunity` mechanic on occupations.
- Ethnicity chip in portrait panel (handled via `appearance_description` / Korekty for now).
- Backporting equipment-driven clothing chip to 1920s.
- Occupation categories for WW (intentional simplification — alphabetical single list).
- Adding extra background chips for WW.

## Architecture

Approach **A** — `wild_west` is the fourth value of the existing `Era` union, not an orthogonal "variant" axis. Skills, occupations, weapons, and equipment use the same types as 1920s with new optional fields (`baseByEra`, `specializationsByEra`, `era` on individual entries / combat specializations).

Wizard `WizardShell.tsx` already has direction-aware auto-skip logic driven by `serverCharacter` flags. We extend it with two new conditions:
- Skip `StepWealth` (currently "Podział dobytku") if `era === 'wild_west'`.
- Skip `StepPositionsContacts` if `era === 'wild_west'`.

**Wealth math for WW** uses `calculateWealth(era, cr)` from `src/data/eras.ts` (era-aware function) — NOT `calcBaseWealth` from `src/data/wealthV2.ts` (1920s-specific, tied to lokum/transport/lifestyle presets). `calculateWealth('wild_west', cr)` returns `{ assets, cash, spending }` directly from `ERAS.wild_west.wealthTable`. Because `housingOptions`/`lifestyleOptions`/`transportOptions` arrays are empty for WW, no preset step renders. `assets` becomes the player's equipment-purchase budget in `StepEquipment` (WW branch). `cash` is displayed on the card as "Gotówka". `spending_level` is normalized to `$N` form per migration 023 (BUG-067).

The pre-existing 1920s `calcBaseWealth` / `calcCosts` / `generatePresets` machinery in `wealthV2.ts` stays untouched — 1920s flow keeps using it. WW takes a separate, simpler path through `eras.ts`.

`OCCUPATIONS` (1920s) and `OCCUPATIONS_WILD_WEST` are separate arrays. Lookups (`getOccupationById`) must consult both. Existing 1920s occupations remain categorized; WW occupations render as a single alphabetical list (no category filter in WW view).

**ID namespacing rule (important — prevents catalog collisions):**

- **Occupations** — all WW occupation IDs are prefixed with `ww_` (e.g. `ww_lekarz`, `ww_prawnik`). Reason: 10 of 26 plain Polish IDs collide with existing 1920s occupations (`prawnik`, `lekarz`, `naukowiec`, `artysta`, `dziennikarz`, `hazardzista`, `farmer`, `kowboj`, `wloczega`, `duchowny`). Prefix eliminates ambiguity in `getOccupationByIdAnyEra` lookups, character export, PDF rendering, and admin editing.
- **Weapons** — all WW weapon IDs prefixed `ww_` (already reflected in catalog table below).
- **Equipment** — all WW equipment item IDs prefixed `ww_` (e.g. `ww_kapelusz`, `ww_kon_wierzchowy`). Reason: avoids semantic collisions like `noz_bojowy` (1920s combat knife) vs `ww_bowie_knife`.
- **Skills** — no prefix needed. The `era[]` whitelist scopes new skills (`powozenie`, `hazard`, `jezyk_indianski`, `wladanie_lina`, `pulapki`) to WW; verified that none of these IDs exist in 1920s catalog.

The portrait `buildPlayerPortraitPrompt` becomes era-aware: `Layer 0` constants and `CLOTHING_BY_CHIP` matrix branch on `era`. `BACKGROUND_CHIPS` exposes a WW-specific subset (one default chip) plus the existing `fields.background` override. Old admin-side `generateArtPrompt` only gets a new entry in `ERA_STYLE` (`wild_west`).

## Type changes

```ts
// src/types/common.ts
export type Era = 'classic_1920s' | 'modern' | 'gaslight' | 'wild_west'
```

```ts
// src/types/skill.ts (or src/data/skills.ts where types live)
export interface Skill {
  id: string
  name: string
  base: number | 'half_dex' | 'edu'
  baseByEra?: Partial<Record<Era, number>>      // NEW — overrides `base` for that era
  category: SkillCategory
  era?: Era[]                                    // existing — era whitelist
  rare?: boolean
  specializations?: string[]
  specializationsByEra?: Partial<Record<Era, string[]>>  // NEW — overrides `specializations` for that era
  combatSpecializations?: CombatSpec[]
}

export interface CombatSpec {
  id: string
  name: string
  base: number
  rare?: boolean
  era?: Era[]                                    // NEW — era whitelist for this specialization
}
```

```ts
// src/data/eras.ts — EraDefinition gains a skip flag (optional, used by wizard)
export interface EraDefinition {
  id: Era
  name: string
  description: string
  currency: string
  wealthTable: WealthBracket[]
  skipWealthStep?: boolean       // NEW — true for wild_west
  skipContactsStep?: boolean     // NEW — true for wild_west
}
```

**`WeaponV2`** — `malfunction?: number` already exists. Extend with `era?: Era[]` and `rare?: boolean`. Verified shape (`src/data/weaponsV2.ts`): `id`, `name`, `price`, `damage`, `range`, `ammo`, `malfunction?`, `category` (`'melee' | 'handgun' | 'rifle' | 'shotgun'`), `skillId`. Pre-existing 1920s entries get **`era: ['classic_1920s', 'modern', 'gaslight']`** — they remain visible to those three eras, hidden from WW. New WW entries get `era: ['wild_west']`. `rare` defaults false; new WW entries set true where book availability is R/VR.

**`EquipmentItemV2`** — current shape (`src/data/equipmentV2.ts`) is `id`, `name`, `price`, `category`, `dailyMaintenance?`. Extend with `era?: Era[]`. Pre-existing 1920s entries get **`era: ['classic_1920s', 'modern', 'gaslight']`** (same logic as weapons — visible to non-WW eras). New WW entries get `era: ['wild_west']`.

**Filter rule:** `StepEquipment` filters both catalogs by current character era — `catalog.filter(it => !it.era || it.era.includes(charEra))`. Items without `era` (none after this migration, but the predicate is safe) remain visible everywhere.

**`EQUIPMENT_CATEGORIES_V2`** — current 10 (`vehicles`, `light`, `optics`, `photo`, `communication`, `travel`, `tools`, `medical`, `explosives`, `misc`). Add 4 new for WW: `clothing` "Odzież", `food` "Prowiant", `entertainment` "Rozrywka", `livestock` "Dobytek". Also extend `EQUIPMENT_CATEGORY_LABELS`.

**Equipment variants** (słaby/przeciętny/b. dobry) follow the **pre-existing 1920s pattern of separate entries per quality tier** (e.g. `zuzyty_motocykl` / `motocykl` / `swietny_motocykl`). WW examples:
- Buty → `ww_buty_slabe` ($3), `ww_buty_przecietne` ($10), `ww_buty_bardzo_dobre` ($20)
- Kapelusz → `ww_kapelusz_slaby` ($2), `ww_kapelusz_przecietny` ($7), `ww_kapelusz_bardzo_dobry` ($15)
- Sukienka → `ww_sukienka_przecietna` ($2), `ww_sukienka_bardzo_dobra` ($10)

Single-variant items keep the base ID (`ww_pas`, `ww_szelki`).

**`Occupation` interface** — no change. `gore_immunity` out of scope.

## Wealth table (`ERAS.wild_west`)

Currency `$`. Polish bracket labels reuse the 1920s names except Super Rich.

| CR min-max | Label PL | assetMultiplier | cashMultiplier | assetsFixed | cashFixed | spending |
|---|---|---|---|---|---|---|
| 0 | Ubogi | 0 | 0 | 0 | 0.25 | 0.25 |
| 1–9 | Biedny | 5 | 0.5 | — | — | 1 |
| 10–49 | Przeciętnie majętny | 25 | 1 | — | — | 5 |
| 50–89 | Zamożny | 250 | 3 | — | — | 25 |
| 90–98 | Bogaty | 1000 | 10 | — | — | 125 |
| 99 | **Krezus** | 0 | 0 | 2500000 | 25000 | 2500 |

`housingOptions: []`, `lifestyleOptions: []`, `transportOptions: []` for every bracket. `skipWealthStep: true`, `skipContactsStep: true` on the era definition.

Admin caps CR via existing `max_skill_value` on invite code (typically 30 — yields max assets $750 for Average bracket).

## Skill catalog — changes vs 1920s

### A. Skills mapped 1:1 (32 skills, no change)

Antropologia, Archeologia, Charakteryzacja, Gadanina, Hipnoza (rare), Historia, Język Ojczysty, Korzystanie z Bibliotek, Księgowość, Medycyna, Mity Cthulhu, Nasłuchiwanie, Nawigacja, Nurkowanie (rare), Obsługa Ciężkiego Sprzętu, Okultyzm, Perswazja, Pierwsza Pomoc, Pływanie, Prawo, Psychologia, Rzucanie, Skakanie, Spostrzegawczość, Sztuka/Rzemiosło, Sztuka Przetrwania, Ślusarstwo, Tropienie, Ukrywanie, Unik, Urok Osobisty, Walka Wręcz, Wspinaczka, Wycena, Wiedza Tajemna (rare), Zastraszanie, Zręczne Palce.

(Mity Cthulhu, Walka Wręcz, Sztuka/Rzemiosło, Nauka, Sztuka Przetrwania, Język Obcy, Pilotowanie, Broń Palna also receive per-era adjustments below.)

### B. Skills with `baseByEra` overrides for WW

| Polish ID | Display | base (1920s) | baseByEra.wild_west |
|---|---|---|---|
| `jezdziectwo` | Jeździectwo | 5 | **15** |
| `wiedza_o_naturze` | Wiedza o Naturze | 10 | **20** |
| `prowadzenie_samochodu` | Prowadzenie Samochodu | 20 | **0** |
| `elektryka` | Elektryka | 10 | **0** |

### C. Skills with `era[]` whitelist excluding `wild_west`

| Polish ID | Display | era[] |
|---|---|---|
| `psychoanaliza` | Psychoanaliza | `['classic_1920s','modern','gaslight']` |
| `czytanie_z_ruchu_warg` | Czytanie z Ruchu Warg | `['classic_1920s','modern','gaslight']` |
| `luk` | Łuk (standalone duplicate of `bron_palna:luk_kusza`) | `['classic_1920s','modern','gaslight']` |
| `elektronika` | Elektronika | (already `['modern']`, no change) |
| `korzystanie_z_komputerow` | Korzystanie z Komputerów | (already `['modern']`, no change) |

### D. Skills with `specializationsByEra` overrides for WW

**`sztuka_przetrwania`** WW: `['Góry', 'Las', 'Pustynia', 'Preria']` (was `['Arktyka', 'Góry', 'Las', 'Morze', 'Pustynia']`).

**`nauka`** WW: remove `Kryminalistyka`, `Kryptografia`, `Medycyna Sądowa`; add `Paleontologia`.

**`sztuka_rzemioslo`** WW: remove `Maszynopisanie`, `Spawanie`, `Stenografia`, `Hydraulika`; add `Telegrafia`, `Kowalstwo`, `Garbarstwo`, `Bednarstwo`.

**`jezyk_obcy`** WW: `['Angielski', 'Francuski', 'Hiszpański', 'Niemiecki', 'Chiński', 'Łacina']`.

**`pilotowanie`** WW: `['Łódź']` only.

### E. Combat specialization changes

**`bron_palna.combatSpecializations`** — add `era` whitelist on `pistolet_maszynowy`:

```ts
{ id: 'pistolet_maszynowy', name: 'Pistolet Maszynowy', base: 15,
  era: ['classic_1920s', 'modern', 'gaslight'] }   // hidden in WW
```

`krotka`, `karabin_strzelba`, `luk_kusza`, `bron_ciezka` remain available in WW.

**`walka_wrecz.combatSpecializations`** — add two new WW-only:

```ts
{ id: 'bicz', name: 'Bicz', base: 5, era: ['wild_west'] }
{ id: 'lasso', name: 'Lasso', base: 5, era: ['wild_west'] }
```

### F. New top-level skills (visible in WW only via `era`)

| ID | Polish display | Base | Category | `era` |
|---|---|---|---|---|
| `powozenie` | Powożenie | 20 | practical | `['wild_west']` |
| `hazard` | Hazard | 10 | social | `['wild_west']` |
| `jezyk_indianski` | Język Indiański | 1 | academic | `['wild_west']` |
| `wladanie_lina` | Władanie Liną | 5 | practical | `['wild_west']` |
| `pulapki` | Pułapki | 10 | practical | `['wild_west']` |

`jezyk_indianski` has no specializations (single language per user decision).

### G. Other tweaks

`tresura_zwierzat.rare` is **removed globally** (per user decision, not just for WW).

## Occupation catalog (`data/occupationsWildWest.ts`)

26 occupations, no categories. Rendered alphabetically in `StepOccupation` when era is `wild_west`. Polish display names per user-confirmed table.

`special.gore_immunity` is intentionally NOT modeled — narrative text on the Keeper side handles it.

Two interpersonal-skill choices encode as two `choice:1:urok_osobisty,gadanina,zastraszanie,perswazja` entries (player picks two different — `StepOccupationSkills` must enforce uniqueness across `choice:1:` entries that share an option list; Packet 3 worker extends if missing).

Three-alternative `skill_formula.alternatives` (Hobo, Outlaw, Scout) extend the existing `alternatives: string[]` field — `StepCharacteristics` must render N≥3 alternative characteristic picks (Packet 3 worker extends if current renderer hardcodes 2).

### Occupation table

**Reminder:** every ID column entry below MUST be prefixed with `ww_` at implementation time (per the namespacing rule above). The table omits the prefix for readability.

(Format: ID — display — OSP formula — CR range — skill list.)

| ID | Display | OSP | CR | Skills |
|---|---|---|---|---|
| `artysta` | Artysta | EDU×2 + (DEX×2 OR POW×2) | 6–60 | `sztuka_rzemioslo`, `historia`, `korzystanie_z_bibliotek`, `psychologia`, `spostrzegawczosc`, `zreczne_palce`, `any`, `any` |
| `bandyta` | Bandyta | EDU×2 + (APP×2 OR DEX×2 OR INT×2) | 6–70 | `choice:1:walka_wrecz:bijatyka,walka_wrecz:dluga_ostra,walka_wrecz:bron_obuchowa`, `choice:1:bron_palna:krotka,bron_palna:karabin_strzelba,bron_palna:luk_kusza`, `jezdziectwo`, `ukrywanie`, `choice:1:urok_osobisty,gadanina,zastraszanie,perswazja`, `choice:1:slusarstwo,mechanika`, `choice:1:psychologia,zreczne_palce`, `spostrzegawczosc` |
| `artysta_sceniczny` | Artysta Sceniczny | EDU×2 + APP×2 | 9–60 | `sztuka_rzemioslo`, `charakteryzacja`, `choice:1:urok_osobisty,gadanina,zastraszanie,perswazja`, `choice:1:urok_osobisty,gadanina,zastraszanie,perswazja`, `nasluchiwanie`, `psychologia`, `any`, `any` |
| `duchowny` | Duchowny | EDU×2 + APP×2 | 9–60 | `historia`, `korzystanie_z_bibliotek`, `nasluchiwanie`, `okultyzm`, `jezyk_obcy`, `choice:1:urok_osobisty,gadanina,zastraszanie,perswazja`, `psychologia`, `any` |
| `dziennikarz` | Dziennikarz/Pisarz | EDU×2 + INT×2 | 9–60 | `sztuka_rzemioslo`, `choice:1:urok_osobisty,gadanina,zastraszanie,perswazja`, `historia`, `korzystanie_z_bibliotek`, `psychologia`, `spostrzegawczosc`, `any`, `any` |
| `farmer` | Farmer | EDU×2 + (STR×2 OR CON×2) | 9–50 | `sztuka_rzemioslo:Rolnictwo i Hodowla`, `bron_palna:karabin_strzelba`, `powozenie`, `pierwsza_pomoc`, `skakanie`, `mechanika`, `wiedza_o_naturze`, `jezdziectwo` |
| `hazardzista` | Hazardzista | EDU×2 + (POW×2 OR DEX×2) | 10–60 | `ksiegowosc`, `hazard`, `nasluchiwanie`, `psychologia`, `zreczne_palce`, `spostrzegawczosc`, `choice:1:urok_osobisty,gadanina,perswazja`, `any` |
| `kowboj` | Kowboj | EDU×2 + (STR×2 OR DEX×2) | 9–20 | `unik`, `choice:1:bron_palna:krotka,bron_palna:karabin_strzelba`, `pierwsza_pomoc`, `skakanie`, `wiedza_o_naturze`, `jezdziectwo`, `wladanie_lina`, `tropienie` |
| `kupiec` | Kupiec | EDU×2 + (APP×2 OR INT×2) | 20–60 | `ksiegowosc`, `wycena`, `psychologia`, `spostrzegawczosc`, `choice:1:urok_osobisty,gadanina,zastraszanie,perswazja`, `choice:1:urok_osobisty,gadanina,zastraszanie,perswazja`, `any`, `any` |
| `kurier` | Kurier | EDU×2 + (CON×2 OR DEX×2) | 20–60 | `ksiegowosc`, `powozenie`, `gadanina`, `choice:1:bron_palna:krotka,bron_palna:karabin_strzelba,bron_palna:luk_kusza`, `mechanika`, `wiedza_o_naturze`, `nawigacja`, `jezdziectwo` |
| `lekarz` | Lekarz | EDU×4 | 30–80 | `ksiegowosc`, `pierwsza_pomoc`, `medycyna`, `jezyk_obcy:Łacina`, `psychologia`, `nauka:Biologia`, `nauka:Farmacja`, `any` |
| `naukowiec` | Naukowiec | EDU×4 | 20–80 | `historia`, `prawo`, `korzystanie_z_bibliotek`, `mechanika`, `obsluga_ciezkiego_sprzetu`, `any`, `any`, `any` |
| `oszust` | Oszust | EDU×2 + APP×2 | 10–80 | `charakteryzacja`, `unik`, `nasluchiwanie`, `psychologia`, `zreczne_palce`, `spostrzegawczosc`, `choice:1:urok_osobisty,gadanina,zastraszanie,perswazja`, `choice:1:urok_osobisty,gadanina,zastraszanie,perswazja` |
| `polityk` | Polityk | EDU×2 + (APP×2 OR INT×2) | 10–99 | `historia`, `prawo`, `nasluchiwanie`, `psychologia`, `urok_osobisty`, `perswazja`, `any`, `any` |
| `poszukiwacz` | Poszukiwacz Złota | EDU×2 + (STR×2 OR DEX×2) | 5–60 | `wspinaczka`, `pierwsza_pomoc`, `mechanika`, `wiedza_o_naturze`, `nawigacja`, `nauka:Geologia`, `spostrzegawczosc`, `any` |
| `prawnik` | Prawnik | EDU×4 | 20–80 | `ksiegowosc`, `prawo`, `korzystanie_z_bibliotek`, `choice:1:urok_osobisty,gadanina,zastraszanie,perswazja`, `choice:1:urok_osobisty,gadanina,zastraszanie,perswazja`, `psychologia`, `any`, `any` |
| `ranczer` | Ranczer | EDU×2 + (STR×2 OR INT×2) | 50–99 | `ksiegowosc`, `prawo`, `wiedza_o_naturze`, `perswazja`, `jezdziectwo`, `wladanie_lina`, `spostrzegawczosc`, `any` |
| `rewolwerowiec` | Rewolwerowiec | EDU×2 + DEX×2 | 9–70 | `walka_wrecz:bijatyka`, `choice:1:bron_palna:krotka,bron_palna:karabin_strzelba,bron_palna:luk_kusza`, `choice:1:bron_palna:krotka,bron_palna:karabin_strzelba,bron_palna:luk_kusza`, `jezdziectwo`, `ukrywanie`, `spostrzegawczosc`, `tropienie`, `choice:1:urok_osobisty,gadanina,zastraszanie,perswazja` |
| `robotnik` | Robotnik | EDU×2 + STR×2 | 5–20 | `wspinaczka`, `walka_wrecz:bijatyka`, `skakanie`, `wiedza_o_naturze`, `ukrywanie`, `rzucanie`, `choice:1:urok_osobisty,gadanina,zastraszanie,perswazja`, `any` |
| `rzemieslnik` | Rzemieślnik | EDU×2 + DEX×2 | 10–70 | `ksiegowosc`, `sztuka_rzemioslo`, `powozenie`, `mechanika`, `perswazja`, `any`, `any`, `any` |
| `straznik_prawa` | Strażnik Prawa | EDU×2 + (STR×2 OR DEX×2) | 20–70 | `walka_wrecz:bijatyka`, `choice:1:bron_palna:krotka,bron_palna:karabin_strzelba,bron_palna:luk_kusza`, `prawo`, `choice:1:zastraszanie,perswazja`, `psychologia`, `jezdziectwo`, `spostrzegawczosc`, `tropienie` |
| `uczony` | Uczony | EDU×4 | 10–50 | `korzystanie_z_bibliotek`, `jezyk_obcy`, `choice:1:perswazja,zastraszanie`, `psychologia`, `nauka`, `any`, `any`, `any` |
| `wloczega` | Włóczęga | EDU×2 + (APP×2 OR DEX×2 OR STR×2) | 0–6 | `wspinaczka`, `gadanina`, `skakanie`, `nasluchiwanie`, `wiedza_o_naturze`, `nawigacja`, `ukrywanie`, `any` |
| `zoltodziob` | Żółtodziób ze Wschodu | EDU×2 + (APP×2 OR CON×2) | 50–99 | `sztuka_rzemioslo`, `nasluchiwanie`, `jezyk_obcy`, `jezdziectwo`, `choice:1:urok_osobisty,gadanina,zastraszanie,perswazja`, `any`, `any`, `any` |
| `zolnierz` | Żołnierz | EDU×2 + (STR×2 OR DEX×2) | 10–70 | `wspinaczka`, `choice:1:walka_wrecz:bijatyka,walka_wrecz:dluga_ostra,walka_wrecz:bron_obuchowa`, `bron_palna:karabin_strzelba`, `pierwsza_pomoc`, `choice:1:mechanika,wiedza_o_naturze`, `ukrywanie`, `rzucanie`, `any` |
| `zwiadowca` | Zwiadowca | EDU×2 + (STR×2 OR DEX×2 OR CON×2) | 0–20 | `choice:1:bron_palna:krotka,bron_palna:karabin_strzelba,bron_palna:luk_kusza`, `pierwsza_pomoc`, `wiedza_o_naturze`, `nawigacja`, `jezdziectwo`, `ukrywanie`, `tropienie`, `pulapki` |

**Syntax notes** (consistent with 1920s catalog):
- `'sztuka_rzemioslo'`, `'nauka'`, `'jezyk_obcy'`, `'pilotowanie'` — bare skill name with no `:specialization` suffix means "player picks the specialization in the wizard UI". Repeating the same skill twice (e.g. `'nauka', 'nauka'` for Lekarz Doctor's Biology+Pharmacy) means "two different specializations". For Lekarz where both specializations are predetermined, we use the explicit form `'nauka:Biologia', 'nauka:Farmacja'`.
- `'any'` — player picks any skill from the era-filtered catalog as a personal/era specialty.
- `'choice:1:X,Y,Z'` — player picks exactly one from the listed options.
- All `choice:1:bron_palna:*` entries use only `krotka`, `karabin_strzelba`, `luk_kusza` (no `pistolet_maszynowy`, no `bron_ciezka`) per WW availability.

## Equipment catalog (`data/equipmentV2.ts` — `era: ['wild_west']` flag on each entry)

Items below are appended to the existing `EQUIPMENT_CATALOG_V2` array, each with `era: ['wild_west']`. Existing 1920s entries get a bulk-update to `era: ['classic_1920s']`. Categories use the extended set defined in the Type changes section.

**ID convention:** `ww_<thing>` for single-variant items, `ww_<thing>_<wariant>` for variants (`slaby` / `przecietny` / `bardzo_dobry`).

Section headings below are also the suggested `category` for those items.

### Odzież (`category: 'clothing'`)

| Polish name | id | Price |
|---|---|---|
| Pas | `ww_pas` | $0.75 |
| Buty (słaby) | `ww_buty_slabe` | $3 |
| Buty (przeciętny) | `ww_buty_przecietne` | $10 |
| Buty (b. dobry) | `ww_buty_bardzo_dobre` | $20 |
| Buty kowbojskie szyte na miarę (przeciętny) | `ww_buty_kowbojskie_przecietne` | $15 |
| Buty kowbojskie szyte na miarę (b. dobry) | `ww_buty_kowbojskie_bardzo_dobre` | $25 |
| Płaszcz z bawolej skóry | `ww_plaszcz_bawoli` | $10 |
| Pas na naboje | `ww_pas_na_naboje` | $1 |
| Płaszcz wełniany | `ww_plaszcz_welniany` | $8 |
| Kamizelka materiałowa | `ww_kamizelka_materialowa` | $1 |
| Sukienka (przeciętna) | `ww_sukienka_przecietna` | $2 |
| Sukienka (b. dobra) | `ww_sukienka_bardzo_dobra` | $10 |
| Płaszcz futrzany | `ww_plaszcz_futrzany` | $15 |
| Kapelusz (słaby) | `ww_kapelusz_slaby` | $2 |
| Kapelusz (przeciętny) | `ww_kapelusz_przecietny` | $7 |
| Kapelusz (b. dobry) | `ww_kapelusz_bardzo_dobry` | $15 |
| Kamizelka skórzana | `ww_kamizelka_skorzana` | $3 |
| Lniany duster | `ww_lniany_duster` | $2 |
| Koszula (przeciętna) | `ww_koszula_przecietna` | $0.50 |
| Koszula (b. dobra) | `ww_koszula_bardzo_dobra` | $2 |
| Stetson "Boss" | `ww_stetson_boss` | $5 |
| Garnitur (przeciętny) | `ww_garnitur_przecietny` | $12 |
| Garnitur (b. dobry) | `ww_garnitur_bardzo_dobry` | $25 |
| Szelki | `ww_szelki` | $0.50 |
| Ostrogi (słabe) | `ww_ostrogi_slabe` | $0.15 |
| Ostrogi (przeciętne) | `ww_ostrogi_przecietne` | $2 |
| Ostrogi (b. dobre) | `ww_ostrogi_bardzo_dobre` | $10 |
| Eleganckie buty | `ww_eleganckie_buty` | $2.50 |
| Spodnie | `ww_spodnie` | $1.50 |

### Rozrywka i przedmioty osobiste (`category: 'entertainment'`)

| Polish name | id | Price |
|---|---|---|
| Banjo | `ww_banjo` | $7 |
| Książka oprawna | `ww_ksiazka_oprawna` | $0.50 |
| Kości (para) | `ww_kosci_para` | $0.10 |
| Kości fałszowane | `ww_kosci_falszowane` | $5 |
| Gitara | `ww_gitara` | $5 |
| Harmonijka | `ww_harmonijka` | $0.25 |
| Powieść broszurowa | `ww_powiesc_broszurowa` | $0.10 |
| Karty do gry | `ww_karty_do_gry` | $0.25 |
| Karty znaczone | `ww_karty_znaczone` | $1.25 |
| Skrzypce | `ww_skrzypce` | $9 |
| Butelka whisky | `ww_butelka_whisky` | $2 |

### Sprzęt medyczny (`category: 'medical'`)

| Polish name | id | Price |
|---|---|---|
| Torba lekarska z narzędziami | `ww_torba_lekarska` | $25 |
| Laudanum (4 uncje) | `ww_laudanum` | $0.35 |

### Sprzęt podróżny (`category: 'travel'`)

| Polish name | id | Price |
|---|---|---|
| Rolka pościelowa | `ww_rolka_poscielowa` | $4 |
| Lornetka (przeciętna) | `ww_lornetka_przecietna` | $10 |
| Lornetka (b. dobra) | `ww_lornetka_bardzo_dobra` | $25 |
| Koc | `ww_koc` | $3 |
| Pudełko zapałek | `ww_pudelko_zapalek` | $0.10 |
| Manierka | `ww_manierka` | $0.50 |
| Dzbanek na kawę | `ww_dzbanek_na_kawe` | $1 |
| Kompas | `ww_kompas` | $2 |
| Zestaw toaletowy dżentelmena | `ww_zestaw_toaletowy` | $1 |
| Kociołek mosiężny (4 galony) | `ww_kociolek_mosiezny` | $3 |
| Lampa naftowa | `ww_lampa_naftowa` | $1.50 |
| Parasolka jedwabna | `ww_parasolka_jedwabna` | $1 |
| Namiot jednoosobowy | `ww_namiot_1` | $5 |
| Namiot trzyosobowy | `ww_namiot_3` | $9 |
| Racje na tydzień | `ww_racje_tygodniowe` | $1.50 |
| Wnyki na wilki | `ww_wnyki_wilki` | $2 |
| Wnyki na niedźwiedzia | `ww_wnyki_niedzwiedz` | $10 |
| Kufer podróżny (mały) — przeciętny | `ww_kufer_maly_przecietny` | $4 |
| Kufer podróżny (mały) — b. dobry | `ww_kufer_maly_bardzo_dobry` | $10 |
| Kufer podróżny (duży) — przeciętny | `ww_kufer_duzy_przecietny` | $10 |
| Kufer podróżny (duży) — b. dobry | `ww_kufer_duzy_bardzo_dobry` | $25 |

### Prowiant (`category: 'food'`)

| Polish name | id | Price |
|---|---|---|
| Bekon (10 funtów) | `ww_bekon` | $0.60 |
| Kawa (2 funty) | `ww_kawa` | $0.50 |
| Worek mąki (50 funtów) | `ww_maka` | $4 |
| Cukier (1 funt) | `ww_cukier` | $0.10 |

### Narzędzia (`category: 'tools'`)

| Polish name | id | Price |
|---|---|---|
| Siekiera (narzędzie) | `ww_siekiera_tool` | $1 |
| Narzędzia kowalskie | `ww_narzedzia_kowalskie` | $15 |
| Spłonki górnicze (tuzin) | `ww_splonki` | $1 |
| Laska dynamitu (narzędzie) | `ww_dynamit_tool` | $0.25 |
| Detonator elektryczny | `ww_detonator` | $5 |
| Lont (jard) | `ww_lont_jard` | $0.05 |
| Młotek | `ww_mlotek` | $0.50 |
| Toporek | `ww_toporek` | $0.75 |
| Nafta (galon) | `ww_nafta` | $3 |
| Latarnia | `ww_latarnia` | $0.80 |
| Nitrogliceryna (uncja) | `ww_nitrogliceryna` | $0.50 |
| Kilof | `ww_kilof` | $0.75 |
| Scyzoryk | `ww_scyzoryk` | $0.50 |
| Lina (jard) | `ww_lina_jard` | $0.05 |
| Luneta | `ww_luneta` | $10 |
| Łopata | `ww_lopata` | $0.50 |

Notes: `ww_siekiera_tool` and `ww_dynamit_tool` distinct from their weapon counterparts (`ww_siekiera`, `ww_dynamite_stick`) which live in the weapons catalog.

### Transport — zwierzęta + pojazdy (`category: 'vehicles'`)

| Polish name | id | Price |
|---|---|---|
| Osiołek | `ww_osiolek` | $30 |
| Koń pociągowy | `ww_kon_pociagowy` | $60 |
| Koń wierzchowy (słaby) | `ww_kon_wierzchowy_slaby` | $30 |
| Koń wierzchowy (przeciętny) | `ww_kon_wierzchowy_przecietny` | $100 |
| Koń wierzchowy (b. dobry) | `ww_kon_wierzchowy_bardzo_dobry` | $200 |
| Muł | `ww_mul` | $80 |
| Wół | `ww_wol` | $75 |
| Kucyk | `ww_kucyk` | $50 |
| Juki | `ww_juki` | $3 |
| Siodło/uzda/derka (przeciętne) | `ww_siodlo_przecietne` | $30 |
| Siodło/uzda/derka (b. dobre) | `ww_siodlo_bardzo_dobre` | $70 |
| Bryczka 2-osobowa (przeciętna) | `ww_bryczka_przecietna` | $30 |
| Bryczka 2-osobowa (b. dobra) | `ww_bryczka_bardzo_dobra` | $60 |
| Surrey 4-osobowy (słaby) | `ww_surrey_slaby` | $50 |
| Surrey 4-osobowy (przeciętny) | `ww_surrey_przecietny` | $100 |
| Surrey 4-osobowy (b. dobry) | `ww_surrey_bardzo_dobry` | $175 |
| Uprząż pojedyncza | `ww_uprzaz_pojedyncza` | $10 |
| Uprząż podwójna | `ww_uprzaz_podwojna` | $25 |
| Ciężki wóz | `ww_wagon_ciezki` | $40 |
| Lekki wóz | `ww_wagon_lekki` | $35 |

### Różne (`category: 'misc'`)

| Polish name | id | Price |
|---|---|---|
| Okulary | `ww_okulary` | $2 |
| Kabura (przeciętna) | `ww_kabura_przecietna` | $1 |
| Kabura (b. dobra) | `ww_kabura_bardzo_dobra` | $5 |
| Kasetka na pieniądze | `ww_kasetka` | $1.35 |
| Zegarek kieszonkowy (przeciętny) | `ww_zegarek_przecietny` | $1 |
| Zegarek kieszonkowy (b. dobry) | `ww_zegarek_bardzo_dobry` | $10 |
| Maszyna do pisania | `ww_maszyna_do_pisania` | $34 |

### Dobytek (`category: 'livestock'`)

| Polish name | id | Price |
|---|---|---|
| Owca | `ww_owca` | $5 |
| Bydło (na targu) | `ww_bydlo` | $30 |
| Cielę | `ww_ciele` | $3 |
| Byczek | `ww_byczek` | $10 |

### Excluded (cut)

Stagecoach, Small printing press, Safe, Gold (raw 1oz, gold bar), Land patent, Underground mines, all services (lodging, dining, communication, fares, baths, shaves).

## Weapon catalog (`data/weaponsV2.ts` — `era: ['wild_west']` flag on each entry)

Use the existing `WeaponV2` shape. `malfunction` field used as is. `category` extended with `'holdout' | 'heavy' | 'explosive'` if needed (or all map to existing four categories — see Implementation packet 5 Q).

Damage notation: polish `K` and `+MO` (matches existing 1920s catalog). `1D8+2+DB` → `1K8+2+MO`.

`rarity` flag: `rare: true` if availability is **R** or **VR**; otherwise `false`. Available info in `description` field (optional).

### Mapping `skill_id` per weapon

- Revolvers + Holdouts → `bron_palna:krotka` (except Remington Rifle Cane → `bron_palna:karabin_strzelba`).
- Rifles + Shotguns → `bron_palna:karabin_strzelba` (no split).
- Gatling Gun → `bron_palna:bron_ciezka`.
- Dynamite → `sztuka_rzemioslo:Materiały Wybuchowe` primary; `rzucanie` is alternate per Keeper (single field — primary only).
- Incendiary Device → `rzucanie`.
- Knife (Arkansas, Bowie), Pałka duża, Płonąca pochodnia, Tomahawk → `walka_wrecz:bijatyka`.
- Siekiera, Szabla, Włócznia/bagnet → `walka_wrecz:dluga_ostra`.
- Łuk → `bron_palna:luk_kusza` (corrects pre-existing bug `walka_wrecz:luk` in 1920s catalog — out of scope to fix; WW just uses the correct one).
- Lasso → `wladanie_lina`.
- Bicz → `walka_wrecz:bicz`.

### Tabela broni — pełna lista

Format: `id` — Polish display, damage, range, ammo, malf, price, rare, `skillId`, category.

#### Rewolwery (`category: 'handgun'`, all `skillId: 'bron_palna:krotka'`)

| id | Display | Damage | Range | Ammo | Malf | Price | Rare |
|---|---|---|---|---|---|---|---|
| `ww_colt_pocket_31` | .31 Colt Pocket | 1K8 | 10 m | 5 | 99 | $9 | false |
| `ww_colt_dragoon_44` | .44 Colt Dragoon | 1K10+2 | 15 m | 6 | 99 | $6 | false |
| `ww_lemat_42` | .42/.20 LeMat Pistol | 1K10+1 | 15 m | 9 | 99 | $17 | true |
| `ww_sw_model1_22` | .22 S&W Model 1 | 1K6 | 15 m | 7 | 99 | $6 | false |
| `ww_colt_army_44` | .44 Colt Army | 1K10+2 | 15 m | 6 | 99 | $14 | false |
| `ww_colt_navy_36` | .36 Colt Navy | 1K8 | 15 m | 6 | 99 | $6 | false |
| `ww_colt_police_36` | .36 Colt Police | 1K8 | 15 m | 5 | 99 | $10 | false |
| `ww_sw_model2_32` | .32 S&W Model 2 | 1K6+1 | 15 m | 6 | 99 | $10 | false |
| `ww_colt_peacemaker_45` | .45 Colt Peacemaker | 1K10+2 | 15 m | 6 | 99 | $10 | false |
| `ww_remington_44_40` | .44-40 Remington | 1K10+2 | 15 m | 6 | 99 | $15 | false |
| `ww_sw_schofield_45` | .45 S&W Schofield | 1K10+2 | 15 m | 6 | 99 | $13 | false |

Note: LeMat secondary shotgun barrel is a single 20-gauge shot — model in description, primary stats above.

#### Broń ukryta / jednostrzałowa (`category: 'handgun'` — except Rifle Cane)

| id | Display | Damage | Range | Ammo | Malf | Price | Rare | skillId |
|---|---|---|---|---|---|---|---|---|
| `ww_derringer_44` | .44 Derringer | 1K10+2 | 3 m | 1 | 99 | $2 | true | `bron_palna:krotka` |
| `ww_colt_1shot_41` | .41 Colt 1-strzał | 1K10+1 | 3 m | 1 | 99 | $3 | false | `bron_palna:krotka` |
| `ww_remington_2shot_41` | .41 Remington 2-strzały | 1K10+1 | 3 m | 2 | 99 | $5 | false | `bron_palna:krotka` |
| `ww_colt_cloverleaf_41` | .41 Colt Cloverleaf | 1K10+1 | 3 m | 4 | 99 | $9 | true | `bron_palna:krotka` |
| `ww_remington_rifle_cane` | .32/.22 Laska-strzelba Remington | 1K8 | 15 m | 1 | 98 | $10 | false | `bron_palna:karabin_strzelba` |

#### Karabiny (`category: 'rifle'`, all `skillId: 'bron_palna:karabin_strzelba'`)

| id | Display | Damage | Range | Ammo | Malf | Price | Rare |
|---|---|---|---|---|---|---|---|
| `ww_hawken_50` | Karabin .50 Hawken Plains | 2K6+4 | 60 m | 1 | 98 | $5 | false |
| `ww_sharps_52` | Karabin .52 Sharps | 2K6+2 | 80 m | 1 | 98 | $12 | false |
| `ww_sharps_carbine_52` | Karabinek .52 Sharps | 2K6+2 | 50 m | 1 | 98 | $11 | false |
| `ww_springfield_58` | Karabin .58 Springfield | 1K10+4 | 60 m | 1 | 95 | $10 | false |
| `ww_henry_44` | Karabin .44 Henry | 2K6+1 | 80 m | 16 | 98 | $17 | false |
| `ww_spencer_carbine_56` | Karabinek .56 Spencer | 2K6+3 | 50 m | 8 | 98 | $18 | false |
| `ww_springfield_trapdoor_50_70` | Karabin .50-70 Springfield Trapdoor | 2K6+4 | 90 m | 1 | 99 | $12 | false |
| `ww_springfield_trapdoor_45_70` | Karabin .45-70 Springfield Trapdoor | 2K6+2 | 100 m | 1 | 99 | $12 | false |
| `ww_winchester_73_44_40` | Karabin/karabinek .44-40 Winchester '73 | 2K6+1 | 80 m | 18 | 98 | $20 | false |
| `ww_sharps_big_50` | Sharps "Big .50" | 3K6 | 100 m | 1 | 99 | $17 | false |
| `ww_winchester_76_45` | Karabin/karabinek .45 Winchester '76 | 2K6+3 | 80 m | 14 | 98 | $22 | false |

#### Strzelby (`category: 'shotgun'`, all `skillId: 'bron_palna:karabin_strzelba'`)

Damage shown as short / medium / long range. Sawed-off costs +$20 over base price and uses short/medium ranges only.

| id | Display | Damage | Range | Ammo | Malf | Price | Rare |
|---|---|---|---|---|---|---|---|
| `ww_shotgun_10` | Strzelba 10-kalibrowa | 4K6+2/2K6+1/1K4 | 10/20/50 m | 2 | 99 | $25 | false |
| `ww_shotgun_12` | Strzelba 12-kalibrowa | 4K6/2K6/1K6 | 10/20/50 m | 2 | 99 | $30 | false |
| `ww_shotgun_16` | Strzelba 16-kalibrowa | 2K6+2/1K6+1/1K4 | 10/20/50 m | 2 | 99 | $35 | false |
| `ww_shotgun_20` | Strzelba 20-kalibrowa | 2K6/1K6/1K3 | 10/20/50 m | 2 | 99 | $40 | false |

#### Broń ciężka i materiały wybuchowe

| id | Display | Damage | Range | Ammo | Malf | Price | Rare | skillId | category |
|---|---|---|---|---|---|---|---|---|---|
| `ww_gatling_58` | Karabin maszynowy Gatling .58 | 2K6+4 | 100 m | 200 | 95 | $120 | true | `bron_palna:bron_ciezka` | `rifle` |
| `ww_dynamite_stick` | Laska dynamitu | 4K10 / 3 jardy | STR stóp | 1 | 98 | $0.25 | true | `sztuka_rzemioslo:Materiały Wybuchowe` | `melee` |
| `ww_incendiary` | Bomba zapalająca | 2K6 + spalenie | STR stóp | 1 | 95 | $1 | false | `rzucanie` | `melee` |

(`incendiary` price set symbolic $1; book "N/A". Dynamite primary skill is Materiały Wybuchowe; Keeper may allow `rzucanie` per situation — single field, primary only.)

**Notation for explosives:** `damage: '4K10 / 3 jardy'` reads as "4K10 obrażeń w promieniu 3 jardów" (4K10 damage within a 3-yard blast radius). `range: 'STR stóp'` is the standard CoC thrown-explosive range — distance in feet equal to the thrower's STR. Both fields are strings (matching `WeaponV2.damage: string` and `range: string`); no parsing required at implementation time.

#### Broń biała / sieczna (`category: 'melee'`)

| id | Display | Damage | Range | Malf | Price | Rare | skillId |
|---|---|---|---|---|---|---|---|
| `ww_arkansas_toothpick` | Wykałaczka z Arkansas | 1K6+MO | dotyk | — | $2 | false | `walka_wrecz:bijatyka` |
| `ww_siekiera` | Siekiera | 1K8+2+MO | dotyk | — | $3 | false | `walka_wrecz:dluga_ostra` |
| `ww_bow_arrows` | Łuk ze strzałami | 1K6+½MO | 30 m | 97 | $5 | false | `bron_palna:luk_kusza` |
| `ww_bowie_knife` | Nóż Bowie | 1K4+2+MO | dotyk | — | $2 | false | `walka_wrecz:bijatyka` |
| `ww_burning_torch` | Płonąca pochodnia | 1K6 + spalenie | dotyk | — | $0.05 | false | `walka_wrecz:bijatyka` |
| `ww_cavalry_saber` | Szabla kawaleryjska | 1K8+1+MO | dotyk | — | $5 | false | `walka_wrecz:dluga_ostra` |
| `ww_club_large` | Pałka duża | 1K8+MO | dotyk | — | $0.02 | false | `walka_wrecz:bijatyka` |
| `ww_lasso` | Lasso | wiązanie | 5 m | 100 | $1.50 | false | `wladanie_lina` |
| `ww_spear_bayonet` | Włócznia / bagnet | 1K8+1+MO | dotyk lub STR jardów | — | $2 | true | `walka_wrecz:dluga_ostra` |
| `ww_tomahawk` | Tomahawk | 1K6+1+MO | dotyk | — | $2 | false | `walka_wrecz:bijatyka` |
| `ww_whip` | Bicz | 1K3+½MO lub wiązanie | 10 m | 100 | $5 | false | `walka_wrecz:bicz` |

Note: `ww_club_large` is a separate entry from 1920s `palka` (which stays at $1). Both kept; era-flag distinguishes which is shown to which era.

## Wizard flow

`WizardShell.tsx` adds two conditions to the existing auto-skip `useEffect`:

```ts
// Pseudocode for the two new skips
if (serverCharacter.era === 'wild_west' && currentStepName === 'wealth') {
  goToStep(nextStepAfter('wealth'))
}
if (serverCharacter.era === 'wild_west' && currentStepName === 'positions_contacts') {
  goToStep(nextStepAfter('positions_contacts'))
}
```

(Real implementation reads `ERAS[era].skipWealthStep` and `.skipContactsStep` from the era definition — keeps the routing config-driven.)

`StepOccupation` reads occupations from `OCCUPATIONS` or `OCCUPATIONS_WILD_WEST` based on era; renders single alphabetical list for WW (no category chips).

`StepCharacteristics` must handle `skill_formula.alternatives` of length 3 (Hobo/Outlaw/Scout). Packet 3 worker extends the renderer if it currently caps at 2.

`StepOccupationSkills` must enforce uniqueness across multiple `choice:1:` entries that share the same option list (the "two interpersonal skills" pattern — picking Charm in the first must remove Charm from the second's options). Packet 3 worker extends if not yet supported.

`StepEquipment` reads `equipmentV2` filtered by `era`; reads `weaponsV2` filtered by `era`. Budget = `assets` from `calculateWealth(era, cr)`.

Soft-zone steps (Backstory, BasicInfo) unchanged.

`StepReview` displays `cash` as "Gotówka", `spending_level` as "$N" (already standard).

## Portrait pipeline

### `ERA_STYLE` (admin path, `generateArtPrompt`)

```ts
wild_west: 'late 1870s-1880s American Old West, frontier era, dusty western town setting'
```

### `Layer 0` constants (player path, `buildPlayerPortraitPrompt`)

Era-aware constants:

```
WW Layer 0:
1880s American frontier photograph, tintype-influenced aesthetics. Half-body portrait, framed tightly from upper chest up to top of head. Hands and any held props visible at the bottom edge of frame if applicable. 3:4 aspect ratio (portrait orientation). Face fills approximately one third of the frame. Photorealistic. High detail on facial features. Dusty, sun-bleached color palette with warm earth tones — desaturated, weathered look, gentle golden cast; color preserved (not sepia, not grayscale). No text, no watermarks, no captions, no borders.
```

Implementation: branch on era in the function body, keep 1920s constants identical to current.

### `CLOTHING_BY_CHIP` for WW

```ts
const CLOTHING_BY_CHIP_WW: Record<'M' | 'F', Record<ClothingChipNonProf, string>> = {
  M: {
    niedbale: 'worn linen shirt with rolled sleeves, suspenders, dusty trousers, frontier laborer look',
    codzienne: 'cotton shirt with vest, neckerchief, sturdy trousers, wide-brimmed hat, Old West cowhand attire',
    eleganckie: 'dark frock coat with waistcoat, white collar shirt, bow tie, gold pocket watch chain, 1880s gentleman attire',
  },
  F: {
    niedbale: 'plain cotton blouse, ankle-length skirt, apron, hair tied back, frontier homestead look',
    codzienne: 'calico day dress with high collar, hair in modest bun, prairie style',
    eleganckie: 'Victorian bustle dress with fitted bodice, lace collar, 1880s evening wear',
  },
}
```

`zawodowe` chip in WW: `clothing typical for a {occupationEn} in 1880s American Old West`.

Default ethnicity in prompt baseline: anglo-saxon. Player overrides via `appearance_description` and Korekty.

### `BACKGROUND_CHIPS` for WW

Single default chip:

```ts
{ id: 'pustynia', label: 'Pustynia (rozmyta)',
  fragment: 'blurred desert landscape, dust haze, distant mesas, soft warm tones' }
```

`fields.background` override remains; player can type any custom background.

### `LIGHTING_FRAGMENTS`

Unchanged (3 chips: hollywood, natural, noir — all era-neutral).

### `defaultClothingChip` derived from equipment (WW)

New helper, used in WW only:

```ts
function defaultClothingChipWildWest(
  equipment: string[],
  spending_level: string | undefined,
): ClothingChip {
  const norm = equipment.map((e) => e.toLowerCase())
  const has = (substr: string) => norm.some((e) => e.includes(substr.toLowerCase()))

  if (has('garnitur') || has('stetson') || has('płaszcz futrzany') || has('zegarek kieszonkowy')) {
    return 'eleganckie'
  }
  if (has('buty kowbojskie') || has('kapelusz') || has('pas na naboje') || has('ostrogi')) {
    return 'codzienne'
  }
  if (norm.length > 0) return 'niedbale'

  // Fallback: WW spending levels are dollar amounts
  const sl = parseFloat((spending_level ?? '').replace('$', '').trim())
  if (!isNaN(sl)) {
    if (sl >= 25) return 'eleganckie'
    if (sl <= 1) return 'niedbale'
  }
  return 'codzienne'
}
```

1920s `defaultClothingChip` unchanged (spending-level letter A-F). Backporting equipment-driven default to 1920s is **out of scope** (TASK_LIST item).

### Stat hints / visual cues

`buildStatHints` and `buildVisualCues` are era-neutral — no changes.

### `PortraitStatHints.clothing` text for WW spending

`buildStatHints` currently maps `spending_level: 'A'`–`'F'` → Polish hints. For WW spending is `$N` form. Extend `buildStatHints` to:

```ts
// Convert WW $N to 1920s-equivalent tier label for the hint table.
function spendingToTier(sl: string): string {
  const v = parseFloat((sl ?? '').replace('$', '').trim())
  if (isNaN(v)) return ''
  if (v >= 125) return 'A'
  if (v >= 25) return 'B'
  if (v >= 5) return 'C'
  if (v >= 1) return 'D'
  if (v >= 0.25) return 'E'
  return 'F'
}
```

Use this mapping when era is WW. 1920s hint behavior unchanged.

## Edge function (`supabase/functions/player/index.ts`)

- Accept `era: 'wild_west'` in `/start-character` + invite-code-issued payloads.
- `DRAFT_ALLOWLIST` unchanged (already allows the relevant fields).
- `getAgeModifications` / `getAgeRange` era-neutral — unchanged.
- Submission validation: if `era === 'wild_west'`, skip wealth/contacts presence checks (they will not be populated).
- Equipment validation: items with `era: ['wild_west']` flag are valid for WW characters; reject WW items in 1920s draft and vice versa.
- Skill base lookup helper: use `baseByEra` override if present; fall back to `base`.

## Admin

`InviteCodeManager.tsx` — extend the `era` `<select>` with `wild_west` option labeled "Stary Zachód".

No other admin changes required. Existing 1920s codes work unchanged.

## Migration 024 (required)

Verified in `001_initial_schema.sql`: `invite_codes.era TEXT NOT NULL CHECK (era IN ('classic_1920s', 'modern', 'gaslight'))`. Without an ALTER, any insert of a `wild_west` invite code fails the check constraint. `characters.era` has no CHECK and needs no change.

```sql
-- supabase/migrations/024_wild_west_era.sql
BEGIN;

ALTER TABLE public.invite_codes
  DROP CONSTRAINT IF EXISTS invite_codes_era_check;

ALTER TABLE public.invite_codes
  ADD CONSTRAINT invite_codes_era_check
  CHECK (era IN ('classic_1920s', 'modern', 'gaslight', 'wild_west'));

COMMIT;
```

The original CHECK was inline-anonymous (no explicit name) in `001_initial_schema.sql`. Postgres auto-named it `invite_codes_era_check`. `DROP CONSTRAINT IF EXISTS` covers both the anonymous and named cases safely. If Postgres assigned a different auto-name (e.g. `invite_codes_era_check1` after some past ALTER), the worker must inspect with `\d invite_codes` and adapt — NINA QA step.

## Implementation packets (for MANAGER NINA)

Sized to be assignable to individual workers. Each packet has a clear deliverable, ordered roughly by dependency. NINA dispatches in order, evaluates each worker's deliverable against the acceptance criteria, and iterates until green.

### Packet 1 — Types & era definition
**Files:** `src/types/common.ts`, `src/types/skill.ts` (if separate), `src/data/eras.ts`, optional migration 024.
**Deliverable:** `Era` union gains `'wild_west'`. `Skill` interface gets `baseByEra`, `specializationsByEra`. `CombatSpec` gets `era`. `EraDefinition` gets `skipWealthStep`, `skipContactsStep`. `ERAS.wild_west` populated with 6 wealth brackets (empty housing/lifestyle/transport arrays, both skip flags true). DB migration written iff CHECK constraint on era exists.
**Accept:** TypeScript build green; `ERAS.wild_west` returns from `getWealthBracket('wild_west', 60)` with assetMultiplier 250.

### Packet 2 — Skill catalog
**Files:** `src/data/skills.ts`, plus call-site updates in: `src/lib/exportText.ts`, `src/lib/exportCardPdf.ts`, `src/components/shared/CharacterSheet.tsx`, `src/pages/SuccessPage.tsx`, `src/pages/SharedCharacterPage.tsx`, `src/components/wizard/StepReview.tsx`, `src/components/wizard/StepOccupationSkills.tsx`. (Run `grep -r getSkillBase src/` to enumerate.)

**Deliverable:**
- Add 5 new skills (`powozenie`, `hazard`, `jezyk_indianski`, `wladanie_lina`, `pulapki`).
- Add 2 new combat specs to `walka_wrecz` (`bicz`, `lasso`, both `era: ['wild_west']`).
- Set `era` whitelist on `psychoanaliza`, `czytanie_z_ruchu_warg`, `luk`.
- Set `era` on `bron_palna.combatSpecializations.pistolet_maszynowy`.
- Add `baseByEra` to `jezdziectwo`, `wiedza_o_naturze`, `prowadzenie_samochodu`, `elektryka`.
- Add `specializationsByEra` to `sztuka_przetrwania`, `nauka`, `sztuka_rzemioslo`, `jezyk_obcy`, `pilotowanie`.
- Remove `rare: true` from `tresura_zwierzat`.
- **Extend helpers:**
  - `getSkillBase(compositeKey: string, era?: Era)` — prefer `baseByEra[era]` over `base` when present. Backwards-compatible: callers without `era` arg get `base` (1920s default).
  - `getSkillsForEra(era)` — already exists; extend so the returned `Skill[]` has `combatSpecializations` filtered to those whose `era` matches (or is undefined). Use a non-mutating projection (return new objects with a filtered `combatSpecializations` array) — important to not corrupt the source `SKILLS` constant.
  - New `getSpecializationsForSkill(skill: Skill, era: Era): string[]` returns `skill.specializationsByEra?.[era] ?? skill.specializations ?? []`. Used by wizard UI for picklist rendering.
- **Update all `getSkillBase(...)` call sites** to pass the current character's `era` as the second arg. The list above is exhaustive (grep-verified at spec time). Each call site has access to `character.era` (or `serverCharacter.era` in wizard contexts) — thread it through.

**Accept:**
- `getSkillsForEra('wild_west')` returns the right set without `psychoanaliza`/`czytanie_z_ruchu_warg`/`luk`; the returned `bron_palna` has no `pistolet_maszynowy` in `combatSpecializations`.
- `getSkillBase('jezdziectwo', 'wild_west')` returns 15; `getSkillBase('jezdziectwo')` returns 5 (1920s fallback).
- Existing 1920s flow unchanged on the UI — characters keep showing the same skill bases on cards, exports, reviews.
- WW character displays Jeździectwo at base 15 (not 5) end-to-end.

### Packet 3 — Occupation catalog
**Files:** `src/data/occupationsWildWest.ts` (NEW), `src/data/occupations.ts` (lookup helpers extended). Consumers updated in `src/components/wizard/StepOccupation.tsx` and any other place that calls `getOccupationById` / `getOccupationsForEra` (search the repo for both).
**Deliverable:**
- New file `src/data/occupationsWildWest.ts` exporting `OCCUPATIONS_WILD_WEST: Occupation[]` with all 26 entries (IDs all prefixed `ww_*`).
- Existing `getOccupationById(id)` in `occupations.ts` extended to consult both arrays:
  ```ts
  export function getOccupationById(id: string): Occupation | undefined {
    return OCCUPATIONS.find((o) => o.id === id)
      ?? OCCUPATIONS_WILD_WEST.find((o) => o.id === id)
  }
  ```
- Existing `getOccupationsForEra(era)` extended:
  ```ts
  export function getOccupationsForEra(era: Era): Occupation[] {
    if (era === 'wild_west') return OCCUPATIONS_WILD_WEST
    return OCCUPATIONS.filter((o) => !o.era || o.era.includes(era))
  }
  ```
- `StepOccupation` renders alphabetical-by-display when era is WW (no category chips). The category-chip code path stays for 1920s.
- Verify `StepCharacteristics` handles `skill_formula.alternatives` of length 3 (Hobo, Outlaw, Scout). If the current renderer hardcodes 2 (e.g. "X or Y"), extend to "X, Y, or Z".
- Verify `StepOccupationSkills` allows two distinct picks from the same `choice:1:` option list (two interpersonal skills pattern). If not, the second `choice:1:` instance must exclude the value the first selected.
**Accept:** Player creating a WW character sees only 26 WW occupations, alphabetically. Each occupation's skill picks match the spec table. 1920s flow unchanged.

### Packet 4 — Equipment catalog
**Files:** `src/data/equipmentV2.ts`, `src/components/wizard/StepEquipment.tsx`.
**Deliverable:**
- Extend `EquipmentItemV2` interface with `era?: Era[]`.
- Extend `EQUIPMENT_CATEGORIES_V2` and `EQUIPMENT_CATEGORY_LABELS` with `clothing`, `food`, `entertainment`, `livestock`.
- Bulk-set `era: ['classic_1920s', 'modern', 'gaslight']` on every existing entry.
- Append ~85 new WW entries (full table in spec) with `era: ['wild_west']`.
- Add era-filter to `StepEquipment` reads of `EQUIPMENT_CATALOG_V2`: `.filter(it => !it.era || it.era.includes(charEra))`.
**Accept:** Equipment list in `StepEquipment` for a WW draft shows only WW items; for a 1920s/modern/gaslight draft shows only the pre-existing items (no WW pollution).

### Packet 5 — Weapon catalog
**Files:** `src/data/weaponsV2.ts`, `src/components/wizard/StepEquipment.tsx`.
**Deliverable:**
- Extend `WeaponV2` interface with `era?: Era[]` and `rare?: boolean`.
- Bulk-set `era: ['classic_1920s', 'modern', 'gaslight']` on every existing entry.
- Append all WW weapons (full table in spec) with `era: ['wild_west']`, `1K`/`+MO` polish notation, `skillId` per the mapping table, `rare: true` for R/VR.
- Add era-filter to `StepEquipment` reads of `WEAPONS_CATALOG_V2`.
**Accept:** Weapons shown in WW StepEquipment / character sheet are exclusively WW; 1920s/modern/gaslight drafts show only the pre-existing 1920s catalog. Smoke a Colt Peacemaker pick — renders under `bron_palna:krotka`.

### Packet 6 — Wizard WW path (auto-skip + StepEquipment branch)
**Files:** `src/components/wizard/WizardShell.tsx`, `src/components/wizard/StepEquipment.tsx`.

**Deliverable:**

1. **Auto-skip in `WizardShell.tsx`:** Extend the existing direction-aware auto-skip `useEffect` with two new conditions reading `ERAS[era].skipWealthStep` and `.skipContactsStep`. When true, skip the corresponding step in both directions.

2. **`StepEquipment.tsx` WW branch:**
   - Detect `serverCharacter.era === 'wild_west'`.
   - For WW: skip the `generatePresets(majetnosc)` path entirely (1920s-specific, depends on lokum/transport/lifestyle catalogs). Compute the WW budget directly from `calculateWealth('wild_west', cr).assets` where `cr` is the player's committed `majetnosc` skill value.
   - WW budget label: "Budżet (Dobytek): $X" (Polish display). No presets, no lokum/transport/lifestyle widgets.
   - Free-shopping UI: same item-pick list 1920s uses, just no preset suggestions. Player picks items, total cost subtracts from budget, remaining shown.
   - Catalog data already era-filtered by Packet 4/5.

**Accept:** WW draft skips StepWealth + StepPositionsContacts cleanly; lands on StepEquipment with budget = `assets` from `calculateWealth('wild_west', cr)`; picks WW-only catalog items; remaining budget tracked. 1920s draft path unchanged.

### Packet 7 — Edge function adjustments
**Files:** `supabase/functions/player/index.ts`, possibly `supabase/functions/admin/index.ts` if it enforces era-specific validation.
**Deliverable:** Accept `era: 'wild_west'` everywhere `era` is validated. Submission for WW skips wealth/contacts presence checks. Skill base lookups use `baseByEra` when present.
**Accept:** Smoke a WW character end-to-end through draft → submit. Backend returns 200.

### Packet 8 — Portrait pipeline
**Files:** `src/lib/artPrompt.ts`, `src/components/player/GeneratePortraitPanel.tsx`.

**Deliverable:**
- Add `ERA_STYLE.wild_west` (single line — keeps the old `generateArtPrompt` working for any admin path that still uses it).
- Branch `buildPlayerPortraitPrompt` `Layer 0` constants on era. WW gets the tintype/frontier block from this spec; `'classic_1920s' | 'modern' | 'gaslight'` keep the existing hardcoded `'1920s era photograph...'` block (pre-existing behavior — we are not fixing modern/gaslight in this scope).
- Add `CLOTHING_BY_CHIP_WW` matrix; in `buildPlayerPortraitPrompt`, when looking up clothing for a non-`zawodowe` chip, switch the matrix based on `character.era`.
- For `zawodowe` chip in WW, use the WW-specific format string `clothing typical for a {occupationEn} in 1880s American Old West`.
- Add `era?: Era[]` field on `BackgroundChipDef`; tag every existing chip with `era: ['classic_1920s', 'modern', 'gaslight']` (they are 1920s-themed); add the new `pustynia` chip with `era: ['wild_west']`. `BACKGROUND_CHIPS` exposed to the UI is filtered by current character era. `fields.background` override remains available for any era.
- Add helper `defaultClothingChipForEra(era, equipment, spending_level): ClothingChip` that dispatches:
  - `wild_west` → uses the WW-from-equipment algorithm in this spec (with spending-level fallback).
  - else → existing `defaultClothingChip(spending_level)` logic (unchanged).
- Update `GeneratePortraitPanel.tsx` call site `defaultClothingChip(spendingLevel)` → `defaultClothingChipForEra(character.era, character.equipment, spendingLevel)`. Equipment is available in the panel via the character object.
- Extend `buildStatHints` to convert WW `$N` spending levels into the A-F tier label internally before using the existing hint table (helper `spendingToTier` per this spec).
- `OCCUPATION_NAMES_EN` needs entries for all 26 WW occupation IDs (used by `occupationNameEn` for English prompt rendering). Add to `src/data/occupationNamesEn.ts`:

| ID | EN term |
|---|---|
| `ww_artysta` | artist |
| `ww_oszust` | confidence trickster |
| `ww_kowboj` | cowboy |
| `ww_rzemieslnik` | craftsman |
| `ww_zoltodziob` | wealthy easterner |
| `ww_lekarz` | doctor |
| `ww_artysta_sceniczny` | stage performer |
| `ww_kurier` | expressman |
| `ww_farmer` | farmer |
| `ww_hazardzista` | gambler |
| `ww_rewolwerowiec` | gunfighter |
| `ww_wloczega` | drifter |
| `ww_dziennikarz` | journalist |
| `ww_straznik_prawa` | lawman |
| `ww_prawnik` | lawyer |
| `ww_duchowny` | preacher |
| `ww_kupiec` | merchant |
| `ww_poszukiwacz` | prospector |
| `ww_bandyta` | outlaw |
| `ww_polityk` | politician |
| `ww_ranczer` | rancher |
| `ww_uczony` | scholar |
| `ww_naukowiec` | scientist |
| `ww_zwiadowca` | scout |
| `ww_zolnierz` | soldier |
| `ww_robotnik` | unskilled laborer |

**Accept:** Manual prompt generation for a WW character produces an era-correct prompt with WW Layer 0 + WW clothing + Pustynia background + WW spending tier hint. 1920s portrait generation unchanged.

### Packet 9 — Admin invite code
**Files:** `src/components/admin/InviteCodeManager.tsx`.
**Deliverable:** Add `<option value="wild_west">Stary Zachód</option>` to the era select.
**Accept:** Admin can create a WW invite code; the code, when used by a player, lands them in the WW flow.

### Packet 10 — End-to-end smoke test
**Files:** none (manual test).
**Deliverable:** Pawel (or NINA-driven test player) creates a WW character end-to-end and submits. Card renders with WW-appropriate spending/cash; portrait panel works.
**Accept:** Submitted character shows in admin list; PDF export works (PDF layout unchanged — out of scope for any WW-specific tweaks).

## Decisions log

- **2026-06-03** — Approach A (`wild_west` as fourth era) chosen over orthogonal variant axis. Reuse maximum, minimal new concepts.
- **2026-06-03** — Wizard skips: wealth (housing/lifestyle/transport) + positions/contacts.
- **2026-06-03** — Equipment + weapons come from Down Darker Trails OCR; player buys equipment from `assets` budget (CR-derived). Cash is informational on the card. CR cap manual via `max_skill_value` on invite code.
- **2026-06-03** — Polish bracket labels reuse 1920s names except `Super bogaty` → `Krezus` for WW.
- **2026-06-03** — Civil War Veteran perk and `gore_immunity` mechanic out of scope.
- **2026-06-03** — No occupation categories for WW; single alphabetical list.
- **2026-06-03** — Single default background chip "Pustynia (rozmyta)"; player overrides via custom field. Default ethnicity in prompt = anglo-saxon; player can override via appearance/Korekty.
- **2026-06-03** — Default clothing chip in WW derived from purchased equipment (with spending-level fallback); 1920s clothing default unchanged.
- **2026-06-03** — Łuk in WW maps to the correct `bron_palna:luk_kusza` skill specialization (pre-existing 1920s catalog bug `walka_wrecz:luk` is acknowledged but not fixed in this scope).

## Open questions

None — all P1-P20 resolved before this spec.

## References

- [[DOMAIN_COC]] — base CoC rules in this app.
- [[specs/wealth_v2_spec]] — 1920s wealth model the WW model replaces with empty housing/lifestyle/transport.
- [[specs/spending_level_normalization]] — `$N` form for spending levels.
- [[PORTRAIT_PIPELINE]] — portrait pipeline overall.
- `src/lib/artPrompt.ts`, `src/data/skills.ts`, `src/data/occupations.ts`, `src/data/eras.ts`, `src/data/equipmentV2.ts`, `src/data/weaponsV2.ts`, `src/components/wizard/WizardShell.tsx`, `src/components/admin/InviteCodeManager.tsx`, `supabase/functions/player/index.ts`.

Source: Chaosium Inc., *Call of Cthulhu — Down Darker Trails* (Old West setting).
