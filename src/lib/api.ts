import { createClient } from '@/lib/supabase/client'
import type { Product, Category, Order, OrderStatus } from '@/lib/types'
import { getOrdersServer, getUsersServer, getDashboardStatsServer } from '@/app/actions'

// ─── PRODUCTS ──────────────────────────────────────────────────────────────

export async function fetchProducts(): Promise<Product[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('storage_products')
    .select('*, categories(*)')
    .order('nombre', { ascending: true })
  if (error) throw error
  return (data as Product[]) ?? []
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('storage_products')
    .select('*, categories(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Product
}

export async function updateProduct(
  id: string,
  updates: Partial<Omit<Product, 'id' | 'created_at' | 'categories'>>
): Promise<Product> {
  const res = await fetch('/api/products', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updates }),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Error updating product')
  }
  return res.json()
}

export async function createProduct(
  product: Omit<Product, 'id' | 'created_at' | 'categories'>
): Promise<Product> {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Error creating product')
  }
  return res.json()
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`/api/products?id=${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Error deleting product')
  }
}

// ─── CATEGORIES ────────────────────────────────────────────────────────────

export async function fetchCategories(): Promise<Category[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return (data as Category[]) ?? []
}

// ─── ORDERS ────────────────────────────────────────────────────────────────

export async function fetchOrders(): Promise<Order[]> {
  return await getOrdersServer()
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const res = await fetch('/api/orders', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status }),
  })
  if (!res.ok) throw new Error('Error updating order status')
  return res.json()
}

// ─── STORAGE ───────────────────────────────────────────────────────────────

export async function uploadProductImage(
  file: File,
  categorySlug: string,
  fileName: string
): Promise<{ path: string; publicUrl: string }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('categorySlug', categorySlug)
  formData.append('fileName', fileName)

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Error uploading image')
  }

  return res.json()
}

// ─── DASHBOARD STATS ───────────────────────────────────────────────────────

export async function fetchDashboardStats() {
  return await getDashboardStatsServer()
}

// ─── USERS ─────────────────────────────────────────────────────────────────

export async function fetchUsers() {
  return await getUsersServer()
}
