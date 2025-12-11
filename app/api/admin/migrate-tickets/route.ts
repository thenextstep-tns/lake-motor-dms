
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Use lib/prisma to reuse instance

export async function GET() {
    try {
        console.log('Starting Ticket ID Migration (API Route)...');

        const tickets = await prisma.serviceTicket.findMany({
            where: { markedForDeletion: false },
            include: {
                vehicle: true,
            },
            orderBy: { createdAt: 'asc' }
        });

        console.log(`Found ${tickets.length} tickets to process.`);

        let migratedCount = 0;
        const vehicleCounts: Record<string, number> = {};

        for (const ticket of tickets) {
            const vin = ticket.vehicleVin;
            const stock = ticket.vehicle.stockNumber || vin.slice(-6); // Fallback
            const typeVar = ticket.type || 'RECON';
            const typeChar = (typeVar === 'DETAILING') ? 'D' : 'S';

            const key = `${vin}-${typeChar}`;
            if (!vehicleCounts[key]) vehicleCounts[key] = 0;
            vehicleCounts[key]++;

            const count = vehicleCounts[key];
            const newId = `${typeChar}-${stock}-${count}`;

            // Check if already matches format roughly (simplification)
            if (ticket.id === newId) {
                continue;
            }

            console.log(`Migrating ${ticket.id} -> ${newId}`);

            // Transactional Move
            await prisma.$transaction(async (tx) => {
                // 1. Create Copy
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
                        createdAt: ticket.createdAt, // Preserve
                        updatedAt: ticket.updatedAt  // Preserve
                    }
                });

                // 2. Move Relations
                await tx.part.updateMany({
                    where: { ticketId: ticket.id },
                    data: { ticketId: newId }
                });

                await tx.timeLog.updateMany({
                    where: { ticketId: ticket.id },
                    data: { ticketId: newId }
                });

                // 3. Delete Old
                await tx.serviceTicket.delete({
                    where: { id: ticket.id }
                });
            });
            migratedCount++;
        }

        return NextResponse.json({ success: true, migrated: migratedCount, total: tickets.length });

    } catch (error) {
        console.error("Migration Failed:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
