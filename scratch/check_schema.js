
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('d:/AI/Stock Admin/stock-admin/.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase
    .from('storage_products')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching from storage_products:', error);
    return;
  }

  console.log('Sample product data (keys are columns):');
  console.log(Object.keys(data[0] || {}));
}

checkSchema();
