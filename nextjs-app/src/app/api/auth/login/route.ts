import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { encrypt } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
    try {
        const { employee_id, password } = await req.json();

        if (!employee_id || !password) {
            return NextResponse.json({ error: 'Employee ID and Password are required' }, { status: 400 });
        }

        const [rows] = await db.query('SELECT * FROM users WHERE employee_id = ?', [employee_id]);
        const users = rows as any[];
        
        if (users.length === 0) {
            return NextResponse.json({ error: 'Account does not exist. Please contact Admin.' }, { status: 404 });
        }

        const user = users[0];
        
        if (user.password !== password) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const token = await encrypt({ employee_id: user.employee_id, role: user.role });
        
        const response = NextResponse.json({ success: true, message: 'Logged in successfully', role: user.role });
        response.cookies.set('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 86400, path: '/' });
        return response;

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
