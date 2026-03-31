import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// UUID v4 validation — reject malformed IDs before they hit the DB
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * GET /api/learning-path/[id]
 *
 * Returns a single learning path with its ordered videos.
 * Joins learning_path_videos → videos to produce the full chapter detail.
 * Only returns published paths with published videos.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // ── Validate path param ──────────────────────────────
        if (!id || !UUID_REGEX.test(id)) {
            return NextResponse.json(
                { error: 'Invalid learning path ID' },
                { status: 400 }
            )
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // ── Fetch the learning path ─────────────────────────
        const { data: path, error: pathError } = await supabase
            .from('learning_paths')
            .select('id, title, description, order_index, age_group, thumbnail_url')
            .eq('id', id)
            .eq('is_published', true)
            .single()

        if (pathError || !path) {
            return NextResponse.json(
                { error: 'Learning path not found' },
                { status: 404 }
            )
        }

        // ── Fetch ordered videos via junction table ─────────
        // Supabase nested select: learning_path_videos → videos
        const { data: pathVideos, error: videosError } = await supabase
            .from('learning_path_videos')
            .select(`
                order_index,
                videos:video_id (
                    id,
                    title,
                    description,
                    video_url,
                    thumbnail_url,
                    category,
                    difficulty,
                    tags,
                    duration,
                    is_published
                )
            `)
            .eq('path_id', id)
            .order('order_index', { ascending: true })

        if (videosError) {
            console.error('[learning-path/id] Videos query error:', videosError.message)
            return NextResponse.json(
                { error: 'Failed to fetch path videos' },
                { status: 500 }
            )
        }

        // ── Shape & filter — only published videos ──────────
        const videos = (pathVideos || [])
            .map((entry: any) => {
                const v = entry.videos
                if (!v || !v.is_published) return null
                return {
                    id: v.id,
                    title: v.title,
                    description: v.description,
                    video_url: v.video_url,
                    thumbnail_url: v.thumbnail_url,
                    category: v.category,
                    difficulty: v.difficulty,
                    topics: v.tags,          // map tags → topics for UI
                    duration: v.duration,
                    order: entry.order_index,
                }
            })
            .filter(Boolean)

        return NextResponse.json({
            id: path.id,
            title: path.title,
            description: path.description,
            order: path.order_index,
            age_group: path.age_group,
            thumbnail_url: path.thumbnail_url,
            videos,
            total_videos: videos.length,
        })

    } catch (err) {
        console.error('[learning-path/id] Unexpected error:', err)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
