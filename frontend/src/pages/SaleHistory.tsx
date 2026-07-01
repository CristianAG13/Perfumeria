import { useState, useEffect } from 'react'
import { Button, Modal, Table } from '../components/ui'
import { querySales, cancelSale } from '../lib/api'
import { formatCents } from '../lib/format'
import type { Sale } from '../lib/types'
import { SEO } from '../components/SEO'

export function SaleHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10))
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10))
  const [cancelModal, setCancelModal] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  const load = async () => {
    const data = await querySales({ from, to })
    setSales(data)
  }

  useEffect(() => { load() }, [])

  const handleCancel = async () => {
    if (!cancelModal || !cancelReason) return
    await cancelSale(cancelModal, cancelReason)
    setCancelModal(null)
    setCancelReason('')
    load()
  }

  return (
    <div>
      <SEO noIndex />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Historial de Ventas</h1>
        <div className="flex gap-2 items-center">
          <label className="text-sm">Desde:</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="border rounded px-2 py-1 text-sm" />
          <label className="text-sm">Hasta:</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="border rounded px-2 py-1 text-sm" />
          <Button onClick={load}>Filtrar</Button>
        </div>
      </div>
      <Table
        headers={['Fecha', 'Total', 'Medio de pago', 'Items', 'Estado', 'Acciones']}
        rows={sales.map(s => [
          new Date(s.created_at).toLocaleString(),
          formatCents(s.total),
          s.payments?.map(p => {
            const labels: Record<string, string> = { cash: 'Efectivo', card: 'Tarjeta', sinpe: 'SINPE', transfer: 'Transferencia', other: 'Otro' }
            return `${labels[p.method] || p.method} ₡${(p.amount / 100).toLocaleString('es-CR')}`
          }).join(', ') || '-',
          s.lines.length,
          s.status === 'cancelled' ? 'Anulada' : 'Activa',
          s.status === 'active'
            ? <Button variant="danger" onClick={() => setCancelModal(s.id)}>Anular</Button>
            : <span className="text-gray-400 dark:text-stone-400 text-sm">{s.cancel_reason}</span>,
        ])}
      />
      {cancelModal && (
        <Modal title="Anular venta" onClose={() => setCancelModal(null)}>
          <p className="mb-3 text-sm text-gray-600 dark:text-stone-300">¿Estás seguro de anular esta venta? El stock se restaurará automáticamente.</p>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-1">Motivo de anulación *</label>
            <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)}
              className="w-full border border-gray-300 dark:border-stone-600 rounded px-3 py-2 text-sm" rows={3} placeholder="Ej: Devolución, error, cliente se arrepintió..." />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCancelModal(null)}>Volver</Button>
            <Button variant="danger" onClick={handleCancel} disabled={!cancelReason.trim()}>Anular venta</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

