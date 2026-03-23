'use client';
import { useState, useEffect } from 'react';
import { ListTodo, CheckCircle, Trash2 } from 'lucide-react';

export default function ApprovalsPage() {
    const [records, setRecords] = useState<any[]>([]);
    const [message, setMessage] = useState<{type:'success'|'error', text:string}|null>(null);

    const loadRecords = async () => {
        try {
            const res = await fetch('/api/approvals');
            const data = await res.json();
            setRecords(Array.isArray(data) ? data : []);
        } catch(e) {
            console.error(e);
        }
    };

    useEffect(() => { loadRecords(); }, []);

    const showMessage = (text: string, type: 'error'|'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleApprove = async (id: number) => {
        const res = await fetch('/api/approve', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id })
        });
        if (res.ok) {
            showMessage('Request approved', 'success');
            loadRecords();
        } else {
            const data = await res.json();
            showMessage(data.error, 'error');
        }
    };

    const handleReject = async (id: number) => {
        if (!confirm('Reject this request? This will delete the manual entry.')) return;
        const res = await fetch('/api/approve', {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id })
        });
        if (res.ok) {
            showMessage('Request rejected', 'success');
            loadRecords();
        } else {
            const data = await res.json();
            showMessage(data.error, 'error');
        }
    };

    return (
        <div className="max-w-6xl mx-auto animation-fade-in text-gray-800">
            <header className="flex justify-between items-center mb-8 border-b pb-4 border-gray-200">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <ListTodo className="text-amber-500" size={32} /> Pending Approvals
                </h1>
            </header>

            {message && (
                <div className={`p-4 mb-6 rounded-lg font-medium shadow-sm transition-all ${message.type === 'error' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4 border-b border-gray-100">Employee ID</th>
                                <th className="px-6 py-4 border-b border-gray-100">Date</th>
                                <th className="px-6 py-4 border-b border-gray-100">Check In</th>
                                <th className="px-6 py-4 border-b border-gray-100">Check Out</th>
                                <th className="px-6 py-4 border-b border-gray-100">Break</th>
                                <th className="px-6 py-4 border-b border-gray-100 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-base">
                            {records.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">All caught up! No pending manual requests.</td>
                                </tr>
                            ) : (
                                records.map((r: any) => (
                                    <tr key={r.id} className="bg-amber-50 hover:bg-amber-100 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900">{r.employee_id}</td>
                                        <td className="px-6 py-4 font-medium">{r.date}</td>
                                        <td className="px-6 py-4 text-indigo-700 font-medium">{r.check_in}</td>
                                        <td className="px-6 py-4 text-emerald-700 font-medium">{r.check_out || '-'}</td>
                                        <td className="px-6 py-4 text-gray-500">{r.break_minutes ? `${r.break_minutes}m` : '0m'}</td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <button onClick={() => handleApprove(r.id)} className="text-emerald-600 hover:text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded transition-colors font-bold flex items-center gap-2 shadow-sm" title="Approve Request">
                                                <CheckCircle size={18} /> Approve
                                            </button>
                                            <button onClick={() => handleReject(r.id)} className="text-red-600 hover:text-red-800 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded transition-colors font-bold flex items-center gap-2 shadow-sm" title="Reject Request">
                                                <Trash2 size={18} /> Reject
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
