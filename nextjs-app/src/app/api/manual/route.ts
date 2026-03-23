import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { decrypt } from '@/lib/auth-utils';
import { calculateTimes } from '@/lib/time-utils';

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const user = await decrypt(token);

        const body = await req.json();
        const { employee_id, date, check_in, check_out } = body;
        const break_minutes = parseInt(body.break_minutes) || 0;

        if (!employee_id || !date) {
            return NextResponse.json({ error: 'Employee ID and Date are required' }, { status: 400 });
        }
        if (!check_in && !check_out) {
            return NextResponse.json({ error: 'Please submit either a check-in or a check-out time' }, { status: 400 });
        }

        // Employees can only request their own manual time
        if (user.role === 'employee' && employee_id !== user.employee_id) {
            return NextResponse.json({ error: 'Cannot request time for another employee' }, { status: 403 });
        }

        const [existing] = await db.query('SELECT * FROM attendance WHERE employee_id = ? AND date = ?', [employee_id, date]);
        const status = user.role === 'admin' ? 'approved' : 'pending';

        if ((existing as any[]).length > 0) {
            const ex = (existing as any[])[0];
            const finalCheckIn = check_in || ex.check_in;
            const finalCheckOut = check_out || ex.check_out;
            const finalBreak = break_minutes || ex.break_minutes;

            let totalHours = 0, lateMinutes = 0, earlyMinutes = 0, overtimeMinutes = 0, earlyCheckInMinutes = 0;
            if (finalCheckOut) {
                if (finalCheckIn && finalCheckOut < finalCheckIn) return NextResponse.json({ error: 'Check-out time cannot be before check-in time.' }, { status: 400 });
                const [userRows] = await db.query('SELECT shift_start, shift_end FROM users WHERE employee_id = ?', [employee_id]);
                const shiftStart = (userRows as any[])[0]?.shift_start ? (userRows as any[])[0].shift_start.substring(0, 5) : '09:00';
                const shiftEnd = (userRows as any[])[0]?.shift_end ? (userRows as any[])[0].shift_end.substring(0, 5) : '17:00';
                const calc = calculateTimes(finalCheckIn, finalCheckOut, finalBreak, shiftStart, shiftEnd);
                totalHours = calc.totalHours; lateMinutes = calc.lateMinutes; earlyMinutes = calc.earlyMinutes; overtimeMinutes = calc.overtimeMinutes; earlyCheckInMinutes = calc.earlyCheckInMinutes || 0;
            }

            await db.execute(
                `UPDATE attendance SET check_in = ?, check_out = ?, break_minutes = ?, total_hours = ?, late_minutes = ?, early_minutes = ?, overtime_minutes = ?, early_checkin_minutes = ?, status = ? WHERE id = ?`,
                [finalCheckIn, finalCheckOut, finalBreak, totalHours, lateMinutes, earlyMinutes, overtimeMinutes, earlyCheckInMinutes, status, ex.id]
            );
            return NextResponse.json({ success: true, message: status === 'pending' ? 'Manual adjustment requested (pending approval)' : 'Manual time updated successfully' });
        } else {
            let totalHours = 0, lateMinutes = 0, earlyMinutes = 0, overtimeMinutes = 0, earlyCheckInMinutes = 0;
            if (check_out) {
                if (check_in && check_out < check_in) {
                    return NextResponse.json({ error: 'Check-out time cannot be before check-in time.' }, { status: 400 });
                }
                const [userRows] = await db.query('SELECT shift_start, shift_end FROM users WHERE employee_id = ?', [employee_id]);
                const shiftStart = (userRows as any[])[0]?.shift_start ? (userRows as any[])[0].shift_start.substring(0, 5) : '09:00';
                const shiftEnd = (userRows as any[])[0]?.shift_end ? (userRows as any[])[0].shift_end.substring(0, 5) : '17:00';

                const calc = calculateTimes(check_in, check_out, break_minutes, shiftStart, shiftEnd);
                totalHours = calc.totalHours; lateMinutes = calc.lateMinutes; earlyMinutes = calc.earlyMinutes; overtimeMinutes = calc.overtimeMinutes; earlyCheckInMinutes = calc.earlyCheckInMinutes || 0;
            }

            await db.execute(
                `INSERT INTO attendance (employee_id, date, check_in, check_out, break_minutes, 
                                        total_hours, late_minutes, early_minutes, overtime_minutes, early_checkin_minutes, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [employee_id, date, check_in || null, check_out || null, break_minutes, totalHours, lateMinutes, earlyMinutes, overtimeMinutes, earlyCheckInMinutes, status]
            );
            return NextResponse.json({ success: true, message: status === 'pending' ? 'Manual time requested (pending approval)' : 'Manual record added successfully' });
        }
    } catch (e: any) {
        if (e.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ error: 'A record already exists for this employee on this date. Please edit the existing record.' }, { status: 400 });
        }
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
