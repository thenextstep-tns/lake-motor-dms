'use server';

import { auth } from '@/lib/auth'; // Ensure this path is correct
import { prisma } from '@/lib/prisma';
import { PermissionService } from '@/app/services/PermissionService';
import { ActionType, ResourceType } from '@/app/domain/constants';
import { revalidatePath } from 'next/cache';

async function getAdminContext() {
    const session = await auth();
    // Simplified checker, real app should be robust
    if (!session?.user?.id || !session.user.companyId) throw new Error("Unauthorized");

    // Construct minimal context checks
    const user = {
        id: session.user.id,
        companyId: session.user.companyId,
        permissions: session.user.permissions
    };

    // Check if user is Admin or Owner (manage:all)
    PermissionService.require(user, ActionType.Manage, 'all');

    return user;
}

export async function getRolesAndPermissions() {
    const user = await getAdminContext();

    const [roles, permissions] = await Promise.all([
        prisma.role.findMany({
            where: { companyId: user.companyId },
            include: { permissions: { include: { permission: true } } }
        }),
        prisma.permission.findMany()
    ]);

    return { roles, permissions };
}

export async function toggleRolePermission(roleId: string, permissionId: string, enable: boolean) {
    const user = await getAdminContext();

    // Verify scope of role
    const role = await prisma.role.findFirst({
        where: { id: roleId, companyId: user.companyId }
    });
    if (!role) throw new Error("Role not found");

    if (enable) {
        await prisma.rolePermission.create({
            data: {
                roleId,
                permissionId
            }
        }).catch(() => { }); // Ignore Duplicate
    } else {
        await prisma.rolePermission.deleteMany({
            where: {
                roleId,
                permissionId
            }
        });
    }

    revalidatePath('/settings');
}

export async function getCompanyUsers() {
    const user = await getAdminContext();

    return prisma.user.findMany({
        where: {
            memberships: {
                some: { companyId: user.companyId }
            }
        },
        include: {
            memberships: {
                where: { companyId: user.companyId },
                include: {
                    roles: true,
                    accessibleLots: true
                }
            }
        }
    });
}

export async function updateUserRoles(targetUserId: string, roleIds: string[]) {
    const admin = await getAdminContext();

    // 1. Find the membership
    const membership = await prisma.companyMember.findUnique({
        where: {
            userId_companyId: {
                userId: targetUserId,
                companyId: admin.companyId!
            }
        }
    });

    if (!membership) throw new Error("User is not a member of this company");

    // 2. Verified roles belong to company (or are system)
    const validRoles = await prisma.role.findMany({
        where: {
            OR: [
                { companyId: admin.companyId },
                { isSystem: true }
            ],
            id: { in: roleIds }
        }
    });

    if (validRoles.length !== roleIds.length) throw new Error("Invalid Role ID provided");

    // 3. Update
    await prisma.companyMember.update({
        where: { id: membership.id },
        data: {
            roles: {
                set: roleIds.map(id => ({ id }))
            }
        }
    });

    revalidatePath('/settings/users');
}

export async function updateUserLots(targetUserId: string, lotIds: string[]) {
    const admin = await getAdminContext();

    const membership = await prisma.companyMember.findUnique({
        where: {
            userId_companyId: {
                userId: targetUserId,
                companyId: admin.companyId!
            }
        }
    });

    if (!membership) throw new Error("User is not a member of this company");

    // Verify lots belong to company
    const validLots = await prisma.lot.findMany({
        where: {
            companyId: admin.companyId,
            id: { in: lotIds }
        }
    });

    if (validLots.length !== lotIds.length) throw new Error("Invalid Lot ID provided");

    await prisma.companyMember.update({
        where: { id: membership.id },
        data: {
            accessibleLots: {
                set: lotIds.map(id => ({ id }))
            }
        }
    });

    revalidatePath('/settings/users');
}

export async function getAccessibleLots() {
    const user = await getAdminContext();
    return prisma.lot.findMany({
        where: { companyId: user.companyId },
        orderBy: { name: 'asc' },
        select: { id: true, name: true }
    });
}
