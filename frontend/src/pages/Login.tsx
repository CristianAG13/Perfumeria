import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { login as apiLogin, googleAuth } from '../lib/api'
import { SEO } from '../components/SEO'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login: contextLogin, setAuth } = useAuth()
  const navigate = useNavigate()
  const googleBtnRef = useRef<HTMLDivElement>(null)

  // Google Sign-In
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'poner-tu-google-client-id-aqui' || !googleBtnRef.current) {
      return
    }

    if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = initGIS
      document.head.appendChild(script)
    } else if (typeof (window as any).google !== 'undefined') {
      initGIS()
    }

    function initGIS() {
      try {
        const g = (window as any).google
        if (!g?.accounts) return
        g.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredential,
        })
        g.accounts.id.renderButton(googleBtnRef.current!, {
          type: 'standard',
          shape: 'pill',
          theme: 'outline',
          text: 'continue_with',
          size: 'large',
          width: 300,
        })
      } catch (_) { /* origin not allowed — ignorar */ }
    }

    function handleGoogleCredential(response: { credential: string }) {
      if (!response?.credential) {
        setError('Google no devolvió un token válido')
        return
      }
      setLoading(true)
      setError('')
      googleAuth(response.credential)
        .then(res => {
          setAuth(res.token, res.user, res.refresh_token)
          if (!res.user.profile_complete) {
            navigate('/complete-profile', { replace: true })
          } else if (res.user.role === 'admin') {
            navigate('/admin/ventas', { replace: true })
          } else {
            navigate('/', { replace: true })
          }
        })
        .catch(err => {
          const msg = err?.response?.data?.error || 'Error al autenticar con Google'
          setError(msg)
        })
        .finally(() => setLoading(false))
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await apiLogin(email, password)
      await contextLogin(email, password)
      if (res.user.role === 'admin') {
        navigate('/admin/ventas', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message || 'Error al iniciar sesión'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-stone-950">
      <SEO title="Iniciar sesión" noIndex />
      <div className="absolute inset-0">
        <img src="/Login.png" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-stone-950/70 via-stone-950/60 to-stone-950/80" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
      </div>

      <div className="relative w-full max-w-md animate-[fadeIn_0.6s_ease-out]">
        <div className="bg-stone-900/70 backdrop-blur-xl rounded-3xl border border-amber-500/15 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.6)] shadow-amber-500/5 p-10 space-y-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/25 ring-1 ring-amber-400/20">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Iniciar sesión</h1>
              <p className="text-sm text-amber-200/70 mt-1.5">Bienvenido de vuelta a Perfumería A y F</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 text-red-400 text-sm rounded-2xl px-5 py-3 border border-red-500/20 animate-[shake_0.3s_ease-in-out] flex items-center gap-2.5">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-300">Email o usuario</label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <input type="text" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email"
                  className="w-full border border-stone-700/50 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-stone-500 bg-stone-800/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 transition-all"
                  placeholder="email o usuario" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-300">Contraseña</label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"
                  className="w-full border border-stone-700/50 rounded-2xl pl-11 pr-11 py-3.5 text-sm text-white placeholder-stone-500 bg-stone-800/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 transition-all"
                  placeholder="••••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors">
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              <div className="text-right">
                <Link to="/forgot-password" className="text-xs text-amber-400/70 hover:text-amber-300 transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 text-white text-sm font-semibold hover:from-amber-700 hover:to-amber-800 active:from-amber-800 active:to-amber-900 transition-all shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          {/* Google Sign-In */}
          {GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'poner-tu-google-client-id-aqui' && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-700/30" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-stone-900/70 text-stone-500">O continuar con</span>
                </div>
              </div>
              <div ref={googleBtnRef} className="flex justify-center min-h-[40px]" />
            </>
          )}

          <p className="text-center text-sm text-stone-500">
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="text-amber-400 hover:text-amber-300 transition-colors font-medium">
              Crear cuenta
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
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  )
}
