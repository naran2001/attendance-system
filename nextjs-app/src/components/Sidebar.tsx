'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, CalendarDays, LogOut, Users, ListTodo } from 'lucide-react';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';

export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        if (pathname !== '/login') {
            fetch('/api/auth/me').then(res => res.json()).then(data => {
                if (data.user) setUser(data.user);
            });
        }
    }, [pathname]);

    if (pathname === '/login') return null;

    let navItems = [
        { label: 'Dashboard', href: '/', icon: LayoutDashboard },
        { label: 'Manual Entries', href: '/request', icon: require('lucide-react').Clock },
        { label: 'Monthly Summary', href: '/summary', icon: CalendarDays },
    ];

    if (user?.role === 'admin') {
        navItems.push({ label: 'Approvals', href: '/approvals', icon: ListTodo });
        navItems.push({ label: 'Manage Users', href: '/users', icon: Users });
    }

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
    };

    return (
        <aside className={clsx("bg-gray-900 text-white flex md:flex-col pt-4 md:pt-8 md:min-h-screen", className)}>
            <div className="px-4 md:px-8 mb-4 md:mb-8 flex items-center justify-between w-full md:w-auto">
                <h2 className="text-xl md:text-2xl font-bold tracking-wide text-white">SyncTime</h2>
            </div>
            <nav className="flex-1 flex md:flex-col items-center md:items-stretch overflow-x-auto md:overflow-x-visible gap-2 px-2 md:px-0 pb-4 md:pb-0 hide-scrollbar">
                {navItems.map((item) => {
                    const active = pathname === item.href;
                    return (
                        <Link 
                            key={item.href} 
                            href={item.href}
                            className={clsx(
                                "flex items-center gap-3 px-4 md:px-8 py-2 md:py-3 rounded-lg md:rounded-none transition-colors whitespace-nowrap",
                                active ? "bg-gray-800 md:border-l-4 border-b-2 md:border-b-0 border-indigo-500 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
                            )}
                        >
                            <item.icon size={20} />
                            <span className="inline">{item.label}</span>
                        </Link>
                    )
                })}
            </nav>
            <div className="mt-auto p-4 md:p-8 hidden md:block">
                <div className="mb-4">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Logged In As</p>
                    <p className="text-sm font-medium text-white">{user?.employee_id}</p>
                    <p className="text-xs text-indigo-400 capitalize font-bold">{user?.role}</p>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-full">
                    <LogOut size={16} /> Logout
                </button>
            </div>
            <div className="md:hidden p-2 flex items-center justify-center">
                <button onClick={handleLogout} className="text-gray-400 hover:text-white transition-colors" title="Logout">
                    <LogOut size={20} />
                </button>
            </div>
        </aside>
    );
}
