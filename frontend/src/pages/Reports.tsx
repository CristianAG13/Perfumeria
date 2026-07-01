import { useState, useEffect } from 'react'
import { Table } from '../components/ui'
import { getDailyReport, getTopProducts, getLowStock } from '../lib/api'
import { formatCents } from '../lib/format'
import type { DailyReport, TopProduct, LowStockItem } from '../lib/types'
import { SEO } from '../components/SEO'

type Tab = 'daily' | 'top' | 'lowstock'

const tabs = [
  { id: 'daily' as Tab, label: 'Ventas del día', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
  { id: 'top' as Tab, label: 'Más vendidos', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> },
  { id: 'lowstock' as Tab, label: 'Stock bajo', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg> },
]

export function ReportsPage() {
  const [tab, setTab] = useState<Tab>('daily')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [daily, setDaily] = useState<DailyReport | null>(null)
  const [top, setTop] = useState<TopProduct[]>([])
  const [low, setLow] = useState<{ products: LowStockItem[]; count: number } | null>(null)

  useEffect(() => {
    if (tab === 'daily') getDailyReport(date).then(setDaily).catch(() => setDaily(null))
    if (tab === 'top') getTopProducts({ limit: 10 }).then(setTop).catch(() => setTop([]))
    if (tab === 'lowstock') getLowStock().then(setLow).catch(() => setLow(null))
  }, [tab, date])

  return (
    <div className="space-y-6">
      <SEO noIndex />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-stone-800 dark:text-stone-100">Reportes</h1>
      </div>

      <div className="flex gap-1.5 p-1 bg-stone-100 dark:bg-stone-800/50 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === t.id
              ? 'bg-white dark:bg-stone-700 text-amber-700 dark:text-amber-400 shadow-sm'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'}`}>
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'daily' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-stone-600 dark:text-stone-400">Fecha</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2.5 text-sm text-stone-900 dark:text-stone-100 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500 transition-all" />
          </div>
          {daily ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-stone-900 rounded-xl p-5 ring-1 ring-stone-200 dark:ring-stone-800 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider">Total facturado</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-stone-800 dark:text-stone-100">{formatCents(daily.total_amount)}</div>
                </div>
                <div className="bg-white dark:bg-stone-900 rounded-xl p-5 ring-1 ring-stone-200 dark:ring-stone-800 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider">Ventas</span>
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-stone-800 dark:text-stone-100">{daily.sales_count}</div>
                </div>
                <div className="bg-white dark:bg-stone-900 rounded-xl p-5 ring-1 ring-stone-200 dark:ring-stone-800 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider">Medios de pago</span>
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-stone-800 dark:text-stone-100">{Object.keys(daily.payment_breakdown).length}</div>
                </div>
              </div>
              {Object.entries(daily.payment_breakdown).length > 0 && (
                <div className="bg-white dark:bg-stone-900 rounded-xl ring-1 ring-stone-200 dark:ring-stone-800 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800">
                    <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300">Desglose por medio de pago</h3>
                  </div>
                  <Table
                    headers={['Medio de pago', 'Total']}
                    rows={Object.entries(daily.payment_breakdown).map(([method, amount]) => [
                      method, formatCents(amount),
                    ])}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="bg-white dark:bg-stone-900 rounded-xl ring-1 ring-stone-200 dark:ring-stone-800 shadow-sm p-12 text-center">
              <p className="text-stone-400 dark:text-stone-500">No hay ventas para esta fecha</p>
            </div>
          )}
        </div>
      )}

      {tab === 'top' && (
        <div className="bg-white dark:bg-stone-900 rounded-xl ring-1 ring-stone-200 dark:ring-stone-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800">
            <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300">Top 10 productos más vendidos</h3>
          </div>
          <Table
            headers={['#', 'Producto', 'Cantidad vendida', 'Ingresos']}
            rows={top.map((p, i) => [i + 1, p.product_name, p.total_qty, formatCents(p.total_revenue)])}
          />
        </div>
      )}

      {tab === 'lowstock' && (
        <div className="bg-white dark:bg-stone-900 rounded-xl ring-1 ring-stone-200 dark:ring-stone-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300">Productos con stock bajo</h3>
            {low && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-900/50">
                {low.count} producto(s)
              </span>
            )}
          </div>
          <Table
            headers={['Producto', 'Stock actual', 'Stock mínimo', 'Déficit']}
            rows={(low?.products || []).map(p => [p.name, p.current_stock, p.min_stock, p.deficit])}
          />
        </div>
      )}
    </div>
  )
}
