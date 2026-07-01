import { useState } from 'react'
import type { CartItem } from '../lib/types'
import { formatCents } from '../lib/format'
import { checkout } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const whatsapp = '50688888888'

interface Props {
  open: boolean
  onClose: () => void
  items: CartItem[]
  onUpdateQty: (productId: string, qty: number) => void
  onRemove: (productId: string) => void
  onClearCart: () => void
}

export function CartSidebar({ open, onClose, items, onUpdateQty, onRemove, onClearCart }: Props) {
  const { user } = useAuth()
  const [ordering, setOrdering] = useState(false)

  const total = items.reduce((sum, item) => {
    const price = item.product.discount_percent > 0
      ? item.product.discount_price
      : item.product.sale_price
    return sum + price * item.quantity
  }, 0)

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const whatsappText = items.map(item =>
    `• ${item.product.name} x${item.quantity} = ${formatCents(
      (item.product.discount_percent > 0 ? item.product.discount_price : item.product.sale_price) * item.quantity
    )}`
  ).join('%0A')

  const handleCheckout = async () => {
    setOrdering(true)
    try {
      await checkout(items.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.discount_percent > 0
          ? item.product.discount_price
          : item.product.sale_price,
      })))
      onClearCart()
      onClose()
      alert('¡Pedido registrado! Te contactamos por WhatsApp para coordinar el pago y la entrega.')
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Error al registrar el pedido')
    } finally {
      setOrdering(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 transition-opacity" onClick={onClose} />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-neutral-950 z-50 shadow-2xl flex flex-col transition-transform duration-300 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            <h2 className="text-lg font-bold text-stone-900 dark:text-white font-[family-name:var(--font-display)]">
              Carrito
            </h2>
            {itemCount > 0 && (
              <span className="text-xs text-stone-500 dark:text-neutral-400">({itemCount} {itemCount === 1 ? 'producto' : 'productos'})</span>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/5 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-stone-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-stone-500 dark:text-neutral-400">Tu carrito está vacío</p>
              <p className="text-xs text-stone-400 dark:text-neutral-500 mt-1">Explorá nuestros productos y agregá lo que te guste</p>
            </div>
          ) : (
            items.map(item => {
              const price = item.product.discount_percent > 0
                ? item.product.discount_price
                : item.product.sale_price
              const subtotal = price * item.quantity

              return (
                <div key={item.product.id} className="flex gap-3 p-3 rounded-xl bg-stone-50 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800">
                  {/* Thumb */}
                  <div className="w-16 h-16 rounded-lg bg-stone-100 dark:bg-neutral-800 overflow-hidden flex-shrink-0 border border-stone-200 dark:border-neutral-700">
                    {item.product.image ? (
                      <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-stone-900 dark:text-white truncate">{item.product.name}</p>
                        <p className="text-xs text-stone-400 dark:text-neutral-500 truncate">{item.product.brand || item.product.category}</p>
                      </div>
                      <button onClick={() => onRemove(item.product.id)} className="p-1 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-stone-300 dark:border-neutral-700 rounded-lg overflow-hidden">
                        <button onClick={() => onUpdateQty(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 text-xs text-stone-500 hover:bg-stone-200 dark:hover:bg-neutral-700 border-r border-stone-300 dark:border-neutral-700 transition-colors">−</button>
                        <span className="w-8 h-7 flex items-center justify-center text-xs font-medium text-stone-900 dark:text-white bg-transparent">{item.quantity}</span>
                        <button onClick={() => onUpdateQty(item.product.id, item.quantity + 1)}
                          className="w-7 h-7 text-xs text-stone-500 hover:bg-stone-200 dark:hover:bg-neutral-700 border-l border-stone-300 dark:border-neutral-700 transition-colors">+</button>
                      </div>
                      <span className="text-sm font-bold text-stone-900 dark:text-white">{formatCents(subtotal)}</span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-stone-200 dark:border-neutral-800 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-stone-700 dark:text-neutral-300">Total</span>
              <span className="text-xl font-bold text-stone-900 dark:text-white">{formatCents(total)}</span>
            </div>

            {user && (
              <button
                onClick={handleCheckout}
                disabled={ordering}
                className="block w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition-all text-sm text-center disabled:opacity-50"
              >
                {ordering ? 'Procesando...' : 'Realizar pedido'}
              </button>
            )}

            <a
              href={`https://wa.me/${whatsapp}?text=¡Hola!%20Quisiera%20comprar:%0A${whatsappText}%0ATotal:%20${formatCents(total)}`}
              target="_blank" rel="noopener noreferrer"
              className={`block w-full ${user ? 'bg-stone-200 hover:bg-stone-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-stone-700 dark:text-stone-200' : 'bg-amber-500 hover:bg-amber-400 text-black'} font-bold py-3 rounded-xl transition-all text-sm text-center`}
            >
              {user ? 'Consultar por WhatsApp' : 'Enviar pedido por WhatsApp'}
            </a>
          </div>
        )}
      </div>
    </>
  )
}
