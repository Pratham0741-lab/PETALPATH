import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/learning-path
 * 
 * Returns all published learning paths ordered by curriculum sequence.
 * Uses service role to bypass RLS — this is a server-side route,
 * no user credentials are leaked to the client.
 */
export async function GET() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data, error } = await supabase
            .from('learning_paths')
            .select('id, title, description, order_index, age_group, thumbnail_url')
            .eq('is_published', true)
            .order('order_index', { ascending: true })

        if (error) {
            console.error('[learning-path] Supabase error:', error.message)
            return NextResponse.json(
                { error: 'Failed to fetch learning paths' },
                { status: 500 }
            )
        }

        // Shape response — keep it minimal for the Explore Map UI
        const paths = (data || []).map((path) => ({
            id: path.id,
            title: path.title,
            description: path.description,
            order: path.order_index,
            age_group: path.age_group,
            thumbnail_url: path.thumbnail_url,
        }))

        return NextResponse.json({ paths, total: paths.length })

    } catch (err) {
        console.error('[learning-path] Unexpected error:', err)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
