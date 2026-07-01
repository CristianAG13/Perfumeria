import { useState, useEffect } from 'react'
import { Table, Button } from '../components/ui'
import { listAllUsers, changePassword, toggleBlockUser, deleteUser } from '../lib/api'
import type { AuthResponse } from '../lib/api'
import { SEO } from '../components/SEO'

export function UsuariosPage() {
  const [users, setUsers] = useState<AuthResponse['user'][]>([])
  const [passwordModal, setPasswordModal] = useState<{ id: string; email: string } | null>(null)
  const [newPass, setNewPass] = useState('')
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null)

  const load = async () => {
    const data = await listAllUsers()
    setUsers(data)
  }

  useEffect(() => { load() }, [])

  const handleChangePassword = async () => {
    if (!passwordModal || !newPass) return
    try {
      await changePassword(passwordModal.id, newPass)
      setPasswordModal(null)
      setNewPass('')
    } catch (e: any) {
      alert(e.response?.data?.error || 'Error al cambiar contraseña')
    }
  }

  const handleToggleBlock = async (userId: string) => {
    try {
      const updated = await toggleBlockUser(userId)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, blocked: updated.blocked } : u))
    } catch (e: any) {
      alert(e.response?.data?.error || 'Error al cambiar estado')
    }
  }

  const handleDelete = async () => {
    if (!deleteModal) return
    try {
      await deleteUser(deleteModal.id)
      setDeleteModal(null)
      setUsers(prev => prev.filter(u => u.id !== deleteModal.id))
    } catch (e: any) {
      alert(e.response?.data?.error || 'Error al eliminar usuario')
    }
  }

  // Modals
  const passOpen = passwordModal !== null
  const delOpen = deleteModal !== null

  return (
    <div className="space-y-6">
      <SEO noIndex />
      <div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-white">Usuarios</h2>
        <p className="text-sm text-stone-500 mt-0.5">{users.length} registrados</p>
      </div>

      <Table
        headers={['Email', 'Rol', 'Estado', 'Acciones']}
        rows={users.map(u => [
          u.email || u.username,
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            u.role === 'admin'
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
              : 'bg-stone-100 text-stone-600 dark:bg-neutral-800 dark:text-neutral-300'
          }`}>
            {u.role === 'admin' ? 'Admin' : 'Cliente'}
          </span>,
          u.blocked
            ? <span className="text-xs text-red-500 font-medium">Bloqueado</span>
            : <span className="text-xs text-emerald-500 font-medium">Activo</span>,
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" onClick={() => setPasswordModal({ id: u.id, email: u.email || u.username })}>
              Cambiar pass
            </Button>
            <Button variant={u.blocked ? 'primary' : 'danger'} onClick={() => handleToggleBlock(u.id)}>
              {u.blocked ? 'Desbloquear' : 'Bloquear'}
            </Button>
            {u.role !== 'admin' && (
              <Button variant="danger" onClick={() => setDeleteModal({ id: u.id, name: u.name || u.email || u.username })}>
                Eliminar
              </Button>
            )}
          </div>,
        ])}
      />

      {/* Modal cambiar password */}
      {passOpen && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => { setPasswordModal(null); setNewPass('') }}>
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-card w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 dark:border-stone-800">
              <h2 className="text-base font-semibold text-slate-900 dark:text-stone-100">Cambiar contraseña</h2>
              <button onClick={() => { setPasswordModal(null); setNewPass('') }} className="text-slate-400 hover:text-slate-600 dark:hover:text-stone-300 p-1">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-stone-600 dark:text-stone-400">{passwordModal?.email}</p>
              <input
                type="password"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                placeholder="Nueva contraseña"
                className="w-full border border-slate-200 dark:border-stone-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-stone-100 placeholder-slate-400 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => { setPasswordModal(null); setNewPass('') }}>Cancelar</Button>
                <Button onClick={handleChangePassword} disabled={!newPass}>Guardar</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {delOpen && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setDeleteModal(null)}>
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-card w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 dark:border-stone-800">
              <h2 className="text-base font-semibold text-slate-900 dark:text-stone-100">Eliminar usuario</h2>
              <button onClick={() => setDeleteModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-stone-300 p-1">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-stone-600 dark:text-stone-400">
                ¿Estás seguro de eliminar a <strong>{deleteModal?.name}</strong>?<br />
                <span className="text-red-500 text-xs">También se eliminará su registro como cliente.</span>
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setDeleteModal(null)}>Cancelar</Button>
                <Button variant="danger" onClick={handleDelete}>Eliminar</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
