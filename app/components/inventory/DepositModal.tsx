'use client';

import { useState } from 'react';
import { addDeposit } from '@/app/actions/deposit';

interface DepositModalProps {
    vehicle: any;
    isOpen: boolean;
    onClose: () => void;
}

export default function DepositModal({ vehicle, isOpen, onClose }: DepositModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        buyerName: '',
        amount: '',
        method: 'Credit Card',
        date: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await addDeposit({
                vehicleVin: vehicle.vin,
                buyerName: formData.buyerName,
                amount: parseFloat(formData.amount),
                method: formData.method,
                date: new Date(formData.date),
                expiryDate: new Date(formData.expiryDate),
                notes: formData.notes
            });

            if (result.success) {
                onClose();
                // Ideally show success toast
            } else {
                alert('Failed to add deposit');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] rounded-lg w-full max-w-md border border-gray-800 shadow-xl">
                <div className="p-6 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white">Add Deposit</h2>
                    <p className="text-sm text-gray-400 mt-1">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Client Name</label>
                        <input
                            type="text"
                            required
                            value={formData.buyerName}
                            onChange={e => setFormData({ ...formData, buyerName: e.target.value })}
                            className="w-full bg-[#262626] border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-[#262626] border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Expiration</label>
                            <input
                                type="date"
                                required
                                value={formData.expiryDate}
                                onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                                className="w-full bg-[#262626] border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Amount ($)</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full bg-[#262626] border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Method</label>
                            <select
                                value={formData.method}
                                onChange={e => setFormData({ ...formData, method: e.target.value })}
                                className="w-full bg-[#262626] border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                            >
                                <option value="Credit Card">Credit Card</option>
                                <option value="Cash">Cash</option>
                                <option value="Zelle">Zelle</option>
                                <option value="Helcim">Helcim</option>
                                <option value="Wire">Wire</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Notes</label>
                        <textarea
                            rows={3}
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full bg-[#262626] border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-medium transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Add Deposit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
