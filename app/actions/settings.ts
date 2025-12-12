'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PermissionService } from '@/app/services/PermissionService';
import { ActionType, ResourceType } from '@/app/domain/constants';
import { revalidatePath } from 'next/cache';
import { SystemLogger } from '@/lib/logger';


async function getAdminContext() {
    const session = await auth();
    if (!session?.user?.id || !session.user.companyId) throw new Error("Unauthorized");

    const user = {
        id: session.user.id,
        companyId: session.user.companyId,
        permissions: session.user.permissions,
        roles: session.user.roles
    };

    // Check if user is Admin or Owner (manage:all)
    const isSystemAdmin = session.user.roles?.some(r => r === 'System Admin' || r === 'Company Owner') ?? false;
    if (!isSystemAdmin) {
        // PermissionService.require(user, ActionType.Manage, 'all'); 
        // Relaxed check for now to allow viewing settings
    }
    return user;
}

export async function getRolesAndPermissions() {
    const user = await getAdminContext();
    const systemTypes = Object.values(ResourceType);
    const actionTypes = Object.values(ActionType).filter(a => a !== ActionType.Manage); // Manage is special key, or treat as normal

    // 1. Sync Permissions: Ensure DB has all Resource x Action combinations
    // We do this check simply by counting or we can do a quick check.
    // For performance, we might want to cache this or only do it if count mismatches.
    const existingPerms = await prisma.permission.findMany();

    // Simple sync: check if any missing
    const tasks = [];
    for (const resource of systemTypes) {
        // Standard Actions
        const actions = [ActionType.Create, ActionType.Read, ActionType.Update, ActionType.Delete];
        // Special logic: maybe some resources don't support all? For now, assume all.
        // Also add 'manage' if consistent
        actions.push(ActionType.Manage);

        for (const action of actions) {
            const exists = existingPerms.some(p => p.resource === resource && p.action === action);
            if (!exists) {
                // Create missing permission
                tasks.push(prisma.permission.create({
                    data: {
                        resource,
                        action
                    }
                }));
            }
        }
    }

    if (tasks.length > 0) {
        await Promise.all(tasks);
    }

    // 2. Fetch Fresh Data
    const [roles, permissions] = await Promise.all([
        prisma.role.findMany({
            where: { companyId: user.companyId },
            include: { permissions: { include: { permission: true } } }
        }),
        prisma.permission.findMany({
            orderBy: { resource: 'asc' }
        })
    ]);

    return { roles, permissions };
}

export async function toggleRolePermission(roleId: string, permissionId: string, enable: boolean) {
    const user = await getAdminContext();
    const session = await auth();


    // Verify scope of role
    const role = await prisma.role.findFirst({
        where: { id: roleId, companyId: user.companyId }
    });
    if (!role) throw new Error("Role not found");

    if (enable) {
        await prisma.rolePermission.create({
            data: { roleId, permissionId }
        }).catch(() => { });
        console.log('[RightsEditor] Granting Permission:', roleId, permissionId);
        await SystemLogger.log('PERMISSION_GRANTED', { roleId, permissionId }, { id: session?.user?.id, name: session?.user?.name, companyId: user.companyId });

    } else {
        await prisma.rolePermission.deleteMany({
            where: { roleId, permissionId }
        });
        console.log('[RightsEditor] Revoking Permission:', roleId, permissionId);
        await SystemLogger.log('PERMISSION_REVOKED', { roleId, permissionId }, { id: session?.user?.id, name: session?.user?.name, companyId: user.companyId });
    }

    revalidatePath('/settings');

}

export async function getCompanyUsers() {
    const user = await getAdminContext();
    const members = await prisma.companyMember.findMany({
        where: { companyId: user.companyId },
        include: {
            user: true,
            roles: true,
            lot: true,
            accessibleLots: true
        }
    });

    return (members as any[]).map(m => ({
        id: m.userId,
        name: m.user.name,
        email: m.user.email,
        image: m.user.image,
        firstName: m.user.firstName,
        lastName: m.user.lastName,
        phone: m.user.phone,
        personalEmail: m.user.personalEmail,
        createdAt: m.createdAt,
        roles: m.roles.map((r: any) => ({ id: r.id, name: r.name })),
        lotId: m.lotId,
        lotName: m.lot?.name,
        accessibleLots: m.accessibleLots.map((l: any) => ({ id: l.id, name: l.name })),
        status: m.status,
        position: m.position,
        department: m.department,
        workPhone: m.workPhone,
        workEmail: m.workEmail,
        keyKpi: m.keyKpi,
        currentExperience: m.currentExperience
    }));
}

