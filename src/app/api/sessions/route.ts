import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
    const supabase = await createServerSupabase()
    const childId = request.nextUrl.searchParams.get('child_id')

    if (!childId) {
        return NextResponse.json({ error: 'child_id required' }, { status: 400 })
    }

    const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('child_id', childId)
        .order('created_at', { ascending: false })
        .limit(20)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ sessions: data })
}

export async function POST(request: NextRequest) {
    const supabase = await createServerSupabase()
    const body = await request.json()

    const { child_id, activities, total_duration } = body

    if (!child_id) {
        return NextResponse.json({ error: 'child_id required' }, { status: 400 })
    }

    const { data, error } = await supabase
        .from('sessions')
        .insert({
            child_id,
            activities: activities || [],
            total_duration: total_duration || 0,
            completion_rate: 0,
        })
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ session: data })
}
