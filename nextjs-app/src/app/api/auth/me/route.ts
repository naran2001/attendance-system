import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
    const token = req.cookies.get('token')?.value;
    if (!token) {
        return NextResponse.json({ user: null }, { status: 401 });
    }
    try {
        const payload = await decrypt(token);
        return NextResponse.json({ user: payload });
    } catch (e) {
        return NextResponse.json({ user: null }, { status: 401 });
    }
}
