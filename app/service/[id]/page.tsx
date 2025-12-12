import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ServiceTicketClient from './ServiceTicketClient';
import { serialize } from '@/lib/utils';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ServiceTicketPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const userRoles = session?.user?.roles?.map((r: any) => r.name) || [];

    const rawTicket = await prisma.serviceTicket.findUnique({
        where: { id },
        include: {
            vehicle: true,
            parts: true,
            timeLogs: {
                orderBy: { startTime: 'desc' },
                take: 20,
            },
            inspection: {
                include: {
                    codes: true
                }
            }
        },
    });

    if (!rawTicket) notFound();

    const ticket = serialize(rawTicket);

    const isClockedIn = ticket.timeLogs.length > 0 && !ticket.timeLogs[0].endTime;
    const isCompleted = ticket.status === 'Completed';

    // Parse active tasks if clocked in
    let activeTasks: string[] = [];
    if (isClockedIn && ticket.timeLogs[0].tasks) {
        try {
            activeTasks = JSON.parse(ticket.timeLogs[0].tasks);
        } catch (e) {
            console.error("Failed to parse tasks", e);
        }
    }

    // Prepare structured failed items for Clock Out
    const failedItems: { id: string, category: string, item: string, issue: string, status: string }[] = [];

    if (ticket.inspection) {
        if (ticket.inspection.needsMechanicalRecon && ticket.inspection.mechanicalReconData) {
            try {
                const mechData = JSON.parse(ticket.inspection.mechanicalReconData);
                Object.entries(mechData).forEach(([item, details]: [string, any]) => {
                    const status = typeof details === 'string' ? details : details.status;
                    const notes = typeof details === 'string' ? '' : details.notes;

                    if (status === 'Fail' || status === 'Attention') {
                        failedItems.push({
                            id: `mech-${item}`,
                            category: 'Mechanical',
                            item,
                            issue: notes || status,
                            status
                        });
                    }
                });
            } catch (e) { }
        }
        if (ticket.inspection.needsCosmeticRecon && ticket.inspection.cosmeticReconData) {
            try {
                const cosData = JSON.parse(ticket.inspection.cosmeticReconData);
                Object.entries(cosData).forEach(([item, details]: [string, any]) => {
                    const status = typeof details === 'string' ? details : details.status;
                    const notes = typeof details === 'string' ? '' : details.notes;

                    if (status === 'Fail' || status === 'Attention') {
                        failedItems.push({
                            id: `cos-${item}`,
                            category: 'Cosmetic',
                            item,
                            issue: notes || status,
                            status
                        });
                    }
                });
            } catch (e) { }
        }
        ticket.inspection.codes.forEach(code => {
            failedItems.push({
                id: `code-${code.code}`,
                category: 'Diagnostic Code',
                item: code.code,
                issue: code.description || '',
                status: 'Fail'
            });
        });
    }

    // Legacy inspectionItems for backward compatibility if needed (or just map from failedItems)
    const inspectionItems = failedItems.map(i => `[${i.category}] ${i.item}: ${i.issue}`);

    return (
        <ServiceTicketClient
            ticket={ticket}
            isClockedIn={isClockedIn}
            isCompleted={isCompleted}
            activeTasks={activeTasks}
            inspectionItems={inspectionItems}
            failedItems={failedItems}
            userRoles={userRoles}
        />
    );
}
