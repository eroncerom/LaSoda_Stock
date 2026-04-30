const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('d:/AI/Stock Admin/stock-admin/.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkEntry() {
  const { data, error } = await supabase
    .from('storage_products')
    .select('*')
    .ilike('nombre', '%Coletero_llavero%');

  if (error) {
    console.error('Error fetching data:', error);
  } else {
    console.log('Result for Coletero_llavero:');
    console.log(data);
  }
}

checkEntry();
