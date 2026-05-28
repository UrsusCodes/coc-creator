import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, PenLine, ShieldAlert, Check, AlertTriangle, Loader2, RotateCcw } from 'lucide-react'
import { Stepper } from '@/components/ui/Stepper'
import { useCharacterStore, getAllowedSteps } from '@/stores/characterStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useDraftSync } from '@/hooks/useDraftSync'
import { playerGetCharacter, playerReroll } from '@/lib/player'
import { PL } from '@/data/i18n'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { CharacterData } from '@/types/character'
import { StepInviteCode } from './StepInviteCode'
import { StepIdentifier } from './StepIdentifier'
import { StepCharacteristics } from './StepCharacteristics'
import { StepSwap } from './StepSwap'
import { StepAge } from './StepAge'
import { StepEduRolls } from './StepEduRolls'
import { StepAgingPenalties } from './StepAgingPenalties'
import { StepLuck } from './StepLuck'
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

// New step layout (granular-commits flow). Indexes are stable; conditional
// skips happen via auto-advance in a useEffect when serverCharacter signals
// the step is irrelevant (no swap perk / no EDU rolls / no aging deductions).
//
//  0 invite_code   |  9 occupation
//  1 identifier    | 10 occupation_skills
//  2 characteristics  11 personal_skills
//  3 swap          | 12 equipment (wealth+items)
//  4 age           | 13 positions_contacts
//  5 edu           | 14 backstory / drive_pillars
//  6 aging         | 15 basic_info
//  7 luck          | 16 review
//  8 derived       |
const STEP_CHARACTERISTICS = 2
const STEP_SWAP = 3
const STEP_AGE = 4
const STEP_EDU = 5
const STEP_AGING = 6
const STEP_LUCK = 7

const HARD_ZONE_STEPS = [
  STEP_CHARACTERISTICS,
  STEP_SWAP,
  STEP_AGE,
  STEP_EDU,
  STEP_AGING,
  STEP_LUCK,
] as const

