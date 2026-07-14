---
date: 2026-07-14
status: done
tags:
  - spec
  - feature/invite-codes
  - feature/characteristics
  - confidential
---

# Per-Code Roll Options — Spec

> [!warning] Confidential — do not mention without asking
> Do not surface, explain, or discuss this feature — to players or anyone else — without asking the owner first. It is an admin-only, per-code control and is not part of any player-facing documentation.

> [!info] Status
> **Live on prod 2026-07-14.** Migration 026 pushed (`supabase db push`), edge functions `player` + `admin` deployed, client shipped via GitHub Pages (commit `3c310dd`). Client builds clean (`tsc -b`, `eslint`, `vite build`); server engine covered by a standalone statistical test (19 004 assertions, 0 failures).

## Purpose

Give the admin fine-grained control over how the server rolls the eight characteristics for a **specific invite code**, separately for the first roll and for each reroll. Motivation: relieve player frustration from repeated poor rolls by quietly shaping outcomes for chosen codes.

## Design principle — data, not code

All logic is **server-side** (edge function `player`). The parameters (which code, which ranges) live as **data in the database** (`invite_codes.roll_options`), never in source. The client bundle contains only a generic "apply optional roll constraints" engine, which reads as ordinary difficulty tuning. Nothing about specific codes or values ships to the browser — important because the repo is public / GitHub Pages.

> [!note] Repo visibility caveat
> This vault lives inside the git repo. If the repo is ever public, these notes are public too, regardless of who can open the Obsidian vault. Keep any "which code got which values" cheat-sheet **outside** the repo.

## Data model

Migration [[026_code_roll_options]] adds a nullable `jsonb` column `roll_options` to `invite_codes`. `NULL` = unconstrained (default behaviour preserved).

```jsonc
{
  "initial": <profile>,        // first roll
  "rerolls": [<profile>, ...], // index 0 = first reroll; last entry reused for further rerolls
  "luck": { "min": 60, "max": 90 }  // global luck-roll constraint (see below)
}
// profile:
{
  "chars": {                   // per-characteristic constraint (omit = auto)
    "STR": { "fixed": 65 },            // pin to a value
    "DEX": { "min": 50, "max": 90 }    // bound to a band
  },
  "avgMin": 60,                // lower bound on the mean of all eight (nullable)
  "avgMax": 85                 // upper bound on the mean of all eight (nullable)
}
```

Keys: `STR CON SIZ DEX APP INT POW EDU`. All `fixed`/`min`/`max` values for characteristics and luck are snapped to the ×5 dice grid (15–90) so a shaped stat is indistinguishable from a real roll. `avgMin`/`avgMax` are free integers (a mean need not fall on the grid).

`luck` is a single `RollConstraint` (not per-profile) applied in `/roll-luck` to **every** luck roll on the code — first pass and after any reroll. `fixed` pins it (snapped to ×5); a `min`/`max` band resamples the age-appropriate `3d6×5` (young 15–19 keeps the best-of-two). The existing `max_luck` ceiling still applies afterwards.

## Server resolution (`supabase/functions/player/index.ts`)

`rollAllCharacteristics(profile)`:

1. **Per characteristic** — `fixed` → clamp to that value (1–99). Else roll the natural formula (`3d6×5` or `(2d6+6)×5`); if a `min`/`max` is set, **resample** up to 80 times to land in the band (keeps ×5 granularity and a plausible distribution), then clamp as a guarantee.
2. **Average band** — if `avgMin`/`avgMax` set, resample the whole set up to 400× to land in the band. If still short, `adjustToBand()` deterministically steps the lowest adjustable stats up (or highest down) by 5 until the mean clears the bound — respecting each stat's own `[min,max]`, never touching `fixed` stats, capped by the 1–99 range. Infeasible bands terminate gracefully via an iteration guard.

Endpoints:
- `POST /characters/:id/roll-characteristics` → uses `roll_options.initial`.
- `POST /characters/:id/reroll` → uses `roll_options.rerolls[n]`, where `n` = count of prior `scope: 'reroll'` history entries (first reroll = 0); falls back to the last defined reroll profile, then to `initial`.

Options are loaded per request via `loadRollOptions(supabase, char.invite_code_id)`; missing/error → `null` → unconstrained.

## Admin UI

In the invite-code form (create + edit), a collapsed, default-hidden **"Dodatkowe opcje"** toggle ([[TECHNOLOGY_MASTERMIND|admin panel]] → `InviteCodeManager`) opens the editor `AdvancedRollOptions`:
- Tabs: **Pierwszy rzut** + **Przerzut 1..N** (N = reroll budget).
- Per characteristic: `auto` / `zakres` (min–max) / `stała` (fixed).
- Average band inputs (min–max).
- A dot next to the toggle when any constraint is configured.
- Empty config is saved as `NULL` (see `rollOptionsAreEmpty`).

## Files touched

| File | Change |
|---|---|
| `supabase/migrations/026_code_roll_options.sql` | New nullable `roll_options jsonb` column |
| `supabase/functions/player/index.ts` | Profile-aware roll engine + `adjustToBand` + wiring in `/roll-characteristics` and `/reroll` |
| `supabase/functions/admin/index.ts` | Allow `roll_options` in `POST` + `PATCH /codes` |
| `src/types/invite.ts` | `RollOptions` / `RollProfile` / `RollConstraint` types + `InviteCode.roll_options` |
| `src/lib/admin.ts` | `roll_options` in create/update signatures |
| `src/lib/rollOptions.ts` | `rollOptionsAreEmpty` helper |
| `src/components/admin/AdvancedRollOptions.tsx` | Editor component |
| `src/components/admin/InviteCodeManager.tsx` | "Dodatkowe opcje" panel + plumbing |

## Deploy

```bash
supabase db push                        # migration 026
supabase functions deploy player admin  # updated edge functions
```
Client (admin panel) ships via GitHub Pages on push to `master`. Related: [[DOMAIN_COC]] (characteristic formulas), [[specs/code_identity_rework_spec|code identity rework]] (reroll model).
