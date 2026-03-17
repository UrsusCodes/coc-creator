import { useState } from 'react'
import { Dices } from 'lucide-react'
import { useCharacterStore } from '@/stores/characterStore'
import { randomName } from '@/data/names1920s'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

type Gender = 'M' | 'F'

export function StepBasicInfo() {
  const store = useCharacterStore()

  const [playerName, setPlayerName] = useState(store.playerName || '')
  const [gender, setGender] = useState<Gender | null>((store.gender as Gender) || null)
  const [name, setName] = useState(store.name || '')
  const [appearance, setAppearance] = useState(store.appearance || '')
  const [residence, setResidence] = useState(store.residence || '')
  const [birthplace, setBirthplace] = useState(store.birthplace || '')

  const handleRandomName = () => {
    if (!gender) return
    setName(randomName(gender))
  }

  const canContinue = playerName.trim().length > 0 && name.trim().length > 0 && gender !== null

  const handleNext = () => {
    if (!canContinue) return
    store.setBasicInfo({ playerName: playerName.trim(), name: name.trim(), gender: gender!, appearance: appearance.trim(), residence: residence.trim(), birthplace: birthplace.trim() })
    store.nextStep()
  }

  return (
    <Card title="Dane podstawowe">
      <div className="space-y-4">
        {/* Player name */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-coc-text-muted">Imię gracza (Twoje prawdziwe imię)</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="np. Jan Kowalski"
            className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light transition-colors"
          />
        </div>

        {/* Gender toggle */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-coc-text-muted">Płeć</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setGender('M')}
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer border ${
                gender === 'M'
                  ? 'bg-coc-accent/20 border-coc-accent/40 text-coc-accent-light'
                  : 'bg-coc-surface-light border-coc-border text-coc-text-muted hover:border-coc-accent/30'
              }`}
            >
              Mężczyzna
            </button>
            <button
              type="button"
              onClick={() => setGender('F')}
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer border ${
                gender === 'F'
                  ? 'bg-coc-accent/20 border-coc-accent/40 text-coc-accent-light'
                  : 'bg-coc-surface-light border-coc-border text-coc-text-muted hover:border-coc-accent/30'
              }`}
            >
              Kobieta
            </button>
          </div>
        </div>

        {/* Name with randomizer */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-coc-text-muted">Imię i nazwisko</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Herbert West"
              className="flex-1 px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light transition-colors"
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleRandomName}
              disabled={!gender}
              title="Losuj imię i nazwisko"
            >
              <Dices className="w-4 h-4" />
              Losuj
            </Button>
          </div>
          {!gender && (
            <p className="text-xs text-coc-text-muted">Wybierz płeć, aby losować imię.</p>
          )}
        </div>

        {/* Residence */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-coc-text-muted">Miejsce zamieszkania (opcjonalnie)</label>
          <input
            type="text"
            value={residence}
            onChange={(e) => setResidence(e.target.value)}
            placeholder="np. Arkham, Massachusetts"
            className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light transition-colors"
          />
        </div>

        {/* Birthplace */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-coc-text-muted">Miejsce urodzenia (opcjonalnie)</label>
          <input
            type="text"
            value={birthplace}
            onChange={(e) => setBirthplace(e.target.value)}
            placeholder="np. Boston, Massachusetts"
            className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light transition-colors"
          />
        </div>

        {/* Appearance */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-coc-text-muted">
            Wygląd (opcjonalnie)
          </label>
          <textarea
            value={appearance}
            onChange={(e) => setAppearance(e.target.value)}
            placeholder="Opis wyglądu postaci..."
            className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light transition-colors min-h-[80px] resize-y"
          />
        </div>

        <div className="flex justify-between pt-2">
          <Button type="button" variant="secondary" onClick={() => store.prevStep()}>
            Wstecz
          </Button>
          <Button type="button" onClick={handleNext} disabled={!canContinue}>
            Dalej
          </Button>
        </div>
      </div>
    </Card>
  )
}
