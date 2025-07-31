import { supabase } from './supabase-config.js';

async function testConnection() {
  const { data, error } = await supabase.auth.signUp({
    phone: '01234567890',
    password: 'testpassword'
  });
  console.log(data, error);
}
testConnection();