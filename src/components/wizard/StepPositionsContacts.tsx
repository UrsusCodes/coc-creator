import { useState, useMemo } from 'react'
import { Lock, Unlock, Star, ChevronDown, ChevronUp } from 'lucide-react'
import { useCharacterStore } from '@/stores/characterStore'
import { getSkillBase } from '@/data/skills'
import { CONTACT_SUBCATEGORIES_V2, CONTACT_CATEGORIES_V2 } from '@/data/contactSubcategories'
import { OCCUPATION_CLUSTER_MAP } from '@/data/occupationClusters'
import {
  calculatePositionStrength,
  getAvailablePositionOptions,
  getAdditionalPositionWeight,
} from '@/utils/positionCalculator'
import {
  calculateContactStrength,
  calculateContactRollValue,
  applySynergies,
  ISOLATED_OCCUPATIONS,
} from '@/utils/contactCalculator'
import type { Characteristics } from '@/types/character'
import type { MainPosition, AdditionalPosition, ContactV2, PositionOption } from '@/types/character'
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

export function StepPositionsContacts() {
  const store = useCharacterStore()
  const chars = store.characteristics as Characteristics
  const occPts = store.occupationSkillPoints
  const persPts = store.personalSkillPoints
  const jobId = store.occupationId ?? ''
  const age = store.age ?? 25

  // Build skill totals map for unlock checks and calculations
  const skillTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    const allKeys = new Set([...Object.keys(occPts), ...Object.keys(persPts)])
    for (const key of allKeys) {
      totals[key] = resolveSkill(key, chars, occPts, persPts)
    }
    // Ensure social skills are present
    for (const sid of ['urok_osobisty', 'perswazja', 'gadanina', 'zastraszanie', 'majetnosc', 'okultyzm', 'prawo', 'medycyna']) {
      if (!(sid in totals)) totals[sid] = resolveSkill(sid, chars, occPts, persPts)
    }
    return totals
  }, [chars, occPts, persPts])

  const isIsolated = ISOLATED_OCCUPATIONS.has(jobId)

  // Occupational points total (for position strength calculation)
  const occPointsTotal = useMemo(() => Object.values(occPts).reduce((a, b) => a + b, 0), [occPts])

  const socialSkills = {
    urokOsobisty: skillTotals['urok_osobisty'] ?? 0,
    perswazja: skillTotals['perswazja'] ?? 0,
    gadatliwosc: skillTotals['gadanina'] ?? 0,
    zastraszanie: skillTotals['zastraszanie'] ?? 0,
  }

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

  // ── Section 2: Additional Positions ──
  const [additionalPositions, setAdditionalPositions] = useState<(AdditionalPosition | null)[]>(
    store.additionalPositions.length === 5 ? store.additionalPositions : [null, null, null, null, null],
  )
  const [expandedPosSection, setExpandedPosSection] = useState(true)
  const [customPosInputs, setCustomPosInputs] = useState<string[]>(['', '', '', '', ''])

  // Generate options for additional position slots from cluster
  const clusterId = OCCUPATION_CLUSTER_MAP[jobId] ?? 'ZAWODY_NISZOWE'
  const clusterOptions = useMemo(
    () => getAvailablePositionOptions(jobId, skillTotals),
    [jobId, skillTotals],
  )

  const baseWeight = useMemo(() => {
    if (occPointsTotal >= 300) return 3
    if (occPointsTotal >= 150) return 2
    return 1
  }, [occPointsTotal])

  // ── Section 3: Contacts ──
  const [contacts, setContacts] = useState<(ContactV2 | null)[]>(
    store.contactsV2.length === 5 ? store.contactsV2 : [null, null, null, null, null],
  )
  const [expandedConSection, setExpandedConSection] = useState(true)
  const [customConInputs, setCustomConInputs] = useState<string[]>(['', '', '', '', ''])
  const [customConCategories, setCustomConCategories] = useState<string[]>(['', '', '', '', ''])

  // Generate contact options per slot
  const contactOptions = useMemo(() => {
    const jobContactMap = CONTACT_SUBCATEGORIES_V2.filter((s) => s.natural_for_occupations.includes(jobId))
    const usedIds = new Set(contacts.filter(Boolean).map((c) => c!.subcategory))

    return Array.from({ length: 5 }, (_, slotIdx) => {
      const available = CONTACT_SUBCATEGORIES_V2.filter((s) => !usedIds.has(s.name))

      // Priority: job-related first
      const jobRelated = available.filter((s) => s.natural_for_occupations.includes(jobId))
      const others = available.filter((s) => !s.natural_for_occupations.includes(jobId))

      const options: typeof CONTACT_SUBCATEGORIES_V2 = []
      // Pick from job-related
      if (jobRelated.length > 0) options.push(jobRelated[slotIdx % jobRelated.length])
      // Pick from different category
      const usedCats = new Set(options.map((o) => o.category))
      const diffCat = others.find((s) => !usedCats.has(s.category))
      if (diffCat) options.push(diffCat)
      // Fill to 3
      const remaining = available.filter((s) => !options.some((o) => o.id === s.id))
      while (options.length < 3 && remaining.length > 0) {
        options.push(remaining.splice((slotIdx * 7 + options.length) % remaining.length, 1)[0])
      }

      return options
    })
  }, [jobId, contacts])

  // Apply synergies to all selected contacts
  const contactsWithSynergy = useMemo(() => {
    const filled = contacts.filter(Boolean) as ContactV2[]
    if (filled.length < 2) return filled
    return applySynergies(filled)
  }, [contacts])

  // ── Handlers ──
  const selectMainPosition = (option: PositionOption) => {
    setSelectedMainId(option.id)
    setMainDescription('')
  }

  const selectAdditionalPosition = (slotIdx: number, option: PositionOption) => {
    const weight = getAdditionalPositionWeight(slotIdx, baseWeight)
    const newPos: AdditionalPosition = {
      slot_index: slotIdx,
      option_name: option.name,
      organization_size: option.organization_size,
      category: option.category,
      custom_description: '',
      weight,
      roll_value: weight * 25,
      is_custom: false,
      pending_st_approval: false,
    }
    const updated = [...additionalPositions]
    updated[slotIdx] = newPos
    setAdditionalPositions(updated)
  }

  const addCustomPosition = (slotIdx: number) => {
    const text = customPosInputs[slotIdx]?.trim()
    if (!text) return
    const weight = getAdditionalPositionWeight(slotIdx, baseWeight)
    const newPos: AdditionalPosition = {
      slot_index: slotIdx,
      option_name: text,
      organization_size: 'Mikro',
      category: '',
      custom_description: '',
      weight: 1,
      roll_value: 25,
      is_custom: true,
      pending_st_approval: true,
    }
    const updated = [...additionalPositions]
    updated[slotIdx] = newPos
    setAdditionalPositions(updated)
    const inputs = [...customPosInputs]
    inputs[slotIdx] = ''
    setCustomPosInputs(inputs)
  }

  const selectContact = (slotIdx: number, sub: typeof CONTACT_SUBCATEGORIES_V2[0]) => {
    const strength = calculateContactStrength({
      subcategoryId: sub.id,
      occupationId: jobId,
      skillTotals,
      isIsolatedOccupation: isIsolated,
    })
    const rollValue = calculateContactRollValue(strength, skillTotals)
    const newContact: ContactV2 = {
      slot_index: slotIdx,
      subcategory: sub.name,
      category: sub.category,
      custom_name: '',
      strength,
      roll_value: rollValue,
      synergy_bonus: 0,
      is_custom: false,
      pending_st_approval: false,
    }
    const updated = [...contacts]
    updated[slotIdx] = newContact
    setContacts(updated)
  }

  const addCustomContact = (slotIdx: number) => {
    const text = customConInputs[slotIdx]?.trim()
    if (!text) return
    const category = customConCategories[slotIdx] || ''
    const newContact: ContactV2 = {
      slot_index: slotIdx,
      subcategory: text,
      category,
      custom_name: text,
      strength: 1,
      roll_value: 25,
      synergy_bonus: 0,
      is_custom: true,
      pending_st_approval: !category,
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
      option_id: selectedMainOption.id,
      option_name: selectedMainOption.name,
      organization_size: selectedMainOption.organization_size,
      category: selectedMainOption.category,
      custom_description: mainDescription,
      strength_percent: mainStrength,
      unlock_condition: selectedMainOption.unlock_condition,
    }
    store.setMainPosition(mainPos)

    const filledPositions = additionalPositions.map((p, i) =>
      p ?? { slot_index: i, option_name: '', organization_size: '', category: '', custom_description: '', weight: 1 as const, roll_value: 25, is_custom: false, pending_st_approval: false },
    )
    const filledContacts = (contactsWithSynergy.length > 0 ? contactsWithSynergy : contacts.filter(Boolean) as ContactV2[]).map((c, i) => ({ ...c, slot_index: i }))
    // Pad to 5
    while (filledContacts.length < 5) {
      filledContacts.push({ slot_index: filledContacts.length, subcategory: '', category: '', custom_name: '', strength: 1, roll_value: 25, synergy_bonus: 0, is_custom: false, pending_st_approval: false })
    }

    store.setPositionsAndContactsV2(filledPositions, filledContacts as ContactV2[])
    store.nextStep()
  }

  return (
    <Card title="Pozycje i kontakty">
      {/* ── Section 1: Main Position ── */}
      <section className="mb-6">
        <h3 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider mb-2">
          Pozycja główna
        </h3>
        <p className="text-xs text-coc-text-muted mb-3">
          Gdzie twój Badacz jest „kimś"? Wybierz organizację lub instytucję w której masz znaczenie.
        </p>

        <div className="grid grid-cols-1 gap-2">
          {availableOptions.map((option) => {
            const strength = calculatePositionStrength({
              occupationalPoints: occPointsTotal,
              socialSkills,
              wiek: age,
              organizationSize: option.organization_size,
            })
            const isSelected = selectedMainId === option.id
            const isLocked = option.unlock_condition !== 'ZAWSZE'

            return (
              <div key={option.id}>
                <button
                  type="button"
                  onClick={() => selectMainPosition(option)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-coc-accent/10 border-coc-accent/30'
                      : 'border-coc-border hover:border-coc-accent/20 hover:bg-coc-surface-light'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isLocked ? <Unlock className="w-3.5 h-3.5 text-yellow-500" /> : null}
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
                    <textarea
                      value={mainDescription}
                      onChange={(e) => setMainDescription(e.target.value)}
                      placeholder={option.placeholder}
                      className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light min-h-[60px] resize-y"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Section 2: Additional Positions ── */}
      <section className="mb-6">
        <button
          type="button"
          onClick={() => setExpandedPosSection(!expandedPosSection)}
          className="flex items-center justify-between w-full mb-2 cursor-pointer"
        >
          <h3 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider">
            Dodatkowe pozycje (5 slotów)
          </h3>
          {expandedPosSection ? <ChevronUp className="w-4 h-4 text-coc-text-muted" /> : <ChevronDown className="w-4 h-4 text-coc-text-muted" />}
        </button>

        {expandedPosSection && (
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, slotIdx) => {
              const weight = getAdditionalPositionWeight(slotIdx, baseWeight)
              const selected = additionalPositions[slotIdx]
              // Show 3 options from cluster, cycling through
              const slotOptions = clusterOptions.filter((o) =>
                !additionalPositions.some((p, j) => p && j !== slotIdx && p.option_name === o.name),
              ).slice(slotIdx * 2 % Math.max(1, clusterOptions.length - 2), slotIdx * 2 % Math.max(1, clusterOptions.length - 2) + 3)
              // Ensure we have options
              const displayOptions = slotOptions.length > 0 ? slotOptions : clusterOptions.slice(0, 3)

              return (
                <div key={slotIdx} className="bg-coc-surface-light/30 rounded-lg p-2">
                  <div className="text-xs text-coc-text-muted mb-1">
                    Slot {slotIdx + 1}: waga {weightStars(weight)} ({weight * 25}%)
                  </div>

                  {selected ? (
                    <div className="flex items-center justify-between px-2 py-1">
                      <span className="text-sm">
                        {weightStars(selected.weight)} {selected.option_name}
                        {selected.pending_st_approval && <span className="text-yellow-500 ml-1">[ST]</span>}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...additionalPositions]
                          updated[slotIdx] = null
                          setAdditionalPositions(updated)
                        }}
                        className="text-xs text-coc-danger cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-1">
                        {displayOptions.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => selectAdditionalPosition(slotIdx, opt)}
                            className="text-left px-2 py-1.5 text-xs rounded border border-coc-border hover:border-coc-accent/30 hover:bg-coc-surface-light cursor-pointer"
                          >
                            <div className="font-medium">{opt.name}</div>
                            <div className="text-coc-text-muted">{opt.organization_size}</div>
                          </button>
                        ))}
                      </div>
                      <div className="mt-1 flex gap-1">
                        <input
                          type="text"
                          value={customPosInputs[slotIdx]}
                          onChange={(e) => {
                            const inputs = [...customPosInputs]
                            inputs[slotIdx] = e.target.value
                            setCustomPosInputs(inputs)
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && addCustomPosition(slotIdx)}
                          placeholder="Własne..."
                          className="flex-1 px-2 py-1 text-xs bg-coc-surface-light border border-coc-border rounded text-coc-text placeholder:text-coc-text-muted/50"
                        />
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Section 3: Contacts ── */}
      <section className="mb-6">
        <button
          type="button"
          onClick={() => setExpandedConSection(!expandedConSection)}
          className="flex items-center justify-between w-full mb-2 cursor-pointer"
        >
          <h3 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider">
            Kontakty (5 slotów)
          </h3>
          {expandedConSection ? <ChevronUp className="w-4 h-4 text-coc-text-muted" /> : <ChevronDown className="w-4 h-4 text-coc-text-muted" />}
        </button>

        {expandedConSection && (
          <div className="space-y-3">
            {/* Synergy info */}
            {contactsWithSynergy.some((c) => c.synergy_bonus > 0) && (
              <div className="text-xs text-coc-accent-light bg-coc-accent/10 rounded-lg px-3 py-1.5">
                ✨ Synergia: kontakty w tej samej kategorii wzmacniają się nawzajem
              </div>
            )}

            {Array.from({ length: 5 }, (_, slotIdx) => {
              const selected = contacts[slotIdx]
              const synContact = contactsWithSynergy.find((c) => c.slot_index === slotIdx)
              const options = contactOptions[slotIdx] ?? []

              return (
                <div key={slotIdx} className="bg-coc-surface-light/30 rounded-lg p-2">
                  <div className="text-xs text-coc-text-muted mb-1">Slot {slotIdx + 1}</div>

                  {selected ? (
                    <div className="flex items-center justify-between px-2 py-1">
                      <span className="text-sm">
                        {strengthDiamonds(synContact?.strength ?? selected.strength)}{' '}
                        {selected.subcategory}{' '}
                        [{synContact?.roll_value ?? selected.roll_value}%]
                        {(synContact?.synergy_bonus ?? 0) > 0 && <span className="ml-1">✨</span>}
                        {selected.pending_st_approval && <span className="text-yellow-500 ml-1">[ST]</span>}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...contacts]
                          updated[slotIdx] = null
                          setContacts(updated)
                        }}
                        className="text-xs text-coc-danger cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-1">
                        {options.map((sub) => {
                          const str = calculateContactStrength({
                            subcategoryId: sub.id,
                            occupationId: jobId,
                            skillTotals,
                            isIsolatedOccupation: isIsolated,
                          })
                          const roll = calculateContactRollValue(str, skillTotals)
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => selectContact(slotIdx, sub)}
                              className="text-left px-2 py-1.5 text-xs rounded border border-coc-border hover:border-coc-accent/30 hover:bg-coc-surface-light cursor-pointer"
                            >
                              <div className="font-medium">{sub.name}</div>
                              <div className="text-coc-text-muted">
                                {strengthDiamonds(str)} {roll}%
                                {sub.natural_for_occupations.includes(jobId) && (
                                  <span className="ml-1 text-coc-accent-light">★</span>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                      <div className="mt-1 flex gap-1">
                        <input
                          type="text"
                          value={customConInputs[slotIdx]}
                          onChange={(e) => {
                            const inputs = [...customConInputs]
                            inputs[slotIdx] = e.target.value
                            setCustomConInputs(inputs)
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && addCustomContact(slotIdx)}
                          placeholder="Własne..."
                          className="flex-1 px-2 py-1 text-xs bg-coc-surface-light border border-coc-border rounded text-coc-text placeholder:text-coc-text-muted/50"
                        />
                        <select
                          value={customConCategories[slotIdx]}
                          onChange={(e) => {
                            const cats = [...customConCategories]
                            cats[slotIdx] = e.target.value
                            setCustomConCategories(cats)
                          }}
                          className="px-1 py-1 text-xs bg-coc-surface-light border border-coc-border rounded text-coc-text"
                        >
                          <option value="">Kategoria (ST)</option>
                          {CONTACT_CATEGORIES_V2.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="secondary" onClick={() => store.prevStep()}>Wstecz</Button>
        <Button onClick={handleNext} disabled={!canContinue}>Dalej</Button>
      </div>
    </Card>
  )
}
