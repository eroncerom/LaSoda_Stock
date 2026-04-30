'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchOrders, updateOrderStatus } from '@/lib/api'
import { formatCurrency, formatDate, ORDER_STATUS_CONFIG } from '@/lib/utils'
import type { Order, OrderStatus } from '@/lib/types'
import { ShoppingBag, ChevronDown, X, Package } from 'lucide-react'

import { Topbar } from '@/components/layout/topbar'

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

export default function PedidosPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })

  const filtered =
    statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter)

  const totals = {
    pending: orders.filter((o) => o.status === 'pending').length,
    confirmed: orders.filter((o) => o.status === 'confirmed').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  }

  return (
    <>
      <Topbar 
        title="Pedidos" 
        subtitle={`${orders.length} pedidos en total`}
      />

      <div className="page-body">
        {/* Status filter pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <button
            className={`btn ${statusFilter === 'all' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            onClick={() => setStatusFilter('all')}
          >
            Todos <span style={{ opacity: 0.7, marginLeft: 3 }}>({orders.length})</span>
          </button>
          {STATUS_OPTIONS.map((s) => {
            const cfg = ORDER_STATUS_CONFIG[s]
            const count = totals[s]
            return (
              <button
                key={s}
                className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setStatusFilter(s)}
              >
                {cfg.label}
                {count > 0 && <span style={{ opacity: 0.7, marginLeft: 3 }}>({count})</span>}
              </button>
            )
          })}
        </div>

        {/* Table */}
        <div className="card">
          {isLoading ? (
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 48, borderRadius: 8 }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <ShoppingBag size={40} />
              <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>Sin pedidos</p>
              <p style={{ fontSize: '0.82rem' }}>No hay pedidos en este estado</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Contacto</th>
                    <th>Productos</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => {
                    const cfg = ORDER_STATUS_CONFIG[o.status]
                    const itemCount = Array.isArray(o.items)
                      ? o.items.reduce((sum, item) => sum + item.quantity, 0)
                      : 0
                    return (
                      <tr key={o.id}>
                        <td>
                          <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                            {o.id.slice(0, 8)}…
                          </span>
                        </td>
                        <td>
                          <span style={{
                            maxWidth: 160,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'block',
                            color: 'var(--text-primary)',
                            fontWeight: 450,
                          }}>
                            {o.customer_contact ?? '—'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setSelectedOrder(o)}
                            style={{ fontSize: '0.8rem' }}
                          >
                            {itemCount} {itemCount === 1 ? 'artículo' : 'artículos'}
                          </button>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {formatCurrency(o.total_amount)}
                        </td>
                        <td>
                          <StatusSelect
                            orderId={o.id}
                            currentStatus={o.status}
                            onUpdate={(status) => statusMutation.mutate({ id: o.id, status })}
                            isPending={statusMutation.isPending}
                          />
                        </td>
                        <td style={{ fontSize: '0.77rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                          {formatDate(o.created_at)}
                        </td>
                        <td>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setSelectedOrder(o)}
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <ShoppingBag size={16} style={{ color: 'var(--accent)' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 500 }}>Detalle del pedido</h3>
              <button
                className="btn btn-ghost btn-sm btn-icon"
                style={{ marginLeft: 'auto' }}
                onClick={() => setSelectedOrder(null)}
              >
                <X size={14} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Meta */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
                background: 'var(--bg-elevated)',
                borderRadius: 10,
                padding: 16,
                border: '1px solid var(--border-subtle)',
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 3 }}>Contacto</div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{selectedOrder.customer_contact ?? '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 3 }}>Fecha</div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{formatDate(selectedOrder.created_at)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 3 }}>Estado</div>
                  <span className={`badge status-${selectedOrder.status}`}>
                    {ORDER_STATUS_CONFIG[selectedOrder.status]?.label}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 3 }}>Total</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(selectedOrder.total_amount)}</div>
                </div>
              </div>

              {/* Items */}
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 500, marginBottom: 10, color: 'var(--text-secondary)' }}>Artículos del pedido</div>
                {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedOrder.items.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          background: 'var(--bg-elevated)',
                          borderRadius: 8,
                          padding: '10px 14px',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div style={{
                          width: 32, height: 32,
                          borderRadius: 6,
                          background: 'var(--bg-overlay)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Package size={14} style={{ color: 'var(--text-tertiary)' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 450 }}>{item.name}</div>
                          <div style={{ fontSize: '0.77rem', color: 'var(--text-tertiary)' }}>
                            {formatCurrency(item.price)} × {item.quantity}
                          </div>
                        </div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-tertiary)', fontSize: '0.83rem' }}>Sin artículos</div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedOrder(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function StatusSelect({
  orderId,
  currentStatus,
  onUpdate,
  isPending,
}: {
  orderId: string
  currentStatus: OrderStatus
  onUpdate: (s: OrderStatus) => void
  isPending: boolean
}) {
  const cfg = ORDER_STATUS_CONFIG[currentStatus]
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <select
        className={`badge status-${currentStatus}`}
        style={{
          appearance: 'none',
          cursor: 'pointer',
          paddingRight: 20,
          border: '1px solid transparent',
          background: 'none',
          font: 'inherit',
          fontSize: '0.72rem',
          fontWeight: 500,
        }}
        value={currentStatus}
        disabled={isPending}
        onChange={(e) => onUpdate(e.target.value as OrderStatus)}
        onClick={(e) => e.stopPropagation()}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s} style={{ background: '#18181f', color: '#f0ede8' }}>
            {ORDER_STATUS_CONFIG[s].label}
          </option>
        ))}
      </select>
      <ChevronDown size={10} style={{ position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.6 }} />
    </div>
  )
}
