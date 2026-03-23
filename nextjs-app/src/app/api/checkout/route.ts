import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { calculateTimes } from '@/lib/time-utils';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const employee_id = body.employee_id;
        const date = body.date || new Date().toISOString().split('T')[0];
        const check_out = body.check_out || new Date().toTimeString().slice(0, 5);
        const break_minutes = parseInt(body.break_minutes) || 0;

        if (!employee_id) {
            return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
        }

        const [rows] = await db.query('SELECT * FROM attendance WHERE employee_id = ? AND date = ?', [employee_id, date]);
        const record = (rows as any[])[0];

        if (!record) {
            return NextResponse.json({ error: 'No check-in record found for this day.' }, { status: 404 });
        }

        const check_in = record.check_in;
        if (check_out < check_in) {
            return NextResponse.json({ error: 'Check-out time cannot be before check-in time.' }, { status: 400 });
        }

        const [userRows] = await db.query('SELECT shift_start, shift_end FROM users WHERE employee_id = ?', [employee_id]);
        const shiftStart = (userRows as any[])[0]?.shift_start ? (userRows as any[])[0].shift_start.substring(0, 5) : '09:00';
        const shiftEnd = (userRows as any[])[0]?.shift_end ? (userRows as any[])[0].shift_end.substring(0, 5) : '17:00';

        const { totalHours, lateMinutes, earlyMinutes, overtimeMinutes, earlyCheckInMinutes } = calculateTimes(record.check_in, check_out, break_minutes, shiftStart, shiftEnd);

        await db.execute(`
            UPDATE attendance 
            SET check_out = ?, break_minutes = ?, total_hours = ?, 
                late_minutes = ?, early_minutes = ?, overtime_minutes = ?, early_checkin_minutes = ?
            WHERE employee_id = ? AND date = ?
        `, [check_out, break_minutes, totalHours, lateMinutes, earlyMinutes, overtimeMinutes, earlyCheckInMinutes, employee_id, date]);

        return NextResponse.json({ success: true, message: 'Checked out successfully' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
