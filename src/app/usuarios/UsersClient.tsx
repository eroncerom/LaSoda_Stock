'use client'

import { useState } from 'react'
import { Users, Mail, Shield, User, Plus, Pencil, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { createUserAction, updateUserAction, deleteUserAction } from '@/app/actions'

export default function UsersClient({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'db_manager'
  })

  function openModal(user?: any) {
    if (user) {
      setEditingUser(user)
      setFormData({
        email: user.email,
        password: '',
        full_name: user.full_name || '',
        role: user.role || 'db_manager'
      })
    } else {
      setEditingUser(null)
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: 'db_manager'
      })
    }
    setError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingUser(null)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const fd = new FormData()
    fd.append('email', formData.email)
    fd.append('full_name', formData.full_name)
    fd.append('role', formData.role)
    if (formData.password) fd.append('password', formData.password)

    let res
    if (editingUser) {
      res = await updateUserAction(editingUser.id, fd)
    } else {
      res = await createUserAction(fd)
    }

    setIsLoading(false)
    if (!res.success) {
      setError(res.error || 'Ocurrió un error inesperado')
      return
    }

    // Quick optimistic update (refresh page is better, but this works to not use router.refresh)
    window.location.reload()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setIsLoading(true)
    setError('')
    
    const res = await deleteUserAction(deleteTarget.id)
    setIsLoading(false)

    if (!res.success) {
      setError(res.error || 'Ocurrió un error inesperado')
      return
    }

    window.location.reload()
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Gestión de Usuarios</div>
          <div className="topbar-subtitle">{users.length} gestores registrados</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
          <Plus size={14} />
          Nuevo usuario
        </button>
      </div>

      <div className="page-body">
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Registro</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px 0' }}>
                      <div style={{ color: 'var(--text-tertiary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <Users size={32} opacity={0.3} />
                        <span>No se encontraron usuarios o no tienes permisos</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((u: any) => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ 
                            width: 32, height: 32, 
                            borderRadius: '50%', 
                            background: 'var(--bg-overlay)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--accent)'
                          }}>
                            <User size={16} />
                          </div>
                          <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{u.full_name || 'Sin nombre'}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                          <Mail size={14} style={{ opacity: 0.6 }} />
                          {u.email}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Shield size={14} style={{ color: u.role === 'superuser' ? 'var(--accent)' : 'var(--text-tertiary)' }} />
                          <span className={`badge ${u.role === 'superuser' ? 'status-confirmed' : ''}`} style={{ fontSize: '0.7rem' }}>
                            {u.role === 'superuser' ? 'Superusuario' : 'Gestor BBDD'}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                        {formatDate(u.updated_at)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-ghost btn-sm btn-icon"
                            title="Editar"
                            onClick={() => openModal(u)}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="btn btn-danger btn-sm btn-icon"
                            title="Eliminar"
                            onClick={() => setDeleteTarget(u)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <User size={18} style={{ color: 'var(--accent)' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 500 }}>
                {editingUser ? 'Editar usuario' : 'Nuevo usuario'}
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                {error && (
                  <div style={{ padding: '10px 12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-danger)', borderRadius: 6, fontSize: '0.85rem' }}>
                    {error}
                  </div>
                )}
                
                <div className="form-group">
                  <label className="form-label">Nombre completo</label>
                  <input
                    className="input"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    className="input"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    Contraseña {editingUser && <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: 400 }}>(dejar en blanco para mantener)</span>}
                  </label>
                  <input
                    className="input"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Rol</label>
                  <select
                    className="input"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="db_manager">Gestor BBDD</option>
                    <option value="superuser">Superusuario</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost btn-sm" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={isLoading}>
                  {isLoading ? 'Guardando...' : 'Guardar usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => { setDeleteTarget(null); setError('') }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <Trash2 size={18} style={{ color: 'var(--status-danger)' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 500 }}>Eliminar usuario</h3>
            </div>
            <div className="modal-body">
              {error && (
                <div style={{ padding: '10px 12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-danger)', borderRadius: 6, fontSize: '0.85rem', marginBottom: 12 }}>
                  {error}
                </div>
              )}
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                ¿Seguro que quieres eliminar a <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget.full_name || deleteTarget.email}</strong>?
                Esta acción revocará su acceso y no se puede deshacer.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => { setDeleteTarget(null); setError('') }}>
                Cancelar
              </button>
              <button
                className="btn btn-danger btn-sm"
                disabled={isLoading}
                onClick={handleDelete}
              >
                {isLoading ? 'Eliminando...' : 'Eliminar usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
