---
date: 2026-04-21
status: active
tags:
  - outputs
  - prompts
---

# Prompt Banks

Reusable prompt fragments for generation pipelines. Not per-character — those go in [[outputs/characters/README|outputs/characters/]].

## Planned files

- `sd_base_positive.md` — baseline positive prompt elements, style modifiers per era.
- `sd_negative.md` — canonical negative prompt (start from what's in [[PORTRAIT_PIPELINE]]).
- `gemini_refinement.md` — prompt templates for Gemini-driven prompt refinement.

## Convention

Each file uses YAML frontmatter with `tags: [outputs, prompts, <pipeline>]` and documents when/why each fragment is used.

_(empty — populate as prompts stabilize and become reusable)_
