
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('d:/AI/Stock Admin/stock-admin/.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function fixOrphans() {
  // Get all storage_paths from products DB
  const { data: products, error } = await supabase
    .from('storage_products')
    .select('storage_path, nombre')
  if (error) { console.error('DB error:', error); return; }
  
  const dbPaths = new Set(products.map(p => p.storage_path).filter(Boolean))
  console.log(`DB has ${dbPaths.size} product paths`)

  // Get all storage_paths from categories DB
  const { data: categories } = await supabase.from('categories').select('image_url')
  const catPaths = new Set()
  categories?.forEach(c => {
    if (c.image_url && c.image_url.includes('supabase.co')) {
      // Extract path from full URL
      const match = c.image_url.match(/web-assets\/(.+)$/)
      if (match) catPaths.add(match[1])
    }
  })
  console.log(`DB has ${catPaths.size} category image paths`)

  // List all files in Products/ subfolders only (not category images)
  const allProductFiles = []
  const folders = ['coleccion-actual', 'mundo-magico', 'rincon-infantil', 'segunda-oportunidad', 'seleccion-telas']
  
  for (const folder of folders) {
    const { data: files } = await supabase.storage.from('web-assets').list(`${folder}/Products`, { limit: 200 })
    if (files) {
      files.forEach(f => {
        if (f.id) allProductFiles.push(`${folder}/Products/${f.name}`)
      })
    }
    // Also check Productos (typo in rincon-infantil)
    const { data: files2 } = await supabase.storage.from('web-assets').list(`${folder}/Productos`, { limit: 200 })
    if (files2) {
      files2.forEach(f => {
        if (f.id) allProductFiles.push(`${folder}/Productos/${f.name}`)
      })
    }
  }

  console.log(`\nAll product files in storage: ${allProductFiles.length}`)
  
  // Find orphans: in storage /Products/ folder but not in DB
  const orphans = allProductFiles.filter(f => !dbPaths.has(f))
  console.log(`\nOrphaned product files: ${orphans.length}`)
  orphans.forEach(f => console.log(' -', f))

  if (orphans.length > 0) {
    console.log('\nDeleting orphaned product files...')
    const { error: delError } = await supabase.storage.from('web-assets').remove(orphans)
    if (delError) console.error('Error deleting:', delError)
    else console.log('✅ Orphans deleted successfully')
  } else {
    console.log('No orphans to delete.')
  }

  // Also restore category images if they were deleted
  console.log('\n--- Checking category images ---')
  const { data: catFiles } = await supabase.storage.from('web-assets').list('', { limit: 200 })
  console.log('Root folders:', catFiles?.map(f => f.name))
}

fixOrphans()
