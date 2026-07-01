import { useState, useEffect } from 'react'
import { Button, Input, ImageUpload } from '../components/ui'
import { listCategories, createCategory, updateCategory } from '../lib/api'
import type { Category } from '../lib/types'
import { SEO } from '../components/SEO'

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: '', image: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const load = async () => {
    const data = await listCategories()
    setCategories(data)
  }

  useEffect(() => { load() }, [])

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'El nombre es obligatorio'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    try {
      if (editing) {
        await updateCategory(editing.id, form)
      } else {
        await createCategory(form)
      }
      setShowModal(false)
      setEditing(null)
      load()
    } catch { /* backend error */ }
  }

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', image: '' })
    setErrors({})
    setShowModal(true)
  }

  const handleEdit = (c: Category) => {
    setEditing(c)
    setForm({ name: c.name, image: c.image })
    setShowModal(true)
  }

  return (
    <div>
      <SEO noIndex />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Categorías</h1>
          <p className="text-sm text-gray-500 mt-0.5">{categories.length} categoría{categories.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openNew}>+ Nueva categoría</Button>
      </div>
      {categories.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
          <p className="text-lg">Sin categorías todavía</p>
          <p className="text-sm mt-1">Agregá tu primera categoría</p>
          <Button className="mt-4" onClick={openNew}>+ Nueva categoría</Button>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {categories.map(c => (
          <div key={c.id} onClick={() => handleEdit(c)}
            className="bg-white dark:bg-stone-900 border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:border-blue-400 transition-colors">
            <div className="aspect-square bg-gray-50 flex items-center justify-center p-4">
              {c.image ? (
                <img src={c.image} alt={c.name} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl font-bold text-gray-300">{c.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
            <div className="p-2.5 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-900 truncate text-center">{c.name}</p>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="text-lg font-semibold">{editing ? 'Editar categoría' : 'Nueva categoría'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <ImageUpload label="Foto de la categoría" value={form.image} onChange={v => setForm(f => ({ ...f, image: v }))} />
              <div>
                <Input label="Nombre" value={form.name} onChange={v => { setForm(f => ({ ...f, name: v })); setErrors(e => ({ ...e, name: '' })) }} required />
                {errors.name && <p className="text-xs text-red-500 mt-1.5 ml-0.5">{errors.name}</p>}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button onClick={handleSave}>{editing ? 'Guardar cambios' : 'Crear categoría'}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
