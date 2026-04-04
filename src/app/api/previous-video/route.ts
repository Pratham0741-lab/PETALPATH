import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ─── Standard response helpers ──────────────────────────────────

function success<T>(data: T, extra?: Record<string, unknown>) {
    return NextResponse.json({ success: true, data, ...extra })
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
 * GET /api/previous-video?video_id=<uuid>
 *
 * Reverse navigation endpoint. Given a current video, returns the
 * PREVIOUS video in the structured learning path.
 *
 * Logic:
 *   1. Find current video's learning_order (sequence_order)
 *   2. Return the previous video where learning_order < current
 *   3. ORDER BY learning_order DESC LIMIT 1 (nearest previous)
 *
 * Edge cases:
 *   - Invalid video_id          → 400 error
 *   - Video not found           → 404 error
 *   - No previous (first video) → { data: null, isStart: true }
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabase()
        const videoId = request.nextUrl.searchParams.get('video_id')

        // ─── Validate input ─────────────────────────────────────
        if (!videoId) {
            return error('video_id query parameter is required')
        }

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(videoId)) {
            return error('Invalid video_id — must be a valid UUID')
        }

        // ─── Step 1: Get current video's learning_order ─────────
        const { data: currentVideo, error: currentErr } = await supabase
            .from('videos')
            .select('id, domain, stage, learning_order')
            .eq('id', videoId)
            .eq('is_published', true)
            .single()

        if (currentErr || !currentVideo) {
            return error('Video not found or not published', 404)
        }

        if (currentVideo.learning_order == null) {
            return error('Video has no curriculum mapping (missing sequence_order)', 422)
        }

        // ─── Step 2: Find PREVIOUS video ────────────────────────
        // Single query: learning_order < current, ORDER DESC, LIMIT 1
        const { data: prevVideo, error: prevErr } = await supabase
            .from('videos')
            .select('id, title, video_url, thumbnail_url, tags:topics, domain, stage, learning_order, duration, category, difficulty')
            .eq('is_published', true)
            .not('domain', 'is', null)
            .lt('learning_order', currentVideo.learning_order)
            .order('learning_order', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (prevErr) {
            console.error('[previous-video] DB error:', prevErr)
            return error('Failed to fetch previous video', 500)
        }

        // ─── Step 3: Handle first-video edge case ───────────────
        if (!prevVideo) {
            return success(null, { isStart: true })
        }

        // ─── Step 4: Return previous video ──────────────────────
        return success({
            id: prevVideo.id,
            title: prevVideo.title,
            video_url: prevVideo.video_url,
            thumbnail_url: prevVideo.thumbnail_url,
            topics: prevVideo.tags || [],
            domain: prevVideo.domain,
            stage: prevVideo.stage,
            sequence_order: prevVideo.learning_order,
            duration: prevVideo.duration,
            category: prevVideo.category,
            difficulty: prevVideo.difficulty,
        })
    } catch (err) {
        console.error('[previous-video] Unhandled error:', err)
        return error('Internal server error', 500)
    }
}
