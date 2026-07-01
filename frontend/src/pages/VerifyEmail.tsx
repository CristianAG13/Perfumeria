import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyEmail } from '../lib/api'
import { SEO } from '../components/SEO'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('Token de verificación no encontrado')
      return
    }

    verifyEmail(token)
      .then(() => {
        setStatus('success')
        setMessage('¡Email verificado correctamente!')
      })
      .catch(err => {
        setStatus('error')
        setMessage(err?.response?.data?.error || 'Error al verificar el email')
      })
  }, [searchParams])

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-stone-950">
      <SEO title="Verificar email" noIndex />
      <div className="absolute inset-0">
        <img src="/Login.png" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-stone-950/70 via-stone-950/60 to-stone-950/80" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
      </div>
      <div className="relative w-full max-w-md animate-[fadeIn_0.6s_ease-out]">
        <div className="bg-stone-900/70 backdrop-blur-xl rounded-3xl border border-amber-500/15 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.6)] p-10 text-center space-y-6">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 flex items-center justify-center ring-1 ring-amber-400/20">
                <svg className="w-8 h-8 text-amber-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </div>
              <h2 className="text-xl font-bold text-white">Verificando email...</h2>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 flex items-center justify-center ring-1 ring-emerald-400/20">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-xl font-bold text-white">{message}</h2>
              <p className="text-sm text-stone-400">Ya podés iniciar sesión y explorar nuestros productos.</p>
              <Link to="/login"
                className="inline-block mt-4 px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 text-white text-sm font-semibold hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg shadow-amber-500/25">
                Iniciar sesión
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/20 flex items-center justify-center ring-1 ring-red-400/20">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h2 className="text-xl font-bold text-white">Error</h2>
              <p className="text-sm text-stone-400">{message}</p>
              <Link to="/"
                className="inline-block mt-4 px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 text-white text-sm font-semibold hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg shadow-amber-500/25">
                Volver al inicio
              </Link>
            </>
          )}
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
