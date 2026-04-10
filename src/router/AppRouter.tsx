import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/layout/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'

// Lazy loading des pages secondaires
const Contacts         = lazy(() => import('@/pages/Contacts'))
const ContactDetail    = lazy(() => import('@/pages/ContactDetail'))
const Opportunites     = lazy(() => import('@/pages/Opportunites'))
const OpportuniteDetail= lazy(() => import('@/pages/OpportuniteDetail'))
const Produits         = lazy(() => import('@/pages/Produits'))
const ProduitDetail    = lazy(() => import('@/pages/ProduitDetail'))
const Aides            = lazy(() => import('@/pages/Aides'))
const Installateurs    = lazy(() => import('@/pages/Installateurs'))
const Devis            = lazy(() => import('@/pages/Devis'))
const Rapports         = lazy(() => import('@/pages/Rapports'))
const Agenda           = lazy(() => import('@/pages/Agenda'))
const Utilisateurs     = lazy(() => import('@/pages/Utilisateurs'))

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function Loader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
    </div>
  )
}

function Stub({ name }: { name: string }) {
  return (
    <div className="bg-white rounded-xl border border-surface-200 p-12 text-center">
      <p className="font-display font-semibold text-surface-600 text-lg">{name}</p>
      <p className="text-surface-400 text-sm mt-1">Page en cours de développement…</p>
    </div>
  )
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />

          <Route path="contacts" element={
            <Suspense fallback={<Loader />}><Contacts /></Suspense>
          } />
          <Route path="contacts/nouveau" element={
            <Suspense fallback={<Loader />}><ContactDetail /></Suspense>
          } />
          <Route path="contacts/:id" element={
            <Suspense fallback={<Loader />}><ContactDetail /></Suspense>
          } />

          <Route path="opportunites" element={
            <Suspense fallback={<Loader />}><Opportunites /></Suspense>
          } />
          <Route path="opportunites/:id" element={
            <Suspense fallback={<Loader />}><OpportuniteDetail /></Suspense>
          } />

          <Route path="produits" element={
            <Suspense fallback={<Loader />}><Produits /></Suspense>
          } />
          <Route path="produits/:id" element={
            <Suspense fallback={<Loader />}><ProduitDetail /></Suspense>
          } />

          <Route path="aides"         element={<Suspense fallback={<Loader />}><Aides /></Suspense>} />
          <Route path="installateurs" element={<Suspense fallback={<Loader />}><Installateurs /></Suspense>} />
          <Route path="devis"         element={<Suspense fallback={<Loader />}><Devis /></Suspense>} />
          <Route path="rapports"      element={<Suspense fallback={<Loader />}><Rapports /></Suspense>} />
          <Route path="agenda"        element={<Suspense fallback={<Loader />}><Agenda /></Suspense>} />
          <Route path="utilisateurs"  element={<Suspense fallback={<Loader />}><Utilisateurs /></Suspense>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
} 