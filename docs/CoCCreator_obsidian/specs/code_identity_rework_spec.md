---
date: 2026-04-21
status: implementing
tags:
  - spec
  - feature/invite-codes
  - feature/characteristics
  - structural-rework
---

# Code Identity & Characteristics Rework — Spec

> [!info] Status
> **Implementing** — plan approved 2026-04-21. Migration `018_code_identity_rework.sql` drafted. This is the canonical spec; the one-shot plan file lives at `~/.claude/plans/sunny-puzzling-garden.md`.

## Context

Two linked problems drove this rework:

1. **Bug — rolls reset on refresh.** Player rolls characteristics, refreshes / returns later → new rolls. Root cause: `rollAll()` in `StepCharacteristics.tsx:37–46` is purely client-side; rolls live in zustand→localStorage; `useDraftSync` saves only for logged-in players after a 5s debounce. `characteristicsLocked` is a client-only flag.
2. **Problem — code proliferation.** Too many invite codes, no label/assignee/distinguisher on the list, admin and players get confused.

**Intended outcome.** A code is committed to a specific character when the player enters a **word-label identifier** ("identyfikator słowny"). On that commit, characteristics are rolled **server-side once** and persist across refresh/device. Changing them requires a deliberate, budgeted "przerzut" that wipes downstream data. Admin and player both see rich code rows: label, assignee, distinguisher, status, rerolls left.

## Semantic shifts

| Concept | Today | After rework |
|---|---|---|
| Code's `max_tries` | How many separate characters can be started from this code | **Rename to `reroll_budget`** — how many rerolls on the ONE character this code represents |
| `times_used` | Counter against `max_tries` | Deprecated; derived state comes from character rows |
| Character identity | Emerges mid-wizard | **Committed first** via player-entered identifier |
| Characteristic rolls | Client-side random, client-flag locked | **Server-generated** on identifier submit; server-authoritative `characteristics_committed_at` |
| Anon code entry | Allowed | **Removed** — player must be logged in |

## Per-method behavior

- **dice.** Identifier submit → server creates character, rolls characteristics + luck + eduRolls, sets `characteristics_committed_at`. Reroll endpoint validates `rerolls_remaining > 0`, regenerates, wipes downstream, decrements.
- **point_buy / direct.** Identifier submit → empty characteristics. Player allocates freely on characteristics step. No reroll tokens. Going back to edit wipes downstream but is free. `characteristics_committed_at` set on first advance past the step.

## Cascade wipe (on reroll or manual edit)

- **Wipe:** skills, skill_points_used, backstory, equipment, positions, contacts, luck_spent, derived.
- **Keep:** id, invite_code_id, player_id, distinguisher, method, era, perks, created_at, reroll_history, rerolls_remaining, status='draft', name, age, gender.
- `draft_step` reset to characteristics step.

## Status definitions

| Status | Definition |
|---|---|
| **unused** | No character row with this `invite_code_id` |
| **started** | Linked character has `status='draft'` |
| **finished** | Linked character has `status='submitted'` |

(Mutually exclusive under 1 code = 1 character semantics.)

## Schema changes — `018_code_identity_rework.sql`

**`invite_codes`**
- `label TEXT NOT NULL DEFAULT ''` — admin-facing internal label.
- `reroll_budget INTEGER NOT NULL DEFAULT 0` — rerolls after initial roll.
- `assigned_player_id UUID REFERENCES players(id)` — inline quick-assign (junction remains source of truth).
- Backfill: `reroll_budget = GREATEST(0, max_tries - 1)`.
- `max_tries` retained, deprecated.

**`characters`**
- `rerolls_remaining INTEGER NOT NULL DEFAULT 0`.
- `characteristics_committed_at TIMESTAMPTZ` (null = uncommitted).
- `reroll_history JSONB NOT NULL DEFAULT '[]'`.
- Backfill: `characteristics_committed_at = created_at` where characteristics non-empty.

**Indexes**
- `idx_characters_invite_code_id_status(invite_code_id, status)` — drives status derivation.
- `idx_characters_player_distinguisher_unique(player_id, distinguisher) WHERE distinguisher <> '' AND player_id IS NOT NULL` — partial unique.

**RPCs**
- `grant_reroll(character_id, amount)` — admin increment.
- `consume_reroll(character_id)` — player decrement with error on exhausted.

## Endpoints

### Player

- `POST /start-character` — `{ code, distinguisher, method }` → creates character, rolls if dice, seeds rerolls_remaining from code's reroll_budget. Returns draft character.
- `POST /characters/:id/reroll` — dice only. Validates budget, rerolls server-side, wipes downstream, decrements.
- `POST /characters/:id/edit-characteristics` — non-dice. Accepts new values, wipes downstream. No counter change.
- `PUT /characters/:id/draft` — server rejects writes to characteristics/luck/eduRolls when `characteristics_committed_at IS NOT NULL`.

