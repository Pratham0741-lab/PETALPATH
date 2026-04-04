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
 * GET /api/curriculum
 *
 * Returns the FULL structured learning path — every video in the
 * curriculum ordered by learning_order. This powers the curriculum
 * map / progress screen on the frontend.
 *
 * Response shape:
 * [
 *   {
 *     stage: "foundation",
 *     domain: "alphabet",
 *     topic: "A",
 *     sequence_order: 1,
 *     video: { id, title, video_url, ... }
 *   }
 * ]
 *
 * Auto-scalable: new videos added to the DB automatically appear
 * in the correct position via learning_order.
 */
export async function GET() {
    try {
        const supabase = getSupabase()

        const { data: videos, error: dbErr } = await supabase
            .from('videos')
            .select('id, title, video_url, thumbnail_url, tags:topics, domain, stage, learning_order, duration, category, difficulty')
            .eq('is_published', true)
            .not('domain', 'is', null)
            .order('domain', { ascending: true })
            .order('learning_order', { ascending: true })

        if (dbErr) {
            console.error('[curriculum] DB error:', dbErr)
            return error('Failed to fetch curriculum', 500)
        }

        if (!videos || videos.length === 0) {
            return success([])
        }

        // Transform into the structured curriculum format
        const curriculum = videos.map((v) => {
            // Extract primary topic from tags or title
            const topic = extractPrimaryTopic(v.tags, v.title, v.domain)

            return {
                stage: v.stage || 'foundation',
                domain: v.domain,
                topic,
                sequence_order: v.learning_order,
                video: {
                    id: v.id,
                    title: v.title,
                    video_url: v.video_url,
                    thumbnail_url: v.thumbnail_url,
                    topics: v.tags || [],
                    duration: v.duration,
                    category: v.category,
                    difficulty: v.difficulty,
                },
            }
        })

        return success(curriculum)
    } catch (err) {
        console.error('[curriculum] Unhandled error:', err)
        return error('Internal server error', 500)
    }
}

// ─── Helper: Extract primary topic from video metadata ──────────

function extractPrimaryTopic(
    tags: string[] | null,
    title: string,
    domain: string | null
): string {
    // 1. Check for single-letter tag (A, B, C...)
    if (tags && tags.length > 0) {
        const letterTag = tags.find((t: string) => /^[A-Z]$/i.test(t.trim()))
        if (letterTag) return letterTag.trim().toUpperCase()
    }

    // 2. Extract letter from title for alphabet/phonics domains
    if (domain === 'alphabet' || domain === 'phonics') {
        const letterMatch = title.match(/(?:letter\s+)?([A-Z])\b/i)
        if (letterMatch) return letterMatch[1].toUpperCase()
    }

    // 3. Extract number from title for numbers domain
    if (domain === 'numbers') {
        const numMatch = title.match(/(\d+)/)
        if (numMatch) return numMatch[1]
    }

    // 4. Extract shape name for shapes domain
    if (domain === 'shapes') {
        const shapes = ['circle', 'square', 'triangle', 'rectangle', 'oval', 'star', 'diamond', 'heart', 'hexagon', 'pentagon']
        for (const shape of shapes) {
            if (title.toLowerCase().includes(shape)) {
                return shape.charAt(0).toUpperCase() + shape.slice(1)
            }
        }
    }

    // 5. Fallback to title
    return title
}
