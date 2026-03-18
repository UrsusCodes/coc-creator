import { useState } from 'react'
import { LogOut, KeyRound, Users, UserCog, FileEdit } from 'lucide-react'
import { useAdminStore } from '@/stores/adminStore'
import { InviteCodeManager } from './InviteCodeManager'
import { CharacterList } from './CharacterList'
import { PlayerManager } from './PlayerManager'
import { PendingEditsList } from './PendingEditsList'
import { Button } from '@/components/ui/Button'

type Tab = 'codes' | 'characters' | 'players' | 'edits'

const TABS: { id: Tab; label: string; icon: typeof KeyRound }[] = [
  { id: 'codes', label: 'Kody', icon: KeyRound },
  { id: 'characters', label: 'Postacie', icon: Users },
  { id: 'players', label: 'Gracze', icon: UserCog },
  { id: 'edits', label: 'Edycje', icon: FileEdit },
]

export function AdminDashboard() {
  const { logout } = useAdminStore()
  const [activeTab, setActiveTab] = useState<Tab>('codes')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif font-bold">Panel Strażnika Tajemnic</h2>
        <Button size="sm" variant="ghost" onClick={logout}>
          <LogOut className="w-4 h-4" /> Wyloguj
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-coc-border">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === id
                ? 'border-coc-accent-light text-coc-accent-light'
                : 'border-transparent text-coc-text-muted hover:text-coc-text'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'codes' && <InviteCodeManager />}
      {activeTab === 'characters' && <CharacterList />}
      {activeTab === 'players' && <PlayerManager />}
      {activeTab === 'edits' && <PendingEditsList />}
    </div>
  )
}
