import { prisma } from '../lib/prisma';
import {
    UserRoleType,
    ResourceType,
    ActionType,
    DEFAULT_ROLES
} from '../app/domain/constants';

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Create Default Company
    const company = await prisma.company.create({
        data: {
            name: 'Lake Motor DMS',
        },
    });
    console.log(`Created Company: ${company.name} (${company.id})`);

    // 2. Create Default Lot
    const lot = await prisma.lot.create({
        data: {
            name: 'Main Location',
            companyId: company.id,
            address: '123 Dealer Lane',
        },
    });
    console.log(`Created Lot: ${lot.name} (${lot.id})`);

    // 3. Define Permissions
    // This is a simplified matrix for the seed. Can be expanded via UI later.
    const permissionsData = [
        // Admin & Owner (Manage Everything)
        { action: ActionType.Manage, resource: 'all' },

        // Vehicles
        { action: ActionType.Create, resource: ResourceType.Vehicle },
        { action: ActionType.Read, resource: ResourceType.Vehicle },
        { action: ActionType.Update, resource: ResourceType.Vehicle },
        { action: ActionType.Delete, resource: ResourceType.Vehicle }, // Soft delete usually

        // Tickets
        { action: ActionType.Create, resource: ResourceType.ServiceTicket },
        { action: ActionType.Read, resource: ResourceType.ServiceTicket },
        { action: ActionType.Update, resource: ResourceType.ServiceTicket },
        { action: ActionType.Delete, resource: ResourceType.ServiceTicket },
    ];

    const permissionMap = new Map<string, string>(); // key -> id

    for (const p of permissionsData) {
        const perm = await prisma.permission.upsert({
            where: {
                action_resource: {
                    action: p.action,
                    resource: p.resource,
                },
            },
            update: {},
            create: {
                action: p.action,
                resource: p.resource,
            },
        });
        permissionMap.set(`${p.action}:${p.resource}`, perm.id);
    }

    // 4. Create Roles and Assign Permissions

    // System Admin (God Mode)
    await createRole(company.id, UserRoleType.SystemAdmin, [
        `${ActionType.Manage}:all`
    ], permissionMap);

    // Company Owner (God Mode within Company)
    await createRole(company.id, UserRoleType.CompanyOwner, [
        `${ActionType.Manage}:all`
    ], permissionMap);

    // Location Manager (Can do most things, but maybe strict on deletions in future)
    await createRole(company.id, UserRoleType.LocationManager, [
        `${ActionType.Create}:${ResourceType.Vehicle}`,
        `${ActionType.Read}:${ResourceType.Vehicle}`,
        `${ActionType.Update}:${ResourceType.Vehicle}`,
        `${ActionType.Delete}:${ResourceType.Vehicle}`,
        `${ActionType.Create}:${ResourceType.ServiceTicket}`,
        `${ActionType.Read}:${ResourceType.ServiceTicket}`,
        `${ActionType.Update}:${ResourceType.ServiceTicket}`,
        `${ActionType.Delete}:${ResourceType.ServiceTicket}`,
    ], permissionMap);

    // Sales Manager (Vehicles: All, Tickets: Read)
    await createRole(company.id, UserRoleType.SalesManager, [
        `${ActionType.Create}:${ResourceType.Vehicle}`,
        `${ActionType.Read}:${ResourceType.Vehicle}`,
        `${ActionType.Update}:${ResourceType.Vehicle}`,
        `${ActionType.Read}:${ResourceType.ServiceTicket}`,
    ], permissionMap);

    // Technician (Tickets: Read/Update, Vehicles: Read)
    await createRole(company.id, UserRoleType.Technician, [
        `${ActionType.Read}:${ResourceType.Vehicle}`,
        `${ActionType.Read}:${ResourceType.ServiceTicket}`,
        `${ActionType.Update}:${ResourceType.ServiceTicket}`,
    ], permissionMap);

    console.log('✅ Seed completed successfully!');
}

async function createRole(
    companyId: string,
    roleType: UserRoleType,
    permissionKeys: string[],
    permissionMap: Map<string, string>
) {
    const role = await prisma.role.create({
        data: {
            name: DEFAULT_ROLES[roleType],
            companyId: companyId,
            isSystem: roleType === UserRoleType.SystemAdmin,
            permissions: {
                create: permissionKeys.map(key => {
                    const permId = permissionMap.get(key);
                    if (!permId) {
                        // Fallback or skip if permission doesn't exist in our map (shouldn't happen)
                        return undefined;
                    }
                    return {
                        permission: { connect: { id: permId } }
                    };
                }).filter(Boolean) as any // Cast to avoid TS complexity in seed
            }
        }
    });
    console.log(`Created Role: ${role.name}`);
    return role;
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
