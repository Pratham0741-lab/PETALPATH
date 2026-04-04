require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    const { data: videos } = await supabase.from('videos').select('id, title, domain, learning_order');
    console.log(videos.filter(v => v.domain === 'alphabet' || v.domain === 'phonics').map(v => `${v.title} (${v.domain}) -> order: ${v.learning_order}`).join('\n'));
}
run();
