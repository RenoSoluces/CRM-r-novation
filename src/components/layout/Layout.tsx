import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const PAGE_TITLES: Record<string, string> = {
  '/':              'Tableau de bord',
  '/contacts':      'Contacts',
  '/opportunites':  'Opportunités',
  '/devis':         'Devis',
  '/produits':      'Catalogue produits',
  '/aides':         'Aides & subventions',
  '/rapports':      'Rapports',
  '/agenda':        'Agenda',
  '/installateurs': 'Installateurs',
  '/utilisateurs':  'Utilisateurs',
}

export default function Layout() {
  const { pathname } = useLocation()
  const base = '/' + pathname.split('/')[1]
  const title = PAGE_TITLES[base] ?? 'RenoSoluces CRM'

  return (
    <div className="flex min-h-screen bg-surface-50 font-body">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
} 