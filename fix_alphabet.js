require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

function extractLetter(title) {
    // Look for standalone letter like " A " or " A\n" or " of E", etc.
    // Specially look for letter alone or after certain words.
    
    // Pattern 1: Learning Letters A and B
    let match = title.match(/Letters\s+([A-Za-z])/i);
    if (match) return match[1].toUpperCase();

    // Pattern 2: Phonics Sound of E
    match = title.match(/(?:of|letter)\s+([A-Za-z])/i);
    if (match) return match[1].toUpperCase();

    // Pattern 3: Standalone letter matched at boundary
    match = title.match(/\b([A-Za-z])\b/);
    if (match) return match[1].toUpperCase();

    return null;
}

async function run() {
    console.log("Fixing alphabet and phonics learning_order...");
    const { data: videos } = await supabase.from('videos').select('id, title, domain, learning_order');
    
    let toUpdate = [];

    for (let v of videos) {
        if (v.domain === 'alphabet' || v.domain === 'phonics') {
            const letter = extractLetter(v.title);
            if (letter) {
                const order = letter.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
                if (order !== v.learning_order) {
                    console.log(`Fixing [${v.domain}]: "${v.title}" -> Letter: ${letter}, Order: ${order}`);
                    toUpdate.push({ id: v.id, learning_order: order, __title: v.title });
                }
            } else {
                console.log(`WARNING: Could not extract letter from "${v.title}"`);
            }
        }
    }

    if (toUpdate.length === 0) {
        console.log("Nothing to update.");
        return;
    }

    for (let u of toUpdate) {
        await supabase.from('videos').update({ learning_order: u.learning_order }).eq('id', u.id);
        console.log(`Updated ${u.__title} to order ${u.learning_order}`);
    }

    console.log("Done updating!");
}

run();
