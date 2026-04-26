---
date: 2026-04-21
status: active
tags:
  - conventions
  - logging
---

# Logging Instructions

Conventions for recording work across the vault, commits, and inline notes.

## Commits

- **Imperative mood, English.** `Fix dodge box on PDF card`, not `fixed the dodge box`.
- **Scope prefix optional** but helpful for searchability: `PDF:`, `wealth-v2:`, `admin-ui:`, `portrait:`.
- **Reference bug/feature** in the body if it's a known item from [[TASK_LIST]].
- **Don't skip pre-commit hooks** (`--no-verify`) without explicit user instruction.
- **Never force-push to main/master.**

## Session journal entries

File: [[DOCS_CHANGES_JOURNAL]].

One entry per working session. Format:

```markdown
## YYYY-MM-DD — <short session title>

**Focus:** <one-liner on what this session was about>

**Done:**
- Bulleted list. Reference files (`src/...`) and commits (short SHA).

**Decisions:**
- Any non-trivial call made during the session. Include *why*.

**Open threads / next up:**
- What wasn't finished. What's blocked. What the next session should pick up.

**Files touched:**
- Short list of top-level areas (not every file).
```

## Work/ notes

File: `work/<YYYY-MM-DD>-<short-slug>.md`. Use when:
- A task needs deep scratch space (repro steps, hypotheses, design scribbles).
- A decision has enough context to deserve its own page.
- A bug investigation has multiple threads to keep straight.

Don't use for trivial tasks that are done in one pass — those go directly into the journal.

Every new work/ note must be added as a link in [[work/Index]].

## Specs/

File: `specs/<feature-slug>.md`. Use before writing code for any feature bigger than a trivial fix.

Spec structure (flex as needed):
- **Problem** — what pain this addresses.
- **Scope** — what's in / out.
- **Design** — data model, UI, API changes.
- **Migration plan** — if schema changes.
- **Open questions** — things to resolve before coding.
- **Acceptance** — how we'll know it's done.

## Outputs/

Per-character generated assets get a companion markdown in `outputs/characters/[char-id]/`. See [[outputs/characters/README]].

Reusable prompt banks live in `outputs/prompts/`. See [[outputs/prompts/README]].

## Tags

Use hierarchical lowercase tags:
- `#feature/wealth`, `#feature/portrait-app`
- `#bug/pdf-card`, `#bug/draft-sync`
- `#spec/wealth-v2`, `#spec/portrait-app`
- `#decision`, `#blocked`, `#parked`

## Dates

Always **absolute ISO** (`2026-04-21`). Never "yesterday", "last week", "next Thursday" in permanent records.
