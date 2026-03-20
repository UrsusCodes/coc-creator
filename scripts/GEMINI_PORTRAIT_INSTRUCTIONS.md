# Instrukcje generowania portretów postaci przez Gemini Chat

## Cel
Generuj portrety postaci RPG (Call of Cthulhu, lata 1920.) przez Gemini Chat (gemini.google.com).
Obrazy zapisuj w folderze: `c:\Users\Pawel\coc-creator\generated_portraits\`

## Krok 1: Pobierz listę postaci z API

```bash
curl -s "https://okbrsoomtomexilxxsyd.supabase.co/rest/v1/characters?select=*" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rYnJzb29tdG9tZXhpbHh4c3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxOTExNDMsImV4cCI6MjA4Nzc2NzE0M30.GaniOGFusJlGc-hDZzsJ-hEQTrl7G1pnL1OyHkfMfw4" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rYnJzb29tdG9tZXhpbHh4c3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxOTExNDMsImV4cCI6MjA4Nzc2NzE0M30.GaniOGFusJlGc-hDZzsJ-hEQTrl7G1pnL1OyHkfMfw4"
```

Z odpowiedzi JSON wyciągnij dla każdej postaci:
- `name` — imię i nazwisko
- `age` — wiek
- `gender` — płeć (Mężczyzna / Kobieta)
- `occupation_name` — zawód
- `characteristics` — obiekt z STR, SIZ, CON, APP (do opisu budowy ciała)
- `backstory.appearance_description` — opis wyglądu
- `backstory.traits` — cechy osobowości (krótkie)
- `backstory` — przeszukaj cały tekst pod kątem blizn, oparzeń, ran itp.

## Krok 2: Zbuduj prompt dla postaci

Schemat promptu:

```
Generate an image: Vintage 1920s portrait photograph, bust shot from chest up,
[wiek: young/young adult/middle-aged/mature/elderly] [płeć: man/woman], [wiek] years old,
[zawód] by profession,
[opis wyglądu — pierwsze zdanie z appearance_description],
[budowa ciała na podstawie STR/SIZ/CON — patrz tabela poniżej],
[uroda na podstawie APP — patrz tabela poniżej],
[cechy osobowości jeśli krótkie < 100 znaków],
[blizny/rany z backstory jeśli są],
black and white photograph with slight sepia toning, soft blurred light background,
dramatic studio lighting, highly detailed face, realistic, 1920s aesthetic.
```

### Tabela budowy ciała (z characteristics)
| Warunek | Opis |
|---------|------|
| SIZ >= 75 AND STR >= 70 | large, muscular build |
| SIZ >= 75 | tall, large frame |
| SIZ <= 35 | small, slight build |
| STR >= 75 | muscular, athletic build |
| STR <= 30 AND SIZ <= 45 | thin, frail build |
| CON >= 80 | robust and healthy |
| CON <= 30 | sickly appearance |

### Tabela urody (z APP)
| APP | Opis |
|-----|------|
| >= 80 | strikingly beautiful |
| >= 70 | very attractive |
| >= 60 | good-looking |
| <= 35 | plain, unremarkable face |
| <= 25 | ugly, unsettling features |
| 36-59 | (pomiń — przeciętny) |

### Tabela wieku
| Wiek | Opis |
|------|------|
| <= 20 | young |
| 21-30 | young adult |
| 31-45 | middle-aged |
| 46-60 | mature |
| > 60 | elderly |

## Krok 3: Generuj obrazy w Gemini Chat

1. Wejdź na https://gemini.google.com/app
2. Wklej wygenerowany prompt
3. Poczekaj na obraz
4. Pobierz i zapisz do `generated_portraits/` z nazwą: `{imie_nazwisko_lowercase}_gemini_{numer}.png`
5. Zacznij **nowy czat** dla kolejnego wariantu
6. Powtórz — domyślnie 4 warianty na postać

## Krok 4: Ewaluacja

Po wygenerowaniu każdego obrazu oceń:
- [ ] Bust portrait (od klatki piersiowej w górę)
- [ ] Czarno-biały / sepia
- [ ] Rozmyte jasne tło
- [ ] Twarz wyraźna i realistyczna
- [ ] Pasuje do opisu postaci (wiek, cechy fizyczne, blizny)

Jeśli obraz nie spełnia kryteriów — wygeneruj ponownie z lekko zmodyfikowanym promptem.

## Uwagi
- Generuj po angielsku (lepsze wyniki)
- Cechy z backstory (np. "blizny od oparzeń") zamień na angielski: "visible burn scars on face"
- Nie dodawaj tekstu/napisów do obrazu
- Przy wielu postaciach rób je po kolei, jedną na raz
