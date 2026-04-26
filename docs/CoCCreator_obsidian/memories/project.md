---
date: 2026-04-21
status: active
tags:
  - memories
  - coc-creator
---

# CoC Creator — Project Memory

Seed memory for the CoC Creator project. This is the persistent context between sessions. Update sections when state changes materially.

## What this project is

A Polish-language web application for creating Call of Cthulhu (7e) player characters. Built for a private group of players managed by a single admin (the user). Replaces paper character sheets with a structured wizard, editable admin panel, PDF export, and AI-generated portraits.

- **Primary audience:** admin (Pawel, user) who manages campaigns, and players who create/view their characters.
- **Format:** web app (React SPA) + Supabase backend (Postgres + edge functions + storage).
- **Output artefacts:** character data (DB), PDF cards (front + back), AI portraits (SD + Gemini).
- **Language of UI:** Polish. Language of code/docs: English.
- **Scope:** this is a closed tool for one game group — not a public product.

## Current status (2026-04-26)

**New version cycle in planning.** Full implementation plan for the granular-commits rework is written at `~/.claude/plans/granular-commits-v2.md` — ready-to-execute. **Deploy gated on Rafał finishing character `e1cd6edf` on legacy system** (no prod changes until then). Jakub M's 3 drafts submitted 2026-04-22.

**Future-features plan** at `~/.claude/plans/zacznijmy-od-f1-kr-tkie-deep-rivest.md` covers Plan A (Feature 1 — descriptive text generated from stats, 32 paragraphs, deterministic) and Plan B (snapshot/verify scripts before migration 019). Both **shipped 2026-04-26**: Plan A → `src/lib/characterDescriptions.ts` + `src/components/shared/CharacterDescriptions.tsx`, wired into `CharacterSheet` (admin + player viewers). Plan B → `scripts/snapshot-characters.mjs` + `scripts/verify-characters-post-migration.mjs`, with safety baseline at `backups/2026-04-26-safety/` (sha256 `c4b7bcfa…`).

