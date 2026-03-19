import { useState, useEffect } from 'react'
import { RefreshCw, MessageSquare, CheckCircle, Image, ImageOff, Loader2 } from 'lucide-react'
import { useAdminStore } from '@/stores/adminStore'
import { adminGetPortraitStatus, adminGetPortraitFeedback, adminUpdatePortraitFeedback } from '@/lib/admin'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import type { PortraitStatusEntry, PortraitFeedback } from '@/types/character'

type View = 'status' | 'feedback'

const STATUS_CONFIG: Record<
  PortraitStatusEntry['portrait_status'],
  { label: string; icon: typeof ImageOff; color: string; badge: 'default' | 'warning' | 'success' | 'danger' }
> = {
  no_portraits: { label: 'Brak portretów', icon: ImageOff, color: 'text-coc-text-muted', badge: 'default' },
  has_gallery: { label: 'Galeria dostępna', icon: Image, color: 'text-blue-400', badge: 'warning' },
  chosen: { label: 'Wybrany', icon: CheckCircle, color: 'text-green-400', badge: 'success' },
  feedback: { label: 'Uwagi gracza', icon: MessageSquare, color: 'text-orange-400', badge: 'danger' },
}

const FEEDBACK_STATUS_LABELS: Record<string, string> = {
  pending_fix: 'Do poprawy',
  in_progress: 'W trakcie',
  resolved: 'Rozwiązane',
}

