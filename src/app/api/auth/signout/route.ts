import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const response = NextResponse.redirect(new URL('/login', request.url), {
        status: 302,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    await supabase.auth.signOut()

    // Nuke all Supabase auth cookies so middleware can't resurrect the session
    request.cookies.getAll().forEach((cookie) => {
        if (cookie.name.startsWith('sb-')) {
            response.cookies.set(cookie.name, '', {
                expires: new Date(0),
                path: '/',
            })
        }
    })

    return response
}
