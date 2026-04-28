---
date: 2026-04-28
status: draft
tags:
  - spec
  - feature/portrait-generation
  - draft
---

# Portrait Prompt Methodology — Spec

> [!info] Status
> **Draft** — methodology agreed in chat 2026-04-28.

> [!warning] Pivot 2026-04-28 (afternoon): API → Chat-paste flow
> The original plan called the Gemini API server-side with an admin-owned key.
> When deployed it surfaced that Gemini image-gen is **paid only** (~$0.04/image),
> and the admin's existing API key was on a different Cloud project. Rather
> than commit to ongoing per-image billing, the flow pivoted to:
>
> 1. App **builds the prompt** (same methodology as planned).
> 2. UI shows the prompt with copy button + link to free **Gemini Chat**.
> 3. Player generates the image in Gemini Chat, downloads / copies the PNG.
> 4. UI accepts the image (paste / drop / file pick), runs the 4 style
>    transforms in-browser (canvas pixel shaders), uploads to Storage, and
>    appends to `art_gallery`.
>
> The server-side `POST /generate-portrait` endpoint and the
> `portrait_generations` table are **kept as deadcode** for the future case
> where another multimodal provider (e.g. one with a free tier, or local
> SD wired up via API) makes API-mode viable again. See "Deadcode reactivation"
> section at the end.

## Context

The first cut of player-side portrait generation
([[portrait_app_feature_spec]]) put together a working pipeline (per-player
Gemini key, rate-limited edge endpoint, rebuild gallery), but the **prompt
builder itself** was a literal port of the deterministic admin-side logic
in `artPrompt.ts`. That logic injected character stats (APP, STR, SIZ, CON)
directly into the prompt text, which produced rigid descriptions and
fought against player intent.

This spec replaces it with a **player-driven, layered prompt**. Stats
become hints in the UI; the prompt body is built from explicit player
choices (chips + free-text fields). Result: shorter, less surprising
prompts that respect what the player actually wrote about their character.

## Core principles

1. **Player input is the only source of physical description in the
   prompt.** Stats (APP, STR, SIZ, CON, spending_level) never appear in
   the prompt. They surface in the UI as hints under the relevant fields
   so the player writes a description consistent with their roll.
2. **Layered prompt** — defaults → overrides → modifications. Gemini
   reads the full default first, then explicit replacements, then a
   bullet-list of small adjustments.
3. **Single admin-owned Gemini API key**, stored in the edge function
   environment as `GEMINI_API_KEY`. Players never see or supply a key —
   they share the admin's free-tier quota, throttled by the per-player
   rate limit below. Key never leaves the server, never appears in any
   client request.
4. **One generation = N color masters × 4 style variants.** Single Gemini
   call per master image; sepia / b&w / faded conversions happen in the
   edge function via pixel transform. All 4 are saved to Storage and
   appear in the gallery immediately.
5. **Rate limit per player:** 1 request / 30 s, 5 requests / 24 h.

## Architecture (high-level) — current Chat-paste flow

```
Player form
  ├─ Style chip (clothing): Niedbałe / Codzienne / Eleganckie / Zawodowe
  ├─ Background chip: Studio + 7 locations, or custom text
  ├─ Lighting chip: Hollywood / Naturalne / Noir
  ├─ 5 detail fields (Twarz, Ciało, Ubrania, Rekwizyty, Tło) — checkmark
  │  activates each independently
  └─ "Korekty" — always-visible append-only text box (~150 chars)

Step 1 — prompt (client only):
  Client builds prompt via buildPlayerPortraitPrompt. UI shows it in
  a read-only textarea with [Copy] + [Open Gemini Chat] buttons.

Step 2 — out-of-band (player in Gemini Chat):
  Player pastes prompt into gemini.google.com, generates image there,
  downloads or copies the resulting PNG.

Step 3 — paste back (client):
  Drop-zone / clipboard paste / file picker accepts the master image.
  In-browser canvas runs 4 pixel transforms:
     color  — re-encode JPEG (no transform)
     faded  — saturation reduction (lerp toward grayscale by 30%)
     sepia  — sepia matrix
     bw     — luminance grayscale
  Each variant uploaded to Storage as
     portraits/gallery/<charId>/<uuid>-{style}.jpg

Step 4 — append to gallery:
  Client → POST /player/characters/:id/append-portraits
           { variants: [{ url, style }, ...] }
  Edge function:
    a. Verify ownership + JWT
    b. Whitelist URLs to prefix portraits/gallery/<charId>/
    c. Append entries to art_gallery JSONB
    d. Return updated gallery
```

