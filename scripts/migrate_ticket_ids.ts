
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateTickets() {
    console.log('Starting Ticket ID Migration...');

    const tickets = await prisma.serviceTicket.findMany({
        where: { markedForDeletion: false },
        include: {
            vehicle: true,
            parts: true,
            timeLogs: true,
        },
        orderBy: { createdAt: 'asc' } // Process oldest first to assign -1, -2 correctly
    });

    console.log(`Found ${tickets.length} tickets to process.`);

    const vehicleCounts: Record<string, number> = {};

    for (const ticket of tickets) {
        const vin = ticket.vehicleVin;
        const stock = ticket.vehicle.stockNumber || vin.slice(-6); // Fallback to last 6 of VIN
        const type = ticket.type === 'DETAILING' ? 'D' : 'S';

        // Initialize counter for this specific vehicle and type combination ?? 
        // User request: "enumerator of the tickets of this type for this vehicle"
        // So we need separate counts for S and D per vehicle.
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

        // 1. Create NEW Ticket
        // We must use 'create' but allow setting ID manually. Prisma allows this if @default(cuid()) is set but we provide a value.
        // We use $transaction to ensure atomicity for this single move.

        try {
            await prisma.$transaction(async (tx) => {
                // strict copy of data
                const newTicket = await tx.serviceTicket.create({
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
                        createdAt: ticket.createdAt, // CRITICAL: Preserve Date
                        updatedAt: ticket.updatedAt  // CRITICAL: Preserve Date
                    }
                });

                // 2. Move Relations
                // Update Parts
                await tx.part.updateMany({
                    where: { ticketId: ticket.id },
                    data: { ticketId: newId }
                });

                // Update TimeLogs
                await tx.timeLog.updateMany({
                    where: { ticketId: ticket.id },
                    data: { ticketId: newId }
                });

                // 3. Delete Old Ticket
                // We use delete (hard delete) because we moved everything. 
                // Alternatively we could mark as deleted, but that leaves clutter with old IDs.
                // Since we created a perfect copy, hard delete is creating a clean state.
                await tx.serviceTicket.delete({
                    where: { id: ticket.id }
                });
            });
            console.log(`Success: ${ticket.id} -> ${newId}`);
        } catch (error) {
            console.error(`Failed to migrate ticket ${ticket.id}:`, error);
            // Don't break the loop, try next ones? Or stop? 
            // Better to stop and investigate.
            throw error;
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
