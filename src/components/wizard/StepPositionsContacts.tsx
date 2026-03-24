import { useState, useMemo } from 'react'
import { Unlock, Plus, Sparkles } from 'lucide-react'
import { useCharacterStore } from '@/stores/characterStore'
import { getSkillBase } from '@/data/skills'
import { CONTACT_CATEGORIES_NEW } from '@/data/contactCategories'
import {
  calculatePositionStrength,
  getAvailablePositionOptions,
} from '@/utils/positionCalculator'
import {
  countOccupationContactSlots,
  countAdditionalContactSlots,
  calculateBaseStrength,
  applyStrengthModifiers,
  applySynergyContacts,
  getSynergyPreview,
  generateContactOptions as genContactOpts,
  CUSTOM_CATEGORY_DEFAULT_STRENGTH,
} from '@/utils/contactCalculator'
import {
  countAdditionalSlots,
  calculatePositionWeight,
  generateOptions as generateAdditionalOptions,
  describeUnlock,
} from '@/utils/additionalPositionCalculator'
import type { Characteristics } from '@/types/character'
import type { MainPosition, AdditionalPosition, ContactV2 } from '@/types/character'
import type { AdditionalPositionOption } from '@/data/additionalPositions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

function resolveSkill(skillId: string, chars: Record<string, number>, occPts: Record<string, number>, persPts: Record<string, number>): number {
  const base = getSkillBase(skillId)
  let baseVal = 0
  if (base === 'half_dex') baseVal = Math.floor((chars['DEX'] ?? 0) / 2)
  else if (base === 'edu') baseVal = chars['EDU'] ?? 0
  else baseVal = base
  return baseVal + (occPts[skillId] ?? 0) + (persPts[skillId] ?? 0)
}

function weightStars(w: number): string {
  return '★'.repeat(Math.max(1, Math.min(3, w)))
}

function strengthDiamonds(s: number): string {
  const clamped = Math.max(1, Math.min(3, s))
  return '◆'.repeat(clamped) + '░'.repeat(3 - clamped)
}

const ADDITIONAL_POS_CATEGORIES = [
  'BOJOWE I FIZYCZNE', 'INTELEKTUALNE I AKADEMICKIE', 'NAUKOWE I BADAWCZE',
  'ARTYSTYCZNE I KULTURALNE', 'TOWARZYSKIE I PRESTIŻOWE', 'OKULTYSTYCZNE I TAJEMNICZE',
  'RELIGIJNE I DUCHOWE', 'POLITYCZNE I SPOŁECZNE', 'MARGINES I PÓŁŚWIATEK',
  'EKSPLORATORZY I PRZYGODNICY',
]

