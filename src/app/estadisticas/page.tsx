'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchProducts, fetchCategories, fetchOrders } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Package, 
  DollarSign, 
  Boxes,
  PieChart,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Calendar
} from 'lucide-react'
import { Topbar } from '@/components/layout/topbar'

export default function EstadisticasPage() {
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  })

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
  })

  const isLoading = loadingProducts || loadingCategories || loadingOrders

  // --- LOGIC / CALCULATIONS ---
  
  // Product Stats
  const totalStockValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0)
  const totalUnits = products.reduce((acc, p) => acc + p.stock, 0)
  const lowStockThreshold = 5
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= lowStockThreshold).length
  const outOfStockCount = products.filter(p => p.stock === 0).length

  // Category breakdown
  const categoryData = categories.map(cat => {
    const catProducts = products.filter(p => p.category_id === cat.id)
    const value = catProducts.reduce((acc, p) => acc + (p.price * p.stock), 0)
    const units = catProducts.reduce((acc, p) => acc + p.stock, 0)
    return {
      name: cat.name,
      value,
      units,
      percentage: totalStockValue > 0 ? (value / totalStockValue) * 100 : 0
    }
  }).sort((a, b) => b.value - a.value)

  // Order Evolution (Last 7 Days)
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date()
    d.setHours(0,0,0,0)
    d.setDate(d.getDate() - i)
    return d
  }).reverse()

  const orderEvolution = last7Days.map(date => {
    const dayStr = date.toISOString().split('T')[0]
    const count = orders.filter(o => o.created_at.startsWith(dayStr)).length
    return {
      label: date.toLocaleDateString('es-ES', { weekday: 'short' }),
      count
    }
  })

  const maxOrderCount = Math.max(...orderEvolution.map(d => d.count), 1)

  // Order Status Breakdown
  const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'Pendientes', color: 'var(--status-warn)', icon: Clock },
    confirmed: { label: 'Confirmados', color: 'var(--status-info)', icon: CheckCircle2 },
    shipped: { label: 'Enviados', color: '#a76bc2', icon: Truck },
    delivered: { label: 'Entregados', color: 'var(--status-ok)', icon: CheckCircle2 },
    cancelled: { label: 'Cancelados', color: 'var(--status-danger)', icon: XCircle }
  }

  const statusData = Object.entries(statusLabels).map(([key, meta]) => {
    const count = orders.filter(o => o.status === key).length
    return {
      key,
      count,
      percentage: orders.length > 0 ? (count / orders.length) * 100 : 0,
      ...meta
    }
  }).filter(d => d.count > 0 || d.key === 'pending')

  if (isLoading) {
    return (
      <>
        <Topbar title="Estadísticas" subtitle="Cargando análisis..." />
        <div className="page-body">
          <div className="stats-grid">
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />)}
          </div>
          <div className="responsive-grid" style={{ marginTop: 24 }}>
            <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
            <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Topbar 
        title="Estadísticas" 
        subtitle="Análisis de inventario y ventas"
      />

      <div className="page-body">
        {/* --- HERO STATS --- */}
        <div className="stats-grid">
          <StatCard 
            icon={<DollarSign size={20} />} 
            label="Valor Total" 
            value={formatCurrency(totalStockValue)}
            subValue="Capital en stock"
            color="var(--accent)"
          />
          <StatCard 
            icon={<ShoppingBag size={20} />} 
            label="Total Pedidos" 
            value={orders.length.toLocaleString()}
            subValue="Histórico acumulado"
            color="var(--status-info)"
          />
          <StatCard 
            icon={<AlertTriangle size={20} />} 
            label="Alertas Stock" 
            value={(lowStockCount + outOfStockCount).toString()}
            subValue={`${outOfStockCount} agotados`}
            color={lowStockCount + outOfStockCount > 0 ? "var(--status-danger)" : "var(--status-ok)"}
          />
        </div>

        <div className="responsive-grid" style={{ marginTop: 24 }}>
          
          {/* --- ORDER EVOLUTION --- */}
          <div className="card">
            <div className="card-header">
              <Calendar size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Evolución de Pedidos (7 días)</span>
            </div>
            <div className="card-body" style={{ height: 280, display: 'flex', alignItems: 'flex-end', gap: 12, padding: '40px 24px 20px' }}>
              {orderEvolution.map((day, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <div 
                      style={{ 
                        width: '100%', 
                        maxWidth: 32,
                        height: `${(day.count / maxOrderCount) * 180}px`,
                        minHeight: day.count > 0 ? 4 : 0,
                        background: i === orderEvolution.length - 1 ? 'var(--accent)' : 'var(--bg-overlay)',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 1s ease-out',
                        position: 'relative'
                      }}
                    >
                      {day.count > 0 && (
                        <span style={{ 
                          position: 'absolute', top: -20, left: '50%', 
                          transform: 'translateX(-50%)', fontSize: '0.7rem', 
                          fontWeight: 600, color: 'var(--text-secondary)' 
                        }}>
                          {day.count}
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* --- ORDER STATUS (DONUT/PIE) --- */}
          <div className="card">
            <div className="card-header">
              <PieChart size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Estado de Pedidos</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {statusData.map((status, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: status.color }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{status.label}</span>
                      </div>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{status.count}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          width: `${status.percentage}%`, 
                          background: status.color,
                          borderRadius: 3,
                          transition: 'width 1s ease-out'
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-elevated)', borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Tasa de Conversión
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--status-ok)', marginTop: 4 }}>
                  {orders.length > 0 ? ((orders.filter(o => o.status === 'delivered').length / orders.length) * 100).toFixed(1) : 0}%
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                  Pedidos entregados con éxito
                </div>
              </div>
            </div>
          </div>

          {/* --- CATEGORY BREAKDOWN --- */}
          <div className="card">
            <div className="card-header">
              <Package size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Inversión por Categoría</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {categoryData.slice(0, 5).map((cat, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{cat.name}</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatCurrency(cat.value)}</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          width: `${cat.percentage}%`, 
                          background: `hsl(${200 + (i * 40)}, 40%, 60%)`,
                          borderRadius: 4,
                          transition: 'width 1s ease-out'
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* --- TOP PRODUCTS --- */}
          <div className="card">
            <div className="card-header">
              <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Top Productos (Valor)</span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {products.sort((a, b) => (b.price * b.stock) - (a.price * a.stock)).slice(0, 4).map((p, i) => (
                <div key={p.id} style={{ 
                  padding: '16px 20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12,
                  borderBottom: i === 3 ? 'none' : '1px solid var(--border-subtle)'
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.nombre}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                      {p.stock} uds · {formatCurrency(p.price)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {formatCurrency(p.price * p.stock)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

function StatCard({ icon, label, value, subValue, color }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  subValue: string;
  color: string;
}) {
  return (
    <div className="card" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
      <div style={{ 
        position: 'absolute', top: -10, right: -10, 
        width: 80, height: 80, 
        background: color, opacity: 0.05, 
        borderRadius: '50%' 
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ 
          width: 36, height: 36, 
          borderRadius: 10, 
          background: `${color}15`, 
          color: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {icon}
        </div>
        <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-tertiary)' }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
        {subValue}
      </div>
    </div>
  )
}
