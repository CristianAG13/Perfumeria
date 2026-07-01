import { Link } from 'react-router-dom'
import { SEO } from '../components/SEO'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f5f2ed] dark:bg-black flex items-center justify-center px-4">
      <SEO title="Página no encontrada" noIndex />
      <div className="text-center max-w-md">
        {/* Código 404 decorativo */}
        <div className="relative mb-8">
          <div className="text-[120px] sm:text-[160px] font-bold font-[family-name:var(--font-display)] text-transparent bg-clip-text bg-gradient-to-br from-amber-400/30 to-amber-600/10 dark:from-amber-500/20 dark:to-amber-700/5 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/20">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white mb-3 font-[family-name:var(--font-display)]">
          Página no encontrada
        </h1>
        <p className="text-stone-500 dark:text-neutral-400 mb-8 leading-relaxed">
          La página que buscás no existe o fue movida. 
          No te preocupes, te llevamos de vuelta al inicio.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-400 text-black font-bold rounded-2xl hover:from-amber-400 hover:to-amber-300 transition-all duration-300 shadow-xl shadow-amber-500/25 hover:shadow-2xl hover:shadow-amber-500/35 text-sm tracking-wide"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
