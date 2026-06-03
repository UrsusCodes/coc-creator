import type { Era } from '@/types/common'

export interface EraDefinition {
  id: Era
  name: string
  description: string
  currency: string
  wealthTable: WealthBracket[]
  /** When true, the wizard skips StepWealth for this era (no housing/lifestyle/transport step). */
  skipWealthStep?: boolean
  /** When true, the wizard skips StepPositionsContacts for this era. */
  skipContactsStep?: boolean
}

export interface HousingOption {
  id: string
  label: string
  description: string
  assetReductionPct: number  // % of base dobytek consumed
  cashReductionPct: number   // % of base gotówka consumed
  ownership: 'rent' | 'own' | 'free'
}

export interface LifestyleOption {
  id: string
  label: string
  description: string
  assetReductionPct: number  // % of base dobytek consumed
  cashReductionPct: number   // % of base gotówka consumed
  servants: string           // description of servants included
}

export interface TransportOption {
  id: string
  label: string
  description: string
  cost: number       // fixed $, subtracted from remaining assets
  free?: boolean     // if true, cost is ignored
}

export interface WealthForm {
  id: string
  label: string
  description: string
}

export interface WealthBracket {
  creditRatingMin: number
  creditRatingMax: number
  label: string
  // Wealth calculation: dobytek = CR × assetMultiplier (or assetsFixed)
  assetMultiplier: number
  cashMultiplier: number
  assetsFixed?: number        // overrides CR × multiplier for special brackets
  cashFixed?: number          // overrides CR × multiplier for special brackets
  spending: number            // fixed spending level for this bracket
  // Options
  housingOptions: HousingOption[]
  lifestyleOptions: LifestyleOption[]
  transportOptions: TransportOption[]
}

// ── Calculate wealth from CR ──

export interface WealthCalc {
  assets: number    // dobytek
  cash: number      // gotówka
  spending: number  // poziom wydatków
}

export function calculateWealth(era: Era, cr: number): WealthCalc {
  const bracket = getWealthBracket(era, cr)
  return {
    assets: bracket.assetsFixed !== undefined ? bracket.assetsFixed : cr * bracket.assetMultiplier,
    cash: bracket.cashFixed !== undefined ? bracket.cashFixed : cr * bracket.cashMultiplier,
    spending: bracket.spending,
  }
}

// ── Wealth forms per era ──

export const WEALTH_FORMS: Record<Era, WealthForm[]> = {
  classic_1920s: [
    { id: 'cash_safe', label: 'Gotówka w sejfie', description: 'Banknoty schowane w domu — łatwo dostępne, ale ryzykowne' },
    { id: 'bank_account', label: 'Konto bankowe', description: 'Bezpieczne oszczędności — wymagają wizyty w banku' },
    { id: 'bonds', label: 'Obligacje rządowe', description: 'Bezpieczna inwestycja z niskim zyskiem' },
    { id: 'stocks', label: 'Akcje giełdowe', description: 'Ryzykowna inwestycja — może przynieść fortunę lub ruinę' },
    { id: 'gold', label: 'Złoto i kosztowności', description: 'Trwała wartość, łatwa do ukrycia i przeniesienia' },
    { id: 'jewelry', label: 'Biżuteria', description: 'Klejnoty, zegarki, szlachetne kamienie' },
    { id: 'art', label: 'Dzieła sztuki', description: 'Obrazy, rzeźby, antyki — wartość zależy od znawcy' },
    { id: 'real_estate', label: 'Nieruchomości (dodatkowe)', description: 'Działka, kamienica do wynajmu, ziemia' },
    { id: 'goods', label: 'Towary (import/eksport)', description: 'Udziały w handlu towarami — zysk niepewny' },
  ],
  modern: [
    { id: 'cash_safe', label: 'Gotówka w sejfie', description: 'Banknoty w domu — łatwo dostępne, ale ryzykowne' },
    { id: 'bank_account', label: 'Konto bankowe', description: 'Bezpieczne oszczędności na koncie' },
    { id: 'bonds', label: 'Bezpieczne inwestycje (lokaty, obligacje)', description: 'Niski zysk, ale pewny' },
    { id: 'stocks', label: 'Akcje giełdowe', description: 'Portfel inwestycyjny na giełdzie' },
    { id: 'crypto', label: 'Kryptowaluty', description: 'Bitcoin, Ethereum — bardzo zmienne, ale potencjalnie zyskowne' },
    { id: 'gold', label: 'Złoto i kosztowności', description: 'Sztabki, monety — trwała wartość' },
    { id: 'art', label: 'Dzieła sztuki', description: 'Kolekcja sztuki współczesnej' },
    { id: 'real_estate', label: 'Nieruchomości (dodatkowe)', description: 'Mieszkanie na wynajem, działka' },
    { id: 'retirement', label: 'Fundusz emerytalny', description: 'Długoterminowe oszczędności — trudno dostępne' },
  ],
  gaslight: [
    { id: 'cash_safe', label: 'Gotówka w sejfie', description: 'Monety i banknoty w domowym sejfie' },
    { id: 'bank_account', label: 'Konto bankowe', description: 'Depozyty w banku — wymagają wizyty' },
    { id: 'consols', label: 'Obligacje rządowe (consols)', description: 'Bezpieczna inwestycja w Imperium Brytyjskie' },
    { id: 'railway', label: 'Akcje kolejowe i kopalniane', description: 'Ryzykowne udziały w przemyśle — mogą przynieść fortunę' },
    { id: 'gold', label: 'Złoto i kosztowności', description: 'Suwereny złote, kamienie szlachetne' },
    { id: 'heirloom_jewelry', label: 'Biżuteria rodowa', description: 'Rodzinne klejnoty przekazywane z pokolenia na pokolenie' },
    { id: 'art', label: 'Dzieła sztuki i antyki', description: 'Obrazy starych mistrzów, antyczne meble' },
    { id: 'real_estate', label: 'Nieruchomości (dodatkowe)', description: 'Kamienica w mieście, ziemia na wsi' },
    { id: 'colonial_goods', label: 'Towary kolonialne', description: 'Udziały w handlu z koloniami — herbata, przyprawy, jedwab' },
  ],
  // Wild West intentionally has no wealth-forms picker — the wizard skips StepWealth for this era.
  wild_west: [],
}

