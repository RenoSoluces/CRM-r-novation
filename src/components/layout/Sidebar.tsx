import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, TrendingUp, FileText,
  Package, Gift, BarChart2, Calendar,
  Settings, Wrench, LogOut, ChevronRight,
} from 'lucide-react'
import logo from '@/assets/Logo Reno Soluces.jpg'
import { useAuth } from '@/hooks/useAuth'
import { getInitiales } from '@/utils/formatters'
import type { Permission } from '@/utils/permissions'
import clsx from 'clsx'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  permission: Permission | null
  end?: boolean
}

const NAV_PRINCIPAL: NavItem[] = [
  { to: '/',             icon: LayoutDashboard, label: 'Tableau de bord', permission: null,                    end: true },
  { to: '/contacts',     icon: Users,           label: 'Contacts',        permission: 'contacts.view_own' },
  { to: '/opportunites', icon: TrendingUp,      label: 'Opportunités',    permission: 'opportunites.view_own' },
  { to: '/devis',        icon: FileText,        label: 'Devis',           permission: 'devis.view_own' },
]

const NAV_PRODUITS: NavItem[] = [
  { to: '/produits', icon: Package, label: 'Catalogue produits',  permission: 'produits.view' },
  { to: '/aides',    icon: Gift,    label: 'Aides & subventions', permission: 'produits.view' },
]

const NAV_ANALYSES: NavItem[] = [
  { to: '/rapports', icon: BarChart2, label: 'Rapports', permission: 'rapports.view_own' },
  { to: '/agenda',   icon: Calendar,  label: 'Agenda',   permission: null },
]

const NAV_ADMIN: NavItem[] = [
  { to: '/installateurs', icon: Wrench,   label: 'Installateurs', permission: 'installateurs.view' },
  { to: '/utilisateurs',  icon: Settings, label: 'Utilisateurs',  permission: 'utilisateurs.view' },
]

const ROLE_LABELS: Record<string, string> = {
  admin:      'Administrateur',
  dirigeant:  'Dirigeant',
  commercial: 'Commercial',
  apporteur:  "Apporteur d'affaires",
  regie:      'Régie Commerciale',
}

export default function Sidebar() {
  const { user, logout, can } = useAuth()

  return (
    <aside className="w-52 min-h-screen bg-brand-900 flex flex-col flex-shrink-0 shadow-sidebar">

      {/* Logo */}
      <div className="px-4 py-5 border-b border-brand-800">
        <div className="flex flex-col items-center gap-2">
          <img
            src={logo}
            alt="Reno Soluces"
            className="w-16 h-16 rounded-2xl object-cover shadow-md"
          />
          <div className="text-center">
            <p className="font-display font-bold text-white text-sm leading-tight">
              Reno Soluces
            </p>
            <p className="text-brand-400 text-[10px] leading-tight mt-0.5">
              CRM Rénovation
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        <NavSection label="PRINCIPAL" items={NAV_PRINCIPAL} can={can} />
        <NavSection label="PRODUITS"  items={NAV_PRODUITS}  can={can} />
        <NavSection label="ANALYSES"  items={NAV_ANALYSES}  can={can} />
        {(can('installateurs.view') || can('utilisateurs.view')) && (
          <NavSection label="ADMIN" items={NAV_ADMIN} can={can} />
        )}
      </nav>

      {/* Profil utilisateur */}
      <div className="border-t border-brand-800 p-3">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-brand-800 transition-colors cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold font-display flex-shrink-0">
            {user ? getInitiales(user.prenom, user.nom) : '??'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">
              {user ? `${user.prenom} ${user.nom}` : 'Utilisateur'}
            </p>
            <p className="text-brand-400 text-[10px] truncate">
              {user ? ROLE_LABELS[user.role] : ''}
            </p>
          </div>
          <button
            onClick={logout}
            title="Déconnexion"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-400 hover:text-red-400"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  )
}

function NavSection({
  label,
  items,
  can,
}: {
  label: string
  items: NavItem[]
  can: (p: Permission) => boolean
}) {
  const visible = items.filter(
    (i) => i.permission === null || can(i.permission)
  )
  if (!visible.length) return null

  return (
    <div>
      <p className="text-brand-500 text-[10px] font-bold tracking-widest px-3 mb-1.5 font-display">
        {label}
      </p>
      <ul className="space-y-0.5">
        {visible.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all group',
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-brand-300 hover:bg-brand-800 hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={14}
                    className={
                      isActive
                        ? 'text-brand-200'
                        : 'text-brand-400 group-hover:text-brand-200'
                    }
                  />
                  <span className="flex-1">{item.label}</span>
                  {isActive && (
                    <ChevronRight size={10} className="text-brand-300" />
                  )}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  )
}
