import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
    const supabase = await createServerSupabase()
    const childId = request.nextUrl.searchParams.get('child_id')

    if (!childId) {
        return NextResponse.json({ error: 'child_id required' }, { status: 400 })
    }

    const { data, error } = await supabase
        .from('progress')
        .select('*')
        .eq('child_id', childId)
        .order('timestamp', { ascending: false })
        .limit(100)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ progress: data })
}

export async function POST(request: NextRequest) {
    const supabase = await createServerSupabase()
    const body = await request.json()

    const { child_id, session_id, activity_type, performance_score, engagement_time, completed, metadata } = body

    if (!child_id || !activity_type) {
        return NextResponse.json({ error: 'child_id and activity_type required' }, { status: 400 })
    }

    // Insert progress record
    const { data, error } = await supabase
        .from('progress')
        .insert({
            child_id,
            session_id,
            activity_type,
            performance_score: performance_score || 0,
            engagement_time: engagement_time || 0,
            completed: completed || false,
            metadata: metadata || {},
        })
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Also record adaptive learning signal
    await supabase.from('adaptive_learning_signals').insert({
        child_id,
        activity_type,
        accuracy: performance_score || 0,
        engagement_score: Math.min(100, (engagement_time || 0) / 3),
        video_completion: activity_type === 'video' ? (performance_score || 0) : 0,
        difficulty: 'easy',
    })

    return NextResponse.json({ progress: data })
}

export async function DELETE(request: NextRequest) {
    const supabase = await createServerSupabase()
    const childId = request.nextUrl.searchParams.get('child_id')

    if (!childId) {
        return NextResponse.json({ error: 'child_id required' }, { status: 400 })
    }

    // Reset tracking tables
    const { error: progErr } = await supabase.from('progress').delete().eq('child_id', childId)
    const { error: sigErr } = await supabase.from('adaptive_learning_signals').delete().eq('child_id', childId)
    const { error: histErr } = await supabase.from('child_video_history').delete().eq('child_id', childId)

    if (progErr || sigErr || histErr) {
        return NextResponse.json({ error: 'Failed to reset progress' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
