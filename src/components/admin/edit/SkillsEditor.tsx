import { getSkillDisplayName, getSkillBase } from '@/data/skills'

interface SkillsEditorProps {
  occupationSkillPoints: Record<string, number>
  personalSkillPoints: Record<string, number>
  characteristics: Record<string, number>
  onChange: (skillId: string, totalValue: number) => void
}

export function SkillsEditor({ occupationSkillPoints, personalSkillPoints, characteristics, onChange }: SkillsEditorProps) {
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

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider">Umiejętności</h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm max-h-[300px] overflow-y-auto">
        {skills.map(([skillId, pts]) => {
          const base = getBase(skillId)
          const total = base + pts
          return (
            <div key={skillId} className="flex items-center justify-between py-0.5">
              <span className="text-coc-text-muted truncate flex-1">{getSkillDisplayName(skillId)}</span>
              <input
                type="number"
                value={total}
                onChange={(e) => onChange(skillId, parseInt(e.target.value) || 0)}
                min={base}
                max={99}
                className="w-16 text-center px-1 py-0.5 bg-coc-surface-light border border-coc-border rounded text-coc-text font-mono font-bold ml-2 focus:outline-none focus:border-coc-accent-light [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
