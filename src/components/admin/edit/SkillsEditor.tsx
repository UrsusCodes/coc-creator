import { useState } from 'react'
import { Plus, X, ArrowRightLeft } from 'lucide-react'
import { SKILLS, getSkillDisplayName, getSkillBase, getBaseSkillId } from '@/data/skills'

interface SkillsEditorProps {
  occupationSkillPoints: Record<string, number>
  personalSkillPoints: Record<string, number>
  characteristics: Record<string, number>
  onChange: (skillId: string, totalValue: number) => void
  onDelete: (skillId: string) => void
  onTransfer: (fromSkillId: string, toSkillId: string, points: number) => void
}

export function SkillsEditor({ occupationSkillPoints, personalSkillPoints, characteristics, onChange, onDelete, onTransfer }: SkillsEditorProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [addSkillId, setAddSkillId] = useState('')
  const [addCustomSpec, setAddCustomSpec] = useState('')
  const [transferFrom, setTransferFrom] = useState('')
  const [transferTo, setTransferTo] = useState('')
  const [transferPoints, setTransferPoints] = useState(0)

  // Merge all skill points
  const allSkillPoints: Record<string, number> = { ...occupationSkillPoints }
  for (const [id, pts] of Object.entries(personalSkillPoints)) {
    allSkillPoints[id] = (allSkillPoints[id] ?? 0) + pts
  }

  const getBase = (skillId: string) => {
    const base = getSkillBase(skillId)
    if (base === 'half_dex') return Math.floor((characteristics['DEX'] ?? 0) / 2)
    if (base === 'edu') return characteristics['EDU'] ?? 0
    return base
  }

  const skills = Object.entries(allSkillPoints)
    .filter(([, pts]) => pts > 0)
    .sort(([a], [b]) => getSkillDisplayName(a).localeCompare(getSkillDisplayName(b), 'pl'))

  const existingKeys = new Set(Object.keys(allSkillPoints).filter(k => allSkillPoints[k] > 0))

  // Build list of addable skills (not already on character)
  const addableSkills: { key: string; label: string; hasCustomSpec?: boolean }[] = []
  for (const skill of SKILLS) {
    if (skill.combatSpecializations) {
      for (const spec of skill.combatSpecializations) {
        const key = `${skill.id}:${spec.id}`
        if (!existingKeys.has(key)) {
          addableSkills.push({ key, label: `${skill.name} (${spec.name})` })
        }
      }
    } else if (skill.specializations) {
      for (const spec of skill.specializations) {
        const key = `${skill.id}:${spec}`
        if (!existingKeys.has(key)) {
          addableSkills.push({ key, label: `${skill.name} (${spec})` })
        }
      }
      addableSkills.push({ key: `${skill.id}:__custom__`, label: `${skill.name} (inna...)`, hasCustomSpec: true })
    } else {
      if (!existingKeys.has(skill.id)) {
        addableSkills.push({ key: skill.id, label: skill.name })
      }
    }
  }
  addableSkills.sort((a, b) => a.label.localeCompare(b.label, 'pl'))

  // All skill options for transfer target (existing + catalog)
  const allSkillOptions: { key: string; label: string }[] = []
  for (const skill of SKILLS) {
    if (skill.combatSpecializations) {
      for (const spec of skill.combatSpecializations) {
        allSkillOptions.push({ key: `${skill.id}:${spec.id}`, label: `${skill.name} (${spec.name})` })
      }
    } else if (skill.specializations) {
      for (const spec of skill.specializations) {
        allSkillOptions.push({ key: `${skill.id}:${spec}`, label: `${skill.name} (${spec})` })
      }
    } else {
      allSkillOptions.push({ key: skill.id, label: skill.name })
    }
  }
  // Also add existing custom specializations not in catalog
  for (const key of existingKeys) {
    if (!allSkillOptions.some(o => o.key === key)) {
      allSkillOptions.push({ key, label: getSkillDisplayName(key) })
    }
  }
  allSkillOptions.sort((a, b) => a.label.localeCompare(b.label, 'pl'))

  const selectedAddOption = addableSkills.find(o => o.key === addSkillId)

  const handleAdd = () => {
    if (!addSkillId) return
    let finalKey = addSkillId
    if (selectedAddOption?.hasCustomSpec) {
      if (!addCustomSpec.trim()) return
      finalKey = `${getBaseSkillId(addSkillId)}:${addCustomSpec.trim()}`
    }
    const base = getBase(finalKey)
    onChange(finalKey, base + 1)
    setAddSkillId('')
    setAddCustomSpec('')
  }

  const getInvestedPoints = (skillId: string) =>
    (occupationSkillPoints[skillId] ?? 0) + (personalSkillPoints[skillId] ?? 0)

  const maxTransfer = transferFrom ? getInvestedPoints(transferFrom) : 0

  const handleTransfer = () => {
    if (!transferFrom || !transferTo || transferPoints <= 0 || transferFrom === transferTo) return
    onTransfer(transferFrom, transferTo, transferPoints)
    setTransferFrom('')
    setTransferTo('')
    setTransferPoints(0)
  }

  const selectClass = 'w-full px-2 py-1.5 bg-coc-surface border border-coc-border rounded text-sm text-coc-text focus:outline-none focus:border-coc-accent-light'
  const btnClass = 'px-3 py-1 bg-coc-accent/20 text-coc-accent-light text-xs font-medium rounded hover:bg-coc-accent/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider">Umiejętności</h4>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => { setShowAdd(!showAdd); setShowTransfer(false) }}
            className={`p-1 rounded transition-colors cursor-pointer ${showAdd ? 'text-coc-accent-light bg-coc-accent/10' : 'text-coc-text-muted hover:text-coc-text'}`}
            title="Dodaj umiejętność"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => { setShowTransfer(!showTransfer); setShowAdd(false) }}
            className={`p-1 rounded transition-colors cursor-pointer ${showTransfer ? 'text-coc-accent-light bg-coc-accent/10' : 'text-coc-text-muted hover:text-coc-text'}`}
            title="Przenieś punkty"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add skill panel */}
      {showAdd && (
        <div className="bg-coc-surface-light border border-coc-border rounded-lg p-3 space-y-2">
          <select value={addSkillId} onChange={(e) => { setAddSkillId(e.target.value); setAddCustomSpec('') }} className={selectClass}>
            <option value="">-- Wybierz umiejętność --</option>
            {addableSkills.map(o => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
          {selectedAddOption?.hasCustomSpec && (
            <input
              value={addCustomSpec}
              onChange={(e) => setAddCustomSpec(e.target.value)}
              placeholder="Nazwa specjalizacji..."
              className={selectClass}
            />
          )}
          <button
            type="button"
            onClick={handleAdd}
            disabled={!addSkillId || (!!selectedAddOption?.hasCustomSpec && !addCustomSpec.trim())}
            className={btnClass}
          >
            Dodaj
          </button>
        </div>
      )}

      {/* Transfer panel */}
      {showTransfer && (
        <div className="bg-coc-surface-light border border-coc-border rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <label className="text-coc-text-muted shrink-0 w-8">Z:</label>
            <select
              value={transferFrom}
              onChange={(e) => { setTransferFrom(e.target.value); setTransferPoints(0) }}
              className={selectClass}
            >
              <option value="">-- Źródłowa --</option>
              {skills.map(([id]) => (
                <option key={id} value={id}>{getSkillDisplayName(id)} ({getInvestedPoints(id)} pkt)</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <label className="text-coc-text-muted shrink-0 w-8">Na:</label>
            <select value={transferTo} onChange={(e) => setTransferTo(e.target.value)} className={selectClass}>
              <option value="">-- Docelowa --</option>
              {transferFrom && (
                <>
                  {skills.filter(([id]) => id !== transferFrom).length > 0 && (
                    <optgroup label="Istniejące">
                      {skills.filter(([id]) => id !== transferFrom).map(([id]) => (
                        <option key={id} value={id}>{getSkillDisplayName(id)}</option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Nowe">
                    {allSkillOptions.filter(o => o.key !== transferFrom && !existingKeys.has(o.key)).map(o => (
                      <option key={o.key} value={o.key}>{o.label}</option>
                    ))}
                  </optgroup>
                </>
              )}
            </select>
          </div>
          {transferFrom && (
            <div className="flex items-center gap-2 text-sm">
              <label className="text-coc-text-muted shrink-0 w-8">Pkt:</label>
              <input
                type="number"
                value={transferPoints || ''}
                onChange={(e) => setTransferPoints(Math.min(maxTransfer, Math.max(0, parseInt(e.target.value) || 0)))}
                min={1}
                max={maxTransfer}
                placeholder="0"
                className="w-20 px-2 py-1.5 bg-coc-surface border border-coc-border rounded text-sm text-coc-text font-mono text-center focus:outline-none focus:border-coc-accent-light [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-xs text-coc-text-muted">/ {maxTransfer} dostępnych</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleTransfer}
            disabled={!transferFrom || !transferTo || transferPoints <= 0 || transferFrom === transferTo}
            className={btnClass}
          >
            Przenieś
          </button>
        </div>
      )}

      {/* Skills list */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm max-h-[300px] overflow-y-auto">
        {skills.map(([skillId, pts]) => {
          const base = getBase(skillId)
          const total = base + pts
          return (
            <div key={skillId} className="flex items-center py-0.5">
              <span className="text-coc-text-muted truncate flex-1">{getSkillDisplayName(skillId)}</span>
              <input
                type="number"
                value={total}
                onChange={(e) => onChange(skillId, parseInt(e.target.value) || 0)}
                min={base}
                max={99}
                className="w-14 text-center px-1 py-0.5 bg-coc-surface-light border border-coc-border rounded text-coc-text font-mono font-bold ml-2 focus:outline-none focus:border-coc-accent-light [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => onDelete(skillId)}
                className="p-0.5 text-coc-text-muted/40 hover:text-coc-danger transition-colors cursor-pointer ml-0.5 shrink-0"
                title="Usuń umiejętność"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
