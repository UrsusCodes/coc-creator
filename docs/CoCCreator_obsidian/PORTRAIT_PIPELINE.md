---
date: 2026-04-21
status: active
tags:
  - pipeline
  - portraits
  - sd
  - gemini
---

# Portrait Generation Pipeline

End-to-end workflow for generating character portraits.

## Flow overview

1. Open admin panel → Characters → pick a character → "Grafika" section.
2. Auto-prompt is generated from character data (appearance, traits, occupation, era).
3. Copy prompt → paste into Stable Diffusion WebUI.
4. Upload generated images into the variant gallery in admin.
5. Player views the gallery and picks their portrait.

## Prompt generation

Source: `src/lib/artPrompt.ts` → `generateArtPrompt(character)` returns an SD-ready prompt.

The prompt is assembled from:
- **Age + sex** — `portrait of a middle-aged man, 45 years old`.
- **Occupation** — from `OCCUPATIONS` data → `private detective by profession`.
- **Appearance** — `backstory.appearance_description` or `appearance` field.
- **Build** — derived from STR/SIZ/CON → `large, muscular build`.
- **Attractiveness** — derived from APP (`very attractive` at APP≥70, `plain-looking` at APP≤35).
- **Traits** — `backstory.traits` if short enough.
- **Visible equipment** — weapons from `equipment[]`, max 3 items.
- **Era** — 1920s / modern / gaslight → appropriate clothing style.
- **Style modifiers** — `detailed face, realistic, dramatic lighting, painterly style`.

See `src/lib/artPrompt.ts` for the exact assembly order and thresholds.

## Stable Diffusion config

```
Model:            any realistic (Deliberate, Realistic Vision, etc.)
Positive prompt:  [copied from admin panel]
Negative prompt:  blurry, deformed, extra limbs, extra fingers, bad anatomy,
                  watermark, text, signature, low quality, cartoon, anime
Steps:            30
CFG Scale:        7
Size:             512x768 (portrait)
Sampler:          DPM++ 2M Karras
```

## Gemini Chat bridge (optional / when used)

When the SD result needs an alternate composition or the prompt needs refinement via an LLM:
- Uses `scripts/gemini-browser-gen.mjs` to orchestrate Gemini Chat in a browser.
- Profile 4 / Storage.
- Typically used for: prompt refinement, alternate poses, background suggestions.

## Fetching character data via admin API

```bash
curl -H "Authorization: Bearer <ANON_KEY>" \
     -H "X-Admin-Password: <ADMIN_PASSWORD>" \
     "https://okbrsoomtomexilxxsyd.supabase.co/functions/v1/admin/characters"
```

Or call `generateArtPrompt()` directly from a Node script with the character object loaded from the DB.

## Upload portrait to Storage

```bash
curl -X POST "https://okbrsoomtomexilxxsyd.supabase.co/storage/v1/object/portraits/gallery/<CHAR_ID>/<UUID>.jpg" \
     -H "Authorization: Bearer <ANON_KEY>" \
     -H "Content-Type: image/jpeg" \
     --data-binary @portrait.jpg
```

Then update `art_gallery` on the character:

```bash
curl -X PUT "https://okbrsoomtomexilxxsyd.supabase.co/functions/v1/admin/characters/<CHAR_ID>" \
     -H "Authorization: Bearer <ANON_KEY>" \
     -H "X-Admin-Password: <ADMIN_PASSWORD>" \
     -H "Content-Type: application/json" \
     -d '{"art_gallery": [{"url": "<PUBLIC_URL>", "label": "Wariant 1", "created_at": "<ISO_DATE>"}]}'
```

## Batch prompt generation

For multiple characters at once:
1. Fetch character list from admin API.
2. For each, call `generateArtPrompt()`.
3. Dump prompts to a `.txt` file suitable for SD batch processing.

## Per-character companion notes

Every character with a generated portrait should have:
- `outputs/characters/[char-id]/portrait_prompt.md` — the prompt used, SD config overrides, prompt iterations.
- `outputs/characters/[char-id]/gallery_notes.md` — rationale for each variant, which was picked, player feedback.

See [[outputs/characters/README]] for the convention.

## Related files

- `src/lib/artPrompt.ts` — prompt builder.
- `src/components/admin/ArtPromptSection.tsx` — admin UI: prompt + gallery.
- `src/components/shared/PortraitUpload.tsx` — upload + resize on client.
- `src/components/player/PlayerCharacterViewer.tsx` — player-facing gallery.
- `scripts/generate-portrait.mjs` — SD orchestration entry.
- `scripts/gemini-browser-gen.mjs` — Gemini browser bridge.
