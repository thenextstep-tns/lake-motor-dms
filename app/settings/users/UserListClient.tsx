'use client';

import { useState } from 'react';
import { updateUserRoles } from '@/app/actions/settings';
import MemberProfileModal from '../company/MemberProfileModal';
import { useRouter } from 'next/navigation';

type Props = {
    users: any[];
    availableRoles: any[];
    availableLots: any[];
};

export default function UserListClient({ users, availableRoles, availableLots }: Props) {
    const router = useRouter();
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [profileUser, setProfileUser] = useState<string | null>(null);
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [selectedLots, setSelectedLots] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const startEdit = (user: any) => {
        setEditingUser(user.id);
        const currentRoles = user.roles.map((r: any) => r.id) || [];
        const currentLots = user.accessibleLots.map((l: any) => l.id) || [];
        setSelectedRoles(currentRoles);
        setSelectedLots(currentLots);
    };

    const handleSave = async () => {
        if (!editingUser) return;
        setLoading(true);
        try {
            await updateUserRoles(editingUser, selectedRoles);
            await import('@/app/actions/settings').then(mod => mod.updateUserLots(editingUser, selectedLots));
            setEditingUser(null);
            router.refresh();
        } catch (e) {
            alert("Failed to update roles");
        } finally {
            setLoading(false);
        }
    };

    const toggleRole = (roleId: string) => {
        if (selectedRoles.includes(roleId)) {
            setSelectedRoles(selectedRoles.filter(id => id !== roleId));
        } else {
            setSelectedRoles([...selectedRoles, roleId]);
        }
    };

    const toggleLot = (lotId: string) => {
        if (selectedLots.includes(lotId)) {
            setSelectedLots(selectedLots.filter(id => id !== lotId));
        } else {
            setSelectedLots([...selectedLots, lotId]);
        }
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Users & Roles</h2>

            <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 font-semibold">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Roles</th>
                            <th className="p-4">Accessible Lots</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(user => {
                            const isEditing = editingUser === user.id;
                            // Flattened data usage
                            const displayRoles = user.roles.map((r: any) => r.name).join(', ') || 'No Role';

                            return (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-medium text-gray-900">{user.name || 'Unknown'}</td>
                                    <td className="p-4 text-gray-500">{user.email}</td>
                                    <td className="p-4">
                                        {isEditing ? (
                                            <div className="flex flex-wrap gap-2">
                                                {availableRoles.map(role => (
                                                    <button
                                                        key={role.id}
                                                        onClick={() => toggleRole(role.id)}
                                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selectedRoles.includes(role.id)
                                                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                                                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                                                            }`}
                                                    >
                                                        {role.name}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {displayRoles}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {isEditing ? (
                                            <div className="flex flex-wrap gap-2">
                                                {availableLots.map(lot => (
                                                    <button
                                                        key={lot.id}
                                                        onClick={() => toggleLot(lot.id)}
                                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selectedLots.includes(lot.id)
                                                            ? 'bg-orange-100 text-orange-700 border-orange-200'
                                                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                                                            }`}
                                                    >
                                                        {lot.name}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap gap-1">
                                                {user.accessibleLots?.length > 0 ? user.accessibleLots.map((l: any) => (
                                                    <span key={l.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                        {l.name}
                                                    </span>
                                                )) : <span className="text-gray-400 text-xs italic">None</span>}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        {isEditing ? (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setEditingUser(null)}
                                                    disabled={loading}
                                                    className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-800"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleSave}
                                                    disabled={loading}
                                                    className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                                >
                                                    {loading ? 'Saving...' : 'Save'}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setProfileUser(user.id)}
                                                    className="text-gray-600 hover:text-gray-900 text-xs font-medium"
                                                >
                                                    Manage Profile
                                                </button>
                                                <button
                                                    onClick={() => startEdit(user)}
                                                    className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                                >
                                                    Edit Roles
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {profileUser && (
                <MemberProfileModal
                    userId={profileUser}
                    availableLots={availableLots}
                    onClose={() => setProfileUser(null)}
                />
            )}
        </div>
    );
}
