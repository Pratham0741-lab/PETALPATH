import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectDb() {
  const { data: vids, error: err1 } = await supabase.from('videos').select('id, title, domain, stage, learning_order, is_published');
  if (err1) {
    console.error('ERROR videos:', err1.message);
  } else {
    console.log('\n--- VIDEOS ---');
    console.log(`Total videos found: ${vids.length}`);
    const published = vids.filter(v => v.is_published);
    console.log(`Published videos: ${published.length}`);
    console.log('Sample of domains assigned:');
    const domainCounts = published.reduce((acc, v) => ({ ...acc, [v.domain]: (acc[v.domain] || 0) + 1 }), {});
    console.log(domainCounts);
  }

  const { data: progRes, error: err2 } = await supabase.from('videos').select('id, title, domain, stage, learning_order').eq('is_published', true).not('domain', 'is', null);
  if (err2) {
    console.error('ERROR query for curriculum-progress:', err2.message);
  } else {
    console.log(`\n--- /api/curriculum-progress mock ---`);
    console.log(`Query returned ${progRes.length} matching rows.`);
  }
}
inspectDb();
