/**
 * Wealth System v2 — Tiers, Gap Formula, Star Rating, Presets
 * Era: Klasyczna (lata 20. XX wieku)
 */

// ── Tiers ──────────────────────────────────────────────────────

export interface Tier {
  id: string
  label: string
  min: number
  max: number
  spending: number    // $ per day
  assetMult: number   // assets = majetnosc × mult
  cashMult: number    // cash = majetnosc × mult
  assetsFixed?: number
  cashFixed?: number
}

export const TIERS: Tier[] = [
  { id: 'A', label: 'Bezdomny',       min: 0,  max: 0,  spending: 0.5,  assetMult: 0,    cashMult: 0,   cashFixed: 1 },
  { id: 'B', label: 'Ubogi',          min: 1,  max: 9,  spending: 2,    assetMult: 5,    cashMult: 1 },
  { id: 'C', label: 'Przeciętny',     min: 10, max: 30, spending: 7,    assetMult: 50,   cashMult: 2 },
  { id: 'D', label: 'Zamożny',        min: 31, max: 50, spending: 25,   assetMult: 200,  cashMult: 2 },
  { id: 'E', label: 'Bardzo zamożny', min: 51, max: 70, spending: 80,   assetMult: 500,  cashMult: 5 },
  { id: 'F', label: 'Bogaty',         min: 71, max: 80, spending: 300,  assetMult: 2000, cashMult: 5 },
]

export function getTier(majetnosc: number): Tier {
  for (const t of TIERS) {
    if (majetnosc >= t.min && majetnosc <= t.max) return t
  }
  return TIERS[TIERS.length - 1]
}

export function calcBaseWealth(majetnosc: number) {
  const tier = getTier(majetnosc)
  return {
    tier,
    spending: tier.spending,
    assets: tier.assetsFixed ?? majetnosc * tier.assetMult,
    cash: tier.cashFixed ?? majetnosc * tier.cashMult,
  }
}

// ── Gap Formula ────────────────────────────────────────────────

export function gapRatio(playerMajetnosc: number, targetTierMin: number, targetTierMax: number): number {
  if (playerMajetnosc >= targetTierMin) return 0
  const gap = targetTierMin - playerMajetnosc
  const range = targetTierMax - playerMajetnosc
  return range > 0 ? gap / range : 0
}

export function gapCost(playerMajetnosc: number, targetTier: Tier, playerSpending: number): number {
  const ratio = gapRatio(playerMajetnosc, targetTier.min, targetTier.max)
  return ratio * (targetTier.spending - playerSpending)
}

// ── Lokum ──────────────────────────────────────────────────────

export interface LokumOption {
  id: string
  label: string
  tierId: string          // natural tier
  rentalPerDay: number    // 0 = free / not rentable
  purchaseMin: number     // 0 = not purchasable
  purchaseMax: number
  maintenancePerDay: number // base maintenance if owned above tier
  starPoints: number
  canRent: boolean
  canOwn: boolean
}

export const LOKUM_OPTIONS: LokumOption[] = [
  { id: 'homeless',      label: 'Bezdomność',           tierId: 'A', rentalPerDay: 0,     purchaseMin: 0,      purchaseMax: 0,      maintenancePerDay: 0,    starPoints: 0.0, canRent: false, canOwn: false },
  { id: 'shelter',       label: 'Noclegownia',          tierId: 'A', rentalPerDay: 0.25,  purchaseMin: 0,      purchaseMax: 0,      maintenancePerDay: 0,    starPoints: 0.0, canRent: true,  canOwn: false },
  { id: 'room',          label: 'Wynajęty pokój',       tierId: 'B', rentalPerDay: 0.50,  purchaseMin: 0,      purchaseMax: 0,      maintenancePerDay: 0,    starPoints: 0.8, canRent: true,  canOwn: false },
  { id: 'studio',        label: 'Kawalerka',            tierId: 'C', rentalPerDay: 1.50,  purchaseMin: 1000,   purchaseMax: 2000,   maintenancePerDay: 0.50, starPoints: 1.5, canRent: true,  canOwn: true },
  { id: 'apartment_2',   label: 'Mieszkanie 2–3 pok.',  tierId: 'C', rentalPerDay: 2.50,  purchaseMin: 2500,   purchaseMax: 4500,   maintenancePerDay: 0.75, starPoints: 2.0, canRent: true,  canOwn: true },
  { id: 'small_house',   label: 'Skromny dom',          tierId: 'C', rentalPerDay: 3.00,  purchaseMin: 4000,   purchaseMax: 7000,   maintenancePerDay: 1.00, starPoints: 2.2, canRent: true,  canOwn: true },
  { id: 'nice_apartment',label: 'Dobre mieszkanie',     tierId: 'D', rentalPerDay: 5.00,  purchaseMin: 6000,   purchaseMax: 12000,  maintenancePerDay: 1.50, starPoints: 2.8, canRent: true,  canOwn: true },
  { id: 'loft',          label: 'Apartament',           tierId: 'D', rentalPerDay: 8.00,  purchaseMin: 8000,   purchaseMax: 15000,  maintenancePerDay: 2.00, starPoints: 3.2, canRent: true,  canOwn: true },
  { id: 'luxury_apt',    label: 'Drogi apartament',     tierId: 'D', rentalPerDay: 12.00, purchaseMin: 12000,  purchaseMax: 25000,  maintenancePerDay: 3.00, starPoints: 3.8, canRent: true,  canOwn: true },
  { id: 'house_garden',  label: 'Dom z ogrodem',        tierId: 'D', rentalPerDay: 8.00,  purchaseMin: 8000,   purchaseMax: 15000,  maintenancePerDay: 2.00, starPoints: 3.5, canRent: true,  canOwn: true },
  { id: 'mansion',       label: 'Rezydencja',           tierId: 'E', rentalPerDay: 20.00, purchaseMin: 20000,  purchaseMax: 50000,  maintenancePerDay: 5.00, starPoints: 4.5, canRent: true,  canOwn: true },
  { id: 'estate',        label: 'Posiadłość',           tierId: 'F', rentalPerDay: 40.00, purchaseMin: 50000,  purchaseMax: 100000, maintenancePerDay: 8.00, starPoints: 5.0, canRent: true,  canOwn: true },
]

