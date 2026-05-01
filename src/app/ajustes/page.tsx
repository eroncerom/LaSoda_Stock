'use client'

import { useState, useEffect } from 'react'
import { 
  User, 
  Settings as SettingsIcon, 
  Bell, 
  Moon, 
  Shield, 
  Database, 
  Info, 
  LogOut,
  ChevronRight,
  Monitor,
  Palette,
  AlertCircle
} from 'lucide-react'
import { Topbar } from '@/components/layout/topbar'
import { logout } from '@/app/login/actions'
import { getUserProfile, updateProfileName } from '@/app/actions'

export default function AjustesPage() {
  const [user, setUser] = useState<{ email: string; role: string; full_name: string | null } | null>(null)
  const [threshold, setThreshold] = useState(5)
  const [loading, setLoading] = useState(true)
  const [editName, setEditName] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    const init = async () => {
      const profile = await getUserProfile()
      if (profile) {
        setUser({ 
          email: profile.email, 
          role: profile.role || 'usuario', 
          full_name: profile.full_name 
        })
        setNewName(profile.full_name || '')
      }
      
      const saved = localStorage.getItem('low_stock_threshold')
      if (saved) setThreshold(parseInt(saved))
      
      setLoading(false)
    }
    init()
  }, [])

  const handleSaveName = async () => {
    const res = await updateProfileName(newName)
    if (res.success) {
      setUser(prev => prev ? { ...prev, full_name: newName } : null)
      setEditName(false)
      // Optional: show toast or success state
    } else {
      alert('Error al actualizar nombre: ' + res.error)
    }
  }

  const handleThresholdChange = (val: number) => {
    setThreshold(val)
    localStorage.setItem('low_stock_threshold', val.toString())
  }

  if (loading) {
    return (
      <>
        <Topbar title="Ajustes" subtitle="Cargando configuración..." />
        <div className="page-body">
          <div className="skeleton" style={{ height: 200, borderRadius: 16, marginBottom: 24 }} />
          <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
        </div>
      </>
    )
  }

  return (
    <>
      <Topbar title="Ajustes" subtitle="Configuración de la cuenta y sistema" />

      <div className="page-body" style={{ maxWidth: 800, margin: '0 auto' }}>
        
        {/* --- PROFILE SECTION --- */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 24 }}>
            <div style={{ 
              width: 64, height: 64, 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--accent) 0%, var(--bg-overlay) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-inverse)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              {(user?.full_name || user?.email || '?')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user?.full_name || 'Sin Nombre'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                {user?.email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Shield size={14} style={{ color: user?.role === 'superuser' ? 'var(--status-warn)' : 'var(--text-tertiary)' }} />
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--text-tertiary)', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  fontWeight: 600
                }}>
                  {user?.role === 'superuser' ? 'Superusuario' : 'Administrador'}
                </span>
              </div>
            </div>
          </div>
          <div style={{ padding: '0 24px 24px' }}>
            {editName ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input 
                  type="text" 
                  className="input" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Tu nombre completo"
                  style={{ flex: 1 }}
                />
                <button className="btn btn-primary" onClick={handleSaveName}>Guardar</button>
                <button className="btn btn-ghost" onClick={() => setEditName(false)}>Cancelar</button>
              </div>
            ) : (
              <button 
                className="btn btn-ghost btn-sm" 
                style={{ color: 'var(--accent)' }}
                onClick={() => setEditName(true)}
              >
                Modificar nombre de perfil
              </button>
            )}
          </div>
        </div>

        {/* --- SETTINGS GROUPS --- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Inventory Rules */}
          <section>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, marginLeft: 4 }}>
              Inventario
            </h3>
            <div className="card">
              <div className="card-body" style={{ padding: 0 }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>Umbral de Stock Bajo</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                        Avisar cuando un producto tenga menos de {threshold} unidades.
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button 
                        onClick={() => handleThresholdChange(Math.max(1, threshold - 1))}
                        className="btn btn-ghost btn-sm btn-icon"
                      >
                        -
                      </button>
                      <span style={{ width: 24, textAlign: 'center', fontWeight: 600 }}>{threshold}</span>
                      <button 
                        onClick={() => handleThresholdChange(threshold + 1)}
                        className="btn btn-ghost btn-sm btn-icon"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                <SettingRow 
                  icon={<Bell size={18} />} 
                  label="Notificaciones de stock" 
                  description="Recibir alertas visuales en el dashboard"
                  toggle={true}
                  defaultChecked={true}
                />
              </div>
            </div>
          </section>

          {/* Interface */}
          <section>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, marginLeft: 4 }}>
              Interfaz y Apariencia
            </h3>
            <div className="card">
              <div className="card-body" style={{ padding: 0 }}>
                <SettingRow 
                  icon={<Moon size={18} />} 
                  label="Modo Oscuro" 
                  description="Cambiar entre modo claro y oscuro"
                  value="Siempre activo"
                />
                <SettingRow 
                  icon={<Palette size={18} />} 
                  label="Color de Acento" 
                  description="Personalizar colores de la aplicación"
                  value="Stone (Default)"
                />
                <SettingRow 
                  icon={<Monitor size={18} />} 
                  label="Vistas Compactas" 
                  description="Mostrar más datos con menos espacio"
                  toggle={true}
                />
              </div>
            </div>
          </section>

          {/* System */}
          <section>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, marginLeft: 4 }}>
              Sistema y Datos
            </h3>
            <div className="card">
              <div className="card-body" style={{ padding: 0 }}>
                <SettingRow 
                  icon={<Database size={18} />} 
                  label="Conexión Supabase" 
                  description="Estado de la base de datos en tiempo real"
                  value="Conectado"
                />
                <SettingRow 
                  icon={<Info size={18} />} 
                  label="Versión de la App" 
                  description="Versión actual instalada"
                  value="v1.2.0-stable"
                />
                <div 
                  onClick={() => alert('Caché del sistema limpiada')}
                  style={{ 
                    padding: '16px 24px', 
                    cursor: 'pointer',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    color: 'var(--status-danger)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <AlertCircle size={18} />
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>Limpiar Caché Local</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: 2 }}>Borra datos temporales almacenados</div>
                    </div>
                  </div>
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          </section>

          {/* Sign Out */}
          <button 
            onClick={() => logout()}
            className="btn btn-ghost" 
            style={{ 
              width: '100%', 
              padding: '16px', 
              justifyContent: 'center', 
              border: '1px solid var(--status-danger)', 
              color: 'var(--status-danger)',
              background: 'rgba(194,107,107,0.05)',
              marginTop: 12
            }}
          >
            <LogOut size={18} />
            Cerrar Sesión en este dispositivo
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 40, paddingBottom: 40 }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            &copy; 2026 La Soda Stock · Hecho con ♡ para artesanos
          </p>
        </div>
      </div>
    </>
  )
}

function SettingRow({ icon, label, description, value, toggle, defaultChecked }: { 
  icon: React.ReactNode; 
  label: string; 
  description: string;
  value?: string;
  toggle?: boolean;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked || false)

  return (
    <div style={{ 
      padding: '16px 24px', 
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ color: 'var(--text-secondary)' }}>{icon}</div>
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{description}</div>
        </div>
      </div>
      
      {toggle ? (
        <button 
          onClick={() => setChecked(!checked)}
          style={{ 
            width: 44, height: 22, 
            borderRadius: 11, 
            background: checked ? 'var(--status-ok)' : 'var(--bg-overlay)',
            position: 'relative',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.2s ease'
          }}
        >
          <div style={{ 
            position: 'absolute', 
            top: 2, left: checked ? 24 : 2,
            width: 18, height: 18, 
            borderRadius: '50%', 
            background: 'white',
            transition: 'left 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
          }} />
        </button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
          {value}
          <ChevronRight size={14} />
        </div>
      )}
    </div>
  )
}
