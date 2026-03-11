import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

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
                        request.cookies.set(name, value)
                        supabaseResponse.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname

    // Public routes
    const publicRoutes = ['/login', '/signup', '/']
    const isPublicRoute = publicRoutes.some(route =>
        path === route || path.startsWith('/login/') || path.startsWith('/signup/')
    )

    // If no user and trying to access protected route
    if (!user && !isPublicRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // If user exists, check role-based access
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = profile?.role

        // Role-based route protection
        if (path.startsWith('/admin') && role !== 'admin') {
            const url = request.nextUrl.clone()
            url.pathname = role === 'parent' ? '/dashboard' : '/child'
            return NextResponse.redirect(url)
        }

        if (path.startsWith('/dashboard') && role !== 'parent' && role !== 'admin') {
            const url = request.nextUrl.clone()
            url.pathname = '/child'
            return NextResponse.redirect(url)
        }

        // Redirect logged-in users away from login pages
        if (isPublicRoute && path !== '/') {
            const url = request.nextUrl.clone()
            if (role === 'admin') url.pathname = '/admin'
            else if (role === 'parent') url.pathname = '/dashboard'
            else url.pathname = '/child'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|mkv)$).*)',
    ],
}
