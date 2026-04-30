const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envFile = fs.readFileSync('d:/AI/Stock Admin/stock-admin/.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'test_trigger@example.com',
    password: 'password123',
    email_confirm: true,
  });
  console.log('Create Auth:', data?.user?.id, error);
  
  if (data?.user?.id) {
    const { data: profile, error: pError } = await supabase.from('profiles').select('*').eq('id', data.user.id);
    console.log('Profile:', profile, pError);
    
    // cleanup
    await supabase.auth.admin.deleteUser(data.user.id);
    console.log('Cleaned up test user');
  }
}
test();
