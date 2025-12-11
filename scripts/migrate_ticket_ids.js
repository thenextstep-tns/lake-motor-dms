
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateTickets() {
    console.log('Starting Ticket ID Migration (JS version)...');

    const tickets = await prisma.serviceTicket.findMany({
        where: { markedForDeletion: false },
        include: {
            vehicle: true,
            parts: true,
            timeLogs: true,
        },
        orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${tickets.length} tickets to process.`);

    const vehicleCounts = {};

    for (const ticket of tickets) {
        const vin = ticket.vehicleVin;
        // Check for stockNumber safely
        let stock = ticket.vehicle && ticket.vehicle.stockNumber ? ticket.vehicle.stockNumber : vin.slice(-6);
        const type = ticket.type === 'DETAILING' ? 'D' : 'S';

        const key = `${vin}-${type}`;
        if (!vehicleCounts[key]) vehicleCounts[key] = 0;
        vehicleCounts[key]++;

        const count = vehicleCounts[key];
        const newId = `${type}-${stock}-${count}`;

        if (ticket.id === newId) {
            console.log(`Ticket ${ticket.id} already matches convention. Skipping.`);
            continue;
        }

        console.log(`Migrating Ticket ${ticket.id} -> ${newId}`);

        try {
            await prisma.$transaction(async (tx) => {
                // Strict copy
                await tx.serviceTicket.create({
                    data: {
                        id: newId,
                        description: ticket.description,
                        status: ticket.status,
                        vehicleVin: ticket.vehicleVin,
                        techId: ticket.techId,
                        repairProcess: ticket.repairProcess,
                        repairDifficulty: ticket.repairDifficulty,
                        type: ticket.type,
                        priority: ticket.priority,
                        tags: ticket.tags,
                        inspectionId: ticket.inspectionId,
                        companyId: ticket.companyId,
                        lotId: ticket.lotId,
                        markedForDeletion: ticket.markedForDeletion,
                        deletedAt: ticket.deletedAt,
                        deletedBy: ticket.deletedBy,
                        createdAt: ticket.createdAt,
                        updatedAt: ticket.updatedAt
                    }
                });

                // Update Relations
                await tx.part.updateMany({
                    where: { ticketId: ticket.id },
                    data: { ticketId: newId }
                });

                await tx.timeLog.updateMany({
                    where: { ticketId: ticket.id },
                    data: { ticketId: newId }
                });

                // Delete Old
                await tx.serviceTicket.delete({
                    where: { id: ticket.id }
                });
            });
            console.log(`Success: ${ticket.id} -> ${newId}`);
        } catch (error) {
            console.error(`Failed to migrate ticket ${ticket.id}:`, error);
        }
    }

    console.log('Migration Complete.');
}

migrateTickets()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
