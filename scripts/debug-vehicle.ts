
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const vin = 'JTHBL5EF4E5130060';

    console.log(`Checking Vehicle: ${vin}`);

    const vehicle = await prisma.vehicle.findUnique({
        where: { vin },
        select: {
            vin: true,
            vehicleCaption: true,
            googleDriveUrl: true,
            walkaroundVideo: true,
            testDriveVideo: true,
            updatedAt: true
        }
    });

    console.log('--- Current DB State ---');
    console.log(JSON.stringify(vehicle, null, 2));

    const history = await prisma.vehicleHistory.findMany({
        where: { vehicleId: vin },
        orderBy: { timestamp: 'desc' },
        take: 20
    });

    console.log('\n--- Recent History (Last 20) ---');
    history.forEach(h => {
        console.log(`[${h.timestamp.toISOString()}] ${h.field}: "${h.oldValue}" -> "${h.newValue}" (User: ${h.userName})`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
