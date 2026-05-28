---
date: 2026-04-21
status: active
tags:
  - index
  - work-notes
---

# Work Notes — Index

Map of `work/*.md` scratch and decision notes. Newest at the top.

## Active

- [[work/2026-05-28-front-b-recon]] — **2026-05-28** — Front B (CONSTANTA-1) reconnaissance: DB inventory (5 spending_level formats, residence/birthplace coverage 7/23) + code surface map (5 render paths for spending_level, 15+ touch-points for residence). Findings drove [[../specs/birthplace_residence_integration]] + [[../specs/spending_level_normalization]] (Path B). Recorded BUG-014 was already fixed in `53a2674` — briefing was stale.
- [[work/2026-05-20-card-html-for-akta-kasandry]] — **2026-05-20** — Can akta-kasandry reuse coc-creator's character-card HTML? Answers their 7 questions. Verdict: the canonical card (HTML v2) is an empty A4 print template filled by runtime JS, not persisted/extractable; rehype-raw injection is wrong. Recommends sharing the responsive React `CharacterSheet.tsx` (Path 1) over the print card. Maps the reusable decode IP (cardFrontMap/backTocV2Map + data tables + INTEGRATION.md contract). Real rendered sample generated via Playwright.
- [[work/2026-05-20-supabase-auth-migration]] — **2026-05-20** — Design proposal: migrate `public.players` (bcrypt+custom JWT) → Supabase Auth. Triggered by akta-kasandry's ping (one of 4 coordination triggers from INTEGRATIONS). Answers 7 design questions (bcrypt hashes, FKs, players table survival, RLS scope, UI scope, sequencing, rollback) + lists 7 decisions for Pawel's approval. NO CODE until approved.
- [[work/akta-kasandry-handoff]] — **2026-05-19** — Handoff package for the new "Akta Kasandry" app that will co-tenant the existing Supabase project. Connection facts, naming conventions, isolation contract (do/don't), SSO decision, free-tier budget, kick-off checklist for akta-kasandry's CLAUDE.md.
- [[work/v2-deploy-plan]] — **2026-04-27** — Complete punch list for shipping v2.0 (granular commits rework). Backend done in repo; covers wizard rewrite (3 sub-sessions), pre-deploy housekeeping, deploy day procedure, smoke test matrix, rollback plan. Master document for the rest of the cycle.

## Archived

_(empty)_

---

> [!tip]
> Create a new work note when a task needs scratch space (repro, hypotheses, design scribbles) or deserves its own decision page. Trivial one-pass tasks go directly into [[DOCS_CHANGES_JOURNAL]]. See [[LOGGING_INSTRUCTIONS]] for the convention.
