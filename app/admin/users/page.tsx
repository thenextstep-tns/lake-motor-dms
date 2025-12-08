
import { prisma } from "@/lib/prisma";
import InviteUserForm from "./InviteUserForm";

export default async function AdminUsersPage() {
    const users = await prisma.user.findMany({
        include: {
            memberships: {
                include: { company: true, roles: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const companies = await prisma.company.findMany({ select: { id: true, name: true } });

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">System Users</h1>
                <InviteUserForm companies={companies} />
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company / Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        {user.image && <img className="h-8 w-8 rounded-full mr-3" src={user.image} alt="" />}
                                        <div className="text-sm font-medium text-gray-900">{user.name || 'Unknown'}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.memberships.map(m => (
                                        <div key={m.companyId}>
                                            <span className="font-semibold">{m.company.name}</span>
                                            <span className="text-xs ml-1 text-gray-400">
                                                ({m.roles.map(r => r.name).join(', ')})
                                            </span>
                                        </div>
                                    ))}
                                    {user.memberships.length === 0 && <span className="text-yellow-600">Orphaned</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.createdAt.toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-red-600 hover:text-red-900">Revoke</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
