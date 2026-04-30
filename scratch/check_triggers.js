const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('d:/AI/Stock Admin/stock-admin/.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTriggers() {
  const { data, error } = await supabase.rpc('get_triggers');
  if (error) {
     console.error('RPC failed, falling back to REST if possible, or maybe just look at the created entry...');
  } else {
     console.log(data);
  }
}
checkTriggers();
