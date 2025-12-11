
import { prisma } from '../lib/prisma';
import { ActionType, ResourceType, UserRoleType } from '../app/domain/constants';

async function main() {
    console.log("Seeding Detailer Role...");

    let company = await prisma.company.findFirst({
        where: { name: "Lake Motor DMS" }
    });

    if (!company) {
        console.warn("Specific company not found, using first available...");
        company = await prisma.company.findFirst();
    }

    if (!company) {
        console.error("No company found at all. Seed the DB first.");
        return;
    }

    const roleName = UserRoleType.Detailer;

    // Create or Update Role
    let role = await prisma.role.findFirst({
        where: { companyId: company.id, name: roleName }
    });

    if (!role) {
        role = await prisma.role.create({
            data: {
                companyId: company.id,
                name: roleName,
                description: "Access to Detailing Dashboard and basic functions"
            }
        });
        console.log("Created Detailer Role");
    } else {
        console.log("Detailer Role exists");
    }

    // Define Permissions
    const permissions = [
        { action: ActionType.Read, resource: ResourceType.ServiceTicket },
        { action: ActionType.Update, resource: ResourceType.ServiceTicket },
        { action: ActionType.Read, resource: ResourceType.Vehicle },
        // Add others if needed
    ];

    for (const p of permissions) {
        // Find OR Create permission
        let permDef = await prisma.permission.findFirst({
            where: { action: p.action, resource: p.resource }
        });

        if (!permDef) {
            console.log(`Creating permission ${p.action}:${p.resource}`);
            permDef = await prisma.permission.create({
                data: {
                    action: p.action,
                    resource: p.resource,
                    description: `Auto-generated permission`
                }
            })
        }

        // Assign to Role
        const exists = await prisma.rolePermission.findUnique({
            where: {
                roleId_permissionId: {
                    roleId: role.id,
                    permissionId: permDef.id
                }
            }
        });

        if (!exists) {
            await prisma.rolePermission.create({
                data: {
                    roleId: role.id,
                    permissionId: permDef.id
                }
            });
            console.log(`Assigned ${p.action}:${p.resource} to Detailer`);
        }
    }

    console.log("Done.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
