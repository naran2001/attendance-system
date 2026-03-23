import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const employee_id = body.employee_id;
        const date = body.date || new Date().toISOString().split('T')[0];
        const time = body.check_in || new Date().toTimeString().slice(0, 5); // 'HH:mm'

        if (!employee_id) {
            return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
        }

        const [records] = await db.query('SELECT * FROM attendance WHERE employee_id = ? AND date = ?', [employee_id, date]);
        if ((records as any[]).length > 0) {
            return NextResponse.json({ error: 'Already checked in for today' }, { status: 400 });
        }

        const [userRows] = await db.query('SELECT shift_start FROM users WHERE employee_id = ?', [employee_id]);
        const shiftStart = (userRows as any[])[0]?.shift_start ? (userRows as any[])[0].shift_start.substring(0, 5) : '09:00';
        
        const parseTime = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
        const inMins = parseTime(time);
        const shiftStartMins = parseTime(shiftStart);
        
        const earlyCheckInMinutes = inMins < shiftStartMins ? (shiftStartMins - inMins) : 0;
        const lateMinutes = inMins > shiftStartMins ? (inMins - shiftStartMins) : 0;

        await db.execute(
            'INSERT INTO attendance (employee_id, date, check_in, early_checkin_minutes, late_minutes) VALUES (?, ?, ?, ?, ?)',
            [employee_id, date, time, earlyCheckInMinutes, lateMinutes]
        );

        return NextResponse.json({ success: true, message: 'Checked in successfully' });
    } catch (e: any) {
        if (e.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ error: 'Attendance record already exists for this date.' }, { status: 400 });
        }
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
