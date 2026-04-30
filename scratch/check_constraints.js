
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('d:/AI/Stock Admin/stock-admin/.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkConstraints() {
  // We can use RPC or raw SQL if enabled, but let's try to just insert a dummy and see the error
  // Or query information_schema if we have permissions
  const { data, error } = await supabase.rpc('get_table_info', { table_name: 'storage_products' });
  
  if (error) {
    // If RPC fails, try querying information_schema via raw SQL if possible
    // But usually we can't do raw SQL via supabase-js unless we have a specific function.
    // Let's try to just check the columns again and see if any are mandatory.
    console.log('RPC get_table_info failed, trying another way...');
    
    // Attempting a failing insert to see the error message
    const { error: insertError } = await supabase
      .from('storage_products')
      .insert({})
      .select();
      
    console.log('Insert error message (reveals constraints):', insertError?.message);
    console.log('Insert error details:', insertError?.details);
  } else {
    console.log('Table Info:', data);
  }
}

checkConstraints();
