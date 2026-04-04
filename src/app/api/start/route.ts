import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ─── Standard response helpers ──────────────────────────────────

function success<T>(data: T) {
    return NextResponse.json({ success: true, data })
}

function error(message: string, status = 400) {
    return NextResponse.json({ success: false, error: message }, { status })
}

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

/**
 * GET /api/start
 *
 * Returns the FIRST video in the entire curriculum.
 * This is the entry point for new learners — no state needed.
 *
 * Logic:
 *   ORDER BY learning_order ASC LIMIT 1
 *
 * Auto-scalable: If the curriculum changes, this always returns
 * the lowest learning_order video automatically.
 */
export async function GET() {
    try {
        const supabase = getSupabase()

        const { data: firstVideo, error: dbErr } = await supabase
            .from('videos')
            .select('id, title, video_url, thumbnail_url, tags:topics, domain, stage, learning_order, duration, category, difficulty')
            .eq('is_published', true)
            .not('domain', 'is', null)
            .order('learning_order', { ascending: true })
            .limit(1)
            .maybeSingle()

        if (dbErr) {
            console.error('[start] DB error:', dbErr)
            return error('Failed to fetch starting video', 500)
        }

        if (!firstVideo) {
            return error('No videos available in the curriculum', 404)
        }

        return success({
            id: firstVideo.id,
            title: firstVideo.title,
            video_url: firstVideo.video_url,
            thumbnail_url: firstVideo.thumbnail_url,
            topics: firstVideo.tags || [],
            domain: firstVideo.domain,
            stage: firstVideo.stage,
            sequence_order: firstVideo.learning_order,
            duration: firstVideo.duration,
            category: firstVideo.category,
            difficulty: firstVideo.difficulty,
        })
    } catch (err) {
        console.error('[start] Unhandled error:', err)
        return error('Internal server error', 500)
    }
}
