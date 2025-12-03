import { User } from '@prisma/client';

export enum Role {
  ADMIN = 'ADMIN',
  SALES = 'SALES',
  SERVICE = 'SERVICE',
  TECH = 'TECH',
}

export const ROLES_HIERARCHY = {
  [Role.ADMIN]: [Role.ADMIN, Role.SALES, Role.SERVICE, Role.TECH],
  [Role.SALES]: [Role.SALES],
  [Role.SERVICE]: [Role.SERVICE, Role.TECH],
  [Role.TECH]: [Role.TECH],
};

export function hasPermission(userRole: string, requiredRole: Role): boolean {
  const allowedRoles = ROLES_HIERARCHY[userRole as Role] || [];
  return allowedRoles.includes(requiredRole);
}

export async function checkPermission(user: User | null, requiredRole: Role) {
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  if (!hasPermission(user.role, requiredRole)) {
    throw new Error('Forbidden: Insufficient permissions');
  }
}
