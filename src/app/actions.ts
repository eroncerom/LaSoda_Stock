'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Order, OrderStatus } from '@/lib/types'

export async function getCurrentRole() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const adminSupabase = await createAdminClient()
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    return profile?.role || null
  } catch (error) {
    console.error('Error in getCurrentRole:', error)
    return null
  }
}

export async function getUserProfile() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const adminSupabase = await createAdminClient()
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('id, role, full_name, email')
      .eq('id', user.id)
      .single()

    return profile || null
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    return null
  }
}

export async function updateProfileName(fullName: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const adminSupabase = await createAdminClient()
    const { error } = await adminSupabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id)

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    console.error('Error in updateProfileName:', error)
    return { success: false, error: error.message }
  }
}

export async function getOrdersServer(): Promise<Order[]> {
  try {
    const adminSupabase = await createAdminClient()
    const { data, error } = await adminSupabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Order[]
  } catch (error) {
    console.error('Error in getOrdersServer:', error)
    return []
  }
}

export async function getUsersServer() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const adminSupabase = await createAdminClient()
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'superuser') throw new Error('Forbidden')

    const { data, error } = await adminSupabase
      .from('profiles')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error in getUsersServer:', error)
    return []
  }
}

export async function getDashboardStatsServer() {
  try {
    const adminSupabase = await createAdminClient()
    const [productsRes, ordersRes] = await Promise.all([
      adminSupabase.from('storage_products').select('stock, price'),
      adminSupabase.from('orders').select('total_amount, status'),
    ])
    
    if (productsRes.error) throw productsRes.error
    if (ordersRes.error) throw ordersRes.error

    const products = productsRes.data ?? []
    const orders = ordersRes.data ?? []

    const totalStock = products.reduce((sum, p) => sum + (p.stock ?? 0), 0)
    const inventoryValue = products.reduce((sum, p) => sum + (p.stock ?? 0) * (p.price ?? 0), 0)
    const pendingOrders = orders.filter((o) => o.status === 'pending').length
    const totalRevenue = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.total_amount ?? 0), 0)

    return {
      totalProducts: products.length,
      totalStock,
      inventoryValue,
      pendingOrders,
      totalOrders: orders.length,
      totalRevenue,
    }
  } catch (error) {
    console.error('Error in getDashboardStatsServer:', error)
    return {
      totalProducts: 0,
      totalStock: 0,
      inventoryValue: 0,
      pendingOrders: 0,
      totalOrders: 0,
      totalRevenue: 0,
    }
  }
}

export async function createUserAction(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const adminSupabase = await createAdminClient()
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'superuser') throw new Error('Forbidden')

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const full_name = formData.get('full_name') as string
    const role = formData.get('role') as string

    if (!email || !password) throw new Error('Email and password are required')

    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('User creation failed')

    const { error: profileError } = await adminSupabase
      .from('profiles')
      .update({ full_name, role, email })
      .eq('id', authData.user.id)

    if (profileError) {
      await adminSupabase.auth.admin.deleteUser(authData.user.id)
      throw profileError
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateUserAction(id: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const adminSupabase = await createAdminClient()
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'superuser') throw new Error('Forbidden')

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const full_name = formData.get('full_name') as string
    const role = formData.get('role') as string

    const updates: any = {}
    if (email) updates.email = email
    if (password) updates.password = password

    if (Object.keys(updates).length > 0) {
      const { error: authError } = await adminSupabase.auth.admin.updateUserById(id, updates)
      if (authError) throw authError
    }

    const profileUpdates: any = {}
    if (full_name !== undefined) profileUpdates.full_name = full_name
    if (role) profileUpdates.role = role
    if (email) profileUpdates.email = email

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await adminSupabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', id)
      
      if (profileError) throw profileError
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteUserAction(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    if (user.id === id) throw new Error('Cannot delete your own account')

    const adminSupabase = await createAdminClient()
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'superuser') throw new Error('Forbidden')

    const { error } = await adminSupabase.auth.admin.deleteUser(id)
    if (error) throw error

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function requestPasswordResetAction(email: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/login/update-password`,
    })
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updatePasswordAction(password: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateOrderStatusAction(orderId: string, status: OrderStatus) {
  try {
    const adminSupabase = await createAdminClient()
    const { error } = await adminSupabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    console.error('Error in updateOrderStatusAction:', error)
    return { success: false, error: error.message }
  }
}

export async function getOrderByIdServer(id: string): Promise<Order | null> {
  try {
    const adminSupabase = await createAdminClient()
    const { data, error } = await adminSupabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Order
  } catch (error) {
    console.error('Error in getOrderByIdServer:', error)
    return null
  }
}
