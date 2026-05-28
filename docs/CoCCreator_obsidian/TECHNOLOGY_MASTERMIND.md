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

## Shared Supabase project with `akta-kasandry`

> [!decision] 2026-05-19 — co-tenant the Supabase project with akta-kasandry
> The free-tier limit of 2 projects per org is already taken (`okbrsoomtomexilxxsyd` =
> CoC creator, `sedkygsdwlkrpmdihokk` = owesome-prod). The new RPG-wiki app
> "Akta Kasandry" (separate repo, separate GitHub Pages deploy, React+Vite+TS)
> will be a **second tenant on the SAME Supabase project as coc-creator**,
> isolated by Postgres schema (`wiki`) and storage bucket (`wiki-attachments`).

### Why this is safe (audit 2026-05-19)

coc-creator and akta-kasandry are auth-isolated by design:

| Concern | coc-creator current state | Impact of adding akta-kasandry |
|---|---|---|
| Supabase Auth | **NOT USED.** Zero references to `auth.uid()`, `auth.users`, `supabase.auth.*`. Player auth = bcrypt + invite codes. Admin auth = `X-Admin-Password` header. `auth.users` is empty (0 rows). | Akta Kasandry will populate `auth.users`. coc-creator simply ignores those rows. No code path reads them. |
| Public RLS policies | All `public.*` policies are either `anon`-scoped (read active codes, R/W draft characters) or `service_role`-only. No policy grants `authenticated`. | Wiki users with valid `auth.users` sessions get the **same** access to `public.*` as any logged-out visitor. No expansion. |
| Triggers on auth.users | **NONE.** No `AFTER INSERT ON auth.users` triggers exist. | Wiki signups will not pollute coc-creator's tables. |
| Edge functions | All three (`/admin`, `/player`, `/public`) use `SUPABASE_SERVICE_ROLE_KEY`, bypassing RLS. Auth enforced in function code, not via `auth.*`. | Untouched. Akta Kasandry deploys its own edge functions (`/wiki/*`) with its own auth. |
| Frontend bootstrap | `src/lib/supabase.ts` uses anon key; **never** calls `.auth.getSession()` / `.auth.onAuthStateChange()`. | A user with an akta-kasandry session in the same browser opens coc-creator and is treated as anon — no crash, no leakage. |
| Realtime | Not used. No `postgres_changes` subscriptions anywhere in `src/`. | Wiki write activity will not page coc-creator clients. |
| Storage bucket `portraits` | Public read + anon upload (relies on UUID-obscure paths). | Wiki users were already able to read/upload here as anon — no new exposure. Wiki gets its own bucket. |
| Direct anon queries from frontend | Reads `invite_codes` (active only) and `characters` (anon RLS), via `src/hooks/useCharacterSubmit.ts`. | RLS still gates these; wiki `authenticated` role doesn't get extra rights. |

### Isolation contract (binding for both apps)

1. **Schemas are walls.** coc-creator owns `public.*`. Akta Kasandry owns `wiki.*`. No cross-schema FKs. No cross-schema queries from edge functions.
2. **Storage buckets are walls.** coc-creator → `portraits`. Akta Kasandry → `wiki-attachments`. Each app writes only to its own bucket.
3. **Edge functions are walls.** coc-creator → `/admin`, `/player`, `/public`. Akta Kasandry → `/wiki` (or namespaced equivalent). Service role usage is per-function and must not query the other schema.
4. **`auth.users` is owned by akta-kasandry.** coc-creator MUST NOT start reading `auth.uid()` or `auth.users` without explicit re-evaluation. The day coc-creator wires Supabase Auth in, this isolation contract breaks and needs revisiting.

### Things to remember when changing coc-creator

- **Do not add `AFTER INSERT ON auth.users` triggers.** They would create placeholder rows for wiki-only users.
- **Do not add RLS policies that grant `authenticated` broadly.** Wiki users are `authenticated`; broad grants would expose CoC data to them. Use `anon` for public reads, `service_role` for protected writes (current pattern).
- **Do not subscribe to schema-wide or DB-wide realtime channels.** Subscribe to specific `public.*` tables only.
- **`scripts/pg-dump-all.mjs` only dumps `public` schema.** Akta Kasandry needs its own dump tooling for `wiki.*` (or coc-creator's script gets a `--schema` flag — but it's not coc-creator's job to back up wiki).
- **Two pre-existing gaps to close** (independent of akta-kasandry, but more relevant now): `public.portrait_feedback` and `public.portrait_generations` were created without `ENABLE ROW LEVEL SECURITY`. They're accessed exclusively via service-role edge functions, so the gap was harmless. With Supabase Auth in play, default GRANTs let `authenticated` (wiki users) read/write them directly. Tracked in [[TASK_LIST]].

### Current capacity (free tier, measured 2026-05-19)

`scripts/check-supabase-usage.mjs` (added 2026-05-19) measures live usage.

- **DB:** 13 MB of 500 MB cap (2.6%). Breakdown: `public` 1.3 MB, `auth` 936 KB (empty users — schema overhead only), `storage` 336 KB, `supabase_migrations` 88 KB, `realtime` 56 KB.
- **Storage:** 55 MB of 1 GB cap (5.5%). All in `portraits` bucket: 28 objects.
- **auth.users:** 0 rows.

**Headroom for wiki:** ~487 MB DB, ~945 MB storage. Markdown wiki pages cost ~30 KB per 5000 words — even 10 000 pages would fit in 300 MB. The realistic constraint is `wiki-attachments` storage if the GM uploads many high-res handouts/maps; budget ~500 MB for that comfortably.

### How to verify if things drift

Re-run `node scripts/check-supabase-usage.mjs` to see live sizes and confirm `auth.users` rows are growing in akta-kasandry without spreading into `public.*`. If a `public.*` table gains rows that don't match coc-creator's flows, something has bridged the schemas inadvertently.

### Documented integration surfaces (coordinate before changing)

2026-05-20 — akta-kasandry's plan is in, and it includes one explicit cross-project read: they SELECT from `public.characters` (using its existing `anon_read_characters` policy) to power their `/admin/import-characters` flow, snapshotting the entire row into `wiki.imported_characters.data`. Full list of integration surfaces, what they touch, and what triggers coordination is in [[INTEGRATIONS]].

The short version: do not tighten `anon_read_characters`, do not rename columns on `public.characters`, do not change `portraits` bucket public-read policy, without telling akta-kasandry first.
