import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
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
