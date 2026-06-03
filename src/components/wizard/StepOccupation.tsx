import { useState, useMemo, useRef } from 'react'
import { Search, ChevronDown, ChevronRight } from 'lucide-react'
import { useCharacterStore } from '@/stores/characterStore'
import { OCCUPATION_CATEGORIES, getOccupationById, getOccupationsForEra } from '@/data/occupations'
import { getSkillDisplayName } from '@/data/skills'
import { parseSkillSlot } from '@/data/occupations'
import { calculateOccupationPoints, getFormulaDisplay } from '@/hooks/useSkillPoints'
import type { Occupation } from '@/types/occupation'
import type { Characteristics } from '@/types/character'
import type { Era } from '@/types/common'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export function StepOccupation() {
  const store = useCharacterStore()
  const era = store.era as Era
  const chars = store.characteristics as Characteristics
  const isEditMode = !!(store.editMode || store.playerEditMode)
  const originalOccupationId = useRef(store.occupationId)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(store.occupationId)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set(OCCUPATION_CATEGORIES.map(c => c.id)))
  const [showCascadeWarning, setShowCascadeWarning] = useState(false)
  const [pendingOccupationId, setPendingOccupationId] = useState<string | null>(null)

  const eraOccs = useMemo(() => getOccupationsForEra(era), [era])

  const isSearching = search.trim().length > 0
  const isWildWest = era === 'wild_west'

  // WW: single alphabetical list, no category UI.
  const alphabetical = useMemo(
    () => [...eraOccs].sort((a, b) => a.name.localeCompare(b.name, 'pl')),
    [eraOccs]
  )

  // Search with skill priority: name match (score 3) > desc match (score 2) > skill match (score 1)
  const searchResults = useMemo(() => {
    if (!isSearching) return []
    const term = search.toLowerCase()
    return eraOccs
      .map((occ) => {
        const nameMatch = occ.name.toLowerCase().includes(term)
        const descMatch = occ.description?.toLowerCase().includes(term)
        const skillMatch = occ.skills.some((sid) => {
          if (sid === 'any' || sid === 'any_academic') return false
          const parsed = parseSkillSlot(sid)
          if (parsed.type === 'choice') {
            return parsed.choice.options.some((id) => getSkillDisplayName(id).toLowerCase().includes(term))
          }
          return getSkillDisplayName(sid).toLowerCase().includes(term)
        })
        const score = nameMatch ? 3 : descMatch ? 2 : skillMatch ? 1 : 0
        return { occ, score }
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || a.occ.name.localeCompare(b.occ.name, 'pl'))
      .map((r) => r.occ)
  }, [eraOccs, search, isSearching])

  // Group by category
  const grouped = useMemo(() => {
    return OCCUPATION_CATEGORIES
      .map((cat) => ({
        ...cat,
        occupations: eraOccs
          .filter((o) => o.category === cat.id)
          .sort((a, b) => a.name.localeCompare(b.name, 'pl')),
      }))
      .filter((g) => g.occupations.length > 0)
  }, [eraOccs])

  const toggleCategory = (catId: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }

  const selected = useMemo(
    () => (selectedId ? getOccupationById(selectedId) : null),
    [selectedId]
  )

  const handleNext = () => {
    if (!selectedId) return
    // In edit mode, warn if changing occupation (causes cascade reset)
    if (isEditMode && selectedId !== originalOccupationId.current) {
      setPendingOccupationId(selectedId)
      setShowCascadeWarning(true)
      return
    }
    store.setOccupation(selectedId)
    store.nextStep()
  }

  const handleCascadeConfirm = () => {
    if (pendingOccupationId) {
      store.setOccupation(pendingOccupationId)
      store.setMainPosition(null as unknown as Parameters<typeof store.setMainPosition>[0])
      store.setPositionsAndContactsV2([], [])
    }
    setShowCascadeWarning(false)
    setPendingOccupationId(null)
    store.nextStep()
  }

  const handleCascadeCancel = () => {
    setSelectedId(originalOccupationId.current)
    setShowCascadeWarning(false)
    setPendingOccupationId(null)
  }

  const renderOccItem = (occ: Occupation) => {
    const pts = calculateOccupationPoints(occ, chars)
    const isSelected = occ.id === selectedId
    return (
      <button
        key={occ.id}
        type="button"
        onClick={() => setSelectedId(occ.id)}
        className={`w-full text-left px-3 py-2 rounded-lg transition-colors cursor-pointer ${
          isSelected
            ? 'bg-coc-accent/20 border border-coc-accent/40'
            : 'hover:bg-coc-surface-light border border-transparent'
        }`}
      >
        <div className="flex justify-between items-center">
          <span className="font-medium text-sm">{occ.name}</span>
          <span className="text-xs text-coc-text-muted">{pts} pkt</span>
        </div>
        {occ.description && (
          <div className="text-xs text-coc-text-muted truncate">{occ.description}</div>
        )}
        <div className="text-xs text-coc-text-muted/70 truncate mt-0.5">
          {occ.skills.map((sid) => {
            if (sid === 'any') return 'Dowolna'
            if (sid === 'any_academic') return 'Dowolna (akad.)'
            const parsed = parseSkillSlot(sid)
            if (parsed.type === 'choice') {
              const names = parsed.choice.options.map((id) => getSkillDisplayName(id))
              return `[${names.join('/')}]`
            }
            return getSkillDisplayName(sid)
          }).join(', ')}
        </div>
      </button>
    )
  }

  return (
    <Card title="Zawód">
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-coc-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj zawodu lub umiejętności..."
            className="w-full pl-10 pr-4 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light transition-colors"
          />
        </div>
        <p className="text-xs text-coc-text-muted mt-1">
          Wyszukuj po nazwie zawodu lub dostępnych umiejętnościach.
        </p>
      </div>

      <div className="max-h-[350px] overflow-y-auto space-y-1 mb-4 pr-1">
        {isSearching ? (
          <>
            {searchResults.map(renderOccItem)}
            {searchResults.length === 0 && (
              <p className="text-sm text-coc-text-muted text-center py-4">Brak wyników.</p>
            )}
          </>
        ) : isWildWest ? (
          <div className="space-y-0.5">
            {alphabetical.map(renderOccItem)}
          </div>
        ) : (
          grouped.map((group) => {
            const isCollapsed = collapsedCategories.has(group.id)
            return (
              <div key={group.id}>
                <button
                  type="button"
                  onClick={() => toggleCategory(group.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-coc-text-muted hover:text-coc-text cursor-pointer transition-colors"
                >
                  {isCollapsed
                    ? <ChevronRight className="w-4 h-4 shrink-0" />
                    : <ChevronDown className="w-4 h-4 shrink-0" />
                  }
                  <span>{group.label}</span>
                  <span className="text-xs opacity-50">({group.occupations.length})</span>
                </button>
                {!isCollapsed && (
                  <div className="ml-2 space-y-0.5">
                    {group.occupations.map(renderOccItem)}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Selected occupation details */}
      {selected && (
        <div className="bg-coc-surface-light border border-coc-border rounded-lg p-4 mb-4">
          <h4 className="font-serif font-bold text-lg mb-1">{selected.name}</h4>
          {selected.description && (
            <p className="text-sm text-coc-text-muted mb-3">{selected.description}</p>
          )}

          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="success">
              {getFormulaDisplay(selected, chars)}
            </Badge>
            <Badge>
              Majętność: {selected.credit_rating.min}–{selected.credit_rating.max}
            </Badge>
          </div>

          <div className="mb-2">
            <span className="text-xs text-coc-text-muted">Umiejętności zawodowe:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {selected.skills.map((sid, i) => {
                let label: string
                if (sid === 'any') label = 'Dowolna'
                else if (sid === 'any_academic') label = 'Dowolna (akademicka)'
                else if (sid.startsWith('choice:')) {
                  const parsed = parseSkillSlot(sid)
                  label = parsed.type === 'choice'
                    ? parsed.choice.options.map((id) => getSkillDisplayName(id)).join(' / ')
                    : sid
                } else {
                  label = getSkillDisplayName(sid)
                }
                return (
                  <Badge key={i} variant={sid.startsWith('any') ? 'warning' : sid.startsWith('choice:') ? 'default' : 'default'}>
                    {label}
                  </Badge>
                )
              })}
              <Badge>Majętność</Badge>
            </div>
          </div>

          {selected.contacts && (
            <p className="text-xs text-coc-text-muted mt-2">
              <strong>Kontakty:</strong> {selected.contacts}
            </p>
          )}
        </div>
      )}

      {/* Cascade warning dialog for edit mode */}
      {showCascadeWarning && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
          <p className="text-sm text-amber-400 mb-3">
            Zmiana zawodu spowoduje reset umiejętności zawodowych, osobistych, pozycji i kontaktów. Kontynuować?
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleCascadeCancel}>Anuluj</Button>
            <Button onClick={handleCascadeConfirm}>Tak, zmień zawód</Button>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={() => store.prevStep()}>Wstecz</Button>
        <Button onClick={handleNext} disabled={!selectedId}>Dalej</Button>
      </div>
    </Card>
  )
}
