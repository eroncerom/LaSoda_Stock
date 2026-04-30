'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchProducts, fetchCategories, deleteProduct, updateProduct } from '@/lib/api'
import { formatCurrency, getImageUrl } from '@/lib/utils'
import type { Product } from '@/lib/types'
import {
  Search,
  Plus,
  Package,
  Pencil,
  Trash2,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Image as ImageIcon,
} from 'lucide-react'
import Link from 'next/link'

type SortKey = 'nombre' | 'price' | 'stock'
type SortDir = 'asc' | 'desc'

export default function ProductosPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState<'all' | 'ok' | 'low' | 'empty'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('nombre')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setDeleteTarget(null)
    },
  })

  const filtered = useMemo(() => {
    let list = [...products]

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q)
      )
    }

    if (categoryFilter !== 'all') {
      list = list.filter((p) => p.category_id === categoryFilter)
    }

    if (stockFilter === 'empty') list = list.filter((p) => p.stock === 0)
    else if (stockFilter === 'low') list = list.filter((p) => p.stock > 0 && p.stock <= 5)
    else if (stockFilter === 'ok') list = list.filter((p) => p.stock > 5)

    list.sort((a, b) => {
      let va: string | number = a[sortKey] ?? ''
      let vb: string | number = b[sortKey] ?? ''
      if (typeof va === 'string') va = va.toLowerCase()
      if (typeof vb === 'string') vb = vb.toLowerCase()
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return list
  }, [products, search, categoryFilter, stockFilter, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronsUpDown size={12} style={{ opacity: 0.4 }} />
    return sortDir === 'asc'
      ? <ChevronUp size={12} style={{ color: 'var(--accent)' }} />
      : <ChevronDown size={12} style={{ color: 'var(--accent)' }} />
  }

  function stockBadge(stock: number) {
    if (stock === 0) return <span className="badge badge-stock-empty">Sin stock</span>
    if (stock <= 5) return <span className="badge badge-stock-low">{stock} ud.</span>
    return <span className="badge badge-stock-ok">{stock} ud.</span>
  }

  const totalValue = filtered.reduce((sum, p) => sum + p.stock * p.price, 0)

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Productos</div>
          <div className="topbar-subtitle">
            {filtered.length} productos · Valor: {formatCurrency(totalValue)}
          </div>
        </div>
        <Link href="/productos/nuevo" className="btn btn-primary btn-sm">
          <Plus size={14} />
          Nuevo producto
        </Link>
      </div>

      <div className="page-body">
        {/* Filters toolbar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div className="search-wrap">
            <Search className="search-icon" />
            <input
              className="input"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="product-search"
            />
          </div>

          {/* Category filter */}
          <select
            className="input"
            style={{ width: 'auto', minWidth: 160 }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            id="category-filter"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Stock filter */}
          <select
            className="input"
            style={{ width: 'auto', minWidth: 140 }}
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
            id="stock-filter"
          >
            <option value="all">Todo el stock</option>
            <option value="ok">Stock OK (&gt;5)</option>
            <option value="low">Stock bajo (1–5)</option>
            <option value="empty">Sin stock</option>
          </select>
        </div>

        {/* Table */}
        <div className="card">
          {isLoading ? (
            <SkeletonTable />
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <Package size={40} />
              <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>No hay productos</p>
              <p style={{ fontSize: '0.82rem' }}>Prueba a cambiar los filtros</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 52 }}></th>
                    <th>
                      <button
                        onClick={() => toggleSort('nombre')}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', font: 'inherit', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}
                      >
                        Nombre <SortIcon col="nombre" />
                      </button>
                    </th>
                    <th>Categoría</th>
                    <th>
                      <button
                        onClick={() => toggleSort('price')}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', font: 'inherit', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}
                      >
                        Precio <SortIcon col="price" />
                      </button>
                    </th>
                    <th>
                      <button
                        onClick={() => toggleSort('stock')}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', font: 'inherit', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}
                      >
                        Stock <SortIcon col="stock" />
                      </button>
                    </th>
                    <th>Valor stock</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td>
                        {p.public_url || p.storage_path ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getImageUrl(p.storage_path, p.public_url)}
                            alt={p.nombre}
                            className="product-thumb"
                          />
                        ) : (
                          <div className="product-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ImageIcon size={16} style={{ color: 'var(--text-tertiary)' }} />
                          </div>
                        )}
                      </td>
                      <td>
                        <Link
                          href={`/productos/${p.id}`}
                          style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 450 }}
                        >
                          {p.nombre}
                        </Link>
                        {p.description && (
                          <div style={{ fontSize: '0.77rem', color: 'var(--text-tertiary)', marginTop: 2, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>
                        {p.categories?.name ?? <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                      </td>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        {formatCurrency(p.price)}
                      </td>
                      <td>{stockBadge(p.stock)}</td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {formatCurrency(p.stock * p.price)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Link
                            href={`/productos/${p.id}`}
                            className="btn btn-ghost btn-sm btn-icon"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </Link>
                          <button
                            className="btn btn-danger btn-sm btn-icon"
                            title="Eliminar"
                            onClick={() => setDeleteTarget(p)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <Trash2 size={18} style={{ color: 'var(--status-danger)' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 500 }}>Eliminar producto</h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                ¿Seguro que quieres eliminar <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget.nombre}</strong>?
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteTarget(null)}>
                Cancelar
              </button>
              <button
                className="btn btn-danger btn-sm"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
              >
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function SkeletonTable() {
  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 48, borderRadius: 8, animationDelay: `${i * 0.08}s` }} />
      ))}
    </div>
  )
}
