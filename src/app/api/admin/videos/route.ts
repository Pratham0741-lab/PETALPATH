import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET() {
    try {
        const supabase = createServiceClient()

        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({ videos: data || [] })
    } catch (err: unknown) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Failed to fetch videos' },
            { status: 500 }
        )
    }
}

export async function PATCH(request: Request) {
    try {
        const supabase = createServiceClient()
        const { id, is_published } = await request.json()

        const { error } = await supabase
            .from('videos')
            .update({ is_published })
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (err: unknown) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Failed to update video' },
            { status: 500 }
        )
    }
}
