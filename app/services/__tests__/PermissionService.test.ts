import { describe, it, expect } from 'vitest';
import { PermissionService, UserContext } from '../PermissionService';
import { ActionType, ResourceType } from '../../domain/constants';

describe('PermissionService', () => {
    const mockUser: UserContext = {
        id: 'user-1',
        companyId: 'comp-1',
        permissions: [
            'read:Vehicle',
            'create:Ticket'
        ]
    };

    const adminUser: UserContext = {
        id: 'admin-1',
        permissions: ['manage:all']
    };

    const managerUser: UserContext = {
        id: 'manager-1',
        permissions: ['manage:Vehicle']
    };

    it('should allow if user has exact permission', () => {
        expect(PermissionService.check(mockUser, 'read', 'Vehicle')).toBe(true);
    });

    it('should deny if user does not have permission', () => {
        expect(PermissionService.check(mockUser, 'delete', 'Vehicle')).toBe(false);
    });

    it('should allow admin (manage:all) to do anything', () => {
        expect(PermissionService.check(adminUser, 'delete', 'Vehicle')).toBe(true);
        expect(PermissionService.check(adminUser, 'create', 'Refinery')).toBe(true);
    });

    it('should allow resource manager (manage:Vehicle) any action on that resource', () => {
        expect(PermissionService.check(managerUser, 'delete', 'Vehicle')).toBe(true);
        expect(PermissionService.check(managerUser, 'create', 'Vehicle')).toBe(true);
        // But not other resources
        expect(PermissionService.check(managerUser, 'delete', 'Ticket')).toBe(false);
    });

    it('should throw on require failure', () => {
        expect(() => PermissionService.require(mockUser, 'delete', 'Vehicle')).toThrow('Permission Denied');
    });
});
