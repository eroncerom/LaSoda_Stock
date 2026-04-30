
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const path = require('path');
const envPath = path.join(__dirname, '../.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) process.env[key.trim()] = value.trim();
});


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUser() {
  const { data: users, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Error listing users:', authError);
    return;
  }

  const user = users.users.find(u => u.email === 'eroncerom@gmail.com');
  if (!user) {
    console.log('User not found in auth.users');
    return;
  }

  console.log('User ID:', user.id);

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Error fetching profile:', profileError);
  } else {
    console.log('Profile:', profile);
  }
}

checkUser();
