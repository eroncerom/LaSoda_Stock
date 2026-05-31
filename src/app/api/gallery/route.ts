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

// List gallery images
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categorySlug = searchParams.get('categorySlug')
    const productSlug = searchParams.get('productSlug')

    if (!categorySlug || !productSlug) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const galleryFolder = `${categorySlug}/Gallery/${productSlug}`

    const { data, error } = await supabase.storage.from('web-assets').list(galleryFolder)

    if (error) {
      // If folder doesn't exist yet, it's fine, return empty list
      return NextResponse.json([])
    }

    if (data && data.length > 0) {
      const filtered = data.filter(file => file.name !== '.emptyFolderPlaceholder')
      const images = filtered.map(file => {
        const filePath = `${galleryFolder}/${file.name}`
        const { data: urlData } = supabase.storage.from('web-assets').getPublicUrl(filePath)
        return {
          name: file.name,
          path: filePath,
          publicUrl: urlData.publicUrl
        }
      })
      return NextResponse.json(images)
    }

    return NextResponse.json([])
  } catch (error: any) {
    console.error('Error listing gallery:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Upload a single file to Gallery
export async function POST(request: Request) {
  try {
    const auth = await checkPermission()
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const categorySlug = formData.get('categorySlug') as string | null
    const productSlug = formData.get('productSlug') as string | null

    if (!file || !categorySlug || !productSlug) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const filePath = `${categorySlug}/Gallery/${productSlug}/${file.name}`

    const { error } = await supabase.storage
      .from('web-assets')
      .upload(filePath, file, {
        upsert: true,
        cacheControl: '3600',
        contentType: file.type
      })

    if (error) {
      console.error('Supabase storage error during gallery upload:', error)
      return NextResponse.json({ error: `Storage error: ${error.message}` }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from('web-assets').getPublicUrl(filePath)

    return NextResponse.json({ path: filePath, publicUrl: urlData.publicUrl })
  } catch (error: any) {
    console.error('Error uploading gallery image:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Delete a gallery file
export async function DELETE(request: Request) {
  try {
    const auth = await checkPermission()
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('filePath')

    if (!filePath) {
      return NextResponse.json({ error: 'filePath parameter is required' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const { error } = await supabase.storage.from('web-assets').remove([filePath])

    if (error) {
      console.error('Supabase storage error during delete:', error)
      return NextResponse.json({ error: `Storage error: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting gallery image:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
