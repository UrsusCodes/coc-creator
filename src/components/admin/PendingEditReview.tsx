import { useState } from 'react'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface PendingEditReviewProps {
  edit: {
    id: string
    change_comment: string
    status: string
    proposed_data: Record<string, unknown>
    players: { name: string; login: string }
    characters: { name: string; player_name: string }
  }
  currentCharacter: Record<string, unknown>
  onBack: () => void
  onApprove: (comment: string) => void
  onReject: (comment: string) => void
}

// Fields to skip in diff (metadata)
const SKIP_FIELDS = new Set(['id', 'created_at', 'updated_at', 'invite_code_id', 'invite_code', 'player_id', 'status'])

// Human-readable field names
const FIELD_LABELS: Record<string, string> = {
  name: 'Imię postaci',
  player_name: 'Gracz',
  age: 'Wiek',
  gender: 'Płeć',
  appearance: 'Wygląd',
  occupation_id: 'Zawód',
  characteristics: 'Cechy',
  luck: 'Szczęście',
  derived: 'Wartości pochodne',
  occupation_skill_points: 'Umiejętności zawodowe',
  personal_skill_points: 'Umiejętności osobiste',
  backstory: 'Historia postaci',
  equipment: 'Ekwipunek',
  cash: 'Gotówka',
  assets: 'Majątek',
  spending_level: 'Poziom wydatków',
  admin_notes: 'Notatki MG',
  era: 'Era',
  method: 'Metoda',
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a == null || b == null) return a == b
  if (typeof a !== typeof b) return false
  if (typeof a !== 'object') return false

  const aObj = a as Record<string, unknown>
  const bObj = b as Record<string, unknown>
  const keys = new Set([...Object.keys(aObj), ...Object.keys(bObj)])
  for (const key of keys) {
    if (!deepEqual(aObj[key], bObj[key])) return false
  }
  return true
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '(brak)'
  if (typeof value === 'string') return value || '(puste)'
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    if (value.length === 0) return '(pusta lista)'
    return value.map((v) => typeof v === 'string' ? v : JSON.stringify(v)).join(', ')
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== 0 && v !== '' && v !== null)
    if (entries.length === 0) return '(puste)'
    return entries.map(([k, v]) => `${k}: ${v}`).join(', ')
  }
  return String(value)
}

export function PendingEditReview({ edit, currentCharacter, onBack, onApprove, onReject }: PendingEditReviewProps) {
  const [adminComment, setAdminComment] = useState('')
  const isPending = edit.status === 'pending'

  // Compute diff
  const diffs: { field: string; label: string; oldValue: unknown; newValue: unknown }[] = []
  const proposed = edit.proposed_data

  const allKeys = new Set([
    ...Object.keys(currentCharacter),
    ...Object.keys(proposed),
  ])

  for (const key of allKeys) {
    if (SKIP_FIELDS.has(key)) continue
    const oldVal = currentCharacter[key]
    const newVal = proposed[key]
    if (!deepEqual(oldVal, newVal)) {
      diffs.push({
        field: key,
        label: FIELD_LABELS[key] ?? key,
        oldValue: oldVal,
        newValue: newVal,
      })
    }
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="w-4 h-4" /> Wróć do listy
      </Button>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-serif font-bold">
              Propozycja zmian: {edit.characters?.name ?? 'Nieznana postać'}
            </h2>
            <p className="text-sm text-coc-text-muted">
              Od: {edit.players?.name} ({edit.players?.login})
            </p>
          </div>
          <Badge variant={isPending ? 'warning' : edit.status === 'approved' ? 'success' : 'danger'}>
            {isPending ? 'Oczekuje' : edit.status === 'approved' ? 'Zatwierdzona' : 'Odrzucona'}
          </Badge>
        </div>

        {edit.change_comment && (
          <div className="mb-4 p-3 bg-coc-surface-light border border-coc-border rounded-lg">
            <p className="text-sm text-coc-text-muted">Komentarz gracza:</p>
            <p className="text-sm">{edit.change_comment}</p>
          </div>
        )}

        {/* Diff view */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider">
            Zmiany ({diffs.length})
          </h3>

          {diffs.length === 0 && (
            <p className="text-sm text-coc-text-muted">Brak zmian w danych postaci.</p>
          )}

          {diffs.map((diff) => (
            <div key={diff.field} className="p-3 bg-coc-surface-light border border-coc-border rounded-lg">
              <p className="text-sm font-medium mb-2">{diff.label}</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-coc-text-muted mb-1">Obecne:</p>
                  <p className="text-sm bg-red-900/20 border border-red-700/20 rounded px-2 py-1 break-words">
                    {formatValue(diff.oldValue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-coc-text-muted mb-1">Proponowane:</p>
                  <p className="text-sm bg-green-900/20 border border-green-700/20 rounded px-2 py-1 break-words">
                    {formatValue(diff.newValue)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action section */}
        {isPending && (
          <div className="border-t border-coc-border mt-4 pt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-coc-text-muted mb-1">Komentarz (opcjonalny)</label>
              <input
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                placeholder="Komentarz dla gracza..."
                className="w-full px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => onApprove(adminComment)}>
                <CheckCircle className="w-4 h-4" /> Zatwierdź zmiany
              </Button>
              <Button variant="danger" onClick={() => onReject(adminComment)}>
                <XCircle className="w-4 h-4" /> Odrzuć
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