// ── Era definitions with wealth tables ──

export const ERAS: Record<Era, EraDefinition> = {
  classic_1920s: {
    id: 'classic_1920s',
    name: 'Klasyczna (lata 20.)',
    description: 'Ameryka lat 20. XX wieku — złota era Lovecrafta',
    currency: '$',
    wealthTable: [
      // CR 0 — Ubogi
      {
        creditRatingMin: 0, creditRatingMax: 0,
        label: 'Ubogi',
        assetMultiplier: 0, cashMultiplier: 0,
        assetsFixed: 0, cashFixed: 0.5,
        spending: 0.5,
        housingOptions: [
          { id: 'homeless', label: 'Bezdomny', description: 'Śpi na ulicy, w schronisku lub w opuszczonych budynkach', assetReductionPct: 0, cashReductionPct: 0, ownership: 'free' },
        ],
        lifestyleOptions: [
          { id: 'poor', label: 'Biedny', description: 'Ledwo wiążesz koniec z końcem', assetReductionPct: 0, cashReductionPct: 0, servants: '' },
        ],
        transportOptions: [
          { id: 'walking', label: 'Pieszo / autostop', description: 'Brak środków na transport', cost: 0, free: true },
        ],
      },
      // CR 1-9 — Biedny
      {
        creditRatingMin: 1, creditRatingMax: 9,
        label: 'Biedny',
        assetMultiplier: 10, cashMultiplier: 1,
        spending: 2,
        housingOptions: [
          { id: 'cheap_room', label: 'Tani pokój (wynajem)', description: 'Ciasny pokój w kiepskiej okolicy — czynsz zjada większość gotówki', assetReductionPct: 25, cashReductionPct: 75, ownership: 'rent' },
          { id: 'studio_own', label: 'Kawalerka (własność)', description: 'Skromne własne lokum na obrzeżach', assetReductionPct: 75, cashReductionPct: 0, ownership: 'own' },
        ],
        lifestyleOptions: [
          { id: 'poor', label: 'Biedny', description: 'Ledwo wiążesz koniec z końcem', assetReductionPct: 0, cashReductionPct: 0, servants: '' },
          { id: 'average', label: 'Przeciętny', description: 'Proste posiłki, tanie rozrywki — powyżej stanu', assetReductionPct: 25, cashReductionPct: 0, servants: '' },
        ],
        transportOptions: [
          { id: 'walking', label: 'Pieszo / komunikacja', description: 'Tramwaj, autobus — tanie przejazdy', cost: 0, free: true },
          { id: 'bicycle', label: 'Rower', description: 'Prosty, ale niezawodny środek transportu', cost: 5 },
          { id: 'old_motorcycle', label: 'Stary motocykl', description: 'Używany, ledwo jeżdżący', cost: 50 },
        ],
      },
      // CR 10-49 — Przeciętnie majętny
      {
        creditRatingMin: 10, creditRatingMax: 49,
        label: 'Przeciętnie majętny',
        assetMultiplier: 50, cashMultiplier: 2,
        spending: 10,
        housingOptions: [
          { id: 'rent_apartment', label: 'Wynajem mieszkania', description: 'Skromne mieszkanie w przyzwoitej okolicy', assetReductionPct: 25, cashReductionPct: 35, ownership: 'rent' },
          { id: 'rent_house', label: 'Wynajem domu', description: 'Mały dom na przedmieściach — wyższy czynsz', assetReductionPct: 35, cashReductionPct: 50, ownership: 'rent' },
          { id: 'own_apartment', label: 'Mieszkanie (własność)', description: 'Własne mieszkanie — większość dobytku zamrożona', assetReductionPct: 65, cashReductionPct: 0, ownership: 'own' },
          { id: 'own_house', label: 'Dom (własność)', description: 'Własny dom — prawie cały dobytek zamrożony', assetReductionPct: 75, cashReductionPct: 0, ownership: 'own' },
        ],
        lifestyleOptions: [
          { id: 'average', label: 'Przeciętny', description: 'Normalne restauracje, kino, prasa', assetReductionPct: 0, cashReductionPct: 0, servants: '' },
          { id: 'wealthy', label: 'Zamożny', description: 'Dobre restauracje, kluby, rozrywka — z 1 służącym', assetReductionPct: 25, cashReductionPct: 0, servants: '1 służący' },
        ],
        transportOptions: [
          { id: 'public', label: 'Komunikacja / taksówki', description: 'Wygodne przejazdy, okazjonalne taksówki', cost: 0, free: true },
          { id: 'motorcycle', label: 'Motocykl (Indian Scout)', description: 'Szybki i ekonomiczny', cost: 150 },
          { id: 'car_cheap', label: 'Tanie auto (Ford Model T)', description: 'Podstawowy samochód — niezawodny, ale skromny', cost: 300 },
          { id: 'car_average', label: 'Przeciętne auto (Dodge/Buick)', description: 'Solidny, wygodny samochód', cost: 600 },
        ],
      },
      // CR 50-89 — Zamożny
      {
        creditRatingMin: 50, creditRatingMax: 89,
        label: 'Zamożny',
        assetMultiplier: 500, cashMultiplier: 5,
        spending: 50,
        housingOptions: [
          { id: 'luxury_apt', label: 'Luksusowy dom/apartament (własność)', description: 'Wygodne mieszkanie w dobrej dzielnicy', assetReductionPct: 15, cashReductionPct: 0, ownership: 'own' },
          { id: 'apt_plus', label: 'Dom + nieruchomość inwestycyjna', description: 'Dom plus dodatkowa nieruchomość na wynajem', assetReductionPct: 25, cashReductionPct: 10, ownership: 'own' },
          { id: 'residence', label: 'Rezydencja (własność)', description: 'Okazała rezydencja w prestiżowej okolicy', assetReductionPct: 50, cashReductionPct: 0, ownership: 'own' },
          { id: 'residence_plus', label: 'Rezydencja + nieruchomości', description: 'Rezydencja plus dodatkowe nieruchomości', assetReductionPct: 65, cashReductionPct: 15, ownership: 'own' },
        ],
        lifestyleOptions: [
          { id: 'wealthy', label: 'Zamożny', description: 'Dobre restauracje, kluby, rozrywka — z 1 służącym', assetReductionPct: 0, cashReductionPct: 0, servants: '1 służący' },
          { id: 'rich', label: 'Bogaty', description: 'Najlepsze lokale, prywatne kluby — do 4 służących', assetReductionPct: 25, cashReductionPct: 0, servants: 'do 4 służących' },
        ],
        transportOptions: [
          { id: 'taxi', label: 'Taksówki / 1. klasa', description: 'Wygodne przejazdy i taksówki', cost: 0, free: true },
          { id: 'car_average', label: 'Przeciętne auto (Dodge/Buick)', description: 'Solidny, wygodny samochód', cost: 1000 },
          { id: 'car_luxury', label: 'Luksusowe auto (Cadillac/Lincoln)', description: 'Prestiżowy samochód klasy premium', cost: 3500 },
        ],
      },
      // CR 90-98 — Bardzo zamożny
      {
        creditRatingMin: 90, creditRatingMax: 98,
        label: 'Bardzo zamożny',
        assetMultiplier: 2000, cashMultiplier: 20,
        spending: 250,
        housingOptions: [
          { id: 'residence_staff', label: 'Rezydencja z obsługą (własność)', description: 'Okazała rezydencja z pełną obsługą', assetReductionPct: 15, cashReductionPct: 0, ownership: 'own' },
          { id: 'residence_properties', label: 'Rezydencja + nieruchomości', description: 'Rezydencja plus portfolio nieruchomości', assetReductionPct: 30, cashReductionPct: 10, ownership: 'own' },
          { id: 'estate', label: 'Posiadłość ziemska', description: 'Wielka posiadłość ze stajniami i parkiem', assetReductionPct: 50, cashReductionPct: 0, ownership: 'own' },
          { id: 'estate_properties', label: 'Posiadłość + nieruchomości', description: 'Posiadłość plus kamienice i ziemia', assetReductionPct: 65, cashReductionPct: 15, ownership: 'own' },
        ],
        lifestyleOptions: [
          { id: 'rich', label: 'Bogaty', description: 'Najlepsze lokale, prywatne kluby — 4 służących', assetReductionPct: 0, cashReductionPct: 0, servants: '4 służących' },
          { id: 'luxury', label: 'Luksusowy', description: 'Najwyższy standard — pełna obsługa', assetReductionPct: 25, cashReductionPct: 0, servants: 'pełna obsługa' },
        ],
        transportOptions: [
          { id: 'car_chauffeur', label: 'Luksusowe auto + szofer', description: 'Prestiżowy samochód z szoferem', cost: 0, free: true },
          { id: 'car_collection', label: 'Kolekcja pojazdów', description: 'Kilka luksusowych samochodów', cost: 50000 },
        ],
      },
      // CR 99 — Super bogaty
      {
        creditRatingMin: 99, creditRatingMax: 99,
        label: 'Super bogaty',
        assetMultiplier: 0, cashMultiplier: 0,
        assetsFixed: 5000000, cashFixed: 50000,
        spending: 5000,
        housingOptions: [
          { id: 'multiple_properties', label: 'Wiele nieruchomości + rezydencja', description: 'Posiadłości w różnych lokalizacjach', assetReductionPct: 20, cashReductionPct: 0, ownership: 'own' },
          { id: 'palace', label: 'Pałac / zamek', description: 'Monumentalna posiadłość', assetReductionPct: 40, cashReductionPct: 0, ownership: 'own' },
        ],
        lifestyleOptions: [
          { id: 'luxury', label: 'Luksusowy', description: 'Najwyższy standard — pełna obsługa, prywatne przyjęcia', assetReductionPct: 0, cashReductionPct: 0, servants: 'pełna obsługa' },
        ],
        transportOptions: [
          { id: 'car_collection', label: 'Kolekcja pojazdów + szofer', description: 'Luksusowe samochody, szofer, garaż', cost: 0, free: true },
        ],
      },
    ],
  },
  modern: {
    id: 'modern',
    name: 'Współczesna',
    description: 'Czasy współczesne',
    currency: '$',
    wealthTable: [
      {
        creditRatingMin: 0, creditRatingMax: 0,
        label: 'Ubogi',
        assetMultiplier: 0, cashMultiplier: 0,
        assetsFixed: 0, cashFixed: 5,
        spending: 5,
        housingOptions: [
          { id: 'homeless', label: 'Bezdomny', description: 'Śpi na ulicy, w schronisku lub w samochodzie', assetReductionPct: 0, cashReductionPct: 0, ownership: 'free' },
        ],
        lifestyleOptions: [
          { id: 'poor', label: 'Biedny', description: 'Ledwo wiążesz koniec z końcem', assetReductionPct: 0, cashReductionPct: 0, servants: '' },
        ],
        transportOptions: [
          { id: 'walking', label: 'Pieszo', description: 'Brak środków na transport', cost: 0, free: true },
        ],
      },
      {
        creditRatingMin: 1, creditRatingMax: 9,
        label: 'Biedny',
        assetMultiplier: 100, cashMultiplier: 10,
        spending: 20,
        housingOptions: [
          { id: 'cheap_room', label: 'Tani pokój (wynajem)', description: 'Pokój w kiepskiej okolicy — czynsz zjada gotówkę', assetReductionPct: 25, cashReductionPct: 75, ownership: 'rent' },
          { id: 'studio_own', label: 'Kawalerka (własność)', description: 'Skromne własne lokum na obrzeżach', assetReductionPct: 75, cashReductionPct: 0, ownership: 'own' },
        ],
        lifestyleOptions: [
          { id: 'poor', label: 'Biedny', description: 'Ledwo wiążesz koniec z końcem', assetReductionPct: 0, cashReductionPct: 0, servants: '' },
          { id: 'average', label: 'Przeciętny', description: 'Fast food, streaming — powyżej stanu', assetReductionPct: 25, cashReductionPct: 0, servants: '' },
        ],
        transportOptions: [
          { id: 'walking', label: 'Pieszo / komunikacja', description: 'Autobus, metro — tanie przejazdy', cost: 0, free: true },
          { id: 'bicycle', label: 'Rower', description: 'Prosty środek transportu', cost: 50 },
          { id: 'old_scooter', label: 'Stary skuter', description: 'Używany, ale jeździ', cost: 500 },
        ],
      },
      {
        creditRatingMin: 10, creditRatingMax: 49,
        label: 'Przeciętnie majętny',
        assetMultiplier: 500, cashMultiplier: 20,
        spending: 100,
        housingOptions: [
          { id: 'rent_apartment', label: 'Wynajem mieszkania', description: 'Pokój we wspólnym mieszkaniu lub kawalerka', assetReductionPct: 25, cashReductionPct: 35, ownership: 'rent' },
          { id: 'rent_house', label: 'Wynajem domu', description: 'Mały dom na przedmieściach', assetReductionPct: 35, cashReductionPct: 50, ownership: 'rent' },
          { id: 'own_apartment', label: 'Mieszkanie (własność)', description: 'Własne mieszkanie na obrzeżach', assetReductionPct: 65, cashReductionPct: 0, ownership: 'own' },
          { id: 'own_house', label: 'Dom (własność)', description: 'Własny dom na przedmieściach', assetReductionPct: 75, cashReductionPct: 0, ownership: 'own' },
        ],
        lifestyleOptions: [
          { id: 'average', label: 'Przeciętny', description: 'Restauracje, kino, subskrypcje', assetReductionPct: 0, cashReductionPct: 0, servants: '' },
          { id: 'wealthy', label: 'Zamożny', description: 'Dobre restauracje, siłownia, podróże — z 1 osobą do pomocy', assetReductionPct: 25, cashReductionPct: 0, servants: '1 osoba do pomocy' },
        ],
        transportOptions: [
          { id: 'public', label: 'Komunikacja / Uber', description: 'Wygodne przejazdy, okazjonalne Uber', cost: 0, free: true },
          { id: 'motorcycle', label: 'Motocykl', description: 'Szybki i ekonomiczny', cost: 1500 },
          { id: 'car_used', label: 'Używane auto', description: 'Podstawowy samochód z drugiej ręki', cost: 3000 },
          { id: 'car_average', label: 'Przeciętne auto', description: 'Solidny, wygodny samochód', cost: 6000 },
        ],
      },
      {
        creditRatingMin: 50, creditRatingMax: 89,
        label: 'Zamożny',
        assetMultiplier: 5000, cashMultiplier: 50,
        spending: 500,
        housingOptions: [
          { id: 'luxury_apt', label: 'Luksusowy apartament (własność)', description: 'Mieszkanie w dobrej dzielnicy', assetReductionPct: 15, cashReductionPct: 0, ownership: 'own' },
          { id: 'apt_plus', label: 'Dom + nieruchomość inwestycyjna', description: 'Dom plus mieszkanie na wynajem', assetReductionPct: 25, cashReductionPct: 10, ownership: 'own' },
          { id: 'residence', label: 'Willa (własność)', description: 'Willa z basenem i garażem', assetReductionPct: 50, cashReductionPct: 0, ownership: 'own' },
          { id: 'residence_plus', label: 'Willa + nieruchomości', description: 'Willa plus portfolio nieruchomości', assetReductionPct: 65, cashReductionPct: 15, ownership: 'own' },
        ],
        lifestyleOptions: [
          { id: 'wealthy', label: 'Zamożny', description: 'Dobre restauracje, siłownia, podróże — z 1 osobą do pomocy', assetReductionPct: 0, cashReductionPct: 0, servants: '1 osoba do pomocy' },
          { id: 'rich', label: 'Bogaty', description: 'Najlepsze lokale, VIP, podróże 1. klasa — do 4 osób obsługi', assetReductionPct: 25, cashReductionPct: 0, servants: 'do 4 osób obsługi' },
        ],
        transportOptions: [
          { id: 'taxi', label: 'Uber / taksówki', description: 'Wygodne przejazdy na życzenie', cost: 0, free: true },
          { id: 'car_average', label: 'Przeciętne auto', description: 'Solidny, wygodny samochód', cost: 10000 },
          { id: 'car_luxury', label: 'Luksusowe auto', description: 'Prestiżowy samochód klasy premium', cost: 35000 },
        ],
      },
      {
        creditRatingMin: 90, creditRatingMax: 98,
        label: 'Bardzo zamożny',
        assetMultiplier: 20000, cashMultiplier: 200,
        spending: 2500,
        housingOptions: [
          { id: 'residence_staff', label: 'Rezydencja z obsługą', description: 'Luksusowa willa z obsługą', assetReductionPct: 15, cashReductionPct: 0, ownership: 'own' },
          { id: 'residence_properties', label: 'Rezydencja + nieruchomości', description: 'Rezydencja plus portfolio inwestycyjne', assetReductionPct: 30, cashReductionPct: 10, ownership: 'own' },
          { id: 'estate', label: 'Posiadłość', description: 'Wielka posiadłość z terenem', assetReductionPct: 50, cashReductionPct: 0, ownership: 'own' },
          { id: 'estate_properties', label: 'Posiadłość + nieruchomości', description: 'Posiadłość plus nieruchomości w wielu miastach', assetReductionPct: 65, cashReductionPct: 15, ownership: 'own' },
        ],
        lifestyleOptions: [
          { id: 'rich', label: 'Bogaty', description: 'Najlepsze lokale, VIP — 4 osoby obsługi', assetReductionPct: 0, cashReductionPct: 0, servants: '4 osoby obsługi' },
          { id: 'luxury', label: 'Luksusowy', description: 'Najwyższy standard — pełna obsługa', assetReductionPct: 25, cashReductionPct: 0, servants: 'pełna obsługa' },
        ],
        transportOptions: [
          { id: 'car_chauffeur', label: 'Luksusowe auto + szofer', description: 'Prestiżowy samochód z szoferem', cost: 0, free: true },
          { id: 'car_collection', label: 'Kolekcja pojazdów', description: 'Kilka luksusowych aut', cost: 500000 },
        ],
      },
      {
        creditRatingMin: 99, creditRatingMax: 99,
        label: 'Super bogaty',
        assetMultiplier: 0, cashMultiplier: 0,
        assetsFixed: 50000000, cashFixed: 500000,
        spending: 50000,
        housingOptions: [
          { id: 'multiple_properties', label: 'Wiele nieruchomości + rezydencja', description: 'Apartamenty i domy w wielu miastach', assetReductionPct: 20, cashReductionPct: 0, ownership: 'own' },
          { id: 'palace', label: 'Mega-rezydencja', description: 'Monumentalna posiadłość', assetReductionPct: 40, cashReductionPct: 0, ownership: 'own' },
        ],
        lifestyleOptions: [
          { id: 'luxury', label: 'Luksusowy', description: 'Najwyższy standard — pełna obsługa', assetReductionPct: 0, cashReductionPct: 0, servants: 'pełna obsługa' },
        ],
        transportOptions: [
          { id: 'car_collection', label: 'Kolekcja pojazdów + szofer', description: 'Luksusowe samochody, szofer', cost: 0, free: true },
        ],
      },
    ],
  },
  gaslight: {
    id: 'gaslight',
    name: 'Gaslight (epoka wiktoriańska)',
    description: 'Wiktoriańska Anglia lat 1890.',
    currency: '£',
    wealthTable: [
      {
        creditRatingMin: 0, creditRatingMax: 0,
        label: 'Ubogi',
        assetMultiplier: 0, cashMultiplier: 0,
        assetsFixed: 0, cashFixed: 0.01,
        spending: 0.01,
        housingOptions: [
          { id: 'homeless', label: 'Bezdomny', description: 'Śpi na ulicy lub w przytułku', assetReductionPct: 0, cashReductionPct: 0, ownership: 'free' },
        ],
        lifestyleOptions: [
          { id: 'poor', label: 'Biedny', description: 'Ledwo wiążesz koniec z końcem', assetReductionPct: 0, cashReductionPct: 0, servants: '' },
        ],
        transportOptions: [
          { id: 'walking', label: 'Pieszo', description: 'Brak środków na transport', cost: 0, free: true },
        ],
      },
      {
        creditRatingMin: 1, creditRatingMax: 9,
        label: 'Biedny',
        assetMultiplier: 0.2, cashMultiplier: 0.02,
        spending: 0.05,
        housingOptions: [
          { id: 'cheap_room', label: 'Kwatera (tania)', description: 'Pokój w ciasnej kamienicy — czynsz zjada gotówkę', assetReductionPct: 25, cashReductionPct: 75, ownership: 'rent' },
          { id: 'lodging_own', label: 'Tanie kwatery (własność)', description: 'Skromne własne lokum', assetReductionPct: 75, cashReductionPct: 0, ownership: 'own' },
        ],
        lifestyleOptions: [
          { id: 'poor', label: 'Biedny', description: 'Ledwo wiążesz koniec z końcem', assetReductionPct: 0, cashReductionPct: 0, servants: '' },
          { id: 'modest', label: 'Skromny', description: 'Proste posiłki, tani pub — powyżej stanu', assetReductionPct: 25, cashReductionPct: 0, servants: '' },
        ],
        transportOptions: [
          { id: 'omnibus', label: 'Pieszo / omnibus', description: 'Tani transport konny', cost: 0, free: true },
          { id: 'bicycle', label: 'Rower', description: 'Prosty rower', cost: 0.3 },
        ],
      },
      {
        creditRatingMin: 10, creditRatingMax: 49,
        label: 'Przeciętnie majętny',
        assetMultiplier: 1, cashMultiplier: 0.05,
        spending: 0.1,
        housingOptions: [
          { id: 'rent_lodgings', label: 'Wynajmowane kwatery', description: 'Pokój w pensjonacie lub skromne mieszkanie', assetReductionPct: 25, cashReductionPct: 35, ownership: 'rent' },
          { id: 'rent_house', label: 'Wynajmowany dom', description: 'Mały dom na przedmieściu', assetReductionPct: 35, cashReductionPct: 50, ownership: 'rent' },
          { id: 'own_flat', label: 'Małe kwatery (własność)', description: 'Własne skromne mieszkanie', assetReductionPct: 65, cashReductionPct: 0, ownership: 'own' },
          { id: 'own_cottage', label: 'Domek (własność)', description: 'Domek na przedmieściu', assetReductionPct: 75, cashReductionPct: 0, ownership: 'own' },
        ],
        lifestyleOptions: [
          { id: 'modest', label: 'Skromny', description: 'Przyzwoite posiłki, herbaciarnia, teatr', assetReductionPct: 0, cashReductionPct: 0, servants: '' },
          { id: 'average', label: 'Przeciętny', description: 'Dobre posiłki, rozrywka — z 1 służącym', assetReductionPct: 25, cashReductionPct: 0, servants: '1 służący' },
        ],
        transportOptions: [
          { id: 'omnibus', label: 'Omnibus / dorożka', description: 'Regularne przejazdy', cost: 0, free: true },
          { id: 'bicycle', label: 'Rower', description: 'Prosty rower', cost: 1 },
          { id: 'horse', label: 'Koń z siodłem', description: 'Własny koń wierzchowy', cost: 5 },
        ],
      },
      {
        creditRatingMin: 50, creditRatingMax: 89,
        label: 'Zamożny',
        assetMultiplier: 10, cashMultiplier: 0.05,
        spending: 0.5,
        housingOptions: [
          { id: 'nice_flat', label: 'Mieszkanie w dobrej dzielnicy (własność)', description: 'Wygodne mieszkanie', assetReductionPct: 15, cashReductionPct: 0, ownership: 'own' },
          { id: 'flat_plus', label: 'Kamienica + nieruchomość', description: 'Kamienica plus dodatkowa nieruchomość', assetReductionPct: 25, cashReductionPct: 10, ownership: 'own' },
          { id: 'townhouse', label: 'Dom w mieście (własność)', description: 'Okazały dom w mieście z ogródkiem', assetReductionPct: 50, cashReductionPct: 0, ownership: 'own' },
          { id: 'townhouse_plus', label: 'Dom + nieruchomości', description: 'Dom w mieście plus kamienice', assetReductionPct: 65, cashReductionPct: 15, ownership: 'own' },
        ],
        lifestyleOptions: [
          { id: 'average', label: 'Przeciętny', description: 'Dobre restauracje, kluby dżentelmenów — z 1 służącym', assetReductionPct: 0, cashReductionPct: 0, servants: '1 służący' },
          { id: 'wealthy', label: 'Zamożny', description: 'Najlepsze lokale — do 4 służących', assetReductionPct: 25, cashReductionPct: 0, servants: 'do 4 służących' },
        ],
        transportOptions: [
          { id: 'cab', label: 'Dorożka', description: 'Regularne przejazdy dorożką', cost: 0, free: true },
          { id: 'horse', label: 'Koń z siodłem', description: 'Własny koń wierzchowy', cost: 5 },
          { id: 'carriage', label: 'Powóz', description: 'Własny powóz z koniem', cost: 30 },
        ],
      },
      {
        creditRatingMin: 90, creditRatingMax: 98,
        label: 'Bardzo zamożny',
        assetMultiplier: 200, cashMultiplier: 0.5,
        spending: 5,
        housingOptions: [
          { id: 'mayfair', label: 'Apartament w Mayfair (własność)', description: 'Eleganckie mieszkanie w prestiżowej dzielnicy', assetReductionPct: 15, cashReductionPct: 0, ownership: 'own' },
          { id: 'mayfair_plus', label: 'Apartament + nieruchomości', description: 'Rezydencja plus kamienice', assetReductionPct: 30, cashReductionPct: 10, ownership: 'own' },
          { id: 'country_house', label: 'Posiadłość wiejska (własność)', description: 'Dom ze służbą na wsi', assetReductionPct: 50, cashReductionPct: 0, ownership: 'own' },
          { id: 'estate', label: 'Posiadłość + nieruchomości', description: 'Okazała posiadłość plus majątek ziemski', assetReductionPct: 65, cashReductionPct: 15, ownership: 'own' },
        ],
        lifestyleOptions: [
          { id: 'wealthy', label: 'Zamożny', description: 'Najlepsze lokale, prywatne kluby — 4 służących', assetReductionPct: 0, cashReductionPct: 0, servants: '4 służących' },
          { id: 'luxury', label: 'Luksusowy', description: 'Najwyższy standard — pełna obsługa', assetReductionPct: 25, cashReductionPct: 0, servants: 'pełna obsługa' },
        ],
        transportOptions: [
          { id: 'carriage', label: 'Powóz luksusowy', description: 'Elegancki powóz z parą koni', cost: 0, free: true },
          { id: 'stable', label: 'Stajnia koni + powozy', description: 'Kilka koni i powozów', cost: 100 },
        ],
      },
      {
        creditRatingMin: 99, creditRatingMax: 99,
        label: 'Super bogaty',
        assetMultiplier: 0, cashMultiplier: 0,
        assetsFixed: 100000, cashFixed: 1000,
        spending: 100,
        housingOptions: [
          { id: 'grand_estate', label: 'Posiadłość ze służbą', description: 'Wielka posiadłość z parkiem i stajniami', assetReductionPct: 20, cashReductionPct: 0, ownership: 'own' },
          { id: 'multiple_properties', label: 'Wiele nieruchomości', description: 'Rezydencja w Londynie i posiadłość na wsi', assetReductionPct: 40, cashReductionPct: 0, ownership: 'own' },
        ],
        lifestyleOptions: [
          { id: 'luxury', label: 'Luksusowy', description: 'Najwyższy standard — pełna obsługa', assetReductionPct: 0, cashReductionPct: 0, servants: 'pełna obsługa' },
        ],
        transportOptions: [
          { id: 'stable', label: 'Stajnia koni + powozy + stangret', description: 'Pełne wyposażenie transportowe', cost: 0, free: true },
        ],
      },
    ],
  },
  wild_west: {
    id: 'wild_west',
    name: 'Stary Zachód',
    description: 'Amerykański pogranicze lat 1880. — kowboje, rewolwerowcy, pył prerii',
    currency: '$',
    skipWealthStep: true,
    skipContactsStep: true,
    wealthTable: [
      // CR 0 — Ubogi
      {
        creditRatingMin: 0, creditRatingMax: 0,
        label: 'Ubogi',
        assetMultiplier: 0, cashMultiplier: 0,
        assetsFixed: 0, cashFixed: 0.25,
        spending: 0.25,
        housingOptions: [],
        lifestyleOptions: [],
        transportOptions: [],
      },
      // CR 1-9 — Biedny
      {
        creditRatingMin: 1, creditRatingMax: 9,
        label: 'Biedny',
        assetMultiplier: 5, cashMultiplier: 0.5,
        spending: 1,
        housingOptions: [],
        lifestyleOptions: [],
        transportOptions: [],
      },
      // CR 10-49 — Przeciętnie majętny
      {
        creditRatingMin: 10, creditRatingMax: 49,
        label: 'Przeciętnie majętny',
        assetMultiplier: 25, cashMultiplier: 1,
        spending: 5,
        housingOptions: [],
        lifestyleOptions: [],
        transportOptions: [],
      },
      // CR 50-89 — Zamożny
      {
        creditRatingMin: 50, creditRatingMax: 89,
        label: 'Zamożny',
        assetMultiplier: 250, cashMultiplier: 3,
        spending: 25,
        housingOptions: [],
        lifestyleOptions: [],
        transportOptions: [],
      },
      // CR 90-98 — Bogaty
      {
        creditRatingMin: 90, creditRatingMax: 98,
        label: 'Bogaty',
        assetMultiplier: 1000, cashMultiplier: 10,
        spending: 125,
        housingOptions: [],
        lifestyleOptions: [],
        transportOptions: [],
      },
      // CR 99 — Krezus
      {
        creditRatingMin: 99, creditRatingMax: 99,
        label: 'Krezus',
        assetMultiplier: 0, cashMultiplier: 0,
        assetsFixed: 2500000, cashFixed: 25000,
        spending: 2500,
        housingOptions: [],
        lifestyleOptions: [],
        transportOptions: [],
      },
    ],
  },
}

export function getWealthBracket(era: Era, creditRating: number): WealthBracket {
  const eraData = ERAS[era]
  if (!eraData) return ERAS.classic_1920s.wealthTable[0]
  for (const bracket of eraData.wealthTable) {
    if (creditRating >= bracket.creditRatingMin && creditRating <= bracket.creditRatingMax) {
      return bracket
    }
  }
  return eraData.wealthTable[0]
}

/** Format a numeric value with the era's currency symbol */
export function formatCurrency(era: Era, amount: number): string {
  const currency = ERAS[era].currency
  if (currency === '£') {
    if (amount < 0.05) return `${Math.round(amount * 240)} pensów`
    if (amount < 1) return `${Math.round(amount * 20)} szylingów`
    return `${amount.toLocaleString('pl')} funtów`
  }
  return `${amount.toLocaleString('pl')} $`
}
