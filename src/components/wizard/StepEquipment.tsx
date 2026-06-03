import { useState, useMemo } from 'react'
import { useCharacterStore } from '@/stores/characterStore'
import {
  calcBaseWealth, calcCosts, calcStarRating, starString, ratingLabel,
  generatePresets, formatDollars, LOKUM_OPTIONS, TRANSPORT_STYLES, LIFESTYLE_LEVELS,
  ASSET_FORMS, TIERS, type Preset,
} from '@/data/wealthV2'
import { EQUIPMENT_CATALOG_V2, EQUIPMENT_CATEGORY_LABELS } from '@/data/equipmentV2'
import { WEAPONS_CATALOG_V2, AMMO_CATALOG } from '@/data/weaponsV2'
import { BLACK_MARKET_CATALOG } from '@/data/blackMarket'
import { MILITARY_CATALOG } from '@/data/militaryGear'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Search, ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react'

export function StepEquipment() {
  const store = useCharacterStore()
  const creditRating = (store.occupationSkillPoints['majetnosc'] ?? 0) + (store.personalSkillPoints['majetnosc'] ?? 0)
  const majetnosc = Math.min(80, creditRating)
  const hasBlackMarket = store.perks.includes('black_market')
  const hasMilitary = store.perks.includes('military_gear')
  // Era-filtered equipment catalog (WW items only visible to wild_west characters and vice versa).
  // Null era falls back to classic_1920s (legacy default).
  const charEra = store.era ?? 'classic_1920s'
  const equipmentCatalog = useMemo(
    () => EQUIPMENT_CATALOG_V2.filter((it) => !it.era || it.era.includes(charEra)),
    [charEra],
  )
  const { tier, spending, assets, cash } = calcBaseWealth(majetnosc)

  // ── State ──
  const [mode, setMode] = useState<'presets' | 'custom'>('presets')
  const [lokumId, setLokumId] = useState(store.housingId || '')
  const [lokumOwnership, setLokumOwnership] = useState<'rent' | 'own'>(store.lokumOwnership || 'rent')
  const [hasLokum2, setHasLokum2] = useState(!!store.lokum2Id)
  const [lokum2Id, setLokum2Id] = useState(store.lokum2Id || '')
  const [lokum2Ownership, setLokum2Ownership] = useState<'rent' | 'own'>(store.lokum2Ownership as 'rent' | 'own' || 'rent')
  const [transportStyleId, setTransportStyleId] = useState(store.transportStyleId || '')
  const [lifestyleId, setLifestyleId] = useState(store.lifestyleId || '')
  const [selectedFormIds, setSelectedFormIds] = useState<string[]>(store.wealthFormIds || [])
  const [selectedItems, setSelectedItems] = useState<string[]>(
    (store.equipment || []).filter((e) => !e.startsWith('[Lokum]') && !e.startsWith('[Transport]') && !e.startsWith('[Lifestyle]') && !e.startsWith('[Dobytek]'))
  )
  const [customItems, setCustomItems] = useState<string[]>(store.customItems || [])
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const [presetUsed, setPresetUsed] = useState(store.presetUsed || '')

  // ── Presets ──
  const presets = useMemo(() => generatePresets(majetnosc), [majetnosc])

  // ── Computed costs ──
  const lokum = LOKUM_OPTIONS.find((l) => l.id === lokumId) ?? LOKUM_OPTIONS[0]
  const lokum2 = hasLokum2 ? LOKUM_OPTIONS.find((l) => l.id === lokum2Id) ?? null : null
  const transport = TRANSPORT_STYLES.find((t) => t.id === transportStyleId) ?? TRANSPORT_STYLES[0]
  const lifestyle = LIFESTYLE_LEVELS.find((l) => l.id === lifestyleId) ?? LIFESTYLE_LEVELS[0]

  const costs = useMemo(() =>
    calcCosts(majetnosc, spending, assets, lokum, lokumOwnership, lokum2, lokum2 ? lokum2Ownership : null, transport, lifestyle),
    [majetnosc, spending, assets, lokum, lokumOwnership, lokum2, lokum2Ownership, transport, lifestyle]
  )

  const rating = calcStarRating(lokum.starPoints, transport.starPoints, lifestyle.starPoints, hasLokum2)
  const stars = starString(rating)

  // ── Equipment budget ──
  const equipBudget = costs.assetsRemaining + cash
  const totalSpent = useMemo(() => {
    let total = 0
    for (const item of selectedItems) {
      // Parse price from tag format: "[Broń] Rewolwer .38 ($25)"
      const priceMatch = item.match(/\(\$?([\d,.]+)\)/)
      if (priceMatch) total += parseFloat(priceMatch[1].replace(',', '.'))
    }
    return total
  }, [selectedItems])

  const overBudget = totalSpent > equipBudget

  // ── Asset forms ──
  const perFormValue = selectedFormIds.length > 0 ? costs.assetsRemaining / selectedFormIds.length : 0

  // ── Apply preset ──
  const applyPreset = (preset: Preset) => {
    setLokumId(preset.lokumId)
    setLokumOwnership(preset.lokumOwnership)
    setHasLokum2(!!preset.lokum2Id)
    setLokum2Id(preset.lokum2Id ?? '')
    setLokum2Ownership(preset.lokum2Ownership as 'rent' | 'own' ?? 'rent')
    setTransportStyleId(preset.transportId)
    setLifestyleId(preset.lifestyleId)
    setPresetUsed(preset.id)
    setMode('custom')
  }

  // ── Add equipment item ──
  const addItem = (name: string, price: number, tag: string) => {
    setSelectedItems((prev) => [...prev, `${tag} ${name} (${formatDollars(price)})`])
  }

  const removeItem = (index: number) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index))
  }

  // Group duplicate items for display: "Item x3" instead of 3 separate entries
  const groupedItems = (() => {
    const counts = new Map<string, number>()
    for (const item of selectedItems) {
      counts.set(item, (counts.get(item) ?? 0) + 1)
    }
    return Array.from(counts.entries()).map(([item, count]) => ({
      item,
      count,
      label: count > 1 ? `${item} [x${count}]` : item,
    }))
  })()

  // ── Save & Next ──
  const handleNext = () => {
    const assetBreakdown = selectedFormIds.map((id) => {
      const form = ASSET_FORMS.find((f) => f.id === id)
      return { type: form?.label ?? id, percent: Math.round(100 / selectedFormIds.length), value: Math.round(perFormValue) }
    })

    // Build tagged equipment array
    const allEquipment = [
      `[Lokum] ${lokum.label} (${lokumOwnership === 'own' ? 'własność' : 'wynajem'})`,
      ...(hasLokum2 && lokum2 ? [`[Lokum] ${lokum2.label} (${lokum2Ownership === 'own' ? 'własność, dodatkowy' : 'wynajem, dodatkowy'})`] : []),
      `[Transport] ${transport.label}`,
      `[Lifestyle] ${stars} ${lifestyle.label}`,
      ...groupedItems.map(({ label }) => label),
      ...customItems.filter(Boolean).map((item) => `[Ekwipunek] ${item}`),
      ...assetBreakdown.map((a) => `[Dobytek] ${a.type}: ${formatDollars(a.value)}`),
    ]

    const cashRemaining = Math.max(0, cash - Math.max(0, totalSpent - costs.assetsRemaining))

    store.setEquipment(allEquipment)
    store.setCustomItems(customItems)
    store.setLifestyle({
      housingId: lokumId,
      transportId: transportStyleId,
      lifestyleId,
      wealthFormIds: selectedFormIds,
      cashOnHand: cashRemaining,
      cash: formatDollars(cashRemaining),
      assets: formatDollars(costs.assetsRemaining),
      spendingLevel: formatDollars(spending),
      lokumOwnership,
      lokum2Id: hasLokum2 ? lokum2Id : '',
      lokum2Ownership: hasLokum2 ? lokum2Ownership : '',
      transportStyleId,
      assetBreakdown,
      lifestyleRating: rating,
      lifestyleStars: stars,
      lifestyleLabel: lifestyle.label,
      spendingFree: `${formatDollars(costs.spendingFree)} / dzień`,
      catalogsAvailable: ['standard', ...(hasBlackMarket ? ['black_market'] : []), ...(hasMilitary ? ['military'] : [])],
      presetUsed,
    })
    store.nextStep()
  }

  return (
    <Card title="Majątek i ekwipunek">
      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-2 mb-4 text-center">
        <div className="bg-coc-surface-light rounded-lg p-2">
          <div className="text-[10px] text-coc-text-muted uppercase">Tier</div>
          <div className="font-bold">{tier.label}</div>
        </div>
        <div className="bg-coc-surface-light rounded-lg p-2">
          <div className="text-[10px] text-coc-text-muted uppercase">Wydatki / dzień</div>
          <div className="font-mono font-bold">{formatDollars(spending)}</div>
        </div>
        <div className="bg-coc-surface-light rounded-lg p-2">
          <div className="text-[10px] text-coc-text-muted uppercase">Dobytek</div>
          <div className="font-mono font-bold">{formatDollars(costs.assetsRemaining)}</div>
        </div>
        <div className="bg-coc-surface-light rounded-lg p-2">
          <div className="text-[10px] text-coc-text-muted uppercase">Gotówka</div>
          <div className="font-mono font-bold">{formatDollars(cash)}</div>
        </div>
      </div>

      {/* Presets */}
      {mode === 'presets' && (
        <div className="space-y-3 mb-6">
          <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider">Wybierz styl życia</h4>
          <div className="grid grid-cols-3 gap-3">
            {presets.map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p)}
                className="text-left p-3 rounded-lg border border-coc-border hover:border-coc-accent-light bg-coc-surface-light transition-colors cursor-pointer"
              >
                <div className="text-lg mb-1">{p.stars}</div>
                <div className="font-medium text-sm">{p.label}</div>
                <div className="text-xs text-coc-text-muted">{p.ratingLabel}</div>
                <div className="text-xs text-coc-text-muted mt-1">
                  Wolne: {formatDollars(p.spendingFree)}/dzień
                </div>
                <div className="text-xs text-coc-text-muted">
                  Dobytek: {formatDollars(p.assetsRemaining)}
                </div>
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => setMode('custom')}
            className="bg-green-600/20 text-green-400 border border-green-600/40 hover:bg-green-600/30">
            Sam rozdziel majątek
          </Button>
        </div>
      )}

      {/* Custom editor */}
      {mode === 'custom' && (
        <div className="space-y-4 mb-6">
          {/* Star rating display */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg">{stars}</span>
              <span className="text-sm text-coc-text-muted ml-2">{ratingLabel(rating)}</span>
            </div>
            <Badge variant={costs.spendingFree >= 2 ? 'success' : costs.spendingFree >= 0 ? 'warning' : 'danger'}>
              Wolne: {formatDollars(costs.spendingFree)} / dzień
            </Badge>
          </div>

          {/* Lokum */}
          <section>
            <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider mb-2">Miejsce zamieszkania</h4>
            <div className="space-y-1">
              {LOKUM_OPTIONS.filter((l) => {
                const lt = TIERS.find((t) => t.id === l.tierId)!
                return lt.min <= majetnosc + 20
              }).map((l) => {
                const purchaseCost = (l.purchaseMin + l.purchaseMax) / 2
                const canAffordOwn = purchaseCost <= assets
                return (
                  <div key={l.id} className={`px-3 py-2 rounded-lg text-sm ${lokumId === l.id ? 'bg-coc-accent/10 border border-coc-accent/30' : 'border border-transparent hover:bg-coc-surface-light'}`}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="lokum" value={l.id} checked={lokumId === l.id}
                        onChange={() => { setLokumId(l.id); if (!l.canOwn) setLokumOwnership('rent'); if (!l.canRent && l.canOwn) setLokumOwnership('own') }}
                        className="accent-coc-accent" />
                      <span className="flex-1 font-medium">{l.label}</span>
                    </label>
                    {lokumId === l.id && (l.canRent || l.canOwn) && (
                      <div className="flex gap-3 mt-1.5 ml-6">
                        {l.canRent && (
                          <label className={`text-xs cursor-pointer px-2 py-0.5 rounded ${lokumOwnership === 'rent' ? 'bg-coc-accent/20 text-coc-accent-light' : 'text-coc-text-muted'}`}>
                            <input type="radio" checked={lokumOwnership === 'rent'} onChange={() => setLokumOwnership('rent')} className="hidden" />
                            Wynajem ({formatDollars(l.rentalPerDay)}/dzień)
                          </label>
                        )}
                        {l.canOwn && (
                          <label className={`text-xs px-2 py-0.5 rounded ${!canAffordOwn ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${lokumOwnership === 'own' && canAffordOwn ? 'bg-coc-accent/20 text-coc-accent-light' : 'text-coc-text-muted'}`}>
                            <input type="radio" checked={lokumOwnership === 'own'} onChange={() => canAffordOwn && setLokumOwnership('own')} disabled={!canAffordOwn} className="hidden" />
                            Własność ({formatDollars(purchaseCost)} z dobytku)
                            {!canAffordOwn && <span className="ml-1 text-red-400">(za drogo)</span>}
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Drugie lokum */}
            <div className={`mt-3 p-2 rounded-lg border ${hasLokum2 ? 'border-coc-accent/30 bg-coc-accent/5' : 'border-coc-border'}`}>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={hasLokum2} onChange={(e) => { setHasLokum2(e.target.checked); if (!e.target.checked) setLokum2Id('') }}
                  className="accent-coc-accent" />
                <span className="font-medium">Posiadam drugie lokum / miejsce</span>
              </label>
              {hasLokum2 && (
                <div className="mt-2 space-y-1 ml-6">
                  {LOKUM_OPTIONS.filter((l) => l.id !== 'homeless' && l.id !== lokumId).filter((l) => {
                    const lt = TIERS.find((t) => t.id === l.tierId)!
                    return lt.min <= majetnosc + 20
                  }).map((l) => {
                    const purchaseCost2 = (l.purchaseMin + l.purchaseMax) / 2
                    const alreadySpent = lokumOwnership === 'own' ? (lokum.purchaseMin + lokum.purchaseMax) / 2 : 0
                    const canAffordOwn2 = purchaseCost2 + alreadySpent <= assets
                    return (
                      <div key={l.id} className={`px-3 py-1.5 rounded text-sm ${lokum2Id === l.id ? 'bg-coc-accent/10 border border-coc-accent/30' : 'border border-transparent hover:bg-coc-surface-light'}`}>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="lokum2" value={l.id} checked={lokum2Id === l.id}
                            onChange={() => { setLokum2Id(l.id); if (!l.canOwn) setLokum2Ownership('rent'); if (!l.canRent && l.canOwn) setLokum2Ownership('own') }}
                            className="accent-coc-accent" />
                          <span className="flex-1">{l.label}</span>
                        </label>
                        {lokum2Id === l.id && (l.canRent || l.canOwn) && (
                          <div className="flex gap-3 mt-1 ml-6">
                            {l.canRent && (
                              <label className={`text-xs cursor-pointer px-2 py-0.5 rounded ${lokum2Ownership === 'rent' ? 'bg-coc-accent/20 text-coc-accent-light' : 'text-coc-text-muted'}`}>
                                <input type="radio" checked={lokum2Ownership === 'rent'} onChange={() => setLokum2Ownership('rent')} className="hidden" />
                                Wynajem
                              </label>
                            )}
                            {l.canOwn && (
                              <label className={`text-xs px-2 py-0.5 rounded ${!canAffordOwn2 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${lokum2Ownership === 'own' && canAffordOwn2 ? 'bg-coc-accent/20 text-coc-accent-light' : 'text-coc-text-muted'}`}>
                                <input type="radio" checked={lokum2Ownership === 'own'} onChange={() => canAffordOwn2 && setLokum2Ownership('own')} disabled={!canAffordOwn2} className="hidden" />
                                Własność ({formatDollars(purchaseCost2)})
                              </label>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Transport style */}
          <section>
            <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider mb-2">Styl transportu</h4>
            <div className="space-y-1">
              {TRANSPORT_STYLES.map((t) => (
                <label key={t.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm cursor-pointer hover:bg-coc-surface-light ${transportStyleId === t.id ? 'bg-coc-accent/10 border border-coc-accent/30' : 'border border-transparent'}`}>
                  <input type="radio" name="transport" value={t.id} checked={transportStyleId === t.id}
                    onChange={() => setTransportStyleId(t.id)} className="accent-coc-accent" />
                  <span className="flex-1">{t.label}</span>
                  {t.dailyCost > 0 && <span className="text-xs text-coc-text-muted">-{formatDollars(t.dailyCost)}/dzień</span>}
                </label>
              ))}
            </div>
          </section>

          {/* Lifestyle */}
          <section>
            <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider mb-2">Styl życia</h4>
            <div className="space-y-1">
              {LIFESTYLE_LEVELS.map((l) => (
                <label key={l.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm cursor-pointer hover:bg-coc-surface-light ${lifestyleId === l.id ? 'bg-coc-accent/10 border border-coc-accent/30' : 'border border-transparent'}`}>
                  <input type="radio" name="lifestyle" value={l.id} checked={lifestyleId === l.id}
                    onChange={() => setLifestyleId(l.id)} className="accent-coc-accent" />
                  <span className="flex-1">
                    <span className="font-medium">{l.label}</span>
                    <span className="text-xs text-coc-text-muted ml-2">{l.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* Cost breakdown */}
          <div className="bg-coc-surface-light rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-coc-text-muted">Lokum:</span><span className="font-mono">-{formatDollars(costs.lokumDaily)}/dzień</span></div>
            {costs.lokum2Daily > 0 && <div className="flex justify-between"><span className="text-coc-text-muted">Drugie lokum:</span><span className="font-mono">-{formatDollars(costs.lokum2Daily)}/dzień</span></div>}
            {costs.transportDaily > 0 && <div className="flex justify-between"><span className="text-coc-text-muted">Transport:</span><span className="font-mono">-{formatDollars(costs.transportDaily)}/dzień</span></div>}
            {costs.lifestyleDaily > 0 && <div className="flex justify-between"><span className="text-coc-text-muted">Lifestyle (upgrade):</span><span className="font-mono">-{formatDollars(costs.lifestyleDaily)}/dzień</span></div>}
            <div className="border-t border-coc-border pt-1 flex justify-between font-medium">
              <span>Wolne wydatki:</span>
              <span className={`font-mono ${costs.spendingFree >= 2 ? 'text-green-500' : costs.spendingFree >= 0 ? 'text-yellow-500' : 'text-red-500'}`}>
                {formatDollars(costs.spendingFree)} / dzień
              </span>
            </div>
            <div className="flex justify-between"><span className="text-coc-text-muted">Dobytek po zakupach:</span><span className="font-mono">{formatDollars(costs.assetsRemaining)}</span></div>
          </div>

          {costs.spendingFree < 0 && (
            <p className="text-sm text-coc-danger">Nie stać cię na te wybory. Zmień lokum, transport lub styl życia.</p>
          )}
        </div>
      )}

      {/* Asset forms */}
      {mode === 'custom' && costs.assetsRemaining > 0 && (
        <section className="mb-6">
          <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider mb-2">Podział dobytku</h4>
          <p className="text-xs text-coc-text-muted mb-2">
            Pozostały dobytek ({formatDollars(costs.assetsRemaining)}) dzielony równo między wybrane formy.
          </p>
          <div className="space-y-1">
            {ASSET_FORMS.map((form) => {
              const disabled = costs.assetsRemaining < form.minAssets
              return (
                <label key={form.id} className={`flex items-center gap-2 text-sm px-2 py-1 rounded ${disabled ? 'opacity-40' : 'cursor-pointer hover:bg-coc-surface-light'}`}>
                  <input type="checkbox" disabled={disabled}
                    checked={selectedFormIds.includes(form.id)}
                    onChange={(e) => setSelectedFormIds(e.target.checked
                      ? [...selectedFormIds, form.id]
                      : selectedFormIds.filter((id) => id !== form.id)
                    )} className="accent-coc-accent" />
                  <span className="flex-1">{form.label}</span>
                  {selectedFormIds.includes(form.id) && (
                    <span className="text-xs font-mono text-coc-text-muted">{formatDollars(perFormValue)}</span>
                  )}
                </label>
              )
            })}
          </div>
        </section>
      )}

      {/* Equipment catalog */}
      {mode === 'custom' && (
        <section className="mb-6">
          <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider mb-2">
            Ekwipunek
            <span className="ml-2"><Badge variant={overBudget ? 'danger' : 'success'}>
              {formatDollars(totalSpent)} / {formatDollars(equipBudget)}
            </Badge></span>
          </h4>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-coc-text-muted" />
            <input
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj przedmiotów..."
              className="w-full pl-9 pr-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light"
            />
          </div>

          {/* Categories */}
          {Object.entries(EQUIPMENT_CATEGORY_LABELS).map(([catId, catLabel]) => {
            const items = equipmentCatalog.filter((i) => i.category === catId)
            const filtered = searchQuery
              ? items.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
              : items
            if (filtered.length === 0) return null
            const isExpanded = expandedCat === catId || !!searchQuery
            return (
              <div key={catId} className="mb-2">
                <button
                  onClick={() => setExpandedCat(expandedCat === catId ? null : catId)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-sm font-medium text-coc-text-muted hover:text-coc-text rounded-lg hover:bg-coc-surface-light cursor-pointer"
                >
                  <span>{catLabel} ({filtered.length})</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {isExpanded && (
                  <div className="space-y-0.5 mt-1">
                    {filtered.map((item) => (
                      <div key={item.id} className="flex items-center justify-between px-3 py-1 text-sm hover:bg-coc-surface-light rounded">
                        <span>{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-coc-text-muted">{formatDollars(item.price)}</span>
                          <button onClick={() => addItem(item.name, item.price, '[Ekwipunek]')}
                            className="text-xs px-2 py-0.5 bg-coc-accent/20 text-coc-accent-light rounded cursor-pointer hover:bg-coc-accent/30">+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* Weapons */}
          <div className="mb-2">
            <button
              onClick={() => setExpandedCat(expandedCat === 'weapons' ? null : 'weapons')}
              className="w-full flex items-center justify-between px-3 py-1.5 text-sm font-medium text-coc-text-muted hover:text-coc-text rounded-lg hover:bg-coc-surface-light cursor-pointer"
            >
              <span>Broń ({WEAPONS_CATALOG_V2.length})</span>
              {expandedCat === 'weapons' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {(expandedCat === 'weapons' || (searchQuery && WEAPONS_CATALOG_V2.some((w) => w.name.toLowerCase().includes(searchQuery.toLowerCase())))) && (
              <div className="space-y-0.5 mt-1">
                {WEAPONS_CATALOG_V2.filter((w) => !searchQuery || w.name.toLowerCase().includes(searchQuery.toLowerCase())).map((w) => (
                  <div key={w.id} className="flex items-center justify-between px-3 py-1 text-sm hover:bg-coc-surface-light rounded">
                    <span>{w.name} <span className="text-xs text-coc-text-muted">({w.damage}, {w.range})</span></span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-coc-text-muted">{formatDollars(w.price)}</span>
                      <button onClick={() => addItem(`${w.name} (${w.damage}, ${w.range})`, w.price, '[Broń]')}
                        className="text-xs px-2 py-0.5 bg-coc-accent/20 text-coc-accent-light rounded cursor-pointer hover:bg-coc-accent/30">+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ammo */}
          <div className="mb-2">
            <button
              onClick={() => setExpandedCat(expandedCat === 'ammo' ? null : 'ammo')}
              className="w-full flex items-center justify-between px-3 py-1.5 text-sm font-medium text-coc-text-muted hover:text-coc-text rounded-lg hover:bg-coc-surface-light cursor-pointer"
            >
              <span>Amunicja ({AMMO_CATALOG.length})</span>
              {expandedCat === 'ammo' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {(expandedCat === 'ammo' || (searchQuery && AMMO_CATALOG.some((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase())))) && (
              <div className="space-y-0.5 mt-1">
                {AMMO_CATALOG.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-3 py-1 text-sm hover:bg-coc-surface-light rounded">
                    <span>{a.name} <span className="text-xs text-coc-text-muted">({a.quantity} szt.)</span></span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-coc-text-muted">{formatDollars(a.price)}</span>
                      <button onClick={() => addItem(`${a.name} (${a.quantity} szt.)`, a.price, '[Ekwipunek]')}
                        className="text-xs px-2 py-0.5 bg-coc-accent/20 text-coc-accent-light rounded cursor-pointer hover:bg-coc-accent/30">+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Black market */}
          {hasBlackMarket && (
            <div className="mb-2">
              <button onClick={() => setExpandedCat(expandedCat === 'black_market' ? null : 'black_market')}
                className="w-full flex items-center justify-between px-3 py-1.5 text-sm font-medium text-red-400 hover:text-red-300 rounded-lg hover:bg-coc-surface-light cursor-pointer">
                <span>Czarny rynek ({BLACK_MARKET_CATALOG.length})</span>
                {expandedCat === 'black_market' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {expandedCat === 'black_market' && (
                <div className="space-y-0.5 mt-1">
                  {BLACK_MARKET_CATALOG.map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-3 py-1 text-sm hover:bg-coc-surface-light rounded">
                      <span>{item.name} <span className="text-xs text-coc-text-muted">{item.description}</span></span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-coc-text-muted">{formatDollars((item.priceMin + item.priceMax) / 2)}</span>
                        <button onClick={() => addItem(item.name, (item.priceMin + item.priceMax) / 2, '[Czarny rynek]')}
                          className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded cursor-pointer hover:bg-red-500/30">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Military gear */}
          {hasMilitary && (
            <div className="mb-2">
              <button onClick={() => setExpandedCat(expandedCat === 'military' ? null : 'military')}
                className="w-full flex items-center justify-between px-3 py-1.5 text-sm font-medium text-green-400 hover:text-green-300 rounded-lg hover:bg-coc-surface-light cursor-pointer">
                <span>Sprzęt wojskowy ({MILITARY_CATALOG.length})</span>
                {expandedCat === 'military' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {expandedCat === 'military' && (
                <div className="space-y-0.5 mt-1">
                  {MILITARY_CATALOG.map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-3 py-1 text-sm hover:bg-coc-surface-light rounded">
                      <span>{item.name} {item.description && <span className="text-xs text-coc-text-muted">({item.description})</span>}</span>
                      <div className="flex items-center gap-2">
                        {item.fromService
                          ? <span className="text-xs text-green-400">z wyposażenia</span>
                          : <span className="text-xs font-mono text-coc-text-muted">{formatDollars(item.price)}</span>
                        }
                        <button onClick={() => addItem(item.name, item.fromService ? 0 : item.price, '[Wojsko]')}
                          className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded cursor-pointer hover:bg-green-500/30">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Custom item */}
          <div className="mt-3">
            <input
              placeholder="Dodaj własny przedmiot..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
                  setCustomItems([...customItems, (e.target as HTMLInputElement).value]);
                  (e.target as HTMLInputElement).value = ''
                }
              }}
              className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light"
            />
          </div>

          {/* Selected items */}
          {(selectedItems.length > 0 || customItems.length > 0) && (
            <div className="mt-3 space-y-0.5">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="w-4 h-4 text-coc-text-muted" />
                <span className="text-sm font-medium text-coc-text-muted">Koszyk ({selectedItems.length + customItems.length})</span>
              </div>
              {groupedItems.map(({ item, count, label }) => (
                <div key={item} className="flex items-center justify-between text-sm px-2 py-0.5 bg-coc-surface-light rounded">
                  <span className="truncate">{label}</span>
                  <button onClick={() => {
                    // Remove one instance of this item
                    const idx = selectedItems.indexOf(item)
                    if (idx >= 0) removeItem(idx)
                  }} className="text-coc-danger text-xs ml-2 cursor-pointer">{count > 1 ? `−1` : '×'}</button>
                </div>
              ))}
              {customItems.map((item, i) => (
                <div key={`c${i}`} className="flex items-center justify-between text-sm px-2 py-0.5 bg-coc-surface-light rounded">
                  <span className="truncate">[Ekwipunek] {item}</span>
                  <button onClick={() => setCustomItems(customItems.filter((_, j) => j !== i))} className="text-coc-danger text-xs ml-2 cursor-pointer">×</button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="secondary" onClick={() => store.prevStep()}>Wstecz</Button>
        <Button onClick={handleNext} disabled={costs.spendingFree < 0 || overBudget || costs.assetsPurchase > assets || (mode === 'presets')}>
          Dalej
        </Button>
      </div>
    </Card>
  )
}
