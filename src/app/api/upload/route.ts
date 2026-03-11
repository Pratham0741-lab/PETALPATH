import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
    const supabase = await createServerSupabase()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const category = formData.get('category') as string || 'language'
    const difficulty = formData.get('difficulty') as string || 'easy'
    const language = formData.get('language') as string || 'en'
    const description = formData.get('description') as string || ''

    if (!file || !title) {
        return NextResponse.json({ error: 'file and title required' }, { status: 400 })
    }

    // Upload to Supabase Storage
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, buffer, {
            contentType: file.type,
            cacheControl: '3600',
        })

    if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName)

    // Insert database record
    const { data, error: dbError } = await supabase
        .from('videos')
        .insert({
            title,
            description,
            category,
            difficulty,
            language,
            video_url: publicUrl,
            is_published: false,
        })
        .select()
        .single()

    if (dbError) {
        return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ video: data })
}
