import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);
    const emp = searchParams.get('emp') || '';
    
    try {
        let query = 'SELECT * FROM attendance WHERE date LIKE ?';
        let params = [`${month}%`];
        
        if (emp) {
            query += ' AND LOWER(employee_id) LIKE LOWER(?)';
            params.push(`%${emp}%`);
        }
        
        query += ' ORDER BY date DESC, employee_id';
        
        const [rows] = await db.query(query, params);
        const records = rows as any[];
        
        let csvContent = 'ID,Employee ID,Date,Check In,Check Out,Break (Mins),Total Hours,Late (Mins),Early (Mins),Overtime (Mins)\n';
        
        for (const r of records) {
            csvContent += `${r.id},${r.employee_id},${r.date},${r.check_in},${r.check_out || ''},${r.break_minutes},${r.total_hours},${r.late_minutes},${r.early_minutes},${r.overtime_minutes}\n`;
        }
        
        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="attendance_report_${month}.csv"`
            }
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
