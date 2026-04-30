
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('d:/AI/Stock Admin/stock-admin/.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkConstraint() {
  console.log('--- Test 1: Insert WITHOUT storage_path field ---')
  const { data: d1, error: e1 } = await supabase
    .from('storage_products')
    .insert({ nombre: '__TEST_1__', price: 0, stock: 0 })
    .select('id, storage_path')
    .single()

  if (e1) {
    console.log('FAIL:', e1.code, e1.message)
  } else {
    console.log('OK - id:', d1.id, '| storage_path:', d1.storage_path)
    await supabase.from('storage_products').delete().eq('id', d1.id)
    console.log('Cleaned up test 1')
  }

  console.log('\n--- Test 2: Insert WITH storage_path: null ---')
  const { data: d2, error: e2 } = await supabase
    .from('storage_products')
    .insert({ nombre: '__TEST_2__', price: 0, stock: 0, storage_path: null })
    .select('id, storage_path')
    .single()

  if (e2) {
    console.log('FAIL:', e2.code, e2.message)
  } else {
    console.log('OK - id:', d2.id, '| storage_path:', d2.storage_path)
    await supabase.from('storage_products').delete().eq('id', d2.id)
    console.log('Cleaned up test 2')
  }

  console.log('\n--- Checking existing storage_path values in table ---')
  const { data: rows } = await supabase
    .from('storage_products')
    .select('id, nombre, storage_path')
  const nullPaths = rows?.filter(r => !r.storage_path) ?? []
  console.log(`Products with null/empty storage_path: ${nullPaths.length}`)
  nullPaths.forEach(r => console.log(' -', r.nombre, '| storage_path:', r.storage_path))
}

checkConstraint()
