const run = async () => {
    try {
        console.log('Fetching /api/videos...');
        const r1 = await fetch('http://localhost:3000/api/videos');
        if (!r1.ok) {
            console.error('vids error state', r1.status);
            console.error(await r1.text());
        } else {
            const d1 = await r1.json();
            console.log('Videos count:', d1.videos ? d1.videos.length : d1);
            if(d1.videos && d1.videos.length > 0) {
                console.log('Sample video id:', d1.videos[0].id);
            }
        }

        console.log('\nFetching /api/curriculum-progress...');
        // We know they don't have a valid childId off-hand but we'll try something generic or blank
        const r2 = await fetch('http://localhost:3000/api/curriculum-progress?child_id=00000000-0000-0000-0000-000000000000');
        if (!r2.ok) {
            console.error('prog error state', r2.status);
            console.error(await r2.text());
        } else {
            const d2 = await r2.json();
            console.log('Progress domains:', d2.domains.map(d => ({ domain: d.domain, unlocked: d.unlocked, total: d.total })));
        }
    } catch(e) {
        console.error('Fetch error:', e);
    }
};
run();
