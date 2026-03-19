import { useState, useEffect } from 'react'
import { LogOut, KeyRound, Users, UserCog, FileEdit, ImageIcon } from 'lucide-react'
import { useAdminStore } from '@/stores/adminStore'
import { adminGetPortraitFeedback } from '@/lib/admin'
import { InviteCodeManager } from './InviteCodeManager'
import { CharacterList } from './CharacterList'
import { PlayerManager } from './PlayerManager'
import { PendingEditsList } from './PendingEditsList'
import { PortraitStatusDashboard } from './PortraitStatusDashboard'
import { Button } from '@/components/ui/Button'

type Tab = 'codes' | 'characters' | 'players' | 'edits' | 'portraits'

export function AdminDashboard() {
  const { logout, password } = useAdminStore()
  const [activeTab, setActiveTab] = useState<Tab>('codes')
  const [pendingFeedbackCount, setPendingFeedbackCount] = useState(0)

  // Load pending feedback count for badge
  useEffect(() => {
    if (!password) return
    adminGetPortraitFeedback(password)
      .then((list) => setPendingFeedbackCount(list.filter((f: { status: string }) => f.status === 'pending_fix').length))
      .catch(() => {})
  }, [password])

  const TABS: { id: Tab; label: string; icon: typeof KeyRound; badge?: number }[] = [
    { id: 'codes', label: 'Kody', icon: KeyRound },
    { id: 'characters', label: 'Postacie', icon: Users },
    { id: 'players', label: 'Gracze', icon: UserCog },
    { id: 'edits', label: 'Edycje', icon: FileEdit },
    { id: 'portraits', label: 'Portrety', icon: ImageIcon, badge: pendingFeedbackCount },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif font-bold">Panel Strażnika Tajemnic</h2>
        <Button size="sm" variant="ghost" onClick={logout}>
          <LogOut className="w-4 h-4" /> Wyloguj
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-coc-border overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap flex-shrink-0 ${
              activeTab === id
                ? 'border-coc-accent-light text-coc-accent-light'
                : 'border-transparent text-coc-text-muted hover:text-coc-text'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {badge != null && badge > 0 && (
              <span className="bg-orange-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'codes' && <InviteCodeManager />}
      {activeTab === 'characters' && <CharacterList />}
      {activeTab === 'players' && <PlayerManager />}
      {activeTab === 'edits' && <PendingEditsList />}
      {activeTab === 'portraits' && <PortraitStatusDashboard />}
    </div>
  )
}
