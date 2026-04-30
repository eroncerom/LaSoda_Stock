
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('d:/AI/Stock Admin/stock-admin/.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const BASE = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/web-assets`

async function restoreCategories() {
  // Use product images that still exist as category covers
  const updates = [
    { id: 'c1000000-0000-0000-0000-000000000001', image_url: `${BASE}/coleccion-actual/Products/Corona_LaSoda.jpg` },
    { id: 'c2000000-0000-0000-0000-000000000002', image_url: `${BASE}/rincon-infantil/Productos/3enRaya.JPG` },
    { id: 'c3000000-0000-0000-0000-000000000003', image_url: `${BASE}/mundo-magico/Products/Varita_LaSoda.JPG` },
    { id: 'c4000000-0000-0000-0000-000000000004', image_url: `${BASE}/seleccion-telas/Products/TelasColores.jpg` },
    { id: 'c5000000-0000-0000-0000-000000000005', image_url: `${BASE}/segunda-oportunidad/Products/Imanes_LaSoda.JPG` },
  ]

  for (const u of updates) {
    const { error } = await supabase.from('categories').update({ image_url: u.image_url }).eq('id', u.id)
    if (error) console.error(`Error updating ${u.id}:`, error.message)
    else console.log(`✅ Updated category ${u.id}`)
  }
}

restoreCategories()
