'use client';
import { useState, useEffect } from 'react';
import { Users, UserPlus, Edit, Trash2 } from 'lucide-react';

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [empId, setEmpId] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('employee');
    const [shiftStart, setShiftStart] = useState('09:00');
    const [shiftEnd, setShiftEnd] = useState('17:00');
    const [editUser, setEditUser] = useState<any>(null);
    const [message, setMessage] = useState<{type:'success'|'error', text:string}|null>(null);

    const loadUsers = async () => {
        const res = await fetch('/api/users');
        const data = await res.json();
        if(res.ok) setUsers(data);
    };

    useEffect(() => { loadUsers(); }, []);

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = editUser 
            ? { id: editUser.id, employee_id: empId, password, role, shift_start: shiftStart, shift_end: shiftEnd }
            : { employee_id: empId, password, role, shift_start: shiftStart, shift_end: shiftEnd };
            
        const method = editUser ? 'PUT' : 'POST';

        const res = await fetch('/api/users', {
            method,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
            setMessage({ type: 'success', text: data.message });
            setEmpId(''); setPassword(''); setRole('employee'); setShiftStart('09:00'); setShiftEnd('17:00'); setEditUser(null);
            loadUsers();
        } else {
            setMessage({ type: 'error', text: data.error });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you certain you want to delete this user? This cannot be undone.')) return;
        const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) {
            setMessage({ type: 'success', text: data.message });
            loadUsers();
        } else {
            setMessage({ type: 'error', text: data.error });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    const handleEditClick = (u: any) => {
        setEditUser(u);
        setEmpId(u.employee_id);
        setRole(u.role);
        setShiftStart(u.shift_start ? u.shift_start.substring(0, 5) : '09:00');
        setShiftEnd(u.shift_end ? u.shift_end.substring(0, 5) : '17:00');
        setPassword('');
        window.scrollTo(0,0);
    };

    return (
        <div className="max-w-4xl mx-auto animation-fade-in text-gray-800">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3"><Users className="text-indigo-600"/> Manage Users</h1>
            </header>
            
            {message && <div className={`p-4 mb-6 rounded-lg font-medium shadow-sm ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{message.text}</div>}

            <div className="grid md:grid-cols-3 gap-6">
                <div className="col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        {editUser ? <Edit size={18} className="text-indigo-500"/> : <UserPlus size={18} className="text-indigo-500"/>} 
                        {editUser ? 'Edit User' : 'New User'}
                    </h3>
                    <form onSubmit={handleCreateOrUpdate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Employee ID</label>
                            <input value={empId} onChange={e=>setEmpId(e.target.value)} required className="w-full border border-gray-300 focus:ring-2 focus:ring-indigo-500 rounded-lg px-3 py-2 outline-none transition-shadow" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Password {editUser && <span className="text-xs text-gray-400 font-normal">(Leave blank to keep same)</span>}</label>
                            <input value={password} onChange={e=>setPassword(e.target.value)} required={!editUser} type="password" placeholder={editUser ? "••••••••" : ""} className="w-full border border-gray-300 focus:ring-2 focus:ring-indigo-500 rounded-lg px-3 py-2 outline-none transition-shadow" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Role</label>
                            <select value={role} onChange={e=>setRole(e.target.value)} className="w-full border border-gray-300 focus:ring-2 focus:ring-indigo-500 rounded-lg px-3 py-2 outline-none transition-shadow bg-white">
                                <option value="employee">Employee</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-600">Shift Start</label>
                                <input type="time" value={shiftStart} onChange={e=>setShiftStart(e.target.value)} required className="w-full border border-gray-300 focus:ring-2 focus:ring-indigo-500 rounded-lg px-3 py-2 outline-none transition-shadow" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-600">Shift End</label>
                                <input type="time" value={shiftEnd} onChange={e=>setShiftEnd(e.target.value)} required className="w-full border border-gray-300 focus:ring-2 focus:ring-indigo-500 rounded-lg px-3 py-2 outline-none transition-shadow" />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button type="submit" className="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-lg hover:bg-indigo-700 transition">
                                {editUser ? 'Update User' : 'Create User'}
                            </button>
                            {editUser && (
                                <button type="button" onClick={() => { setEditUser(null); setEmpId(''); setPassword(''); setRole('employee'); setShiftStart('09:00'); setShiftEnd('17:00'); }} className="px-4 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition">
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>
                
                <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4 border-b border-gray-100">Database ID</th>
                                <th className="px-6 py-4 border-b border-gray-100">Employee ID</th>
                                <th className="px-6 py-4 border-b border-gray-100">Role</th>
                                <th className="px-6 py-4 border-b border-gray-100">Shift Bounds</th>
                                <th className="px-6 py-4 border-b border-gray-100 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-gray-500">{u.id}</td>
                                    <td className="px-6 py-4 font-bold text-gray-900">{u.employee_id}</td>
                                    <td className="px-6 py-4 capitalize font-semibold text-indigo-600">{u.role}</td>
                                    <td className="px-6 py-4 text-gray-600 text-sm">
                                        <div className="font-medium">{u.shift_start?.substring(0, 5) || '09:00'} to {u.shift_end?.substring(0, 5) || '17:00'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleEditClick(u)} className="text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 p-2 rounded transition-colors mr-2" title="Edit User">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded transition-colors" title="Delete User">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Loading users...</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
