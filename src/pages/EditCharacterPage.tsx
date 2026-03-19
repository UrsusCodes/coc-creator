import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, AlertTriangle } from 'lucide-react'
import { publicGetCharacter } from '@/lib/public'
import { useCharacterStore } from '@/stores/characterStore'
import { WizardShell } from '@/components/wizard/WizardShell'

export function EditCharacterPage() {
  const { token } = useParams<{ token: string }>()
  const loadForEdit = useCharacterStore((s) => s.loadForEdit)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Brak tokenu w adresie URL.')
      setLoading(false)
      return
    }

    let cancelled = false

    publicGetCharacter(token)
      .then((data) => {
        if (cancelled) return

        if (data.tokenType !== 'wizard_edit') {
          setError('Ten link nie jest linkiem do edycji postaci przez kreator.')
          setLoading(false)
          return
        }

        if (!data.editMode) {
          setError('Nieprawidłowy token edycji — brak trybu edycji.')
          setLoading(false)
          return
        }

        const char = data.character as unknown as Record<string, unknown>

        loadForEdit({
          characterId: (char.id as string) ?? '',
          token,
          editMode: data.editMode,
          character: char,
          era: (char.era as string) ?? 'classic_1920',
          perks: [],
          maxSkillValue: 99,
        })

        setReady(true)
        setLoading(false)
      })
      .catch((err: Error) => {
        if (cancelled) return
        setError(err.message ?? 'Błąd ładowania postaci.')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, loadForEdit])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] gap-3 text-coc-text-muted">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Ładowanie postaci do edycji...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto mt-16 p-6 bg-coc-danger/10 border border-coc-danger/30 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-coc-danger mt-0.5 shrink-0" />
          <div>
            <h2 className="font-semibold text-coc-danger mb-1">Nie można otworzyć linku do edycji</h2>
            <p className="text-sm text-coc-text-muted">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!ready) return null

  return <WizardShell editMode />
}
