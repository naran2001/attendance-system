'use client';
import { useState, useEffect } from 'react';
import { FileSpreadsheet, Calendar, Edit } from 'lucide-react';
import { CalendarDays } from 'lucide-react'; // Added CalendarDays import

export default function SummaryPage() {
    const [filterType, setFilterType] = useState<'month'|'week'>('month');
    const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));
    const [weekFilter, setWeekFilter] = useState('');
    const [summary, setSummary] = useState<any[]>([]);
    const [empFilter, setEmpFilter] = useState('');
    const [editRecord, setEditRecord] = useState<any>(null);
    const [user, setUser] = useState<any>(null);

    const formatMins = (mins: number) => {
        if (!mins) return '-';
        const h = Math.floor(mins / 60);
        const m = Math.round(mins % 60);
        if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
        return `${m}m`;
    };

    const formatHrs = (hours: number | string) => {
        if (!hours) return '0m';
        const num = typeof hours === 'string' ? parseFloat(hours) : hours;
        const mins = Math.round(num * 60);
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
        return `${m}m`;
    };

    // Effect to load user data once
    useEffect(() => {
        const loadUser = async () => {
            try {
                const res = await fetch('/api/auth/me');
                const authData = await res.json();
                if (authData.user) setUser(authData.user);
            } catch (e) {
                console.error("Failed to load user:", e);
            }
        };
        loadUser();
    }, []);

    // Effect to load summary data based on filters
    useEffect(() => {
        if (!user) return; // Only fetch summary if user data is loaded
        fetchSummary();
    }, [user, monthFilter, filterType, weekFilter]);

    const fetchSummary = async () => {
        try {
            let url = `/api/summary`;
            if (filterType === 'month') {
                url += `?month=${monthFilter}`;
            } else if (filterType === 'week' && weekFilter) {
                const [yearStr, weekStr] = weekFilter.split('-W');
                const year = parseInt(yearStr);
                const week = parseInt(weekStr);
                
                // Calculate start and end dates for the week
                const jan1 = new Date(year, 0, 1);
                // Get the day of the week for Jan 1 (0 for Sunday, 1 for Monday, etc.)
                // Adjust to make Monday the first day of the week (ISO 8601)
                const jan1Day = (jan1.getDay() === 0) ? 6 : jan1.getDay() - 1; 
                
                // Calculate the date of the first Monday of the year
                const firstMonday = new Date(year, 0, 1 + (jan1Day <= 3 ? 1 - jan1Day : 8 - jan1Day));

                // Calculate the start of the target week
                const startOfWeek = new Date(firstMonday);
                startOfWeek.setDate(firstMonday.getDate() + (week - 1) * 7);

                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(endOfWeek.getDate() + 6);

                url += `?start=${startOfWeek.toISOString().split('T')[0]}&end=${endOfWeek.toISOString().split('T')[0]}`;
            } else {
                // Default to month filter if week filter is not set or type is month
                url += `?month=${monthFilter}`;
            }

            const res = await fetch(url);
            const data = await res.json();
            setSummary(Array.isArray(data) ? data : []);
        } catch(e) {
            console.error(e);
        }
    };

    const handleExport = () => {
        let exportUrl = `/api/export`;
        if (filterType === 'month') {
            exportUrl += `?month=${monthFilter}`;
        } else if (filterType === 'week' && weekFilter) {
            const [yearStr, weekStr] = weekFilter.split('-W');
            const year = parseInt(yearStr);
            const week = parseInt(weekStr);
            
            const jan1 = new Date(year, 0, 1);
            const jan1Day = (jan1.getDay() === 0) ? 6 : jan1.getDay() - 1; 
            const firstMonday = new Date(year, 0, 1 + (jan1Day <= 3 ? 1 - jan1Day : 8 - jan1Day));
            const startOfWeek = new Date(firstMonday);
            startOfWeek.setDate(firstMonday.getDate() + (week - 1) * 7);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);

            exportUrl += `?start=${startOfWeek.toISOString().split('T')[0]}&end=${endOfWeek.toISOString().split('T')[0]}`;
        } else {
            exportUrl += `?month=${monthFilter}`;
        }
        exportUrl += `&emp=${encodeURIComponent(empFilter)}`;
        window.location.href = exportUrl;
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
        if(res.ok) {
            setEditRecord(null);
            fetchSummary(); // Call fetchSummary after edit
        } else {
            const data = await res.json();
            alert(data.error || 'Failed to update record');
        }
    };

    const filteredSummary = summary.filter((r: any) => 
        r.employee_id.toLowerCase().includes(empFilter.toLowerCase())
    );

    const totals = filteredSummary.reduce((acc: any, curr: any) => ({
        days: acc.days + 1,
        totalHours: acc.totalHours + (Number(curr.total_hours) || 0),
        lateMins: acc.lateMins + (Number(curr.late_minutes) || 0),
        earlyCheckinMins: acc.earlyCheckinMins + (Number(curr.early_checkin_minutes) || 0),
        earlyMins: acc.earlyMins + (Number(curr.early_minutes) || 0),
        overtimeMins: acc.overtimeMins + (Number(curr.overtime_minutes) || 0)
    }), { days: 0, totalHours: 0, lateMins: 0, earlyCheckinMins: 0, earlyMins: 0, overtimeMins: 0 });

    return (
        <div className="max-w-6xl mx-auto animation-fade-in text-gray-800">
            <header className="flex justify-between items-center mb-8 border-b pb-4 border-gray-200">
                <h1 className="text-3xl font-bold flex items-center gap-3 text-indigo-950">
                    <CalendarDays className="text-indigo-600" size={32} /> Summary Reports
                </h1>
                <div className="flex gap-4 items-center flex-wrap md:flex-nowrap">
                    {user?.role === 'admin' && (
                        <input type="text" placeholder="Filter by Employee ID..." value={empFilter} onChange={(e) => setEmpFilter(e.target.value)}
                            className="border border-gray-300 rounded-lg px-4 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium min-w-[200px]"
                        />
                    )}
                    <select className="border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={filterType} onChange={(e)=>setFilterType(e.target.value as any)}>
                        <option value="month">Monthly</option>
                        <option value="week">Weekly</option>
                    </select>
                    {filterType === 'month' ? (
                        <input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}
                            className="border border-gray-300 rounded-lg shadow-sm px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow bg-white min-w-[200px]" />
                    ) : (
                        <input type="week" value={weekFilter} onChange={(e) => setWeekFilter(e.target.value)}
                            className="border border-gray-300 rounded-lg shadow-sm px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow bg-white min-w-[200px]" />
                    )}
                    {user?.role === 'admin' && (
                        <button onClick={handleExport} className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap">
                            <FileSpreadsheet size={18} /> Export CSV
                        </button>
                    )}
                </div>
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-bold tracking-wider">
                            <tr>
                                <th className="px-4 py-3 border-b border-gray-100">Employee ID</th>
                                <th className="px-4 py-3 border-b border-gray-100">Date</th>
                                <th className="px-4 py-3 border-b border-gray-100 font-bold text-center">Check IN</th>
                                <th className="px-4 py-3 border-b border-gray-100 font-bold text-center">Check OUT</th>
                                <th className="px-4 py-3 border-b border-gray-100 text-center">Break</th>
                                <th className="px-4 py-3 border-b border-gray-100 text-center">Total Hours</th>
                                <th className="px-4 py-3 border-b border-gray-100 text-center">Late IN</th>
                                <th className="px-4 py-3 border-b border-gray-100 text-center">Early IN</th>
                                <th className="px-4 py-3 border-b border-gray-100 text-center">Early OUT</th>
                                <th className="px-4 py-3 border-b border-gray-100 text-center">Overtime</th>
                                {user?.role === 'admin' && <th className="px-4 py-3 border-b border-gray-100 text-right">Action</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-base">
                            {filteredSummary.length === 0 ? (
                                <tr>
                                    <td colSpan={user?.role === 'admin' ? 11 : 10} className="px-6 py-12 text-center text-gray-500 font-medium">No records found matching your criteria.</td>
                                </tr>
                            ) : (
                                filteredSummary.map((r: any) => (
                                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 font-semibold text-gray-900">{r.employee_id}</td>
                                        <td className="px-4 py-3 text-gray-600 font-medium">{r.date}</td>
                                        <td className="px-4 py-3 text-center font-bold text-indigo-700">{r.check_in || '-'}</td>
                                        <td className="px-4 py-3 text-center font-bold text-emerald-700">{r.check_out || '-'}</td>
                                        <td className="px-4 py-3 text-center font-medium text-gray-400">{r.break_minutes ? `${r.break_minutes}m` : '-'}</td>
                                        <td className="px-4 py-3 text-center font-bold text-indigo-700">{formatHrs(r.total_hours)}</td>
                                        <td className="px-4 py-3 text-center text-red-500 font-medium">{r.late_minutes > 0 ? formatMins(r.late_minutes) : '-'}</td>
                                        <td className="px-4 py-3 text-center text-emerald-500 font-medium">{r.early_checkin_minutes > 0 ? formatMins(r.early_checkin_minutes) : '-'}</td>
                                        <td className="px-4 py-3 text-center text-amber-500 font-medium">{r.early_minutes > 0 ? formatMins(r.early_minutes) : '-'}</td>
                                        <td className="px-4 py-3 text-center text-emerald-600 font-medium">{r.overtime_minutes > 0 ? formatMins(r.overtime_minutes) : '-'}</td>
                                        {user?.role === 'admin' && (
                                            <td className="px-4 py-3 text-right">
                                                <button onClick={() => setEditRecord(r)} className="text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 p-2 rounded transition-colors" title="Edit">
                                                    <Edit size={16} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                            {filteredSummary.length > 0 && (
                                <tr className="bg-indigo-50/50 font-bold border-t-2 border-indigo-100">
                                <td colSpan={5} className="px-4 py-3 text-indigo-900 text-right uppercase tracking-wider text-sm">Grand Total</td>
                                <td className="px-4 py-3 text-center text-indigo-700">{formatHrs(totals.totalHours)}</td>
                                <td className="px-4 py-3 text-center text-red-600">{formatMins(totals.lateMins)}</td>
                                <td className="px-4 py-3 text-center text-emerald-500">{formatMins(totals.earlyCheckinMins)}</td>
                                <td className="px-4 py-3 text-center text-amber-500">{formatMins(totals.earlyMins)}</td>
                                <td className="px-4 py-3 text-center text-emerald-600">{formatMins(totals.overtimeMins)}</td>
                                {user?.role === 'admin' && <td className="px-4 py-3"></td>}
                            </tr>
                            )}
                        </tbody>
                    </table>
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
