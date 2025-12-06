'use client';

import { useState } from 'react';
import { toggleRolePermission } from '@/app/actions/settings'; // You'll need to export this
import { useRouter } from 'next/navigation';

type Props = {
    roles: any[];
    permissions: any[];
};

export default function RightsEditorClient({ roles, permissions }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);

    // Group Permissions by Resource
    const permissionsByResource = permissions.reduce((acc, perm) => {
        if (!acc[perm.resource]) acc[perm.resource] = [];
        acc[perm.resource].push(perm);
        return acc;
    }, {} as Record<string, typeof permissions>);

    const handleToggle = async (roleId: string, permId: string, currentVal: boolean) => {
        const key = `${roleId}-${permId}`;
        setLoading(key);
        try {
            await toggleRolePermission(roleId, permId, !currentVal);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Failed to update permission");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Rights Editor</h2>

            <table className="w-full text-sm text-left">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="p-4 font-semibold text-gray-600 sticky left-0 bg-gray-50 z-10">Resource / Action</th>
                        {roles.map(role => (
                            <th key={role.id} className="p-4 font-semibold text-gray-800 text-center min-w-[100px]">
                                {role.name}
                                {role.isSystem && <span className="block text-[10px] text-gray-400 font-normal">System</span>}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {Object.entries(permissionsByResource).map(([resource, perms]) => (
                        <>
                            <tr key={resource} className="bg-blue-50/50">
                                <td colSpan={roles.length + 1} className="p-3 font-bold text-blue-800 uppercase tracking-wider text-xs sticky left-0 z-10">
                                    {resource}
                                </td>
                            </tr>
                            {perms.map(perm => (
                                <tr key={perm.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-3 pl-6 text-gray-600 font-medium sticky left-0 bg-white z-10 border-r border-gray-100">
                                        {perm.action}
                                    </td>
                                    {roles.map(role => {
                                        const hasPerm = role.permissions.some((rp: any) => rp.permissionId === perm.id);
                                        const isSystemAdmin = role.name === 'System Admin'; // Hardcoded safety
                                        const isLoading = loading === `${role.id}-${perm.id}`;

                                        return (
                                            <td key={`${role.id}-${perm.id}`} className="p-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    disabled={isSystemAdmin || isLoading}
                                                    checked={hasPerm}
                                                    onChange={() => handleToggle(role.id, perm.id, hasPerm)}
                                                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                                                />
                                                {isLoading && <span className="ml-2 text-xs text-gray-400">...</span>}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
