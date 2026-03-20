import { useEffect, useMemo, useState } from 'react'
import { KeyRound, Trash2, PenLine, ShieldAlert } from 'lucide-react'
import { Stepper } from '@/components/ui/Stepper'
import { useCharacterStore } from '@/stores/characterStore'
import { useDraftSync } from '@/hooks/useDraftSync'
import { PL } from '@/data/i18n'
import { supabase } from '@/lib/supabase'
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

interface WizardShellProps {
  /** When true, the shell is in edit mode (loaded from /edit/:token) */
  editMode?: boolean
}

export function WizardShell({ editMode = false }: WizardShellProps) {
  const currentStep = useCharacterStore((s) => s.currentStep)
  const timesUsed = useCharacterStore((s) => s.timesUsed)
  const maxTries = useCharacterStore((s) => s.maxTries)
  const inviteCodeId = useCharacterStore((s) => s.inviteCodeId)
  const perks = useCharacterStore((s) => s.perks)
  const setStep = useCharacterStore((s) => s.setStep)
  const abandonCharacter = useCharacterStore((s) => s.abandonCharacter)
  const storeEditMode = useCharacterStore((s) => s.editMode)
  const characterName = useCharacterStore((s) => s.name)
  const isDraftContinuation = useCharacterStore((s) => s.isDraftContinuation)
  const playerEditMode = useCharacterStore((s) => s.playerEditMode)

  const [confirmAbandon, setConfirmAbandon] = useState(false)

  // Auto-save wizard progress to server for logged-in players
  useDraftSync()

  const remainingTries = maxTries - timesUsed - 1
  const showAbandon = !editMode && currentStep >= 5 && remainingTries > 0

  const hasDrivePillars = perks.includes('drive_pillars')
  const { labels: STEP_LABELS, components: STEP_COMPONENTS } = useMemo(() => buildSteps(hasDrivePillars), [hasDrivePillars])
  const StepComponent = STEP_COMPONENTS[currentStep]

  // In edit mode / draft continuation: step is already set by load action; skip resetting to 0.
  // In normal mode: always start at step 0 (code entry) on mount.
  useEffect(() => {
    if (!editMode && !isDraftContinuation && !playerEditMode) {
      setStep(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAbandon = async () => {
    if (inviteCodeId) {
      await supabase.rpc('increment_times_used', { code_id: inviteCodeId })
    }
    abandonCharacter()
    setConfirmAbandon(false)
  }

  // Key forces remount when character is abandoned or new invite code is entered
  const characterKey = `${timesUsed}-${inviteCodeId}`

  return (
    <div className="space-y-6">
      {/* Edit mode banner */}
      {editMode && storeEditMode && !playerEditMode && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-coc-accent/10 border border-coc-accent/30 rounded-lg text-sm">
          <PenLine className="w-4 h-4 text-coc-accent-light shrink-0" />
          <span className="text-coc-accent-light font-medium">
            Edycja postaci: {characterName || '—'}
          </span>
          <span className="text-coc-text-muted ml-1">
            (tryb: {storeEditMode === 'standard' ? 'Standard' : 'Pełny'})
          </span>
        </div>
      )}

      {/* Player edit mode banner */}
      {playerEditMode && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-coc-accent/10 border border-coc-accent/30 rounded-lg text-sm">
          <PenLine className="w-4 h-4 text-coc-accent-light shrink-0" />
          <span className="text-coc-accent-light font-medium">
            Edycja postaci (uprawnienia gracza): {characterName || '—'}
          </span>
          <span className="text-coc-text-muted ml-1">
            (tryb: {playerEditMode === 'standard' ? 'Standard' : 'Pełny'})
          </span>
        </div>
      )}

      {/* Draft continuation banner */}
      {isDraftContinuation && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-amber-400 font-medium">
            Kontynuujesz postać założoną przez Strażnika Tajemnic
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Stepper steps={STEP_LABELS} currentStep={currentStep} />
        <div className="flex items-center gap-2">
          {showAbandon && !confirmAbandon && (
            <button
              type="button"
              onClick={() => setConfirmAbandon(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Usuń postać (podejście {timesUsed + 2} z {maxTries})
            </button>
          )}
          {!editMode && !isDraftContinuation && !playerEditMode && currentStep > 0 && (
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
      </div>

      {confirmAbandon && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-sm text-red-400 mb-3">
            Czy na pewno chcesz usunąć postać i zacząć od nowa? Pozostanie Ci {remainingTries - 1 > 0 ? `jeszcze ${remainingTries - 1}` : 'ostatnie'} {remainingTries - 1 === 1 ? 'podejście' : remainingTries - 1 < 5 && remainingTries - 1 > 1 ? 'podejścia' : 'podejść'}.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmAbandon(false)}
              className="px-3 py-1.5 text-xs border border-coc-border rounded-lg text-coc-text-muted hover:text-coc-text cursor-pointer"
            >
              Anuluj
            </button>
            <button
              type="button"
              onClick={handleAbandon}
              className="px-3 py-1.5 text-xs bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 hover:bg-red-500/30 cursor-pointer"
            >
              Tak, usuń postać
            </button>
          </div>
        </div>
      )}

      <div className="min-h-[400px]">
        {StepComponent && <StepComponent key={characterKey} />}
      </div>
    </div>
  )
}
