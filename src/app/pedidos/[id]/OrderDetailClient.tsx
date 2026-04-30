'use client'

import { useState } from 'react'
import { Order, OrderStatus } from '@/lib/types'
import { Topbar } from '@/components/layout/topbar'
import { updateOrderStatusAction } from '@/app/actions'
import { formatCurrency, formatDate, ORDER_STATUS_CONFIG } from '@/lib/utils'
import { ArrowLeft, CheckCircle2, Clock, Truck, Package, XCircle, ChevronRight, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function OrderDetailClient({ order }: { order: Order }) {
  const router = useRouter()
  const [status, setStatus] = useState<OrderStatus>(order.status)
  const [updating, setUpdating] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStatusChange(newStatus: OrderStatus) {
    if (newStatus === status) return // No change needed
    
    setUpdating(true)
    setError(null)
    
    try {
      const result = await updateOrderStatusAction(order.id, newStatus)
      if (result.success) {
        setStatus(newStatus)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 2000)
        router.refresh()
      } else {
        setError(result.error || 'Error al actualizar el estado')
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión')
    } finally {
      setUpdating(false)
    }
  }

  const statusOptions: { value: OrderStatus; label: string; icon: any; color: string }[] = [
    { value: 'pending', label: 'Pendiente', icon: Clock, color: 'var(--status-warn)' },
    { value: 'confirmed', label: 'Confirmado', icon: CheckCircle2, color: 'var(--status-info)' },
    { value: 'shipped', label: 'Enviado', icon: Truck, color: 'var(--status-info)' },
    { value: 'delivered', label: 'Entregado', icon: Package, color: 'var(--status-ok)' },
    { value: 'cancelled', label: 'Cancelado', icon: XCircle, color: 'var(--status-danger)' },
  ]

  return (
    <>
      <Topbar 
        title={`Pedido #${order.id.slice(0, 8)}`} 
        subtitle="Gestión de pedido"
      >
        <Link href="/pedidos" className="btn btn-ghost btn-sm btn-icon">
          <ArrowLeft size={16} />
        </Link>
      </Topbar>

      <div className="page-body">
        <div className="dashboard-grid">
          {/* Order Info */}
          <div className="section">
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <User size={16} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Información del Cliente</span>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {order.customer_contact || 'Sin contacto'}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                  Realizado el {formatDate(order.created_at)}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <Package size={16} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Artículos</span>
              </div>
              <div className="action-list">
                {order.items.map((item, idx) => (
                  <div key={idx} className="action-item" style={{ cursor: 'default' }}>
                    <div className="action-item-content">
                      <span className="action-item-title">{item.name}</span>
                      <span className="action-item-subtitle">{item.quantity} x {formatCurrency(item.price)}</span>
                    </div>
                    <div className="action-item-side">
                      <span className="action-item-value">{formatCurrency(item.quantity * item.price)}</span>
                    </div>
                  </div>
                ))}
                <div className="action-item" style={{ background: 'var(--bg-base)', borderTop: '2px solid var(--border-default)' }}>
                  <span style={{ fontWeight: 600 }}>Total</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)' }}>
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Management */}
          <div className="section">
            <div className="card">
              <div className="card-header">
                <Clock size={16} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Estado del Pedido</span>
                {success && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--status-ok)' }}>✓ Actualizado</span>}
                {error && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--status-danger)' }}>{error}</span>}
              </div>
              <div style={{ padding: 8 }}>
                <div className="action-list">
                  {statusOptions.map((opt) => {
                    const Icon = opt.icon
                    const isSelected = status === opt.value
                    return (
                      <button
                        key={opt.value}
                        disabled={updating}
                        onClick={() => handleStatusChange(opt.value)}
                        className="action-item"
                        style={{ 
                          border: 'none', 
                          width: '100%', 
                          textAlign: 'left',
                          background: isSelected ? 'rgba(200, 184, 154, 0.1)' : 'transparent',
                          opacity: updating ? 0.6 : 1
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ 
                            padding: 8, 
                            borderRadius: '50%', 
                            background: isSelected ? opt.color : 'var(--bg-base)',
                            color: isSelected ? 'white' : 'var(--text-tertiary)'
                          }}>
                            <Icon size={18} />
                          </div>
                          <span style={{ 
                            fontWeight: isSelected ? 600 : 400,
                            color: isSelected ? 'var(--text-primary)' : 'var(--text-tertiary)'
                          }}>
                            {opt.label}
                          </span>
                        </div>
                        {isSelected && <ChevronRight size={16} style={{ color: 'var(--accent)' }} />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .section { display: flex; flex-direction: column; gap: 16px; }
      `}</style>
    </>
  )
}
