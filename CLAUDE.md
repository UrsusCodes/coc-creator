# CoC Creator — Instrukcje projektu

## Generowanie portretów postaci (Stable Diffusion)

### Flow
1. Otwórz panel admina → Postacie → wybierz postać → sekcja "Grafika"
2. Auto-prompt jest generowany z danych postaci (wygląd, cechy, zawód, era)
3. Skopiuj prompt → wklej do Stable Diffusion WebUI
4. Wygenerowane obrazki uploaduj do galerii wariantów w adminie
5. Gracz widzi galerię i wybiera portret

### Generowanie promptów przez Claude Code

Aby wygenerować prompt dla postaci z bazy:

```bash
# 1. Pobierz dane postaci z Supabase (wymaga service_role key lub admin API)
curl -H "Authorization: Bearer <ANON_KEY>" \
     -H "X-Admin-Password: <ADMIN_PASSWORD>" \
     "https://okbrsoomtomexilxxsyd.supabase.co/functions/v1/admin/characters"

# 2. Lub użyj funkcji z kodu:
# src/lib/artPrompt.ts → generateArtPrompt(character)
# Zwraca gotowy prompt SD
```

### Parametry Stable Diffusion

```
Model: dowolny realistyczny (np. Deliberate, Realistic Vision)
Positive prompt: [skopiowany z panelu admina]
Negative prompt: blurry, deformed, extra limbs, extra fingers, bad anatomy, watermark, text, signature, low quality, cartoon, anime
Steps: 30
CFG Scale: 7
Size: 512x768 (portret)
Sampler: DPM++ 2M Karras
```

### Logika auto-promptu (src/lib/artPrompt.ts)

Prompt jest budowany z:
- **Wiek i płeć**: "portrait of a middle-aged man, 45 years old"
- **Zawód**: z `OCCUPATIONS` danych → "private detective by profession"
- **Opis postaci**: backstory.appearance_description lub appearance
- **Budowa ciała**: z STR/SIZ/CON → "large, muscular build"
- **Uroda**: z APP → "very attractive" (APP≥70) lub "plain-looking" (APP≤35)
- **Cechy osobowe**: backstory.traits (jeśli krótkie)
- **Ekwipunek wizualny**: broń z equipment[] (max 3 elementy)
- **Era**: 1920s/modern/gaslight → odpowiedni styl ubioru
- **Modyfikatory stylu**: "detailed face, realistic, dramatic lighting, painterly style"

### Upload wyników do galerii

```bash
# Upload obrazka do Supabase Storage
curl -X POST "https://okbrsoomtomexilxxsyd.supabase.co/storage/v1/object/portraits/gallery/<CHAR_ID>/<UUID>.jpg" \
     -H "Authorization: Bearer <ANON_KEY>" \
     -H "Content-Type: image/jpeg" \
     --data-binary @portrait.jpg

# Zaktualizuj art_gallery postaci
curl -X PUT "https://okbrsoomtomexilxxsyd.supabase.co/functions/v1/admin/characters/<CHAR_ID>" \
     -H "Authorization: Bearer <ANON_KEY>" \
     -H "X-Admin-Password: <ADMIN_PASSWORD>" \
     -H "Content-Type: application/json" \
     -d '{"art_gallery": [{"url": "<PUBLIC_URL>", "label": "Wariant 1", "created_at": "2026-03-18T00:00:00Z"}]}'
```

### Batch generowanie promptów

Aby wygenerować prompty dla wielu postaci naraz, użyj Claude Code:
1. Pobierz listę postaci z admin API
2. Dla każdej wywołaj `generateArtPrompt()`
3. Zapisz prompty do pliku `.txt` do wklejenia do SD batch processing

## Struktura projektu

- `src/lib/artPrompt.ts` — generacja promptów SD z danych postaci
- `src/components/admin/ArtPromptSection.tsx` — UI admin: prompt + galeria
- `src/components/shared/PortraitUpload.tsx` — upload + resize obrazków
- `src/components/player/PlayerCharacterViewer.tsx` — galeria dla gracza
- `supabase/functions/admin/index.ts` — admin API (edge function)
- `supabase/functions/player/index.ts` — player API (edge function)
