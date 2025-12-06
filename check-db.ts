
import { prisma } from './lib/prisma';

async function main() {
    console.log('--- Checking DB ---');
    const users = await prisma.user.findMany({
        include: {
            memberships: {
                include: {
                    roles: true,
                    company: true,
                    lot: true
                }
            }
        }
    });
    console.log('Users:', JSON.stringify(users, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
