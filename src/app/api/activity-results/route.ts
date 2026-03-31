import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

/**
 * POST /api/activity-results
 * Save per-topic activity results with weighted scoring.
 */
export async function POST(request: NextRequest) {
    const supabase = createServiceClient()
    const body = await request.json()

    const {
        child_id,
        video_id,
        topic,
        speech_score,
        camera_score,
        speech_attempts,
        camera_attempts,
        status,
        decision,
    } = body

    if (!child_id || !topic) {
        return NextResponse.json(
            { error: 'child_id and topic are required' },
            { status: 400 }
        )
    }

    // Compute weighted scores server-side
    const final_score = (speech_score || 0) * 0.6 + (camera_score || 0) * 0.4
    const priority_score = Math.max(0, Math.min(1, 1 - final_score))

    const { data, error } = await supabase
        .from('activity_results')
        .insert({
            child_id,
            video_id: video_id || null,
            topic,
            speech_score: speech_score || 0,
            camera_score: camera_score || 0,
            final_score,
            priority_score,
            speech_attempts: speech_attempts || 0,
            camera_attempts: camera_attempts || 0,
            status: status || 'pending',
            decision: decision || null,
        })
        .select()
        .single()

    if (error) {
        console.error('Failed to save activity result:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ result: data })
}

/**
 * GET /api/activity-results?child_id=...
 * Fetch weak topics for a child, ordered by priority_score descending.
 * Used by the activity generator to prioritize weak topics.
 */
export async function GET(request: NextRequest) {
    const supabase = createServiceClient()
    const childId = request.nextUrl.searchParams.get('child_id')
    const status = request.nextUrl.searchParams.get('status') || 'weak'

    if (!childId) {
        return NextResponse.json(
            { error: 'child_id required' },
            { status: 400 }
        )
    }

    const { data, error } = await supabase
        .from('activity_results')
        .select('*')
        .eq('child_id', childId)
        .eq('status', status)
        .order('priority_score', { ascending: false })
        .limit(50)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Extract unique weak topic names
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const weakTopics = [...new Set((data || []).map((r: any) => r.topic as string))]

    return NextResponse.json({ results: data, weakTopics })
}
