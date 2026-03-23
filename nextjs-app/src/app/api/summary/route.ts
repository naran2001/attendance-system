import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { decrypt } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const month = url.searchParams.get('month');
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');
    
    try {
        const token = req.cookies.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const user = await decrypt(token);

        let query = "SELECT id, employee_id, DATE_FORMAT(date, '%Y-%m-%d') as date, check_in, check_out, break_minutes, total_hours, late_minutes, early_checkin_minutes, early_minutes, overtime_minutes, status FROM attendance";
        let params: any[] = [];
        let conditions = ["status = 'approved'"];

        if (start && end) {
            conditions.push("date >= ? AND date <= ?");
            params.push(start, end);
        } else if (month) {
            conditions.push("date LIKE ?");
            params.push(`${month}%`);
        }

        if (user.role === 'employee') {
            conditions.push("employee_id = ?");
            params.push(user.employee_id);
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY date ASC, employee_id ASC";

        const [records] = await db.query(query, params);
        return NextResponse.json(records);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
