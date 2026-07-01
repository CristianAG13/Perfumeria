import { useState, useEffect } from 'react'
import { Button, Input, Modal, Table } from '../components/ui'
import { searchCustomers, createCustomer, updateCustomer } from '../lib/api'
import type { Customer } from '../lib/types'
import { SEO } from '../components/SEO'

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [query, setQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [form, setForm] = useState({ name: '', last_name: '', phone: '', email: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const load = async () => {
    const data = await searchCustomers(query)
    setCustomers(data)
  }

  useEffect(() => { load() }, [query])

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
        await updateCustomer(editing.id, form)
      } else {
        await createCustomer(form)
      }
      setShowModal(false)
      setEditing(null)
      load()
    } catch { /* backend error */ }
  }

  const handleEdit = (c: Customer) => {
    setEditing(c)
    setForm({ name: c.name, last_name: c.last_name || '', phone: c.phone, email: c.email })
    setShowModal(true)
  }

  return (
    <div>
      <SEO noIndex />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Clientes</h1>
        <Button onClick={() => { setEditing(null); setForm({ name: '', last_name: '', phone: '', email: '' }); setErrors({}); setShowModal(true) }}>
          Nuevo cliente
        </Button>
      </div>
      <Input label="Buscar" value={query} onChange={setQuery} placeholder="Nombre, apellido, teléfono o email..." />
      <Table
        headers={['Nombre', 'Apellido', 'Teléfono', 'Email', 'Acciones']}
        rows={customers.map(c => [
          c.name,
          c.last_name || '-',
          c.phone,
          c.email,
          <Button variant="secondary" onClick={() => handleEdit(c)}>Editar</Button>,
        ])}
      />
      {showModal && (
        <Modal title={editing ? 'Editar cliente' : 'Nuevo cliente'} onClose={() => setShowModal(false)}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input label="Nombre" value={form.name} onChange={v => { setForm(f => ({ ...f, name: v })); setErrors(e => ({ ...e, name: '' })) }} required />
              {errors.name && <p className="text-xs text-red-500 mt-1.5 ml-0.5">{errors.name}</p>}
            </div>
            <Input label="Apellido" value={form.last_name} onChange={v => setForm(f => ({ ...f, last_name: v }))} />
          </div>
          <Input label="Teléfono" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
          <Input label="Email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editing ? 'Guardar' : 'Crear'}</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}