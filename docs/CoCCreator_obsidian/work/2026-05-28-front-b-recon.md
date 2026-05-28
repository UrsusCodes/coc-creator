---
date: 2026-05-28
status: active
tags:
  - work-note
  - front-b
  - bug/data-integrity
  - bug-064
  - bug-067
---

# Front B — Reconnaissance (CONSTANTA-1, 2026-05-28)

Stage 1 of the [[operations/COMMAND_LOG#Front B — Data integrity]] manager flow.
Source briefing: BONAPARTE-1 (see initial session prompt) + [[operations/COMMAND_LOG]].

## DB inventory (from snapshot `backups/2026-04-27-post-v2-deploy/characters`)

23 character files in the snapshot. Live snapshot not run this session (env vars missing —
deferred; user can provide if needed for fresher numbers). The 2026-04-27 snapshot is the
latest committed baseline.

### `residence` + `birthplace`

22/23 have BOTH columns present as strings (empty `""` or non-empty). One file
(`53506d36__arthur-henry-corwin.json`) appears to only have non-empty values — verified
present in all paged greps.

Non-empty residence (7): arthur-henry-corwin, james-kelly, mortimer-mort-flannery,
herbert-west, wilson-stanford, lillian-whitley, joseph-kelly, james-jimmy-harding.
Non-empty birthplace (same 7).
Empty string `""` (15): everyone else.

> [!note]
> No NULL-vs-empty divergence in the snapshot — migration 014 backfilled.

### `spending_level` — 5 raw formats observed across 19/23 chars

| Format | Count | Chars |
|---|---|---|
| `"$7"` | 8 | cecil-cavendish, william-smith, herbert-west, wilson-stanford, jake-wallis, cormac-mcmiller, edward-swanson, joseph-kelly |
| `"$25"` | 5 | james-kelly, friedrich-fritz-mueller, doktor-steven-price, lillian-whitley, +1 |
| `"Przeciętny"` (TIERS.label tier C) | 5–6 | arthur-mcneil, percy-kent, arthur-ashford, nathan-rosenbaum, eleine-howard, +1 |
| `"Zamożny"` (TIERS.label tier D) | 1 | howard-hayes |
| `"Biedny"` (historical alias → tier B "Ubogi") | 1 | edmund-ed-krawczyk |

Missing/null (4): submitted chars without the field — likely v1-era drafts that never
hit StepEquipment. The wizard's `StepEquipment.tsx:142` now writes `formatDollars(spending)`
= always `$X` form for any new character.

### `cash`

All present-and-non-empty rows use the legacy `"Gotówka: X $ | Dobytek: …"` format.
Modern format documented in `exportCardPdf.ts:323` is just `"$X"`. Both formats parse
correctly via the existing `Gotówka:\s*(.+?)(?:\s*\||$)/` regex.

## Code surface map

### BUG-064 — residence/birthplace — STATUS REVISED (~80% already done)

Wired and working in HEAD:

| Layer | File | Status |
|---|---|---|
| Type | `src/components/shared/CharacterSheet.tsx:45-46` | ✓ `residence?` `birthplace?` on `CharacterSheetData` |
| Store | `src/stores/characterStore.ts:41-42, 135, 187-188, 303-311, 382-383, 442-443, 547-548` | ✓ field + setter + all entry paths |
| Wizard input | `src/components/wizard/StepBasicInfo.tsx:105-127` | ✓ inputs exist (marked "opcjonalnie") |
| Draft autosave | `src/hooks/useDraftSync.ts:24-25` | ✓ included in PUT /draft payload |
| Edit submit | `src/hooks/useEditSubmit.ts:44-45` | ✓ included in admin/full edit save |
| Player narrative editor | `src/components/player/NarrativeEditor.tsx:38-39` | ✓ both fields editable post-submit |
| Player viewer save | `src/components/player/PlayerCharacterViewer.tsx:174-179` | ✓ includes both in save payload |
| StepReview display | `src/components/wizard/StepReview.tsx:143-144, 215-216` | ✓ `EditableField` rows |
| PDF front card | `src/lib/exportCardPdf.ts:281-282` | ✓ `getFieldValue('residence')`, `('birthplace')` |
| HTML front card map | `src/lib/cardFrontMap.ts:294-295` | ✓ included in `cardFrontData` |
| HTML front template | `public/templates/card-v2/card_front.html:807-808` | ✓ `data-bind="birthplace"`, `data-bind="residence"` |
| Player edge `/draft` allowlist | `supabase/functions/player/index.ts:1291-1292` | ✓ |
| Player edge `/narrative` allowlist | `supabase/functions/player/index.ts:2096` | ✓ |
| Admin edge `/pending-edits/.../approve` allowlist | `supabase/functions/admin/index.ts:548-549` | ✓ (from `53a2674` Etap C, 2026-04-27) |
| Player edge `/reroll` wipe | `supabase/functions/player/index.ts:244-246` | ✓ wipes both per spec |

Missing — local **uncommitted** changes in working tree (sit there since at least 2026-05-24 by recent-commit dates):

| Layer | File | Status |
|---|---|---|
| Admin edit form | `src/components/admin/edit/BasicInfoEditor.tsx` (local diff) | added two `Input` rows + props type extended |
| On-screen sheet preview | `src/components/shared/CharacterSheet.tsx:100-101` (local diff) | added two `<div>` rows under basic info |

> [!warning] BUG-014 claim from briefing is OUTDATED
> Briefing says "APPROVE_ALLOWLIST is known to NOT include `residence`/`birthplace`".
> **False as of `53a2674` (2026-04-27)** — Etap C tightening added them. Verified
> [supabase/functions/admin/index.ts:548-549](supabase/functions/admin/index.ts:548).

### BUG-067 — spending_level — three rendering paths

| # | Path | Behaviour today | Bug? |
|---|---|---|---|
| 1 | `exportCardPdf.ts:256-263` (`resolveSpendingLabel`) → PDF front card | TIERS+LIFESTYLE_LEVELS+"Biedny" lookup, final fallback returns raw | ⚠️ raw fallback (BUG-049) |
| 2 | `backTocV2Map.ts:209-233` (`resolveSpending` inline) → HTML back card | Same lookup, final fallback returns `''` | ⚠️ silently empty |
| 3 | `CharacterSheet.tsx:209` (`Badge`) → **on-screen** preview | No normalization. Renders raw `char.spending_level` as-is | ⚠️ **MAIN LEAK** — "Przeciętny" visible in app UI |
| 4 | `cardFrontMap.ts:273-277` (`spendingDisplay`) → HTML front card | `$X` strip only, no TIERS lookup fallback | ⚠️ raw label leaks to HTML front card too |
| 5 | `exportText.ts:136` | Raw `char.spending_level` interpolation | ⚠️ raw leak in `.txt` export |

The recent hotfixes (`5904e61`, `366a619`) fixed paths #1 and #2 but missed #3 / #4 / #5.

Helpers `resolveSpendingLabel` (in `exportCardPdf`) and `spendingFromLabel` (its private helper)
duplicate the logic in `backTocV2Map.spendingDisplay`. Two near-identical normalizers,
no shared module.

### Canonical wealth data (source of truth)

`src/data/wealthV2.ts` `TIERS` array — 6 tiers A–F:
- A `Bezdomny` $0.5  (CR 0)
- B `Ubogi` $2       (CR 1-9)
- C `Przeciętny` $7  (CR 10-30)
- D `Zamożny` $25    (CR 31-50)
- E `Bardzo zamożny` $80 (CR 51-70)
- F `Bogaty` $300    (CR 71-80)

Also `LIFESTYLE_LEVELS` (Nędzny/Skromny/.../Luksusowy) each link to a parent TIERS.id so
their spending = parent tier's spending. Already used by both PDF normalizers.

`"Biedny"` is **NOT** a current TIERS label — it's a legacy alias hardcoded to $2 in
both PDF helpers. Only 1 char (edmund-ed-krawczyk) has it.

## Open questions for Pawel (Stage 3 sign-off)

Both specs will be drafted around these questions. None can be guessed by CONSTANTA-1.

### For `birthplace_residence_integration.md`

1. **Commit the local uncommitted changes as-is, or expand scope?** Working tree already has
   admin BasicInfoEditor + CharacterSheet display. Minimal scope = commit those + done.
   Alternative scope = also add to ToC back card, or add a "Miejsce zgonu" admin-fillable
   field (the template already has `death_place` placeholder, currently rendered as `''`).
2. **Backfill the 15–16 chars with empty strings?** Recommend NO — empty hides cleanly via
   `{char.residence && <div>...}` conditional, and CLAUDE.md cautions against unsolicited
   data writes. Players can fill via the existing NarrativeEditor.
3. **Wizard required vs optional?** Currently optional. Confirm.

### For `spending_level_normalization.md`

4. **Normalize-once-in-DB (migration) vs normalize-on-render (shared helper)?**
   Recommend ON-RENDER. Why: (a) only 8 chars carry legacy labels — small enough that
   the helper covers them indefinitely; (b) migration risk on live submitted data is
   non-trivial (CLAUDE.md: "no `drop table` shortcuts"); (c) one shared helper imported
   in 5 callsites is cheap.
5. **Canonical display format**: `"$7"` or `"7$"` or `"$7/dzień"`?
   - PDF currently shows `7$` (post-symbol).
   - Polish convention is post-symbol (`7 $`).
   - Recommend: keep `7$` for PDF (already there), use `7$` everywhere for consistency.
   - Alternative: switch to `$7` everywhere (cleaner, dollar-first feels American/CoC-period).
6. **Unknown-format fallback**: today PDF returns raw, HTML returns `''`, on-screen returns
   raw. Unified recommendation: `'—'` em-dash on unknown — visible "something is missing"
   signal without scary text. Or keep silent empty `''` (less noisy). Decision needed.
7. **Should the helper also write canonical form back to characterStore when wizard
   touches it?** No-op for current data path (StepEquipment already writes `formatDollars`).
   Belt-and-braces normalization on read covers all legacy. Recommend: read-only normalize.

## Next steps

1. Mark Stage 1 complete.
2. Draft two specs in `specs/`:
   - `birthplace_residence_integration.md` — focus on commit-the-uncommitted + verify
     template/back-card coverage.
   - `spending_level_normalization.md` — propose shared helper module, list 5 callsite
     diffs, decisions table.
3. Present to Pawel in Polish with the 7 decision points above.
4. On sign-off, dispatch WORKER #B1 (residence) and WORKER #B2 (spending) in parallel.

## References

- [[../operations/COMMAND_LOG#Front B]]
- [[../specs/wealth_v2_spec]]
- `docs/RULES_MODIFICATIONS.md` §8
- Recent commits: `5904e61`, `366a619`, `53a2674` (Etap C allowlist).
