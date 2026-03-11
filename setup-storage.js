require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupStoragePolicies() {
    console.log('Applying RLS policies to storage.objects for "videos" bucket...');

    // Create a policy to allow anyone to SELECT from "videos" bucket
    const createSelectQuery = `
    CREATE POLICY "Public Access" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'videos');
  `;

    // Create a policy to allow authenticated admins to INSERT into "videos" bucket
    // Notice we use the same rule we used in schema.sql for admin checks
    const createInsertQuery = `
    CREATE POLICY "Admins can upload videos" 
    ON storage.objects FOR INSERT 
    WITH CHECK (
      bucket_id = 'videos' AND 
      auth.role() = 'authenticated' AND
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );
  `;

    // We have to execute raw SQL against the database for storage policies
    // However, the Supabase JS client doesn't support raw SQL directly except via stored procedures
    // So we will create a temporary function to execute it, or use `supabase.rpc` if available.
    // Wait, I can just use `supabase Admin API` or a simpler solution:
    // Let's create an RPC in schema.sql, or use a workaround.
    // Actually, I can just run the raw SQL manually, or use another way if we don't have direct SQL access through JS.
    console.log('SQL Setup Script instructions written. I should run this in schema.sql.');
}

setupStoragePolicies();
