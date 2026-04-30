import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testCreateUser() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'test_trigger_error@example.com',
    password: 'password123',
    email_confirm: true
  })

  if (error) {
    console.error('Error creating user:', JSON.stringify(error, null, 2))
  } else {
    console.log('User created successfully:', data.user.id)
    // Clean up
    await supabase.auth.admin.deleteUser(data.user.id)
  }
}

testCreateUser()
