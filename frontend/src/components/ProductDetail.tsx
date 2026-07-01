import { useState, type ReactNode } from 'react'
import { formatCents } from '../lib/format'
import type { Product } from '../lib/types'

export function ProductDetailModal({
  product,
  onClose,
  onAddToCart = () => {},
  actions,
}: {
  product: Product
  onClose: () => void
  onAddToCart?: (qty: number) => void
  actions?: ReactNode
}) {
  const [quantity, setQuantity] = useState(1)

  const hasImage = !!product.image
  const subtotal = product.sale_price * quantity

  const stockLabel = () => {
    if (product.current_stock <= 0) return { label: 'Sin stock', class: 'text-red-600 bg-red-50' }
    if (product.current_stock <= product.min_stock) return { label: `Bajo stock (${product.current_stock} uds.)`, class: 'text-amber-600 bg-amber-50' }
    return { label: `${product.current_stock} uds. disponibles`, class: 'text-emerald-600 bg-emerald-50' }
  }
  const stock = stockLabel()

  return (
    <div className="fixed inset-0 bg-black/30 dark:bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-premium w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="relative">
          <button onClick={onClose} className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 dark:bg-stone-900/90 rounded-full text-slate-400 dark:text-stone-500 hover:text-slate-600 dark:hover:text-stone-300 flex items-center justify-center shadow-sm dark:shadow-black/20 border border-slate-200/80 dark:border-stone-200/80 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="aspect-[4/3] bg-slate-50/80 dark:bg-stone-800/50 flex items-center justify-center p-8">
            {hasImage ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-300 dark:text-stone-400">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span className="text-sm">Sin imagen</span>
              </div>
            )}
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              {product.brand && <p className="text-xs font-medium text-slate-400 dark:text-stone-500 uppercase tracking-wider">{product.brand}</p>}
              <h2 className="text-xl font-bold text-slate-900 dark:text-stone-100 mt-0.5">{product.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                {product.category && <span className="text-xs bg-slate-100 dark:bg-stone-800/50 text-slate-500 dark:text-stone-400 px-2 py-0.5 rounded-full">{product.category}</span>}
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full {stock.class}`}>{stock.label}</span>
              </div>
              {product.barcode && (
                <p className="text-xs text-slate-400 dark:text-stone-500 mt-1.5 font-mono">Código: {product.barcode}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-amber-600">{formatCents(product.sale_price)}</p>
              <p className="text-xs text-slate-400 dark:text-stone-500 mt-0.5">por unidad</p>
            </div>
          </div>

          {!actions && (
            <>
              <div className="flex items-center gap-3 pt-2">
                <span className="text-sm font-medium text-slate-700 dark:text-stone-200">Cantidad</span>
                <div className="flex items-center border border-slate-200 dark:border-stone-200 rounded-xl overflow-hidden">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-10 h-10 text-slate-500 dark:text-stone-400 hover:bg-slate-50 dark:hover:bg-stone-800/30 text-lg border-r border-slate-200 dark:border-stone-200 transition-colors">−</button>
                  <input type="number" min={1} value={quantity}
                    onChange={e => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-16 h-10 text-center text-sm font-medium border-0 focus:outline-none" />
                  <button onClick={() => setQuantity(q => q + 1)}
                    className="w-10 h-10 text-slate-500 dark:text-stone-400 hover:bg-slate-50 dark:hover:bg-stone-800/30 text-lg border-l border-slate-200 dark:border-stone-200 transition-colors">+</button>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-amber-50 rounded-xl">
                <span className="text-sm font-semibold text-amber-800">Subtotal</span>
                <span className="text-lg font-bold text-amber-700">{formatCents(subtotal)}</span>
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={() => { onAddToCart(quantity); onClose() }}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl transition-all text-sm shadow-card flex items-center justify-center gap-2"
                  disabled={product.current_stock <= 0}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
                  Agregar al carrito
                </button>
                <button onClick={onClose}
                  className="px-5 bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-200 hover:bg-slate-50 dark:hover:bg-stone-800/30 text-slate-600 dark:text-stone-300 font-medium py-3 rounded-xl transition-all text-sm">Cerrar</button>
              </div>
            </>
          )}

          {actions && (
            <div className="pt-1">{actions}</div>
          )}
        </div>
      </div>
    </div>
  )
}
