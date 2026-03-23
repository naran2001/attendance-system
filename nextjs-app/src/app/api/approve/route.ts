import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { decrypt } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const user = await decrypt(token);
        if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await req.json();
        const { id } = body;
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await db.execute("UPDATE attendance SET status = 'approved' WHERE id = ?", [id]);
        return NextResponse.json({ success: true, message: 'Record approved successfully' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const token = req.cookies.get('jwt')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const user = await decrypt(token);
        if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await req.json();
        await db.execute("DELETE FROM attendance WHERE id = ? AND status = 'pending'", [body.id]);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
