---
date: 2026-04-21
status: active
tags:
  - outputs
  - characters
---

# Per-Character Outputs

One subfolder per character: `outputs/characters/<char-id-or-slug>/`.

Binaries live in Supabase Storage (bucket `portraits/gallery/<char-id>/`). This folder stores **companion markdown** — prompts, decisions, feedback, rationale.

## Convention

For a character, keep:

- `portrait_prompt.md` — final SD prompt used + iteration history + config overrides (model, sampler, size if different from default).
- `gallery_notes.md` — per-variant notes: what was different, which was picked as active, player feedback if any.
- `pdf_card_notes.md` — anything unusual about this character's card rendering (long backstory wrap, custom equipment, etc.).

Not every character needs all three. Create as needed.

## Frontmatter template

```yaml
---
date: YYYY-MM-DD
status: active
tags:
  - outputs
  - character/<slug>
character_id: <uuid-or-slug>
---
```

## Index

_(populate with links as character folders are created)_
