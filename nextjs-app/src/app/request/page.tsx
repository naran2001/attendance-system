'use client';
import { useState, useEffect } from 'react';
import { CheckCircle, Clock } from 'lucide-react';

export default function RequestTimePage() {
    const [message, setMessage] = useState<{type:'error'|'success', text:string}|null>(null);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [allUsers, setAllUsers] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/auth/me').then(r => r.json()).then(d => { 
            if(d.user) {
                setUser(d.user); 
                if (d.user.role === 'admin') {
                    fetch('/api/users').then(r => r.json()).then(users => setAllUsers(users));
                }
            }
        });
    }, []);

    if (!user) return <div className="p-12 text-center font-bold text-gray-500 animation-pulse">Loading Identity Data Map...</div>;

    const showMessage = (text: string, type: 'error'|'success') => {
        setMessage({text, type});
        setTimeout(() => setMessage(null), 4000);
    };

    const handleManualSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const fd = new FormData(e.currentTarget);
        const res = await fetch('/api/manual', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                employee_id: fd.get('emp_id'),
                date: fd.get('date'),
                check_in: fd.get('check_in') || null,
                check_out: fd.get('check_out') || null,
                break_minutes: fd.get('break_mins') || 0
            })
        });
        const data = await res.json();
        setLoading(false);
        if (res.ok) {
            showMessage(data.message, 'success');
            const target = e.target as HTMLFormElement;
            target.reset();
            // Reseed default values that get blown away by reset
            const dateInput = target.elements.namedItem('date') as HTMLInputElement;
            if(dateInput) dateInput.value = new Date().toISOString().split('T')[0];
            const empInput = target.elements.namedItem('emp_id') as HTMLInputElement;
            if(empInput && user?.role === 'employee') empInput.value = user.employee_id;
        } else {
            showMessage(data.error, 'error');
        }
    };

    return (
        <div className="max-w-3xl mx-auto animation-fade-in text-gray-800">
            <header className="flex justify-between items-center mb-8 border-b pb-4 border-gray-200">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Clock className="text-indigo-600" size={32} /> {user?.role === 'admin' ? 'Add Manual Time Record' : 'Request Manual Time'}
                </h1>
            </header>
            
            <p className="mb-6 text-gray-600 bg-indigo-50 p-4 border border-indigo-100 rounded-lg shadow-sm font-medium">
                {user?.role === 'admin' 
                    ? 'Use this form to forcibly overwrite or initialize a missed time event for an employee.'
                    : 'Submit an overwrite request if you missed checking in or out of your shift. You can submit partial records (e.g., just a Check-Out time). Once requested, an Administrator will review your submission before it applies to your Official Record.'
                }
            </p>

            {message && (
                <div className={`p-4 mb-6 rounded-lg font-medium shadow-sm transition-all ${message.type === 'error' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <form onSubmit={handleManualSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Employee ID*</label>
                            {user?.role === 'admin' ? (
                                <>
                                    <input name="emp_id" list="emp-list" required className={`w-full border border-gray-300 focus:ring-2 focus:ring-indigo-500 rounded-lg px-4 py-2.5 outline-none transition-shadow`} placeholder="Search by EMP..." />
                                    <datalist id="emp-list">
                                        {allUsers.map((u:any) => <option key={u.employee_id} value={u.employee_id}>{u.name}</option>)}
                                    </datalist>
                                </>
                            ) : (
                                <input name="emp_id" required defaultValue={user.employee_id} readOnly className={`w-full border border-gray-300 focus:ring-2 focus:ring-indigo-500 rounded-lg px-4 py-2.5 outline-none transition-shadow bg-gray-100 cursor-not-allowed text-gray-500 font-bold`} placeholder="e.g. EMP001" />
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Date*</label>
                            <input type="date" required name="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full border border-gray-300 focus:ring-2 focus:ring-indigo-500 rounded-lg px-4 py-2.5 outline-none transition-shadow" />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100/50">
                            <label className="block text-sm font-bold text-indigo-900 mb-2">Check In Time</label>
                            <input type="time" name="check_in" className="w-full border border-gray-300 focus:ring-2 focus:ring-indigo-500 rounded-lg px-4 py-2.5 outline-none transition-shadow" />
                            <p className="text-xs text-indigo-500 mt-2">Leave empty if you already have a morning Check In marked.</p>
                        </div>
                        <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100/50">
                            <label className="block text-sm font-bold text-emerald-900 mb-2">Check Out Time</label>
                            <input type="time" name="check_out" className="w-full border border-gray-300 focus:ring-2 focus:ring-emerald-500 rounded-lg px-4 py-2.5 outline-none transition-shadow" />
                            <p className="text-xs text-emerald-600 mt-2">Leave empty if you only missed checking in so far.</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Break Time (Minutes)</label>
                        <input type="number" defaultValue="0" name="break_mins" className="w-full max-w-xs border border-gray-300 focus:ring-2 focus:ring-indigo-500 rounded-lg px-4 py-2.5 outline-none transition-shadow" />
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <button type="submit" disabled={loading} className="disabled:opacity-50 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-lg">
                            <CheckCircle size={20} /> {loading ? 'Submitting...' : (user?.role === 'admin' ? 'Save Record' : 'Submit Request Event')} 
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
