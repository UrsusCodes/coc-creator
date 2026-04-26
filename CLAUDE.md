# CoC Creator — Claude Code Instructions

## Language

- **Communication with user:** Polish.
- **All documentation in the Obsidian vault (`docs/CoCCreator_obsidian/`):** English.
- **Code comments, commits, PRs:** English.
- **User-facing UI text in the app:** Polish (it's a Polish-language RPG tool).

## Session Start

At the beginning of every session, read these files in order:

1. `docs/CoCCreator_obsidian/memories/project.md` — full project context, who/what/why.
2. `docs/CoCCreator_obsidian/TASK_LIST.md` — active work, backlog, known bugs.
3. `docs/CoCCreator_obsidian/STRATEGY_AND_TACTICS.md` — roadmap, current priorities.
4. `docs/CoCCreator_obsidian/DOCS_CHANGES_JOURNAL.md` — last 1–2 session entries (what we ended with).
5. `docs/CoCCreator_obsidian/work/Index.md` — map of in-progress work notes.

Then, if relevant to the user's first request, pull in any of:
- `TECHNOLOGY_MASTERMIND.md` — stack, architecture, technical decisions.
- `DOMAIN_COC.md` — CoC rules as implemented in the app (links to `docs/RULES_MODIFICATIONS.md`).
- `PORTRAIT_PIPELINE.md` — end-to-end portrait generation workflow.
- `DESIGN.md` — card layout, UI/UX conventions.
- `specs/` — per-feature specs (wealth v2, portrait app feature, etc.).
- `outputs/characters/[char-id]/` — per-character companion notes.

Do **not** re-read unchanged files mid-session. The memory above is enough for context continuity.

## Session End

Trigger words (any of these from the user): **"zapisz"**, **"koniec"**, **"save"**, **"zamykamy"**, **"konczymy"**.

Also: when you notice the conversation is approaching context limits, proactively suggest running Session End before the user has to.

On Session End, update:

1. `DOCS_CHANGES_JOURNAL.md` — append a new dated entry: what was done, files changed, decisions made, open threads.
2. `TASK_LIST.md` — mark completed items, add newly discovered bugs/tasks, re-prioritize if needed.
3. `memories/project.md` — update any section where the project state materially changed (status, active work, decisions).
4. `work/Index.md` — add links to any new `work/*.md` notes created this session.
5. If a feature spec changed → update the relevant file in `specs/`.
6. If portraits or PDFs were generated → update `outputs/characters/[char-id]/` companion notes.

After updating, give the user a **brief Polish summary** of what was saved and where.

## Obsidian Conventions

Documentation in the vault uses Obsidian flavor:

- **Wikilinks:** `[[TASK_LIST]]`, `[[specs/wealth_v2_spec|wealth v2]]`, `[[outputs/characters/piotr-s/portrait_prompt]]`.
- **Tags:** `#feature/wealth`, `#bug/pdf-card`, `#spec/portrait-app`, `#decision`. Hierarchical, lowercase, kebab-case after slash.
- **YAML frontmatter** on every vault file:
  ```yaml
  ---
  date: 2026-04-21
  status: active | draft | done | archived
  tags:
    - area-tag
    - type-tag
  ---
  ```
- **Embeds:** `![[outputs/characters/piotr-s/portrait_prompt#Final prompt]]` to pull sections inline.
- **Callouts:** `> [!note]`, `> [!warning]`, `> [!decision]`, `> [!bug]` for emphasis.
- **Dates:** ISO `YYYY-MM-DD`, absolute (no "yesterday", "next week").

## File Reference

| File | Purpose | When to update |
|---|---|---|
| `memories/project.md` | Persistent project context, seed memory | Whenever project state, stack, people, or constraints change materially |
| `TASK_LIST.md` | Active sprint, backlog, known bugs | Every session — add/complete/reprioritize |
| `STRATEGY_AND_TACTICS.md` | Roadmap, north star, current version focus | When priorities shift or a major feature lands |
| `TECHNOLOGY_MASTERMIND.md` | Stack, architecture, technical decisions | When adding a dependency, changing architecture, or making a tech decision |
| `DOMAIN_COC.md` | CoC rules as implemented (links to `RULES_MODIFICATIONS.md`) + app-specific mechanics (wealth v2, stars, gap formula, card logic) | When rule interpretation or mechanic changes in the app |
| `PORTRAIT_PIPELINE.md` | End-to-end: prompt gen → Gemini → SD → Storage → gallery → player feedback | When pipeline steps or prompt template change |
| `DESIGN.md` | Card layouts (front/back), typography, field placement, UI conventions | When changing card layout or UI conventions |
| `LOGGING_INSTRUCTIONS.md` | How to log work: commits, journal entries, work/ notes, file naming | Rarely — conventions only |
| `DOCS_CHANGES_JOURNAL.md` | Changelog per session: what was done, files touched, decisions | Every Session End |
| `work/Index.md` | Map of work/*.md notes (per-task scratch/decision notes) | When a new work/ note is created |
| `work/*.md` | Per-task deep notes: repros, hypotheses, design scratch, decision rationale | Freely during a task |
| `specs/*.md` | Per-feature specifications (wealth v2, portrait app, back card, etc.) | Before implementing a feature and as the design is iterated |
| `outputs/characters/[id]/` | Companion notes per character: portrait prompts, gallery decisions, PDF notes, player feedback | Whenever generating/updating a character's creative output |
| `outputs/prompts/` | Reusable prompt banks: SD base prompts, negatives, style modifiers | When refining the generation prompt template |

## Project-Specific Notes

- **Existing docs outside the vault:** `docs/RULES_MODIFICATIONS.md` (full mechanic delta vs CoC 7e) and `docs/TASKLIST.md` (historical completed work log). These are referenced from the vault but not duplicated.
- **Supabase credentials** — never hard-code. Use env vars. Project URL: `https://okbrsoomtomexilxxsyd.supabase.co`.
- **Never create new player accounts** without an explicit instruction from the user.
- **Verify screenshot-transcribed data** before DB inserts — always double-check values the user pastes from a screenshot.
