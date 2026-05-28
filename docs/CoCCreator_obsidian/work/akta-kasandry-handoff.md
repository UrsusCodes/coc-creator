---
date: 2026-05-19
status: active
tags:
  - work-note
  - akta-kasandry
  - handoff
---

# Akta Kasandry — handoff from coc-creator

Everything the new app needs to know about co-tenanting the existing Supabase project (`okbrsoomtomexilxxsyd`) with coc-creator. Pair with [[TECHNOLOGY_MASTERMIND#Shared Supabase project with akta-kasandry]] for the audit narrative.

## A. Connection facts

| What | Value | Where to get it |
|---|---|---|
| Supabase project URL | `https://okbrsoomtomexilxxsyd.supabase.co` | also in coc-creator `.env.local` as `VITE_SUPABASE_URL` |
| Project ref | `okbrsoomtomexilxxsyd` | extracted from URL |
| Region | Central EU (Frankfurt) | Supabase dashboard |
| Anon key | (rotate-safe, same for both apps) | coc-creator `.env.local` as `VITE_SUPABASE_ANON_KEY` |
| Service role key | (NEVER expose client-side; per-app env in edge fn settings) | Supabase dashboard → Project settings → API |
| DB password (direct Postgres) | (held by admin) | coc-creator `.env.local` as `SUPABASE_DB_PASSWORD` |
| Pooler URL (session mode :5432) | `postgresql://postgres.okbrsoomtomexilxxsyd@aws-1-eu-central-1.pooler.supabase.com:5432/postgres` | coc-creator `supabase/.temp/pooler-url` |

Anon key is fine to share — it's the public client key, gated by RLS. Service role key is **per-edge-function** and should not be reused — copy it once into akta-kasandry's edge function env vars, then forget.

## B. Naming conventions (binding)

| Resource | coc-creator | akta-kasandry |
|---|---|---|
| Schema | `public` | `wiki` |
| Storage bucket | `portraits` | `wiki-attachments` |
| Edge function namespace | `/admin`, `/player`, `/public` | `/wiki` (or `/kasandry`) |
| RLS policies prefix | (none) | suggest `wiki_*` to make grep easy |
| Migration files | `supabase/migrations/NNN_*.sql` in coc-creator repo | `supabase/migrations/NNN_*.sql` in akta-kasandry repo |

**Critical: migration sequencing.** Supabase's `supabase_migrations.schema_migrations` table is GLOBAL across the project. If both repos run `supabase db push`, they will fight over migration ordering and the second one will fail or skip. Three workable approaches:

1. **Manual SQL Editor** for akta-kasandry — never run `supabase db push` from that repo; paste migrations via dashboard.
2. **Prefix akta-kasandry migration filenames** with something disjoint (e.g., `wiki_001_init.sql`) and configure CLI to push them with a different schema migrations table — non-trivial, probably not worth it.
3. **Acknowledge it and live with it** — push from one repo at a time, manually, and never auto-deploy migrations from CI. Each push is a deliberate operator action.

Recommend (1) for simplicity. The two repos are deployed independently anyway.

## C. Isolation contract (binding for akta-kasandry — DO NOT)

- **DO NOT add tables to `public.*`.** All akta-kasandry tables live in `wiki` schema.
- **DO NOT add foreign keys from `wiki.*` to `public.*`.** Schemas are walls.
- **DO NOT add triggers on `auth.users` that write to `public.*`.** coc-creator does not expect those rows.
- **DO NOT grant `authenticated` access to `public.*` tables.** coc-creator's RLS pattern is `anon` for public reads, `service_role` for everything else. Don't bridge wiki users into coc-creator's surface.
- **DO NOT subscribe to schema-wide or DB-wide realtime channels.** Subscribe only to `wiki.*` tables.
- **DO NOT query `public.*` from akta-kasandry edge functions**, even though service role would allow it. Cross-app reads break the isolation contract; if you need data from coc-creator, expose it via a coc-creator edge function with explicit auth.

## D. Things akta-kasandry SHOULD do

- **Use Supabase Auth** for player accounts. coc-creator doesn't, so `auth.users` is your territory.
- **Define `wiki.*` RLS policies referencing `auth.uid()`** — standard Supabase Auth pattern. Per-user row ownership, per-role write gates.
- **Deploy own edge functions** under `/wiki/*` namespace if needed. Don't reuse `/admin`, `/player`, `/public`.
- **Write own backup/dump tooling** for `wiki.*`. coc-creator's `scripts/pg-dump-all.mjs` only dumps `public` (intentional — it's coc-creator's tool).
- **Track storage growth.** Wiki attachments (handouts, maps, illustrations) will be the variable cost. `scripts/check-supabase-usage.mjs` in coc-creator already prints per-bucket totals — useful periodically.

## E. SSO between the two apps — open decision

coc-creator's player accounts are in `public.players` with bcrypt — no link to `auth.users`. Akta Kasandry will use `auth.users`. The same physical person will have two unrelated identities.

Options (none are urgent for akta-kasandry MVP):

1. **No SSO** — two separate logins. Spec-compliant with current coc-creator. Pick this for v0.
2. **Bridge in coc-creator** — add `players.auth_user_id UUID REFERENCES auth.users(id) NULL`, add a "Sign in with Supabase Auth" path in coc-creator login that resolves to an existing `players` row by `auth_user_id`. ~1–2 sessions of coc-creator work, no akta-kasandry-side cost.
3. **Full migration of coc-creator to Supabase Auth** — large, not recommended without a specific driver.

If we ever pick (2) or (3), `TECHNOLOGY_MASTERMIND.md`'s "do not start reading auth.uid() without re-evaluation" clause kicks in.

## F. Two known RLS gaps to be aware of

Tracked in coc-creator's [[TASK_LIST#Hardening (pre-akta-kasandry coexistence)]]:

- `public.portrait_feedback` and `public.portrait_generations` have RLS not enabled. Today this is harmless (only coc-creator's service-role edge functions touch them). Once `auth.users` is populated by akta-kasandry, default GRANTs allow `authenticated` to read/write them via the anon key. coc-creator will close this before akta-kasandry's first prod deploy.

Akta-kasandry doesn't have to do anything about this — just know that the gap exists and coc-creator owns the fix.

## G. Free-tier budget (measured 2026-05-19)

| Quota | Used | Free | Notes |
|---|---|---|---|
| DB | 13 MB | 487 MB | Markdown is ~30 KB / 5000-word page; 10 000 pages still fits in 300 MB |
| Storage | 55 MB | 945 MB | All in `portraits`. Wiki attachments will be the variable cost |
| Egress | unknown | 5 GB / mo | Negligible for current usage; monitor if wiki gets image-heavy |

`node scripts/check-supabase-usage.mjs` in coc-creator re-runs the measurement.

## H. Things coc-creator promises akta-kasandry

- Will NOT start using Supabase Auth in coc-creator without first re-evaluating this contract.
- Will NOT add RLS policies on `public.*` that grant `authenticated` broadly.
- Will NOT add `AFTER INSERT ON auth.users` triggers.
- Will close the two RLS gaps in `portrait_feedback` / `portrait_generations` before akta-kasandry hits production.
- Will keep `scripts/check-supabase-usage.mjs` working as a shared diagnostic.

## Update 2026-05-20 — akta-kasandry's plan reviewed

Their integration plan landed (copy: see chat history of this session, and authoritative version lives in their repo's `SUPABASE_AND_SYNC.md`). Cross-checked against this handoff.

### Verdict: aligned

Their plan respects the isolation contract on every point:
- Schema `wiki` ✓, bucket `wiki-attachments` ✓, all RLS via `auth.uid()` ✓.
- Trigger on `auth.users` INSERT writes ONLY to `wiki.profiles` (not `public.*`) ✓.
- No FKs from `wiki.*` to `public.*` ✓ (they use `source_id uuid unique` without `REFERENCES public.characters(id)` — semantic link only).
- No coc-creator edge function reuse ✓.
- Read-only access to `public.characters` via existing anon RLS — no expansion of attack surface ✓.

Documented in [[INTEGRATIONS]] as a formal cross-project read.

### Things we flagged back (medium importance, none blocking)

1. **Snapshot via whole-row `select *` is brittle** — they store the whole `public.characters` row as `data jsonb`. If we ever add a column with PII or a secret, it leaks via next admin import. Recommendation to them: explicit allowlist in the snapshot extractor. Today's columns are character data only (no secrets), so this is forward-looking.
2. **Migration coordination** — they use sequence `001..006` in their own repo's `supabase/migrations/`. Reminded that `supabase_migrations.schema_migrations` is global to the project; either prefix files (`wiki_001_*`) or apply manually via SQL Editor. They're going manual per their plan ("each step in a separate migration file so the GM can pause between") — fine, as long as `supabase db push` is never run from akta-kasandry.
3. **Stale portrait URLs** — `wiki.imported_characters.portrait_url` snapshots a URL. If we delete a character or move portraits, wiki shows broken images. Their "imported (stale)" state catches data drift but not URL drift. Acceptable — admin re-imports as needed. We won't proactively notify them on portrait reshuffles.
4. **`anon_read_characters` is now a load-bearing public API** — was just internal RLS; is now an integration surface. Tracked in [[INTEGRATIONS#Coordination triggers]].

### Items the handoff already nailed and they respected

- Migration table collision warning — they acknowledged via "each step in a separate migration file" + manual-pause discipline.
- Schema/bucket/edge function isolation — fully matched.
- No SSO — they're proceeding with Supabase Auth on their side, no bridge into coc-creator's bcrypt accounts (option #1 from section E). Per-app login.

## I. Recommended kick-off checklist for akta-kasandry's CLAUDE.md / README

Copy-paste-ready section for akta-kasandry's CLAUDE.md:

```markdown
## Shared Supabase project with coc-creator

This app is a **second tenant** on the Supabase project `okbrsoomtomexilxxsyd`,
sharing it with the `coc-creator` repo. Isolation contract:

- All tables live in the `wiki` schema (NEVER `public`).
- Storage uses the `wiki-attachments` bucket (NEVER `portraits`).
- Edge functions are namespaced under `/wiki/*`.
- All RLS policies reference `auth.uid()` and scope to `wiki.*` only.
- No foreign keys to `public.*`, no triggers on `auth.users` that write to
  `public.*`, no realtime subscriptions beyond `wiki.*`.

Reasoning and full audit: see coc-creator's
`docs/CoCCreator_obsidian/work/akta-kasandry-handoff.md`.

Migrations: apply manually via Supabase SQL Editor — DO NOT run
`supabase db push` from this repo. The migration-tracking table is shared
with coc-creator and competing pushes will collide.
```
