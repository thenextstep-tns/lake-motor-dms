'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createMarketingLabel, updateMarketingLabel, deleteMarketingLabel } from '@/app/actions/marketing';

interface MarketingLabel {
    id: string;
    name: string;
    colorCode: string;
    companyId: string | null;
}

export default function MarketingLabelClient({ initialLabels, companyId }: { initialLabels: MarketingLabel[], companyId: string }) {
    const router = useRouter();
    const [labels, setLabels] = useState(initialLabels);
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // New Label State
    const [newLabel, setNewLabel] = useState({ name: '', colorCode: '#000000' });

    // Edit State
    const [editForm, setEditForm] = useState({ name: '', colorCode: '' });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await createMarketingLabel(newLabel);
            if (res.success) {
                setNewLabel({ name: '', colorCode: '#000000' });
                router.refresh();
            }
        } catch (error) {
            alert("Failed to create label");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEditing) return;
        setLoading(true);
        try {
            const res = await updateMarketingLabel(isEditing, editForm);
            if (res.success) {
                setIsEditing(null);
                router.refresh();
            }
        } catch (error) {
            alert("Failed to update label");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this label?")) return;
        setLoading(true);
        try {
            await deleteMarketingLabel(id);
            router.refresh();
        } catch (error) {
            alert("Failed to delete label");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (label: MarketingLabel) => {
        setIsEditing(label.id);
        setEditForm({ name: label.name, colorCode: label.colorCode });
    };

    return (
        <div className="space-y-8">
            {/* Create New Label */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Marketing Label</h3>
                <form onSubmit={handleCreate} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Label Name</label>
                        <input
                            type="text"
                            value={newLabel.name}
                            onChange={(e) => setNewLabel({ ...newLabel, name: e.target.value })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            placeholder="e.g. One Owner, Low Miles"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                        <input
                            type="color"
                            value={newLabel.colorCode}
                            onChange={(e) => setNewLabel({ ...newLabel, colorCode: e.target.value })}
                            className="h-9 w-20 rounded border border-gray-300 p-1 cursor-pointer"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 h-9"
                    >
                        {loading ? 'Adding...' : 'Add Label'}
                    </button>
                </form>
            </div>

            {/* List Labels */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Existing Labels</h3>
                    <span className="text-sm text-gray-500">System defaults cannot be edited.</span>
                </div>
                <ul className="divide-y divide-gray-200">
                    {initialLabels.map((label) => (
                        <li key={label.id} className="p-4 hover:bg-gray-50">
                            {isEditing === label.id ? (
                                <form onSubmit={handleUpdate} className="flex gap-4 items-center">
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                        required
                                    />
                                    <input
                                        type="color"
                                        value={editForm.colorCode}
                                        onChange={(e) => setEditForm({ ...editForm, colorCode: e.target.value })}
                                        className="h-9 w-20 rounded border border-gray-300 p-1 cursor-pointer"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="text-green-600 hover:text-green-800 font-medium text-sm"
                                        >
                                            Save
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(null)}
                                            className="text-gray-600 hover:text-gray-800 font-medium text-sm"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-full border border-gray-200 shadow-sm"
                                            style={{ backgroundColor: label.colorCode }}
                                            title={label.colorCode}
                                        ></div>
                                        <div>
                                            <p className="font-medium text-gray-900">{label.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {label.companyId ? 'Custom Label' : 'System Default'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {/* Only allow editing if it belongs to company (has companyId) */}
                                        {label.companyId ? (
                                            <>
                                                <button
                                                    onClick={() => startEdit(label)}
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(label.id)}
                                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        ) : (
                                            <span className="text-gray-400 text-xs italic">Read-only</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                    {initialLabels.length === 0 && (
                        <li className="p-8 text-center text-gray-500">No marketing labels found.</li>
                    )}
                </ul>
            </div>
        </div>
    );
}
