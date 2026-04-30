
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('d:/AI/Stock Admin/stock-admin/.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUnique() {
  const { error: insertError } = await supabase
    .from('storage_products')
    .insert({ nombre: 'Test Product', price: 10, stock: 1 })
    .select();
    
  if (insertError) {
    console.log('First insert error:', insertError.message);
  } else {
    console.log('First insert success');
    const { error: secondError } = await supabase
      .from('storage_products')
      .insert({ nombre: 'Test Product', price: 10, stock: 1 })
      .select();
      
    if (secondError) {
      console.log('Second insert error (if unique):', secondError.message);
    } else {
      console.log('Second insert success (not unique)');
    }
  }
}

checkUnique();
