
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const companies = await prisma.company.findMany();

    const rolesToEnsure = [
        { name: 'System Admin', isSystem: true, description: 'Full access to everything' },
        { name: 'Company Owner', isSystem: false, description: 'Full access to company' },
        { name: 'Sales Manager', isSystem: false, description: 'Manage sales team and inventory' },
        { name: 'Salesperson', isSystem: false, description: 'Sell vehicles' },
        { name: 'Inventory Manager', isSystem: false, description: 'Manage vehicle inventory' },
        { name: 'Service Manager', isSystem: false, description: 'Manage service department' },
        { name: 'Technician', isSystem: false, description: 'Perform service work' },
        { name: 'Location Manager', isSystem: false, description: 'Manage specific lot' },
        { name: 'HR', isSystem: false, description: 'Human Resources' },
        { name: 'Accountant', isSystem: false, description: 'Financial management' },
    ];

    console.log(`Checking roles for ${companies.length} companies...`);

    for (const company of companies) {
        console.log(`Processing company: ${company.name} (${company.id})`);

        for (const roleDef of rolesToEnsure) {
            const exists = await prisma.role.findFirst({
                where: {
                    companyId: company.id,
                    name: roleDef.name
                }
            });

            if (!exists) {
                console.log(`Creating missing role: ${roleDef.name}`);
                await prisma.role.create({
                    data: {
                        name: roleDef.name,
                        description: roleDef.description,
                        isSystem: roleDef.isSystem,
                        companyId: company.id
                    }
                });
            }
        }
    }
    console.log('Role verification complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
