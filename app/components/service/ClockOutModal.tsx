'use client';

import { useState } from 'react';

interface ClockOutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onClockOut: (workDetails: Record<string, string>, newIssue?: { item: string, notes: string }) => void;
    activeTasks: string[]; // Tasks selected during Clock In
}

export default function ClockOutModal({ isOpen, onClose, onClockOut, activeTasks }: ClockOutModalProps) {
    const [workDetails, setWorkDetails] = useState<Record<string, string>>({});
    const [foundNewIssues, setFoundNewIssues] = useState(false);
    const [newIssue, setNewIssue] = useState({ item: '', notes: '' });

    if (!isOpen) return null;

    const handleDetailChange = (task: string, detail: string) => {
        setWorkDetails(prev => ({
            ...prev,
            [task]: detail
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onClockOut(workDetails, foundNewIssues ? newIssue : undefined);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div className="sm:flex sm:items-start">
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                        Clock Out - Work Details
                                    </h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500 mb-4">
                                            Briefly describe what was done for each task.
                                        </p>
                                        <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-4 mb-4">
                                            {activeTasks.length === 0 ? (
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-700">General Work</label>
                                                    <textarea
                                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                                        rows={2}
                                                        placeholder="Describe work done..."
                                                        onChange={(e) => handleDetailChange('General', e.target.value)}
                                                    />
                                                </div>
                                            ) : (
                                                activeTasks.map((task, idx) => (
                                                    <div key={idx} className="space-y-1">
                                                        <label className="block text-sm font-medium text-gray-700">{task}</label>
                                                        <textarea
                                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                                            rows={2}
                                                            placeholder={`Work done on ${task}...`}
                                                            onChange={(e) => handleDetailChange(task, e.target.value)}
                                                        />
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        {/* New Issues Section */}
                                        <div className="border-t pt-4">
                                            <div className="flex items-center mb-2">
                                                <input
                                                    id="new-issues"
                                                    type="checkbox"
                                                    checked={foundNewIssues}
                                                    onChange={(e) => setFoundNewIssues(e.target.checked)}
                                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="new-issues" className="ml-2 block text-sm text-gray-900 font-bold">
                                                    Found New Issues?
                                                </label>
                                            </div>

                                            {foundNewIssues && (
                                                <div className="bg-red-50 p-3 rounded-md space-y-3 border border-red-100">
                                                    <div>
                                                        <label className="block text-xs font-medium text-red-700">Issue / Item Name</label>
                                                        <input
                                                            type="text"
                                                            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-1"
                                                            placeholder="e.g. Leaking Water Pump"
                                                            value={newIssue.item}
                                                            onChange={(e) => setNewIssue({ ...newIssue, item: e.target.value })}
                                                            required={foundNewIssues}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-red-700">Notes / Diagnosis</label>
                                                        <textarea
                                                            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-1"
                                                            rows={2}
                                                            placeholder="Describe the issue found..."
                                                            value={newIssue.notes}
                                                            onChange={(e) => setNewIssue({ ...newIssue, notes: e.target.value })}
                                                            required={foundNewIssues}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button
                                type="submit"
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                                Clock Out & Report
                            </button>
                            <button
                                type="button"
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
