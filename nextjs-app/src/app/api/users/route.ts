import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { decrypt } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const user = await decrypt(token);
        if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const [rows] = await db.query('SELECT id, employee_id, role FROM users ORDER BY id DESC');
        return NextResponse.json(rows);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const user = await decrypt(token);
        if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await req.json();
        const { employee_id, password, role } = body;
        
        if (!employee_id || !password) {
            return NextResponse.json({ error: 'Employee ID and Password are required' }, { status: 400 });
        }

        await db.execute('INSERT INTO users (employee_id, password, role) VALUES (?, ?, ?)', [employee_id, password, role || 'employee']);
        return NextResponse.json({ success: true, message: 'User created successfully' });
    } catch (e: any) {
        if (e.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ error: 'User already exists.' }, { status: 400 });
        }
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const token = req.cookies.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const user = await decrypt(token);
        if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await req.json();
        const { id, employee_id, password, role } = body;
        
        if (!id || !employee_id) return NextResponse.json({ error: 'ID and Employee ID required' }, { status: 400 });

        if (password) {
            await db.execute('UPDATE users SET employee_id = ?, password = ?, role = ? WHERE id = ?', [employee_id, password, role, id]);
        } else {
            await db.execute('UPDATE users SET employee_id = ?, role = ? WHERE id = ?', [employee_id, role, id]);
        }
        return NextResponse.json({ success: true, message: 'User updated successfully' });
    } catch (e: any) {
        if (e.code === 'ER_DUP_ENTRY') return NextResponse.json({ error: 'That Employee ID is already taken.' }, { status: 400 });
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    try {
        const token = req.cookies.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const user = await decrypt(token);
        if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await db.execute('DELETE FROM users WHERE id = ?', [id]);
        return NextResponse.json({ success: true, message: 'User deleted successfully' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
