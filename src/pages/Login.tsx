import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { mockUsers } from '@/data/users'
import logo from '@/assets/Logo Reno Soluces.jpg'

const ROLE_LABELS: Record<string, string> = {
  admin:      'Administrateur',
  dirigeant:  'Dirigeant',
  commercial: 'Commercial',
  apporteur:  "Apporteur d'affaires",
  regie:      'Régie',
}

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error,        setError]        = useState('')
  const [loading,      setLoading]      = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const ok = await login(email, password)
    setLoading(false)
    if (ok) navigate('/')
    else setError('Email introuvable ou compte inactif.')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <img src={logo} alt="Reno Soluces"
              className="w-14 h-14 rounded-2xl object-cover shadow-lg" />
            <div className="text-left">
              <p className="font-display font-bold text-white text-2xl leading-tight">
                Reno Soluces
              </p>
              <p className="text-brand-400 text-sm">CRM Rénovation Énergétique</p>
            </div>
          </div>
        </div>

        {/* Carte formulaire */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="font-display font-semibold text-surface-800 text-xl mb-6">
            Connexion
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1.5">
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="vous@renosoluces.fr"
                className="w-full px-3.5 py-2.5 rounded-lg border border-surface-200 text-sm text-surface-800 placeholder-surface-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all"
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-surface-200 text-sm text-surface-800 placeholder-surface-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Erreur */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm mt-1"
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          {/* Comptes démo */}
          <div className="mt-6 pt-5 border-t border-surface-100">
            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-3">
              Comptes de démonstration
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {mockUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setEmail(u.email)}
                  className="text-left p-2.5 rounded-lg hover:bg-surface-50 border border-surface-100 hover:border-brand-200 transition-all"
                >
                  <p className="text-[11px] font-semibold text-surface-700 truncate">
                    {u.prenom} {u.nom}
                  </p>
                  <p className="text-[9px] text-surface-400 mt-0.5">
                    {ROLE_LABELS[u.role]}
                  </p>
                </button>
              ))}
            </div>
            <p className="text-[9px] text-surface-400 mt-2.5 text-center">
              Cliquez sur un compte → mot de passe : <strong>demo</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}