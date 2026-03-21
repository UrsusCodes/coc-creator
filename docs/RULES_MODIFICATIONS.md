# Modyfikacje zasad — CoC Creator vs Call of Cthulhu 7e

## Legenda
- ✅ **STANDARD** — zgodne z podręcznikiem CoC 7e
- 🔧 **ZMODYFIKOWANE** — bazuje na podręczniku, ale zmienione/rozszerzone
- 🆕 **WŁASNE** — nowy system, nie występuje w podręczniku

---

## 1. Generowanie cech ✅ STANDARD

| Cecha | Formuła | Status |
|-------|---------|--------|
| STR, CON, DEX, APP, POW | 3K6×5 | ✅ |
| SIZ, INT, EDU | (2K6+6)×5 | ✅ |
| Point buy | 460 pkt, 15-90 na cechę | ✅ |
| Direct | Ręczne wpisanie | ✅ |

## 2. Szczęście ✅ STANDARD

- Dorosły: 3K6×5
- Młody (15-19): rzut 2×, lepszy wynik

## 3. Wiek i modyfikatory wiekowe ✅ STANDARD

Tabela modyfikatorów dokładnie wg CoC 7e (15-89 lat):
- Odliczenia z STR/CON/DEX, redukcja APP, redukcja Ruchu
- Rzuty na poprawę EDU (1-4 rzutów wg wieku)

## 4. Premia do obrażeń ✅ STANDARD

Tabela STR+SIZ → DB dokładnie wg CoC 7e (od -2 do +5K6).

## 5. Atrybuty pochodne ✅ STANDARD

- PW = (SIZ + CON) / 10
- PM = POW / 5
- PP = POW
- Ruch = 8 (bazowy, modyfikowany wiekiem)
- Unik = DEX / 2

## 6. Umiejętności 🔧 ZMODYFIKOWANE

**Baza:** 60+ umiejętności z podręcznika z poprawnymi wartościami bazowymi.

**Rozszerzenia:**
- Broń palna: 7 specjalizacji (Krótka, Karabin/Strzelba, Pistolet Maszynowy, Karabin Maszynowy, Ciężka, Artyleryjska, Miotacz Ognia)
- Walka wręcz: 8 specjalizacji (Bijatyka, Miecz, Broń Obuchowa, Topór, Włócznia, Bicz, Garota, Piła Łańcuchowa)
- Nauka: 14 specjalizacji (Astronomia, Biologia, Botanika, Chemia, Farmacja, Fizyka, Geologia, Inżynieria, Kryptografia, Matematyka, Meteorologia, Zoologia + inne)
- Sztuka/Rzemiosło: 22 specjalizacji
- Sztuka Przetrwania: 5 specjalizacji (Arktyczna, Morska, Pustynna, Góry, Dżungla)
- Umiejętności ograniczone erą (Elektronika, Piła Łańcuchowa → tylko Modern)

## 7. Zawody 🔧 ZMODYFIKOWANE

68+ zawodów w 12 kategoriach. Bazuje na CoC 7e z modyfikacjami:
- Usunięto 7 zawodów
- Naprawiono 5 zawodów
- Dodano 22 nowe zawody (wg CoC 7e handbook)
- System "choice" w slotach umiejętności: `choice:1:skill1,skill2` — gracz wybiera
- Sloty `any` (dowolna) i `any_academic` (dowolna akademicka)

**Formuły punktowe:** zgodne z podręcznikiem (EDU×4, EDU+DEX×2 itp.)

## 8. System majętności 🔧 ZMODYFIKOWANE

### Gotówka ✅ STANDARD (po fix)
| CR | Mnożnik gotówki | Status |
|----|-----------------|--------|
| 0 | $0.50 | ✅ |
| 1-9 | CR × 1 | ✅ |
| 10-49 | CR × 2 | ✅ |
| 50-89 | CR × 5 | ✅ |

