import { useState, useMemo } from 'react'
import { Plus, Trash2, Search, Home, Car, Sparkles, Wallet, Landmark } from 'lucide-react'
import { useCharacterStore } from '@/stores/characterStore'
import { getEquipmentByCategory } from '@/data/equipment'
import { getWeaponsForEra, type Weapon } from '@/data/weapons'
import {
  getWealthBracket, calculateWealth, formatCurrency, WEALTH_FORMS,
  type HousingOption, type TransportOption, type LifestyleOption,
} from '@/data/eras'
import { getSkillById } from '@/data/skills'
import type { Era } from '@/types/common'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

function parsePriceToNumber(price: string): number {
  const cleaned = price.replace(/[^0-9,.]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

export function StepEquipment() {
  const store = useCharacterStore()
  const era = store.era as Era
  const creditRating = (store.occupationSkillPoints['majetnosc'] ?? 0) +
    (typeof getSkillById('majetnosc')?.base === 'number' ? (getSkillById('majetnosc')?.base as number) : 0)

  const bracket = getWealthBracket(era, creditRating)
  const wealth = calculateWealth(era, creditRating)
  const wealthForms = WEALTH_FORMS[era]

  // Lifestyle choices
  const [housingId, setHousingId] = useState(store.housingId || bracket.housingOptions[0]?.id || '')
  const [transportId, setTransportId] = useState(store.transportId || bracket.transportOptions[0]?.id || '')
  const [lifestyleId, setLifestyleId] = useState(store.lifestyleId || bracket.lifestyleOptions[0]?.id || '')
  const [wealthFormIds, setWealthFormIds] = useState<string[]>(
    store.wealthFormIds.length > 0 ? store.wealthFormIds : (wealthForms[0] ? [wealthForms[0].id] : [])
  )

  const selectedHousing = bracket.housingOptions.find((h) => h.id === housingId) ?? bracket.housingOptions[0]
  const selectedTransport = bracket.transportOptions.find((t) => t.id === transportId) ?? bracket.transportOptions[0]
  const selectedLifestyle = bracket.lifestyleOptions.find((l) => l.id === lifestyleId) ?? bracket.lifestyleOptions[0]

  // Budget calculations — percentage-based from initial values
  const baseAssets = wealth.assets
  const baseCash = wealth.cash

  const housingCostAssets = baseAssets * (selectedHousing.assetReductionPct / 100)
  const housingCostCash = baseCash * (selectedHousing.cashReductionPct / 100)

  const lifestyleCostAssets = baseAssets * (selectedLifestyle.assetReductionPct / 100)
  const lifestyleCostCash = baseCash * (selectedLifestyle.cashReductionPct / 100)

  const assetsAfterHL = Math.max(0, baseAssets - housingCostAssets - lifestyleCostAssets)

  const transportCost = selectedTransport.free ? 0 : selectedTransport.cost

  const remainingAssets = Math.max(0, assetsAfterHL - transportCost)
  const remainingCash = Math.max(0, baseCash - housingCostCash - lifestyleCostCash)

  // Equipment
  const [selectedItems, setSelectedItems] = useState<string[]>(store.equipment)
  const [customItems, setCustomItems] = useState<string[]>(store.customItems)
  const [newCustomItem, setNewCustomItem] = useState('')
  const [search, setSearch] = useState('')
  const [showWeapons, setShowWeapons] = useState(false)

  const equipmentByCategory = useMemo(() => getEquipmentByCategory(era), [era])
  const weapons = useMemo(() => getWeaponsForEra(era), [era])

  // Equipment spending — first from assets, then from cash
  const totalSpent = useMemo(() => {
    let sum = 0
    for (const category of Object.values(equipmentByCategory)) {
      for (const item of category) {
        const count = selectedItems.filter((name) => name === item.name).length
        if (count > 0) {
          sum += parsePriceToNumber(item.price) * count
        }
      }
    }
    return sum
  }, [selectedItems, equipmentByCategory])

  const totalBudget = remainingAssets + remainingCash
  const spentFromAssets = Math.min(totalSpent, remainingAssets)
  const spentFromCash = Math.max(0, totalSpent - remainingAssets)
  const wealthFormAmount = Math.max(0, remainingAssets - spentFromAssets)
  const cashOnHand = Math.max(0, remainingCash - spentFromCash)
  const overBudget = totalSpent > totalBudget

  const toggleWealthForm = (id: string) => {
    setWealthFormIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    )
  }

  const addItem = (itemName: string) => setSelectedItems((prev) => [...prev, itemName])
  const removeItem = (index: number) => setSelectedItems((prev) => prev.filter((_, i) => i !== index))
  const addCustomItem = () => {
    if (newCustomItem.trim()) {
      setCustomItems((prev) => [...prev, newCustomItem.trim()])
      setNewCustomItem('')
    }
  }
  const removeCustomItem = (index: number) => setCustomItems((prev) => prev.filter((_, i) => i !== index))
  const addWeapon = (weapon: Weapon) => setSelectedItems((prev) => [...prev, `${weapon.name} (${weapon.damage}, ${weapon.range})`])

  // Auto-reset transport if it became too expensive after housing/lifestyle change
  const isTransportAffordable = (opt: TransportOption) => opt.free || opt.cost <= assetsAfterHL
  if (!isTransportAffordable(selectedTransport)) {
    const fallback = bracket.transportOptions.find(isTransportAffordable)
    if (fallback && fallback.id !== transportId) {
      setTransportId(fallback.id)
    }
  }

  const handleNext = () => {
    store.setEquipment(selectedItems)
    store.setCustomItems(customItems)
    store.setLifestyle({
      housingId,
      transportId,
      lifestyleId,
      wealthFormIds,
      cashOnHand,
      cash: formatCurrency(era, cashOnHand),
      assets: formatCurrency(era, wealthFormAmount),
      spendingLevel: formatCurrency(era, wealth.spending) + '/tydz.',
    })
    store.nextStep()
  }

  const curr = (n: number) => formatCurrency(era, n)

  return (
    <Card title="Ekwipunek i dobytek">
      {/* === BUDGET SUMMARY (top, always visible) === */}
      <div className="bg-coc-accent/10 border border-coc-accent/20 rounded-lg p-3 mb-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-coc-text-muted">Majętność:</span>
            <span className="font-mono font-medium">{creditRating}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-coc-text-muted">Bracket:</span>
            <span className="font-medium">{bracket.label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-coc-text-muted">Dobytek:</span>
            <span className="font-mono">{curr(baseAssets)} <span className="text-coc-text-muted">&rarr;</span> <span className={remainingAssets > 0 ? 'text-green-500' : 'text-red-400'}>{curr(remainingAssets)}</span></span>
          </div>
          <div className="flex justify-between">
            <span className="text-coc-text-muted">Gotówka:</span>
            <span className="font-mono">{curr(baseCash)} <span className="text-coc-text-muted">&rarr;</span> <span className={remainingCash > 0 ? 'text-green-500' : 'text-red-400'}>{curr(remainingCash)}</span></span>
          </div>
          <div className="flex justify-between">
            <span className="text-coc-text-muted">Wydatki:</span>
            <span className="font-mono">{curr(wealth.spending)}/tydz.</span>
          </div>
          <div className="flex justify-between">
            <span className="text-coc-text-muted">Ekwipunek:</span>
            <Badge variant={overBudget ? 'danger' : 'success'}>
              {curr(totalSpent)} / {curr(totalBudget)}
            </Badge>
          </div>
        </div>
        {totalSpent > 0 && (
          <p className="text-xs text-coc-text-muted mt-1">
            Z dobytku: {curr(spentFromAssets)}
            {spentFromCash > 0 && <> | Z gotówki: {curr(spentFromCash)}</>}
          </p>
        )}
        {overBudget && (
          <p className="text-xs text-red-400 mt-1">Przekroczono budżet!</p>
        )}
      </div>

      {/* === HOUSING === */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Home className="w-4 h-4 text-coc-accent-light" />
          <h4 className="text-sm font-medium">Mieszkanie</h4>
        </div>
        <div className="space-y-1.5">
          {bracket.housingOptions.map((opt: HousingOption) => {
            const assetCost = baseAssets * (opt.assetReductionPct / 100)
            const cashCost = baseCash * (opt.cashReductionPct / 100)
            return (
              <label
                key={opt.id}
                className={`flex items-start gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                  housingId === opt.id
                    ? 'border-coc-accent bg-coc-accent/10'
                    : 'border-coc-border hover:border-coc-accent/50'
                }`}
              >
                <input
                  type="radio"
                  name="housing"
                  value={opt.id}
                  checked={housingId === opt.id}
                  onChange={() => setHousingId(opt.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{opt.label}</span>
                    <Badge variant={opt.ownership === 'own' ? 'success' : opt.ownership === 'rent' ? 'default' : 'warning'}>
                      {opt.ownership === 'own' ? 'własność' : opt.ownership === 'rent' ? 'wynajem' : 'bezpłatne'}
                    </Badge>
                    {(opt.assetReductionPct > 0 || opt.cashReductionPct > 0) && (
                      <span className="text-xs text-coc-text-muted ml-auto">
                        {opt.assetReductionPct > 0 && `−${opt.assetReductionPct}% dobytek (${curr(assetCost)})`}
                        {opt.assetReductionPct > 0 && opt.cashReductionPct > 0 && ' | '}
                        {opt.cashReductionPct > 0 && `−${opt.cashReductionPct}% gotówka (${curr(cashCost)})`}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-coc-text-muted">{opt.description}</p>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      {/* === LIFESTYLE === */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-coc-accent-light" />
          <h4 className="text-sm font-medium">Styl życia</h4>
        </div>
        <div className="space-y-1.5">
          {bracket.lifestyleOptions.map((opt: LifestyleOption, i: number) => {
            const isFree = i === 0
            const assetCost = baseAssets * (opt.assetReductionPct / 100)
            return (
              <label
                key={opt.id}
                className={`flex items-start gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                  lifestyleId === opt.id
                    ? 'border-coc-accent bg-coc-accent/10'
                    : 'border-coc-border hover:border-coc-accent/50'
                }`}
              >
                <input
                  type="radio"
                  name="lifestyle"
                  value={opt.id}
                  checked={lifestyleId === opt.id}
                  onChange={() => setLifestyleId(opt.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{opt.label}</span>
                    {isFree ? (
                      <Badge variant="success">darmowe</Badge>
                    ) : (
                      <span className="text-xs text-coc-text-muted ml-auto">
                        −{opt.assetReductionPct}% dobytek ({curr(assetCost)})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-coc-text-muted">
                    {opt.description}
                    {opt.servants && ` — ${opt.servants}`}
                  </p>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      {/* === TRANSPORT (with budget validation) === */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Car className="w-4 h-4 text-coc-accent-light" />
          <h4 className="text-sm font-medium">Transport</h4>
        </div>
        <div className="space-y-1.5">
          {bracket.transportOptions.map((opt: TransportOption) => {
            const tooExpensive = !opt.free && opt.cost > assetsAfterHL
            return (
              <label
                key={opt.id}
                className={`flex items-start gap-3 p-2 rounded-lg border transition-colors ${
                  tooExpensive
                    ? 'border-coc-border/50 opacity-50 cursor-not-allowed'
                    : transportId === opt.id
                      ? 'border-coc-accent bg-coc-accent/10 cursor-pointer'
                      : 'border-coc-border hover:border-coc-accent/50 cursor-pointer'
                }`}
              >
                <input
                  type="radio"
                  name="transport"
                  value={opt.id}
                  checked={transportId === opt.id}
                  onChange={() => !tooExpensive && setTransportId(opt.id)}
                  disabled={tooExpensive}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{opt.label}</span>
                    {opt.free ? (
                      <Badge variant="warning">darmowe</Badge>
                    ) : tooExpensive ? (
                      <span className="text-xs text-red-400 ml-auto">{curr(opt.cost)} — za drogie</span>
                    ) : (
                      <span className="text-xs text-coc-text-muted ml-auto">−{curr(opt.cost)} z dobytku</span>
                    )}
                  </div>
                  <p className="text-xs text-coc-text-muted">{opt.description}</p>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      {/* === WEALTH FORM (checkboxes) === */}
      {wealthFormAmount > 0 && (
        <div className="mb-4 border border-coc-border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-coc-accent-light" />
              <h4 className="text-sm font-medium">Forma dobytku</h4>
            </div>
            <Badge variant="success">{curr(wealthFormAmount)}</Badge>
          </div>
          <p className="text-xs text-coc-text-muted mb-2">
            Gdzie przechowujesz dobytek? Kwota dzielona równo na wybrane formy.
          </p>
          <div className="space-y-1.5">
            {wealthForms.map((form) => {
              const isSelected = wealthFormIds.includes(form.id)
              const perFormAmount = isSelected && wealthFormIds.length > 0
                ? wealthFormAmount / wealthFormIds.length
                : 0
              return (
                <label
                  key={form.id}
                  className={`flex items-start gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-coc-accent bg-coc-accent/10'
                      : 'border-coc-border hover:border-coc-accent/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleWealthForm(form.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{form.label}</span>
                      {isSelected && (
                        <span className="text-xs text-coc-accent-light ml-auto">{curr(perFormAmount)}</span>
                      )}
                    </div>
                    <p className="text-xs text-coc-text-muted">{form.description}</p>
                  </div>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* === CASH ON HAND === */}
      <div className="mb-4 bg-coc-surface-light/50 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-coc-accent-light" />
          <div>
            <div className="text-xs text-coc-text-muted">Gotówka na ręce (po zakupach)</div>
            <div className="font-mono font-bold">{curr(cashOnHand)}</div>
          </div>
        </div>
      </div>

      {/* === EQUIPMENT CATALOG === */}
      <div className="border-t border-coc-border pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium">Ekwipunek</h4>
          <Badge variant={overBudget ? 'danger' : 'success'}>
            Wydano: {curr(totalSpent)} / {curr(totalBudget)}
            {overBudget && ' — Przekroczono!'}
          </Badge>
        </div>

        {/* Selected items */}
        <div className="mb-4">
          <h4 className="text-xs font-medium text-coc-text-muted mb-1">
            Wybrany ekwipunek ({selectedItems.length + customItems.length})
          </h4>
          {selectedItems.length === 0 && customItems.length === 0 && (
            <p className="text-sm text-coc-text-muted">Brak wybranych przedmiotów.</p>
          )}
          <div className="space-y-1">
            {selectedItems.map((item, i) => (
              <div key={`item-${i}`} className="flex items-center justify-between py-1 px-2 bg-coc-surface-light rounded text-sm">
                <span>{item}</span>
                <button type="button" onClick={() => removeItem(i)} className="text-coc-text-muted hover:text-coc-danger cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {customItems.map((item, i) => (
              <div key={`custom-${i}`} className="flex items-center justify-between py-1 px-2 bg-coc-surface-light rounded text-sm">
                <span>{item} <Badge>własny</Badge></span>
                <button type="button" onClick={() => removeCustomItem(i)} className="text-coc-text-muted hover:text-coc-danger cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Custom item input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newCustomItem}
            onChange={(e) => setNewCustomItem(e.target.value)}
            placeholder="Własny przedmiot..."
            className="flex-1 px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light transition-colors text-sm"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomItem())}
          />
          <Button size="sm" onClick={addCustomItem} disabled={!newCustomItem.trim()}>
            <Plus className="w-4 h-4" /> Dodaj
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-coc-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj w katalogu..."
            className="w-full pl-10 pr-4 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light transition-colors text-sm"
          />
        </div>

        {/* Equipment catalog — all items show real prices */}
        <div className="max-h-[300px] overflow-y-auto space-y-4 pr-1 mb-4">
          {Object.entries(equipmentByCategory).map(([category, items]) => {
            const filtered = search
              ? items.filter((it) => it.name.toLowerCase().includes(search.toLowerCase()))
              : items
            if (filtered.length === 0) return null

            return (
              <div key={category}>
                <h4 className="text-xs font-medium text-coc-text-muted uppercase tracking-wider mb-1">
                  {category}
                </h4>
                <div className="space-y-0.5">
                  {filtered.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-1 px-2 rounded hover:bg-coc-surface-light transition-colors"
                    >
                      <div>
                        <span className="text-sm">{item.name}</span>
                        {item.description && (
                          <span className="text-xs text-coc-text-muted ml-2">— {item.description}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-coc-text-muted">{item.price}</span>
                        <button
                          type="button"
                          onClick={() => addItem(item.name)}
                          className="text-coc-accent-light hover:text-coc-accent cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Weapons toggle */}
        <div className="border-t border-coc-border pt-3 mb-4">
          <Button size="sm" variant="secondary" onClick={() => setShowWeapons(!showWeapons)}>
            {showWeapons ? 'Ukryj broń' : 'Pokaż broń (Tabela Broni)'}
          </Button>

          {showWeapons && (
            <div className="mt-2 max-h-[250px] overflow-y-auto space-y-1">
              {weapons.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-coc-surface-light transition-colors"
                >
                  <div>
                    <span className="text-sm font-medium">{w.name}</span>
                    <span className="text-xs text-coc-text-muted ml-2">
                      {w.damage} | {w.range} | {w.price}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => addWeapon(w)}
                    className="text-coc-accent-light hover:text-coc-accent cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={() => store.prevStep()}>Wstecz</Button>
        <Button onClick={handleNext} disabled={overBudget}>Dalej</Button>
      </div>
    </Card>
  )
}
