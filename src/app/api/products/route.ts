import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

async function checkPermission() {
  try {
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {},
        },
      }
    )
    
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) return { authorized: false, error: 'Unauthorized', status: 401 }

    const supabaseAdmin = await createAdminClient()
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'superuser' && profile?.role !== 'db_manager') {
      return { authorized: false, error: 'Forbidden', status: 403 }
    }

    return { authorized: true }
  } catch (error) {
    console.error('Error in checkPermission:', error)
    return { authorized: false, error: 'Internal Server Error', status: 500 }
  }
}

export async function POST(request: Request) {
  try {
    const auth = await checkPermission()
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const productData = await request.json()
    const supabase = await createAdminClient()

    // Usamos UPSERT en lugar de INSERT. 
    // Si el trigger ya creó la entrada al subir la imagen, esto la actualizará.
    const { data, error } = await supabase
      .from('storage_products')
      .upsert(productData, { 
        onConflict: 'storage_path',
        ignoreDuplicates: false 
      })
      .select('*, categories(*)')
      .single()

    if (error) {
      console.error('Error in upsert product:', error)
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error processing product:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await checkPermission()
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { id, ...updates } = await request.json()
    const supabase = await createAdminClient()

    if (!id) throw new Error('Product ID is required')

    // Si estamos actualizando la imagen (storage_path), es posible que el trigger
    // ya haya creado una entrada "fantasma" para esa nueva imagen.
    // La borramos para poder actualizar nuestro producto original sin conflictos.
    if (updates.storage_path) {
      await supabase
        .from('storage_products')
        .delete()
        .eq('storage_path', updates.storage_path)
        .neq('id', id)
    }

    const { data, error } = await supabase
      .from('storage_products')
      .update(updates)
      .eq('id', id)
      .select('*, categories(*)')
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await checkPermission()
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const supabase = await createAdminClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) throw new Error('Product ID is required')

    const { error } = await supabase.from('storage_products').delete().eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
