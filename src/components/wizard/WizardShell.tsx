import { useEffect, useMemo } from 'react'
import { KeyRound } from 'lucide-react'
import { Stepper } from '@/components/ui/Stepper'
import { useCharacterStore } from '@/stores/characterStore'
import { PL } from '@/data/i18n'
import { StepInviteCode } from './StepInviteCode'
import { StepCharacteristics } from './StepCharacteristics'
import { StepAge } from './StepAge'
import { StepAgeModifiers } from './StepAgeModifiers'
import { StepDerived } from './StepDerived'
import { StepOccupation } from './StepOccupation'
import { StepOccupationSkills } from './StepOccupationSkills'
import { StepPersonalSkills } from './StepPersonalSkills'
import { StepBackstory } from './StepBackstory'
import { StepDrivePillars } from './StepDrivePillars'
import { StepEquipment } from './StepEquipment'
import { StepPositionsContacts } from './StepPositionsContacts'
import { StepBasicInfo } from './StepBasicInfo'
import { StepReview } from './StepReview'

function buildSteps(hasDrivePillars: boolean) {
  const backstoryLabel = hasDrivePillars ? 'Motywacja i Filary' : PL.step_backstory
  const BackstoryComponent = hasDrivePillars ? StepDrivePillars : StepBackstory

  return {
    labels: [
      PL.step_invite_code,
      PL.step_characteristics,
      PL.step_age,
      PL.step_age_modifiers,
      PL.step_derived,
      PL.step_occupation,
      PL.step_occupation_skills,
      PL.step_personal_skills,
      PL.step_equipment,
      'Pozycje i kontakty',
      backstoryLabel,
      PL.step_basic_info,
      PL.step_review,
    ],
    components: [
      StepInviteCode,
      StepCharacteristics,
      StepAge,
      StepAgeModifiers,
      StepDerived,
      StepOccupation,
      StepOccupationSkills,
      StepPersonalSkills,
      StepEquipment,
      StepPositionsContacts,
      BackstoryComponent,
      StepBasicInfo,
      StepReview,
    ],
  }
}

export function WizardShell() {
  const currentStep = useCharacterStore((s) => s.currentStep)
  const timesUsed = useCharacterStore((s) => s.timesUsed)
  const inviteCodeId = useCharacterStore((s) => s.inviteCodeId)
  const perks = useCharacterStore((s) => s.perks)
  const setStep = useCharacterStore((s) => s.setStep)

  const hasDrivePillars = perks.includes('drive_pillars')
  const { labels: STEP_LABELS, components: STEP_COMPONENTS } = useMemo(() => buildSteps(hasDrivePillars), [hasDrivePillars])
  const StepComponent = STEP_COMPONENTS[currentStep]

  // On mount (page refresh), always start at step 0 (code entry)
  useEffect(() => {
    setStep(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Key forces remount when character is abandoned or new invite code is entered
  const characterKey = `${timesUsed}-${inviteCodeId}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Stepper steps={STEP_LABELS} currentStep={currentStep} />
        {currentStep > 0 && (
          <button
            type="button"
            onClick={() => setStep(0)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-coc-text-muted hover:text-coc-accent-light border border-coc-border hover:border-coc-accent/50 rounded-lg transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            Zmień kod
          </button>
        )}
      </div>
      <div className="min-h-[400px]">
        {StepComponent && <StepComponent key={characterKey} />}
      </div>
    </div>
  )
}
