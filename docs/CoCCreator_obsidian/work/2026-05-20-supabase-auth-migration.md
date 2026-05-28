---
date: 2026-05-20
status: proposal
tags:
  - work-note
  - migration
  - auth
  - akta-kasandry
---

# Supabase Auth migration — design

> [!proposal] Status
> Proposal. Triggered by akta-kasandry's ping (one of the four coordination
> triggers from [[INTEGRATIONS#Coordination triggers]]). Awaits Pawel's
> approval before any code change.
>
> Estimated lift after approval:
> - Backend (edge functions + migration scripts): 1–2 sessions
> - Frontend (login surface + session store): 1 session
> - Rollout (collect emails, mass-create auth.users, send magic links, smoke): 1 session

## TL;DR

Migrate ~10–20 existing players from custom bcrypt+JWT to Supabase Auth.
Keep `players.id = auth.users.id` (UUID alignment) so every FK survives
untouched. Big-bang migration — small closed group makes the gradual /
dual-write approach not worth the complexity. Bcrypt hashes are **not**
importable; forced password reset via magic link is the standard
Supabase path. `public.players` survives as an **extension table**
(domain-specific columns + FK to `auth.users`). No new trigger on
`auth.users` on coc-creator side — admin creates auth user + extension
row in one transaction; akta-kasandry's `wiki_on_auth_user_created`
auto-creates `wiki.profiles`. All cross-app SSO is then implicit.

## Context (recap)

- coc-creator does NOT use Supabase Auth today. Player auth = custom
  bcrypt + HS256 JWT signed with `PLAYER_JWT_SECRET`, stored as
  `x-player-token` header / `localStorage.player_token`.
- `public.players` schema: `id UUID PK, name TEXT, login TEXT UNIQUE,
  password_hash TEXT, is_active BOOL, created_at TIMESTAMPTZ`.
- Six FKs to `players.id`: `characters.player_id`, `player_codes.player_id`,
  `pending_edits.player_id`, `edit_permissions.player_id`,
  `portrait_generations.player_id`, `invite_codes.assigned_player_id`. Plus
  optional `portrait_feedback.player_id`.
- Player count in production: ~10–20 (small closed group, admin-created
  only, no public signup endpoint, no password reset endpoint).
- All per-player access control lives in **edge function code**, not in
  RLS. Pattern: decode JWT → extract `playerId` from `.sub` claim →
  `.eq('player_id', playerId)` on every query. RLS on private tables is
  `service_role`-only (deny-all to everyone else).
- `@supabase/supabase-js ^2.98.0` is already a dependency — has
  `auth.signInWithPassword`, `auth.signUp`, `auth.resetPasswordForEmail`,
  `auth.admin.createUser` (admin-side) all available.

## Q1 — Bcrypt hashes

**Recommendation: forced reset via magic link.**

Supabase Auth stores password hashes in `auth.users.encrypted_password`
using its own algorithm (currently scrypt-derived; bcrypt is not natively
accepted by `auth.admin.createUser`). There are exotic options (custom
password hash on `auth.users` via direct SQL writes, or a self-hosted
GoTrue with a custom bcrypt verifier plugin), but both require touching
the Auth service internals — not worth it for ~20 accounts.

**Plan:**
1. Admin (Pawel) collects email addresses for every active player
   out-of-band (group chat). One-time data collection.
2. Backfill script creates each `auth.users` row via
   `supabase.auth.admin.createUser({ id, email, email_confirm: true,
   password: <random throw-away> })` — passing `id` explicitly to align
   with existing `players.id`.
3. Same script sends magic-link sign-in email to each (via
   `supabase.auth.admin.generateLink({ type: 'magiclink' })`) so first
   sign-in doesn't need the throwaway password.
4. On first sign-in, frontend prompts "Ustaw hasło do nowego logowania"
   and calls `supabase.auth.updateUser({ password })`.

**Impact on active sessions during migration:** existing
`localStorage.player_token` tokens stay valid until they expire
(24-hour lifetime — see `supabase/functions/player/index.ts:39`). Two
options:

- **(a) Hard cutover:** edge function flips to Supabase Auth verifier
  in the same deploy. All existing tokens immediately invalid →
  players see "session expired" on next request → they re-login via
  magic link. UX: one bump per player. Simpler.
- **(b) Soft cutover:** edge function accepts BOTH custom JWT and
  Supabase Auth JWT for a 24-hour window, then drops custom support.
  Smoother but doubles the verifier code path.

Recommendation: **(a) hard cutover**. Group is small, Pawel can announce
the window in chat, players reset once. Soft path adds maintenance burden
for marginal UX gain.

## Q2 — `characters.player_id` FK

**Recommendation: keep the FK pointing at `public.players(id)`. Do NOT
refactor to point at `auth.users(id)` directly.**

`public.players` survives as an extension table (see Q3). With
`players.id = auth.users.id`, the FK chain is logically transitive
(`characters → players → auth.users`) without any data change. Every
existing row stays valid.

**If we ever wanted to drop `public.players` entirely** (we shouldn't —
see Q3), the FK could be repointed at `auth.users(id)` via:

```sql
ALTER TABLE characters
  DROP CONSTRAINT characters_player_id_fkey,
  ADD CONSTRAINT characters_player_id_fkey
    FOREIGN KEY (player_id) REFERENCES auth.users(id) ON DELETE SET NULL;
```

But this couples coc-creator schema to `auth.users` which lives in
Supabase's auth schema (less stable contract than our own table).
Indirect FK via `public.players` is the cleaner long-term shape.

**Existing rows:** zero changes. UUIDs already in `characters.player_id`
remain valid pointers into the new `public.players` (which still has the
same `id` values, just no longer holding the password).

## Q3 — `public.players` survive or deprecate

**Recommendation: survive as extension table.**

Drop the auth-specific columns (`password_hash`, possibly `login`), keep
or add domain columns:

```sql
-- post-migration shape (proposed):
public.players (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,        -- display name in admin UI
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
  -- DROP password_hash
  -- DROP login   (Supabase Auth uses email; `name` is enough for display)
)
```

Rationale (matches what akta-kasandry asked for):
- Clean separation: `auth.users` = identity (handled by Supabase Auth);
  `public.players` = domain-specific profile (display name,
  admin-managed active flag, FK target for character ownership).
- Migration is non-destructive on existing rows — we just drop two
  columns and add a self-referential-to-auth FK.
- Future columns (e.g., player-specific perks, character creation
  budgets, reroll allowances) have a natural home without polluting
  `auth.users.user_metadata`.

**Sub-question: do we keep `login` or drop it?** Currently `login` is
the username players type in. Post-migration they sign in with email
(or magic link). The `login` field becomes redundant — drop it.
Existing players who knew their login can be told "new login = your
email".

If Pawel prefers to keep `login` (for nostalgia or because some players
identify by handle), we can keep it as `display_handle` — but it stops
being unique-identifier territory, only a UI label.

**Cascade on FK to `auth.users`:** `ON DELETE CASCADE`. If an admin
deletes a user from Supabase Auth, the extension row goes too, and FKs
on `characters` (ON DELETE SET NULL), `pending_edits` (CASCADE),
`edit_permissions` (CASCADE), `portrait_generations` (CASCADE), and
`invite_codes.assigned_player_id` (SET NULL) all fire correctly.

## Q4 — RLS rewrite scope

**Recommendation: NO RLS rewrite. Keep edge-function ownership model.**

This is the key cost-saver. Today:
- All private tables (players, player_codes, pending_edits,
  edit_permissions, portrait_generations, portrait_feedback) are
  `service_role`-only at the RLS layer.
- Edge functions use `SUPABASE_SERVICE_ROLE_KEY` and bypass RLS entirely.
- Per-player ownership is enforced in edge function code by
  `.eq('player_id', playerId)` filters after decoding the JWT.

Migration changes ONE thing in this model: where `playerId` comes from.
Before: custom JWT `.sub`. After: Supabase Auth JWT, extracted via
either Supabase JS client (frontend) or by passing the Authorization
header through and decoding (edge function).

**Files that change:**

- `supabase/functions/player/index.ts:39–55` — replace `createToken()` /
  `verifyToken()` helpers with Supabase Auth JWT verification. The
  cleanest path is to invoke a Supabase client with the user's
  Authorization header forwarded, then call `supabase.auth.getUser()`
  to extract the auth.uid(). ~20 lines of change.
- `supabase/functions/player/index.ts:264–286` — delete the
  `/player/login` handler. Login moves entirely client-side via
  `supabase.auth.signInWithPassword`. ~25 lines deleted.
- Every endpoint that today reads `x-player-token` header — switch to
  reading `Authorization: Bearer <token>` (Supabase convention). All
  ownership filters (`.eq('player_id', playerId)`) stay identical.

**Files that do NOT change:**
- No RLS policy in any migration. None of them reference player identity
  today; none need to after.
- `supabase/functions/admin/index.ts` — admin auth stays as
  `X-Admin-Password` header (orthogonal to player auth).
- `supabase/functions/public/index.ts` — share-token auth stays as-is.

**Future option (not in this migration):** if we ever wanted Supabase JS
client to query directly from the frontend with player auth (skipping
edge functions for read endpoints), we'd add `auth.uid()`-based RLS to
`public.characters` and friends. That's a separate refactor, out of
scope here.

## Q5 — UI rewrite scope

**Recommendation: minimal surface — login form + session bootstrap +
new password-reset page.**

Files that change:

| File | Today | Post-migration |
|---|---|---|
| `src/components/player/PlayerLogin.tsx` | login + password fields → POST to `/player/login` via `playerStore.login()` | Email + password fields → `supabase.auth.signInWithPassword({ email, password })`. Add "Wyślij link logowania" button for magic-link option. Add "Zapomniałem hasła" → `auth.resetPasswordForEmail()` |
| `src/lib/player.ts` | `playerFetch()` adds `X-Player-Token` header from localStorage | Adds `Authorization: Bearer ${token}` from `supabase.auth.getSession()`. `playerLogin` function deleted. |
| `src/stores/playerStore.ts` | Reads `localStorage.player_token`, decodes JWT manually for expiry check, manages auth state | Wires to `supabase.auth.onAuthStateChange`. `isAuthenticated` becomes derived from `supabase.auth.getSession()`. `logout` calls `supabase.auth.signOut()`. |
| NEW: `src/components/player/PasswordResetPage.tsx` | n/a | New route for `/reset` — handles the magic-link landing + new password form. ~50 lines. |
| `src/components/player/PlayerDashboard.tsx` | reads `playerStore.player.name` | unchanged — name still on extension `public.players` row (admin endpoint exposes it on `/me`) |

**Frontend deps:** `@supabase/supabase-js ^2.98.0` already installed. No
new deps needed.

**Routes affected:** `/login` (rewritten), `/reset` (new). Wizard /
dashboard / character viewer / portrait gallery — zero changes (they
read from `playerStore` which we adapt internally).

**Estimated lines of change:** ~150 lines net (a lot deleted from
custom JWT code, ~50 added for Supabase Auth wiring + new reset page).

## Q6 — Migration sequencing

**Recommendation: big-bang in a scheduled 2-hour window.**

Small closed user base + Pawel personally knows all players + announcing
a maintenance window in group chat is trivial → gradual / feature-flag
machinery is overkill.

**Order of operations:**

1. **T-7 days:** Pawel collects player emails out-of-band.
2. **T-2 days:** Pre-flight checks
   - Verify akta-kasandry's `wiki_on_auth_user_created` trigger is
     deployed (their `002_profiles.sql`). If not, coordinate timing —
     our backfill MUST run after their trigger exists or `wiki.profiles`
     rows won't be auto-created for migrated users.
   - Snapshot `public.players` table: `node scripts/pg-dump-all.mjs
     --tag pre-auth-migration`.
   - Build and stage new edge function + frontend in branch.
3. **T-day, T-0:** announce window in group chat. "Appka będzie
   niedostępna ~2h, po tym dostaniecie link do nowego logowania."
4. **T+0min:** apply migration SQL (drop `password_hash`, optionally
   `login`; add FK `public.players.id REFERENCES auth.users(id)`).
   This is technically reversible until the auth.users rows exist.
5. **T+10min:** run backfill script — for each row in `public.players`,
   call `auth.admin.createUser({ id, email, email_confirm: true })`.
   This fires akta-kasandry's `wiki_on_auth_user_created` trigger once
   per row → wiki.profiles rows materialize.
6. **T+20min:** deploy edge function (drops `/player/login`, swaps JWT
   verifier).
7. **T+30min:** deploy frontend (new login page, new session bootstrap).
8. **T+40min:** send magic-link invites to all players via
   `auth.admin.generateLink`.
9. **T+45min:** smoke test — sign in as one test player via magic link,
   set password, navigate to a character, edit narrative, sign out.
10. **T+1h:** announce window closed.

**Coordination with akta-kasandry:**
- Their trigger MUST exist before our T+10min step. If their schema
  isn't deployed yet, either delay our migration OR they deploy schema
  001–002 first, OR we skip the trigger dependency and they backfill
  their `wiki.profiles` from `auth.users` manually post-migration
  (one INSERT...SELECT). Cleanest: their schema first.
- The trigger writes `wiki.profiles` with default `role='gracz'`. Pawel
  (the MG) needs his row's role bumped to `'mg'` after creation —
  one-time UPDATE. Document in akta-kasandry's launch checklist.

**No coordination needed for naming:** their trigger is
`wiki_on_auth_user_created`; we are NOT adding any trigger on
`auth.users`. Zero conflict possible.

## Q7 — Backward compat / rollback

**Rollback window: 30 days.** After that, drop `password_hash` column
in a follow-up migration (`023_drop_player_password_hash.sql`).

**Rollback plan if something blows up:**

| What broke | Detect | Revert |
|---|---|---|
| Edge function rejects valid Supabase Auth JWTs | Smoke fails at T+45min | Re-deploy previous edge function version (still keyed off custom JWT). `password_hash` is still in the table, custom JWTs still work. |
| Frontend can't sign in (login form bug) | Smoke fails at T+45min | Re-deploy previous frontend commit. Same as above — custom auth still works server-side until the edge function flips. |
| Schema migration corrupts data | Detect during step 4 — `BEGIN ... ROLLBACK` if anything looks off | The schema migration in step 4 should be transactional. If it fails, txn rolls back, no data lost. |
| `auth.users` backfill fails halfway through (some users created, some not) | Script logs per-user status | Either continue from where it left off (script is idempotent if it checks `auth.users` existence first), OR delete the partially-created auth.users rows via `auth.admin.deleteUser` and restart. |
| Players hate the new flow | Within first week | Re-enable `/player/login` endpoint (still has the code in git history), point frontend back at it. `password_hash` is still in DB. Players use old passwords. Then redesign and try again later. |

**Pre-migration snapshot:** `scripts/pg-dump-all.mjs --tag
pre-auth-migration` taken at step 2 above. Includes `public.players` with
intact `password_hash` column. Audit-trail-safe but not committed to
git (it's gitignored — contains hashes).

**Post-30-day cleanup:**
- Drop `password_hash` from `public.players`.
- Drop `login` if Pawel approved that in Q3.
- Drop `PLAYER_JWT_SECRET` from edge function env vars.
- Delete dead code paths (custom `createToken` / `verifyToken`).
- Remove `bcryptjs` import from edge function — no longer used.

## Decisions needing Pawel's approval before implementation starts

> [!decision] Block list — these need explicit yes/no before any code lands

1. **Approve big-bang over gradual.** Confirm the 2-hour maintenance
   window is acceptable; group can be coordinated via chat. (Section
   Q6.)
2. **Approve dropping `login` column** (post-migration players sign in
   with email) OR keep it as a display handle? (Section Q3.)
3. **Approve forced magic-link reset** vs. attempting bcrypt
   compatibility hacks. (Section Q1.) Recommendation strongly: magic
   link.
4. **Approve no-trigger approach** on our side (admin creates auth.users
   + extension row in one transaction; no AFTER INSERT trigger from
   coc-creator). Reminder: akta-kasandry's trigger will fire and create
   `wiki.profiles` — Pawel's row needs manual role bump to 'mg' once.
   (Section Q6.)
5. **Approve no RLS rewrite** — keep edge-function ownership model.
   (Section Q4.) This is the largest cost-savings vote.
6. **Confirm 30-day rollback window** is acceptable before dropping
   `password_hash`. (Section Q7.)
7. **Confirm dependency timing with akta-kasandry:** their
   `wiki_on_auth_user_created` trigger MUST be deployed before our
   backfill runs. Either akta-kasandry ships first, OR we coordinate
   simultaneous deploy. (Section Q6.)

## Out of scope for this migration

- **Adding signup flow.** Today players are admin-created only. That
  doesn't change post-migration — admin endpoint `POST /admin/players`
  just internally calls `auth.admin.createUser` + inserts extension
  row. No public signup surface.
- **RLS on `public.characters`** to drop edge function intermediation.
  Separate refactor. The existing `anon_read_characters` open policy
  also stays (it's an integration surface for akta-kasandry — see
  [[INTEGRATIONS]]).
- **Email / phone / OAuth provider configuration in Supabase Auth
  dashboard.** Pawel must enable email provider with magic-link
  templates configured. Out of code scope, in dashboard config scope.
- **Linking past `auth.users` (zero today) to anything.** Production
  has `auth.users` count = 0 (verified 2026-05-19). Greenfield from
  Auth's perspective.

## Files this migration will touch (when approved)

```
NEW supabase/migrations/023_player_auth_supabase.sql
NEW supabase/migrations/024_drop_player_password_hash.sql   # T+30 days

MODIFY supabase/functions/player/index.ts                   # ~80 lines change
DELETE custom JWT helpers in player/index.ts                # ~25 lines

NEW scripts/migrate-players-to-auth.mjs                     # admin backfill, ~100 lines

MODIFY src/components/player/PlayerLogin.tsx                # rewrite, ~60 lines
NEW src/components/player/PasswordResetPage.tsx             # ~50 lines
MODIFY src/lib/player.ts                                    # ~30 lines change
MODIFY src/stores/playerStore.ts                            # rewrite of init/login/logout, ~40 lines
MODIFY src/App.tsx                                          # +1 route for /reset
```

Net effect: ~+250 / -100 lines.

## See also

- [[INTEGRATIONS#Coordination triggers]] — this migration is trigger #4.
- [[TECHNOLOGY_MASTERMIND#Why custom auth (invite codes + bcrypt) instead of Supabase Auth]] — the original rationale for custom auth. Reasoning ("Closed, invite-only system... Supabase Auth would be overkill") is being revisited because akta-kasandry now needs Supabase Auth identity for cross-app RLS.
- [[work/akta-kasandry-handoff#E. SSO between the two apps — open decision]] — earlier handoff section explicitly listed this as option #2 (bridge). This work note IS the option #2 design.
