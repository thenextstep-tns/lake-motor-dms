'use server';

import { prisma } from '@/lib/prisma';
import { ServiceTicket, TimeLog, Part, Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// --- Tickets ---
export async function createServiceTicket(data: Prisma.ServiceTicketCreateInput) {
    const ticket = await prisma.serviceTicket.create({ data });
    revalidatePath('/service');
    return ticket;
}

export async function getServiceTickets() {
    return await prisma.serviceTicket.findMany({
        include: {
            vehicle: true,
            tech: true,
            parts: true,
        },
        orderBy: { updatedAt: 'desc' },
    });
}

export async function updateTicketStatus(id: string, status: string) {
    await prisma.serviceTicket.update({
        where: { id },
        data: { status },
    });
    revalidatePath('/service');
}

// --- Time Tracking ---
export async function clockIn(ticketId: string, userId: string) {
    // Check if user is already clocked in elsewhere?
    // For MVP, just create a new log
    await prisma.timeLog.create({
        data: {
            ticketId,
            userId,
            startTime: new Date(),
            type: 'PRODUCTIVE',
        },
    });
    revalidatePath(`/service/${ticketId}`);
}

export async function clockOut(userId: string) {
    // Find open log for user
    const openLog = await prisma.timeLog.findFirst({
        where: {
            userId,
            endTime: null,
        },
    });

    if (openLog) {
        await prisma.timeLog.update({
            where: { id: openLog.id },
            data: { endTime: new Date() },
        });
    }
    revalidatePath('/service');
}

// --- Parts ---
export async function addPart(data: Prisma.PartCreateInput) {
    await prisma.part.create({ data });
    revalidatePath('/service');
}
