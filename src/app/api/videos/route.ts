import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/videos
 *
 * Returns published videos with curriculum metadata.
 * Optional filters: ?domain=alphabet&stage=foundation
 */
export async function GET(request: NextRequest) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const domain = request.nextUrl.searchParams.get('domain')
    const stage = request.nextUrl.searchParams.get('stage')

    let query = supabase
        .from('videos')
        .select('id, title, video_url, thumbnail_url, category, difficulty, tags:topics, duration, domain, stage, learning_order')
        .eq('is_published', true)

    // Apply optional filters
    if (domain) query = query.eq('domain', domain)
    if (stage) query = query.eq('stage', stage)

    // Order by domain, then learning_order for structured flow
    query = query
        .order('domain', { ascending: true })
        .order('learning_order', { ascending: true })
        .limit(200)

    const { data, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ videos: data })
}