export function PortraitStatusDashboard() {
  const { password } = useAdminStore()
  const [view, setView] = useState<View>('status')
  const [statusData, setStatusData] = useState<PortraitStatusEntry[]>([])
  const [feedbackData, setFeedbackData] = useState<PortraitFeedback[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [adminComment, setAdminComment] = useState<Record<string, string>>({})
  const [showResolved, setShowResolved] = useState(false)

  const load = async () => {
    if (!password) return
    setLoading(true)
    try {
      const [status, feedback] = await Promise.all([
        adminGetPortraitStatus(password),
        adminGetPortraitFeedback(password),
      ])
      setStatusData(status)
      setFeedbackData(feedback)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [password])

  const handleFeedbackUpdate = async (
    feedbackId: string,
    status: 'pending_fix' | 'in_progress' | 'resolved'
  ) => {
    if (!password) return
    setUpdatingId(feedbackId)
    try {
      const updated = await adminUpdatePortraitFeedback(password, feedbackId, {
        status,
        admin_comment: adminComment[feedbackId] ?? '',
      })
      setFeedbackData((prev) => prev.map((f) => (f.id === feedbackId ? { ...f, ...updated } : f)))
    } catch {
      // silently fail
    } finally {
      setUpdatingId(null)
    }
  }

  const pendingFeedback = feedbackData.filter((f) => f.status !== 'resolved')
  const resolvedFeedback = feedbackData.filter((f) => f.status === 'resolved')

  const summaryByStatus = {
    no_portraits: statusData.filter((c) => c.portrait_status === 'no_portraits').length,
    has_gallery: statusData.filter((c) => c.portrait_status === 'has_gallery').length,
    chosen: statusData.filter((c) => c.portrait_status === 'chosen').length,
    feedback: statusData.filter((c) => c.portrait_status === 'feedback').length,
  }

  return (
    <div className="space-y-4">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setView('status')}
            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              view === 'status'
                ? 'bg-coc-accent-light/20 text-coc-accent-light'
                : 'text-coc-text-muted hover:text-coc-text'
            }`}
          >
            Status portretów
          </button>
          <button
            onClick={() => setView('feedback')}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              view === 'feedback'
                ? 'bg-coc-accent-light/20 text-coc-accent-light'
                : 'text-coc-text-muted hover:text-coc-text'
            }`}
          >
            Uwagi graczy
            {pendingFeedback.length > 0 && (
              <span className="bg-orange-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {pendingFeedback.length}
              </span>
            )}
          </button>
        </div>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-coc-text-muted" />
        </div>
      ) : view === 'status' ? (
        <>
          {/* Summary chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.entries(STATUS_CONFIG) as [PortraitStatusEntry['portrait_status'], typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(
              ([key, cfg]) => (
                <div
                  key={key}
                  className="flex items-center gap-2 px-3 py-2 bg-coc-surface-light rounded-lg border border-coc-border"
                >
                  <cfg.icon className={`w-4 h-4 flex-shrink-0 ${cfg.color}`} />
                  <div className="min-w-0">
                    <div className="text-lg font-bold text-coc-text">{summaryByStatus[key]}</div>
                    <div className="text-[10px] text-coc-text-muted truncate">{cfg.label}</div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Per-character list */}
          <div className="space-y-1">
            {statusData.map((entry) => {
              const cfg = STATUS_CONFIG[entry.portrait_status]
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-coc-surface-light transition-colors"
                >
                  <cfg.icon className={`w-4 h-4 flex-shrink-0 ${cfg.color}`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-coc-text font-medium truncate">{entry.name}</span>
                    {entry.player_name && (
                      <span className="text-xs text-coc-text-muted ml-2">({entry.player_name})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {entry.gallery_count > 0 && (
                      <span className="text-xs text-coc-text-muted">{entry.gallery_count} war.</span>
                    )}
                    <Badge variant={cfg.badge}>{cfg.label}</Badge>
                  </div>
                </div>
              )
            })}
          </div>

          {statusData.length === 0 && (
            <p className="text-center text-sm text-coc-text-muted py-8">Brak postaci</p>
          )}
        </>
      ) : (
        <>
          {/* Pending / in_progress feedback */}
          {pendingFeedback.length === 0 ? (
            <Card>
              <p className="text-center text-sm text-coc-text-muted py-4">
                Brak oczekujących uwag od graczy
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingFeedback.map((fb) => (
                <FeedbackCard
                  key={fb.id}
                  feedback={fb}
                  comment={adminComment[fb.id] ?? ''}
                  onCommentChange={(v) => setAdminComment((prev) => ({ ...prev, [fb.id]: v }))}
                  onUpdate={handleFeedbackUpdate}
                  updating={updatingId === fb.id}
                />
              ))}
            </div>
          )}

          {/* Resolved toggle */}
          {resolvedFeedback.length > 0 && (
            <div>
              <button
                onClick={() => setShowResolved((v) => !v)}
                className="text-xs text-coc-text-muted hover:text-coc-text transition-colors"
              >
                {showResolved ? 'Ukryj' : 'Pokaż'} rozwiązane ({resolvedFeedback.length})
              </button>
              {showResolved && (
                <div className="space-y-3 mt-3">
                  {resolvedFeedback.map((fb) => (
                    <FeedbackCard
                      key={fb.id}
                      feedback={fb}
                      comment={adminComment[fb.id] ?? ''}
                      onCommentChange={(v) => setAdminComment((prev) => ({ ...prev, [fb.id]: v }))}
                      onUpdate={handleFeedbackUpdate}
                      updating={updatingId === fb.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function FeedbackCard({
  feedback: fb,
  comment,
  onCommentChange,
  onUpdate,
  updating,
}: {
  feedback: PortraitFeedback
  comment: string
  onCommentChange: (v: string) => void
  onUpdate: (id: string, status: 'pending_fix' | 'in_progress' | 'resolved') => void
  updating: boolean
}) {
  const statusBadge: Record<string, 'warning' | 'default' | 'success'> = {
    pending_fix: 'warning',
    in_progress: 'default',
    resolved: 'success',
  }

  return (
    <Card>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <img
            src={fb.variant_url}
            alt="Portret"
            className="w-12 h-16 object-cover rounded-lg border border-coc-border flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm text-coc-text">
                {(fb.characters as Record<string, unknown>)?.name as string ?? 'Postać'}
              </span>
              {((fb.players as Record<string, unknown>)?.name as string | undefined) && (
                <span className="text-xs text-coc-text-muted">
                  — {(fb.players as Record<string, unknown>).name as string}
                </span>
              )}
              <Badge variant={statusBadge[fb.status] ?? 'default'}>
                {FEEDBACK_STATUS_LABELS[fb.status] ?? fb.status}
              </Badge>
            </div>
            <p className="text-xs text-coc-text-muted mt-0.5">
              {new Date(fb.created_at).toLocaleDateString('pl-PL', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        {/* Player comment */}
        <div className="bg-coc-surface-light rounded-lg px-3 py-2">
          <p className="text-xs text-coc-text-muted mb-0.5">Komentarz gracza:</p>
          <p className="text-sm text-coc-text">{fb.comment}</p>
        </div>

        {/* Reference image */}
        {fb.reference_image_url && (
          <div>
            <p className="text-xs text-coc-text-muted mb-1">Zdjęcie referencyjne:</p>
            <img
              src={fb.reference_image_url}
              alt="Referencja"
              className="max-h-32 rounded-lg border border-coc-border object-contain"
            />
          </div>
        )}

        {/* Admin response */}
        {fb.status !== 'resolved' && (
          <div className="space-y-2">
            <input
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              placeholder="Komentarz do gracza (opcjonalny)..."
              className="w-full px-3 py-1.5 bg-coc-surface-light border border-coc-border rounded-lg text-xs text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light transition-colors"
            />
            <div className="flex gap-2">
              {fb.status === 'pending_fix' && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onUpdate(fb.id, 'in_progress')}
                  disabled={updating}
                >
                  {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  Przyjęto do realizacji
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => onUpdate(fb.id, 'resolved')}
                disabled={updating}
              >
                {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                Oznacz jako rozwiązane
              </Button>
            </div>
          </div>
        )}

        {/* Admin comment display if resolved */}
        {fb.admin_comment && (
          <div className="bg-green-900/20 border border-green-700/30 rounded-lg px-3 py-2">
            <p className="text-xs text-green-400 mb-0.5">Odpowiedź MG:</p>
            <p className="text-xs text-coc-text">{fb.admin_comment}</p>
          </div>
        )}
      </div>
    </Card>
  )
}
