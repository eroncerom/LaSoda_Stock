// Types matching the real La Soda database schema

export interface Category {
  id: string
  name: string
  slug: string
  image_url: string | null
}

export interface Product {
  id: string
  nombre: string
  description: string | null
  price: number
  stock: number
  category_id: string | null
  storage_path: string | null
  public_url: string | null
  created_at: string
  // Joined
  categories?: Category | null
}

export interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
}

export interface Order {
  id: string
  customer_contact: string | null
  items: OrderItem[]
  total_amount: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  created_at: string
}

export type OrderStatus = Order['status']
