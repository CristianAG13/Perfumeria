import { useState, useEffect } from 'react'
import { getMyOrders } from '../lib/api'
import { formatCents } from '../lib/format'
import { SEO } from '../components/SEO'
import type { Sale } from '../lib/types'

const statusLabels: Record<string, string> = {
  active: 'Activo',
  cancelled: 'Cancelado',
}

const paymentLabels: Record<string, string> = {
  whatsapp: 'WhatsApp',
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
}

export function MyOrdersPage() {
  const [orders, setOrders] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    getMyOrders()
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <SEO title="Mis pedidos" noIndex />
      <div className="min-h-screen bg-stone-50 dark:bg-black">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white font-[family-name:var(--font-display)] mb-2">Mis pedidos</h1>
          <p className="text-sm text-stone-500 dark:text-neutral-400 mb-8">Historial de tus compras en Perfumería A y F</p>

          {loading ? (
            <div className="text-center py-16 text-stone-400">Cargando...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-stone-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm font-medium text-stone-500 dark:text-neutral-400">Todavía no hiciste ningún pedido</p>
              <p className="text-xs text-stone-400 dark:text-neutral-500 mt-1">Explorá nuestros productos y hacé tu primer pedido</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <div key={order.id} className="bg-white dark:bg-neutral-900 rounded-2xl border border-stone-200 dark:border-neutral-800 overflow-hidden">
                  {/* Header */}
                  <button
                    onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-stone-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${order.status === 'cancelled' ? 'bg-red-400' : 'bg-emerald-400'}`} />
                      <div>
                        <p className="text-sm font-semibold text-stone-900 dark:text-white">
                          Pedido {order.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-stone-400 dark:text-neutral-500">{order.created_at}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-stone-900 dark:text-white">{formatCents(order.total)}</span>
                      <svg className={`w-4 h-4 text-stone-400 transition-transform ${expanded === order.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {expanded === order.id && (
                    <div className="border-t border-stone-200 dark:border-neutral-800">
                      {/* Método de pago + estado */}
                      <div className="px-4 py-3 flex items-center gap-4 text-xs text-stone-500 dark:text-neutral-400 border-b border-stone-100 dark:border-neutral-800">
                        <span>Estado: <strong className={order.status === 'cancelled' ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}>{statusLabels[order.status] || order.status}</strong></span>
                        {order.payments.map((p, i) => (
                          <span key={i}>Pago: <strong>{paymentLabels[p.method] || p.method}</strong></span>
                        ))}
                      </div>

                      {order.cancel_reason && (
                        <div className="px-4 py-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/10">
                          Motivo de cancelación: {order.cancel_reason}
                        </div>
                      )}

                      {/* Líneas */}
                      <div className="px-4 py-3 space-y-2">
                        {order.lines.map((line, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-stone-400 dark:text-neutral-500 shrink-0">x{line.quantity}</span>
                              <span className="text-stone-700 dark:text-neutral-300 truncate">{line.product_name}</span>
                            </div>
                            <span className="text-stone-900 dark:text-white font-medium ml-2 shrink-0">{formatCents(line.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
