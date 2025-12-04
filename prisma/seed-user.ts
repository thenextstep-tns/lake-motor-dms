import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const mockUserId = 'mock-tech-id';

    const existingUser = await prisma.user.findUnique({
        where: { id: mockUserId },
    });

    if (!existingUser) {
        await prisma.user.create({
            data: {
                id: mockUserId,
                email: 'tech@example.com',
                name: 'Mock Technician',
                role: 'TECHNICIAN', // Assuming role enum exists, or string
                // Add other required fields if any
            },
        });
        console.log(`Created mock user with ID: ${mockUserId}`);
    } else {
        console.log(`Mock user with ID: ${mockUserId} already exists.`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
