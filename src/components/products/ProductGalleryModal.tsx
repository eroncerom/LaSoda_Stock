'use client'

import { useRef, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchProductGallery } from '@/lib/api'
import { getImageUrl } from '@/lib/utils'
import { X, ChevronLeft, ChevronRight, Image as ImageIcon, Loader2 } from 'lucide-react'
import type { Product } from '@/lib/types'

interface ProductGalleryModalProps {
  product: Product
  onClose: () => void
}

export default function ProductGalleryModal({ product, onClose }: ProductGalleryModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  // Extract category slug and product slug from storage path
  const pathParts = product.storage_path ? product.storage_path.split('/') : []
  const categorySlug = pathParts[0] || 'sin-categoria'
  
  // Extract product slug: if path is "coleccion-actual/Products/mi-producto/foto.jpg", 
  // then pathParts[2] is the product slug folder.
  const productsIndex = pathParts.findIndex(p => p.toLowerCase() === 'products' || p.toLowerCase() === 'productos')
  const productSlug = (productsIndex !== -1 && pathParts[productsIndex + 1]) 
    ? pathParts[productsIndex + 1] 
    : product.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  // Fetch gallery images
  const { data: gallery = [], isLoading } = useQuery({
    queryKey: ['product-gallery', product.id],
    queryFn: () => fetchProductGallery(categorySlug, productSlug),
    enabled: !!product.storage_path,
  })

  // Combine cover image with gallery images
  const coverImage = getImageUrl(product.storage_path, product.public_url)
  const allImages = [coverImage, ...gallery.map(img => img.publicUrl)]

  // Track scroll position to update active index (for mobile swipe gesture)
  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, clientWidth } = scrollRef.current
    const newIndex = Math.round(scrollLeft / clientWidth)
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < allImages.length) {
      setActiveIndex(newIndex)
    }
  }

  // Handle clicking next/prev buttons
  const navigateTo = (index: number) => {
    if (!scrollRef.current || index < 0 || index >= allImages.length) return
    const { clientWidth } = scrollRef.current
    scrollRef.current.scrollTo({
      left: index * clientWidth,
      behavior: 'smooth'
    })
    setActiveIndex(index)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') navigateTo(activeIndex + 1)
      else if (e.key === 'ArrowLeft') navigateTo(activeIndex - 1)
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeIndex, allImages.length])

  return (
    <div className="gallery-backdrop" onClick={onClose}>
      <div className="gallery-sheet" onClick={(e) => e.stopPropagation()}>
        
        {/* Drag handle decoration for mobile bottom sheet look */}
        <div className="drag-handle" />

        {/* Top Header */}
        <div className="gallery-header">
          <div className="gallery-header-info">
            <h3 className="gallery-title">{product.nombre}</h3>
            <p className="gallery-subtitle">
              {product.categories?.name || 'Sin categoría'} · {product.stock} ud.
            </p>
          </div>
          <button className="gallery-close-btn" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        {/* Core Viewer Area */}
        <div className="viewer-container">
          
          {isLoading ? (
            <div className="gallery-loader">
              <Loader2 size={32} className="animate-spin" />
              <span>Cargando galería...</span>
            </div>
          ) : (
            <>
              {/* Swipeable Scroll-Snap Container */}
              <div 
                className="image-scroll-container" 
                ref={scrollRef} 
                onScroll={handleScroll}
              >
                {allImages.map((src, idx) => (
                  <div key={idx} className="image-slide">
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={src} 
                        alt={`${product.nombre} - ${idx + 1}`} 
                        className="slide-img"
                      />
                    ) : (
                      <div className="slide-placeholder">
                        <ImageIcon size={48} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop Arrow Controls */}
              {allImages.length > 1 && (
                <>
                  <button 
                    className="nav-arrow left" 
                    onClick={() => navigateTo(activeIndex - 1)}
                    disabled={activeIndex === 0}
                    aria-label="Anterior"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    className="nav-arrow right" 
                    onClick={() => navigateTo(activeIndex + 1)}
                    disabled={activeIndex === allImages.length - 1}
                    aria-label="Siguiente"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              {/* Pagination Dots Indicator */}
              {allImages.length > 1 && (
                <div className="dots-indicator">
                  {allImages.map((_, idx) => (
                    <button
                      key={idx}
                      className={`dot ${idx === activeIndex ? 'active' : ''}`}
                      onClick={() => navigateTo(idx)}
                      aria-label={`Ir a imagen ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Numeric indicator */}
              <div className="numeric-indicator">
                {activeIndex + 1} / {allImages.length}
              </div>
            </>
          )}
        </div>

        {/* Thumbnail Selector list (Horizontal scroll on touch devices) */}
        {!isLoading && allImages.length > 1 && (
          <div className="thumbnails-bar">
            {allImages.map((src, idx) => (
              <button
                key={idx}
                className={`thumb-btn ${idx === activeIndex ? 'active' : ''}`}
                onClick={() => navigateTo(idx)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="thumb-img" />
              </button>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .gallery-backdrop {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .gallery-sheet {
          background: var(--bg-base, #1e1e1e);
          color: var(--text-primary, #ffffff);
          width: 100%;
          max-width: 580px;
          border-radius: 20px 20px 0 0;
          box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.4);
          display: flex;
          flex-direction: column;
          max-height: 92vh;
          overflow: hidden;
          padding-bottom: env(safe-area-inset-bottom, 16px);
          animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          border: 1px solid var(--border-subtle, #2e2e2e);
          border-bottom: none;
        }

        .drag-handle {
          width: 36px;
          height: 4px;
          background: var(--text-tertiary, #555);
          border-radius: 2px;
          margin: 10px auto 4px auto;
          flex-shrink: 0;
        }

        .gallery-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          border-bottom: 1px solid var(--border-subtle, #2e2e2e);
        }

        .gallery-header-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .gallery-title {
          font-size: 1.05rem;
          font-weight: 600;
          margin: 0;
          color: var(--text-primary, #fff);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 380px;
        }

        .gallery-subtitle {
          font-size: 0.8rem;
          margin: 0;
          color: var(--text-tertiary, #aaa);
        }

        .gallery-close-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: none;
          background: var(--bg-elevated, #2a2a2a);
          color: var(--text-primary, #fff);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
        }
        .gallery-close-btn:active {
          background: var(--border-strong, #3a3a3a);
        }

        .viewer-container {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          background: #121212;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .gallery-loader {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: var(--text-tertiary, #aaa);
          font-size: 0.88rem;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        .image-scroll-container {
          display: flex;
          width: 100%;
          height: 100%;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
        .image-scroll-container::-webkit-scrollbar {
          display: none;
        }

        .image-slide {
          flex: 0 0 100%;
          width: 100%;
          height: 100%;
          scroll-snap-align: start;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          background: #121212;
        }

        .slide-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          pointer-events: none;
        }

        .slide-placeholder {
          color: var(--text-tertiary, #555);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          display: none;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          transition: background 0.2s, opacity 0.2s;
        }
        .nav-arrow:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .nav-arrow.left { left: 16px; }
        .nav-arrow.right { right: 16px; }

        @media (min-width: 600px) {
          .nav-arrow {
            display: flex;
          }
          .gallery-sheet {
            border-radius: 16px;
            margin-bottom: auto;
            margin-top: auto;
            border: 1px solid var(--border-subtle, #333);
            animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .drag-handle {
            display: none;
          }
        }

        .dots-indicator {
          position: absolute;
          bottom: 16px;
          display: flex;
          gap: 6px;
          z-index: 10;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.4);
          border: none;
          padding: 0;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }
        .dot.active {
          background: #fff;
          transform: scale(1.2);
        }

        .numeric-indicator {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(0, 0, 0, 0.6);
          color: #fff;
          font-size: 0.72rem;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 12px;
          z-index: 10;
        }

        .thumbnails-bar {
          display: flex;
          gap: 8px;
          padding: 16px 20px;
          overflow-x: auto;
          background: var(--bg-elevated, #252525);
          border-top: 1px solid var(--border-subtle, #2e2e2e);
        }
        .thumbnails-bar::-webkit-scrollbar {
          display: none;
        }

        .thumb-btn {
          width: 52px;
          height: 52px;
          border-radius: 8px;
          overflow: hidden;
          padding: 0;
          border: 2px solid transparent;
          background: transparent;
          cursor: pointer;
          flex-shrink: 0;
          transition: border-color 0.2s, transform 0.2s;
        }
        .thumb-btn.active {
          border-color: var(--accent, #c8b89a);
          transform: scale(1.05);
        }

        .thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