export function StepPositionsContacts() {
  const store = useCharacterStore()
  const chars = store.characteristics as Characteristics
  const occPts = store.occupationSkillPoints
  const persPts = store.personalSkillPoints
  const jobId = store.occupationId ?? ''
  const age = store.age ?? 25

  // Build skill totals map
  const skillTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    const allKeys = new Set([...Object.keys(occPts), ...Object.keys(persPts)])
    for (const key of allKeys) {
      totals[key] = resolveSkill(key, chars, occPts, persPts)
    }
    for (const sid of ['urok_osobisty', 'perswazja', 'gadanina', 'zastraszanie', 'majetnosc', 'okultyzm', 'prawo', 'medycyna', 'pierwsza_pomoc', 'historia', 'archeologia', 'nawigacja', 'mechanika', 'elektryka', 'charakteryzacja', 'jezyk_ojczysty', 'prowadzenie_samochodu', 'wspinaczka', 'plywanie', 'tropienie', 'hipnoza', 'zreczne_palce', 'sztuka_przetrwania', 'wiedza_o_naturze', 'wycena', 'pilotowanie', 'sztuka_rzemioslo']) {
      if (!(sid in totals)) totals[sid] = resolveSkill(sid, chars, occPts, persPts)
    }
    return totals
  }, [chars, occPts, persPts])

  const occPointsTotal = useMemo(() => Object.values(occPts).reduce((a, b) => a + b, 0), [occPts])

  const socialSkills = {
    urokOsobisty: skillTotals['urok_osobisty'] ?? 0,
    perswazja: skillTotals['perswazja'] ?? 0,
    gadatliwosc: skillTotals['gadanina'] ?? 0,
    zastraszanie: skillTotals['zastraszanie'] ?? 0,
  }

  // Build character map for additional positions calculator
  const characterMap = useMemo(() => {
    const map: Record<string, number> = { ...skillTotals }
    // Add attributes
    for (const [key, val] of Object.entries(chars)) {
      map[key] = val
    }
    map['wiek'] = age
    map['majetnosc'] = Math.min(80, skillTotals['majetnosc'] ?? 0)
    return map
  }, [skillTotals, chars, age])

  // ── Section 1: Main Position ──
  const availableOptions = useMemo(
    () => getAvailablePositionOptions(jobId, skillTotals),
    [jobId, skillTotals],
  )

  const [selectedMainId, setSelectedMainId] = useState<string | null>(store.mainPosition?.option_id ?? null)
  const [mainDescription, setMainDescription] = useState(store.mainPosition?.custom_description ?? '')

  const selectedMainOption = availableOptions.find((o) => o.id === selectedMainId)
  const mainStrength = selectedMainOption
    ? calculatePositionStrength({ occupationalPoints: occPointsTotal, socialSkills, wiek: age, organizationSize: selectedMainOption.organization_size })
    : 0

  // ── Section 2: Additional Positions (1-2 slots from 67 options) ──
  const numAdditionalSlots = useMemo(() => countAdditionalSlots({
    wiek: age,
    majetnosc: characterMap['majetnosc'] ?? 0,
    INT: chars.INT ?? 0,
    urok_osobisty: skillTotals['urok_osobisty'] ?? 0,
    perswazja: skillTotals['perswazja'] ?? 0,
    gadanina: skillTotals['gadanina'] ?? 0,
  }), [age, characterMap, chars, skillTotals])

  const [additionalPositions, setAdditionalPositions] = useState<(AdditionalPosition | null)[]>(
    store.additionalPositions.length > 0 ? store.additionalPositions.map(p => p.option_name ? p : null) : Array(numAdditionalSlots).fill(null),
  )
  const [additionalDescriptions, setAdditionalDescriptions] = useState<string[]>(
    store.additionalPositions.map(p => p.custom_description) || Array(numAdditionalSlots).fill(''),
  )
  const [openPosSlots, setOpenPosSlots] = useState<Set<number>>(() => {
    // Pre-open slots that already have data from store
    const set = new Set<number>()
    if (store.additionalPositions.length > 0) {
      store.additionalPositions.forEach((p, i) => { if (p.option_name) set.add(i) })
    }
    return set
  })
  const [customPosInputs, setCustomPosInputs] = useState<string[]>(Array(numAdditionalSlots).fill(''))
  const [customPosCats, setCustomPosCats] = useState<string[]>(Array(numAdditionalSlots).fill(''))

  // Generate 3 proposals per slot
  const additionalOptions = useMemo(() => {
    const mainCat = selectedMainOption?.category ?? ''
    const chosen = additionalPositions.filter(Boolean).map(p => p!.option_id)
    return Array.from({ length: numAdditionalSlots }, (_, i) => {
      const existingForSlot = [...chosen]
      if (i > 0 && additionalPositions[0]?.option_id) {
        existingForSlot.push(additionalPositions[0].option_id)
      }
      return generateAdditionalOptions(characterMap, jobId, mainCat, existingForSlot)
    })
  }, [characterMap, jobId, selectedMainOption, additionalPositions, numAdditionalSlots])

  const selectAdditionalPosition = (slotIdx: number, option: AdditionalPositionOption) => {
    const weight = calculatePositionWeight(option, characterMap)
    const newPos: AdditionalPosition = {
      slot_index: slotIdx,
      option_id: option.id,
      option_name: option.title,
      organization_size: option.organization_size,
      category: option.category,
      custom_description: '',
      weight,
      roll_value: weight * 25,
      is_custom: false,
      pending_st_approval: false,
      unlocked_by: describeUnlock(option),
      is_attribute_special: option.is_attribute_special ?? false,
    }
    const updated = [...additionalPositions]
    updated[slotIdx] = newPos
    setAdditionalPositions(updated)
  }

  const addCustomAdditionalPosition = (slotIdx: number) => {
    const text = customPosInputs[slotIdx]?.trim()
    if (!text) return
    const category = customPosCats[slotIdx] || ''
    const newPos: AdditionalPosition = {
      slot_index: slotIdx,
      option_id: `custom_${slotIdx}`,
      option_name: text,
      organization_size: 'Mikro',
      category,
      custom_description: '',
      weight: 1,
      roll_value: 25,
      is_custom: true,
      pending_st_approval: !category,
      unlocked_by: '',
      is_attribute_special: false,
    }
    const updated = [...additionalPositions]
    updated[slotIdx] = newPos
    setAdditionalPositions(updated)
    const inputs = [...customPosInputs]
    inputs[slotIdx] = ''
    setCustomPosInputs(inputs)
  }

  // ── Section 3: Contacts (new system) ──
  const occContactSlots = countOccupationContactSlots(jobId)
  const addContactSlots = countAdditionalContactSlots(characterMap)
  const totalContactSlots = Math.min(5, occContactSlots + addContactSlots)

  const [contacts, setContacts] = useState<(ContactV2 | null)[]>(
    store.contactsV2.length > 0 ? store.contactsV2.map(c => c.subcategory_id ? c : null) : Array(totalContactSlots).fill(null),
  )
  const [openConSlots, setOpenConSlots] = useState<Set<number>>(() => {
    const set = new Set<number>()
    if (store.contactsV2.length > 0) {
      store.contactsV2.forEach((c, i) => { if (c.subcategory_id) set.add(i) })
    }
    return set
  })
  const [customConInputs, setCustomConInputs] = useState<string[]>(Array(totalContactSlots).fill(''))
  const [customConCategories, setCustomConCategories] = useState<string[]>(Array(totalContactSlots).fill(''))

  const contactOptions = useMemo(() => {
    const selectedIds = contacts.filter(Boolean).map((c) => c!.subcategory_id)
    const allShownIds = [...selectedIds]
    const result: ReturnType<typeof genContactOpts>[] = []
    for (let slotIdx = 0; slotIdx < totalContactSlots; slotIdx++) {
      // Skip slots that already have a selection
      if (contacts[slotIdx]) {
        result.push([])
        continue
      }
      const opts = genContactOpts(slotIdx, jobId, characterMap, allShownIds)
      result.push(opts)
      // Track shown options so next slot won't repeat them
      for (const o of opts) allShownIds.push(o.id)
    }
    return result
  }, [jobId, characterMap, contacts, totalContactSlots])

  const contactsWithSynergy = useMemo(() => {
    const filled = contacts.filter(Boolean) as ContactV2[]
    if (filled.length < 2) return filled
    return applySynergyContacts(filled)
  }, [contacts])

  const selectContact = (slotIdx: number, sub: { id: string; name: string; category_id: string }) => {
    const catData = CONTACT_CATEGORIES_NEW.find(c => c.id === sub.category_id)
    const base = calculateBaseStrength(sub.id, jobId, characterMap)
    const modified = applyStrengthModifiers(base, sub.id, jobId, characterMap)
    const newContact: ContactV2 = {
      slot_index: slotIdx, subcategory_id: sub.id, subcategory_name: sub.name,
      category_id: sub.category_id, category_name: catData?.name ?? sub.category_id,
      base_strength: modified, strength: modified,
      roll_value: (modified * 30) as 30 | 60 | 90, synergy_bonus: 0,
      custom_description: '', custom_name: '', is_custom: false, pending_st_approval: false,
      slot_source: slotIdx < occContactSlots ? 'occupation' : 'additional',
    }
    const updated = [...contacts]
    updated[slotIdx] = newContact
    setContacts(updated)
  }

  const addCustomContact = (slotIdx: number) => {
    const text = customConInputs[slotIdx]?.trim()
    if (!text) return
    const categoryId = customConCategories[slotIdx] || ''
    const catData = CONTACT_CATEGORIES_NEW.find(c => c.id === categoryId)
    const defaultStr = categoryId ? (CUSTOM_CATEGORY_DEFAULT_STRENGTH[categoryId] ?? 1) : 1
    const newContact: ContactV2 = {
      slot_index: slotIdx, subcategory_id: `custom_${slotIdx}`, subcategory_name: text,
      category_id: categoryId, category_name: catData?.name ?? '',
      base_strength: defaultStr as 1|2|3, strength: defaultStr as 1|2|3,
      roll_value: (defaultStr * 30) as 30|60|90, synergy_bonus: 0,
      custom_description: '', custom_name: text, is_custom: true,
      pending_st_approval: !categoryId, slot_source: slotIdx < occContactSlots ? 'occupation' : 'additional',
    }
    const updated = [...contacts]
    updated[slotIdx] = newContact
    setContacts(updated)
    const inputs = [...customConInputs]
    inputs[slotIdx] = ''
    setCustomConInputs(inputs)
  }

  // ── Save ──
  const canContinue = !!selectedMainId

  const handleNext = () => {
    if (!selectedMainOption) return
    const mainPos: MainPosition = {
      option_id: selectedMainOption.id, option_name: selectedMainOption.name,
      organization_size: selectedMainOption.organization_size, category: selectedMainOption.category,
      custom_description: mainDescription, strength_percent: mainStrength, unlock_condition: selectedMainOption.unlock_condition,
    }
    store.setMainPosition(mainPos)

    // Auto-submit any pending custom position inputs before saving
    const finalPositions = [...additionalPositions]
    for (let i = 0; i < numAdditionalSlots; i++) {
      if (!finalPositions[i] && customPosInputs[i]?.trim()) {
        const text = customPosInputs[i].trim()
        const category = customPosCats[i] || ''
        finalPositions[i] = {
          slot_index: i, option_id: `custom_${i}`, option_name: text,
          organization_size: 'Mikro', category, custom_description: '',
          weight: 1, roll_value: 25, is_custom: true,
          pending_st_approval: !category, unlocked_by: '', is_attribute_special: false,
        }
      }
    }

    const filledPositions = finalPositions.slice(0, numAdditionalSlots).filter((p): p is AdditionalPosition => !!p && !!p.option_name)
    filledPositions.forEach((p, i) => { p.slot_index = i; if (additionalDescriptions[finalPositions.indexOf(p)] !== undefined) p.custom_description = additionalDescriptions[finalPositions.indexOf(p)] || p.custom_description })

    // Auto-submit any pending custom contact inputs before saving
    const finalContacts = [...contacts]
    for (let i = 0; i < totalContactSlots; i++) {
      if (!finalContacts[i] && customConInputs[i]?.trim()) {
        const text = customConInputs[i].trim()
        const categoryId = customConCategories[i] || ''
        const catData = CONTACT_CATEGORIES_NEW.find(c => c.id === categoryId)
        const defaultStr = categoryId ? (CUSTOM_CATEGORY_DEFAULT_STRENGTH[categoryId] ?? 1) : 1
        finalContacts[i] = {
          slot_index: i, subcategory_id: `custom_${i}`, subcategory_name: text,
          category_id: categoryId, category_name: catData?.name ?? '',
          base_strength: defaultStr as 1|2|3, strength: defaultStr as 1|2|3,
          roll_value: (defaultStr * 30) as 30|60|90, synergy_bonus: 0,
          custom_description: '', custom_name: text, is_custom: true,
          pending_st_approval: !categoryId, slot_source: i < occContactSlots ? 'occupation' : 'additional',
        }
      }
    }

    const filled = finalContacts.filter(Boolean) as ContactV2[]
    const synced = filled.length >= 2 ? applySynergyContacts(filled) : filled
    const filledContacts = synced.map((c, i) => ({ ...c, slot_index: i }))

    store.setPositionsAndContactsV2(filledPositions, filledContacts)
    store.nextStep()
  }

  return (
    <Card title="Pozycje i kontakty">
      {/* ── Section 1: Main Position ── */}
      <section className="mb-6">
        <h3 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider mb-2">Pozycja główna</h3>
        <p className="text-xs text-coc-text-muted mb-3">Gdzie twój Badacz jest „kimś"? Wybierz organizację lub instytucję w której masz znaczenie.</p>
        <div className="grid grid-cols-1 gap-2">
          {availableOptions.map((option) => {
            const strength = calculatePositionStrength({ occupationalPoints: occPointsTotal, socialSkills, wiek: age, organizationSize: option.organization_size })
            const isSelected = selectedMainId === option.id
            const isLocked = option.unlock_condition !== 'ZAWSZE'
            return (
              <div key={option.id}>
                <button type="button" onClick={() => { setSelectedMainId(option.id); setMainDescription('') }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${isSelected ? 'bg-coc-accent/10 border-coc-accent/30' : 'border-coc-border hover:border-coc-accent/20 hover:bg-coc-surface-light'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isLocked && <Unlock className="w-3.5 h-3.5 text-yellow-500" />}
                      <span className="font-medium text-sm">{option.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{option.organization_size}</Badge>
                      <span className="text-sm font-mono font-bold text-coc-accent-light">{strength}%</span>
                    </div>
                  </div>
                  <div className="text-xs text-coc-text-muted mt-1">{option.category}</div>
                </button>
                {isSelected && (
                  <div className="mt-2 ml-4">
                    <textarea value={mainDescription} onChange={(e) => setMainDescription(e.target.value)}
                      placeholder={option.placeholder}
                      className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light min-h-[60px] resize-y" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Section 2: Additional Positions (add on demand) ── */}
      <section className="mb-6">
        <h3 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider mb-2">
          Pozycje dodatkowe <span className="text-coc-accent-light">{additionalPositions.filter(Boolean).length}/{numAdditionalSlots}</span>
        </h3>
        <p className="text-xs text-coc-text-muted mb-3">Pozazawodowe organizacje, kluby i stowarzyszenia dopasowane do twojej postaci.</p>

        <div className="space-y-3">
          {/* Render filled slots and open (unfilled) slots */}
          {Array.from({ length: numAdditionalSlots }, (_, slotIdx) => {
            const selected = additionalPositions[slotIdx]
            const isOpen = openPosSlots.has(slotIdx)

            if (!selected && !isOpen) return null

            const options = additionalOptions[slotIdx] ?? []

            return (
              <div key={slotIdx} className="bg-coc-surface-light/30 rounded-lg p-3">
                {selected ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium">
                          {weightStars(selected.weight)} {selected.option_name}
                        </span>
                        <span className="text-xs text-coc-text-muted ml-2">[{selected.roll_value}%]</span>
                        {selected.is_attribute_special && <Sparkles className="w-3 h-3 text-yellow-400 inline ml-1" />}
                        {selected.pending_st_approval && <span className="text-yellow-500 text-xs ml-1">[ST]</span>}
                      </div>
                      <button type="button" onClick={() => {
                        const u = [...additionalPositions]; u[slotIdx] = null; setAdditionalPositions(u)
                        setOpenPosSlots(prev => { const s = new Set(prev); s.delete(slotIdx); return s })
                      }}
                        className="text-xs text-coc-danger cursor-pointer">×</button>
                    </div>
                    {selected.unlocked_by && <div className="text-xs text-coc-text-muted">Odblokowane przez: {selected.unlocked_by}</div>}
                    <textarea value={additionalDescriptions[slotIdx] ?? ''} onChange={(e) => { const d = [...additionalDescriptions]; d[slotIdx] = e.target.value; setAdditionalDescriptions(d) }}
                      placeholder="Opis (opcjonalnie)..."
                      className="w-full px-2 py-1 bg-coc-surface-light border border-coc-border rounded text-xs text-coc-text placeholder:text-coc-text-muted/50 min-h-[40px] resize-y" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {options.length === 0 ? (
                      <p className="text-xs text-yellow-500/80 italic py-1">
                        System nie ma sugestii. Mozesz wpisac wlasne, ale wymaga to zatwierdzenia przez Straznika Tajemnic.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-1.5">
                        {options.map((opt) => {
                          const w = calculatePositionWeight(opt, characterMap)
                          return (
                            <button key={opt.id} type="button" onClick={() => selectAdditionalPosition(slotIdx, opt)}
                              className="text-left px-3 py-2 rounded-lg border border-coc-border hover:border-coc-accent/30 hover:bg-coc-surface-light cursor-pointer">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{opt.title}</span>
                                  {opt.is_attribute_special && <Sparkles className="w-3 h-3 text-yellow-400" />}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-coc-text-muted">{opt.organization_size}</span>
                                  <span className="text-xs font-mono">{weightStars(w)} {w * 25}%</span>
                                </div>
                              </div>
                              <div className="text-xs text-coc-text-muted mt-0.5 italic">{opt.flavor}</div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                    <div className="flex gap-1 mt-1">
                      <input type="text" value={customPosInputs[slotIdx]} onChange={(e) => { const i = [...customPosInputs]; i[slotIdx] = e.target.value; setCustomPosInputs(i) }}
                        onKeyDown={(e) => e.key === 'Enter' && addCustomAdditionalPosition(slotIdx)}
                        placeholder="Własne..." className="flex-1 px-2 py-1 text-xs bg-coc-surface-light border border-coc-border rounded text-coc-text placeholder:text-coc-text-muted/50" />
                      <select value={customPosCats[slotIdx]} onChange={(e) => { const c = [...customPosCats]; c[slotIdx] = e.target.value; setCustomPosCats(c) }}
                        className="px-1 py-1 text-xs bg-coc-surface-light border border-coc-border rounded text-coc-text">
                        <option value="">Kategoria (ST)</option>
                        {ADDITIONAL_POS_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    {customPosInputs[slotIdx]?.trim() && (
                      <p className="text-xs text-yellow-500/80 italic">
                        Wlasne wpisy wymagaja zatwierdzenia przez Straznika Tajemnic.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Add button - visible when not all slots are filled */}
          {additionalPositions.filter(Boolean).length < numAdditionalSlots && openPosSlots.size <= additionalPositions.filter(Boolean).length && (
            <button type="button" onClick={() => {
              // Find the first available (unfilled & not open) slot index
              for (let i = 0; i < numAdditionalSlots; i++) {
                if (!additionalPositions[i] && !openPosSlots.has(i)) {
                  setOpenPosSlots(prev => new Set(prev).add(i))
                  break
                }
              }
            }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-coc-accent-light hover:text-coc-accent border border-dashed border-coc-border hover:border-coc-accent/30 rounded-lg cursor-pointer transition-colors w-full justify-center">
              <Plus className="w-4 h-4" />
              Dodaj pozycje
            </button>
          )}
        </div>
      </section>

      {/* ── Section 3: Contacts (add on demand) ── */}
      <section className="mb-6">
        <h3 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider mb-2">
          Kontakty <span className="text-coc-accent-light">{contacts.filter(Boolean).length}/{totalContactSlots}</span>
        </h3>
        <p className="text-xs text-coc-text-muted mb-3">
          Środowiska w których twój Badacz ma kontakty. Sloty 1-{occContactSlots}: zawodowe, reszta: dodatkowe.
        </p>

        <div className="space-y-3">
          {contactsWithSynergy.some((c) => c.synergy_bonus > 0) && (
            <div className="text-xs text-coc-accent-light bg-coc-accent/10 rounded-lg px-3 py-1.5">
              Synergia: kontakty w tej samej kategorii wzmacniaja sie nawzajem
            </div>
          )}

          {/* Render filled slots and open (unfilled) slots */}
          {Array.from({ length: totalContactSlots }, (_, slotIdx) => {
            const selected = contacts[slotIdx]
            const isOpen = openConSlots.has(slotIdx)

            if (!selected && !isOpen) return null

            const synContact = contactsWithSynergy.find((c) => c.slot_index === slotIdx)
            const options = contactOptions[slotIdx] ?? []
            const isOccSlot = slotIdx < occContactSlots
            const synergyPreview = (sub: { category_id: string }) =>
              getSynergyPreview(sub.category_id, contacts.filter(Boolean) as ContactV2[])

            return (
              <div key={slotIdx} className={`rounded-lg p-2 ${isOccSlot ? 'bg-coc-surface-light/30' : 'bg-coc-surface-light/15 border border-dashed border-coc-border'}`}>
                {selected ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between px-2 py-1">
                      <div>
                        <span className="text-xs text-coc-text-muted">{synContact?.category_name ?? selected.category_name}</span>
                        <div className="text-sm font-medium">
                          {strengthDiamonds(synContact?.strength ?? selected.strength)}{' '}
                          {selected.subcategory_name}{' '}
                          <span className="font-mono">[{synContact?.roll_value ?? selected.roll_value}%]</span>
                          {(synContact?.synergy_bonus ?? 0) > 0 && <span className="ml-1">+</span>}
                          {selected.pending_st_approval && <span className="text-yellow-500 ml-1">[ST]</span>}
                        </div>
                      </div>
                      <button type="button" onClick={() => {
                        const u = [...contacts]; u[slotIdx] = null; setContacts(u)
                        setOpenConSlots(prev => { const s = new Set(prev); s.delete(slotIdx); return s })
                      }}
                        className="text-xs text-coc-danger cursor-pointer">×</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 p-1">
                    <div className="text-xs text-coc-text-muted mb-1">
                      <span className="text-coc-text-muted/60">({isOccSlot ? 'zawodowy' : 'dodatkowy'})</span>
                    </div>
                    {options.length === 0 ? (
                      <p className="text-xs text-yellow-500/80 italic py-1">
                        System nie ma sugestii. Mozesz wpisac wlasne, ale wymaga to zatwierdzenia przez Straznika Tajemnic.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-1">
                        {options.map((sub) => {
                          const base = calculateBaseStrength(sub.id, jobId, characterMap)
                          const modified = applyStrengthModifiers(base, sub.id, jobId, characterMap)
                          const roll = modified * 30
                          const synPreview = synergyPreview(sub)
                          return (
                            <button key={sub.id} type="button" onClick={() => selectContact(slotIdx, sub)}
                              className="text-left px-3 py-2 rounded-lg border border-coc-border hover:border-coc-accent/30 hover:bg-coc-surface-light cursor-pointer">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm font-medium">{sub.name}</div>
                                  <div className="text-xs text-coc-text-muted">{sub.flavor}</div>
                                </div>
                                <div className="text-right ml-2">
                                  <div className="text-xs font-mono">{strengthDiamonds(modified)} {roll}%</div>
                                  {synPreview && <div className="text-xs text-coc-accent-light">+syn</div>}
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                    <div className="mt-1 flex gap-1">
                      <input type="text" value={customConInputs[slotIdx]} onChange={(e) => { const i = [...customConInputs]; i[slotIdx] = e.target.value; setCustomConInputs(i) }}
                        onKeyDown={(e) => e.key === 'Enter' && addCustomContact(slotIdx)}
                        placeholder="Własne środowisko..." className="flex-1 px-2 py-1 text-xs bg-coc-surface-light border border-coc-border rounded text-coc-text placeholder:text-coc-text-muted/50" />
                      <select value={customConCategories[slotIdx]} onChange={(e) => { const c = [...customConCategories]; c[slotIdx] = e.target.value; setCustomConCategories(c) }}
                        className="px-1 py-1 text-xs bg-coc-surface-light border border-coc-border rounded text-coc-text">
                        <option value="">Kategoria (ST)</option>
                        {CONTACT_CATEGORIES_NEW.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                      </select>
                    </div>
                    {customConInputs[slotIdx]?.trim() && (
                      <p className="text-xs text-yellow-500/80 italic">
                        Wlasne wpisy wymagaja zatwierdzenia przez Straznika Tajemnic.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Add button - visible when not all slots are filled */}
          {contacts.filter(Boolean).length < totalContactSlots && openConSlots.size <= contacts.filter(Boolean).length && (
            <button type="button" onClick={() => {
              for (let i = 0; i < totalContactSlots; i++) {
                if (!contacts[i] && !openConSlots.has(i)) {
                  setOpenConSlots(prev => new Set(prev).add(i))
                  break
                }
              }
            }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-coc-accent-light hover:text-coc-accent border border-dashed border-coc-border hover:border-coc-accent/30 rounded-lg cursor-pointer transition-colors w-full justify-center">
              <Plus className="w-4 h-4" />
              Dodaj kontakt
            </button>
          )}
        </div>
      </section>

      <div className="flex justify-between pt-4">
        <Button variant="secondary" onClick={() => store.prevStep()}>Wstecz</Button>
        <Button onClick={handleNext} disabled={!canContinue}>Dalej</Button>
      </div>
    </Card>
  )
}
