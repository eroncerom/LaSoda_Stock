'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Tag,
  Settings,
  BarChart3,
  LogOut,
  Users,
  X
} from 'lucide-react'
import { logout } from '@/app/login/actions'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useSidebar } from '@/components/providers'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/productos', label: 'Productos', icon: Package },
  { href: '/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { href: '/categorias', label: 'Categorías', icon: Tag },
]

const NAV_BOTTOM = [
  { href: '/estadisticas', label: 'Estadísticas', icon: BarChart3 },
  { href: '/ajustes', label: 'Ajustes', icon: Settings },
]

import { getCurrentRole } from '@/app/actions'

export function Sidebar() {
  const pathname = usePathname()
  const { isOpen, setIsOpen } = useSidebar()
  const [role, setRole] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) setUserEmail(user.email)
    }
    fetchUser()
  }, [])

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const userRole = await getCurrentRole()
        if (userRole) setRole(userRole)
      } catch (err) {
        // Error logging removed
      }
    }
    fetchRole()
  }, [pathname])

  // Close sidebar when pathname changes (navigation)
  useEffect(() => {
    setIsOpen(false)
  }, [pathname, setIsOpen])

  if (pathname === '/login') return null

  return (
    <>
      {/* Backdrop for mobile */}
      <div 
        className={`sidebar-backdrop ${isOpen ? 'show' : ''}`} 
        onClick={() => setIsOpen(false)}
      />

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Mobile Close Button */}
        <button 
          className="btn btn-ghost btn-icon sidebar-close-btn"
          onClick={() => setIsOpen(false)}
        >
          <X size={20} />
        </button>

        {/* Logo */}
        <div className="sidebar-logo">
          <div className="brand">
            <div className="brand-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--accent)' }}>
                <path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"/>
                <path d="M21 8H3l2 13h14l2-13Z"/>
                <path d="M10 12h4"/>
              </svg>
            </div>
            <span>Stock Admin</span>
          </div>
          <p className="subtitle">La Soda Stock</p>
        </div>

        {/* Main nav */}
        <nav className="sidebar-nav">
          <span className="nav-section-label">Principal</span>

          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`nav-link ${active ? 'active' : ''}`}
              >
                <Icon className="nav-icon" />
                {label}
              </Link>
            )
          })}

          <div className="divider" style={{ margin: '10px 4px' }} />
          <span className="nav-section-label">Análisis</span>

          {NAV_BOTTOM.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`nav-link ${active ? 'active' : ''}`}
              >
                <Icon className="nav-icon" />
                {label}
              </Link>
            )
          })}

          {role === 'superuser' && (
            <>
              <div className="divider" style={{ margin: '10px 4px' }} />
              <span className="nav-section-label">Administración</span>
              <Link
                href="/usuarios"
                className={`nav-link ${pathname.startsWith('/usuarios') ? 'active' : ''}`}
              >
                <Users className="nav-icon" />
                Gestión de Usuarios
              </Link>
            </>
          )}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
              {userEmail || 'Cargando...'}
            </span>
            <br />
            <span style={{ 
              fontSize: '0.65rem', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em',
              color: role === 'superuser' ? 'var(--status-warn)' : 'var(--text-tertiary)'
            }}>
              {role || 'usuario'}
            </span>
          </div>

          <button 
            onClick={() => logout()}
            className="nav-link" 
            style={{ 
              background: 'none', 
              border: 'none', 
              width: '100%', 
              cursor: 'pointer',
              padding: '8px 12px'
            }}
          >
            <LogOut className="nav-icon" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <style jsx>{`
        .sidebar-backdrop {
          display: none;
        }
        @media (max-width: 768px) {
          .sidebar-backdrop {
            display: block;
          }
        }
      `}</style>
    </>
  )
}