// ── Transport Style ────────────────────────────────────────────

export interface TransportStyle {
  id: string
  label: string
  tierId: string
  dailyCost: number  // extra daily from spending (0 = included)
  starPoints: number
}

export const TRANSPORT_STYLES: TransportStyle[] = [
  { id: 'walk',         label: 'Pieszo / autostop',                tierId: 'A', dailyCost: 0,    starPoints: 0.0 },
  { id: 'public',       label: 'Komunikacja miejska',              tierId: 'B', dailyCost: 0,    starPoints: 0.3 },
  { id: 'public_taxi',  label: 'Komunikacja + okazj. taksówki',    tierId: 'C', dailyCost: 0.30, starPoints: 0.6 },
  { id: 'taxi_regular',  label: 'Regularne taksówki / kolej 1. kl.', tierId: 'D', dailyCost: 1.00, starPoints: 1.0 },
  { id: 'luxury_taxi',  label: 'Luksusowe taksówki / szofer',      tierId: 'E', dailyCost: 3.00, starPoints: 1.5 },
]

// ── Lifestyle ──────────────────────────────────────────────────

export interface LifestyleLevel {
  id: string
  label: string
  tierId: string
  description: string
  starPoints: number
}

export const LIFESTYLE_LEVELS: LifestyleLevel[] = [
  { id: 'destitute',   label: 'Nędzny',      tierId: 'A', description: 'Życie na ulicy. Łachmany, jedzenie z odpadków, noce pod mostem. Ziemia pod paznokciami, wieczny głód i zimno. Ludzie odwracają wzrok.',                                  starPoints: 0.0 },
  { id: 'frugal',      label: 'Skromny',      tierId: 'B', description: 'Czyste, ale skromne życie. Jedno ubranie na zmianę, prosty posiłek, żadnych rozrywek. Woda z pompy zamiast kranu, świeca zamiast żarówki.',                     starPoints: 0.5 },
  { id: 'average',     label: 'Przeciętny',   tierId: 'C', description: 'Porządne ubranie, wizyta w kinie w sobotę, piwo w barze po pracy. Gazeta co rano, tani urlop nad jeziorem. Zwykłe, uczciwe życie.',                    starPoints: 1.0 },
  { id: 'comfortable', label: 'Komfortowy',   tierId: 'D', description: 'Restauracje co weekend, modna garderoba, lokaj lub służąca. Wakacje w 3-gwiazdkowych hotelach, regularne wyjścia do teatru i opery.',           starPoints: 1.5 },
  { id: 'elegant',     label: 'Elegancki',    tierId: 'E', description: 'Stała służba domowa, loża w operze, przyjęcia i bale. Urlopy na Riwierze, hotele 4-gwiazdkowe, szampan na kolację. Życie salonowe.', starPoints: 2.0 },
  { id: 'luxury',      label: 'Luksusowy',    tierId: 'F', description: 'Wszystko co najlepsze: bez mrugnięcia okiem. Apartamenty w najlepszych hotelach, prywatne wagony kolejowe, wykwintna kuchnia codziennie.', starPoints: 2.5 },
]

// ── Star Rating ────────────────────────────────────────────────

