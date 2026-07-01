import { useState, useEffect } from 'react'
import { Button, Input, Select, ImageUpload } from '../components/ui'
import { ProductDetailModal } from '../components/ProductDetail'
import { searchProducts, createProduct, updateProduct, deactivateProduct, listCategories } from '../lib/api'
import { formatCents, toCents, fromCents } from '../lib/format'
import type { Product, Category } from '../lib/types'
import { SEO } from '../components/SEO'

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [form, setForm] = useState({ name: '', brand: '', category_id: '', category: '', barcode: '', image: '', description: '', gender: '', discount_percent: 0, sale_price: 0, cost_price: 0, min_stock: 0, show_in_store: true })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const load = async () => {
    const data = await searchProducts(query)
    setProducts(data)
  }

  const loadCategories = async () => {
    const data = await listCategories()
    setCategories(data)
  }

  useEffect(() => { load(); loadCategories() }, [query])

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'El nombre es obligatorio'
    if (!form.barcode.trim()) errs.barcode = 'El código de barras es obligatorio'
    if (!form.category_id) errs.category_id = 'Seleccioná una categoría'
    if (!form.sale_price || form.sale_price <= 0) errs.sale_price = 'El precio de venta debe ser mayor a 0'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    const payload: Record<string, any> = {
      ...form,
      sale_price: toCents(form.sale_price),
      cost_price: toCents(form.cost_price),
    }
    const cat = categories.find(c => c.id === form.category_id)
    payload.category = cat?.name || ''
    try {
      if (editing) {
        await updateProduct(editing.id, payload)
      } else {
        await createProduct(payload)
      }
      setShowForm(false)
      setEditing(null)
      load()
    } catch {
      // error del backend
    }
  }

  const handleEdit = () => {
    if (!selectedProduct) return
    setEditing(selectedProduct)
    setForm({
      name: selectedProduct.name,
      brand: selectedProduct.brand,
      category_id: selectedProduct.category_id,
      category: selectedProduct.category,
      barcode: selectedProduct.barcode,
      image: selectedProduct.image,
      description: selectedProduct.description,
      gender: selectedProduct.gender,
      discount_percent: selectedProduct.discount_percent || 0,
      sale_price: fromCents(selectedProduct.sale_price),
      cost_price: fromCents(selectedProduct.cost_price),
      min_stock: selectedProduct.min_stock,
      show_in_store: selectedProduct.show_in_store,
    })
    setErrors({})
    setSelectedProduct(null)
    setShowForm(true)
  }

  const handleDeactivate = async () => {
    if (!selectedProduct) return
    await deactivateProduct(selectedProduct.id)
    setSelectedProduct(null)
    load()
  }

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', brand: '', category_id: '', category: '', barcode: '', image: '', description: '', gender: '', discount_percent: 0, sale_price: 0, cost_price: 0, min_stock: 0, show_in_store: true })
    setErrors({})
    setShowForm(true)
  }

  const stockBadge = (p: Product) => {
    if (p.current_stock <= 0) return { label: 'Sin stock', class: 'bg-red-100 text-red-700' }
    if (p.current_stock <= p.min_stock) return { label: `Bajo stock`, class: 'bg-amber-100 text-amber-700' }
    return { label: `${p.current_stock} uds.`, class: 'bg-emerald-100 text-emerald-700' }
  }

  return (
    <div>
      <SEO noIndex />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-stone-200">Productos</h1>
          <p className="text-sm text-slate-400 dark:text-stone-500 mt-0.5">{products.length} producto{products.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openNew}>+ Nuevo producto</Button>
      </div>
      <div className="relative mb-6">
        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por nombre, marca o código..."
          className="w-full border border-slate-200 dark:border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white dark:bg-stone-900" />
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 dark:text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      </div>
      {products.length === 0 && !query && (
        <div className="text-center py-20 text-slate-400 dark:text-stone-500">
          <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 dark:bg-stone-800/50 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-slate-400 dark:text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </div>
          <p className="text-base text-slate-500 dark:text-stone-400 font-medium">Aún no hay productos registrados</p>
          <p className="text-sm text-slate-400 dark:text-stone-500 mt-1">Agregá tu primer producto para comenzar</p>
          <Button className="mt-5 shadow-card" onClick={openNew}>+ Nuevo producto</Button>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {products.map(p => {
          const badge = stockBadge(p)
          return (
            <div key={p.id} onClick={() => setSelectedProduct(p)}
              className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-200 rounded-xl overflow-hidden cursor-pointer hover:border-amber-300 transition-all hover:shadow-card">
              <div className="aspect-square bg-slate-50 dark:bg-stone-800/50 flex items-center justify-center p-3 relative">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                ) : (
                  <svg className="w-10 h-10 text-slate-300 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                )}
                <span className={`absolute top-2 right-2 text-[10px] font-medium px-2 py-0.5 rounded-full {badge.class}`}>{badge.label}</span>
              </div>
              <div className="p-3 space-y-1">
                <p className="text-xs text-slate-400 dark:text-stone-500 truncate">{p.brand || p.category}</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-stone-200 truncate">{p.name}</p>
                <p className="text-base font-bold text-amber-600">{formatCents(p.sale_price)}</p>
              </div>
            </div>
          )
        })}
      </div>
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={() => {}}
          actions={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleEdit} className="flex-1">Editar</Button>
              {selectedProduct.active && <Button variant="danger" onClick={handleDeactivate} className="flex-1">Desactivar</Button>}
            </div>
          }
        />
      )}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-card w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-stone-100">
              <h2 className="text-base font-semibold text-slate-900 dark:text-stone-100">{editing ? 'Editar producto' : 'Nuevo producto'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-300 dark:text-stone-400 hover:text-slate-500 dark:hover:text-stone-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <ImageUpload label="Foto del producto" value={form.image} onChange={v => setForm(f => ({ ...f, image: v }))} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input label="Nombre" value={form.name} onChange={v => { setForm(f => ({ ...f, name: v })); setErrors(e => ({ ...e, name: '' })) }} required />
                  {errors.name && <p className="text-xs text-red-500 mt-1.5 ml-0.5">{errors.name}</p>}
                </div>
                <Input label="Marca" value={form.brand} onChange={v => setForm(f => ({ ...f, brand: v }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-stone-300 mb-1.5">Descripción</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Descripción opcional del producto..."
                  className="w-full border border-slate-200 dark:border-stone-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-stone-100 placeholder-slate-400 dark:placeholder-stone-500 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none" />
              </div>
              <div>
                <Select label="Categoría" value={form.category_id} onChange={v => {
                  const cat = categories.find(c => c.id === v)
                  setForm(f => ({ ...f, category_id: v, category: cat?.name || '' }))
                  setErrors(e => ({ ...e, category_id: '' }))
                }} options={categories.map(c => ({ value: c.id, label: c.name }))} />
                {errors.category_id && <p className="text-xs text-red-500 mt-1.5 ml-0.5">{errors.category_id}</p>}
              </div>
              <div>
                <Input label="Código de barras" value={form.barcode} onChange={v => { setForm(f => ({ ...f, barcode: v })); setErrors(e => ({ ...e, barcode: '' })) }} required />
                {errors.barcode && <p className="text-xs text-red-500 mt-1.5 ml-0.5">{errors.barcode}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-stone-300 mb-1.5">Género</label>
                <div className="flex gap-2">
                  {(['ella', 'el', 'unisex'] as const).map(g => (
                    <button key={g} type="button" onClick={() => setForm(f => ({ ...f, gender: f.gender === g ? '' : g }))}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${
                        form.gender === g
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white dark:bg-stone-800 text-slate-600 dark:text-stone-300 border-slate-200 dark:border-stone-700 hover:border-amber-300'
                      }`}>
                      {g === 'ella' ? 'Ella' : g === 'el' ? 'Él' : 'Unisex'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input label="Precio venta" type="number" value={form.sale_price} onChange={v => { setForm(f => ({ ...f, sale_price: Number(v) })); setErrors(e => ({ ...e, sale_price: '' })) }} />
                  {errors.sale_price && <p className="text-xs text-red-500 mt-1.5 ml-0.5">{errors.sale_price}</p>}
                </div>
                <Input label="Precio costo" type="number" value={form.cost_price} onChange={v => setForm(f => ({ ...f, cost_price: Number(v) }))} />
              </div>
              <Input label="Stock mínimo" type="number" value={form.min_stock} onChange={v => setForm(f => ({ ...f, min_stock: Number(v) }))} />
              <Input label="Descuento (%)" type="number" value={form.discount_percent} onChange={v => { const n = Math.min(100, Math.max(0, Number(v))); setForm(f => ({ ...f, discount_percent: n })) }} />
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.show_in_store} onChange={e => setForm(f => ({ ...f, show_in_store: e.target.checked }))}
                  className="w-4.5 h-4.5 rounded border-slate-300 dark:border-stone-300 text-amber-600 focus:ring-amber-500/30 cursor-pointer" />
                <span className="text-sm text-slate-600 dark:text-stone-300">Mostrar en tienda online</span>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button onClick={handleSave}>{editing ? 'Guardar cambios' : 'Crear producto'}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
