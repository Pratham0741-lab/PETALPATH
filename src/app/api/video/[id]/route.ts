import { NextRequest, NextResponse } from 'next/server'
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
 * GET /api/video/:id
 *
 * Returns full video info for a given video ID including
 * curriculum metadata (domain, stage, sequence_order, topics).
 *
 * Replay-safe: This is a pure read with no side effects.
 * Frontend can call this endpoint repeatedly for replay.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = getSupabase()

        if (!id) {
            return error('Video ID is required')
        }

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(id)) {
            return error('Video ID must be a valid UUID')
        }

        const { data: video, error: dbErr } = await supabase
            .from('videos')
            .select('id, title, video_url, thumbnail_url, tags, domain, stage, learning_order, duration, category, difficulty')
            .eq('id', id)
            .eq('is_published', true)
            .single()

        if (dbErr || !video) {
            return error('Video not found', 404)
        }

        return success({
            id: video.id,
            title: video.title,
            video_url: video.video_url,
            thumbnail_url: video.thumbnail_url,
            topics: video.tags || [],
            domain: video.domain,
            stage: video.stage,
            sequence_order: video.learning_order,
            duration: video.duration,
            category: video.category,
            difficulty: video.difficulty,
        })
    } catch (err) {
        console.error('[video/:id] Unhandled error:', err)
        return error('Internal server error', 500)
    }
}
