import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { usePlayerStore } from '@/stores/playerStore'
import {
  playerGetCharacter,
  playerSetProfilePortrait,
  playerSetCardPortrait,
  playerEnhancePrompt,
} from '@/lib/player'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PortraitWorkshop } from '@/components/shared/PortraitWorkshop'
import type { CharacterSheetData } from '@/components/shared/CharacterSheet'
import type { PortraitCropData } from '@/types/character'

/**
 * Full-page workshop split into two sections:
 *
 *   1. Generator promptu — chips + 5 fields + Korekty + base/AI prompt
 *      with copy buttons for Gemini / ChatGPT / Grok shortcuts. (Output
 *      of this section is text only; the player runs it through a chat
 *      AI and brings the resulting image back.)
 *
 *   2. Edytor portretu — paste / drop / pick the chat-generated image,
 *      live preview with filter toggle (none / faded / sepia / bw) and
 *      crop overlay. Two save buttons: profile (filter only, full image)
 *      and card (filter + 3:4 crop). Each writes its respective new
 *      column added in migration 021.
 *
 * Reachable from PlayerCharacterViewer's "Zrób / załaduj portret" CTA.
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
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Nie udało się załadować postaci.'),
      )
      .finally(() => setLoading(false))
  }, [token, charId, isAuthenticated])

  if (!isAuthenticated) return <Navigate to="/player" replace />

  // ── Save handlers — single source of truth for the editor ──

  const handleSetProfilePortrait = async (publicUrl: string) => {
    if (!token || !character) return
    await playerSetProfilePortrait(token, character.id, publicUrl)
    setCharacter((prev) =>
      prev ? ({ ...prev, profile_portrait_url: publicUrl } as CharacterSheetData) : prev,
    )
  }

  const handleSetCardPortrait = async (publicUrl: string, cropData: PortraitCropData) => {
    if (!token || !character) return
    await playerSetCardPortrait(token, character.id, publicUrl, cropData)
    setCharacter((prev) =>
      prev
        ? ({
            ...prev,
            card_portrait_url: publicUrl,
            card_portrait_crop_data: cropData,
          } as CharacterSheetData)
        : prev,
    )
  }

  // Pick the most up-to-date avatar for the header thumbnail
  const headerThumbUrl =
    (character as unknown as Record<string, unknown> | null)?.profile_portrait_url as
      | string
      | undefined
    ?? character?.portrait_url
    ?? null

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

        {headerThumbUrl && (
          <div className="flex items-center gap-2">
            <img
              src={headerThumbUrl}
              alt="Aktualny portret"
              className="w-12 h-16 object-cover rounded border border-coc-border"
            />
            <span className="text-xs text-coc-text-muted">profil</span>
          </div>
        )}
      </div>

      {/* Loading / error */}
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
        <PortraitWorkshop
          character={character}
          onSetProfilePortrait={handleSetProfilePortrait}
          onSetCardPortrait={handleSetCardPortrait}
          onEnhancePrompt={async (args) => {
            if (!token) throw new Error('Sesja wygasła — zaloguj się ponownie.')
            return await playerEnhancePrompt(token, character.id, args)
          }}
        />
      )}
    </div>
  )
}
