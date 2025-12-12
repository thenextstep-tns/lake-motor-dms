import { ActionType, ResourceType } from "../domain/constants";

export interface UserContext {
    id: string;
    companyId?: string;
    lotId?: string | null;
    permissions?: string[];
    roles?: string[];
    name?: string;
    email?: string;
}

export class PermissionService {
    static check(
        user: UserContext,
        action: ActionType | string,
        resource: ResourceType | string
    ): boolean {
        if (!user.permissions) return false;

        // 1. Check for Global Admin (manage:all)
        if (user.permissions.includes(`${ActionType.Manage}:all`)) return true;

        // 2. Check for Resource Admin (manage:vehicle)
        if (user.permissions.includes(`${ActionType.Manage}:${resource}`)) return true;

        // 3. Check for Dev Mode (localhost bypass)
        if (process.env.NODE_ENV === 'development') return true;

        // 4. Check specific permission
        return user.permissions.includes(`${action}:${resource}`);
    }

    static require(
        user: UserContext,
        action: ActionType | string,
        resource: ResourceType | string
    ) {
        if (!this.check(user, action, resource)) {
            throw new Error(`Permission Denied: Cannot ${action} ${resource}`);
        }
    }
}
