import clsx from 'clsx'

interface BadgeProps {
  label: string
  color?: string       // couleur hex custom
  variant?: 'default' | 'outline' | 'soft'
  size?: 'sm' | 'md'
  className?: string
}

export default function Badge({
  label,
  color,
  variant = 'soft',
  size = 'sm',
  className,
}: BadgeProps) {
  const base = clsx(
    'inline-flex items-center font-semibold rounded-full whitespace-nowrap',
    size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
    className
  )

  if (color) {
    const hex = color.replace('#', '')
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return (
      <span
        className={base}
        style={{
          backgroundColor: `rgba(${r},${g},${b},0.12)`,
          color: color,
        }}
      >
        {label}
      </span>
    )
  }

  return (
    <span
      className={clsx(
        base,
        variant === 'soft' && 'bg-surface-100 text-surface-600',
        variant === 'outline' && 'border border-surface-300 text-surface-600',
        variant === 'default' && 'bg-brand-600 text-white'
      )}
    >
      {label}
    </span>
  ) 
}

// Badges spécifiques produits
export const FAMILLE_COLORS: Record<string, string> = {
  pac_air_eau:            '#3b82f6',
  pac_air_air:            '#06b6d4',
  ballon_thermodynamique: '#f97316',
  isolation_combles:      '#f59e0b',
  isolation_exterieure:   '#eab308',
  photovoltaique:         '#22c55e',
  systeme_solaire_combine:'#84cc16',
  renovation_ampleur:     '#8b5cf6',
  cee_professionnel:      '#6b7280',
}

export const FAMILLE_LABELS: Record<string, string> = {
  pac_air_eau:            'PAC Air/Eau',
  pac_air_air:            'PAC Air/Air',
  ballon_thermodynamique: 'Ballon Thermo.',
  isolation_combles:      'Iso. Combles',
  isolation_exterieure:   'ITE',
  photovoltaique:         'Photovoltaïque',
  systeme_solaire_combine:'SSC',
  renovation_ampleur:     'Réno. Ampleur',
  cee_professionnel:      'CEE Pro',
}

// Statuts contacts
export const STATUT_CONTACT_COLORS: Record<string, string> = {
  prospect: '#3b82f6',
  client:   '#10b981',
  perdu:    '#ef4444',
  inactif:  '#6b7280',
}

export const STATUT_CONTACT_LABELS: Record<string, string> = {
  prospect: 'Prospect',
  client:   'Client',
  perdu:    'Perdu',
  inactif:  'Inactif',
}

// Statuts dossier aides
export const STATUT_DOSSIER_COLORS: Record<string, string> = {
  a_constituer: '#6b7280',
  en_cours:     '#f59e0b',
  depose:       '#3b82f6',
  valide:       '#10b981',
  verse:        '#22c55e',
}

export const STATUT_DOSSIER_LABELS: Record<string, string> = {
  a_constituer: 'À constituer',
  en_cours:     'En cours',
  depose:       'Déposé',
  valide:       'Validé',
  verse:        'Versé',
}