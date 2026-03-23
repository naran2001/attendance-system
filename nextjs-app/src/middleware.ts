import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth-utils';

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const isPublicPath = path === '/login';

    const token = request.cookies.get('token')?.value || '';

    let payload: any = null;
    if (token) {
        try {
            payload = await decrypt(token);
        } catch (error) {
            // Invalid token
        }
    }

    if (isPublicPath && payload) {
        return NextResponse.redirect(new URL('/', request.nextUrl));
    }

    if (!isPublicPath && !payload) {
        return NextResponse.redirect(new URL('/login', request.nextUrl));
    }
    
    // Protect Manage Users from standard employees
    if (path.startsWith('/users') && payload?.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.nextUrl));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/',
        '/summary',
        '/users',
        '/login'
    ]
};
