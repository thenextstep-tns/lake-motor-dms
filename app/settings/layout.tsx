import Link from 'next/link';
import { ReactNode } from 'react';

export default function SettingsLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen bg-gray-50/50">
            {/* Settings Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                    <p className="text-sm text-gray-500 mt-1">Global Configuration</p>
                </div>
                <nav className="px-4 space-y-1">
                    <Link
                        href="/settings/company"
                        className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors"
                    >
                        Company Details
                    </Link>
                    <Link
                        href="/settings/lots"
                        className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors"
                    >
                        Lot Management
                    </Link>
                    <Link
                        href="/settings/users"
                        className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors"
                    >
                        Users & Roles
                    </Link>
                    <div className="h-px bg-gray-100 my-4 mx-4" />
                    <Link
                        href="/settings/rights"
                        className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors"
                    >
                        Rights Editor
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
