import { getCompanyUsers, getRolesAndPermissions, getAccessibleLots } from '@/app/actions/settings';
import UserListClient from './UserListClient';

export default async function UsersPage() {
    try {
        const [users, { roles }, lots] = await Promise.all([
            getCompanyUsers(),
            getRolesAndPermissions(),
            getAccessibleLots()
        ]);

        return <UserListClient users={users} availableRoles={roles} availableLots={lots} />;
    } catch (error) {
        return (
            <div className="p-8 text-center text-red-500">
                <h2 className="text-xl font-bold mb-2">Access Denied</h2>
                <p>You do not have permission to view this page.</p>
            </div>
        );
    }
}
