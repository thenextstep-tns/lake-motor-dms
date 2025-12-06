import Link from 'next/link';

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-gray-900">Settings Overview</h2>
                <p className="mt-1 text-sm text-gray-500">Manage your application settings and preferences.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Users & Roles */}
                <Link
                    href="/settings/users"
                    className="block p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">Users & Roles</h3>
                    <p className="mt-2 text-sm text-gray-500">Manage system users, assign roles, and configure access permissions.</p>
                </Link>

                {/* Rights Editor */}
                <Link
                    href="/settings/rights"
                    className="block p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                            <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-purple-600 transition-colors">Rights Editor</h3>
                    <p className="mt-2 text-sm text-gray-500">Configure granular permissions and access rights for different roles.</p>
                </Link>

                {/* Company Details */}
                <Link
                    href="/settings/company"
                    className="block p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-green-600 transition-colors">Company Details</h3>
                    <p className="mt-2 text-sm text-gray-500">Update company information, working hours, and contact details.</p>
                </Link>

                {/* Lot Management */}
                <Link
                    href="/settings/lots"
                    className="block p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
                            <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-orange-600 transition-colors">Lot Management</h3>
                    <p className="mt-2 text-sm text-gray-500">Manage dealer lots and assign user access.</p>
                </Link>
            </div>
        </div>
    );
}