Player can repeat Step 2–4 to add multiple masters; each one fans out to 4
gallery entries.

## Fixed era constants (1920s)

```
1. Full-body portrait, head to feet visible
2. 1920s era photograph, muted natural color, color preserved
3. 2:3 aspect ratio
4. Photorealistic
5. High detail throughout, especially facial features
6. Slightly desaturated, vintage tonal palette
7. No text, no watermarks, no captions, no borders
```

Removed from constants (intentionally):
- ~~`bust shot from chest up`~~ → replaced by full-body
- ~~`vintage`~~ → triggers sepia/bw bias in Gemini
- ~~`1920s era clothing`~~ → forces stereotypes (flapper-trap); clothing
  comes from the chip / matrix / player override instead
- ~~`uniform bright blurred background`~~ → moved to lighting/background
  layer (chip-driven, not constant)
- ~~`dramatic studio lighting`~~ → moved to lighting chip choice

## Form choices (player-driven)

### Clothing chip (4 options)

| Chip | What it does in the prompt |
|---|---|
| Niedbałe | Pulls entry from clothing matrix (gender × tier) |
| Codzienne | Pulls entry from clothing matrix |
| Eleganckie | Pulls entry from clothing matrix |
| Zawodowe | Replaces matrix lookup with `clothing typical for a {occupation_en} in 1920s` |

Default chip selection driven by `spending_level`:

| `spending_level` (wealth v2) | Default chip |
|---|---|
| A, B | Eleganckie |
| C, D | Codzienne |
| E, F | Niedbałe |

Player can change the chip; their choice always wins.

### Background chip (8 options + custom)

```
[● Studio (jasne)]  [○ Biblioteka]  [○ Gabinet detektywa]
[○ Mglista uliczka] [○ Salon hotelowy] [○ Cmentarz]
[○ Pokład statku]   [○ Plener leśny]

or custom: [_______________________________]
```

Default: `Studio (jasne)` → `uniform bright blurred background`. Other
chips inject location text. Custom text disables chip selection.

### Lighting chip (3 options)

| Chip | Prompt fragment |
|---|---|
| Hollywood | `dramatic studio lighting, strong contrast, classic portrait photography lighting` |
| Naturalne (default) | `soft natural light, even illumination, gentle shadows` |
| Noir | `chiaroscuro, harsh shadows, half the face in shadow, low-key lighting` |

### Count

`1 / 2 / 3` master images. Each becomes 4 style variants → gallery gains
`4 × count` entries per generation.

### 5 detail fields with checkmark activation

