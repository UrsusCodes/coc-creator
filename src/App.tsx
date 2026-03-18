import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { CreatePage } from '@/pages/CreatePage'
import { AdminPage } from '@/pages/AdminPage'
import { SuccessPage } from '@/pages/SuccessPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { SharedCharacterPage } from '@/pages/SharedCharacterPage'
import { PlayerPage } from '@/pages/PlayerPage'

const TestPdfPage = lazy(() => import('@/pages/TestPdfPage').then(m => ({ default: m.TestPdfPage })))
const TestRollPage = lazy(() => import('@/pages/TestRollPage').then(m => ({ default: m.TestRollPage })))
const CardEditorPage = lazy(() => import('@/pages/CardEditorPage').then(m => ({ default: m.CardEditorPage })))

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/create" replace />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/player" element={<PlayerPage />} />
        <Route path="/c/:token" element={<SharedCharacterPage />} />
        <Route path="/test-pdf" element={<Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Ładowanie...</div>}><TestPdfPage /></Suspense>} />
        <Route path="/test-roll" element={<Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Ładowanie...</div>}><TestRollPage /></Suspense>} />
        <Route path="/card-editor" element={<Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Ładowanie...</div>}><CardEditorPage /></Suspense>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
