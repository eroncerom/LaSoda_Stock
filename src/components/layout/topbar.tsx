'use client'

import { Menu } from 'lucide-react'
import { useSidebar } from '@/components/providers'
import React from 'react'

interface TopbarProps {
  title: string
  subtitle?: string
  children?: React.ReactNode
}

export function Topbar({ title, subtitle, children }: TopbarProps) {
  const { toggle } = useSidebar()

  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button 
          className="btn btn-ghost btn-icon menu-toggle-btn" 
          onClick={toggle}
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>
        
        <div>
          <div className="topbar-title">{title}</div>
          {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {children}
      </div>

      <style jsx>{`
        .menu-toggle-btn {
          display: none;
        }
        @media (max-width: 768px) {
          .menu-toggle-btn {
            display: flex;
          }
        }
      `}</style>
    </div>
  )
}
