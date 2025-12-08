import { getCompanyUsers, getRolesAndPermissions, getAccessibleLots } from '@/app/actions/settings';

import UserListClient from './UserListClient';
import InviteUserForm from '@/app/admin/users/InviteUserForm';
import { prisma } from "@/lib/prisma";

export default async function UsersPage() {
    try {
        const [users, { roles }, lots, companies] = await Promise.all([
            getCompanyUsers(),
            getRolesAndPermissions(),

            getAccessibleLots(),
            prisma.company.findMany({ select: { id: true, name: true } })
        ]);

        return (
            <div>
                <div className="flex justify-end mb-4">
                    <InviteUserForm companies={companies} />
                </div>
                <UserListClient users={users} availableRoles={roles} availableLots={lots} />
            </div>
        );
    } catch (error) {
        return (
            <div className="p-8 text-center text-red-500">
                <h2 className="text-xl font-bold mb-2">Access Denied</h2>
                <p>You do not have permission to view this page.</p>
            </div>
        );
    }
}