### Admin

- `PATCH /codes/:id` — edit label, reroll_budget, assigned_player_id, perks, max_skill_value, era, methods (replaces delete+recreate).
- `POST /characters/:id/grant-reroll` — body `{ count }`; increments `rerolls_remaining`.

## UI

### New: `StepIdentifier.tsx`

First wizard step after code validation. Identifier input + method radio + era display. Polish copy:

> **Identyfikator postaci**
> Podaj krótką nazwę tej postaci — będzie widoczna tylko dla ciebie i admina. Pomoże odróżnić postacie od siebie, zwłaszcza gdy masz ich kilka.
> *Przykłady:* "postać na sesję gangsterską", "antropolog", "zapasowa detektyw".

### `StepCharacteristics.tsx`

- **dice:** read-only display + single "Przerzuć cechy" button (visible when `rerolls_remaining > 0`). Confirmation modal warns about downstream wipe.
- **point_buy / direct:** editable; on advance if changed, server edit endpoint is called, downstream wipes.
- **Remove:** `rollAll` randomness (server-side now), `handleAbandon`, client `lockCharacteristics`.

### `InviteCodeManager.tsx`

- Create form adds label, assigned_player_id, reroll_budget.
- List columns: Code, Label, Assignee, Era, Methods, Reroll budget, Status, Distinguisher, Rerolls left, Created, Perks, Actions.
- **Default view hides used/finished codes.** Collapsible section "Kody zużyte/zakończone" expands them on click. Keeps the active list short during daily use.
- Filter: All (active) / Unused / Started. Search by code/label/assignee/distinguisher.
- Row edit via pencil icon + `PATCH /codes/:id`.
- "Grant reroll" action on started rows.
- "Wyczyść stare kody" button → preview modal listing deletable rows → confirm → `POST /codes/cleanup`.

### `PlayerDashboard.tsx`

- Assigned codes: add Label, Status, Distinguisher, Rerolls left columns.
- **Default view hides codes whose character is submitted.** Collapsible "Zakończone postacie" section shows them on click.
- "Użyj kodu" lands on `StepIdentifier` for new character; routes to in-progress step for resume by character_id.
- Characters: add Rerolls left badge for drafts.

### `CharacterList.tsx` (admin)

- Add Code label and Rerolls left columns.

### `BasicInfoEditor.tsx` (admin edit)

- `distinguisher` becomes read-only (player-owned).

## Migration of in-flight drafts

- Rafał's in-flight draft: backfill sets `characteristics_committed_at = created_at`. `rerolls_remaining = 0`. Admin grants reroll if he needs a reset.
- Existing empty-distinguisher characters preserved (partial unique index permits empties).
- No forced re-entry of identifier.

## Implementation order

1. **Migration + server** — migration 018, player & admin edge functions. Deploy + smoke-test.
2. **Client types + lib** — `src/lib/{player,admin}.ts`, `src/types/*`.
3. **New `StepIdentifier`** + `WizardShell` routing.
4. **`StepCharacteristics` rewrite.**
5. **`InviteCodeManager`** — form + list + filter + edit modal.
6. **`CharacterList`, `BasicInfoEditor`** touches.
7. **`PlayerDashboard`** — columns + resume-by-character.
8. **Cleanup** — remove `handleAbandon`, trim `StepInviteCode`.

## Verification

**Schema:** apply in preview; confirm backfills.

**E2E dice:** player + code with `reroll_budget=2` → identifier submit → rolled character in DB → refresh across browsers/devices → characteristics persist. Reroll decrements, exhausts, admin-grant re-enables.

**E2E point-buy:** allocate, advance, return, edit, advance → downstream wiped, no counter change, `reroll_history` logs `manual_edit`.

**Admin UI:** create code with label + inline assignee → see status transitions unused → started → finished as player progresses.

**Edge cases:**
- Code without player_codes assignment → 403 on claim.
- Two players claiming same unassigned code → first wins.
- In-flight Rafał draft → loads cleanly, committed.
- Direct PUT of characteristics on committed character → 409.

## Related

- [[TECHNOLOGY_MASTERMIND]] — affects auth model (login-only code claim).
- [[DOMAIN_COC]] — no rule change, only flow change.
- `~/.claude/plans/sunny-puzzling-garden.md` — ephemeral plan file (will be deleted after implementation).

## Changelog

- **2026-04-21** — Plan written and approved. Migration 018 drafted. Implementation begins.
