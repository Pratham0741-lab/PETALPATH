import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServiceClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabase()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user || user.user_metadata?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const adminSupabase = createServiceClient()
        
        const body = await request.json()
        const { action } = body

        if (action === 'getSignedUrl') {
            const { fileName } = body
            const { data, error } = await adminSupabase.storage
                .from('videos')
                .createSignedUploadUrl(fileName)
                
            if (error) throw error
            return NextResponse.json(data)
        }

        if (action === 'insertVideo') {
            const { title, description, category, difficulty, language, path, isShort } = body
            const { data: { publicUrl } } = adminSupabase.storage.from('videos').getPublicUrl(path)
            
            const topics = isShort ? ['short'] : []
            const { data, error } = await adminSupabase.from('videos').insert({
                title, 
                description, 
                category, 
                difficulty, 
                language,
                video_url: publicUrl,
                is_published: false,
                created_by: user.id,
                topics
            }).select().single()

            if (error) throw error
            return NextResponse.json({ video: data })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
