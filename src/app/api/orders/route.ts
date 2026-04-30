import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { OrderStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status } = (await request.json()) as { id: string; status: OrderStatus }
    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
