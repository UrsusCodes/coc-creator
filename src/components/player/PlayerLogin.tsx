import { useState } from 'react'
import { Lock, User, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePlayerStore } from '@/stores/playerStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function PlayerLogin() {
  const navigate = useNavigate()
  const { login } = usePlayerStore()
  const [loginInput, setLoginInput] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginInput.trim() || !password.trim()) return

    setLoading(true)
    setError(null)

    const ok = await login(loginInput.trim(), password)
    if (!ok) {
      setError('Nieprawidłowy login lub hasło.')
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card title="Panel Gracza" className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-coc-text-muted" />
            <input
              type="text"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              placeholder="Login"
              className="w-full pl-11 pr-4 py-2.5 bg-coc-surface-light border border-coc-border rounded-lg text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light transition-colors"
              autoFocus
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-coc-text-muted" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Hasło"
              className="w-full pl-11 pr-4 py-2.5 bg-coc-surface-light border border-coc-border rounded-lg text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light transition-colors"
            />
          </div>

          {error && <p className="text-sm text-coc-danger">{error}</p>}

          <Button type="submit" disabled={!loginInput.trim() || !password.trim() || loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Zaloguj'}
          </Button>
        </form>

        <div className="mt-4 pt-4 border-t border-coc-border">
          <button
            type="button"
            onClick={() => navigate('/create')}
            className="w-full text-sm text-coc-text-muted hover:text-coc-text transition-colors cursor-pointer py-2"
          >
            Kontynuuj bez konta →
          </button>
        </div>
      </Card>
    </div>
  )
}
