'use client';

import { useState } from 'react';
import { clockIn, clockOut, completeTicket, requestParts, confirmPartsReceived, deleteServiceTicket, updateServiceTicket } from '@/app/actions/service';
import { useRouter } from 'next/navigation';

interface ServiceTicketClientProps {
    ticket: any;
    isClockedIn: boolean;
    isCompleted: boolean;
    activeTasks: string[];
    inspectionItems: string[];
    failedItems: { id: string, category: string, item: string, issue: string, status: string }[];
}

export default function ServiceTicketClient({
    ticket,
    isClockedIn,
    isCompleted,
    activeTasks,
    inspectionItems,
    failedItems = []
}: ServiceTicketClientProps) {
    const MECHANICAL_COMPONENTS = ['Engine', 'Transmission', 'Brakes', 'Tires', 'Suspension', 'Electrical', 'AC/Heat', 'Fluids'];
    const COSMETIC_COMPONENTS = ['Paint', 'Body', 'Glass', 'Wheels', 'Interior', 'Upholstery', 'Detailing'];

    const [activeTab, setActiveTab] = useState('details');
    const [showClockInTasks, setShowClockInTasks] = useState(false);
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

    // Work Reporting State
    const [itemResolutions, setItemResolutions] = useState<Record<string, { fixed: boolean, notes: string }>>(() => {
        const initial: Record<string, { fixed: boolean, notes: string }> = {};
        if (Array.isArray(failedItems)) {
            failedItems.forEach(item => {
                if (item && item.status === 'Fixed') {
                    initial[item.id] = { fixed: true, notes: '' };
                }
            });
        }
        return initial;
    });

    console.log('ServiceTicketClient Render:', { failedItems, itemResolutionsCount: Object.keys(itemResolutions || {}).length });

    // General Notes State
    const [generalNotes, setGeneralNotes] = useState('');

    // Edit Form State
    const [formData, setFormData] = useState({
        status: ticket.status,
        description: ticket.description,
        repairProcess: ticket.repairProcess || '',
        repairDifficulty: ticket.repairDifficulty || '',
        techId: ticket.techId || ''
    });
    const [isSaving, setIsSaving] = useState(false);

    const router = useRouter();

    // Calculate Time Analysis
    const now = new Date().getTime();
    const createdAt = new Date(ticket.createdAt).getTime();
    const completedAt = ticket.status === 'Completed' && ticket.updatedAt ? new Date(ticket.updatedAt).getTime() : now;
    const totalTicketTime = completedAt - createdAt;

    let totalRepairTime = 0;
    (ticket.timeLogs || []).forEach((log: any) => {
        if (log.endTime) {
            const duration = new Date(log.endTime).getTime() - new Date(log.startTime).getTime();
            if (log.type !== 'STATUS_CHANGE') {
                totalRepairTime += duration;
            }
        } else if (!log.endTime && log.type !== 'STATUS_CHANGE') {
            totalRepairTime += (now - new Date(log.startTime).getTime());
        }
    });

    const totalWaitingTime = Math.max(0, totalTicketTime - totalRepairTime);

    const formatDuration = (ms: number) => {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        return `${hours}h ${minutes}m`;
    };

    const handleClockInConfirm = async () => {
        await clockIn(ticket.id, 'mock-tech-id', selectedTasks);
        setShowClockInTasks(false);
        setSelectedTasks([]);
    };

    const handleClockOutClick = () => {
        setActiveTab('clock_out');
    };

    const handleClockOutConfirm = async () => {
        console.log('handleClockOutConfirm called', { ticketId: ticket.id, resolutions: itemResolutions, generalNotes });
        try {
            // Pass null for newIssues as we removed that functionality
            // FIX: Removed 'mock-tech-id' argument which was causing mismatch
            const result = await clockOut(ticket.id, itemResolutions, [], generalNotes);

            if (!result || !result.success) {
                throw new Error(result?.error || 'Failed to clock out');
            }

            console.log('clockOut successful');
            setActiveTab('details');
            setGeneralNotes('');
        } catch (error) {
            console.error('Failed to clock out:', error);
            alert(`Failed to clock out: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
            await deleteServiceTicket(ticket.id);
            router.push('/service');
        }
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            await updateServiceTicket(ticket.id, formData);
            alert('Ticket updated successfully');
        } catch (error) {
            console.error(error);
            alert('Failed to update ticket');
        } finally {
            setIsSaving(false);
        }
    };

    const safeParse = (jsonString: any) => {
        if (!jsonString) return {};
        try {
            return JSON.parse(jsonString);
        } catch (e) {
            return {};
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 bg-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-bold text-gray-900">Ticket #{ticket.id.slice(-6)}</h1>
                        <div className="space-x-4 flex items-center">
                            {!isCompleted && (
                                <>
                                    {ticket.status === 'Waiting Parts' && (
                                        <button
                                            onClick={() => confirmPartsReceived(ticket.id)}
                                            className="px-4 py-2 rounded font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-sm"
                                        >
                                            Parts Received
                                        </button>
                                    )}

                                    {isClockedIn ? (
                                        <button
                                            onClick={handleClockOutClick}
                                            className="px-4 py-2 rounded font-bold text-white bg-red-500 hover:bg-red-600 shadow-sm"
                                        >
                                            Clock Out
                                        </button>
                                    ) : (
                                        <div className="relative inline-block text-left">
                                            {showClockInTasks ? (
                                                <div className="origin-top-right absolute right-0 mt-2 w-72 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10 p-4">
                                                    <h3 className="text-sm font-medium text-gray-900 mb-2">Select Tasks</h3>
                                                    <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                                                        {inspectionItems.length > 0 ? (
                                                            inspectionItems.map((item) => (
                                                                <label key={item} className="flex items-center space-x-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedTasks.includes(item)}
                                                                        onChange={(e) => {
                                                                            if (e.target.checked) setSelectedTasks([...selectedTasks, item]);
                                                                            else setSelectedTasks(selectedTasks.filter(t => t !== item));
                                                                        }}
                                                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                                    />
                                                                    <span className="text-sm text-gray-700">{item}</span>
                                                                </label>
                                                            ))
                                                        ) : (
                                                            <p className="text-sm text-gray-500 italic">No inspection items.</p>
                                                        )}
                                                        <label className="flex items-center space-x-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedTasks.includes('General Diagnosis')}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) setSelectedTasks([...selectedTasks, 'General Diagnosis']);
                                                                    else setSelectedTasks(selectedTasks.filter(t => t !== 'General Diagnosis'));
                                                                }}
                                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                            <span className="text-sm text-gray-700">General Diagnosis</span>
                                                        </label>
                                                    </div>
                                                    <div className="flex justify-end space-x-2">
                                                        <button onClick={() => setShowClockInTasks(false)} className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200">Cancel</button>
                                                        <button onClick={handleClockInConfirm} className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700">Start</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setShowClockInTasks(true)}
                                                    className="px-4 py-2 rounded font-bold text-white bg-green-500 hover:bg-green-600 shadow-sm"
                                                >
                                                    Clock In
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    <button
                                        onClick={async () => {
                                            const actionText = ticket.status === 'Quality Control' ? 'complete' : 'move to QA';
                                            if (confirm(`Are you sure you want to ${actionText} this ticket?`)) {
                                                const result = await completeTicket(ticket.id);
                                                if (!result || !result.success) {
                                                    alert(`Failed to update ticket: ${result?.error || 'Unknown error'}`);
                                                }
                                            }
                                        }}
                                        className="px-4 py-2 rounded font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
                                    >
                                        {ticket.status === 'Quality Control' ? 'Complete' : 'QA Passed'}
                                    </button>
                                </>
                            )}
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 rounded font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm"
                            >
                                Delete
                            </button>
                        </div>
                    </div>

                    {/* Time Widgets */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
                            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Time</h4>
                            <p className="text-xl font-bold text-gray-900">{formatDuration(totalTicketTime)}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-center">
                            <h4 className="text-xs font-medium text-green-600 uppercase tracking-wider">Repair Time</h4>
                            <p className="text-xl font-bold text-green-700">{formatDuration(totalRepairTime)}</p>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-center">
                            <h4 className="text-xs font-medium text-yellow-600 uppercase tracking-wider">Waiting Time</h4>
                            <p className="text-xl font-bold text-yellow-700">{formatDuration(totalWaitingTime)}</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            {['Vehicle & Details', 'Request Parts', 'Repair Log', 'Clock Ins'].map((tab) => {
                                const tabKey = tab.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_');
                                const isActive = activeTab === (tabKey === 'vehicle_details' ? 'details' : tabKey);
                                return (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tabKey === 'vehicle_details' ? 'details' : tabKey)}
                                        className={`${isActive
                                            ? 'border-indigo-500 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                    >
                                        {tab}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                <div className="max-w-7xl mx-auto">
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            {/* Vehicle Info */}
                            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                                <div className="px-4 py-5 sm:px-6">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">Vehicle Information</h3>
                                </div>
                                <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                                    <dl className="sm:divide-y sm:divide-gray-200">
                                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                            <dt className="text-sm font-medium text-gray-500">VIN</dt>
                                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{ticket.vehicleVin}</dd>
                                        </div>
                                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                            <dt className="text-sm font-medium text-gray-500">Description</dt>
                                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{ticket.description}</dd>
                                        </div>
                                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                            <dt className="text-sm font-medium text-gray-500">Status</dt>
                                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                    ${ticket.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                        ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                                            ticket.status === 'Waiting Parts' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-gray-100 text-gray-800'}`}>
                                                    {ticket.status}
                                                </span>
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>

                            {/* Ticket Details Form */}
                            <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">Ticket Details</h3>
                                    <button
                                        onClick={handleSaveChanges}
                                        disabled={isSaving}
                                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                                    >
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        >
                                            {['Queue', 'Assigned', 'Waiting Parts', 'In Progress', 'Quality Control', 'Completed'].map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Repair Difficulty</label>
                                        <select
                                            value={formData.repairDifficulty}
                                            onChange={(e) => setFormData({ ...formData, repairDifficulty: e.target.value })}
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        >
                                            <option value="">Select Difficulty</option>
                                            <option value="Quick">Quick Fix</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Difficult">Difficult</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Issue Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={4}
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Repair Process / Notes</label>
                                        <textarea
                                            value={formData.repairProcess}
                                            onChange={(e) => setFormData({ ...formData, repairProcess: e.target.value })}
                                            rows={4}
                                            placeholder="Describe the work done..."
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'request_parts' && (
                        <div className="space-y-6">
                            {!isCompleted && (
                                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                                    <div className="px-4 py-5 sm:px-6">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">Request Parts</h3>
                                    </div>
                                    <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                                        <form action={async (formData) => {
                                            const description = formData.get('description') as string;
                                            if (description) await requestParts(ticket.id, description);
                                        }} className="flex gap-4">
                                            <input
                                                type="text"
                                                name="description"
                                                placeholder="Describe parts needed..."
                                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                required
                                            />
                                            <button
                                                type="submit"
                                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            >
                                                Request
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {ticket.parts.length > 0 ? (
                                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                                    <div className="px-4 py-5 sm:px-6">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">Ordered Parts</h3>
                                    </div>
                                    <ul className="divide-y divide-gray-200">
                                        {(ticket.parts || []).map((part: any) => (
                                            <li key={part.id} className="px-4 py-4 sm:px-6">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-medium text-indigo-600 truncate">{part.name}</p>
                                                    <div className="ml-2 flex-shrink-0 flex">
                                                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${part.status === 'RECEIVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                            {part.status}
                                                        </p>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-500">No parts ordered yet.</div>
                            )}
                        </div>
                    )}

                    {activeTab === 'repair_log' && (
                        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                            <div className="px-4 py-5 sm:px-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Repair Log</h3>
                            </div>
                            <ul className="divide-y divide-gray-200">
                                {(ticket.timeLogs || []).filter((log: any) => log.workDetails || log.notes).map((log: any) => (
                                    <li key={log.id} className="px-4 py-4 sm:px-6">
                                        <div className="flex flex-col space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-xs text-gray-500">{new Date(log.startTime).toLocaleString()}</span>
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.type === 'STATUS_CHANGE' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                                    {log.type}
                                                </span>
                                            </div>
                                            {log.notes && <p className="text-sm text-gray-900">{log.notes}</p>}
                                            {log.workDetails && (
                                                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded mt-2">
                                                    <ul className="list-disc list-inside">
                                                        {Object.entries(safeParse(log.workDetails)).map(([task, detail]: any) => (
                                                            <li key={task}>
                                                                <span className="font-medium">{task.replace(/^(mech-|cos-|code-)/, '')}:</span>{' '}
                                                                {typeof detail === 'object' && detail !== null ? (
                                                                    <span>
                                                                        {detail.fixed ? <span className="text-green-600 font-bold">[Fixed] </span> : ''}
                                                                        {detail.notes}
                                                                    </span>
                                                                ) : (
                                                                    detail
                                                                )}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                ))}
                                {(ticket.timeLogs || []).filter((log: any) => log.workDetails || log.notes).length === 0 && (
                                    <li className="px-4 py-8 text-center text-gray-500">No repair logs available.</li>
                                )}
                            </ul>
                        </div>
                    )}

                    {activeTab === 'clock_ins' && (
                        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                            <div className="px-4 py-5 sm:px-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Time Sessions</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {(ticket.timeLogs || []).map((log: any) => {
                                            const duration = log.endTime ? new Date(log.endTime).getTime() - new Date(log.startTime).getTime() : null;
                                            return (
                                                <tr key={log.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(log.startTime).toLocaleString()}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.endTime ? new Date(log.endTime).toLocaleString() : '-'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{duration ? formatDuration(duration) : 'Active'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.endTime ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                                            {log.endTime ? 'Completed' : 'Active'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}


                    {activeTab === 'clock_out' && (
                        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                            <div className="px-4 py-5 sm:px-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Clock Out & Report</h3>
                                <p className="mt-1 max-w-2xl text-sm text-gray-500">Record your work and complete the session.</p>
                            </div>
                            <div className="border-t border-gray-200 px-4 py-5 sm:p-6 space-y-6">
                                {/* General Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Work Description / General Notes</label>
                                    <textarea
                                        className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        rows={3}
                                        placeholder="Describe what you did..."
                                        value={generalNotes}
                                        onChange={(e) => setGeneralNotes(e.target.value)}
                                    />
                                </div>

                                {/* Inspection Items */}
                                {Array.isArray(failedItems) && failedItems.length > 0 ? (
                                    <div>
                                        <h4 className="text-md font-bold text-gray-900 mb-3 border-b pb-1">Inspection Items</h4>
                                        <div className="space-y-4">
                                            {failedItems.map((item) => {
                                                if (!item) return null;
                                                return (
                                                    <div key={item.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div>
                                                                <p className="font-bold text-gray-900">{item.item}</p>
                                                                <p className="text-sm text-red-600">{item.issue}</p>
                                                            </div>
                                                            <label className="flex items-center space-x-2">
                                                                <input
                                                                    type="checkbox"
                                                                    className="rounded border-gray-300 text-green-600 focus:ring-green-500 h-5 w-5"
                                                                    checked={itemResolutions?.[item.id]?.fixed || false}
                                                                    onChange={(e) => setItemResolutions({
                                                                        ...itemResolutions,
                                                                        [item.id]: { ...itemResolutions?.[item.id], fixed: e.target.checked }
                                                                    })}
                                                                />
                                                                <span className="text-sm font-medium text-gray-700">Fixed</span>
                                                            </label>
                                                        </div>
                                                        <textarea
                                                            className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 mt-2"
                                                            rows={2}
                                                            placeholder="Notes for this item..."
                                                            value={itemResolutions?.[item.id]?.notes || ''}
                                                            onChange={(e) => setItemResolutions({
                                                                ...itemResolutions,
                                                                [item.id]: { ...itemResolutions?.[item.id], notes: e.target.value }
                                                            })}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic">No inspection items to address.</p>
                                )}

                                <div className="flex justify-end space-x-3 pt-4 border-t">
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                                        onClick={() => setActiveTab('details')}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                                        onClick={handleClockOutConfirm}
                                    >
                                        Complete & Clock Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

