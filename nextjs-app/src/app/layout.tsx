import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SyncTime | Employee Attendance',
  description: 'Manage your employee attendance with ease.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col md:flex-row bg-gray-50`}>
        <Sidebar className="w-full md:w-64 flex-shrink-0 z-10 sticky top-0 md:static shadow-md md:shadow-none bg-gray-900" />
        <main className="flex-1 h-full md:h-screen overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
