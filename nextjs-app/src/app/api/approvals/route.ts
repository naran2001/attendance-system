import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { decrypt } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const user = await decrypt(token);
        if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const [records] = await db.query("SELECT id, employee_id, DATE_FORMAT(date, '%Y-%m-%d') as date, check_in, check_out, break_minutes, total_hours, late_minutes, early_checkin_minutes, early_minutes, overtime_minutes, status FROM attendance WHERE status = 'pending' ORDER BY date DESC, id DESC");
        return NextResponse.json(records);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
