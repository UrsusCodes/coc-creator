import { useState, useEffect, useCallback } from 'react'
import { Loader2, RefreshCw, Eye, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useAdminStore } from '@/stores/adminStore'
import { adminGetPendingEdits, adminGetPendingEdit, adminApprovePendingEdit, adminRejectPendingEdit } from '@/lib/admin'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PendingEditReview } from './PendingEditReview'

interface PendingEditRow {
  id: string
  character_id: string
  player_id: string
  proposed_data: Record<string, unknown>
  change_comment: string
  status: 'pending' | 'approved' | 'rejected'
  admin_comment: string
  created_at: string
  resolved_at: string | null
  characters: { name: string; player_name: string }
  players: { name: string; login: string }
}

export function PendingEditsList() {
  const { password } = useAdminStore()
  const [edits, setEdits] = useState<PendingEditRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [reviewData, setReviewData] = useState<{ edit: PendingEditRow; currentCharacter: Record<string, unknown> } | null>(null)
  const [reviewLoading, setReviewLoading] = useState(false)

  const fetchEdits = useCallback(async () => {
    if (!password) return
    setLoading(true)
    try {
      const data = await adminGetPendingEdits(password)
      setEdits(data)
      setError(null)
    } catch {
      setError('Błąd pobierania edycji')
    } finally {
      setLoading(false)
    }
  }, [password])

  useEffect(() => { fetchEdits() }, [fetchEdits])

  const handleReview = async (editId: string) => {
    if (!password) return
    setReviewingId(editId)
    setReviewLoading(true)
    try {
      const data = await adminGetPendingEdit(password, editId)
      setReviewData({
        edit: data,
        currentCharacter: data.characters,
      })
    } catch {
      setError('Błąd pobierania szczegółów edycji')
      setReviewingId(null)
    } finally {
      setReviewLoading(false)
    }
  }

  const handleApprove = async (editId: string, adminComment: string) => {
    if (!password) return
    try {
      await adminApprovePendingEdit(password, editId, adminComment)
      setEdits((prev) => prev.map((e) => e.id === editId ? { ...e, status: 'approved' as const, admin_comment: adminComment, resolved_at: new Date().toISOString() } : e))
      setReviewingId(null)
      setReviewData(null)
    } catch {
      setError('Błąd zatwierdzania edycji')
    }
  }

  const handleReject = async (editId: string, adminComment: string) => {
    if (!password) return
    try {
      await adminRejectPendingEdit(password, editId, adminComment)
      setEdits((prev) => prev.map((e) => e.id === editId ? { ...e, status: 'rejected' as const, admin_comment: adminComment, resolved_at: new Date().toISOString() } : e))
      setReviewingId(null)
      setReviewData(null)
    } catch {
      setError('Błąd odrzucania edycji')
    }
  }

  if (reviewingId && reviewData) {
    return (
      <PendingEditReview
        edit={reviewData.edit}
        currentCharacter={reviewData.currentCharacter}
        onBack={() => { setReviewingId(null); setReviewData(null) }}
        onApprove={(comment) => handleApprove(reviewData.edit.id, comment)}
        onReject={(comment) => handleReject(reviewData.edit.id, comment)}
      />
    )
  }

  if (reviewLoading) {
    return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-8" />
  }

  const pendingEdits = edits.filter((e) => e.status === 'pending')
  const resolvedEdits = edits.filter((e) => e.status !== 'pending')

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-serif font-bold">
          Propozycje zmian
          {pendingEdits.length > 0 && (
            <Badge variant="warning" className="ml-2">{pendingEdits.length} oczekuje</Badge>
          )}
        </h3>
        <Button size="sm" variant="ghost" onClick={fetchEdits} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {error && <p className="text-sm text-coc-danger mb-3">{error}</p>}
      {loading && <Loader2 className="w-6 h-6 animate-spin mx-auto" />}

      {!loading && edits.length === 0 && (
        <p className="text-sm text-coc-text-muted">Brak propozycji zmian.</p>
      )}

      {/* Pending first */}
      {pendingEdits.length > 0 && (
        <div className="space-y-2 mb-4">
          <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider">Oczekujące</h4>
          {pendingEdits.map((edit) => (
            <EditRow key={edit.id} edit={edit} onReview={() => handleReview(edit.id)} />
          ))}
        </div>
      )}

      {/* Resolved */}
      {resolvedEdits.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider">Rozpatrzone</h4>
          {resolvedEdits.slice(0, 20).map((edit) => (
            <EditRow key={edit.id} edit={edit} onReview={() => handleReview(edit.id)} />
          ))}
        </div>
      )}
    </Card>
  )
}

function EditRow({ edit, onReview }: { edit: PendingEditRow; onReview: () => void }) {
  return (
    <div className="flex items-center justify-between p-3 bg-coc-surface-light rounded-lg border border-coc-border">
      <div className="space-y-1 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{edit.characters?.name ?? 'Nieznana postać'}</span>
          <span className="text-sm text-coc-text-muted">
            od {edit.players?.name ?? 'Nieznany gracz'}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {edit.status === 'pending' && <Badge variant="warning"><Clock className="w-3 h-3" /> Oczekuje</Badge>}
          {edit.status === 'approved' && <Badge variant="success"><CheckCircle className="w-3 h-3" /> Zatwierdzona</Badge>}
          {edit.status === 'rejected' && <Badge variant="danger"><XCircle className="w-3 h-3" /> Odrzucona</Badge>}
        </div>
        {edit.change_comment && (
          <p className="text-xs text-coc-text-muted truncate max-w-[400px]">{edit.change_comment}</p>
        )}
        <p className="text-xs text-coc-text-muted">
          {new Date(edit.created_at).toLocaleString('pl')}
        </p>
      </div>
      <Button size="sm" variant="secondary" onClick={onReview}>
        <Eye className="w-3.5 h-3.5" /> Przejrzyj
      </Button>
    </div>
  )
}
