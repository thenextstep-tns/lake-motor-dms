'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ServiceTicket, Prisma } from '@prisma/client';
import { serialize } from '@/lib/utils';

// --- Service Ticket Actions ---

export async function getServiceTickets() {
    const tickets = await prisma.serviceTicket.findMany({
        include: {
            vehicle: true,
            tech: true,
            parts: true,
            timeLogs: true,
        },
        orderBy: { updatedAt: 'desc' },
    });
    return serialize(tickets);
}

export async function createServiceTicket(data: any) {
    // Basic validation
    if (!data.vehicleVin || !data.description) {
        throw new Error('Missing required fields');
    }

    // Generate meaningful ID: VIN-Timestamp (last 6 of VIN + MMDDHHmm)
    const vinSuffix = data.vehicleVin.slice(-6);
    const now = new Date();
    const timestamp = `${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
    const customId = `${vinSuffix}-${timestamp}`;

    const ticket = await prisma.serviceTicket.create({
        data: {
            id: customId, // Override default CUID
            vehicleVin: data.vehicleVin,
            description: data.description,
            status: 'Queue', // Default
            inspectionId: data.inspectionId || null,
            repairProcess: data.repairProcess || null,
            repairDifficulty: data.repairDifficulty || null,
            techId: data.techId || null,
        },
    });

    // Update Vehicle Status to 'Inspected'
    await prisma.vehicle.update({
        where: { vin: data.vehicleVin },
        data: { status: 'Inspected' }
    });

    revalidatePath('/service');
    revalidatePath('/inventory');
    return ticket;
}

export async function updateServiceTicket(id: string, data: any) {
    const ticket = await prisma.serviceTicket.update({
        where: { id },
        data: {
            description: data.description,
            status: data.status,
            techId: data.techId,
            repairProcess: data.repairProcess,
            repairDifficulty: data.repairDifficulty,
        },
    });

    revalidatePath('/service');
    return ticket;
}

export async function deleteServiceTicket(id: string) {
    await prisma.serviceTicket.delete({
        where: { id },
    });
    revalidatePath('/service');
}

export async function updateTicketStatus(id: string, status: string) {
    await prisma.serviceTicket.update({
        where: { id },
        data: { status },
    });
    revalidatePath('/service');
}

export async function clockIn(ticketId: string, userId: string, selectedTasks: string[] = []) {
    // Get current ticket status
    const ticket = await prisma.serviceTicket.findUnique({
        where: { id: ticketId },
        select: { status: true, vehicleVin: true }
    });

    // Ensure mock user exists (for dev environment)
    if (userId === 'mock-tech-id') {
        const userExists = await prisma.user.findUnique({ where: { id: userId } });
        if (!userExists) {
            await prisma.user.create({
                data: {
                    id: userId,
                    email: 'tech@example.com',
                    name: 'Mock Technician',
                    role: 'TECHNICIAN'
                }
            });
        }
    }

    await prisma.$transaction([
        prisma.timeLog.create({
            data: {
                ticketId,
                userId,
                startTime: new Date(),
                type: 'PRODUCTIVE',
                status: ticket?.status || 'Unknown',
                tasks: selectedTasks.length > 0 ? JSON.stringify(selectedTasks) : null
            }
        }),
        prisma.serviceTicket.update({
            where: { id: ticketId },
            data: { status: 'In Progress' }
        }),
        // Update Vehicle Status to 'In Repair'
        prisma.vehicle.update({
            where: { vin: ticket!.vehicleVin },
            data: { status: 'In Repair' }
        })
    ]);
    revalidatePath(`/service/${ticketId}`);
    revalidatePath('/service');
}

export async function clockOut(
    ticketId: string,
    userId: string,
    resolutions: Record<string, { fixed: boolean, notes: string }> = {},
    newIssues?: { item: string, notes: string, fixed: boolean, resolutionNotes: string }[] | null
) {
    // Ensure mock user exists (for dev environment)
    if (userId === 'mock-tech-id') {
        const userExists = await prisma.user.findUnique({ where: { id: userId } });
        if (!userExists) {
            await prisma.user.create({
                data: {
                    id: userId,
                    email: 'tech@example.com',
                    name: 'Mock Technician',
                    role: 'TECHNICIAN'
                }
            });
        }
    }

    // Find the active time log for this user
    const activeLog = await prisma.timeLog.findFirst({
        where: {
            userId,
            endTime: null
        }
    });

    if (activeLog) {
        if (activeLog.ticketId) {
            const ticket = await prisma.serviceTicket.findUnique({
                where: { id: activeLog.ticketId },
                select: { inspectionId: true, vehicleVin: true }
            });

            if (ticket?.inspectionId) {
                const inspection = await prisma.inspection.findUnique({
                    where: { id: ticket.inspectionId }
                });

                if (inspection) {
                    let mechData: Record<string, any> = {};
                    let cosData: Record<string, any> = {};
                    let codes = inspection.codes || [];

                    try {
                        mechData = JSON.parse(inspection.mechanicalReconData || '{}');
                    } catch (e) { }
                    try {
                        cosData = JSON.parse(inspection.cosmeticReconData || '{}');
                    } catch (e) { }

                    // Process Resolutions
                    let itemsFixedCount = 0;
                    Object.entries(resolutions).forEach(([id, res]) => {
                        if (id.startsWith('mech-')) {
                            const item = id.replace('mech-', '');
                            if (mechData[item]) {
                                mechData[item].notes = (mechData[item].notes ? mechData[item].notes + '\n' : '') + `[Tech]: ${res.notes}`;
                                if (res.fixed) {
                                    mechData[item].status = 'Fixed';
                                    itemsFixedCount++;
                                }
                            }
                        } else if (id.startsWith('cos-')) {
                            const item = id.replace('cos-', '');
                            if (cosData[item]) {
                                cosData[item].notes = (cosData[item].notes ? cosData[item].notes + '\n' : '') + `[Tech]: ${res.notes}`;
                                if (res.fixed) {
                                    cosData[item].status = 'Fixed';
                                    itemsFixedCount++;
                                }
                            }
                        }
                    });

                    // Handle New Issues
                    if (newIssues && newIssues.length > 0) {
                        const COSMETIC_COMPONENTS = ['Paint', 'Body', 'Glass', 'Wheels', 'Interior', 'Upholstery', 'Detailing'];

                        newIssues.forEach(issue => {
                            const isCosmetic = COSMETIC_COMPONENTS.includes(issue.item);
                            const targetData = isCosmetic ? cosData : mechData;

                            // Ensure unique key
                            let key = issue.item;
                            if (targetData[key]) {
                                key = `${issue.item} (New)`;
                            }

                            let notes = `[Reported by Tech]: ${issue.notes}`;
                            if (issue.fixed) {
                                notes += `\n[Tech Fixed]: ${issue.resolutionNotes}`;
                                itemsFixedCount++;
                            }

                            targetData[key] = {
                                status: issue.fixed ? 'Fixed' : 'Fail',
                                notes: notes
                            };
                        });
                    }

                    // Update Inspection
                    await prisma.inspection.update({
                        where: { id: inspection.id },
                        data: {
                            mechanicalReconData: JSON.stringify(mechData),
                            cosmeticReconData: JSON.stringify(cosData)
                        }
                    });

                    // Sync to Ticket
                    await syncInspectionToTicket(inspection.id, ticket.vehicleVin);

                    // Determine Ticket Status
                    // Check if there are any remaining failed items
                    let remainingIssues = 0;
                    const countIssues = (data: Record<string, any>) => {
                        Object.values(data).forEach((val: any) => {
                            const status = typeof val === 'string' ? val : val.status;
                            if (status === 'Fail' || status === 'Attention') {
                                remainingIssues++;
                            }
                        });
                    };
                    countIssues(mechData);
                    countIssues(cosData);

                    // Update ticket status if partially complete
                    if (itemsFixedCount > 0 && remainingIssues > 0) {
                        await prisma.serviceTicket.update({
                            where: { id: activeLog.ticketId },
                            data: { status: 'Partially Complete' }
                        });
                    } else if (itemsFixedCount > 0 && remainingIssues === 0) {
                        // Optional: Auto-complete if everything is fixed? 
                        // User didn't explicitly ask for this, but it might be good.
                        // For now, let's leave it as 'Partially Complete' or 'In Progress' 
                        // and let them manually complete it to be safe, or maybe 'Work Done'?
                        // Let's stick to 'Partially Complete' if it was 'In Progress' and now has no issues?
                        // Actually, if remainingIssues === 0, it's effectively complete but maybe waiting for review.
                        // Let's just handle the "Partially Complete" case requested.
                    }
                }
            }
        }

        await prisma.timeLog.update({
            where: { id: activeLog.id },
            data: {
                endTime: new Date(),
                workDetails: Object.keys(resolutions).length > 0 ? JSON.stringify(resolutions) : null
            }
        });
        if (activeLog.ticketId) {
            revalidatePath(`/service/${activeLog.ticketId}`);
        }
    }
}

export async function completeTicket(ticketId: string, userId: string) {
    // Ensure mock user exists (for dev environment)
    if (userId === 'mock-tech-id') {
        const userExists = await prisma.user.findUnique({ where: { id: userId } });
        if (!userExists) {
            await prisma.user.create({
                data: {
                    id: userId,
                    email: 'tech@example.com',
                    name: 'Mock Technician',
                    role: 'TECHNICIAN'
                }
            });
        }
    }

    // 1. Clock out if currently clocked in on this ticket
    const activeLog = await prisma.timeLog.findFirst({
        where: {
            ticketId,
            userId,
            endTime: null
        }
    });

    if (activeLog) {
        await prisma.timeLog.update({
            where: { id: activeLog.id },
            data: { endTime: new Date() }
        });
    }

    // 2. Update status to Quality Control
    await prisma.serviceTicket.update({
        where: { id: ticketId },
        data: { status: 'Quality Control' }
    });

    revalidatePath(`/service/${ticketId}`);
    revalidatePath('/service');
}

export async function confirmQualityControl(ticketId: string, userId: string) {
    // Ensure mock user exists (for dev environment)
    if (userId === 'mock-tech-id') {
        const userExists = await prisma.user.findUnique({ where: { id: userId } });
        if (!userExists) {
            await prisma.user.create({
                data: {
                    id: userId,
                    email: 'tech@example.com',
                    name: 'Mock Technician',
                    role: 'TECHNICIAN'
                }
            });
        }
    }

    const ticket = await prisma.serviceTicket.findUnique({
        where: { id: ticketId },
        select: { vehicleVin: true }
    });

    if (!ticket) throw new Error('Ticket not found');

    // 1. Update Ticket to Completed
    await prisma.serviceTicket.update({
        where: { id: ticketId },
        data: { status: 'Completed' }
    });

    // 2. Update Vehicle to Repaired
    await prisma.vehicle.update({
        where: { vin: ticket.vehicleVin },
        data: { status: 'Repaired' }
    });

    // 3. Log the QC Pass
    await prisma.timeLog.create({
        data: {
            ticketId,
            userId,
            startTime: new Date(),
            endTime: new Date(),
            type: 'STATUS_CHANGE',
            notes: 'Quality Control Passed - Vehicle Repaired'
        }
    });

    revalidatePath(`/service/${ticketId}`);
    revalidatePath('/service');
}

export async function requestParts(ticketId: string, partsDescription: string) {
    // Create a generic part record or just update status?
    // User asked to "order parts describing what parts are needed".
    // We'll create a Part record with the description.

    // Get ticket to find VIN
    const ticket = await prisma.serviceTicket.findUnique({
        where: { id: ticketId },
        select: { vehicleVin: true }
    });

    await prisma.$transaction([
        prisma.part.create({
            data: {
                ticketId,
                name: partsDescription, // Using name for description for now
                status: 'ORDERED',
                cost: 0
            }
        }),
        prisma.serviceTicket.update({
            where: { id: ticketId },
            data: { status: 'Waiting Parts' }
        }),
        // Log the status change
        prisma.timeLog.create({
            data: {
                ticketId,
                // Since userId is required in schema, we need a valid ID. 
                userId: (await prisma.user.findFirst())?.id || 'system',
                startTime: new Date(),
                endTime: new Date(), // Instantaneous event
                type: 'STATUS_CHANGE',
                notes: `Requested Parts: ${partsDescription}`
            }
        }),
        // Update Vehicle Status to 'In Repair'
        ...(ticket ? [prisma.vehicle.update({
            where: { vin: ticket.vehicleVin },
            data: { status: 'In Repair' }
        })] : [])
    ]);

    revalidatePath(`/service/${ticketId}`);
    revalidatePath('/service');
}

export async function confirmPartsReceived(ticketId: string, userId: string) {
    // Ensure mock user exists (for dev environment)
    if (userId === 'mock-tech-id') {
        const userExists = await prisma.user.findUnique({ where: { id: userId } });
        if (!userExists) {
            await prisma.user.create({
                data: {
                    id: userId,
                    email: 'tech@example.com',
                    name: 'Mock Technician',
                    role: 'TECHNICIAN'
                }
            });
        }
    }

    // Get ticket to find VIN
    const ticket = await prisma.serviceTicket.findUnique({
        where: { id: ticketId },
        select: { vehicleVin: true }
    });

    await prisma.$transaction([
        prisma.part.updateMany({
            where: { ticketId, status: 'ORDERED' },
            data: { status: 'RECEIVED' }
        }),
        prisma.serviceTicket.update({
            where: { id: ticketId },
            data: { status: 'In Progress' }
        }),
        prisma.timeLog.create({
            data: {
                ticketId,
                userId,
                startTime: new Date(),
                endTime: new Date(),
                type: 'STATUS_CHANGE',
                notes: 'Parts Received - Resuming Work'
            }
        }),
        // Update Vehicle Status to 'In Repair'
        ...(ticket ? [prisma.vehicle.update({
            where: { vin: ticket.vehicleVin },
            data: { status: 'In Repair' }
        })] : [])
    ]);

    revalidatePath(`/service/${ticketId}`);
    revalidatePath('/service');
}

export async function getVehicleServiceHistory(vin: string) {
    const tickets = await prisma.serviceTicket.findMany({
        where: {
            vehicleVin: vin
        },
        include: {
            tech: true
        },
        orderBy: { updatedAt: 'desc' }
    });
    return serialize(tickets);
}

export async function syncInspectionToTicket(inspectionId: string, vehicleVin: string) {
    // 1. Fetch Inspection Details
    const inspection = await prisma.inspection.findUnique({
        where: { id: inspectionId },
        include: { codes: true }
    });

    if (!inspection) return;

    // 2. Parse Failed Items
    const failedItems: string[] = [];

    const parseRecon = (dataStr: string | null) => {
        if (!dataStr) return;
        try {
            const data = JSON.parse(dataStr);
            Object.entries(data).forEach(([item, details]: [string, any]) => {
                if (details.status === 'Fail' || details.status === 'Attention') {
                    failedItems.push(`${item} (${details.status}): ${details.notes || ''}`);
                }
            });
        } catch (e) {
            console.error('Error parsing recon data', e);
        }
    };

    parseRecon(inspection.mechanicalReconData);
    parseRecon(inspection.cosmeticReconData);

    // 3. Add Diagnostic Codes
    if (inspection.codes && inspection.codes.length > 0) {
        failedItems.push('Diagnostic Codes:');
        inspection.codes.forEach(code => {
            failedItems.push(`${code.code} - ${code.description || ''}`);
        });
    }

    if (failedItems.length === 0) return; // Nothing to fix

    const description = `Inspection Report ${new Date().toLocaleDateString()}:\n` + failedItems.join('\n');

    // 4. Find Latest Ticket for this Inspection
    const existingTicket = await prisma.serviceTicket.findFirst({
        where: { inspectionId },
        orderBy: { createdAt: 'desc' }
    });

    // 5. Update or Create Logic
    if (existingTicket && existingTicket.status !== 'Completed') {
        // Update existing ticket (Queue, In Progress, Waiting Parts, etc.)
        // We append the new description to the old one or replace it?
        // User said "update the same service ticket". Replacing description seems appropriate for an inspection update.
        // But we should be careful not to lose manual edits. 
        // For now, let's replace it as the inspection is the source of truth for the "work needed".
        await prisma.serviceTicket.update({
            where: { id: existingTicket.id },
            data: { description }
        });

        // Update Vehicle Status to 'Inspected' if ticket is in Queue
        if (existingTicket.status === 'Queue') {
            await prisma.vehicle.update({
                where: { vin: vehicleVin },
                data: { status: 'Inspected' }
            });
        }
    } else {
        // Create NEW ticket only if no active ticket exists
        // Generate ID
        const vinSuffix = vehicleVin.slice(-6);
        const now = new Date();
        const timestamp = `${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
        const customId = `${vinSuffix}-${timestamp}`;

        await prisma.serviceTicket.create({
            data: {
                id: customId,
                vehicleVin,
                description,
                status: 'Queue',
                inspectionId,
            }
        });

        // Update Vehicle Status to 'Inspected'
        await prisma.vehicle.update({
            where: { vin: vehicleVin },
            data: { status: 'Inspected' }
        });
    }

    revalidatePath('/service');
    revalidatePath('/inventory');
}
