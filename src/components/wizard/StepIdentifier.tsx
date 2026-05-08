import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useCharacterStore } from '@/stores/characterStore'
import { usePlayerStore } from '@/stores/playerStore'
import { playerStartCharacter, playerUpdateDistinguisher } from '@/lib/player'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { METHOD_LABELS, type CreationMethod } from '@/types/common'

const MIN_LEN = 3
const MAX_LEN = 60

export function StepIdentifier() {
  const store = useCharacterStore()
  const token = usePlayerStore((s) => s.token)
  const methods = store.methods.length > 0 ? store.methods : (store.method ? [store.method] : [])

  const serverDistinguisher = store.serverCharacter?.distinguisher ?? ''
  const [distinguisher, setDistinguisher] = useState(serverDistinguisher || store.name || '')
  const [method, setMethod] = useState<CreationMethod | null>(
    store.method ?? (methods.length === 1 ? methods[0] : null),
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Hydrate the field from the server snapshot once it arrives, but only if
  // the user hasn't typed anything yet (otherwise we'd clobber their input).
  const userTouchedRef = useRef(false)
  useEffect(() => {
    if (userTouchedRef.current) return
    if (serverDistinguisher && serverDistinguisher !== distinguisher) {
      setDistinguisher(serverDistinguisher)
    }
  }, [serverDistinguisher, distinguisher])

  useEffect(() => {
    if (!method && methods.length === 1) setMethod(methods[0])
  }, [method, methods])

  if (!token) {
    return (
      <Card title="Identyfikator postaci">
        <p className="text-sm text-coc-danger">
          Musisz być zalogowany, aby utworzyć postać. Zaloguj się i wróć do tego kroku.
        </p>
        <div className="flex justify-start pt-4">
          <Button variant="secondary" onClick={() => store.prevStep()}>Wstecz</Button>
        </div>
      </Card>
    )
  }

  if (!store.inviteCode) {
    return (
      <Card title="Identyfikator postaci">
        <p className="text-sm text-coc-danger">Brak kodu zaproszenia. Wróć do poprzedniego kroku.</p>
        <div className="flex justify-start pt-4">
          <Button variant="secondary" onClick={() => store.prevStep()}>Wstecz</Button>
        </div>
      </Card>
    )
  }

  const trimmed = distinguisher.trim()
  const lenValid = trimmed.length >= MIN_LEN && trimmed.length <= MAX_LEN
  const canSubmit = lenValid && method !== null && !submitting

  const handleSubmit = async () => {
    if (!canSubmit || !method) return
    setError(null)
    setSubmitting(true)
    try {
      // Resuming an existing draft: the character row already exists, so
      // /start-character would 409 ("Code already in use"). Update the
      // distinguisher in place (no-op if unchanged) and advance.
      if (store.serverDraftId) {
        if (trimmed !== serverDistinguisher) {
          await playerUpdateDistinguisher(token, store.serverDraftId, trimmed)
        }
        store.setMethod(method)
        useCharacterStore.setState({ name: trimmed })
        store.nextStep()
      } else {
        const char = await playerStartCharacter(token, {
          code: store.inviteCode!,
          distinguisher: trimmed,
          method,
        })
        store.setServerDraftId(char.id ?? null)
        store.setMethod(method)
        // Mirror identifier into the existing `name` field so the rest of the
        // wizard / dashboard can show it. Player can rename later via narrative.
        useCharacterStore.setState({ name: trimmed })
        store.nextStep()
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Nie udało się utworzyć postaci'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card title="Identyfikator postaci">
      <p className="text-sm text-coc-text-muted mb-4">
        Wybierz roboczy identyfikator dla swojej postaci (np. „Śledczy", „Kapitan",
        „Profesor"). Możesz go później zmienić — także po zatwierdzeniu postaci.
      </p>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">
          Identyfikator
          <span className="text-coc-text-muted font-normal ml-2">
            ({trimmed.length}/{MAX_LEN})
          </span>
        </label>
        <input
          type="text"
          value={distinguisher}
          onChange={(e) => {
            userTouchedRef.current = true
            setDistinguisher(e.target.value)
          }}
          maxLength={MAX_LEN}
          placeholder="np. Detektyw"
          className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-coc-text focus:outline-none focus:border-coc-accent-light transition-colors"
          disabled={submitting}
        />
        {!lenValid && trimmed.length > 0 && (
          <p className="text-xs text-coc-warning mt-1">
            Identyfikator musi mieć od {MIN_LEN} do {MAX_LEN} znaków.
          </p>
        )}
      </div>

      {methods.length > 1 && (
        <div className="mb-6">
          <p className="text-sm font-medium mb-2">Metoda tworzenia cech:</p>
          <div className="space-y-2">
            {methods.map((m) => (
              <label
                key={m}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  method === m
                    ? 'border-coc-accent bg-coc-accent/10'
                    : 'border-coc-border hover:border-coc-accent/50'
                }`}
              >
                <input
                  type="radio"
                  name="method"
                  checked={method === m}
                  onChange={() => setMethod(m)}
                  className="accent-coc-accent"
                  disabled={submitting}
                />
                <span className="text-sm font-medium">{METHOD_LABELS[m]}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {methods.length === 1 && method && (
        <p className="text-xs text-coc-text-muted mb-4">
          Metoda tworzenia cech: <span className="text-coc-text font-medium">{METHOD_LABELS[method]}</span>
        </p>
      )}

      {error && (
        <p className="text-sm text-coc-danger mb-4">{error}</p>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={() => store.prevStep()} disabled={submitting}>
          Wstecz
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Dalej'}
        </Button>
      </div>
    </Card>
  )
}
