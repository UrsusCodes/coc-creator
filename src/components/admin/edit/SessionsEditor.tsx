import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface SessionsEditorProps {
  sessions: string[]
  onChange: (sessions: string[]) => void
}

export function SessionsEditor({ sessions, onChange }: SessionsEditorProps) {
  const [newSession, setNewSession] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')

  const handleAdd = () => {
    const trimmed = newSession.trim()
    if (!trimmed) return
    onChange([...sessions, trimmed])
    setNewSession('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  const handleDelete = (index: number) => {
    onChange(sessions.filter((_, i) => i !== index))
  }

  const startEdit = (index: number) => {
    setEditingIndex(index)
    setEditValue(sessions[index])
  }

  const confirmEdit = () => {
    if (editingIndex === null) return
    const trimmed = editValue.trim()
    if (!trimmed) return
    const updated = [...sessions]
    updated[editingIndex] = trimmed
    onChange(updated)
    setEditingIndex(null)
    setEditValue('')
  }

  const cancelEdit = () => {
    setEditingIndex(null)
    setEditValue('')
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); confirmEdit() }
    if (e.key === 'Escape') cancelEdit()
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider">Sesje</h4>

      {sessions.length > 0 && (
        <ul className="space-y-1">
          {sessions.map((session, i) => (
            <li key={i} className="flex items-center gap-2 p-2 bg-coc-surface-light rounded-lg border border-coc-border">
              {editingIndex === i ? (
                <>
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    autoFocus
                    className="flex-1 px-2 py-1 bg-coc-surface border border-coc-accent-light rounded text-sm text-coc-text focus:outline-none"
                  />
                  <button type="button" onClick={confirmEdit} className="p-1 text-green-400 hover:text-green-300 cursor-pointer">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={cancelEdit} className="p-1 text-coc-text-muted hover:text-coc-text cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm">{session}</span>
                  <button type="button" onClick={() => startEdit(i)} className="p-1 text-coc-text-muted hover:text-coc-text cursor-pointer" title="Edytuj">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => handleDelete(i)} className="p-1 text-coc-text-muted hover:text-coc-danger cursor-pointer" title="Usuń">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          value={newSession}
          onChange={(e) => setNewSession(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nazwa sesji..."
          className="flex-1 px-3 py-2 bg-coc-surface-light border border-coc-border rounded-lg text-sm text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light transition-colors"
        />
        <Button size="sm" variant="secondary" onClick={handleAdd} disabled={!newSession.trim()}>
          <Plus className="w-3.5 h-3.5" /> Dodaj sesję
        </Button>
      </div>
    </div>
  )
}
