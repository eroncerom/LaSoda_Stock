const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('d:/AI/Stock Admin/stock-admin/.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function findTheCulprit() {
  // We'll try to find any function containing the string
  const { data, error } = await supabase.rpc('get_functions_source', {});
  // If rpc fails, we can't do much without a direct SQL execution tool.
  // BUT wait, I can try to find if there's a trigger on storage.objects via a trick.
  
  // Actually, let's just search for the trigger name if it's common.
  // But the BEST proof is that the user says "Nueva maravilla disponible" was inserted.
  // That string is NOT in my codebase.
  
  console.log("Searching for 'Nueva maravilla disponible' in the database...");
  
  // Since I can't easily query system tables via the JS client without custom RPCs,
  // I will explain the logic to the user and ask them to check 'Database > Triggers' in Supabase.
}

findTheCulprit();
