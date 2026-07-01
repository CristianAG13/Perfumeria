import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { SEO } from '../components/SEO'

export default function Register() {
  const [name, setName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, last_name: lastName, phone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al registrarse')

      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-stone-950">
        <SEO title="Crear cuenta" noIndex />
        <div className="absolute inset-0">
          <img src="/Login.png" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-stone-950/70 via-stone-950/60 to-stone-950/80" />
          <div className="absolute inset-0 backdrop-blur-[2px]" />
        </div>
        <div className="relative w-full max-w-md animate-[fadeIn_0.6s_ease-out]">
          <div className="bg-stone-900/70 backdrop-blur-xl rounded-3xl border border-amber-500/15 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.6)] p-10 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 flex items-center justify-center ring-1 ring-emerald-400/20">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-white">¡Registrado con éxito!</h2>
            <p className="text-sm text-stone-400 leading-relaxed">
              Te enviamos un email de confirmación a <strong className="text-amber-300">{email}</strong>.<br />
              Hacé clic en el enlace para verificar tu cuenta.
            </p>
            <div className="pt-4 space-y-3">
              <Link to="/login"
                className="block w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 text-white text-sm font-semibold hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg shadow-amber-500/25">
                Ir a iniciar sesión
              </Link>
              <Link to="/" className="block text-sm text-stone-500 hover:text-amber-400 transition-colors">
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-stone-950">
      <SEO title="Crear cuenta" noIndex />
      <div className="absolute inset-0">
        <img src="/Login.png" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-stone-950/70 via-stone-950/60 to-stone-950/80" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
      </div>

      <div className="relative w-full max-w-md animate-[fadeIn_0.6s_ease-out]">
        <div className="bg-stone-900/70 backdrop-blur-xl rounded-3xl border border-amber-500/15 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.6)] shadow-amber-500/5 p-10 space-y-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/25 ring-1 ring-amber-400/20">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Crear cuenta</h1>
              <p className="text-sm text-amber-200/70 mt-1.5">Registrate para explorar nuestros productos</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 text-red-400 text-sm rounded-2xl px-5 py-3 border border-red-500/20 flex items-center gap-2.5">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-stone-300">Nombre</label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    className="w-full border border-stone-700/50 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-stone-500 bg-stone-800/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 transition-all"
                    placeholder="Tu nombre" required />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-stone-300">Apellido</label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                    className="w-full border border-stone-700/50 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-stone-500 bg-stone-800/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 transition-all"
                    placeholder="Tu apellido" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-300">Teléfono</label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full border border-stone-700/50 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-stone-500 bg-stone-800/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 transition-all"
                  placeholder="+506 8888-8888" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-300">Email</label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full border border-stone-700/50 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-stone-500 bg-stone-800/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 transition-all"
                  placeholder="tu@email.com" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-300">Contraseña</label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full border border-stone-700/50 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-stone-500 bg-stone-800/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 transition-all"
                  placeholder="Mínimo 6 caracteres" required minLength={6} />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 text-white text-sm font-semibold hover:from-amber-700 hover:to-amber-800 active:from-amber-800 active:to-amber-900 transition-all shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-sm text-stone-500">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="text-amber-400 hover:text-amber-300 transition-colors font-medium">
              Iniciar sesión
            </Link>
          </p>

          <div className="text-center">
            <Link to="/" className="text-sm text-stone-600 hover:text-amber-400 transition-colors">
              Volver al inicio
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
