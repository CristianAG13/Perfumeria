import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../lib/api'
import { SEO } from '../components/SEO'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-stone-950">
      <SEO title="Recuperar contraseña" noIndex />
      <div className="absolute inset-0">
        <img src="/Login.png" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-stone-950/70 via-stone-950/60 to-stone-950/80" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
      </div>

      <div className="relative w-full max-w-md animate-[fadeIn_0.6s_ease-out]">
        <div className="bg-stone-900/70 backdrop-blur-xl rounded-3xl border border-amber-500/15 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.6)] p-10 space-y-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/25 ring-1 ring-amber-400/20">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Restablecer contraseña</h1>
              <p className="text-sm text-amber-200/70 mt-1.5">Te enviamos un enlace a tu email</p>
            </div>
          </div>

          {sent ? (
            <div className="text-center space-y-6">
              <div className="bg-emerald-500/10 text-emerald-400 text-sm rounded-2xl px-5 py-4 border border-emerald-500/20">
                Si el email está registrado, recibirás un enlace para restablecer tu contraseña.<br />
                Revisá tu bandeja de entrada (y spam).
              </div>
              <Link to="/login"
                className="block w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 text-white text-sm font-semibold hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg shadow-amber-500/25 text-center">
                Volver a iniciar sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 text-red-400 text-sm rounded-2xl px-5 py-3 border border-red-500/20 flex items-center gap-2.5">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-stone-300">Email</label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full border border-stone-700/50 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-stone-500 bg-stone-800/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 transition-all"
                    placeholder="tu@email.com" required />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 text-white text-sm font-semibold hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg shadow-amber-500/25 disabled:opacity-50">
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </form>
          )}

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
