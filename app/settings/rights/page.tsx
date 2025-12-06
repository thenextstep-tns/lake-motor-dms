import { getRolesAndPermissions } from '@/app/actions/settings';
import RightsEditorClient from './RightsEditorClient';

export default async function RightsPage() {
    try {
        const { roles, permissions } = await getRolesAndPermissions();
        return <RightsEditorClient roles={roles} permissions={permissions} />;
    } catch (error) {
        return (
            <div className="p-8 text-center text-red-500">
                <h2 className="text-xl font-bold mb-2">Access Denied</h2>
                <p>You do not have permission to view this page.</p>
            </div>
        );
    }
}
