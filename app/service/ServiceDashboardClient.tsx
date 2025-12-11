'use client';

import { useState } from 'react';
import ServiceTicketModal from '@/app/components/service/ServiceTicketModal';
import Link from 'next/link';

export default function ServiceDashboardClient({ initialTickets }: { initialTickets: any[] }) {
    const [tickets, setTickets] = useState(initialTickets);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [priorityFilter, setPriorityFilter] = useState('ALL'); // NEW
    const [typeFilter, setTypeFilter] = useState('ALL'); // NEW
    const [searchQuery, setSearchQuery] = useState('');

    // Dynamic Statuses
    const statuses = ['ALL', ...Array.from(new Set(tickets.map(t => t.status)))];

    const filteredTickets = tickets.filter(ticket => {
        const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
        // NEW Filters
        const matchesPriority = priorityFilter === 'ALL' || (ticket.priority || 'Normal') === priorityFilter;
        const matchesType = typeFilter === 'ALL' || (ticket.type || 'RECON') === typeFilter;

        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
            ticket.vehicleVin.toLowerCase().includes(searchLower) ||
            (ticket.vehicle.stockNumber && ticket.vehicle.stockNumber.toLowerCase().includes(searchLower)) ||
            ticket.vehicle.make.toLowerCase().includes(searchLower) ||
            ticket.vehicle.model.toLowerCase().includes(searchLower) ||
            ticket.vehicle.year.toString().includes(searchLower);

        return matchesStatus && matchesSearch && matchesPriority && matchesType;
    }).sort((a, b) => {
        // Status Grouping: 
        // 1. Critical (Active)
        // 2. High (Active)
        // 3. Normal (Active) 
        // 4. Low (Active)
        // 5. Waiting Parts
        // 6. Completed

        const getScore = (ticket: any) => {
            const status = ticket.status;
            const priority = ticket.priority || 'Normal';

            if (status === 'Completed') return 0;
            if (status === 'Waiting Parts') return 10;

            // Active Tickets
            if (priority === 'Low') return 20;
            if (priority === 'Normal') return 30;
            if (priority === 'High') return 40;
            if (priority === 'Critical') return 50;
            return 25; // Default for active unknown
        };

        const scoreA = getScore(a);
        const scoreB = getScore(b);

        if (scoreA !== scoreB) {
            return scoreB - scoreA; // Descending Score (Critical first)
        }

        // Within same group: Date Created Ascending (Oldest First)
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    const handleTicketClick = (ticket: any) => {
        setSelectedTicket(ticket);
        setIsModalOpen(true);
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header Controls */}
            <div className="bg-white border-b border-gray-200 px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative max-w-xs w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                        <option value="ALL">All Types</option>
                        <option value="RECON">Service</option>
                        <option value="DETAILING">Detailing</option>
                        <option value="CLIENT_REQ">Client Req</option>
                    </select>

                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                        <option value="ALL">All Priorities</option>
                        <option value="Low">1 - Low</option>
                        <option value="Normal">2 - Normal</option>
                        <option value="High">3 - High</option>
                        <option value="Critical">4 - Critical</option>
                    </select>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex gap-2 overflow-x-auto shrink-0">
                {statuses.map(status => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors
                            ${statusFilter === status
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-white text-gray-600 hover:bg-gray-200 border border-gray-300'}`}
                    >
                        {status} <span className="ml-1 opacity-75">
                            ({status === 'ALL'
                                ? tickets.length
                                : tickets.filter(t => t.status === status).length})
                        </span>
                    </button>
                ))}
            </div>

            {/* Ticket List Table */}
            <div className="flex-1 overflow-auto min-h-0">
                <table className="min-w-full divide-y divide-gray-200 border-separate border-spacing-0">
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50">Ticket ID</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50">Vehicle</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50">Description</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50">Type</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50">Priority</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50">Difficulty</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50">Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTickets.map((ticket, index) => (
                            <tr key={ticket.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${ticket.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                            ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                                ticket.status === 'Waiting Parts' ? 'bg-yellow-100 text-yellow-800' :
                                                    ticket.status === 'Partially Complete' ? 'bg-orange-100 text-orange-800' :
                                                        'bg-gray-100 text-gray-800'}`}>
                                        {ticket.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    #{ticket.id.slice(-6)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{ticket.vehicle.year} {ticket.vehicle.make} {ticket.vehicle.model}</div>
                                    <div className="text-xs text-gray-500 font-mono">{ticket.vehicleVin}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900 line-clamp-2 max-w-xs">{ticket.description}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {ticket.type || 'RECON'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                                    <span className={
                                        ticket.priority === 'Critical' ? 'text-red-600' :
                                            ticket.priority === 'High' ? 'text-orange-600' :
                                                'text-gray-500'
                                    }>
                                        {ticket.priority || 'Normal'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {ticket.repairDifficulty && (
                                        <span className={`text-xs px-2 py-1 rounded ${ticket.repairDifficulty === 'Quick' ? 'bg-green-100 text-green-800' :
                                            ticket.repairDifficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                            {ticket.repairDifficulty}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(ticket.updatedAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    <Link
                                        href={`/service/${ticket.id}`}
                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                    >
                                        Edit
                                    </Link>
                                    <Link href={`/service/${ticket.id}`} className="text-gray-600 hover:text-gray-900">
                                        View
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredTickets.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No tickets found matching your criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