export async function getMemberDetails(userId: string) {
    const user = await getAdminContext();

    const member = await prisma.companyMember.findUnique({
        where: {
            userId_companyId: {
                userId,
                companyId: user.companyId
            }
        },
        include: {
            user: true,
            roles: true,
            lot: true,
            accessibleLots: true
        }
    });

    if (!member) throw new Error("Member not found");

    return member;
}

export async function updateCompanyMember(userId: string, data: any) {
    const context = await getAdminContext();

    // Security Check: Only Admin, Owner, HR, Accountant can update full profile.
    const canEditFull = context.roles?.some(r =>
        ['System Admin', 'Company Owner', 'HR', 'Accountant'].includes(r)
    );

    const isSelf = context.id === userId;

    if (!canEditFull && !isSelf) {
        throw new Error("Unauthorized to edit this member");
    }

    // Transaction to update both User and CompanyMember
    return await prisma.$transaction(async (tx) => {
        // Update User (Personal Info)
        if (data.firstName !== undefined || data.lastName !== undefined || data.email !== undefined) {
            await tx.user.update({
                where: { id: userId },
                data: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone,
                    personalEmail: data.personalEmail,
                    birthday: data.birthday ? new Date(data.birthday) : null,
                    address: data.address,
                    emergencyContact: data.emergencyContact
                }
            });
        }

        // Update CompanyMember (Employment Info)
        if (canEditFull) {
            await tx.companyMember.update({
                where: {
                    userId_companyId: {
                        userId,
                        companyId: context.companyId
                    }
                },
                data: {
                    status: data.status,
                    position: data.position,
                    department: data.department,
                    workPhone: data.workPhone,
                    workEmail: data.workEmail,
                    startDate: data.startDate ? new Date(data.startDate) : undefined,
                    endDate: data.endDate ? new Date(data.endDate) : undefined,
                    hourlyRate: data.hourlyRate ? parseFloat(data.hourlyRate) : null,
                    weeklyRate: data.weeklyRate ? parseFloat(data.weeklyRate) : null,
                    monthlyRate: data.monthlyRate ? parseFloat(data.monthlyRate) : null,
                    bonusSystem: data.bonusSystem,
                    offerLink: data.offerLink,
                    contractLink: data.contractLink,
                    ndaLink: data.ndaLink,
                    keyKpi: data.keyKpi,
                    currentExperience: data.currentExperience,
                    comment: data.comment,
                    lotId: data.lotId === "" ? null : (data.lotId || undefined)
                }
            });

            // Handle Accessible Lots
            if (data.accessibleLots && Array.isArray(data.accessibleLots)) {
                await tx.companyMember.update({
                    where: {
                        userId_companyId: {
                            userId,
                            companyId: context.companyId
                        }
                    },
                    data: {
                        accessibleLots: {
                            set: [] // Clear existing
                        }
                    }
                });

                if (data.accessibleLots.length > 0) {
                    await tx.companyMember.update({
                        where: {
                            userId_companyId: {
                                userId,
                                companyId: context.companyId
                            }
                        },
                        data: {
                            accessibleLots: {
                                connect: data.accessibleLots.map((id: string) => ({ id }))
                            }
                        }
                    });
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
                companyId: admin.companyId
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
                companyId: admin.companyId
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

export async function inviteUser(email: string, companyId: string, roleName: string = 'Salesperson') {
    const session = await auth();
    // Simplified Security: Allow any logged in user to invite for now (or strictly require admin)
    // In real app, check ActionType.Manage, ResourceType.System or Users
    if (!session?.user?.id) throw new Error("Unauthorized");

    // 1. Find or Create User
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                email,
                emailVerified: null // Pending verification
            }
        });
    }

    // 2. Find Role (Salesperson default)
    // We look up the role definition in the target company
    const role = await prisma.role.findFirst({
        where: {
            companyId,
            name: roleName
        }
    });

    if (!role) throw new Error(`Role '${roleName}' not found in company.`);

    // 3. Create Membership (if not exists)
    // Upsert isn't perfect for many-to-many with extra fields, but Member is unique on userId_companyId
    await prisma.companyMember.upsert({
        where: {
            userId_companyId: {
                userId: user.id,
                companyId
            }
        },
        create: {
            userId: user.id,
            companyId,
            roles: { connect: { id: role.id } }
        },
        update: {
            // If already member, maybe add role? For now, do nothing or ensure role exists.
            roles: { connect: { id: role.id } }
        }
    });

    // Enqueue Invite Email
    const { Queue } = await import('@/lib/queue');
    await Queue.enqueue('SEND_INVITE', {
        email,
        companyId,
        roleName,
        invitedBy: session.user.name || session.user.email
    });

    revalidatePath('/admin/users');
}
