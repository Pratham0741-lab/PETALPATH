require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncAndElevate() {
    console.log('Restoring wiped profiles and elevating to admin...');
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();

    for (const user of users) {
        // 1. Ensure Auth metadata has role admin
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
            user_metadata: { ...user.user_metadata, role: 'admin' }
        });

        // 2. Insert into the wiped profiles table
        const fullName = user.user_metadata?.full_name || user.email.split('@')[0];
        await supabaseAdmin.from('profiles').upsert({
            id: user.id,
            email: user.email,
            full_name: fullName,
            role: 'admin'
        }, { onConflict: 'id' });

        console.log(`✅ Restored and elevated: ${user.email}`);
    }
}

syncAndElevate();