### Dobytek 🔧 ZMODYFIKOWANE
6 tierów (A-F) z granularnymi mnożnikami dobytku:
- A (0): Bezdomny — $0
- B (1-9): Ubogi — CR × 5
- C (10-30): Przeciętny — CR × 50
- D (31-50): Zamożny — CR × 200
- E (51-70): Bardzo zamożny — CR × 500
- F (71-80): Bogaty — CR × 2000

*Podręcznik ma 4 tiery (0, 1-9, 10-49, 50-89) z mnożnikami 0/10/50/500. Apka rozbija to na 6.*

### Wydatki dzienne 🆕 WŁASNE
Dodano stałe wydatki dzienne per tier (od $0.50 do $300).

### System mieszkania/transportu/stylu życia 🆕 WŁASNE
- 12 opcji mieszkań (od bezdomności po posiadłość) z kosztami
- 5 stylów transportu (pieszo → luksusowa taksówka)
- 6 poziomów stylu życia (nędzny → luksusowy)
- System gwiazdek (0-5★) oparty na kombinacji mieszkanie+transport+lifestyle
- Presety: Oszczędny / Wygodny / Ekstrawagancki
- 8 form dobytku (konto bankowe, obligacje, akcje, złoto, biżuteria, sztuka, nieruchomości, towary)
- Formuła gap cost: kara za życie ponad swój tier

## 9. Ekwipunek 🆕 WŁASNE

### Katalog standardowy
Szczegółowy katalog po kategoriach: ubrania, biżuteria, narzędzia, sprzęt kempingowy, instrumenty naukowe, materiały piśmiennicze itp. z cenami per era.

### Katalog broni
Pełna lista broni z mechanikami: obrażenia, zasięg, pojemność, szybkostrzelność, zawodność.

### Czarny rynek 🆕 WŁASNE
17 nielegalnych przedmiotów (wymaga perku `black_market`):
- Nielegalne pistolety/rewolwery/karabiny/strzelby (cena ×2 vs legalne)
- Thompson SMG, tłumik do pistoletu, granaty, dynamit
- Amunicja AP
- Narkotyki (kokaina, heroina, opium)
- Fałszywe dokumenty, arszenik, amatorska kamizelka kuloodporna

### Sprzęt wojskowy 🆕 WŁASNE
Katalog wojskowy (wymaga perku `military_gear`): mundury, sprzęt bojowy, pojazdy.

## 10. System perków 🆕 WŁASNE

4 perki przypisywane do kodu zaproszenia:
| Perk | Efekt |
|------|-------|
| `swap_characteristics` | Zamiana jednej pary cech po losowaniu (przed modyfikatorami wieku) |
| `drive_pillars` | Zamienia standardowy backstory na system Motywacja + Filary Poczytalności |
| `black_market` | Odblokowanie katalogu czarnego rynku |
| `military_gear` | Odblokowanie katalogu wojskowego |

## 11. System pozycji dodatkowych 🆕 WŁASNE

81 opcji pozycji w 11 kategoriach:
1. Bojowe i fizyczne (10)
2. Intelektualne i akademickie (9)
3. Naukowe i badawcze (12)
4. Artystyczne i kulturalne (7)
5. Towarzyskie i prestiżowe (7)
6. Okultystyczne i tajemnicze (7)
7. Religijne i duchowe (4)
8. Polityczne i społeczne (5)
9. Margines i półświatek (2)
10. Eksploratorzy i przygodnicy (5)
11. Specjalne: cecha 80+ (14)

### Mechanika:
- **Sloty:** 1 bazowy, 2 jeśli wiek ≥40 / majętność ≥50 / INT ≥80 / umiejętność społeczna ≥80
- **Odblokowanie:** warunki umiejętności, cech, majętności, wieku, grupy zawodowej
- **Waga:** 1-3 gwiazdki na podstawie dopasowania do postaci
- **Pozycja główna:** z klastra zawodowego (10 klastrów mapowanych na zawody)

## 12. System kontaktów 🆕 WŁASNE

