import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { decrypt } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    try {
        const token = req.cookies.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const user = await decrypt(token);

        let query = "SELECT id, employee_id, DATE_FORMAT(date, '%Y-%m-%d') as date, check_in, check_out, break_minutes, total_hours, late_minutes, early_checkin_minutes, early_minutes, overtime_minutes, status FROM attendance WHERE date = ?";
        let params: any[] = [date];

        if (user.role === 'employee') {
            query += ' AND employee_id = ?';
            params.push(user.employee_id);
        }

        query += ' ORDER BY employee_id';

        const [records] = await db.query(query, params);
        return NextResponse.json(records);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