**DB state (2026-04-26 snapshot):** 31 characters total (9 drafts including Rafał's active + 8 balast, 22 submitted), 59 invite codes, 1 pending edit. Earlier docs underestimated this count — vault was tracking only recently-touched chars.

All core features from the original roadmap are **shipped** (admin editing, share links, version history, PDF overlay cards front+back, wealth v2, equipment v2, contact/position v2, Drive+Pillars variant, portrait app feature with player gallery/crop/feedback). Only `development/downtime rules` remains un-started and is deferred.

The new version is about:
- **Reworking general program structure/flow** to address a class of accumulated problems (user will describe scope).
- **Clearing accumulated bugs** (PDF layout, UI edge cases, draft sync).
- **Polish** across wizard, admin editor, player viewer.

The Obsidian vault methodology was adopted on 2026-04-21 to manage this cycle and keep session-to-session continuity.

See [[STRATEGY_AND_TACTICS]] for priorities and [[TASK_LIST]] for active work.

## Tech stack

- **Frontend:** React + TypeScript + Vite. Zustand for state (wizard persist). Component tree under `src/components/{admin,player,shared}`.
- **Backend:** Supabase.
  - Edge functions: `supabase/functions/admin/` and `supabase/functions/player/`.
  - Storage bucket: `portraits/` (with `gallery/[char-id]/` subpaths).
  - Migrations in `supabase/migrations/` — numbered (currently up to `017_sessions_and_distinguisher.sql`; `016_auto_assign_player.sql` also pending/applied — verify before assuming).
- **Auth:** custom. Admin auth via `X-Admin-Password` header. Player auth: bcrypt passwords + invite codes.
- **PDF generation:** in-app renderer (see `src/components/shared/CharacterSheet.tsx` and related).
- **Image pipeline:** Stable Diffusion (local) + Gemini Chat (Profile 4 / Storage). See [[PORTRAIT_PIPELINE]].
- **Scripts:** Node scripts under `scripts/` — `generate-portrait.mjs`, `gemini-browser-gen.mjs`.

## Key domain: Call of Cthulhu mechanics

The app implements CoC 7e with significant custom extensions. Full detail in `docs/RULES_MODIFICATIONS.md` (referenced by [[DOMAIN_COC]]).

Summary of what's **standard** vs **modified** vs **custom**:
- ✅ Standard: characteristics, age/luck, damage bonus, derived attributes.
- 🔧 Modified: skills (extra specializations), occupations (68+ with app-specific modifications), wealth gotówka tiers.
- 🆕 Custom: wealth v2 (6 tiers, gap cost, star rating, lifestyle), perks system (4 perks), 81 additional positions across 11 categories, 50+ contact subcategories, motivation/sanity pillars, invite code system, character editing permissions, player accounts.

## Important constraints / user preferences

- **No new player accounts** without explicit instruction. User manages account creation personally.
- **Verify screenshot-transcribed data** before DB inserts — past experience: typos from screenshots causing bad data.
- **Communication in Polish.** Docs in English.
- **Terse > verbose.** User reads diffs; doesn't need long summaries of what was just done.

## People

- **User (Pawel / UrsusCodes):** solo developer + game master. Admin of the app.
- **Players:** small closed group. Named players who appear in context: Rafał (currently working on a character on the legacy system — deployment of the code-identity rework is gated on him finishing).

## Key files / entry points

- `CLAUDE.md` (repo root) — session workflow, links to vault.
- `docs/CoCCreator_obsidian/` — this vault.
- `docs/RULES_MODIFICATIONS.md` — full mechanic delta vs CoC 7e (canonical domain doc).
- `docs/TASKLIST.md` — legacy completed-task log (archived; new tasks live in [[TASK_LIST]]).
- `src/lib/artPrompt.ts` — prompt generator for SD portraits.
- `src/components/admin/ArtPromptSection.tsx` — admin UI for prompt + gallery.
- `src/components/shared/CharacterSheet.tsx` — PDF card rendering.
- `supabase/functions/admin/index.ts` — admin edge function.
- `supabase/functions/player/index.ts` — player edge function.

## External resources

- **Supabase project URL:** `https://okbrsoomtomexilxxsyd.supabase.co`
- **Supabase storage bucket:** `portraits/`
- **Stable Diffusion:** local install, any realistic model (Deliberate, Realistic Vision, etc.).
- **Gemini Chat:** accessed via browser (Profile 4 / Storage) — orchestrated by `scripts/gemini-browser-gen.mjs`.

## Decisions log (high-level)

Low-frequency, durable decisions. Implementation-level decisions go in [[DOCS_CHANGES_JOURNAL]] per session.

- **2026-04-26** — Feature 1 shipped: "Portret z cech" deterministic narrative paragraphs derived from stats (32 paragraphs, 8 stats × 4 categories). Web-only (no PDF), no DB. `src/lib/characterDescriptions.ts` + `src/components/shared/CharacterDescriptions.tsx`, wired through shared `CharacterSheet`.
- **2026-04-26** — Snapshot/verify tooling shipped (`scripts/snapshot-characters.mjs`, `scripts/verify-characters-post-migration.mjs`). Backups committable to git in `backups/`. `ADMIN_PASSWORD` stays out of `.env.local`, passed inline per invocation. Safety baseline `2026-04-26-safety` taken before any further structural work.
- **2026-04-22** — Granular-commits rework scoped: per-step server-authoritative commits across hard zone (identifier → characteristics → swap → age → EDU → aging → luck), soft back-step in middle zone, narrative editable anytime. Plan at `~/.claude/plans/granular-commits-v2.md`. In-place migration (not greenfield).
- **2026-04-21** — Adopted Obsidian vault methodology. Vault at `docs/CoCCreator_obsidian/`. English docs, Polish chat.
- **2026-03-18** — Roadmap of 9 features confirmed; 8 shipped, `downtime rules` deferred indefinitely.
- **2026-03-17** — Wealth v2 spec finalized (see [[specs/wealth_v2_spec]]): 6 tiers, gap formula, 5-star rating, presets, 3 catalogs.
- **2026-03-16** — Back card fields (see [[specs/back_card_spec]]): ekwipunek / dobytek / pozycja / kontakty as separate line items.
- **(earlier)** — Portrait flow: SD local + Gemini Chat → variant gallery per character → player picks → crop → feedback loop (see [[specs/portrait_app_feature_spec]]).
- **(earlier)** — Custom auth: admin via `X-Admin-Password`, players via invite codes + bcrypt (not Supabase Auth).
- **(earlier)** — 3-level editing permissions: lore / standard / full, granted per-character by admin.

## Open questions / parked threads

_(none actively parked — use this section when a thread stalls waiting on external input)_
