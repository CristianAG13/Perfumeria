import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { updateProfile } from '../lib/api'
import { SEO } from '../components/SEO'

export default function ProfileCompletion() {
  const { user, setAuth } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await updateProfile({ name, last_name: lastName, phone, email: user?.email || '' })
      setAuth(res.token, res.user)

      if (res.user.role === 'admin') {
        navigate('/admin/ventas', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar el perfil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 px-4">
      <SEO title="Completar perfil" noIndex />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white text-2xl font-bold shadow-lg shadow-amber-500/20 mb-4">
            A&F
          </div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white">
            Completá tu perfil
          </h1>
          <p className="text-sm text-stone-500 dark:text-neutral-400 mt-1">
            Necesitamos algunos datos para terminar tu registro
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-stone-200 dark:border-neutral-800 space-y-5">

          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-neutral-300 mb-1.5">Nombre</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                className="w-full px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-neutral-800/80 border border-stone-200 dark:border-neutral-700 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all text-sm"
                placeholder="Tu nombre" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-neutral-300 mb-1.5">Apellido</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required
                className="w-full px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-neutral-800/80 border border-stone-200 dark:border-neutral-700 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all text-sm"
                placeholder="Tu apellido" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-neutral-300 mb-1.5">Teléfono</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-neutral-800/80 border border-stone-200 dark:border-neutral-700 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all text-sm"
              placeholder="+506 8888-8888" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/20">
            {loading ? 'Guardando...' : 'Guardar perfil'}
          </button>
        </form>
      </div>
    </div>
  )
}
