'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [empId, setEmpId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employee_id: empId, password })
            });
            const data = await res.json();
            
            if (res.ok) {
                router.push('/');
                router.refresh();
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Something went wrong');
        }
    };

    return (
        <div className="min-h-[90vh] flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md animation-fade-in border border-gray-100">
                <h1 className="text-3xl font-bold text-center text-indigo-600 tracking-wide mb-2">SyncTime</h1>
                <p className="text-center text-gray-500 mb-8 font-medium">Sign in to your account</p>
                
                {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 font-bold border border-red-100 text-center">{error}</div>}
                
                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Employee ID</label>
                        <input 
                            type="text" 
                            required
                            value={empId}
                            onChange={e => setEmpId(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow font-medium"
                            placeholder="e.g. EMP001"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow font-medium"
                            placeholder="••••••••"
                        />
                        <p className="text-xs text-gray-400 mt-3 font-medium leading-relaxed">System Admin Note: For standard employees, their first login will automatically register their account.</p>
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors mt-2 shadow-sm">
                        Access Dashboard
                    </button>
                </form>
            </div>
        </div>
    );
}
