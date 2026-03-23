import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { calculateTimes } from '@/lib/time-utils';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, employee_id, date, check_in, check_out, break_minutes } = body;

        if (!id || !date || !check_in || !employee_id) {
            return NextResponse.json({ error: 'ID, Employee ID, Date, and Check In are required' }, { status: 400 });
        }

        let totalHours = 0, lateMinutes = 0, earlyMinutes = 0, overtimeMinutes = 0, earlyCheckInMinutes = 0;

        if (check_out) {
            if (check_out < check_in) {
                return NextResponse.json({ error: 'Check-out time cannot be before check-in time.' }, { status: 400 });
            }
            
            const [userRows] = await db.query('SELECT shift_start, shift_end FROM users WHERE employee_id = ?', [employee_id]);
            const shiftStart = (userRows as any[])[0]?.shift_start ? (userRows as any[])[0].shift_start.substring(0, 5) : '09:00';
            const shiftEnd = (userRows as any[])[0]?.shift_end ? (userRows as any[])[0].shift_end.substring(0, 5) : '17:00';

            const calc = calculateTimes(check_in, check_out, break_minutes, shiftStart, shiftEnd);
            totalHours = calc.totalHours;
            lateMinutes = calc.lateMinutes;
            earlyMinutes = calc.earlyMinutes;
            overtimeMinutes = calc.overtimeMinutes;
            earlyCheckInMinutes = calc.earlyCheckInMinutes || 0;
        }

        await db.execute(`
            UPDATE attendance 
            SET employee_id = ?, date = ?, check_in = ?, check_out = ?, break_minutes = ?, total_hours = ?, late_minutes = ?, early_minutes = ?, overtime_minutes = ?, early_checkin_minutes = ?
            WHERE id = ?
        `, [employee_id, date, check_in, check_out || null, break_minutes || 0, totalHours, lateMinutes, earlyMinutes, overtimeMinutes, earlyCheckInMinutes, id]);

        return NextResponse.json({ message: 'Record updated successfully' });
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ error: 'An attendance record for this Employee ID and Date already exists.' }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
