import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { KeyRound, Loader2, RotateCcw, PlayCircle } from 'lucide-react'
import { useCharacterStore } from '@/stores/characterStore'
import { useInviteCode } from '@/hooks/useInviteCode'
import { supabase } from '@/lib/supabase'
import { PERKS } from '@/data/perks'
import { PL } from '@/data/i18n'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ExportButtons } from '@/components/shared/ExportButtons'
import { ERA_LABELS } from '@/types/common'
import type { CharacterData } from '@/types/character'

const STEP_NAMES = [
  PL.step_invite_code,
  PL.step_characteristics,
  PL.step_age,
  PL.step_age_modifiers,
  PL.step_derived,
  PL.step_occupation,
  PL.step_occupation_skills,
  PL.step_personal_skills,
  PL.step_backstory,
  PL.step_equipment,
  PL.step_basic_info,
  PL.step_review,
]

export function StepInviteCode() {
  const store = useCharacterStore()
  const { loading, error, inviteCode, validate } = useInviteCode()
  const [searchParams] = useSearchParams()
  const [code, setCode] = useState(store.inviteCode ?? searchParams.get('code') ?? '')
  const [resumeAvailable, setResumeAvailable] = useState(false)
  const [submittedCharacter, setSubmittedCharacter] = useState<CharacterData | null>(null)

  // Auto-validate if code comes from URL param
  const urlCode = searchParams.get('code')
  const autoValidated = useRef(false)
  useEffect(() => {
    if (urlCode && !autoValidated.current && !inviteCode) {
      autoValidated.current = true
      setCode(urlCode)
      const runAutoValidate = async () => {
        setSubmittedCharacter(null)
        const result = await validate(urlCode)
        if (result) {
          const { data: existingChar } = await supabase
            .from('characters')
            .select('*')
            .eq('invite_code_id', result.id)
            .eq('status', 'submitted')
            .maybeSingle()
          if (existingChar) {
            setSubmittedCharacter(existingChar as CharacterData)
          }
          const isSameCode = result.id === store.inviteCodeId
          const methods = result.methods ?? [result.method]
          const autoMethod = methods.length === 1 ? methods[0] : null
          if (isSameCode && store.savedStep > 0) {
            setResumeAvailable(true)
            store.updateInviteCodeMeta({ timesUsed: result.times_used })
          } else {
            setResumeAvailable(false)
            store.setInviteCode({
              id: result.id,
              code: result.code,
              methods,
              method: autoMethod,
              era: result.era,
              perks: result.perks ?? [],
              maxTries: result.max_tries,
              timesUsed: result.times_used,
              maxSkillValue: result.max_skill_value ?? 80,
            })
          }
        }
      }
      runAutoValidate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleValidate = async () => {
    setSubmittedCharacter(null)
    const result = await validate(code)
    if (result) {
      const { data: existingChar } = await supabase
        .from('characters')
        .select('*')
        .eq('invite_code_id', result.id)
        .eq('status', 'submitted')
        .maybeSingle()
      if (existingChar) {
        setSubmittedCharacter(existingChar as CharacterData)
      }

      const isSameCode = result.id === store.inviteCodeId
      const methods = result.methods ?? [result.method]
      const autoMethod = methods.length === 1 ? methods[0] : null

      if (isSameCode && store.savedStep > 0) {
        setResumeAvailable(true)
        store.updateInviteCodeMeta({ timesUsed: result.times_used })
      } else {
        setResumeAvailable(false)
        store.setInviteCode({
          id: result.id,
          code: result.code,
          methods,
          method: autoMethod,
          era: result.era,
          perks: result.perks ?? [],
          maxTries: result.max_tries,
          timesUsed: result.times_used,
          maxSkillValue: result.max_skill_value ?? 80,
        })
      }
    }
  }

  const handleResume = () => {
    store.setStep(store.savedStep)
  }

  const handleStartFresh = () => {
    setResumeAvailable(false)
    const ic = inviteCode!
    const methods = ic.methods ?? [ic.method]
    const autoMethod = methods.length === 1 ? methods[0] : null
    store.setInviteCode({
      id: ic.id,
      code: ic.code,
      methods,
      method: autoMethod,
      era: ic.era,
      perks: ic.perks ?? [],
      maxTries: ic.max_tries,
      timesUsed: ic.times_used,
      maxSkillValue: ic.max_skill_value ?? 80,
    })
  }

  const handleContinue = () => {
    store.nextStep()
  }

  const perks = inviteCode?.perks ?? []

  return (
    <Card title="Kod zaproszenia">
      <p className="text-coc-text-muted text-sm mb-6">
        Wprowadź kod otrzymany od Strażnika Tajemnic, aby rozpocząć tworzenie Badacza.
      </p>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-coc-text-muted" />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="np. ABC-1234-XYZ"
            className="w-full pl-11 pr-4 py-2.5 bg-coc-surface-light border border-coc-border rounded-lg text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light transition-colors font-mono tracking-wider"
            disabled={loading}
            onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
          />
        </div>
        <Button onClick={handleValidate} disabled={!code.trim() || loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sprawdź'}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-coc-danger mb-4">{error}</p>
      )}

      {inviteCode && (
        <div className="bg-coc-surface-light border border-coc-accent/30 rounded-lg p-4 space-y-3">
          <p className="text-sm text-coc-accent-light font-medium">Kod prawidłowy!</p>
          <div className="flex flex-wrap gap-3">
            <div>
              <span className="text-xs text-coc-text-muted">Era: </span>
              <Badge>{ERA_LABELS[inviteCode.era]}</Badge>
            </div>
            <div>
              <span className="text-xs text-coc-text-muted">Użycia: </span>
              <Badge variant={inviteCode.times_used >= inviteCode.max_tries - 1 ? 'warning' : 'default'}>
                {inviteCode.times_used} / {inviteCode.max_tries}
              </Badge>
            </div>
          </div>

          {/* Submitted character — view & export */}
          {submittedCharacter && (
            <div className="bg-green-900/20 border border-green-700/40 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-green-400">
                Znaleziono zatwierdzoną postać
              </p>
              <div className="text-sm space-y-1">
                <div><span className="text-coc-text-muted">Postać:</span> {submittedCharacter.name}</div>
                {submittedCharacter.player_name && (
                  <div><span className="text-coc-text-muted">Gracz:</span> {submittedCharacter.player_name}</div>
                )}
              </div>
              <ExportButtons character={submittedCharacter as unknown as Parameters<typeof ExportButtons>[0]['character']} />
              <p className="text-xs text-coc-text-muted">
                Jeśli chcesz stworzyć nową postać, użyj opcji poniżej. Poprzednia postać zostanie zastąpiona.
              </p>
            </div>
          )}

          {/* Resume existing character */}
          {resumeAvailable && (
            <div className="bg-coc-accent/10 border border-coc-accent/30 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-coc-accent-light">
                Znaleziono postać w trakcie tworzenia
              </p>
              <p className="text-xs text-coc-text-muted">
                Masz niezakończoną postać{store.name ? ` (${store.name})` : ''}. Ostatni krok: {STEP_NAMES[store.savedStep] ?? `Krok ${store.savedStep}`}.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleResume} className="flex items-center gap-1.5">
                  <PlayCircle className="w-4 h-4" />
                  Kontynuuj
                </Button>
                <Button variant="secondary" onClick={handleStartFresh} className="flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4" />
                  Zacznij od nowa
                </Button>
              </div>
            </div>
          )}

          {/* Continue (no method picker — moved to StepIdentifier) */}
          {!resumeAvailable && (
            <>
              {/* Perks display */}
              {perks.length > 0 && (
                <div>
                  <span className="text-xs text-coc-text-muted">Perki: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {perks.map((p) => {
                      const perk = PERKS.find((pk) => pk.id === p)
                      return perk ? (
                        <Badge key={p} variant="warning">{perk.name}</Badge>
                      ) : null
                    })}
                  </div>
                </div>
              )}

              {inviteCode.times_used > 0 && (
                <p className="text-xs text-coc-warning">
                  Uwaga: Ten kod był już użyty. Poprzednia postać zostanie zastąpiona nową.
                </p>
              )}
              <Button onClick={handleContinue} className="mt-2">
                Dalej
              </Button>
            </>
          )}
        </div>
      )}
    </Card>
  )
}
