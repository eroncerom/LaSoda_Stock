'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCategories, createProduct, uploadProductImage } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, Camera, X, Package, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

import { Topbar } from '@/components/layout/topbar'

export default function NuevoProductoPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    nombre: '',
    description: '',
    price: '',
    stock: '',
    category_id: '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })

  // Set default category if none selected and categories loaded
  useEffect(() => {
    if (categories.length > 0 && !form.category_id) {
      setForm(prev => ({ ...prev, category_id: categories[0].id }))
    }
  }, [categories, form.category_id])

  const mutation = useMutation({
    mutationFn: async () => {
      setError(null)
      if (!imageFile) throw new Error('La imagen es obligatoria')
      if (!form.nombre.trim()) throw new Error('El nombre es obligatorio')
      if (!form.price || isNaN(Number(form.price))) throw new Error('El precio debe ser un número válido')
      if (!form.stock || isNaN(Number(form.stock))) throw new Error('El stock debe ser un número válido')

      setIsUploading(true)
      let imageData: { storage_path: string; public_url: string } | null = null

      try {
        if (imageFile) {
          const category = categories.find((c) => c.id === form.category_id)
          const slug = category?.slug ?? 'sin-categoria'
          
          // USAR EL NOMBRE ORIGINAL DEL ARCHIVO SIN ALTERACIONES
          const fileName = imageFile.name
          
          const result = await uploadProductImage(imageFile, slug, fileName)
          imageData = { storage_path: result.path, public_url: result.publicUrl }
          
          // Esperar un breve instante para que el trigger de Supabase termine su trabajo
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        return await createProduct({
          nombre: form.nombre.trim(),
          description: form.description.trim() || null,
          price: Number(form.price),
          stock: Number(form.stock),
          category_id: form.category_id || null,
          storage_path: imageData?.storage_path || null,
          public_url: imageData?.public_url || null,
        })
      } finally {
        setIsUploading(false)
      }
    },
    onSuccess: () => {
      setSuccess(true)
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      
      // Delay redirect to show success state
      setTimeout(() => {
        router.push('/productos')
      }, 1500)
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  function handleImageChange(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen es demasiado grande (máx 5MB)')
      return
    }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
    setError(null)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) handleImageChange(file)
  }

  const triggerCamera = () => {
    if (fileRef.current) {
      fileRef.current.setAttribute('capture', 'environment')
      fileRef.current.click()
    }
  }

  const triggerUpload = () => {
    if (fileRef.current) {
      fileRef.current.removeAttribute('capture')
      fileRef.current.click()
    }
  }

  if (success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 20 }}>
        <div style={{ background: 'var(--accent-dim)', color: 'var(--accent)', padding: 24, borderRadius: '50%' }}>
          <CheckCircle2 size={64} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>¡Producto creado!</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Redirigiendo al catálogo...</p>
      </div>
    )
  }

  return (
    <>
      <Topbar 
        title="Nuevo producto" 
        subtitle="Añadir al catálogo de La Soda"
      >
        <Link href="/productos" className="btn btn-ghost btn-sm btn-icon" style={{ width: 40, height: 40 }}>
          <ArrowLeft size={20} />
        </Link>
      </Topbar>

      <div className="page-body" style={{ maxWidth: 720 }}>
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
            animation: 'slideUp 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} />
              {error}
            </div>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
              <X size={14} />
            </button>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <Package size={16} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>Información del producto</span>
          </div>
          <div className="card-body">
            <div className="form-grid">
              {/* Image upload */}
              <div className="full">
                <label className="input-label">Imagen del producto <span style={{ color: 'var(--status-danger)' }}>*</span></label>
                
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div
                    className="upload-zone"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    style={{
                      flex: 1,
                      position: 'relative',
                      border: !imageFile ? '2px dashed var(--border-strong)' : '2px solid var(--accent-border)',
                      minHeight: 140,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: imagePreview ? 'var(--bg-base)' : 'var(--bg-elevated)'
                    }}
                  >
                    {imagePreview ? (
                      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagePreview}
                          alt="Preview"
                          style={{ maxHeight: 200, maxWidth: '100%', objectFit: 'contain', borderRadius: 8 }}
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null) }}
                          className="btn btn-danger btn-sm btn-icon"
                          style={{ position: 'absolute', top: 8, right: 8, borderRadius: '50%', padding: 6 }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div 
                        onClick={triggerUpload}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--text-tertiary)', width: '100%', height: '100%', cursor: 'pointer' }}
                      >
                        <Upload size={32} style={{ opacity: 0.5 }} />
                        <span style={{ fontSize: '0.85rem' }}>Arrastra una imagen o haz clic para subir</span>
                        <span style={{ fontSize: '0.75rem' }}>JPG, PNG, WebP · máx. 5MB</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button 
                      type="button" 
                      onClick={triggerCamera} 
                      className="btn btn-ghost"
                      style={{ padding: '12px', minWidth: 120, justifyContent: 'center' }}
                    >
                      <Camera size={18} />
                      Cámara
                    </button>
                    <button 
                      type="button" 
                      onClick={triggerUpload} 
                      className="btn btn-ghost"
                      style={{ padding: '12px', minWidth: 120, justifyContent: 'center' }}
                    >
                      <Upload size={18} />
                      Galería
                    </button>
                  </div>
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageChange(file)
                  }}
                />
              </div>

              {/* Nombre */}
              <div className="full">
                <label className="input-label" htmlFor="nombre">Nombre del producto *</label>
                <input
                  id="nombre"
                  className="input"
                  placeholder="Ej: Varita Estrella Dorada"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>

              {/* Description */}
              <div className="full">
                <label className="input-label" htmlFor="description">Descripción y detalles</label>
                <textarea
                  id="description"
                  className="input"
                  placeholder="Detalles sobre materiales, medidas, etc..."
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ resize: 'vertical', minHeight: 100 }}
                />
              </div>

              {/* Price */}
              <div>
                <label className="input-label" htmlFor="price">Precio (€) *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="price"
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    style={{ paddingRight: 30 }}
                  />
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>€</span>
                </div>
              </div>

              {/* Stock */}
              <div>
                <label className="input-label" htmlFor="stock">Stock inicial *</label>
                <input
                  id="stock"
                  className="input"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </div>

              {/* Category */}
              <div className="full">
                <label className="input-label" htmlFor="category">Categoría</label>
                <select
                  id="category"
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
            </div>
          </div>
          <div className="modal-footer" style={{ background: 'var(--bg-elevated)', padding: '20px 24px' }}>
            <Link href="/productos" className="btn btn-ghost" style={{ minWidth: 100, justifyContent: 'center' }}>
              Cancelar
            </Link>
            <button
              className="btn btn-primary"
              disabled={mutation.isPending || isUploading}
              onClick={() => mutation.mutate()}
              style={{ minWidth: 140, justifyContent: 'center' }}
            >
              {mutation.isPending || isUploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {isUploading ? 'Subiendo...' : 'Guardando...'}
                </>
              ) : (
                'Crear producto'
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
