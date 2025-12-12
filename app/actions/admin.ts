'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SystemLogger } from '@/lib/logger';


export async function getSystemEvents(limit = 100) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // In a real app, verify admin role here
    // const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    // if (!user.roles.includes('ADMIN')) throw new Error("Forbidden");

    try {
        const events = await prisma.systemEvent.findMany({
            take: limit,
            orderBy: { timestamp: 'desc' },
            include: {
                // If we want to join relations later
            }
        });
        return { success: true, data: events };
    } catch (error) {
        console.error("Failed to fetch system events", error);
        return { success: false, error: String(error) };
    }
}

export async function getDeletedEntities() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        const [vehicles, tickets, inspections] = await Promise.all([
            prisma.vehicle.findMany({
                where: { markedForDeletion: true },
                select: { vin: true, year: true, make: true, model: true, deletedAt: true, deletedBy: true }
            }),
            prisma.serviceTicket.findMany({
                where: { markedForDeletion: true },
                select: { id: true, description: true, status: true, deletedAt: true, deletedBy: true, vehicleVin: true }
            }),
            prisma.inspection.findMany({
                where: { markedForDeletion: true },
                select: { id: true, name: true, date: true, deletedAt: true, deletedBy: true, vehicleVin: true }
            })
        ]);

        return {
            success: true,
            data: {
                vehicles: vehicles.map(v => ({ ...v, type: 'vehicle', id: v.vin, label: `${v.year} ${v.make} ${v.model}` })),
                tickets: tickets.map(t => ({ ...t, type: 'ticket', label: `Ticket #${t.id} - ${t.description}` })),
                inspections: inspections.map(i => ({ ...i, type: 'inspection', label: `Inspection - ${i.name}` }))
            }
        };
    } catch (error) {
        console.error("Failed to fetch deleted entities", error);
        return { success: false, error: String(error) };
    }
}

export async function restoreEntity(id: string, type: 'vehicle' | 'ticket' | 'inspection') {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        if (type === 'vehicle') {
            await prisma.vehicle.update({ where: { vin: id }, data: { markedForDeletion: false, deletedAt: null, deletedBy: null } });
        } else if (type === 'ticket') {
            await prisma.serviceTicket.update({ where: { id }, data: { markedForDeletion: false, deletedAt: null, deletedBy: null } });
        } else if (type === 'inspection') {
            await prisma.inspection.update({ where: { id }, data: { markedForDeletion: false, deletedAt: null, deletedBy: null } });
        }

        await SystemLogger.log('ENTITY_RESTORED', { id, type }, { id: session.user.id });
        return { success: true };

    } catch (error) {
        return { success: false, error: String(error) };
    }
}

export async function permanentlyDeleteEntity(id: string, type: 'vehicle' | 'ticket' | 'inspection') {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        if (type === 'vehicle') {
            await prisma.vehicle.delete({ where: { vin: id } });
        } else if (type === 'ticket') {
            await prisma.serviceTicket.delete({ where: { id } });
        } else if (type === 'inspection') {
            await prisma.inspection.delete({ where: { id } });
        }

        await SystemLogger.log('ENTITY_PERMANENTLY_DELETED', { id, type }, { id: session.user.id });
        return { success: true };

    } catch (error) {
        return { success: false, error: String(error) };
    }
}