10 kategorii, 50+ podkategorii:
1. Organy ścigania (policja, detektywi, prokuratorzy, celnicy)
2. Półświatek (gangi, przemytnicy, hazard, paserzy, lichwiarze)
3. Akademia (profesorowie, archiwiści, muzea, instytuty, antykwariusze)
4. Medycy (lekarze, psychiatrzy, patolodzy, farmaceuci)
5. Prasa (dziennikarze, wydawcy, fotografowie, radio)
6. Prawnicy i biznes (politycy, bankierzy, przemysłowcy)
7. Kręgi towarzyskie (kluby, masoneria, stowarzyszenia)
8. Wojsko i weterani (oficerowie, weterani, rezerwa)
9. Okultyzm (spirytyści, kolekcjonerzy, tajne zakony)
10. Ziemiaństwo i wieś (farmerzy, łowcy, duchowieństwo wiejskie)

### Mechanika:
- **Sloty zawodowe:** 2-3 (zależy od typu zawodu: networked/average/isolated)
- **Sloty dodatkowe:** +1 za umiejętność społeczną ≥60, +1 za majętność ≥50 / wiek ≥45
- **Siła bazowa:** 1-3 (zależy od dopasowania do zawodu)
- **Modyfikatory:** +1 za umiejętność społeczną ≥60, +1 za majętność ≥60, +1 za wiek ≥50, +1 za POW ≥80
- **Synergia:** +1 za każdy dodatkowy kontakt w tej samej kategorii (max +2)
- **Wartość rzutu:** siła × 30 (30/60/90)

## 13. Motywacja i filary poczytalności 🆕 WŁASNE

Alternatywny system backstory (perk `drive_pillars`):
- **14 motywacji:** Przygoda, Antykwaryzm, Arogancja, Wrażliwość artystyczna, Pech, Ciekawość, Obowiązek, Znudzenie, Naśladowca, We krwi, Zemsta, Nauka, Nagły szok, Pragnienie wiedzy
- **Filary poczytalności:** kotwice zdrowia psychicznego (liczba zależy od PP)
- **Źródła stabilności:** osoby, miejsca, organizacje dające poczucie bezpieczeństwa

## 14. System kodów zaproszenia 🆕 WŁASNE

Kody kontrolujące tworzenie postaci:
- Maksymalna liczba prób (max_tries)
- Limit umiejętności (max_skill_value)
- Dozwolone metody (kości/point buy/direct)
- Perki
- Era

## 15. System edycji postaci 🆕 WŁASNE

3 poziomy edycji (admin włącza na czas):
- **Lore:** tylko tekst (backstory, dane podstawowe)
- **Standard:** od zawodu wzwyż
- **Full:** cechy i wszystko

Kaskady: zmiana zawodu → reset umiejętności → reset pozycji/kontaktów.
Po edycji: status "for review" → admin zatwierdza → stara wersja w historii.

## 16. System kont graczy 🆕 WŁASNE

- Admin tworzy konta z prostymi hasłami (bcrypt)
- Kody przypisywane do kont
- Postaci powiązane z graczami
- Draft sync: postęp wizarda zapisywany na serwerze
- Uprawnienia edycji per postać

---

## Podsumowanie

| Obszar | Status |
|--------|--------|
| Cechy, wiek, szczęście, DB, atrybuty pochodne | ✅ STANDARD |
| Umiejętności (baza + specjalizacje) | 🔧 ZMODYFIKOWANE |
| Zawody | 🔧 ZMODYFIKOWANE |
| Majętność — gotówka | ✅ STANDARD |
| Majętność — dobytek | 🔧 ZMODYFIKOWANE (granularniejsze tiery) |
| Wydatki dzienne, mieszkanie, transport, lifestyle | 🆕 WŁASNE |
| Ekwipunek, broń, czarny rynek, wojsko | 🆕 WŁASNE |
| System perków | 🆕 WŁASNE |
| Pozycje dodatkowe (81 opcji) | 🆕 WŁASNE |
| Kontakty (50+ podkategorii) | 🆕 WŁASNE |
| Motywacja i filary | 🆕 WŁASNE |
| Kody zaproszenia | 🆕 WŁASNE |
| System edycji i kont graczy | 🆕 WŁASNE |
