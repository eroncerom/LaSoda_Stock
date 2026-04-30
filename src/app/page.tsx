import { fetchProducts } from '@/lib/api'
import { getDashboardStatsServer, getOrdersServer } from '@/app/actions'
import { formatCurrency, formatDate, ORDER_STATUS_CONFIG } from '@/lib/utils'
import { Package, ShoppingBag, TrendingUp, AlertTriangle, Boxes, Euro } from 'lucide-react'
import { Topbar } from '@/components/layout/topbar'
import Link from 'next/link'

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
        </div>

        {/* Dashboard Action Center */}
        <div className="dashboard-grid">
          {/* Low stock alerts */}
          <div className="section">
            <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <AlertTriangle size={16} style={{ color: 'var(--status-warn)' }} />
              <h2 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Necesita Reposición</h2>
            </div>
            
            {lowStockProducts.length === 0 ? (
              <div className="card empty-state" style={{ padding: 40 }}>
                <Package size={32} style={{ opacity: 0.3 }} />
                <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Todo el stock está al día</p>
              </div>
            ) : (
              <div className="action-list">
                {lowStockProducts.map((p) => (
                  <Link key={p.id} href={`/productos/${p.id}`} className="action-item">
                    <div className="action-item-content">
                      <span className="action-item-title">{p.nombre}</span>
                      <span className="action-item-subtitle">{p.categories?.name ?? 'Sin categoría'}</span>
                    </div>
                    <div className="action-item-side">
                      <span className={`badge ${p.stock === 0 ? 'badge-stock-empty' : 'badge-stock-low'}`}>
                        {p.stock === 0 ? 'Agotado' : `${p.stock} ud.`}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent orders */}
          <div className="section">
            <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <ShoppingBag size={16} style={{ color: 'var(--accent)' }} />
              <h2 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Actividad de Pedidos</h2>
              <Link href="/pedidos" style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'none' }}>
                Ver todos →
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="card empty-state" style={{ padding: 40 }}>
                <ShoppingBag size={32} style={{ opacity: 0.3 }} />
                <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>No hay pedidos recientes</p>
              </div>
            ) : (
              <div className="action-list">
                {recentOrders.map((o) => {
                  const cfg = ORDER_STATUS_CONFIG[o.status] ?? ORDER_STATUS_CONFIG.pending
                  return (
                    <Link key={o.id} href={`/pedidos/${o.id}`} className="action-item">
                      <div className="action-item-content">
                        <span className="action-item-title">{o.customer_contact || 'Pedido sin nombre'}</span>
                        <span className="action-item-subtitle">{formatDate(o.created_at)}</span>
                      </div>
                      <div className="action-item-side">
                        <span className="action-item-value">{formatCurrency(o.total_amount)}</span>
                        <span className={`badge status-${o.status}`} style={{ fontSize: '0.7rem' }}>
                          {cfg.label}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
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
