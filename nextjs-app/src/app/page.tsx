'use client';
import { useState, useEffect } from 'react';
import { CheckCircle, Clock, Edit } from 'lucide-react';

export default function Dashboard() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [records, setRecords] = useState<any[]>([]);
    const [empId, setEmpId] = useState('');
    const [breakMins, setBreakMins] = useState(0);
    const [addBreak, setAddBreak] = useState(false);
    const [editRecord, setEditRecord] = useState<any>(null);
    const [message, setMessage] = useState<{type: 'error'|'success', text: string} | null>(null);
    const [user, setUser] = useState<any>(null);

    const formatDuration = (mins: number) => {
        if (!mins) return '';
        const h = Math.floor(mins / 60);
        const m = Math.round(mins % 60);
        if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
        return `${m}m`;
    };

    const formatHrs = (hours: number | string) => {
        if (!hours) return '0m';
        const num = typeof hours === 'string' ? parseFloat(hours) : hours;
        return formatDuration(Math.round(num * 60)) || '0m';
    };

    const loadRecords = async () => {
        try {
            const [res1, res2] = await Promise.all([
                fetch(`/api/records?date=${date}`),
                fetch('/api/auth/me')
            ]);
            const data = await res1.json();
            const authData = await res2.json();

            setRecords(Array.isArray(data) ? data : []);
            
            if (authData.user) {
                setUser(authData.user);
                setEmpId(authData.user.employee_id); // Auto-fill the logged in user's ID
            }
        } catch(e) {
            console.error(e);
        }
    };

    useEffect(() => {
        loadRecords();
    }, [date]);

    const handleCheckIn = async () => {
        if (!empId) return showMessage('Employee ID is required', 'error');
        const res = await fetch('/api/checkin', {
            method: 'POST',
            body: JSON.stringify({ employee_id: empId, date })
        });
        const data = await res.json();
        if (res.ok) {
            showMessage(data.message, 'success');
            setEmpId('');
            loadRecords();
        } else {
            showMessage(data.error, 'error');
        }
    };

    const handleCheckOut = async () => {
        if (!empId) return showMessage('Employee ID is required', 'error');
        const res = await fetch('/api/checkout', {
            method: 'POST',
            body: JSON.stringify({ employee_id: empId, date, break_minutes: addBreak ? breakMins : 0 })
        });
        const data = await res.json();
        if (res.ok) {
            showMessage(data.message, 'success');
            setEmpId('');
            setAddBreak(false);
            setBreakMins(0);
            loadRecords();
        } else {
            showMessage(data.error, 'error');
        }
    };

    const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const payload = {
            id: editRecord.id,
            employee_id: fd.get('employee_id'),
            date: fd.get('date'),
            check_in: fd.get('check_in'),
            check_out: fd.get('check_out') || null,
            break_minutes: parseInt(fd.get('break_minutes') as string) || 0
        };
        const res = await fetch('/api/edit', {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if(res.ok) {
            showMessage(data.message, 'success');
            setEditRecord(null);
            if(payload.date === date) loadRecords();
        } else {
            showMessage(data.error, 'error');
        }
    };

    const handleApprove = async (id: number) => {
        const res = await fetch('/api/approve', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (res.ok) {
            showMessage(data.message, 'success');
            loadRecords();
        } else {
            showMessage(data.error, 'error');
        }
    };

    const showMessage = (text: string, type: 'error'|'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3000);
    };

    return (
        <div className="max-w-6xl mx-auto animation-fade-in text-gray-800">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Attendance Dashboard</h1>
                <input 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </header>

            {message && (
                <div className={`p-4 mb-6 rounded-lg font-medium shadow-sm transition-all ${message.type === 'error' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Clock size={20} className="text-indigo-500" /> Quick Action
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Employee ID</label>
                            <input 
                                type="text"
                                value={empId}
                                onChange={e => setEmpId(e.target.value)}
                                readOnly={user?.role === 'employee'}
                                className={`w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${user?.role === 'employee' ? 'bg-gray-100 cursor-not-allowed select-none text-gray-500' : ''}`}
                                placeholder="e.g. EMP001"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handleCheckIn} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium transition-colors shadow-sm">
                                Check In
                            </button>
                            <button onClick={handleCheckOut} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg font-medium transition-colors shadow-sm">
                                Check Out
                            </button>
                        </div>
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                            <input 
                                type="checkbox" 
                                id="addBreak" 
                                checked={addBreak} 
                                onChange={e => setAddBreak(e.target.checked)}
                                className="rounded text-indigo-500"
                            />
                            <label htmlFor="addBreak" className="text-sm font-medium text-gray-600 cursor-pointer">Add break (mins)</label>
                            {addBreak && (
                                <input 
                                    type="number"
                                    value={breakMins}
                                    onChange={e => setBreakMins(parseInt(e.target.value))}
                                    className="w-20 border border-gray-300 rounded px-2 py-1 text-sm ml-auto"
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <CheckCircle size={20} className="text-emerald-500" /> Today's Records
                        </h3>
                    </div>
                    <div className="overflow-x-auto flex-1 border border-gray-100 rounded-lg">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold">
                                <tr>
                                    <th className="px-4 py-3">Emp ID</th>
                                    <th className="px-4 py-3">In</th>
                                    <th className="px-4 py-3">Out</th>
                                    <th className="px-4 py-3">Break</th>
                                    <th className="px-4 py-3">Total (h)</th>
                                    <th className="px-4 py-3">Late/Early</th>
                                    <th className="px-4 py-3">Overtime</th>
                                    {user?.role === 'admin' && <th className="px-4 py-3 text-right">Action</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {records.length === 0 ? (
                                    <tr>
                                        <td colSpan={user?.role === 'admin' ? 8 : 7} className="px-4 py-8 text-center text-gray-500">No records found for this date.</td>
                                    </tr>
                                ) : (
                                    records.map((r: any) => (
                                        <tr key={r.id} className={`transition-colors ${r.status === 'pending' ? 'bg-amber-50 hover:bg-amber-100' : 'hover:bg-gray-50'}`}>
                                            <td className="px-4 py-3 font-semibold text-gray-900">
                                                {r.employee_id}
                                                {r.status === 'pending' && <span className="ml-2 text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Pending</span>}
                                            </td>
                                            <td className="px-4 py-3 text-indigo-700 font-medium">{r.check_in}</td>
                                            <td className="px-4 py-3 text-emerald-700 font-medium">{r.check_out || '-'}</td>
                                            <td className="px-4 py-3 text-gray-500">{r.break_minutes ? `${r.break_minutes}m` : '0m'}</td>
                                            <td className="px-4 py-3 font-bold text-gray-800">{formatHrs(r.total_hours)}</td>
                                            <td className="px-5 py-4">
                                                {r.late_minutes > 0 && <span className="block text-red-500 font-medium">{formatDuration(r.late_minutes)} late IN</span>}
                                                {r.early_checkin_minutes > 0 && <span className="block text-emerald-500 font-medium">{formatDuration(r.early_checkin_minutes)} early IN</span>}
                                                {r.early_minutes > 0 && <span className="block text-amber-500 font-medium">{formatDuration(r.early_minutes)} early OUT</span>}
                                                {(!r.late_minutes && !r.early_minutes && !r.early_checkin_minutes) && <span className="text-gray-400">-</span>}
                                            </td>
                                            <td className="px-4 py-3 text-emerald-600 font-medium">{r.overtime_minutes > 0 ? formatDuration(r.overtime_minutes) : '-'}</td>
                                            {user?.role === 'admin' && (
                                                <td className="px-4 py-3 text-right">
                                                    {r.status === 'pending' && (
                                                        <button onClick={() => handleApprove(r.id)} className="text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 p-2 rounded transition-colors mr-2" title="Approve Request">
                                                            <CheckCircle size={16} />
                                                        </button>
                                                    )}
                                                    <button onClick={() => setEditRecord(r)} className="text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 p-2 rounded transition-colors" title="Edit">
                                                        <Edit size={16} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {editRecord && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md animation-fade-in relative text-left">
                        <button onClick={() => setEditRecord(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">×</button>
                        <h2 className="text-xl font-bold mb-4">Edit Record</h2>
                        <form onSubmit={handleEditSubmit} className="space-y-4 text-sm text-gray-700">
                            <div>
                                <label className="block font-medium mb-1">Employee ID*</label>
                                <input name="employee_id" required defaultValue={editRecord.employee_id} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Date*</label>
                                <input type="date" name="date" required defaultValue={editRecord.date} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Check In Time*</label>
                                <input type="time" name="check_in" required defaultValue={editRecord.check_in} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Check Out Time</label>
                                <input type="time" name="check_out" defaultValue={editRecord.check_out || ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Break Time (Mins)</label>
                                <input type="number" name="break_minutes" defaultValue={editRecord.break_minutes || 0} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium mt-2 transition-colors">Update Record</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
