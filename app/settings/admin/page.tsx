'use client';

import { useState, useEffect } from 'react';
import { getSystemEvents, getDeletedEntities, restoreEntity, permanentlyDeleteEntity } from '@/app/actions/admin';
import { useRouter } from 'next/navigation';

export default function AdminToolsPage() {
    const [activeTab, setActiveTab] = useState<'bin' | 'logs'>('bin');

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-gray-900">Admin Tools</h2>
                <p className="mt-1 text-sm text-gray-500">System maintenance and logs.</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('bin')}
                        className={`${activeTab === 'bin'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Recycle Bin
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`${activeTab === 'logs'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        System Logs
                    </button>
                </nav>
            </div>

            {/* Content */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm min-h-[400px]">
                {activeTab === 'bin' ? <RecycleBin /> : <SystemLogs />}
            </div>
        </div>
    );
}

function RecycleBin() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Pagination & Filter State
    const [filterType, setFilterType] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    const router = useRouter();

    const fetchItems = async () => {
        setLoading(true);
        const res = await getDeletedEntities();
        if (res.success && res.data) {
            const all = [
                ...res.data.vehicles,
                ...res.data.tickets,
                ...res.data.inspections
            ].sort((a, b) => new Date(b.deletedAt || 0).getTime() - new Date(a.deletedAt || 0).getTime());
            setItems(all);
            setSelectedIds(new Set()); // Reset selection on refresh
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchItems();
    }, []);

    // Derived State
    const filteredItems = items.filter(item =>
        filterType === 'ALL' || item.type === filterType
    );

    const totalPages = Math.ceil(filteredItems.length / pageSize);
    const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Reset page when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filterType, pageSize]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(paginatedItems.map(item => item.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleRestore = async (id: string, type: any) => {
        if (!confirm("Restore this item?")) return;
        const res = await restoreEntity(id, type);
        if (res.success) {
            fetchItems();
            router.refresh();
        } else {
            alert("Failed: " + res.error);
        }
    };

    const handleDelete = async (id: string, type: any) => {
        if (!confirm("PERMANENTLY DELETE? This cannot be undone.")) return;
        const res = await permanentlyDeleteEntity(id, type);
        if (res.success) {
            fetchItems();
        } else {
            alert("Failed: " + res.error);
        }
    };

    const handleBulkRestore = async () => {
        if (!confirm(`Restore ${selectedIds.size} items?`)) return;

        const promises = Array.from(selectedIds).map(id => {
            const item = items.find(i => i.id === id);
            if (!item) return Promise.resolve({ success: false, error: 'Item not found' });
            return restoreEntity(id, item.type);
        });

        await Promise.all(promises);
        fetchItems();
        router.refresh();
    };

    const handleBulkDelete = async () => {
        if (!confirm(`PERMANENTLY DELETE ${selectedIds.size} items? This cannot be undone.`)) return;

        const promises = Array.from(selectedIds).map(id => {
            const item = items.find(i => i.id === id);
            if (!item) return Promise.resolve({ success: false, error: 'Item not found' });
            return permanentlyDeleteEntity(id, item.type);
        });

        await Promise.all(promises);
        fetchItems();
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading deleted items...</div>;

    if (items.length === 0) return <div className="p-8 text-center text-gray-500">Recycle Bin is empty.</div>;

    return (
        <div className="flex flex-col">
            {/* Filters & Controls */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <div className="flex items-center space-x-4">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    >
                        <option value="ALL">All Types</option>
                        <option value="VEHICLE">Vehicles</option>
                        <option value="TICKET">Service Tickets</option>
                        <option value="INSPECTION">Inspections</option>
                    </select>
                </div>

                {selectedIds.size > 0 && (
                    <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-blue-900">{selectedIds.size} selected</span>
                        <button
                            onClick={handleBulkRestore}
                            className="text-sm bg-white border border-blue-200 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-100 font-medium"
                        >
                            Restore
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            className="text-sm bg-white border border-red-200 text-red-700 px-3 py-1.5 rounded hover:bg-red-50 font-medium"
                        >
                            Delete
                        </button>
                    </div>
                )}
            </div>

            <div className="overflow-x-auto min-h-[400px]">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left w-10">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={selectedIds.size === paginatedItems.length && paginatedItems.length > 0}
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deleted At</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deleted By</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedItems.map((item) => {
                            const isSelected = selectedIds.has(item.id);
                            return (
                                <tr key={item.id + item.type} className={isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={isSelected}
                                            onChange={() => handleSelectOne(item.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 uppercase">{item.type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.label}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.deletedAt).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.deletedBy || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                        <button onClick={() => handleRestore(item.id, item.type)} className="text-blue-600 hover:text-blue-900">Restore</button>
                                        <button onClick={() => handleDelete(item.id, item.type)} className="text-red-600 hover:text-red-900">Delete Forever</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, filteredItems.length)}</span> of <span className="font-medium">{filteredItems.length}</span> results
                        </p>
                        <select
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                            className="rounded-md border-gray-300 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value={25}>25 / page</option>
                            <option value={50}>50 / page</option>
                            <option value={100}>100 / page</option>
                        </select>
                    </div>
                    <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                                <span className="sr-only">Previous</span>
                                <span>&larr;</span>
                            </button>
                            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                Page {currentPage} of {totalPages || 1}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                                <span className="sr-only">Next</span>
                                <span>&rarr;</span>
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SystemLogs() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEvents = async () => {
        setLoading(true);
        const res = await getSystemEvents();
        if (res.success && res.data) {
            setEvents(res.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading system logs...</div>;

    return (
        <div className="flex flex-col h-[600px]">
            <div className="flex-1 overflow-auto">
                <table className="min-w-full divide-y divide-gray-200 relative">
                    <thead className="bg-gray-50 sticky top-0">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payload</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {events.map((evt) => (
                            <tr key={evt.id} className="hover:bg-gray-50">
                                <td className="px-6 py-2 whitespace-nowrap text-xs text-gray-500">
                                    {new Date(evt.timestamp).toLocaleString()}
                                </td>
                                <td className="px-6 py-2 whitespace-nowrap text-xs font-bold text-gray-700">
                                    {evt.type}
                                </td>
                                <td className="px-6 py-2 whitespace-nowrap text-xs text-gray-600">
                                    {evt.userName || evt.userId || 'System'}
                                </td>
                                <td className="px-6 py-2 text-xs text-gray-500 font-mono">
                                    <details className="cursor-pointer">
                                        <summary className="text-blue-500 hover:underline">View Payload</summary>
                                        <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto text-[10px]">
                                            {JSON.stringify(JSON.parse(evt.payload || '{}'), null, 2)}
                                        </pre>
                                    </details>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
