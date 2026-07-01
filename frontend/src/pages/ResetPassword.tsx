import { useState, type FormEvent } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { resetPassword } from '../lib/api'
import { SEO } from '../components/SEO'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, password)
      setSuccess(true)
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message || 'Error al restablecer la contraseña'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 bg-stone-950">
        <SEO title="Restablecer contraseña" noIndex />
        <div className="bg-stone-900/70 rounded-3xl border border-red-500/20 p-10 max-w-md text-center space-y-4">
          <h1 className="text-xl font-bold text-white">Enlace inválido</h1>
          <p className="text-stone-400">Este enlace de restablecimiento no es válido. Solicitá uno nuevo.</p>
          <Link to="/forgot-password"
            className="inline-block px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 text-white text-sm font-semibold">
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 bg-stone-950">
        <SEO title="Restablecer contraseña" noIndex />
        <div className="bg-stone-900/70 rounded-3xl border border-emerald-500/20 p-10 max-w-md text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Contraseña actualizada</h1>
            <p className="text-stone-400 mt-2">Ya podés iniciar sesión con tu nueva contraseña.</p>
          </div>
          <button onClick={() => navigate('/login')}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 text-white text-sm font-semibold hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg shadow-amber-500/25">
            Iniciar sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-stone-950">
      <SEO title="Restablecer contraseña" noIndex />
      <div className="absolute inset-0">
        <img src="/Login.png" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-stone-950/70 via-stone-950/60 to-stone-950/80" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
      </div>

      <div className="relative w-full max-w-md animate-[fadeIn_0.6s_ease-out]">
        <div className="bg-stone-900/70 backdrop-blur-xl rounded-3xl border border-amber-500/15 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.6)] p-10 space-y-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/25 ring-1 ring-amber-400/20">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Nueva contraseña</h1>
              <p className="text-sm text-amber-200/70 mt-1.5">Ingresá tu nueva contraseña</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 text-red-400 text-sm rounded-2xl px-5 py-3 border border-red-500/20 flex items-center gap-2.5">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-300">Nueva contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full border border-stone-700/50 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-stone-500 bg-stone-800/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 transition-all"
                placeholder="••••••" required minLength={6} />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-300">Confirmar contraseña</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                className="w-full border border-stone-700/50 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-stone-500 bg-stone-800/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 transition-all"
                placeholder="••••••" required minLength={6} />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 text-white text-sm font-semibold hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg shadow-amber-500/25 disabled:opacity-50">
              {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
          </form>

          <div className="text-center">
            <Link to="/login" className="text-sm text-stone-500 hover:text-amber-400 transition-colors">
              Volver a iniciar sesión
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