| Field | Maps to | Default when unchecked |
|---|---|---|
| Twarz | Face appearance modification | (uses character's `appearance` text) |
| Ciało | Body / build modification | (uses character's `appearance` text) |
| Ubrania | Replaces clothing chip | Chip is used as-is |
| Rekwizyty | Player-defined visible props | None — Gemini decides, except when chip = Zawodowe (then `tools typical for {profession}`) |
| Tło | Replaces background chip | Chip is used as-is |

UI: all 5 fields visible at once, each with a leading checkmark. Unchecked = greyed-out / disabled. Checking a field activates its input. This communicates "you don't have to fill all five" without hiding the structure.

### "Korekty" — append-only modification box

Always visible (no checkmark), max ~150 chars. Used for small adjustments
that aren't worth dedicating a field to: "no hat", "lekki uśmiech",
"younger looking". Appended at the end of the prompt as a bullet list of
modifications.

## Stat hints in the UI (NOT in the prompt)

Hints appear under the relevant field **only when the stat is extreme**.
Average values get no hint. Goal: nudge the player to write a description
consistent with their roll, without forcing it into the prompt themselves.

### Twarz (driven by APP)

| APP | Hint (Polish) |
|---|---|
| ≤ 25 | „Bardzo niski wygląd. Prawdopodobnie odpychająca twarz, oszpecona lub o odstręczających rysach." |
| ≤ 35 | „Niski wygląd. Pospolita, niezbyt efektowna twarz." |
| 36–69 | (no hint) |
| ≥ 70 | „Wysoki wygląd. Atrakcyjne, wyraziste rysy." |
| ≥ 80 | „Bardzo wysoki wygląd. Uderzająco piękna lub urzekająca twarz." |

### Ciało (driven by SIZ × STR × CON)

| Condition | Hint |
|---|---|
| SIZ ≥ 75 ∧ STR ≤ 40 | „Wysoka i ciężka sylwetka, niska siła sugeruje otyłość lub miękkie ciało." |
| SIZ ≥ 75 ∧ STR ≥ 70 | „Wysoka, masywna sylwetka, wyraźnie umięśniona." |
| SIZ ≥ 75 (other) | „Wysoki, postawny." |
| SIZ ≤ 35 | „Niska, drobna budowa." |
| STR ≥ 75 ∧ SIZ < 75 | „Średni wzrost, atletyczna sylwetka." |
| STR ≤ 30 ∧ SIZ ≤ 45 | „Drobna, słaba sylwetka." |
| CON ≤ 30 | „Słabe zdrowie. Wycieńczona, chudawa, niezdrowa cera." |
| CON ≥ 80 | „Bardzo wysoka kondycja. Krzepka, zdrowo wyglądająca." |

Multiple conditions can fire — show up to 2 hints stacked.

### Ubrania (driven by `spending_level`)

| Tier | Hint |
|---|---|
| A | „Bardzo zamożna postać. Może nosić luksusowe stroje z najlepszych materiałów." |
| B | „Zamożna postać. Eleganckie, wysokiej jakości ubrania." |
| C | „Średnia majętność. Solidne ubrania klasy mieszczańskiej." |
| D | „Skromna majętność. Praktyczne, raczej proste ubrania." |
| E | „Niska majętność. Zniszczone, wytarte rzeczy." |
| F | „Bardzo biedna postać. Łachmany, używane lub łatane ubrania." |

### Rekwizyty

Generic hint always: „Brak auto-detekcji. Wpisz co postać widocznie trzyma lub nosi (broń, narzędzie, biżuteria)."

## Clothing matrix (2 × 2 × 3 = 12)

Tier collapse: A,B,C → `zamozny`; D,E,F → `skromny`.

```ts
const CLOTHING_MATRIX: Record<'M' | 'F', Record<'skromny' | 'zamozny', Record<'niedbale' | 'codzienne' | 'eleganckie', string>>> = {
  M: {
    skromny: {
      niedbale:    "rumpled work shirt with rolled sleeves, suspenders, plain wool trousers",
      codzienne:   "plain shirt with worn vest, wool trousers, soft cap",
      eleganckie:  "modest two-piece wool suit with worn collar, plain narrow tie",
    },
    zamozny: {
      niedbale:    "open-collared dress shirt, casual blazer, comfortable flannel trousers",
      codzienne:   "tailored three-piece suit, silk tie, polished oxfords",
      eleganckie:  "black formal dinner jacket, white bow tie, silk pocket square, cufflinks",
    },
  },
  F: {
    skromny: {
      niedbale:    "simple cotton blouse, ankle-length plain skirt, headscarf or pinned-up hair",
      codzienne:   "modest belted day dress, low heels, plain wool coat",
      eleganckie:  "modest drop-waist evening dress in subdued color, simple shawl",
    },
    zamozny: {
      niedbale:    "casual drop-waist day dress, soft cashmere cardigan, T-strap low pumps",
      codzienne:   "fashionable drop-waist dress, cloche hat, pearl strand necklace",
      eleganckie:  "beaded silk evening gown, long satin gloves, feathered headpiece, art deco jewelry",
    },
  },
}
```

Style rule: 1 main garment + 1 silhouette anchor + 1–2 detail anchors.
No words like "elegant / professional / mysterious" — Gemini ignores or
averages them. Period anchors (peaked cap, brass buttons, drop-waist,
pinstripe, fedora, cufflinks) carry the era better than adjectives.

## Prompt template

Final string sent to Gemini = three layers concatenated:

```
{LAYER 0 — fixed era constants}
{LAYER 1 — person from character}
{LAYER 2 — chip-driven blocks (with overrides)}
{LAYER 3 — modifications, if any}
```

### Layer 0 — fixed era constants

```
1920s era photograph. Full-body portrait, head to feet visible.
2:3 aspect ratio. Photorealistic. High detail throughout, especially
facial features. Muted natural color, slightly desaturated vintage
tonal palette. No text, no watermarks, no captions, no borders.
```

### Layer 1 — person

```
{ageGroup} {man|woman}, {age} years old. {occupation_en}.
{backstory.appearance_description ?? appearance, if any}
```

`ageGroup` mapping (unchanged from current `describeAge`):
- ≤ 20: `young`
- 21–30: `young adult`
- 31–45: `middle-aged`
- 46–60: `mature`
- > 60: `elderly`

Gender mapping: `'M' → 'man'`, `'F' → 'woman'`. Legacy fallback for
pre-migration data: `'Mężczyzna' → 'man'`, `'Kobieta' → 'woman'`.

`occupation_en` comes from a new `OCCUPATION_NAMES_EN: Record<id, string>`
mapping (68 entries, one-time write).

### Layer 2 — chip-driven blocks

Built from form choices, with player overrides where active:

```
Wearing: {clothing}.        ← from chip (matrix lookup) or pole Ubrania
Background: {background}.   ← from chip or pole Tło
Lighting: {lighting}.       ← from chip
{props}                     ← from pole Rekwizyty if active, OR
                              "carrying tools typical for a {occupation_en}"
                              if chip = Zawodowe and pole Rekwizyty empty,
                              else omit
```

When `clothing` chip = Zawodowe:
```
Wearing clothing typical for a {occupation_en} in 1920s.
```

### Layer 3 — modifications (optional)

Only included when at least one of: Twarz / Ciało checkmark active, or
Korekty box non-empty.

```
Apply these modifications on top of the above:
- Face details: {pole Twarz, if checked}
- Body details: {pole Ciało, if checked}
- {each line from Korekty, split by comma}
```

## Style conversion (in-browser, canvas)

For each pasted master image, the client generates 4 variants by per-pixel
transformation in a `<canvas>`. The master is decoded via `Image()` +
`canvas.drawImage`, `getImageData` returns an RGBA `Uint8ClampedArray`,
the same arithmetic shaders as the API path are applied, then `toBlob`
+ Supabase Storage upload. All 4 saved to Storage.

| Variant | Filter |
|---|---|
| `color` | Master, no transform |
| `faded` | Each pixel: `out = pixel * 0.7 + grayscale * 0.3` (saturation reduction) |
| `sepia` | Sepia matrix: `R' = 0.393R + 0.769G + 0.189B`; `G' = 0.349R + 0.686G + 0.168B`; `B' = 0.272R + 0.534G + 0.131B` |
| `bw` | Luminance: `Y = 0.299R + 0.587G + 0.114B`, then `(Y, Y, Y)` |

Implementation choice: Deno-native pixel manipulation on `Uint8Array`
extracted from JPEG via `imagescript` (esm.sh). One pass per variant,
~640k pixels for an 800×800 image — well within edge function timeout.

## Storage layout

```
portraits/gallery/<charId>/
  <uuid>-color.jpg
  <uuid>-faded.jpg
  <uuid>-sepia.jpg
  <uuid>-bw.jpg
```

`art_gallery` JSONB on `characters` row gets 4 entries per master:

```json
[
  { "url": "...uuid1-color.jpg",  "label": "AI 1 kolor",       "created_at": "..." },
  { "url": "...uuid1-faded.jpg",  "label": "AI 1 wyblakły",    "created_at": "..." },
  { "url": "...uuid1-sepia.jpg",  "label": "AI 1 sepia",       "created_at": "..." },
  { "url": "...uuid1-bw.jpg",     "label": "AI 1 czarno-białe", "created_at": "..." },
  ...
]
```

## Card-crop time bg removal

When the player picks a generated portrait for the PDF card and triggers
the existing crop modal, the cropped face image goes through
`@imgly/background-removal` (browser, ~50MB ONNX model loaded on demand)
to produce a clean cutout on a uniform light background.

The master file with original location stays in `art_gallery` — used for
print / display in the player viewer. Only the card variant has bg removed.

This is **v1 of card-crop bg removal**; if quality is insufficient, fall
back to a second Gemini call ("remove background, keep subject only on
white background"). Decided at implementation time.

## Rate limiting

Not needed in the Chat-paste flow — there is no API call that costs the
admin money. Storage upload and gallery append are bounded by Storage
quotas (Supabase Free: 1 GB, ~10k variants worth) and basic JWT auth.

The `portrait_generations` table is preserved as deadcode for reactivation;
see "Deadcode reactivation" below.

## Dependencies / open work

- File `src/data/occupationNamesEn.ts` — `Record<occupation_id, string>`,
  111 entries (in repo).
- File `src/lib/portraitStyleTransforms.ts` — canvas-based 4 style shaders
  (color / faded / sepia / bw), used by the panel after a paste-in.
- New library `@imgly/background-removal` (browser-side card crop) —
  deferred to v2 polish, not blocking.
- Migration `020_portrait_generations.sql` — applied to prod even though
  the table is now unused (Chat-paste flow). Reactivated automatically
  when the deadcode endpoint comes back.
- `Backstory` type stays as-is — no new field needed (we use existing
  `appearance_description`).

## Files (current Chat-paste flow)

| File | Action |
|---|---|
| `src/lib/artPrompt.ts` | Layered prompt + chips + matrix + hints. Already in repo. Untouched by pivot. |
| `src/data/occupationNamesEn.ts` | 111 entries. Already in repo. |
| `src/lib/portraitStyleTransforms.ts` | NEW — canvas-based color/faded/sepia/bw shaders. Used by panel after paste. |
| `src/lib/player.ts` | Drops `playerGeneratePortrait`. Adds `playerAppendPortraits(charId, variants)`. |
| `supabase/functions/player/index.ts` | (a) `POST /generate-portrait` kept as deadcode, never reached (early-return 410 with reactivation hint). (b) NEW `POST /characters/:id/append-portraits` — verifies ownership, whitelists URLs to char's gallery prefix, appends to `art_gallery`. |
| `src/components/player/GeneratePortraitPanel.tsx` | Rewrite to 3-section flow: prompt copy → image paste → save to gallery. Same form (chips + 5 fields + Korekty + hints) feeds the prompt. |
| `src/components/player/PlayerCharacterViewer.tsx` | Already wires the panel. No change. |

## Deadcode reactivation (future API mode)

If a multimodal provider with a free tier becomes viable (e.g. local SD
exposed via local API, or Google bringing back a free image quota, or
swap to Stability AI / Replicate / Fal.ai with a budgeted account), the
work to revert is small:

1. **Restore client API call** — re-add `playerGeneratePortrait` in
   `src/lib/player.ts` (a wrapper around `POST /generate-portrait`).
2. **Reactivate edge endpoint** — remove the early-return guard from the
   `generateMatch` handler in `supabase/functions/player/index.ts`. The
   handler body (rate-limit check + Gemini call + imagescript transforms
   + Storage upload + `portrait_generations` log row) is preserved
   verbatim. If switching to a different provider, only the Gemini fetch
   call inside the loop needs to change.
3. **Set provider key** — add the new provider's API key to edge-function
   secrets. Default model alias is configurable via `GEMINI_MODEL` env.
4. **Adjust rate limits** if the provider's quota differs (currently
   coded as 1 req / 30 s, 5 req / 24 h per player).
5. **Update panel UI** — re-introduce a "Wygeneruj N" button alongside
   the manual paste workflow, or replace it entirely.

The `portrait_generations` table and migration 020 stay in place — they
are unused by the Chat-paste flow but immediately useful again when the
endpoint comes back. The `imagescript` import also stays in the edge
function file (inside the deadcode block).

## Verification (Chat-paste flow)

1. Open the panel for a character — verify chips default by `spending_level`, hints show only on extreme stats.
2. Click "Skopiuj prompt" — clipboard contains the full layered prompt with all 7 segments visible.
3. Paste the prompt into Gemini Chat at gemini.google.com, attach no image, send. Confirm Gemini returns a 1920s full-body portrait matching the description.
4. Save the image (Gemini export / right-click save). In our panel, paste it via Ctrl+V, drag-drop, or file picker. Preview appears.
5. Click "Zapisz do galerii" — 4 variants appear in the character's `art_gallery` within ~2 s.
6. Pick one as the card portrait — existing crop modal flow works on it without changes.
7. Repeat with another paste — gallery gains 4 more entries.
8. Stat extremes (APP=10, SIZ=90+STR=20, etc.) — verify hints display in UI but never appear in the actual prompt text.