function buildSteps(hasDrivePillars: boolean) {
  const backstoryLabel = hasDrivePillars ? 'Motywacja i Filary' : PL.step_backstory
  const BackstoryComponent = hasDrivePillars ? StepDrivePillars : StepBackstory

  return {
    labels: [
      PL.step_invite_code,        // 0
      'Identyfikator',            // 1
      PL.step_characteristics,    // 2
      'Zamiana cech',             // 3
      PL.step_age,                // 4
      'Rzuty na WYK',             // 5
      'Obniżenia wiekowe',        // 6
      'Szczęście',                // 7
      PL.step_derived,            // 8
      PL.step_occupation,         // 9
      PL.step_occupation_skills,  // 10
      PL.step_personal_skills,    // 11
      PL.step_equipment,          // 12
      'Pozycje i kontakty',       // 13
      backstoryLabel,             // 14
      PL.step_basic_info,         // 15
      PL.step_review,             // 16
    ],
    components: [
      StepInviteCode,
      StepIdentifier,
      StepCharacteristics,
      StepSwap,
      StepAge,
      StepEduRolls,
      StepAgingPenalties,
      StepLuck,
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

/** True if the step belongs to the server-authoritative hard zone. */
function isHardZoneStep(step: number): boolean {
  return (HARD_ZONE_STEPS as readonly number[]).includes(step)
}

/**
 * Decide whether the wizard should automatically skip the current step
 * based on the server character snapshot + age. Used by an auto-advance
 * effect so we don't render dead UI.
 */
function shouldSkip(
  step: number,
  character: CharacterData | null,
  _age: number | null,
): boolean {
  if (!character) return false
  if (step === STEP_SWAP) {
    if (!character.swap_available) return true
    if (character.swap_used) return true
    return false
  }
  // Note: STEP_EDU and STEP_AGING are intentionally NOT skipped here, even
  // when their respective requirements are zero (eduImprovementChecks === 0
  // or physicalDeductionTotal === 0). The components must mount so they can
  // call the server endpoints (/roll-edu, /apply-aging-penalties), which set
  // edu_committed_at / aging_committed_at — required gates for the next
  // hard-zone step (/roll-luck). Both components auto-commit and advance
  // the wizard themselves when there is no work to do, so the user only
  // sees a brief flicker.
  return false
}

interface WizardShellProps {
  /** When true, the shell is in edit mode (loaded from /edit/:token) */
  editMode?: boolean
}

export function WizardShell({ editMode = false }: WizardShellProps) {
  const currentStep = useCharacterStore((s) => s.currentStep)
  const inviteCodeId = useCharacterStore((s) => s.inviteCodeId)
  const perks = useCharacterStore((s) => s.perks)
  const setStep = useCharacterStore((s) => s.setStep)
  const storeEditMode = useCharacterStore((s) => s.editMode)
  const characterName = useCharacterStore((s) => s.name)
  const isDraftContinuation = useCharacterStore((s) => s.isDraftContinuation)
  const playerEditMode = useCharacterStore((s) => s.playerEditMode)
  const serverDraftId = useCharacterStore((s) => s.serverDraftId)
  const serverCharacter = useCharacterStore((s) => s.serverCharacter)
  const setServerCharacter = useCharacterStore((s) => s.setServerCharacter)
  const reset = useCharacterStore((s) => s.reset)
  const navigate = useNavigate()
  const playerToken = usePlayerStore((s) => s.token)

  const editLevel = playerEditMode ?? storeEditMode
  const allowedSteps = editLevel ? getAllowedSteps(editLevel) : null

  const [reroll, setReroll] = useState<{ open: boolean; submitting: boolean; error: string | null }>({
    open: false,
    submitting: false,
    error: null,
  })

  // Auto-save wizard progress to server (safe, with ownership checks)
  const { status: syncStatus, retry: retrySync } = useDraftSync()

  const hasDrivePillars = perks.includes('drive_pillars')
  const { labels: STEP_LABELS, components: STEP_COMPONENTS } = useMemo(
    () => buildSteps(hasDrivePillars),
    [hasDrivePillars],
  )
  const StepComponent = STEP_COMPONENTS[currentStep]

  const filteredLabels = useMemo(() => {
    if (!allowedSteps) return STEP_LABELS
    return STEP_LABELS.filter((_, i) => allowedSteps.includes(i))
  }, [STEP_LABELS, allowedSteps])

  const stepperIndex = useMemo(() => {
    if (!allowedSteps) return currentStep
    return allowedSteps.indexOf(currentStep)
  }, [allowedSteps, currentStep])

  // ── Server character snapshot ───────────────────────────────────
  // Refresh on draft id change OR step transition into a hard-zone step
  // that needs to look at swap/edu/aging state. Cheap (single GET) and
  // keeps every step rendering against the latest server truth.
  useEffect(() => {
    if (!playerToken || !serverDraftId) return
    if (editMode || playerEditMode) return
    let cancelled = false
    playerGetCharacter(playerToken, serverDraftId)
      .then((c) => {
        if (!cancelled) setServerCharacter(c as CharacterData)
      })
      .catch(() => {
        // Non-fatal — individual steps surface their own errors.
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerToken, serverDraftId, currentStep, editMode, playerEditMode])

  // ── Auto-skip irrelevant steps ──────────────────────────────────
  const lastStepRef = useRef(currentStep)
  useEffect(() => {
    if (editLevel) return
    const age = serverCharacter?.age ?? null
    if (!shouldSkip(currentStep, serverCharacter, age)) {
      lastStepRef.current = currentStep
      return
    }
    // Determine direction from previous step.
    const goingForward = currentStep >= lastStepRef.current
    let target = currentStep + (goingForward ? 1 : -1)
    while (
      target > 0 &&
      target < STEP_COMPONENTS.length &&
      shouldSkip(target, serverCharacter, age)
    ) {
      target += goingForward ? 1 : -1
    }
    // Clamp to a valid step index — the loop above can leave `target` one past
    // either end (e.g. all remaining forward steps were skippable, or backward
    // skip reached step 0). setStep(out-of-range) renders a blank component.
    const clamped = Math.max(0, Math.min(target, STEP_COMPONENTS.length - 1))
    lastStepRef.current = clamped
    setStep(clamped)
  }, [currentStep, serverCharacter, editLevel, setStep, STEP_COMPONENTS.length])

  // In edit/draft mode: step is already set by load action; skip resetting.
  // In normal mode: only reset to step 0 if there's no saved progress.
  useEffect(() => {
    if (!editMode && !isDraftContinuation && !playerEditMode) {
      if (!inviteCodeId) {
        setStep(0)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Reroll modal ────────────────────────────────────────────────
  const rerollsLeft = serverCharacter?.rerolls_remaining ?? 0
  const showRerollWidget =
    isHardZoneStep(currentStep) &&
    rerollsLeft > 0 &&
    !editLevel &&
    !!serverDraftId

  const handleReroll = async () => {
    if (!playerToken || !serverDraftId) return
    setReroll((r) => ({ ...r, submitting: true, error: null }))
    try {
      const updated = await playerReroll(playerToken, serverDraftId)
      setServerCharacter(updated)
      setReroll({ open: false, submitting: false, error: null })
      setStep(STEP_CHARACTERISTICS)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Nie udało się przerzucić'
      setReroll({ open: true, submitting: false, error: msg })
    }
  }

  return (
    <div className="space-y-6">
      {/* Edit mode banner */}
      {editLevel && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-2 text-sm text-blue-400 flex items-center gap-2">
          <PenLine className="w-4 h-4" />
          Edycja postaci: {characterName || '—'}
          <Badge variant="default">
            {editLevel === 'lore' ? 'Lore' : editLevel === 'standard' ? 'Standard' : 'Pełny'}
          </Badge>
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
        <Stepper steps={filteredLabels} currentStep={stepperIndex} />
        <div className="flex items-center gap-2">
          {showRerollWidget && (
            <button
              type="button"
              onClick={() => setReroll({ open: true, submitting: false, error: null })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-500/50 rounded-lg transition-colors cursor-pointer"
              title="Przerzut wymaże całą strefę mechaniczną"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Przerzut ({rerollsLeft})
            </button>
          )}
          {editLevel && (
            <Button variant="ghost" size="sm" onClick={() => { reset(); navigate('/player') }}>
              Powrót do panelu
            </Button>
          )}
          {!editMode && !isDraftContinuation && !playerEditMode && !editLevel && currentStep > 0 && (
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

      {/* Save status indicator */}
      {syncStatus === 'saved' && (
        <div className="flex items-center gap-1.5 text-xs text-green-400 animate-in fade-in duration-300">
          <Check className="w-3.5 h-3.5" />
          Zapisano
        </div>
      )}
      {syncStatus === 'saving' && (
        <div className="flex items-center gap-1.5 text-xs text-coc-text-muted">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Zapisywanie...
        </div>
      )}
      {syncStatus === 'error' && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-amber-400">Nie udało się zapisać. Nie zamykaj przeglądarki.</span>
          <button
            type="button"
            onClick={retrySync}
            className="ml-auto px-3 py-1 text-xs font-medium text-amber-400 border border-amber-500/40 rounded hover:bg-amber-500/20 transition-colors cursor-pointer shrink-0"
          >
            Spróbuj ponownie
          </button>
        </div>
      )}

      {/* Reroll confirmation modal */}
      {reroll.open && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <p className="text-sm text-amber-300 mb-2 font-medium">Przerzut całej mechaniki</p>
          <p className="text-sm text-coc-text-muted mb-3">
            Przerzut skasuje cechy, szczęście, wiek, rzuty na WYK, obniżenia wiekowe oraz
            wszystko, co wypełniłeś po cechach (zawód, umiejętności, ekwipunek, fabułę).
            Zostanie tylko identyfikator i kod. Pozostałe przerzuty: <strong>{rerollsLeft}</strong>.
          </p>
          {reroll.error && (
            <p className="text-sm text-coc-danger mb-2">{reroll.error}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setReroll({ open: false, submitting: false, error: null })}
              disabled={reroll.submitting}
              className="px-3 py-1.5 text-xs border border-coc-border rounded-lg text-coc-text-muted hover:text-coc-text cursor-pointer"
            >
              Anuluj
            </button>
            <button
              type="button"
              onClick={handleReroll}
              disabled={reroll.submitting}
              className="px-3 py-1.5 text-xs bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-300 hover:bg-amber-500/30 cursor-pointer flex items-center gap-1.5"
            >
              {reroll.submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              Tak, przerzuć
            </button>
          </div>
        </div>
      )}

      <div className="min-h-[400px]">
        {StepComponent && <StepComponent />}
      </div>
    </div>
  )
}
