---
date: 2026-03-18
status: implemented
tags:
  - spec
  - feature/portrait-app
  - implemented
---

# Portrait App Feature — Spec

> [!info] Status
> **Implemented** (migration `010_portrait_feedback.sql`; admin & player components present). This document is preserved as historical spec + reference. Verify against the files listed at the bottom before acting on specifics.

## Overview

After generating portrait variants locally (Gemini + SD — see [[PORTRAIT_PIPELINE]]), Claude / admin pushes them into the app so the **player can view, select, crop, and use them in their PDF character sheet**. Players can also **send a portrait back with comments** for fixes.

## Features

### Feature 1 — Push portraits into the app (admin side)

After generating portraits for a character:

1. Upload selected images to Supabase Storage under `portraits/gallery/<char_id>/`.
2. Update the character's `art_gallery` field with an array of `{url, label, created_at}`.
3. Player sees the gallery in their character viewer and can pick one.

### Feature 2 — Player portrait selection + crop (player side)

In the player's character viewer:

- Show gallery of portrait variants (uploaded by admin/Claude).
- Player selects one as their preferred portrait.
- Player can **crop** the image (focus on face/bust) before confirming.
- Selected + cropped portrait is saved and used in the **PDF character card** in the correct portrait slot.
- Stored state: `selected_portrait_url`, `portrait_crop_data` (crop coordinates).

### Feature 3 — Player sends portrait back with comments

Player can:

- Select a portrait variant they want changed.
- Attach a **comment/note** (text) describing what to fix (e.g. *"twarz zbyt stara"*, *"wrong hair color"*).
- Optionally attach a **reference image** or annotated screenshot.
- Submit → creates a `portrait_feedback` record.

Admin / Claude sees this in the dashboard (Feature 4).

Data shape:

```json
{
  "character_id": "...",
  "variant_url": "...",
  "comment": "looks too old, should be younger",
  "reference_image_url": "...",
  "status": "pending_fix",
  "created_at": "..."
}
```

### Feature 4 — "Check app": character portrait status dashboard

When the user asks to **check app**, query the API and report per-character portrait status:

| Status | Meaning |
|---|---|
| 🆕 **New** | Character exists but no portraits generated/pushed yet |
| 📤 **Awaiting portraits** | Character has no `art_gallery` entries |
| 🖼️ **Has gallery** | `art_gallery` has images but player hasn't selected one |
| ✅ **Portrait chosen** | Player selected and cropped a portrait |
| 💬 **Feedback received** | Player sent portrait back with comments — needs fixing |

### How to check

```bash
curl -s "https://okbrsoomtomexilxxsyd.supabase.co/rest/v1/characters?select=id,name,art_gallery,selected_portrait_url,portrait_feedback" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <ANON_KEY>"
```

Report format:

```
🆕 Kowalski Jan         — no portraits yet
📤 McNeil Arthur        — gallery empty
🖼️ McMiller Cormac     — 4 variants uploaded, awaiting player choice
✅ Ashford Elizabeth    — portrait chosen & cropped
💬 Krawczyk Marek      — player returned: "twarz zbyt stara"
```

## Implementation files (as shipped)

- `src/components/player/PlayerCharacterViewer.tsx` — gallery view for player.
- `src/components/player/PortraitFeedbackModal.tsx` — send-back with comment.
- `src/components/admin/PortraitStatusDashboard.tsx` — status overview.
- `src/components/admin/AdminDashboard.tsx` — dashboard host.
- `supabase/functions/admin/index.ts` — admin endpoints incl. portrait_feedback.
- `supabase/functions/player/index.ts` — player endpoints.
- `supabase/migrations/010_portrait_feedback.sql` — schema for feedback.
- `src/types/character.ts` — `selected_portrait_url`, `portrait_crop_data`, `portrait_feedback` typedefs.
- `src/components/shared/CharacterSheet.tsx` — card render uses selected/cropped portrait.

## Related

- [[PORTRAIT_PIPELINE]] — upstream generation pipeline (Gemini + SD → Storage).
- [[outputs/characters/README|outputs/characters/]] — per-character companion notes.

## Changelog

- **2026-03-18** — Spec received.
- **(later)** — Implemented (migration 010 + components).
- **2026-04-21** — Migrated from auto-memory to vault.
