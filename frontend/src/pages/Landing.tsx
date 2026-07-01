import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getStoreProducts, getStoreCategories, getStoreTestimonials } from '../lib/api'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { formatCents } from '../lib/format'
import { CartSidebar } from '../components/CartSidebar'
import { SEO } from '../components/SEO'
import type { Product, Category, CartItem } from '../lib/types'

const whatsapp = '50688888888'
const phone = '+506 8888-8888'
const address = 'San José, Costa Rica'
const email = 'info@perfumeriaayf.com'

function formatPrice(n: number) {
  return formatCents(n)
}

function seedFromId(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function ratingFromId(id: string): number {
  return 4 + (seedFromId(id) % 10) / 10
}

function soldCount(id: string): number {
  return 20 + (seedFromId(id) % 180)
}

function starsArray(r: number): ('full' | 'half' | 'empty')[] {
  const a: ('full' | 'half' | 'empty')[] = []
  for (let i = 1; i <= 5; i++) {
    if (r >= i) a.push('full')
    else if (r >= i - 0.5) a.push('half')
    else a.push('empty')
  }
  return a
}

function Star({ type }: { type: 'full' | 'half' | 'empty' }) {
  if (type === 'full') {
    return (
      <svg className="w-4 h-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    )
  }
  if (type === 'half') {
    return (
      <svg className="w-4 h-4" viewBox="0 0 20 20">
        <defs>
          <linearGradient id="half-star">
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#d4d4d4" />
          </linearGradient>
        </defs>
        <path fill="url(#half-star)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    )
  }
  return (
    <svg className="w-4 h-4 text-stone-300 dark:text-neutral-600" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

function ProductCard({ product, onSelect, onAddToCart, isFavorited, onToggleFavorite }: { product: Product; onSelect: (p: Product) => void; onAddToCart: (p: Product) => void; isFavorited?: boolean; onToggleFavorite?: (p: Product) => void }) {
  const hasDiscount = product.discount_percent > 0
  const finalPrice = hasDiscount ? product.discount_price : product.sale_price
  const [imgError, setImgError] = useState(false)

  const genderLabel = product.gender === 'ella' ? '♀' : product.gender === 'el' ? '♂' : null
  const genderColor = product.gender === 'ella'
    ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300'
    : product.gender === 'el'
    ? 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300'
    : ''

  return (
    <div
      onClick={() => onSelect(product)}
      className="card-lift group relative flex-shrink-0 w-[180px] sm:w-[200px] snap-start cursor-pointer"
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-stone-100 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 group-hover:border-amber-400/40 group-hover:shadow-xl group-hover:shadow-amber-500/10 dark:group-hover:shadow-amber-500/5 transition-all duration-500">
        {/* Image — full-bleed background */}
        {product.image && !imgError ? (
          <img
            src={product.image}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-xl bg-amber-100 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-400/70 dark:text-amber-600/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          </div>
        )}

        {/* Gender badge */}
        {genderLabel && (
          <div className="absolute top-2 right-2 z-10">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${genderColor}`}>
              {genderLabel}
            </span>
          </div>
        )}

        {/* Discount badge (ribbon style) */}
        {hasDiscount && (
          <div className="absolute top-2 left-0 z-10">
            <div className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-r-full shadow-lg shadow-red-600/20">
              -{product.discount_percent}%
            </div>
          </div>
        )}

        {/* Sold out */}
        {product.current_stock <= 0 && (
          <div className="absolute inset-0 bg-white/70 dark:bg-black/70 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="bg-white dark:bg-neutral-800 text-stone-500 dark:text-neutral-400 text-xs font-bold px-4 py-2 rounded-full border border-stone-200 dark:border-neutral-700 shadow-lg">
              AGOTADO
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent dark:from-black dark:via-black/40 dark:to-transparent opacity-0 group-hover:opacity-100 transition-all duration-400 z-10 flex flex-col justify-end p-4">
          <p className="text-xs text-stone-600 dark:text-neutral-300 line-clamp-2 mb-3 leading-relaxed font-medium">
            {product.brand || product.category}
          </p>
          <div className="flex gap-2">
            <button onClick={e => { e.stopPropagation(); onAddToCart(product) }}
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20">
              Comprar
            </button>
            <button onClick={e => { e.stopPropagation(); onToggleFavorite?.(product) }}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border shadow-sm ${
                isFavorited
                  ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700/30 text-rose-500'
                  : 'bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-stone-700 dark:text-white border-stone-200 dark:border-white/10'
              }`}>
              {isFavorited ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Info below card */}
      <div className="mt-3 px-0.5">
        <div className="flex items-center gap-1.5 mb-0.5">
          {genderLabel && (
            <span className={`text-[10px] font-bold ${genderColor.split(' ').slice(0, 2).join(' ')}`}>{genderLabel}</span>
          )}
          <p className="text-[11px] text-stone-400 dark:text-neutral-500 truncate font-medium tracking-wide uppercase">
            {product.brand || product.category}
          </p>
        </div>
        <p className="text-sm font-semibold text-stone-900 dark:text-white truncate leading-tight">{product.name}</p>
        <div className="flex items-baseline gap-1.5 mt-1.5">
          {hasDiscount ? (
            <>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{formatPrice(finalPrice)}</span>
              <span className="text-[10px] text-stone-400 dark:text-neutral-500 line-through">{formatPrice(product.sale_price)}</span>
            </>
          ) : (
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{formatPrice(product.sale_price)}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function ProductRow({ title, products, onSelect, onAddToCart, favorites, onToggleFavorite }: { title: string; products: Product[]; onSelect: (p: Product) => void; onAddToCart: (p: Product) => void; favorites?: string[]; onToggleFavorite?: (p: Product) => void }) {
  const rowRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    if (!rowRef.current) return
    const amount = 600
    rowRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  if (products.length === 0) return null

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4 px-4 sm:px-8 lg:px-16">
        <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white font-[family-name:var(--font-display)]">{title}</h2>
        <div className="flex gap-2">
          <button onClick={() => scroll('left')} className="w-8 h-8 rounded-full bg-stone-200/80 dark:bg-neutral-800/80 hover:bg-stone-300 dark:hover:bg-neutral-700 text-stone-500 dark:text-neutral-400 hover:text-stone-700 dark:hover:text-white flex items-center justify-center transition-all border border-stone-300/50 dark:border-neutral-700/50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={() => scroll('right')} className="w-8 h-8 rounded-full bg-stone-200/80 dark:bg-neutral-800/80 hover:bg-stone-300 dark:hover:bg-neutral-700 text-stone-500 dark:text-neutral-400 hover:text-stone-700 dark:hover:text-white flex items-center justify-center transition-all border border-stone-300/50 dark:border-neutral-700/50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
      <div
        ref={rowRef}
        className="flex gap-3 overflow-x-auto px-4 sm:px-8 lg:px-16 pb-4 snap-x snap-mandatory scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map(p => (
          <ProductCard key={p.id} product={p} onSelect={onSelect} onAddToCart={onAddToCart} isFavorited={favorites?.includes(p.id)} onToggleFavorite={onToggleFavorite} />
        ))}
      </div>
    </section>
  )
}

function CategoriesCarousel({ categories, onSelect }: { categories: Category[]; onSelect: (cat: Category) => void }) {
  const rowRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    if (!rowRef.current) return
    const amount = 400
    rowRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  if (categories.length === 0) return null

  const gradients = [
    'from-amber-500/20 to-amber-600/10',
    'from-rose-500/20 to-rose-600/10',
    'from-sky-500/20 to-sky-600/10',
    'from-emerald-500/20 to-emerald-600/10',
    'from-violet-500/20 to-violet-600/10',
  ]

  return (
    <section className="py-12 reveal">
      <div className="flex items-center justify-between mb-6 px-4 sm:px-8 lg:px-16">
        <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white font-[family-name:var(--font-display)]">Categorías</h2>
        <div className="flex gap-2">
          <button onClick={() => scroll('left')} className="w-8 h-8 rounded-full bg-stone-200/80 dark:bg-neutral-800/80 hover:bg-stone-300 dark:hover:bg-neutral-700 text-stone-500 dark:text-neutral-400 hover:text-stone-700 dark:hover:text-white flex items-center justify-center transition-all border border-stone-300/50 dark:border-neutral-700/50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={() => scroll('right')} className="w-8 h-8 rounded-full bg-stone-200/80 dark:bg-neutral-800/80 hover:bg-stone-300 dark:hover:bg-neutral-700 text-stone-500 dark:text-neutral-400 hover:text-stone-700 dark:hover:text-white flex items-center justify-center transition-all border border-stone-300/50 dark:border-neutral-700/50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
      <div
        ref={rowRef}
        className="flex gap-4 overflow-x-auto px-4 sm:px-8 lg:px-16 pb-2 snap-x snap-mandatory scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((cat, i) => {
          const gradient = gradients[i % gradients.length]
          const initial = cat.name.charAt(0).toUpperCase()
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat)}
              className="group flex-shrink-0 w-[140px] sm:w-[160px] snap-start"
            >
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 group-hover:border-amber-400/40 transition-all duration-500 group-hover:shadow-xl group-hover:shadow-amber-500/10 dark:group-hover:shadow-amber-500/5">
                {cat.image ? (
                  <>
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  </>
                ) : (
                  <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${gradient} dark:from-neutral-800 dark:to-neutral-900`}>
                    <span className="text-4xl sm:text-5xl font-bold text-stone-300 dark:text-neutral-600 font-[family-name:var(--font-display)]">
                      {initial}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                  <span className="text-sm font-semibold text-white font-[family-name:var(--font-display)] tracking-wide">
                    {cat.name}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function GenderSelector({ selected, onChange }: { selected: string | undefined; onChange: (g: string | undefined) => void }) {
  return (
    <section className="relative overflow-hidden">
      {/* Background image covering all */}
      <div className="absolute inset-0">
        <img src="/Genero.png" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Split layout: Ella left, Él right — selección sutil */}
      <div className="relative grid grid-cols-1 md:grid-cols-2 min-h-[500px]">
        {/* Ella Side — rosa */}
        <button
          onClick={() => onChange(selected === 'ella' ? undefined : 'ella')}
          className={`relative flex flex-col items-center justify-center p-12 transition-all duration-700 ${
            selected === 'ella'
              ? 'bg-rose-500/10'
              : selected === 'el'
              ? 'opacity-40 hover:opacity-70'
              : 'hover:bg-white/5'
          }`}
        >
          <div className={`absolute inset-0 bg-gradient-to-t from-rose-900/30 via-transparent to-transparent transition-opacity duration-700 ${selected === 'ella' ? 'opacity-100' : 'opacity-0'}`} />
          <div className="relative text-center">
            <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center transition-all duration-700 ${
              selected === 'ella'
                ? 'bg-rose-400 shadow-lg shadow-rose-400/30'
                : 'bg-white/10 border border-white/20'
            }`}>
              <span className={`text-3xl transition-all duration-700 ${selected === 'ella' ? 'text-white' : 'opacity-70'}`}>♀</span>
            </div>
            <h3 className={`text-5xl md:text-6xl font-bold mb-3 transition-all duration-700 font-[family-name:var(--font-display)] ${
              selected === 'ella' ? 'text-rose-300' : 'text-white/80'
            }`}>Ella</h3>
            <p className={`text-sm max-w-xs mx-auto transition-all duration-700 ${
              selected === 'ella' ? 'text-rose-200/80' : 'text-white/40'
            }`}>
              Perfumes florales, dulces y sofisticados
            </p>
            {selected === 'ella' && (
              <span className="inline-block mt-6 px-5 py-1.5 bg-rose-400 text-white text-xs font-semibold rounded-full shadow-lg shadow-rose-400/20">
                Explorar
              </span>
            )}
          </div>
        </button>

        {/* Divider line */}
        <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-2/3 bg-gradient-to-b from-transparent via-white/10 to-transparent" />

        {/* Él Side — azul */}
        <button
          onClick={() => onChange(selected === 'el' ? undefined : 'el')}
          className={`relative flex flex-col items-center justify-center p-12 transition-all duration-700 ${
            selected === 'el'
              ? 'bg-sky-500/10'
              : selected === 'ella'
              ? 'opacity-40 hover:opacity-70'
              : 'hover:bg-white/5'
          }`}
        >
          <div className={`absolute inset-0 bg-gradient-to-t from-blue-900/30 via-transparent to-transparent transition-opacity duration-700 ${selected === 'el' ? 'opacity-100' : 'opacity-0'}`} />
          <div className="relative text-center">
            <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center transition-all duration-700 ${
              selected === 'el'
                ? 'bg-sky-400 shadow-lg shadow-sky-400/30'
                : 'bg-white/10 border border-white/20'
            }`}>
              <span className={`text-3xl transition-all duration-700 ${selected === 'el' ? 'text-white' : 'opacity-70'}`}>♂</span>
            </div>
            <h3 className={`text-5xl md:text-6xl font-bold mb-3 transition-all duration-700 font-[family-name:var(--font-display)] ${
              selected === 'el' ? 'text-sky-300' : 'text-white/80'
            }`}>Él</h3>
            <p className={`text-sm max-w-xs mx-auto transition-all duration-700 ${
              selected === 'el' ? 'text-sky-200/80' : 'text-white/40'
            }`}>
              Perfumes amaderados, frescos y masculinos
            </p>
            {selected === 'el' && (
              <span className="inline-block mt-6 px-5 py-1.5 bg-sky-400 text-white text-xs font-semibold rounded-full shadow-lg shadow-sky-400/20">
                Explorar
              </span>
            )}
          </div>
        </button>

        {/* Botón para deseleccionar */}
        {selected && (
          <button
            onClick={() => onChange(undefined)}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-1.5 text-xs text-white/40 hover:text-white/70 transition-all"
          >
            Ver todos los productos
          </button>
        )}
      </div>
    </section>
  )
}

function ServicesSection() {
  const services = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
      ),
      title: 'Envíos a todo Costa Rica',
      desc: 'Recibí tu pedido en la puerta de tu casa con la mejor logística.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
      ),
      title: '100% Originales',
      desc: 'Trabajamos con distribuidores autorizados. Garantía de autenticidad.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" /></svg>
      ),
      title: 'Mejor Precio',
      desc: 'Compar nuestros precios. Te garantizamos la mejor relación calidad-precio.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      ),
      title: 'Entrega Rápida',
      desc: 'Procesamos tu pedido en el día. Recibilo en 24-48 horas hábiles.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
      ),
      title: 'Atención Personalizada',
      desc: 'Te asesoramos a encontrar el perfume ideal para vos o para regalar.',
    },
  ]

  return (
    <section className="py-20 border-t border-stone-200 dark:border-neutral-900 transition-colors duration-300">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-16">
        <div className="text-center mb-12 reveal">
          <span className="text-amber-600 dark:text-amber-500 font-semibold text-xs tracking-widest uppercase">Por qué elegirnos</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white mt-3 font-[family-name:var(--font-display)]">Todo lo que necesitás</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 reveal-stagger">
          {services.map((s, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white dark:bg-neutral-900/50 border border-stone-200 dark:border-neutral-800 hover:border-amber-500/20 hover:bg-stone-50 dark:hover:bg-neutral-900 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 group-hover:bg-amber-200 dark:group-hover:bg-amber-500/20 transition-colors">
                {s.icon}
              </div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white mb-2">{s.title}</h3>
              <p className="text-xs text-stone-500 dark:text-neutral-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialsSection({ testimonials }: { testimonials: { name: string; text: string; rating: number }[] }) {
  if (testimonials.length === 0) return null

  return (
    <section className="py-20 border-t border-stone-200 dark:border-neutral-900 bg-stone-100/50 dark:bg-neutral-950/50 transition-colors duration-300">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-16">
        <div className="text-center mb-12 reveal">
          <span className="text-amber-600 dark:text-amber-500 font-semibold text-xs tracking-widest uppercase">Testimonios</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white mt-3 font-[family-name:var(--font-display)]">Lo que dicen nuestros clientes</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 reveal-stagger">
          {testimonials.map((t, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map(s => (
                  <svg key={s} className={`w-4 h-4 ${s <= t.rating ? 'text-amber-400' : 'text-stone-200 dark:text-neutral-600'}`} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-stone-600 dark:text-neutral-400 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold">
                  {t.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-900 dark:text-white">{t.name}</p>
                  <p className="text-xs text-stone-400 dark:text-neutral-500">Cliente verificada</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProductDetailFull({ product, onClose, onAddToCart }: { product: Product; onClose: () => void; onAddToCart: (p: Product, qty: number) => void }) {
  const [quantity, setQuantity] = useState(1)
  const [imgError, setImgError] = useState(false)
  const [selectedImg, setSelectedImg] = useState(0)

  const hasDiscount = product.discount_percent > 0
  const finalPrice = hasDiscount ? product.discount_price : product.sale_price
  const subtotal = finalPrice * quantity
  const rating = ratingFromId(product.id)
  const sold = soldCount(product.id)
  const stars = starsArray(rating)

  const thumbs = [product.image, product.image, product.image, product.image]

  return (
    <div className="fixed inset-0 bg-black/60 z-50 overflow-y-auto backdrop-blur-sm" onClick={onClose}>
      <div className="min-h-full flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
        <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
          <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>

          <div className="grid md:grid-cols-2 gap-0">
            {/* Left - Image Gallery */}
            <div className="p-6 md:p-8">
              <button onClick={onClose} className="mb-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-700 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <div className="relative aspect-square rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-center mb-4 overflow-hidden">
                {product.image && !imgError ? (
                  <img src={thumbs[selectedImg]} alt={product.name} className="w-full h-full object-contain p-8" onError={() => setImgError(true)} />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center">
                    <svg className="w-12 h-12 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                )}
                {hasDiscount && (
                  <div className="absolute top-4 left-4 z-10">
                    <span className="bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">-{product.discount_percent}%</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {thumbs.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImg(i)}
                    className={`w-16 h-16 rounded-xl border-2 overflow-hidden flex-shrink-0 transition-all ${
                      selectedImg === i ? 'border-amber-500' : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain p-1" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Right - Product Info */}
            <div className="p-6 md:p-8 md:pl-0 flex flex-col justify-between">
              <div>
                <p className="text-xs text-stone-400 mb-3">
                  <span className="text-stone-500">Inicio</span>
                  <span className="mx-1.5">/</span>
                  <span className="text-stone-500">{product.category || 'Productos'}</span>
                  <span className="mx-1.5">/</span>
                  <span className="text-stone-800 font-medium">{product.name}</span>
                </p>

                <h2 className="text-2xl md:text-3xl font-bold text-stone-900 mb-1 leading-tight font-[family-name:var(--font-display)]">
                  {product.name}
                </h2>

                <p className="text-xs text-stone-400 mb-4">SKU: AYF-{product.id.slice(0, 8)}</p>

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-0.5">
                    {stars.map((s, i) => <Star key={i} type={s} />)}
                  </div>
                  <span className="text-xs font-medium text-stone-700">{rating.toFixed(1)}</span>
                  <span className="text-xs text-stone-400">({sold} vendidos)</span>
                </div>

                <p className="text-sm text-stone-600 leading-relaxed mb-6">
                  {product.brand ? `${product.brand} — ` : ''}{product.name}. Producto 100% original con garantía de satisfacción. Descubrí una fragancia única que realza tu personalidad.
                </p>

                <div className="flex items-baseline gap-3 mb-6">
                  <span className="text-3xl font-bold text-stone-900">{formatPrice(finalPrice)}</span>
                  {hasDiscount && (
                    <>
                      <span className="text-sm text-stone-400 line-through">{formatPrice(product.sale_price)}</span>
                      <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">-{product.discount_percent}%</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <span className="text-sm font-medium text-stone-700">Cantidad</span>
                  <div className="flex items-center border border-stone-300 rounded-xl overflow-hidden">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-10 h-10 text-stone-500 hover:bg-stone-100 text-lg border-r border-stone-300 transition-colors">−</button>
                    <input type="number" min={1} value={quantity}
                      onChange={e => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="w-16 h-10 text-center text-sm font-medium bg-transparent text-stone-900 border-0 focus:outline-none" />
                    <button onClick={() => setQuantity(q => q + 1)}
                      className="w-10 h-10 text-stone-500 hover:bg-stone-100 text-lg border-l border-stone-300 transition-colors">+</button>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-stone-100">
                <div className="flex items-center justify-between py-2 px-4 bg-stone-50 rounded-xl">
                  <span className="text-sm font-semibold text-stone-700">Subtotal</span>
                  <span className="text-lg font-bold text-stone-900">{formatPrice(subtotal)}</span>
                </div>

                <button
                  onClick={() => { onAddToCart(product, quantity); onClose() }}
                  className="w-full bg-stone-900 hover:bg-black text-white font-bold py-3.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={product.current_stock <= 0}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
                  Añadir al Carrito
                </button>

                <a href={`https://wa.me/${whatsapp}?text=Hola%20Perfumería%20A%20y%20F,%20quiero%20comprar%20${encodeURIComponent(product.name)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="block w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3.5 rounded-xl transition-all text-sm text-center">
                  Comprar Ahora
                </a>

                {product.brand && (
                  <p className="text-xs text-stone-400 text-center pt-2">
                    <span className="font-medium text-stone-500">Marca:</span> {product.brand}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 pt-3">
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-green-50">
                    <svg className="w-4 h-4 text-green-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    <div><p className="text-xs font-semibold text-green-800">Mejor precio</p><p className="text-[10px] text-green-600">Garantizado</p></div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50">
                    <svg className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    <div><p className="text-xs font-semibold text-blue-800">Entrega rápida</p><p className="text-[10px] text-blue-600">24-48 hrs</p></div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50">
                    <svg className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    <div><p className="text-xs font-semibold text-emerald-800">Soporte</p><p className="text-[10px] text-emerald-600">WhatsApp</p></div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-purple-50">
                    <svg className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    <div><p className="text-xs font-semibold text-purple-800">Compra segura</p><p className="text-[10px] text-purple-600">Tus datos protegidos</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ContactForm() {
  const [name, setName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !message.trim()) return
    const text = `Hola Perfumería A y F,%0A%0ANombre: ${encodeURIComponent(name.trim())}%0A${contactEmail.trim() ? `Email: ${encodeURIComponent(contactEmail.trim())}%0A` : ''}Mensaje: ${encodeURIComponent(message.trim())}`
    window.open(`https://wa.me/${whatsapp}?text=${text}`, '_blank')
  }

  return (
    <form onSubmit={handleSubmit} className="reveal space-y-4">
      <div>
        <label className="block text-xs font-medium text-neutral-300 mb-1.5">Nombre</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="Tu nombre"
          className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all" required />
      </div>
      <div>
        <label className="block text-xs font-medium text-neutral-300 mb-1.5">Email (opcional)</label>
        <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)}
          placeholder="tu@email.com"
          className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all" />
      </div>
      <div>
        <label className="block text-xs font-medium text-neutral-300 mb-1.5">Mensaje</label>
        <textarea value={message} onChange={e => setMessage(e.target.value)}
          placeholder="Escribí tu mensaje..."
          rows={4}
          className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all resize-none" required />
      </div>
      <button type="submit"
        className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
        Enviar mensaje
      </button>
    </form>
  )
}

export default function Landing() {
  const { theme, toggleTheme } = useTheme()
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [testimonials, setTestimonials] = useState<{ name: string; text: string; rating: number }[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedGender, setSelectedGender] = useState<string | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('cart')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('favorites')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  // Persist cart + favorites to localStorage
  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)) }, [cart])
  useEffect(() => { localStorage.setItem('favorites', JSON.stringify(favorites)) }, [favorites])

  const toggleFavorite = (product: Product) => {
    setFavorites(prev =>
      prev.includes(product.id)
        ? prev.filter(id => id !== product.id)
        : [...prev, product.id]
    )
  }

  const addToCart = (product: Product, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + qty }
            : item
        )
      }
      return [...prev, { product, quantity: qty }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId))
  }

  const updateCartQty = (productId: string, qty: number) => {
    if (qty <= 0) { removeFromCart(productId); return }
    setCart(prev => prev.map(item =>
      item.product.id === productId ? { ...item, quantity: qty } : item
    ))
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  useEffect(() => {
    getStoreProducts(undefined, selectedGender).then(setProducts)
  }, [selectedGender])

  useEffect(() => {
    getStoreCategories().then(setCategories)
  }, [])

  useEffect(() => {
    getStoreTestimonials().then(data => setTestimonials(data))
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show')
            observerRef.current?.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    const targets = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-stagger')
    targets.forEach(el => observerRef.current?.observe(el))
    return () => observerRef.current?.disconnect()
  }, [])

  useEffect(() => {
    if (!observerRef.current) return
    const timer = setTimeout(() => {
      document.querySelectorAll('.reveal:not(.show), .reveal-left:not(.show), .reveal-right:not(.show), .reveal-scale:not(.show), .reveal-stagger:not(.show)')
        .forEach(el => observerRef.current?.observe(el))
    }, 150)
    return () => clearTimeout(timer)
  }, [products, categories])

  // Client-side search filter
  const visibleProducts = searchQuery
    ? products.filter(p => {
        const q = searchQuery.toLowerCase()
        return p.name.toLowerCase().includes(q)
          || p.brand.toLowerCase().includes(q)
          || (p.description || '').toLowerCase().includes(q)
          || p.category.toLowerCase().includes(q)
          || p.barcode.toLowerCase().includes(q)
      })
    : products

  const discounted = visibleProducts.filter(p => p.discount_percent > 0 && p.active && p.show_in_store)
  const favoritedProducts = products.filter(p => favorites.includes(p.id) && p.active && p.show_in_store)

  const rows: { title: string; products: Product[] }[] = []

  if (favoritedProducts.length > 0 && !searchQuery) {
    rows.push({ title: 'Favoritos', products: favoritedProducts })
  }
  if (discounted.length > 0) {
    rows.push({ title: 'Ofertas Especiales', products: discounted })
  }

  categories.forEach(cat => {
    const catProducts = visibleProducts.filter(
      p => p.category_id === cat.id && p.active && p.show_in_store
    )
    if (catProducts.length > 0) {
      rows.push({ title: cat.name, products: catProducts })
    }
  })

  const handleCategoryClick = (cat: Category) => {
    const el = document.getElementById(`row-${cat.name}`)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <SEO />
      <div className="min-h-screen bg-[#f5f2ed] dark:bg-black text-stone-900 dark:text-white transition-colors duration-300">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/90 dark:bg-black/90 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/20 border-b border-stone-200/50 dark:border-neutral-800/50'
          : 'bg-gradient-to-b from-white/80 to-transparent dark:from-black/80 dark:to-transparent'
      }`}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-16">
          <div className="grid grid-cols-3 items-center h-16 lg:h-20">
            {/* Left: Logo */}
            <div className="justify-self-start">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-all">
                  <span className="text-black text-xs lg:text-sm font-bold">AyF</span>
                </div>
                <span className="hidden sm:block text-sm font-bold text-stone-700 dark:text-white/90 group-hover:text-stone-900 dark:group-hover:text-white transition-colors">Perfumería</span>
              </Link>
            </div>

            {/* Center: Nav Links */}
            <div className="justify-self-center hidden lg:flex items-center gap-1">
              {[
                { label: 'Productos', id: 'catalogo' },
                { label: 'Catálogo', id: 'catalogo' },
                { label: 'Nosotros', id: 'nosotros' },
                { label: 'Contacto', id: 'contacto' },
              ].map(link => (
                <button key={link.label} onClick={() => document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' })}
                  className="nav-link px-4 py-2 text-sm font-medium text-stone-500 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white transition-colors rounded-lg hover:bg-stone-100 dark:hover:bg-white/5">
                  {link.label}
                </button>
              ))}
            </div>

            {/* Right: Icons */}
            <div className="justify-self-end flex items-center gap-1">
              {/* Theme Toggle */}
              <button onClick={toggleTheme}
                className="p-2 rounded-xl text-stone-500 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-white/5 transition-all"
                title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
                {theme === 'dark' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
              </button>
              <button onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 rounded-xl text-stone-500 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/5 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
              <button onClick={() => setCartOpen(true)} className="relative p-2 rounded-xl text-stone-500 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/5 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-black text-[10px] font-bold flex items-center justify-center shadow-lg shadow-amber-500/30">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>
              {isAuthenticated ? (
                <div className="relative group hidden sm:block">
                  <button className="p-2 rounded-xl text-stone-500 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/5 transition-all">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500/30 to-amber-600/30 flex items-center justify-center text-amber-600 dark:text-amber-400 text-xs font-bold">
                      {(user?.name || user?.username || '?').charAt(0).toUpperCase()}
                    </div>
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-stone-200 dark:border-neutral-800 p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <p className="text-sm font-medium text-stone-900 dark:text-white truncate">{user?.name || user?.username}</p>
                    <p className="text-xs text-stone-500 truncate mb-2">{user?.email}</p>
                    <div className="space-y-1">
                      <Link to="/mis-pedidos" className="block w-full text-left px-3 py-2 rounded-lg text-xs text-stone-600 dark:text-neutral-300 hover:bg-stone-100 dark:hover:bg-white/5 transition-all">Mis pedidos</Link>
                      {user?.role === 'admin' && (
                        <Link to="/admin/ventas" className="block w-full text-left px-3 py-2 rounded-lg text-xs text-stone-600 dark:text-neutral-300 hover:bg-stone-100 dark:hover:bg-white/5 transition-all">Panel admin</Link>
                      )}
                      <button onClick={() => { logout(); navigate('/') }} className="block w-full text-left px-3 py-2 rounded-lg text-xs text-red-500 hover:bg-red-500/10 transition-all">Cerrar sesión</button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link to="/login" className="hidden sm:block p-2 rounded-xl text-stone-500 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/5 transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </Link>
              )}
              {/* Hamburger — visible en mobile */}
              <button onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl text-stone-500 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/5 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <div className="absolute top-0 right-0 bottom-0 w-72 max-w-[80vw] bg-white dark:bg-neutral-950 border-l border-stone-200 dark:border-neutral-800 shadow-2xl flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-neutral-800">
                <span className="text-sm font-bold text-stone-900 dark:text-white font-[family-name:var(--font-display)]">Menú</span>
                <button onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/5 transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Nav Links */}
              <div className="flex-1 px-3 py-4 space-y-0.5">
                {[
                  { label: 'Productos', id: 'catalogo' },
                  { label: 'Catálogo', id: 'catalogo' },
                  { label: 'Nosotros', id: 'nosotros' },
                  { label: 'Contacto', id: 'contacto' },
                ].map(link => (
                  <button key={link.label}
                    onClick={() => {
                      document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' })
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-stone-600 dark:text-neutral-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/5 transition-all">
                    {link.label === 'Productos' && (
                      <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    )}
                    {link.label === 'Catálogo' && (
                      <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    )}
                    {link.label === 'Nosotros' && (
                      <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                    {link.label === 'Contacto' && (
                      <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    )}
                    {link.label}
                  </button>
                ))}
              </div>

              {/* Bottom — Theme + Perfil */}
              <div className="px-3 py-4 border-t border-stone-200 dark:border-neutral-800 space-y-2">
                <button onClick={() => { toggleTheme(); setMobileMenuOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-stone-600 dark:text-neutral-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/5 transition-all">
                  {theme === 'dark' ? (
                    <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  ) : (
                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                  )}
                  {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                </button>
                {isAuthenticated ? (
                  <>
                    <div className="px-4 py-3 border border-stone-200 dark:border-neutral-800 rounded-xl space-y-1">
                      <p className="text-sm font-medium text-stone-900 dark:text-white truncate">{user?.name || user?.username}</p>
                      <p className="text-xs text-stone-500 truncate">{user?.email}</p>
                    </div>
                    <Link to="/mis-pedidos" onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-stone-600 dark:text-neutral-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/5 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      Mis pedidos
                    </Link>
                    {user?.role === 'admin' && (
                      <Link to="/admin/ventas" onClick={() => setMobileMenuOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Panel admin
                      </Link>
                    )}
                    <button onClick={() => { logout(); setMobileMenuOpen(false); navigate('/') }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-stone-600 dark:text-neutral-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/5 transition-all">
                    <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Iniciar sesión
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {searchOpen && (
          <>
            <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40" onClick={() => setSearchOpen(false)} />
            <div className="relative z-50 border-t border-stone-200 dark:border-neutral-800 bg-white/95 dark:bg-black/95 backdrop-blur-2xl px-4 py-6 shadow-[0_8px_30px_rgb(0,0,0,0.1)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.6)]">
              <div className="max-w-2xl mx-auto relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscá por nombre, marca o categoría..."
                  className="w-full pl-12 pr-12 py-3 bg-stone-100 dark:bg-neutral-800/80 rounded-2xl text-sm text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all border border-transparent focus:border-amber-500/30" autoFocus />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-neutral-500 hover:text-stone-700 dark:hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="/Moda.png" alt="Hero" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/30 to-black/75" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/5 to-transparent" />
        </div>
        <div className="relative w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-16 pt-28 pb-36">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="hero-entrance inline-flex items-center gap-2.5 px-5 py-2 bg-white/10 backdrop-blur-md rounded-full text-amber-300 text-xs sm:text-sm font-medium mb-8 border border-amber-500/25 tracking-wide">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-lg shadow-amber-400/50" />
              Colección exclusiva — 100% original
            </div>

            {/* Decorative line */}
            <div className="hero-entrance-delay-1 w-16 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full mb-8 opacity-60" />

            {/* Title */}
            <h1 className="hero-entrance-delay-1 text-5xl sm:text-6xl lg:text-8xl font-bold text-white leading-[1.05] mb-6 font-[family-name:var(--font-display)] tracking-tight">
              Descubrí{' '}
              <span className="relative inline-block">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">tu esencia</span>
                <span className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent rounded-full" />
              </span>
            </h1>

            {/* Subtitle */}
            <p className="hero-entrance-delay-2 text-base sm:text-lg text-neutral-300/90 max-w-xl mb-12 leading-relaxed font-light tracking-wide">
              Explorá nuestra colección de perfumes de lujo selectos. Productos 100% originales con los mejores precios del mercado.
            </p>

            {/* CTA Buttons */}
            <div className="hero-entrance-delay-3 flex flex-wrap gap-4">
              <button onClick={() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-3 px-9 py-4.5 bg-gradient-to-r from-amber-500 to-amber-400 text-black font-bold rounded-2xl hover:from-amber-400 hover:to-amber-300 transition-all duration-300 shadow-xl shadow-amber-500/25 hover:shadow-2xl hover:shadow-amber-500/35 text-sm tracking-wide">
                Explorar catálogo
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
              </button>
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-9 py-4.5 border border-white/20 text-neutral-300 font-medium rounded-2xl hover:bg-white/10 hover:text-white hover:border-white/30 transition-all text-sm tracking-wide">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                Consultar por WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-60 animate-bounce-gentle">
          <span className="text-xs text-white/50 tracking-widest uppercase font-medium">Scroll</span>
          <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </section>

      {/* Categories Carousel */}
      <div className="relative bg-[#f5f2ed] dark:bg-black transition-colors duration-300">
        <CategoriesCarousel categories={categories} onSelect={handleCategoryClick} />
      </div>

      {/* Gender Selector */}
      <GenderSelector selected={selectedGender} onChange={setSelectedGender} />

      {/* Products Rows */}
      <div id="catalogo" className="pb-16">
        {rows.map(row => (
          <div key={row.title} id={`row-${row.title}`}>
            <ProductRow title={row.title} products={row.products} onSelect={setSelectedProduct} onAddToCart={p => addToCart(p)} favorites={favorites} onToggleFavorite={toggleFavorite} />
          </div>
        ))}
        {rows.length === 0 && (
          <div className="text-center py-20 reveal">
            <p className="text-stone-500 dark:text-neutral-500">
              {searchQuery ? `No encontramos "${searchQuery}"` : 'No hay productos disponibles en esta categoría.'}
            </p>
          </div>
        )}
      </div>

      {/* Services */}
      <ServicesSection />

      {/* Testimonials */}
      <TestimonialsSection testimonials={testimonials} />

      {/* About */}
      <section id="nosotros" className="py-20 border-t border-stone-200 dark:border-neutral-900 transition-colors duration-300">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="reveal-left">
              <span className="text-amber-600 dark:text-amber-500 font-semibold text-xs tracking-widest uppercase">Nosotros</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white mt-3 leading-tight font-[family-name:var(--font-display)]">Pasión por la esencia</h2>
              <p className="text-stone-600 dark:text-neutral-400 mt-4 leading-relaxed">
                En Perfumería A y F trabajamos directamente con distribuidores autorizados para traerte los mejores perfumes originales del mundo a los mejores precios.
              </p>
              <div className="flex gap-8 mt-8">
                <div>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">+500</p>
                  <p className="text-xs text-stone-400 dark:text-neutral-500 mt-1">Clientes felices</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">+200</p>
                  <p className="text-xs text-stone-400 dark:text-neutral-500 mt-1">Productos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">100%</p>
                  <p className="text-xs text-stone-400 dark:text-neutral-500 mt-1">Originales</p>
                </div>
              </div>
            </div>
            <div className="aspect-[4/3] rounded-2xl border border-stone-200 dark:border-neutral-800 flex items-center justify-center reveal-right bg-[#f5f2ed] dark:bg-black transition-colors duration-300">
              <svg className="w-24 h-24 text-stone-300 dark:text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contacto" className="relative py-24 overflow-hidden border-t border-stone-200 dark:border-neutral-900 transition-colors duration-300">
        <div className="absolute inset-0">
          <img src="/Contacto.png" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/80" />
        </div>
        <div className="relative max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-16">
          <span className="text-amber-400 font-semibold text-xs tracking-widest uppercase reveal block text-center">Contacto</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-3 mb-12 reveal text-center font-[family-name:var(--font-display)]">Estamos para servirte</h2>
          <div className="grid lg:grid-cols-2 gap-10 max-w-4xl mx-auto">
            {/* Contact Form */}
            <ContactForm />
            {/* Info Cards */}
            <div className="grid sm:grid-cols-2 gap-4 reveal-stagger self-start">
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl bg-white/10 border border-white/10 hover:border-amber-500/40 hover:bg-white/20 transition-all group">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </div>
                <div className="text-left">
                  <p className="text-xs text-neutral-300">WhatsApp</p>
                  <p className="text-sm font-semibold text-white">{phone}</p>
                </div>
              </a>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/10 border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div className="text-left">
                  <p className="text-xs text-neutral-300">Ubicación</p>
                  <p className="text-sm font-semibold text-white">{address}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/10 border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div className="text-left">
                  <p className="text-xs text-neutral-300">Email</p>
                  <p className="text-sm font-semibold text-white">{email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/10 border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="text-left">
                  <p className="text-xs text-neutral-300">Horarios</p>
                  <p className="text-sm font-semibold text-white">Lun - Sáb: 9 AM - 7 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 dark:border-neutral-900 py-12 reveal">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-16">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <span className="text-black text-xs font-bold">AyF</span>
              </div>
              <span className="text-sm text-stone-400 dark:text-neutral-500">Perfumería A y F © 2026</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-stone-400 dark:text-neutral-600">
              <span>Todos los derechos reservados</span>
              <span className="w-1 h-1 rounded-full bg-stone-300 dark:bg-neutral-700" />
              <span>San José, Costa Rica</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Product Detail Overlay */}
      {selectedProduct && (
        <ProductDetailFull product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={addToCart} />
      )}

      {/* Cart Sidebar */}
      <CartSidebar
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onUpdateQty={updateCartQty}
        onRemove={removeFromCart}
        onClearCart={() => setCart([])}
      />
    </div>
    </>
  )
}
