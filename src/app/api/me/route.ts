import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
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
    
    if (!user) return NextResponse.json({ role: null, error: 'no user' })

    const supabaseAdmin = await createAdminClient()
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    return NextResponse.json({ role: profile?.role || null })
  } catch (err) {
    return NextResponse.json({ role: null, error: String(err) })
  }
}
