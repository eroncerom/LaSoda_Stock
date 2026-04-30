import { fetchProducts } from '@/lib/api'
import { getDashboardStatsServer, getOrdersServer } from '@/app/actions'
import { formatCurrency, formatDate, ORDER_STATUS_CONFIG } from '@/lib/utils'
import { Package, ShoppingBag, TrendingUp, AlertTriangle, Boxes, Euro } from 'lucide-react'
import { Topbar } from '@/components/layout/topbar'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // Fetch data directly on the server
  const [stats, products, orders] = await Promise.all([
    getDashboardStatsServer(),
    fetchProducts(),
    getOrdersServer()
  ])

  const lowStockProducts = products
    .filter((p) => p.stock <= 3)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 6)

  const recentOrders = orders.slice(0, 6)

  return (
    <>
      <Topbar 
        title="Dashboard" 
        subtitle="Resumen general del inventario"
      >
        <Link href="/productos/nuevo" className="btn btn-primary btn-sm">
          <Package size={14} />
          Nuevo producto
        </Link>
      </Topbar>

      <div className="page-body">
        {/* KPI Stats */}
        <div className="stats-grid">
          <StatCard
            icon={<Package size={18} />}
            iconBg="rgba(200,184,154,0.15)"
            iconColor="var(--accent)"
            value={String(stats?.totalProducts ?? 0)}
            label="Productos activos"
          />
          <StatCard
            icon={<Boxes size={18} />}
            iconBg="rgba(106,177,135,0.15)"
            iconColor="#6ab187"
            value={String(stats?.totalStock ?? 0)}
            label="Unidades en stock"
          />
          <StatCard
            icon={<Euro size={18} />}
            iconBg="rgba(107,142,194,0.15)"
            iconColor="#6b8ec2"
            value={formatCurrency(stats?.inventoryValue ?? 0)}
            label="Valor del inventario"
          />
          <StatCard
            icon={<ShoppingBag size={18} />}
            iconBg="rgba(212,164,76,0.15)"
            iconColor="#d4a44c"
            value={String(stats?.pendingOrders ?? 0)}
            label="Pedidos pendientes"
            alert={(stats?.pendingOrders ?? 0) > 0}
          />
          <StatCard
            icon={<TrendingUp size={18} />}
            iconBg="rgba(167,107,194,0.15)"
            iconColor="#a76bc2"
            value={formatCurrency(stats?.totalRevenue ?? 0)}
            label="Ingresos totales"
          />
        </div>

        {/* Two column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Low stock alert */}
          <div className="card">
            <div className="card-header">
              <AlertTriangle size={16} style={{ color: 'var(--status-warn)' }} />
              <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>Stock bajo</span>
              <span style={{
                marginLeft: 'auto',
                fontSize: '0.75rem',
                color: 'var(--text-tertiary)',
              }}>
                ≤ 3 unidades
              </span>
            </div>
            {lowStockProducts.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 20px' }}>
                <Package size={28} />
                <span style={{ fontSize: '0.83rem' }}>Todo el stock está bien</span>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th style={{ textAlign: 'right' }}>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link
                          href={`/productos/${p.id}`}
                          style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 450 }}
                        >
                          {p.nombre}
                        </Link>
                      </td>
                      <td style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                        {p.categories?.name ?? '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`badge ${p.stock === 0 ? 'badge-stock-empty' : 'badge-stock-low'}`}>
                          {p.stock === 0 ? 'Sin stock' : `${p.stock} ud.`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Recent orders */}
          <div className="card">
            <div className="card-header">
              <ShoppingBag size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>Pedidos recientes</span>
              <Link
                href="/pedidos"
                style={{
                  marginLeft: 'auto',
                  fontSize: '0.75rem',
                  color: 'var(--accent)',
                  textDecoration: 'none',
                }}
              >
                Ver todos →
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 20px' }}>
                <ShoppingBag size={28} />
                <span style={{ fontSize: '0.83rem' }}>No hay pedidos aún</span>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Contacto</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => {
                    const cfg = ORDER_STATUS_CONFIG[o.status] ?? ORDER_STATUS_CONFIG.pending
                    return (
                      <tr key={o.id}>
                        <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {o.customer_contact ?? '—'}
                        </td>
                        <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                          {formatCurrency(o.total_amount)}
                        </td>
                        <td>
                          <span className={`badge status-${o.status}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.77rem', color: 'var(--text-tertiary)' }}>
                          {formatDate(o.created_at)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function StatCard({
  icon,
  iconBg,
  iconColor,
  value,
  label,
  alert = false,
}: {
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  value: string
  label: string
  alert?: boolean
}) {
  return (
    <div className="stat-card" style={alert ? { borderColor: 'rgba(212,164,76,0.3)' } : {}}>
      <div className="stat-card-icon" style={{ background: iconBg, color: iconColor }}>
        {icon}
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  )
}
