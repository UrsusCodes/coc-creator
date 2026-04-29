import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { usePlayerStore } from '@/stores/playerStore'
import { playerGetCharacter } from '@/lib/player'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PortraitGallery } from '@/components/player/PlayerCharacterViewer'
import type { CharacterSheetData } from '@/components/shared/CharacterSheet'
import type { PortraitCropData } from '@/types/character'

/**
 * Dedicated full-page workshop for portrait generation + management.
 * Reachable from PlayerCharacterViewer's "Zrób / załaduj portret"
 * button. Embeds the same PortraitGallery container the character
 * viewer uses (Generate panel + variant grid + crop/feedback modals),
 * but on its own page with a clean header.
 */
export function PlayerPortraitWorkshopPage() {
  const { charId } = useParams<{ charId: string }>()
  const { token, isAuthenticated } = usePlayerStore()
  const navigate = useNavigate()

  const [character, setCharacter] = useState<CharacterSheetData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || !token || !charId) return
    setLoading(true)
    setError(null)
    playerGetCharacter(token, charId)
      .then((data) => setCharacter(data as CharacterSheetData))
      .catch((err) => setError(err instanceof Error ? err.message : 'Nie udało się załadować postaci.'))
      .finally(() => setLoading(false))
  }, [token, charId, isAuthenticated])

  if (!isAuthenticated) return <Navigate to="/player" replace />

  const handlePortraitChange = (url: string, cropData?: PortraitCropData | null) => {
    setCharacter((prev) =>
      prev
        ? ({
            ...prev,
            portrait_url: url,
            portrait_crop_data: cropData ?? undefined,
          } as CharacterSheetData)
        : prev,
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/player')}>
            <ArrowLeft className="w-4 h-4" /> Powrót
          </Button>
          <div>
            <h1 className="text-xl font-serif font-bold text-coc-text">
              Pracownia portretu
            </h1>
            {character && (
              <p className="text-sm text-coc-text-muted">{character.name}</p>
            )}
          </div>
        </div>

        {/* Current portrait preview */}
        {character?.portrait_url && (
          <div className="flex items-center gap-2">
            <img
              src={character.portrait_url}
              alt="Aktualny portret"
              className="w-12 h-16 object-cover rounded border border-coc-border"
            />
            <span className="text-xs text-coc-text-muted">na karcie</span>
          </div>
        )}
      </div>

      {/* Loading / error / content */}
      {loading && (
        <Card>
          <div className="flex items-center justify-center gap-2 text-coc-text-muted py-6">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Ładowanie postaci…</span>
          </div>
        </Card>
      )}

      {error && !loading && (
        <Card>
          <p className="text-sm text-coc-danger">Błąd: {error}</p>
          <Button variant="secondary" size="sm" onClick={() => navigate('/player')} className="mt-2">
            Wróć do listy postaci
          </Button>
        </Card>
      )}

      {character && !loading && !error && (
        <PortraitGallery
          character={character}
          onPortraitChange={handlePortraitChange}
        />
      )}
    </div>
  )
}
