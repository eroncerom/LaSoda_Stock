'use client'

import { use, useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchProductById, fetchCategories, updateProduct, uploadProductImage } from '@/lib/api'
import { formatCurrency, formatDate, getImageUrl } from '@/lib/utils'
import { ArrowLeft, Save, Upload, X, Package, Tag, Boxes, Euro, Calendar } from 'lucide-react'
import Link from 'next/link'

import { Topbar } from '@/components/layout/topbar'

export default function ProductoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProductById(id),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })

  const [form, setForm] = useState<{
    nombre: string
    description: string
    price: string
    stock: string
    category_id: string
  } | null>(null)

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form when product loads
  if (product && !form) {
    setForm({
      nombre: product.nombre,
      description: product.description ?? '',
      price: String(product.price),
      stock: String(product.stock),
      category_id: product.category_id ?? '',
    })
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form) return
      if (!form.nombre.trim()) throw new Error('El nombre es obligatorio')

      let storage_path = product?.storage_path ?? null
      let public_url = product?.public_url ?? null

      if (imageFile) {
        const category = categories.find((c) => c.id === form.category_id)
        const slug = category?.slug ?? 'sin-categoria'
        
        // Usar el nombre original del archivo
        const fileName = imageFile.name
        
        const result = await uploadProductImage(imageFile, slug, fileName)
        storage_path = result.path
        public_url = result.publicUrl
        
        // Esperar un breve instante para que el trigger de Supabase termine su trabajo
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      return updateProduct(id, {
        nombre: form.nombre.trim(),
        description: form.description.trim() || null,
        price: Number(form.price),
        stock: Number(form.stock),
        category_id: form.category_id || null,
        storage_path,
        public_url,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product', id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      setError(null)
    },
    onError: (err: Error) => setError(err.message),
  })

  function handleImageChange(file: File) {
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  if (isLoading) {
    return (
      <>
        <Topbar title="Cargando..." />
        <div className="page-body">
          <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
        </div>
      </>
    )
  }

  if (!product || !form) {
    return (
      <>
        <Topbar title="Producto no encontrado" />
        <div className="page-body">
          <Link href="/productos" className="btn btn-ghost">← Volver</Link>
        </div>
      </>
    )
  }

  const currentImageUrl = imagePreview ?? getImageUrl(product.storage_path, product.public_url)

  return (
    <>
      <Topbar 
        title={product.nombre} 
        subtitle="Editar producto"
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/productos" className="btn btn-ghost btn-sm btn-icon">
            <ArrowLeft size={16} />
          </Link>
          {saved && (
            <span style={{ fontSize: '0.82rem', color: 'var(--status-ok)', animation: 'fadeIn 0.2s ease' }}>
              ✓ Guardado
            </span>
          )}
          <button
            className="btn btn-primary btn-sm"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            <Save size={14} />
            {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </Topbar>

      <div className="page-body">
        {error && (
          <div style={{
            background: 'rgba(194,107,107,0.15)',
            border: '1px solid rgba(194,107,107,0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            color: '#c26b6b',
            fontSize: '0.85rem',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            {error}
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
              <X size={14} />
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
          {/* Left: image + meta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Image */}
            <div className="card">
              <div className="card-header" style={{ paddingBottom: 14 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>Imagen</span>
              </div>
              <div className="card-body" style={{ paddingTop: 12 }}>
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1/1',
                    borderRadius: 10,
                    overflow: 'hidden',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {currentImageUrl !== '/placeholder-product.png' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentImageUrl}
                      alt={product.nombre}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Package size={48} style={{ color: 'var(--text-tertiary)', opacity: 0.4 }} />
                  )}
                </div>
                <button
                  className="btn btn-ghost"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload size={14} />
                  Cambiar imagen
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageChange(file)
                  }}
                />
              </div>
            </div>

            {/* Meta info */}
            <div className="card">
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <MetaRow icon={<Tag size={14} />} label="Categoría" value={product.categories?.name ?? '—'} />
                <MetaRow icon={<Euro size={14} />} label="Precio" value={formatCurrency(product.price)} />
                <MetaRow icon={<Boxes size={14} />} label="Stock" value={`${product.stock} unidades`} />
                <MetaRow
                  icon={<Calendar size={14} />}
                  label="Creado"
                  value={formatDate(product.created_at)}
                />
              </div>
            </div>
          </div>

          {/* Right: edit form */}
          <div className="card">
            <div className="card-header">
              <Package size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>Editar información</span>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="full">
                  <label className="input-label" htmlFor="edit-nombre">Nombre *</label>
                  <input
                    id="edit-nombre"
                    className="input"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  />
                </div>

                <div className="full">
                  <label className="input-label" htmlFor="edit-desc">Descripción</label>
                  <textarea
                    id="edit-desc"
                    className="input"
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    style={{ resize: 'vertical', minHeight: 90 }}
                  />
                </div>

                <div>
                  <label className="input-label" htmlFor="edit-price">Precio (€) *</label>
                  <input
                    id="edit-price"
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>

                <div>
                  <label className="input-label" htmlFor="edit-stock">Stock (unidades) *</label>
                  <input
                    id="edit-stock"
                    className="input"
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>

                <div className="full">
                  <label className="input-label" htmlFor="edit-category">Categoría</label>
                  <select
                    id="edit-category"
                    className="input"
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  >
                    <option value="">Sin categoría</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Stock quick actions */}
                <div className="full">
                  <label className="input-label">Ajuste rápido de stock</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[-5, -1, +1, +5, +10].map((delta) => (
                      <button
                        key={delta}
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          const current = Number(form.stock)
                          const next = Math.max(0, current + delta)
                          setForm({ ...form, stock: String(next) })
                        }}
                      >
                        {delta > 0 ? `+${delta}` : delta}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div style={{ color: 'var(--text-tertiary)', marginTop: 2, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 450 }}>{value}</div>
      </div>
    </div>
  )
}
