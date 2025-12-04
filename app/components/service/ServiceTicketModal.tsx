'use client';

import { useState, useEffect } from 'react';
import { updateServiceTicket, updateTicketStatus } from '@/app/actions/service';

export default function ServiceTicketModal({ ticket, isOpen, onClose }: { ticket: any, isOpen: boolean, onClose: () => void }) {
    const [formData, setFormData] = useState({
        status: '',
        description: '',
        repairProcess: '',
        repairDifficulty: '',
        techId: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (ticket) {
            setFormData({
                status: ticket.status,
                description: ticket.description,
                repairProcess: ticket.repairProcess || '',
                repairDifficulty: ticket.repairDifficulty || '',
                techId: ticket.techId || ''
            });
        }
    }, [ticket]);

    if (!isOpen || !ticket) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateServiceTicket(ticket.id, formData);
            onClose();
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert('Failed to update ticket');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900">
                        Service Ticket #{ticket.id.slice(-6)}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Vehicle Info */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-bold text-gray-800 mb-2">Vehicle Information</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500 block">Vehicle</span>
                                <span className="font-medium">{ticket.vehicle.year} {ticket.vehicle.make} {ticket.vehicle.model}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block">VIN</span>
                                <span className="font-medium font-mono">{ticket.vehicleVin}</span>
                            </div>
                        </div>
                    </div>

                    {/* Status & Assignment */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                {['Queue', 'Assigned', 'Waiting_Parts', 'In_Progress', 'Quality_Control', 'Completed'].map(status => (
                                    <option key={status} value={status}>{status.replace('_', ' ')}</option>
                                ))}
                            </select>
                        </div>
                        {/* Tech assignment could go here if we had a list of users */}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Issue Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    {/* Repair Details */}
                    <div className="border-t border-gray-200 pt-6">
                        <h4 className="font-bold text-gray-800 mb-4">Repair Details</h4>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Repair Difficulty</label>
                            <select
                                value={formData.repairDifficulty}
                                onChange={(e) => setFormData({ ...formData, repairDifficulty: e.target.value })}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value="">Select Difficulty</option>
                                <option value="Quick">Quick Fix</option>
                                <option value="Medium">Medium</option>
                                <option value="Difficult">Difficult</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Repair Process / Notes</label>
                            <textarea
                                value={formData.repairProcess}
                                onChange={(e) => setFormData({ ...formData, repairProcess: e.target.value })}
                                rows={4}
                                placeholder="Describe the work done..."
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-200">
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
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
