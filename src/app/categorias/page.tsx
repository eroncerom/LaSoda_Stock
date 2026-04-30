'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchCategories, fetchProducts } from '@/lib/api'
import { getImageUrl } from '@/lib/utils'
import { Tag, Package, Image as ImageIcon } from 'lucide-react'

export default function CategoriasPage() {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  })

  // Count products per category
  const countByCategory = products.reduce<Record<string, number>>((acc, p) => {
    if (p.category_id) acc[p.category_id] = (acc[p.category_id] ?? 0) + 1
    return acc
  }, {})

  const stockByCategory = products.reduce<Record<string, number>>((acc, p) => {
    if (p.category_id) acc[p.category_id] = (acc[p.category_id] ?? 0) + p.stock
    return acc
  }, {})

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Categorías</div>
          <div className="topbar-subtitle">{categories.length} categorías activas</div>
        </div>
      </div>

      <div className="page-body">
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {categories.map((cat) => {
              const count = countByCategory[cat.id] ?? 0
              const stock = stockByCategory[cat.id] ?? 0
              const catProducts = products.filter((p) => p.category_id === cat.id).slice(0, 3)

              return (
                <div key={cat.id} className="card" style={{ overflow: 'hidden' }}>
                  {/* Cover image */}
                  <div style={{
                    height: 120,
                    background: 'var(--bg-elevated)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    {cat.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cat.image_url}
                        alt={cat.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <ImageIcon size={32} style={{ color: 'var(--text-tertiary)', opacity: 0.3 }} />
                      </div>
                    )}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(17,17,24,0.9) 0%, transparent 60%)',
                    }} />
                    <div style={{ position: 'absolute', bottom: 12, left: 14 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)' }}>{cat.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>/{cat.slug}</div>
                    </div>
                  </div>

                  <div className="card-body" style={{ paddingTop: 14 }}>
                    {/* Stats row */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                      <div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>{count}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Productos</div>
                      </div>
                      <div style={{ width: 1, background: 'var(--border-subtle)' }} />
                      <div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>{stock}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Unidades</div>
                      </div>
                    </div>

                    {/* Product thumbnails */}
                    {catProducts.length > 0 && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        {catProducts.map((p) => (
                          <div
                            key={p.id}
                            title={p.nombre}
                            style={{
                              width: 36, height: 36,
                              borderRadius: 6,
                              overflow: 'hidden',
                              border: '1px solid var(--border-subtle)',
                              background: 'var(--bg-elevated)',
                              flexShrink: 0,
                            }}
                          >
                            {p.public_url || p.storage_path ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={getImageUrl(p.storage_path, p.public_url)}
                                alt={p.nombre}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <Package size={14} style={{ color: 'var(--text-tertiary)' }} />
                              </div>
                            )}
                          </div>
                        ))}
                        {count > 3 && (
                          <div style={{
                            width: 36, height: 36,
                            borderRadius: 6,
                            background: 'var(--bg-overlay)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.72rem',
                            color: 'var(--text-tertiary)',
                          }}>
                            +{count - 3}
                          </div>
                        )}
                      </div>
                    )}

                    {count === 0 && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Tag size={12} />
                        Sin productos asignados
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
