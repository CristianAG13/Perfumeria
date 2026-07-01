import { useState, useEffect } from 'react'
import { Button, Input, Select, ImageUpload } from '../components/ui'
import { ProductDetailModal } from '../components/ProductDetail'
import { searchProducts, registerSale, listCategories, createProduct } from '../lib/api'
import { formatCents, toCents } from '../lib/format'
import type { Product, Category } from '../lib/types'
import { SEO } from '../components/SEO'

interface CartLine {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  discount: number
  subtotal: number
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Efectivo', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
  { value: 'card', label: 'Tarjeta', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },
  { value: 'sinpe', label: 'SINPE Móvil', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> },
  { value: 'transfer', label: 'Transferencia', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg> },
  { value: 'other', label: 'Otro', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
]

export function SalesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [activeCategory, setActiveCategory] = useState('')
  const [quickSearch, setQuickSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [cart, setCart] = useState<CartLine[]>([])
  const [customerId, setCustomerId] = useState('')
  const [payments, setPayments] = useState<{ method: string; amount: number }[]>([])
  const [message, setMessage] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', brand: '', category_id: '', category: '', barcode: '', image: '', sale_price: 0, cost_price: 0, min_stock: 0, show_in_store: true })

  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  useEffect(() => {
    (async () => {
      const cats = await listCategories()
      setCategories(cats)
      if (cats.length > 0) setActiveCategory(cats[0].id)
    })()
  }, [])

  useEffect(() => {
    if (!activeCategory) { setProducts([]); return }
    ;(async () => {
      const data = await searchProducts('', activeCategory)
      setProducts(data)
    })()
  }, [activeCategory])

  useEffect(() => {
    if (quickSearch.length < 2) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      const data = await searchProducts(quickSearch)
      setSearchResults(data)
    }, 250)
    return () => clearTimeout(timer)
  }, [quickSearch])

  const addToCart = (p: Product) => {
    setCart(prev => {
      const exist = prev.find(l => l.product_id === p.id)
      if (exist) {
        return prev.map(l => l.product_id === p.id ? { ...l, quantity: l.quantity + 1, subtotal: (l.quantity + 1) * l.unit_price - l.discount } : l)
      }
      return [...prev, { product_id: p.id, product_name: p.name, quantity: 1, unit_price: p.sale_price, discount: 0, subtotal: p.sale_price }]
    })
  }

  const updateQty = (productId: string, qty: number) => {
    setCart(prev => prev.map(l => l.product_id === productId ? { ...l, quantity: Math.max(1, qty), subtotal: Math.max(1, qty) * l.unit_price - l.discount } : l))
  }

  const updateDiscount = (productId: string, disc: number) => {
    setCart(prev => prev.map(l => l.product_id === productId ? { ...l, discount: disc, subtotal: l.quantity * l.unit_price - disc } : l))
  }

  const removeLine = (productId: string) => {
    setCart(prev => prev.filter(l => l.product_id !== productId))
  }

  const subtotal = cart.reduce((sum, l) => sum + l.unit_price * l.quantity, 0)
  const totalDiscount = cart.reduce((sum, l) => sum + l.discount, 0)
  const total = cart.reduce((sum, l) => sum + l.subtotal, 0)

  const addToCartWithQty = (p: Product, qty: number) => {
    setCart(prev => {
      const exist = prev.find(l => l.product_id === p.id)
      if (exist) {
        const newQty = exist.quantity + qty
        return prev.map(l => l.product_id === p.id ? { ...l, quantity: newQty, subtotal: newQty * l.unit_price - l.discount } : l)
      }
      return [...prev, { product_id: p.id, product_name: p.name, quantity: qty, unit_price: p.sale_price, discount: 0, subtotal: qty * p.sale_price }]
    })
  }

  const paymentTotal = payments.reduce((s, p) => s + p.amount, 0)

  useEffect(() => {
    if (payments.length === 0 && cart.length > 0) {
      setPayments([{ method: 'cash', amount: total }])
    }
  }, [cart.length])

  const handleCheckout = () => {
    if (paymentTotal !== total) return
    setShowConfirm(true)
  }

  const doCheckout = async () => {
    setShowConfirm(false)
    try {
      const sale = await registerSale({
        lines: cart.map(l => ({ ...l })),
        customer_id: customerId || null,
        payments: payments.filter(p => p.amount > 0),
      })
      setMessage(`Venta registrada · ${formatCents(sale.total)}`)
      setCart([])
      setCustomerId('')
      setPayments([])
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Error al registrar venta')
    }
  }

  const methodLabel = (m: string) =>
    m === 'cash' ? 'Efectivo' : m === 'card' ? 'Tarjeta' : m === 'sinpe' ? 'SINPE' : m === 'transfer' ? 'Transferencia' : 'Otro'

  const handleCreateProduct = async () => {
    if (!createForm.name) return
    const cat = categories.find(c => c.id === createForm.category_id)
    const payload = {
      ...createForm,
      category: cat?.name || '',
      sale_price: toCents(createForm.sale_price),
      cost_price: toCents(createForm.cost_price),
    }
    const created = await createProduct(payload)
    setShowCreate(false)
    setCreateForm({ name: '', brand: '', category_id: activeCategory, category: cat?.name || '', barcode: '', image: '', sale_price: 0, cost_price: 0, min_stock: 0, show_in_store: true })
    const data = await searchProducts('', activeCategory)
    setProducts(data)
    setSelectedProduct(created)
  }

  const stockBadge = (p: Product) => {
    if (p.current_stock <= 0) return { label: 'Sin stock', class: 'bg-red-100 text-red-700' }
    if (p.current_stock <= p.min_stock) return { label: 'Bajo stock', class: 'bg-amber-100 text-amber-700' }
    return { label: `$${p}.current_stock} uds.`, class: 'bg-emerald-100 text-emerald-700' }
  }

  const ProductCard = ({ p, onClick, isSearch }: { p: Product; onClick: () => void; isSearch?: boolean }) => {
    const badge = stockBadge(p)
    return (
      <button key={p.id} onClick={onClick}
        className="group bg-white dark:bg-stone-900 rounded-xl overflow-hidden text-left transition-all duration-200 hover:-translate-y-0.5 shadow-card hover:shadow-card-hover border border-slate-200/60 dark:border-stone-200/60 hover:border-amber-200/80">
        <div className="aspect-square bg-slate-50/80 dark:bg-stone-800/50 flex items-center justify-center p-4 relative">
          {p.image ? (
            <img src={p.image} alt={p.name} className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <div className="w-10 h-10 text-slate-300 dark:text-stone-300">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          )}
          {!isSearch && (
            <span className={`absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm dark:shadow-black/20 {badge.class}`}>
              {badge.label}
            </span>
          )}
          {!isSearch && p.current_stock <= 0 && (
            <div className="absolute inset-0 bg-white/60 dark:bg-stone-900/60 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
              <span className="bg-red-500/90 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm dark:shadow-black/20">AGOTADO</span>
            </div>
          )}
        </div>
        <div className="p-3 space-y-1.5">
          {p.brand && <p className="text-[10px] text-slate-400 dark:text-stone-500 uppercase tracking-[0.1em] font-semibold truncate">{p.brand}</p>}
          <p className="text-sm font-semibold text-slate-800 dark:text-stone-100 truncate leading-tight">{p.name}</p>
          <p className="text-lg font-bold text-amber-600 tracking-tight">{formatCents(p.sale_price)}</p>
          {!isSearch && (
            <div className="pt-0.5 flex items-center gap-1 text-[11px] font-semibold text-amber-500 opacity-0 group-hover:opacity-100 transition-all duration-200">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              Agregar
            </div>
          )}
        </div>
      </button>
    )
  }

  const [showCartMobile, setShowCartMobile] = useState(false)

  const cartItems = cart.length === 0 ? (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-stone-500">
      <div className="w-16 h-16 mb-4 bg-slate-100/80 dark:bg-stone-800/80 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-slate-300 dark:text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
      </div>
      <p className="text-sm font-medium text-slate-400 dark:text-stone-500">Agregá productos</p>
      <p className="text-xs text-slate-300/80 dark:text-stone-300/80 mt-1">para iniciar la venta</p>
    </div>
  ) : (
    cart.map(l => (
      <div key={l.product_id} className="rounded-xl p-3 bg-slate-50/50 dark:bg-stone-800/25 hover:bg-slate-100/50 dark:hover:bg-stone-800/50 transition-colors border border-slate-100/50 dark:border-stone-100/50">
        <div className="flex justify-between items-start">
          <span className="text-sm font-semibold text-slate-800 dark:text-stone-100 leading-tight pr-2">{l.product_name}</span>
          <button onClick={() => removeLine(l.product_id)} className="text-slate-300 dark:text-stone-300 hover:text-red-500 transition-colors shrink-0 p-0.5 -mr-0.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2.5">
          <div className="flex items-center border border-slate-200/80 dark:border-stone-200/80 rounded-lg bg-white dark:bg-stone-900 shadow-sm dark:shadow-black/20">
            <button onClick={() => updateQty(l.product_id, l.quantity - 1)}
              className="w-7 h-7 flex items-center justify-center text-slate-500 dark:text-stone-400 text-sm hover:bg-slate-50 dark:hover:bg-stone-800/30 rounded-l-lg transition-colors font-medium">−</button>
            <span className="text-sm font-semibold w-8 text-center text-slate-800 dark:text-stone-100 tabular-nums">{l.quantity}</span>
            <button onClick={() => updateQty(l.product_id, l.quantity + 1)}
              className="w-7 h-7 flex items-center justify-center text-slate-500 dark:text-stone-400 text-sm hover:bg-slate-50 dark:hover:bg-stone-800/30 rounded-r-lg transition-colors font-medium">+</button>
          </div>
          <span className="text-sm text-slate-400 dark:text-stone-500 ml-auto tabular-nums">{formatCents(l.unit_price)} c/u</span>
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/80 dark:border-stone-100/80">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-slate-400 dark:text-stone-500 uppercase tracking-wide">Dto</span>
            <input type="number" value={l.discount} min={0} step={0.01}
              onChange={e => updateDiscount(l.product_id, Number(e.target.value))}
              className="w-14 border border-slate-200 dark:border-stone-200 rounded-lg px-1.5 py-1 text-xs text-right tabular-nums focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200" />
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-stone-100 tabular-nums">{formatCents(l.subtotal)}</span>
        </div>
      </div>
    ))
  )

  const cartFooter = (
    <>
      {cart.length > 0 && (
        <div className="space-y-1.5 pb-3 border-b border-slate-100/80 dark:border-stone-100/80">
          <div className="flex justify-between text-xs text-slate-500 dark:text-stone-400 tabular-nums">
            <span>Subtotal</span>
            <span className="font-medium">{formatCents(subtotal)}</span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between text-xs text-amber-600 tabular-nums">
              <span>Descuento</span>
               <span className="font-medium">-{formatCents(totalDiscount)}</span>
            </div>
          )}
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-900 dark:text-stone-100">Total</span>
        <span className="text-xl font-bold text-amber-600 tabular-nums">{formatCents(total)}</span>
      </div>
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-[10px] font-semibold text-slate-400 dark:text-stone-500 uppercase tracking-wide mb-1">Cliente</label>
          <input type="text" value={customerId} onChange={e => setCustomerId(e.target.value)}
            placeholder="Consumidor final"
            className="w-full border border-slate-200/80 dark:border-stone-200/80 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-stone-100 placeholder:text-slate-400/60 dark:placeholder:text-stone-400/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all" />
        </div>
        <Button variant="secondary" className="mb-0 shrink-0" style={{ height: '38px', padding: '0 12px' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
        </Button>
      </div>
      <div>
        <label className="block text-[10px] font-semibold text-slate-400 dark:text-stone-500 uppercase tracking-wide mb-1.5">Pagos</label>
        <div className="space-y-2">
          {payments.map((pm, i) => (
            <div key={i} className="flex gap-1.5 items-center">
              <select value={pm.method} onChange={e => {
                const next = [...payments]
                next[i] = { ...next[i], method: e.target.value }
                setPayments(next)
              }}
                className="border border-slate-200/80 dark:border-stone-200/80 rounded-lg px-2 py-1.5 text-xs text-slate-700 dark:text-stone-200 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400">
                {PAYMENT_METHODS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-stone-500 font-medium">₡</span>
                <input type="number" value={pm.amount} min={0}
                  onChange={e => {
                    const next = [...payments]
                    const val = Number(e.target.value)
                    next[i] = { ...next[i], amount: Math.max(0, val) }
                    setPayments(next)
                  }}
                  className="w-full border border-slate-200/80 dark:border-stone-200/80 rounded-lg pl-6 pr-2 py-1.5 text-xs text-right tabular-nums font-semibold text-slate-800 dark:text-stone-100 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400" />
              </div>
              {payments.length > 1 && (
                <button onClick={() => setPayments(payments.filter((_, j) => j !== i))}
                  className="text-slate-300 dark:text-stone-300 hover:text-red-500 transition-colors shrink-0 p-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-1.5">
          {paymentTotal !== total ? (
            <p className={`text-[11px] font-semibold ${paymentTotal < total ? 'text-amber-600' : 'text-red-600'}`}>
              {paymentTotal < total
                ? `Faltan ₡${((total - paymentTotal) / 100).toLocaleString('es-CR')}`
                : `Sobran ₡${((paymentTotal - total) / 100).toLocaleString('es-CR')}`}
            </p>
          ) : <span />}
          <button onClick={() => setPayments([...payments, { method: 'cash', amount: 0 }])}
            className="text-[11px] font-semibold text-amber-500 hover:text-amber-700 transition-colors">
            + Agregar método
          </button>
        </div>
      </div>
      <Button onClick={handleCheckout} disabled={cart.length === 0 || paymentTotal !== total}
        className="w-full py-3.5 text-base font-bold rounded-xl shadow-sm dark:shadow-black/20 shadow-amber-600/20 disabled:shadow-none">
        {cart.length === 0 ? 'Finalizar venta' : `Cobrar ${formatCents(total)}`}
      </Button>
      {message && <p className="text-xs font-semibold text-emerald-600/80 text-center">{message}</p>}
    </>
  )

  return (
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full">
      <SEO noIndex />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-stone-100 tracking-tight">Punto de Venta</h1>
            <p className="text-xs text-slate-400/80 dark:text-stone-500/80 capitalize mt-0.5">{today}</p>
          </div>
          {cart.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-stone-400 bg-white dark:bg-stone-900 px-3 py-1.5 rounded-full shadow-card border border-slate-200/60 dark:border-stone-200/60">
              <svg className="w-3.5 h-3.5 text-slate-400 dark:text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
              {cart.length} {cart.length === 1 ? 'item' : 'items'}
            </div>
          )}
        </div>
        <div className="relative mb-4">
          <input type="text" value={quickSearch} onChange={e => setQuickSearch(e.target.value)}
            placeholder="Buscar producto por nombre, marca o categoría..."
            className="w-full border border-slate-200/80 dark:border-stone-200/80 rounded-xl pl-11 pr-10 py-3 text-sm text-slate-800 dark:text-stone-100 placeholder:text-slate-400/70 dark:placeholder:text-stone-400/70 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 bg-white dark:bg-stone-900 shadow-card transition-all" />
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400/70 dark:text-stone-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          {quickSearch && (
            <button onClick={() => { setQuickSearch(''); setSearchResults([]) }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-stone-500 hover:text-slate-600 dark:hover:text-stone-300 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white dark:bg-stone-900 border border-slate-200/60 dark:border-stone-200/60 rounded-xl shadow-premium z-20 max-h-72 overflow-y-auto mt-1.5">
              {searchResults.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-amber-50/70 cursor-pointer border-b border-slate-100 dark:border-stone-100 last:border-0 transition-colors" onClick={() => { addToCart(p); setQuickSearch(''); setSearchResults([]) }}>
                  {p.image ? <img src={p.image} alt="" className="w-10 h-10 object-cover rounded-lg" /> : <div className="w-10 h-10 bg-slate-100 dark:bg-stone-800 rounded-lg" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-stone-100 truncate">{p.name}</p>
                    <p className="text-xs text-slate-500 dark:text-stone-400 truncate">{p.brand} · {p.category}</p>
                  </div>
                  <span className="text-sm font-bold text-amber-600">{formatCents(p.sale_price)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 items-start">
          {categories.map(c => (
            <button key={c.id} onClick={() => setActiveCategory(c.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-150 ${activeCategory === c.id ? 'bg-amber-600 text-white shadow-sm dark:shadow-black/20 shadow-amber-600/20' : 'bg-white dark:bg-stone-900 text-slate-500 dark:text-stone-400 border border-slate-200/80 dark:border-stone-200/80 hover:border-amber-300 hover:text-amber-600 shadow-card'}`}>
              {c.name}
            </button>
          ))}
          <button onClick={() => { setCreateForm(f => ({ ...f, category_id: activeCategory })); setShowCreate(true) }}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-dashed border-amber-300/60 text-amber-500 hover:bg-amber-50/70 hover:border-amber-300 whitespace-nowrap transition-all duration-150">
            + Nuevo producto
          </button>
        </div>
        <div className="flex-1 overflow-y-auto -mx-1 px-1">
          {quickSearch.length >= 2 && searchResults.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {searchResults.map(p => (
                <ProductCard key={p.id} p={p} onClick={() => { addToCart(p); setQuickSearch(''); setSearchResults([]) }} isSearch />
              ))}
            </div>
          )}
          {quickSearch.length >= 2 && searchResults.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-stone-500">
              <svg className="w-12 h-12 mb-3 text-slate-300 dark:text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <p className="text-sm font-medium">Sin resultados para "{quickSearch}"</p>
            </div>
          )}
          {quickSearch.length < 2 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {products.map(p => (
                <ProductCard key={p.id} p={p} onClick={() => setSelectedProduct(p)} />
              ))}
              {products.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-16">
                  <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 dark:bg-stone-800 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-slate-400 dark:text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  </div>
                  <p className="text-base text-slate-500 dark:text-stone-400 font-medium">Aún no hay productos registrados</p>
                  <p className="text-sm text-slate-400 dark:text-stone-500 mt-1">Agregá tu primer producto para comenzar</p>
                  <button onClick={() => { setCreateForm(f => ({ ...f, category_id: activeCategory })); setShowCreate(true) }}
                    className="mt-5 inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 transition-all shadow-card">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    + Nuevo producto
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-20 lg:hidden">
          <button onClick={() => setShowCartMobile(true)}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white text-sm font-bold shadow-lg shadow-amber-600/30 flex items-center justify-between px-5">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
              {cart.length} {cart.length === 1 ? 'item' : 'items'}
            </span>
            <span>{formatCents(total)}</span>
          </button>
        </div>
      )}
      {showCartMobile && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setShowCartMobile(false)}>
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-white dark:bg-stone-900 rounded-t-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-stone-100 shrink-0">
              <h2 className="font-semibold text-slate-800 dark:text-stone-100 text-sm">Carrito</h2>
              <button onClick={() => setShowCartMobile(false)} className="text-slate-300 dark:text-stone-300 hover:text-slate-500 dark:hover:text-stone-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">{cartItems}</div>
            <div className="p-4 border-t border-slate-100 dark:border-stone-100 shrink-0">{cartFooter}</div>
          </div>
        </div>
      )}
      <div className="hidden lg:flex w-80 shrink-0 bg-white dark:bg-stone-900 rounded-2xl flex-col shadow-cart">
        <div className="px-4 py-4 border-b border-slate-100/80 dark:border-stone-100/80">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
            </div>
            <h2 className="font-semibold text-slate-800 dark:text-stone-100 text-sm">Carrito</h2>
            {cart.length > 0 && (
              <span className="ml-auto text-[11px] font-medium text-slate-400 dark:text-stone-500 bg-slate-100/80 dark:bg-stone-800 px-2 py-0.5 rounded-full">{cart.length}</span>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">{cartItems}</div>
        <div className="p-4 border-t border-slate-100/80 dark:border-stone-100/80 space-y-3.5">{cartFooter}</div>
      </div>
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-stone-100">
              <h2 className="text-base font-semibold text-slate-900 dark:text-stone-100">Nuevo producto</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-300 dark:text-stone-300 hover:text-slate-500 dark:hover:text-stone-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <ImageUpload label="Foto" value={createForm.image} onChange={v => setCreateForm(f => ({ ...f, image: v }))} />
              <Input label="Nombre" value={createForm.name} onChange={v => setCreateForm(f => ({ ...f, name: v }))} required />
              <Input label="Marca" value={createForm.brand} onChange={v => setCreateForm(f => ({ ...f, brand: v }))} />
              <Select label="Categoría" value={createForm.category_id} onChange={v => {
                const cat = categories.find(c => c.id === v)
                setCreateForm(f => ({ ...f, category_id: v, category: cat?.name || '' }))
              }} options={categories.map(c => ({ value: c.id, label: c.name }))} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Precio venta" type="number" value={createForm.sale_price} onChange={v => setCreateForm(f => ({ ...f, sale_price: Number(v) }))} />
                <Input label="Precio costo" type="number" value={createForm.cost_price} onChange={v => setCreateForm(f => ({ ...f, cost_price: Number(v) }))} />
              </div>
        <Input label="Código de barras" value={createForm.barcode} onChange={v => setCreateForm(f => ({ ...f, barcode: v }))} />
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={createForm.show_in_store} onChange={e => setCreateForm(f => ({ ...f, show_in_store: e.target.checked }))}
            className="w-4.5 h-4.5 rounded border-slate-300 dark:border-stone-300 text-amber-600 focus:ring-amber-500/30 cursor-pointer" />
          <span className="text-sm text-slate-600 dark:text-stone-300">Mostrar en tienda online</span>
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
          <Button onClick={handleCreateProduct}>Crear</Button>
        </div>
            </div>
          </div>
        </div>
      )}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowConfirm(false)}>
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-card w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-stone-100">Confirmar venta</h3>
              <p className="text-sm text-slate-500 dark:text-stone-400 mt-1">{cart.length} producto{cart.length !== 1 ? 's' : ''}</p>
              <p className="text-2xl font-bold text-amber-600 mt-2">{formatCents(total)}</p>
              <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                {payments.filter(p => p.amount > 0).map((pm, i) => (
                  <span key={i} className="text-[11px] text-slate-500 dark:text-stone-400 bg-slate-100 dark:bg-stone-800 px-2.5 py-1 rounded-full">
                    {methodLabel(pm.method)} ₡{(pm.amount / 100).toLocaleString('es-CR')}
                  </span>
                ))}
              </div>
              {customerId && (
                <p className="text-xs text-slate-500 dark:text-stone-400 mt-2">Cliente: {customerId}</p>
              )}
            </div>
            <div className="flex gap-2 p-6 pt-0">
              <Button variant="secondary" onClick={() => setShowConfirm(false)} className="flex-1">Cancelar</Button>
              <Button onClick={doCheckout} className="flex-1">Confirmar venta</Button>
            </div>
          </div>
        </div>
      )}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={qty => addToCartWithQty(selectedProduct, qty)}
        />
      )}
    </div>
  )
}
