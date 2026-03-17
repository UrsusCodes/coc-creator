import { useState, useMemo } from 'react'
import { useCharacterStore } from '@/stores/characterStore'
import {
  calcPositionWeights, calcContactRoll,
  applySynergy, generatePositionOptions, generateContactOptions,
  weightStars, strengthDiamonds,
} from '@/data/positionsContacts'
import { getSkillBase } from '@/data/skills'
import type { CharacterPosition, CharacterContact } from '@/types/character'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

function resolveSkill(skillId: string, chars: Record<string, number>, occPts: Record<string, number>, persPts: Record<string, number>): number {
  const base = getSkillBase(skillId)
  let baseVal = 0
  if (base === 'half_dex') baseVal = Math.floor((chars['DEX'] ?? 0) / 2)
  else if (base === 'edu') baseVal = chars['EDU'] ?? 0
  else baseVal = base
  return baseVal + (occPts[skillId] ?? 0) + (persPts[skillId] ?? 0)
}

export function StepPositionsContacts() {
  const store = useCharacterStore()

  const chars = store.characteristics as Record<string, number>
  const majetnosc = Math.min(80, (store.occupationSkillPoints['majetnosc'] ?? 0) + (store.personalSkillPoints['majetnosc'] ?? 0))
  const urokOsobisty = resolveSkill('urok_osobisty', chars, store.occupationSkillPoints, store.personalSkillPoints)
  const perswazja = resolveSkill('perswazja', chars, store.occupationSkillPoints, store.personalSkillPoints)
  const gadanina = resolveSkill('gadanina', chars, store.occupationSkillPoints, store.personalSkillPoints)
  const maxUrokPerswazja = Math.max(urokOsobisty, perswazja)
  const maxGadaninaUrok = Math.max(gadanina, urokOsobisty)
  const moc = chars['POW'] ?? 0
  const age = store.age ?? 25
  const jobId = store.occupationId ?? 'default'

  // Occupation points (sum of allocated occupation skill points)
  const occPoints = Object.values(store.occupationSkillPoints).reduce((a, b) => a + b, 0)

  // Is isolated job (scientist, artist, writer, investigator)
  const isolatedJobs = ['naukowiec', 'artysta', 'pisarz', 'prywatny_badacz', 'archeolog']
  const isIsolated = isolatedJobs.includes(jobId)

  const characterData = { majetnosc, moc, maxGadaninaUrok, age, isIsolated }

  // Position weights
  const weights = useMemo(() => calcPositionWeights(occPoints, majetnosc, maxUrokPerswazja, age), [occPoints, majetnosc, maxUrokPerswazja, age])

  // ── State ──
  const [selectedPositions, setSelectedPositions] = useState<(CharacterPosition | null)[]>(
    store.positions.length === 5 ? store.positions : Array(5).fill(null)
  )
  const [selectedContacts, setSelectedContacts] = useState<(CharacterContact | null)[]>(
    store.contacts.length === 5 ? store.contacts : Array(5).fill(null)
  )
  const [customPosInputs, setCustomPosInputs] = useState<string[]>(Array(5).fill(''))
  const [customConInputs, setCustomConInputs] = useState<string[]>(Array(5).fill(''))

  // Generate position options per slot
  const positionOptions = useMemo(() => {
    const usedCats: string[] = []
    return weights.map((w, i) => {
      const opts = generatePositionOptions(i, jobId, w, usedCats)
      opts.forEach((o) => { if (!usedCats.includes(o.category)) usedCats.push(o.category) })
      return opts
    })
  }, [weights, jobId])

  // Generate contact options per slot
  const contactOptions = useMemo(() => {
    const usedSubs: string[] = []
    return Array.from({ length: 5 }, (_, i) => {
      const opts = generateContactOptions(i, jobId, characterData, usedSubs)
      opts.forEach((o) => { if (!usedSubs.includes(o.subcategory)) usedSubs.push(o.subcategory) })
      return opts
    })
  }, [jobId, characterData])

  // Apply synergy to selected contacts
  const contactsWithSynergy = useMemo(() => {
    const selected = selectedContacts.filter(Boolean) as CharacterContact[]
    if (selected.length === 0) return []
    const synergized = applySynergy(selected.map((c) => ({
      subcategoryLabel: c.subcategory, categoryId: c.category, baseStrength: c.strength - c.synergyBonus,
    })))
    return selected.map((c, i) => ({
      ...c,
      strength: synergized[i].strength,
      strengthDisplay: strengthDiamonds(synergized[i].strength),
      synergyBonus: synergized[i].synBonus,
      rollValue: calcContactRoll(synergized[i].strength, maxUrokPerswazja),
    }))
  }, [selectedContacts, maxUrokPerswazja])

  const selectPosition = (slotIdx: number, description: string, category: string, weight: number, custom = false, pendingSt = false) => {
    const pos: CharacterPosition = {
      description, category, weight,
      weightDisplay: weightStars(weight),
      rollValue: weight * 25,
      custom, pendingSt,
    }
    setSelectedPositions((prev) => { const n = [...prev]; n[slotIdx] = pos; return n })
  }

  const selectContact = (slotIdx: number, subcategory: string, categoryId: string, strength: number, custom = false, customName = '', pendingSt = false) => {
    const con: CharacterContact = {
      subcategory, category: categoryId, strength,
      strengthDisplay: strengthDiamonds(strength),
      rollValue: calcContactRoll(strength, maxUrokPerswazja),
      synergyBonus: 0, custom, customName, pendingSt,
    }
    setSelectedContacts((prev) => { const n = [...prev]; n[slotIdx] = con; return n })
  }

  const handleNext = () => {
    const positions = selectedPositions.map((p) => p ?? {
      description: '[puste]', category: '', weight: 0, weightDisplay: '', rollValue: 0, custom: false, pendingSt: false,
    })
    const contacts = (contactsWithSynergy.length === 5 ? contactsWithSynergy : selectedContacts).map((c) => c ?? {
      subcategory: '[puste]', category: '', strength: 0, strengthDisplay: '', rollValue: 0, synergyBonus: 0, custom: false, customName: '', pendingSt: false,
    })
    store.setPositionsAndContacts(positions, contacts)
    store.nextStep()
  }

  return (
    <Card title="Pozycje i kontakty">
      <p className="text-sm text-coc-text-muted mb-6">
        Pozycje to miejsca gdzie jesteś kimś. Kontakty to środowiska, w których znasz ludzi.
        Dla każdego slotu wybierz jedną z sugestii lub wpisz własną.
      </p>

      {/* Positions */}
      <section className="mb-8">
        <h3 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider mb-3">Pozycje</h3>
        {weights.map((w, slotIdx) => (
          <div key={slotIdx} className="mb-4">
            <div className="text-xs text-coc-text-muted mb-1">Slot {slotIdx + 1}: waga {weightStars(w)} ({w * 25}%)</div>
            <div className="grid grid-cols-2 gap-2">
              {positionOptions[slotIdx]?.map((opt, optIdx) => {
                const isSelected = selectedPositions[slotIdx]?.description === opt.description
                return (
                  <button
                    key={optIdx}
                    onClick={() => selectPosition(slotIdx, opt.description, opt.category, Math.min(3, opt.weight))}
                    className={`text-left p-2 rounded-lg border text-sm transition-colors cursor-pointer ${
                      isSelected ? 'border-coc-accent bg-coc-accent/10' : 'border-coc-border hover:border-coc-accent-light'
                    }`}
                  >
                    <div className="font-medium">{opt.description}</div>
                    <div className="text-xs text-coc-text-muted">{opt.category}</div>
                  </button>
                )
              })}
              {/* Custom option */}
              <div className="p-2 rounded-lg border border-dashed border-coc-border">
                <input
                  value={customPosInputs[slotIdx]}
                  onChange={(e) => { const n = [...customPosInputs]; n[slotIdx] = e.target.value; setCustomPosInputs(n) }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customPosInputs[slotIdx]) {
                      selectPosition(slotIdx, customPosInputs[slotIdx], 'NIEOKREŚLONA', 1, true, true)
                    }
                  }}
                  placeholder="Własne..."
                  className="w-full px-2 py-1 bg-transparent text-sm text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none"
                />
                {customPosInputs[slotIdx] && (
                  <button
                    onClick={() => selectPosition(slotIdx, customPosInputs[slotIdx], 'NIEOKREŚLONA', 1, true, true)}
                    className="text-xs text-coc-accent-light mt-1 cursor-pointer"
                  >Zatwierdź</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Contacts */}
      <section className="mb-6">
        <h3 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider mb-3">Kontakty</h3>
        {Array.from({ length: 5 }, (_, slotIdx) => (
          <div key={slotIdx} className="mb-4">
            <div className="text-xs text-coc-text-muted mb-1">Slot {slotIdx + 1}</div>
            <div className="grid grid-cols-2 gap-2">
              {contactOptions[slotIdx]?.map((opt, optIdx) => {
                const isSelected = selectedContacts[slotIdx]?.subcategory === opt.subcategory
                // Check synergy preview
                const existing = selectedContacts.filter((c, i) => c && i !== slotIdx) as CharacterContact[]
                const sameCategory = existing.filter((c) => c.category === opt.categoryId)
                const hasSynergy = sameCategory.length > 0
                return (
                  <button
                    key={optIdx}
                    onClick={() => selectContact(slotIdx, opt.subcategory, opt.categoryId, opt.strength)}
                    className={`text-left p-2 rounded-lg border text-sm transition-colors cursor-pointer ${
                      isSelected ? 'border-coc-accent bg-coc-accent/10' : 'border-coc-border hover:border-coc-accent-light'
                    }`}
                  >
                    <div className="font-medium">{opt.subcategory}</div>
                    <div className="text-xs text-coc-text-muted">
                      {strengthDiamonds(opt.strength)} {opt.strength * 25}%
                    </div>
                    {hasSynergy && (
                      <div className="text-xs text-coc-accent-light mt-0.5">
                        ✨ Synergia z: {sameCategory.map((c) => c.subcategory).join(', ')}
                      </div>
                    )}
                  </button>
                )
              })}
              {/* Custom */}
              <div className="p-2 rounded-lg border border-dashed border-coc-border">
                <input
                  value={customConInputs[slotIdx]}
                  onChange={(e) => { const n = [...customConInputs]; n[slotIdx] = e.target.value; setCustomConInputs(n) }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customConInputs[slotIdx]) {
                      selectContact(slotIdx, customConInputs[slotIdx], 'NIEOKREŚLONA', 1, true, customConInputs[slotIdx], true)
                    }
                  }}
                  placeholder="Własne..."
                  className="w-full px-2 py-1 bg-transparent text-sm text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none"
                />
                {customConInputs[slotIdx] && (
                  <button
                    onClick={() => selectContact(slotIdx, customConInputs[slotIdx], 'NIEOKREŚLONA', 1, true, customConInputs[slotIdx], true)}
                    className="text-xs text-coc-accent-light mt-1 cursor-pointer"
                  >Zatwierdź</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Summary */}
      {(selectedPositions.some(Boolean) || selectedContacts.some(Boolean)) && (
        <div className="bg-coc-surface-light rounded-lg p-3 mb-4 text-sm space-y-2">
          {selectedPositions.filter(Boolean).map((p, i) => (
            <div key={`p${i}`}>{p!.weightDisplay} {p!.description} [{p!.rollValue}%]{p!.pendingSt ? ' [do ustalenia ze ST]' : ''}</div>
          ))}
          <div className="border-t border-coc-border my-1" />
          {(contactsWithSynergy.length > 0 ? contactsWithSynergy : selectedContacts.filter(Boolean) as CharacterContact[]).map((c, i) => (
            <div key={`c${i}`}>{c.strengthDisplay} {c.subcategory} [{c.rollValue}%]{c.synergyBonus > 0 ? ' ✨' : ''}{c.pendingSt ? ' [do ustalenia ze ST]' : ''}</div>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="secondary" onClick={() => store.prevStep()}>Wstecz</Button>
        <Button onClick={handleNext}>Dalej</Button>
      </div>
    </Card>
  )
}
