import { useState, useEffect } from 'react'
import { Button } from '../components/ui'
import { listTestimonials, createTestimonial, deleteTestimonial, type Testimonial } from '../lib/api'
import { SEO } from '../components/SEO'

export function TestimoniosPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [rating, setRating] = useState(5)

  const load = () => listTestimonials().then(setTestimonials)

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createTestimonial({ name, text, rating })
    setName('')
    setText('')
    setRating(5)
    setShowForm(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este testimonio?')) return
    await deleteTestimonial(id)
    load()
  }

  return (
    <div className="space-y-6">
      <SEO noIndex />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white font-[family-name:var(--font-display)]">Testimonios</h1>
          <p className="text-sm text-stone-500 dark:text-neutral-400 mt-1">{testimonials.length} testimonio(s)</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Nuevo testimonio'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-stone-200 dark:border-neutral-800 space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-500 dark:text-neutral-400 mb-1">Nombre</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-neutral-700 bg-transparent text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 dark:text-neutral-400 mb-1">Testimonio</label>
            <textarea value={text} onChange={e => setText(e.target.value)} required rows={3}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-neutral-700 bg-transparent text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 dark:text-neutral-400 mb-1">Rating (1-5)</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setRating(n)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                    n <= rating
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                      : 'bg-stone-100 dark:bg-neutral-800 text-stone-400 dark:text-neutral-600'
                  }`}>{n}</button>
              ))}
            </div>
          </div>
          <Button type="submit">Guardar testimonio</Button>
        </form>
      )}

      <div className="grid gap-4">
        {testimonials.map(t => (
          <div key={t.id} className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-stone-200 dark:border-neutral-800">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/30 to-amber-600/30 flex items-center justify-center text-amber-600 dark:text-amber-400 text-sm font-bold">
                  {t.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-900 dark:text-white">{t.name}</p>
                  <div className="flex gap-0.5 mt-0.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <svg key={n} className={`w-3.5 h-3.5 ${n <= t.rating ? 'text-amber-400' : 'text-stone-300 dark:text-neutral-600'}`} viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => handleDelete(t.id)}
                className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
            <p className="mt-3 text-sm text-stone-600 dark:text-neutral-400 leading-relaxed">{t.text}</p>
            <p className="mt-2 text-xs text-stone-400 dark:text-neutral-500">{t.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