const MAX_SCORE = 5.0 + 1.5 + 2.5  // lokum + transport + lifestyle = 9.0

export function calcStarRating(lokumPts: number, transportPts: number, lifestylePts: number, hasSecondProperty: boolean): number {
  let score = lokumPts + transportPts + lifestylePts
  if (hasSecondProperty) score += 0.3
  const raw = (score / MAX_SCORE) * 5
  return Math.round(raw * 2) / 2  // round to nearest 0.5
}

export function starString(rating: number): string {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return '★'.repeat(full) + (half ? '☆' : '') + '·'.repeat(empty)
}

export function ratingLabel(rating: number): string {
  if (rating <= 0) return 'Bezdomny'
  if (rating <= 1) return 'Nędzny'
  if (rating <= 2) return 'Skromny'
  if (rating <= 3) return 'Przeciętny'
  if (rating <= 4) return 'Zamożny'
  return 'Luksusowy'
}

// ── Cost Calculation ───────────────────────────────────────────

export interface CostBreakdown {
  lokumDaily: number        // rental or maintenance
  lokum2Daily: number       // second property daily
  transportDaily: number    // transport style extra
  lifestyleDaily: number    // gap cost for above-tier lifestyle
  totalDaily: number
  spendingFree: number      // spending - totalDaily
  assetsPurchase: number    // one-time from assets (lokum purchase)
  assetsRemaining: number   // assets after purchases
}

export function calcCosts(
  majetnosc: number,
  baseSpending: number,
  baseAssets: number,
  lokum: LokumOption,
  lokumOwnership: 'rent' | 'own',
  lokum2: LokumOption | null,
  lokum2Ownership: 'rent' | 'own' | null,
  transport: TransportStyle,
  lifestyle: LifestyleLevel,
): CostBreakdown {
  let assetsPurchase = 0
  let lokumDaily = 0
  let lokum2Daily = 0

  // Lokum 1
  if (lokumOwnership === 'rent') {
    lokumDaily = lokum.rentalPerDay
  } else if (lokumOwnership === 'own' && lokum.canOwn) {
    assetsPurchase += (lokum.purchaseMin + lokum.purchaseMax) / 2  // midpoint
    const lokumTier = TIERS.find((t) => t.id === lokum.tierId)!
    const gr = gapRatio(majetnosc, lokumTier.min, lokumTier.max)
    if (gr > 0) {
      lokumDaily = lokum.maintenancePerDay * (1 + gr)
    }
  }

  // Lokum 2
  if (lokum2 && lokum2Ownership) {
    if (lokum2Ownership === 'rent') {
      lokum2Daily = lokum2.rentalPerDay
    } else if (lokum2Ownership === 'own' && lokum2.canOwn) {
      assetsPurchase += (lokum2.purchaseMin + lokum2.purchaseMax) / 2
      const lokum2Tier = TIERS.find((t) => t.id === lokum2.tierId)!
      const gr = gapRatio(majetnosc, lokum2Tier.min, lokum2Tier.max)
      lokum2Daily = 0.40 * lokum2.rentalPerDay * (1 + gr)
    }
  }

  // Transport — gap cost if above tier
  const transportTier = TIERS.find((t) => t.id === transport.tierId)!
  const transportGap = gapRatio(majetnosc, transportTier.min, transportTier.max)
  const transportDaily = transport.dailyCost * (1 + transportGap)

  // Lifestyle — gap cost if above tier
  const lifestyleTier = TIERS.find((t) => t.id === lifestyle.tierId)!
  const lifestyleDaily = gapCost(majetnosc, lifestyleTier, baseSpending)

  const totalDaily = lokumDaily + lokum2Daily + transportDaily + lifestyleDaily
  const spendingFree = baseSpending - totalDaily
  const assetsRemaining = Math.max(0, baseAssets - assetsPurchase)

  return {
    lokumDaily, lokum2Daily, transportDaily, lifestyleDaily,
    totalDaily, spendingFree,
    assetsPurchase, assetsRemaining,
  }
}

// ── Asset Forms ────────────────────────────────────────────────

export interface AssetForm {
  id: string
  label: string
  minAssets: number
  naturalTiers: string[]  // tiers where this form is natural
}

