const { createClient } = require('@supabase/supabase-js');

(async () => {
  const adminSupa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // Sign in
  const sClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data: sessionData } = await sClient.auth.signInWithPassword({
    email: 'testauth3@soda.com',
    password: 'password123'
  });

  const token = sessionData.session.access_token;
  const refresh = sessionData.session.refresh_token;

  // Supabase Next.js cookie name format
  // It's sb-<project-id>-auth-token
  const cookieName = `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0]}-auth-token`;
  const cookieValue = `base64-${Buffer.from(JSON.stringify({access_token: token, refresh_token: refresh})).toString('base64')}`;
  
  const cookieHeader = `${cookieName}=${cookieValue};`;

  console.log('Fetching /api/me...');
  const r1 = await fetch('http://localhost:3000/api/me', { headers: { cookie: cookieHeader } });
  console.log('api/me status:', r1.status);
  console.log('api/me body:', await r1.text());

  console.log('Fetching /api/orders...');
  const r2 = await fetch('http://localhost:3000/api/orders', { headers: { cookie: cookieHeader } });
  console.log('api/orders status:', r2.status);
  console.log('api/orders body:', await r2.text());

  console.log('Fetching /api/usuarios...');
  const r3 = await fetch('http://localhost:3000/api/usuarios', { headers: { cookie: cookieHeader } });
  console.log('api/usuarios status:', r3.status);
  console.log('api/usuarios body:', await r3.text());

})().catch(console.error);
