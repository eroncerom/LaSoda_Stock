
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync('d:/AI/Stock Admin/stock-admin/.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*');

  if (error) {
    console.error('Error fetching categories:', error);
    return;
  }

  console.log('Categories:');
  console.log(JSON.stringify(data, null, 2));

  // Also check storage buckets
  const { data: buckets, error: bucketError } = await supabase
    .storage
    .listBuckets();

  if (bucketError) {
    console.error('Error fetching buckets:', bucketError);
  } else {
    console.log('\nBuckets:');
    console.log(JSON.stringify(buckets, null, 2));
    
    const updates = [
      { id: 'c1000000-0000-0000-0000-000000000001', image_url: 'https://cvjsncprlmtddhspwnlt.supabase.co/storage/v1/object/public/web-assets/coleccion-actual/Products/Corona_LaSoda.jpg' },
      { id: 'c2000000-0000-0000-0000-000000000002', image_url: 'https://cvjsncprlmtddhspwnlt.supabase.co/storage/v1/object/public/web-assets/rincon-infantil/rincon-infantil.JPG' },
      { id: 'c3000000-0000-0000-0000-000000000003', image_url: 'https://cvjsncprlmtddhspwnlt.supabase.co/storage/v1/object/public/web-assets/mundo-magico/MundoMagicoP.JPG' },
      { id: 'c4000000-0000-0000-0000-000000000004', image_url: 'https://cvjsncprlmtddhspwnlt.supabase.co/storage/v1/object/public/web-assets/seleccion-telas/TelasColores.jpg' },
      { id: 'c5000000-0000-0000-0000-000000000005', image_url: 'https://cvjsncprlmtddhspwnlt.supabase.co/storage/v1/object/public/web-assets/segunda-oportunidad/SegundaOportunidad.jpg' }
    ];

    for (const update of updates) {
      const { error } = await supabase
        .from('categories')
        .update({ image_url: update.image_url })
        .eq('id', update.id);
      
      if (error) {
        console.error(`Error updating category ${update.id}:`, error);
      } else {
        console.log(`Updated category ${update.id}`);
      }
    }
  }
}

checkCategories();
