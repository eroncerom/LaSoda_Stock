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

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const categorySlug = formData.get('categorySlug') as string | null
    const fileName = formData.get('fileName') as string | null

    if (!file || !categorySlug || !fileName) {
      console.warn('Missing fields in upload request:', { file: !!file, categorySlug, fileName })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const filePath = `${categorySlug}/Products/${fileName}`

    console.log(`Uploading file to: ${filePath}`)

    const { error } = await supabase.storage
      .from('web-assets')
      .upload(filePath, file, {
        upsert: true,
        cacheControl: '3600',
        contentType: file.type
      })

    if (error) {
      console.error('Supabase storage error during upload:', error)
      return NextResponse.json({ 
        error: `Storage error: ${error.message}`,
        details: error
      }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from('web-assets').getPublicUrl(filePath)

    if (!urlData?.publicUrl) {
      console.error('Could not generate public URL for:', filePath)
      throw new Error('Public URL generation failed')
    }

    return NextResponse.json({ path: filePath, publicUrl: urlData.publicUrl })
  } catch (error: any) {
    console.error('Unexpected error during file upload:', error)
    return NextResponse.json({ error: error.message || 'Unexpected upload error' }, { status: 500 })
  }
}
