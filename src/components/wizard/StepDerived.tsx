import { useEffect } from 'react'
import { useCharacterStore } from '@/stores/characterStore'
import { calculateDerived } from '@/lib/derived'
import { getAgeModifications } from '@/lib/ageModifiers'
import type { Characteristics } from '@/types/character'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { halfValue, fifthValue } from '@/lib/utils'
import { CHARACTERISTIC_MAP } from '@/data/characteristics'
import type { CharacteristicKey } from '@/types/common'

export function StepDerived() {
  const store = useCharacterStore()
  const chars = store.characteristics as Characteristics
  const age = store.age ?? 25

  const derived = calculateDerived(chars)
  const mods = getAgeModifications(age)
  const moveRate = mods ? derived.move_rate - mods.moveReduction : derived.move_rate
  // Unik in CoC 7e is both a derived stat (½DEX) and a developable skill —
  // the card should show the final skill value, not the bare ½DEX. Mirror
  // the same logic used by the PDF export (exportCardPdf.ts).
  const unikPoints =
    (store.occupationSkillPoints['unik'] ?? 0) +
    (store.personalSkillPoints['unik'] ?? 0)
  const dodgeFinal = derived.dodge + unikPoints

  useEffect(() => {
    store.setDerived({ ...derived, move_rate: moveRate })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const charKeys: CharacteristicKey[] = ['STR', 'CON', 'SIZ', 'DEX', 'APP', 'INT', 'POW', 'EDU']

  return (
    <Card title="Atrybuty pochodne">
      {/* Characteristics summary with half/fifth */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-coc-text-muted mb-3">Cechy (po modyfikatorach wiekowych)</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {charKeys.map((key) => {
            const def = CHARACTERISTIC_MAP[key]
            const val = chars[key]
            return (
              <div key={key} className="bg-coc-surface-light border border-coc-border rounded-lg p-2 text-center">
                <div className="text-xs text-coc-text-muted">{def.abbreviation}</div>
                <div className="text-xl font-bold font-mono">{val}</div>
                <div className="text-xs text-coc-text-muted">
                  {halfValue(val)} / {fifthValue(val)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Derived attributes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <DerivedStat label="PW" sublabel="Punkty Wytrzymałości" value={derived.hp} />
        <DerivedStat label="PM" sublabel="Punkty Magii" value={derived.mp} />
        <DerivedStat label="PP" sublabel="Poczytalność" value={derived.san} />
        <DerivedStat label="Szczęście" value={store.luck ?? 0} />
        <DerivedStat label="PO" sublabel="Premia do Obrażeń" value={derived.db} />
        <DerivedStat label="Krzepa" value={derived.build} />
        <DerivedStat label="Ruch" value={moveRate} />
        <DerivedStat label="Unik" value={dodgeFinal} />
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={() => store.prevStep()}>Wstecz</Button>
        <Button onClick={() => store.nextStep()}>Dalej</Button>
      </div>
    </Card>
  )
}

function DerivedStat({ label, sublabel, value }: { label: string; sublabel?: string; value: number | string }) {
  return (
    <div className="bg-coc-accent/10 border border-coc-accent/20 rounded-lg p-3 text-center">
      <div className="text-xs text-coc-text-muted">{label}</div>
      {sublabel && <div className="text-[10px] text-coc-text-muted/60">{sublabel}</div>}
      <div className="text-xl font-bold font-mono text-coc-accent-light">{value}</div>
    </div>
  )
}
