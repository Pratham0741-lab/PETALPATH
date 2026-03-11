import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { calculateEngagementProfile, recommendDifficulty, reorderContent } from '@/lib/adaptive-engine'
import type { AdaptiveLearningSignal, Video } from '@/lib/types'

export async function GET(request: NextRequest) {
    const supabase = await createServerSupabase()
    const childId = request.nextUrl.searchParams.get('child_id')

    if (!childId) {
        return NextResponse.json({ error: 'child_id required' }, { status: 400 })
    }

    // Fetch learning signals
    const { data: signals } = await supabase
        .from('adaptive_learning_signals')
        .select('*')
        .eq('child_id', childId)
        .order('timestamp', { ascending: false })
        .limit(50)

    // Fetch available videos
    const { data: videos } = await supabase
        .from('videos')
        .select('*')
        .eq('is_published', true)

    // Fetch viewed video IDs
    const { data: discovery } = await supabase
        .from('discovery_views')
        .select('video_id')
        .eq('child_id', childId)

    const typedSignals = (signals || []) as AdaptiveLearningSignal[]
    const typedVideos = (videos || []) as Video[]
    const viewedIds = (discovery || []).map((d: { video_id: string }) => d.video_id)

    // Calculate recommendations
    const profile = calculateEngagementProfile(typedSignals)
    const difficulty = recommendDifficulty(typedSignals)
    const recommended = reorderContent(typedVideos, profile, viewedIds)

    return NextResponse.json({
        profile,
        recommendedDifficulty: difficulty,
        recommendedVideos: recommended.slice(0, 10),
        totalAvailable: typedVideos.length,
    })
}
