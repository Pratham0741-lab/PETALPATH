import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
    getNextVideo,
    getFirstVideoForDomain,
    extractTopicFromVideo,
    type CurriculumVideo,
    type WatchHistoryEntry,
} from '@/lib/curriculum-engine'
import {
    buildCompletionStats,
    isDomainUnlocked,
    isRandomJump,
    validateNextVideoDomain,
    getLockReason,
} from '@/lib/curriculum-validator'
import type { CurriculumDomain, CurriculumStage } from '@/lib/types'

/**
 * POST /api/next-video
 *
 * Core curriculum endpoint. Determines the next video in a child's
 * structured learning journey using the rule engine.
 *
 * Input:
 *   { current_video_id?: string, child_id: string, domain?: string }
 *
 * Output:
 *   { next_video, reason, reinforcement?, progress }
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const body = await request.json()
        const { current_video_id, child_id, domain } = body

        if (!child_id) {
            return NextResponse.json(
                { error: 'child_id is required' },
                { status: 400 }
            )
        }

        // ─── 1. Fetch all published videos with curriculum data ───
        const { data: allVideosRaw, error: videosErr } = await supabase
            .from('videos')
            .select('id, title, video_url, thumbnail_url, category, difficulty, tags, duration, domain, stage, learning_order')
            .eq('is_published', true)
            .not('domain', 'is', null)
            .order('learning_order', { ascending: true })

        if (videosErr || !allVideosRaw) {
            return NextResponse.json(
                { error: 'Failed to fetch videos' },
                { status: 500 }
            )
        }

        const allVideos: CurriculumVideo[] = allVideosRaw.map((v: Record<string, unknown>) => ({
            id: v.id as string,
            title: v.title as string,
            domain: (v.domain || 'general') as CurriculumDomain,
            stage: (v.stage || 'foundation') as CurriculumStage,
            learning_order: (v.learning_order || 0) as number,
            video_url: v.video_url as string | undefined,
            thumbnail_url: v.thumbnail_url as string | undefined,
            tags: (v.tags || []) as string[],
            category: v.category as string | undefined,
            difficulty: v.difficulty as string | undefined,
            duration: v.duration as number | undefined,
        }))

        // ─── 2. Fetch child's watch history ───
        const { data: historyRaw } = await supabase
            .from('child_video_history')
            .select('video_id, domain, stage, learning_order')
            .eq('child_id', child_id)
            .order('completed_at', { ascending: true })

        const history: WatchHistoryEntry[] = (historyRaw || []).map((h: Record<string, unknown>) => ({
            video_id: h.video_id as string,
            domain: (h.domain || 'general') as CurriculumDomain,
            stage: (h.stage || 'foundation') as CurriculumStage,
            learning_order: (h.learning_order || 0) as number,
        }))

        // ─── 3. Fetch weak topics ───
        const { data: weakRaw } = await supabase
            .from('activity_results')
            .select('topic')
            .eq('child_id', child_id)
            .eq('status', 'weak')
            .order('priority_score', { ascending: false })
            .limit(10)

        const weakTopics = [...new Set((weakRaw || []).map((r: Record<string, unknown>) => r.topic as string))]

        // ─── 4. Determine next video ───

        // Case A: No current video — first video in journey or domain
        if (!current_video_id) {
            const targetDomain = (domain as CurriculumDomain) || 'numbers'

            // Validate domain is unlocked
            const completionStats = buildCompletionStats(allVideos, history)
            if (!isDomainUnlocked(targetDomain, completionStats)) {
                const lockReason = getLockReason(targetDomain)
                return NextResponse.json({
                    next_video: null,
                    reason: 'domain_locked' as const,
                    lock_reason: lockReason,
                    reinforcement: null,
                    progress: {
                        current_domain: targetDomain,
                        videos_in_domain: allVideos.filter(v => v.domain === targetDomain).length,
                        completed_in_domain: 0,
                        current_topic: '',
                        current_learning_topic: '',
                        stage: 'foundation',
                        percentage: 0,
                    },
                })
            }

            const firstVideo = getFirstVideoForDomain(targetDomain, allVideos, history)

            if (firstVideo) {
                // Record in history
                await recordHistory(supabase, child_id, firstVideo)

                const topic = extractTopicFromVideo(firstVideo)

                return NextResponse.json({
                    next_video: firstVideo,
                    reason: 'first_video',
                    reinforcement: null,
                    progress: {
                        current_domain: firstVideo.domain,
                        videos_in_domain: allVideos.filter(v => v.domain === firstVideo.domain).length,
                        completed_in_domain: history.filter(h => h.domain === firstVideo.domain).length,
                        current_topic: firstVideo.title,
                        current_learning_topic: topic,
                        stage: firstVideo.stage,
                        percentage: 0,
                    },
                })
            }

            return NextResponse.json(
                { error: 'No videos available' },
                { status: 404 }
            )
        }

        // Case B: Have current video — find next using rules
        const currentVideo = allVideos.find(v => v.id === current_video_id)
        if (!currentVideo) {
            return NextResponse.json(
                { error: 'Current video not found' },
                { status: 404 }
            )
        }

        // Record current video as watched
        await recordHistory(supabase, child_id, currentVideo)

        // Run the curriculum engine
        const result = getNextVideo(currentVideo, history, weakTopics, allVideos)

        // ─── VALIDATION GATE: Prevent random domain jumps ───
        if (result.next_video && result.next_video.domain !== currentVideo.domain) {
            if (isRandomJump(currentVideo.domain, result.next_video.domain)) {
                // Engine tried to make an invalid jump — fall back to same domain
                console.warn(`[next-video] Blocked random jump: ${currentVideo.domain} → ${result.next_video.domain}`)
                const safeFallback = allVideos
                    .filter(v => v.domain === currentVideo.domain && !history.some(h => h.video_id === v.id) && v.id !== currentVideo.id)
                    .sort((a, b) => a.learning_order - b.learning_order)[0] || null

                if (safeFallback) {
                    result.next_video = safeFallback
                    result.reason = 'next_in_path'
                }
            }
        }

        // Enrich progress with learning topic
        if (result.next_video) {
            const nextTopic = extractTopicFromVideo(result.next_video)
            result.progress = {
                ...result.progress,
                current_topic: result.next_video.title,
                current_learning_topic: nextTopic,
                stage: result.next_video.stage,
            } as typeof result.progress & { current_learning_topic: string; stage: string }
        }

        return NextResponse.json(result)

    } catch (err) {
        console.error('[next-video] Error:', err)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// ─── Helper: Record video completion in history ────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function recordHistory(
    supabase: any,
    childId: string,
    video: CurriculumVideo
) {
    try {
        const { error } = await supabase
            .from('child_video_history')
            .upsert({
                child_id: childId,
                video_id: video.id,
                domain: video.domain,
                stage: video.stage,
                learning_order: video.learning_order,
                completed_at: new Date().toISOString(),
            }, { onConflict: 'child_id,video_id' })
        if (error) console.error('[next-video] History record error:', error)
    } catch (err) {
        console.error('[next-video] History record exception:', err)
    }
}
