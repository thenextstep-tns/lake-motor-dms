
'use client';

import { useState } from 'react';
import { createServiceTicket } from '@/app/actions/service';

interface DetailingRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    vin: string;
    stockNumber?: string | null;
}

export default function DetailingRequestModal({ isOpen, onClose, vin, stockNumber }: DetailingRequestModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        priority: 'Normal',
        difficulty: 'Quick'
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createServiceTicket({
                vehicleVin: vin,
                type: 'DETAILING',
                priority: formData.priority,
                repairDifficulty: formData.difficulty,
                description: formData.description || 'Manual Detailing Request',
                stockNumber: stockNumber // Optional/Extra context if needed by action
            });
            onClose();
            // Optional: Trigger refresh or toast
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert('Failed to create detailing request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900">
                        Request Detailing
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <span className="sr-only">Close</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Issue / Request Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                            rows={3}
                            placeholder="Describe what needs to be done..."
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Priority
                            </label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value="Low">Low</option>
                                <option value="Normal">Normal</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Difficulty/Size
                            </label>
                            <select
                                value={formData.difficulty}
                                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value="Quick">Quick</option>
                                <option value="Medium">Medium</option>
                                <option value="Difficult">Difficult</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 mr-3"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
