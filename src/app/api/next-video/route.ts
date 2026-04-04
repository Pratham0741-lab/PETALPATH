import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ─── Standard response helpers ──────────────────────────────────

function success<T>(data: T) {
    return NextResponse.json({ success: true, data })
}

function error(message: string, status = 400) {
    return NextResponse.json({ success: false, error: message }, { status })
}

// ─── Supabase admin client (bypasses RLS) ───────────────────────

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

/**
 * GET /api/next-video?video_id=<uuid>
 *
 * Core curriculum endpoint. Given a current video, returns the NEXT
 * video in the structured learning path based on sequence_order.
 *
 * Logic:
 *   1. Find current video's learning_order (sequence_order)
 *   2. Return the next video with learning_order > current
 *   3. Order by learning_order ASC, LIMIT 1
 *
 * Edge cases:
 *   - No next video → { done: true, message: "..." }
 *   - Invalid video_id → 400 error
 *   - DB failure → 500 error
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabase()
        const videoId = request.nextUrl.searchParams.get('video_id')

        if (!videoId) {
            return error('video_id query parameter is required')
        }

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(videoId)) {
            return error('video_id must be a valid UUID')
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

        // ─── Step 2: Find NEXT video by learning_order ──────────
        // Uses a single efficient query with indexed columns
        const { data: nextVideo, error: nextErr } = await supabase
            .from('videos')
            .select('id, title, video_url, thumbnail_url, tags:topics, domain, stage, learning_order, duration, category')
            .eq('is_published', true)
            .gt('learning_order', currentVideo.learning_order)
            .order('learning_order', { ascending: true })
            .limit(1)
            .maybeSingle()

        if (nextErr) {
            console.error('[next-video] DB error:', nextErr)
            return error('Failed to fetch next video', 500)
        }

        // ─── Step 3: Handle edge case — no next video ───────────
        if (!nextVideo) {
            return success({
                done: true,
                message: 'Congratulations! You have completed all available lessons.',
                current_video_id: videoId,
            })
        }

        return success({
            done: false,
            video: {
                id: nextVideo.id,
                title: nextVideo.title,
                video_url: nextVideo.video_url,
                thumbnail_url: nextVideo.thumbnail_url,
                topics: nextVideo.tags || [],
                domain: nextVideo.domain,
                stage: nextVideo.stage,
                sequence_order: nextVideo.learning_order,
                duration: nextVideo.duration,
                category: nextVideo.category,
            },
        })
    } catch (err) {
        console.error('[next-video] Unhandled error:', err)
        return error('Internal server error', 500)
    }
}
