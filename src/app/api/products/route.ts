import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
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
