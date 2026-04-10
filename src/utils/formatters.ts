import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'
import { fr } from 'date-fns/locale'

export function formatEuro(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '—'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  try {
    const d = parseISO(dateStr)
    return isValid(d) ? format(d, 'dd/MM/yyyy', { locale: fr }) : dateStr
  } catch {
    return dateStr
  }
}

export function formatDateLong(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  try {
    const d = parseISO(dateStr)
    return isValid(d) ? format(d, 'dd MMMM yyyy', { locale: fr }) : dateStr
  } catch {
    return dateStr
  }
}

export function formatRelative(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  try {
    const d = parseISO(dateStr)
    return isValid(d)
      ? formatDistanceToNow(d, { addSuffix: true, locale: fr })
      : dateStr
  } catch {
    return dateStr
  }
}

export function formatPhone(phone: string): string {
  const clean = phone.replace(/\s/g, '')
  return clean.replace(/(\d{2})(?=\d)/g, '$1 ').trim()
}

export function getInitiales(prenom: string, nom: string): string {
  return `${(prenom ?? '').charAt(0)}${(nom ?? '').charAt(0)}`.toUpperCase()
}

export function truncate(str: string, max: number): string {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '…' : str
}

export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}