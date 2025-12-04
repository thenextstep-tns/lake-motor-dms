'use client';

import { useState } from 'react';
import { clockIn, clockOut, completeTicket, requestParts, confirmPartsReceived, deleteServiceTicket, confirmQualityControl } from '@/app/actions/service';
import { useRouter } from 'next/navigation';

interface ServiceTicketClientProps {
    ticket: any; // Using any for now to avoid complex Prisma type matching issues in client
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
    failedItems
}: ServiceTicketClientProps) {
    const MECHANICAL_COMPONENTS = ['Engine', 'Transmission', 'Brakes', 'Tires', 'Suspension', 'Electrical', 'AC/Heat', 'Fluids'];
    const COSMETIC_COMPONENTS = ['Paint', 'Body', 'Glass', 'Wheels', 'Interior', 'Upholstery', 'Detailing'];
    const [isClockOutModalOpen, setIsClockOutModalOpen] = useState(false); // Reusing this name for the inline toggle
    const [showClockInTasks, setShowClockInTasks] = useState(false);
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

    // Clock Out State
    const [itemResolutions, setItemResolutions] = useState<Record<string, { fixed: boolean, notes: string }>>(() => {
        const initial: Record<string, { fixed: boolean, notes: string }> = {};
        failedItems.forEach(item => {
            if (item.status === 'Fixed') {
                initial[item.id] = { fixed: true, notes: '' };
            }
        });
        return initial;
    });
    const [foundNewIssues, setFoundNewIssues] = useState(false);
    const [newIssues, setNewIssues] = useState<{ item: string, notes: string, fixed: boolean, resolutionNotes: string }[]>([]);
    const [currentNewIssue, setCurrentNewIssue] = useState({ item: '', notes: '' });

    const router = useRouter();

    // Calculate Time Analysis
    const now = new Date().getTime();
    const createdAt = new Date(ticket.createdAt).getTime();
    const completedAt = ticket.status === 'Completed' && ticket.updatedAt ? new Date(ticket.updatedAt).getTime() : now;

    const totalTicketTime = completedAt - createdAt;

    let totalRepairTime = 0;
    ticket.timeLogs.forEach((log: any) => {
        if (log.endTime) {
            const duration = new Date(log.endTime).getTime() - new Date(log.startTime).getTime();
            if (log.type !== 'STATUS_CHANGE') {
                totalRepairTime += duration;
            }
        } else if (!log.endTime && log.type !== 'STATUS_CHANGE') {
            // Active session
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

    const handleClockOutClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsClockOutModalOpen(true);
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
            await deleteServiceTicket(ticket.id);
            router.push('/service');
        }
    };

    const handleClockOutConfirm = async () => {
        await clockOut(ticket.id, 'mock-tech-id', itemResolutions, newIssues.length > 0 ? newIssues : null);
        setIsClockOutModalOpen(false);
        setNewIssues([]);
        setCurrentNewIssue({ item: '', notes: '' });
        setFoundNewIssues(false);
    };

    const handleAddNewIssue = () => {
        if (!currentNewIssue.item.trim()) return;
        setNewIssues([...newIssues, { ...currentNewIssue, fixed: false, resolutionNotes: '' }]);
        setCurrentNewIssue({ item: '', notes: '' });
    };

    const handleRemoveNewIssue = (index: number) => {
        setNewIssues(newIssues.filter((_, i) => i !== index));
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Ticket #{ticket.id.slice(-6)}</h1>
                <div className="space-x-4 flex items-center">
                    {!isCompleted && (
                        <>
                            {ticket.status === 'Waiting Parts' && (
                                <button
                                    onClick={() => confirmPartsReceived(ticket.id, 'mock-tech-id')}
                                    className="px-4 py-2 rounded font-bold text-white bg-purple-600 hover:bg-purple-700"
                                >
                                    Parts Received
                                </button>
                            )}

                            {isClockedIn ? (
                                <button
                                    onClick={handleClockOutClick}
                                    className="px-4 py-2 rounded font-bold text-white bg-red-500 hover:bg-red-600"
                                >
                                    Clock Out
                                </button>
                            ) : (
                                <div className="relative inline-block text-left">
                                    {showClockInTasks ? (
                                        <div className="origin-top-right absolute right-0 mt-2 w-72 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10 p-4">
                                            <h3 className="text-sm font-medium text-gray-900 mb-2">Select Tasks to Work On</h3>
                                            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                                                {inspectionItems.length > 0 ? (
                                                    inspectionItems.map((item) => (
                                                        <label key={item} className="flex items-center space-x-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedTasks.includes(item)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedTasks([...selectedTasks, item]);
                                                                    } else {
                                                                        setSelectedTasks(selectedTasks.filter(t => t !== item));
                                                                    }
                                                                }}
                                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                            <span className="text-sm text-gray-700">{item}</span>
                                                        </label>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-gray-500 italic">No inspection items found.</p>
                                                )}
                                                <label className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedTasks.includes('General Diagnosis')}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedTasks([...selectedTasks, 'General Diagnosis']);
                                                            } else {
                                                                setSelectedTasks(selectedTasks.filter(t => t !== 'General Diagnosis'));
                                                            }
                                                        }}
                                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm text-gray-700">General Diagnosis</span>
                                                </label>
                                            </div>
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => setShowClockInTasks(false)}
                                                    className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleClockInConfirm}
                                                    className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                                                >
                                                    Start Work
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setShowClockInTasks(true)}
                                            className="px-4 py-2 rounded font-bold text-white bg-green-500 hover:bg-green-600"
                                        >
                                            Clock In
                                        </button>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={() => completeTicket(ticket.id, 'mock-tech-id')}
                                className="px-4 py-2 rounded font-bold text-white bg-blue-600 hover:bg-blue-700"
                            >
                                Complete Ticket
                            </button>

                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 rounded font-bold text-white bg-red-600 hover:bg-red-700 ml-2"
                            >
                                Delete Ticket
                            </button>
                        </>
                    )}
                    {isCompleted && (
                        <>
                            <span className="px-4 py-2 rounded font-bold bg-gray-200 text-gray-600">
                                Completed
                            </span>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 rounded font-bold text-white bg-red-600 hover:bg-red-700 ml-2"
                            >
                                Delete Ticket
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Time Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Total Ticket Time</h4>
                    <p className="text-2xl font-bold text-gray-900">{formatDuration(totalTicketTime)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Total Repair Time</h4>
                    <p className="text-2xl font-bold text-green-600">{formatDuration(totalRepairTime)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Total Waiting Time</h4>
                    <p className="text-2xl font-bold text-yellow-600">{formatDuration(totalWaitingTime)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 mb-6">
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

                {/* Request Parts */}
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
                                    Request Parts
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Parts List */}
                {ticket.parts.length > 0 && (
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Ordered Parts</h3>
                        </div>
                        <ul className="divide-y divide-gray-200">
                            {ticket.parts.map((part: any) => (
                                <li key={part.id} className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-indigo-600 truncate">{part.name}</p>
                                        <div className="ml-2 flex-shrink-0 flex">
                                            <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${part.status === 'RECEIVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {part.status}
                                            </p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Time Logs */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity & Time Logs</h3>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {ticket.timeLogs.map((log: any) => (
                            <li key={log.id} className="px-4 py-4 sm:px-6">
                                <div className="flex flex-col space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {log.notes || 'Work Session'}
                                        </p>
                                        <div className="ml-2 flex-shrink-0 flex space-x-2">
                                            {log.status && (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                    {log.status}
                                                </span>
                                            )}
                                            <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.type === 'STATUS_CHANGE' ? 'bg-purple-100 text-purple-800' :
                                                log.endTime ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {log.type === 'STATUS_CHANGE' ? 'Event' : (log.endTime ? 'Completed' : 'Active')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Tasks & Work Details */}
                                    {log.tasks && (
                                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                            <strong>Tasks:</strong> {JSON.parse(log.tasks).join(', ')}
                                        </div>
                                    )}
                                    {log.workDetails && (
                                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                            <strong>Details:</strong>
                                            <ul className="list-disc list-inside mt-1">
                                                {Object.entries(JSON.parse(log.workDetails)).map(([task, detail]: any) => (
                                                    <li key={task}>
                                                        <span className="font-medium">{task.replace(/^(mech-|cos-|code-)/, '')}:</span>{' '}
                                                        {typeof detail === 'object' ? (
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

                                    <div className="mt-2 sm:flex sm:justify-between">
                                        <div className="sm:flex">
                                            <p className="flex items-center text-sm text-gray-500">
                                                {new Date(log.startTime).toLocaleString()}
                                                {log.endTime && log.type !== 'STATUS_CHANGE' && ` - ${new Date(log.endTime).toLocaleString()}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Clock Out Inline Form */}
            {isClockOutModalOpen && (
                <div className="bg-white shadow sm:rounded-lg mb-6 border-2 border-red-100">
                    <div className="px-4 py-5 sm:px-6 bg-red-50 border-b border-red-100">
                        <h3 className="text-lg leading-6 font-medium text-red-900">Clock Out & Report</h3>
                        <p className="mt-1 text-sm text-red-700">
                            Please describe what was done and report any new issues found.
                        </p>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                        <div className="space-y-6">
                            {/* Failed Items Resolution */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Inspection Issues to Resolve</h4>
                                <div className="space-y-4">
                                    {failedItems.length === 0 ? (
                                        <p className="text-sm text-gray-500 italic">No failed items from inspection.</p>
                                    ) : (
                                        failedItems.map((item) => {
                                            const resolution = itemResolutions[item.id] || { fixed: false, notes: '' };
                                            return (
                                                <div key={item.id} className="bg-gray-50 p-3 rounded border border-gray-200">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{item.category}</span>
                                                            <p className={`font-medium ${item.status === 'Fixed' ? 'text-green-700 line-through' : 'text-gray-900'}`}>{item.item}</p>
                                                            <p className="text-sm text-red-600">{item.issue}</p>
                                                            {item.status === 'Fixed' && <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded">PREVIOUSLY FIXED</span>}
                                                        </div>
                                                        <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-1 rounded border border-gray-300 hover:bg-gray-50">
                                                            <input
                                                                type="checkbox"
                                                                checked={resolution.fixed}
                                                                onChange={(e) => setItemResolutions({
                                                                    ...itemResolutions,
                                                                    [item.id]: { ...resolution, fixed: e.target.checked }
                                                                })}
                                                                className="rounded text-green-600 focus:ring-green-500 h-4 w-4"
                                                            />
                                                            <span className="text-sm font-medium text-gray-700">Fixed?</span>
                                                        </label>
                                                    </div>
                                                    <textarea
                                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                                        rows={2}
                                                        placeholder="Describe work done..."
                                                        value={resolution.notes}
                                                        onChange={(e) => setItemResolutions({
                                                            ...itemResolutions,
                                                            [item.id]: { ...resolution, notes: e.target.value }
                                                        })}
                                                    />
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* New Issues */}
                            <div className="border-t border-gray-200 pt-6">
                                <div className="flex items-center mb-4">
                                    <input
                                        id="new-issues-inline"
                                        type="checkbox"
                                        checked={foundNewIssues}
                                        onChange={(e) => setFoundNewIssues(e.target.checked)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="new-issues-inline" className="ml-2 block text-sm font-bold text-gray-900">
                                        Found New Issues?
                                    </label>
                                </div>

                                {foundNewIssues && (
                                    <div className="bg-red-50 p-4 rounded-md space-y-4 border border-red-200">
                                        {/* List of added issues */}
                                        {newIssues.length > 0 && (
                                            <div className="space-y-4 mb-4">
                                                {newIssues.map((issue, index) => (
                                                    <div key={index} className="bg-white p-3 rounded border border-red-100">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <p className="font-bold text-sm text-red-800">{issue.item}</p>
                                                                <p className="text-xs text-gray-600">{issue.notes}</p>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <label className="flex items-center space-x-2 cursor-pointer bg-white px-2 py-1 rounded border border-gray-300 hover:bg-gray-50">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={issue.fixed}
                                                                        onChange={(e) => {
                                                                            const updated = [...newIssues];
                                                                            updated[index].fixed = e.target.checked;
                                                                            setNewIssues(updated);
                                                                        }}
                                                                        className="rounded text-green-600 focus:ring-green-500 h-4 w-4"
                                                                    />
                                                                    <span className="text-xs font-medium text-gray-700">Fixed?</span>
                                                                </label>
                                                                <button
                                                                    onClick={() => handleRemoveNewIssue(index)}
                                                                    className="text-red-500 hover:text-red-700 text-xs"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {issue.fixed && (
                                                            <textarea
                                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border mt-2"
                                                                rows={2}
                                                                placeholder="Describe work done..."
                                                                value={issue.resolutionNotes}
                                                                onChange={(e) => {
                                                                    const updated = [...newIssues];
                                                                    updated[index].resolutionNotes = e.target.value;
                                                                    setNewIssues(updated);
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Add New Issue Form */}
                                        <div className="bg-white p-3 rounded border border-red-100">
                                            <div className="mb-2">
                                                <label className="block text-xs font-medium text-red-800 mb-1">Component / Item</label>
                                                <select
                                                    className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                                    value={currentNewIssue.item}
                                                    onChange={(e) => setCurrentNewIssue({ ...currentNewIssue, item: e.target.value })}
                                                >
                                                    <option value="">Select a component...</option>
                                                    <optgroup label="Mechanical">
                                                        {MECHANICAL_COMPONENTS.map(item => (
                                                            <option key={item} value={item}>{item}</option>
                                                        ))}
                                                    </optgroup>
                                                    <optgroup label="Cosmetic">
                                                        {COSMETIC_COMPONENTS.map(item => (
                                                            <option key={item} value={item}>{item}</option>
                                                        ))}
                                                    </optgroup>
                                                </select>
                                            </div>
                                            <div className="mb-2">
                                                <label className="block text-xs font-medium text-red-800 mb-1">Notes / Diagnosis</label>
                                                <textarea
                                                    className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                                    rows={2}
                                                    placeholder="Describe the issue found..."
                                                    value={currentNewIssue.notes}
                                                    onChange={(e) => setCurrentNewIssue({ ...currentNewIssue, notes: e.target.value })}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleAddNewIssue}
                                                disabled={!currentNewIssue.item}
                                                className="w-full inline-flex justify-center items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                            >
                                                Add Issue to List
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 rounded-b-lg flex justify-end space-x-3">
                        <button
                            onClick={() => setIsClockOutModalOpen(false)}
                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleClockOutConfirm}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            Confirm Clock Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
