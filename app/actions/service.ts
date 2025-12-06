'use server';

import { auth } from '@/lib/auth';
import { TicketService } from '@/app/services/TicketService';
import { revalidatePath } from 'next/cache';
import { serialize } from '@/lib/utils';
import { UserContext } from '@/app/services/PermissionService';

async function getUserContext(): Promise<UserContext> {
    const session = await auth();
    console.log('getUserContext Session:', JSON.stringify(session, null, 2));
    if (!session?.user?.id || !session.user.companyId) {
        console.error('Unauthorized Access Attempt:', { userId: session?.user?.id, companyId: session?.user?.companyId });
        throw new Error("Unauthorized");
    }
    return {
        id: session.user.id,
        companyId: session.user.companyId,
        lotId: session.user.lotId,
        permissions: session.user.permissions,
        roles: session.user.roles
    };
}

export async function getServiceTickets() {
    const user = await getUserContext();
    const tickets = await TicketService.getAll(user);
    return serialize(tickets);
}

export async function getVehicleServiceHistory(vin: string) {
    const user = await getUserContext();
    const tickets = await TicketService.getByVin(user, vin);
    return serialize(tickets);
}

export async function createServiceTicket(data: any) {
    const user = await getUserContext();
    const ticket = await TicketService.create(user, data);
    revalidatePath('/service');
    return ticket;
}

export async function updateServiceTicket(id: string, data: any) {
    const user = await getUserContext();
    const ticket = await TicketService.update(user, id, data);
    revalidatePath('/service');
    return ticket;
}

export async function deleteServiceTicket(id: string) {
    const user = await getUserContext();
    await TicketService.delete(user, id);
    revalidatePath('/service');
}

export async function clockIn(ticketId: string, selectedTasks: string[] = []) {
    const user = await getUserContext();
    await TicketService.clockIn(user, ticketId, selectedTasks);
    revalidatePath(`/service/${ticketId}`);
    revalidatePath('/service');
}

export async function clockOut(ticketId: string, resolutions: Record<string, any>, newIssues: any[], generalNotes?: string) {
    try {
        const user = await getUserContext();
        await TicketService.clockOut(user, ticketId, resolutions, newIssues, generalNotes);
        revalidatePath(`/service/${ticketId}`);
        revalidatePath('/service');
        return { success: true };
    } catch (error) {
        console.error("Clock Out Error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

export async function completeTicket(ticketId: string, _mockUserId?: string) {
    try {
        const user = await getUserContext();
        await TicketService.complete(user, ticketId);
        revalidatePath(`/service/${ticketId}`);
        revalidatePath('/service');
        return { success: true };
    } catch (error) {
        console.error("Complete Ticket Error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

export async function requestParts(ticketId: string, description: string) {
    const user = await getUserContext();
    await TicketService.requestParts(user, ticketId, description);
    revalidatePath(`/service/${ticketId}`);
    revalidatePath('/service');
}

export async function confirmPartsReceived(ticketId: string, _mockUserId?: string) {
    const user = await getUserContext();
    await TicketService.confirmParts(user, ticketId);
    revalidatePath(`/service/${ticketId}`);
    revalidatePath('/service');
}

export async function syncInspectionToTicket(inspectionId: string, vin: string) {
    const user = await getUserContext();
    await TicketService.syncInspection(user, inspectionId, vin);
    revalidatePath('/service');
}

