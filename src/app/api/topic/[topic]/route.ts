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

// ─── Domain ordering (alphabet → phonics → application) ─────────
const DOMAIN_PRIORITY: Record<string, number> = {
    alphabet: 1,
    phonics: 2,
    numbers: 3,
    shapes: 4,
    general: 5,
}

/**
 * GET /api/topic/:topic
 *
 * Smart topic-based navigation. Returns ALL videos for a given topic
 * (e.g., "A", "3", "circle") ordered by domain progression:
 *   alphabet → phonics → application (shapes/numbers)
 *
 * This lets the frontend show a topic drill-down:
 *   "Letter A" → "Phonics: Sound of A" → "A in words"
 *
 * The topic parameter is case-insensitive and matches against:
 *   1. The video's tags array
 *   2. The video's title
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ topic: string }> }
) {
    try {
        const { topic } = await params
        const supabase = getSupabase()

        if (!topic || topic.trim().length === 0) {
            return error('Topic parameter is required')
        }

        const normalizedTopic = decodeURIComponent(topic).trim()

        // ─── Query: Find videos matching this topic ─────────────
        // We use two strategies and merge results:
        //   1. Tags array contains the topic (case-insensitive via ilike on array)
        //   2. Title contains the topic

        // Strategy 1: Search by tags (Supabase cs = contains for arrays)
        const { data: tagMatches, error: tagErr } = await supabase
            .from('videos')
            .select('id, title, video_url, thumbnail_url, tags:topics, domain, stage, learning_order, duration, category, difficulty')
            .eq('is_published', true)
            .contains('topics', [normalizedTopic])

        // Strategy 2: Search by title (case-insensitive)
        const { data: titleMatches, error: titleErr } = await supabase
            .from('videos')
            .select('id, title, video_url, thumbnail_url, tags:topics, domain, stage, learning_order, duration, category, difficulty')
            .eq('is_published', true)
            .ilike('title', `%${normalizedTopic}%`)

        if (tagErr && titleErr) {
            console.error('[topic] DB errors:', tagErr, titleErr)
            return error('Failed to fetch videos for topic', 500)
        }

        // ─── Merge and deduplicate results ──────────────────────
        const allMatches = [...(tagMatches || []), ...(titleMatches || [])]
        const seen = new Set<string>()
        const unique = allMatches.filter((v) => {
            if (seen.has(v.id)) return false
            seen.add(v.id)
            return true
        })

        if (unique.length === 0) {
            return success({
                topic: normalizedTopic,
                count: 0,
                videos: [],
            })
        }

        // ─── Sort: domain priority (alphabet → phonics → application) ───
        const sorted = unique.sort((a, b) => {
            const aPriority = DOMAIN_PRIORITY[a.domain] ?? 99
            const bPriority = DOMAIN_PRIORITY[b.domain] ?? 99
            if (aPriority !== bPriority) return aPriority - bPriority
            return (a.learning_order ?? 0) - (b.learning_order ?? 0)
        })

        // ─── Transform response ────────────────────────────────
        const videos = sorted.map((v) => ({
            id: v.id,
            title: v.title,
            video_url: v.video_url,
            thumbnail_url: v.thumbnail_url,
            topics: v.tags || [],
            domain: v.domain,
            stage: v.stage,
            sequence_order: v.learning_order,
            duration: v.duration,
            category: v.category,
            difficulty: v.difficulty,
        }))

        return success({
            topic: normalizedTopic,
            count: videos.length,
            videos,
        })
    } catch (err) {
        console.error('[topic] Unhandled error:', err)
        return error('Internal server error', 500)
    }
}
