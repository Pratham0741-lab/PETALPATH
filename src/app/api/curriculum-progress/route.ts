import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DOMAIN_PROGRESSION, DOMAIN_META, isDomainUnlocked, type CurriculumVideo, type WatchHistoryEntry } from '@/lib/curriculum-engine'
import type { CurriculumDomain, CurriculumStage } from '@/lib/types'

/**
 * GET /api/curriculum-progress?child_id=...
 *
 * Returns per-domain progress for the Explore Map UI.
 * Shows total videos, completed count, unlock status, and positions.
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const childId = request.nextUrl.searchParams.get('child_id')
        if (!childId) {
            return NextResponse.json(
                { error: 'child_id required' },
                { status: 400 }
            )
        }

        // ─── 1. Fetch all published videos with curriculum data ───
        const { data: allVideosRaw, error: videosErr } = await supabase
            .from('videos')
            .select('id, title, domain, stage, learning_order, tags:topics')
            .eq('is_published', true)
            .not('domain', 'is', null)

        if (videosErr) {
            return NextResponse.json(
                { error: 'Failed to fetch videos' },
                { status: 500 }
            )
        }

        const allVideos: CurriculumVideo[] = (allVideosRaw || []).map((v: Record<string, unknown>) => ({
            id: v.id as string,
            title: v.title as string,
            domain: (v.domain || 'general') as CurriculumDomain,
            stage: (v.stage || 'foundation') as CurriculumStage,
            learning_order: (v.learning_order || 0) as number,
            tags: (v.tags || []) as string[],
        }))

        // ─── 2. Fetch child's watch history ───
        const { data: historyRaw } = await supabase
            .from('child_video_history')
            .select('video_id, domain, stage, learning_order')
            .eq('child_id', childId)

        const history: WatchHistoryEntry[] = (historyRaw || []).map((h: Record<string, unknown>) => ({
            video_id: h.video_id as string,
            domain: (h.domain || 'general') as CurriculumDomain,
            stage: (h.stage || 'foundation') as CurriculumStage,
            learning_order: (h.learning_order || 0) as number,
        }))

        // ─── 3. Build per-domain progress ───
        const domains = DOMAIN_PROGRESSION.map(rule => {
            const domainVideos = allVideos.filter(v => v.domain === rule.domain)
            const domainCompleted = history.filter(h => h.domain === rule.domain)
            const total = domainVideos.length
            const completed = domainCompleted.length
            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
            const unlocked = isDomainUnlocked(rule.domain, allVideos, history)

            // Find current position (next unwatched video)
            const completedIds = new Set(domainCompleted.map(h => h.video_id))
            const nextVideo = domainVideos
                .filter(v => !completedIds.has(v.id))
                .sort((a, b) => a.learning_order - b.learning_order)[0]

            const meta = DOMAIN_META[rule.domain] || { title: rule.domain, icon: '📚', color: '#94A3B8', emoji: '📖' }

            return {
                domain: rule.domain,
                stage: rule.stage,
                title: meta.title,
                icon: meta.icon,
                color: meta.color,
                emoji: meta.emoji,
                total,
                completed,
                percentage,
                unlocked,
                next_video_title: nextVideo?.title || null,
                next_video_id: nextVideo?.id || null,
                prerequisite: rule.prerequisite ? {
                    domain: rule.prerequisite.domain,
                    title: DOMAIN_META[rule.prerequisite.domain]?.title || rule.prerequisite.domain,
                    min_percent: rule.prerequisite.minCompletionPercent,
                } : null,
            }
        })

        // ─── 4. Overall stats ───
        const totalVideos = allVideos.filter(v =>
            DOMAIN_PROGRESSION.some(r => r.domain === v.domain)
        ).length
        const totalCompleted = history.filter(h =>
            DOMAIN_PROGRESSION.some(r => r.domain === h.domain)
        ).length

        return NextResponse.json({
            domains,
            overall: {
                total_videos: totalVideos,
                total_completed: totalCompleted,
                percentage: totalVideos > 0 ? Math.round((totalCompleted / totalVideos) * 100) : 0,
            },
        })

    } catch (err) {
        console.error('[curriculum-progress] Error:', err)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