export const ASSET_FORMS: AssetForm[] = [
  { id: 'bank_account',    label: 'Konto bankowe',        minAssets: 50,   naturalTiers: ['C','D','E','F'] },
  { id: 'bonds',           label: 'Obligacje rządowe',    minAssets: 200,  naturalTiers: ['C','D','E','F'] },
  { id: 'stocks',          label: 'Akcje',                minAssets: 500,  naturalTiers: ['D','E','F'] },
  { id: 'gold',            label: 'Złoto / srebro',       minAssets: 100,  naturalTiers: ['C','D','E','F'] },
  { id: 'jewelry',         label: 'Biżuteria',            minAssets: 200,  naturalTiers: ['C','D','E','F'] },
  { id: 'art',             label: 'Dzieła sztuki',        minAssets: 500,  naturalTiers: ['D','E','F'] },
  { id: 'real_estate',     label: 'Nieruchomości',        minAssets: 3000, naturalTiers: ['D','E','F'] },
  { id: 'goods',           label: 'Towary / zapasy',      minAssets: 100,  naturalTiers: ['B','C','D','E','F'] },
]

// ── Presets ────────────────────────────────────────────────────

export interface Preset {
  id: 'thrifty' | 'comfortable' | 'extravagant'
  label: string
  lokumId: string
  lokumOwnership: 'rent' | 'own'
  transportId: string
  lifestyleId: string
  lokum2Id: string | null
  lokum2Ownership: 'rent' | 'own' | null
  rating: number
  stars: string
  ratingLabel: string
  spendingFree: number
  assetsRemaining: number
}

export function generatePresets(majetnosc: number): Preset[] {
  const { tier, spending, assets } = calcBaseWealth(majetnosc)

  function buildPreset(
    id: Preset['id'], label: string,
    lokumId: string, lokumOwnership: 'rent' | 'own',
    transportId: string, lifestyleId: string,
    lokum2Id: string | null = null, lokum2Ownership: 'rent' | 'own' | null = null,
  ): Preset {
    const lokum = LOKUM_OPTIONS.find((l) => l.id === lokumId)!
    const lokum2 = lokum2Id ? LOKUM_OPTIONS.find((l) => l.id === lokum2Id) ?? null : null
    const transport = TRANSPORT_STYLES.find((t) => t.id === transportId)!
    const lifestyle = LIFESTYLE_LEVELS.find((l) => l.id === lifestyleId)!
    const costs = calcCosts(majetnosc, spending, assets, lokum, lokumOwnership, lokum2, lokum2Ownership, transport, lifestyle)
    const rating = calcStarRating(lokum.starPoints, transport.starPoints, lifestyle.starPoints, !!lokum2)
    return {
      id, label, lokumId, lokumOwnership, transportId, lifestyleId,
      lokum2Id, lokum2Ownership,
      rating, stars: starString(rating), ratingLabel: ratingLabel(rating),
      spendingFree: costs.spendingFree, assetsRemaining: costs.assetsRemaining,
    }
  }

  // Thrifty: cheapest viable options in tier
  const thriftyLokum = tier.id === 'A' ? 'homeless' : tier.id === 'B' ? 'room' : 'studio'
  const thriftyOwn = tier.id >= 'C' && assets >= 1000 ? 'own' as const : 'rent' as const
  const thriftyTransport = tier.id <= 'B' ? 'walk' : 'public'
  const thriftyLifestyle = tier.id === 'A' ? 'destitute' : tier.id === 'B' ? 'frugal' : 'average'

  // Comfortable: good quality, balanced
  const comfLokum = tier.id <= 'B' ? 'room' : tier.id === 'C' ? 'apartment_2' : tier.id === 'D' ? 'nice_apartment' : 'loft'
  const comfTransport = tier.id <= 'B' ? 'public' : tier.id === 'C' ? 'public_taxi' : 'taxi_regular'
  const comfLifestyle = tier.id <= 'B' ? 'frugal' : tier.id === 'C' ? 'average' : 'comfortable'

  // Extravagant: max quality within budget
  const extLokum = tier.id <= 'B' ? 'studio' : tier.id === 'C' ? 'apartment_2' : tier.id === 'D' ? 'luxury_apt' : tier.id === 'E' ? 'mansion' : 'estate'
  const extTransport = tier.id <= 'C' ? 'taxi_regular' : 'luxury_taxi'
  const extLifestyle = tier.id <= 'B' ? 'average' : tier.id === 'C' ? 'comfortable' : tier.id === 'D' ? 'comfortable' : 'elegant'

  return [
    buildPreset('thrifty', 'Oszczędny', thriftyLokum, thriftyOwn, thriftyTransport, thriftyLifestyle),
    buildPreset('comfortable', 'Wygodny', comfLokum, 'rent', comfTransport, comfLifestyle),
    buildPreset('extravagant', 'Ekstrawagancki', extLokum, 'rent', extTransport, extLifestyle),
  ]
}

// ── Formatting ─────────────────────────────────────────────────

export function formatDollars(amount: number): string {
  if (amount >= 1000) return `$${amount.toLocaleString('pl')}`
  if (amount === Math.floor(amount)) return `$${amount}`
  return `$${amount.toFixed(2)}`
}
