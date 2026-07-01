import { type ReactNode, type MouseEvent, useState, useRef } from 'react'

interface ButtonProps {
  children: ReactNode
  onClick?: (e: MouseEvent) => void
  type?: 'button' | 'submit'
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
}

export function Button({ children, onClick, type = 'button', variant = 'primary', disabled, className = '', style }: ButtonProps) {
  const variants = {
    primary: 'bg-gradient-to-br from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800 active:from-amber-800 active:to-amber-900 shadow-sm shadow-amber-600/10',
    secondary: 'bg-white dark:bg-stone-800 text-slate-700 dark:text-stone-200 border border-slate-200 dark:border-stone-700 hover:bg-slate-50 dark:hover:bg-stone-700 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-sm transition-all',
    danger: 'bg-gradient-to-br from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-sm',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={style}
      className={`inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}

export function Input({ label, value, onChange, type = 'text', required, placeholder }: {
  label: string
  value: string | number
  onChange: (v: string) => void
  type?: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-stone-300 mb-1.5">{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        required={required} placeholder={placeholder}
        className="w-full border border-slate-200 dark:border-stone-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-stone-100 placeholder-slate-400 dark:placeholder-stone-500 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all" />
    </div>
  )
}

export function Select({ label, value, onChange, options }: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-stone-300 mb-1.5">{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-slate-200 dark:border-stone-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-stone-100 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all">
        <option value="">Seleccionar...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

export function ImageUpload({ label, value, onChange }: {
  label: string
  value: string
  onChange: (url: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al subir imagen')
      onChange(data.url)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-stone-300 mb-1.5">{label}</label>}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 dark:border-stone-700 text-sm text-slate-600 dark:text-stone-300 hover:bg-slate-50 dark:hover:bg-stone-800 hover:border-slate-300 dark:hover:border-stone-600 transition-all disabled:opacity-50">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          {uploading ? 'Subiendo...' : 'Subir foto'}
        </button>
        <input ref={inputRef} type="file" accept="image/*" onChange={e => handleFile(e.target.files?.[0])} className="hidden" />
        {value && (
          <div className="relative">
            <img src={value} alt="" className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-stone-700" />
            <button type="button" onClick={() => { onChange(''); if (inputRef.current) inputRef.current.value = '' }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center hover:bg-red-600">&times;</button>
          </div>
        )}
      </div>
    </div>
  )
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/30 dark:bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-card w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 dark:border-stone-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-stone-100">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-stone-300 p-1">&times;</button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
      </div>
    </div>
  )
}

export function Table({ headers, rows }: { headers: string[]; rows: (string | number | ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto border border-slate-200 dark:border-stone-700 rounded-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-stone-800/50 border-b border-slate-200 dark:border-stone-700">
            {headers.map((h, i) => (
              <th key={i} className="text-left px-4 py-3 font-medium text-slate-500 dark:text-stone-400">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-100 dark:border-stone-800 hover:bg-slate-50 dark:hover:bg-stone-800/30 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-slate-700 dark:text-stone-200">{cell}</td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={headers.length} className="px-4 py-12 text-center text-slate-400 dark:text-stone-500">Sin resultados</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
