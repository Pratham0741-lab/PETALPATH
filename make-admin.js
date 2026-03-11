require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function makeAdmin() {
    console.log('Fetching all users...');

    // 1. Get user
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
        return console.error('Failed to list users:', error);
    }

    // Update ALL users to admin for development testing to ensure it works
    for (const user of users) {
        console.log(`Elevating ${user.email} to Admin...`);

        // 2. Update Auth metadata
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
            user_metadata: { ...user.user_metadata, role: 'admin' }
        });

        if (updateError) {
            console.error('Failed to update auth metadata for', user.email, updateError);
        } else {
            console.log('✅ Auth metadata updated to admin.');
        }

        // 3. Update Profile table
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', user.id);

        if (profileError) {
            console.error('Failed to update profile for', user.email, profileError);
        } else {
            console.log('✅ Profile table updated to admin.');
        }
    }
}

makeAdmin();
