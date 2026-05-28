---
date: 2026-05-20
status: active
tags:
  - integrations
  - cross-project
---

# Integrations

External / sibling systems that depend on coc-creator state. Any change to surfaces listed here needs coordination — see "Coordination" column.

> [!warning] Mirror obligation
> If you tighten an RLS policy or change a public table shape mentioned here, ping the downstream owner BEFORE pushing. These are documented integration surfaces, not internal implementation details.

## Akta Kasandry — `okbrsoomtomexilxxsyd`, schema `wiki`

The RPG wiki/CMS for the "Rozdarte Sumienie" campaign. Separate repo, separate GitHub Pages deploy, co-tenants this Supabase project. Their plan: shared by user 2026-05-20, mirrored here.

Cross-references:
- [[TECHNOLOGY_MASTERMIND#Shared Supabase project with akta-kasandry]] — isolation contract.
- [[work/akta-kasandry-handoff]] — handoff package + confirmation.

### Cross-project reads (coc-creator → akta-kasandry)

| Surface | What they read | Why | Coordination |
|---|---|---|---|
| `public.characters` (anon SELECT) | All rows + all columns at admin-trigger time. Snapshotted into `wiki.imported_characters.data` (jsonb). | "Importuj postać" flow in their `/admin/import-characters` route. Admin picks rows, types player display name, upserts snapshot. | **Tightening `anon_read_characters` policy breaks their import.** Any column rename or removal silently changes the snapshot shape — bump anyone using `wiki.imported_characters.data` if you alter `public.characters`. |
| `storage://portraits/*` (public read) | Portrait URLs referenced in `public.characters.portrait_url` / `profile_portrait_url` / `card_portrait_url`. | Display imported character portraits in wiki. | URLs are snapshotted at import; moves/deletes on our side leave wiki with stale URLs. Acceptable — admin re-imports. **Do not break the public-read policy on `portraits` bucket without coordination.** |

### Character card HTML reuse (evaluated 2026-05-20)

Akta-kasandry asked whether they can reuse coc-creator's character-card HTML to display imported characters (they have `rehype-raw`). Full analysis: [[work/2026-05-20-card-html-for-akta-kasandry]].

**Finding:** the canonical card (HTML v2, `public/templates/card-v2/*.html`, triggered by "Pobierz kartę") is a static **empty A4 print template** filled at runtime by inline JS — NOT a persisted or server-rendered string. It is A4-fixed (210mm×297mm), depends on a global `<style>` block + 3 web fonts, and its `<script>` engine + `<style>` are exactly what a sanitizer strips. So **raw injection via `rehype-raw` is the wrong approach** (blank card, or global-CSS bleed + overflow).

**Recommended:** akta-kasandry is React+Vite+TS — reuse the responsive screen component `src/components/shared/CharacterSheet.tsx` natively (Path 1), not the print card. The reusable decode IP either way is `src/lib/cardFrontMap.ts` + `src/lib/backTocV2Map.ts` + `@/data/*` tables + the data contract in `new_char_sheet/INTEGRATION.md`.

**Open coordination:** if they instead want a persisted self-contained card HTML (Path 2 — headless pre-render into `wiki.imported_characters.card_html`, embedded via `<iframe srcdoc>`), that needs a NEW coc-creator surface (`get_character_card_html(uuid)` endpoint or import-time script). Not built. Awaiting their choice of Path 1 vs Path 2.

> [!success] 2026-05-21 — Path 1 chosen + bundle delivered
> akta-kasandry picked Path 1 (vendor the responsive React component). Delivered a self-contained bundle at `vendor-export/coc-character-sheet/` (25 files): `CharacterSheet.tsx` + all transitive deps (maps, decode logic, `@/data/*` tables, types) with `@/` imports rewritten relative, a NEW `adapter.ts` (`mapCharacterRowToSheet(row): {character}` — recomputes `derived`, drops `admin_notes`), `VENDOR.md` (npm deps = react only; `coc-*` token hex table; dark-theme caveat), and a real fixture (Arthur Henry Corwin row + expected SheetProps). Bundle type-checks clean (`tsc`, Bundler resolution, exit 0); adapter run-verified against the fixture. **Coordination note:** if coc-creator later changes `public.characters` shape or the `CharacterSheetData`/`coc-*` token contract, the vendored copy drifts — ping akta-kasandry to re-vendor. The bundle is a point-in-time copy, not a live link.

### What they DO NOT read

- `public.players` — service-role-only. They type player display name manually instead.
- `public.invite_codes`, `pending_edits`, `edit_permissions`, etc — service-role-only. Out of their reach by design.
- Any coc-creator edge function (`/admin`, `/player`, `/public`) — they have their own.

### What they write

- Only `wiki.*` and `wiki-attachments` bucket. Zero writes into `public.*` or coc-creator's `portraits` bucket.
- Trigger on `auth.users` INSERT writes to `wiki.profiles` ONLY (within our contract — `auth.users → wiki.*` is fine, `auth.users → public.*` is forbidden).

### Coordination triggers (re-read this before doing the following)

If you are about to do any of these in coc-creator, talk to the akta-kasandry side first:

1. **Tighten RLS on `public.characters`** (e.g., switch `anon_read_characters` to a USING expression). → Their import flow breaks.
2. **Remove or rename columns on `public.characters`**. → Their `wiki.imported_characters.data` snapshot shape changes; their queries that extract fields (`name`, `occupation_id`, `era`, `status`, `created_by`) break.
3. **Change `portraits` bucket policy from public-read** to authenticated or service-role. → Their portrait images break.
4. **Wire Supabase Auth into coc-creator** (any `supabase.auth.*` consumption). → The isolation contract in [[TECHNOLOGY_MASTERMIND]] needs revisiting from scratch.

### What stays free of obligation

These are NOT integration surfaces — we can change them freely:

- All edge function endpoints (`/admin/*`, `/player/*`, `/public/*`) — they don't consume them.
- All `public.*` tables EXCEPT `characters` — none of their flows touch them.
- `portraits` bucket internal path conventions (we can move portraits around) — their URLs only become stale, not corrupted.
- Custom auth flow (X-Admin-Password, bcrypt+invite codes) — they don't use it.
- Wizard, character editing, PDF rendering, version history — pure internal.

## Pending migration: Supabase Auth (coordination trigger #4)

**Status:** proposal pending Pawel's approval — design in [[work/2026-05-20-supabase-auth-migration]].
**Triggered by:** akta-kasandry ping 2026-05-20 — their `wiki.*` RLS depends on `auth.uid()`, players authenticated via coc-creator's custom JWT return null from `auth.uid()` and can't edit anything in wiki.

**What changes (coc-creator side):**
- `public.players` survives as extension table: drops `password_hash` (and probably `login`), gains FK `id REFERENCES auth.users(id) ON DELETE CASCADE`. `players.id = auth.users.id` alignment preserves every existing FK chain (`characters.player_id` etc.).
- All player auth moves to Supabase Auth (`signInWithPassword` / magic link). Custom JWT (`x-player-token` / `PLAYER_JWT_SECRET`) retired.
- Edge function `player/index.ts` swaps the verifier (`createToken`/`verifyToken` → Supabase Auth JWT decode via `auth.getUser()`). RLS on `public.*` stays untouched — edge function ownership model preserved.
- Frontend login surface rewritten (`PlayerLogin.tsx`, `playerStore.ts`, `lib/player.ts`). New `/reset` route.
- No new trigger on `auth.users` from coc-creator side. Admin endpoint creates `auth.users` + extension row in one txn.

**What changes (akta-kasandry side, automatic):**
- Their `wiki_on_auth_user_created` trigger fires once per migrated player → ~20 `wiki.profiles` rows materialize automatically, all with default `role='gracz'`. Pawel's row needs a one-time UPDATE to `role='mg'` post-migration.

**Sequencing constraint:**
- Akta-kasandry's `002_profiles.sql` (the trigger) MUST be deployed BEFORE coc-creator's backfill script runs. Either they ship first or we coordinate simultaneous deploy. Otherwise wiki.profiles rows would need manual backfill.

**Estimated timeline (after approval):**
- 1–2 sessions: edge function + migration SQL + backfill script
- 1 session: frontend rewrite (login + reset + session store)
- 1 session: rollout (collect emails, deploy, send magic links, smoke)
- 30 days rollback window (keep `password_hash` column), then cleanup migration

**Once shipped, expect to add a row to "Cross-project reads" matrix above:** akta-kasandry's RLS will indirectly depend on coc-creator's mass-creation of `auth.users`. We commit to never bulk-deleting `auth.users` without coordinating.

## Future integrations

_(none planned beyond Supabase Auth migration above)_
