'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function TopNav() {
    const pathname = usePathname();
    const { data: session, status } = useSession();

    const isAdmin = session?.user?.permissions?.includes('manage:all') ||
        session?.user?.permissions?.includes('manage:User');

    const navItems = [
        { name: 'Dashboard', href: '/' },
        { name: 'Inventory', href: '/inventory' },
        { name: 'Service', href: '/service' },
        { name: 'Detailing', href: '/detailing' },
        { name: 'Sales', href: '/sales' },
        { name: 'Settings', href: '/settings' },
    ];

    if (status === 'loading') return <nav className="bg-white border-b border-gray-200 h-16 animate-pulse" />;

    return (
        <nav className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link href="/" className="flex-shrink-0 flex items-center">
                            <span className="text-xl font-bold text-blue-600">Lake Motor Group</span>
                        </Link>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`${pathname === item.href || pathname?.startsWith(item.href + '/')
                                        ? 'border-blue-500 text-gray-900'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                        } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            {session ? (
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-sm font-medium text-gray-900">{session.user?.name}</div>
                                        <div className="text-xs text-gray-500">{session.user?.roles?.[0] || 'User'}</div>
                                    </div>
                                    <button
                                        onClick={() => signOut()}
                                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => signIn('google')}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Sign In
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
