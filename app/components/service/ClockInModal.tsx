'use client';

import { useState } from 'react';

interface ClockInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onClockIn: (selectedTasks: string[]) => void;
    inspectionItems: any[]; // Items from the inspection checklist
}

export default function ClockInModal({ isOpen, onClose, onClockIn, inspectionItems }: ClockInModalProps) {
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

    if (!isOpen) return null;

    const handleTaskToggle = (task: string) => {
        setSelectedTasks(prev =>
            prev.includes(task)
                ? prev.filter(t => t !== task)
                : [...prev, task]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onClockIn(selectedTasks);
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
                                        Clock In - Select Tasks
                                    </h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500 mb-4">
                                            Select the inspection items you will be working on during this session.
                                        </p>
                                        <div className="max-h-60 overflow-y-auto border rounded-md p-2">
                                            {inspectionItems.length === 0 ? (
                                                <p className="text-sm text-gray-400 italic p-2">No inspection items found.</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {inspectionItems.map((item, idx) => {
                                                        const label = typeof item === 'string' ? item : item.name || 'Unknown Item';
                                                        return (
                                                            <label key={idx} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                                    checked={selectedTasks.includes(label)}
                                                                    onChange={() => handleTaskToggle(label)}
                                                                />
                                                                <span className="text-sm text-gray-700">{label}</span>
                                                            </label>
                                                        );
                                                    })}
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
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                                Clock In
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
