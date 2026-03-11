import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://irdniyrdrotokchcbdqz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZG5peXJkcm90b2tjaGNiZHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwODQ3NjEsImV4cCI6MjA4ODY2MDc2MX0.ueD58rVyc3tYwPyunCzqW9Zups8yJjO_F_4QWWaPtqY'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZG5peXJkcm90b2tjaGNiZHF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA4NDc2MSwiZXhwIjoyMDg4NjYwNzYxfQ.Ls-2vyEZepSNGc9KVYNaj0L_786SClwC44pDdVrORDU'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  console.log('Resetting password...');
  await supabaseAdmin.auth.admin.updateUserById('92eba08d-be74-48fb-93d5-b6498a0603fd', { password: 'password123' })

  console.log('Signing in...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'prathammohadikar@gmail.com',
    password: 'password123'
  })
  
  if (authError) {
    console.error('Auth error:', authError.message)
  } else {
      console.log("Auth 1: Success", authData.user.id)
  }

  const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single()
  
  fs.writeFileSync('db_output.json', JSON.stringify({
      profile: profileData,
      profileError
  }, null, 2))
  console.log("Wrote to db_output.json")
}
run()
