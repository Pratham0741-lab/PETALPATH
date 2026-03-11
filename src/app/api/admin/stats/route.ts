import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll() { },
            },
        }
    )

    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabaseAuth.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
        const [videos, published, children, sessions] = await Promise.all([
            supabaseAdmin.from('videos').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('videos').select('id', { count: 'exact', head: true }).eq('is_published', true),
            supabaseAdmin.from('children').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('sessions').select('id', { count: 'exact', head: true }),
        ])

        return NextResponse.json({
            totalVideos: videos.count || 0,
            publishedVideos: published.count || 0,
            totalChildren: children.count || 0,
            totalSessions: sessions.count || 0,
        })
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to fetch stats' }, { status: 500 })
    }
}
