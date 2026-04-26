---
date: 2026-04-21
status: active
tags:
  - tech
  - architecture
---

# Technology Mastermind

## Stack

### Frontend
- **React + TypeScript** (SPA).
- **Vite** build/dev.
- **Zustand** for state management; wizard state persisted to `localStorage`.
- **Component structure:**
  - `src/components/admin/` — admin-only UI (character list, editors, art prompt section).
  - `src/components/player/` — player-facing UI (dashboard, character viewer).
  - `src/components/shared/` — shared primitives (character sheet, portrait upload).

### Backend
- **Supabase** — Postgres + edge functions + storage.
- **Edge functions:**
  - `supabase/functions/admin/index.ts` — admin API (protected by `X-Admin-Password`).
  - `supabase/functions/player/index.ts` — player API (auth via invite codes + bcrypt).
- **Storage bucket:** `portraits/` with per-character gallery subpaths (`gallery/[char-id]/*.jpg`).
- **Migrations:** `supabase/migrations/` — numbered SQL. Current tip: `017_sessions_and_distinguisher.sql`. Also in flight: `016_auto_assign_player.sql`.

### AI / Generation
- **Stable Diffusion (local WebUI)** — portrait generation. Realistic models (Deliberate, Realistic Vision). Config in [[PORTRAIT_PIPELINE]].
- **Gemini Chat (browser, Profile 4 / Storage)** — orchestration via `scripts/gemini-browser-gen.mjs`.

### Scripts
- `scripts/generate-portrait.mjs` — entry for SD portrait pipeline.
- `scripts/gemini-browser-gen.mjs` — Gemini browser automation.

## Architectural decisions

> [!decision] Why Supabase edge functions instead of a traditional backend
> Solo project, closed user base. Edge functions + Postgres = zero-ops, one vendor, fast to iterate.

> [!decision] Why Zustand + localStorage persist
> Wizard state must survive a page refresh mid-character-creation. Zustand persist is lightweight, no server round-trip per keystroke.

> [!decision] Why custom auth (invite codes + bcrypt) instead of Supabase Auth
> Closed, invite-only system. Admin controls account creation. Player UX is "enter code, set password" — Supabase Auth would be overkill.

> [!decision] Why local SD + manual prompt copy/paste (not SD API)
> The user already runs SD locally. Building an API bridge would add infra without saving time; admin UI already shows the prompt ready to copy.

## Non-obvious implementation details

- **Draft sync:** wizard progress saves to server periodically and on step change. Draft survives across devices per invite code.
- **Skill specializations use composite keys:** `nauka:Fizyka`, `broń palna:Krótka` etc. Rendered via `getSkillDisplayName()`.
- **Choice slots in occupation skills:** `choice:1:skill1,skill2` syntax — player picks. Also `any` and `any_academic` slots.
- **Eras** (1920s / modern / gaslight) gate which skills, equipment, occupations, and lifestyle options are available.
- **Invite codes** carry: max tries, max skill value, allowed methods, perks, era.

## Dependencies worth watching

_(to be filled: list packages from `package.json` that are load-bearing — PDF renderer, image utilities, bcrypt, etc.)_
